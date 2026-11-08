// NOT PORTABLE: written for FBCM on 2026-11-08 (WCAG 2.2 AA pass). It can move to the starter
// later with a port card; until then it is this repo's own.
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

// =============================================================================
// WCAG 2.4.11 Focus Not Obscured (Minimum), at phone width
// =============================================================================
// The sticky header (top) and the bottom action bar can each sit on top of the
// element a keyboard user just tabbed to. The page's own `scroll-padding-top`
// and `scroll-padding-bottom` are what keep the browser from scrolling a focus
// target underneath them, so this walks a long page with Tab (down) and then
// Shift+Tab (back up) and asserts, after every key, that the focused element is
// never FULLY covered: probing nine points inside its rectangle with
// elementFromPoint, at least one must hit the element itself.
// =============================================================================

test.use({ viewport: { width: 390, height: 844 } });

/** Nine probe points (3 x 3 grid, inset a little from the edge) are tested against the element. */
async function visibleHits(
  page: Page,
): Promise<{ tag: string; label: string; hits: number; probed: number; top: number } | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body || el === document.documentElement) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    let hits = 0;
    let probed = 0;
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const fy of [0.1, 0.5, 0.9]) {
        const x = r.left + r.width * fx;
        const y = r.top + r.height * fy;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        probed++;
        const hit = document.elementFromPoint(x, y);
        if (hit && (el === hit || el.contains(hit))) hits++;
      }
    }
    return {
      tag: el.tagName.toLowerCase(),
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
      hits,
      probed,
      top: Math.round(r.top),
    };
  });
}

/** Let the smooth scroll and the header's slide finish before measuring. */
async function settleScroll(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = -1;
        let still = 0;
        const tick = () => {
          const y = window.scrollY;
          still = Math.abs(y - last) < 0.5 ? still + 1 : 0;
          last = y;
          if (still >= 20) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}

// /visit and / carry the phone action bar; /beliefs and /history are the long pages with the most
// links. Each is walked in full, down and then back up.
for (const route of ['/', '/visit', '/beliefs', '/history']) {
  test(`focus is never fully covered at 390px: ${route}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto(route, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const problems: string[] = [];
    const seen = { down: 0, up: 0 };

    const check = async (dir: 'down' | 'up') => {
      await settleScroll(page);
      const m = await visibleHits(page);
      if (!m) return;
      seen[dir]++;
      // Probed 0 means the element is off screen or a cross-origin frame the browser did not
      // scroll to; that is not 'covered', so only a probed element with no hit fails.
      if (m.probed > 0 && m.hits === 0) {
        problems.push(`${dir}: <${m.tag}> "${m.label}" top=${m.top} hits=0/${m.probed}`);
      }
    };

    // Down, through the whole document. Tab past the last link lands on the body (or the first
    // element again), which ends the walk; the cap is a guard against a focus trap, not a target.
    let first = '';
    for (let i = 0; i < 400; i++) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => {
        const a = document.activeElement;
        return !a || a === document.body
          ? ''
          : `${a.tagName}|${a.getAttribute('href')}|${a.textContent?.trim().slice(0, 20)}`;
      });
      if (!id || (i > 0 && id === first)) break;
      if (i === 0) first = id;
      await check('down');
    }
    // And back up.
    for (let i = 0; i < 400; i++) {
      await page.keyboard.press('Shift+Tab');
      await check('up');
      const atTop = await page.evaluate(
        () => document.activeElement === document.body || window.scrollY < 2,
      );
      if (atTop && i > 3) break;
    }

    expect(seen.down, 'walked down').toBeGreaterThan(5);
    expect(seen.up, 'walked up').toBeGreaterThan(5);
    expect(problems, `focused elements fully covered on ${route}:\n${problems.join('\n')}`).toEqual(
      [],
    );
  });
}

// The header clearance itself: while a keyboard is driving, the page's scroll-padding-top is at
// least the pinned header's height, so Shift+Tab's scroll cannot park a link beneath it. (The walk
// above cannot see this in headless Chromium: the header only pins on a real scroll gesture.)
test('keyboard focus puts scroll-padding-top at or past the header height', async ({ page }) => {
  await page.goto('/beliefs', { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  const { pad, header } = await page.evaluate(() => ({
    pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0,
    header: document.querySelector('header.site-header')!.getBoundingClientRect().height,
  }));
  expect(header).toBeGreaterThan(50);
  expect(pad).toBeGreaterThanOrEqual(header + 8);
});
