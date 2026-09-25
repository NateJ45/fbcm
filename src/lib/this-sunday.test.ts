// The line's sermon source order (src/lib/this-sunday.ts, 2026-09-24): the
// preview first, else the YouTube broadcast, else nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sermonFromBroadcast, sermonIsExternal, thisSundaySermon } from './this-sunday.ts';
import { parseYoutubeFeed, upcomingBroadcast, type UpcomingBroadcast } from './youtube-feed.ts';
import type { SundaySermon } from './live-sunday.ts';

const FIXTURE = readFileSync(
  new URL('../../tests/fixtures/youtube-feed.xml', import.meta.url),
  'utf8',
);
const THURSDAY = new Date('2026-09-24T16:00:00Z');
const SUNDAY = '2026-09-27';

const preview: SundaySermon = {
  sunday: SUNDAY,
  href: '/post/when-god-shows-up',
  title: '‘When God Shows Up’',
  titleSm: '‘When God Shows Up’',
  titleLg: '‘When God Shows Up’',
  reading: 'Jeremiah 29:10-12',
  readingOnPhone: false,
};
const broadcast: UpcomingBroadcast = {
  videoId: 'g33C2xE88cs',
  sunday: SUNDAY,
  title: 'Grace Enough',
  reading: 'John 3:16',
  series: 'Kingdom Come',
  watchUrl: 'https://www.youtube.com/watch?v=g33C2xE88cs',
};

test('a preview for the Sunday wins over the broadcast', () => {
  assert.equal(thisSundaySermon(SUNDAY, preview, broadcast), preview);
});

test('no preview: the broadcast, shaped by the same length rules, linking to YouTube', () => {
  assert.deepEqual(thisSundaySermon(SUNDAY, null, broadcast), {
    sunday: SUNDAY,
    href: 'https://www.youtube.com/watch?v=g33C2xE88cs',
    title: '‘Grace Enough’',
    titleSm: '‘Grace Enough’',
    titleLg: '‘Grace Enough’',
    reading: 'John 3:16',
    readingOnPhone: true,
  });
});

test('neither: null, and the line stays as it was', () => {
  assert.equal(thisSundaySermon(SUNDAY, null, null), null);
  assert.equal(thisSundaySermon(null, preview, broadcast), null);
});

test('a source for another Sunday is ignored, never trusted', () => {
  const late = { ...preview, sunday: '2026-10-04' };
  assert.equal(thisSundaySermon(SUNDAY, late, broadcast)?.href, broadcast.watchUrl);
  assert.equal(thisSundaySermon(SUNDAY, null, { ...broadcast, sunday: '2026-10-04' }), null);
});

test('the real feed’s long title: cut for a phone, whole from 1024', () => {
  const s = sermonFromBroadcast(upcomingBroadcast(parseYoutubeFeed(FIXTURE), THURSDAY));
  assert.deepEqual(s, {
    sunday: SUNDAY,
    href: 'https://www.youtube.com/watch?v=g33C2xE88cs',
    title: '‘How to Let Your “Yes”…’',
    titleSm: '‘How to Let Your “Yes” Be Yes and Your…’',
    titleLg: '‘How to Let Your “Yes” Be Yes and Your “No,” No’',
    reading: 'Matthew 21:23-32',
    readingOnPhone: false,
  });
});

test('only the YouTube link leaves the site', () => {
  assert.equal(sermonIsExternal({ href: broadcast.watchUrl }), true);
  assert.equal(sermonIsExternal({ href: preview.href }), false);
  assert.equal(sermonFromBroadcast(null), null);
});
