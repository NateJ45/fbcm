# RichText Ledger and Photo Shapes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the two variant-loop winners into the real components: `RichTextSection` lays its body out from the body's own shape (the "Ledger"), and `ImageText` places its photograph by the photograph's own shape (ground, window, frame, plate, legend, or a row beside the text), so no photograph ever again sits as a large rectangle in a column below its words.

**Architecture:** Two pure, unit-tested modules decide everything at build time from data that already exists: `src/lib/rich-shape.ts` classifies a Portable Text body into a shape and a list of pieces, and `src/lib/photo-shape.ts` classifies each ImageText band's rendered picture and runs a page-level pass (one lancet window per page, at most two grounds). One shared Astro renderer, `RichBody.astro`, draws the pieces for both components, so a photo band's text and a text band's text are the same grammar. Zero schema changes; SectionRenderer gains one page-level call and one prop.

**Tech Stack:** Astro 7, TypeScript strict, Tailwind 4 (tokens in `src/styles/globals.css` `@theme`), React 19 `@portabletext/react` via `src/components/PortableText.tsx`, node `--test` unit tests, Playwright, the parity harness.

**Spec:** the design decisions are recorded in `docs/superpowers/notes/2026-09-20-design-research.md` section 7 (the photo rule and the audits) and in the two approved prototypes, which are the visual source of truth and carry their own full rule text in a "Rules" drawer:
- `docs/superpowers/prototypes/2026-09-22-richtext-and-photos/richtext/index.html` (variant A2 "Ledger" hybrid, all 29 rich-text bands on the site, grouped by page; the band data it was built from is `bands.json` beside it)
- `docs/superpowers/prototypes/2026-09-22-richtext-and-photos/photos/index.html` (variant P3 "Ground and window", P1's row as its default branch, with the lancet fade fix)

Open both in a browser before starting; every visual question in this plan is answered by "make it look like the prototype". They live under `docs/`, which `globals.css` excludes from Tailwind's scan (`@source not '../../docs'`), so they cannot leak classes into the build.

## Global Constraints

- **Zero schema changes.** No new fields, no renamed fields, no typegen, no dataset writes. Inputs are only: Portable Text block styles, list items, span text, the image asset's `WxH` from its ref, `image.alt`, the band's `eyebrow`/`heading`, `imageSide`, and the band's position on the page. (CLAUDE.md rules 1 and 15.)
- **Never measure or compare a stega string.** Every word count, regex, prefix test and split point runs on `splitStega(text).cleaned` from `src/lib/preview-stega.ts`. When a string is split for display, the first part is `cleaned.slice(0, i)` and the second is the RAW string's tail (`raw.slice(j)`), so the invisible payload stays on the second part and that part stays click-to-edit. (CLAUDE.md, "Live draft preview".)
- **No new logic-driving schema field**, so nothing is added to `NON_STEGA_FIELDS`. `imageSide` and `align` are already in it (`src/lib/cms-preview.ts:95,100`); verify that before Task 8 and stop if they are not.
- **No new public copy, no em-dashes in visible text.** The components add no strings. (Rule 2.)
- **One left edge per page** (rule 17): every heading and every body starts at the container's column 1; internal alignment uses column 6 as the second edge (the column ImageText already starts its prose on).
- **Bleeds use `100cqw` against `#main`, never `100vw`** (rule 19). The existing `.bleed-left` / `.bleed-right` utilities already do this; the ground uses `width: 100cqw`.
- **No colour fields on blocks; cadence stays in SectionRenderer** (rule 9). The photo system reads the band's surface through a CSS custom property, `--band`, that the component sets from its `surface` prop.
- **Light and dark on every change** (rule 3); **verify at 1440 with real scrollbars and at 390 and 320** (rules 18, 19, and "Verifying UI changes").
- **Two new type sizes, no more:** `--text-item: clamp(1.125rem, 1rem + 0.4vw, 1.375rem)` and `--text-dense: 1rem`.
- **Matched dependency set** (rule 8): install nothing.
- **Git:** work in a worktree branch `feat/richtext-ledger-photo-shapes`. Nathan merges to `main` locally; a push to `main` deploys. Never push without being asked; read the gate before pushing (memory: "read the gate, then push").

## Prerequisite (before Task 1, on `main`, needs Nathan's go-ahead)

The prototypes, this plan and the research note addendum are uncommitted files in the main checkout. They must be committed to `main` before the worktree is cut, or the worktree will not contain them:

```bash
git add docs/superpowers/prototypes/2026-09-22-richtext-and-photos docs/superpowers/notes/2026-09-20-design-research.md docs/superpowers/plans/2026-09-22-fbcm-richtext-ledger-and-photo-shapes.md
git commit -m "docs: RichText Ledger and photo-shape prototypes, audit addendum, port plan"
```

Docs-only, render-neutral; no push required to start work.

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/lib/span-split.ts` | Create | Stega-safe splitting of a Portable Text block's first span: `splitBlockText`, and the three recognisers (`sharedPrefix`, `pipedSplit`, `runInSplit`) |
| `src/lib/span-split.test.ts` | Create | Unit tests, including stega-encoded inputs |
| `src/lib/rich-shape.ts` | Create | The Ledger classifier: `classifyRichText(body, opts)` returns a shape and pieces; also the shared lede rule `isLedeParagraph` |
| `src/lib/rich-shape.test.ts` | Create | One test per branch and the edge cases |
| `src/lib/photo-shape.ts` | Create | Photo classifier and page pass: `photoAspect`, `isArchival`, `findLegend`, `assignPhotoShapes(rows)` |
| `src/lib/photo-shape.test.ts` | Create | Unit tests for every branch and the page budget |
| `src/components/PortableText.tsx` | Modify | Add `variant?: 'prose' \| 'bare'` so pieces can render spans and paragraphs without the prose margins |
| `src/components/sections/RichBody.astro` | Create | Renders `RichPiece[]` (the one renderer both components use) |
| `src/components/sections/RichTextSection.astro` | Rewrite | Head above, body through `classifyRichText` + `RichBody` |
| `src/components/sections/Lancet.astro` | Create | The lancet clip-path and gold moulding for the window |
| `src/components/sections/ImageText.astro` | Rewrite | Six branches by `shape` prop; body through `RichBody` |
| `src/components/SectionRenderer.astro` | Modify | Call `assignPhotoShapes` once on the rendered pictures; pass `shape` to ImageText |
| `src/styles/globals.css` | Modify | Two tokens in `@theme`; `.rt-*` (Ledger) and `.ph-*` (photo) component CSS |
| `docs/agent/components.md`, `docs/agent/changelog.md`, `docs/PENDING.md`, `CLAUDE.md` | Modify | Record the two systems and their gotchas (Task 10) |

---

## Part A: RichTextSection, the Ledger

### Task 1: Stega-safe span splitting

**Files:**
- Create: `src/lib/span-split.ts`
- Test: `src/lib/span-split.test.ts`

**Interfaces:**
- Consumes: `splitStega(text: string): { cleaned: string; encoded: string }` from `src/lib/preview-stega.ts`.
- Produces:
  ```ts
  export interface PtSpan { _type: 'span'; _key?: string; text: string; marks?: string[] }
  export interface PtBlock { _type: 'block'; _key?: string; style?: string; listItem?: string; level?: number; children?: PtSpan[]; markDefs?: unknown[] }
  export function blockText(b: PtBlock): string                       // cleaned visible text of all spans
  export function wordCount(s: string): number                        // on cleaned text
  export function splitBlockText(b: PtBlock, headEnd: number, tailStart: number): { head: string; tail: PtBlock } | null
  export function sharedPrefix(items: string[]): string               // '' when none
  export function pipedSplit(b: PtBlock): { name: string; tail: PtBlock } | null
  export function runInSplit(b: PtBlock): { label: string; tail: PtBlock } | null
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/span-split.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blockText, wordCount, splitBlockText, sharedPrefix, pipedSplit, runInSplit, type PtBlock,
} from './span-split.ts';

// A stega run is four or more of these zero-width characters appended to the end.
const STEGA = '​‌‍﻿​‌‍﻿';
const blk = (text: string, extra: Partial<PtBlock> = {}): PtBlock => ({
  _type: 'block', style: 'normal', markDefs: [], children: [{ _type: 'span', text, marks: [] }], ...extra,
});

test('blockText joins spans and strips stega', () => {
  const b: PtBlock = { _type: 'block', children: [
    { _type: 'span', text: 'To attend ' }, { _type: 'span', text: 'the worship' + STEGA, marks: ['em'] },
  ] };
  assert.equal(blockText(b), 'To attend the worship');
});

test('wordCount ignores stega and collapses whitespace', () => {
  assert.equal(wordCount('One  two\tthree' + STEGA), 3);
  assert.equal(wordCount(''), 0);
});

test('splitBlockText keeps the stega payload on the tail', () => {
  const b = blk('To attend the worship' + STEGA);
  const out = splitBlockText(b, 2, 3);
  assert.ok(out);
  assert.equal(out.head, 'To');
  assert.equal(out.tail.children![0].text, 'attend the worship' + STEGA);
});

test('splitBlockText refuses when the split point is not inside the first span', () => {
  const b: PtBlock = { _type: 'block', children: [
    { _type: 'span', text: 'To' }, { _type: 'span', text: ' attend', marks: ['strong'] },
  ] };
  assert.equal(splitBlockText(b, 3, 3), null);
});

test('splitBlockText keeps later spans on the tail untouched', () => {
  const b: PtBlock = { _type: 'block', children: [
    { _type: 'span', text: 'Charis | For college ' }, { _type: 'span', text: 'students', marks: ['strong'] },
  ] };
  const out = splitBlockText(b, 6, 9)!;
  assert.equal(out.head, 'Charis');
  assert.deepEqual(out.tail.children!.map((s) => s.text), ['For college ', 'students']);
});

test('sharedPrefix finds up to three shared opening words', () => {
  assert.equal(sharedPrefix(['To attend the worship', 'To contribute cheerfully', 'To aid and assist']), 'To');
  assert.equal(sharedPrefix(['God is Love.', 'God is Spirit.', 'God is Holy.']), 'God is');
  assert.equal(sharedPrefix(['Sunday school', 'Worship', 'Donut hour']), '');
});

test('sharedPrefix never takes a whole item', () => {
  assert.equal(sharedPrefix(['Nursery', 'Nursery wing']), '');
});

test('pipedSplit splits a name | description item on cleaned text', () => {
  const out = pipedSplit(blk('Snowbirds Life Group | Locations vary' + STEGA))!;
  assert.equal(out.name, 'Snowbirds Life Group');
  assert.equal(out.tail.children![0].text, 'Locations vary' + STEGA);
  assert.equal(pipedSplit(blk('No pipe here')), null);
});

test('runInSplit takes a capitalised label of one to four words before a dash', () => {
  const out = runInSplit(blk('Caring Mentorship - Each regular attendee is connected' + STEGA))!;
  assert.equal(out.label, 'Caring Mentorship');
  assert.equal(out.tail.children![0].text, 'Each regular attendee is connected' + STEGA);
  assert.equal(runInSplit(blk('Following God’s Word – Our times of worship'))!.label, 'Following God’s Word');
});

test('runInSplit rejects sentences and lowercase starts', () => {
  assert.equal(runInSplit(blk('Next week - we meet at six')), null); // "week" is not capitalised
  assert.equal(runInSplit(blk('We believe that the church - as a body - serves')), null); // label over 4 words
  assert.equal(runInSplit(blk('Mr. Smith - the treasurer')), null); // label contains "."
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --test src/lib/span-split.test.ts`
Expected: FAIL with `Cannot find module` for `./span-split.ts`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/span-split.ts
// Safe to edit by hand
// Stega-safe reading and splitting of Portable Text blocks.
//
// In the preview every span's text carries an invisible stega payload appended
// to its END (src/lib/preview-stega.ts). Two consequences drive this file:
//   1. Every measure (word counts, regexes, prefixes) runs on CLEANED text.
//   2. When a span is split for display, the head is taken from the cleaned
//      text and the tail from the RAW text. Because the payload is at the end,
//      an index into the cleaned string is also a valid index into the raw one
//      up to the payload, so the raw tail keeps the payload and the tail stays
//      click-to-edit in the Studio. The head is plain text (a prefix, a name,
//      a label) and is not separately editable in the canvas.
// A split whose point is not inside the FIRST span (a mark straddles it) is
// refused, and the caller falls back to rendering the block whole.
import { splitStega } from './preview-stega.ts';

export interface PtSpan { _type: 'span'; _key?: string; text: string; marks?: string[] }
export interface PtBlock {
  _type: 'block'; _key?: string; style?: string; listItem?: string; level?: number;
  children?: PtSpan[]; markDefs?: unknown[];
}

const clean = (s: string): string => splitStega(s ?? '').cleaned;

export function blockText(b: PtBlock): string {
  return (b.children ?? []).map((c) => clean(c?.text ?? '')).join('');
}

export function wordCount(s: string): number {
  const m = clean(s).trim().match(/\S+/g);
  return m ? m.length : 0;
}

export function splitBlockText(
  b: PtBlock, headEnd: number, tailStart: number,
): { head: string; tail: PtBlock } | null {
  const first = b.children?.[0];
  if (!first || typeof first.text !== 'string') return null;
  const cleaned = clean(first.text);
  if (headEnd <= 0 || tailStart > cleaned.length || headEnd > tailStart) return null;
  const head = cleaned.slice(0, headEnd).trim();
  const rawTail = first.text.slice(tailStart).replace(/^\s+/, '');
  const tail: PtBlock = { ...b, children: [{ ...first, text: rawTail }, ...(b.children ?? []).slice(1)] };
  return head ? { head, tail } : null;
}

export function sharedPrefix(items: string[]): string {
  if (items.length < 2) return '';
  const ws = items.map((t) => clean(t).trim().split(/\s+/));
  const min = Math.min(...ws.map((w) => w.length));
  let k = 0;
  while (k < 3 && k < min - 1 && ws.every((w) => w[k].toLowerCase() === ws[0][k].toLowerCase())) k++;
  return ws[0].slice(0, k).join(' ');
}

export function pipedSplit(b: PtBlock): { name: string; tail: PtBlock } | null {
  const first = clean(b.children?.[0]?.text ?? '');
  const i = first.indexOf(' | ');
  if (i <= 0) return null;
  const out = splitBlockText(b, i, i + 3);
  return out ? { name: out.head, tail: out.tail } : null;
}

const SMALL = new Set(['of', 'and', 'the', 'to', 'in', 'for', 'a']);
const RUN_IN = /^([^.\-–—]{2,28}?) [-–] /;

export function runInSplit(b: PtBlock): { label: string; tail: PtBlock } | null {
  const first = clean(b.children?.[0]?.text ?? '');
  const m = first.match(RUN_IN);
  if (!m) return null;
  const words = m[1].trim().split(/\s+/);
  if (words.length > 4) return null;
  if (!words.every((w, i) => /^[A-Z]/.test(w) || (i > 0 && SMALL.has(w)))) return null;
  const out = splitBlockText(b, m[1].length, m[0].length);
  return out ? { label: out.head, tail: out.tail } : null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --test src/lib/span-split.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/span-split.ts src/lib/span-split.test.ts
git commit -m "feat(lib): stega-safe Portable Text span splitting"
```

---

### Task 2: The Ledger classifier

**Files:**
- Create: `src/lib/rich-shape.ts`
- Test: `src/lib/rich-shape.test.ts`

**Interfaces:**
- Consumes (Task 1): `PtBlock`, `blockText`, `wordCount`, `sharedPrefix`, `pipedSplit`, `runInSplit`, `splitBlockText`.
- Produces:
  ```ts
  export type RichShape = 'row' | 'columns' | 'sections' | 'register' | 'ledger' | 'prose';
  export type RichPiece =
    | { kind: 'lede'; block: PtBlock }
    | { kind: 'standfirst'; block: PtBlock }
    | { kind: 'leadin'; block: PtBlock }
    | { kind: 'measure' | 'run2' | 'run3'; paras: RichPara[] }
    | { kind: 'table'; rows: { name: string | null; tail: PtBlock }[] }
    | { kind: 'said'; prefix: string; hang: boolean; items: PtBlock[] }   // items are the TAILS
    | { kind: 'triad'; prefix: string; items: PtBlock[] }                  // prefix '' when none
    | { kind: 'index' | 'plain'; items: PtBlock[] }
    | { kind: 'section'; head: PtBlock; pieces: RichPiece[] }
    | { kind: 'columns'; level: 'h3' | 'h4'; across: number; flush: boolean;
        groups: { head: PtBlock; big: boolean; pieces: RichPiece[] }[] }
    | { kind: 'register'; left: RichPiece[][]; right: RichPiece[][] }
    | { kind: 'foot'; block: PtBlock };
  export interface RichPara { block: PtBlock; label: string | null }       // label set when run-in
  export interface RichLayout { shape: RichShape; continuation: boolean; pieces: RichPiece[]; rowLong?: boolean }
  export function isLedeParagraph(b: PtBlock | undefined, runLength: number, remaining: number): boolean
  export function classifyRichText(body: PtBlock[] | null | undefined, opts: { hasHead: boolean; narrow?: boolean }): RichLayout
  ```
  `narrow: true` is how ImageText asks for a body that sits beside a picture: every paragraph run becomes `measure`, never `run2`/`run3`, and columns collapse to one across.

The rules are the prototype's final classifier (its Rules drawer, "Final classifier"), with ONE deliberate change: the lede test is unified with the photo prototype's guard so both components share one rule (a lede is a full sentence of 8 to 40 words; a label such as "Nursery Care (104)" or "Current Deacons (left to right in photo):" is never a lede unless it ends in ":" before a list, where it becomes a `leadin` instead).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/rich-shape.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRichText, isLedeParagraph, type RichPiece } from './rich-shape.ts';
import type { PtBlock } from './span-split.ts';

let n = 0;
const span = (text: string) => ({ _type: 'span' as const, _key: `s${n++}`, text, marks: [] });
const p = (text: string): PtBlock => ({ _type: 'block', _key: `b${n++}`, style: 'normal', markDefs: [], children: [span(text)] });
const h3 = (text: string): PtBlock => ({ ...p(text), style: 'h3' });
const h4 = (text: string): PtBlock => ({ ...p(text), style: 'h4' });
const li = (text: string): PtBlock => ({ ...p(text), listItem: 'bullet', level: 1 });
const words = (k: number, w = 'word') => Array.from({ length: k }, () => w).join(' ') + '.';
const kinds = (ps: RichPiece[]) => ps.map((x) => x.kind);

test('an empty or missing body is a prose shape with no pieces', () => {
  assert.deepEqual(classifyRichText(undefined, { hasHead: true }), { shape: 'prose', continuation: false, pieces: [] });
  assert.deepEqual(classifyRichText([], { hasHead: false }).pieces, []);
});

test('ROW: a headed band of up to three paragraphs and 80 words', () => {
  const out = classifyRichText([p('We give sacrificially to help those in need.'), p('Special offerings and projects.')], { hasHead: true });
  assert.equal(out.shape, 'row');
  assert.equal(out.rowLong, false);
  assert.deepEqual(kinds(out.pieces), ['measure']);
});

test('ROW never applies to a headingless band', () => {
  const out = classifyRichText([p('Short.')], { hasHead: false });
  assert.equal(out.shape, 'prose');
  assert.equal(out.continuation, true);
});

test('COLUMNS: four paragraph-only h3 groups go four across, with run-ins', () => {
  const body = [
    h3('Worship'), p(words(20)), p('Following God’s Word - Our times of worship are rooted in scripture.'),
    h3('The Way'), p(words(37)), p('Caring Mentorship - Each regular attendee is connected with a deacon.'),
    h3('Witness'), p(words(25)), h3('Work'), p(words(20)), p('Serve - We actively help.'),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'columns');
  const cols = out.pieces.find((x) => x.kind === 'columns');
  assert.ok(cols && cols.kind === 'columns');
  assert.equal(cols.across, 4);
  const firstGroupParas = cols.groups[0].pieces.flatMap((x) => (x.kind === 'measure' ? x.paras : []));
  assert.equal(firstGroupParas[1].label, 'Following God’s Word');
});

test('run-in needs at least two matching paragraphs in the band', () => {
  const out = classifyRichText([p('Next Week - We Meet at six.'), p(words(30))], { hasHead: true });
  const paras = out.pieces.flatMap((x) => (x.kind === 'measure' ? x.paras : []));
  assert.ok(paras.every((x) => x.label === null));
});

test('columns: seven groups go four across, six go three across', () => {
  const g = (k: number) => Array.from({ length: k }, (_, i) => [h3(`G${i}`), p(words(10))]).flat();
  const seven = classifyRichText(g(7), { hasHead: true }).pieces.find((x) => x.kind === 'columns');
  const six = classifyRichText(g(6), { hasHead: true }).pieces.find((x) => x.kind === 'columns');
  assert.equal(seven && seven.kind === 'columns' && seven.across, 4);
  assert.equal(six && six.kind === 'columns' && six.across, 3);
});

test('SECTIONS: one h3, or groups over 150 words, or a list inside a group', () => {
  assert.equal(classifyRichText([h3('Only'), p(words(30))], { hasHead: true }).shape, 'sections');
  assert.equal(classifyRichText([h3('A'), p(words(160)), h3('B'), p(words(20))], { hasHead: true }).shape, 'sections');
});

test('REGISTER: eight or more paragraphs, 80% of them 35 words or fewer (the creed)', () => {
  const body = [
    p('There is One Triune God revealed to us as Father, Son, & Holy Spirit.'),
    li('God is Love.'), li('God is Spirit.'), li('God is Holy.'),
    ...Array.from({ length: 12 }, (_, i) => p(`Statement number ${i} is short.`)),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'register');
  const reg = out.pieces.find((x) => x.kind === 'register');
  assert.ok(reg && reg.kind === 'register');
  // the triad rides inside the first cell, read down then across
  assert.equal(reg.left[0].map((x) => x.kind).join(','), 'measure,triad');
  assert.equal(reg.left.length, Math.ceil(13 / 2));
});

test('LEDGER + SAID: the covenant hangs its shared "To"', () => {
  const body = [
    p('We, the members of this church, through the grace of God, humbly and solemnly undertake with His aid:'),
    li('To attend the worship and services of this church regularly.'),
    li('To contribute cheerfully and regularly to the financial support of the work.'),
    li('To aid and assist prayerfully the minister.'),
    p(words(10)),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'ledger');
  assert.deepEqual(kinds(out.pieces), ['lede', 'said', 'measure']);
  const said = out.pieces[1];
  assert.ok(said.kind === 'said');
  assert.equal(said.prefix, 'To');
  assert.equal(said.hang, true);
  assert.equal(said.items[0].children![0].text, 'attend the worship and services of this church regularly.');
});

test('a two-item list with a shared one-word prefix is PLAIN, not SAID', () => {
  const out = classifyRichText([p(words(20)), li('The nursery is in room 104 on the first floor.'), li('The kids center is on the lower level near the hall.')], { hasHead: true });
  assert.ok(out.pieces.some((x) => x.kind === 'plain'));
  assert.ok(!out.pieces.some((x) => x.kind === 'said'));
});

test('TABLE: half or more items carry " | "', () => {
  const out = classifyRichText([h3('Life Groups'), li('Charis | For college students.'), li('Snowbirds | Locations vary.'), li('Loose item')], { hasHead: true });
  const sec = out.pieces.find((x) => x.kind === 'section');
  assert.ok(sec && sec.kind === 'section');
  const table = sec.pieces.find((x) => x.kind === 'table');
  assert.ok(table && table.kind === 'table');
  assert.deepEqual(table.rows.map((r) => r.name), ['Charis', 'Snowbirds', null]);
});

test('INDEX: ten one-line items; TRIAD: up to four short items', () => {
  const ten = ['Birth Announcement', 'Notification of Death', 'Special Birthday', 'Special Anniversary', 'Engagement Announcement', 'Retirement', 'Hospital Admission', 'Graduation', 'Decision of Faith', 'Address Change'].map(li);
  assert.ok(classifyRichText([p(words(20)), ...ten], { hasHead: true }).pieces.some((x) => x.kind === 'index'));
  const three = [li('Exterior Building'), li('Fellowship Hall'), li('Kitchen')];
  assert.ok(classifyRichText([p(words(80)), ...three, p(words(30))], { hasHead: true }).pieces.some((x) => x.kind === 'triad'));
});

test('long prose goes into two then three columns, split into sets of about 600 words', () => {
  const two = classifyRichText([p(words(120)), p(words(120))], { hasHead: false });
  assert.deepEqual(kinds(two.pieces), ['run2']);
  const essay = Array.from({ length: 9 }, () => p(words(100)));
  const three = classifyRichText(essay, { hasHead: false });
  assert.deepEqual(kinds(three.pieces), ['run3', 'run3']);
});

test('narrow: beside a picture, prose is always one measure and columns are one across', () => {
  const out = classifyRichText([p(words(120)), p(words(120)), p(words(120))], { hasHead: true, narrow: true });
  assert.ok(out.pieces.every((x) => x.kind === 'measure' || x.kind === 'lede'));
});

test('STANDFIRST is all or none across a band’s h3 groups', () => {
  const yes = classifyRichText([h3('A'), p('A short summary sentence.'), p(words(200)), h3('B'), p('Another short summary.'), p(words(200))], { hasHead: false });
  const sectionKinds = yes.pieces.flatMap((x) => (x.kind === 'section' ? kinds(x.pieces) : []));
  assert.equal(sectionKinds.filter((k) => k === 'standfirst').length, 2);
  const no = classifyRichText([h3('A'), p('Short summary.'), p(words(200)), h3('B'), p(words(37)), p(words(200))], { hasHead: false });
  assert.ok(!no.pieces.some((x) => x.kind === 'section' && x.pieces.some((y) => y.kind === 'standfirst')));
});

test('FOOT: a short last paragraph after groups becomes a closing row', () => {
  const out = classifyRichText([h3('A'), p(words(40)), h4('X'), p(words(10)), h4('Y'), p(words(10)), p('Cheryl Flaherty, Adult Coordinator.')], { hasHead: true });
  assert.equal(out.pieces.at(-1)?.kind, 'foot');
});

test('isLedeParagraph: 8 to 40 words, ends a sentence, not the first of exactly two', () => {
  assert.equal(isLedeParagraph(p('At each entrance, all ages are invited to check-in with a greeter.'), 1, 2), true);
  assert.equal(isLedeParagraph(p('Nursery Care (104)'), 3, 4), false);           // label, no sentence end
  assert.equal(isLedeParagraph(p(words(43)), 3, 4), false);                     // too long
  assert.equal(isLedeParagraph(p(words(12)), 2, 2), false);                     // first of two
  assert.equal(isLedeParagraph(p(words(12)), 1, 0), false);                     // nothing after it
});

test('a stega-encoded covenant classifies exactly like a clean one', () => {
  const S = '​‌‍﻿​‌‍﻿';
  const mk = (s: string) => [p('We undertake with His aid:' + S), li(`To attend ${s}.` + S), li(`To give ${s}.` + S), li(`To aid ${s}.` + S)];
  const a = classifyRichText(mk('regularly and well in all things'), { hasHead: true });
  const b = classifyRichText(mk('regularly and well in all things').map((x) => ({ ...x, children: x.children!.map((c) => ({ ...c, text: c.text.replace(/[​-‍﻿]/g, '') })) })), { hasHead: true });
  assert.deepEqual(kinds(a.pieces), kinds(b.pieces));
  const said = a.pieces.find((x) => x.kind === 'said');
  assert.ok(said && said.kind === 'said');
  assert.ok(said.items[0].children![0].text.endsWith(S), 'the payload stays on the tail');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --test src/lib/rich-shape.test.ts`
Expected: FAIL, `Cannot find module './rich-shape.ts'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/rich-shape.ts
// Safe to edit by hand
// The Ledger: a rich-text body is laid out from its OWN shape, never from a
// field (design research note section 7; the approved prototype is
// docs/superpowers/prototypes/2026-09-22-richtext-and-photos/richtext/). Pure
// and build-time: every measure runs on cleaned text (span-split.ts), so the
// preview renders the same branch as the live site.
import {
  blockText, wordCount, sharedPrefix, pipedSplit, runInSplit, splitBlockText, type PtBlock,
} from './span-split.ts';

export type RichShape = 'row' | 'columns' | 'sections' | 'register' | 'ledger' | 'prose';
export interface RichPara { block: PtBlock; label: string | null }
export type RichPiece =
  | { kind: 'lede'; block: PtBlock }
  | { kind: 'standfirst'; block: PtBlock }
  | { kind: 'leadin'; block: PtBlock }
  | { kind: 'measure' | 'run2' | 'run3'; paras: RichPara[] }
  | { kind: 'table'; rows: { name: string | null; tail: PtBlock }[] }
  | { kind: 'said'; prefix: string; hang: boolean; items: PtBlock[] }
  | { kind: 'triad'; prefix: string; items: PtBlock[] }
  | { kind: 'index' | 'plain'; items: PtBlock[] }
  | { kind: 'section'; head: PtBlock; pieces: RichPiece[] }
  | { kind: 'columns'; level: 'h3' | 'h4'; across: number; flush: boolean;
      groups: { head: PtBlock; big: boolean; pieces: RichPiece[] }[] }
  | { kind: 'register'; left: RichPiece[][]; right: RichPiece[][] }
  | { kind: 'foot'; block: PtBlock };
export interface RichLayout { shape: RichShape; continuation: boolean; pieces: RichPiece[]; rowLong?: boolean }

type Seg =
  | { kind: 'p'; b: PtBlock }
  | { kind: 'h3'; b: PtBlock }
  | { kind: 'h4'; b: PtBlock }
  | { kind: 'list'; items: PtBlock[] };
interface Ctx { runIn: boolean; narrow: boolean }

const text = (b: PtBlock) => blockText(b).trim();
const wordsOf = (b: PtBlock) => wordCount(blockText(b));
const segWords = (s: Seg) => (s.kind === 'list' ? s.items.reduce((n, i) => n + wordsOf(i), 0) : wordsOf(s.b));
const endsSentence = (b: PtBlock) => /[.!?:]["”’)]?$/.test(text(b));
const endsColon = (b: PtBlock) => /:\s*["”’]?$/.test(text(b));
const across = (n: number) => (n <= 4 ? n : n % 3 === 0 ? 3 : 4);

function segments(body: PtBlock[]): Seg[] {
  const segs: Seg[] = [];
  for (const b of body) {
    if (b?._type !== 'block') continue;
    if (b.listItem) {
      const last = segs.at(-1);
      if (last && last.kind === 'list') last.items.push(b);
      else segs.push({ kind: 'list', items: [b] });
    } else if (b.style === 'h3') segs.push({ kind: 'h3', b });
    else if (b.style === 'h4') segs.push({ kind: 'h4', b });
    else if (text(b)) segs.push({ kind: 'p', b });
  }
  return segs;
}

function groupsAt(segs: Seg[], level: 'h3' | 'h4') {
  const intro: Seg[] = [];
  const groups: { head: PtBlock; body: Seg[] }[] = [];
  for (const s of segs) {
    if (s.kind === level) groups.push({ head: (s as { b: PtBlock }).b, body: [] });
    else if (groups.length) groups[groups.length - 1].body.push(s);
    else intro.push(s);
  }
  return { intro, groups };
}

/** One lede rule for both components (RichTextSection and ImageText). */
export function isLedeParagraph(b: PtBlock | undefined, runLength: number, remaining: number): boolean {
  if (!b || b.listItem || (b.style ?? 'normal') !== 'normal') return false;
  const w = wordsOf(b);
  return w >= 8 && w <= 40 && endsSentence(b) && remaining > 0 && runLength !== 2;
}

function listPiece(items: PtBlock[]): RichPiece {
  const texts = items.map(text);
  const piped = items.filter((i) => text(i).includes(' | ')).length;
  const short = texts.every((t) => wordCount(t) <= 6);
  if (piped > 0 && piped >= items.length / 2) {
    return { kind: 'table', rows: items.map((i) => {
      const s = pipedSplit(i);
      return s ? { name: s.name, tail: s.tail } : { name: null, tail: i };
    }) };
  }
  const prefix = sharedPrefix(texts);
  const prefixWords = prefix ? prefix.split(' ').length : 0;
  if (prefix && (items.length >= 3 || prefixWords >= 2)) {
    const tails = items.map((i) => splitBlockText(i, prefix.length, prefix.length + 1)?.tail ?? null);
    if (tails.every((t): t is PtBlock => t !== null)) {
      if (short) return { kind: 'triad', prefix, items: tails };
      return { kind: 'said', prefix, hang: prefix.length <= 6, items: tails };
    }
  }
  if (short && items.length <= 4) return { kind: 'triad', prefix: '', items };
  if (short) return { kind: 'index', items };
  return { kind: 'plain', items };
}

function para(b: PtBlock, ctx: Ctx): RichPara {
  if (ctx.runIn) {
    const r = runInSplit(b);
    if (r) return { block: r.tail, label: r.label };
  }
  return { block: b, label: null };
}

function proseRun(run: PtBlock[], ctx: Ctx): RichPiece[] {
  if (!run.length) return [];
  const T = run.reduce((n, b) => n + wordsOf(b), 0);
  const paras = run.map((b) => para(b, ctx));
  if (ctx.narrow || T <= 60 || (run.length === 1 && T <= 110)) return [{ kind: 'measure', paras }];
  const kind = Math.ceil(T / 150) >= 3 ? 'run3' : 'run2';
  const sets: RichPara[][] = [];
  let cur: RichPara[] = [];
  let cw = 0;
  for (const x of paras) {
    const w = wordsOf(x.block);
    if (cw + w > 600 && cur.length) { sets.push(cur); cur = []; cw = 0; }
    cur.push(x); cw += w;
  }
  if (cur.length) sets.push(cur);
  return sets.map((s) => ({ kind, paras: s }));
}

function flow(segs: Seg[], ctx: Ctx, o: { allowLede: boolean; standfirst: boolean; inSection: boolean }): RichPiece[] {
  const out: RichPiece[] = [];
  let i = 0;
  let allowLede = o.allowLede;
  let standfirst = o.standfirst;
  while (i < segs.length) {
    const s = segs[i];
    if (s.kind === 'p') {
      const run: PtBlock[] = [];
      while (i < segs.length && segs[i].kind === 'p') run.push((segs[i++] as { b: PtBlock }).b);
      const nextIsList = segs[i]?.kind === 'list';
      const remaining = segs.length - i + run.length - 1;
      if (allowLede && isLedeParagraph(run[0], run.length, remaining)) out.push({ kind: 'lede', block: run.shift()! });
      if (standfirst && run.length >= 2 && wordsOf(run[0]) <= 30) out.push({ kind: 'standfirst', block: run.shift()! });
      standfirst = false;
      let leadin: PtBlock | null = null;
      const last = run.at(-1);
      if (last && nextIsList && endsColon(last) && wordsOf(last) <= 25) leadin = run.pop()!;
      out.push(...proseRun(run, ctx));
      if (leadin) out.push({ kind: 'leadin', block: leadin });
    } else if (s.kind === 'list') {
      out.push(listPiece(s.items)); i++;
    } else if (s.kind === 'h4') {
      const opensSection = i === 0 && o.inSection;
      const groups: { head: PtBlock; body: Seg[] }[] = [];
      while (i < segs.length && segs[i].kind !== 'h3' && (segs[i].kind === 'h4' || groups.length)) {
        const x = segs[i++];
        if (x.kind === 'h4') groups.push({ head: x.b, body: [] });
        else groups[groups.length - 1].body.push(x);
      }
      out.push(columnsPiece(groups, 'h4', ctx, opensSection, false));
    } else i++;
    allowLede = false;
  }
  return out;
}

function columnsPiece(groups: { head: PtBlock; body: Seg[] }[], level: 'h3' | 'h4', ctx: Ctx, flush: boolean, sf: boolean): RichPiece {
  const n = ctx.narrow ? 1 : Math.min(across(groups.length), level === 'h4' ? 3 : 4);
  return {
    kind: 'columns', level, across: n, flush,
    groups: groups.map((g) => ({
      head: g.head,
      big: level === 'h3' && g.body.reduce((a, s) => a + segWords(s), 0) <= 40,
      pieces: flow(g.body, { ...ctx, narrow: true }, { allowLede: false, standfirst: sf, inSection: false }),
    })),
  };
}

function pullFoot(segs: Seg[]): { segs: Seg[]; foot: PtBlock | null } {
  const last = segs.at(-1);
  if (!last || last.kind !== 'p' || wordsOf(last.b) > 15) return { segs, foot: null };
  const afterGroup = segs.some((s) => s.kind === 'h3' || s.kind === 'h4');
  const children = last.b.children ?? [];
  const linkLine = children.length > 0 && children.every((c) => (c.marks ?? []).length > 0 || !c.text.trim());
  return afterGroup || linkLine ? { segs: segs.slice(0, -1), foot: last.b } : { segs, foot: null };
}

export function classifyRichText(
  body: PtBlock[] | null | undefined, opts: { hasHead: boolean; narrow?: boolean },
): RichLayout {
  const segs = segments(Array.isArray(body) ? body : []);
  const continuation = !opts.hasHead;
  if (!segs.length) return { shape: 'prose', continuation, pieces: [] };

  const H3 = segs.filter((s) => s.kind === 'h3').length;
  const H4 = segs.filter((s) => s.kind === 'h4').length;
  const lists = segs.filter((s): s is Extract<Seg, { kind: 'list' }> => s.kind === 'list');
  const paras = segs.filter((s): s is Extract<Seg, { kind: 'p' }> => s.kind === 'p');
  const total = segs.reduce((n, s) => n + segWords(s), 0);
  const ctx: Ctx = { runIn: paras.filter((x) => runInSplit(x.b)).length >= 2, narrow: !!opts.narrow };

  let shape: RichShape;
  if (opts.hasHead && !H3 && !H4 && !lists.length && paras.length <= 3 && total <= 80) shape = 'row';
  else if (H3 >= 2 && groupsAt(segs, 'h3').groups.every((g) => g.body.every((s) => s.kind === 'p') && g.body.reduce((n, s) => n + segWords(s), 0) <= 150)) shape = 'columns';
  else if (H3 >= 1 || H4 >= 2) shape = 'sections';
  else if (paras.length >= 8 && paras.filter((x) => wordsOf(x.b) <= 35).length / paras.length >= 0.8) shape = 'register';
  else if (lists.some((l) => l.items.length >= 3) && lists.reduce((n, l) => n + segWords(l), 0) / total >= 0.4) shape = 'ledger';
  else shape = 'prose';

  if (shape === 'row') {
    return { shape, continuation, rowLong: total > 60, pieces: [{ kind: 'measure', paras: paras.map((x) => ({ block: x.b, label: null })) }] };
  }

  if (shape === 'register' && !opts.narrow) {
    const cells: RichPiece[][] = [];
    for (const s of segs) {
      if (s.kind === 'list' && cells.length) cells[cells.length - 1].push(listPiece(s.items));
      else if (s.kind === 'p') cells.push([{ kind: 'measure', paras: [{ block: s.b, label: null }] }]);
      else if (s.kind === 'list') cells.push([listPiece(s.items)]);
    }
    const rows = Math.ceil(cells.length / 2);
    return { shape, continuation, pieces: [{ kind: 'register', left: cells.slice(0, rows), right: cells.slice(rows) }] };
  }

  const { segs: rest, foot } = pullFoot(segs);
  const pieces: RichPiece[] = [];
  if (shape === 'columns' || shape === 'sections') {
    const { intro, groups } = groupsAt(rest, 'h3');
    const eligible = groups.filter((g) => g.body[0]?.kind === 'p' && g.body[1]?.kind === 'p');
    const sf = eligible.length > 0 && eligible.every((g) => wordsOf((g.body[0] as { b: PtBlock }).b) <= 30);
    pieces.push(...flow(intro, ctx, { allowLede: opts.hasHead, standfirst: false, inSection: false }));
    if (shape === 'columns') pieces.push(columnsPiece(groups, 'h3', ctx, false, sf));
    else for (const g of groups) {
      pieces.push({ kind: 'section', head: g.head, pieces: flow(g.body, ctx, { allowLede: false, standfirst: sf, inSection: true }) });
    }
  } else {
    pieces.push(...flow(rest, ctx, { allowLede: opts.hasHead, standfirst: false, inSection: false }));
  }
  if (foot) pieces.push({ kind: 'foot', block: foot });
  return { shape, continuation, pieces };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --test src/lib/rich-shape.test.ts`
Expected: PASS, 18 tests. If a threshold test fails, fix the implementation to match the prototype's rules, not the test; the tests encode the prototype.

- [ ] **Step 5: Run the whole unit suite**

Run: `npm run test:unit`
Expected: PASS (the existing 588 plus the new ones).

- [ ] **Step 6: Commit**

```bash
git add src/lib/rich-shape.ts src/lib/rich-shape.test.ts
git commit -m "feat(lib): Ledger classifier for rich-text bodies"
```

---

### Task 3: Bare Portable Text, tokens and the Ledger CSS

**Files:**
- Modify: `src/components/PortableText.tsx` (the `Props` interface at line 16, `makeComponents` at line 40, the default export at line 195)
- Modify: `src/styles/globals.css` (`@theme` near line 152; component CSS appended after the `.bleed-left` block near line 770)

**Interfaces:**
- Produces: `<PortableText value={blocks} variant="bare" />` renders each block as a bare `<p>` (no margin classes), list items as `<span>` inside the caller's own element, and keeps marks (strong, em, link) and their stega exactly as `prose` does. CSS classes `.rt-*` used by Task 4.

- [ ] **Step 1: Add the `bare` variant to PortableText**

In `src/components/PortableText.tsx`, extend the props and pass the variant through:

```tsx
interface Props {
  value: PortableTextBlock[] | any;
  /** Optional className applied to the wrapping div for spacing/typography overrides per slot. */
  className?: string;
  /**
   * 'prose' (default) is the long-read setting with its own margins and list
   * bullets. 'bare' renders blocks with NO spacing or list styling so a layout
   * component (RichBody.astro) can place each one itself; marks, links and the
   * preview's stega payloads render exactly as in 'prose'.
   */
  variant?: 'prose' | 'bare';
}
```

Change the export to:

```tsx
export default function PortableText({ value, className, variant = 'prose' }: Props) {
  if (!value) return null;
  const components = makeComponents();
  if (variant === 'bare') {
    // No wrapper element at all: the caller's own element is the container, so
    // a bare block can sit inside an <h3>, <li> or <span> without nesting a
    // <div> where HTML does not allow one. Headings and list items render only
    // their spans; a normal paragraph is a bare <p>.
    components.block = { normal: ({ children }) => <p>{children}</p>, h3: ({ children }) => <>{children}</>, h4: ({ children }) => <>{children}</> };
    components.list = { bullet: ({ children }) => <>{children}</>, number: ({ children }) => <>{children}</> };
    components.listItem = { bullet: ({ children }) => <>{children}</>, number: ({ children }) => <>{children}</> };
    return <PT value={value} components={components} />;
  }
  return (
    <div className={className}>
      <PT value={value} components={components} />
    </div>
  );
}
```

(Keep whatever the current body of the default export does beyond this; read lines 195-202 first and merge, do not drop an existing guard.)

- [ ] **Step 2: Add the two tokens to `@theme` in `globals.css`**, directly after `--text-lede` (line 152):

```css
  /* The Ledger's two sizes (2026-09-22). --text-item: list rows, register
     statements, said text, table names, row text. --text-dense: three-column
     prose only. See src/lib/rich-shape.ts. */
  --text-item: clamp(1.125rem, 1rem + 0.4vw, 1.375rem);
  --text-dense: 1rem;
```

- [ ] **Step 3: Append the Ledger component CSS to `globals.css`** after the `.bleed-*` media query. It is the prototype's CSS (`richtext/index.html`, the "the design" section) renamed to `.rt-*` and moved onto the site's tokens:

```css
/* ---------- The Ledger: RichTextSection and ImageText bodies (2026-09-22) ----------
   Source of truth: docs/superpowers/prototypes/2026-09-22-richtext-and-photos/richtext/.
   The classifier is src/lib/rich-shape.ts; the renderer is RichBody.astro. */
.rt-g { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: clamp(16px, 2.5vw, 40px); }
.rt-g > :last-child { margin-bottom: 0 !important; }
.rt-sub { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; }
.rt-v { margin-bottom: clamp(32px, 4vw, 52px); }
.rt-head { grid-column: 1 / -1; margin-bottom: clamp(36px, 4.5vw, 64px); }
.rt-lede { grid-column: 1 / 9; font-style: italic; font-size: var(--text-lede); line-height: 1.35; max-width: 38em; }
.rt-leadin { grid-column: 1 / 9; font-style: italic; font-size: var(--text-item); line-height: 1.45; max-width: 40em; margin-bottom: 14px; }
.rt-standfirst { grid-column: 1 / 8; font-style: italic; font-size: var(--text-item); line-height: 1.45; max-width: 36em; margin-bottom: 18px; }
.rt-h3 { font-size: var(--text-h3); line-height: 1.15; font-weight: 400; }
.rt-h4 { font-size: var(--text-item); line-height: 1.25; font-weight: 400; }
.rt-measure { grid-column: 1 / 8; max-width: 62ch; }
.rt-measure p + p { margin-top: 1em; }
.rt-run2 { grid-column: 1 / 11; columns: 2; column-gap: clamp(16px, 2.5vw, 40px); column-rule: 1px solid var(--hair); }
.rt-run3 { grid-column: 1 / -1; columns: 3; column-gap: clamp(16px, 2.5vw, 40px); column-rule: 1px solid var(--hair); font-size: var(--text-dense); line-height: 1.62; hyphens: auto; }
.rt-run2 p, .rt-run3 p { orphans: 3; widows: 3; }
.rt-run2 p + p, .rt-run3 p + p { margin-top: 0.8em; }
.rt-run3 + .rt-run3 { border-top: 1px solid var(--hair); padding-top: clamp(24px, 3vw, 36px); }
.rt-runin { border-top: 1px solid var(--hair); padding-top: 12px; margin-top: 14px !important; }
.rt-runin .rt-rl { display: block; color: var(--color-gold-ink); margin-bottom: 4px; }
.rt-cols { row-gap: clamp(32px, 4vw, 48px); }
.rt-col { border-top: 1px solid var(--hair-strong); padding-top: 18px; }
.rt-cols.is-flush .rt-col { border-top: 0; padding-top: 0; }
.rt-col .rt-h3, .rt-col .rt-h4 { margin-bottom: 10px; }
.rt-col p + p { margin-top: 0.75em; }
.rt-cols.n1 .rt-col { grid-column: 1 / -1; }
.rt-cols.n2 .rt-col:nth-child(2n + 1) { grid-column: 1 / 6; }
.rt-cols.n2 .rt-col:nth-child(2n) { grid-column: 6 / 12; }
.rt-cols.n3 .rt-col { grid-column: span 4; }
.rt-cols.n4 .rt-col { grid-column: span 3; }
.rt-cols.n2 .rt-h3 { font-size: var(--text-lede); line-height: 1.1; }
.rt-col.is-big p { font-size: var(--text-item); line-height: 1.5; }
.rt-ledger { list-style: none; padding: 0; border-bottom: 1px solid var(--hair); }
.rt-ledger > .rt-row { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; border-top: 1px solid var(--hair); padding: 14px 0 15px; align-items: baseline; }
.rt-ledger > .rt-row:first-child { border-top-color: var(--hair-strong); }
.rt-ledger .rt-it { grid-column: 1 / 10; font-size: var(--text-item); line-height: 1.45; }
.rt-ledger .rt-nm { grid-column: 1 / 5; font-size: var(--text-item); line-height: 1.3; }
.rt-ledger .rt-ds { grid-column: 6 / 12; max-width: 62ch; }
.rt-said { grid-column: 1 / -1; list-style: none; padding: 0; display: grid; grid-template-columns: max-content minmax(0, 42em) 1fr; column-gap: 0.5em; border-bottom: 1px solid var(--hair); }
.rt-said > li { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; border-top: 1px solid var(--hair); padding: 13px 0 14px; align-items: baseline; }
.rt-said > li:first-child { border-top-color: var(--hair-strong); }
.rt-said .rt-pre { grid-column: 1; text-align: right; color: var(--color-gold-ink); font-style: italic; font-size: var(--text-item); line-height: 1.45; }
.rt-said .rt-tx { grid-column: 2; font-style: italic; font-size: var(--text-item); line-height: 1.45; }
.rt-triad { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 4px 0; font-style: italic; font-size: var(--text-item); line-height: 1.45; }
.rt-triad > span { padding-right: 14px; margin-right: 14px; border-right: 1px solid var(--hair-strong); }
.rt-triad > span:last-child { border-right: 0; }
.rt-triad .rt-pre { color: var(--color-gold-ink); }
.rt-index { grid-column: 1 / -1; list-style: none; padding: 0; columns: 3; column-gap: clamp(16px, 2.5vw, 40px); border-top: 1px solid var(--hair-strong); }
.rt-index li { break-inside: avoid; border-bottom: 1px solid var(--hair); padding: 10px 0 11px; font-size: var(--text-item); line-height: 1.35; overflow-wrap: anywhere; }
.rt-register .rt-cell { border-top: 1px solid var(--hair); padding: 13px 0 15px; font-size: var(--text-item); line-height: 1.45; }
.rt-register .rt-cell.is-first { border-top-color: var(--hair-strong); }
.rt-register .rt-cell.is-l { grid-column: 1 / 6; }
.rt-register .rt-cell.is-r { grid-column: 6 / 12; }
.rt-register .rt-triad { margin-top: 8px; font-size: inherit; }
.rt-sect { grid-column: 1 / -1; border-top: 1px solid var(--hair-strong); padding-top: 18px; margin-bottom: clamp(20px, 2.5vw, 30px); }
.rt-foot { grid-column: 1 / -1; border-top: 1px solid var(--hair-strong); padding-top: 14px; color: var(--muted-foreground); }
.rt-foot p { max-width: 62ch; }
.rt-rowline { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; border-top: 1px solid var(--hair-strong); border-bottom: 1px solid var(--hair); padding: 22px 0 26px; align-items: start; }
.rt-rowline .rt-rh { grid-column: 1 / 6; }
.rt-rowline .rt-rt { grid-column: 6 / 12; font-size: var(--text-item); line-height: 1.45; }
.rt-rowline .rt-rt.is-long { font-size: var(--text-body); line-height: 1.7; }
.rt-rowline .rt-rt p + p { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--hair); }
@media (min-width: 1024px) {
  .rt-said.is-hang { grid-template-columns: 0 minmax(0, 42em) 1fr; column-gap: 0; }
  .rt-said.is-hang > li { align-items: start; }
  .rt-said.is-hang .rt-pre { position: relative; align-self: start; }
  .rt-said.is-hang .rt-pre > span { position: absolute; top: 0; right: 0; margin-right: 0.4em; white-space: nowrap; }
}
@media (max-width: 1199px) {
  .rt-cols.n4 .rt-col { grid-column: span 6; }
  .rt-run3 { columns: 2; }
}
@media (max-width: 1023px) {
  .rt-g > *, .rt-sub > *, .rt-ledger > .rt-row > *, .rt-register .rt-cell { grid-column: 1 / -1 !important; }
  .rt-sub, .rt-ledger > .rt-row, .rt-rowline { display: block; }
  .rt-sub.rt-cols { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: clamp(16px, 2.5vw, 40px); }
  .rt-cols .rt-col { grid-column: span 6 !important; }
  .rt-run2 { grid-column: 1 / -1; }
  .rt-lede, .rt-leadin { max-width: none; }
  .rt-ledger .rt-nm { margin-bottom: 4px; }
  .rt-register { display: block; }
  .rt-register .rt-cell.is-r.is-first { border-top-color: var(--hair); }
  .rt-rowline .rt-rh { margin-bottom: 14px; }
  .rt-index { columns: 2; }
}
@media (max-width: 699px) {
  .rt-cols .rt-col { grid-column: 1 / -1 !important; }
  .rt-run2, .rt-run3 { columns: 1; column-rule: 0; font-size: var(--text-body); line-height: 1.7; }
  .rt-said { column-gap: 0.4em; }
}
@media (max-width: 520px) { .rt-index { columns: 1; } }
```

(`--hair-strong` exists in the light and dark root blocks: confirm with `grep -n "hair-strong" src/styles/globals.css` before relying on it; if it does not, add it beside `--hair` in both themes with the prototype's values `rgba(23,21,31,.34)` and `rgba(241,236,227,.34)`, and run the contrast gate in Step 4.)

- [ ] **Step 4: Run the gates that cover tokens**

Run: `npm run test:unit`
Expected: PASS, including `theme-tokens` (contrast over the `@theme` palette). If `theme-tokens` fails on a new colour pair, the pair is real: fix the colour, do not edit the test.

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/PortableText.tsx src/styles/globals.css
git commit -m "feat(ui): bare Portable Text variant, Ledger tokens and CSS"
```

---

### Task 4: RichBody renderer and the RichTextSection rewrite

**Files:**
- Create: `src/components/sections/RichBody.astro`
- Rewrite: `src/components/sections/RichTextSection.astro`

**Interfaces:**
- Consumes: `classifyRichText`, `RichPiece`, `RichLayout` (Task 2); `PortableText variant="bare"` and `.rt-*` CSS (Task 3); `SectionHeading.astro` (unchanged).
- Produces: `<RichBody pieces={RichPiece[]} />`, a fragment of grid children meant to sit inside an `.rt-g` grid. ImageText (Task 8) reuses it.

- [ ] **Step 1: Write `RichBody.astro`**

```astro
---
// Safe to edit by hand
// Draws the Ledger's pieces (src/lib/rich-shape.ts) as children of an .rt-g
// grid. Every block goes through PortableText variant="bare" so marks, links
// and the preview's click-to-edit survive; the only plain strings are the
// split-off heads (a said prefix, a table name, a run-in label), which are
// cleaned text by construction (src/lib/span-split.ts).
import PortableText from '@/components/PortableText';
import type { RichPiece } from '@/lib/rich-shape';
import type { PtBlock } from '@/lib/span-split';

interface Props { pieces: RichPiece[] }
const { pieces } = Astro.props as Props;
const one = (b: PtBlock) => [b];
---

{pieces.map((x) => (
  x.kind === 'lede' ? <div class="rt-lede rt-v"><PortableText value={one(x.block)} variant="bare" /></div>
  : x.kind === 'standfirst' ? <div class="rt-standfirst"><PortableText value={one(x.block)} variant="bare" /></div>
  : x.kind === 'leadin' ? <div class="rt-leadin"><PortableText value={one(x.block)} variant="bare" /></div>
  : x.kind === 'measure' || x.kind === 'run2' || x.kind === 'run3' ? (
    <div class={`rt-${x.kind} rt-v`}>
      {x.paras.map((q) => q.label
        ? <div class="rt-runin"><span class="rt-rl font-ui text-ui">{q.label}</span><PortableText value={one(q.block)} variant="bare" /></div>
        : <PortableText value={one(q.block)} variant="bare" />)}
    </div>
  )
  : x.kind === 'table' ? (
    <div class="rt-sub rt-ledger rt-v">
      {x.rows.map((r) => (
        <div class="rt-row">
          {r.name ? <p class="rt-nm">{r.name}</p> : null}
          <div class="rt-ds" style={r.name ? undefined : 'grid-column:1/12'}>
            <PortableText value={one(r.tail)} variant="bare" />
          </div>
        </div>
      ))}
    </div>
  )
  : x.kind === 'said' ? (
    <ul class:list={['rt-said rt-v', x.hang && 'is-hang']}>
      {x.items.map((it) => (
        <li><span class="rt-pre"><span>{x.prefix}</span></span><span class="rt-tx"><PortableText value={one(it)} variant="bare" /></span></li>
      ))}
    </ul>
  )
  : x.kind === 'triad' ? (
    <div class="rt-triad rt-v">
      {x.items.map((it) => <span>{x.prefix && <span class="rt-pre">{x.prefix} </span>}<PortableText value={one(it)} variant="bare" /></span>)}
    </div>
  )
  : x.kind === 'index' ? <ul class="rt-index rt-v">{x.items.map((it) => <li><PortableText value={one(it)} variant="bare" /></li>)}</ul>
  : x.kind === 'plain' ? (
    <ul class="rt-sub rt-ledger rt-v">
      {x.items.map((it) => <li class="rt-row"><span class="rt-it"><PortableText value={one(it)} variant="bare" /></span></li>)}
    </ul>
  )
  : x.kind === 'section' ? (
    <>
      <div class="rt-sect"><h3 class="rt-h3"><PortableText value={one(x.head)} variant="bare" /></h3></div>
      <Astro.self pieces={x.pieces} />
    </>
  )
  : x.kind === 'columns' ? (
    <div class:list={['rt-sub rt-cols rt-v', `n${x.across}`, x.flush && 'is-flush']}>
      {x.groups.map((g) => (
        <div class:list={['rt-col', g.big && 'is-big']}>
          {x.level === 'h3'
            ? <h3 class="rt-h3"><PortableText value={one(g.head)} variant="bare" /></h3>
            : <h4 class="rt-h4"><PortableText value={one(g.head)} variant="bare" /></h4>}
          <Astro.self pieces={g.pieces} />
        </div>
      ))}
    </div>
  )
  : x.kind === 'register' ? (
    <div class="rt-sub rt-register">
      {x.left.map((cell, k) => <div class:list={['rt-cell is-l', k === 0 && 'is-first']} style={`grid-row:${k + 1}`}><Astro.self pieces={cell} /></div>)}
      {x.right.map((cell, k) => <div class:list={['rt-cell is-r', k === 0 && 'is-first']} style={`grid-row:${k + 1}`}><Astro.self pieces={cell} /></div>)}
    </div>
  )
  : x.kind === 'foot' ? <div class="rt-foot"><PortableText value={one(x.block)} variant="bare" /></div>
  : null
))}
```

Inside `.rt-col`, `.rt-cell` and `.rt-said .rt-tx`, nested pieces are NOT grid children of `.rt-g`, so their `grid-column` rules are inert; that is intended and matches the prototype. The `bare` variant renders no wrapper element (Task 3), so a list item or heading block can sit inside an `<li>`, `<span>` or `<h3>` without an invalid nested `<div>`. A `normal` block renders a `<p>`, so never put a paragraph block inside a `<p>` or `<span>`: the triad and the legend label use `<div>`.

- [ ] **Step 2: Rewrite `RichTextSection.astro`**

Keep the header comment's history in a shortened form (why the measure moved, why the heading is now above) and replace the body:

```astro
---
// Page-builder block: a text section (optional heading + rich body).
// Surface (background / muted) is assigned by SectionRenderer so the page
// cadence stays correct no matter the order. Safe to edit by hand.
//
// THE LEDGER (2026-09-22, replacing the heading-left/prose-right split of the
// art-direction pass). The heading sits ABOVE the body at the page's one left
// edge, and the body is laid out from its own shape by src/lib/rich-shape.ts:
// h3 groups become ruled columns, lists become ruled rows (a list whose items
// share their opening words is set as a said text), many short statements
// become a two-column register, long prose goes into balanced columns. The
// approved prototype is docs/superpowers/prototypes/2026-09-22-richtext-and-photos/richtext/.
// `width` and `align` stay in the schema for old documents and have no effect.
import SectionHeading from '@/components/SectionHeading.astro';
import RichBody from '@/components/sections/RichBody.astro';
import { surfaceClass } from '@/lib/surfaces';
import { classifyRichText } from '@/lib/rich-shape';
import PortableText from '@/components/PortableText';

interface Props {
  eyebrow?: string;
  heading?: string;
  scriptAccent?: string;
  headingAccent?: string;
  body?: any;
  width?: 'normal' | 'narrow';
  align?: 'left' | 'center';
  surface?: 'background' | 'muted';
  headingId: string;
}

const { eyebrow, heading, scriptAccent, headingAccent, body, surface = 'background', headingId } =
  Astro.props as Props;

const bg = surfaceClass(surface);
const hasHead = !!(heading || eyebrow);
const layout = classifyRichText(body, { hasHead });
const measure = layout.pieces[0];
---

<section class={bg} aria-labelledby={heading ? headingId : undefined} data-rich-shape={layout.shape}>
  <div class:list={['mx-auto max-w-content px-gutter', layout.continuation || layout.shape === 'row' ? 'py-section-md' : 'py-section-lg']}>
    {
      layout.shape === 'row' && measure?.kind === 'measure' ? (
        <div class="rt-g">
          <div class="rt-rowline">
            <div class="rt-rh">
              <SectionHeading eyebrow={eyebrow} headline={heading} headingId={headingId} scriptAccent={scriptAccent} headingAccent={headingAccent} />
            </div>
            <div class:list={['rt-rt', layout.rowLong && 'is-long']}>
              {measure.paras.map((q) => <PortableText value={[q.block]} variant="bare" />)}
            </div>
          </div>
        </div>
      ) : (
        <div class="rt-g">
          {hasHead && (
            <div class="rt-head">
              <SectionHeading eyebrow={eyebrow} headline={heading} headingId={headingId} scriptAccent={scriptAccent} headingAccent={headingAccent} />
            </div>
          )}
          <RichBody pieces={layout.pieces} />
        </div>
      )
    }
  </div>
</section>
```

No text is measured in the template: `rowLong` comes from the classifier, which measures cleaned text.

`data-rich-shape` is a debugging hook for the verification scripts in Task 5; it is identical in live and preview renders, so parity is unaffected by its presence beyond the expected change.

- [ ] **Step 3: Build and look**

Run: `npm run build`
Expected: completes. Then `npm run check`: 0 errors.

Serve and screenshot (Git Bash; prefix `MSYS_NO_PATHCONV=1` for `/`):
```bash
node scripts/shoot-pages.mjs --help
```
Use its options to capture `/who-we-are`, `/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding`, `/give`, `/contact` at 1440 and 390 in light and dark into the session scratchpad (not the repo). Compare each rich-text band with the same band in `docs/superpowers/prototypes/2026-09-22-richtext-and-photos/richtext/index.html` (the prototype groups bands by page in page order). Every band should hit the same branch; the prototype's Rules drawer has the band-to-branch table. List any band whose branch differs and why, and fix the classifier (with a test) where the prototype is right.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/RichBody.astro src/components/sections/RichTextSection.astro src/lib/rich-shape.ts src/lib/rich-shape.test.ts
git commit -m "feat(sections): RichTextSection lays its body out as a Ledger"
```

---

### Task 5: Part A gates

**Files:** none new.

- [ ] **Step 1: Unit, type, lint, format**

Run: `npm run test:unit && npm run check && npm run format:check`
Expected: all pass.

- [ ] **Step 2: Parity shows only rich-text bands changed**

Run: `npm run build && npm run parity:compare`
Expected: FAIL on exactly the pages that carry a `richTextSection` (who-we-are, beliefs, ministries, staff, history, wedding, give, contact, and privacy only if it uses the component; check). Home, visit and the blog and post routes must PASS. Open two diffs and confirm the changed region is inside a `data-rich-shape` section and nowhere else. Do NOT recapture yet: parity is recaptured once at the end of Part B.

- [ ] **Step 3: Reflow and accessibility**

Run: `npm test`
Expected: smoke, axe light, axe dark and reflow pass on chromium, WebKit iPhone and the `chromium-scrollbars` project. If reflow fails at 320, measure the offending element with `getBoundingClientRect()` (rule 18) before changing anything.

- [ ] **Step 4: Preview check (the gate a build cannot run)**

Run `npm run build && npm run preview`, open the Studio's Presentation tool on `/beliefs` and `/ministries`:
- the covenant renders as a said list with "To" hung; click an item's text: the Studio must focus that list item's field.
- the Life Groups table: click a description: the Studio must focus that item.
- a run-in paragraph on `/who-we-are`: click the paragraph body: it must focus.
Record each result. A failure here is a stega split bug: fix `span-split.ts` with a test.

- [ ] **Step 5: Commit any fixes** (one commit per fix, message naming the band).

---

## Part B: ImageText, photo shapes

### Task 6: The photo classifier and page pass

**Files:**
- Create: `src/lib/photo-shape.ts`
- Test: `src/lib/photo-shape.test.ts`

**Interfaces:**
- Consumes: `parseSanityAssetDimensions` from `src/lib/sanity-asset.ts`; `splitStega` from `src/lib/preview-stega.ts`; `blockText`, `wordCount`, `PtBlock` from `src/lib/span-split.ts`.
- Produces:
  ```ts
  export type PhotoShape = 'ground' | 'window' | 'frame' | 'plate' | 'legend' | 'row';
  export interface PhotoRow { _type: string; image?: { asset?: { _ref?: string; _id?: string } | null; alt?: string | null } | null; eyebrow?: string | null; body?: PtBlock[] | null }
  export function photoAspect(image: PhotoRow['image']): { w: number; h: number; a: number } | null
  export function isArchival(alt: string | null | undefined, eyebrow: string | null | undefined): boolean
  export function findLegend(body: PtBlock[] | null | undefined): { labelIndex: number; listStart: number; listEnd: number; footIndex: number | null } | null
  export function assignPhotoShapes(rows: PhotoRow[], opts?: { heroHasPhoto?: boolean }): Map<number, PhotoShape>
  ```
  `assignPhotoShapes` takes the page's rows IN ORDER with each ImageText row's image already replaced by the picture it will actually render (after the spare-image swap), and returns a shape for every `imageTextSection` row index that has a picture.

Rules (from the prototype's Rules drawer; "a" is width / height):
1. `a <= 0.85`: the page's first portrait is `window`, every later one `frame`.
2. else if `a >= 1.8` and `findLegend(body)`: `legend`.
3. else if `a < 1.25` and `isArchival(alt, eyebrow)`: `plate`.
4. else if `a >= 1.3` and `w >= 2000` and the ground budget allows: `ground`.
5. else `row`.
Ground budget: at most two per page; the first eligible wins; a second only if it is at least 4 ROWS after the first on a page of 6 or more rows; never on the row directly after a photo hero (`opts.heroHasPhoto` and the ImageText is the first row after the hero); never two consecutive.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/photo-shape.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoAspect, isArchival, findLegend, assignPhotoShapes, type PhotoRow } from './photo-shape.ts';
import type { PtBlock } from './span-split.ts';

const img = (w: number, h: number, alt = '') => ({ asset: { _id: `image-abc123-${w}x${h}-jpg` }, alt });
const it = (w: number, h: number, extra: Partial<PhotoRow> = {}): PhotoRow => ({ _type: 'imageTextSection', image: img(w, h, extra.image?.alt ?? ''), ...extra });
let n = 0;
const p = (t: string): PtBlock => ({ _type: 'block', _key: `k${n++}`, style: 'normal', children: [{ _type: 'span', text: t }] });
const li = (t: string): PtBlock => ({ ...p(t), listItem: 'bullet' });

test('photoAspect reads the asset id and ignores stega', () => {
  assert.deepEqual(photoAspect(img(1140, 1425)), { w: 1140, h: 1425, a: 1140 / 1425 });
  assert.equal(photoAspect({ asset: null }), null);
  assert.equal(photoAspect(undefined), null);
});

test('isArchival: a year before 1950 in the alt or eyebrow', () => {
  assert.equal(isArchival('The second church building, built in 1890', ''), true);
  assert.equal(isArchival('', '1887 to 1917'), true);
  assert.equal(isArchival('The congregation standing to sing', 'Your first Sunday'), false);
  assert.equal(isArchival('Built in 1929​‌‍﻿', ''), true);
});

test('findLegend: a "left to right" paragraph followed by 3 to 8 names', () => {
  const body = [p('Deacons serve three-year terms.'), p('Current Deacons (left to right in photo):'), li('Gayle Songer'), li('Richard Flaherty'), li('James Butler*'), li('Aaron Smith'), li('Janis Wright'), p('*Deacon chair: deaconchair@fbcmuncie.org')];
  assert.deepEqual(findLegend(body), { labelIndex: 1, listStart: 2, listEnd: 7, footIndex: 7 });
  assert.equal(findLegend([p('left to right'), li('One'), li('Two')]), null);
});

test('the seven test bands land where the prototype put them', () => {
  const rows: PhotoRow[] = [
    it(2400, 1309, { image: img(2400, 1309, 'The congregation standing to sing') }),   // landscape-short
    { _type: 'richTextSection' },
    it(1600, 908),                                                                       // landscape-long
    { _type: 'richTextSection' },
    it(1638, 1622, { image: img(1638, 1622, 'The second church building, built in 1890') }), // archival
    it(1140, 1425),                                                                      // portrait
    it(2806, 4209),                                                                      // second portrait
    it(1600, 800, { body: [p('Current Deacons (left to right in photo):'), li('A'), li('B'), li('C')] }),
  ];
  const s = assignPhotoShapes(rows);
  assert.equal(s.get(0), 'ground');
  assert.equal(s.get(2), 'row');     // 1600 wide: too soft to be a ground
  assert.equal(s.get(4), 'plate');
  assert.equal(s.get(5), 'window');
  assert.equal(s.get(6), 'frame');   // never a second arch
  assert.equal(s.get(7), 'legend');
  assert.equal(s.has(1), false);
});

test('ground budget: no ground straight after a photo hero', () => {
  const rows: PhotoRow[] = [{ _type: 'heroSection' }, it(2400, 1600)];
  assert.equal(assignPhotoShapes(rows, { heroHasPhoto: true }).get(1), 'row');
  assert.equal(assignPhotoShapes(rows, { heroHasPhoto: false }).get(1), 'ground');
});

test('ground budget: a second ground only four rows later on a long page, never consecutive', () => {
  const g = () => it(2400, 1600);
  const t = (): PhotoRow => ({ _type: 'richTextSection' });
  const near = assignPhotoShapes([g(), g(), t(), t(), t(), t()]);
  assert.deepEqual([near.get(0), near.get(1)], ['ground', 'row']);
  const far = assignPhotoShapes([g(), t(), t(), t(), g(), t()]);
  assert.deepEqual([far.get(0), far.get(4)], ['ground', 'ground']);
  const third = assignPhotoShapes([g(), t(), t(), t(), g(), t(), t(), t(), g(), t()]);
  assert.equal(third.get(8), 'row');
});

test('a row with no picture gets no shape', () => {
  assert.equal(assignPhotoShapes([{ _type: 'imageTextSection', image: null }]).size, 0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-strip-types --test src/lib/photo-shape.test.ts`
Expected: FAIL, `Cannot find module`.

- [ ] **Step 3: Implement**

```ts
// src/lib/photo-shape.ts
// Safe to edit by hand
// The picture decides the band (design research note section 7; the approved
// prototype is docs/superpowers/prototypes/2026-09-22-richtext-and-photos/photos/).
// Pure and build-time. Inputs are the asset's WxH (from its ref), alt,
// eyebrow and the Portable Text body; every string is cleaned of stega first.
// The page-level pass is what enforces "one lancet per page" and the ground
// budget, so changing one band's picture in the Studio can change ANOTHER
// band's shape (a new portrait earlier on the page takes the arch). That is
// intended; docs/agent/components.md says so for editors.
import { parseSanityAssetDimensions } from './sanity-asset.ts';
import { splitStega } from './preview-stega.ts';
import { blockText, type PtBlock } from './span-split.ts';

export type PhotoShape = 'ground' | 'window' | 'frame' | 'plate' | 'legend' | 'row';
export interface PhotoRow {
  _type: string;
  image?: { asset?: { _ref?: string; _id?: string } | null; alt?: string | null } | null;
  eyebrow?: string | null;
  body?: PtBlock[] | null;
}

const clean = (s: string | null | undefined) => splitStega(s ?? '').cleaned;

export function photoAspect(image: PhotoRow['image']): { w: number; h: number; a: number } | null {
  if (!image?.asset) return null;
  const asset = image.asset;
  const d = parseSanityAssetDimensions({ asset: { _ref: asset._ref ? clean(asset._ref) : undefined, _id: asset._id ? clean(asset._id) : undefined } });
  return d ? { w: d.width, h: d.height, a: d.width / d.height } : null;
}

export function isArchival(alt: string | null | undefined, eyebrow: string | null | undefined): boolean {
  return /\b(1[5-8]\d\d|19[0-4]\d)\b/.test(`${clean(alt)} ${clean(eyebrow)}`);
}

export function findLegend(body: PtBlock[] | null | undefined) {
  const bl = Array.isArray(body) ? body : [];
  for (let i = 0; i < bl.length; i++) {
    const b = bl[i];
    if (b.listItem || !/left to right/i.test(blockText(b))) continue;
    let j = i + 1;
    while (j < bl.length && bl[j].listItem) j++;
    const count = j - (i + 1);
    if (count < 3 || count > 8) return null;
    const foot = j < bl.length && !bl[j].listItem && /^\*/.test(blockText(bl[j]).trim()) ? j : null;
    return { labelIndex: i, listStart: i + 1, listEnd: j, footIndex: foot };
  }
  return null;
}

export function assignPhotoShapes(rows: PhotoRow[], opts: { heroHasPhoto?: boolean } = {}): Map<number, PhotoShape> {
  const out = new Map<number, PhotoShape>();
  let portraits = 0;
  const grounds: number[] = [];
  const firstAfterHero = rows[0]?._type === 'heroSection' ? 1 : -1;
  rows.forEach((row, i) => {
    if (row._type !== 'imageTextSection') return;
    const d = photoAspect(row.image);
    if (!d) return;
    let shape: PhotoShape;
    if (d.a <= 0.85) shape = portraits++ === 0 ? 'window' : 'frame';
    else if (d.a >= 1.8 && findLegend(row.body)) shape = 'legend';
    else if (d.a < 1.25 && isArchival(row.image?.alt, row.eyebrow)) shape = 'plate';
    else if (d.a >= 1.3 && d.w >= 2000 && groundOk(i)) { shape = 'ground'; grounds.push(i); }
    else shape = 'row';
    out.set(i, shape);
  });
  return out;

  function groundOk(i: number): boolean {
    if (opts.heroHasPhoto && i === firstAfterHero) return false;
    if (grounds.length === 0) return true;
    if (grounds.length >= 2) return false;
    return i - grounds[0] >= 4 && rows.length >= 6;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --experimental-strip-types --test src/lib/photo-shape.test.ts && npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/photo-shape.ts src/lib/photo-shape.test.ts
git commit -m "feat(lib): photo shape classifier and page pass"
```

---

### Task 7: The lancet and the photo CSS

**Files:**
- Create: `src/components/sections/Lancet.astro`
- Modify: `src/styles/globals.css` (append after the Ledger CSS)

**Interfaces:**
- Produces: `<Lancet image={...} sizes="..." />` renders the window (clipped pane, surface fade, moulding). CSS `.ph-*` classes used by Task 8.

- [ ] **Step 1: Write `Lancet.astro`**

```astro
---
// Safe to edit by hand
// The window: a portrait seen through the 1929 tower's pointed lancet.
// Width 1 : height 2.1; the arch head is two arcs of radius 1.5 x span, a
// true lancet (HP Pres's arch is rounder; do not soften it). The photo starts
// 16% down and fades over its top 7% into the band's own surface, read from
// the inherited --band custom property, so the point reads as open glass in
// either theme with no colour known at build time. The gold moulding follows
// the arch 9px outside it. Used at most ONCE per page (src/lib/photo-shape.ts).
// The clipPath id is per-instance so two components on one page never collide.
import SanityImage from '@/components/SanityImage.astro';

interface Props { image: any; alt: string; /** The band's headingId: stable and unique, so parity never flaps. */ uid: string }
const { image, alt, uid } = Astro.props as Props;
const clipId = `lancet-${uid}`;
const d = 'M0,1 L0,0.5324 A1.5,0.7143 0 0 1 0.5,0 A1.5,0.7143 0 0 1 1,0.5324 L1,1 Z';
---

<div class="ph-window">
  <svg width="0" height="0" aria-hidden="true" focusable="false" class="absolute">
    <clipPath id={clipId} clipPathUnits="objectBoundingBox"><path d={d} /></clipPath>
  </svg>
  <div class="ph-pane" style={`clip-path:url(#${clipId})`}>
    <SanityImage source={image} width={800} sizes="(min-width: 1024px) 340px, 66vw" quality={78} alt={alt} class="ph-pane-img" />
  </div>
  <svg class="ph-moulding" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={d} /></svg>
</div>
```

- [ ] **Step 2: Append the photo CSS to `globals.css`** (prototype `photos/index.html`, "THE FAMILY" through the phone media queries, renamed to `.ph-*` and moved onto site tokens):

```css
/* ---------- Photo shapes: ImageText (2026-09-22) ----------
   Source of truth: docs/superpowers/prototypes/2026-09-22-richtext-and-photos/photos/.
   The classifier is src/lib/photo-shape.ts. --band and --mat are set on the
   <section> by ImageText from its surface prop. */
.ph-tick { display: block; width: 28px; height: 1px; background: var(--color-gold); }
.ph-cap { margin-top: 14px; font-style: italic; font-size: 0.9375rem; line-height: 1.45; color: var(--muted-foreground); max-width: 40ch; }
.ph-cap .ph-tick { margin-bottom: 9px; }
.ph-hung { position: relative; }
.ph-hung::after { content: ''; position: absolute; inset: -9px; border: 1px solid var(--color-gold); pointer-events: none; }
/* BESIDE: row, plate, window, frame. The text column is a plain block, not a
   grid: a narrow body is only measures, rows and lists (rich-shape narrow),
   so the Ledger's grid placements inside it are inert and its subgrids stack. */
.ph-text .rt-sub { display: block; }
.ph-text > :last-child { margin-bottom: 0; }
.ph-beside .ph-text { grid-column: 1 / 7; grid-row: 2; }
.ph-beside .ph-fig { grid-column: 8 / 13; grid-row: 2; align-self: start; }
.ph-beside.is-left .ph-fig { grid-column: 1 / 6; }
.ph-beside.is-left .ph-text { grid-column: 6 / 12; }
.ph-beside.is-row .ph-fig { position: sticky; top: calc(var(--header-offset) + 2rem); }
.ph-beside.is-row.w4 .ph-fig { grid-column: 9 / 13; } .ph-beside.is-row.is-left.w4 .ph-fig { grid-column: 1 / 5; }
.ph-beside.is-row.w6 .ph-fig { grid-column: 7 / 13; } .ph-beside.is-row.is-left.w6 .ph-fig { grid-column: 1 / 7; }
.ph-beside.is-row.w6 .ph-text { grid-column: 1 / 6; } .ph-beside.is-row.is-left.w6 .ph-text { grid-column: 8 / 13; }
.ph-beside.is-row.w7 .ph-fig { grid-column: 6 / 13; } .ph-beside.is-row.is-left.w7 .ph-fig { grid-column: 1 / 8; }
.ph-beside.is-row.w7 .ph-text { grid-column: 1 / 6; } .ph-beside.is-row.is-left.w7 .ph-text { grid-column: 8 / 13; }
.ph-img { width: 100%; height: auto; }
/* PLATE */
.ph-plate { background: var(--mat); padding: clamp(20px, 2.6vw, 40px) clamp(20px, 2.6vw, 40px) clamp(18px, 2vw, 28px); max-width: 500px; }
.ph-plate .ph-print { position: relative; }
.ph-plate .ph-print::after { content: ''; position: absolute; inset: -6px; border: 1px solid var(--color-gold); pointer-events: none; }
.ph-plate .ph-cap { margin-top: 22px; }
/* WINDOW */
.ph-window-wrap { width: min(100%, 340px); }
.ph-beside:not(.is-left) .ph-window-wrap { margin-left: auto; }
.ph-window { position: relative; width: 100%; }
.ph-pane { position: relative; aspect-ratio: 1 / 2.1; background: var(--band); }
.ph-pane-img { position: absolute; inset: 16% 0 0 0; width: 100%; height: 84%; object-fit: cover; object-position: 50% 0%;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 7%); mask-image: linear-gradient(to bottom, transparent 0, #000 7%); }
.ph-moulding { position: absolute; inset: -9px; width: calc(100% + 18px); height: calc(100% + 18px); overflow: visible; pointer-events: none; }
.ph-moulding path { fill: none; stroke: var(--color-gold); stroke-width: 1; vector-effect: non-scaling-stroke; }
.ph-window-wrap .ph-cap { margin-top: 23px; }
.ph-beside.is-window .ph-fig { grid-column: 9 / 13; } .ph-beside.is-window .ph-text { grid-column: 1 / 8; }
.ph-beside.is-window.is-left .ph-fig { grid-column: 1 / 5; } .ph-beside.is-window.is-left .ph-text { grid-column: 6 / 12; }
/* FRAME */
.ph-frame img { width: 100%; height: auto; max-height: 560px; object-fit: cover; object-position: 50% 15%; }
/* GROUND */
.ph-ground-fig { position: relative; width: 100cqw; margin-left: calc(50% - 50cqw); height: clamp(520px, 52cqw, 780px); overflow: hidden; background: #17151f; }
.ph-ground-fig > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 25%; }
.ph-ground-fig .hero-overlay { animation: none; }
.ph-ground-text { position: absolute; inset: auto 0 0 0; }
.ph-ground-text .ph-in { max-width: var(--container-content); margin: 0 auto; padding: 0 var(--spacing-gutter) clamp(36px, 5vw, 64px); color: #f4efe6; }
.ph-ground-text .ph-tick { margin-bottom: 16px; }
.ph-ground-text h2 { max-width: 16ch; }
.ph-ground-text .ph-lede { margin-top: 18px; max-width: 30em; font-style: italic; font-size: var(--text-lede); line-height: 1.35; color: rgb(244 239 230 / 92%); }
.ph-gcap { grid-column: 1 / -1; margin: 0 0 clamp(48px, 6vw, 80px); display: flex; gap: 14px; align-items: baseline; }
.ph-gcap .ph-tick { flex: none; transform: translateY(-4px); }
.ph-gbody { grid-column: 1 / 11; }
/* LEGEND */
.ph-legend { grid-column: 1 / -1; }
.ph-legend .ph-label { color: var(--color-gold-ink); margin: 18px 0 0; }
.ph-names { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); column-gap: clamp(16px, 2.5vw, 40px); list-style: none; padding: 0; margin: 12px 0 0; }
.ph-names li { padding-top: 12px; font-size: var(--text-item); line-height: 1.3; position: relative; text-align: center; }
.ph-names li::before { content: ''; position: absolute; top: 0; left: calc(50% - 14px); width: 28px; height: 1px; background: var(--color-gold); }
.ph-names .ph-pos { display: none; }
.ph-legend .ph-foot { margin-top: 12px; color: var(--muted-foreground); font-size: 0.9375rem; }
.ph-legend .ph-cap { margin-top: 26px; }
.ph-legend-rest { grid-column: 1 / 11; margin-top: clamp(40px, 5vw, 72px); }
@media (max-width: 1023px) {
  .ph-beside .ph-fig, .ph-beside .ph-text { grid-column: 1 / -1 !important; grid-row: auto !important; }
  .ph-beside .ph-fig { margin-bottom: 40px; position: static !important; }
  .ph-beside:not(.is-left) .ph-window-wrap { margin-left: 9px; }
  .ph-window-wrap { width: min(66%, 250px); margin: 9px; }
  .ph-plate { max-width: none; }
  .ph-ground-fig { height: clamp(480px, 128cqw, 640px); }
  .ph-gbody, .ph-legend-rest { grid-column: 1 / -1; }
  .ph-names { column-gap: 10px; }
  .ph-names li { font-size: 0.9375rem; }
}
@media (max-width: 520px) {
  .ph-names { grid-template-columns: 1fr; }
  .ph-names li { display: grid; grid-template-columns: 2.2em 1fr; padding: 8px 0; border-top: 1px solid var(--hair); text-align: left; }
  .ph-names li::before { display: none; }
  .ph-names .ph-pos { display: inline; font-family: var(--font-ui); font-size: var(--text-ui); letter-spacing: 0.1em; color: var(--color-gold-ink); }
}
```

The ground's bleed is `width: 100cqw` plus a negative left margin measured in `cqw`; no `vw` anywhere (rule 19). The ground reuses the hero's `.hero-overlay` class (the same two gradients, globals.css line 1131) with its breathing animation switched off.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Lancet.astro src/styles/globals.css
git commit -m "feat(ui): the lancet window and photo-shape CSS"
```

---

### Task 8: ImageText rewrite and the SectionRenderer pass

**Files:**
- Rewrite: `src/components/sections/ImageText.astro`
- Modify: `src/components/SectionRenderer.astro:107` (after `const spares = ...`) and `:327-339` (the ImageText call)

**Interfaces:**
- Consumes: `assignPhotoShapes`, `photoAspect`, `findLegend`, `PhotoShape` (Task 6); `classifyRichText`, `isLedeParagraph` (Task 2); `RichBody` (Task 4); `Lancet` (Task 7).
- Produces: `ImageText` prop `shape?: PhotoShape` (default `'row'`).

- [ ] **Step 1: Verify the stega fields first**

Run: `grep -n "'imageSide'\|'align'" src/lib/cms-preview.ts`
Expected: both present in `NON_STEGA_FIELDS`. If `imageSide` is missing, stop and add it in its own commit before continuing (rule 8b).

- [ ] **Step 2: Add the page pass to SectionRenderer**

After line 107 (`const spares = assignSpareImages(...)`), add:

```ts
// PHOTO SHAPES (2026-09-22). The picture decides the band: see
// src/lib/photo-shape.ts. The pass runs on the picture each ImageText row will
// ACTUALLY render (after the spare-image swap above), because a borrowed
// picture changes the shape. It is page-level so there is at most one lancet
// window and at most two grounds per page.
const heroHasPhoto = rows.some(({ block }) => {
  const b = block as { _type?: string; frames?: unknown[]; backgroundImage?: unknown };
  return b._type === 'heroSection' && ((Array.isArray(b.frames) && b.frames.length > 0) || !!b.backgroundImage);
});
const renderedImage = (block: unknown, index: number) =>
  spares.replacements.has(index) ? spares.replacements.get(index) : (block as { image?: unknown }).image;
const photoShapes = assignPhotoShapes(
  rows.map(({ block }, i) => ({ ...(block as object), image: renderedImage(block, i) }) as PhotoRow),
  { heroHasPhoto },
);
```

with `import { assignPhotoShapes, type PhotoRow } from '@/lib/photo-shape';` at the top beside the other lib imports. Change the ImageText call to:

```astro
<ImageText
  image={renderedImage(s, blockIndex)}
  imageSide={s.imageSide}
  eyebrow={s.eyebrow}
  heading={s.heading}
  body={s.body}
  cta={s.cta}
  shape={photoShapes.get(blockIndex) ?? 'row'}
  surface={surface ?? 'background'}
  headingId={headingId}
/>
```

- [ ] **Step 3: Rewrite `ImageText.astro`**

Keep notes 2 (caption is the alt), 4 (a borrowed picture can make `image` null; the band then renders text alone) from the current header, drop note 3 (the forced 16:9 crop is the bug being removed), and replace note 1 with a pointer to `isLedeParagraph`. Then:

```astro
---
// Safe to edit by hand
// Page-builder block: one picture and its text. The PICTURE decides the band
// (2026-09-22; src/lib/photo-shape.ts, prototype in
// docs/superpowers/prototypes/2026-09-22-richtext-and-photos/photos/):
//   ground  a wide sharp view of the place; the band's ground, heading set in
//   window  the page's first portrait, through the tower's lancet (Lancet.astro)
//   frame   any later portrait, native shape, hung on a gold line
//   plate   an archival scan, matted on the other surface, never cropped
//   legend  a wide group photo whose body names the people left to right
//   row     everything else, beside its text at its native shape
// No picture ever sits in a column below its words, and no picture is forced
// into a landscape crop (that is how portraits lost their heads).
// [keep notes 2 and 4 from the previous header here]
import { surfaceClass } from '@/lib/surfaces';
import SanityImage from '@/components/SanityImage.astro';
import PortableText from '@/components/PortableText';
import CtaLink from '@/components/CtaLink.astro';
import RichBody from '@/components/sections/RichBody.astro';
import Lancet from '@/components/sections/Lancet.astro';
import { classifyRichText, isLedeParagraph } from '@/lib/rich-shape';
import { photoAspect, findLegend, type PhotoShape } from '@/lib/photo-shape';
import { splitStega } from '@/lib/preview-stega';

interface Props {
  image?: any; imageSide?: 'left' | 'right'; eyebrow?: string; heading?: string; body?: any; cta?: any;
  shape?: PhotoShape; surface?: 'background' | 'muted'; headingId: string;
}
const { image, imageSide = 'left', eyebrow, heading, body, cta, shape: shapeProp = 'row', surface = 'background', headingId } =
  Astro.props as Props;

const bg = surfaceClass(surface);
const band = surface === 'muted' ? 'var(--color-muted)' : 'var(--color-background)';
const mat = surface === 'muted' ? 'var(--color-background)' : 'var(--color-muted)';
const blocks: any[] = Array.isArray(body) ? body : [];
const hasPicture = !!image?.asset;
const shape: PhotoShape = hasPicture ? shapeProp : 'row';
const alt = splitStega(image?.alt ?? '').cleaned;
const dims = photoAspect(image);

// The lede: one rule for the whole site (src/lib/rich-shape.ts isLedeParagraph).
const firstRun = blocks.findIndex((b) => b?.listItem || (b?.style ?? 'normal') !== 'normal');
const runLength = firstRun === -1 ? blocks.length : firstRun;
const ledeBlock = isLedeParagraph(blocks[0], runLength, blocks.length - 1) ? blocks[0] : null;
let rest = ledeBlock ? blocks.slice(1) : blocks;

// The legend lifts its label, names and footnote out of the body.
const legend = shape === 'legend' ? findLegend(rest) : null;
const legendLabel = legend ? rest[legend.labelIndex] : null;
const legendNames = legend ? rest.slice(legend.listStart, legend.listEnd) : [];
const legendFoot = legend && legend.footIndex !== null ? rest[legend.footIndex] : null;
if (legend) rest = rest.filter((_, i) => i < legend.labelIndex || i >= (legend.footIndex !== null ? legend.footIndex + 1 : legend.listEnd));

const beside = shape === 'row' || shape === 'window' || shape === 'frame' || shape === 'plate';
const layout = classifyRichText(rest, { hasHead: false, narrow: beside });
const side = imageSide; // the schema default is 'left', which is where the window wants to be
// ROW width follows the picture (P1's mapping): portrait 4, square 5, landscape 6, wide 7.
const rowWidth = !dims ? 6 : dims.a < 0.9 ? 4 : dims.a <= 1.15 ? 5 : dims.a < 1.6 ? 6 : 7;
const rowBleed = shape === 'row' && dims && dims.a >= 1.15;
---

<section class={bg} style={`--band:${band};--mat:${mat}`} aria-labelledby={heading ? headingId : undefined} data-photo-shape={hasPicture ? shape : 'none'}>
  {shape === 'ground' ? (
    <>
      <div class="ph-ground-fig">
        <SanityImage source={image} width={2400} sizes="100vw" quality={75} alt={alt} />
        <div class="hero-overlay" aria-hidden="true"></div>
        <div class="ph-ground-text"><div class="ph-in">
          {eyebrow && (<><span class="ph-tick"></span><p class="mb-5 font-ui text-ui text-gold">{eyebrow}</p></>)}
          {heading && <h2 id={headingId} class="font-body text-h2 font-normal">{heading}</h2>}
          {ledeBlock && <div class="ph-lede"><PortableText value={[ledeBlock]} variant="bare" /></div>}
        </div></div>
      </div>
      <div class="mx-auto max-w-content px-gutter pt-[clamp(20px,2.4vw,28px)] pb-section-lg">
        <div class="rt-g">
          {alt && <p class="ph-gcap"><span class="ph-tick"></span><span class="ph-cap mt-0">{alt}</span></p>}
          <div class="ph-gbody rt-g"><RichBody pieces={layout.pieces} /></div>
          {cta?.label && <div class="mt-8"><CtaLink cta={cta} variant="link" /></div>}
        </div>
      </div>
    </>
  ) : (
    <div class="mx-auto max-w-content px-gutter py-section-lg">
      <div class:list={['rt-g', beside && hasPicture && 'ph-beside', `is-${shape}`, side === 'left' && 'is-left', shape === 'row' && `w${rowWidth}`]}>
        <header class="rt-head">
          {eyebrow && <p class="mb-5 font-ui text-ui text-gold-ink">{eyebrow}</p>}
          {heading && <h2 id={headingId} class="max-w-[22ch] font-body text-h2 font-normal text-foreground">{heading}</h2>}
        </header>

        {shape === 'legend' && hasPicture ? (
          <>
            <figure class="ph-legend">
              <SanityImage source={image} width={2000} sizes="(min-width: 1400px) 1400px, 100vw" quality={78} alt={alt} class="ph-img" />
              {legendLabel && <div class="ph-label font-ui text-ui"><PortableText value={[legendLabel]} variant="bare" /></div>}
              <ol class="ph-names" style={`--n:${legendNames.length}`}>
                {legendNames.map((nm, k) => <li><span class="ph-pos">{k + 1}</span><PortableText value={[nm]} variant="bare" /></li>)}
              </ol>
              {legendFoot && <div class="ph-foot"><PortableText value={[legendFoot]} variant="bare" /></div>}
              {alt && <figcaption class="ph-cap"><span class="ph-tick"></span>{alt}</figcaption>}
            </figure>
            <div class="ph-legend-rest rt-g">
              {ledeBlock && <div class="rt-lede rt-v"><PortableText value={[ledeBlock]} variant="bare" /></div>}
              <RichBody pieces={layout.pieces} />
            </div>
          </>
        ) : (
          <>
            {hasPicture && (
              <div class="ph-fig" data-reveal>
                {shape === 'window' ? (
                  <figure class="ph-window-wrap"><Lancet image={image} alt={alt} uid={headingId} />{alt && <figcaption class="ph-cap"><span class="ph-tick"></span>{alt}</figcaption>}</figure>
                ) : shape === 'plate' ? (
                  <figure class="ph-plate"><div class="ph-print"><SanityImage source={image} width={1000} sizes="500px" quality={80} alt={alt} class="ph-img" /></div>{alt && <figcaption class="ph-cap"><span class="ph-tick"></span>{alt}</figcaption>}</figure>
                ) : shape === 'frame' ? (
                  <figure class="ph-frame"><div class="ph-hung"><SanityImage source={image} width={900} sizes="(min-width: 1024px) 420px, 100vw" quality={78} alt={alt} class="ph-img" /></div>{alt && <figcaption class="ph-cap"><span class="ph-tick"></span>{alt}</figcaption>}</figure>
                ) : (
                  <figure class:list={[rowBleed && (side === 'left' ? 'bleed-left' : 'bleed-right')]}>
                    <SanityImage source={image} width={1600} sizes="(min-width: 1024px) 60vw, 100vw" quality={75} alt={alt} class="ph-img" />
                    {alt && <figcaption class="ph-cap"><span class="ph-tick"></span>{alt}</figcaption>}
                  </figure>
                )}
              </div>
            )}
            {hasPicture ? (
              <div class="ph-text">
                {ledeBlock && <div class="rt-lede rt-v"><PortableText value={[ledeBlock]} variant="bare" /></div>}
                <RichBody pieces={layout.pieces} />
                {cta?.label && <div class="mt-8"><CtaLink cta={cta} variant="link" /></div>}
              </div>
            ) : (
              <div class="rt-sub">
                {ledeBlock && <div class="rt-lede rt-v"><PortableText value={[ledeBlock]} variant="bare" /></div>}
                <RichBody pieces={layout.pieces} />
                {cta?.label && <div class="col-span-12 mt-8"><CtaLink cta={cta} variant="link" /></div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )}
</section>
```

Notes the implementer must respect:
- `SanityImage` must NOT receive a crop or aspect class anywhere except `.ph-frame` (which caps height at 560px anchored 15% from the top) and the ground and window (which are framed by CSS). Read `src/components/SanityImage.astro` first and confirm it passes `alt` and `class` through; if its prop for alt differs, use its name.
- The row's caption on a bled figure must start inside the container: add `.ph-beside .bleed-left .ph-cap { margin-left: var(--spacing-gutter); }` if the 1440 screenshot shows it at x=0 (the critique's defect 4e).
- A band whose picture was borrowed (`image` null) renders `data-photo-shape="none"` with the text across the full grid, which is note 4's existing behaviour.

- [ ] **Step 4: Build, type-check, unit**

Run: `npm run check && npm run test:unit && npm run build`
Expected: all pass.

- [ ] **Step 5: Look at every photo band**

Capture `/`, `/visit`, `/ministries`, `/staff`, `/history`, `/contact`, `/wedding` at 1440 (real scrollbars), 390 and 320, light and dark, into the scratchpad. For each `data-photo-shape` section record its shape and check:
- no face is cut at the top of the head (the Fighting Parson on `/history`, Kendall on `/contact`, the deacons on `/staff`);
- `/history` shows exactly one lancet and the later portrait as a frame;
- no `ground` sits directly under a photo hero;
- the ground's words sit bottom-left on the page's one left edge;
- `document.documentElement.scrollWidth <= innerWidth` at 1440, 390 and 320.
Compare with `docs/superpowers/prototypes/2026-09-22-richtext-and-photos/photos/index.html`. Fix and re-shoot until they match.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/ImageText.astro src/components/SectionRenderer.astro
git commit -m "feat(sections): ImageText places its picture by the picture's shape"
```

---

### Task 9: Part B gates and the parity recapture

**Files:** `scripts/.parity/*` (recaptured).

- [ ] **Step 1: Full gates**

Run: `npm run test:unit && npm run check && npm run format:check && npm run check:links`
Then: `npm test`
Expected: all pass, including `chromium-scrollbars` reflow and axe light and dark. If axe flags the ground's text contrast, measure it with `src/lib/contrast.ts` over the darkest and lightest point under the words; the hero's gradient is the same recipe and passes, so a failure means the overlay did not render.

- [ ] **Step 2: Preview check**

`npm run build && npm run preview`, Presentation tool on `/history` and `/staff`: click the lancet band's heading and body, the legend's names, a plate caption. Each must focus the right field. Swap `/history`'s first portrait band's image in a draft to a landscape and confirm the next portrait takes the lancet (the page pass), then discard the draft.

- [ ] **Step 3: Parity recapture with the fixpoint proof**

Run: `npm run build && npm run parity:capture && npm run build && npm run parity:compare`
Expected: 162/162 PASS on the second build, and the stylesheet byte count identical on both builds (CLAUDE.md, "Prove that pair of numbers"). Record both numbers in the commit message.

- [ ] **Step 4: Lighthouse on the pages that gained a ground**

Run `npx lhci autorun` (or the repo's `lighthouse.yml` locally) on `/` and `/visit`, mobile and desktop, and compare LCP with `docs/superpowers/notes/2026-09-20-lighthouse.md`. A ground on `/` is below the fold (the hero is above it); confirm the ground image is `loading="lazy"` there.

- [ ] **Step 5: Commit**

```bash
git add scripts/.parity
git commit -m "test: recapture parity for the Ledger and photo shapes (stylesheet N bytes, fixpoint)"
```

---

### Task 10: Docs, PENDING and the rules that bite

**Files:**
- Modify: `docs/agent/components.md` (RichTextSection and ImageText entries)
- Modify: `docs/agent/changelog.md` (one dated entry)
- Modify: `docs/PENDING.md` (close critique items this fixed; open what it did not)
- Modify: `CLAUDE.md` ("Where it stands" paragraph, and the unit-test count in "Standalone scripts")

- [ ] **Step 1: components.md.** Replace the RichTextSection and ImageText descriptions with: what decides the layout (link `rich-shape.ts`, `photo-shape.ts`), the branch list, the page pass and its editor-facing surprise (changing one band's picture can change another band's shape; one lancet per page), and the two prototypes as the visual reference.

- [ ] **Step 2: changelog.md.** One entry dated the merge day: what changed, the two new sizes, parity recaptured, the stylesheet byte count.

- [ ] **Step 3: PENDING.md.** Close: critique items 1 (RichText monoculture), 2 (portrait crops), 4a (lede guard). Open, each as its own line: the pastors' letter reads as newspaper columns (no signal for "letter" in the body); the pledge gets plain rows (no shared opening word); short History sections under about 100 words sit in one column across the left half; `/beliefs` and `/ministries` carry heavy hairline density; the ground test cannot detect a crowded photo (a field would be needed; not taken).

- [ ] **Step 4: CLAUDE.md.** Update the "Where it stands" paragraph with one sentence on the Ledger and photo shapes, and the unit-test count to the new total from `npm run test:unit`. Do not add a numbered rule unless a gotcha bit during the work; if one did (for example a stega split that broke click-to-edit), add it as rule 20 in the house style: what happened, the measured cause, the fix.

- [ ] **Step 5: Commit**

```bash
git add docs/agent/components.md docs/agent/changelog.md docs/PENDING.md CLAUDE.md
git commit -m "docs: the Ledger and photo shapes"
```

- [ ] **Step 6: Hand back for the merge.** Report to Nathan with: the branch name, the gate results with their numbers, the parity fixpoint pair, before/after screenshots of `/history` (the Fighting Parson), `/beliefs` (the covenant), `/staff` (the deacons) and `/` (the ground), and the open items from Step 3. Nathan merges to `main` locally; do not push.
