// src/lib/import-post.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { bodyFromCaptureRich } from './import-post-rich.ts';
import {
  postDocId,
  categoryDocId,
  isSermonPreview,
  postFromCapture,
  bodyFromCapture,
  excerptFromCapture,
  coverAltFromCapture,
  decodeEntities,
} from './import-post.ts';

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

test('a non-ASCII slug is preserved byte for byte in the public slug field, never re-slugified', () => {
  const slug = 'händel-s-messiah-sing-in-carols';
  assert.equal(postFromCapture({ ...base, slug }).slug.current, slug);
});

test('the document id is ASCII-only (Sanity rejects non-ASCII _id values) but still deterministic', () => {
  const slug = 'händel-s-messiah-sing-in-carols';
  const id = postDocId(slug);
  // The exact charset @sanity/client's validateDocumentId enforces client-side.
  assert.match(id, /^[a-z0-9_][a-z0-9_.-]{0,127}$/i);
  assert.equal(id, postDocId(slug), 're-running the import must produce the same id');
  // The escape is reversible/identifiable, not a silent drop of the umlaut.
  assert.ok(id.includes('_xe4_'), 'expected an escape for U+00E4 (ä)');
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

// ── The body (2026-09-18) ──────────────────────────────────────────────────
// The capture's 95,016 words were declared on CapturedPost and never read, so
// every one of the 142 live posts was a title, a date and an excerpt. These
// cover the mapper that fixes that, and they also PIN what does not carry:
// no converter is installed, so bodyHtml's headings and links flatten to text.

const richFixture = {
  ...base,
  slug: 'rich',
  title: 'Lessons &amp; Carols',
  bodyHtml:
    '<h2>Advent begins</h2><p>Join us on <a href="https://www.fbcmuncie.org/visit">Sunday</a>' +
    ' for bread &amp; wine.</p>',
  bodyText: 'Advent begins\n\nJoin us on Sunday for bread &amp; wine.',
};

test('the captured body becomes Portable Text, one block per paragraph', () => {
  const body = bodyFromCapture(richFixture);
  assert.equal(body.length, 2);
  assert.equal(body[0]._type, 'block');
  assert.equal(body[0].style, 'normal');
  assert.equal(body[0].children[0].text, 'Advent begins');
  assert.equal(body[1].children[0].text, 'Join us on Sunday for bread & wine.');
});

test('every body block and span carries a _key, and the keys are unique', () => {
  const body = bodyFromCapture(richFixture);
  const keys = body.flatMap((b) => [b._key, ...b.children.map((c) => c._key)]);
  assert.ok(keys.every(Boolean));
  assert.equal(new Set(keys).size, keys.length);
});

test('the body mapper is pure: the same capture gives byte-identical blocks', () => {
  assert.deepEqual(bodyFromCapture(richFixture), bodyFromCapture(richFixture));
});

test('postFromCapture puts the body on the document (journalEntry.body is required)', () => {
  const doc = postFromCapture(richFixture);
  assert.ok(Array.isArray(doc.body));
  assert.ok(doc.body.length >= 1, 'body must satisfy Rule.required().min(1)');
});

// This used to be the plan-1 PIN: a test stating that the heading and the link
// in `bodyHtml` did NOT carry, so that plan 2's converter arrived as a failing
// test rather than a surprise. @portabletext/block-tools landed on 2026-09-20,
// so the pin is flipped: the same fixture, asserting that they DO carry now.
test('the rich mapper carries the heading and the link the plain one dropped', async () => {
  const { blocks } = await bodyFromCaptureRich(richFixture, {
    parseHtml: (html: string) => new JSDOM(html).window.document,
  });
  const heading = blocks[0] as { style?: string; children?: { text: string }[] };
  assert.equal(heading.style, 'h2', 'the <h2> in bodyHtml is a heading, not a paragraph');
  assert.equal(heading.children?.[0].text, 'Advent begins');

  const para = blocks[1] as {
    markDefs?: { _type: string; _key: string; href?: string }[];
    children?: { text: string; marks: string[] }[];
  };
  assert.equal(para.markDefs?.length, 1);
  assert.equal(para.markDefs?.[0]._type, 'link');
  assert.equal(para.markDefs?.[0].href, 'https://www.fbcmuncie.org/visit');
  assert.ok(para.children?.some((c) => c.marks.includes(para.markDefs![0]._key)));
  // And the entity still decodes on the way through.
  assert.ok(
    blocks
      .map((b) => JSON.stringify(b))
      .join('')
      .includes('bread & wine'),
  );
});

test('a capture with no bodyHtml still falls back to the paragraph mapper', async () => {
  const { blocks, report } = await bodyFromCaptureRich(
    { ...richFixture, bodyHtml: '' },
    { parseHtml: (html: string) => new JSDOM(html).window.document },
  );
  assert.equal(report, null, 'no HTML means no conversion report');
  assert.deepEqual(blocks, bodyFromCapture({ ...richFixture, bodyHtml: '' }));
});

test('a post with no captured body produces an empty array rather than a fake block', () => {
  assert.deepEqual(bodyFromCapture({ ...base, bodyText: '   ' }), []);
});

// ── Entities ───────────────────────────────────────────────────────────────

test('HTML entities are decoded once, at the boundary', () => {
  assert.equal(decodeEntities('Advent &amp; Christmas 2024'), 'Advent & Christmas 2024');
  assert.equal(decodeEntities('it&#39;s'), "it's");
  assert.equal(decodeEntities('it&#x27;s'), "it's");
  assert.equal(decodeEntities('&lt;tag&gt;'), '<tag>');
  // An entity we do not know is left exactly as it was, never half-decoded.
  assert.equal(decodeEntities('&fooble;'), '&fooble;');
});

test('the live title "Advent &amp; Christmas 2024" comes out as real text', () => {
  assert.equal(postFromCapture(richFixture).title, 'Lessons & Carols');
});

test('the excerpt is decoded too', () => {
  const doc = postFromCapture({ ...base, excerpt: 'Bread &amp; wine' });
  assert.equal(doc.excerpt, 'Bread & wine');
});

// ── Excerpt length (journalEntry.excerpt is Rule.required().max(220)) ──────

const sentence = (n: number) => `${'word '.repeat(n).trim()}.`;

test('a short excerpt is passed through untouched', () => {
  assert.equal(excerptFromCapture({ ...base, excerpt: 'Short one.' }), 'Short one.');
});

test('a long excerpt is cut at the last sentence boundary at or before 220', () => {
  const long = `${sentence(20)} ${sentence(20)} ${sentence(40)}`;
  const out = excerptFromCapture({ ...base, excerpt: long })!;
  assert.ok(out.length <= 220, `expected <= 220, got ${out.length}`);
  assert.ok(out.endsWith('.'), `expected a sentence end, got "${out.slice(-20)}"`);
  assert.ok(long.startsWith(out), 'the kept text must be a prefix of the original');
});

test('with no sentence boundary it cuts at a word boundary, never mid-word', () => {
  const out = excerptFromCapture({ ...base, excerpt: 'word '.repeat(80).trim() })!;
  assert.ok(out.length <= 220);
  assert.ok(out.endsWith('…'));
  assert.ok(!/\bwor…$/.test(out), 'must not cut inside a word');
  assert.deepEqual(
    out.slice(0, -1).trim().split(' ').filter(Boolean).at(-1),
    'word',
    'the last kept token must be a whole word',
  );
});

test('every captured excerpt fits the schema limit after the transform', () => {
  const out = excerptFromCapture({ ...base, excerpt: 'a'.repeat(400) })!;
  assert.ok(out.length <= 220);
});

// ── Cover alt (journalEntry.coverImage.alt is required) ────────────────────

test('the cover alt falls back to the post title when the capture has none', () => {
  assert.equal(coverAltFromCapture(richFixture), 'Lessons & Carols');
});

test('a captured cover alt wins over the title', () => {
  assert.equal(
    coverAltFromCapture({ ...richFixture, coverImage: { alt: 'Candles on a windowsill' } }),
    'Candles on a windowsill',
  );
});
