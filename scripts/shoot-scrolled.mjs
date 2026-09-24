// scripts/shoot-scrolled.mjs
// One capture the full-page shooter cannot make: the home page at 1440 AFTER a
// 200px scroll, which is the state that proves overlay mode hands back to the
// ordinary paper bar. Also prints the measured .site-header height at 1440 and
// at 375, which is the number --header-offset is set from.
// Usage: node scripts/shoot-scrolled.mjs <outDir>
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || '.';
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
      r.writeHead(404).end('not found');
      return;
    }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  })
  .listen(4399);

const measure = () => {
  const h = document.querySelector('header.site-header');
  return {
    height: h.getBoundingClientRect().height,
    overlay: h.hasAttribute('data-overlay'),
    scrolled: h.hasAttribute('data-scrolled'),
    state: h.getAttribute('data-state'),
    headerH: getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim(),
    offset: getComputedStyle(document.documentElement).getPropertyValue('--header-offset').trim(),
  };
};

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [label, width, height, route] of [
  ['home', 1440, 900, '/'],
  ['home', 375, 812, '/'],
  ['beliefs', 1440, 900, '/beliefs/'],
]) {
  // Light only since 2026-09-24 (the site never renders dark).
  for (const scheme of ['light']) {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
    await page.goto(`http://127.0.0.1:4399${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const top = await page.evaluate(measure);
    // The header band alone, at rest, so the overlay state can be read rather
    // than squinted at in a 5,700px full-page capture.
    await page.screenshot({
      path: path.join(out, `${label}-${width}-${scheme}-headerband-top.png`),
      clip: { x: 0, y: 0, width, height: 140 },
    });
    // Real wheel gesture, not scrollTo: the polish script's data-state gate
    // listens for one, and this capture should be the state a visitor sees.
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(700);
    const after = await page.evaluate(measure);
    console.log(
      `${label} ${width} ${scheme}  top=${JSON.stringify(top)}  after200=${JSON.stringify(after)}`,
    );
    if (label === 'home' && width === 1440) {
      // At 200px the gesture-gated hide-on-scroll-down (BaseLayout, unchanged
      // by this task) has translated the bar off the top, which is correct but
      // shows nothing. A short scroll back UP brings it straight back, still
      // carrying data-scrolled, which is the paper state this capture is for.
      await page.mouse.wheel(0, -60);
      await page.waitForTimeout(700);
      const back = await page.evaluate(measure);
      console.log(`${label} ${width} ${scheme}  afterScrollBackUp=${JSON.stringify(back)}`);
      await page.screenshot({ path: path.join(out, `home-desk-${scheme}-scrolled200.png`) });
    }
    await page.close();
  }
}
await browser.close();
srv.close();
