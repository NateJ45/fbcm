---
paths:
  - 'src/lib/**/*.test.ts'
  - 'tests/**'
  - 'scripts/lib/*.test.mjs'
  - 'playwright*.config.ts'
  - 'scripts/page-parity.mjs'
  - 'scripts/.parity/**'
  - '.github/workflows/**'
  - 'lighthouserc.json'
---

# Tests, the parity harness and the CI gates

The full list of unit suites and Playwright specs is in `docs/claude/test-inventory.md`; add a line there when you add a suite. Four unit suites are GATES that fail on drift: `theme-tokens`, `layout-variants`, `section-fields` and `studio-guide-names`.

- `npm run parity list | capture | compare [page]` runs `scripts/page-parity.mjs`, the rendered-HTML parity harness. It never builds: build first, then capture or compare. Routes are auto-discovered from the build output and baselines live in `scripts/.parity/` (committed, 170 pages, generated blog archive pages excluded). Use it on any change that is meant to be render-neutral. See PORTS.md card 3. **`npm run parity:capture` / `npm run parity:compare`** bake in `--exclude "blog/page/**,blog/tag/**,blog/category/**/page/**"`, the exclusion this repo's baseline set was recaptured with on 2026-09-20 (plan 2c task 7): pagination, tag and per-category-page archive routes are hundreds of near-identical copies of the same template, so excluding them keeps a real diff from hiding in the noise while the first page of each template still covers it. `npm run parity compare` is 170/170 PASS, and it stays that way across a rebuild. **The one thing to know before you touch this harness is the loop that used to break it:** `scripts/.parity/*.html` is COMMITTED, Tailwind v4 scans every tracked file for classes, and task 7 moved the stylesheet inline, so a capture fed the next build's stylesheet and every page then reported a diff. `src/styles/globals.css` cuts it with `@source not` for `scripts/.parity`, `docs/` and the root Markdown (prose that names a utility class used to keep that class alive too). So a recapture now reaches a fixpoint: capture, rebuild, compare, and the stylesheet's byte count is identical on both sides. **Prove that pair of numbers rather than trusting one green run** -- green for the wrong reason is still red, and `docs/PENDING.md` known gap 2 names the two classes that proved it.
- `npm run check` is the fast gate: `astro check && npm run lint`. `npm run check:full` is `typegen`, build (which includes the embedded Studio) and the unit tests. Together with `npm run format:check`, `npm run check:links` and `npm test` (Playwright), that is what CI runs on every push and PR. `ci.yml` is parallel since PORTS.md card 62: `static` (checks and unit tests), `site` (one build, the link check, the `dist/client` artifact) and `e2e` (Playwright, 3 shards serving that artifact via `PLAYWRIGHT_SKIP_BUILD=1`), with `build` and `test` as aggregator jobs that keep the required-check names. **The fixture env vars in `playwright.config.ts`'s `webServer.env` are duplicated on the `site` build step in `ci.yml`**: the shards no longer build, so a fixture added to one place and not the other makes CI assert against live YouTube, Church Trac or calendar data. `lighthouse.yml` runs `npx lhci autorun` separately, path-filtered, on a one-URL-per-template sample on a PR; `visual.yml` is path-filtered on PR and push. The family test standard is PORTS.md card 35. Run `npm run parity compare` alongside on any change meant to be render-neutral; parity is deliberately a local gate (see the note in `.github/workflows/ci.yml`).
