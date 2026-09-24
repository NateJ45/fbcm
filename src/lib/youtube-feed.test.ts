// The feed parser and the "last Sunday" pick, against a trimmed copy of the
// church's real feed (tests/fixtures/youtube-feed.xml, taken 2026-09-24: the
// upcoming September 27 broadcast plus the September 20, 13 and 6 replays).
// Times are UTC with the church's wall clock beside them (EDT, UTC-4).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  churchDay,
  decodeXml,
  lastSundayRecording,
  parseYoutubeFeed,
  preacherOf,
  recordingSunday,
  splitVideoTitle,
  sundayLabel,
  thumbnailUrl,
  type FeedEntry,
} from './youtube-feed.ts';

const FIXTURE = readFileSync(
  new URL('../../tests/fixtures/youtube-feed.xml', import.meta.url),
  'utf8',
);
// Thursday 2026-09-24, 8:00 am church time.
const THURSDAY = new Date('2026-09-24T12:00:00Z');

test('parses every entry of the real feed, decoded', () => {
  const entries = parseYoutubeFeed(FIXTURE);
  assert.equal(entries.length, 4);
  assert.deepEqual(entries[0], {
    videoId: 'g33C2xE88cs',
    title: "How to Let Your 'Yes' Be Yes and Your 'No,' No - Matthew 21:23-32 - Kingdom Come",
    published: '2026-09-23T18:03:21+00:00',
    views: 0,
    description: "This week's Sermon.\nPreaching: Rev. Jonathan Balmer",
  });
  assert.equal(entries[1]?.views, 28);
});

test('an unavailable or broken feed parses to nothing', () => {
  assert.deepEqual(parseYoutubeFeed(null), []);
  assert.deepEqual(parseYoutubeFeed(''), []);
  assert.deepEqual(parseYoutubeFeed('<html><body>Service Unavailable</body></html>'), []);
  // An entry without a usable id or date is dropped, not guessed at.
  assert.deepEqual(
    parseYoutubeFeed(
      '<feed><entry><yt:videoId>nope</yt:videoId><title>x</title><published>2026-09-20</published></entry></feed>',
    ),
    [],
  );
});

test('decodeXml handles named, decimal and hex entities and CDATA', () => {
  assert.equal(
    decodeXml('A &amp; B &quot;C&quot; &#39;d&#39; &#x2019; &bogus;'),
    'A & B "C" \'d\' ’ &bogus;',
  );
  assert.equal(decodeXml('<![CDATA[Grace & peace]]>'), 'Grace & peace');
});

test('the church day of an instant, across midnight and daylight saving', () => {
  // 12:13 am Monday EDT.
  assert.deepEqual(churchDay(new Date('2026-09-21T04:13:44Z')), { iso: '2026-09-21', weekday: 1 });
  // 11:30 pm Sunday EST (UTC-5): still Sunday in Muncie, Monday in UTC.
  assert.deepEqual(churchDay(new Date('2026-12-07T04:30:00Z')), { iso: '2026-12-06', weekday: 0 });
  assert.equal(churchDay(new Date('nope')), null);
});

test('a recording belongs to the Sunday it was published on, or the Sunday before a Monday', () => {
  assert.equal(recordingSunday('2026-09-21T04:13:44+00:00'), '2026-09-20'); // Mon 12:13 am
  assert.equal(recordingSunday('2026-07-05T16:14:48+00:00'), '2026-07-05'); // Sun 12:14 pm
  assert.equal(recordingSunday('2026-09-23T18:03:21+00:00'), null); // Wednesday
  assert.equal(recordingSunday('2026-09-22T03:59:00+00:00'), '2026-09-20'); // Mon 11:59 pm
  assert.equal(recordingSunday('2026-09-22T04:00:00+00:00'), null); // Tue 12:00 am
});

test('picks September 20, skipping next Sunday’s scheduled broadcast', () => {
  const rec = lastSundayRecording(parseYoutubeFeed(FIXTURE), THURSDAY);
  assert.deepEqual(rec, {
    videoId: 'y435wOf6Tgc',
    sunday: '2026-09-20',
    title: 'Unequal Opportunity Grace',
    reading: 'Matthew 20:1-16',
    series: 'Kingdom Come',
    preacher: 'Rev. Jonathan Balmer',
    watchUrl: 'https://www.youtube.com/watch?v=y435wOf6Tgc',
  });
});

test('a scheduled broadcast (no views) never counts, even published on a Monday', () => {
  const entries: FeedEntry[] = [
    {
      videoId: 'aaaaaaaaaaa',
      title: 'Next - John 3:16 - S',
      published: '2026-09-21T15:00:00Z',
      views: 0,
      description: '',
    },
    {
      videoId: 'bbbbbbbbbbb',
      title: 'Last - Mark 1:1 - S',
      published: '2026-09-14T04:00:00Z',
      views: 12,
      description: '',
    },
  ];
  assert.equal(lastSundayRecording(entries, THURSDAY)?.videoId, 'bbbbbbbbbbb');
});

test('nothing newer than now, nothing older than three weeks', () => {
  const entries = parseYoutubeFeed(FIXTURE);
  // On Saturday September 19 the newest replay is September 13's.
  assert.equal(
    lastSundayRecording(entries, new Date('2026-09-19T16:00:00Z'))?.sunday,
    '2026-09-13',
  );
  // Four weeks on, the church has stopped streaming: no "last Sunday" at all.
  assert.equal(lastSundayRecording(entries, new Date('2026-10-15T16:00:00Z')), null);
  assert.equal(lastSundayRecording([], THURSDAY), null);
});

test('two videos for one Sunday: the one with a reading wins', () => {
  const entries: FeedEntry[] = [
    {
      videoId: 'ccccccccccc',
      title: 'Children’s choir',
      published: '2026-09-21T05:00:00Z',
      views: 5,
      description: '',
    },
    {
      videoId: 'ddddddddddd',
      title: 'Grace - Romans 8:1-11 - Good Grace',
      published: '2026-09-21T04:00:00Z',
      views: 30,
      description: '',
    },
  ];
  assert.equal(lastSundayRecording(entries, THURSDAY)?.videoId, 'ddddddddddd');
});

test('splits the church’s title pattern', () => {
  assert.deepEqual(splitVideoTitle('Forgiven to Forgive - Matthew 18:21-35 - Kingdom Come'), {
    title: 'Forgiven to Forgive',
    reading: 'Matthew 18:21-35',
    series: 'Kingdom Come',
  });
  assert.deepEqual(
    splitVideoTitle('Wrestling with God - Genesis 32:22-31 / (Romans 9:1-5) - Good News for All'),
    {
      title: 'Wrestling with God',
      reading: 'Genesis 32:22-31; Romans 9:1-5',
      series: 'Good News for All',
    },
  );
  assert.deepEqual(
    splitVideoTitle(
      'Life Together - Romans 1:7-13  - Tech Wise: Being Human In A Technological Age',
    ),
    {
      title: 'Life Together',
      reading: 'Romans 1:7-13',
      series: 'Tech Wise: Being Human In A Technological Age',
    },
  );
  assert.deepEqual(splitVideoTitle('Love - 1 John 4:7-21'), {
    title: 'Love',
    reading: '1 John 4:7-21',
    series: '',
  });
  // No reading: the whole title is the title.
  assert.deepEqual(splitVideoTitle('Christmas Eve - Candlelight Service'), {
    title: 'Christmas Eve - Candlelight Service',
    reading: '',
    series: '',
  });
});

test('the preacher comes from the description’s own line, or nothing', () => {
  assert.equal(
    preacherOf('Sermon\nPreaching: Rev. Jonathan Balmer\n\nMore'),
    'Rev. Jonathan Balmer',
  );
  assert.equal(preacherOf('No such line'), '');
});

test('labels and thumbnails', () => {
  assert.equal(sundayLabel('2026-09-20'), 'Sunday, September 20');
  assert.equal(
    thumbnailUrl('y435wOf6Tgc', 'mqdefault'),
    'https://i.ytimg.com/vi/y435wOf6Tgc/mqdefault.jpg',
  );
  assert.equal(
    thumbnailUrl('y435wOf6Tgc', 'sddefault', 'webp'),
    'https://i.ytimg.com/vi_webp/y435wOf6Tgc/sddefault.webp',
  );
});
