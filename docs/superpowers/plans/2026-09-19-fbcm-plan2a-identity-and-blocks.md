# FBCM Plan 2a: Identity Tokens, Church Blocks and Studio Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach the page builder what a church needs: six brand tokens gated by
contrast tests, eight new section blocks plus two extensions, the service-business
leftovers removed, site settings that hold the church's facts once, and a Studio desk
a church secretary can read.

**Architecture:** Every block follows the same nine registration points the existing
`logoStripSection` uses (schema, export list, insert menu, renderer, projected type,
GROQ projection, cadence set, page-builder config, styleguide fixture), plus scaffold
markers, `NON_STEGA_FIELDS` for any rendering dropdown, and the `section-fields`
drift gate. Blocks carry no colour field; dark bands are dark by TYPE. Pure logic
(cadence membership, token contrast, derived labels) is unit-tested; components are
proven on `/styleguide` and by the Playwright suite.

**Tech Stack:** Astro 7, Sanity v6 embedded Studio, Tailwind 4 (`@theme` tokens in
`src/styles/globals.css`), `node --test` unit tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md` (sections 2,
3, 4, 6, 7). Plan 1's spec and `docs/PENDING.md` travel with it.

## Global Constraints

Verbatim from the spec and CLAUDE.md. Every task inherits them.

- Matched dependency set; do not bump: `@astrojs/cloudflare` 14.2.4 exact, `wrangler`
  ~4.110.0, `react`/`react-dom`/`react-is` 19.2.7 exact, `sanity` 6.9.1 (never 6.9.2),
  `@sanity/ui` 3.5.4 exact. **No new dependency in this plan.** Never `npm audit fix --force`.
- After any schema change: `npm run typegen` before `npm run build`.
- **No `tone`, `surface`, `background` or `accent` field on any block.**
  `src/lib/section-fields.test.ts` fails if one appears. A band is dark by its TYPE.
- **Any dropdown whose value drives rendering goes into `NON_STEGA_FIELDS` in
  `src/lib/cms-preview.ts` in the same commit.**
- **Every new capability carries its scaffold markers in the same commit** (rule 14).
  Inside an Astro template the marker is `{/* scaffold: name */}`.
- Field `description`s say what to TYPE, never why the field exists. The editor is a
  church secretary.
- Brand colours exactly: indigo `#292854`, indigo-field `#353351`, gold `#D59B29`,
  brown `#39251E`, brown-mid `#724F43`, taupe `#B5ABA3`, cream `#FBFBFA`.
  Forbidden pairs, asserted failing: gold on cream, white on gold, gold on brown-mid,
  taupe text on cream.
- No em-dashes in anything a visitor reads. Display weight 400, never 700.
- Gates before the PR: `npm run check` (0 errors), `test:unit`, `format:check`,
  `npm test`, `parity compare`, `audit:studio`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `brand/brand.config.json`, `src/styles/globals.css` | The six tokens, light and dark |
| `src/lib/theme-tokens.test.ts` | Contrast gate: every shipping pair, four forbidden pairs as negatives |
| `src/sanity/schemaTypes/churchSections.ts` (new) | The eight church blocks' schemas, one file, scaffold-marked `church` |
| `src/components/sections/{SundayTimes,Timeline,StaffGrid,FaqBand,ScriptureBand,HeritageBand,GiveBand,DocumentList}.astro` (new) | One component per block |
| `src/lib/church-derive.ts` + `.test.ts` (new) | Pure helpers: staff grouping order, "week of" label, document year sort |
| `src/sanity/schemaTypes/sections.ts` | `heroSection` gains `frames`, `layout`, `facts`; exports; insert-menu groups |
| `src/sanity/schemaTypes/staffMember.ts` | `+group`, `+phone` |
| `src/sanity/schemaTypes/siteSettings.ts` | `+church` group: service time, hours, platform URLs; service-business fields removed |
| `src/components/SectionRenderer.astro`, `src/lib/pageBuilder.types.ts`, `src/lib/queries.ts`, `src/lib/sectionCadence.ts`, `src/sanity/pageBuilderConfig.ts`, `src/lib/cms-preview.ts`, `src/lib/section-fields.ts` | Registration points |
| `src/pages/styleguide.astro` | Fixed-data fixture for every new block, both themes |
| `src/sanity/structure.ts`, `scripts/seed-core.mjs` (studioGuide/studioMap) | The secretary's desk and help |
| `src/components/Header.astro`, `Footer.astro` | Nav of seven plus Give; the indigo footer |

---

### Task 1: The six tokens and the contrast gate

**Files:**
- Modify: `brand/brand.config.json`, `src/styles/globals.css` (@theme block and `.dark`), `src/lib/theme-tokens.test.ts`, `scripts/apply-brand.mjs` (only if the config schema rejects the new keys)

**Interfaces:**
- Produces: CSS tokens `--color-indigo`, `--color-indigo-field`, `--color-gold`, `--color-brown`, `--color-brown-mid`, `--color-taupe`, `--color-cream`; Tailwind utilities `bg-indigo-field`, `text-gold`, `bg-brown`, `text-brown-mid`, `bg-taupe-tint`. `--color-primary` and `--color-accent` keep pointing at indigo so nothing existing breaks.

- [ ] **Step 1: Write the failing test.** Append to `src/lib/theme-tokens.test.ts`:

```ts
// Plan 2a: the church's full palette. Roles measured 2026-09-19; the four
// forbidden pairs are asserted FAILING so nobody can ship them by accident.
const CHURCH_PAIRS_AA: Array<[string, string, string]> = [
  ['color-indigo', 'color-cream', 'ink on paper'],
  ['color-brown', 'color-cream', 'brown ink on paper'],
  ['color-brown-mid', 'color-cream', 'eyebrows on paper'],
  ['color-gold', 'color-indigo-field', 'eyebrows on the dark band'],
  ['color-gold', 'color-brown', 'eyebrows on the heritage band'],
  ['color-taupe', 'color-indigo-field', 'muted text on the dark band'],
  ['color-taupe', 'color-brown', 'muted text on the heritage band'],
  ['color-indigo', 'color-gold', 'primary button label'],
  ['color-cream', 'color-brown', 'body on the heritage band'],
];
const CHURCH_PAIRS_FORBIDDEN: Array<[string, string, string]> = [
  ['color-gold', 'color-cream', 'gold text on paper'],
  ['color-cream', 'color-gold', 'white on gold'],
  ['color-gold', 'color-brown-mid', 'gold on mid brown'],
  ['color-taupe', 'color-cream', 'taupe text on paper'],
];

test('every church pair that ships clears AA body text', () => {
  for (const [fg, bg, why] of CHURCH_PAIRS_AA) {
    const r = contrastRatio(token(fg), token(bg));
    assert.ok(r >= AA_BODY_TEXT, `${why}: --${fg} on --${bg} is ${r.toFixed(2)}:1`);
  }
});

test('the four forbidden church pairs really do fail, so the list stays honest', () => {
  for (const [fg, bg, why] of CHURCH_PAIRS_FORBIDDEN) {
    const r = contrastRatio(token(fg), token(bg));
    assert.ok(r < AA_BODY_TEXT, `${why} unexpectedly passes at ${r.toFixed(2)}:1; update the roles`);
  }
});

test('the taupe tint surface keeps indigo ink readable', () => {
  // bg-soft is now a 16% taupe tint over cream; flatten() composites it.
  const tint = flatten(token('color-taupe'), token('color-cream'), 0.16);
  const r = contrastRatio(token('color-indigo'), rgbToHex(tint));
  assert.ok(r >= AA_BODY_TEXT, `indigo on taupe tint is ${r.toFixed(2)}:1`);
});
```

- [ ] **Step 2: Run to verify it fails.** `npm run test:unit -- --test-name-pattern="church pair"`. Expected: FAIL, `globals.css @theme is missing --color-indigo`.

- [ ] **Step 3: Add the tokens.** In `brand/brand.config.json` `palette.theme` add:

```json
"--color-indigo": "#292854",
"--color-indigo-field": "#353351",
"--color-gold": "#D59B29",
"--color-brown": "#39251E",
"--color-brown-mid": "#724F43",
"--color-taupe": "#B5ABA3",
"--color-cream": "#FBFBFA"
```

Keep `--color-primary: #292854`, `--color-accent: #292854`, `--color-bg: #FBFBFA`.
Set `--color-bg-soft` to the flattened tint value the test computes (write the hex the
test derives, e.g. `#EFEDEB`, so `apply-brand` stays a plain rewrite). Run
`npm run apply-brand`, then `npx prettier --write src/styles/globals.css`, then check
`astro.config.mjs` `site:` still reads `https://www.fbcmuncie.org` (apply-brand is
known to clobber it to the bare apex; fix by hand if so).

In `globals.css` `.dark`, add: `--color-cream: #1C1B3A; --color-indigo: #FBFBFA;
--color-indigo-field: #2A2950; --color-bg-soft: #262548;` and leave gold and the browns
unchanged. Add the note: `/* Dark mode: indigo becomes paper, cream becomes ink. Gold and the browns do not move. */`

- [ ] **Step 4: Run the gate.** `npm run test:unit -- --test-name-pattern="theme|church"`. Expected: PASS, including the three new tests. Then `npm run build`.

- [ ] **Step 5: Commit.**
```bash
git add brand/brand.config.json src/styles/globals.css src/lib/theme-tokens.test.ts
git commit -m "Add the church's six colour tokens and gate every pair that ships

Indigo, not navy: hue 241, and the Wix footer's purple field is the same
colour. The four pairs that fail (gold on cream, white on gold, gold on
mid brown, taupe text on cream) are asserted FAILING so the list stays
honest."
```

---

### Task 2: Site settings hold the church's facts once

**Files:**
- Modify: `src/sanity/schemaTypes/siteSettings.ts`, `src/lib/queries.ts` (`getSiteSettings` projection), `src/lib/sanity.types.ts` (typegen), `scripts/seed-core.mjs` (siteSettings seed)

**Interfaces:**
- Produces: `siteSettings.church` object with `serviceTime` (string, "Sundays at 10:45 am"), `serviceLength` ("About an hour"), `officeHours` (portable text), `pastoralHours` (portable text), `churchCenterUrl`, `givingUrl`, `churchTracUrl`, `youtubeUrl`, `livestreamUrl`, `visitorFormUrl`, `lifeEventFormUrl`, `mapImage` (image), `directionsUrl`. Removes: `availabilityStatus`, `serviceAreas`, `travelFees`, `businessType`, `googleBusinessUrl`, `reviewsNote`, `satisfactionGuarantee`, and the `sectionVisibility` toggles for capabilities that no longer exist (`showPortfolio`, `showShop`, `showEDesign`, `showGiftCertificates`, `showPress`, `showResources`, `showGuides`, `showStyleQuiz`, `showBudgetCalculator`); keep `showJournal`.

- [ ] **Step 1: Add the `church` group.** In `siteSettings.ts` add a field group `{ name: 'church', title: 'Church details' }` and:

```ts
defineField({ name: 'serviceTime', title: 'Service time', type: 'string', group: 'church',
  description: 'As it should read on the page, like "Sundays at 10:45 am".', initialValue: 'Sundays at 10:45 am' }),
defineField({ name: 'serviceLength', title: 'How long the service runs', type: 'string', group: 'church',
  description: 'A few words, like "About an hour".', initialValue: 'About an hour' }),
defineField({ name: 'officeHours', title: 'Office hours', type: 'array', of: [{ type: 'block' }], group: 'church',
  description: 'One line per day or range, like "Monday to Thursday, 9 to 12 and 1 to 4".' }),
defineField({ name: 'pastoralHours', title: "Pastors' office hours", type: 'array', of: [{ type: 'block' }], group: 'church',
  description: 'When the pastors keep office hours, like "Tuesdays, 9 to 12 and 1 to 5".' }),
defineField({ name: 'churchCenterUrl', title: 'Church Center address', type: 'url', group: 'church',
  description: 'The web address of the Church Center home page.' }),
defineField({ name: 'givingUrl', title: 'Giving address', type: 'url', group: 'church',
  description: 'Where the Give button sends people. Usually the Church Center giving page.' }),
defineField({ name: 'churchTracUrl', title: 'Church Trac address', type: 'url', group: 'church',
  description: 'The web address of the Church Trac home page.' }),
defineField({ name: 'youtubeUrl', title: 'YouTube channel', type: 'url', group: 'church',
  description: 'The channel address.' }),
defineField({ name: 'livestreamUrl', title: 'Live stream address', type: 'url', group: 'church',
  description: 'Where "Watch online" sends people on a Sunday.' }),
defineField({ name: 'visitorFormUrl', title: 'Visitor card form', type: 'url', group: 'church',
  description: 'The Church Center form a new visitor fills in.' }),
defineField({ name: 'lifeEventFormUrl', title: 'Life update form', type: 'url', group: 'church',
  description: 'The Church Center form for births, deaths, anniversaries and the like.' }),
defineField({ name: 'mapImage', title: 'Map picture', type: 'image', group: 'church',
  description: 'A picture of the map around the church. Shown wherever the address appears.' }),
defineField({ name: 'directionsUrl', title: 'Directions link', type: 'url', group: 'church',
  description: 'Where the "Open in Google Maps" button goes.' }),
```

Delete the fields listed under Removes. Delete their `sectionVisibility` toggles except `showJournal`.

- [ ] **Step 2: Fix every reader.** `grep -rn "serviceAreas\|travelFees\|availabilityStatus\|satisfactionGuarantee\|businessType\|googleBusinessUrl\|showPortfolio\|showShop\|showEDesign\|showGiftCertificates\|showPress\|showResources\|showGuides\|showStyleQuiz\|showBudgetCalculator" src/ scripts/ --include=*.ts --include=*.tsx --include=*.astro --include=*.mjs`. Every hit is removed or re-pointed. Expect hits in `queries.ts`, `sectionVisibility.ts` and its test, `BusinessOverview.tsx`, `seed-core.mjs`, `defaultSections.ts`, `Footer.astro`, `ServiceAreaCue.astro` (delete the component), `businessInfo.ts` (delete the schema if nothing else reads it).

- [ ] **Step 3: Seed the real values.** In `scripts/seed-core.mjs` the siteSettings seed gets: serviceTime, serviceLength, churchCenterUrl `https://fbcmuncie.churchcenter.com/`, givingUrl `https://fbcmuncie.churchcenter.com/giving`, churchTracUrl `https://fbcmuncie.churchtrac.com/`, youtubeUrl `https://www.youtube.com/c/FbcmuncieOrg`, livestreamUrl `https://www.youtube.com/@FbcmuncieOrg/streams`, visitorFormUrl `https://fbcmuncie.churchcenter.com/people/forms/159198`, lifeEventFormUrl `https://fbcmuncie.churchcenter.com/people/forms/159897`, directionsUrl `https://www.google.com/maps/search/?api=1&query=309+East+Adams+Street+Muncie+IN+47305`, officeHours as blocks: "Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm", "Friday: 9 am to 12 pm", "Sunday: 9 am to 12 pm", "Hours may change on holidays."; pastoralHours: "Tuesdays: 9 am to 12 pm and 1 pm to 5 pm". Phone `(765) 284-7749`, email `office@fbcmuncie.org`.

- [ ] **Step 4: Gates.** `npm run typegen && npm run check && npm run build && npm run test:unit && npm run audit:studio`. Expected: 0 errors; audit exits 0.

- [ ] **Step 5: Commit.**
```bash
git add -A
git commit -m "Site settings hold the church's facts once; the service-business fields go

Service time, hours, and the Church Center, Church Trac and YouTube
addresses live in one place every page reads. Service areas, travel
fees, availability, the guarantee and nine visibility toggles for
capabilities that no longer exist are removed with their readers."
```

---

### Task 3: Pure helpers for the church blocks

**Files:**
- Create: `src/lib/church-derive.ts`, `src/lib/church-derive.test.ts`

**Interfaces:**
- Produces: `STAFF_GROUPS = ['pastors','coordination','support'] as const`; `type StaffGroup`; `groupStaff(members: {group?: string|null; order?: number|null; name: string}[]): Record<StaffGroup, typeof members>` (stable sort by `order` then `name`, unknown group → `support`); `weekOfLabel(publishedAt: string, now?: Date): string` ("Sermon preview, week of 14 January 2024"); `sortDocsByYearDesc(docs: {year?: number|null; title: string}[])`.

- [ ] **Step 1: Write the failing tests.**

```ts
// src/lib/church-derive.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupStaff, weekOfLabel, sortDocsByYearDesc, STAFF_GROUPS } from './church-derive.ts';

test('staff group order is pastors, coordination, support, and unknown lands in support', () => {
  assert.deepEqual(STAFF_GROUPS, ['pastors', 'coordination', 'support']);
  const g = groupStaff([
    { name: 'B', group: 'coordination', order: 20 },
    { name: 'A', group: 'pastors', order: 10 },
    { name: 'C', group: null, order: 5 },
  ]);
  assert.deepEqual(g.pastors.map((m) => m.name), ['A']);
  assert.deepEqual(g.coordination.map((m) => m.name), ['B']);
  assert.deepEqual(g.support.map((m) => m.name), ['C']);
});

test('within a group, order wins and name breaks ties', () => {
  const g = groupStaff([
    { name: 'Zed', group: 'coordination', order: 10 },
    { name: 'Amy', group: 'coordination', order: 10 },
    { name: 'Bob', group: 'coordination', order: 5 },
  ]);
  assert.deepEqual(g.coordination.map((m) => m.name), ['Bob', 'Amy', 'Zed']);
});

test('week-of label reads as a sentence with the day and month', () => {
  assert.equal(weekOfLabel('2024-01-15T10:00:00.000Z'), 'Sermon preview, week of 15 January 2024');
});

test('an unparseable date yields the plain eyebrow rather than "Invalid Date"', () => {
  assert.equal(weekOfLabel('not a date'), 'Sermon preview');
});

test('documents sort newest year first, undated last, ties by title', () => {
  const out = sortDocsByYearDesc([
    { title: 'B', year: 2023 }, { title: 'A', year: null }, { title: 'C', year: 2025 }, { title: 'D', year: 2023 },
  ]);
  assert.deepEqual(out.map((d) => d.title), ['C', 'B', 'D', 'A']);
});
```

- [ ] **Step 2: Run to verify failure.** `npm run test:unit -- --test-name-pattern="staff group|week-of|documents sort"`. Expected: cannot find module.

- [ ] **Step 3: Implement.**

```ts
// src/lib/church-derive.ts
// Pure helpers behind the church blocks. Nothing here touches Sanity or the DOM,
// so every rule that decides what a visitor sees is unit-tested.

export const STAFF_GROUPS = ['pastors', 'coordination', 'support'] as const;
export type StaffGroup = (typeof STAFF_GROUPS)[number];

interface Groupable { group?: string | null; order?: number | null; name: string }

/** Stable: order ascending, then name. Anyone without a known group is support staff. */
export function groupStaff<T extends Groupable>(members: T[]): Record<StaffGroup, T[]> {
  const out = { pastors: [] as T[], coordination: [] as T[], support: [] as T[] };
  for (const m of members) {
    const g = (STAFF_GROUPS as readonly string[]).includes(m.group ?? '') ? (m.group as StaffGroup) : 'support';
    out[g].push(m);
  }
  const by = (a: Groupable, b: Groupable) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name);
  for (const g of STAFF_GROUPS) out[g].sort(by);
  return out;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** "Sermon preview, week of 15 January 2024". Falls back to the bare eyebrow. */
export function weekOfLabel(publishedAt: string): string {
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return 'Sermon preview';
  return `Sermon preview, week of ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Newest year first; undated documents last; ties by title. Never mutates. */
export function sortDocsByYearDesc<T extends { year?: number | null; title: string }>(docs: T[]): T[] {
  return [...docs].sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity) || a.title.localeCompare(b.title));
}
```

- [ ] **Step 4: Run tests.** Expected: PASS, 5 tests.
- [ ] **Step 5: Commit.** `git add src/lib/church-derive.ts src/lib/church-derive.test.ts && git commit -m "Pure helpers for the church blocks: staff grouping, week-of label, document sort"`

---

### Task 4: The eight church block schemas, in one scaffold-marked file

**Files:**
- Create: `src/sanity/schemaTypes/churchSections.ts`
- Modify: `src/sanity/schemaTypes/sections.ts` (export list + insert-menu groups), `src/sanity/schemaTypes/index.ts`, `src/lib/cms-preview.ts` (`NON_STEGA_FIELDS`), `src/lib/section-fields.ts` (registry), `src/lib/sectionCadence.ts`, `src/sanity/pageBuilderConfig.ts`

**Interfaces:**
- Produces the `_type`s: `sundayTimesSection`, `timelineSection`, `staffGridSection`, `faqSection`, `scriptureBandSection`, `heritageBandSection`, `giveBandSection`, `documentListSection`, with the exact field names below. Task 5 renders them; Task 6 fixtures them.

- [ ] **Step 1: Write the failing cadence test.** Append to `src/lib/sectionCadence.test.ts`:

```ts
test('church blocks are classified: dark bands self-contained, the rest alternate', () => {
  for (const t of ['sundayTimesSection', 'faqSection', 'scriptureBandSection', 'heritageBandSection', 'giveBandSection']) {
    assert.ok(SELF_CONTAINED_TYPES.has(t), `${t} should be self-contained`);
  }
  for (const t of ['timelineSection', 'staffGridSection', 'documentListSection']) {
    assert.ok(CONTENT_TYPES.has(t), `${t} should alternate with the cadence`);
  }
});
```

- [ ] **Step 2: Run to verify failure.** `npm run test:unit -- --test-name-pattern="church blocks are classified"`. Expected: FAIL.

- [ ] **Step 3: Write the schemas.**

```ts
// src/sanity/schemaTypes/churchSections.ts
// scaffold: church
// The eight blocks a church page needs and a service business does not. Every
// description says what to TYPE. No block carries a colour field: the dark bands
// (sundayTimes is cream, faq/scripture/give are indigo, heritage is brown) are dark
// by TYPE, which is what keeps SectionRenderer's cadence the only source of surface.
import { defineArrayMember, defineField, defineType } from 'sanity';

const eyebrow = defineField({ name: 'eyebrow', title: 'Small line above the heading', type: 'string',
  description: 'A few words, like "This Sunday". Leave blank for none.' });
const heading = defineField({ name: 'heading', title: 'Heading', type: 'string',
  description: 'One line.', validation: (r) => r.required() });

export const sundayTimesSection = defineType({
  name: 'sundayTimesSection', title: 'Sunday times and location', type: 'object',
  fields: [
    eyebrow, heading,
    defineField({ name: 'items', title: 'Three columns', type: 'array', validation: (r) => r.min(1).max(3),
      description: 'Up to three. The first usually carries the service time.',
      of: [defineArrayMember({ type: 'object', name: 'timeItem', fields: [
        defineField({ name: 'label', title: 'Small label', type: 'string', description: 'Like "Sunday worship".' }),
        defineField({ name: 'big', title: 'Big line', type: 'string', description: 'Like "10:45 am". Leave blank for a text-only column.' }),
        defineField({ name: 'body', title: 'Text', type: 'text', rows: 3, description: 'One or two sentences.' }),
      ], preview: { select: { title: 'label', subtitle: 'big' } } })] }),
    defineField({ name: 'doors', title: 'Doors and parking', type: 'array',
      description: 'One entry per entrance, the accessible one first. Leave empty to show only the map and address.',
      of: [defineArrayMember({ type: 'object', name: 'door', fields: [
        defineField({ name: 'name', title: 'Name', type: 'string', description: 'Like "Adams Street circular drive".' }),
        defineField({ name: 'body', title: 'How to find it', type: 'text', rows: 2 }),
      ], preview: { select: { title: 'name' } } })] }),
    defineField({ name: 'showMap', title: 'Show the map and address', type: 'boolean', initialValue: true,
      description: 'Uses the map picture and address from Site settings.' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Sunday times', subtitle: 'Sunday times and location' }) },
});

export const timelineSection = defineType({
  name: 'timelineSection', title: 'Timeline', type: 'object',
  fields: [
    eyebrow, heading,
    defineField({ name: 'rows', title: 'Rows', type: 'array', validation: (r) => r.min(1),
      description: 'In order from top to bottom.',
      of: [defineArrayMember({ type: 'object', name: 'timelineRow', fields: [
        defineField({ name: 'marker', title: 'Marker', type: 'string', description: 'What sits in the left column: a time like "9:30" or a year like "1859".', validation: (r) => r.required() }),
        defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'body', title: 'Text', type: 'array', of: [{ type: 'block' }], description: 'A short paragraph or two.' }),
        defineField({ name: 'note', title: 'Small note under the text', type: 'string', description: 'Like room numbers: "Rooms B-04, B-05, 201". Leave blank for none.' }),
        defineField({ name: 'anchor', title: 'Link anchor', type: 'slug', options: { source: 'title' }, description: 'Click Generate. Lets a link jump straight to this row.' }),
      ], preview: { select: { title: 'title', subtitle: 'marker' } } })] }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Timeline', subtitle: 'Timeline' }) },
});

export const staffGridSection = defineType({
  name: 'staffGridSection', title: 'Staff', type: 'object',
  fields: [
    eyebrow, heading,
    defineField({ name: 'group', title: 'Who to show', type: 'string', initialValue: 'all',
      options: { list: [
        { title: 'Everyone', value: 'all' }, { title: 'Pastors', value: 'pastors' },
        { title: 'Church Coordination Team', value: 'coordination' }, { title: 'Support and volunteer roles', value: 'support' },
      ], layout: 'radio' },
      description: 'Pick one. People are set to a group on their own Staff member page.' }),
    defineField({ name: 'showBios', title: 'Show the longer text about each person', type: 'boolean', initialValue: true,
      description: 'Turn off to show only name, role, email and photo.' }),
  ],
  preview: { select: { title: 'heading', group: 'group' }, prepare: ({ title, group }) => ({ title: title || 'Staff', subtitle: `Staff: ${group ?? 'all'}` }) },
});

export const faqSection = defineType({
  name: 'faqSection', title: 'Questions and answers', type: 'object',
  fields: [
    eyebrow, heading,
    defineField({ name: 'items', title: 'Questions', type: 'array', validation: (r) => r.min(1),
      of: [defineArrayMember({ type: 'object', name: 'faqItem', fields: [
        defineField({ name: 'question', title: 'Question', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'answer', title: 'Answer', type: 'array', of: [{ type: 'block' }], validation: (r) => r.required() }),
      ], preview: { select: { title: 'question' } } })] }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Questions', subtitle: 'Questions and answers' }) },
});

export const scriptureBandSection = defineType({
  name: 'scriptureBandSection', title: 'Scripture band', type: 'object',
  fields: [
    defineField({ name: 'verse', title: 'The words', type: 'text', rows: 4, validation: (r) => r.required(),
      description: 'The verse or quotation, without the reference.' }),
    defineField({ name: 'reference', title: 'Reference', type: 'string', description: 'Like "Isaiah 12:4".' }),
    defineField({ name: 'accentWord', title: 'Word to pick out in gold', type: 'string',
      description: 'One word that appears in the text, spelled exactly as it appears. Leave blank for none.' }),
  ],
  preview: { select: { title: 'reference', subtitle: 'verse' }, prepare: ({ title, subtitle }) => ({ title: title || 'Scripture', subtitle }) },
});

export const heritageBandSection = defineType({
  name: 'heritageBandSection', title: 'Building band (brown)', type: 'object',
  fields: [
    eyebrow, heading,
    defineField({ name: 'body', title: 'Text', type: 'text', rows: 4, description: 'One paragraph.' }),
    defineField({ name: 'image', title: 'Photo', type: 'image', options: { hotspot: true }, description: 'A photo of the building or the glass.' }),
    defineField({ name: 'cta', title: 'Button (optional)', type: 'ctaBlock' }),
  ],
  preview: { select: { title: 'heading', media: 'image' }, prepare: ({ title, media }) => ({ title: title || 'Building band', subtitle: 'Building band (brown)', media }) },
});

export const giveBandSection = defineType({
  name: 'giveBandSection', title: 'Give band', type: 'object',
  fields: [
    heading,
    defineField({ name: 'body', title: 'Text', type: 'text', rows: 3, description: 'One or two sentences.' }),
    defineField({ name: 'buttonLabel', title: 'Button text', type: 'string', initialValue: 'Give through Church Center' }),
    defineField({ name: 'buttonUrl', title: 'Button link', type: 'url',
      description: 'Leave blank to use the giving address from Site settings.' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Give', subtitle: 'Give band' }) },
});

export const documentListSection = defineType({
  name: 'documentListSection', title: 'Documents to download', type: 'object',
  fields: [
    eyebrow, heading,
    defineField({ name: 'docs', title: 'Documents', type: 'array', validation: (r) => r.min(1),
      of: [defineArrayMember({ type: 'object', name: 'listedDocument', fields: [
        defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'year', title: 'Year', type: 'number', description: 'Four digits, like 2025. Newest shows first. Leave blank for undated.' }),
        defineField({ name: 'file', title: 'File', type: 'file', description: 'Upload the PDF.' }),
        defineField({ name: 'url', title: 'Or a link', type: 'url', description: 'Use this instead of a file for something hosted elsewhere, like a book on Amazon.' }),
        defineField({ name: 'note', title: 'Small note', type: 'string', description: 'Like "Quarterly newsletter". Leave blank for none.' }),
      ], preview: { select: { title: 'title', subtitle: 'note' } } })] }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Documents', subtitle: 'Documents to download' }) },
});

export const CHURCH_SECTION_TYPES = [
  sundayTimesSection, timelineSection, staffGridSection, faqSection,
  scriptureBandSection, heritageBandSection, giveBandSection, documentListSection,
];
// scaffold:end
```

Preview titles never come from a number (the `year` field is not a preview title), so
`audit:studio` check 2 stays clean.

- [ ] **Step 4: Register.** In `sections.ts`: import `CHURCH_SECTION_TYPES` and spread it into the exported schema list; add the eight names to `SECTION_TYPES` and to the insert menu in a new group `{ title: 'Church', of: [ ...the eight names ] }` (scaffold-mark the group `// scaffold: church`). In `schemaTypes/index.ts` ensure they reach the schema array. In `pageBuilderConfig.ts` add the eight names to the arrays that list `logoStripSection` (mark each addition). In `sectionCadence.ts` add the five self-contained names to `SELF_CONTAINED_TYPES` and the three others to `CONTENT_TYPES` (mark). In `cms-preview.ts` add `'group'` (staffGridSection) to `NON_STEGA_FIELDS` with a comment naming the block. In `section-fields.ts` register `scriptureBandSection.accentWord` as an accent field if the registry's shape allows a non-heading accent; if it does not, add nothing and note in the file that the scripture accent is rendered by `splitHeadingAccent()` directly.

- [ ] **Step 5: Gates.** `npm run typegen && npm run check && npm run test:unit`. Expected: the cadence test passes; `section-fields.test.ts` passes (no colour fields); 0 errors.

- [ ] **Step 6: Commit.**
```bash
git add -A
git commit -m "Eight church block schemas, scaffold-marked, registered at every point

sundayTimes, timeline, staffGrid, faq, scriptureBand, heritageBand,
giveBand, documentList. Dark bands are dark by TYPE; no block carries a
colour field. staffGrid.group is a rendering dropdown and is in
NON_STEGA_FIELDS in this commit."
```

---

### Task 5: The eight components, and the renderer, projection and types

**Files:**
- Create: `src/components/sections/SundayTimes.astro`, `Timeline.astro`, `StaffGrid.astro`, `FaqBand.astro`, `ScriptureBand.astro`, `HeritageBand.astro`, `GiveBand.astro`, `DocumentList.astro`
- Modify: `src/components/SectionRenderer.astro`, `src/lib/pageBuilder.types.ts`, `src/lib/queries.ts` (`sectionsProjection()`), `src/lib/preview-edit-attr.ts` if it enumerates types

**Interfaces:**
- Consumes: `groupStaff`, `weekOfLabel`, `sortDocsByYearDesc` (Task 3); `SectionHeading.astro` props `eyebrow`, `level`, `align`; `CtaLink.astro`; `SanityImage.astro`; `PortableText.tsx`; `getSiteSettings()`.
- Produces: one Astro component per block, each with a `// Safe to edit by hand` header, `align="left"` on every `SectionHeading`, and the shared left edge (`max-w-6xl mx-auto px-6`).

- [ ] **Step 1: GROQ projections.** In `sectionsProjection()` add arms:

```groq
_type == "sundayTimesSection" => { ..., items[], doors[] },
_type == "timelineSection" => { ..., rows[]{ ..., "anchor": anchor.current } },
_type == "staffGridSection" => {
  ...,
  "members": *[_type == "staffMember" && (^.group == "all" || group == ^.group)] | order(order asc, name asc) {
    _id, name, "slug": slug.current, role, email, phone, group, order, bio,
    photo{ ..., asset->, "alt": coalesce(alt, asset->altText, name) }
  }
},
_type == "faqSection" => { ..., items[] },
_type == "scriptureBandSection" => { ... },
_type == "heritageBandSection" => { ..., image{ ..., asset->, "alt": coalesce(alt, asset->altText, "") }, cta{ ..., internalLink->{ _type, "slug": slug.current } } },
_type == "giveBandSection" => { ... },
_type == "documentListSection" => { ..., docs[]{ ..., "fileUrl": file.asset->url } },
```

- [ ] **Step 2: Projected types.** In `pageBuilder.types.ts` add one interface per block mirroring the fields above (`ProjectedSundayTimesSection`, … `ProjectedDocumentListSection`) and add all eight to the `ProjectedSection` union.

- [ ] **Step 3: Components.** Each file starts `// Safe to edit by hand` and a one-paragraph comment. Markup for each:

`SundayTimes.astro` (cream): container → `SectionHeading` (eyebrow, heading, align left) → a 3-column grid of items (label as eyebrow-style small caps in brown-mid, `big` in serif 40px, body 15px) → if `doors.length`, a 2-column band: left the map (`<SanityImage>` of `siteSettings.church.mapImage` with a gold top rule, or a cream box with the address when absent) and an "Open in Google Maps" secondary button to `directionsUrl`; right an ordered list of doors, each with a numbered indigo disc and the name in serif.

`Timeline.astro`: container → heading → a 2-column grid `grid-cols-[120px_1fr]`, each row: marker in serif 26px left; right cell with a 2px gold left border, title in serif 18px, `PortableText` body, note in small caps brown-mid; `id={row.anchor}` on the row.

`StaffGrid.astro`: container → heading → `groupStaff(members)` then for the requested group (or all three in order when `group === 'all'`, each with an h3 in serif) a grid `md:grid-cols-3` of cards: portrait 4:5 with a gold top rule, name serif 20px, role 14px brown-mid, email as a `mailto:` link, phone if present; when `showBios` and `bio`, a `<details>` with summary "About {first name}" and the `PortableText` bio. Each card `id={slug}`.

`FaqBand.astro` (indigo-field, `text-cream`): container → heading (eyebrow gold, heading cream) → `<details>` per item with a hairline in `taupe/25`, summary in serif 19px with a gold `+`, answer `PortableText` in cream 15px. The first item open by default. Native `<details>`: no island, keyboard works.

`ScriptureBand.astro` (indigo-field): container centred; verse in serif 30px cream, the `accentWord` wrapped by `splitHeadingAccent(verse, accentWord)` in gold italic; reference in Inter small caps gold beneath.

`HeritageBand.astro` (brown, `text-cream`): container → 7:5 grid: text left (eyebrow gold, heading cream serif 34px, gold rule, body cream/90, `CtaLink` secondary in white outline), image right with a gold top rule; on mobile the image stacks under.

`GiveBand.astro` (indigo-field): container → 7:5 grid: heading cream, body, primary gold button to `buttonUrl || siteSettings.church.givingUrl`, `rel="noopener"`, `target="_blank"`. Right column empty on purpose (breathing room).

`DocumentList.astro`: container → heading → `sortDocsByYearDesc(docs)` as a list: each row a 2px gold top rule, title serif 18px linking to `fileUrl || url` (`download` attribute when a file), year in small caps, note in 14px.

- [ ] **Step 4: Renderer.** In `SectionRenderer.astro` import the eight and add branches in the `_type` chain, each passing the block and `siteSettings` where needed, each wrapped exactly as `logoStripSection` is (so the preview `data-sanity` wrapper and `editDoc` behaviour are identical). Mark the import block and the branch block `{/* scaffold: church */}`.

- [ ] **Step 5: Gates.** `npm run typegen && npm run check && npm run build`. Expected: 0 errors, build green. Run `npm run parity compare` and expect it unchanged (nothing renders these yet).

- [ ] **Step 6: Commit.** `git add -A && git commit -m "Components, projections and types for the eight church blocks"`

---

### Task 6: Every new block on the styleguide, both themes

**Files:**
- Modify: `src/pages/styleguide.astro` (fixed-data fixtures), `tests/routes.ts` if the styleguide is route-listed

- [ ] **Step 1: Add a fixture per block** to the styleguide's fixed data, using real church content: sundayTimes with the three columns and three doors from the spec 5.2; timeline with the four Sunday rows; staffGrid with three synthetic members (no real photos needed: use the placeholder image the styleguide already uses); faq with two of the captured entries; scripture band Isaiah 12:4 with accent "proclaim"; heritage with the tower placeholder; give band; documentList with three rows including one undated.

- [ ] **Step 2: Build and look.** `npm run build` then `npm run preview`; open `/styleguide` in a real browser in light and dark; screenshot both at 375 and 1280 into `docs/superpowers/screenshots/2026-09-19/styleguide-{light,dark}-{375,1280}.png`. Check with your eyes: one left edge, gold rules present, no gold text on cream anywhere, dark bands legible in dark mode.

- [ ] **Step 3: Playwright.** `npm test`. Expected: green, including axe light and dark on the styleguide. Fix any contrast finding by changing the COMPONENT, never by relaxing the gate.

- [ ] **Step 4: Visual baselines.** Do NOT regenerate `scripts/.parity` yet (that happens once at the end of plan 2c). Note in the ledger that the styleguide baseline for `visual.yml` must be refreshed on CI when this lands, with its `update` input.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "Styleguide fixtures for the church blocks, screenshots both themes"`

---

### Task 7: Hero gains frames, layout and facts; staffMember gains group and phone

**Files:**
- Modify: `src/sanity/schemaTypes/sections.ts` (heroSection), `src/components/Hero.astro`, `src/components/HeroBackground.astro`, `src/sanity/schemaTypes/staffMember.ts`, `src/lib/cms-preview.ts`, `src/lib/queries.ts`, `src/lib/pageBuilder.types.ts`, `src/styles/globals.css` (the cross-fade keyframes)

**Interfaces:**
- Produces: `heroSection.frames: image[] (max 6)`, `heroSection.layout: 'full' | 'split'` (NON_STEGA), `heroSection.facts: {label, value}[] (max 3)`; `staffMember.group: 'pastors'|'coordination'|'support'` (NON_STEGA), `staffMember.phone: string`.

- [ ] **Step 1: Write the failing test** in `src/lib/section-fields.test.ts` or a new `src/lib/hero-frames.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameAnimationDelays } from './hero-frames.ts';

test('frame delays step by the frame length and the first frame starts at zero', () => {
  assert.deepEqual(frameAnimationDelays(5, 8), [0, 8, 16, 24, 32]);
  assert.deepEqual(frameAnimationDelays(1, 8), [0]);
});

test('a single frame produces no animation cycle', () => {
  assert.equal(frameAnimationDelays(1, 8).length, 1);
});
```

- [ ] **Step 2: Implement `src/lib/hero-frames.ts`:**

```ts
// The home hero cross-fade is CSS-only. This computes each frame's animation-delay
// so a 5-frame, 8-second hero cycles in 40s with frame 1 (the LCP image) first.
export function frameAnimationDelays(frameCount: number, secondsPerFrame: number): number[] {
  return Array.from({ length: Math.max(1, frameCount) }, (_, i) => i * secondsPerFrame);
}
```

- [ ] **Step 3: Schema.** In `heroSection` add:

```ts
defineField({ name: 'layout', title: 'Layout', type: 'string', initialValue: 'full',
  options: { list: [{ title: 'Photo behind the words', value: 'full' }, { title: 'Words left, photo right', value: 'split' }], layout: 'radio' },
  description: 'Pick one.' }),
defineField({ name: 'frames', title: 'Photos', type: 'array', validation: (r) => r.max(6),
  of: [{ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string', description: 'A short sentence for people who cannot see it.' })] }],
  description: 'One photo, or up to six. With more than one, the home page fades slowly between them; the first loads first, so put the best one first.' }),
defineField({ name: 'facts', title: 'Three facts', type: 'array', validation: (r) => r.max(3),
  of: [{ type: 'object', name: 'heroFact', fields: [
    defineField({ name: 'label', title: 'Small label', type: 'string', description: 'Like "Sundays".' }),
    defineField({ name: 'value', title: 'Value', type: 'string', description: 'Like "10:45 am".' }),
  ], preview: { select: { title: 'value', subtitle: 'label' } } }],
  description: 'Up to three short facts under the words: when, where, online.' }),
```

Remove `scriptAccent` from `heroSection` (the spec drops the script accent). Add `'layout'` to `NON_STEGA_FIELDS`. In `staffMember.ts` add `group` (radio list pastors/coordination/support, description "Pick one. Pastors show first on the Staff page.") and `phone` (string, "Their church phone number, if they have one. Leave blank to show none."); add `'group'` to `NON_STEGA_FIELDS` (it is already there from Task 4 for the section; the same name covers both).

- [ ] **Step 4: Hero component.** `Hero.astro`: when `layout === 'split'`, render a cream 7:5 grid (words left with kicker, headline, sub, facts; first frame right with a gold left rule, `object-cover`). When `full`: render every frame absolutely positioned, `frames[0]` with `loading="eager" fetchpriority="high"`, the rest `loading="lazy"`; when `frames.length > 1`, add class `hero-fade` and `style={\`--frames:${n};--frame-s:8;animation-delay:${delay}s\`}` per frame using `frameAnimationDelays`; render a `<button type="button" class="hero-pause" aria-pressed="false">Pause</button>` that toggles `.is-paused` on the hero (a 12-line inline `<script>` in the component, no island) and dot indicators (`aria-hidden`). In `globals.css`:

```css
/* Home hero cross-fade. Pure CSS: frame N is delayed N*8s across a cycle of frames*8s. */
.hero-fade .hero-frame { opacity: 0; animation: hero-fade calc(var(--frames) * var(--frame-s) * 1s) infinite; }
@keyframes hero-fade { 0%{opacity:0} 4%{opacity:1} 20%{opacity:1} 26%{opacity:0} 100%{opacity:0} }
.hero-fade:hover .hero-frame, .hero-fade:focus-within .hero-frame, .hero-fade.is-paused .hero-frame { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .hero-fade .hero-frame { animation: none; } .hero-fade .hero-frame:first-child { opacity: 1; } }
```

The 4%/20%/26% keyframe points assume five frames; compute them from `--frames` with `calc()` where the browser support allows, else document that the cycle is tuned for 4–6 frames.

- [ ] **Step 5: Gates.** `npm run typegen && npm run check && npm run test:unit && npm run build && npm test`. Expected: all green; the two hero-frames tests pass.

- [ ] **Step 6: Commit.** `git add -A && git commit -m "Hero gains frames, layout and facts; staff members gain group and phone"`

---

### Task 8: Remove the two service leftovers

**Files:**
- Modify: `src/sanity/schemaTypes/sections.ts`, `richSections.ts`, `SectionRenderer.astro`, `pageBuilder.types.ts`, `queries.ts`, `sectionCadence.ts`, `pageBuilderConfig.ts`, `defaultSections.ts`, `styleguide.astro`; delete `src/components/sections/ServiceArea.astro` and `Guarantee.astro` (names per the repo)

- [ ] **Step 1:** `grep -rn "serviceAreaSection\|guaranteeSection\|ServiceArea\|Guarantee" src/ tests/ scripts/ --include=*.ts --include=*.tsx --include=*.astro --include=*.mjs | grep -v sanity.types.ts` and remove every hit, including the insert-menu `of:` entries and the cadence set entries.
- [ ] **Step 2:** `npm run typegen && npm run check && npm run build && npm run test:unit`. Expected: green. Re-run the grep: `clean`.
- [ ] **Step 3:** Commit. `git commit -am "Remove serviceAreaSection and guaranteeSection: no church meaning"`

---

### Task 9: Header of seven plus Give, the utility row, the indigo footer

**Files:**
- Modify: `src/components/Header.astro`, `src/components/MobileNav.tsx`, `src/components/Footer.astro`, `scripts/seed-core.mjs` (siteSettings `navItems`, `footerColumns`, `headerCta`)

**Interfaces:**
- Consumes: `chrome.headerNav` (from `siteSettings.navItems`), `siteSettings.church.*` (Task 2), `headerCta`.

- [ ] **Step 1: Seed the nav.** `navItems`: Visit `/visit`, Who We Are `/who-we-are`, Beliefs `/beliefs`, Ministries `/ministries`, Staff `/staff`, History `/history`, Blog `/blog`. `headerCta`: show true, label "Give", link = `church.givingUrl`. `footerColumns`: Pages (the seven plus Weddings & Building Use `/wedding`, Contact `/contact`, Privacy `/privacy`); Elsewhere (Church Center: calendar and giving → churchCenterUrl; Church Trac: newsletters and the app → churchTracUrl; YouTube: every service → youtubeUrl); Office (rendered from `officeHours`, not a link list).

- [ ] **Step 2: Header.** Above the nav at `md:` and up, a utility row: phone (tel: link) left-aligned with the wordmark column, "Contact" right. The Give button uses `bg-gold text-indigo`. Verify at 1024 and 1280 that seven items plus Give fit on one line; if not at 1024, drop the utility row's phone to an icon at that width rather than wrapping the nav.

- [ ] **Step 3: Footer.** Background `bg-indigo-field`, tagline in `text-gold` serif 18px (from `siteSettings.tagline`), phone and social marks in white, three columns, address in cream, the mark in white. Remove any Reid-era credit line; keep `footerCredit` only if `siteSettings` has one.

- [ ] **Step 4: Verify.** `npm run build && npm test`; screenshot header and footer both themes at 375 and 1280 into the screenshots folder; run the theme gate.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "Nav of seven plus Give, a utility row, and the church's own indigo footer"`

---

### Task 10: The secretary's desk and help

**Files:**
- Modify: `src/sanity/structure.ts`, `scripts/seed-core.mjs` (`studioGuide`, `studioMap`, `studioNotes`), `src/sanity/schemaTypes/homePage.ts` (remove hidden legacy fields), `src/sanity/components/StudioGuide.tsx` if copy lives there

- [ ] **Step 1: Desk.** Structure in this order, with these titles: **Pages** (Home, then every `page` doc in nav order, then Privacy), **Blog** (Posts by year via the year-scoped list pattern if present, else all posts newest first; Categories), **People** (Staff members), **Ministries**, **Site settings**, **Help**. Nothing else at the top level. Remove panes for types that no longer exist.

- [ ] **Step 2: Help, in her words.** Rewrite `studioMap` rows to: Home page · Visit page · the other pages · Blog posts · Staff members · Ministries · Site settings, each row saying what it is for in one sentence. Rewrite the `howTo` guide with exactly these entries: "Post this week's sermon preview" (Blog › Posts › New, pick category Sermon Preview, Publish); "Change the service time or office hours" (Site settings › Church details); "Add or remove a staff member" (People › Staff members; set the group; Publish); "Change a photo on the home page" (Pages › Home › the first section › Photos); "What happens when I press Publish" (the site rebuilds itself in about two minutes; nobody needs to be called); "The one button never to press" (Remove field: it deletes that information from every page).

- [ ] **Step 3: homePage cleanup.** Delete the hidden/readOnly legacy fields (`hero*`, `meetFounder*`, `featuredWork*`, `featuredJournal*`, `process*`, `servicesGrid*`, `final*`) from `homePage.ts`. `pageBuilder` and SEO remain. Run `npm run audit:studio`: if it reports a stored key the schema no longer declares on the live `homePage` document, write a one-off `scripts/retire-homepage-legacy-fields.mjs` that backs the document up to `scripts/data/backups/homePage-<date>.json` BEFORE unsetting those keys, dry by default (rule 16). Run it dry, read the plan, run with `--write`, re-run the audit.

- [ ] **Step 4: Gates.** `npm run typegen && npm run check && npm run build && npm run audit:studio && npm run test:unit`. Open `/studio` in a real browser, sign-in screen or desk, console clean.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "The Studio desk and help, written for a church secretary"`

---

### Task 11: Redirect 43 and the plan-2a gate run

**Files:**
- Modify: `src/lib/fbcm-redirects.ts`, `src/lib/fbcm-redirects.test.ts`, `docs/PENDING.md`

- [ ] **Step 1:** Add `'michelle-heimlich'` to `FORMER_STAFF`; update the test's former-staff list to six; run `node scripts/import-redirects.mjs` dry, then `--apply`; count `redirect` documents: 43.
- [ ] **Step 2: The full gate.** `npm run typegen && npm run check && npm run test:unit && npm run format:check && npm run build && npm test && npm run audit:studio && node scripts/verify-archive.mjs --quick`. Paste every result into the ledger. `npm run parity compare` will DIFFER because the header and footer changed on every page; that is expected in 2a and the baselines are recaptured once, in plan 2c.
- [ ] **Step 3: Deploy** `npm run deploy` in the foreground (or push and let CI deploy). Confirm `/styleguide` on the deployed URL shows the eight blocks in both themes.
- [ ] **Step 4: PENDING.md.** Add a "Plan 2a landed" note: parity intentionally red until 2c; visual baselines to refresh on CI; the block-tools dependency still awaiting approval for 2b.
- [ ] **Step 5: Commit and PR.** Branch `feat/plan2a-identity-and-blocks` → PR to `main`, green checks, merge.

---

## Definition of done for plan 2a

- [ ] Six tokens in `brand.config.json` and `globals.css`, light and dark; the gate asserts nine shipping pairs pass and four forbidden pairs fail.
- [ ] Eight block schemas, eight components, all registered at the nine points, scaffold-marked `church`, on the styleguide in both themes with screenshots committed.
- [ ] `heroSection` has `frames`, `layout`, `facts`; `staffMember` has `group`, `phone`; both dropdowns in `NON_STEGA_FIELDS`.
- [ ] `siteSettings.church` holds the church's facts; the service-business fields are gone with their readers.
- [ ] `serviceAreaSection` and `guaranteeSection` are gone; the grep is clean.
- [ ] Header: seven plus Give; footer: the church's indigo footer.
- [ ] The desk and help are the secretary's; `audit:studio` exits 0 against the live project.
- [ ] 43 redirects; `check` 0 errors; `test:unit`, `format:check`, `npm test`, `audit:studio`, `verify-archive` green; deployed.

Plan 2b composes the eleven pages on top of this and cannot start before it lands.
