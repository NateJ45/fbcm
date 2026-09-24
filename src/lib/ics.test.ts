// The iCalendar writer (feat/scripture-text): folding, escaping, the zone and
// a whole calendar a phone will open.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIcs,
  escapeText,
  foldLine,
  localStamp,
  utcStamp,
  ICS_TZID,
  VTIMEZONE_INDIANAPOLIS,
} from './ics.ts';

test('escapeText escapes backslash, semicolon, comma and newlines', () => {
  assert.equal(escapeText('a\\b; c, d\ne\r\nf'), 'a\\\\b\\; c\\, d\\ne\\nf');
  assert.equal(escapeText('309 East Adams Street'), '309 East Adams Street');
});

test('foldLine folds at 75 octets with a leading space', () => {
  const line = 'DESCRIPTION:' + 'x'.repeat(200);
  const folded = foldLine(line);
  const parts = folded.split('\r\n');
  assert.ok(parts.length > 2);
  for (const p of parts) assert.ok(Buffer.byteLength(p) <= 75, `${Buffer.byteLength(p)}`);
  for (const p of parts.slice(1)) assert.equal(p[0], ' ');
  // unfolding gives the line back
  assert.equal(folded.replace(/\r\n /g, ''), line);
  assert.equal(foldLine('SHORT:1'), 'SHORT:1');
});

test('foldLine never splits a multi-byte character', () => {
  const line = 'SUMMARY:' + '’é'.repeat(40);
  const parts = foldLine(line).split('\r\n');
  for (const p of parts) {
    assert.ok(Buffer.byteLength(p) <= 75);
    assert.ok(!p.includes('�'));
  }
  assert.equal(foldLine(line).replace(/\r\n /g, ''), line);
});

test('localStamp is wall-clock time, and rolls over midnight', () => {
  assert.equal(localStamp({ date: '2025-11-16', minutes: 645 }), '20251116T104500');
  assert.equal(localStamp({ date: '2025-11-16', minutes: 645 }, 60), '20251116T114500');
  assert.equal(localStamp({ date: '2025-12-31', minutes: 23 * 60 + 30 }, 60), '20260101T003000');
});

test('utcStamp', () => {
  assert.equal(utcStamp(new Date('2025-11-11T15:04:05Z')), '20251111T150405Z');
});

test('a Sunday worship calendar: TZID, VTIMEZONE, CRLF and the event', () => {
  const ics = buildIcs({
    prodId: '-//First Baptist Church Muncie//Website//EN',
    stamp: new Date('2025-11-11T15:00:00Z'),
    events: [
      {
        uid: 'sunday-2025-11-16@fbcmuncie.org',
        start: { date: '2025-11-16', minutes: 645 },
        durationMinutes: 60,
        summary: 'Sunday worship at First Baptist Church Muncie',
        location: '309 East Adams Street, Muncie, IN 47305',
        description: 'Sermon: A Light Wardrobe. Reading: Romans 13:11-14.',
        url: 'https://www.fbcmuncie.org/post/a-light-wardrobe',
      },
    ],
  });
  assert.ok(ics.endsWith('\r\n'));
  assert.ok(!/[^\r]\n/.test(ics), 'every newline is CRLF');
  const lines = ics.split('\r\n');
  assert.equal(lines[0], 'BEGIN:VCALENDAR');
  assert.ok(lines.includes('VERSION:2.0'));
  assert.ok(lines.includes(`DTSTART;TZID=${ICS_TZID}:20251116T104500`));
  assert.ok(lines.includes(`DTEND;TZID=${ICS_TZID}:20251116T114500`));
  assert.ok(lines.includes('DTSTAMP:20251111T150000Z'));
  assert.ok(lines.includes('LOCATION:309 East Adams Street\\, Muncie\\, IN 47305'));
  for (const l of VTIMEZONE_INDIANAPOLIS) assert.ok(lines.includes(l), l);
  // the VTIMEZONE comes before the event that uses it
  assert.ok(lines.indexOf('BEGIN:VTIMEZONE') < lines.indexOf('BEGIN:VEVENT'));
  assert.equal(lines.filter((l) => l === 'BEGIN:VEVENT').length, 1);
});

test('a weekly event carries its RRULE (the Visit page reuse)', () => {
  const ics = buildIcs({
    prodId: '-//x//y//EN',
    stamp: new Date('2026-01-01T00:00:00Z'),
    events: [
      {
        uid: 'weekly@x',
        start: { date: '2026-01-04', minutes: 645 },
        durationMinutes: 60,
        summary: 'Sunday worship',
        rrule: 'FREQ=WEEKLY;BYDAY=SU',
      },
    ],
  });
  assert.ok(ics.includes('\r\nRRULE:FREQ=WEEKLY;BYDAY=SU\r\n'));
});
