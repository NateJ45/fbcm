// scaffold-file: journal
import { test, expect, type APIRequestContext, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';
import { findPost } from './content-helpers';

// =============================================================================
// A sermon preview's passage and the post tools (2026-09-24, feat/scripture-text)
// =============================================================================
// The reading opens into its own text (a <details>, BSB unless the build had an
// NIV key), printed open on paper; Read aloud shows only where the browser can
// speak; Share falls back to copying the link; Add to calendar is a static
// .ics at the Sunday's service time in the church's zone.
//
// CONTENT INDEPENDENCE (2026-10-05). The post under test was one named sermon
// preview (/post/a-light-wardrobe/), and the calendar test fixed the clock to
// that post's own Sunday. The church can rewrite or retire any post, so each test
// now takes the NEWEST sermon preview that has what it needs (a passage, the
// tools, a service Sunday), found from the build (tests/content-helpers.ts), and
// takes the clock from that post's own data-until date. With no such post it
// skips with a reason. That "A Light Wardrobe" is still published is watched in
// tests/content-watch.spec.ts (@content). A build with no Sanity project has no
// posts, and every test here skips.
// NOT PORTABLE: the post and its classes are this site's.
// =============================================================================

/** The newest sermon preview whose HTML satisfies `wants`; skips the test when none does. */
async function open(
  page: Page,
  request: APIRequestContext,
  wants: (html: string) => boolean = () => true,
) {
  const post = await findPost(
    request,
    (html) => html.includes('<div class="p2-tools"') && wants(html),
  );
  test.skip(!post, 'no recent sermon preview has what this test needs (no posts in this build?)');
  await page.goto(post!.path, { waitUntil: 'domcontentloaded' });
  return post!;
}

// The markup, not the class name: the post's inlined stylesheet names every class.
const hasPassage = (html: string) => html.includes('<details class="pp-passage"');

test('the reading opens into the passage, with verse numbers and the credit', async ({
  page,
  request,
}) => {
  await open(page, request, hasPassage);
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

test('on paper the passage prints open, without its "Read" line', async ({ page, request }) => {
  await open(page, request, hasPassage);
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

test('Share copies the link when there is no share sheet', async ({ page, request }) => {
  await page.addInitScript(() => {
    // No Web Share API, and a clipboard that records what it was given.
    Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
    const w = window as unknown as { __copied?: string };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (t: string) => void (w.__copied = t) },
    });
  });
  const post = await open(page, request);
  const share = page.locator('[data-share]');
  await expect(share).toBeVisible();
  await share.click();
  await expect(page.locator('.p2-tool-status')).toHaveText('Link copied');
  const copied = await page.evaluate(() => (window as unknown as { __copied?: string }).__copied);
  expect(decodeURI(copied ?? '')).toContain(decodeURI(post.path).replace(/\/$/, ''));
});

test('Read aloud is absent when the browser cannot speak', async ({ page, request }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
  });
  await open(page, request);
  // Share is shown by the same script, so the script has run by then.
  await expect(page.locator('[data-share]')).toBeVisible();
  await expect(page.locator('[data-listen]')).toBeHidden();
  await expect(page.locator('[data-listen-stop]')).toBeHidden();
});

test('Read aloud is a 44px toggle button where the browser can speak', async ({
  page,
  request,
}) => {
  await open(page, request);
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
  // The test's clock comes from the post's OWN Sunday (its data-until), so the
  // link is on offer before it and hidden after it, whichever post this is.
  const post = await findPost(request, (html) => /data-until="\d{4}-\d{2}-\d{2}"/.test(html));
  test.skip(!post, 'no recent sermon preview has a readable service Sunday');
  const sundayDate = post!.html.match(/data-until="(\d{4}-\d{2}-\d{2})"/)![1];
  const day = 24 * 60 * 60 * 1000;
  const sundayNoon = Date.parse(`${sundayDate}T15:00:00Z`);
  // Five days before the Sunday: the link shows.
  await page.clock.setFixedTime(new Date(sundayNoon - 5 * day));
  await page.goto(post!.path, { waitUntil: 'domcontentloaded' });
  const link = page.locator('.p2-tools a[data-until]');
  await expect(link).toBeVisible();
  const sunday = (await link.getAttribute('data-until')) ?? '';
  expect(sunday).toBe(sundayDate);
  // The same Sunday the order prints.
  await expect(page.locator(`.p2-facts time[datetime="${sunday}"]`)).toHaveCount(1);

  const href = (await link.getAttribute('href')) ?? '';
  expect(href).toBe(`${post!.path.replace(/\/?$/, '/')}sunday.ics`);
  const res = await request.get(href);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/calendar');
  const ics = (await res.text()).replace(/\r\n /g, '');
  const compact = sunday.replace(/-/g, '');
  expect(ics).toMatch(
    new RegExp(`\\r\\nDTSTART;TZID=America/Indiana/Indianapolis:${compact}T\\d{4}00\\r\\n`),
  );
  expect(ics).toContain('\r\nBEGIN:VTIMEZONE\r\nTZID:America/Indiana/Indianapolis\r\n');
  expect(ics).toContain('SUMMARY:Sunday worship at First Baptist Church Muncie');

  // Two days after that Sunday, the link is not offered.
  await page.clock.setFixedTime(new Date(sundayNoon + 2 * day));
  await page.reload();
  await expect(page.locator('[data-share]')).toBeVisible();
  await expect(link).toBeHidden();
});

test('a post with its passage open has no axe violations', async ({ page, request }) => {
  await open(page, request, hasPassage);
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
