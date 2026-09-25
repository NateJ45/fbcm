// Safe to edit by hand
// The build-time read behind the home page's "Last Sunday" band (2026-09-24,
// `feat/last-sunday`). The pure half (parsing and picking) is
// src/lib/youtube-feed.ts; this file only fetches, with every failure turned
// into null so the band simply does not render and the build carries on.
//
// NO KEY. The channel's public Atom feed needs none. A YouTube Data API key
// (YOUTUBE_API_KEY, the "Live now" check's secret) could give durations and
// better thumbnails, but it is a Worker secret, not a build variable, and the
// feed already has everything the band draws; the feed stays the path.
//
// THE CHANNEL IS DERIVED, never typed here: youtubeChannelId() reads Site
// settings' YouTube and livestream links, exactly as /api/live-status does.
//
// THE TEST SEAM. Playwright's build sets LAST_SUNDAY_FIXTURE=1 (and
// LAST_SUNDAY_NOW) so the home page renders from tests/fixtures/
// youtube-feed.xml at a fixed moment, offline and the same every run; and
// LAST_SUNDAY_FIXTURE=unavailable to prove the band's absence. Neither is set
// by any deploy.

import { youtubeChannelId } from './live-status.ts';
import { lastSundayRecording, parseYoutubeFeed, type SundayRecording } from './youtube-feed.ts';

export const FEED_TIMEOUT_MS = 8000;

export const feedUrl = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/** The feed's XML, or null on any failure (network, status, timeout, not a feed). */
export async function fetchFeed(
  channelId: string,
  fetchImpl: Fetch = fetch,
  timeoutMs: number = FEED_TIMEOUT_MS,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(feedUrl(channelId), { signal: controller.signal });
    if (!res.ok) return null;
    const text = await res.text();
    return /<feed[\s>]/.test(text) ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Whether a thumbnail size exists for this video (YouTube 404s the sizes it never made). */
export async function thumbnailExists(
  url: string,
  fetchImpl: Fetch = fetch,
  timeoutMs: number = 4000,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { method: 'HEAD', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export interface LastSundayInput {
  youtubeUrl?: string | null;
  livestreamUrl?: string | null;
}

/** The channel feed's XML for the church in Site settings, or null. */
export async function loadFeedXml(
  settings: LastSundayInput | null | undefined,
  fetchImpl: Fetch = fetch,
): Promise<string | null> {
  const channelId = youtubeChannelId(settings?.youtubeUrl, settings?.livestreamUrl);
  return channelId ? fetchFeed(channelId, fetchImpl) : null;
}

/**
 * Last Sunday's recording for the church in Site settings, as of `now`, or
 * null. `hasLarge` says whether the 640px thumbnail exists.
 */
export async function loadLastSunday(
  settings: LastSundayInput | null | undefined,
  now: Date,
  opts: { fetchImpl?: Fetch; xml?: string | null; checkThumbnail?: boolean } = {},
): Promise<(SundayRecording & { hasLarge: boolean }) | null> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  let xml = opts.xml;
  if (xml === undefined) {
    const channelId = youtubeChannelId(settings?.youtubeUrl, settings?.livestreamUrl);
    if (!channelId) return null;
    xml = await fetchFeed(channelId, fetchImpl);
  }
  const rec = lastSundayRecording(parseYoutubeFeed(xml), now);
  if (!rec) return null;
  // The HEAD check runs for a fetched feed, and for handed-in XML only when
  // asked (the home page fetches the feed once and shares it with the hero
  // line, src/pages/index.astro); a fixture's thumbnails are never checked.
  const check = opts.checkThumbnail ?? opts.xml === undefined;
  const hasLarge = !check
    ? true
    : await thumbnailExists(`https://i.ytimg.com/vi/${rec.videoId}/sddefault.jpg`, fetchImpl);
  return { ...rec, hasLarge };
}
