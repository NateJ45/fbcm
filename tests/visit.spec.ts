// scaffold-file: church
import { test, expect, type Locator, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// The visitor audit on /visit (2026-09-25, feat/visit-fixes)
// =============================================================================
// A family new to Muncie, on a phone, could not find the children's safety
// facts, the nervous questions, or a way to say "we're coming". The page that
// fixes it is composed by scripts/pages/visit.mjs, applied 2026-09-25; the
// /styleguide/visit copy the suite read until then is gone, so it reads /visit.
// Since the same day the connection card is ON the page (a Church Trac form
// band at #connect), and both "Let us know you're coming" buttons jump to it.
//
// Home's rows are checked on /styleguide's Church Blog band, whose fixed data
// holds one past FBCM Events post (Blue Christmas, 9 December 2025) measured
// from a fixed day (src/pages/styleguide.astro, JOURNAL_LIST_NOW).
// =============================================================================

const PAGE = '/visit';

/** The band whose h2 is `name`. */
const band = (page: Page, name: string): Locator =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { level: 2, name, exact: true }) });

/** True when no ancestor is a closed <details>, i.e. nothing has to be expanded. */
const openAll = (loc: Locator) =>
  loc.evaluateAll((els) => els.every((e) => !e.closest('details:not([open])')));

test.describe('the page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Good to know answers four questions in the open', async ({ page }) => {
    await page.goto(PAGE);
    const good = band(page, 'Good to know');
    await expect(good).toHaveCount(1);
    const questions = good.getByRole('heading', { level: 3 });
    await expect(questions).toHaveText([
      'What should I wear?',
      'I’m not sure what I believe. Will that be a problem?',
      'Am I allowed to take the Lord’s Supper (communion)?',
      'Does my child need to bring a Bible?',
    ]);
    for (const answer of [
      'Casual dress is welcome.',
      'It won’t be a problem at all!',
      'all who believe in him and have been baptized may partake',
      'We will certainly provide a Bible',
    ]) {
      await expect(good.getByText(answer)).toBeVisible();
    }
    expect(await openAll(good.locator('h3, p'))).toBe(true);
    // The full FAQ is still on the page, below.
    await expect(
      page.getByRole('heading', { level: 2, name: 'Frequently asked questions' }),
    ).toBeVisible();
  });

  test('Your children carries the safety facts, visible without expanding', async ({ page }) => {
    await page.goto(PAGE);
    const kids = band(page, 'Your children');
    await expect(kids).toHaveCount(1);
    await expect(kids.getByRole('heading', { level: 3 })).toHaveText([
      'Check-in',
      'Who cares for them',
      'Pick-up',
      'Ages and rooms',
    ]);
    for (const fact of [
      'be background checked',
      'matching security tag',
      'at least two adults at all times',
      'this tag will need to be presented for pick up',
      'Nursery (104): 6 weeks - 3 years.',
      'The Underground Children',
    ]) {
      await expect(kids.getByText(fact, { exact: false }).first()).toBeVisible();
    }
    expect(await openAll(kids.locator('h3, p'))).toBe(true);
    // /visit#children lands on it.
    await expect(page.locator('#children')).toHaveCount(1);
    // It sits straight after the morning path, where the children are first mentioned.
    const order = await page
      .locator('main h2')
      .evaluateAll((hs) => hs.map((h) => (h.textContent ?? '').trim()));
    expect(order.indexOf('Your children')).toBe(order.indexOf('How the morning runs') + 1);
  });

  test('"Let us know you’re coming" jumps to the connection card on the page', async ({ page }) => {
    await page.goto(PAGE);
    const buttons = page.getByRole('link', { name: 'Let us know you’re coming' });
    // The hero's gold button and the closing band's, both to the card's band.
    await expect(buttons).toHaveCount(2);
    for (const b of await buttons.all()) {
      await expect(b).toHaveAttribute('href', '/visit#connect');
      await expect(b).not.toHaveAttribute('target', '_blank');
    }
    // The band: its heading, and a Church Trac frame named for the form.
    const card = page.locator('#connect');
    await expect(card.getByRole('heading', { level: 2 })).toHaveText('Let us know you’re coming');
    await expect(card.locator('iframe')).toHaveAttribute(
      'src',
      /^https:\/\/fbcmuncie\.churchtrac\.com\/form\//,
    );
    await expect(card.locator('iframe')).toHaveAttribute('title', 'Connection card');
    // The first is in the hero, above the fold, with its promise beside it.
    const hero = page.locator('section').first();
    await expect(hero.getByRole('link', { name: 'Let us know you’re coming' })).toBeInViewport();
    await expect(hero).toContainText('a greeter will look out for you');
  });

  test('passes axe', async ({ page }) => {
    await page.goto(PAGE);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('at 320', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test('the composed page does not scroll sideways', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(over).toBeLessThanOrEqual(0);
    for (const name of ['Good to know', 'Your children']) {
      const right = await band(page, name)
        .locator('h3, p')
        .evaluateAll((els) => Math.max(0, ...els.map((e) => e.getBoundingClientRect().right)));
      expect(right, name).toBeLessThanOrEqual(320);
    }
  });
});

test.describe('home rows', () => {
  test('never show an FBCM Events post whose event is over', async ({ page }) => {
    await page.goto('/styleguide');
    const rows = page
      .locator('#styleguide-journal')
      .locator('xpath=ancestor::section[1]')
      .locator('ol > li');
    const titles = (await rows.allTextContents()).join('\n');
    // Blue Christmas (9 December 2025) is past on the fixed day; the Messiah
    // Sing-In (11 December 2026) is still to come.
    expect(titles).not.toContain('Blue Christmas');
    expect(titles).toContain('Messiah Sing-In');
    // Fewer rows rather than a stale one: four posts in, three shown.
    await expect(rows).toHaveCount(3);
  });
});
