// Safe to edit by hand
// The channel's recent uploads from the YouTube Data API, written as the same
// Atom the public feed serves (2026-09-26).
//
// WHY. The public feed (feeds/videos.xml) started failing on 2026-09-25: the
// channel_id form answered 404 or 500 on every try, the uploads-playlist form
// about two times in five, and every build lost the hero's "This Sunday" line
// and the Last Sunday band, which both read it. The Data API does not have
// that problem. Rather than teach two parsers (youtube-feed.ts and
// sermon-video.ts) a second shape, the API's answer is written back out as the
// few Atom elements they read: <entry>, <yt:videoId>, <title>, <published>,
// <media:description> and <media:statistics views>. Everything downstream is
// unchanged, and a fetched feed and an API feed are interchangeable.
//
// Cost: playlistItems.list plus videos.list, 2 quota units a build, against a
// 10,000-unit daily quota the live check (src/lib/live-status.ts) also draws on.
//
// PURE: no fetch here; scripts/fetch-youtube-feed.mjs does the network half.

/** One playlistItems.list item, the fields read. */
export interface PlaylistItem {
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
  snippet?: { publishedAt?: string; title?: string; description?: string };
}

/** One videos.list item, the fields read. */
export interface VideoItem {
  id?: string;
  statistics?: { viewCount?: string };
  snippet?: { publishedAt?: string; title?: string; description?: string };
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The Atom the public feed would have served for these uploads, newest first,
 * as far as the two parsers read it. `videos` supplies the view counts (the
 * upcoming broadcast is the upload with 0 views); a video missing from it
 * gets 0.
 */
export function atomFromApi(channelId: string, items: PlaylistItem[], videos: VideoItem[]): string {
  const byId = new Map(videos.filter((v) => v.id).map((v) => [v.id as string, v]));
  const entries = items
    .map((it) => {
      const id = it.contentDetails?.videoId ?? '';
      if (!/^[\w-]{11}$/.test(id)) return '';
      const v = byId.get(id);
      // The public feed's <published> is when the video was published, which
      // for a scheduled broadcast is when it was scheduled: the video's own
      // snippet.publishedAt, not when it joined the playlist.
      const published =
        v?.snippet?.publishedAt ??
        it.contentDetails?.videoPublishedAt ??
        it.snippet?.publishedAt ??
        '';
      const title = v?.snippet?.title ?? it.snippet?.title ?? '';
      const description = v?.snippet?.description ?? it.snippet?.description ?? '';
      const views = Number(v?.statistics?.viewCount ?? 0) || 0;
      return [
        '<entry>',
        `<yt:videoId>${id}</yt:videoId>`,
        `<title>${esc(title)}</title>`,
        `<published>${esc(published)}</published>`,
        '<media:group>',
        `<media:description>${esc(description)}</media:description>`,
        `<media:community><media:statistics views="${views}"/></media:community>`,
        '</media:group>',
        '</entry>',
      ].join('');
    })
    .filter(Boolean);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">',
    `<yt:channelId>${esc(channelId)}</yt:channelId>`,
    ...entries,
    '</feed>',
  ].join('\n');
}

/** A channel's uploads playlist: UCxxxx -> UUxxxx. */
export const uploadsPlaylist = (channelId: string): string => `UU${channelId.slice(2)}`;
