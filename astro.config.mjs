// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sanity from '@sanity/astro';

import { buildRedirectMap } from './src/lib/redirects.ts';

// -----------------------------------------------------------------------------
// Build-time reads from Sanity (redirects + pages kept out of search)
// -----------------------------------------------------------------------------
// Both are FULLY fail-safe. Any problem - no project, no token, Sanity down, bad
// data - returns the empty answer and the build carries on exactly as it did
// before this feature existed. Neither read may ever fail a build.
//
// This runs in the Astro CONFIG, before any integration, so it cannot use
// src/lib/sanity.ts (that module reads import.meta.env, which is not populated
// yet). loadEnv is Vite's own .env reader and is already a dependency of Astro.
//
// It has to be computed BEFORE the Sanity project id below, and that id has to
// fall back to it. Astro/Vite only ever expose .env values through
// import.meta.env for application code; they are never copied onto
// process.env. A real `npm run build` from a shell that hasn't separately
// exported these as OS environment variables therefore saw process.env.
// PUBLIC_SANITY_PROJECT_ID as undefined even with a correct .env, which made
// SANITY_CONFIGURED false and silently zeroed out both queries below - found
// while proving Task 11's redirects actually produce a 301 (they didn't; the
// dataset had 42 redirect documents and the build still emitted none).
const configEnv = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');

// The Sanity project id is PUBLIC by design: it ships in every client bundle.
// A fresh clone with no .env still builds; the Studio then shows a project-not-
// found screen until PUBLIC_SANITY_PROJECT_ID is set (see .env.example).
const SANITY_PROJECT_ID =
  process.env.PUBLIC_SANITY_PROJECT_ID ||
  configEnv.PUBLIC_SANITY_PROJECT_ID ||
  'placeholder-project-id';
const SANITY_DATASET =
  process.env.PUBLIC_SANITY_DATASET || configEnv.PUBLIC_SANITY_DATASET || 'production';
const SANITY_API_VERSION =
  process.env.PUBLIC_SANITY_API_VERSION || configEnv.PUBLIC_SANITY_API_VERSION || '2026-05-01';
const SANITY_READ_TOKEN = process.env.SANITY_API_READ_TOKEN || configEnv.SANITY_API_READ_TOKEN;
const SANITY_CONFIGURED =
  SANITY_PROJECT_ID !== 'placeholder-project-id' && SANITY_PROJECT_ID !== 'your-project-id';

/** One GROQ query against the Sanity HTTP API. Returns `fallback` on anything
 *  that is not a clean 200. */
/**
 * @template T
 * @param {string} query GROQ.
 * @param {T} fallback Returned on any non-200 or when Sanity is unconfigured.
 * @returns {Promise<T>}
 */
async function cmsQuery(query, fallback) {
  if (!SANITY_CONFIGURED) return fallback;
  try {
    const url =
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}` +
      `/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: SANITY_READ_TOKEN ? { Authorization: `Bearer ${SANITY_READ_TOKEN}` } : {},
    });
    if (!res.ok) return fallback;
    const { result } = await res.json();
    return result ?? fallback;
  } catch {
    return fallback;
  }
}

// Editor-managed redirects. Each published `redirect` document becomes one entry
// in Astro's `redirects` map, which the Cloudflare adapter emits as a real
// 301/302. Most of them are filed automatically when a page's web address
// changes (src/sanity/components/slugRedirect.tsx); the shaping rules live in
// src/lib/redirects.ts so the Studio and the build agree on what a path is.
const cmsRedirects = buildRedirectMap(
  await cmsQuery('*[_type == "redirect" && defined(from) && defined(to)]{from,to,permanent}', []),
);

// Non-font asset inline ceiling (128 KiB), unchanged since 2026-09-20: margin
// between the then-measured site sheet (124,750 B, since grown, see below)
// and the Studio's lib.<hash>.css (165,056 B).
const SITE_ASSET_INLINE_LIMIT = 131072;
// CSS-only inline ceiling (144 KiB), raised 2026-09-22 for the Ledger and
// photo-shape CSS: the site sheet measured 133,535 B that day, which is over
// SITE_ASSET_INLINE_LIMIT but comfortably under this with margin on both
// sides of it and the Studio's still-unchanged 165,056 B sheet. See the long
// comments on `build.inlineStylesheets` and on `assetsInlineLimit` below.
// Raised again 2026-09-23 to 152 KiB: the Who We Are identity primitives took
// the site sheet to ~140 KB, too close to 144 KiB for the tasks still to come.
// 155648 is still ~9.4 KB under the Studio's 165,056 B sheet.
const CSS_INLINE_LIMIT = 155648;

// Pages the editor keeps out of search. "Keep this page out of Google"
// (page.hideFromSearch) has to do two things: put a robots tag on the page
// (src/pages/[slug].astro does that) and drop the page from the sitemap, which
// is built here. Archived pages are listed too, belt and braces - they are never
// built, so no URL of theirs can reach the sitemap anyway.
const hiddenPagePaths = new Set(
  (
    await cmsQuery(
      '*[_type == "page" && defined(slug.current) && (hideFromSearch == true || archived == true)].slug.current',
      [],
    )
  )
    .filter((/** @type {unknown} */ slug) => typeof slug === 'string' && slug)
    .map((/** @type {string} */ slug) => `/${slug}`),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://www.fbcmuncie.org',
  output: 'static',
  // 2026-08-28: no sessions anywhere in this template (there is no gated area
  // or login), so opt out. Left on, @astrojs/cloudflare v14 auto-declares a
  // "SESSION" KV binding in the generated dist/server/wrangler.json, and a KV
  // binding with no namespace id fails the deploy. A fork that adds a login
  // turns this back on and creates the namespace deliberately.
  session: false,
  build: {
    // Inline the page stylesheet into the document instead of linking it.
    //
    // Measured 2026-09-20 (plan 2c task 6). Astro's default is 'auto', which
    // inlines only stylesheets under about 4KB, so every page linked a single
    // 125KB (24KB over the wire) /_astro/BaseLayout.<hash>.css. On Lighthouse's
    // mobile throttle that link is a second network round trip before the first
    // paint: `render-blocking-resources` named that one file on all six audited
    // pages and costed it at 453 to 465ms, and because the whole gap between
    // FCP and LCP was only half a second, the same 455ms sat in front of the
    // largest paint too. TBT was already 0ms and CLS at most 0.034, so this was
    // the only real lever.
    //
    // The trade is real and deliberate: the stylesheet is no longer a separate
    // cacheable file, so every page carries its own copy (about 22KB gzipped)
    // and a reader moving between pages re-downloads it. First paint on a cold
    // mobile visit is the number this site is judged on, and almost every
    // visitor arrives cold from search.
    //
    // 2026-09-20 correction (plan 2c task 7 step 0, "C2"): 'always' inlines
    // EVERY page's stylesheet, and the embedded Sanity Studio at /studio has
    // its own, much larger, stylesheet -- @sanity/ui's styled-components
    // output plus the plugin CSS. 'always' inlined that one too, bloating
    // every /studio response with CSS no visitor-facing page needed. Switched
    // to 'auto', which inlines a stylesheet only when it is at or under
    // `vite.build.assetsInlineLimit` (see below). Measured in a same-day build
    // with this set to 'never': the site's BaseLayout sheet is 124,750 bytes
    // raw and the Studio's largest (lib.<hash>.css, the @sanity/ui bundle) is
    // 165,056 bytes. 131072 bytes (128 KiB) sits between them with margin on
    // both sides, so 'auto' now inlines the site sheet and leaves the Studio's
    // linked. Re-measure both files after any Tailwind or Sanity UI upgrade
    // that could move either size past 131072.
    //
    // 2026-09-22 (feat/richtext-ledger-photo-shapes, Ledger + photo-shape CSS):
    // the Ledger `.rt-*` and photo `.ph-*` styles pushed the site sheet to
    // 133,535 bytes, past the 131072 limit above, so every page started
    // linking a render-blocking stylesheet again instead of inlining it.
    // Raised the CSS-only ceiling to CSS_INLINE_LIMIT (see below) with margin
    // on both sides of the 133,535-byte site sheet and the still-unchanged
    // 165,056-byte Studio sheet (lib.<hash>.css). Every other non-font asset
    // stays under the original 131072 (SITE_ASSET_INLINE_LIMIT below);
    // widening the CSS ceiling must not also widen it for other assets, or
    // the font-bundling regression from the 2026-09-20 note above returns.
    // 2026-09-23: the Who We Are identity primitives took the site sheet to
    // ~140 KB, so CSS_INLINE_LIMIT moved to 152 KiB, still under the Studio.
    inlineStylesheets: 'auto',
  },
  // `imageService: 'compile'` tells @astrojs/cloudflare to process images
  // with Sharp at build time and ship plain static files — no Cloudflare
  // Images runtime, no per-transform fees, no Workers binding required.
  // The adapter's default would otherwise wire up the IMAGES binding which
  // is meant for SSR sites that want on-demand transforms (we don't).
  adapter: cloudflare({ imageService: 'compile' }),
  // Old address -> new address forwards, managed by the editor in the Studio and
  // read at build time above. The Cloudflare adapter turns these into real
  // 301/302s. A repo that also needs hand-written launch redirects puts them
  // BEFORE the spread, so an editor entry can correct one without a code change.
  redirects: { ...cmsRedirects },
  integrations: [
    mdx(),
    // Embedded Sanity Studio at /studio (added 2026-08-28). This is the ONE
    // studio: it rebuilds with every deploy, so it can never drift stale the
    // way a hosted *.sanity.studio deploy does. The config it loads is the
    // repo-root sanity.config.ts.
    sanity({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      useCdn: false,
      studioBasePath: '/studio',
    }),
    sitemap({
      // /studio and /preview are Studio plumbing (SSR, noindex). The sitemap
      // only walks prerendered routes so they are mostly excluded already, but
      // the filter makes it explicit and future-proof.
      //
      // A custom page whose editor ticked "Keep this page out of Google" (or
      // that is archived) drops out here too. `page` is a full URL, so compare
      // on the pathname with the trailing slash Astro's directory format adds.
      filter: (page) => {
        // /styleguide is a real built route so Playwright can load it out of
        // dist/client, but it is the design-system wall, not a page for
        // visitors, and it is noindex. Keep it out of the sitemap too.
        if (
          page.includes('/404') ||
          page.includes('/studio') ||
          page.includes('/preview') ||
          page.includes('/styleguide')
        )
          return false;
        try {
          const path = new URL(page).pathname.replace(/\/+$/, '');
          return !hiddenPagePaths.has(path);
        } catch {
          return true;
        }
      },
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Drives Astro's `build.inlineStylesheets: 'auto'` above: a compiled
      // stylesheet is inlined only when its raw size is at or under this
      // limit, and it is also Vite's general asset-inlining threshold (any
      // imported asset under the limit becomes a base64 data URI instead of
      // a linked file). A plain number bit both jobs at once here: raising
      // it enough to inline the 124,750-byte site sheet (BaseLayout.css)
      // also let Vite base64-inline the @font-face url() references that
      // sheet pulls in from @fontsource, since the largest font
      // (inter-latin-ext-wght-normal.woff2) is only 85,068 bytes. That
      // ballooned the "inlined" sheet to 671,042 bytes -- past the very
      // limit meant to admit it -- so Astro's auto check then correctly
      // decided NOT to inline it, and the page shipped a linked stylesheet
      // six times its original size. Caught by re-checking
      // `find dist/client/_astro -name "*.woff2"` after the first attempt,
      // which came back empty (the fonts had disappeared into the CSS).
      //
      // Fixed by making this a function instead of a number: Astro and Vite
      // both accept `(filePath, content) => boolean`. Font files are always
      // kept external regardless of size (so @font-face URLs stay real,
      // cacheable requests). Everything else non-CSS stays under
      // SITE_ASSET_INLINE_LIMIT (131072 bytes / 128 KiB), the original limit
      // chosen with margin between the then-measured site sheet (124,750
      // bytes) and the Studio's largest sheet, lib.<hash>.css (165,056
      // bytes, the @sanity/ui bundle).
      //
      // 2026-09-22: `.css` files get their own, higher ceiling,
      // CSS_INLINE_LIMIT (147456 bytes / 144 KiB then; 155648 / 152 KiB since
      // 2026-09-23, when the Who We Are identity primitives took the site
      // sheet to ~140 KB), because this branch's
      // Ledger and photo-shape CSS grew the site sheet to 133,535 bytes,
      // past SITE_ASSET_INLINE_LIMIT. 147456 sits with margin above the
      // 133,535-byte site sheet and below the Studio's still-165,056-byte
      // sheet. Every OTHER non-font asset type deliberately stays on the
      // narrower SITE_ASSET_INLINE_LIMIT -- widening it for everything
      // would reopen the font-bundling regression described above, where a
      // wide-enough ceiling let Vite base64-inline @font-face url()
      // references into the "inlined" stylesheet. Re-verify both stylesheet
      // sizes after any Tailwind or Sanity UI upgrade, or any further
      // section CSS growth, that could move either one past its ceiling,
      // and re-run the woff2 check (`find dist/client/_astro -name
      // "*.woff2"`) after any change here.
      assetsInlineLimit: (filePath, content) => {
        if (/\.(woff2?|ttf|otf|eot)$/i.test(filePath)) return false;
        if (/\.css$/i.test(filePath)) return content.length < CSS_INLINE_LIMIT;
        return content.length < SITE_ASSET_INLINE_LIMIT;
      },
    },
    // @sanity/ui ships an ESM build that Vite's dependency pre-bundler
    // mis-scans on this stack (MISSING_EXPORT errors for styled-components).
    // Excluding it from pre-bundling matches presacademy's working config; it
    // is still bundled correctly by `astro build`.
    //
    // Deliberately NO custom chunking here. An `advancedChunks` group forcing
    // styled-components + @sanity/ui into one chunk was tried in presacademy on
    // 2026-08-26 (chasing a theming crash) and made things worse: merging those
    // modules changes evaluation order and broke @sanity/ui's theme init,
    // surfacing as "TypeError: Cannot read properties of undefined (reading
    // 'v2')" from inside styled-components' generateAndInjectStyles. Leave the
    // bundler's default chunking alone.
    optimizeDeps: {
      exclude: ['@sanity/ui', 'styled-components'],
    },
    // -----------------------------------------------------------------------
    // ONE module instance per package
    // -----------------------------------------------------------------------
    // The studio now lives in this package (the nested studio/ package was
    // folded in 2026-08-28), so there is only one node_modules tree and this is
    // belt-and-braces rather than the load-bearing fix it was in presacademy.
    // Keep it anyway: it is cheap, and it also protects against a fork adding a
    // second resolution root. Two instances of styled-components means two
    // React contexts, and the ThemeProvider mounted by one is invisible to
    // useTheme in the other, which kills the signed-in Studio while leaving the
    // login screen (core code only) working.
    //
    // @sanity/icons is deliberately NOT here: sanity core wants v5 while
    // @sanity/ui v3 wants v3.8, and icons are stateless SVG components with no
    // React context, so two instances are harmless. Deduping them broke the
    // build (CogIcon is gone in v5).
    //
    // Verify after any Sanity dependency work:
    //   grep -l "errors.md#" dist/client/_astro/*.js   # must list ONE file
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-is',
        'styled-components',
        '@sanity/ui',
        '@sanity/client',
        'sanity',
        'rxjs',
      ],
    },
  },
  // NOTE: A previous attempt at `security.csp` shipped a hash-based CSP
  // meta tag. It got past Lighthouse's csp-xss check on paper, but Astro
  // missed at least one runtime-generated inline script (probably from
  // ClientRouter view-transitions) and one inline style, which the browser
  // then blocked — breaking theme bootstrap and various islands. The
  // current `public/_headers` carries a `frame-ancestors` CSP for the
  // Sanity iframe-pane preview, which is enough for the actual security
  // surface. Re-enabling a full CSP needs an audit of every inline script
  // (incl. ClientRouter's runtime scripts), or a switch to a nonce-based
  // SSR strategy. Not worth chasing for the cookie/csp-xss informational
  // warnings — our Lighthouse runs already score Best Practices 100.
});
