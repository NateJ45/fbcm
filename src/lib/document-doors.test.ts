// src/lib/document-doors.test.ts
// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROW_LIMIT, docAction, documentForm, fileExtension, linkHost } from './document-doors.ts';

const RUN = '​​​​‌‍﻿​‌‍﻿​';

test('one to four documents are doors; more, or none, are a register', () => {
  assert.equal(ROW_LIMIT, 4);
  assert.equal(documentForm(1), 'rows');
  assert.equal(documentForm(3), 'rows');
  assert.equal(documentForm(4), 'rows');
  assert.equal(documentForm(5), 'register');
  assert.equal(documentForm(42), 'register');
  assert.equal(documentForm(0), 'register');
});

test('the extension comes off the path, not the query', () => {
  assert.equal(fileExtension('https://cdn.sanity.io/files/p/d/abc.pdf'), 'PDF');
  assert.equal(fileExtension('https://cdn.sanity.io/files/p/d/abc.pdf?dl=x.zip'), 'PDF');
  assert.equal(fileExtension('https://cdn.sanity.io/files/p/d/abc.DOCX#page=2'), 'DOCX');
  assert.equal(fileExtension('https://cdn.sanity.io/files/p/d/abc'), null);
  assert.equal(fileExtension('https://example.com/a.verylong'), null);
});

test('the host drops www. and a church subdomain', () => {
  assert.equal(
    linkHost('https://fbcmuncie.churchcenter.com/people/forms/243785'),
    'churchcenter.com',
  );
  assert.equal(linkHost('https://www.amazon.com/We-Are-Clay/dp/1087276802'), 'amazon.com');
  assert.equal(linkHost('https://amazon.com/x'), 'amazon.com');
  assert.equal(linkHost('https://www.bbc.co.uk/news'), 'bbc.co.uk');
  assert.equal(linkHost('/wedding#reserve'), null);
  assert.equal(linkHost('not a url'), null);
});

test('a file downloads, a link opens, and nothing is no button', () => {
  assert.deepEqual(docAction({ fileUrl: 'https://cdn.sanity.io/files/p/d/a.pdf' }), {
    href: 'https://cdn.sanity.io/files/p/d/a.pdf',
    kind: 'file',
    label: 'Download PDF',
  });
  assert.deepEqual(docAction({ url: 'https://fbcmuncie.churchcenter.com/people/forms/520312' }), {
    href: 'https://fbcmuncie.churchcenter.com/people/forms/520312',
    kind: 'link',
    label: 'Open on churchcenter.com',
  });
  assert.equal(docAction({}), null);
  assert.equal(docAction({ fileUrl: '  ', url: null }), null);
});

test('a file wins over a link when a document has both', () => {
  const a = docAction({ fileUrl: 'https://cdn.sanity.io/files/p/d/a.pdf', url: 'https://x.org' });
  assert.equal(a?.kind, 'file');
});

test('a relative link still opens, with a plain label', () => {
  assert.deepEqual(docAction({ url: '/history' }), {
    href: '/history',
    kind: 'link',
    label: 'Open',
  });
});

test('stega-safe: an invisible run is removed before the URL is read', () => {
  const a = docAction({ url: `https://www.amazon.com/x${RUN}` });
  assert.equal(a?.href, 'https://www.amazon.com/x');
  assert.equal(a?.label, 'Open on amazon.com');
});
