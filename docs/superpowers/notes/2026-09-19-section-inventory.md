# Section palette inventory, 2026-09-19

What plan 2 composes pages from, after plan 1 removed six capabilities. Read-only
survey of `src/sanity/schemaTypes/sections.ts`, `richSections.ts`,
`src/components/SectionRenderer.astro`, `src/components/sections/*`, the shared
heading and CTA components, `sectionCadence.ts`, `page.ts`, `homePage.ts` and the
`@theme` block.

## Registered block types: 15, no schema/renderer mismatch

| Block | Images | Notes |
| --- | --- | --- |
| heroSection | yes (background) | self-contained surface |
| richTextSection | no | editor chooses `align` |
| imageTextSection | yes | text-and-picture band; the split lever |
| gallerySection | yes | grid of images |
| quoteSection | no | pull quote |
| statSection | no | self-contained surface |
| ctaBandSection | yes (background) | self-contained surface; closing calls to action |
| videoSection | no (embed) | YouTube etc. |
| spacerSection | no | self-contained |
| logoStripSection | yes | self-contained |
| embedSection | no | self-contained |
| serviceAreaSection | no | starter leftover; reads businessInfo travel fees |
| guaranteeSection | no | starter leftover; reads siteSettings.satisfactionGuarantee |
| teamSection | yes (per member) | self-contained; generic people grid |
| dynamicListSection | yes (card images) | self-contained; sole source is `journal` |

`serviceAreaSection` and `guaranteeSection` are a service-business inheritance and
have no church meaning. Candidates for removal in plan 2 rather than reuse.

## Heading grammar

Eyebrow (small uppercase line) -> heading (serif, sized by `--text-h1..h6`) ->
optional accent word matched verbatim from the heading, rendered via
`splitHeadingAccent()`. `SectionHeading.astro` centralises eyebrow + heading +
accent; blocks pass `align: 'left' | 'center'`. richTextSection lets the editor
choose; the rest default per component. CLAUDE.md rule 17 says pick one per page
and do not vary it band by band.

## Surfaces

`sectionCadence.ts` alternates `background` / `muted` across CONTENT_TYPES only.
SELF_CONTAINED_TYPES (hero, ctaBand, stat, spacer, logoStrip, team, embed,
dynamicList) paint their own surface. Blocks carry no colour field, by rule and by
test.

## Page documents

`page.ts` (custom pages, served at `/[slug]`): title, slug (reserved-slug checked),
pageBuilder over SECTION_TYPES, nav placement, archived flag, full SEO fields,
publishAt. `homePage.ts` uses the richer HOME_SECTION_TYPES (adds teamSection and
dynamicListSection) and still carries hidden/readOnly legacy structured fields
(hero*, meetFounder*, featuredWork*, process*, servicesGrid*, final*) from before
the page builder. Its pageBuilder is the only live editing surface.

## Gaps for eleven church pages

1. No service-times / location / map block, which the Visit page and the home page
   both need above the fold.
2. Nothing purpose-built for staff beyond the generic teamSection: no grouping
   (pastors vs staff vs lay leaders), no bio expansion on the page.
3. No timeline block for a 160-year history.
4. No events block, and by design none is wanted: Church Center is the calendar.
   A single "next Sunday" or "this week" strip, hand-edited, is the most the site
   should carry.
5. No giving block: the Give page needs a short explanation band with one outbound
   button, not a form.
