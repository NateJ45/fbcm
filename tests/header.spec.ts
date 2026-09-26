import { test, expect } from './fixtures';

// =============================================================================
// The sticky header (art-direction pass, task 3, fix round 1)
// =============================================================================
// These two assertions used to live in scripts/verify-header-fix1.mjs, a
// one-off that launched its own browser and its own static server and had to
// be remembered and run by hand. They are gates, so they belong in the suite
// that runs on every push. The script is deleted; this file is its record.
//
// 1. `data-scrolled` is SEEDED on wire, not only set from a scroll event.
//    The discriminating case is a full reload at a restored scroll position:
//    the browser restores the offset while the document is still parsing,
//    which is before the polish script attaches its listener, so no scroll
//    event ever reaches it. An overlay header that waits for one stays
//    transparent over opaque content. A back navigation is the softer half of
//    the same bug (the router does produce a scroll event), and both are here.
//
// 2. The Give button is a real 44px tap target at desktop width. It is the
//    header's only filled control and the easiest thing in the build to shrink
//    by a line-height tweak nobody connects to a WCAG target size.
//
// Desktop width is explicit, because both assertions are about the desktop
// header: on a phone the Give button is inside the menu sheet and the header
// carries no overlay state to seed. That is also why this file stays
// chromium-only in playwright.config.ts, alongside reflow.spec.ts.
//
// NOT PORTABLE: `.header-give` and the /ministries link (a top-level link; Beliefs moved into the Our Church dropdown on 2026-09-24) are this site's.
// =============================================================================

test.use({ viewport: { width: 1440, height: 900 } });

/**
 * Resolves as soon as the header carries `data-scrolled`, or after `budget`ms.
 * Polling on rAF rather than waiting on a class change, because the point of
 * the fix is that this state arrives WITHOUT an event to hang a waiter on.
 */
async function whenScrolledSeeded(page: import('@playwright/test').Page, budget = 500) {
  return page.evaluate(
    (ms) =>
      new Promise<{ ok: boolean; elapsed: number; y: number }>((resolve) => {
        const start = performance.now();
        const tick = () => {
          const el = document.querySelector('.site-header');
          const elapsed = Math.round(performance.now() - start);
          if (el && el.hasAttribute('data-scrolled')) {
            resolve({ ok: true, elapsed, y: window.scrollY });
            return;
          }
          if (elapsed > ms) {
            resolve({ ok: false, elapsed, y: window.scrollY });
            return;
          }
          requestAnimationFrame(tick);
        };
        tick();
      }),
    budget,
  );
}

test('data-scrolled follows a scroll up, and is seeded on a restore', async ({ page }) => {
  const header = page.locator('.site-header');

  await page.goto('/', { waitUntil: 'load' });
  await expect(header).not.toHaveAttribute('data-scrolled', /.*/);

  // Real wheel gestures: down keeps the bar away, up brings it in.
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(700);
  await expect(header).not.toHaveAttribute('data-scrolled', /.*/);
  await page.mouse.wheel(0, -100);
  await expect(header).toHaveAttribute('data-scrolled', /.*/);

  // A real in-page link click, so the View Transitions router handles it, and
  // a settle before going back: Astro stores the outgoing scroll position
  // during the swap, and leaving immediately gives it nothing to restore.
  await page.click('header a[href="/ministries"]');
  await expect(page).toHaveURL(/\/ministries\/?$/);
  await page.waitForTimeout(900);
  await page.goBack();

  // The SOFT half of the bug, and it is gated on the restore actually
  // happening. The router does fire a scroll event when it restores, so this
  // case can be satisfied by a listener alone; if the browser lands at the top
  // instead there is no restored position to seed from and the assertion would
  // be asking the header for a state that is correctly absent. The hard half
  // is below, and it is the one that discriminates.
  const restored = await page
    .waitForFunction(() => window.scrollY > 0, null, { timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (restored) {
    const back = await whenScrolledSeeded(page);
    expect(back, `after back navigation: ${JSON.stringify(back)}`).toMatchObject({ ok: true });
  }

  // The harder half: a full reload at a restored offset, which produces no
  // scroll event at all. This is the one that fails if the seed call goes.
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'load' });
  const reloaded = await whenScrolledSeeded(page);
  expect(reloaded, `after reload: ${JSON.stringify(reloaded)}`).toMatchObject({ ok: true });
});

test('the Give button clears the 44px target size', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const give = page.locator('header .header-give').first();
  await expect(give).toBeVisible();
  const box = await give.boundingBox();
  expect(box, 'the Give button has no rendered box').not.toBeNull();
  expect(box!.height, `Give button height ${box!.height}`).toBeGreaterThanOrEqual(44);
});
