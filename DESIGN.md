---
name: First Baptist Church Muncie
description: Paper-and-ink church site in the church's five logo colours, with the building drawn into the type, frames and glyphs.
colors:
  paper: '#F4EFE6'
  paper-soft: '#EBE4D8'
  hairline-soft: '#DCD5C9'
  ink: '#17151F'
  ink-muted: '#514C58'
  indigo: '#292854'
  indigo-field: '#353351'
  indigo-dark: '#1C1B3A'
  indigo-deep: '#1B1A3A'
  gold: '#D59B29'
  gold-hover: '#DCAE4A'
  gold-ink: '#805709'
  brown: '#39251E'
  brown-mid: '#724F43'
  taupe: '#B5ABA3'
  white-pure: '#FFFFFF'
typography:
  display:
    fontFamily: 'Castoro Titling, Georgia, serif'
    fontSize: 'clamp(2.9rem, 1rem + 8.4vw, 8rem)'
    lineHeight: 0.95
    letterSpacing: '0.01em'
  h1:
    fontFamily: 'Castoro Titling, Georgia, serif'
    fontSize: 'clamp(2.35rem, 1rem + 5.4vw, 6rem)'
    lineHeight: 1.05
    letterSpacing: '0.01em'
  h2:
    fontFamily: 'Castoro, Georgia, serif'
    fontSize: 'clamp(2rem, 1.2rem + 2.6vw, 3.25rem)'
    fontWeight: 400
  lede:
    fontFamily: 'Castoro, Georgia, serif'
    fontSize: 'clamp(1.25rem, 1rem + 1vw, 1.75rem)'
  body:
    fontFamily: 'Castoro, Georgia, serif'
    fontSize: '1.0625rem'
    lineHeight: 1.7
  label:
    fontFamily: 'Sofia Sans Semi Condensed Variable, system-ui, sans-serif'
    fontSize: '0.8125rem'
    letterSpacing: '0.14em'
  text-10:
    fontSize: '0.625rem'
  text-11:
    fontSize: '0.6875rem'
  text-12:
    fontSize: '0.75rem'
  text-14:
    fontSize: '0.875rem'
  text-15:
    fontSize: '0.9375rem'
  text-16:
    fontSize: '1rem'
  text-18:
    fontSize: '1.125rem'
  text-19:
    fontSize: '1.1875rem'
  text-20:
    fontSize: '1.25rem'
  text-21:
    fontSize: '1.3125rem'
  text-22:
    fontSize: '1.375rem'
  text-23:
    fontSize: '1.4375rem'
  text-24:
    fontSize: '1.5rem'
  text-25:
    fontSize: '1.5625rem'
  text-26:
    fontSize: '1.625rem'
  text-27:
    fontSize: '1.6875rem'
  text-28:
    fontSize: '1.75rem'
  display-30:
    fontSize: '1.875rem'
  display-32:
    fontSize: '2rem'
  display-34:
    fontSize: '2.125rem'
  display-35:
    fontSize: '2.1875rem'
  display-36:
    fontSize: '2.25rem'
  display-40:
    fontSize: '2.5rem'
  display-42:
    fontSize: '2.625rem'
  display-44:
    fontSize: '2.75rem'
  display-46:
    fontSize: '2.875rem'
  display-48:
    fontSize: '3rem'
  display-50:
    fontSize: '3.125rem'
  display-54:
    fontSize: '3.375rem'
  display-58:
    fontSize: '3.625rem'
  display-66:
    fontSize: '4.125rem'
  display-70:
    fontSize: '4.375rem'
  display-72:
    fontSize: '4.5rem'
  display-92:
    fontSize: '5.75rem'
rounded:
  sm: '2px'
  keyline: '1px'
  full: '9999px'
  phone-notch: '3px'
  phone-screen: '20px'
  phone-body: '26px'
spacing:
  gutter: 'clamp(20px, 5vw, 72px)'
  section-md: 'clamp(3rem, 6vw, 5rem)'
  section-lg: 'clamp(4rem, 8vw, 7rem)'
components:
  button-gold:
    backgroundColor: '{colors.gold}'
    textColor: '{colors.indigo-field}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: '1.05em 1.6em'
    height: '44px'
  button-gold-hover:
    backgroundColor: '{colors.gold-hover}'
  band-indigo:
    backgroundColor: '{colors.indigo-deep}'
    textColor: '{colors.paper}'
---

# Design System: First Baptist Church Muncie

Tokens are declared in `src/styles/globals.css` and mirrored in `brand/brand.config.json`; the CSS wins if this file and the code disagree. Strategy is in `PRODUCT.md`. The binding specs are `docs/superpowers/specs/2026-09-20-fbcm-art-direction-design.md` and `docs/agent/theme-and-color.md`.

## 1. Overview

**Creative North Star: the building, set on paper.** Chrome is warm paper and near-black ink. The church's five logo colours (indigo, gold, taupe, brown, brown-mid) are accents and fixed dark bands, not the page. The identity comes from the church's own architecture: the lancet window and the low Adams Street door become photo frames, four line glyphs drawn from the building mark the goals, and the 1927 Hannaford rendering inks in at the footer. Type is a capitals-only titling face over a reading serif, with a condensed sans for furniture.

- **Light only** since 2026-09-24. `.dark` token blocks remain in the CSS but are dormant (site setting `theme: 'light'`, no toggle). Do not design or test a dark theme.
- **Flat.** No decorative shadows or gradients on chrome. Depth comes from paper versus soft-paper bands, hairlines and photography. The only shadow-like effects are a pulse ring on the live dot and a focus ring.
- **One grammar per page** (CLAUDE.md rule 17): one left edge (the gutter), one text-and-picture split, one button family.
- Reference sites and anti-references live in `PRODUCT.md` (proposed answers, unconfirmed until Nathan edits them); this file records only what the code does.

## 2. Colors

Roles, measured in `src/lib/theme-tokens.test.ts` (every pair asserted, forbidden pairs included):

- **Ground.** Paper `#F4EFE6` (page), Soft Paper `#EBE4D8` (alternating band, a 16% taupe tint over paper), faint divider `#DCD5C9`. Sections alternate paper and soft paper automatically through `src/lib/sectionCadence.ts`; blocks carry no colour field (rule 9).
- **Ink.** `#17151F` for headings and body (15.76:1 on paper), muted `#514C58` for secondary text (7.26:1). Links are ink with a gold underline, not a hue.
- **Indigo** `#292854` (primary, headings accent, outline buttons), `#353351` field, `#1C1B3A` dark, `#1B1A3A` footer ground. Fixed dark bands: footer, watchword, mobile menu, pastors band. They use `--color-band-*` tokens so they do not flip in a theme change.
- **Gold** `#D59B29`. A fill and an on-dark ink only. Gold on paper is 2.14 to 2.37:1 and is a FORBIDDEN text pair; white on gold fails too. Gold fills carry an indigo-field label (4.90:1). On paper, small gold-toned labels use **gold-ink** `#805709` (5.58:1 on paper, 5.06:1 on soft paper).
- **Brown** `#39251E` for the heritage band surface, **brown-mid** `#724F43` for eyebrows and letter text on paper, **taupe** `#B5ABA3` for muted text on dark and brown bands only (it fails on paper).
- **White.** `white-pure` `#FFFFFF` (`--color-white-pure`) is the ink on the fixed dark bands and the matte behind a loading cover; it is not a surface. Any other white, black or tint on a screen style is a token mixed with `color-mix()` (a gold hairline is `color-mix(in srgb, var(--color-gold) 50%, transparent)`), never a raw hex or `rgb()`; a mask only needs an opaque colour, so it takes `var(--color-foreground)`. Print rules (`@media print`) may use plain greys and black and are the one place raw hex stays, listed in `.impeccable/config.json` with that reason.
- **Hairlines.** `--hair` ink at 16%, `--hair-strong` at 34%; every rule and divider uses them.
- Headline accent word: `.heading-accent` in indigo on paper, pinned brand gold on the fixed dark band. The editor types the word; the colour is the brand's.

Do not add liturgical-season colours or any hue outside the five.

## 3. Typography

Three faces, installed as fontsource packages and applied through `brand/brand.config.json` and `npm run apply-brand`:

- **Castoro Titling** (capitals only, one weight): `--text-display` (one per page: the home hero headline, or the Sunday numeral), `--text-h1` (interior heroes, statement bands), mobile menu rows, the footer poster line. Tracking `0.01em`, line-height 0.95 to 1.05; h1 is set uppercase in CSS.
- **Castoro** (roman and italic, one weight): everything from h2 down, body at 17px/1.7, the italic **lede** standfirst under a heading, blockquotes (`.rt-quote`), captions in italic when used. Numerals use old-style figures.
- **Sofia Sans Semi Condensed** (variable): nav, eyebrows, labels, buttons, dates. Always uppercase at `--text-ui` 0.8125rem with `0.14em` tracking.
- Other scale tokens: `--text-title`, `--text-h3` to `--text-h6`, `--text-item` and `--text-dense` (the Ledger's two sizes for list rows and dense columns).
- **The type steps in use (2026-10-03).** The front matter lists every font size the CSS sets, as `text-10` to `text-28` (labels, notes, list rows, names) and `display-30` to `display-92` (the endpoints of the bands' fluid `clamp()` headings), 34 steps in all. It is a record of what the code does, not a promise that 34 sizes are a good ramp: most bands tune their own fluid heading, which is why the set is wide. A new size goes into the front matter the day it enters the CSS, or the detector (`impeccable detect`) reports it; prefer an existing step. Seven odd values were folded into their neighbours that day (0.65rem, 0.96875rem, 0.9875rem, 18.5px, 1.3rem, 2.1rem, 4.6rem). Consolidating the display endpoints onto the named tokens above is a design pass of its own, not done.
- Hierarchy is capitals against lowercase and size, not weight. Eyebrows are rare: page openers and a few orienting labels. A calligraphic script slot (`--font-script`) exists in the CSS but `fonts.script` is `null`.

## 4. Elevation

Flat by design (see Overview). Surfaces separate by tone (paper, soft paper, fixed indigo, brown, gold, taupe bands) and by `--hair` rules. Photographs never get rounded corners or drop shadows; the only radius is `--radius: 0.125rem` (2px) on buttons and form fields. Four documented exceptions: `keyline` 1px (the inner rule of the app-store buttons), `full` 9999px (the live dot and round social buttons) and `phone-body` 26px, `phone-screen` 20px and `phone-notch` 3px (the drawn phone on Home's church-app band, an illustration of a device, not a surface). Hero text over photographs sits on a soft dark backing anchored to the words, not a darker photograph (2026-09-27 decision, checked by a 432-case contrast sweep).

## 5. Components

- **Buttons (`CtaLink.astro`).** One family: `gold` (gold fill, indigo-field label, inset double keyline), `outline` (indigo outline on paper, white on dark via `onDark`, band ink on gold via `onGold`), and `link` (underlined UI-face text with a trailing arrow that nudges 4px). `primary`, `secondary` and `rule` are aliases for the first two. Label in the UI face, em-based padding, 44px minimum tap target, 1px press on `:active`. The `link` variant keeps a text-sized box so its underline sits on the baseline, and gets its 44px from `.hit-44` (below).
- **Tap targets (2026-10-03).** Every link and button is at least 44px each way at 390px, except a link inside a sentence of body text (WCAG 2.5.8 exempts it, and padding it would break the line: the YouTube channel link on Visit and the deacon chair address on Staff). A small control gets there with `.hit-44` in `globals.css`: an invisible `::after` centred on the element and at least 44px square, so nothing you can see moves. The element must be positioned. `node scripts/measure-tap-targets.mjs <url>` counts what is left under 44px; the 2026-10-03 run took Home, Visit and Staff from 79 to 0 (plus the 2 exempt inline links).
- **Staff bands (`StaffGrid.astro`).** The ground follows the group: the pastors on gold, the Church Coordination Team on brown, support and volunteers on taupe. The band heading sits top-left and the church's introduction beside it. On the gold band the introduction is set on a paper panel with an indigo top rule (gold is a fill, not a reading ground); on brown it stays on the band in paper-white. The window hero's portraits take the lancet's own 100 / 150 proportion when there are two of them, so the faces are not cropped by a tall narrow frame.
- **Header (`Header.astro`).** One row, 74px (88px from `lg`), server-rendered desktop nav (rule 4), a single Give plate, Watch live link. Overlay mode over image heroes strips the ground and turns the lettering to paper. The mobile menu is a full-window drawing with Titling rows.
- **Hero (`Hero.astro`).** `full` fills `100svh` on home (72svh interior) with a bottom-up and left-right ink gradient; home cross-fades twelve photo frames. Content sits bottom-left: a live dated line, headline at display or h1, italic lede, a facts row on a hairline, then a gold button and a text link. `split` bleeds the photo to the viewport edge.
- **Photo frames.** `ArchFrame.astro` masks a photograph into the LANCET (tall pointed window, 2:3) or the DOOR (four-centred head, 10:13) with a thin gold mould outline; the crop follows the editor's hotspot. Bands break the container once at most, by an image bleeding to the edge (`.bleed-right` / `.bleed-left`, sized in `cqw`, never `vw`, rule 19).
- **Glyphs.** `BuildingGlyph.astro` draws four 2px line glyphs for the goals: window (Worship), door (The Way), lamp on a stand (Witness), basin, jug and towel (Work, John 13). `BeliefGlyph.astro` (2026-10-05) is the same language at heading size, six glyphs in a 48x48 box beside the subheadings of the Basic Beliefs band on /beliefs only: triangle in a circle (God), shoot with two leaves (Creation and Humanity), outlined cross (Jesus Christ), flame within a flame (The Holy Spirit), sun over a horizon (Salvation), cup with a drop (Baptism and the Lord's Supper). Derived from the heading text (`src/lib/belief-glyphs.ts`), 32px at 375px and 40px from 768px, left of the text at every width, drawn once on first view like the goal glyphs.
- **Bands.** Hymn board (What to Expect, on brown), goals as arched doors, heritage band with the Hannaford rendering, blog rows on taupe, the gold Give band, the footer poster (live dated line, service time at poster scale, Give). Rich text goes through the Ledger (`RichBody.astro`): short columns set large, long ones small.
- **Header comment convention.** Every component file starts `// Safe to edit by hand` or `// Foundation, edit with care`.

## 6. Do's and Don'ts

Motion (part of the system, per `docs/agent/animation.md`): default interaction easing is `cubic-bezier(0.16, 1, 0.3, 1)` at 440ms; the home headline words rise (first at 150ms, 60ms apart); single-photo heroes push in briefly; `[data-reveal]` is allowed only on figures, big numerals, cover images, glyph draws and the Hannaford ink-in. Native scrolling, no scroll library. `prefers-reduced-motion` zeroes it all.

**Do**

- Use the church's own headings and photographs of its own people and building.
- Measure any new colour pair with `src/lib/contrast.ts` and add it to `theme-tokens.test.ts` before shipping.
- Keep gold to fills, hairlines and on-dark ink; use gold-ink for small labels on paper.
- Use `cqw` against `#main` for edge-bleeding boxes, and `break-words` with `max-w-full` on shrink-to-fit text.
- Check the compiled stylesheet stays under the 147,456 B inline ceiling (rule 20).

**Don't**

- Don't add a dark mode, season colours, visible photo captions, parallax or scroll-linked text motion.
- Don't put `data-reveal` on headings, prose, lists or CTAs.
- Don't round photo corners or add card shadows.
- Don't write an em-dash in site copy (rule 2).
- Don't put gold or taupe text on paper, or white text on gold.
- Don't set a long passage of reading straight on the gold fill; put it on paper (see the Staff bands).
- Don't use a coloured side stripe (`border-left` or `border-l-4` in an accent) to mark a callout or row; use a full outline, a top rule or a marker (2026-10-03: the church-app band's phone rows and the journal tip callout stopped doing it).
