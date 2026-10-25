// Safe to edit by hand
// =============================================================================
// body-link.ts - the final href for a link written inside page or post text
// =============================================================================
// Post bodies came over from the old Wix site, and the editors paste links the
// way they find them. Three kinds of address end up in a link mark that would
// each cost a visitor (and Google) a redirect:
//
//   1. an absolute address on this very site (http://fbcmuncie.org/beliefs,
//      https://www.fbcmuncie.org/what-to-expect). Own-domain links become
//      root-relative paths so they work on a preview and skip the http -> https
//      and apex -> www hops.
//   2. an old Wix path that now 301s (/team/<name>, /what-to-expect,
//      /publications, /blog/categories/<c>, /blog/hashtags/<x>). They are sent
//      straight to the final address the redirect table in fbcm-redirects.ts
//      names, so the click is one request, not two.
//   3. a slashless page path (/beliefs). Cloudflare answers those with a 307
//      to the slashed form, so every internal page link ends in a slash.
//
// Render-time only: nothing here writes back to Sanity.

import { withTrailingSlash } from './href.ts';
import { fbcmRedirects } from './fbcm-redirects.ts';

const OWN_ORIGIN = /^https?:\/\/(?:www\.)?fbcmuncie\.org(?=[/?#]|$)/i;

let table: Map<string, string> | undefined;
/** Old path (no trailing slash, lower case) -> final root-relative target. */
function redirectTable(): Map<string, string> {
  if (!table) {
    table = new Map();
    for (const r of fbcmRedirects()) table.set(r.from.toLowerCase(), r.to);
  }
  return table;
}

/** `/a/b?x=1#h` -> ['/a/b', '?x=1', '#h']. */
function splitHref(href: string): [string, string, string] {
  const hashAt = href.indexOf('#');
  const beforeHash = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : href.slice(hashAt);
  const qAt = beforeHash.indexOf('?');
  return [
    qAt === -1 ? beforeHash : beforeHash.slice(0, qAt),
    qAt === -1 ? '' : beforeHash.slice(qAt),
    hash,
  ];
}

/** Where an old Wix path now lives, or undefined when the path is not one. */
function wixTarget(path: string): string | undefined {
  const key = path.replace(/\/+$/, '').toLowerCase();
  const exact = redirectTable().get(key);
  if (exact) return exact;
  // Pages the table does not list one by one still land somewhere sensible.
  const cat = /^\/blog\/categories\/([^/]+)$/.exec(key);
  if (cat) return `/blog?category=${cat[1]}`;
  if (key.startsWith('/blog/hashtags/')) return '/blog';
  if (key.startsWith('/team/')) return '/ministers';
  return undefined;
}

/** The href to draw for a link mark in page or post text. Externals pass through untouched. */
export function bodyHref(href: string | null | undefined): string {
  if (typeof href !== 'string' || !href) return '';
  let h = href.trim();
  const own = OWN_ORIGIN.exec(h);
  if (own) h = h.slice(own[0].length) || '/';
  if (!h.startsWith('/') || h.startsWith('//')) return href;
  const [path, query, hash] = splitHref(h);
  const target = wixTarget(path);
  if (target) {
    // The target's own query or anchor wins; otherwise keep what the writer had.
    const [tPath, tQuery, tHash] = splitHref(target);
    return withTrailingSlash(`${tPath}${tQuery || query}${tHash || hash}`);
  }
  return withTrailingSlash(h);
}
