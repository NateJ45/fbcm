// scaffold-file: journal
// Safe to edit by hand
// Which sermon preview, if any, is for the coming Sunday (2026-09-24).
//
// The home hero's dated line names this Sunday's sermon when the church has
// posted its preview. Nothing about it is typed: the Sunday follows from the
// post's publish date (sundayOf), the reading from its opening paragraphs
// (readingOf), whether it is a preview at all from its category
// (entryIsSermonPreview), and the title is the post's own (CLAUDE.md rule
// 15). Decided at BUILD time on the church's calendar
// (America/Indiana/Indianapolis); the upgrade script in BaseLayout drops the
// sermon again if the page outlives its Sunday (live-sunday.ts).
//
// NEVER GUESS. A Sunday with no preview written for it returns null and the
// line stays exactly as it was before this existed.

import { entryIsSermonPreview, type RegisterEntry } from './blog-derive.ts';
import { isoDay, localDay, readingOf, sundayOf } from './sermon-derive.ts';
import { splitStega } from './preview-stega.ts';
import { sermonParts, type SundaySermon } from './live-sunday.ts';

/** The coming Sunday on the church's calendar; today when today is Sunday. */
export function upcomingSunday(now: Date): string | null {
  const d = localDay(now.toISOString());
  if (!d) return null;
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  return isoDay(d);
}

const clean = (v: string | null | undefined) => splitStega(String(v ?? '')).cleaned.trim();

/** The newest sermon preview written for the Sunday `target` (YYYY-MM-DD), or null. */
function newestPreviewFor(
  entries: readonly RegisterEntry[] | null | undefined,
  target: string,
): RegisterEntry | null {
  let best: RegisterEntry | null = null;
  let bestAt = -Infinity;
  for (const e of entries ?? []) {
    if (!entryIsSermonPreview(e)) continue;
    const published = clean(e.publishedAt);
    const sunday = sundayOf(published);
    if (!sunday || isoDay(sunday) !== target) continue;
    const at = new Date(published).getTime();
    if (at > bestAt) {
      best = e;
      bestAt = at;
    }
  }
  return clean(best?.slug?.current) ? best : null;
}

/**
 * The newest sermon preview whose Sunday is the coming Sunday, shaped for
 * the hero, or null. Entries arrive in any order; the newest publish wins
 * when two previews name the same Sunday.
 */
export function sermonForUpcomingSunday(
  entries: readonly RegisterEntry[] | null | undefined,
  now: Date,
): SundaySermon | null {
  const target = upcomingSunday(now);
  if (!target) return null;
  const best = newestPreviewFor(entries, target);
  if (!best) return null;
  const parts = sermonParts(clean(best.title), readingOf(best.opening));
  if (!parts) return null;
  return { sunday: target, href: `/post/${clean(best.slug?.current)}`, ...parts };
}

/** A past Sunday's preview, whole, for the home page's "Last Sunday" band. */
export interface SundayPreview {
  href: string;
  /** The post's own title, stega-clean and unshortened. */
  title: string;
  /** The first reading in its opening paragraphs, or ''. */
  reading: string;
}

/**
 * The sermon preview the church posted for the Sunday `sunday` (YYYY-MM-DD),
 * or null (2026-09-24, `feat/last-sunday`). The band pairs last Sunday's
 * recording with it when there is one; there is no other link between a
 * video and a post, so the Sunday is the join.
 */
export function previewForSunday(
  entries: readonly RegisterEntry[] | null | undefined,
  sunday: string,
): SundayPreview | null {
  const best = newestPreviewFor(entries, sunday);
  if (!best) return null;
  const title = clean(best.title);
  if (!title) return null;
  return {
    href: `/post/${clean(best.slug?.current)}`,
    title,
    reading: readingOf(best.opening),
  };
}
