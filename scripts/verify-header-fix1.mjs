// scripts/verify-header-fix1.mjs
// Task 3 fix round 1, the two assertions the review asked for.
//   1. data-scrolled is seeded on wire, not only on a scroll event: open /,
//      scroll to 600, navigate to /beliefs/, go BACK (which restores the
//      scroll position and fires no scroll event of its own), and the header
//      must carry data-scrolled within 500ms of astro:page-load.
//   2. the Give button's rendered height at 1440 must be >= 44.
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// SHOOT_ROOT lets this run against a hand-patched copy of the build, which is
// how the seed call below was proved load-bearing rather than assumed to be.
const root = path.resolve(process.env.SHOOT_ROOT || 'dist/client');
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
};
const srv = http
  .createServer((q, r) => {
    const p = decodeURIComponent(q.url.split('?')[0]);
    let f = path.join(root, p);
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) {
      r.writeHead(404).end('not found');
      return;
    }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  })
  .listen(4398);

const B = 'http://127.0.0.1:4398';
let failures = 0;
const check = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail === undefined ? '' : `  -> ${detail}`}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// ---- 1. seeded data-scrolled after a back navigation ----------------------
await page.goto(`${B}/`, { waitUntil: 'load' });
await page.waitForTimeout(600);
check(
  (await page.evaluate(() =>
    document.querySelector('.site-header').hasAttribute('data-scrolled'),
  )) === false,
  'at the top of /, data-scrolled is absent',
);

await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(500);
check(
  await page.evaluate(() => document.querySelector('.site-header').hasAttribute('data-scrolled')),
  'after scrolling to 600, data-scrolled is set',
);

// A real in-page link click, so the View Transitions router handles it.
await page.click('header a[href="/beliefs"]');
await page.waitForTimeout(900);
await page.goBack();

// Sample the attribute for 500ms after astro:page-load fires, and report the
// earliest moment it was true. The point of the fix is that this does not wait
// on a scroll event, of which a restored position produces none.
const seeded = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const start = performance.now();
      const h = () => document.querySelector('.site-header');
      const tick = () => {
        const el = h();
        if (el && el.hasAttribute('data-scrolled')) {
          resolve({ ok: true, ms: Math.round(performance.now() - start), y: window.scrollY });
          return;
        }
        if (performance.now() - start > 500) {
          resolve({ ok: false, ms: 500, y: window.scrollY });
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    }),
);
check(
  seeded.ok && seeded.ms <= 500,
  'after back navigation, data-scrolled is set within 500ms',
  JSON.stringify(seeded),
);

// ---- 1b. a RELOAD at a restored scroll position ---------------------------
// The harder half of the same bug, and the one that actually discriminates.
// A back navigation through the View Transitions router still produces a
// scroll event the (already wired) listener can see. A full reload restores
// the scroll position while the document is still parsing, which is BEFORE
// the polish script attaches its listener, so no scroll event ever reaches it
// and an overlay header would stay transparent over opaque content.
await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(400);
await page.reload({ waitUntil: 'load' });
const reloaded = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const start = performance.now();
      const tick = () => {
        const el = document.querySelector('.site-header');
        if (el && el.hasAttribute('data-scrolled')) {
          resolve({ ok: true, ms: Math.round(performance.now() - start), y: window.scrollY });
          return;
        }
        if (performance.now() - start > 500) {
          resolve({ ok: false, ms: 500, y: window.scrollY });
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    }),
);
check(
  reloaded.ok,
  'after a reload at a restored position, data-scrolled is set within 500ms',
  JSON.stringify(reloaded),
);

// ---- 2. Give button height ------------------------------------------------
await page.goto(`${B}/`, { waitUntil: 'load' });
await page.waitForTimeout(400);
const give = await page.evaluate(() => {
  const el = document.querySelector('header .header-give');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { height: r.height, width: r.width, text: el.textContent.trim() };
});
check(give && give.height >= 44, 'Give button rendered height >= 44', JSON.stringify(give));

await browser.close();
srv.close();
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
