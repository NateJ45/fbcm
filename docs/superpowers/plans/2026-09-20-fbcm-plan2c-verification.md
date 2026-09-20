# FBCM Plan 2c: Verification and Cutover Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the plan 2b site against the spec's measured targets, close the loops plan 2b parked, activate the editor preview on production, and hand Nathan a review walkthrough and a cutover plan he can read before the domain moves.

**Architecture:** Nothing new is designed. Each task measures or closes one thing: the icon set from the church's own mark, the last starter field retired with a backup, the preview secret set on the Worker, a Playwright assertion for anchors under the sticky header, a redirect verifier against the deployed site, Lighthouse numbers recorded per page with any fixes measured before and after, the one deliberate parity recapture with an exclusion option for the generated archive pages, and two notes for Nathan.

**Tech Stack:** Astro 7 static, Sanity v6, Cloudflare Workers (`wrangler` 4.110 pinned), Playwright, Lighthouse CI. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md` section 8 (verification and definition of done) and section 9 (the church's decisions). Open loops: `docs/PENDING.md` "Plan 2b landed". The approval note: `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`.

## Global Constraints

- No em-dashes in site copy or in either note for Nathan (they are read by the church).
- Measure before and after: every performance change carries the Lighthouse number that motivated it and the number after it, in the ledger and in the Lighthouse note.
- Every dataset write is dry by default, `--write`/`--apply` to act, verbatim backup to `scripts/data/backups/<id>-2026-09-20-plan2c.json` before the first write (rule 16). Backups committed.
- Secrets never appear in a transcript, a log, a commit or a report: the preview token is piped from `.env` straight into `wrangler secret put`; the controller runs that step, not an agent.
- PORTABLE files (`scripts/page-parity.mjs`, `scripts/generate-favicons.mjs`, `scripts/cutover.mjs`, `playwright.config.ts`) take only GENERAL changes, each noted in `docs/PENDING.md` under upstream findings for a PORTS card.
- Do not bump any pinned dependency; ignore wrangler's "newer version" banner.
- Gates before each commit: `npm run check` (0 errors), `npm run test:unit`, `npm run test:scripts`, `npm run audit:studio`, `npm run format:check`; before the last commit of each task that touches rendering: `npm run build && npm test`.
- Production checks run against `https://fbcm-site.nathanjnixon86.workers.dev`; nothing is deployed from the branch. The push to main after the merge is the deploy.
- Model guidance: Tasks 1, 2, 4, 5, 7 are mechanical (standard model); Task 6 needs judgement (capable model); Task 8 is prose for the church and Nathan (capable model); Task 3 is the controller.

---

## File structure

**Created**
- `public/favicon.svg` (replaced): the tower mark from `src/assets/logo-light.svg`, square viewBox; `npm run favicon` regenerates `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.
- `scripts/retire-featured-flag.mjs`: backup-then-unset `journalEntry.featured`.
- `tests/anchors.spec.ts`: anchor targets land below the sticky header, both projects.
- `scripts/verify-redirects.mjs`: every redirect document's `from` on the deployed origin answers a redirect to `to`, and `to` answers 200.
- `docs/superpowers/notes/2026-09-20-lighthouse.md`: per-page scores, desktop and mobile, before and after any fix.
- `docs/superpowers/notes/2026-09-20-review-walkthrough.md`: what Nathan looks at, page by page.
- `docs/superpowers/notes/2026-09-20-cutover-plan.md`: the dry plan `scripts/cutover.mjs` prints, annotated with the human prerequisites.
- `docs/upstream/2026-09-20-starter-findings.md`: the PORTS-card candidates for `ncs-astro-sanity-starter`.

**Modified**
- `src/sanity/schemaTypes/journalEntry.ts` (drop `featured`), `src/components/JournalCard.astro` (drop the prop), `src/lib/queries.ts` (drop the projection), `src/lib/pageBuilder.types.ts` if it names it.
- `scripts/page-parity.mjs` (PORTABLE, general: `--exclude <glob,...>` and `PARITY_EXCLUDE`), `scripts/.parity/*` (recaptured once).
- `tests/routes.ts` (nothing new unless Task 4 needs a route list), `docs/PENDING.md`, `CLAUDE.md` (icon set line, preview activation state, unit-test count), `public/llms.txt` if any page title changed.

---

### Task 1: The icon set from the church's own mark

**Files:**
- Modify: `public/favicon.svg`; regenerate `public/favicon.ico`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png` via `npm run favicon`
- Read: `src/assets/logo-light.svg` (the wordmark, five brand fills), `scripts/generate-favicons.mjs` (PORTABLE, do not edit), `public/site.webmanifest` or `public/manifest.webmanifest` if present

- [ ] **Step 1: Extract the tower.** Open `src/assets/logo-light.svg`; the tower is the group of paths filled `#39251e`, `#724f43`, `#b5aba3` and the two gold window panes `#d59b29` between the words FIRST and BAPTIST. Copy ONLY those paths into a new `public/favicon.svg` with a square `viewBox` that frames the tower with about 8% margin (compute from the paths' bounding box; use `getBBox()` in a browser or a quick Playwright evaluate, and paste the numbers in the report). Ground: none (transparent), because the tower's browns read on both light and dark tab strips; if the light tab strip makes the taupe face vanish, add a `#292854` rounded square behind it and say so. Keep the file under 6 KB; a top comment names the source file and the date; NO `--` inside the comment (an XML comment with a double hyphen blanks the SVG).

- [ ] **Step 2: Regenerate.** `npm run favicon`. Confirm the four raster files changed (`git status`), open `public/icon-512.png` and `public/apple-touch-icon.png` with the Read tool: the tower fills the frame, the panes are gold, nothing is clipped. `apple-touch-icon.png` needs an opaque ground (iOS paints black behind transparency): if the generator does not add one, put the `#292854` square in the SVG as above.

- [ ] **Step 3: Verify in a page.** `npm run build`, `npm run preview`, open `/` in the browser and screenshot the tab strip region (or `document.querySelector('link[rel=icon]').href` and open it directly) as `docs/superpowers/screenshots/2026-09-20/favicon-in-tab.png`. Also confirm `public/og-default.png` is unchanged (it typesets the name and is not part of this task).

- [ ] **Step 4: Gates and commit.** `npm run check && npm run test:unit && npm run format:check`. `git add public/favicon.svg public/favicon.ico public/apple-touch-icon.png public/icon-192.png public/icon-512.png docs/superpowers/screenshots/2026-09-20/favicon-in-tab.png && git commit -m "The icon set is the church's tower, from its own wordmark"`.

---

### Task 2: Retire `journalEntry.featured`

**Files:**
- Create: `scripts/retire-featured-flag.mjs`
- Modify: `src/sanity/schemaTypes/journalEntry.ts`, `src/components/JournalCard.astro`, `src/lib/queries.ts`, `src/lib/pageBuilder.types.ts` (only if it names `featured`), `src/pages/blog/index.astro` if it still passes the prop
- Read: `scripts/retire-sitesettings-fields.mjs` (the backup-then-unset shape), CLAUDE.md rule 1 and 16

- [ ] **Step 1: Count first.** `npx sanity documents query "count(*[_type=='journalEntry' && defined(featured)])"` and `"count(*[_type=='journalEntry' && featured==true])"`. Paste both.

- [ ] **Step 2: The script.** `scripts/retire-featured-flag.mjs`, modelled on `retire-sitesettings-fields.mjs`: fetch every `journalEntry` with `defined(featured)`; write them all verbatim to `scripts/data/backups/journalEntry-featured-2026-09-20-plan2c.json` (one file keyed by `_id`) BEFORE any write; dry prints `unset featured on <n> documents`; `--write` patches `unset(['featured'])` in one transaction. Idempotent: a second dry prints `nothing to do`.

- [ ] **Step 3: Order matters (rule 1).** Remove the `featured` field from the schema FIRST in the working tree, run `npm run typegen`, remove the prop from `JournalCard.astro`, the projection from `queries.ts`, and any type; `npm run check` 0 errors; `npm run audit:studio` will now report the stored key on live documents (check 3): run the script dry, then `--write`, then `npm run audit:studio` clean, then dry again (`nothing to do`).

- [ ] **Step 4: Gates and commit.** `npm run test:unit && npm run test:scripts && npm run format:check && npm run build && npm test`. `git add -A && git commit -m "Retire journalEntry.featured: the durable split is derived from category"` (the backup JSON is in the commit).

---

### Task 3 (controller): Activate the editor preview on production

**Files:** none in the repo except `docs/PENDING.md` and `CLAUDE.md` (state lines). The controller runs this task in the main session so the token never enters a subagent transcript.

- [ ] **Step 1: The secret.** From the worktree root, pipe the READ token into wrangler without echoing it:

```bash
node -e "const e=require('fs').readFileSync('.env','utf8').match(/^SANITY_API_READ_TOKEN=(.*)$/m)[1].trim(); process.stdout.write(e)" | npx wrangler secret put SANITY_TOKEN -c dist/server/wrangler.json
```

(`dist/server/wrangler.json` must exist: build first. If the Worker name in that file differs from production's, pass `--name <worker>`; read it from the file.) Expected: `Success! Uploaded secret SANITY_TOKEN`. Then `npx wrangler secret list -c dist/server/wrangler.json` shows `SANITY_TOKEN`.

- [ ] **Step 2: CORS.** `npx sanity cors list` already includes `https://fbcm-site.nathanjnixon86.workers.dev` (checked 2026-09-20); confirm it is listed WITH credentials (`npx sanity cors list` prints origins only; if in doubt `npx sanity cors add https://fbcm-site.nathanjnixon86.workers.dev --credentials` is idempotent).

- [ ] **Step 3: Prove fail-closed is gone.** `curl -sI https://fbcm-site.nathanjnixon86.workers.dev/preview/visit` must NOT be 503 any more (expect 401/403 or a redirect to the sign-in, since there is no preview cookie); paste the status and the first headers. `/preview/live` without the cookie stays 403.

- [ ] **Step 4: Record.** In `docs/PENDING.md` mark the preview-secret item done with the date; in `CLAUDE.md`'s preview section, one line: "Activated on production 2026-09-20: `SANITY_TOKEN` set on the Worker, deployed origin on the CORS list." Commit `Preview activated on production: secret set, CORS confirmed`. Nathan still has to sign in to `/studio` on the deployed origin and open the Preview tool to see it work; that stays a `#nathan` item.

---

### Task 4: Anchors land below the header, asserted

**Files:**
- Create: `tests/anchors.spec.ts`
- Read: `playwright.config.ts` (projects: chromium and webkit-iphone; the static server), `tests/smoke.spec.ts` (style), `src/styles/globals.css` (`--header-offset`), `src/components/Header.astro`

- [ ] **Step 1: Failing test.** For each of `/beliefs#baptists`, `/staff#kendall-ellis`, `/ministries#youth`, `/visit#accessibility`, `/history#building`: `page.goto(url)`, wait for `load` and one animation frame, then evaluate: the target element (`document.getElementById(hash)`) `getBoundingClientRect().top` is `>=` the header's `getBoundingClientRect().bottom` minus 1px, and `<=` the header bottom plus 64px (so the target is at the top, not lost mid-page). Run both projects. Also assert with `prefers-reduced-motion: reduce` emulated on chromium (Playwright `page.emulateMedia({ reducedMotion: 'reduce' })`) for `/beliefs#baptists`. Write the test, run it: it should PASS already (plan 2b F2 fixed the offset); if it fails on any URL, that is a real finding: report the measured numbers and fix `--header-offset` in `globals.css`, not the test.

- [ ] **Step 2: Wire and gate.** Ensure the spec file is picked up by the existing Playwright config (same folder/pattern as `smoke.spec.ts`). `npm test`: count rises by 6 per project. Commit `Anchors land below the sticky header, asserted in both projects`.

---

### Task 5: Every redirect verified on the deployed site

**Files:**
- Create: `scripts/verify-redirects.mjs`
- Read: `scripts/import-redirects.mjs` (how redirect documents are shaped: `from`, `to`, `permanent`), `src/lib/redirects.ts` (how the Worker or `_redirects` serves them), `dist/client/_redirects` after a build

- [ ] **Step 1: The verifier.** Reads the 44 redirect documents from Sanity (read token from `.env`, never printed) OR from `dist/client/_redirects` when `--from-dist` is passed (so it also works with no token). For each: `fetch(origin + from, { redirect: 'manual' })` expects a 301/302/307/308 whose `location` (path plus query and fragment stripped for comparison of the path only) equals `to`'s path; then `fetch(origin + to.path)` expects 200 (follow one trailing-slash redirect). Prints a table: from, status, location, target status, OK/FAIL; exits 1 on any FAIL. Origin from `--origin`, default the production URL in `src/data/site.ts`; `--origin http://127.0.0.1:8787` works against `npm run preview`.

- [ ] **Step 2: Run it against production** (`node scripts/verify-redirects.mjs --origin https://fbcm-site.nathanjnixon86.workers.dev`): expect 44/44 OK. The six `/blog/categories/<c>` rules land on `/blog?category=<c>`, which is a 200 index page whose inline script forwards to the category route; the verifier checks the 200 and, with `--follow-script`, fetches the mapped category route too (implement: parse the slug, map `fbcm-events-1` to `fbcm-events` and `pianist` to `/blog/tag/pianist/`, expect 200). Paste the table in the report. Any FAIL is a finding: fix the data (redirect doc) or the target and say which.

- [ ] **Step 3: Wire and commit.** Add npm script `verify:redirects`. Mention it in `OPERATIONS.md` under the cutover checklist. Commit `Redirect verifier: 44 rules checked against the deployed site`.

---

### Task 6: Lighthouse, measured and recorded (and fixed where it falls short)

**Files:**
- Create: `docs/superpowers/notes/2026-09-20-lighthouse.md`
- Read: `lighthouserc.json`, `docs/agent/performance.md`, `src/components/HeroBackground.astro`, `src/components/SanityImage.astro`, `src/styles/globals.css` font imports

- [ ] **Step 1: Baseline, deployed.** Against `https://fbcm-site.nathanjnixon86.workers.dev`, run Lighthouse for `/`, `/visit/`, `/blog/`, `/staff/`, `/history/`, and one post (`/post/h%C3%A4ndel-s-messiah-sing-in-carols/`), DESKTOP and MOBILE, three runs each, median: `npx lhci collect --url=<u> --settings.preset=desktop --numberOfRuns=3` then read the JSON in `.lighthouseci/` for the four category scores and LCP/CLS/TBT; repeat without the preset for mobile. (If `lhci collect` against a remote URL is awkward, `npx lighthouse <url> --output=json --output-path=... --chrome-flags="--headless=new" --preset=desktop` three times and take the median.) Write the table into the note: page, form factor, performance, accessibility, best practices, SEO, LCP ms, CLS, TBT ms, and the LCP element for `/` (must be the tower frame).

- [ ] **Step 2: Compare with the spec.** Targets: desktop 100/100/100/100 on `/`, `/visit`, `/blog`, the post, `/staff`; mobile performance at least 95; home LCP under 2.0 s at mobile throttle. For each miss, name the audit that costs the points (from the JSON `audits` with `score < 1`, sorted by `details.overallSavingsMs`), ONE fix per cause, and re-measure that page after the fix, before and after in the note. Likely levers if needed: hero frame `sizes`/`widths` and `quality`, `fetchpriority` on frame 1 only, font `display: swap` and preloading the two faces actually used above the fold, `loading="lazy"` on below-fold `SanityImage`s, the blog index's card image sizes, and the 24k px History page (no fix for length; check CLS only). Do not touch brand tokens or the matched dependency set. Stop after the first fix that does not move the number and say so (two-strike rule).

- [ ] **Step 3: Gates and commit.** Any component change: `npm run check && npm run test:unit && npm run build && npm test`; `npm run parity compare` is red anyway (Task 7 recaptures after this). Commit `Lighthouse: numbers recorded; <what was fixed>` (or `Lighthouse: numbers recorded, targets met` if nothing needed fixing).

---

### Task 7: The one deliberate parity recapture

**Files:**
- Modify: `scripts/page-parity.mjs` (PORTABLE, general change), `scripts/.parity/*` (recaptured), `docs/PENDING.md` (upstream finding), `.github/workflows/ci.yml` note if it mentions parity

- [ ] **Step 1: Exclusion option (general).** Add `--exclude a/**,b/**` (comma-separated globs, matched against the page path) and the equivalent `PARITY_EXCLUDE` env var to `page-parity.mjs` for both `capture` and `compare`, with the usage comment updated and the reason written in the header comment: generated archive pages (pagination, tags) add hundreds of near-identical snapshots that hide a real diff in the noise; the templates are still covered by the first page of each. Default: no exclusion (other repos unchanged). Unit-test the matcher if the file has a test; otherwise a `node --test` in `scripts/lib/` for the glob-to-regex helper (three cases).

- [ ] **Step 2: Recapture.** `npm run build` on the final tree (after Task 6's fixes), then `node scripts/page-parity.mjs capture --exclude "blog/page/**,blog/tag/**,blog/category/**/page/**"`. Report the count of baselines (expect the 148 old ones replaced by roughly 160: the eleven pages, privacy, 404, styleguide, blog, the five category indexes, and the 142 posts; if posts push the set over 25 MB, exclude `post/**` too and keep three representative posts by listing them explicitly, with the reason in the report). `node scripts/page-parity.mjs compare --exclude ...` immediately after: 100% PASS. Add the npm scripts `parity:capture` and `parity:compare` with the exclusion baked in so nobody has to remember it, and point `docs/PENDING.md` and `CLAUDE.md`'s parity line at them.

- [ ] **Step 3: Commit.** `git add scripts/page-parity.mjs scripts/.parity package.json docs/PENDING.md CLAUDE.md && git commit -m "Parity: one recapture on the plan 2b tree, generated archive pages excluded"`. Note the PORTS card candidate in `docs/PENDING.md` upstream findings.

---

### Task 8: Two notes for Nathan, the upstream write-up, and the close

**Files:**
- Create: `docs/superpowers/notes/2026-09-20-review-walkthrough.md`, `docs/superpowers/notes/2026-09-20-cutover-plan.md`, `docs/upstream/2026-09-20-starter-findings.md`
- Modify: `docs/PENDING.md`, `CLAUDE.md`, `OPERATIONS.md`

- [ ] **Step 1: Review walkthrough.** For each of the thirteen pages (home, visit, who-we-are, beliefs, ministries, staff, history, wedding, give, contact, blog + one post, privacy, 404): the URL on workers.dev, the two screenshot paths (light and dark 1280), three lines on what to look at (the spec's intent for that page), and the known gaps with their owner (church photo day, Nathan's decision, plan 3). Then a short section "Facts the church must confirm" pointing at the approval note, and "How to change things yourself" pointing at the Studio desk and the help page. Plain sentences, no em-dashes, no marketing words.

- [ ] **Step 2: Cutover plan.** Run `node scripts/cutover.mjs` (dry: prints the plan and stops; it makes no calls) and paste its output into the note under "What the script will do", then add "Before that morning" with the human prerequisites as a checklist: registrar login for fbcmuncie.org and where DNS is hosted today; the current MX/TXT records exported (mail must not break); the Wix site left live until the new domain answers; who cancels Wix and when; the Church Center form 159198 test submission reaching an inbox; `PUBLIC_CF_ANALYTICS_TOKEN` (Cloudflare Web Analytics) created in the dashboard and added as a repo variable before the move (a rebuild does not inherit the old site's tag, CLAUDE.md); Search Console verified for the new host; the third copy of `fbcm-archive/` off-machine. Each line marked `#nathan` or `#church`.

- [ ] **Step 3: Upstream write-up.** `docs/upstream/2026-09-20-starter-findings.md`: one card-shaped section per finding for `ncs-astro-sanity-starter`, each with what it is, the bug that produced it, the canonical file here, and what to adapt: the anchor field + `sectionAnchor()`; `--header-offset`; the page-seeder pattern (`seed-pages.mjs`, `page-copy.mjs`, `page-images.mjs`, approval note); `audit-studio.mjs` shared-const parsing; `playwright.config.ts` 600 s; `page-parity.mjs --exclude`; the full-page-screenshot scroll-reveal gotcha; the CI/Lighthouse workflows needing the public Sanity ids; `CtaLink` weak internal references and relative external URLs; the `hoursSection`/`linkCardsSection` blocks as candidates for the church family; the SVG `--` comment gotcha. Link the two vault gotchas by name.

- [ ] **Step 4: PENDING, CLAUDE, OPERATIONS.** `docs/PENDING.md`: a "Plan 2c landed (2026-09-20)" section replacing the 2b open loops this plan closed (favicon, featured, preview secret, parity, anchor test, redirect check, Lighthouse numbers), leaving the true remaining items (block-tools awaiting approval; Web Analytics token and GA before the move; Search Console; photo day; the church's confirm list; plan 3 cutover). `CLAUDE.md`: the opening paragraph says plan 2c is done and plan 3 is the cutover; the parity line names the new scripts; the icon set line. `OPERATIONS.md`: the cutover checklist references `verify:redirects` and the cutover plan note.

- [ ] **Step 5: Full gate and commit.** `npm run typegen && npm run check && npm run test:unit && npm run test:scripts && npm run format:check && npm run build && npm test && npm run audit:studio && npm run check:links && npm run parity:compare && node scripts/verify-archive.mjs --quick && node scripts/verify-redirects.mjs`. All green, every real line pasted. Commit `Plan 2c: verified, recorded, ready for the cutover conversation`. No push; the controller runs the final whole-branch review, then finishing-a-development-branch.

---

## Definition of done for plan 2c

- [ ] The icon set is the church's tower in every size; no starter "F" disc remains anywhere in `public/`.
- [ ] `journalEntry.featured` is gone from schema and data with a committed backup; `audit:studio` clean.
- [ ] `/preview/**` on production no longer fails closed; the secret is set and CORS confirmed; Nathan's sign-in check is the only remaining preview item.
- [ ] Anchors land below the header, asserted in Playwright on both projects, including reduced motion.
- [ ] 44 redirects verified against the deployed site by a script anyone can re-run.
- [ ] Lighthouse numbers recorded for six pages, desktop and mobile, with any fix measured before and after; accessibility 100 everywhere; desktop 100s on the five spec pages or the shortfall named with its cause.
- [ ] Parity baselines recaptured once on the final tree with the generated archive pages excluded; `npm run parity:compare` green.
- [ ] Review walkthrough, cutover plan and upstream write-up committed; PENDING, CLAUDE and OPERATIONS current.
