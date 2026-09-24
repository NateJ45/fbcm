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
