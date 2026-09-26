// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_ENTRIES,
  bodyHrefs,
  entryRest,
  entryYear,
  fragmentFor,
  normalisePath,
  timelineContents,
  type ContentsBlock,
} from './timeline-contents.ts';

// A stega run as the preview client appends it (U+FEFF matches \s).
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

const linkBlock = (href: string) => ({
  _type: 'block',
  markDefs: [{ _type: 'link', _key: 'l1', href }],
  children: [{ _type: 'span', text: 'Read this era', marks: ['l1'] }],
});
const para = (text: string) => ({ _type: 'block', markDefs: [], children: [{ text }] });
const row = (marker: string, title: string, href?: string) => ({
  marker,
  title,
  body: href ? [para('A lead.'), linkBlock(href)] : [para('A lead.')],
});

/** History as composed by scripts/pages/history.mjs, cut down to its shape. */
function historyBlocks(): ContentsBlock[] {
  return [
    { type: 'heritageBandSection', id: 'page-0-band', heading: 'Our History' },
    {
      type: 'timelineSection',
      id: 'eras',
      heading: 'Highlights of our history',
      rows: [
        row('1859 to 1862', 'Founding', '/history#era-1'),
        row('1862 to 1881', 'Struggle and Rairden', '/history#era-2'),
        row('1887 to 1917', 'The gas boom to the debt paid', '/history#era-3'),
        row('1921 to 1929', 'The Fighting Parson and the building', '/history#building'),
        row('Today', 'A new era', '/staff'),
      ],
    },
    { type: 'imageTextSection', id: 'era-1', heading: 'Founding' },
    { type: 'imageTextSection', id: 'era-2', heading: 'Struggle and Rairden' },
    { type: 'richTextSection', id: 'page-4-band', heading: '' },
    { type: 'quoteSection', id: 'page-5-band' },
    { type: 'imageTextSection', id: 'era-3', heading: 'The gas boom to the debt paid' },
    { type: 'richTextSection', id: 'page-7-band' },
    { type: 'imageTextSection', id: 'building', heading: 'The Fighting Parson and the building' },
    { type: 'richTextSection', id: 'page-9-band', heading: '' },
    { type: 'documentListSection', id: 'page-10-band', heading: 'Two books' },
    { type: 'ctaBandSection', id: 'page-11-band', heading: 'The story continues on Sunday.' },
  ];
}

test('History: one entry per era row that links to a band on the page', () => {
  const c = timelineContents(historyBlocks(), '/history');
  assert.ok(c);
  assert.deepEqual(
    c.entries.map((e) => [e.id, e.year, e.title]),
    [
      ['era-1', '1859', 'Founding'],
      ['era-2', '1862', 'Struggle and Rairden'],
      ['era-3', '1887', 'The gas boom to the debt paid'],
      ['building', '1921', 'The Fighting Parson and the building'],
    ],
  );
});

test('the Today row links off the page, so it is not an entry', () => {
  const c = timelineContents(historyBlocks(), '/history');
  assert.ok(c && !c.entries.some((e) => e.title === 'A new era'));
});

test('the first link is the timeline itself, named by its heading', () => {
  const c = timelineContents(historyBlocks(), '/history');
  assert.deepEqual(c?.top, { id: 'eras', label: 'Highlights of our history' });
  assert.equal(c?.from, 1);
});

test('the span runs through the last part’s headless bands and stops at a heading', () => {
  const c = timelineContents(historyBlocks(), '/history');
  // `building` is index 8, its prose tail 9; "Two books" (10) has a heading.
  assert.equal(c?.to, 9);
});

test('the accessible name reads the whole marker and the title', () => {
  const c = timelineContents(historyBlocks(), '/history');
  const e = c!.entries[0];
  assert.equal(`${e.year}${e.rest}`, '1859 to 1862: Founding');
});

test('a row pointing at a band that is not on the page is dropped', () => {
  const blocks = historyBlocks();
  (blocks[1].rows as ReturnType<typeof row>[])[0] = row('1859', 'Founding', '/history#gone');
  const c = timelineContents(blocks, '/history');
  assert.deepEqual(
    c?.entries.map((e) => e.id),
    ['era-2', 'era-3', 'building'],
  );
});

test('a link to a band ABOVE the timeline is not an entry', () => {
  const blocks = historyBlocks();
  (blocks[1].rows as ReturnType<typeof row>[])[0] = row('1859', 'Founding', '#page-0-band');
  const c = timelineContents(blocks, '/history');
  assert.ok(c && !c.entries.some((e) => e.id === 'page-0-band'));
});

test(`fewer than ${MIN_ENTRIES} rows pointing at the page gives no bar (Visit, Ministries)`, () => {
  const blocks: ContentsBlock[] = [
    { type: 'heroSection', id: 'page-0-band', heading: 'Plan your visit' },
    {
      type: 'timelineSection',
      id: 'morning',
      heading: 'Your first Sunday',
      rows: [
        row('10:00 am', 'Coffee'),
        row('10:45 am', 'Worship', '#doors'),
        row('12 pm', 'Lunch'),
      ],
    },
    { type: 'sundayTimesSection', id: 'doors', heading: 'Doors' },
  ];
  assert.equal(timelineContents(blocks, '/visit'), null);
});

test('a page with no timeline gives no bar', () => {
  assert.equal(timelineContents([{ type: 'richTextSection', id: 'a', heading: 'A' }], '/'), null);
});

test('the same band named by two rows is listed once', () => {
  const blocks = historyBlocks();
  (blocks[1].rows as ReturnType<typeof row>[]).push(row('1930', 'Again', '/history#era-1'));
  const c = timelineContents(blocks, '/history');
  assert.equal(c?.entries.filter((e) => e.id === 'era-1').length, 1);
});

test('stega: markers, titles, the heading and the hrefs are read cleaned', () => {
  const blocks = historyBlocks();
  blocks[1].heading = 'Highlights of our history' + STEGA;
  blocks[1].rows = (blocks[1].rows as ReturnType<typeof row>[]).map((r) => ({
    ...r,
    marker: r.marker + STEGA,
    title: r.title + STEGA,
    body: r.body.map((b) =>
      'markDefs' in b && b.markDefs.length
        ? { ...b, markDefs: [{ ...b.markDefs[0], href: b.markDefs[0].href + STEGA }] }
        : b,
    ),
  }));
  const c = timelineContents(blocks, '/preview/history');
  assert.ok(c);
  assert.equal(c.top.label, 'Highlights of our history');
  assert.deepEqual(c.entries[0], {
    id: 'era-1',
    year: '1859',
    rest: ' to 1862: Founding',
    marker: '1859 to 1862',
    title: 'Founding',
  });
  assert.equal(c.entries.length, 4);
});

test('fragmentFor: same-page links only', () => {
  assert.equal(fragmentFor('#era-1', '/history'), 'era-1');
  assert.equal(fragmentFor('/history#era-1', '/history/'), 'era-1');
  assert.equal(fragmentFor('/history/#era-1', '/history'), 'era-1');
  assert.equal(fragmentFor('/staff#era-1', '/history'), null);
  assert.equal(fragmentFor('/staff', '/history'), null);
  assert.equal(fragmentFor('https://example.org/history#era-1', '/history'), null);
  assert.equal(fragmentFor('#', '/history'), null);
  assert.equal(fragmentFor('#caf%C3%A9', '/history'), 'café');
  assert.equal(fragmentFor('#%E0%A4%A', '/history'), null);
  assert.equal(fragmentFor(undefined, '/history'), null);
});

test('normalisePath strips the preview prefix and a trailing slash', () => {
  assert.equal(normalisePath('/preview/history/'), '/history');
  assert.equal(normalisePath('/history'), '/history');
  assert.equal(normalisePath('/'), '/');
  assert.equal(normalisePath('/preview'), '/');
  assert.equal(normalisePath('/previewer/x'), '/previewer/x');
});

test('bodyHrefs reads every link mark, and nothing from a non-array', () => {
  assert.deepEqual(bodyHrefs([para('x'), linkBlock('#a'), linkBlock('/b')]), ['#a', '/b']);
  assert.deepEqual(bodyHrefs(null), []);
});

test('entryYear and entryRest', () => {
  assert.equal(entryYear('1859 to 1862'), '1859');
  assert.equal(entryYear('c. 1900'), '1900');
  assert.equal(entryYear('Today'), 'Today');
  assert.equal(entryRest('1859 to 1862', '1859', 'Founding'), ' to 1862: Founding');
  assert.equal(entryRest('c. 1900', '1900', 'X'), ': X');
  assert.equal(entryRest('1859', '1859', ''), '');
});
