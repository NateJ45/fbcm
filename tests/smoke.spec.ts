// PORTABLE: canonical copy - ncs-astro-sanity-starter is the library of record for this file
import { test, expect } from './fixtures';
import { routes, hiddenRoutes } from './routes';
import { site } from '../src/data/site';

// =============================================================================
// Smoke: every route builds and renders (not a 404 or an error page)
// =============================================================================
// The title check reads site.name rather than a literal, so `npm run
// apply-brand` cannot leave this suite asserting the previous project's name.
//
// `waitUntil: 'domcontentloaded'`, never 'load'. A page carrying a WebM-first
// <video> never fires `load` in WebKit, and the run hangs until the test times
// out with nothing useful in the report.
// =============================================================================

const titlePattern = new RegExp(site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

test.describe('Smoke: every content route renders', () => {
  for (const route of routes) {
    test(`${route} returns 200 and renders`, async ({ page }) => {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), `${route} HTTP status`).toBe(200);
      // A real rendered page (every title carries the site name), not a blank
      // or error body.
      await expect(page).toHaveTitle(titlePattern);
    });
  }
});

// Routes whose section is switched off in Sanity are baked as a meta-refresh
// stub pointing at "/" (see routes.ts). They must still answer 200, and the
// title is either the stub's own or, once the refresh has fired, the home
// page's. Either proves the file exists and is not an error page.
test.describe('Smoke: every hidden route still answers', () => {
  for (const route of hiddenRoutes) {
    test(`${route} returns 200 (redirect stub)`, async ({ page }) => {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), `${route} HTTP status`).toBe(200);
      await expect(page).toHaveTitle(new RegExp(`Redirecting to: /|${titlePattern.source}`));
    });
  }
});

// Task 6 (2026-09-18): the Wix migration's URL-preservation gate. /blog and
// /post/<slug> are the live site's exact paths — no redirects, no lost SEO.
// The non-ASCII slug is the acceptance case: it stays failing (404) until
// Task 9 imports the real posts, which is what proves the import worked.
test('a post with a non-ASCII slug is served at its original URL', async ({ page }) => {
  const res = await page.goto('/post/händel-s-messiah-sing-in-carols');
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Messiah');
});

test('the blog listing is served at /blog', async ({ page }) => {
  const res = await page.goto('/blog');
  expect(res?.status()).toBe(200);
});
