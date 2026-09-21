import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignSpareImages } from './spare-images.ts';

// A minimal image object: the helper only ever looks at `asset`.
const img = (id: string) => ({ _type: 'image', asset: { _id: id }, alt: id });

test('an array with no pictures in it hands nothing out', () => {
  const out = assignSpareImages([
    { _type: 'sundayTimesSection' },
    { _type: 'linkCardsSection', heading: 'Three doors' },
    { _type: 'richTextSection' },
  ]);
  assert.equal(out.statement, null);
  assert.equal(out.door, null);
  assert.deepEqual(out.strip, []);
  assert.equal(out.statementIndex, null);
  assert.equal(out.doorIndex, null);
});

test('the home-like array gives the statement the image+text photo and the door the building photo', () => {
  const a = img('sanctuary');
  const b = img('building');
  const out = assignSpareImages([
    { _type: 'sundayTimesSection' },
    { _type: 'imageTextSection', image: a },
    { _type: 'linkCardsSection', heading: 'First Baptist Muncie' },
    { _type: 'heritageBandSection', image: b },
  ]);
  assert.equal(out.statement, a);
  assert.equal(out.door, b);
  assert.deepEqual(out.strip, []);
  // The indexes are ROW indexes: the block that receives the image.
  assert.equal(out.statementIndex, 2);
  assert.equal(out.doorIndex, 0);
});

test('with no link-cards band the door takes the first picture in the pool', () => {
  const a = img('sanctuary');
  const out = assignSpareImages([
    { _type: 'sundayTimesSection' },
    { _type: 'imageTextSection', image: a },
  ]);
  assert.equal(out.statement, null);
  assert.equal(out.statementIndex, null);
  assert.equal(out.door, a);
  assert.equal(out.doorIndex, 0);
  assert.deepEqual(out.strip, []);
});

test('a link-cards band with no heading takes nothing', () => {
  const a = img('sanctuary');
  const out = assignSpareImages([
    { _type: 'linkCardsSection', cards: [] },
    { _type: 'sundayTimesSection' },
    { _type: 'imageTextSection', image: a },
  ]);
  assert.equal(out.statement, null);
  assert.equal(out.statementIndex, null);
  assert.equal(out.door, a);
  assert.equal(out.doorIndex, 1);
});

test('gallery photos join the pool in array order and the leftovers become the strip', () => {
  const a = img('a');
  const b = img('b');
  const c = img('c');
  const d = img('d');
  const out = assignSpareImages([
    { _type: 'linkCardsSection', heading: 'Doors' },
    { _type: 'gallerySection', images: [a, { _type: 'image' }, b] },
    { _type: 'sundayTimesSection' },
    { _type: 'heritageBandSection', image: c },
    { _type: 'imageTextSection', image: d },
  ]);
  // The image with no asset is skipped, so the pool is [a, b, c, d].
  assert.equal(out.statement, a);
  assert.equal(out.door, b);
  assert.deepEqual(out.strip, [c, d]);
});

test('only the first eligible consumer of each kind is served', () => {
  const a = img('a');
  const b = img('b');
  const c = img('c');
  const out = assignSpareImages([
    { _type: 'imageTextSection', image: a },
    { _type: 'imageTextSection', image: b },
    { _type: 'imageTextSection', image: c },
    { _type: 'linkCardsSection', heading: 'One' },
    { _type: 'linkCardsSection', heading: 'Two' },
    { _type: 'sundayTimesSection' },
    { _type: 'sundayTimesSection' },
  ]);
  assert.equal(out.statementIndex, 3);
  assert.equal(out.doorIndex, 5);
  assert.equal(out.statement, a);
  assert.equal(out.door, b);
  assert.deepEqual(out.strip, [c]);
});

// ── Portraits stay out of the pool (fix round 1, 2026-09-21) ───────────────
// A borrowed picture is always drawn wide: the Sunday band's frame is a 4:3
// crop and the statement band is a full-width backdrop. A portrait cropped to
// 4:3 is a face with the top of its head cut off, which is how /contact came
// to borrow a staff headshot. The dimensions are in the asset ref, so the pool
// can tell before it hands anything out.
const sized = (id: string, w: number, h: number) => ({
  _type: 'image',
  asset: { _ref: `image-${id}-${w}x${h}-jpg` },
  alt: id,
});

test('a portrait picture is not borrowed', () => {
  const portrait = sized('headshot', 1200, 1800);
  const landscape = sized('nave', 2000, 1500);
  const out = assignSpareImages([
    { _type: 'imageTextSection', image: portrait },
    { _type: 'sundayTimesSection' },
    { _type: 'heritageBandSection', image: landscape },
  ]);
  assert.equal(out.door, landscape);
  assert.deepEqual(out.strip, []);
});

test('a picture whose dimensions cannot be read is kept', () => {
  // No WxH in the ref (and the older projections that only carry `_id`), so
  // there is nothing to judge it on. Keeping it is the safer default: the
  // alternative empties the pool on any dataset whose refs do not parse.
  const unknown = { _type: 'image', asset: { _ref: 'image-mystery-jpg' } };
  const out = assignSpareImages([
    { _type: 'imageTextSection', image: unknown },
    { _type: 'sundayTimesSection' },
  ]);
  assert.equal(out.door, unknown);
});

test('a square picture is landscape enough to borrow', () => {
  const square = sized('square', 1200, 1200);
  const out = assignSpareImages([
    { _type: 'imageTextSection', image: square },
    { _type: 'sundayTimesSection' },
  ]);
  assert.equal(out.door, square);
});
