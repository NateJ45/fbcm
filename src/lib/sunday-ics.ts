// Safe to edit by hand
// "Add Sundays to your calendar" (2026-09-24, `feat/last-sunday`): the weekly
// Sunday service as an iCalendar file, served statically at /visit/sunday.ics
// (src/pages/visit/sunday.ics.ts) and linked from Visit's hero beside the
// service time.
//
// ONE RECURRING EVENT, DERIVED (CLAUDE.md rule 15). The start is Site
// settings' service time ("Sundays at 10:45 am", read by church-schema.ts's
// clock24), the length its service length ("About an hour" -> 60 minutes,
// minutesOf; an hour when the words say nothing measurable), the place its
// address, and the first occurrence the Sunday on or after the build. Nothing
// here is typed a second time. RRULE:FREQ=WEEKLY;BYDAY=SU, in the church's
// own zone with a VTIMEZONE block, so a subscriber in another zone sees the
// service at the church's 10:45, through daylight saving.
//
// MERGE NOTE. `feat/scripture-text` is building a general pure generator,
// src/lib/ics.ts, at the same time. This file keeps its line folding and
// escaping in two small exported helpers (icsEscape, icsFold) named as a
// general generator would name them, so when both land the Sunday event can be
// re-expressed through ics.ts and these two deleted. PENDING.md tracks it.

import {
  CHURCH_TZ,
  addMinutes,
  clean,
  clock24,
  minutesOf,
  parseAddress,
  sundayOnOrAfter,
} from './church-schema.ts';
import { timeOnly } from './live-sunday.ts';

/** When the service length says nothing measurable. */
export const DEFAULT_SERVICE_MINUTES = 60;

export interface SundayIcsInput {
  /** Site settings' service time, e.g. "Sundays at 10:45 am". */
  serviceTime?: string | null;
  /** Site settings' service length, e.g. "About an hour". */
  serviceLength?: string | null;
  /** Site settings' address, e.g. "309 East Adams Street\nMuncie, IN 47305". */
  address?: string | null;
  /** The church's name (Site settings' title, or site.name). */
  name: string;
  /** The Visit page's absolute URL. */
  url: string;
  /** The UID's domain, e.g. "fbcmuncie.org". */
  domain: string;
  geo?: { latitude: number; longitude: number };
  /** The build's moment: DTSTAMP, and the first Sunday on or after it. */
  now: Date;
}

/** Text value escaping (RFC 5545 3.3.11): backslash, semicolon, comma, newline. */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line at 75 octets (RFC 5545 3.1), never inside a UTF-8 character. */
export function icsFold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (size + n > limit) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join('\r\n ');
}

const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
const local = (day: Date, hhmm: string) =>
  `${day.toISOString().slice(0, 10).replace(/-/g, '')}T${hhmm.replace(':', '')}00`;

// America/Indiana/Indianapolis has kept US Eastern time with daylight saving
// since 2006, on the 2007 rules: second Sunday of March, first Sunday of
// November, at 2 am.
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${CHURCH_TZ}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'DTSTART:20070311T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'DTSTART:20071104T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** Whether Site settings' service time can be read, i.e. whether there is an event to offer. */
export function hasSundayEvent(serviceTime: string | null | undefined): boolean {
  return clock24(timeOnly(clean(serviceTime))) !== '';
}

/**
 * The calendar file, CRLF line endings, or null when the service time cannot
 * be read (then the route serves nothing and Visit shows no link).
 */
export function sundayServiceIcs(input: SundayIcsInput): string | null {
  const start = clock24(timeOnly(clean(input.serviceTime)));
  if (!start) return null;
  const first = sundayOnOrAfter(input.now.toISOString());
  if (!first) return null;
  const minutes = minutesOf(input.serviceLength) ?? DEFAULT_SERVICE_MINUTES;
  const end = addMinutes(start, minutes);
  const address = parseAddress(input.address);
  const where = address
    ? [
        input.name,
        address.streetAddress,
        [
          address.addressLocality,
          [address.addressRegion, address.postalCode].filter(Boolean).join(' '),
        ]
          .filter(Boolean)
          .join(', '),
      ]
        .filter(Boolean)
        .join(', ')
    : input.name;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${input.domain}//Sunday worship//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(input.name)}`,
    ...VTIMEZONE,
    'BEGIN:VEVENT',
    `UID:sunday-worship@${input.domain}`,
    `DTSTAMP:${stamp(input.now)}`,
    `DTSTART;TZID=${CHURCH_TZ}:${local(first, start)}`,
    // A service that ran past midnight would end on Monday; one never does.
    end > start ? `DTEND;TZID=${CHURCH_TZ}:${local(first, end)}` : `DURATION:PT${minutes}M`,
    'RRULE:FREQ=WEEKLY;BYDAY=SU',
    `SUMMARY:${icsEscape(`Sunday worship, ${input.name}`)}`,
    `LOCATION:${icsEscape(where)}`,
    ...(input.geo ? [`GEO:${input.geo.latitude};${input.geo.longitude}`] : []),
    `URL:${input.url}`,
    `DESCRIPTION:${icsEscape(`What to expect on Sunday: ${input.url}`)}`,
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(icsFold).join('\r\n') + '\r\n';
}
