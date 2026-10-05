// Site-specific (NOT a PORTABLE file): fbcm's Wix-migration URL gate on real content.
// These two tests lived in tests/smoke.spec.ts until the card 75/76 resync (2026-10-03),
// moved here unchanged so smoke.spec.ts can stay byte-identical to the starter.
import { test, expect } from './fixtures';
import { findPost } from './content-helpers';

// Task 6 (2026-09-18): the Wix migration's URL-preservation gate. /blog and
// /post/<slug> are the live site's exact paths — no redirects, no lost SEO.
//
// CONTENT INDEPENDENCE (2026-10-05). The acceptance case was one named post, the
// one with a non-ASCII slug (/post/händel-s-messiah-sing-in-carols), which proved
// the import kept slugs the way Wix wrote them. That post is the church's, so it
// now lives in tests/content-watch.spec.ts (@content). What stays required is
// the property, on any post: a post is served at its own /post/<slug> URL.

test('a post is served at its own /post/<slug> URL', async ({ page, request }) => {
  const post = await findPost(request);
  test.skip(!post, 'no sermon-preview post is published right now');
  const res = await page.goto(post!.path);
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
});

test('the blog listing is served at /blog', async ({ page }) => {
  const res = await page.goto('/blog');
  expect(res?.status()).toBe(200);
});
