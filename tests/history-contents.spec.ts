import { test, expect, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// /history's contents bar (TimelineContents.astro, src/lib/timeline-contents.ts)
// =============================================================================
// The bar is derived from the timeline: one link per era row that points at a
// band on the page, plus the timeline itself. These checks prove it on the
// real build: it sticks, it follows the part in view, a jump lands clear of
// the bar (and of the header when the header is there), the phone control
// opens and closes by thumb and by keyboard, axe is clean, nothing overflows
// at 320, and the links still jump without JavaScript.
// =============================================================================

/** Every link's target, and the wrapper ids in order. */
async function linkTargets(page: Page, scope: string) {
  return page.$$eval(`.hc-bar ${scope} a[data-hc-link]`, (as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''),
  );
}

/** The target's top against the lowest of the header and a stuck bar. */
async function landing(page: Page, id: string) {
  return page.evaluate((i) => {
    const t = document.getElementById(i)!.getBoundingClientRect().top;
    const header = document.querySelector('header.site-header')!.getBoundingClientRect().bottom;
    const bar = document.querySelector('.hc-bar')!.getBoundingClientRect();
    return { top: t, cover: Math.max(header, bar.top <= header + 1 ? bar.bottom : header) };
  }, id);
}

async function expectLanded(page: Page, id: string) {
  await expect
    .poll(
      async () => {
        const { top, cover } = await landing(page, id);
        return top >= cover - 1 && top <= cover + 64;
      },
      { message: `#${id} should land just below the header and the bar`, timeout: 5000 },
    )
    .toBe(true);
}

const current = (page: Page, scope = '.hc-strip') =>
  page.locator(`.hc-bar ${scope} a[aria-current="location"]`);

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the bar lists the timeline and its eras, and every link has a target', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    const nav = page.getByRole('navigation', { name: 'Contents' });
    await expect(nav).toBeVisible();
    const hrefs = await linkTargets(page, '.hc-strip');
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    expect(hrefs[0]).toBe('#eras');
    for (const href of hrefs) {
      expect(await page.locator(href).count(), `${href} exists`).toBe(1);
    }
    // The phone list carries the same links, in the same order.
    expect(await linkTargets(page, '.hc-list')).toEqual(hrefs);
    // Accessible names read the whole marker and the title.
    await expect(
      nav.getByRole('link', { name: '1859 to 1862: Founding', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.hc-jump')).toBeHidden();
  });

  test('it sticks, and the part in view is marked as the page scrolls', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    for (const id of ['era-3', 'era-6']) {
      await page.evaluate(
        (i) =>
          window.scrollTo({
            top: document.getElementById(i)!.getBoundingClientRect().top + window.scrollY - 60,
            behavior: 'instant',
          }),
        id,
      );
      // Well inside the band: the part changes once its top has passed the line.
      await page.mouse.wheel(0, 400);
      await expect(current(page)).toHaveAttribute('href', `#${id}`);
      const bar = await page.locator('.hc-bar').boundingBox();
      const header = await page.evaluate(
        () => document.querySelector('header.site-header')!.getBoundingClientRect().bottom,
      );
      // Stuck: at the top of the window, or under a pinned header.
      expect(bar!.y === 0 || Math.abs(bar!.y - header) <= 1).toBe(true);
      await expect(page.locator('.hc-now')).not.toBeEmpty();
    }
    expect(await current(page).count()).toBe(1);
  });

  test('a jump down lands below the bar, and a jump back up below the header too', async ({
    page,
  }) => {
    await page.goto('/history', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
    await page.locator('.hc-strip a[href="#building"]').click();
    await expect(page).toHaveURL(/#building$/);
    await expectLanded(page, 'building');
    await expect(current(page)).toHaveAttribute('href', '#building');

    await page.locator('.hc-strip a[href="#era-1"]').click();
    await expectLanded(page, 'era-1');
    await expect(current(page)).toHaveAttribute('href', '#era-1');
  });

  test('the keyboard reaches every link, with a visible focus ring', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    const first = page.locator('.hc-strip a').first();
    await first.focus();
    await page.keyboard.press('Tab');
    const focused = page.locator('.hc-strip a').nth(1);
    await expect(focused).toBeFocused();
    const outline = await focused.evaluate((a) => getComputedStyle(a).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expectLanded(page, 'era-1');
  });

  test('past the last era the bar steps aside', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    const to = await page.locator('.hc-bar').getAttribute('data-hc-to');
    await page.evaluate((id) => {
      const el = document.getElementById(id!)!;
      window.scrollTo({
        top: el.getBoundingClientRect().bottom + window.scrollY + 40,
        behavior: 'instant',
      });
    }, to);
    await expect(page.locator('.hc-bar')).toHaveAttribute('data-past', '');
    await expect(page.locator('.hc-bar')).toBeHidden();
  });

  test('axe: no violations with the bar stuck', async ({ page }) => {
    await page.goto('/history#era-3', { waitUntil: 'load' });
    await settle(page);
    const results = await new AxeBuilder({ page }).include('.hc-bar').analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('only the timeline that is a table of contents gets a bar', async ({ page }) => {
    for (const route of ['/visit', '/ministries', '/']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(await page.locator('.hc-bar').count(), route).toBe(0);
    }
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('Jump to opens the list, a tap jumps and closes it', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    await expect(page.locator('.hc-strip')).toBeHidden();
    const summary = page.locator('.hc-jump summary');
    await expect(summary).toBeVisible();
    const box = await summary.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await summary.tap();
    const list = page.locator('.hc-list');
    await expect(list).toBeVisible();
    const rows = list.locator('a');
    for (const b of await rows.evaluateAll((as) =>
      as.map((a) => a.getBoundingClientRect().height),
    )) {
      expect(b).toBeGreaterThanOrEqual(44);
    }
    await list.locator('a[href="#era-3"]').tap();
    await expect(list).toBeHidden();
    await expectLanded(page, 'era-3');
    await expect(current(page, '.hc-list')).toHaveAttribute('href', '#era-3');
    await expect(summary).toContainText('The gas boom to the debt paid');
  });

  test('the keyboard opens it, and Escape closes it back onto the control', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    const summary = page.locator('.hc-jump summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.hc-list')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('.hc-list a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.hc-list')).toBeHidden();
    await expect(summary).toBeFocused();
  });

  test('axe: no violations with the list open', async ({ page }) => {
    await page.goto('/history#era-2', { waitUntil: 'load' });
    await settle(page);
    await page.locator('.hc-jump summary').click();
    const results = await new AxeBuilder({ page }).include('.hc-bar').analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test('no horizontal overflow at 320, closed and open', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/history#era-2', { waitUntil: 'load' });
  await settle(page, { freezeAnimations: false });
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.locator('.hc-jump summary').click();
  await expect(page.locator('.hc-list')).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  const right = await page
    .locator('.hc-bar')
    .evaluate((el) =>
      Math.max(...[...el.querySelectorAll('*')].map((n) => n.getBoundingClientRect().right)),
    );
  expect(right).toBeLessThanOrEqual(320);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });

  test('the links still jump', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    await page.locator('.hc-strip a[href="#era-5"]').click();
    await expect(page).toHaveURL(/#era-5$/);
    const top = await page.evaluate(
      () => document.getElementById('era-5')!.getBoundingClientRect().top,
    );
    expect(top).toBeGreaterThan(0);
    expect(top).toBeLessThan(400);
  });
});
