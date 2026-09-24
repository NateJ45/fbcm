// The site search's index (2026-09-24, feat/scripture-search). Runs after
// `astro build` as the second half of `npm run build`, so CI, the Playwright
// server and `npm run deploy` all ship an index that matches the pages.
//
//   node scripts/pagefind-index.mjs            index dist/client
//
// It uses Pagefind's Node API rather than its CLI, which is the same binary
// (the platform package npm installed, @pagefind/windows-x64 here and
// @pagefind/linux-x64 on CI) driven without a shell, so Windows and POSIX run
// it identically.
//
// WHAT GETS INDEXED is decided by the pages, not here: Pagefind reads only the
// element marked data-pagefind-body on each page and skips every page with
// none. The home page, the builder pages and /privacy mark their <main>
// (BaseLayout's `searchBody`), a post marks its <article>; the blog archives,
// the scripture index, the 404 and the Studio mark nothing. Chrome inside a
// body (a post's tags, its contents list) carries data-pagefind-ignore.
//
// TWO GUARDS, both derived rather than configured:
//   1. The search UI must exist. The dialog is src/components/search/, which
//      belongs to the `journal` scaffold capability; a fork that removed it has
//      nothing to search with, so this step says so and exits 0 rather than
//      writing an index no page can read.
//   2. At least one built page must carry data-pagefind-body. With none,
//      Pagefind would fall back to indexing every page whole (header, footer
//      and all), which is never what this site wants, so it stops with an
//      error instead.
//
// The output is dist/client/pagefind/: pagefind.js, the WASM, and the index
// fragments. The Worker serves it as static assets like everything else in
// dist/client. Pagefind's default UI files are written too (the API cannot
// skip them); nothing links to them.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'dist', 'client');
const ui = join(root, 'src', 'components', 'search', 'search-dialog.ts');

if (!existsSync(ui)) {
  console.log('pagefind: no search UI in src/components/search/, skipping the index.');
  process.exit(0);
}
if (!existsSync(site)) {
  console.error('pagefind: dist/client does not exist. Run astro build first.');
  process.exit(1);
}

// Count the pages that opted in, skipping the Studio and preview shells.
function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'studio' || name === 'preview' || name === 'pagefind' || name === '_astro')
        continue;
      yield* htmlFiles(p);
    } else if (name.endsWith('.html')) {
      yield p;
    }
  }
}
let marked = 0;
for (const f of htmlFiles(site)) {
  if (readFileSync(f, 'utf8').includes('data-pagefind-body')) marked += 1;
}
if (marked === 0) {
  console.error(
    'pagefind: no built page carries data-pagefind-body, so Pagefind would index every page whole. Stopping.',
  );
  process.exit(1);
}

const pagefind = await import('pagefind');
const started = Date.now();
const { index, errors } = await pagefind.createIndex({ forceLanguage: 'en' });
if (!index) {
  console.error('pagefind: could not create an index:', errors);
  process.exit(1);
}
const added = await index.addDirectory({ path: site });
if (added.errors.length) {
  console.error('pagefind: indexing failed:', added.errors);
  process.exit(1);
}
const out = join(site, 'pagefind');
const written = await index.writeFiles({ outputPath: out });
if (written.errors.length) {
  console.error('pagefind: writing the index failed:', written.errors);
  process.exit(1);
}
await pagefind.close();
console.log(
  `pagefind: indexed ${added.page_count} pages (${marked} marked) into ${relative(root, out)} in ${
    Date.now() - started
  } ms`,
);
