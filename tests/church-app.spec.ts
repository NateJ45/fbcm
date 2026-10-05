// scaffold-file: church
import { test, expect, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';

// =============================================================================
// The church app (2026-09-25, feat/church-app)
// =============================================================================
// Home's band and the footer's two store buttons, drawn from Site settings'
// "Church app" link (a churchtrac.com share link carrying the church's install
// code), with the code read out of it (src/lib/church-app.ts).
//
// CONTENT INDEPENDENCE (2026-10-05). The share link and its code are the
// church's to change in Site settings, so nothing here names them: the code is
// READ from the band's own link, and the checks are that the band, the tiles,
// the Google Play referrer and the footer all agree with it. The two store
// listings are constants in code (Church Trac's, the same for every church) and
// stay literal. That Home still carries the band, and that the code is the one
// the church has today, is watched in tests/content-watch.spec.ts (@content).
// =============================================================================

const APP_STORE = 'https://apps.apple.com/us/app/churchtrac-connect-app/id6737914083';
const PLAY_BASE = 'https://play.google.com/store/apps/details?id=com.churchtrac.churchconnect';

/** The install code in the share link on Home's band, or a skip when the church has none. */
async function installCode(page: Page): Promise<string> {
  await page.goto('/');
  test.skip(
    (await page.locator('[data-church-app-band]').count()) === 0,
    'Site settings has no church app link right now (the @content watch reports it)',
  );
  const href =
    (await page
      .locator('[data-church-app-band]')
      .getByRole('link', { name: 'Get the app' })
      .getAttribute('href')) ?? '';
  expect(href, 'the share link').toMatch(/^https:\/\/([a-z0-9-]+\.)?churchtrac\.com([/?]|$)/);
  const code = new URL(href).searchParams.get('code') ?? '';
  expect(code, 'the install code in the share link').toMatch(/^[A-Z0-9]{6}$/);
  return code;
}

test.describe('the Home band', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('names the app, links the share link and both stores, and prints the code', async ({
    page,
  }) => {
    const code = await installCode(page);
    const band = page.locator('[data-church-app-band]');
    await expect(band).toHaveCount(1);
    await expect(band.getByRole('heading', { level: 2 })).toHaveText('The Church App');

    const get = band.getByRole('link', { name: 'Get the app' });
    await expect(get).toHaveAttribute('target', '_blank');
    await expect(get).toHaveAttribute('rel', /noopener/);

    const apple = band.locator('a[data-store="app-store"]');
    const google = band.locator('a[data-store="google-play"]');
    await expect(apple).toHaveAttribute('href', APP_STORE);
    // Google Play carries the church's code as the install referrer, derived from it.
    await expect(google).toHaveAttribute('href', `${PLAY_BASE}&referrer=code%3D${code}`);
    await expect(apple).toHaveAccessibleName(/App Store/);
    await expect(google).toHaveAccessibleName(/Google Play/);
    for (const a of [apple, google]) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }

    // The code: one tile per character on screen, one spelled-out string for a screen reader.
    const printed = band.locator('[data-install-code]');
    await expect(printed).toHaveAttribute('data-install-code', code);
    await expect(printed.locator('.ca-tile')).toHaveText(code.split(''));
    await expect(printed.locator('.sr-only')).toHaveText(code.split('').join(' '));

    // What the app is for, in words (the phone drawing is hidden from the tree).
    await expect(band.getByRole('heading', { level: 3 })).toHaveText([
      "What's On",
      'Prayer List',
      'Ministry news',
      'Church updates',
    ]);
    await expect(band.locator('.ca-figure')).toHaveAttribute('aria-hidden', 'true');
  });

  test("follows What's On, before the Church Blog rows", async ({ page }) => {
    await installCode(page);
    const order = await page
      .locator('[data-whats-on-band], [data-church-app-band]')
      .evaluateAll((els) =>
        els.map((e) => (e.hasAttribute('data-church-app-band') ? 'app' : 'wo')),
      );
    expect(order).toEqual(['wo', 'app']);
  });

  test('axe finds nothing in the band', async ({ page }) => {
    await installCode(page);
    const results = await new AxeBuilder({ page }).include('[data-church-app-band]').analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('the footer', () => {
  // The styleguide pages render fixed data with no Site settings, so their
  // footer has no app link to draw from; every page built from the church's
  // settings carries the buttons.
  test('carries the two store buttons and the code on every page', async ({ page }) => {
    const code = await installCode(page);
    for (const route of routes.filter((r) => !r.startsWith('/styleguide'))) {
      await page.goto(route);
      const app = page.locator('footer [data-footer-app]');
      await expect(app, route).toHaveCount(1);
      await expect(app.locator('a[data-store="app-store"]'), route).toHaveAttribute(
        'href',
        APP_STORE,
      );
      await expect(app.locator('a[data-store="google-play"]'), route).toHaveAttribute(
        'href',
        `${PLAY_BASE}&referrer=code%3D${code}`,
      );
      await expect(app, route).toContainText(code);
    }
  });

  test('axe finds nothing in the footer', async ({ page }) => {
    await page.goto('/visit');
    const results = await new AxeBuilder({ page }).include('footer').analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('on a small phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const route of ['/', '/visit']) {
    test(`no overflow at 320 on ${route}, and every app button is a 44px target`, async ({
      page,
    }) => {
      await installCode(page);
      await page.goto(route);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(over).toBe(0);

      const targets = page.locator(
        '[data-church-app-band] a, footer [data-footer-app] a[data-store]',
      );
      const n = await targets.count();
      expect(n).toBeGreaterThanOrEqual(route === '/' ? 5 : 2);
      for (let i = 0; i < n; i++) {
        const t = targets.nth(i);
        await t.scrollIntoViewIfNeeded();
        const box = await t.boundingBox();
        expect(box, `target ${i}`).not.toBeNull();
        expect(box!.height, `target ${i} height`).toBeGreaterThanOrEqual(44);
        expect(box!.width, `target ${i} width`).toBeGreaterThanOrEqual(44);
        // Nothing in the band or the footer pokes past the viewport.
        expect(box!.x + box!.width, `target ${i} right edge`).toBeLessThanOrEqual(320);
      }
    });
  }
});
