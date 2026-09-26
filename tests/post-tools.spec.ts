// scaffold-file: journal
import { test, expect, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// A sermon preview's passage and the post tools (2026-09-24, feat/scripture-text)
// =============================================================================
// The reading opens into its own text (a <details>, BSB unless the build had an
// NIV key), printed open on paper; Read aloud shows only where the browser can
// speak; Share falls back to copying the link; Add to calendar is a static
// .ics at the Sunday's service time in the church's zone.
//
// The post is the same sermon preview print.spec.ts uses. A build with no
// Sanity project has no posts, and every test here skips.
// NOT PORTABLE: the post and its classes are this site's.
// =============================================================================

const POST = '/post/a-light-wardrobe/';

async function open(page: Page) {
  const res = await page.goto(POST, { waitUntil: 'domcontentloaded' });
  test.skip(res?.status() === 404, 'no posts in this build');
}

test('the reading opens into the passage, with verse numbers and the credit', async ({ page }) => {
  await open(page);
  const passage = page.locator('.pp-lection details.pp-passage').first();
  test.skip((await passage.count()) === 0, 'no passage text in this build (offline fetch)');
  const text = passage.locator('.pp-passage-t');
  await expect(text).toBeHidden();

  const summary = passage.locator('summary');
  await expect(summary).toHaveText(/^Read .+\d+:\d+/);
  await summary.click();
  await expect(passage).toHaveAttribute('open', '');
  await expect(text).toBeVisible();
  // Verse numbers are superscripts, with real verse text after them.
  expect(await text.locator('sup.pp-v').count()).toBeGreaterThan(0);
  expect(((await text.locator('p').first().textContent()) ?? '').length).toBeGreaterThan(80);
  // The credit names the translation.
  await expect(text.locator('.pp-passage-c')).toHaveText(
    /Berean Standard Bible, public domain|New International Version/,
  );
  // Keyboard: Enter on the summary closes it again.
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(text).toBeHidden();
});

test('on paper the passage prints open, without its "Read" line', async ({ page }) => {
  await open(page);
  const passage = page.locator('details.pp-passage').first();
  test.skip((await passage.count()) === 0, 'no passage text in this build');
  await page.emulateMedia({ media: 'print' });
  // No script opened it (emulateMedia fires no beforeprint): the CSS does.
  await expect(passage).not.toHaveAttribute('open', '');
  await expect(passage.locator('.pp-passage-t p').first()).toBeVisible();
  await expect(passage.locator('.pp-passage-c')).toBeVisible();
  await expect(passage.locator('summary')).toBeHidden();
  await expect(page.locator('.p2-tools')).toBeHidden();
});

test('Share copies the link when there is no share sheet', async ({ page }) => {
  await page.addInitScript(() => {
    // No Web Share API, and a clipboard that records what it was given.
    Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
    const w = window as unknown as { __copied?: string };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (t: string) => void (w.__copied = t) },
    });
  });
  await open(page);
  const share = page.locator('[data-share]');
  await expect(share).toBeVisible();
  await share.click();
  await expect(page.locator('.p2-tool-status')).toHaveText('Link copied');
  const copied = await page.evaluate(() => (window as unknown as { __copied?: string }).__copied);
  expect(copied).toContain('/post/a-light-wardrobe');
});

test('Read aloud is absent when the browser cannot speak', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
  });
  await open(page);
  // Share is shown by the same script, so the script has run by then.
  await expect(page.locator('[data-share]')).toBeVisible();
  await expect(page.locator('[data-listen]')).toBeHidden();
  await expect(page.locator('[data-listen-stop]')).toBeHidden();
});

test('Read aloud is a 44px toggle button where the browser can speak', async ({ page }) => {
  await open(page);
  test.skip(
    !(await page.evaluate(() => typeof window.speechSynthesis?.speak === 'function')),
    'this browser has no speech synthesis',
  );
  const listen = page.locator('[data-listen]');
  await expect(listen).toBeVisible();
  await expect(listen).toHaveAttribute('aria-pressed', 'false');
  expect((await listen.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test('Add to calendar is the Sunday at the service time, in the church zone', async ({
  page,
  request,
}) => {
  // A week before this preview's Sunday: the link hides itself once it has passed.
  await page.clock.setFixedTime(new Date('2025-11-25T15:00:00Z'));
  await open(page);
  const link = page.locator('.p2-tools a[data-until]');
  test.skip((await link.count()) === 0, 'no readable service time in this build');
  await expect(link).toBeVisible();
  const sunday = (await link.getAttribute('data-until')) ?? '';
  expect(sunday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  // The same Sunday the order prints.
  await expect(page.locator(`.p2-facts time[datetime="${sunday}"]`)).toHaveCount(1);

  const href = (await link.getAttribute('href')) ?? '';
  expect(href).toBe('/post/a-light-wardrobe/sunday.ics');
  const res = await request.get(href);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/calendar');
  const ics = (await res.text()).replace(/\r\n /g, '');
  const day = sunday.replace(/-/g, '');
  expect(ics).toMatch(
    new RegExp(`\\r\\nDTSTART;TZID=America/Indiana/Indianapolis:${day}T\\d{4}00\\r\\n`),
  );
  expect(ics).toContain('\r\nBEGIN:VTIMEZONE\r\nTZID:America/Indiana/Indianapolis\r\n');
  expect(ics).toContain('SUMMARY:Sunday worship at First Baptist Church Muncie');

  // After that Sunday, the link is not offered.
  await page.clock.setFixedTime(new Date('2025-12-02T15:00:00Z'));
  await page.reload();
  await expect(page.locator('[data-share]')).toBeVisible();
  await expect(link).toBeHidden();
});

test('a post with its passage open has no axe violations', async ({ page }) => {
  await open(page);
  await settle(page);
  for (const d of await page.locator('details.pp-passage').all()) {
    await d.locator('summary').click();
  }
  const results = await new AxeBuilder({ page }).analyze();
  const report = results.violations
    .map((v) => `  [${v.impact}] ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
    .join('\n');
  expect(results.violations, `axe violations:\n${report}`).toEqual([]);
});
