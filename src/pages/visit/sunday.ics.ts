// Safe to edit by hand
// /visit/sunday.ics, generated at build time (2026-09-24, `feat/last-sunday`):
// the Sunday service as one weekly recurring calendar event, for Visit's "Add
// Sundays to your calendar" link. Everything in it comes from Site settings
// (the service time, its length, the address) and src/data/site.ts; the file
// itself is written by src/lib/sunday-ics.ts. A static file: Cloudflare serves
// .ics as text/calendar, which is what makes a phone offer to add it.

import type { APIRoute } from 'astro';
import { site } from '@/data/site';
import { getSiteSettings } from '@/lib/queries';
import { clean } from '@/lib/church-schema';
import { sundayServiceIcs } from '@/lib/sunday-ics';

export const prerender = true;

export const GET: APIRoute = async () => {
  const settings = await getSiteSettings();
  const ics = sundayServiceIcs({
    serviceTime: settings?.serviceTime,
    serviceLength: settings?.serviceLength,
    address: settings?.address,
    name: clean(settings?.title) || site.name,
    url: `${site.url}/visit`,
    domain: site.domain,
    geo: site.geo,
    now: new Date(),
  });
  // With no readable service time there is no event to offer: an empty
  // calendar is still a valid file, and Visit hides the link (see Hero.astro).
  const body =
    ics ??
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//' +
      site.domain +
      '//Sunday worship//EN\r\nEND:VCALENDAR\r\n';
  return new Response(body, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
