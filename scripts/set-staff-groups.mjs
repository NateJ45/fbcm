// scripts/set-staff-groups.mjs
//
// Plan 2a added staffMember.group (pastors | coordination | support) and the
// staffGridSection that filters on it, but every live staff document still
// has group: null. This script sets that field from the roles the church
// itself published on the old Wix team page, adds Julie Kirklin (who has a
// role and a bio in ministers.txt but never got her own /team/ page, so
// import-people.mjs never created a document for her), and corrects Andy
// Heimlich's moderator email (the Wix page printed
// moderator[at]fbcmuncie.org in text but linked the mailto: to worship@).
//
// CLAUDE.md rule 16: retiring/changing data means backup-then-write, dry by
// default, never a raw update. This script:
//   1. Fetches every staffMember document.
//   2. Writes each one, verbatim, to a committed backup file BEFORE any
//      write happens (only under --apply; a dry run touches no files).
//   3. Plans `set group` only where the computed group differs from what is
//      stored, `createIfNotExists` for Julie Kirklin, and the moderator email
//      fix guarded on the exact current value.
//   4. Prints the whole plan as a table. Is DRY BY DEFAULT; only --apply
//      writes. A second dry run after --apply should say "nothing to do".
//
// Usage:
//   node scripts/set-staff-groups.mjs            # prints the plan
//   node scripts/set-staff-groups.mjs --apply     # writes backups + patches

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client, APPLY, makeUploader, ROOT, toPT } from './lib/sanity-lib.mjs';
import { CURRENT_STAFF } from '../src/lib/fbcm-redirects.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = resolve(__dirname, 'data', 'backups');
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive', 'images');
const uploader = makeUploader();

// Group is derived from the role the church itself gave each person on the
// Wix team page; this map is the one place that reading is written down.
const GROUP_BY_SLUG = {
  'kendall-ellis': 'pastors',
  'jonathan-balmer': 'pastors',
  'cynthia-smith': 'pastors',
  'caroline-koby': 'support',
  'ella-mae-lemen': 'support',
  'julie-kirklin': 'support',
};
// Everyone else on the Church Coordination Team:
const DEFAULT_GROUP = 'coordination';

// --- Julie Kirklin: never got a /team/ page on the old site, so
// import-people.mjs never created a document for her. Her role and bio come
// from scripts/data/pages/ministers.txt line 113 (verbatim), her portrait
// from the images manifest entry whose alt is "Julie_DSC_0606.jpg".
const JULIE_SLUG = 'julie-kirklin';
const JULIE_ID = `staff-${JULIE_SLUG}`;
const JULIE_NAME = 'Julie Kirklin';
const JULIE_ROLE = 'Pianist / Organist';
const JULIE_BIO =
  'The pianist/ organist helps lead us in worship. She is also often available for funerals and weddings. Julie has been a longtime member of FBCM.';
const JULIE_PHOTO_FILE = '08181c_5990e1bfb2df439a9a678cd46159bf52_tilde_mv2.jpg';

// --- Andy Heimlich (Moderator): the Wix page printed moderator[at]fbcmuncie.org
// as text but the mailto: link it actually rendered pointed at worship@. Fix
// only lands if the stored value is one of the two known-bad states, never a
// blind overwrite.
const MODERATOR_SLUG = 'andy-heimlich';
const MODERATOR_EMAIL_CORRECT = 'moderator@fbcmuncie.org';
const MODERATOR_EMAIL_KNOWN_BAD = new Set([null, undefined, 'worship@fbcmuncie.org']);

async function imageRefFor(file) {
  if (!APPLY) return { _type: 'image', asset: { _type: 'reference', _ref: `dry-run:${file}` } };
  const imagePath = resolve(ARCHIVE, file);
  if (!existsSync(imagePath)) {
    throw new Error(`set-staff-groups: missing archive file ${imagePath}`);
  }
  const assetId = await uploader.upload(imagePath);
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
}

async function main() {
  const staff = await client.fetch('*[_type == "staffMember"]');
  const bySlug = new Map(staff.map((s) => [s.slug?.current, s]));

  // CURRENT_STAFF is the hand-maintained list checked against the captured
  // Wix pages (fbcm-redirects.test.ts). Every slug it names should already be
  // a document here (Julie Kirklin is intentionally excluded from that check
  // -- see the comment on CURRENT_STAFF -- but she's not read from here yet
  // either, so nothing to warn about for her specifically).
  for (const slug of CURRENT_STAFF) {
    if (slug !== JULIE_SLUG && !bySlug.has(slug)) {
      console.warn(`WARNING: CURRENT_STAFF lists "${slug}" but no staffMember doc has that slug.`);
    }
  }

  const groupPlan = [];
  for (const doc of staff) {
    const slug = doc.slug?.current;
    const group = GROUP_BY_SLUG[slug] ?? DEFAULT_GROUP;
    if (doc.group !== group) {
      groupPlan.push({ doc, from: doc.group ?? null, to: group });
    }
  }

  const julieDoc = bySlug.get(JULIE_SLUG) ?? staff.find((s) => s._id === JULIE_ID);
  let createJuliePlan = null;
  if (!julieDoc) {
    const supportOrders = staff
      .filter((s) => (GROUP_BY_SLUG[s.slug?.current] ?? DEFAULT_GROUP) === 'support')
      .map((s) => s.order ?? 0);
    const order = (supportOrders.length ? Math.max(...supportOrders) : 0) + 1;
    createJuliePlan = { order };
  }

  const andy = bySlug.get(MODERATOR_SLUG);
  let emailPlan = null;
  if (andy && andy.email !== MODERATOR_EMAIL_CORRECT && MODERATOR_EMAIL_KNOWN_BAD.has(andy.email)) {
    emailPlan = { doc: andy, from: andy.email ?? null, to: MODERATOR_EMAIL_CORRECT };
  }

  // --- print the plan table ---------------------------------------------
  const rows = [
    ...groupPlan.map((p) => ({
      action: 'set group',
      id: p.doc._id,
      name: p.doc.name,
      change: `${p.from ?? '(null)'} -> ${p.to}`,
    })),
    ...(createJuliePlan
      ? [
          {
            action: 'create',
            id: JULIE_ID,
            name: JULIE_NAME,
            change: `group=support, order=${createJuliePlan.order}, role="${JULIE_ROLE}", photo, bio`,
          },
        ]
      : []),
    ...(emailPlan
      ? [
          {
            action: 'set email',
            id: emailPlan.doc._id,
            name: emailPlan.doc.name,
            change: `${emailPlan.from ?? '(null)'} -> ${emailPlan.to}`,
          },
        ]
      : []),
  ];

  console.log('Plan:');
  if (rows.length === 0) {
    console.log('  nothing to do.');
  } else {
    const w1 = Math.max(...rows.map((r) => r.action.length), 'action'.length);
    const w2 = Math.max(...rows.map((r) => r.id.length), 'id'.length);
    const w3 = Math.max(...rows.map((r) => r.name.length), 'name'.length);
    const line = (a, b, c, d) => `  ${a.padEnd(w1)}  ${b.padEnd(w2)}  ${c.padEnd(w3)}  ${d}`;
    console.log(line('action', 'id', 'name', 'change'));
    console.log(line('-'.repeat(w1), '-'.repeat(w2), '-'.repeat(w3), '-'.repeat(6)));
    for (const r of rows) console.log(line(r.action, r.id, r.name, r.change));
  }
  console.log(APPLY ? '\nAPPLYING...' : '\nDRY RUN. Re-run with --apply to write.');

  if (!APPLY) return;

  // --- backups, verbatim, BEFORE any write --------------------------------
  mkdirSync(BACKUP_DIR, { recursive: true });
  for (const doc of staff) {
    const backupPath = resolve(
      BACKUP_DIR,
      `staffMember-${doc.slug?.current}-2026-09-19-plan2b.json`,
    );
    writeFileSync(backupPath, JSON.stringify(doc, null, 2) + '\n');
  }
  console.log(`Backed up ${staff.length} staffMember document(s) to ${BACKUP_DIR}`);

  // --- Julie's photo + bio need to be prepared before the transaction, since
  // the upload itself is not part of the atomic Sanity write. -------------
  let julieDocBody = null;
  if (createJuliePlan) {
    const photo = await imageRefFor(JULIE_PHOTO_FILE);
    julieDocBody = {
      _id: JULIE_ID,
      _type: 'staffMember',
      name: JULIE_NAME,
      slug: { _type: 'slug', current: JULIE_SLUG },
      role: JULIE_ROLE,
      bio: toPT(JULIE_BIO),
      photo,
      group: 'support',
      order: createJuliePlan.order,
    };
  }

  // --- one transaction for every write this run makes --------------------
  const tx = client.transaction();
  for (const p of groupPlan) tx.patch(p.doc._id, (patch) => patch.set({ group: p.to }));
  if (julieDocBody) tx.createIfNotExists(julieDocBody);
  if (emailPlan) tx.patch(emailPlan.doc._id, (patch) => patch.set({ email: emailPlan.to }));
  await tx.commit();

  console.log(
    `\nApplied: ${groupPlan.length} group patch(es), ` +
      `${julieDocBody ? 1 : 0} create(s), ${emailPlan ? 1 : 0} email patch(es).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
