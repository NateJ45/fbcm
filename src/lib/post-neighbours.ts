// scaffold-file: journal
// What a post page says about the posts around it (the journal polish,
// 2026-09-22, "P2 Bulletin"): the two doors at its foot and the rows of "More
// from this series". Worked out once per build in getStaticPaths, from the
// entries it already has plus each entry's opening text (for the reading), so
// the 142 post pages do not each re-derive the whole archive.
//
// A sermon preview's doors are its neighbours AMONG PREVIEWS, "The Sunday
// before" and "The Sunday after", each with its Sunday and reading: a reader of
// one week's preview wants the next week's, not whatever event notice was
// posted in between. Every other post has plain Older / Newer doors by date.

import { entryIsSermonPreview, clean, type BlogEntry } from './blog-derive.ts';
import { sundayOf, localDay, formatDay, readingOf } from './sermon-derive.ts';

export interface Door {
  /** "The Sunday before", "Older post", ... */
  label: string;
  title: string;
  slug: string;
  /** Sunday + reading for a preview, the date for anything else. */
  sub: string;
}

export interface Doors {
  /** Left door: the earlier post. */
  before: Door | null;
  /** Right door: the later post. */
  after: Door | null;
}

export interface SeriesRow {
  title: string;
  slug: string;
  excerpt: string;
  /** "Sunday, Jun 2, 2024" for a preview, "May 28, 2024" otherwise. */
  date: string;
  /** The reading for a preview ("Sermon preview" when none is found), else the category. */
  meta: string;
}

/** Opening text by entry, for readingOf. Keyed by _id, falling back to slug. */
export type OpeningText = (entry: BlogEntry) => string;

const sameEntry = (a: BlogEntry, b: BlogEntry): boolean =>
  a._id && b._id ? a._id === b._id : clean(a.slug?.current) === clean(b.slug?.current);

function previewSub(entry: BlogEntry, opening: OpeningText): string {
  const sunday = sundayOf(clean(entry.publishedAt));
  const reading = readingOf(opening(entry));
  return [sunday ? formatDay(sunday) : '', reading].filter(Boolean).join(' · ');
}

function plainDate(entry: BlogEntry): string {
  const day = localDay(clean(entry.publishedAt));
  return day ? formatDay(day) : '';
}

/**
 * The two doors for `entry`. `all` is newest first, the order every journal
 * query hands entries over in; the earlier post is the one after it.
 */
export function doorsFor(entry: BlogEntry, all: readonly BlogEntry[], opening: OpeningText): Doors {
  const preview = entryIsSermonPreview(entry);
  const pool = preview ? all.filter((e) => entryIsSermonPreview(e)) : [...all];
  const i = pool.findIndex((e) => sameEntry(e, entry));
  if (i < 0) return { before: null, after: null };
  const earlier = pool[i + 1] ?? null;
  const later = pool[i - 1] ?? null;
  const door = (e: BlogEntry | null, label: string): Door | null =>
    e
      ? {
          label,
          title: clean(e.title),
          slug: clean(e.slug?.current),
          sub: preview ? previewSub(e, opening) : plainDate(e),
        }
      : null;
  return preview
    ? { before: door(earlier, 'The Sunday before'), after: door(later, 'The Sunday after') }
    : { before: door(earlier, 'Older post'), after: door(later, 'Newer post') };
}

/** One "More from this series" row. */
export function seriesRowOf(entry: BlogEntry, opening: OpeningText): SeriesRow {
  const preview = entryIsSermonPreview(entry);
  const sunday = preview ? sundayOf(clean(entry.publishedAt)) : null;
  return {
    title: clean(entry.title),
    slug: clean(entry.slug?.current),
    excerpt: clean(entry.excerpt),
    date: sunday
      ? `Sunday, ${formatDay(sunday, { month: 'short', day: 'numeric', year: 'numeric' })}`
      : plainDate(entry),
    meta: preview
      ? readingOf(opening(entry)) || 'Sermon preview'
      : clean(entry.categories?.[0]?.title),
  };
}
