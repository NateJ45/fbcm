// Safe to edit by hand
// The build-time read of the church calendar (2026-09-25, `feat/whats-on`).
// The pure half (reading the iCal, what the page draws) is
// src/lib/church-calendar.ts; this file only finds the feed and fetches it,
// with every failure turned into null so the page shows its "see the full
// calendar" state and the build carries on. Shaped like src/lib/last-sunday.ts.
//
// WHICH CALENDAR. Church Trac names a church's public calendar by a code in
// its URLs (public_calendar?ui=0C7B1090 for the embed, ical?ui=0C7B1090 for
// the feed). The code is read from Site settings > Church systems > Events
// calendar when that box holds a Church Trac calendar address, so moving to
// another calendar is one edit there. While the box holds something else
// (Church Center's calendar, before the switch) or nothing, the church's own
// code below is used. The code is public: Church Trac publishes it for embeds.
//
// ONE FETCH PER BUILD. The events page and each event's calendar file all ask
// for the feed; the first ask fetches it and the rest share the answer.
//
// THE TEST SEAM. Playwright's build sets CHURCH_CALENDAR_FIXTURE=1 (and
// CHURCH_CALENDAR_NOW) so the page renders from tests/fixtures/churchtrac.ics
// at a fixed moment, offline; CHURCH_CALENDAR_FIXTURE=unavailable proves the
// fallback. Neither is set by any deploy. They are read through
// import.meta.env and the fixture through a `?raw` import, as the home page
// reads its YouTube fixture: the build prerenders inside workerd, where
// process.env and node:fs are not the build machine's.

import {
  feedZones,
  parseIcs,
  whatsOn,
  type CalendarEvent,
  type WhatsOn,
} from './church-calendar.ts';

/** FBCM's Church Trac calendar code (from the embed page, 2026-09-25). */
export const FBCM_CALENDAR_CODE = '0C7B1090';

export const FEED_TIMEOUT_MS = 8000;

/** The Church Trac calendar code in an address, or null. */
export function calendarCode(url: string | null | undefined): string | null {
  const raw = String(url ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!/(^|\.)churchtrac\.com$/i.test(u.hostname)) return null;
    const code = u.searchParams.get('ui');
    return code && /^[A-Za-z0-9]{4,32}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

/** Is this address some other calendar than a Church Trac one (and not Church Center's)? */
function isOtherCalendar(url: string | null | undefined): boolean {
  const raw = String(url ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
  if (!raw || calendarCode(raw)) return false;
  // Church Center's calendar is what the box held before the switch, and a
  // Church Trac page with no calendar code (fbcmuncie.churchtrac.com/
  // upcoming_events, OPERATIONS.md's suggestion for the box) is the same
  // church: both keep the church's own Church Trac calendar.
  return !/churchcenter\.com|planningcenteronline\.com|churchtrac\.com/i.test(raw);
}

export interface CalendarSettings {
  calendarUrl?: string | null;
}

/** The Church Trac code this build reads, or null when Site settings points elsewhere. */
export function codeFor(settings: CalendarSettings | null | undefined): string | null {
  const fromBox = calendarCode(settings?.calendarUrl);
  if (fromBox) return fromBox;
  return isOtherCalendar(settings?.calendarUrl) ? null : FBCM_CALENDAR_CODE;
}

export const feedUrl = (code: string) =>
  `https://www.churchtrac.com/ical?ui=${encodeURIComponent(code)}`;
/** Church Trac's own page for the calendar: the "full calendar" link. */
export const publicCalendarUrl = (code: string) =>
  `https://www.churchtrac.com/public_calendar?ui=${encodeURIComponent(code)}&view=listMonth`;

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * The feed's text, or null on any failure (network, status, timeout, not a
 * calendar). Two tries, and every failure is LOGGED with its reason, so a
 * missing calendar is never a silent one in the deploy log.
 */
export async function fetchCalendar(
  code: string,
  fetchImpl: Fetch = fetch,
  timeoutMs: number = FEED_TIMEOUT_MS,
  log: (msg: string) => void = (m) => console.warn(m),
): Promise<string | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(feedUrl(code), {
        signal: controller.signal,
        // Church Trac's servers answer 403 to a request with NO User-Agent
        // (the build's workerd prerender sends none) and to
        // `Accept-Language: *` (Node's fetch default). Both measured
        // 2026-09-25 with curl; either one alone is refused.
        headers: {
          Accept: 'text/calendar, */*;q=0.1',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (compatible; FBCM-website-build; +https://www.fbcmuncie.org)',
        },
      });
      const text = await res.text();
      if (res.ok && /BEGIN:VCALENDAR/i.test(text)) return text;
      log(
        `[church-calendar] try ${attempt}: HTTP ${res.status}, not a calendar: ${JSON.stringify(text.slice(0, 160))}`,
      );
    } catch (err) {
      log(
        `[church-calendar] try ${attempt}: ${String((err as Error)?.name === 'AbortError' ? `timed out after ${timeoutMs} ms` : err)}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

let shared: Promise<CalendarEvent[] | null> | null = null;

/** Vite's env in a build; undefined under `node --test`. */
const env = (name: string): string | undefined =>
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[name];

async function fixture(): Promise<string | null | undefined> {
  const flag = env('CHURCH_CALENDAR_FIXTURE');
  if (!flag) return undefined;
  if (flag === 'unavailable') return null;
  return (await import('../../tests/fixtures/churchtrac.ics?raw')).default;
}

/** The build's moment: CHURCH_CALENDAR_NOW in the test build, else the clock. */
export function calendarNow(): Date {
  const fixed = env('CHURCH_CALENDAR_NOW');
  const d = fixed ? new Date(fixed) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** The calendar's events for Site settings' calendar, once per build, or null. */
export function loadCalendarEvents(
  settings: CalendarSettings | null | undefined,
  fetchImpl: Fetch = fetch,
): Promise<CalendarEvent[] | null> {
  if (shared) return shared;
  shared = (async () => {
    const fixed = await fixture();
    let text: string | null;
    if (fixed !== undefined) text = fixed;
    else {
      const code = codeFor(settings);
      if (!code) {
        console.warn(
          '[church-calendar] Events calendar in Site settings is not a Church Trac calendar; no events read.',
        );
        return null;
      }
      text = await fetchCalendar(code, fetchImpl);
    }
    if (text === null) return null;
    const events = parseIcs(text);
    const zones = feedZones(events).filter((z) => z !== 'America/Indiana/Indianapolis');
    if (zones.length) {
      console.warn(
        `[church-calendar] the feed names ${zones.join(', ')}; its times are read as Muncie's clock (church-calendar.ts says why).`,
      );
    }
    return events;
  })();
  return shared;
}

/** What the events page draws, or null when the calendar could not be read. */
export async function loadWhatsOn(
  settings: CalendarSettings | null | undefined,
  now: Date = calendarNow(),
): Promise<WhatsOn | null> {
  const events = await loadCalendarEvents(settings);
  return events ? whatsOn(events, now) : null;
}
