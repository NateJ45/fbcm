// Retires the church's Church Center addresses from Site settings (2026-09-25,
// Nathan's go-ahead: the church is leaving Planning Center/Church Center for
// Church Trac). Backup-first, dry by default (CLAUDE.md rule 16): this script
// is meant to be run dry only for now, reviewed, and --apply run later by the
// main session after review.
//
// WHAT MOVES AND WHAT DOES NOT.
//
//   - sermonsUrl is UNSET. src/lib/church-links.ts's linkValues() already
//     falls {sermons} back to the Live stream address, then the YouTube
//     channel, when Sermon recordings is blank, and Site settings' own
//     Live stream address is already the church's YouTube "past services"
//     page (checked live, 2026-09-25). Unsetting sermonsUrl therefore MOVES
//     every {sermons} link and every "listen to the sermon" link straight to
//     YouTube, with no other change needed.
//   - givingUrl, lifeEventFormUrl, weddingBookingUrl, weddingEnquiryUrl,
//     wednesdayUrl and churchCenterUrl are UNSET (not set to ''): Church Trac
//     has not taken any of these over yet (the church's Church Trac has only
//     the connection card form so far, and online giving needs Stripe, not
//     set up). src/lib/church-links.ts's linkFallback() (2026-09-25) already
//     gives each of these tokens an honest placeholder instead of a dead
//     Church Center link once its box is blank: {giving} to this site's own
//     /give page, {wedding-enquiry} and {wedding-booking} to the wedding
//     office's own mailto: address (already on /wedding as "Email the
//     wedding coordinator"), and {wednesday} / {contact-form} hidden (the
//     words stay, the link does not) rather than a link to nowhere.
//   - visitorFormUrl, calendarUrl, appUrl, prayerUrl and churchTracUrl are
//     UNTOUCHED: Church Trac already has them (scripts/set-church-trac-
//     settings.mjs, 2026-09-25).
//   - The footer's "Elsewhere" column loses its Church Center link (label
//     "Church Center: calendar and giving", pointing at fbcmuncie.
//     churchcenter.com): the calendar moved to Church Trac's own footer link
//     already, and giving has no live address to send anyone to yet.
//
// Unset, not set to '': these are Sanity `url` type fields, and an empty
// string is usually not a valid url value to the Studio's own validation, so
// UNSETTING is the honest way to say "the church has none of this any more"
// (a Sanity document with no field at all, vs. a field holding ''). Reading
// code (church-links.ts's httpUrl()) treats a missing field exactly like a
// blank one, so nothing downstream needs to know which.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, APPLY } from './lib/sanity-lib.mjs';

const UNSET_FIELDS = [
  'sermonsUrl',
  'givingUrl',
  'lifeEventFormUrl',
  'weddingBookingUrl',
  'weddingEnquiryUrl',
  'wednesdayUrl',
  'churchCenterUrl',
];

const doc = await client.fetch('*[_id == "siteSettings"][0]');
if (!doc) throw new Error('siteSettings not found');

const toUnset = UNSET_FIELDS.filter((field) => {
  const value = doc[field];
  return typeof value === 'string' && value.trim() !== '';
});

console.log('Site settings fields to clear (unset, not blank out):');
for (const field of toUnset) console.log(`  ${field}: ${JSON.stringify(doc[field])} -> (unset)`);
if (toUnset.length === 0) console.log('  (none left to clear)');

// The footer's "Elsewhere" column: drop the Church Center link, if it is
// still there. Found by its known key, falling back to its known address so
// a renamed key does not silently skip it.
const footerColumns = doc.footerColumns ?? [];
let ccLinkPath = null;
for (const col of footerColumns) {
  for (const link of col.links ?? []) {
    const isChurchCenter =
      link?._key === 'fcol-elsewhere-cc' ||
      /churchcenter\.com/i.test(String(link?.externalUrl ?? ''));
    if (isChurchCenter) {
      ccLinkPath = `footerColumns[_key=="${col._key}"].links[_key=="${link._key}"]`;
      console.log(
        `Footer "${col.title}" column: remove "${link.label}" (${link.externalUrl}) [${ccLinkPath}]`,
      );
    }
  }
}
if (!ccLinkPath) console.log('Footer: no Church Center link found (already removed).');

if (toUnset.length === 0 && !ccLinkPath) {
  console.log('\nNothing to change.');
  process.exit(0);
}
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to back up and write.');
  process.exit(0);
}

const dir = join(ROOT, 'scripts', 'data', 'backups');
mkdirSync(dir, { recursive: true });
// Never overwrite an earlier backup from the same day: a second run gets -2.
const stem = `siteSettings-${new Date().toISOString().slice(0, 10)}-retire-church-center`;
let file = join(dir, `${stem}.json`);
for (let n = 2; existsSync(file); n++) file = join(dir, `${stem}-${n}.json`);
writeFileSync(file, JSON.stringify(doc, null, 2));
console.log(`backup: ${file}`);

// ONE unset: the client's unset() replaces an earlier unset() on the same
// patch rather than adding to it, so two calls cleared only the footer link
// (caught in review on 2026-09-26, before the first --apply).
const paths = [...toUnset, ...(ccLinkPath ? [ccLinkPath] : [])];
await client.patch('siteSettings').unset(paths).commit();
console.log('written.');
