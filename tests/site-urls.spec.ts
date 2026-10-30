// Site-specific (NOT a PORTABLE file): fbcm's Wix-migration URL gate on real content.
// These two tests lived in tests/smoke.spec.ts until the card 75/76 resync (2026-10-03),
// moved here unchanged so smoke.spec.ts can stay byte-identical to the starter.
import { test, expect } from './fixtures';

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
