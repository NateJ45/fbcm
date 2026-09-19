// src/lib/church-derive.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupStaff, weekOfLabel, sortDocsByYearDesc, STAFF_GROUPS } from './church-derive.ts';

test('staff group order is pastors, coordination, support, and unknown lands in support', () => {
  assert.deepEqual(STAFF_GROUPS, ['pastors', 'coordination', 'support']);
  const g = groupStaff([
    { name: 'B', group: 'coordination', order: 20 },
    { name: 'A', group: 'pastors', order: 10 },
    { name: 'C', group: null, order: 5 },
  ]);
  assert.deepEqual(
    g.pastors.map((m) => m.name),
    ['A'],
  );
  assert.deepEqual(
    g.coordination.map((m) => m.name),
    ['B'],
  );
  assert.deepEqual(
    g.support.map((m) => m.name),
    ['C'],
  );
});

test('within a group, order wins and name breaks ties', () => {
  const g = groupStaff([
    { name: 'Zed', group: 'coordination', order: 10 },
    { name: 'Amy', group: 'coordination', order: 10 },
    { name: 'Bob', group: 'coordination', order: 5 },
  ]);
  assert.deepEqual(
    g.coordination.map((m) => m.name),
    ['Bob', 'Amy', 'Zed'],
  );
});

test('week-of label reads as a sentence with the day and month', () => {
  assert.equal(weekOfLabel('2024-01-15T10:00:00.000Z'), 'Sermon preview, week of 15 January 2024');
});

test('an unparseable date yields the plain eyebrow rather than "Invalid Date"', () => {
  assert.equal(weekOfLabel('not a date'), 'Sermon preview');
});

test('documents sort newest year first, undated last, ties by title', () => {
  const out = sortDocsByYearDesc([
    { title: 'B', year: 2023 },
    { title: 'A', year: null },
    { title: 'C', year: 2025 },
    { title: 'D', year: 2023 },
  ]);
  assert.deepEqual(
    out.map((d) => d.title),
    ['C', 'B', 'D', 'A'],
  );
});
