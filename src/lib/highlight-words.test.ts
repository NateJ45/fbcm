// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { highlightWords } from './highlight-words.ts';

// A stega run as the preview client appends it: four or more of the modern
// encoding's zero-width digits (U+200B, U+200C, U+200D, U+FEFF). Built from
// code points so the test file carries no invisible characters of its own.
const STEGA = [0x200b, 0x200b, 0x200b, 0x200b, 0x200c, 0x200d, 0xfeff, 0x200c, 0xfeff]
  .map((c) => String.fromCodePoint(c))
  .join('');

const join = (parts: Array<{ text: string }>) => parts.map((p) => p.text).join('');
const hits = (parts: Array<{ text: string; hit: boolean }>) =>
  parts.filter((p) => p.hit).map((p) => p.text);

test('plain input: each listed word is a hit, everything else is not', () => {
  const raw = 'Give praise to the Lord, proclaim his name';
  const out = highlightWords(raw, ['praise', 'proclaim']);
  assert.equal(join(out), raw);
  assert.deepEqual(hits(out), ['praise', 'proclaim']);
  assert.deepEqual(out[0], { text: 'Give ', hit: false });
});

test('matches case-insensitively and keeps the text its own casing', () => {
  const raw = 'Praise the Lord and PROCLAIM that his name is exalted, proclaim it';
  const out = highlightWords(raw, ['praise', 'Proclaim']);
  assert.equal(join(out), raw);
  assert.deepEqual(hits(out), ['Praise', 'PROCLAIM', 'proclaim']);
});

test('whole words only: "praised" and "proclaimed" are not hits', () => {
  const raw = 'He was praised and proclaimed';
  const out = highlightWords(raw, ['praise', 'proclaim']);
  assert.deepEqual(hits(out), []);
  assert.deepEqual(out, [{ text: raw, hit: false }]);
});

test('no words, or empty input, returns the raw string as one plain part', () => {
  assert.deepEqual(highlightWords('Give praise', []), [{ text: 'Give praise', hit: false }]);
  assert.deepEqual(highlightWords('', ['praise']), []);
});

test('a hit at the very start and the very end leaves no empty parts', () => {
  const out = highlightWords('praise and proclaim', ['praise', 'proclaim']);
  assert.deepEqual(out, [
    { text: 'praise', hit: true },
    { text: ' and ', hit: false },
    { text: 'proclaim', hit: true },
  ]);
});

test('stega-carrying input: the joined output is the raw input exactly', () => {
  const raw = `Give praise to the Lord, proclaim his name; and proclaim that his name is exalted.${STEGA}`;
  const out = highlightWords(raw, ['praise', 'proclaim']);
  assert.equal(join(out), raw);
  assert.deepEqual(hits(out), ['praise', 'proclaim', 'proclaim']);
  // The payload rides on the last part, untouched.
  assert.ok(out[out.length - 1].text.endsWith(STEGA));
});

test('stega directly after a highlighted word stays outside the hit', () => {
  const raw = `Give praise${STEGA}`;
  const out = highlightWords(raw, ['praise']);
  assert.equal(join(out), raw);
  assert.deepEqual(out, [
    { text: 'Give ', hit: false },
    { text: 'praise', hit: true },
    { text: STEGA, hit: false },
  ]);
});

test('a stega run inside a word does not stop it matching, and is kept', () => {
  const raw = `Give pra${STEGA}ise to the Lord`;
  const out = highlightWords(raw, ['praise']);
  assert.equal(join(out), raw);
  assert.deepEqual(hits(out), [`pra${STEGA}ise`]);
});

test('a U+FEFF in the stega run never counts as a word boundary space', () => {
  // The run sits between "Give" and "praise" with no real space: the cleaned
  // text is "Givepraise", which holds no whole word "praise".
  const raw = `Give${STEGA}praise`;
  const out = highlightWords(raw, ['praise']);
  assert.equal(join(out), raw);
  assert.deepEqual(hits(out), []);
});
