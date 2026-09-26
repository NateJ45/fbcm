import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  photoAspect,
  isArchival,
  findLegend,
  resolveLegend,
  assignPhotoShapes,
  besideForm,
  COMPACT_WORDS,
  type PhotoRow,
} from './photo-shape.ts';
import type { PtBlock } from './span-split.ts';

const img = (w: number, h: number, alt = '') => ({
  asset: { _id: `image-abc123-${w}x${h}-jpg` },
  alt,
});
const it = (w: number, h: number, extra: Partial<PhotoRow> = {}): PhotoRow => ({
  _type: 'imageTextSection',
  image: img(w, h, extra.image?.alt ?? ''),
  ...extra,
});
let n = 0;
const p = (t: string): PtBlock => ({
  _type: 'block',
  _key: `k${n++}`,
  style: 'normal',
  children: [{ _type: 'span', text: t }],
});
const li = (t: string): PtBlock => ({ ...p(t), listItem: 'bullet' });

test('photoAspect reads the asset id and ignores stega', () => {
  assert.deepEqual(photoAspect(img(1140, 1425)), { w: 1140, h: 1425, a: 1140 / 1425 });
  assert.equal(photoAspect({ asset: null }), null);
  assert.equal(photoAspect(undefined), null);
});

test('isArchival: a year before 1950 in the alt or eyebrow', () => {
  assert.equal(isArchival('The second church building, built in 1890', ''), true);
  assert.equal(isArchival('', '1887 to 1917'), true);
  assert.equal(isArchival('The congregation standing to sing', 'Your first Sunday'), false);
  assert.equal(isArchival('Built in 1929​‌‍﻿', ''), true);
});

test('findLegend: a "left to right" paragraph followed by 3 to 8 names', () => {
  const body = [
    p('Deacons serve three-year terms.'),
    p('Current Deacons (left to right in photo):'),
    li('Gayle Songer'),
    li('Richard Flaherty'),
    li('James Butler*'),
    li('Aaron Smith'),
    li('Janis Wright'),
    p('*Deacon chair: deaconchair@fbcmuncie.org'),
  ];
  assert.deepEqual(findLegend(body), { labelIndex: 1, listStart: 2, listEnd: 7, footIndex: 7 });
  assert.equal(findLegend([p('left to right'), li('One'), li('Two')]), null);
});

test('the seven test bands land where the prototype put them', () => {
  const rows: PhotoRow[] = [
    it(2400, 1309, {
      image: img(2400, 1309, 'The sanctuary from the balcony, light through the glass'),
    }), // landscape-short
    { _type: 'richTextSection' },
    it(1600, 908), // landscape-long
    { _type: 'richTextSection' },
    it(1638, 1622, { image: img(1638, 1622, 'The second church building, built in 1890') }), // archival
    it(1140, 1425), // portrait
    it(2806, 4209), // second portrait
    it(1600, 800, {
      body: [p('Current Deacons (left to right in photo):'), li('A'), li('B'), li('C')],
    }),
  ];
  const s = assignPhotoShapes(rows);
  assert.equal(s.get(0), 'ground');
  assert.equal(s.get(2), 'row'); // 1600 wide: too soft to be a ground
  assert.equal(s.get(4), 'plate');
  assert.equal(s.get(5), 'window');
  assert.equal(s.get(6), 'frame'); // never a second arch
  assert.equal(s.get(7), 'legend');
  assert.equal(s.has(1), false);
});

test('ground budget: no ground straight after a photo hero', () => {
  const rows: PhotoRow[] = [{ _type: 'heroSection' }, it(2400, 1600)];
  assert.equal(assignPhotoShapes(rows, { heroHasPhoto: true }).get(1), 'row');
  assert.equal(assignPhotoShapes(rows, { heroHasPhoto: false }).get(1), 'ground');
});

test('ground budget: a second ground only four rows later on a long page, never consecutive', () => {
  const g = () => it(2400, 1600);
  const t = (): PhotoRow => ({ _type: 'richTextSection' });
  const near = assignPhotoShapes([g(), g(), t(), t(), t(), t()]);
  assert.deepEqual([near.get(0), near.get(1)], ['ground', 'row']);
  const far = assignPhotoShapes([g(), t(), t(), t(), g(), t()]);
  assert.deepEqual([far.get(0), far.get(4)], ['ground', 'ground']);
  const third = assignPhotoShapes([g(), t(), t(), t(), g(), t(), t(), t(), g(), t()]);
  assert.equal(third.get(8), 'row');
});

test('a row with no picture gets no shape', () => {
  assert.equal(assignPhotoShapes([{ _type: 'imageTextSection', image: null }]).size, 0);
});

test('resolveLegend: a legend whose names are still in the rest keeps its legend', () => {
  const rest = [p('Pictured left to right:'), li('A'), li('B'), li('C')];
  const r = resolveLegend('legend', rest);
  assert.equal(r.shape, 'legend');
  assert.deepEqual(r.legend, { labelIndex: 0, listStart: 1, listEnd: 4, footIndex: null });
});

test('resolveLegend: a legend with nothing left to find falls back to row', () => {
  // The page pass saw the whole body; ImageText looks only at what is left
  // after the lede, so the label can be gone by then.
  const r = resolveLegend('legend', [li('A'), li('B'), li('C')]);
  assert.equal(r.shape, 'row');
  assert.equal(r.legend, null);
});

test('resolveLegend: any other shape passes through without a lookup', () => {
  const rest = [p('Pictured left to right:'), li('A'), li('B'), li('C')];
  assert.deepEqual(resolveLegend('ground', rest), { shape: 'ground', legend: null });
  assert.deepEqual(resolveLegend('row', rest), { shape: 'row', legend: null });
});

test('a wide sharp photo of PEOPLE is never a ground (people go in arches, 2026-09-24)', () => {
  const rows: PhotoRow[] = [
    it(2400, 1309, { image: img(2400, 1309, 'The congregation standing to sing') }),
    { _type: 'richTextSection' },
  ];
  assert.equal(assignPhotoShapes(rows).get(0), 'row');
});

// ── besideForm (2026-09-25) ─────────────────────────────────────────────────
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);
const words = (k: number) => Array.from({ length: k }, (_, i) => `w${i}`).join(' ');
const coordinator = {
  shape: 'window' as const,
  aspect: 3632 / 5448,
  arched: true,
  body: [p(words(32))],
};

test('besideForm: a portrait beside a few words is compact (Wedding coordinator)', () => {
  assert.equal(besideForm(coordinator), 'compact');
  assert.equal(besideForm({ ...coordinator, body: [p(words(COMPACT_WORDS))] }), 'compact');
  assert.equal(besideForm({ ...coordinator, shape: 'frame', arched: false }), 'compact');
});

test('besideForm: many words, a small heading, a room board or no words stay standard', () => {
  assert.equal(besideForm({ ...coordinator, body: [p(words(COMPACT_WORDS + 1))] }), 'standard');
  assert.equal(
    besideForm({ ...coordinator, body: [p(words(10)), { ...p('Business'), style: 'h3' }] }),
    'standard',
  );
  assert.equal(besideForm({ ...coordinator, board: true }), 'standard');
  assert.equal(besideForm({ ...coordinator, body: [] }), 'standard');
});

test('besideForm: a landscape, a ground or a legend is never compact', () => {
  assert.equal(besideForm({ ...coordinator, aspect: 1.5, shape: 'row' }), 'standard');
  assert.equal(besideForm({ ...coordinator, aspect: 0.9 }), 'standard');
  assert.equal(besideForm({ ...coordinator, shape: 'ground' }), 'standard');
  assert.equal(besideForm({ ...coordinator, shape: 'legend' }), 'standard');
  assert.equal(besideForm({ ...coordinator, aspect: null }), 'standard');
});

test('besideForm: two portraits of people are a pair (Contact co-pastors), whatever the words', () => {
  const pastors = {
    ...coordinator,
    detailAspect: 3354 / 5030,
    detailPeople: true,
    body: [p(words(120)), { ...p('Business'), style: 'h3' }],
  };
  assert.equal(besideForm(pastors), 'pair');
  // A landscape detail, a detail of a place, or a main photo not in an arch
  // keep the old small detail over the corner.
  assert.equal(besideForm({ ...pastors, detailAspect: 1.5 }), 'standard');
  assert.equal(besideForm({ ...pastors, detailPeople: false }), 'standard');
  assert.equal(besideForm({ ...pastors, arched: false }), 'standard');
});

test('besideForm counts words and reads heading styles on the stega-cleaned text', () => {
  const stegaWords = [
    p(
      words(40)
        .split(' ')
        .join(STEGA + ' ') + STEGA,
    ),
  ];
  assert.equal(besideForm({ ...coordinator, body: stegaWords }), 'compact');
  assert.equal(
    besideForm({ ...coordinator, body: [p(words(5)), { ...p('x'), style: 'h4' + STEGA }] }),
    'standard',
  );
});
