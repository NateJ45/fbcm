import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heroFactLinks } from './hero-fact-links.ts';

const MINISTRIES = [
  { _type: 'heroSection' },
  { _type: 'timelineSection' },
  { _type: 'imageTextSection', eyebrow: 'Worship arts', anchor: { current: 'worship' } },
  { _type: 'imageTextSection', eyebrow: 'Children', anchor: { current: 'children' } },
  { _type: 'imageTextSection', eyebrow: 'Youth', anchor: { current: 'youth' } },
  { _type: 'richTextSection', eyebrow: 'Adults', anchor: { current: 'adult' } },
  { _type: 'richTextSection', eyebrow: 'Outreach', anchor: { current: 'outreach' } },
];

test('a fact named like a band jumps to it, by anchor or by small line', () => {
  const facts = [{ label: 'Children' }, { label: 'Youth' }, { label: 'Adults' }];
  assert.deepEqual(heroFactLinks(facts, MINISTRIES), ['#children', '#youth', '#adult']);
});

test('a fact that names no band links nowhere (Visit)', () => {
  const facts = [{ label: 'Sundays' }, { label: 'Where' }, { label: 'How long' }];
  const visit = [
    { _type: 'heroSection' },
    { _type: 'sundayTimesSection', anchor: { current: 'accessibility' } },
    { _type: 'heritageBandSection', anchor: { current: 'building' } },
  ];
  assert.deepEqual(heroFactLinks(facts, visit), [null, null, null]);
});

test('a band with no editor anchor is never a target, even when its small line matches', () => {
  const bands = [{ _type: 'richTextSection', eyebrow: 'Children' }];
  assert.deepEqual(heroFactLinks([{ label: 'Children' }], bands), [null]);
});

test('an empty or missing label links nowhere', () => {
  assert.deepEqual(heroFactLinks([{ label: '' }, {}, { label: null }], MINISTRIES), [
    null,
    null,
    null,
  ]);
});

test('matching ignores case and spacing, and the first matching band wins', () => {
  const bands = [
    { eyebrow: 'Youth', anchor: { current: 'youth' } },
    { eyebrow: 'Youth', anchor: { current: 'youth-news' } },
  ];
  assert.deepEqual(heroFactLinks([{ label: '  YOUTH ' }], bands), ['#youth']);
});

test('stega markers on the label, the small line and the anchor do not break the match', () => {
  const run = '​‌‍﻿​‌‍﻿';
  const bands = [{ eyebrow: `Adults${run}`, anchor: { current: `adult${run}` } }];
  assert.deepEqual(heroFactLinks([{ label: `Adults${run}` }], bands), ['#adult']);
  assert.deepEqual(heroFactLinks([{ label: `Adult${run}` }], bands), ['#adult']);
});
