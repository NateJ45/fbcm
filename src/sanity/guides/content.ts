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

export type DiyLevel = 'self' | 'ask' | 'mixed';

/** Where a "Where in the Studio" breadcrumb can link to. */
export type PathLink = { doc: string; type?: string } | { pane: string } | { tool: string };

export type GuideBlock =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'path'; items: string[]; link?: PathLink }
  | {
      kind: 'callout';
      tone?: 'primary' | 'positive' | 'caution' | 'critical' | 'default';
      title?: string;
      text: string;
    }
  | { kind: 'seealso'; items: string[] };

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
  'When something is wrong',
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export interface Guide {
  slug: string;
  category: GuideCategory;
  title: string;
  icon: string;
  lead: string;
  diy: DiyLevel;
  body: GuideBlock[];
}

export const guides: Guide[] = [
  // ── Start here ────────────────────────────────────────────────────────────
  {
    slug: 'start-here',
    category: 'Start here',
    title: 'Start here: how this all works',
    icon: '👋',
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
          '**Pages**: Home, and every other page of the site (Visit, Who We Are, Beliefs, Ministries, Staff, History, Wedding, Give, Contact).',
          '**Blog**: the posts, including the sermon previews, and their categories.',
          '**People**: the staff members shown on the Staff page.',
          '**Ministries**: see the ministries guide before you edit these.',
          '**Site settings**: the service time, the address, office hours, the menus, the notice banner and old web addresses.',
          '**Help**: these guides.',
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
    icon: '📄',
    lead: 'Every page is a stack of bands. You edit what is in each band, and the order they come in.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'How a page is built' },
      {
        kind: 'p',
        text: 'Each page is a stack of **sections**, one band on top of the next: an opening band, a band of text beside a photo, a band of questions and answers, and so on. You choose what goes in each band. You do not choose colours or spacing: the design sets those from where the band sits on the page, which is why the site stays consistent whoever edits it.',
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
      { kind: 'h', text: 'Moving, adding and removing bands' },
      {
        kind: 'path',
        items: ['Pages', 'Visit, Who We Are, Beliefs, History', 'the page', 'Sections'],
      },
      {
        kind: 'bullets',
        items: [
          'The bands are listed in the `Sections` box (on Home it is called `Page layout`). Drag a band by its handle on the left to move it up or down.',
          'To add a band, click `Add item...` under the list and choose from the menu. There is a search box at the top of that menu. The `...` menu on a row also has `Add item before...` and `Add item after...`.',
          'To take a band off, open the `...` menu on its row and choose `Remove`. `Duplicate` in the same menu makes a copy of the band right below it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'There is no switch to hide a band for a while.',
        text: 'Taking a band off the page removes it. If you might want it back, save a copy first: click the `...` button beside `Publish`, choose `Save a section as preset...` and pick the band. It then waits under `Pages`, then `Saved sections`, and you can add it back from the `Saved sections` list in Presentation.',
      },
      { kind: 'h', text: 'Before you publish a big change' },
      {
        kind: 'p',
        text: 'The `...` button beside `Publish` also has `Check this page...`. It looks for photos with no description, empty bands and links that look wrong. It never stops you publishing; it just tells you.',
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
    icon: '🕰️',
    lead: 'One setting, and then the pages that repeat it.',
    diy: 'mixed',
    body: [
      { kind: 'h', text: 'First, Site settings' },
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
      {
        kind: 'p',
        text: 'That updates the line at the top of every page and the footer at the bottom of every page, including the "Today" and "This Sunday" line that changes with the day of the week. The office hours band on the Contact page also reads from here, so it follows by itself.',
      },
      { kind: 'h', text: 'Then, the pages that say it again' },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The time is also written into bands on other pages.',
        text: 'When the pages were built, the service time and the street address were typed into several bands as well. Those do not follow Site settings. If the time changes, they need changing by hand, or the site will say two different times.',
      },
      {
        kind: 'bullets',
        items: [
          '**Home**: the three short facts in the opening band ("Sundays"), and the first column of the Sunday times band.',
          '**Visit** (called "Plan a visit" in the page list): the opening band facts, the timeline, and the first column of "Doors, parking and access", including its sentence "Worship is at 10:45 AM each Sunday."',
          '**Contact**: the first column of the Sunday times band.',
          '**Ministries**: the Sunday row of the timeline.',
          '**Give**: the paragraph about giving in person during worship.',
          'The closing band at the foot of Plan a visit, What we believe, Ministries, Our history, Weddings and building use, Give, and Journal (the Blog page), which reads like "Sundays at 10:45 am. 309 East Adams Street."',
        ],
      },
      {
        kind: 'p',
        text: '_If the street address ever changes, the same bands carry it too, as do the opening band of Contact and the closing band of Staff._',
      },
      {
        kind: 'p',
        text: 'The quickest way through the list is `Presentation`: open each page, find the time, click it and retype it. Publish each page when it is right. _In that page list, pages go by their own titles, so Visit is "Plan a visit", Beliefs is "What we believe", History is "Our history" and the Blog page is "Journal"._',
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

  {
    slug: 'announcement',
    category: 'Sundays and notices',
    title: 'Put a notice across the top of every page',
    icon: '📣',
    lead: 'For a closing, a change of plan, or news everyone should see.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Site settings', 'Announcement banner'],
        link: { pane: 'siteSettings;announcement' },
      },
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then `Announcement banner`, then the `+` button to start a new one.',
          'Give it an `Internal name` so you can find it later, like "Snow closing, January". Visitors never see this.',
          'Type the `Message`. Keep it to one sentence.',
          'Pick a `Style`: `Info` for everyday news, `Highlight` for good news, `Urgent` (red) for a closing or a warning.',
          'If it should link somewhere, fill in `Link (optional)`.',
          'Check `Enabled` is on, then Publish.',
        ],
      },
      {
        kind: 'p',
        text: 'The notice sits above the menu on every page of the site. If more than one is switched on, the most urgent one shows.',
      },
      { kind: 'h', text: 'Taking it down' },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The dates only take effect at the next rebuild.',
        text: '`Show from (optional)` and `Hide after (optional)` are checked when the site rebuilds, and it rebuilds when anybody publishes anything. A notice whose date has passed can still be showing if nothing has been published since. To be sure it is gone, open it, switch `Enabled` off, and publish.',
      },
      { kind: 'seealso', items: ['Change the service time or the Sunday details'] },
    ],
  },

  // ── Blog, staff and ministries ────────────────────────────────────────────
  {
    slug: 'blog-post',
    category: 'Blog, staff and ministries',
    title: 'Add a blog post or a sermon preview',
    icon: '✍️',
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
          'Open `Blog`, then `Posts`, then the `+` button at the top of the list.',
          'Type the `Title`. Then click `Generate` beside `Slug` to make the post’s web address from the title.',
          'Write a short `Excerpt`: one or two sentences that appear on the Blog page under the title.',
          'Add a `Cover image` and fill in its `Alt text` (a sentence describing the picture).',
          'Under `Categories`, click `Add item` and choose one, like "Sermon Preview".',
          'Change `Author` to the name of whoever wrote it.',
          'Write the post in `Body`, below the other boxes.',
          'Publish.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Always check the Author box.',
        text: 'A new post starts with "Your Name" in `Author`, and that is what the post will say under its title if it is left alone.',
      },
      {
        kind: 'bullets',
        items: [
          '`Published at` fills itself in with today. Change it only if the post belongs to another date.',
          '`Tags` are optional short labels, like "Advent" or "Mark". Press Enter after each one.',
          'To see the post before you publish it, click `Presentation` at the top and open the post from there.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'A new category needs a moment’s thought.',
        text: 'Each category gets its own page on the site. Use the ones already there where you can, and add a new one under `Blog`, then `Categories`, only when a series will run for a while.',
      },
      { kind: 'seealso', items: ['Add or change a photo'] },
    ],
  },

  {
    slug: 'staff',
    category: 'Blog, staff and ministries',
    title: 'Add, change or remove a staff member',
    icon: '🧑‍🤝‍🧑',
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
          'Open `People`, then `Staff members`. Open a person to change them, or click `+` to add someone.',
          'Fill in `Name`, then click `Generate` beside `Web address`.',
          'Type their `Role` the way it should read, like "Pastor" or "Church Clerk".',
          'Add their `Email address` and `Phone number` if they want them shown.',
          'Choose their `Group`: `Pastors`, `Church Coordination Team`, or `Support and volunteer roles`.',
          'Add a `Photo` and a few lines in `About them` if you have them.',
          'Publish.',
        ],
      },
      {
        kind: 'p',
        text: 'The Staff page shows the pastors first, then the Church Coordination Team, then everyone else. Within a group, the smaller `Position in the list` number comes first.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Coordinators update the Ministries page too.',
        text: 'The "The people to talk to" band on the Ministries page lists everyone in the `Church Coordination Team` group. Change a coordinator here and that band follows by itself.',
      },
      { kind: 'h', text: 'When someone leaves' },
      {
        kind: 'p',
        text: 'Open them, click the `...` button beside `Publish`, and choose `Delete`. That takes them off the Staff page at the next rebuild. A deleted person cannot easily be brought back, so if they might return, copy their `About them` words somewhere safe first.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'There is no separate list of deacons yet.',
        text:
          'The site has staff, pastors and the Church Coordination Team, but no deacons list. If the church would like deacons shown, ask ' +
          SITE.contactName +
          ' rather than adding them as staff, so they can be shown the way the church wants.',
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
    icon: '🤝',
    lead: 'The Ministries page is a page like any other. Edit it there.',
    diy: 'mixed',
    body: [
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Edit the Ministries PAGE, not the Ministries list.',
        text:
          'There is a `Ministries` entry in the menu on the left, but the website does not read it at the moment. Changes made there will not appear anywhere. Until ' +
          SITE.contactName +
          ' connects it or removes it, everything a visitor sees about the ministries is on the Ministries page itself.',
      },
      {
        kind: 'path',
        items: ['Presentation', 'Ministries'],
        link: { tool: 'presentation' },
      },
      {
        kind: 'steps',
        items: [
          'Click `Presentation` at the top and choose the Ministries page from the list.',
          'Scroll to the ministry. Worship, Children, Youth, Adults and Outreach each have their own band.',
          'Click the words you want to change and type.',
          'Publish.',
        ],
      },
      { kind: 'h', text: 'When a coordinator changes' },
      {
        kind: 'bullets',
        items: [
          '**"The people to talk to" band** lists the Church Coordination Team from the staff members. Change the person under `People`, then `Staff members`, and this band follows by itself.',
          '**The closing lines of each ministry’s band** name the person to talk to about it. Those lines were typed in, so change them by hand on the Ministries page as well.',
        ],
      },
      { kind: 'seealso', items: ['Add, change or remove a staff member'] },
    ],
  },

  // ── Pictures ──────────────────────────────────────────────────────────────
  {
    slug: 'photos',
    category: 'Pictures',
    title: 'Add or change a photo',
    icon: '📷',
    lead: 'Where photos come from, and the one sentence each one needs.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open the page, post or person that holds the photo.',
          'On an empty photo box, click `Upload` for a new picture, or `Select` to choose one the church already has. On a box that already has a photo, the same choices are in the small menu at the photo’s top right: `Upload`, or `Media` to choose from the library.',
          'Fill in `Alt text`. See below.',
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
      { kind: 'h', text: 'What alt text is' },
      {
        kind: 'p',
        text: '**Alt text** is one plain sentence saying what is in the picture, for somebody who cannot see it. Screen readers read it aloud, it shows if the photo fails to load, and search engines read it. Describe what is happening, not the file: "the choir singing at the Christmas Eve service" rather than "IMG_4471".',
      },
      {
        kind: 'p',
        text: '_Staff photos have no alt text box. The person’s name, printed beside the photo, does that job._',
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
    icon: '↪️',
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
        link: { pane: 'siteSettings;redirect' },
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
    icon: '🛟',
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
        title: 'Leave "Publish automatically at" empty.',
        text:
          'Pages have a `Publish automatically at` box under the `Publishing` tab. It is not switched on for this site yet, so a page set to publish itself will stay a draft. Publish by hand, or ask ' +
          SITE.contactName +
          '.',
      },
      { kind: 'seealso', items: ['Start here: how this all works'] },
    ],
  },
];
