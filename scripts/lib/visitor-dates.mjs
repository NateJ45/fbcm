// scripts/lib/visitor-dates.mjs
//
// WHICH MONTH AND YEAR EACH ISSUE OF THE VISITOR IS (2026-09-24,
// feat/the-visitor). Pure functions, unit-tested in visitor-dates.test.mjs, used
// by scripts/pages/visitor.mjs when it seeds the /visitor page.
//
// Three sources, each read out of something the church itself made, never
// typed here (CLAUDE.md rule 15):
//
//   1. THE BUTTON. The Wix capture records each issue's MONTH ("December") but
//      not its year: the years were headings in a Wix widget and the
//      association did not survive the capture. One button ("Download Latest
//      Issue") names no month at all.
//   2. THE FILE'S BUILD DATE. The PDF's own /CreationDate, snapped to the
//      nearest occurrence of the button's month (a January issue built on
//      2020-12-30 is January 2021). This was blog.mjs's rule; it moved here with
//      the list.
//   3. THE COVER. The month and year printed in the masthead on page 1
//      ("VOLUME 76 // ISSUE 2 // JUNE 2022", "The Visitor JANUARY 2020"), read
//      with pdfjs and letter-spacing collapsed. The first month-and-year on the
//      page is taken, which is the masthead on every issue measured.
//
// HOW THEY COMBINE (resolveIssueDate). The button's month is the church's own
// label for the file, so it wins when it names one; the cover then supplies the
// YEAR when it agrees on the month (it is printed, not inferred), and the build
// date is the fallback. When the cover names a DIFFERENT month the button keeps
// its month, the build-date year is used, and the disagreement is returned as a
// `conflict` for the confirm list. When the button names no month (the latest
// issue) or the file has no build date (one June), the cover alone dates it,
// and if the cover says nothing either the issue is not given a date at all.

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * The capture spells two Februaries "Feburary". That is a typo in a button
 * label, not a word of the church's own prose, so it is corrected here and
 * declared in visitor.mjs's `edits`.
 */
export const SPELLING = { Feburary: 'February' };

/** The month index (0-11) a button's text names, or -1 when it names none. */
export function monthIndexOf(text) {
  const t = String(text ?? '').trim();
  return MONTHS.indexOf(SPELLING[t] ?? t);
}

/**
 * The PDF's own /CreationDate as { year, month } (month 0-11), or null. Takes
 * the file's bytes (a Buffer or Uint8Array) so the caller owns the reading.
 */
export function pdfCreated(bytes) {
  const raw = Buffer.from(bytes).toString('latin1');
  const m = raw.match(/\/CreationDate\s*\(D:(\d{4})(\d{2})/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
}

/**
 * The year an issue named `monthIndex` belongs to, given the date its PDF was
 * built: whichever occurrence of that month sits closest to the build date.
 */
export function issueYear(monthIndex, created) {
  if (!created || monthIndex < 0) return undefined;
  const candidates = [created.year - 1, created.year, created.year + 1];
  let best = candidates[1];
  let bestGap = Infinity;
  for (const year of candidates) {
    const gap = Math.abs((year - created.year) * 12 + (monthIndex - created.month));
    if (gap < bestGap) {
      bestGap = gap;
      best = year;
    }
  }
  return best;
}

const MONTH_RUN = new RegExp(
  `(${MONTHS.map((m) => m.toUpperCase()).join('|')})((?:19|20)[0-9]{2})`,
);

/**
 * The month and year printed on a cover, from page 1's text, or null. Letter-
 * spaced mastheads ("J U N E 2 0 2 2") are read by dropping everything but
 * letters and digits first, so "JUNE2022" is found whatever the typesetting.
 */
export function coverDate(pageOneText) {
  const squashed = String(pageOneText ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const m = squashed.match(MONTH_RUN);
  if (!m) return null;
  const month = MONTHS.findIndex((name) => name.toUpperCase() === m[1]);
  return { month, year: Number(m[2]) };
}

/**
 * One issue's month and year from its three sources.
 *
 * @param {{ named: number, created: {year:number,month:number}|null, cover: {year:number,month:number}|null }} s
 * @returns {{ month?: number, year?: number, basis: string, conflict?: string }}
 */
export function resolveIssueDate({ named, created, cover }) {
  if (named >= 0) {
    if (cover && cover.month === named) {
      const fromBuild = issueYear(named, created);
      return {
        month: named,
        year: cover.year,
        basis: 'button month, cover year',
        ...(fromBuild !== undefined && fromBuild !== cover.year
          ? {
              conflict: `the cover says ${MONTHS[named]} ${cover.year}, the file's build date suggests ${fromBuild}; the cover's year is used`,
            }
          : {}),
      };
    }
    const year = issueYear(named, created);
    const conflict = cover
      ? `the button says ${MONTHS[named]}, page 1 prints ${MONTHS[cover.month]} ${cover.year}; the button's month is kept`
      : undefined;
    if (year !== undefined) {
      return {
        month: named,
        year,
        basis: 'button month, build-date year',
        ...(conflict ? { conflict } : {}),
      };
    }
    return { month: named, basis: 'button month, no year', ...(conflict ? { conflict } : {}) };
  }
  if (cover) return { month: cover.month, year: cover.year, basis: 'cover month and year' };
  return { basis: 'undated' };
}
