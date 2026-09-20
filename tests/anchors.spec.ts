import { test, expect } from '@playwright/test';

// =============================================================================
// Anchors land below the sticky header
// =============================================================================
// Plan 2b (F2) set --header-offset in globals.css so `scroll-mt-[var(--header-offset)]`
// on every anchor target clears the sticky header. This is the assertion that
// proves it, rather than trusting the CSS value forever: for each in-page anchor
// a real visitor can arrive at from a redirect or a nav link, the target element
// must land AT the header's bottom edge (not hidden behind it, and not scrolled
// so far past it that the visitor loses context).
//
// The band is [header bottom - 1px, header bottom + 64px]: the -1px tolerates
// subpixel rounding between the two getBoundingClientRect() calls, and the
// +64px allows a little breathing room above the target (some browsers/scroll
// timing land a few px short of the exact offset) without allowing the target
// to be scrolled halfway down the viewport.
// =============================================================================

const ANCHOR_URLS = [
  '/beliefs#baptists',
  '/staff#kendall-ellis',
  '/ministries#youth',
  '/visit#accessibility',
  '/history#building',
];

/** Read the target's top and the header's bottom, in the same frame. */
async function measureAnchor(page: import('@playwright/test').Page, hash: string) {
  return page.evaluate((id) => {
    const target = document.getElementById(id);
    const header = document.querySelector('header.site-header');
    if (!target) throw new Error(`no element with id "${id}"`);
    if (!header) throw new Error('no header.site-header found');
    return {
      targetTop: target.getBoundingClientRect().top,
      headerBottom: header.getBoundingClientRect().bottom,
    };
  }, hash);
}

for (const url of ANCHOR_URLS) {
  test(`${url} lands below the sticky header`, async ({ page }) => {
    await page.goto(url, { waitUntil: 'load' });
    // One animation frame so the browser's own anchor-scroll (which can land a
    // frame after `load`) has settled before we measure.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

    const hash = url.split('#')[1];
    const { targetTop, headerBottom } = await measureAnchor(page, hash);

    expect(
      targetTop,
      `${url}: target top (${targetTop}) should be >= header bottom - 1 (${headerBottom - 1})`,
    ).toBeGreaterThanOrEqual(headerBottom - 1);
    expect(
      targetTop,
      `${url}: target top (${targetTop}) should be <= header bottom + 64 (${headerBottom + 64})`,
    ).toBeLessThanOrEqual(headerBottom + 64);
  });
}

// Reduced motion changes whether the browser's native anchor scroll (and any
// scroll-behavior: smooth on the page) animates, not where it lands. Checked
// on chromium only: this is a browser preference, not a per-engine behavior,
// and running it on every project would just double the anchor suite for no
// new signal.
test('reduced motion: /beliefs#baptists still lands below the sticky header', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'reduced-motion check runs once, on chromium');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/beliefs#baptists', { waitUntil: 'load' });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

  const { targetTop, headerBottom } = await measureAnchor(page, 'baptists');

  expect(targetTop).toBeGreaterThanOrEqual(headerBottom - 1);
  expect(targetTop).toBeLessThanOrEqual(headerBottom + 64);
});
