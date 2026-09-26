// The header menu gains Contact and the church's publications (2026-09-26,
// Nathan: "the contact page needs to be in the header nav in some way. Same
// with the newsletters and Visitor, maybe we turn the blog into a drop down
// and change its title to something else so blog can still be in the
// dropdown").
//
// 1. "Our Church" gains Contact, last.
// 2. "Blog" becomes a "News" dropdown: the Blog, The Visitor, and the two
//    ministry newsletters (The Kid's Corner, The Moose's Message).
//
// Dry by default (CLAUDE.md rule 16). --apply writes the live document to
// scripts/data/backups/ first (never over an earlier backup). Each change is
// skipped when it is already in place, so a second run is a no-op.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, APPLY } from './lib/sanity-lib.mjs';

const OUR_CHURCH = 'nav-group-who';
const CONTACT = { _key: 'sub-contact', _type: 'navSubLink', label: 'Contact', href: '/contact' };
const BLOG = 'nav-blog';
const NEWS = {
  _key: 'nav-group-news',
  _type: 'navGroup',
  label: 'News',
  links: [
    { _key: 'sub-blog', _type: 'navSubLink', label: 'Blog', href: '/blog' },
    { _key: 'sub-visitor', _type: 'navSubLink', label: 'The Visitor', href: '/visitor' },
    {
      _key: 'sub-kids-corner',
      _type: 'navSubLink',
      label: "The Kid's Corner",
      href: '/kids-corner',
    },
    {
      _key: 'sub-youth-news',
      _type: 'navSubLink',
      label: "The Moose's Message",
      href: '/youth-news',
    },
  ],
};

const doc = await client.fetch('*[_id == "siteSettings"][0]');
if (!doc) throw new Error('siteSettings not found');
const nav = doc.navItems ?? [];

const group = nav.find((n) => n?._key === OUR_CHURCH);
if (!group) throw new Error(`navigation has no "${OUR_CHURCH}" group; stopping`);
const hasContact = (group.links ?? []).some((l) => l?.href === CONTACT.href);
const hasNews = nav.some((n) => n?._key === NEWS._key);
const blogIndex = nav.findIndex((n) => n?._key === BLOG);
if (!hasNews && blogIndex === -1)
  throw new Error(`navigation has no "${BLOG}" to replace; stopping`);

if (!hasContact) console.log(`Our Church: add "${CONTACT.label}" (${CONTACT.href}) last`);
if (!hasNews) {
  console.log(
    `replace "${nav[blogIndex].label}" (${nav[blogIndex].href}) with the "News" dropdown:`,
  );
  for (const l of NEWS.links) console.log(`  ${l.label} ${l.href}`);
}
if (hasContact && hasNews) {
  console.log('Nothing to change.');
  process.exit(0);
}
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
const stem = `siteSettings-${new Date().toISOString().slice(0, 10)}-pre-nav-news`;
let file = join(dir, `${stem}.json`);
for (let n = 2; existsSync(file); n++) file = join(dir, `${stem}-${n}.json`);
writeFileSync(file, JSON.stringify(doc, null, 2));
console.log(`backup: ${file}`);

// One patch per change, in one transaction: append() and insert() both set a
// patch's single `insert` operation, so two in one patch keep only the last
// (the first run on 2026-09-26 wrote News and silently dropped Contact).
const tx = client.transaction();
if (!hasContact)
  tx.patch('siteSettings', (p) => p.append(`navItems[_key=="${OUR_CHURCH}"].links`, [CONTACT]));
if (!hasNews)
  tx.patch('siteSettings', (p) => p.insert('replace', `navItems[_key=="${BLOG}"]`, [NEWS]));
await tx.commit();
console.log('written.');
