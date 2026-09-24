import test from 'node:test';
import assert from 'node:assert/strict';
import { insertIndex } from './band-insert.ts';

// The home page as composed by scripts/pages/home.mjs.
const HOME = [
  'heroSection',
  'sundayTimesSection',
  'linkCardsSection',
  'heritageBandSection',
  'dynamicListSection',
  'giveBandSection',
];
const ANCHORS = ['dynamicListSection', 'giveBandSection'];

test('before the Church Blog rows on the home page as composed', () => {
  assert.equal(insertIndex(HOME, ANCHORS), 4);
});

test('before the give band when the blog band is gone', () => {
  assert.equal(
    insertIndex(
      HOME.filter((t) => t !== 'dynamicListSection'),
      ANCHORS,
    ),
    4,
  );
});

test('after the last row when neither anchor is on the page', () => {
  assert.equal(insertIndex(['heroSection', 'sundayTimesSection'], ANCHORS), 2);
  assert.equal(insertIndex([], ANCHORS), 0);
});

test('the first row of the anchor type, when it appears twice', () => {
  assert.equal(insertIndex(['a', 'dynamicListSection', 'dynamicListSection'], ANCHORS), 1);
});
