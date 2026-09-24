// Safe to edit by hand
// A small iCalendar (RFC 5545) writer (2026-09-24, feat/scripture-text).
// Pure: no clock (the caller passes DTSTAMP), no network, no Sanity.
//
// Used by the sermon previews' "Add to calendar" (src/pages/post/[slug]/sunday.ics.ts:
// one Sunday's worship at the service time, at the church). Written to be
// reused as it is by a weekly-recurring event (the Visit page): pass `rrule`
// ("FREQ=WEEKLY;BYDAY=SU") and the first Sunday.
//
// THE RULES THAT MATTER, from RFC 5545:
//   - Lines end in CRLF, and a line longer than 75 OCTETS (UTF-8 bytes, not
//     characters) is folded: CRLF then one space, never inside a character
//     (3.1).
//   - TEXT values escape backslash, semicolon, comma and newline (3.3.11).
//   - A local time names its zone with TZID, and the calendar then carries a
//     VTIMEZONE for that zone (3.6.5). Muncie keeps Eastern time with daylight
//     saving (America/Indiana/Indianapolis has followed the US rules since
//     2006): the block below is those two rules and nothing else.
//   - Every VEVENT needs UID and DTSTAMP (3.6.1). DTSTAMP is passed in so a
//     rebuild writes the same bytes (the caller uses the post's publish time).

export const ICS_TZID = 'America/Indiana/Indianapolis';

/** A calendar day and a wall-clock time in the church's zone. */
export interface LocalStart {
  /** "YYYY-MM-DD" */
  date: string;
  /** Minutes after midnight on the wall clock (10:45 am = 645). */
  minutes: number;
}

export interface IcsEvent {
  /** Globally unique and stable across rebuilds ("sunday-2025-11-16@fbcmuncie.org"). */
  uid: string;
  start: LocalStart;
  durationMinutes: number;
  summary: string;
  location?: string;
  description?: string;
  url?: string;
  /** A recurrence rule without the "RRULE:" prefix, e.g. "FREQ=WEEKLY;BYDAY=SU". */
  rrule?: string;
}

export interface IcsCalendar {
  /** PRODID, e.g. "-//First Baptist Church Muncie//Website//EN". */
  prodId: string;
  /** DTSTAMP for every event: when this calendar's content was made. */
  stamp: Date;
  events: IcsEvent[];
  /** Optional calendar name (X-WR-CALNAME, read by Apple and Google). */
  name?: string;
}

/** Escape a TEXT value (RFC 5545 3.3.11). */
export function escapeText(value: string): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Fold one content line at 75 octets (RFC 5545 3.1): each continuation starts
 * with a single space, which counts toward its 75. Never splits a UTF-8
 * character.
 */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 75) {
      out.push(current);
      current = ' ' + ch;
      bytes = 1 + n;
    } else {
      current += ch;
      bytes += n;
    }
  }
  out.push(current);
  return out.join('\r\n');
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** "20251116T104500" from a local start (floating form, to pair with TZID). */
export function localStamp(start: LocalStart, addMinutes = 0): string {
  const [y, m, d] = start.date.split('-').map(Number);
  // Date.UTC does the calendar arithmetic (month and year roll-over) only; the
  // result is read back as wall-clock parts, never as an instant.
  const t = new Date(Date.UTC(y, m - 1, d, 0, start.minutes + addMinutes));
  return (
    `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}` +
    `T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`
  );
}

/** "20251111T150000Z" */
export function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** America/Indiana/Indianapolis: US Eastern rules since 2006. */
export const VTIMEZONE_INDIANAPOLIS = [
  'BEGIN:VTIMEZONE',
  `TZID:${ICS_TZID}`,
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

/** The whole calendar as a string with CRLF line endings. */
export function buildIcs(cal: IcsCalendar): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${cal.prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  if (cal.name) lines.push(`X-WR-CALNAME:${escapeText(cal.name)}`);
  lines.push(...VTIMEZONE_INDIANAPOLIS);
  for (const e of cal.events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${utcStamp(cal.stamp)}`,
      `DTSTART;TZID=${ICS_TZID}:${localStamp(e.start)}`,
      `DTEND;TZID=${ICS_TZID}:${localStamp(e.start, e.durationMinutes)}`,
    );
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push(`SUMMARY:${escapeText(e.summary)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
