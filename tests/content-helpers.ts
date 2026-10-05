// Site-specific (NOT a PORTABLE file). Helpers that let a spec work on whatever
// the church has published, instead of naming a post, a heading or an id the
// secretary could rename, move or delete (2026-10-05, tests-and-gates.md rule
// "tests must not assert church-authored copy").
//
// The pattern: ASK THE BUILD what exists, then assert the structure of what is
// there. A helper returns null (or an empty list) when the church has retired
// the thing entirely, and the spec skips with a reason; the matching
// `@content` test in tests/content-watch.spec.ts is what notices the thing is
// gone, so the loss is reported without turning the required check red.
import type { APIRequestContext, Page } from '@playwright/test';
import { BLOG_CATEGORY } from './routes';

/**
 * Paths of posts on the first page of the sermon-preview archive (the church's
 * weekly posts), newest first. Empty when the category has no page. The list is
 * read from the served HTML, so it follows whatever was published at build.
 */
export async function postCandidates(request: APIRequestContext, limit = 12): Promise<string[]> {
  const res = await request.get(`/blog/category/${BLOG_CATEGORY}/`);
  if (res.status() !== 200) return [];
  const html = await res.text();
  const seen = new Set<string>();
  for (const m of html.matchAll(/href="(\/post\/[^"#?]+)"/g)) seen.add(m[1]);
  return [...seen].slice(0, limit);
}

/**
 * The first candidate post whose served HTML satisfies `wants`, with that HTML.
 * Null when none does (the church has no such post right now).
 */
export async function findPost(
  request: APIRequestContext,
  wants: (html: string) => boolean = () => true,
): Promise<{ path: string; html: string } | null> {
  for (const path of await postCandidates(request)) {
    const res = await request.get(path);
    if (res.status() !== 200) continue;
    const html = await res.text();
    if (wants(html)) return { path, html };
  }
  return null;
}

/**
 * A word the church's newest post certainly contains: the longest purely
 * alphabetic word of the first post title on /blog. A search for it must find
 * at least that post, whatever the church has written.
 */
export async function searchWordFromBlog(page: Page): Promise<string> {
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  const title = (await page.locator('[data-vt-title] a').first().innerText()).trim();
  const words = title.match(/[A-Za-z]{5,}/g) ?? [];
  const word = [...words].sort((a, b) => b.length - a.length)[0];
  if (!word) throw new Error(`no searchable word in the newest post title "${title}"`);
  return word;
}

/**
 * Ids on the current page that a visitor can land on from a link: wrapper and
 * heading ids inside <main>, in page order, that the page is long enough to
 * scroll to the top of the window (an anchor in the last screenful cannot land
 * at the header's edge, so it says nothing about the offset). Generated ids
 * (React's `:r1:`, Radix) are left out.
 */
export async function reachableAnchors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(
      'main section[id], main h2[id], main h3[id], main article[id], main li[id]',
    )) {
      if (!/^[A-Za-z][\w-]*$/.test(el.id) || /-pin-\d+$/.test(el.id)) continue;
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > 0 && top <= maxScroll - 40) out.push(el.id);
    }
    return out;
  });
}

/** `n` items spread evenly across `list` (the first, the last, and between). */
export function spread<T>(list: T[], n: number): T[] {
  if (list.length <= n) return list;
  return Array.from({ length: n }, (_, i) => list[Math.round((i * (list.length - 1)) / (n - 1))]);
}
