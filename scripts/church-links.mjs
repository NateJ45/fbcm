// scripts/church-links.mjs
//
// One-time migration, and a standing audit, for the church-system link tokens
// (src/lib/church-links.ts, feat/church-links, 2026-09-24). The church is
// leaving Church Center (Planning Center) for Church Trac. This script:
//
//   1. replaces every Church Center address typed into a LINK TARGET (a page
//      or post link, a button, a document's link, the header's Give button)
//      with its token: {giving}, {connect}, {contact-form}, {sermons},
//      {wednesday}, {app}, {wedding-enquiry}, {wedding-booking};
//   2. fills the new Site settings > Church systems boxes with TODAY's Church
//      Center addresses (setIfMissing: a box somebody already filled is never
//      overwritten), so the site links exactly where it did the moment after
//      the migration, apart from the few links listed as "changes for
//      visitors", and switching a system to Church Trac is then one edit in
//      Site settings.
//
// ORDER MATTERS (CLAUDE.md rule 1). The Church systems boxes are NEW schema
// fields, and the tokens only work once the code that fills them is live.
// Run --apply only AFTER feat/church-links is merged to main AND deployed:
// every write fires the publish webhook, which rebuilds the live site from
// main, and a main that could not fill {giving} would send every Give button
// to /contact. --apply refuses unless --deployed is passed with it, as the
// operator's word that the deploy happened.
//
// CLAUDE.md rule 16 discipline:
//   1. DRY BY DEFAULT. It prints the whole plan and writes nothing.
//   2. BACKUP FIRST. --apply writes every document it will touch (Site
//      settings included) verbatim to scripts/data/backups/ BEFORE the
//      first patch.
//   3. PROVEN BEFORE IT RUNS. Every change is filled back in with the
//      post-migration settings and must land on the address it replaced,
//      unless it is one of the listed changes for visitors (a sermon series
//      or episode link becomes the sermon channel; the broken "%0A" Wednesday
//      link becomes the working one). Any other mismatch, or a token that
//      would fall back to /contact, and it refuses to write anything.
//   4. NARROW. Link targets only, never prose; never Site settings' own
//      address boxes; never the privacy policy or the footer's "Elsewhere"
//      column (their words name Church Center; they change with the words,
//      see OPERATIONS.md); never the past-event registration links in old
//      posts (reported, left as written).
//   5. ONE TRANSACTION, each patch guarded on the document's revision, so the
//      site never rebuilds from a half-migrated dataset and an edit made
//      since the plan was printed stops the whole run.
//
// Usage:
//   node scripts/church-links.mjs                      # the plan (needs .env token)
//   node scripts/church-links.mjs --apply --deployed   # backup, then patch
//   node scripts/church-links.mjs --check              # audit: exit 1 if a mapped
//                                                      # Church Center link is left
//   node scripts/church-links.mjs --no-feed            # skip the YouTube feed lookup

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHURCH_LINKS, LINK_FALLBACK, tokenizeChurchLinks } from '../src/lib/church-links.ts';
import { fillPlaceholders, placeholderValues } from '../src/lib/settings-placeholders.ts';
import { entryIsSermonPreview } from '../src/lib/blog-derive.ts';
import { openingText } from '../src/lib/post-body.ts';
import { isoDay, readingOf, sundayOf } from '../src/lib/sermon-derive.ts';
import { matchSermonVideo, parseChannelFeed, videoUrl } from '../src/lib/sermon-video.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DEPLOYED = args.includes('--deployed');
const CHECK = args.includes('--check');
const NO_FEED = args.includes('--no-feed');

const CC = 'https://fbcmuncie.churchcenter.com';

// TODAY's addresses for the new boxes, so the migration changes nothing a
// visitor sees. Prayer has no Church Center page: it stays blank, and nothing
// links to {prayer} yet. The three reused boxes (givingUrl, visitorFormUrl,
// lifeEventFormUrl) already hold their addresses and are not touched.
const NEW_FIELD_VALUES = {
  sermonsUrl: `${CC}/channels/4999`,
  wednesdayUrl: `${CC}/pages/fbcs-wednesday-weekly`,
  calendarUrl: `${CC}/calendar`,
  appUrl: `${CC}/`,
  weddingEnquiryUrl: `${CC}/people/forms/243785`,
  weddingBookingUrl: `${CC}/people/forms/520312`,
};

const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCTm6q6Q7OJ6VrURz3YXVP6A';

const stamp = new Date().toISOString().slice(0, 10);
const BACKUP_PATH = resolve(__dirname, 'data', 'backups', `church-links-${stamp}.json`);

/** Every string anywhere in a value, with its path, for the prose report. */
function strings(value, path = '', out = []) {
  if (typeof value === 'string') out.push({ path, text: value });
  else if (Array.isArray(value))
    value.forEach((v, i) =>
      strings(v, `${path}[${v && typeof v === 'object' && v._key ? `_key=="${v._key}"` : i}]`, out),
    );
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value))
      if (!k.startsWith('_')) strings(v, path ? `${path}.${k}` : k, out);
  return out;
}

/** The visible change a token makes, if any, once filled with the post-migration settings. */
function visitorChange(before, token, values) {
  const after = values[token];
  const norm = (u) => u.replace(/\/+$/, '');
  if (norm(after) === norm(before)) return null;
  return after;
}

async function main() {
  const { client } = await import('./lib/sanity-lib.mjs');
  // Drafts too (raw perspective): a draft still holding a Church Center
  // address would put it back the next time somebody publishes it.
  const docs = await client.fetch(
    `*[!(_id in path("_.**")) && !(_type match "sanity.*") && !(_type match "system.*")]`,
    {},
    { perspective: 'raw' },
  );
  const settings = docs.find((d) => d._id === 'siteSettings');
  if (!settings) {
    console.error('No published Site settings document. Stopping.');
    process.exit(1);
  }

  // ── 1. The link plan ──────────────────────────────────────────────────────
  const plan = [];
  const findings = [];
  for (const doc of docs) {
    const { changes, findings: f } = tokenizeChurchLinks(doc);
    if (changes.length) plan.push({ doc, changes });
    for (const x of f) findings.push({ id: doc._id, type: doc._type, ...x });
  }
  plan.sort((a, b) => a.doc._id.localeCompare(b.doc._id));

  // ── 2. The settings plan: new boxes, filled only where empty ──────────────
  const settingsFill = Object.fromEntries(
    Object.entries(NEW_FIELD_VALUES).filter(([field]) => !String(settings[field] ?? '').trim()),
  );
  const after = { ...settings, ...settingsFill };
  const values = placeholderValues(after);

  // ── 3. Prove it ───────────────────────────────────────────────────────────
  const visitorChanges = [];
  const unfilled = new Set();
  let total = 0;
  const perToken = Object.fromEntries(CHURCH_LINKS.map((l) => [l.token, 0]));
  for (const { doc, changes } of plan) {
    for (const c of changes) {
      total++;
      perToken[c.after]++;
      if (!values[c.after]) unfilled.add(c.after);
      const filled = fillPlaceholders(c.after, values, (t) => unfilled.add(t));
      const changed = visitorChange(c.before, c.after, values);
      if (changed) visitorChanges.push({ id: doc._id, ...c, filled });
    }
  }
  const allowed = (c) =>
    c.after === '{sermons}' || (c.after === '{wednesday}' && /%0A/i.test(c.before));
  const refused = visitorChanges.filter((c) => !allowed(c));

  // ── Print ─────────────────────────────────────────────────────────────────
  const line = (s = '') => console.log(s);
  line('CHURCH LINKS: the plan');
  line('======================');
  line(`Read ${docs.length} documents (drafts included).`);
  line();
  line('1. Link targets that become tokens');
  line('-----------------------------------');
  for (const { doc, changes } of plan) {
    line(`\n${doc._id}  (${doc._type}, ${changes.length})`);
    for (const c of changes) {
      line(`  ${c.path}`);
      line(`    - ${c.before}`);
      line(`    + ${c.after}`);
    }
  }
  line();
  line(`${total} link(s) in ${plan.length} document(s). Per token:`);
  for (const [token, n] of Object.entries(perToken)) line(`  ${token.padEnd(18)} ${n}`);

  line();
  line('2. Site settings > Church systems');
  line('---------------------------------');
  for (const l of CHURCH_LINKS) {
    const had = String(settings[l.field] ?? '').trim();
    const gets = settingsFill[l.field];
    const state = gets ? `SET  ${gets}` : had ? `keep ${had}` : 'blank (nothing links to it yet)';
    line(`  ${l.field.padEnd(18)} ${l.token.padEnd(18)} ${state}`);
  }
  line(`  (${Object.keys(settingsFill).length} box(es) to fill, with setIfMissing)`);

  line();
  line('3. What a visitor sees change');
  line('----------------------------');
  if (!visitorChanges.length) line('  Nothing: every link fills back to the address it had.');
  for (const c of visitorChanges)
    line(
      `  ${c.id}  ${c.path}\n    was ${c.before}\n    now ${c.filled}${allowed(c) ? '' : '   <-- NOT ALLOWED'}`,
    );
  line(
    `  ${total - visitorChanges.length} of ${total} link(s) fill back to exactly the address they had.`,
  );

  line();
  line('4. Left alone on purpose');
  line('------------------------');
  const byKind = (k) => findings.filter((f) => f.kind === k);
  line(`  Names Church Center in its words (change with the words at the switch):`);
  for (const f of byKind('skipped')) line(`    ${f.id}  ${f.path}\n      ${f.url}`);
  line(`  Past-event registration and calendar links in old posts (left as written):`);
  for (const f of byKind('past-event')) line(`    ${f.id}  ${f.path}\n      ${f.url}`);
  line(`  Could not classify:`);
  if (!byKind('unclassified').length) line('    none');
  for (const f of byKind('unclassified')) line(`    ${f.id}  ${f.path}\n      ${f.url}`);

  line();
  line('5. Words that name Church Center (for the switch; not changed here)');
  line('-------------------------------------------------------------------');
  let mentions = 0;
  for (const doc of docs) {
    for (const s of strings(doc)) {
      if (/church ?center/i.test(s.text) && !/^https?:\/\//i.test(s.text.trim())) {
        mentions++;
        line(`  ${doc._id}  ${s.path}\n    "${s.text.replace(/\s+/g, ' ').slice(0, 160)}"`);
      }
    }
  }
  line(`  ${mentions} string(s).`);

  // ── Sermon recordings on YouTube: how many previews match today ───────────
  line();
  line('6. Sermon previews matched to their YouTube recording (derived at build time)');
  line('-----------------------------------------------------------------------------');
  if (NO_FEED) {
    line('  Skipped (--no-feed).');
  } else {
    let videos = [];
    try {
      const res = await fetch(FEED, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      videos = parseChannelFeed(await res.text());
    } catch (err) {
      line(`  Could not read the feed: ${String(err)}`);
    }
    const previews = docs
      .filter((d) => d._type === 'journalEntry' && !d._id.startsWith('drafts.'))
      .filter((d) =>
        entryIsSermonPreview({
          categories: (d.categories ?? []).map((c) => {
            const cat = docs.find((x) => x._id === c._ref);
            return { title: cat?.title, slug: cat?.slug };
          }),
        }),
      );
    const sundays = videos.map((v) => v.published.slice(0, 10)).sort();
    line(
      `  Feed: ${videos.length} video(s), published ${sundays[0] ?? '-'} to ${sundays.at(-1) ?? '-'}.`,
    );
    let matched = 0;
    for (const p of previews) {
      const sunday = sundayOf(p.publishedAt);
      const v = matchSermonVideo(
        sunday ? isoDay(sunday) : null,
        readingOf(openingText(p.body)),
        videos,
      );
      if (v) {
        matched++;
        line(`  ${p._id}  ${isoDay(sunday)}  ->  ${videoUrl(v)}  "${v.title}"`);
      }
    }
    const newest = previews
      .map((p) => p.publishedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    line(
      `  ${matched} of ${previews.length} preview(s) match a recording today (newest preview published ${newest?.slice(0, 10) ?? '-'}).`,
    );
    line('  A match only takes effect once Sermon recordings points at YouTube; until then every');
    line('  preview keeps the Church Center channel.');
  }

  line();
  if (refused.length || unfilled.size) {
    if (refused.length)
      console.error(`REFUSING: ${refused.length} link(s) would change for visitors unexpectedly.`);
    if (unfilled.size)
      console.error(
        `REFUSING: ${[...unfilled].join(', ')} would have no address and fall back to ${LINK_FALLBACK}.`,
      );
    process.exit(1);
  }
  line('Every token used has an address after the migration; no link falls back to /contact.');

  // The audit: a mapped Church Center address still typed into a link target.
  if (CHECK) process.exit(plan.length === 0 ? 0 : 1);
  if (!APPLY) {
    line('Dry run. Nothing written. After the deploy: --apply --deployed.');
    return;
  }
  if (!DEPLOYED) {
    console.error(
      'REFUSING: --apply needs --deployed as well. The Church systems boxes are new schema\n' +
        'fields and the tokens need the new code live (CLAUDE.md rule 1). Merge, deploy, check\n' +
        'the Studio shows Site settings > Church systems, then run with --apply --deployed.',
    );
    process.exit(1);
  }

  const touched = [...plan.map((p) => p.doc)];
  if (!touched.some((d) => d._id === settings._id)) touched.push(settings);
  mkdirSync(dirname(BACKUP_PATH), { recursive: true });
  writeFileSync(BACKUP_PATH, JSON.stringify(touched, null, 2) + '\n');
  line(`Backed up ${touched.length} document(s) verbatim to ${BACKUP_PATH}`);

  const tx = client.transaction();
  for (const { doc, changes } of plan) {
    const set = Object.fromEntries(changes.map((c) => [c.path, c.after]));
    tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set));
  }
  if (Object.keys(settingsFill).length) {
    tx.patch(settings._id, (p) => p.setIfMissing(settingsFill));
  }
  const res = await tx.commit();
  line(
    `Patched ${plan.length} document(s) and Site settings in one transaction (${res.transactionId}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
