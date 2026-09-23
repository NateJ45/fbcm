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
- `Footer.astro` -- a responsive link grid, brand logo, auto-year copyright, and "Site by..." credit on a thin bottom bar.
- `MobileNav.tsx` -- shadcn Sheet drawer (`client:idle`; the closed Sheet server-renders its trigger, so the hamburger is in the server HTML). Primary CTA, tagline, nav links, email + phone + socials + theme toggle, logo at bottom.
- `BaseLayout.astro` -- anti-FOUC theme bootstrap, View Transitions, Lenis init, scroll-reveal observer, sticky-header scroll listener.

**Hero + page-top:**

- `Hero.astro` -- image variant (full-bleed photo + gradient overlay) OR text variant (delegates to SectionHeading). Accepts `backgroundImage` for a single Sanity image or `backgroundImages` array for a cross-fading slideshow (falls back to single image for non-home pages). Image variant passes `onDark` to CTAs automatically. On the home page (`size="tall"`) it fills the viewport below the sticky header and shows a soft pulsing scroll cue.
  - **The headline is sized by its own length** (2026-09-23, `src/lib/headline-scale.ts`, unit-tested). `headlineScale(text, { tall })` reads the stega-cleaned text (characters, words, longest word) and returns `poster`, `title` or `sentence`; `headlineClass(scale, { tall })` is the one class table. **Poster** (interior: at most 16 characters, 3 words, a 10-letter longest word; home/tall: 24, 4, 9) keeps the art-direction look exactly (`text-h1` or `text-display`, titling capitals, 12ch). **Title** (at most 48 characters, 8 words, a 12-letter longest word, 10 on the tall hero) stays in capitals one size down (`--text-title`, or `text-h1` on the tall hero) on an 18ch measure, so it sets in two or three lines. **Sentence** (anything longer) switches to Castoro in sentence case at `text-h2` on a 22ch measure. The longest-word limits are what keep every word whole at 320px: a headline whose longest word is too wide for a scale drops to the next one. The same scale reaches the text-only branch through `SectionHeading`'s `scale` prop, the band-opening h1 of `GiveBand` and `HeritageBand`, and the journal `blog/Opener.astro`. The rendered h1 still carries the raw headline, so click-to-edit works in the preview. Live mapping: poster for /history, /wedding, /contact and the home hero; title for /visit, /beliefs, /ministries, /staff, /give, /blog; sentence for /who-we-are.
- `HeroBackground.astro` -- the hero background layer. Renders a single static `SanityImage` for 0-1 images, or a cross-fading Ken Burns slideshow for 2+. Used only by `Hero.astro`.
- `SectionHeading.astro` -- eyebrow + brand hairline accent + headline + subhead. Used by text-variant Hero and every interior section heading. Supports `tone="inverse"` for dark FinalCta panels. Accepts `scriptAccent?` for the optional calligraphic accent word (see `docs/agent/polish-layer.md`).
- `sections/SundayTimes.astro` -- the Sunday band ("two doors"): the service time at poster scale with the schedule on the left; on the right, a photograph borrowed from the page's spare-image pool, or the map, or an address card, then the band heading and the address row. **The borrowed photograph is placed by its own shape** (2026-09-23): it hangs inside the grid as a framed picture (`.ph-hung`, the gold hairline of ImageText's `frame` shape, with the `.ph-cap` caption and tick), never a `bleed-right` crop. `photoAspect()` from `photo-shape.ts` reads the asset's own dimensions: landscape is the full right column cropped 3:2 (held to 36rem while the doors stack below `lg`), squarish is at most 26rem at 4:5, portrait at most 20rem at 4:5. An editor's hotspot sets the crop point; without one the crop keeps the upper part of the picture. At 1280px the home band's photo is 373px tall against a 581px left door.
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
2. **Cover** -- a real photograph (width >= 2000 and ratio >= 1.3) bleeds full width under the
   masthead (`100cqw`); anything else (the sermon slides) hangs as a plate in the right column.
3. **Body** -- `prepareBody()` in `src/lib/post-body.ts` rewrites the Portable Text first
   (tables from middot lists, points, Q and A, the reading, dead Wix anchors, the cover's
   duplicate), then `JournalPortableText.tsx` renders it in columns 1 to 7 at 62ch. The right
   column is sticky: the plate, then "In this post" from `extractHeadings` when there are 3+.
4. **Foot** -- Tagged (text links), More from this series, then two doors: previews step
   Sunday to Sunday ("The Sunday before" / "The Sunday after", `post-neighbours.ts`), other
   posts Older / Newer. There is no closing CTA band on posts.

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
    words or fewer per group. The groups go side by side.
  - `sections`: at least one h3, when the body did not qualify as columns
    (for example a group with a list or a quote in it, or over 150 words).
    The groups stack; h4 groups inside a section go side by side as h4
    columns (the ministries Adults band).
  - `register`: not a photo ground, 8 or more paragraphs, and at least 80%
    of those paragraphs 35 words or fewer. Split into two columns, read down
    then across (the creed).
  - `ledger`: some list has 3 or more items, and the lists carry at least
    40% of the body's words.
  - `prose`: everything else.

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
  editable block, or two columns for a short run of paragraphs): only
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

### CtaLink `onDark` prop

`src/components/CtaLink.astro` accepts an `onDark?: boolean` prop. When true:

- **Secondary variant** swaps from `border-primary text-link` (brand accent on light) to `border-white/70 text-white hover:bg-white/10` (cream on dark).
- **Focus ring** offsets against `transparent` instead of `--background` so the ring still reads on photographic surfaces.

Use it on any CTA over a hero image or any dark panel. `Hero.astro` (image variant) and `FinalCta.astro` set it automatically. Do NOT try to override secondary-variant colors via `class="text-bg ..."` -- Tailwind v4 generates utilities alphabetically and `text-link` beats `text-bg` in the cascade. Use the prop instead.

### Mobile-only alignment pattern

Sections that center on mobile but stay left-aligned on desktop use `class="text-center md:text-left"` on the text container, plus `class="justify-center md:justify-start"` on any CTA `<div>` underneath. Apply this where content reads as "floating" on mobile without visual neighbors to anchor it -- heroes, card grids, and form blocks generally stay left-aligned.
