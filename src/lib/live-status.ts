// Safe to edit by hand
// Is the church's YouTube channel live right now? (2026-09-24)
//
// The logic behind GET /api/live-status (src/pages/api/live-status.ts, which
// only adds the Worker's env, the Sanity read and the edge cache). Pure apart
// from the injected `fetch`, so every branch is unit-tested with a mock
// (live-status.test.ts).
//
// THE CALL, AND WHY NOT search.list. The obvious call, search.list with
// channelId + eventType=live + type=video, costs 100 quota units a time, and
// the default daily quota is 10,000: at one refresh every 90 s through the
// check window (140 refreshes) a SINGLE edge location would spend 14,000
// units every Sunday, over the quota before noon. So this makes two 1-unit
// calls instead:
//
//   1. playlistItems.list on the channel's uploads playlist (the channel id
//      with UC swapped for UU), newest 10 items. A live broadcast, and a
//      scheduled one, is a video on the channel, so it is in that playlist.
//   2. videos.list on those ids, reading snippet.liveBroadcastContent, which
//      is 'live' only while the broadcast is on air.
//
// Two units per refresh, 280 units per edge location per Sunday at most (the
// arithmetic is in docs/agent/deployment.md). The known limit: a stream that
// is private or unlisted is not in the uploads playlist, and a live video
// buried under ten newer uploads would be missed. Neither is how the church
// streams; if it ever is, the answer is "not-live" and the link still goes to
// the channel's streams page.
//
// NO KEY, NO CALL. Without YOUTUBE_API_KEY the answer is always "unknown", and
// the browser falls back to the service-time window, which is exactly how the
// site behaved before this existed. Outside the Sunday-morning check window
// the answer is "not-live" and YouTube is never called.

import { splitStega } from './preview-stega.ts';
import { inCheckWindow, serviceStartMinutes } from './live-service.ts';

export type LiveState = 'live' | 'not-live' | 'unknown';

/** The endpoint's JSON body. */
export interface LiveStatusBody {
  status: LiveState;
  /** The live video, only with status 'live' and only when YouTube named it. */
  url?: string;
  /** When the answer was worked out (not when it was served from a cache). */
  checkedAt: string;
  /** Why, for anything but a clean YouTube answer: no-key, outside-window... */
  reason?: string;
}

/** The Site settings fields the endpoint reads (published, stega-free). */
export interface LiveSettings {
  serviceTime?: string | null;
  youtubeUrl?: string | null;
  livestreamUrl?: string | null;
}

/**
 * THE CHANNEL, RESOLVED ONCE. Site settings name the channel by its custom
 * URL (youtube.com/c/FbcmuncieOrg) and its handle (@FbcmuncieOrg), and the
 * Data API wants the UC... id. Both were resolved on 2026-09-24 from the
 * channel page's own canonical link (youtube.com/channel/<id>), and both give
 * this id. A settings URL of the /channel/<id> form needs no table; any OTHER
 * name returns null (and the endpoint "unknown"), so a church that moves to a
 * new channel never has this old id checked on its behalf.
 */
export const KNOWN_CHANNELS: Readonly<Record<string, string>> = {
  fbcmuncieorg: 'UCTm6q6Q7OJ6VrURz3YXVP6A',
};

const clean = (v: unknown) => (typeof v === 'string' ? splitStega(v).cleaned.trim() : '');

/** The channel id from the first settings URL that names one, else null. */
export function youtubeChannelId(...urls: Array<string | null | undefined>): string | null {
  for (const raw of urls) {
    const url = clean(raw);
    if (!/^https?:\/\/(www\.|m\.)?youtube\.com\//i.test(url)) continue;
    const direct = /youtube\.com\/channel\/(UC[\w-]{22})(?:[/?#]|$)/i.exec(url);
    if (direct?.[1]) return direct[1];
    const named = /youtube\.com\/(?:@|c\/|user\/)([\w.-]+)/i.exec(url);
    const id = named?.[1] ? KNOWN_CHANNELS[named[1].toLowerCase()] : undefined;
    if (id) return id;
  }
  return null;
}

/** A channel's uploads playlist: UCxxxx -> UUxxxx. */
export function uploadsPlaylistId(channelId: string): string {
  return `UU${channelId.slice(2)}`;
}

export const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
/** Quota units one refresh spends: playlistItems.list + videos.list. */
export const UNITS_PER_CHECK = 2;

type FetchLike = (url: string) => Promise<Response>;

async function errorReason(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { errors?: Array<{ reason?: string }> } };
    const reason = body?.error?.errors?.[0]?.reason;
    return `youtube-${res.status}${reason ? `-${reason}` : ''}`;
  } catch {
    return `youtube-${res.status}`;
  }
}

/** Ask YouTube, two 1-unit calls. Never throws. */
export async function youtubeLiveNow(
  channelId: string,
  key: string,
  fetchFn: FetchLike,
): Promise<{ status: LiveState; url?: string; reason?: string }> {
  try {
    const list = new URL(`${YOUTUBE_API}/playlistItems`);
    list.search = new URLSearchParams({
      part: 'contentDetails',
      playlistId: uploadsPlaylistId(channelId),
      maxResults: '10',
      fields: 'items(contentDetails(videoId))',
      key,
    }).toString();
    const r1 = await fetchFn(list.toString());
    if (!r1.ok) return { status: 'unknown', reason: await errorReason(r1) };
    const j1 = (await r1.json()) as { items?: Array<{ contentDetails?: { videoId?: string } }> };
    const ids = (j1.items ?? [])
      .map((i) => i?.contentDetails?.videoId ?? '')
      .filter((id) => /^[\w-]{11}$/.test(id));
    if (ids.length === 0) return { status: 'not-live' };

    const videos = new URL(`${YOUTUBE_API}/videos`);
    videos.search = new URLSearchParams({
      part: 'snippet',
      id: ids.join(','),
      fields: 'items(id,snippet(liveBroadcastContent))',
      key,
    }).toString();
    const r2 = await fetchFn(videos.toString());
    if (!r2.ok) return { status: 'unknown', reason: await errorReason(r2) };
    const j2 = (await r2.json()) as {
      items?: Array<{ id?: string; snippet?: { liveBroadcastContent?: string } }>;
    };
    const live = (j2.items ?? []).find((v) => v?.snippet?.liveBroadcastContent === 'live');
    if (live?.id && /^[\w-]{11}$/.test(live.id)) {
      return { status: 'live', url: `https://www.youtube.com/watch?v=${live.id}` };
    }
    return { status: 'not-live' };
  } catch {
    return { status: 'unknown', reason: 'youtube-unreachable' };
  }
}

/** The whole decision, in the order that spends nothing it does not need to. */
export async function computeLiveStatus(opts: {
  now: Date;
  key: string | null | undefined;
  settings: LiveSettings | null | undefined;
  fetch: FetchLike;
}): Promise<LiveStatusBody> {
  const checkedAt = opts.now.toISOString();
  const key = (opts.key ?? '').trim();
  if (!key) return { status: 'unknown', reason: 'no-key', checkedAt };
  const serviceTime = clean(opts.settings?.serviceTime);
  if (serviceStartMinutes(serviceTime) === null) {
    return { status: 'unknown', reason: 'no-service-time', checkedAt };
  }
  if (!inCheckWindow(opts.now, serviceTime)) {
    return { status: 'not-live', reason: 'outside-window', checkedAt };
  }
  const channel = youtubeChannelId(opts.settings?.livestreamUrl, opts.settings?.youtubeUrl);
  if (!channel) return { status: 'unknown', reason: 'no-channel', checkedAt };
  const answer = await youtubeLiveNow(channel, key, opts.fetch);
  return { ...answer, checkedAt };
}

/**
 * How long an answer may be reused, in seconds. A real answer, 90 s: inside
 * the 60 to 120 s the browser can tolerate, and it is what the quota sums in
 * deployment.md assume. Anything "unknown" (no key, YouTube down, quota spent)
 * 5 minutes, so a failing upstream is not hammered.
 */
export function ttlSeconds(body: LiveStatusBody): number {
  return body.status === 'unknown' ? 300 : 90;
}

/**
 * The in-isolate layer of the cache. A Worker isolate serves many requests,
 * so it keeps the last answer until its TTL runs out, and requests that
 * arrive while one refresh is in flight share it rather than each calling
 * YouTube. The edge Cache API (in the route) is the layer across isolates.
 */
export class StatusMemo {
  private hit: { body: LiveStatusBody; until: number } | null = null;
  private pending: Promise<LiveStatusBody> | null = null;

  async get(nowMs: number, compute: () => Promise<LiveStatusBody>): Promise<LiveStatusBody> {
    if (this.hit && nowMs < this.hit.until) return this.hit.body;
    if (this.pending) return this.pending;
    this.pending = compute()
      .then((body) => {
        this.hit = { body, until: nowMs + ttlSeconds(body) * 1000 };
        return body;
      })
      .finally(() => {
        this.pending = null;
      });
    return this.pending;
  }
}
