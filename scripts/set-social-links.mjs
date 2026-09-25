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
  // Added 2026-09-25: the church's Threads and Linktree, from the Wix site.
  { platform: 'Threads', url: 'https://www.threads.net/@fbcmuncie' },
  { platform: 'Linktree', url: 'https://linktr.ee/fbcmuncie' },
];

const norm = (u) =>
  String(u ?? '')
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '')
    .toLowerCase();

const doc = await client.fetch('*[_id == "siteSettings"][0]');
if (!doc) throw new Error('siteSettings not found');
const have = new Set((doc.socialLinks ?? []).map((l) => norm(l?.url)));
// Keys named after the platform, never the shared k0, k1 counter: the links
// written on 2026-09-24 already hold k0 and k1, and a repeated _key breaks the
// array in the Studio.
const taken = new Set((doc.socialLinks ?? []).map((l) => l?._key));
const add = LINKS.filter((l) => !have.has(norm(l.url))).map((l) => ({
  _key: [`social-${l.platform.toLowerCase()}`, key()].find((k) => !taken.has(k)),
  _type: 'socialLink',
  ...l,
}));

console.log(`socialLinks now: ${JSON.stringify(doc.socialLinks ?? [])}`);
if (add.length === 0) {
  console.log('Nothing to add: both links are already there.');
  process.exit(0);
}
for (const l of add) console.log(`would append: ${l.platform} ${l.url} (key ${l._key})`);

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
const file = join(
  dir,
  `siteSettings-${new Date().toISOString().slice(0, 10)}-pre-social-links.json`,
);
writeFileSync(file, JSON.stringify(doc, null, 2));
console.log(`backup: ${file}`);

await client
  .patch('siteSettings')
  .setIfMissing({ socialLinks: [] })
  .append('socialLinks', add)
  .commit();
console.log(`appended ${add.length} link(s).`);
