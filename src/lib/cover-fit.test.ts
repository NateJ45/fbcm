// scaffold-file: journal
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverFit, coverRatio, PLAIN_COVER_RATIO } from './cover-fit.ts';

const img = (w: number, h: number, crop?: Record<string, number>) => ({
  asset: { _ref: `image-abc123-${w}x${h}-png` },
  ...(crop ? { crop } : {}),
});

test('the series-slide shape (940x726) fills the box exactly', () => {
  assert.ok(Math.abs(coverRatio(img(940, 726))! - PLAIN_COVER_RATIO) < 0.01);
  assert.equal(coverFit(img(940, 726)), 'cover');
});

test('shapes close to the box fill it (a sliver cropped)', () => {
  assert.equal(coverFit(img(940, 788)), 'cover'); // 1.19
  assert.equal(coverFit(img(1900, 1400)), 'cover'); // 1.36
});

test('squares, 16:9, portraits and panoramas are shown whole', () => {
  assert.equal(coverFit(img(1080, 1080)), 'contain');
  assert.equal(coverFit(img(1920, 1080)), 'contain');
  assert.equal(coverFit(img(3922, 4902)), 'contain');
  assert.equal(coverFit(img(2720, 1195)), 'contain');
});

test("the editor's crop changes the shape that is served", () => {
  // A square cropped 22% off the bottom is 1080 x 842, about 1.28.
  assert.equal(coverFit(img(1080, 1080, { top: 0, bottom: 0.22, left: 0, right: 0 })), 'cover');
});

test('an image with no readable shape is shown whole', () => {
  assert.equal(coverRatio(null), null);
  assert.equal(coverFit(null), 'contain');
  assert.equal(coverFit({ asset: { _ref: 'not-a-ref' } }), 'contain');
});
