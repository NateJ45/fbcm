// scaffold-file: journal
import { test, expect } from './fixtures';

// =============================================================================
// The scripture index, /blog/scripture (2026-09-24, feat/scripture-search)
// =============================================================================
// routes.ts puts the page through smoke, axe, contrast, reflow and headings.
// This file checks what only this page promises: the books come in canonical
// order, Old Testament before New, every anchor the page links to exists, every
// post link lands on a built page, and a post's Reading row lands on its book.
// =============================================================================

// The canon, in order (the same list src/lib/scripture-index.ts sorts by). A
// test that imported the module would only prove the module agrees with itself.
const CANON = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Songs', 'Isaiah',
  'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew',
  'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John',
  '3 John', 'Jude', 'Revelation',
]; // prettier-ignore

test('the books are in canonical order, Old Testament first', async ({ page }) => {
  await page.goto('/blog/scripture/', { waitUntil: 'domcontentloaded' });
  const h2 = await page.locator('main h2').allTextContents();
  const t = h2.map((s) => s.trim());
  const books = (await page.locator('h3.book-h').allTextContents()).map((s) => s.trim());
  // With no Sanity project the index is empty and says so; nothing to order.
  test.skip(books.length === 0, 'no posts in this build');
  expect(t.indexOf('Old Testament')).toBeLessThan(t.indexOf('New Testament'));
  const positions = books.map((b) => CANON.indexOf(b));
  expect(positions, `unknown book among ${books.join(', ')}`).not.toContain(-1);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
});

test('every jump link has its anchor, and every post link is a built page', async ({
  page,
  request,
}) => {
  await page.goto('/blog/scripture/', { waitUntil: 'domcontentloaded' });
  const jumps = await page
    .locator('nav.jump a')
    .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).hash.slice(1)));
  for (const id of jumps) {
    await expect(page.locator(`[id="${id}"]`), `#${id}`).toHaveCount(1);
  }
  const hrefs = [
    ...new Set(
      await page
        .locator('.rows .post a')
        .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).pathname)),
    ),
  ];
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test('a post links its reading to its book on the index', async ({ page }) => {
  await page.goto('/blog/scripture/', { waitUntil: 'domcontentloaded' });
  const first = page.locator('.rows .post a').first();
  test.skip((await first.count()) === 0, 'no posts in this build');
  const book = (await page.locator('.book').first().locator('h3').getAttribute('id')) ?? '';
  const postHref =
    (await page.locator('.book').first().locator('.post a').first().getAttribute('href')) ?? '';
  await page.goto(postHref, { waitUntil: 'domcontentloaded' });
  const reading = page.locator('.p2-facts a[href^="/blog/scripture/#"]');
  await expect(reading).toHaveCount(1);
  await expect(reading).toHaveAttribute('href', `/blog/scripture/#${book}`);
  await reading.click();
  await expect(page).toHaveURL(new RegExp(`/blog/scripture/#${book}$`));
  await expect(page.locator(`h3[id="${book}"]`)).toBeInViewport();
});

test('the blog index offers the scripture index', async ({ page }) => {
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('nav.filters a[href="/blog/scripture/"]')).toBeVisible();
});
