// Safe to edit by hand
import { splitStega } from './preview-stega.ts';

// The one heading grammar for a church band's h2 (CLAUDE.md rule 17,
// 2026-09-23, the Home identity pass): Castoro Titling at text-h2, one weight.
// What to Expect (SundayTimes), Church Blog (DynamicList), Give (GiveBand),
// the arched-door link cards (LinkCards), Our Building (HeritageBand, via
// SectionHeading face="display") and Who We Are's Watchword, Goals, Pledge and
// Letter bands all read it from here, so a band cannot drift
// to its own size or face without changing the string every other band uses.
// Colour is NOT part of it: each band sets its own ink for its own ground.
export const H2_DISPLAY = 'font-display text-h2 leading-[1.02] font-normal';

// ── Nothing breaks mid-word (rollout rule 9, 2026-09-24) ─────────────────────
// A heading's size is capped so its LONGEST word fits the heading's own width:
// the heading is an inline-size container (`.h-fit`) and its text sits in one
// block span (`.h-fit-in`) whose font-size is
//   min(1em, 100cqi / (--h-chars * --h-em))
// --h-chars is the longest word's length, counted here on the stega-cleaned
// text (a hyphen is a fair break, so it splits words); --h-em is the face's
// widest average advance per character, measured in Chromium at 1440:
// Castoro Titling capitals about 0.78em (0.81 for M/W-heavy words), so 0.82 is
// used; the Castoro reading face about 0.55em. The container is the heading
// ITSELF, never an ancestor, so a nested heading's cqi is never redefined.

/** The length of the longest word in a heading, on its cleaned text. */
export function longestWord(text: string | null | undefined): number {
  const words = splitStega(text ?? '')
    .cleaned.split(/[\s\-\u2010\u2011\u2013\u2014/]+/)
    .map((w) => w.replace(/[.,:;!?'"\u2018\u2019\u201C\u201D()[\]]/g, ''))
    .filter(Boolean);
  return words.reduce((n, w) => Math.max(n, [...w].length), 0);
}

export const EM_DISPLAY = 0.82;
export const EM_BODY = 0.56;

/** The inline style for a fitted heading: its longest word and the face's em per character. */
export function headingFit(
  text: string | null | undefined,
  face: 'display' | 'body' = 'display',
): string {
  const n = Math.max(1, longestWord(text));
  return `--h-chars:${n};--h-em:${face === 'display' ? EM_DISPLAY : EM_BODY}`;
}
