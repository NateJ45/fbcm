// scaffold-file: church
// scripts/connect-ministries.mjs
//
// One-time migration: the five ministry bands on /ministries move into the five
// ministry documents, and the bands become "Ministry" bands that point at them.
//
// WHY (CLAUDE.md rule 15). Each band held its own copy of the ministry's words
// and ended with a contact line typed at SEED time from a staff document, so a
// new coordinator left the page naming the old one. The five ministry documents
// meanwhile held the unedited Wix text and were read by no page. After this
// runs, the document is the ministry's one home, and every contact line is
// generated at build time from the people the document names
// (src/lib/ministry-band.ts).
//
// The plan itself is PURE and lives in src/lib/connect-ministries.ts, so the
// thing that was proven (the parity simulation applied that exact plan in
// memory and /ministries rendered byte-identically) is the thing that runs.
//
// ORDER MATTERS. Run --write only AFTER the code that renders a Ministry band
// is on main and deployed. Every write fires the publish webhook, which
// rebuilds the live site from main; a build that does not know ministrySection
// would drop all five bands from the page.
//
// CLAUDE.md rule 16 discipline, copied from scripts/settings-placeholders.mjs:
//   1. DRY BY DEFAULT. It prints the whole plan and writes nothing. Only
//      --write acts.
//   2. BACKUP FIRST. With --write, every document it is about to touch (the page
//      and the five ministries, including the ministries' OLD text and photos)
//      is written verbatim to scripts/data/backups/ BEFORE anything is patched.
//   3. ONE TRANSACTION, every patch guarded by ifRevisionId, so the site never
//      rebuilds from a half-moved page, and a document edited since it was read
//      fails the whole run instead of being overwritten.
//   4. REFUSES on anything unexpected: a band or key missing, a band carrying a
//      field a Ministry band cannot keep, a contact name that does not match
//      exactly ONE staff member, a generated contact line that would not be the
//      line on the page now, or an unpublished draft of any document it touches.
//   5. IDEMPOTENT. A band already pointing at its ministry is left alone, and a
//      second run reports nothing to do.
//
// Usage:
//   node scripts/connect-ministries.mjs                         # the plan (needs .env token)
//   node scripts/connect-ministries.mjs --write                 # backup, then patch
//   node scripts/connect-ministries.mjs --from-file dump.json   # the plan, offline, from a
//                                                               # public query result (published docs)
//
// A dump for --from-file (no token needed):
//   curl -s -G "https://7jw947g5.apicdn.sanity.io/v2024-01-01/data/query/production" \
//     --data-urlencode 'query=*[_type in ["ministry","staffMember"] || _id in ["page-ministries","siteSettings"]]'

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MINISTRY_BANDS,
  PAGE_ID,
  pageSetPatch,
  planConnectMinistries,
} from '../src/lib/connect-ministries.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const fromIdx = args.indexOf('--from-file');
const FROM_FILE = fromIdx >= 0 ? args[fromIdx + 1] : null;

const MINISTRY_IDS = MINISTRY_BANDS.map((b) => b.ministryId);
const TOUCHED = [PAGE_ID, ...MINISTRY_IDS];

const stamp = new Date().toISOString().slice(0, 10);

function backupPath() {
  const base = resolve(__dirname, 'data', 'backups', `connect-ministries-${stamp}`);
  // A backup is a record: an earlier one from the same day is never overwritten.
  let path = `${base}.json`;
  let n = 1;
  while (existsSync(path)) {
    n += 1;
    path = `${base}-${n}.json`;
  }
  return path;
}

async function load() {
  if (FROM_FILE) {
    const raw = JSON.parse(readFileSync(FROM_FILE, 'utf8'));
    const docs = Array.isArray(raw) ? raw : raw.result;
    return { client: null, docs, drafts: docs.filter((d) => d._id.startsWith('drafts.')) };
  }
  // Imported lazily: sanity-lib exits when .env has no token, and --from-file
  // must work without one.
  const { client } = await import('./lib/sanity-lib.mjs');
  // RAW perspective, so drafts show up: a draft of the page or a ministry
  // would put the old band back, or wipe the new fields, the next time
  // somebody publishes it.
  const all = await client.fetch(
    `*[_type in ["ministry", "staffMember"] || _id in $ids || _id in $draftIds || _id == "siteSettings"]`,
    { ids: TOUCHED, draftIds: TOUCHED.map((id) => `drafts.${id}`) },
    { perspective: 'raw' },
  );
  return {
    client,
    docs: all.filter((d) => !d._id.startsWith('drafts.')),
    drafts: all.filter((d) => d._id.startsWith('drafts.')),
  };
}

const short = (s, n = 70) => {
  const t = String(s ?? '');
  return t.length > n ? `${t.slice(0, n - 3)}...` : t;
};
const imageLabel = (img) =>
  img
    ? `${img.asset?._ref ?? '(no asset)'}${img.alt ? `  alt "${img.alt}"` : '  (no alt)'}`
    : '(none)';
const plainText = (block) => (block.children ?? []).map((c) => c.text ?? '').join('');

async function main() {
  const { client, docs, drafts } = await load();
  const page = docs.find((d) => d._id === PAGE_ID);
  const ministries = docs.filter((d) => d._type === 'ministry');
  const staff = docs.filter((d) => d._type === 'staffMember');
  const settings = docs.find((d) => d._id === 'siteSettings') ?? null;

  const plan = planConnectMinistries({ page, ministries, staff, settings });

  const touchedDrafts = drafts.filter((d) => TOUCHED.includes(d._id.replace(/^drafts\./, '')));
  for (const d of touchedDrafts) {
    plan.errors.push(
      `${d._id} is an unpublished draft. Publish or discard it in the Studio first, or it will undo this.`,
    );
  }

  console.log(
    `connect-ministries: ${WRITE ? 'WRITE' : 'dry run'}${FROM_FILE ? ` (from ${FROM_FILE})` : ''}`,
  );
  if (!settings) console.log('  (no siteSettings in the input: placeholders are not applied)');

  for (const m of plan.ministries) {
    const doc = ministries.find((d) => d._id === m.id);
    console.log(`\n${m.id}  (rev ${m.rev})  <- band ${m.bandKey}`);
    if ('eyebrow' in m.set) console.log(`  set eyebrow    ${JSON.stringify(m.set.eyebrow)}`);
    if ('headline' in m.set) console.log(`  set headline   ${JSON.stringify(m.set.headline)}`);
    const body = m.set.body;
    console.log(
      `  set body       ${body.length} block(s) from the band, replacing the document's ${m.oldBodyBlocks} old block(s)`,
    );
    console.log(`                 first: ${JSON.stringify(short(plainText(body[0] ?? {})))}`);
    console.log(`                 last:  ${JSON.stringify(short(plainText(body.at(-1) ?? {})))}`);
    console.log(`  set contacts   ${m.contacts.map((c) => `${c.name} (${c.staffId})`).join(', ')}`);
    if ('image' in m.set) {
      console.log(`  set image      ${imageLabel(m.set.image)}`);
      console.log(`                 was ${imageLabel(doc?.image)}`);
    }
    for (const field of m.unset) {
      console.log(`  UNSET ${field}    was ${imageLabel(doc?.[field])}  (the band has no photo)`);
    }
    if (m.placeholderChanges > 0) {
      console.log(
        `  placeholders   ${m.placeholderChanges} field(s) had typed Site settings copies turned into placeholders`,
      );
    }
  }

  const pagePatch = pageSetPatch(plan);
  console.log(`\n${PAGE_ID}  (rev ${plan.page?.rev ?? '?'})`);
  for (const b of plan.bands) {
    const band = b.band;
    console.log(
      `  ${b.bandKey}: ${b.fromType} -> ministrySection -> ${band.ministry._ref}` +
        `  (anchor #${band.anchor?.current ?? '-'}, photo side ${band.imageSide ?? '-'})`,
    );
  }
  const untouched = (page?.pageBuilder ?? [])
    .filter((b) => !plan.bands.some((x) => x.bandKey === b._key))
    .map((b) => `${b._key} (${b._type})`);
  console.log(`  left untouched: ${untouched.join(', ')}`);
  if (plan.alreadyConnected.length) {
    console.log(`  already Ministry bands, nothing to do: ${plan.alreadyConnected.join(', ')}`);
  }

  const dropped = plan.ministries.filter((m) => m.droppedImage);
  console.log(`\nOld ministry-document photos this REMOVES (kept verbatim in the backup):`);
  if (dropped.length === 0) console.log('  none');
  for (const m of dropped) console.log(`  ${m.id}: ${imageLabel(m.droppedImage)}`);

  if (plan.errors.length) {
    console.error(`\nREFUSING: ${plan.errors.length} problem(s):`);
    for (const e of plan.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const expected = MINISTRY_BANDS.length - plan.alreadyConnected.length;
  if (plan.bands.length !== expected || plan.ministries.length !== expected) {
    console.error(`\nREFUSING: planned ${plan.bands.length} band(s), expected ${expected}.`);
    process.exit(1);
  }
  if (plan.bands.length === 0) {
    console.log('\nNothing to do: every band already points at its ministry.');
    return;
  }
  console.log(
    `\n${plan.ministries.length} ministry document(s) and ${plan.bands.length} band(s) on ${PAGE_ID}.`,
  );

  if (!WRITE) {
    console.log('Dry run. Nothing written. Add --write to back up and patch.');
    return;
  }
  if (!client) {
    console.error('--write needs the live client; do not combine it with --from-file.');
    process.exit(1);
  }

  const touchedDocs = [page, ...plan.ministries.map((m) => ministries.find((d) => d._id === m.id))];
  const path = backupPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(touchedDocs, null, 2) + '\n');
  console.log(`\nBacked up ${touchedDocs.length} document(s) verbatim to ${path}`);

  // One transaction. The ministries are patched before the page in the same
  // commit, so the references the page gains always point at filled documents.
  const tx = client.transaction();
  for (const m of plan.ministries) {
    tx.patch(m.id, (p) => {
      let patch = p.ifRevisionId(m.rev).set(m.set);
      if (m.unset.length) patch = patch.unset(m.unset);
      return patch;
    });
  }
  tx.patch(PAGE_ID, (p) => p.ifRevisionId(plan.page.rev).set(pagePatch));
  const res = await tx.commit();
  console.log(
    `Patched ${plan.ministries.length + 1} document(s) in one transaction (${res.transactionId}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
