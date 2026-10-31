// Safe to edit by hand
// The one way a component reads the church's facts in the business-facts
// shape (PORTS.md cards 196 and 198): the Site settings query (one memoized
// Sanity read per build) through churchFacts(), with the building's map
// point from src/data/site.ts. The starter's equivalent is business-data.ts;
// this site keeps its facts on Site settings, so it reads them from there.
import { site } from '@/data/site';
import { getSiteSettings } from '@/lib/queries';
import type { BusinessFacts } from '@/lib/business-facts';
import { churchFacts, officeLines, type ChurchFactsSettings } from '@/lib/church-facts';

export interface ChurchFactsRead {
  facts: BusinessFacts;
  /** The office hours as typed, one line each (never parsed into open spells). */
  office: string[];
}

let _read: Promise<ChurchFactsRead> | null = null;

function read(s: ChurchFactsSettings | null | undefined): ChurchFactsRead {
  return { facts: churchFacts(s, site.geo ?? null), office: officeLines(s?.officeHours) };
}

/** The church's facts, resolved once per build. */
export function getChurchFacts(): Promise<ChurchFactsRead> {
  _read ??= getSiteSettings().then((s) => read(s as ChurchFactsSettings | null));
  return _read;
}

/**
 * The facts a block draws: the fixture facts the styleguide wall passes (so
 * the thumbnail and the tests have something to show), else the church's. A
 * block on a real page never carries facts.
 */
export async function churchFactsFor(
  fixture?: ChurchFactsSettings | null,
): Promise<ChurchFactsRead> {
  return fixture ? read(fixture) : getChurchFacts();
}
