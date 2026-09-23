// scripts/fix-journal-gaps.mjs
//
// Two content gaps the journal polish (2026-09-22) left in docs/PENDING.md,
// both data rather than render, so neither is fixed in src/:
//
//   1. 13 journalEntry documents have NO category. Wix never had one for them
//      either (scripts/data/posts/<slug>.json, `categories: []`), so the import
//      carried the gap faithfully. Twelve are sermon previews by their own
//      opening words ("This is a sermon preview for...", "This is a preview of a
//      sermon in...", or "This is the third week of our Advent 2024 series" after
//      two readings); without the category they get no Sunday, no reading, no
//      "Sermon previews" filter and no Sunday-to-Sunday doors. The thirteenth is
//      the sermon podcast announcement, which is a Church Resources post.
//   2. Two excerpts carry an em-dash. convert-body.ts normalised bodies only, and
//      CLAUDE.md rule 2 is absolute for Sanity content. The rewrite is the SAME
//      normalizeDashes the body import used, so the result matches what 142
//      bodies already went through. One of the two is inside a Robert Frost
//      quotation ("I—I took the one less traveled by"); the bio ruling (P30,
//      scripts/fix-bio-em-dashes.mjs) is that rule 2 wins over a verbatim
//      quotation, and the change goes on the church's approval note.
//
// CLAUDE.md rule 16: dry by default, backup-then-write, and every change guarded
// on the exact condition that justifies it:
//   - a category is added ONLY to a slug on the list below AND only while the
//     document has no category at all, AND (for the previews) only while its
//     first text block still matches the preview wording;
//   - an excerpt is rewritten ONLY when it contains a dash normalizeDashes moves.
// Idempotent: a second run plans nothing and says so.
//
// Usage:
//   node scripts/fix-journal-gaps.mjs            # prints the plan
//   node scripts/fix-journal-gaps.mjs --apply    # backs up, then writes

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client, APPLY } from './lib/sanity-lib.mjs';
import { normalizeDashes } from '../src/lib/convert-body.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = resolve(__dirname, 'data', 'backups');
const STAMP = '2026-09-22-journal-gaps';

const PREVIEWS = [
  'a-light-wardrobe',
  'multiplied',
  'the-way-the-truth-the-life',
  'the-resurrection-the-life',
  'the-hopeful',
  'imitators',
  'mountaintop-forgiveness',
  'mountaintop-love',
  'no-rest-for-the-wicked',
  'elect-gentleness',
  'bearing-good-news',
  'we-believe-in-the-practices-of-the-church',
];
const RESOURCES = ['fbcm-sermon-podcast-now-available'];

// The preview's own words, in the first text blocks. no-rest-for-the-wicked opens
// on its two readings and says "This is the third week of our Advent 2024 series"
// in its third block, so the guard reads the first three.
const PREVIEW_WORDING =
  /this is (?:a|the) (?:sermon )?preview|this sermon preview|this is the \w+ week of our/i;

const textOf = (block) =>
  Array.isArray(block?.children) ? block.children.map((c) => c?.text ?? '').join('') : '';

async function main() {
  const cats = await client.fetch(
    '*[_type == "journalCategory" && slug.current in ["sermon-preview", "church-resources"]]{_id, "slug": slug.current}',
  );
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c._id]));
  if (!catId['sermon-preview'] || !catId['church-resources']) {
    throw new Error(`Category documents not found: ${JSON.stringify(cats)}`);
  }

  const posts = await client.fetch(
    '*[_type == "journalEntry" && !(_id in path("drafts.**"))]{..., "slug": slug.current}',
  );
  const plan = [];

  for (const doc of posts) {
    const change = {};
    const why = [];

    const wants = PREVIEWS.includes(doc.slug)
      ? 'sermon-preview'
      : RESOURCES.includes(doc.slug)
        ? 'church-resources'
        : null;
    if (wants && (doc.categories ?? []).length === 0) {
      const opening = (doc.body ?? [])
        .filter((b) => b?._type === 'block')
        .slice(0, 3)
        .map(textOf)
        .join(' ');
      if (wants === 'sermon-preview' && !PREVIEW_WORDING.test(opening)) {
        console.log(
          `SKIP ${doc.slug}: listed as a preview but its opening no longer says so: "${opening.slice(0, 90)}"`,
        );
      } else {
        change.categories = [{ _key: `cat-${wants}`, _type: 'reference', _ref: catId[wants] }];
        why.push(`category -> ${wants}`);
      }
    }

    if (typeof doc.excerpt === 'string') {
      const { text, changed } = normalizeDashes(doc.excerpt);
      if (changed > 0) {
        change.excerpt = text;
        why.push(`excerpt dash x${changed}`);
      }
    }

    if (why.length) plan.push({ doc, change, why });
  }

  console.log(`${posts.length} journalEntry document(s) read.`);
  if (plan.length === 0) {
    console.log('Nothing to do: every listed post has a category and no excerpt carries a dash.');
    return;
  }
  for (const p of plan) {
    console.log(`\n${p.doc.slug}  (${p.why.join('; ')})`);
    if (p.change.excerpt) {
      const i = p.doc.excerpt.search(/[—–]/);
      const from = Math.max(0, i - 50);
      console.log(`  before: ...${p.doc.excerpt.slice(from, i + 50)}...`);
      console.log(`  after:  ...${p.change.excerpt.slice(from, i + 48)}...`);
    }
  }
  console.log(
    `\n${plan.length} document(s) to patch.` +
      (APPLY ? '\nAPPLYING...' : '\nDRY RUN, nothing written. Re-run with --apply to write.'),
  );
  if (!APPLY) return;

  // Backups first, verbatim, BEFORE any write.
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = resolve(BACKUP_DIR, `journalEntry-${STAMP}.json`);
  writeFileSync(
    backup,
    JSON.stringify(
      plan.map((p) => p.doc),
      null,
      2,
    ) + '\n',
  );
  console.log(`Backed up ${plan.length} document(s) to ${backup}`);

  const tx = client.transaction();
  for (const p of plan) tx.patch(p.doc._id, (patch) => patch.set(p.change));
  await tx.commit();
  console.log(`Patched ${plan.length} document(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
