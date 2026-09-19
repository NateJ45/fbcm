import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameAnimationDelays } from './hero-frames.ts';

test('frame delays step by the frame length and the first frame starts at zero', () => {
  assert.deepEqual(frameAnimationDelays(5, 8), [0, 8, 16, 24, 32]);
  assert.deepEqual(frameAnimationDelays(1, 8), [0]);
});

test('a single frame produces no animation cycle', () => {
  assert.equal(frameAnimationDelays(1, 8).length, 1);
});
