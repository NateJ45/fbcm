# Performance budgets

> Core Web Vitals targets, bundle and image budgets, font loading, hydration strategy, and the current Lighthouse scorecard.

## Performance budgets

Performance is a UX feature, not a vanity score. Lighthouse 100 on Performance is the ceiling target; the more honest measures are the field metrics below.

### Core Web Vitals targets

- **LCP (Largest Contentful Paint)** < 1.0s on the home hero, < 1.5s site-wide. The hero image is usually LCP -- size it for mobile (750px wide, quality ~65) and let it grow on larger viewports.
- **CLS (Cumulative Layout Shift)** < 0.05. Reserve space for images with explicit width/height (or aspect-ratio CSS). Don't lazy-load above-the-fold images. Web fonts use `font-display: swap` to avoid invisible-text shifts.
- **INP (Interaction to Next Paint)** < 200ms. Keep React island hydration light. Favor `client:visible` and `client:idle` over `client:load` for anything below the fold.

### Bundle budgets

| Slot                                            | Target  |
| ----------------------------------------------- | ------- |
| Total JS on home page (compressed)              | < 100KB |
| Largest single React island bundle (compressed) | < 50KB  |
| Total CSS (compressed)                          | < 30KB  |
| Hero image (any viewport)                       | < 200KB |

If a new dependency pushes a budget, that's a discussion before merging. Some are worth it (Lenis adds smooth scroll, motion is the interaction language); some aren't (a 60KB icon library when three lucide-react icons would cover it).

### Image weight by slot

| Slot                       | Display max        | SanityImage props                                                              | Notes                                        |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------ | -------------------------------------------- |
| Home hero (full-bleed)     | viewport           | `width={2400} sizes="100vw" loading="eager" fetchpriority="high" quality={70}` | LCP element                                  |
| Portfolio/Journal cover    | ~896px             | `width={1800} sizes="(min-width: 920px) 896px, 100vw" loading="eager"`         | Capped at `max-w-4xl`                        |
| Project gallery thumbnail  | viewport-dependent | `width={900} quality={75}` (via `urlFor`)                                      | Lightbox loads larger on tap                 |
| Project gallery fullscreen | viewport           | passed to `yet-another-react-lightbox` directly                                |                                              |
| Testimonial avatar         | 120x120            | `urlFor(...).width(120).height(120).fit('crop')`                               | Static thumbnail                             |
| OG image (committed)       | 1200x630           | n/a, generated once via `npm run og`                                           | Per-page via `scripts/generate-og-pages.mjs` |

Use `<SanityImage />`'s `width` prop to drive these. **Never request larger than the slot renders at.** Format defaults to `auto` (AVIF / WebP / JPEG fallback), quality to 75 -- drop to 65 for big hero photos.

### Font loading

- **FBCM's three faces** load from `@fontsource` `@import`s in `globals.css`: Castoro Titling (display capitals), Castoro 400 roman and italic (reading), and Sofia Sans Semi Condensed Variable (furniture). Each package ships per-script `@font-face` rules with `unicode-range`, so a Latin page downloads only the four Latin files (116 KB together); the Cyrillic, Greek and Latin-extended files are built but never requested.
- **Exactly one font preload, in the body, on the home hero only** (`Hero.astro`, beside the dated line). It comes from a `?url` import, so it carries the same hashed `/_astro/` path the `@font-face` rule resolves to and cannot 404 (the old reason for having none). Why only that one, and why not in `<head>`: see the speed pass below. Do not add a font preload to `<head>` without measuring FCP on a post page first.
- **Script accent font** (opt-in): no script font is loaded by default. To enable the `font-script` utility, add a `@fontsource` import in `globals.css` and point `--font-script` at the family. See `animation.md` for the full opt-in steps.

## The 2026-09-24 speed pass: what actually set mobile LCP

Branch `perf/speed-audit`. Measured with Lighthouse 12.6.1 (the repo's own `node_modules/lighthouse`), mobile preset (simulated throttling, DPR 1.75), against `dist/client` served by `scripts/serve-dist.mjs` (brotli, the deploy's cache headers), 3 to 5 runs, medians.

**Read this first: on this site Lighthouse's LCP is decided by WHEN the last LCP candidate is observed, not by how big the page is.** Lantern (the simulator) builds the LCP from every request that had STARTED by the moment the final candidate was painted in the fast, unthrottled trace, then replays them at 1.6 Mbps. A candidate that appears 40 ms after first paint drags in everything the browser began fetching in those 40 ms. On the home page that was four 2400 px slideshow frames and the React islands, so a 40 ms-late candidate became +2 s of LCP. Every cause below is a late candidate or too many bytes started early.

### Baseline (386ce71)

| Page, mobile                                         | Perf | LCP    | FCP    | TBT | CLS   | LCP element                                                       |
| ---------------------------------------------------- | ---- | ------ | ------ | --- | ----- | ----------------------------------------------------------------- |
| `/` local                                            | 0.88 | 3.80 s | 1.65 s | 0   | 0     | the hero's dated line (`[data-live-sunday]`), render delay 3.35 s |
| `/` production                                       | 0.96 | 2.34 s | 1.82 s | 18  | 0     | the same span                                                     |
| `/visit` local                                       | 0.93 | 3.08 s | 1.65 s | 0   | 0     | split hero photo, load time 2.27 s                                |
| `/blog` local                                        | 0.99 | 2.03 s | 1.65 s | 0   | 0     | a row excerpt                                                     |
| post (`/post/händel-s-messiah-sing-in-carols`) local | 0.91 | 3.06 s | 1.10 s | 63  | 0.001 | cover photo, load time 1.83 s                                     |

The earlier reported 5.6 to 5.8 s was not reproduced on either target (local 2.9 to 3.8 s across runs, production 2.3 to 2.6 s). Production beats local because Lantern models the local HTTP/1.1 server's connections worse than Cloudflare's; the relative effect of each experiment is what matters.

### Attribution, home page (one thing blocked or removed at a time)

| Experiment                                                                   | LCP (median of 3)                  | vs baseline          |
| ---------------------------------------------------------------------------- | ---------------------------------- | -------------------- |
| baseline                                                                     | 3.80 s                             |                      |
| fonts blocked (`*.woff2`)                                                    | 3.70 s                             | -0.1 s               |
| all JS blocked (`*.js`)                                                      | 3.14 s                             | -0.7 s               |
| inline stylesheet purged to the rules the page matches (152.6 KB to 69.2 KB) | 2.78 s                             | -1.0 s (FCP -0.15 s) |
| slideshow frames 2-5 removed                                                 | 2.70 s                             | -1.1 s               |
| Sanity images blocked                                                        | 2.63 s                             | -1.2 s               |
| hero fade-up (`hero-entry-stagger`) removed                                  | 2.10 s                             | -1.7 s               |
| **the live-Sunday rewrite script removed**                                   | **1.73 s**, 3 of 3 runs, perf 0.99 | **-2.1 s**           |

The trace said why. The dated line was server-rendered dateless and rewritten by an `is:inline` script at the END of `<body>`. On a 265 KB page the parser paints the hero before it gets there, so the rewrite replaced the text node about 45 ms after first paint, and a replaced text node is a new LCP candidate. By then the four slideshow frames (about 780 KB at 2400 px) and the island JS had started, and Lantern put all of them in front of the LCP. The purge and the frame removal helped only because they shrank what was in flight at that moment.

### What changed

1. **The live-Sunday function is defined in `<head>` and called inline right after the hero's span** (`BaseLayout.astro`, `Hero.astro`), so the line's first paint already carries the date. It writes only when the text differs (an identical `textContent` assignment still replaces the node). The footer and View Transitions are covered by `DOMContentLoaded` and `astro:page-load`. Home went from 3.80 s to a bimodal 1.73 / 2.93 s.
2. **Slideshow frames 2-6 wait in a `<template>` until `load`** (`HeroBackground.astro`), and the cross-fade is held at its first keyframe until they are in (`.hero-fade:not([data-frames-ready])` in `globals.css`: crossfade paused, Ken Burns running). They are on screen only from 8 s, but `loading="lazy"` does nothing for an image inside the viewport, so they were fetched with frame 1. Bytes requested before `load` on the home page: 1,360 KB to 579 KB. Under reduced motion they are never fetched; without JavaScript frame 1 stays, still zooming. The first cross-fade now starts 8 s after `load` rather than 8 s after first paint.
3. **One font preload, for Sofia Sans, in the home hero's body** (`Hero.astro`). The remaining bad runs were a font SWAP: the dated line first paints at opacity 0 inside the fade-up (not counted), and the Sofia swap repaint about 50 ms later is counted. That happened in 9 of 11 runs with fonts and 0 of 5 with fonts blocked. A preload in `<head>` fixed home (5 of 5 at 2.10 s) but held the first paint of every page (post: observed first paint 82 to 165 ms, simulated FCP 1.65 to 2.25 s). Preloading all four faces: median 2.93 s, worse than none. In the body, on the tall hero only: 5 of 5 runs at 1.73 s, perf 1.00.
4. **Post-body figures use width descriptors and their drawn width** (`JournalPortableText.tsx`). The 1x/2x pair keyed on the old size choice sent a DPR 1.75 phone a 3200 px webp (268 KB) for a portrait drawn at 360 px; it is 59 KB now. 43 posts' markup changed (srcset and sizes only). Post image bytes: 304 KB to 95 KB.

Tried and not kept, because the numbers did not move: `<link rel="preconnect">` to `cdn.sanity.io` (visit 3.15 to 3.08 s, home unchanged).

### After

| Page, mobile (5 runs) | Perf     | LCP                                      | FCP    | TBT | CLS   | LCP element      |
| --------------------- | -------- | ---------------------------------------- | ------ | --- | ----- | ---------------- |
| `/`                   | **1.00** | **1.73 s** (all 5 within 1.726 to 1.729) | 1.20 s | 12  | 0     | header logo      |
| `/visit`              | 0.93     | 3.15 s                                   | 1.65 s | 0   | 0     | split hero photo |
| `/blog`               | 0.98     | 2.10 s                                   | 1.65 s | 0   | 0     | a row excerpt    |
| post                  | 0.91     | 3.38 s                                   | 1.65 s | 0   | 0.001 | cover photo      |

Desktop, same four: perf 1.00, 1.00, 1.00, 0.99; LCP 0.48 s, 0.72 s, 0.52 s, 0.86 s.

The home LCP element is now the logo because Chrome does not count text whose first paint is at opacity 0 and that later fades in: the hero words are never an LCP candidate unless something repaints them. Field data (Chrome's own LCP) reads the fade-up the same way.

### Still open (owner decisions, numbers attached)

- **`/visit` and post pages are image-LCP pages over 2.5 s**, and the cause is JS competing with the photo. Blocking all JS: visit 3.15 to 2.57 s, post 3.38 to 2.38 s. Blocking only React and MobileNav: visit 2.71 s. The islands hydrate `client:idle`, which on a fast machine fires about 110 ms in, in the middle of the image download. Hydrating after `load` (a custom client directive) would take them out of that window, at the price of the menu button doing nothing until the page has loaded.
- **The post body hydrates as one React island** (`JournalPortableText client:visible`), which pulls React, `@sanity/client` (`compat.js`, 25 KB) and `resolveEditInfo.js` (8 KB) in through `urlFor` from `src/lib/sanity.ts`. Blocking those two alone: 3.38 to 3.23 s. Rendering the body statically and hydrating only the before/after slider is the bigger lever.
- **`<Toaster />` ships `sonner` (10 KB) on every page for `CopyEmailButton`, which no page renders.**
- **The home hero's frame 1 is the 2400 px variant on a phone** (169 KB at DPR 1.75), by design since `heroSizes` (2026-09-24). It is the largest request before first paint.
- **The shared inline stylesheet is about 152 KB on every page**; a per-page purge measured -0.15 s FCP. Worth doing only with a build-time tool, which would be a new dependency.

### How the rule-20 limit actually applies

`CSS_INLINE_LIMIT` is tested per CSS CHUNK, not per page. Astro's `astro:rollup-plugin-inline-stylesheets` calls `assetsInlineLimit(fileName, content)` once for each emitted stylesheet, and a page gets every chunk its components pull in. Measured in this build: `BaseLayout` 124,510 B, `SectionRenderer` 14,609 B, `GoalsBand` 13,453 B, `_slug_` 10,055 B, and smaller ones, each inlined on its own merit. So the home page carries 152,656 B inline and `/blog` 158,026 B, both over 147,456, and that is correct behaviour. A chunk over the limit is linked only on the pages that use it; the one over it today (153,051 B, `_..-<hash>.css`) belongs to the SSR preview route, and the Studio's `lib.<hash>.css` (165,056 B) stays linked as intended. So the rule-20 check is every public page, not `index.html` alone: after this pass, 0 `<link rel="stylesheet">` across all 378 built pages, largest inline total 158,085 B (`/blog`).

### This Sunday's sermon on the dated line (2026-09-24, `feat/sunday`)

The dated line can now carry the coming Sunday's sermon (a link and up to about 45 more characters). The server renders it and the same inline call right after the span settles it, so the line is complete at first paint and is never rewritten afterwards. Measured the same way as the speed pass (local `dist/client` behind `scripts/serve-dist.mjs`, Lighthouse 12.6.1 mobile, 3 runs each):

| Home, mobile                                        | LCP, three runs                                       | Median LCP | Perf             | LCP element |
| --------------------------------------------------- | ----------------------------------------------------- | ---------- | ---------------- | ----------- |
| before (`main` at `2a5d612`)                        | 1.73, 1.88, 1.73 s                                    | 1.73 s     | 1.00, 0.99, 1.00 | header logo |
| after, a current sermon on the line (fixture build) | 1.73, 1.73, 1.88 s (a second set: 1.73, 1.73, 1.73 s) | 1.73 s     | 1.00, 1.00, 0.99 | header logo |

After, with no current preview (the state today, the markup unchanged but for the inline scripts): 8 runs, 1.73 s median (2.26, 1.73, 1.73 and 2.03, 1.73, 1.65, 1.73, 1.73 s). The two slow ones were the first run of each set, with FCP 1.65 s against 1.20 s in every other run, so the page was slow before the line could matter; in the 2.26 s run the dated line was the LCP element, the font-swap case the speed pass already recorded as bimodal.

The line stays out of the LCP race, as the speed pass left it. `GET /api/live-status` is fetched only on Sunday mornings, after the header has painted, and blocks nothing.

### Lighthouse scorecard

Target: 100 on all four categories (Performance, Accessibility, Best Practices, SEO) for all core routes on both mobile and desktop. Measure on the deployed Cloudflare URL via Chrome DevTools' bundled Lighthouse, not the dev server.

**Levers that achieve this -- preserve unless you have a stronger reason than "I want to simplify":**

- Every island hydrates at `client:idle` or `client:visible`. Nothing on a public page uses `client:only`: it skips SSR, so the island's markup is missing from the server HTML and its runtime lands on the critical path
- Lenis init wrapped in `requestIdleCallback`
- Logo PNGs moved from `public/` to `src/assets/` so Astro emits WebPs
- Single-img theme-aware logo (one fetch per page load instead of two)
- SanityImage emits real width-descriptor srcset with 8 breakpoints (400-2400)
- AVIF as default format (`'auto'`) -- Sanity picks AVIF on supporting browsers
- `fetchpriority="high"` on hero LCP image
- Portrait inline images capped to `max-w-[600px]` (smaller files at the smaller cap)
- Cloudflare adapter `imageService: 'compile'` (build-time Sharp, no runtime image binding)

### Hydration strategy

| Component          | Directive        | Why                                                                                                                                                                                                                                                                 |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ThemeToggle`      | `client:idle`    | Anti-FOUC inline script in `BaseLayout` already applies the correct theme class before first paint, so the React island only needs to hydrate by the time the visitor moves to click it. Demoting from `client:load` shaves real TBT off mobile Lighthouse runs.    |
| `MobileNav`        | `client:idle`    | The closed Radix Sheet server-renders its trigger and mounts the portal only when the drawer opens, so the hamburger is in the server HTML and React can arrive on idle. Was `client:only="react"` until 2026-09-18 on a Radix-can't-SSR claim that no longer holds |
| `BackToTop`        | `client:idle`    | Doesn't appear until the visitor scrolls 600px, so the JS doesn't need to race first paint                                                                                                                                                                          |
| `Toaster` (Sonner) | `client:idle`    | Region only -- toast calls fire from elsewhere, plenty of time for the region to mount                                                                                                                                                                              |
| `FaqAccordion`     | `client:visible` | Interactive but not critical-path                                                                                                                                                                                                                                   |

Default to `client:visible` or `client:idle` for anything not immediately above the fold. Astro ships less JS up front. `client:load` is reserved for islands that genuinely must be live before first interaction -- and even then, ask twice whether `client:idle` is acceptable.

### Verifying

- `npm run build` then check `dist/` size for sanity. Astro reports the largest bundles in the build log.
- Run Lighthouse on the deployed Cloudflare URL after every push that touches a page template or component.
- Cloudflare Web Analytics surfaces real-user LCP, INP, CLS once traffic exists. Watch weekly post-launch; investigate any page that drifts past the budgets above.
