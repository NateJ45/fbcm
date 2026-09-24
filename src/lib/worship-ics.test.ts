// scaffold-file: journal
// A sermon preview's "Add to calendar" file (feat/scripture-text).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { worshipIcs, serviceMinutes, addressLine, worshipIcsPath } from './worship-ics.ts';
import { sundayOf } from './sermon-derive.ts';

const settings = {
  serviceTime: 'Sundays at 10:45 am',
  serviceLength: 'About an hour and a half',
  address: '309 East Adams Street\nMuncie, IN 47305',
  livestreamUrl: 'https://www.youtube.com/@fbcmuncie/live',
};
const base = {
  settings,
  sunday: sundayOf('2025-11-11T15:00:00Z')!,
  stamp: new Date('2025-11-11T15:00:00Z'),
  siteName: 'First Baptist Church Muncie',
  domain: 'fbcmuncie.org',
  postTitle: 'A Light Wardrobe',
  postUrl: 'https://www.fbcmuncie.org/post/a-light-wardrobe',
  reading: 'Romans 13:11-14',
};

test('serviceMinutes reads Site settings, stega-safe', () => {
  assert.equal(serviceMinutes('Sundays at 10:45 am'), 645);
  assert.equal(serviceMinutes('Sundays at 10:45 am​‌'), 645);
  assert.equal(serviceMinutes('6:30 P.M.'), 1110);
  assert.equal(serviceMinutes('Sunday mornings'), null);
  assert.equal(serviceMinutes(null), null);
});

test('addressLine is one line', () => {
  assert.equal(addressLine(settings.address), '309 East Adams Street, Muncie, IN 47305');
  assert.equal(addressLine(''), '');
});

test('the Sunday at the service time, in the church zone, for the service length', () => {
  const ics = worshipIcs(base)!;
  assert.match(ics, /\r\nDTSTART;TZID=America\/Indiana\/Indianapolis:20251116T104500\r\n/);
  assert.match(ics, /\r\nDTEND;TZID=America\/Indiana\/Indianapolis:20251116T121500\r\n/);
  assert.match(ics, /\r\nUID:sunday-worship-2025-11-16@fbcmuncie.org\r\n/);
  assert.match(ics, /\r\nSUMMARY:Sunday worship at First Baptist Church Muncie\r\n/);
  assert.match(ics, /\r\nLOCATION:309 East Adams Street\\, Muncie\\, IN 47305\r\n/);
  const unfolded = ics.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('A Light Wardrobe (Romans 13:11-14).'));
  assert.ok(unfolded.includes('Watch live: https://www.youtube.com/@fbcmuncie/live'));
  assert.ok(!unfolded.includes('—'), 'no em dash in visitor copy');
});

test('an unreadable length is an hour; no service time is no file', () => {
  const ics = worshipIcs({ ...base, settings: { ...settings, serviceLength: 'varies' } })!;
  assert.match(ics, /DTEND;TZID=America\/Indiana\/Indianapolis:20251116T114500/);
  assert.equal(worshipIcs({ ...base, settings: { serviceTime: '' } }), null);
  assert.equal(worshipIcs({ ...base, settings: null }), null);
});

test('the same bytes on every build', () => {
  assert.equal(worshipIcs(base), worshipIcs(base));
  assert.equal(worshipIcsPath('a-light-wardrobe'), '/post/a-light-wardrobe/sunday.ics');
});
