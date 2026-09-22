// scripts/settings-placeholders.mjs
//
// One-time migration, and a standing audit, for the Site settings placeholders
// (src/lib/settings-placeholders.ts). The page seeds typed the service time,
// the street address, the phone and the email into about sixty places across
// thirteen documents (CLAUDE.md rule 15). This script finds every typed copy
// and replaces it with its placeholder, so the value lives once, in Site
// settings, and the build fills it back in.
//
// ORDER MATTERS. Run --write only AFTER the code that fills placeholders is on
// main and deployed. Every write fires the publish webhook, which rebuilds the
// live site from main; if main could not fill {time}, visitors would read a
// literal "{time}".
//
// CLAUDE.md rule 16 discipline:
//   1. DRY BY DEFAULT. It prints every change, document by document, and
//      writes nothing. Only --write acts.
//   2. BACKUP FIRST. With --write, every document it is about to touch is
//      written verbatim to scripts/data/backups/ BEFORE the first patch.
//   3. PROVEN BEFORE IT RUNS. Every change is converted and filled back in,
//      and must reproduce the original text exactly (apart from "AM" and
//      "a.m." printing as "am"). One mismatch and it refuses to write anything.
//   4. ALSO, one small companion fix in the same run: every staff member with
//      no stored `showOnSite` gets `true` (setIfMissing, so a real choice is
//      never overridden). Unset already MEANS shown, but the Studio draws an
//      unset switch in its grey "not set" state, which reads as off.
//   5. NARROW. Page content only: never siteSettings (the source itself),
//      never blog posts (dated writing stays as it was written), never
//      redirects, never link targets.
//
// Usage:
//   node scripts/settings-placeholders.mjs                      # the plan (needs .env token)
//   node scripts/settings-placeholders.mjs --write              # backup, then patch
//   node scripts/settings-placeholders.mjs --check              # audit: exit 1 if any typed copy is left
//   node scripts/settings-placeholders.mjs --from-file dump.json  # the plan, offline, from a
//                                                                # public query result (published docs only)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findTypedCopies,
  fillString,
  placeholderValues,
} from '../src/lib/settings-placeholders.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const CHECK = args.includes('--check');
const fromIdx = args.indexOf('--from-file');
const FROM_FILE = fromIdx >= 0 ? args[fromIdx + 1] : null;

// Document types the site renders page text from. Blog posts are left out on
// purpose: a 2024 post that says "worship at 10:45" was true when written.
const TYPES = [
  'homePage',
  'page',
  'journalPage',
  'privacyPage',
  'notFoundPage',
  'ministry',
  'sectionPreset',
];

const normaliseTime = (s) => s.replace(/(?<![-\d:])\b(\d{1,2}:\d{2}) ?(AM|a\.m\.)(?!\w)/g, '$1 am');

const stamp = new Date().toISOString().slice(0, 10);
const BACKUP_PATH = resolve(__dirname, 'data', 'backups', `settings-placeholders-${stamp}.json`);

async function load() {
  if (FROM_FILE) {
    const raw = JSON.parse(readFileSync(FROM_FILE, 'utf8'));
    const docs = Array.isArray(raw) ? raw : raw.result;
    return { client: null, docs, settings: docs.find((d) => d._id === 'siteSettings') };
  }
  // Imported lazily: sanity-lib exits when .env has no token, and --from-file
  // must work without one.
  const { client } = await import('./lib/sanity-lib.mjs');
  // Drafts too: a draft still holding a typed copy would put it back the next
  // time somebody publishes that page.
  const docs = await client.fetch(
    `*[_type in $types || _type == "staffMember"]`,
    { types: TYPES },
    { perspective: 'raw' },
  );
  const settings = await client.fetch(
    `*[_id == "siteSettings"][0]`,
    {},
    { perspective: 'published' },
  );
  return { client, docs, settings };
}

async function main() {
  const { client, docs, settings } = await load();
  if (!settings?.serviceTime) {
    console.error(
      'No published Site settings with a service time. Nothing to anchor to; stopping.',
    );
    process.exit(1);
  }
  const values = placeholderValues(settings);

  const plan = docs
    .filter((d) => TYPES.includes(d._type))
    .map((doc) => ({ doc, changes: findTypedCopies(doc, settings) }))
    .filter((p) => p.changes.length > 0)
    .sort((a, b) => a.doc._id.localeCompare(b.doc._id));

  let total = 0;
  const mismatches = [];
  for (const { doc, changes } of plan) {
    console.log(`\n${doc._id}  (${changes.length})`);
    for (const c of changes) {
      total++;
      console.log(`  ${c.path}`);
      console.log(`    - ${JSON.stringify(c.before)}`);
      console.log(`    + ${JSON.stringify(c.after)}`);
      const back = fillString(c.after, values);
      // The one allowed difference: the time prints the way Site settings
      // writes it ("10:45 am"), where the church sometimes wrote "AM" or "a.m.".
      if (back !== normaliseTime(c.before)) {
        mismatches.push({ id: doc._id, ...c, back });
      }
    }
  }
  console.log(`\n${total} typed cop${total === 1 ? 'y' : 'ies'} in ${plan.length} document(s).`);

  if (mismatches.length) {
    console.error(
      `\nREFUSING: ${mismatches.length} change(s) would not fill back to the original:`,
    );
    for (const m of mismatches)
      console.error(`  ${m.id} ${m.path}\n    was  ${m.before}\n    gets ${m.back}`);
    process.exit(1);
  }
  console.log('Every change fills back to the original text (AM and a.m. print as am).');

  const staff = docs
    .filter((d) => d._type === 'staffMember' && d.showOnSite === undefined)
    .sort((a, b) => a._id.localeCompare(b._id));
  console.log(
    `\nStaff: ${staff.length} staff member(s) with no stored "Show on the Staff page"; each gets true.`,
  );
  for (const d of staff) console.log(`  ${d._id}  (${d.name ?? 'unnamed'})`);

  if (CHECK) process.exit(total === 0 && staff.length === 0 ? 0 : 1);
  if (!WRITE) {
    console.log('\nDry run. Nothing written. Add --write to back up and patch.');
    return;
  }
  if (!client) {
    console.error('--write needs the live client; do not combine it with --from-file.');
    process.exit(1);
  }

  mkdirSync(dirname(BACKUP_PATH), { recursive: true });
  writeFileSync(BACKUP_PATH, JSON.stringify([...plan.map((p) => p.doc), ...staff], null, 2) + '\n');
  console.log(`\nBacked up ${plan.length + staff.length} document(s) verbatim to ${BACKUP_PATH}`);

  // One transaction, so the site never rebuilds from a half-migrated dataset.
  const tx = client.transaction();
  for (const { doc, changes } of plan) {
    const set = Object.fromEntries(changes.map((c) => [c.path, c.after]));
    tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set));
  }
  for (const d of staff) tx.patch(d._id, (p) => p.setIfMissing({ showOnSite: true }));
  const res = await tx.commit();
  console.log(
    `Patched ${plan.length + staff.length} document(s) in one transaction (${res.transactionId}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
