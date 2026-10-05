import { test, expect, type Locator, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// The church's accounts elsewhere (2026-09-24, feat/social-links)
// =============================================================================
// One derived list (src/lib/social-links.ts socialLinksOf) is drawn in three
// places: the footer's round icon buttons on every page, a row of the same
// icons at the foot of the open mobile menu, and the "Follow along" group on
// the Contact page's office door. Each place must carry the same accounts, in
// the same order, each link with an accessible name that says what it is.
//
// CONTENT INDEPENDENCE (2026-10-05). The accounts are Site settings' to change
// (the church added Threads and Linktree on 2026-09-25 and could add, drop or
// re-handle any), so this no longer says there are exactly five. It holds for
// whatever the list is: at least one, every link external and named for its
// platform, the platforms the code knows keep their canonical order (Facebook,
// Instagram, YouTube, Threads, Linktree), and all three places agree. The exact
// five, in that order, are watched in tests/content-watch.spec.ts (@content).
// The addresses are matched by host, so a changed handle does not matter.
// =============================================================================

const PLATFORMS = [
  { name: 'Facebook', host: /^https:\/\/(www\.)?facebook\.com\// },
  { name: 'Instagram', host: /^https:\/\/(www\.)?instagram\.com\// },
  { name: 'YouTube', host: /^https:\/\/(www\.)?youtube\.com\// },
  { name: 'Threads', host: /^https:\/\/(www\.)?threads\.(net|com)\// },
  { name: 'Linktree', host: /^https:\/\/linktr\.ee\// },
];

/**
 * The church's links in `scope`: at least one, each named, external and a 44px
 * target, the known platforms in canonical order. Returns the hrefs in order.
 */
async function expectAccounts(scope: Locator, name: (platform: string) => RegExp) {
  const links = scope.getByRole('link');
  const n = await links.count();
  expect(n, 'the church lists at least one account').toBeGreaterThan(0);
  const hrefs: string[] = [];
  const order: number[] = [];
  for (let i = 0; i < n; i++) {
    const link = links.nth(i);
    const href = (await link.getAttribute('href')) ?? '';
    hrefs.push(href);
    expect(href).toMatch(/^https:\/\//);
    const known = PLATFORMS.findIndex((p) => p.host.test(href));
    if (known >= 0) {
      // A platform the code knows says so in its name.
      await expect(link).toHaveAccessibleName(name(PLATFORMS[known].name));
      order.push(known);
    } else {
      await expect(link).toHaveAccessibleName(/\S/);
    }
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    // 44px targets (the WCAG 2.5.5 size this site holds its chrome to).
    const box = await link.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  expect(order, 'known platforms in their canonical order').toEqual(
    [...order].sort((a, b) => a - b),
  );
  return hrefs;
}

/** Icon-only links say whose account they are. */
const churchOn = (platform: string) => new RegExp(`^First Baptist Church Muncie on ${platform}$`);

/** The footer's row: the list holding the church's account links (none when there are none). */
function footerRow(page: Page): Locator {
  return page
    .locator('footer ul')
    .filter({ has: page.getByRole('link', { name: /^First Baptist Church Muncie on / }) })
    .first();
}

/** The footer's hrefs, for the other two places to agree with. */
async function footerHrefs(page: Page): Promise<string[]> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const row = footerRow(page);
  test.skip(
    (await row.count()) === 0,
    'Site settings lists no accounts right now (the @content watch reports it)',
  );
  await row.scrollIntoViewIfNeeded();
  return expectAccounts(row, churchOn);
}

test('the footer carries every account, each named', async ({ page }) => {
  await footerHrefs(page);
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
  const expected = await footerHrefs(page);
  await openMenu(page);
  const row = page.getByRole('dialog').getByRole('list', { name: 'Follow along' });
  await row.scrollIntoViewIfNeeded();
  expect(await expectAccounts(row, churchOn)).toEqual(expected);
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
  const expected = await footerHrefs(page);
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { level: 3, name: 'Follow along' });
  await expect(heading).toHaveCount(1);
  const group = page.locator('.hd-group').filter({ has: heading });
  await group.scrollIntoViewIfNeeded();
  // Visible names: the accessible name IS the printed word.
  const hrefs = await expectAccounts(group, (p) => new RegExp(`^${p}$`));
  expect(hrefs).toEqual(expected);
  for (const p of PLATFORMS) {
    if (hrefs.some((h) => p.host.test(h))) {
      await expect(group.getByText(p.name, { exact: true })).toBeVisible();
    }
  }

  const results = await new AxeBuilder({ page }).include('.hours-door').analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('no other page draws a "Follow along" group', async ({ page }) => {
  await page.goto('/visit', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Follow along' })).toHaveCount(0);
});
