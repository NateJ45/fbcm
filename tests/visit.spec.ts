// scaffold-file: church
import { test, expect, type Locator, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// The visitor audit on /visit (2026-09-25, feat/visit-fixes)
// =============================================================================
// A family new to Muncie, on a phone, could not find the children's safety
// facts, the nervous questions, or a way to say "we're coming". The page that
// fixes it is composed by scripts/pages/visit.mjs, applied 2026-09-25; the
// /styleguide/visit copy the suite read until then is gone, so it reads /visit.
// Since the same day the connection card is ON the page (a Church Trac form
// band at #connect), and both "Let us know you're coming" buttons jump to it.
//
// Home's rows are checked on /styleguide's Church Blog band, whose fixed data
// holds one past FBCM Events post (Blue Christmas, 9 December 2025) measured
// from a fixed day (src/pages/styleguide.astro, JOURNAL_LIST_NOW).
// =============================================================================

const PAGE = '/visit';

/** The band whose h2 is `name`. */
const band = (page: Page, name: string): Locator =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { level: 2, name, exact: true }) });

/** True when no ancestor is a closed <details>, i.e. nothing has to be expanded. */
const openAll = (loc: Locator) =>
  loc.evaluateAll((els) => els.every((e) => !e.closest('details:not([open])')));

test.describe('the page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Your children is readable without expanding anything', async ({ page }) => {
    // Structure only: the church edits this copy, so no heading or sentence is pinned here.
    await page.goto(PAGE);
    const kids = band(page, 'Your children');
    await expect(kids).toHaveCount(1);
    const subheads = kids.getByRole('heading', { level: 3 });
    expect(await subheads.count()).toBeGreaterThan(0);
    await expect(subheads.first()).toBeVisible();
    expect(await openAll(kids.locator('h3, p'))).toBe(true);
    // /visit#children lands on it.
    await expect(page.locator('#children')).toHaveCount(1);
  });

  test('the "let us know you’re coming" buttons jump to the connection card on the page', async ({
    page,
  }) => {
    await page.goto(PAGE);
    // Found by where they point, not by the church's button wording.
    const buttons = page.locator('a[href="/visit#connect"]');
    expect(await buttons.count()).toBeGreaterThan(0);
    for (const b of await buttons.all()) {
      await expect(b).not.toHaveAttribute('target', '_blank');
    }
    // The band holds a Church Trac frame named for the form.
    const card = page.locator('#connect');
    await expect(card.locator('iframe')).toHaveAttribute(
      'src',
      /^https:\/\/fbcmuncie\.churchtrac\.com\/form\//,
    );
    await expect(card.locator('iframe')).toHaveAttribute('title', 'Connection card');
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

  test('the composed page does not scroll sideways', async ({ page }) => {
    await page.goto(PAGE);
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
    for (const name of ['Your children']) {
      const right = await band(page, name)
        .locator('h3, p')
        .evaluateAll((els) => Math.max(0, ...els.map((e) => e.getBoundingClientRect().right)));
      expect(right, name).toBeLessThanOrEqual(320);
    }
  });
});

test.describe('home rows', () => {
  test('never show an FBCM Events post whose event is over', async ({ page }) => {
    await page.goto('/styleguide');
    const rows = page
      .locator('#styleguide-journal')
      .locator('xpath=ancestor::section[1]')
      .locator('ol > li');
    const titles = (await rows.allTextContents()).join('\n');
    // Blue Christmas (9 December 2025) is past on the fixed day; the Messiah
    // Sing-In (11 December 2026) is still to come.
    expect(titles).not.toContain('Blue Christmas');
    expect(titles).toContain('Messiah Sing-In');
    // Fewer rows rather than a stale one: four posts in, three shown.
    await expect(rows).toHaveCount(3);
  });
});
