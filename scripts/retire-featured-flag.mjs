// scripts/retire-featured-flag.mjs
//
// Task 2 of plan 2c retires the stored `journalEntry.featured` boolean.
// Plan 2b made the blog's durable-first split DERIVED from category
// (`splitDurable` in src/lib/blog-derive.ts): 106 of the 142 imported posts
// are weekly sermon previews and the other 36 are worth arriving at, and
// which pile a post is in is worked out from its category every build.
// `featured` sat right next to that in the schema and nothing in the archive
// reads it for ordering any more, which makes it a second source of truth
// for "which posts matter" — the one CLAUDE.md rule 15 says goes stale.
//
// CLAUDE.md rule 16: retiring data means a backup-then-delete script, run dry
// first, never a raw delete. This script:
//   1. Fetches every journalEntry with defined(featured) and writes them,
//      verbatim, to a committed backup file BEFORE touching anything.
//   2. Unsets exactly the `featured` key on each of those documents, nothing
//      else, in one transaction.
//   3. Is DRY BY DEFAULT. Only --write acts. --apply is accepted as a synonym
//      so this reads consistently with the family's --apply convention while
//      matching the exact flag name the task brief uses.
//   4. Is idempotent: a second dry run (or a second --write) finds nothing
//      left to do and says so.
//
// Usage:
//   node scripts/retire-featured-flag.mjs            # prints the plan
//   node scripts/retire-featured-flag.mjs --write     # writes the backup + unsets

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client } from './lib/sanity-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write') || process.argv.includes('--apply');

const BACKUP_PATH = resolve(
  __dirname,
  'data',
  'backups',
  'journalEntry-featured-2026-09-20-plan2c.json',
);

async function main() {
  const docs = await client.fetch(`*[_type == "journalEntry" && defined(featured)]`);

  console.log('Plan:');
  console.log(`  Backup file: ${BACKUP_PATH}`);

  if (docs.length === 0) {
    console.log('  nothing to do: no journalEntry document has featured stored.');
    console.log(WRITE ? '\nWRITING... nothing to write.' : '\nDRY RUN. Nothing to unset.');
    return;
  }

  console.log(`  unset featured on ${docs.length} document(s):`);
  for (const doc of docs) console.log(`    - ${doc._id} (${doc.title ?? 'untitled'})`);

  console.log(WRITE ? '\nWRITING...' : '\nDRY RUN. Re-run with --write to back up and unset.');

  if (!WRITE) return;

  // 1. Backup, verbatim, BEFORE any mutation. Keyed by _id, one file for the
  // whole batch, same shape as retire-sitesettings-fields.mjs.
  mkdirSync(dirname(BACKUP_PATH), { recursive: true });
  const backup = {};
  for (const doc of docs) backup[doc._id] = doc;
  writeFileSync(BACKUP_PATH, JSON.stringify(backup, null, 2) + '\n');
  console.log(`Backed up to ${BACKUP_PATH}`);

  // 2. Unset exactly the featured key, on every affected document, in one
  // transaction so it's all-or-nothing.
  const tx = client.transaction();
  for (const doc of docs) tx.patch(doc._id, (p) => p.unset(['featured']));
  await tx.commit();
  console.log(`Unset featured on ${docs.length} document(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
