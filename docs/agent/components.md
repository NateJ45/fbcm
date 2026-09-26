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

- `Header.astro` -- one row (wordmark, seven links, Watch live, Give; the drawer below lg). **Watch live / Live now (2026-09-24):** built saying "Watch live"; BaseLayout's live-service script turns it into "Live now" with the gold dot. The clock decides by default (Sunday, service time + 75 min, church time, `src/lib/live-service.ts`); inside the wider check window (service time -75 to +135 min) the script also asks `GET /api/live-status` (at most once a minute, never outside the window, never blocking), and a fresh answer from YouTube wins: `live` -> "Live now" linking to the live video, `not-live` -> "Watch live", `unknown` / failure / older than 150 s -> the clock. The last answer sits on `window.__liveStatus`, which `MobileNav` reads through `resolveLive()` when the sheet opens. Endpoint design and the key: `docs/agent/deployment.md`, "Live now: the YouTube check". Scrolls away with the page and slides back in over the content on a scroll up once past 150px; see `docs/agent/polish-layer.md`, "Sticky header behavior".
- `Footer.astro` -- one indigo-deep band in both themes, redrawn in the church identity 2026-09-24 (the footer identity pass). Top to bottom: the poster (the closing Sunday band: the live dated line, the time, the street, Give) with the sign-off beside it (the Praise & Proclaim `WatchwordMark` and the bottom line "An American Baptist congregation in downtown Muncie since 1859", the year from `site.founded`), the four goals (`GoalsRow size="footer"`), the editor's link columns as plain unnumbered lists (Pages set in two short columns, Elsewhere) beside Office (hours, phone, email; the street only when the poster did not print it), and the base rail (wordmark home link, auto-year copyright, privacy, the designer credit). **The sign-off moved into the poster on 2026-09-24 (`feat/footer-signoff`)**; until then it was its own band above the rail and the poster's right half was empty indigo. From `lg` the poster is two columns on the link columns' own grid (`2fr 1fr 1fr`, gap `l`, `.footer-poster` in the scoped style), so the watchword's left edge is the Elsewhere column's and its top is level with the time (row 2, under the eyebrow); below `lg` it stacks eyebrow, time, street, Give, then the mark and the line. The mark takes a footer-scoped size (`--mark-a: clamp(40px, 4.2vw, 62px)`, `--mark-b: clamp(24px, 2.6vw, 39px)`) set from `.footer-signoff`, between WatchwordMark's `band` and `hero`, so it sits level with the 10:45 figure rather than over it; `WatchwordMark` keeps its two sizes. With no service time set, the sign-off is the whole poster band. Measured on Home, the footer went from 1,488 to 1,123 px at 1440 (24% shorter), 1,351 to 1,077 at 1024 (20%), and 68 px shorter at 768 and 390, where the stack keeps every line and only the sign-off band's own padding goes. Behind the poster's right side, full bleed to the footer's right edge and resting on the goals rule, the 1927 Hannaford rendering as faint gold line art, framing the watchword: `src/assets/footer-rendering.webp` (952x452, lossless WebP alpha, ~31 KB) used as a CSS mask over a `--color-gold` box at 16% opacity (worst case under a full-alpha line: gold text 5.25:1, paper-white 12.9:1, paper at 80% 7.8:1), `min(100%, 40rem)` wide below `lg` and `min(58%, 56rem)` from it, absolutely positioned and aria-hidden, inking in on the `[data-reveal="ink"]` observer (instant under reduced motion), inside a `content-visibility: auto` box so the mask is not fetched until the footer nears the viewport (no layout shift, no LCP cost). Under Office, the church's accounts elsewhere as round 44px icon buttons (Facebook, Instagram, YouTube; see "Social links" below), each named "First Baptist Church Muncie on Facebook" and so on, behind the footer's "show social buttons" switch.
- `MobileNav.tsx` -- full-screen indigo Sheet (`client:idle`; the closed Sheet server-renders its trigger, so the "Menu" button is in the server HTML). Unnumbered display-face rows, the Sundays and contact foot, the Give button, and the four goals at the bottom (`GoalsRow size="menu"`, slotted in by `Header.astro` as the island's children so the glyphs are drawn by the one Astro component; a delegated click closes the sheet when a goal is followed), then, as the last row, the church's accounts elsewhere: the footer's round icon buttons in a list named "Follow along", from the `social` prop (`{ platform, url, label }[]`, worked out by `Header.astro` from `socialLinksOf()`, absent when empty). The sheet's content box is `shrink-0` since 2026-09-24: SheetContent is a fixed-height flex column, and without it the box shrank to the viewport, so its `pb-8` was lost at the end of the scroll and the Hannaford rendering (pinned to the box's bottom) floated mid-sheet on a short phone.
- **Social links** (2026-09-24, `feat/social-links`). `socialLinksOf(settings)` in `src/lib/social-links.ts` (unit-tested) is the one list the footer, the mobile menu and the Contact page's office door draw: Site settings' `socialLinks` (or, when that is empty, the legacy `socialFacebook` / `socialInstagram`), plus YouTube DERIVED from `youtubeUrl` (the Watch live field) unless a stored entry already points at YouTube, de-duplicated by address (scheme, `www.`, trailing slash and case ignored; `socialUrlKey` builds on church-schema's `urlKey`, which `sameAsOf` keeps using unchanged because `sameAs` lists records whose paths may be case-sensitive), ordered Facebook, Instagram, YouTube, then the rest as stored. Every value is stega-cleaned before it is compared or drawn; `platform` is on NON_STEGA_FIELDS. An entry with no platform is named from its host; an "Other" entry by its label. `socialLinkLabel(link, churchName)` is the icon-only accessible name. `SocialIcon.tsx` is the one platform-to-Tabler-icon map (React, so the island can use it; the Astro callers render it to static SVG). `tests/social.spec.ts` checks all three places, the names, the 44px targets, and axe on the open menu and the office door.
- `church/GoalsRow.astro` -- the four goals as one row of links to their bands on /who-we-are (`#worship`, `#the-way`, `#witness`, `#work`): gold building glyph, display-capital name, and in the footer the small line Who We Are's goal index prints. Data from `src/lib/church-goals.ts`, the one code-side list of the goals (outside the `church` scaffold capability; `ministry-goals.ts` reads its `GOALS` from it).
- `BaseLayout.astro` -- anti-FOUC theme bootstrap, View Transitions (with the shared post title, `src/components/transitions/shared-title.ts`), the smooth-scroll press listener (no Lenis since 2026-09-24), scroll-reveal observer (and the glyph draw's `--k` measure), sticky-header scroll listener.

**Hero + page-top:**

- `Hero.astro` -- image variant (full-bleed photo + gradient overlay) OR text variant (delegates to SectionHeading). Accepts `backgroundImage` for a single Sanity image or `backgroundImages` array for a cross-fading slideshow (falls back to single image for non-home pages). Image variant passes `onDark` to CTAs automatically. On the home page (`size="tall"`) it fills the viewport below the sticky header and shows a soft pulsing scroll cue.
  - **The dated line, and This Sunday's sermon (2026-09-24).** The tall hero replaces its eyebrow with the live dated line (`[data-live-sunday]`, `src/lib/live-sunday.ts`, dated by the visitor's clock before first paint). When the build finds a sermon preview written for the coming Sunday (`sermonForUpcomingSunday` in `src/lib/sunday-sermon.ts`: category, publish date and opening paragraphs, all derived, church calendar), `index.astro` passes it through `SectionRenderer`'s `sermon` prop and the line becomes `THIS SUNDAY, SEPTEMBER 27 · 'WHEN GOD SHOWS UP' · JEREMIAH 29:10-12`, the sermon half a link to the preview with a gold hairline underline (full on hover and focus). The service time comes off the line (the facts row under the words states it). **Length rules** (measured at 320 px: 238 px beside the dash, about 8.3 px per capital): the title loses a trailing parenthesis when over 24 characters, then is cut at a word with an ellipsis; the reading never repeats a title that names it, always shows at 640 px and up, and shows below 640 px only when title and reading fit 28 characters; the sermon half is one inline-block unit that wraps under the date, never through it (`&nbsp;·`, `max-w-full`). The server renders "Sunday, September 27" (true at any moment, and what a no-JS visitor keeps); the inline script says "This Sunday, ..." or "Today", or, once the Sunday the line names is no longer the preview's (a site not rebuilt after Sunday), hides `[data-sunday-sermon]` and puts "· Worship at 10:45 am" back. With no current preview the markup is byte-identical to before. **Since `feat/this-sunday-youtube` (2026-09-24) the sermon has a second source:** the church stopped writing previews in January 2026, so when there is no preview for the coming Sunday the line names the sermon of the broadcast the church has scheduled on YouTube for that Sunday (`upcomingBroadcast()` in `src/lib/youtube-feed.ts`, read from the same build-time feed as the Last Sunday band, which `index.astro` now fetches once for both). The order lives in `src/lib/this-sunday.ts` (`thisSundaySermon`): a preview for that Sunday, else the broadcast (its title and reading through the same `sermonParts` length rules, linking to `https://www.youtube.com/watch?v=<id>` in a new tab, `data-sermon-source="youtube"`), else nothing. The feed marks a scheduled broadcast with nothing explicit (no `yt:liveBroadcastContent`, no scheduled start, no future `<published>`): the entry has `views="0"` and was published midweek, so its Sunday is derived as the first Sunday strictly after its publish day, church time; it must be the coming Sunday, its title must split into sermon and reading, and only one broadcast may claim that Sunday, or there is no sermon. The upgrade script was not changed: its stale check compares the line's Sunday with `data-sermon-sunday`, which a YouTube sermon carries like a preview. **The title is width-aware (`fix/sunday-title-length`, 2026-09-24).** The 24-character cap is a 320 px measurement, so the server renders the title once per width band and CSS shows one (`sermonTitleSpans()` in `live-sunday.ts`, `data-sermon-title` phone / sm / lg; one plain copy when every cap agrees, which is the usual case): below 640 px the 24-character rule, 640 to 1023 px up to 40 characters (the sermon half wraps under the date and must fit 518 px with its reading), 1024 px and up up to 56 (the whole line fits one 864 px row). Measured with the real face at 13 px, 1.82 px tracking: 8.1 px a capital. No script picks the copy, the hidden ones are `display: none` (one title for a screen reader) and `data-pagefind-ignore`. A word quoted inside the title takes double quotes, because the line wraps the title in single ones and in capitals an inner ‘YES’ has the same shape as the apostrophe in GOD’S: ‘HOW TO LET YOUR “YES” BE YES AND YOUR “NO,” NO’ (`curlInnerQuotes()`); a cut never leaves one open. `/styleguide/this-sunday/<youtube|preview|unparseable>` renders the home hero on fixed data for `tests/this-sunday.spec.ts`. `/visit` deliberately does not show the sermon: its hero, timeline and times describe any Sunday, not this one, and a second dated element would need its own stale check; the blog index's door already carries the preview.
  - **This Sunday's preacher, and the service's small line (2026-09-25, `feat/preacher-and-feel`).** The tall photo hero draws a fourth fact after the editor's three, "Preaching / Rev. Jonathan Balmer". The name is derived (`src/lib/preacher.ts`, `thisSundayPreacher`), in the dated line's order: the author of the sermon preview for the coming Sunday (`preacherForUpcomingSunday` in `sunday-sermon.ts`, the name the post page already prints under "Preaching"; the church's own account "FBC Muncie" names nobody), else the "Preaching:" line of the broadcast scheduled for that Sunday (`upcomingPreacher` in `youtube-feed.ts`, any zero-view upload for that Sunday whatever its title, one name only), else nothing and the row is the old three. **The parser** (`preacherOf`, also behind the Last Sunday band's preacher line): a line, or a segment of a line split on `|`, `•` or `·`, labelled "Preacher", "Preaching" or "Speaker" (any case, optional "Guest", a colon or a spaced dash); the first that reads as a person's name wins (3 to 60 characters, at most seven words, no digits, links or brackets, every word after the titles capitalised bar particles such as "van"; titles such as Rev., Dr., Pastor are kept as written; "TBA", "Guest", "Our Pastors" name nobody). **Not on the dated line:** its sermon half is already held to one 320 px line by the length rules, and a name would wrap it; the facts row is where who, when and where already sit. **Four facts are a 2 x 2 grid below 1280 px and one row from 1280 px** (`FACTS_FOUR`; three facts keep the old class string byte for byte): measured, the stacked row put "Preaching" below a 320 x 640 first screen and a flex row left it alone on a second line at 1440. **Stale-safe:** the fact is server-rendered `hidden` with `data-sunday-fact="<its Sunday>"`, and the upgrade script shows it only while `sundayFactKept(now, sunday)` holds (the Sunday the line names is its Sunday), called again from an inline script inside the fact so it is settled before first paint; a page that outlives its Sunday, or a visitor without JavaScript, never sees it (`live-sunday-inline.test.ts` runs the inline copy against the module over three weeks of hours). **The small line under a fact** is a new optional `heroFact.note` (48 characters), drawn under the value in the furniture face at 15 px, held to 22ch so it wraps under the time; `scripts/pages/home.mjs` proposes "Intergenerational, casual dress welcome" for the Sundays fact (the Worship goal's "intergenerational" and the FAQ's "Casual dress is welcome."), awaiting the church's approval and an apply. `HeroFacts.astro` (the window and split heroes) does not draw `note`. `/styleguide/this-sunday/<preacher-preview|no-preacher|feel>` are the fixed states for `tests/this-sunday.spec.ts`.
  - **The headline is sized by its own length** (2026-09-23, `src/lib/headline-scale.ts`, unit-tested). `headlineScale(text, { tall })` reads the stega-cleaned text (characters, words, longest word) and returns `poster`, `title` or `sentence`; `headlineClass(scale, { tall })` is the one class table. **Poster** (interior: at most 16 characters, 3 words, a 10-letter longest word; home/tall: 24, 4, 9) keeps the art-direction look exactly (`text-h1` or `text-display`, titling capitals, 12ch). **Title** (at most 48 characters, 8 words, a 12-letter longest word, 10 on the tall hero) stays in capitals one size down (`--text-title`, or `text-h1` on the tall hero) on an 18ch measure, so it sets in two or three lines. **Sentence** (anything longer) switches to Castoro in sentence case at `text-h2` on a 22ch measure. The longest-word limits are what keep every word whole at 320px: a headline whose longest word is too wide for a scale drops to the next one. The same scale reaches the text-only branch through `SectionHeading`'s `scale` prop, the band-opening h1 of `GiveBand` and `HeritageBand`, and the journal `blog/Opener.astro`. The rendered h1 still carries the raw headline, so click-to-edit works in the preview. Live mapping: poster for /history, /wedding, /contact and the home hero; title for /visit, /beliefs, /ministries, /staff, /give, /blog; sentence for /who-we-are.
- `HeroBackground.astro` -- the hero background layer. Renders a single static `SanityImage` for 0-1 images, or a cross-fading Ken Burns slideshow for 2+. Used only by `Hero.astro`. Since 2026-09-24 each frame honours its Sanity hotspot through `object-position` (`heroObjectPosition` in `src/lib/hero-frames.ts`, mapped through any Sanity crop; no hotspot keeps the centre), and its `sizes` is the width `object-fit: cover` actually draws, `max(100vw, frame height x aspect)`, written as a max-aspect-ratio media condition (`heroSizes`), so a portrait phone fetches a variant wide enough for the covered width while a landscape desktop still reads `100vw`. `Hero.astro` passes `heightFraction` (1 for the tall hero, 0.72 for an interior one).
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
   omitted, never guessed. The Reading links to its book on `/blog/scripture` when the
   scripture index lists the post (2026-09-24), and the date and reading rows carry
   `data-pagefind-meta` for the site search's result rows.
   **Listen** (since `feat/church-links`, 2026-09-24) is the opening block's link to the
   recordings: a Church Center channel link as written, or the filled `{sermons}` token.
   When that address is on YouTube, the preview's own recording is matched in the channel's
   public feed by Sunday and passage (`src/lib/sermon-video.ts`), and the Listen row and the
   body's recording links point at that video; unmatched previews keep the settings address.
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
5. **On paper** (2026-09-24) -- the post prints as a bulletin: masthead and order, a
   photograph cover as a plain rectangle, the body at a print measure, a derived foot line
   (`.p2-print-foot`: site name, address, the post's URL), and none of the screen's chrome.
   The rules are the `@media print` block at the end of the page's own style; the whole list
   is in `polish-layer.md`, "Print stylesheet", and the gate is `tests/print.spec.ts`.

A row's title carries over into the h1 when the row is followed (the shared `post-title`
view transition, `animation.md`); `PostRow.astro`'s heading carries `[data-vt-title]` for it.

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

### Scripture index and site search (2026-09-24, `feat/scripture-search`)

Both belong to the `journal` scaffold capability; every new file is `scaffold-file: journal`.

- **`/blog/scripture`** (`src/pages/blog/scripture.astro`) -- every passage preached in a sermon
  preview, Genesis to Revelation. Nothing is stored: `scriptureRowsOf()` takes each preview's
  `readingOf(opening)` (the same derivation as the post's Reading row) and its derived Sunday;
  `buildScriptureIndex()` in `src/lib/scripture-index.ts` (unit-tested) parses and groups them:
  66 books in canonical order with abbreviations and numbered books ("I Cor.", "1Cor", "Ps",
  "Song of Solomon"), verse ranges, cross-chapter ranges ("John 3:16-4:2"), whole chapters,
  several references in one reading (a post is listed under every book it names). A reading
  that does not parse is never dropped or forced into a book: it goes to "Other readings" as
  written (none today). The page is the register's grammar: the indigo `Opener` with derived
  counts, the blog's browse row (`Filters`, "By passage" current), a book jump list, then each
  testament's h2 and each book as a group under a gold rule (the book where the register hangs
  its year), one ruled row per passage: reference | post | Sunday. Anchors: each book's h3 is
  `bookSlug(name)` (`#1-corinthians`), each passage row its own (`#jeremiah-29-10-12`).
- **`Filters.astro`** ends with a "By passage" link to the index on /blog and every archive.
- **Site search** (Pagefind 1.5.2). `scripts/pagefind-index.mjs` runs after `astro build` inside
  `npm run build` and writes `dist/client/pagefind/`. Pages opt in: BaseLayout's `searchBody`
  puts `data-pagefind-body` on `<main>` (home, builder pages not hidden from search, /privacy)
  with a hidden `data-pagefind-meta="title"` from the page's `<title>`; a post marks its
  `<article>`. Archives, the scripture index, 404, Studio and preview are not indexed. Chrome
  inside a body carries `data-pagefind-ignore` (a post's eyebrow, order label, tags and side
  column; the home page's blog rows). The script skips itself when `src/components/search/` has
  been scaffolded out, and stops with an error if no built page opted in.
- **The dialog** (`src/components/search/search-dialog.ts` + `search-dialog.css`) is built on
  the first open and never before: module, CSS (`?inline`, injected as a `<style>`), Pagefind's
  JS and the index all load then. `trigger.ts` (~0.7 KB, imported by BaseLayout's layout script)
  opens it from any `[data-search-open]` (the header's glass button), the
  `site-search:open` event (the mobile menu's "Search the site", which closes the sheet first;
  the dialog waits for the Radix sheet to unmount), "/" or Ctrl/Cmd+K. A native `<dialog>`
  with `showModal()`: full sheet, the indigo head (gold label, the box in Castoro on a gold
  rule, the paper Close plate), results on paper as register rows (date or "Page" | title and
  excerpt with the match in `<mark>` | reading), 10 at a time with "More results", a foot link
  to the scripture index. Escape always closes (Chromium otherwise spends it clearing a search
  box), arrows move between results, Enter follows the first, focus returns to the opener, and
  the page behind it is locked with `html.ss-open { overflow: hidden }` (released on close and
  on `astro:before-swap`; the lock stopped Lenis too until Lenis was removed on 2026-09-24). Row rules are `src/lib/search-results.ts` (unit-tested); excerpts are
  rebuilt node by node (text and `<mark>` only). Pagefind's own UI files are written by its API
  but nothing links them.

### The passage, Read aloud, Share and Add to calendar (2026-09-24, `feat/scripture-text`)

All `journal` capability except `src/lib/ics.ts`, which is generic on purpose.

- **The passage.** A sermon preview's "The reading" block (the `journalLection` from
  `post-body.ts`) ends in a native `<details class="pp-passage">`: "Read Romans 13:11-14", then
  the passage in Castoro roman with verse numbers as small gold superscripts (`c:v` where a
  passage turns a chapter) and the translation's credit under it. No JavaScript: it opens as a
  plain disclosure, and on paper it prints open (CSS `::details-content` under `@media print`,
  plus the post page's `beforeprint` script for browsers without it; the "Read" line does not
  print). A preview whose reading is only in the masthead (5 of 107) gets a reading block of its
  own at the top of the body. A reading with no text (not fetched, did not parse) renders exactly
  as before. The page attaches the passage after `prepareBody` (which stays pure);
  `JournalPortableText.tsx` `LectionPassageText` draws it.
- **Where the text comes from.** `scripts/fetch-scripture.mjs` runs inside `npm run build`
  (after the share cards, before Astro; `npm run scripture` by hand). It reads the posts from
  Sanity (read only), derives every preview's readings the way the page does (`readingOf` over
  the opening, and `findLection` through `prepareBody`), fetches each chapter once from
  bible.helloao.org (BSB, public domain), at most four requests in flight, and writes
  `src/data/scripture.generated.json` (gitignored), which the post page reads with an eager
  glob. Chapters are cached in `node_modules/.cache/scripture/` (CI and deploy restore it with
  `actions/cache` after `npm ci`). Measured: cold 5.0 s, warm 1.2 s (90 chapters, 106 readings).
  Nothing fails the build: a failed chapter drops its readings with a warning.
- **`src/lib/scripture-text.ts`** (pure, unit-tested): the translation config (`TRANSLATIONS`,
  the one place to switch it), `passageSpans` (ranges, cross-chapter ranges, several references,
  a carried book and chapter, part-verse marks like `12a`, stega-safe), `chaptersOf`,
  `versesOfHelloao`, `versesOfBracketText` (API.Bible and ESV text), `sliceSpans` (null rather
  than a wrong passage), `verseLabels`, and `allocateTranslations`, the NIV cap.
- **The NIV switch.** With `API_BIBLE_KEY` set at build time and the NIV available to that key
  (checked against API.Bible first), the newest readings get the NIV until Biblica's allowance
  is spent: 500 distinct verses, under 25% of any book, and each passage under 25% of the page
  it is on. The rest stay BSB, each with a build warning. NIV text is cached at most 14 days
  (API.Bible's terms), carries Biblica's full notice as its credit, and its FUMS tokens go on the
  `<details>` so `src/scripts/fums.ts` records a view when a reader opens it. The ESV hook is a
  documented comment in `TRANSLATIONS`. Unverified end to end: no key exists yet.
- **The tools row** (`src/components/blog/PostTools.astro`, under the order in the masthead's
  right column): "Read aloud", "Stop", "Share" and, on a preview, "Add to calendar", in the
  furniture face with short gold dividers, 44px targets, hidden in print. Read aloud and Share
  are rendered `hidden`; `src/scripts/post-tools.ts` (1,760 B, 885 B gzip) shows them only where
  they work. Read aloud (`src/scripts/read-aloud.ts`, loaded on the first press) reads the title
  and then the body's blocks one utterance each, prefers a natural English voice, is a toggle
  with `aria-pressed`, and stops on `astro:before-swap`. It is "Read aloud", not "Listen",
  because the order already has a Listen row. Share uses `navigator.share`, else copies the
  canonical link and says "Link copied" in a polite live region.
- **Add to calendar** links to `/post/<slug>/sunday.ics` (`src/pages/post/[slug]/sunday.ics.ts`),
  a static file per preview: the Sunday, the Site settings service time and length (the Church
  JSON-LD's own parsers), the address, in `America/Indiana/Indianapolis` with a VTIMEZONE.
  A static route rather than a data: URL because iOS opens a real `text/calendar` URL in
  Calendar and ignores `download` on a data: URL, and it keeps ~1.6 KB out of every page. The
  link hides itself (client side) once the Sunday has passed on the church's calendar.
- **`src/lib/ics.ts`** is the reusable RFC 5545 writer: 75-octet folding that never splits a
  character, TEXT escaping, CRLF, TZID plus the Indianapolis VTIMEZONE, a caller-supplied
  DTSTAMP (byte-stable builds) and an optional `rrule` for a weekly event.

### Last Sunday, Sunday weather and the Sunday calendar (2026-09-24, `feat/last-sunday`)

Three code-rendered pieces around the Sunday service. None is a page-builder block, none
writes to Sanity, and none adds a schema field.

- **"Last Sunday" on Home** (`src/components/home/LastSunday.astro`). The most recent Sunday
  service recording on the church's YouTube channel: the h2 "Last Sunday" in the church band
  grammar (`H2_DISPLAY` + `headingFit`), the date ("Sunday, September 20", gold furniture), the
  sermon title (h3, Castoro), the reading and series, the preacher, a gold "Watch on YouTube"
  plate, and the thumbnail in a 16:9 door arch with a gold play mark. When the church posted a
  sermon preview for that Sunday (`previewForSunday()` in `src/lib/sunday-sermon.ts`, the
  Sunday is the join), the title and reading are the post's own, the title links to it, and
  an outline "Read the sermon preview" button follows. Fixed indigo ground (it sits between
  the cream Our Building band and the taupe blog band and matches neither).
  - **Data.** Read at BUILD time from the channel's public Atom feed
    (`https://www.youtube.com/feeds/videos.xml?channel_id=UC...`, no key), the channel id
    derived from Site settings by `youtubeChannelId()` (`live-status.ts`). `src/lib/last-sunday.ts`
    fetches (8 s timeout; any failure is null and the band is not drawn, the build carries
    on) and HEADs the 640 px thumbnail. `src/lib/youtube-feed.ts` is the pure half: the
    parser, `splitVideoTitle()` ("Sermon - Reading - Series"), `preacherOf()` (the
    description's "Preaching:" line) and `lastSundayRecording()`: an entry published on a
    Sunday or a Monday, church time (the Sunday is that day or the day before; this channel's
    replays publish just after midnight Monday), with at least one view (next Sunday's
    scheduled broadcast is in the feed days early with none), not in the future, and not
    older than 21 days. Unit-tested against `tests/fixtures/youtube-feed.xml`, a trimmed copy
    of the real feed.
  - **Placement.** `SectionRenderer` takes an `insert` slot and `insertBefore` (block types in
    order of preference, `src/lib/band-insert.ts`); Home passes
    `['dynamicListSection', 'giveBandSection']`, so the band renders before the Church Blog
    rows, or before Give if the blog band is removed, or last. It is outside the cadence, the
    spare-image pool and the heading numbering, so every Sanity band renders as before.
  - **Facade, not embed.** `<picture>` with `i.ytimg.com` webp and jpg `srcset` (320, 480 and,
    when it exists, 640 wide; the 4:3 sizes lose exactly their letterbox in the 16:9 frame),
    `loading="lazy"`, `fetchpriority="low"`. The picture is a second link to the video,
    `tabindex="-1"` and `aria-hidden`, so keyboard and screen-reader users meet one link, the
    button. No iframe, no player script. `data-pagefind-ignore`.
  - **Freshness.** `deploy.yml` rebuilds on a schedule (Sunday 18:00 UTC, Monday 10:00 UTC).
  - **Test seam.** `LAST_SUNDAY_FIXTURE=1` (+ `LAST_SUNDAY_NOW`) makes the home route read the
    committed feed; `=unavailable` gives no feed. Only `playwright.config.ts` sets them.
    `/styleguide/last-sunday` (noindex, out of the sitemap) renders the band from the fixture
    alone, paired, and with the feed unavailable.
- **Sunday weather on Visit** (`src/components/visit/SundayWeather.astro`,
  `src/lib/sunday-weather.ts`). One line under "Find us" in the Doors, parking and access
  band, in gold: "Sunday: 58°, light rain." Fetched by the BROWSER from the National Weather
  Service (`api.weather.gov`, no key, CORS open), once, at idle after load, only from
  Wednesday 00:00 to Sunday 12:00 church time. One call: the church's gridpoint (IND 84,90,
  from `/points/40.1917,-85.3841` on 2026-09-24) is cached in code as `NWS_FORECAST_URL`.
  `sundayPeriod()` picks the daytime period on the coming Sunday (today's "Today" on a Sunday
  morning); `weatherSentence()` writes the line (the first clause before "then", a "Chance"
  forecast with its percentage). `sunday-weather.ts` imports NOTHING, on purpose: importing
  `live-service.ts` made Vite split it into a shared chunk that every page's BaseLayout script
  then fetched (Home 33 to 34 requests, mobile LCP 1,727 to 2,026 ms); a unit test fails on any
  import. Any failure leaves the line `hidden`. It reserves no space and
  is only revealed while its place is off screen, so it cannot shift what a visitor is reading.
  It reaches the band through `SectionRenderer`'s `findus-extra` slot, forwarded into the
  first Sunday-times band with doors (`SundayTimes.astro`'s `findus-after` slot). No rain or
  snow note: Visit's own words never say the circular-drive entrance is covered.
- **"Add Sundays to your calendar"** (`HeroFacts.astro` `calendarHref`, passed by
  `[slug].astro` for `/visit` through `SectionRenderer` and `Hero.astro`). A line with a
  calendar glyph under the hero's facts, beside "Sundays 10:45 am", linking
  `/visit/sunday.ics` (`src/pages/visit/sunday.ics.ts`, prerendered). The file is
  `src/lib/sunday-ics.ts`: one VEVENT, `RRULE:FREQ=WEEKLY;BYDAY=SU`, `DTSTART;TZID=America/
Indiana/Indianapolis` at Site settings' service time on the Sunday on or after the build,
  `DTEND` from the service length ("About an hour" -> 60 minutes), a VTIMEZONE block, the
  address as LOCATION, `GEO` from `site.geo`, a stable UID. The link shows only when the
  service time can be read (`hasSundayEvent()`). `icsEscape`/`icsFold` are named to fold into
  the general `src/lib/ics.ts` from `feat/scripture-text` when both land (PENDING).

### The Visitor (2026-09-24, `feat/the-visitor`)

The church newsletter gets a page of its own at `/visitor`, a band on Home and a place in the
search. No schema changed; the page is two `documentListSection` blocks seeded by
`scripts/pages/visitor.mjs`.

- **What an issue is** (`src/lib/visitor-issues.ts`, unit-tested). A listed document whose
  title is a month's name, with a year and an uploaded file. A list made only of issues is The
  Visitor's (`isIssueList`), and `DocumentList.astro` hands it to `VisitorIssues.astro`; a mixed
  list keeps the rows or register form. The latest issue is the newest one, never a flag, so an
  editor adds an issue (month, year, PDF) and it leads the page. Every editor string is cleaned
  through `splitStega` before it is compared.
- **The page** (`src/components/sections/VisitorIssues.astro`). On indigo: the block heading as
  the page's h1 (only this form takes `openingLevel`; the rows and register forms stay h2,
  because a list appended to /blog sits at index 0 of that page's extra sections), the editor's
  short line above it, the latest cover large, "Latest issue", "The Visitor, September 2026"
  (h2), its own note if any, the gold "Read this issue" plate and "PDF, 29 MB" beside it. On
  paper: "Past issues" and a wall of covers grouped by year, the year at the left from 768 px,
  each cover a link named "The Visitor, June 2026, PDF, 52 MB" with its month under it. Every
  PDF opens inline in the same tab (Sanity serves `Content-Disposition: inline`; no `download`
  attribute). Each issue carries `#issue-YYYY-MM`. The books follow as a second list, two rows.
- **Covers** (`src/components/visitor/IssueCover.astro`). Page 1 of each PDF, drawn at build
  time at 240, 480, 720 and 960 px by `scripts/visitor-covers.mjs` (pdfjs-dist + @napi-rs/canvas
  through `scripts/lib/pdf-pages.mjs`, WebP by sharp) into `public/visitor/covers/` (gitignored),
  keyed by the file's asset id and cached in `node_modules/.cache/visitor/`. Alt text "The
  Visitor, June 2026, cover". A cover the build could not draw is typeset instead (month and
  year on indigo, sized in container units) with the same accessible name.
- **The build step** (`npm run visitor`, inside `npm run build` before Astro). Reads the
  /visitor page from Sanity (published, CDN) and the committed fixture; writes
  `src/data/visitor.generated.json` (which covers exist, where the list lives, the newest issue,
  the two before it and the year in the list's eyebrow)
  and `node_modules/.cache/visitor/records.json` (each issue's text). Never fails the build.
  `VISITOR_FIXTURE=1` (Playwright only) reads the fixture as the page.
- **Home** (`src/components/home/VisitorBand.astro`, enlarged 2026-09-25 in
  `feat/visitor-band`). A full band placed through SectionRenderer's `insert` slot straight
  after Last Sunday, in Last Sunday's split (words in 5/12 at the left, picture in 7/12 at the
  right from 1024 px; on a phone the h2, the picture, then the words, the order Last Sunday
  reads in). Words: the eyebrow "Since 1946 · Quarterly", the h2 "The Visitor" in the shared
  grammar (`H2_DISPLAY` + `headingFit`), the church's own sentence from its publications page
  ("Our church newsletter, filled with features, information about church life, and articles
  from both church members and pastoral staff."), "The September 2026 issue" under a short gold
  rule, the gold "Read the latest issue" plate and a "Past issues" text link. Picture: the
  newest cover in front, the two issues before it fanned behind (3 and 6 degrees from the
  bottom-left corner, the pile keeping 26% of its width free on the right so a turned cover
  never crosses the column: rules 18 and 19), every cover a lazy `<img>`, only the front one
  announced ("The Visitor, September 2026, cover"), and "80 years in print" under the pile.
  The pile is a pointer-only link (`tabindex="-1"`); the button is the keyboard stop. Every
  link goes to `/visitor`, never the PDF (15 to 75 MB). Rule 15, in `src/lib/visitor-band.ts`
  (unit-tested): the year the newsletter began is read by the build step from the /visitor
  issue list's own eyebrow, "Our church newsletter since 1946" (`sinceYear`, the digits after
  "since"), and carried in the manifest as `since`, so it lives in one place, the page; the
  age is the build's year on the church's clock minus it (`ageLine`; the page's build "now",
  `LAST_SUNDAY_NOW` in the test build), so it goes up with the first build each January; the
  intro is a code constant (`VISITOR_INTRO`) because the page carries no intro in the church's
  words, and its edit is listed in `scripts/pages/visitor.mjs` for the approval note. A line
  with no year drops the year and the age rather than guess. The manifest also carries
  `previous` (the two issues after the newest). The ground is derived from the band above
  (`visitorGround`): paper under a dark band, indigo (the colour of /visitor's opener) under a
  light one. On Home that is paper under Last Sunday's indigo, and indigo under Our Building's
  paper when the feed gave no recording; neither matches the taupe blog rows or the gold give
  band below. The dark row types come from rich-ground's table (`bandFamilyOfType`), with the
  heritage band counted as paper because only its /history opener is brown. It renders only
  when the build found a latest issue.
- **Footer.** A page's "Show in the footer" switch (`addToFooter`, in the schema since the
  starter and read by nothing until now) adds it to the first footer column
  (`src/lib/footer-pages.ts`, one query per build via `getFooterPages()`). The Visitor's seed
  sets it, so no Site settings write is needed. Not in the main menu (Nathan, 2026-09-24).
- **Search.** `scripts/pagefind-index.mjs` adds one Pagefind custom record per issue: url = the
  PDF, title "The Visitor, June 2026", date column "Newsletter", third column "PDF, 52 MB"
  (`issueRecord()`). Custom records rather than one page per issue: no extra routes, sitemap
  entries or parity baselines, and the words live in the file the row opens.
- **Before the page exists.** `/styleguide/visitor` renders `scripts/data/fixtures/visitor.json`
  (`node scripts/page-fixture.mjs visitor`) through SectionRenderer; delete both once `/visitor`
  is published.

### The visitor audit on /visit and Home (2026-09-25, `feat/visit-fixes`)

A visitor audit (a family with children of 6 and 10, new to Muncie, on a phone) found four
things. Three are content, composed in `scripts/pages/visit.mjs` from existing block types
(no schema change); one is code.

- **"Let us know you're coming"** is the Visit hero's gold button and the closing gold band's
  button (they replace "Fill in a visitor card"). Both point at Site settings > Church systems >
  connection card, stored as `{connect}`, and open in a new tab (`ctaExternal`). The promise
  is in the hero's lead line ("If you let us know you're coming, a greeter will look out for
  you.") and the closing band's subhead, NEW copy on the approval note.
- **Good to know** is a Text block (`richTextSection`) straight under the hero: four of the
  church's own FAQ questions as h3 heads, each with a short answer, which the Ledger draws as
  four columns (`rich-shape.ts`: two or more h3 groups of prose only, each within
  `columnWords`). Nothing is collapsed. The full FAQ stays further down.
- **Your children** is a Text block straight after the morning path, anchored `#children`:
  /children's own "To create a safe environment" sentence as the lede, then Check-in, Who cares
  for them, Pick-up, and Ages and rooms. Every sentence is read off `faq-entries.json` (the
  Children FAQ, the same answers Ministries prints as "Questions parents ask") and the
  captures, and the module throws if one moves. **Keep each column one paragraph of 40 words
  or fewer.** The Ledger sets a column of 40 words or fewer large and a longer one small, and
  pulls a short last paragraph out as the band's foot line; the first cut mixed both and drew
  two type sizes side by side with a stray foot.
- **No past events on Home's Church Blog rows** (`src/lib/past-events.ts`, unit-tested against
  the church's real 13 FBCM Events posts in `tests/fixtures/fbcm-events.json`). A post filed
  under FBCM Events is dropped from Home's rows once its event is over. The end is the latest
  date written in the title, excerpt or body (a year-less date takes the year no more than 90
  days before publication; a dated year more than a year before publication is history and
  ignored), else 31 January after a year in the title or excerpt, else 180 days after
  publication. The event's own day still shows it; with no publication date the post is kept.
  The journal projection in `queries.ts` carries `"text": pt::text(body)` for it, never
  displayed. `DynamicList.astro` filters before the durable-first split and takes an optional
  `now` (the styleguide passes a fixed day). The next posts in the batch move up; when the batch
  runs out the band shows fewer rows. /blog and the archives are untouched. The build is the
  clock, so a post drops at the next rebuild after its event (`deploy.yml` rebuilds four times a
  week as well as on every publish).
- `/styleguide/visit` rendered the composed page until the apply; it was deleted on 2026-09-25
  and `tests/visit.spec.ts` reads `/visit`.

### Church identity (the Who We Are "alive" pass, 2026-09-23)

Ported from the prototype at `docs/superpowers/prototypes/2026-09-23-who-we-are/c-alive.html`. Every colour on these components is an identity token in globals.css `@theme` and `.dark` (`--color-band-indigo`, `-deep`, `-gold`, `-brown`, `-taupe`, `-ink`, `--color-gold-hover`, `--color-brown-ink`), each holding a value from the church's brand palette (the owner's ruling, 2026-09-23: no off-brand greens, mint, violet, red or purple), and every ink-on-ground pair is measured in both themes by `theme-tokens.test.ts` (`IDENTITY_PAIRS`, `THEMED_IDENTITY_PAIRS`). Geometry, masks and motion live in the `/* Church identity (2026-09-23) */` block of globals.css. No block carries a colour field (rule 9): colour comes from the block's type or the goal's position. Site owner decisions that bind all of them: no visible photo captions anywhere, and buttons are square with a gold rule (no arched head).

**Primitives (`src/components/church/`):**

- `ArchFrame.astro` -- a photograph inside one of the building's two arches, `shape="lancet"` (the tall pointed window, 2:3) or `shape="door"` (the four-centred Adams Street door, 10:13). The arch is a CSS mask, so any `--arch-ratio` keeps the same arch; a thin SVG mould is drawn just outside it in `--arch-mould`. `reveal` puts it on the `[data-reveal]` observer (`arch` variant), `grade="warm"` applies the shared photo grade, and the crop follows the editor's hotspot, else the top of the photo.
- `BuildingGlyph.astro` -- the four goal drawings: `window` (Worship: the two-light lancet window), `door` (The Way: the Tudor door with a paved path narrowing to its threshold, John 14:6), `rose` (Witness: a clay oil lamp, its flame rising from the nozzle tip, resting on a slim lampstand, Matthew 5:14-15; the value is still `rose` because it is stored in Sanity, and the Studio option title reads "Lamp on a stand") and `basin` (Work, Studio title "Basin and towel": one large basin with a towel draped over its front rim, the foot-washing of John 13). The door, lamp and basin were redrawn 2026-09-24 (`feat/goal-glyphs`), each picked from two or three candidates by whether it can be named at 32px without its label; the comparison sheet is kept outside the repo. 3 to 6 strokes each, line art in currentColor at a constant 2px stroke, always decorative. Since 2026-09-24 every stroke has `pathLength="1"` and the svg is `data-reveal="draw"`: it draws itself once when it scrolls into view (`animation.md`, "The glyph draw"). Every drawable child is a direct child of the svg, because the draw staggers by `nth-child`. A dotted stroke would be `.glyph-dots` and fade in instead; none carries one since the redraw dropped the basin's pour.
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
- `blog/PostRow.astro` (scaffold `journal`) -- **the one journal row** (2026-09-24). Date, the post's featured image (never an author portrait, never a caption), title with a stretched link, excerpt, and a byline plus meta on the right. Tone `taupe` (the fixed band: home's Church Blog, a post's More from this series) or `paper` (the register on /blog and the archives, in the brand inks). Each tone's class strings are literal so Tailwind finds them. **`frame`** (2026-09-24, `feat/blog-flat`): `arch` (the default: a small lancet, a `window` glyph arch when there is no image; home and the post page) or `plain` (the register on /blog and every archive: a 9:7 rectangle, as tall as the lancet and about twice as wide, 96 / 136 / 160 px at phone / md / lg, with a hairline border, the site's `rounded`, lazy, a 320w source; the indigo `window` glyph box when there is no image). 9:7 is the covers' own shape (115 of 141 are 940x726 series slides); `coverFit()` in `src/lib/cover-fit.ts` (unit-tested) fills the box only when a cover's shape, after the editor's crop, is within 12% of it, and otherwise shows it whole (`object-contain`) on a quiet brown-ink ground, so a square or 16:9 slide never loses its lettering. The plain frame swaps only the three grid column templates; the tone's other classes are unchanged, so home's rows stay byte-identical.
- **The journal lists** (`src/components/blog/`, identity pass 2026-09-24). `Opener` is the indigo band (cream h1 sized by `headlineScale`, gold eyebrow, taupe lede); on /blog the `Door` beside it shows this Sunday's preview or the latest post with its featured image in a door arch. `Register` groups PostRows (paper, `frame="plain"`) under gold-ruled years in the display face; `Filters` (moved under the All posts heading on /blog), `Pager` and `ThinState` (now ending on the gold All posts plate) are in brand inks.
- `sections/GiveBand.astro` (`giveBandSection`) -- **gold wherever it is an h2, in both themes** (2026-09-23): the basin glyph in band-indigo, the heading in the band grammar, the body in band-ink, and the button as `CtaLink variant="outline" onGold`. The window texture, the indigo/paper switch and `SectionRenderer`'s `isDarkBand` walk are gone. **As the /give h1 opener it is indigo** (2026-09-24, the utility identity pass): the page opener grammar (brand indigo band, `SectionHeading tone="band" wide` with the band-opening headline scale, the paper lede, the gold plate `onDark`) with the basin drawn large in gold at the right, so /give no longer opens and closes on two gold bands now that the closing CtaBand is gold. The opener's CSS is an `is:global` `<style>` block with `go-` classes, so the h2 path's markup carries no scoping attribute and Home renders byte-identical.

**The utility identity pass (2026-09-24, `feat/utility-identity`).** /give, /contact, /404 and /privacy:

- `sections/Hours.astro` (`hoursSection`) -- **the office door**. A fixed brand taupe band in both themes (no cadence surface; the Church Blog's gated inks): the Tudor door glyph over the band-grammar h2 (fitted with `headingFit`), and each group of hours (Church office; Pastors, by appointment) as ruled rows, the days in indigo Castoro and the times larger in old-style figures. The split is derived from the line the office typed in Site settings by `hoursLines()` (`src/lib/office-hours.ts`, unit-tested, stega-safe: the colon found in the cleaned text, the payload put back on the days); a line with no `days: times` shape, or one carrying a mark, prints whole as an italic note. The address row is gone (the street printed three times on /contact). **Follow along** (2026-09-24): the door's last group lists the church's accounts elsewhere (`socialLinksOf()`, see "Social links" above) as one ruled row of icon-and-name links in the days' indigo, 44px targets, an indigo focus outline. It is here, in code, because the hours band is the Contact page's own block (only `scripts/pages/contact.mjs` places an `hoursSection`) and already reads Site settings: no schema field and no page write, and no other page draws it. CSS in the component's own `<style>`.
- `src/pages/404.astro` -- the apology on the indigo band ("404" as the window hero's gold titling label, the h1 sized by `headlineScale`, the italic paper lede, the door glyph large in gold), then **four doors** in a ruled row on the page surface, each a whole-link door with a building glyph by position (door, window, rose, basin) over its name in the titling face. The doors are the `notFoundPage` singleton's four label/destination pairs (`fourthCtaLabel` / `fourthCtaHref` added, optional), each falling back in code to Visit, Who We Are, Blog and Give. No photograph (the tower is the home hero's and history's).
- `src/pages/privacy.astro` -- the same indigo opener with the window glyph and the last-updated date in paper, then the policy as one readable column (`PROSE_MEASURE`, Castoro roman sub-heads). The no-singleton fallback is this church's policy (it was the starter client's contact-form and newsletter copy, CLAUDE.md rule 11).

**The Visit identity pass (2026-09-24, `feat/visit-identity`; prototype `docs/superpowers/prototypes/2026-09-23-visit/visit.html`).** Shared looks every page using these components inherits:

- `Hero.astro` -- the `split` and text-only heroes moved onto the indigo brand band (words left in the window hero's grammar, the first photo right in ONE frame: a door arch for people, a gold-hairline rectangle for the building, read from the alt text by `src/lib/photo-subject.ts`). The window hero gained the facts (`HeroFacts.astro`: taupe label over value, a gold hairline between, a clock time set as the gold titling numeral) and `heroSection.headingAccent`: accent words that END the headline close it on their own line in the gold capitals ("What to Expect / ON SUNDAY"). `dropInto` now also fires when a Timeline follows. The full home hero is unchanged.
- **Hero facts that jump to their band** (2026-09-25, the Ministries hero). A window or split hero fact whose label names a band on the same page links to it: the label slugged equals the band's editor anchor, or equals its small line ignoring case (`heroFactLinks()` in `src/lib/hero-fact-links.ts`, unit-tested, stega-safe; only editor-set anchors count, the first match wins). No link field: SectionRenderer hands Hero the page's rows (`factBands`). When any fact links, `HeroFacts` sets the facts as ruled index rows (`.hf-index`: label in a fixed column beside the value, gold hairlines), the value underlined in gold with a small gold down arrow. /ministries uses it (Children, Youth, Adults to #children, #youth, #adult); a label naming no band (Visit's Sundays, Where, How long) renders exactly as before.
- `sections/Timeline.astro` -- **the door-step path**. Every row a numbered step: its optional `image` in a door arch (a rectangle for a building), the number on the sill, a dotted trail to the next; a staircase only for a short path (2 to 5 steps) with pictures, a straight numbered line otherwise (History's seven eras, Ministries' Sunday). All derived in `src/lib/morning-path.ts` (unit-tested): an empty marker draws no time; the step at Site settings' service time is drawn largest; on a timed path a word-marker row after the last time ("First Sundays") lands after the path as a closing note with the basin glyph; a note "Place (Room)" becomes a place and a gold-ruled room tag; bullet lines "Class (Room): description" become a ruled class list.
- `sections/FaqBand.astro` -- the deep indigo band (`--color-band-deep`), rose glyph over a sticky gold heading (a heading over 18 characters steps down a size), questions between gold hairlines, a quatrefoil that fills when open.
- `sections/ImageText.astro` -- people photos in arches: a row in a door (a wide door for landscape), a portrait in a lancet (the tower `Lancet.astro` stays for a portrait of a place); buildings stay rectangles; plate, legend and ground untouched. The optional `detail` photo sits in a small lancet over the main photo's corner (a portrait carrying one takes the door so the arches differ). A body whose every h3/h4 names a room in brackets draws as a room board (`roomBoard()`). h2 on `H2_DISPLAY`, button the gold plate. `photo-shape.ts` now never makes a people photo a ground, so the ground budget counts places only.
- `FinalCta.astro` (`ctaBandSection`) -- the gold band in both themes: the door glyph, the heading in the band grammar, the outline plate and a text link in band ink (`CtaLink onGold` now covers the link). A band with a background photo keeps the indigo scrim panel.
- `sections/SundayTimes.astro` -- a band WITH doors draws **Doors, parking and access**: the first word item as the Find us block beside the door glyph (with the directions link), the doors with their own paragraphs (`textParagraphs()`) and a gold "Wheelchair accessible" tag read from the door's words (`doorTag()`), and every other item and note as a titled note beside the photo (a rectangle for a building). Without doors (Home, Contact) it is the hymn board, unchanged.
- `church/DoorPlan.astro` -- **"Which door?"** (2026-09-24, the craft-details pass). On the doors path, when the doors' own words place at least two of them (`doorPlan()` in `src/lib/door-plan.ts`, unit-tested, stega-safe: "circular drive", "Jefferson", "wooden"/"front door"/"sanctuary"), a line-art sketch of the church's street side sits between Find us and the list: Adams Street along the top, Jefferson Street down the left, the office wing set back behind the circular drive, the tower, the sanctuary, the parking lot off Adams (drawn when an item mentions parking), a north arrow, and a numbered gold pin on each placed door. Gold line art on the band's brown. **The list is the interface**: each placed door's name is a link to its pin (`#<prefix>-pin-<n>`, with a numbered badge), so with no JavaScript the link jumps to the sketch and `:target` lights the pin, and with no SVG the list is complete. With JavaScript, choosing a door (click, or keyboard focus on its name) lights the pin and prints the door's name and the church's words under the sketch; hovering a pin or a row previews it. The pins are not focusable; the SVG is one `role="img"` whose `<desc>` says where each door is. The halo's motion only under `prefers-reduced-motion: no-preference`. Its CSS is `<style is:inline>` on purpose: bundled, it landed in the chunk every SectionRenderer page inlines (+3,183 B on ~370 pages); inline, it ships only where the sketch is drawn. The geography and its sources are in `door-plan.ts`: a sketch labelled "not to scale", not a floor plan. Tests: `tests/details.spec.ts` (axe on the band, the links resolve, keyboard choice, no-JS).
- `sections/HeritageBand.astro` -- an undated h2 band is **Our building** on fixed cream: the year its own body names set large (`bandYear()`, skipped when the heading says it), the heading in the band grammar, the body as a lede, the gold plate, the photo a rectangle (an arch for people). The /history h1 opener is `HeritageOpener.astro` (above).
- `sections/RichTextSection.astro` -- the band heading on `H2_DISPLAY` (rule 17); the body look is the Beliefs pass's.

- `sections/GalleryGrid.astro` (`gallerySection`, a core block) -- **two forms, chosen by the photos** (2026-09-24, Wedding; `galleryForm()` in `src/lib/gallery-form.ts`, unit-tested, stega-safe). When EVERY photo has a caption (retitled "Name (optional)" in the Studio; same field), the captions are the names of places and the gallery is **the rooms**: a row of door arches on indigo-dark (`bg-band-deep`), up to five across (three from 1120px, two from 620px), each name under its door in gold Castoro Titling, the heading in the band grammar in gold. Otherwise it is **the arcade**: pointed lancets on the cadence surface, every other one a step lower, no text under them (a stray caption stays in the data, unshown), `columns` still sets how many across and a phone shows two (`layout-variants.ts` gallerySection base is now `grid-cols-2`).
- `sections/DocumentList.astro` (`documentListSection`) -- **on the indigo band** (2026-09-24, Wedding; restyled from door cards to a ruled list the same day, `feat/document-list-rows`: Nathan felt the arch cards read repetitive and an arch doesn't suit a document). One to four documents are **a ruled list** (`documentForm()` in `src/lib/document-doors.ts`, unit-tested, now returning `'rows'` rather than `'doors'`): a gold rule above the list and a hairline below each row, each row a three-column grid at desktop (year in Titling gold, an empty cell when there's no year; title in paper with its note beneath in italic taupe; the action at the right, a gold UI-caps text link with a trailing arrow) stacking to year/title/note/link on a phone. The title is plain text; the action link is the one control (`docAction()`: "Download PDF" from the file's own extension, "Open on churchcenter.com" from the link's own host, no link for a document with neither), with the document's title folded into its accessible name since several rows in a list say "Download PDF". Five or more are **the register**: year groups (`groupDocsByYear()`) under gold Titling years, each group's titles in a run of columns in paper, notes in taupe (both pairs gated, shared with the ruled list's own title and note). The heading is the band grammar in gold; an eyebrow, if set, is the small gold label. Used on /wedding, /beliefs, /history and the blog's publications (the register).
- `sections/QuoteBlock.astro` (`quoteSection`) -- **the gold band** (2026-09-24, Wedding): the words in Castoro italic and the name in the UI face, both band-ink on band-gold, gold in both themes, as a `<figure>` and `<figcaption>`. Over forty words (measured on the cleaned text) the type steps down one size. Used on /wedding and /history.

- `sections/MinistryGoals.astro` (`ministryGoalsIndex`, DERIVED, no schema type) -- **the four goals on /ministries** (2026-09-24, Ministries). `resolveMinistryBands()` in `src/lib/ministry-band.ts` puts it in front of a page's first Ministry band when any ministry document names its optional `goal` (`src/lib/ministry-goals.ts`, unit-tested: `goalIndex()`, `goalFor()`, `GOALS`). "Our Goals" in the band grammar on `bg-band-deep`, then the four goals in the church's order, each a gold building glyph and name linking to `/who-we-are#<goal>`, the church's bracketed word in italic, and the ministries that serve it (each band's small line, or the ministry's name) linked to their anchors. A goal with none stands with nothing under it. No `_key`, so the preview gives it no section controls. CSS in its own `<style>` (rule 20). The Ministry band itself still resolves to ImageText or RichText exactly as before.
- `sections/StaffGrid.astro` (`staffGridSection`) -- **the staff as lancet bands** (2026-09-24, Staff). Each person in a 2:3 `ArchFrame` lancet (warm grade; the indigo `window` glyph arch when there is no portrait), the name in Castoro, the role, the email as a mailto that may break only after the `@`, and the bio behind a native `<details>` "Read more" / "Read less" (an anchored person's bio opens with the jump, so the five `/staff#<slug>` redirects still land on an open card). The heading is the band grammar (`H2_DISPLAY`, a step smaller when a word runs to eleven capitals, `headingIsLong()`), with the optional `intro` (added 2026-09-24: the church's own paragraphs about the people) beside it. The GROUND is derived from the group by `staffBandLook()` in `src/lib/staff-band.ts` (unit-tested): pastors gold, coordination brown, support taupe, "Everyone" the page's paper; three people or fewer draw large in one row (a list, lancet beside the words, on a phone), more draw four to a row. SELF_CONTAINED in `sectionCadence.ts` since this pass. Used on /staff (three bands) and /ministries (the coordination band).
- `sections/ScriptureBand.astro` (`scriptureBandSection`) -- **the Watchword's verse treatment** (2026-09-24, Staff): indigo-dark ground, the verse at the Watchword's size (`.ww-verse` and `.sb-verse` share one rule), in curly quotes with the opening one hung in the margin when the band has a `reference` (a band with none, Beliefs' common statement, is set plain), the `accentWord` in gold italic at EVERY whole-word occurrence (`highlightWords()`), the reference in gold beside it, and the optional `heading` (band grammar) and `intro` paragraph added in this pass. The menu-window texture is gone. Used on /staff and /beliefs.
- `sections/TeamGrid.astro` (`teamSection`, not church-scaffolded) -- redrawn in the identity (2026-09-24): lancets in the staff bands' list layout, names in Castoro, roles in sentence case, the band grammar heading on paper. No page uses it today.

**Seeing them without Sanity:** `/styleguide` carries a fixture of every one (the document list twice: doors and the register), and `/styleguide/who-we-are`, `/styleguide/home`, `/styleguide/wedding`, `/styleguide/staff`, `/styleguide/give` and `/styleguide/contact` render the whole composed pages from `scripts/data/fixtures/<slug>.json`, which `node scripts/page-fixture.mjs <slug>` builds read-only from `scripts/pages/<slug>.mjs` (the home fixture borrows the live home page's blog rows, and the staff fixture each band's members from the live /staff page, which a fixture cannot query; a listed document's file is projected to `fileUrl` as `queries.ts` does). Both routes are temporary (see `docs/PENDING.md`).

### Church-system links (2026-09-24, `feat/church-links`)

No component knows about the church's outside systems. A button, a body link or a listed
document holds a link token (`{giving}`, `{connect}`, `{sermons}`...) and the fetch fills it
from Site settings > Church systems before any component sees it
(`src/lib/church-links.ts`, `src/lib/settings-placeholders.ts`), so `CtaLink`,
`DocumentList`'s `docAction()`, the header's Give (`headerCta`, a `navLink` whose
`externalUrl` is `{giving}`) and `GiveBand` (`buttonUrl`, else `givingUrl`) receive a plain
address. An unfilled token arrives as `/contact`. Detail and the token table:
`docs/agent/sanity.md`, "Church systems and link tokens".

### CtaLink `onDark` prop

`src/components/CtaLink.astro` accepts an `onDark?: boolean` prop. When true:

- **Secondary variant** swaps from `border-primary text-link` (brand accent on light) to `border-white/70 text-white hover:bg-white/10` (cream on dark).
- **Focus ring** offsets against `transparent` instead of `--background` so the ring still reads on photographic surfaces.

Use it on any CTA over a hero image or any dark panel. `Hero.astro` (image variant) and `FinalCta.astro` set it automatically. Do NOT try to override secondary-variant colors via `class="text-bg ..."` -- Tailwind v4 generates utilities alphabetically and `text-link` beats `text-bg` in the cascade. Use the prop instead.

### Mobile-only alignment pattern

Sections that center on mobile but stay left-aligned on desktop use `class="text-center md:text-left"` on the text container, plus `class="justify-center md:justify-start"` on any CTA `<div>` underneath. Apply this where content reads as "floating" on mobile without visual neighbors to anchor it -- heroes, card grids, and form blocks generally stay left-aligned.
