// src/lib/goal-layout.test.ts
// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalLayout, goalsEndDark } from './goal-layout.ts';

const g = (points: number, photos: number) => ({
  points: Array(points).fill({}),
  photos: Array(photos).fill({}),
});

test('position sets colour and layout', () => {
  assert.deepEqual(goalLayout(0, g(3, 2)), { layout: 'nave', colour: 'indigo' });
  assert.deepEqual(goalLayout(1, g(3, 2)), { layout: 'path', colour: 'gold' });
  assert.deepEqual(goalLayout(2, g(3, 6)), { layout: 'rings', colour: 'brown' });
  assert.deepEqual(goalLayout(3, g(3, 2)), { layout: 'doors', colour: 'taupe' });
});

test('a layout the goal cannot fill falls back to nave, keeping its colour', () => {
  assert.deepEqual(goalLayout(1, g(1, 2)), { layout: 'nave', colour: 'gold' });
  assert.deepEqual(goalLayout(2, g(3, 2)), { layout: 'nave', colour: 'brown' });
  assert.deepEqual(goalLayout(3, g(0, 0)), { layout: 'nave', colour: 'taupe' });
});

test('missing arrays are treated as empty', () => {
  assert.deepEqual(goalLayout(1, {}), { layout: 'nave', colour: 'gold' });
});

test('a goals block ends dark unless its last named goal lands on gold or taupe', () => {
  const named = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Goal ${i + 1}` }));
  assert.equal(goalsEndDark(named(5)), true); // indigo again
  assert.equal(goalsEndDark(named(4)), false); // taupe
  assert.equal(goalsEndDark(named(3)), true); // brown
  assert.equal(goalsEndDark(named(2)), false); // gold
  assert.equal(goalsEndDark(named(1)), true); // indigo
  // An unnamed goal never renders, so it does not count.
  assert.equal(goalsEndDark([...named(2), { name: '' }]), false);
  assert.equal(goalsEndDark([]), false);
  assert.equal(goalsEndDark(undefined), false);
});
