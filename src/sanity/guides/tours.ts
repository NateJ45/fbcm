// Safe to edit by hand
// =============================================================================
// The church's Studio tours, as DATA (2026-10-19, docs/agent/studio-plan.md)
// =============================================================================
// Written ahead of the starter's spotlight tours (card 137): popovers anchored
// to real Studio controls, a welcome modal on first sign-in and a "What's new"
// modal after a change. Nothing reads this file yet. When 137 lands, map each
// `anchor` below onto its anchor API and hand the tours to kit.config.ts; until
// then the first-run tour is the plain one in kit.config.ts `tourSteps`.
//
// ANCHORS are names for places in the Studio, not CSS selectors, so they read
// the same whatever 137 settles on:
//   navbar:<tool>          a top-bar tool ('quick-update', 'structure', ...)
//   home:<card>            a card on Home ('banner', 'checklist', 'live', ...)
//   quick:<form id>        a tile on Quick update; quick:<form id>.<field> a box
//   pane:<desk id path>    a desk list ('blog;journalEntry')
//   doc:publish            the editor's Publish button; doc:menu its "..." menu
//   doc:help               the "Help for this page" button beside a document
//   doc:field:<path>       a field in the open editor
//   null                   no anchor: the popover sits in the middle
//
// WHO: 'everyone', 'office' (the church office, the main editor) or 'pastor'
// (posts the sermon preview). WHEN: 'first-run' (shown once, on first sign-in)
// or 'on-demand' (started from its guide or the Site Guide's Tours list).
// The words follow the guides' rules: plain, warm, no em-dashes, `backticks`
// for a thing you click.
// =============================================================================

export type TourRole = 'everyone' | 'office' | 'pastor';
export type TourWhen = 'first-run' | 'on-demand';

export interface TourStepData {
  /** Where the popover points (see ANCHORS above); null for a centred card. */
  anchor: string | null;
  title: string;
  body: string;
}

export interface TourData {
  id: string;
  title: string;
  /** One line on the tour's card in the Site Guide. */
  lead: string;
  role: TourRole;
  when: TourWhen;
  /** The guide that offers this tour (guides/content.ts slug). */
  guide?: string;
  steps: TourStepData[];
}

/** The welcome modal, shown once before the first-run tour. */
export const WELCOME_MODAL = {
  title: 'Welcome to the church website’s Studio',
  body: 'This is where the website is kept up to date: the sermon preview, banners, the blog, The Visitor and every page. Nothing you do here reaches the website until you press Publish, so you can look around freely.',
  primary: 'Show me round (1 minute)',
  secondary: 'Not now',
};

/** The first "What's new" modal, for editors who used the Studio before 2026-10-19. */
export const WHATS_NEW = {
  id: '2026-10-quick-update',
  title: 'New: the weekly jobs from your phone',
  items: [
    "Quick update now posts Sunday's sermon preview, a short news post and a photo, as well as banners.",
    "Home has a button for adding this month's Visitor.",
    'Some boxes have a small How to button that opens the right page of the Site Guide.',
  ],
  primary: 'Open Quick update',
  secondary: 'Got it',
};

export const TOURS: TourData[] = [
  {
    id: 'welcome',
    title: 'A first look round',
    lead: 'Where everything is, in seven stops.',
    role: 'everyone',
    when: 'first-run',
    guide: 'start-here',
    steps: [
      {
        anchor: 'home:banner',
        title: 'This is Home',
        body: 'Home opens first every time. It shows what needs doing this week and whether your last change is on the website yet.',
      },
      {
        anchor: 'home:checklist',
        title: 'The Sunday checklist',
        body: 'The jobs that keep the website current each week. Most tick themselves when they are done, and the list starts fresh every Monday.',
      },
      {
        anchor: 'navbar:quick-update',
        title: 'Quick update, for your phone',
        body: 'The sermon preview, a banner, a snow day, a short news post or a photo: a few boxes and one button each.',
      },
      {
        anchor: 'navbar:structure',
        title: 'Content is where everything else lives',
        body: 'Every page, the blog, the staff, the ministries and Site settings, where the service time and the address are kept.',
      },
      {
        anchor: 'navbar:presentation',
        title: 'Live preview',
        body: 'The website as visitors will see it, with your unpublished changes in place. Click any words on it to change them.',
      },
      {
        anchor: null,
        title: 'Nothing is public until you press Publish',
        body: 'Your typing saves as a private draft. Press the green `Publish` button and the website updates itself in a few minutes.',
      },
      {
        anchor: 'navbar:site-guide',
        title: 'Help is one click away',
        body: 'The Site Guide has a page for every job, with pictures. Stuck? Home has a card for asking Nathan.',
      },
    ],
  },
  {
    id: 'sermon-preview',
    title: "Post Sunday's sermon preview",
    lead: 'From the phone, in under two minutes.',
    role: 'pastor',
    when: 'on-demand',
    guide: 'sermon-preview',
    steps: [
      {
        anchor: 'quick:sermon-preview',
        title: 'Start here',
        body: "Tap `Post Sunday's sermon preview`. The form opens on its own, with nothing else on the screen.",
      },
      {
        anchor: 'quick:sermon-preview.passage',
        title: 'The passage',
        body: 'Book, chapter and verses, like "John 6:35-40". The home page shows it beside the sermon.',
      },
      {
        anchor: 'quick:sermon-preview.preacher',
        title: 'Who is preaching',
        body: 'Their name prints under the title and on the home page. Leave it empty for no name.',
      },
      {
        anchor: 'quick:sermon-preview.summary',
        title: 'A sentence or two',
        body: 'Shown under the title on the Blog page and in Google.',
      },
      {
        anchor: 'quick:sermon-preview.submit',
        title: 'Post it',
        body: 'It is on the Blog and the home page in a few minutes, filed under this coming Sunday.',
      },
    ],
  },
  {
    id: 'snow-day',
    title: 'A snow day or a change this week',
    lead: 'A red banner that takes itself down after Sunday.',
    role: 'office',
    when: 'on-demand',
    guide: 'this-week-change',
    steps: [
      {
        anchor: 'quick:this-week',
        title: 'Cancel or change something this week',
        body: 'For one week only: a closing, a cancelled study, a joint service.',
      },
      {
        anchor: 'quick:this-week.message',
        title: 'One sentence',
        body: 'Say what is changing and when, like "No Wednesday Night Live this week because of the snow."',
      },
      {
        anchor: 'quick:this-week.submit',
        title: 'That is all',
        body: 'The banner is up in a few minutes and comes down by itself after Sunday. Nothing to remember.',
      },
    ],
  },
  {
    id: 'visitor',
    title: "Add this month's Visitor",
    lead: 'The month, the year and the PDF.',
    role: 'office',
    when: 'on-demand',
    guide: 'visitor-newsletter',
    steps: [
      {
        anchor: 'home:quick-action:visitor',
        title: 'Start on Home',
        body: "Press `Add this month's Visitor`. It opens The Visitor page at its list of issues.",
      },
      {
        anchor: 'doc:field:pageBuilder[_key=="visitor-issues"].docs',
        title: 'Add an issue',
        body: 'Click `+ Add item` at the bottom of the list.',
      },
      {
        anchor: 'doc:field:pageBuilder[_key=="visitor-issues"].docs.title',
        title: 'The month, as a word',
        body: 'Just "November", then the year in its own box. The website sorts the issues by them.',
      },
      {
        anchor: 'doc:field:pageBuilder[_key=="visitor-issues"].docs.file',
        title: 'The PDF',
        body: 'Click `Upload` and pick the file. The website draws the cover from its first page.',
      },
      {
        anchor: 'doc:publish',
        title: 'Publish',
        body: 'The new issue is on The Visitor page and the home page in a few minutes.',
      },
    ],
  },
  {
    id: 'a-page',
    title: 'Find your way round a page',
    lead: 'Sections, help for this page, and publishing.',
    role: 'office',
    when: 'on-demand',
    guide: 'edit-a-page',
    steps: [
      {
        anchor: 'doc:field:pageBuilder',
        title: 'A page is a stack of sections',
        body: 'Open one to change its words. Drag the dotted handle to move it. The design looks after colours and spacing.',
      },
      {
        anchor: 'doc:help',
        title: 'Help for this page',
        body: 'The guides for this kind of page, and a check for missing descriptions and broken links.',
      },
      {
        anchor: 'navbar:presentation',
        title: 'See it first',
        body: 'Live preview shows the page with your draft in place, before anyone else can see it.',
      },
      {
        anchor: 'doc:menu',
        title: 'Changed your mind?',
        body: '`Undo last change` and `Discard changes` are in the `...` menu beside `Publish`.',
      },
      {
        anchor: 'doc:publish',
        title: 'Publish when it reads right',
        body: 'The website rebuilds itself in a few minutes. Home says when it is live.',
      },
    ],
  },
];
