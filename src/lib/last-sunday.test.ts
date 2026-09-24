// The build-time read (src/lib/last-sunday.ts): every way the feed can fail
// turns into null, so the band is absent and the build carries on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { feedUrl, fetchFeed, loadLastSunday, thumbnailExists } from './last-sunday.ts';

const FIXTURE = readFileSync(
  new URL('../../tests/fixtures/youtube-feed.xml', import.meta.url),
  'utf8',
);
const THURSDAY = new Date('2026-09-24T12:00:00Z');
const SETTINGS = { youtubeUrl: 'https://www.youtube.com/c/FbcmuncieOrg' };

const respond =
  (body: string, status = 200) =>
  async () =>
    new Response(body, { status });

test('the feed URL is the public channel feed', () => {
  assert.equal(
    feedUrl('UCTm6q6Q7OJ6VrURz3YXVP6A'),
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCTm6q6Q7OJ6VrURz3YXVP6A',
  );
});

test('fetchFeed returns the XML on success', async () => {
  const seen: string[] = [];
  const xml = await fetchFeed('UCTm6q6Q7OJ6VrURz3YXVP6A', async (url) => {
    seen.push(url);
    return new Response(FIXTURE);
  });
  assert.equal(xml, FIXTURE);
  assert.deepEqual(seen, [feedUrl('UCTm6q6Q7OJ6VrURz3YXVP6A')]);
});

test('fetchFeed: a 404, a 500, an HTML error page, a network error and a timeout are all null', async () => {
  assert.equal(await fetchFeed('UCx', respond('Not found', 404)), null);
  assert.equal(await fetchFeed('UCx', respond(FIXTURE, 500)), null);
  assert.equal(await fetchFeed('UCx', respond('<html>Sorry</html>')), null);
  assert.equal(
    await fetchFeed('UCx', async () => {
      throw new TypeError('fetch failed');
    }),
    null,
  );
  const hang = (_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    });
  assert.equal(await fetchFeed('UCx', hang, 20), null);
});

test('thumbnailExists asks with HEAD and reads the status', async () => {
  let method = '';
  assert.equal(
    await thumbnailExists('https://i.ytimg.com/vi/x/sddefault.jpg', async (_u, init) => {
      method = init?.method ?? '';
      return new Response(null, { status: 200 });
    }),
    true,
  );
  assert.equal(method, 'HEAD');
  assert.equal(await thumbnailExists('u', respond('', 404)), false);
});

test('loadLastSunday: the recording from Site settings’ channel, and whether the 640 thumbnail exists', async () => {
  const urls: string[] = [];
  const rec = await loadLastSunday(SETTINGS, THURSDAY, {
    fetchImpl: async (url) => {
      urls.push(url);
      return url.includes('feeds/videos.xml')
        ? new Response(FIXTURE)
        : new Response(null, { status: 404 });
    },
  });
  assert.equal(rec?.videoId, 'y435wOf6Tgc');
  assert.equal(rec?.hasLarge, false);
  assert.deepEqual(urls, [
    feedUrl('UCTm6q6Q7OJ6VrURz3YXVP6A'),
    'https://i.ytimg.com/vi/y435wOf6Tgc/sddefault.jpg',
  ]);
});

test('loadLastSunday: no channel in Site settings, or a failed feed, is null and makes no guess', async () => {
  let calls = 0;
  const counting = async () => {
    calls += 1;
    return new Response(FIXTURE);
  };
  assert.equal(
    await loadLastSunday({ youtubeUrl: 'https://example.com' }, THURSDAY, { fetchImpl: counting }),
    null,
  );
  assert.equal(await loadLastSunday(null, THURSDAY, { fetchImpl: counting }), null);
  assert.equal(calls, 0);
  assert.equal(await loadLastSunday(SETTINGS, THURSDAY, { fetchImpl: respond('', 503) }), null);
});

test('loadLastSunday with a given feed (the test seam) never fetches', async () => {
  const rec = await loadLastSunday(null, THURSDAY, {
    xml: FIXTURE,
    fetchImpl: async () => {
      throw new Error('must not fetch');
    },
  });
  assert.equal(rec?.sunday, '2026-09-20');
  assert.equal(await loadLastSunday(null, THURSDAY, { xml: null }), null);
});
