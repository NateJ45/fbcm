// Clears the starter's placeholder text from the Studio's Help screens and
// brings two lines of the seeded guide up to date (2026-09-26, Nathan: "is
// this the starter placeholder text? it can just be removed").
//
// A sweep of the whole dataset for placeholder wording ("Replace this",
// "Your City, XX", "Lorem", "example.com"...) found only two documents:
//   1. Church notes (studioNotes): the four fields the starter seeded
//      ("Replace this with a description of..."), including a "words to avoid"
//      list written for the starter's business clients. The Help screen draws
//      each box only when its field has text, so emptying them leaves a clean
//      panel; the church can fill them in later.
//   2. Site settings' newsletter: every value a starter default ("Your signup
//      heading goes here.", "Replace this line."), switched off, and the whole
//      block is hidden in the Studio since the audit. Unset.
// Everything else the sweep matched was the church's own words ("Serve Your
// City Day" is a church event).
//
// And the guide ("How the website works"), whose words drifted from the Studio:
//   - the tip "The Preview tool is the easiest way to work" names a tool the
//     Studio calls Presentation;
//   - "Add or remove a staff member" said to open a person "to edit or remove
//     them"; the safe way to take someone off the site keeps their details:
//     the "Show on the Staff page" switch (the Studio rehearsal used it).
// scripts/seed-core.mjs carries the same two corrections, so a reseed cannot
// bring the old wording back.
//
// Dry by default (CLAUDE.md rule 16). --apply backs up all three documents to
// scripts/data/backups/ first, never over an earlier backup. A second run finds
// nothing to change.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, APPLY } from './lib/sanity-lib.mjs';

const NOTES_FIELDS = ['businessSummary', 'idealClient', 'voiceSummary', 'wordsToAvoid'];
const OLD_TIP = 'The Preview tool is the easiest way to work.';
const NEW_TIP = 'The Presentation tab is the easiest way to work.';
const OLD_STEP = 'Click "New" to add someone, or open an existing person to edit or remove them.';
const NEW_STEPS = [
  'Click "New" to add someone, or open an existing person to change their details.',
  'To take someone off the website, turn off "Show on the Staff page". Their details stay here, so you can turn it back on later.',
];

const notes = await client.fetch('*[_id == "studioNotes"][0]');
const settings = await client.fetch('*[_id == "siteSettings"][0]');
const guide = await client.fetch('*[_id == "studioGuide"][0]');

const plan = [];
const notesUnset = NOTES_FIELDS.filter((f) => {
  const v = notes?.[f];
  if (v == null) return false;
  // Only starter placeholder text: the three sentences say "Replace this",
  // and the words list is the starter's seeded one.
  if (typeof v === 'string') return /Replace this/.test(v);
  return Array.isArray(v) && v.includes('synergy');
});
if (notesUnset.length) plan.push(`studioNotes: unset ${notesUnset.join(', ')}`);

const newsletterIsStarter =
  settings?.newsletter &&
  settings.newsletter.enabled !== true &&
  /Replace this line|Your signup heading goes here/.test(JSON.stringify(settings.newsletter));
if (newsletterIsStarter)
  plan.push('siteSettings: unset newsletter (starter defaults, switched off)');

const tip = (guide?.tips ?? []).find(
  (t) => typeof t?.body === 'string' && t.body.includes(OLD_TIP),
);
if (tip) plan.push(`studioGuide: tip "${tip.heading}": "${OLD_TIP}" -> "${NEW_TIP}"`);
const howTo = (guide?.howTos ?? []).find(
  (h) => Array.isArray(h?.steps) && h.steps.includes(OLD_STEP),
);
if (howTo) plan.push(`studioGuide: how-to "${howTo.title}": replace one step with two`);

if (plan.length === 0) {
  console.log('Nothing to change.');
  process.exit(0);
}
for (const p of plan) console.log(p);
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
const stem = `studio-help-${new Date().toISOString().slice(0, 10)}-pre-tidy`;
let file = join(dir, `${stem}.json`);
for (let n = 2; existsSync(file); n++) file = join(dir, `${stem}-${n}.json`);
writeFileSync(
  file,
  JSON.stringify({ studioNotes: notes, siteSettings: settings, studioGuide: guide }, null, 2),
);
console.log(`backup: ${file}`);

// One patch per document, one operation kind per patch (a patch keeps only the
// last call of each kind: see set-nav-news.mjs).
const tx = client.transaction();
if (notesUnset.length) tx.patch('studioNotes', (p) => p.unset(notesUnset));
if (newsletterIsStarter) tx.patch('siteSettings', (p) => p.unset(['newsletter']));
if (tip || howTo) {
  const set = {};
  if (tip) set[`tips[_key=="${tip._key}"].body`] = tip.body.replace(OLD_TIP, NEW_TIP);
  if (howTo) {
    const steps = howTo.steps.flatMap((s) => (s === OLD_STEP ? NEW_STEPS : [s]));
    set[`howTos[_key=="${howTo._key}"].steps`] = steps;
  }
  tx.patch('studioGuide', (p) => p.set(set));
}
await tx.commit();
console.log('written.');
