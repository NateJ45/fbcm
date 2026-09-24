// scaffold-file: journal
// Safe to edit by hand
// A sermon preview's own recording on YouTube, when it can be matched
// reliably, derived at build time from the channel's public feed
// (2026-09-24, feat/church-links).
//
// WHY BUILD TIME (CLAUDE.md rule 15). Which video is a Sunday's recording is
// computable from two things the site already has: the preview's Sunday
// (sundayOf its publish date, src/lib/sermon-derive.ts) and the channel feed. A
// link typed into each post by a migration would be a second copy of that
// fact, frozen on the day the migration ran. So the posts hold {sermons} (the
// streams page) and the post page upgrades it to the one video when, and only
// when, the feed has a match.
//
// NO API KEY, NO SCRAPING. The feed is YouTube's public Atom feed,
// https://www.youtube.com/feeds/videos.xml?channel_id=..., which carries the
// channel's latest 15 or so videos. Older sermons are simply not in it, so
// they keep the streams page. src/lib/sermon-feed.ts fetches it once per build.
//
// NEVER GUESS. A match needs the video's service Sunday to equal the
// preview's Sunday, and when there is more than one candidate, or when both
// sides name a passage, the passage has to agree. Anything short of that is
// no match, and the link stays on the streams page.
//
// PURE: no fetch, no import.meta.env, so the node unit tests can import it.

import { localDay, isoDay, SCRIPTURE_REF } from './sermon-derive.ts';

export interface FeedVideo {
  id: string;
  title: string;
  /** ISO instant from the feed's <published>. */
  published: string;
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

/** The videos in a YouTube channel Atom feed. Entries missing an id or a date are dropped. */
export function parseChannelFeed(xml: string): FeedVideo[] {
  const out: FeedVideo[] = [];
  for (const m of String(xml ?? '').matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const entry = m[1];
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1]?.trim();
    const published = /<published>([^<]+)<\/published>/.exec(entry)?.[1]?.trim();
    const title = decode(/<title>([^<]*)<\/title>/.exec(entry)?.[1] ?? '').trim();
    if (id && published && !Number.isNaN(Date.parse(published))) {
      out.push({ id, title, published });
    }
  }
  return out;
}

/**
 * The Sunday a video belongs to, as YYYY-MM-DD in Muncie. A recording
 * published on a Sunday is that Sunday's; one published on the Monday (the
 * feed often dates a finished livestream just after midnight) is the Sunday
 * before; one published Tuesday to Saturday is a scheduled stream or an
 * upload ahead of the service, so it belongs to the Sunday after.
 */
export function videoSunday(published: string): string | null {
  const d = localDay(published);
  if (!d) return null;
  const dow = d.getUTCDay();
  if (dow === 1) d.setUTCDate(d.getUTCDate() - 1);
  else if (dow !== 0) d.setUTCDate(d.getUTCDate() + (7 - dow));
  return isoDay(d);
}

/** "Matthew 20:1-16" -> "matthew 20"; '' when there is no reference. */
function bookChapter(text: string): string {
  const ref = String(text ?? '').match(SCRIPTURE_REF)?.[1] ?? '';
  const m = /^(.*?)\s+(\d+):/.exec(ref);
  return m ? `${m[1].toLowerCase().replace(/\s+/g, ' ')} ${m[2]}` : '';
}

/**
 * The video for a preview, or null. `sunday` is the preview's Sunday
 * (YYYY-MM-DD, from sundayOf); `reading` is its passage, '' when it has none.
 */
export function matchSermonVideo(
  sunday: string | null | undefined,
  reading: string,
  videos: readonly FeedVideo[],
): FeedVideo | null {
  if (!sunday) return null;
  const want = bookChapter(reading);
  const same = videos.filter((v) => videoSunday(v.published) === sunday);
  // A named passage on both sides that disagrees rules a video out.
  const agree = same.filter((v) => {
    const got = bookChapter(v.title);
    return !want || !got || got === want;
  });
  if (agree.length === 1) return agree[0];
  if (agree.length > 1 && want) {
    const exact = agree.filter((v) => bookChapter(v.title) === want);
    if (exact.length === 1) return exact[0];
  }
  return null;
}

/** The watch address of a feed video. */
export function videoUrl(v: FeedVideo): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
}

/**
 * A body with every link that points at `from` pointed at `to` instead. Only
 * link annotations (markDefs) are touched; the input is not mutated.
 */
export function retargetLinks<T>(body: T, from: string, to: string): T {
  if (!from || !to || from === to || !Array.isArray(body)) return body;
  return body.map((block) => {
    if (!block || typeof block !== 'object' || !Array.isArray(block.markDefs)) return block;
    let changed = false;
    const markDefs = block.markDefs.map((def: { _type?: string; href?: string }) => {
      if (def?._type === 'link' && def.href === from) {
        changed = true;
        return { ...def, href: to };
      }
      return def;
    });
    return changed ? { ...block, markDefs } : block;
  }) as T;
}
