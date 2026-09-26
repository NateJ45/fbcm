// scaffold-file: journal
import { test, expect, type Page } from './fixtures';

// =============================================================================
// Client-side navigation keeps the page's state (feat/print-motion, 2026-09-24)
// =============================================================================
// Astro's router swaps pages without a reload, and every inline script that
// upgrades a page (the This Sunday line, the header's data-scrolled seed) has
// to run again on the new one, while the scroll reset on a forward navigation
// and the restore on a back navigation (CLAUDE.md rule 5, the router's own
// since Lenis went on 2026-09-24) still hold, instantly: html carries
// scroll-behavior: smooth, and neither may glide.
// The walk: Home, Blog, a post (by its row, whose title carries over into the
// h1), the search dialog, then back to Blog.
//
// Chromium only (the default project): it drives the real View Transitions
// API, and the viewport is pinned for the desktop header, as header.spec.ts is.
// NOT PORTABLE: the routes and the rows are this site's.
// =============================================================================

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });

/** The dateless server line is "Sundays · ..."; the upgraded one names the day. */
const LIVE_SUNDAY = /^(Today|This Sunday, )/;

type Walk = Window & { __walk?: number; __swapY?: number[] };

/** The router has finished the swap and the transition. */
async function settled(page: Page) {
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-astro-transition'));
  await page.waitForTimeout(500);
}

test('Home, Blog, a post and back keep scroll, header, Sunday line and search', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.evaluate(() => {
    const w = window as Walk;
    w.__walk = 1;
    // Where the router left the page at the moment of each swap. A glide
    // would still be at the old position here; an instant placement is done.
    w.__swapY = [];
    document.addEventListener('astro:after-swap', () => w.__swapY!.push(window.scrollY));
  });
  const swapY = () => page.evaluate(() => (window as Walk).__swapY!.at(-1));

  // Down the home page with a real gesture, then Blog from the header.
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  // Blog is in the header's News dropdown since 2026-09-26: open it by hover,
  // as a visitor does, then take the link.
  await page.locator('header summary', { hasText: 'News' }).hover();
  await page.click('header a[href="/blog"]');
  await expect(page).toHaveURL(/\/blog\/?$/);
  await settled(page);

  // A client-side swap (the window survived), reset to the top, instantly.
  expect(await page.evaluate(() => (window as Walk).__walk)).toBe(1);
  expect(await swapY()).toBe(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('footer [data-live-sunday]')).toHaveText(LIVE_SUNDAY);

  // Down to a row, and into its post by the title.
  const row = page.locator('[data-vt-title] a').nth(6);
  await row.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(700);
  const rowY = await page.evaluate(() => window.scrollY);
  expect(rowY).toBeGreaterThan(150);
  const href = (await row.getAttribute('href')) ?? '';
  await row.click();
  await expect(page).toHaveURL(
    new RegExp(`${encodeURI(href).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`),
  );
  await settled(page);

  expect(await page.evaluate(() => (window as Walk).__walk)).toBe(1);
  expect(await swapY()).toBe(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const h1 = page.locator('h1.p2-title');
  await expect(h1).toBeVisible();
  // The row's title was carried into this h1 (the name stays set until the
  // next navigation clears it).
  expect(await h1.evaluate((h) => h.style.getPropertyValue('view-transition-name'))).toBe(
    'post-title',
  );
  await expect(page.locator('footer [data-live-sunday]')).toHaveText(LIVE_SUNDAY);
  // The header is seeded for the top of the page: not pinned.
  await expect(page.locator('.site-header')).not.toHaveAttribute('data-scrolled', /.*/);

  // The search dialog opens on the swapped-in page, and closes.
  await page.getByRole('button', { name: 'Search the site' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search the site' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Back: the blog comes back where it was left, with the header pinned from
  // the restored position alone (no scroll gesture behind it).
  await page.goBack();
  await expect(page).toHaveURL(/\/blog\/?$/);
  await settled(page);
  expect(await page.evaluate(() => (window as Walk).__walk)).toBe(1);
  const backY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(backY - rowY), `restored to ${backY}, left at ${rowY}`).toBeLessThanOrEqual(40);
  // Restored in the swap itself, not glided to afterwards.
  expect(Math.abs((await swapY())! - rowY)).toBeLessThanOrEqual(40);
  await expect(page.locator('.site-header')).toHaveAttribute('data-scrolled', /.*/);
  await expect(page.locator('footer [data-live-sunday]')).toHaveText(LIVE_SUNDAY);
  // Back is the plain cross-fade: nothing carries a shared name.
  const named = await page.evaluate(
    () => document.querySelectorAll('[style*="view-transition-name"]').length,
  );
  expect(named).toBe(0);
});
