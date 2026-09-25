// Site settings for the move to Church Trac (2026-09-25, Nathan's go-ahead).
//
// 1. Church systems: the events calendar, the church app and the prayer list
//    point at Church Trac (read from Church Trac's admin the same day: the
//    public calendar, the app's share code, and /pray, the second most
//    visited Church Connect page).
// 2. Navigation: "What's On" (/events) after Ministries. The newsletters stay
//    out of the header, as The Visitor does (Nathan, 2026-09-24): the footer
//    and the Ministries bands link them.
//
// Dry by default (CLAUDE.md rule 16). --apply writes the live document to
// scripts/data/backups/ first. Each change is skipped when it is already in
// place, so a second run is a no-op.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, APPLY } from './lib/sanity-lib.mjs';

const LINKS = {
  calendarUrl: 'https://www.churchtrac.com/public_calendar?ui=0C7B1090',
  appUrl: 'https://open.churchtrac.com?code=8PG6ZJ',
  prayerUrl: 'https://fbcmuncie.churchtrac.com/pray',
};
const NAV = { _key: 'nav-whats-on', _type: 'navLink', label: "What's On", href: '/events' };
const AFTER = 'nav-ministries';

const doc = await client.fetch('*[_id == "siteSettings"][0]');
if (!doc) throw new Error('siteSettings not found');

const set = {};
for (const [field, url] of Object.entries(LINKS)) {
  if (doc[field] === url) continue;
  console.log(`${field}: ${JSON.stringify(doc[field] ?? null)} -> ${url}`);
  set[field] = url;
}

const nav = doc.navItems ?? [];
const hasNav = nav.some((n) => n?._key === NAV._key || n?.href === NAV.href);
if (!hasNav && !nav.some((n) => n?._key === AFTER)) {
  throw new Error(`navigation has no "${AFTER}" to insert after; stopping`);
}
if (!hasNav) console.log(`navItems: insert "${NAV.label}" (${NAV.href}) after ${AFTER}`);

if (Object.keys(set).length === 0 && hasNav) {
  console.log('Nothing to change.');
  process.exit(0);
}
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
const file = join(
  dir,
  `siteSettings-${new Date().toISOString().slice(0, 10)}-pre-church-trac.json`,
);
writeFileSync(file, JSON.stringify(doc, null, 2));
console.log(`backup: ${file}`);

let patch = client.patch('siteSettings');
if (Object.keys(set).length) patch = patch.set(set);
if (!hasNav) patch = patch.insert('after', `navItems[_key=="${AFTER}"]`, [NAV]);
await patch.commit();
console.log('written.');
