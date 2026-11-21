# PORTABLE files and the starter (full notes)

Moved out of CLAUDE.md. Read this before editing any file whose first line carries the `PORTABLE: canonical copy` marker, or before a sync session with `ncs-astro-sanity-starter`.

This repo is a **consumer** of the site family's shared code, not its library of record. The library of record is `ncs-astro-sanity-starter` (the sibling folder), and `PORTS.md` is the registry: an applied-to matrix and one dated card per shared improvement. 88 files here carry a `PORTABLE: canonical copy` marker (the first line, or the `_portable` key in `.claude/settings.json`), which means the starter owns them. `npm run sync-check` diffs them against the starter's copies.

- Do not make a site-specific change in a marked file. If the change is general, make it, note it on the matching `PORTS.md` card for the next sync session, and say so in the commit. If it is site-specific, it belongs somewhere else, or the marker comes off deliberately with a note on the card (that is what happened to `playwright.config.ts`, card 35).
- `.claude/settings.json` and `docs/claude/family-conventions.md` are two of them (card 71, adopted 2026-10-03). The first holds the tracked deny rules for force-push and `git reset --hard`; the second holds the code conventions and Working-with-Claude habits that `CLAUDE.md` imports with `@docs/claude/family-conventions.md`. Both are byte-identical to the starter and are never edited here. A personal allow-list goes in `.claude/settings.local.json`, which stays untracked.
- `src/lib/sanity-dedupe-alias.ts` (+ test) is one of them (card 60, 2026-09-29): `fixSanityDedupeAlias()` in `astro.config.mjs` repairs `@sanity/astro`'s dev-only alias, which points `sanity` at its package.json on Windows and kills `astro dev` with `[MISSING_EXPORT]`. Keep it, and never use `SANITY_ASTRO_DISABLE_MODULE_DEDUPE=1` instead (the Studio then fails to hydrate). See `docs/agent/stack-and-config.md`.
- Findings on this fork that belong upstream are collected in `docs/upstream/2026-09-20-starter-findings.md` and in the "For ncs-astro-sanity-starter" list in `docs/PENDING.md`.
- `src/lib/href.ts` (+ test) is one of them (card 89, adopted 2026-10-25): `withTrailingSlash()` puts the slash on every internal page link, paired with `trailingSlash: 'always'` in `astro.config.mjs`. The site-specific half is `src/lib/body-link.ts`, which is not marked: it maps own-domain and old Wix paths in post text to their final slashed address.

## Known drift (checked 2026-10-03 against the starter PR #75 worktree, which holds cards 77 to 80)

`NCS_STARTER_DIR=<starter PR #75 worktree> node scripts/sync-check.mjs`: 86 same, 0 drifted, 0 missing in starter (86 marked). Nothing is drifted against that starter state. Against starter `origin/main` 916f53a (before cards 77 to 79 landed there) the same run was 81 same, 5 drifted, where each drift was fbcm AHEAD; those five are now the starter's own copies. To clear a future drift, port the change to the starter with a PORTS.md card, or take the marker off deliberately.

- **Un-marked as site-specific (2026-10-03, card 35 reasoning):** `scripts/audit-studio.mjs` (the starter's `RENDERED_BY` map and fee list are scaffold content; fbcm's carry church fields and a shared-field-const parser), `scripts/generate-llms-full.mjs` (reads identity from `brand/brand.config.json` and has church fields) and `scripts/lib/render-og.mjs` (the FBCM palette and Castoro Titling baked in). They no longer carry the marker, so `sync-check` does not track them. Generic parts of them (the shared `defineField` const parser, the brand-config identity fallback) are candidates to promote to the starter by hand.
- **Synced instead:** `src/lib/page-checks.ts` differed only in two comment examples (/blog and /post where the starter says /journal), so it stays marked and now equals the starter's copy.
- **Resynced with cards 75 and 76 (2026-10-03):** `tests/fixtures.ts` (card 75, the Sanity image disk cache; gained the `PORTABLE:` marker, the code was already identical), `playwright.visual.config.ts` (card 76; the web-server timeout is now read from `PLAYWRIGHT_WEBSERVER_TIMEOUT_MS`, default 180000, and `.github/workflows/visual.yml` sets `'600000'` for the ~390 page build, so the file stays byte-identical), and `tests/smoke.spec.ts` (the starter's copy, with the card 58 localhost GA test). `tests/a11y.spec.ts` and `tests/reflow.spec.ts` were already same after starter PR #69. fbcm's two Wix-migration URL tests (`/post/<non-ASCII slug>`, `/blog`) moved unchanged out of `smoke.spec.ts` into the UNMARKED `tests/site-urls.spec.ts`, which is site-specific and not synced. It runs on the `chromium` project only; `smoke.spec.ts` is also matched by `webkit-iphone`, so those two tests no longer run on WebKit.
- **Resynced with card 80 (2026-10-03):** `scripts/sync-check.mjs` now skips `_worktrees/` folders (`SKIP_DIRS` gained `'_worktrees'`, next to `worktrees`). Before, a checkout with live worktrees counted every marked file once per worktree copy and reported each copy as `MISSING-IN-STARTER` (86 extra rows per worktree here, so 172 files checked with one worktree), burying the real drift. CI never saw it because a fresh checkout has no `_worktrees/`, and the CI self-check runs from this repo as its own starter. Safe to merge before or after starter PR #75 lands.
- **Ahead, candidates to promote (resolved):** `src/lib/preview-morph.ts` and its test, `src/lib/preview-stega.ts` and `src/lib/redirects.ts` and its test were the five drifted files against 916f53a. They came back SAME against the PR #75 starter (cards 77 to 79 promoted them), so nothing is left to promote from this list.

## Family card deltas (moved from CLAUDE.md)

- **Family cards 186 to 188, 197, 198 (2026-10-27):** the one scale and fallback fonts in `globals.css`, the page-weight budget (`tests/page-weight.config.json`), layout slots at defaults. Do not run `apply-brand`. Detail: `docs/agent/design-tokens.md`, last section.
- **Family cards 188 to 192 (2026-10-27):** shape tokens cut to the lancet; the opt-in photo hero (Page opener Style, off everywhere; Home is Nathan's call, PENDING 0a); the church's wayfinding as code defaults until Site settings is filled (phone menu groups, where-next rows, the Sunday bar on Home and Visit; `src/data/wayfinding-defaults.ts`, `docs/agent/wayfinding.md`); the flow layer installed but `motion` stays `reveal` (PRODUCT.md principle 5, `docs/agent/animation.md`).

## Ports, the starter and the family (moved from CLAUDE.md)

- `internal/ncs-astro-sanity-starter/PORTS.md` is the registry of improvements shared across the site family; this repo has its own `PORTS.md` (its applied-to matrix and cards).
- Files whose first line says `PORTABLE: canonical copy` are canonical in the starter and checked by `node scripts/sync-check.mjs`. Do not make site-specific changes in them (full notes: `docs/claude/ports-and-portable.md`).
- A fix that generalises gets a port card in the SAME commit. A lesson that bites two or more repos goes in `_vault/gotchas/` with an "applies-to" list and a "Ported to" checklist.

## Family conventions note (moved from CLAUDE.md)

Shared by every site repo in the family, so they live in one PORTABLE file imported here (it is expanded into context at launch, so this saves lines in this file, not tokens): the code conventions (strict TypeScript, header comments, Astro and React islands, images, Tailwind) and the working-with-Claude habits (desktop app, Plan Mode, confirm before installing, describe design in plain language, verify in a real browser).

## Repo-specific deltas, the short ones (moved from CLAUDE.md)

- Foundation vs safe to edit, file by file: `docs/agent/file-map.md`. Tokens, copy, `src/data/*` and assets are safe to edit. `globals.css` beyond the tokens, the schemas, the Studio config, the preview stack, `SectionRenderer.astro`, `BaseLayout.astro`, `src/lib/sanity.ts` and `queries.ts` are foundation and need a planned change.
- Ask before installing a dependency (rule 8 is why).
- FBCM is light-only, so UI verification is one theme (rule 3).
