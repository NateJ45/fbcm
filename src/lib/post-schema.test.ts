// scaffold-file: journal
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blogPostingNode } from './post-schema.ts';
import { validateNode } from './schema-vocab.ts';
import type { SiteFacts } from './church-schema.ts';

const SITE: SiteFacts = { url: 'https://www.fbcmuncie.org', name: 'First Baptist Church Muncie' };
const block = (text: string) => ({
  _type: 'block',
  style: 'normal',
  children: [{ _type: 'span', text }],
});

const PREVIEW = {
  title: 'Sermon Preview: Love Made Visible',
  slug: { current: 'sermon-preview-love-made-visible' },
  excerpt: 'This Sunday we continue our series.',
  author: 'Pastor Jonathan Balmer',
  // Thursday 24 September 2026, 10 am in Muncie
  publishedAt: '2026-09-24T14:00:00Z',
  categories: [{ title: 'Sermon Preview', slug: { current: 'sermon-preview' } }],
  tags: ['1 John'],
  body: [block('This Sunday we read 1 John 4:7-12 together.'), block('Join us at 10:45.')],
};

test('a sermon preview is about its Sunday and cites its reading', () => {
  const node = blogPostingNode(PREVIEW, SITE, {
    cardUrl: 'https://www.fbcmuncie.org/og/post-sermon-preview-love-made-visible.png',
    coverUrl: 'https://cdn.sanity.io/images/x/y/cover.webp',
  });
  assert.equal(node['@type'], 'BlogPosting');
  assert.deepEqual(node.image, [
    'https://www.fbcmuncie.org/og/post-sermon-preview-love-made-visible.png',
    'https://cdn.sanity.io/images/x/y/cover.webp',
  ]);
  assert.deepEqual(node.author, { '@type': 'Person', name: 'Pastor Jonathan Balmer' });
  assert.deepEqual(node.publisher, { '@id': 'https://www.fbcmuncie.org/#church' });
  assert.equal((node.about as { startDate: string }).startDate, '2026-09-27');
  assert.deepEqual(node.citation, {
    '@type': 'CreativeWork',
    name: '1 John 4:7-12',
    isPartOf: { '@type': 'Book', name: 'The Bible' },
  });
  assert.equal(node.articleSection, 'Sermon Preview');
  assert.equal(node.keywords, 'Sermon Preview, 1 John');
  assert.deepEqual(validateNode(node), []);
});

test('an ordinary post has no about or citation, and the church as author when none is named', () => {
  const node = blogPostingNode(
    {
      ...PREVIEW,
      title: 'Trunk or Treat',
      author: null,
      categories: [{ title: 'FBCM Events' }],
      body: [block('Bring the kids, John 3:16 is on the banner.')],
    },
    SITE,
    { cardUrl: 'https://www.fbcmuncie.org/og/post-x.png' },
  );
  assert.ok(!('about' in node));
  assert.ok(!('citation' in node));
  assert.deepEqual(node.author, { '@id': 'https://www.fbcmuncie.org/#church' });
  assert.deepEqual(validateNode(node), []);
});

test('a headline over 110 characters is cut at a word', () => {
  const long = 'Word '.repeat(40).trim();
  const node = blogPostingNode({ ...PREVIEW, title: long }, SITE, {
    cardUrl: 'https://x.org/a.png',
  });
  const h = node.headline as string;
  assert.ok(h.length <= 110, `${h.length}`);
  assert.ok(h.endsWith('Word…'));
});

test('a preview with no reading found cites nothing (never guessed)', () => {
  const node = blogPostingNode({ ...PREVIEW, body: [block('No passage named here.')] }, SITE, {
    cardUrl: 'https://x.org/a.png',
  });
  assert.ok(!('citation' in node));
  assert.ok('about' in node);
});
