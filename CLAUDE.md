# First Baptist Church Muncie: CLAUDE.md

**What this repo is.** The First Baptist Church Muncie website (309 East Adams Street, Muncie, IN 47305), replacing the church's Wix site. Forked from `ncs-astro-sanity-starter` on 2026-09-18, so a lot of the machinery here is the starter's; this file describes FBCM as it is now. The binding spec is `docs/superpowers/specs/2026-09-18-fbcm-rebuild-design.md`, and the art-direction spec is `docs/superpowers/specs/2026-09-20-fbcm-art-direction-design.md`. Read the relevant one before making a judgement call about what the site should do.

**Where it stands (short).** Thirteen page-builder pages (`/`, `/visit`, `/who-we-are`, `/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding`, `/give`, `/contact`, `/blog`, `/visitor`, `/architecture`), each seeded by a module under `scripts/pages/`. 142 imported posts at their original `/post/<slug>` URLs, 17 staff, 5 ministries, 48 retired-URL redirects. No form of the site's own. Deployed at https://fbcm-site.nathanjnixon86.workers.dev; live www.fbcmuncie.org is still the Wix site. **Next is plan 3, the cutover** of `fbcmuncie.org` (`docs/superpowers/notes/2026-09-20-cutover-plan.md`), which waits on Nathan's decisions listed in `docs/PENDING.md`. The full pass-by-pass history of what was built, with branches and dates, is in `docs/claude/status-history.md`.

**Design context.** `PRODUCT.md` (audience, purpose, tone, anti-references; open questions are `TODO(Nathan)` lines) and `DESIGN.md` (the visual system as built) sit at the repo root; read them before any design work and update them in the same change when the system moves.

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
- `npm run parity:capture` / `npm run parity:compare` (and `npm run parity list | capture | compare [page]`): rendered-HTML parity, run after a build on any change meant to be render-neutral. It never builds. `npm run parity compare` is 170/170 PASS.
- `npm run sync-check` diffs PORTABLE-marked files against the starter.

Data and tooling scripts (all dry by default, backup-first; detail in `docs/claude/build-and-scripts.md`): `npm run seed-pages`, `npm run scaffold` (flags after `--`), `npm run audit:studio`, `npm run apply-brand`, `npm run og:pages`, `npm run og`, `npm run check:jsonld`. Do not run `npm run seed` against this dataset.

## Branches, CI and deploy

- `main` is the only long-lived branch and is production (staging was abandoned 2026-10-03). Work on short-lived branches, PR into `main`, CI must be green (checks `build` and `test`), and the merge is the production deploy: a push to `main` deploys (`.github/workflows/deploy.yml`). Prose-only pushes (`docs/**`, root Markdown, `.github/**/*.md`, `.claude/**/*.md`) skip the deploy.
- CI (`ci.yml`, restructured by PORTS.md card 70) runs on every push and PR, with no path filter, as parallel jobs: `static` (typegen, stale-types guard, `astro check`, lint, format, unit tests), `site` (ONE `npm run build`, then uploads `dist/client`), `links` (the link check, run on that artifact in parallel with `e2e` so it is off the critical path) and `e2e` (Playwright in 3 shards that download that artifact and set `PLAYWRIGHT_SKIP_BUILD=1`, browsers cached by Playwright version; the shards are WEIGHTED blocks, `PWTEST_SHARD_WEIGHTS` in the step's `env`, because Playwright's default equal-count split put the 160 reflow tests in two shards and ran 109s / 185s / 251s: re-measure and edit the three weights when tests are added in bulk). `build` (needs `static` + `site` + `links`) and `test` (needs `e2e`) are aggregator jobs that keep the two required-check names; they fail unless everything behind them succeeded. The `site` build carries the fixture env that `playwright.config.ts` puts on its webServer (`LAST_SUNDAY_*`, `VISITOR_FIXTURE`, `CHURCH_*`): keep the two lists in step, or the shards assert against live feeds. `lighthouse.yml` (`npx lhci autorun`) is path-filtered, audits one URL per template on a PR (full list on push to `main`, weekly schedule and dispatch); `visual.yml` is path-filtered on PR as well as push. Parity is deliberately a local gate. The family test standard is PORTS.md card 35 and card 70.
- `deploy.yml` also runs on the Sanity publish webhook (rule 6) and on a schedule: Sunday afternoon, Monday, Thursday and Saturday mornings, for the Last Sunday replay and the coming Sunday's broadcast. Details in `docs/agent/deployment.md`.
- Do not bump any pinned dependency in isolation, and never run `npm audit fix --force` (rule 8).
- Before reporting any UI change done: look at it rendered at ~375px and ~1280px, light only, hover and keyboard focus, with a real scrollbar. Gates prove correctness, not appearance (`.claude/rules/layout-and-css.md`).

## Stack essentials

Full stack notes and the `astro.config.mjs` landmines are in `docs/agent/stack-and-config.md`. The must-knows:

- **Astro 7.x**, TypeScript strict, `output: 'static'` with a handful of SSR routes. Node 22.12+.
- **Sanity v6** is the CMS. The Studio lives IN THIS PACKAGE (schemas in `src/sanity/schemaTypes/`, desk in `src/sanity/structure.ts`, config at the repo-root `sanity.config.ts`, CLI config in `sanity.cli.ts`) and is **embedded at `/studio`** via `@sanity/astro`, so it rebuilds with every deploy and can never drift stale. There is deliberately no `studioHost`/`deployment` in `sanity.cli.ts` so a stray `sanity deploy` cannot recreate a hosted copy. `npm run typegen` regenerates types from the schemas.
- **Live draft preview at `/preview/**`** through Sanity's Presentation tool: click-to-edit, live refresh over SSE, and in-canvas section controls. See the preview rules below and `docs/agent/preview.md`.
- **Tailwind 4 via `@tailwindcss/vite`.** There is no `tailwind.config.mjs`. Brand tokens live in `@theme` blocks in `src/styles/globals.css`.
- **React 19 islands** for interactivity; Astro components for everything static.
- **Cloudflare Workers** for hosting, not Pages (Pages is in maintenance mode). Deploy with `npm run deploy`, which is `wrangler deploy -c dist/server/wrangler.json`. A bare `wrangler deploy` reads the root `wrangler.jsonc`, which knows nothing about the SSR entrypoint, and every sub-route 404s.
- **No form of the site's own**: visitors use the church's forms, linked through Site settings' Church systems boxes, or embedded from Church Trac by a "Church Trac form" band (only a churchtrac.com address from the pasted code reaches the page, `src/lib/church-trac-form.ts`). **Cloudflare Web Analytics** (cookieless, no banner).
- **`sanityFetch(query, params, fallback)`** in `src/lib/sanity.ts` is the single chokepoint for all Sanity reads. When `PUBLIC_SANITY_PROJECT_ID` is absent or set to the placeholder value, it returns the fallback without any network call, so `npm run build` succeeds with no Sanity project configured -- pages render their default-sections content (see below).
- **Page builder:** `src/components/SectionRenderer.astro` maps each block `_type` to a component and owns the alternating-surface cadence (logic in `src/lib/sectionCadence.ts`, unit-tested). Blocks carry no color field; the cadence is automatic.
- **Default sections fallback:** `src/data/defaultSections.ts` holds code-defined default content arrays for each core page. When a page's `pageBuilder` array is absent (fresh clone, no Sanity project), the route uses the defaults, so the site always renders non-blank content.
- **Brand reskin:** `brand/brand.config.json` is the single source of truth for identity + palette + fonts + logo paths. Running `npm run apply-brand` deterministically rewrites `globals.css` tokens, `src/data/site.ts`, the Studio theme's font stacks in `sanity.config.ts`, and the OG image. For a full rebrand orchestration (interview, font install, apply, contrast check, copy retone) use the `/reskin` skill at `.claude/skills/reskin/SKILL.md`.

## Family conventions

Shared by every site repo in the family, so they live in one PORTABLE file imported here (it is expanded into context at launch, so this saves lines in this file, not tokens): the code conventions (strict TypeScript, header comments, Astro and React islands, images, Tailwind) and the working-with-Claude habits (desktop app, Plan Mode, confirm before installing, describe design in plain language, verify in a real browser).

@docs/claude/family-conventions.md

Repo-specific deltas:

- Foundation vs safe to edit, file by file: `docs/agent/file-map.md`. Tokens, copy, `src/data/*` and assets are safe to edit. `globals.css` beyond the tokens, the schemas, the Studio config, the preview stack, `SectionRenderer.astro`, `BaseLayout.astro`, `src/lib/sanity.ts` and `queries.ts` are foundation and need a planned change.
- Ask before installing a dependency (rule 8 is why).
- FBCM is light-only, so UI verification is one theme (rule 3).

## Preview rules (stega) in short

Full text and the other preview rules: `.claude/rules/preview.md` (loads when you touch the preview stack); reference `docs/agent/preview.md`. The ones that bite without warning:

- **Never compare a stega-encoded string in logic, and never measure one.** Display strings go through `splitStega().cleaned` before any split, length, slice or count; enums that drive rendering go in `NON_STEGA_FIELDS` (`src/lib/cms-preview.ts`) the day the field is added (rule 8b).
- **`/preview/live` is an event-driven SSE proxy: never an interval poll.** `/preview/**` must send `Cache-Control: no-store`. The section-edit wrapper is preview-only and a real block box, never `display: contents`.

## The rules that bite if you forget them

Condensed. The full text of every rule is in `docs/claude/rules-full.md`, and in the path-scoped file named at the end of each rule, which loads when you touch matching files.

1. **Never click "Remove field" in the Studio.** It deletes that field's data everywhere and cannot be undone without a dataset restore. After a schema change: edit schema, `npm run typegen`, commit, deploy. (`schema-and-data.md`)
2. **No em-dashes in public-facing site copy** (the text visitors read: page copy, component text, Sanity content). Use commas, colons, or restructure. Code comments, commit messages, plans, specs, and internal docs are exempt.
3. **FBCM is LIGHT-ONLY since 2026-09-24**: `site.theme` is `'light'`, no toggle, no dark runs. Build and check in light only; the dark block and `ThemeToggle.tsx` are dormant, not deleted. (`theme-nav-scroll.md`)
4. **Desktop nav is server-rendered** in `Header.astro`; do not regress it to a client-only island. (`theme-nav-scroll.md`)
5. **Scrolling is native; no scroll library.** The router owns top-on-forward and instant restore on Back. Never put `scroll-behavior: smooth` on plain `html`. (`theme-nav-scroll.md`)
6. **Content is statically built.** A Sanity edit goes live only after a rebuild (push to `main`, or the publish webhook). Detail in `docs/agent/deployment.md`.
7. **After any schema change, run `npm run typegen` before `npm run build`** (or use `npm run build:full`). `src/lib/sanity.types.ts` is committed.
8. **The Astro / adapter / wrangler / Sanity / React versions are a MATCHED SET. Do not bump one in isolation.** `@astrojs/cloudflare` exactly 14.2.4, `wrangler` ~4.110.0, `react` / `react-dom` / `react-is` exact 19.2.7, `sanity` 6.9.1 (not 6.9.2), `@portabletext/block-tools` exact 5.2.0. Never `npm audit fix --force`. `session: false` and no `assets.not_found_handling` are load-bearing. Curling a page is not verifying it. (`dependencies-and-deploy.md`, PORTS.md cards 10, 13, 14)
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

Read these on demand. They are NOT auto-loaded, and they are referenced as plain paths so they stay lazy. Open with the Read tool when a task touches the area.

**Note:** the `docs/agent/` deep-dives are being genericized in a later pass. Some may still contain client-specific examples until that pass completes. Trust the patterns; ignore client-specific nouns.

`docs/bootstrap/NEW-PROJECT.md` is the setup entry point for adapting this starter to a new project, and `docs/bootstrap/setup-checklist.md` is the pre-launch sign-off that goes with it.

- Open loops registry (read early each session): `docs/PENDING.md`
- Live draft preview, full reference: `docs/agent/preview.md`
- What is safe to edit vs foundation, file by file: `docs/agent/file-map.md`
- Stack detail + astro.config landmines: `docs/agent/stack-and-config.md`
- Page + section architecture, nav, visibility toggles: `docs/agent/page-architecture.md`
- Brand colors + theme system (light/dark discipline): `docs/agent/theme-and-color.md`
- Brand reskin system (config schema, apply-brand, /reskin skill): `docs/brand/brand-system.md`
- Polish layer (brand stripe, sticky header, reading progress, print stylesheet): `docs/agent/polish-layer.md`
- Animation layer (native scroll, reveals, glyph draw, view transitions, script accent): `docs/agent/animation.md`
- Typography + spacing tokens: `docs/agent/design-tokens.md`
- Component catalog + long-read layout: `docs/agent/components.md`
- Component sourcing (shadcn, Starwind, Magic UI, PrimeReact, copy-paste sources, token-remap cheat sheet): `docs/agent/component-sources.md`
- Error + empty states: `docs/agent/error-states.md`
- Image handling: `docs/agent/images.md`
- Accessibility: `docs/agent/accessibility.md`
- SEO + JSON-LD: `docs/agent/seo.md`
- Performance budgets + Lighthouse: `docs/agent/performance.md`
- Content data + Sanity integration: `docs/agent/sanity.md`
- Deployment + env vars + rebuild model: `docs/agent/deployment.md`
- Editor-driven vs hardcoded: `docs/agent/editor-vs-hardcoded.md`
- Shared code conventions and Working-with-Claude habits (PORTABLE, imported above): `docs/claude/family-conventions.md`. Tracked deny rules for force-push and hard reset: `.claude/settings.json` (also PORTABLE; personal allow-lists go in `.claude/settings.local.json`).
- Cross-repo shared improvements (port cards + applied-to matrix + drift check): `PORTS.md`
- Change history (prose ledger; the checkable matrix lives in PORTS.md): `docs/agent/changelog.md`
- New-project setup runbook + pre-launch checklist: `docs/bootstrap/NEW-PROJECT.md`, `docs/bootstrap/setup-checklist.md`
- Per-module enable guides (`events`, `resources`): `docs/modules/<module-name>.md`
- The eleven archived modules: what they are and how to bring one back: `archive/README.md`
- Full numbered rules 1 to 20, verbatim (the source for the condensed list above): `docs/claude/rules-full.md`
- Pass-by-pass history of what was built (branches, dates, files): `docs/claude/status-history.md`. Read when you need to know why or when something was built.
- Build pipeline and every standalone script, verbatim: `docs/claude/build-and-scripts.md`. Read before changing the build chain or running a seed or migration.
- Unit-suite and Playwright inventories: `docs/claude/test-inventory.md`. Read before changing what a suite watches; add a line when you add a suite.
- PORTABLE files and the starter, full notes: `docs/claude/ports-and-portable.md`. Read before editing a file whose first line says `PORTABLE: canonical copy`.
- Path-scoped rules (load automatically when matching files are touched): `.claude/rules/*.md`. Routes summary table and rule 10: `.claude/rules/routes.md`. Copy and prose rules: `.claude/rules/copy-and-prose.md`. Parity harness and CI gates: `.claude/rules/tests-and-gates.md`.
- Live writes (Sanity dataset, Cloudflare, deploys) are blocked by the auto-mode classifier even after a yes in chat: build the artifact, hand Nathan a numbered run list, verify read-only. Never route around a refusal. `.claude/rules/live-writes-and-handoff.md`.
- Slash commands in `.claude/commands/` (`rebuild`, `sanity-audit`, `visual-verify`) and the `/reskin` skill in `.claude/skills/reskin/SKILL.md`.

## Vault (business context and decisions)

- Business context, decisions and the Work log live in `_vault/clients/first-baptist-muncie.md` at the Projects root (`C:\Users\natha\Documents\Claude\Projects\_vault`), never in this repo. Read its `## Current state` first. Rules: `_vault/README.md`.
- Update the repo docs (this file, `.claude/rules/`, `docs/claude/`, README, OPERATIONS, `docs/PENDING.md`) in the same piece of work as any change to code, behaviour, setup or a decision, before calling it done.
- Record decisions at the top of the note's Decision log, and tick or add `- [ ] #nathan` items. Work log: the note keeps a `## Work log`, so append a row (`- YYYY-MM-DD | ~Xh | summary`) at the end of each real-work session and commit and push `_vault/` (`_vault/README.md` rule 6), even though `plan` is `none`; append a row at session end, then commit and push the vault.

## Ports (the starter and the family)

- `internal/ncs-astro-sanity-starter/PORTS.md` is the registry of improvements shared across the site family; this repo has its own `PORTS.md` (its applied-to matrix and cards).
- Files whose first line says `PORTABLE: canonical copy` are canonical in the starter and checked by `node scripts/sync-check.mjs`. Do not make site-specific changes in them (full notes: `docs/claude/ports-and-portable.md`).
- A fix that generalises gets a port card in the SAME commit. A lesson that bites two or more repos goes in `_vault/gotchas/` with an "applies-to" list and a "Ported to" checklist.
