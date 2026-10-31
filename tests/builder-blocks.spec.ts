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
  'contactCardSection',
  'progressSection',
  'calendarSubscribeSection',
  'iconCardsSection',
  'stepsRailSection',
  'hubSection',
];

test.describe('Builder kit blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/styleguide/sections/', { waitUntil: 'domcontentloaded' });
  });

  test('every builder block draws on the wall', async ({ page }) => {
    for (const type of BUILDER_TYPES) {
      // The contact card has two fixtures: its own words, and the church facts (card 198).
      const n = type === 'contactCardSection' ? 2 : 1;
      await expect(page.locator(`${box(type)} [data-builder-block="${type}"]`)).toHaveCount(n);
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
  // ── Starter card 193 (2026-10-27) ─────────────────────────────────────────

  test('contact card: big Call and Email buttons, details and directions', async ({ page }) => {
    const card = page.locator(box('contactCardSection')).first();
    const buttons = card.locator('[data-call-buttons] a');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.first()).toHaveAttribute('href', 'tel:5555550100');
    await expect(buttons.nth(1)).toHaveAttribute('href', 'mailto:youth@example.org');
    expect((await buttons.first().boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await expect(card.getByRole('link', { name: /Get directions/ })).toHaveAttribute(
      'href',
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/,
    );
    await expect(card.getByText('Wednesdays: 6 pm to 8 pm')).toBeVisible();
  });

  test('contact card with nothing typed fills from the church facts (card 198)', async ({
    page,
  }) => {
    const card = page.locator(box('contactCardSection')).nth(1);
    await expect(card.getByRole('link', { name: '(555) 555-0142' })).toHaveAttribute(
      'href',
      'tel:+15555550142',
    );
    await expect(card.getByRole('link', { name: 'office@example.org' })).toBeVisible();
    await expect(card.getByText('123 Example Street')).toBeVisible();
    await expect(card.getByText('Springfield, IN 47300')).toBeVisible();
    await expect(
      card.getByText('Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm'),
    ).toBeVisible();
    // No "open now" status: this site has no structured hours (church-facts.ts).
    await expect(card.locator('[data-biz-status], [data-to-confirm]')).toHaveCount(0);
  });

  test('progress: one progressbar with a spoken value and twenty steps', async ({ page }) => {
    const bar = page.locator(`${box('progressSection')} [role="progressbar"]`);
    await expect(bar).toHaveAttribute('aria-valuenow', '65');
    await expect(bar).toHaveAttribute('aria-valuetext', '$32,500 of $50,000, 65 percent');
    await expect(bar.locator('.bb-progress__step')).toHaveCount(20);
  });

  test('calendar buttons subscribe to the typed feed and open safely', async ({ page }) => {
    const subscribe = page.locator(`${box('calendarSubscribeSection')} [data-bb-subscribe] a`);
    await expect(subscribe).toHaveCount(3);
    await expect(subscribe.nth(1)).toHaveAttribute(
      'href',
      'webcal://example.org/calendar/events.ics',
    );
    await expect(subscribe.first()).toHaveAttribute('rel', /noopener/);
  });

  test('icon cards and the steps rail: icons, numbered steps, one list each', async ({ page }) => {
    const cards = page.locator(`${box('iconCardsSection')} .bb-icard`);
    await expect(cards).toHaveCount(3);
    await expect(cards.first().locator('svg.bb-icon')).toHaveCount(1);
    const steps = page.locator(`${box('stepsRailSection')} ol > li`);
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(2).locator('.bb-rail__n')).toHaveText('Step 3');
  });

  test('hub: the index jumps to a group and follows the scroll', async ({ page }) => {
    const hub = page.locator(box('hubSection'));
    const jumps = hub.locator('[data-hub-jump]');
    await expect(jumps).toHaveCount(3);
    const target = (await jumps.nth(2).getAttribute('href')) ?? '';
    await jumps.nth(2).click();
    await expect(page.locator(target)).toBeInViewport();
    await expect(jumps.nth(2)).toHaveAttribute('aria-current', 'true');
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
          // The hub's phone index is a row of chips that scrolls sideways inside
          // its own box (overflow-x: auto); the box itself is checked.
          if (node.closest('.bb-hub__index ol')) continue;
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
