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

test('Escape closes the menu and the rows are numbered', async ({ page }) => {
  await openMenu(page);

  // Every link row carries its own two-digit number, in order.
  const numbers = await page
    .locator('nav[aria-label="Primary mobile"] li a > span:first-child')
    .allInnerTexts();
  expect(numbers.length).toBeGreaterThan(0);
  expect(numbers).toEqual(numbers.map((_, i) => String(i + 1).padStart(2, '0')));

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
