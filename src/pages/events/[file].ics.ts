// Safe to edit by hand
// /events/<key>.ics, generated at build time (2026-09-25, `feat/whats-on`):
// one calendar file for each row on "What's On", for its "Add to calendar"
// link. A dated row is one event (a run of Sundays is its first Sunday, with
// the run as a weekly rule and a count); a weekly gathering is a weekly rule.
// Everything comes from the Church Trac feed (src/lib/church-calendar-feed.ts)
// and Site settings; the file is written by src/lib/ics.ts, in Muncie's zone.
// A static file: Cloudflare serves .ics as text/calendar.

import type { APIRoute, GetStaticPaths } from 'astro';
import { site } from '@/data/site';
import { getSiteSettings } from '@/lib/queries';
import { buildIcs, type IcsEvent } from '@/lib/ics';
import { loadWhatsOn } from '@/lib/church-calendar-feed';
import { weekday } from '@/lib/church-calendar';

export const prerender = true;

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const getStaticPaths = (async () => {
  const settings = await getSiteSettings();
  const on = await loadWhatsOn(settings);
  if (!on) return [];
  const address = String(settings?.address ?? '')
    .replace(/\s*\n\s*/g, ', ')
    .trim();
  const place = (loc: string) => [loc, address].filter(Boolean).join(', ');
  const url = (key: string) => `${site.url}/events#${key}`;
  const paths: Array<{ params: { file: string }; props: { event: IcsEvent } }> = [];

  for (const it of on.months.flatMap((m) => m.items)) {
    if (it.startMinutes === null) continue; // all-day: no link is drawn
    paths.push({
      params: { file: it.key },
      props: {
        event: {
          uid: `${it.key}@${site.domain}`,
          start: { date: it.date, minutes: it.startMinutes },
          durationMinutes: it.durationMinutes ?? 60,
          summary: it.title,
          location: place(it.location),
          description: it.description || undefined,
          url: url(it.key),
          rrule: it.through ? `FREQ=WEEKLY;COUNT=${it.times}` : undefined,
        },
      },
    });
  }
  for (const w of on.weekly) {
    if (w.startMinutes === null) continue;
    paths.push({
      params: { file: w.key },
      props: {
        event: {
          uid: `${w.key}@${site.domain}`,
          start: { date: w.next, minutes: w.startMinutes },
          durationMinutes: w.durationMinutes ?? 60,
          summary: w.title,
          location: place(w.location),
          description: w.description || undefined,
          url: url(w.key),
          rrule: `FREQ=WEEKLY;BYDAY=${(w.days.length ? w.days : [weekday(w.next)]).map((d) => BYDAY[d]).join(',')}`,
        },
      },
    });
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const event = (props as { event: IcsEvent }).event;
  const body = buildIcs({
    prodId: `-//${site.domain}//What's On//EN`,
    // The event's own day, so a rebuild writes the same bytes.
    stamp: new Date(`${event.start.date}T00:00:00Z`),
    events: [event],
    name: site.name,
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
