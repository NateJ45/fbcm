// Foundation, edit with care
// Validates every JSON-LD block in a built site, offline (2026-09-24, the
// craft-details pass). Build first (`npm run build`), then:
//
//     npm run check:jsonld              every public page in dist/client
//     npm run check:jsonld -- --sample  also print one block of each type
//
// Each page's blocks are parsed and run through validatePage() in
// src/lib/schema-vocab.ts: every @type and property checked against the
// schema.org vocabulary the site uses, the enumerations and ISO dates, Google's
// required fields for Event, BlogPosting and BreadcrumbList, and no two blocks
// of the same type or @id on one page. It also checks that every image URL on
// our own domain names a file that exists in the build, so a BlogPosting can
// never point at a share card that was not drawn. Exits 1 on any finding.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePage } from '../src/lib/schema-vocab.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist/client');
const SAMPLE = process.argv.includes('--sample');
const SITE = 'https://www.fbcmuncie.org';

if (!existsSync(dist)) {
  console.error('dist/client not found: run `npm run build` first.');
  process.exit(1);
}

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (['studio', 'preview', '_astro', 'og'].includes(name)) continue;
      yield* pages(p);
    } else if (name === 'index.html' || (name.endsWith('.html') && dir === dist)) yield p;
  }
}

const BLOCK = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const findings = [];
const samples = new Map();
const counts = new Map();
let pageCount = 0;
let blockCount = 0;

/** Every string under `image`, `logo` or `url` on our domain that should be a file. */
function images(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => images(n, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if ((k === 'image' || k === 'logo') && typeof v === 'string') out.push(v);
      else if ((k === 'image' || k === 'logo') && Array.isArray(v))
        out.push(...v.filter((x) => typeof x === 'string'));
      else images(v, out);
    }
  }
  return out;
}

for (const file of pages(dist)) {
  const html = readFileSync(file, 'utf8');
  const route = `/${relative(dist, file)
    .replace(/\\/g, '/')
    .replace(/index\.html$/, '')}`;
  const blocks = [];
  for (const m of html.matchAll(BLOCK)) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch (e) {
      findings.push(`${route}: a block is not valid JSON (${e.message})`);
    }
  }
  pageCount += 1;
  blockCount += blocks.length;
  for (const e of validatePage(blocks)) findings.push(`${route}: ${e}`);
  for (const b of blocks) {
    const type = [].concat(b['@type']).join('+');
    counts.set(type, (counts.get(type) ?? 0) + 1);
    if (!samples.has(type)) samples.set(type, { route, block: b });
    for (const url of images(b)) {
      if (!url.startsWith(SITE)) continue;
      const path = resolve(dist, `.${decodeURIComponent(new URL(url).pathname)}`);
      if (!existsSync(path)) findings.push(`${route}: ${type} image ${url} is not in the build`);
    }
  }
  // The og:image must exist too, when it is ours.
  const og = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
  if (
    og?.startsWith(SITE) &&
    !existsSync(resolve(dist, `.${decodeURIComponent(new URL(og).pathname)}`))
  ) {
    findings.push(`${route}: og:image ${og} is not in the build`);
  }
}

console.log(
  `${pageCount} pages, ${blockCount} JSON-LD blocks: ` +
    [...counts].map(([t, n]) => `${t} ${n}`).join(', '),
);
if (SAMPLE) {
  for (const [type, { route, block }] of samples) {
    console.log(`\n--- ${type} (from ${route}) ---\n${JSON.stringify(block, null, 2)}`);
  }
}
if (findings.length) {
  console.error(`\n${findings.length} finding(s):\n${findings.slice(0, 60).join('\n')}`);
  process.exit(1);
}
console.log('No findings.');
