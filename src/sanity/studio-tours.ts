// Safe to edit by hand
// =============================================================================
// The church's Studio tours, welcome and "What's new" (PORTS.md card 137)
// =============================================================================
// Plain data, kept out of kit.config.ts so src/lib/studio-tour.test.ts can read
// it in bare Node and catch a typo (a welcome naming a tour that is not there,
// an em-dash, a date that is not a date). kit.config.ts passes these on as
// `tours`, `welcome` and `whatsNew`. Who edits and what each person does:
// docs/agent/studio-plan.md.
//
// Each stop's `anchor` is what gets the spotlight:
//   - a kit hook: 'home-banner', 'home-quick-actions', 'home-this-week',
//     'home-is-it-live', 'home-recent', 'home-help', 'quick-list', 'guide-index',
//     'guide-videos' (a data-tour attribute);
//   - a Quick update tile: 'quick:<form id>' ('quick:sermon-preview');
//   - a tool tab: 'tool:structure', 'tool:quick-update', 'tool:presentation',
//     'tool:site-guide';
//   - Sanity's own UI: 'publish', 'document-menu', 'document-form', 'pane:list'
//     (SANITY_ANCHORS in src/lib/studio-tour.ts).
// No anchor (or one not on screen): the popover sits in the middle.
// `goTo` opens a tool or a document first. The words follow the guides' rules:
// plain, warm, no em-dashes, and `Publish`-style names for things you press.
//
// WHO SEES WHAT. The office and the pastor are the staff view; Nathan has the
// full Studio. Every tour here is for everyone, because the staff view still
// has Home, Quick update, Content, Live preview and the Site Guide.
// =============================================================================

import type { TourDef, WelcomeConfig, WhatsNewEntry } from '../lib/studio-tour.ts';

export const TOURS: TourDef[] = [
  {
    id: 'first-run',
    title: 'A quick tour',
    firstRun: true,
    steps: [
      {
        anchor: 'home-banner',
        title: 'This is Home',
        short: 'Home',
        meaning: 'home',
        body: 'Home opens first every time. It shows the Sunday checklist, whether your last change is on the website yet, and anything that needs fixing.',
      },
      {
        anchor: 'home-this-week',
        title: 'The Sunday checklist',
        short: 'Checklist',
        meaning: 'step',
        body: 'The jobs that keep the website current each week. Most tick themselves when they are done, and the list starts fresh every Monday.',
      },
      {
        anchor: 'tool:quick-update',
        goTo: { tool: 'home' },
        title: 'Quick update, for your phone',
        short: 'Quick update',
        meaning: 'quickUpdate',
        body: 'The sermon preview, a banner, a snow day, a short news post, a photo or this month’s Visitor: a few boxes and one button each.',
      },
      {
        anchor: 'tool:structure',
        title: 'Content is where everything else lives',
        short: 'Content',
        meaning: 'content',
        body: 'Every page, the blog, the staff, the ministries and Church details, where the service time and the address are kept.',
      },
      {
        anchor: 'tool:presentation',
        title: 'Live preview',
        short: 'Preview',
        meaning: 'preview',
        body: 'The website as visitors will see it, with your unpublished changes in place. Click any words on it to change them.',
      },
      {
        title: 'Nothing is public until you press Publish',
        short: 'Publish',
        meaning: 'publishing',
        body: 'Your typing saves as a private draft. Press the green Publish button and the website updates itself in a few minutes. Quick update publishes for you, so read it over before you press its button.',
      },
      {
        anchor: 'tool:site-guide',
        title: 'Help is one click away',
        short: 'Help',
        meaning: 'help',
        body: 'The Site Guide has a page for every job, with pictures and short videos. Stuck? Home has a card for asking Nathan.',
      },
    ],
  },
  {
    id: 'home',
    title: 'How this screen works',
    tool: 'home',
    steps: [
      {
        anchor: 'home-quick-actions',
        title: 'The jobs you do most',
        meaning: 'post',
        body: 'Four big buttons: a blog post, the service time, a banner and this month’s Visitor. Quick update has the rest.',
      },
      {
        anchor: 'home-this-week',
        title: 'Sunday checklist',
        meaning: 'step',
        body: 'Each job ticks itself when it is done. The livestream and the Church Trac calendar live outside the website, so those two you tick by hand.',
      },
      {
        anchor: 'home-is-it-live',
        title: 'Is it live?',
        meaning: 'publishing',
        body: 'After you publish, this says when the website has caught up, usually within a few minutes.',
      },
      {
        anchor: 'home-recent',
        title: 'Recent edits',
        meaning: 'document',
        body: 'The last things anyone changed, newest first. Click one to open it again.',
      },
      {
        anchor: 'home-videos',
        title: 'Watch how it is done',
        meaning: 'guide',
        body: 'Short videos that show a job from start to finish, with captions and no sound needed.',
      },
    ],
  },
  {
    id: 'quick-update',
    title: 'How this screen works',
    tool: 'quick-update',
    steps: [
      {
        anchor: 'quick-list',
        title: 'One job per button',
        meaning: 'quickUpdate',
        body: 'Pick a job, fill in a few boxes and press the button at the bottom. Each one says what it did when it is finished.',
      },
      {
        anchor: 'quick:sermon-preview',
        title: "Sunday's sermon preview",
        meaning: 'scripture',
        body: 'The title, the passage, who is preaching and a sentence or two. It goes on the blog and names the sermon on the home page.',
      },
      {
        anchor: 'quick:notice',
        title: 'A banner, or a snow day',
        meaning: 'notice',
        body: 'A line across the top of every page. `Cancel or change something this week` makes a red one that comes down by itself after Sunday.',
      },
      {
        anchor: 'quick:visitor',
        title: "This month's Visitor",
        meaning: 'download',
        body: 'Pick the month, check the year and add the PDF. The cover is drawn from its first page, and the new issue leads The Visitor page.',
      },
      {
        anchor: 'quick:take-down-banner',
        title: 'Taking things back',
        meaning: 'restore',
        body: 'A banner you no longer want, or a staff member who is away, can be switched off here. Nothing is deleted.',
      },
    ],
  },
  {
    id: 'guide',
    title: 'How this screen works',
    tool: 'guide',
    steps: [
      {
        anchor: 'guide-index',
        title: 'A page for every job',
        meaning: 'guide',
        body: 'Search for what you want to do, or open a group. Each page has numbered steps with pictures, and a Print button.',
      },
      {
        anchor: 'guide-videos',
        title: 'Videos',
        meaning: 'preview',
        body: 'The short ones show a job from start to finish. Captions are on by default.',
      },
    ],
  },
  {
    id: 'visitor',
    title: "Add this month's Visitor",
    steps: [
      {
        anchor: 'quick:visitor',
        goTo: { tool: 'quick-update' },
        title: 'On your phone or at the desk',
        short: 'Quick update',
        meaning: 'download',
        body: "Press `Add this month's Visitor`, pick the month, check the year and choose the PDF. One button adds it.",
      },
      {
        anchor: 'document-form',
        goTo: { doc: 'page-visitor', type: 'page' },
        title: 'Or on the page itself',
        short: 'The page',
        meaning: 'pages',
        body: 'The Visitor page keeps its issues in a list near the top. Scroll to it, click `+ Add item` and fill in the month, the year and the file.',
      },
      {
        anchor: 'publish',
        title: 'Publish',
        short: 'Publish',
        meaning: 'publishing',
        body: 'On the page, press Publish. The new issue is on The Visitor page and the home page in a few minutes.',
      },
    ],
  },
  {
    id: 'a-page',
    title: 'Find your way round a page',
    steps: [
      {
        anchor: 'document-form',
        goTo: { doc: 'page-visit', type: 'page' },
        title: 'A page is a stack of sections',
        short: 'Sections',
        meaning: 'pages',
        body: 'Open one to change its words. Drag the dotted handle to move it. The design looks after colours and spacing.',
      },
      {
        anchor: 'tool:presentation',
        title: 'See it first',
        short: 'Preview',
        meaning: 'preview',
        body: 'Live preview shows the page with your draft in place, before anyone else can see it.',
      },
      {
        anchor: 'document-menu',
        title: 'Changed your mind?',
        short: 'Undo',
        meaning: 'restore',
        body: '`Discard changes` and `Duplicate` are in the `...` menu beside Publish. Earlier versions are under the clock.',
      },
      {
        anchor: 'publish',
        title: 'Publish when it reads right',
        short: 'Publish',
        meaning: 'publishing',
        body: 'The website rebuilds itself in a few minutes. Home says when it is live.',
      },
    ],
  },
];

export const WELCOME: WelcomeConfig = {
  title: 'Welcome to the church website’s Studio',
  body: 'This is where the website is kept up to date: the sermon preview, banners, the blog, The Visitor and every page. Nothing you do here reaches the website until you press Publish, so you can look around freely.',
  points: [
    'Home shows the Sunday checklist.',
    'Quick update does the weekly jobs from a phone.',
    'The Site Guide has pictures and short videos for every job.',
  ],
  tour: 'first-run',
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    date: '2026-10-19',
    title: 'The weekly jobs from your phone',
    items: [
      "Quick update now posts Sunday's sermon preview, a short news post, a photo and a banner.",
      "It also adds this month's Visitor, takes down a banner, shows or hides a staff member and changes the service time.",
      'Show me around, on Home and in the Site Guide, walks you through the editor.',
      'Some guides now have a short video showing the job.',
    ],
    tour: 'quick-update',
  },
  {
    date: '2026-10-19',
    title: "Adding this month's Visitor",
    items: [
      'Pick the month, check the year and choose the PDF. That is all.',
      'The cover is drawn from the first page of the file.',
    ],
    tour: 'visitor',
  },
  {
    date: '2026-10-19',
    title: 'Finding your way round a page',
    items: [
      'A page is a stack of sections you can open, move and change.',
      'Live preview and the Discard changes button let you try things first.',
    ],
    tour: 'a-page',
  },
];
