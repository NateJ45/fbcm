// The logic behind /api/live-status (src/lib/live-status.ts, 2026-09-24),
// with YouTube mocked. What is proved here: the answer for live, not live, an
// API error, a network failure and no key; that outside the Sunday-morning
// window, and without a key, NOTHING is fetched; which channel is asked; and
// the in-isolate cache (reuse within the TTL, one call for concurrent
// requests, the longer back-off for "unknown").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLiveStatus,
  StatusMemo,
  ttlSeconds,
  uploadsPlaylistId,
  youtubeChannelId,
  UNITS_PER_CHECK,
  type LiveStatusBody,
} from './live-status.ts';

const CHANNEL = 'UCTm6q6Q7OJ6VrURz3YXVP6A';
const settings = {
  serviceTime: 'Sundays at 10:45 am',
  youtubeUrl: 'https://www.youtube.com/c/FbcmuncieOrg',
  livestreamUrl: 'https://www.youtube.com/@FbcmuncieOrg/streams',
};
// Sunday September 27 2026, 10:50 EDT (14:50Z): inside both windows.
const SUNDAY_1050 = new Date('2026-09-27T14:50:00Z');
// The same Sunday at 09:00 EDT: before the check window (from 09:30).
const SUNDAY_0900 = new Date('2026-09-27T13:00:00Z');
// Thursday.
const THURSDAY = new Date('2026-09-24T16:00:00Z');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A fetch that answers the two calls from a script, and records the URLs. */
function mockYouTube(opts: {
  ids?: string[];
  liveId?: string | null;
  playlistStatus?: number;
  videosStatus?: number;
  throws?: boolean;
}) {
  const calls: string[] = [];
  const fetch = async (url: string): Promise<Response> => {
    calls.push(url);
    if (opts.throws) throw new TypeError('network down');
    if (url.includes('/playlistItems')) {
      if (opts.playlistStatus && opts.playlistStatus !== 200) {
        return json({ error: { errors: [{ reason: 'quotaExceeded' }] } }, opts.playlistStatus);
      }
      const ids = opts.ids ?? ['aaaaaaaaaaa', 'bbbbbbbbbbb'];
      return json({ items: ids.map((videoId) => ({ contentDetails: { videoId } })) });
    }
    if (url.includes('/videos')) {
      if (opts.videosStatus && opts.videosStatus !== 200) return json({}, opts.videosStatus);
      const ids = new URL(url).searchParams.get('id')!.split(',');
      return json({
        items: ids.map((id) => ({
          id,
          snippet: { liveBroadcastContent: id === opts.liveId ? 'live' : 'none' },
        })),
      });
    }
    throw new Error(`unexpected ${url}`);
  };
  return { fetch, calls };
}

const run = (now: Date, fetch: (u: string) => Promise<Response>, key: string | null = 'k-123') =>
  computeLiveStatus({ now, key, settings, fetch });

// ── the answers ─────────────────────────────────────────────────────────────

test('live: the channel has a broadcast on air, and its URL comes back', async () => {
  const yt = mockYouTube({ liveId: 'bbbbbbbbbbb' });
  const body = await run(SUNDAY_1050, yt.fetch);
  assert.equal(body.status, 'live');
  assert.equal(body.url, 'https://www.youtube.com/watch?v=bbbbbbbbbbb');
  assert.equal(yt.calls.length, UNITS_PER_CHECK, 'two 1-unit calls, never search.list');
  assert.ok(yt.calls.every((u) => !u.includes('/search')));
  // The uploads playlist of the church's channel, with the key.
  const first = new URL(yt.calls[0]!);
  assert.equal(first.searchParams.get('playlistId'), uploadsPlaylistId(CHANNEL));
  assert.equal(first.searchParams.get('key'), 'k-123');
});

test('not live: recent uploads, none of them on air', async () => {
  const yt = mockYouTube({ liveId: null });
  const body = await run(SUNDAY_1050, yt.fetch);
  assert.deepEqual({ status: body.status, url: body.url }, { status: 'not-live', url: undefined });
});

test('not live: an empty uploads playlist needs only the one call', async () => {
  const yt = mockYouTube({ ids: [] });
  assert.equal((await run(SUNDAY_1050, yt.fetch)).status, 'not-live');
  assert.equal(yt.calls.length, 1);
});

test('API error: unknown, with the reason YouTube gave', async () => {
  const yt = mockYouTube({ playlistStatus: 403 });
  const body = await run(SUNDAY_1050, yt.fetch);
  assert.equal(body.status, 'unknown');
  assert.equal(body.reason, 'youtube-403-quotaExceeded');
  const yt2 = mockYouTube({ videosStatus: 500 });
  assert.equal((await run(SUNDAY_1050, yt2.fetch)).reason, 'youtube-500');
});

test('network failure: unknown, never a throw', async () => {
  const body = await run(SUNDAY_1050, mockYouTube({ throws: true }).fetch);
  assert.equal(body.status, 'unknown');
  assert.equal(body.reason, 'youtube-unreachable');
});

test('no key: unknown, and nothing is fetched (the site behaves as before)', async () => {
  for (const key of [null, '', '   ']) {
    const yt = mockYouTube({ liveId: 'aaaaaaaaaaa' });
    const body = await run(SUNDAY_1050, yt.fetch, key);
    assert.equal(body.status, 'unknown');
    assert.equal(body.reason, 'no-key');
    assert.equal(yt.calls.length, 0);
  }
});

test('outside the Sunday-morning window: not live, and YouTube is never called', async () => {
  for (const now of [THURSDAY, SUNDAY_0900, new Date('2026-09-27T17:00:00Z') /* 1:00 pm */]) {
    const yt = mockYouTube({ liveId: 'aaaaaaaaaaa' });
    const body = await run(now, yt.fetch);
    assert.equal(body.status, 'not-live', now.toISOString());
    assert.equal(body.reason, 'outside-window');
    assert.equal(yt.calls.length, 0, now.toISOString());
  }
});

test('the check window opens 75 minutes early, in winter time too', async () => {
  // 9:30 EDT is 13:30Z; 9:30 EST (December) is 14:30Z.
  const yt = mockYouTube({ liveId: null });
  assert.equal((await run(new Date('2026-09-27T13:30:00Z'), yt.fetch)).reason, undefined);
  assert.equal(yt.calls.length, 2);
  const winter = mockYouTube({ liveId: null });
  assert.equal(
    (await run(new Date('2026-12-06T14:29:00Z'), winter.fetch)).reason,
    'outside-window',
  );
  assert.equal((await run(new Date('2026-12-06T14:30:00Z'), winter.fetch)).status, 'not-live');
  assert.equal(winter.calls.length, 2);
});

test('an unreadable service time or an unknown channel is unknown, with no call', async () => {
  const yt = mockYouTube({ liveId: 'aaaaaaaaaaa' });
  const noTime = await computeLiveStatus({
    now: SUNDAY_1050,
    key: 'k',
    settings: { ...settings, serviceTime: 'Mid-morning' },
    fetch: yt.fetch,
  });
  assert.equal(noTime.reason, 'no-service-time');
  const otherChannel = await computeLiveStatus({
    now: SUNDAY_1050,
    key: 'k',
    settings: {
      ...settings,
      youtubeUrl: 'https://www.youtube.com/@SomeoneElse',
      livestreamUrl: '',
    },
    fetch: yt.fetch,
  });
  assert.equal(otherChannel.reason, 'no-channel');
  assert.equal(yt.calls.length, 0);
});

// ── the channel ─────────────────────────────────────────────────────────────

test('the channel id from each form of settings URL', () => {
  assert.equal(youtubeChannelId('https://www.youtube.com/c/FbcmuncieOrg'), CHANNEL);
  assert.equal(youtubeChannelId('https://www.youtube.com/@FbcmuncieOrg/streams'), CHANNEL);
  assert.equal(youtubeChannelId('https://youtube.com/@fbcmuncieorg'), CHANNEL);
  assert.equal(
    youtubeChannelId('https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv/live'),
    'UCabcdefghijklmnopqrstuv',
  );
  assert.equal(youtubeChannelId('https://www.youtube.com/@SomeoneElse'), null);
  assert.equal(youtubeChannelId('https://vimeo.com/fbcm', null, undefined), null);
  // The first URL that names a channel wins; a stega payload is cleaned first.
  assert.equal(youtubeChannelId('', 'https://www.youtube.com/c/FbcmuncieOrg​﻿'), CHANNEL);
  assert.equal(uploadsPlaylistId(CHANNEL), 'UUTm6q6Q7OJ6VrURz3YXVP6A');
});

// ── the cache ───────────────────────────────────────────────────────────────

const body = (status: LiveStatusBody['status']): LiveStatusBody => ({
  status,
  checkedAt: 'x',
});

test('ttl: 90 s for a real answer, 5 minutes for unknown', () => {
  assert.equal(ttlSeconds(body('live')), 90);
  assert.equal(ttlSeconds(body('not-live')), 90);
  assert.equal(ttlSeconds(body('unknown')), 300);
});

test('the memo reuses an answer for its TTL, then asks again', async () => {
  const memo = new StatusMemo();
  let computed = 0;
  const compute = async () => {
    computed += 1;
    return body('live');
  };
  const t0 = 1_000_000;
  await memo.get(t0, compute);
  await memo.get(t0 + 89_000, compute);
  assert.equal(computed, 1, 'within 90 s: cached');
  await memo.get(t0 + 90_000, compute);
  assert.equal(computed, 2, 'at 90 s: refreshed');
});

test('the memo holds an unknown answer for 5 minutes (back-off)', async () => {
  const memo = new StatusMemo();
  let computed = 0;
  const compute = async () => {
    computed += 1;
    return body('unknown');
  };
  await memo.get(0, compute);
  await memo.get(299_000, compute);
  assert.equal(computed, 1);
  await memo.get(300_000, compute);
  assert.equal(computed, 2);
});

test('concurrent requests during a refresh share ONE YouTube call', async () => {
  const memo = new StatusMemo();
  const yt = mockYouTube({ liveId: 'aaaaaaaaaaa' });
  const compute = () => run(SUNDAY_1050, yt.fetch);
  const answers = await Promise.all(Array.from({ length: 20 }, () => memo.get(5, compute)));
  assert.equal(yt.calls.length, UNITS_PER_CHECK, '20 visitors, one refresh');
  assert.ok(answers.every((a) => a.status === 'live'));
});

test('a failed refresh does not wedge the memo', async () => {
  const memo = new StatusMemo();
  await assert.rejects(
    memo.get(0, async () => {
      throw new Error('boom');
    }),
  );
  assert.equal((await memo.get(1, async () => body('not-live'))).status, 'not-live');
});
