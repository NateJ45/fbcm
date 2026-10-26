import { test, expect } from './fixtures';

// =============================================================================
// The builder kit in a real browser (starter PORTS.md card 173)
// =============================================================================
// /styleguide/sections/ draws one of every builder-kit block with fixed data
// (dated ones relative to the build day). These drive what node --test cannot:
// the tabs' keyboard pattern, the event's calendar file, its default place (the
// church, from Site settings) and structured data, the countdown's browser
// recount, the dated notice, and no sideways scroll on a small phone.
// The pure logic is pinned in src/lib/builder-blocks.test.ts.
// =============================================================================

const box = (type: string) => `[data-section-type="${type}"]`;

const BUILDER_TYPES = [
  'columnsSection',
  'buttonRowSection',
  'photoSection',
  'tabsSection',
  'countdownSection',
  'noticeSection',
  'eventDetailsSection',
  'scheduleSection',
];

test.describe('Builder kit blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/styleguide/sections/', { waitUntil: 'domcontentloaded' });
  });

  test('every builder block draws on the wall', async ({ page }) => {
    for (const type of BUILDER_TYPES) {
      await expect(page.locator(`${box(type)} [data-builder-block="${type}"]`)).toHaveCount(1);
    }
  });

  test('tabs become a tab list that the arrow keys move through', async ({ page }) => {
    const tabs = page.locator(`${box('tabsSection')} [role="tab"]`);
    await expect(tabs).toHaveCount(3);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    const panels = page.locator(`${box('tabsSection')} [role="tabpanel"]`);
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(panels.nth(1)).toBeVisible();
    await page.keyboard.press('End');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  });

  test('event details: at the church by default, with a calendar file, directions and Event data', async ({
    page,
  }) => {
    const event = page.locator(box('eventDetailsSection'));
    // No place typed: the church's address from Site settings.
    await expect(event.locator('.bb-event__place')).toContainText('309 East Adams Street');
    const cal = event.getByRole('link', { name: 'Add to my calendar' });
    const href = (await cal.getAttribute('href')) ?? '';
    expect(href.startsWith('data:text/calendar;charset=utf-8,')).toBe(true);
    const ics = decodeURIComponent(href.slice(href.indexOf(',') + 1));
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(1);
    expect(ics).toContain('DTSTART;TZID=America/Indiana/Indianapolis:');
    expect(ics).toContain('309 East Adams Street');
    await expect(cal).toHaveAttribute('download', 'thanksgiving-dinner.ics');
    await expect(event.getByRole('link', { name: /Directions/ })).toHaveAttribute(
      'href',
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=First%20Baptist/,
    );
    const ld = JSON.parse(
      (await event.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    );
    expect(ld['@graph']).toHaveLength(1);
    expect(ld['@graph'][0]['@type']).toBe('Event');
    expect(ld['@graph'][0].location.name).toBe('First Baptist Church Muncie');
  });

  test('the countdown shows days to go, and the dated notice shows', async ({ page }) => {
    const count = page.locator(`${box('countdownSection')} [data-days]`);
    await expect(count).toBeVisible();
    expect(Number(await count.textContent())).toBeGreaterThan(0);
    const notice = page.locator(`${box('noticeSection')} aside`);
    await expect(notice).toBeVisible();
    await expect(notice.getByRole('link', { name: '(765) 555-0100' })).toHaveAttribute(
      'href',
      'tel:+17655550100',
    );
  });
});

test.describe('Builder kit blocks on a small phone', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('no block pushes the page sideways at 320px', async ({ page }) => {
    await page.goto('/styleguide/sections/', { waitUntil: 'domcontentloaded' });
    const wide = await page.evaluate((types) => {
      const out: string[] = [];
      for (const type of types) {
        const el = document.querySelector(`[data-section-type="${type}"]`);
        if (!el) continue;
        for (const node of el.querySelectorAll('*')) {
          const r = node.getBoundingClientRect();
          if (r.width > 0 && r.right > window.innerWidth + 0.5)
            out.push(`${type}: ${node.tagName}`);
        }
      }
      return out;
    }, BUILDER_TYPES);
    expect(wide).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  });
});
