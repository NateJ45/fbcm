# FBCM art-direction pass: design spec

Written 2026-09-20. Approved direction: the home-page prototype at `prototypes/home/index.html`
(commit 09d99c3), built against the brief in `docs/superpowers/notes/2026-09-20-design-research.md`.
Nathan approved the direction on 2026-09-20 ("do that") and asked for two additions: a motion pass
and a distinctive mobile menu, taking the header, footer, nav and mobile ideas from the Stone Steps
50K build as inspiration (survey in `docs/superpowers/notes/research/2026-09-20-stonesteps-survey.md`).

This spec carries the prototype's language into the real components under all eleven pages, the
blog and the post template. It is a redesign of how the site RENDERS. It changes no schema, no
document and no approved copy.

## 1. Goal and constraints

**Goal.** Every page scores 16 of 20 or better on the ten-point rubric in
`docs/superpowers/notes/research/2026-09-20-generic-ai-design.md` section 4, where the live home
page scores 6, and Nathan is willing to hand the site to the church.

**Hard constraints, all carried from the project.**

- The five brand colours are unchanged: indigo `#292854`, gold `#d59b29`, taupe `#b5aba3`, brown
  `#39251e`, brown-mid `#724f43`. They move from chrome to accent.
- **Zero schema changes.** No new fields, no renamed fields, no typegen, no dataset writes. Every
  new behaviour is derived from data that already exists (CLAUDE.md rule 15). This keeps the pass
  a pure render change and removes the "Remove field" hazard (rule 1) entirely.
- No em-dashes in site copy (rule 2). The pass writes almost no copy; the two new strings in the
  prototype ("about an hour", "Hymns, the choir, and a sermon, then coffee in the fellowship
  hall") are NOT shipped until the church confirms them, and go on the approval note.
- Light and dark on every change (rule 3); desktop nav server-rendered (rule 4); the Lenis reset
  (rule 5); the matched dependency set (rule 8, the three font packages are the only additions);
  no colour fields on blocks (rule 9); one grammar per page (rule 17).
- The preview stack is untouched except where a component reads a string: any new string
  parsing goes through `splitStega()` first (the "never measure a stega string" rule).
- Lighthouse stays at or above the recorded numbers in
  `docs/superpowers/notes/2026-09-20-lighthouse.md`; axe light and dark stay green; the anchor
  suite stays green; the visual baseline is regenerated at the end, not suppressed.

## 2. Type

Three voices, installed as fontsource variable packages and applied through
`brand/brand.config.json` and `npm run apply-brand`, which also rewrites the Studio theme's font
stacks in `sanity.config.ts` and regenerates the OG image.

| Role | Face | Package | Where |
|---|---|---|---|
| Display | Castoro Titling, one weight, capitals only | `@fontsource/castoro-titling` | h1, h2, big numerals, blog titles, nav rows in the mobile menu, footer poster line |
| Reading | Castoro, roman and italic, one weight | `@fontsource/castoro` | body copy, post bodies, ledes (italic), captions in italic |
| Furniture | Sofia Sans Semi Condensed, variable weight | `@fontsource-variable/sofia-sans-semi-condensed` | nav, eyebrows, labels, buttons, dates, small print |

Inter and Libre Baskerville are removed from `globals.css` imports and from `brand.config.json`.
`--font-display`, `--font-body` and a NEW `--font-ui` token carry the three. `--font-mono` stays
for the two places the starter uses it (code in posts, the Studio) but no chrome uses it any more:
every current `font-mono` eyebrow and label becomes `font-ui`.

**Scale, as tokens in `@theme`:**

```
--text-display: clamp(2.9rem, 1rem + 8.4vw, 8rem);   /* the page's one moment, line-height .95 */
--text-h1:      clamp(2.6rem, 1rem + 5.4vw, 6rem);       /* statement bands, interior heroes, line-height 1 */
--text-h2:      clamp(2rem, 1.2rem + 2.6vw, 3.25rem);    /* section headings, Castoro roman, line-height 1.05 */
--text-h3:      clamp(1.375rem, 1rem + 1vw, 1.75rem);    /* weight 400 */
--text-lede:    clamp(1.25rem, 1rem + 1vw, 1.75rem);     /* Castoro italic, line-height 1.35 */
--text-body:    1.0625rem; line-height 1.7                /* 17px, the reading size */
--text-ui:      0.8125rem; letter-spacing .14em; uppercase; font-stretch 100%
```

Rules that bind the scale:

- Exactly one element per page sits at `--text-display`: the home hero headline, or on a page with
  no tall hero the Sunday numeral. Interior hero h1s sit at `--text-h1`. Statement bands use `--text-h1` in the titling capitals.
  Nothing else may use either token.
- The titling face is capitals only and carries exactly four things: the  and  tokens, the mobile menu rows and the footer poster line. Everything from h2 down is Castoro roman at weight 400, so the hierarchy is carried by capitals against lowercase and by size, not by weight. The starter's h2 at weight 500 goes.
- Every heading and numeral in Castoro Titling sets positive tracking (0.005em to 0.02em) when set in the titling capitals, and none in Castoro roman. Numerals use `font-variant-numeric: oldstyle-nums`.
- The lede class (`.lede`) is the italic Castoro standfirst under a heading. It replaces the
  `subhead` paragraph in SectionHeading and Hero.
- The eyebrow becomes rare. SectionHeading keeps its `eyebrow` prop, but the page modules stop
  passing one except on page openers (the hero) and the three orienting labels the prototype
  keeps (Sunday morning, Our pastors, From the blog). The 56x2 gold rule under headings is
  removed; the `rule` prop becomes a no-op kept for compile compatibility and deleted at the end.

## 3. Colour roles

Chrome is paper and ink. The brand colours are accents.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-bg` (paper) | `#f4efe6` | `#14121b` | page ground |
| `--color-bg-soft` | `#ebe4d8` | `#1c1926` | the alternating band, the give band |
| `--foreground` (ink) | `#17151f` | `#f1ece3` | headings and body |
| `--muted-foreground` | `#514c58` | `#c2bcc9` | secondary text |
| `--color-indigo` / `-field` | unchanged | `#22214a` | the pastors band, the footer, the mobile menu |
| `--color-brown` | unchanged | `#2b1b16` | the building band |
| `--color-gold` | unchanged | unchanged | primary button fill, hairlines, small labels on paper via `--gold-ink #8a5f0c`, labels on dark |
| `--color-taupe` | unchanged | unchanged | muted text on dark bands only (existing FORBIDDEN pair stays) |
| `--hair` | `rgba(23,21,31,.16)` | `rgba(241,236,227,.16)` | every rule and divider |

The old grey-blue starter tokens (`--primary #586577`, `--link #434e5c`, `--secondary #aab0b8`,
`--tertiary #9db0a6`) are replaced: `--primary` becomes indigo, `--link` becomes ink with a gold
underline, `--tint-rgb` becomes the indigo triple. `src/lib/theme-tokens.test.ts` is updated in the
same task as the tokens so the contrast gate measures the new pairs; every pair the prototype
draws is measured with `src/lib/contrast.ts` before it ships. Gold on paper is still never body
text; `--gold-ink` is the paper-safe label colour (7.0:1 on `#f4efe6`, to be confirmed by the gate).

## 4. Layout grammar

- Container `--max: 1400px`, gutter `clamp(20px, 5vw, 72px)`, a 12-column grid with
  `column-gap: clamp(16px, 2.5vw, 40px)`. `--container-content` moves from 82.5rem to 87.5rem;
  `px-m` gutters become the gutter token.
- **One left edge** (rule 17) and **one break per band**: each band may break the container once,
  by an image bleeding to the viewport edge (the mechanism is a negative margin equal to
  `min(-gutter, (100vw - max) / -2 - gutter)`, as the prototype does) or by a full-bleed
  photograph. Nothing else leaves the container.
- No rounded corners on images. `--radius` drops to `2px` for buttons and form fields only.
- Bands vary in density on purpose: full-bleed statement, asymmetric two-column (heading in the
  narrow left third, prose in the right half), dark band, detail strip, editorial list, quiet
  prose measure. `sectionCadence.ts` keeps alternating paper and soft for CONTENT_TYPES; the
  visual variety comes from the components, not from a new cadence rule.
- Every page shows the building at three distances where the page's images allow: a wide
  photograph, a room with people, a detail crop. The page modules already hold the images; the
  components render them larger.

## 5. Components

Each entry says what the component becomes. Props are unchanged unless stated. "Bleed" always means
the prototype's negative-margin break to the viewport edge on the image side only.

**SectionHeading.astro.** Eyebrow in `font-ui` and `--gold-ink` (gold on dark). Headline in
Castoro Titling (uppercase, tracking 0.01em) for h1; Castoro roman for h2 and h3. The lede replaces the subhead
paragraph (same `subhead`/`subheadRich` props, new class). No rule, no hairline. `max-w-3xl`
becomes `max-w-[22ch]` for h2 so headings wrap tight and tall.

**Hero.astro.**
- `full`: the photograph fills `100svh` (home) or `72svh` (interior) under the prototype's two
  gradients (bottom-up to 94% ink, left-right to 55%), replacing HeroBackground's flat scrim. The
  five-frame cross-fade stays, cross-fading the photograph only. Content bottom-left. A LIVE
  DATED LINE replaces the eyebrow on the home hero: "This Sunday, September 27 · Worship at
  10:45 am", the date computed client-side from the visitor's clock, the time derived from
  `siteSettings.serviceTime` after `splitStega()`; the server render carries "Sundays · Worship at
  10:45 am" so the no-JS and pre-hydration states are true. Interior full heroes keep their
  eyebrow. Headline at `--text-display` (home) or `--text-h1` (interior). The lede. The facts row
  on a hairline, values in Castoro at 1.25 to 1.625rem. Gold button plus a text link with an
  arrow (CtaLink `link` variant, onDark) instead of two buttons. The scroll cue and the pause
  button go.
- `split`: the photograph column bleeds to the viewport edge; the gold left rule goes; the words
  column gets the same lede and facts treatment.
- `text`: unchanged in structure, new type.

**SundayTimes.astro.** Becomes the two doors. Left: the eyebrow, the service time as a
`--text-display` old-style numeral with the meridiem as a small italic, the body line as a lede,
then the items as a ruled schedule (time in Castoro Titling 1.5rem, label, optional italic note). Right:
the map card is replaced by the page's first `imageTextSection` photograph when the page has one
(home, visit, contact all do) as a bleeding frame with a caption line, otherwise the static map
stays. The three "big" items keep their data; only the first drives the numeral, the other two
become schedule rows. No schema change: the component reads what is there.

**LinkCards.astro.** The grey cards are deleted. On a light band: a ruled three-column row, each
column an eyebrow, an h3, a paragraph and an italic arrow link. When the previous block is a
full-bleed image band (home: the 1859 statement), SectionRenderer passes a flag and the row sits
INSIDE that band's bottom on dark; this is a render decision made from the sequence, not a field.

**ImageText.astro.** Asymmetric grid: heading in columns 1 to 4 with the lede under it, body in
columns 6 to 11 at 17px/1.72, the photograph below spanning columns 5 to 12 and bleeding right
(or columns 1 to 8 bleeding left when `imageSide` is left). The hotspot rule from plan 2b stays.

**RichTextSection.astro.** When it has a heading: heading in the narrow left column, prose in the
right half at `PROSE_MEASURE` (re-tokened to Castoro 17px, 62ch). Without a heading: a single
centred-on-the-left-edge measure. Bullets, links and blockquotes restyled in the same voice.

**HeritageBand.astro.** The detail strip: the block's image plus up to two more taken from the
page's other image fields in order (the component receives `extraImages` from SectionRenderer,
which collects the page's remaining gallery or imageText images), laid as the prototype's
5fr/3fr/4fr strip with 6px gaps, edge to edge, over the brown band with the h2 and the paragraph
and a row of up to three dated numerals derived from the page's timeline block when present.

**GiveBand.astro.** Soft paper band, h2 left, paragraph and one gold button right. Indigo fill only
when the band is the last block before the footer and the previous block is light (so two indigo
surfaces never touch).

**ScriptureBand.astro.** Dark indigo, the verse as a `--text-h1` Castoro italic (the titling face has no italic) with the
reference in `font-ui`, the alpha-and-omega window photograph masked behind at 18% under
`mix-blend-mode: luminosity` when the page provides no image (asset shipped in `src/assets/`).

**StaffGrid.astro.** Editorial grid: portraits at 4:5, no rounded corners, no card. Name in
Castoro Titling 1.5rem, role in `font-ui`, email as a plain link. Hairline above each row. The grouped
lists keep their headings as the narrow-column h2.

**Timeline.astro.** Years as `--text-h2` old-style numerals in the left column, the entry beside;
the connector becomes a hairline. Images bleed left on alternate entries.

**FaqBand.astro.** Stays dark indigo. Question text in Castoro Titling 1.375rem, the chevron becomes a
plus that rotates to a cross, answers in Castoro.

**QuoteBlock.astro.** The long-quote scale stays; quote marks removed; quote in Castoro italic, attribution in `font-ui`.

**DocumentList.astro, Hours.astro, DynamicList.astro.** Ruled lists in the blog-list grammar:
date or label in `font-ui` left, title in Castoro Titling, description in Castoro, hairlines between
rows, no cards. DynamicList (home's blog three) becomes exactly the prototype's editorial list.

**FinalCta.astro (ctaBandSection) and StatsRow.astro.** FinalCta: h2 at  in the titling capitals on
indigo, subhead as a lede, gold button plus text link. StatsRow: numerals in Castoro Titling old-style at
`--text-h1`, labels in `font-ui`, hairline dividers.

**SectionDivider.astro.** The sun glyph is deleted. A divider is a hairline inside the container
or nothing; `insertDividerBefore` keeps its logic.

**CtaLink.astro.** One button family, redrawn: `gold` is gold fill, ink label in `font-ui`
0.8125rem 600 tracking .12em, padding 1.05em 1.6em, radius 2px, and the SIGNATURE: a 1px inset
hairline in the label colour drawn 3px inside the edge (a double rule, the hymn-board plate), lift
1px on hover, press 1px on active (`.press-tactile` stays). `outline` is a 1px ink (or paper on
dark) border with the same inset hairline. `link` is `font-ui` uppercase with a 1px underline and
an arrow that nudges 4px on hover. The `primary`/`secondary` aliases stay.

**JournalCard.astro, blog index, category, tag and post pages.** The index keeps its grid but the
card is a bare image with the title in Castoro Titling below, no border, no shadow. The post page: title at
`--text-h1`, a lede from the excerpt, meta in `font-ui`, body in Castoro at 17px/1.72 and 62ch,
h2 in Castoro roman, figures full-measure with italic captions, the reading progress bar in gold.

**404 and privacy.** Take the new type through the shared components; no layout work.

## 6. Chrome

**Header.** One row, 88px desktop, 74px mobile, no utility strip: the phone and Contact move to
the mobile menu's foot and the footer. Wordmark left at 56px. Nav in Sofia Sans Semi Condensed 0.9375rem 500 with a
1px gold underline that draws from the left on hover and stays drawn on the current page (the
`nav-underline` rule is redrawn: left origin, gold, 1px). Give is the gold button. The theme
toggle moves into the mobile menu and the footer's base rail; on desktop it sits at the far right
of the nav as a 28px icon button. **Overlay mode**, from Stone Steps: on a page whose first block
is an image hero the header paints no background and uses paper ink until `scrollY > 8`
(`data-overlay` set by BaseLayout from the page's first block type, `data-scrolled` set by the
polish script), then it becomes paper with a hairline bottom border and ink text. The hide-on-
scroll-down behaviour and its gesture gate stay exactly as shipped. `--header-offset` is remeasured
and the anchor suite reasserts it.

**Desktop dropdowns.** Mechanics unchanged. Panel restyled: paper, hairline border, no shadow,
items in Sofia Sans Semi Condensed.

**Mobile menu.** The distinctive piece. It keeps the Radix Sheet (focus trap, scroll lock, Escape,
`client:idle`) but opens `side="top"` at `h-dvh`: the menu DROPS over the page on indigo. Inside,
from top: the wordmark at left and a paper close plate at right exactly where the trigger was;
the nav as numbered rows (01 to 08) in Castoro Titling at , each
row rising into place with a 70ms stagger (`translateY(24px)` and opacity, 480ms, the brand
curve), the current page's row carrying a gold hairline; below the rows a two-column foot in
`font-ui`: the service time and street on the left, phone, Contact and the theme toggle on the
right; and behind everything, masked to the top 40% of the sheet under a gradient to indigo, the
alpha-and-omega window photograph at 22% opacity with a slow 40-second drift of 12px (the ambient
motion, killed under reduced motion). Rows have no hover background; the hover is the gold
hairline drawing. The trigger is the word MENU in `font-ui` beside a two-line glyph, not a
hamburger icon.

**Footer.** Indigo field, and it is where the site ends with a poster moment: a top band with
"This Sunday · 10:45 am" set in Castoro Titling at `clamp(2rem, 5.2vw, 3.25rem)` (the same live line as
the hero, same derivation, same server fallback), the street on the next line, and the gold Give
button; a hairline; then the wordmark and tagline at left, the two editor columns as NUMBERED
rows in Castoro Titling 1.25rem (the Stone Steps device in the church's face), and the Office column as
prose; a base rail with copyright, legal links and the theme toggle. The 4px gold top rule goes;
the arch of the window photograph, masked, sits at 10% in the top right corner of the band as the
footer's texture.

## 7. Motion pass

The engine stays (Lenis, View Transitions, the reveal observer, the header script). What changes
is what uses it.

1. **Page load choreography, hero only.** The hero's line, headline, lede, facts and buttons rise
   in sequence (0, 150, 300, 450, 600ms; 1000ms; `cubic-bezier(.2,.7,.2,1)`). The existing
   `hero-entry-stagger` is retimed to these values. Nothing else animates on load.
2. **Reveals are reserved for photographs and numerals.** `[data-reveal]` comes off prose, headings
   and lists. It stays on images (a 600ms fade with a 0.75rem rise, as now) and on the big numerals
   in SundayTimes, StatsRow, Timeline and the building band. Single fire, never on re-entry
   (already true).
3. **Hover language.** Links: the gold underline draws left to right in 260ms. Images inside links:
   `scale(1.02)` over 1200ms. Buttons: lift 1px, press 1px. Blog rows: the title moves to
   `--gold-ink`. No card lift anywhere (there are no cards).
4. **Ambient.** Two loops only, both gated on `prefers-reduced-motion: no-preference`: the window
   drift in the mobile menu and a 7-second breathe on the hero gradient's bottom stop between 94%
   and 90%. Nothing else moves at rest.
5. **View transitions.** Kept. Header and footer get `view-transition-name` so they stay put while
   the page content crossfades.
6. **Reduced motion.** Every rule above is inert under the existing global zeroing; the menu rows
   and hero content render in their final state.

## 8. Studio

No schema work, so no Studio structure changes. `apply-brand` rewrites the Studio theme fonts.
The in-canvas overlay theme (`overlay/tool-theme.ts`) takes the new paper and ink so the preview's
own controls match.

## 9. Gates and evidence

- `npm run check`, `npm run test:unit` (with `theme-tokens.test.ts` updated to the new pairs, and
  `layout-variants.test.ts` updated where a grid's base columns change), `npm test` on both
  engines including axe light and dark and the anchor suite.
- `npm run parity compare` is EXPECTED to fail on every page during this pass. It is recaptured
  once at the end on a settled tree, with the two-build stylesheet byte-count proof.
- Lighthouse on the six recorded pages in both form factors, compared to the 2026-09-20 note.
- The visual baseline regenerated via the workflow's `update` input at the end.
- Per page, before it is called done: screenshots at 1440 and 390 in light and dark, walked so
  reveals fire; the rubric score written into the task report; the photo-at-three-distances
  check.
- The final deliverable is the deployed site on workers.dev and a walkthrough note listing the
  score per page and the two copy strings awaiting church approval.

## 10. Sequencing

1. Tokens and fonts (config, apply-brand, tests, prose measure).
2. Shared primitives: SectionHeading, CtaLink, SectionDivider, the lede and bleed utilities.
3. Chrome: header with overlay mode, mobile menu, footer.
4. Hero, SundayTimes, LinkCards, ImageText, RichText, DynamicList (the home page reads right).
5. HeritageBand, GiveBand, ScriptureBand, FinalCta, StatsRow, StaffGrid, Timeline, FaqBand,
   QuoteBlock, DocumentList, Hours (every other page reads right).
6. Blog index, archive routes, post template, 404, privacy.
7. The motion pass across everything above.
8. Per-page review against the rubric, fixes, parity recapture, visual baseline, Lighthouse,
   walkthrough note, deploy.
