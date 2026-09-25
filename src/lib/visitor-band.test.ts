// src/lib/visitor-band.test.ts
// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VISITOR_INTRO,
  ageLine,
  bandEyebrow,
  churchYear,
  isDarkRow,
  issueLine,
  sinceYear,
  visitorGround,
  yearsInPrint,
} from './visitor-band.ts';

const RUN = '​​​​‌‍﻿​‌‍﻿​';
const NOW = new Date('2026-09-24T16:00:00Z');

test('the year is read from the /visitor line, after "since", stega aside', () => {
  assert.equal(sinceYear('Our church newsletter since 1946', NOW), 1946);
  assert.equal(sinceYear(`Our church newsletter since 1946${RUN}`, NOW), 1946);
  assert.equal(sinceYear('Published SINCE  1950.', NOW), 1950);
  // A year that does not follow "since" is not the start of the newsletter.
  assert.equal(sinceYear('The 2026 issues', NOW), null);
  assert.equal(sinceYear('Our church newsletter', NOW), null);
  assert.equal(sinceYear(null, NOW), null);
  assert.equal(sinceYear(undefined, NOW), null);
});

test('a year in the future or before 1800 is a typo, not a start', () => {
  assert.equal(sinceYear('since 2031', NOW), null);
  assert.equal(sinceYear('since 1046', NOW), null);
  assert.equal(sinceYear('since 2026', NOW), 2026);
});

test('the year is the church’s: New Year’s Eve in Muncie is still the old year', () => {
  // 03:00 UTC on 1 January is 22:00 on 31 December in Indianapolis.
  assert.equal(churchYear(new Date('2027-01-01T03:00:00Z')), 2026);
  assert.equal(churchYear(new Date('2027-01-01T06:00:00Z')), 2027);
});

test('the age is counted from the year to the build’s year, never typed', () => {
  assert.equal(yearsInPrint(1946, NOW), 80);
  assert.equal(yearsInPrint(1946, new Date('2027-06-01T12:00:00Z')), 81);
  assert.equal(yearsInPrint(null, NOW), null);
  assert.equal(yearsInPrint(2026, NOW), null);
  assert.equal(ageLine(1946, NOW), '80 years in print');
  assert.equal(ageLine(2025, NOW), '1 year in print');
  assert.equal(ageLine(null, NOW), '');
});

test('the eyebrow carries the year when there is one', () => {
  assert.equal(bandEyebrow(1946), 'Since 1946 · Quarterly');
  assert.equal(bandEyebrow(null), 'Quarterly');
  assert.equal(bandEyebrow(undefined), 'Quarterly');
});

test('the intro is the church’s own sentence, and no copy carries an em-dash', () => {
  assert.match(VISITOR_INTRO, /features, information about church life, and articles/);
  for (const s of [VISITOR_INTRO, bandEyebrow(1946), ageLine(1946, NOW), issueLine('June 2026')]) {
    assert.ok(!s.includes('—'), s);
  }
  assert.equal(issueLine('September 2026'), 'The September 2026 issue');
});

test('the ground is indigo under a light band and paper under a dark one', () => {
  assert.equal(visitorGround(false), 'indigo');
  assert.equal(visitorGround(true), 'paper');
});

test('which rows above count as dark', () => {
  for (const t of ['sundayTimesSection', 'goalsSection', 'watchwordSection', 'heroSection']) {
    assert.equal(isDarkRow(t), true, t);
  }
  // The heritage band above a slot is its dated building form, on paper.
  for (const t of ['heritageBandSection', 'dynamicListSection', 'giveBandSection', '', null]) {
    assert.equal(isDarkRow(t), false, String(t));
  }
});
