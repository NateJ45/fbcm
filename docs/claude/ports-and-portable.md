# PORTABLE files and the starter (full notes)

Moved out of CLAUDE.md. Read this before editing any file whose first line carries the `PORTABLE: canonical copy` marker, or before a sync session with `ncs-astro-sanity-starter`.

This repo is a **consumer** of the site family's shared code, not its library of record. The library of record is `ncs-astro-sanity-starter` (the sibling folder), and `PORTS.md` is the registry: an applied-to matrix and one dated card per shared improvement. 87 files here carry a first-line `PORTABLE: canonical copy` marker, which means the starter owns them. `npm run sync-check` diffs them against the starter's copies.

- Do not make a site-specific change in a marked file. If the change is general, make it, note it on the matching `PORTS.md` card for the next sync session, and say so in the commit. If it is site-specific, it belongs somewhere else, or the marker comes off deliberately with a note on the card (that is what happened to `playwright.config.ts`, card 35).
- `src/lib/sanity-dedupe-alias.ts` (+ test) is one of them (card 60, 2026-09-29): `fixSanityDedupeAlias()` in `astro.config.mjs` repairs `@sanity/astro`'s dev-only alias, which points `sanity` at its package.json on Windows and kills `astro dev` with `[MISSING_EXPORT]`. Keep it, and never use `SANITY_ASTRO_DISABLE_MODULE_DEDUPE=1` instead (the Studio then fails to hydrate). See `docs/agent/stack-and-config.md`.
- Findings on this fork that belong upstream are collected in `docs/upstream/2026-09-20-starter-findings.md` and in the "For ncs-astro-sanity-starter" list in `docs/PENDING.md`.
