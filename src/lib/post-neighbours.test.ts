// scaffold-file: journal
// The doors and series rows at the foot of a post (post-neighbours.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doorsFor, seriesRowOf } from './post-neighbours.ts';
import type { BlogEntry } from './blog-derive.ts';

const cat = (title: string) => ({
  title,
  slug: { current: title.toLowerCase().replace(/ /g, '-') },
});
const preview = (slug: string, publishedAt: string): BlogEntry => ({
  _id: slug,
  title: `Preview ${slug}`,
  slug: { current: slug },
  publishedAt,
  categories: [cat('Sermon Preview')],
});
const post = (slug: string, publishedAt: string): BlogEntry => ({
  _id: slug,
  title: `Post ${slug}`,
  slug: { current: slug },
  publishedAt,
  categories: [cat('FBCM Events')],
});

// Newest first, previews and events interleaved.
const all: BlogEntry[] = [
  preview('p3', '2024-06-04T15:00:00Z'),
  post('e2', '2024-06-01T15:00:00Z'),
  preview('p2', '2024-05-28T15:00:00Z'),
  post('e1', '2024-05-25T15:00:00Z'),
  preview('p1', '2024-05-21T15:00:00Z'),
];
const heads: Record<string, string> = {
  p1: 'From Matthew 19:1-14',
  p3: 'No reference in this one.',
};
const opening = (e: BlogEntry) => heads[e._id ?? ''] ?? '';

test("a preview's doors are its neighbours among previews, with Sunday and reading", () => {
  const d = doorsFor(all[2], all, opening);
  assert.deepEqual(d.before, {
    label: 'The Sunday before',
    title: 'Preview p1',
    slug: 'p1',
    sub: 'May 26, 2024 · Matthew 19:1-14',
  });
  assert.deepEqual(d.after, {
    label: 'The Sunday after',
    title: 'Preview p3',
    slug: 'p3',
    sub: 'June 9, 2024',
  });
});

test("any other post's doors are Older / Newer by date, across every post", () => {
  const d = doorsFor(all[1], all, opening);
  assert.equal(d.before?.label, 'Older post');
  assert.equal(d.before?.slug, 'p2');
  assert.equal(d.before?.sub, 'May 28, 2024');
  assert.equal(d.after?.label, 'Newer post');
  assert.equal(d.after?.slug, 'p3');
});

test('the newest and oldest posts have one door', () => {
  assert.equal(doorsFor(all[0], all, opening).after, null);
  assert.equal(doorsFor(all[4], all, opening).before, null);
  assert.deepEqual(doorsFor(post('missing', '2020-01-01'), all, opening), {
    before: null,
    after: null,
  });
});

test('series rows: a preview shows its Sunday and reading, a post its date and category', () => {
  assert.deepEqual(seriesRowOf(all[4], opening), {
    title: 'Preview p1',
    slug: 'p1',
    excerpt: '',
    date: 'Sunday, May 26, 2024',
    meta: 'Matthew 19:1-14',
    datetime: '2024-05-26',
    cover: null,
  });
  assert.equal(seriesRowOf(all[0], opening).meta, 'Sermon preview', 'no reading found');
  const e = seriesRowOf(all[1], opening);
  assert.equal(e.date, 'June 1, 2024');
  assert.equal(e.meta, 'FBCM Events');
  assert.equal(e.datetime, '2024-06-01', 'the datetime names the same day as the label');
});

test('series rows carry the featured image only when it has an asset', () => {
  const cover = { asset: { _ref: 'image-abc-10x10-jpg' }, alt: 'x' };
  assert.deepEqual(seriesRowOf({ ...all[1], coverImage: cover }, opening).cover, cover);
  assert.equal(seriesRowOf({ ...all[1], coverImage: { alt: 'no asset' } }, opening).cover, null);
});
