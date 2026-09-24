// Safe to edit by hand
// "Which door?": where each of a doors band's entrances sits on the sketch of
// the church's street side (2026-09-24, the craft-details pass). Pure and
// stega-safe, so it is unit-tested and behaves the same in the preview.
//
// THE SKETCH IS OF THIS BUILDING, AND ONLY WHAT IS KNOWN IS DRAWN. The church
// stands on the south-east corner of Adams Street (along its north side) and
// Jefferson Street (along its west side): the church's own History ("the new
// one on the corner of Jefferson and Adams streets") and OpenStreetMap (way
// 399259467, with Adams to its north and Jefferson to its west). The Visit
// page says the rest in the church's words: the circular drive entrance and
// the parking lot are on the Adams Street side, the Jefferson Street side doors
// open into the main hallway near the offices, and the wooden front doors go
// into the sanctuary. The library's photographs place those along the Adams
// frontage (the glass doors at the circular drive on the office wing, the red
// wooden doors at the foot of the tower, the lot beyond the sanctuary's east
// gable). That is a SKETCH of the street side, labelled "not to scale", never
// a floor plan: DoorPlan.astro draws it, and this file only decides which
// door is which.
//
// A door is placed by its OWN WORDS (rule 15: nothing to set in the Studio):
// "circular drive" is the drive entrance, "Jefferson" the side doors, and
// "wooden", "front door" or "sanctuary" the front doors. A door whose words
// match none of them is not pinned, and the sketch is drawn only when at least
// two doors are placed, so a band with other doors (or none) never gets a map
// that disagrees with its list.

import { splitStega } from './preview-stega.ts';

export type DoorPlace = 'drive' | 'front' | 'jefferson';

export interface PlanDoor {
  name?: string | null;
  body?: string | null;
}

export interface PlanItem {
  label?: string | null;
  big?: string | null;
  body?: string | null;
}

export interface DoorPin {
  /** 1-based position of the door in the band's list: the number on the pin. */
  n: number;
  place: DoorPlace;
}

export interface DoorPlan {
  pins: DoorPin[];
  /** Whether the band's own words mention the parking lot. */
  parking: boolean;
}

const words = (s: string | null | undefined): string =>
  splitStega(s ?? '')
    .cleaned.toLowerCase()
    .replace(/\s+/g, ' ');

/** Where a door is, from its name first and then its directions; null when its words do not say. */
export function doorPlace(door: PlanDoor | null | undefined): DoorPlace | null {
  if (!door) return null;
  for (const text of [words(door.name), words(door.body)]) {
    if (!text) continue;
    if (/circular[\s-]+drive/.test(text)) return 'drive';
    if (/\bjefferson\b/.test(text)) return 'jefferson';
    if (/\bwooden\b|\bfront doors?\b|\bsanctuary\b/.test(text)) return 'front';
  }
  return null;
}

/** The pins for a band's doors, or null when fewer than two can be placed. */
export function doorPlan(
  doors: readonly (PlanDoor | null | undefined)[],
  items: readonly (PlanItem | null | undefined)[] = [],
): DoorPlan | null {
  const pins: DoorPin[] = [];
  const taken = new Set<DoorPlace>();
  doors.forEach((door, i) => {
    const place = doorPlace(door);
    // One pin per place: a second door the same words point at stays in the
    // list, unpinned, rather than stacking two numbers on one spot.
    if (place && !taken.has(place)) {
      taken.add(place);
      pins.push({ n: i + 1, place });
    }
  });
  if (pins.length < 2) return null;
  const parking = items.some((it) => /\bparking\b/.test(`${words(it?.label)} ${words(it?.body)}`));
  return { pins, parking };
}

/** The anchor id of a door's row in the list, and of its pin on the sketch. */
export const doorRowId = (prefix: string, n: number): string => `${prefix}-door-${n}`;
export const doorPinId = (prefix: string, n: number): string => `${prefix}-pin-${n}`;
