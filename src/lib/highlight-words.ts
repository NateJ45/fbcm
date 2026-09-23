// Safe to edit by hand
// scaffold-file: church
// Highlight whole words inside a string that may carry a preview stega run
// (2026-09-23, the Watchword band: "praise" and "proclaim" in Isaiah 12:4).
//
// THE STEGA RULE (CLAUDE.md, the preview rules): never match against the raw
// string. In the Presentation preview every display string carries a run of
// invisible characters (U+200B, U+200C, U+200D, U+FEFF and a few legacy
// ones), and U+FEFF even matches `\s`. So the words are found in the CLEANED
// text, and each cleaned index is mapped back to its position in the RAW
// string. The parts returned are slices of the raw string: joined, they are
// the raw input exactly, payload and all, so click-to-edit survives. A stega
// run that sits directly after a hit stays outside it (in the plain part that
// follows); one that sits inside a matched word stays inside the hit.
//
// Matching is case-insensitive and whole-word (a letter or digit on either
// side stops a match, so "praised" is not "praise"). Every occurrence is
// highlighted, not just the first: the verse says "proclaim" twice.

import { RUN_SOURCE } from './preview-stega.ts';

/** The preview's own run pattern (4+ characters of either encoding). */
const STEGA_RUN = new RegExp(RUN_SOURCE, 'gu');

export interface HighlightPart {
  text: string;
  hit: boolean;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function highlightWords(raw: string, words: string[]): HighlightPart[] {
  if (!raw) return [];
  const wanted = words.map((w) => w.trim()).filter(Boolean);
  if (wanted.length === 0) return [{ text: raw, hit: false }];

  // Build the cleaned text and, for each of its UTF-16 units, the index of the
  // same unit in the raw string.
  const rawIndex: number[] = [];
  let cleaned = '';
  let from = 0;
  const copy = (end: number) => {
    for (let i = from; i < end; i++) {
      rawIndex.push(i);
      cleaned += raw[i];
    }
  };
  for (const run of raw.matchAll(STEGA_RUN)) {
    copy(run.index);
    from = run.index + run[0].length;
  }
  copy(raw.length);

  // Longest first, so a longer word is never shadowed by a prefix of it.
  const alternatives = [...wanted].sort((a, b) => b.length - a.length).map(escape);
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  );

  const parts: HighlightPart[] = [];
  let cursor = 0; // a raw index
  const push = (text: string, hit: boolean) => {
    if (text) parts.push({ text, hit });
  };
  for (const m of cleaned.matchAll(pattern)) {
    const start = rawIndex[m.index];
    const end = rawIndex[m.index + m[0].length - 1] + 1;
    push(raw.slice(cursor, start), false);
    push(raw.slice(start, end), true);
    cursor = end;
  }
  push(raw.slice(cursor), false);
  return parts;
}
