// scripts/reimport-post-bodies.mjs
// Re-import ONLY `body` on the 142 imported posts, with the structure plan 1
// dropped: headings, links, lists, blockquotes and inline images.
//
// Dry by default. `--apply` is the only thing that writes, and the first thing
// it writes is the BACKUP: all 142 live bodies, verbatim, keyed by `_id`, into
// scripts/data/backups/. Nothing is patched until that file is on disk
// (CLAUDE.md rule 16). An existing backup is never overwritten, because the
// second run's "before" is the first run's "after" and overwriting it would
// throw away the only copy of the originals.
//
// The rules all live in src/lib/convert-body.ts, which is unit tested. This
// file only reads captures, parses HTML, uploads images and patches documents.
//
// Flags:
//   (none)          print the plan, write nothing
//   --apply         back up, then patch `body` on every post that differs
//   --only a,b,c    limit the run to those slugs
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { client, APPLY, makeUploader, ROOT } from './lib/sanity-lib.mjs';
import { bodyFromCaptureRich, postDocId } from '../src/lib/import-post.ts';

const POSTS = resolve(ROOT, 'scripts/data/posts');
// The binaries are not in the repo. See ../fbcm-archive/README.md.
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive', 'images');
const BACKUP_DIR = resolve(ROOT, 'scripts/data/backups');
const BACKUP = resolve(BACKUP_DIR, 'journalEntry-bodies-2026-09-20.json');

const onlyFlag = process.argv.indexOf('--only');
const only =
  onlyFlag === -1
    ? null
    : new Set(
        (process.argv[onlyFlag + 1] ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );

// --- the captures ------------------------------------------------------------
const captures = readdirSync(POSTS)
  .filter((f) => f.endsWith('.json') && f !== 'index.json')
  .map((f) => JSON.parse(readFileSync(resolve(POSTS, f), 'utf8')))
  .filter((c) => !only || only.has(c.slug))
  .sort((a, b) => a.slug.localeCompare(b.slug));

if (!captures.length) {
  console.error(only ? `No capture matched --only ${[...only].join(',')}` : 'No captures found.');
  process.exit(1);
}

// --- the live bodies ---------------------------------------------------------
// Fetched once, up front, because they are both the comparison and the backup.
const live = await client.fetch('*[_type == "journalEntry"]{_id, "slug": slug.current, body}');
const liveById = new Map(live.map((doc) => [doc._id, doc]));
console.log(`live journalEntry documents: ${live.length}`);

// --- the uploader ------------------------------------------------------------
// Real uploads write assets to Sanity, so a DRY run must not make any. It reuses
// whatever scripts/.asset-map.json already holds and marks the rest pending, so
// the dry plan still shows every picture that would be carried.
const uploader = makeUploader();
const pending = new Set();
const uploadImage = async (relPath) => {
  const absolute = resolve(ARCHIVE, relPath);
  if (APPLY) return uploader.upload(absolute);
  pending.add(relPath);
  return 'image-not-yet-uploaded';
};

/** Stable stringify, so key ORDER never masquerades as a content change. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

// --- the plan ----------------------------------------------------------------
const totals = {
  posts: 0,
  changed: 0,
  unchanged: 0,
  notLive: 0,
  paragraphsBefore: 0,
  blocks: 0,
  h2: 0,
  h3: 0,
  h4: 0,
  links: 0,
  listItems: 0,
  quotes: 0,
  images: 0,
  missingImages: 0,
  embeds: 0,
  tables: 0,
  emDashes: 0,
};
const missingImages = [];
const emDashPosts = [];
const plan = [];

for (const captured of captures) {
  const id = postDocId(captured.slug);
  const current = liveById.get(id);
  const { blocks, report } = await bodyFromCaptureRich(captured, {
    parseHtml: (html) => new JSDOM(html).window.document,
    uploadImage,
  });

  totals.posts++;
  const before = current?.body?.length ?? 0;
  totals.paragraphsBefore += before;
  if (report) {
    for (const k of [
      'blocks',
      'h2',
      'h3',
      'h4',
      'links',
      'listItems',
      'quotes',
      'images',
      'embeds',
      'tables',
      'emDashes',
    ]) {
      totals[k] += report[k];
    }
    totals.missingImages += report.missingImages.length;
    for (const src of report.missingImages) missingImages.push(`${captured.slug}: ${src}`);
    if (report.emDashes) emDashPosts.push(`${captured.slug}: ${report.emDashes}`);
  } else {
    totals.blocks += blocks.length;
  }

  if (!current) {
    totals.notLive++;
    console.log(`${captured.slug}: NOT IN DATASET (${id})`);
    continue;
  }

  const same = canonical(current.body) === canonical(blocks);
  if (same) totals.unchanged++;
  else totals.changed++;

  const counts = report
    ? `(h2 ${report.h2}, h3 ${report.h3}, links ${report.links}, lists ${report.listItems}, ` +
      `quotes ${report.quotes}, images ${report.images}, missing-images ` +
      `${report.missingImages.length}, embeds ${report.embeds})`
    : '(no bodyHtml: paragraph fallback)';
  console.log(
    `${captured.slug}: ${same ? 'unchanged, ' : ''}paragraphs ${before} -> blocks ${blocks.length} ${counts}`,
  );

  if (!same) plan.push({ _id: id, body: blocks });
}

// --- the summary -------------------------------------------------------------
console.log(
  `\nposts: ${totals.posts} | changed: ${totals.changed} | unchanged: ${totals.unchanged}` +
    (totals.notLive ? ` | not in dataset: ${totals.notLive}` : ''),
);
console.log(
  `totals: paragraphs ${totals.paragraphsBefore} -> blocks ${totals.blocks} ` +
    `(h2 ${totals.h2}, h3 ${totals.h3}, h4 ${totals.h4}, links ${totals.links}, ` +
    `lists ${totals.listItems}, quotes ${totals.quotes}, images ${totals.images}, ` +
    `missing-images ${totals.missingImages}, embeds ${totals.embeds}, tables ${totals.tables}, ` +
    `em-dashes ${totals.emDashes})`,
);
if (missingImages.length) {
  console.log(`\nimages with no file in the archive: ${missingImages.length}`);
  for (const m of missingImages) console.log('  ', m);
}
if (emDashPosts.length) {
  console.log(
    `\nem-dashes in the church's own words (left as written): ${emDashPosts.length} post(s)`,
  );
  for (const m of emDashPosts) console.log('  ', m);
}
if (!APPLY && pending.size) {
  console.log(`\nimages that would be uploaded on --apply: ${pending.size}`);
}

if (!APPLY) {
  console.log(`\nDRY RUN, nothing written. Pass --apply to write.`);
  process.exit(0);
}

// --- apply -------------------------------------------------------------------
// The backup comes first, and covers EVERY live post, not only the ones that
// change, so one file restores the whole set.
if (existsSync(BACKUP)) {
  console.log(`\nbackup already exists, keeping it: ${BACKUP}`);
} else {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const byId = {};
  for (const doc of live) byId[doc._id] = { slug: doc.slug, body: doc.body ?? null };
  writeFileSync(
    BACKUP,
    JSON.stringify({ takenAt: new Date().toISOString(), documents: byId }, null, 2),
    'utf8',
  );
  console.log(`\nbacked up ${live.length} bodies to ${BACKUP}`);
}

if (!plan.length) {
  console.log('nothing to patch: every body already matches the converter.');
  process.exit(0);
}

let patched = 0;
for (let i = 0; i < plan.length; i += 50) {
  const batch = plan.slice(i, i + 50);
  let tx = client.transaction();
  // ONLY `body`. Everything else on the document is the editor's now.
  for (const { _id, body } of batch) tx = tx.patch(_id, (p) => p.set({ body }));
  await tx.commit();
  patched += batch.length;
  console.log(`patched ${patched}/${plan.length}`);
}
console.log(`\nAPPLIED: body re-imported on ${patched} post(s).`);
