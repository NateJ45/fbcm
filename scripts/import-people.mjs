// scripts/import-people.mjs
// Staff from the 16 captured /team/* pages, ministries from the five captured
// ministry pages. Dry by default; --apply is the only thing that writes.
//
// Three departures from the brief's literal runner code, all discovered by
// actually reading the captured data rather than trusting the field names:
//   1. `p.headings.find(h => h.level === 2)` never matches -- every /team/*
//      capture has exactly one heading (level 1, the name). The role
//      ("Pastor", "Clerk", ...) is the second paragraph of bodyText, right
//      after the name, on all 16 pages. Checked before relying on it.
//   2. `p.images[0]` is the SAME shared site icon
//      (08181c_24fe645244944345a5dc782d0f5d2680_tilde_mv2.png, a podcast
//      logo) on every single /team/* page -- using it would give all 16
//      staff members an identical wrong "photo". The real headshot is the
//      image whose alt text equals the person's name (index 1 on every
//      page, verified), so it's matched by alt rather than assumed by index.
//   3. Images live under fbcm-archive/images/, not the archive root, and the
//      upload must be gated on APPLY -- see import-posts.mjs for the same
//      two fixes and why.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { client, APPLY, makeUploader, ROOT, toPT } from './lib/sanity-lib.mjs';

const PAGES = resolve(ROOT, 'scripts/data/pages');
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive', 'images');
const uploader = makeUploader();

const read = (file) => JSON.parse(readFileSync(resolve(PAGES, file), 'utf8'));
const slugOf = (url) => new URL(url).pathname.split('/').filter(Boolean).pop();

/**
 * The live site shows clerk@fbcmuncieorg on /team/nina-oisten, missing its dot.
 * Corrected on the way in, and REPORTED rather than fixed silently: a quiet
 * correction is indistinguishable from a bug the next time someone reads the data.
 *
 * Nina's page has no mailto: link (the missing dot makes it an invalid domain,
 * so Wix never rendered it as a live link) -- the address only exists as plain
 * text in bodyText. So the raw email is read from a mailto: link first, and
 * from a bare "word@word" token in bodyText as a fallback for exactly this
 * case. Checked against all 16 pages: only Nina's bodyText matches that
 * pattern, so this fallback cannot pick up anything else by accident.
 */
const corrections = [];
function fixEmail(email, who) {
  if (!email) return undefined;
  const fixed = email.replace(/@fbcmuncieorg\b/, '@fbcmuncie.org');
  if (fixed !== email) corrections.push(`${who}: ${email} -> ${fixed}`);
  return fixed;
}

function rawEmail(p) {
  const mailto = (p.links ?? []).find((l) => l.href.startsWith('mailto:'));
  if (mailto) return mailto.href.replace('mailto:', '');
  const bare = (p.bodyText ?? '').match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)*\b/);
  return bare ? bare[0] : undefined;
}

/** The role/title is the paragraph right after the name, not a level-2 heading. */
function roleOf(p) {
  const paragraphs = (p.bodyText ?? '').split(/\n{2,}/).map((s) => s.trim());
  return paragraphs[1] || undefined;
}

/** The real headshot is the image whose alt text is the person's own name. */
function photoOf(p) {
  const name = p.h1 ?? p.title;
  return (p.images ?? []).find((img) => img.alt === name) ?? p.images?.[0];
}

const imageRef = async (localFile) => {
  if (!localFile) return undefined;
  const imagePath = resolve(ARCHIVE, localFile);
  if (!existsSync(imagePath)) return undefined;
  if (!APPLY)
    return { _type: 'image', asset: { _type: 'reference', _ref: `dry-run:${localFile}` } };
  return { _type: 'image', asset: { _type: 'reference', _ref: await uploader.upload(imagePath) } };
};

// --- staff ------------------------------------------------------------------
const staffFiles = readdirSync(PAGES).filter(
  (f) => f.endsWith('.json') && read(f).url.includes('/team/'),
);
let staffCount = 0;
let staffPhotos = 0;

for (const [i, file] of staffFiles.entries()) {
  const p = read(file);
  const slug = slugOf(p.url);
  const email = fixEmail(rawEmail(p), slug);
  const photo = photoOf(p);
  const photoImage = await imageRef(photo?.localFile);
  if (photoImage) staffPhotos++;
  const doc = {
    _id: `staff-${slug}`,
    _type: 'staffMember',
    name: p.h1 ?? p.title,
    slug: { _type: 'slug', current: slug },
    role: roleOf(p),
    email,
    bio: p.bodyText?.trim() ? toPT(p.bodyText.trim()) : undefined,
    photo: photoImage,
    order: (i + 1) * 10,
  };
  if (APPLY) {
    await client.createOrReplace(doc);
    staffCount++;
  } else {
    console.log(
      `would write ${doc._id} (${doc.name}) [role: ${doc.role ?? '(none)'}] [photo: ${photo?.localFile ?? '(none)'}]`,
    );
  }
}

// --- ministries -------------------------------------------------------------
const MINISTRIES = ['worship', 'children', 'youth', 'adult', 'outreach'];
let ministryCount = 0;
let ministryPhotos = 0;

for (const [i, slug] of MINISTRIES.entries()) {
  const p = read(`${slug}.json`);
  const photo = p.images?.[0];
  const photoImage = await imageRef(photo?.localFile);
  if (photoImage) ministryPhotos++;
  const doc = {
    _id: `ministry-${slug}`,
    _type: 'ministry',
    title: p.h1 ?? p.title,
    slug: { _type: 'slug', current: slug },
    summary: p.metaDescription ?? undefined,
    body: p.bodyText?.trim() ? toPT(p.bodyText.trim()) : undefined,
    image: photoImage,
    order: (i + 1) * 10,
  };
  if (APPLY) {
    await client.createOrReplace(doc);
    ministryCount++;
  } else {
    console.log(`would write ${doc._id} (${doc.title}) [photo: ${photo?.localFile ?? '(none)'}]`);
  }
}

console.log(`\nstaff: ${staffFiles.length}, ministries: ${MINISTRIES.length}`);
console.log(
  APPLY
    ? `written: ${staffCount} staff, ${ministryCount} ministries`
    : 'DRY RUN, nothing written. Pass --apply to write.',
);
console.log(
  `photos: ${staffPhotos}/${staffFiles.length} staff, ${ministryPhotos}/${MINISTRIES.length} ministries`,
);
if (corrections.length) {
  console.log(`\nemail addresses corrected on the way in: ${corrections.length}`);
  for (const c of corrections) console.log('  ', c);
}
