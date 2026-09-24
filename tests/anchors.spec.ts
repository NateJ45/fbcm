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

// =============================================================================
// Keyboard and scrollbar gestures count as "a user scroll" too
// =============================================================================
// The gesture gate in BaseLayout's sticky-header script originally listened to
// wheel/touchstart/touchmove only. That missed two real ways a visitor scrolls:
// arrow keys / Space / Page Down / Home / End, and dragging the scrollbar
// thumb (a `pointerdown` with no wheel or touch event behind it). Without
// `keydown`/`pointerdown` in the gesture list, a keyboard visitor's own
// scroll would never hide or re-show the header, and worse, `keepLanding`
// (which re-asserts the fragment's landing position for up to 1500ms) would
// have kept yanking the page back to the anchor out from under someone who
// started pressing ArrowDown the moment the page loaded. These two checks
// prove both halves are fixed.
// =============================================================================

test('a keyboard scroll right after a fragment landing is not undone', async ({ page }) => {
  await page.goto('/beliefs#baptists', { waitUntil: 'load' });

  // Five ArrowDown presses, back to back, well inside both the 600ms gesture
  // window and the 1500ms landing-correction window -- exactly the scenario
  // that would have been fought by keepLanding before keydown counted as a
  // gesture.
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowDown');
  }
  const afterPresses = await page.evaluate(() => window.scrollY);
  expect(
    afterPresses,
    'ArrowDown should have moved the page down from the anchor landing',
  ).toBeGreaterThan(0);

  // Give keepLanding's correction loop, which polls every animation frame,
  // every chance to snap the page back to the anchor if it were going to.
  await page.waitForTimeout(800);
  const afterWait = await page.evaluate(() => window.scrollY);

  expect(
    afterWait,
    `scrollY should hold near where the keyboard left it (${afterPresses}), not snap back toward the anchor`,
  ).toBeGreaterThanOrEqual(afterPresses - 5);
});

test('the header stays away on the way down and slides in on a scroll up', async ({ page }) => {
  // /history is the ~33,000px page: End always lands well past PIN_AFTER
  // regardless of viewport height, and Home always lands at y=0. Keyboard
  // scrolls count as gestures, so direction applies to every step here.
  await page.goto('/history', { waitUntil: 'load' });
  await page.waitForTimeout(300); // let the polish script's initial landing settle (no hash here, so this is just wiring)

  const state = () =>
    page.evaluate(() => {
      const h = document.querySelector('header.site-header')!;
      return { pinned: h.hasAttribute('data-scrolled'), top: h.getBoundingClientRect().top };
    });
  const settle = () => page.waitForTimeout(700); // past the 360ms slide and any smooth scroll

  await page.keyboard.press('End');
  await settle();
  const end = await state();
  expect(end.pinned, 'scrolling down should not bring the header in').toBe(false);
  expect(end.top, 'the header should be parked above the viewport').toBeLessThan(0);

  await page.keyboard.press('PageUp');
  await settle();
  expect(await state(), 'a scroll up should pin the header at the top').toEqual({
    pinned: true,
    top: 0,
  });

  await page.keyboard.press('PageDown');
  await settle();
  expect((await state()).pinned, 'a scroll down should send it away again').toBe(false);

  await page.keyboard.press('Home');
  await settle();
  expect(await state(), 'at the top the header sits in its own slot').toEqual({
    pinned: false,
    top: 0,
  });
});

// The regression this layout exists to prevent: the header coming or going must
// never move the page under it. Measured on the home page, which opens with an
// image hero, because overlay mode is where the shift used to live.
test('pinning the header does not shift the content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const mainTop = () =>
    page.evaluate(
      () => document.getElementById('main')!.getBoundingClientRect().top + window.scrollY,
    );
  const before = await mainTop();
  for (const y of [20, 150, 400, 1200, 0]) {
    await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y);
    await page.waitForTimeout(100);
    expect(await mainTop(), `main moved at scrollY ${y}`).toBeCloseTo(before, 0);
  }
});

// =============================================================================
// Back/forward restores the browser's own scroll position, not the anchor
// =============================================================================
// CLAUDE.md rule 5: history navigation (back/forward) restores whatever
// scroll position the visitor was actually at, forward navigation resets to
// the top. A page loaded via back/forward with a hash still in the URL
// (e.g. /beliefs#baptists after the visitor had scrolled to 2000px and come
// back) must NOT have the fragment-landing code re-jump it to the anchor --
// that would fight the browser's own scroll restoration and undo rule 5.
// =============================================================================

test('back/forward restores scroll position, not the fragment landing', async ({ page }) => {
  await page.goto('/beliefs#baptists', { waitUntil: 'load' });
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
  // Give the polish script's own correction loop a chance to react (it
  // shouldn't, since this is a real scrollTo with no gesture behind it, but
  // the point of this test is the back-navigation case below, not this one).
  await page.waitForTimeout(300);

  await page.goto('/visit', { waitUntil: 'load' });
  await page.goBack({ waitUntil: 'load' });
  // Let a (correctly skipped) landing loop run its course if it were going
  // to fire, so a false pass isn't just "we didn't wait long enough".
  await page.waitForTimeout(1700);

  const restoredY = await page.evaluate(() => window.scrollY);
  expect(
    restoredY,
    `back navigation should restore the pre-navigation scroll position (~2000px), not re-jump to the anchor (got ${restoredY})`,
  ).toBeGreaterThan(1500);
});
