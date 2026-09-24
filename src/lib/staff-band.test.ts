// src/lib/staff-band.test.ts
// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingIsLong, staffBandLook, staffSize } from './staff-band.ts';

test('each group draws on its own brand ground', () => {
  assert.deepEqual(staffBandLook('pastors'), { ground: 'gold', dark: false });
  assert.deepEqual(staffBandLook('coordination'), { ground: 'brown', dark: true });
  assert.deepEqual(staffBandLook('support'), { ground: 'taupe', dark: false });
});

test('"Everyone", a missing group and an unknown one sit on the paper', () => {
  assert.deepEqual(staffBandLook('all'), { ground: 'paper', dark: false });
  assert.deepEqual(staffBandLook(undefined), { ground: 'paper', dark: false });
  assert.deepEqual(staffBandLook(null), { ground: 'paper', dark: false });
  assert.deepEqual(staffBandLook('elders'), { ground: 'paper', dark: false });
});

test('three people or fewer are drawn large; more are a list', () => {
  assert.equal(staffSize(0), 'feature');
  assert.equal(staffSize(1), 'feature');
  assert.equal(staffSize(3), 'feature');
  assert.equal(staffSize(4), 'list');
  assert.equal(staffSize(11), 'list');
});

test('a heading steps down when one word is eleven capitals or more', () => {
  assert.equal(headingIsLong('Church Coordination Team'), true);
  assert.equal(headingIsLong('Pastors & Staff'), false);
  assert.equal(headingIsLong('Support and volunteer roles'), false);
  assert.equal(headingIsLong(''), false);
  assert.equal(headingIsLong(undefined), false);
});

test('the measure ignores a preview stega run', () => {
  // U+200B x4 is a stega run; it must not lengthen "Staff" into a long word.
  assert.equal(headingIsLong('Staff​​​​​​​​'), false);
});
