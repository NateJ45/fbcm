// scaffold-file: journal
// The foot of one post (post-foot.ts): the one derivation the static post
// route and the draft preview share, including the draft cases the static
// route never meets (a post not in the list, a post read with stega).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openingLookup, postFeet, type PostHead } from './post-foot.ts';
import { doorsFor, seriesRowOf } from './post-neighbours.ts';
import { seriesByTag, type BlogEntry } from './blog-derive.ts';

// The invisible characters the preview client hides inside a string.
const Z = '​‌‍﻿';

const cat = (title: string) => ({
  title,
  slug: { current: title.toLowerCase().replace(/ /g, '-') },
});
const preview = (slug: string, publishedAt: string, tags: string[] = []): BlogEntry => ({
  _id: slug,
  title: `Preview ${slug}`,
  slug: { current: slug },
  publishedAt,
  tags,
  categories: [cat('Sermon Preview')],
});
const block = (text: string) => ({
  _type: 'block',
  style: 'normal',
  children: [{ _type: 'span', text }],
});

// Newest first, the order every journal query hands entries over in.
const all: BlogEntry[] = [
  preview('p3', '2024-06-04T15:00:00Z', ['Mark']),
  preview('p2', '2024-05-28T15:00:00Z', ['Mark', 'Easter']),
  preview('p1', '2024-05-21T15:00:00Z', ['Easter']),
];
const heads: PostHead[] = [
  { _id: 'p1', head: [block('Our reading is Mark 1:1-8.')] },
  { _id: 'p2', head: [block('Our reading is Mark 2:1-12.')] },
];

test('openingLookup reads each post`s opening text by id, and nothing for a stranger', () => {
  const opening = openingLookup(heads);
  assert.match(opening(all[2]), /Mark 1:1-8/);
  assert.equal(opening(all[0]), '');
  assert.equal(opening({ _id: 'nobody' }), '');
  assert.equal(openingLookup(null)({ _id: 'p1' }), '');
});

test('postFeet gives what the static route used to derive inline', () => {
  const foot = postFeet(all, heads)(all[1]);
  const opening = openingLookup(heads);
  assert.deepEqual(foot.doors, doorsFor(all[1], all, opening));
  assert.deepEqual(
    foot.series,
    seriesByTag(all[1], all, 3).map((s) => seriesRowOf(s, opening)),
  );
  assert.equal(foot.doors.before?.slug, 'p1');
  assert.equal(foot.doors.after?.slug, 'p3');
});

test('a new draft that is not in the list gets no doors, and still its series rows', () => {
  const draft = preview('brand-new', '2024-06-11T15:00:00Z', ['Mark']);
  const foot = postFeet(all, heads)(draft);
  assert.deepEqual(foot.doors, { before: null, after: null });
  assert.deepEqual(
    foot.series.map((r) => r.slug),
    ['p3', 'p2'],
  );
  assert.equal(foot.readingAnchor, '');
});

test('a new draft with no tags and no date draws an empty foot rather than throwing', () => {
  const foot = postFeet([], [])({ _id: 'x', title: 'Untitled' });
  assert.deepEqual(foot, { doors: { before: null, after: null }, series: [], readingAnchor: '' });
});

test('the post read with stega (the preview) still finds its tags and its place', () => {
  // In the preview the post's own fields carry stega; the list does not.
  const stega: BlogEntry = {
    ...all[1],
    title: `Preview p2${Z}`,
    tags: [`Mark${Z}`, `Easter${Z}`],
    categories: [cat(`Sermon Preview${Z}`)],
  };
  const clean = postFeet(all, heads)(all[1]);
  const drawn = postFeet(all, heads)(stega);
  assert.deepEqual(drawn.doors, clean.doors);
  assert.deepEqual(drawn.series, clean.series);
});
