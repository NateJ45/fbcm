// scripts/shoot-pages.mjs
// Full-page screenshots of built routes at two viewports in both colour
// schemes, each page walked top to bottom first so [data-reveal] fires and
// lazy images load (the vault gotcha fullpage-screenshot-skips-scroll-reveal).
// Usage: node scripts/shoot-pages.mjs <outDir> [route ...]   (routes default to the eleven pages)
// On Git Bash / Windows, a bare "/" route argument gets mangled by MSYS path
// conversion. Invoke with MSYS_NO_PATHCONV=1 node scripts/shoot-pages.mjs ...
// or run this from PowerShell instead.
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
if (!out) {
  console.error('usage: node scripts/shoot-pages.mjs <outDir> [route ...]');
  process.exit(1);
}
const routes = process.argv.slice(3).length
  ? process.argv.slice(3)
  : [
      '/',
      '/visit/',
      '/who-we-are/',
      '/beliefs/',
      '/ministries/',
      '/staff/',
      '/history/',
      '/wedding/',
      '/give/',
      '/contact/',
      '/blog/',
    ];
const root = path.resolve('dist/client');
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
      // Only an HTML navigation (no extension, or an explicit .html path) falls
      // back to the built 404 page. Anything else missing (css/js/font/image/etc)
      // is a broken asset reference, and silently serving 404.html for it with a
      // 200 would produce a plausible-looking screenshot that hides the breakage.
      const ext = path.extname(p);
      if (ext === '' || ext === '.html') {
        f = path.join(root, '404.html');
      } else {
        console.error(`missing asset: ${p}`);
        r.writeHead(404);
        r.end();
        return;
      }
    }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  })
  .listen(4611);

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const route of routes) {
  const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  for (const [vp, w, h] of [
    ['desk', 1440, 900],
    ['mob', 390, 844],
  ]) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        colorScheme: scheme,
      });
      const page = await ctx.newPage();
      await page.goto(`http://localhost:4611${route}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += h * 0.7) {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        await page.waitForTimeout(140);
      }
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(out, `${slug}-${vp}-${scheme}.png`),
        fullPage: true,
      });
      console.log(slug, vp, scheme, total);
      await ctx.close();
    }
  }
}
await browser.close();
srv.close();
