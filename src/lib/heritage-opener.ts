// Safe to edit by hand
// scaffold-file: church
// The span over a page-opening heritage band (2026-09-24, the History identity
// pass): the founding year and the present, set large above the page's h1.
//
// BOTH YEARS ARE DERIVED, NEITHER IS TYPED (CLAUDE.md rule 15). The first is
// the first four-digit year in the marker of the page's first timeline row
// (SectionRenderer already hands that row to the band as `years[0]`), so the
// span and the timeline under it cannot disagree. The second is the year the
// site was built, read in UTC like heritage-dates.ts, so it moves on by itself
// on 1 January and 2026 is never written into the page.
//
// The marker is cleaned of its stega payload BEFORE it is searched: in the
// preview the marker carries invisible characters, and the digits must be
// found in what the editor typed, not in the payload.
import { splitStega } from './preview-stega.ts';

/**
 * [first, now] when the first timeline marker holds a year before the build
 * year; [first] when it holds the build year itself (nothing to span); [] when
 * there is no marker or no four-digit year in it, and the band then draws no
 * span at all.
 */
export function openerSpan(firstMarker: unknown, buildDate: Date): string[] {
  const cleaned = typeof firstMarker === 'string' ? splitStega(firstMarker).cleaned : '';
  const found = cleaned.match(/\d{4}/);
  if (!found) return [];
  const first = found[0];
  const now = String(buildDate.getUTCFullYear());
  return Number(first) < Number(now) ? [first, now] : [first];
}
