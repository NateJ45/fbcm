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

### 1c. The preview routes check the draft cookie's presence, not its fingerprint (found 2026-09-26)

Found while adding the post preview (`/preview/post/<slug>`). `src/pages/preview/[...slug].astro`,
`src/pages/preview/post/[slug].astro` and `src/pages/preview/live.ts` all switch on draft mode
with `Astro.cookies.has(perspectiveCookieName)`. `/api/draft-mode/enable` sets that cookie to an
unforgeable fingerprint of `SANITY_TOKEN` (`src/lib/preview-auth.ts`), and `isStudioPreview()`
there checks it, but nothing calls `isStudioPreview()`. So a request that sets
`sanity-preview-perspective` to any value reads unpublished drafts through the server's token.
docs/agent/preview.md claims the fingerprint protects the preview; today it does not.

The fix is small (`draftMode = await isStudioPreview(Astro.cookies.get(perspectiveCookieName)?.value)`
in the three places) but it touches the working preview path, so it wants one careful change to
all three routes together, then a real Studio session to prove the Presentation tool still gets
drafts (nothing in `@sanity/visual-editing` should rewrite the cookie, but that is the thing to
confirm). The post route matched the existing routes rather than differing from them alone. The
same code came from the starter, so check it there too.

### 2. `npm run parity compare` is not a CI step

The baselines in `scripts/.parity/` are captured on a developer machine, and nobody in
this family has yet proved a Linux CI build reproduces them byte for byte. Parity is a
local gate today; `.github/workflows/ci.yml` carries the reason inline. To close this:
capture on CI once, diff against the committed baselines, and wire the step in if they
match.

**Recaptured 2026-09-20** (plan 2c task 7), once the eleven pages and Task 6's
Lighthouse fixes had landed. `npm run parity:capture` / `npm run parity:compare` (both
`scripts/page-parity.mjs capture|compare --exclude "blog/page/**,blog/tag/**,blog/category/**/page/**"`)
now hold 162 baselines in `scripts/.parity/` (12 MB), one per template plus every
distinct post and category page, with the generated pagination archive (`blog/page/N`,
`blog/tag/*`, `blog/category/*/page/N`) excluded so a real diff cannot hide in hundreds
of copies of the same DIFF line. `npm run parity compare` (or `npm run parity:compare`)
is 162/162 PASS as of this recapture; it is **no longer intentionally red**. The
`--exclude` flag and its `PARITY_EXCLUDE` env twin are general additions to
`scripts/page-parity.mjs` (a PORTABLE file), documented in its header comment, with the
glob matcher split into `scripts/lib/parity-glob.mjs` and unit-tested. **Upstream
finding for PORTS.md:** the exclusion mechanism is a candidate port for any family
member whose content grows a paginated archive (presacademy's events, for one) --
capturing hundreds of near-identical archive pages was already a problem here at 142
posts and five categories, and it only gets worse with more content.

**Fixed 2026-09-20, plan 2c fix wave.** The baseline had fed Tailwind, so one recapture
invalidated itself: `npm run parity:compare` on the task-8 tree reported **1/162 PASS**,
and the only diff on every failing page was the inlined stylesheet's own byte count and
hash. The cause was a loop: `scripts/.parity/*.html` is COMMITTED, so it is not
gitignored, so Tailwind v4's automatic source detection scanned those 162 files and
generated utilities for every class it found in them, feeding the NEXT build's
stylesheet. Two stale utility classes existed in the pre-plan-2a baselines, existed in no
file under `src/` at all, and generated about 100 bytes of dead CSS rules. Task 8 closed
the loop on itself by naming those two classes in this very entry, since Tailwind scans
Markdown too, and the compare went green for the wrong reason: a real measurement (the
rules really were back in `dist/client/404.html`) that proved nothing about the render.

The fix: `@source not "../../scripts/.parity";` right after the Tailwind import in
`src/styles/globals.css`, excluding the baselines from Tailwind's source scan. Verified
with a fixpoint measurement (largest inline `<style>` block on `/`): a build made right
after adding the exclusion (baselines on disk still the pre-fix set, and this entry
still naming the two classes) measured **125,406 bytes**; `npm run parity:capture` was
then run to recapture 162 baselines under the exclusion, and a second build measured the
identical **125,406 bytes**. Because a capture made under the exclusion cannot feed
classes back into the scan via `scripts/.parity`, that identical number is the proof
that specific loop is cut. `npm run parity:compare` was **162/162 PASS** on that
recaptured set.

That measurement still included the ~100 bytes from this entry's own prose, since
`@source not` only excludes `scripts/.parity` and Tailwind still scans Markdown
everywhere else. Removing the two class names from this entry and from the upstream
card (below) dropped the sheet from 125,406 to **125,305 bytes** on the next build, and
broke `npm run parity:compare` down to 1/162 PASS against the baselines captured a
moment earlier, which still carried the old, larger stylesheet. A second recapture
under the doc-fixed tree, followed by a rebuild, reached the true fixpoint: **125,305
bytes** on two consecutive builds and `npm run parity:compare` **162/162 PASS**. The
lesson the first pass missed: cutting the `scripts/.parity` leak does not by itself make
a docs edit render-neutral when the docs edit is itself a Tailwind source; anywhere the
class names are typed in prose has to be fixed and captured together, not treated as a
free rewording after the "real" fix.

**C4b, same session: the real scope was every tracked Markdown file, not just two class
names in two files.** `scripts/.parity` and this entry's own prose were never the whole
leak. `CLAUDE.md`, `PORTS.md`, `OPERATIONS.md`, `README.md` and everything under `docs/`
are all tracked, non-gitignored, and full of utility-class names used as documentation
examples (heading grammar, band colours, accent classes), because that is what a
technical doc about a Tailwind codebase looks like. Every one of those names is a
Tailwind source. Added two more exclusions next to the existing one in
`src/styles/globals.css`: `@source not "../../docs";` for the whole docs tree, and
`@source not "../../*.md";` for the four root Markdown files (`CLAUDE.md`, `PORTS.md`,
`OPERATIONS.md`, `README.md`). Tailwind v4.3 (`tailwindcss` 4.3.3 here) accepts a glob in
`@source not`: the build succeeded and the byte count moved, which is the proof it took
effect, not just parsed. `.superpowers/` was deliberately left out of the exclusion list:
it is already fully gitignored (its only contents live under `.superpowers/sdd/`, which
carries its own `*` `.gitignore`), so Tailwind's default gitignore-based skipping already
covers it and a redundant `@source not` would just be dead weight.

Measured the same way: a build right after adding the two new exclusions (still against
the doc-fixed 125,305-byte baseline set) dropped the sheet to **119,411 bytes**, a real
5,894-byte cut, confirmed by diffing the raw CSS before and after and finding whole rule
sets gone that exist nowhere under `src/`. `npm run parity:capture` recaptured all 162
baselines under the new exclusions, and a second build measured the identical **119,411
bytes**. `npm run parity:compare` is **162/162 PASS** on that set. Three fixpoints now,
each one narrower than the last: `scripts/.parity` alone (125,406B), plus the two named
classes out of prose (125,305B), plus the rest of the repo's own Markdown (119,411B).
The pattern is the same each time: Tailwind's default scan is the whole non-gitignored
tree, so anything checked in that names a utility class is a source, whether it is a
rendered-HTML baseline, a paragraph explaining a fix, or a doc file's normal job of
describing the design system in its own vocabulary.

This is general, not FBCM's: every repo in the family commits `scripts/.parity`, ships a
`CLAUDE.md` and `docs/` full of the same kind of class-naming prose, and
`page-parity.mjs` is the library of record. Written up as card 6a in
`docs/upstream/2026-09-20-starter-findings.md`.

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

### 5. One eslint warning, in a PORTABLE file

`npm run lint` is a CI step now (2026-09-06) and exits clean. Warnings do not fail
the run. The count grew from seven to eighteen in the art-direction pass
(2026-09-21) and came down from eighteen to **one** in the 2026-09-22 cleanup
(`chore/cleanup`). All seventeen fixed were dead: retired icon imports, an unused
`headingAccentField` import and a never-called `proseBody` helper in
`richSections.ts`, `useEffect` in `BeforeAfterSlider.tsx`, the unread catch binding
in `CopyEmailButton.tsx` (now `catch {}`), `SHOW_THRESHOLD` in `BaseLayout.astro`
(the header's show/hide runs on a +/-4px scroll delta and `HIDE_AFTER`; the 80px
constant has been unread since the fork), and unused locals in `capture-blog.mjs`,
`capture-pages.mjs`, `generate-logo-variants.mjs` and `pages/ministries.mjs` (an
unused `pick` helper). None was a binding that was meant to be used and is not.

The one left is `statSync`, imported and never used at line 93 of
`scripts/scaffold.mjs`. That file is PORTABLE (the starter owns it), so the fix belongs in
`ncs-astro-sanity-starter` first and comes here through `npm run sync-check`, not
as a local edit.

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
  breaks without it; the site reports nothing. **Deadline: before the domain
  moves.** A rebuild does not inherit the old site's tag, and the loss is
  invisible for weeks. The same applies to `PUBLIC_GA_ID` if the church had
  Google Analytics on the Wix site. Setting the analytics token also flips the
  privacy page's "this site runs no analytics" paragraph to the cookieless
  counting sentence, so it is better set before the church reads that page.
- ~~**`SANITY_TOKEN` as a Worker secret** for `/preview/**`.~~ Done 2026-09-20 (plan
  2c task 3, by the controller): `wrangler secret put SANITY_TOKEN` against the
  Worker `fbcm-site`, token piped from `.env` and never printed, and
  `wrangler secret list` shows it. The deployed origin was already on the Sanity
  CORS list. `/preview/visit` answers 200 instead of the 503 fail-closed, and the
  cookie gate was checked rather than assumed: without the perspective cookie
  `getPreviewClient(false)` uses perspective `published` with stega off
  (`src/lib/cms-preview.ts:162-164`, read at `src/pages/preview/[...slug].astro:55`),
  so an anonymous 200 carries published content only. **What is left is Nathan's
  sign-in check** of the deployed Studio and its Preview tool, which needs a human
  with a Sanity login and cannot be done from a branch.
- ~~The tagline is the studio's wording, not the church's own.~~ Done
  2026-09-19 (Task 9 fix 1). `siteSettings.tagline` now reads "We're a
  Spirit-led people gathered to join Christ's presence in our community.",
  taken from `brand/brand.config.json`. It prints in gold on every page's
  footer and at the top of the phone menu. The church may replace it at any
  time in Site Settings -> Tagline.

- [ ] **The official App Store and Google Play badges** (2026-09-25, `feat/church-app`). The
      church app's store buttons (`src/components/church/AppButtons.astro`, on Home and in the
      footer) are plain text plates naming the store, because the agent did not download the
      official artwork. To use the real badges: download Apple's "Download on the App Store" SVG
      from https://developer.apple.com/app-store/marketing/guidelines/ (Apple's badge tool) and
      Google's "Get it on Google Play" badge from https://play.google.com/intl/en_us/badges/, add
      them under `src/assets/`, and draw them unmodified at each company's minimum size and clear
      space, with Apple's and Google's trademark lines on the page.

### Plan 2 must do

- ~~**Post bodies are paragraphs only.**~~ Closed 2026-09-20 (task 16). See
  the "Post bodies" note below.
- ~~Some redirect targets still 404.~~ Closed in plan 2b: all eleven pages
  exist and `npm run check:links` is green. **Plan 3 precondition still
  stands: no redirect target may 404**, and plan 2c proves it against the
  deployed site rather than against `dist/`.
- ~~A fragment landing arrives under the sticky header.~~ Closed in the plan 2b
  final fix wave (2026-09-20). One token, `--header-offset` in `globals.css`,
  re-measured in Chromium against the production build (186px at 1280, 93px at 375) and consumed by `scroll-mt-[var(--header-offset)]` on both the
  `SectionRenderer` band wrapper and the `StaffGrid` card.
- ~~`journalPage` singleton is unseeded.~~ Closed in plan 2b task 15.
- ~~`seed-core.mjs` still seeds a service-business page set; the eight custom
  pages need seeding.~~ Closed in plan 2b: thirteen page modules under
  `scripts/pages/`, run by `npm run seed-pages`.
- ~~`src/pages/post/[slug].astro` fallback description reads "A note from the
  studio."~~ Closed in the plan 2b final fix wave: the label is gone, and the
  fallback is the site description.
- `scripts/import-people.mjs` `bioOf()` has no unit test; its correctness rests on
  the live re-import spot checks recorded in the plan-1 ledger.
- CLAUDE.md and README.md: only the opening paragraph says what this repo is; the
  body still documents the starter. Rewrite for this site.
- Dead `Service` interface and `serviceListSchema()` in `src/lib/schemas.ts`.
- ~~**The `/styleguide` visual baseline needs a refresh on CI once Task 6 lands.**~~
  Closed: refreshed on CI by `39ffca0` (2026-09-20) and again, after the
  art-direction pass, by `bda0dcb` (2026-09-22).
  Task 6 (2026-09-19) added the eight church-block fixtures to the page, which
  changes its rendered output; `visual.yml`'s stored baseline for that route is
  now stale and will report a diff on the next run. Do NOT regenerate
  `scripts/.parity` locally for this (that happens once, at the end of plan
  2c, per the task-6 brief). Refresh the CI baseline itself with `visual.yml`'s
  own `update` input the first time it runs against this change.
- ~~**`src/sanity/guides/content.ts` is still the starter's generic "Help & Guide"
  template**~~ Closed 2026-09-22 (feat/editor-guide): rewritten as ten guides
  for the church secretary in five categories and wired back into the desk's
  Help group under the two existing panels. Every click path was walked in the
  real Studio. The walk turned up the items in "Editor guide: what the Studio
  cannot do yet" below.
- **Sign-in to the Studio at a local origin needs a one-time CORS grant.**
  Verifying Task 10's desk in a real browser (`npm run preview`, `/studio`)
  reached the Sanity "Connect this Studio to your project" screen every time,
  never a sign-in form: `http://127.0.0.1:<port>` is not on this project's CORS
  allow list, so every `users/me` call fails preflight (console shows only that
  error, nothing from schema or structure, which is what the task needed to
  confirm). Registering `npx sanity cors add http://127.0.0.1:<port> --credentials`
  is the fix, same family as item 1a above; nobody has done it for this project
  yet.

### Editor guide: what the Studio cannot do yet (found 2026-09-22)

Found while writing and walking the Help guides (feat/editor-guide). Each one
is described to the secretary honestly in the guides today; fixing it means
changing the guide that mentions it in the same commit.

- **The service time is copied into about fifteen bands.** CODE DONE
  2026-09-22 (feat/settings-placeholders); ONE DATA STEP LEFT. Site settings
  placeholders (`{service time}`, `{time}`, `{service length}`, `{address}`,
  `{short address}`, `{city}`, `{phone}`, `{email}`) are filled at the two
  fetch chokepoints (`sanityFetch`, `previewFetch`) from
  `src/lib/settings-placeholders.ts`, and `seed-pages` converts typed copies
  before it writes, so a re-seed cannot bring them back. Proven render-neutral
  with no placeholders in the data (parity 162/162), and proven end to end by
  a local build that simulated the migrated data (the only rendered change is
  "10:45 AM"/"10:45 a.m." printing as "10:45 am"; the fellowship-hour range
  and "Mark 10:45" untouched). **DONE 2026-09-23:** merged and deployed at
  `fda1214`, then `--write` patched 31 documents in one transaction
  (`Yg84KDHscU4NDc84ofNZaO`), backup committed at
  `scripts/data/backups/settings-placeholders-2026-09-23.json`. The steps, kept
  for reference: merge and deploy the branch, THEN from the main checkout run
  `node scripts/settings-placeholders.mjs` (dry; expect 46 changes in 14
  documents plus 17 staff members), then `--write` (backup-first, one
  transaction, revision-guarded). Writing before the deploy would show a
  literal `{time}` on the live site. Afterwards `--check` is the audit (exit 1
  if a typed copy is back). Left typed on purpose: the two `mailto:` link
  targets (the URL field rejects braces; the visible text becomes `{email}`),
  Sunday school at 9:30 am and the 10:15-10:45 fellowship hour (not settings),
  and every blog post (dated writing).
- **The `ministry` documents are not read by any page.** CODE DONE
  2026-09-22 (feat/ministry-bands); ONE DATA STEP LEFT. The ministry document
  is now each ministry's one home (small line, headline, photo with alt text,
  text, "People to talk to"), and a new "Ministry" band (`ministrySection`,
  church blocks) only points at one. `src/lib/ministry-band.ts` turns the band
  into the exact image band or text band it draws as BEFORE the cadence and
  the spare-image pool see it, and generates each contact line at build time
  from the people the document names (hidden staff are not listed).
  `scripts/pages/ministries.mjs` now seeds the five pointers and refuses while
  a ministry is unconnected. Proven render-neutral on the current data, and
  proven end to end by a local build that applied the migration's own plan in
  memory: /ministries byte-identical. **DONE 2026-09-23:** merged and deployed
  at `fda1214`, then `--write` patched 6 documents in one transaction
  (`PwVRqMM9lzIWA1u8PaHz0V`), backup committed at
  `scripts/data/backups/connect-ministries-2026-09-23.json`. The steps, kept
  for reference: merge and deploy, THEN from the main checkout run `node scripts/connect-ministries.mjs`
  (dry; expect 5 ministries and 5 bands), then `--write` (backup-first, one
  transaction, revision-guarded). Writing before the deploy would drop all
  five bands from the live page. The run REMOVES the five old Wix photos from
  the ministry documents (three replaced by the band photos, adult and
  outreach unset because their bands have none); the dry run lists them and
  the backup keeps them. The `ministries` guide (src/sanity/guides/content.ts)
  still tells the secretary to edit the page's typed contact lines and must
  be rewritten when the data step lands. `audit:studio` check 5 cannot see
  the new "Used on" entry (`ministry` -> /preview/ministries in resolve.ts)
  because its `RENDERED_BY` map lives in the PORTABLE copy; add
  `ministry: ['ministrySection']` upstream (starter findings).
- ~~**No deacons.**~~ Corrected 2026-09-22: the deacons ARE on the site, as
  the "Our deacons" band (`st-deacons`, an imageTextSection) on the Staff page:
  a group photo and a typed name list with the deacon chair's email. The first
  pass of the guides missed it; the `staff` guide now says where they live.
  A structured deacons list is still possible later, if the church wants one.
- ~~**A new post's Author defaults to "Your Name"**~~ Fixed 2026-09-22
  (feat/settings-placeholders): no initial value; blank means no byline. All
  142 existing posts already carry a real author.
- **"Publish automatically at" is switched on, waiting on one secret.**
  2026-09-22 (feat/settings-placeholders): `publish-due.yml` runs every half
  hour and falls back to the existing `PUBLIC_SANITY_PROJECT_ID` variable. It
  skips with a warning until the `SANITY_AUTH_TOKEN` repo secret (an Editor
  token) exists. When it does, replace the `who-to-ask` guide's "leave it
  empty for now" callout with a short how-to.
- ~~**The workspace is still titled "My Studio"**~~ Fixed 2026-09-22
  (feat/studio-readability): now "First Baptist Studio", which is also what
  every image menu calls the Studio's own photo source.
- ~~**The Presentation page list shows the Blog page as "Journal"**~~ Fixed
  2026-09-22: the label is "Blog" (a fixed label in `PreviewNavigator.tsx`).
  Custom pages still list by their own titles ("Plan a visit"), which is
  right; the guides say so where it matters.
- **Media library asset names are full local file paths**
  (`C:\Users\natha\Documents\Claude\Proje...`), from the import scripts'
  upload filenames. Half fixed 2026-09-23 (feat/photo-library-upload): every
  PHOTOGRAPH now has a readable name. About 130 graphics from the post import
  (sermon art, announcement cards) still show the path. Renaming them is one
  small patch pass over assets with no `source` marker, if it is worth doing.
- **Staff photos and Ministry photos have no alt-text field.** StaffGrid
  passes no alt, so the image renders `alt=""` beside the printed name, which
  is acceptable; the guide says so.
- ~~**There is no Unpublish for staff members**~~ Fixed 2026-09-22: a "Show on
  the Staff page" switch (`showOnSite`, unset means shown) filters the one
  staff query (`queries.ts` staffGridSection), which the preview shares; the
  Studio list tags hidden people "(hidden)". The migration above stores `true`
  on the 17 existing people so the switch does not draw as grey "not set".
- ~~**GuideView's "Take me there" links produce `#//structure/...`**~~ Fixed
  2026-09-22 (trailing slash stripped from basePath before joining). GuideView
  carries no PORTABLE marker, but the same line is in the starter's copy: note
  it on PORTS.md card 41 at the next sync.
- **Held guide: how a band's picture decides its shape.** The Ledger reached
  `main` on 2026-09-22 (via `integrate/2026-09-23`), so this is unblocked. Draft, for `content.ts`
  (category "Pictures"), to check against the merged code before adding:
  > **How a picture decides the shape of its band.** You never choose a
  > band's layout; the picture does. A tall portrait becomes a pointed-arch
  > **window**, like a church window, but only the first tall portrait on a
  > page gets one; any later tall portrait is hung as a **framed portrait**.
  > A very wide picture whose text has a "left to right" line followed by a
  > short list of names becomes a **legend**, the picture with the names laid
  > out under it. A picture whose alt text or small line above the heading
  > mentions a year before 1950 is treated as an old photograph and set as a
  > **plate**. A large, wide landscape can become a full-width **backdrop**
  > behind the band, at most twice on a page and never straight after an
  > opening photo. Everything else sits beside its text. Because the page is
  > worked out from the top down, changing one band's picture, or moving a
  > band, can change the shape of another band further down: if a new tall
  > portrait appears higher up, it takes the window and the old window becomes
  > a framed portrait. Look at the whole page in Presentation before you
  > publish.

### Found while connecting the ministries (2026-09-22)

- ~~**Four pages could not be published.**~~ Fixed 2026-09-22
  (feat/ministry-bands): the page-section link field validated with
  `R.uri({ allowRelative: true })`, which allows only http/https, so every
  seeded `mailto:` contact line (Contact, Ministries, Staff, Wedding: eight
  links) was a validation error, and Sanity will not publish a document with
  one. `sections.ts` and `richSections.ts` now allow mailto and tel, as
  `ctaBlock` already did. No data or render change.
- **Removing the `church` scaffold capability is broken, and was before this
  work.** `npm run scaffold -- --remove church --write` on the parent commit
  c6bcd4e leaves 9 type errors and 1 failing unit test (identical counts on
  feat/ministry-bands): `structure.ts` and `blog-derive.ts` import
  `church-derive`, which the removal deletes, and SectionRenderer props go
  `unknown`. Rule 14 says a capability must be removable; this one is not.
- **`audit:studio` check 5 cannot see the ministry "Used on" entry**: its
  `RENDERED_BY` map in the PORTABLE `scripts/audit-studio.mjs` needs
  `ministry: ['ministrySection']`. Upstream first (starter), then sync.
- ~~**The committed parity baselines are stale for the blog.**~~ Closed
  2026-09-22: recaptured once on the integrated tree (`integrate/2026-09-23`),
  162/162 on a second build with the inline stylesheet at 133,382 B on both.
  Original note: something outside
  these sessions updated 14 `journalEntry` documents at 2026-09-23T00:07:15Z
  and uploaded 68 file assets (PDFs) around 00:09. (Explained 2026-09-23: the
  14 posts are the journal session's own approved write,
  `scripts/fix-journal-gaps.mjs`, 13 categorised plus one excerpt; and no
  file asset has been CREATED since the plan 2b import on 2026-09-20, so the
  "68 uploads" were existing assets, not new ones. Read-only GROQ checks.) Against the committed
  baselines the build scores 120/162, all 42 diffs blog/post pages; against a
  fresh capture of the parent on the same data, 162/162. Recapture once that
  work lands, and prove the fixpoint.
- **(DONE 2026-09-23, in this order, after `fda1214` deployed; see the two
  entries above.) Run order for the two data migrations**, both from the main checkout after
  the stacked branches are merged AND deployed: `settings-placeholders.mjs`
  (dry, then `--write`), then `connect-ministries.mjs` (dry, then `--write`).
  The ministries migration drops the old Wix photos from all five Ministry
  documents (Adult and Outreach to none, the others to the photo their band
  shows today); the backup keeps them and the assets stay in the library.
  Writing it before the deploy would empty five bands on the live page.

### Studio audit: seen, not changed (2026-09-26)

The Studio audit rewrote every editor-facing string it owns and hid the dead
controls (changelog, 2026-09-26). These it left, each for a stated reason:

- **Strings in PORTABLE files** keep the starter's wording until a sync:
  `_seoFields.ts` ("SEO title", "Alt text"; FBCM's page types pass their own
  titles in, so editors mostly see the new ones), `slugRedirect.tsx` (the toast
  says "under Redirects"; the desk calls them "Old web addresses"),
  `UndoRedo.tsx` ("a colour you picked", which FBCM has no control for), and
  `page-checks.ts`' `sectionLabel()`, which names sections from their type
  ("Heritage band") in "Save a section as preset..." and "Check this page...".
  FBCM's own list and navigator now use the schema titles
  (`src/sanity/sectionTitles.ts`); the starter could adopt the same.
- **The "How the website works" document is data, not code.** Its seven
  how-tos and tips were seeded 2026-09-19 and say "Preview tool" and "Click
  New"; the audit wrote nothing to the dataset. Edit them in the Studio (Help,
  How the website works, Edit tab), or retire the panel now the Help guides
  cover the same ground.
- **"Church notes" (studioNotes) still holds the seed's "Replace this with..."
  text.** Only the church can write it.
- **The Blog page previews a closing band the live /blog does not draw.**
  `src/pages/preview/[...slug].astro` renders `finalCta*` for every singleton;
  the live page dropped it. The fields are hidden in the Studio now, so the
  preview shows a band nobody can edit. A preview-stack change (read
  `docs/agent/preview.md` first).
- **Unused post blocks.** No post uses "Before and after photos",
  "Recommended book or resource", "Tip box", "Pull quote", "Photo gallery",
  "Divider", "Video" or the "Where this came from" mark (checked live: only
  paragraphs and photos). They were retitled for a church; removing them from
  the insert menu is a schema change for another day.
- **"Something from another website" (embedSection) pastes raw code onto the
  page.** Its description now tells staff to ask first; restricting it the way
  the Church Trac form band is restricted is a design decision.
- **`_pageSingleton.ts` is dead code**: nothing calls `definePageSingleton`.

### For ncs-astro-sanity-starter (the library of record), found on this fork

- **Lenis is not worth shipping; and naming `<main>` makes view transitions slide (2026-09-24, `feat/print-motion`).** The starter ships Lenis in `BaseLayout`: FBCM measured 5.4 KB gzip per page, a rAF loop that never stops, a 1.5 to 2 s late start, and a dead wheel whenever something stops it across a router swap; it removed the package and uses the router's own scroll reset plus `html[data-smooth-scroll] { scroll-behavior: smooth }` set on the first press (plain `html { scroll-behavior: smooth }` makes Chrome glide its reload restoration and broke the header seed). Separately, the starter's `globals.css` names `main#main` (`main-content`) and `footer` (`site-footer`) as view-transition elements, and a named group animates from its old box to its new one, so a navigation from a scrolled page slides the whole page down the screen through the fade; FBCM names only the header and cross-fades the root. Both want a PORTS.md card and a sweep of every family repo. Also worth porting: the generic print block's reveal reset (an unscrolled `[data-reveal]` prints blank) and the `--k` screen-scale fix for any `pathLength` draw on a `non-scaling-stroke` path (`animation.md`, "The glyph draw").
- **Post bodies and the Toaster hydrate for nothing (2026-09-24).** The starter's `BaseLayout` mounts `<Toaster client:idle />` for a `CopyEmailButton` a site may never render (10 KB on every page), and `JournalPortableText` hydrates a whole post body to serve a slider most posts lack, pulling `@sanity/client` in through `urlFor`. FBCM's fix is `src/components/JournalBody.astro` (render at build time, hydrate only the slider) and removing the mount; details on PORTS.md card 52.
- **Build reads must use the Sanity CDN even with a token (2026-09-23).** `src/lib/sanity.ts` had `useCdn: !readToken`, so any build with `SANITY_API_READ_TOKEN` in `.env` read the uncached API. On FBCM a day of local and agent builds spent 325k API requests against the 250k monthly quota while CI (no token) stayed on the CDN. Fixed here (`useCdn: true`; the CDN accepts tokens since API 2021-03-25), and `sanityFetch` now throws in a production build instead of silently returning fallback content, so a quota block or outage fails the deploy rather than shipping an empty site. Port both to the starter and every family repo.

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

7. **`playwright.config.ts` (PORTABLE) gives `webServer` 180 seconds**, and that
   is the build, not the serve. This site now builds 377 pages in about three
   minutes, so `npm test` times out before a single spec runs: locally you get
   around it by building first and letting `reuseExistingServer` find the static
   server on 4321, but CI sets `reuseExistingServer: false` and has no way
   around it. It is general (any site the family grows past ~250 pages hits it)
   and the fix is one number, but it puts every repo in the family into drift
   until a sync session, so it wants a PORTS.md card rather than a quiet edit
   here. **Fixed in this repo (2026-09-20): `webServer.timeout` raised to
   `600_000`. Still needs a PORTS.md card when the sync session pushes the
   change out to the rest of the family, since the canonical copy elsewhere
   is still 180 seconds.**

Also worth a note on card 8/`sanityFetch`: a GROQ parse error in one section's
projection (`[0...limit]`, a field reference as a slice bound) failed the ENTIRE
home page query and fell back to defaults on a green build. `DYNAMIC_LIST_MAX`
now ties the schema max and the slice with a drift test.

### Who We Are "alive": before the page is applied (2026-09-23)

- **The Welcome Booklet is uploaded on `--apply`, not before.** The "Find Out More"
  card on the composed Who We Are page (`scripts/pages/who-we-are.mjs`) links the
  Sanity file asset that `../fbcm-archive/files/08181c_75a0565927c14a929d1ebee1565e638c.pdf`
  becomes, `file-3a0aedfcc69aaee01054ce3ec21fc2ac048292ec-pdf`. A Sanity asset id is
  the SHA-1 of the file's bytes, so the CDN URL is known before the upload. The dry
  run prints the upload as a planned step; `--apply` performs it through
  `makeUploader().uploadFile()` (as `beliefs.mjs` and `wedding.mjs` do) and throws if
  Sanity returns any other id. Until the apply, that CDN URL answers 404, including on
  `/styleguide/who-we-are`. The module throws if any `fbcmuncie.org/_files` link
  reaches the page, so the Wix copy (which dies at cutover) can never be seeded.
- **The page is composed but not applied.** Deploy the branch (the schema carries the
  new church sections), then `npm run seed-pages -- --only who-we-are` (read the plan)
  and `npm run seed-pages -- --only who-we-are --apply` (backup first). Let the
  publish webhook rebuild, then shoot `/who-we-are` in production at 1440 and 375,
  light and dark, beside the prototype. Until this runs, `/who-we-are` still shows the
  old composition and parity reports it unchanged.
- **New copy awaiting the church's approval.** Every sentence the composition adds or
  re-cases is listed in `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`
  (the Who We Are entries, 2026-09-23). The seed writes them; the church has not yet
  seen them.
- **The Worship goal needs a front-on congregation photograph.** Its lead (the NAVE
  composition's full-bleed photo) is `wwa-worship-nave`, the sanctuary seen from the
  balcony, so the congregation is seen from behind. A shot from the front of the
  sanctuary, faces toward the camera, is the one to ask the church for; swap it in
  `scripts/data/page-images.json` or in the Studio.
- **The window hero shows no gold accent word.** The window layout can render the
  hero's `scriptAccent` word in brand gold, but `heroSection` has no `scriptAccent` field
  (only `richTextSection` and its siblings do) and `SectionRenderer` does not pass one
  through to `Hero.astro` either way, so the headline (the Site settings tagline) is
  one colour regardless of what a page module sets. Showing the gold word needs a
  small follow-up: add `scriptAccent` to the `heroSection` schema and thread it
  through `SectionRenderer`'s hero branch, not a Studio edit.
- **Goal anchor ids are deduplicated within the goals block only.** `GoalsBand`
  derives each goal's id from `slugify(name)` and adds a suffix on a clash inside the
  block, but nothing checks the rest of the page, so a section anchor or another goals
  block with the same slug (`worship`, `the-way`, `witness`, `work`) would give the
  page two elements with one id. Harmless on the composed page today (its section
  anchors are `watchword`, `goals`, `pledge`, `letter`, `next`).
- **The "Meet Our Staff" door shows one pastor.** Its photo is `wwa-next-kendall`, a
  single person, for a card about the whole staff. A group photograph of the staff
  would say what the card says.
- **Done (2026-09-24): the `/who-we-are` preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

### Wedding identity: before the page is applied (2026-09-24)

- **The page is composed but not applied.** `scripts/pages/wedding.mjs` needs no new
  schema field (only the gallery caption's title and help text changed), but the new
  looks only render after the branch is deployed. Then `npm run seed-pages -- --only
wedding` (the plan on 2026-09-24: `pageBuilder` 11 -> 12; the live page matched the
  old module exactly, "unchanged", so no editor edits to carry) and `--apply` (backup
  first). Shoot /wedding, /beliefs, /history and /blog in production.
- **A nested worktree's asset map needs the wedding assets.** The dry run refuses (by
  name) any `file` photo or PDF not in `scripts/.asset-map.json`; the ids are on the live
  page (`*[_type=="page" && slug.current=="wedding"][0].pageBuilder`).
- **New copy for the church.** One alt text built from Ella Mae's staff document; the six
  gallery captions are gone, replaced by the church's own room names. Listed under
  `/wedding` in the approval note.
- **Owner questions.** The sanctuary room is a library photo on no other page
  (08181c_633ffb6, the centre aisle), since hero-sanctuary is on Home, Beliefs and the
  blog; the Visit branch may have picked it the same night, so check at the merge. The
  couple at the red doors in the hero's side light is a 435x640 original (library tag
  "Needs a better copy"); it is sharp enough at the side light's size. The Ella Mae band
  is ImageText as it stands on main: its look follows the Visit branch's ImageText.
- **Done (2026-09-24): the /wedding preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

### Home identity: before the page is applied (2026-09-23)

- **The page is composed but not applied.** `scripts/pages/home.mjs` writes six bands
  (hero unchanged, What to Expect, Our Goals, Our Building, Church Blog, Give) that use
  fields the deployed schema does not have yet (the hymn board's `intro`, `notes`,
  `photos` and `cta`; the link card `glyph`; the heritage band's `dates` and
  `archive`). Deploy the branch first (CLAUDE.md rule 1), then
  `npm run seed-pages -- --only home` (the plan: `pageBuilder` length 7 -> 6, the hero
  unchanged) and `npm run seed-pages -- --only home --apply` (backup first). The
  dry run on 2026-09-23 compared the live `homePage` with the old module offline and
  found no editor edits to carry over; re-read the plan at the pre-apply dry run in
  case one has been made since. Then shoot `/`, `/visit`, `/contact`, `/history` and
  `/give` in production, light and dark, at 1440 and 375, and check click-to-edit on
  the home page in the Studio.
- **New and edited copy awaiting the church's approval.** The home entries in
  `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` (under `/home`,
  regenerated by the dry run): one new sentence (the hero kicker, unchanged since plan
  2b) and fourteen edits to the church's own words (joins, cuts and re-casings, each
  named), including the 1890 date cut to its move clause ("The congregation eventually
  moved into a new building on July 20, 1890.") because the sentence's opening refers
  to overcrowding that is not on the home page. The same note lists the home photos
  of children, now including the teenagers at a table in What to Expect.
- **The goal links land on their anchors only after Who We Are is applied.** Home's
  four goal doors link to `/who-we-are#worship`, `#the-way`, `#witness` and `#work`;
  until `who-we-are.mjs` is applied they land on the top of the old page.
- **Decided: the greeter photo is not on the home page.** The greeter at the sanctuary
  door (08181c_5d24ca) is The Way's first step on Who We Are, so (Nathan, 2026-09-23)
  What to Expect's wide arch carries the teenagers laughing round a table with a Bible
  and a card game (b98776_a92b8eb7) instead. Runner-up: the children with palm branches
  in the leaded-window hallway (08181c_ca2a2650), seasonal and a second photo of little
  girls beside the lancet's. Either is a one-line change in `scripts/data/page-images.json`.
- **Owner questions for the home review.**
  - Most blog covers are title cards (940x726 PNGs with lettering). In the 88px
    lancet they read as cropped lettering, not pictures; only the Messiah post has a
    photograph. Editor hotspots would help, or the owner may prefer the glyph arch for
    text-card covers, which would need a rule that cannot be derived reliably.
  - The taupe blog band, the gold give band and the cream Our Building band stay light
    in dark mode (the drawing's multiply blend needs a light ground; gold and taupe are
    fixed grounds). In dark mode the home page ends on three light bands in a row
    before the indigo footer.
- **Visit identity (2026-09-24, `feat/visit-identity`): apply after the deploy.**
  `node scripts/seed-pages.mjs --only visit` plans a full `pageBuilder` replace (7
  bands); read it, then `--apply` once the schema with `heroSection.headingAccent`,
  `imageTextSection.detail` and `timelineRow.image` is deployed (rule 1). The live
  page was checked against main's module output before the recompose: no editor edits,
  only settings placeholders. Then delete `src/pages/styleguide/visit.astro`, its
  `tests/routes.ts` line and `scripts/data/fixtures/visit.json`, and recapture parity.
- **Visit owner questions.** (1) The teens at the card table in the prototype
  (`08181c_42c2e16b`) is the same photograph as Home's `b98776_a92b8eb7` (a twin the
  photo library does not mark), so the hero's third light is the young guitarist
  (`visit-hero-guitar`). (2) **Visit's Worship step and Home's Worship goal share a
  photo** (`08181c_30a02cce`, the congregation facing the band): the controller's
  ruling (2026-09-24, fix round 1) accepts that cross-page share, the photo Nathan said
  to keep, over a same-page twin with the hero's Christmas congregation, until the photo
  morning. (3) The Sunday School step photo is 491px tall at source and the Fellowship
  and classroom-floor photos are marked soft: top of the photo-morning list.
- **Rule 20 after the Visit fix round (2026-09-24).** This branch's component CSS left
  globals.css (component style blocks, `src/styles/ledger.css`,
  `src/styles/photo-shapes.css`), which took post, 404 and privacy pages down to
  131,426 / 121,371 B. The page-builder pages still inline one 143,964 B bundle,
  because SectionRenderer statically imports every section, so every section's CSS
  ships on every page-builder page; /blog inlines that bundle plus its own 5.4 KB
  (149,334 B in one `<style>`, two files each under the per-file limit). Under 140 KB
  for those pages needs the section CSS split by page (not possible with static
  imports) or a trim of shared CSS; a dead-class scan of globals.css found 12 unused
  selectors, too few to matter.
- **Headings gate known finding (not Visit's):** DocumentList's register year heading
  "Undated" (h3, `font-display text-h3` in a `md:col-span-2` column) breaks mid-word at
  768 and 1024 on /blog and /styleguide. `tests/headings.spec.ts` lists it in `KNOWN`;
  take it off the list when the owner applies `headingFit` (heading-grammar.ts) to it.
- **`src/components/blog/Opener.astro` fails `npm run format:check` on main** (one
  `<h1>` line over the print width). Formatting only; the journal branch's file.
- **Photo library: mark `08181c_42c2e16b` and `b98776_a92b8eb7` as twins** in
  `scripts/data/photo-library.json`, so the next reuse check sees them.
- **`weekOfLabel()` still reads the UTC day.** The sermon-preview "week of" label
  (`blog-derive.ts`, shared by the blog index and the home blog rows) is the one date
  left on UTC; every other date is on the church's day (`localDay()`,
  America/Indiana/Indianapolis). A preview published after 8pm Eastern names the next
  day, and on a home row its label can disagree with the row's `<time datetime>`. Move
  it to `localDay()` with a late-evening test; it changes blog index renders, so
  recapture parity.
- **Owner questions from the final review:** the handbell photo is on Home (Work goal)
  and on Ministries (a separate upload of the same photograph, so the spare-pool dedup
  cannot see it); the two-girls lancet photo in What to Expect is low resolution.
- **Owner question (2026-09-24): sermon-preview cadence.** The home hero's "This Sunday"
  line names the sermon only when a sermon preview exists for that Sunday (otherwise it
  stays the date and service time). Previews ran 38 / 46 / 33 a year in 2023 to 2025,
  but there has been one in 2026 (January 6). Ask whether the pastors will post them
  again; each one would now show on the home page automatically.
- **Done (2026-09-24): the `/` preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

### Utility identity: before the pages are applied (2026-09-24)

- **Deploy first, then apply** (CLAUDE.md rule 1: `notFoundPage` gained the optional
  `fourthCtaLabel` / `fourthCtaHref`). Then `npm run seed-pages -- --only give,contact,not-found`,
  read the plans, and `--apply` (backup first). The dry runs on 2026-09-24: give "would
  be replaced" (pageBuilder [1] and [2], the two eyebrows off); contact "would be
  replaced" (hero, hours, pastors and Notify Us reordered and renamed); the live
  documents matched the old modules exactly, so no editor edits to carry over.
  `privacy` is unchanged (its page code changed, not its content). Re-read each plan
  in case an editor has changed a page since.
- **The 404 page is drawn from live data until then**: before `--apply` it shows the
  old slots (Plan a visit, Read the blog, Contact us) plus the code's fourth door
  (Give), and the singleton still holds the tower photo, which the page no longer
  draws; `--apply` replaces the document and clears it.
- **Contact's new hero photo is `contact-exterior`** (the church at dusk from the
  street, library file `08181c_4d5376a9...`), unused elsewhere; the manifest's
  `contact-building` entry (an alias of the home hero's `hero-building`) is now used by
  no module and can go once nothing else wants it.
- **Owner question: the contact hero's h1 is now the church's own "Contact"** (the Wix
  page title) rather than plan 2b's "Get in touch.", following the rollout's rule that
  headings go back to the church's. Easy to put back in `contact.mjs`.
- **Owner question: /give opens on indigo, not gold.** Home's give band stays gold; on
  /give the opener is indigo because the closing CtaBand is gold since the Visit pass.
  The alternative was to drop /give's closing band.
- **For the RichText ground picker (`src/lib/rich-ground.ts`, the Beliefs branch's):** it
  reads every `giveBandSection` as gold by type, but the band is indigo when it OPENS a
  page with no hero (/give). Harmless on /give today (the band after the opener is the
  paper turn, and "What your gift supports" lands on indigo between paper and the gold
  closing band), but a muted text band placed straight under the /give opener would pick
  indigo beside indigo. The fix is one line in `familyOf` (index 0, no hero -> indigo),
  left to the file's owner.
- **Done (2026-09-24): the `/give` and `/contact` preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

### Ministries identity: before the page is applied (2026-09-24)

- **The order is: deploy, then goals, then the page.** The ministry document gains an
  optional `goal` ("Goal it serves"). Deploy the code first (CLAUDE.md rule 1), then
  `node scripts/set-ministry-goals.mjs` (dry; the plan on 2026-09-24: three patches,
  Worship -> worship, Youth and Adult -> the-way, each quoting the church's own line)
  and `--write` (backup first). Then `npm run seed-pages -- --only ministries` (the
  plan on 2026-09-24: "would be replaced", `pageBuilder` [0] hero and [1] timeline only;
  every other band matched the old module, so no editor edits to carry over) and
  `--apply`. The goal index on /ministries appears with the first goal written and is
  absent before it, so neither step can leave the page broken.
- **Owner/church question: which goal do Children and Outreach serve?** Their own pages
  point at more than one (the quotes are in `scripts/data/ministry-goals.json`):
  Children at Worship (an intergenerational church) or across all four habits;
  Outreach at Witness ("Local Partnership") or Work ("Serve", "Support"). Until
  someone answers, they are listed under no goal, and Witness and Work stand in the
  index with no ministry under them. An editor answers it in the Studio
  (Ministries > the ministry > "Goal it serves"); nothing else changes.
- **Photos shared with other pages, not changed here.** Four of the five ministry
  documents' photos also appear on Home or Who We Are (the handbells as Home's Work
  door; the youth, the women's luncheon and the mission team among Who We Are's goal
  photos). The ministry documents had them first (`scripts/place-ministry-photos.mjs`,
  2026-09-22), and they are data, not this page's composition, so this pass leaves
  them; if the rollout's no-reuse rule is to hold on /ministries too, the fix is new
  photos on the ministry documents or on those two pages.
- **The goal index adds ~1.4 KB of scoped CSS to every page that renders sections**
  (Astro bundles a component's styles wherever SectionRenderer is imported): measured
  against main at 3334ee3, section pages 143,812 -> 145,475 B inline, /blog 148,902 ->
  150,565 B, posts 131,263 -> 131,521 B. Every page still inlines (rule 20), but /blog's
  inline sheet is over the 147,456 B figure the plan quotes; worth a look when the
  wave's sheets are measured together.
- **Done (2026-09-24): the `/ministries` preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

### Staff identity: before the page is applied (2026-09-24)

- **The page is composed but not applied.** `scripts/pages/staff.mjs` uses fields the
  deployed schema does not have yet (`staffGridSection.intro`, `scriptureBandSection.heading`
  and `.intro`). Deploy first (CLAUDE.md rule 1), then
  `npm run seed-pages -- --only staff` (the plan on 2026-09-24: `pageBuilder` length
  10 -> 8, "would be replaced"; the live page matched the old module exactly, so no
  editor edits to carry over; re-read the plan in case one has been made since) and
  `--apply` (backup first). Then shoot /staff, /ministries and /beliefs in production.
- [x] **Decided 2026-09-25 (Nathan): the pastors' letter comes off /staff.** It stays
      whole on `/who-we-are#letter`. `scripts/pages/staff.mjs` no longer builds the "A Note
      From Our Pastors" band (branch `worktree-agent-a432365ea207c703b`); the live page keeps
      it until `npm run seed-pages -- --only staff --apply` (dry plan: `pageBuilder` length
      8 -> 7). Nothing on the site linked to `/staff#letter`.
- **Waits on deploy + apply (2026-09-25): Contact's pastor band shows both co-pastors.**
  `scripts/pages/contact.mjs` now sets Jonathan Balmer's staff portrait as the band's
  `detail`, and ImageText draws two people portraits as an equal pair of lancets
  (`besideForm` in `src/lib/photo-shape.ts`). Deploy first (the pair is code), then
  `npm run seed-pages -- --only contact --apply`. Until then /contact shows Kendall alone.
- **The Staff hero's headshots are tight crops with no headroom.** Since 2026-09-25 a
  close people portrait in a lancet whose hotspot is above the arch's springing is drawn
  lower, fading into the arch (`archPlacement` in `src/lib/hero-frames.ts`), so the
  pointed head no longer cuts off hair and forehead; the photos' own top edge now shows
  as a soft line under the point. A pair of portraits with room above the head would
  still read better (see the next item).
- **The hero's two headshots are older photos** (Kendall and Jonathan outdoors by a
  brick wall, the Wix blog's author photos). They are the only unused photographs of
  the two Co-Pastors; the staff-document portraits are drawn in the Pastors band
  directly below. Swap the `staff-hero-*` entries in `scripts/data/page-images.json`
  if the church has a newer pair, or a photo of the two together.
- **The Deacons band heading is still ImageText's reading-face heading**, not the band
  grammar; ImageText belongs to the Visit branch tonight, which restyles it.
- **Owner question:** the scripture band now picks out "same" three times in
  1 Corinthians 12:4-6 (the Spirit, the Lord, God). Nathan may prefer another word or
  none (`accentWord` in `staff.mjs`).
- **Done (2026-09-24): the `/staff` preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

### Light-only, Watch live and the designer credit (2026-09-24, `feat/light-only`)

- **Regenerate the styleguide visual baseline after this merges.** The header (no
  theme toggle, no Watch live on the styleguide's fixture settings) and the footer rail
  (the designer credit) changed on `/styleguide`, so `styleguide-light.png` is stale and
  the first push-triggered Visual regression run will fail. The baselines are Linux
  pixels and can only be made in CI: run the `visual.yml` workflow by hand
  (workflow_dispatch, update mode), the same way `bda0dcb` regenerated them on
  2026-09-22. `styleguide-dark.png` is deleted, not stale.
- **The "Live now" window is a fixed 75 minutes** from the Site settings service time,
  on Sundays, in America/Indiana/Indianapolis (`src/lib/live-service.ts`). If the church
  streams a second service, or the stream runs long, the window is one constant.
- **`surfaces.test.ts` still measures the dormant dark palette.** Left on purpose (it is
  a pure token test and keeps the palette honest for the day dark mode returns); drop its
  dark half if it ever blocks a light-only change.

### Hero people: before the home page is re-applied (2026-09-24, `feat/hero-people`)

- **Apply after deploy:** `node scripts/seed-pages.mjs --only home --apply`. The dry
  run (2026-09-24) changes `pageBuilder[0]` (the hero's five frames) and
  `pageBuilder[1]` (What to Expect's wide arch) and nothing else. It uploads ONE photo
  first: `hero-worship` (`08181c_360b7e15..._tilde_mv2.jpg` resized to 2400 wide, cached
  as `scripts/.page-images/hero-worship.jpg`), because the library's copy of the
  worship-team photo is only 1600x1067, too small for a desktop hero. The other four
  frames and the dinner photo are library assets (2400 wide) and upload nothing.
- **Re-seed Ministries too** (`--only ministries`): `ministries-youth`'s alt was a
  mislabel ("speaking to the youth group"; the teens are singing) and only a re-seed
  carries the fixed alt into the live band.
- **The phone crop of frames 1, 3 and 5.** On a 390x844 phone the photograph is drawn at
  full height (cover scales by height there), so a hotspot can only move it sideways;
  the face lands wherever it sits in the picture vertically. Frames 2 (teens) and 4
  (children on the steps) show faces above the words; frame 1 (the singer, y 0.40) and
  frame 3 (communion) put the faces level with the headline, and frame 5 (the balcony)
  has no readable face on a phone at all. Screenshots in the branch report. If that is
  not good enough, the options are a phone-only frame order or a portrait crop of frame
  1, both owner calls.
- **Phone bytes went up on purpose.** The frames' `sizes` now say the width cover
  actually draws (`src/lib/hero-frames.ts heroSizes`), so a DPR 3 phone fetches the 2400
  variant (98 KB for the tower frame) instead of the 1200 one (32 KB) it was stretching
  3.2x. Across the five frames Lighthouse mobile saw 269 KB of hero images become
  881 KB, with LCP unchanged (the LCP element is the dated line's text, 5.6 to 5.8 s
  simulated either way). Desktop bytes are unchanged. If phone data matters more than
  sharpness, cap the portrait branch at 1600 with resolution media queries.
- **The approval-note generator drops the footer and header sections** when run as
  `--only home`: they come from hidden modules that join the note only when named. This
  branch put them back by hand. Next time run the dry run with those modules named too,
  or make the note include hidden modules.
- **Photo-morning shot list** (the hero research, 2026-09-24), for the day the church
  photographs a Sunday. Landscape, 24 MP or more, no flash, faces in the right 40% and the
  upper half of the frame (the words sit bottom left), signed releases for identifiable
  children:
  - greeters at the red doors (the handshake on the right, shot from inside);
  - the congregation singing, faces not backs (from the side aisle, long lens);
  - the preacher from behind the front pews, plus the reverse angle of the listeners;
  - children's time on the steps, wide, the adult on the right;
  - coffee and donuts, mixed ages laughing;
  - the worship team or choir during the service, with the room;
  - families arriving on the Adams Street steps, people and building together (the one
    shot that could replace the tower);
  - hands: passing the peace, communion trays, a child's hand in an adult's;
  - a community event in Muncie.

### History identity: before the page is applied (2026-09-24)

- **The page is composed but not applied.** No schema field is new (the `archive`
  field's description changed only), but the opener is new code: deploy first, then
  `npm run seed-pages -- --only history` (the plan on 2026-09-24: 19 sections still,
  "would be replaced" on `pageBuilder` [0] opener, [1] timeline, [2], [13] and [15] era
  photo alts, [17] books band, [18] closing band; the live page matched the old module exactly, so no
  editor edits to carry over; re-read the plan in case one has been made since) and
  `--apply` (backup first). Then shoot /history light and dark at 1440 and 375, and
  check click-to-edit on the opener once.
- **Owner question: the Hannaford rendering.** The rollout table names it for /history,
  but Home's Our Building band already shows it and the overnight plan allows a photo on
  one page only, so the opener carries the Wix history page's own header photograph (the
  women's group with a banner) in a door and Pastor Cassius M. Carter in a lancet. To use
  the rendering here instead, point the opener's `image` at a `library` entry for
  `08181c_9a2e10a5752e4aea861c7b31482850a2_tilde_mv2.jpg` in `history.mjs`.
- **Photo facts to confirm with the church:** era 6's photograph (the 1950s band) is a
  stone house in the snow, most likely the Baptist House the 1950s paragraph mentions;
  its alt says only what is visible until the church confirms. Era 7's portrait is
  named as George Saunders (as the Ledger branch identified it).
- **The Timeline, ImageText, CtaBand and the RichText bands are other branches'
  tonight.** The page composes with them as they stood at 74abd96; once the Visit and
  Beliefs branches land, re-shoot /styleguide/history (the closing band should turn
  gold, which sits well after the indigo books band).
- **Done (2026-09-24): the `/history` preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

---

### Mobile speed pass (2026-09-24, `perf/speed-audit`)

Home is fixed (mobile perf 1.00, LCP 1.73 s, 5 of 5 runs). The numbers and causes are in
`docs/agent/performance.md`, "The 2026-09-24 speed pass". Left open, each needing a call:

- [ ] #nathan **Re-measure production after the deploy.** Every number from this pass is a local
      build behind `scripts/serve-dist.mjs`. Production measured 2.34 s on the baseline, better
      than local's 3.80 s, so expect Home at or under the local 1.73 s.
- [ ] #nathan **Hydrate the islands after `load`?** `/visit` (3.15 s) and post pages (3.38 s)
      are image-LCP pages, and the photo competes with the island JS: blocking all JS gives
      2.57 s and 2.38 s. A custom client directive that waits for `load` would get most of that,
      and the cost is a menu button that does nothing until the page has loaded.
- **Done (2026-09-24, `perf/post-body`): post bodies render statically.** `JournalBody.astro`
  runs `JournalPortableText` at build time; only a before/after slider would hydrate (no post
  has one). Post-page JS 147.6 KB to 97.1 KB transferred, LCP 3.31 s to 2.93 s on the Messiah
  post. Numbers in `docs/agent/performance.md`.
- **Done (2026-09-24, `perf/post-body`): `<Toaster />` is no longer mounted.** No page rendered
  `CopyEmailButton`, the only `toast()` caller; the package and primitive stay. Put the mount
  back with the button.
- [ ] #nathan **Cap the hero's phone frame?** Frame 1 is the 2400 px variant on a phone (169 KB),
      by design since `heroSizes`; the largest request before first paint.
- **Superseded by this pass:** "Mobile LCP on `/` is 3239 ms" (Ledger branch, below) and the
  art-direction pass's "A production Lighthouse re-measure is owed" (the re-measure is the first
  item above).

### This Sunday's sermon and a real "Live now" (2026-09-24, `feat/sunday`)

- **Done (2026-09-25): the Worker secret `YOUTUBE_API_KEY` is set on `fbcm-site`.** The key came
  from Jonathan (the church's Google account); Nathan put it on the Worker. Setup steps and the
  quota arithmetic (worst case 280 units per Cloudflare location per Sunday, of 10,000 a day) stay
  in `docs/agent/deployment.md`, "Live now: the YouTube check". Until the cutover only the isolate
  cache applies: the edge cache works only on a real zone, not on `workers.dev`.
- [ ] #nathan **Check the live check on Sunday 2026-09-27, between 9:30 am and 1:00 pm.**
      `https://fbcm-site.nathanjnixon86.workers.dev/api/live-status` must say `live` or
      `not-live` with no `reason`, never `unknown`. `unknown` with `no-key` means the secret is
      not reaching the Worker; `youtube-403-...` means the key's API restriction or the API itself
      is not enabled. Also confirm the channel id Jonathan sent is `UCTm6q6Q7OJ6VrURz3YXVP6A`
      (the id in `KNOWN_CHANNELS`, below); a different id means a different channel, to be added.
- **The channel id is resolved once, in code.** `KNOWN_CHANNELS` in `src/lib/live-status.ts` maps
  `FbcmuncieOrg` to `UCTm6q6Q7OJ6VrURz3YXVP6A` (checked 2026-09-24). If the church changes channel,
  the endpoint answers `unknown` (`no-channel`) until the new id is added there or Site settings
  carries a `youtube.com/channel/UC...` URL. It never checks the old channel on the new one's behalf.
- **The sermon line shows only when the church posts a preview for the coming Sunday.** The newest
  preview in the dataset is January 6 2026, so today the line reads as before. Nothing to do; it
  lights up the week a preview is published (and the site rebuilds, which a publish does).
- **`npm run scaffold -- --remove journal --write` leaves 4 type errors, none from this branch.**
  Checked while proving this branch's markers (the sermon files go, `index.astro` keeps a null
  `sermon`): `DynamicList.astro` still names `durableFirst` (from `blog-derive.ts`) and
  `convert-body.ts` imports `schemaTypes/journalEntry.ts`, both unmarked. Mark them (rule 14)
  the next time the journal capability is touched.
- **The Studio preview of the home page does not show the sermon.** Only the live route passes it
  to `SectionRenderer`; the preview route's hero reads as it did before. Worth wiring only if an
  editor asks.

### The footer's sign-off in the poster (2026-09-24, `feat/footer-signoff`)

- [ ] #nathan **Look at the new footer and merge.** The watchword and the bottom line sit beside
      the Sunday poster from 1024 px up and follow Give on a phone; the sign-off band is gone.
      Screenshots before and after at 1440, 1024 and 390 were taken on the branch. Nothing in
      Sanity changes, so a merge and a push is the whole deploy.
- **The poster's eyebrow wraps "10:45 AM" onto a line of its own at 390 px** ("THIS SUNDAY,
  SEPTEMBER 27 · WORSHIP AT / 10:45 AM"). It did before this branch too. A shorter phone form of
  the dated line (the hero's, `live-sunday.ts`) would fix it everywhere at once; not done here
  because the hero shares the string.

### What's On: the Church Trac calendar at /events (2026-09-25, `claude/kind-heisenberg-jf34rt`)

- [x] **Local review, 2026-09-25 (main session, branch `review/cloud-whats-on`).** Every real
      build got **403** from Church Trac for the calendar feed and the newsletter pages, so
      /events and Home's What's On band built empty. Cause, measured with curl: Church Trac
      refuses a request with NO User-Agent (the build's workerd prerender sends none) and one
      with `Accept-Language: *` (Node fetch's default); either alone is refused. Fixed in both
      fetchers (commit `b2ee5189`), with a stand-in-server test for each. After the fix: /events
      has 4 dated events and 3 weekly ones, both newsletters build, no fetch failures in the log,
      parity 176/176 on two builds, 1278 unit and 513 Playwright tests pass.
- [x] **Not a bug: the "darker October" on /events** was the site's fixed paper-grain layer
      (`body:before`, `position: fixed`), which a full-page screenshot paints over the first
      viewport only. A visitor scrolling sees it everywhere.
- [x] **Fixed: a newsletter section with no title card left its left column empty** at 1280
      (/youth-news, "6th-12th Grade"). Its own heading now sits in that column (`.nl-side` in
      `Newsletter.astro`); the words keep their one left edge, and phones are unchanged.
- [x] **Decided 2026-09-25 (Nathan):** the Messiah Sing-In may show both on Home's blog rows and
      in What's On; funerals on the public Church Trac calendar show on /events (the code has
      no filter, and none is on the calendar today).
- [ ] #nathan **The Kid's Corner still shows summer content** from Church Trac ("Summer Day
      Camps", "Register for Water Wars" on July 11). The church edits that page in Church Trac.
- [ ] **Church Trac's own calendar embed shows "No events to display"** on this site (the
      /styleguide form-band sample). Use /events for the calendar, not the embed.
- [ ] **The footer's "Elsewhere" column still says "Church Center: calendar and giving".**
      Change it in Site settings when Church Center goes.

- [ ] #nathan **Fix the time zone in Church Trac.** Every event in the feed says
      `TZID=America/Halifax` (Atlantic time) while its times are Muncie's (Sunday School 9:30,
      Worship 10:45). The site ignores the zone and reads the times as Muncie's clock, so
      /events is right either way. But anyone who subscribes to the Church Trac feed on a
      phone, or adds an event from Church Trac's own page, gets every event an hour early
      (Halifax is one hour ahead). Change the account's time zone to Eastern (Indiana) in
      Church Trac's settings. Nothing on the site needs changing afterwards.
- [ ] #nathan **Merge, then add "What's On" to the navigation.** The header, footer and menu
      are Site settings (Navigation) in the Studio: add a link to `/events`. The page exists on
      the first deploy after the merge either way, and `/events` is now a reserved slug.
- [ ] #nathan **Put the calendar in Site settings > Church systems > Events calendar**
      (`https://www.churchtrac.com/public_calendar?ui=0C7B1090`, or
      `https://fbcmuncie.churchtrac.com/upcoming_events`). Either works: the page reads the
      calendar code from the box and falls back to the church's own (`FBCM_CALENDAR_CODE` in
      `src/lib/church-calendar-feed.ts`) while the box holds Church Center, nothing, or a Church
      Trac page with no code. Some other calendar in the box turns the list off.
- [ ] #nathan **Ask the church about pastoral events on the public calendar.** On 2026-09-25 the
      published feed carried a funeral and a visitation, with the name. They are past, so the
      page does not show them, but the next one will appear on /events and in Google's event
      listings while it is upcoming. The "Published" switch on each Church Trac event decides.
- **Descriptions are cut at the source.** Church Trac stops each description at about 250
  characters, mid-word. The page trims a cut one back to its last whole sentence (or its last
  word and an ellipsis): Worship's and the Messiah Sing-In's read shorter than the church wrote
  them. The full text is only in Church Trac.
- **Home's What's On band (`src/components/home/WhatsOnBand.astro`)** shows the next three
  dated events after The Visitor, in the insert slot, on the opposite ground to the band above
  (The Visitor's rule). It repeats what the Church Blog rows below may carry for the same event
  (today the Messiah Sing-In is both an FBCM Events post and a calendar event). If that reads as
  a duplicate, the blog rows could drop an events post whose date is on the calendar.
- **Playwright in the Claude cloud container** cannot check Home's band order or The Visitor's
  covers: there is no Sanity project there (no blog rows, no /visit) and `cdn.sanity.io` is
  refused. The calendar's own suite passes there; the full suite is CI's.
- **Node's fetch in the Claude cloud container is refused `www.churchtrac.com`** even when curl
  is allowed through, so a build there draws the "could not be read" state. The deploy runner
  and a laptop reach it. Use `CHURCH_CALENDAR_FIXTURE=1` to see the page there.

### The ministry newsletters from Church Trac (2026-09-25, `claude/kind-heisenberg-jf34rt`)

- [ ] #nathan **Tell the Youth Ministry about the template text in their banner.** The Moose's
      Message's published banner in Church Trac still carries Church Trac's own "Add a Headline
      and Paragraph for this section, or click "Use a Template"..." under "Jesus is the Answer".
      The site leaves it out (`isTemplateText` in `src/lib/church-trac-page.ts`), but Church
      Trac's page and the church app show it.
- [ ] #nathan **Put the two newsletters in the menu.** The old site had "Children's Newsletter"
      and "Youth Newsletter" in a header dropdown. The menu is Site settings > Navigation in the
      Studio: link `/kids-corner` and `/youth-news` there. The footer's first column and the
      Children and Youth bands on Ministries link them already (code, no Studio edit).
- [ ] #nathan **Fill Site settings > Church systems > Church app** if it is empty, so the
      newsletters' closing band shows "Get the church app".
- [ ] #nathan **Approve the new sentences** (the approval note, "What's On, Church Trac forms and
      the ministry newsletters").
- **How it works and what can break.** Church Trac has no feed for these pages, so
  `src/lib/church-trac-page.ts` reads their HTML (a small tokenizer, no new dependency),
  keeps the banner's published sections and the body's `.page-card-section`s, and draws
  headings, paragraphs (bold, italic, links), title cards, buttons and two-column schedules.
  If Church Trac changes its page code, the read returns nothing and the page falls back to
  "Read it on Church Trac", with `[church-trac-page]` in the deploy log. The two real pages of
  2026-09-25 are the fixtures; a failing unit test after a Church Trac change means refresh
  them and adjust the reader.
- **The pictures are words.** Church Trac's images here are the mastheads and the section
  title cards ("What's Happening", "Tip of the Month"), all 1500 x 600. The masthead is named
  for a screen reader; the cards are decorative, since the build cannot read their lettering.
  They are served from Church Trac (`cdn.churchtrac.com`), not copied.
- **A third newsletter** is one entry in `NEWSLETTERS` (`src/lib/church-trac-newsletters.ts`),
  one small page file, one reserved slug (both copies and the test) and one share card.

### Church Trac forms on the site (2026-09-25, `claude/kind-heisenberg-jf34rt`)

- [x] **Checked in Church Trac's admin (2026-09-25, read-only, Nathan's Chrome as a Guest
      user) and the live Studio after the deploy of `861ce3ca`.** Studio: "Church Trac forms"
      in the desk, a new form opens with its three fields, Site settings shows its five tabs,
      the Help guide opens, no "Remove field", no console errors. The Studio's Church Trac
      steps were wrong ("Show Additional Options"); corrected to Cards, the form's card, the
      Form tab.
- [x] **The Connection Card is set up for the site (2026-09-25).** The only form in Church
      Trac (`fbcmuncie.churchtrac.com/connectcard`, 4 submissions). Its Form/Giving Embed
      Domain is now `fbcm-site.nathanjnixon86.workers.dev` (one domain only: change it to
      `www.fbcmuncie.org` at the cutover). The real embed code is a plain iframe on
      `fbcmuncie.churchtrac.com/form/<hash>`, which the reader accepts as written. Framed from
      the allowed domain, its Submit button sits at 919 px (640 wide) and 1025 px (340 wide),
      so it is saved as the Studio document "Connection card" (`churchTracForm-connection-card`)
      at size Long (now 1040 px, from that measurement). On Visit since 2026-09-25 (Nathan):
      a "Let us know you’re coming" band at `#connect` after the questions, and both of Visit's
      buttons jump to it. Site settings' connection-card link (every `{connect}` link: Contact, Visit's FAQ, Who We Are) moved from the Church Center form (159198) to `https://fbcmuncie.churchtrac.com/connectcard` the same day (Nathan; `scripts/set-church-trac-settings.mjs`, backup committed). And nobody is notified of a Church Trac reply until Notify User is set
      (below), so that must happen before the cutover sends real visitors here.
- [ ] #nathan **Urgent for the church: the Connection Card's `Notify User` is empty**, so
      nobody is emailed when a visitor fills it in (4 have). Someone should read Form
      Responses and set Notify User to the office.
- [ ] #nathan **Online giving is not set up in Church Trac**: Connect Setup > Online Giving
      asks for a Stripe account (2.9% + $0.30 per card gift, $0.25 per bank transfer, 2.2% +
      $0.30 at Stripe's 501(c)(3) rate; Church Trac adds no fee). The treasurer's job.
- [ ] #nathan **The Church Trac account time zone** (Halifax) is not visible to a Guest
      user; it needs an admin login (Jonathan or the office).
- [ ] **Church Connect's own pages, last 30 days:** 371 views; /pray 64, /youth 38,
      /birthdays 37, /children 26, /connectcard 25, /upcoming_events 20; 8 app users. The
      prayer list is the second most visited: worth the Prayer list box in Church systems
      (`fbcmuncie.churchtrac.com/pray`). A hidden "Link to Our Sermon Podcast" card exists.
      No custom domain is set on Church Connect (correct: fbcmuncie.org is for this site).

- [x] **Deploy before anyone uses it (schema change, rule 1).** Done 2026-09-25, see above. The branch adds the
      `churchTracForm` document and the `churchTracFormSection` band. Merge, deploy, open the
      live `/studio`, check `Church Trac forms` is in the menu on the left and nothing offers
      "Remove field". Nobody has seen it in a real Studio yet: the cloud container that built it
      could not reach Sanity (the Studio mounted to its "Couldn't reach the Sanity servers" page
      with no errors of its own, and `npx sanity schema validate` passed with none).
- [ ] #nathan **Get the embed codes from Church Trac and add the first forms.** For each form:
      Church Connect, the form, Show Additional Options, `Form/Giving Embed Domain` =
      `fbcm-site.nathanjnixon86.workers.dev` today; giving under Connect Setup, Connect
      Settings / Users, Online Giving, Embed (set its colours to the brand there). Then the
      Studio's Help guide "Put a Church Trac form on a page" walks the rest. Suggested first:
      the connection card on /visit and giving on /give once Church Trac giving is live.
- [x] **Check the first real embed code against the reader.** Done 2026-09-25: an iframe,
      accepted; the Connection Card fits Long. It was written from Church
      Trac's documentation, not from a real code: `src/lib/church-trac-form.ts` keeps the
      iframe's `src` when it is https on churchtrac.com. If Church Trac's code turns out to be a
      script, or points at another host, the Studio refuses it with a message and the reader
      needs one more case. Also check a real form's height against the three sizes (560, 820
      and 1180 px, a quarter more on a phone; Long became 1040 once the Connection Card was measured) and whether it scrolls inside its frame.
- **The embed domain changes at the cutover.** Step 5 of "After the move" in the cutover plan.
- **The frame does not size itself.** Church Trac's documentation says nothing of a resize
  message, so the Studio's `Form size` sets the height. If Church Trac turns out to post its
  height to the page, a small listener could replace the choice.
- **`npm run scaffold -- --remove church --write` leaves 2 type errors, neither from this
  branch:** `rich-ground.ts` imports `staff-band.ts` and `index.astro` names
  `VisitorManifest` outside their church regions. The Church Trac form pieces all go cleanly
  (checked on this branch, then discarded).

### Church links, for the move to Church Trac (2026-09-24, `feat/church-links`)

- [x] **Done 2026-09-24 (commit `8ccde56`, backup `scripts/data/backups/church-links-2026-09-24.json`):** deployed, then `church-links.mjs --apply --deployed` with Nathan's OK; 113 links in 102 documents now read from Site settings > Church systems. Original entry: **Deploy, then run the migration.** The Church systems boxes are new schema
      fields (rule 1), so the order is: merge, deploy, open the live `/studio`, check Site
      settings shows the **Church systems** tab and nothing offers "Remove field", then
      `node scripts/church-links.mjs` (read the plan: 113 links in 102 documents, 6 boxes
      filled with today's Church Center addresses, and the 29 listed visitor-visible changes)
      and `node scripts/church-links.mjs --apply --deployed`. It backs up first and writes one
      transaction. Nobody has seen the Church systems tab rendered yet: the local Studio stops
      at the CORS screen, because only ports 3333, 4321 and 8787 are on the CORS list.
- [x] **Done 2026-09-25 (code and content review, this session):** the words that named
      Church Center are out of the render path and the code defaults (the header/GIVE
      button and `/give` fall back to this site's own page rather than "Give through Church
      Center"; the privacy policy and `/llms.txt` drop a service with no address rather than
      naming a retired one; the footer's "Church Center: calendar and giving" link and the
      Studio's field descriptions and guide are rewritten for Church Trac). Two backup-first,
      dry-by-default scripts are ready and were run DRY ONLY this session, waiting on
      `--apply` after review. `scripts/retire-church-center.mjs` clears `sermonsUrl` (falls
      back to the YouTube live stream address already in Site settings), `givingUrl`,
      `lifeEventFormUrl`, `weddingBookingUrl`, `weddingEnquiryUrl`, `wednesdayUrl` and
      `churchCenterUrl`, and drops the footer's Church Center link.
      `src/lib/church-links.ts`'s `linkFallback()` (new this session) gives each cleared
      token an honest placeholder instead of a dead link: `{giving}` to `/give`, the two
      wedding forms to the wedding office's own `mailto:` address, and `{wednesday}` /
      `{contact-form}` hidden (the words stay, the link does not).
      `scripts/retire-church-center-in-posts.mjs` rewords "Church Center Channel" (and its
      few variants) to "YouTube channel" in the 43 posts where those words are the clickable
      text of an already-tokenized `{sermons}` link. Scoped narrowly on purpose: it only
      touches a span that is the text of a `{sermons}` link, never a past-event registration
      sentence or unlinked prose.
- [ ] #nathan **Run `scripts/retire-church-center.mjs --apply`** once ready to stop pointing
      anyone at Church Center: this is the actual switch-off. After it, `/give` says online
      giving is on its way (see the next item), the Wednesday page and the Notify-us form
      links are hidden site-wide until Church Trac has them, and the two wedding form links
      email the wedding office directly. Also run
      `scripts/retire-church-center-in-posts.mjs --apply` in the same sitting, so old posts
      stop naming Church Center once the sermons link no longer goes there.
- [ ] #nathan **Give Church Trac the Wednesday page, the Notify-us form, the two wedding
      forms, and set up online giving (Church Trac plus Stripe).** Until each is set up and
      its Site settings box filled in, that link is hidden (Wednesday, Notify-us) or emails
      the wedding office directly (the two wedding forms) or sends people to `/give`'s "on
      its way" page (giving). The portal has a connection card, events, a prayer list,
      /children and /youth, but nothing yet for those four.
- **`churchCenterUrl` stays in the schema, cleared, not removed.** If the church ever keeps a
  Church Center presence for something else, filling that one box brings it back into
  `sameAs`, `/llms.txt` and the privacy policy's linked-services list (each already skips a
  blank box rather than naming a service with no address).
- **Past-event links, left as written** (13 in 8 posts). Checked in a real browser on
  2026-09-24: all 8 Church Center registration pages say "This signup is currently
  unavailable". The Good Friday 2023 calendar event still shows. The
  `registrations.planningcenteronline.com` link in "Love in action: truth" sends visitors
  to a Planning Center staff login page, so it is broken for the public. All of them die
  when the Church Center account closes. Unlinking them is a content decision.
- **`npm run check:links` cannot see a tokenised link** (it checks absolute addresses only),
  and it does not read the Church systems boxes. So after the migration the church's
  outside links drop out of the live link check. `check-live-links.mjs` is PORTABLE, so
  it was not changed here. A site-side addition that sweeps `siteSettings.*Url` is the fix.
- **The privacy page fails validation on `main` too:** its `mailto:` contact link
  (`priv-contact-1l1`) does not pass `privacyPage`'s default url rule. It is not from this
  branch. Give that annotation `linkRule()` (or the sections' `uri` rule) the next time the
  privacy schema is touched.
- **Prayer list is blank on purpose.** Church Center has no prayer page, and nothing links
  to `{prayer}` yet.

### The blog as a plain register (2026-09-24, `feat/blog-flat`)

- [ ] #nathan **Should Home's Church Blog rows follow?** /blog and every archive now draw each
      cover as a plain 9:7 picture (PostRow `frame="plain"`); Home's band and a post's More from
      this series keep the small lancet. Switching Home is one prop (`frame="plain"` on the
      PostRow in `src/components/sections/DynamicList.astro`), but Home's rows then change
      markup, so parity moves with it. Side-by-side screenshots were taken on the branch.

### This Sunday's preacher and the service's small line (2026-09-25, `feat/preacher-and-feel`)

- [ ] #nathan **Deploy before applying: this branch adds a schema field.** `heroFact.note`
      ("Small line under the value (optional)", `sections.ts`). Merge and deploy first, so
      the Studio knows the field before the data carries it (rule 1), then
      `npm run seed-pages -- --only home --apply`. The dry run on 2026-09-25 changes exactly
      one field of the live `homePage`:
      `pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note`, from nothing to
      "Intergenerational, casual dress welcome". Apply only after the church approves it.
- [ ] #nathan **Ask the church to approve the service line**, or to give its own two to
      six words. Proposed: "Intergenerational, casual dress welcome", built only from two of
      its statements: the Worship goal ("gathering to worship as the full, intergenerational
      body of Christ", Who We Are) and the FAQ "What should I wear?" ("Casual dress is
      welcome."). It is on the approval note. If the church would rather say what happens
      in the service, the question to ask is: "In a few words, what is your 10:45 service
      like: hymns, a praise band, both? And how long does it usually run?"
- **"About an hour" is not the church's statement, and the livestreams disagree with it.**
  Site settings' `serviceLength` is the schema's `initialValue`, seeded in plan 2a and never
  confirmed; Visit's hero prints it under "How long", and the Church schema and the .ics
  read it as 60 minutes. The YouTube replays run from about 10:40 to noon, which is why
  `live-service.ts` holds "Live now" for 75 minutes. It was deliberately left out of the
  proposed line; the question above asks the church for the real length.
- **"Hymns" is not the church's word either.** No page of the church's says hymns; the only
  sentence that does is Visit's hero lede, "...from the parking lot to the last hymn", which
  is ours (plan 2b). The church says praise team, instruments "from the ukulele to the
  organ" and a handbell choir (the Worship ministry).
- **The preacher is not shown without JavaScript, on purpose.** The fact is server-rendered
  `hidden` and shown by the upgrade script only while the Sunday the dated line names is
  its Sunday. A name without a date cannot be dated by a visitor with no script, and a
  stale page would otherwise name last week's preacher to them. Everyone with JavaScript
  sees it from the build that finds it until Sunday night on their own calendar.
- **With no feed, only a preview can name a preacher.** The deploy build's feed fetch has
  been failing (the logging fix, `77cd5fa7`, will say why). Until it works there, the
  fourth fact is absent on production (the row is the old three), unless a preview for the
  Sunday names a person. Nothing extra renders when the feed is missing.
- **A preview written by "FBC Muncie" names nobody** (11 of the 118 previews): the church's
  own account is not a preacher, and the fact then falls through to the broadcast. The post
  page still prints "Preaching: FBC Muncie" on those 11 previews, which is the same
  question from the other side and is not changed here.
- **The note is drawn only by the photo hero** (`Hero.astro`, the home page's layout). The
  window and split heroes draw their facts through `HeroFacts.astro`, which does not read
  `note` yet: Visit's hero was being edited on another branch the same day. If Visit wants
  a small line too, it is a few lines in `HeroFacts.astro`.
- **Parity on Home moves with the feed three times over now:** the hero line, the Last
  Sunday band and the preacher fact (`data-sunday-fact`, the name). A diff confined to those
  on a new week is content.

### This Sunday's sermon from YouTube (2026-09-24, `feat/this-sunday-youtube`)

- **The title caps are width bands, measured once (`fix/sunday-title-length`).** 24
  characters below 640 px, 40 from 640, 56 from 1024 (`live-sunday.ts`). They assume a
  reading of about 20 characters. A longer reading ("Genesis 32:22-31; Romans 9:1-5") can
  still wrap the sermon half onto a second line between 640 and about 700 px. That is a
  wrap inside the column, never an overflow. If the hero's type size or tracking changes,
  re-measure: the numbers are in the comment above the constants.

- [ ] #nathan **Push, and the Thursday and Saturday builds start.** `deploy.yml` gains two
      more `schedule` crons (Thursday and Saturday 12:00 UTC, 8 am EDT / 7 am EST) so a
      broadcast the church schedules midweek (Wednesday 2 pm for September 27) reaches the
      hero line before Sunday. Scheduled workflows run from `main` only. **The 60-day pause
      applies to all four crons:** GitHub disables a repo's schedules after 60 days with no
      commit activity (the scheduled runs themselves do not count), and after the cutover
      this repo may go that long untouched. When it happens the line and the Last Sunday
      band quietly stop moving; GitHub emails the repo owner before it disables them, and
      any push (or re-enabling the workflow in the Actions tab) re-arms them.
- **The "scheduled" signal is views="0", nothing more explicit.** Checked on the live feed
  on 2026-09-24: the Atom feed has no `yt:liveBroadcastContent`, no scheduled start time and
  no future `<published>` for the upcoming broadcast; it differs from a replay only in
  `views="0"`, a midweek `<published>` (2026-09-23 18:03 UTC) and an `<updated>` two
  seconds later. The Sunday is derived as the first Sunday strictly after the publish day,
  church time. What would fool it: a broadcast scheduled more than a week ahead (named a
  week early, then dropped by the client stale check on the wrong Sunday's line; it cannot
  happen with one scheduled per week), or a zero-view midweek upload that is not the
  service but is titled "Sermon - Reading - Series" (none in the feed's history). A title
  that does not split, and two different broadcasts for one Sunday, both give no sermon.
- **The line drops the sermon on Sunday afternoon's rebuild.** By 18:00 UTC the stream has
  views, so it is no longer "upcoming"; the line reads "Today · Worship at 10:45 am" for
  the rest of the day, as it did before this branch. Harmless, since the service is over.
- **Parity on Home now moves with the feed twice over.** The hero line (the sermon, its
  reading and the video id) joins the Last Sunday band as weekly content in
  `scripts/.parity/index.html`; a diff confined to those two places on a new week is
  content, not a regression.
- **Found and fixed: `CLAUDE.md` on `main` carried unresolved merge-conflict markers** from
  the `feat/last-sunday` merge (`6e6a8683`), mangled by Prettier into `<<<<<<< HEAD`,
  `\=======` and `> > > > > > > feat/last-sunday` around the test:unit, parity and
  `npm test` bullets. Resolved here by keeping main's text and adding the last-sunday
  additions to it.

### Last Sunday, Sunday weather and the Sunday calendar (2026-09-24, `feat/last-sunday`)

- [ ] #nathan **Push, and the schedule starts.** `deploy.yml` now also runs on
      `schedule` (Sunday 18:00 UTC and Monday 10:00 UTC) so Home's "Last Sunday" band and the
      hero's "This Sunday" sermon line keep up in a week with no push and no publish. Scheduled
      workflows run from the default branch only, so nothing happens until this is on `main`.
      GitHub pauses schedules after 60 days with no repo activity; a push re-arms them. IndexNow
      is skipped on scheduled runs.
- **Merge with `feat/scripture-text`'s `src/lib/ics.ts`.** This branch's Sunday calendar file
  (`src/lib/sunday-ics.ts`, served at `/visit/sunday.ics`) carries its own `icsEscape` and
  `icsFold`, named as a general generator names them. When both branches are on `main`, re-express
  `sundayServiceIcs()` through `ics.ts` (keeping the VTIMEZONE block, the RRULE and the stable UID
  `sunday-worship@fbcmuncie.org`, so a calendar that subscribed does not duplicate the event) and
  delete the two helpers and their tests.
- **The "is it a Sunday service" rule reads YouTube's publish time.** A replay counts when it was
  published on a Sunday or a Monday, church time, with at least one view (next Sunday's scheduled
  broadcast sits in the feed days early with none). Measured on the real feed on 2026-09-24: all 14
  replays qualify (13 published 12:06 to 12:54 am Monday, one at 12:14 pm Sunday) and the upcoming
  broadcast (published Wednesday, 0 views) does not. If the church ever schedules next week's stream
  on a Sunday or Monday AND it shows a view before it airs, the band would name it; if replays start
  publishing on Tuesday, the band falls back to the week before (never wrong, only a week old) until
  the rule widens. `src/lib/youtube-feed.ts` `lastSundayRecording()`.
- **No rain note on the weather line.** The brief allowed "the circular drive entrance on Adams
  Street is covered" in rain or snow, but only if Visit's own words say so, and neither the Visit
  page nor the church's accessibility page mentions a canopy. If the entrance is covered, the
  church can say so and the note is one line in `weatherSentence()`'s caller.
- **Owner question: a paired sermon.** The band pairs with a sermon preview posted for the same
  Sunday; the newest preview in the dataset is January 6 2026, so today the band shows the video
  alone. It pairs automatically the week previews resume.
- **The band changes every week, so Home's parity baseline does too.** A recapture on a different
  week than the build shows a diff inside `section.ls-band` only (the date, the title, the video
  id). That is content, not a regression.
- **Found while recapturing parity: unfilled placeholders in the live dataset.** Site settings
  links now hold `{giving}` (the header's Give plate and the menu, every page), `{sermons}`,
  `{connect}` and `{contact-form}`, which main's code renders literally as `href="{giving}"`
  (checked on a main build of the same dataset). They belong to the concurrent Site settings work,
  whose branch presumably fills them; until it is merged, ANY rebuild of main (a publish, a push,
  and from this branch on the Sunday and Monday schedule) ships those links broken. This
  branch's parity baselines were captured on that dataset.
- **`YOUTUBE_API_KEY` is not used by the band.** The key is a Worker secret for `/api/live-status`,
  not a build variable, and the public feed has everything the band draws. If the build ever needs
  durations or the maxres thumbnail, pass the key to the deploy job's build step and read it in
  `src/lib/last-sunday.ts`; keep the feed as the fallback.

### Craft details: share cards, JSON-LD, "Which door?" (2026-09-24, `feat/details`)

- [ ] #nathan **Confirm the door sketch's geography.** `/visit`'s "Which door?" puts the office
      wing (with the circular drive and its glass doors) at the Jefferson Street end of the Adams
      frontage, the tower and its wooden doors east of it, the sanctuary east of that, and the
      parking lot east again, off Adams. The corner (Adams to the north, Jefferson to the west)
      is certain: the church's History and OpenStreetMap. The drive, the lot and the side doors'
      streets are the church's own words. The ORDER along Adams is read from the library's
      photographs and the OpenStreetMap footprint, and is the one inference: a two-minute look
      from someone who knows the building settles it. If the lot is somewhere else, move
      `.dp-lot` in `src/components/church/DoorPlan.astro`.
- [ ] #nathan **Approve four new lines** (listed in the copy-for-approval note): "Choose a door
      to see where it is.", "A sketch of the street side, not to scale. North is up.", the
      sketch's labels (Offices, Sanctuary, Parking), and the /blog share card's line "Sermon
      previews, news and writing from the church".
- [ ] **After the next deploy, run Google's Rich Results Test** on `/visit` and one sermon
      preview. Everything here was validated offline (`npm run check:jsonld`, the vocabulary in
      `src/lib/schema-vocab.ts`); Google's own parser is the check it cannot do. Expect the
      weekly `Event` NOT to earn an event rich result (Google supports single events only); it
      should report no errors.
- [ ] **Share-card previews after cutover.** Facebook and LinkedIn cache a URL's card on first
      share; after the cutover to `fbcmuncie.org`, paste `/` and `/visit` into Facebook's Sharing
      Debugger once to seed them.
- **Known limits, by design:** the paginated, tag and category archives share `og-default.png`
  (hundreds of near-identical routes; the generator draws pages and posts only), and a build with
  no Sanity project draws no cards at all (every route falls back, nothing 404s).

### Scripture index and site search (2026-09-24, `feat/scripture-search`)

- [ ] #nathan **Approve the new copy** listed in
      `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`, "Scripture index and site
      search" (the index's lede and headings, "By passage", and the search's labels).
- **11 sermon previews have no Reading, so they are not in the index.** `readingOf()` wants a
  chapter:verse reference in the opening; three of the eleven name only a chapter ("From 1
  Thessalonians 1" on /post/imitators, "excerpt from Psalm 93" on /post/one-forevermore,
  "- Psalm 130" on /post/sing-to-our-redeemer), and the rest quote a passage without naming it.
  Teaching `readingOf()` whole-chapter references would add those three to the post pages and
  the index at once (`parseReading` already reads "Psalm 130"); it is a judgement call about the
  rule "never guess", so it is left for a decision.
- **The first reference is the reading, as everywhere else.** A few previews name a verse before
  the passage (e.g. `Zephaniah 3:19` ahead of `Zephaniah 3:14-20`, `Luke 24:30-32` ahead of
  `Luke 24:13-35`), so the index lists the verse the post page already prints as its Reading.
  Fixing that is a change to `readingOf()` and would move the post pages too.
- **Pagefind's fuzzy matching finds near words.** A nonsense query can still return one loose
  match (e.g. "xylophone" finds a post); "zebrafinch" returns nothing and is what the test uses.
  This is Pagefind's ranking, not a bug here.
- **Pagefind's default UI files ship in `dist/client/pagefind/`** (`pagefind-ui.js/.css`,
  modular and component UI and the highlighter, about 410 KB together). The Node API writes them unconditionally;
  nothing links them, so no visitor downloads them. Deleting them after the write is possible if
  the asset count ever matters.
- **Scaffold proof (rule 14):** `npm run scaffold -- --remove journal` lists every new file
  (the scripture and search modules, the page, both Playwright files) and the marked lines in
  Header, MobileNav, BaseLayout, DynamicList and `tests/routes.ts`; after `--write`,
  `node scripts/pagefind-index.mjs` skips itself. The removed tree still has the 4 type errors
  noted under `feat/sunday` above, plus 5 unit failures from the same unmarked leftovers
  (`convert-body.test.ts`, `import-post.test.ts`, which need `schemaTypes/journalEntry.ts`),
  none from this branch.

### Print and motion (2026-09-24, `feat/print-motion`)

- [ ] #nathan **Look at the post title carrying over** (/blog, click a row's title). The row
      sets the title in Castoro and the masthead in Castoro Titling capitals on three lines, so
      it is a hand-over in motion (the small title fades as the box rises, the large one fades
      in), not a true morph. It is one import in BaseLayout's layout script to take out
      (`@/components/transitions/shared-title`) if it reads as fussy.
- **Print is verified in Chromium only** (`page.pdf()` and `tests/print.spec.ts`). The page
  numbers are an `@page` margin box, which Chrome 131+ prints and Firefox and Safari simply
  omit; Safari's print of the post has not been looked at.
- **A figure that does not fit under the text moves whole to the next page** and leaves white
  space behind it (the Messiah post's poster on page 1). Figures are capped at 3in to make it
  rarer; splitting a picture is the only other answer, and the brief rules that out.
- **Frame captures of a view transition are unreliable in headless Chromium.** Slowing the
  animations over CDP (`Animation.setPlaybackRate`) showed the new page at the old scroll
  position mid-fade, which a per-frame `scrollY` log of the same navigation never saw; the
  "page slides" finding was made from real-time captures and fixed, but read any slowed-down
  frame of a transition with that in mind.
- **Scaffold (rule 14):** `npm run scaffold -- --remove journal` lists the new journal files
  (`src/lib/shared-title.ts` and its test, `src/components/transitions/shared-title.ts`,
  `tests/print.spec.ts`, `tests/transitions.spec.ts`) and the marked import line in BaseLayout.
  Dry run only; the known pre-existing leftovers noted under `feat/scripture-search` stand.

### Local search and AI visibility (2026-09-24, `feat/local-seo`)

- [ ] #nathan **Apply the new search titles and descriptions** (after the merge; no schema
      change, so no deploy is needed first). `npm run seed-pages -- --only <pages>`, with `<pages>` being
      home,visit,who-we-are,beliefs,ministries,staff,history,wedding,give,contact,blog, prints
      the plan: on 2026-09-24 it changed ONLY `seoTitle`/`seoDescription` on those 11
      documents, and it now prints each field's before and after. Re-read it for any other
      field before adding `--apply` (a Studio edit since then would show up as a second
      field), then let the publish webhook rebuild. Until then the live pages and
      `/llms.txt`'s page lines carry the old descriptions.
- [ ] #nathan **Approve the new copy**: the titles and descriptions under each page, and the
      "/llms.txt" section, in `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`.
- [x] #nathan **Add Facebook and Instagram in Site settings, Social links.** Done 2026-09-24
      (`set-social-links.mjs`); since `feat/social-links` the footer, the mobile menu and a
      "Follow along" group on /contact draw them with YouTube (`src/lib/social-links.ts`).
      Approve the words "Follow along" in the approval note. The footer now shows YouTube
      twice, once as the Elsewhere column's "YouTube: every service" link and once as an
      icon; drop the column link in Site settings if that reads as one too many. The Wix site's
      navigation linked `https://www.facebook.com/firstbaptistmuncie` and
      `https://www.instagram.com/fbcmuncie/` (`scripts/data/nav.json`), but Site settings holds
      no social link, so neither reaches the church's `sameAs` today (YouTube, Church Center,
      Church Trac and Wikidata do). Confirm both are still the church's, then add them as two
      Social links entries (a Studio edit, not code). Side effect: the footer draws social
      buttons for them (its "show social buttons" switch is unset, which means yes).
- [ ] #nathan **Claim the church's Google Business Profile**, then put its Google Maps share
      link in `site.googleBusinessProfile` (`src/data/site.ts`, empty today). It joins
      `sameAs` and becomes `hasMap`.
- [ ] **At the cutover:** the "Search and AI visibility at cutover" list in
      `docs/superpowers/notes/2026-09-20-cutover-plan.md`: Cloudflare AI Crawl Control OFF
      (verify with a GPTBot curl), Search Console and Bing Webmaster Tools (import from GSC)
      with the sitemap, the 49 redirects spot-checked, the Rich Results Test on `/`, `/visit`
      and one post, and IndexNow's first real run.
- **`public/llms-full.txt` is a snapshot, made by hand** with `npm run llms:full`, and it is
  stale: its post list stops at the posts of its run, its title line carries an em-dash, and
  it calls the church a "business". `/llms.txt` (now generated every build) links it. Either
  regenerate it at the cutover, or make it a build-time route like `/llms.txt`.
- **Known limits, by design:** the FAQPage earns no Google rich result (Google limits FAQ
  results to government and health sites); IndexNow resubmits every sitemap URL on every
  deploy (no dates in the sitemap to tell changed pages apart; the engines ignore unchanged
  ones); post `<title>`s are unchanged, a place name would not read naturally there.

### Scripture text and the post tools (2026-09-24, `feat/scripture-text`)

- [ ] #nathan **Confirm the translation with the pastors, or get an NIV route.** Every sermon
      preview's reading now opens into its passage in the Berean Standard Bible (public domain,
      no key). The church quotes the NIV. The code already switches to the NIV when
      `API_BIBLE_KEY` is set at build time and API.Bible has the NIV for that key, inside
      Biblica's allowance. The steps, in order:
  1. Ask the pastors: BSB (nothing to do), or NIV.
  2. If NIV, **ask Biblica for written permission** (biblica.com/permissions). Without it the
     site may show only part of what it needs: the previews quote **1,014 distinct verses**,
     twice the 500-verse allowance, and three books pass a quarter of their text (1
     Thessalonians 47 of 89 verses, 52.8%; 1 John 48 of 105, 45.7%; Philippians 32 of 104,
     30.8%). Biblica's notice also says the verses may not be 25% or more of "the work in which
     they are quoted"; read as the page, the passage is at least a quarter of 52 of the 107
     preview pages (median 24.8%, largest 79.5%). Under all three limits the build's cap gives
     the NIV to 54 readings (303 verses) and leaves 52 in the BSB. With written permission the
     allowance in `TRANSLATIONS.NIV` (`src/lib/scripture-text.ts`) is changed to what Biblica
     grants.
  3. Get a free API.Bible key (api.bible, Starter plan: non-commercial, up to three copyrighted
     Bibles, 5,000 calls a month) and pick the NIV. Confirm with API.Bible that a church site
     with a Give link counts as non-commercial ("NIV commercial use not available").
  4. Put the key in GitHub as the `API_BIBLE_KEY` secret and pass it to the build step in
     `deploy.yml` (and in `.env` locally). Build and read the `[scripture]` warnings: each
     reading that stays BSB is named.
  5. Two API.Bible terms come with it: **FUMS**, a third-party script
     (`https://pkg.api.bible/fumsV3.min.js`) that must run where its text is shown (built:
     `src/scripts/fums.ts`, loaded only when a reader opens an NIV passage; it is the only
     third-party script a post would load, beside the cookieless analytics); and **cached text
     cleared within 14 days**, which for a static site means a rebuild at least every 14 days
     (the build refetches NIV text older than that; weekly previews already trigger rebuilds,
     but a scheduled weekly build would make it certain).
- [ ] #nathan **Approve the new copy**: "Read Romans 13:11-14", "Read aloud", "Stop",
      "Share", "Add to calendar", "Link copied" and the calendar event's words, in the approval
      note's "Sermon previews: the passage..." section.
- **"Read aloud", not "Listen".** The brief asked for "Listen to this post"; a preview's order
  already has a Listen row (the livestream) one line above, so the tool says "Read aloud".
- **For the Visit agent:** `src/lib/ics.ts` exports `buildIcs`, `escapeText`, `foldLine`,
  `localStamp`, `utcStamp`, `ICS_TZID` and `VTIMEZONE_INDIANAPOLIS`. A weekly Sunday service is
  `buildIcs({ prodId, stamp, events: [{ uid, start: { date, minutes }, durationMinutes,
summary, location, rrule: 'FREQ=WEEKLY;BYDAY=SU' }] })`; `src/lib/worship-ics.ts` shows how
  the time, length and address are read from Site settings (`serviceMinutes`, `addressLine`).
  `ics.ts` carries no scaffold marker on purpose: it is not the journal's.
- **The NIV path is unverified end to end** (no key exists). `versesOfBracketText` is tested
  against the text format API.Bible's docs describe; the first keyed build should be read line
  by line, and a passage checked against a printed NIV.
- **A whole-chapter or verse-list reading** ("Psalm 130", "Romans 5:1, 6") is handled by
  `passageSpans`, but `readingOf()` still only finds chapter:verse references (see the scripture
  index entry below), so none reaches the page today.
- **`/blog/scripture` carries no passage text**, on purpose: the index lists 106 passages, and
  their text is about 190 KB of JSON (1,037 verses) that would make a light register page heavy.
  Each row already links to its post, where the passage opens.

### The Visitor: before the page is applied (2026-09-24, `feat/the-visitor`)

- [ ] #nathan **Apply The Visitor, in this order, after the merge** (no schema changed, so no
      deploy is needed first; each step is dry by default, backs up first, and was dry-run on
      2026-09-24):
  1. `npm run seed-pages -- --only visitor` then `--apply`: creates `page-visitor` (two
     document lists, 39 issues and the two books, `addToFooter: true`). The PDFs are the assets
     already uploaded for /blog; nothing uploads.
  2. `npm run seed-pages -- --only blog` then `--apply`: replaces /blog's `additionalSections`
     (the publications list) with the one pointer line, anchored `publications`.
  3. `npm run seed-pages -- --only ministries` then `--apply`: the "The Visitor Quarterly" link
     in "Stay updated" goes to `/visitor` instead of `/blog#publications` (block [10] only).
  4. `node scripts/set-visitor-redirect.mjs` then `--apply`: the Wix `/publications` redirect
     goes to `/visitor` (it refuses while `/visitor` is unpublished).
  5. Rebuild (a publish or a push). The home band, the footer link and the search records
     appear on that build, all read from the published page. Then look at `/visitor`, Home and a
     search for "Messy Camp" in production, 1440 and 390.
- [ ] #nathan **Approve the new copy** (the approval note, "/visitor" and "/blog"): "Latest
      issue", "Read this issue", "Past issues", "Two books", the home band's "… issue · Read it",
      /blog's pointer line, and the search description.
- **Owner question: the issues' dates, and one disagreement.** Every issue is now dated from its
  Wix button's month, the PDF's build date and the month and year printed on its cover
  (`scripts/lib/visitor-dates.mjs`). Three results differ from the old /blog list: the file Wix
  called "Download Latest Issue" (the "Current Visitor" row) prints **September 2026** on its
  cover and is now the latest issue (Nathan's brief expected June 2026, the newest one the old
  list gave a month); the June with no build date prints **June 2022**; and the file whose
  button says **August** (2024) prints "September 2024" on page 1, next to a separate September
  2024 issue. It stays August 2024 (the church's own label) until the church says otherwise.
  Every other cover agrees with the old derivation.
- **After the apply, delete the preview:** `src/pages/styleguide/visitor.astro`,
  `scripts/data/fixtures/visitor.json` and the `/styleguide/visitor` line in `tests/routes.ts`,
  and point `tests/visitor.spec.ts` and the `VISITOR_FIXTURE` seam at a fixture of their own
  (the suite still needs fixed data) or keep the fixture for the suite only. Add
  `http://localhost:4173/visitor/` to `lighthouserc.json` then, not before (it 404s until the
  page exists).
- **A cold build downloads every issue once.** About 630 MB from the Sanity CDN, 93 s on this
  machine, then only the covers and text are kept (7 MB in `node_modules/.cache/visitor/`,
  restored by ci.yml, deploy.yml, deploy-staging.yml and lighthouse.yml). A new issue costs one
  download. If a file ever fails to draw, it is cached as failed (a typeset cover stands in);
  delete its folder under the cache to retry.
- **The search's no-match test word changed** from "zebrafinch" to "fqxzvw": Pagefind matches a
  lone letter in the index against the start of a query, and The Visitor's text brought "Gen Z"
  (June 2025). Letter-spaced mastheads are closed up before indexing (`unspace()`), which removed
  the other lone letters; a real "Q:" or "Z" in prose stays.
- **Text quality.** pdfjs splits some ligatures ("fi ve" for "five" in September 2025), so an
  exact phrase across one can miss; single words still match. OCR is not attempted: every issue
  since 2020 has a text layer (the shortest, July 2024, has 1,101 characters).
- **The footer switch is now live for every page.** `addToFooter` ("Show in the footer") was in
  the schema and read by nothing; `Footer.astro` now honours it (`src/lib/footer-pages.ts`). All
  nine existing pages have it unset, so nothing else moved.
- **Scaffold (rule 14):** the new site files carry `scaffold-file: church` (the issues lib and
  test, `VisitorIssues`, `IssueCover`, `VisitorBand`, the styleguide page, the spec), the home
  import and band are a marked block, and `/styleguide/visitor` in `tests/routes.ts` a marked
  line. `scripts/visitor-covers.mjs` is unmarked on purpose: `npm run build` calls it, and it
  skips itself when `src/lib/visitor-issues.ts` is gone, as `fetch-scripture.mjs` does.

### Visitor audit: before /visit is applied (2026-09-25, `feat/visit-fixes`)

- [ ] #nathan **Apply /visit after the merge.** No schema changed, so no deploy is needed first.
      Run `npm run seed-pages -- --only visit`, read the plan, then `--apply` (it backs up
      first). The dry run on 2026-09-25 said "would be replaced", `fields: pageBuilder`, and
      the live document matched the old module exactly, so no editor edits are overwritten.
      Keyed by block: the hero's button label ("Fill in a visitor card" to "Let us know you’re
      coming") and its lead line (the promise added); two new blocks, `visit-good-to-know`
      after the hero and `visit-your-children` (anchor `children`) after the morning path;
      the closing band's button label and subhead (". A greeter will look out for you."
      added); the other five blocks unchanged, only moved down. The button's link is still
      `{connect}`. Then rebuild, and look at /visit in production at 1440 and 390.
- [x] **After the apply, delete the preview** (done 2026-09-25): `src/pages/styleguide/visit.astro`,
      `scripts/data/fixtures/visit.json`, the `/styleguide/visit` line in `tests/routes.ts` and its
      parity baseline, and point `PAGE` in `tests/visit.spec.ts` at `/visit`.
- **The styleguide's CI screenshot moves.** Its Church Blog band now shows three rows (Blue
  Christmas, a past event, drops). Refresh `visual.yml`'s baseline with its `update` input the
  first time it runs against this change.
- [ ] #nathan **Approve the new copy** (the approval note, "/visit"): the button label, the
      greeter promise in the hero and the closing band, "Good to know", "Your children" and its
      four column heads. The promise needs an answer before it goes live: who reads the connection
      card, and do they tell the greeters on Sunday?
- **Owner questions, not stated on the site because the church has not written them:**
  - "Will I be singled out?" Nothing on the Wix site says whether visitors are welcomed by name
    from the front, asked to stand, or left alone. The nearest answer ("You may participate ...
    as you wish") is in Good to know.
  - "Do I have to give?" Nothing says a visitor is not expected to give. The only giving line is
    the Children FAQ's "Can children bring an offering?"
  - Can someone other than a parent or guardian (a grandparent, a named friend) collect a child
    with the security tag? /children says "only ... a parent/guardian".
  - Two room and age conflicts are on the approval note's confirm list: The Underground in B-03
    or B01, and the nursery from 6 weeks or from birth ("infants").
- **What Home's rows show now** (the build of 2026-09-25): the Messiah Sing-In (kept until 11
  December 2026), then the Worship Arts Pastor job listing (September 2025) and the January 2026
  Ecclesiastes sermon preview, which moved up when two past events dropped. Is the job still
  open? If not, the listing is the next stale row, and the fix is to unpublish it or file it
  differently; the event rule does not touch it.

### Beliefs identity: before the page is applied (2026-09-24)

- **The page is composed but not applied.** `scripts/pages/beliefs.mjs` uses no new
  field, so the schema does not block it, but the look is this branch's code: deploy
  first, then `npm run seed-pages -- --only beliefs` (the plan on 2026-09-24: "would
  be replaced", `pageBuilder` [1], [2], [5] to [10] changed; the live page matched the
  old module exactly apart from the stored `{service time}. {address}.` placeholders,
  so no editor edits to carry over; re-read the plan in case one has been made since)
  and `--apply` (backup first). Its three PDFs are already in the asset map. Then shoot
  /beliefs in production, light and dark, 1440 and 375.
- **Owner question: brand grounds on text bands, site-wide.** `src/lib/rich-ground.ts`
  turns every text band on the cadence's muted turn into a brand band (indigo, brown or
  taupe), on every page, not only /beliefs: /staff (brown, indigo), /wedding (brown,
  indigo), /history (indigo, brown, taupe) and /give (indigo) change with it. It is the
  rollout's "RichText: brand colours" read as grounds, derived (no field). If Nathan
  wants it on /beliefs only, the lever is `richGrounds()`; there is no per-page switch
  without a field, which rule 9 forbids.
- **Owner question: the page's headings are the church's own again**, including the long
  "Our Confession & Denominational Identity Statement" and the four value headings
  unmerged (declared in the module's `edits`). "Read the documents" (the document band)
  and "Baptism" remain the only headings the church did not write.
- **Rule 20 on /blog is over the line on `main` already.** The blog index inlines one
  150,098 B sheet on this branch (149,330 B on `main` at 3334ee3, before this branch),
  past the 147,456 B ceiling, because it renders through SectionRenderer and so carries
  every section's CSS. It still inlines (Vite checks each CSS chunk, not the page). This
  branch's share is +768 B (the Ledger's brand grounds and beside-heads, net of the
  removed newspaper columns). The fix belongs to whoever owns the blog index's imports.
- **Done (2026-09-24): the `/beliefs` preview fixture is removed**, with the other nine, after the page's content was applied. `scripts/page-fixture.mjs` and the empty `scripts/data/fixtures/` folder stay for the next page composed ahead of its deploy.

---

## Photo library uploaded (2026-09-23)

Branch `feat/photo-library-upload`. Every church photograph captured from the old
Wix site is now in the Sanity media library, tagged and described, so an editor can
find and pick one from the image picker at any time. Nathan: "Put them all on the
site so they can be picked at any time by a future person." Every photo of a child
from the old site is approved by the church.

- **What is there.** 138 photographs: 84 uploaded by this pass, resized to 2400px on
  the long edge (25.7 MB), and 54 that the page seeds and the post import had already
  uploaded, tagged and described in place rather than uploaded twice. Each has a
  title, alt text, description and a readable filename. People are named only where
  the Wix alt text named them (the staff portraits, Dan Mattox, Cassius M. Carter).
  Every asset this pass touched carries `source.name == "fbcm-wix-archive"` and
  `source.id` = the archive filename.
- **The record.** `scripts/data/photo-library.json` classifies all 453 archived
  images, with an `upload` flag and, for the 315 left out, a reason: 287 graphics,
  logos and sermon or event art, 16 Unsplash stock, 10 exact duplicates, one stock
  office tower, and one personal holiday selfie from a blog post. Soft, poor or
  sub-1000px photos are kept and tagged "Needs a better copy".
- **The tag vocabulary** (sanity-plugin-media `media.tag` documents, ids
  `media-tag-<slug>`): People, Children, Worship, Youth, Fellowship, Service,
  Portraits, Building interior, Building exterior, Wedding venue, Historic, Needs a
  better copy. Wedding venue marks the /wedding page's building shots (sanctuary,
  parlor, bridal suite, exterior) and the wedding photographs themselves. Tag new
  photos from this list; add a tag only when none fits.
- **How to add photos.** An editor: Media tab, "Upload assets", then open the photo
  and set its tags, title and alt text. In bulk: add rows to `photo-library.json`
  (`upload: true`, title, altText, description, tags) with the file in
  `fbcm-archive/images/`, run `node scripts/upload-photo-library.mjs` (dry by
  default, one line per photo, writes nothing), then `--apply`. A second run reports
  `cached` for everything. `--overwrite-meta` replaces metadata an asset already has;
  without it only empty fields are filled, so editors' changes survive a re-run.
- **Side effect at the next rebuild.** `queries.ts` falls back to the asset's
  `altText` when an image has no alt of its own. Only the 17 Staff page photos do
  that: their alt was the person's name and becomes the library's sentence (for
  example "Kendall Ellis smiling in front of stained glass"). Nathan approved this.
  Asset uploads do not trigger a rebuild (the webhook filter excludes asset types).
- **Placement pass done (2026-09-23, `feat/photo-placement`).** Nathan approved each
  placement from a before/after sheet; the dataset writes ran backup-first
  (`scripts/data/backups/*-2026-09-23*`).
  - Home "What a first Sunday is like": a man handing a woman assisted-listening
    headphones at the sanctuary door (was the empty sanctuary).
  - /visit "Where the children go": children on the chancel steps with Kendall.
    The hero gained a second frame, the front of the building, so the spare-image
    pool lends THAT to "Doors, parking and access" and the children band keeps its
    own photograph.
  - /beliefs: a new "Baptism" band after "Four things Baptists hold to", beside a
    baptism from the old /baptists page. The church's three baptism paragraphs moved
    into it unchanged.
  - /wedding: the hero is a ceremony at the chancel; a new "Weddings here" gallery
    (three landscapes) follows the testimonial, then the church's own credit lines
    ("Photos used with permission from the couples and the photographers.", and the
    photographers' names), which the page had cut on the wrong reading that no
    couple's photo was on it.
  - /ministries: Adult (a women's fellowship breakfast) and Outreach (the Serve Your
    City team) have photos for the first time; Children is now VBS singing, so the
    four-children photo is not used three times. These live on the ministry
    documents, set by `scripts/place-ministry-photos.mjs` (dry by default).
  - How: a `page-images.json` entry can now be `{ "library": "<archive file>" }`,
    resolved to the existing media-library asset, never a second upload.
- **Spare-image rule added (`src/lib/spare-images.ts`, unit-tested).** The heritage
  band's strip no longer repeats a photograph a band above it already draws, nor the
  hero's first photograph through another band. It changed exactly two pages
  (measured by building with and without it): /visit had shown Kendall's photo twice
  (the tower, before this pass), and home would have shown the first-Sunday photo
  twice. /history's opening strip still previews its era photos, on purpose.
- **Parity recaptured (2026-09-23, e5c2532).** Home and /visit were the two pages
  the strip rule changed; after deploy they were recaptured and the tree proved at its
  fixpoint, 162/162. Production checked after the deploy: no page repeats a photo.
- **Seeding from a nested worktree** needs `<worktrees>/fbcm-archive` to resolve
  (a directory junction to `Projects/fbcm-archive` was made on 2026-09-23) AND, for
  any `file` entry in `scripts/data/page-images.json`, the worktree's
  `scripts/.asset-map.json` filled from the dataset. **A dry run no longer uploads**
  (fixed 2026-09-23, the Home identity pass, `scripts/lib/page-images.mjs`): it
  resolves `library` entries (the media library) and `file` entries already in the
  asset map, and REFUSES any other `file` entry with an error that names the exact
  map key (`scripts/.page-images/<key>.jpg`) and the asset filename (`<key>.jpg`).
  To fill it, copy the id from the main checkout's `scripts/.asset-map.json`, or
  look it up by filename:
  `npx sanity documents query '*[_type=="sanity.imageAsset" && originalFilename=="<key>.jpg"]._id'`.
  Only a genuinely new photo should reach `--apply`, which uploads it once and
  caches it.
  `alreadyUploaded()` is unit-tested in `scripts/lib/page-images.test.mjs`
  (`npm run test:scripts`).
- **Correction:** the photo of children on the chancel steps around a woman
  reading WAS in the archive, filed under Youth as "Blessing of the backpacks
  gathering" (Wix alt "Kendall and kids blessing of backpacks 2025"). It is now on
  /visit.
- **Found, not investigated:** `npm run dev` fails in a fresh worktree after
  `npm ci`. Vite's dependency optimizer reports 346 `MISSING_EXPORT` errors from
  `node_modules/sanity/lib/presentation.js`, the first being `"FormRow" is not
exported by "node_modules/sanity/package.json"`. This pass verified in the
  deployed Studio instead.

---

## RichText Ledger and photo shapes landed (2026-09-22)

Branch `feat/richtext-ledger-photo-shapes`, ten tasks run as subagent-driven
development, merged to `main` 2026-09-22. Full account in
`docs/agent/changelog.md`'s 2026-09-22 entry; this is what it closes and what
it leaves open.

**Closed, from the per-section critique of the art-direction pass:**

- **Critique item 1, the RichText monoculture** (about 45 of 92 bands were the
  same heading-left, prose-right shape). `RichTextSection` now lays its body
  out from the body's own shape via `src/lib/rich-shape.ts`; all 29 rich-text
  bands on the site were checked branch by branch against the approved
  prototype and match.
- **Critique item 2, portrait crops.** Every ImageText photograph now takes
  its shape from its own aspect ratio and the page's photo budget
  (`src/lib/photo-shape.ts`), so a portrait-shaped original is never forced
  into a landscape frame.
- **Critique item 4a, the lede guard.** A one-paragraph intro ahead of an h3
  group now qualifies as a lede even when it is flowed on its own (the
  Ministries Adults band); `flow()` gained an `after` count so the guard sees
  the h3 groups that follow it.

**Open, found while landing the above (not fixed, no further work planned
on the Ledger branch):**

- **The pastors' letter reads as newspaper columns.** Its body has no signal
  in the Portable Text that marks it as a letter (no distinct style, no
  salutation block), so the classifier has nothing to key a "letter" layout
  on without a schema change.
- **The pledge gets plain rows, not the Ledger's hung-prefix treatment.** Its
  list items share no opening word the way the covenant's "To" items do, so
  `sharedPrefix` returns empty and it falls through to plain rows.
- **Short History sections (under about 100 words) sit in one column across
  the left half of the page**, rather than using the width available to
  them. The classifier's column rules are tuned for longer running text.
- **`/beliefs` and `/ministries` carry heavy hairline density.** Both pages
  stack several ruled/columned bands in a row; nothing in the Ledger branch reduced
  the rule count, only reshaped what sits inside each rule. (2026-09-24, the Beliefs
  identity pass: partly answered. The newspaper columns and their column rules are
  gone, the row shape lost its three rules, and a brand text band draws no divider on
  either side; /ministries keeps its h4 columns.)
- **The ground test cannot detect a crowded photo.** `assignPhotoShapes`
  budgets grounds by count and spacing, not by how busy the photograph itself
  is; catching a crowded ground would need a field an editor sets, which
  was not taken (rule 15: anything computable stays computed, and crowding
  is not computable from the data on hand).

**Other open items from the Ledger branch:**

- **(Handled in code, 2026-09-24, the History identity pass: the manifest alt
  now names George Saunders and lands when history.mjs is applied.) For Nathan,
  in the Studio: fix the `/history` "Saunders to the co-pastors" photo's alt text.** It says "the congregation in the 1990s",
  but the picture is a head-and-shoulders portrait of George Saunders, and
  since this pass the alt prints as the visible caption, so the wrong
  description now sits in plain view under his portrait. A content edit, no
  code. (Also in the vault as a `#nathan` item.)
- **Content, found while placing photographs (for the photo pass, not the
  Ledger branch):**
  - The "Postwar to Mattox" ground is a phone photograph of a framed print;
    the frame's dark edges show at both sides of the full-bleed band.
  - `/contact`'s window sits on the left because the seeded data says
    `imageSide: 'left'` (`scripts/pages/contact.mjs:264`); the prototype's
    own table said "right", but that came from a hard-coded map, not the
    data. A one-field content edit if Nathan wants the window on the right.
- **(Superseded 2026-09-24 by the mobile speed pass above.) Mobile LCP on `/` is 3239 ms, +0.2 s over `main`'s 3017 ms**, likely the
  larger inline stylesheet (122.5 KB to 133.9 KB). Both are inside the
  4500 ms gate and past the 2000 ms spec target. Owed together with the
  hero-photo delivery decision already open below (art-direction pass,
  "A production Lighthouse re-measure is owed").
- **`npx lhci autorun` cannot run locally on this Windows machine** (EPERM on
  the chrome-launcher temp profile, the same issue the 2026-09-20 note
  records). CI's Linux run is the one that exercises `lighthouserc.json`'s
  asserts; Lighthouse numbers here were measured by hand against
  `wrangler dev` instead (see the changelog entry).
- **Parked minors, deferred during the branch, none touching live content:**
  `splitBlockText` assumes a single trailing stega run, with no guard for one
  sitting mid-span; `sharedPrefix` joins cleaned words with single spaces
  while `splitBlockText` indexes the raw span, so a double or leading space
  in a shared prefix would mis-split; of the Task 6 ground-budget edge cases,
  "never two consecutive grounds" IS tested (`photo-shape.test.ts`, "ground
  budget: a second ground only four rows later..."), and what stays untested
  is the page-length floor (a 5-row page, where a second ground 4 rows later
  must still be refused) and a hero that is not first in `rows`; `wideRun`
  treats two consecutive label-shaped paragraphs as a labelled row rather
  than a description, faithful to the prototype but untested.
- **Resolved in the final whole-branch review (2026-09-22):** Heading (h2),
  Quote (blockquote) and Numbered lists, all offered by `proseBody`, used to
  fall to unstyled defaults or lose their order in the Ledger; they now
  render as a section head, a `quote` piece on a gold rule, and an ordered
  list. A body with h4 and no h3 now promotes its h4s to h3, so it no longer
  skips a level under the band's h2. A `legend` band whose names are gone
  after the lede now falls back to `row`. The ground band's literal colours
  now carry a comment naming them a deliberate dark pin.
- **`richTextSection`'s `align` field is now inert.** The Ledger ignores it
  (the heading always sits at the page's one left edge, CLAUDE.md rule 17),
  and `RichTextSection.astro` says so in a comment, but the Studio still
  offers it with no hint. Saying so in the field's schema `description` is a
  schema change and needs Nathan's OK; hiding or removing the field needs
  the same, plus the rule 1 "Remove field" care.
- **The ground's text could clip a long lede at 320px.** `.ph-ground-fig` has
  a fixed `clamp()` height and `.ph-ground-text` is absolutely positioned at
  its foot, so text taller than the band is cut off by `overflow: hidden`.
  The longest live ground text is 21 words and fits. Fix later with a
  `min-height` in place of the height and the text in normal flow.
- **Captions (optional, predates this pass).** The ground's caption is a
  `<p>`, not a `<figcaption>`, and every photo shape repeats the alt text as
  its visible caption, so a screen reader hears the description twice.
- **Photo library.** `feat/photo-library` gap-filled the photographs the Wix
  capture missed (77 new originals, listed in
  `scripts/data/gapfill-2026-09-22.json`, with `scripts/data/binary-manifest.json`
  updated); those two data files merged to `main` on 2026-09-22 (via
  `integrate/2026-09-23`). Still open: uploading the whole church photo
  library to Sanity with media tags, and placing the new photographs into
  pages, including the wedding page's building shots Nathan asked to reuse.
- **Children's photos: resolved, not open.** Nathan, 2026-09-22: every child
  photograph in use on the new site (the home hero, the ministries band, and
  any others the photo library adds) was already live and public on the
  church's old Wix site, so the church has already approved their use.
  `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` is updated
  to record this rather than carry it as an open question.

---

## Journal polish landed (2026-09-22)

Branch `feat/journal-polish`: Nathan picked P2 Bulletin (post page) and I1 Register
(blog index and archives) from `docs/superpowers/prototypes/2026-09-22-journal/`,
whose `audit.md` and Rules drawer are the spec. Zero schema changes, no dataset
writes. What it leaves open:

- **The "This Sunday" door on /blog has never rendered with real data.** It shows
  only while the newest sermon preview's Sunday is still ahead, and the newest
  preview is dated January 6, 2026, so every build shows the "Latest" door. The
  swap script is tested in isolation; the first real proof is the church's next
  preview.
- **One excerpt keeps an em-dash, by Nathan's decision (2026-09-22).**
  `the-road-not-taken` quotes Robert Frost ("and I—I took the one less
  traveled by"); Nathan ruled the poem keeps its punctuation, a deliberate
  exception to rule 2, so it renders on /blog/page/2 and the Ruminations
  archive. `EXCERPT_EXEMPT` in `scripts/fix-journal-gaps.mjs` records it. The
  rest of that script's plan was applied the same day (backup in
  `scripts/data/backups/journalEntry-2026-09-22-journal-gaps.json`): 12
  uncategorised previews now carry Sermon Preview, the podcast announcement
  carries Church Resources, and the other excerpt dash became a comma
  (declared on the approval note).
- The two event tables are now real tables at RENDER time (`src/lib/post-body.ts`
  reads the middot lists), which closes the reader-facing half of the "Post
  bodies" note below. A `table` block on `journalEntry.body` is still the proper
  editor-facing fix.

---

## Art-direction pass landed (2026-09-21)

Branch `feat/art-direction`, thirteen tasks run as subagent-driven development,
merged to `main` at `183a61f` and deployed. Full account of what changed is in
`docs/agent/changelog.md`'s 2026-09-21 entry; this is what it leaves open.

- **A real reflow-gate regression was found and fixed AFTER the merge, not
  before it.** The branch's own closing gates were never run (the session ran
  out of budget mid-Task-13 and Nathan finished the merge himself); the first
  post-merge CI run on `main` caught it: `StaffGrid.astro`'s email links sat
  in a `grid-cols-2` card and overflowed their column by up to 12px at the
  320px reflow gate on `/staff`, `/ministries` and `/who-we-are`. Root cause:
  `overflow-wrap: break-word` (Tailwind's `break-words`) does not reduce a
  shrink-to-fit `inline-block` element's own intrinsic width, so an email
  address with no spaces to break on rendered at its full unbroken width
  regardless of its grid track being correctly held to 128px. Fixed with
  `max-w-full` alongside `break-words`; the general lesson is CLAUDE.md rule 18. Committed directly to `main` (no branch) since the bug shipped there;
  `npm run test:unit` (588 tests) and the full `reflow.spec.ts` suite both
  green after the fix except the item below.
- **A second, much smaller reflow-gate finding, also fixed.** `/visit`,
  `/ministries` and (on CI's Linux font rendering only) `/who-we-are` reported
  `scrollWidth` 1-2px over `clientWidth` at 320px, unrelated to the StaffGrid
  bug above (present before that fix too, and `/visit` doesn't render
  `StaffGrid` at all). Walking every element's `getBoundingClientRect()` found
  nothing whose right edge actually exceeded 320px, which ruled out ordinary
  content overflow; bisecting the DOM by hiding each of `/visit`'s top-level
  sections in turn isolated it to `FaqBand.astro`'s open first `<details>`
  item specifically (the "Questions" band every interior page shares), and
  removing that one section alone dropped `scrollWidth` back to exactly 320.
  The exact internal mechanism was not fully pinned down (neither the rotating
  "+" icon's transform nor any single descendant's paint rect explains a 2px
  document-level overflow with no element visibly over the edge), which
  smells like a Chromium `<details>`/`<summary>` layout quirk rather than a
  CSS mistake in this codebase. Fixed defensively at the located source
  regardless: `min-w-0 overflow-x-clip` on the answer column
  (`FaqBand.astro`), which is correct on its own terms (that div is a
  `grid-cols-12` item and had neither). Verified: `reflow.spec.ts` is
  68/68 (four widths across every route it covers), parity recaptured and
  re-proven at a fixpoint after the change, full unit suite (588) and full
  Playwright suite (171) green.
- **Desktop horizontal overflow on 11 of 13 routes, found by Nathan by eye,
  fixed 2026-09-22.** The `.bleed-*` photographs used `100vw`, which includes
  the scrollbar, so on any desktop browser they overshot the edge by 7-8px at
  1440px. Every gate passed because Playwright hides scrollbars. Fixed with
  `container-type: inline-size` on `#main` and `100cqw`; the reflow suite now
  also runs in a `chromium-scrollbars` project. The hero h1's size floor came
  down to 2.35rem in the same change (Castoro Titling capitals ran past the
  column on a 320px phone). CLAUDE.md rule 19.
- **The `.superpowers/sdd/2026-09-20-fbcm-art-direction/` ledger no longer
  exists.** It was git-ignored scratch inside the `fbcm-art-direction`
  worktree; the worktree was removed as part of this closing pass (clean per
  `git status`, which doesn't surface ignored files) without checking for it
  first. The actual work product, every commit and its message, is intact in
  `git log`; what's lost is the per-task review notes and controller-ruling
  prose that lived only in that ledger. Nothing to do about it now, but it's
  why this entry has to reconstruct the fix above from the CI log and the
  diff rather than pointing at a ledger entry.
- ~~**`scripts/lib/lib/render-og.mjs` still duplicates `scripts/lib/render-og.mjs`,
  and the two differ.**~~ Closed 2026-09-22 (`chore/cleanup`): the whole
  `scripts/lib/lib/` directory is gone. Nothing imported from it (the only
  import inside it was its own `sanity-lib.mjs` reaching its own
  `loadEnv.mjs`); the live copy is `scripts/lib/render-og.mjs`, imported by
  both `generate-og-*.mjs` scripts and rewritten by `apply-brand`. The
  lib/lib copy differed only in its brand-inputs block, which still held the
  starter's slate palette and Libre Baskerville, so it was a stale fork
  leftover; the other four files were byte-identical duplicates. Proof:
  `npm run og` wrote the same bytes before and after the delete (sha256
  `cf0dd25d...`), and `npm run sync-check` went from 93 same / 0 drifted to
  88 same / 0 drifted. (That `og` output differs from the committed
  `public/og-default.png` because the generator falls back to the CSS font
  stack, "No @fontsource display file found"; the committed PNG was left
  as it is.)
- ~~**The `/styleguide` visual-regression baseline is stale** (light and dark
  both failed in the first post-merge CI run, `expect(page).toHaveScreenshot`).~~
  Closed 2026-09-22 by `bda0dcb` "test: regenerate visual baselines", the
  `visual.yml` update run (github-actions, 18:00 UTC), which rewrote both
  `styleguide-light.png` and `styleguide-dark.png`. The next push-triggered
  Visual regression run, on `6f01bfa` at 18:22 UTC, passed, and that push
  also carried `5066b5d` (the bleed and `--text-h1` fix), so the baseline
  holds after it.
- **A production Lighthouse re-measure is owed**, same as plan 2c left open:
  the branch changed layout, fonts and motion on every page, and the last
  recorded Lighthouse numbers predate all of it.
- **Per-page rubric scoring against the design spec's own bar was deferred**
  to conserve the session's budget (Task 13 was trimmed after two dispatched
  subagents died on rate/spend limits mid-close-out). The spec is
  `docs/superpowers/specs/2026-09-20-fbcm-art-direction-design.md`; nobody has
  scored the shipped site against it page by page.
- **Everything plan 2c already left open and Nathan hasn't closed still
  stands**: the hero-photo delivery decision, `PUBLIC_CF_ANALYTICS_TOKEN` /
  `PUBLIC_GA_ID` before the domain moves, Search Console for the new host, the
  church's photo day (still four thumbnail-only staff portraits and no
  `mapImage` on Contact), the church's nine-item confirm list in
  `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`, and plan 3
  (the cutover). See "Plan 2c landed" just below for the full list; none of it
  changed in this pass.

---

## Plan 2c landed (2026-09-20)

Verification. Nothing on the site changed in plan 2c except one config line and
one runtime guard; the rest of the work was proving what plan 2b built, against
the deployed site rather than against `dist/`. What it closed is struck through
in the sections above. What it leaves open, and who owns each:

- ~~**Task 16, `@portabletext/block-tools`, still waits on Nathan's
  approval.**~~ Approved and done 2026-09-20. See the "Post bodies" note
  below.
- **The hero-photo delivery decision is Nathan's, and it is the last thing
  holding mobile performance down.** Mobile is 93 to 95 after Task 6's fix
  (95 on `/visit`, the target); home mobile LCP is about 2.8 s local and
  2.97 s on production against a 2.0 s target. Roughly 1.2 s of every mobile
  LCP is transfer time for one photograph from `cdn.sanity.io`. Three options:
  accept it, self-host the hero images at build time so they share the
  document's connection, or put Cloudflare Images in front. This is a
  build-pipeline change, not a tuning pass. Reasoning in
  `docs/superpowers/notes/2026-09-20-lighthouse.md` section 6; also a `#nathan`
  item in the vault.
- **`PUBLIC_CF_ANALYTICS_TOKEN`, and `PUBLIC_GA_ID` if the church had GA, must
  be set BEFORE the domain moves.** See "Waiting on a human" above.
- **Search Console for the new host**, verified before the move, with the old
  Wix property's numbers written down first so there is a before to compare
  against.
- **The church's photo day.** Four staff portraits are thumbnail-only (Jaden
  Johnson, Andy Heimlich, Sally Butler, Nina Oisten) and `mapImage` on Contact
  has no photograph at all.
- **The church's confirm list**, nine items, in
  `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` and summarised
  by name in `docs/superpowers/notes/2026-09-20-review-walkthrough.md`.
- **Plan 3, the cutover.** The plan, the dry output of `scripts/cutover.mjs`,
  the human prerequisites with an owner on each, and the after-the-move
  verification are all in
  `docs/superpowers/notes/2026-09-20-cutover-plan.md`. Two decisions in there
  are worth pulling out because they bite on the morning: the script adds no
  DNS records at all without `--zone-file`, which would take the church's mail
  with it, and the script's step 5 asserts that www redirects to the apex while
  `src/data/site.ts:26` and `astro.config.mjs:103` both make www canonical.
  Reconcile them before `--write`.
- **`npm run parity:compare` reports 162/162 PASS on this branch, but for the
  wrong reason, and the harness needs a real fix.** `scripts/.parity/*.html` is
  committed, so Tailwind scans it, so the baselines feed the next build's
  stylesheet and a recapture invalidates itself. Full diagnosis, with the two
  classes that prove it and the two-move fix in the order it has to happen, is
  "Known gaps" item 2 above. Read it before trusting a green compare here.
- **A production Lighthouse re-measure is owed once this branch merges and
  deploys.** Everything in sections 4 and 6 of the Lighthouse note is the local
  preview harness; section 7 names the six cells to re-run and the baseline to
  compare them against.
- **Recorded decision, not an open loop: every page now carries its own copy of
  the CSS.** `astro.config.mjs` inlines the site stylesheet (about 22 KB
  gzipped per page) so the first paint does not wait on a second round trip,
  which bought a measured 150 to 220 ms of FCP. The cost is that the sheet is
  no longer separately cacheable, so a reader moving between pages
  re-downloads it, and with 142 posts that is the case that pays for it least.
  Cold first paint from search is the number this site is judged on, so the
  trade was taken deliberately. It is reversible in one line
  (`build.inlineStylesheets: 'never'`), and the 131072-byte threshold that
  keeps the Studio's 165 KB sheet external wants re-measuring after any
  Tailwind or Sanity UI upgrade.

Upstream findings from the whole of plan 2 are collected, card-shaped, in
`docs/upstream/2026-09-20-starter-findings.md`. Nothing there is ported yet.

---

## Plan 2b landed (2026-09-20)

Eleven pages are live and composed from the page builder, every one of them
seeded by an idempotent module under `scripts/pages/` and screenshotted in both
themes at both viewports. What plan 2b deliberately leaves open:

- ~~Task 16 (`@portabletext/block-tools`) is skipped, not done.~~ Ran
  2026-09-20 on its own branch. See the "Post bodies" note below.
- Every sentence the new site adds to the church's own words, every edit to
  their text, and every `#nathan` fact that needs confirming is listed in
  `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`, regenerated
  by the seeder on every run. The `#nathan` items are mirrored in the vault
  (`_vault/clients/fbcm.md`), which is where they get worked through.
- ~~`journalEntry.featured` is stored on all 142 posts and read by nothing.~~
  Closed 2026-09-20 (plan 2c task 2). `scripts/retire-featured-flag.mjs` ran
  dry first and found 0 of 142 live documents actually carrying the key, so
  there was nothing to back up and nothing to delete; the field is gone from
  the schema, the ordering, the badge, the projections, the blog-derive type
  and the seed rows, and `npm run audit:studio` is clean.
- `getJournalEntryBySlug` still fetches `relatedPosts`; nothing renders it. A
  dead read on every post page, safe to delete in the final wave.
- Final-wave polish, all three cosmetic and none blocking: the anchor-under-
  sticky-header offset (see the measured note under "Plan 2 must do"), the
  split hero's top crop at 1280, and the long-quote type scale.
- Four staff portraits are thumbnail-only and `mapImage` on Contact has no
  photograph at all. Both wait on the church's photo day.
- Upstream findings for PORTS.md cards, on top of the seven already listed
  above: `scripts/audit-studio.mjs` parses shared constants out of the schema
  files (generally useful, currently only here); `playwright.config.ts`'s
  600-second `webServer` timeout; and the page-seeder pattern itself
  (`scripts/seed-pages.mjs` + `scripts/lib/page-copy.mjs` +
  `scripts/lib/page-images.mjs`) as a candidate port, since dry-by-default,
  backup-first, idempotent page composition is not FBCM-specific.

---

## Plan 2a landed (2026-09-19)

Identity tokens, eight church blocks, hero frames, the church header/footer, and
the secretary's Studio desk are done and gated (Task 11). What is deliberately
still open, all closing in plan 2b/2c:

- `npm run parity compare` is intentionally all-red: the header and footer
  changed on every page, so every baseline in `scripts/.parity/` differs. Do
  not recapture now; plan 2c recaptures once, after the eleven pages land.
- ~~`visual.yml`'s CI-stored `/styleguide` baseline is stale after Task 6's eight
  block fixtures.~~ Closed: refreshed on CI by `39ffca0` (2026-09-20), and
  again by `bda0dcb` (2026-09-22) after the art-direction pass.
- ~~`public/favicon.svg` is still the starter's roundel, not the church's mark.~~
  Closed 2026-09-20 (plan 2c task 1): the icon set is the tower from the
  church's own wordmark, on a navy plate, and `npm run favicon` regenerates
  every size from that one SVG.
- ~~The `@portabletext/block-tools` dependency plan 2b needs for a real
  Portable Text converter is not installed yet.~~ Installed 2026-09-20 at
  5.2.0, exact. See the "Post bodies" note below.
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
- ~~CI's `test` job red on the non-ASCII slug smoke test.~~ Resolved by Task 1
  (2026-09-19): `ci.yml` now carries `PUBLIC_SANITY_PROJECT_ID` and
  `PUBLIC_SANITY_DATASET` at job level, so the CI build has the 142 posts it
  was missing; the 404 was an empty build, not percent-encoding.

### Post bodies (task 16, 2026-09-20)

Converted 142 of 142 posts from the captured `bodyHtml`: 3,297 paragraph-only
blocks became 3,232 real ones, carrying 19 h2, 17 h3, 191 h4, 396 links, 438
list items, 88 blockquotes and 89 inline images, with 0 images missing from the
photo archive, one video embed (a Wix-hosted mp4, rendered as a link paragraph
because `videoEmbed` cannot play it) and two tables (event schedules, flattened
to one bullet per row, see below). All 142 live bodies are backed up verbatim
in `scripts/data/backups/journalEntry-bodies-2026-09-20.json`, and a second
`--apply` reports 142 unchanged.

- **Dashes: 153 rewritten, 0 em-dashes left.** CLAUDE.md rule 2 is absolute
  for Sanity content, so `convert-body.ts` turns a dash between two words into
  a comma and one space, drops one that opens a line or follows a quote that
  ended a sentence, and leaves a range like `Eph. 4:15-16` or `2003-2020`
  alone. `report.emDashes` means "em-dashes that survived" and must be 0.
- **Two posts' event tables are bullet lists, not tables.**
  `händel-s-messiah-sing-in-carols` (the Messiah programme) and
  `upcoming-events-at-fbc-muncie-march-3-easter-2026` (the Lent and Easter
  schedule) each held a real `<table>`; every cell is preserved, one bullet per
  row with the cells joined, because `journalEntry.body` has no table block and
  adding one inside an import would be a schema change nobody reviewed. **The
  proper fix is a `table` block on `journalEntry.body`**, plus a renderer for
  it and a converter branch; it is a small schema job, not a content one.
- **`@portabletext/block-tools` needs a DOM at import time, and uses jsdom
  transitively.** Node has no `DOMParser`, so `htmlToBlocks` takes a
  `parseHtml` function; the only DOM in this tree is the jsdom that arrives
  through `sanity`'s CLI, not as a dependency of ours. The converter takes
  `parseHtml` as an argument, so no library code imports a parser: the callers
  are the unit tests and the two import scripts, all import-time tooling that
  never ships to a browser or a Worker, and `src/types/jsdom.d.ts` declares the
  three lines we use rather than adding `@types/jsdom`. **Declaring `jsdom` as
  a devDependency would be a second new package and awaits Nathan's approval**
  (CLAUDE.md rule 8, and the block-tools approval covered one package). If npm
  ever stops hoisting it, `npm run test:unit` fails loudly.
- Five redirects were added from the restored in-body links, taking the set
  from 44 to 49: `/about-us` -> `/who-we-are`, `/team/james-heimlich` ->
  `/staff`, and `/blog/hashtags/{2,3,Barbenheimer}` -> `/blog`. They 404 on the
  deployed build until this branch merges and deploys; `verify-redirects` is
  49/49 OK against a local build.

- **Flaky test (2026-09-24): `tests/motion.spec.ts` "reduced motion > nothing on the home page is animating" on webkit-iphone.** Failed once in two full runs on different branches (the last-sunday branch and the footer merge), each time while other agents were building on the same machine; passes 5/5 alone (`--repeat-each=5`). The failure lists running animations on glyph paths, `img.graded` and `span.h-fit-in` under reduced motion, so a transition is likely being caught between the stylesheet applying and the reduced-motion rule winning on a slow WebKit start. Fix the test to wait for `document.getAnimations()` to settle (or `load` plus a frame) before asserting, or find the transition that starts before the media query applies. Do not delete the test: it guards rule "motion only under no-preference".

## YouTube feed (2026-09-26)

- [ ] #nathan **Add `YOUTUBE_API_KEY` as a GitHub Actions secret** (the same key the Worker's
      live check uses). YouTube's public feed began failing on 2026-09-25 (the channel form 404
      or 500 every try, the uploads-playlist form about two in five), and every build lost the
      hero's This Sunday line and the Last Sunday band. `scripts/fetch-youtube-feed.mjs` now runs
      before the build: the Data API first when the key is set, then both public feed addresses
      in four rounds, then the last good copy (restored by `deploy.yml`, used up to 8 days). Until
      the secret exists the deploy build relies on the public feed and that copy.

## Sanity bandwidth (2026-09-26)

- [ ] **Check the Sanity usage page on 2026-09-27 and 2026-09-28** (it updates daily);
      quotas reset 2026-10-01, and the project is on a Growth Trial (23 days left on 2026-09-26).
- [x] **Measured, from Sanity's request log for 2026-09-19..26 (74.5 GB, 1.67M requests).**
      It was our own tooling, not visitors or crawlers: - PDFs 27.7 GB (27.6 GB on the 25th): the Visitor cover step re-downloading all 39 issues
      on every cold cache (18 GitHub runners and cloud sessions, 11.2 GB; local and worktree
      builds, 6.4 GB; a Google-hosted client in ranged chunks, 9.8 GB, in the cloud session's
      hours). Fixed: the step downloads through the site's `/files/` (R2) first, Sanity last;
      R2 was pre-filled with every issue on 2026-09-26 (628 MB, once). - API CDN 24.9 GB, 17.6 GB of it the full blog list, read 35 times a build. Fixed: identical
      reads are memoised per build (`sanity.ts`); a build fell from 754 reads / 29.0 MB to 555
      reads / 3.8 MB. - Images 13.1 GB, 533k requests from browsers: mostly Playwright runs (home and CI).
      Still open, below. - Uncached API 8.9 GB, before the 2026-09-23 always-CDN fix.
      Visitors' PDF downloads are served from R2 at `/files/` too (src/pages/files/[name].ts).
- [x] Playwright's Sanity images come from a disk cache (`tests/fixtures.ts`, every spec imports
      `test` from it; CI restores `node_modules/.cache/test-images`). Measured 2026-09-26: a cold
      run fetched 206 images (7 MB) once; the next full run fetched 0.
- [x] `/styleguide/visitor` links `/files/` too (2026-09-26).
