import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignSpareImages, cardsPictured } from './spare-images.ts';

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
  // `c` is not in the strip any more: the first image+text band lent `a` to the
  // statement, so the duplicate pass (below) gives that band `c` to draw
  // instead, and the second band, whose `b` went to the door, finds the pool
  // empty and draws no figure. Both are what the page should show; the strip is
  // what is left after that, which is nothing.
  assert.deepEqual(out.strip, []);
  assert.equal(out.replacements.get(0), c);
  assert.equal(out.replacements.get(1), null);
  // And the third band, whose `c` is now drawn by the first, draws none either:
  // "a block that lent its picture does not also draw it" holds however the
  // picture was lent, as the statement's backdrop or as someone's replacement.
  assert.equal(out.replacements.get(2), null);
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

// ── Hero frames feed the pool, and duplicates are replaced ─────────────────
// (fix round 1, 2026-09-21). Two defects showed up on the built home page.
//
// (1) The pool only ever held pictures from BANDS, so a page whose photographs
// are mostly in the hero's cross-fade had almost nothing to lend. Every frame
// after the first is a photograph nobody else on the page is using, and the
// FIRST is never borrowed: it is the LCP image, and a second copy of it at a
// different crop is a second decode on the slowest paint of the page.
//
// (2) A block that LENT its picture still drew it, so home showed the nave
// full-bleed in the statement band and again, at almost the same crop, in the
// image-and-text band two screens earlier. It read as a mistake, not as two
// distances. So an imageTextSection whose own image was handed out is given a
// replacement instead: the next unused picture, or nothing at all.

test('the hero lends every frame after the first, and never the first', () => {
  const tower = img('tower');
  const sanctuary = img('sanctuary');
  const children = img('children');
  const out = assignSpareImages([
    { _type: 'heroSection', frames: [tower, sanctuary, children] },
    { _type: 'linkCardsSection', heading: 'Statement' },
    { _type: 'sundayTimesSection' },
  ]);
  assert.equal(out.statement, sanctuary);
  assert.equal(out.door, children);
  assert.deepEqual(out.strip, []);
  // The LCP frame is never borrowed, at any position.
  assert.ok(![out.statement, out.door, ...out.strip].includes(tower));
});

test('backgroundImages is read the same way as frames', () => {
  const one = img('one');
  const two = img('two');
  const out = assignSpareImages([
    { _type: 'heroSection', backgroundImages: [one, two] },
    { _type: 'sundayTimesSection' },
  ]);
  assert.equal(out.door, two);
});

test('the hero frames come before the bands own pictures', () => {
  const tower = img('tower');
  const sanctuary = img('sanctuary');
  const band = img('band');
  const out = assignSpareImages([
    { _type: 'heroSection', frames: [tower, sanctuary] },
    { _type: 'imageTextSection', image: band },
    { _type: 'linkCardsSection', heading: 'Statement' },
  ]);
  assert.equal(out.statement, sanctuary);
  assert.deepEqual(out.strip, [band]);
});

test('an image+text band whose picture was handed out is given the next unused one', () => {
  // The home page, in miniature: the statement borrows the sanctuary, which is
  // also the image+text band's own picture, so that band draws the congregation
  // instead and the nave is shown once.
  const tower = img('tower');
  const sanctuary = img('sanctuary');
  const children = img('children');
  const congregation = img('congregation');
  const out = assignSpareImages([
    { _type: 'heroSection', frames: [tower, sanctuary, children, congregation] },
    { _type: 'sundayTimesSection' },
    { _type: 'imageTextSection', image: sanctuary },
    { _type: 'linkCardsSection', heading: 'Statement' },
  ]);
  assert.equal(out.statement, sanctuary);
  assert.equal(out.door, children);
  assert.equal(out.replacements.get(2), congregation);
  assert.deepEqual(out.strip, []);
});

test('the replacement is null when the pool has nothing left', () => {
  const sanctuary = img('sanctuary');
  const out = assignSpareImages([
    { _type: 'imageTextSection', image: sanctuary },
    { _type: 'linkCardsSection', heading: 'Statement' },
  ]);
  assert.equal(out.statement, sanctuary);
  assert.equal(out.replacements.get(0), null);
  assert.ok(out.replacements.has(0));
});

test('a replacement is never a second copy of a picture already handed out', () => {
  // Two bands carrying the SAME photograph. Handing the second one back to the
  // band that lent it would show the same picture twice, which is the defect
  // this whole mechanism exists to remove.
  const sanctuary = img('sanctuary');
  const out = assignSpareImages([
    { _type: 'imageTextSection', image: sanctuary },
    { _type: 'heritageBandSection', image: sanctuary },
    { _type: 'linkCardsSection', heading: 'Statement' },
  ]);
  assert.equal(out.statement, sanctuary);
  assert.equal(out.replacements.get(0), null);
  assert.deepEqual(out.strip, []);
});

test('a band that did not lend its picture keeps it', () => {
  const a = img('a');
  const b = img('b');
  const out = assignSpareImages([
    { _type: 'heroSection', frames: [img('tower'), a] },
    { _type: 'imageTextSection', image: b },
    { _type: 'linkCardsSection', heading: 'Statement' },
  ]);
  assert.equal(out.statement, a);
  assert.equal(out.replacements.has(1), false);
});

test('the asset ref is what identifies a picture, not the object', () => {
  // The projection builds a fresh object per block, so two references to the
  // same asset are never the same object.
  const one = { _type: 'image', asset: { _ref: 'image-nave-2000x1500-jpg' }, alt: 'a' };
  const two = { _type: 'image', asset: { _ref: 'image-nave-2000x1500-jpg' }, alt: 'b' };
  const spare = { _type: 'image', asset: { _ref: 'image-lawn-2000x1500-jpg' }, alt: 'c' };
  const out = assignSpareImages([
    { _type: 'heroSection', frames: [img('tower'), one, spare] },
    { _type: 'imageTextSection', image: two },
    { _type: 'linkCardsSection', heading: 'Statement' },
  ]);
  assert.equal(out.statement, one);
  assert.equal(out.replacements.get(1), spare);
});

test('the strip never repeats a picture a band above it already draws', () => {
  // The /visit shape (2026-09-23): the children band draws its own photograph
  // full-bleed, and the heritage band further down must not show it again.
  const girls = img('girls');
  const building = img('building');
  const kendall = img('kendall');
  const tower = img('tower');
  const out = assignSpareImages([
    { _type: 'heroSection', frames: [girls, building] },
    { _type: 'sundayTimesSection' },
    { _type: 'imageTextSection', image: kendall },
    { _type: 'heritageBandSection', image: tower },
  ]);
  assert.equal(out.door, building);
  assert.deepEqual(out.strip, [tower]);
});

test('the strip may preview a picture a band below it draws', () => {
  // The /history shape: the opening heritage band previews the era photographs
  // the page reaches later.
  const tower = img('tower');
  const era1 = img('era1');
  const era2 = img('era2');
  const out = assignSpareImages([
    { _type: 'heritageBandSection', image: tower },
    { _type: 'imageTextSection', image: era1 },
    { _type: 'imageTextSection', image: era2 },
  ]);
  assert.deepEqual(out.strip, [tower, era1, era2]);
});

test("the strip never shows the hero's first photograph, even from another band", () => {
  // The home shape: the heritage band carries the same tower the hero opens on.
  const tower = img('tower');
  const towerAgain = img('tower');
  const congregation = img('congregation');
  const door = img('door');
  const sunday = img('sunday');
  const out = assignSpareImages([
    { _type: 'heroSection', frames: [tower, door, congregation] },
    { _type: 'sundayTimesSection' },
    { _type: 'imageTextSection', image: sunday },
    { _type: 'heritageBandSection', image: towerAgain },
  ]);
  assert.equal(out.door, door);
  assert.deepEqual(out.strip, [congregation]);
});

// Arch-door link cards (2026-09-23, Who We Are Task 5). A link-card band whose
// every card carries its own photograph draws the cards as arched doors, so it
// has no big line to put a borrowed backdrop behind: it is not the statement.
test('cardsPictured is true only when every titled card has a photo', () => {
  const card = (title: string, image?: unknown) => ({ title, image });
  assert.equal(cardsPictured([card('A', img('a')), card('B', img('b'))]), true);
  assert.equal(cardsPictured([card('A', img('a')), card('B')]), false);
  assert.equal(cardsPictured([card('A', { _type: 'image' })]), false);
  // An untitled card never renders, so it neither needs nor spoils a photo.
  assert.equal(cardsPictured([card('A', img('a')), { image: undefined }]), true);
  assert.equal(cardsPictured([]), false);
  assert.equal(cardsPictured(undefined), false);
});

test('a link-card band with a photo on every card is not the statement consumer', () => {
  const photo = img('sanctuary');
  const out = assignSpareImages([
    { _type: 'imageTextSection', image: photo },
    {
      _type: 'linkCardsSection',
      heading: 'Where To Go Next',
      cards: [
        { title: 'Sunday', image: img('s') },
        { title: 'Staff', image: img('t') },
      ],
    },
  ]);
  assert.equal(out.statement, null);
  assert.equal(out.statementIndex, null);
  assert.deepEqual(out.strip, [photo]);
});

test('a Sunday band with its own photos borrows nothing, and a later one without can', () => {
  const a = img('sanctuary');
  const own = img('greeter');
  const alone = assignSpareImages([
    { _type: 'sundayTimesSection', photos: [own] },
    { _type: 'imageTextSection', image: a },
  ]);
  assert.equal(alone.door, null);
  assert.equal(alone.doorIndex, null);

  const second = assignSpareImages([
    { _type: 'sundayTimesSection', photos: [own] },
    { _type: 'imageTextSection', image: a },
    { _type: 'sundayTimesSection' },
  ]);
  assert.equal(second.doorIndex, 2);
  assert.equal(second.door, a);

  // An empty photos list (or photos with no asset) is no photos at all.
  const empty = assignSpareImages([
    { _type: 'sundayTimesSection', photos: [{ _type: 'image' }] },
    { _type: 'imageTextSection', image: a },
  ]);
  assert.equal(empty.doorIndex, 0);
});

test('a building band with dates keeps its picture to itself; one without dates lends it', () => {
  const drawing = img('rendering');
  const dated = assignSpareImages([
    { _type: 'sundayTimesSection' },
    {
      _type: 'heritageBandSection',
      image: drawing,
      dates: [{ year: '1859', text: 'The church is founded.' }],
    },
  ]);
  assert.equal(dated.door, null, 'the Sunday band must not borrow the dated band picture');
  assert.deepEqual(dated.strip, []);

  // Dates with no text are dropped (heritageDates), so the band counts as undated.
  const blankDates = assignSpareImages([
    { _type: 'sundayTimesSection' },
    { _type: 'heritageBandSection', image: drawing, dates: [{ year: '1859', text: '  ' }] },
  ]);
  assert.equal(blankDates.door, drawing);

  const undated = assignSpareImages([
    { _type: 'sundayTimesSection' },
    { _type: 'heritageBandSection', image: drawing },
  ]);
  assert.equal(undated.door, drawing);
});
