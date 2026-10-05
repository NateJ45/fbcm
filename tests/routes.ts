import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// EXPECTED TO DIFFER PER SITE. Every other file in tests/ is a canonical copy
// carried by the whole family; this one is the list of routes THIS repo builds,
// and it changes with src/pages.
//
// Single source of truth for the starter's public, statically-known routes.
// Every path below was verified against dist/client after `npm run build`.
//
// CHURCH EDITS MUST NOT REDDEN CI (2026-10-05, .claude/rules/tests-and-gates.md).
// Most of this list is the site's own pages, which only code can add or remove.
// The blog archive's category and tag pages are the exception: they exist only
// while some post carries that category or tag, and the secretary re-files posts
// whenever he likes. So the one category and the one tag below are PICKED from
// the build (BLOG_CATEGORY, BLOG_TAG): the preferred name when it was built,
// else the first one that was. Smoke, axe, contrast, reflow and headings keep
// their coverage of an archive page's shapes, and nothing names a taxonomy term
// the church could retire.
//
// Deliberately absent:
//   /[slug] and /post/[slug]      dynamic, and build zero paths with no
//                                 Sanity project configured (which is how the
//                                 starter builds by default)
//   /studio, /preview/**,
//   /api/draft-mode/*             SSR only, never emitted into dist/client
//   the two module routes         events and resources are staged under
//                                 modules/, opt-in, and not built. The other
//                                 eleven modules moved to archive/modules/ on
//                                 2026-09-18 and are not staged at all.
//   /404                          reachable as 404.html, not as a route

const DIST = resolve(process.cwd(), 'dist/client');

/** Built folders under dist/client/<sub> that hold a page, sorted. [] with no build. */
function builtDirs(sub: string): string[] {
  try {
    return readdirSync(join(DIST, sub), { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(DIST, sub, d.name, 'index.html')))
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

/** `preferred` when it was built (or nothing was built yet), else the first that was. */
function pick(sub: string, preferred: string): string {
  const dirs = builtDirs(sub);
  return dirs.length === 0 || dirs.includes(preferred) ? preferred : dirs[0];
}

/** A blog category that exists in this build: 'sermon-preview' while the church has it. */
export const BLOG_CATEGORY = pick('blog/category', 'sermon-preview');
/** A blog tag that exists in this build: 'advent' while the church has it. */
export const BLOG_TAG = pick('blog/tag', 'advent');

/** Whether the category has a second archive page (it needs more than one page of posts). */
const categoryHasPage2 =
  builtDirs('blog/category').length === 0 ||
  existsSync(join(DIST, 'blog/category', BLOG_CATEGORY, 'page/2/index.html'));

/** Routes that render real content and must pass every check. */
export const routes: string[] = [
  '/',
  '/contact',
  '/blog', // scaffold: journal
  // The archive's other four shapes (plan 2b task 15). One of each, not all of
  // them: 12 archive pages, 5 categories and 217 tags are one page with four
  // titles, and a suite that screenshots 234 copies of it proves nothing extra.
  '/blog/page/2', // scaffold: journal
  `/blog/category/${BLOG_CATEGORY}`, // scaffold: journal
  ...(categoryHasPage2 ? [`/blog/category/${BLOG_CATEGORY}/page/2`] : []), // scaffold: journal
  `/blog/tag/${BLOG_TAG}`, // scaffold: journal
  '/blog/scripture', // scaffold: journal
  '/privacy',
  // The styleguide (Task 6, 2026-09-19): fixed-data wall the visual-regression
  // suite screenshots. Listed here so it also gets smoke, axe light/dark,
  // contrast and reflow coverage like every other route, not just pixels.
  '/styleguide',
  // The plan-2b pages are listed here as they land.
  '/visit',
  '/who-we-are',
  '/beliefs',
  '/ministries',
  '/staff',
  '/history',
  '/wedding',
  '/give',
  // The architecture page (2026-10-03): out of the menu, but a real page.
  '/architecture',
  // The Visitor's page, composed from its seed module and rendered from the
  // committed fixture until /visitor is published (2026-09-24). Here it gets
  // smoke, axe, contrast and reflow at 320 with and without real scrollbars.
  '/styleguide/visitor', // scaffold: church
  // The composed /visit (the visitor audit, 2026-09-25), rendered from the
  // committed fixture until the page is applied; delete with the fixture.
];

/**
 * Routes that must answer 200 but are not expected to render a full page.
 *
 * Empty here. The sibling repos use this for the meta-refresh stubs Astro
 * bakes when a section is switched off in Sanity; the starter has no Sanity
 * project, so nothing is switched off and nothing stubs out. Keep the export:
 * smoke and reflow read it, and a project that hides a section will want it.
 */
export const hiddenRoutes: string[] = [];

/** Every route that should return HTTP 200, whether or not it renders content. */
export const allRoutes: string[] = [...routes, ...hiddenRoutes];

/**
 * Prerendered routes that carry a form, for the focus-indicator check in
 * a11y-dark.spec.ts (removed from FBCM 2026-09-24: the site is light-only, and
 * this list is empty because there is no form). It lives here rather than in that spec so the spec stays
 * byte-identical across the family; only this file knows which pages a given
 * site puts a form on. /contact is the starter's only one. A project that
 * enables the lead-magnet module gets a form on /guides/[slug]; add it here
 * once a guide is published and that route builds.
 */
export const FORM_ROUTES: string[] = [];
