// Jonathan's corrections of 2026-10-19 (the "Images to replace" PDF), applied to the LIVE
// documents with targeted patches, because the live pages have drifted from their seeds.
//
//   Home      "What to expect" pair: dinner -> Life Group conversation, two little girls
//             -> story time on the steps. Goal doors: The Way -> Life Group by the fire,
//             Witness -> bagging lunches at Muncie Central, Work -> clothing shelves
//             (Serve Your City volunteer day). Hero slideshow: the fellowship-luncheon and
//             four-children frames come out, a Christmas Eve candlelight frame goes in.
//   Ministries  hero window, musicians light -> the guitarist portrait Jonathan chose;
//             the two Sunday classes become one, "Children's Sunday School (102)".
//   Visit     the same one-class change in the Children section.
//   Wedding   hero label says "Weddings and building use"; the closing band no longer says
//             "Talk to the office" with the Sunday service time (nobody is in the office
//             then): it says "Contact us." with the street address.
//   Site settings  the nav item "Weddings" -> "Weddings & Events".
//
// DRY BY DEFAULT: prints each change and writes nothing. `--write` saves the touched
// documents verbatim to scripts/data/backups/jonathan-corrections-<date>.json (never
// overwriting an earlier one), then patches them in one transaction, each guarded on the
// revision it was read at. NCS_PRODUCTION_WRITE=yes is also needed (PORTS.md card 86).
//
//   node scripts/apply-jonathan-corrections-2026-10-19.mjs
//   NCS_PRODUCTION_WRITE=yes node scripts/apply-jonathan-corrections-2026-10-19.mjs --write
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client, dataset } from './lib/sanity-lib.mjs';
import { requireProductionWrite } from './lib/production-write.mjs';
import { LIBRARY_SOURCES } from './lib/page-images.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');
requireProductionWrite({ write: WRITE, dataset, flag: '--write' });

const PHOTOS = {
  expectDinner: {
    file: 'adult-life-group-circle.jpg',
    alt: 'Members of a Life Group talk and laugh around a back-yard fire on an autumn evening',
    hotspot: [0.5, 0.5],
  },
  expectChildren: {
    file: 'children-story-steps.png',
    alt: 'A leader tells a story to children sitting on carpeted steps',
    hotspot: [0.5, 0.5],
  },
  way: {
    file: 'adult-life-group-fire.jpg',
    alt: 'A Life Group meets around a back-yard fire pit, Bibles open on their laps',
    hotspot: [0.5, 0.5],
  },
  witness: {
    file: 'outreach-muncie-central-bags.jpg',
    alt: 'Volunteers lay out rows of bagged lunches in a room at Muncie Central High School',
    hotspot: [0.5, 0.5],
  },
  work: {
    file: 'serve-clothing-shelves.jpg',
    alt: 'A volunteer in a Serve Your City shirt sorts folded clothing on the shelves',
    hotspot: [0.5, 0.4],
  },
  christmas: {
    file: 'christmas-eve-candles.jpg',
    alt: 'The congregation stands in the pews with candles at the Christmas Eve service',
    hotspot: [0.5, 0.5],
  },
  guitar: {
    file: 'music-guitar-fellowship-hall.jpg',
    alt: 'A man in a plaid shirt plays an acoustic guitar beside a music stand in the fellowship hall',
    hotspot: [0.4, 0.4],
  },
};

const assets = await client.fetch(
  `*[_type == "sanity.imageAsset" && source.name in $sources && source.id in $files]{_id, "file": source.id}`,
  { files: Object.values(PHOTOS).map((p) => p.file), sources: LIBRARY_SOURCES },
);
function image(key, extra = {}) {
  const p = PHOTOS[key];
  const a = assets.find((x) => x.file === p.file);
  if (!a) throw new Error(`${p.file} is not in the media library (add-church-photos.mjs)`);
  return {
    _type: 'image',
    ...extra,
    asset: { _type: 'reference', _ref: a._id },
    alt: p.alt,
    hotspot: {
      _type: 'sanity.imageHotspot',
      x: p.hotspot[0],
      y: p.hotspot[1],
      width: 0.3,
      height: 0.3,
    },
  };
}

const ids = ['homePage', 'page-ministries', 'page-visit', 'page-wedding', 'siteSettings'];
const docs = await client.fetch(`*[_id in $ids]`, { ids });
const byId = Object.fromEntries(docs.map((d) => [d._id, d]));
for (const id of ids) if (!byId[id]) throw new Error(`${id}: no such document`);
const sec = (doc, key) => {
  const s = doc.pageBuilder.find((x) => x._key === key);
  if (!s) throw new Error(`${doc._id}: no section ${key}`);
  return s;
};

// Each patch is a function returning [documentId, mutate(doc) -> new field values].
const changes = [];
const log = (msg) => console.log(`  ${msg}`);

// ---- Home ----
{
  const doc = byId.homePage;
  const pb = structuredClone(doc.pageBuilder);
  const get = (key) => pb.find((s) => s._key === key);
  const photos = get('home-sundays').photos;
  photos[photos.findIndex((p) => p._key === 'expect-dinner')] = image('expectDinner', {
    _key: 'expect-dinner',
  });
  photos[photos.findIndex((p) => p._key === 'expect-children')] = image('expectChildren', {
    _key: 'expect-children',
  });
  log('home: What to expect photos (dinner, children) replaced');
  const cards = get('home-goals').cards;
  for (const [key, photo] of [
    ['goal-way', 'way'],
    ['goal-witness', 'witness'],
    ['goal-work', 'work'],
  ]) {
    cards.find((c) => c._key === key).image = image(photo);
    log(`home: ${key} photo replaced`);
  }
  const hero = get('home-hero');
  const before = hero.frames.length;
  // frame-9 is the women's fellowship luncheon, frame-6 the four children at the entrance.
  hero.frames = hero.frames.filter((f) => !['frame-6', 'frame-9'].includes(f._key));
  hero.frames.push(image('christmas', { _key: 'frame-13' }));
  log(
    `home: hero slideshow ${before} -> ${hero.frames.length} frames (removed frame-6, frame-9; added Christmas Eve candles)`,
  );
  changes.push(['homePage', { pageBuilder: pb }]);
}

// ---- Ministries ----
{
  const doc = byId['page-ministries'];
  const pb = structuredClone(doc.pageBuilder);
  const hero = pb.find((s) => s._key === 'ministries-hero') ?? pb[0];
  const i = hero.frames.findIndex((f) => f._key === 'frame-3');
  if (i < 0) throw new Error('ministries hero has no frame-3');
  hero.frames[i] = image('guitar', { _key: 'frame-3' });
  log('ministries: hero musicians light -> guitarist portrait');
  const row = pb.find((s) => s._key === 'ministries-sunday').rows.find((r) => r._key === 'row-3');
  row.body = row.body.filter((b) => b._key !== 'wrb-4');
  const k = row.body.find((b) => b._key === 'wrb-3');
  k.children = [
    { ...k.children[0], text: "Children's Sunday School (102): Preschool - 5th grade" },
  ];
  const intro = row.body.find((b) => b._key === 'wr-1');
  intro.children = [
    {
      ...intro.children[0],
      text: intro.children[0].text.replace("Children's Church", "Children's Sunday School"),
    },
  ];
  log("ministries: one class, Children's Sunday School (102)");
  changes.push(['page-ministries', { pageBuilder: pb }]);
}

// ---- Visit ----
{
  const doc = byId['page-visit'];
  const pb = structuredClone(doc.pageBuilder);
  const s = pb.find((x) => x._key === 'visit-children');
  const set = (key, text) => {
    const b = s.body.find((x) => x._key === key);
    b.children = [{ ...b.children[0], text }];
  };
  set('kids5', "Children's Sunday School (102)");
  set(
    'kids6-1',
    "Students preschool - fifth grade will be dismissed to Children's Sunday School during the service.",
  );
  s.body = s.body.filter((b) => !['kids7-1', 'kids8-1', 'kids9-1'].includes(b._key));
  log("visit: Children section is one class, Children's Sunday School (102)");
  changes.push(['page-visit', { pageBuilder: pb }]);
}

// ---- Wedding ----
{
  const doc = byId['page-wedding'];
  const pb = structuredClone(doc.pageBuilder);
  sec(doc, 'wed-hero'); // existence check
  pb.find((x) => x._key === 'wed-hero').eyebrow = 'Weddings and building use';
  const cta = pb.find((x) => x._key === 'wed-cta');
  cta.headline = 'Contact us.';
  cta.subhead = '309 East Adams Street, Muncie, IN 47305.';
  log('wedding: hero label and closing band (Contact us. + address) updated');
  changes.push(['page-wedding', { pageBuilder: pb }]);
}

// ---- Nav ----
{
  const doc = byId.siteSettings;
  const navItems = structuredClone(doc.navItems);
  const item = navItems.find((n) => n._key === 'nav-weddings');
  item.label = 'Weddings & Events';
  log('siteSettings: nav "Weddings" -> "Weddings & Events"');
  changes.push(['siteSettings', { navItems }]);
}

if (!WRITE) {
  console.log(
    '\nDry run. Nothing written. Add --write (and NCS_PRODUCTION_WRITE=yes) to back up and patch.',
  );
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 10);
const base = resolve(__dirname, 'data', 'backups', `jonathan-corrections-${stamp}`);
let path = `${base}.json`;
for (let n = 2; existsSync(path); n++) path = `${base}-${n}.json`;
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, JSON.stringify(docs, null, 2) + '\n');
console.log(`\nBacked up ${docs.length} documents verbatim to ${path}`);

const tx = client.transaction();
for (const [id, fields] of changes) {
  tx.patch(id, (p) => p.ifRevisionId(byId[id]._rev).set(fields));
}
const res = await tx.commit();
console.log(`Patched ${changes.length} documents in one transaction (${res.transactionId}).`);
