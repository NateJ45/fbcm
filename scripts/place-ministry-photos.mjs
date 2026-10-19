// Sets the photograph on four Ministry documents from the Sanity media library
// (the photo placement pass, 2026-09-23; youth, adult and outreach renewed on
// 2026-10-19 from the photos the church sent, scripts/data/church-photos-2026-10.json).
// The Ministries page draws each ministry's band from its own document
// (src/lib/ministry-band.ts), so the photo lives there, not in scripts/pages/ministries.mjs.
//
//   Youth     was two teens singing on a stage, from the Wix years: now ping pong in
//             the youth room, a church member against two teens.
//   Adult     a women's fellowship breakfast from 2026-09-23 until a Life Group
//             around a fire pit, Bibles open, replaced it.
//   Outreach  the Serve Your City team from 2026-09-23 until volunteers bringing lunch
//             to Muncie Central High School replaced it.
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
import { client, dataset } from './lib/sanity-lib.mjs';
import { requireProductionWrite } from './lib/production-write.mjs';
import { LIBRARY_SOURCES } from './lib/page-images.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');
// --write is this script's own flag, and sanity-lib's production check only
// sees --apply, so the second factor is checked here as well (PORTS.md card 86):
// a production write needs NCS_PRODUCTION_WRITE=yes in the same command.
requireProductionWrite({ write: WRITE, dataset, flag: '--write' });

const PLACEMENTS = [
  {
    id: 'ministry-youth',
    file: 'youth-ping-pong.jpg',
    alt: 'A church member takes on two teenagers at ping pong in the youth room',
  },
  {
    id: 'ministry-adult',
    file: 'adult-life-group-fire.jpg',
    alt: 'A Life Group meets around a back-yard fire pit, Bibles open on their laps',
  },
  {
    id: 'ministry-outreach',
    file: 'outreach-muncie-central-arrival.jpg',
    alt: 'Two church volunteers wheel a cart of catered lunches up to Muncie Central High School',
    // A portrait with the volunteers at the left edge; the band's arch crops the
    // sides, so the focus keeps them in it.
    hotspot: { x: 0.3, y: 0.6 },
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
    `*[_type == "sanity.imageAsset" && source.name in $sources && source.id in $files]{_id, "file": source.id}`,
    { files: PLACEMENTS.map((p) => p.file), sources: LIBRARY_SOURCES },
  );

  const plan = [];
  for (const p of PLACEMENTS) {
    const doc = docs.find((d) => d._id === p.id);
    if (!doc) throw new Error(`${p.id}: no such document`);
    const asset = assets.find((a) => a.file === p.file);
    if (!asset)
      throw new Error(
        `${p.file} is not in the media library; run upload-photo-library.mjs or add-church-photos.mjs`,
      );
    const current = doc.image?.asset?._ref ?? null;
    const hotspot = p.hotspot
      ? { _type: 'sanity.imageHotspot', ...p.hotspot, width: 0.3, height: 0.3 }
      : undefined;
    const done =
      current === asset._id &&
      doc.image?.alt === p.alt &&
      doc.image?.hotspot?.x === hotspot?.x &&
      doc.image?.hotspot?.y === hotspot?.y;
    console.log(
      `${done ? 'already set' : 'SET        '} ${p.id.padEnd(18)} ` +
        `${current ?? '(no photo)'} -> ${asset._id}\n${' '.repeat(31)}alt: "${p.alt}"` +
        (hotspot ? `\n${' '.repeat(31)}focus: ${hotspot.x}, ${hotspot.y}` : ''),
    );
    if (!done) plan.push({ doc, asset, alt: p.alt, hotspot });
  }

  if (!plan.length) return console.log('\nNothing to do.');
  if (!WRITE) return console.log('\nDry run. Nothing written. Add --write to back up and patch.');

  const path = backupPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(docs, null, 2) + '\n');
  console.log(`\nBacked up ${docs.length} document(s) verbatim to ${path}`);

  const tx = client.transaction();
  for (const { doc, asset, alt, hotspot } of plan) {
    tx.patch(doc._id, (patch) =>
      patch.ifRevisionId(doc._rev).set({
        image: {
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id },
          alt,
          ...(hotspot ? { hotspot } : {}),
        },
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
