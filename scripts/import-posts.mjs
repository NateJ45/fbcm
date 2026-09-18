// scripts/import-posts.mjs
// Thin runner. All the RULES live in src/lib/import-post.ts, which is unit tested;
// this file only reads files, uploads images and writes documents.
//
// Dry by default: --apply is the only thing that writes.
//
// Two departures from the brief's literal runner code, both because the data on
// disk doesn't match what the literal version assumed:
//   1. Images live under fbcm-archive/images/, not the archive root
//      (fbcm-archive/README.md: images | files | video). Resolving `cover`
//      straight off ARCHIVE 404s on every single post.
//   2. The upload must be gated on APPLY. Calling uploader.upload() before the
//      APPLY check makes a dry run write real assets to Sanity and the local
//      asset-map cache, which breaks the "dry by default" rule this whole
//      import is supposed to honor.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { client, APPLY, makeUploader, ROOT } from './lib/sanity-lib.mjs';
import { postFromCapture, categoryDocId } from '../src/lib/import-post.ts';

const POSTS = resolve(ROOT, 'scripts/data/posts');
// The binaries are not in the repo. See ../fbcm-archive/README.md.
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive', 'images');

const uploader = makeUploader();
const files = readdirSync(POSTS).filter((f) => f.endsWith('.json') && f !== 'index.json');
const captures = files.map((f) => JSON.parse(readFileSync(resolve(POSTS, f), 'utf8')));

// Categories FIRST. Posts reference them, and a reference to a document that does
// not exist yet is a broken reference the Studio shows as a missing document.
const categoryNames = [...new Set(captures.flatMap((c) => c.categories ?? []))].sort();
for (const name of categoryNames) {
  const doc = { _id: categoryDocId(name), _type: 'journalCategory', title: name };
  if (APPLY) await client.createOrReplace(doc);
  else console.log(`would write ${doc._id} (${name})`);
}
console.log(`categories: ${categoryNames.length}`);

let written = 0;
let withCover = 0;
let noCoverInCapture = 0;
const missingImages = [];

for (const captured of captures) {
  const doc = postFromCapture(captured);

  const cover = captured.coverImage?.localFile;
  if (!cover) {
    noCoverInCapture++;
  } else {
    const coverPath = resolve(ARCHIVE, cover);
    if (!existsSync(coverPath)) {
      missingImages.push(`${captured.slug}: ${cover} (not found in archive)`);
    } else if (APPLY) {
      try {
        doc.coverImage = {
          _type: 'image',
          asset: { _type: 'reference', _ref: await uploader.upload(coverPath) },
        };
        withCover++;
      } catch (e) {
        missingImages.push(`${captured.slug}: ${cover} (${e.message})`);
      }
    } else {
      withCover++;
    }
  }

  if (APPLY) {
    await client.createOrReplace(doc);
    written++;
  } else {
    console.log(`would write ${doc._id} (${doc.slug.current})${cover ? ` [cover: ${cover}]` : ''}`);
  }
}

console.log(`\nposts: ${files.length}`);
console.log(APPLY ? `written: ${written}` : 'DRY RUN, nothing written. Pass --apply to write.');
console.log(
  `\ncover images: ${withCover} would/did upload, ${noCoverInCapture} posts had no cover captured, ${missingImages.length} failed`,
);
if (missingImages.length) {
  console.log(`\nimages that could not be uploaded: ${missingImages.length}`);
  for (const m of missingImages) console.log('  ', m);
}
