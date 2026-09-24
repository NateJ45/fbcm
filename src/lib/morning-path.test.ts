// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bodySegments,
  classEntry,
  noteParts,
  pathPlan,
  pathStairs,
  roomBoard,
  roomHeading,
} from './morning-path.ts';
import { splitStega } from './preview-stega.ts';

// A stega run as the preview client appends it (see hymn-board.test.ts).
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

const VISIT = [
  { _key: 'w', marker: '', title: 'Welcome and Check-In' },
  { _key: 's', marker: '9:30 am', title: 'Sunday School' },
  { _key: 'f', marker: '10:15 am', title: 'Fellowship' },
  { _key: 'x', marker: '10:45 am', title: 'Worship' },
  { _key: 'c', marker: 'First Sundays', title: 'Communion' },
];

test('a morning: every row up to the last time is a numbered step, the word row after it lands', () => {
  const plan = pathPlan(VISIT, 'Sundays at 10:45 am');
  assert.equal(plan.timed, true);
  assert.deepEqual(
    plan.steps.map((s) => [s.n, s.row.title, s.kind]),
    [
      [1, 'Welcome and Check-In', 'none'],
      [2, 'Sunday School', 'time'],
      [3, 'Fellowship', 'time'],
      [4, 'Worship', 'time'],
    ],
  );
  assert.deepEqual(
    plan.landings.map((r) => r.title),
    ['Communion'],
  );
});

test('the step at the service time is the main step, and only it', () => {
  const plan = pathPlan(VISIT, 'Sundays at 10:45 am');
  assert.deepEqual(
    plan.steps.filter((s) => s.main).map((s) => s.row.title),
    ['Worship'],
  );
  assert.equal(plan.steps[3].big, '10:45');
  assert.equal(plan.steps[3].meridiem, 'am');
  // No service time, no main step.
  assert.equal(pathPlan(VISIT, null).steps.filter((s) => s.main).length, 0);
  // A pm service does not make the am row main.
  assert.equal(pathPlan(VISIT, '10:45 pm').steps.filter((s) => s.main).length, 0);
});

test('a timeline of years has no landings: every row is a step', () => {
  const plan = pathPlan([
    { marker: '1859 to 1862', title: 'Founding' },
    { marker: '1862 to 1881', title: 'Struggle' },
    { marker: '1990 to today', title: 'Now' },
  ]);
  assert.equal(plan.timed, false);
  assert.equal(plan.landings.length, 0);
  assert.deepEqual(
    plan.steps.map((s) => s.kind),
    ['word', 'word', 'word'],
  );
});

test('a word row BETWEEN timed rows stays a step; empty rows are dropped', () => {
  const plan = pathPlan([
    { marker: '9:30', title: 'A' },
    { marker: 'Then', title: 'B' },
    { marker: '10:45', title: 'C' },
    { marker: '', title: '' },
    null,
  ]);
  assert.deepEqual(
    plan.steps.map((s) => s.row.title),
    ['A', 'B', 'C'],
  );
  assert.equal(plan.landings.length, 0);
});

test('the path reads the CLEANED marker and keeps the payload on the numeral', () => {
  const plan = pathPlan([{ marker: '10:45 am' + STEGA, title: 'Worship' }], '10:45 am');
  assert.equal(plan.steps[0].kind, 'time');
  assert.equal(plan.steps[0].main, true);
  assert.equal(splitStega(plan.steps[0].big).encoded, STEGA);
  const words = pathPlan([
    { marker: '9:30', title: 'A' },
    { marker: 'First Sundays' + STEGA, title: 'Communion' },
  ]);
  assert.equal(words.landings.length, 1);
});

test('stairs: only a short path with pictures climbs', () => {
  assert.equal(pathStairs(4, true), true);
  assert.equal(pathStairs(7, true), false);
  assert.equal(pathStairs(4, false), false);
  assert.equal(pathStairs(1, true), false);
});

test('classEntry reads a class line into name, room and description', () => {
  assert.deepEqual(
    classEntry('Friendship Class (B-05): Led by Pastor Jonathan, this class is open to all.'),
    {
      name: 'Friendship Class',
      room: 'B-05',
      desc: 'Led by Pastor Jonathan, this class is open to all.',
    },
  );
  assert.deepEqual(classEntry("Children's Sunday School (B-03 & 104): Play and practice (B-03)."), {
    name: "Children's Sunday School",
    room: 'B-03 & 104',
    desc: 'Play and practice (B-03).',
  });
  assert.equal(classEntry('6 weeks - 3 years: Nursery (104)'), null);
  assert.equal(classEntry('Just a sentence.'), null);
  const raw = classEntry('Youth (201): Sixth through twelfth.' + STEGA);
  assert.equal(raw?.name, 'Youth');
  assert.equal(splitStega(raw?.desc ?? '').encoded, STEGA);
});

test('noteParts splits a place from its room; a bare note is all room', () => {
  assert.deepEqual(noteParts('Donut [Semi-] Hour (Fellowship Hall)'), {
    place: 'Donut [Semi-] Hour',
    room: 'Fellowship Hall',
  });
  assert.deepEqual(noteParts('Sanctuary'), { place: '', room: 'Sanctuary' });
  assert.deepEqual(noteParts(''), { place: '', room: '' });
  assert.equal(splitStega(noteParts('Sanctuary' + STEGA).room).encoded, STEGA);
});

test('roomHeading reads "Nursery Care (104)" and refuses a heading with no room', () => {
  assert.deepEqual(roomHeading('Nursery Care (104)'), { title: 'Nursery Care', room: '104' });
  assert.deepEqual(roomHeading("Children's Church (B-03 & 102)"), {
    title: "Children's Church",
    room: 'B-03 & 102',
  });
  assert.equal(roomHeading('Nursery Care'), null);
  assert.equal(roomHeading(null), null);
});

const li = (text: string, key: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  listItem: 'bullet',
  children: [{ text }],
});
const p = (text: string, key: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  children: [{ text }],
});

test('bodySegments gathers class lines, folds a stray line into the class above, keeps prose', () => {
  const segs = bodySegments([
    p('Intro.', 'a'),
    li('Friendship Class (B-05): Led by Pastor Jonathan.', 'b'),
    li("Children's Sunday School (B-03 & 104): Worship Arts.", 'c'),
    li('6 weeks - 3 years: Nursery (104)', 'd'),
    p('After.', 'e'),
  ]);
  assert.deepEqual(
    segs.map((s) => s.kind),
    ['text', 'classes', 'text'],
  );
  const classes = segs[1];
  assert.equal(classes.kind, 'classes');
  if (classes.kind === 'classes') {
    assert.deepEqual(
      classes.items.map((i) => [i.name, i.room, i.extra]),
      [
        ['Friendship Class', 'B-05', []],
        ["Children's Sunday School", 'B-03 & 104', ['6 weeks - 3 years: Nursery (104)']],
      ],
    );
  }
});

test('bodySegments leaves a list that does not open on a class line as text', () => {
  const segs = bodySegments([li('One thing', 'a'), li('Another', 'b')]);
  assert.deepEqual(
    segs.map((s) => s.kind),
    ['text'],
  );
  assert.deepEqual(bodySegments(null), []);
});

const h3 = (text: string, key: string) => ({
  _type: 'block',
  _key: key,
  style: 'h3',
  children: [{ text }],
});

test('roomBoard reads headings that name rooms, each owning the blocks under it', () => {
  const board = roomBoard([
    h3('Nursery Care (104)', 'a'),
    p('For children ages 3 and younger.', 'b'),
    h3("Children's Church (B-03 & 102)", 'c'),
    p('There are two classes.', 'd'),
    li('Preschool - 2nd grade: Kickstart (102)', 'e'),
  ]);
  assert.ok(board);
  assert.deepEqual(
    board?.rooms.map((r) => [r.title, r.room, r.blocks.length]),
    [
      ['Nursery Care', '104', 1],
      ["Children's Church", 'B-03 & 102', 2],
    ],
  );
  assert.equal(board?.intro.length, 0);
});

test('roomBoard refuses a body whose headings do not all name a room, or has only one', () => {
  assert.equal(roomBoard([h3('Nursery Care (104)', 'a'), h3('Our history', 'b')]), null);
  assert.equal(roomBoard([h3('Nursery Care (104)', 'a'), p('x', 'b')]), null);
  assert.equal(roomBoard([p('x', 'b')]), null);
  assert.equal(roomBoard(null), null);
});
