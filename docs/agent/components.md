# Component organization

> Build order, the core component catalog, long-read layout, and component conventions.

## Component organization

When building UI, reach for components in this order:

1. Existing components in `src/components/` that already match this site's design
2. shadcn/ui primitives in `src/components/ui/`
3. Aceternity UI for motion-rich blocks (hero, bento, parallax) where the design calls for them
4. Magic UI for smaller flourishes (marquee, animated text)
5. Custom build only if nothing above fits

File naming:

- PascalCase for top-level components (`Hero.astro`, `ImageText.astro`, `RichBody.astro`)
- kebab-case for shadcn primitives in `src/components/ui/` (matches shadcn CLI convention)

### Radix-based primitives server-render fine, so hydrate them at `client:idle`

shadcn primitives that wrap Radix's Dialog (Sheet, Dialog, DropdownMenu with portal positioning) server-render without trouble on the versions this starter pins. A closed Dialog renders only its trigger, and the portal mounts nothing until it opens, so the trigger is in the server HTML and the island only needs the React runtime by the time a visitor reaches for it. Hydrate these at `client:idle`, the same as any other non-critical island, and let the markup ship with the page. `MobileNav.tsx` is the reference.

This doc used to say the opposite: that the portal hook threw "Invalid hook call" during server render and these primitives had to be `client:only="react"`. That was measured on an older React and Radix pairing and no longer holds. `client:only` skips SSR entirely, which meant the hamburger button was missing from the server HTML until React loaded, and it pulls the runtime onto the critical path.

**If a component genuinely cannot server-render**, the symptom is unmistakable: an "Invalid hook call" thrown during the build's server render, naming the component. `client:only="react"` is still the escape hatch for that case, and it is not dead text. `VisualEditingOverlay` in `src/layouts/PreviewLayout.astro` keeps it on purpose: the overlay is preview-only, Studio-coupled, and has nothing meaningful to render on the server.

### Button variants

The primary CTA button extends `src/components/ui/button.tsx` with `variant="brand"` + `size="cta"`. Don't override the shadcn defaults inline. Leave other shadcn variants unmodified so future `npx shadcn add` commands don't fight with extensions.

### Core components

The core component set, by role. All in `src/components/` unless noted.

**Page chrome:**

- `Header.astro` -- one row (wordmark, seven links, Give, theme toggle; the drawer below lg). Scrolls away with the page and slides back in over the content on a scroll up once past 150px; see `docs/agent/polish-layer.md`, "Sticky header behavior".
- `Footer.astro` -- one indigo-deep band in both themes, redrawn in the church identity 2026-09-24 (the footer identity pass). Top to bottom: the poster row (the closing Sunday band: the live dated line, the time, the street, Give), the four goals (`GoalsRow size="footer"`), the editor's link columns as plain unnumbered lists (Pages set in two short columns, Elsewhere) beside Office (hours, phone, email; the street only when the poster row did not print it), the sign-off (the Praise & Proclaim `WatchwordMark` and the bottom line "An American Baptist congregation in downtown Muncie since 1859", the year from `site.founded`), and the base rail (wordmark home link, auto-year copyright, privacy, theme toggle). Behind the sign-off, along the bottom edge, the 1927 Hannaford rendering as faint gold line art: `src/assets/footer-rendering.webp` (952x452, lossless WebP alpha, ~31 KB) used as a CSS mask over a `--color-gold` box at 16% opacity, absolutely positioned and aria-hidden, inside a `content-visibility: auto` box so the mask is not fetched until the footer nears the viewport (no layout shift, no LCP cost).
- `MobileNav.tsx` -- full-screen indigo Sheet (`client:idle`; the closed Sheet server-renders its trigger, so the "Menu" button is in the server HTML). Unnumbered display-face rows, the Sundays and contact foot, the Give button, and the four goals at the bottom (`GoalsRow size="menu"`, slotted in by `Header.astro` as the island's children so the glyphs are drawn by the one Astro component; a delegated click closes the sheet when a goal is followed).
- `church/GoalsRow.astro` -- the four goals as one row of links to their bands on /who-we-are (`#worship`, `#the-way`, `#witness`, `#work`): gold building glyph, display-capital name, and in the footer the small line Who We Are's goal index prints. Data from `src/lib/church-goals.ts`, the one code-side list of the goals (outside the `church` scaffold capability; `ministry-goals.ts` reads its `GOALS` from it).
- `BaseLayout.astro` -- anti-FOUC theme bootstrap, View Transitions, Lenis init, scroll-reveal observer, sticky-header scroll listener.

**Hero + page-top:**

- `Hero.astro` -- image variant (full-bleed photo + gradient overlay) OR text variant (delegates to SectionHeading). Accepts `backgroundImage` for a single Sanity image or `backgroundImages` array for a cross-fading slideshow (falls back to single image for non-home pages). Image variant passes `onDark` to CTAs automatically. On the home page (`size="tall"`) it fills the viewport below the sticky header and shows a soft pulsing scroll cue.
  - **The headline is sized by its own length** (2026-09-23, `src/lib/headline-scale.ts`, unit-tested). `headlineScale(text, { tall })` reads the stega-cleaned text (characters, words, longest word) and returns `poster`, `title` or `sentence`; `headlineClass(scale, { tall })` is the one class table. **Poster** (interior: at most 16 characters, 3 words, a 10-letter longest word; home/tall: 24, 4, 9) keeps the art-direction look exactly (`text-h1` or `text-display`, titling capitals, 12ch). **Title** (at most 48 characters, 8 words, a 12-letter longest word, 10 on the tall hero) stays in capitals one size down (`--text-title`, or `text-h1` on the tall hero) on an 18ch measure, so it sets in two or three lines. **Sentence** (anything longer) switches to Castoro in sentence case at `text-h2` on a 22ch measure. The longest-word limits are what keep every word whole at 320px: a headline whose longest word is too wide for a scale drops to the next one. The same scale reaches the text-only branch through `SectionHeading`'s `scale` prop, the band-opening h1 of `GiveBand` and `HeritageBand`, and the journal `blog/Opener.astro`. The rendered h1 still carries the raw headline, so click-to-edit works in the preview. Live mapping: poster for /history, /wedding, /contact and the home hero; title for /visit, /beliefs, /ministries, /staff, /give, /blog; sentence for /who-we-are.
- `HeroBackground.astro` -- the hero background layer. Renders a single static `SanityImage` for 0-1 images, or a cross-fading Ken Burns slideshow for 2+. Used only by `Hero.astro`.
- `SectionHeading.astro` -- eyebrow + brand hairline accent + headline + subhead. Used by text-variant Hero and every interior section heading. Supports `tone="inverse"` for dark FinalCta panels. Accepts `scriptAccent?` for the optional calligraphic accent word (see `docs/agent/polish-layer.md`). `face="display"` (2026-09-23) sets its h2 in the church band grammar below; `wide` drops the wrapper's `max-w-3xl` for a heading whose own column sets the width (the /give h1).
- **The church band heading grammar** (2026-09-23, CLAUDE.md rule 17). Every church band's h2 is Castoro Titling at `text-h2`, one weight, read from `H2_DISPLAY` in `src/lib/heading-grammar.ts`: What to Expect (SundayTimes), Church Blog (DynamicList's journal rows), Give (GiveBand), the arched-door LinkCards heading ("Our Goals", "Where To Go Next"; it was `text-title` until then) and HeritageBand ("Our Building", /visit's "Built in 1929"; it was the reading face) through `SectionHeading face="display"`, and Who We Are's Watchword, Goals, Pledge and Letter bands (the last three were `text-title`, 67.84px at 1440). Colour is not part of the grammar: each band sets its own ink. Not yet on it, by ruling: the reading-face h2s of the RichText, Timeline and FAQ bands, which move with the Visit and Beliefs pages in the identity rollout.
- `sections/SundayTimes.astro` (`sundayTimesSection`, scaffold `church`) -- **the hymn board** (2026-09-23, the Home identity pass; it replaced the "two doors" band). The whole band is brand brown, dark by type, and the rows are set straight onto it the way the board by the pulpit carries its numbers: a gold numeral, the title beside it, a small line under it, gold hairlines between rows. `boardRows()` in `src/lib/hymn-board.ts` (unit-tested) turns items then doors into rows: a clock time is a Titling numeral with its am/pm small, italic and lower case; any other big line is set smaller in the same gold; a door row carries the door glyph. The row whose time matches the Site settings service time is drawn largest (derived, rule 15, meridiem-aware). The first column is a subgrid track, so the titles share one left edge. Optional fields added in this pass: `intro`, `notes` (up to three, each with a small gold quatrefoil, not a goal glyph), `photos` (up to two: the first in a wide door arch at 160:112, the second in a small lancet overlapping it behind a brown halo, `.hb-halo`) and `cta` (a gold plate; without it the directions link is the button). With no photos it borrows a spare photo; with none, the map (`showMap`); with none of those the board sits alone, centred. The address and directions come from Site settings. Used on home (What to Expect), /visit (Doors, parking and access) and /contact.
- `ReadingProgress.astro` -- fixed 3px accent track at the top of `<article>`-wrapped pages. Used on journal posts.

**Marketing cards (all share the brand-stripe + resting-shadow rhythm):**

- `ServiceCard.astro` -- service tier (price + features + best-for + CTA).
- `JournalCard.astro` -- deleted 2026-09-22 by the journal polish (the blog index and archives are now the "I1 Register" dated list; see `docs/agent/changelog.md`).
- `TestimonialCard.astro` -- quote card with monogram fallback when no photo. Renders a project link when `relatedProject` reference is set.
- `FeaturedTestimonial.astro` -- large editorial pull-quote variant of TestimonialCard.

**Home page featured sections:**

- `FeaturedJournal.astro` -- hero journal entry + companion panel layout. Feeds off `featured: boolean` on `journalEntry`. Queries order `featured desc, publishedAt desc` capped at 4. Suppresses entirely when the collection is empty; degrades to a centered single-hero spread when there is only one item.

**Gotcha -- bottom-anchored overlay vs. image height.** Hero cards that pin title blocks to `absolute bottom-0` of an image will clip the top of the overlay if the overlay content is taller than the image. Two levers: a portrait mobile aspect (`4/5`, never wide) and capping the desktop case at `16/10`. If eyebrow chips vanish above a hero image, this is why.

### Long-read layout (journal detail)

`/post/[slug]` is the "P2 Bulletin" layout (journal polish, 2026-09-22; spec and prototype in
`docs/superpowers/prototypes/2026-09-22-journal/`):

1. **Masthead** -- category line, h1, excerpt lede (dropped when `ledeEchoes` finds it in the
   body) in columns 1 to 7; in columns 9 to 12 the ORDER, a ruled `dl`. A sermon preview gets
   Sunday / Reading / Series / Preaching / Listen from `src/lib/sermon-derive.ts` and
   `post-body.ts`; any other post gets Posted / Written by / Takes / Filed under. Empty rows are
   omitted, never guessed.
2. **Cover** -- always in a door arch (`ArchFrame shape="door"`, gold mould) and never
   captioned (identity pass, 2026-09-24). A real photograph (width >= 2000 and ratio >= 1.3)
   is a wide door across the measure (ratio 100/42); anything else (the sermon slides) hangs
   in the right column at its OWN proportion plus the door's head, `object-fit: contain` at
   the foot, so the slide's lettering is never cropped and the head above it is indigo.
3. **Body** -- `prepareBody()` in `src/lib/post-body.ts` rewrites the Portable Text first
   (tables from middot lists, points, Q and A, the reading, dead Wix anchors, the cover's
   duplicate), then `JournalPortableText.tsx` renders it in columns 1 to 7 at 62ch. The right
   column is sticky: the plate, then "In this post" from `extractHeadings` when there are 3+.
4. **Foot** -- Tagged (text links) under the body; then the taupe band (identity pass): More
   from this series as `H2_DISPLAY` with the gold "All posts" plate and the shared
   `blog/PostRow.astro` rows (the series row carries the post's featured image and a datetime,
   `seriesRowOf`), then two doors: previews step Sunday to Sunday ("The Sunday before" / "The
   Sunday after", `post-neighbours.ts`), other posts Older / Newer. Every ink on the page is a
   brand token (`--color-indigo`, `--color-brown-ink`, gold rules). There is no closing CTA
   band on posts.

The Portable Text renderer (`JournalPortableText.tsx`) detects image orientation from the Sanity asset `_ref`; portrait inline images cap at 360px.

**Module-specific detail layouts** (portfolio/case study, before/after, shop, etc.) live under `modules/` and are documented in `docs/modules/`. The long-read grid pattern above is shared between the journal and any module that adds a long-form detail page.

**Rich text and photo layout (the Ledger and photo shapes):**

`RichTextSection.astro` and `ImageText.astro` (added 2026-09-22, the RichText
Ledger and photo-shapes branch) never take a layout field. Each classifies its
own content at build time and hands the result to one shared renderer,
`RichBody.astro`, so a photo band's prose and a text band's prose read as the
same grammar. The two prototypes that were approved as the visual source of
truth are still the reference for what each branch should look like:
`docs/superpowers/prototypes/2026-09-22-richtext-and-photos/richtext/index.html`
(the Ledger, all 29 rich-text bands on the site) and
`docs/superpowers/prototypes/2026-09-22-richtext-and-photos/photos/index.html`
("Ground and window").

- **`RichTextSection`** passes its body through `classifyRichText()` in
  `src/lib/rich-shape.ts`. The body is first read as segments: paragraphs,
  list runs, h3 heads (a body h2, "Heading", counts as an h3, because the
  band's own heading is the h2), h4 heads, and quotes (a blockquote is its
  own piece, never word-counted into a paragraph run). When the body has no
  h3 at all, its h4s are promoted to h3, so a band using only "Small
  heading" never puts h4 straight under its h2. The first branch that
  matches wins:
  - `row`: the band has a heading, and its body has no h3, h4, list or
    quote, 3 or fewer paragraphs and 80 words or fewer in total. Set as a
    single ruled line.
  - `columns`: 2 or more h3 groups, each group's body only paragraphs, 150
    words or fewer per group when the groups go two across, 70 or fewer when
    they go three or four across (`columnWords()`, 2026-09-24: a quarter-page
    column is for a short statement, not small prose). The groups go side by
    side.
  - `sections`: at least one h3, when the body did not qualify as columns
    (for example a group with a list or a quote in it, or too long a group).
    The groups stack; h4 groups inside a section go side by side as h4
    columns (the ministries Adults band). A section whose body is only
    reading text (measures, a standfirst, a lead-in, a quote) sets its head
    BESIDE the text in the left third (`beside`, 2026-09-24; never inside
    ImageText's narrow column); one with a list or columns keeps its head
    above.
  - `register`: not a photo ground, 8 or more paragraphs, and at least 80%
    of those paragraphs 35 words or fewer. Split into two columns, read down
    then across (the creed).
  - `ledger`: some list has 3 or more items, and the lists carry at least
    40% of the body's words.
  - `prose`: everything else.

  **Prose is one reading measure** (2026-09-24, the Beliefs identity pass,
  rollout rule 11). The `run2` / `run3` newspaper columns are gone from both
  flows: a paragraph run of any length is one `measure` at the reading size,
  and a photo ground's short run is too. A run-in label ("Label: text") is
  an italic head in the accent ink, no longer tracked capitals, and body
  heads (h3, h4) are in the brand indigo.

  **The ground is derived** (`src/lib/rich-ground.ts`, 2026-09-24). No
  colour field (rule 9): SectionRenderer calls `richGrounds(rows)` once per
  page. A text band on the cadence's paper turn is `paper`; one on its muted
  turn is a full-width brand band, `indigo`, then `brown`, then `taupe`,
  never the colour family of the row above or below it (read from the
  neighbour's type, a staff band's group, and whether a closing band has a
  photograph) and never the colour the previous brand text band on the page
  took. No hairline divider is drawn beside a brand band. On a brand ground
  the `.rt-band` rules in `src/styles/ledger.css` re-point `--hair`,
  `--hair-strong` and `--color-gold-ink`, and re-ink the band heading (its
  markup stays the Visit pass's `SectionHeading face="display"`). The pairs
  are gated in `theme-tokens.test.ts` ("the text bands"). Editors change a
  band's ground by moving it, which is the cadence's own contract.

  Inside any shape, a list becomes one piece: an ordered numbered list when
  every item is numbered (`listItem` compared after `splitStega`), a table
  when half or more items carry " | ", a hung "said" list or a triad when
  items share an opening (the covenant's "To"), a triad for up to four short
  items, an index for more, otherwise a plain ruled list. The classifier
  reads only what is already in the Portable Text body; no schema field
  drives the choice.

- **`ImageText`** passes its picture through `assignPhotoShapes()` in
  `src/lib/photo-shape.ts`, called ONCE per page from `SectionRenderer.astro`
  before any band renders. For each ImageText band with a picture, in page
  order, the first branch that matches wins (aspect is width / height):
  - `window`: aspect 0.85 or less, and the page's first such portrait. Set
    in the lancet arch.
  - `frame`: aspect 0.85 or less, any portrait after the page's first. Native
    shape, hung on a gold line.
  - `legend`: aspect 1.8 or more, and the body has a paragraph containing
    "left to right" followed by 3 to 8 list items (the names), optionally a
    footnote starting with `*`. ImageText lifts the label, names and
    footnote out of the body; if that lookup finds nothing in what is left
    after the lede, the band falls back to `row` (`resolveLegend`).
  - `plate`: aspect under 1.25, and the alt text or eyebrow names a year from
    1500 to 1949. Matted, never cropped.
  - `ground`: aspect 1.3 or more and the image 2000px wide or more, not the
    band straight after a photo hero, and a second ground only 4 or more
    rows after the first on a page of 6 or more rows (never a third).
    Full-bleed, the heading set into a darkened edge.
  - `row`: everything else, beside its text at its native shape.

  The shapes are read from the image's own dimensions, its alt text and
  eyebrow, its body, and its position among the page's other photo bands,
  never from a field.

  **No visible captions** (2026-09-23, the owner: "the pictures speak for
  themselves"). `ImageText` and `SundayTimes` used to print the photograph's
  alt text under it as a `figcaption` (`.ph-cap`, `.ph-gcap` for the ground
  shape) in every shape. That markup is gone; the alt text still lives on the
  `<img>` for screen readers, it just is not set as reading copy any more.
  The `.ph-tick` gold hairline it used to sit under stays: it is also the
  band's eyebrow rule, unrelated to captions. The P2 Bulletin's plate caption
  went too, on 2026-09-24 (the journal identity pass): the cover is a door
  arch with no caption at all (`.pp-cap` survives only for inline body
  figures an editor captions). Editor-typed caption fields that are their
  own label rather than a restatement of the alt text, `GalleryGrid`'s
  per-image name ("Kitchen", shown only when every photo in the gallery has
  one: the rooms form, below) and `VideoEmbed`'s caption, are unaffected.

- **The page pass is a budget, not a per-band choice, and that is the
  editor's surprise to know about.** Because `assignPhotoShapes` looks at
  every ImageText band on the page together, swapping ONE band's picture in
  the Studio can change ANOTHER band's shape. A new portrait added earlier on
  the page can take the one lancet window a later band was using, which then
  falls back to a frame or a row. There is never more than one window and
  never more than two grounds per page, and a ground never sits directly
  after a photo hero. If a page's photo layout looks different after an
  unrelated image edit, this budget is why. Grounds also take an opt-in
  "wide" flow inside `rich-shape.ts` (labelled rows whose label keeps its own
  editable block; the two-column short run went on 2026-09-24): only
  ImageText passes that option, so `RichTextSection`'s 29 bands cannot be
  affected by it.
- Both classifiers run on `splitStega(...).cleaned` text, never on the raw
  stega-encoded string, so the preview takes the same branch as the live
  site. See "Live draft preview" in `docs/agent/preview.md`.

**Contact page pieces:**

- `CopyEmailButton.tsx` -- mailto link + clipboard fallback.

**Site-wide affordances:**

- `StickyCTAChip.tsx` -- bottom-floating brand pill that appears past 50% scroll on long pages. Simple threshold-based visibility with a 2% hysteresis band. Positioning: always `bottom-[5.5rem]` (above the BackToTop button at `bottom-6`). Labels are Sanity-editable via the page singleton's `stickyCtaLabel` field; empty string hides the chip.
- `SectionDivider.astro` -- brand ornament between sections that share a background color (variants: `ornament` (default) / `line` / `dots`).
- `JournalPortableText.tsx` -- journal body renderer with custom block types (pullQuote, beforeAfter, sourceCard, tipCallout, imageGallery, divider, videoEmbed) + a `sourcedFrom` annotation mark for inline vendor mentions. Adds the `.prose-drop-cap` float cap to the first paragraph and renders blockquotes as `.prose-blockquote`.
- `FaqAccordion.tsx` -- shadcn Accordion wrapper. **Note:** `src/components/ui/accordion.tsx` is customized -- the original `h-(--radix-accordion-content-height)` lock on the inner content div was removed (caused a big empty-space bug after expand), and the trigger no longer carries `text-sm font-medium` so consumer typography wins the cascade. If you reinstall via `npx shadcn add` it will revert; reapply both changes.
- `ThemeToggle.tsx`, `BackToTop.tsx`, `SanityImage.astro`, `CtaLink.astro`.

**Sanity Studio components (in `src/sanity/components/`):**

- `StudioGuide.tsx` -- Panel 1 of the "Start Here" handbook. Fetches content from the `studioGuide` singleton and renders the guide title, intro, site map, how-tos, and tips. Editor-driven: update the handbook text directly in Studio without a code change.
- `BusinessOverview.tsx` -- Panel 2. Fetches live business facts from Sanity via `useClient` plus the three static sections from the `studioNotes` singleton (business summary, ideal client, voice summary + words to avoid).
- `BrandKit.tsx` -- Panel 3. Displays the brand color palette (hex values) and font names. **Hardcoded on purpose:** colors and fonts mirror the real `globals.css` tokens. Putting them in Sanity would create a second source of truth that can drift from the live site.

These panels are wired in `src/sanity/structure.ts` under a "Start Here" parent list item, below the repo-data **Help & Guide** handbook (PORTS.md card 41). The `studioGuide` and `studioNotes` singletons each have two views: a rendered component view and an Edit form view. All use plain text fields throughout (no Portable Text) to avoid a Studio renderer dependency, and all are excluded from Canvas.

The desktop nav dropdowns live directly in `Header.astro` as SSR'd `<details>` (see `docs/agent/page-architecture.md`), not as a React island.

### Church identity (the Who We Are "alive" pass, 2026-09-23)

Ported from the prototype at `docs/superpowers/prototypes/2026-09-23-who-we-are/c-alive.html`. Every colour on these components is an identity token in globals.css `@theme` and `.dark` (`--color-band-indigo`, `-deep`, `-gold`, `-brown`, `-taupe`, `-ink`, `--color-gold-hover`, `--color-brown-ink`), each holding a value from the church's brand palette (the owner's ruling, 2026-09-23: no off-brand greens, mint, violet, red or purple), and every ink-on-ground pair is measured in both themes by `theme-tokens.test.ts` (`IDENTITY_PAIRS`, `THEMED_IDENTITY_PAIRS`). Geometry, masks and motion live in the `/* Church identity (2026-09-23) */` block of globals.css. No block carries a colour field (rule 9): colour comes from the block's type or the goal's position. Site owner decisions that bind all of them: no visible photo captions anywhere, and buttons are square with a gold rule (no arched head).

**Primitives (`src/components/church/`):**

- `ArchFrame.astro` -- a photograph inside one of the building's two arches, `shape="lancet"` (the tall pointed window, 2:3) or `shape="door"` (the four-centred Adams Street door, 10:13). The arch is a CSS mask, so any `--arch-ratio` keeps the same arch; a thin SVG mould is drawn just outside it in `--arch-mould`. `reveal` puts it on the `[data-reveal]` observer (`arch` variant), `grade="warm"` applies the shared photo grade, and the crop follows the editor's hotspot, else the top of the photo.
- `BuildingGlyph.astro` -- the four goal drawings from the building: `window` (Worship), `door` (The Way), `rose` (Witness), `basin` (Work). Line art in currentColor at a constant 2px stroke, always decorative.
- `WatchwordMark.astro` -- the "Praise & PROCLAIM" mark with the megaphone rays, `size="band"` or `size="hero"`. Fixed colours (it only ever sits on the indigo-dark Watchword band: white "Praise", gold ampersand, PROCLAIM and rays); one image to a screen reader ("Praise and Proclaim").
- `CtaLink.astro` `variant="rule"` -- since 2026-09-23 an ALIAS for `gold`, the header's GIVE plate with the inset double rule (Nathan's ruling: one button family, rule 17). The square button with a bar and rays (`.btn-rule`) is gone. `onGold` (the Home give band) draws the outline plate in band-ink on the gold ground.

**Sections (schemas in `src/sanity/schemaTypes/churchSections.ts`, all scaffold capability `church`):**

- `Hero.astro` `layout: 'window'` -- a brand indigo band, the eyebrow as a small gold label, the headline as a modest Castoro italic sentence (`clamp(36px, 3.5vw, 54px)`) with the script-accent word in gold, and the first three frames as a triple lancet (middle largest, `frames[0]`). The lights are `1fr 2.4fr 1fr`, the middle at 100/140 (wide enough to keep both faces of a two-person photograph) and the sides at 100/260; the window takes 7/12 of the grid from 901px and 8/12 from 1200px, so the middle arch's top sits roughly level with the top of the words (measured 2026-09-23 at 1024 to 1920). Two frames draw two lancets, one draws one, none draws the words alone. `SectionRenderer` passes `dropInto` only when the next block is a `watchwordSection`; then the lancets hang over the band's bottom edge into the Watchword band. The header does not overlay it (`heroOverlay.ts`): the band is a colour, not a picture.
- `sections/WatchwordBand.astro` (`watchwordSection`) -- "Our Watchword", the mark at poster size, the verse with "praise" and "proclaim" picked out in gold italic through `highlightWords()` (`src/lib/highlight-words.ts`, unit-tested: matches on the stega-cleaned text, slices the raw string, so click-to-edit survives), the reference, a short introduction beside the two meanings, and the long text behind a native `<details>` "Read more". Indigo-dark (`--color-band-deep`) by type.
- `sections/GoalsBand.astro` (`goalsSection`, of `goal` objects) -- a heading and introduction, a colour-coded index of anchor links, then one `<article>` per goal in its own colour and composition, chosen by POSITION through `goalLayout()` in `src/lib/goal-layout.ts` (unit-tested): NAVE (indigo, first photo full bleed, later photos as rising lancets), PATH (gold, one door step per point on a dotted trail), RINGS (brown, lancets in an arc, one ring set per point), DOORS (taupe with indigo-dark ink, one door per point). A goal that cannot fill its composition falls back to the nave in its own colour. The glyph is the editor's `glyph` radio (in `NON_STEGA_FIELDS`), with the position's drawing as the fallback. Anchor ids are `slugify(name)`, deduplicated within the block only.
- `sections/PledgeReading.astro` (`pledgeSection`) -- the pledge set as a responsive reading: heading, introduction and a door-arch photo on the left; on the right the instruction as a rubric, the opening line large, then each line with "All" in the left margin and its scripture in the right (dropping under the line at 620px and below). A clause after a line's last comma or colon sets as an indented italic turn, split on the cleaned text. At 901px and up the door stretches so both columns end together. Soft paper ground (`bg-muted`), follows the theme.
- `sections/PastorsLetter.astro` (`letterSection`) -- the portrait in a tall lancet, sticky at 901px and up, beside a sheet with a letterhead (church name and street from Site settings), the heading, the letter at a 62 to 68ch measure with a drop cap on the first paragraph only, and the signature in turned Castoro italic over a gold underline that draws in on reveal. Body rules live in `.lt-body`.
- `sections/LinkCards.astro`, the door form -- when EVERY card has the optional `image` (added to `linkCard` in this pass), the band draws as arched doors on brand indigo: each photo in a door arch (decorative, `alt=""`; the title names the link), the title, sentence and a rule button on a paper panel. `cardsPictured()` in `src/lib/spare-images.ts` is the test, and it also keeps such a band out of the spare-image hand-out. One card without a photo and the band is the ruled row again. The heading is the band grammar (`H2_DISPLAY`, 52px at 1440).
- `sections/LinkCards.astro`, the goals form (2026-09-23, Home) -- when every pictured card ALSO carries a `glyph` (`window`, `door`, `rose`, `basin`; in `NON_STEGA_FIELDS`), the doors are the four goals: the band drops to indigo-dark (`bg-band-deep`), the paper panel goes, and each door's building glyph, title and body sit straight on the dark ground in gold and paper, the link a text link. Home's "Our Goals" uses it, each card linking to its goal's anchor on /who-we-are.
- `sections/HeritageBand.astro` (`heritageBandSection`) with `dates` -- **Our Building** (2026-09-23, Home). A band whose `dates` survive `heritageDates()` (`src/lib/heritage-dates.ts`, unit-tested) draws on a FIXED cream ground in both themes: the first and last years large above the heading (`heritageBookends`, the outer four-digit years of a range), the band's `image` multiplied straight onto the paper (`.ob-drawing`, suited to the Hannaford rendering), the `archive` photograph in a door arch (an editor's crop is honoured), and the dated list as one subgrid whose year column grows to its widest cell (`fit-content`), ending in a `now` entry whose year is the BUILD year (rule 15), under a gold rule. A dated band lends nothing to the spare-image pool. Without dates the band is the brown strip band, unchanged (/visit's building band). Both forms set the heading in the band grammar.
- `sections/HeritageOpener.astro` -- **the heritage band as a page opener** (2026-09-24, History). HeritageBand hands over here when the band has no dates and carries the page's h1 (SectionRenderer's `openingLevel`: first block, no hero; today /history only). The church's brown in both themes (`bg-band-brown`, gated inks only); the span "1859 to <build year>" set large in gold over the h1, both years derived (`src/lib/heritage-opener.ts`, unit-tested: the first four-digit year of the first timeline row's marker, handed down as `years[0]`, and the UTC build year; no timeline, no span); the h1 sized by length (`headlineScale`); the block's `image` in a door arch widened to 100/80 for an old group photograph, and `archive` in a lancet hung over the door's lower-left corner. No strip, no numeral row, no captions. Its only CSS is the pair's placement, in the component's own `<style>`.
- `sections/DynamicList.astro`, journal source -- **the Church Blog rows** (2026-09-23, Home). A fixed taupe band in both themes: the heading and "All posts" (gold plate) on one line, then one `<ol>` row per post: the date (`rowDate()` / `rowDateTime()` in `blog-derive.ts`, both on the church's calendar day through `localDay()`, as the register and the post page; sermon previews keep "week of", which since 2026-09-24 also reads the church day), the cover in a small lancet (or the indigo `window` glyph arch when there is none, `ArchFrame glyph`), the title with a stretched link so the whole row clicks, the excerpt (hidden on a phone), and author and category as text. `rowAlt()` drops a cover alt that only repeats the title. Other sources keep the generic grid. Since the journal identity pass (2026-09-24) the row is `src/components/blog/PostRow.astro` (tone `taupe`, markup unchanged), shared with the journal.
- `blog/PostRow.astro` (scaffold `journal`) -- **the one journal row** (2026-09-24). Date, the post's featured image in a small lancet (a `window` glyph arch when there is none; never an author portrait, never a caption), title with a stretched link, excerpt, and a byline plus meta on the right. Tone `taupe` (the fixed band: home's Church Blog, /blog's Worth coming back for, a post's More from this series) or `paper` (the register on /blog and the archives, in the themed brand inks). Each tone's class strings are literal so Tailwind finds them.
- **The journal lists** (`src/components/blog/`, identity pass 2026-09-24). `Opener` is the indigo band (cream h1 sized by `headlineScale`, gold eyebrow, taupe lede); on /blog the `Door` beside it shows this Sunday's preview or the latest post with its featured image in a door arch. `Worth` is the taupe band with PostRows. `Register` groups PostRows (paper) under gold-ruled years in the display face; `Filters` (moved under the All posts heading on /blog), `Pager` and `ThinState` (now ending on the gold All posts plate) are in brand inks.
- `sections/GiveBand.astro` (`giveBandSection`) -- **gold wherever it is an h2, in both themes** (2026-09-23): the basin glyph in band-indigo, the heading in the band grammar, the body in band-ink, and the button as `CtaLink variant="outline" onGold`. The window texture, the indigo/paper switch and `SectionRenderer`'s `isDarkBand` walk are gone. **As the /give h1 opener it is indigo** (2026-09-24, the utility identity pass): the page opener grammar (brand indigo band, `SectionHeading tone="band" wide` with the band-opening headline scale, the paper lede, the gold plate `onDark`) with the basin drawn large in gold at the right, so /give no longer opens and closes on two gold bands now that the closing CtaBand is gold. The opener's CSS is an `is:global` `<style>` block with `go-` classes, so the h2 path's markup carries no scoping attribute and Home renders byte-identical.

**The utility identity pass (2026-09-24, `feat/utility-identity`).** /give, /contact, /404 and /privacy:

- `sections/Hours.astro` (`hoursSection`) -- **the office door**. A fixed brand taupe band in both themes (no cadence surface; the Church Blog's gated inks): the Tudor door glyph over the band-grammar h2 (fitted with `headingFit`), and each group of hours (Church office; Pastors, by appointment) as ruled rows, the days in indigo Castoro and the times larger in old-style figures. The split is derived from the line the office typed in Site settings by `hoursLines()` (`src/lib/office-hours.ts`, unit-tested, stega-safe: the colon found in the cleaned text, the payload put back on the days); a line with no `days: times` shape, or one carrying a mark, prints whole as an italic note. The address row is gone (the street printed three times on /contact). CSS in the component's own `<style>`.
- `src/pages/404.astro` -- the apology on the indigo band ("404" as the window hero's gold titling label, the h1 sized by `headlineScale`, the italic paper lede, the door glyph large in gold), then **four doors** in a ruled row on the page surface, each a whole-link door with a building glyph by position (door, window, rose, basin) over its name in the titling face. The doors are the `notFoundPage` singleton's four label/destination pairs (`fourthCtaLabel` / `fourthCtaHref` added, optional), each falling back in code to Visit, Who We Are, Blog and Give. No photograph (the tower is the home hero's and history's).
- `src/pages/privacy.astro` -- the same indigo opener with the window glyph and the last-updated date in paper, then the policy as one readable column (`PROSE_MEASURE`, Castoro roman sub-heads). The no-singleton fallback is this church's policy (it was the starter client's contact-form and newsletter copy, CLAUDE.md rule 11).

**The Visit identity pass (2026-09-24, `feat/visit-identity`; prototype `docs/superpowers/prototypes/2026-09-23-visit/visit.html`).** Shared looks every page using these components inherits:

- `Hero.astro` -- the `split` and text-only heroes moved onto the indigo brand band (words left in the window hero's grammar, the first photo right in ONE frame: a door arch for people, a gold-hairline rectangle for the building, read from the alt text by `src/lib/photo-subject.ts`). The window hero gained the facts (`HeroFacts.astro`: taupe label over value, a gold hairline between, a clock time set as the gold titling numeral) and `heroSection.headingAccent`: accent words that END the headline close it on their own line in the gold capitals ("What to Expect / ON SUNDAY"). `dropInto` now also fires when a Timeline follows. The full home hero is unchanged.
- `sections/Timeline.astro` -- **the door-step path**. Every row a numbered step: its optional `image` in a door arch (a rectangle for a building), the number on the sill, a dotted trail to the next; a staircase only for a short path (2 to 5 steps) with pictures, a straight numbered line otherwise (History's seven eras, Ministries' Sunday). All derived in `src/lib/morning-path.ts` (unit-tested): an empty marker draws no time; the step at Site settings' service time is drawn largest; on a timed path a word-marker row after the last time ("First Sundays") lands after the path as a closing note with the basin glyph; a note "Place (Room)" becomes a place and a gold-ruled room tag; bullet lines "Class (Room): description" become a ruled class list.
- `sections/FaqBand.astro` -- the deep indigo band (`--color-band-deep`), rose glyph over a sticky gold heading (a heading over 18 characters steps down a size), questions between gold hairlines, a quatrefoil that fills when open.
- `sections/ImageText.astro` -- people photos in arches: a row in a door (a wide door for landscape), a portrait in a lancet (the tower `Lancet.astro` stays for a portrait of a place); buildings stay rectangles; plate, legend and ground untouched. The optional `detail` photo sits in a small lancet over the main photo's corner (a portrait carrying one takes the door so the arches differ). A body whose every h3/h4 names a room in brackets draws as a room board (`roomBoard()`). h2 on `H2_DISPLAY`, button the gold plate. `photo-shape.ts` now never makes a people photo a ground, so the ground budget counts places only.
- `FinalCta.astro` (`ctaBandSection`) -- the gold band in both themes: the door glyph, the heading in the band grammar, the outline plate and a text link in band ink (`CtaLink onGold` now covers the link). A band with a background photo keeps the indigo scrim panel.
- `sections/SundayTimes.astro` -- a band WITH doors draws **Doors, parking and access**: the first word item as the Find us block beside the door glyph (with the directions link), the doors with their own paragraphs (`textParagraphs()`) and a gold "Wheelchair accessible" tag read from the door's words (`doorTag()`), and every other item and note as a titled note beside the photo (a rectangle for a building). Without doors (Home, Contact) it is the hymn board, unchanged.
- `sections/HeritageBand.astro` -- an undated h2 band is **Our building** on fixed cream: the year its own body names set large (`bandYear()`, skipped when the heading says it), the heading in the band grammar, the body as a lede, the gold plate, the photo a rectangle (an arch for people). The /history h1 opener is `HeritageOpener.astro` (above).
- `sections/RichTextSection.astro` -- the band heading on `H2_DISPLAY` (rule 17); the body look is the Beliefs pass's.

- `sections/GalleryGrid.astro` (`gallerySection`, a core block) -- **two forms, chosen by the photos** (2026-09-24, Wedding; `galleryForm()` in `src/lib/gallery-form.ts`, unit-tested, stega-safe). When EVERY photo has a caption (retitled "Name (optional)" in the Studio; same field), the captions are the names of places and the gallery is **the rooms**: a row of door arches on indigo-dark (`bg-band-deep`), up to five across (three from 1120px, two from 620px), each name under its door in gold Castoro Titling, the heading in the band grammar in gold. Otherwise it is **the arcade**: pointed lancets on the cadence surface, every other one a step lower, no text under them (a stray caption stays in the data, unshown), `columns` still sets how many across and a phone shows two (`layout-variants.ts` gallerySection base is now `grid-cols-2`).
- `sections/DocumentList.astro` (`documentListSection`) -- **on the indigo band** (2026-09-24, Wedding). One to four documents are **door cards** (`documentForm()` in `src/lib/document-doors.ts`, unit-tested): each a cream door (the Adams Street door's head over a panel of the fixed cream, so the same in both themes) with the year in Titling if it has one, the title, the note and the gold plate saying what it does (`docAction()`: "Download PDF" from the file's own extension, "Open on churchcenter.com" from the link's own host, no button and no link for a document with neither). Five or more are **the register**: year groups (`groupDocsByYear()`) under gold Titling years, each group's titles in a run of columns in paper, notes in taupe (both pairs gated). The heading is the band grammar in gold; an eyebrow, if set, is the small gold label. Used on /wedding, /beliefs, /history and the blog's publications (the register).
- `sections/QuoteBlock.astro` (`quoteSection`) -- **the gold band** (2026-09-24, Wedding): the words in Castoro italic and the name in the UI face, both band-ink on band-gold, gold in both themes, as a `<figure>` and `<figcaption>`. Over forty words (measured on the cleaned text) the type steps down one size. Used on /wedding and /history.

- `sections/MinistryGoals.astro` (`ministryGoalsIndex`, DERIVED, no schema type) -- **the four goals on /ministries** (2026-09-24, Ministries). `resolveMinistryBands()` in `src/lib/ministry-band.ts` puts it in front of a page's first Ministry band when any ministry document names its optional `goal` (`src/lib/ministry-goals.ts`, unit-tested: `goalIndex()`, `goalFor()`, `GOALS`). "Our Goals" in the band grammar on `bg-band-deep`, then the four goals in the church's order, each a gold building glyph and name linking to `/who-we-are#<goal>`, the church's bracketed word in italic, and the ministries that serve it (each band's small line, or the ministry's name) linked to their anchors. A goal with none stands with nothing under it. No `_key`, so the preview gives it no section controls. CSS in its own `<style>` (rule 20). The Ministry band itself still resolves to ImageText or RichText exactly as before.
- `sections/StaffGrid.astro` (`staffGridSection`) -- **the staff as lancet bands** (2026-09-24, Staff). Each person in a 2:3 `ArchFrame` lancet (warm grade; the indigo `window` glyph arch when there is no portrait), the name in Castoro, the role, the email as a mailto that may break only after the `@`, and the bio behind a native `<details>` "Read more" / "Read less" (an anchored person's bio opens with the jump, so the five `/staff#<slug>` redirects still land on an open card). The heading is the band grammar (`H2_DISPLAY`, a step smaller when a word runs to eleven capitals, `headingIsLong()`), with the optional `intro` (added 2026-09-24: the church's own paragraphs about the people) beside it. The GROUND is derived from the group by `staffBandLook()` in `src/lib/staff-band.ts` (unit-tested): pastors gold, coordination brown, support taupe, "Everyone" the page's paper; three people or fewer draw large in one row (a list, lancet beside the words, on a phone), more draw four to a row. SELF_CONTAINED in `sectionCadence.ts` since this pass. Used on /staff (three bands) and /ministries (the coordination band).
- `sections/ScriptureBand.astro` (`scriptureBandSection`) -- **the Watchword's verse treatment** (2026-09-24, Staff): indigo-dark ground, the verse at the Watchword's size (`.ww-verse` and `.sb-verse` share one rule), in curly quotes with the opening one hung in the margin when the band has a `reference` (a band with none, Beliefs' common statement, is set plain), the `accentWord` in gold italic at EVERY whole-word occurrence (`highlightWords()`), the reference in gold beside it, and the optional `heading` (band grammar) and `intro` paragraph added in this pass. The menu-window texture is gone. Used on /staff and /beliefs.
- `sections/TeamGrid.astro` (`teamSection`, not church-scaffolded) -- redrawn in the identity (2026-09-24): lancets in the staff bands' list layout, names in Castoro, roles in sentence case, the band grammar heading on paper. No page uses it today.

**Seeing them without Sanity:** `/styleguide` carries a fixture of every one (the document list twice: doors and the register), and `/styleguide/who-we-are`, `/styleguide/home`, `/styleguide/visit`, `/styleguide/wedding`, `/styleguide/staff`, `/styleguide/give` and `/styleguide/contact` render the whole composed pages from `scripts/data/fixtures/<slug>.json`, which `node scripts/page-fixture.mjs <slug>` builds read-only from `scripts/pages/<slug>.mjs` (the home fixture borrows the live home page's blog rows, and the staff fixture each band's members from the live /staff page, which a fixture cannot query; a listed document's file is projected to `fileUrl` as `queries.ts` does). Both routes are temporary (see `docs/PENDING.md`).

### CtaLink `onDark` prop

`src/components/CtaLink.astro` accepts an `onDark?: boolean` prop. When true:

- **Secondary variant** swaps from `border-primary text-link` (brand accent on light) to `border-white/70 text-white hover:bg-white/10` (cream on dark).
- **Focus ring** offsets against `transparent` instead of `--background` so the ring still reads on photographic surfaces.

Use it on any CTA over a hero image or any dark panel. `Hero.astro` (image variant) and `FinalCta.astro` set it automatically. Do NOT try to override secondary-variant colors via `class="text-bg ..."` -- Tailwind v4 generates utilities alphabetically and `text-link` beats `text-bg` in the cascade. Use the prop instead.

### Mobile-only alignment pattern

Sections that center on mobile but stay left-aligned on desktop use `class="text-center md:text-left"` on the text container, plus `class="justify-center md:justify-start"` on any CTA `<div>` underneath. Apply this where content reads as "floating" on mobile without visual neighbors to anchor it -- heroes, card grids, and form blocks generally stay left-aligned.
