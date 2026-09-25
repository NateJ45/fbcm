// scaffold-file: journal
import { test, expect, type Page } from '@playwright/test';

// /blog as a plain register (2026-09-24, feat/blog-flat). Nathan took
// "Worth coming back for" off /blog page 1, so page 1 is the register alone:
// the newest posts first, each once, the same count as every later page. The
// register and the archives draw each cover as a plain picture (PostRow's
// frame="plain"); home's Church Blog band keeps its lancets.

async function rowPosts(page: Page) {
  return page.locator('ol.rows > li').evaluateAll((lis) =>
    lis.map((li) => ({
      href: li.querySelector('[data-vt-title] a')?.getAttribute('href') ?? '',
      datetime: li.querySelector('time')?.getAttribute('datetime') ?? '',
    })),
  );
}

test('/blog page 1 lists the posts newest first, each once, with no Worth band', async ({
  page,
}) => {
  await page.goto('/blog', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /worth coming back for/i })).toHaveCount(0);

  const posts = await rowPosts(page);
  // PER_PAGE in src/lib/blog-derive.ts: page 1 holds as many as every page.
  expect(posts.length).toBe(12);
  expect(posts.every((p) => p.href.startsWith('/post/') && p.datetime)).toBe(true);

  // Newest first (dates never rise down the page).
  const days = posts.map((p) => p.datetime);
  expect(days).toEqual([...days].sort().reverse());

  // No post twice, anywhere in the page's rows.
  const hrefs = await page
    .locator('[data-vt-title] a')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(hrefs.length);

  // Page 2 carries on where page 1 stops.
  await page.goto('/blog/page/2', { waitUntil: 'domcontentloaded' });
  const next = await rowPosts(page);
  expect(next.length).toBe(12);
  expect(next[0].datetime <= days[days.length - 1]).toBe(true);
  expect(next.some((p) => hrefs.includes(p.href))).toBe(false);
});

for (const route of ['/blog', '/blog/category/sermon-preview', '/blog/tag/advent']) {
  test(`${route} draws covers as plain pictures, not arches`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const rows = page.locator('ol.rows > li');
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(page.locator('ol.rows [data-arch]')).toHaveCount(0);
    // Each cover keeps lazy loading and a srcset with sizes.
    const img = rows.first().locator('figure img');
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('srcset', /\S/);
    await expect(img).toHaveAttribute('sizes', /\S/);
  });
}

test('home keeps the lancet on its blog rows', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const rows = page.locator('li:has([data-vt-title])');
  expect(await rows.count()).toBeGreaterThan(0);
  expect(await rows.locator('[data-arch="lancet"]').count()).toBe(await rows.count());
});
