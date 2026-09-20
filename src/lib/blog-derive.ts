// scaffold-file: journal
// The blog archive's derivations. Nothing here touches Sanity or the DOM, so
// every rule that decides what a visitor sees on /blog is unit-tested.
//
// THE RULE THIS FILE EXISTS TO KEEP. 106 of the 142 imported posts are weekly
// sermon previews that go stale by Monday; the other 36 are the ones worth
// arriving at. Which pile a post is in is a fact about its CATEGORY, and it is
// worked out here every build. A stored `journalEntry.featured` boolean used
// to sit right next to it in the schema; it was retired in plan 2c (task 2)
// because a second source of truth for "which posts matter" is the one that
// goes stale (CLAUDE.md rule 15). The archive never read it for ordering
// even before the field was removed.
//
// STEGA. Every string below that is COMPARED (a category title, a tag) is
// cleaned first. In the Studio preview each of those strings carries about a
// kilobyte of invisible U+200B/U+200C/U+200D/U+FEFF markers, so `a === b` is
// false on two strings that read identically and the durable split silently
// inverts, in the preview only, where nobody has a baseline to compare against.

import { isSermonPreview } from './import-post.ts';
import { weekOfLabel } from './church-derive.ts';
import { splitStega } from './preview-stega.ts';

// The one implementation, re-exported rather than copied: the import script and
// the archive have to agree about what a sermon preview is, forever.
export { isSermonPreview };

/** One category as the card and detail projections in queries.ts hand it over. */
export interface BlogCategory {
  _id?: string;
  title?: string | null;
  slug?: { current?: string | null } | null;
  description?: string | null;
}

/**
 * The shape every route here needs off a `journalEntry`. Deliberately a subset:
 * the card projection and the full-document projection both satisfy it, so one
 * set of helpers serves the index, the pagers, the category and tag routes and
 * the post page.
 */
export interface BlogEntry {
  _id?: string;
  title?: string | null;
  slug?: { current?: string | null } | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  coverImage?: unknown;
  categories?: BlogCategory[] | null;
  tags?: string[] | null;
}

/**
 * Posts per page, everywhere. Spec 5.10 asks for 12, and it lives here rather
 * than in each of the four list routes so /blog/page/2 can never start at a
 * different post than /blog page 1 stopped at.
 */
export const PER_PAGE = 12;

/** Cleaned of any stega payload, so it can be compared or measured. */
export function clean(value: string | null | undefined): string {
  if (!value) return '';
  return splitStega(String(value)).cleaned;
}

/** Every name this entry's categories go by: the title, and the slug behind it. */
function categoryNames(entry: BlogEntry): string[] {
  const out: string[] = [];
  for (const c of entry.categories ?? []) {
    const title = clean(c?.title);
    if (title) out.push(title);
    const slug = clean(c?.slug?.current);
    // "sermon-preview" is the slug form of "Sermon Preview"; isSermonPreview
    // matches on the name, so the slug is offered with its hyphens undone
    // rather than given a second matching rule of its own.
    if (slug) out.push(slug.replace(/-/g, ' '));
  }
  return out;
}

/** Is this post one of the weekly sermon previews? Derived from its categories. */
export function entryIsSermonPreview(entry: BlogEntry): boolean {
  return isSermonPreview(categoryNames(entry));
}

/**
 * The two piles, each keeping the order it arrived in (the queries hand posts
 * over newest first, and this is a partition, never a re-sort).
 */
export function splitDurable<T extends BlogEntry>(
  entries: readonly T[],
): {
  durable: T[];
  previews: T[];
} {
  const durable: T[] = [];
  const previews: T[] = [];
  for (const e of entries ?? []) (entryIsSermonPreview(e) ? previews : durable).push(e);
  return { durable, previews };
}

/**
 * One page of a list. 1-based, and an empty list is ONE page rather than zero,
 * because /blog has to exist and say so even with nothing on it. A page number
 * off either end is clamped rather than rejected: the routes build only real
 * page numbers, so a clamp here is a belt for hand-typed URLs.
 */
export function paginate<T>(
  items: readonly T[],
  size: number,
  page: number,
): { items: T[]; page: number; pages: number } {
  const all = items ?? [];
  const per = Math.max(1, Math.floor(size));
  const pages = Math.max(1, Math.ceil(all.length / per));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: all.slice((current - 1) * per, current * per), page: current, pages };
}

/** Cleaned, lower-cased tags, de-duplicated. Comparison keys, never display text. */
function tagKeys(entry: BlogEntry): Set<string> {
  const out = new Set<string>();
  for (const t of entry.tags ?? []) {
    const k = clean(t).trim().toLowerCase();
    if (k) out.add(k);
  }
  return out;
}

function publishedTime(entry: BlogEntry): number {
  const t = Date.parse(String(entry.publishedAt ?? ''));
  return Number.isNaN(t) ? -Infinity : t;
}

/**
 * "More from this series": the entries sharing the most tags with `entry`,
 * newest first inside an equal share count, excluding `entry` itself.
 *
 * Empty when nothing shares a tag. That is the point of it: a series band that
 * falls back to "here are three recent posts" is a lie about a relationship,
 * and the reader cannot tell the two apart.
 */
export function seriesByTag<T extends BlogEntry>(
  entry: BlogEntry,
  all: readonly T[],
  limit = 3,
): T[] {
  const mine = tagKeys(entry);
  if (mine.size === 0) return [];
  const id = entry._id ?? null;
  const slug = clean(entry.slug?.current);

  const scored: Array<{ entry: T; shared: number; at: number }> = [];
  for (const candidate of all ?? []) {
    const sameDoc =
      id && candidate._id ? candidate._id === id : clean(candidate.slug?.current) === slug;
    if (sameDoc) continue;
    let shared = 0;
    for (const k of tagKeys(candidate)) if (mine.has(k)) shared += 1;
    if (shared > 0) scored.push({ entry: candidate, shared, at: publishedTime(candidate) });
  }

  scored.sort((a, b) => b.shared - a.shared || b.at - a.at);
  return scored.slice(0, Math.max(0, limit)).map((s) => s.entry);
}

/** One tag, its URL slug, and every post carrying it. */
export interface TagGroup<T extends BlogEntry = BlogEntry> {
  /** The URL segment: /blog/tag/<slug>/ */
  slug: string;
  /** The tag as the church typed it, the first spelling seen (newest post wins). */
  label: string;
  entries: T[];
}

/**
 * Every tag across the archive, grouped by its URL slug, each group keeping the
 * input's newest-first order. 217 of them on this site, which is why they are a
 * route each and not a cloud on the index.
 *
 * Grouped by SLUG rather than by the raw string on purpose: "Holidays" and
 * "holidays" are one page, and two spellings that slugify the same cannot build
 * two routes with the same path (which is a build error, not a soft failure).
 */
export function tagIndex<T extends BlogEntry>(
  entries: readonly T[],
  slugify: (value: string) => string,
): TagGroup<T>[] {
  const groups = new Map<string, TagGroup<T>>();
  for (const entry of entries ?? []) {
    const seen = new Set<string>();
    for (const raw of entry.tags ?? []) {
      const label = clean(raw).trim();
      if (!label) continue;
      const slug = slugify(label);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const group = groups.get(slug);
      if (group) group.entries.push(entry);
      else groups.set(slug, { slug, label, entries: [entry] });
    }
  }
  return [...groups.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }),
  );
}

/**
 * "Sermon preview, week of January 17, 2024" for the eyebrow on a preview card
 * and on the preview's own page. The date is the post's own publish date; the
 * eyebrow does not try to name the Sunday, because nothing in the data says
 * which Sunday a given preview was written for.
 */
export function weekOfEyebrow(publishedAt: string | null | undefined): string {
  return weekOfLabel(clean(publishedAt));
}
