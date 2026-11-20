# First Baptist Church Muncie: CLAUDE.md

**What this repo is.** The First Baptist Church Muncie website, replacing the church's Wix site. Forked from `ncs-astro-sanity-starter` on 2026-09-18. The binding spec is `docs/superpowers/specs/2026-09-18-fbcm-rebuild-design.md` and the art-direction spec is `docs/superpowers/specs/2026-09-20-fbcm-art-direction-design.md`; read the relevant one before a judgement call. Where it stands, pass history and design context: `docs/claude/status-history.md`, `docs/agent/changelog.md`, `PRODUCT.md`, `DESIGN.md`.

**Read `docs/PENDING.md` early in a session.** It is the live registry of open loops. If you finish or discover one, update it in the same commit. Change history is in `docs/agent/changelog.md`, and the tactical runbook is `OPERATIONS.md`.

**Path-scoped rules.** Extra rules load only when you touch matching files, from `.claude/rules/`: `preview.md`, `schema-and-data.md`, `dependencies-and-deploy.md`, `layout-and-css.md`, `theme-nav-scroll.md`, `brand-and-reskin.md`, `routes.md`, `copy-and-prose.md`, `tests-and-gates.md`, `live-writes-and-handoff.md`. Rule numbers below (1 to 20, 8b) are stable: code comments cite them as "CLAUDE.md rule N".

## Commands

Build and run:

- `npm run dev` serves the site and the Studio (`/studio`). `npm run build` is the full chain (share cards, scripture, Visitor covers, YouTube, `astro build`, Pagefind) and does NOT chain typegen; `npm run build:full` is `typegen` then `build`.
- `npm run typegen` after ANY schema change, before `npm run build` (rule 7). `npm run preview` is `wrangler dev -c dist/server/wrangler.json`, the only way to exercise the SSR routes locally.
- `npm run deploy` is `npm run build && wrangler deploy -c dist/server/wrangler.json`. Never a bare `wrangler deploy`. Never `npx sanity deploy`.
- `npm run free-dist` clears a stale `wrangler dev` / `astro preview` holding `dist/` (Windows `EPERM ... dist\client`).

Gates (what CI runs, see below):

- `npm run check` (`astro check && npm run lint`), `npm run format:check`, `npm run check:links` (after a build), `npm run test:unit` (node --test, `src/lib/*.test.ts`), `npm run test:scripts` (`scripts/lib/*.test.mjs`), `npm test` (Playwright; `npm run test:ui` opens its UI; `PLAYWRIGHT_PORT` moves it off 4321). `npm run check:full` is `typegen`, build, `test:unit`, `test:scripts`.
- `npm run parity:capture` / `npm run parity:compare` (and `npm run parity list | capture | compare [page]`): rendered-HTML parity, run after a build on any change meant to be render-neutral. It never builds. `npm run parity compare` is 176/176 PASS (the baseline was recaptured 2026-10-03; it said 170 before the content grew).
- `npm run sync-check` diffs PORTABLE-marked files against the starter.
- More gates and script detail (measure-columns, measure-tap-targets, data and tooling scripts, internal-link rule 2026-10-25, starter card 89): `docs/claude/build-and-scripts.md`. Internal links end in a slash (`trailingSlash: 'always'`); data-built hrefs go through `withTrailingSlash()`.

## Branches, CI and deploy

- `main` is the only long-lived branch and is production (staging was abandoned 2026-10-03). Work on short-lived branches, PR into `main`, CI must be green (checks `build` and `test`), and the merge is the production deploy: a push to `main` deploys (`.github/workflows/deploy.yml`). Prose-only pushes (`docs/**`, root Markdown, `.github/**/*.md`, `.claude/**/*.md`) skip the deploy.
- CI shape, snapshot rule (CI never reads live content: `scripts/snapshot.mjs`), deploy schedule: `docs/agent/deployment.md`.
- Do not bump any pinned dependency in isolation, and never run `npm audit fix --force` (rule 8).
- Before reporting any UI change done: look at it rendered at ~375px and ~1280px, light only, hover and keyboard focus, with a real scrollbar. Gates prove correctness, not appearance (`.claude/rules/layout-and-css.md`).

## Stack essentials

Full stack notes and the `astro.config.mjs` landmines are in `docs/agent/stack-and-config.md`. The must-knows:

- **Astro 7.x**, TypeScript strict, `output: 'static'` with a handful of SSR routes. Node 22.23.4 (pinned in `.nvmrc`, which every workflow reads; starter card 209).
- **Sanity v6** is the CMS. The Studio lives IN THIS PACKAGE (schemas in `src/sanity/schemaTypes/`, desk in `src/sanity/structure.ts`, config at the repo-root `sanity.config.ts`, CLI config in `sanity.cli.ts`) and is **embedded at `/studio`** via `@sanity/astro`, so it rebuilds with every deploy and can never drift stale. There is deliberately no `studioHost`/`deployment` in `sanity.cli.ts` so a stray `sanity deploy` cannot recreate a hosted copy. `npm run typegen` regenerates types from the schemas.
- **Live draft preview at `/preview/**`** through Sanity's Presentation tool: click-to-edit, live refresh over SSE, and in-canvas section controls. See the preview rules below and `docs/agent/preview.md`.
- **Tailwind 4 via `@tailwindcss/vite`.** There is no `tailwind.config.mjs`. Brand tokens live in `@theme` blocks in `src/styles/globals.css`.
- **React 19 islands** for interactivity; Astro components for everything static.
- **Cloudflare Workers** for hosting, not Pages (Pages is in maintenance mode). Deploy with `npm run deploy`, which is `wrangler deploy -c dist/server/wrangler.json`. A bare `wrangler deploy` reads the root `wrangler.jsonc`, which knows nothing about the SSR entrypoint, and every sub-route 404s.
- **`sanityFetch(query, params, fallback)`** in `src/lib/sanity.ts` is the single chokepoint for all Sanity reads. When `PUBLIC_SANITY_PROJECT_ID` is absent or set to the placeholder value, it returns the fallback without any network call, so `npm run build` succeeds with no Sanity project configured -- pages render their default-sections content (see below).
- More stack notes (Studio admin, authoring kit, no site forms, page builder, default sections, brand reskin): `docs/agent/studio-kit.md`, `docs/agent/sanity.md`, `docs/agent/stack-and-config.md`.

## Family conventions

Shared by every site repo in the family (one PORTABLE file, imported here; notes in `docs/claude/ports-and-portable.md`).

@docs/claude/family-conventions.md

Repo-specific deltas: family cards 186 to 192, 197, 198 and foundation-vs-safe-to-edit (`docs/agent/file-map.md`) are in `docs/claude/ports-and-portable.md`. Ask before installing a dependency (rule 8). FBCM is light-only, so UI verification is one theme (rule 3).

## Preview rules (stega) in short

Never compare or measure a stega-encoded string (use `splitStega().cleaned`); `/preview/live` is an event-driven SSE proxy, never an interval poll; `/preview/**` must send `Cache-Control: no-store`. Full text: `.claude/rules/preview.md`, `docs/agent/preview.md`.

## The rules that bite if you forget them

Condensed. The full text of every rule is in `docs/claude/rules-full.md`, and in the path-scoped file named at the end of each rule, which loads when you touch matching files.

1. **Never click "Remove field" in the Studio.** It deletes that field's data everywhere and cannot be undone without a dataset restore. After a schema change: edit schema, `npm run typegen`, commit, deploy. (`schema-and-data.md`)
2. **No em-dashes in public-facing site copy** (the text visitors read: page copy, component text, Sanity content). Use commas, colons, or restructure. Code comments, commit messages, plans, specs, and internal docs are exempt.
3. **FBCM is LIGHT-ONLY since 2026-09-24**: `site.theme` is `'light'`, no toggle, no dark runs. Build and check in light only; the dark block and `ThemeToggle.tsx` are dormant, not deleted. (`theme-nav-scroll.md`)
4. **Desktop nav is server-rendered** in `Header.astro`; do not regress it to a client-only island. (`theme-nav-scroll.md`)
5. **Scrolling is native; no scroll library.** The router owns top-on-forward and instant restore on Back. Never put `scroll-behavior: smooth` on plain `html`. (`theme-nav-scroll.md`)
6. **Content is statically built.** A Sanity edit goes live only after a rebuild (push to `main`, or the publish webhook). Detail in `docs/agent/deployment.md`.
7. **After any schema change, run `npm run typegen` before `npm run build`** (or use `npm run build:full`). `src/lib/sanity.types.ts` is committed.
8. **The Astro / adapter / wrangler / Sanity / React versions are a MATCHED SET. Do not bump one in isolation.** `@astrojs/cloudflare` exactly 14.3.4, `wrangler` ~4.129.0, `react` / `react-dom` / `react-is` exact 19.3.1, `sanity` 6.19.0 with `@sanity/ui` 4.4.9 (phase-2 set, PORTS.md card 103), `@portabletext/block-tools` exact 6.0.4. Never `npm audit fix --force`. `session: false` and no `assets.not_found_handling` are load-bearing. Curling a page is not verifying it. (`dependencies-and-deploy.md`, PORTS.md cards 10, 13, 14)
   - 8b. **A logic-driving dropdown field goes into `NON_STEGA_FIELDS` in `src/lib/cms-preview.ts` in the same commit**, or the block renders the wrong branch in the preview only. (`preview.md`)
9. **Blocks carry no colour, surface, tone, background or accent field**; `SectionRenderer` owns the cadence (`src/lib/sectionCadence.ts`) and `section-fields.test.ts` enforces it. (`schema-and-data.md`)
10. **The reserved-slug guard lives inside `getStaticPaths` in `[slug].astro`**, never at module scope (list in `src/lib/reservedSlugs.ts`). (`routes.md`)
11. **This repo was forked from a client build: check for residue** (logos, names, palettes, Worker names) before trusting a default; audit is PORTS.md card 44. (`brand-and-reskin.md`)
12. **`apply-brand` does not install font packages**: `npm install @fontsource/...` first. (`brand-and-reskin.md`)
13. **After `apply-brand`, run `npm run build`.** (`brand-and-reskin.md`)
14. **A capability is added with its scaffold markers in the same commit**, or `npm run scaffold -- --remove` silently leaves it behind. Commit markers before testing a removal. (`schema-and-data.md`)
15. **Anything computable from data is derived at build time, never a field an editor can retype.** Give the editor the inputs, not the answer. (`schema-and-data.md`)
16. **Retiring data is a backup-then-delete script, dry first, never a raw delete** (`scripts/cutover.mjs` is dry by default; `--write` acts). (`schema-and-data.md`)
17. **One grammar per page**: one left edge, one split, one button family; `align` on `SectionHeading.astro` is chosen once per page. (`layout-and-css.md`)
18. **Pair `break-words` with `max-w-full`** on inline-block / shrink-to-fit text; check 320px with `getBoundingClientRect()`. (`layout-and-css.md`)
19. **Never size a layout box in `vw`** to reach the viewport edge: use `cqw` against `#main`. (`layout-and-css.md`)
20. **The site stylesheet has an inline-size ceiling** (147,456 B per `.css` chunk); after any CSS addition, `grep -rl --include=index.html '<link rel="stylesheet"' dist/client | grep -v -e studio -e preview` must print nothing. (`layout-and-css.md`)

Files named above live in `.claude/rules/`.

## Docs map

Read on demand, not auto-loaded. Open loops: `docs/PENDING.md`. The full one-line-per-file map (every `docs/agent/` deep-dive, bootstrap, modules, archive, PORTS, rules-full, status-history, test-inventory, live-writes note, slash commands): `docs/claude/docs-map.md`. Live writes (Sanity dataset, Cloudflare, deploys) are pre-approved: run them yourself, backup first.

## Vault (business context and decisions)

- Business context, decisions and the Work log live in `_vault/clients/first-baptist-muncie.md` at the Projects root (`C:\Users\natha\Documents\Claude\Projects\_vault`), never in this repo. Read its `## Current state` first. Rules: `_vault/README.md`.
- Update the repo docs (this file, `.claude/rules/`, `docs/claude/`, README, OPERATIONS, `docs/PENDING.md`) in the same piece of work as any change to code, behaviour, setup or a decision, before calling it done.
- Record decisions at the top of the note's Decision log, and tick or add `- [ ] #nathan` items. Work log: the note keeps a `## Work log`, so append a row (`- YYYY-MM-DD | ~Xh | summary`) at the end of each real-work session and commit and push `_vault/` (`_vault/README.md` rule 6); append a row at session end, then commit and push the vault.

## Ports

The starter owns `PORTS.md` and the files whose first line says `PORTABLE: canonical copy` (checked by `node scripts/sync-check.mjs`; change the starter first). A fix that generalises gets a port card in the same commit; a lesson that bites two or more repos goes in `_vault/gotchas/`. Full notes: `docs/claude/ports-and-portable.md`.
