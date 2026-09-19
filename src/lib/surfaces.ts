// Safe to edit by hand
// =============================================================================
// Section surfaces: the designed background + ink pairs (PORTS.md card 26)
// =============================================================================
// ONE source of truth for what each of this template's section surfaces IS.
// Read by two places that must never drift:
//
//   1. the section components, which name a surface and get its classes,
//   2. src/lib/surfaces.test.ts - the CONTRAST GATE. It resolves every `tokens`
//      entry against the real declarations in src/styles/globals.css, measures
//      each pair in BOTH themes, and fails below WCAG AA.
//
// A surface is a PAIR, designed as one unit: a background plus the foreground
// treatment that belongs on it. `background` and `muted` are the two the
// alternating cadence assigns (src/lib/sectionCadence.ts); `card` is the raised
// surface the card grids paint; `ink` is the closing CTA band, which is the
// same near-black slab on a light or a dark page.
//
// WHAT THIS FILE DELIBERATELY IS NOT
// It is NOT an editor-facing control, and there is no `tone` field on any block
// schema. That is this template's oldest architecture rule (CLAUDE.md #9:
// "Blocks carry no surface/color field. The alternating-surface logic lives in
// src/lib/sectionCadence.ts. Do not add color fields to block schemas."), and
// it exists so that reordering a page can never break the page rhythm. The
// sibling site repos DO expose a surface swatch, because their sections carry a
// per-section `background` object and no cadence to protect. Here the cadence
// picks; this file only says what the cadence is picking BETWEEN, and holds the
// pairs to AA while it does. For the same reason there is no accent map here:
// an accent choice needs a shared section shell to hang a class on, and this
// template has none - every section paints its own <section>.
//
// A fork that runs `npm run apply-brand` swaps the palette in globals.css. The
// gate below is what tells it whether the swap broke a pair.
// =============================================================================

/** The surface names the components and the cadence already use. */
export type SurfaceValue = 'background' | 'muted' | 'card' | 'ink';

export interface SurfacePair {
  value: SurfaceValue;
  /** Plain-language name, for docs and failure messages. */
  title: string;
  /** One line on when this surface is the right one. */
  hint: string;
  /** The classes a section carrying this surface puts on its own element. */
  className: string;
  /** Light-theme background, as a literal. Pinned to the token by the gate. */
  dot: string;
  /** Dark-theme background, as a literal. Equal to `dot` on a fixed band. */
  dotDark: string;
  /** Literal ink that sits on this background in the light theme. */
  dotInk: string;
  /** The custom properties this surface resolves to, by role. */
  tokens: {
    bg: string;
    text: string;
    heading: string;
    link: string;
  };
  /** True when the band is the same colour in both themes. */
  themeStatic?: boolean;
  /** True when src/lib/sectionCadence.ts can assign this surface to a section. */
  inCadence?: boolean;
}

export const SECTION_SURFACES: SurfacePair[] = [
  {
    value: 'background',
    title: 'Paper',
    hint: 'The ordinary page surface. Every other surface is a step away from it.',
    className: 'bg-background',
    dot: '#FBFBFA',
    dotDark: '#17191C',
    dotInk: '#2A2D31',
    inCadence: true,
    tokens: { bg: '--background', text: '--foreground', heading: '--foreground', link: '--link' },
  },
  {
    value: 'muted',
    title: 'Soft paper',
    hint: 'The alternating band. The cadence puts it between two Paper sections.',
    // Repointed 2026-09-19 (Task 1, fix round 1) from bg-muted/--muted to the
    // --color-surface-soft semantic token. The old shadcn --muted pair was
    // already dark-aware on its own, but the church's rebrand gave the
    // alternating band a specific brand value in LIGHT mode (--color-bg-soft,
    // the 16% taupe-over-cream tint) with no dark counterpart. --surface-soft
    // (declared in globals.css :root / .dark, exposed here as --color-surface-
    // soft via @theme inline) carries that light value forward and gives it a
    // real dark value (#262548) without redeclaring --color-bg-soft itself,
    // which the palette gate in theme-tokens.test.ts forbids in .dark.
    className: 'bg-surface-soft',
    dot: '#F0EEEC',
    dotDark: '#262548',
    dotInk: '#2A2D31',
    inCadence: true,
    tokens: {
      bg: '--color-surface-soft',
      text: '--foreground',
      heading: '--foreground',
      link: '--link',
    },
  },
  {
    value: 'card',
    title: 'Card',
    hint: 'The raised surface inside a grid. Never a whole band on its own.',
    className: 'bg-card',
    dot: '#FFFFFF',
    dotDark: '#202327',
    dotInk: '#2A2D31',
    tokens: {
      bg: '--card',
      text: '--card-foreground',
      heading: '--card-foreground',
      link: '--link',
    },
  },
  {
    value: 'ink',
    title: 'Ink',
    hint: 'The closing CTA band. The same near-black on a light or a dark page.',
    className: 'bg-accent-dark text-bg',
    dot: '#1C1B3A',
    dotDark: '#1C1B3A',
    dotInk: '#FBFBFA',
    themeStatic: true,
    tokens: {
      bg: '--color-accent-dark',
      text: '--color-bg',
      heading: '--color-bg',
      link: '--color-bg',
    },
  },
];

export const SURFACE_BY_VALUE: Record<string, SurfacePair> = Object.fromEntries(
  SECTION_SURFACES.map((s) => [s.value, s]),
);

/**
 * The class list for one surface name.
 *
 * Unknown or unset resolves to `background`, which is what a section with no
 * cadence assignment already renders.
 */
export function surfaceClass(value?: string | null): string {
  return (SURFACE_BY_VALUE[String(value ?? '')] ?? SURFACE_BY_VALUE.background).className;
}

/**
 * The accent colour for one word inside a heading (the colour sibling of the
 * script accent in src/lib/scriptAccent.ts).
 *
 * There is deliberately no CHOICE here: the editor picks a word, never a
 * colour, so this is one token and one pinned literal for the fixed dark band.
 * `.heading-accent` in globals.css is the other half; the gate measures both.
 */
export const HEADING_ACCENT = {
  /** Theme-aware token the accent word reads on the theme-following surfaces. */
  token: '--primary',
  /** Literal light/dark values of `token`, asserted against globals.css. */
  light: '#586577',
  dark: '#8A96A6',
  /** Pinned colour on the fixed ink band, where a theme-aware token would flip.
   *  FBCM: the church's own live-site gold (#D59B29) clears AA body text
   *  (6.75:1, since --color-accent-dark is real navy again as of 2026-09-18)
   *  against the ink band, even though it still fails AA body-text against
   *  paper. It lives here — and as --color-gold in globals.css — rather than
   *  as the --color-accent token itself, because --color-accent is an ink-on-
   *  PAPER role and this pairing only works on the dark band. See the
   *  --color-gold comment in globals.css and src/lib/theme-tokens.test.ts. */
  onDarkBand: '#D59B29',
} as const;
