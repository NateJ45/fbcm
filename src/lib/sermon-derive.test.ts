// scaffold-file: journal
// The sermon-preview facts the post page and the archive derive from a post's
// own date and body (the journal pass, 2026-09-22). Each would otherwise be a
// field an editor retypes every week and gets wrong (CLAUDE.md rule 15).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localDay, sundayOf, readingOf, seriesOf, formatDay, isoDay } from './sermon-derive.ts';

test('localDay reads the date in Muncie, not in UTC', () => {
  // 02:00Z on May 28 is still the evening of May 27 in Indiana.
  assert.equal(isoDay(localDay('2024-05-28T02:00:00Z')), '2024-05-27');
  assert.equal(isoDay(localDay('2024-05-28T16:00:00Z')), '2024-05-28');
});

test('sundayOf is the first Sunday on or after the publish day', () => {
  // Tuesday May 28 2024 -> Sunday June 2 (the "There's no sin in single" preview)
  assert.equal(isoDay(sundayOf('2024-05-28T15:00:00Z')), '2024-06-02');
  // Tuesday Nov 11 2025 -> Sunday Nov 16 (its body says "a sermon preview for November 16")
  assert.equal(isoDay(sundayOf('2025-11-11T15:00:00Z')), '2025-11-16');
  // a post written on a Sunday is for that Sunday
  assert.equal(isoDay(sundayOf('2025-11-16T15:00:00Z')), '2025-11-16');
});

test('sundayOf returns null for a missing or broken date', () => {
  assert.equal(sundayOf(undefined), null);
  assert.equal(sundayOf('not a date'), null);
});

test('formatDay prints the calendar day it was given', () => {
  const d = sundayOf('2024-05-28T15:00:00Z')!;
  assert.equal(formatDay(d), 'June 2, 2024');
  assert.equal(formatDay(d, { month: 'short', day: 'numeric' }), 'Jun 2');
});

test('readingOf finds the scripture reference, in the forms the previews use', () => {
  assert.equal(readingOf('...kingdom of heaven. The one who can accept this should accept it." - From Matthew 19:1-14 (NIV)'), 'Matthew 19:1-14');
  assert.equal(readingOf('"So Peter was kept in prison..." -excerpt from Acts 12:1-19 Ever tried'), 'Acts 12:1-19');
  assert.equal(readingOf('This week we read 1 Thessalonians 5:12-28 together'), '1 Thessalonians 5:12-28');
  assert.equal(readingOf('from Ezra 6:19-7:10, and'), 'Ezra 6:19-7:10');
  assert.equal(readingOf('Mark 10:45 says'), 'Mark 10:45');
});

test('readingOf never guesses', () => {
  assert.equal(readingOf('The book of Ecclesiastes is perhaps the only true book of philosophy'), '');
  assert.equal(readingOf('We met at 10:45 on Sunday'), '');
  assert.equal(readingOf(''), '');
});

test('seriesOf reads the series name out of the opening sentence', () => {
  assert.equal(seriesOf('This is a sermon preview for the second week of our Kingdom Family Values series. Visit'), 'Kingdom Family Values');
  assert.equal(seriesOf('the first of four sermons in FBCM’s "Multiplied" sermon series.'), 'Multiplied');
  assert.equal(seriesOf('Jesus said to her'), '');
});

test('the helpers survive stega markers in preview strings', () => {
  const stega = 'From Matthew 19:1-14​‌‍﻿';
  assert.equal(readingOf(stega), 'Matthew 19:1-14');
});
