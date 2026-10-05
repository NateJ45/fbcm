// scaffold-file: journal
import { test, expect, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { searchWordFromBlog } from './content-helpers';

// =============================================================================
// The site search (2026-09-24, feat/scripture-search)
// =============================================================================
// The dialog is built on demand (src/components/search/search-dialog.ts), so
// the axe sweep over every route never sees it. This file opens it from the
// header at 1440 and from the mobile menu at 390, runs a query against the
// real Pagefind index the build wrote, and audits the open state.
//
// It also holds the promise the search was built on: nothing of it loads until
// it is opened (no dialog module, no Pagefind, no stylesheet on a plain load).
//
// CONTENT INDEPENDENCE (2026-10-05). The query used to be "Jeremiah", which
// holds only while the church keeps a post that says it. It is now a word taken
// from the newest post's title on /blog (searchWordFromBlog), which the index
// certainly holds, and the first result need only be a built page of the site.
// That the word "Jeremiah" still finds a post is watched in
// tests/content-watch.spec.ts (@content).
// =============================================================================

async function typeQuery(page: Page, q: string) {
  const box = page.getByRole('searchbox', { name: 'Search sermons, posts and pages' });
  await expect(box).toBeFocused();
  await box.fill(q);
  await expect(page.locator('#ss-status')).toContainText(`for “${q}”`);
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

  test('nothing of the search loads until it is opened', async ({ page }) => {
    const fetched: string[] = [];
    page.on('request', (r) => fetched.push(r.url()));
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    expect(fetched.filter((u) => /search-dialog|\/pagefind\//.test(u))).toEqual([]);
    await expect(page.locator('#site-search')).toHaveCount(0);
    await expect(page.locator('#ss-style')).toHaveCount(0);
  });

  test('opens from the header, finds a word from the newest post, and Escape closes it', async ({
    page,
  }) => {
    const word = await searchWordFromBlog(page);
    const trigger = page.getByRole('button', { name: 'Search the site' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search the site' });
    await expect(dialog).toBeVisible();
    await typeQuery(page, word);
    const rows = dialog.locator('.ss-row');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(dialog.locator('.ss-row mark').first()).toBeVisible();
    // The first result's link is a page of this site.
    const href = await rows.first().locator('a').getAttribute('href');
    expect(href).toMatch(/^\//);

    // Arrow keys move from the box into the results and back.
    await page.keyboard.press('ArrowDown');
    await expect(rows.first().locator('a')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('searchbox')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('a result opens its post', async ({ page }) => {
    const word = await searchWordFromBlog(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Search the site' }).click();
    await typeQuery(page, word);
    const first = page.locator('.ss-row a').first();
    const href = (await first.getAttribute('href')) ?? '';
    await first.click();
    // A slug with an accent is percent-encoded in the address bar and raw in the href.
    await expect(page).toHaveURL((u) => decodeURI(u.pathname).endsWith(decodeURI(href)));
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('the open search has no axe violations', async ({ page }) => {
    const word = await searchWordFromBlog(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Search the site' }).click();
    await typeQuery(page, word);
    await expect(page.locator('.ss-row').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).include('#site-search').analyze();
    const report = results.violations
      .map((v) => `[${v.impact}] ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
      .join('\n');
    expect(results.violations, report).toEqual([]);
  });

  // Pagefind matches a lone letter in the index against the start of a query,
  // so the nonsense word must not begin with one that stands alone anywhere.
  // "zebrafinch" served until The Visitor's text brought "Gen Z" (June 2025).
  test('a query with no match says so', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('/');
    await expect(page.getByRole('dialog', { name: 'Search the site' })).toBeVisible();
    await page.getByRole('searchbox').fill('fqxzvw');
    await expect(page.locator('#ss-status')).toHaveText('Nothing found for “fqxzvw”.');
    await expect(page.locator('.ss-row')).toHaveCount(0);
  });
});

// Going Back with the search open swapped the dialog away before its `close`
// fired, and the scroll lock outlived the page: while it was Lenis, the wheel
// did nothing until a reload. Lenis is gone (2026-09-24) and the lock is only
// html.ss-open, which the before-swap release takes off; this still runs with
// reduced motion off, where the page's own smooth scrolling is on.
test.describe('with smooth scroll', () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });

  test('navigating away with the search open leaves the wheel working', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    // Blog is in the header's News dropdown since 2026-09-26.
    await page.locator('header summary', { hasText: 'News' }).hover();
    await page.click('header a[href="/blog/"], header a[href="/blog"]');
    await expect(page).toHaveURL(/\/blog\/?$/);
    await page.getByRole('button', { name: 'Search the site' }).click();
    await expect(page.getByRole('dialog', { name: 'Search the site' })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).not.toHaveClass(/ss-open/);
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).overflowY),
    ).not.toBe('hidden');
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 800);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

  test('opens from the mobile menu and works at 320px', async ({ page }) => {
    const word = await searchWordFromBlog(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-menu-ready]').waitFor({ state: 'attached' });
    await page.getByRole('button', { name: /^menu$/i }).click();
    await page.getByRole('button', { name: 'Search the site' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search the site' });
    await expect(dialog).toBeVisible();
    await typeQuery(page, word);
    await expect(dialog.locator('.ss-row').first()).toBeVisible();
    // No sideways scroll inside the sheet at 320.
    const overflow = await dialog.evaluate((d) => d.scrollWidth - d.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).include('#site-search').analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
