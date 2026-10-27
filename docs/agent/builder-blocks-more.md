# Six more builder blocks and the church facts reader (starter cards 193, 196, 198)

Added 2026-10-27 in the Auburn rollout (package C). The starter's cards describe the generic
shape; this page says what this site took, how it reads the church's own data, and what it left
out on purpose.

## The blocks

All six are in `src/sanity/schemaTypes/builderSections.ts` (after the card 173 kit), drawn by
`src/components/builder-blocks/` through `BuilderBlock.astro`, styled by
`src/styles/builder-blocks-more.css` (the starter's file, on this site's scale tokens), with the
pure logic in `src/lib/builder-blocks.ts` (`telHref`, `progressState`, `asOfLabel`,
`subscribeLinks`, `feedAddress`, `hubIds`; tested in `builder-blocks.test.ts`). Each has an
anchor field, a fixture on `/styleguide/sections/`, a thumbnail in `public/section-thumbnails/`
and a Playwright test in `tests/builder-blocks.spec.ts`. No colour field (rule 9).

| Block                                   | Type                       | Menu group          | Fills itself from               |
| --------------------------------------- | -------------------------- | ------------------- | ------------------------------- |
| Contact details                         | `contactCardSection`       | Contact and updates | Site settings > Church details  |
| Progress toward a goal                  | `progressSection`          | Events and notices  | nothing (typed goal and so-far) |
| Add our calendar to your phone          | `calendarSubscribeSection` | Contact and updates | the Church Trac calendar        |
| Cards with icons                        | `iconCardsSection`         | Basics              | nothing                         |
| Steps on a path                         | `stepsRailSection`         | Basics              | nothing                         |
| Groups of cards with an index (the hub) | `hubSection`               | Basics              | nothing                         |

- **Contact details.** Phone, email, address (with "Get directions") and office hours, a column
  each. Anything typed on the block wins (a ministry with its own phone); everything left empty
  comes from the church's facts. "Lead with big Call and Email buttons" draws Call on the gold
  plate and Email outlined. The hours column is the office hours AS TYPED (one line each), not
  an "open now" status: see "No structured hours" below.
- **Add our calendar.** With no feed typed it subscribes to the church's Church Trac feed, the
  same one What's On reads (`codeFor()` and `feedUrl()` in `church-calendar-feed.ts`). A typed
  https, webcal or `/` path wins (`/visit/sunday.ics` is the weekly Sunday file). The buttons are
  `CtaLink` outlines, this site's one button family.
- **Cards with icons and Steps on a path** use the starter's 17 neutral line icons
  (`src/lib/block-icons.ts`, `BlockIcon.astro`, `docs/agent/block-icons.md`). This site's own
  glyphs (`belief-glyphs.ts`) are six doctrinal drawings tied to the Beliefs band, too narrow to
  be a general picker.
- **The hub** suits the Ministries page ("Find your place"). It is offered in the menu only; no
  live page was changed.
- `unit` is on `NON_STEGA_FIELDS` (rule 8b); `unit`, `callButtons` and `firstStepCard` are setting
  keys for the page checks; the contact card and the calendar block are self-filling.

## The church facts reader (cards 196 and 198)

The starter's `business-hours.ts`, `business-facts.ts` and `place-line.ts` are copied PORTABLE
with their tests. This site does NOT add the starter's Business info fields: the facts stay the
plain strings on Site settings > Church details that the footer, Visit and the JSON-LD already
read. `src/lib/church-facts.ts` (pure, tested) maps them into the `BusinessFacts` shape and
`src/lib/church-facts-data.ts` reads them once per build:

- the `address` box is split by `parseAddress()` (the JSON-LD's reader), the map point is
  `site.geo`, and the office's own Directions link replaces the built Google Maps search;
- `strict` is passed, as card 198 asks of a church, and the reader ticks the facts itself: they
  are the live site's published facts, so no "To confirm" tag is drawn anywhere.

### No structured hours

The starter's hours are open spells (opens and closes). Nothing here becomes one honestly: the
service time is a start ("Sundays at 10:45 am") with a worded length ("About an hour"), and the
office hours are free text. So `hasHours` is false, there is no "open now" line, and the phone
Sunday bar (card 191) keeps its own line, the service time, instead of `todayBarLine()`. If the
office ever wants "open now", that needs typed hours rows first: a schema change to plan, not a
parse of the existing text.

## Skipped, and why

- **Newsletter sign-up** (`newsletterSection`): the site has no mail backbone (no list route, no
  subscribe endpoint; the Studio's Newsletter signup box is hidden for that reason).
- **Opening hours and Map and directions** (`hoursSection`, `mapSection` from card 196): the
  site's own Hours band (`Hours.astro`, `hoursSection` in its own schema) and the visit map
  (`mapImage`, `directionsUrl`) already cover them.
- **Latest video** (`latestVideoSection`, card 197): the starter's PORTABLE `youtube-feed.ts`
  lives at the same path as this site's own church reader (Last Sunday, the preacher preview), so
  installing it would replace that file; and the channel's newest upload is the Sunday service
  that Home's Last Sunday band already shows. No CSP change was needed.
- **Documents library** (`documentsSection`, card 197): `DocumentList.astro` and the R2 file
  routes already do this.
- **Every main page a page builder** (card 190): Contact is already a builder `page`. Privacy
  was tried with the Blog page's "sections under" zone, but `SectionRenderer`'s imports pull
  about 60 KB of section CSS into the page even with the zone empty, so the page did not render
  byte-identically (`npm run parity compare`: privacy DIFF on its inline CSS). Reverted. The Blog
  index already has its own builder zone (`additionalSections`, the #publications list) and its
  archive is custom; it was not moved.
