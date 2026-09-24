// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heritageDates, heritageBookends } from './heritage-dates.ts';

// A stega run as the preview client appends it (U+FEFF matches \s).
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);
const BUILD = new Date('2026-09-23T12:00:00Z');

test('a now entry gets the build year', () => {
  const out = heritageDates([{ year: '', text: 'Worship every Sunday.', now: true }], BUILD);
  assert.deepEqual(out, [{ year: '2026', text: 'Worship every Sunday.', now: true }]);
});

test('the build year is read in UTC', () => {
  const newYearsEve = new Date('2026-12-31T23:30:00-05:00'); // 2027-01-01 04:30 UTC
  const out = heritageDates([{ text: 'Now.', now: true }], newYearsEve);
  assert.equal(out[0].year, '2027');
});

test('a typed year on a now entry is replaced', () => {
  const out = heritageDates([{ year: '2019', text: 'Still here.', now: true }], BUILD);
  assert.equal(out[0].year, '2026');
  assert.equal(out[0].now, true);
});

test('two now entries keep only the last as now', () => {
  const out = heritageDates(
    [
      { year: '1990', text: 'First now.', now: true },
      { year: '1929', text: 'Built.' },
      { year: '', text: 'Second now.', now: true },
    ],
    BUILD,
  );
  assert.deepEqual(out, [
    { year: '1990', text: 'First now.', now: false },
    { year: '1929', text: 'Built.', now: false },
    { year: '2026', text: 'Second now.', now: true },
  ]);
});

test('entries with no text are dropped, including stega-only and whitespace text', () => {
  const out = heritageDates(
    [
      { year: '1859', text: 'Founded.' },
      { year: '1862', text: '' },
      { year: '1870' },
      { year: '1880', text: `  ${STEGA} ` },
      null,
      { year: '1929', text: 'Built.' },
    ],
    BUILD,
  );
  assert.deepEqual(
    out.map((d) => d.year),
    ['1859', '1929'],
  );
});

test('a now entry with no text is dropped and does not steal the flag', () => {
  const out = heritageDates(
    [
      { year: '', text: 'Real now.', now: true },
      { year: '', text: '', now: true },
    ],
    BUILD,
  );
  assert.deepEqual(out, [{ year: '2026', text: 'Real now.', now: true }]);
});

test('order is kept', () => {
  const out = heritageDates(
    [
      { year: '1890', text: 'C.' },
      { year: '1859', text: 'A.' },
      { year: '1862', text: 'B.' },
    ],
    BUILD,
  );
  assert.deepEqual(
    out.map((d) => d.text),
    ['C.', 'A.', 'B.'],
  );
});

test('absent or empty input is an empty list', () => {
  assert.deepEqual(heritageDates(undefined, BUILD), []);
  assert.deepEqual(heritageDates(null, BUILD), []);
  assert.deepEqual(heritageDates([], BUILD), []);
});

test('raw strings are returned untouched so click-to-edit survives', () => {
  const out = heritageDates([{ year: `1859${STEGA}`, text: `Founded.${STEGA}` }], BUILD);
  assert.equal(out[0].year, `1859${STEGA}`);
  assert.equal(out[0].text, `Founded.${STEGA}`);
});

test('bookends are the first and last non-now years', () => {
  const dates = heritageDates(
    [
      { year: '1859', text: 'A.' },
      { year: '1890', text: 'B.' },
      { year: '1929', text: 'C.' },
      { year: '', text: 'Now.', now: true },
    ],
    BUILD,
  );
  assert.deepEqual(heritageBookends(dates), ['1859', '1929']);
});

test('bookends: one dated entry gives one year; none gives none; blank years skipped', () => {
  assert.deepEqual(heritageBookends([{ year: '1859', text: 'A.', now: false }]), ['1859']);
  assert.deepEqual(heritageBookends([{ year: '2026', text: 'Now.', now: true }]), []);
  assert.deepEqual(heritageBookends([]), []);
  assert.deepEqual(
    heritageBookends([
      { year: STEGA, text: 'A.', now: false },
      { year: '1862', text: 'B.', now: false },
      { year: '1890', text: 'C.', now: false },
      { year: ' ', text: 'D.', now: false },
    ]),
    ['1862', '1890'],
  );
});

test('bookends do not repeat one year', () => {
  assert.deepEqual(
    heritageBookends([
      { year: '1929', text: 'A.', now: false },
      { year: `1929${STEGA}`, text: 'B.', now: false },
    ]),
    ['1929'],
  );
});

test('bookends take the outer years of a range, not the whole range', () => {
  assert.deepEqual(
    heritageBookends([
      { year: '1859 to 1862', text: 'A.', now: false },
      { year: '1890', text: 'B.', now: false },
      { year: '1921 to 1929', text: 'C.', now: false },
    ]),
    ['1859', '1929'],
  );
  // One range alone gives both of its ends.
  assert.deepEqual(heritageBookends([{ year: '1921 to 1929', text: 'A.', now: false }]), [
    '1921',
    '1929',
  ]);
  // A year with no four-digit number is used as typed.
  assert.deepEqual(
    heritageBookends([
      { year: 'Early days', text: 'A.', now: false },
      { year: '1929', text: 'B.', now: false },
    ]),
    ['Early days', '1929'],
  );
});
