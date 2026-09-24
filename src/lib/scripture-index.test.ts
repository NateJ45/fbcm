// scaffold-file: journal
// The scripture index's parser and grouping (feat/scripture-search,
// 2026-09-24). The readings below are the shapes readingOf() really returns
// from the 142 imported posts, plus the shapes a hand-typed reading takes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKS,
  normaliseBook,
  parseReading,
  readingAnchor,
  bookSlug,
  bookOrder,
  testamentOf,
  buildScriptureIndex,
  scriptureRowsOf,
  type IndexRow,
} from './scripture-index.ts';

test('the canon has sixty-six books, Genesis to Revelation, 39 then 27', () => {
  assert.equal(BOOKS.length, 66);
  assert.equal(BOOKS[0], 'Genesis');
  assert.equal(BOOKS[38], 'Malachi');
  assert.equal(BOOKS[39], 'Matthew');
  assert.equal(BOOKS[65], 'Revelation');
  assert.equal(BOOKS.filter((b) => testamentOf(b) === 'OT').length, 39);
  assert.equal(BOOKS.filter((b) => testamentOf(b) === 'NT').length, 27);
});

test('normaliseBook reads full names, abbreviations and numbered books', () => {
  assert.equal(normaliseBook('Genesis'), 'Genesis');
  assert.equal(normaliseBook('Gen.'), 'Genesis');
  assert.equal(normaliseBook('Psalm'), 'Psalms');
  assert.equal(normaliseBook('Ps'), 'Psalms');
  assert.equal(normaliseBook('1 Corinthians'), '1 Corinthians');
  assert.equal(normaliseBook('I Cor.'), '1 Corinthians');
  assert.equal(normaliseBook('1Cor'), '1 Corinthians');
  assert.equal(normaliseBook('II Timothy'), '2 Timothy');
  assert.equal(normaliseBook('Second Kings'), '2 Kings');
  assert.equal(normaliseBook('III John'), '3 John');
  assert.equal(normaliseBook('1 King'), '1 Kings');
  assert.equal(normaliseBook('Song of Solomon'), 'Song of Songs');
  assert.equal(normaliseBook('Revelations'), 'Revelation');
  assert.equal(normaliseBook('Mt.'), 'Matthew');
  assert.equal(normaliseBook('Eph.'), 'Ephesians');
});

test('normaliseBook keeps the I in Isaiah and refuses what is not a book', () => {
  assert.equal(normaliseBook('Isaiah'), 'Isaiah');
  assert.equal(normaliseBook('Isa'), 'Isaiah');
  assert.equal(normaliseBook('Hezekiah'), '');
  assert.equal(normaliseBook('Sirach'), '');
  assert.equal(normaliseBook(''), '');
  assert.equal(normaliseBook(null), '');
});

test('a verse range inside one chapter', () => {
  const [p] = parseReading('Jeremiah 29:10-12');
  assert.deepEqual(
    { ...p },
    {
      book: 'Jeremiah',
      testament: 'OT',
      startChapter: 29,
      startVerse: 10,
      endChapter: 29,
      endVerse: 12,
      label: 'Jeremiah 29:10-12',
    },
  );
});

test('a range across chapters, and an en dash', () => {
  const [p] = parseReading('John 3:16-4:2');
  assert.equal(p.startChapter, 3);
  assert.equal(p.endChapter, 4);
  assert.equal(p.endVerse, 2);
  assert.equal(p.label, 'John 3:16-4:2');
  assert.equal(parseReading('Luke 1:28–38')[0].label, 'Luke 1:28-38');
  assert.equal(parseReading('1 Thessalonians 2:17-3:13')[0].label, '1 Thessalonians 2:17-3:13');
});

test('a range that repeats its own chapter is printed once', () => {
  assert.equal(parseReading('Luke 9:57-9:62')[0].label, 'Luke 9:57-62');
});

test('one verse, a whole chapter, and a run of chapters', () => {
  const [v] = parseReading('Mark 10:45');
  assert.equal(v.label, 'Mark 10:45');
  assert.equal(v.endVerse, 45);
  const [c] = parseReading('Psalm 130');
  assert.equal(c.startVerse, null);
  assert.equal(c.label, 'Psalm 130');
  const [r] = parseReading('Genesis 1-2');
  assert.equal(r.startChapter, 1);
  assert.equal(r.endChapter, 2);
  assert.equal(r.label, 'Genesis 1-2');
});

test('one psalm is "Psalm", a run of psalms is "Psalms"', () => {
  assert.equal(parseReading('Psalm 103:6-14')[0].label, 'Psalm 103:6-14');
  assert.equal(parseReading('Psalms 120-122')[0].label, 'Psalms 120-122');
});

test('several references in one reading, with the book carried', () => {
  assert.deepEqual(
    parseReading('Zephaniah 3:14-20; Luke 3:7-18').map((p) => p.label),
    ['Zephaniah 3:14-20', 'Luke 3:7-18'],
  );
  assert.deepEqual(
    parseReading('John 3:16; 4:2').map((p) => p.label),
    ['John 3:16', 'John 4:2'],
  );
  assert.deepEqual(
    parseReading('Luke 3:1-6, Malachi 3:2').map((p) => p.label),
    ['Luke 3:1-6', 'Malachi 3:2'],
  );
  assert.deepEqual(
    parseReading('I Cor. 13:1-3; 14:1').map((p) => p.label),
    ['1 Corinthians 13:1-3', '1 Corinthians 14:1'],
  );
  assert.deepEqual(
    parseReading('Song of Songs 2:1-7').map((p) => p.label),
    ['Song of Songs 2:1-7'],
  );
});

test('extra verses after a comma stretch the passage, part-verse letters drop', () => {
  assert.equal(parseReading('Romans 8:1-11, 28')[0].label, 'Romans 8:1-28');
  assert.equal(parseReading('Romans 8:28a')[0].label, 'Romans 8:28');
});

test('trailing punctuation from the prose does not stop a parse', () => {
  assert.equal(parseReading('Genesis 28:10-19.')[0].label, 'Genesis 28:10-19');
  assert.equal(parseReading('1 Corinthians 8:1-13]')[0].label, '1 Corinthians 8:1-13');
});

test('an unreadable reading parses to nothing, never to half of itself', () => {
  assert.deepEqual(parseReading('Hezekiah 3:1'), []);
  assert.deepEqual(parseReading('John 3:16; Sirach 2:1'), []);
  assert.deepEqual(parseReading('John'), []);
  assert.deepEqual(parseReading('Romans 8:11-1'), []);
  assert.deepEqual(parseReading(''), []);
  assert.deepEqual(parseReading(undefined), []);
});

test('a stega payload does not change the parse', () => {
  const invisible = '​‌﻿';
  assert.equal(parseReading(`Romans 5:1-10${invisible}`)[0].label, 'Romans 5:1-10');
});

test('bookSlug and readingAnchor give the anchor on /blog/scripture', () => {
  assert.equal(bookSlug('1 Corinthians'), '1-corinthians');
  assert.equal(bookSlug('Song of Songs'), 'song-of-songs');
  assert.equal(readingAnchor('I Cor. 13:1'), '1-corinthians');
  assert.equal(readingAnchor('Zephaniah 3:19; Luke 3:7'), 'zephaniah');
  assert.equal(readingAnchor('Hezekiah 3:1'), '');
});

const row = (id: string, reading: string, iso: string, title = `Post ${id}`): IndexRow => ({
  id,
  title,
  href: `/post/${id}/`,
  dateLabel: iso,
  iso,
  reading,
});

test('the index groups by testament, then book in canonical order, then passage', () => {
  const idx = buildScriptureIndex([
    row('a', 'Revelation 21:1-7', '2025-01-05'),
    row('b', 'John 14:8-17', '2025-02-02'),
    row('c', 'John 3:1-21', '2025-03-02'),
    row('d', 'Genesis 45:1-15', '2025-04-06'),
    row('e', 'Genesis 18:1-15', '2025-05-04'),
    row('f', 'Malachi 3:2', '2025-06-01'),
    row('g', 'John 3:1-21', '2024-06-02'),
  ]);
  assert.deepEqual(
    idx.testaments.map((t) => t.name),
    ['Old Testament', 'New Testament'],
  );
  assert.deepEqual(
    idx.testaments[0].books.map((b) => b.name),
    ['Genesis', 'Malachi'],
  );
  assert.deepEqual(
    idx.testaments[1].books.map((b) => b.name),
    ['John', 'Revelation'],
  );
  const john = idx.testaments[1].books[0];
  assert.deepEqual(
    john.passages.map((p) => p.label),
    ['John 3:1-21', 'John 14:8-17'],
  );
  // the same passage preached twice: one row, two posts, newest first
  assert.deepEqual(
    john.passages[0].posts.map((p) => p.id),
    ['c', 'g'],
  );
  assert.deepEqual(
    idx.testaments[0].books[0].passages.map((p) => p.label),
    ['Genesis 18:1-15', 'Genesis 45:1-15'],
  );
  assert.equal(idx.bookCount, 4);
  assert.equal(idx.passageCount, 6);
  assert.equal(bookOrder('Genesis') < bookOrder('Malachi'), true);
});

test('passages in one chapter sort by verse, then by where they end', () => {
  const idx = buildScriptureIndex([
    row('a', 'Matthew 6:19-34', '2025-01-05'),
    row('b', 'Matthew 6:1-16', '2025-01-12'),
    row('c', 'Matthew 6:1-8', '2025-01-19'),
    row('d', 'Matthew 5:33-48', '2025-01-26'),
  ]);
  assert.deepEqual(
    idx.testaments[0].books[0].passages.map((p) => p.label),
    ['Matthew 5:33-48', 'Matthew 6:1-8', 'Matthew 6:1-16', 'Matthew 6:19-34'],
  );
});

test('a reading of two books lists the post under both, and anchors to the first', () => {
  const idx = buildScriptureIndex([row('z', 'Zephaniah 3:14-20; Luke 3:7-18', '2024-12-15')]);
  assert.equal(idx.testaments.length, 2);
  assert.equal(idx.testaments[0].books[0].passages[0].posts[0].id, 'z');
  assert.equal(idx.testaments[1].books[0].passages[0].posts[0].id, 'z');
  assert.equal(idx.anchorByPost.get('z'), 'zephaniah');
});

test('an unparseable reading goes to Other with its post; no reading is left out', () => {
  const idx = buildScriptureIndex([
    row('x', 'Hezekiah 3:1', '2025-01-05'),
    row('y', '', '2025-01-12'),
    row('w', 'Romans 5:1-10', '2025-01-19'),
  ]);
  assert.deepEqual(idx.other, [
    {
      reading: 'Hezekiah 3:1',
      posts: [
        { id: 'x', title: 'Post x', href: '/post/x/', dateLabel: '2025-01-05', iso: '2025-01-05' },
      ],
    },
  ]);
  assert.equal(idx.anchorByPost.has('x'), false);
  assert.equal(idx.anchorByPost.has('y'), false);
  assert.equal(idx.anchorByPost.get('w'), 'romans');
  assert.deepEqual(
    idx.testaments.map((t) => t.key),
    ['NT'],
  );
});

test('passage ids are unique anchors', () => {
  const idx = buildScriptureIndex([
    row('a', 'John 3:1-21', '2025-01-05'),
    row('b', '1 John 3:1-7', '2025-01-12'),
  ]);
  const ids = idx.testaments.flatMap((t) => t.books.flatMap((b) => b.passages.map((p) => p.id)));
  assert.deepEqual(ids, ['john-3-1-21', '1-john-3-1-7']);
  assert.equal(new Set(ids).size, ids.length);
});

test('an empty list is an empty index', () => {
  const idx = buildScriptureIndex([]);
  assert.deepEqual(idx.testaments, []);
  assert.deepEqual(idx.other, []);
  assert.equal(idx.passageCount, 0);
});

test('scriptureRowsOf takes previews with a reading, dated by their Sunday', () => {
  const preview = [{ title: 'Sermon Preview', slug: { current: 'sermon-preview' } }];
  const news = [{ title: 'FBCM Events', slug: { current: 'fbcm-events' } }];
  const rows = scriptureRowsOf([
    {
      _id: 'p1',
      title: 'A Future and a Hope',
      slug: { current: 'a-future' },
      // Tuesday Nov 11 2025 -> Sunday Nov 16
      publishedAt: '2025-11-11T15:00:00Z',
      categories: preview,
      opening: 'This is a sermon preview. Jeremiah 29:10-12 For I know the plans...',
    },
    {
      _id: 'p2',
      title: 'No reading here',
      slug: { current: 'no-reading' },
      publishedAt: '2025-11-04T15:00:00Z',
      categories: preview,
      opening: 'This is a sermon preview for the fourth week of our series.',
    },
    {
      _id: 'n1',
      title: 'Picnic',
      slug: { current: 'picnic' },
      publishedAt: '2025-07-01T15:00:00Z',
      categories: news,
      opening: 'As Psalm 133:1 says, how good it is to be together.',
    },
  ]);
  assert.deepEqual(rows, [
    {
      id: 'p1',
      title: 'A Future and a Hope',
      href: '/post/a-future/',
      dateLabel: 'Nov 16, 2025',
      iso: '2025-11-16',
      reading: 'Jeremiah 29:10-12',
    },
  ]);
});
