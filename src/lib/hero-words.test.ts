import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headlineSegments, heroWords, type HeroWord } from './hero-words.ts';
import { splitHeadingAccent } from './heading-accent.ts';
import { splitStega } from './preview-stega.ts';

// A stega run as the preview client appends it, built from code points so the
// file carries no invisible characters. U+FEFF is in it on purpose: it matches
// `\s`, which is the trap.
const STEGA = [0x200b, 0x200b, 0x200b, 0x200b, 0x200c, 0xfeff, 0x200d, 0xfeff, 0x200c]
  .map((c) => String.fromCodePoint(c))
  .join('');

const text = (w: HeroWord) => w.pieces.map((p) => p.text).join('');
const texts = (ws: HeroWord[]) => ws.map(text);

test('a plain headline becomes its words', () => {
  assert.deepEqual(texts(heroWords([{ text: 'Praise and proclaim.' }])), [
    'Praise',
    'and',
    'proclaim.',
  ]);
});

test('runs of spaces, tabs and line breaks separate words, and nothing is empty', () => {
  assert.deepEqual(texts(heroWords([{ text: '  A church\tfor\n the  whole ' }])), [
    'A',
    'church',
    'for',
    'the',
    'whole',
  ]);
  assert.deepEqual(heroWords([{ text: '' }]), []);
  assert.deepEqual(heroWords([{ text: '   ' }]), []);
});

test('a no-break space holds two words together as one', () => {
  assert.deepEqual(texts(heroWords([{ text: 'Come to First Baptist' }])), [
    'Come',
    'to',
    'First Baptist',
  ]);
});

test('stega: split on the cleaned text, the run goes back on the last word', () => {
  const raw = `Praise and proclaim.${STEGA}`;
  const words = heroWords([{ text: raw }]);
  // Three words, not the dozens a raw whitespace split would make.
  assert.equal(words.length, 3);
  assert.deepEqual(
    texts(words).map((t) => splitStega(t).cleaned),
    ['Praise', 'and', 'proclaim.'],
  );
  assert.equal(text(words[2]), `proclaim.${STEGA}`);
  // Joined with spaces, the words are the raw headline again, run and all.
  assert.equal(texts(words).join(' '), raw);
});

test('stega in the middle of the string is still one run, on the last word', () => {
  const words = heroWords([{ text: `Praise ${STEGA}and proclaim` }]);
  assert.deepEqual(texts(words), ['Praise', 'and', `proclaim${STEGA}`]);
});

test('the script accent keeps its own letters, and the words around it stay whole', () => {
  const segs = headlineSegments(
    'A church for the whole of Muncie',
    splitHeadingAccent('A church for the whole of Muncie', 'whole'),
  );
  const words = heroWords(segs);
  assert.deepEqual(texts(words), ['A', 'church', 'for', 'the', 'whole', 'of', 'Muncie']);
  assert.deepEqual(words[4].pieces, [{ text: 'whole', accent: 'script' }]);
  assert.deepEqual(words[5].pieces, [{ text: 'of' }]);
});

test('an accent inside a word styles only its letters and does not split the word', () => {
  const h = "Muncie's church";
  const words = heroWords(headlineSegments(h, splitHeadingAccent(h, 'Muncie')));
  assert.deepEqual(texts(words), ["Muncie's", 'church']);
  assert.deepEqual(words[0].pieces, [{ text: 'Muncie', accent: 'script' }, { text: "'s" }]);
});

test('the colour accent is used when there is no script accent, and the script accent wins', () => {
  const h = 'What to Expect on Sunday';
  const miss = splitHeadingAccent(h, null);
  const colour = splitHeadingAccent(h, 'on Sunday');
  const both = heroWords(headlineSegments(h, miss, colour));
  assert.deepEqual(texts(both), ['What', 'to', 'Expect', 'on', 'Sunday']);
  assert.deepEqual(both[3].pieces, [{ text: 'on', accent: 'colour' }]);
  assert.deepEqual(both[4].pieces, [{ text: 'Sunday', accent: 'colour' }]);

  const script = splitHeadingAccent(h, 'Expect');
  const scripted = heroWords(headlineSegments(h, script, colour));
  assert.deepEqual(scripted[2].pieces, [{ text: 'Expect', accent: 'script' }]);
  assert.ok(scripted.every((w, i) => i === 2 || w.pieces.every((p) => !p.accent)));
});

test('no accent found: the headline is one segment, untouched (stega kept)', () => {
  const raw = `Praise and proclaim.${STEGA}`;
  assert.deepEqual(headlineSegments(raw, splitHeadingAccent(raw, null)), [{ text: raw }]);
});
