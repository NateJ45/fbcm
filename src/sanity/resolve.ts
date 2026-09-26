// Foundation, edit with care
// =============================================================================
// Presentation Tool location resolver
// (ported from presacademy 2026-08-28; original lineage: the WCP site)
// =============================================================================
// Two halves:
//
//  - `mainDocuments` (URL -> document): as you click through the preview iframe
//    like a normal website, Presentation opens the matching document in the
//    editor panel automatically. Routes match the iframe pathname (which lives
//    under /preview). Order matters: the singleton routes come before the
//    catch-all `page` route.
//
//  - `locations` (document -> URL): the reverse, so opening a document from the
//    desk points the preview at the right page. Singletons map to their fixed
//    preview path; `page` docs resolve from the slug, and so do blog posts
//    (journalEntry), which have their own draft-preview route since
//    2026-09-26 (/preview/post/<slug>, src/pages/preview/post/[slug].astro).
//    Other collection docs have none, so they land on the page they appear on.
//
// The preview routes themselves live in the site app: src/pages/preview/.
// SINGLETON_PREVIEW_PATHS is the SAME map as SINGLETON_BY_PATH in
// src/pages/preview/[...slug].astro. TWO places, one truth: change one and
// change both. (Until 2026-09-20 there was a third, FIRST_SEGMENT_PREVIEWABLE
// in src/layouts/PreviewLayout.astro's click interceptor. It was unreachable
// dead code behind a blanket "any single segment is previewable" clause, and
// had gone stale, so it was deleted rather than maintained.)
// =============================================================================
import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from 'sanity/presentation';

/** Preview path per singleton type. */
export const SINGLETON_PREVIEW_PATHS: Record<string, string> = {
  homePage: '/preview',
  journalPage: '/preview/blog', // scaffold: journal
  privacyPage: '/preview/privacy',
  notFoundPage: '/preview/404',
};

const previewHref = (slug?: string) => (slug === 'home' ? '/preview' : `/preview/${slug}`);

// One static location entry per singleton.
const singletonLocations = Object.fromEntries(
  Object.entries(SINGLETON_PREVIEW_PATHS).map(([type, href]) => [
    type,
    { locations: [{ title: 'Preview', href }] },
  ]),
);

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/preview', filter: '_type == "homePage"' },
    // Singleton routes before the generic :slug catch-all.
    ...Object.entries(SINGLETON_PREVIEW_PATHS)
      .filter(([type]) => type !== 'homePage')
      .map(([type, href]) => ({ route: href, filter: `_type == "${type}"` })),
    // A blog post, drawn by the same component as its live page.
    { route: '/preview/post/:slug', filter: '_type == "journalEntry" && slug.current == $slug' }, // scaffold: journal
    { route: '/preview/:slug', filter: '_type == "page" && slug.current == $slug' },
  ]),
  locations: {
    ...singletonLocations,
    page: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => {
        const slug = doc?.slug;
        if (!slug) return { locations: [], message: 'Give this page a slug to preview it.' };
        return { locations: [{ title: doc?.title ?? slug, href: previewHref(slug) }] };
      },
    }),
    // A blog post previews on its own page (/preview/post/<slug>), and the
    // Blog page is listed too, since the post appears there.
    // scaffold: journal
    journalEntry: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => {
        const slug = doc?.slug;
        const blog = { title: 'Blog', href: '/preview/blog' };
        if (!slug) {
          return {
            locations: [blog],
            message: 'Generate the Web address to see this post in the preview.',
          };
        }
        return {
          locations: [{ title: doc?.title ?? slug, href: `/preview/post/${slug}` }, blog],
        };
      },
    }),
    // scaffold:end
    // Other collection docs have no draft-preview route of their own. Send
    // each to the page it renders on.
    journalCategory: { locations: [{ title: 'Blog', href: '/preview/blog' }] }, // scaffold: journal
    // A ministry is drawn on the Ministries page by its "Ministry" band
    // (ministrySection), so that is where opening one points the preview.
    ministry: { locations: [{ title: 'Ministries', href: '/preview/ministries' }] }, // scaffold: church
    announcement: { locations: [{ title: 'Home', href: '/preview' }] },
    siteSettings: { locations: [{ title: 'Home', href: '/preview' }] },
    businessInfo: { locations: [{ title: 'Home', href: '/preview' }] },
  },
};
