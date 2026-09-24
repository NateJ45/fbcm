// scaffold-file: journal
// The site search's result rows (2026-09-24, feat/scripture-search), as pure
// functions so the rules are unit-tested rather than trusted to a dialog.
//
// Pagefind hands each result over as { url, excerpt, meta }. The meta comes
// from the page itself at build time (data-pagefind-meta on the post page's
// facts: its Sunday or its posted day as `date`, a preview's `reading`), so a
// search row says exactly what the post's own masthead says, and nothing here
// is stored.

/** What a Pagefind result's data() resolves to, as far as the rows read it. */
export interface PagefindData {
  url: string;
  excerpt?: string;
  meta?: Record<string, string | undefined>;
}

/** One register-style row: date | title and excerpt | reading. */
export interface SearchRow {
  href: string;
  title: string;
  /** "September 21, 2025" on a post, "Page" on a page. */
  date: string;
  /** A preview's reading, or ''. */
  reading: string;
  /** The match in context: text with only <mark> left in. */
  excerptHtml: string;
}

const SITE_SUFFIX = /\s*[|·-]\s*First Baptist Church Muncie\s*$/i;

/**
 * Keep the excerpt's <mark> tags and nothing else. Pagefind escapes the page
 * text and wraps the match in <mark>; this is the belt to that brace, because
 * the row sets it as HTML.
 */
export function excerptHtml(excerpt: string | null | undefined): string {
  return String(excerpt ?? '')
    .replace(/<(?!\/?mark>)[^>]*>/gi, '')
    .replace(/<mark>/gi, '<mark>')
    .replace(/<\/mark>/gi, '</mark>')
    .trim();
}

/** A result's row. The title falls back to the address, never to nothing. */
export function searchRow(data: PagefindData): SearchRow {
  const meta = data.meta ?? {};
  const title = (meta.title ?? '').replace(SITE_SUFFIX, '').trim() || data.url;
  return {
    href: data.url,
    title,
    date: (meta.date ?? '').trim() || 'Page',
    reading: (meta.reading ?? '').trim(),
    excerptHtml: excerptHtml(data.excerpt),
  };
}

/** The status line under the box: "12 results for “Jeremiah”". */
export function countLabel(count: number, query: string): string {
  const q = query.trim();
  if (!q) return '';
  if (count === 0) return `Nothing found for “${q}”.`;
  return `${count} ${count === 1 ? 'result' : 'results'} for “${q}”`;
}
