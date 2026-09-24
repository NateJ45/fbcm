// scaffold-file: journal
// The scripture index (2026-09-24, feat/scripture-search): every passage
// preached, derived at build time from the posts themselves, grouped by book in
// canonical order. No field stores any of it (CLAUDE.md rule 15): a sermon
// preview's reading is readingOf() over its opening text, the same derivation
// the post page's Reading row and the register's meta column print, so the
// index, the post and the register can never disagree about what was read.
//
// Three jobs, all pure:
//   parseReading(text)        "I Cor. 13:1-3; 14:1" -> two Passages
//   buildScriptureIndex(rows) the posts, grouped: testament > book > passage
//   bookSlug(book)            the anchor a book heading carries on the page
//
// NEVER GUESS, as in sermon-derive.ts. A reading whose book is not one of the
// sixty-six (a typo, an apocryphal book, a reference too mangled to read) is
// not dropped and not forced into a book: it goes to `other`, and the page
// lists it under its own small heading with its post, as written.

import { splitStega } from './preview-stega.ts';
import { readingOf, sundayOf, formatDay, isoDay } from './sermon-derive.ts';
import { entryIsSermonPreview, clean, type RegisterEntry } from './blog-derive.ts';

export type Testament = 'OT' | 'NT';

interface BookDef {
  name: string;
  testament: Testament;
  /** Every other way the book is written, lower case, dots and spaces removed. */
  aliases: string[];
}

// Canonical Protestant order, Genesis to Revelation. The position in this list
// IS the sort key, so it must never be alphabetised.
const BOOK_DEFS: BookDef[] = [
  { name: 'Genesis', testament: 'OT', aliases: ['gen', 'ge', 'gn'] },
  { name: 'Exodus', testament: 'OT', aliases: ['exod', 'exo', 'ex'] },
  { name: 'Leviticus', testament: 'OT', aliases: ['lev', 'le', 'lv'] },
  { name: 'Numbers', testament: 'OT', aliases: ['num', 'nu', 'nm', 'numb'] },
  { name: 'Deuteronomy', testament: 'OT', aliases: ['deut', 'deu', 'dt'] },
  { name: 'Joshua', testament: 'OT', aliases: ['josh', 'jos'] },
  { name: 'Judges', testament: 'OT', aliases: ['judg', 'jdg', 'jgs'] },
  { name: 'Ruth', testament: 'OT', aliases: ['ru', 'rth'] },
  { name: '1 Samuel', testament: 'OT', aliases: ['1sam', '1sa', '1sm'] },
  { name: '2 Samuel', testament: 'OT', aliases: ['2sam', '2sa', '2sm'] },
  { name: '1 Kings', testament: 'OT', aliases: ['1king', '1kgs', '1ki', '1kg'] },
  { name: '2 Kings', testament: 'OT', aliases: ['2king', '2kgs', '2ki', '2kg'] },
  { name: '1 Chronicles', testament: 'OT', aliases: ['1chron', '1chr', '1ch'] },
  { name: '2 Chronicles', testament: 'OT', aliases: ['2chron', '2chr', '2ch'] },
  { name: 'Ezra', testament: 'OT', aliases: ['ezr'] },
  { name: 'Nehemiah', testament: 'OT', aliases: ['neh', 'ne'] },
  { name: 'Esther', testament: 'OT', aliases: ['esth', 'est', 'es'] },
  { name: 'Job', testament: 'OT', aliases: ['jb'] },
  { name: 'Psalms', testament: 'OT', aliases: ['psalm', 'psa', 'pss', 'ps', 'psm'] },
  { name: 'Proverbs', testament: 'OT', aliases: ['proverb', 'prov', 'pro', 'prv', 'pr'] },
  { name: 'Ecclesiastes', testament: 'OT', aliases: ['eccles', 'eccl', 'ecc', 'ec', 'qoh'] },
  {
    name: 'Song of Songs',
    testament: 'OT',
    aliases: ['songofsolomon', 'songofsongs', 'song', 'sos', 'canticles', 'cant'],
  },
  { name: 'Isaiah', testament: 'OT', aliases: ['isa', 'is'] },
  { name: 'Jeremiah', testament: 'OT', aliases: ['jer', 'je', 'jr'] },
  { name: 'Lamentations', testament: 'OT', aliases: ['lam', 'la'] },
  { name: 'Ezekiel', testament: 'OT', aliases: ['ezek', 'eze', 'ezk'] },
  { name: 'Daniel', testament: 'OT', aliases: ['dan', 'da', 'dn'] },
  { name: 'Hosea', testament: 'OT', aliases: ['hos', 'ho'] },
  { name: 'Joel', testament: 'OT', aliases: ['jl'] },
  { name: 'Amos', testament: 'OT', aliases: ['am'] },
  { name: 'Obadiah', testament: 'OT', aliases: ['obad', 'ob'] },
  { name: 'Jonah', testament: 'OT', aliases: ['jon', 'jnh'] },
  { name: 'Micah', testament: 'OT', aliases: ['mic', 'mc'] },
  { name: 'Nahum', testament: 'OT', aliases: ['nah', 'na'] },
  { name: 'Habakkuk', testament: 'OT', aliases: ['hab', 'hb'] },
  { name: 'Zephaniah', testament: 'OT', aliases: ['zeph', 'zep', 'zp'] },
  { name: 'Haggai', testament: 'OT', aliases: ['hag', 'hg'] },
  { name: 'Zechariah', testament: 'OT', aliases: ['zech', 'zec', 'zc'] },
  { name: 'Malachi', testament: 'OT', aliases: ['mal', 'ml'] },
  { name: 'Matthew', testament: 'NT', aliases: ['matt', 'mat', 'mt'] },
  { name: 'Mark', testament: 'NT', aliases: ['mrk', 'mar', 'mk', 'mr'] },
  { name: 'Luke', testament: 'NT', aliases: ['luk', 'lk'] },
  { name: 'John', testament: 'NT', aliases: ['jhn', 'jn'] },
  { name: 'Acts', testament: 'NT', aliases: ['act', 'ac', 'actsoftheapostles'] },
  { name: 'Romans', testament: 'NT', aliases: ['rom', 'ro', 'rm'] },
  { name: '1 Corinthians', testament: 'NT', aliases: ['1cor', '1co'] },
  { name: '2 Corinthians', testament: 'NT', aliases: ['2cor', '2co'] },
  { name: 'Galatians', testament: 'NT', aliases: ['gal', 'ga'] },
  { name: 'Ephesians', testament: 'NT', aliases: ['eph', 'ephes'] },
  { name: 'Philippians', testament: 'NT', aliases: ['phil', 'php', 'pp'] },
  { name: 'Colossians', testament: 'NT', aliases: ['col', 'co'] },
  { name: '1 Thessalonians', testament: 'NT', aliases: ['1thess', '1thes', '1th'] },
  { name: '2 Thessalonians', testament: 'NT', aliases: ['2thess', '2thes', '2th'] },
  { name: '1 Timothy', testament: 'NT', aliases: ['1tim', '1ti'] },
  { name: '2 Timothy', testament: 'NT', aliases: ['2tim', '2ti'] },
  { name: 'Titus', testament: 'NT', aliases: ['tit', 'ti'] },
  { name: 'Philemon', testament: 'NT', aliases: ['philem', 'phm', 'phlm'] },
  { name: 'Hebrews', testament: 'NT', aliases: ['heb'] },
  { name: 'James', testament: 'NT', aliases: ['jas', 'jm'] },
  { name: '1 Peter', testament: 'NT', aliases: ['1pet', '1pe', '1pt'] },
  { name: '2 Peter', testament: 'NT', aliases: ['2pet', '2pe', '2pt'] },
  { name: '1 John', testament: 'NT', aliases: ['1jn', '1jhn', '1jo'] },
  { name: '2 John', testament: 'NT', aliases: ['2jn', '2jhn', '2jo'] },
  { name: '3 John', testament: 'NT', aliases: ['3jn', '3jhn', '3jo'] },
  { name: 'Jude', testament: 'NT', aliases: ['jud', 'jd'] },
  { name: 'Revelation', testament: 'NT', aliases: ['revelations', 'rev', 're', 'apocalypse'] },
];

/** The sixty-six book names, in canonical order. */
export const BOOKS: readonly string[] = BOOK_DEFS.map((b) => b.name);

const key = (s: string) => s.toLowerCase().replace(/[.\s]+/g, '');

// Every spelling (full name and alias) to its position in BOOK_DEFS.
const LOOKUP = new Map<string, number>();
BOOK_DEFS.forEach((b, i) => {
  for (const a of [b.name, ...b.aliases]) {
    const k = key(a);
    // First writer wins, so a later short alias can never steal an earlier
    // book's exact name ("co" is Colossians, never 1 Corinthians).
    if (!LOOKUP.has(k)) LOOKUP.set(k, i);
  }
});

// A leading ordinal written out: "I", "II", "III", "First", "2nd", ...
const ORDINALS: [RegExp, string][] = [
  [/^(?:iii|3rd|third)\b\.?\s*/i, '3'],
  [/^(?:ii|2nd|second)\b\.?\s*/i, '2'],
  [/^(?:i|1st|first)\b\.?\s*/i, '1'],
];

/**
 * The canonical name of a book as written ("I Cor.", "1Cor", "Ps", "Song of
 * Solomon"), or '' when it is not one of the sixty-six.
 */
export function normaliseBook(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  for (const [re, n] of ORDINALS) {
    // Only an ordinal FOLLOWED BY A BOOK: "Isaiah" must not lose its "I".
    const m = s.match(re);
    if (m && s.length > m[0].length && /^[a-z]/i.test(s.slice(m[0].length))) {
      const rest = s.slice(m[0].length);
      const i = LOOKUP.get(key(`${n}${rest}`));
      if (i !== undefined) return BOOK_DEFS[i].name;
    }
  }
  const i = LOOKUP.get(key(s));
  return i === undefined ? '' : BOOK_DEFS[i].name;
}

/** Where a book sits in the canon (0 = Genesis), or -1. */
export function bookOrder(name: string): number {
  return BOOKS.indexOf(name);
}

export function testamentOf(name: string): Testament | null {
  const i = bookOrder(name);
  return i < 0 ? null : BOOK_DEFS[i].testament;
}

/** The anchor a book's heading carries on /blog/scripture: "1 Corinthians" -> "1-corinthians". */
export function bookSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** One passage: a book and a span of chapters and verses within it. */
export interface Passage {
  book: string;
  testament: Testament;
  startChapter: number;
  /** null when the reference names a whole chapter ("Psalm 130"). */
  startVerse: number | null;
  endChapter: number;
  endVerse: number | null;
  /** The passage as the index prints it: "Jeremiah 29:10-12", "John 3:16-4:2". */
  label: string;
}

// A reference once its book is known: "29:10-12", "3:16-4:2", "130", "1-2",
// "8:28a", "5:1, 6". Letters after a verse ("28a") are part-verse marks and
// are dropped; they do not change where the passage sits.
const SPAN =
  /^(\d+)(?:[:.](\d+)[a-c]?)?(?:\s*[-–—]\s*(\d+)(?:[:.](\d+)[a-c]?)?)?(?:\s*,\s*(\d+)[a-c]?(?:\s*[-–—]\s*(\d+)[a-c]?)?)*$/;

// A book name at the head of a piece: an optional ordinal (1, 2, 3, I, II,
// III, First...) then words, where "Song of Songs" style names keep their "of".
const BOOK_HEAD =
  /^((?:(?:[123]|i{1,3}|1st|2nd|3rd|first|second|third)\.?\s*)?[a-z]+\.?(?:\s+of\s+[a-z]+)?(?:\s+of\s+the\s+[a-z]+)?)\s*(.*)$/i;

function labelOf(p: Omit<Passage, 'label'>): string {
  const start = p.startVerse === null ? `${p.startChapter}` : `${p.startChapter}:${p.startVerse}`;
  let end = '';
  if (p.endChapter !== p.startChapter) {
    end = p.endVerse === null ? `${p.endChapter}` : `${p.endChapter}:${p.endVerse}`;
  } else if (p.endVerse !== null && p.endVerse !== p.startVerse) {
    end = `${p.endVerse}`;
  }
  // One psalm is "Psalm 103"; the book, and a run of psalms, is "Psalms".
  const name = p.book === 'Psalms' && p.endChapter === p.startChapter ? 'Psalm' : p.book;
  return `${name} ${start}${end ? `-${end}` : ''}`;
}

/** Parse the numbers after a book. Null when they do not read as a reference. */
function spanOf(book: string, raw: string): Omit<Passage, 'label'> | null {
  const s = raw.trim().replace(/[.\])]+$/, '');
  const m = s.match(SPAN);
  if (!m) return null;
  const testament = testamentOf(book);
  if (!testament) return null;
  const c1 = Number(m[1]);
  const v1 = m[2] !== undefined ? Number(m[2]) : null;
  let c2 = c1;
  let v2: number | null = v1;
  if (m[3] !== undefined) {
    if (m[4] !== undefined) {
      // "3:16-4:2": a second chapter and verse.
      c2 = Number(m[3]);
      v2 = Number(m[4]);
    } else if (v1 !== null) {
      // "29:10-12": a verse range inside one chapter.
      v2 = Number(m[3]);
    } else {
      // "1-2": a chapter range.
      c2 = Number(m[3]);
    }
  }
  // "5:1, 6" or "5:1-3, 6-8": extra verses in the same chapter stretch the
  // end of the passage (the index sorts by where a passage starts, and prints
  // its outer bounds).
  const extra = [...s.matchAll(/,\s*(\d+)(?:\s*[-–—]\s*(\d+))?/g)];
  if (extra.length && v1 !== null && c2 === c1) {
    const last = extra[extra.length - 1];
    v2 = Math.max(v2 ?? 0, Number(last[2] ?? last[1]));
  }
  if (c1 < 1 || c2 < c1 || (c2 === c1 && v1 !== null && v2 !== null && v2 < v1)) return null;
  return { book, testament, startChapter: c1, startVerse: v1, endChapter: c2, endVerse: v2 };
}

/**
 * Every passage in a reading. Pieces are split on ";" (and on ", " when the
 * next piece names its own book), and a piece without a book carries the book
 * before it: "John 3:16; 4:2" is two passages of John. Returns [] when any
 * piece fails to read, so a half-understood reading is never half-indexed; the
 * caller files the whole reading under "Other".
 */
export function parseReading(text: string | null | undefined): Passage[] {
  // Cleaned of stega, then of any stray zero-width character a paste left
  // behind (U+FEFF matches \s, so it would otherwise split a number in two).
  const s = splitStega(String(text ?? ''))
    .cleaned.replace(/[​-‍⁠﻿]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[“”"]/g, '')
    .trim();
  if (!s) return [];
  // Split on ";" always, and on "," only where a book name follows it.
  const pieces = s
    .split(/\s*;\s*|\s*,\s*(?=(?:[123]|i{1,3})?\s*[a-z]{2,})/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: Passage[] = [];
  let book = '';
  for (const piece of pieces) {
    let rest = piece;
    if (/^[a-z]/i.test(piece) || /^[123]\s*[a-z]/i.test(piece)) {
      const head = piece.match(BOOK_HEAD);
      if (!head) return [];
      // BOOK_HEAD takes "Song of Songs" and "Acts of the Apostles" whole, and
      // an ordinal with its book ("I Cor.", "1 John").
      const found = normaliseBook(head[1].trim());
      if (!found) return [];
      book = found;
      rest = head[2];
    }
    if (!book) return [];
    const span = spanOf(book, rest);
    if (!span) return [];
    out.push({ ...span, label: labelOf(span) });
  }
  return out;
}

/** The anchor on /blog/scripture a reading's first book lands on, or ''. */
export function readingAnchor(text: string | null | undefined): string {
  const first = parseReading(text)[0];
  return first ? bookSlug(first.book) : '';
}

// ---- The index -----------------------------------------------------------------

/** One post that preached a passage. */
export interface IndexPost {
  id: string;
  title: string;
  href: string;
  /** "Sep 21, 2025": the Sunday it was preached. */
  dateLabel: string;
  /** YYYY-MM-DD of that Sunday, for <time datetime> and sorting. */
  iso: string;
}

/** What the index is built from: a post and its reading. */
export interface IndexRow extends IndexPost {
  reading: string;
}

export interface IndexPassage {
  label: string;
  /** The anchor of this passage's row, unique on the page. */
  id: string;
  startChapter: number;
  startVerse: number | null;
  endChapter: number;
  endVerse: number | null;
  /** Newest first, like every register on the site. */
  posts: IndexPost[];
}

export interface IndexBook {
  name: string;
  slug: string;
  passages: IndexPassage[];
}

export interface IndexTestament {
  key: Testament;
  name: 'Old Testament' | 'New Testament';
  books: IndexBook[];
}

export interface ScriptureIndex {
  testaments: IndexTestament[];
  /** Readings that did not parse, each with its posts, as written. */
  other: { reading: string; posts: IndexPost[] }[];
  /** Post id -> the book anchor its reading lands on (the post page's link). */
  anchorByPost: Map<string, string>;
  passageCount: number;
  bookCount: number;
}

const newestFirst = (a: IndexPost, b: IndexPost) =>
  a.iso === b.iso ? a.title.localeCompare(b.title) : a.iso < b.iso ? 1 : -1;

const passageOrder = (a: IndexPassage, b: IndexPassage) =>
  a.startChapter - b.startChapter ||
  (a.startVerse ?? 0) - (b.startVerse ?? 0) ||
  a.endChapter - b.endChapter ||
  (a.endVerse ?? 0) - (b.endVerse ?? 0);

/**
 * Group the posts by book and passage. A post whose reading names two books is
 * listed under both. A post with no reading is not in the index at all; a post
 * whose reading does not parse is listed under `other`.
 */
export function buildScriptureIndex(rows: readonly IndexRow[]): ScriptureIndex {
  const books = new Map<string, Map<string, IndexPassage>>();
  const other = new Map<string, IndexPost[]>();
  const anchorByPost = new Map<string, string>();

  for (const row of rows ?? []) {
    const reading = splitStega(String(row.reading ?? '')).cleaned.trim();
    if (!reading) continue;
    const post: IndexPost = {
      id: row.id,
      title: row.title,
      href: row.href,
      dateLabel: row.dateLabel,
      iso: row.iso,
    };
    const passages = parseReading(reading);
    if (passages.length === 0) {
      other.set(reading, [...(other.get(reading) ?? []), post]);
      continue;
    }
    anchorByPost.set(row.id, bookSlug(passages[0].book));
    const seen = new Set<string>();
    for (const p of passages) {
      if (seen.has(p.label)) continue;
      seen.add(p.label);
      const byLabel = books.get(p.book) ?? new Map<string, IndexPassage>();
      books.set(p.book, byLabel);
      const entry = byLabel.get(p.label) ?? {
        label: p.label,
        id: bookSlug(p.label),
        startChapter: p.startChapter,
        startVerse: p.startVerse,
        endChapter: p.endChapter,
        endVerse: p.endVerse,
        posts: [],
      };
      if (!entry.posts.some((x) => x.id === post.id)) entry.posts.push(post);
      byLabel.set(p.label, entry);
    }
  }

  const ordered = [...books.entries()]
    .sort(([a], [b]) => bookOrder(a) - bookOrder(b))
    .map(([name, byLabel]): IndexBook => ({
      name,
      slug: bookSlug(name),
      passages: [...byLabel.values()]
        .map((p) => ({ ...p, posts: [...p.posts].sort(newestFirst) }))
        .sort(passageOrder),
    }));

  const testaments: IndexTestament[] = [
    { key: 'OT' as const, name: 'Old Testament' as const },
    { key: 'NT' as const, name: 'New Testament' as const },
  ]
    .map((t) => ({ ...t, books: ordered.filter((b) => testamentOf(b.name) === t.key) }))
    .filter((t) => t.books.length > 0);

  return {
    testaments,
    other: [...other.entries()]
      .map(([reading, posts]) => ({ reading, posts: [...posts].sort(newestFirst) }))
      .sort((a, b) => a.reading.localeCompare(b.reading)),
    anchorByPost,
    passageCount: ordered.reduce((n, b) => n + b.passages.length, 0),
    bookCount: ordered.length,
  };
}

// ---- From the posts ------------------------------------------------------------

/**
 * The index's rows from the posts the register already has: every sermon
 * preview with a reading, dated by its Sunday. Only previews, because only a
 * preview's opening names the passage PREACHED; any other post that quotes a
 * verse is quoting, not preaching (the post page prints a Reading row for
 * previews only, for the same reason).
 */
export function scriptureRowsOf(entries: readonly RegisterEntry[]): IndexRow[] {
  const out: IndexRow[] = [];
  for (const e of entries ?? []) {
    if (!entryIsSermonPreview(e)) continue;
    const slug = clean(e.slug?.current).trim();
    const reading = readingOf(e.opening);
    const sunday = sundayOf(e.publishedAt);
    if (!slug || !reading || !sunday) continue;
    out.push({
      id: e._id ?? slug,
      title: clean(e.title).trim(),
      href: `/post/${slug}/`,
      dateLabel: formatDay(sunday, { month: 'short', day: 'numeric', year: 'numeric' }),
      iso: isoDay(sunday),
      reading,
    });
  }
  return out;
}
