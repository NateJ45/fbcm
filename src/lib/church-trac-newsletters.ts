// Safe to edit by hand
// The ministry newsletters written in Church Trac, and the build-time read of
// them (2026-09-25). The reading of a page's HTML is src/lib/church-trac-page.ts;
// the page that draws one is src/components/newsletter/Newsletter.astro, used
// by src/pages/kids-corner.astro and src/pages/youth-news.astro.
//
// THE LIST. Each newsletter is a Church Trac page the ministry writes, at
// <the church's Church Trac address>/<page>. The address comes from Site
// settings > Church systems > Church Trac (churchTracUrl), and falls back to
// the church's own while that box is empty. The page names, the site's
// addresses and the words around each newsletter live here, in code: adding a
// third newsletter is one entry below and one small page file.
//
// ONE FETCH PER PAGE PER BUILD, two tries, every failure LOGGED and turned into
// null, so the page falls back to "Read it on Church Trac" and the build
// carries on. deploy.yml rebuilds every morning, so a Church Trac edit shows
// here within a day.
//
// THE TEST SEAM. Playwright's build sets CHURCH_TRAC_PAGES_FIXTURE=1 so both
// pages render from tests/fixtures/churchtrac-{children,youth}.html (the real
// pages of 2026-09-25), offline; =unavailable proves the fallback. Read through
// import.meta.env and `?raw` imports: the build prerenders inside workerd.

import { readChurchTracPage, type ChurchTracPage } from './church-trac-page.ts';

export interface Newsletter {
  /** The page's address on this site, without the slash ("kids-corner"). */
  slug: string;
  /** The Church Trac page's name in its address ("children"). */
  churchTracPage: string;
  /** The ministry it belongs to: the `ministry` document's web address. */
  ministry: string;
  /** Its name when Church Trac cannot be read (the page's own name otherwise). */
  fallbackTitle: string;
  /** The small line above the name. */
  eyebrow: string;
  /** Who it is for, under the name. */
  lede: string;
}

export const NEWSLETTERS: readonly Newsletter[] = [
  {
    slug: 'kids-corner',
    churchTracPage: 'children',
    ministry: 'children',
    fallbackTitle: "The Kid's Corner",
    eyebrow: 'Children’s newsletter',
    lede: 'News from the Children’s Ministry, nursery through 5th grade.',
  },
  {
    slug: 'youth-news',
    churchTracPage: 'youth',
    ministry: 'youth',
    fallbackTitle: "The Moose's Message",
    eyebrow: 'Youth newsletter',
    lede: 'News from the Youth Ministry, 6th through 12th grade.',
  },
];

export const newsletterBySlug = (slug: string): Newsletter | undefined =>
  NEWSLETTERS.find((n) => n.slug === slug);

/** The church's Church Trac portal, used while Site settings' box is empty. */
export const FBCM_CHURCH_TRAC = 'https://fbcmuncie.churchtrac.com/';

/**
 * The newsletter's page on Church Trac, from Site settings' Church Trac box
 * when it holds a churchtrac.com address, else the church's own.
 */
export function churchTracPageUrl(
  n: Pick<Newsletter, 'churchTracPage'>,
  churchTracUrl?: string | null,
): string {
  let base = FBCM_CHURCH_TRAC;
  const raw = String(churchTracUrl ?? '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim();
  try {
    const u = new URL(raw);
    if (
      u.protocol === 'https:' &&
      /(^|\.)churchtrac\.com$/i.test(u.hostname) &&
      u.hostname !== 'www.churchtrac.com'
    ) {
      base = `${u.origin}/`;
    }
  } catch {
    // keep the church's own
  }
  return new URL(encodeURIComponent(n.churchTracPage), base).toString();
}

export const FETCH_TIMEOUT_MS = 10_000;

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/** The page's HTML, or null on any failure, with the reason logged. */
export async function fetchChurchTracPage(
  url: string,
  fetchImpl: Fetch = fetch,
  timeoutMs: number = FETCH_TIMEOUT_MS,
  log: (msg: string) => void = (m) => console.warn(m),
): Promise<string | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        signal: controller.signal,
        headers: {
          Accept: 'text/html',
          // Church Trac's servers answer 403 to a request with NO User-Agent
          // (the build's workerd prerender sends none) and to
          // `Accept-Language: *` (Node's fetch default); measured 2026-09-25.
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (compatible; FBCM-website-build; +https://www.fbcmuncie.org)',
        },
      });
      const text = await res.text();
      if (res.ok && /page-card-body/.test(text)) return text;
      log(
        `[church-trac-page] ${url} try ${attempt}: HTTP ${res.status}, not a Church Trac page: ${JSON.stringify(text.slice(0, 120))}`,
      );
    } catch (err) {
      log(
        `[church-trac-page] ${url} try ${attempt}: ${String((err as Error)?.name === 'AbortError' ? `timed out after ${timeoutMs} ms` : err)}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/** Vite's env in a build; undefined under `node --test`. */
const env = (name: string): string | undefined =>
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[name];

async function fixture(page: string): Promise<string | null | undefined> {
  const flag = env('CHURCH_TRAC_PAGES_FIXTURE');
  if (!flag) return undefined;
  if (flag === 'unavailable') return null;
  if (page === 'children')
    return (await import('../../tests/fixtures/churchtrac-children.html?raw')).default;
  if (page === 'youth')
    return (await import('../../tests/fixtures/churchtrac-youth.html?raw')).default;
  return null;
}

const shared = new Map<string, Promise<ChurchTracPage | null>>();

/** A newsletter as the site draws it, once per build, or null when unreadable. */
export function loadNewsletter(
  n: Newsletter,
  churchTracUrl?: string | null,
  fetchImpl: Fetch = fetch,
): Promise<ChurchTracPage | null> {
  const url = churchTracPageUrl(n, churchTracUrl);
  const had = shared.get(url);
  if (had) return had;
  const p = (async () => {
    const fixed = await fixture(n.churchTracPage);
    const html = fixed !== undefined ? fixed : await fetchChurchTracPage(url, fetchImpl);
    if (html === null) return null;
    const page = readChurchTracPage(html, url);
    if (!page) console.warn(`[church-trac-page] ${url}: no newsletter found in the page`);
    return page;
  })();
  shared.set(url, p);
  return p;
}
