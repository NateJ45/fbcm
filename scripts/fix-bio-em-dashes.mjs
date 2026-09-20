// scripts/fix-bio-em-dashes.mjs
//
// CLAUDE.md rule 2 is absolute for site copy: no em-dashes in the text a
// visitor reads. The page modules under scripts/pages/ enforce it on every
// sentence they lift out of the Wix captures (each conversion is a guarded
// helper that throws if the em-dash is gone), but a staff member's BIO does
// not come through a page module. It is a field on the staffMember document,
// imported once by scripts/import-people.mjs, and rendered by StaffGrid on
// both /staff and /who-we-are.
//
// One bio carries one em-dash: Kendall Ellis's, inside the verbatim Romans
// 8:17 quotation she chose ("...then we are heirs—heirs of God and co-heirs
// with Christ..."). A verbatim scripture quotation is a fair argument for an
// exemption, and the final review raised it as exactly that. The ruling (P30)
// is that rule 2 wins: the em-dash becomes a comma, and the change is declared
// in the approval note the church reads before launch, under both pages that
// print the bio.
//
// CLAUDE.md rule 16: a data change is backup-then-write, dry by default, and
// guarded on the exact condition that justifies it. This script:
//   1. Fetches every staffMember document.
//   2. Plans a change ONLY for a document whose bio contains an em-dash
//      between two word characters, and prints the sentence before and after.
//   3. Under --apply, writes each affected document verbatim to
//      scripts/data/backups/ BEFORE any write.
//   4. Patches only the bio field, only on the planned documents.
//   5. Is idempotent: a second run has nothing to plan and says so.
//
// Usage:
//   node scripts/fix-bio-em-dashes.mjs            # prints the plan
//   node scripts/fix-bio-em-dashes.mjs --apply    # backs up, then writes

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client, APPLY } from './lib/sanity-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = resolve(__dirname, 'data', 'backups');

// An em-dash BETWEEN WORDS, which is the punctuation rule 2 is about. A dash
// used as a range or a list bullet would not match, and there is none in this
// data, but the narrow pattern is what makes the guard meaningful.
const BETWEEN_WORDS = /(\w)—(\w)/g;

/** Rewrite the spans of a portable-text array. Returns null when nothing moved. */
function convert(bio) {
  if (!Array.isArray(bio)) return null;
  let touched = false;
  const out = bio.map((block) => {
    if (!Array.isArray(block?.children)) return block;
    const children = block.children.map((span) => {
      if (typeof span?.text !== 'string') return span;
      const next = span.text.replace(BETWEEN_WORDS, '$1, $2');
      if (next === span.text) return span;
      touched = true;
      return { ...span, text: next };
    });
    return touched ? { ...block, children } : block;
  });
  return touched ? out : null;
}

/** The first sentence-ish window around the first em-dash, for the plan table. */
function around(bio) {
  for (const block of bio ?? []) {
    for (const span of block?.children ?? []) {
      const i = typeof span?.text === 'string' ? span.text.indexOf('—') : -1;
      if (i !== -1) return span.text.slice(Math.max(0, i - 45), i + 45);
    }
  }
  return '';
}

async function main() {
  const staff = await client.fetch('*[_type == "staffMember"]{...}');
  const plan = [];
  for (const doc of staff) {
    const next = convert(doc.bio);
    if (next) plan.push({ doc, next });
  }

  console.log(`${staff.length} staffMember document(s) read.`);
  if (plan.length === 0) {
    console.log('No bio contains an em-dash between words. Nothing to do.');
    return;
  }
  for (const p of plan) {
    console.log(`\n${p.doc._id}  (${p.doc.name})`);
    console.log(`  before: ...${around(p.doc.bio)}...`);
    console.log(`  after:  ...${around(p.doc.bio).replace(BETWEEN_WORDS, '$1, $2')}...`);
  }
  console.log(APPLY ? '\nAPPLYING...' : '\nDRY RUN. Re-run with --apply to write.');
  if (!APPLY) return;

  // Backups first, verbatim, BEFORE any write.
  mkdirSync(BACKUP_DIR, { recursive: true });
  for (const p of plan) {
    const path = resolve(
      BACKUP_DIR,
      `staffMember-${p.doc.slug?.current ?? p.doc._id}-2026-09-20-em-dash.json`,
    );
    writeFileSync(path, JSON.stringify(p.doc, null, 2) + '\n');
    console.log(`Backed up ${p.doc._id} to ${path}`);
  }

  const tx = client.transaction();
  for (const p of plan) tx.patch(p.doc._id, (patch) => patch.set({ bio: p.next }));
  await tx.commit();
  console.log(`Patched ${plan.length} bio field(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
