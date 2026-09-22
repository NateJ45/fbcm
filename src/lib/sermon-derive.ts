// scaffold-file: journal
// Facts about a sermon preview, derived from the post itself (the journal pass,
// 2026-09-22, variant "P2 Bulletin"). 105 of the 142 posts are weekly previews;
// the reader wants to know which Sunday, which passage and which series, and
// every one of those is already in the post: the Sunday follows from the publish
// date, the passage and the series are written into the opening paragraphs. None
// of them is a field (CLAUDE.md rule 15), so none of them can drift.
//
// NEVER GUESS. A helper that finds nothing returns '' (or null) and the caller
// omits the row. 95 of 105 previews carry a reference in their first six text
// blocks; the other ten simply show no Reading row.
//
// Dates are read in the church's time zone. `new Date(iso).getUTCDate()` is the
// wrong day for anything published after 8pm Eastern.

import { splitStega } from './preview-stega.ts';

export const CHURCH_TZ = 'America/Indiana/Indianapolis';

/** The calendar day `iso` falls on in Muncie, as a Date at 00:00 UTC. */
export function localDay(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHURCH_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

/** The first Sunday on or after the day the post was published. */
export function sundayOf(iso: string | null | undefined): Date | null {
  const d = localDay(iso);
  if (!d) return null;
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  return d;
}

/** A day from localDay/sundayOf, printed as that calendar day. */
export function formatDay(
  d: Date,
  opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' },
): string {
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
}

/** YYYY-MM-DD of a day from localDay/sundayOf (for datetime attributes and tests). */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const BOOKS =
  '(?:Genesis|Gen\\.?|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|[12] ?Samuel|[12] ?Kings|' +
  '[12] ?Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Ps\\.?|Proverbs|Ecclesiastes|Eccl\\.?|' +
  'Song of (?:Songs|Solomon)|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|' +
  'Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mt\\.?|Mark|Luke|John|Acts|Romans|' +
  '[12] ?Corinthians|Galatians|Ephesians|Eph\\.?|Philippians|Colossians|[12] ?Thessalonians|[12] ?Timothy|' +
  'Titus|Philemon|Hebrews|James|[12] ?Peter|[123] ?John|Jude|Revelation)';

/** Book chapter:verse, with an optional range and an optional cross-chapter end. */
export const SCRIPTURE_REF = new RegExp(
  `(?<![\\w])(${BOOKS} \\d+:\\d+(?:[-–]\\d+)?(?::\\d+)?(?:[-–]\\d+)?)`,
);

const SERIES = /(?:of|in) (?:our|FBCM\W?s|the) [“"]?([A-Z][^.,"”]{3,40}?)[”"]? (?:sermon )?series/;

const cleaned = (text: string) => splitStega(String(text ?? '')).cleaned;

/** The first scripture reference in `text`, or ''. */
export function readingOf(text: string | null | undefined): string {
  if (!text) return '';
  return cleaned(text).match(SCRIPTURE_REF)?.[1] ?? '';
}

/** The sermon series named in `text` ("...of our Kingdom Family Values series"), or ''. */
export function seriesOf(text: string | null | undefined): string {
  if (!text) return '';
  return cleaned(text).match(SERIES)?.[1]?.trim() ?? '';
}
