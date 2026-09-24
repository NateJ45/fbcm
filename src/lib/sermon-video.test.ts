// scaffold-file: journal
// Safe to edit by hand
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  matchSermonVideo,
  parseChannelFeed,
  retargetLinks,
  videoSunday,
  videoUrl,
  type FeedVideo,
} from './sermon-video.ts';

// The shape of the real feed (fetched 2026-09-24), trimmed to three entries.
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
 <title>First Baptist Church</title>
 <published>2014-08-18T13:32:12+00:00</published>
 <entry>
  <id>yt:video:y435wOf6Tgc</id>
  <yt:videoId>y435wOf6Tgc</yt:videoId>
  <title>How to Let Your &#39;Yes&#39; Be Yes and Your &#39;No,&#39; No - Matthew 21:23-32 - Kingdom Come</title>
  <published>2026-09-23T18:03:21+00:00</published>
 </entry>
 <entry>
  <yt:videoId>IHCl1D02F5Q</yt:videoId>
  <title>Unequal Opportunity Grace - Matthew 20:1-16 - Kingdom Come</title>
  <published>2026-09-21T04:13:44+00:00</published>
 </entry>
 <entry>
  <yt:videoId>AwHIHRt0Gm0</yt:videoId>
  <title>Grace for the Helpless - Romans 7:15–25a - Good Grace</title>
  <published>2026-07-05T16:14:48+00:00</published>
 </entry>
 <entry><title>no id</title><published>2026-01-01T00:00:00+00:00</published></entry>
</feed>`;

test('parseChannelFeed reads id, title and date, decodes entities, drops broken entries', () => {
  const v = parseChannelFeed(FEED);
  assert.equal(v.length, 3, 'the feed title and the id-less entry are not videos');
  assert.equal(v[0].id, 'y435wOf6Tgc');
  assert.equal(
    v[0].title,
    "How to Let Your 'Yes' Be Yes and Your 'No,' No - Matthew 21:23-32 - Kingdom Come",
  );
  assert.equal(v[1].published, '2026-09-21T04:13:44+00:00');
  assert.deepEqual(parseChannelFeed(''), []);
});

test('videoSunday: Sunday is itself, Monday is the Sunday before, midweek the Sunday after', () => {
  // 04:13 UTC Monday Sep 21 is 00:13 Monday in Muncie: the Sep 20 recording.
  assert.equal(videoSunday('2026-09-21T04:13:44+00:00'), '2026-09-20');
  // 03:30 UTC Monday is still 23:30 Sunday in Muncie.
  assert.equal(videoSunday('2026-09-21T03:30:00+00:00'), '2026-09-20');
  // Sunday noon.
  assert.equal(videoSunday('2026-07-05T16:14:48+00:00'), '2026-07-05');
  // A Wednesday upload is the coming Sunday's stream.
  assert.equal(videoSunday('2026-09-23T18:03:21+00:00'), '2026-09-27');
  assert.equal(videoSunday('not a date'), null);
});

test('matchSermonVideo: the Sunday decides; a disagreeing passage rules a video out', () => {
  const v = parseChannelFeed(FEED);
  assert.equal(matchSermonVideo('2026-09-20', 'Matthew 20:1-16', v)?.id, 'IHCl1D02F5Q');
  assert.equal(matchSermonVideo('2026-09-20', '', v)?.id, 'IHCl1D02F5Q', 'no reading: date alone');
  assert.equal(matchSermonVideo('2026-09-27', 'Matthew 21:23-32', v)?.id, 'y435wOf6Tgc');
  assert.equal(matchSermonVideo('2026-09-20', 'Genesis 1:1', v), null, 'wrong passage');
  assert.equal(matchSermonVideo('2026-01-04', 'Luke 2:1-20', v), null, 'older than the feed');
  assert.equal(matchSermonVideo(null, '', v), null);
});

test('matchSermonVideo: two videos on one Sunday need the passage to pick one', () => {
  const two: FeedVideo[] = [
    { id: 'a', title: 'Sermon - John 3:16-21', published: '2026-09-20T15:00:00Z' },
    { id: 'b', title: 'Hymn sing - Psalm 23:1-6', published: '2026-09-20T18:00:00Z' },
  ];
  assert.equal(matchSermonVideo('2026-09-20', 'John 3:16', two)?.id, 'a');
  assert.equal(matchSermonVideo('2026-09-20', '', two), null, 'no passage, no way to choose');
  const untitled: FeedVideo[] = [
    { id: 'a', title: 'Sunday worship', published: '2026-09-20T15:00:00Z' },
    { id: 'b', title: 'Sunday worship (audio)', published: '2026-09-20T18:00:00Z' },
  ];
  assert.equal(matchSermonVideo('2026-09-20', 'John 3:16', untitled), null);
});

test('videoUrl', () => {
  assert.equal(
    videoUrl({ id: 'IHCl1D02F5Q', title: '', published: '' }),
    'https://www.youtube.com/watch?v=IHCl1D02F5Q',
  );
});

test('retargetLinks moves only the matching link annotations, without mutating', () => {
  const streams = 'https://www.youtube.com/@FbcmuncieOrg/streams';
  const body = [
    {
      _type: 'block',
      markDefs: [
        { _type: 'link', href: streams },
        { _type: 'link', href: '/x' },
      ],
    },
    { _type: 'block', markDefs: [] },
    { _type: 'image' },
  ];
  const out = retargetLinks(body, streams, 'https://www.youtube.com/watch?v=a');
  assert.equal(out[0].markDefs?.[0].href, 'https://www.youtube.com/watch?v=a');
  assert.equal(out[0].markDefs?.[1].href, '/x');
  assert.equal(out[1], body[1], 'untouched blocks keep their identity');
  assert.equal(body[0].markDefs?.[0].href, streams, 'input not mutated');
  assert.equal(retargetLinks(body, streams, streams), body);
  assert.equal(retargetLinks(null, streams, 'x'), null);
});
