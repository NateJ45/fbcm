// src/lib/visitor-band.ts
// Safe to edit by hand
// scaffold-file: church
// The Visitor's band on the home page, the words and the ground (2026-09-25,
// feat/visitor-band). Pure, so every rule is unit-tested (visitor-band.test.ts);
// VisitorBand.astro draws what this returns.
//
// NOTHING HERE IS A SECOND SOURCE OF TRUTH (CLAUDE.md rule 15):
//
//   - THE YEAR THE VISITOR BEGAN lives in ONE place, the /visitor page's own
//     short line over its heading, "Our church newsletter since 1946" (the
//     issue list's eyebrow, scripts/pages/visitor.mjs). The build step
//     (scripts/visitor-covers.mjs) reads that line and `sinceYear` finds the
//     year in it, so the church edits the year on /visitor and the home band
//     follows at the next build. A line with no year gives no year, and then
//     the band says nothing about age rather than guess.
//   - THE AGE ("80 years in print") is the build's year on the church's clock
//     minus that year, never typed. It changes on the first build of each
//     January.
//   - THE INTRO is the church's own sentence from its publications page
//     (scripts/data/pages/publications.txt), edited only for the web: the
//     /visitor page carries no intro of its own (its search description is a
//     rewrite, not the church's words), so it is a code constant here, and
//     the edit is listed for approval in scripts/pages/visitor.mjs. The
//     church's two other sentences, "It has been published since 1946. It now
//     publishes quarterly.", are carried by the eyebrow, "Since 1946 ·
//     Quarterly", with the year from the page.
//
// THE GROUND is derived from the band directly above, so the Visitor never
// matches a neighbour and the page keeps alternating dark and light (rollout
// rule 11): indigo, the colour of /visitor's own opener, under a light band;
// paper under a dark one. On Home that means paper under Last Sunday (indigo)
// when the feed gave a recording, and indigo under Our Building (paper) when it
// did not. Below it is the taupe blog band (or the gold give band), which
// neither ground matches.
import { splitStega } from './preview-stega.ts';
import { CHURCH_TZ } from './church-schema.ts';
import { bandFamilyOfType } from './rich-ground.ts';

/** The church's own description of The Visitor, edited for the web only. */
export const VISITOR_INTRO =
  'Our church newsletter, filled with features, information about church life, and articles from both church members and pastoral staff.';

/** "It now publishes quarterly." in the church's own sentence, as a tag. */
export const VISITOR_CADENCE = 'Quarterly';

/** The earliest year a "since" line may name; anything before is a typo. */
const EARLIEST = 1800;

/**
 * The year a line like "Our church newsletter since 1946" names, or null. The
 * year must follow the word "since", so a line that merely mentions a year is
 * not read as the start of the newsletter. Stega aside (the preview).
 */
export function sinceYear(line: string | null | undefined, now: Date = new Date()): number | null {
  const text = splitStega(String(line ?? '')).cleaned;
  const m = text.match(/\bsince\s+(\d{4})\b/i);
  if (!m) return null;
  const year = Number(m[1]);
  return year >= EARLIEST && year <= churchYear(now) ? year : null;
}

/** The calendar year at `now` on the church's clock. */
export function churchYear(now: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: CHURCH_TZ, year: 'numeric' }).format(now),
  );
}

/** Whole years from `since` to the build's year, or null (no year, or not yet one). */
export function yearsInPrint(since: number | null | undefined, now: Date): number | null {
  if (typeof since !== 'number' || !Number.isInteger(since)) return null;
  const years = churchYear(now) - since;
  return years >= 1 ? years : null;
}

/** "80 years in print", or '' when the age is not known. */
export function ageLine(since: number | null | undefined, now: Date): string {
  const years = yearsInPrint(since, now);
  if (years === null) return '';
  return `${years} ${years === 1 ? 'year' : 'years'} in print`;
}

/** "Since 1946 · Quarterly", or "Quarterly" when the year is not known. */
export function bandEyebrow(since: number | null | undefined): string {
  return typeof since === 'number' ? `Since ${since} · ${VISITOR_CADENCE}` : VISITOR_CADENCE;
}

/** "The September 2026 issue" */
export function issueLine(label: string): string {
  return `The ${label} issue`;
}

export type VisitorGround = 'indigo' | 'paper';

/**
 * True when the page-builder row of this type draws a dark ground. The
 * family comes from rich-ground.ts, the one table of what each church band
 * paints; the heritage band is the exception, because only its opener form
 * (the h1 at the top of /history) is brown, and an opener never sits above a
 * code-drawn band. Its dated building form, the one Home carries, is paper.
 */
export function isDarkRow(type: string | null | undefined): boolean {
  if (!type || type === 'heritageBandSection') return false;
  const family = bandFamilyOfType(type);
  return family === 'indigo' || family === 'brown';
}

/** The band's ground from the band above it: indigo under light, paper under dark. */
export function visitorGround(aboveIsDark: boolean): VisitorGround {
  return aboveIsDark ? 'paper' : 'indigo';
}
