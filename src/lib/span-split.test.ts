import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blockText,
  wordCount,
  splitBlockText,
  sharedPrefix,
  pipedSplit,
  runInSplit,
  type PtBlock,
} from './span-split.ts';

// A stega run is four or more of these zero-width characters appended to the end.
const STEGA = '​‌‍﻿​‌‍﻿';
const blk = (text: string, extra: Partial<PtBlock> = {}): PtBlock => ({
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', text, marks: [] }],
  ...extra,
});

test('blockText joins spans and strips stega', () => {
  const b: PtBlock = {
    _type: 'block',
    children: [
      { _type: 'span', text: 'To attend ' },
      { _type: 'span', text: 'the worship' + STEGA, marks: ['em'] },
    ],
  };
  assert.equal(blockText(b), 'To attend the worship');
});

test('wordCount ignores stega and collapses whitespace', () => {
  assert.equal(wordCount('One  two\tthree' + STEGA), 3);
  assert.equal(wordCount(''), 0);
});

test('splitBlockText keeps the stega payload on the tail', () => {
  const b = blk('To attend the worship' + STEGA);
  const out = splitBlockText(b, 2, 3);
  assert.ok(out);
  assert.equal(out.head, 'To');
  assert.equal(out.tail.children![0].text, 'attend the worship' + STEGA);
});

test('splitBlockText refuses when the split point is not inside the first span', () => {
  const b: PtBlock = {
    _type: 'block',
    children: [
      { _type: 'span', text: 'To' },
      { _type: 'span', text: ' attend', marks: ['strong'] },
    ],
  };
  assert.equal(splitBlockText(b, 3, 3), null);
});

test('splitBlockText keeps later spans on the tail untouched', () => {
  const b: PtBlock = {
    _type: 'block',
    children: [
      { _type: 'span', text: 'Charis | For college ' },
      { _type: 'span', text: 'students', marks: ['strong'] },
    ],
  };
  const out = splitBlockText(b, 6, 9)!;
  assert.equal(out.head, 'Charis');
  assert.deepEqual(
    out.tail.children!.map((s) => s.text),
    ['For college ', 'students'],
  );
});

test('sharedPrefix finds up to three shared opening words', () => {
  assert.equal(
    sharedPrefix(['To attend the worship', 'To contribute cheerfully', 'To aid and assist']),
    'To',
  );
  assert.equal(sharedPrefix(['God is Love.', 'God is Spirit.', 'God is Holy.']), 'God is');
  assert.equal(sharedPrefix(['Sunday school', 'Worship', 'Donut hour']), '');
});

test('sharedPrefix never takes a whole item', () => {
  assert.equal(sharedPrefix(['Nursery', 'Nursery wing']), '');
});

test('pipedSplit splits a name | description item on cleaned text', () => {
  const out = pipedSplit(blk('Snowbirds Life Group | Locations vary' + STEGA))!;
  assert.equal(out.name, 'Snowbirds Life Group');
  assert.equal(out.tail.children![0].text, 'Locations vary' + STEGA);
  assert.equal(pipedSplit(blk('No pipe here')), null);
});

test('runInSplit takes a capitalised label of one to four words before a dash', () => {
  const out = runInSplit(blk('Caring Mentorship - Each regular attendee is connected' + STEGA))!;
  assert.equal(out.label, 'Caring Mentorship');
  assert.equal(out.tail.children![0].text, 'Each regular attendee is connected' + STEGA);
  assert.equal(
    runInSplit(blk('Following God’s Word – Our times of worship'))!.label,
    'Following God’s Word',
  );
});

test('runInSplit rejects sentences and lowercase starts', () => {
  assert.equal(runInSplit(blk('Next week - we meet at six')), null); // "week" is not capitalised
  assert.equal(runInSplit(blk('We believe that the church - as a body - serves')), null); // label over 4 words
  assert.equal(runInSplit(blk('Mr. Smith - the treasurer')), null); // label contains "."
});
