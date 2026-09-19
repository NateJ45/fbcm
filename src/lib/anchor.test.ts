import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectionAnchor } from './anchor.ts';

test('an explicit anchor wins over the generated id', () => {
  assert.equal(sectionAnchor({ anchor: { current: 'baptists' } }, 'page-3'), 'baptists');
});

test('a missing or empty anchor falls back to the generated id', () => {
  assert.equal(sectionAnchor({}, 'page-3'), 'page-3');
  assert.equal(sectionAnchor({ anchor: { current: '   ' } }, 'page-3'), 'page-3');
});

test('an anchor is cleaned of stega markers and unsafe characters', () => {
  const stega = 'bap​tists﻿';
  assert.equal(sectionAnchor({ anchor: { current: stega } }, 'x'), 'baptists');
  assert.equal(sectionAnchor({ anchor: { current: 'Our Pledge!' } }, 'x'), 'our-pledge');
});
