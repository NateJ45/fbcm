// src/lib/goal-layout.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalLayout } from './goal-layout.ts';

const g = (points: number, photos: number) => ({
  points: Array(points).fill({}),
  photos: Array(photos).fill({}),
});

test('position sets colour and layout', () => {
  assert.deepEqual(goalLayout(0, g(3, 2)), { layout: 'nave', colour: 'green' });
  assert.deepEqual(goalLayout(1, g(3, 2)), { layout: 'path', colour: 'gold' });
  assert.deepEqual(goalLayout(2, g(3, 6)), { layout: 'rings', colour: 'purple' });
  assert.deepEqual(goalLayout(3, g(3, 2)), { layout: 'doors', colour: 'brown' });
});

test('a layout the goal cannot fill falls back to nave, keeping its colour', () => {
  assert.deepEqual(goalLayout(1, g(1, 2)), { layout: 'nave', colour: 'gold' });
  assert.deepEqual(goalLayout(2, g(3, 2)), { layout: 'nave', colour: 'purple' });
  assert.deepEqual(goalLayout(3, g(0, 0)), { layout: 'nave', colour: 'brown' });
});

test('missing arrays are treated as empty', () => {
  assert.deepEqual(goalLayout(1, {}), { layout: 'nave', colour: 'gold' });
});
