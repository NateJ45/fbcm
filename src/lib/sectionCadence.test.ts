import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySections, CONTENT_TYPES, SELF_CONTAINED_TYPES } from './sectionCadence.ts';

// Helpers
const block = (type: string, extra: Record<string, unknown> = {}) => ({ _type: type, ...extra });
const surfaces = (rows: ReturnType<typeof classifySections>) => rows.map((r) => r.surface);
const dividers = (rows: ReturnType<typeof classifySections>) =>
  rows.map((r) => r.insertDividerBefore);

test('empty array returns empty rows', () => {
  assert.deepEqual(classifySections([]), []);
});

test('nulls and non-objects are filtered out', () => {
  const rows = classifySections([null, undefined, 42, block('richTextSection')]);
  assert.equal(rows.length, 1);
});

test('content blocks get alternating surface assignments starting at background', () => {
  const rows = classifySections([
    block('richTextSection'),
    block('imageTextSection'),
    block('gallerySection'),
  ]);
  assert.deepEqual(surfaces(rows), ['background', 'muted', 'background']);
});

test('self-contained blocks get null surface', () => {
  for (const type of SELF_CONTAINED_TYPES) {
    const rows = classifySections([block(type)]);
    assert.equal(rows[0].surface, null, `${type} should have null surface`);
  }
});

test('self-contained blocks do not advance the content cadence counter', () => {
  const rows = classifySections([
    block('richTextSection'), // background (idx 0)
    block('heroSection'), // null (self-contained, no counter advance)
    block('richTextSection'), // muted (idx 1, counter was not reset)
  ]);
  assert.deepEqual(surfaces(rows), ['background', null, 'muted']);
});

test('text hero (no backgroundImage) shifts cadence to start at muted', () => {
  const rows = classifySections([
    block('heroSection'), // text hero — no backgroundImage
    block('richTextSection'), // should be muted (idx 1 start)
    block('imageTextSection'), // background (idx 2)
  ]);
  assert.deepEqual(surfaces(rows), [null, 'muted', 'background']);
});

test('image hero does not shift cadence', () => {
  const rows = classifySections([
    block('heroSection', { backgroundImage: { asset: { _ref: 'image-abc' } } }),
    block('richTextSection'), // background (idx 0)
    block('imageTextSection'), // muted (idx 1)
  ]);
  assert.deepEqual(surfaces(rows), [null, 'background', 'muted']);
});

test('divider inserted between adjacent content blocks of differing surface', () => {
  const rows = classifySections([
    block('richTextSection'), // background
    block('imageTextSection'), // muted -> divider before this
  ]);
  assert.deepEqual(dividers(rows), [false, true]);
});

test('no divider between two blocks with the same surface', () => {
  // Edge case: if the cadence somehow produces same-surface adjacency (e.g., after
  // a block type that resets), no divider. In practice this does not occur with the
  // standard alternating logic, but the rule should hold.
  const rows = classifySections([block('richTextSection')]);
  assert.deepEqual(dividers(rows), [false]);
});

test('no divider between content block and self-contained block', () => {
  const rows = classifySections([
    block('richTextSection'), // background
    block('heroSection'), // self-contained, no divider
    block('imageTextSection'), // muted, divider should appear before this (different surface from richText)
  ]);
  assert.deepEqual(dividers(rows), [false, false, true]);
});

test('headingId uses idPrefix and index', () => {
  const rows = classifySections([block('richTextSection'), block('quoteSection')], 'page');
  assert.equal(rows[0].headingId, 'page-0');
  assert.equal(rows[1].headingId, 'page-1');
});

test('unknown _type gets null surface (treated as unknown, not content)', () => {
  const rows = classifySections([block('unknownBlock')]);
  assert.equal(rows[0].surface, null);
});

// 2026-09-18: the four lists below are ANNOTATED `string[]` rather than
// inferred. Every name in them is scaffold-marked, so a fork that removes
// enough capabilities empties one, and an empty array literal is an implicit
// `any[]` that fails `astro check` under strict mode. The annotation is what
// lets the list shrink to nothing without taking the type check with it.

// ── Phase B: rich section type classification ─────────────────────────────

test('rich SELF_CONTAINED types get null surface', () => {
  // 2026-09-18: this list was empty, so the loop below ran zero times and the
  // test passed while asserting nothing. A scaffold removal took the phase-B
  // self-contained types it named with it. Re-pointed at the self-contained
  // types this repo STILL declares, which is what the test was for.
  const richSelf: string[] = [
    'logoStripSection',
    'teamSection',
    'embedSection',
    'dynamicListSection',
  ];
  assert.ok(richSelf.length > 0, 'a list this test loops over must not be empty');
  for (const type of richSelf) {
    const rows = classifySections([block(type)]);
    assert.equal(rows[0].surface, null, `${type} should have null surface`);
  }
});

test('every new rich type appears in SELF_CONTAINED_TYPES or CONTENT_TYPES', () => {
  // 2026-09-18: was two names after a scaffold removal, which made "every new
  // rich type" a claim about two of the fifteen. Now it is derived from the sets
  // themselves, so a type added to neither set, or to both, fails here without
  // anyone having to remember to edit a hand-maintained list.
  const all8: string[] = [...SELF_CONTAINED_TYPES, ...CONTENT_TYPES];
  assert.ok(all8.length > 0, 'a list this test loops over must not be empty');
  for (const type of all8) {
    const inSelf = SELF_CONTAINED_TYPES.has(type);
    const inContent = CONTENT_TYPES.has(type);
    assert.ok(
      inSelf || inContent,
      `${type} must be classified in SELF_CONTAINED_TYPES or CONTENT_TYPES`,
    );
    assert.ok(!(inSelf && inContent), `${type} cannot be in both sets`);
  }
});

// ── U7: new page-builder blocks — all SELF_CONTAINED ─────────────────────

test('logoStripSection is SELF_CONTAINED (null surface)', () => {
  const rows = classifySections([block('logoStripSection')]);
  assert.equal(rows[0].surface, null, 'logoStripSection should have null surface');
});

test('teamSection is SELF_CONTAINED (null surface)', () => {
  const rows = classifySections([block('teamSection')]);
  assert.equal(rows[0].surface, null, 'teamSection should have null surface');
});

test('embedSection is SELF_CONTAINED (null surface)', () => {
  const rows = classifySections([block('embedSection')]);
  assert.equal(rows[0].surface, null, 'embedSection should have null surface');
});

test('U7 blocks do not advance the content cadence counter', () => {
  const rows = classifySections([
    block('richTextSection'), // background (idx 0)
    block('ctaBandSection'), // null — no advance
    block('logoStripSection'), // null — no advance
    block('teamSection'), // null — no advance
    block('embedSection'), // null — no advance
    block('richTextSection'), // muted (idx 1)
  ]);
  assert.deepEqual(surfaces(rows), ['background', null, null, null, null, 'muted']);
});

test('every U7 type appears in SELF_CONTAINED_TYPES and not CONTENT_TYPES', () => {
  const u7: string[] = ['logoStripSection', 'teamSection', 'embedSection'];
  for (const type of u7) {
    assert.ok(SELF_CONTAINED_TYPES.has(type), `${type} must be in SELF_CONTAINED_TYPES`);
    assert.ok(!CONTENT_TYPES.has(type), `${type} must not be in CONTENT_TYPES`);
  }
});

// ── Church-reverse-port: dynamicListSection ───────────────────────────────

test('dynamicListSection is SELF_CONTAINED (null surface)', () => {
  const rows = classifySections([block('dynamicListSection')]);
  assert.equal(rows[0].surface, null, 'dynamicListSection should have null surface');
});

test('dynamicListSection does not advance the content cadence counter', () => {
  const rows = classifySections([
    block('richTextSection'), // background (idx 0)
    block('dynamicListSection'), // null — self-contained, no advance
    block('imageTextSection'), // muted (idx 1)
  ]);
  assert.deepEqual(surfaces(rows), ['background', null, 'muted']);
});

test('dynamicListSection appears in SELF_CONTAINED_TYPES and not CONTENT_TYPES', () => {
  assert.ok(
    SELF_CONTAINED_TYPES.has('dynamicListSection'),
    'dynamicListSection must be in SELF_CONTAINED_TYPES',
  );
  assert.ok(
    !CONTENT_TYPES.has('dynamicListSection'),
    'dynamicListSection must not be in CONTENT_TYPES',
  );
});

// scaffold: church
// ── Task 4: the eight church blocks ────────────────────────────────────────
// Marked as a block: the eight type names live in SELF_CONTAINED_TYPES /
// CONTENT_TYPES in sectionCadence.ts, which --remove church edits. Without the
// markers the removal would leave this test asserting names that no longer
// exist, which is rule 14's failure mode with the volume turned up.

test('church blocks are classified: dark bands self-contained, the rest alternate', () => {
  for (const t of [
    'sundayTimesSection',
    'faqSection',
    'scriptureBandSection',
    'heritageBandSection',
    'giveBandSection',
    // 2026-09-24, the Staff identity pass: a staff band's ground is derived
    // from its group (src/lib/staff-band.ts), so it no longer takes the cadence.
    'staffGridSection',
  ]) {
    assert.ok(SELF_CONTAINED_TYPES.has(t), `${t} should be self-contained`);
  }
  for (const t of ['timelineSection', 'documentListSection', 'hoursSection']) {
    assert.ok(CONTENT_TYPES.has(t), `${t} should alternate with the cadence`);
  }
});
// scaffold:end
