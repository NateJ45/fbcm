// Checks the binary archive against the manifest committed in this repo. The
// binaries are deliberately not in git (1.62 GB), so this is what makes the
// repo's claim about them checkable: every file present, right size, right hash.
// Exits non-zero on any finding, so it can be a gate.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';

// Read the positional from the non-flag arguments, so `--quick` is never mistaken
// for the archive path (it was, and the run then reported all 424 files missing).
const args = process.argv.slice(2);
const ARCHIVE = args.find((a) => !a.startsWith('--'))
  ?? path.resolve(import.meta.dirname, '..', '..', 'fbcm-archive');
const MANIFEST = path.join(import.meta.dirname, 'data', 'binary-manifest.json');
const quick = args.includes('--quick'); // sizes only, skip hashing

const sha256 = (file) => new Promise((res, rej) => {
  const h = createHash('sha256');
  createReadStream(file).on('data', (d) => h.update(d)).on('end', () => res(h.digest('hex'))).on('error', rej);
});

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
console.log(`archive:  ${ARCHIVE}`);
console.log(`manifest: ${manifest.files.length} files, ${(manifest.totals.bytes / 1e9).toFixed(2)} GB`);
console.log(quick ? 'mode:     quick (sizes only)' : 'mode:     full (sha256)');

const missing = [], wrongSize = [], wrongHash = [];
let checked = 0;

for (const entry of manifest.files) {
  const full = path.join(ARCHIVE, entry.path);
  let s;
  try { s = await stat(full); } catch { missing.push(entry.path); continue; }
  if (s.size !== entry.bytes) { wrongSize.push(`${entry.path} (${s.size} vs ${entry.bytes})`); continue; }
  if (!quick && (await sha256(full)) !== entry.sha256) { wrongHash.push(entry.path); continue; }
  checked++;
}

console.log(`\nverified: ${checked}/${manifest.files.length}`);
for (const [label, list] of [['MISSING', missing], ['WRONG SIZE', wrongSize], ['WRONG HASH', wrongHash]]) {
  if (!list.length) continue;
  console.log(`\n${label}: ${list.length}`);
  for (const f of list.slice(0, 20)) console.log('  ', f);
  if (list.length > 20) console.log(`   ... and ${list.length - 20} more`);
}

const bad = missing.length + wrongSize.length + wrongHash.length;
console.log(bad ? `\nFAIL: ${bad} file(s) do not match the manifest.` : '\nOK: archive matches the manifest.');
process.exit(bad ? 1 : 0);
