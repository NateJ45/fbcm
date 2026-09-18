// Queries the Internet Archive for every URL this domain has ever served, and
// diffs it against the current sitemaps. The interesting output is "gone": URLs
// the archive has seen answer 200 that no current sitemap lists. The live crawl
// cannot find those by definition, and on a previous project that gap was two
// decades of deleted content.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const UA = { 'user-agent': 'Mozilla/5.0 (archival inventory before site migration)' };
const OUT = path.join(import.meta.dirname, 'data');

const norm = (u) => {
  try {
    const p = new URL(u);
    const s = p.pathname.replace(/\/+$/, '').toLowerCase();
    return s === '' ? '/' : s;
  } catch {
    return null;
  }
};

// Paged with CDX's own resumeKey, NOT `offset=`. Deep offsets make the Archive
// scan from the start of the result set every time, which is why offset paging on
// this domain answered 503 and then 504 at offset 275000; resumeKey is the
// mechanism the API provides so clients do not have to. Also no server-side
// `filter=` params: with them even the first page times out. Filtering is local.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cdxPage = async (host, resumeKey, limit) => {
  const url =
    `http://web.archive.org/cdx/search/cdx?url=${host}*&output=json` +
    `&fl=original,timestamp,statuscode,mimetype&collapse=urlkey` +
    `&limit=${limit}&showResumeKey=true` +
    (resumeKey ? `&resumeKey=${encodeURIComponent(resumeKey)}` : '');
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(180_000) });
      if (r.ok) return (await r.json()).slice(1); // drop the header row
      if (![429, 500, 502, 503, 504].includes(r.status)) {
        throw new Error(`CDX ${host}: HTTP ${r.status}`);
      }
      console.warn(`  retry ${attempt}/5: HTTP ${r.status}`);
    } catch (e) {
      if (attempt === 5) throw e;
      console.warn(`  retry ${attempt}/5: ${e.message}`);
    }
    await sleep(attempt * 8000);
  }
  throw new Error(`CDX ${host}: gave up after 5 attempts`);
};

// A resumeKey arrives as a blank row followed by the key as the last row.
const cdx = async (host) => {
  const out = [];
  let resumeKey = null;
  for (let page = 0; page < 60; page++) {
    const rows = await cdxPage(host, resumeKey, 25000);
    resumeKey = null;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].length === 0 || (rows[i].length === 1 && !rows[i][0])) {
        const tail = rows
          .slice(i + 1)
          .flat()
          .filter(Boolean);
        if (tail.length) resumeKey = tail[0];
        rows.length = i; // drop the blank separator and the key row
        break;
      }
    }
    out.push(...rows.filter((r) => r.length >= 4));
    console.log(`  ${host}: ${out.length} rows${resumeKey ? ' (more)' : ''}`);
    if (!resumeKey) break;
    await sleep(1500); // be a good citizen; the Archive is rate limiting us
  }
  return out;
};

const sitemap = async (name) => {
  const r = await fetch(`https://www.fbcmuncie.org/${name}`, { headers: UA });
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
};

// --- historical -------------------------------------------------------------
const raw = [...(await cdx('fbcmuncie.org')), ...(await cdx('www.fbcmuncie.org'))];
const hist = new Map();
const byYear = {};
let totalCaptures = 0,
  first = null,
  last = null;

for (const [original, ts, status, mime] of raw) {
  totalCaptures++;
  if (!first || ts < first) first = ts;
  if (!last || ts > last) last = ts;
  byYear[ts.slice(0, 4)] = (byYear[ts.slice(0, 4)] ?? 0) + 1;
  if (status !== '200' || !String(mime).includes('html')) continue;
  const key = norm(original);
  if (!key) continue;
  const e = hist.get(key) ?? {
    url: key,
    firstSeen: ts,
    lastSeen: ts,
    captureCount: 0,
    sample: original,
  };
  e.captureCount++;
  if (ts < e.firstSeen) e.firstSeen = ts;
  if (ts > e.lastSeen) {
    e.lastSeen = ts;
    e.sample = original;
  }
  hist.set(key, e);
}

// --- current ----------------------------------------------------------------
const currentRaw = (
  await Promise.all(
    [
      'pages-sitemap.xml',
      'blog-posts-sitemap.xml',
      'blog-categories-sitemap.xml',
      'dynamic-team_p_99e0dfbf_f6fd_4053_bc94_6c23dc39c9b1_0_5000-sitemap.xml',
    ].map(sitemap),
  )
).flat();
const current = new Set(currentRaw.map(norm).filter(Boolean));

const iso = (ts) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
const gone = [...hist.values()]
  .filter((e) => !current.has(e.url))
  .map((e) => ({
    ...e,
    firstSeen: iso(e.firstSeen),
    lastSeen: iso(e.lastSeen),
    bestWaybackUrl: `https://web.archive.org/web/${e.lastSeen}/${e.sample}`,
  }))
  .sort((a, b) => b.captureCount - a.captureCount);
const newUrls = [...current].filter((u) => !hist.has(u));

await writeFile(
  path.join(OUT, 'wayback-inventory.json'),
  JSON.stringify(
    {
      domain: 'fbcmuncie.org',
      cdxQueriedAt: new Date().toISOString(),
      totalCaptures,
      firstCapture: first && iso(first),
      lastCapture: last && iso(last),
      capturesByYear: byYear,
      counts: {
        historicalUrls: hist.size,
        currentUrls: current.size,
        gone: gone.length,
        new: newUrls.length,
      },
      gone,
      newUrls,
      historicalUrls: [...hist.values()].map((e) => ({
        ...e,
        firstSeen: iso(e.firstSeen),
        lastSeen: iso(e.lastSeen),
      })),
      currentUrls: [...current].sort(),
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(
  'html 200 captures:',
  totalCaptures,
  '| first:',
  first && iso(first),
  '| last:',
  last && iso(last),
);
console.log('by year:', JSON.stringify(byYear));
console.log(
  'historical html urls:',
  hist.size,
  '| current:',
  current.size,
  '| GONE:',
  gone.length,
  '| new:',
  newUrls.length,
);
console.log('\n--- gone, most-captured first (top 40) ---');
for (const g of gone.slice(0, 40))
  console.log(String(g.captureCount).padStart(4), g.lastSeen, g.url);
if (gone.length > 40) console.log(`... and ${gone.length - 40} more`);
