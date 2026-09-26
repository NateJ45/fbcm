// The craft-details pass (2026-09-24): the share cards, the JSON-LD and the
// Visit page's "Which door?" sketch. Site-specific, so not PORTABLE.
import { test, expect, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

const SITE = 'https://www.fbcmuncie.org';
const ACCENT_POST = '/post/händel-s-messiah-sing-in-carols/';

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

test.describe('Share cards', () => {
  for (const route of ['/', '/visit/', ACCENT_POST]) {
    test(`${route} shares its own card, and the card is served`, async ({ page, request }) => {
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
    });
  }
});

test.describe('Structured data', () => {
  async function blocks(page: Page): Promise<Array<Record<string, unknown>>> {
    const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
    return raw.map((r) => JSON.parse(r));
  }
  const typeOf = (b: Record<string, unknown>) => [b['@type']].flat().join('+');

  test('/visit carries the church, its breadcrumb, the weekly service and its FAQ, once each', async ({
    page,
  }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    const types = (await blocks(page)).map(typeOf).sort();
    expect(types).toEqual(['BreadcrumbList', 'Church+Organization', 'Event', 'FAQPage']);
    const event = (await blocks(page)).find((b) => b['@type'] === 'Event') as Record<
      string,
      unknown
    >;
    expect((event.eventSchedule as Record<string, unknown>).repeatFrequency).toBe('P1W');
    // The FAQPage is the page's own question band (src/lib/faq-schema.ts): one
    // Question per question the band shows, in the same order.
    const faq = (await blocks(page)).find((b) => b['@type'] === 'FAQPage') as Record<
      string,
      unknown
    >;
    const names = (faq.mainEntity as Array<{ name: string }>).map((q) => q.name);
    const shown = (await page.locator('details summary').allTextContents()).map((t) =>
      t.replace(/\s+/g, ' ').trim(),
    );
    expect(names.length).toBeGreaterThan(0);
    expect(shown).toEqual(expect.arrayContaining(names));
  });

  test('a post carries a BlogPosting whose first image is its share card', async ({ page }) => {
    await page.goto(ACCENT_POST, { waitUntil: 'domcontentloaded' });
    const all = await blocks(page);
    expect(all.map(typeOf).sort()).toEqual([
      'BlogPosting',
      'BreadcrumbList',
      'Church+Organization',
    ]);
    const post = all.find((b) => b['@type'] === 'BlogPosting') as Record<string, unknown>;
    const first = (post.image as string[])[0] ?? '';
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
    await settle(page);
    const results = await new AxeBuilder({ page })
      .include('section:has([data-door-plan])')
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

    const links = band(page).locator('[data-door-link]');
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      const href = (await link.getAttribute('href')) ?? '';
      expect(href).toMatch(/^#.+-pin-\d$/);
      await expect(page.locator(href)).toHaveCount(1);
    }
    // One image to assistive technology, with a description naming the doors.
    const svg = band(page).locator('svg[role="img"]');
    await expect(svg).toHaveAccessibleName(/street side/);
    await expect(svg).toHaveAccessibleDescription(/Adams Street circular drive/);
  });

  test('choosing a door by keyboard lights its pin and shows its words', async ({ page }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    const links = band(page).locator('[data-door-link]');
    await links.nth(2).focus();
    const pin = band(page).locator('[data-pin="3"]');
    await expect(pin).toHaveClass(/is-on/);
    await expect(band(page).locator('[data-dp-say]')).toContainText('Jefferson Street side doors');
    await expect(links.nth(2)).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Enter');
    await expect(pin).toHaveClass(/is-on/);
  });
});

test.describe('Which door? without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the list is complete and a door link targets its pin', async ({ page }) => {
    await page.goto('/visit/', { waitUntil: 'domcontentloaded' });
    const section = page.locator('section:has([data-door-plan])');
    await expect(section.locator('.sd-doors > li')).toHaveCount(3);
    await expect(section.locator('.sd-doors')).toContainText(
      'main hallway near the church offices',
    );
    const link = section.locator('[data-door-link]').first();
    await link.click();
    expect(new URL(page.url()).hash).toMatch(/-pin-1$/);
  });
});
