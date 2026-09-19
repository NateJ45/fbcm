// scripts/retire-sitesettings-fields.mjs
//
// Task 2 of plan 2a removed the service-business fields siteSettings and
// businessInfo were forked with (availabilityStatus, serviceAreas,
// travelFees, businessType, googleBusinessUrl, reviewsNote,
// satisfactionGuarantee, and nine sectionVisibility toggles for capabilities
// that no longer exist). Removing a field from the SCHEMA does not remove its
// DATA: on a live dataset that still has values in those keys, the Studio
// would show a "Remove field" button for each one (CLAUDE.md rule 1 forbids
// clicking it — it deletes the data with no undo).
//
// CLAUDE.md rule 16: retiring data means a backup-then-delete script, run dry
// first, never a raw delete. This script:
//   1. Writes the FULL siteSettings and businessInfo documents, verbatim, to
//      a committed backup file BEFORE touching anything.
//   2. Unsets exactly the removed keys (top-level on siteSettings, listed
//      below on businessInfo), nothing else.
//   3. Is DRY BY DEFAULT. Only --write acts. Both flags are accepted as
//      synonyms so this reads consistently with the family's --apply
//      convention while matching the exact flag name the task brief uses.
//
// Usage:
//   node scripts/retire-sitesettings-fields.mjs            # prints the plan
//   node scripts/retire-sitesettings-fields.mjs --write     # writes the backup + unsets

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client } from './lib/sanity-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write') || process.argv.includes('--apply');

const BACKUP_PATH = resolve(__dirname, 'data', 'backups', 'siteSettings-2026-09-19.json');

// The keys this task removed from the schema. Anything still stored under
// one of these on the live document is retired here.
const SITE_SETTINGS_KEYS = [
  'availabilityStatus',
  'serviceAreas',
  'travelFees',
  'businessType',
  'googleBusinessUrl',
  'reviewsNote',
  'satisfactionGuarantee',
  // sectionVisibility keeps the object itself (showJournal lives there);
  // only these nine sub-fields are retired.
  'sectionVisibility.showPortfolio',
  'sectionVisibility.showShop',
  'sectionVisibility.showEDesign',
  'sectionVisibility.showGiftCertificates',
  'sectionVisibility.showPress',
  'sectionVisibility.showResources',
  'sectionVisibility.showGuides',
  'sectionVisibility.showStyleQuiz',
  'sectionVisibility.showBudgetCalculator',
];

// businessInfo lost its own copies of the same service-business fields.
const BUSINESS_INFO_KEYS = ['availabilityStatus', 'serviceAreas', 'travelFees'];

async function main() {
  const siteSettings = await client.fetch('*[_type == "siteSettings"][0]');
  const businessInfo = await client.fetch('*[_type == "businessInfo"][0]');

  console.log('Plan:');
  console.log(`  Backup file: ${BACKUP_PATH}`);

  if (!siteSettings) {
    console.log('  siteSettings: no document on the dataset yet. Nothing to back up or unset.');
  } else {
    const foundSite = SITE_SETTINGS_KEYS.filter((k) => {
      const [head, sub] = k.split('.');
      return sub ? siteSettings[head]?.[sub] !== undefined : siteSettings[head] !== undefined;
    });
    console.log(
      `  siteSettings (${siteSettings._id}): back up, then unset ${foundSite.length} key(s):`,
    );
    for (const k of foundSite) console.log(`    - ${k}`);
    if (foundSite.length === 0) console.log('    (none of the removed keys are stored)');
  }

  if (!businessInfo) {
    console.log('  businessInfo: no document on the dataset yet. Nothing to back up or unset.');
  } else {
    const foundBiz = BUSINESS_INFO_KEYS.filter((k) => businessInfo[k] !== undefined);
    console.log(
      `  businessInfo (${businessInfo._id}): back up, then unset ${foundBiz.length} key(s):`,
    );
    for (const k of foundBiz) console.log(`    - ${k}`);
    if (foundBiz.length === 0) console.log('    (none of the removed keys are stored)');
  }

  console.log(WRITE ? '\nWRITING...' : '\nDRY RUN. Re-run with --write to back up and unset.');

  if (!WRITE) return;

  // 1. Backup, verbatim, BEFORE any mutation.
  mkdirSync(dirname(BACKUP_PATH), { recursive: true });
  writeFileSync(
    BACKUP_PATH,
    JSON.stringify(
      { siteSettings: siteSettings ?? null, businessInfo: businessInfo ?? null },
      null,
      2,
    ) + '\n',
  );
  console.log(`Backed up to ${BACKUP_PATH}`);

  // 2. Unset exactly the removed keys.
  if (siteSettings) {
    await client.patch(siteSettings._id).unset(SITE_SETTINGS_KEYS).commit();
    console.log(`Unset ${SITE_SETTINGS_KEYS.length} key path(s) on siteSettings.`);
  }
  if (businessInfo) {
    await client.patch(businessInfo._id).unset(BUSINESS_INFO_KEYS).commit();
    console.log(`Unset ${BUSINESS_INFO_KEYS.length} key path(s) on businessInfo.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
