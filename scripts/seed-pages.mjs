// scripts/seed-pages.mjs
//
// ONE runner for every plan-2b page. Each page is a module in scripts/pages/
// that exports what it is and how to build it; this file finds them, builds
// them, prints the plan, and only writes when you ask it to.
//
// Usage:
//   node scripts/seed-pages.mjs                 # dry: plan for every page
//   node scripts/seed-pages.mjs --list          # just the module list
//   node scripts/seed-pages.mjs --only visit    # dry: one page (comma-separate for more)
//   node scripts/seed-pages.mjs --only visit --apply
//
// FOUR GUARANTEES, and they are the reason this is one runner and not eleven
// scripts (CLAUDE.md rules 15 and 16):
//
//   DRY BY DEFAULT.  Nothing is written without --apply. The plan you read is
//                    the plan that runs.
//   BACKUP FIRST.    Before the first write to any _id, the live document is
//                    saved verbatim to scripts/data/backups/<id>-<date>-plan2b.json
//                    (null when it does not exist yet, because the absence is
//                    itself the record). An existing backup for the same id on
//                    the same day is never overwritten; a suffix is added.
//   IDEMPOTENT.      The built document is compared with the live one, field by
//                    field, ignoring _rev/_createdAt/_updatedAt, using a stable
//                    stringify. Equal means `unchanged` and no write at all, so
//                    --apply twice is provably a no-op the second time.
//   ONE APPROVAL NOTE.  Every run, dry or wet, regenerates
//                    docs/superpowers/notes/2026-09-19-copy-for-church-approval.md
//                    from ALL modules (not just the --only ones), so the church
//                    always sees every sentence the new site adds to their own.
//
// The module contract:
//
//   export default {
//     id: 'page-visit',              // 'page-<slug>' for page docs; the fixed
//                                    // id for a singleton (homePage, etc.)
//     type: 'page',                  // or homePage | privacyPage | notFoundPage | journalPage
//     slug: 'visit',
//     async build(ctx) { return { title, slug, pageBuilder: [...], ... } },
//     newCopy: ['...'],              // every sentence that did not exist on Wix
//     edits: ['...'],                // every clause that glosses or replaces a
//                                    // word of the church's own text, and every
//                                    // cut worth naming. NOT new sentences: the
//                                    // words are still theirs, changed in place.
//     confirm: ['...'],              // facts THIS page had to force, or that
//                                    // the church's own sources contradict each
//                                    // other about. A third question, after the
//                                    // new sentences and the edits: not "do you
//                                    // want this?" and not "is this still what
//                                    // you meant?" but "which of your two
//                                    // answers is the true one?" Quote the
//                                    // conflicting phrases with file:line so a
//                                    // reader can check without hunting.
//     photoConsent: ['hero-children'],  // page-images manifest keys of photos
//                                    // with identifiable children in them
//   };
//
//   ctx = { images, copy, settings, staff, ministries, keys }
//     images   makePageImages(client).image(key) -> a block-ready image object
//     copy     everything scripts/lib/page-copy.mjs exports
//     settings the live siteSettings document
//     staff    the live staffMember documents, ordered
//     ministries the live ministry documents (ministries.mjs refuses to point
//              a band at one that scripts/connect-ministries.mjs has not filled)
//     keys     keys('hero') -> a function yielding 'hero-1', 'hero-2', ...

import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@sanity/client';
import { loadEnv } from './lib/loadEnv.mjs';
import * as copy from './lib/page-copy.mjs';
import { renderApprovalNote } from './lib/approval-note.mjs';
import { placeholdersForTypedCopies } from '../src/lib/settings-placeholders.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PAGES_DIR = resolve(__dirname, 'pages');
const BACKUP_DIR = resolve(root, 'scripts', 'data', 'backups');
const NOTE_PATH = resolve(
  root,
  'docs',
  'superpowers',
  'notes',
  '2026-09-19-copy-for-church-approval.md',
);

// ── The facts the church has to confirm ─────────────────────────────────────
// Copied VERBATIM from section 9 ("What the church has to decide") of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md. It lives here
// as a constant so the generated note carries it without the runner having to
// parse a spec that is going to be edited by hand.
const FACTS_TO_CONFIRM = [
  'Nursery 104 / Family Room 105, or the reverse.',
  "Who leads Children's Ministry: Jaden Johnson, Jennifer Durke or Michelle Heimlich\n   (three names circulate for one role).",
  'City Life Club really at 7:17 pm?',
  'The 1917 note-burning: 24 or 30 December.',
  'What "Christian wedding" means for a couple asking.',
  'Give page copy in their words, and whether to state anything about tax status.',
  'Photo consent for the identifiable children in the hero frame and the ministries\n   band.',
  'The photo day: fellowship, outreach, youth in use; a second sanctuary angle with\n   people; a golden-hour exterior; headshots for Jaden Johnson, Andy Heimlich, Sally\n   Butler and Nina Oisten.',
  'Approve the one new dependency (`@portabletext/block-tools`).',
];

// Nav order. The note is written in the order a visitor meets the pages, not in
// whatever order readdir hands them over, so the file only changes when the
// COPY changes.
const NAV_ORDER = [
  'home',
  'visit',
  'who-we-are',
  'beliefs',
  'ministries',
  'staff',
  'history',
  'wedding',
  'give',
  'contact',
  'blog',
  'privacy',
  'not-found',
];

// ── Args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const listOnly = argv.includes('--list');
const onlyArg = (() => {
  const i = argv.indexOf('--only');
  if (i === -1) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) return null;
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
})();

// ── Env + client ────────────────────────────────────────────────────────────
// Same construction as scripts/seed-core.mjs, via the shared loader. The token
// is never printed.
const env = loadEnv(root);
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET ?? 'production';
const token = env.SANITY_API_WRITE_TOKEN;

const configured = Boolean(projectId && token);
const client = configured
  ? createClient({ projectId, dataset, token, apiVersion: '2026-05-01', useCdn: false })
  : null;

if (!configured) {
  console.log('No Sanity project configured (PUBLIC_SANITY_PROJECT_ID / SANITY_API_WRITE_TOKEN).');
  console.log('Running offline: no live documents, no image uploads, no writes.');
  if (apply) {
    console.log('--apply needs a configured project and a write token. Nothing was written.');
    process.exit(1);
  }
}

// ── Reserved slugs ──────────────────────────────────────────────────────────
// src/lib/reservedSlugs.ts is TypeScript and cannot be imported here, so the
// list is READ from it rather than copied: a second hand-kept copy is exactly
// the thing that goes stale (the schema file makes the same argument).
function readReservedSlugs() {
  const src = readFileSync(resolve(root, 'src', 'lib', 'reservedSlugs.ts'), 'utf8');
  const body = src.match(/RESERVED_SLUGS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  if (!body)
    throw new Error('seed-pages: could not read RESERVED_SLUGS from src/lib/reservedSlugs.ts');
  return new Set([...body[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}
const RESERVED = readReservedSlugs();

// Singleton types keep their fixed ids; everything else is a `page` document
// whose id is page-<slug>.
const SINGLETON_IDS = {
  homePage: 'homePage',
  privacyPage: 'privacyPage',
  notFoundPage: 'notFoundPage',
  journalPage: 'journalPage',
};

// ── Stable compare ──────────────────────────────────────────────────────────
const SYSTEM_KEYS = new Set(['_rev', '_createdAt', '_updatedAt']);

/** Stable stringify: sorted keys, so key ORDER is never mistaken for a change. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

/** The comparable shape of a document: system keys dropped. */
function comparable(doc) {
  return canonical(comparableFields(doc));
}

/** The same shape as an object, so two documents can be diffed key by key. */
function comparableFields(doc) {
  const out = {};
  for (const k of Object.keys(doc ?? {})) {
    if (SYSTEM_KEYS.has(k)) continue;
    out[k] = doc[k];
  }
  return out;
}

// ── What differs ────────────────────────────────────────────────────────────
// WHY THIS EXISTS. `comparable(live) === comparable(doc)` is the right
// idempotence test, but on its own the dry plan an operator reads says only
// "would be replaced". Once the church is editing copy in the Studio, which is
// the whole point of seeding it there, a routine `--apply` throws those edits
// away and the one word of warning does not say what is about to go. The
// backup makes it recoverable; this makes it READABLE BEFORE it happens, which
// is what CLAUDE.md rule 16 is actually asking for.
//
// Top-level fields first, then, because pageBuilder is where the copy lives
// and a whole-array "differs" is useless, the block INDEXES that differ inside
// it, each with its type and, when the type itself changed, both types.

/** The top-level field names whose canonical value differs between two docs. */
function changedFields(live, doc) {
  const a = comparableFields(live);
  const b = comparableFields(doc);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  return keys
    .filter((k) => canonical(a[k]) !== canonical(b[k]))
    .map((k) => {
      const inLive = k in a;
      const inNew = k in b;
      if (!inLive) return `${k} (new)`;
      if (!inNew) return `${k} (dropped)`;
      return k;
    });
}

/** Human lines describing which pageBuilder blocks differ, by index. */
function changedBlocks(live, doc) {
  const a = Array.isArray(live?.pageBuilder) ? live.pageBuilder : [];
  const b = Array.isArray(doc?.pageBuilder) ? doc.pageBuilder : [];
  const lines = [];
  if (a.length !== b.length) lines.push(`length ${a.length} -> ${b.length}`);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i];
    const y = b[i];
    if (canonical(x) === canonical(y)) continue;
    if (x === undefined) lines.push(`[${i}] added ${y?._type ?? '?'}`);
    else if (y === undefined) lines.push(`[${i}] removed ${x?._type ?? '?'}`);
    else if (x?._type !== y?._type) lines.push(`[${i}] ${x?._type} -> ${y?._type}`);
    else lines.push(`[${i}] ${y?._type}`);
  }
  return lines;
}

/** Print the plan's "what differs" block, indented under the document line. */
function printDifferences(live, doc) {
  const fields = changedFields(live, doc);
  if (fields.length === 0) return;
  console.log(`    fields: ${fields.join(', ')}`);
  if (!fields.some((f) => f.startsWith('pageBuilder'))) return;
  const blocks = changedBlocks(live, doc);
  if (blocks.length > 0) console.log(`    pageBuilder: ${blocks.join(', ')}`);
}

// ── Module loading ──────────────────────────────────────────────────────────
async function loadModules() {
  if (!existsSync(PAGES_DIR)) return [];
  const files = readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith('.mjs'))
    .sort();
  const mods = [];
  for (const f of files) {
    const mod = (await import(pathToFileURL(resolve(PAGES_DIR, f)).href)).default;
    if (!mod) throw new Error(`seed-pages: ${f} has no default export`);
    validate(mod, f);
    // A leading underscore means "not part of the site": the file is a scratch
    // or example module, invisible to a plain run and to the approval note.
    // Naming it in --only is the one way to reach it.
    mods.push({ file: f, hidden: f.startsWith('_'), ...mod });
  }
  // Nav order first, then anything unlisted, alphabetically. Deterministic.
  return mods.sort((a, b) => {
    const ia = NAV_ORDER.indexOf(a.slug);
    const ib = NAV_ORDER.indexOf(b.slug);
    if (ia !== ib) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.slug.localeCompare(b.slug);
  });
}

function validate(mod, file) {
  for (const field of ['id', 'type', 'slug', 'build']) {
    if (!mod[field]) throw new Error(`seed-pages: ${file} is missing "${field}"`);
  }
  if (typeof mod.build !== 'function')
    throw new Error(`seed-pages: ${file} build must be a function`);
  if (mod.type === 'page') {
    if (RESERVED.has(mod.slug)) {
      throw new Error(
        `seed-pages: ${file} uses the reserved slug "${mod.slug}" (src/lib/reservedSlugs.ts). ` +
          'A custom page may not shadow a built-in route.',
      );
    }
    if (mod.id !== `page-${mod.slug}`) {
      throw new Error(`seed-pages: ${file} id must be "page-${mod.slug}", got "${mod.id}"`);
    }
  } else {
    const expected = SINGLETON_IDS[mod.type];
    if (!expected) throw new Error(`seed-pages: ${file} has unknown type "${mod.type}"`);
    if (mod.id !== expected) {
      throw new Error(`seed-pages: ${file} id must be "${expected}" for type ${mod.type}`);
    }
  }
}

// ── Context ─────────────────────────────────────────────────────────────────
async function makeContext() {
  let images = {
    // Offline stand-in: a build that asks for a photo gets told why it has none
    // rather than a half-built block that looks fine in the plan.
    async image(key) {
      throw new Error(
        `seed-pages: image("${key}") needs a configured project and write token to upload.`,
      );
    },
    manifest: existsSync(resolve(root, 'scripts', 'data', 'page-images.json'))
      ? JSON.parse(readFileSync(resolve(root, 'scripts', 'data', 'page-images.json'), 'utf8'))
      : {},
  };
  let settings = null;
  let staff = [];
  let ministries = [];

  if (configured) {
    const { makePageImages } = await import('./lib/page-images.mjs');
    images = makePageImages(client);
    settings = await client.fetch('*[_type == "siteSettings"][0]');
    staff = await client.fetch('*[_type == "staffMember"]|order(order asc, name asc)');
    ministries = await client.fetch('*[_type == "ministry"]');
  }

  return { images, copy, settings, staff, ministries, keys: copy.keyer };
}

// ── Backups ─────────────────────────────────────────────────────────────────
function writeBackup(id, live) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${id}-${stamp}-plan2b`;
  let path = resolve(BACKUP_DIR, `${base}.json`);
  // A backup is a record. An existing one for the same id on the same day is
  // KEPT and the new one gets a counter, so the first capture of a document is
  // never the one that gets overwritten.
  let n = 1;
  while (existsSync(path)) {
    n += 1;
    path = resolve(BACKUP_DIR, `${base}-${n}.json`);
  }
  writeFileSync(path, `${JSON.stringify(live ?? null, null, 2)}\n`, 'utf8');
  return path;
}

// ── The plan line for one section ───────────────────────────────────────────
function sectionLabel(block) {
  const named = block.heading ?? block.headline ?? block.verse ?? block.title ?? block.eyebrow;
  if (typeof named === 'string' && named.trim()) return named.trim().slice(0, 60);
  // No named line: fall back to the first 60 characters of any text it carries.
  const text = JSON.stringify(block).replace(/[^ -~]/g, ' ');
  const firstText = /"text":"([^"]{1,200})"/.exec(text);
  if (firstText) return firstText[1].slice(0, 60);
  return '(no heading)';
}

// ── The approval note ───────────────────────────────────────────────────────
// The rendering itself (page sections, the chrome copy that belongs to no
// page module, and the confirm-list footer) lives in scripts/lib/approval-note.mjs
// as a pure function, so it can be unit-tested without fs/Sanity and so it
// cannot drift from what a bare `node --test` run checks. This wrapper only
// does the I/O.
function writeApprovalNote(mods, manifest) {
  const content = renderApprovalNote(mods, manifest, FACTS_TO_CONFIRM);
  mkdirSync(dirname(NOTE_PATH), { recursive: true });
  writeFileSync(NOTE_PATH, content, 'utf8');
  return NOTE_PATH;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const loaded = await loadModules();
  const names = (m) => [
    m.slug,
    m.id,
    m.file.replace(/\.mjs$/, ''),
    m.file.replace(/^_/, '').replace(/\.mjs$/, ''),
  ];
  // A hidden module joins the run, and the note, only when it is asked for by
  // name. A plain run never sees one.
  const all = loaded.filter(
    (m) => !m.hidden || (onlyArg && names(m).some((n) => onlyArg.includes(n))),
  );

  if (listOnly) {
    if (all.length === 0) console.log('No page modules in scripts/pages/.');
    for (const m of all)
      console.log(`${m.slug.padEnd(14)} ${m.type.padEnd(14)} ${m.id}  (${m.file})`);
    return;
  }

  const wanted = onlyArg ? all.filter((m) => names(m).some((n) => onlyArg.includes(n))) : all;

  if (onlyArg && wanted.length === 0) {
    console.log(`No page module matches --only ${onlyArg.join(',')}.`);
    console.log(`Known: ${all.map((m) => m.slug).join(', ') || '(none)'}`);
    process.exitCode = 1;
    return;
  }

  const ctx = await makeContext();

  console.log(apply ? 'APPLY: documents will be written.' : 'DRY RUN: nothing will be written.');
  console.log('');

  for (const mod of wanted) {
    copy.resetCtaKeys();
    const built = await mod.build(ctx);
    // The modules read Site settings to write the service time, the address,
    // the phone and the email into their bands. Those become placeholders here
    // ({time}, {address}...), so the value lives once, in Site settings, and a
    // re-seed can never type the copies back in (src/lib/settings-placeholders.ts).
    const raw = { _id: mod.id, _type: mod.type, ...built };
    const doc = ctx.settings ? placeholdersForTypedCopies(raw, ctx.settings) : raw;

    console.log(`${mod.id}  (${mod.type})  /${mod.slug}`);

    const live = configured ? await client.fetch('*[_id == $id][0]', { id: mod.id }) : null;

    const sections = Array.isArray(doc.pageBuilder) ? doc.pageBuilder : [];
    if (sections.length === 0) console.log('  (no pageBuilder sections)');
    sections.forEach((block, i) => {
      console.log(`  ${i + 1}. ${String(block._type).padEnd(22)} ${sectionLabel(block)}`);
    });

    if (!configured) {
      console.log('  offline: no live document to compare.');
      console.log('');
      continue;
    }

    const same = live && comparable(live) === comparable(doc);
    if (same) {
      console.log('  unchanged');
      console.log('');
      continue;
    }

    const verb = live ? 'replaced' : 'created';
    if (!apply) {
      console.log(`  would be ${verb}`);
      // A replacement overwrites whatever is live, so the plan names what it
      // would overwrite. A creation has nothing to diff against.
      if (live) printDifferences(live, doc);
      console.log('');
      continue;
    }

    // The same field list the dry run prints, printed on the wet run too, so
    // the terminal record of what was overwritten is as readable as the plan.
    if (live) printDifferences(live, doc);

    // Backup first, always, and BEFORE the write.
    const backup = writeBackup(mod.id, live);
    console.log(
      live
        ? `  backed up the live document to ${backup}`
        : `  no live document yet; backed up that absence (null) to ${backup}`,
    );
    await client.createOrReplace(doc);
    console.log(`  ${verb}`);
    console.log('');
  }

  // A dry run never uploads (scripts/lib/page-images.mjs); it lists what --apply
  // would, so the operator knows the plan above carries placeholder refs there.
  const pending = ctx.images.pending ?? [];
  if (!apply && pending.length > 0) {
    console.log(`--apply would upload ${pending.length} photo(s) first:`);
    for (const p of pending) console.log(`  ${p.key}: ${p.file} -> ${p.path}`);
    console.log('');
  }

  // The note is built from ALL modules, never just the requested ones, so it is
  // always the whole picture the church is asked to approve.
  const notePath = writeApprovalNote(all, ctx.images.manifest ?? {});
  console.log(`Approval note: ${notePath}  (${all.length} page${all.length === 1 ? '' : 's'})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
