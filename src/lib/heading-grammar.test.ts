import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingFit, longestWord } from './heading-grammar.ts';

const STEGA = '\u200b\u200b\u200b\u200b' + '\u200c\u200d\ufeff\u200b'.repeat(40);

test('longestWord counts the longest word, ignoring punctuation, splitting on hyphens', () => {
  assert.equal(longestWord('Church Coordination Team'), 12);
  assert.equal(longestWord('Come as you are.'), 4);
  assert.equal(longestWord('Well-known faces'), 5);
  assert.equal(longestWord('“Communion”'), 9);
  assert.equal(longestWord(''), 0);
  assert.equal(longestWord(null), 0);
});

test('longestWord reads the stega-cleaned text', () => {
  assert.equal(longestWord('Communion' + STEGA), 9);
});

test('headingFit sets the word length and the face em', () => {
  assert.equal(headingFit('Communion'), '--h-chars:9;--h-em:0.82');
  assert.equal(headingFit('A', 'body'), '--h-chars:1;--h-em:0.56');
  assert.equal(headingFit(''), '--h-chars:1;--h-em:0.82');
});
