// scaffold-file: journal
// Safe to edit by hand
//
// Past events off Home's Church Blog rows (2026-09-25, feat/visit-fixes).
//
// WHY. A visitor audit in late September found Home's rows led by "Upcoming
// Events at FBC Muncie | Lent & Easter 2026" (March) and a December 2025 post:
// the durable-first split (blog-derive.ts) put every FBCM Events post ahead of
// the sermon previews, however old its event. /blog stays a complete dated
// register (Nathan's decision); only Home's rows drop an event that is over.
//
// DERIVED, NEVER STORED (CLAUDE.md rule 15). There is no "event date" field
// and this adds none: the date is read off the post itself, every build. The
// deploy workflow rebuilds four times a week (deploy.yml's crons) as well as
// on every publish, so a post drops off within days of its event.
//
// THE RULE, and it is deliberately conservative: when in doubt, keep.
//   1. Only a post filed under "FBCM Events" is ever hidden. Everything else,
//      including a sermon preview, passes straight through.
//   2. Its END is the latest calendar date written in its title, excerpt or
//      body ("Sunday, April 5, 2026", "Friday, December 11th", "Nov. 23"). A
//      date with no year takes the first year that puts it no more than 90
//      days before the post was published (a schedule posted on 2 December
//      still lists the 23 November meal; a Christmas post names 1 January).
//      A date with a year more than a year before publication is history, not
//      the event ("built in December 1929"), and is not counted.
//   3. No written date, but a year in the title or excerpt ("Messy Camp
//      2025"): the end is 31 January of the next year, which covers a
//      Christmas-to-New-Year schedule.
//   4. Nothing at all: 180 days after publication. Every one of the church's
//      13 event posts has a date, so this is a backstop, not the rule.
//   5. The post is past when its end is BEFORE today on the church's calendar
//      (sermon-derive.ts localDay): the event's own day still shows it.
//
// STEGA. In the Studio preview every string carries invisible markers, so
// every string is cleaned before it is matched (blog-derive.ts clean()).
import { clean, type BlogCategory } from './blog-derive.ts';
import { localDay } from './sermon-derive.ts';

/** The fields the rule reads. Home's row items are adapted to this shape. */
export interface EventCandidate {
  title?: string | null;
  excerpt?: string | null;
  /** The body as plain text (GROQ `pt::text(body)`). */
  text?: string | null;
  publishedAt?: string | null;
  categories?: BlogCategory[] | null;
}

/** How far before publication a year-less date may fall and still be this event. */
export const LOOKBACK_DAYS = 90;
/** The backstop window for an event post with no date or year at all. */
export const UNDATED_DAYS = 180;

const DAY = 86_400_000;

/** Is this post filed under the church's events category? */
export function isEventPost(entry: EventCandidate): boolean {
  return (entry.categories ?? []).some(
    (c) =>
      clean(c?.title).trim().toLowerCase() === 'fbcm events' ||
      clean(c?.slug?.current).trim() === 'fbcm-events',
  );
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// "April 5", "Dec. 25", "December 11th", "Sept 3, 2025". A day followed by a
// colon or another digit is a time or a verse, never a date ("March 7:00").
const DATE_RE =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?![:\d])(?:,?\s+(\d{4})\b)?/gi;

/** A real calendar day at 00:00 UTC, or null (30 February is not a day). */
function day(y: number, m: number, d: number): Date | null {
  const at = new Date(Date.UTC(y, m, d));
  return at.getUTCMonth() === m && at.getUTCDate() === d ? at : null;
}

/** Every calendar date the post writes down, resolved against its publication day. */
export function writtenDates(entry: EventCandidate, published: Date): Date[] {
  const words = [entry.title, entry.excerpt, entry.text].map((s) => clean(s)).join('\n');
  const earliest = published.getTime() - LOOKBACK_DAYS * DAY;
  const history = published.getTime() - 366 * DAY;
  const out: Date[] = [];
  for (const m of words.matchAll(DATE_RE)) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const d = Number(m[2]);
    if (m[3]) {
      const at = day(Number(m[3]), month, d);
      if (at && at.getTime() >= history) out.push(at);
      continue;
    }
    const y = published.getUTCFullYear();
    const at = [y - 1, y, y + 1]
      .map((year) => day(year, month, d))
      .find((c): c is Date => c !== null && c.getTime() >= earliest);
    if (at) out.push(at);
  }
  return out;
}

/**
 * The last day of the event a post announces, or null when the post is not an
 * event post or has no publication date (null means "keep it").
 */
export function eventEnd(entry: EventCandidate): Date | null {
  if (!isEventPost(entry)) return null;
  const published = localDay(entry.publishedAt ?? null);
  if (!published) return null;

  const dates = writtenDates(entry, published);
  if (dates.length > 0) return new Date(Math.max(...dates.map((d) => d.getTime())));

  const years = [...`${clean(entry.title)} ${clean(entry.excerpt)}`.matchAll(/\b(20\d{2})\b/g)];
  if (years.length > 0) {
    const y = Math.max(...years.map((m) => Number(m[1])));
    return new Date(Date.UTC(y + 1, 0, 31));
  }

  return new Date(published.getTime() + UNDATED_DAYS * DAY);
}

/** Is this an event post whose event is over? `now` is any instant. */
export function isPastEvent(entry: EventCandidate, now: Date): boolean {
  const end = eventEnd(entry);
  const today = localDay(now.toISOString());
  if (!end || !today) return false;
  return end.getTime() < today.getTime();
}

/** The list without its past events, order kept. Never adds or re-sorts. */
export function withoutPastEvents<T extends EventCandidate>(entries: readonly T[], now: Date): T[] {
  return (entries ?? []).filter((e) => !isPastEvent(e, now));
}
