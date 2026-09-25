// src/lib/footer-pages.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withFooterPages } from './footer-pages.ts';

const RUN = '​​​​‌‍﻿​‌‍﻿​';
const columns = [
  {
    title: 'Pages',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Elsewhere',
    links: [{ label: 'Church Center', href: 'https://x.org', external: true }],
  },
];

test('a switched-on page joins the first column, after its links', () => {
  const out = withFooterPages(columns, [{ title: 'The Visitor', slug: 'visitor' }]);
  assert.deepEqual(
    out[0].links.map((l) => [l.label, l.href]),
    [
      ['Blog', '/blog'],
      ['Contact', '/contact'],
      ['The Visitor', '/visitor'],
    ],
  );
  assert.equal(out[1], columns[1]);
});

test('a page some column already links to is not added twice', () => {
  const out = withFooterPages(columns, [{ title: 'Blog', slug: 'blog' }]);
  assert.equal(out, columns);
  const trailing = withFooterPages(
    [{ title: 'Pages', links: [{ label: 'The Visitor', href: '/visitor/' }] }],
    [{ title: 'The Visitor', slug: 'visitor' }],
  );
  assert.equal(trailing[0].links.length, 1);
});

test('the menu label wins over the title, and stega never decides', () => {
  const out = withFooterPages(columns, [
    { title: `The Visitor newsletter${RUN}`, navLabel: `The Visitor${RUN}`, slug: `visitor${RUN}` },
  ]);
  assert.deepEqual(out[0].links.at(-1), { label: 'The Visitor', href: '/visitor' });
});

test('no columns, no slug or no name: nothing changes', () => {
  assert.deepEqual(withFooterPages([], [{ title: 'X', slug: 'x' }]), []);
  assert.equal(withFooterPages(columns, [{ title: 'X' }, { slug: 'y' }, null]), columns);
});
