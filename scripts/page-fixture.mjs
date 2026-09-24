// scripts/page-fixture.mjs
//
// Build ONE page module from scripts/pages/ READ-ONLY and write what the page
// would render to scripts/data/fixtures/<slug>.json, so a composition can be
// looked at before it is ever seeded. /styleguide/<slug> renders that file
// through SectionRenderer (src/pages/styleguide/who-we-are.astro is the first).
//
// Why this exists (2026-09-23, Who We Are "alive", Task 6). The new church
// sections are not deployed yet, so the page cannot be applied to Sanity
// (CLAUDE.md rule 1: a Studio older than its data offers "Remove field").
// This is how the composed page is seen without writing anything.
//
// READ-ONLY BY CONSTRUCTION. The client carries the READ token, never the
// write token, so a photo that is not already in the media library fails to
// upload rather than uploading, and any manifest key that is not a `library`
// entry is refused before it is resolved. A module's own --apply-only steps
// (who-we-are.mjs uploads its booklet PDF) never run: there is no --apply here.
//
// What it writes is the module's own output, as `seed-pages` builds it, then
// projected the way src/lib/queries.ts projects a page for SectionRenderer:
// every image's asset dereferenced (with `alt` falling back to the asset's
// altText), and every internal button's reference turned into { _type, slug }.
//
// Usage:  node scripts/page-fixture.mjs who-we-are
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@sanity/client';
import { loadEnv } from './lib/loadEnv.mjs';
import * as copy from './lib/page-copy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// A page module reads --apply out of process.argv itself (that is how it
// knows to run its --apply-only steps, like who-we-are.mjs uploading its
// booklet PDF). This script is READ-ONLY by construction (see the header
// comment above): it never passes a write token, so an --apply-only step
// would fail loudly rather than write, but "fail loudly" still means a
// module can attempt a Sanity mutation from a script whose whole point is
// that it does not. Refuse before that can happen.
if (process.argv.includes('--apply')) {
  throw new Error(
    'page-fixture: refusing to run with --apply. This script is read-only by ' +
      'construction; --apply belongs to the page module itself (e.g. ' +
      '`node scripts/pages/<slug>.mjs --apply`), never to page-fixture.mjs.',
  );
}

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/page-fixture.mjs <page slug>');
  process.exit(1);
}

const env = loadEnv(root);
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const token = env.SANITY_API_READ_TOKEN;
if (!projectId) {
  console.error('page-fixture: needs PUBLIC_SANITY_PROJECT_ID in .env');
  process.exit(1);
}
// With no read token (it is commented out of .env since 2026-09-23 so builds
// read through the CDN and spare the API quota), the fixture reads the public
// dataset through the CDN too: everything it asks for is published.
const client = createClient({
  projectId,
  dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
  ...(token ? { token } : {}),
  apiVersion: '2026-05-01',
  useCdn: !token,
});

const mod = (await import(pathToFileURL(resolve(root, 'scripts', 'pages', `${slug}.mjs`)).href))
  .default;
const { makePageImages, alreadyUploaded } = await import('./lib/page-images.mjs');

// Only photos already in the dataset: media-library entries, or `file` entries
// this checkout has already uploaded (scripts/.asset-map.json holds them, as the
// home hero's frames). Anything else would resize and UPLOAD (page-images.mjs),
// so this refuses before the module can ask for one.
const pageImages = makePageImages(client);
const images = {
  ...pageImages,
  async image(key) {
    if (!alreadyUploaded(pageImages.manifest, key)) {
      throw new Error(
        `page-fixture: "${key}" is neither a library entry in scripts/data/page-images.json ` +
          'nor an upload this checkout has made; a fixture uploads nothing.',
      );
    }
    return pageImages.image(key);
  },
};

copy.resetCtaKeys();
const built = await mod.build({
  images,
  copy,
  settings: await client.fetch('*[_type == "siteSettings"][0]'),
  staff: await client.fetch('*[_type == "staffMember"]|order(order asc, name asc)'),
  ministries: await client.fetch('*[_type == "ministry"]'),
  keys: copy.keyer,
});

// -- Project, as queries.ts does ------------------------------------------------
const imageRefs = new Set();
const docRefs = new Set();
(function collect(v) {
  if (Array.isArray(v)) return v.forEach(collect);
  if (!v || typeof v !== 'object') return;
  if (typeof v.asset?._ref === 'string') imageRefs.add(v.asset._ref);
  if (typeof v.internalLink?._ref === 'string') docRefs.add(v.internalLink._ref);
  Object.values(v).forEach(collect);
})(built.pageBuilder);

const assets = new Map(
  (
    await client.fetch(
      '*[_id in $ids]{_id, _type, url, altText, "metadata": metadata{dimensions, lqip}}',
      { ids: [...imageRefs] },
    )
  ).map((a) => [a._id, a]),
);
const docs = new Map(
  (
    await client.fetch('*[_id in $ids]{_id, _type, "slug": slug.current}', { ids: [...docRefs] })
  ).map((d) => [d._id, d]),
);

function project(v) {
  if (Array.isArray(v)) return v.map(project);
  if (!v || typeof v !== 'object') return v;
  const out = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, project(x)]));
  if (typeof v.asset?._ref === 'string') {
    const asset = assets.get(v.asset._ref);
    if (!asset) throw new Error(`page-fixture: ${v.asset._ref} is not in the dataset`);
    out.asset = asset;
    out.alt = v.alt ?? asset.altText ?? '';
  }
  if (typeof v.internalLink?._ref === 'string') {
    const doc = docs.get(v.internalLink._ref);
    out.internalLink = doc ? { _type: doc._type, slug: doc.slug } : null;
  }
  return out;
}

const fixture = {
  _generatedBy: `scripts/page-fixture.mjs ${slug}`,
  title: built.title,
  pageBuilder: project(built.pageBuilder),
};
const dir = resolve(root, 'scripts', 'data', 'fixtures');
mkdirSync(dir, { recursive: true });
const out = resolve(dir, `${slug}.json`);
writeFileSync(out, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log(
  `page-fixture: ${fixture.pageBuilder.length} sections, ${imageRefs.size} photos -> ${out}`,
);
