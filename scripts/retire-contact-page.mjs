// scripts/retire-contact-page.mjs
//
// Task 14 of plan 2b turns /contact into an ordinary `page` document, the same
// shape /visit, /give and the rest already use, and retires the starter's
// bespoke `contactPage` singleton along with the Web3Forms form and the
// Calendly embed it fed.
//
// Removing a document TYPE from the schema does not remove its DATA. If the
// dataset still holds a `contactPage` document after the schema stops
// declaring it, the Studio shows an orphan with a "Remove field" button beside
// every key (CLAUDE.md rule 1 forbids clicking that: it deletes the field's
// data across every document, with no undo).
//
// CLAUDE.md rule 16: retiring data means a backup-then-delete script, run dry
// first, never a raw delete. This script:
//   1. Fetches every `contactPage` document, drafts included.
//   2. If there are none, prints "absent" and exits 0. The absence is itself
//      the record, and there is nothing to back up.
//   3. Otherwise writes them VERBATIM to a committed backup file BEFORE any
//      mutation, then deletes exactly those ids and nothing else.
//   4. Is DRY BY DEFAULT. Only --write (or its --apply synonym) acts.
//
// Usage:
//   node scripts/retire-contact-page.mjs           # prints the plan
//   node scripts/retire-contact-page.mjs --write   # backs up, then deletes

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client } from './lib/sanity-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write') || process.argv.includes('--apply');

const BACKUP_PATH = resolve(__dirname, 'data', 'backups', 'contactPage-2026-09-20-plan2b.json');

async function main() {
  // Drafts too: an unpublished contactPage is still a document that would be
  // left behind, and `_type == "contactPage"` matches both.
  const docs = await client.fetch('*[_type == "contactPage"] | order(_id asc)');

  if (!docs || docs.length === 0) {
    console.log('absent');
    console.log('  No contactPage document exists on this dataset. Nothing to back up or delete.');
    return;
  }

  console.log('Plan:');
  console.log(`  Backup file: ${BACKUP_PATH}`);
  console.log(`  Delete ${docs.length} contactPage document(s):`);
  for (const d of docs) console.log(`    - ${d._id}`);

  console.log(WRITE ? '\nWRITING...' : '\nDRY RUN. Re-run with --write to back up and delete.');
  if (!WRITE) return;

  // 1. Backup, verbatim, BEFORE any mutation. An existing backup from the same
  //    day is never overwritten (same rule seed-pages.mjs follows): a second
  //    run must not quietly replace the record of the first.
  let path = BACKUP_PATH;
  let n = 2;
  while (existsSync(path)) path = BACKUP_PATH.replace(/\.json$/, `-${n++}.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ contactPage: docs }, null, 2) + '\n');
  console.log(`Backed up to ${path}`);

  // 2. Delete exactly the ids that were just backed up, one at a time, so a
  //    failure part way through names the document it stopped on.
  for (const d of docs) {
    await client.delete(d._id);
    console.log(`Deleted ${d._id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
