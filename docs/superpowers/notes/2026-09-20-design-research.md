# Why the site reads as generic, and what the best church sites do instead

Written 2026-09-20 after Nathan's verdict on the deployed plan-2c build: "very generic and
plain, not portfolio quality, I wouldn't hand it over." This note is the brief for the
art-direction pass that answers it. It synthesises three research sweeps (raw notes in
`research/`, all evidence read from live source: 71 church sites loaded plus 16 design
essays) and an inventory of the photographs we already hold.

## 1. The diagnosis, from our own screenshots

Home, Visit and Staff were captured at 1280 and 390 on 2026-09-20 and scored against the
ten-point rubric in `research/2026-09-20-generic-ai-design.md` section 4 (0 generic, 2
intentional, 20 max). Home scores **6 of 20**.

| Test | Score | Evidence |
|---|---|---|
| Typeface | 0 | Libre Baskerville + Inter is the starter's default pairing; it would sit unchanged on any of the family's sites |
| Copy swap | 2 | "Praise and proclaim", 1859, 309 East Adams: the copy is this church's |
| Grid break | 0 | Nothing on any page crosses the 1280 container; every photo is a rounded box inside it |
| Radius / padding | 0 | One radius, one band padding, one card height, page-wide |
| Photography | 2 | Every photo is of this building or these people |
| Colour role | 0 | Gold is on every eyebrow, every rule, every card border, the button and the top stripe |
| Eyebrow audit | 0 | Every heading on every page carries one (nine on home, eleven on Visit) |
| Motion | 1 | Single-fire reveal, but identical on every band |
| Silhouette | 0 | Hero, band, band, band, band, dark band, footer |
| Section density | 1 | The building band is dark and the blog is a grid; otherwise uniform weight |

Named tells present on the live site, each documented as a generic marker in the sources:
the gold top-border card (three in a row, twice on home), the eyebrow over every heading,
identical band padding, every image in a rounded box that never touches the viewport edge,
the heavy navy wash flattening the hero photograph, a serif display over an Inter body. None
of these is a bug. Together they are the starter's rhythm showing through the church's
colours, and that is exactly what "generic" means.

What is NOT wrong: structure, copy, content model, Studio, accessibility, performance,
redirects. The art-direction pass changes none of them.

## 2. The photographs we already have

`research/2026-09-20-photo-inventory.json` lists every photograph in `../fbcm-archive/images`
with its pixel size. 118 real photographs (stock and logos excluded), **77 at 2000px or
wider, twelve at 6016x4000**. The live site uses 22. Unused and strong: the nave from the
balcony in three lights, the alpha-and-omega window shot square, the open Bible on a pew,
communion being served, the wooden cross against the glass, a wedding in the nave, the tower
with the red door, the exterior with the flag, the c.1900 congregation on the steps, kids on
the floor, the blessing of backpacks, seventeen staff portraits against the glass.

The Wix site used many of these as full-section backgrounds under a colour wash (Nathan,
2026-09-20). The capture holds server HTML only, so those background assignments are not on
record, but the pool they came from is, and it is more than enough. **Nothing in this pass
waits on new photography.** A photo day would add dusk exteriors and detail crops of the oak
and mouldings; it is an upgrade, not a prerequisite.

## 3. What the best comparable sites do

Five sites are the models, ranked by how closely their situation matches ours.

1. **King's Chapel, Boston** (kings-chapel.org). A historic downtown congregation of about
   our size, a famous building, a real music programme, no cathedral budget. Five nav items
   (Worship, Music, History & Tours, Our Community, About Us). Headline "Deep Connections,
   Diverse Beliefs, Since 1686." Worship times and visiting hours as two equal doors side by
   side. A separately art-directed mobile crop of the building.
2. **Trinity Church Wall Street** (trinitychurchnyc.org). The type and colour SYSTEM, not
   the scale: three type voices (Canela display, Martina Plantijn text, Community Gothic
   furniture), paper `#f7f7f7`, ink `#121212`, one hot accent. Hero is the word "Welcome" over
   three service times. Nav pairs "Visit & History".
3. **Washington National Cathedral** (cathedral.org). The only Gothic limestone client with a
   truly considered site. One 92px moment set solid (`clamp(2.75rem, ..., 5.75rem)`,
   line-height 1), then weight-300 section headings at 42px, 17px/1.71 prose, a light italic
   serif lede class. Palette sampled from its own glass and applied flat. A live "Today With
   the Cathedral" band. Building shot at three distances on one page.
4. **St Bride's Fleet Street** (stbrides.com). Small congregation, big music, Wren church.
   Noe Text. "TODAY AT ST BRIDE'S" with the actual Evensong programme. Nav item "Worship &
   Music".
5. **St Paul's Cathedral London** (stpauls.co.uk). Voice and light. Headline "Our 18th
   century doors are open." Photography explicitly shot at dusk and dawn because limestone is
   grey at noon and gold at six.

The patterns that recur across all 71 sites, sorted by how strongly they separated the
strong sites from the templated ones:

- **One typeface nobody else has.** The correlation between a licensed or distinctive display
  face and "does not look like a template" was close to total. Free faces that came closest:
  EB Garamond (Saint Thomas Fifth Avenue), Sorts Mill Goudy (First Baptist Greenville),
  Crimson Text + Karla (Knox Toronto).
- **Three type voices, not one serif at three sizes**: a display face with character, a
  quiet reading face for long prose (we have 142 posts), a plain or condensed sans for nav and
  metadata.
- **One enormous moment per page, set solid, 80 to 96px on desktop, 44 to 48px on a
  phone**, then a hard drop in both size and weight. Nothing else near that size.
- **An italic serif lede** under the headline, as its own class.
- **Paper, near-black ink, one accent.** Heritage comes from photography and type; the
  chrome is modern. Nobody above rating 3 used beige or brown as chrome, and nobody used the
  accent on every component.
- **The building at three distances**: whole silhouette, the room with people in it, a
  tight detail crop of glass or stone. Full-bleed, never boxed. Detail crops of your own
  objects beat wide interiors, which are mostly empty pews.
- **A live, dated fact where the headline or first band goes**: "Today at ...", "This
  Sunday, September 27, 10:45". It is what makes a building read as inhabited.
- **Say what happens and how long it lasts.** St Martin's: "A beautiful 45-minute service".
  Old South: an adjective pair on every service ("grand & expressive"). Cornerstone: "Spanish
  translation at 11". Specific accommodations beat welcoming adjectives.
- **Location as a landmark, not a postcode**: "across from UofT", "two blocks from the
  courthouse".
- **Hero headline of three or four parallel verb clauses, hard-broken**: "Following Jesus. /
  Loving the city. / Serving the world." Verbs, not nouns; authored line breaks.
- **Four to six nav items**, heritage fused into Visit ("Visit & History", "History &
  Tours"), music a top-level peer of worship where the programme is real.
- **Narrow measure held against wide bands**: a 24rem paragraph under a 72px headline.
- **Motion that is one idea**: the headline fades and rises once. No carousel anywhere in
  the top tier.

## 4. Registers to avoid

- **The megachurch video hero** (Passion City, Elevation, Southland): condensed sans, magnetic
  buttons, a product-styled PLAN YOUR VISIT. It promises a production scale a 150-person
  congregation cannot deliver on Sunday, wastes a limestone Gothic exterior that is stronger
  as a still, and will date.
- **The antiquarian register**: blackletter, parchment, sepia, a scanned engraving. No strong
  historic site does this. The rule the good ones follow: let the building supply the age and
  let the typography and layout be unmistakably of now.
- **The starter register we have**: eyebrow, serif heading, gold rule, paragraph, outline
  button, thirteen times per page.

## 5. The brief for the art-direction pass

Constraints carried forward: the brand colours stay exactly as chosen (they move from being
the chrome to being the accents; the chrome becomes paper and ink). Every schema, every
document and every word of approved copy stays. Live preview, parity harness, tests and
Lighthouse targets stay. No em-dashes in site copy.

What changes, in order of leverage:

1. **Type.** Three voices. A display serif with genuine character (free candidates to trial in
   the prototype: Fraunces, Newsreel, EB Garamond at display sizes; Instrument Serif is
   excluded as a known tell; licensed options if Nathan wants to spend: Canela, Noe Text,
   Bespoke Serif). A separate reading face for post bodies and long pages (EB Garamond or
   Source Serif 4, tested at 17px/1.7). A plain sans for nav, metadata, buttons and times
   (Inter may stay in that role only). One scale: `clamp(2.75rem, ..., 5.75rem)` line-height
   1 for the page's one big moment; weight-300 or 400 section headings around 40px; a light
   italic lede class.
2. **Photography as the layout.** The tower, the nave and the glass go full-bleed with text
   set into them. The hero overlay becomes a directional gradient from a dark edge, not a
   flat wash. Each page gets the building at three distances. Staff portraits become an
   editorial grid on the glass, not cards. Every rounded-box image goes.
3. **Retire the repeated band.** The eyebrow becomes rare. The gold top-border card is
   deleted. Bands vary in density and height: a full-bleed statement, a two-column asymmetric
   text band with the heading in the narrow column, a dark "stone" band, a dense editorial
   grid, a quiet single-column prose measure. Rule 17 still holds: one left edge, one button
   family, one heading system; the variation is in density and scale, not in grammar.
4. **Colour as material.** Navy and brown stop being band fills and become the dark bands'
   ink and the photograph's shadow. Gold is reserved for two jobs: the primary button and fine
   hairlines. Warm paper and near-black ink carry the rest.
5. **The hero job.** A live dated line ("This Sunday, September 27, 10:45 am") where the
   eyebrow was. Headline as three hard-broken clauses. Two doors: worship and the building.
   "About an hour. Hymns, a sermon, coffee after in the fellowship hall." Location as a
   landmark.
6. **Music named, not labelled**, on the ministries page and the service listing.
7. **Co-pastors as one photograph and one shared paragraph** on the home page, not two of
   seventeen cards.

## 6. How the pass runs

1. A static HTML art-direction prototype of the HOME page only, real photos, real copy,
   desktop and mobile, light and dark, built outside the component system so nothing is
   constrained by what exists. Nathan approves or redirects the direction on that one page.
2. The approved prototype becomes the design spec; the components change under the existing
   pages, page by page, with parity used to prove that content is untouched while the render
   changes.
3. Score every page against the rubric before it is called done. Target 16 of 20 or better.

The current site stays live and unchanged throughout; the domain cutover (plan 3) waits until
this pass is done and Nathan is willing to hand it over.
