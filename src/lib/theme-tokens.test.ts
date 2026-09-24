// Theme-token contrast gate (added 2026-08-27 alongside src/lib/contrast.ts).
//
// WHY: `npm run apply-brand` rewrites the @theme palette in globals.css from
// brand/brand.config.json. Nothing else in the gate chain notices when a new
// project's palette pushes body text under 4.5:1 -- axe audits the resting DOM
// of a built page and has no rule for token pairs, and Lighthouse can sit at
// 100 while a heading is unreadable on its own surface. This test reads the
// real tokens out of globals.css and asserts the pairs the design system
// actually puts on screen, so a bad reskin fails `npm test` before anyone
// looks at a screenshot.
//
// SCOPE: the light brand `@theme` block only, and the reader now genuinely
// enforces that (2026-09-06). It used to be one unscoped `matchAll` for
// `--color-*: #hex` over the whole stylesheet, which keeps whichever
// declaration comes LAST wherever it appears. That was correct only because
// every hex `--color-*` happened to live in the one `@theme` block: a hex
// `--color-*` written into `.dark` would have been picked up, measured, and
// asserted as a LIGHT pair, on a green build. The extraction now comes from
// src/lib/css-tokens.ts, shared with surfaces.test.ts, and the scope premise
// is asserted below rather than assumed.
//
// Light-only remains deliberate, and is NOT a limitation of the reader. The
// shadcn :root/.dark overrides are a different question from the brand
// palette: some are authored in oklch with alpha and would need a colour-space
// conversion, and the pairs a section actually paints with them are already
// measured, in BOTH themes, by src/lib/surfaces.test.ts. This gate stays the
// palette gate. Dark-mode pairs beyond that stay covered by the visual pass
// and a dark axe sweep.
//
// LIGHT ONLY SINCE 2026-09-24. FBCM never renders its dark theme (CLAUDE.md
// rule 3, site.theme), so the dark-scope pairs this file used to measure (the
// two gold-ink pairs, the dark half of the identity and themed pairs, the dark
// nave scrim, and ".dark redeclares every identity token") tested a palette no
// visitor can reach, and came off with it. The `.dark` block in globals.css is
// DORMANT, not deleted; bringing dark mode back means restoring those pairs
// from git history (the commit that made the site light-only) along with it.
// The one dark-scope check kept below is the reader premise (".dark does not
// redeclare a palette token this gate asserts as light"), which guards this
// gate's own correctness rather than the dark palette.
//
// NOT asserted: --color-secondary and --color-border-soft against the paper
// surfaces. Those are hairline dividers and faint rules, not UI component
// boundaries, and they sit near 2:1 by design. Any token used for a FOCUS RING
// or a control edge must be added here with AA_NON_TEXT.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contrastRatio,
  hexToRgb,
  relativeLuminance,
  flatten,
  rgbToHex,
  AA_BODY_TEXT,
  AA_LARGE_TEXT,
} from './contrast.ts';
import { BRAND_SCOPE, DARK_SCOPE, LIGHT_SCOPE, scopeReader, tokensIn } from './css-tokens.ts';

const CSS = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'styles', 'globals.css');
const css = readFileSync(CSS, 'utf8');

/** The brand palette, and only the brand palette. */
const brand = tokensIn(css, BRAND_SCOPE);
const readBrand = scopeReader(brand);

/** Read a token, failing loudly rather than silently skipping a pair. */
function token(name: string): string {
  assert.ok(brand[`--${name}`], `globals.css @theme is missing --${name}`);
  return readBrand(`--${name}`);
}

// The pairs the design system actually renders: text tokens on surface tokens.
const TEXT_ON_SURFACE: Array<[string, string]> = [
  ['color-accent', 'color-bg'], // headings + body on paper
  ['color-accent', 'color-bg-soft'], // same on the alternating surface
  ['color-accent-dark', 'color-bg'],
  ['color-primary', 'color-bg'], // primary as body/link colour
  ['color-primary', 'color-bg-soft'],
  ['color-primary-dark', 'color-bg'], // the documented body anchor colour
  ['color-primary-dark', 'color-bg-soft'],
];

// Reversed-out text: pure white on the dark brand surfaces.
const WHITE_ON_DARK: string[] = ['color-primary-dark', 'color-accent', 'color-accent-dark'];

/** Every token name this file measures, as declared in the stylesheet. */
const ASSERTED = [
  ...new Set([...TEXT_ON_SURFACE.flat(), ...WHITE_ON_DARK, 'color-white-pure']),
].map((n) => `--${n}`);

test('contrast math matches the WCAG reference points', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  // Shorthand hex expands.
  assert.equal(contrastRatio('#fff', '#000'), 21);
  // Luminance is symmetric in the ratio, order must not matter.
  assert.equal(contrastRatio('#586577', '#fbfbfa'), contrastRatio('#fbfbfa', '#586577'));
  assert.throws(() => hexToRgb('not-a-colour'));
  assert.ok(relativeLuminance(hexToRgb('#ffffff')) > relativeLuminance(hexToRgb('#000000')));
});

test('flatten composites a translucent colour over its backdrop', () => {
  // White at 12% over near-black is what a dark-theme hairline really is.
  const composited = flatten(hexToRgb('#ffffff'), 0.12, hexToRgb('#000000'));
  assert.equal(rgbToHex(composited), '#1f1f1f');
  // Fully opaque returns the foreground untouched.
  assert.deepEqual(flatten(hexToRgb('#586577'), 1, hexToRgb('#ffffff')), hexToRgb('#586577'));
});

// ---------------------------------------------------------------------------
// The scope premise. These three do not measure a colour; they assert that the
// reader is looking at the block this gate claims to be looking at. Without
// them the gate can go green while measuring the wrong declaration, which is
// the failure mode it spent its first ten days in.
// ---------------------------------------------------------------------------

test('the brand @theme block is found and holds the palette', () => {
  assert.ok(
    Object.keys(brand).length >= 10,
    `only ${Object.keys(brand).length} tokens found in @theme; the block header may have moved`,
  );
  for (const name of ASSERTED) {
    assert.ok(brand[name], `@theme never declares ${name}`);
  }
});

test('.dark does not redeclare a palette token this gate asserts as light', () => {
  const dark = tokensIn(css, DARK_SCOPE);
  const clashes = ASSERTED.filter((name) => dark[name]);
  assert.deepEqual(
    clashes,
    [],
    `${clashes.join(', ')} is declared in BOTH @theme and .dark. This gate measures the ` +
      `light palette only, so a dark declaration of the same name is either a mistake or a ` +
      `pair that belongs in surfaces.test.ts, which measures both themes. Do not leave it ` +
      `for this file to pick up.`,
  );
});

test('the only later light-scope override of a palette token is the recorded one', () => {
  // `@theme inline` is declared after `@theme` and wins on the page. It
  // deliberately re-points --color-accent at the shadcn semantic --accent so
  // that bg-accent flips with the theme (the reasoning is in globals.css).
  // That means bare text-accent is NOT the palette ink, and this gate asserts
  // the PALETTE value on purpose. Any NEW override shows up here as a failure
  // rather than as a number nobody can explain.
  const light = tokensIn(css, LIGHT_SCOPE);
  const overridden = Object.fromEntries(
    ASSERTED.filter((name) => light[name] !== brand[name]).map((name) => [name, light[name]]),
  );
  assert.deepEqual(overridden, { '--color-accent': 'var(--accent)' });
});

// ---------------------------------------------------------------------------
// The pairs.
// ---------------------------------------------------------------------------

for (const [fg, bg] of TEXT_ON_SURFACE) {
  test(`--${fg} on --${bg} meets AA body text`, () => {
    const ratio = contrastRatio(token(fg), token(bg));
    assert.ok(
      ratio >= AA_BODY_TEXT,
      `--${fg} (${token(fg)}) on --${bg} (${token(bg)}) is ${ratio}:1, needs ${AA_BODY_TEXT}:1`,
    );
  });
}

for (const bg of WHITE_ON_DARK) {
  test(`--color-white-pure on --${bg} meets AA body text`, () => {
    const ratio = contrastRatio(token('color-white-pure'), token(bg));
    assert.ok(
      ratio >= AA_BODY_TEXT,
      `white on --${bg} (${token(bg)}) is ${ratio}:1, needs ${AA_BODY_TEXT}:1`,
    );
  });
}

// ---------------------------------------------------------------------------
// Gold. --color-gold (#D59B29) is a FILL and an on-dark ink, never a paper
// ink — see the comment beside its declaration in globals.css for the two
// pairings that FAIL (gold on paper, white on gold) and their ratios. It is
// deliberately NOT in TEXT_ON_SURFACE above and must never be added there:
// that list is the paper-ink contract, and gold cannot meet it.
//
// These are the two pairings the site actually paints gold in, so they get
// the same protection every other rendered pair gets above. Losing this test
// is exactly how the last darkening happened unnoticed: gold was moved into
// an ink role nothing here was watching.
// ---------------------------------------------------------------------------

const GOLD_PAIRS: Array<[string, string]> = [
  // Navy body text on the gold "★ Featured" badge fill (JournalCard.astro).
  ['color-primary', 'color-gold'],
  // The heading-accent word (src/lib/surfaces.ts HEADING_ACCENT.onDarkBand),
  // pinned to gold on the fixed ink band via `.bg-accent-dark` in globals.css
  // rather than on a paper-ink token.
  ['color-gold', 'color-accent-dark'],
];

for (const [fg, bg] of GOLD_PAIRS) {
  test(`--${fg} on --${bg} meets AA body text`, () => {
    const ratio = contrastRatio(token(fg), token(bg));
    assert.ok(
      ratio >= AA_BODY_TEXT,
      `--${fg} (${token(fg)}) on --${bg} (${token(bg)}) is ${ratio}:1, needs ${AA_BODY_TEXT}:1`,
    );
  });
}

// ---------------------------------------------------------------------------
// Plan 2a: the church's full palette. Roles measured 2026-09-19; the four
// forbidden pairs are asserted FAILING so nobody can ship them by accident.
// ---------------------------------------------------------------------------

// Every church pair is measured in the LIGHT palette, the only one the site
// renders (2026-09-24).
const CHURCH_PAIRS_AA: Array<[string, string, string]> = [
  ['color-indigo', 'color-cream', 'ink on paper'],
  ['color-brown', 'color-cream', 'brown ink on paper'],
  ['color-brown-mid', 'color-cream', 'eyebrows on paper'],
  ['color-gold', 'color-indigo-field', 'eyebrows on the dark band'],
  ['color-gold', 'color-brown', 'eyebrows on the heritage band'],
  ['color-taupe', 'color-indigo-field', 'muted text on the dark band'],
  ['color-taupe', 'color-brown', 'muted text on the heritage band'],
  // Two gold-button pairs, and the SECOND one is what actually renders.
  // --color-indigo flips to paper-white under .dark, so the header, the mobile
  // drawer and CtaLink's gold variant all write text-indigo-field on bg-gold,
  // which holds its value in both themes. The indigo pair stays on the list
  // because the light theme still resolves to it; the indigo-field pair is the
  // one with the thinner headroom (4.90 against 5.60), so it is the one that
  // would catch a palette nudge first.
  ['color-indigo', 'color-gold', 'primary button label (light theme resolution)'],
  ['color-indigo-field', 'color-gold', 'the gold button label, as shipped'],
  ['color-cream', 'color-brown', 'body on the heritage band'],
  // Art-direction pass, 2026-09-20. Paper turned warm (#f4efe6) and two new
  // roles arrived with it, so both get measured here rather than eyeballed.
  // --color-gold-ink is the only gold allowed to carry a label on paper; the
  // FORBIDDEN list below still holds --color-gold to its old failing pairs, so
  // the two cannot be confused.
  ['color-gold-ink', 'color-bg', 'gold as a label on paper'],
  ['color-gold-ink', 'color-bg-soft', 'gold label on the band'],
  ['color-accent', 'color-bg', 'ink on paper'],
  ['color-gold', 'color-indigo-deep', 'gold labels on the footer field'],
  ['color-taupe', 'color-indigo-deep', 'muted text on the footer field'],
];
const CHURCH_PAIRS_FORBIDDEN: Array<[string, string, string]> = [
  ['color-gold', 'color-cream', 'gold text on paper'],
  ['color-cream', 'color-gold', 'white on gold'],
  ['color-gold', 'color-brown-mid', 'gold on mid brown'],
  ['color-taupe', 'color-cream', 'taupe text on paper'],
];

test('every church pair that ships clears AA body text', (t) => {
  for (const [fg, bg, why] of CHURCH_PAIRS_AA) {
    const r = contrastRatio(token(fg), token(bg));
    // Printed as well as asserted: a gate that only says "pass" cannot tell you
    // a pair has drifted from 5.6 to 4.6 and is one nudge from failing.
    t.diagnostic(`${why}: --${fg} on --${bg} is ${r.toFixed(2)}:1`);
    assert.ok(r >= AA_BODY_TEXT, `${why}: --${fg} on --${bg} is ${r.toFixed(2)}:1`);
  }
});

test('the four forbidden church pairs really do fail, so the list stays honest', () => {
  for (const [fg, bg, why] of CHURCH_PAIRS_FORBIDDEN) {
    const r = contrastRatio(token(fg), token(bg));
    assert.ok(
      r < AA_BODY_TEXT,
      `${why} unexpectedly passes at ${r.toFixed(2)}:1; update the roles`,
    );
  }
});

test('the taupe tint surface keeps indigo ink readable', () => {
  // bg-soft is now a 16% taupe tint over cream. flatten()'s real signature
  // (see src/lib/contrast.ts) is flatten(fg: Rgb, alpha: number, bg: Rgb): Rgb
  // -- foreground first, then alpha, then backdrop, all as Rgb objects, not
  // hex strings -- so token()'s hex output has to go through hexToRgb() on
  // the way in and rgbToHex() on the way out.
  const tint = flatten(hexToRgb(token('color-taupe')), 0.16, hexToRgb(token('color-cream')));
  const r = contrastRatio(token('color-indigo'), rgbToHex(tint));
  assert.ok(r >= AA_BODY_TEXT, `indigo on taupe tint is ${r.toFixed(2)}:1`);
});

// ---------------------------------------------------------------------------
// Church identity (2026-09-23, the Who We Are pass; brand palette only since
// the owner's review the same day). The band grounds and the inks set on them.
// Every pair is measured in the light palette (the dark resolution came off on
// 2026-09-24 with dark mode). Floor is AA body text unless the pair is only ever set at 24px and
// up, where WCAG's large-text 3:1 applies.
//
// Three dark grounds (indigo, deep, brown) carry white with a brand gold
// accent; two light grounds (gold, taupe) carry --color-band-ink.
// ---------------------------------------------------------------------------

type Floor = 'body' | 'large';
const IDENTITY_PAIRS: Array<[string, string, string, Floor]> = [
  // The window hero, the Worship goal and the link-card doors.
  ['color-white-pure', 'color-band-indigo', 'white on the indigo band', 'body'],
  [
    'color-gold',
    'color-band-indigo',
    'gold accent, hero label and link-card eyebrow on the indigo band',
    'body',
  ],
  // The Watchword band, and the rule button's hover fill.
  ['color-white-pure', 'color-band-deep', 'the mark "Praise"; the rule button, hovered', 'body'],
  ['color-bg', 'color-band-deep', 'body text on the Watchword band', 'body'],
  ['color-gold', 'color-band-deep', 'heading, highlighted words, PROCLAIM, the link', 'body'],
  // The Way, and the onDark rule button at rest and hovered.
  ['color-band-ink', 'color-band-gold', 'ink on The Way band; the onDark rule button', 'body'],
  ['color-band-ink', 'color-gold-hover', 'the onDark rule button label, hovered', 'body'],
  // Witness: white, and gold for every accent including the 15px ring scope.
  ['color-white-pure', 'color-band-brown', 'white on the Witness band', 'body'],
  ['color-gold', 'color-band-brown', 'gold accent on the Witness band', 'body'],
  // The hymn board (SundayTimes, 2026-09-23, the Home pass): the intro, the
  // row titles, the notes and the address in paper; each row's small line in
  // taupe; the heading, the numerals and the glyphs in gold (the pair above).
  ['color-bg', 'color-band-brown', 'reading text on the hymn-board band', 'body'],
  ['color-band-taupe', 'color-band-brown', "each hymn-board row's small line", 'body'],
  // Work.
  ['color-band-ink', 'color-band-taupe', 'ink on the Work band', 'body'],
  // The text bands (2026-09-24, the Beliefs identity pass, rich-ground.ts):
  // indigo and brown carry paper for reading, gold for the head and every
  // accent, taupe for the quiet foot; taupe carries band-ink, band-indigo and
  // band-brown. The pairs not repeated here are gated above.
  ['color-bg', 'color-band-indigo', 'text band on indigo: reading text', 'body'],
  ['color-band-taupe', 'color-band-indigo', 'text band on indigo: the foot line', 'body'],
  // Our Building (HeritageBand with dates, 2026-09-23, the Home pass): a FIXED
  // cream band in both themes (--color-bg never flips), so its inks are the
  // band tokens and brown-mid, none of which may flip to a light value.
  ['color-band-indigo', 'color-bg', 'Our Building: heading, lead, the years and each date', 'body'],
  ['color-band-brown', 'color-bg', 'Our Building: the text beside each date', 'body'],
  ['color-brown-mid', 'color-bg', 'Our Building: the eyebrow and the ampersand', 'body'],
  // Church Blog (DynamicList, journal source, 2026-09-23, the Home pass): a
  // FIXED taupe band in both themes. Titles and authors in band-ink (the Work
  // pair above); the heading in indigo; the date, excerpt, subhead and
  // category in brown. The "All posts" gold plate keeps its own gated label.
  ['color-band-indigo', 'color-band-taupe', 'Church Blog: the heading', 'body'],
  [
    'color-band-brown',
    'color-band-taupe',
    'Church Blog: the date, excerpt, subhead and category',
    'body',
  ],
  // Give (GiveBand, the gold band): the heading and glyph in indigo; the
  // paragraph and the onGold outline button in band-ink (The Way pair above).
  ['color-band-indigo', 'color-band-gold', 'Give: the heading on the gold band', 'body'],
  // The document list (DocumentList, 2026-09-24, the Wedding pass; restyled
  // from door cards to a ruled list the same day) on the indigo band: titles
  // in paper, notes in taupe, in both its forms (the ruled rows and the
  // register); the years and the heading are the gold pair above.
  ['color-bg', 'color-band-indigo', 'the document list: each title', 'body'],
  ['color-band-taupe', 'color-band-indigo', 'the document list: each note', 'body'],
];

// Inks that would FLIP with the theme, measured on the light ground they are
// painted on. (Their dark grounds came off with dark mode, 2026-09-24.)
// [ink, light ground, why]
const THEMED_IDENTITY_PAIRS: Array<[string, string, string]> = [
  ['color-indigo', 'color-bg-soft', 'the pledge heading, rubric and turns'],
  ['color-gold-ink', 'color-bg-soft', 'the pledge references'],
  ['color-brown-ink', 'color-bg', 'the letter heading, first paragraph and signature'],
  ['color-gold-ink', 'color-bg', "the letter's drop cap"],
  // The goals heading and index (Task 5): each goal's name in its own ink.
  ['color-indigo', 'color-bg', 'the goals heading, Worship in the index'],
  ['color-brown-ink', 'color-bg', 'Witness and Work in the goals index'],
];

const IDENTITY_TOKENS = [
  'color-band-indigo',
  'color-band-deep',
  'color-band-gold',
  'color-band-brown',
  'color-band-taupe',
  'color-band-ink',
  'color-gold-hover',
  'color-brown-ink',
];

// The nave caption (GoalsBand, .gn-cap) sets the Worship name and subtitle on
// an 80% indigo-dark scrim over a photograph an editor picks. The worst case
// is a PURE WHITE photograph, so the scrim is composited over #fff and the two
// inks measured on the result: white as body text, brand gold as large text
// (the gold lines are 28px and up). The percentage is the one in globals.css.
const NAVE_SCRIM_ALPHA = 0.8;

test('the nave scrim reads over a pure white photograph', (t) => {
  const pct = css.match(/--gn-scrim: color-mix\(in srgb, var\(--color-band-deep\) (\d+)%/);
  assert.ok(pct, 'globals.css .gn-cap no longer mixes --color-band-deep into --gn-scrim');
  assert.equal(Number(pct[1]) / 100, NAVE_SCRIM_ALPHA, 'the scrim percentage moved; re-measure');
  const ground = rgbToHex(
    flatten(hexToRgb(token('color-band-deep')), NAVE_SCRIM_ALPHA, hexToRgb('#ffffff')),
  );
  const white = contrastRatio('#ffffff', ground);
  const gold = contrastRatio(token('color-gold'), ground);
  t.diagnostic(`scrim ${ground}, white ${white.toFixed(2)}:1, gold ${gold.toFixed(2)}:1`);
  assert.ok(white >= AA_BODY_TEXT, `white on the nave scrim is ${white.toFixed(2)}:1`);
  assert.ok(gold >= AA_LARGE_TEXT, `gold on the nave scrim is ${gold.toFixed(2)}:1`);
});

test('every church identity token is declared in @theme', () => {
  const missingLight = IDENTITY_TOKENS.filter((n) => !brand[`--${n}`]);
  assert.deepEqual(missingLight, [], `@theme is missing ${missingLight.join(', ')}`);
});

test('every themed church ink clears AA on the ground it is painted on', (t) => {
  for (const [fg, bg, why] of THEMED_IDENTITY_PAIRS) {
    const r = contrastRatio(token(fg), token(bg));
    t.diagnostic(`${why}: --${fg} on --${bg} is ${r.toFixed(2)}:1`);
    assert.ok(r >= AA_BODY_TEXT, `${why}: --${fg} on --${bg} is ${r.toFixed(2)}:1`);
  }
});

test('every church identity pair clears its floor', (t) => {
  for (const [fg, bg, why, floor] of IDENTITY_PAIRS) {
    const min = floor === 'large' ? AA_LARGE_TEXT : AA_BODY_TEXT;
    const r = contrastRatio(token(fg), token(bg));
    t.diagnostic(`${why}: --${fg} on --${bg} is ${r.toFixed(2)}:1 (floor ${min})`);
    assert.ok(r >= min, `${why}: --${fg} on --${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
  }
});
