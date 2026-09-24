// scaffold-file: journal
// The passage text behind a sermon preview's reading (feat/scripture-text).
// Pure parts only: parsing a reading into exact spans, the chapters to fetch,
// one helloao chapter as verses, slicing, and the NIV allowance.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  passageSpans,
  chaptersOf,
  versesOfHelloao,
  versesOfBracketText,
  sliceSpans,
  verseLabels,
  allocateTranslations,
  verseKeysOf,
  passageFor,
  readingKey,
  bookCode,
  chapterKey,
  TRANSLATIONS,
  type Verse,
} from './scripture-text.ts';

const brief = (reading: string) =>
  passageSpans(reading).map(
    (s) =>
      `${s.code} ${s.startChapter}:${s.startVerse ?? '*'}-${s.endChapter}:${s.endVerse ?? '*'}${s.partial ? ' partial' : ''}`,
  );

test('a verse range inside one chapter', () => {
  assert.deepEqual(brief('Romans 13:11-14'), ['ROM 13:11-13:14']);
});

test('one verse', () => {
  assert.deepEqual(brief('Philippians 1:21'), ['PHP 1:21-1:21']);
});

test('a cross-chapter range', () => {
  assert.deepEqual(brief('1 John 1:1-2:2'), ['1JN 1:1-2:2']);
  assert.deepEqual(brief('Ezra 6:19-7:10'), ['EZR 6:19-7:10']);
});

test('the en dash the church types is read as a hyphen', () => {
  assert.deepEqual(brief('Luke 1:28–38'), ['LUK 1:28-1:38']);
  assert.equal(readingKey('Luke 1:28–38'), 'Luke 1:28-38');
});

test('several references, a carried book and a carried chapter', () => {
  assert.deepEqual(brief('John 3:16; 4:2'), ['JHN 3:16-3:16', 'JHN 4:2-4:2']);
  assert.deepEqual(brief('Romans 5:1, 6'), ['ROM 5:1-5:1', 'ROM 5:6-5:6']);
  assert.deepEqual(brief('Romans 5:1-3, 6-8'), ['ROM 5:1-5:3', 'ROM 5:6-5:8']);
  assert.deepEqual(brief('Isaiah 9:2-7, Luke 2:1-14'), ['ISA 9:2-9:7', 'LUK 2:1-2:14']);
});

test('a part-verse mark keeps the whole verse and says so', () => {
  assert.deepEqual(brief('Romans 13:11-12a'), ['ROM 13:11-13:12 partial']);
  assert.deepEqual(brief('Romans 13:11b-14'), ['ROM 13:11-13:14 partial']);
  assert.deepEqual(brief('Mark 1:1, 12a'), ['MRK 1:1-1:1', 'MRK 1:12-1:12 partial']);
});

test('whole chapters, and abbreviations', () => {
  assert.deepEqual(brief('Psalm 23'), ['PSA 23:*-23:*']);
  assert.deepEqual(brief('Psalms 1-2'), ['PSA 1:*-2:*']);
  assert.deepEqual(brief('I Cor. 13:1-3'), ['1CO 13:1-13:3']);
  assert.deepEqual(brief('Song of Songs 2:1'), ['SNG 2:1-2:1']);
});

test('nothing that does not read is half-read', () => {
  assert.deepEqual(passageSpans(''), []);
  assert.deepEqual(passageSpans(null), []);
  assert.deepEqual(passageSpans('Hezekiah 3:1'), []);
  assert.deepEqual(passageSpans('Romans 13:14-11'), []);
  assert.deepEqual(passageSpans('Romans 13:11-14; Nonsense 2:1'), []);
});

test('stega marks are not part of the reading', () => {
  const stega = 'Romans 13:11-14​‌‍⁠﻿';
  assert.deepEqual(brief(stega), ['ROM 13:11-13:14']);
});

test('book codes follow the canon', () => {
  assert.equal(bookCode('Genesis'), 'GEN');
  assert.equal(bookCode('1 Corinthians'), '1CO');
  assert.equal(bookCode('Song of Songs'), 'SNG');
  assert.equal(bookCode('Revelation'), 'REV');
  assert.equal(bookCode('Hezekiah'), '');
});

test('chaptersOf lists each chapter once, across ranges', () => {
  assert.deepEqual(chaptersOf(passageSpans('John 3:16-4:2; 4:5')), [
    { code: 'JHN', chapter: 3 },
    { code: 'JHN', chapter: 4 },
  ]);
});

// A helloao chapter, cut down: a heading, a prose verse with a footnote marker,
// a poetry verse, a line break item and a Psalm superscription.
const ROM13 = {
  chapter: {
    number: 13,
    content: [
      { type: 'heading', content: ['The Day Is Near'] },
      { type: 'line_break' },
      { type: 'verse', number: 11, content: ['And do this, understanding the occasion.'] },
      {
        type: 'verse',
        number: 12,
        content: ['The night is nearly over;', 'the day has drawn near.'],
      },
      { type: 'verse', number: 13, content: ['Let us behave decently.'] },
      {
        type: 'verse',
        number: 14,
        content: ['Instead, clothe yourselves with', { noteId: 77 }, 'the Lord Jesus Christ.'],
      },
    ],
  },
};
const PSA23 = {
  chapter: {
    number: 23,
    content: [
      { type: 'hebrew_subtitle', content: ['A Psalm of David.'] },
      {
        type: 'verse',
        number: 1,
        content: [
          { text: 'The LORD is my shepherd;', poem: 1 },
          { noteId: 50 },
          { text: 'I shall not want.', poem: 2 },
        ],
      },
    ],
  },
};

test('versesOfHelloao keeps the text and drops the furniture', () => {
  const v = versesOfHelloao(ROM13)!;
  assert.equal(v.length, 4);
  assert.deepEqual(v[0], {
    chapter: 13,
    verse: 11,
    text: 'And do this, understanding the occasion.',
  });
  assert.equal(v[1].text, 'The night is nearly over; the day has drawn near.');
  assert.equal(v[3].text, 'Instead, clothe yourselves with the Lord Jesus Christ.');
  const p = versesOfHelloao(PSA23)!;
  assert.equal(p.length, 1);
  assert.equal(p[0].text, 'The LORD is my shepherd;\nI shall not want.');
});

test('versesOfHelloao refuses anything that is not a chapter', () => {
  assert.equal(versesOfHelloao(null), null);
  assert.equal(versesOfHelloao({ error: 'not found' }), null);
  assert.equal(versesOfHelloao({ chapter: { number: 1, content: [] } }), null);
});

test('versesOfBracketText reads [n] verse numbers', () => {
  const v = versesOfBracketText(
    '  [11] And do this. [12] The night is nearly over;\n  the day is here. ',
    13,
  )!;
  assert.deepEqual(v, [
    { chapter: 13, verse: 11, text: 'And do this.' },
    { chapter: 13, verse: 12, text: 'The night is nearly over;\nthe day is here.' },
  ]);
  assert.equal(versesOfBracketText('no numbers', 1), null);
  // a cross-chapter span: the numbering starts again at the new chapter
  assert.deepEqual(
    versesOfBracketText('[35] a [36] b [1] c [2] d', 3)!.map((v) => `${v.chapter}:${v.verse}`),
    ['3:35', '3:36', '4:1', '4:2'],
  );
});

const chapter = (c: number, n: number): Verse[] =>
  Array.from({ length: n }, (_, i) => ({ chapter: c, verse: i + 1, text: `${c}.${i + 1}` }));

test('sliceSpans slices ranges, cross-chapter ranges and lists', () => {
  const chapters = new Map([
    [chapterKey('JHN', 3), chapter(3, 36)],
    [chapterKey('JHN', 4), chapter(4, 54)],
  ]);
  const got = sliceSpans(passageSpans('John 3:35-4:2'), chapters)!;
  assert.deepEqual(
    got.map((v) => `${v.chapter}:${v.verse}`),
    ['3:35', '3:36', '4:1', '4:2'],
  );
  assert.deepEqual(verseLabels(got), ['35', '36', '4:1', '2']);
  const list = sliceSpans(passageSpans('John 3:1, 3, 3'), chapters)!;
  assert.deepEqual(
    list.map((v) => v.verse),
    [1, 3],
  );
  assert.equal(sliceSpans(passageSpans('John 3'), chapters)!.length, 36);
});

test('sliceSpans returns null rather than a wrong passage', () => {
  const chapters = new Map([[chapterKey('JHN', 3), chapter(3, 36)]]);
  // chapter 4 never arrived
  assert.equal(sliceSpans(passageSpans('John 3:35-4:2'), chapters), null);
  // a verse the chapter does not have
  assert.equal(sliceSpans(passageSpans('John 3:30-40'), chapters), null);
  assert.equal(sliceSpans([], chapters), null);
});

test('allocateTranslations keeps the NIV inside 500 verses and a quarter of a book', () => {
  const totals = new Map([
    ['ROM', 433],
    ['PHM', 25],
  ]);
  const keys = (code: string, c: number, from: number, to: number) =>
    verseKeysOf(
      code,
      Array.from({ length: to - from + 1 }, (_, i) => ({ chapter: c, verse: from + i, text: '' })),
    );
  const a = allocateTranslations(
    [
      { reading: 'old', newest: '2020-01-05', verseKeys: keys('ROM', 1, 1, 30) },
      { reading: 'new', newest: '2025-01-05', verseKeys: keys('ROM', 2, 1, 29) },
      // Philemon: 7 of 25 verses is 28%, over a quarter of the book.
      { reading: 'phm', newest: '2024-01-05', verseKeys: keys('PHM', 1, 1, 7) },
      // the same verses again cost nothing
      { reading: 'again', newest: '2019-01-05', verseKeys: keys('ROM', 2, 1, 10) },
    ],
    { ...TRANSLATIONS.NIV, allowance: { verses: 40, bookShare: 0.25 } },
    totals,
  );
  assert.equal(a.byReading.get('new'), 'NIV');
  assert.equal(a.byReading.get('phm'), 'BSB');
  // 29 + 30 > 40: the older one overflows
  assert.equal(a.byReading.get('old'), 'BSB');
  assert.equal(a.byReading.get('again'), 'NIV');
  assert.equal(a.preferredVerses, 29);
  assert.deepEqual(a.overflow.sort(), ['old', 'phm']);
});

test('allocateTranslations keeps a passage under a quarter of its page', () => {
  const a = allocateTranslations(
    [
      { reading: 'short page', newest: '2025-01-01', verseKeys: ['ROM.1.1'], workShare: 0.4 },
      { reading: 'long page', newest: '2025-01-01', verseKeys: ['ROM.1.2'], workShare: 0.1 },
    ],
    TRANSLATIONS.NIV,
    new Map([['ROM', 433]]),
  );
  assert.equal(a.byReading.get('short page'), 'BSB');
  assert.equal(a.byReading.get('long page'), 'NIV');
});

test('allocateTranslations never guesses at an unknown book size', () => {
  const a = allocateTranslations(
    [{ reading: 'x', newest: '2025-01-01', verseKeys: ['ROM.1.1'] }],
    TRANSLATIONS.NIV,
    new Map(),
  );
  assert.equal(a.byReading.get('x'), 'BSB');
});

test('passageFor looks a reading up by its cleaned key, and refuses a broken entry', () => {
  const manifest = {
    passages: {
      'Luke 1:28-38': { translation: 'BSB' as const, verses: chapter(1, 2) },
      Broken: { translation: 'XYZ' as never, verses: chapter(1, 1) },
      Empty: { translation: 'BSB' as const, verses: [] },
    },
  };
  assert.equal(passageFor(manifest, 'Luke 1:28–38')?.verses.length, 2);
  assert.equal(passageFor(manifest, 'Broken'), null);
  assert.equal(passageFor(manifest, 'Empty'), null);
  assert.equal(passageFor(manifest, 'Nowhere 1:1'), null);
  assert.equal(passageFor(null, 'Luke 1:28-38'), null);
});

test('the translation credits carry no em dash (CLAUDE.md rule 2)', () => {
  for (const t of Object.values(TRANSLATIONS)) assert.ok(!t.credit.includes('—'), t.code);
});
