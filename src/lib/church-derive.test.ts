// scaffold-file: church
// src/lib/church-derive.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs'; // scaffold: church
import { groupStaff, sortDocsByYearDesc, groupDocsByYear, STAFF_GROUPS } from './church-derive.ts';

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

test('documents sort newest year first, undated last, ties keep their order', () => {
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

// scaffold: church
// ---------------------------------------------------------------------------
// The staffGrid GROQ arm, read off disk
// ---------------------------------------------------------------------------
// GROQ is a string here, so nothing type-checks it and the build stays green
// when it is wrong. This is the reservedSlugs.test.ts move: read the source and
// assert the shape the arm has to keep. A block created programmatically (a
// seeded or imported page, which is what the /staff page will be) carries no
// `group` key, and every bare `^.group` comparison then fails at once, leaving
// a heading over an empty grid.
test('every ^.group reach in the staffGrid arm is coalesced to "all"', () => {
  const src = readFileSync(new URL('./queries.ts', import.meta.url), 'utf8');
  const arm = src.slice(
    src.indexOf('_type == "staffGridSection" =>'),
    src.indexOf('_type == "faqSection" =>'),
  );
  assert.ok(arm.length > 0, 'staffGridSection arm not found in queries.ts');

  // Three reaches, all wrapped.
  assert.equal((arm.match(/coalesce\(\^\.group, "all"\)/g) ?? []).length, 3);
  // And no bare one left behind.
  assert.equal(arm.replace(/coalesce\(\^\.group, "all"\)/g, '').includes('^.group'), false);
});
// scaffold:end

test('groupDocsByYear: mixed years group descending with undated last', () => {
  const sorted = sortDocsByYearDesc([
    { title: 'C', year: 2025 },
    { title: 'B', year: 2023 },
    { title: 'D', year: 2023 },
    { title: 'A', year: null },
  ]);
  const groups = groupDocsByYear(sorted);
  assert.deepEqual(
    groups.map((g) => [g.heading, g.docs.map((d) => d.title)]),
    [
      ['2025', ['C']],
      ['2023', ['B', 'D']],
      ['Undated', ['A']],
    ],
  );
});

test('groupDocsByYear: all one year (or all undated) comes back as one ungrouped group', () => {
  const oneYear = groupDocsByYear([
    { title: 'A', year: 2024 },
    { title: 'B', year: 2024 },
  ]);
  assert.deepEqual(oneYear, [
    {
      heading: null,
      docs: [
        { title: 'A', year: 2024 },
        { title: 'B', year: 2024 },
      ],
    },
  ]);

  const allUndated = groupDocsByYear([{ title: 'X', year: null }]);
  assert.deepEqual(allUndated, [{ heading: null, docs: [{ title: 'X', year: null }] }]);

  assert.deepEqual(groupDocsByYear([]), []);
});

test('two rows in one year keep the order they were given, not the alphabet', () => {
  // The Visitor has twelve 2020 issues. Sorted by title they would read April,
  // August, December, February; the seeder hands them over newest first and
  // that is the order a reader wants.
  const out = sortDocsByYearDesc([
    { title: 'December', year: 2020 },
    { title: 'April', year: 2020 },
    { title: 'January', year: 2020 },
  ]);
  assert.deepEqual(
    out.map((d) => d.title),
    ['December', 'April', 'January'],
  );
});
