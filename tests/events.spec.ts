import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// What's On (2026-09-25, feat/whats-on)
// =============================================================================
// The suite's build sets CHURCH_CALENDAR_FIXTURE=1 and CHURCH_CALENDAR_NOW to
// Friday 2026-09-25 (playwright.config.ts), so /events is drawn from
// tests/fixtures/churchtrac.ics, the church's real Church Trac feed of that
// day with names taken out. The reading itself is unit tested
// (src/lib/church-calendar.test.ts); this proves the page.
// =============================================================================

const PAGE = '/events';

test('coming up by month, then the weekly gatherings', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("What's On");
  await expect(page.locator('.month-h')).toHaveText(['October', 'November', 'December']);
  await expect(page.locator('.ev-title')).toHaveText([
    'Membership Class - Week 1',
    'Sam Pace Recital',
    'Amahl and the Night Visitors (BSU Opera)',
    'Messiah Sing-In',
  ]);
  // Past events (the summer's Worship, Club Nights) are not on the page.
  await expect(page.getByText('City Life Club Night')).toHaveCount(0);
  // The Church Trac times are Muncie's clock, though the feed names Halifax.
  await expect(page.locator('#membership-class-week-1-2026-10-04 .ev-when')).toContainText(
    '9:30 to 10:15 am',
  );
  await expect(page.locator('.wk-title')).toHaveText([
    'Sunday School',
    'Breakfast Fellowship',
    'Praise Team Practice',
  ]);
  await expect(page.locator('.wk-day').first()).toHaveText('Sundays');
});

test('each row adds itself to a calendar, in Muncie time', async ({ page, request }) => {
  await page.goto(PAGE);
  const href = await page.locator('#messiah-sing-in-2026-12-11 a.add').getAttribute('href');
  expect(href).toBe('/events/messiah-sing-in-2026-12-11.ics');
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  const ics = await res.text();
  expect(ics).toContain('DTSTART;TZID=America/Indiana/Indianapolis:20261211T183000');
  expect(ics).toContain('SUMMARY:Messiah Sing-In');

  const weekly = await (await request.get('/events/sunday-school-weekly.ics')).text();
  expect(weekly).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU');
});

test('the full calendar door goes to Church Trac', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('a.ev-door')).toHaveAttribute(
    'href',
    /churchtrac\.com\/public_calendar\?ui=/,
  );
});

test('passes axe', async ({ page }) => {
  await page.goto(PAGE);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('no sideways scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(PAGE);
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(over).toBeLessThanOrEqual(0);
});
