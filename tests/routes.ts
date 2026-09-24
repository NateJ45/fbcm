// EXPECTED TO DIFFER PER SITE. Every other file in tests/ is a canonical copy
// carried by the whole family; this one is the list of routes THIS repo builds,
// and it changes with src/pages.
//
// Single source of truth for the starter's public, statically-known routes.
// Every path below was verified against dist/client after `npm run build`.
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

/** Routes that render real content and must pass every check. */
export const routes: string[] = [
  '/',
  '/contact',
  '/blog', // scaffold: journal
  // The archive's other four shapes (plan 2b task 15). One of each, not all of
  // them: 12 archive pages, 5 categories and 217 tags are one page with four
  // titles, and a suite that screenshots 234 copies of it proves nothing extra.
  '/blog/page/2', // scaffold: journal
  '/blog/category/sermon-preview', // scaffold: journal
  '/blog/category/sermon-preview/page/2', // scaffold: journal
  '/blog/tag/advent', // scaffold: journal
  '/privacy',
  // The styleguide (Task 6, 2026-09-19): fixed-data wall the visual-regression
  // suite screenshots. Listed here so it also gets smoke, axe light/dark,
  // contrast and reflow coverage like every other route, not just pixels.
  '/styleguide',
  // The composed Who We Are page from its seed module, before it is applied
  // (src/pages/styleguide/who-we-are.astro, 2026-09-23).
  '/styleguide/who-we-are', // scaffold: church
  // And the composed home page (src/pages/styleguide/home.astro, 2026-09-23).
  '/styleguide/home', // scaffold: church
  // And the composed Visit page (src/pages/styleguide/visit.astro, 2026-09-24).
  '/styleguide/visit', // scaffold: church
  // And the composed wedding page (src/pages/styleguide/wedding.astro, 2026-09-24).
  '/styleguide/wedding', // scaffold: church
  // And the composed staff page (src/pages/styleguide/staff.astro, 2026-09-24).
  '/styleguide/staff', // scaffold: church
  // And the composed Give and Contact pages (src/pages/styleguide/give.astro and
  // contact.astro, 2026-09-24, the utility identity pass).
  '/styleguide/give', // scaffold: church
  '/styleguide/contact', // scaffold: church
  // And the composed history page (src/pages/styleguide/history.astro, 2026-09-24).
  '/styleguide/history', // scaffold: church
  // And the composed ministries page (src/pages/styleguide/ministries.astro, 2026-09-24).
  '/styleguide/ministries', // scaffold: church
  // And the composed beliefs page (src/pages/styleguide/beliefs.astro, 2026-09-24).
  '/styleguide/beliefs', // scaffold: church
  // The plan-2b pages are listed here as they land.
  '/visit',
  '/who-we-are',
  '/beliefs',
  '/ministries',
  '/staff',
  '/history',
  '/wedding',
  '/give',
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
 * a11y-dark.spec.ts. It lives here rather than in that spec so the spec stays
 * byte-identical across the family; only this file knows which pages a given
 * site puts a form on. /contact is the starter's only one. A project that
 * enables the lead-magnet module gets a form on /guides/[slug]; add it here
 * once a guide is published and that route builds.
 */
export const FORM_ROUTES: string[] = [];
