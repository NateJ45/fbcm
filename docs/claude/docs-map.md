## Docs map (moved from CLAUDE.md)

Read these on demand. They are NOT auto-loaded, and they are referenced as plain paths so they stay lazy. Open with the Read tool when a task touches the area.

**Note:** the `docs/agent/` deep-dives are being genericized in a later pass. Some may still contain client-specific examples until that pass completes. Trust the patterns; ignore client-specific nouns.

`docs/bootstrap/NEW-PROJECT.md` is the setup entry point for adapting this starter to a new project, and `docs/bootstrap/setup-checklist.md` is the pre-launch sign-off that goes with it.

- Open loops registry (read early each session): `docs/PENDING.md`
- GA4 events (what is tracked, the settings, how to verify): `docs/agent/analytics.md`
- Live draft preview, full reference: `docs/agent/preview.md`
- The Report tool in the Studio (card 218; the church's parts and words are `src/config/board.ts`, switch `PUBLIC_BOARD_REPORT`, bench `/styleguide/report/`): `docs/agent/studio-kit.md`, "The Report".
- The Studio kit (Home, Site Guide, Checkup, Trash, Quick update, the look, the edges; PORTABLE): `docs/agent/studio-kit.md`
- What is safe to edit vs foundation, file by file: `docs/agent/file-map.md`
- Stack detail + astro.config landmines: `docs/agent/stack-and-config.md`
- Page + section architecture, nav, visibility toggles: `docs/agent/page-architecture.md`
- Brand colors + theme system (light/dark discipline): `docs/agent/theme-and-color.md`
- Brand reskin system (config schema, apply-brand, /reskin skill): `docs/brand/brand-system.md`
- Polish layer (brand stripe, sticky header, reading progress, print stylesheet): `docs/agent/polish-layer.md`
- Animation layer (native scroll, reveals, glyph draw, view transitions, script accent, the flow layer and the photo hero clip): `docs/agent/animation.md`
- Wayfinding (phone menu groups, where-next rows, the Sunday bar): `docs/agent/wayfinding.md`
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
- Live writes (Sanity dataset, Cloudflare, deploys) are pre-approved (2026-10-03): run them yourself, backup first. Hand Nathan a run list only if the auto-mode classifier actually refuses; never route around a refusal. `.claude/rules/live-writes-and-handoff.md`.
- Slash commands in `.claude/commands/` (`rebuild`, `sanity-audit`, `visual-verify`) and the `/reskin` skill in `.claude/skills/reskin/SKILL.md`.
