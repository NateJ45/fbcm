import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// The mobile menu, open (art-direction pass, task 4)
// =============================================================================
// The axe sweep (a11y.spec.ts) audits the RESTING DOM of every route, and the
// mobile menu is a Radix dialog that mounts nothing until somebody presses the
// trigger. So the sheet's own contrast, its dialog name and its focus
// behaviour were not in the sweep. This file opens it at 390 wide and audits
// the open state. Light only since 2026-09-24: the site never renders dark.
//
// It is a separate file rather than an addition to a11y.spec.ts on purpose:
// that file carries the PORTABLE canonical marker, so a site-specific
// assertion written into it puts the whole family into drift on the next
// sync-check.
//
// HYDRATION (2026-09-24). The trigger is server-rendered, so it is VISIBLE
// before React has hydrated the island (client:idle), and a click in that gap
// does nothing: the test then waits for a dialog that never opens. That was
// the overnight flake under load. pressMenu() waits for data-menu-ready,
// which MobileNav sets in a mount effect (it is not in the server HTML), so
// the click only lands once the trigger is live. No sleep.
//
// Reduced motion is on for the whole file: the rows animate in from opacity 0
// with `forwards`, and settle()'s `animation:none` freeze would otherwise pin
// a row at its starting opacity and audit a menu no visitor ever sees. Under
// reduce, globals.css puts the rows at their resting state outright.
// =============================================================================

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

/** Wait until the menu island has hydrated, then press its trigger. */
async function pressMenu(page: Page) {
  await page.locator('[data-menu-ready]').waitFor({ state: 'attached' });
  await page.getByRole('button', { name: /^menu$/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function openMenu(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await pressMenu(page);
  await settle(page);
}

test('the open mobile menu has no axe violations', async ({ page }) => {
  await openMenu(page);

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

test('a dropdown group is one list, named by its label and indented under it', async ({ page }) => {
  await openMenu(page);
  const dialog = page.getByRole('dialog');
  // Every group renders as a nested list named by its label (aria-labelledby)
  // with its links inside, so the children read as belonging to the group.
  const groups = dialog.locator('nav[aria-label="Primary mobile"] ul[aria-labelledby]');
  const count = await groups.count();
  test.skip(count === 0, 'the menu has no dropdown group today');
  for (let i = 0; i < count; i++) {
    const group = groups.nth(i);
    const label = dialog.locator(`[id="${await group.getAttribute('aria-labelledby')}"]`);
    await expect(label).toHaveCount(1);
    // The caret is aria-hidden, so the list's name is the label's words alone.
    const name = (await label.evaluate((el) => el.firstChild?.textContent ?? '')).trim();
    await expect(group).toHaveAccessibleName(name);
    const links = group.locator('a');
    expect(await links.count()).toBeGreaterThan(0);
    // Indented: the child links start well to the right of the label.
    const lx = (await label.boundingBox())?.x ?? 0;
    const cx = (await links.first().boundingBox())?.x ?? 0;
    expect(cx - lx).toBeGreaterThanOrEqual(16);
  }
});

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
  await pressMenu(page);
  await page.getByRole('dialog').locator('.goals-row a[href="/who-we-are#witness"]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#witness$/);
});

// With motion ON the goal glyphs draw themselves (data-reveal="draw"), but the
// sheet's body mounts after the page's reveal observer has run, so they used
// to stay undrawn: four blank spaces above the goal names (2026-09-24). The
// sheet now draws them as it opens. The file's default is reduced motion,
// where the draw rules do not exist, so this block opts back in.
test.describe('with motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the goal glyphs in the menu finish drawn', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.locator('[data-menu-ready]').waitFor({ state: 'attached' });
    await page.getByRole('button', { name: /^menu$/i }).click();
    const glyphs = page.locator('[role="dialog"] svg.building-glyph');
    await expect(glyphs).toHaveCount(4);
    for (const g of await glyphs.all()) {
      await expect(g).toHaveClass(/is-drawn/, { timeout: 5000 });
    }
    // Drawn means the strokes show: no dash left on any path.
    const dashed = await glyphs.evaluateAll((svgs) =>
      svgs.flatMap((s) =>
        // A stroke dotted by design (the basin's towel, stroke-dasharray="2 3")
        // is part of the drawing, not a draw left half-done.
        Array.from(s.querySelectorAll('path, circle, line, rect'))
          .filter((p) => !p.hasAttribute('stroke-dasharray'))
          .map((p) => getComputedStyle(p).strokeDasharray)
          .filter((d) => d && d !== 'none'),
      ),
    );
    expect(dashed).toEqual([]);
  });
});
