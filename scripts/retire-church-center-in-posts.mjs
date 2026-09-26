// Rewords "Church Center Channel" (and its few variants) inside imported post
// bodies to name YouTube instead, wherever those words are the visible text of
// a link that already points at the {sermons} token (src/lib/church-links.ts).
// Backup-first, dry by default (CLAUDE.md rule 16).
//
// WHY THIS EXISTS. The journal pass tokenized every "listen to the sermon"
// link to {sermons}, so the LINKS already go to YouTube once Site settings'
// Sermon recordings box is cleared (scripts/retire-church-center.mjs). But
// tokenizing a link moves the address, not the words around it (the Studio
// guide "Links to giving, forms and sermons" says exactly this): about 30 of
// the 142 imported posts still show "Church Center Channel", "our church
// center channel" or "the church center app" as the CLICKABLE WORDS
// themselves, so a visitor reads a name the church no longer uses even though
// the click lands on YouTube.
//
// WHAT THIS DOES NOT TOUCH, ON PURPOSE. src/lib/church-links.ts's own
// classifier already draws the line this script follows: a Church Center
// address for a single past event (a registrations/ or calendar/event/ link)
// is `past-event`, left exactly as written, because it is a historical record
// of how that one event worked, not a live system reference. This script only
// rewords a span that is the clickable text of an ALREADY-tokenized {sermons}
// link -- an evergreen "go listen" reference, never a one-off event page --
// and leaves every other mention of Church Center in a post (a past event's
// registration sentence, a donation instruction, unlinked prose recalling how
// something worked at the time) exactly as the church wrote it. Those are
// reported, not rewritten; see docs/PENDING.md.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, APPLY } from './lib/sanity-lib.mjs';

// Matches "Church Center", "Church Center Channel" or "Church Center App" in
// any case, with any run of whitespace between the words. Always becomes
// "YouTube channel": YouTube is a proper noun (correct capitalized anywhere in
// a sentence) and "channel" reads naturally whether the app or the plain name
// was there before.
const CHURCH_CENTER_CHANNEL = /church\s*center(\s*(channel|app))?/gi;

function reword(text) {
  return text.replace(CHURCH_CENTER_CHANNEL, 'YouTube channel');
}

const posts = await client.fetch(
  '*[_type == "journalEntry" && !(_id in path("drafts.**"))]{_id, title, body}',
);

const plan = []; // { postId, title, blockKey, spanKey, before, after }
for (const post of posts) {
  for (const block of post.body ?? []) {
    if (block?._type !== 'block' || !Array.isArray(block.children)) continue;
    const sermonsLinkKeys = new Set(
      (block.markDefs ?? [])
        .filter((d) => d?._type === 'link' && d.href === '{sermons}')
        .map((d) => d._key),
    );
    if (sermonsLinkKeys.size === 0) continue;
    for (const span of block.children) {
      if (span?._type !== 'span' || typeof span.text !== 'string') continue;
      const isSermonsLink = (span.marks ?? []).some((m) => sermonsLinkKeys.has(m));
      if (!isSermonsLink) continue;
      const after = reword(span.text);
      if (after === span.text) continue;
      plan.push({
        postId: post._id,
        title: post.title,
        blockKey: block._key,
        spanKey: span._key,
        before: span.text,
        after,
      });
    }
  }
}

console.log(`${plan.length} span(s) across ${new Set(plan.map((p) => p.postId)).size} post(s):\n`);
for (const p of plan) {
  console.log(`${p.postId}  (${p.title})`);
  console.log(`  - ${JSON.stringify(p.before)}`);
  console.log(`  + ${JSON.stringify(p.after)}`);
}

if (plan.length === 0) {
  console.log('Nothing to change.');
  process.exit(0);
}
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
const stem = `posts-${new Date().toISOString().slice(0, 10)}-retire-church-center-channel`;
let file = join(dir, `${stem}.json`);
for (let n = 2; existsSync(file); n++) file = join(dir, `${stem}-${n}.json`);
// Back up only the posts this plan touches, in full, before any write.
const touchedIds = [...new Set(plan.map((p) => p.postId))];
const touchedDocs = posts.filter((p) => touchedIds.includes(p._id));
writeFileSync(file, JSON.stringify(touchedDocs, null, 2));
console.log(`backup: ${file}`);

let tx = client.transaction();
for (const p of plan) {
  tx = tx.patch(p.postId, (patch) =>
    patch.set({
      [`body[_key=="${p.blockKey}"].children[_key=="${p.spanKey}"].text`]: p.after,
    }),
  );
}
await tx.commit();
console.log('written.');
