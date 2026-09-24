import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySections } from './sectionCadence.ts';
import { richGrounds, isBrandGround } from './rich-ground.ts';

const b = (t: string, extra: Record<string, unknown> = {}) => ({ _type: t, ...extra });
const grounds = (blocks: Record<string, unknown>[]) =>
  richGrounds(classifySections(blocks as { _type: string }[]));

test('only text bands get a ground; everything else is null', () => {
  const g = grounds([b('heroSection'), b('richTextSection'), b('imageTextSection')]);
  assert.equal(g[0], null);
  assert.equal(g[2], null);
  assert.ok(g[1]);
});

test("the cadence's paper turn stays paper, its muted turn is a brand band", () => {
  const g = grounds([b('richTextSection'), b('richTextSection'), b('richTextSection')]);
  assert.deepEqual(g, ['paper', 'indigo', 'paper']);
});

test('a brand text band never matches the band above or below it', () => {
  // A text hero opens on the muted turn, so the first text band is brand;
  // the hero is indigo, so the band takes brown.
  const g = grounds([b('heroSection'), b('richTextSection'), b('richTextSection')]);
  assert.deepEqual(g, [null, 'brown', 'paper']);
  const h = grounds([
    b('richTextSection'),
    b('sundayTimesSection'),
    b('richTextSection'),
    b('scriptureBandSection'),
  ]);
  // brown above, indigo below: taupe is the only brand ground left.
  assert.equal(h[2], 'taupe');
});

test('two brand text bands on one page take two different colours', () => {
  const g = grounds([
    b('richTextSection'),
    b('richTextSection'),
    b('richTextSection'),
    b('richTextSection'),
  ]);
  assert.deepEqual(g, ['paper', 'indigo', 'paper', 'brown']);
});

test('a staff band is read by its group', () => {
  const g = grounds([
    b('richTextSection'),
    b('richTextSection'),
    b('staffGridSection', { group: 'coordination' }),
  ]);
  assert.equal(g[1], 'indigo');
  const h = grounds([
    b('richTextSection'),
    b('staffGridSection', { group: 'all' }),
    b('richTextSection'),
  ]);
  assert.equal(h[2], 'indigo');
});

test('the Beliefs order draws brown after the hero and indigo for the covenant', () => {
  const g = grounds([
    b('heroSection'),
    b('richTextSection'), // Our Basic Beliefs (muted)
    b('richTextSection'), // Four Values (paper)
    b('imageTextSection'),
    b('scriptureBandSection'),
    b('richTextSection'), // Confession (paper)
    b('documentListSection'),
    b('richTextSection'), // Membership (paper)
    b('richTextSection'), // Covenant (muted)
    b('richTextSection'), // Affiliation (paper)
    b('ctaBandSection'),
  ]);
  assert.deepEqual(
    g.filter((x) => x !== null),
    ['brown', 'paper', 'paper', 'paper', 'indigo', 'paper'],
  );
});

test('isBrandGround', () => {
  assert.equal(isBrandGround('paper'), false);
  assert.equal(isBrandGround(null), false);
  assert.equal(isBrandGround('taupe'), true);
});
