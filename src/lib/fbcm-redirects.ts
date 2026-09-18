// src/lib/fbcm-redirects.ts
// Every URL the Wix site served that this site does not. Pure data plus a couple
// of generated groups, so the test can check the shape of the whole set.
//
// astro.config.mjs turns published `redirect` documents into Astro's redirects
// map at BUILD time (see src/lib/redirects.ts), so these are real 301s.

export interface FbcmRedirect {
  from: string;
  to: string;
  permanent: boolean;
  note: string;
}

/** Staff whose pages are gone from the live site but still earn search clicks. */
const FORMER_STAFF = [
  'emily-anderson',
  'janis-wright',
  'deena-green',
  'jennifer-durke',
  'leslie-pannell',
];

/**
 * The 16 profiles that exist today and fold into /staff.
 *
 * Exported (not just used below) so fbcm-redirects.test.ts can check it against
 * the team-*.json files captured in scripts/data/pages/ -- that capture is the
 * source of truth for who is on staff, and this list is a hand-maintained copy
 * of it. Two hand-maintained copies of the same list is exactly how a redirect
 * quietly stops covering a page, so the test keeps them from drifting apart.
 * FORMER_STAFF is deliberately excluded from that check: those five pages are
 * already gone from the live site (found via Search Console and the Internet
 * Archive, not a crawl), so they were never captured and never will be.
 */
export const CURRENT_STAFF = [
  'andy-heimlich',
  'caroline-koby',
  'cheryl-flaherty',
  'cynthia-smith',
  'dana-davis',
  'ed-brzak',
  'ella-mae-lemen',
  'jaden-johnson',
  'joe-songer',
  'jonathan-balmer',
  'kendall-ellis',
  'loraine-garrett',
  'molly-flodder',
  'nina-oisten',
  'sally-butler',
  'sandi-brzak',
];

/** The five with real bios get their own anchor on /staff. */
const STAFF_WITH_BIOS = new Set([
  'cynthia-smith',
  'kendall-ellis',
  'jonathan-balmer',
  'loraine-garrett',
  'molly-flodder',
]);

const MINISTRIES = ['worship', 'children', 'youth', 'adult', 'outreach'];
const BLOG_CATEGORIES = [
  'sermon-preview',
  'fbcm-events-1',
  'series-resources',
  'ruminations',
  'church-resources',
  'pianist',
];

export function fbcmRedirects(): FbcmRedirect[] {
  return [
    { from: '/what-to-expect', to: '/visit', permanent: true, note: 'Merged into Visit' },
    {
      from: '/accessibility',
      to: '/visit#accessibility',
      permanent: true,
      note: 'Merged into Visit',
    },
    { from: '/architecture', to: '/visit#building', permanent: true, note: 'Merged into Visit' },
    {
      from: '/baptists',
      to: '/beliefs#baptists',
      permanent: true,
      note: 'Merged into Beliefs',
    },
    {
      from: '/membership',
      to: '/beliefs#membership',
      permanent: true,
      note: 'Merged into Beliefs',
    },
    { from: '/ministers', to: '/staff', permanent: true, note: 'Renamed to Staff' },
    { from: '/team', to: '/staff', permanent: true, note: 'Renamed to Staff' },
    {
      from: '/reservation',
      to: '/wedding',
      permanent: true,
      note: 'Merged into Weddings and Building Use',
    },
    {
      from: '/publications',
      to: '/blog#publications',
      permanent: true,
      note: 'Newsletters moved into the archive',
    },
    {
      from: '/church-app',
      to: '/contact',
      permanent: true,
      note: 'App links now live on Contact',
    },
    ...MINISTRIES.map((m) => ({
      from: `/${m}`,
      to: `/ministries#${m}`,
      permanent: true,
      note: 'Merged into Ministries',
    })),
    ...CURRENT_STAFF.map((s) => ({
      from: `/team/${s}`,
      to: STAFF_WITH_BIOS.has(s) ? `/staff#${s}` : '/staff',
      permanent: true,
      note: 'Staff profiles consolidated onto one page',
    })),
    ...FORMER_STAFF.map((s) => ({
      from: `/team/${s}`,
      to: '/staff',
      permanent: true,
      note: 'Former staff; page already gone from Wix but still earning search clicks',
    })),
    ...BLOG_CATEGORIES.map((c) => ({
      from: `/blog/categories/${c}`,
      to: `/blog?category=${c}`,
      permanent: true,
      note: 'Category listing moved onto the blog index',
    })),
  ];
}
