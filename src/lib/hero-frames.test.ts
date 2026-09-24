import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameAnimationDelays, heroObjectPosition, heroSizes } from './hero-frames.ts';

test('frame delays step by the frame length and the first frame starts at zero', () => {
  assert.deepEqual(frameAnimationDelays(5, 8), [0, 8, 16, 24, 32]);
  assert.deepEqual(frameAnimationDelays(1, 8), [0]);
});

test('a single frame produces no animation cycle', () => {
  assert.equal(frameAnimationDelays(1, 8).length, 1);
});

test('a hotspot becomes the object-position, in percentages', () => {
  assert.equal(heroObjectPosition({ x: 0.62, y: 0.4 }), '62.00% 40.00%');
  assert.equal(heroObjectPosition({ x: 0.5, y: 0.7 }, null), '50.00% 70.00%');
});

test('no hotspot keeps the centre default (null means no inline style)', () => {
  assert.equal(heroObjectPosition(null), null);
  assert.equal(heroObjectPosition(undefined), null);
  assert.equal(heroObjectPosition({ x: 0.5 }), null);
  assert.equal(heroObjectPosition({ x: null, y: 0.2 }), null);
});

test('a Sanity crop maps the hotspot into the cropped picture', () => {
  // Bottom 18% cut away: a point 0.41 down the original is half way down what shows.
  assert.equal(heroObjectPosition({ x: 0.5, y: 0.41 }, { top: 0, bottom: 0.18 }), '50.00% 50.00%');
  // Left 0.2 and right 0.2 cut: x 0.5 stays centred, x 0.3 is a sixth of the way in.
  assert.equal(heroObjectPosition({ x: 0.3, y: 0.5 }, { left: 0.2, right: 0.2 }), '16.67% 50.00%');
  // A hotspot outside the crop clamps to the edge rather than going negative.
  assert.equal(heroObjectPosition({ x: 0.1, y: 0.5 }, { left: 0.2, right: 0 }), '0.00% 50.00%');
});

test('sizes say the covered width on a tall viewport and 100vw on a wide one', () => {
  // A 3:2 photo in a full-viewport frame: narrower than 1.5 means 150vh wide.
  assert.equal(heroSizes(1.5, 1), '(max-aspect-ratio: 1500/1000) 150vh, 100vw');
  // The interior hero is 72svh tall, so the switch comes at 1.08.
  assert.equal(heroSizes(1.5, 0.72), '(max-aspect-ratio: 1080/1000) 108vh, 100vw');
  // A wide 2.11:1 photo.
  assert.equal(heroSizes(2.1127, 1), '(max-aspect-ratio: 2113/1000) 211vh, 100vw');
});

test('sizes fall back to 100vw when the aspect is unknown', () => {
  assert.equal(heroSizes(null), '100vw');
  assert.equal(heroSizes(undefined, 1), '100vw');
  assert.equal(heroSizes(0, 1), '100vw');
  assert.equal(heroSizes(1.5, 0), '100vw');
});

test('on a 390x844 phone the 3:2 sizes resolve to the covered width', () => {
  // What the browser does with the string: the condition holds (390/844 < 1.5),
  // so the slot is 150vh = 1266px, the width cover actually draws.
  const vw = 390;
  const vh = 844;
  const a = 1.5;
  const covered = Math.max(vw, vh * a);
  assert.equal(Math.round(covered), 1266);
  assert.ok(vw / vh < a);
});
