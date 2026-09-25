// Safe to edit by hand
// Which sermon the home hero's dated line names for the coming Sunday
// (2026-09-24, `feat/this-sunday-youtube`). Two sources, in this order:
//
//   1. a sermon preview post written for that Sunday (src/lib/sunday-sermon.ts),
//      linking to the post: the church's own words, when it writes them;
//   2. else the coming Sunday's scheduled broadcast in the YouTube feed
//      (upcomingBroadcast in src/lib/youtube-feed.ts), its sermon title and
//      reading, linking to the watch page, which is where the stream plays;
//   3. else nothing, and the line reads exactly as it did before either
//      existed ("This Sunday, September 27 · Worship at 10:45 am").
//
// Both sources are picked for the same Sunday from the same build moment,
// and both come out as a SundaySermon, so the hero, the length rules and the
// upgrade script in BaseLayout (which drops the sermon once the page outlives
// its Sunday, whatever the source) never need to know which one it was.
// Nothing here is typed by an editor: the sermon, the reading and the Sunday
// are all derived (CLAUDE.md rule 15).

import { sermonParts, type SundaySermon } from './live-sunday.ts';
import type { UpcomingBroadcast } from './youtube-feed.ts';

/** The broadcast shaped for the line, with the same length rules as a preview. */
export function sermonFromBroadcast(b: UpcomingBroadcast | null | undefined): SundaySermon | null {
  if (!b) return null;
  const parts = sermonParts(b.title, b.reading);
  if (!parts) return null;
  return { sunday: b.sunday, href: b.watchUrl, ...parts };
}

/**
 * The line's sermon: the preview when there is one for `sunday`, else the
 * broadcast for `sunday`, else null. `sunday` is the coming Sunday as of the
 * build; a source for any other Sunday is ignored rather than trusted.
 */
export function thisSundaySermon(
  sunday: string | null,
  preview: SundaySermon | null | undefined,
  broadcast: UpcomingBroadcast | null | undefined,
): SundaySermon | null {
  if (!sunday) return null;
  if (preview && preview.sunday === sunday) return preview;
  if (broadcast && broadcast.sunday === sunday) return sermonFromBroadcast(broadcast);
  return null;
}

/** Whether the line's link leaves the site (the YouTube watch page). */
export const sermonIsExternal = (s: Pick<SundaySermon, 'href'>): boolean =>
  /^https?:\/\//i.test(s.href);
