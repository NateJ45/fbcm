// Builds scripts/data/binary-manifest.json: the committed record of every binary
// captured from the Wix site. Text capture goes in git; the binaries may not, so
// this file is how the repo remembers what exists, where it came from, and how to
// prove a copy is intact.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA = path.join(import.meta.dirname, 'data');

const sha256 = (file) => new Promise((res, rej) => {
  const h = createHash('sha256');
  createReadStream(file).on('data', (d) => h.update(d)).on('end', () => res(h.digest('hex'))).on('error', rej);
});

// Source URLs come from whichever manifest recorded them, keyed by local filename.
const sources = new Map();
const noteSource = (localFile, url, label, foundOn) => {
  if (!localFile) return;
  const key = path.basename(localFile);
  if (!sources.has(key)) sources.set(key, { url: url ?? null, label: label ?? null, foundOn: foundOn ?? null });
};

const readJson = async (p) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; } };
const rows = (m) => (Array.isArray(m) ? m : m ? (m.files ?? m.images ?? Object.values(m)) : []);

for (const name of ['images-manifest.json', 'files-manifest.json']) {
  for (const r of rows(await readJson(path.join(DATA, name)))) {
    noteSource(r.localFile, r.fullResUrl ?? r.originalUrl ?? r.href ?? r.url, r.text ?? r.alt, r.foundOn);
  }
}
// The post video was fetched by hand (it lives on video.wixstatic.com, not in the
// image manifests), so its provenance is recorded here rather than being lost.
noteSource(
  '81f7ac_59e19330783a4981a8a70296dd41afe3_1080p.mp4',
  'https://video.wixstatic.com/video/81f7ac_59e19330783a4981a8a70296dd41afe3/1080p/mp4/file.mp4',
  'In-post video, 1080p',
  'https://www.fbcmuncie.org/post/kingdom-family-vacation-anti-family-values-jesus-resources',
);

for (const dir of ['posts']) {
  const d = path.join(DATA, dir);
  for (const f of (await readdir(d)).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
    const j = await readJson(path.join(d, f));
    for (const img of [...(j?.images ?? []), ...(j?.coverImage ? [j.coverImage] : [])]) {
      noteSource(img.localFile, img.fullResUrl ?? img.originalUrl, img.alt, j.url);
    }
  }
}

const out = [];
for (const dir of ['images', 'files', 'video']) {
  let names;
  try { names = await readdir(path.join(DATA, dir)); } catch { continue; }
  for (const name of names.sort()) {
    const full = path.join(DATA, dir, name);
    const s = await stat(full);
    if (!s.isFile()) continue;
    const src = sources.get(name) ?? {};
    out.push({
      path: `${dir}/${name}`,
      bytes: s.size,
      sha256: await sha256(full),
      sourceUrl: src.url ?? null,
      label: src.label ?? null,
      foundOn: src.foundOn ?? null,
    });
  }
}

const byDir = out.reduce((a, r) => {
  const d = r.path.split('/')[0];
  a[d] ??= { files: 0, bytes: 0 };
  a[d].files++; a[d].bytes += r.bytes;
  return a;
}, {});

await writeFile(path.join(DATA, 'binary-manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'https://www.fbcmuncie.org/ (Wix), captured before the Astro/Sanity rebuild',
  totals: { files: out.length, bytes: out.reduce((n, r) => n + r.bytes, 0) },
  byDirectory: byDir,
  withoutSourceUrl: out.filter((r) => !r.sourceUrl).length,
  files: out,
}, null, 2) + '\n', 'utf8');

console.log('files:', out.length);
console.log('bytes:', out.reduce((n, r) => n + r.bytes, 0));
for (const [d, v] of Object.entries(byDir)) console.log(`  ${d}: ${v.files} files, ${(v.bytes / 1e6).toFixed(1)} MB`);
console.log('missing a source URL:', out.filter((r) => !r.sourceUrl).length);
