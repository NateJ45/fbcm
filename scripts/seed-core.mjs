// scripts/seed-core.mjs
//
// Seeds CORE document types with neutral "Studio Starter" placeholder content
// so a fresh clone shows real populated pages instead of empty fallbacks.
//
// Prerequisites:
//   - A configured Sanity project (PUBLIC_SANITY_PROJECT_ID in .env)
//   - A write token (SANITY_API_WRITE_TOKEN in .env)
//   - PUBLIC_SANITY_DATASET defaults to "production"
//
// Idempotent: uses client.createOrReplace with deterministic _id values.
// Re-running this script is safe and will never duplicate documents.
//
// Module types (service modules, etc.) have their own per-module seed.mjs.
// Run ONLY this file for the core pages.
//
// -----------------------------------------------------------------------------
// EVERY SEEDED STRING READS AS A PLACEHOLDER. THAT IS THE RULE (2026-09-18).
// -----------------------------------------------------------------------------
// PORTS.md card 44. This file used to seed plausible copy for a real trade: an
// interior-design studio's services at $150 and $650, budget brackets from
// "Under $2,000" to "$25,000+", testimonials about living rooms, process steps
// ending in an installation day. All of it was well written and none of it
// belonged to the fork that ran the seeder, and a fork could ship it simply by
// not noticing it. Plausible copy for the wrong business looks exactly like
// copy; an obvious placeholder does not.
//
// So a seeded string either says "replace this" in so many words, or it is
// structurally neutral ("How long it takes", "Category one (replace me)"). If
// you find yourself writing a sentence a real business could publish, that is
// the signal to stop. The one exception is the privacy policy, which is generic
// boilerplate every site needs, and the Studio help documents, which are
// instructions to the editor rather than content for a visitor.
//
// -----------------------------------------------------------------------------
// THE SCAFFOLD MARKERS
// -----------------------------------------------------------------------------
// Each numbered section that belongs to a removable capability is wrapped in a
// scaffold block, so `npm run scaffold --remove faq` takes the FAQ page and its
// four questions out of the seeder along with the schema and the route.
//
// ONE LIMIT, AND IT IS DELIBERATE. Markers never nest (see scripts/scaffold.mjs),
// so a section gets the ONE capability that owns the page it seeds. The
// aboutPage seed is `about` end to end, including the valuesSection block inside
// its pageBuilder, which really belongs to `philosophy`. A fork that removed
// philosophy and kept about would seed a block whose type the schema no longer
// declares. That is a DATASET problem, not a build problem: the Studio shows it
// as an unknown type and the editor deletes it, exactly as it does for any
// document of a removed type. The scaffold has never been able to touch the
// dataset, on purpose, and this is the same boundary.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { loadEnv } from './lib/loadEnv.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const env = loadEnv(root);
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET ?? 'production';
const token = env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.log('PUBLIC_SANITY_PROJECT_ID is not set. Configure your .env and re-run.');
  process.exit(0);
}
if (!token) {
  console.log('SANITY_API_WRITE_TOKEN is not set. A write token is required to seed content.');
  process.exit(0);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-05-01',
  useCdn: false,
});

// ── Helper: portable-text paragraph block ────────────────────────────────

let _keyCounter = 0;
function key() {
  _keyCounter += 1;
  return `seed-${_keyCounter}`;
}

function pt(text) {
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  };
}

function ptH2(text) {
  return {
    _type: 'block',
    _key: key(),
    style: 'h2',
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  };
}

function ptH3(text) {
  return {
    _type: 'block',
    _key: key(),
    style: 'h3',
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  };
}

// ── CTA helper (ctaBlock object type) ────────────────────────────────────

function cta(label, href) {
  return { label, linkType: 'external', externalUrl: href, openInNewTab: false };
}

// ── Documents to seed ────────────────────────────────────────────────────

const docs = [];

// ── 1. siteSettings (singleton) ──────────────────────────────────────────
// Fields: title, tagline, email, phone?, serviceTime, serviceLength,
//         officeHours, pastoralHours, churchCenterUrl, givingUrl,
//         churchTracUrl, youtubeUrl, livestreamUrl, visitorFormUrl,
//         lifeEventFormUrl, mapImage?, directionsUrl, socialInstagram?,
//         socialFacebook?, seoImage?, footerCredit?, footerCreditUrl?,
//         newsletter{enabled,...}, sectionVisibility

// The giving address is typed ONCE, here, and used TWICE: as the church's own
// `givingUrl`, and as the destination of the header's Give button. A headerCta
// link is a `navLink` object, and a navLink cannot reference another field of
// the same document, so the schema has no way to make the two follow each
// other. This constant is what keeps them equal. IF YOU CHANGE THE GIVING
// ADDRESS, CHANGE IT HERE AND NOWHERE ELSE, or the button and the Give band
// will quietly point at different pages.
const GIVING_URL = 'https://fbcmuncie.churchcenter.com/giving';
const CHURCH_CENTER_URL = 'https://fbcmuncie.churchcenter.com/';
const CHURCH_TRAC_URL = 'https://fbcmuncie.churchtrac.com/';
const YOUTUBE_URL = 'https://www.youtube.com/c/FbcmuncieOrg';

// Menu helpers. The _key values are written out by hand rather than taken from
// key() above, because that counter is shared with every portable-text block in
// this file: allocating menu keys from it would shift the _keys of every block
// seeded after this document, and re-running the seeder would then rewrite
// documents nothing had asked to change.
//
// `href` is the hand-typed address field, which WINS over the page picker (see
// src/lib/nav-href.ts). The church's plan-2 pages have no documents behind them
// yet, so a typed address is the only thing that can point at them.
function link(k, label, href) {
  return { _type: 'navLink', _key: k, label, href };
}
function externalLink(k, label, url) {
  return { _type: 'navLink', _key: k, label, linkType: 'external', externalUrl: url };
}

docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  title: 'First Baptist Church Muncie',
  // The church's own sentence, and the same string brand.config.json holds.
  // It replaced the placeholder on 2026-09-19 (Task 9 fix 1) because the
  // footer now prints the tagline in gold on every page, so a placeholder
  // there is the most visible unfinished thing on the site.
  tagline: "We're a Spirit-led people gathered to join Christ's presence in our community.",
  email: 'office@fbcmuncie.org',
  phone: '(765) 284-7749',
  address: '309 East Adams Street\nMuncie, IN 47305',
  serviceTime: 'Sundays at 10:45 am',
  serviceLength: 'About an hour',
  officeHours: [
    pt('Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm'),
    pt('Friday: 9 am to 12 pm'),
    pt('Sunday: 9 am to 12 pm'),
    pt('Hours may change on holidays.'),
  ],
  pastoralHours: [pt('Tuesdays: 9 am to 12 pm and 1 pm to 5 pm')],
  churchCenterUrl: CHURCH_CENTER_URL,
  givingUrl: GIVING_URL,
  churchTracUrl: CHURCH_TRAC_URL,
  youtubeUrl: YOUTUBE_URL,
  livestreamUrl: 'https://www.youtube.com/@FbcmuncieOrg/streams',
  visitorFormUrl: 'https://fbcmuncie.churchtrac.com/connectcard',
  lifeEventFormUrl: 'https://fbcmuncie.churchcenter.com/people/forms/159897',
  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=309+East+Adams+Street+Muncie+IN+47305',
  newsletter: {
    enabled: false,
    heading: 'Your signup heading goes here.',
    blurb: 'Say what a subscriber gets and how often. Replace this line.',
    buttonLabel: 'Subscribe',
    successMessage: "You're in. Check your inbox.",
    consentNote: 'No spam. Unsubscribe anytime.',
  },
  // The seven top-menu links, in the order the church reads them. Seven is the
  // maximum the schema allows and the maximum the header row fits on one line.
  navItems: [
    link('nav-visit', 'Visit', '/visit'),
    link('nav-who', 'Who We Are', '/who-we-are'),
    link('nav-beliefs', 'Beliefs', '/beliefs'),
    link('nav-ministries', 'Ministries', '/ministries'),
    link('nav-staff', 'Staff', '/staff'),
    link('nav-history', 'History', '/history'),
    link('nav-blog', 'Blog', '/blog'),
  ],
  // The one button at the right of the header. See GIVING_URL above: this link
  // and `givingUrl` must stay equal.
  headerCta: {
    show: true,
    label: 'Give',
    link: { _type: 'navLink', label: 'Give', linkType: 'external', externalUrl: GIVING_URL },
  },
  // Footer link columns. The fourth column, Office, is drawn in code from
  // `officeHours` and the address, because it is prose and not a link list.
  footerColumns: [
    {
      _type: 'footerColumn',
      _key: 'fcol-pages',
      title: 'Pages',
      // Task 13 (2026-09-19): Give was added here, after History and before
      // Blog (spec order: a visitor reads History then hears about giving
      // before the blog). The links array has a schema max of 10
      // (siteSettings.ts, footerColumns[].links, raised in plan 2a), and this
      // column was already at 10, so Privacy came out to make room rather
      // than pushing past the max: Footer.astro always renders its own
      // "Privacy policy" link in the small-print bar at the very bottom
      // (LEGAL_LINKS falls back to it when empty), so fcol-pages-privacy was
      // a second link to the same page. Removing it is not a content loss,
      // it removes a duplicate.
      links: [
        link('fcol-pages-visit', 'Visit', '/visit'),
        link('fcol-pages-who', 'Who We Are', '/who-we-are'),
        link('fcol-pages-beliefs', 'Beliefs', '/beliefs'),
        link('fcol-pages-ministries', 'Ministries', '/ministries'),
        link('fcol-pages-staff', 'Staff', '/staff'),
        link('fcol-pages-history', 'History', '/history'),
        link('fcol-pages-give', 'Give', '/give'),
        link('fcol-pages-blog', 'Blog', '/blog'),
        link('fcol-pages-wedding', 'Weddings and Building Use', '/wedding'),
        link('fcol-pages-contact', 'Contact', '/contact'),
      ],
    },
    {
      _type: 'footerColumn',
      _key: 'fcol-elsewhere',
      title: 'Elsewhere',
      links: [
        externalLink('fcol-elsewhere-cc', 'Church Center: calendar and giving', CHURCH_CENTER_URL),
        externalLink('fcol-elsewhere-ct', 'Church Trac: newsletters and the app', CHURCH_TRAC_URL),
        externalLink('fcol-elsewhere-yt', 'YouTube: every service', YOUTUBE_URL),
      ],
    },
  ],
  sectionVisibility: {
    showJournal: true,
  },
});

// ── 2. homePage (singleton) ───────────────────────────────────────────────
// Fields: seoTitle, seoDescription, heroEyebrow, heroHeadline, heroSubhead,
//         heroImages, heroPrimaryCta, heroSecondaryCta, heroRotatingWords?,
//         heroScriptAccent?, meetFounderEyebrow, meetFounderHeadline,
//         meetFounderContent, meetFounderCta, featuredWorkEyebrow,
//         featuredWorkHeadline, featuredWorkSubhead, featuredWorkCta,
//         featuredJournalEyebrow, featuredJournalHeadline,
//         featuredJournalSubhead, featuredJournalCta,
//         processPreviewEyebrow, processPreviewHeadline,
//         processPreviewSubhead, processPreviewCta,
//         testimonialsEyebrow, testimonialsHeadline, testimonialsSubhead,
//         testimonialsToShow (refs), testimonialsAttribution?,
//         featuredTestimonial?, servicesGridEyebrow, servicesGridHeadline,
//         servicesGridSubhead, servicesGridCta, servicesGridFootnote?,
//         serviceAreaCue?, finalCtaEyebrow, finalCtaHeadline,
//         finalCtaSubhead, finalCta

docs.push({
  _id: 'homePage',
  _type: 'homePage',
  seoTitle: 'Studio Starter - replace this title',
  seoDescription:
    'Replace this with one sentence describing what this business does, for search results.',

  heroEyebrow: 'Welcome.',
  heroHeadline: 'Your Headline Goes Here.',
  heroSubhead: 'Replace this with one or two sentences saying what you do and who you do it for.',
  heroPrimaryCta: cta('Primary button label', '/contact'),
  heroSecondaryCta: cta('Second button label', '/about'),

  meetFounderEyebrow: 'Meet the Founder.',
  meetFounderHeadline: 'Replace this headline.',
  meetFounderContent: [
    pt(
      'Replace this with a short introduction. Two paragraphs is plenty: who you are and what you do.',
    ),
    pt(
      'Then say why someone should trust you with the work. Be specific; specifics are what make a stranger believe you.',
    ),
  ],
  meetFounderCta: cta('Button label', '/about'),

  featuredWorkEyebrow: 'Recent Work.',
  featuredWorkHeadline: 'Replace this headline.',
  featuredWorkSubhead:
    'Replace this with a line introducing whatever this business wants to show off.',
  featuredWorkCta: cta('Button label', '/about'),

  featuredJournalEyebrow: 'From the Journal.',
  featuredJournalHeadline: 'Replace this headline.',
  featuredJournalSubhead:
    'Replace this with a line saying what gets written about here and how often.',
  featuredJournalCta: cta('Read the Journal', '/blog'),

  processPreviewEyebrow: 'How It Works.',
  processPreviewHeadline: 'Replace this headline.',
  processPreviewSubhead:
    'Replace this with a line describing how working with this business goes, in plain words.',
  processPreviewCta: cta('Button label', '/process'),

  servicesGridEyebrow: 'What We Offer.',
  servicesGridHeadline: 'Replace this headline.',
  servicesGridSubhead: 'Replace this with a line introducing the list of services below.',
  servicesGridCta: cta('Button label', '/services'),
  servicesGridFootnote: 'Optional small print under the list. Replace or clear it.',

  serviceAreaCue: 'Replace this with where this business works.',
  finalCtaEyebrow: 'Ready to Begin?',
  finalCtaHeadline: 'Replace this closing headline.',
  finalCtaSubhead:
    'Replace this with the one thing you want a visitor to do next, and what happens when they do.',
  finalCta: cta('Primary button label', '/contact'),

  // ── pageBuilder (section-driven layout, Phase B) ─────────────────────────
  // NOTE: This content mirrors DEFAULT_HOME_SECTIONS in src/data/defaultSections.ts.
  // The seed uses rich section types (founderSection, testimonialsSection, etc.)
  // that require Sanity collection data; the route fallback uses simpler inline
  // sections (heroSection, richTextSection, etc.) that render without a dataset.
  // If you update copy here, update defaultSections.ts in parallel.
  pageBuilder: [
    {
      _type: 'heroSection',
      _key: key(),
      eyebrow: 'Welcome.',
      headline: 'Your Headline Goes Here.',
      subhead: 'Replace this with one or two sentences saying what you do and who you do it for.',
      size: 'tall',
      primaryCta: cta('Primary button label', '/contact'),
      secondaryCta: cta('Second button label', '/about'),
    },
    {
      _type: 'ctaBandSection',
      _key: key(),
      eyebrow: 'Ready to Begin?',
      headline: 'Replace this closing headline.',
      subhead: 'Replace this with the one thing you want a visitor to do next.',
      cta: cta('Primary button label', '/contact'),
    },
  ],
});

// scaffold: journal
// ── 14. journalCategory docs (2 items) ───────────────────────────────────
// Required fields: title, slug{_type,current}
// Optional: description

docs.push({
  _id: 'journal-category-one',
  _type: 'journalCategory',
  title: 'Category one (replace me)',
  slug: { _type: 'slug', current: 'category-one' },
  description: 'Replace this with what gets filed under this category.',
});

docs.push({
  _id: 'journal-category-two',
  _type: 'journalCategory',
  title: 'Category two (replace me)',
  slug: { _type: 'slug', current: 'category-two' },
  description: 'Replace this with what gets filed under this category.',
});
// scaffold:end

// scaffold: journal
// ── 15. journalPage (singleton) ──────────────────────────────────────────
// Fields: seoTitle, seoDescription, heroEyebrow, heroHeadline, heroSubhead,
//         heroImage?, heroScriptAccent?, stickyCtaLabel?,
//         finalCtaHeadline, finalCtaSubhead, finalCta

docs.push({
  _id: 'journalPage',
  _type: 'journalPage',
  seoTitle: 'Journal - Studio Starter',
  seoDescription:
    'Replace this with one sentence saying what gets written here, for search results.',

  heroEyebrow: 'The Journal.',
  heroHeadline: 'Notes from the studio.',
  heroSubhead: 'Replace this with what gets written about here and roughly how often.',
  stickyCtaLabel: 'Got a question?',

  finalCtaHeadline: 'Replace this closing headline.',
  finalCtaSubhead: 'Replace this with the one thing you want a reader to do next.',
  finalCta: cta('Primary button label', '/contact'),
});
// scaffold:end

// scaffold: journal
// ── 16. journalEntry docs (2 items) ──────────────────────────────────────
// Required fields: title, slug, excerpt, publishedAt, body (min 1 block)
// Optional: coverImage, categories (refs), author, updatedAt,
//           seoTitle, seoDescription, relatedPosts

docs.push({
  _id: 'journal-entry-welcome',
  _type: 'journalEntry',
  title: 'Welcome to the Journal',
  slug: { _type: 'slug', current: 'welcome-to-the-journal' },
  excerpt:
    'This is a placeholder post. Replace it with your first real journal entry once the site is live.',
  author: 'Author name (replace me)',
  publishedAt: '2025-06-01T12:00:00.000Z',
  categories: [{ _type: 'reference', _key: key(), _ref: 'journal-category-two' }],
  body: [
    pt('This is a placeholder journal entry. Replace this content with your first real post.'),
    pt(
      'A journal is a good place for walkthroughs of real work and honest notes about how it goes. Write the way you talk. Be specific.',
    ),
    ptH2('What to write about'),
    pt(
      'Start with something you did recently. Walk readers through the brief, what went wrong, and the decisions you made. Specific detail is more interesting than general advice.',
    ),
    pt(
      'Once you have a few of those, mix in shorter notes: something you keep recommending, something worth knowing about, something that changed how you approach a common problem.',
    ),
  ],
});

docs.push({
  _id: 'journal-entry-second-post',
  _type: 'journalEntry',
  title: 'Second placeholder post (replace me)',
  slug: { _type: 'slug', current: 'second-placeholder-post' },
  excerpt:
    'Replace this with a real summary. The excerpt is what shows on the index page and in search results, so write it for a stranger.',
  author: 'Author name (replace me)',
  publishedAt: '2025-05-15T12:00:00.000Z',
  categories: [{ _type: 'reference', _key: key(), _ref: 'journal-category-two' }],
  body: [
    pt(
      'Replace this with your own content. This placeholder post exists so the journal index has two entries to lay out on launch day, not because anything in it is worth publishing.',
    ),
    ptH2('A heading'),
    pt('Replace this paragraph. It is here to show what a body paragraph looks like.'),
    ptH2('A second heading'),
    pt('Replace this paragraph too.'),
    ptH3('A subheading'),
    pt('And this one, which shows the third heading level rendering.'),
  ],
});
// scaffold:end

// ── 17. notFoundPage (singleton) ─────────────────────────────────────────
// Fields: seoTitle, seoDescription, eyebrow, headline, body, heroImage?,
//         primaryCtaLabel, primaryCtaHref, secondaryCtaLabel,
//         secondaryCtaHref, tertiaryCtaLabel, tertiaryCtaHref

docs.push({
  _id: 'notFoundPage',
  _type: 'notFoundPage',
  seoTitle: 'Page not found',
  seoDescription: 'That page wandered off. Head back to the homepage or get in touch.',

  eyebrow: '404',
  headline: 'That page wandered off.',
  body: "It happens. Maybe a link is old, maybe the URL has a typo. Either way, here's where to head next.",

  primaryCtaLabel: 'Back home',
  primaryCtaHref: '/',
  tertiaryCtaLabel: 'Get in touch',
  tertiaryCtaHref: '/contact',
});

// ── 18. privacyPage (singleton) ──────────────────────────────────────────
// Required fields: heroHeadline, lastUpdated, body (Portable Text)
// Optional: seoTitle, seoDescription, heroEyebrow, heroSubhead

docs.push({
  _id: 'privacyPage',
  _type: 'privacyPage',
  seoTitle: 'Privacy Policy - Studio Starter',
  seoDescription:
    'How Studio Starter collects, uses, and protects information submitted through this website.',

  heroEyebrow: 'Studio Starter.',
  heroHeadline: 'Privacy Policy',
  lastUpdated: '2025-06-01',

  body: [
    ptH2('1. Information We Collect'),
    pt(
      'When you submit the contact form on this website, we collect the information you provide: your name, email address, and any details about your project. We do not collect information automatically beyond standard server logs.',
    ),

    ptH2('2. How We Use Your Information'),
    pt(
      'We use the information you provide solely to respond to your inquiry and, if you become a client, to manage your project. We do not sell, share, or rent your information to third parties.',
    ),

    ptH2('3. Email Communications'),
    pt(
      'If you subscribe to a newsletter or mailing list through this site, we use your email address only to send the communications you signed up for. You can unsubscribe at any time by clicking the unsubscribe link in any message.',
    ),

    ptH2('4. Cookies and Analytics'),
    pt(
      'This site may use basic analytics to understand how visitors find and use the site. This data is aggregated and anonymous. We do not use cookies to track you across other websites.',
    ),

    ptH2('5. Data Security'),
    pt(
      'We take reasonable precautions to protect your information. Contact form submissions are transmitted over encrypted connections. We do not store payment information on this site.',
    ),

    ptH2('6. Third-Party Services'),
    pt(
      'This site is hosted on Cloudflare. Contact form submissions may be processed through a third-party form service. Each of these providers has its own privacy policy governing the data they handle.',
    ),

    ptH2('7. Your Rights'),
    pt(
      'You may request a copy of any personal information we hold about you, or ask us to delete it, by emailing hello@example.com. We will respond within 30 days.',
    ),

    ptH2('8. Changes to This Policy'),
    pt(
      'We may update this policy from time to time. The date at the top of this page reflects when it was last revised. Continued use of the site after a change constitutes acceptance of the updated policy.',
    ),

    ptH2('9. Contact'),
    pt(
      'Questions about this policy? Email hello@example.com. Replace this address with your actual contact email once the site is configured.',
    ),
  ],
});

// ── 19. studioGuide (singleton) ──────────────────────────────────────────
// Fields: guideTitle, guideIntro, studioMap [{area, description}],
//         howTos [{title, steps[]}], tips [{heading, tone, body}]
//
// Task 10 of plan 2a (2026-09-19) rewrote every row and every how-to for a
// church secretary, not a design studio: the areas below are the six things
// she actually opens (Home page, Visit page, the other pages, Blog posts,
// Staff members, Ministries, Site settings), and the how-tos are the tasks
// she is actually asked to do, in her own words.

docs.push({
  _id: 'studioGuide',
  _type: 'studioGuide',
  guideTitle: 'How the website works',
  guideIntro:
    'This guide walks you through where everything lives in the Studio and how to make changes to the website without breaking anything.',
  studioMap: [
    {
      _type: 'mapRow',
      _key: key(),
      area: 'Home page',
      description:
        'The sections on the front page of the site: the photo and headline at the top, and everything below it. Drag to reorder, or add and remove sections from the same screen.',
    },
    {
      _type: 'mapRow',
      _key: key(),
      area: 'Visit page',
      description:
        'What a first-time visitor needs to know before they come: service time, address, what to expect, and parking. Set once, changed rarely.',
    },
    {
      _type: 'mapRow',
      _key: key(),
      area: 'The other pages',
      description:
        'Who We Are, Beliefs, and History live under Pages too, built from the same section library as the home page.',
    },
    {
      _type: 'mapRow',
      _key: key(),
      area: 'Blog posts',
      description:
        'Sermon previews and church news. Each post has a title, a category, and the text of the post. New posts appear on the Blog page automatically.',
    },
    {
      _type: 'mapRow',
      _key: key(),
      area: 'Staff members',
      description:
        'Everyone on the Staff page: pastors, the coordination team, and support and volunteer roles. Each one has a name, role, photo, and short bio.',
    },
    {
      _type: 'mapRow',
      _key: key(),
      area: 'Ministries',
      description:
        'The church’s groups and programs, like Children or Outreach. Each one has a name, a short summary, and a longer description.',
    },
    {
      _type: 'mapRow',
      _key: key(),
      area: 'Site settings',
      description:
        'The church’s name, service time, office hours, address, and the links in the header and footer. Most of the site reads from here.',
    },
  ],
  howTos: [
    {
      _type: 'howTo',
      _key: key(),
      title: 'Post this week’s sermon preview',
      steps: [
        'Open "Blog" then "Posts" from the left navigation.',
        'Click "New" (or the plus button) to start a post.',
        'Fill in the title and the text of the preview, and pick the category "Sermon Preview".',
        'Click Publish.',
      ],
    },
    {
      _type: 'howTo',
      _key: key(),
      title: 'Change the service time or office hours',
      steps: [
        'Open "Site settings" from the left navigation.',
        'Click the "Church details" tab at the top of the form.',
        'Edit the service time or office hours field.',
        'Click Publish.',
      ],
    },
    {
      _type: 'howTo',
      _key: key(),
      title: 'Add or remove a staff member',
      steps: [
        'Open "People" then "Staff members" from the left navigation.',
        'Click "New" to add someone, or open an existing person to change their details.',
        'To take someone off the website, turn off "Show on the Staff page". Their details stay here, so you can turn it back on later.',
        'Set their group (Pastors, Church Coordination Team, or Support and volunteer roles).',
        'Click Publish.',
      ],
    },
    {
      _type: 'howTo',
      _key: key(),
      title: 'Change a photo on the home page',
      steps: [
        'Open "Pages" then "Home" from the left navigation.',
        'Open the first section at the top of the page layout.',
        'Find the Photos field and upload the new image, or remove the old one.',
        'Click Publish.',
      ],
    },
    {
      _type: 'howTo',
      _key: key(),
      title: 'What happens when I press Publish',
      steps: [
        'The site rebuilds itself in about two minutes.',
        'Nobody needs to be called. The change appears on its own once the rebuild finishes.',
      ],
    },
    {
      _type: 'howTo',
      _key: key(),
      title: 'The one button never to press',
      steps: [
        '"Remove field": it deletes that information from every page.',
        'If you see it next to something, leave it alone and ask for help instead.',
      ],
    },
    {
      _type: 'howTo',
      _key: key(),
      title: 'Add a photo to the Staff page or a blog post',
      steps: [
        'Open the Media library and click Upload.',
        'Photos of children need a signed consent form on file at the office before they go up.',
      ],
    },
  ],
  tips: [
    {
      _type: 'tip',
      _key: key(),
      heading: 'Start with Site settings',
      tone: 'primary',
      body: 'Open Site settings first and check the service time, office hours, address, and contact details are correct. Most of the site reads from here.',
    },
    {
      _type: 'tip',
      _key: key(),
      heading: 'Edit on the page, not in a list of fields',
      tone: 'positive',
      body: 'The Presentation tab is the easiest way to work. You see the real page, click the thing you want to change, and the right field opens. You can also add, reorder, and remove whole sections without leaving the page. Everything you do there is a draft until you press Publish.',
    },
    {
      _type: 'tip',
      _key: key(),
      heading: 'Publishing is not instant, but it is automatic',
      tone: 'default',
      body: 'When you click Publish, the site rebuilds itself in about two minutes. There is no staging step and nobody needs to be called. If you want to draft something before it goes live, leave it as a draft and come back to it.',
    },
    {
      _type: 'tip',
      _key: key(),
      heading: 'Photos of children need a consent form on file first',
      tone: 'caution',
      body: 'Before adding a photo of a child to the Staff page or a blog post, check that a signed consent form is on file at the office.',
    },
    {
      _type: 'tip',
      _key: key(),
      heading: 'Stuck? Ask before you delete anything',
      tone: 'caution',
      body: 'If a screen looks wrong, or you see a "Remove field" button, stop and ask for help rather than guessing. Nothing else in the Studio can be broken by clicking around.',
    },
  ],
});

// ── 20. studioNotes (singleton) ──────────────────────────────────────────
// Fields: businessSummary, idealClient, voiceSummary, wordsToAvoid

docs.push({
  _id: 'studioNotes',
  _type: 'studioNotes',
  businessSummary:
    'First Baptist Church Muncie, at 309 East Adams Street. Replace this with a short, plain description of the church for anyone writing for the site: who the congregation is, and what a visitor should know before their first Sunday.',
  idealClient:
    'Replace this with a description of who the church is writing for online: a longtime member checking the service time, or someone considering visiting for the first time. The more clearly this is described, the easier it is to write pages that speak to them.',
  voiceSummary:
    'Replace this with a description of the church’s voice in writing. Warm and plain-spoken? Formal? Pick a description in a sentence or two so anyone writing for the site sounds consistent.',
  wordsToAvoid: ['transformative', 'curated', 'elevated', 'tailored', 'seamless', 'synergy'],
});

// ── 21. studioPlaybook (singleton) ───────────────────────────────────────
// Fields: title, intro, guides [{title, summary, sections [{heading, tone,
//         body, bullets, links}]}]

// The 'Grow your studio' playbook was removed on 2026-09-08. It was seeded
// with interior-design business content (photographing finished rooms,
// trade sourcing accounts) inherited from the build this starter was forked
// from, so every project made from it shipped another business's playbook
// that had to be found and deleted by hand. See PORTS.md card 44.

// ── Announcement banner example ───────────────────────────────────────────
// A single disabled example announcement so the collection is not empty after
// seeding. The editor can duplicate this, set a message and date window, then
// enable it. Disabled by default so it does not appear on the live site.
docs.push({
  _id: 'announcement-example',
  _type: 'announcement',
  internalTitle: 'Example announcement (disabled)',
  message: 'Welcome to our new website. Reach out any time if you have questions.',
  style: 'info',
  link: { label: 'Contact us', url: '/contact' },
  enabled: false,
});

// ── --only <type>: write ONE document, and only after proving it is safe ──
//
// `npm run seed` rewrites every core document. That is right for a fresh
// clone and wrong for a live dataset, where a later task adds one field to one
// singleton and has no business touching the twenty documents an editor may
// have changed since. `--only siteSettings` writes that one document, and it
// refuses to write at all unless the live copy still matches what the seed
// would produce.
//
// The guard is two steps, in this order (CLAUDE.md rule 16: write the backup
// step first and the dry run falls out of it):
//
//   1. BACK UP. The live document is fetched and written verbatim to
//      scripts/data/backups/<type>-<date>-pre-<label>.json before anything is
//      written, and an existing backup is never overwritten: a second run
//      under the same label on the same day gets a clock suffix. The
//      backup is committed; it is the record.
//   2. COMPARE. Every top-level key the live document carries (minus the
//      system fields) is compared against the value the seed would write. A
//      key the seed ADDS is fine, that is the point of the run. A key whose
//      value DIFFERS means somebody edited the live document after it was
//      seeded, and replacing it would silently throw that edit away. The
//      script prints the difference and exits without writing.
//   3. NAME WHAT YOU MEAN TO CHANGE. --expect takes a comma-separated list
//      of top-level keys whose live value you know differs and intend to
//      overwrite. Those are printed in full, then allowed; everything else
//      still stops the run. There is deliberately no blanket --force:
//      having to type the field name is what makes you look at it.
//
// Usage:  node scripts/seed-core.mjs --only siteSettings [--label task9]
//                                     [--expect tagline,phone]
//
// --only ALSO accepts a comma-separated list of ids, so a task that touches
// more than one singleton runs one command instead of one per document:
// `--only studioGuide,studioNotes` backs up and compares BOTH before writing
// EITHER. Task 10 (2026-09-19) is the first caller: the Studio help singletons
// counted 0 on the live dataset (plan 1 never ran the core seeder), so there
// was nothing to diff against and the backup is an empty record by design.

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}
const onlyType = flag('--only');
const backupLabel = flag('--label') ?? 'seed';
/**
 * Top-level keys whose live value the operator KNOWS differs and means to
 * overwrite, comma separated: `--expect tagline`. They are printed as loudly
 * as an unexpected difference and then allowed. Everything else still stops
 * the run. A blanket --force would be the easy version of this and the wrong
 * one: naming the field is what makes the operator look at it.
 */
const expectedChanges = new Set(
  (flag('--expect') ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
);

/** Keys Sanity owns. They differ on every fetch and mean nothing to a diff. */
const SYSTEM_KEYS = new Set(['_rev', '_createdAt', '_updatedAt']);

/** Stable stringify so key ORDER never shows up as a difference. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

async function seedOne(type) {
  const doc = docs.find((d) => d._type === type);
  if (!doc) {
    console.error(`No seed document of type "${type}" in this file.`);
    process.exit(1);
  }

  const live = await client.fetch(`*[_id == $id][0]`, { id: doc._id });

  // 1. Back up, verbatim, BEFORE anything else. A document that does not
  // exist yet backs up as `null` -- that absence is itself the record (rule
  // 16 says write the backup step first; it does not say there has to be
  // something in it). Task 10 hit exactly this: the Studio help singletons
  // counted 0 on the live dataset because plan 1 never ran the core seeder.
  const { writeFileSync, mkdirSync, existsSync } = await import('node:fs');
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = resolve(root, 'scripts/data/backups');
  mkdirSync(dir, { recursive: true });
  // A backup is a record, so it is never overwritten. A second run under the
  // same label on the same day gets a clock suffix instead.
  let backupPath = resolve(dir, `${type}-${stamp}-pre-${backupLabel}.json`);
  if (existsSync(backupPath)) {
    const clock = new Date().toISOString().slice(11, 19).replace(/:/g, '');
    backupPath = resolve(dir, `${type}-${stamp}-pre-${backupLabel}-${clock}.json`);
  }
  writeFileSync(backupPath, `${JSON.stringify(live ?? null, null, 2)}\n`, 'utf8');
  console.log(
    live
      ? `Backed up the live ${type} to ${backupPath}`
      : `No live ${type} document yet. Backed up that absence (null) to ${backupPath}.`,
  );

  if (!live) {
    console.log(`No live value to compare. Writing ${type} for the first time.`);
    await client.createOrReplace(doc);
    console.log(`  created   ${doc._type}  ${doc._id}`);
    return;
  }

  // 2. Compare every key the live document already carries.
  const changed = [];
  const expected = [];
  for (const k of Object.keys(live)) {
    if (SYSTEM_KEYS.has(k)) continue;
    const a = canonical(live[k]);
    const b = canonical(doc[k]);
    if (a === b) continue;
    (expectedChanges.has(k) ? expected : changed).push({ key: k, live: a, seed: b });
  }

  const added = Object.keys(doc).filter((k) => !(k in live));
  if (added.length > 0) console.log(`Adding: ${added.join(', ')}`);

  // Named differences are printed in full before the write, not summarised.
  for (const c of expected) {
    console.log(`Expected change: ${c.key}`);
    console.log(`    live: ${c.live}`);
    console.log(`    seed: ${c.seed}`);
  }

  if (changed.length > 0) {
    console.error(
      `\nSTOP. The live ${type} differs from what this seed would write, on ${changed.length} field(s).`,
    );
    console.error('Writing would throw those edits away. Nothing has been written.\n');
    for (const c of changed) {
      console.error(`  ${c.key}`);
      console.error(`    live: ${c.live}`);
      console.error(`    seed: ${c.seed}`);
    }
    console.error('\nNEEDS_CONTEXT: reconcile the seed with the live document, then re-run.');
    process.exit(2);
  }

  console.log(
    expected.length > 0
      ? `No unexpected value differs from the seed (${expected.length} named change). Writing.`
      : 'No live value differs from the seed. Writing.',
  );
  await client.createOrReplace(doc);
  console.log(`  replaced  ${doc._type}  ${doc._id}`);
}

// ── Seed all documents ────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${docs.length} documents to ${projectId}/${dataset}...`);

  let created = 0;
  let replaced = 0;

  for (const doc of docs) {
    try {
      const existing = await client.fetch(`*[_id == $id][0]._id`, { id: doc._id });
      await client.createOrReplace(doc);
      if (existing) {
        replaced += 1;
        console.log(`  replaced  ${doc._type}  ${doc._id}`);
      } else {
        created += 1;
        console.log(`  created   ${doc._type}  ${doc._id}`);
      }
    } catch (err) {
      console.error(`  ERROR on ${doc._id}: ${err.message}`);
    }
  }

  console.log(`\nDone. ${created} created, ${replaced} replaced.`);
  console.log('Replace all placeholder text in Sanity before going live.');
}

if (onlyType) {
  // Comma-separated: each id runs its own backup-then-compare-then-write in
  // turn. If one id's live value differs unexpectedly, seedOne exits(2)
  // before writing that id, but any id already processed earlier in the list
  // has already been backed up and written; that is why --only is for a
  // handful of singletons the operator has looked at, not a blanket rewrite.
  const types = onlyType
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  for (const type of types) {
    await seedOne(type);
  }
} else {
  await seed();
}
