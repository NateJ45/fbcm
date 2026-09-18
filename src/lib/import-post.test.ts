// src/lib/import-post.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postDocId, categoryDocId, isSermonPreview, postFromCapture } from './import-post.ts';

const base = {
  slug: 'stayers',
  title: 'Stayers',
  url: 'https://www.fbcmuncie.org/post/stayers',
  publishedDate: '2024-01-15T10:00:00.000Z',
  author: 'Kendall Ellis',
  categories: ['Sermon Preview'],
  tags: ['Lent'],
  excerpt: 'x',
  bodyText: 'y',
  bodyHtml: '<p>y</p>',
  images: [],
  links: [],
  embeds: [],
};

test('the document id is deterministic, so a re-import replaces rather than duplicates', () => {
  assert.equal(postDocId('stayers'), 'post-stayers');
  assert.equal(postDocId('stayers'), postDocId('stayers'));
});

test('a non-ASCII slug is preserved byte for byte, never re-slugified', () => {
  const slug = 'händel-s-messiah-sing-in-carols';
  assert.equal(postFromCapture({ ...base, slug }).slug.current, slug);
  assert.equal(postDocId(slug), `post-${slug}`);
});

test('sermon-preview is DERIVED from the category, not stored as its own field', () => {
  assert.equal(isSermonPreview(['Sermon Preview']), true);
  assert.equal(isSermonPreview(['Ruminations']), false);
  assert.equal(isSermonPreview([]), false);
  assert.ok(!('postKind' in postFromCapture(base)));
  assert.ok(!('isSermonPreview' in postFromCapture(base)));
});

test('tags survive the transform', () => {
  assert.deepEqual(postFromCapture({ ...base, tags: ['Lent', 'John'] }).tags, ['Lent', 'John']);
});

test('categories become references with keys, because the schema wants references', () => {
  const doc = postFromCapture({ ...base, categories: ['Sermon Preview', 'Ruminations'] });
  assert.deepEqual(
    doc.categories.map((c) => c._ref),
    ['category-sermon-preview', 'category-ruminations'],
  );
  for (const c of doc.categories) assert.equal(c._type, 'reference');
  // Distinct _key per member, or Sanity rejects the array.
  const keys = doc.categories.map((c) => c._key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.every(Boolean));
});

test('a category id is stable across differing case and spacing', () => {
  assert.equal(categoryDocId('Sermon Preview'), 'category-sermon-preview');
  assert.equal(categoryDocId('  sermon   preview '), 'category-sermon-preview');
});

test('a post with no categories produces an empty array, not a broken reference', () => {
  assert.deepEqual(postFromCapture({ ...base, categories: [] }).categories, []);
});

test('an undated post is rejected rather than imported with a wrong date', () => {
  assert.throws(() => postFromCapture({ ...base, publishedDate: '' }), /publishedDate/);
});
