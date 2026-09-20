// scaffold-file: journal
// The blog archive's four derivations, on real-shaped fixtures.
//
// Why these are tested at all: every one of them answers a question the DATA
// already answers, and the alternative in each case was a field an editor would
// have to keep true by hand (CLAUDE.md rule 15). `journalEntry.featured` is the
// cautionary example sitting right there in the schema: it is a stored boolean
// that nothing here reads, because "is this one of the 36 durable posts" is a
// fact about the post's CATEGORY and the two would drift the first week.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSermonPreview,
  entryIsSermonPreview,
  splitDurable,
  paginate,
  seriesByTag,
  weekOfEyebrow,
  tagIndex,
  type BlogEntry,
} from './blog-derive.ts';
import { slugify } from './slugify.ts';

// ── Fixtures ────────────────────────────────────────────────────────────────
// Six entries, two categories, overlapping tags. Newest first, the order every
// query in queries.ts hands them over in.
const cat = (title: string) => ({
  title,
  slug: { current: title.toLowerCase().replace(/ /g, '-') },
});

const entries: BlogEntry[] = [
  {
    title: 'Preview for the third Sunday',
    slug: { current: 'preview-3' },
    publishedAt: '2024-01-17T00:00:00.000Z',
    categories: [cat('Sermon Preview')],
    tags: ['Advent', 'Christmas'],
  },
  {
    title: 'Ruminations on a long winter',
    slug: { current: 'winter' },
    publishedAt: '2024-01-15T00:00:00.000Z',
    categories: [cat('Ruminations')],
    tags: ['Advent', 'Christmas', 'Holidays'],
  },
  {
    title: 'Preview for the second Sunday',
    slug: { current: 'preview-2' },
    publishedAt: '2024-01-10T00:00:00.000Z',
    categories: [cat('Sermon Preview')],
    tags: ['Advent'],
  },
  {
    title: 'A note about the organ',
    slug: { current: 'organ' },
    publishedAt: '2024-01-08T00:00:00.000Z',
    categories: [cat('Ruminations')],
    tags: ['Music'],
  },
  {
    title: 'Preview for the first Sunday',
    slug: { current: 'preview-1' },
    publishedAt: '2024-01-03T00:00:00.000Z',
    categories: [cat('Sermon Preview')],
    tags: [],
  },
  {
    title: 'What we read in Advent',
    slug: { current: 'advent-reading' },
    publishedAt: '2024-01-01T00:00:00.000Z',
    categories: [cat('Ruminations')],
    tags: ['Advent', 'Christmas'],
  },
];

const titles = (list: BlogEntry[]) => list.map((e) => e.title);

// ── isSermonPreview ─────────────────────────────────────────────────────────

test('isSermonPreview is the one from import-post.ts, matched on the category name', () => {
  assert.equal(isSermonPreview(['Sermon Preview']), true);
  assert.equal(isSermonPreview(['  sermon preview  ']), true);
  assert.equal(isSermonPreview(['Ruminations']), false);
  assert.equal(isSermonPreview([]), false);
});

test('entryIsSermonPreview reads the entry`s own category objects', () => {
  assert.equal(entryIsSermonPreview(entries[0]), true);
  assert.equal(entryIsSermonPreview(entries[1]), false);
  assert.equal(entryIsSermonPreview({}), false);
});

test('a stega-encoded category title still matches', () => {
  // U+200B..U+200D and U+FEFF are what the preview client hides inside every
  // string it touches. A comparison that does not clean them first silently
  // answers "no" in the preview and the durable split inverts (CLAUDE.md).
  const encoded = `Sermon Preview​‌‍﻿`;
  assert.equal(entryIsSermonPreview({ categories: [{ title: encoded }] }), true);
});

// ── splitDurable ────────────────────────────────────────────────────────────

test('splitDurable separates the two piles and keeps newest-first in each', () => {
  const { durable, previews } = splitDurable(entries);
  assert.deepEqual(titles(durable), [
    'Ruminations on a long winter',
    'A note about the organ',
    'What we read in Advent',
  ]);
  assert.deepEqual(titles(previews), [
    'Preview for the third Sunday',
    'Preview for the second Sunday',
    'Preview for the first Sunday',
  ]);
});

test('splitDurable never mutates its input', () => {
  const before = titles(entries);
  splitDurable(entries);
  assert.deepEqual(titles(entries), before);
});

test('splitDurable on an empty list gives two empty piles', () => {
  assert.deepEqual(splitDurable([]), { durable: [], previews: [] });
});

// ── paginate ────────────────────────────────────────────────────────────────

test('142 posts at 12 a page is 12 pages, and the last one is short', () => {
  const all = Array.from({ length: 142 }, (_, i) => i);
  assert.equal(paginate(all, 12, 1).pages, 12);
  assert.equal(paginate(all, 12, 1).items.length, 12);
  assert.equal(paginate(all, 12, 1).items[0], 0);
  assert.equal(paginate(all, 12, 2).items[0], 12);
  assert.equal(paginate(all, 12, 12).items.length, 142 - 11 * 12);
});

test('an empty list is still one page, not zero', () => {
  // A zero-page archive would build /blog/page/0 or nothing at all; the index
  // has to exist and say "nothing here yet".
  assert.deepEqual(paginate([], 12, 1), { items: [], page: 1, pages: 1 });
});

test('paginate clamps a page number outside the range', () => {
  const all = [1, 2, 3];
  assert.deepEqual(paginate(all, 2, 9), { items: [3], page: 2, pages: 2 });
  assert.deepEqual(paginate(all, 2, 0), { items: [1, 2], page: 1, pages: 2 });
});

// ── seriesByTag ─────────────────────────────────────────────────────────────

test('seriesByTag puts the two-shared-tag entry before the one-shared-tag entry', () => {
  // "Ruminations on a long winter" carries Advent + Christmas + Holidays.
  // "What we read in Advent" shares two of them; "Preview for the third Sunday"
  // shares two as well but is older... so order the fixtures so the count, not
  // the date, is what decides: preview-2 shares exactly one (Advent).
  const out = seriesByTag(entries[1], entries);
  assert.deepEqual(titles(out), [
    'Preview for the third Sunday', // Advent + Christmas, newest
    'What we read in Advent', // Advent + Christmas, older
    'Preview for the second Sunday', // Advent only
  ]);
});

test('seriesByTag excludes the entry itself and honours the limit', () => {
  const out = seriesByTag(entries[1], entries, 2);
  assert.equal(out.length, 2);
  assert.ok(!titles(out).includes('Ruminations on a long winter'));
});

test('an entry with no tags gets an empty series, never a random three', () => {
  assert.deepEqual(seriesByTag(entries[4], entries), []);
});

test('an entry whose tags nothing else shares gets an empty series', () => {
  assert.deepEqual(seriesByTag(entries[3], entries), []);
});

test('tags are compared cleaned of any stega payload', () => {
  const dirty: BlogEntry = {
    title: 'Encoded',
    slug: { current: 'encoded' },
    publishedAt: '2024-02-01T00:00:00.000Z',
    categories: [cat('Ruminations')],
    tags: ['Advent​‌‍﻿'],
  };
  const out = seriesByTag(dirty, [dirty, ...entries], 1);
  assert.equal(out.length, 1);
});

// ── weekOfEyebrow ───────────────────────────────────────────────────────────

test('the sermon-preview eyebrow names the week of a Wednesday post', () => {
  // 2024-01-17 is a Wednesday. The eyebrow quotes the post's own date; it does
  // not try to guess the Sunday, because nothing in the data says which one.
  assert.equal(
    weekOfEyebrow('2024-01-17T10:00:00.000Z'),
    'Sermon preview, week of January 17, 2024',
  );
});

test('an unparseable date falls back to the plain eyebrow', () => {
  assert.equal(weekOfEyebrow('not a date'), 'Sermon preview');
  assert.equal(weekOfEyebrow(undefined), 'Sermon preview');
});

// ── tagIndex ────────────────────────────────────────────────────────────────

test('tagIndex groups by url slug, newest first inside a group, sorted by label', () => {
  const index = tagIndex(entries, slugify);
  assert.deepEqual(
    index.map((g) => g.slug),
    ['advent', 'christmas', 'holidays', 'music'],
  );
  const advent = index.find((g) => g.slug === 'advent')!;
  assert.deepEqual(titles(advent.entries), [
    'Preview for the third Sunday',
    'Ruminations on a long winter',
    'Preview for the second Sunday',
    'What we read in Advent',
  ]);
});

test('two spellings of one tag are one page, not two routes with one path', () => {
  const index = tagIndex(
    [
      { title: 'a', slug: { current: 'a' }, publishedAt: '2024-01-02', tags: ['Holidays'] },
      { title: 'b', slug: { current: 'b' }, publishedAt: '2024-01-01', tags: ['holidays'] },
    ],
    slugify,
  );
  assert.equal(index.length, 1);
  assert.equal(index[0].slug, 'holidays');
  assert.equal(index[0].label, 'Holidays');
  assert.equal(index[0].entries.length, 2);
});
