// scaffold-file: church
import { test, expect, type Page } from './fixtures';

// =============================================================================
// /visit: what the PAGE promises, whatever the church has written on it
// =============================================================================
// This file used to assert the secretary's own sentences: the exact h3 list of
// "Good to know" and "Your children", the answers under them, the closing
// button's label. He edits those in Sanity whenever he likes, and every edit
// turned the required `test` check red on every open PR (2026-10-05: first the
// removed "Good to know" band, then the renamed "Your children" subheadings).
// So the copy moved out: those assertions live in tests/content-watch.spec.ts
// under @content, which runs on a schedule and reports drift without blocking a
// merge. What stays here holds for any wording: the jump to the connection card
// resolves to a Church Trac frame, nothing on the page scrolls sideways at 320,
// and Home's rows (on the styleguide's fixed data) drop a past event.
//
// Removed as redundant (not weakened): "passes axe". a11y.spec.ts runs every
// axe rule, with no tag filter, over /visit already; this ran the narrower
// WCAG-tag subset of it.
// =============================================================================

const PAGE = '/visit';

/** The links on /visit that jump to its connection card, whatever they say. */
const jumps = (page: Page) => page.locator('main a[href="/visit#connect"]');

test.describe('the page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a jump to the connection card lands on a named Church Trac frame', async ({ page }) => {
    await page.goto(PAGE);
    const n = await jumps(page).count();
    test.skip(n === 0, 'no link to #connect on /visit right now (the @content watch reports it)');
    for (const b of await jumps(page).all()) {
      // A jump within the page: it must not open a tab or leave the site.
      await expect(b).not.toHaveAttribute('target', '_blank');
    }
    // The band it points at: a frame from Church Trac, named for assistive tech.
    const card = page.locator('#connect');
    await expect(card).toHaveCount(1);
    const frame = card.locator('iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', /^https:\/\/([a-z0-9-]+\.)?churchtrac\.com\//);
    await expect(frame).toHaveAttribute('title', /\S/);
  });
});

test.describe('at 320', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test('the composed page does not scroll sideways, and no heading or paragraph pokes out', async ({
    page,
  }) => {
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
    // Every h3 and paragraph in the page's bands (the old check named two bands
    // by their titles; the point was text bursting its box, wherever it is).
    const right = await page
      .locator('main section h3, main section p')
      .evaluateAll((els) => Math.max(0, ...els.map((e) => e.getBoundingClientRect().right)));
    expect(right).toBeLessThanOrEqual(320);
  });
});

test.describe('home rows', () => {
  test('never show an FBCM Events post whose event is over', async ({ page }) => {
    // The styleguide's fixed data: one past FBCM Events post (Blue Christmas,
    // 9 December 2025) measured from a fixed day (src/pages/styleguide.astro,
    // JOURNAL_LIST_NOW). Fixed on purpose: this is component behaviour.
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
