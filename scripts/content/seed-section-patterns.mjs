// Seeds the church year's saved sections (Advent and Christmas, Holy Week and Easter, Vacation
// Bible School, Fall kickoff, Thanksgiving, Weather closing, Mission offering, Memorial) so the
// church office can add them to any page with "Insert a saved section" (2026-10-18, PORTS.md card 109).
//
// The words live in src/sanity/sectionPatterns.ts, which src/lib/church-templates.test.ts checks
// (block types, keys, example markers, copy rules). This script only copies them into the dataset,
// because the page builder's insert menu reads saved sections from there.
//
// What it writes: one DRAFT `sectionPreset` per pattern, id `drafts.pattern-<id>`. Drafts on
// purpose: "Add a copy" works from a draft, but "Add synced" needs a published saved section, so
// the Example text in these can never go live through a synced section.
//
// What it never does: overwrite or delete. A pattern whose draft OR published id already exists is
// skipped, so re-running it after the office has edited (or published, or renamed) one is safe.
//
// FBCM: Sanity writes on this site need Nathan's OK at the time, so this has only been run DRY.
// Dry by default. Production needs --apply AND NCS_PRODUCTION_WRITE=yes (rule 16). It imports a .ts
// file, so Node 22 needs the strip-types flag (Node 24 accepts it too):
//   node --experimental-strip-types scripts/content/seed-section-patterns.mjs
// PowerShell, with Nathan's OK:
//   $env:NCS_PRODUCTION_WRITE='yes'; node --experimental-strip-types scripts/content/seed-section-patterns.mjs --apply; Remove-Item Env:NCS_PRODUCTION_WRITE
// --only=<id>,<id> seeds just those patterns (the id in sectionPatterns.ts, without "pattern-"), for
// when Nathan approves some and not others (2026-10-26: closure-notice and event-details only).
// Verify afterwards: Pages > Saved sections lists them, each marked as a draft.

import { client, apply, done } from '../lib/sanity-lib.mjs';
import { SECTION_PATTERNS } from '../../src/sanity/sectionPatterns.ts';

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').filter(Boolean)) : null;
if (only) {
  const unknown = [...only].filter((id) => !SECTION_PATTERNS.some((p) => p.id === id));
  if (unknown.length) throw new Error(`--only names no pattern: ${unknown.join(', ')}`);
}
const PATTERNS = only ? SECTION_PATTERNS.filter((p) => only.has(p.id)) : SECTION_PATTERNS;

const ids = PATTERNS.map((p) => `pattern-${p.id}`);
// perspective 'raw': newer API versions read the published view by default, which hides the
// drafts this script writes, so a rerun would report them as missing.
const found = await client.withConfig({ perspective: 'raw' }).fetch('*[_id in $ids]._id', {
  ids: [...ids, ...ids.map((id) => `drafts.${id}`)],
});
const existing = new Set(found.map((id) => id.replace(/^drafts\./, '')));

let changes = 0;
for (const pattern of PATTERNS) {
  const id = `pattern-${pattern.id}`;
  if (existing.has(id)) {
    console.log(`SKIP "${pattern.title}": already in the dataset, never overwritten.`);
    continue;
  }
  const section = pattern.sections();
  const doc = {
    _id: `drafts.${id}`,
    _type: 'sectionPreset',
    title: pattern.title,
    note: pattern.note,
    sectionType: section[0]?._type,
    section,
  };
  await apply(
    `create draft saved section "${pattern.title}" (${section.map((s) => s._type).join(', ')})`,
    () => client.createIfNotExists(doc),
  );
  changes++;
}
done(changes);
