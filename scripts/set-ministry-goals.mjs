// scaffold-file: church
// scripts/set-ministry-goals.mjs
//
// Writes the church's own answer to "which of our four goals does this
// ministry serve" into the optional `goal` field of the ministry documents
// (2026-09-24, the Ministries identity pass). The answers, and the capture
// line each one is read off, are in scripts/data/ministry-goals.json; a
// ministry the church's words do not settle is null there and is NOT written.
//
// ORDER MATTERS. Run --write only AFTER the code that knows the `goal` field
// is on main and deployed: the Studio is embedded, and a Studio older than its
// data offers "Remove field" (CLAUDE.md rule 1). Every write also fires the
// publish webhook, and the rebuilt /ministries then draws the goal index.
//
// CLAUDE.md rule 16 discipline, the shape of scripts/connect-ministries.mjs:
//   1. DRY BY DEFAULT. It prints the plan and writes nothing. Only --write acts.
//   2. BACKUP FIRST. With --write, every document it is about to patch is
//      written verbatim to scripts/data/backups/ before anything changes.
//   3. ONE TRANSACTION, each patch guarded by ifRevisionId.
//   4. REFUSES on anything unexpected: a ministry that is missing, an
//      unpublished draft of one it touches, or a goal an editor has ALREADY
//      set to something else (their answer wins; this never overwrites it).
//   5. IDEMPOTENT. A ministry already carrying its goal is left alone.
//
// Usage:
//   node scripts/set-ministry-goals.mjs           # the plan
//   node scripts/set-ministry-goals.mjs --write   # backup, then patch

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');
const GOALS = new Set(['worship', 'the-way', 'witness', 'work']);

const answers = JSON.parse(
  readFileSync(resolve(__dirname, 'data', 'ministry-goals.json'), 'utf8'),
).ministries;
for (const a of answers) {
  if (a.goal !== null && !GOALS.has(a.goal)) {
    throw new Error(
      `ministry-goals.json: ${a.id} names "${a.goal}", which is not one of the four goals.`,
    );
  }
  if (a.goal !== null && !(Array.isArray(a.evidence) && a.evidence.length > 0)) {
    throw new Error(
      `ministry-goals.json: ${a.id} names a goal with no evidence line from the church's own words.`,
    );
  }
}

function backupPath() {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = resolve(__dirname, 'data', 'backups', `set-ministry-goals-${stamp}`);
  let path = `${base}.json`;
  let n = 1;
  while (existsSync(path)) {
    n += 1;
    path = `${base}-${n}.json`;
  }
  return path;
}

async function main() {
  const { client } = await import('./lib/sanity-lib.mjs');
  const ids = answers.map((a) => a.id);
  const all = await client.fetch(
    '*[_id in $ids || _id in $draftIds]',
    { ids, draftIds: ids.map((id) => `drafts.${id}`) },
    { perspective: 'raw' },
  );
  const docs = new Map(all.filter((d) => !d._id.startsWith('drafts.')).map((d) => [d._id, d]));
  const drafts = new Set(all.filter((d) => d._id.startsWith('drafts.')).map((d) => d._id));

  const errors = [];
  const patches = [];
  console.log(`set-ministry-goals: ${WRITE ? 'WRITE' : 'dry run'}\n`);
  for (const a of answers) {
    const doc = docs.get(a.id);
    if (!doc) {
      errors.push(`${a.id} is not in the dataset.`);
      continue;
    }
    if (a.goal === null) {
      console.log(
        `${a.id}: left for the church (${doc.goal ? `an editor has set "${doc.goal}"` : 'no goal'}).`,
      );
      continue;
    }
    if (drafts.has(`drafts.${a.id}`)) {
      errors.push(`drafts.${a.id} is an unpublished draft. Publish or discard it first.`);
      continue;
    }
    if (doc.goal === a.goal) {
      console.log(`${a.id}: already "${a.goal}". Nothing to do.`);
      continue;
    }
    if (doc.goal) {
      errors.push(
        `${a.id}: an editor has set "${doc.goal}"; the church's words say "${a.goal}". Not overwritten: settle it in the Studio.`,
      );
      continue;
    }
    console.log(`${a.id}  (rev ${doc._rev})  goal <- "${a.goal}"`);
    for (const e of a.evidence) console.log(`    ${e}`);
    patches.push({ id: a.id, rev: doc._rev, goal: a.goal, doc });
  }

  if (errors.length) {
    console.error(`\nRefusing:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
  if (patches.length === 0) {
    console.log('\nNothing to write.');
    return;
  }
  console.log(`\n${patches.length} ministry document(s) to patch.`);
  if (!WRITE) {
    console.log('Dry run. Nothing written. Add --write to back up and patch.');
    return;
  }

  const path = backupPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify(
      patches.map((p) => p.doc),
      null,
      2,
    ) + '\n',
  );
  console.log(`\nBacked up ${patches.length} document(s) verbatim to ${path}`);
  const tx = client.transaction();
  for (const p of patches) tx.patch(p.id, (q) => q.ifRevisionId(p.rev).set({ goal: p.goal }));
  const res = await tx.commit();
  console.log(`Patched ${patches.length} document(s) in one transaction (${res.transactionId}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
