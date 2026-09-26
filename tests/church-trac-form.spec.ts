// scaffold-file: church
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// The Church Trac form band (2026-09-25)
// =============================================================================
// /styleguide draws the band from a fixture form whose "embed code" points at
// the church's public Church Trac calendar, a real churchtrac.com page. What a
// paste may become is unit tested (src/lib/church-trac-form.test.ts); this
// proves the page: the frame, its name and size, the way out, axe and 320 px.
// =============================================================================

const BAND = '#styleguide-church-trac-form [data-church-trac-form]';

test('the frame shows the Church Trac address, named, at its size', async ({ page }) => {
  await page.goto('/styleguide');
  const band = page.locator(BAND);
  await expect(band.getByRole('heading', { level: 2 })).toHaveText('Connection Card');
  const frame = band.locator('iframe');
  await expect(frame).toHaveAttribute(
    'src',
    'https://www.churchtrac.com/public_calendar?ui=0C7B1090&view=listMonth',
  );
  await expect(frame).toHaveAttribute('title', 'Connection card (sample)');
  await expect(frame).toHaveAttribute('loading', 'lazy');
  const height = await frame.evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBe(820);
  // The way out goes to the same address, in a new tab.
  const out = band.getByRole('link', { name: /Open the form in a new tab/ });
  await expect(out).toHaveAttribute(
    'href',
    'https://www.churchtrac.com/public_calendar?ui=0C7B1090&view=listMonth',
  );
  await expect(out).toHaveAttribute('target', '_blank');
});

test('a phone gets a taller frame, and nothing scrolls sideways at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/styleguide');
  const frame = page.locator(`${BAND} iframe`);
  await frame.scrollIntoViewIfNeeded();
  expect(await frame.evaluate((el) => el.getBoundingClientRect().height)).toBe(1025);
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(over).toBeLessThanOrEqual(0);
});

test('passes axe', async ({ page }) => {
  await page.goto('/styleguide');
  const results = await new AxeBuilder({ page }).include(BAND).analyze();
  expect(results.violations).toEqual([]);
});
