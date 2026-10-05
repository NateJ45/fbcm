// Safe to edit by hand
// Which small line glyph sits beside each subheading of /beliefs' "Our Basic
// Beliefs" band (2026-10-05, the church's request: icons to break the section
// up). The glyph is DERIVED from the heading text, so there is no schema field
// and no dataset write: the editor keeps typing headings, and a heading this
// file does not know simply gets no icon (never an error).
//
// Stega: in the preview every string carries an invisible run, so both the band
// heading and the subheading are read through splitStega().cleaned before any
// comparison (CLAUDE.md preview rules). Apostrophes are normalised because the
// stored heading uses a curly one ("Lord's Supper") and an editor may retype a
// straight one.
import { splitStega } from './preview-stega.ts';

/** The drawings in src/components/church/BeliefGlyph.astro. */
export type BeliefGlyphName = 'trinity' | 'creation' | 'cross' | 'flame' | 'sunrise' | 'cup';

/** A heading reduced to its comparable form: stega-clean, straight quotes, lower case, single spaces. */
export function normaliseHeading(raw: string | null | undefined): string {
  return splitStega(String(raw ?? ''))
    .cleaned.replace(/[‘’‛′ʼ`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** The one band that carries glyphs. Matched on its heading, since it has no anchor. */
const BAND = 'our basic beliefs';

const BY_HEADING: Record<string, BeliefGlyphName> = {
  god: 'trinity',
  'creation and humanity': 'creation',
  'jesus christ': 'cross',
  'the holy spirit': 'flame',
  salvation: 'sunrise',
  "baptism and the lord's supper": 'cup',
};

/** Is this richTextSection the Basic Beliefs band? */
export const isBasicBeliefsBand = (bandHeading: string | null | undefined): boolean =>
  normaliseHeading(bandHeading) === BAND;

/** The glyph for one subheading, or null when it is not one of the six. */
export function beliefGlyphFor(subheading: string | null | undefined): BeliefGlyphName | null {
  return BY_HEADING[normaliseHeading(subheading)] ?? null;
}
