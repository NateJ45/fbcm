import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverScale, scaleSizes } from './cover-sizes.ts';

test('a landscape photo in a tall side light is drawn several times wider than the light', () => {
  // The window hero's side light: 2.6 tall per 1 wide, a 2400x1351 photo.
  const s = coverScale({ frameRatio: 2.6, aspect: 2400 / 1351 });
  assert.ok(Math.abs(s - 4.62) < 0.01, `got ${s}`);
});

test('a photo already narrower than its frame needs no more pixels', () => {
  assert.equal(coverScale({ frameRatio: 1.4, aspect: 0.5 }), 1);
  assert.ok(Math.abs(coverScale({ frameRatio: 1.4, aspect: 0.8 }) - 1.12) < 1e-9);
});

test('headroom shrinks the drawn photo, so it needs fewer pixels', () => {
  assert.equal(coverScale({ frameRatio: 2, aspect: 1, heightShare: 0.75 }), 1.5);
});

test('an unknown aspect leaves the frame alone', () => {
  assert.equal(coverScale({ frameRatio: 2.6, aspect: null }), 1);
  assert.equal(coverScale({ frameRatio: 0, aspect: 1.5 }), 1);
});

test('scaleSizes multiplies each length and keeps the media conditions', () => {
  assert.equal(
    scaleSizes('(min-width: 1440px) 180px, (min-width: 901px) 13vw, 22vw', 4),
    '(min-width: 1440px) 720px, (min-width: 901px) 52vw, 88vw',
  );
});

test('scaleSizes wraps a length it cannot multiply in calc()', () => {
  assert.equal(
    scaleSizes('(min-width: 900px) min(40vw, 500px), 90vw', 2),
    '(min-width: 900px) calc(min(40vw, 500px) * 2), 180vw',
  );
});

test('scaleSizes with no scale returns the value unchanged', () => {
  assert.equal(scaleSizes('50vw', 1), '50vw');
});
