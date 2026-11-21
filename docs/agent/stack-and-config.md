# Stack and Astro config

> Full stack/version notes and the astro.config.mjs levers that look tempting but break things.

## Stack

Pinned versions reflect what's known to work together as of May 2026. Bump deliberately, not casually.

- Astro 6.3.x with TypeScript in strict mode and `output: 'static'`. Requires Node 22.23.4 (pinned in `.nvmrc`, which every workflow reads; starter card 209).
- **Sanity v5** as the headless CMS. Schemas in `src/sanity/schemaTypes/`, written with `defineType`/`defineField`/`defineArrayMember` from `'sanity'`. Sanity TypeGen generates TypeScript types from the schemas (`npm run typegen`). All editable content lives in Sanity (services, testimonials, FAQs, projects, page singletons). Studio deployed alongside the site at `studio.<yourdomain>` or hosted on Sanity's free hosting.
- **Env-driven Sanity config:** the Sanity project ID and dataset are read from `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` at build time. `src/lib/sanity.ts` exposes a `sanityFetch(query, params, fallback)` wrapper that returns the fallback value when no project is configured (either env var absent or empty), so `npm run build` succeeds with no Sanity project set up. Pages render their empty-state fallback content rather than erroring. This is intentional: you can build and verify the site skeleton before wiring up Sanity.
- Tailwind 4 via `@tailwindcss/vite`. Brand tokens declared in `@theme` blocks inside `src/styles/globals.css`. There is no `tailwind.config.mjs` file.
- React 19 islands for anything interactive (mobile nav drawer, contact form, lightbox, theme toggle, back-to-top). Astro components for everything static.
- shadcn/ui primitives in `src/components/ui/` (Nova preset, Radix base). Extend Button with project-specific marketing variants only when the standard variants don't carry the brand.
- Motion (formerly Framer Motion), Astro View Transitions, native smooth scrolling under `prefers-reduced-motion: no-preference` (Lenis was removed on 2026-09-24; `animation.md` says why).
- sharp for image processing. Sanity handles its own image transformation pipeline for content images; sharp is for any locally-bundled assets (logo, OG image generator).
- opentype.js (dev-only) for the OG image generator at `scripts/generate-og-default.mjs`.
- `@astrojs/rss` wired at `/blog/rss.xml` via `src/pages/blog/rss.xml.ts`.
- `@astrojs/sitemap` for `sitemap-index.xml` (production sitemap).
- Three-state dark/light/system theme system: `ThemeToggle.tsx` React island plus an anti-FOUC bootstrap script in BaseLayout, persisted to `localStorage["theme"]`. The site is light-primary; dark mode is supported for visitor preference but not the primary read of the brand.
- `src/data/site.ts` as the single source of truth for hardcoded site identity (brand name, domain, asset paths, social URL strings the build needs at compile time). Editor-controlled content goes through Sanity.
- **No contact form.** This site carries none: visitors use the church's own Church Center forms, and plan 2b removed the starter's Web3Forms island, its `/api/contact` endpoint and the Calendly embed.
- Cloudflare Web Analytics for privacy-friendly traffic (no cookie banner needed).
- **Cloudflare Workers** for hosting (not Pages). The two products merged in early 2026; Pages is in maintenance mode, Workers gets all new investment. Use `wrangler deploy`. Astro adapter config is `cloudflare({ imageService: 'compile' })` so image processing stays at build-time via Sharp -- never reaches the Cloudflare Images runtime binding (avoids surprise per-transform fees, no Workers binding required).
- **`@astrojs/cloudflare` is pinned to exactly `13.5.5`.** Version 13.6.0 introduced a regression: the image optimizer writes optimized assets to `dist/client/_astro/` but then reads them back from `dist/_astro/`, a mismatch that causes the build to fail or produce broken image URLs. Do not upgrade this package without verifying the image pipeline still works end-to-end. Pinned in `package.json` with an exact version (no `^`).
- GitHub for version control.

### Astro config don'ts

A few `astro.config.mjs` levers that look tempting but break things -- left documented here so a future agent doesn't waste a cycle rediscovering them:

- **`security.csp` is disabled on purpose.** Astro 6 has a hash-based CSP feature that auto-generates SHA-256 hashes for inline scripts + styles. Enabling it satisfies Lighthouse's `csp-xss` audit on paper, but in practice the build-time hash pass misses at least one runtime-generated inline script (ClientRouter's view-transitions runtime emits one) and one inline style from the astro-island markup. The browser then blocks them -- theme bootstrap breaks, the layout script breaks, polish observer breaks. Re-enabling would need either nonce-based SSR (doesn't apply to our `output: 'static'`) or an audit of every inline script Astro and React might emit at runtime. Not worth chasing for an unscored audit. The `public/_headers` file still ships a `frame-ancestors` CSP, which is the only security-relevant directive for this setup (lets Sanity Studio iframe the live site for the preview pane).

- **`crossorigin="anonymous"` on Sanity CDN images breaks them.** Sanity's CDN doesn't send `Access-Control-Allow-Origin` for credential-less image requests, so the browser refuses the response and the image fails to render. Lighthouse's third-party-cookie warning about `sanitySession` is a real cookie, but the only known fix would proxy every image through a Cloudflare Worker -- not worth the engineering for an unscored Best Practices flag.

### `astro dev` on Windows: keep `fixSanityDedupeAlias()` (2026-09-29)

`@sanity/astro`'s dev-only Vite plugin `sanity:module-dedupe` aliases `sanity` and `styled-components` with `require.resolve('<pkg>/package.json').replace(/\/package\.json$/, '')`. On Windows the path uses backslashes, the regex never matches, and `sanity` is aliased to its own `package.json`, so `astro dev` dies with `Build failed with N errors: [MISSING_EXPORT] "X" is not exported by "node_modules/sanity/package.json"`. `astro build` never loads the plugin, which is why only dev broke. The fix is the PORTABLE `src/lib/sanity-dedupe-alias.ts` (`fixSanityDedupeAlias()`, wired into `vite.plugins` in `astro.config.mjs`, tested by `sanity-dedupe-alias.test.ts`); it re-aliases with the separator stripped, does nothing in a build and nothing on macOS or Linux, and leaves the shipped bundle byte-identical. Keep it. **Never "fix" this with `SANITY_ASTRO_DISABLE_MODULE_DEDUPE=1`**: the alias exists so the Studio's React tree shares one `styled-components`, and without it the Studio fails to hydrate. Starter PORTS.md card 60 has the full story. Astro 7 also auto-backgrounds `astro dev` for AI agents; run `ASTRO_DEV_BACKGROUND=1 node node_modules/astro/bin/astro.mjs dev` to see the log. A cold first dev request can take 2 minutes while Vite pre-bundles the Studio.

### Build order: typegen before build

`npm run build` runs `astro build` only. It does NOT chain typegen.

After any schema change, run `npm run typegen` first, then `npm run build`. The TypeScript types generated from Sanity schemas are consumed by page-level GROQ queries; a stale type file causes `astro check` and `tsc` to surface type errors that disappear once types are regenerated. Use `npm run build:full` (`npm run typegen && astro build`) to run both in one step.

### Sitemap `/404` filter

`astro.config.mjs` passes a `filter` function to `@astrojs/sitemap` that excludes `/404` from the generated sitemap. Without the filter, Astro includes the 404 page in `sitemap-index.xml`, which tells crawlers to index a page that should never appear in search results. The filter is one line and should stay.

## Stack essentials, rest (moved from CLAUDE.md)

- **No form of the site's own**: visitors use the church's forms, linked through Site settings' Church systems boxes, or embedded from Church Trac by a "Church Trac form" band (only a churchtrac.com address from the pasted code reaches the page, `src/lib/church-trac-form.ts`). **Cloudflare Web Analytics** (cookieless, no banner).

- **Page builder:** `src/components/SectionRenderer.astro` maps each block `_type` to a component and owns the alternating-surface cadence (logic in `src/lib/sectionCadence.ts`, unit-tested). Blocks carry no color field; the cadence is automatic.
- **Default sections fallback:** `src/data/defaultSections.ts` holds code-defined default content arrays for each core page. When a page's `pageBuilder` array is absent (fresh clone, no Sanity project), the route uses the defaults, so the site always renders non-blank content.
- **Brand reskin:** `brand/brand.config.json` is the single source of truth for identity + palette + fonts + logo paths. Running `npm run apply-brand` deterministically rewrites `globals.css` tokens, `src/data/site.ts`, the Studio theme's font stacks in `sanity.config.ts`, and the OG image. For a full rebrand orchestration (interview, font install, apply, contrast check, copy retone) use the `/reskin` skill at `.claude/skills/reskin/SKILL.md`.

## The Studio is the church's own admin (moved from CLAUDE.md)

- **The Studio is the church's own admin** (starter cards 106 to 120, 2026-10-18): Home (banner, Sunday checklist, Is it live?, Fix-it list, Visitors, Your pages), Quick update, Site Guide, Checkup, Trash, the staff view, Help for this page, Share a preview, table views, the owned `/studio/` boot page, and the church's colours, fonts, wordmark and goal-glyph icons. The kit files are PORTABLE (`src/sanity/kit/`, `src/sanity/workflow/`, `src/lib/studio-*.ts`); everything about this church is in `src/sanity/kit.config.ts`, `studioEdges.config.ts`, `brandIconArt.tsx`, `tables.config.ts` and `brand.config.json` `studio`. The `/studio` splash and offline page are the shared `StudioSplash.astro` partial (card 132); the church's dark title-card look sits in `src/sanity/StudioSplashMotif.astro`, styled against the partial's `.ncs-sp__*` classes (re-check it after any resync). Guide pictures (card 130) go through `src/sanity/guides/shots.ts` (two captures so far, the rest wireframes; `docs/PENDING.md` 1g). Who edits and which Studio surface serves each weekly job: `docs/agent/studio-plan.md`. Guide: `docs/agent/studio-kit.md`; what waits on Nathan: `docs/PENDING.md` 1f. The Studio's art is drawn from the site (2026-10-19): the /studio splash is set like the home hero (gold-hairline eyebrow, the name in Castoro Titling at display scale, the Hannaford rendering in gold; `StudioSplashMotif.astro`), and the banner foot, the bare tower, the italic "Muncie" face and `public/studio-art/` (motifs kept for starter card 128) come from `node scripts/gen-studio-art.mjs`; edit the script, not its outputs. The Site Guide and Help panel are drawn in the church's design language (starter card 128, `brand.config.json` `studio.look`); Home's banner is re-set in the hero's grammar by `homeBanner.style` in `kit.config.ts` (starter card 135; `src/sanity/studioHomeBanner.css` keeps only the Sofia Sans font import); the Studio signs in by token (card 129). The Studio has its own character (2026-10-20, `studio.look`): a lancet-arch section marker, square stones, a dashed gold connector (courses of stone), an ashlar-tile texture on featured panels, banner titles in Castoro Titling, and stones that are laid in turn (`motion: lay`); all three new files come from `gen-studio-art.mjs`, and `npm run check:look` stays quiet. Bench: `/kit-harness/guide/`, dev only.
