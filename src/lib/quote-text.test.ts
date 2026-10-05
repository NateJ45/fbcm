import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LONG_QUOTE_WORDS, parseQuote } from './quote-text.ts';
import { splitStega } from './preview-stega.ts';

// A stega-shaped run: the modern prefix plus base-4 digits, built from the real
// invisible alphabet (U+200B, U+200C, U+200D, U+FEFF) via escapes so the
// fixture survives copy-paste.
const RUN = '​​​​‌‍﻿​‌‍﻿​';

test('single paragraph is not structured', () => {
  const p = parseQuote('In essentials, unity; in non-essentials, liberty.');
  assert.deepEqual(p.blocks, [
    { kind: 'paragraph', text: 'In essentials, unity; in non-essentials, liberty.' },
  ]);
  assert.equal(p.structured, false);
  assert.equal(p.wordCount, 6);
});

test('blank lines split paragraphs', () => {
  const p = parseQuote('One two.\n\nThree four.\n\n\n\nFive.');
  assert.deepEqual(
    p.blocks.map((b) => b.kind === 'paragraph' && b.text),
    ['One two.', 'Three four.', 'Five.'],
  );
  assert.equal(p.structured, true);
});

test('bullets mixed with paragraphs become a list', () => {
  const p = parseQuote('Intro line:\n• First\n• Second\n- Third\n* Fourth\n\nClosing words.');
  assert.deepEqual(p.blocks, [
    { kind: 'paragraph', text: 'Intro line:' },
    { kind: 'list', items: ['First', 'Second', 'Third', 'Fourth'] },
    { kind: 'paragraph', text: 'Closing words.' },
  ]);
});

test('bullets separated by blank lines are still one list', () => {
  const p = parseQuote('• A\n\n• B\n·C');
  assert.deepEqual(p.blocks, [{ kind: 'list', items: ['A', 'B', 'C'] }]);
  assert.equal(p.structured, true);
});

test('a plain line right after a bullet continues that bullet', () => {
  const p = parseQuote('• First part\nsecond part\n\nNext.');
  assert.deepEqual(p.blocks[0], { kind: 'list', items: ['First part second part'] });
  assert.equal(p.blocks.length, 2);
});

test('a hyphen or asterisk without a space is not a bullet', () => {
  const p = parseQuote('-5 degrees\n\n*note');
  assert.deepEqual(
    p.blocks.map((b) => b.kind),
    ['paragraph', 'paragraph'],
  );
});

test('CRLF line endings', () => {
  const p = parseQuote('One.\r\n\r\n• Two\r\n• Three\r\n\r\nFour.');
  assert.deepEqual(p.blocks, [
    { kind: 'paragraph', text: 'One.' },
    { kind: 'list', items: ['Two', 'Three'] },
    { kind: 'paragraph', text: 'Four.' },
  ]);
});

test('curly quotes and apostrophes pass through untouched', () => {
  const p = parseQuote('“God’s call,” she said.\n\n• ‘Yes’');
  assert.deepEqual(p.blocks, [
    { kind: 'paragraph', text: '“God’s call,” she said.' },
    { kind: 'list', items: ['‘Yes’'] },
  ]);
});

test('leading and trailing blank lines are dropped', () => {
  const p = parseQuote('\n\n  \nHello there.\n\n\n');
  assert.deepEqual(p.blocks, [{ kind: 'paragraph', text: 'Hello there.' }]);
});

test('empty, whitespace, null and undefined give no blocks', () => {
  for (const v of ['', '   \n\n', null, undefined]) {
    const p = parseQuote(v);
    assert.deepEqual(p.blocks, []);
    assert.equal(p.structured, false);
    assert.equal(p.wordCount, 0);
  }
});

test('stega: counts the cleaned text and keeps the run on the last text', () => {
  const p = parseQuote(`Alpha beta.\n\nGamma delta.${RUN}`);
  assert.equal(p.wordCount, 4);
  assert.equal(p.structured, true);
  const last = p.blocks[1];
  assert.ok(last.kind === 'paragraph');
  assert.equal(last.text, `Gamma delta.${RUN}`);
  assert.equal(splitStega(last.text).cleaned, 'Gamma delta.');
});

test('stega: a run after a bullet stays on the last item, intact', () => {
  const p = parseQuote(`Lead.\n• One\n• Two${RUN}`);
  const list = p.blocks[1];
  assert.ok(list.kind === 'list');
  assert.equal(list.items[1], `Two${RUN}`);
});

test('stega: a run alone adds no words and no blocks', () => {
  assert.deepEqual(parseQuote(RUN + RUN).blocks, []);
});

test('word count is over the visible words, bullets included', () => {
  const words = Array.from({ length: LONG_QUOTE_WORDS + 1 }, () => 'w').join(' ');
  assert.equal(parseQuote(words).wordCount, LONG_QUOTE_WORDS + 1);
  assert.equal(parseQuote('a b\n• c d').wordCount, 4);
});
