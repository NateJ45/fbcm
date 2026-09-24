import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';
import { site } from '../src/data/site';

// =============================================================================
// The mobile menu, open (art-direction pass, task 4)
// =============================================================================
// The two axe sweeps (a11y.spec.ts, a11y-dark.spec.ts) audit the RESTING DOM of
// every route, and the mobile menu is a Radix dialog that mounts nothing until
// somebody presses the trigger. So the sheet's own contrast, its dialog name
// and its focus behaviour were in neither sweep. This file opens it at 390 wide
// and audits the open state in both themes.
//
// It is a separate file rather than an addition to those two on purpose: both
// carry the PORTABLE canonical marker, so a site-specific assertion written
// into either one puts the whole family into drift on the next sync-check.
//
// Dark mode is forced the way a remembered preference would apply it, by
// seeding the theme key BEFORE the page's inline bootstrap runs. The key comes
// from site.ts so a rebrand cannot leave this silently testing light twice.
//
// Reduced motion is on for the whole file: the rows animate in from opacity 0
// with `forwards`, and settle()'s `animation:none` freeze would otherwise pin
// a row at its starting opacity and audit a menu no visitor ever sees. Under
// reduce, globals.css puts the rows at their resting state outright.
// =============================================================================

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

async function openMenu(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const trigger = page.getByRole('button', { name: /^menu$/i });
  await trigger.waitFor({ state: 'visible' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await settle(page);
}

for (const theme of ['light', 'dark'] as const) {
  test(`the open mobile menu has no axe violations (${theme})`, async ({ page }) => {
    if (theme === 'dark') {
      await page.addInitScript((key) => {
        window.localStorage.setItem(key, 'dark');
      }, site.themeStorageKey);
    }
    await openMenu(page);
    if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/);

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      results.violations
        .map((v) => {
          const targets = v.nodes.map((n) => n.target.join(' ')).join(', ');
          return `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    selectors: ${targets}`;
        })
        .join('\n'),
    ).toEqual([]);
  });
}

test('Escape closes the menu; the rows carry no numbers; the goals link to Who We Are', async ({
  page,
}) => {
  await openMenu(page);

  // The rows are words only: a menu is not a sequence, so no 01, 02, 03
  // (rollout plan rule 11, 2026-09-24).
  const rows = await page.locator('nav[aria-label="Primary mobile"] li a').allInnerTexts();
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) expect(row.trim()).not.toMatch(/^\d/);

  // The four goals at the foot, each to its band on Who We Are.
  const dialog = page.getByRole('dialog');
  const goals = dialog.locator('.goals-row a');
  await expect(goals).toHaveCount(4);
  expect(await goals.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual([
    '/who-we-are#worship',
    '/who-we-are#the-way',
    '/who-we-are#witness',
    '/who-we-are#work',
  ]);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('following a goal from the menu closes the sheet', async ({ page, browserName }) => {
  // Playwright's WebKit on Windows crashes the page when ANY link in the open
  // sheet is followed (the existing Visit row does it too, measured
  // 2026-09-24), so the delegation is proved on Chromium.
  test.skip(
    browserName === 'webkit',
    'WebKit on Windows crashes on any link followed from the sheet',
  );
  await page.goto('/who-we-are/', { waitUntil: 'domcontentloaded' });
  const trigger = page.getByRole('button', { name: /^menu$/i });
  await trigger.waitFor({ state: 'visible' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').locator('.goals-row a[href="/who-we-are#witness"]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#witness$/);
});
