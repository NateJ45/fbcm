# Upstream findings for ncs-astro-sanity-starter (FBCM, plans 2 and 2c)

Date: 2026-09-20. Written at the close of plan 2c, from the FBCM fork.

Each section below is card-shaped, in the form PORTS.md wants: what it is, the
bug that produced it, the canonical file as it exists here, and what has to be
adapted per site. Nothing here has been ported yet; this is the list a sync
session works through, and each one that lands gets a real PORTS.md card with a
matrix row in the same commit.

This is an internal document, so em-dashes are fine in it. What is not fine is
vagueness: a card whose "bug that produced it" is missing is a card nobody can
weigh, and the reason a technique exists is the part that decays fastest.

Ordering is roughly by how likely each one is to bite the next fork, not by
how interesting it is.

---

## 1. A section anchor an editor can set, resolved against collisions

**What it is.** An optional `anchor` slug field on every page-builder block,
read by `sectionAnchor(section, fallbackId)` in `src/lib/anchor.ts` (unit
tested in `src/lib/anchor.test.ts`), and applied by `SectionRenderer.astro`'s
`uniqueAnchor()` to the band wrapper's `id`.

**The bug that produced it.** Plan 1 imported 44 retired URLs from a Wix site,
and 16 of them pointed at a fragment (`/baptists` → `/beliefs#baptists`,
`/team/kendall-ellis` → `/staff#kendall-ellis`). Nothing in the starter lets an
editor put a stable id on a band, so every one of those redirects would have
landed at the top of the page and the visitor would have had to hunt. Two
further failure modes appeared while building it:

- The obvious fallback, reusing the heading's own `headingId` on the wrapper,
  puts two elements with the same id in the document and breaks the section
  landmark's `aria-labelledby`. axe catches it as `duplicate-id-aria`. The
  fallback here is `${headingId}-band`.
- Two editors typing the same anchor into two bands is not hypothetical on a
  long page. `uniqueAnchor()` keeps a `Set` per render and suffixes `-2`, `-3`
  rather than letting the browser silently pick the first.

**Canonical file here.** `src/lib/anchor.ts` (+ `anchor.test.ts`), `anchorField()` in `src/sanity/schemaTypes/_anchorField.ts`, and `SectionRenderer.astro` lines
105 to 127.

**What to adapt.** The field name is generic and the helper is pure, so both
port whole. `SectionRenderer.astro` is per-repo, so the `uniqueAnchor()` block
is a copy, not a sync. Note that `sectionAnchor()` is stega-safe on purpose
(it cleans before slugifying); a repo that skips that will get a fragment made
of invisible characters in the preview only.

---

## 2. `--header-offset`, and the settle gate the sticky header needs beneath it

**What it is.** One CSS token, `--header-offset` in `globals.css` (6.5rem
mobile, 12.5rem from the breakpoint that adds the utility row), consumed by
`scroll-mt-[var(--header-offset)]` on the band wrapper and the staff card. Plus
a two-frame settle gate on `BaseLayout.astro`'s hide-on-scroll listener.

**The bug that produced it.** Two bugs, and the second is the one worth
porting, because the first is obvious and the second is not.

1. Any sticky header eats the top of a fragment landing. The token fixes that
   and is ordinary.
2. The hide-on-scroll heuristic in `BaseLayout.astro` captures
   `lastY = window.scrollY` when it wires, and the script sits at the end of
   `<body>`, which runs BEFORE the browser performs its native fragment jump.
   So the jump itself reads as one huge instantaneous scroll down, the
   heuristic hides the header, and the anchor target lands under a header that
   is sliding away. The offset was already correct; the header's own visibility
   state was the bug. Measured: at 1280 the header's top was at -109.69 px on
   arrival. The fix is to keep the listener inert for two animation frames and
   re-baseline `lastY` at that point.

This is invisible to every existing test suite, because nothing in the family
asserts geometry on a fragment landing. `tests/anchors.spec.ts` here does: five
URLs times two projects plus a reduced-motion case, asserting the target's top
sits between the header's bottom and 64 px below it.

**Canonical file here.** `src/styles/globals.css` (the token, lines 541 to
557), `src/layouts/BaseLayout.astro` (the settle gate), `tests/anchors.spec.ts`.

**What to adapt.** The token VALUE is per-site (it is a measurement of that
site's header at two widths, and it must be re-measured, never copied). The
settle gate is general and belongs in the starter's `BaseLayout.astro`. The
test is general in shape and per-site in its URL list.

---

## 3. The page-seeder pattern

**What it is.** Page composition as idempotent, dry-by-default, per-page
modules: `scripts/seed-pages.mjs` as the runner, one module per page under
`scripts/pages/`, `scripts/lib/page-copy.mjs` for the copy helpers, and
`scripts/lib/page-images.mjs` for the image pipeline. The runner regenerates an
approval note listing every new sentence, every edit to the client's own text,
and every fact that needs confirming.

**The bug that produced it.** `seed-core.mjs` in the starter seeds a
service-business page set with `createOrReplace`. On a real content migration
that shape fails three ways at once:

- **It overwrites what an editor changed.** `createOrReplace` on a second run
  throws away a week of the client's own edits. The runner here builds the
  document, compares it to the live one, and prints `unchanged` when they
  match, so a re-run after an editor's work is a no-op rather than a loss.
  That only works because `page-copy.mjs` numbers `_key`s from an explicit
  prefix, so building the same page twice is byte-identical.
- **It seeds from memory.** `fromCapture()` reads the client's own words out of
  the captured source file between two anchor phrases and THROWS when a phrase
  is not found. A seeder that silently produced an empty band would be the
  worst outcome, because nobody reviews a band that is not there.
- **It has no record of what was invented.** Every sentence a new site adds to
  a client's words is a sentence somebody has to approve. The approval note is
  generated by the seeder on every run, so it cannot drift from what was
  actually seeded: `newCopy()`, `edits()` and `confirm()` are declared inline in
  each page module next to the copy they describe.

`page-images.mjs` carries its own small win: resize once, upload once, cache
both by archive-relative path, and support a `{ "same": "<key>" }` alias so a
photo reused on four pages uploads once while each page keeps its own alt text.

**Canonical file here.** `scripts/seed-pages.mjs`, `scripts/lib/page-copy.mjs`
(+ its test), `scripts/lib/page-images.mjs`, `scripts/pages/*.mjs`.

**What to adapt.** The two lib files and the runner are general. The page
modules are entirely per-site, and that is the point: they are the site's
content, written as code. A fork with no capture to seed from uses the same
helpers with literal strings and loses only `fromCapture()`'s throw.

---

## 4. `audit-studio.mjs` cannot see a shared field constant

**What it is.** `sharedFieldConsts(src)` in `scripts/audit-studio.mjs`: a
regex pass that finds `const eyebrow = defineField({ name: 'eyebrow', ... })`
at module level in a schema file and maps identifier to field name, so
`fieldNames()` counts a field spread into a type by bare identifier.

**The bug that produced it.** The parser slices a schema file by
`defineType(` and reads `name:` literals inside each slice. A shared const is
declared OUTSIDE every slice, so every type spreading it looked as though it
never declared that field, and check 3 reported every document storing it as a
stored key the schema does not declare, which is exactly the condition that
puts the "Remove field" button in front of an editor. A false positive on that
check is worse than no check at all: CLAUDE.md rule 1 says never to press that
button, and an audit that cries wolf teaches people to press it anyway.

**Canonical file here.** `scripts/audit-studio.mjs` lines 138 to 178. Already
PORTABLE, so this is a starter edit plus a sync, not a port.

**What to adapt.** Nothing. It is a general parser improvement and it is a
no-op on a schema set that uses no shared consts.

---

## 5. `playwright.config.ts`: the 600 second webServer timeout, and the testMatch list

**What it is.** Two edits to a PORTABLE file: `webServer.timeout` raised from
180,000 to `600_000`, and `anchors` added to the `webkit-iphone` project's
`testMatch` regex.

**The bug that produced it.** The 180 second budget is the BUILD, not the
serve. This site builds 377 pages in about three minutes, so `npm test` timed
out before a single spec ran. Locally you can dodge it by building first and
letting `reuseExistingServer` find the static server; CI sets
`reuseExistingServer: false` and has no dodge. Any family member that grows
past roughly 250 pages hits this, so it is general, and the fix is one number.

The `testMatch` edit is a different kind of finding: the mobile project's regex
was an explicit allow-list (`smoke|a11y|a11y-dark`), so a new spec file added
to the repo silently runs on desktop only. The anchor suite is exactly the
suite that most needs the mobile project, since the mobile header is a
different height.

**Canonical file here.** `playwright.config.ts`, lines 58 and 67.

**What to adapt.** The timeout is general, take it whole. The `anchors` entry
is FBCM-specific today (the starter has no anchor suite), so either port it
with card 1 above or leave the regex alone. The deeper point is worth a line in
the card either way: an allow-list `testMatch` fails silently when the repo
grows a spec, and the failure is a suite that never runs.

---

## 6. `page-parity.mjs --exclude`, with the glob matcher split out

**What it is.** `--exclude <globs>` and its `PARITY_EXCLUDE` env twin on both
`capture` and `compare`, with the matcher in `scripts/lib/parity-glob.mjs` and
five unit tests. Plus `npm run parity:capture` / `npm run parity:compare`
wrapper scripts with this repo's exclusion baked in
(`blog/page/**,blog/tag/**,blog/category/**/page/**`).

**The bug that produced it.** 142 posts and five categories generate hundreds
of near-identical archive pages. Capturing them all took the baseline set from
148 files to something far larger and, worse, meant a real one-line diff in a
template would arrive buried in hundreds of copies of the same DIFF line. A
harness whose output nobody can read is a harness nobody runs. With the
exclusion the baseline is 162 files and 12 MB, one per template plus every
distinct post and category page, and `compare` is 162/162 PASS.

**Canonical file here.** `scripts/page-parity.mjs` (PORTABLE, documented in its
header comment), `scripts/lib/parity-glob.mjs` + `parity-glob.test.mjs`.

**What to adapt.** The mechanism is general and the default is no exclusion, so
it changes nothing for a repo that does not pass the flag. The glob LIST is
per-site and belongs in that repo's npm scripts, never in the marked file.
Likely next case in the family: presacademy's events archive.

---

## 6a. The parity baselines feed Tailwind, so a capture invalidates itself

**Fixed 2026-09-20, plan 2c fix wave.**

**What it is.** A loop between two things the starter ships and nobody had put
side by side: `scripts/.parity/*.html` is COMMITTED (that is the whole point of
a baseline), so it is not gitignored, so Tailwind v4's automatic source
detection scans those files and generates a utility for every class it finds in
them. The captured HTML is therefore a SOURCE for the next build's stylesheet.

**The bug that produced it.** On the FBCM tree, `npm run parity:compare` went
from 162/162 PASS at the recapture to 1/162 PASS on the very next build, with
the only diff on every failing page being the stylesheet's own byte count and
hash: `- CSS 124630B 6f2f68b8` against `+ CSS 124529B efd6192e`, markup
byte-identical.

The proof, because "probably Tailwind" is not a diagnosis. Two stale utility
classes appeared in the pre-plan-2a baselines, appeared in the post-recapture
baselines nowhere, appeared in no file under `src/` at all, and were absent
from the current stylesheet. The two rules they generated came to about 100
bytes, against a measured delta of 101. The capture recorded a stylesheet built
from the OLD baselines; the first rebuild after it legitimately produced a
smaller one. Confirmed deterministic across two builds, and confirmed not to be
the session's own new Markdown (moving three new notes out of the tree changed
nothing).

Two things kept this hidden until now, and both are worth the card:

- A baseline set that is intentionally red during a redesign is never rebuilt
  against while green, so the loop has nowhere to show itself.
- Inlining the stylesheet (card 7 below) moves its byte count INSIDE the
  compared markup. With an external sheet the harness compares a normalized
  link and the drift is invisible, which is worse, not better: the baselines
  were already unstable, and nothing said so.

**And the loop then closed on the diagnosis itself, briefly.** Naming those two
stale utility classes in `docs/PENDING.md` and in an earlier draft of this file
put them back into Tailwind's scan, because Markdown is scanned too. The next
build regenerated exactly those two rules, the stylesheet went back to its
leaked size, and the compare returned 162/162 PASS: green because a note
mentioned two utilities, not because the render was proven correct. That
demonstration is worth keeping as the cheapest possible proof that the
harness's inputs and its outputs are the same files, which is why this card
still describes it, just without repeating the class names.

**The fix.** `@source not "../../scripts/.parity";` right after the Tailwind
import in `src/styles/globals.css`, excluding the baselines from Tailwind's
source scan. Verified with a fixpoint measurement of the largest inline
`<style>` block on `/`: a build made immediately after adding the exclusion
(with the pre-fix baselines still on disk) measured 125,406 bytes; the
baselines were then recaptured under the exclusion and a second build measured
the identical 125,406 bytes. A capture made under the exclusion cannot feed
classes back into the scan, so that identical number is the proof the loop is
cut, not just quiet this once. `npm run parity:compare` is 162/162 PASS on the
recaptured set, for the right reason.

**The scope was bigger than one directory (found later the same session).**
This card's own draft named the two leaking classes in prose, which put them
back into Tailwind's scan the moment the card was written, since Markdown is
scanned too, and the compare went green again for the wrong reason before it
was caught. Removing the class names from this card and from `docs/PENDING.md`
dropped the sheet again, to 125,305 bytes, requiring one more
capture-rebuild-compare pass to reach a real fixpoint. That, in turn, exposed
the actual size of the problem: `CLAUDE.md`, `PORTS.md`, `OPERATIONS.md`,
`README.md` and every file under `docs/` are tracked, non-gitignored, and name
dozens of utility classes as documentation examples, because a technical doc
about a Tailwind codebase is written in that vocabulary. Two more exclusions
next to the first: `@source not "../../docs";` for the docs tree, and
`@source not "../../*.md";` for the four root Markdown files, confirmed to
accept a glob on `tailwindcss` 4.3.3 (the build succeeds and the byte count
moves, which is stronger proof than a successful parse). `.superpowers/` was
deliberately left off the list: it is already fully gitignored, so Tailwind's
default gitignore-based skipping already excludes it. Measured: 125,305 to
119,411 bytes on the first build under the new exclusions, confirmed identical
on 119,411 bytes after a third `parity:capture` + rebuild, `parity:compare`
162/162 PASS. Three narrowing fixpoints in one session: baselines alone
(125,406B), plus prose class names (125,305B), plus the rest of the repo's own
Markdown (119,411B).

**Canonical file here.** `scripts/page-parity.mjs` is PORTABLE and this affects
every repo in the family that commits a `scripts/.parity` directory, which is
all of them. The `docs`/`*.md` exclusions are equally general: every repo in
the family ships a `CLAUDE.md` and a `docs/` tree written in the same
class-naming vocabulary, so the same two lines belong in every sibling's
`globals.css`, with the glob adjusted only if a repo's root Markdown file list
differs.

**What to adapt.** The fix is two moves and the ORDER matters. First keep the
baselines out of Tailwind's source scan (`@source not` in the repo's
`globals.css`, or have the harness write somewhere Tailwind ignores, which is
the better home for it since it fixes every repo at once). Then recapture, then
rebuild and compare a second time to prove the set has reached a fixpoint. A
recapture on its own goes green once and drifts the next time a class stops
being used, which is exactly the failure that teaches a team to ignore the
tool.

---

## 7. Inlining the site stylesheet without inlining the Studio's, or the fonts

**What it is.** `build.inlineStylesheets: 'auto'` plus a FUNCTION-form
`vite.build.assetsInlineLimit` in `astro.config.mjs`:

```js
assetsInlineLimit: (filePath, content) => {
  if (/\.(woff2?|ttf|otf|eot)$/i.test(filePath)) return false;
  return content.length < 131072;
};
```

**The bug that produced it.** Two, in sequence.

1. `inlineStylesheets: 'always'` removes the one render-blocking request and
   buys 150 to 220 ms of FCP, measured. It also inlines the Studio's 165 KB
   `@sanity/ui` sheet into `/studio`, which nothing had verified at React
   mount.
2. The obvious correction, `'auto'` with a plain-number
   `assetsInlineLimit: 131072`, is worse than doing nothing.
   `assetsInlineLimit` is ALSO Vite's general asset threshold, so it
   base64-inlined every `@font-face url()` the sheet pulls from `@fontsource`
   (largest font 85,068 bytes, under the limit). That grew the candidate
   stylesheet to 671,042 bytes, which is OVER the limit, so Astro's own auto
   check then declined to inline it: a linked stylesheet six times its original
   size, and every font gone from `dist/client/_astro` as a separate file.
   Caught only by re-running `find dist/client/_astro -name "*.woff2"` and
   getting zero results.

The proof set that a fork should re-run after any Tailwind or Sanity UI bump:
`grep -c "<style" dist/client/index.html` (2), `rel="stylesheet"` count on
`index.html` (0) and on `studio/index.html` (1), and the woff2 count (11,
unchanged).

**Canonical file here.** `astro.config.mjs` (not PORTABLE; per-repo by
design).

**What to adapt.** The 131072 threshold is a MEASUREMENT of two specific files
and must be re-measured per repo with a temporary
`inlineStylesheets: 'never'` build. The font exclusion is general. Record the
trade-off in that repo's PENDING: the sheet is no longer separately cacheable,
so every page carries its own copy (~22 KB gzipped here) and a reader moving
between pages re-downloads it. Cold first paint from search wins that trade for
a content site; it would not for an app.

---

## 8. CI and Lighthouse workflows need the public Sanity ids at job level

**What it is.** `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` declared
at the job's `env:` in `.github/workflows/ci.yml` (three jobs) and
`lighthouse.yml`.

**The bug that produced it.** Without them the CI build is a fresh-clone build:
`sanityFetch` returns its fallback for every query and the site builds green
with zero content. What that looked like was a single failing smoke test on a
non-ASCII slug, which sent the investigation towards percent-encoding for
hours. The 404 was an empty build, not an encoding bug. The general lesson is
sharper than the fix: the graceful fallback that makes a fresh clone build is
the same mechanism that makes an unconfigured CI build LOOK fine, and the only
symptom is whichever test happens to touch a page that needs data.

**Canonical file here.** `.github/workflows/ci.yml` and `lighthouse.yml`, both
deliberately NOT marked PORTABLE (PORTS.md card 35).

**What to adapt.** Since the files are unmarked, this ports as a documented
step in `docs/bootstrap/NEW-PROJECT.md` rather than as a file sync. Worth
considering a louder signal too: a build that fetched zero documents while a
project id WAS configured should probably say so.

---

## 9. `CtaLink`: weak internal references, relative external URLs, and a `link` variant

**What it is.** Three related changes to `src/components/CtaLink.astro`.

**The bug that produced it.**

- **A Sanity reference cannot express a fragment or a route that is not a
  document.** `/history#building` and `/blog` are both real internal
  destinations with no document to reference. They therefore ride in on
  `externalUrl`, and the starter's `newTab` default (`?? isExternal`) then
  opened a SAME-SITE link in a second tab. The fix is to honour an explicit
  `openInNewTab: false` even on an external link, and to fall back to the old
  default only when the value is unset, so nothing an editor wrote before the
  change moves.
- **A row of four buttons in a card grid is four buttons shouting at once.**
  The `link` variant is a plain text link with the shared `nav-underline`
  hover, added specifically so that a component needing a text link does not
  re-implement `resolveHref()`. That second copy is the one that forgets
  `/post/<slug>`.
- **Two button families on one page read as unfinished** (CLAUDE.md rule 17).
  `primary` and `secondary` survive here as ALIASES resolving to `gold` and
  `outline` in one expression, rather than being deleted. Every existing caller
  keeps compiling and picks up the new look for free, and `onDark` keeps
  working through the alias.

**Canonical file here.** `src/components/CtaLink.astro`.

**What to adapt.** The `newTab` rule and the alias pattern are general. The
variant NAMES and their colours are per-site. The alias pattern is the piece
most worth generalising: it is how a starter retires a look without breaking
forks.

---

## 10. `hoursSection` and `linkCardsSection` as church-family blocks

**What it is.** Two of the ten blocks in
`src/sanity/schemaTypes/churchSections.ts`: an hours band (service time, office
hours, pastoral hours, all read from one place) and a link-cards band (a small
grid of cards each ending in a text link).

**The bug that produced it.** Not a bug so much as a repetition. Office hours
appeared on three pages of the old Wix site and disagreed with itself on two of
them, which is CLAUDE.md rule 15 in the wild: a value typed twice is a value
that goes stale. The hours band reads `siteSettings` and cannot disagree with
itself. The link-cards band exists because "three doors into the rest of the
site" turned out to be the shape four separate pages wanted, and each of them
had been drawing its own.

**Canonical file here.** `src/sanity/schemaTypes/churchSections.ts` and the
matching components under `src/components/sections/`.

**What to adapt.** These are candidates for a church-family starter rather than
for the general one, and they should carry scaffold markers from the first
commit if they land (CLAUDE.md rule 14). Both need the `sectionCadence` entry
and a `section-fields.ts` registry line, or the drift gate fails, which is the
gate working as intended.

---

## 11. `groupDocsByYear`, and derived grouping in a document list

**What it is.** `sortDocsByYearDesc()` and `groupDocsByYear()` in
`src/lib/church-derive.ts`, used by `DocumentList.astro`: when the sorted list
spans two or more distinct years it renders year headings; when it does not, it
returns a single ungrouped entry and the component draws a plain list.

**The bug that produced it.** The church's newsletter archive was a Wix widget
whose year headings did not survive the capture, so the year had to be derived
from each PDF's own creation date. Once derived, hard-coding "group by year"
would have put a lone "2026" heading above a three-item list on every other
document list in the site. Deriving the GROUPING as well as the value, from
whether the data actually spans years, is the generalisable half.

**Canonical file here.** `src/lib/church-derive.ts` (+ its test),
`src/components/sections/DocumentList.astro`.

**What to adapt.** The two functions are pure and general. The rest of
`church-derive.ts` is not; split before porting.

---

## 12. Two gotchas that belong in the vault, not in a file

Both are already written up in the studio vault and are referenced here by name
so the port card can link them rather than restate them:

- `double-hyphen-in-svg-comment-blanks-the-image`
- `fullpage-screenshot-skips-scroll-reveal`

The first cost a blank favicon on a build that passed every gate. The second is
the one to read before trusting any screenshot in this repo's own docs: a
full-page capture can outrun the scroll-reveal observer, so a band that is
present and correct photographs as empty space. Both are cross-repo by nature,
which is why they live in `_vault/gotchas/` with an applies-to list rather than
in any one repo's CLAUDE.md.

---

## 13. `verify-redirects.mjs`

**What it is.** `scripts/verify-redirects.mjs`, wired as
`npm run verify:redirects`. Reads the `redirect` documents straight from Sanity
(or `dist/client/_redirects` with `--from-dist`), curls each rule against a
live origin, and reports the status, the `Location`, the status of the TARGET,
and OK or not, one row per rule, with a count at the foot.

**The bug that produced it.** A redirect table is exactly the kind of thing
that is verified once by hand, at the end of a migration, and never again. Two
specific traps it closes: a rule whose redirect works while its target 404s
(which is what "all redirects pass" usually means when someone checks by hand),
and this repo's six category rules that 301 to `/blog?category=<slug>`, a URL
that answers 200 and then forwards again in script to the real archive page.
`--follow-script` follows that second hop, so those rules report the page a
visitor actually lands on rather than the 200 that hides it.

Astro plus Cloudflare emit both a trailing-slash and a bare line per rule, so
`--from-dist` sees 87 or 88 lines for 44 rules and collapses them back on the
bare form. A naive line count is a wrong count.

**Canonical file here.** `scripts/verify-redirects.mjs`.

**What to adapt.** The script is general. The `--follow-script` hop is general
too but only matters to a site that has one. Every fork replacing an existing
site should run this against the deployed origin BEFORE and after the domain
moves; it is in this repo's `OPERATIONS.md` pre-launch list for that reason.

---

## 14. The `retire-*.mjs` shape

**What it is.** Three scripts written to the same shape this year:
`scripts/retire-featured-flag.mjs`, `scripts/retire-contact-page.mjs`,
`scripts/retire-sitesettings-fields.mjs`. Each one: writes every affected
document verbatim to a committed JSON backup BEFORE deleting anything, guards
each delete on the exact condition that justifies it, and carries a dry run
that prints the whole plan and writes nothing.

**The bug that produced it.** CLAUDE.md rule 16, learned on Stone Steps, where
five race records for marks that matched no result on file sat on a board
because somebody had typed them. The shape is the cheap part: write the backup
step first and the dry run falls out of it.

Worth recording from `retire-featured-flag.mjs` specifically: the honest
outcome of a backup-first script can be that it backs up nothing.
`journalEntry.featured` was declared in the schema and read by nothing, and 0
of 142 live documents actually carried the key, so the script found nothing to
back up and deleted nothing. That is the script working, and a script that had
gone straight to `unset` would have reported the same silence with none of the
evidence.

**Canonical file here.** The three scripts, none of them PORTABLE (they are
each about one field on one site).

**What to adapt.** Port the SHAPE, not the files. The starter's own
contribution would be a documented template plus the rule already in
CLAUDE.md, and `scripts/cutover.mjs` is the same discipline with the safer
default: dry BY DEFAULT, with `--write` as the only thing that lets it act.
