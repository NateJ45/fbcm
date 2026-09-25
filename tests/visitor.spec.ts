// scaffold-file: church
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// The Visitor (2026-09-24, feat/the-visitor)
// =============================================================================
// The suite's build sets VISITOR_FIXTURE=1 (playwright.config.ts), so the
// build step reads the committed page fixture (scripts/data/fixtures/
// visitor.json) as the /visitor page: /styleguide/visitor renders it, Home's
// band points at it, and the search holds its issues' words. The fixture is
// the real composition, 39 issues, the newest September 2026.
// =============================================================================

const PAGE = '/styleguide/visitor';

test.describe('the page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('opens on the latest issue, and it is the newest on the page', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Visitor');
    const info = page.locator('.vi-info');
    await expect(info).toContainText('Latest issue');
    await expect(info.getByRole('heading', { level: 2 })).toHaveText('The Visitor, September 2026');

    // Every issue carries its anchor, issue-YYYY-MM; the lead's is the largest.
    const lead = await page.locator('.vi-lead-cover').getAttribute('id');
    const all = await page
      .locator('[id^="issue-"]')
      .evaluateAll((els) => els.map((e) => e.id).sort());
    expect(all.length).toBe(39);
    expect(lead).toBe(all[all.length - 1]);
    expect(lead).toBe('issue-2026-09');

    // The first past issue follows it, newest first.
    await expect(page.locator('.vi-past li').first()).toHaveAttribute('id', 'issue-2026-06');
  });

  test('the button opens the PDF in the browser, with its size beside it', async ({ page }) => {
    await page.goto(PAGE);
    const read = page.getByRole('link', { name: 'Read this issue' });
    await expect(read).toHaveAttribute('href', /^https:\/\/cdn\.sanity\.io\/files\/.+\.pdf$/);
    expect(await read.getAttribute('download')).toBeNull();
    expect(await read.getAttribute('target')).toBeNull();
    await expect(page.locator('.vi-info')).toContainText(/PDF, \d+ MB/);
  });

  test('every issue has a cover with alt text naming it', async ({ page }) => {
    await page.goto(PAGE);
    const covers = page.locator('.vi-lead [data-issue-cover], .vi-past [data-issue-cover]');
    await expect(covers).toHaveCount(39);
    const names = await covers.evaluateAll((els) =>
      els.map((e) => (e.tagName === 'IMG' ? e.getAttribute('alt') : e.getAttribute('aria-label'))),
    );
    for (const n of names) expect(n).toMatch(/^The Visitor, [A-Z][a-z]+ \d{4}, cover$/);
    expect(names[0]).toBe('The Visitor, September 2026, cover');
    // Drawn covers are real images with their box reserved.
    const img = page.locator('.vi-lead img[data-issue-cover="drawn"]');
    if ((await img.count()) > 0) {
      await expect(img).toHaveAttribute('width', /\d+/);
      await expect(img).toHaveAttribute('srcset', /\/visitor\/covers\/[0-9a-f]+-240\.webp 240w/);
    }
  });

  test('the wall is reachable by keyboard, each cover named for its issue', async ({ page }) => {
    await page.goto(PAGE);
    const tile = page.getByRole('link', { name: /^The Visitor, June 2026, PDF/ });
    await tile.focus();
    await expect(tile).toBeFocused();
    await expect(tile).toContainText('June');
  });

  test('the two books follow, in their own list', async ({ page }) => {
    await page.goto(PAGE);
    const books = page.getByRole('heading', { level: 2, name: 'Two books' });
    await expect(books).toBeVisible();
    await expect(
      page.getByText('We Are the Clay: God Molding Lives', { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Open on amazon\.com We Are the Clay/ }),
    ).toBeVisible();
  });

  test('passes axe', async ({ page }) => {
    await page.goto(PAGE);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('at 320', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  for (const path of [PAGE, '/']) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
      });
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(over).toBeLessThanOrEqual(0);
      // Every cover sits inside the viewport.
      const widest = await page
        .locator('[data-issue-cover]')
        .evaluateAll((els) => Math.max(0, ...els.map((e) => e.getBoundingClientRect().right)));
      expect(widest).toBeLessThanOrEqual(320);
    });
  }
});

test.describe('home', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the band names the newest issue and leads to it', async ({ page }) => {
    await page.goto('/');
    const band = page.locator('[data-visitor-band]');
    await expect(band).toHaveAttribute('data-visitor-band', 'issue-2026-09');
    await expect(band).toContainText('The Visitor');
    await expect(band).toContainText('September 2026 issue');
    await expect(band.getByRole('link')).toHaveAttribute('href', PAGE);
    // Straight after Last Sunday, before the blog rows.
    const order = await page
      .locator('main section')
      .evaluateAll((els) =>
        els.map((e) => (e.matches('.ls-band') ? 'ls' : e.matches('.vb-band') ? 'vb' : '')),
      );
    const ls = order.indexOf('ls');
    if (ls >= 0) expect(order.indexOf('vb')).toBe(ls + 1);
  });
});

test.describe('search', () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

  test('finds a phrase from inside an issue', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Search the site' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search the site' });
    const box = page.getByRole('searchbox', { name: 'Search sermons, posts and pages' });
    await expect(box).toBeFocused();
    await box.fill('Messy Camp');
    await expect(page.locator('#ss-status')).toContainText('for “Messy Camp”');
    const row = dialog.locator('.ss-row').filter({ hasText: /The Visitor, [A-Z][a-z]+ \d{4}/ });
    await expect(row.first()).toBeVisible();
    await expect(row.first()).toContainText('Newsletter');
    await expect(row.first()).toContainText(/PDF, \d+ MB/);
    await expect(row.first().locator('mark').first()).toBeVisible();
    await expect(row.first().locator('a')).toHaveAttribute('href', /\.pdf$/);
  });
});
