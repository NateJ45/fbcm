// Safe to edit by hand
// "Watch live" becomes "Live now" while the Sunday service is on (2026-09-24).
//
// The site is static, so the header is built saying "Watch live" at every
// moment, which is true whatever the clock says. The browser then asks
// isLiveNow() and, only inside the service window, upgrades the link to "Live
// now" with a pulsing gold dot. Same shape as live-sunday.ts: the server string
// needs no clock, the visitor's clock does the rest.
//
// THE WINDOW. Sunday, from the Site settings service time ("Sundays at 10:45
// am") for 75 minutes, read on the CHURCH's wall clock
// (America/Indiana/Indianapolis), not the visitor's. A visitor in California
// at 7:45 their time is watching the 10:45 service, and the page has to agree
// with the pulpit, not with the laptop. The start is inclusive and the end is
// exclusive: 10:45:00 is live, 12:00:00 is not. Working on the zone's wall
// clock (via Intl) is also what makes daylight saving a non-event: 10:45 is
// 14:45 UTC in summer and 15:45 UTC in winter, and nothing here has to know.
//
// Why 75 minutes and not the "How long the service runs" setting: that field
// is free prose ("About an hour"), written for people, and parsing it would
// make a sentence an editor retypes into a switch. 75 is the hour plus the
// time a stream runs over.
//
// BaseLayout carries a hand-inlined copy of serviceStartMinutes and isLiveNow
// in its upgrade script (an `is:inline` script cannot import). The drift gate
// is live-service-inline.test.ts; this file is the one the unit tests watch.
// Callers pass serviceTime through splitStega().cleaned FIRST (the preview
// rules in CLAUDE.md): this module parses the string.

import { timeOnly } from './live-sunday.ts';

/** The church's own clock. Muncie keeps Eastern time with daylight saving. */
export const SERVICE_TIME_ZONE = 'America/Indiana/Indianapolis';

/** How long "Live now" shows, in minutes from the service's start. */
export const LIVE_WINDOW_MINUTES = 75;

/**
 * The service's start as minutes after midnight, or null when the string has
 * no time in it. "Sundays at 10:45 am" -> 645; "6:30 P.M." -> 1110; "12 pm"
 * -> 720; "12:15 am" -> 15; a bare "10:45" is read as a 24-hour clock.
 */
export function serviceStartMinutes(serviceTime: string): number | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s*m\.?)?$/i.exec(timeOnly(serviceTime));
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? '0');
  const ap = (m[3] ?? '').toLowerCase();
  if (min > 59 || h > 23 || (ap && (h < 1 || h > 12))) return null;
  if (ap === 'a' && h === 12) h = 0;
  if (ap === 'p' && h !== 12) h += 12;
  return h * 60 + min;
}

/** Minutes since Sunday 00:00 on the wall clock of `timeZone`. */
export function weekMinutesIn(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return day * 1440 + Number(get('hour')) * 60 + Number(get('minute'));
}

/** True from the Sunday service's start, for LIVE_WINDOW_MINUTES, church time. */
export function isLiveNow(
  now: Date,
  serviceTime: string,
  timeZone: string = SERVICE_TIME_ZONE,
  windowMinutes: number = LIVE_WINDOW_MINUTES,
): boolean {
  const start = serviceStartMinutes(serviceTime);
  if (start === null) return false;
  const t = weekMinutesIn(now, timeZone);
  return t >= start && t < start + windowMinutes;
}

/**
 * Where "Watch live" goes: the live stream address, else the channel, else
 * nowhere (and the link does not render). Both arrive stega-cleaned.
 */
export function watchLiveHref(
  livestreamUrl: string | null | undefined,
  youtubeUrl: string | null | undefined,
): string | undefined {
  const pick = (u: string | null | undefined) => (typeof u === 'string' ? u.trim() : '');
  return pick(livestreamUrl) || pick(youtubeUrl) || undefined;
}

// ── A real "Live now" (2026-09-24) ──────────────────────────────────────────
// The window above is a guess about the clock. /api/live-status
// (src/pages/api/live-status.ts, logic in src/lib/live-status.ts) asks
// YouTube whether the church's channel is actually live. The browser asks it
// only inside the CHECK window, which is wider than the service window on
// both sides (a stream that starts early, or a service that runs long), at
// most once a minute. Its answer, while fresh, overrides the clock:
//
//   live       "Live now", linking to the live video when YouTube names one
//   not-live   "Watch live", even inside the service window
//   unknown    (no API key, YouTube failed, quota spent) the clock decides,
//              exactly as before this existed; a failed request is the same
//
// With no key configured the endpoint always says unknown, so the site
// behaves exactly as it did before.

/** Ask YouTube from this long before the service starts... */
export const CHECK_BEFORE_MINUTES = 75;
/** ...until this long after it starts (10:45 am -> 9:30 am to 1:00 pm). */
export const CHECK_AFTER_MINUTES = 135;
/** An answer older than this is ignored, and the clock decides again. */
export const STATUS_FRESH_MS = 150_000;

/** What the browser keeps of the endpoint's last answer. */
export interface ClientLiveStatus {
  status: 'live' | 'not-live' | 'unknown';
  /** The live video, when YouTube named one. Only ever a youtube.com URL. */
  url?: string;
  /** Date.now() when the answer arrived. */
  at: number;
}

declare global {
  interface Window {
    /** Set by BaseLayout's live-service script; read by the mobile menu. */
    __liveStatus?: ClientLiveStatus | null;
  }
}

/** Is it worth asking YouTube now? Sunday, around the service, church time. */
export function inCheckWindow(
  now: Date,
  serviceTime: string,
  timeZone: string = SERVICE_TIME_ZONE,
): boolean {
  const start = serviceStartMinutes(serviceTime);
  if (start === null) return false;
  const t = weekMinutesIn(now, timeZone);
  return t >= start - CHECK_BEFORE_MINUTES && t < start + CHECK_AFTER_MINUTES;
}

/** Only a youtube.com address may replace the link's own. */
export function safeLiveUrl(url: unknown): string | undefined {
  return typeof url === 'string' && /^https:\/\/(www\.)?youtube\.com\/[\w?=&/.-]+$/.test(url)
    ? url
    : undefined;
}

/**
 * The link's state: the endpoint's answer while it is fresh and we are inside
 * the check window, else the service-time window. `href` is set only when the
 * endpoint named the live video.
 */
export function resolveLive(
  now: Date,
  serviceTime: string,
  status: ClientLiveStatus | null | undefined,
): { live: boolean; href?: string } {
  const age = status ? now.getTime() - status.at : -1;
  if (status && age >= 0 && age < STATUS_FRESH_MS && inCheckWindow(now, serviceTime)) {
    if (status.status === 'live') return { live: true, href: safeLiveUrl(status.url) };
    if (status.status === 'not-live') return { live: false };
  }
  return { live: isLiveNow(now, serviceTime) };
}
