// Safe to edit by hand
// The church's facts in the starter's business-facts shape (PORTS.md cards 196
// and 198, 2026-10-27). This site does NOT keep a second facts store: the
// address, phone and email stay the plain strings on Site settings > Church
// details that the footer, Visit and the JSON-LD already read (rule 15, typed
// once). This file only MAPS them into `BusinessFacts`, so the blocks that
// came with card 193 (the Contact details card) can fill themselves.
//
// What maps, and what does not:
//
// - Address. Site settings' `address` box (street on the first line, then
//   "Muncie, IN 47305") is split by `parseAddress()`, the same reader the
//   JSON-LD uses. The map point is the building's (`site.geo`). The
//   directions link is the office's own "Directions link" when one is typed,
//   else the Google Maps search the facts build.
// - Phone and email: as typed.
// - Confirmed flags. Card 198 has a church pass `strict`, so only an explicit
//   tick counts as confirmed. This site has no "confirmed" boxes: these facts
//   are the live site's published facts, typed by the office, so the reader
//   ticks them itself. Nothing on this site shows a "To confirm" tag.
// - Opening hours: LEFT UNSET on purpose. The starter's hours are open spells
//   (opens and closes), and nothing here can be turned into one honestly: the
//   service time is a start ("Sundays at 10:45 am") whose length is words
//   ("About an hour"), and the office hours are free text the office types.
//   So `hasHours` is false, no "open now" line is drawn anywhere, and the
//   phone Sunday bar keeps its own line (the service time, card 191).
//   `officeLines()` hands the office hours to a block as the lines they
//   were typed, the way Hours.astro and the footer show them.
import { resolveBusinessFacts, type BusinessFacts } from './business-facts.ts';
import { plain } from './business-hours.ts';
import { parseAddress } from './church-schema.ts';
import { hoursLines, type HoursBlock } from './office-hours.ts';
import { splitStega } from './preview-stega.ts';

/** The slice of Site settings this reader needs (all of it is in SITE_SETTINGS_PROJECTION). */
export interface ChurchFactsSettings {
  title?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  directionsUrl?: string | null;
  officeHours?: HoursBlock[] | null;
}

/**
 * The church's facts in the business-facts shape. Pure (unit-tested in
 * church-facts.test.ts): the settings and the map point in, facts out. Pages
 * read them through getChurchFacts() in church-facts-data.ts.
 */
export function churchFacts(
  settings: ChurchFactsSettings | null | undefined,
  geo: { latitude: number; longitude: number } | null = null,
): BusinessFacts {
  const s = settings ?? {};
  const postal = parseAddress(s.address);
  const facts = resolveBusinessFacts(
    {
      title: s.title,
      phone: s.phone,
      phoneConfirmed: true,
      email: s.email,
      emailConfirmed: true,
      street: postal?.streetAddress,
      city: postal?.addressLocality,
      state: postal?.addressRegion,
      zip: postal?.postalCode,
      addressConfirmed: true,
      geoLat: geo?.latitude ?? null,
      geoLng: geo?.longitude ?? null,
    },
    { strict: true },
  );
  const directions = plain(s.directionsUrl);
  if (facts.address && /^https:\/\//i.test(directions)) {
    facts.address = { ...facts.address, mapsUrl: directions };
  }
  return facts;
}

/**
 * The office hours as plain lines, as typed ("Monday to Thursday: 9 am to 12
 * pm and 1 pm to 4 pm"); a note line ("Closed on holidays") keeps its words
 * without its marks. Empty when the box is.
 */
export function officeLines(blocks: HoursBlock[] | null | undefined): string[] {
  return hoursLines(blocks)
    .map((line) => {
      if (line.kind === 'row') return `${splitStega(line.days).cleaned}: ${line.times}`;
      const text = (line.block.children ?? []).map((c) => c.text ?? '').join('');
      return splitStega(text).cleaned.trim();
    })
    .filter(Boolean);
}
