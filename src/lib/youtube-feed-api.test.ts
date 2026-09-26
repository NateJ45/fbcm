import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atomFromApi, uploadsPlaylist } from './youtube-feed-api.ts';
import { parseYoutubeFeed } from './youtube-feed.ts';
import { parseChannelFeed } from './sermon-video.ts';

const CH = 'UCTm6q6Q7OJ6VrURz3YXVP6A';

const items = [
  {
    contentDetails: { videoId: 'g33C2xE88cs', videoPublishedAt: '2026-09-23T18:03:21Z' },
    snippet: { title: 'playlist title', description: 'playlist description' },
  },
  {
    contentDetails: { videoId: 'aB3dE5gH7jK', videoPublishedAt: '2026-09-21T04:13:44Z' },
    snippet: { title: 'Unequal Opportunity Grace - Matthew 20:1-16 - Kingdom Come' },
  },
  { contentDetails: { videoId: 'not-an-id' }, snippet: { title: 'dropped' } },
];
const videos = [
  {
    id: 'g33C2xE88cs',
    statistics: { viewCount: '0' },
    snippet: {
      publishedAt: '2026-09-23T18:03:21Z',
      title: "How to Let Your 'Yes' Be Yes & Your <No> - Matthew 21:23-32 - Kingdom Come",
      description: 'Preaching: Rev. Kendall Ellis',
    },
  },
  { id: 'aB3dE5gH7jK', statistics: { viewCount: '29' } },
];

test('the API answer reads back through the band parser exactly', () => {
  const entries = parseYoutubeFeed(atomFromApi(CH, items, videos));
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0], {
    videoId: 'g33C2xE88cs',
    title: "How to Let Your 'Yes' Be Yes & Your <No> - Matthew 21:23-32 - Kingdom Come",
    published: '2026-09-23T18:03:21Z',
    views: 0,
    description: 'Preaching: Rev. Kendall Ellis',
  });
  // A video with no snippet of its own keeps the playlist item's title and
  // published time, and its views.
  assert.equal(entries[1].title, 'Unequal Opportunity Grace - Matthew 20:1-16 - Kingdom Come');
  assert.equal(entries[1].published, '2026-09-21T04:13:44Z');
  assert.equal(entries[1].views, 29);
});

test('the API answer reads back through the sermon-preview parser', () => {
  const vids = parseChannelFeed(atomFromApi(CH, items, videos));
  assert.deepEqual(
    vids.map((v) => v.id),
    ['g33C2xE88cs', 'aB3dE5gH7jK'],
  );
});

test('no uploads is still a feed, with no entries', () => {
  const xml = atomFromApi(CH, [], []);
  assert.match(xml, /<feed[\s>]/);
  assert.deepEqual(parseYoutubeFeed(xml), []);
});

test('the uploads playlist of a channel', () => {
  assert.equal(uploadsPlaylist(CH), 'UUTm6q6Q7OJ6VrURz3YXVP6A');
});
