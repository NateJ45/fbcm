// scaffold-file: journal
import { test, expect } from './fixtures';

// =============================================================================
// A post prints as a bulletin (feat/print-motion, 2026-09-24)
// =============================================================================
// The print sheet lives in src/pages/post/[slug].astro. Under print media the
// site's chrome is gone, the masthead and body stay, the derived foot line
// appears, and only an external link prints its address.
//
// The post is a sermon preview with a reading, a slide cover (the plate, which
// stays on screen), a Listen link out to the livestream and a foot band.
// NOT PORTABLE: the post and its classes are this site's.
// =============================================================================

const POST = '/post/a-light-wardrobe/';

test('on paper a post keeps its masthead and body and drops the chrome', async ({ page }) => {
  await page.goto(POST, { waitUntil: 'load' });
  // On screen, the printed foot is not there to be read twice.
  await expect(page.locator('.p2-print-foot')).toBeHidden();

  await page.emulateMedia({ media: 'print' });

  for (const sel of [
    '.site-header',
    'footer',
    '.reading-progress',
    '.p2-foot',
    '.p2-side',
    '.p2-tags',
    'main > astro-island',
  ]) {
    const all = page.locator(sel);
    const n = await all.count();
    for (let i = 0; i < n; i++) await expect(all.nth(i), `${sel} #${i} prints`).toBeHidden();
  }

  await expect(page.locator('h1.p2-title')).toBeVisible();
  await expect(page.locator('.p2-facts')).toBeVisible();
  await expect(page.locator('.post-prose')).toBeVisible();

  const foot = page.locator('.p2-print-foot');
  await expect(foot).toBeVisible();
  await expect(foot).toContainText('First Baptist Church Muncie');
  await expect(foot).toContainText('/post/a-light-wardrobe');

  // An external link prints its address after it; one of the site's own does not.
  const after = (sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((a) => getComputedStyle(a, '::after').content);
  expect(await after('.p2 a[href^="http"]')).toContain('http');
  expect(['none', 'normal', '""']).toContain(await after('.p2 a[href^="/"]'));

  // Black ink: the title prints black, not the brand indigo.
  const ink = await page.locator('h1.p2-title').evaluate((h) => getComputedStyle(h).color);
  expect(ink).toBe('rgb(0, 0, 0)');
});
