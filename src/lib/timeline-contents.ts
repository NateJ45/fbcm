// Safe to edit by hand
// scaffold-file: church
// =============================================================================
// timeline-contents - the sticky contents bar over a long timeline page
// =============================================================================
// Added 2026-09-25 (branch feat/history-contents). /history is about 22,000px
// tall at 1280 wide: an opener, a timeline of eight rows, then seven eras of
// photograph bands, prose and quotes. The timeline already works as a table of
// contents (every era's row ends with "Read this era", a link to that era's own
// band on the same page, history.mjs P24), but it scrolls away after the first
// few screens. The contents bar carries those same links down the page.
//
// NOTHING HERE IS TYPED (CLAUDE.md rule 15). The entries are read off the
// timeline block itself:
//   - an ENTRY is a timeline row whose body links to a band ON THIS PAGE, and
//     only when that band exists (its wrapper id is in the page's anchor list)
//     and sits after the timeline. The Today row links to /staff, so it is not
//     an entry; a row whose link names a band that has gone is not an entry
//     either, so the bar can never point at nothing;
//   - its year is the first four-digit year of the row's marker ("1859 to
//     1862" gives 1859), its words the marker and the title;
//   - the bar's first link is the timeline itself, named by its own heading.
//
// THE OPT-IN IS DERIVED TOO. A timeline earns the bar only when at least
// MIN_ENTRIES of its rows point at bands on the same page, which is exactly
// "this timeline is a table of contents". Visit's morning path and the
// Ministries timeline link nowhere on their own pages, so they never get one,
// and no schema field decides it.
//
// THE SPAN. The bar is sticky from the timeline to the end of the last entry's
// part: its band, then every band after it that has no heading of its own (an
// era's prose tail, a pull quote), because a band with no heading continues
// the part above it. The first band after that with a heading (History's
// "Two books") is outside the span, and the bar steps aside there.
//
// STEGA (CLAUDE.md, the preview rules). Markers, titles, headings and hrefs
// all arrive with an invisible payload in the preview. Every one is cleaned
// through splitStega before it is searched, compared or sliced.
// =============================================================================
import { splitStega } from './preview-stega.ts';

/** Fewer rows than this pointing at the page's own bands, and there is no bar. */
export const MIN_ENTRIES = 3;

/** One band on the page, as SectionRenderer sees it, in page order. */
export interface ContentsBlock {
  /** The block's `_type`. */
  type: string;
  /** The id on the band's wrapper (SectionRenderer's uniqueAnchor). */
  id: string;
  /** The band's own heading (heading or headline), raw; empty when none. */
  heading?: unknown;
  /** A timeline's rows, raw. */
  rows?: unknown;
}

export interface ContentsEntry {
  /** The wrapper id the entry links to. */
  id: string;
  /** The year shown on the wide bar: "1859", or the whole marker if it has none. */
  year: string;
  /** The rest of the accessible name after the year: " to 1862: Founding". */
  rest: string;
  /** The row's marker, cleaned: "1859 to 1862". */
  marker: string;
  /** The row's title, cleaned: "Founding". */
  title: string;
}

export interface TimelineContents {
  /** Index of the timeline block: the bar renders just before it. */
  from: number;
  /** Index of the last band in the span. */
  to: number;
  /** The timeline itself: its wrapper id and its heading. */
  top: { id: string; label: string };
  entries: ContentsEntry[];
}

const clean = (v: unknown): string => (typeof v === 'string' ? splitStega(v).cleaned.trim() : '');

/** A path with no trailing slash and no preview prefix, so /preview/history/ is /history. */
export function normalisePath(path: string): string {
  let p = clean(path).split(/[?#]/)[0] || '/';
  p = p.replace(/^\/preview(?=\/|$)/, '') || '/';
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

/**
 * The fragment an href points at ON THIS PAGE, or null: `#era-1`, or
 * `/history#era-1` / `/history/#era-1` when the page is /history. A link to
 * another page (`/staff`, `/staff#x`) or an absolute URL is not on this page.
 */
export function fragmentFor(href: unknown, pagePath: string): string | null {
  const h = clean(href);
  const hash = h.indexOf('#');
  if (hash === -1) return null;
  const path = h.slice(0, hash);
  let id = h.slice(hash + 1);
  try {
    id = decodeURIComponent(id);
  } catch {
    return null;
  }
  if (!id) return null;
  if (path !== '' && (!path.startsWith('/') || normalisePath(path) !== normalisePath(pagePath))) {
    return null;
  }
  return id;
}

/** Every link href in a row's Portable Text body, in order. */
export function bodyHrefs(body: unknown): string[] {
  if (!Array.isArray(body)) return [];
  const out: string[] = [];
  for (const block of body) {
    const defs = (block as { markDefs?: unknown })?.markDefs;
    if (!Array.isArray(defs)) continue;
    for (const def of defs) {
      const href = (def as { href?: unknown })?.href;
      if (typeof href === 'string') out.push(href);
    }
  }
  return out;
}

/** The first four-digit year in a marker, or the whole marker when it has none. */
export function entryYear(marker: string): string {
  return marker.match(/\d{4}/)?.[0] ?? marker;
}

/** What the accessible name says after the visible year. */
export function entryRest(marker: string, year: string, title: string): string {
  const tail = marker.startsWith(year) ? marker.slice(year.length) : '';
  return title ? `${tail}: ${title}` : tail;
}

/**
 * The contents bar for a page, or null when the page has no timeline that is
 * a table of contents. Reads the FIRST timeline block with rows.
 */
export function timelineContents(
  blocks: ContentsBlock[],
  pagePath: string,
): TimelineContents | null {
  const from = blocks.findIndex((b) => b.type === 'timelineSection' && Array.isArray(b.rows));
  if (from === -1) return null;
  const timeline = blocks[from];
  const indexOf = new Map<string, number>();
  blocks.forEach((b, i) => {
    if (b.id && !indexOf.has(b.id)) indexOf.set(b.id, i);
  });

  const entries: ContentsEntry[] = [];
  const seen = new Set<string>();
  let last = -1;
  for (const row of timeline.rows as unknown[]) {
    const r = row as { marker?: unknown; title?: unknown; body?: unknown };
    const id = bodyHrefs(r.body)
      .map((href) => fragmentFor(href, pagePath))
      .find((f): f is string => !!f && (indexOf.get(f) ?? -1) > from);
    if (!id || seen.has(id)) continue;
    const marker = clean(r.marker);
    const title = clean(r.title);
    if (!marker && !title) continue;
    seen.add(id);
    const year = entryYear(marker) || title;
    entries.push({ id, year, rest: entryRest(marker, year, marker ? title : ''), marker, title });
    last = Math.max(last, indexOf.get(id) as number);
  }
  if (entries.length < MIN_ENTRIES) return null;

  let to = last;
  while (to + 1 < blocks.length && !clean(blocks[to + 1].heading)) to += 1;

  return {
    from,
    to,
    top: { id: timeline.id, label: clean(timeline.heading) || entries[0].title },
    entries,
  };
}
