// This Sunday's sermon on the home hero's dated line, from YouTube when there
// is no preview (2026-09-24, `feat/this-sunday-youtube`).
//
// The line is decided at BUILD time (src/lib/this-sunday.ts) and corrected in
// the browser by the upgrade script in BaseLayout, which reads the visitor's
// clock. So every test here fixes the clock. The build this suite runs
// against reads the committed feed in tests/fixtures/youtube-feed.xml at a
// fixed Thursday (LAST_SUNDAY_FIXTURE / LAST_SUNDAY_NOW in
// playwright.config.ts), where the September 27 broadcast is scheduled with
// no views. /styleguide/this-sunday/<state> renders the home hero from the
// same fixture in fixed states, so the order of sources is tested without
// depending on which posts the live dataset holds.
import { test, expect, type Page } from '@playwright/test';

const THURSDAY = new Date('2026-09-24T16:00:00Z'); // noon, church time
const SUNDAY_MORNING = new Date('2026-09-27T13:00:00Z'); // 9 am, church time
const MONDAY = new Date('2026-09-28T14:00:00Z'); // the page has outlived its Sunday
const WATCH = 'https://www.youtube.com/watch?v=g33C2xE88cs';

const line = (page: Page) => page.locator('[data-live-sunday]').first();
const sermon = (page: Page) => page.locator('[data-sunday-sermon]').first();
const sermonLink = (page: Page) => page.locator('[data-sunday-sermon] a.sunday-sermon').first();

test.describe('This Sunday: the sermon on the dated line', () => {
  test('no preview: the line names the YouTube sermon and links to the watch page', async ({
    page,
  }) => {
    await page.clock.setFixedTime(THURSDAY);
    await page.goto('/styleguide/this-sunday/youtube');
    await expect(line(page)).toHaveText('This Sunday, September 27');
    await expect(sermon(page)).toBeVisible();
    const link = sermonLink(page);
    await expect(link).toHaveAttribute('href', WATCH);
    await expect(link).toHaveAttribute('data-sermon-source', 'youtube');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // The real title, whole on a wide screen, its own quoted words in double
    // quotes inside the line's single ones; the reading beside it.
    await expect(link.locator('[data-sermon-title="lg"]')).toHaveText(
      '‘How to Let Your “Yes” Be Yes and Your “No,” No’',
    );
    await expect(link).toContainText('Matthew 21:23-32');
  });

  test('Home, built from the fixture feed, names this Sunday’s sermon', async ({ page }) => {
    await page.clock.setFixedTime(THURSDAY);
    await page.goto('/');
    await expect(line(page)).toHaveText('This Sunday, September 27');
    const link = sermonLink(page);
    await expect(link).toBeVisible();
    // The live dataset decides whether the church wrote a preview for that
    // Sunday (it has not since January 2026); either way one sermon shows,
    // and a YouTube one is the fixture's broadcast.
    const source = await link.getAttribute('data-sermon-source');
    expect(['youtube', 'preview']).toContain(source);
    if (source === 'youtube') await expect(link).toHaveAttribute('href', WATCH);
  });

  test('a preview for the same Sunday wins over YouTube', async ({ page }) => {
    await page.clock.setFixedTime(THURSDAY);
    await page.goto('/styleguide/this-sunday/preview');
    const link = sermonLink(page);
    await expect(link).toHaveAttribute('href', '/blog');
    await expect(link).toHaveAttribute('data-sermon-source', 'preview');
    await expect(link).not.toHaveAttribute('target', /.*/);
    await expect(link).toContainText('‘When God Shows Up’');
    await expect(page.locator(`a[href="${WATCH}"]`)).toHaveCount(0);
  });

  test('an unparseable broadcast title shows no sermon, and the line reads as before', async ({
    page,
  }) => {
    await page.clock.setFixedTime(THURSDAY);
    await page.goto('/styleguide/this-sunday/unparseable');
    await expect(page.locator('[data-sunday-sermon]')).toHaveCount(0);
    await expect(line(page)).toHaveText(/^This Sunday, September 27 · Worship at \d/);
  });

  test('on the Sunday itself the line says Today and keeps the sermon', async ({ page }) => {
    await page.clock.setFixedTime(SUNDAY_MORNING);
    await page.goto('/styleguide/this-sunday/youtube');
    await expect(line(page)).toHaveText('Today');
    await expect(sermon(page)).toBeVisible();
  });

  test('once its Sunday has passed, the YouTube sermon is dropped and the time comes back', async ({
    page,
  }) => {
    await page.clock.setFixedTime(MONDAY);
    await page.goto('/styleguide/this-sunday/youtube');
    await expect(line(page)).toHaveText(/^This Sunday, October 4 · Worship at \d/);
    await expect(sermon(page)).toBeHidden();
  });

  // The title at each width (fix/sunday-title-length): the phone's cut below
  // 640, the 640 cap to 1023, the whole title from 1024. Every copy is in the
  // HTML; CSS shows exactly one.
  const TITLES: [number, string][] = [
    [390, '‘How to Let Your “Yes”…’'],
    [640, '‘How to Let Your “Yes” Be Yes and Your…’'],
    [1024, '‘How to Let Your “Yes” Be Yes and Your “No,” No’'],
  ];
  for (const [width, title] of TITLES) {
    test(`at ${width}px exactly one title shows: ${title}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.clock.setFixedTime(THURSDAY);
      await page.goto('/styleguide/this-sunday/youtube');
      const shown = await page
        .locator('[data-sunday-sermon] [data-sermon-title]')
        .evaluateAll((els) =>
          els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.textContent),
        );
      expect(shown).toEqual([title]);
    });
  }

  test('with JavaScript off the right title still shows (CSS alone picks it)', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1024, height: 800 },
    });
    const page = await ctx.newPage();
    await page.goto('/styleguide/this-sunday/youtube');
    await expect(page.locator('[data-sermon-title="lg"]')).toBeVisible();
    await expect(page.locator('[data-sermon-title="phone"]')).toBeHidden();
    await ctx.close();
  });

  for (const [path, width] of [
    ['/styleguide/this-sunday/youtube', 320],
    ['/styleguide/this-sunday/youtube', 640],
    ['/styleguide/this-sunday/youtube', 1024],
    ['/', 320],
  ] as const) {
    test(`no horizontal overflow at ${width}px: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.clock.setFixedTime(THURSDAY);
      await page.goto(path);
      await expect(sermonLink(page)).toBeVisible();
      const m = await page.evaluate(() => {
        const a = document.querySelector('[data-sunday-sermon] a.sunday-sermon');
        const r = a?.getBoundingClientRect();
        return {
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          right: r ? r.right : 0,
          height: r ? r.height : 0,
        };
      });
      expect(m.scroll).toBeLessThanOrEqual(m.client);
      expect(m.right).toBeLessThanOrEqual(width);
      // The length rules keep the sermon half to one line at every width
      // (13px capitals, one line is 22px).
      expect(m.height).toBeLessThan(30);
    });
  }
});
