// Tests for the page-images manifest helpers: which entries a dry run may
// resolve without uploading, and what the refusal tells the operator.
// Run: node --test scripts/lib/page-images.test.mjs   (or `npm run test:scripts`)
//
// Plain data: the asset map is passed in, so no .env, no Sanity, no network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alreadyUploaded, cachePath, unuploadedMessage } from './page-images.mjs';

const manifest = {
  lib: { library: '08181c_aaaa_tilde_mv2.jpg', alt: 'A library photo' },
  cached: { file: '08181c_bbbb_tilde_mv2.jpg', alt: 'Uploaded from this checkout' },
  uncached: { file: '08181c_cccc_tilde_mv2.jpg', alt: 'Never uploaded' },
  logo: { file: '08181c_dddd_tilde_mv2.png', alt: 'A logo', format: 'png' },
  aliasCached: { same: 'cached', alt: 'The cached photo, other alt' },
  aliasUncached: { same: 'uncached', alt: 'The uncached photo, other alt' },
};
const map = {
  'scripts/.page-images/cached.jpg': 'image-bbbb-2400x1600-jpg',
  'scripts/.page-images/logo.png': 'image-dddd-800x400-png',
};

test('a library entry never uploads, so it counts as done', () => {
  assert.equal(alreadyUploaded(manifest, 'lib', {}), true);
});

test('a file entry is done only when the asset map holds its cache path', () => {
  assert.equal(alreadyUploaded(manifest, 'cached', map), true);
  assert.equal(alreadyUploaded(manifest, 'uncached', map), false);
  assert.equal(alreadyUploaded(manifest, 'cached', {}), false);
  assert.equal(alreadyUploaded(manifest, 'logo', map), true);
});

test('an alias is judged by its target, under the target key', () => {
  assert.equal(cachePath(manifest, 'aliasCached'), 'scripts/.page-images/cached.jpg');
  assert.equal(alreadyUploaded(manifest, 'aliasCached', map), true);
  assert.equal(alreadyUploaded(manifest, 'aliasUncached', map), false);
});

test('an unknown key throws rather than counting as done', () => {
  assert.throws(() => alreadyUploaded(manifest, 'missing', map), /no manifest entry "missing"/);
});

test('the refusal names the asset-map key, the filename and the way out', () => {
  const msg = unuploadedMessage('aliasUncached', cachePath(manifest, 'aliasUncached'));
  assert.match(msg, /"aliasUncached"/);
  assert.match(msg, /"scripts\/\.page-images\/uncached\.jpg": "<asset id>"/);
  assert.match(msg, /originalFilename=="uncached\.jpg"/);
  assert.match(msg, /--apply/);
  assert.match(msg, /docs\/PENDING\.md/);
});
