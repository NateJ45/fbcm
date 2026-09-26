import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  siteFileUrl,
  rewriteFileUrls,
  hasFileUrl,
  upstreamFileUrl,
  downloadName,
} from './file-url.ts';

const P = '7jw947g5';
const D = 'production';
const NAME = '0123456789abcdef0123456789abcdef01234567.pdf';
const CDN = `https://cdn.sanity.io/files/${P}/${D}/${NAME}`;

test('a file of this project and dataset moves to /files', () => {
  assert.equal(siteFileUrl(CDN, P, D), `/files/${NAME}`);
  assert.equal(
    siteFileUrl(`${CDN}?dl=The Visitor.pdf`, P, D),
    `/files/${NAME}?dl=The%20Visitor.pdf`,
  );
});

test('anything else is left alone', () => {
  assert.equal(
    siteFileUrl(`https://cdn.sanity.io/files/other/${D}/${NAME}`, P, D),
    `https://cdn.sanity.io/files/other/${D}/${NAME}`,
  );
  assert.equal(
    siteFileUrl(`https://cdn.sanity.io/files/${P}/staging/${NAME}`, P, D),
    `https://cdn.sanity.io/files/${P}/staging/${NAME}`,
  );
  const img = `https://cdn.sanity.io/images/${P}/${D}/abc-800x600.jpg`;
  assert.equal(siteFileUrl(img, P, D), img);
  assert.equal(siteFileUrl('/visitor', P, D), '/visitor');
  assert.equal(
    siteFileUrl(`https://cdn.sanity.io/files/${P}/${D}/../../x.pdf`, P, D),
    `https://cdn.sanity.io/files/${P}/${D}/../../x.pdf`,
  );
});

test('a whole query result is rewritten, keys and other values untouched', () => {
  const doc = {
    _id: 'x',
    docs: [{ title: 'Spring', fileUrl: CDN, fileSize: 12 }],
    note: CDN + ' in a sentence',
  };
  assert.ok(hasFileUrl(doc));
  assert.deepEqual(rewriteFileUrls(doc, P, D), {
    _id: 'x',
    docs: [{ title: 'Spring', fileUrl: `/files/${NAME}`, fileSize: 12 }],
    note: CDN + ' in a sentence',
  });
  assert.equal(hasFileUrl({ a: 'b' }), false);
});

test('the route only ever fetches this project’s files', () => {
  assert.equal(upstreamFileUrl(NAME, P, D), CDN);
  assert.equal(upstreamFileUrl('../secrets.pdf', P, D), null);
  assert.equal(upstreamFileUrl('abc.pdf', P, D), null);
});

test('a download name is made safe for the header', () => {
  assert.equal(downloadName(null), '');
  assert.equal(downloadName('The Visitor "Spring".pdf\r\nX: y'), 'The Visitor _Spring_.pdf__X_ y');
});

test('only document types are served; a script-capable file is never rewritten or fetched', async () => {
  const { fileType } = await import('./file-url.ts');
  for (const ext of ['html', 'htm', 'svg', 'js', 'xml', 'xhtml']) {
    const name = `0123456789abcdef0123456789abcdef01234567.${ext}`;
    const url = `https://cdn.sanity.io/files/${P}/${D}/${name}`;
    assert.equal(siteFileUrl(url, P, D), url, ext);
    assert.equal(upstreamFileUrl(name, P, D), null, ext);
  }
  assert.equal(fileType(NAME), 'application/pdf');
});
