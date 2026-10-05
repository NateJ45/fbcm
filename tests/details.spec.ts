// The craft-details pass (2026-09-24): the share cards, the JSON-LD and the
// Visit page's "Which door?" sketch. Site-specific, so not PORTABLE.
import { test, expect, type APIRequestContext, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';
import { findPost } from './content-helpers';

// Content independence (2026-10-05, tests-and-gates.md): the post under test is
// the church's newest sermon preview, found from the build, not a post named by
// its slug (the secretary can retire any one). The non-ASCII slug the Wix
// migration was proven with is watched in tests/content-watch.spec.ts. The
// "Which door?" block holds for however many doors the church lists, and the
// FAQPage must match the questions the page shows, whichever they are.

const SITE = 'https://www.fbcmuncie.org';

/** The page's og:image, as a local path, after checking the meta that goes with it. */
async function ogImagePath(page: Page): Promise<string> {
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og, 'og:image').toBeTruthy();
  expect(og?.startsWith(`${SITE}/og/`), `a share card, not a fallback: ${og}`).toBe(true);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /\S/);
  const tw = await page.locator('meta[name="twitter:image"]').getAttribute('content');
  expect(tw).toBe(og);
  return new URL(og as string).pathname;
}

async function expectCardServed(page: Page, request: APIRequestContext, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  const path = await ogImagePath(page);
  const res = await request.get(path);
  expect(res.status(), `${path}`).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  const body = await res.body();
  // PNG signature, then the IHDR width and height: 1200 x 630.
  expect(body.subarray(1, 4).toString()).toBe('PNG');
  expect(body.readUInt32BE(16)).toBe(1200);
  expect(body.readUInt32BE(20)).toBe(630);
  expect(body.length).toBeLessThan(120 * 1024);
}

test.describe('Share cards', () => {
  for (const route of ['/', '/visit/']) {
    test(`${route} shares its own card, and the card is served`, async ({ page, request }) => {
      await expectCardServed(page, request, route);
    });
  }

  test('a post shares its own card, and the card is served', async ({ page, request }) => {
    const post = await findPost(request);
    test.skip(!post, 'no sermon-preview post is published right now');
    await expectCardServed(page, request, post!.path);
  });
});

test.describe('Structured data', () => {
  async function blocks(page: Page): Promise<Array<Record<string, unknown>>> {
    const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
    return raw.map((r) => JSON.parse(r));
  }
  const typeOf = (b: Record<string, unknown>) => [b['@type']].flat().join('+');

  test('/visit carries the church, its breadcrumb and the weekly service once each, and a FAQPage that matches the questions shown', async ({
    page,
  }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    const all = await blocks(page);
    const types = all.map(typeOf).sort();
    // FAQPage is the page's own question band (src/lib/faq-schema.ts), so it is
    // there only while the church keeps one: tests/content-watch.spec.ts reports
    // when it goes. Everything else is code, once each.
    expect(types.filter((t) => t !== 'FAQPage')).toEqual([
      'BreadcrumbList',
      'Church+Organization',
      'Event',
    ]);
    expect(types.filter((t) => t === 'FAQPage').length).toBeLessThanOrEqual(1);
    const event = all.find((b) => b['@type'] === 'Event') as Record<string, unknown>;
    expect((event.eventSchedule as Record<string, unknown>).repeatFrequency).toBe('P1W');
    // One Question per question the band shows, in the same order.
    const faq = all.find((b) => b['@type'] === 'FAQPage') as Record<string, unknown> | undefined;
    if (faq) {
      const names = (faq.mainEntity as Array<{ name: string }>).map((q) => q.name);
      const shown = (await page.locator('details summary').allTextContents()).map((t) =>
        t.replace(/\s+/g, ' ').trim(),
      );
      expect(names.length).toBeGreaterThan(0);
      expect(shown).toEqual(expect.arrayContaining(names));
    } else {
      // No FAQPage means no question band: nothing on the page may claim to be one.
      expect(await page.locator('details summary').count()).toBe(0);
    }
  });

  test('a post carries a BlogPosting whose first image is its share card', async ({
    page,
    request,
  }) => {
    const post = await findPost(request);
    test.skip(!post, 'no sermon-preview post is published right now');
    await page.goto(post!.path, { waitUntil: 'domcontentloaded' });
    const all = await blocks(page);
    expect(all.map(typeOf).sort()).toEqual([
      'BlogPosting',
      'BreadcrumbList',
      'Church+Organization',
    ]);
    const blogPosting = all.find((b) => b['@type'] === 'BlogPosting') as Record<string, unknown>;
    const first = (blogPosting.image as string[])[0] ?? '';
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(first).toBe(og);
  });
});

test.describe('Which door? (Visit)', () => {
  const band = (page: Page) => page.locator('section:has([data-door-plan])');

  test('the door list has no axe violations, and every door name links to its pin', async ({
    page,
  }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    const links = band(page).locator('[data-door-link]');
    const n = await links.count();
    test.skip(n === 0, 'no doors band on /visit right now (the @content watch reports it)');
    await settle(page);
    const results = await new AxeBuilder({ page })
      .include('section:has([data-door-plan])')
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

    for (const link of await links.all()) {
      const href = (await link.getAttribute('href')) ?? '';
      expect(href).toMatch(/^#.+-pin-\d+$/);
      await expect(page.locator(href)).toHaveCount(1);
    }
    // One image to assistive technology, with a description naming every door
    // the church lists (whatever it calls them).
    const svg = band(page).locator('svg[role="img"]');
    await expect(svg).toHaveAccessibleName(/street side/);
    const names = (await band(page).locator('[data-door-name]').allTextContents()).map((t) =>
      t.trim(),
    );
    expect(names.length).toBe(n);
    for (const name of names) {
      await expect(svg, name).toHaveAccessibleDescription(new RegExp(escapeRe(name)));
    }
  });

  test('choosing a door by keyboard lights its pin and shows its words', async ({ page }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    const links = band(page).locator('[data-door-link]');
    const n = await links.count();
    test.skip(n === 0, 'no doors band on /visit right now (the @content watch reports it)');
    // The last door: the furthest from the default, so the change is visible.
    const last = links.nth(n - 1);
    const pinNumber = ((await last.getAttribute('href')) ?? '').match(/-pin-(\d+)$/)![1];
    const name = (await band(page)
      .locator('[data-door-name]')
      .nth(n - 1)
      .textContent())!.trim();
    await last.focus();
    const pin = band(page).locator(`[data-pin="${pinNumber}"]`);
    await expect(pin).toHaveClass(/is-on/);
    await expect(band(page).locator('[data-dp-say]')).toContainText(name);
    await expect(last).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Enter');
    await expect(pin).toHaveClass(/is-on/);
  });
});

test.describe('Which door? without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the list is complete and a door link targets its pin', async ({ page }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    const section = page.locator('section:has([data-door-plan])');
    const links = section.locator('[data-door-link]');
    const n = await links.count();
    test.skip(n === 0, 'no doors band on /visit right now (the @content watch reports it)');
    // One list row per door link: with no SVG the list is the whole of the content.
    await expect(section.locator('.sd-doors > li')).toHaveCount(n);
    const first = links.first();
    const pin = ((await first.getAttribute('href')) ?? '').match(/-pin-(\d+)$/)![1];
    await first.click();
    expect(new URL(page.url()).hash).toMatch(new RegExp(`-pin-${pin}$`));
  });
});

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
