// Resize a Wix archive photograph once, upload it once, and hand back a Sanity image
// object for a block. Idempotent: the resized file is cached under scripts/.page-images/
// (gitignored) and the upload is cached by makeUploader in scripts/.asset-map.json,
// both keyed by the archive-relative path, so a re-run uploads nothing.
//
// Manifest entries in scripts/data/page-images.json come in two shapes:
//   { "file": "<archive filename>", "alt": "...", "maxWidth": N, "crop"?, "consent"?, "format"? }
//   { "same": "<other key>", "alt": "..." }  -- an alias: resolves to the target key's
//     resized file and asset, so a photo reused on several pages is uploaded exactly
//     once, under the target key's cache filename. The alias's own "alt" wins for the
//     block it produces, so a shared photo can carry different alt text per page.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { makeUploader } from './sanity-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive', 'images');
const CACHE = resolve(ROOT, 'scripts', '.page-images');
const MANIFEST = resolve(ROOT, 'scripts', 'data', 'page-images.json');

export function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

/** Follow "same" aliases to the real manifest entry, returning { key, entry }.
 *  Throws on a missing target or a cycle (defensive; the manifest is hand-written).
 *  Exported so the upload-page-images.mjs driver can report the resolved target
 *  (and its cache filename) without duplicating the alias-following logic. */
export function resolveEntry(manifest, key, seen = new Set()) {
  const entry = manifest[key];
  if (!entry) throw new Error(`page-images: no manifest entry "${key}"`);
  if (!entry.same) return { key, entry };
  if (seen.has(key)) throw new Error(`page-images: alias cycle at "${key}"`);
  seen.add(key);
  return resolveEntry(manifest, entry.same, seen);
}

export function makePageImages(uploadClient) {
  const uploader = makeUploader(uploadClient);
  const manifest = loadManifest();
  mkdirSync(CACHE, { recursive: true });

  /** Resize (or reuse the cached resize of) the TARGET entry for a key, following aliases.
   *  Returns { out, targetKey, entry, format } or null when the target has no file. */
  async function resized(key) {
    const { key: targetKey, entry } = resolveEntry(manifest, key);
    if (!entry.file) return null;
    const src = resolve(ARCHIVE, entry.file);
    if (!existsSync(src)) throw new Error(`page-images: missing archive file ${src}`);
    const format = entry.format === 'png' ? 'png' : 'jpg';
    // Cached under the TARGET key's name, not the alias's, so two manifest keys that
    // point at the same photo share one resize and one upload.
    const out = resolve(CACHE, `${targetKey}.${format}`);
    if (!existsSync(out)) {
      let img = sharp(src).rotate();
      const meta = await img.metadata();
      if (entry.crop) {
        const c = entry.crop;
        const left = Math.round((c.left ?? 0) * meta.width);
        const top = Math.round((c.top ?? 0) * meta.height);
        const width = Math.round(meta.width * (1 - (c.left ?? 0) - (c.right ?? 0)));
        const height = Math.round(meta.height * (1 - (c.top ?? 0) - (c.bottom ?? 0)));
        img = img.extract({ left, top, width, height });
      }
      img = img.resize({ width: entry.maxWidth, withoutEnlargement: true });
      // Logos keep PNG output (transparency, crisp edges); photographs go to
      // quality-82 mozjpeg. Never flatten a logo to JPEG.
      img = format === 'png' ? img.png() : img.jpeg({ quality: 82, mozjpeg: true });
      await img.toFile(out);
    }
    return { out, targetKey, entry, format };
  }

  /** Returns a block-ready image object, or null when the manifest has no file for this
   *  key (following aliases). The alt text is the CALLING key's own alt (so an alias can
   *  override it), falling back to the target entry's alt if the alias didn't set one. */
  async function image(key) {
    const r = await resized(key);
    if (!r) return null;
    const rel = `scripts/.page-images/${r.targetKey}.${r.format}`;
    const _ref = await uploader.upload(rel);
    const callingEntry = manifest[key];
    const alt = callingEntry?.alt ?? r.entry.alt;
    return { _type: 'image', asset: { _type: 'reference', _ref }, alt };
  }

  return { image, manifest };
}
