// scaffold-file: journal
// Safe to edit by hand
// The foot of one post page: its two doors, its "More from this series" rows
// and where its reading lands on /blog/scripture. ONE derivation for both
// places a post is drawn (2026-09-26): the static route's getStaticPaths
// (src/pages/post/[slug].astro), which works it out once per post at build
// time, and the draft preview (src/pages/preview/post/[slug].astro), which
// works it out per request from the draft perspective. Sharing it is what
// keeps the preview's foot from drifting away from the live one.
//
// A brand-new post that is not in `all` (an unpublished draft read through a
// list that does not hold it) gets no doors and whatever series rows its tags
// earn; nothing here assumes the post is in the list.

import { seriesByTag, type BlogEntry, type RegisterEntry } from './blog-derive.ts';
import { openingText } from './post-body.ts';
import {
  doorsFor,
  seriesRowOf,
  type Doors,
  type OpeningText,
  type SeriesRow,
} from './post-neighbours.ts';
import { buildScriptureIndex, scriptureRowsOf } from './scripture-index.ts';

export interface PostFoot {
  doors: Doors;
  series: SeriesRow[];
  /** The /blog/scripture anchor for this post's reading, or ''. */
  readingAnchor: string;
}

/** One post's opening blocks, as JOURNAL_HEADS_QUERY hands them over. */
export interface PostHead {
  _id?: string;
  head?: unknown[];
}

/** The opening text of each post by id, for the reading a door or series row prints. */
export function openingLookup(heads: readonly PostHead[] | null | undefined): OpeningText {
  const byId = new Map<string, string>();
  for (const h of heads ?? []) {
    if (h?._id) byId.set(h._id, openingText(h.head ?? []));
  }
  return (e: BlogEntry) => byId.get(e._id ?? '') ?? '';
}

/**
 * The feet of every post in `all`, worked out together: the scripture index is
 * built once from the same entries the index page builds from, so the Reading
 * row can only link to a book heading that page really has.
 */
export function postFeet(
  all: readonly BlogEntry[],
  heads: readonly PostHead[] | null | undefined,
): (entry: BlogEntry) => PostFoot {
  const opening = openingLookup(heads);
  const scripture = buildScriptureIndex(scriptureRowsOf(all as RegisterEntry[]));
  return (entry) => ({
    doors: doorsFor(entry, all, opening),
    // "More from this series" from the shared tag vocabulary (seriesByTag).
    series: seriesByTag(entry, all, 3).map((s) => seriesRowOf(s, opening)),
    readingAnchor: scripture.anchorByPost.get(entry._id ?? '') ?? '',
  });
}
