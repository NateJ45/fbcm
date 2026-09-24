// Safe to edit by hand
// Last Sunday's sermon, from the church's public YouTube feed (2026-09-24,
// `feat/last-sunday`).
//
// THE SOURCE. https://www.youtube.com/feeds/videos.xml?channel_id=<UC...> is
// public, needs no key, and lists the channel's newest 15 uploads as Atom.
// It is read ONCE, at build time (src/lib/last-sunday.ts does the fetch); this
// file is the pure half: parse the XML, split a title, pick the recording.
//
// WHAT THE REAL FEED LOOKS LIKE (checked 2026-09-24, channel
// UCTm6q6Q7OJ6VrURz3YXVP6A): every entry is a Sunday livestream titled
// "<sermon> - <reading> - <series>", e.g. "Unequal Opportunity Grace -
// Matthew 20:1-16 - Kingdom Come". Two things about the dates:
//
//   1. A finished stream's <published> is when YouTube published the replay,
//      which for this church is usually just after midnight on MONDAY, church
//      time (2026-09-21T04:13:44Z is 12:13 am Monday; the stream itself ran
//      10:40 to 11:59 am Sunday). Once, on July 5, it was 12:14 pm Sunday.
//   2. NEXT Sunday's stream is already in the feed, days early, as a
//      scheduled broadcast: "How to Let Your 'Yes' Be Yes..." was published
//      Wednesday 2026-09-23 for September 27, with views="0".
//
// So "the Sunday service" is: an entry published on a Sunday or a Monday on
// the church's calendar (the Sunday is that day, or the day before), with at
// least one view (a scheduled broadcast has none; a replay carries its live
// audience), no newer than today and no older than MAX_AGE_DAYS. Midweek
// uploads, and the upcoming broadcast, never qualify. NEVER GUESS: no match
// returns null and the band does not render.

import { SERVICE_TIME_ZONE } from './live-service.ts';

/** One <entry> of the feed, decoded. */
export interface FeedEntry {
  videoId: string;
  title: string;
  /** ISO timestamp, as the feed wrote it. */
  published: string;
  /** media:statistics views, or null when the feed carried none. */
  views: number | null;
  description: string;
}

/** The recording the band draws. All strings plain text. */
export interface SundayRecording {
  videoId: string;
  /** YYYY-MM-DD on the church's calendar. */
  sunday: string;
  /** The sermon's title, from the video title's first part. */
  title: string;
  /** The reading, from the video title, or ''. */
  reading: string;
  /** The series, from the video title's last part, or ''. */
  series: string;
  /** "Rev. Jonathan Balmer", from the description's "Preaching:" line, or ''. */
  preacher: string;
  /** https://www.youtube.com/watch?v=<id> */
  watchUrl: string;
}

/** A recording older than this at build time is not "last Sunday" any more. */
export const MAX_AGE_DAYS = 21;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** Decode the XML entities the feed uses (named, decimal and hex). */
export function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
      if (code[0] === '#') {
        const n =
          code[1] === 'x' || code[1] === 'X'
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
      }
      return ENTITIES[code.toLowerCase()] ?? whole;
    });
}

const tag = (xml: string, name: string): string => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml);
  return m?.[1] !== undefined ? decodeXml(m[1]).trim() : '';
};

/** Every entry in a YouTube channel feed. Malformed entries are dropped. */
export function parseYoutubeFeed(xml: string | null | undefined): FeedEntry[] {
  if (!xml || !/<feed[\s>]/.test(xml)) return [];
  const out: FeedEntry[] = [];
  for (const [, body] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    if (!body) continue;
    const videoId = tag(body, 'yt:videoId');
    const title = tag(body, 'title');
    const published = tag(body, 'published');
    if (!/^[\w-]{11}$/.test(videoId) || !title || Number.isNaN(Date.parse(published))) continue;
    const views = /<media:statistics[^>]*\sviews="(\d+)"/.exec(body)?.[1];
    out.push({
      videoId,
      title: title.replace(/\s+/g, ' '),
      published,
      views: views === undefined ? null : Number(views),
      description: tag(body, 'media:description'),
    });
  }
  return out;
}

// A part of the title that is a Bible reference: an optional book number, a
// book name, then chapter:verse ("Matthew 20:1-16", "1 John 4:7-21",
// "Song of Songs 2:8-13", "Genesis 32:22-31 / (Romans 9:1-5)").
const READING = /^(?:[123]\s?)?[A-Z][a-z]+(?:\s(?:of\s)?[A-Z][a-z]+)*\.?\s\d+:\d+/;

/**
 * Split "<sermon> - <reading> - <series>". A title with no reading part is
 * all sermon title. A second reading in parentheses after a slash is kept,
 * written as "Genesis 32:22-31; Romans 9:1-5".
 */
export function splitVideoTitle(raw: string): { title: string; reading: string; series: string } {
  const text = raw.replace(/\s+/g, ' ').trim();
  const parts = text.split(/\s[-–—]\s/).map((p) => p.trim());
  const at = parts.findIndex((p, i) => i > 0 && READING.test(p));
  if (at < 1) return { title: text, reading: '', series: '' };
  const reading = (parts[at] ?? '')
    .replace(/\s*\/\s*/g, '; ')
    .replace(/[()]/g, '')
    .trim();
  return {
    title: parts.slice(0, at).join(' - '),
    reading,
    series: parts.slice(at + 1).join(' - '),
  };
}

/** "Rev. Jonathan Balmer" from a description line "Preaching: Rev. Jonathan Balmer". */
export function preacherOf(description: string): string {
  const m = /^\s*Preaching:\s*(.{3,60}?)\s*$/im.exec(description);
  return m?.[1]?.trim() ?? '';
}

const DAY = new Intl.DateTimeFormat('en-US', {
  timeZone: SERVICE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
});
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The church-calendar day of an instant: YYYY-MM-DD and 0 (Sunday) to 6. */
export function churchDay(at: Date): { iso: string; weekday: number } | null {
  if (Number.isNaN(at.getTime())) return null;
  const parts = DAY.formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = WEEKDAYS.indexOf(get('weekday'));
  if (weekday < 0) return null;
  return { iso: `${get('year')}-${get('month')}-${get('day')}`, weekday };
}

const dayNumber = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;
const isoFromDayNumber = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);

/** The Sunday a recording belongs to, or null when it was not published Sunday or Monday. */
export function recordingSunday(published: string): string | null {
  const day = churchDay(new Date(published));
  if (!day || day.weekday > 1) return null;
  return isoFromDayNumber(dayNumber(day.iso) - day.weekday);
}

/**
 * The most recent Sunday service recording in the feed, as of `now`, or null.
 * Two recordings for one Sunday: the one whose title carries a reading (the
 * sermon, not a special upload) wins, then the later publish.
 */
export function lastSundayRecording(
  entries: readonly FeedEntry[],
  now: Date,
  maxAgeDays: number = MAX_AGE_DAYS,
): SundayRecording | null {
  const today = churchDay(now);
  if (!today) return null;
  const todayN = dayNumber(today.iso);
  let best: { rec: SundayRecording; at: number } | null = null;
  for (const e of entries) {
    if (e.views === 0) continue; // a scheduled broadcast, not a recording
    const sunday = recordingSunday(e.published);
    if (!sunday) continue;
    const age = todayN - dayNumber(sunday);
    if (age < 0 || age > maxAgeDays) continue;
    if (Date.parse(e.published) > now.getTime()) continue;
    const parts = splitVideoTitle(e.title);
    const rec: SundayRecording = {
      videoId: e.videoId,
      sunday,
      ...parts,
      preacher: preacherOf(e.description),
      watchUrl: `https://www.youtube.com/watch?v=${e.videoId}`,
    };
    const at = Date.parse(e.published);
    if (
      !best ||
      rec.sunday > best.rec.sunday ||
      (rec.sunday === best.rec.sunday &&
        (Number(!!rec.reading) > Number(!!best.rec.reading) ||
          (!!rec.reading === !!best.rec.reading && at > best.at)))
    ) {
      best = { rec, at };
    }
  }
  return best?.rec ?? null;
}

/** "Sunday, September 20" for a YYYY-MM-DD. */
export function sundayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `Sunday, ${d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' })}`;
}

/** The i.ytimg.com thumbnail for a video at one of YouTube's fixed sizes. */
export function thumbnailUrl(
  videoId: string,
  size: 'mqdefault' | 'hqdefault' | 'sddefault' | 'hq720',
  format: 'jpg' | 'webp' = 'jpg',
): string {
  return format === 'webp'
    ? `https://i.ytimg.com/vi_webp/${videoId}/${size}.webp`
    : `https://i.ytimg.com/vi/${videoId}/${size}.jpg`;
}
