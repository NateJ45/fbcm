import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beliefGlyphFor, isBasicBeliefsBand, normaliseHeading } from './belief-glyphs.ts';

// A stega run as the preview appends it: four or more invisible characters.
const STEGA = '​​​​‌‍﻿‌';

test('the six subheadings each get their own glyph', () => {
  assert.equal(beliefGlyphFor('God'), 'trinity');
  assert.equal(beliefGlyphFor('Creation and Humanity'), 'creation');
  assert.equal(beliefGlyphFor('Jesus Christ'), 'cross');
  assert.equal(beliefGlyphFor('The Holy Spirit'), 'flame');
  assert.equal(beliefGlyphFor('Salvation'), 'sunrise');
  assert.equal(beliefGlyphFor('Baptism and the Lord’s Supper'), 'cup');
});

test('curly and straight apostrophes, case and spacing do not matter', () => {
  assert.equal(beliefGlyphFor("Baptism and the Lord's Supper"), 'cup');
  assert.equal(beliefGlyphFor('  baptism   AND the lord’s supper '), 'cup');
  assert.equal(beliefGlyphFor('GOD'), 'trinity');
});

test('stega runs are read through, not compared', () => {
  assert.equal(beliefGlyphFor(`Jesus Christ${STEGA}`), 'cross');
  assert.equal(normaliseHeading(`Our Basic Beliefs${STEGA}`), 'our basic beliefs');
  assert.ok(isBasicBeliefsBand(`Our Basic Beliefs${STEGA}`));
});

test('an unknown, empty or missing heading gets no glyph and does not throw', () => {
  assert.equal(beliefGlyphFor('The Church'), null);
  assert.equal(beliefGlyphFor(''), null);
  assert.equal(beliefGlyphFor(undefined), null);
  assert.equal(beliefGlyphFor(null), null);
  assert.equal(beliefGlyphFor('Godly'), null);
});

test('only the Basic Beliefs band is in scope', () => {
  assert.ok(isBasicBeliefsBand('Our Basic Beliefs'));
  assert.ok(isBasicBeliefsBand('our basic beliefs'));
  assert.ok(!isBasicBeliefsBand('Four Values Baptists Emphasize'));
  assert.ok(!isBasicBeliefsBand(undefined));
});
