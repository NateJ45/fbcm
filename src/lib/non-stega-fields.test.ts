// Safe to edit by hand
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNonStegaField } from './non-stega-fields.ts';

test('glyph is a non-stega field (linkCard.glyph and goalsSection goal.glyph both name it)', () => {
  assert.equal(isNonStegaField('glyph'), true);
});

test('an ordinary prose field is not on the list', () => {
  assert.equal(isNonStegaField('title'), false);
  assert.equal(isNonStegaField('body'), false);
});
