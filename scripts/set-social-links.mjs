// Adds the church's Facebook and Instagram to Site settings' socialLinks
// (2026-09-24). Nathan confirmed both are still the church's; both answered
// 200 with the church's name in the page title that day. They were on the Wix
// nav but never reached this dataset. Once set, they render in the footer and
// join the Church node's sameAs (src/lib/church-schema.ts).
//
// Dry by default (CLAUDE.md rule 16): prints the plan and writes nothing.
// --apply writes the live document to scripts/data/backups/ first, then appends
// only the links whose URL is not already present, so a second run is a no-op.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, APPLY, key } from './lib/sanity-lib.mjs';

const LINKS = [
  { platform: 'Facebook', url: 'https://www.facebook.com/firstbaptistmuncie' },
  { platform: 'Instagram', url: 'https://www.instagram.com/fbcmuncie/' },
];

const norm = (u) =>
  String(u ?? '')
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '')
    .toLowerCase();

const doc = await client.fetch('*[_id == "siteSettings"][0]');
if (!doc) throw new Error('siteSettings not found');
const have = new Set((doc.socialLinks ?? []).map((l) => norm(l?.url)));
const add = LINKS.filter((l) => !have.has(norm(l.url))).map((l) => ({
  _key: key(),
  _type: 'socialLink',
  ...l,
}));

console.log(`socialLinks now: ${JSON.stringify(doc.socialLinks ?? [])}`);
if (add.length === 0) {
  console.log('Nothing to add: both links are already there.');
  process.exit(0);
}
for (const l of add) console.log(`would append: ${l.platform} ${l.url}`);

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
const file = join(dir, `siteSettings-2026-09-24-pre-social-links.json`);
writeFileSync(file, JSON.stringify(doc, null, 2));
console.log(`backup: ${file}`);

await client
  .patch('siteSettings')
  .setIfMissing({ socialLinks: [] })
  .append('socialLinks', add)
  .commit();
console.log(`appended ${add.length} link(s).`);
