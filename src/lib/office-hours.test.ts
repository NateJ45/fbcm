// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hoursLines, type HoursBlock } from './office-hours.ts';
import { splitStega } from './preview-stega.ts';

// A stega run as the preview client appends it: U+200B prefix, base-4 digits
// in U+200B/C/D and U+FEFF. U+FEFF matches \s.
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

const line = (text: string, key = 'k', marks: string[] = []): HoursBlock => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  children: [{ _type: 'span', text, marks }],
  markDefs: [],
});

test('a "days: times" line is a row, split at the colon', () => {
  const [row] = hoursLines([line('Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm', 'a')]);
  assert.deepEqual(row, {
    kind: 'row',
    key: 'a',
    days: 'Monday to Thursday',
    times: '9 am to 12 pm and 1 pm to 4 pm',
  });
});

test('a line with no divider is a note, kept as its own block', () => {
  const block = line('Hours may change on holidays.', 'n');
  assert.deepEqual(hoursLines([block]), [{ kind: 'note', key: 'n', block }]);
});

test('the colon in a clock time is not the divider', () => {
  const [row] = hoursLines([line('Friday: 9:30 am to 12 pm')]);
  assert.equal(row.kind, 'row');
  assert.equal(row.kind === 'row' && row.days, 'Friday');
  assert.equal(row.kind === 'row' && row.times, '9:30 am to 12 pm');
  // A time with no days in front of it is a note, not a row with empty days.
  assert.equal(hoursLines([line('9:30 am to 12 pm')])[0].kind, 'note');
  assert.equal(hoursLines([line('Sunday:')])[0].kind, 'note');
});

test('stega: the divider is found in the cleaned text and the payload rides on the days', () => {
  const [row] = hoursLines([line('Friday: 9 am to 12 pm' + STEGA)]);
  assert.equal(row.kind, 'row');
  if (row.kind !== 'row') return;
  assert.equal(splitStega(row.days).cleaned, 'Friday');
  assert.equal(splitStega(row.days).encoded.length > 0, true);
  assert.equal(row.times, '9 am to 12 pm');
});

test('a marked line (a link, bold) stays a note so the mark is not lost', () => {
  const block = line('Tuesdays: by appointment', 'm', ['strong']);
  assert.deepEqual(hoursLines([block]), [{ kind: 'note', key: 'm', block }]);
});

test('empty lines, non-blocks and nothing at all yield nothing', () => {
  assert.deepEqual(hoursLines(null), []);
  assert.deepEqual(hoursLines(undefined), []);
  assert.deepEqual(hoursLines([line('   '), line(STEGA)]), []);
  assert.deepEqual(hoursLines([{ _type: 'image', _key: 'x' }]), []);
});

test('the live office hours read as three rows and a note, in order', () => {
  const lines = hoursLines([
    line('Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm', '1'),
    line('Friday: 9 am to 12 pm', '2'),
    line('Sunday: 9 am to 12 pm', '3'),
    line('Hours may change on holidays.', '4'),
  ]);
  assert.deepEqual(
    lines.map((l) => l.kind),
    ['row', 'row', 'row', 'note'],
  );
});
