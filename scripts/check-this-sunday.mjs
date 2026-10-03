// scripts/check-this-sunday.mjs
//
// Is the live home page behind YouTube? Run by .github/workflows/this-sunday.yml
// every half hour Wednesday to Saturday, after scripts/fetch-youtube-feed.mjs
// has written src/data/youtube-feed.generated.json (the Data API first, then
// the public feed, then the last good copy).
//
// Reads the feed, finds the broadcast scheduled for the coming Sunday
// (upcomingBroadcast, the same function the home page builds with), fetches the
// live home page, and writes `stale=true` or `stale=false` to $GITHUB_OUTPUT.
// The workflow starts a deploy only on `stale=true`. The decision itself is in
// scripts/lib/this-sunday-check.mjs. It never fails the run: every problem is
// logged and reads as "not stale".
//
// SITE_URL is the live origin (the workflow passes the repo variable, else the
// workers.dev address).

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteIsStale } from './lib/this-sunday-check.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { parseYoutubeFeed, upcomingBroadcast } = await import('../src/lib/youtube-feed.ts');

const log = (m) => console.log(`[this-sunday] ${m}`);

function answer(stale) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `stale=${stale}\n`);
  log(stale ? 'stale: the site needs a rebuild.' : 'not stale: nothing to do.');
  process.exit(0);
}

const feedPath = resolve(root, 'src/data/youtube-feed.generated.json');
if (!existsSync(feedPath)) {
  log('no feed file was written.');
  answer(false);
}
const feed = JSON.parse(readFileSync(feedPath, 'utf8'));
const broadcast = upcomingBroadcast(parseYoutubeFeed(feed.xml), new Date());
if (!broadcast) {
  log('no broadcast is scheduled for the coming Sunday.');
  answer(false);
}
log(`YouTube has "${broadcast.title}" (${broadcast.reading}) for ${broadcast.sunday}.`);

const origin = (process.env.SITE_URL || '').replace(/\/+$/, '');
let html = null;
try {
  // A cache-busting query keeps an edge copy of the page out of the answer.
  const res = await fetch(`${origin}/?check=${Date.now()}`, { signal: AbortSignal.timeout(25000) });
  if (res.ok) html = await res.text();
  else log(`the live page answered ${res.status}.`);
} catch (err) {
  log(`could not fetch the live page: ${err.message}`);
}

answer(siteIsStale(broadcast, html));
