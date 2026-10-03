// scripts/link-architecture.mjs
//
// Points History's 1921 to 1929 band and Give's "What your gift supports" band
// at the new /architecture page (2026-10-03), and retires the redirect document
// that used to send /architecture to /visit#building (the redirects live in
// Sanity as `redirect` documents; src/lib/fbcm-redirects.ts only seeds them). A TARGETED patch, not a re-seed:
// re-running history.mjs or give.mjs would also overwrite the live closing
// bands' {service time} / {address} placeholders with literal text, so only the
// two sections that change are touched, by _key. Backup-first, dry by default,
// idempotent (a band that already has the link is left alone).
//
//   node scripts/link-architecture.mjs            # dry run: prints the plan
//   node scripts/link-architecture.mjs --apply    # backs up, then writes
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { client, ROOT, APPLY } from './lib/sanity-lib.mjs';
import { link, paragraphs, ctaAnchor } from './lib/page-copy.mjs';

const DAY = new Date().toISOString().slice(0, 10);
const BACKUPS = resolve(ROOT, 'scripts', 'data', 'backups');

const history = await client.getDocument('page-history');
const give = await client.getDocument('page-give');
if (!history || !give) throw new Error('page-history or page-give is missing from the dataset.');

const plan = [];

// Deleted only when it is exactly the rule that was seeded: from /architecture,
// to /visit#building. Anything else at that id is left for a human to look at.
const redirect = await client.getDocument('redirect-architecture');
const retireRedirect =
  redirect && redirect.from === '/architecture' && redirect.to === '/visit#building';
if (retireRedirect) plan.push('redirect-architecture: delete (/architecture -> /visit#building)');
else if (redirect)
  console.log('  redirect-architecture exists but is not the seeded rule; left alone.');

const era4 = history.pageBuilder.find((s) => s._key === 'hs-era4');
if (!era4) throw new Error('history: no section hs-era4.');
const wantCta = era4.cta?.externalUrl !== '/architecture';
if (wantCta) plan.push('history hs-era4: set cta "The building’s architecture" -> /architecture');

const where = give.pageBuilder.find((s) => s._key === 'give-where');
if (!where) throw new Error('give: no section give-where.');
const hasLink = JSON.stringify(where.body).includes('/architecture');
if (!hasLink) plan.push('give give-where: append one sentence and a link to /architecture');

console.log(APPLY ? 'APPLY: documents will be written.' : 'DRY RUN: nothing will be written.');
for (const line of plan) console.log(`  ${line}`);
if (plan.length === 0) {
  console.log('  nothing to do: both links are already in place.');
  process.exit(0);
}

if (APPLY) {
  mkdirSync(BACKUPS, { recursive: true });
  const file = resolve(BACKUPS, `architecture-links-${DAY}.json`);
  writeFileSync(file, JSON.stringify({ history, give, redirect }, null, 2));
  console.log(`  backed up page-history, page-give and the redirect to ${file}`);

  if (wantCta) {
    await client
      .patch('page-history')
      .set({
        [`pageBuilder[_key=="hs-era4"].cta`]: ctaAnchor(
          'The building’s architecture',
          '/architecture',
        ),
      })
      .commit();
  }
  if (!hasLink) {
    await client
      .patch('page-give')
      .insert('after', `pageBuilder[_key=="give-where"].body[-1]`, [
        ...paragraphs('Part of that is the building itself, which needs steady care.', 'gwh-c'),
        link('The story of our building', '/architecture', 'gwh-d'),
      ])
      .commit();
  }
  if (retireRedirect) await client.delete('redirect-architecture');
  console.log('  written.');
}
