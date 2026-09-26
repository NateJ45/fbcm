import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// The ministry newsletters from Church Trac (2026-09-25)
// =============================================================================
// The suite's build sets CHURCH_TRAC_PAGES_FIXTURE=1 (playwright.config.ts), so
// /kids-corner and /youth-news are drawn from tests/fixtures/churchtrac-
// {children,youth}.html, the church's real Church Trac pages of that day. The
// reading itself is unit tested (src/lib/church-trac-page.test.ts). Church
// Trac's images are not fetched here: the pictures are checked by attribute.
// =============================================================================

test("The Kid's Corner: name, masthead, sections and buttons", async ({ page }) => {
  await page.goto('/kids-corner');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("The Kid's Corner");
  const masthead = page.locator('.nl-open img');
  await expect(masthead).toHaveAttribute('alt', "The Kid's Corner, children’s newsletter");
  await expect(page.locator('.nl-h2')).toHaveText([
    'Nursery through 5th Grade',
    'Summer Day Camps!',
    'Sundays @ FBCM',
    'Book Recommendation: "All the Things I Say to God"',
    'Enjoy this beautiful Summer with family and friends!',
  ]);
  // The section title cards are decorative and lazy.
  for (const img of await page.locator('.nl-card img').all()) {
    await expect(img).toHaveAttribute('alt', '');
    await expect(img).toHaveAttribute('loading', 'lazy');
  }
  await expect(page.getByRole('link', { name: 'Register for Water Wars!' })).toHaveAttribute(
    'href',
    'https://fbcmuncie.churchtrac.com/connect?ei=1C9SPAM',
  );
  await expect(page.locator('.nl-cols .nl-col')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Open it on Church Trac' })).toHaveAttribute(
    'href',
    'https://fbcmuncie.churchtrac.com/children',
  );
});

test("The Moose's Message: the banner's heading, never Church Trac's template text", async ({
  page,
}) => {
  await page.goto('/youth-news');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("The Moose's Message");
  await expect(page.locator('.nl-banner-line')).toHaveText('Jesus is the Answer');
  await expect(page.locator('main')).not.toContainText('Add a Headline and Paragraph');
  await expect(page.locator('main')).not.toContainText('Use a Template');
  // No em-dash in anything the page says (CLAUDE.md rule 2).
  expect(await page.locator('main').innerText()).not.toContain(String.fromCharCode(0x2014));
});

for (const path of ['/kids-corner', '/youth-news']) {
  test(`${path} passes axe`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test(`${path}: no sideways scroll at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(path);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(over).toBeLessThanOrEqual(0);
  });
}
