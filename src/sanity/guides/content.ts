// =============================================================================
// Help & Guide content: plain-language walkthroughs for the church secretary
// =============================================================================
// PORTS.md card 41. This is DATA, not code: each guide is a list of typed
// blocks, rendered read-only by GuideView and grouped in the desk by category.
//
// WHY IT LIVES IN THE REPO. Guides held as Sanity documents can be deleted by
// the person who most needs them, do not travel with a fork, and are empty
// until somebody remembers to seed them. In the repo they cannot be lost and
// every fork inherits them with the code.
//
// ── THIS IS THE FIRST BAPTIST CHURCH MUNCIE REWRITE (2026-09-22). ───────────
// The starter's generic template was replaced here, following the
// stonesteps-50k fork's worked example. WHO THIS IS WRITTEN FOR: the church
// secretary, who keeps the Sunday details, the blog, the Staff page and the
// notices current, and who did not ask for a CMS. Every guide is one job they
// will actually do, named after what really exists in THIS Studio, and
// every click path was checked against the schemas and src/sanity/structure.ts
// on the day it was written. When a menu title or a field title changes, the
// guide that names it changes in the same commit.
//
// Two things the rewrite keeps from the template, because they matter most:
//   1. The reassurance first. "You cannot break the live site by editing" is
//      the single most useful sentence in the whole handbook.
//   2. The rebuild delay. Every static site owner's first support question is
//      "I published and nothing happened".
//
// Held back, deliberately: a guide on how a band's picture decides its shape
// (window, framed portrait, legend, plate, backdrop). That behaviour lives on
// feat/richtext-ledger-photo-shapes and is not on main yet; the draft is in
// docs/PENDING.md, to be added here when that branch merges.
//
// ── EDITING CONVENTIONS ─────────────────────────────────────────────────────
//   - **double asterisks** for a concept worth emphasis.
//   - `backticks` for a THING YOU CLICK. Renders as a small button-look chip,
//     so a step can be skimmed for its clickable part.
//   - _underscores_ for a light aside.
//   - No em-dashes. Commas, or "and".
//   - Define any jargon in plain words the first time it appears.
//   - src/lib/studio-guides.test.ts enforces the structural half of this.
// =============================================================================

import type { BrandIconKey } from '../../lib/studio-icons';
import type { GUIDE_ICON_MEANINGS } from '../../lib/studio-look';
import type { FieldGuideMap } from '../../lib/studio-kit';
import type { KitGuideBlock } from '../kit/guide/GuidePage';

export type DiyLevel = 'self' | 'ask' | 'mixed';

/** Where a "Where in the Studio" breadcrumb can link to. */
export type PathLink = { doc: string; type?: string } | { pane: string } | { tool: string };

/**
 * Every block a guide can hold: the kit's list (kit/guide/GuidePage.tsx, card
 * 128). New since 2026-10-19 here: { kind: 'shot', key } (a picture of the
 * Studio from src/sanity/guides/shots.ts, card 130; a key with no capture draws
 * the wireframe), { kind: 'quote' }, steps { across: true } and the tones
 * 'note' | 'tip' | 'careful'.
 */
export type GuideBlock = KitGuideBlock;

/** Names the prose refers to. Replace these, do not hardcode them in guides. */
export const SITE = {
  /** Who the secretary should ask when a guide does not cover it. */
  contactName: 'Nathan',
};

export const GUIDE_CATEGORIES = [
  'Start here',
  'Sundays and notices',
  'Blog, staff and ministries',
  'Pictures',
  'Once in a while',
  'When something is wrong',
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

/**
 * The icon each guide shows, by MEANING (card 128). The Site Guide draws it on a
 * stone, in the church's own icon art where it has some (src/sanity/brandIconArt.tsx:
 * the window, door, lamp and basin from the footer). Either a name from
 * GUIDE_ICON_MEANINGS in src/lib/studio-look.ts ('clock', 'bulb') or a meaning in
 * the icon registry ('notice', 'people'). Types only, so this file stays data and
 * the unit test can import it without React.
 */
export type GuideIconName = keyof typeof GUIDE_ICON_MEANINGS | BrandIconKey;

export interface Guide {
  slug: string;
  category: GuideCategory;
  title: string;
  icon: GuideIconName;
  lead: string;
  diy: DiyLevel;
  body: GuideBlock[];
  /**
   * Optional short clip of the job being done (PORTS.md card 115). Shows under
   * "Watch how it is done" on Studio Home and in the Site Guide; with no clips
   * anywhere the row hides itself. Either a file in public/ (record the screen,
   * save as MP4, put it at public/guides/<slug>.mp4 and write
   * "/guides/<slug>.mp4"), or a YouTube (unlisted is fine) or Vimeo link. Keep
   * clips under two minutes.
   */
  video?: string;
}

export const guides: Guide[] = [
  // ── Start here ────────────────────────────────────────────────────────────
  {
    slug: 'start-here',
    category: 'Start here',
    title: 'Start here: how this all works',
    icon: 'bulb',
    lead: 'Two minutes that make everything else make sense.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'The Studio and the website are two different things' },
      {
        kind: 'p',
        text: 'What you are looking at now is the **Studio**. It is private, and it is where the church website gets edited. The **website** is what the congregation and visitors see. You change things here, and they appear on the website a few minutes later.',
      },
      { kind: 'h', text: 'You cannot break the website by editing' },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Nothing is live until you press Publish.',
        text: 'While you type you are editing a private **draft**. The public website does not change at all until you click `Publish`. So open things, click around, and only publish when it looks right. If you make a mess and have not published, you can close the tab and walk away.',
      },
      { kind: 'h', text: 'How a change reaches the website' },
      {
        kind: 'steps',
        items: [
          'Open the thing you want to change from the menu on the left.',
          'Edit the boxes. Your typing saves itself as a draft as you go.',
          'When it looks right, click the green `Publish` button at the bottom right.',
          'Wait a few minutes, usually about two. The website rebuilds itself and your change appears.',
        ],
      },
      { kind: 'shot', key: 'publish-button' },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Give it a few minutes.',
        text:
          'The website does not change the instant you publish. It is built ahead of time so it loads quickly, which means it has to rebuild in the background. Publish, do something else, then refresh the page you changed. If ten minutes have passed and nothing has changed, tell ' +
          SITE.contactName +
          '.',
      },
      { kind: 'h', text: 'What is in the menu on the left' },
      {
        kind: 'bullets',
        items: [
          '**Pages**: Home, the Blog page, and under `All other pages` every other page of the site (Visit, Who We Are, Beliefs, History, Staff, Ministries, Wedding, Give, The Visitor, Contact).',
          '**Blog**: the posts, including the sermon previews, and their categories.',
          '**People**: the staff members shown on the Staff page.',
          '**Ministries**: each ministry’s words, photo and the people to talk to. The Ministries page reads from here.',
          '**Church Trac forms**: the forms from Church Trac that can sit on a page, like the connection card.',
          '**Site settings**: the service time, the address, office hours, the links to Church Trac, the menus, the notice banner and old web addresses.',
          '**Help**: an overview of how the website works, and your church at a glance.',
        ],
      },
      { kind: 'h', text: 'The top bar' },
      {
        kind: 'bullets',
        items: [
          '**Home** opens first: the Sunday checklist, whether your last change is on the website yet, and anything that needs fixing.',
          '**Quick update** is for the weekly jobs done from a phone: the sermon preview, a banner, a change this week, a short news post or a photo.',
          '**Content** is the menu on the left described above.',
          '**Live preview** shows the website with your unpublished changes in place.',
          '**Site Guide** is these guides, searchable and printable.',
          '**Checkup** looks over the whole website for things worth fixing.',
        ],
      },
      { kind: 'h', text: 'If you change your mind' },
      {
        kind: 'p',
        text: 'On a page, the `...` button beside `Publish` has `Undo last change`, which steps back one edit at a time. And until you publish, nothing you have done has reached the website.',
      },
      {
        kind: 'seealso',
        items: ['Change a page: its words and its sections', 'Who to ask, and what to send'],
      },
    ],
  },

  {
    slug: 'edit-a-page',
    category: 'Start here',
    title: 'Change a page: its words and its sections',
    icon: 'page',
    lead: 'Every page is a stack of sections. You change what is in each section, and the order they come in.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'How a page is built' },
      {
        kind: 'p',
        text: 'Each page is a stack of **sections**, one on top of the next: an opening section, a section of text beside a photo, a section of questions and answers, and so on. You choose what goes in each section. You do not choose colours or spacing: the design sets those from where the section sits on the page, which is why the site looks the same whoever edits it.',
      },
      { kind: 'h', text: 'The easy way: click the words on the page' },
      {
        kind: 'steps',
        items: [
          'Click `Presentation` in the bar along the top of the Studio.',
          'Pick the page from the list on the left. The real page appears in the middle.',
          'Click any words on the page. The boxes that hold them open on the right.',
          'Type. The page redraws as you go.',
          'Click `Publish` when it reads right.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Presentation shows your draft, not the live site.',
        text: 'What you see there includes changes you have not published yet. That is the point: you see the page as it will be before anyone else does.',
      },
      { kind: 'h', text: 'Moving, adding and removing sections' },
      {
        kind: 'path',
        items: ['Pages', 'All other pages', 'the page', 'Sections'],
      },
      {
        kind: 'bullets',
        items: [
          'The sections are listed in the `Sections` box, top to bottom. Drag a section by its handle on the left to move it up or down.',
          'To add a section, click `Add item...` under the list and choose from the menu. There is a search box at the top of that menu. The `...` menu on a row also has `Add item before...` and `Add item after...`.',
          'To take a section off, open the `...` menu on its row and choose `Remove`. `Duplicate` in the same menu makes a copy of the section right below it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'There is no switch to hide a section for a while.',
        text: 'Taking a section off the page removes it. If you might want it back, save a copy first: click the `...` button beside `Publish`, choose `Save a section as preset...` and pick the section. It then waits under `Pages`, then `Saved sections`, and you can add it back from the `Saved sections` list in Presentation.',
      },
      { kind: 'h', text: 'The building section and its dates' },
      {
        kind: 'p',
        text: 'The `Building and history` section is brown. Give it `Dates` and it becomes the cream section from the home page instead: the first and last years large beside the heading, the `Photo` set straight onto the page (a drawing of the building suits it best), the `Old photograph` in an arched frame, and the dates listed underneath.',
      },
      {
        kind: 'bullets',
        items: [
          'Each date is a `Year` and one sentence of `What happened`, up to six, in order.',
          'Tick `This year` on the last one to say what the church is doing now. Its year is filled in when the site is built, so it never goes out of date.',
        ],
      },
      { kind: 'h', text: 'Before you publish a big change' },
      {
        kind: 'p',
        text: 'The `...` button beside `Publish` also has `Check this page...`. It looks for photos with no description, empty sections and links that look wrong. It never stops you publishing; it just tells you.',
      },
      {
        kind: 'seealso',
        items: ['Start here: how this all works', 'Add or change a photo'],
      },
    ],
  },

  // ── Sundays and notices ───────────────────────────────────────────────────
  {
    slug: 'service-times',
    category: 'Sundays and notices',
    title: 'Change the service time or the Sunday details',
    icon: 'clock',
    lead: 'Change it once, in Site settings, and every page follows.',
    video: 'service-times',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Quicker from a phone.',
        text: '`Quick update` has `Change the service time or phone`: two boxes and a button. For the address and the office hours, use Site settings below.',
      },
      {
        kind: 'path',
        items: ['Site settings', 'Site settings', 'Church details'],
        link: { doc: 'siteSettings' },
      },
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then `Site settings` again, then the `Church details` tab.',
          'Change `Service time`. Type it the way it should read, like "Sundays at 10:45 am".',
          "Check `How long the service runs`, `Street address`, `Office hours` and `Pastors' office hours` while you are there.",
          'Publish.',
        ],
      },
      { kind: 'shot', key: 'church-details' },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'That is the whole job.',
        text: 'The time, the address, the phone number and the email are kept in one place, Site settings. Every page that mentions them fills them in from there when the site rebuilds: the top and bottom of every page, the Sunday times, the timelines, the closing sections, even the lines Google shows. Change it once and the whole site agrees.',
      },
      { kind: 'h', text: 'Words the site fills in for you' },
      {
        kind: 'p',
        text: 'Open a section that mentions the time and you will see something like `{time}` where the time goes. That is a **placeholder**: the site swaps it for the real value from Site settings. In `Presentation` you see the real value; in the box you see the placeholder. The same goes for the `Title in Google` and `Description in Google` boxes under `Search and sharing`. You can type these into any text box yourself:',
      },
      {
        kind: 'bullets',
        items: [
          '`{service time}` becomes the whole line, like "Sundays at 10:45 am".',
          '`{time}` becomes just the time, like "10:45 am".',
          '`{service length}` becomes "About an hour".',
          '`{address}` becomes "309 East Adams Street", and `{short address}` becomes "309 East Adams".',
          '`{city}` becomes "Muncie, IN 47305".',
          '`{phone}` and `{email}` become the church’s public phone number and email.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Type them exactly, curly brackets and all.',
        text: 'If you see a placeholder like {time} on the live website, either it has a typing mistake or that box in Site settings is empty. Fill in Site settings and publish, and it comes right.',
      },
      {
        kind: 'p',
        text: '_Two times are not settings and are still typed where they appear: Sunday school at 9:30 am, and the fellowship hour (10:15 to 10:45), in the Youth section on the Ministries page and in the What to Expect section on the home page. If either changes, change it in both places._',
      },
      { kind: 'h', text: 'The brown section with the Sunday times' },
      {
        kind: 'p',
        text: 'The brown `Sunday times and location` section ("Doors, parking and access" on the Visit page, "Find us on Sunday" on the Contact page) is changed on its page in `Presentation`. Each row on it has a `Small label`, a `Big line` and a line of `Text`. The row whose time matches the `Service time` in Site settings is drawn largest, so it moves by itself when the time changes.',
      },
      {
        kind: 'bullets',
        items: [
          '`Introduction` is a sentence or two above the times.',
          '`Notes` are up to three short lines under the photo, like the nursery or communion.',
          '`Photos` takes one or two photos. The first is the larger. Leave it empty and the section uses one of the church’s photos.',
          '`Button (optional)` puts one button under the times. Leave it empty and the section shows the directions button instead.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'A one-off change is a notice, not a new time.',
        text: 'For a single Sunday (a joint service, a snow day), leave the time alone and put a notice across the top of the site instead.',
      },
      { kind: 'seealso', items: ['Put a notice across the top of every page'] },
    ],
  },

  // What the home page draws from code, not from its Sections list (Studio
  // audit, 2026-09-26). Sources: src/pages/index.astro (LastSunday,
  // VisitorBand, WhatsOnBand, ChurchAppBand, inserted before the latest blog
  // posts), src/lib/this-sunday.ts and src/lib/preacher.ts.
  {
    slug: 'home-page',
    category: 'Sundays and notices',
    title: 'What the home page fills in by itself',
    icon: 'page',
    lead: 'Some of the home page is not in its Sections list. It is read from YouTube, Church Trac and Site settings each time the site rebuilds.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'Sections you will not find in the list' },
      {
        kind: 'p',
        text: 'The home page’s `Sections` list holds the opening, the Sunday times, the goals, the building, the latest blog posts and giving. Between the building and the blog posts, the website adds up to four sections of its own. They have no boxes to fill in, because each one is read from somewhere else:',
      },
      {
        kind: 'bullets',
        items: [
          '**Last Sunday**: the most recent Sunday service on the church’s YouTube channel, the `YouTube channel` box in Site settings, `Church details`. It moves on after each Sunday by itself.',
          '**The Visitor**: the newest issue of the church newsletter, from The Visitor page. Add an issue there and this section shows it.',
          '**What’s On**: the next three dated events on the church calendar in Church Trac, the `Events calendar` box in Site settings, `Church systems`. Add or change an event in Church Trac, not here.',
          '**The church app**: shown while the `Church app` box in Site settings, `Church systems`, holds the app’s share link from Church Trac. Empty the box and the section goes.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'They keep themselves up to date.',
        text: 'The website rebuilds itself several times a week, and whenever anyone publishes. If one of these sections is missing, its source had nothing to show at the last rebuild, like no events ahead on the calendar.',
      },
      { kind: 'h', text: 'This Sunday, at the top of the page' },
      {
        kind: 'p',
        text: 'Under the opening words, the home page names this Sunday’s sermon and who is preaching. Both come from the sermon preview for that Sunday if one is on the Blog (its title, and its `Author`), and otherwise from the service YouTube has scheduled for that Sunday (its title, and the "Preaching:" line in its description). To change them, change that post, or the scheduled broadcast on YouTube.',
      },
      {
        kind: 'seealso',
        items: ['Change a page: its words and its sections', 'Links to giving, forms and sermons'],
      },
    ],
  },

  {
    slug: 'announcement',
    category: 'Sundays and notices',
    title: 'Put a notice across the top of every page',
    icon: 'notice',
    lead: 'For a closing, a change of plan, or news everyone should see.',
    video: 'announcement',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Site settings', 'Announcement banner'],
        link: { pane: 'settings;announcement' },
      },
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then `Announcement banner`, then click the pencil button at the top of the list to start a new one.',
          'Give it an `Internal name` so you can find it later, like "Snow closing, January". Visitors never see this.',
          'Type the `Message`. Keep it to one sentence.',
          'Pick a `Style`: `Info` for everyday news, `Highlight` for good news, `Urgent` (red) for a closing or a warning.',
          'If it should link somewhere, fill in `Link (optional)`.',
          'Check `Show this banner` is on, then Publish.',
        ],
      },
      { kind: 'shot', key: 'banner-form' },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Quicker from a phone.',
        text: 'Quick update has `Put up a banner` (you pick the last day) and `Cancel or change something this week` (red, down after Sunday). Both are three boxes and a button.',
      },
      {
        kind: 'p',
        text: 'The notice sits above the menu on every page of the site. If more than one is switched on, the most urgent one shows.',
      },
      { kind: 'h', text: 'Taking it down' },
      {
        kind: 'p',
        text: 'From a phone, `Quick update` has `Take down a banner`: pick the one that is still up and switch it off. It stays in the list if you want it again.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The dates only take effect at the next rebuild.',
        text: '`Show from (optional)` and `Hide after (optional)` are checked when the site rebuilds, and it rebuilds when anybody publishes anything. A notice whose date has passed can still be showing if nothing has been published since. To be sure it is gone, open it, switch `Show this banner` off, and publish.',
      },
      { kind: 'seealso', items: ['Change the service time or the Sunday details'] },
    ],
  },

  // Added 2026-09-24 (feat/church-links), for the move from Church Center to
  // Church Trac. Field titles match src/sanity/schemaTypes/siteSettings.ts;
  // the placeholder list matches CHURCH_LINKS in src/lib/church-links.ts.
  {
    slug: 'church-links',
    category: 'Sundays and notices',
    title: 'Links to giving, forms and sermons',
    icon: 'arrow',
    lead: 'Every link to online giving, the church forms and the sermon recordings is kept in one place.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Site settings', 'Site settings', 'Church systems'],
        link: { doc: 'siteSettings' },
      },
      {
        kind: 'p',
        text: 'The `Church systems` tab holds the web address of each thing the site sends people to outside this website: online giving, the connection card, the forms, the sermon recordings, the Wednesday page and the rest. The Give buttons, the forms on the Contact and Visit pages and the "listen" links in the sermon previews all read their address from here.',
      },
      { kind: 'h', text: 'Changing where a link goes' },
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then `Site settings` again, then the `Church systems` tab.',
          'Paste the new address into the box, for example the new giving page into `Online giving`.',
          'Publish. When the site rebuilds, every link that uses that box goes to the new address.',
          'Open the live site and click one of those links to check it lands where you expect.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'One box, every link.',
        text: 'When the church moves to a new system, like Church Trac, change each box once here. You do not need to find the links page by page.',
      },
      { kind: 'h', text: 'Link placeholders' },
      {
        kind: 'p',
        text: 'Open a link on a page or in a post and its address may read `{giving}` instead of a web address. That is a **link placeholder**: the site swaps it for the address in the matching box. Use one yourself whenever you link to one of these, by selecting the words, pressing the link button in the toolbar, and typing the placeholder into the `Web address` box:',
      },
      {
        kind: 'bullets',
        items: [
          '`{giving}` goes to `Online giving`.',
          '`{connect}` goes to `Connection card`, the form a visitor fills in.',
          '`{contact-form}` goes to `Contact form (Notify us)`.',
          '`{sermons}` goes to `Sermon recordings`.',
          '`{wednesday}` goes to `Wednesday page`.',
          '`{calendar}` goes to `Events calendar`.',
          '`{prayer}` goes to `Prayer list`.',
          '`{app}` goes to `Church app`.',
          '`{wedding-enquiry}` goes to `Wedding enquiry form`.',
          '`{wedding-booking}` goes to `Building booking form`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Type the whole address box as the placeholder, curly brackets and all.',
        text: 'A placeholder only works on its own in a link’s address box, not in the middle of a sentence. A misspelled one shows a red warning under the box. Most empty boxes send the link to this website’s Contact page until you fill it in, so nobody lands on a broken page: `{giving}` goes to this site’s own Give page instead, `{wedding-enquiry}` and `{wedding-booking}` email the wedding office directly, and `{wednesday}` and `{contact-form}` are hidden (the words stay, the link does not) until their box is filled.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Check the words around the link too.',
        text: 'Some pages and posts still say "through Church Center" or "on our Church Center Channel" in the sentence itself, from before the move to Church Trac. Changing the box moves the link, not the words, so read the sentence after a switch and change the words where they name the old system.',
      },
      { kind: 'h', text: 'Sermon recordings' },
      {
        kind: 'p',
        text: 'Leave `Sermon recordings` empty and "listen" links go to the `Live stream address` in the `Church details` tab, which is the YouTube page of past services. While it points at YouTube, a sermon preview links straight to that Sunday’s own recording once YouTube has it, and every older preview keeps the page of past services.',
      },
      { kind: 'seealso', items: ['Change the service time or the Sunday details'] },
    ],
  },

  // Church Trac forms (2026-09-25). Field titles match
  // src/sanity/schemaTypes/churchTracForm.ts and the churchTracFormSection band
  // in churchSections.ts; what a paste may contain is src/lib/church-trac-form.ts.
  {
    slug: 'church-trac-forms',
    category: 'Sundays and notices',
    title: 'Put a Church Trac form on a page',
    icon: 'form',
    lead: 'A form you built in Church Trac, like the connection card or giving, can sit on any page so visitors fill it in without leaving the site.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Church Trac forms'],
        link: { pane: 'churchTracForm' },
      },
      { kind: 'h', text: 'First, get the embed code from Church Trac' },
      {
        kind: 'steps',
        items: [
          'In Church Trac, open `Church Connect`, then `Cards`, and click the form’s card (the connection card is a Form Card).',
          'In the panel that opens, choose the `Form` tab and find `Form/Giving Embed Domain`.',
          'Type this website’s address there and save. Church Trac only lets the form open on the address you type here, and until it is set the `Embed Form` code is not shown.',
          'Copy the code under `Embed Form`. It starts with `<iframe`.',
          'While you are on the `Form` tab, check `Notify User`: it names who is emailed when someone fills the form in. If it is empty, nobody is told.',
          'For online giving the code is in a different place: `Connect Setup`, then `Online Giving`, once the church’s Stripe account is linked there.',
        ],
      },
      { kind: 'h', text: 'Then add the form here, once' },
      {
        kind: 'steps',
        items: [
          'Open `Church Trac forms` in the menu on the left and click the pencil button at the top of the list to make a new one.',
          'Give it a `Form name`, like "Connection card".',
          'Paste the code into `Embed code from Church Trac`. If the box turns red, read the message under it: it is usually the wrong code copied.',
          'Pick a `Form size`, then Publish.',
        ],
      },
      { kind: 'h', text: 'Then put it on a page' },
      {
        kind: 'steps',
        items: [
          'Open the page in `Presentation`, or under `Pages`.',
          'Add a section and choose `Church Trac form` from the `Church` group.',
          'Type a `Heading`, and a few words beside the form if you like, then pick the form under `Form`.',
          'Publish. The form appears on the page after the rebuild.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'One form, as many pages as you like.',
        text: 'Change a form’s code under `Church Trac forms` and every page that shows it changes with it.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'If the form is too short or has its own scroll bar',
        text: 'Change its `Form size` to the next size up and publish. Church Trac’s forms do not tell the page how tall they are, so the size is yours to choose.',
      },
      {
        kind: 'bullets',
        items: [
          'Only Church Trac forms can go in this box. Code from anywhere else is refused, so nothing unexpected can end up on the site.',
          'Under every form there is a link to open it in a new tab, for anyone whose browser will not show it on the page.',
          '_When the site moves to fbcmuncie.org, each form’s `Form/Giving Embed Domain` in Church Trac has to change to the new address, or the forms stop showing._',
        ],
      },
      { kind: 'seealso', items: ['Links to giving, forms and sermons'] },
    ],
  },

  // ── Blog, staff and ministries ────────────────────────────────────────────
  {
    slug: 'blog-post',
    category: 'Blog, staff and ministries',
    title: 'Add a blog post or a sermon preview',
    icon: 'post',
    lead: 'A new post appears on the Blog page, newest first, by itself.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Blog', 'Posts'],
        link: { pane: 'blog;journalEntry' },
      },
      {
        kind: 'steps',
        items: [
          'Open `Blog`, then `Posts`, then click the pencil button at the top of the list.',
          'Type the `Title`. Then click `Generate` beside `Web address` to make the post’s address from the title.',
          'Write a `Short summary`: one or two sentences that appear on the Blog page under the title.',
          'Add a `Cover picture` and fill in `Describe the picture` (a sentence saying what is in it).',
          'Under `Categories`, click `Add item` and choose one, like "Sermon Preview".',
          'Type the name of whoever wrote it in `Author`.',
          'Write the post in `The post`, below the other boxes.',
          'Publish.',
        ],
      },
      { kind: 'shot', key: 'new-post-form' },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'A short post or a sermon preview is quicker from a phone.',
        text: "Quick update has `Post Sunday's sermon preview` and `Write a short news post`. They fill in the web address, the date and the category for you.",
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The Author box is the byline.',
        text: 'Whatever is in `Author` prints under the post’s title. Leave it blank and the post has no byline.',
      },
      {
        kind: 'bullets',
        items: [
          '`Date` fills itself in with today. Change it only if the post belongs to another date. A later date does not hold the post back: it goes live when you publish.',
          '`Tags` are optional short labels, like "Advent" or "Mark". Press Enter after each one.',
          'To see the post in the site’s design before you publish it, click `Presentation` at the top and open the post from there. It needs its `Web address` first, and your changes show as you type.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'A new category needs a moment’s thought.',
        text: 'Each category gets its own page on the site. Use the ones already there where you can, and add a new one under `Blog`, then `Categories`, only when a series will run for a while.',
      },
      { kind: 'h', text: 'The web address' },
      {
        kind: 'p',
        text: 'Click `Generate` once, when the post (or page, or person) is new. After it is published, leave the `Web address` alone: people and Google have the old one. If you must change it, the website forwards the old address to the new one by itself.',
      },
      { kind: 'seealso', items: ["Post Sunday's sermon preview", 'Add or change a photo'] },
    ],
  },

  {
    slug: 'staff',
    category: 'Blog, staff and ministries',
    title: 'Add, change or remove a staff member',
    icon: 'people',
    lead: 'The Staff page, and the "people to talk to" on the Ministries page, read from here.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['People', 'Staff members'],
        link: { pane: 'people;staffMember' },
      },
      {
        kind: 'steps',
        items: [
          'Open `People`, then `Staff members`. Open a person to change them, or click the pencil button at the top of the list to add someone.',
          'Fill in `Name`, then click `Generate` beside `Web address`.',
          'Type their `Role` the way it should read, like "Pastor" or "Church Clerk".',
          'Add their `Email address` and `Phone number` if they want them shown.',
          'Choose their `Group`: `Pastors`, `Church Coordination Team`, or `Support and volunteer roles`. Leave `Show on the Staff page` on.',
          'Add a `Photo` and a few lines in `About them` if you have them.',
          'Publish.',
        ],
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Someone away or leaving?',
        text: '`Quick update` has `Show or hide a staff member`. It switches `Show on the Staff page` off without losing their details.',
      },
      {
        kind: 'p',
        text: 'The Staff page shows the pastors first, then the Church Coordination Team, then everyone else. Within a group, the smaller `Position in the list` number comes first.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Coordinators update the Ministries page too.',
        text: 'The "The people to talk to" section on the Ministries page lists everyone in the `Church Coordination Team` group. Change a coordinator here and that section follows by itself.',
      },
      { kind: 'h', text: 'When someone leaves, or is away for a while' },
      {
        kind: 'p',
        text: 'Open them and switch off `Show on the Staff page`, then publish. They come off the website at the next rebuild but stay in the Studio, marked "(hidden)" in the list, so switching it back on is all it takes if they return. Only `Delete` someone (in the `...` menu beside `Publish`) if you are sure they are not coming back.',
      },
      { kind: 'h', text: 'Deacons' },
      {
        kind: 'p',
        text: 'The deacons are not staff members. They are listed in the "Our deacons" section on the Staff page, under the group photograph, with the deacon chair’s email. To change the list, open the Staff page in `Presentation`, click the names and type. If the photograph changes, keep the "left to right" order of the names matching it.',
      },
      {
        kind: 'seealso',
        items: ['Update a ministry and who leads it', 'Add or change a photo'],
      },
    ],
  },

  {
    slug: 'ministries',
    category: 'Blog, staff and ministries',
    title: 'Update a ministry and who leads it',
    icon: 'people',
    lead: 'Each ministry has one home in the Studio. The Ministries page reads from it.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Ministries', 'the ministry'],
        link: { pane: 'ministry' },
      },
      {
        kind: 'steps',
        items: [
          'Open `Ministries` in the menu on the left and choose one: Worship, Children, Youth, Adult or Outreach.',
          'Change the `Small line above the heading`, the `Headline`, the `Photo` or the `Text`.',
          'Publish. The Ministries page shows the change after the rebuild.',
        ],
      },
      { kind: 'h', text: 'When a coordinator changes' },
      {
        kind: 'p',
        text: 'Under `People to talk to`, remove the person who has stepped down and add the new one from the staff list. The line at the end of the ministry’s section ("Molly Flodder, Worship Coordinator, worship@fbcmuncie.org") is written from their staff details, so their name, role and email are always the ones on the Staff page.',
      },
      {
        kind: 'bullets',
        items: [
          'Someone new has to be a staff member first. Add them under `People`, then `Staff members`, then pick them here.',
          'The "The people to talk to" section near the foot of the Ministries page lists everyone in the `Church Coordination Team` group, and follows by itself too.',
          '_The Studio will not let you delete a staff member who is still named on a ministry. Take them off the ministry first._',
        ],
      },
      { kind: 'h', text: 'Photos and the rest of the page' },
      {
        kind: 'bullets',
        items: [
          'A ministry with no `Photo` shows its text on its own, full width. Adult and Outreach are like that today.',
          'Everything else on the Ministries page (the Sunday timeline, "Sunday, room by room", the parents’ questions) is ordinary page sections. Change those on the page in `Presentation`.',
        ],
      },
      { kind: 'seealso', items: ['Add, change or remove a staff member'] },
    ],
  },

  {
    slug: 'who-we-are',
    category: 'Blog, staff and ministries',
    title: 'Update the Who We Are page',
    icon: 'page',
    lead: 'Four sections made for this page: the Watchword, Our goals, the Pledge, and the pastors’ letter.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Pages', 'All other pages', 'Who we are'],
        link: { doc: 'page-who-we-are', type: 'page' },
      },
      {
        kind: 'p',
        text: 'Like every page, open it in `Presentation` and click the words to change them, or open the page and add one of these four sections from the `Church` group in the `Add item...` menu.',
      },
      { kind: 'h', text: 'Watchword (Praise and Proclaim)' },
      {
        kind: 'p',
        text: 'Our watchword: Isaiah 12:4, "Praise the Lord, proclaim his name." `Heading` is the section’s title ("Our Watchword"). `Short introduction` is two or three sentences shown beside the mark; `Read more` is the longer explanation, shown only when a visitor opens it. `Verse` is the verse itself, without quotation marks, and `Reference` is where it is from. The words **praise** and **proclaim** are highlighted in the verse automatically, so type them as ordinary words. `What "Praise" means` and `What "Proclaim" means` are one or two sentences each.',
      },
      { kind: 'h', text: 'Our goals' },
      {
        kind: 'p',
        text: 'Up to four goals, each with its own colour: green, gold, purple, brown, in the order you list them. Each goal has a `Name` ("Worship"), a `Subtitle` ("Worshiping as the Body of Christ"), and an optional `In brackets` word ("Discipleship"). `Building drawing` picks which of the four goal drawings the goal shows beside its words: window, door, lamp on a stand, or basin and towel. `Opening sentence` introduces the goal, and `Pull quote` is an optional short line shown large, normally on the second goal only.',
      },
      {
        kind: 'p',
        text: 'Up to four `Points` per goal, each a `Title`, an optional `Short label` (one or two words for the drawing itself, like "Serve"; leave blank to reuse the title), and a sentence of `Text`. Up to six `Photos` of people doing this, the first shown largest. Every photo needs `Describe the photo` filled in (see "Add or change a photo" below); this page does not show captions.',
      },
      { kind: 'h', text: 'Pledge (said together)' },
      {
        kind: 'p',
        text: 'The pledge the church says together when a member joins. `Introduction` sets the scene; `Instruction line` is the sentence explaining when it is said ("When a member joins..."); `Opening line` is the line just before the pledge itself. `Lines said together` are the pledge\'s own lines, each with an optional `Scripture` reference. `Text after the pledge` is an optional closing paragraph, and `Photo` is optional too.',
      },
      { kind: 'h', text: 'Letter' },
      {
        kind: 'p',
        text: 'A note from the pastors. `Heading` is the section’s title ("A Note From Our Pastors"). `Letter` is the body, written as ordinary paragraphs. `Signed` is how they sign it ("Kendall & Jonathan") and `Under the signature` is the line below that ("Co-Pastors, First Baptist Church Muncie"). `Portrait` is optional.',
      },
      { kind: 'h', text: 'Where To Go Next (cards)' },
      {
        kind: 'p',
        text: 'Give every one of the closing cards a photo and the row draws as arched doors, the way this page does today; leave even one card without a photo and the whole row falls back to plain cards instead.',
      },
      {
        kind: 'seealso',
        items: ['Add or change a photo'],
      },
    ],
  },

  // ── Pictures ──────────────────────────────────────────────────────────────
  {
    slug: 'photos',
    category: 'Pictures',
    title: 'Add or change a photo',
    icon: 'image',
    lead: 'Where photos come from, and the one sentence each one needs.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open the page, post or person that holds the photo.',
          'On an empty photo box, click `Upload` for a new picture, or `Select` to choose one the church already has. On a box that already has a photo, the same choices are in the small menu at the photo’s top right: `Upload`, or `Media` to choose from the library.',
          'Fill in `Describe the photo`. See below.',
          'Publish.',
        ],
      },
      { kind: 'h', text: 'Choosing from the church’s photos' },
      {
        kind: 'p',
        text: 'Every photo ever uploaded is kept in the **Media library**: click `Media` in the bar along the top of the Studio to see them all. Photos there can carry **tags**, short labels such as a year, an event or a ministry. The `Tags` list on the right of the Media screen shows them, and `Add filter` at the top narrows the photos to one tag. When you choose `Media` from inside a page, the same library opens, with the same tags and the same search box.',
      },
      {
        kind: 'p',
        text: '_The church’s older photographs are being added to the library with tags. Until they arrive, most of what is there is the photos already on the site._',
      },
      { kind: 'h', text: 'Why every photo needs a description' },
      {
        kind: 'p',
        text: 'The `Describe the photo` box (web designers call it **alt text**) takes one plain sentence saying what is in the picture, for somebody who cannot see it. Screen readers read it aloud, it shows if the photo fails to load, and search engines read it. Describe what is happening, not the file: "the choir singing at the Christmas Eve service" rather than "IMG_4471". Most photo boxes will not let you publish until it is filled in.',
      },
      {
        kind: 'p',
        text: '_Staff photos have no description box. The person’s name, printed beside the photo, does that job._',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Photos of children need a consent form on file first.',
        text: 'Before a photo that shows a child goes on the site, check the church office has a signed consent form for that child.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Upload the biggest version you have.',
        text: 'The site resizes every photo itself and sends each visitor the size that suits their screen. A large original gives a better result than one you shrank first.',
      },
      { kind: 'seealso', items: ['Change a page: its words and its sections'] },
    ],
  },

  // ── When something is wrong ───────────────────────────────────────────────
  {
    slug: 'old-web-addresses',
    category: 'When something is wrong',
    title: 'Old web addresses and links that moved',
    icon: 'arrow',
    lead: 'Anyone with an old link, a bookmark or a printed bulletin should still arrive.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Every page and post has a **web address**, the part after fbcmuncie.org, like /visit. When one changes, every saved link to the old one would lead nowhere. A **redirect** sends the old address on to the new one.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Most of this happens by itself.',
        text: 'If you change the web address of a page or a post that is already published, the Studio files the redirect for you when you publish, and says so in a small message. The old addresses from the church’s previous website are already in the list too.',
      },
      { kind: 'h', text: 'Adding one by hand' },
      {
        kind: 'p',
        text: 'You only need to do this for an address that never belonged to this site, such as a short address printed on a flyer.',
      },
      {
        kind: 'path',
        items: ['Site settings', 'Old web addresses'],
        link: { pane: 'settings;redirect' },
      },
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then `Old web addresses`, then the `+` button.',
          'In `Old address (that should forward)`, type the old address starting with a slash, like /easter.',
          'In `Send them to`, type where it should go, like /visit, or a full address starting with https://.',
          'Leave `Permanent move?` on unless the forward is only for a few weeks.',
          'Publish.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Redirects cost nothing to keep.',
        text: 'There is no need to ever delete one. An old redirect is a visitor who still finds you.',
      },
    ],
  },

  {
    slug: 'who-to-ask',
    category: 'When something is wrong',
    title: 'Who to ask, and what to send',
    icon: 'help',
    lead:
      'If something looks wrong, stop and ask ' +
      SITE.contactName +
      '. Here is what helps get it fixed quickly.',
    diy: 'ask',
    body: [
      {
        kind: 'p',
        text:
          'Nothing in here is urgent enough to risk guessing. If a guide does not cover it, leave it alone and ask ' +
          SITE.contactName +
          '. A question costs nothing; an unpicked change to the wrong thing can take a while to find.',
      },
      { kind: 'h', text: 'What to send' },
      {
        kind: 'bullets',
        items: [
          'The web address of the page that looks wrong, copied from the top of the browser.',
          'A screenshot, if you can take one.',
          'What you changed just before, and roughly when you published it.',
        ],
      },
      { kind: 'h', text: 'Worth asking about' },
      {
        kind: 'bullets',
        items: [
          'You published more than ten minutes ago and the website has not changed.',
          'A page shows an error, or looks broken on a phone.',
          'A box in the Studio has a red warning you do not understand.',
          'You need something the Studio does not seem to have a place for.',
        ],
      },
      {
        kind: 'callout',
        tone: 'critical',
        title: 'Never click "Remove field".',
        text:
          'If a yellow box says "Unknown field found" with a `Remove field` button, leave it alone. That button deletes the information from every page at once and cannot be undone without restoring a backup. Close the page and tell ' +
          SITE.contactName +
          '.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Leave "Publish automatically at" empty for now.',
        text:
          'Pages have a `Publish automatically at` box under the `Publishing` tab, for publishing a page at a set time. It does not work yet: a page set to publish itself stays a draft. Publish by hand until ' +
          SITE.contactName +
          ' tells you it is ready.',
      },
      { kind: 'seealso', items: ['Start here: how this all works'] },
    ],
  },
];

// ── The Studio kit (PORTS.md cards 110, 111, 115, 117) ───────────────────────
// Appended, so the church's own guides above keep their order.
guides.push(
  {
    slug: 'studio-home',
    category: 'Start here',
    title: 'What Home in the Studio shows you',
    icon: 'home',
    lead: 'Home opens first every time. Here is what each card is for, top to bottom.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Home is a dashboard: it changes nothing by itself. Every card points somewhere, and the buttons take you straight there.',
      },
      {
        kind: 'bullets',
        items: [
          '**Sunday checklist**: the weekly jobs that keep the website current. Most tick themselves.',
          '**Is it live?**: whether the change you last published is on the website yet.',
          '**Fix-it list**: the things the Checkup found, by name, like a picture with no description. `Edit` opens it at the right spot.',
          '**Visitors**: how many people visited in the last 7 days against the week before, the most-read pages and how people found the website.',
          '**Your pages**: every page you can change, in groups, one click each. Pages you build yourself are added to it automatically.',
          '**Pick up where you left off**: anything you changed but have not published yet.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Visitors says "not set up yet"?',
        text:
          'The numbers come from Cloudflare, which counts visits without cookies. ' +
          SITE.contactName +
          ' switches it on once, and after that it fills in by itself.',
      },
      { kind: 'seealso', items: ['The line under the top bar', 'The Sunday checklist'] },
    ],
  },
  {
    slug: 'website-status',
    category: 'Start here',
    title: 'The line under the top bar',
    icon: 'activity',
    lead: 'A quiet answer to "is my change on the website yet?", wherever you are in the Studio.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Under the top bar there is a thin line that says how the website is doing. It reads the same thing as the **Is it live?** card on Home, so the two always agree.',
      },
      {
        kind: 'bullets',
        items: [
          '**Website up to date**: everything you have published is on the website.',
          '**Updating the website, about 3 minutes**: you published something and the website is rebuilding. You do not need to wait for it.',
          '**The website update is taking longer than usual**: nothing is lost, your change is safe and published. If it still says this an hour later, ask ' +
            SITE.contactName +
            '.',
          "**The last update didn't go through**, in red: the website tried to update and something stopped it, so it is still showing the older version. Your published changes are safe. Press `Try again` once; if it comes back red, leave it with " +
            SITE.contactName +
            '.',
        ],
      },
      { kind: 'seealso', items: ['Start here: how this all works'] },
    ],
  },
  {
    slug: 'help-panel',
    category: 'Start here',
    title: 'Help for this page',
    icon: 'bulb',
    lead: 'Help beside whatever you are editing, without leaving it.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'When something is open for editing, click `Help for this page` at the top of it (it can also sit in the menu with three dots). A panel opens beside the boxes you are typing in.',
      },
      {
        kind: 'bullets',
        items: [
          '**Worth a look** lists photos with no description, empty sections and links that go nowhere, and anything the Checkup found on this page. None of it stops you publishing.',
          '**How to** shows the Site Guide steps for this kind of page, so you can follow them while you work.',
        ],
      },
      { kind: 'seealso', items: ['Change a page: its words and its sections'] },
    ],
  },
  {
    slug: 'undo-earlier',
    category: 'When something is wrong',
    title: 'Undo a change from earlier in the week',
    icon: 'restore',
    lead: 'Put a page back the way it was on a day you remember.',
    diy: 'ask',
    body: [
      {
        kind: 'p',
        text: 'For something you changed in the last few minutes, use `Undo last change` beside Publish, or `Discard changes` if you have not published yet.',
      },
      {
        kind: 'p',
        text:
          "For anything older, ask: the church's Sanity plan keeps only three days of history, and only an administrator can open it. But the website is copied every night, and " +
          SITE.contactName +
          ' can take one page out of a copy and put it back for you as an unpublished change. You check it and press Publish, or press `Discard changes` and nothing has happened.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Ask within two weeks.',
        text: 'The nightly copies are kept for fourteen days, so the sooner you ask, the more there is to choose from.',
      },
      { kind: 'seealso', items: ['Who to ask, and what to send'] },
    ],
  },
  {
    slug: 'quick-update',
    category: 'Sundays and notices',
    title: 'Quick update from your phone',
    icon: 'bolt',
    lead: 'The weekly jobs, made small enough for a phone.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Open the Studio on your phone, tap the menu at the top and choose `Quick update` (on Home it is also a button). Pick one:',
      },
      {
        kind: 'bullets',
        items: [
          '**Post a photo**: from the camera into a gallery on a page or a new blog post. Saved as a draft for you to publish.',
          "**Post Sunday's sermon preview**: the title, the passage, the preacher and a few lines. The home page names the sermon from it.",
          '**Put up a banner**: a short line across the top of every page, until the last day you pick.',
          '**Cancel or change something this week**: a red banner that comes down by itself after Sunday.',
          '**Write a short news post**: an event or a word from a ministry, with a link if you have one.',
          "**Add this month's Visitor**: pick the month, check the year and choose the PDF.",
          '**Take down a banner**: pick one that is still up and switch it off. Nothing is deleted.',
          '**Change the service time or phone**: type it the way it should read.',
          '**Show or hide a staff member**: for someone who is away or has left.',
        ],
      },
      {
        kind: 'p',
        text: 'In November and December there is also a Christmas services banner, and in spring a Holy Week and Easter one. They only show in their weeks.',
      },
      { kind: 'shot', key: 'quick-update-tiles' },
      {
        kind: 'p',
        text: 'Fill in the boxes and press the button at the bottom. Everything but a photo is published straight away, and the website updates in a few minutes. To change it later, press `Open it in the full editor`, or find it in `Content`: banners under Site settings, `Announcement banner`, posts under `Blog`.',
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Put it on your home screen.',
        text: 'On an iPhone, open the Studio in Safari, tap the share button and choose `Add to Home Screen`. On Android, open the Chrome menu and choose `Add to Home screen`. It then opens like an app.',
      },
      {
        kind: 'seealso',
        items: [
          "Post Sunday's sermon preview",
          'Snow days and changes this week',
          'Post a photo from your phone',
        ],
      },
    ],
  },
  {
    slug: 'sunday-checklist',
    category: 'Sundays and notices',
    title: 'The Sunday checklist',
    icon: 'check',
    lead: 'The weekly jobs on Home, and how they get ticked.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Home has a card called **Sunday checklist** with the jobs that keep the website current each week. Three tick themselves when the website can see they are done:',
      },
      {
        kind: 'bullets',
        items: [
          "**Sunday's sermon preview**: a post filed under Sermon Preview is published this week.",
          '**A blog post this week**: a post dated this week is published.',
          '**Banners that have ended**: none is still switched on past its last day.',
        ],
      },
      {
        kind: 'p',
        text: "The website cannot see inside YouTube or Church Trac, so **Sunday's livestream** and **this week's events** have a box you tick yourself. Ticks start fresh every Monday.",
      },
      { kind: 'shot', key: 'home-checklist' },
      {
        kind: 'seealso',
        items: ['What Home in the Studio shows you', "Post Sunday's sermon preview"],
      },
    ],
  },
  {
    slug: 'share-a-preview',
    category: 'Start here',
    title: 'Show someone a page before it goes live',
    icon: 'preview',
    lead: 'A private link to your draft that works for a few days, no login needed.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Sometimes you want a second pair of eyes on a page before you publish it, from the pastor or a ministry leader. **Share a preview** makes a private link that shows your unpublished changes to that one page. The person opening it does not need a Studio login.',
      },
      {
        kind: 'steps',
        items: [
          'Open the page you are working on.',
          'Open the menu next to `Publish` and choose `Share a preview`.',
          'Pick how long the link should work: 1, 3, 7 or 14 days.',
          'Make the link, copy it and paste it into an email or a message.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'The link is shown once.',
        text: 'Copy it straight away. If you lose it, make a new one. To stop a link early, open `Share a preview` again and press `Stop this link`.',
      },
      { kind: 'seealso', items: ['Change a page: its words and its sections'] },
    ],
  },
);

// ── The authoring kit (PORTS.md card 109) ────────────────────────────────────
guides.push(
  {
    slug: 'page-templates',
    category: 'Start here',
    title: 'Make a new page from a template',
    icon: 'page',
    lead: 'Start from a ready-made page, then change the words.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Go to `Pages`, then `All other pages`, and press the `+` button at the top of the list.',
          'Pick a starting point. They are grouped: Visitors (a special service, an event), Ministries, Life events (baptism, membership, funerals), Church year (Christmas, Easter, VBS and more), News and records, and Blank.',
          'Give the page a title and press `Generate` beside the web address.',
          'Go through the sections and replace every line that starts with **Example:**. A yellow note marks each one until you do.',
          'Add the photos, then `Publish`. To put the page in the menu, see the guide on menus in Site settings.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Times and addresses fill themselves in.',
        text: 'Where a template says {service time}, {address} or {phone}, leave it as it is: the website fills it in from Site settings.',
      },
      { kind: 'seealso', items: ['Reuse a section on other pages'] },
    ],
  },
  {
    slug: 'reuse-sections',
    category: 'Start here',
    title: 'Reuse a section on other pages',
    icon: 'savedSection',
    lead: 'Build a section once, then drop it onto any page as a copy.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A **saved section** is a section, or a few sections that belong together, kept so you can add it again. Saved sections live under `Pages`, then `Saved sections`. Some are ready for the church year: Advent and Christmas, Holy Week and Easter, Vacation Bible School and more.',
      },
      { kind: 'h', text: 'Add one to a page' },
      {
        kind: 'steps',
        items: [
          'Open the page and scroll to its sections.',
          'Click `Insert a saved section` under the list.',
          'Pick one and click `Add a copy`. It goes at the bottom of the page; drag it where you want it.',
          'Replace any line that starts with **Example:**, then `Publish`.',
        ],
      },
      { kind: 'h', text: 'Save one of your own' },
      {
        kind: 'steps',
        items: [
          'Open the page that has the section you like.',
          'Open the menu next to `Publish` and choose `Save a section as preset...`.',
          'Pick the section, give it a name you will recognize, and save.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'A copy is yours to change.',
        text: 'Changing a copied section on one page never changes the saved section or any other page. For one section that stays the same everywhere, use a synced section.',
      },
      { kind: 'seealso', items: ['Keep a section the same on every page'] },
    ],
  },
  {
    slug: 'synced-sections',
    category: 'Start here',
    title: 'Keep a section the same on every page',
    icon: 'arrow',
    lead: 'Edit it once and every page that uses it changes.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A **synced section** shows a saved section, live. The words live in the saved section: change it, publish it, and every page using it changes together. Good for a band that must say the same thing everywhere.',
      },
      {
        kind: 'steps',
        items: [
          'Make and publish the saved section first.',
          'Open a page and click `Insert a saved section` under its sections.',
          'Pick the saved section and click `Add synced`.',
          'To change it everywhere, open it under `Pages`, then `Saved sections`, edit it and `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Changing it changes it everywhere.',
        text: 'That is the point, but check which pages use it first. If one page needs different words, remove the synced section from that page and add a copy instead.',
      },
      { kind: 'seealso', items: ['Reuse a section on other pages'] },
    ],
  },
);

// ── The weekly and monthly jobs (2026-10-19, docs/agent/studio-plan.md) ─────
// One guide per job in the plan that had none. Pictures are { kind: 'shot' }
// keys from ./shots.ts; the plan says which guides also want a video.
guides.push(
  {
    slug: 'sermon-preview',
    category: 'Sundays and notices',
    title: "Post Sunday's sermon preview",
    icon: 'scripture',
    lead: 'A few lines each week, and the home page names Sunday’s sermon from them.',
    video: 'sermon-preview',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The sermon preview is the one job most weeks have. It goes on the Blog, and the top of the home page uses it to say what Sunday’s sermon is, which passage it is on and who is preaching. The quickest way is from your phone.',
      },
      { kind: 'h', text: 'From your phone' },
      {
        kind: 'steps',
        items: [
          'Open the Studio and tap `Quick update` (on Home it is also a button on the Sunday checklist).',
          "Tap `Post Sunday's sermon preview`.",
          "Type the sermon's title, the Bible passage, who is preaching and a sentence or two about it.",
          'Add more if you like. Leave a blank line between paragraphs.',
          'Tap `Post the preview`. It is on the Blog and the home page in a few minutes.',
        ],
      },
      { kind: 'shot', key: 'quick-sermon-form' },
      { kind: 'h', text: 'Which Sunday it is for' },
      {
        kind: 'p',
        text: 'The website files a preview under the first Sunday on or after its `Date`. Post it any day from Monday to Sunday morning and it is for that Sunday. Posting it early in the week is fine, and gives people time to read the passage.',
      },
      { kind: 'h', text: 'The Bible passage' },
      {
        kind: 'p',
        text: 'Type it as book, chapter and verses, like "John 6:35-40" or "Psalm 23:1-6". The home page and the post’s page pick the first one they find in the opening lines, so keep it at the top.',
      },
      { kind: 'h', text: 'Who is preaching' },
      {
        kind: 'p',
        text: 'The name in `Author` prints under the title, and the home page names that person as the preacher. Leave it empty, or use the church’s name, and no preacher is named.',
      },
      { kind: 'h', text: 'Filing it as a sermon preview' },
      {
        kind: 'p',
        text: 'A post counts as a sermon preview because its `Categories` include "Sermon Preview". The phone form does this for you. If you write one in the full editor, add that category, or the home page will not name the sermon.',
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Adding a picture or fixing a word',
        text: 'After posting, tap `Open it in the full editor`, or find it under `Blog`, then `Posts`. Change what you need and press `Publish` again.',
      },
      {
        kind: 'seealso',
        items: ['Add a blog post or a sermon preview', 'What the home page fills in by itself'],
      },
    ],
  },
  {
    slug: 'visitor-newsletter',
    category: 'Sundays and notices',
    title: "Add this month's Visitor",
    icon: 'download',
    lead: 'Pick the month and year, upload the PDF. The website draws its cover.',
    video: 'visitor-newsletter',
    diy: 'self',
    body: [
      { kind: 'h', text: 'From Quick update' },
      {
        kind: 'steps',
        items: [
          "Open `Quick update` and tap `Add this month's Visitor`.",
          'Pick the month. It starts on this month.',
          'Check the year and choose the PDF of the issue.',
          'Press `Add it to The Visitor`. It is on The Visitor page and the home page in a few minutes.',
        ],
      },
      { kind: 'shot', key: 'quick-visitor-form' },
      { kind: 'h', text: 'Or on the page itself' },
      {
        kind: 'path',
        items: ['Pages', 'All other pages', 'The Visitor', 'The Visitor'],
        link: { doc: 'page-visitor', type: 'page' },
      },
      {
        kind: 'steps',
        items: [
          "On Home, press `Add this month's Visitor`. It opens The Visitor page at the list of issues.",
          'Click `Add item` at the bottom of the list.',
          'Type the month as a word in `Title`, like "November", and the `Year`, like "2026".',
          'Under `File`, click `Upload` and pick the PDF of the issue.',
          'Close the little window and press `Publish`.',
        ],
      },
      { kind: 'shot', key: 'visitor-issues' },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'The newest issue goes to the top by itself.',
        text: 'The website sorts the issues by month and year, shows the newest on the home page and draws each cover from the first page of the PDF. Nothing to tick, nothing to move.',
      },
      {
        kind: 'p',
        text: '_The title must be just the month’s name. "November 2026 issue" will not sort, because the website reads the month from it._',
      },
      { kind: 'seealso', items: ['What the home page fills in by itself'] },
    ],
  },
  {
    slug: 'this-week-change',
    category: 'Sundays and notices',
    title: 'Snow days and changes this week',
    icon: 'place',
    lead: 'A red line across the top of every page that takes itself down after Sunday.',
    video: 'announcement',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open the Studio on your phone and tap `Quick update`.',
          'Tap `Cancel or change something this week`.',
          'Type what is changing in one sentence, like "No Wednesday Night Live this week because of the snow."',
          'Tap the button at the bottom.',
        ],
      },
      { kind: 'shot', key: 'quick-update-tiles' },
      {
        kind: 'p',
        text: 'The banner is red, sits above the menu on every page, and comes down by itself after the coming Sunday. For news that should stay up longer, or should link somewhere, use `Put up a banner` instead and pick the last day.',
      },
      {
        kind: 'callout',
        tone: 'careful',
        title: 'Leave the service time alone.',
        text: 'For one Sunday that is different, a banner is the right tool. Change the `Service time` in Site settings only when the time changes for good.',
      },
      {
        kind: 'seealso',
        items: ['Put a notice across the top of every page', 'Quick update from your phone'],
      },
    ],
  },
  {
    slug: 'post-a-photo',
    category: 'Pictures',
    title: 'Post a photo from your phone',
    icon: 'image',
    lead: 'Straight from the camera to a page’s gallery or a new blog post.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open the Studio on your phone and tap `Quick update`, then `Post a photo`.',
          'Take a photo or pick one from your phone.',
          'Describe it in a sentence, like "Children decorating pumpkins in Fellowship Hall". This is read aloud to people who cannot see it.',
          'Choose where it goes: a gallery on one of the pages, or a new blog post.',
          'It is saved as a draft. Open it, check it, and press `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'careful',
        title: 'Children need a parent’s permission first.',
        text: 'Only post a photo of a child when the church has a parent’s permission on file, and never add a child’s name.',
      },
      { kind: 'seealso', items: ['Add or change a photo'] },
    ],
  },
  {
    slug: 'livestream',
    category: 'Sundays and notices',
    title: "Sunday's livestream and last week's replay",
    icon: 'event',
    lead: 'The website finds both on YouTube by itself. Here is what it needs from you.',
    diy: 'mixed',
    body: [
      {
        kind: 'bullets',
        items: [
          '**Watch live**: the home page’s Watch live link goes to the church’s next scheduled stream. Schedule Sunday’s stream on YouTube during the week, and tick it on the Sunday checklist.',
          '**Last Sunday**: after the service, the website finds the recording on the church’s YouTube channel and shows it as last Sunday’s replay. It looks again on Sunday afternoon and Monday morning.',
          '**The YouTube channel**: the address is in Site settings, `Church details`, `YouTube channel`. Change it only if the church moves to a new channel.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Nothing to type in the Studio.',
        text:
          'If the replay is missing by Monday lunchtime, check the video is public on YouTube, then tell ' +
          SITE.contactName +
          '.',
      },
      { kind: 'seealso', items: ['The Sunday checklist', 'What the home page fills in by itself'] },
    ],
  },
  {
    slug: 'church-trac-content',
    category: 'Sundays and notices',
    title: 'What comes from Church Trac',
    icon: 'event',
    lead: "The calendar, the Kid's Corner and The Moose's Message are written in Church Trac, not here.",
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          "**What's On**: the events page reads the Church Trac calendar. Add or change an event in Church Trac.",
          "**The Kid's Corner** and **The Moose's Message**: the two ministry newsletters are pages in Church Trac. The website copies them in each morning.",
          '**Forms** (the connection card, prayer requests, sign-ups) are Church Trac forms. To put one on a page, see the guide below.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Changes show by the next morning.',
        text: 'The website rebuilds every morning and copies in what is in Church Trac then. A change you need sooner shows after anyone publishes anything in the Studio.',
      },
      {
        kind: 'seealso',
        items: ['Put a Church Trac form on a page', 'Links to giving, forms and sermons'],
      },
    ],
  },
  {
    slug: 'menus',
    category: 'Once in a while',
    title: 'Change the top menu or the footer',
    icon: 'link',
    lead: 'Rename a menu item, add a page to a dropdown, or change the footer links.',
    diy: 'mixed',
    body: [
      {
        kind: 'path',
        items: ['Site settings', 'Site settings', 'Menus'],
        link: { doc: 'siteSettings', field: 'navItems' },
      },
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then `Site settings` again, then the `Menus` tab.',
          '`Top menu` has the links along the top. "Our Church" and "News" are dropdowns: open one to see its links.',
          'To add a link, click `Add item`, type the `Label`, choose `A page on this site` and pick the page.',
          'Drag the dotted handle on the left of a row to move it.',
          'Publish, then look at the website on your phone too: the phone menu is the same list.',
        ],
      },
      {
        kind: 'p',
        text: 'The footer’s link columns are under the `Social media and footer` tab, in `Footer link columns`.',
      },
      {
        kind: 'callout',
        tone: 'careful',
        title: 'Keep the top menu short.',
        text: 'Six items fit on one line on a laptop. A new page usually belongs in one of the dropdowns.',
      },
      { kind: 'seealso', items: ['Make a new page from a template'] },
    ],
  },
);

/**
 * Which guides "Help for this page" shows for each document type (kit.config.ts
 * guide.forType, PORTS.md card 110). '*' is the fallback for anything unlisted.
 */
export const GUIDES_FOR_TYPE: Record<string, string[]> = {
  '*': ['edit-a-page', 'help-panel', 'undo-earlier'],
  homePage: ['home-page', 'edit-a-page', 'photos'],
  page: [
    'edit-a-page',
    'visitor-newsletter',
    'page-templates',
    'reuse-sections',
    'synced-sections',
    'share-a-preview',
    'photos',
    'old-web-addresses',
  ],
  journalPage: ['blog-post'],
  journalEntry: ['sermon-preview', 'blog-post', 'photos', 'undo-earlier'],
  journalCategory: ['blog-post'],
  staffMember: ['staff', 'photos'],
  ministry: ['ministries', 'photos'],
  churchTracForm: ['church-trac-forms', 'church-trac-content'],
  announcement: ['announcement', 'this-week-change', 'quick-update'],
  siteSettings: ['service-times', 'church-links', 'menus', 'livestream', 'website-status'],
  redirect: ['old-web-addresses'],
  sectionPreset: ['reuse-sections', 'synced-sections'],
};

/**
 * The "How to" chip on a field (kit.config.ts guide.forField, PORTS.md card 134):
 * the fields the office is most likely to get wrong (docs/agent/studio-plan.md,
 * 2026-10-19). A field NAME wins over its type, so only names that mean one
 * thing everywhere are listed. At most 16 (studio-guides.test.ts).
 */
export const GUIDE_FOR_FIELD: FieldGuideMap = {
  fields: {
    categories: { guide: 'sermon-preview', section: 'Filing it as a sermon preview' },
    author: { guide: 'sermon-preview', section: 'Who is preaching' },
    publishedAt: { guide: 'sermon-preview', section: 'Which Sunday it is for' },
    excerpt: { guide: 'blog-post' },
    slug: { guide: 'blog-post', section: 'The web address' },
    endDate: { guide: 'announcement', section: 'Taking it down' },
    serviceTime: { guide: 'service-times' },
    givingUrl: { guide: 'church-links', section: 'Changing where a link goes' },
    churchTracUrl: { guide: 'church-trac-content' },
    youtubeUrl: { guide: 'livestream' },
    navItems: { guide: 'menus' },
    showOnSite: { guide: 'staff', section: 'When someone leaves, or is away for a while' },
    contacts: { guide: 'ministries', section: 'When a coordinator changes' },
    alt: { guide: 'photos', section: 'Why every photo needs a description' },
    // The "Documents to download" section's list: The Visitor's issues live in one.
    docs: { guide: 'visitor-newsletter' },
  },
  types: {},
};
