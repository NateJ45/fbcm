// Safe to edit by hand
// "What's On" as schema.org Events (2026-09-25, `feat/whats-on`): one Event
// per dated row on /events, so a search engine can list the church's events
// with their date, time and place. Pure; the page serialises each node with
// ldJson(). Standing weekly gatherings are left out: they are not dated
// events, and the Sunday service already has its own recurring Event on
// /visit (church-schema.ts sundayWorshipNode).
//
// Validated offline like every other node (schema-vocab.ts), in
// church-calendar.test.ts and by `npm run check:jsonld` after a build.

import {
  CHURCH_TZ,
  churchId,
  compact,
  parseAddress,
  zoneOffset,
  type Json,
  type SiteFacts,
} from './church-schema.ts';
import type { DatedItem } from './church-calendar.ts';

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const dayDate = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** "2026-12-11T18:30:00-05:00", or the bare day for an all-day event. */
export function isoStart(date: string, minutes: number | null): string {
  if (minutes === null) return date;
  return `${date}T${hhmm(minutes)}:00${zoneOffset(dayDate(date), CHURCH_TZ)}`;
}

export function calendarEventNode(
  item: DatedItem,
  opts: { site: SiteFacts; pageUrl: string; churchName: string; address?: string | null },
): Json {
  const address = parseAddress(opts.address);
  const end =
    item.startMinutes !== null &&
    item.durationMinutes &&
    item.startMinutes + item.durationMinutes < 1440
      ? isoStart(item.date, item.startMinutes + item.durationMinutes)
      : undefined;
  // The room ("Fellowship Hall") is inside the church: name it, with the
  // church's own address, which Google needs on every Event.
  const place =
    item.location && item.location !== opts.churchName
      ? `${item.location}, ${opts.churchName}`
      : opts.churchName;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${opts.pageUrl}#${item.key}`,
    name: item.title,
    description: item.description || undefined,
    url: `${opts.pageUrl}#${item.key}`,
    startDate: isoStart(item.date, item.startMinutes),
    endDate: end,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: compact({ '@type': 'Place', name: place, address: address ?? undefined }),
    organizer: { '@id': churchId(opts.site.url) },
  });
}
