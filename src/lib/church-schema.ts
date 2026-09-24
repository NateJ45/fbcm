// Foundation, edit with care
// The church's structured data (JSON-LD), as pure functions (2026-09-24, the
// craft-details pass). schemas.ts wraps these with the site's URL and hands
// the strings to BaseLayout; everything that decides WHAT is said lives here,
// where `node --test` can reach it (schemas.ts imports '@/data/site', which a
// plain node test cannot resolve).
//
// WHAT A PAGE CARRIES, AND WHY THERE IS NEVER A SECOND COPY
//   every page     one `Church` node (typed ["Church", "Organization"], see
//                  below), emitted by BaseLayout from Site settings
//   /visit         + one `Event`: the weekly Sunday worship (sundayWorshipNode)
//   pages, posts   + one `BreadcrumbList` (the route passes it)
//   /post/<slug>   + one `BlogPosting` (./post-schema.ts, the journal's own
//                  file); a sermon preview's is about the Sunday it previews
//                  and cites its reading
//
// WHY ["Church", "Organization"]. schema.org's `Church` is a PLACE (Place >
// CivicStructure > PlaceOfWorship > Church): it may carry an address, a geo
// point, a telephone and a logo, but not an email, and it cannot be the
// `publisher` of a BlogPosting (Google wants an Organization there). The
// congregation and its building share one name, one address and one phone, so
// the node is typed as both rather than split into two nodes that would repeat
// every fact and could drift apart.
//
// NOTHING HERE IS TYPED TWICE (CLAUDE.md rule 15). The address, the phone, the
// email, the service time and its length, the livestream and the Church Center
// address are all read from Site settings. The one fact that is not in Site
// settings is the building's map point, which lives in src/data/site.ts with
// its source (OpenStreetMap), because a building does not move.
//
// THE WEEKLY SERVICE. Google's event documentation supports only pages about a
// SINGLE event and asks for a separate Event per occurrence; it has no
// markup for a weekly series. schema.org does: an Event with an
// `eventSchedule` (a Schedule repeating every P1W on Sundays). So the Visit
// page carries one Event whose `eventSchedule` says "every Sunday at 10:45",
// and whose `startDate` is one real occurrence: the Sunday of the newest post
// on the site (sermon previews go up weekly), which is deterministic for a
// given dataset, so a rebuild of the same content renders the same bytes
// (the parity harness depends on that) and it moves forward on its own every
// week the church posts. A build clock would do the same job and break parity
// every Sunday. Each sermon preview's BlogPosting is `about` the dated Sunday
// it previews, which is the single-occurrence form Google does read.

import { splitStega } from './preview-stega.ts';
import { timeOnly } from './live-sunday.ts';

/** The church's clock (the same zone sermon-derive.ts reads posts in; not
 *  imported from there because that file belongs to the journal capability
 *  and this one must survive its removal). */
export const CHURCH_TZ = 'America/Indiana/Indianapolis';

/** YYYY-MM-DD of a day held as a Date at 00:00 UTC. */
const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * The first Sunday on or after the calendar day `iso` falls on in Muncie, as a
 * Date at 00:00 UTC; null for a missing or unreadable date. The Visit page's
 * Event names this Sunday for the newest post (see the header).
 */
export function sundayOnOrAfter(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHURCH_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const d = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  return d;
}

export type Json = Record<string, unknown>;

export const clean = (s: unknown): string =>
  typeof s === 'string' ? splitStega(s).cleaned.replace(/\s+/g, ' ').trim() : '';

/** Drop undefined, null, '' and [] so a missing fact is absent, never blank. */
export function compact<T extends Json>(obj: T): T {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

// ── Address ─────────────────────────────────────────────────────────────────

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry: 'US';
}

/**
 * Site settings' address ("309 East Adams Street\nMuncie, IN 47305") as a
 * PostalAddress. The first line is the street; the town line is read as
 * "City, ST 12345" when it has that shape, and otherwise left off rather than
 * guessed. Returns null when there is no street.
 */
export function parseAddress(address: string | null | undefined): PostalAddress | null {
  const lines = clean(address ?? '')
    ? splitStega(address ?? '')
        .cleaned.split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  const street = lines[0];
  if (!street) return null;
  // A one-line address ("309 East Adams Street, Muncie, IN 47305") splits on
  // its commas instead.
  let town = lines.slice(1).join(', ');
  let streetAddress = street;
  if (!town) {
    const parts = street.split(',').map((p) => p.trim());
    if (parts.length >= 3) {
      streetAddress = parts[0] ?? street;
      town = parts.slice(1).join(', ');
    }
  }
  const m = /^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/.exec(town);
  return compact({
    '@type': 'PostalAddress' as const,
    streetAddress,
    addressLocality: m?.[1],
    addressRegion: m?.[2],
    postalCode: m?.[3],
    addressCountry: 'US' as const,
  });
}

// ── The service time ────────────────────────────────────────────────────────

/** "10:45 am" -> "10:45", "7 pm" -> "19:00", "12:30 p.m." -> "12:30". '' when unreadable. */
export function clock24(time: string | null | undefined): string {
  const m = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/i.exec(clean(time ?? ''));
  if (!m) return '';
  let h = Number(m[1]);
  const min = Number(m[2] ?? '0');
  if (h < 1 || h > 12 || min > 59) return '';
  const pm = m[3]?.toLowerCase() === 'p';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  half: 0.5,
};

/**
 * Site settings' service length in minutes: "About an hour" -> 60, "About an
 * hour and a half" -> 90, "75 minutes" -> 75, "1 hour 15 minutes" -> 75.
 * Null when the words say nothing measurable.
 */
export function minutesOf(length: string | null | undefined): number | null {
  const t = clean(length ?? '').toLowerCase();
  if (!t) return null;
  const num = (w: string | undefined): number | null => {
    if (!w) return null;
    if (/^\d+(\.\d+)?$/.test(w)) return Number(w);
    return NUMBER_WORDS[w] ?? null;
  };
  let total = 0;
  let found = false;
  const hours = /(\d+(?:\.\d+)?|an?|one|two|three)\s+hours?/.exec(t);
  if (hours) {
    total += (num(hours[1]) ?? 0) * 60;
    found = true;
    if (/hours?\s+and\s+a\s+half/.test(t)) total += 30;
  }
  const mins = /(\d+)\s*(?:minutes?|mins?)\b/.exec(t);
  if (mins) {
    total += Number(mins[1]);
    found = true;
  }
  return found && total > 0 ? total : null;
}

/** 60 -> "PT1H", 75 -> "PT1H15M", 45 -> "PT45M". */
export function isoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const body = `${h ? `${h}H` : ''}${m ? `${m}M` : ''}`;
  return `PT${body || '0M'}`;
}

/** "10:45" + 60 -> "11:45". Wraps past midnight. */
export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = ((((h ?? 0) * 60 + (m ?? 0) + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The UTC offset the church's clock keeps on a given calendar day, as
 * "-04:00" / "-05:00". Read at noon, so a day a DST change falls on still
 * gets the offset its morning service keeps (the change is at 2 am).
 */
export function zoneOffset(day: Date, timeZone: string = CHURCH_TZ): string {
  const noon = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 12, 0, 0),
  );
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(noon)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!m) return '+00:00';
  return `${m[1]}${String(m[2]).padStart(2, '0')}:${m[3] ?? '00'}`;
}

// ── The church ──────────────────────────────────────────────────────────────

export interface ChurchSettings {
  title?: string | null;
  tagline?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  serviceTime?: string | null;
  serviceLength?: string | null;
  youtubeUrl?: string | null;
  churchCenterUrl?: string | null;
  churchTracUrl?: string | null;
  livestreamUrl?: string | null;
  directionsUrl?: string | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialLinks?: Array<{ url?: string | null } | null> | null;
}

export interface SiteFacts {
  /** https://www.example.org, no trailing slash. */
  url: string;
  name: string;
  /** The building's map point. */
  geo?: { latitude: number; longitude: number } | null;
  /** Absolute URL of the church's logo. */
  logo?: string;
  /** Absolute URL of the church's share picture. */
  image?: string;
  /** Other records of the same building (Wikidata). */
  sameAsPlace?: string[];
  /** The church's Google Business Profile (its Google Maps place link), once
   *  claimed. When set it is listed in `sameAs` and becomes `hasMap`, since a
   *  link to the place itself beats Site settings' address search. */
  googleBusinessProfile?: string;
}

/** The page that describes the Sunday service, and so carries its Event and
 *  the when-and-where line on its share card. */
export const SERVICE_PAGE_SLUG = 'visit';

export const churchId = (siteUrl: string): string => `${siteUrl}/#church`;

export const httpUrl = (u: unknown): string => {
  const s = clean(u);
  return /^https?:\/\//.test(s) ? s : '';
};

/** A URL's identity for de-duplication: no scheme, no `www.`, no trailing
 *  slash, host in lower case. The first spelling seen is the one kept.
 *  Exported for src/lib/social-links.ts, which lower-cases the path on top. */
export const urlKey = (u: string): string =>
  u
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/+$/, '')
    .replace(/^[^/]+/, (host) => host.toLowerCase());

/**
 * Every record of the church elsewhere, deduplicated, in a stable order: its
 * YouTube channel, its Church Center and Church Trac sites (the church's own
 * pages on those services), its social profiles from Site settings, then the
 * `extra` records (Wikidata, the Google Business Profile once claimed).
 */
export function sameAsOf(s: ChurchSettings | null | undefined, extra: string[] = []): string[] {
  const all = [
    s?.youtubeUrl,
    s?.churchCenterUrl,
    s?.churchTracUrl,
    s?.socialFacebook,
    s?.socialInstagram,
    ...(s?.socialLinks ?? []).map((l) => l?.url),
    ...extra,
  ]
    .map(httpUrl)
    .filter(Boolean);
  const seen = new Set<string>();
  return all.filter((u) => {
    const k = urlKey(u);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function churchNode(settings: ChurchSettings | null | undefined, site: SiteFacts): Json {
  const s = settings ?? {};
  const address = parseAddress(s.address);
  return compact({
    '@context': 'https://schema.org',
    '@type': ['Church', 'Organization'],
    '@id': churchId(site.url),
    name: clean(s.title) || site.name,
    description: clean(s.tagline),
    url: site.url,
    logo: site.logo,
    image: site.image,
    telephone: clean(s.phone),
    email: clean(s.email),
    address: address ?? undefined,
    geo: site.geo
      ? { '@type': 'GeoCoordinates', latitude: site.geo.latitude, longitude: site.geo.longitude }
      : undefined,
    hasMap: httpUrl(site.googleBusinessProfile) || httpUrl(s.directionsUrl),
    // Open to anyone, free: the Visit page's own "Anyone is welcome to attend
    // our time of Worship". Both are Place properties (Church is a Place);
    // Google has no Church rich result, so it reads them without judging them.
    isAccessibleForFree: true,
    publicAccess: true,
    sameAs: sameAsOf(s, [...(site.sameAsPlace ?? []), httpUrl(site.googleBusinessProfile)]),
  });
}

// ── The weekly service ──────────────────────────────────────────────────────

/**
 * The Sunday worship service as a recurring Event. `occurrence` is the one
 * dated Sunday the node names as its startDate (see the header: the Sunday of
 * the newest post). Returns null when Site settings has no readable time.
 */
export function sundayWorshipNode(
  settings: ChurchSettings | null | undefined,
  site: SiteFacts,
  opts: { pageUrl: string; occurrence: Date | null; image?: string },
): Json | null {
  const s = settings ?? {};
  const serviceTime = clean(s.serviceTime);
  const start = clock24(timeOnly(serviceTime));
  if (!start) return null;
  const minutes = minutesOf(s.serviceLength);
  const end = minutes ? addMinutes(start, minutes) : '';
  const address = parseAddress(s.address);
  const name = clean(s.title) || site.name;
  const livestream = httpUrl(s.livestreamUrl);

  const dated = (day: Date | null, hhmm: string) =>
    day && hhmm ? `${isoDay(day)}T${hhmm}:00${zoneOffset(day)}` : undefined;
  // An end past midnight would belong to the next day; a service never does.
  const endDate = end && end > start ? dated(opts.occurrence, end) : undefined;

  // Inline, with no @id: an Event's location must carry its own address for
  // Google, and a second node under the church's @id would be a second copy.
  const place = compact({
    '@type': 'Place',
    name,
    address: address ?? undefined,
  });
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${opts.pageUrl}#sunday-worship`,
    name: 'Sunday worship',
    description: [
      `Worship ${serviceTime.replace(/^Sundays/, 'on Sundays')}`,
      address?.streetAddress ? ` at ${address.streetAddress}` : '',
      address?.addressLocality ? `, ${address.addressLocality}` : '',
      '.',
      clean(s.serviceLength) ? ` ${clean(s.serviceLength)}.` : '',
    ].join(''),
    url: opts.pageUrl,
    image: opts.image,
    startDate: dated(opts.occurrence, start),
    endDate,
    eventSchedule: compact({
      '@type': 'Schedule',
      repeatFrequency: 'P1W',
      byDay: 'https://schema.org/Sunday',
      startTime: `${start}:00`,
      endTime: end && end > start ? `${end}:00` : undefined,
      duration: minutes ? isoDuration(minutes) : undefined,
      scheduleTimezone: CHURCH_TZ,
    }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: livestream
      ? 'https://schema.org/MixedEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: livestream ? [place, { '@type': 'VirtualLocation', url: livestream }] : place,
    organizer: { '@id': churchId(site.url) },
    isAccessibleForFree: true,
  });
}

// ── Share cards ──────────────────────────────────────────────────────────

/** The share card's path for a route, the convention BaseLayout and the generator share. */
export function ogCardPath(pathname: string): string {
  const trimmed = pathname.replace(/^\/|\/$/g, '');
  return trimmed ? `/og/${trimmed.replace(/\//g, '-')}.png` : '/og/home.png';
}

// ── Breadcrumbs ─────────────────────────────────────────────────────────────

export function breadcrumbNode(crumbs: Array<{ name: string; url: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: clean(c.name) || c.name,
      item: c.url,
    })),
  };
}

/** JSON for a <script type="application/ld+json">, with "</" escaped so a
 *  title can never close the script tag early. */
export function ldJson(node: Json): string {
  return JSON.stringify(node).replace(/<\//g, '<\\/');
}
