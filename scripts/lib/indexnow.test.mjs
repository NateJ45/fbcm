import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSitemapIndex, keyGate, sitemapLocs, submissions, urlsForHost } from './indexnow.mjs';

const KEY = '1aadd9425437cc7a001d23cbec702fef';
const SITE = 'https://www.fbcmuncie.org';

test('sitemapLocs reads an index and a urlset, decoding entities', () => {
  const index =
    '<?xml version="1.0"?><sitemapindex xmlns="x"><sitemap><loc>https://www.fbcmuncie.org/sitemap-0.xml</loc></sitemap></sitemapindex>';
  assert.equal(isSitemapIndex(index), true);
  assert.deepEqual(sitemapLocs(index), ['https://www.fbcmuncie.org/sitemap-0.xml']);
  const set =
    '<urlset><url><loc>https://www.fbcmuncie.org/</loc></url><url><loc> https://www.fbcmuncie.org/a?b=1&amp;c=2 </loc></url></urlset>';
  assert.equal(isSitemapIndex(set), false);
  assert.deepEqual(sitemapLocs(set), [
    'https://www.fbcmuncie.org/',
    'https://www.fbcmuncie.org/a?b=1&c=2',
  ]);
  assert.deepEqual(sitemapLocs(''), []);
});

test('the gate stays shut until the production host serves exactly the key', () => {
  assert.equal(keyGate(null, KEY).ready, false);
  // Wix today: an unknown path is a 404.
  assert.equal(keyGate({ status: 404, body: 'Not found' }, KEY).ready, false);
  // A host that answers every path with a 200 HTML page is not serving the key.
  assert.equal(keyGate({ status: 200, body: '<!doctype html><html>' }, KEY).ready, false);
  assert.match(keyGate({ status: 200, body: '<html>' }, KEY).why, /not the key/);
  // The new site: the key, perhaps with a trailing newline.
  assert.deepEqual(keyGate({ status: 200, body: `${KEY}\n` }, KEY), {
    ready: true,
    why: 'the production host serves the key',
  });
});

test('only the site’s own host goes in a submission, each URL once', () => {
  assert.deepEqual(
    urlsForHost(
      [
        'https://www.fbcmuncie.org/',
        'https://fbcmuncie.org/visit',
        'https://fbcm-site.nathanjnixon86.workers.dev/visit',
        'not a url',
        'https://www.fbcmuncie.org/visit',
        'https://www.fbcmuncie.org/visit',
      ],
      SITE,
    ),
    ['https://www.fbcmuncie.org/', 'https://www.fbcmuncie.org/visit'],
  );
});

test('submissions name the host, the key and its root location, 10,000 URLs at most', () => {
  const urls = Array.from({ length: 10_001 }, (_, i) => `${SITE}/p${i}`);
  const bodies = submissions(urls, SITE, KEY);
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].host, 'www.fbcmuncie.org');
  assert.equal(bodies[0].key, KEY);
  assert.equal(bodies[0].keyLocation, `${SITE}/${KEY}.txt`);
  assert.equal(bodies[0].urlList.length, 10_000);
  assert.deepEqual(bodies[1].urlList, [`${SITE}/p10000`]);
  assert.deepEqual(submissions([], SITE, KEY), []);
});
