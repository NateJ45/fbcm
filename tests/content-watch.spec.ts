// scaffold-file: church
import { test, expect, type Locator, type Page } from './fixtures';

// =============================================================================
// @content: what the church WROTE, watched but never required
// =============================================================================
// The secretary edits the live site in Sanity whenever he likes, and that is his
// right. CI builds from live content, so a spec that asserts his sentences, his
// band names or the exact set of things on a page goes red on every open PR the
// moment he changes one (2026-10-05, tests/visit.spec.ts, twice in a day).
//
// So the required suite (`npm test`, ci.yml's `e2e` and `test`) is content
// independent, and this file holds everything that is really a statement about
// the church's content. Its tests carry `@content` in their title; the base
// config (playwright.config.ts) excludes that tag, and playwright.content.config.ts
// runs ONLY it, from .github/workflows/content-watch.yml: daily, after a deploy
// and on demand, never as a required check, never failing a merge. A failure
// here means "the content moved, someone should look", and the usual cure is to
// update the expectation here (or tell the church), not to revert his edit.
//
// What belongs here: a heading, sentence, label or link the page is supposed to
// carry; the exact count or order of bands, accounts or items; an id or URL the
// church's own redirects and bookmarks point at; a post, category or tag named
// by its slug. What does NOT belong here: anything that holds whatever the
// church writes (those go in the structural specs, which discover their subject
// from the build; see tests/content-helpers.ts). The rule is written out in
// .claude/rules/tests-and-gates.md.
//
// Each block says which required test it stands in for, so no protection is
// lost silently: when a structural spec skips because the church retired its
// subject, the block here is what reports it.
// =============================================================================

/** The band whose h2 is `name`. */
const band = (page: Page, name: string): Locator =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { level: 2, name, exact: true }) });

/** True when no ancestor is a closed <details>, i.e. nothing has to be expanded. */
const openAll = (loc: Locator) =>
  loc.evaluateAll((els) => els.every((e) => !e.closest('details:not([open])')));

test.describe('@content /visit', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // Was in visit.spec.ts. The facts a parent needs are on the page and in the
  // open. The subheadings under them are NOT asserted: the church renamed them
  // twice in one day.
  test('Your children carries the safety facts, visible without expanding', async ({ page }) => {
    await page.goto('/visit');
    const kids = band(page, 'Your children');
    await expect(kids).toHaveCount(1);
    for (const fact of [
      'be background checked',
      'matching security tag',
      'at least two adults at all times',
      'this tag will need to be presented for pick up',
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

  // Was in visit.spec.ts. The structural half (the jump resolves to a named
  // Church Trac frame) is still required; this is the wording and the address.
  test('"Let us know you’re coming" jumps to the connection card, and the card is that form', async ({
    page,
  }) => {
    await page.goto('/visit');
    const buttons = page.getByRole('link', { name: 'Let us know you’re coming' });
    // The hero's gold button and the closing band's, both to the card's band.
    await expect(buttons).toHaveCount(2);
    for (const b of await buttons.all()) await expect(b).toHaveAttribute('href', '/visit#connect');
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

  // Stands in for details.spec.ts's FAQPage assertion, which now only checks
  // that a FAQPage, when there is one, matches the questions shown.
  test('the page still carries a frequently asked questions band, and its FAQPage', async ({
    page,
  }) => {
    await page.goto('/visit');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Frequently asked questions' }),
    ).toBeVisible();
    expect(await page.locator('details summary').count()).toBeGreaterThan(0);
    const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
      (t) => [JSON.parse(t)['@type']].flat().join('+'),
    );
    expect(types).toContain('FAQPage');
  });

  // Stands in for details.spec.ts's "Which door?" block, which now holds for
  // however many doors the church lists.
  test('Which door? lists the three doors, and the street-side words are there', async ({
    page,
  }) => {
    await page.goto('/visit/');
    const section = page.locator('section:has([data-door-plan])');
    await expect(section.locator('[data-door-link]')).toHaveCount(3);
    const svg = section.locator('svg[role="img"]');
    await expect(svg).toHaveAccessibleName(/street side/);
    await expect(svg).toHaveAccessibleDescription(/Adams Street circular drive/);
    await expect(section.locator('.sd-doors')).toContainText(
      'main hallway near the church offices',
    );
  });

  // Stands in for motion.spec.ts's "closing accent line rises too", which skips
  // when the h1 has no closing accent.
  test('the h1 keeps its closing accent line', async ({ page }) => {
    await page.goto('/visit');
    await expect(page.locator('main h1 .hw-close')).toHaveCount(1);
  });

  // Stands in for anchors.spec.ts, which now discovers its anchors. These are
  // the ones the church's own pages, the Wix redirects and old bookmarks point at.
  test('the anchors people link to still exist', async ({ page }) => {
    await page.goto('/visit');
    await expect(page.locator('#accessibility')).toHaveCount(1);
  });
});

test.describe('@content the other pages', () => {
  test('/beliefs, /staff, /ministries and /history keep the anchors people link to', async ({
    page,
  }) => {
    for (const [route, id] of [
      ['/beliefs', 'baptists'],
      ['/staff', 'kendall-ellis'],
      ['/ministries', 'youth'],
      ['/history', 'building'],
    ]) {
      await page.goto(route);
      await expect(page.locator(`#${id}`), `${route}#${id}`).toHaveCount(1);
    }
  });

  // Stands in for history-contents.spec.ts, which now reads the bar's own links.
  test('/history keeps its contents bar, from the founding to the gas boom', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'load' });
    const nav = page.getByRole('navigation', { name: 'Contents' });
    await expect(
      nav.getByRole('link', { name: '1859 to 1862: Founding', exact: true }),
    ).toBeVisible();
    expect(
      await page.locator('.hc-strip a[data-hc-link]').count(),
      'entries',
    ).toBeGreaterThanOrEqual(4);
    for (const id of ['era-1', 'era-3', 'era-5', 'era-6', 'building']) {
      await expect(page.locator(`#${id}`), `#${id}`).toHaveCount(1);
    }
    await expect(page.locator('.hc-list a[href="#era-3"]')).toHaveCount(1);
  });

  // Stands in for church-app.spec.ts, which now reads the code out of the link.
  test('Home and the footer carry the church app band with the install code 8PG6ZJ', async ({
    page,
  }) => {
    await page.goto('/');
    const band = page.locator('[data-church-app-band]');
    await expect(band.getByRole('link', { name: 'Get the app' })).toHaveAttribute(
      'href',
      'https://open.churchtrac.com?code=8PG6ZJ',
    );
    await expect(band.locator('[data-install-code]')).toHaveAttribute(
      'data-install-code',
      '8PG6ZJ',
    );
    await expect(page.locator('footer [data-footer-app]')).toContainText('8PG6ZJ');
  });

  // Stands in for social.spec.ts, which now holds for however many accounts
  // Site settings lists.
  test('the church lists Facebook, Instagram, YouTube, Threads and Linktree, in that order', async ({
    page,
  }) => {
    await page.goto('/');
    const links = page
      .locator('footer ul')
      .filter({
        has: page.getByRole('link', { name: /^First Baptist Church Muncie on Facebook$/ }),
      })
      .getByRole('link');
    await expect(links).toHaveCount(5);
    const names = await links.evaluateAll((as) =>
      as.map((a) => (a.getAttribute('aria-label') ?? '').replace(/^.* on /, '')),
    );
    expect(names).toEqual(['Facebook', 'Instagram', 'YouTube', 'Threads', 'Linktree']);
  });

  // Stands in for the blog specs, which now use whichever category and tag
  // were built (BLOG_CATEGORY, BLOG_TAG in tests/routes.ts).
  test('the blog keeps its sermon-preview category and its advent tag', async ({ request }) => {
    for (const path of ['/blog/category/sermon-preview', '/blog/tag/advent']) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });
});

test.describe('@content migrated URLs', () => {
  // Was site-urls.spec.ts (the Wix migration's URL gate): the non-ASCII slug is
  // the acceptance case the import was proven by. details.spec.ts used the same
  // post for its share-card and BlogPosting checks, which now use any post.
  test('the post with a non-ASCII slug is served at its original URL', async ({ page }) => {
    const res = await page.goto('/post/händel-s-messiah-sing-in-carols');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Messiah');
  });

  // Was post-tools.spec.ts and print.spec.ts's fixed post; those now take the
  // newest sermon preview that has what they test.
  test('the sermon preview "A Light Wardrobe" is still published', async ({ request }) => {
    expect((await request.get('/post/a-light-wardrobe/')).status()).toBe(200);
  });

  // Was search.spec.ts's query. The search specs now search a word from the
  // newest post's title.
  test('searching "Jeremiah" finds a post', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Search the site' }).click();
    await page.getByRole('searchbox', { name: 'Search sermons, posts and pages' }).fill('Jeremiah');
    const first = page.locator('.ss-row').first();
    await expect(first).toBeVisible();
    expect(await first.locator('a').getAttribute('href')).toMatch(/^\/post\//);
  });
});
