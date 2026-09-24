// Safe to edit by hand
// The ground a text band (RichTextSection) is drawn on, DERIVED from where it
// sits on the page (2026-09-24, the Beliefs identity pass; rollout rules 1, 2
// and 11: "brand colours only", "bold, full-width colour bands alternating
// dark and light").
//
// No colour field (CLAUDE.md rule 9). The cadence (sectionCadence.ts) already
// alternates every content block between the page's paper ("background") and
// the soft-paper tint ("muted"). For a text band, the muted turn is now a
// brand band instead of the 16% tint:
//
//   background  ->  'paper'   the page itself; flips with the theme
//   muted       ->  a brand band, chosen so it never matches a neighbour:
//                   indigo first, then brown, then taupe; and not the colour
//                   the previous brand text band on the page took, so two
//                   brand text bands on one page read as two different bands.
//
// The neighbours are the rows directly above and below. Their colour family is
// read from their TYPE (the church bands paint their own ground by type, see
// SELF_CONTAINED_TYPES) or, for a staff band, from its group
// (staff-band.ts). Anything else is paper and constrains nothing.
//
// Every ink on each ground is a pair measured in both themes in
// theme-tokens.test.ts (IDENTITY_PAIRS, "the text bands").
import { staffBandLook } from './staff-band.ts';

export type RichGround = 'paper' | 'indigo' | 'brown' | 'taupe';
type Family = 'paper' | 'indigo' | 'brown' | 'taupe' | 'gold';

/** The brand grounds a text band may take, in order of preference. */
export const BRAND_GROUNDS: Exclude<RichGround, 'paper'>[] = ['indigo', 'brown', 'taupe'];

const BY_TYPE: Record<string, Family> = {
  heroSection: 'indigo',
  watchwordSection: 'indigo',
  scriptureBandSection: 'indigo',
  faqSection: 'indigo',
  goalsSection: 'indigo',
  documentListSection: 'indigo',
  sundayTimesSection: 'brown',
  heritageBandSection: 'brown',
  ctaBandSection: 'gold',
  giveBandSection: 'gold',
};

interface Row {
  block: { _type?: string; group?: unknown; [k: string]: unknown };
  surface: 'background' | 'muted' | null;
}

function familyOf(row: Row | undefined, grounds: (RichGround | null)[], i: number): Family {
  if (!row) return 'paper';
  const t = row.block?._type ?? '';
  if (t === 'richTextSection') return grounds[i] ?? (row.surface === 'muted' ? 'indigo' : 'paper');
  if (t === 'staffGridSection') {
    const g = staffBandLook(typeof row.block.group === 'string' ? row.block.group : null).ground;
    return g === 'paper' ? 'paper' : g;
  }
  // The closing band is gold, unless it carries a photograph: then it keeps
  // the indigo panel over its scrim (FinalCta.astro).
  if (t === 'ctaBandSection' && (row.block.backgroundImage as { asset?: unknown } | null)?.asset)
    return 'indigo';
  return BY_TYPE[t] ?? 'paper';
}

/**
 * One ground per row: a RichGround for every richTextSection, null for every
 * other row. Pure; SectionRenderer calls it once per page.
 */
export function richGrounds(rows: Row[]): (RichGround | null)[] {
  const grounds: (RichGround | null)[] = rows.map(() => null);
  let last: RichGround | null = null;
  rows.forEach((row, i) => {
    if (row.block?._type !== 'richTextSection') return;
    if (row.surface !== 'muted') {
      grounds[i] = 'paper';
      return;
    }
    const above = familyOf(rows[i - 1], grounds, i - 1);
    // The row below is not decided yet when it is a text band itself; a text
    // band below a brand one is always the cadence's paper turn, so it is paper.
    const below =
      rows[i + 1]?.block?._type === 'richTextSection'
        ? 'paper'
        : familyOf(rows[i + 1], grounds, i + 1);
    const free = BRAND_GROUNDS.filter((g) => g !== above && g !== below);
    const pick = free.find((g) => g !== last) ?? free[0] ?? 'taupe';
    grounds[i] = pick;
    last = pick;
  });
  return grounds;
}

/** True for a ground that is a brand band (no divider either side of it). */
export const isBrandGround = (g: RichGround | null | undefined): boolean => !!g && g !== 'paper';
