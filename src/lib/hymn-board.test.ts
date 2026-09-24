// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardRows, clockOf, readBig, sameTime } from './hymn-board.ts';
import { splitStega } from './preview-stega.ts';

// A stega run as the preview client appends it: a U+200B prefix and base-4
// digits in U+200B/C/D and U+FEFF. U+FEFF matches \s.
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

test('clockOf reads the clock out of a time, a service line, or nothing', () => {
  assert.equal(clockOf('10:45 am'), '10:45');
  assert.equal(clockOf('10:45 AM'), '10:45');
  assert.equal(clockOf('Sundays at 10:45 am'), '10:45');
  assert.equal(clockOf('11 AM'), '11:00');
  assert.equal(clockOf('09:30'), '9:30');
  assert.equal(clockOf('309 East Adams'), null);
  assert.equal(clockOf(''), null);
  assert.equal(clockOf(undefined), null);
  assert.equal(clockOf('10:45 am' + STEGA), '10:45');
});

test('readBig sets a time as a numeral with a lower-case meridiem', () => {
  assert.deepEqual(readBig('10:45 am'), { kind: 'time', big: '10:45', meridiem: 'am' });
  assert.deepEqual(readBig('10:45 AM'), { kind: 'time', big: '10:45', meridiem: 'am' });
  assert.deepEqual(readBig('9:30'), { kind: 'time', big: '9:30', meridiem: '' });
  assert.deepEqual(readBig('11 p.m.'), { kind: 'time', big: '11', meridiem: 'pm' });
  assert.deepEqual(readBig('10.15'), { kind: 'time', big: '10:15', meridiem: '' });
});

test('readBig keeps words as words and an empty line as none', () => {
  assert.deepEqual(readBig('309 East Adams'), {
    kind: 'word',
    big: '309 East Adams',
    meridiem: '',
  });
  assert.equal(readBig('Available').kind, 'word');
  assert.equal(readBig('2024').kind, 'word');
  assert.deepEqual(readBig('   '), { kind: 'none', big: '', meridiem: '' });
  assert.deepEqual(readBig(null), { kind: 'none', big: '', meridiem: '' });
});

test('readBig classifies on the cleaned text and puts the payload back on the numeral', () => {
  const read = readBig('10:45 am' + STEGA);
  assert.equal(read.kind, 'time');
  assert.equal(read.meridiem, 'am');
  assert.equal(splitStega(read.big).cleaned, '10:45');
  assert.equal(splitStega(read.big).encoded, STEGA);
  const word = readBig('Online' + STEGA);
  assert.equal(word.kind, 'word');
  assert.equal(splitStega(word.big).encoded, STEGA);
});

const HOME = [
  { _key: 'a', label: 'Sunday School', big: '9:30', body: 'Classes for every age' },
  { _key: 'b', label: 'Donut [Semi-] Hour', big: '10:15', body: 'Fellowship Hall' },
  { _key: 'c', label: 'Worship', big: '10:45 am', body: 'Sanctuary' },
];

test('the row whose time is the service time is the main row, and only it', () => {
  const rows = boardRows(HOME, [], 'Sundays at 10:45 am');
  assert.deepEqual(
    rows.map((r) => r.main),
    [false, false, true],
  );
  assert.deepEqual(
    rows.map((r) => r.kind),
    ['time', 'time', 'time'],
  );
});

test('the main row follows the service time when the church moves it', () => {
  const rows = boardRows(HOME, [], '10:15 am');
  assert.deepEqual(
    rows.map((r) => r.main),
    [false, true, false],
  );
});

test('no service time, or no match, means no main row', () => {
  assert.ok(boardRows(HOME, [], undefined).every((r) => !r.main));
  assert.ok(boardRows(HOME, [], 'Sundays at 11 am').every((r) => !r.main));
});

test('two rows at the service time: only the first is main', () => {
  const rows = boardRows(
    [
      { label: 'Worship', big: '10:45 am' },
      { label: 'Children’s church', big: '10:45' },
    ],
    [],
    '10:45 am',
  );
  assert.deepEqual(
    rows.map((r) => r.main),
    [true, false],
  );
});

test('the service-time match reads through stega on both sides', () => {
  const rows = boardRows([{ label: 'Worship', big: '10:45 am' + STEGA }], [], '10:45 am' + STEGA);
  assert.equal(rows[0]?.main, true);
});

test('the Visit band: a time, two words, then the doors in order', () => {
  const rows = boardRows(
    [
      {
        _key: 't1',
        label: 'Worship',
        big: '10:45 am',
        body: 'Worship is at 10:45 AM each Sunday.',
      },
      { _key: 't2', label: 'Find us', big: '309 East Adams', body: 'Our parking lot.' },
      { _key: 't3', label: 'Assisted listening', big: 'Available', body: 'Ask a greeter.' },
    ],
    [
      { _key: 'd1', name: 'Adams Street circular drive', body: 'The accessible entrance.' },
      { _key: 'd2', name: '', body: '' },
      { _key: 'd3', name: 'Jefferson Street side doors' },
    ],
    'Sundays at 10:45 am',
  );
  assert.deepEqual(
    rows.map((r) => [r.key, r.kind, r.main]),
    [
      ['t1', 'time', true],
      ['t2', 'word', false],
      ['t3', 'word', false],
      ['d1', 'door', false],
      ['d3', 'door', false],
    ],
  );
  assert.equal(rows[4]?.body, '');
});

test('empty items are dropped and missing keys are filled', () => {
  const rows = boardRows([null, {}, { label: 'Only a label' }], []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.key, 'item-2');
  assert.equal(rows[0]?.kind, 'none');
});

test('the meridiem must agree when both sides carry one', () => {
  assert.equal(sameTime('10:45 pm', '10:45 am'), false);
  assert.equal(sameTime('10:45 am', 'Sundays at 10:45 AM'), true);
  assert.equal(sameTime('10:45', 'Sundays at 10:45 am'), true);
  assert.equal(sameTime('10:45 pm', '10:45'), true);
  assert.equal(sameTime('10:45 am', '10:15 am'), false);
  const rows = boardRows(
    [
      { label: 'Evening prayer', big: '10:45 pm' },
      { label: 'Worship', big: '10:45 am' },
    ],
    [],
    'Sundays at 10:45 am',
  );
  assert.deepEqual(
    rows.map((r) => r.main),
    [false, true],
  );
});
