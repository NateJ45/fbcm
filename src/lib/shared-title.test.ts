// Safe to edit by hand
// scaffold-file: journal
// When a blog row's title may carry over into the post's h1 (shared-title.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalisePath,
  samePage,
  shouldPairTitle,
  visibleFraction,
  SHARED_TITLE_NAME,
  type PairInput,
} from './shared-title.ts';

const base: PairInput = {
  navigationType: 'push',
  sourceHref: '/post/a-light-wardrobe',
  to: 'http://localhost:4321/post/a-light-wardrobe/',
  rowTitle: { top: 300, bottom: 380 },
  viewportHeight: 900,
  destinationHasTitle: true,
  reducedMotion: false,
};

test('the name is a valid custom ident and never "none"', () => {
  assert.match(SHARED_TITLE_NAME, /^[a-z][a-z-]*$/);
  assert.notEqual(SHARED_TITLE_NAME, 'none');
});

test('normalisePath drops a trailing slash and decodes, but keeps the root', () => {
  assert.equal(normalisePath('/post/x/'), '/post/x');
  assert.equal(normalisePath('/post/x'), '/post/x');
  assert.equal(normalisePath('/'), '/');
  assert.equal(normalisePath('/post/h%C3%A4ndel-s-messiah/'), '/post/händel-s-messiah');
  assert.equal(normalisePath('/post/%E0%A4%A'), '/post/%E0%A4%A');
});

test('samePage matches a relative href to an absolute destination', () => {
  assert.ok(samePage('/post/x', 'http://localhost:4321/post/x/', 'http://localhost:4321/'));
  assert.ok(samePage('/post/händel', 'http://h/post/h%C3%A4ndel/', 'http://h/'));
  assert.ok(!samePage('/post/x', 'http://localhost:4321/post/y/', 'http://localhost:4321/'));
  assert.ok(!samePage('https://other.example/post/x', 'http://h/post/x', 'http://h/'));
});

test('visibleFraction is the share of the box inside the viewport', () => {
  assert.equal(visibleFraction(100, 200, 900), 1);
  assert.equal(visibleFraction(-50, 50, 900), 0.5);
  assert.equal(visibleFraction(850, 950, 900), 0.5);
  assert.equal(visibleFraction(1000, 1100, 900), 0);
  assert.equal(visibleFraction(100, 100, 900), 0);
});

test('a forward click on an on-screen row title pairs', () => {
  assert.equal(shouldPairTitle(base), true);
  assert.equal(shouldPairTitle({ ...base, navigationType: 'replace' }), true);
});

test('back and forward in history never pair', () => {
  assert.equal(shouldPairTitle({ ...base, navigationType: 'traverse' }), false);
});

test('reduced motion never pairs', () => {
  assert.equal(shouldPairTitle({ ...base, reducedMotion: true }), false);
});

test('no row, no source, or no title on the new page: no pair', () => {
  assert.equal(shouldPairTitle({ ...base, rowTitle: null }), false);
  assert.equal(shouldPairTitle({ ...base, sourceHref: null }), false);
  assert.equal(shouldPairTitle({ ...base, destinationHasTitle: false }), false);
});

test('a link that is not where the navigation goes does not pair', () => {
  assert.equal(shouldPairTitle({ ...base, to: 'http://localhost:4321/post/other/' }), false);
});

test('a title mostly off screen does not pair', () => {
  assert.equal(shouldPairTitle({ ...base, rowTitle: { top: -70, bottom: 10 } }), false);
  assert.equal(shouldPairTitle({ ...base, rowTitle: { top: 860, bottom: 940 } }), true);
  assert.equal(shouldPairTitle({ ...base, rowTitle: { top: 880, bottom: 960 } }), false);
});
