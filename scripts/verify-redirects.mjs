// scripts/verify-redirects.mjs
// =============================================================================
// Verify every published redirect against a REAL running site, not just the
// data. A `redirect` document existing in Sanity is not the same as a working
// redirect (see the comment at the top of import-redirects.mjs): the document
// only takes effect after the next build folds it into astro.config.mjs's
// redirects map (src/lib/redirects.ts), and Astro/Cloudflare only then emit an
// actual 301/302. This script is the thing that actually curls the result,
// against production or against `npm run preview` (wrangler dev, which is the
// only way to exercise real response headers locally -- a static file server
// answers redirects differently than the deployed Worker).
//
// Two ways to get the 44 rules:
//   - default: read the published `redirect` documents straight from Sanity
//     (SANITY_API_READ_TOKEN from .env -- never printed).
//   - `--from-dist`: read dist/client/_redirects instead, so this also works
//     with no Sanity token at all. Astro/Cloudflare emit BOTH a trailing-slash
//     and a bare form for every rule (88 lines for 44 rules); this collapses
//     them back to one entry per rule, keyed on the bare form, which is the
//     shape normalizeRedirectPath() would produce from a Sanity doc's `from`.
//
// For each rule:
//   1. fetch(origin + from, { redirect: 'manual' }) must answer 301/302/307/308
//      with a `location` whose PATH matches `to`'s path. Query and fragment are
//      part of the instruction on six `/blog?category=<slug>` rules (see
//      redirects.ts's own comment on why source and destination normalize
//      differently), so those are compared too; a fragment is not sent by real
//      browsers and Cloudflare correctly drops it, so it is never compared.
//   2. fetch(origin + to's path[+query]) must answer 200, following at most one
//      trailing-slash redirect (Astro serves `/foo/index.html` at `/foo/`, and
//      a redirect target written without the trailing slash is one hop from
//      the real page, not broken).
//   3. `--follow-script`: the six `/blog?category=<slug>` targets are 200 pages
//      whose inline script (src/pages/blog/index.astro) reads the querystring
//      at RUNTIME and forwards the browser on. curl never runs that script, so
//      this step also fetches the route it would have forwarded to and expects
//      200 there: `fbcm-events-1` maps to the category `fbcm-events` (the Wix
//      spelling; see the `MOVED` table in blog/index.astro), `pianist` was a
//      TAG on the old site, not a category, so it maps to the tag route, and
//      everything else is a category route under its own slug.
//
// Exits 1 on any FAIL. No dependencies beyond Node 22's built-in fetch.
// =============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { loadEnv } from './lib/loadEnv.mjs';
import { normalizeRedirectPath, normalizeRedirectTarget } from '../src/lib/redirects.ts';
import { site } from '../src/data/site.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- CLI args ----------------------------------------------------------------
const args = process.argv.slice(2);
const FROM_DIST = args.includes('--from-dist');
const FOLLOW_SCRIPT = args.includes('--follow-script');
const originArg = (() => {
  const i = args.indexOf('--origin');
  return i !== -1 ? args[i + 1] : undefined;
})();
const ORIGIN = (originArg ?? site.url).replace(/\/+$/, '');

// --- Legacy category/tag slug mapping (mirrors src/pages/blog/index.astro) ---
// `fbcm-events-1` is the Wix spelling of the `fbcm-events` category. `pianist`
// was a TAG on the old site, never a category, so it forwards to the tag
// route instead. Kept as a literal mirror rather than an import: the source
// lives inline in an Astro <script is:inline>, which is not an importable
// module from a Node script.
const CATEGORY_SLUG_MOVED = { 'fbcm-events-1': 'fbcm-events' };
const TAG_SLUGS = new Set(['pianist']);

function scriptTargetFor(categorySlug) {
  if (TAG_SLUGS.has(categorySlug)) return `/blog/tag/${categorySlug}/`;
  const slug = CATEGORY_SLUG_MOVED[categorySlug] ?? categorySlug;
  return `/blog/category/${slug}/`;
}

// --- Load the 44 rules ---------------------------------------------------
/** @returns {{from: string, to: string, permanent: boolean}[]} */
function loadFromDist() {
  const path = resolve(ROOT, 'dist/client/_redirects');
  if (!existsSync(path)) {
    console.error(
      `${path} does not exist. Run \`npm run build\` first, or drop --from-dist to read from Sanity.`,
    );
    process.exit(1);
  }
  const lines = readFileSync(path, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Astro/Cloudflare emit a trailing-slash line and a bare line per rule.
  // Collapse to one entry per bare `from`, first line wins (both lines for a
  // rule always agree on `to` and status, so it does not matter which).
  const seen = new Map();
  for (const line of lines) {
    const [from, to, status] = line.split(/\s+/);
    if (!from || !to) continue;
    const bareFrom = from.replace(/\/$/, '') || '/';
    if (seen.has(bareFrom)) continue;
    seen.set(bareFrom, { from: bareFrom, to, permanent: status !== '302' });
  }
  return Array.from(seen.values());
}

/** @returns {Promise<{from: string, to: string, permanent: boolean}[]>} */
async function loadFromSanity() {
  const env = loadEnv(ROOT);
  const projectId = env.PUBLIC_SANITY_PROJECT_ID || env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_DATASET || env.SANITY_STUDIO_DATASET || 'production';
  const token = env.SANITY_API_READ_TOKEN;
  if (!projectId || !token) {
    console.error(
      'Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_READ_TOKEN in .env. Pass --from-dist to read dist/client/_redirects instead.',
    );
    process.exit(1);
  }
  const client = createClient({
    projectId,
    dataset,
    apiVersion: env.PUBLIC_SANITY_API_VERSION || '2026-05-01',
    token,
    useCdn: false,
  });
  const docs = await client.fetch(`*[_type == 'redirect']{from, to, permanent}`);
  return docs
    .map((d) => ({
      from: normalizeRedirectPath(d.from),
      to: normalizeRedirectTarget(d.to),
      permanent: d.permanent !== false,
    }))
    .filter((r) => r.from && r.to);
}

// --- HTTP helpers --------------------------------------------------------
/** The path (no origin, no query/fragment) out of a Location header, which may
 * be absolute or relative. */
function locationPath(location, origin) {
  try {
    return new URL(location, origin).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return null;
  }
}

function locationQuery(location, origin) {
  try {
    return new URL(location, origin).search;
  } catch {
    return '';
  }
}

/** Split a normalized target ("/blog?category=x" or "/staff#kendall-ellis")
 * into its path, query and fragment. Fragments are never sent to the server
 * by a real browser and Cloudflare's redirects map does not echo them back on
 * the Location header for a source match either, so they are informational
 * only here (used to confirm the *target page* renders, not compared against
 * the Location header). */
function splitTarget(to) {
  const hashIdx = to.indexOf('#');
  const withoutHash = hashIdx === -1 ? to : to.slice(0, hashIdx);
  const qIdx = withoutHash.indexOf('?');
  const path = qIdx === -1 ? withoutHash : withoutHash.slice(0, qIdx);
  const query = qIdx === -1 ? '' : withoutHash.slice(qIdx);
  return { path: path.replace(/\/+$/, '') || '/', query };
}

/** fetch() a page, following at most one trailing-slash redirect. Returns the
 * final status code, or -1 on a network error. */
async function fetchFinalStatus(url) {
  try {
    const first = await fetch(url, { redirect: 'manual' });
    if (first.status < 300 || first.status >= 400) return first.status;
    // Only follow if it looks like a trailing-slash normalization: same path
    // modulo a trailing slash. Anything else is a real finding, not a hop to
    // swallow silently.
    const location = first.headers.get('location');
    if (!location) return first.status;
    const target = new URL(url);
    const nextUrl = new URL(location, url);
    const a = target.pathname.replace(/\/+$/, '');
    const b = nextUrl.pathname.replace(/\/+$/, '');
    if (a !== b) return first.status; // not a trailing-slash hop; report as-is
    const second = await fetch(nextUrl, { redirect: 'manual' });
    return second.status;
  } catch (err) {
    console.error(`  fetch error for ${url}: ${err.message}`);
    return -1;
  }
}

// --- Main ------------------------------------------------------------------
async function main() {
  const rules = FROM_DIST ? loadFromDist() : await loadFromSanity();

  console.log(`Verifying ${rules.length} redirect(s) against ${ORIGIN}\n`);

  const rows = [];
  let failures = 0;

  for (const rule of rules) {
    const fromUrl = `${ORIGIN}${rule.from}`;
    let status = -1;
    let location = '';
    let ok = false;
    let reason = '';

    try {
      const resp = await fetch(fromUrl, { redirect: 'manual' });
      status = resp.status;
      location = resp.headers.get('location') ?? '';

      if (![301, 302, 307, 308].includes(status)) {
        reason = `expected 301/302/307/308, got ${status}`;
      } else {
        const { path: expectedPath, query: expectedQuery } = splitTarget(rule.to);
        const actualPath = locationPath(location, ORIGIN);
        const actualQuery = locationQuery(location, ORIGIN);
        if (actualPath !== expectedPath) {
          reason = `location path "${actualPath}" != expected "${expectedPath}"`;
        } else if (expectedQuery && actualQuery !== expectedQuery) {
          reason = `location query "${actualQuery}" != expected "${expectedQuery}"`;
        } else {
          ok = true;
        }
      }
    } catch (err) {
      reason = `fetch error: ${err.message}`;
    }

    // Step 2: the target itself must resolve to a real page.
    let targetStatus = -1;
    if (ok) {
      const { path: targetPath, query: targetQuery } = splitTarget(rule.to);
      targetStatus = await fetchFinalStatus(`${ORIGIN}${targetPath}${targetQuery}`);
      if (targetStatus !== 200) {
        ok = false;
        reason = `target ${targetPath}${targetQuery} returned ${targetStatus}, expected 200`;
      }
    }

    // Step 3: --follow-script also proves the client-side forward off
    // /blog?category=<slug> lands on a real page.
    if (ok && FOLLOW_SCRIPT) {
      const { path: targetPath, query: targetQuery } = splitTarget(rule.to);
      if (targetPath === '/blog' && targetQuery.startsWith('?category=')) {
        const categorySlug = decodeURIComponent(targetQuery.slice('?category='.length));
        const scriptTarget = scriptTargetFor(categorySlug);
        const scriptStatus = await fetchFinalStatus(`${ORIGIN}${scriptTarget}`);
        if (scriptStatus !== 200) {
          ok = false;
          reason = `script-forward target ${scriptTarget} returned ${scriptStatus}, expected 200`;
        } else {
          targetStatus = `${targetStatus} -> ${scriptTarget} ${scriptStatus}`;
        }
      }
    }

    if (!ok) failures++;
    rows.push({
      from: rule.from,
      status,
      location: location || '(none)',
      targetStatus,
      ok,
      reason,
    });
  }

  printTable(rows);
  console.log(`\n${rules.length - failures}/${rules.length} OK`);
  if (failures > 0) {
    console.log(`\n${failures} failure(s):`);
    for (const row of rows.filter((r) => !r.ok)) {
      console.log(`  ${row.from}: ${row.reason}`);
    }
    process.exit(1);
  }
}

function printTable(rows) {
  const col = (values, header) => Math.max(header.length, ...values.map((v) => String(v).length));
  const fromW = col(
    rows.map((r) => r.from),
    'from',
  );
  const statusW = col(
    rows.map((r) => r.status),
    'status',
  );
  const locationW = Math.min(
    50,
    col(
      rows.map((r) => r.location),
      'location',
    ),
  );
  const targetW = col(
    rows.map((r) => r.targetStatus),
    'target',
  );

  const pad = (v, w) => String(v).slice(0, w).padEnd(w, ' ');
  const header = `${pad('from', fromW)}  ${pad('status', statusW)}  ${pad('location', locationW)}  ${pad('target', targetW)}  ok`;
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const row of rows) {
    console.log(
      `${pad(row.from, fromW)}  ${pad(row.status, statusW)}  ${pad(row.location, locationW)}  ${pad(row.targetStatus, targetW)}  ${row.ok ? 'OK' : 'FAIL'}`,
    );
  }
}

main();
