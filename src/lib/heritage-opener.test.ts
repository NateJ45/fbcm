// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openerSpan } from './heritage-opener.ts';

// A stega run as the preview client appends it (U+FEFF matches \s).
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);
const BUILD = new Date('2026-09-24T12:00:00Z');

test('a range marker gives its first year and the build year', () => {
  assert.deepEqual(openerSpan('1859 to 1862', BUILD), ['1859', '2026']);
});

test('a single-year marker gives that year and the build year', () => {
  assert.deepEqual(openerSpan('1859', BUILD), ['1859', '2026']);
});

test('the build year is read in UTC', () => {
  const newYearsEve = new Date('2026-12-31T23:30:00-05:00'); // 2027-01-01 04:30 UTC
  assert.deepEqual(openerSpan('1859', newYearsEve), ['1859', '2027']);
});

test('a marker in the build year gives one year, not the same year twice', () => {
  assert.deepEqual(openerSpan('2026', BUILD), ['2026']);
});

test('a marker with no four-digit year gives no span', () => {
  assert.deepEqual(openerSpan('Today', BUILD), []);
  assert.deepEqual(openerSpan('', BUILD), []);
});

test('no marker at all gives no span', () => {
  assert.deepEqual(openerSpan(undefined, BUILD), []);
  assert.deepEqual(openerSpan(null, BUILD), []);
  assert.deepEqual(openerSpan(1859, BUILD), []);
});

test('the year is found in the cleaned marker, not the stega payload', () => {
  assert.deepEqual(openerSpan(`1859 to 1862${STEGA}`, BUILD), ['1859', '2026']);
  assert.deepEqual(openerSpan(`Today${STEGA}`, BUILD), []);
});
