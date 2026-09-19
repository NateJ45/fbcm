# FBCM plan 2: the pages, the identity, the Studio

**Date:** 2026-09-19
**Status:** designed; Nathan reviews the built result, not this document (his instruction 2026-09-19)
**Builds on:** `2026-09-18-fbcm-rebuild-design.md` (plan 1, complete and deployed)
**Inputs:** `docs/superpowers/notes/2026-09-19-{photo-survey,church-site-research,section-inventory,content-map}.md`; the two approved mockups at `.superpowers/brainstorm/32187-1789817664/content/home-hero-v2.html` and `visit-v2.html`; `scripts/data/pages/faq-entries.json`
**Basis:** volunteer, unpaid. Nothing here may depend on someone noticing a silent failure.

---

## 1. What plan 2 is for

Plan 1 put every piece of content into Sanity and deployed it on the starter's default
sections. Plan 2 makes it a site: eleven pages with one identity, composed from a page
builder that has been taught what a church needs, edited by a church secretary, and
measured against the best church sites in the country rather than against Wix.

Three decisions taken with Nathan on 2026-09-19 govern everything below.

- **Direction: historic and confident.** Redeemer NYC, Trinity Church, Park Street
  Boston are the register. Serif type, the building and the glass as the imagery, the
  browns as the warmth, long pages that respect a reader.
- **Copy: their voice, edited for the web.** The church's sentences and theology stay.
  Paragraphs shorten, headings appear, repetition goes. New copy is written only where
  none exists and every new sentence is listed for the church in
  `docs/superpowers/notes/copy-for-church-approval.md`.
- **Method: page builder plus purpose-built blocks** (approach C). Every page is a
  Sanity document the secretary owns. When the palette cannot express the design, the
  palette is extended, never bypassed.

## 2. The identity system

### 2.1 Colour: six tokens, roles measured, pairings gated

The logo carries five colours. The dark is an indigo (hue 241), not a navy, and the
Wix footer's "purple" field is that same colour; naming it right keeps anyone from
designing it bluer.

| Token | Value | Role | Proof (contrast) |
| --- | --- | --- | --- |
| `--color-indigo` | `#292854` | Ink. Small elements. | 13.3:1 on cream |
| `--color-indigo-field` | `#353351` | Large dark surfaces: hero band, give band, closing CTA, footer | gold 4.90, white 12.0, taupe 5.34 |
| `--color-gold` | `#D59B29` | Eyebrows on dark, the rule under a heading, the primary button fill, the one accent word on a dark band. Nowhere else. | on indigo 5.60; on indigo-field 4.90 |
| `--color-brown` | `#39251E` | The second dark: History and building bands only | cream 13.9, gold 5.87, taupe 6.39 |
| `--color-brown-mid` | `#724F43` | Eyebrows and heading rules on LIGHT surfaces; secondary button outline | 6.96 on cream |
| `--color-taupe` | `#B5ABA3` | Never text on light (2.18). The warm alternating surface as a 16% tint over cream; muted text on the dark bands; hairlines | 6.11 on indigo |
| `--color-cream` | `#FBFBFA` | Paper | |

Forbidden, and asserted failing in the gate: gold text on cream (2.37), white on gold
(2.46), gold on brown-mid (2.93), taupe text on cream (2.18). `theme-tokens.test.ts`
gains every shipping pair above and keeps the four forbidden ones as negative cases.
`apply-brand` and `brand.config.json` carry all six.

`bg-soft` becomes the taupe tint: `color-mix(in srgb, var(--color-taupe) 16%, var(--color-cream))`,
measured against indigo ink before it ships.

**Dark mode** is first-class, not derived: paper `#1C1B3A`, ink cream, gold unchanged,
`indigo-field` bands become `#2A2950` so they still read as bands, brown bands stay
brown, taupe tint becomes a 10% cream tint over paper. Every page is screenshotted in
both.

### 2.2 Type

Libre Baskerville for headings, pull quotes and the wordmark; Inter for everything
else. Both already installed. Scale: hero 56px/1.05 desktop (40px mobile), h2 36px,
h3 24px, body 18px at a 65-character measure, small 14px. Eyebrows: Inter 11px,
letter-spacing 0.3em, uppercase, 600. Display weight is 400, never 700; the serif
does the work. No script accent anywhere; `--font-script` stays unloaded.

### 2.3 One grammar per page (rule 17)

Left-aligned headings sharing one left edge with every object on the page. Text-and-
picture bands split 7:5, picture right by default, flipped only to break a run of
three. Centred headings only inside `indigo-field` bands. Two buttons: primary
(indigo on gold), secondary (indigo outline; white outline on dark). Every heading
carries the 56×2px gold rule below it. Section vertical rhythm: 96px desktop, 64px
mobile, no exceptions per band.

### 2.4 Photography

Full-bleed only in heroes and dark bands; contained elsewhere with a 2px gold top
rule. Only this church's photographs. The building and the glass carry the historic
register; people carry the warmth. A navy duotone utility exists as a rescue for weak
frames, never as a style. Inventory and ratings: `2026-09-19-photo-survey.md`.

### 2.5 Motion

Scroll-reveal and Lenis stay. The home hero cross-fade is the only other motion, and
it is CSS-only, pauses on hover and focus, exposes a real Pause control, and renders a
static first frame under `prefers-reduced-motion`.

## 3. Navigation and chrome

**Header.** Wordmark left (the tower mark + FIRST BAPTIST / MUNCIE), seven links,
one button: Visit · Who We Are · Beliefs · Ministries · Staff · History · Blog ·
**Give** (gold). Staff earns a top-level slot: it is the second most searched subject
on the site. A utility row above on desktop carries `(765) 284-7749` and Contact.
Mobile: the button stays visible, the rest in the drawer, Contact in the drawer's
foot. Seven plus Give is one over the research's 5–7 and is the honest count for a
church that hides no depth in menus; it is measured at 1280 and 1024 before it ships.

**Footer** reproduces the church's own footer language on `indigo-field`: the mark,
the tagline in gold ("We gather at 309 East Adams Street in Muncie at 10:45 AM every
Sunday."), phone and social marks in white, then three columns: Pages (all eleven plus
Weddings & Building Use, Privacy), Elsewhere (Church Center: calendar and giving;
Church Trac: newsletters and the app; YouTube: every service), Office (hours from
`siteSettings`). Address in cream. Wix's periwinkle is not used anywhere.

## 4. New and changed blocks

Six additions, two removals, two extensions. Each new block is scaffold-marked in its
first commit (rule 14), carries no colour field (rule 9), and any dropdown that drives
rendering is added to `NON_STEGA_FIELDS` in the same commit (rule 8b). Field
descriptions say what to TYPE.

| Block | Surface | Fields | Used on |
| --- | --- | --- | --- |
| `sundayTimesSection` (new) | cream | `heading`, `items[] {label, big, body}` (three columns), `address` from siteSettings, `mapImage`, `directionsUrl`, `doors[] {name, body}` | Home, Visit |
| `timelineSection` (new) | cream/taupe by cadence | `eyebrow`, `heading`, `rows[] {marker, title, body, note}` | Visit (times of the morning), History (years) |
| `staffGridSection` (new) | cream | `eyebrow`, `heading`, `group` (dropdown: pastors / coordination / support / all; NON_STEGA), `showBios` | Staff, Who We Are (pastors only) |
| `faqSection` (new) | `indigo-field` | `eyebrow`, `heading`, `items[] {question, answer (portable text)}` | Visit, Ministries |
| `scriptureBandSection` (new) | `indigo-field` | `verse` (portable text), `reference`, `accentWord` | Who We Are, Beliefs, Home |
| `heritageBandSection` (new) | brown | `eyebrow`, `heading`, `body`, `image`, `cta` | Home (the building), History (opening), Wedding |
| `giveBandSection` (new) | `indigo-field` | `heading`, `body`, `buttonLabel`, `buttonUrl` | Home, Give |
| `documentListSection` (new) | cream | `heading`, `docs[] {title, year, file, note}` | Blog (The Visitor), Wedding, Beliefs |
| `heroSection` (extended) | as today | `+frames[] image (max 6)`, `+layout` (full / split; NON_STEGA), `+facts[] {label, value}` | Home (full, 5 frames), every other page (split, 1 frame) |
| `staffMember` (extended) | | `+group` (pastors / coordination / support; NON_STEGA), `+phone`, `+order` already exists | |
| `serviceAreaSection`, `guaranteeSection` | removed | starter leftovers with no church meaning | |

Why no `eventsSection`: Church Center is the calendar. Why `faqSection` holds inline
items rather than reviving the removed `faq` capability: twelve questions on two
pages do not justify a document type, and inline items are what a secretary expects.

The renderer's cadence: the new self-contained types (`sundayTimes`, `faq`,
`scriptureBand`, `heritageBand`, `giveBand`) join `SELF_CONTAINED_TYPES`;
`timelineSection`, `staffGridSection`, `documentListSection` join `CONTENT_TYPES`
and alternate. `sectionCadence.test.ts` is updated in the same commit.

## 5. The pages

Each page below lists: purpose, source, sequence, images, new copy, SEO. "New copy"
means sentences that did not exist on Wix; all of them go in the church-approval note.
Redirect targets from plan 1 are honoured with the anchors named.

### 5.1 Home `/` (approved mockup: home-hero-v2)

Answers the four visitor questions before any scrolling.

1. **Hero**, `layout: full`, five frames cross-fading: tower → sanctuary → children at
   the arch → congregation (cropped above the lyrics screen) → building corner (cropped
   left 62%). Kicker "A downtown church in Muncie, Indiana". Headline "Praise and
   *proclaim.*" (Isaiah 12:4, their watchword). Sub: their tagline. Facts: Sundays
   10:45 am · 309 East Adams Street · Live on YouTube. Buttons: Plan a visit → /visit;
   Watch online → YouTube streams.
2. **Sunday times band**: 10:45 / Find us / Can't be there, with the map.
3. **Image-text** (sanctuary): "What a first Sunday is like" → /visit.
4. **Three-up** (richText grid): What we believe → /beliefs; How we serve →
   /ministries; Where we've been → /history. Heading "A Baptist church in the heart
   of downtown since 1859."
5. **Heritage band** (brown, tower): "Limestone, oak and glass" → /history#building
   and /wedding.
6. **Dynamic list** (journal, limit 3): the durable posts first, see 5.10.
7. **Give band**.
8. Footer.

New copy: kicker, the three-up blurbs, the heritage blurb, the give-band sentence.
SEO title "First Baptist Church Muncie | Sundays 10:45 am, downtown Muncie";
description from their tagline plus the address.

### 5.2 Visit `/visit` (approved mockup: visit-v2)

1. Hero `split`, children photo right: "Your first Sunday, start to finish." Facts:
   Sundays 10:45 · 309 East Adams · About an hour.
2. **Timeline**: 9:30 / 10:15 / 10:45 / First Sundays, verbatim from What to Expect.
3. **Sunday times band** with the three doors and parking (`#accessibility` anchor
   lands here; the door-opener sentence is kept).
4. **Image-text** (sanctuary left): children by room (`#building` anchor lands on the
   heritage band below).
5. **FAQ band**: the seven What To Expect entries from `faq-entries.json`, verbatim,
   links intact.
6. **Heritage band** (brown): the building, one paragraph, → /history.
7. Closing: Watch live · Fill in a visitor card (form 159198).

Ruling on the room numbers: nursery **104**, family room **105**, because two sources
including the later-authored FAQ say so against one; flagged for the church.
New copy: hero lead only. SEO title "Plan a visit | First Baptist Church Muncie".

### 5.3 Who We Are `/who-we-are`

Purpose: the church-specific "about" that replaced the starter's capability. Source:
1,332 words, theology-dense; progressive disclosure is the design.

1. Hero `split` (congregation photo): "We are a Spirit-led people gathered to join
   Christ's presence in our community." (their line, as the headline).
2. **Scripture band**: Isaiah 12:4 in full, accent word "proclaim".
3. **Watchword** (richText, ~200w edited): why Praise and Proclaim.
4. **Four pillars** as a 4-up grid: Worship · The Way · Witness · Work, each ~60
   words from their text, the rest cut.
5. **Staff grid**, group pastors, with bios: Kendall and Jonathan, then "From our
   pastors": their letter shortened to ~180 words with a link to the full text on
   /staff.
6. **Our pledge** (richText): the four scriptural commitments, plain.
7. **Three-up**: Beliefs · Ministries · Visit.
8. Closing CTA: visitor form.

Fixes: "Global Servants", "growth track" and "deacon" each get one explanatory
clause or are cut. New copy: the four pillar summaries are edits, not new; the three-up
blurbs are new. SEO title "Who we are | First Baptist Church Muncie".

### 5.4 Beliefs `/beliefs`

Source: 3,165 words across three pages, cut to ~2,200 by stating each thing once.

1. Hero `split` (stained glass detail): "One Lord, one faith, one baptism."
2. **Our basic beliefs** (richText, as written, ~550w).
3. **Being Baptist** (`#baptists`): the four values consolidated, Lordship folded into
   Freedom to Serve, the Thomas Helwys story kept; ONE reconciled statement on
   baptism: immersion for believers, any Trinitarian baptism accepted, no re-baptism.
4. **Scripture band**: "In essentials, unity; in non-essentials, liberty; in all
   things, charity."
5. **Historic confessions**: NHCF 1833 and the ABC-USA statement summarised in a
   paragraph each; **document list** links the three PDFs (confession, constitution
   and bylaws, the manifesto).
6. **Our church covenant** (richText, full text, once).
7. **Membership** (`#membership`): full and associate, gendered phrasing edited.
8. **Affiliation**: `logoStripSection` with the ABC-USA and ABC of Indiana and
   Kentucky marks and links.
9. Closing: Questions → /contact.

Also fixes the zero-click problem: title "What we believe | First Baptist Church
Muncie, an American Baptist church" and a description that says what a searcher
asked. SEO is why this page exists in the nav.

### 5.5 Ministries `/ministries`

Source: five pages, 2,397 words. Five anchors from the redirects.

1. Hero `split` (worship team close-up): "Every age has a place here."
2. **Timeline** as the master Sunday schedule across ages: 9:30 · 10:15 · 10:45.
3. `#worship` Image-text (handbells): worship arts, praise team, handbell choir,
   Cynthia Smith and Molly Flodder as contacts.
4. `#children` Image-text (children at the arch) + the room grid + **FAQ band** with
   the five Children FAQ entries verbatim.
5. `#youth` Image-text (youth event): grades 6–12, Large Group 9:30, City Life Club
   Wednesdays, Loraine Garrett.
6. `#adult` Image-text: the two Sunday classes, the five Life Groups as a small
   table, Fresh Brewed Life, Church Friends Lunch, Cheryl Flaherty.
7. `#outreach` Image-text: the church's own line "join Christ where he is already at
   work", the Sewing Group, service trips, Dana Davis.
8. **Get involved**: one directory band listing each coordinator once (from the staff
   documents, derived, not retyped), plus the three newsletters and the app.

Fixes: "Get Involved" appears once, not five times; CCT is spelled out once as
Church Coordination Team; the broken building-use link points at /wedding#building-use;
seasonal events are listed under "through the year" with no dates rather than as if
current. City Life Club's 7:17 pm is kept as written and flagged.
New copy: the hero headline and the five one-line section leads.

### 5.6 Staff `/staff`

Source: 1,375 words plus 16 profiles. Twelve have real portraits in one consistent
stained-glass style; seven have bios.

1. Hero `split` (the 2026 deacons group photo or the co-pastors portrait): "The people
   who serve here."
2. **Staff grid**, group pastors, bios shown: Kendall Ellis, Jonathan Balmer, Cynthia
   Smith. Anchors `#kendall-ellis`, `#jonathan-balmer`, `#cynthia-smith`.
3. **Staff grid**, group coordination: the nine Church Coordination Team members as
   cards (name, role, email, portrait); bios expand where they exist
   (`#loraine-garrett`, `#molly-flodder` land here).
4. **Staff grid**, group support: Caroline Koby, Ella Mae Lemen, Julie Kirklin (added
   as a staffMember; portrait exists).
5. **Deacons** (richText + the group photo): the five names, the three-year term, and
   their own sentence: "Each active member or attendee is assigned a Deacon…".
6. **Scripture band**: "Every Christian is called to minister to others in some way."
7. Closing: "Can't find who you need?" → /contact.

Fixes: the moderator button's mailto points at moderator@, not worship@; the deacon
chair email gets a real `@`; Nina's email is already corrected in the data.
Redirects for the five former staff already land on /staff; `/team/michelle-heimlich`
is added as a sixth.

### 5.7 History `/history`

The richest page: 4,174 words, seventeen period photographs, one per era. It survives
almost whole; the design is a timeline of eras with the church's words inside.

1. **Heritage band** (brown, full width, the tower): "Since 1859." with the founding
   sentence: twelve residents at the county courthouse, 10 September 1859.
2. **Timeline** in seven era rows, each row's `body` a short lead and each era then
   expanded as its own richText band with its photograph, alternating cream and taupe:
   Founding 1859–1862 · Struggle and Rairden 1862–1881 · The gas boom to the debt paid
   1887–1917 · The Fighting Parson and the building 1921–1929 (`#building`) · Sold and
   bought back 1938–1939 · Postwar to Mattox 1950–1989 · Saunders to the co-pastors
   1990–2022.
3. **Pull quotes** set large between eras: "Never again would the members discuss
   disbanding." and "Never giving up, the members found a way to buy it back."
4. **Document list**: "Journey Down Jefferson Street" (library copies) and "We Are the
   Clay" (Amazon).
5. Closing: → /who-we-are, /wedding (the building today).

Edits: the duplicated charter-members sentence goes; "1880" becomes 1890; the
note-burning date is left as the church wrote it and flagged; the informal asides
stay, they are the voice. SEO title "History of First Baptist Church Muncie, 1859 to
today".

### 5.8 Weddings & Building Use `/wedding`

1. Hero `split` (sanctuary): "Married here."
2. **Why here** (richText from wedding.txt), Ella Mae Lemen introduced with a direct
   contact.
3. **Our spaces** as a gallery-with-captions: Sanctuary, Bridal Suite, Fellowship
   Hall, Kitchen, Youth Center, Exterior. Stock photographs dropped.
4. **Quote band**: Hanna and Nathan's testimonial in full.
5. **Reserving your wedding**: the steps, **document list** with the Wedding Contract,
   Bridal Packet, and the informational form link. No price is invented; the
   documents carry the fees and the page says so.
6. `#building-use` **Building use for other events**: one paragraph, the Reservation
   Agreement PDF, the online request form (520312).
7. Closing: → /contact.

New copy: hero line, "Our spaces" captions, the reserving steps as a list. The
"Christian wedding" requirement is kept as written and flagged for a definition.

### 5.9 Give `/give`

No source exists; the old site had a link. The page is short and honest.

1. **Give band** (indigo, full page top): "Support the work of this church." Button:
   Give through Church Center.
2. **Ways to give** (richText, three short paragraphs, NEW): online through Church
   Center; in person on Sunday; by post to 309 East Adams Street.
3. **Where it goes** (richText): the church's own sentences only: "We give
   sacrificially to help those in need through regular offerings and donations" and
   the outreach line on special offerings. Nothing about tax status.
4. Closing: Questions → /contact.

Every sentence in 2 is flagged; the church should replace this page's copy with its
own stewardship words when it has them.

### 5.10 Blog `/blog` and posts `/post/<slug>`

The archive foregrounds the durable 36 without hiding the 106 sermon previews.

Index:
1. Hero `split`: "Writing from First Baptist."
2. **Featured**: the newest six posts whose category is not Sermon Preview (derived,
   never a flag), as cards with cover, category, date.
3. **This week**: the newest Sermon Preview, one wide card.
4. **All posts**: paginated grid, 12 per page, with category chips that set
   `?category=<slug>` (the redirect targets from plan 1 now resolve to a filtered
   list) and tag chips for the 217 tags.
5. `#publications` **Document list**: The Visitor by year, and the two books.

Post page: reading progress, category eyebrow, title, date, author, cover, body,
tags, "more from this series" by shared tag, previous/next. Sermon previews get an
eyebrow "Sermon preview, week of <date>" derived from `publishedAt`.

Bodies: the Portable Text converter. `@portabletext/block-tools` is added (this is the
one new dependency in plan 2, and Nathan approves it before install), `bodyHtml` from
the capture is converted so headings, links, lists, blockquotes and inline images
return; the pinned test from plan 1 flips to green. Re-import is idempotent.

### 5.11 Contact `/contact`

1. Hero `split` (the building corner): "Get in touch." Facts: phone · email · address.
2. **Two buttons above the fold**: New here? Fill in a visitor card (159198) · Need the
   office? Call or email.
3. **Office and pastors' hours** (from siteSettings, one place).
4. **Share a life update**: the list as written, → form 159897, with one new sentence
   saying a member of the pastoral team will follow up.
5. **Meet with a pastor**: the two portraits, named, with the Tuesday scheduling links.
6. **Sunday times band** with the map.

No form on the site (plan 1 decision). SEO title "Contact | First Baptist Church
Muncie".

### 5.12 Privacy, 404

Privacy keeps the starter's singleton, retitled and re-stated for a church that
collects nothing itself. 404 gets the tower and three links: Visit, Blog, Contact.

## 6. Data and derivation

- **Site settings** gains: service time, office hours, pastoral hours, phone, email,
  the three platform URLs, the socials. Every page reads them; nothing retypes them.
- **Coordinators on Ministries** are derived from `staffMember` documents by role, not
  retyped.
- **Sermon preview / durable** is derived from category (plan 1 ruling stands).
- **Room numbers** live in one place (the Visit timeline's rows) and the Ministries
  children band references the same numbers by copy, flagged until the church
  confirms.
- **Redirects**: add `/team/michelle-heimlich → /staff` (the 43rd), and verify all 43
  targets return 200 after the pages exist. That is plan 3's precondition, met here.

## 7. The Studio, for a church secretary

- **Desk**: Pages (the eleven in nav order, then Privacy) · Blog (posts by year,
  categories, tags) · People (staff) · Ministries · Site settings · Help.
- **Help** rewritten in her vocabulary: how to post a sermon preview, how to change a
  service time, how to add a staff member, what happens after Publish (two minutes,
  no developer), what never to click (Remove field).
- The legacy hidden fields on `homePage` are removed from the schema, since the
  builder is the only surface.
- `npm run audit:studio` exits 0; Studio Checkup and the Welcome tour (PORTS cards 31,
  38, 40) are adopted if their cost is under a day, else recorded as plan-3 items.
- Every new field description says what to type.

## 8. Verification and definition of done

Gates, all green before the PR: `npm run check` (0 errors), `test:unit`,
`format:check`, `npm test` (Playwright, both projects), `parity compare` (baselines
recaptured deliberately, once, at the end), `audit:studio`, `verify-archive`.

Measured, not asserted:
- Lighthouse desktop **100/100/100/100** on `/`, `/visit`, `/blog`, one post, `/staff`;
  mobile performance ≥ 95. Numbers recorded in the ledger before and after.
- Home hero LCP element is frame 1 and LCP < 2.0s on the deployed URL at mobile
  throttle.
- Screenshots of all eleven pages, both themes, 375 and 1280, committed under
  `docs/superpowers/screenshots/2026-09-19/` as the review set for Nathan.
- All 43 redirect targets return 200 on the deployed site.
- axe: zero violations, both themes.
- Every new copy sentence appears in `copy-for-church-approval.md`.

## 9. What the church has to decide (goes to the vault as #nathan items)

1. Nursery 104 / Family Room 105, or the reverse.
2. Who leads Children's Ministry: Jaden Johnson, Jennifer Durke or Michelle Heimlich
   (three names circulate for one role).
3. City Life Club really at 7:17 pm?
4. The 1917 note-burning: 24 or 30 December.
5. What "Christian wedding" means for a couple asking.
6. Give page copy in their words, and whether to state anything about tax status.
7. Photo consent for the identifiable children in the hero frame and the ministries
   band.
8. The photo day: fellowship, outreach, youth in use; a second sanctuary angle with
   people; a golden-hour exterior; headshots for Jaden Johnson, Andy Heimlich, Sally
   Butler and Nina Oisten.
9. Approve the one new dependency (`@portabletext/block-tools`).

## 10. Out of scope

The domain cutover (plan 3). The `/preview` secret. Web Analytics token. Events or
sermon types (never). Any form on the site.
