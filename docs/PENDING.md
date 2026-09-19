# PENDING.md - open loops in this repo

Created 2026-08-28 (PORTS.md card 15). This is a **registry, not a narrative**: every
entry is a live open loop with its blocker, and it is edited in the same commit as the
thing it tracks. When an item closes, delete it and note the closure in
`docs/agent/changelog.md`, which is the prose ledger.

Read this early in a session. The point is that a new session inherits the queue instead
of rediscovering it.

Related registries: `PORTS.md` (what is shared with the rest of the site family, plus the
applied-to matrix and `npm run sync-check`), `docs/agent/changelog.md` (what happened, in
sequence).

---

## Waiting on a human

### 1. Verify the live preview against a real Sanity project

**Blocker: this template has no Sanity project, by design.**

The 2026-08-28 upgrade installed the whole preview stack, but a template cannot prove the
half that needs credentials. What WAS verified here: the build, the embedded Studio
mounting in a real browser, `/preview/live` returning 403 without the Studio cookie, and
every preview entry point failing closed with a 503 that names the missing configuration.

What is still unproven, and what a fork should check on its first real project:

- `/preview` renders a draft page (a builder page in full fidelity, a bespoke page as its
  editable surface with the note).
- `/api/draft-mode/enable` returns **401** on a bad secret and sets the cookie on a good
  one. (With no project configured it cannot get that far and returns 503 instead.)
- Click-to-edit opens the right field, and no enum-driven block takes the wrong branch
  (that would mean a missing name in `NON_STEGA_FIELDS`).
- The in-canvas section controls appear on hover: insert before/after through the grouped
  menu, duplicate, remove, drag to reorder.
- An edit in another tab reaches the preview through `/preview/live` without a reload.
- **The floating controls from PORTS.md card 28** (added 2026-08-28). These are the least
  provable part of the stack, because every one of them needs a resolver context the host
  only builds against a real schema:
  - clicking a heading on a text block, CTA band, services grid, testimonials or FAQ
    section shows "Accent a word", and clicking a word in the card sets `headingAccent`
    in the draft (the Studio's unpublished-changes badge should move);
  - clicking the same word again clears it;
  - clicking a subhead on any of the six twin-carrying sections shows "Edit here", the box
    is seeded with the plain string, and the B / I buttons store `strong` / `em`;
  - pasting a styled paragraph out of a word processor into that box keeps only bold and
    italic and drops fonts, colours and tables;
  - the card survives the pointer travelling to it (see the own-open-state rule on the
    card) and closes on Escape, on Save, and on a click outside;
  - Ctrl+Z in the Studio undoes what the card wrote (card 27).

Whoever does this first should report back so PORTS.md cards 10 and 28's starter cells
carry a verified-in-anger note rather than an installed-and-gated one.

---

### 1a. Sign in to a Studio built on the phase-1 Sanity set

**Blocker: no agent can do this, and this template has no Sanity project.**

2026-09-06 moved this repo onto the family's phase-1 Sanity set (`sanity` 6.9.1,
`@sanity/ui` 3.5.4, `@sanity/client` 7.26.2, `@sanity/visual-editing` 5.7.3). Every
automated gate is green and the single-instance invariant holds on disk and in the
lockfile, but the login screen is core code and renders fine even when the
styled-components theme context is broken. The set is already human-verified on
presacademy, reid-design-site and mas-monograms, so the risk here is low; what is
unverified is this repo's own custom Studio panes and the in-canvas overlay against it.
Whoever forks this next should sign in, open the desk, and drive the Presentation tool
until an in-canvas control draws and writes back, then note it here.

Do NOT take `sanity` 6.9.2: that PATCH release crosses to `@sanity/ui` 4, which is a real
migration (PORTS.md card 10, phase 2).

### 1b. Run `npm run cutover --write` against a real zone, once

**Blocker: this template owns no domain, and the one real cutover predates the script.**

Added 2026-09-18 with PORTS.md card 48. `scripts/cutover.mjs` generalises the
stonesteps50k.com move from GoDaddy to Cloudflare, which was done by hand that morning:
every API call in the script is one that was made, in that order, and worked. What has
NOT happened is the script itself making them.

What IS proved here: the whole dry-run path against a fake domain, and the zone audit
against `scripts/fixtures/godaddy-zone-export.txt`, which carries every fault the real
export had (25 unit cases in `src/lib/zone-audit.test.ts`).

What the next client's cutover should confirm, in order, and note here:

- The zone create returns nameservers and the script prints them before anything else.
- The import POST accepts the cleaned file, and the resulting record set matches the
  audit's `import + rewrite` count exactly.
- The script refuses to import over a zone that already holds records.
- With the zone still `pending`, step 3 stops and says nothing below was attempted.
- After the nameservers move: both custom domains attach, the redirect rule lands in the
  `http_request_dynamic_redirect` phase, and the four TLS settings read back.
- A second `--write` run is a clean no-op, with a printed reason on every step.
- The verify table: apex 200 with the title, www and http 301, MX still resolving.

Read the plan line by line before passing `--write`. The blast radius is a client's live
domain and their mail.

---

## Known gaps, deliberately open

### 2. `npm run parity compare` is not a CI step

The baselines in `scripts/.parity/` are captured on a developer machine, and nobody in
this family has yet proved a Linux CI build reproduces them byte for byte. Parity is a
local gate today; `.github/workflows/ci.yml` carries the reason inline. To close this:
capture on CI once, diff against the committed baselines, and wire the step in if they
match.

### 3. `@astrojs/mdx` is installed but unused

No `.mdx` file exists in `src/` or `modules/`. It is kept because a project may want MDX
for long-form content, and removing it from a template is harder to undo than leaving it.
Drop it during a slop sweep (card 16) if it is still unused then.

### 4. The adapter and wrangler pins are tighter than the bug requires

`@astrojs/cloudflare` is pinned exact at 14.2.4 and `wrangler` at `~4.110.0`. Verified
2026-08-28 that 14.2.4 does **not** emit `legacy_env` into the generated config, so card
14's original failure does not reproduce here; the pin holds the pair together because
14.2.5 peers `wrangler ^4.125.0`, one minor from the version that rejects the field.
Revisit when a newer adapter's peer range and emitted config are both checked by hand
against a real `wrangler dev` and a real deploy.

### 4a. Thirty npm advisories, accepted rather than fixed

**Checked 2026-09-18. `npm audit` reports 30: 14 high, 14 moderate, 2 low, 0 critical.**

**NEVER RUN `npm audit fix --force` IN THIS REPO.** Its offered fix for the Sanity half of
the list is a DOWNGRADE of `sanity` from 6.9.1 to 5.14.1 and of `@sanity/vision` from 6.9.1
to 5.31.2, each across a major version. That takes the embedded Studio back a major line
with it, and the Studio ships with the site, so the damage lands on editors, not on a
developer's machine. It would also downgrade `@lhci/cli` from 0.15.1 to 0.6.1 and push
`wrangler` to 4.135.0, which breaks the pin CLAUDE.md rule 8 exists to hold. The plain
`npm audit fix`, with no `--force`, is harmless and already has nothing left to do.

**Why they are accepted.** Every one of the 30 is in tooling that runs at build time or in
CI. None of it is in the bundle a visitor downloads, and none of it is in the Studio
runtime either: the `sanity` and `@sanity/vision` entries are flagged through
`@sanity/cli`, the command-line package used for `typegen`, `sanity cors` and dataset work,
not through the Studio code the browser loads. The three roots:

- **The Cloudflare build chain, 5 packages.** `wrangler`, `@cloudflare/vite-plugin`,
  `miniflare`, `sharp`, `undici`. Everything here runs on the machine doing the build.
- **The Sanity CLI chain, 13 packages.** `sanity`, `@sanity/vision`, the four `@sanity/*`
  CLI packages, the two `@module-federation/*` packages, `@vercel/frameworks`, and the
  `js-yaml`, `smol-toml`, `adm-zip` and `typeid-js` underneath them.
- **Lighthouse CI, 12 packages.** `@lhci/cli`, `@lhci/utils`, `lighthouse`,
  `puppeteer-core`, `@puppeteer/browsers`, `extract-zip`, `tmp`, `external-editor`,
  `inquirer`, `qs`, `body-parser`, `uuid`. This one only ever runs in
  `.github/workflows/lighthouse.yml`.

**What would actually change this.** Upstream releases, nothing else. The Sanity set moves
when the family takes PORTS.md card 10 phase 2 (the `@sanity/ui` 4 migration), which is a
deliberate piece of work and not an audit fix. `wrangler` and `sharp` clear when a wrangler
release inside the `~4.110.0` line picks up a patched `sharp` and `undici`, or when rule 8's
pin is revisited on purpose. Lighthouse CI clears when `@lhci/cli` ships a 0.15.x that drops
the old `puppeteer-core` and `tmp`.

**To check whether anything has changed since this was written:** run `npm audit`. If the
summary still reads 30 with the same 14/14/2 split, nothing has moved and this entry stands.
If the numbers differ, find out which root moved before editing anything, and re-read the
`--force` warning above before touching a dependency.

### 5. Seven eslint warnings, all unused bindings

`npm run lint` is a CI step now (2026-09-06) and exits clean, but it still prints seven
`@typescript-eslint/no-unused-vars` warnings: unused imports in `Footer.astro`,
`BusinessOverview.tsx`, the journal index and a couple of others, plus one unused
`SHOW_THRESHOLD` in `BaseLayout.astro`. Warnings do not fail the run. Triage them in a
slop sweep (card 16); each is either a dead import to delete or a binding that was meant
to be used and is not, which is the more interesting kind.

### 7. Two PORTABLE scripts are excluded from prettier

`scripts/sync-check.mjs` and `scripts/page-parity.mjs` are the only marked files whose
quoting `prettier --write` would rewrite, and reid-design-site, mas-monograms and
presacademy carry them byte-exact. Formatting them here would put four repos into DRIFT
the moment anyone runs `npm run sync-check`. They are in `.prettierignore` with that
reason inline. To close: format them in ONE pass that lands in every repo in the family
at the same time.

### 8. The sibling repos will report DRIFT on the new test files

The family test standard's six canonical files were written here on 2026-09-06
(`playwright.config.ts` and five of the six files in `tests/`). The client repos got the
same standard the same day, but their copies were written against their own sites and
carry different comments and, in `a11y-dark.spec.ts`, an inline `FORM_ROUTES` that has
been moved out to `routes.ts` here. So the first `npm run sync-check <repo>` after this
lands will report DRIFT on those files. That is the library of record working as
designed, not a bug: the next sync session pushes this repo's copies out. Do the sync
before treating any drift report from those paths as meaningful.

### 9. `apply-brand` is not idempotent on globals.css

**Cosmetic, found 2026-09-13, deliberately not fixed in the same commit.**

CLAUDE.md and the script's own header call `apply-brand` idempotent, and semantically it
is: running it twice produces the same STYLESHEET. It does not produce the same FILE.
Running it on this repo, whose globals.css already matches its own brand.config.json,
rewrote 75 lines: single quotes to double on the `@import` lines, and lowercase hex to
uppercase (`#434e5c` to `#434E5C`, because the config stores uppercase). Prettier then
disagrees with the result, so `npm run format:check` fails on a file nobody edited.

That is harmless until somebody runs the script on a project with a clean tree, sees a
75-line diff in the most load-bearing file in the repo, and has to read all of it to
confirm it says nothing. To close: normalise hex case and quote style to what Prettier
writes before comparing, or run the file through Prettier at the end of the rewrite.

### 10. The scaffold is finished (DONE, 2026-09-18)

`faq` and `about` are marked, and so are `testimonials` and `philosophy`, which this item
did not ask for and which a race site or a school wants gone just as much. Seven
capabilities are removable now: `about` (31 files), `faq` (34), `journal` (31),
`philosophy` (16), `process` (29), `services` (32), `testimonials` (21). Each was proven
by running its own removal followed by typegen, `astro check`, build and the unit tests,
and all seven together were proven the same way.

This item's open question was whether re-pointing tests at a section every project keeps
counts as editing tests to suit a tool. It does not, and the reason is worth keeping: in
all three files the faq section was the EXAMPLE and something else was the subject, so
pointing the example at a block nobody removes is a correction, not a concession. The
same turned out to be true of `about`: `storySection` and `founderSection` were the
cadence suite's stand-in CONTENT and SELF_CONTAINED types, and a fork dropping about
would have lost coverage of the cadence itself. Where a section really IS the subject it
kept its name and took a marker.

The seed audit landed with it, along with the modules archive, the reserved-slug
cleanup, and the Studio audit ported from the Stone Steps build.

### 11. Three things the scaffold work left open

**Queued, 2026-09-18.** None blocks anything; each is a smaller job than it looks and
each is written down because the reason decays faster than the code.

**`dynamicListSection` cannot lose its last source cleanly.** Its four sources (journal,
services, testimonials, faqs) each belong to a capability, and the block itself belongs
to none. Removing all four now leaves a valid build, because the `source` prop widened to
`string` and the GROQ `select()` gained a `[]` default arm, but it also leaves an
editor-facing block whose dropdown offers nothing and which can only ever render empty.
Either the block should become a capability of its own, or the schema should hide it when
its options list is empty. The second is probably right and is a ten-line change.

**Seed markers cannot express a capability inside another capability's page.** Markers
never nest, so the aboutPage seed is `about` end to end including the `valuesSection` in
its pageBuilder, which is `philosophy`. Remove philosophy while keeping about and the
seeder plants a block of a type the schema no longer declares. It is a dataset problem
rather than a build one and the boundary is defended in the file's header, but a fork
doing exactly that combination will see an unknown-type block in the Studio.

**`lighthouserc.json` still says "the nine module routes under modules/".** There are two
staged modules now and eleven archived ones. The file is owned by another agent's wave
(the family test standard, PORTS.md card 35), so the sentence was left alone rather than
edited across an ownership line. One-line fix, next time someone is in there.

### 6. `docs/agent/` deep-dives still carry client-specific nouns

Flagged in CLAUDE.md's topic index since the fork. The 2026-08-28 pass corrected every
stale `studio/` path and every `studio:deploy` instruction in the live docs, but the
examples inside them were not retoned. Trust the patterns; fix nouns when you touch a
file.

### 12. `package.json` carries an `allowScripts` block, added by the fork

Added 2026-09-18 (Task 1). npm 12's install-scripts allowlist blocks postinstall/install
scripts by default, and three already-pinned packages need theirs to run because each
ships a native binary the build needs: `esbuild` (bundling), `workerd` (the Cloudflare
runtime `wrangler`/`miniflare` shell out to), and `sharp` (Astro's image pipeline).
Without the block, `npm install` leaves a tree that cannot build, on this machine or in
CI. No pinned dependency version was changed to add it; `npm ls esbuild workerd sharp`
and a `package-lock.json` grep both confirm every version named in the block
(`esbuild@0.28.1`/`0.28.2`, `workerd@1.20260826.1`/`1.20260708.1`,
`sharp@0.35.2`/`0.35.4`/`0.34.5`) is one the committed lockfile actually resolves, not a
leftover from an unrelated install. The consequence worth remembering: every future
clone and every CI run now executes those three packages' scripts unattended. Re-check
this list against `npm ls` when the lockfile bumps any of the three.

---

## FBCM: open loops after plan 1 (2026-09-18)

Plan 1 (foundation and content) is complete and deployed at
https://fbcm-site.nathanjnixon86.workers.dev. Plan 2 is pages, sections, the
Studio and the identity pass; plan 3 is the cutover. These are the loops plan 1
leaves open, with what closes each.

### Waiting on Nathan

- ~~`CLOUDFLARE_API_TOKEN` as a GitHub Actions secret.~~ Done 2026-09-18. First CI
  deploy (run 35411176093) succeeded: gate green, 277 files uploaded, version
  `6d670311`, smoke passed against `vars.PRODUCTION_URL`. Deploys now happen on
  every push to `main` and on `sanity-publish` dispatches; `npm run deploy` from
  a laptop is the fallback, not the path.
- ~~A GitHub PAT for the Sanity publish webhook.~~ Done 2026-09-18. Webhook
  `Rebuild live site` on project 7jw947g5 POSTs `{"event_type": "sanity-publish"}`
  to GitHub's dispatches endpoint with a fine-grained PAT (fbcm only, Contents
  write). Proved with two real revisions: runs 35411581409 and 35411598171, both
  `repository_dispatch`, both Deploy and Smoke green, versions `cdaa19bd` and
  `ffb5b6f8`. The second queued behind the first (`cancel-in-progress: false`).
  An editor's publish now reaches the live site in about two minutes with no
  developer involved. When the PAT expires, publishes silently stop rebuilding;
  its expiry date is the thing to write down.
- **A Cloudflare Web Analytics token** for the workers.dev host, pasted into `.env`
  as `PUBLIC_CF_ANALYTICS_TOKEN`. The API connector lacks the RUM scope. Nothing
  breaks without it; the site reports nothing.
- **`SANITY_TOKEN` as a Worker secret** for `/preview/**`. Card 45 records that
  `wrangler secret put` trips an agent permission gate. Preview fails closed with a
  503 naming it, by design.
- ~~The tagline is the studio's wording, not the church's own.~~ Done
  2026-09-19 (Task 9 fix 1). `siteSettings.tagline` now reads "We're a
  Spirit-led people gathered to join Christ's presence in our community.",
  taken from `brand/brand.config.json`. It prints in gold on every page's
  footer and at the top of the phone menu. The church may replace it at any
  time in Site Settings -> Tagline.

### Plan 2 must do

- **Post bodies are paragraphs only.** No Portable Text converter is installed, so
  `bodyFromCapture()` carries all 95,016 words with paragraph breaks and drops
  headings, links, lists, blockquotes and inline images. A unit test pins that so
  it is a failing test to make pass, not a surprise. The captured `bodyHtml` in
  `scripts/data/posts/*.json` is the source when a converter is added.
- **All 42 redirect targets currently 404**: `/staff`, `/visit`, `/beliefs`,
  `/ministries`, `/wedding`, `/give`, `/who-we-are`, `/history` do not exist yet.
  Correct for plan 1. **Plan 3 precondition: no redirect target may 404**, or the
  spec's "every retired URL keeps working" is false on day one.
- `journalPage` singleton is unseeded; `/blog` renders the starter's defaults.
- `seed-core.mjs` still seeds a service-business page set; the FBCM home page and
  the eight custom pages need seeding for this church.
- `src/pages/post/[slug].astro` fallback description reads "A note from the
  studio." Same residue family as the fixed "Studio Journal".
- `scripts/import-people.mjs` `bioOf()` has no unit test; its correctness rests on
  the live re-import spot checks recorded in the plan-1 ledger.
- CLAUDE.md and README.md: only the opening paragraph says what this repo is; the
  body still documents the starter. Rewrite for this site.
- Dead `Service` interface and `serviceListSchema()` in `src/lib/schemas.ts`.
- **The `/styleguide` visual baseline needs a refresh on CI once Task 6 lands.**
  Task 6 (2026-09-19) added the eight church-block fixtures to the page, which
  changes its rendered output; `visual.yml`'s stored baseline for that route is
  now stale and will report a diff on the next run. Do NOT regenerate
  `scripts/.parity` locally for this (that happens once, at the end of plan
  2c, per the task-6 brief). Refresh the CI baseline itself with `visual.yml`'s
  own `update` input the first time it runs against this change.
- **`src/sanity/guides/content.ts` is still the starter's generic "Help & Guide"
  template** ("THIS IS A TEMPLATE. REWRITE IT PER PROJECT" at its own header),
  written for a design studio, not a church. Task 10 (2026-09-19) unhooked it
  from the desk rather than half-rewrite it under a task scoped to
  `structure.ts` and the `studioGuide` seed: the desk's Help group now holds
  only "How the website works" (studioGuide) and "Your church at a glance"
  (studioNotes), both rewritten for a church secretary. If this guide system is
  wanted back, it needs its own pass over `content.ts`'s guide list, in the
  church's own language, before it is wired back into `structure.ts`.
- **Sign-in to the Studio at a local origin needs a one-time CORS grant.**
  Verifying Task 10's desk in a real browser (`npm run preview`, `/studio`)
  reached the Sanity "Connect this Studio to your project" screen every time,
  never a sign-in form: `http://127.0.0.1:<port>` is not on this project's CORS
  allow list, so every `users/me` call fails preflight (console shows only that
  error, nothing from schema or structure, which is what the task needed to
  confirm). Registering `npx sanity cors add http://127.0.0.1:<port> --credentials`
  is the fix, same family as item 1a above; nobody has done it for this project
  yet.

### For ncs-astro-sanity-starter (the library of record), found on this fork

Six findings, each general, each worth a PORTS.md card. Two are already fixed in
PORTABLE files here and marked in their headers for the sync session.

1. **`npm run scaffold` markers are incomplete.** Twelve stale references survived
   six removals, in registries the tool does not know about: `CtaLink.astro`'s URL
   switch, a second preview id-prefix map, the `dynamicListSection` dropdown, a
   console warning, two orphaned components, `BusinessOverview.tsx`, the Studio
   guide's `studioMap`, OG-page and llms generators, `seed-core.mjs` howTo rows,
   and `deploy.yml` plus `lighthouserc.json`, where four dead routes would have
   failed the production deploy's own smoke step on the first run.
2. **Fork residue card 44 did not catch:** `public/og/*.png` (23 share cards with
   "Reid Design LLC" as image text, served per route by `BaseLayout`), and
   `public/llms.txt` / `llms-full.txt` ("Studio Starter", example.com links, an
   interior-design price list), which exist to be read by machines.
3. **`apply-brand` rewrites `astro.config.mjs` `site:` to the bare apex** on every
   run, dropping `www.`. Silent until search traffic moves.
4. **`astro.config.mjs` read Sanity env from `process.env` only.** Astro never
   copies `.env` onto `process.env` at config time, so a local build with a correct
   `.env` emitted ZERO Sanity-driven redirects while the dataset held 42. CI was
   unaffected (variables become real env), which is why nobody saw it. Fixed here
   with a `loadEnv` fallback.
5. **`src/lib/redirects.ts` (PORTABLE) normalised the destination and stripped
   `?query` and `#fragment`.** 25 of 42 targets shipped wrong. Fixed here,
   generally, header note dated 2026-09-18.
6. **`scripts/audit-studio.mjs` (PORTABLE) check 7** fired on any dollar amount in
   prose, an unclearable finding for a church blog mentioning a $15 ticket.
   Generalised here to fire only when a structured price field is populated.

Also worth a note on card 8/`sanityFetch`: a GROQ parse error in one section's
projection (`[0...limit]`, a field reference as a slice bound) failed the ENTIRE
home page query and fell back to defaults on a green build. `DYNAMIC_LIST_MAX`
now ties the schema max and the slice with a drift test.

---

## Plan 2a landed (2026-09-19)

Identity tokens, eight church blocks, hero frames, the church header/footer, and
the secretary's Studio desk are done and gated (Task 11). What is deliberately
still open, all closing in plan 2b/2c:

- `npm run parity compare` is intentionally all-red: the header and footer
  changed on every page, so every baseline in `scripts/.parity/` differs. Do
  not recapture now; plan 2c recaptures once, after the eleven pages land.
- `visual.yml`'s CI-stored `/styleguide` baseline is stale after Task 6's eight
  block fixtures; refresh it on CI with the workflow's own `update` input the
  next time it runs, not by regenerating `scripts/.parity` locally.
- `npm run check:links` is red on the seven plan-2 routes (`/visit`,
  `/who-we-are`, `/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding`),
  all 404 until plan 2b builds them. No other broken link exists.
- `public/favicon.svg` is still the starter's roundel, not the church's mark;
  closes in plan 2c.
- The `@portabletext/block-tools` dependency plan 2b needs for a real Portable
  Text converter is not installed yet; it is a new dependency and needs
  Nathan's approval first (CLAUDE.md: pause for confirmation before installing
  new dependencies).
- The Studio's insert-menu and desk are unverified against the deployed
  origin's CORS-gated Sanity project (same family as item 1a above). That
  check is Nathan's after this branch merges: he signs in at the deployed URL,
  since the localhost Studio cannot reach the project without a CORS grant.
- Parked from the final plan-2a review, for plan 2b's first task: `CtaLink`'s
  `primary` variant is still the starter's bronze, and `FinalCta` composes it on
  every page; repoint the primary family to the gold pair (indigo-field text on
  gold, 4.90:1, already gated) so the whole site has one button family.
- Parked minors from the same review: the hero pause pill's a11y trio (visible
  label on the icon state, `aria-controls`, focus return), `MobileNav` still
  serialises `siteSettings.email` it no longer shows, and `DocumentList` sorts
  with `localeCompare` on titles that carry stega markers in the preview (use
  `splitStega()` first). Each is under ten lines.
- The Pages desk list orders `page` documents by nav position with a GROQ
  `select()` that has had no live `page` documents to run against; spot-check it
  in the Studio once plan 2b seeds them.
- CI's `test` job has been red on `main` since plan 1 (runs 8da1578, 111373d,
  124cd10, e43839a), always on one smoke test: `a post with a non-ASCII slug is
served at its original URL` gets 404 on the Linux runner's static server while
  the same suite passes locally on Windows (66/66) and production serves
  `/post/h%C3%A4ndel-s-messiah-sing-in-carols` with 200 (after a 307 to the
  trailing slash). So the URL-preservation goal is met on the deployed Worker and
  the red is the CI server's handling of a percent-encoded path. Plan 2b's first
  task decides the fix (serve from `wrangler dev` in CI, or decode the path in
  the test's server) and does not change the slug.
