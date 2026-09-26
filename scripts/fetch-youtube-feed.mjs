// scripts/fetch-youtube-feed.mjs
//
// The church's YouTube uploads, fetched ONCE before `astro build` and written
// to src/data/youtube-feed.generated.json (gitignored), which Home (the hero's
// "This Sunday" line and the Last Sunday band, src/pages/index.astro) and the
// sermon previews (src/lib/sermon-feed.ts) read. Added 2026-09-26.
//
// WHY A BUILD STEP. The pages used to fetch the public feed themselves while
// they prerendered. On 2026-09-25 YouTube's feed began failing: the
// channel_id form answered 404 or 500 on every try, the uploads-playlist form
// about two times in five. Every build tried the one address twice, got
// nothing, and the site quietly lost the hero line and the band. The pages
// prerender inside workerd, which has no disk, so a retry across sources and a
// last-good copy have to live here, in Node, the way the scripture step does.
//
// THE ORDER, first answer wins:
//   1. The YouTube Data API, when YOUTUBE_API_KEY is set (the same key the
//      Worker's live check uses; a GitHub Actions secret for the deploy
//      build, .dev.vars locally). Written back as the feed's own Atom
//      (src/lib/youtube-feed-api.ts), so nothing downstream changes.
//   2. The public feed, the channel form and the uploads-playlist form,
//      alternately, up to four rounds a second or two apart.
//   3. The last good copy in node_modules/.cache/youtube/ (restored by the
//      deploy workflow), when it is at most 8 days old: the Sunday it names
//      is then still this week's or last week's, and the log says it is
//      stale. Older than that, nothing: the hero goes without its line and
//      the band is not drawn, as before.
//
// It never fails the build. Every failure is logged with its reason.
// `--no-network` uses the cache only.

import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { loadEnv } from './lib/loadEnv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = resolve(root, 'src/data/youtube-feed.generated.json');
const cacheDir = resolve(root, 'node_modules/.cache/youtube');
const MAX_CACHE_AGE_MS = 8 * 24 * 3600 * 1000;
const noNetwork = process.argv.includes('--no-network');

const { youtubeChannelId } = await import('../src/lib/live-status.ts');
const { atomFromApi, uploadsPlaylist } = await import('../src/lib/youtube-feed-api.ts');

const log = (m) => console.log(`[youtube-feed] ${m}`);

function write(result) {
  const body = `${JSON.stringify(result, null, 2)}\n`;
  mkdirSync(dirname(outPath), { recursive: true });
  if (existsSync(outPath) && readFileSync(outPath, 'utf8') === body) return;
  writeFileSync(outPath, body);
}

/** YOUTUBE_API_KEY from the environment, else from .dev.vars (local builds). */
function apiKey(env) {
  if (env.YOUTUBE_API_KEY) return String(env.YOUTUBE_API_KEY).trim();
  try {
    const raw = readFileSync(resolve(root, '.dev.vars'), 'utf8');
    const line = raw.split('\n').find((l) => /^\s*YOUTUBE_API_KEY\s*=/.test(l));
    return line
      ? line
          .replace(/^\s*YOUTUBE_API_KEY\s*=\s*/, '')
          .replace(/^["']|["']\s*$/g, '')
          .trim()
      : '';
  } catch {
    return '';
  }
}

async function get(url, accept) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: accept, 'User-Agent': 'Mozilla/5.0 (compatible; FBCM-website-build)' },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function fromApi(key, channelId) {
  const base = 'https://www.googleapis.com/youtube/v3';
  const pl = await get(
    `${base}/playlistItems?part=snippet,contentDetails&maxResults=15&playlistId=${uploadsPlaylist(channelId)}&key=${encodeURIComponent(key)}`,
    'application/json',
  );
  if (!pl.ok) throw new Error(`playlistItems HTTP ${pl.status}: ${pl.text.slice(0, 160)}`);
  const items = JSON.parse(pl.text).items ?? [];
  const ids = items.map((i) => i?.contentDetails?.videoId).filter(Boolean);
  let videos = [];
  if (ids.length) {
    const v = await get(
      `${base}/videos?part=snippet,statistics&id=${ids.join(',')}&key=${encodeURIComponent(key)}`,
      'application/json',
    );
    if (!v.ok) throw new Error(`videos HTTP ${v.status}: ${v.text.slice(0, 160)}`);
    videos = JSON.parse(v.text).items ?? [];
  }
  return atomFromApi(channelId, items, videos);
}

async function fromFeed(channelId) {
  const urls = [
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    `https://www.youtube.com/feeds/videos.xml?playlist_id=${uploadsPlaylist(channelId)}`,
  ];
  for (let round = 1; round <= 4; round++) {
    for (const url of urls) {
      try {
        const r = await get(url, 'application/atom+xml, application/xml;q=0.9, */*;q=0.1');
        if (r.ok && /<feed[\s>]/.test(r.text)) return { xml: r.text, url };
        log(
          `round ${round}: HTTP ${r.status} from ${url.replace(/^https:\/\/www\.youtube\.com/, '')}`,
        );
      } catch (err) {
        log(
          `round ${round}: ${String(err)} from ${url.replace(/^https:\/\/www\.youtube\.com/, '')}`,
        );
      }
    }
    await new Promise((r) => setTimeout(r, 1000 * round));
  }
  return null;
}

const env = loadEnv(root);
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
if (!projectId || projectId === 'your-project-id') {
  log('no Sanity project: nothing to fetch.');
  write({ xml: null, source: 'none' });
  process.exit(0);
}

try {
  const client = createClient({
    projectId,
    dataset: env.PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2025-01-01',
    useCdn: true,
  });
  const settings = await client.fetch('*[_id == "siteSettings"][0]{youtubeUrl, livestreamUrl}');
  const channelId = youtubeChannelId(settings?.youtubeUrl, settings?.livestreamUrl);
  if (!channelId) {
    log('Site settings names no YouTube channel: nothing to fetch.');
    write({ xml: null, source: 'none' });
    process.exit(0);
  }
  const cachePath = resolve(cacheDir, `${channelId}.xml`);

  let xml = null;
  let source = '';
  if (!noNetwork) {
    const key = apiKey(env);
    if (key) {
      try {
        xml = await fromApi(key, channelId);
        source = 'api';
      } catch (err) {
        log(`the Data API failed (${String(err)}); trying the public feed.`);
      }
    } else {
      log('no YOUTUBE_API_KEY: using the public feed.');
    }
    if (!xml) {
      const got = await fromFeed(channelId);
      if (got) {
        xml = got.xml;
        source = got.url.includes('playlist_id') ? 'feed (uploads playlist)' : 'feed (channel)';
      }
    }
  }

  if (xml) {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cachePath, xml);
    const n = (xml.match(/<entry>/g) ?? []).length;
    log(`${n} uploads from the ${source}.`);
    write({ xml, source, fetchedAt: new Date().toISOString() });
    process.exit(0);
  }

  if (existsSync(cachePath)) {
    const age = Date.now() - statSync(cachePath).mtimeMs;
    const days = (age / 86_400_000).toFixed(1);
    if (age <= MAX_CACHE_AGE_MS) {
      log(`every source failed; using the last good copy, ${days} days old.`);
      write({ xml: readFileSync(cachePath, 'utf8'), source: `cache (${days} days old)` });
      process.exit(0);
    }
    log(`every source failed, and the last good copy is ${days} days old: too stale to use.`);
  } else {
    log('every source failed, and there is no earlier copy.');
  }
  write({ xml: null, source: 'none' });
} catch (err) {
  log(`could not run (${String(err)}); the pages go without the feed.`);
  write({ xml: null, source: 'none' });
}
