// scripts/set-staff-order.mjs
//
// Ruling P17: the pastors group renders in the wrong order.
//
// scripts/set-staff-groups.mjs filed Kendall Ellis, Jonathan Balmer and
// Cynthia Smith under `group: 'pastors'` but left `order` as the import wrote
// it, which was alphabetical by first name in tens: Cynthia 40, Jonathan 100,
// Kendall 110. So the staff grid on /who-we-are (and, later, /staff) leads
// with the Worship Arts Director and puts the Co-Pastors after her. Section
// 5.6 of docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md asks for
// Kendall, Jonathan, Cynthia.
//
// Two numbers move, and only two: Kendall to 90 and Cynthia to 120, which puts
// the three in the spec's order around Jonathan's untouched 100. Nobody else's
// order changes, and no other field is written.
//
// Same shape as its sibling set-staff-groups.mjs, for the same reason
// (CLAUDE.md rule 16):
//   1. DRY BY DEFAULT. Only --apply writes anything, files included.
//   2. GUARDED. Each patch is planned only when the stored value is EXACTLY
//      the one this ruling was made about (110 for Kendall, 40 for Cynthia).
//      A document already moved, by this script or by hand, plans nothing, so
//      a second run says "nothing to do" rather than re-writing.
//   3. BACKUP FIRST. Every staffMember document is written verbatim to
//      scripts/data/backups/ BEFORE the transaction, under this ruling's own
//      -order suffix so it cannot overwrite the group run's backups.
//
// Usage:
//   node scripts/set-staff-order.mjs            # prints the plan
//   node scripts/set-staff-order.mjs --apply    # writes backups + patches

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client, APPLY } from './lib/sanity-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = resolve(__dirname, 'data', 'backups');

// The date in the backup filename is the ruling's date, not the run's: these
// files are the record of ONE decision, and a re-run on another day should not
// scatter the evidence across two names.
const BACKUP_STAMP = '2026-09-20-plan2b-order';

// slug -> { from, to }. `from` is the guard: the patch is planned only when the
// stored order is exactly this.
const ORDER_PLAN = {
  'kendall-ellis': { from: 110, to: 90 },
  'cynthia-smith': { from: 40, to: 120 },
};

async function main() {
  const staff = await client.fetch('*[_type == "staffMember"]');
  const bySlug = new Map(staff.map((s) => [s.slug?.current, s]));

  const rows = [];
  const skipped = [];
  for (const [slug, { from, to }] of Object.entries(ORDER_PLAN)) {
    const doc = bySlug.get(slug);
    if (!doc) {
      skipped.push(`${slug}: no staffMember document with that slug`);
      continue;
    }
    if (doc.order === to) continue; // already where the ruling wants it
    if (doc.order !== from) {
      skipped.push(
        `${slug}: order is ${doc.order ?? '(null)'}, not the ${from} this ruling was made ` +
          'about. Left alone.',
      );
      continue;
    }
    rows.push({ id: doc._id, name: doc.name, from, to });
  }

  console.log('Plan:');
  if (rows.length === 0) {
    console.log('  nothing to do.');
  } else {
    const w1 = Math.max(...rows.map((r) => r.id.length), 'id'.length);
    const w2 = Math.max(...rows.map((r) => r.name.length), 'name'.length);
    const line = (a, b, c) => `  ${a.padEnd(w1)}  ${b.padEnd(w2)}  ${c}`;
    console.log(line('id', 'name', 'order'));
    console.log(line('-'.repeat(w1), '-'.repeat(w2), '-'.repeat(5)));
    for (const r of rows) console.log(line(r.id, r.name, `${r.from} -> ${r.to}`));
  }
  for (const s of skipped) console.log(`  SKIPPED ${s}`);
  console.log(APPLY ? '\nAPPLYING...' : '\nDRY RUN. Re-run with --apply to write.');

  if (!APPLY || rows.length === 0) return;

  // --- backups, verbatim, BEFORE any write --------------------------------
  mkdirSync(BACKUP_DIR, { recursive: true });
  for (const doc of staff) {
    writeFileSync(
      resolve(BACKUP_DIR, `staffMember-${doc.slug?.current}-${BACKUP_STAMP}.json`),
      JSON.stringify(doc, null, 2) + '\n',
    );
  }
  console.log(`Backed up ${staff.length} staffMember document(s) to ${BACKUP_DIR}`);

  const tx = client.transaction();
  for (const r of rows) tx.patch(r.id, (patch) => patch.set({ order: r.to }));
  await tx.commit();

  console.log(`\nApplied: ${rows.length} order patch(es).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
