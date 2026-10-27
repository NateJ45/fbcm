// Safe to edit by hand
// =============================================================================
// The Studio kit's settings for First Baptist Church Muncie
// =============================================================================
// The ONE site-specific file for the kit in src/sanity/kit/ (which names no
// site and stays byte-identical to the starter). Everything the church office
// reads in Home, the Checkup, Quick update and the tour that is about THIS
// church lives here. Detail: docs/agent/studio-kit.md.
//
// The repo is public: no email addresses or other private contacts here. The
// help address comes from PUBLIC_STUDIO_HELP_EMAIL at build time (unset means
// the Ask card shows its words without an email button).
//
// Honest placeholders (2026-10-18): giving, forms, the calendar and prayer
// requests move to Church Trac when the church has set it up, so nothing here
// pretends they work in the Studio. "Publish automatically at" waits on a
// GitHub secret (docs/PENDING.md), so Home's Coming up card is off until then.
// =============================================================================

import type { KitConfig } from './kit/types';
import { genericRules, itemsOf, plural, type CheckupRule } from '../lib/studio-checkup';
import { guides, GUIDE_CATEGORIES, GUIDE_FOR_FIELD, GUIDES_FOR_TYPE } from './guides/content';
import { makeGuideView } from './components/GuideView';
import { envVal } from './urls';
import { BellIcon } from '@sanity/icons/Bell';
import { CalendarIcon } from '@sanity/icons/Calendar';
import { ClockIcon } from '@sanity/icons/Clock';
import { EditIcon } from '@sanity/icons/Edit';
import { DocumentPdfIcon } from '@sanity/icons/DocumentPdf';
import { comingSunday } from '../lib/studio-kit';
import {
  buildNewsPost,
  buildNotice,
  buildSermonPreview,
  NOTICE_MAX,
  POST_SUMMARY_MAX,
  POST_TITLE_MAX,
  postSlug,
} from '../lib/quick-updates';
import { slugify } from '../lib/slugify';
import { QUICK_JOBS } from './quick-jobs';
import { TOURS, WELCOME, WHATS_NEW } from './studio-tours';
import { BookIcon } from '@sanity/icons/Book';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import type { SanityClient } from 'sanity';
import { runPageCheck } from './actions/checkPage';
import { PAGE_BUILDER_TYPES } from './pageBuilderConfig';
import type { PageRules } from '../lib/page-guardrails';

// The UI face the Studio's banner eyebrow and button use (loaded by studioHomeBanner.css).
const SOFIA = "'Sofia Sans Semi Condensed Variable', system-ui, sans-serif";

const PUBLISHED = '!(_id in path("drafts.**"))';

/** Is a post's web address already used? Then the phone forms add the date to it. */
async function slugTaken(client: SanityClient, title: string, now: Date): Promise<boolean> {
  const slug = postSlug(title, now.toISOString().slice(0, 10));
  const n = await client.fetch<number>(
    'count(*[_type == "journalEntry" && slug.current == $slug])',
    { slug },
  );
  return n > 0;
}

/**
 * Page types with a Google description (seoDescription). Not journalEntry: a
 * post's summary stands in when its own search box is empty, and 142 imported
 * posts would bury the pages that matter.
 */
const SEO_TYPES = ['homePage', 'journalPage', 'privacyPage', 'page'];

/** Site rule: a banner still switched on after its end date. */
const expiredNotices: CheckupRule = {
  id: 'expired-notices',
  run: ({ published, now, nameOf }) => {
    const old = published.filter(
      (d) =>
        d._type === 'announcement' &&
        d.enabled === true &&
        typeof d.endDate === 'string' &&
        Date.parse(d.endDate) < now,
    );
    if (!old.length) return null;
    return {
      severity: 'Worth a look',
      label: `${plural(old.length, 'banner')} past its end date and still switched on`,
      detail:
        'The website stops showing a banner after its end date, so nothing is wrong, but switching it off keeps the list tidy.',
      target: { pane: 'settings;announcement' },
      targetLabel: 'Open the banners',
      items: itemsOf(old, nameOf),
      itemLabel: 'Past its end date, still on',
    };
  },
};

/** Site rule: someone on the Staff page with no photo. */
const staffWithoutPhoto: CheckupRule = {
  id: 'staff-no-photo',
  run: ({ published, nameOf }) => {
    const missing = published.filter(
      (d) =>
        d._type === 'staffMember' &&
        d.showOnSite !== false &&
        !(d.photo as { asset?: unknown } | undefined)?.asset,
    );
    if (!missing.length) return null;
    return {
      severity: 'Worth a look',
      label: `${plural(missing.length, 'person', 'people')} on the Staff page with no photo`,
      detail:
        'The Staff page shows a plain panel where a photo would go. A friendly face helps a visitor know who they will meet on Sunday.',
      target: { pane: 'people;staffMember' },
      targetLabel: 'Open the staff list',
      items: itemsOf(missing, nameOf, () => 'photo'),
      itemLabel: 'No photo yet',
    };
  },
};

export const kitConfig: KitConfig = {
  siteName: 'the church website',

  helper: {
    name: 'Nathan',
    email: envVal('PUBLIC_STUDIO_HELP_EMAIL'),
  },

  // Sanity user ids of ADMINISTRATORS who should get the staff view too
  // (sanity.io/manage, Members). Ids, not emails: the repo is public. Everyone
  // who is not an administrator gets it anyway (card 175), and an administrator
  // can also be marked "Simple view" from the Studio, with no deploy.
  staff: [],

  staffTools: ['home', 'quick-update', 'structure', 'presentation', 'site-guide', 'checkup'],
  // Messages is registered by the workflow plugin (card 117) but left off the
  // list: the church's forms are Church Trac's, so the site keeps no inbox.
  toolOrder: [
    'home',
    'quick-update',
    'structure',
    'presentation',
    'site-guide',
    'checkup',
    'media',
  ],
  toolTitles: { structure: 'Content', presentation: 'Live preview' },

  // Desk items only a developer needs (ids from src/sanity/structure.ts).
  // Old web addresses stay visible: the guides send the office there.
  staffHiddenPanes: [],

  trashTypes: {
    // One name per thing, matching the desk.
    announcement: 'Banner',
    journalEntry: 'Blog post',
    journalCategory: 'Blog category',
    staffMember: 'Staff member',
    ministry: 'Ministry',
    churchTracForm: 'Church Trac form',
    redirect: 'Old web address',
  },

  weekStartsOn: 1,
  // The Sunday checklist (card 111). The week starts on Monday. Posts and
  // banners tick themselves from the content; the livestream and the calendar
  // live outside the website, so they are ticked by hand, on a small document
  // per week, and the list starts fresh every Monday.
  thisWeekTitle: 'Sunday checklist',
  thisWeek: [
    {
      id: 'sermon',
      title: "Post Sunday's sermon preview",
      detail:
        "The title, the passage and a few lines. The home page names this Sunday's sermon from it.",
      query: `count(*[_type == "journalEntry" && ${PUBLISHED} && publishedAt >= $weekStart && "category-sermon-preview" in categories[]._ref])`,
      target: { tool: 'quick-update' },
      targetLabel: 'Post the preview',
    },
    {
      id: 'news',
      title: 'Post something on the blog',
      detail:
        'A sermon preview, an event coming up or a word from a ministry. The home page shows the newest posts.',
      query: `count(*[_type == "journalEntry" && ${PUBLISHED} && publishedAt >= $weekStart])`,
      target: { create: 'journalEntry' },
      targetLabel: 'Write a post',
    },
    {
      id: 'banners',
      title: 'Take down banners that have ended',
      detail: 'Switch off any banner across the top of the site whose date has passed.',
      query: `count(*[_type == "announcement" && ${PUBLISHED} && enabled == true && defined(endDate) && endDate < $now]) == 0`,
      target: { pane: 'settings;announcement' },
      targetLabel: 'Open the banners',
    },
    {
      id: 'livestream',
      title: "Schedule Sunday's livestream on YouTube",
      detail:
        "The home page's Watch live link finds the church's next scheduled stream by itself. Tick this once it is set up on YouTube.",
      manual: true,
    },
    {
      id: 'calendar',
      title: "Check this week's events in Church Trac",
      detail:
        "The What's On page reads the Church Trac calendar, not the Studio. Tick this once the dates and times there are right.",
      manual: true,
    },
  ],

  // Quick update (card 111): the jobs the office does from a phone, every
  // weekly one in docs/agent/studio-plan.md (2026-10-19): the sermon preview,
  // a banner, a change this week, a short news post. Each form publishes
  // straight away, so the builders in src/lib/quick-updates.ts return whole,
  // valid documents (tested in quick-updates.test.ts).
  // "Post a photo" (card 125) is the first button: a photo from the phone into
  // a gallery on a page, or into a new blog post. Always a DRAFT; the office
  // presses Publish. The note repeats the church's rule for children's photos.
  postPhoto: {
    galleryTypes: [...PAGE_BUILDER_TYPES],
    note: "Photos of children need a parent's permission on file first, and never add a child's name.",
    post: {
      label: 'A new blog post',
      type: 'journalEntry',
      build: ({ title, alt, caption, image, now }) => ({
        _type: 'journalEntry',
        title,
        slug: { _type: 'slug', current: slugify(title) },
        excerpt: (caption || alt).slice(0, POST_SUMMARY_MAX),
        coverImage: image,
        publishedAt: now.toISOString(),
        categories: [{ _type: 'reference', _ref: 'category-fbcm-events', _key: 'events' }],
        body: [
          {
            _type: 'block',
            _key: 'photo-intro',
            style: 'normal',
            markDefs: [],
            children: [
              { _type: 'span', _key: 'photo-intro-text', text: caption || alt, marks: [] },
            ],
          },
        ],
      }),
    },
  },

  quickUpdate: [
    {
      id: 'sermon-preview',
      title: "Post Sunday's sermon preview",
      detail: 'The title, the passage and a few lines. It goes on the blog and the home page.',
      icon: BookIcon,
      // The window (worship): the sermon. The other tiles keep the lamp and the door.
      meaning: 'scripture',
      submitLabel: 'Post the preview',
      fields: [
        {
          name: 'title',
          title: "The sermon's title",
          kind: 'string',
          required: true,
          max: POST_TITLE_MAX,
          description: 'As it will appear on the blog, like "Bread for the journey".',
        },
        {
          name: 'passage',
          title: 'The Bible passage',
          kind: 'string',
          required: true,
          max: 60,
          description:
            'Book, chapter and verses, like "John 6:35-40". The home page shows it beside the sermon.',
        },
        {
          name: 'preacher',
          title: 'Who is preaching',
          kind: 'string',
          max: 60,
          description: 'Their name as it should read under the title. Leave it empty for no name.',
        },
        {
          name: 'summary',
          title: 'A sentence or two about it',
          kind: 'text',
          required: true,
          max: POST_SUMMARY_MAX,
          description: 'Shown under the title on the Blog page and in Google.',
        },
        {
          name: 'more',
          title: 'Anything more (optional)',
          kind: 'text',
          max: 4000,
          description: 'Leave a blank line between paragraphs.',
        },
      ],
      build: async (v, { now, client }) =>
        buildSermonPreview(
          {
            title: v.title,
            passage: v.passage,
            preacher: v.preacher,
            summary: v.summary,
            more: v.more,
          },
          now,
          await slugTaken(client, v.title, now),
        ),
      doneMessage:
        'The preview will be on the blog and the home page in a few minutes. To add a picture or fix a word, open it in the full editor.',
    },
    {
      id: 'notice',
      title: 'Put up a banner',
      detail: 'A short line across the top of every page, until the day you pick.',
      icon: BellIcon,
      // The tile's art (card 131): the footer's lamp, the church's sign for news.
      meaning: 'notice',
      fields: [
        {
          name: 'message',
          title: 'What the banner says',
          kind: 'text',
          required: true,
          max: NOTICE_MAX,
          description: 'One short sentence, like "Trunk or Treat this Saturday at 5 pm."',
        },
        {
          name: 'lastDay',
          title: 'Last day to show it',
          kind: 'date',
          required: true,
          initial: (now) => comingSunday(now),
        },
        {
          name: 'link',
          title: 'A link for more',
          kind: 'url',
          description: 'A full web address starting with https://',
        },
      ],
      build: (v) =>
        buildNotice({ message: v.message, lastDay: v.lastDay, link: v.link || undefined }),
      doneMessage:
        'The banner will be on the website in a few minutes, and it takes itself down after the day you picked.',
    },
    {
      id: 'this-week',
      title: 'Cancel or change something this week',
      detail: 'A red banner that takes itself down after Sunday.',
      icon: CalendarIcon,
      // The footer's door: whether and where the church meets this week.
      meaning: 'place',
      fields: [
        {
          name: 'message',
          title: 'What is changing',
          kind: 'text',
          required: true,
          max: NOTICE_MAX,
          description: 'Like "No Wednesday Night Live this week. See you Sunday."',
        },
      ],
      build: (v, { now }) =>
        buildNotice({ message: v.message, lastDay: comingSunday(now) }, 'urgent'),
      doneMessage:
        'The banner will be on the website in a few minutes and comes down by itself after Sunday.',
    },
    {
      id: 'news',
      title: 'Write a short news post',
      detail: 'An event coming up or a word from a ministry, filed under FBCM Events.',
      icon: DocumentTextIcon,
      meaning: 'post',
      submitLabel: 'Post it',
      fields: [
        {
          name: 'title',
          title: 'Title',
          kind: 'string',
          required: true,
          max: POST_TITLE_MAX,
          description: 'Short and specific, like "Trunk or Treat this Saturday".',
        },
        {
          name: 'summary',
          title: 'A sentence or two',
          kind: 'text',
          required: true,
          max: POST_SUMMARY_MAX,
          description: 'What, when and where. Shown under the title on the Blog page.',
        },
        {
          name: 'more',
          title: 'Anything more (optional)',
          kind: 'text',
          max: 4000,
          description: 'Leave a blank line between paragraphs.',
        },
        {
          name: 'link',
          title: 'A link for more (optional)',
          kind: 'url',
          description: 'A sign-up form or an event page, starting with https://',
        },
      ],
      build: async (v, { now, client }) =>
        buildNewsPost(
          { title: v.title, summary: v.summary, more: v.more, link: v.link },
          now,
          await slugTaken(client, v.title, now),
        ),
      doneMessage:
        'The post will be on the blog in a few minutes. To add a picture, open it in the full editor.',
    },
    // Card 137 jobs written as data (monthly, now and then, seasonal): src/sanity/quick-jobs.ts.
    ...QUICK_JOBS,
  ],

  checkup: {
    rules: [
      ...genericRules({
        seoTypes: SEO_TYPES,
        altExemptFields: ['logo', 'favicon', 'icon', 'logoImage', 'seoImage'],
      }),
      expiredNotices,
      staffWithoutPhoto,
    ],
    ignoreTypes: ['sectionPreset', 'studioGuide', 'studioNotes', 'redirect'],
  },

  guide: {
    guides,
    categories: GUIDE_CATEGORIES,
    view: makeGuideView,
    // "Help for this page" (card 110): which guides each document type shows.
    forType: GUIDES_FOR_TYPE,
    // "How to" chip on fields (card 134): empty until a field is mapped.
    forField: GUIDE_FOR_FIELD,
  },

  // Home's "Your pages" card (card 115): every page the office can change, in
  // the menu's own words, one click each. The church's pages are custom pages
  // (type 'page', ids from scripts/pages/); "Other pages" lists any new one by
  // name without touching this file. Desk ids are load-bearing (structure.ts).
  pages: [
    {
      title: 'Main pages',
      links: [
        { title: 'Home', target: { doc: 'homePage' } },
        { title: 'Visit', target: { doc: 'page-visit', type: 'page' } },
        { title: 'Who We Are', target: { doc: 'page-who-we-are', type: 'page' } },
        { title: 'Beliefs', target: { doc: 'page-beliefs', type: 'page' } },
        { title: 'History', target: { doc: 'page-history', type: 'page' } },
        { title: 'Staff', target: { doc: 'page-staff', type: 'page' } },
        { title: 'Ministries', target: { doc: 'page-ministries', type: 'page' } },
        { title: 'Weddings', target: { doc: 'page-wedding', type: 'page' } },
        { title: 'Give', target: { doc: 'page-give', type: 'page' } },
        { title: 'The Visitor', target: { doc: 'page-visitor', type: 'page' } },
        { title: 'Contact', target: { doc: 'page-contact', type: 'page' } },
        { title: 'Blog page', target: { doc: 'journalPage' } },
        { title: 'Privacy policy', target: { doc: 'privacyPage' } },
      ],
    },
    { title: 'Other pages', listType: 'page' },
    {
      title: 'Blog, people and ministries',
      links: [
        { title: 'Blog posts', target: { pane: 'blog;journalEntry' } },
        { title: 'Staff members', target: { pane: 'people;staffMember' } },
        { title: 'Ministries', target: { pane: 'ministry' } },
        { title: 'Church Trac forms', target: { pane: 'churchTracForm' } },
        { title: 'Banners', target: { pane: 'settings;announcement' } },
      ],
    },
    {
      title: 'Site-wide',
      links: [
        {
          title: 'Church details',
          detail: 'Service time, address, office hours',
          target: { doc: 'siteSettings', field: 'serviceTime' },
        },
        {
          title: 'Church systems',
          detail: 'Giving, forms, the calendar, prayer',
          target: { doc: 'siteSettings', field: 'givingUrl' },
        },
        { title: 'Menus', target: { doc: 'siteSettings', field: 'navItems' } },
        { title: 'Footer', target: { doc: 'siteSettings', field: 'footerColumns' } },
        { title: 'Old web addresses', target: { pane: 'settings;redirect' } },
      ],
    },
  ],

  // Home's banner (card 118): the navy welcome at the top of Home, dressed in
  // the church's own identity. The tower mark on a light disc; along the foot
  // the site footer's own art (scripts/gen-studio-art.mjs): the four goal
  // glyphs on a gold rule and the 1927 Hannaford rendering in gold; and the
  // editor's name in the logo's gold.
  // Set as the site sets its own big lines: the name in Castoro Titling
  // capitals with one word in the gold italic (the footer's "Praise PROCLAIM"),
  // the tower bare on the navy (no white disc: on the site it stands on the
  // dark ground), the editor's name in the site's gold, and the 1927 Hannaford
  // rendering inking in along the foot. All from scripts/gen-studio-art.mjs.
  homeBanner: {
    mark: '/favicon.svg',
    markOnDark: '/studio-art/tower.svg',
    motif: '/studio-banner/foot.svg',
    motifNarrow: '/studio-banner/foot-phone.svg',
    accent: '#D59B29',
    lettering: {
      text: 'Muncie',
      family: 'FBCM Castoro Italic',
      src: '/studio-art/castoro-italic.woff2',
      colors: ['#D59B29'],
    },
    // Card 135: the banner's look as data (eyebrow with a gold hairline, italic greeting, the square
    // gold plate with a standing ring, the rendering behind the words). The font file for
    // Sofia Sans is loaded by src/sanity/studioHomeBanner.css.
    style: {
      background: { rule: '#d59b29' },
      eyebrow: {
        font: SOFIA,
        size: '13px',
        weight: 600,
        tracking: '0.14em',
        case: 'upper',
        color: '#f4efe6',
        mark: { kind: 'rule', color: '#d59b29' },
      },
      greeting: { font: "'Castoro', Georgia, serif", italic: true, weight: 400 },
      chip: {
        shape: 'square',
        bg: '#d59b29',
        fg: '#1c1b3a',
        hoverBg: '#e2ae4a',
        halo: '#d59b29',
        ring: '#f4efe6',
        font: SOFIA,
        size: '14px',
        weight: 600,
        tracking: '0.14em',
        case: 'upper',
      },
      motif: { place: 'behind-right' },
    },
  },

  // Home's big buttons (card 110): the office's most common jobs. Keep it to four.
  quickActions: [
    {
      title: 'Write a blog post',
      detail: 'A sermon preview, an event or news from a ministry.',
      target: { create: 'journalEntry' },
      icon: EditIcon,
    },
    {
      title: 'Change the service time',
      detail: 'Church details. Every page that says the time reads it from here.',
      target: { doc: 'siteSettings', field: 'serviceTime' },
      icon: ClockIcon,
    },
    {
      title: 'Put up a banner',
      detail: 'A line across the top of every page, like a snow closing.',
      target: { create: 'announcement' },
      icon: BellIcon,
    },
    {
      // Monthly (docs/agent/studio-plan.md): straight to The Visitor's list of issues.
      // The staff list is on "Your pages" for the rarer staff changes.
      title: "Add this month's Visitor",
      detail: 'The newsletter: pick the month and year, upload the PDF.',
      target: {
        doc: 'page-visitor',
        type: 'page',
        field: 'pageBuilder[_key=="visitor-issues"].docs',
      },
      icon: DocumentPdfIcon,
    },
  ],

  // The page check inside "Help for this page" (card 110): the same three
  // checks as the "Check this page..." action, on the page-builder types.
  pageCheck: { types: [...PAGE_BUILDER_TYPES], run: (doc, client) => runPageCheck(client, doc) },

  // Card 137: the spotlight tours, the welcome and What's new live in
  // studio-tours.ts (plain data, unit-tested; the plan is docs/agent/studio-plan.md).
  tours: TOURS,
  welcome: WELCOME,
  whatsNew: WHATS_NEW,

  // The plain fallback (the type requires it): with `tours` set, the kit uses those instead.
  tourSteps: [
    {
      title: 'This is Home',
      body: 'Home opens first every time. It shows the Sunday checklist, whether your last change is on the website yet, and anything that needs fixing.',
    },
    {
      title: 'Content is where you edit',
      body: 'Click Content in the top bar to change the words and pictures on any page, write a blog post, update the staff or put up a banner.',
    },
    {
      title: 'Live preview shows the real page',
      body: 'Live preview shows the website as visitors will see it, with your unpublished changes in place. Click any words on it to edit them right there.',
    },
    {
      title: 'Nothing is public until you press Publish',
      body: 'Your changes are private until you press the green Publish button. After that the website updates itself in a few minutes. Changed your mind? Use Undo, or move a thing to the Trash and bring it back later.',
    },
    {
      title: 'Help is always one click away',
      body: 'Site Guide in the top bar has step-by-step help for every job, and you can print any of it. Stuck? Home has a card for asking Nathan.',
    },
  ],

  liveSlowAfterMinutes: 15,

  features: {
    home: true,
    guide: true,
    checkup: true,
    tour: true,
    trash: true,
    publishNote: true,
    // Card 115: Cloudflare Web Analytics through /api/studio/visitors/. The
    // route says "not set up yet" until the Worker has CF_ANALYTICS_TOKEN,
    // CF_ACCOUNT_ID and CF_WEB_ANALYTICS_SITE_TAG (OPERATIONS.md).
    visitors: true,
    // Off until scheduled publishing works (the SANITY_API_WRITE_TOKEN repo
    // secret, docs/PENDING.md): a card listing drafts that never publish
    // themselves would mislead. Switch on with the secret.
    comingUp: false,
    // Card 110: the status line under the top bar, and the help panel.
    navbarStatus: true,
    helpPanel: true,
  },
};

/**
 * The church's page-builder rules (the authoring kit, PORTS.md card 109).
 * Each one shows as a yellow WARNING beside a page's sections, never an error,
 * so nothing here can stop Publish or break a page that is already live. The
 * built-in warnings (empty sections, leftover template example text, a synced
 * section with nothing picked) apply everywhere whatever this says. Logic and
 * tests: src/lib/page-guardrails.ts.
 *
 * The church's pages open with a page-top band, a heritage band (History,
 * Architecture), a give band (Give) or words (The Visitor), so those four are
 * the allowed openers (checked against the live pages, 2026-10-18: none warns).
 * One page-top band is enough. 24 sections is a nudge, not a limit: History is
 * 19 on purpose. Home is left out: it opens with its own twelve-frame hero.
 */
export const pageRules: PageRules = {
  appliesTo: ['page'],
  mustStartWith: ['heroSection', 'heritageBandSection', 'giveBandSection', 'richTextSection'],
  atMostOnce: ['heroSection'],
  maxSections: 24,
};
