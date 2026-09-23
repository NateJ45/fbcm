// Puts every church photograph from the Wix archive into the Sanity media library,
// with a title, alt text, description and media-plugin tags, so an editor can find
// and pick it from the image picker at any time. Placing photos on pages is a
// separate pass; this script never touches a page document.
//
// DRY BY DEFAULT. A dry run reads the dataset (to find assets that already exist),
// resizes in memory to report real byte counts, prints one line per photo and a
// summary, and writes nothing: no asset, no tag, no cache file, no resize file.
// `--apply` uploads and patches. `--overwrite-meta` also replaces a title, alt text
// or description an asset already has (by default only empty fields are filled, so
// an editor's later edits survive a re-run).
//
// IDEMPOTENT three ways, so a second --apply uploads nothing:
//   1. scripts/.asset-map.json (gitignored) caches `photo-library:<file>` -> asset id.
//   2. Every asset this script uploads carries source { name: SOURCE, id: <file> },
//      so a fresh checkout with no cache still finds them in the dataset.
//   3. Photos an earlier script already uploaded (the page seeds in
//      scripts/data/page-images.json, and the post-body import, whose assets are
//      named after the archive file) are REUSED: tagged and described in place,
//      never uploaded a second time.
//
// Tags are sanity-plugin-media's own model (read from its 5.0.11 source): a
// `media.tag` document with name.current, referenced from the asset at
// opt.media.tags as { _key, _type: 'reference', _ref, _weak: true }. Tags are found
// by name first (the plugin's own lookup), so a tag an editor made by hand is reused.
//
// Usage:
//   node scripts/upload-photo-library.mjs                   # dry run
//   node scripts/upload-photo-library.mjs --apply
//   node scripts/upload-photo-library.mjs --archive <dir>   # fbcm-archive root
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import sharp from 'sharp';
import { client, APPLY, ROOT } from './lib/sanity-lib.mjs';

const SOURCE = 'fbcm-wix-archive';
const MAX_EDGE = 2400;
const LIBRARY = resolve(ROOT, 'scripts', 'data', 'photo-library.json');
const PAGE_IMAGES = resolve(ROOT, 'scripts', 'data', 'page-images.json');
const ASSET_MAP_PATH = resolve(ROOT, 'scripts', '.asset-map.json');
const OVERWRITE = process.argv.includes('--overwrite-meta');

/** The archive sits beside the main checkout; from a worktree that is several
 *  levels up, so walk up until an fbcm-archive/images folder appears. */
function findArchive() {
  const i = process.argv.indexOf('--archive');
  if (i > -1) return resolve(process.argv[i + 1], 'images');
  for (let dir = ROOT; dir !== dirname(dir); dir = dirname(dir)) {
    const candidate = resolve(dir, '..', 'fbcm-archive', 'images');
    if (existsSync(candidate)) return candidate;
  }
  throw new Error('fbcm-archive/images not found; pass --archive <dir>');
}

/** Wix served the same media as `x~mv2.jpg` and the capture saved it as
 *  `x_tilde_mv2.jpg` (or kept the tilde), so compare on one spelling. */
const norm = (name) => basename(name.replace(/\\/g, '/')).replace(/~mv2/g, '_tilde_mv2');

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The fields to set on an existing asset: empty metadata filled (or all of it
 *  replaced under --overwrite-meta), a source marker on an asset an older script
 *  uploaded without one, and a readable name in place of a local file path (the
 *  post import named assets "C:\Users\...", which is what an editor read in the
 *  media library). */
function metaSet(asset, p) {
  const set = {};
  for (const f of ['title', 'altText', 'description']) {
    if (p[f] && (OVERWRITE ? asset[f] !== p[f] : !asset[f])) set[f] = p[f];
  }
  if (!asset.source) set.source = { name: SOURCE, id: p.file, url: p.sourceUrl ?? undefined };
  if (/[\\:]/.test(asset.originalFilename ?? '')) set.originalFilename = `${slug(p.title)}.jpg`;
  return set;
}

async function resizeToBuffer(src) {
  return sharp(src)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
}

async function main() {
  const library = JSON.parse(readFileSync(LIBRARY, 'utf8'));
  const photos = library.photos.filter((p) => p.upload);
  const archive = findArchive();
  const assetMap = existsSync(ASSET_MAP_PATH)
    ? JSON.parse(readFileSync(ASSET_MAP_PATH, 'utf8'))
    : {};
  const cacheKey = (file) => `photo-library:${file}`;

  // --- What already exists in the dataset (reads only) ------------------------
  const assets = await client.fetch(
    `*[_type == "sanity.imageAsset"]{_id, originalFilename, source, title, altText, description,
      "tagIds": opt.media.tags[]._ref}`,
  );
  const byId = new Map(assets.map((a) => [a._id, a]));
  const bySource = new Map();
  const byArchiveName = new Map();
  for (const a of assets) {
    if (a.source?.name === SOURCE && a.source.id) bySource.set(a.source.id, a._id);
    if (a.originalFilename) byArchiveName.set(norm(a.originalFilename), a._id);
  }
  // Page seeds uploaded "<key>.jpg"; map those back to the archive file they came from.
  const pageImages = JSON.parse(readFileSync(PAGE_IMAGES, 'utf8'));
  for (const [key, entry] of Object.entries(pageImages)) {
    if (!entry.file) continue;
    const hit = assets.find((a) => a.originalFilename === `${key}.jpg`);
    if (hit && !byArchiveName.has(norm(entry.file))) byArchiveName.set(norm(entry.file), hit._id);
  }

  const tagNames = library.tags;
  const existingTags = await client.fetch(`*[_type == "media.tag"]{_id, "name": name.current}`);
  const tagId = new Map(existingTags.map((t) => [t.name, t._id]));
  const missingTags = tagNames.filter((t) => !tagId.has(t));

  // --- Plan: one line per photo -----------------------------------------------
  const plan = [];
  let uploadBytes = 0;
  for (const p of photos) {
    const src = resolve(archive, p.file);
    if (!existsSync(src)) throw new Error(`missing archive file ${src}`);
    // A photo counts as present if this script, or an earlier one, uploaded it or
    // any byte-identical twin of it.
    const names = [p.file, ...(p.twins ?? [])];
    const cached = names.map((n) => assetMap[cacheKey(n)]).find((id) => id && byId.has(id));
    const sourced = names.map((n) => bySource.get(n)).find(Boolean);
    const reused = names.map((n) => byArchiveName.get(norm(n))).find(Boolean);
    const assetId = cached ?? sourced ?? reused ?? null;
    const status = cached ? 'cached' : sourced ? 'found' : reused ? 'reuse' : 'upload';

    let bytes = 0;
    let dims = `${p.w}x${p.h}`;
    if (status === 'upload') {
      const { data, info } = await resizeToBuffer(src);
      bytes = data.length;
      uploadBytes += bytes;
      dims += ` -> ${info.width}x${info.height}`;
    }
    const asset = assetId ? byId.get(assetId) : null;
    const metaChanges = asset
      ? Object.keys(metaSet(asset, p))
      : ['title', 'altText', 'description'];
    const haveTags = new Set(asset?.tagIds ?? []);
    const tagChanges = p.tags.filter((t) => !tagId.has(t) || !haveTags.has(tagId.get(t)));
    const needsPatch = metaChanges.length > 0 || tagChanges.length > 0;
    plan.push({ p, src, assetId, status, needsPatch, metaChanges, tagChanges });

    const flag =
      status === 'cached' && !needsPatch
        ? 'cached'
        : `${status}${needsPatch && status !== 'upload' ? '+meta' : ''}`;
    console.log(
      `${flag.padEnd(11)} ${p.file.padEnd(56)} ${dims.padEnd(22)} ` +
        `${bytes ? `${(bytes / 1024).toFixed(0).padStart(5)} KB` : '        '}  ` +
        `[${p.tags.join(', ')}]  "${p.title}"`,
    );
  }

  // --- Summary ------------------------------------------------------------------
  const count = (s) => plan.filter((x) => x.status === s).length;
  const perTag = Object.fromEntries(
    tagNames.map((t) => [t, photos.filter((p) => p.tags.includes(t)).length]),
  );
  console.log(`\nphotos in library: ${photos.length}`);
  console.log(
    `  upload ${count('upload')}, reuse existing asset ${count('reuse')}, ` +
      `found by source ${count('found')}, cached ${count('cached')}`,
  );
  console.log(`  metadata or tag patches: ${plan.filter((x) => x.needsPatch).length}`);
  console.log(
    `  new upload size: ${(uploadBytes / 1e6).toFixed(1)} MB (resized to ${MAX_EDGE}px long edge, JPEG q82)`,
  );
  console.log(`  tags to create: ${missingTags.length ? missingTags.join(', ') : 'none'}`);
  console.log('  photos per tag:');
  for (const [t, n] of Object.entries(perTag)) console.log(`    ${t.padEnd(20)} ${n}`);

  if (!APPLY) {
    console.log('\nDRY RUN: nothing written. Re-run with --apply to upload and tag.');
    return;
  }

  // --- Apply ---------------------------------------------------------------------
  for (const name of missingTags) {
    const doc = await client.createIfNotExists({
      _id: `media-tag-${slug(name)}`,
      _type: 'media.tag',
      name: { _type: 'slug', current: name },
    });
    tagId.set(name, doc._id);
    console.log(`OK  tag "${name}" -> ${doc._id}`);
  }

  let uploaded = 0;
  let patched = 0;
  for (const item of plan) {
    const { p } = item;
    let id = item.assetId;
    if (!id) {
      const { data } = await resizeToBuffer(item.src);
      const asset = await client.assets.upload('image', data, {
        filename: `${slug(p.title)}.jpg`,
        title: p.title,
        description: p.description,
        source: { name: SOURCE, id: p.file, url: p.sourceUrl ?? undefined },
      });
      id = asset._id;
      uploaded++;
    }
    assetMap[cacheKey(p.file)] = id;
    writeFileSync(ASSET_MAP_PATH, JSON.stringify(assetMap, null, 2));

    const current = await client.fetch(
      `*[_id == $id][0]{title, altText, description, originalFilename, source,
        "tagIds": opt.media.tags[]._ref}`,
      { id },
    );
    const set = metaSet(current, p);
    const have = new Set(current.tagIds ?? []);
    const refs = p.tags
      .map((t) => tagId.get(t))
      .filter((tid) => !have.has(tid))
      .map((tid) => ({
        _key: tid.replace(/^media-tag-/, ''),
        _type: 'reference',
        _ref: tid,
        _weak: true,
      }));
    if (Object.keys(set).length || refs.length) {
      let patch = client.patch(id).set(set);
      if (refs.length) {
        patch = patch
          .setIfMissing({ opt: {} })
          .setIfMissing({ 'opt.media': {} })
          .setIfMissing({ 'opt.media.tags': [] })
          .append('opt.media.tags', refs);
      }
      await patch.commit();
      patched++;
    }
    console.log(`OK  ${item.status.padEnd(7)} ${p.file} -> ${id}`);
  }
  console.log(`\nAPPLIED: ${uploaded} uploaded, ${patched} patched, ${plan.length} in library.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
