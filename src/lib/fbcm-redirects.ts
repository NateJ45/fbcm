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
  'michelle-heimlich',
  // Added 2026-09-20 (task 16). The church links to /team/james-heimlich from
  // family-division.json, which calls him "James Heimlich, our Ministry
  // Resident". No such page was ever captured, and the profile on staff today
  // is andy-heimlich, so this lands on /staff rather than guessing at an
  // anchor for a person the page may not name.
  'james-heimlich',
];

/**
 * The 17 profiles that exist today and fold into /staff.
 *
 * Exported (not just used below) so fbcm-redirects.test.ts can check it against
 * the team-*.json files captured in scripts/data/pages/ -- that capture is the
 * source of truth for who is on staff, and this list is a hand-maintained copy
 * of it. Two hand-maintained copies of the same list is exactly how a redirect
 * quietly stops covering a page, so the test keeps them from drifting apart.
 * FORMER_STAFF is deliberately excluded from that check: those five pages are
 * already gone from the live site (found via Search Console and the Internet
 * Archive, not a crawl), so they were never captured and never will be.
 *
 * julie-kirklin is the one entry here with the opposite problem: she is on
 * staff today (added by scripts/set-staff-groups.mjs, plan 2b task 3) but
 * never had her own /team/ page on Wix -- she only appears as a name and role
 * on the ministers page -- so there is no team-julie-kirklin.json to check
 * her against either. The drift-check test excludes her by name for that
 * reason, the same way it excludes FORMER_STAFF, just from the other
 * direction.
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
  'julie-kirklin',
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

/**
 * Wix's tag-index URLs, found in the church's own words inside their own posts
 * when task 16 restored the in-body links (2026-09-20). This site has no
 * equivalent index page -- it uses /blog/tag/<tag> per tag -- and two of the
 * three are page NUMBERS on a paginated tag list, which map to nothing at all.
 * They all land on the blog index, which is the honest nearest thing.
 *
 * Three explicit rules rather than one wildcard, because the redirect layer has
 * none: `normalizeRedirectPath` treats "*" as an ordinary path character and
 * Astro's `redirects` map is keyed on exact paths. A rule that looks like a
 * pattern and matches literally is worse than three rules that say what they do.
 */
const BLOG_HASHTAGS = ['2', '3', 'Barbenheimer'];

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
    {
      // The church links to /about-us from their own posts; the page is gone
      // and /who-we-are is what replaced it.
      from: '/about-us',
      to: '/who-we-are',
      permanent: true,
      note: 'Renamed to Who we are',
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
      // /visitor since 2026-09-24 (feat/the-visitor). The live redirect
      // document is moved by scripts/set-visitor-redirect.mjs (backup first,
      // dry by default), after the /visitor page is published.
      to: '/visitor',
      permanent: true,
      note: 'The Visitor has its own page',
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
    ...BLOG_HASHTAGS.map((h) => ({
      from: `/blog/hashtags/${h}`,
      to: '/blog',
      permanent: true,
      note: 'Wix tag index; this site has no equivalent page, so it lands on the archive',
    })),
    ...BLOG_CATEGORIES.map((c) => ({
      from: `/blog/categories/${c}`,
      to: `/blog?category=${c}`,
      permanent: true,
      note: 'Category listing moved onto the blog index',
    })),
  ];
}
