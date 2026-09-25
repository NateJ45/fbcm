// Foundation, edit with care
// =============================================================================
// The Visitor's covers and words, drawn from its PDFs at build time
// (2026-09-24, feat/the-visitor).
// =============================================================================
// Runs in `npm run build` after the scripture step and before Astro. For every
// issue of The Visitor it finds (src/lib/visitor-issues.ts says what an issue
// is), it draws page 1 as WebP covers at 240, 480, 720 and 960 pixels wide and reads
// every page's text, with pdfjs (scripts/lib/pdf-pages.mjs). Nothing is
// uploaded to Sanity and nothing is stored there: the covers are derived from
// the files the church already uploaded (CLAUDE.md rule 15).
//
// WHAT IT WRITES
//   public/visitor/covers/<asset id>-<width>.webp  (gitignored) the covers,
//       served at /visitor/covers/ like the share cards in public/og/.
//   src/data/visitor.generated.json  (gitignored) which covers exist, the
//       page's proportions, where the list lives and its newest issue. Read
//       by DocumentList (the /visitor page), the home band and the footer.
//   node_modules/.cache/visitor/records.json  every issue's words as search
//       records, for scripts/pagefind-index.mjs. Kept out of src/ so the
//       newsletters' prose never reaches Tailwind's class scan.
//
// THE CACHE. node_modules/.cache/visitor/<asset id>/ holds each issue's covers,
// its text and a meta.json. A file's asset id is the hash of its bytes, so a
// cached issue is never drawn again; a warm build downloads nothing. CI
// restores the folder (ci.yml, deploy.yml). A cold build downloads every
// issue once (about 630 MB for the forty-odd issues on file today) and keeps
// only the covers and the text (about 10 MB).
//
// WHERE THE ISSUES COME FROM
//   - The /visitor page: the first document list on it that is made only of
//     issues. Its newest issue is the home band's, and its words go into the
//     search. Until that page is published there is no home band and no
//     search record; nothing points anywhere that does not exist yet.
//   - The committed page fixture, scripts/data/fixtures/visitor.json (written
//     by `node scripts/page-fixture.mjs visitor`), which /styleguide/visitor
//     renders: its covers are drawn too, so the composed page can be looked at
//     before it is applied.
//   - VISITOR_FIXTURE=1 (the Playwright build only, playwright.config.ts):
//     the fixture stands in for the /visitor page, so the home band and the
//     search are tested on fixed data. No deploy sets it.
//
// NEVER FAILS THE BUILD. A file that will not download, open or draw loses its
// cover (the page sets a typeset cover in its place, IssueCover.astro) or its
// words, with a warning. A download failure is not cached, so the next build
// tries again; a file pdfjs cannot draw is cached as failed, so a broken PDF is
// not downloaded again every build (delete its cache folder to retry).
//
// Run by hand with `npm run visitor`.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const started = Date.now();
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const log = (msg) => console.log(`[visitor] ${msg}`);
const warn = (msg) => console.warn(`[visitor] warning: ${msg}`);

const manifestPath = resolve(root, 'src/data/visitor.generated.json');
const cacheDir = resolve(root, 'node_modules/.cache/visitor');
const recordsPath = join(cacheDir, 'records.json');
const publicDir = resolve(root, 'public/visitor/covers');
const fixturePath = resolve(root, 'scripts/data/fixtures/visitor.json');
const CACHE_VERSION = 1;
const CONCURRENCY = 3;
const TIMEOUT_MS = 180_000;

const write = (manifest, records) => {
  mkdirSync(dirname(manifestPath), { recursive: true });
  const body = `${JSON.stringify(manifest, null, 1)}\n`;
  // Unchanged content is not rewritten, so Vite sees no change on a warm build.
  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== body) {
    writeFileSync(manifestPath, body);
  }
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(recordsPath, JSON.stringify(records));
};
const empty = { source: null, listHref: null, latest: null, covers: {} };

// The Visitor belongs to the `church` scaffold capability. A fork that removed
// it has no src/lib/visitor-issues.ts, and this step then skips itself (it
// runs inside `npm run build`, so it must not fail there).
if (!existsSync(resolve(root, 'src/lib/visitor-issues.ts'))) {
  log('the church capability is not here: nothing to do.');
  process.exit(0);
}
const { COVER_WIDTHS, isIssueList, issuesOf, latestIssue, issueRecord } =
  await import('../src/lib/visitor-issues.ts');
const { loadEnv } = await import('./lib/loadEnv.mjs');
const { pool } = await import('./lib/scripture-cache.mjs');

const env = { ...loadEnv(root), ...process.env };
const fixtureMode = env.VISITOR_FIXTURE === '1';

/** The first document list in a pageBuilder that is The Visitor's. */
function issueListIn(pageBuilder) {
  for (const block of Array.isArray(pageBuilder) ? pageBuilder : []) {
    if (block?._type !== 'documentListSection') continue;
    const docs = Array.isArray(block.docs) ? block.docs : [];
    if (isIssueList(docs)) return docs;
  }
  return null;
}

// ---- 1. The issues --------------------------------------------------------------
let fixtureDocs = null;
if (existsSync(fixturePath)) {
  try {
    fixtureDocs = issueListIn(JSON.parse(readFileSync(fixturePath, 'utf8')).pageBuilder);
  } catch (err) {
    warn(`could not read ${fixturePath} (${err.message})`);
  }
}

let siteDocs = null;
let source = null;
let listHref = null;
if (fixtureMode) {
  siteDocs = fixtureDocs;
  source = fixtureDocs ? 'fixture' : null;
  listHref = fixtureDocs ? '/styleguide/visitor' : null;
} else {
  const projectId = env.PUBLIC_SANITY_PROJECT_ID;
  if (projectId && projectId !== 'your-project-id') {
    const { createClient } = await import('@sanity/client');
    const client = createClient({
      projectId,
      dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
      useCdn: true,
      perspective: 'published',
      ...(env.SANITY_API_READ_TOKEN ? { token: env.SANITY_API_READ_TOKEN } : {}),
    });
    try {
      const page = await client.fetch(
        `*[_type == "page" && slug.current == "visitor" && archived != true][0]{
          pageBuilder[_type == "documentListSection"]{
            _type,
            docs[]{ title, year, note, "fileUrl": file.asset->url, "fileSize": file.asset->size }
          }
        }`,
      );
      siteDocs = page ? issueListIn(page.pageBuilder) : null;
      if (siteDocs) {
        source = 'visitor';
        listHref = '/visitor';
      }
    } catch (err) {
      // Keep whatever the last good run wrote: a Sanity hiccup must not blank it.
      warn(`could not read the /visitor page (${err?.message ?? err}); keeping the last manifest`);
      if (!existsSync(manifestPath)) write(empty, []);
      process.exit(0);
    }
  } else {
    log('PUBLIC_SANITY_PROJECT_ID not set: the site has no issues (the fixture still draws).');
  }
}

const siteIssues = siteDocs ? issuesOf(siteDocs) : [];
const allIssues = [...siteIssues, ...(fixtureDocs ? issuesOf(fixtureDocs) : [])];

// One job per file, however many lists hold it.
const jobs = new Map();
for (const issue of allIssues) {
  if (issue.key && !jobs.has(issue.key)) jobs.set(issue.key, issue);
}

// ---- 2. Draw and read, cached by asset id ---------------------------------------
let pdf = null;
let sharp = null;
async function tools() {
  pdf ??= await import('./lib/pdf-pages.mjs');
  sharp ??= (await import('sharp')).default;
  return { pdf, sharp };
}

const readMeta = (dir) => {
  try {
    const m = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
    return m?.v === CACHE_VERSION ? m : null;
  } catch {
    return null;
  }
};

let drawn = 0;
let fromCache = 0;
let failed = 0;
let downloaded = 0;

async function processIssue(issue) {
  const dir = join(cacheDir, issue.key);
  const cached = readMeta(dir);
  if (cached) {
    fromCache += 1;
    return cached;
  }
  let bytes;
  try {
    const res = await fetch(issue.href, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bytes = Buffer.from(await res.arrayBuffer());
    downloaded += bytes.length;
  } catch (err) {
    // Not cached: the next build tries again.
    failed += 1;
    warn(`${issue.label}: could not download ${issue.href} (${err.message}); no cover this build`);
    return null;
  }
  const meta = { v: CACHE_VERSION, ok: false, w: 0, h: 0, widths: [], chars: 0 };
  mkdirSync(dir, { recursive: true });
  const { pdf: lib, sharp: sh } = await tools();
  try {
    await lib.withPdf(bytes, async (doc) => {
      try {
        const widest = Math.max(...COVER_WIDTHS);
        const { png, pageWidth, pageHeight } = await lib.coverPng(doc, widest);
        for (const w of COVER_WIDTHS) {
          await sh(png)
            .resize({ width: w })
            .webp({ quality: w >= 720 ? 72 : 76, effort: 5 })
            .toFile(join(dir, `cover-${w}.webp`));
        }
        Object.assign(meta, {
          ok: true,
          w: Math.round(pageWidth),
          h: Math.round(pageHeight),
          widths: [...COVER_WIDTHS],
        });
        drawn += 1;
      } catch (err) {
        meta.error = `cover: ${err.message}`;
        warn(
          `${issue.label}: could not draw the cover (${err.message}); a typeset cover stands in`,
        );
      }
      try {
        const text = await lib.documentText(doc);
        writeFileSync(join(dir, 'text.txt'), text);
        meta.chars = text.length;
      } catch (err) {
        meta.error = `${meta.error ? `${meta.error}; ` : ''}text: ${err.message}`;
        warn(`${issue.label}: could not read the text (${err.message}); not searchable`);
      }
    });
  } catch (err) {
    meta.error = `open: ${err.message}`;
    warn(`${issue.label}: pdfjs could not open the file (${err.message})`);
  }
  if (!meta.ok) failed += 1;
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(meta)}\n`);
  return meta;
}

const metas = new Map();
await pool([...jobs.values()], CONCURRENCY, async (issue) => {
  try {
    const meta = await processIssue(issue);
    if (meta) metas.set(issue.key, meta);
  } catch (err) {
    failed += 1;
    warn(`${issue.label}: ${err.message}`);
  }
});

// ---- 3. Publish the covers --------------------------------------------------------
const covers = {};
const wanted = new Set();
mkdirSync(publicDir, { recursive: true });
for (const [key, meta] of metas) {
  if (!meta.ok) continue;
  // A width added to COVER_WIDTHS after an issue was cached is made from its
  // widest cached cover, so a new size never downloads the PDF again.
  const widest = join(cacheDir, key, `cover-${Math.max(...meta.widths)}.webp`);
  for (const w of COVER_WIDTHS) {
    const file = join(cacheDir, key, `cover-${w}.webp`);
    if (meta.widths.includes(w) || !existsSync(widest) || w > Math.max(...meta.widths)) continue;
    try {
      const { sharp: sh } = await tools();
      await sh(widest).resize({ width: w }).webp({ quality: 74, effort: 5 }).toFile(file);
      meta.widths = [...meta.widths, w].sort((a, b) => a - b);
      writeFileSync(
        join(cacheDir, key, 'meta.json'),
        `${JSON.stringify(meta)}
`,
      );
    } catch (err) {
      warn(`${key}: could not make the ${w}px cover (${err.message})`);
    }
  }
  const widths = meta.widths.filter((w) => existsSync(join(cacheDir, key, `cover-${w}.webp`)));
  if (widths.length === 0) continue;
  for (const w of widths) {
    const from = join(cacheDir, key, `cover-${w}.webp`);
    const name = `${key}-${w}.webp`;
    const to = join(publicDir, name);
    wanted.add(name);
    if (!existsSync(to) || statSync(to).size !== statSync(from).size) copyFileSync(from, to);
  }
  covers[key] = { w: meta.w, h: meta.h, widths };
}
// A cover whose issue left every list leaves public/ too.
for (const name of readdirSync(publicDir)) {
  if (!wanted.has(name)) rmSync(join(publicDir, name), { force: true });
}

// ---- 4. The search records and the manifest --------------------------------------
const records = [];
for (const issue of siteIssues) {
  if (!issue.key) continue;
  const textFile = join(cacheDir, issue.key, 'text.txt');
  if (!existsSync(textFile)) continue;
  const record = issueRecord(issue, readFileSync(textFile, 'utf8'));
  if (record) records.push(record);
}

// The home band's issue. Its cover travels with it so the band needs nothing else.
const latest = latestIssue(siteIssues);
write(
  {
    source,
    listHref,
    latest,
    covers,
  },
  records,
);

log(
  `${jobs.size} issue file(s): ${drawn} drawn, ${fromCache} from cache, ${failed} without a cover` +
    `${downloaded ? `, ${(downloaded / 1e6).toFixed(0)} MB downloaded` : ''}; ` +
    `${records.length} search record(s); list ${source ?? 'not published'}` +
    `${latest ? `, latest ${latest.label}` : ''} (${Date.now() - started} ms)`,
);
