// "Last Sunday" on Home, Sunday's weather and the calendar file on Visit
// (2026-09-24, `feat/last-sunday`).
//
// The Home band is built from the channel feed at BUILD time. The build this
// suite runs against sets LAST_SUNDAY_FIXTURE=1 and LAST_SUNDAY_NOW (see the
// webServer in playwright.config.ts), so / renders from the committed feed in
// tests/fixtures/youtube-feed.xml at a fixed Thursday, offline and the same
// every run. /styleguide/last-sunday renders the same loader and component in
// its three states, including the feed being unavailable.
//
// The weather line is fetched by the BROWSER, so it is tested with route
// interception on api.weather.gov and a fixed clock.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

const NWS = 'https://api.weather.gov/**';
const SATURDAY = new Date('2026-09-26T14:00:00Z'); // 10 am Saturday, church time
const TUESDAY = new Date('2026-09-22T14:00:00Z');

const forecast = {
  properties: {
    periods: [
      {
        number: 1,
        name: 'Today',
        startTime: '2026-09-26T10:00:00-04:00',
        isDaytime: true,
        temperature: 64,
        temperatureUnit: 'F',
        shortForecast: 'Mostly Cloudy',
      },
      {
        number: 2,
        name: 'Sunday',
        startTime: '2026-09-27T06:00:00-04:00',
        isDaytime: true,
        temperature: 58,
        temperatureUnit: 'F',
        shortForecast: 'Light Rain',
      },
    ],
  },
};

async function mockWeather(page: Page, mode: 'ok' | 'fail' | 'count', seen?: string[]) {
  await page.route(NWS, (route) => {
    seen?.push(route.request().url());
    if (mode === 'fail') return route.abort('failed');
    return route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(forecast),
    });
  });
}

async function axeClean(page: Page, label: string, disable: string[] = []) {
  const results = await new AxeBuilder({ page }).disableRules(disable).analyze();
  const report = results.violations
    .map(
      (v) =>
        `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    )
    .join('\n');
  expect(results.violations, `axe violations on ${label}:\n${report}`).toEqual([]);
}

test.describe('Home: Last Sunday', () => {
  test('renders from the fixture feed, before the Church Blog rows', async ({ page }) => {
    await page.goto('/');
    const band = page.locator('section.ls-band');
    await expect(band).toHaveCount(1);
    await expect(band).toHaveAttribute('data-last-sunday', '2026-09-20');
    await expect(band.getByRole('heading', { level: 2 })).toHaveText('Last Sunday');
    await expect(band.locator('time')).toHaveText(/Sunday, September 20/i);
    await expect(band.getByRole('heading', { level: 3 })).toHaveText('Unequal Opportunity Grace');
    await expect(band).toContainText('Matthew 20:1-16');
    await expect(band).toContainText('Kingdom Come series');
    await expect(band).toContainText('Rev. Jonathan Balmer');

    const watch = band.getByRole('link', { name: 'Watch on YouTube' });
    await expect(watch).toHaveAttribute('href', 'https://www.youtube.com/watch?v=y435wOf6Tgc');
    await expect(watch).toHaveAttribute('target', '_blank');

    // The facade: YouTube's thumbnail, lazy, and no player on the page.
    const img = band.locator('img');
    await expect(img).toHaveAttribute('loading', 'lazy');
    expect(await img.getAttribute('src')).toBe('https://i.ytimg.com/vi/y435wOf6Tgc/mqdefault.jpg');
    await expect(page.locator('iframe')).toHaveCount(0);

    // Its place: right after "Our Building", right before the blog rows. The
    // Visitor band (feat/the-visitor, enlarged in feat/visitor-band) shares
    // the slot and follows it, so it is stepped over when present.
    const order = await page.evaluate(() => {
      const band = document.querySelector('section.ls-band');
      let next = band?.nextElementSibling ?? null;
      if (next?.matches('section.vb-band')) next = next.nextElementSibling;
      return {
        before: band?.previousElementSibling?.id ?? '',
        after: next?.querySelector('section')?.getAttribute('class') ?? '',
      };
    });
    expect(order.before).toMatch(/^home-\d+-band$/);
    expect(order.after).toContain('bg-band-taupe');
  });

  test('the band is never the largest paint: nothing from YouTube loads with the first screen', async ({
    page,
  }) => {
    const ytimg: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('i.ytimg.com')) ytimg.push(r.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    expect(ytimg).toEqual([]);
  });

  test('Home has no axe violations with the band', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await settle(page);
    await axeClean(page, '/');
  });
});

test.describe('Last Sunday on fixed data', () => {
  test('the recording alone, paired with a preview, and absent when the feed is unavailable', async ({
    page,
  }) => {
    await page.goto('/styleguide/last-sunday');
    const alone = page.locator('[data-state="recording"] section.ls-band');
    await expect(alone).toHaveCount(1);
    await expect(alone.getByRole('link', { name: 'Read the sermon preview' })).toHaveCount(0);

    const paired = page.locator('[data-state="paired"] section.ls-band');
    await expect(paired.getByRole('heading', { level: 3 })).toHaveText(
      'Unequal Opportunity Grace: the Workers in the Vineyard',
    );
    await expect(paired.getByRole('link', { name: 'Read the sermon preview' })).toHaveAttribute(
      'href',
      '/blog',
    );
    await expect(paired.getByRole('link', { name: 'Watch on YouTube' })).toHaveCount(1);

    // The feed unavailable: nothing at all, not an empty band.
    await expect(page.locator('[data-state="unavailable"]')).toBeEmpty();
    await settle(page);
    // landmark-unique is off for this fixture page ONLY: it draws the same
    // band twice on purpose, so two regions are both named "Last Sunday". On
    // the home page there is one, and the Home axe test runs every rule.
    await axeClean(page, '/styleguide/last-sunday', ['landmark-unique']);
  });
});

test.describe('Visit: Sunday weather', () => {
  test('a mocked forecast shows one line under Find us', async ({ page }) => {
    await page.clock.setFixedTime(SATURDAY);
    await mockWeather(page, 'ok');
    await page.goto('/visit');
    const line = page.locator('[data-sunday-weather] .sw-line');
    await expect(line).toBeVisible({ timeout: 10_000 });
    await expect(line).toHaveText('Sunday: 58°, light rain.');
    await settle(page);
    await axeClean(page, '/visit (weather shown)');
  });

  test('a failed forecast renders nothing', async ({ page }) => {
    await page.clock.setFixedTime(SATURDAY);
    const seen: string[] = [];
    await mockWeather(page, 'fail', seen);
    await page.goto('/visit', { waitUntil: 'load' });
    await expect.poll(() => seen.length, { timeout: 10_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    await expect(page.locator('[data-sunday-weather] .sw-line')).toBeHidden();
  });

  test('outside Wednesday to Sunday noon, nothing is fetched and nothing renders', async ({
    page,
  }) => {
    await page.clock.setFixedTime(TUESDAY);
    const seen: string[] = [];
    await mockWeather(page, 'count', seen);
    await page.goto('/visit', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    expect(seen).toEqual([]);
    await expect(page.locator('[data-sunday-weather] .sw-line')).toBeHidden();
  });
});

test.describe('Visit: Add Sundays to your calendar', () => {
  test('the link sits under the hero facts and points at the calendar file', async ({ page }) => {
    await page.goto('/visit');
    const link = page.getByRole('link', { name: 'Add Sundays to your calendar' });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/visit/sunday.ics');
    await expect(page.locator('.hero-facts + .hf-cal')).toHaveCount(1);
  });

  test('the .ics is one weekly Sunday event, in the church’s zone, at the church', async ({
    request,
  }) => {
    const res = await request.get('/visit/sunday.ics');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/calendar');
    const body = (await res.text()).replace(/\r\n /g, '');
    expect(body.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(body).toContain('\r\nRRULE:FREQ=WEEKLY;BYDAY=SU\r\n');
    expect(body).toContain('\r\nTZID:America/Indiana/Indianapolis\r\n');
    expect(body).toMatch(/\r\nDTSTART;TZID=America\/Indiana\/Indianapolis:\d{8}T\d{6}\r\n/);
    expect(body).toMatch(/\r\nLOCATION:[^\r]*309 East Adams Street[^\r]*Muncie/);
    expect(body.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
});
