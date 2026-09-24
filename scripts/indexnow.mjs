// scripts/indexnow.mjs
//
// Tell the IndexNow search engines (Bing, Yandex, Seznam, Naver and the rest;
// one submission reaches all of them) that the site's pages are there, after a
// deploy (2026-09-24, the local search pass).
//
//     npm run indexnow              check the gate, then submit
//     npm run indexnow -- --dry-run check the gate and print the plan; POST nothing
//
// THE GATE. It does nothing, and exits 0 saying why, unless the production host
// (`site.url` in src/data/site.ts) serves the key file, <site.url>/<key>.txt,
// with exactly the key in it. Before the cutover www.fbcmuncie.org is still
// the Wix site, which has no such file, so today this is a no-op by
// construction: it can never submit the new site's URLs for the old site's
// host. The first deploy after the domain moves opens the gate on its own.
//
// WHAT IT SUBMITS. Every URL in the sitemap this build produced
// (dist/client/sitemap-index.xml and the sitemaps it names), or the live
// sitemap when there is no build here. All of them, every deploy: the sitemap
// carries no dates to tell a changed page from an unchanged one, and a few
// hundred URLs is far inside IndexNow's 10,000 per request. The engines ignore
// URLs that have not changed. If that ever needs narrowing, a changed-pages
// list is the thing to build (docs/agent/deployment.md, "IndexNow").
//
// Wired into .github/workflows/deploy.yml after the deploy step with
// continue-on-error, so a refused submission can never fail a deploy. Exit 1
// means the gate was open and the submission failed; read the log.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/data/site.ts';
import { isSitemapIndex, keyGate, sitemapLocs, submissions, urlsForHost } from './lib/indexnow.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const siteUrl = site.url.replace(/\/$/, '');
const key = site.indexNowKey;

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'fbcm-indexnow' },
    });
    return { status: res.status, body: await res.text() };
  } catch (e) {
    console.log(`  could not fetch ${url}: ${e.message}`);
    return null;
  }
}

/** The sitemap's URLs: from this build if there is one, else from the live site. */
async function sitemapUrls() {
  const local = resolve(root, 'dist/client/sitemap-index.xml');
  const read = async (loc) => {
    // A sitemap named in the index is read from the build when the build has it.
    const path = new URL(loc).pathname;
    const file = resolve(root, 'dist/client', `.${path}`);
    if (existsSync(local) && existsSync(file)) return readFileSync(file, 'utf8');
    const res = await fetchText(loc);
    return res?.status === 200 ? res.body : '';
  };
  const indexXml = existsSync(local)
    ? readFileSync(local, 'utf8')
    : ((await fetchText(`${siteUrl}/sitemap-index.xml`))?.body ?? '');
  const source = existsSync(local) ? 'this build' : 'the live site';
  if (!isSitemapIndex(indexXml)) return { source, urls: sitemapLocs(indexXml) };
  const urls = [];
  for (const loc of sitemapLocs(indexXml)) urls.push(...sitemapLocs(await read(loc)));
  return { source, urls };
}

async function main() {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key ?? '')) {
    console.log('IndexNow: site.indexNowKey is missing or malformed; nothing submitted.');
    return 0;
  }
  const keyUrl = `${siteUrl}/${key}.txt`;
  console.log(`IndexNow: checking ${keyUrl}`);
  const gate = keyGate(await fetchText(keyUrl), key);
  if (!gate.ready) {
    console.log(`IndexNow: not submitting: ${gate.why}.`);
    console.log(
      `  The production host does not serve this site's key yet (before the cutover it is still the old site). Nothing to do.`,
    );
    return 0;
  }
  console.log(`IndexNow: ${gate.why}.`);

  const { source, urls: raw } = await sitemapUrls();
  const urls = urlsForHost(raw, siteUrl);
  console.log(`IndexNow: ${urls.length} URL(s) from the sitemap of ${source}.`);
  if (urls.length === 0) {
    console.log('IndexNow: the sitemap listed nothing on this host; nothing submitted.');
    return 0;
  }

  const bodies = submissions(urls, siteUrl, key);
  if (DRY) {
    console.log(
      `IndexNow: --dry-run, so nothing is POSTed. It would send ${bodies.length} request(s):`,
    );
    for (const b of bodies)
      console.log(`  host ${b.host}, ${b.urlList.length} URLs, first ${b.urlList[0]}`);
    return 0;
  }

  let failed = false;
  for (const body of bodies) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      // 200 OK and 202 Accepted (key validation pending) are both success.
      const ok = res.status === 200 || res.status === 202;
      console.log(
        `IndexNow: ${res.status} for ${body.urlList.length} URLs${ok ? '' : `: ${await res.text()}`}`,
      );
      if (!ok) failed = true;
    } catch (e) {
      console.log(`IndexNow: the request failed: ${e.message}`);
      failed = true;
    }
  }
  return failed ? 1 : 0;
}

// exitCode, not process.exit(): exiting while fetch still holds its sockets
// trips a libuv assertion on Windows (UV_HANDLE_CLOSING).
main().then((code) => {
  process.exitCode = code;
});
