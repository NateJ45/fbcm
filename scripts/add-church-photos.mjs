// Adds a batch of photos the church sent into the Sanity media library, with a
// title, alt text, description and media-plugin tags, so an editor can pick them
// from the image picker. Placing photos on pages is a separate pass
// (scripts/place-ministry-photos.mjs, scripts/data/page-images.json); this script
// never touches a page or ministry document.
//
// Why not upload-photo-library.mjs: that one walks the Wix archive (453 photos,
// ../fbcm-archive/images). A church batch is a short JSON list beside its own
// folder of originals, so it gets this small runner instead.
//
// The batch file (scripts/data/church-photos-<yyyy-mm>.json) names its folder
// under ../fbcm-archive/ and a source marker. Every asset uploaded here carries
// source { name: <marker>, id: <file> }, which is how scripts/lib/page-images.mjs
// (a `library` entry) and place-ministry-photos.mjs find it again.
//
// DRY BY DEFAULT: prints one line per photo (upload, or already there) and writes
// nothing. `--apply` uploads (resized to 2400px long edge, JPEG q82, EXIF rotation
// applied) and tags. IDEMPOTENT: a photo already in the dataset under its source
// marker is not uploaded again, only its empty metadata and missing tags filled.
//
//   node scripts/add-church-photos.mjs scripts/data/church-photos-2026-10.json
//   node scripts/add-church-photos.mjs scripts/data/church-photos-2026-10.json --apply
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import sharp from 'sharp';
import { client, APPLY, ROOT } from './lib/sanity-lib.mjs';

const MAX_EDGE = 2400;

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** ../fbcm-archive beside the main checkout; from a worktree it is further up. */
function findFolder(folder) {
  for (let dir = ROOT; dir !== dirname(dir); dir = dirname(dir)) {
    const candidate = resolve(dir, '..', 'fbcm-archive', folder);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`fbcm-archive/${folder} not found beside the checkout`);
}

async function main() {
  const batchPath = process.argv.slice(2).find((a) => a.endsWith('.json'));
  if (!batchPath)
    throw new Error('usage: node scripts/add-church-photos.mjs <batch.json> [--apply]');
  const batch = JSON.parse(readFileSync(resolve(ROOT, batchPath), 'utf8'));
  const folder = findFolder(batch.folder);

  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && source.name == $source]{_id, "file": source.id, title, altText, description, "tagIds": opt.media.tags[]._ref}`,
    { source: batch.source },
  );
  const byFile = new Map(existing.map((a) => [a.file, a]));
  const tags = await client.fetch(`*[_type == "media.tag"]{_id, "name": name.current}`);
  const tagId = new Map(tags.map((t) => [t.name, t._id]));
  const unknown = [...new Set(batch.photos.flatMap((p) => p.tags))].filter((t) => !tagId.has(t));
  if (unknown.length)
    throw new Error(`unknown media tags: ${unknown.join(', ')} (use existing ones)`);

  for (const p of batch.photos) {
    const src = resolve(folder, p.file);
    if (!existsSync(src)) throw new Error(`missing original ${src}`);
    const asset = byFile.get(p.file);
    console.log(`${asset ? 'present' : 'upload '}  ${p.file.padEnd(40)} "${p.altText}"`);
  }
  if (!APPLY) {
    console.log('\nDRY RUN: nothing written. Re-run with --apply to upload and tag.');
    return;
  }

  for (const p of batch.photos) {
    let asset = byFile.get(p.file);
    if (!asset) {
      const data = await sharp(resolve(folder, p.file))
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      const up = await client.assets.upload('image', data, {
        filename: `${slug(p.title)}.jpg`,
        title: p.title,
        description: p.description,
        source: { name: batch.source, id: p.file },
      });
      asset = { _id: up._id, tagIds: [] };
    }
    // Fill only what is empty, so an editor's later edits survive a re-run.
    const set = {};
    for (const f of ['title', 'altText', 'description']) if (!asset[f]) set[f] = p[f];
    const have = new Set(asset.tagIds ?? []);
    const refs = p.tags
      .map((t) => tagId.get(t))
      .filter((id) => !have.has(id))
      .map((id) => ({
        _key: id.replace(/^media-tag-/, ''),
        _type: 'reference',
        _ref: id,
        _weak: true,
      }));
    let patch = client.patch(asset._id).set(set);
    if (refs.length) {
      patch = patch
        .setIfMissing({ opt: {} })
        .setIfMissing({ 'opt.media': {} })
        .setIfMissing({ 'opt.media.tags': [] })
        .append('opt.media.tags', refs);
    }
    await patch.commit();
    console.log(`OK  ${p.file} -> ${asset._id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
