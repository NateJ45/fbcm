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

/**
 * The icon each guide shows, by NAME. src/sanity/guides/icons.ts maps each name
 * to an @sanity/icons component. Names rather than emoji since 2026-09-22:
 * Windows draws emoji small and inconsistently, and the rest of the desk uses
 * @sanity/icons, so the Help list now matches it. Kept as plain strings so
 * this file stays data and the unit test can import it without React.
 */
export const GUIDE_ICON_NAMES = [
  'bulb',
  'page',
  'clock',
  'bell',
  'edit',
  'users',
  'heart',
  'image',
  'arrow',
  'help',
] as const;
export type GuideIconName = (typeof GUIDE_ICON_NAMES)[number];

export interface Guide {
  slug: string;
  category: GuideCategory;
  title: string;
  icon: GuideIconName;
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
          '**Ministries**: each ministry’s words, photo and the people to talk to. The Ministries page reads from here.',
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
    icon: 'page',
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
      { kind: 'h', text: 'The building band and its dates' },
      {
        kind: 'p',
        text: 'The `Building band` is brown with a row of photos across the top. Give it `Dates` and it becomes the cream band from the home page instead: the first and last years large beside the heading, the `Photo` set straight onto the page (a drawing of the building suits it best), the `Old photograph` in an arched frame, and the dates listed underneath.',
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
    icon: 'clock',
    lead: 'Change it once, in Site settings, and every page follows.',
    diy: 'self',
    body: [
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
        kind: 'callout',
        tone: 'positive',
        title: 'That is the whole job.',
        text: 'The time, the address, the phone number and the email are kept in one place, Site settings. Every page that mentions them fills them in from there when the site rebuilds: the top and bottom of every page, the Sunday columns, the timelines, the closing bands, even the lines Google shows. Change it once and the whole site agrees.',
      },
      { kind: 'h', text: 'Words the site fills in for you' },
      {
        kind: 'p',
        text: 'Open a band that mentions the time and you will see something like `{time}` where the time goes. That is a **placeholder**: the site swaps it for the real value from Site settings. In `Presentation` you see the real value; in the box you see the placeholder. You can type these into any text box yourself:',
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
        text: '_Two times are not settings and are still typed where they appear: Sunday school at 9:30 am, and the fellowship hour (10:15 to 10:45), in the Youth band on the Ministries page and in the What to Expect band on the home page. If either changes, change it in both places._',
      },
      { kind: 'h', text: 'The brown band with the Sunday times' },
      {
        kind: 'p',
        text: 'The brown band that lists the Sunday times ("Doors, parking and access" on the Visit page, "Find us on Sunday" on the Contact page) is changed on its page in `Presentation`. Each row on it has a `Small label`, a `Big line` and a line of `Text`. The row whose time matches the `Service time` in Site settings is drawn largest, so it moves by itself when the time changes.',
      },
      {
        kind: 'bullets',
        items: [
          '`Introduction` is a sentence or two above the times.',
          '`Notes` are up to three short lines under the photo, like the nursery or communion.',
          '`Photos` takes one or two photos. The first is the larger. Leave it empty and the band borrows a photo from elsewhere on the same page.',
          '`Button (optional)` puts one button under the times. Leave it empty and the band shows the Google Maps directions button instead.',
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

  {
    slug: 'announcement',
    category: 'Sundays and notices',
    title: 'Put a notice across the top of every page',
    icon: 'bell',
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
        text: 'Open a link on a page or in a post and its address may read `{giving}` instead of a web address. That is a **link placeholder**: the site swaps it for the address in the matching box. Use one yourself whenever you link to one of these, by selecting the words, pressing `Link`, and typing the placeholder into the address box:',
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
        text: 'A placeholder only works on its own in a link’s address box, not in the middle of a sentence. A misspelled one shows a red warning under the box. Most empty boxes send the link to this website’s Contact page until you fill it in, so nobody lands on a broken page: `{giving}` goes to this site’s own `/give` page instead, `{wedding-enquiry}` and `{wedding-booking}` email the wedding office directly, and `{wednesday}` and `{contact-form}` are hidden (the words stay, the link does not) until their box is filled.',
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
    icon: 'edit',
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
          'Open `Church Trac forms` in the menu on the left and press the pencil to make a new one.',
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
    icon: 'edit',
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
          'Type the name of whoever wrote it in `Author`.',
          'Write the post in `Body`, below the other boxes.',
          'Publish.',
        ],
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
    icon: 'users',
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
          'Choose their `Group`: `Pastors`, `Church Coordination Team`, or `Support and volunteer roles`. Leave `Show on the Staff page` on.',
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
      { kind: 'h', text: 'When someone leaves, or is away for a while' },
      {
        kind: 'p',
        text: 'Open them and switch off `Show on the Staff page`, then publish. They come off the website at the next rebuild but stay in the Studio, marked "(hidden)" in the list, so switching it back on is all it takes if they return. Only `Delete` someone (in the `...` menu beside `Publish`) if you are sure they are not coming back.',
      },
      { kind: 'h', text: 'Deacons' },
      {
        kind: 'p',
        text: 'The deacons are not staff members. They are listed in the "Our deacons" band on the Staff page, under the group photograph, with the deacon chair’s email. To change the list, open the Staff page in `Presentation`, click the names and type. If the photograph changes, keep the "left to right" order of the names matching it.',
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
    icon: 'heart',
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
        text: 'Under `People to talk to`, remove the person who has stepped down and add the new one from the staff list. The line at the end of the ministry’s band ("Molly Flodder, Worship Coordinator, worship@fbcmuncie.org") is written from their staff details, so their name, role and email are always the ones on the Staff page.',
      },
      {
        kind: 'bullets',
        items: [
          'Someone new has to be a staff member first. Add them under `People`, then `Staff members`, then pick them here.',
          'The "The people to talk to" band near the foot of the Ministries page lists everyone in the `Church Coordination Team` group, and follows by itself too.',
          '_The Studio will not let you delete a staff member who is still named on a ministry. Take them off the ministry first._',
        ],
      },
      { kind: 'h', text: 'Photos and the rest of the page' },
      {
        kind: 'bullets',
        items: [
          'A ministry with no `Photo` shows its text on its own, full width. Adult and Outreach are like that today.',
          'Everything else on the Ministries page (the Sunday timeline, "Sunday, room by room", the parents’ questions) is ordinary page bands. Change those on the page in `Presentation`.',
        ],
      },
      { kind: 'seealso', items: ['Add, change or remove a staff member'] },
    ],
  },

  {
    slug: 'who-we-are',
    category: 'Blog, staff and ministries',
    title: 'Update the Who We Are page',
    icon: 'heart',
    lead: 'Four bands new to this page: the Watchword, Our goals, the Pledge, and the pastors’ letter.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Pages', 'Who We Are'],
        link: { pane: 'page' },
      },
      {
        kind: 'p',
        text: 'Like every page, open it in `Presentation` and click the words to edit them, or open the page document and add one of these four bands from the `Church` group in the "Add item" menu.',
      },
      { kind: 'h', text: 'Watchword (Praise and Proclaim)' },
      {
        kind: 'p',
        text: 'Our watchword: Isaiah 12:4, "Praise the Lord, proclaim his name." `Heading` is the band title ("Our Watchword"). `Short introduction` is two or three sentences shown beside the mark; `Read more` is the longer explanation, shown only when a visitor opens it. `Verse` is the verse itself, without quotation marks, and `Reference` is where it is from. The words **praise** and **proclaim** are highlighted in the verse automatically, so type them as ordinary words. `What "Praise" means` and `What "Proclaim" means` are one or two sentences each.',
      },
      { kind: 'h', text: 'Our goals (four bands)' },
      {
        kind: 'p',
        text: 'Up to four goals, each with its own colour: green, gold, purple, brown, in the order you list them. Each goal has a `Name` ("Worship"), a `Subtitle` ("Worshiping as the Body of Christ"), and an optional `In brackets` word ("Discipleship"). `Building drawing` picks which of the four goal drawings the band shows beside its words: window, door, lamp on a stand, or basin and towel. `Opening sentence` introduces the goal, and `Pull quote` is an optional short line shown large, normally on the second goal only.',
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
        text: 'A note from the pastors. `Heading` is the band title ("A Note From Our Pastors"). `Letter` is the body, written as ordinary paragraphs. `Signed` is how they sign it ("Kendall & Jonathan") and `Under the signature` is the line below that ("Co-Pastors, First Baptist Church Muncie"). `Portrait` is optional.',
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
          'Pages have a `Publish automatically at` box under the `Publishing` tab, for publishing a page at a set time. It is being switched on, and until ' +
          SITE.contactName +
          ' tells you it works, a page set to publish itself may stay a draft. Publish by hand until then.',
      },
      { kind: 'seealso', items: ['Start here: how this all works'] },
    ],
  },
];
