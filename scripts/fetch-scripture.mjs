// Foundation, edit with care
// =============================================================================
// The passage text behind every sermon preview's reading (2026-09-24,
// feat/scripture-text).
// =============================================================================
// Runs in `npm run build` after the share cards and before Astro, and writes
// src/data/scripture.generated.json (gitignored): reading -> its verses in one
// translation. The post page reads that file with an eager glob, so a missing
// file (a fresh clone, no Sanity project) simply means no passages, and every
// reading renders exactly as it did before this pass.
//
// WHY A SCRIPT AND NOT THE PAGE. The post pages prerender inside workerd,
// which has no real disk, and the brief is a disk cache so that a rebuild (and
// CI, which restores node_modules/.cache) does not fetch the Bible again. So
// the network and the disk live here, in Node, exactly as the share cards do
// (scripts/generate-og-pages.mjs), and the page only reads a JSON file.
//
// WHICH READINGS. Every sermon preview's, derived exactly as the page derives
// them: the masthead's Reading row (readingOf over the opening text) and the
// body's "The reading" block (findLection, through prepareBody). Nothing is
// stored in Sanity (CLAUDE.md rule 15). Sanity is only READ, never written.
//
// WHICH TRANSLATION (src/lib/scripture-text.ts is the one place it is set).
//   - BSB, the Berean Standard Bible (public domain), from bible.helloao.org,
//     one chapter per request, each chapter fetched once per build and cached
//     forever (a public-domain text does not change).
//   - NIV, when API_BIBLE_KEY is set and API.Bible says that key has the NIV.
//     Biblica allows 500 verses without written permission, under a quarter
//     of any book; allocateTranslations() gives the NIV to the newest readings
//     first and the rest fall back to the BSB with a warning. Never silently
//     over-quoted. NIV text is cached at most 14 days (API.Bible's terms).
//     API.Bible also requires its FUMS view tracker wherever its text is
//     shown; the FUMS tokens are written into the manifest for the page.
//
// NEVER FAILS THE BUILD. Any error (network, a 404, a reading that does not
// parse, a verse a chapter does not have) drops that one passage with a
// warning; the page then prints the reading as before. Concurrency is at most
// four requests in flight.
//
// Run by hand with `npm run scripture`. `--no-network` uses the cache only.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { loadEnv } from './lib/loadEnv.mjs';
import { pool, cached } from './lib/scripture-cache.mjs';

const started = Date.now();
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// The passages belong to the `journal` scaffold capability. A fork that
// removed it has no src/lib/scripture-text.ts, and this script then skips
// itself (it runs inside `npm run build`, so it must not fail there). The
// journal modules are imported dynamically for the same reason.
if (!existsSync(resolve(root, 'src/lib/scripture-text.ts'))) {
  console.log('[scripture] the journal capability is not here: nothing to do.');
  process.exit(0);
}
const { entryIsSermonPreview } = await import('../src/lib/blog-derive.ts');
const { openingText, prepareBody } = await import('../src/lib/post-body.ts');
const { readingOf, sundayOf, isoDay } = await import('../src/lib/sermon-derive.ts');
const {
  TRANSLATIONS,
  DEFAULT_TRANSLATION,
  PREFERRED_TRANSLATION,
  passageSpans,
  chaptersOf,
  chapterKey,
  versesOfHelloao,
  versesOfBracketText,
  sliceSpans,
  allocateTranslations,
  verseKeysOf,
  readingKey,
} = await import('../src/lib/scripture-text.ts');

const outPath = resolve(root, 'src/data/scripture.generated.json');
const cacheDir = resolve(root, 'node_modules/.cache/scripture');
const offline = process.argv.includes('--no-network');
const CONCURRENCY = 4;
const TIMEOUT_MS = 15_000;
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
const UA = 'fbcm-site build (https://www.fbcmuncie.org)';

const warn = (msg) => console.warn(`[scripture] warning: ${msg}`);
const write = (passages) => {
  mkdirSync(dirname(outPath), { recursive: true });
  const body = JSON.stringify({ passages }, null, 1) + '\n';
  // Unchanged content is not rewritten, so Vite sees no change on a warm build.
  if (existsSync(outPath) && readFileSync(outPath, 'utf8') === body) return;
  writeFileSync(outPath, body);
};

const env = loadEnv(root);
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
if (!projectId || projectId === 'your-project-id') {
  console.log(
    '[scripture] PUBLIC_SANITY_PROJECT_ID not set: no passages (readings render as before).',
  );
  write({});
  process.exit(0);
}

async function getJson(url, headers = {}) {
  if (offline) throw new Error('offline (--no-network)');
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok)
    throw new Error(`HTTP ${res.status} for ${url.replace(/api-key=[^&]+/, 'api-key=…')}`);
  return res.json();
}

// ---- 1. The readings ---------------------------------------------------------
const client = createClient({
  projectId,
  dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
  useCdn: true,
  perspective: 'published',
  ...(env.SANITY_API_READ_TOKEN ? { token: env.SANITY_API_READ_TOKEN } : {}),
});

let entries;
try {
  entries = await client.fetch(
    `*[_type == "journalEntry" && defined(slug.current)]{ _id, publishedAt, slug, categories[]->{ title, slug }, body }`,
  );
} catch (err) {
  // Keep whatever the last good run wrote: a Sanity hiccup must not blank it.
  warn(`could not read the posts (${err?.message ?? err}); keeping the previous passages`);
  if (!existsSync(outPath)) write({});
  process.exit(0);
}

/** reading key -> { reading, newest (YYYY-MM-DD), posts, words } */
const readings = new Map();
let previews = 0;
for (const e of entries ?? []) {
  if (!entryIsSermonPreview(e)) continue;
  previews += 1;
  const body = Array.isArray(e.body) ? e.body : [];
  const found = new Set();
  const masthead = readingOf(openingText(body));
  if (masthead) found.add(masthead);
  for (const node of prepareBody(body, { preview: true })) {
    if (node?._type === 'journalLection' && node.reference) found.add(node.reference);
  }
  const sunday = sundayOf(e.publishedAt);
  const day = sunday ? isoDay(sunday) : '0000-00-00';
  const words = openingText(body, 10_000).split(/\s+/).filter(Boolean).length;
  for (const reading of found) {
    const key = readingKey(reading);
    const r = readings.get(key) ?? { reading: key, newest: day, posts: [], words: [] };
    if (day > r.newest) r.newest = day;
    r.posts.push(e.slug?.current ?? e._id);
    r.words.push(words);
    readings.set(key, r);
  }
}

// ---- 2. The BSB, one chapter at a time -----------------------------------------
const spansByReading = new Map();
for (const [key] of readings) {
  const spans = passageSpans(key);
  if (!spans.length) warn(`"${key}" does not read as a reference; left as it is`);
  else spansByReading.set(key, spans);
}
const chapterRefs = new Map();
for (const spans of spansByReading.values())
  for (const c of chaptersOf(spans)) chapterRefs.set(chapterKey(c.code, c.chapter), c);

const stats = { network: 0, cache: 0, failed: 0 };
const bsbDir = resolve(cacheDir, 'BSB');
const bsbChapters = new Map();
await pool([...chapterRefs.values()], CONCURRENCY, async ({ code, chapter }) => {
  const r = await cached({
    dir: bsbDir,
    key: chapterKey(code, chapter),
    fetcher: async () =>
      versesOfHelloao(await getJson(`https://bible.helloao.org/api/BSB/${code}/${chapter}.json`)),
    valid: (v) => Array.isArray(v) && v.length > 0,
  });
  if (r.value) {
    bsbChapters.set(chapterKey(code, chapter), r.value);
    stats[r.source] += 1;
  } else {
    stats.failed += 1;
    warn(`BSB ${code} ${chapter} unavailable (${r.error}); its readings are left as they are`);
  }
});

const bsbPassages = new Map();
for (const [key, spans] of spansByReading) {
  const verses = sliceSpans(spans, bsbChapters);
  if (verses) bsbPassages.set(key, verses);
  else if (
    spans.every((s) => chaptersOf([s]).every((c) => bsbChapters.has(chapterKey(c.code, c.chapter))))
  )
    warn(`"${key}" asks for verses the BSB chapter does not have; left as it is`);
}

/** The largest share of any page showing `k` that its passage would be. */
const workShareOf = (k, verses) => {
  const pw = verses.reduce((n, v) => n + v.text.split(/\s+/).length, 0);
  return Math.max(...readings.get(k).words.map((w) => pw / Math.max(1, w + pw)));
};

// ---- 3. The NIV, when a key allows it --------------------------------------------
const passages = {};
const niv = TRANSLATIONS[PREFERRED_TRANSLATION];
const key = niv.keyEnv ? env[niv.keyEnv] : '';
let allocation = null;
let nivServed = 0;
if (key && !offline) {
  const API = 'https://rest.api.bible/v1';
  const headers = { 'api-key': key };
  let available = false;
  try {
    const b = await getJson(`${API}/bibles/${niv.providerId}`, headers);
    available = !!b?.data?.id;
  } catch (err) {
    warn(
      `API_BIBLE_KEY is set but the NIV is not available to it (${err?.message ?? err}); using the ${DEFAULT_TRANSLATION}`,
    );
  }
  if (available) {
    // Book sizes for the quarter-of-a-book rule, from the BSB's book list
    // (verse numbering matches the NIV's to within a handful of verses).
    const books = await cached({
      dir: cacheDir,
      key: 'BSB-books',
      fetcher: async () => {
        const j = await getJson('https://bible.helloao.org/api/BSB/books.json');
        return Object.fromEntries((j.books ?? []).map((b) => [b.id, b.totalNumberOfVerses]));
      },
      valid: (v) => !!v && typeof v === 'object' && Object.keys(v).length === 66,
    });
    const totals = new Map(Object.entries(books.value ?? {}));
    allocation = allocateTranslations(
      [...bsbPassages].map(([k, verses]) => ({
        reading: k,
        newest: readings.get(k).newest,
        verseKeys: verseKeysOf(spansByReading.get(k)[0].code, verses),
        workShare: workShareOf(k, verses),
      })),
      niv,
      totals,
    );
    for (const r of allocation.overflow)
      warn(
        `"${r}" would take the NIV past Biblica's allowance; shown in the ${DEFAULT_TRANSLATION}`,
      );
    const nivDir = resolve(cacheDir, 'NIV');
    const toFetch = [...allocation.byReading].filter(([, t]) => t === 'NIV').map(([k]) => k);
    await pool(toFetch, CONCURRENCY, async (k) => {
      const spans = spansByReading.get(k);
      const verses = [];
      const fums = [];
      for (const s of spans) {
        const from = `${s.code}.${s.startChapter}${s.startVerse ? `.${s.startVerse}` : ''}`;
        const to = `${s.code}.${s.endChapter}${s.endVerse ? `.${s.endVerse}` : ''}`;
        const id = from === to ? from : `${from}-${to}`;
        const r = await cached({
          dir: nivDir,
          key: id,
          maxAgeMs: FOURTEEN_DAYS,
          fetcher: async () => {
            const q =
              'content-type=text&include-verse-numbers=true&include-titles=false&include-notes=false&include-chapter-numbers=false';
            const j = await getJson(`${API}/bibles/${niv.providerId}/passages/${id}?${q}`, headers);
            return {
              verses: versesOfBracketText(j?.data?.content ?? '', s.startChapter),
              fums: j?.meta?.fumsToken ?? '',
              copyright: j?.data?.copyright ?? '',
            };
          },
          valid: (v) => Array.isArray(v?.verses) && v.verses.length > 0,
        });
        if (!r.value) {
          warn(`NIV ${id} unavailable (${r.error}); "${k}" shown in the ${DEFAULT_TRANSLATION}`);
          return;
        }
        verses.push(...r.value.verses);
        if (r.value.fums) fums.push(r.value.fums);
      }
      passages[k] = { translation: 'NIV', verses, ...(fums.length ? { fums } : {}) };
      nivServed += 1;
    });
  }
} else if (key && offline) {
  warn('--no-network: the NIV needs the network; using the BSB cache');
}

for (const [k, verses] of bsbPassages) {
  if (!passages[k]) passages[k] = { translation: DEFAULT_TRANSLATION, verses };
}

// Sorted, so the file is byte-stable from one build to the next.
const sorted = Object.fromEntries(
  Object.keys(passages)
    .sort()
    .map((k) => [k, passages[k]]),
);
write(sorted);

// ---- 4. The report -----------------------------------------------------------------
const verseCount = Object.values(sorted).reduce((n, p) => n + p.verses.length, 0);
const unique = new Set();
const byBook = new Map();
for (const [k, p] of Object.entries(sorted)) {
  const code = spansByReading.get(k)[0].code;
  for (const v of p.verses) {
    const id = `${code}.${v.chapter}.${v.verse}`;
    if (unique.has(id)) continue;
    unique.add(id);
    byBook.set(code, (byBook.get(code) ?? 0) + 1);
  }
}
const withText = [...readings.values()]
  .filter((r) => sorted[r.reading])
  .reduce((n, r) => n + r.posts.length, 0);
console.log(
  `[scripture] ${Object.keys(sorted).length} of ${readings.size} readings (${previews} previews, ${withText} post readings with text); ` +
    `${verseCount} verses (${unique.size} distinct); chapters: ${stats.network} fetched, ${stats.cache} cached, ${stats.failed} failed; ` +
    `${nivServed ? `${nivServed} NIV, ` : ''}${((Date.now() - started) / 1000).toFixed(1)}s`,
);
// `--report`: the numbers behind the NIV decision. What the site would quote
// (distinct verses, the largest share of any book), and what the NIV cap would
// do with it, simulated with or without a key.
if (process.argv.includes('--report')) {
  const books = await cached({
    dir: cacheDir,
    key: 'BSB-books',
    fetcher: async () => {
      const j = await getJson('https://bible.helloao.org/api/BSB/books.json');
      return Object.fromEntries((j.books ?? []).map((b) => [b.id, b.totalNumberOfVerses]));
    },
    valid: (v) => !!v && typeof v === 'object' && Object.keys(v).length === 66,
  });
  const totals = new Map(Object.entries(books.value ?? {}));
  const shares = [...byBook]
    .map(([code, n]) => ({
      code,
      verses: n,
      of: totals.get(code),
      share: n / (totals.get(code) ?? 1),
    }))
    .sort((a, b) => b.share - a.share);
  const sim = allocateTranslations(
    [...bsbPassages].map(([k, verses]) => ({
      reading: k,
      newest: readings.get(k).newest,
      verseKeys: verseKeysOf(spansByReading.get(k)[0].code, verses),
      workShare: workShareOf(k, verses),
    })),
    niv,
    totals,
  );
  const ratios = [...bsbPassages]
    .flatMap(([k, verses]) => {
      const pw = verses.reduce((n, v) => n + v.text.split(/\s+/).length, 0);
      return readings.get(k).words.map((w) => pw / Math.max(1, w + pw));
    })
    .sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        distinctVerses: unique.size,
        topBookShares: shares.slice(0, 6),
        nivSimulation: {
          readingsInNiv: [...sim.byReading.values()].filter((t) => t === 'NIV').length,
          readingsInBsb: sim.overflow.length,
          nivVerses: sim.preferredVerses,
        },
        passageShareOfPage: {
          median: ratios[Math.floor(ratios.length / 2)],
          max: ratios[ratios.length - 1],
          over25pct: ratios.filter((r) => r >= 0.25).length,
          of: ratios.length,
        },
      },
      null,
      1,
    ),
  );
}
