// scaffold-file: journal
// Safe to edit by hand
// The church's YouTube channel feed, fetched once per build for the sermon
// preview pages (src/pages/post/[slug].astro). The matching itself is pure and
// tested in src/lib/sermon-video.ts; this file is only the network half.
//
// A build must never fail, or slow down much, because YouTube is slow or
// down: the fetch gives up after five seconds, and any failure is an empty
// list, a warning in the build log, and every preview keeping the streams
// page, which is exactly what an unmatched preview does anyway.

import { parseChannelFeed, type FeedVideo } from './sermon-video.ts';

const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

let cache: { channel: string; at: number; videos: Promise<FeedVideo[]> } | null = null;

/** The latest videos on a channel (UC... id), or [] on any failure. Cached for ten minutes. */
export function channelVideos(channelId: string | null | undefined): Promise<FeedVideo[]> {
  if (!channelId || !/^UC[\w-]{22}$/.test(channelId)) return Promise.resolve([]);
  if (cache && cache.channel === channelId && Date.now() - cache.at < 600_000) return cache.videos;
  const videos = (async () => {
    try {
      const res = await fetch(FEED + channelId, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseChannelFeed(await res.text());
    } catch (err) {
      console.warn(
        `[sermon-feed] could not read the YouTube feed; previews keep the streams page (${String(err)})`,
      );
      return [];
    }
  })();
  cache = { channel: channelId, at: Date.now(), videos };
  return videos;
}
