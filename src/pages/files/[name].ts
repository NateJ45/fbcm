// Safe to edit by hand
// /files/<name>: the church's PDFs (and any other Sanity file) served from
// this site, so a download stops costing Sanity bandwidth (2026-09-26).
// src/lib/file-url.ts rewrites every cdn.sanity.io/files address the site
// renders to this route, and says why.
//
// TWO WAYS, the first that is available:
//   1. R2, when the Worker has a FILES bucket binding (wrangler.jsonc). A miss
//      is fetched from Sanity once, stored, and served; every later request,
//      from anyone, is R2's, which has no egress charge.
//   2. Otherwise Cloudflare's cache: the Sanity fetch is marked cacheable for
//      a week, so repeat downloads are served by Cloudflare rather than Sanity.
//      Whether that holds on a workers.dev host is MEASURED after deploy
//      (cf-cache-status on a second request), not assumed.
// Range requests pass through (a PDF viewer asks for pieces), HEAD is answered,
// and only a 40-hex-character Sanity file name of THIS project and dataset is
// ever fetched (upstreamFileUrl), so the route cannot be used to proxy
// anything else.
//
// SSR like the other runtime routes (CLAUDE.md rule 8): prerender = false.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { downloadName, fileType, upstreamFileUrl } from '@/lib/file-url';

export const prerender = false;

// A Workers runtime global (a TransformStream that promises R2 the body's
// length); declared here because this project does not load workers-types.
declare const FixedLengthStream: new (length: number) => TransformStream<Uint8Array, Uint8Array>;

const PROJECT = import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? '';
const DATASET = import.meta.env.PUBLIC_SANITY_DATASET || 'production';
const MAX_AGE = 60 * 60 * 24 * 7;

/** The R2 bucket binding, when configured. Structural type: no workers-types import. */
interface R2Like {
  get(
    key: string,
    opts?: { range?: Headers },
  ): Promise<{
    body: ReadableStream;
    size: number;
    range?: { offset?: number; length?: number };
    httpMetadata?: { contentType?: string };
    httpEtag: string;
  } | null>;
  head(
    key: string,
  ): Promise<{ size: number; httpMetadata?: { contentType?: string }; httpEtag: string } | null>;
  put(
    key: string,
    body: ReadableStream,
    opts?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

function baseHeaders(name: string, dl: string): Headers {
  const h = new Headers({
    'Cache-Control': `public, max-age=${MAX_AGE}`,
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    // Served from the church's own origin, so nothing in a file may run:
    // no script, no styles, no forms, no frames (security review, 2026-09-26).
    // A PDF still renders in the browser's own viewer.
    'Content-Security-Policy':
      "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:",
    'Content-Type': fileType(name),
  });
  const safe = downloadName(dl === '' ? null : dl);
  if (safe) h.set('Content-Disposition', `attachment; filename="${safe}"`);
  // Only a PDF opens in the browser; any other document always downloads.
  else if (name.endsWith('.pdf')) h.set('Content-Disposition', `inline; filename="${name}"`);
  else h.set('Content-Disposition', `attachment; filename="${name}"`);
  return h;
}

async function fromR2(
  bucket: R2Like,
  name: string,
  upstream: string,
  request: Request,
  dl: string,
): Promise<Response> {
  let meta = await bucket.head(name);
  if (!meta) {
    // First request for this file anywhere: fetch it from Sanity once and keep it.
    const res = await fetch(upstream);
    if (!res.ok || !res.body)
      return new Response('Not found', { status: res.status === 404 ? 404 : 502 });
    const len = Number(res.headers.get('content-length'));
    const type = fileType(name);
    const body =
      Number.isFinite(len) && len > 0 ? res.body.pipeThrough(new FixedLengthStream(len)) : res.body;
    await bucket.put(name, body, { httpMetadata: { contentType: type } });
    meta = await bucket.head(name);
    if (!meta) return new Response('Not found', { status: 502 });
  }
  const headers = baseHeaders(name, dl);
  headers.set('ETag', meta.httpEtag);
  if (request.method === 'HEAD') {
    headers.set('Content-Length', String(meta.size));
    return new Response(null, { headers });
  }
  const wantsRange = request.headers.has('range');
  const obj = await bucket.get(name, wantsRange ? { range: request.headers } : undefined);
  if (!obj) return new Response('Not found', { status: 404 });
  if (
    wantsRange &&
    obj.range &&
    typeof obj.range.offset === 'number' &&
    typeof obj.range.length === 'number'
  ) {
    const { offset, length } = obj.range;
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    headers.set('Content-Length', String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set('Content-Length', String(obj.size));
  return new Response(obj.body, { headers });
}

async function viaCache(
  name: string,
  upstream: string,
  request: Request,
  dl: string,
): Promise<Response> {
  const fwd = new Headers();
  const range = request.headers.get('range');
  if (range) fwd.set('Range', range);
  const res = await fetch(upstream, {
    method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    headers: fwd,
    cf: { cacheEverything: true, cacheTtl: MAX_AGE },
  } as RequestInit);
  if (!res.ok && res.status !== 206)
    return new Response('Not found', { status: res.status === 404 ? 404 : 502 });
  const headers = baseHeaders(name, dl);
  // Never the upstream Content-Type: baseHeaders fixed it from the extension.
  for (const k of ['content-length', 'content-range', 'etag', 'last-modified', 'cf-cache-status']) {
    const v = res.headers.get(k);
    if (v) headers.set(k, v);
  }
  return new Response(request.method === 'HEAD' ? null : res.body, { status: res.status, headers });
}

const handle: APIRoute = async ({ params, request, url }) => {
  const name = String(params.name ?? '');
  const upstream = upstreamFileUrl(name, PROJECT, DATASET);
  if (!upstream) return new Response('Not found', { status: 404 });
  const dl = url.searchParams.get('dl') ?? '';
  const bucket = (env as { FILES?: R2Like }).FILES;
  try {
    return bucket
      ? await fromR2(bucket, name, upstream, request, dl)
      : await viaCache(name, upstream, request, dl);
  } catch (err) {
    console.error(`[files] ${name}: ${String(err)}`);
    // Never strand a reader: send them to the file itself.
    return Response.redirect(upstream, 302);
  }
};

export const GET = handle;
export const HEAD = handle;
