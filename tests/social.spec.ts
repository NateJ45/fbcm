import { test, expect, type Locator, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// The church's accounts elsewhere (2026-09-24, feat/social-links)
// =============================================================================
// One derived list (src/lib/social-links.ts socialLinksOf) is drawn in three
// places: the footer's round icon buttons on every page, a row of the same
// icons at the foot of the open mobile menu, and the "Follow along" group on
// the Contact page's office door. Each place must carry Facebook, Instagram,
// YouTube, Threads and Linktree (YouTube derived from Site settings' youtubeUrl, the field that
// drives Watch live), each link with an accessible name that says what it is.
//
// The addresses are matched by host, not typed out in full, so a changed
// handle in Site settings does not fail the suite; the order is asserted
// because it is part of the derivation (Facebook, Instagram, YouTube,
// Threads, Linktree).
// =============================================================================

const PLATFORMS = [
  { name: 'Facebook', host: /^https:\/\/(www\.)?facebook\.com\// },
  { name: 'Instagram', host: /^https:\/\/(www\.)?instagram\.com\// },
  { name: 'YouTube', host: /^https:\/\/(www\.)?youtube\.com\// },
  // Added 2026-09-25 (scripts/set-social-links.mjs), from the church's Wix site.
  { name: 'Threads', host: /^https:\/\/(www\.)?threads\.(net|com)\// },
  { name: 'Linktree', host: /^https:\/\/linktr\.ee\// },
];

/** The church's links in `scope`, in order, each named and pointing off-site. */
async function expectAccounts(scope: Locator, name: (platform: string) => RegExp) {
  const links = scope.getByRole('link');
  await expect(links).toHaveCount(PLATFORMS.length);
  for (const [i, p] of PLATFORMS.entries()) {
    const link = links.nth(i);
    await expect(link).toHaveAccessibleName(name(p.name));
    expect(await link.getAttribute('href')).toMatch(p.host);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    // 44px targets (the WCAG 2.5.5 size this site holds its chrome to).
    const box = await link.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
}

/** Icon-only links say whose account they are. */
const churchOn = (platform: string) => new RegExp(`^First Baptist Church Muncie on ${platform}$`);

test('the footer carries every account, each named', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const footer = page.locator('footer');
  const row = footer
    .locator('ul')
    .filter({ has: page.getByRole('link', { name: churchOn('Facebook') }) });
  await row.scrollIntoViewIfNeeded();
  await expectAccounts(row, churchOn);
});

async function openMenu(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-menu-ready]').waitFor({ state: 'attached' });
  await page.getByRole('button', { name: /^menu$/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await settle(page);
}

test('the open mobile menu carries the same accounts, in a named list', async ({ page }) => {
  await openMenu(page);
  const row = page.getByRole('dialog').getByRole('list', { name: 'Follow along' });
  await row.scrollIntoViewIfNeeded();
  await expectAccounts(row, churchOn);
});

test('the open mobile menu, social row included, has no axe violations', async ({ page }) => {
  await openMenu(page);
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(
    results.violations,
    results.violations
      .map(
        (v) =>
          `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
      )
      .join('\n'),
  ).toEqual([]);
});

test('/contact has a "Follow along" group with each name printed beside its icon', async ({
  page,
}) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 3, name: 'Follow along' });
  await expect(heading).toHaveCount(1);
  const group = page.locator('.hd-group').filter({ has: heading });
  await group.scrollIntoViewIfNeeded();
  // Visible names: the accessible name IS the printed word.
  await expectAccounts(group, (p) => new RegExp(`^${p}$`));
  for (const p of PLATFORMS) await expect(group.getByText(p.name, { exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).include('.hours-door').analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('no other page draws a "Follow along" group', async ({ page }) => {
  await page.goto('/visit', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Follow along' })).toHaveCount(0);
});
