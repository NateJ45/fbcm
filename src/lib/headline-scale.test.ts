import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headlineScale, headlineClass, measureHeadline } from './headline-scale.ts';

const short = { tall: false };
const tall = { tall: true };

// A stega run as the preview client appends it: a U+200B prefix and base-4
// digits in U+200B/C/D and U+FEFF. U+FEFF matches \s, so a raw split would
// shatter it into fake words.
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

test('the live interior headlines land on the scale they were tuned for', () => {
  const cases: [string, string][] = [
    ['Since 1859.', 'poster'],
    ['Married here.', 'poster'],
    ['Get in touch.', 'poster'],
    ['Every age has a place here.', 'title'],
    ['The people who serve here.', 'title'],
    ['Writing from First Baptist.', 'title'],
    ['Support the work of this church.', 'title'],
    ['One Lord, one faith, one baptism.', 'title'],
    ['Your first Sunday, start to finish.', 'title'],
    ["We're a Spirit-led people gathered to join Christ's presence in our community.", 'sentence'],
  ];
  for (const [text, want] of cases) assert.equal(headlineScale(text, short), want, text);
});

test('the tall hero keeps a slightly longer line as a poster', () => {
  assert.equal(headlineScale('Praise and proclaim.', tall), 'poster');
  assert.equal(headlineScale('Praise and proclaim.', short), 'title');
  assert.equal(headlineScale('Your first Sunday, start to finish.', tall), 'title');
});

test('the longest word demotes a headline that would otherwise fit', () => {
  // 12 characters, 2 words: short enough for a poster, but "Congregation" is
  // 12 capitals and only 10 fit at the h1 floor on a 320px phone.
  assert.equal(headlineScale('Congregation now', short), 'title');
  // 13 capitals do not fit the title floor either.
  assert.equal(headlineScale('Our congregational life.', short), 'sentence');
  // On the tall hero the title is set at h1 size, so 12 capitals drop it.
  assert.equal(headlineScale('Our discipleship journey.', tall), 'sentence');
});

test('word and character limits each push to the next scale', () => {
  assert.equal(headlineScale('One two three four', short), 'title'); // 4 words
  assert.equal(headlineScale('a b c d e f g h i', short), 'sentence'); // 9 words
  assert.equal(
    headlineScale('x'.repeat(8) + ' ' + 'y'.repeat(8) + ' abcdefghij klmnopqrst uvwxyzabcd', short),
    'sentence',
  ); // 49 chars
});

test('classification reads cleaned text: a stega payload changes nothing', () => {
  for (const text of [
    'Since 1859.',
    'Support the work of this church.',
    "We're a Spirit-led people gathered to join Christ's presence in our community.",
  ]) {
    assert.equal(headlineScale(text + STEGA, short), headlineScale(text, short), text);
    assert.equal(headlineScale(text + STEGA, tall), headlineScale(text, tall), text);
  }
  assert.deepEqual(measureHeadline('Married here.' + STEGA), { chars: 13, words: 2, longest: 7 });
});

test('whitespace is collapsed before measuring', () => {
  assert.deepEqual(measureHeadline('  Get   in\ntouch.  '), { chars: 13, words: 3, longest: 6 });
});

test('an empty or missing headline is a poster (nothing to demote)', () => {
  assert.equal(headlineScale('', short), 'poster');
  assert.equal(headlineScale(undefined, short), 'poster');
  assert.deepEqual(measureHeadline(null), { chars: 0, words: 0, longest: 0 });
});

test('poster classes are the art-direction pass classes, unchanged', () => {
  assert.equal(
    headlineClass('poster', tall),
    'font-display uppercase tracking-[0.01em] font-normal text-display max-w-[12ch]',
  );
  assert.equal(
    headlineClass('poster', short),
    'font-display uppercase tracking-[0.01em] font-normal text-h1 leading-none max-w-[12ch]',
  );
});

test('a title steps one size down and widens; a sentence leaves capitals', () => {
  assert.match(headlineClass('title', short), /\btext-title\b/);
  assert.match(headlineClass('title', tall), /\btext-h1\b/);
  for (const o of [short, tall]) {
    assert.match(headlineClass('title', o), /\buppercase\b/);
    assert.match(headlineClass('title', o), /max-w-\[18ch\]/);
    const s = headlineClass('sentence', o);
    assert.match(s, /\bfont-body\b/);
    assert.match(s, /\bnormal-case\b/);
    assert.doesNotMatch(s, /\buppercase\b/);
    // Never a mid-word break utility on a hero headline.
    assert.doesNotMatch(
      headlineClass('poster', o) + headlineClass('title', o) + s,
      /break-words|anywhere/,
    );
  }
});
