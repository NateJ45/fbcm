// Points the Wix /publications redirect at The Visitor's own page (2026-09-24,
// feat/the-visitor). The redirect document `redirect-publications` sends
// /publications to /blog#publications, where the newsletter list used to be;
// the list is now /visitor (scripts/pages/visitor.mjs), so the redirect should
// land there directly. src/lib/fbcm-redirects.ts already says /visitor, so a
// full re-import would agree; this touches the one document only.
//
// RUN IT AFTER the /visitor page is published (npm run seed-pages -- --only
// visitor --apply) and before or with the next build: redirects are read at
// build time (astro.config.mjs), and a redirect to a page that does not exist
// yet is a 301 to a 404.
//
// Dry by default (CLAUDE.md rule 16): prints the plan and writes nothing.
// --apply writes the live document to scripts/data/backups/ first, then patches
// `to` and `note` only when they differ, so a second run is a no-op. It refuses
// if /visitor is not published yet.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, APPLY } from './lib/sanity-lib.mjs';
import { fbcmRedirects } from '../src/lib/fbcm-redirects.ts';

const ID = 'redirect-publications';
const want = fbcmRedirects().find((r) => r.from === '/publications');
if (!want) throw new Error('src/lib/fbcm-redirects.ts has no /publications entry');

const doc = await client.fetch('*[_id == $id][0]', { id: ID });
if (!doc)
  throw new Error(`${ID} is not in the dataset; node scripts/import-redirects.mjs writes it.`);
console.log(`${ID} now: ${doc.from} -> ${doc.to} (${doc.note ?? 'no note'})`);

if (doc.to === want.to && doc.note === want.note) {
  console.log('Nothing to change: it already points at /visitor.');
  process.exit(0);
}
console.log(`would set:    ${doc.from} -> ${want.to} (${want.note})`);

const page = await client.fetch('*[_id == "page-visitor"][0]{_id, archived}');
if (!page || page.archived === true) {
  console.log('\n/visitor is not published yet, so this would redirect to a 404.');
  console.log('Publish it first: npm run seed-pages -- --only visitor --apply');
  if (APPLY) process.exit(1);
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
let file = join(dir, `${ID}-2026-09-24-pre-visitor.json`);
for (let n = 2; existsSync(file); n += 1)
  file = join(dir, `${ID}-2026-09-24-pre-visitor-${n}.json`);
writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`backup: ${file}`);

await client.patch(ID).set({ to: want.to, note: want.note }).commit();
console.log(`set ${ID}: /publications -> ${want.to}`);
