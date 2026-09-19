// Dry-run-by-default driver for scripts/lib/page-images.mjs. Prints one line per
// manifest key (file, exists, dimensions, target width, alias/format), and with
// --apply resizes + uploads every non-null key, printing the resulting asset id.
// A second --apply run should print "cached" for every key: nothing re-uploads.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { client, APPLY, done } from './lib/sanity-lib.mjs';
import { loadManifest, makePageImages, resolveEntry } from './lib/page-images.mjs';

const ARCHIVE = resolve(import.meta.dirname, '..', '..', 'fbcm-archive', 'images');
const ASSET_MAP_PATH = resolve(import.meta.dirname, '.asset-map.json');

/** The rel path makeUploader caches an asset id under, for a manifest key
 *  (following aliases to their target's cache filename). */
function relPathFor(manifest, key) {
  const { key: targetKey, entry } = resolveEntry(manifest, key);
  if (!entry.file) return null;
  const format = entry.format === 'png' ? 'png' : 'jpg';
  return `scripts/.page-images/${targetKey}.${format}`;
}

async function main() {
  const manifest = loadManifest();
  const keys = Object.keys(manifest);

  console.log(`page-images manifest: ${keys.length} keys\n`);

  // --- Dry-run table: one line per key, always printed (even under --apply) so the
  // report has a single source for "what does the manifest resolve to". -------------
  for (const key of keys) {
    const entry = manifest[key];
    if (entry.same) {
      console.log(`${key.padEnd(28)} -> alias of "${entry.same}"`);
      continue;
    }
    if (!entry.file) {
      console.log(`${key.padEnd(28)} -> NULL (no archive candidate)`);
      continue;
    }
    const src = resolve(ARCHIVE, entry.file);
    const exists = existsSync(src);
    let dims = 'unknown';
    if (exists) {
      try {
        const meta = await sharp(src).metadata();
        dims = `${meta.width}x${meta.height}`;
      } catch {
        dims = 'unreadable';
      }
    }
    const format = entry.format === 'png' ? 'png' : 'jpg';
    console.log(
      `${key.padEnd(28)} file=${entry.file} exists=${exists} dims=${dims} ` +
        `target=${entry.maxWidth}w format=${format}` +
        (entry.crop ? ` crop=${JSON.stringify(entry.crop)}` : '') +
        (entry.consent !== undefined ? ` consent=${entry.consent}` : ''),
    );
  }

  if (!APPLY) {
    done(0);
    console.log('\nRe-run with --apply to resize and upload.');
    return;
  }

  // --- Wet run: resize + upload every non-null key via the shared helper. -----------
  // "cached" vs "uploaded" is read from the asset-map BEFORE calling image(), which is
  // the same cache makeUploader consults, so this reports what actually happened
  // rather than guessing from the resize cache (which is a separate, earlier step).
  const { image } = makePageImages(client);
  let uploaded = 0;
  for (const key of keys) {
    const rel = relPathFor(manifest, key);
    const assetMap = existsSync(ASSET_MAP_PATH)
      ? JSON.parse(readFileSync(ASSET_MAP_PATH, 'utf8'))
      : {};
    const before = rel ? Boolean(assetMap[rel]) : false;

    const result = await image(key);
    if (!result) {
      console.log(`${key.padEnd(28)} -> skipped (null)`);
      continue;
    }
    const label = before ? 'cached' : 'uploaded';
    console.log(`${key.padEnd(28)} -> ${label} asset=${result.asset._ref}`);
    uploaded++;
  }

  done(uploaded);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
