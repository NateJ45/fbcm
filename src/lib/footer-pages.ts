// src/lib/footer-pages.ts
// Safe to edit by hand
// The page document's "Show in the footer" switch, made to work (2026-09-24,
// feat/the-visitor). The switch (`addToFooter` on the `page` schema) has been
// in the Studio since the starter, but nothing read it, so ticking it did
// nothing. The footer's link columns are an editor's list in Site settings;
// a page with the switch on now joins the FIRST of them (Pages), after the
// links already there, unless some column already links to it.
//
// Why here rather than in Site settings: The Visitor's page carries the switch
// in its own seed (scripts/pages/visitor.mjs), so publishing the page is what
// puts it in the footer, and there is no second write to Site settings to
// forget. Nathan, 2026-09-24: the footer, not the main menu.
//
// Pure, so the rule is unit-tested (footer-pages.test.ts). Titles and labels
// are read through splitStega so a preview's invisible payload never makes a
// page look new, or a label look empty.
import type { FooterColumn } from './siteSettings';
import { splitStega } from './preview-stega.ts';

export interface FooterPage {
  title?: string | null;
  navLabel?: string | null;
  slug?: string | null;
}

const clean = (s: string | null | undefined): string => splitStega(String(s ?? '')).cleaned.trim();

/** "/visitor", "/visitor/", "https://x.org/visitor" all name /visitor. */
function pathOf(href: string): string {
  let path = clean(href);
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    // leave it as typed
  }
  return path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
}

/** The footer's columns with every switched-on page in the first one. */
export function withFooterPages(
  columns: FooterColumn[],
  pages: readonly (FooterPage | null | undefined)[],
): FooterColumn[] {
  if (columns.length === 0) return columns;
  const linked = new Set(columns.flatMap((c) => c.links.map((l) => pathOf(l.href))));
  const add: FooterColumn['links'] = [];
  for (const page of pages) {
    const slug = clean(page?.slug);
    const label = clean(page?.navLabel) || clean(page?.title);
    if (!slug || !label) continue;
    const href = `/${slug.replace(/^\/+/, '')}`;
    if (linked.has(pathOf(href))) continue;
    linked.add(pathOf(href));
    add.push({ label, href });
  }
  if (add.length === 0) return columns;
  const [first, ...rest] = columns;
  return [{ ...first, links: [...first.links, ...add] }, ...rest];
}
