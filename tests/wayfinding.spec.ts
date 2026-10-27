import { test, expect, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// Wayfinding (starter card 191), on this site's real routes
// =============================================================================
// The church's built-in wayfinding (src/data/wayfinding-defaults.ts) draws while Site settings'
// boxes are empty, so this runs against the ordinary build:
//   - the phone menu is four named groups (h2s), New here open on Home;
//   - the footer opens with "Where next" rows, except on a page that ends on its own closing
//     band (data-final-cta);
//   - Home's Sunday bar: phones only, after the h1 has scrolled away, its line read from Site
//     settings' service time, gone while the footer is on screen;
//   - nothing scrolls sideways at 320px with the bar showing.
// Reduced motion on: the menu rows rise from opacity 0 otherwise.
// =============================================================================

test.use({ reducedMotion: 'reduce' });

async function openMenu(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-menu-ready]').waitFor({ state: 'attached' });
  await page.getByRole('button', { name: /^menu$/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the phone menu is four named groups, New here open on Home, and passes axe', async ({
    page,
  }) => {
    await openMenu(page);
    const nav = page.getByRole('dialog').locator('nav[aria-label="Primary mobile"]');
    await expect(nav.getByRole('heading', { level: 2 })).toHaveText([
      /New here/,
      /Get involved/,
      /This week/,
      /Reach us/,
    ]);
    const newHere = nav.getByRole('button', { name: /New here/ });
    await expect(newHere).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('list', { name: /New here/ }).getByRole('link')).toHaveCount(5);
    await expect(nav.getByRole('link', { name: /^Visit$/ })).toBeVisible();
    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test("Home's Sunday bar shows once the heading has gone, and hides at the footer", async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'load' });
    const bar = page.locator('[data-action-bar]');
    await expect(bar).toBeHidden();
    await page
      .locator('main h1')
      .evaluate((h) => window.scrollTo(0, h.getBoundingClientRect().bottom + window.scrollY + 400));
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(/Sundays · Worship at/);
    const button = bar.getByRole('link');
    await expect(button).toHaveAttribute('href', '/visit/');
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    const barBox = (await bar.boundingBox())!;
    expect(Math.round(barBox.y + barBox.height)).toBe(844);
    expect(
      (await new AxeBuilder({ page }).include('[data-action-bar]').analyze()).violations.map(
        (v) => v.id,
      ),
    ).toEqual([]);
    await page.locator('#site-footer').scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
  });

  test('a page with no bar of its own carries none', async ({ page }) => {
    await page.goto('/beliefs/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-action-bar]')).toHaveCount(0);
  });

  test('nothing scrolls sideways at 320px with the bar showing', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator('[data-action-bar]')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the footer opens with three where-next rows, never the page you are on', async ({
    page,
  }) => {
    await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
    const rows = page.locator('#site-footer nav[aria-label="Where next"] a');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toBeVisible();
    for (const href of await rows.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
      expect(href).not.toBe('/contact/');
    }
  });

  test('a page that ends on its own closing band shows no where-next rows', async ({ page }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main [data-final-cta]')).toHaveCount(1);
    await expect(page.locator('#site-footer nav[aria-label="Where next"]')).toBeHidden();
  });

  test('the Sunday bar never shows on a wide screen', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect(page.locator('[data-action-bar]')).toBeHidden();
  });
});
