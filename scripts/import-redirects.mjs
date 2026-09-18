// scripts/import-redirects.mjs
// Writes one `redirect` document per entry from fbcmRedirects() (src/lib/fbcm-redirects.ts,
// 42 entries, unit tested in fbcm-redirects.test.ts). Dry by default; --apply is the
// only thing that writes. Deterministic ids + createOrReplace, so a re-run replaces
// rather than duplicates.
//
// These documents only take effect on the next build: astro.config.mjs reads the
// published `redirect` docs at BUILD time and folds them into Astro's `redirects`
// map, which the Cloudflare adapter emits as real 301s (src/lib/redirects.ts). A
// document existing in the dataset is not the same as a working redirect -- see
// Step 6, which proves one with an actual curl against `npm run preview`.
import { client, APPLY } from './lib/sanity-lib.mjs';
import { fbcmRedirects } from '../src/lib/fbcm-redirects.ts';

/** "/team/andy-heimlich" -> "redirect-team-andy-heimlich". Deterministic per `from`. */
function redirectDocId(from) {
  const slug = from
    .replace(/^\//, '')
    .replace(/\/+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `redirect-${slug || 'root'}`;
}

const redirects = fbcmRedirects();
let written = 0;

for (const r of redirects) {
  const doc = {
    _id: redirectDocId(r.from),
    _type: 'redirect',
    from: r.from,
    to: r.to,
    permanent: r.permanent,
    note: r.note,
  };
  if (APPLY) {
    await client.createOrReplace(doc);
    written++;
  } else {
    console.log(`would write ${doc._id}: ${doc.from} -> ${doc.to}`);
  }
}

console.log(`\nredirects: ${redirects.length}`);
console.log(APPLY ? `written: ${written}` : 'DRY RUN, nothing written. Pass --apply to write.');
