// scaffold-file: journal
// The site search's result rows (feat/scripture-search, 2026-09-24).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { excerptHtml, searchRow, countLabel } from './search-results.ts';

test('excerptHtml keeps <mark> and strips every other tag', () => {
  assert.equal(
    excerptHtml('For I know the plans, says the <mark>Lord</mark>'),
    'For I know the plans, says the <mark>Lord</mark>',
  );
  assert.equal(
    excerptHtml('<img src=x onerror=alert(1)>a <mark>b</mark> <script>c</script>'),
    'a <mark>b</mark> c',
  );
  assert.equal(excerptHtml('<MARK>x</MARK>'), '<mark>x</mark>');
  assert.equal(excerptHtml(undefined), '');
});

test('a post row carries its date and reading from the page meta', () => {
  assert.deepEqual(
    searchRow({
      url: '/post/a-future/',
      excerpt: 'plans to give you <mark>hope</mark>',
      meta: {
        title: 'A Future and a Hope',
        date: 'November 16, 2025',
        reading: 'Jeremiah 29:10-12',
      },
    }),
    {
      href: '/post/a-future/',
      title: 'A Future and a Hope',
      date: 'November 16, 2025',
      reading: 'Jeremiah 29:10-12',
      excerptHtml: 'plans to give you <mark>hope</mark>',
    },
  );
});

test('a page row says "Page", has no reading, and loses the site name', () => {
  const row = searchRow({
    url: '/visit/',
    excerpt: 'Park on <mark>Adams</mark> Street',
    meta: { title: 'Visit | First Baptist Church Muncie' },
  });
  assert.equal(row.title, 'Visit');
  assert.equal(row.date, 'Page');
  assert.equal(row.reading, '');
});

test('a result with no title shows its address rather than nothing', () => {
  assert.equal(searchRow({ url: '/privacy/' }).title, '/privacy/');
});

test('countLabel', () => {
  assert.equal(countLabel(12, ' Jeremiah '), '12 results for “Jeremiah”');
  assert.equal(countLabel(1, 'Ezra'), '1 result for “Ezra”');
  assert.equal(countLabel(0, 'zzz'), 'Nothing found for “zzz”.');
  assert.equal(countLabel(0, '  '), '');
});
