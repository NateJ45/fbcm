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
import { splitStega } from './preview-stega.ts';
import { localDay, sundayOf, formatDay, isoDay, readingOf } from './sermon-derive.ts';

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

const MONTHS = [
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
 * "Sermon preview, week of January 17, 2024". Falls back to the bare eyebrow.
 *
 * US date order (month first), because every other date on this site is
 * written that way: JournalCard and the post header both format with
 * `toLocaleDateString('en-US')`. It read "15 January 2024" while nothing
 * imported it, which is the moment to fix it rather than ship two orders.
 *
 * Lived in church-derive.ts until 2026-09-23: it was the one function in that
 * file a non-church consumer (this one) needed, and importing across a
 * scaffold-file boundary meant `npm run scaffold -- --remove church` broke
 * the blog archive even though the blog itself is the `journal` capability.
 * Moved here so weekOfEyebrow only ever depends on its own capability.
 */
export function weekOfLabel(publishedAt: string): string {
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return 'Sermon preview';
  return `Sermon preview, week of ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
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

// ── The register (I1 Register, the journal pass, 2026-09-22) ────────────────
// Everything the index and the archives say about a post beyond its title is
// derived below from the post's own date, category, tags and opening text.
// None of it is a field (CLAUDE.md rule 15), so none of it can drift.

/** A card entry plus the two fields the register reads (queries.ts). */
export interface RegisterEntry extends BlogEntry {
  author?: string | null;
  /** The first few body blocks, flattened: where a preview names its reading. */
  opening?: string | null;
}

/** "Sermon Preview" -> "Sermon previews", "FBCM Events" -> "Events". */
export function categoryLabel(title: string | null | undefined): string {
  const words = clean(title)
    .trim()
    .replace(/^FBCM\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  const out = words
    .map((w, i) => (i === 0 || (w.length > 1 && w === w.toUpperCase()) ? w : w.toLowerCase()))
    .join(' ');
  return /s$/i.test(out) ? out : `${out}s`;
}

/** The one-post form of categoryLabel: "Event", "Sermon preview". */
export function categorySingular(title: string | null | undefined): string {
  const plural = categoryLabel(title);
  return /[^s]s$/i.test(plural) ? plural.slice(0, -1) : plural;
}

/** One category filter: a built route, and how many posts it holds. */
export interface CategoryFilter {
  slug: string;
  title: string;
  label: string;
  count: number;
}

/**
 * The filter row, counted from the posts themselves rather than read off a
 * stored number, most posts first. Only a category with a slug and at least one
 * post is here, which is exactly the set /blog/category/[slug] builds.
 */
export function categoryFilters(entries: readonly BlogEntry[]): CategoryFilter[] {
  const bySlug = new Map<string, CategoryFilter>();
  for (const e of entries ?? []) {
    const seen = new Set<string>();
    for (const c of e.categories ?? []) {
      const slug = clean(c?.slug?.current).trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const found = bySlug.get(slug);
      if (found) {
        found.count += 1;
      } else {
        const title = clean(c?.title).trim() || slug;
        bySlug.set(slug, { slug, title, label: categoryLabel(title), count: 1 });
      }
    }
  }
  return [...bySlug.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'en'),
  );
}

/**
 * The newest sermon preview, when its Sunday is today or later; else null.
 * `today` is a day from localDay() (00:00 UTC on the church's calendar day).
 */
export function freshPreview<T extends BlogEntry>(entries: readonly T[], today: Date): T | null {
  let newest: T | null = null;
  for (const e of entries ?? []) {
    if (!entryIsSermonPreview(e)) continue;
    if (!newest || publishedTime(e) > publishedTime(newest)) newest = e;
  }
  if (!newest) return null;
  const sunday = sundayOf(newest.publishedAt);
  return sunday && sunday.getTime() >= today.getTime() ? newest : null;
}

const entryKey = (e: BlogEntry) => e._id ?? `slug:${clean(e.slug?.current)}`;

/**
 * "Worth coming back for": the newest `n` durable posts that are NOT already on
 * page 1 of the register, so the index never shows one post twice.
 */
export function worthComingBackFor<T extends BlogEntry>(
  entries: readonly T[],
  page1: readonly BlogEntry[],
  n = 4,
): T[] {
  const onPage1 = new Set((page1 ?? []).map(entryKey));
  return splitDurable(entries)
    .durable.filter((e) => !onPage1.has(entryKey(e)))
    .slice(0, Math.max(0, n));
}

/** What one numbered page of a list covers. */
export interface PageSpan {
  page: number;
  /** "2025", or "2025–24" (an en dash) when the page crosses a year. */
  span: string;
  /** "September 17, 2026 to January 6, 2026", for the pager's title attribute. */
  title: string;
}

/**
 * Each page's years, from the same paginate() the routes use, so the pager can
 * say which page holds 2024.
 */
export function pageYearSpans(entries: readonly BlogEntry[], perPage: number): PageSpan[] {
  if (!entries?.length) return [];
  const { pages } = paginate(entries, perPage, 1);
  const out: PageSpan[] = [];
  for (let n = 1; n <= pages; n += 1) {
    const days = paginate(entries, perPage, n)
      .items.map((e) => localDay(e.publishedAt))
      .filter((d): d is Date => d !== null);
    if (days.length === 0) {
      out.push({ page: n, span: '', title: '' });
      continue;
    }
    const first = days[0];
    const last = days[days.length - 1];
    const ya = first.getUTCFullYear();
    const yb = last.getUTCFullYear();
    out.push({
      page: n,
      span: ya === yb ? String(ya) : `${ya}–${String(yb).slice(-2)}`,
      title: `${formatDay(first)} to ${formatDay(last)}`,
    });
  }
  return out;
}

/** One link in the thin state's "Also filed under" line. */
export interface FiledUnder {
  kind: 'tag' | 'category';
  label: string;
  href: string;
  count: number;
}

/**
 * The other tags and categories on a short list's posts, most frequent first
 * (first seen wins a tie), at most `max`. `exclude` is the page's own tag or
 * category, by label or slug. Every href is a route the build makes: a tag
 * goes through the same slugify the tag route's tagIndex uses, and a category
 * that is on a post has at least one post, which is the category route's rule.
 */
export function thinStateTags(
  entries: readonly BlogEntry[],
  exclude: string | null | undefined,
  slugify: (value: string) => string,
  max = 8,
): FiledUnder[] {
  const ex = clean(exclude).trim().toLowerCase();
  const exSlug = ex ? slugify(ex) : '';
  const isExcluded = (label: string, slug: string) =>
    !!ex && (label.toLowerCase() === ex || slug === ex || slug === exSlug);

  const found = new Map<string, { item: FiledUnder; order: number }>();
  const add = (key: string, make: () => FiledUnder) => {
    const f = found.get(key);
    if (f) f.item.count += 1;
    else found.set(key, { item: make(), order: found.size });
  };

  for (const e of entries ?? []) {
    const seen = new Set<string>();
    for (const c of e.categories ?? []) {
      const slug = clean(c?.slug?.current).trim();
      const title = clean(c?.title).trim();
      if (!slug || !title || isExcluded(title, slug)) continue;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      add(key, () => ({
        kind: 'category',
        label: title,
        href: `/blog/category/${slug}/`,
        count: 1,
      }));
    }
    for (const raw of e.tags ?? []) {
      const label = clean(raw).trim();
      const slug = label ? slugify(label) : '';
      if (!slug || isExcluded(label, slug)) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      add(key, () => ({ kind: 'tag', label, href: `/blog/tag/${slug}/`, count: 1 }));
    }
  }
  return [...found.values()]
    .sort((a, b) => b.item.count - a.item.count || a.order - b.order)
    .slice(0, Math.max(0, max))
    .map((f) => f.item);
}

/** A page's posts grouped by the church-local year they were published in. */
export function groupByYear<T extends BlogEntry>(
  entries: readonly T[],
): Array<{ year: number | null; items: T[] }> {
  const groups: Array<{ year: number | null; items: T[] }> = [];
  for (const e of entries ?? []) {
    const y = localDay(e.publishedAt)?.getUTCFullYear() ?? null;
    const last = groups[groups.length - 1];
    if (last && last.year === y) last.items.push(e);
    else groups.push({ year: y, items: [e] });
  }
  return groups;
}

/** A register row's date and meta column. */
export interface RegisterMeta {
  preview: boolean;
  /** "Sunday Sep 21" on a preview, the category's singular label otherwise, or ''. */
  key: string;
  /** The reading on a preview ("Romans 8:1-11"), or ''. */
  value: string;
  /** "Sep 17": the post's own day. */
  day: string;
  /** YYYY-MM-DD of the post's own day, for <time datetime>. */
  iso: string;
}

export function registerMeta(entry: RegisterEntry): RegisterMeta {
  const d = localDay(entry.publishedAt);
  const day = d ? formatDay(d, { month: 'short', day: 'numeric' }) : '';
  const iso = d ? isoDay(d) : '';
  if (entryIsSermonPreview(entry)) {
    const sunday = sundayOf(entry.publishedAt);
    return {
      preview: true,
      key: sunday ? `Sunday ${formatDay(sunday, { month: 'short', day: 'numeric' })}` : '',
      value: readingOf(entry.opening),
      day,
      iso,
    };
  }
  const first = (entry.categories ?? []).find((c) => clean(c?.title).trim());
  return {
    preview: false,
    key: first ? categorySingular(first.title) : '',
    value: '',
    day,
    iso,
  };
}

/**
 * A post row's date as a visitor reads it ("Dec 8, 2025") and as its
 * <time datetime> carries it ("2025-12-08"), for the home page's Church Blog
 * rows (DynamicList.astro). BOTH read the calendar day in the CHURCH's zone
 * (localDay(), America/Indiana/Indianapolis), as the blog register and the
 * post page already do, so a post published at 9:30 pm in Muncie (02:30 UTC
 * the next day) is dated the day it was written. They used to disagree: the
 * label took the build machine's zone and the attribute UTC.
 */
export function rowDate(iso: string | null | undefined): string {
  const d = localDay(iso);
  return d ? formatDay(d, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/** The same church-zone day as rowDate(), as YYYY-MM-DD; undefined if none. */
export function rowDateTime(iso: string | null | undefined): string | undefined {
  const d = localDay(iso);
  return d ? isoDay(d) : undefined;
}
