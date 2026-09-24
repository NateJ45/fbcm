// Safe to edit by hand
// scaffold-file: church
// The building band's dated list (2026-09-23, the Home identity pass): the
// dates an editor types on a heritageBandSection, made ready to draw.
//
// THE LIST ENDS IN THE PRESENT, AND THE PRESENT IS DERIVED (CLAUDE.md rule
// 15). An editor ticks "This year" on the last date to say what the church is
// doing now; its year is never typed, it is the year the site was built, so
// it cannot go stale on 1 January. A year typed on that entry anyway is
// replaced. Only one entry can be the present: when more than one is ticked
// the LAST one keeps the flag and the others become ordinary dates with the
// year they were typed with.
//
// Entries with no text are dropped (a date with nothing beside it is not a
// designed state). The test is made on the stega-CLEANED text, because in the
// preview an empty string still carries invisible markers that a trim would
// not remove (the preview rules in CLAUDE.md); the raw strings are what is
// returned, so click-to-edit keeps working.
import { splitStega } from './preview-stega.ts';

export interface HeritageDateInput {
  year?: string | null;
  text?: string | null;
  now?: boolean | null;
}

export interface HeritageDate {
  year: string;
  text: string;
  now: boolean;
}

const clean = (s: unknown): string => (typeof s === 'string' ? splitStega(s).cleaned.trim() : '');

export function heritageDates(
  dates: ReadonlyArray<HeritageDateInput | null | undefined> | null | undefined,
  buildDate: Date,
): HeritageDate[] {
  const kept = (dates ?? []).filter((d): d is HeritageDateInput => !!d && clean(d.text).length > 0);
  let lastNow = -1;
  kept.forEach((d, i) => {
    if (d.now === true) lastNow = i;
  });
  const thisYear = String(buildDate.getUTCFullYear());
  return kept.map((d, i) => {
    const now = i === lastNow;
    return {
      year: now ? thisYear : typeof d.year === 'string' ? d.year : '',
      text: d.text as string,
      now,
    };
  });
}

/**
 * The large pair of years set above the heading ("1859 & 1929"): the first
 * and the last dates that are NOT the present, by their cleaned year, with
 * blanks skipped and never the same year twice. One dated entry gives one
 * year; none gives an empty list, and the band then draws no pair.
 *
 * A RANGE gives its outer year (2026-09-23): the pair is set poster-size, so
 * "1859 to 1862 & 1921 to 1929" would stack into six lines. The first entry
 * gives its first four-digit year and the last entry its last; a year with no
 * four-digit number in it is used as typed.
 */
const outerYear = (y: string, end: 'first' | 'last'): string => {
  const found = y.match(/\d{4}/g);
  if (!found) return y;
  return end === 'first' ? found[0] : found[found.length - 1];
};

export function heritageBookends(dates: ReadonlyArray<HeritageDate>): string[] {
  const years = dates
    .filter((d) => !d.now)
    .map((d) => clean(d.year))
    .filter((y) => y.length > 0);
  if (years.length === 0) return [];
  const first = outerYear(years[0], 'first');
  const last = outerYear(years[years.length - 1], 'last');
  return first === last ? [first] : [first, last];
}
