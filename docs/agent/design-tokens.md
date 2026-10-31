# Typography and spacing

> Font families, typographic micro-rules, fluid spacing tokens, and the Tailwind v4 collision trap.

## Typography

- Headings (h1 through h6): **Libre Baskerville**. Self-hosted via `@fontsource/libre-baskerville`. Editorial serif that reads as premium without narrowing the brand voice to any specific style.
- Body, UI, buttons: **Inter** (variable). Self-hosted via `@fontsource-variable/inter`. Single file covers all weights.
- Script accent (opt-in): no script font is loaded by default. The `@utility font-script` declaration and `--font-script` token exist in `globals.css`, but the font file is only fetched when you add a `@fontsource` import for a script typeface and point `--font-script` at it. See `animation.md` for the full opt-in steps and usage discipline.
- Labels, eyebrows, monospace numerals: `ui-monospace, 'SF Mono', monospace` (system, no file).

Font families are declared in the `@theme` block in `src/styles/globals.css` as `--font-display`, `--font-body`, `--font-mono`, which Tailwind exposes automatically as `font-display`, `font-body`, `font-mono` utility classes.

### Typographic micro-rules

Two utility classes layered on top of the families. Use them instead of ad-hoc arbitrary values so the system stays consistent across components.

- `tracking-eyebrow` (`0.18em`) -- applied to every uppercase eyebrow label above a heading. Token: `--tracking-eyebrow`.
- `leading-headline-tight` (`1.05`) -- applied to hero-scale H1s. Combined with `tracking-[-0.02em]` it gives Libre Baskerville editorial display proportions at the 40px to 80px hero range. Token: `--leading-headline-tight`.

Both are declared in `src/styles/globals.css` via `@utility`. Don't replace with arbitrary values (`leading-[1.05]`, `tracking-[0.18em]`) in new code; use the named utilities so a future scale change is one edit.

---

## Spacing tokens

Fluid spacing is declared in the `@theme` block in `src/styles/globals.css`:

| Token                  | Value                           | Notes                                                |
| ---------------------- | ------------------------------- | ---------------------------------------------------- |
| `--spacing-xs`         | `clamp(0.25rem, 0.5vw, 0.5rem)` | Tightest paddings, icon gaps                         |
| `--spacing-s`          | `clamp(0.5rem, 1vw, 1rem)`      | Small UI gaps                                        |
| `--spacing-m`          | `clamp(1rem, 2vw, 1.5rem)`      | Default content padding                              |
| `--spacing-l`          | `clamp(2rem, 4vw, 3rem)`        | Card padding, larger gaps                            |
| `--spacing-section-md` | `clamp(3rem, 6vw, 5rem)`        | Section-internal padding                             |
| `--spacing-section-lg` | `clamp(4rem, 8vw, 7rem)`        | Section block padding (top/bottom of major sections) |

Utility classes follow the standard Tailwind pattern: `p-l`, `py-section-lg`, `gap-m`, `mt-section-md`, `space-y-section-lg`, and so on.

### Tailwind v4 collision trap (don't recreate)

In Tailwind v4, `max-w-{key}` resolves to `--spacing-{key}` BEFORE `--container-{key}` when both exist for the same key. Naming a fluid spacing token `--spacing-xl` or `--spacing-2xl` would silently break `max-w-xl` / `max-w-2xl` sitewide (they would inherit the fluid clamp instead of the container width). The two largest section-padding tokens use the `--spacing-section-*` prefix specifically to avoid this collision.

**Rule for adding new spacing tokens:** the key must NOT match any Tailwind built-in container size: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl`. Use `--spacing-section-*` or another distinct prefix.

If you ever suspect this regressed, the diagnostic is: open the page in the dev server and inspect the compiled CSS for a `.max-w-2xl` rule. It MUST read `max-width: var(--container-2xl)`. If it reads `var(--spacing-2xl)`, a colliding token has been re-introduced somewhere in the cascade.

---

## Color tokens

See `theme-and-color.md` for the full palette reference, the `--tint-rgb` token, and the light/dark discipline. A short summary of what to use in component code:

- Body text and headings: `text-foreground`
- Page and card surfaces: `bg-background`, `bg-card`, `bg-muted`
- Brand action color: `bg-primary`, `text-primary-foreground`
- Tinted overlays (polish layer): `rgba(var(--tint-rgb), <opacity>)`
- Borders: `border-border`

Never hardcode hex values in component markup. All palette and semantic tokens are in `globals.css`; change the token, not every usage site.

## The one scale, fallback fonts, shape classes and layout slots (starter cards 186 to 198, 2026-10-27)

- **The one scale.** A `:root` block "The one scale" in `src/styles/globals.css` (after the palette's
  `:root` and `.dark`) names what the site already drew: `--fs-*` text sizes (read from this
  site's own `--text-*` tokens), `--lh-*`, `--radius-control/-card/-inner/-tag/-pill` (from
  `--radius`), `--pad-*` and `--gap-*` (the fluid `--spacing-*`), `--shadow-card` (none: this site
  draws no card shadow), `--shadow-raised`, `--btn-height` (44px), `--tracking-label`, the focus
  ring. Nothing reads them yet except the shape contract below; a new rule picks a token before a
  number. It moved no pixel. `apply-brand` rewrites the FIRST `:root`/`.dark`, so the block stays
  after them. Do not run `apply-brand` in this repo (PENDING 9, and it also resets `site:` in
  `astro.config.mjs` to the bare domain); edit `globals.css` and `brand.config.json` together by hand.
- **Fallback fonts.** `npm run font-fallback` (PORTABLE `scripts/font-fallback.mjs`) reads Castoro
  Titling's Latin `.woff` and writes `src/styles/font-fallbacks.css`: `Castoro Titling Fallback`
  (Georgia) and `Castoro Titling Fallback Times`, scaled to the face's width and given its ascent
  and descent. Both are named second and third in `--font-display` (`globals.css` `@theme` and
  `brand.config.json` `fonts.display.familyValue`), so a title drawn in the stand-in breaks where
  Castoro Titling will. The body face (Castoro) has none: the script writes one display font.
- **Shape contract.** `src/styles/shapes.css` (PORTABLE) is imported after the Sofia import in
  `globals.css`, outside the `@import` run `apply-brand` rebuilds. Class rules only
  (`.shape-step`, `.shape-gable`, `.shape-slab`, `.shape-card`, `.shape-tile`); nothing here
  uses them, and the church's own pictures keep `photo-shapes.css` (`.ph-*`).
- **Layout slots.** `src/lib/site-layout.ts` (PORTABLE) and `src/data/layout.ts`; `brand.config.json`
  `layout` is all defaults (`inline`, `bleed`, `standard`, `standard`, `reveal`), so `<html>` gets no
  `data-*` attribute. `BaseLayout.astro` spreads `layoutAttrs(layout)`. `hero: board` is NOT
  chosen and its components are not installed; `motion` is installed as a value only (the flow
  layer, card 192, is a separate piece of work).
- **Page weight.** `tests/page-weight.spec.ts` (PORTABLE) reads `tests/page-weight.config.json`:
  per-route HTML and inline CSS budgets, measured on the CI build (snapshot and fixtures) plus
  25 percent, shared image and font budgets, and the JSON-LD types each route must carry. Image
  budgets are defaults only (lazy images load by timing). A new route in `tests/routes.ts` needs an
  entry or it uses the defaults.

## Shapes in this church's grammar, and the photo hero's shade (starter cards 188, 189, 2026-10-27)

- **Shape tokens** (`globals.css`, after the one scale): a block that uses the starter's shape
  classes reads as this church. `.shape-gable` (a standalone picture) is cut to the sanctuary's
  lancet: `--shape-gable-polygon` traces `.arch-lancet`'s two circular arcs as a polygon (so it
  scales with the box), springing at `--gable-pitch: 40%`, square sides, `--shape-feature-radius: 0`.
  The slab is the soft paper (`--color-bg-soft`), the empty tile the indigo band the arches fill
  with, the hover zoom 1.04. The church's own pictures still use `ArchFrame.astro` and
  `photo-shapes.css`; nothing on a live page uses the shape classes today.
- **`hero: board` is not adopted.** The board grammar (one head, one ground, rules between sections)
  is Auburn's head grammar. This site already has its own heads (the full photo opener, the split
  and window indigo bands, `SectionHeading`) and its own band cadence, so board would replace the
  brand's openers with another church's. `src/data/layout.ts` keeps `hero: 'bleed'`.
- **The photo hero's shade** (`src/styles/photo-hero.css`, PORTABLE): `--photo-scrim` is
  `--color-accent-dark` (#1c1b3a, the navy dark of the Watchword band). `src/lib/photo-hero.test.ts`
  holds the contrast promise against `globals.css`: white over a pure white photo under the text
  strength (72%) stays at 4.5:1 or better.
