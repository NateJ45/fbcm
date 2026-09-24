// Safe to edit by hand
// The IndexNow key file (2026-09-24, the local search pass): /<key>.txt, whose
// whole body is the key. It proves to the IndexNow engines (Bing, Yandex,
// Seznam, Naver...) that a URL submission from scripts/indexnow.mjs comes from
// whoever controls this host. The key lives in src/data/site.ts, so this route
// and the script can never disagree. At the site root on purpose: a key file
// only vouches for URLs at or below its own directory.
//
// A static route beside robots.txt.ts and llms.txt.ts: those are exact paths,
// so they win over this one pattern; getStaticPaths emits exactly one file.

import type { APIRoute, GetStaticPaths } from 'astro';
import { site } from '@/data/site';

export const getStaticPaths: GetStaticPaths = () => [{ params: { indexNowKey: site.indexNowKey } }];

export const GET: APIRoute = () =>
  new Response(site.indexNowKey, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
