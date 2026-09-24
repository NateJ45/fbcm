// NOT PORTABLE on FBCM since 2026-09-24. The marker came off deliberately
// (PORTS.md card 37): the site is light-only, so the dark shot and its
// baseline were removed, which the family's canonical copy must not carry.
/* ============================================================================
   Visual regression - the styleguide wall
   ============================================================================
   See playwright.visual.config.ts for why this is a separate suite, why the
   baselines are generated in CI, and why this file refuses to run on Windows.

   One full-page shot per theme. FBCM has one theme since 2026-09-24 (it is
   light-only; the dark palette is dormant), so it has one shot. The starter's
   copy takes two, because the bug that prompted this suite was
   theme-specific.
   ============================================================================ */
import { test, expect, type Page } from '@playwright/test';
import { site } from '../../src/data/site';

// THE BASELINES ARE LINUX PIXELS. Font rasterisation on Windows differs enough
// that the dark shot fails every local run, which is how a gate gets ignored.
// Skip with a reason rather than fail with one; CI is the arbiter. Set
// VISUAL_FORCE=1 to run anyway when you are debugging the harness itself.
const WINDOWS_SKIP =
  process.platform === 'win32' && !process.env.VISUAL_FORCE
    ? 'Baselines are Linux-rendered; Windows font rasterisation differs. Run this in CI ' +
      '(.github/workflows/visual.yml), or set VISUAL_FORCE=1 to compare anyway.'
    : null;

if (WINDOWS_SKIP) {
  // The annotation carries the reason into the report; this line carries it
  // into the terminal, where the person who typed the command is looking.
  console.log(`\n[visual] Skipped on win32. ${WINDOWS_SKIP}\n`);
}

test.skip(() => WINDOWS_SKIP !== null, WINDOWS_SKIP ?? '');

// The site keys its theme off localStorage under a slug-derived name, applied
// by the BaseLayout head script BEFORE first paint. emulateMedia does nothing
// here, because the choice is class-driven rather than media-driven. Seeding
// the site's own key uses the real mechanism, so the screenshot can never
// catch a light flash on its way to dark. Read from site.ts rather than
// written out, so a rebrand cannot silently break it.
const THEME_KEY = site.themeStorageKey;

async function settle(page: Page) {
  await page.goto('/styleguide/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Every image loads before the shot. The page's images are loading="lazy",
  // and the hero fixture sits about 3,500px down, so a full-page shot raced
  // them: on 2026-09-23 the same build failed light and dark on one run and
  // only dark on the next, with the hero drawn as a bare indigo field instead
  // of its photograph. Promoting to eager and waiting on decode() makes the
  // shot deterministic without loosening the assertion.
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    for (const img of imgs) img.loading = 'eager';
    await Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
  });
  // Fonts swapping after first paint move every line of type. Waiting on
  // document.fonts.ready covers the load; the pause covers the reflow.
  await page.waitForTimeout(400);
}

test('styleguide, light', async ({ page }) => {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(key, 'light');
    } catch {
      /* private window: the default is light anyway */
    }
  }, THEME_KEY);
  await settle(page);
  await expect(page).toHaveScreenshot('styleguide-light.png', { fullPage: true, timeout: 30_000 });
});
