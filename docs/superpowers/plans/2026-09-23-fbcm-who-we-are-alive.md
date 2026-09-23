# Who We Are "Alive" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the live `/who-we-are` page as the approved "alive" prototype, as editable page-builder sections, with the shared parts (church-year colour, arch frames, building glyphs, the Praise and Proclaim mark) built so Home and other pages can reuse them.

**Architecture:** The prototype `docs/superpowers/prototypes/2026-09-23-who-we-are/c-alive.html` is the visual spec: every component below ports a named part of it (class names given per task) into Astro, Tailwind 4 tokens and the existing reveal system. Four new church section types (`watchwordSection`, `goalsSection`, `pledgeSection`, `letterSection`) and one new hero layout (`window`) carry the content; their look is decided by type and by position, never by a colour field (CLAUDE.md rule 9). The season is derived from the date by a pure module (rule 15). Content moves onto the page through the idempotent seed module `scripts/pages/who-we-are.mjs`, run only after the schema is deployed (rule 1).

**Tech Stack:** Astro 7, Sanity v6 (embedded Studio), Tailwind 4 (`@theme` tokens in `src/styles/globals.css`), node --test, Playwright, Cloudflare Workers.

**Spec:** `docs/superpowers/plans/2026-09-23-fbcm-distinctive-design-plan.md` (the why and the signature elements) and the prototype `docs/superpowers/prototypes/2026-09-23-who-we-are/c-alive.html` (the what). Nathan chose Direction B's boldness with A's glyphs and frames on 2026-09-23, with these post-review changes that override the prototype:
1. Buttons: square, with the gold rule under them. No arched or curved top.
2. The watchword band: a short intro on screen; the long explanation goes behind a native `<details>` "Read more".
3. The Worship photo is a placeholder until a front-on congregation photo exists; the component must take whatever landscape photo the editor picks and keep the title legible over it.
4. New copy (the three Witness ring labels, any new captions) is listed in `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`.

## Global Constraints

- Work in a worktree on branch `feat/who-we-are-alive` cut from current `main`. Do not push; Nathan merges locally, and the push to main is the deploy.
- The Astro / adapter / wrangler / Sanity versions are a matched set (CLAUDE.md rule 8). **No new dependencies.** Fonts stay Castoro Titling, Castoro, Sofia Sans Semi Condensed.
- No em-dashes in public-facing copy (rule 2). No AI-tell vocabulary (CLAUDE.md "Writing copy").
- Every UI change built and checked in light AND dark (rule 3), at 375 and 1280/1440, with a real scrollbar (rule 19), and at 320 with `scrollWidth === clientWidth` (rule 18).
- No colour, tone, surface, background or accent field on any block (rule 9; `src/lib/section-fields.test.ts` enforces it).
- Every new logic-driving dropdown field goes in `NON_STEGA_FIELDS` in `src/lib/cms-preview.ts` in the same commit (rule 8b). Never measure or compare a stega string; use `splitStega(text).cleaned` (preview rules).
- New church blocks sit inside the `// scaffold: church` region of `src/sanity/schemaTypes/churchSections.ts` and every registry they touch carries `scaffold: church` markers (rule 14).
- Stylesheet inline budget (rule 20): the site sheet is 134,161 B today against a 147,456 B limit. After every CSS task, build and run `grep -c '<link rel="stylesheet"' dist/client/index.html` (must print 0) and `grep -c '<style' dist/client/index.html` (at least 1), and report the sheet's byte size. **If the sheet passes 143,000 B, stop and report to the main session** rather than raising the limit.
- All motion uses the existing `[data-reveal]` / `.is-visible` system (`src/layouts/BaseLayout.astro` ~line 438, `globals.css` ~line 693) and is zeroed by the global `prefers-reduced-motion: reduce` reset. No scroll listeners, no scroll-jacking.
- WCAG AA contrast on every text/background pair, measured with `src/lib/contrast.ts`; new palette tokens join the `theme-tokens` gate test.
- Screenshots go in the session scratchpad, never the repo.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (or the executing model's line).

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/lib/church-year.ts` + `.test.ts` | date to season (name, label, token) | 1 |
| `src/styles/globals.css` (`@theme` + a `/* Church identity */` block) | season and goal palette tokens, light and dark; arch clip paths; reveal variants | 2 |
| `src/lib/theme-tokens.test.ts` | contrast pairs for the new tokens | 2 |
| `src/components/church/ArchFrame.astro` | lancet or door-arch framed `SanityImage`, with the opening reveal | 2 |
| `src/components/church/BuildingGlyph.astro` | the four building glyph SVGs (window, door, rose, basin) | 2 |
| `src/components/church/WatchwordMark.astro` | "Praise & PROCLAIM" lockup with rays | 2 |
| `src/components/church/SeasonLine.astro` | "Ordinary Time, the season after Pentecost" line | 2 |
| `src/components/CtaLink.astro` | new `rule` variant (square, gold rule under) | 2 |
| `src/pages/styleguide.astro` | fixtures for every new primitive | 2 |
| `src/sanity/schemaTypes/churchSections.ts` | `watchwordSection`, `goalsSection`, `pledgeSection`, `letterSection` | 3 |
| `src/sanity/schemaTypes/sections.ts` | hero `layout: 'window'`; register the four types in the page builder | 3 |
| `src/lib/queries.ts`, `src/lib/pageBuilder.types.ts`, `src/lib/sanity.types.ts` | projections and types | 3 |
| `src/lib/cms-preview.ts` | `glyph` into `NON_STEGA_FIELDS` | 3 |
| `src/lib/section-fields.ts` (+ test) | registry agreement for the new types | 3 |
| `src/sanity/guides/content.ts` | Help guide entries for the four sections | 3 |
| `src/components/Hero.astro` | the `window` layout (three arch frames, rays, season line) | 4 |
| `src/components/sections/WatchwordBand.astro` | watchword band | 4 |
| `src/components/sections/PledgeReading.astro` | pledge as responsive reading | 4 |
| `src/components/sections/PastorsLetter.astro` | the letter | 4 |
| `src/components/sections/GoalsBand.astro` + `src/lib/goal-layout.ts` (+ test) | four goals, four compositions | 5 |
| `src/components/sections/LinkCards.astro` | arch-door cards when every card has an image | 5 |
| `src/components/SectionRenderer.astro` | map the four types to components | 4 |
| `scripts/pages/who-we-are.mjs` | compose the page from the new sections | 6 |
| `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` | new sentences | 6 |
| docs: `docs/agent/components.md`, `docs/agent/changelog.md`, `docs/PENDING.md`, `CLAUDE.md` | record it | 7 |

Model split for execution: Task 1 and 3 Sonnet; Tasks 2, 4, 5, 6 Opus (visual judgement against the prototype); Task 7 Opus (gate). Task 1 may run in parallel with Task 2; everything else in order.

---

### Task 1: The church year

**Files:**
- Create: `src/lib/church-year.ts`
- Test: `src/lib/church-year.test.ts`

**Interfaces:**
- Produces: `type Season = 'advent' | 'christmas' | 'epiphany' | 'lent' | 'holy-week' | 'easter' | 'pentecost' | 'ordinary'`; `churchSeason(date: Date): { season: Season; label: string; token: SeasonToken }`; `type SeasonToken = 'violet' | 'white' | 'green' | 'purple' | 'red' | 'gold'`; `easterSunday(year: number): Date`.

Rules (Western calendar, dates in UTC to keep the build deterministic):
- Advent: from the 4th Sunday before 25 Dec to 24 Dec. Label "Advent". Token `violet`.
- Christmas: 25 Dec to 5 Jan. "Christmas". `white`.
- Epiphany: 6 Jan to the day before Ash Wednesday. "The season after Epiphany". `green`.
- Lent: Ash Wednesday (Easter minus 46 days) to the Saturday before Palm Sunday. "Lent". `purple`.
- Holy Week: Palm Sunday (Easter minus 7) to Holy Saturday. "Holy Week". `purple`.
- Easter: Easter Sunday to the day before Pentecost (Easter plus 49). "Easter". `gold`.
- Pentecost: Pentecost Sunday only. "Pentecost". `red`.
- Ordinary Time: the day after Pentecost to the day before Advent. "Ordinary Time, the season after Pentecost". `green`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/church-year.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { churchSeason, easterSunday } from './church-year.ts';

const d = (s: string) => new Date(`${s}T12:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

test('easter: known dates', () => {
  assert.equal(iso(easterSunday(2024)), '2024-03-31');
  assert.equal(iso(easterSunday(2025)), '2025-04-20');
  assert.equal(iso(easterSunday(2026)), '2026-04-05');
  assert.equal(iso(easterSunday(2027)), '2027-03-28');
  assert.equal(iso(easterSunday(2038)), '2038-04-25');
});

test('today, late September 2026, is Ordinary Time in green', () => {
  const s = churchSeason(d('2026-09-23'));
  assert.equal(s.season, 'ordinary');
  assert.equal(s.label, 'Ordinary Time, the season after Pentecost');
  assert.equal(s.token, 'green');
});

test('advent starts on the fourth Sunday before Christmas', () => {
  assert.equal(churchSeason(d('2026-11-28')).season, 'ordinary');
  assert.equal(churchSeason(d('2026-11-29')).season, 'advent');
  assert.equal(churchSeason(d('2026-12-24')).season, 'advent');
  assert.equal(churchSeason(d('2027-11-28')).season, 'advent');
});

test('christmas runs to 5 January, epiphany from the 6th', () => {
  assert.equal(churchSeason(d('2026-12-25')).season, 'christmas');
  assert.equal(churchSeason(d('2027-01-05')).season, 'christmas');
  assert.equal(churchSeason(d('2027-01-06')).season, 'epiphany');
});

test('lent, holy week, easter, pentecost around Easter 2026 (5 April)', () => {
  assert.equal(churchSeason(d('2026-02-17')).season, 'epiphany');
  assert.equal(churchSeason(d('2026-02-18')).season, 'lent'); // Ash Wednesday
  assert.equal(churchSeason(d('2026-03-28')).season, 'lent');
  assert.equal(churchSeason(d('2026-03-29')).season, 'holy-week'); // Palm Sunday
  assert.equal(churchSeason(d('2026-04-04')).season, 'holy-week');
  assert.equal(churchSeason(d('2026-04-05')).season, 'easter');
  assert.equal(churchSeason(d('2026-05-23')).season, 'easter');
  assert.equal(churchSeason(d('2026-05-24')).season, 'pentecost');
  assert.equal(churchSeason(d('2026-05-24')).token, 'red');
  assert.equal(churchSeason(d('2026-05-25')).season, 'ordinary');
});

test('every day of 2026 to 2030 resolves to a season with a label and token', () => {
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2031, 0, 1); t += 86_400_000) {
    const s = churchSeason(new Date(t));
    assert.ok(s.label.length > 0 && s.token.length > 0, new Date(t).toISOString());
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test src/lib/church-year.test.ts`
Expected: FAIL, cannot find module `./church-year.ts`.

- [ ] **Step 3: Implement**

```ts
// src/lib/church-year.ts
// Safe to edit by hand
// The church year, derived from the date at build time (CLAUDE.md rule 15:
// computed, never a field an editor retypes). The site rebuilds nightly, so the
// season line and the season colour turn over on their own. Western calendar;
// all arithmetic in UTC so a build in any timezone agrees.
export type Season =
  | 'advent' | 'christmas' | 'epiphany' | 'lent' | 'holy-week' | 'easter' | 'pentecost' | 'ordinary';
export type SeasonToken = 'violet' | 'white' | 'green' | 'purple' | 'red' | 'gold';
export interface ChurchSeason { season: Season; label: string; token: SeasonToken }

const DAY = 86_400_000;
const utc = (y: number, m: number, d: number) => Date.UTC(y, m, d);
const dayOf = (date: Date) => utc(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** Anonymous Gregorian computus (Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(utc(year, month, day));
}

/** First Sunday of Advent: the fourth Sunday before 25 December. */
function adventStart(year: number): number {
  const christmas = utc(year, 11, 25);
  const dow = new Date(christmas).getUTCDay(); // 0 = Sunday
  const sundayBefore = christmas - (dow === 0 ? 7 : dow) * DAY;
  return sundayBefore - 21 * DAY;
}

const S: Record<Season, ChurchSeason> = {
  advent: { season: 'advent', label: 'Advent', token: 'violet' },
  christmas: { season: 'christmas', label: 'Christmas', token: 'white' },
  epiphany: { season: 'epiphany', label: 'The season after Epiphany', token: 'green' },
  lent: { season: 'lent', label: 'Lent', token: 'purple' },
  'holy-week': { season: 'holy-week', label: 'Holy Week', token: 'purple' },
  easter: { season: 'easter', label: 'Easter', token: 'gold' },
  pentecost: { season: 'pentecost', label: 'Pentecost', token: 'red' },
  ordinary: { season: 'ordinary', label: 'Ordinary Time, the season after Pentecost', token: 'green' },
};

export function churchSeason(date: Date): ChurchSeason {
  const t = dayOf(date);
  const y = date.getUTCFullYear();
  if (t >= utc(y, 11, 25)) return S.christmas;
  if (t <= utc(y, 0, 5)) return S.christmas;
  if (t >= adventStart(y)) return S.advent;
  const easter = easterSunday(y).getTime();
  const ash = easter - 46 * DAY, palm = easter - 7 * DAY, pentecost = easter + 49 * DAY;
  if (t < ash) return S.epiphany;
  if (t < palm) return S.lent;
  if (t < easter) return S['holy-week'];
  if (t < pentecost) return S.easter;
  if (t === pentecost) return S.pentecost;
  return S.ordinary;
}
```

- [ ] **Step 4: Run the tests**

Run: `node --test src/lib/church-year.test.ts` then `npm run test:unit`
Expected: all pass; total is 733 plus the new tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/church-year.ts src/lib/church-year.test.ts
git commit -m "feat(church): the church year, derived from the date"
```

---

### Task 2: Identity tokens and shared primitives

Port these from the prototype. Read `c-alive.html` in full first, and open it in a browser at 1440 and 375 beside the styleguide while you work.

**Files:**
- Modify: `src/styles/globals.css` (`@theme` tokens; one new commented block `/* Church identity (2026-09-23) */` for the arch clip paths, the ray keyframes and the reveal variants)
- Modify: `src/lib/theme-tokens.test.ts`
- Create: `src/components/church/ArchFrame.astro`, `BuildingGlyph.astro`, `WatchwordMark.astro`, `SeasonLine.astro`
- Modify: `src/components/CtaLink.astro` (add `variant: 'rule'`)
- Modify: `src/pages/styleguide.astro` (fixtures for each)

**Interfaces:**
- Consumes: `churchSeason()` (Task 1).
- Produces:
  - Tokens (both themes): `--color-season-green`, `--color-season-violet`, `--color-season-purple`, `--color-season-red`, `--color-season-gold`, `--color-season-white`, `--color-goal-green`, `--color-goal-gold`, `--color-goal-purple`, `--color-goal-brown`, `--color-goal-ink-on-gold`, `--color-mint` (the accent text on green), `--color-gold-light`. Values: start from the prototype's `:root` custom properties; dark mode redeclares them under `.dark` so the bands stay rich but not glaring (lower the gold band's luminance and flip its text to light if AA demands). Every text pair used on a band is added to `theme-tokens.test.ts` with a 4.5:1 floor (3:1 for text 24px and up).
  - `<ArchFrame image={SanityImageSource} shape="lancet" | "door" width={number} sizes={string} alt={string} class?={string} reveal?={boolean} grade?={'warm' | 'none'} />` renders a `<figure>` with a `SanityImage` clipped by the arch path, the thin gold outline, and `data-reveal` (lancets rise from the bottom, doors open from the centre, as `.arch-lancet` / `.arch-door` in the prototype). `grade='warm'` applies the prototype's shared photo grade (`.graded` filter). Uses the image hotspot for `object-position` like `Hero.astro`'s split frame does.
  - `<BuildingGlyph name="window" | "door" | "rose" | "basin" class?={string} />` inlines the matching `<symbol>` paths from the prototype (`#i-window`, `#i-door`, `#i-rose`, `#i-basin`, and the shared `#qf` quatrefoil), `aria-hidden="true"`, stroke `currentColor`.
  - `<WatchwordMark size="band" | "hero" />` renders "Praise", the hero ampersand, "PROCLAIM" and the rays (`.mark` and `#ray3` in the prototype); the rays and ampersand animate in once via `data-reveal`; the whole mark has `role="img"` and `aria-label="Praise and Proclaim"`, with the visible letters `aria-hidden`.
  - `<SeasonLine date?={Date} />` renders the rule plus `churchSeason(date ?? new Date()).label` and sets `data-season={season}` on itself.
  - `CtaLink` `variant="rule"`: square corners, the church palette's fill, a 3px gold rule beneath with a small gap, 44px minimum touch target, visible focus ring, hover spreads three small rays from the right edge (prototype `.btn` rays; NOT its arched top, see spec change 1).

- [ ] **Step 1:** Add the `theme-tokens` contrast cases for every pair above (they fail: the tokens do not exist). Run `node --test src/lib/theme-tokens.test.ts`; expected FAIL naming the missing tokens.
- [ ] **Step 2:** Add the tokens to `@theme` and `.dark`. Run the test; expected PASS. If a pair fails in dark mode, adjust the dark value, never the floor.
- [ ] **Step 3:** Build the four components and the `rule` variant, porting markup and CSS from the prototype. Prefer Tailwind utilities with the new tokens; put only what utilities cannot express (clip paths, keyframes, the grade filter) in the `Church identity` block.
- [ ] **Step 4:** Add a "Church identity" section to `src/pages/styleguide.astro` showing: both arch shapes with a real photo, all four glyphs, the mark at both sizes, the season line, and a `rule` button (default, hover, focus).
- [ ] **Step 5:** `npm run check && npm run test:unit && npm run build`, then the rule 20 check, and report the stylesheet byte size.
- [ ] **Step 6:** Screenshot `/styleguide` at 1440 and 375, light and dark, and compare each primitive against the prototype side by side. Fix until they match. Test reduced motion: with `prefers-reduced-motion: reduce` emulated, frames and rays are in their final state.
- [ ] **Step 7:** `npm run parity:compare`. Expected: only `styleguide` differs (plus every page's inline stylesheet bytes). Do not recapture yet.
- [ ] **Step 8: Commit**

```bash
git add src/styles/globals.css src/lib/theme-tokens.test.ts src/components/church src/components/CtaLink.astro src/pages/styleguide.astro
git commit -m "feat(church): identity tokens, arch frames, building glyphs, the watchword mark"
```

---

### Task 3: The four section schemas and the window hero layout

**Files:**
- Modify: `src/sanity/schemaTypes/churchSections.ts` (inside the `scaffold: church` region)
- Modify: `src/sanity/schemaTypes/sections.ts` (hero `layout` gains `window`; the page-builder `of` list gains the four types, marked `// scaffold: church`)
- Modify: `src/sanity/schemaTypes/index.ts` (export and register)
- Modify: `src/lib/queries.ts` (image projections for the new image fields, using `IMAGE_PROJECTION` exactly as `ministrySection` does)
- Modify: `src/lib/pageBuilder.types.ts`, regenerate `src/lib/sanity.types.ts` with `npm run typegen`
- Modify: `src/lib/cms-preview.ts` (`glyph` into `NON_STEGA_FIELDS`)
- Modify: `src/lib/section-fields.ts` and its test if the registry needs the new types listed
- Modify: `src/sanity/guides/content.ts` (a guide entry per section: what each field is for, in plain words)

**Interfaces:**
- Produces the document shapes Tasks 4 to 6 render:

```ts
// in churchSections.ts, beside the existing blocks, reusing its `eyebrow`/`heading` helpers
export const watchwordSection = defineType({
  name: 'watchwordSection',
  title: 'Watchword (Praise and Proclaim)',
  type: 'object',
  fields: [
    heading, // "Our Watchword"
    defineField({ name: 'intro', title: 'Short introduction', type: 'text', rows: 3,
      description: 'Two or three sentences shown beside the mark.' }),
    defineField({ name: 'more', title: 'Read more', type: 'array', of: [{ type: 'block' }],
      description: 'The full explanation. Shown when a visitor opens "Read more".' }),
    defineField({ name: 'verse', title: 'Verse', type: 'text', rows: 3,
      description: 'The verse, without quotation marks. The words praise and proclaim are highlighted automatically.' }),
    defineField({ name: 'reference', title: 'Reference', type: 'string', description: 'Like "Isaiah 12:4".' }),
    defineField({ name: 'praise', title: 'What "Praise" means', type: 'text', rows: 2 }),
    defineField({ name: 'proclaim', title: 'What "Proclaim" means', type: 'text', rows: 2 }),
    anchorField(),
  ],
  preview: { select: { title: 'heading', subtitle: 'reference' } },
});

const goal = defineArrayMember({
  type: 'object',
  name: 'goal',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', description: 'Like "Worship".', validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'string', description: 'Like "Worshiping as the Body of Christ".' }),
    defineField({ name: 'aside', title: 'In brackets', type: 'string', description: 'Like "Discipleship". Leave blank for none.' }),
    defineField({ name: 'glyph', title: 'Building drawing', type: 'string',
      options: { list: [
        { title: 'Window', value: 'window' }, { title: 'Door', value: 'door' },
        { title: 'Rose window', value: 'rose' }, { title: 'Basin niche', value: 'basin' } ], layout: 'radio' },
      validation: (r) => r.required() }),
    defineField({ name: 'summary', title: 'Opening sentence', type: 'text', rows: 3 }),
    defineField({ name: 'quote', title: 'Pull quote', type: 'string', description: 'Optional, like "Come and see." Shown large on the second goal.' }),
    defineField({ name: 'points', title: 'Points', type: 'array', validation: (r) => r.max(4),
      of: [defineArrayMember({ type: 'object', name: 'goalPoint', fields: [
        defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'short', title: 'Short label', type: 'string',
          description: 'One or two words used on the drawing, like "Serve" or "In Muncie". Leave blank to use the title.' }),
        defineField({ name: 'body', title: 'Text', type: 'text', rows: 3 }),
      ], preview: { select: { title: 'title', subtitle: 'short' } } })] }),
    defineField({ name: 'photos', title: 'Photos', type: 'array', validation: (r) => r.max(6),
      description: 'People doing this. The first is the largest.',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [
        defineField({ name: 'alt', title: 'Describe the photo', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'caption', title: 'Caption', type: 'string' }) ] })] }),
  ],
  preview: { select: { title: 'name', subtitle: 'subtitle' } },
});

export const goalsSection = defineType({
  name: 'goalsSection',
  title: 'Our goals (four bands)',
  type: 'object',
  description: 'Each goal gets its own colour and layout, in order: green, gold, purple, brown.',
  fields: [heading, defineField({ name: 'intro', title: 'Introduction', type: 'text', rows: 3 }),
    defineField({ name: 'goals', title: 'Goals', type: 'array', of: [goal], validation: (r) => r.min(1).max(4) }),
    anchorField()],
  preview: { select: { title: 'heading' } },
});

export const pledgeSection = defineType({
  name: 'pledgeSection',
  title: 'Pledge (said together)',
  type: 'object',
  fields: [
    heading, // "Our Pledge"
    defineField({ name: 'intro', title: 'Introduction', type: 'text', rows: 2 }),
    defineField({ name: 'instruction', title: 'Instruction line', type: 'string',
      description: 'Like "When a member joins, we say this pledge together as a church."' }),
    defineField({ name: 'opening', title: 'Opening line', type: 'string',
      description: 'Like "We pledge ourselves to be the family of God for you in this place:"' }),
    defineField({ name: 'lines', title: 'Lines said together', type: 'array', validation: (r) => r.min(1).max(8),
      of: [defineArrayMember({ type: 'object', name: 'pledgeLine', fields: [
        defineField({ name: 'text', title: 'Line', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'reference', title: 'Scripture', type: 'string', description: 'Like "Galatians 6:2".' }),
      ], preview: { select: { title: 'text', subtitle: 'reference' } } })] }),
    defineField({ name: 'after', title: 'Text after the pledge', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'image', title: 'Photo', type: 'image', options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string' })] }),
    anchorField(),
  ],
  preview: { select: { title: 'heading' } },
});

export const letterSection = defineType({
  name: 'letterSection',
  title: 'Letter',
  type: 'object',
  fields: [
    heading, // "A Note From Our Pastors"
    defineField({ name: 'body', title: 'Letter', type: 'array', of: [{ type: 'block' }], validation: (r) => r.required() }),
    defineField({ name: 'signature', title: 'Signed', type: 'string', description: 'Like "Kendall & Jonathan".' }),
    defineField({ name: 'signatureNote', title: 'Under the signature', type: 'string', description: 'Like "Co-Pastors, First Baptist Church Muncie".' }),
    defineField({ name: 'portrait', title: 'Portrait', type: 'image', options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string' })] }),
    anchorField(),
  ],
  preview: { select: { title: 'heading', subtitle: 'signature' } },
});
```

Hero: add `{ title: 'Three arched photos (window)', value: 'window' }` to the `heroSection` `layout` list in `sections.ts`, and extend the hero's `frames` description: "Window layout: the first three photos, the middle one largest." `layout` is already in `NON_STEGA_FIELDS`.

- [ ] **Step 1:** Add `'glyph'` to `NON_STEGA_FIELDS` with a one-line comment naming `goalsSection`.
- [ ] **Step 2:** Add the schemas and registrations above. Run `npm run typegen`.
- [ ] **Step 3:** Run `npm run test:unit`. The `section-fields` gate will say what the registry needs; make it agree (the four types carry no `headingAccent`, so they must be listed wherever the registry lists blocks without one). Expected: all pass.
- [ ] **Step 4:** `npm run audit:studio` (checks 1 and 2 run on schema alone). Expected: no findings for the new types.
- [ ] **Step 5:** `npm run check && npm run build`. Expected: 0 errors. Nothing renders the new types yet, so `npm run parity:compare` must show no page differences beyond Task 2's.
- [ ] **Step 6:** `npm run dev`, open `/studio`, add each new section to a DRAFT copy of any page (do not publish), fill every field, and read the console: no errors, previews show sensible titles. Discard the draft. Screenshot the four editors into the scratchpad.
- [ ] **Step 7: Commit**

```bash
git add src/sanity src/lib/queries.ts src/lib/pageBuilder.types.ts src/lib/sanity.types.ts src/lib/cms-preview.ts src/lib/section-fields.ts src/lib/section-fields.test.ts
git commit -m "feat(church): watchword, goals, pledge and letter sections; the window hero layout"
```

---

### Task 4: The window hero, watchword band, pledge reading and letter

**Files:**
- Modify: `src/components/Hero.astro` (new branch for `layout === 'window'`)
- Create: `src/components/sections/WatchwordBand.astro`, `PledgeReading.astro`, `PastorsLetter.astro`
- Modify: `src/components/SectionRenderer.astro` (map `watchwordSection`, `pledgeSection`, `letterSection`, and `goalsSection` to a stub that renders nothing until Task 5, all inside `scaffold: church` markers)
- Modify: `src/pages/styleguide.astro` (one fixture per band, with fixture data typed from `pageBuilder.types.ts`)

**Interfaces:**
- Consumes: `ArchFrame`, `BuildingGlyph`, `WatchwordMark`, `SeasonLine`, `CtaLink variant="rule"` (Task 2); the types from Task 3.
- Each band component takes `block` (its typed section) plus the usual `idPrefix`/`id` props the other section components take (copy the prop shape from `ScriptureBand.astro`).

Port, in order, with the prototype's class names as the reference:
1. **Hero `window`** (`.opener`): season-coloured band (`data-season` from `SeasonLine` drives the band colour through the season tokens), the season line, the small gold "Who We Are" label (the hero `eyebrow`), the headline as a sentence using the `headline-scale` `sentence` treatment with the prototype's italic and mint accent (the existing script-accent split `scriptWord` supplies the mint words; do not add a second accent mechanism), buttons as `rule` variants, three `ArchFrame shape="lancet"` from `frames[0..2]` (middle largest, rays above it), the window dropping over the band's bottom edge into the next band. Fewer than three frames: two or one centred lancet. At 375 the window sits under the words at full width (prototype 375 shot).
2. **WatchwordBand** (`.watch`): dark green band, `WatchwordMark size="band"`, the verse with the words "praise" and "proclaim" highlighted (match case-insensitively on `splitStega(verse).cleaned`, then wrap the matching ranges of the RAW string so stega survives; add a unit-tested helper `highlightWords(raw: string, words: string[]): Array<{ text: string; hit: boolean }>` in `src/lib/highlight-words.ts` with tests for stega-carrying input), the reference, the two meanings, the intro, and `more` inside `<details><summary>Read more</summary>...</details>` rendered with `PortableText variant="bare"`.
3. **PledgeReading** (`.pledge`): the instruction line, the opening, each line with "All" in the left margin and the reference in the right margin (margin notes collapse under the line at 375), each line `data-reveal` with a stepped `data-reveal-delay`, the `after` text in one column, the photo as an `ArchFrame shape="door"`. Fix the prototype's empty patch under the photo at 1440: the photo column must not outgrow the reading.
4. **PastorsLetter** (`.letter`): letterhead rule, one column at a 62 to 68ch measure with a drop cap on the first paragraph only, the portrait as a large `ArchFrame shape="lancet"`, the signature in Castoro italic slightly rotated with the gold underline that draws in on reveal, the signature note beneath.

- [ ] **Step 1:** Write `src/lib/highlight-words.test.ts` (plain input; mixed case; a stega-encoded input built with `stegaEncodeSourceMap` or by inserting U+200B/U+FEFF runs as `span-split.test.ts` does, asserting the joined output equals the raw input exactly). Run: FAIL.
- [ ] **Step 2:** Implement `highlight-words.ts`. Run: PASS.
- [ ] **Step 3:** Build the four renderers and the `SectionRenderer` mapping. `npm run check`.
- [ ] **Step 4:** Styleguide fixtures; build; screenshot each band at 1440 and 375, light and dark, beside the prototype's matching region. Iterate until they match in composition, scale and colour (dark mode is new; it must look intentional, not inverted).
- [ ] **Step 5:** Rule 20 check and byte size. `npm test` with `PLAYWRIGHT_PORT=4533` (axe light and dark cover the styleguide fixtures).
- [ ] **Step 6: Commit**

```bash
git add src/components src/lib/highlight-words.ts src/lib/highlight-words.test.ts src/pages/styleguide.astro src/styles/globals.css
git commit -m "feat(church): window hero, watchword band, pledge reading, pastors' letter"
```

---

### Task 5: The four goals, and arch-door link cards

**Files:**
- Create: `src/lib/goal-layout.ts`, `src/lib/goal-layout.test.ts`
- Create: `src/components/sections/GoalsBand.astro`
- Modify: `src/components/SectionRenderer.astro` (replace the Task 4 stub)
- Modify: `src/components/sections/LinkCards.astro`
- Modify: `src/pages/styleguide.astro`

**Interfaces:**
- Produces: `type GoalLayout = 'nave' | 'path' | 'rings' | 'doors'`; `type GoalColour = 'green' | 'gold' | 'purple' | 'brown'`; `goalLayout(index: number, goal: { points?: unknown[]; photos?: unknown[] }): { layout: GoalLayout; colour: GoalColour }`.
  - Colour is by position: 0 green, 1 gold, 2 purple, 3 brown.
  - Layout is by position (0 `nave`, 1 `path`, 2 `rings`, 3 `doors`), demoted to `nave` when the goal lacks what the layout needs: `path` needs 2 or more points, `rings` needs 3 or more photos, `doors` needs 2 or more points.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/goal-layout.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalLayout } from './goal-layout.ts';

const g = (points: number, photos: number) => ({ points: Array(points).fill({}), photos: Array(photos).fill({}) });

test('position sets colour and layout', () => {
  assert.deepEqual(goalLayout(0, g(3, 2)), { layout: 'nave', colour: 'green' });
  assert.deepEqual(goalLayout(1, g(3, 2)), { layout: 'path', colour: 'gold' });
  assert.deepEqual(goalLayout(2, g(3, 6)), { layout: 'rings', colour: 'purple' });
  assert.deepEqual(goalLayout(3, g(3, 2)), { layout: 'doors', colour: 'brown' });
});

test('a layout the goal cannot fill falls back to nave, keeping its colour', () => {
  assert.deepEqual(goalLayout(1, g(1, 2)), { layout: 'nave', colour: 'gold' });
  assert.deepEqual(goalLayout(2, g(3, 2)), { layout: 'nave', colour: 'purple' });
  assert.deepEqual(goalLayout(3, g(0, 0)), { layout: 'nave', colour: 'brown' });
});

test('missing arrays are treated as empty', () => {
  assert.deepEqual(goalLayout(1, {}), { layout: 'nave', colour: 'gold' });
});
```

- [ ] **Step 2:** Run `node --test src/lib/goal-layout.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement**

```ts
// src/lib/goal-layout.ts
// Safe to edit by hand
// Each of the four goals is drawn in its own composition and colour, decided by
// its POSITION (the church's order is Worship, The Way, Witness, Work), never by
// a field (CLAUDE.md rule 9). A composition the goal cannot fill falls back to
// the nave, so an editor can never produce an empty drawing.
export type GoalLayout = 'nave' | 'path' | 'rings' | 'doors';
export type GoalColour = 'green' | 'gold' | 'purple' | 'brown';

const COLOURS: GoalColour[] = ['green', 'gold', 'purple', 'brown'];
const LAYOUTS: GoalLayout[] = ['nave', 'path', 'rings', 'doors'];

export function goalLayout(
  index: number,
  goal: { points?: unknown[] | null; photos?: unknown[] | null },
): { layout: GoalLayout; colour: GoalColour } {
  const colour = COLOURS[index % 4];
  const wanted = LAYOUTS[index % 4];
  const points = goal.points?.length ?? 0;
  const photos = goal.photos?.length ?? 0;
  const fits =
    wanted === 'nave' ||
    (wanted === 'path' && points >= 2) ||
    (wanted === 'rings' && photos >= 3) ||
    (wanted === 'doors' && points >= 2);
  return { layout: fits ? wanted : 'nave', colour };
}
```

- [ ] **Step 4:** Run the test; expected PASS.
- [ ] **Step 5:** Build `GoalsBand.astro` from the prototype's `section[aria-labelledby="t-goals"]`: the heading and intro, the colour-coded index of the four goals (anchor links), then one `<article>` per goal drawn by its `goalLayout`:
  - `nave` (`.g-worship`): full-bleed first photo with the title legible over it (gradient measured at AA over the photo's brightest 90%, as the prototype did; must hold for ANY landscape photo, see spec change 3), later photos as lancets rising over its edge, points in columns below.
  - `path` (`.g-way`): the pull quote large, door-arch steps along a dotted path, one per point, vertical trail at 375.
  - `rings` (`.g-witness`): photos as lancets in an arc over three widening rings labelled by the points' `short` labels (fall back to titles).
  - `doors` (`.g-work`): one door arch per point labelled by `short`, photos in the doors.
  Each carries its `BuildingGlyph`, its band colour, and `ArchFrame grade="warm"` photos. Consider the scroll-linked background shift only if it needs no scroll listener (a CSS `view-timeline` with an `@supports` fallback to the four flat colours); otherwise skip it and say so.
- [ ] **Step 6:** `LinkCards.astro`: when EVERY card has an image, draw the cards as arch doors (prototype `.next`); otherwise unchanged. Check which pages have link cards with images on every card (`scripts/pages/home.mjs`, `who-we-are.mjs`, and the live data) and report exactly which pages this changes.
- [ ] **Step 7:** Styleguide fixture for each composition, including each fallback case. Screenshots at 1440 and 375, light and dark, against the prototype. Rule 20 check. `npm run test:unit`, `npm run check`, `npm test` (`PLAYWRIGHT_PORT=4533`).
- [ ] **Step 8: Commit**

```bash
git add src/lib/goal-layout.ts src/lib/goal-layout.test.ts src/components src/pages/styleguide.astro src/styles/globals.css
git commit -m "feat(church): the four goals in four compositions; arch-door link cards"
```

---

### Task 6: Compose the page

**Files:**
- Modify: `scripts/pages/who-we-are.mjs`
- Modify: `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` (regenerate the way the header of that file says)

The new `pageBuilder` order: `heroSection` (`layout: 'window'`, three people photos: the prototype used the grandmother, the two girls at the glass and the small child) then `watchwordSection`, `goalsSection`, `pledgeSection`, `letterSection`, `linkCardsSection` ("Where To Go Next", four cards with images: Sunday Worship, Contact Us, Meet Our Staff, the Welcome Booklet), then the existing closing CTA if the prototype keeps one (it does not; drop it and note it). The `scriptureBandSection` and the three `richTextSection`s and the `staffGridSection` it replaces come off this page; the staff grid lives on `/staff`.

Rules for the content:
- Headings are the church's own: "Our Watchword", "Our Goals", "Our Pledge", "A Note From Our Pastors", "Where To Go Next". Goal names and subtitles, the pledge lines and references and the full letter come verbatim from `scripts/data/pages/who-we-are.txt` through the file's existing `pick()` / `linesBetween()` helpers, which throw when a line moves.
- Photos come from the media library by asset id. Resolve the prototype's archive filenames to asset ids the way the photo placement pass does (`scripts/data/page-images.json` and the placement pass's helper; read `git show a2fd6ac --stat` to find it). Every photo gets real alt text from `scripts/data/photo-library.json` `altText`.
- The Witness ring labels ("In the church", "In Muncie", "Everywhere") and the Work door labels ("Serve", "Support", "Share": these three are the church's own point titles) go in the points' `short` field; the ring labels are NEW copy and go in the module's `newCopy` list.
- The watchword `intro` is the first two sentences of the church's watchword text; the rest goes in `more`.

- [ ] **Step 1:** Rewrite the module and its header comment (keep the header's discipline: say what is cut and why).
- [ ] **Step 2:** Dry run: `npm run seed-pages -- --only who-we-are` (dry by default; nothing is written without `--apply`). Read the whole plan it prints. Expected: one page document replaced, the backup path printed, no other document touched.
- [ ] **Step 3:** Do NOT apply. The schema is not deployed yet (CLAUDE.md rule 1). Instead, add a styleguide fixture `whoWeAreFixture` built by importing the module's section array with the dry-run data (or, if the module needs a Sanity client to resolve assets, render the fixture from the prototype's archive files through Astro `<Image>`), so the full page composition can be shot locally at 1440 and 375, light and dark, beside the prototype.
- [ ] **Step 4:** Regenerate the copy-approval note and check the new lines appear.
- [ ] **Step 5: Commit**

```bash
git add scripts/pages/who-we-are.mjs docs/superpowers/notes/2026-09-19-copy-for-church-approval.md
git commit -m "feat(who-we-are): compose the page from the church sections"
```

---

### Task 7: Gate, docs, and the page review

**Files:**
- Modify: `docs/agent/components.md`, `docs/agent/changelog.md`, `docs/PENDING.md`, `CLAUDE.md` (the `npm run test:unit` bullet: add `church-year`, `goal-layout`, `highlight-words`; update the test count), `scripts/.parity/` (recapture)

- [ ] **Step 1:** Full gate: `npm run check`, `npm run format:check`, `npm run test:unit`, `npm run build`, rule 20 (report bytes), `PLAYWRIGHT_PORT=4533 npm test`, `npm run audit:studio`.
- [ ] **Step 2:** `npm run parity:compare`: list every page that differs and why (expected: styleguide, plus any page whose link cards all have images). Then recapture, rebuild, compare, and prove the fixpoint (stylesheet bytes identical on both builds, 162/162 PASS). Commit the recapture on its own.
- [ ] **Step 3:** Docs: components.md entries for every new component and section; a changelog entry; PENDING items for (a) the Worship photo needing a front-on congregation shot, (b) the seed `--write` to run after deploy, (c) the new copy awaiting church approval; CLAUDE.md test list.
- [ ] **Step 4:** Preview check (the Studio must still be click-to-edit): build, copy `.dev.vars` into `dist/server/`, `npx wrangler dev -c dist/server/wrangler.json`, open `/studio` Presentation on a draft page carrying each new section, and click the watchword verse, a goal name, a goal point, a pledge line and the letter signature: each must open its field. Screenshot into the scratchpad.
- [ ] **Step 5:** Report to the main session with the evidence: gate outputs with numbers, parity list, byte sizes, screenshots of the styleguide fixtures and the Studio editors, and anything unsure.

**After Nathan merges and the deploy is green** (main session, not the implementer): run `npm run seed-pages -- --only who-we-are` (read the plan), then `npm run seed-pages -- --only who-we-are --apply` (backup first), let the publish webhook rebuild, then shoot `/who-we-are` in production at 1440 and 375, light and dark, beside the prototype, and send Nathan the before/after.
