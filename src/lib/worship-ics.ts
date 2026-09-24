// scaffold-file: journal
// "Add to calendar" on a sermon preview (2026-09-24, feat/scripture-text): the
// calendar file for the Sunday that preview is for. Pure.
//
// Every value is DERIVED (CLAUDE.md rule 15): the Sunday from the publish date
// (sundayOf), the time and the length from Site settings (clock24 and
// minutesOf, the same parsers the Church JSON-LD uses), the place from Site
// settings' address, the words from the post. Nothing is typed for the
// calendar. Null when Site settings has no readable service time: no file is
// better than a file at the wrong hour.
//
// The UID is the Sunday's, not the post's, so adding the same Sunday twice (or
// from two posts) updates one event rather than making two.

import { buildIcs } from './ics.ts';
import { clean, clock24, minutesOf, parseAddress } from './church-schema.ts';
import { timeOnly } from './live-sunday.ts';
import { isoDay } from './sermon-derive.ts';

export interface WorshipIcsInput {
  settings: {
    serviceTime?: string | null;
    serviceLength?: string | null;
    address?: string | null;
    livestreamUrl?: string | null;
  } | null;
  /** The Sunday (sundayOf the post's publish date), a Date at 00:00 UTC. */
  sunday: Date;
  /** DTSTAMP: the post's publish time, so a rebuild writes the same bytes. */
  stamp: Date;
  siteName: string;
  domain: string;
  postTitle: string;
  postUrl: string;
  reading?: string;
}

/** When the calendar does not say how long: an hour. */
export const DEFAULT_SERVICE_MINUTES = 60;

/** The event's minutes after midnight, or null. */
export function serviceMinutes(serviceTime: string | null | undefined): number | null {
  const hhmm = clock24(timeOnly(clean(serviceTime ?? '')));
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** The address as one line: "309 East Adams Street, Muncie, IN 47305". */
export function addressLine(address: string | null | undefined): string {
  const a = parseAddress(address);
  if (!a) return '';
  const town = [a.addressLocality, [a.addressRegion, a.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [a.streetAddress, town].filter(Boolean).join(', ');
}

export function worshipIcs(input: WorshipIcsInput): string | null {
  const minutes = serviceMinutes(input.settings?.serviceTime);
  if (minutes === null) return null;
  const length = minutesOf(input.settings?.serviceLength) ?? DEFAULT_SERVICE_MINUTES;
  const day = isoDay(input.sunday);
  const title = clean(input.postTitle).trim();
  const reading = clean(input.reading ?? '').trim();
  const live = clean(input.settings?.livestreamUrl ?? '').trim();
  const description = [
    `This Sunday's sermon: ${title}${reading ? ` (${reading})` : ''}.`,
    `Sermon preview: ${input.postUrl}`,
    /^https?:\/\//.test(live) ? `Watch live: ${live}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return buildIcs({
    prodId: `-//${input.siteName}//Website//EN`,
    stamp: input.stamp,
    events: [
      {
        uid: `sunday-worship-${day}@${input.domain}`,
        start: { date: day, minutes },
        durationMinutes: length,
        summary: `Sunday worship at ${input.siteName}`,
        location: addressLine(input.settings?.address) || undefined,
        description,
        url: input.postUrl,
      },
    ],
  });
}

/** The file's path beside the post: /post/<slug>/sunday.ics. */
export const worshipIcsPath = (slug: string): string => `/post/${slug}/sunday.ics`;
