// scaffold-file: journal
// The passage text behind a sermon preview's reading (2026-09-24,
// feat/scripture-text). Pure: no network, no disk, no clock. The fetching and
// the on-disk cache live in scripts/fetch-scripture.mjs, which runs before
// `astro build` and writes src/data/scripture.generated.json; the post page
// reads that file and prints the passage in a <details> under "The reading".
//
// Nothing here is stored in Sanity (CLAUDE.md rule 15). The reading is derived
// from the post (readingOf / findLection), the verses are derived from the
// reading, and the text comes from the translation's own source at build time.
//
// FOUR JOBS:
//   passageSpans(reading)       "Romans 13:11-14; 14:1a" -> exact verse spans
//   chaptersOf(spans)           the chapters a build has to fetch, once each
//   versesOfHelloao(json)       one chapter from bible.helloao.org, as verses
//   sliceSpans(spans, chapters) the verses of the passage, or null if any is missing
// plus allocateTranslations(), the build-time cap that keeps the NIV inside
// Biblica's 500-verse allowance, and the translation config below.
//
// NEVER A BROKEN BLOCK. Every function returns null (or []) rather than a
// partial answer: a reading that does not parse, a chapter that did not
// arrive, a verse the chapter does not have. The page then keeps the reading
// exactly as it was before this pass, and the build prints a warning.

import { splitStega } from './preview-stega.ts';
import { normaliseBook, BOOKS } from './scripture-index.ts';

// ---- The translation (one place to change it) --------------------------------

export type TranslationCode = 'BSB' | 'NIV';

export interface Translation {
  code: TranslationCode;
  /** The name, as a reader sees it. */
  name: string;
  /**
   * The credit printed under every passage in this translation. For the NIV it
   * is Biblica's required notice, word for word (their permissions page); do
   * not shorten it.
   */
  credit: string;
  /** Where the text comes from at build time. */
  provider: 'helloao' | 'api.bible';
  /** The build-time environment variable that switches this translation on (none: always on). */
  keyEnv?: string;
  /** The translation's id at its provider (API.Bible's Bible id for the NIV). */
  providerId?: string;
  /**
   * The publisher's allowance for quoting without written permission, when
   * there is one. The build never quotes past it: the overflow falls back to
   * the default translation, with a warning (allocateTranslations).
   */
  allowance?: { verses: number; bookShare: number; workShare?: number };
}

export const TRANSLATIONS: Record<TranslationCode, Translation> = {
  // Public domain since 2023: no key, no notice required, no verse limit. The
  // credit is a courtesy and says what it is.
  BSB: {
    code: 'BSB',
    name: 'Berean Standard Bible',
    credit: 'Berean Standard Bible, public domain',
    provider: 'helloao',
  },
  // The church's own translation. Served only when API_BIBLE_KEY is set at
  // build time AND that key has the NIV enabled (API.Bible's Starter plan lets
  // a key pick up to three copyrighted Bibles, non-commercial). Biblica's
  // permission covers up to 500 verses, fewer than 25% of any book and never a
  // whole book, with this notice shown.
  NIV: {
    code: 'NIV',
    name: 'New International Version',
    credit:
      'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.',
    provider: 'api.bible',
    keyEnv: 'API_BIBLE_KEY',
    providerId: '78a9f6124f344018-01',
    // workShare: the quotation must also be under a quarter of "the work in
    // which it is quoted", read here as the page (passage words over the
    // page's words), the strictest reading of Biblica's notice.
    allowance: { verses: 500, bookShare: 0.25, workShare: 0.25 },
  },
  // THE ESV HOOK. Crossway's API (api.esv.org) serves the ESV with a free key
  // for non-commercial use, up to 500 verses a page and 500 site-wide as
  // quotations, with its own notice. To add it: an 'ESV' entry here with
  // provider 'esv', keyEnv 'ESV_API_KEY' and its allowance, and a fetcher in
  // scripts/fetch-scripture.mjs beside the API.Bible step (GET
  // /v3/passage/text/?q=<reading> with `Authorization: Token <key>`; the text
  // format carries [n] verse numbers, which versesOfBracketText() reads).
};

/** Always available: the fallback for everything. */
export const DEFAULT_TRANSLATION: TranslationCode = 'BSB';
/** Used when its key is present and the provider has it; BSB otherwise. */
export const PREFERRED_TRANSLATION: TranslationCode = 'NIV';

// ---- Book codes ----------------------------------------------------------------

/** The USFM book codes both providers use, in canonical order (parallel to BOOKS). */
const CODES = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH',
  '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK',
  'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH',
  '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD',
  'REV',
]; // prettier-ignore

/** "1 Corinthians" -> "1CO"; '' when the name is not one of the sixty-six. */
export function bookCode(book: string): string {
  const i = BOOKS.indexOf(book);
  return i < 0 ? '' : CODES[i];
}

// ---- Parsing a reading into exact spans ----------------------------------------

/**
 * One contiguous run of verses. `startVerse` null means "from the start of
 * the chapter", `endVerse` null "to the end of the chapter" (a whole chapter
 * is both).
 */
export interface Span {
  book: string;
  code: string;
  startChapter: number;
  startVerse: number | null;
  endChapter: number;
  endVerse: number | null;
  /** A part-verse mark was written ("12a"): the whole verse is shown. */
  partial: boolean;
}

const clean = (text: string | null | undefined): string =>
  splitStega(String(text ?? ''))
    .cleaned.replace(/[​-‍⁠﻿]/g, '')
    .replace(/[‐-―−]/g, '-')
    .replace(/[“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const BOOK_HEAD =
  /^((?:(?:[123]|i{1,3}|1st|2nd|3rd|first|second|third)\.?\s*)?[a-z]+\.?(?:\s+of\s+[a-z]+)?(?:\s+of\s+the\s+[a-z]+)?)\s*(.*)$/i;
// One comma-separated part of a reference: "13:11-14", "3:16-4:2", "12a",
// "6-8", "5", "130", "1-2" (chapters when there is no chapter context yet).
const PART = /^(\d+)(?:[:.](\d+)([a-c])?)?(?:\s*-\s*(\d+)(?:[:.](\d+))?)?([a-c])?$/i;

/**
 * Every span in a reading, exactly as written: "5:1, 6" is two spans, not
 * 5:1-6. Pieces are split on ";" and on "," before a new book; a piece with
 * no book carries the book before it, and a bare verse after a comma carries
 * the chapter before it. Returns [] when any part fails to read: a reading is
 * never half-understood.
 */
export function passageSpans(reading: string | null | undefined): Span[] {
  const s = clean(reading).replace(/[.\])]+$/, '');
  if (!s) return [];
  const pieces = s
    .split(/\s*;\s*|\s*,\s*(?=(?:[123]|i{1,3})?\s*[a-z]{2,})/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: Span[] = [];
  let book = '';
  for (const piece of pieces) {
    let rest = piece;
    if (/^[a-z]/i.test(piece) || /^[123]\s*[a-z]/i.test(piece)) {
      const head = piece.match(BOOK_HEAD);
      const found = head ? normaliseBook(head[1].trim()) : '';
      if (!found) return [];
      book = found;
      rest = head![2];
    }
    const code = bookCode(book);
    if (!code) return [];
    // Within a piece: comma parts. The first sets the chapter; later bare
    // numbers are verses of the chapter in force.
    let chapter: number | null = null;
    for (const raw of rest.split(/\s*,\s*/)) {
      const part = raw.trim();
      const m = part.match(PART);
      if (!m) return [];
      const [, a, b, bSuffix, c, d, cdSuffix] = m;
      let span: Span;
      if (b !== undefined) {
        // "13:11", "13:11-14", "3:16-4:2"
        const c1 = Number(a);
        const v1 = Number(b);
        let c2 = c1;
        let v2 = v1;
        if (c !== undefined && d !== undefined) {
          c2 = Number(c);
          v2 = Number(d);
        } else if (c !== undefined) {
          v2 = Number(c);
        }
        span = {
          book,
          code,
          startChapter: c1,
          startVerse: v1,
          endChapter: c2,
          endVerse: v2,
          partial: !!(bSuffix || cdSuffix),
        };
        chapter = c2;
      } else if (chapter !== null) {
        // ", 6" or ", 6-8" or ", 12a": verses of the chapter in force.
        if (d !== undefined) return [];
        const v1 = Number(a);
        const v2 = c !== undefined ? Number(c) : v1;
        span = {
          book,
          code,
          startChapter: chapter,
          startVerse: v1,
          endChapter: chapter,
          endVerse: v2,
          partial: !!cdSuffix,
        };
      } else {
        // "130" or "1-2": whole chapters. A suffix makes no sense here.
        if (cdSuffix || d !== undefined) return [];
        const c1 = Number(a);
        const c2 = c !== undefined ? Number(c) : c1;
        span = {
          book,
          code,
          startChapter: c1,
          startVerse: null,
          endChapter: c2,
          endVerse: null,
          partial: false,
        };
        chapter = c2;
      }
      const backwards =
        span.endChapter < span.startChapter ||
        (span.endChapter === span.startChapter &&
          span.startVerse !== null &&
          span.endVerse !== null &&
          span.endVerse < span.startVerse);
      if (span.startChapter < 1 || (span.startVerse !== null && span.startVerse < 1) || backwards)
        return [];
      out.push(span);
    }
  }
  return out;
}

/** A chapter to fetch: "ROM 13". */
export interface ChapterRef {
  code: string;
  chapter: number;
}

export const chapterKey = (code: string, chapter: number): string => `${code}.${chapter}`;

/** Every chapter the spans touch, once each, in the order they first appear. */
export function chaptersOf(spans: readonly Span[]): ChapterRef[] {
  const seen = new Set<string>();
  const out: ChapterRef[] = [];
  for (const s of spans) {
    for (let c = s.startChapter; c <= s.endChapter; c += 1) {
      const k = chapterKey(s.code, c);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ code: s.code, chapter: c });
    }
  }
  return out;
}

// ---- Verses ------------------------------------------------------------------------

/** One verse as the page prints it. Poetry lines are separated by "\n". */
export interface Verse {
  chapter: number;
  verse: number;
  text: string;
}

type HelloaoItem = string | { text?: string; poem?: number; lineBreak?: boolean; noteId?: number };
interface HelloaoChapter {
  chapter?: {
    number?: number;
    content?: { type?: string; number?: number; content?: HelloaoItem[] }[];
  };
}

const tidy = (s: string) =>
  s
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();

/**
 * One chapter from bible.helloao.org (`/api/BSB/ROM/13.json`), as verses.
 * Headings, Psalm superscriptions and footnote markers are the edition's
 * furniture, not the text, and are dropped. A poetry line (`{text, poem}`)
 * starts a new line; prose runs on. Null when the shape is not a chapter.
 */
export function versesOfHelloao(json: unknown): Verse[] | null {
  const ch = (json as HelloaoChapter)?.chapter;
  if (!ch || typeof ch.number !== 'number' || !Array.isArray(ch.content)) return null;
  const out: Verse[] = [];
  for (const item of ch.content) {
    if (item?.type !== 'verse' || typeof item.number !== 'number') continue;
    let text = '';
    for (const part of item.content ?? []) {
      if (typeof part === 'string') {
        text += (text && !/[\s\n]$/.test(text) ? ' ' : '') + part;
      } else if (part && typeof part.text === 'string') {
        if (part.poem) text += (text ? '\n' : '') + part.text;
        else text += (text && !/[\s\n]$/.test(text) ? ' ' : '') + part.text;
      } else if (part?.lineBreak) {
        text += '\n';
      }
    }
    text = tidy(text);
    if (text) out.push({ chapter: ch.number, verse: item.number, text });
  }
  return out.length ? out : null;
}

/**
 * Verses from text with bracketed verse numbers, the "text" content type of
 * API.Bible and of the ESV API: "[11] And do this... [12] The night...".
 * `chapter` is the span's first chapter; a verse number that does not rise
 * (a cross-chapter span, "[36] ... [1]") starts the next chapter. Null when
 * no verse number is found.
 */
export function versesOfBracketText(text: string, chapter: number): Verse[] | null {
  const src = String(text ?? '');
  const re = /\[(\d+)\]/g;
  const marks = [...src.matchAll(re)];
  if (!marks.length) return null;
  const out: Verse[] = [];
  let c = chapter;
  let prev = 0;
  for (let i = 0; i < marks.length; i += 1) {
    const from = (marks[i].index ?? 0) + marks[i][0].length;
    const to = i + 1 < marks.length ? (marks[i + 1].index ?? src.length) : src.length;
    const body = tidy(src.slice(from, to).replace(/\s*\n\s*/g, '\n'));
    const n = Number(marks[i][1]);
    if (n <= prev) c += 1;
    prev = n;
    if (body) out.push({ chapter: c, verse: n, text: body });
  }
  return out.length ? out : null;
}

/**
 * The verses of every span, in order, from chapters already fetched (keyed by
 * chapterKey). Null when a chapter is missing or a span asks for a verse its
 * chapter does not have: better no passage than a wrong one.
 */
export function sliceSpans(
  spans: readonly Span[],
  chapters: ReadonlyMap<string, readonly Verse[]>,
): Verse[] | null {
  if (!spans.length) return null;
  const out: Verse[] = [];
  const seen = new Set<string>();
  for (const s of spans) {
    for (let c = s.startChapter; c <= s.endChapter; c += 1) {
      const verses = chapters.get(chapterKey(s.code, c));
      if (!verses || !verses.length) return null;
      const last = verses[verses.length - 1].verse;
      const from = c === s.startChapter && s.startVerse !== null ? s.startVerse : 1;
      const to = c === s.endChapter && s.endVerse !== null ? s.endVerse : last;
      if (from > last || to > last) return null;
      for (const v of verses) {
        if (v.verse < from || v.verse > to) continue;
        const k = `${c}:${v.verse}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(v);
      }
    }
  }
  return out.length ? out : null;
}

/**
 * The label each verse carries on the page: its number, and "chapter:verse"
 * where the passage turns a chapter (the first verse of every chapter after
 * the first), so a reader of 3:16-4:2 can see where chapter 4 begins.
 */
export function verseLabels(verses: readonly Verse[]): string[] {
  let chapter = verses[0]?.chapter;
  return verses.map((v, i) => {
    if (i > 0 && v.chapter !== chapter) {
      chapter = v.chapter;
      return `${v.chapter}:${v.verse}`;
    }
    return String(v.verse);
  });
}

// ---- The allowance -----------------------------------------------------------------

/** What allocateTranslations is given: one passage the site will show. */
export interface AllocationItem {
  /** The reading, as the page looks it up ("Romans 13:11-14"). */
  reading: string;
  /** "YYYY-MM-DD" of the newest post showing it: the newest are served first. */
  newest: string;
  /** Its verses, as "CODE.chapter.verse" keys. */
  verseKeys: string[];
  /**
   * The largest share of any page showing it that the passage would be
   * (passage words / (page words + passage words)). Omitted: not checked.
   */
  workShare?: number;
}

export interface Allocation {
  /** reading -> the translation it is shown in. */
  byReading: Map<string, TranslationCode>;
  /** Distinct verses shown in the preferred translation. */
  preferredVerses: number;
  /** Per book: distinct verses shown in the preferred translation. */
  preferredByBook: Map<string, number>;
  /** Readings that fell back to the default because the allowance was spent. */
  overflow: string[];
}

/**
 * Which translation each reading is shown in. The preferred translation is
 * given to the newest readings first, and a reading only gets it if the
 * running total of DISTINCT verses stays within the allowance and no book goes
 * to `bookShare` or more of its verses (`bookTotals`: code -> verses in the
 * book), and no page showing it would be `workShare` or more passage; a verse
 * shown twice counts once. Everything else gets the default. A
 * translation with no allowance takes everything.
 */
export function allocateTranslations(
  items: readonly AllocationItem[],
  preferred: Translation,
  bookTotals: ReadonlyMap<string, number>,
  fallback: TranslationCode = DEFAULT_TRANSLATION,
): Allocation {
  const byReading = new Map<string, TranslationCode>();
  const used = new Set<string>();
  const byBook = new Map<string, number>();
  const overflow: string[] = [];
  const order = [...items].sort((a, b) =>
    a.newest === b.newest ? a.reading.localeCompare(b.reading) : a.newest < b.newest ? 1 : -1,
  );
  for (const item of order) {
    const fresh = item.verseKeys.filter((k) => !used.has(k));
    const allowance = preferred.allowance;
    let fits = true;
    if (allowance) {
      if (used.size + fresh.length > allowance.verses) fits = false;
      if (allowance.workShare !== undefined && (item.workShare ?? 0) >= allowance.workShare)
        fits = false;
      const add = new Map<string, number>();
      for (const k of fresh) {
        const code = k.split('.')[0];
        add.set(code, (add.get(code) ?? 0) + 1);
      }
      for (const [code, n] of add) {
        const total = bookTotals.get(code);
        // An unknown book size is never guessed at: it does not fit.
        if (!total || ((byBook.get(code) ?? 0) + n) / total >= allowance.bookShare) fits = false;
      }
    }
    if (!fits) {
      byReading.set(item.reading, fallback);
      overflow.push(item.reading);
      continue;
    }
    byReading.set(item.reading, preferred.code);
    for (const k of fresh) {
      used.add(k);
      const code = k.split('.')[0];
      byBook.set(code, (byBook.get(code) ?? 0) + 1);
    }
  }
  return { byReading, preferredVerses: used.size, preferredByBook: byBook, overflow };
}

/** "ROM.13.11" keys for a list of verses in one book. */
export const verseKeysOf = (code: string, verses: readonly Verse[]): string[] =>
  verses.map((v) => `${code}.${v.chapter}.${v.verse}`);

// ---- What the page reads -------------------------------------------------------------

/** One passage in src/data/scripture.generated.json. */
export interface PassageEntry {
  translation: TranslationCode;
  verses: Verse[];
  /** API.Bible's FUMS token(s), for a passage served through it. */
  fums?: string[];
}

export interface ScriptureManifest {
  /** reading (as readingOf / findLection print it) -> its passage. */
  passages: Record<string, PassageEntry>;
}

/** The passage for a reading, or null (the reading then renders as before). */
export function passageFor(
  manifest: ScriptureManifest | null | undefined,
  reading: string | null | undefined,
): PassageEntry | null {
  const key = clean(reading);
  if (!key || !manifest?.passages) return null;
  const p = manifest.passages[key];
  return p && Array.isArray(p.verses) && p.verses.length && TRANSLATIONS[p.translation] ? p : null;
}

/** The key a reading is stored under in the manifest (stega and dash-normalised). */
export const readingKey = (reading: string | null | undefined): string => clean(reading);
