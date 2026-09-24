// =============================================================================
// GET /api/live-status - is the church's YouTube channel live? (2026-09-24)
// =============================================================================
// The header's "Watch live" link asks this, only on Sunday mornings and at
// most once a minute (BaseLayout's live-service script), to turn into "Live
// now" when the stream is actually on air rather than when the clock says it
// should be. Every decision is in src/lib/live-status.ts, unit-tested; this
// file adds only the three things a unit test cannot: the Worker's secret,
// the Site settings read and the edge cache.
//
//   { "status": "live" | "not-live" | "unknown", "url"?, "checkedAt", "reason"? }
//
// THE SECRET. YOUTUBE_API_KEY is a Worker runtime secret (`wrangler secret put
// YOUTUBE_API_KEY -c dist/server/wrangler.json`, or the dashboard; .dev.vars
// locally), read from `cloudflare:workers` at request time, never baked into
// the build. Without it every answer is "unknown" and the browser keeps its
// time-window behaviour, i.e. the site behaves exactly as before. How Nathan
// creates one is in docs/agent/deployment.md.
//
// THE CACHE, TWO LAYERS, so visitors never multiply YouTube calls:
//   1. StatusMemo, in the isolate: the answer is reused for its TTL (90 s, or
//      5 minutes for "unknown"), and requests during a refresh share it.
//   2. The Cache API (caches.default), per Cloudflare location, keyed on this
//      path with no query string, so ?anything cannot bust it. The stored copy
//      carries s-maxage = the TTL; browsers get max-age=60.
//   The Cache API is a no-op on *.workers.dev hostnames (Cloudflare only
//   caches on a zone), so until the cutover to fbcmuncie.org layer 1 is the
//   only one. deployment.md has the quota arithmetic for both.
//
// Same landmines as the other SSR routes (CLAUDE.md rule 8): prerender = false,
// and it only exists in dist/server, so `npm run preview` (wrangler dev) is
// the only local way to exercise it; a static server returns the 404 page.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sanityFetch } from '@/lib/sanity';
import {
  computeLiveStatus,
  StatusMemo,
  ttlSeconds,
  type LiveSettings,
  type LiveStatusBody,
} from '@/lib/live-status';

const memo = new StatusMemo();

// Site settings change only with a publish, and a publish redeploys the
// Worker, so ten minutes in the isolate costs nothing in freshness.
let settingsMemo: { at: number; value: LiveSettings | null } | null = null;
async function liveSettings(nowMs: number): Promise<LiveSettings | null> {
  if (settingsMemo && nowMs - settingsMemo.at < 600_000) return settingsMemo.value;
  let value: LiveSettings | null = null;
  try {
    value = await sanityFetch<LiveSettings>(
      `*[_type == "siteSettings"][0]{ serviceTime, youtubeUrl, livestreamUrl }`,
      {},
      null,
    );
  } catch {
    value = null;
  }
  settingsMemo = { at: nowMs, value };
  return value;
}

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}
function edgeCache(): EdgeCache | null {
  const store = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return store?.default ?? null;
}

function respond(body: LiveStatusBody, ttl: number, source: string): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=60, s-maxage=${ttl}`,
      'X-Live-Status-Source': source,
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const cache = edgeCache();
  const cacheKey = new Request(new URL('/api/live-status', request.url).toString());
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const res = new Response(hit.body, hit);
        res.headers.set('X-Live-Status-Source', 'edge-cache');
        return res;
      }
    } catch {
      /* a cache failure is only a miss */
    }
  }

  const now = Date.now();
  const key = ((env as { YOUTUBE_API_KEY?: string }).YOUTUBE_API_KEY ?? '').trim();
  const body = await memo.get(now, async () =>
    computeLiveStatus({
      now: new Date(now),
      key,
      // No key, no Sanity read either: the answer is "unknown" regardless.
      settings: key ? await liveSettings(now) : null,
      fetch: (url) => fetch(url, { headers: { Accept: 'application/json' } }),
    }),
  );
  const res = respond(body, ttlSeconds(body), 'origin');
  if (cache) {
    try {
      await cache.put(cacheKey, res.clone());
    } catch {
      /* not cached this time; the isolate memo still holds it */
    }
  }
  return res;
};
