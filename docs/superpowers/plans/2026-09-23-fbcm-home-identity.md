# Home Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home page body below the hero in the settled identity language (prototype `docs/superpowers/prototypes/2026-09-23-home/home.html`), restyling the shared sections it uses so Visit, Contact, History and Give inherit the new looks.

**Architecture:** No new section types. Five existing sections are restyled and three gain optional fields: `sundayTimesSection` becomes the "What to Expect" hymn board, `linkCardsSection` cards gain a building `glyph` (the four goals as the home page's ways in), `heritageBandSection` gains a dated list ending in a present-day entry and a second (archive) photo, `dynamicListSection` (journal source) draws rows with each post's featured image in a small arch, and `giveBandSection` becomes the gold band with the basin glyph. The hero is kept exactly as it is today (Nathan, 2026-09-23), with only its buttons moved to the `rule` variant. `scripts/pages/home.mjs` composes the page; `--apply` runs only after the code is deployed (CLAUDE.md rule 1).

**Tech Stack:** Astro 7, Sanity v6 (embedded Studio), Tailwind 4 tokens, node --test, Playwright, Cloudflare Workers.

**Spec:** `docs/superpowers/plans/2026-09-23-fbcm-identity-rollout.md` (the rules), the prototype above (the look), and these decisions from Nathan on 2026-09-23 that override the prototype:
1. Keep the current home hero (full-width tower slideshow, "PRAISE AND PROCLAIM.", the Sunday, address and online facts).
2. Blog rows use each post's featured image, never author portraits.
3. The history list ends with what the church is doing now: a present-day entry whose year is the build year (derived, rule 15), in the church's own words where they exist; any new sentence goes on the approval list.
4. From the review of the prototype: "10:45 am" in lower case as elsewhere; goal photos not reused from Who We Are; the archive photo larger; no captions anywhere; brand colours only (indigo `#292854`, indigo-dark `#1C1B3A`, gold `#D59B29`, brown `#39251E`, brown-mid `#724F43`, taupe `#B5ABA3`, cream `#F4EFE6`); the Praise & Proclaim mark is not added to the page (the hero already says it).
5. No boxed card floating on the cream page (Nathan: the hymn-board card "feels out of place in a white void"). A board, a drawing or a list sits directly on a full-width colour band, never in a framed box with a shadow on cream. So What to Expect is a full brown band with the times set straight onto it (gold numerals, hairline rules, the photos on the band), and the Hannaford rendering in Our Building sits on the page without a card frame or shadow (blended into the paper, as prototype A did). Keep the band rhythm alternating and never two near-identical grounds touching: hero indigo, What to Expect brown, Our Goals indigo-dark, Our Building cream, Church Blog a soft ground (`bg-soft` or taupe), Give gold.

## Global Constraints

- Worktree on branch `feat/home-identity` cut from current `main`. Do not push; the controller merges, and the push to main is the deploy.
- The matched version set (CLAUDE.md rule 8). **No new dependencies.**
- No em-dashes in public-facing copy (rule 2). No AI-tell vocabulary. The church's words edited for the web, not rewritten; new sentences listed in `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`.
- Every UI change checked light AND dark, at 375 and 1280/1440 with a real scrollbar, and at 320 with `scrollWidth === clientWidth` (rules 3, 18, 19). **Visit, Contact, History and Give use the restyled sections too: shoot them as well.**
- No colour, tone, surface, background or accent field on any block (rule 9).
- Every new logic-driving dropdown field in `NON_STEGA_FIELDS` (rule 8b; `glyph` is already there by name). Never measure or compare a stega string.
- Every schema change: `npm run typegen`, and the new fields carry `scaffold: church` markers where the block is a church block (rule 14).
- Stylesheet inline check after every CSS task (rule 20): 0 `<link rel="stylesheet"` and at least one `<style>` in `dist/client/index.html`; report the sheet bytes (limit 147,456 B; currently ~119.7 KB).
- Motion only through `[data-reveal]` / `.is-visible`, zeroed under reduced motion.
- WCAG AA on every text pair, gated in `src/lib/theme-tokens.test.ts` for any new pair.
- No captions. Alt text on every image.
- Screenshots in the session scratchpad, never the repo. Commits end with the model's `Co-Authored-By` line.

---

### Task 1: The hymn board (`sundayTimesSection`) and the hero buttons

**Files:** `src/sanity/schemaTypes/churchSections.ts` (sundayTimesSection), `src/lib/queries.ts`, `src/lib/pageBuilder.types.ts`, `src/lib/sanity.types.ts` (typegen), `src/components/sections/SundayTimes.astro`, `src/components/Hero.astro` (full and split branches: buttons to `CtaLink variant="rule"`, nothing else), `src/pages/styleguide.astro`, `src/sanity/guides/content.ts`.

**Schema additions (all optional, so Visit and Contact stay valid):**
- `intro` (text, 3 rows): "A sentence or two above the times."
- `notes` (array of strings, max 3): "Short lines under the photo, like the nursery or communion."
- `photos` (array of image with required `alt`, max 2): "One or two photos. The first is the larger. Leave empty to use a photo from the page's spare pool."

**Look (prototype `section.expect`):** heading and intro; the photos in a wide door arch with a small lancet overlapping it (`ArchFrame`); the whole section is a full-width brown band (no boxed card), and the `items` are set straight onto it as the hymn board: gold numerals (big = time), label = title, body = small line, one row per item, hairline rules between; `notes` each with a small building glyph; the CTA as a `rule` button. With no photos and no spare photo, the board sits alone, centred. The `doors` and `showMap` behaviour (Visit, Contact) keeps working, restyled in the same language.

- [ ] Schema, typegen, `npm run test:unit` (section-fields gate), `npm run audit:studio`.
- [ ] Component; styleguide fixtures for: home (3 items, 2 photos, notes), Visit's current content, Contact's current content (read both modules), no photos.
- [ ] Hero: only the buttons change. Parity must show the hero markup change on hero pages and nothing else in the hero.
- [ ] Build, rule 20, screenshots (styleguide fixtures plus the built /visit and /contact) light and dark, 1440 and 375.
- [ ] Commit: `feat(home): the hymn board; rule buttons in the hero`.

### Task 2: The four goals as the ways in (`linkCardsSection` with glyphs)

**Files:** `churchSections.ts` (linkCard), queries/types/typegen, `src/components/sections/LinkCards.astro`, styleguide, guides.

**Schema addition:** `glyph` on `linkCard` (optional; list: window, door, rose, basin; radio). It is already in `NON_STEGA_FIELDS` by name: confirm with a grep and a unit test that the set contains it.

**Look (prototype goals band on indigo-dark):** when every card has an image, the arched-door cards (already built on Who We Are) now also draw the card's glyph beside the title, the body in one short paragraph, and the CTA as a text link; heading and intro above. Who We Are's "Where To Go Next" (no glyphs) must render exactly as today: parity proves it.

- [ ] Schema, typegen, gates as Task 1.
- [ ] Component, fixtures (with and without glyphs), screenshots, commit: `feat(home): building glyphs on the arched link cards`.

### Task 3: Our Building (`heritageBandSection`) ending in the present

**Files:** `churchSections.ts` (heritageBandSection), queries/types/typegen, `src/components/sections/HeritageBand.astro`, new `src/lib/heritage-dates.ts` + `.test.ts`, styleguide, guides.

**Schema additions (optional):**
- `archive` (image with required `alt`): "An old photograph shown beside the dates."
- `dates` (array, max 6, of `{ year: string, text: text, now: boolean }`): "Dates in order. Tick 'This year' on the last one to show what the church is doing now: its year is filled in when the site is built." `now` is a boolean, so not a stega concern; `year` is ignored when `now` is true.

**Logic (TDD):** `heritageDates(dates, buildDate): Array<{ year: string; text: string; now: boolean }>` returns the list with any `now` entry's year set to `String(buildDate.getUTCFullYear())`, keeps at most one `now` entry (the last), and drops entries with no text. Tests: a now entry gets the build year; a typed year on a now entry is replaced; two now entries keep only the last as now; empty text dropped; order kept.

**Look (prototype `Our Building`):** the heading and the first/last dates large ("1859 & 1929" comes from the first and the last non-now dates), the Hannaford rendering as the main image, sitting directly on the page (no card frame, no shadow, blended into the paper), the archive photo LARGER than the prototype's (at least a third of the row) in a door arch, the dated list with rules, the present-day entry last with a gold rule, the CTA as a `rule` button. History's opening heritage band (read `scripts/pages/history.mjs`) must still look right with no dates.

- [ ] TDD for `heritage-dates`; schema, typegen; component; fixtures (home, History's current content, no dates); screenshots including /history; commit: `feat(home): the building band ends in the present`.

### Task 4: The blog rows and the gold give band

**Files:** `src/components/sections/DynamicList.astro` (journal source), `src/lib/queries.ts` (the journal projection must include each post's cover image with `IMAGE_PROJECTION`, its date, excerpt, category and author name), `src/components/sections/GiveBand.astro`, styleguide.

**Look:** blog on a soft light ground (not brown: What to Expect is brown now): heading "Church Blog" style from the prototype, each row = date, the post's featured image in a small lancet (a post with no image shows a building glyph in the arch instead, never an empty frame), title, excerpt, and the author's name and category as text only; "All posts" as a `rule` button. Give on gold: basin glyph, heading, body, `rule` button in dark ink. /give opens on this band: check it still works as a page opener there.

- [ ] Component changes, fixtures (3 posts with images, one without), screenshots of /, /give, commit: `feat(home): the blog rows and the gold give band`.

### Task 5: Compose the home page

**Files:** `scripts/pages/home.mjs`, `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`, a fixture for `/styleguide/home` via `scripts/page-fixture.mjs` (as Who We Are's).

**Order:** hero (unchanged) → What to Expect (`sundayTimesSection`: the church's what-to-expect text; items 9:30 Sunday School, 10:15 Donut [Semi-] Hour, 10:45 Worship, from `scripts/data/pages/children.txt`, `adult.txt`, `what-to-expect.txt`; notes: nursery and communion lines; photos: the greeter and a children's photo, not ones Who We Are uses) → Our Goals (`linkCardsSection`: the four goals with glyphs, the church's own goal sentences, photos not used on Who We Are, links to Who We Are's goal anchors) → Our Building (`heritageBandSection` with the rendering, the archive photo, dates 1859, 1862, 1890, 1929 from `history.txt`, and a present-day entry in the church's words about the congregation today, listed as new copy if it is new) → Church Blog (`dynamicListSection`, 3 posts) → Give (`giveBandSection`). The old `imageTextSection` "What a first Sunday is like" folds into What to Expect.

- [ ] Rewrite the module (keep its header discipline and throwing `pick()` helpers); dry run and read the plan; protect any editor edits in the live `homePage` doc (compare with the old module's output, carry edits); approval note; the `/styleguide/home` preview; screenshots beside the prototype; commit: `feat(home): compose the home page from the identity sections`.

### Task 6: Gate and docs

- [ ] Full gates: check, format, unit, build, rule 20, `PLAYWRIGHT_PORT=4561 npm test`, `audit:studio`, the scaffold dry run for `church`.
- [ ] Parity: list every page that changed and why (expected: home, visit, contact, history, give, styleguide pages, and the sheet bytes everywhere); recapture, rebuild, prove the fixpoint; commit separately.
- [ ] Docs: components.md, changelog, PENDING (seed apply after deploy; new copy for approval), CLAUDE.md test list and counts.

**After merge and a green deploy (controller):** dry-run then `--apply` home (backup first), then shoot /, /visit, /contact, /history, /give in production light and dark at 1440 and 375, and verify Studio click-to-edit on the home page.
