// The Sunday service as an iCalendar file (src/lib/sunday-ics.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { icsEscape, icsFold, sundayServiceIcs, type SundayIcsInput } from './sunday-ics.ts';

const BASE: SundayIcsInput = {
  serviceTime: 'Sundays at 10:45 am',
  serviceLength: 'About an hour',
  address: '309 East Adams Street\nMuncie, IN 47305',
  name: 'First Baptist Church Muncie',
  url: 'https://www.fbcmuncie.org/visit',
  domain: 'fbcmuncie.org',
  geo: { latitude: 40.19167, longitude: -85.38405 },
  now: new Date('2026-09-24T16:00:00Z'), // Thursday
};

const unfold = (ics: string) => ics.replace(/\r\n /g, '');

test('one weekly event on Sundays at the service time, in the church’s zone', () => {
  const ics = sundayServiceIcs(BASE);
  assert.ok(ics);
  const text = unfold(ics);
  assert.match(text, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(text, /\r\nRRULE:FREQ=WEEKLY;BYDAY=SU\r\n/);
  assert.match(text, /\r\nDTSTART;TZID=America\/Indiana\/Indianapolis:20260927T104500\r\n/);
  assert.match(text, /\r\nDTEND;TZID=America\/Indiana\/Indianapolis:20260927T114500\r\n/);
  assert.match(text, /\r\nTZID:America\/Indiana\/Indianapolis\r\n/);
  assert.match(text, /\r\nUID:sunday-worship@fbcmuncie\.org\r\n/);
  assert.match(text, /\r\nDTSTAMP:20260924T160000Z\r\n/);
  assert.match(
    text,
    /\r\nLOCATION:First Baptist Church Muncie\\, 309 East Adams Street\\, Muncie\\, IN 47305\r\n/,
  );
  assert.match(text, /\r\nGEO:40\.19167;-85\.38405\r\n/);
  assert.match(text, /\r\nSUMMARY:Sunday worship\\, First Baptist Church Muncie\r\n/);
  assert.equal((text.match(/BEGIN:VEVENT/g) ?? []).length, 1);
  assert.ok(text.endsWith('END:VCALENDAR\r\n'));
  // Every line ends CRLF; no bare LF anywhere.
  assert.ok(!/[^\r]\n/.test(ics));
});

test('on a Sunday the series starts that Sunday; the time follows Site settings', () => {
  const text = unfold(
    sundayServiceIcs({
      ...BASE,
      serviceTime: 'Sundays at 9:30 a.m.',
      serviceLength: 'About an hour and a half',
      now: new Date('2026-09-27T20:00:00Z'), // Sunday afternoon
    }) ?? '',
  );
  assert.match(text, /DTSTART;TZID=America\/Indiana\/Indianapolis:20260927T093000/);
  assert.match(text, /DTEND;TZID=America\/Indiana\/Indianapolis:20260927T110000/);
});

test('a length with no number in it falls back to an hour', () => {
  const text = unfold(sundayServiceIcs({ ...BASE, serviceLength: 'Not long' }) ?? '');
  assert.match(text, /DTEND;TZID=America\/Indiana\/Indianapolis:20260927T114500/);
});

test('no readable service time: no file at all', () => {
  assert.equal(sundayServiceIcs({ ...BASE, serviceTime: 'Sunday mornings' }), null);
  assert.equal(sundayServiceIcs({ ...BASE, serviceTime: null }), null);
});

test('no address: the location is the church’s name', () => {
  const text = unfold(sundayServiceIcs({ ...BASE, address: null }) ?? '');
  assert.match(text, /\r\nLOCATION:First Baptist Church Muncie\r\n/);
});

test('stega payloads in the settings never reach the file', () => {
  const z = '​‌‍﻿';
  const ics =
    sundayServiceIcs({
      ...BASE,
      serviceTime: `Sundays at 10:45 am${z}`,
      address: `309 East Adams Street${z}\nMuncie, IN 47305`,
    }) ?? '';
  assert.match(unfold(ics), /T104500/);
  assert.ok(!/[​-‍﻿]/.test(ics));
});

test('escaping and folding follow RFC 5545', () => {
  assert.equal(icsEscape('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const long = `DESCRIPTION:${'x'.repeat(200)}`;
  const folded = icsFold(long);
  for (const line of folded.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
  assert.equal(folded.replace(/\r\n /g, ''), long);
  // A multi-byte character is never split across a fold.
  const curly = icsFold(`SUMMARY:${'’'.repeat(40)}`);
  assert.equal(curly.replace(/\r\n /g, ''), `SUMMARY:${'’'.repeat(40)}`);
  for (const line of curly.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
});
