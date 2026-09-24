// Safe to edit by hand
// scaffold-file: church
// How a staff band looks, derived from what it shows (2026-09-24, the Staff
// identity pass). No colour field on the block (CLAUDE.md rule 9): the ground
// comes from the GROUP the band draws, so the three bands on /staff always
// read as the Who We Are goals sequence does (gold, brown, taupe after the
// indigo window), and a band that shows "Everyone" sits on the page itself.
//
//   pastors       gold band, indigo-dark ink    (The Way's ground)
//   coordination  brown band, white and gold    (Witness's ground)
//   support       taupe band, indigo-dark ink   (Work's ground)
//   all           the page's own paper          (flips with the theme)
//
// Every ink on each ground is a pair already measured in both themes in
// theme-tokens.test.ts (IDENTITY_PAIRS and THEMED_IDENTITY_PAIRS).
//
// The size of the lancets comes from how many people there are: three or
// fewer are drawn large, one row of them ("feature"); more are a list of
// smaller lancets, four to a row at desktop width ("list").
import { measureHeadline } from './headline-scale.ts';

export type StaffGround = 'gold' | 'brown' | 'taupe' | 'paper';
export type StaffSize = 'feature' | 'list';

export interface StaffBandLook {
  ground: StaffGround;
  /** True for the grounds that carry white ink. */
  dark: boolean;
}

const LOOKS: Record<string, StaffBandLook> = {
  pastors: { ground: 'gold', dark: false },
  coordination: { ground: 'brown', dark: true },
  support: { ground: 'taupe', dark: false },
};

/** The ground a band draws on, from the group it shows. Unknown or "all" is paper. */
export function staffBandLook(group: string | null | undefined): StaffBandLook {
  return LOOKS[group ?? 'all'] ?? { ground: 'paper', dark: false };
}

/** Large lancets for a handful of people, a list of smaller ones for more. */
export function staffSize(count: number): StaffSize {
  return count <= 3 ? 'feature' : 'list';
}

/**
 * Whether a band heading is set a step smaller so no word breaks (rule 9 of
 * the identity rollout). The display face is capitals, and at the heading's
 * phone size a word of eleven or more capitals ("COORDINATION") is wider than
 * a 320px screen's measure.
 */
export function headingIsLong(text: string | null | undefined): boolean {
  return measureHeadline(text).longest >= 11;
}
