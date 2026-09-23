// Sets the photograph on three Ministry documents from the Sanity media library
// (the photo placement pass, 2026-09-23). The Ministries page draws each ministry's
// band from its own document (src/lib/ministry-band.ts), so the photo lives there,
// not in scripts/pages/ministries.mjs.
//
//   Adult     had no photo, so its band drew as text: a women's fellowship breakfast.
//   Outreach  had no photo either: the Serve Your City team.
//   Children  used the four-children photo that the home hero and /visit also used:
//             now children singing on stage at Vacation Bible School.
//
// The alt text is also the caption printed under the photo (ministry.ts), so it is
// written to read as one.
//
// DRY BY DEFAULT: prints each document's current photo and the one it would set,
// and writes nothing. `--write` first saves the three documents verbatim to
// scripts/data/backups/place-ministry-photos-<date>.json (never overwriting an
// earlier backup), then patches them in one transaction, each guarded on the
// revision it was read at. Re-running after a write reports "already set".
//
//   node scripts/place-ministry-photos.mjs           # dry run
//   node scripts/place-ministry-photos.mjs --write   # backup, then patch
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client } from './lib/sanity-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');

const PLACEMENTS = [
  {
    id: 'ministry-adult',
    file: '08181c_ea565de6ebd54eb492cc0160af1b3853_tilde_mv2.jpg',
    alt: 'Women of the church around a table at a fellowship breakfast',
  },
  {
    id: 'ministry-outreach',
    file: '81f7ac_4dfaba15047d43a696c7e8f53df065b8_tilde_mv2.jpg',
    alt: 'The Serve Your City team, all ages, holding up the day’s shirt',
  },
  {
    id: 'ministry-children',
    file: '08181c_ae634c5828aa4df499d03f5ae09104d7_tilde_mv2.jpg',
    alt: 'Children singing on stage at Vacation Bible School',
  },
];

function backupPath() {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = resolve(__dirname, 'data', 'backups', `place-ministry-photos-${stamp}`);
  let path = `${base}.json`;
  for (let n = 2; existsSync(path); n++) path = `${base}-${n}.json`;
  return path;
}

async function main() {
  const docs = await client.fetch(`*[_id in $ids]`, { ids: PLACEMENTS.map((p) => p.id) });
  const assets = await client.fetch(
    `*[_type == "sanity.imageAsset" && source.name == "fbcm-wix-archive" && source.id in $files]{_id, "file": source.id}`,
    { files: PLACEMENTS.map((p) => p.file) },
  );

  const plan = [];
  for (const p of PLACEMENTS) {
    const doc = docs.find((d) => d._id === p.id);
    if (!doc) throw new Error(`${p.id}: no such document`);
    const asset = assets.find((a) => a.file === p.file);
    if (!asset)
      throw new Error(`${p.file} is not in the media library; run upload-photo-library.mjs`);
    const current = doc.image?.asset?._ref ?? null;
    const done = current === asset._id && doc.image?.alt === p.alt;
    console.log(
      `${done ? 'already set' : 'SET        '} ${p.id.padEnd(18)} ` +
        `${current ?? '(no photo)'} -> ${asset._id}\n${' '.repeat(31)}alt: "${p.alt}"`,
    );
    if (!done) plan.push({ doc, asset, alt: p.alt });
  }

  if (!plan.length) return console.log('\nNothing to do.');
  if (!WRITE) return console.log('\nDry run. Nothing written. Add --write to back up and patch.');

  const path = backupPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(docs, null, 2) + '\n');
  console.log(`\nBacked up ${docs.length} document(s) verbatim to ${path}`);

  const tx = client.transaction();
  for (const { doc, asset, alt } of plan) {
    tx.patch(doc._id, (patch) =>
      patch.ifRevisionId(doc._rev).set({
        image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt },
      }),
    );
  }
  const res = await tx.commit();
  console.log(`Patched ${plan.length} document(s) in one transaction (${res.transactionId}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
