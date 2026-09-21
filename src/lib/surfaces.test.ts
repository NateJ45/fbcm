import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AA_BODY_TEXT,
  AA_LARGE_TEXT,
  contrastRatio,
  hexToRgb,
  relativeLuminance,
} from './contrast.ts';
import {
  DARK_SCOPE,
  LIGHT_SCOPE,
  normalizeHex as norm,
  scopeReader,
  tokensIn,
} from './css-tokens.ts';
import { HEADING_ACCENT, SECTION_SURFACES, surfaceClass } from './surfaces.ts';
import { CONTENT_TYPES } from './sectionCadence.ts';

// =============================================================================
// The contrast gate for the section surfaces (PORTS.md card 26, 2026-08-28)
// =============================================================================
// Every surface this template paints is a PAIR: a background plus the
// foreground treatment designed for it. This walks every pair in
// src/lib/surfaces.ts, resolves its tokens against the REAL declarations in
// src/styles/globals.css, and measures. Body text, headings and links must
// clear AA 4.5:1; the accent word inside a heading is display-size text and
// must clear 3:1.
//
// WHY THIS EXISTS ALONGSIDE theme-tokens.test.ts. That gate reads the light
// `@theme` block only, and says so: the shadcn :root / .dark overrides were out
// of scope because some are authored in oklch. But the surfaces the site
// actually paints a <section> with are exactly those overrides, and they are
// plain hex. This resolves them, in BOTH themes, as the pairs a reader sees.
// The two gates overlap on nothing.
//
// It also pins the literal hexes in surfaces.ts to the resolved token values,
// so `npm run apply-brand` cannot swap the palette and leave this file
// describing colours the site no longer uses.
//
// If a candidate pair fails here, fix the PAIR. Do not lower a threshold.
// =============================================================================

const css = readFileSync(new URL('../styles/globals.css', import.meta.url), 'utf8');

// `@theme`, `@theme inline` and `:root` are all the light scope, `.dark` is the
// dark scope, and a dark block overrides only some tokens so the rest fall back
// to light. The brace-counted, alias-following reader that resolves them lives
// in src/lib/css-tokens.ts, shared with theme-tokens.test.ts: it used to exist
// twice, in two different qualities, and the weaker copy was silently reading
// the wrong declaration. See that file's header.
const light = tokensIn(css, LIGHT_SCOPE);
const dark = tokensIn(css, DARK_SCOPE);

const themes = [
  ['light', scopeReader(light)],
  ['dark', scopeReader(dark, light)],
] as const;

describe('surface pairs resolve', () => {
  it('every surface names tokens that exist in globals.css', () => {
    for (const s of SECTION_SURFACES) {
      for (const [role, token] of Object.entries(s.tokens)) {
        assert.ok(
          light[token],
          `${s.value}.${role} names ${token}, which @theme/:root never declares`,
        );
      }
    }
  });

  it('the literal hexes still match the tokens they stand for', () => {
    for (const s of SECTION_SURFACES) {
      assert.equal(
        norm(s.dot),
        norm(themes[0][1](s.tokens.bg)),
        `surface "${s.value}" dot is stale against ${s.tokens.bg} (light)`,
      );
      assert.equal(
        norm(s.dotDark),
        norm(themes[1][1](s.tokens.bg)),
        `surface "${s.value}" dotDark is stale against ${s.tokens.bg} (dark)`,
      );
      assert.equal(
        norm(s.dotInk),
        norm(themes[0][1](s.tokens.text)),
        `surface "${s.value}" dotInk is stale against ${s.tokens.text} (light)`,
      );
    }
  });

  it('a theme-static band really is the same colour in both themes', () => {
    for (const s of SECTION_SURFACES.filter((x) => x.themeStatic)) {
      assert.equal(
        norm(themes[0][1](s.tokens.bg)),
        norm(themes[1][1](s.tokens.bg)),
        `surface "${s.value}" claims themeStatic but ${s.tokens.bg} flips with the theme`,
      );
    }
  });

  it('the two surfaces the cadence assigns are exactly the two it can assign', () => {
    // sectionCadence.ts hands every CONTENT block one of 'background' | 'muted'.
    // If that vocabulary ever grows, this registry has to grow with it or a
    // section will render a surface nothing has measured.
    assert.ok(CONTENT_TYPES.size > 0, 'the cadence has no content types at all');
    assert.deepEqual(
      SECTION_SURFACES.filter((s) => s.inCadence).map((s) => s.value),
      ['background', 'muted'],
    );
  });

  it('an unknown surface name falls back to Paper', () => {
    assert.equal(surfaceClass(undefined), 'bg-background');
    assert.equal(surfaceClass(null), 'bg-background');
    assert.equal(surfaceClass('not-a-surface'), 'bg-background');
    assert.equal(surfaceClass('muted'), 'bg-surface-soft');
  });
});

describe('surface pairs clear WCAG AA', () => {
  for (const s of SECTION_SURFACES) {
    for (const [theme, v] of themes) {
      const bg = () => v(s.tokens.bg);

      it(`"${s.value}" body text clears AA in ${theme}`, () => {
        const ratio = contrastRatio(v(s.tokens.text), bg());
        assert.ok(ratio >= AA_BODY_TEXT, `${s.tokens.text} on ${s.tokens.bg} is ${ratio}:1`);
      });

      it(`"${s.value}" headings clear AA in ${theme}`, () => {
        const ratio = contrastRatio(v(s.tokens.heading), bg());
        assert.ok(ratio >= AA_BODY_TEXT, `${s.tokens.heading} on ${s.tokens.bg} is ${ratio}:1`);
      });

      it(`"${s.value}" links clear AA in ${theme}`, () => {
        const ratio = contrastRatio(v(s.tokens.link), bg());
        assert.ok(ratio >= AA_BODY_TEXT, `${s.tokens.link} on ${s.tokens.bg} is ${ratio}:1`);
      });
    }
  }
});

describe('the soft alternating surface reads in both themes (Task 1, fix round 1)', () => {
  // The "muted" surface's background is now --color-surface-soft (globals.css
  // :root/.dark, via the --surface-soft semantic token), light value the 16%
  // taupe-over-cream tint (--color-bg-soft, #F0EEEC), dark value #262548. The
  // generic loop above already proves --foreground/--link clear AA on it in
  // both themes; this adds the two pairs the fix-round review named directly:
  // indigo ink on the light soft surface, and its dark equivalent.
  //
  // The dark pair reads --color-indigo, not --color-cream. --color-indigo and
  // --color-cream swap LITERAL values between themes (see the "Dark mode:
  // indigo becomes paper, cream becomes ink" comment in globals.css) so that
  // whichever token plays the INK role keeps playing it: --color-indigo is
  // the ink role (navy in light, #f1ece3 warm off-white in dark), so it is
  // the token to read for ink in either theme. Reading --color-cream in the
  // DARK scope instead would return its dark override, #14121b -- the dark
  // page colour, which is the PAPER role's dark value, not an ink colour, and
  // pairs at 1.27:1 against #262548. That is not a typo to fix; it is why this
  // reads --color-indigo for both rows instead.
  it('indigo ink on the light soft surface clears AA', () => {
    const ratio = contrastRatio(
      themes[0][1]('--color-indigo'),
      themes[0][1]('--color-surface-soft'),
    );
    assert.ok(
      ratio >= AA_BODY_TEXT,
      `--color-indigo on --color-surface-soft (light) is ${ratio}:1`,
    );
  });

  it('indigo ink (near-white in dark, the "cream" paper colour) on the dark soft surface clears AA', () => {
    const ratio = contrastRatio(
      themes[1][1]('--color-indigo'),
      themes[1][1]('--color-surface-soft'),
    );
    assert.ok(ratio >= AA_BODY_TEXT, `--color-indigo on --color-surface-soft (dark) is ${ratio}:1`);
  });

  it('the dark soft surface is genuinely darker than the light one, not a near-white leftover', () => {
    // The regression this whole fix round exists to close: before this,
    // nothing in .dark repointed the muted band, so a reader in dark mode
    // still got the light-mode taupe tint - near-white on a dark page.
    const lightLum = relativeLuminance(hexToRgb(themes[0][1]('--color-surface-soft')));
    const darkLum = relativeLuminance(hexToRgb(themes[1][1]('--color-surface-soft')));
    assert.ok(
      darkLum < lightLum / 4,
      `dark soft surface (${themes[1][1]('--color-surface-soft')}) is not meaningfully darker ` +
        `than the light one (${themes[0][1]('--color-surface-soft')})`,
    );
  });
});

describe('the heading accent word', () => {
  it('its literals still match the token it reads', () => {
    assert.equal(norm(HEADING_ACCENT.light), norm(themes[0][1](HEADING_ACCENT.token)));
    assert.equal(norm(HEADING_ACCENT.dark), norm(themes[1][1](HEADING_ACCENT.token)));
  });

  // Display-size text, SC 1.4.3 large, 3:1. Measured on every surface it can
  // land on, which is every surface a section paints.
  for (const s of SECTION_SURFACES) {
    if (s.themeStatic) {
      it(`reads on the fixed "${s.value}" band`, () => {
        const ratio = contrastRatio(HEADING_ACCENT.onDarkBand, themes[0][1](s.tokens.bg));
        assert.ok(
          ratio >= AA_LARGE_TEXT,
          `${HEADING_ACCENT.onDarkBand} on ${s.tokens.bg} is ${ratio}:1`,
        );
      });
      continue;
    }
    for (const [theme, v] of themes) {
      it(`reads on "${s.value}" in ${theme}`, () => {
        const ratio = contrastRatio(v(HEADING_ACCENT.token), v(s.tokens.bg));
        assert.ok(
          ratio >= AA_LARGE_TEXT,
          `${HEADING_ACCENT.token} on ${s.tokens.bg} is ${ratio}:1`,
        );
      });
    }
  }

  it('globals.css really pins the accent on the ink band', () => {
    // The rule is what makes the measurement above true on the live page. A
    // silent delete would leave the theme-aware token flipping with the
    // READER's page theme instead of with the band it is sitting on.
    // Case-insensitive: prettier's CSS pass lowercases hex literals, and the
    // colour is the assertion here, not its spelling.
    assert.match(css, /\.bg-accent-dark\s*\{[^}]*--section-accent:\s*var\(--color-gold\)/i);
    assert.match(css, /\.heading-accent\s*\{[^}]*var\(--section-accent,\s*var\(--primary\)\)/);
  });
});
