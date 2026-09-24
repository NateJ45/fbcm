import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitTitle, typeset, TITLE_SIZES, type Measure } from './og-card.ts';

// A fake face: every character is 0.6em wide, a space 0.3em.
const measure: Measure = (text, size) =>
  [...text].reduce((w, c) => w + (c === ' ' ? 0.3 : 0.6) * size, 0);
const MAX = 760;

test('a short title is set at the largest size on one line', () => {
  const r = fitTitle('Give', measure, { maxWidth: MAX });
  assert.equal(r.size, TITLE_SIZES[0]);
  assert.deepEqual(r.lines, ['Give']);
  assert.equal(r.truncated, false);
});

test('every line fits, and no word is ever split', () => {
  for (const title of [
    'Plan a visit',
    'Weddings and building use',
    'Sermon Preview: The Parable of the Sower and the Soils',
    'A Very Long Title About Advent Christmas Epiphany and Everything That Comes After in the Church Year',
  ]) {
    const r = fitTitle(title, measure, { maxWidth: MAX });
    for (const line of r.lines) assert.ok(measure(line, r.size) <= MAX, `${title}: ${line}`);
    const source = title.split(' ');
    const set = r.lines.join(' ').replace(/…$/, '').split(' ');
    set.forEach((w, i) => {
      if (i < set.length - 1 || !r.truncated) assert.equal(w, source[i], `word ${i} of ${title}`);
    });
  }
});

test('longer titles get smaller, and at most three lines until the size is small', () => {
  const a = fitTitle('Plan a visit', measure, { maxWidth: MAX });
  const b = fitTitle('Sermon Preview: The Parable of the Sower and the Soils', measure, {
    maxWidth: MAX,
  });
  assert.ok(b.size < a.size);
  assert.ok(b.lines.length <= (b.size <= 60 ? 4 : 3));
});

test('two lines are balanced rather than a full line and an orphan', () => {
  const r = fitTitle('Weddings and building use for the whole family', measure, { maxWidth: MAX });
  if (r.lines.length === 2) {
    const [x, y] = r.lines.map((l) => measure(l, r.size));
    assert.ok(Math.abs((x ?? 0) - (y ?? 0)) < 0.4 * MAX, r.lines.join(' / '));
  }
});

test('a title too long for four lines is cut at a word with an ellipsis', () => {
  const r = fitTitle('word '.repeat(80), measure, { maxWidth: MAX });
  assert.equal(r.truncated, true);
  assert.equal(r.lines.length, 4);
  assert.ok(r.lines[3]?.endsWith('word…'));
  for (const line of r.lines) assert.ok(measure(line, r.size) <= MAX);
});

test('one enormous word is set smaller, never broken', () => {
  const r = fitTitle('Supercalifragilisticexpialidociously', measure, { maxWidth: MAX });
  assert.deepEqual(r.lines, ['Supercalifragilisticexpialidociously']);
  assert.ok(measure(r.lines[0] ?? '', r.size) <= MAX);
  assert.ok(r.size < TITLE_SIZES[TITLE_SIZES.length - 1]);
});

test('an empty title comes back empty', () => {
  assert.deepEqual(fitTitle('   ', measure, { maxWidth: MAX }).lines, []);
});

test('fitsHeight skips sizes that would crowd the rest of the card', () => {
  const r = fitTitle('Give', measure, { maxWidth: MAX, fitsHeight: (size) => size <= 80 });
  assert.equal(r.size, 80);
});

test('typeset curls the quotes a title carries', () => {
  assert.equal(typeset("We're God's people"), 'We’re God’s people');
  assert.equal(typeset('"Love" made visible'), '“Love” made visible');
  assert.equal(typeset("the 'old' way"), 'the ‘old’ way');
  assert.equal(typeset('No quotes'), 'No quotes');
});
