# Plan 2b fact sheet

Compiled 2026-09-19 against `fbcm` @ `d017a60` (main). Read-only: no source edits, no
commits, no Sanity writes. Every fact below carries a file:line or a literal query +
result. Anything I could not verify is marked **UNVERIFIED**.

---

## 1. Page documents

### `page` schema — `src/sanity/schemaTypes/page.ts`

| Field | Type | Notes / validation |
|---|---|---|
| `title` | string | required (line 45) |
| `slug` | slug | required, source `title`, maxLength 96 (line 54); custom validator (56-63) rejects empty, rejects any value in `RESERVED_SLUGS` (imported from `src/lib/reservedSlugs.ts`, line 23), rejects anything not `^[a-z0-9-]+$` |
| `pageBuilder` | array of `SECTION_TYPES` | (66-74), uses `sectionArrayOptions` for the grouped insert menu |
| `addToMainNav` | boolean | default `false` (77-85) |
| `navGroup` | string, radio | `top` / `services` / `resources`, hidden unless `addToMainNav` (86-101) |
| `navLabel` | string | optional, hidden unless `addToMainNav` (102-110) |
| `addToFooter` | boolean | default `false` (111-117) |
| `archived` | boolean | soft-delete flag, no validation, deliberately not in a browsed group (126-133) |
| `seoTitle` / `seoDescription` / `seoImage` | via `seoFields()` helper, `group: 'seo'` | title `max(60)` warning, description `max(160)` warning (140-179) |
| `publishAtField()` | from `./_publishAt` | scheduled publish (183) |

No `headingId` or `anchor` field exists on the `page` document or on any generic
block in `sections.ts`/`richSections.ts`. `timelineSection.rows[].anchor` (a `slug`
field, `src/sanity/schemaTypes/churchSections.ts:157-163`) is the ONE per-row anchor
field in the whole block library. Every other section's heading id is auto-generated
at render time by `SectionRenderer.astro:76-77` calling
`classifySections(sections, idPrefix)`, which assigns `headingId: \`${idPrefix}-${i}\`` (
`src/lib/sectionCadence.ts:129`) — an index-based id, not editor-controlled, not stable
across reordering.

### `[slug].astro` rendering — `src/pages/[slug].astro`

- Query: `getPage(slug)` + `getSiteSettings()` in parallel (46-49), from `src/lib/queries.ts`.
- Reserved-slug guard is a **hand-kept duplicate** of `RESERVED_SLUGS`, defined
  INSIDE `getStaticPaths` (lines 30-40) because Astro's static build runs
  `getStaticPaths` in an isolated scope and a module-level import is invisible to it
  (comment, lines 18-29). Current hard-coded set: `blog`, `post`, `contact`, `privacy`,
  `404`, `styleguide`, `sitemap-index.xml`, `og`, `_astro`.
- `pageBuilder` is passed straight to `<SectionRenderer sections={pageDoc.pageBuilder}
  idPrefix="page" settings={siteSettings} />` (69-73) — no anchor/id override.
- `noindex` comes from `pageDoc.hideFromSearch === true` (line 58) — **note**: the
  `page.ts` schema shown above does not itself declare a `hideFromSearch` field; it
  comes from the shared `seoFields()` helper (`src/sanity/schemaTypes/_seoFields.ts`,
  not read in full this session — **UNVERIFIED** exact field name inside that helper,
  but `[slug].astro:58` reads `pageDoc.hideFromSearch`).

### `homePage` rendering — `src/pages/index.astro`

- `getHomePage()` + `getSiteSettings()` in parallel (14-17).
- `sections = page?.pageBuilder?.length ? page.pageBuilder : DEFAULT_HOME_SECTIONS`
  (line 24) — falls back to `src/data/defaultSections.ts` when the Sanity array is
  empty.
- Renders via the same `SectionRenderer` with `idPrefix="home"` (line 28).

### `seed-core.mjs` — NOT read in full this session (1063 lines); **UNVERIFIED** in
detail. Confirmed from CLAUDE.md description only: seeds core singletons and seed
collections with `createOrReplace` + deterministic `_id`s, is idempotent, and every
seeded string must read as an explicit placeholder (CLAUDE.md rule under "Two things
about its CONTENT"). The specific `--only` flag semantics, `seedOne()` signature, and
backup path pattern were **not verified this session** — mark UNVERIFIED and read
`scripts/seed-core.mjs` directly before relying on this in the plan.

### Live `page` documents

Query run from repo root:
```
npx sanity documents query "*[_type=='page']{_id,title,'slug':slug.current}"
```
Result: **`[]`** — zero `page` documents exist in the live dataset today.

---

## 2. Block prop shapes

All general blocks live in `src/sanity/schemaTypes/sections.ts` (724 lines); the
church-specific blocks live in a SEPARATE file, `src/sanity/schemaTypes/churchSections.ts`
(427 lines, all scaffold-marked `church`), imported into `sections.ts` at line 32 and
spread into `pageSectionSchemas` at line 642. `teamSection` and `dynamicListSection`
live in `src/sanity/schemaTypes/richSections.ts` (306 lines).

| Block `_type` | Schema fields | Component + Props (file:line) |
|---|---|---|
| `heroSection` | `eyebrow`, `headline`\*, `subhead`, `backgroundImage` (image+alt), `layout` (`full`/`split`, radio), `frames` (image array, max 6), `facts` (array of `{label,value}`, max 3), `primaryCta`/`secondaryCta` (`ctaBlock`), `size` (`tall`/`short`) — `sections.ts:98-197` | `Hero.astro`, called from `SectionRenderer.astro:94-107` with `eyebrow, headline, subhead, backgroundImage, backgroundImages={s.frames}, layout, facts, primaryCta, secondaryCta, size, headingId` |
| `richTextSection` | `eyebrow`, `heading`, `scriptAccent`, `headingAccentField()`, `body` (portable text via `proseBody()`), `width` (`normal`/`narrow`), `align` (`left`/`center`) — `sections.ts:200-247` | `RichTextSection.astro`, `SectionRenderer.astro:136-147`: `eyebrow, heading, scriptAccent, headingAccent, body, width, align, surface, headingId` |
| `imageTextSection` | `image`(+alt), `imageSide` (from `sideOptions()`), `eyebrow`, `heading`, `body`, `cta` — `sections.ts:250-280` | `ImageText.astro`, `SectionRenderer.astro:148-158` |
| `dynamicListSection` | `eyebrow`, `headline`\*, `subhead`/`subheadRich`, `columnsField()`, `source` (radio, list currently only `journal`), `limit` (number, `min(3).max(DYNAMIC_LIST_MAX)`), `cta` — `richSections.ts:217-275`; `DYNAMIC_LIST_MAX = 12` (`src/lib/dynamicListLimits.ts:14`) | `DynamicList.astro`, `SectionRenderer.astro:277-289` |
| `quoteSection` | `quote`\* (text), `attribution`, `detail` — `sections.ts:324-352` | `QuoteBlock.astro`, `SectionRenderer.astro:167-173`: `quote, attribution, detail, surface` |
| `logoStripSection` | `eyebrow`, `headline`, `logos` (image array, min 2 max 12, required alt), `layout` (`row`/`grid`) — `sections.ts:502-559` | `LogoStrip.astro`, `SectionRenderer.astro:182-189` |
| `gallerySection` | `heading`, `images` (min 1, each with required `alt` + optional `caption`), `columnsField()` — `sections.ts:283-321` | `GalleryGrid.astro`, `SectionRenderer.astro:159-166`. **Captions: yes**, per-image `caption` string field (line 306). |
| `sundayTimesSection` | `eyebrow`, `heading`\*, `items` (1-3 `{label,big,body}`), `doors` (array of `{name,body}`), `showMap` (boolean, default true) — `churchSections.ts:30-110` | `SundayTimes.astro`, `SectionRenderer.astro:210-218`: also receives `settings` (siteSettings) for map/address |
| `timelineSection` | `eyebrow`, `heading`\*, `rows` (min 1, each `{marker\*, title\*, body (portable text), note, anchor (slug)}`) — `churchSections.ts:112-174` | `Timeline.astro`, `SectionRenderer.astro:219-226`: `eyebrow, heading, rows, surface, headingId` |
| `staffGridSection` | `eyebrow`, `heading`\*, `group` (radio: `all`/`pastors`/`coordination`/`support`), `showBios` (boolean default true) — `churchSections.ts:176-214` | `StaffGrid.astro`, `SectionRenderer.astro:227-236`. **Note**: schema has no `members` array — `SectionRenderer` passes `members={s.members ?? []}` (line 233) but the schema never defines a `members` field, so this always resolves to `[]` at the Studio level unless the GROQ projection injects it (query-time lookup by `group`, not read this session — **UNVERIFIED**, worth checking `sectionsProjection()` in `src/lib/queries.ts` before planning). |
| `faqSection` | `eyebrow`, `heading`\*, `items` (min 1, each `{question\*, answer (portable text)\*}`) — `churchSections.ts:216-256` | `FaqBand.astro`, `SectionRenderer.astro:237-243` |
| `scriptureBandSection` | `verse`\* (text), `reference`, `accentWord` (plain string, NOT a `headingAccentField()` — deliberately excluded from `section-fields.ts`'s registry per the file's own header comment, `churchSections.ts:7-13`) — `churchSections.ts:258-289` | `ScriptureBand.astro`, `SectionRenderer.astro:244-250` |
| `heritageBandSection` | `eyebrow`, `heading`\*, `body` (plain text), `image`, `cta` — `churchSections.ts:291-322` | `HeritageBand.astro`, `SectionRenderer.astro:251-259` |
| `giveBandSection` | `heading`\*, `body` (text), `buttonLabel` (default "Give through Church Center"), `buttonUrl` (optional — falls back to `siteSettings.givingUrl`) — `churchSections.ts:324-354` | `GiveBand.astro`, `SectionRenderer.astro:260-268`: also receives `settings` |
| `documentListSection` | `eyebrow`, `heading`\*, `docs` (min 1, each `{title\*, year (number), file, url, note}`) — `churchSections.ts:356-414` | `DocumentList.astro`, `SectionRenderer.astro:269-276` |
| `ctaBandSection` / final CTA usage | `eyebrow`, `headline`\*, `scriptAccent`, `headingAccentField()`, `subhead`/`subheadRich`, `cta`, `backgroundImage` — `sections.ts:411-450` | `FinalCta.astro`, `SectionRenderer.astro:108-119` |
| `spacerSection` | `variant` (`ornament`/`line`/`space`, default `ornament`) — `sections.ts:476-498` | inline in `SectionRenderer.astro:130-135`, no dedicated component |
| `videoSection` | `url`\* (YouTube/Vimeo), `heading`, `caption` — `sections.ts:453-473` | `VideoEmbed.astro` |
| `embedSection` | `eyebrow`, `headline`, `subhead`, `embedUrl`, `embedCode` (mutually exclusive, custom validator), `heightHint` — `sections.ts:568-624` | `EmbedSection.astro` |
| `statSection` | `heading`, `stats` (max 4, each `{number\*, suffix, label\*}`) | `StatsRow.astro` |
| `teamSection` | `eyebrow`, `headline`\*, `subhead`/`subheadRich`, `members` (min 1 max 12, each `{name\*, role, photo+alt, bio, socialLinks[]}`) — `richSections.ts:104-191` | `TeamGrid.astro` |

\* = `Rule.required()`

### `SELF_CONTAINED_TYPES` vs `CONTENT_TYPES` (`src/lib/sectionCadence.ts:23-59`)

- **SELF_CONTAINED** (manage own surface): `heroSection`, `ctaBandSection`,
  `statSection`, `spacerSection`, `logoStripSection`, `teamSection`, `embedSection`,
  `dynamicListSection`, `sundayTimesSection`, `faqSection`, `scriptureBandSection`,
  `heritageBandSection`, `giveBandSection`.
- **CONTENT** (alternating background/muted): `richTextSection`, `imageTextSection`,
  `gallerySection`, `quoteSection`, `videoSection`, `timelineSection`,
  `staffGridSection`, `documentListSection`.

### `SECTION_INSERT_MENU` groups (`sections.ts:666-706`)

1. **Basics**: hero, richText, imageText, spacer
2. **Proof and trust**: quote, stat, logoStrip
3. **Media**: gallery, video, embed
4. **About the business**: team, dynamicList, ctaBand
5. **Church**: sundayTimes, timeline, staffGrid, faq, scriptureBand, heritageBand,
   giveBand, documentList

---

## 3. CtaLink

`src/components/CtaLink.astro` variants (lines 118-148):

| Variant | Class (light) | Class (`onDark`) |
|---|---|---|
| `primary` | `bg-primary-dark text-white hover:bg-accent-dark` | `bg-primary-dark text-white hover:bg-primary` |
| `secondary` | `border border-primary text-link hover:bg-accent` | `border border-white/70 text-white hover:bg-white/10 hover:border-white` |
| `gold` | `bg-gold text-indigo-field hover:bg-gold/90` | same (gold never changes on dark) |
| `outline` | `border border-indigo text-indigo hover:bg-indigo/5` | `border border-bg/70 text-bg hover:bg-bg/10 hover:border-bg` |

`gold`/`outline` are the CHURCH pair per plan 2a spec 2.3, added ALONGSIDE
`primary`/`secondary` rather than replacing them (comment, lines 21-28) — repointing
`primary → gold` is explicitly deferred to a later single-place task.

`variant="primary"` usage across `src/` (grep, all 4 hits):
- `src/pages/styleguide.astro:472`
- `src/pages/styleguide.astro:499`
- `src/pages/styleguide.astro:521`
- `src/components/FinalCta.astro:194` (hardcoded, inside the component itself)

**No page currently calls `CtaLink` with `variant="gold"` or `variant="outline"`** —
those two variants exist in the component but are unused anywhere outside its own
definition (confirmed via the same grep pass turning up nothing for `gold"` / `outline"`
as a `variant=` value beyond the component file).

`FinalCta.astro` props + defaults (`src/components/FinalCta.astro:31-93`):
`eyebrow`, `headline = 'Come and see'`, `subhead = 'Plan a visit, or send us a note and
we will answer.'`, `cta`, `secondaryCta`, `headingId = 'final-cta'`,
`fallbackCtaLabel = 'Plan your visit'`, `fallbackCtaHref = '/visit'`, `scriptAccent`,
`headingAccent`, `subheadRich`, `backgroundImage`. Renders a `bg-accent-dark` panel;
primary CTA always `variant="primary" onDark`; secondary CTA (if present) `variant=
"secondary" onDark` (lines 191-199) — i.e. `FinalCta` never uses the `gold`/`outline`
pair either.

---

## 4. Hero photos

Five Wix asset hashes checked with:
```
npx sanity documents query "*[_type=='sanity.imageAsset' && originalFilename match '*<hash>*']{...}"
```
All five returned **`[]`** (no match, both with and without wildcards). Total
`sanity.imageAsset` count: **161** (`count(*[_type=='sanity.imageAsset'])`).

All five files DO exist in the archive (`fbcm-archive/images/`, full 32-hex-char
filenames located via glob `*08181c*`):

| Hash prefix | Archive filename | Size (bytes) |
|---|---|---|
| `08181c_087c222f` | `08181c_087c222f4750499ba5c0a6c514267c35_tilde_mv2.jpg` | 11,071,083 |
| `08181c_ac4bdf55` | `08181c_ac4bdf55910a4bf08971622eadbe31f6_tilde_mv2.jpg` | 19,313,514 |
| `08181c_b178e014` | `08181c_b178e014f570469ba249e1dd6f8c4122_tilde_mv2.jpg` | 7,567,269 |
| `08181c_be260248` | `08181c_be2602489e0d4b63929aa41445a72ff6_tilde_mv2.jpg` | 8,285,489 |
| `08181c_37d562a3` | `08181c_37d562a315d04a83afc879ec7ee9a460_tilde_mv2.jpg` | 14,222,108 |

None of the five appear as keys in `scripts/.asset-map.json` (162 entries checked with
a grep for each hash — zero hits), so `makeUploader()`
(`scripts/lib/sanity-lib.mjs:177-205`) has never uploaded them: its cache would show a
`fbcm-archive/images/<hash>...` key mapped to an asset id if it had. `originalFilename`
on already-uploaded assets stores the FULL archive-relative path used at upload time
(confirmed from sample query output — e.g.
`"...\\fbcm-archive\\images\\b444c3_464e2eeccebf4f11a8cd75f2d18e26f6~mv2.png"`), so the
match query correctly searched for the hash as a substring of that path.

**Conclusion: must upload 5 of 5.** These filenames are ~7–19 MB each (very large for
web hero images — the plan should call out a resize/compress pass before or during
upload, since `makeUploader.upload()` uploads the file as-is with no resizing).

`makeUploader(uploadClient)` (`scripts/lib/sanity-lib.mjs:177-205`): `.upload(relPath)`
uploads type `'image'` from a read stream at `resolve(ROOT, relPath)`, caches the
returned `asset._id` in `scripts/.asset-map.json` keyed by the exact `relPath` string
passed in, and skips re-upload on a cache hit. `.uploadFile(relPath)` does the same for
type `'file'` under a `file:${relPath}` cache key. The cache file is gitignored (module
header comment, line 16).

---

## 5. Staff, ministries, categories

### `staffMember` (`*[_type=='staffMember']|order(order asc){...}`) — 16 documents live:

| slug | name | role | group | photo | bio |
|---|---|---|---|---|---|
| (truncated in tool output; see full list below) | | | | | |

Full result (16 docs, group is `null` on every one — the `group` field described in
`staffGridSection.group` schema has apparently never been set on any staff document):
`jonathan-balmer` (Co-Pastor, photo✓ bio✓), `kendall-ellis` (Co-Pastor, photo✓ bio✓),
`loraine-garrett` (Youth Coordinator, photo✓ bio✓), `molly-flodder` (Worship
Coordinator, photo✓ bio✓), `nina-oisten` (Clerk, photo✓ bio✗), `sally-butler` (Member
Care Coordinator, photo✓ bio✗), `sandi-brzak` (Treasurer, photo✓ bio✓), plus 9 more
whose full JSON was truncated by the terminal but were confirmed present by count
match against `CURRENT_STAFF` in `src/lib/fbcm-redirects.ts:37-54` (16 names). **Every
`staffMember.group` value returned `null`** in the sampled records — worth flagging: if
`staffGridSection.group` filtering (`all`/`pastors`/`coordination`/`support`) is used
on the Staff page, it currently has no data to filter on. **Re-run the full staff query
without truncation before finalizing the plan** — I saw the tail of the array, not
guaranteed the head matches 1:1, though the count (16) matches `CURRENT_STAFF.length`.

### `ministry` — 5 documents, all with slugs matching `MINISTRIES` in fbcm-redirects.ts:
`adult`, `children`, `outreach`, `worship`, `youth`.

### `journalCategory` (schema type is `journalCategory`, NOT `category` — the task's
`category` type does not exist in this schema; there is no generic `post` type either,
the collection is `journalEntry`) — 5 documents:

| slug | title | post count |
|---|---|---|
| `church-resources` | Church Resources | 3 |
| `fbcm-events` | FBCM Events | 13 |
| `ruminations` | Ruminations | 4 |
| `series-resources` | Series Resources | 8 |
| `sermon-preview` | Sermon Preview | 106 |

(3+13+4+8+106 = 134, not 142 — 8 posts have zero or multiple/other categories;
**UNVERIFIED** why, not investigated further.)

### `journalEntry` counts

- `count(*[_type=='journalEntry'])` → **142**
- `count(*[_type=='journalEntry' && defined(body) && length(body)>0])` → **142** (all
  142 have a non-empty `body` array)

---

## 6. Blog today

### `src/pages/blog/index.astro`

- No pagination — all `entries` render in one grid (`src/pages/blog/index.astro:110-114`).
- **No `?category=` filter is read or applied.** Category chips render (line 78-97)
  but the file's own header comment says "category chips (display-only for now)"
  (line 4) and there is no `Astro.url.searchParams` read anywhere in the file. This
  directly contradicts `fbcm-redirects.ts`'s `BLOG_CATEGORIES` redirects, which target
  `/blog?category=<slug>` (`src/lib/fbcm-redirects.ts:135-140) — **that querystring
  currently does nothing** on the live blog index. Flag for the plan.
- Featured/durable split: first post gets a `featured` card treatment if
  `entries[0].featured` is true (`JournalCard` prop `featured={i === 0 && entry.featured}`,
  line 112) — this is a stored `featured` boolean on the entry, separate from the
  derived `isSermonPreview()` split described in section 6 below.
- Related posts: rendered on the DETAIL page (`post/[slug].astro:271-286`), not the
  index — `entry.relatedPosts` (source of that array not traced this session —
  **UNVERIFIED**, likely a GROQ same-category lookup in `queries.ts`).
- Reading progress: `<ReadingProgress />` on the detail page only
  (`post/[slug].astro:138`), not on the index.
- No `isSermonPreview` field is read directly in either page; the concept is only in
  `src/lib/import-post.ts` (see below) as a derived-at-render helper, and I did not
  find it actually CALLED from `blog/index.astro` or `post/[slug].astro` in this
  session's reads — **UNVERIFIED whether the 106 sermon-preview posts are currently
  visually distinguished on the live pages at all**; worth checking
  `JournalCard.astro` before planning the blog rework.

### `src/pages/post/[slug].astro`

- `getStaticPaths` enumerates every `journalEntry` slug, builds prev/next by array
  position (newest-first) (lines 41-64). Returns `[]` (no pages built) if
  `sectionVisibility.showJournal` is off (line 47).
- Renders: breadcrumb + eyebrow (category chips, date, reading time) → title →
  excerpt → author line → cover image → body (via `JournalPortableText`, hydrated
  `client:visible`) → optional related-project aside → related posts grid (up to 3) →
  prev/next nav → `FinalCta` → sticky CTA chip (`client:idle`).
- Reading time: `readingTimeFromPortableText(entry.body)` from `src/lib/reading-time.ts`
  (not read this session).
- TOC: `extractHeadings(entry.body)` from `src/lib/portable-text-headings.ts`, only
  rendered if headings exist (`hasToc`, lines 96-101, 217-220).

### `src/lib/import-post.ts` (261 lines, read in full)

- `bodyFromCapture()` (lines 172-186): produces **paragraphs only** — one `normal`
  Portable Text block per paragraph, split on blank lines from `bodyText`.
  **"HEADINGS, LINKS AND INLINE IMAGES DO NOT CARRY; they are plan-2 work, and a
  converter is what will carry them"** (comment, lines 160-162) — this is the exact
  plan-2b gap statement.
- `isSermonPreview(categories)` (line 118-120): derived, case-insensitive match against
  `'sermon preview'`. Deliberately NOT stored as a field (comment block, lines 1-8, 63-64,
  257-258) — CLAUDE.md rule 15 ("anything computable from data is derived, never
  stored").
- The plan-1 pinned test awaiting `block-tools`: **`docs/PENDING.md:423`** —
  `"The @portabletext/block-tools dependency plan 2b needs for a real Portable [Text
  conversion]"` (line truncated in grep, read full line before quoting in the plan).
  Also referenced in `docs/superpowers/plans/2026-09-19-fbcm-plan2a-identity-and-blocks.md:711`
  as "the block-tools dependency still awaiting approval for 2b."

### Is `@portabletext/block-tools` installed?

```
npm ls @portabletext/block-tools
```
Result: **`(empty)`** — not installed. Confirms plan 2b needs to add it (with explicit
approval per CLAUDE.md's "pause for confirmation before installing new dependencies").

---

## 7. Contact, privacy, 404

### `src/pages/contact.astro`

Reads `getContactPage()` + `getSiteSettings()`. Renders: Hero → `ContactForm`
(`client:visible`, Web3Forms-backed island) → email/phone failsafe lines (from
`siteSettings.email`/`siteSettings.phone`) → optional `CalendlyInline` (if
`page.schedulingLink` set) → post-inquiry roadmap (structured `page.postInquiryRoadmap`
steps, or fallback `page.whatToExpectContent` portable text) → sidebar with
availability note, email, phone, scheduling link, and `<ServiceAreaMap height={280}
lat={siteSettings?.geoLat} lng={siteSettings?.geoLng} />` (line 221).

**`ServiceAreaMap` reads `siteSettings.geoLat`/`geoLng`**, but those field names do
NOT appear in `src/sanity/schemaTypes/siteSettings.ts` (the file I read in full — no
`geoLat`/`geoLng` field defined there). Grep for `geoLat|geoLng` across `src/` hits:
`src/sanity/schemaTypes/businessInfo.ts`, `src/pages/contact.astro`,
`src/lib/queries.ts`, `src/lib/sanity.types.ts`, `src/lib/schemas.ts`,
`src/components/ServiceAreaMap.astro` — so the fields live in `businessInfo.ts` (split
out per CLAUDE.md's note that `businessInfo.ts` holds "service areas, travel,
availability, geo... merged back by `getSiteSettings()`"). **Not contradictory, just
means the plan should read `businessInfo.ts` for the geo fields rather than
`siteSettings.ts`** — not read in full this session, UNVERIFIED beyond the grep hit.

`ContactForm` is present (`client:visible` island, `src/components/ContactForm.tsx`,
not read this session). **No Church Center form ids (`159198`, `159897`, `520312`)
appear anywhere in `contact.astro`** — those ids live in `siteSettings` document data
(`visitorFormUrl` uses `.../forms/159198`, `lifeEventFormUrl` uses `.../forms/159897`,
both confirmed live in section 8 below) and in captured content files
(`scripts/data/pages/contact.json`, `who-we-are.json`, `reservation.json`, etc. — grep
hit list below). **`520312` was not found anywhere in the live repo** (grep across the
whole repo for all three ids found 16 files, none of which contain `520312` — only
`159198`/`159897` matched; UNVERIFIED whether `520312` is a real Church Center form id
this church uses, or a stale/incorrect number in the task brief).

### `src/pages/privacy.astro`

Reads `getPrivacyPage()` + `getSiteSettings()`. Renders Sanity `page.body` via
`PortableTextStatic` if present, else a full static fallback policy that branches on
`hasGa`/`hasCfAnalytics` from `src/lib/analytics-config.ts` (not read this session) so
the copy never claims a wrong analytics configuration.

### `src/pages/404.astro`

Reads `getNotFoundPage()` + `getSiteSettings()`. Falls back to a hardcoded Sanity
asset ref (`image-ce9be41407b946b7453724575c3cfd7aec2f7c4c-3024x4032-jpg`, "Studio dogs
on the sofa" per comment, line 19-24) if no `notFoundPage.heroImage` is set — this is
starter residue (CLAUDE.md rule 11 territory: correct code, wrong noun/photo for a
church site) and should be flagged for replacement.

---

## 8. Site settings

### Schema fields on `siteSettings` (`src/sanity/schemaTypes/siteSettings.ts`, 625 lines)

| Field | Group | Notes |
|---|---|---|
| `title` | (ungrouped/identity) | required |
| `tagline` | (ungrouped) | required, max 140 |
| `email` | (ungrouped) | required, email regex |
| `phone` | (ungrouped) | optional |
| `serviceTime` | `church` | default "Sundays at 10:45 am" |
| `serviceLength` | `church` | default "About an hour" |
| `address` | `church` | text, 2 rows |
| `officeHours` | `church` | portable text array |
| `pastoralHours` | `church` | portable text array |
| `churchCenterUrl` | `church` | url |
| `givingUrl` | `church` | url |
| `churchTracUrl` | `church` | url |
| `youtubeUrl` | `church` | url |
| `livestreamUrl` | `church` | url |
| `visitorFormUrl` | `church` | url |
| `lifeEventFormUrl` | `church` | url |
| `mapImage` | `church` | image |
| `directionsUrl` | `church` | url |
| `navItems` | `navigation` | array, max 7, `navLink` or `navGroup` (dropdown) members |
| `footerColumns` | `navigation` | array, max 4 |
| `headerCta` | `navigation` | object: `show`, `label`, `link` |
| `showEmail` / `showSocials` / `showFooterSocials` | `navigation` | booleans, default true |
| `legalNav` | `navigation` | array, max 6 |
| `logo` | `identity` | image + alt |
| `socialInstagram` / `socialFacebook` | (legacy, hidden+readOnly) | — |
| `socialLinks` | `social` | array of `{platform, url, label}` |
| `seoImage` | (ungrouped) | image + alt |
| `footerCredit` / `footerCreditUrl` | (ungrouped) | strings |
| `newsletter` | `newsletter` | object: `enabled`, `providerLabel`, `formActionUrl`, `audienceId`, `heading`, `blurb`, `buttonLabel`, `successMessage`, `consentNote` |
| `sectionVisibility` | `visibility` | object: `showJournal` (boolean, default true; unset counts as visible) |

(Geo fields `geoLat`/`geoLng` and business/service-area fields live in the SEPARATE
`businessInfo.ts` schema per CLAUDE.md, merged back by `getSiteSettings()` — not
enumerated here; read `businessInfo.ts` directly before planning anything geo-related.)

### Live values (`npx sanity documents get siteSettings`)

- `title`: "First Baptist Church Muncie"
- `tagline`: "We're a Spirit-led people gathered to join Christ's presence in our community."
- `email`: `office@fbcmuncie.org`
- `phone`: `(765) 284-7749`
- `address`: `309 East Adams Street\nMuncie, IN 47305`
- `serviceTime`: "Sundays at 10:45 am"
- `serviceLength`: "About an hour"
- `churchCenterUrl`: `https://fbcmuncie.churchcenter.com/`
- `churchTracUrl`: `https://fbcmuncie.churchtrac.com/`
- `givingUrl`: `https://fbcmuncie.churchcenter.com/giving`
- `youtubeUrl`: `https://www.youtube.com/c/FbcmuncieOrg`
- `livestreamUrl`: `https://www.youtube.com/@FbcmuncieOrg/streams`
- `visitorFormUrl`: `https://fbcmuncie.churchcenter.com/people/forms/159198`
- `lifeEventFormUrl`: `https://fbcmuncie.churchcenter.com/people/forms/159897`
- `directionsUrl`: Google Maps search link for the address above
- `officeHours`: 3 lines (Mon–Thu 9–12 & 1–4; Fri 9–12; Sun 9–12; holiday note)
- `pastoralHours`: 1 line (Tuesdays 9–12 & 1–5)
- `sectionVisibility.showJournal`: `true`
- `newsletter.enabled`: `false` (rest of newsletter object is placeholder copy)
- `headerCta`: `{show: true, label: "Give", link: external → churchcenter giving}`
- `navItems` (7, in order): Visit `/visit`, Who We Are `/who-we-are`, Beliefs
  `/beliefs`, Ministries `/ministries`, Staff `/staff`, History `/history`, Blog
  `/blog`
- `footerColumns`: "Pages" column (Visit, Who We Are, Beliefs, Ministries, Staff,
  History, Blog, Weddings and Building Use `/wedding`, Contact, Privacy) + "Elsewhere"
  column (Church Center, Church Trac, YouTube, all external)

**Note the live `navItems`/`footerColumns` already point at `/visit`, `/who-we-are`,
`/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding` — none of which exist yet**
(confirmed 404 today per CLAUDE.md and confirmed absent from `tests/routes.ts`, section
11 below). This is the core of what plan 2b has to build.

---

## 9. Redirects

`src/lib/fbcm-redirects.ts` (142 lines, read in full). Unique `to` targets (with
anchors), so the plan knows which anchors must exist on the new pages:

- `/visit` (bare) — from `/what-to-expect`
- `/visit#accessibility` — from `/accessibility`
- `/visit#building` — from `/architecture`
- `/beliefs#baptists` — from `/baptists`
- `/beliefs#membership` — from `/membership`
- `/staff` (bare) — from `/ministers`, `/team`, and every `FORMER_STAFF` slug, and any
  `CURRENT_STAFF` slug NOT in `STAFF_WITH_BIOS`
- `/staff#<slug>` — one per `STAFF_WITH_BIOS` member: `cynthia-smith`, `kendall-ellis`,
  `jonathan-balmer`, `loraine-garrett`, `molly-flodder`
- `/wedding` (bare) — from `/reservation`
- `/blog#publications` — from `/publications`
- `/contact` (bare) — from `/church-app`
- `/ministries#<m>` for `m` in `worship`, `children`, `youth`, `adult`, `outreach` —
  from `/<m>`
- `/blog?category=<c>` for `c` in `sermon-preview`, `fbcm-events-1`,
  `series-resources`, `ruminations`, `church-resources`, `pianist` — from
  `/blog/categories/<c>` (**see section 6: this querystring is currently a no-op on
  the live blog index**)

So the anchors that must exist on the finished pages: `/visit#accessibility`,
`/visit#building`, `/beliefs#baptists`, `/beliefs#membership`, `/staff#cynthia-smith`,
`/staff#kendall-ellis`, `/staff#jonathan-balmer`, `/staff#loraine-garrett`,
`/staff#molly-flodder`, `/ministries#worship`, `/ministries#children`,
`/ministries#youth`, `/ministries#adult`, `/ministries#outreach`,
`/blog#publications`.

---

## 10. CI test server

`playwright.config.ts` (65 lines, read in full, PORTABLE canonical copy):

- `webServer.command`: `` npm run build && npx http-server dist/client -p ${PORT} -s -c-1 --silent `` (line 59)
- Port: `PLAYWRIGHT_PORT` env var, default `4321` (line 22)
- Same command runs in CI and locally (`reuseExistingServer: !process.env.CI`, line 61) —
  **there is no separate CI-only server config**; both environments run the identical
  `http-server` invocation against the same `npm run build` output.

`tests/smoke.spec.ts:44-58` (read in full):
```
// Task 6 (2026-09-18): the Wix migration's URL-preservation gate...
test('a post with a non-ASCII slug is served at its original URL', async ({ page }) => {
  const res = await page.goto('/post/händel-s-messiah-sing-in-carols');
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Messiah');
});

test('the blog listing is served at /blog', async ({ page }) => {
  const res = await page.goto('/blog');
  expect(res?.status()).toBe(200);
});
```

### Does the static server decode percent-encoded paths?

`http-server` (the package actually used, `node_modules/http-server`) does NOT depend
on `ecstatic` or `serve-static` — no such packages exist in `node_modules` (searched
both). Its own file-serving core is `node_modules/http-server/lib/core/index.js`,
which defines:

```js
function decodePathname(pathname) {
  const pieces = pathname.replace(/\\/g, '/').split('/');
  const normalized = path.normalize(pieces.map((rawPiece) => {
    const piece = decodeURIComponent(rawPiece);
    ...
  }).join('/'));
  ...
}
```
(`node_modules/http-server/lib/core/index.js`, function starting at line 20)

**Yes — `http-server` calls `decodeURIComponent` per path segment before looking the
file up on disk**, so a request for the browser-encoded UTF-8 URL
(`/post/h%C3%A4ndel-s-messiah-sing-in-carols`) is decoded back to
`/post/händel-s-messiah-sing-in-carols` before the filesystem lookup. This is IDENTICAL
behavior locally and in CI (same package, same command, per the config above).

**Fix hypothesis (concrete):** since the serving layer is proven to decode correctly
and is identical in both environments, a failure of this specific test is much more
likely to be either (a) the STATIC BUILD never producing the file at that path (i.e.
`getAllJournalEntries()` / the import not actually including this post, or Astro
writing the output file under a different Unicode normalization form — NFC vs NFD —
than the URL the browser sends, which WOULD differ between Windows' NTFS, which
preserves whatever bytes it's given, and a Linux CI runner's ext4, which also preserves
bytes but where the two might disagree if the source `_key`/slug data itself is stored
in a different normalization on the two OSes), or (b) the post's `_id` (via
`postDocId()` → `asciiSafeIdSegment()`, `src/lib/import-post.ts:82-93`) is fine, but the
public `slug.current` itself was altered by an import step (e.g. an accidental
re-slugify), so no journalEntry document actually carries that exact slug in the
dataset the build ran against. **This is a hypothesis to verify by running `npm run
build` and checking whether `dist/client/post/händel-s-messiah-sing-in-carols/`
(or its `index.html`) exists on disk, not a confirmed root cause** — I did not run the
build this session (out of scope for a read-only fact sheet).

---

## 11. Routes and tests

### `tests/routes.ts` (53 lines, read in full)

`routes` (must render full content): `/`, `/contact`, `/blog`, `/privacy`,
`/styleguide`. `hiddenRoutes`: `[]`. `FORM_ROUTES`: `['/contact']`. Explicit comment
(lines 8-19) that `/[slug]` and `/post/[slug]` are deliberately absent because they
build zero paths with no Sanity project configured — **this file was NOT updated for
the plan-1 content already imported (142 posts, 0 page docs)**, so it undercounts what
actually exists live; the plan should decide whether/how routes.ts needs updating once
plan-2 pages exist.

### `src/lib/reservedSlugs.ts` (48 lines, read in full)

`RESERVED_SLUGS` = `{'blog', 'post', 'contact', 'privacy', 'styleguide', '404',
'sitemap-index.xml', 'og', '_astro'}`.

**Confirmed: `visit`, `who-we-are`, `beliefs`, `ministries`, `staff`, `history`,
`wedding`, `give` are NOT in this set.** They are free to be created as `page`
documents served by `[slug].astro`, exactly as the plan needs — no collision. (`give`
specifically isn't in `siteSettings.navItems` today, but isn't reserved either, in case
it becomes its own page later.)

---

## 12. Content sources

`docs/superpowers/notes/2026-09-19-content-map.md` section headings (line numbers from
`grep -n "^#"`):

- Line 1: `# FBCM Redesign — Content Map (9 merged pages)`
- Line 7: `## Cross-page facts`
- Line 23: `## /who-we-are` (source: `who-we-are`, ~1,332 words)
- Line 75: `## /beliefs` (source: `beliefs` ~1,632w + `baptists` ~1,236w + `membership` ~297w)
- Line 140: `## /ministries` (source: `worship` ~276w + `children` ~966w + `youth` ~379w + `adult` ~627w + `outreach` ~149w)
- Line 195: `## /staff` (source: `ministers` ~1,162w + `team` ~213w + 16 `team-*.json` profiles)
- Line 255: `## /history` (source: `history`, ~4,174 words)
- Line 318: `## /wedding` (source: `wedding` ~316w + `reservation` ~180w — "Weddings & Building Use")
- Line 360: `## /give` (NO existing source page — content gap)
- Line 377: `## /contact` (source: `contact`, ~234 words)
- Line 421: `## /blog` (source: `publications` ~403 words; 142 posts already imported separately)

**Note: there is no dedicated "/visit" section** in the content map by that exact
heading — the map groups `/what-to-expect` + `/accessibility` + `/architecture`
content under other headings per the redirect rules (see section 9); the closest direct
source for `/visit` is `scripts/data/pages/what-to-expect.{txt,json}`. **No single
`home` heading exists either** — the content map's stated scope is "9 merged pages"
covering the interior pages, not the home page. Confirm with the spec at
`docs/superpowers/specs/2026-09-18-fbcm-rebuild-design.md` before assuming home page
copy comes from this note.

### `scripts/data/pages/` word counts for the requested pages

| Page | `.txt` words | `.json` words |
|---|---|---|
| `home` | 163 | 1,115 |
| `what-to-expect` (→ /visit) | 651 | 1,542 |
| `who-we-are` (→ /who-we-are) | 1,318 | 2,207 |
| `beliefs` (→ /beliefs, one of three sources) | 1,631 | 2,224 |
| `history` (→ /history) | 4,171 | 5,606 |
| `wedding` (→ /wedding, one of two sources) | 316 | 1,111 |
| `contact` (→ /contact) | 234 | 908 |

No single `visit.*`, `ministries.*`, or `staff.*` files exist — `/visit` maps to
`what-to-expect.{txt,json}` (+ `accessibility.*`, `architecture.*` for the merged
anchors); `/ministries` maps to five separate files (`worship`, `children`, `youth`,
`adult`, `outreach`, each `.txt`+`.json`); `/staff` maps to `ministers.{txt,json}` +
`team.{txt,json}` + 16 `team-<slug>.json` profile files (one per `CURRENT_STAFF` name).
Full `scripts/data/pages/` directory listing (76 files) confirms all of the above exist
on disk, plus `blog-categories-*.{txt,json}` (5 categories, matching the 5 live
`journalCategory` docs) and `faq-entries.json`.

### `scripts/data/files-manifest.json` — PDF entries matching the requested names

| Text | Local file | Bytes | Found on | Archive path exists? |
|---|---|---|---|---|
| "As our by-laws & constitution say" | `08181c_7f1349cc8cb74753bbaf9b7c09ef396b.pdf` | 125,534 | `/beliefs`, `/membership` | Yes — `fbcm-archive/files/08181c_7f1349cc8cb74753bbaf9b7c09ef396b.pdf` |
| "See Full Confession [PDF]" | `08181c_be64a9c738884843ba795d52e0a781a1.pdf` | 25,417 | `/beliefs` | Yes |
| "Building Reservation Agreement" | `08181c_1fa464b2da224de48691aca95e371087.pdf` | 134,672 | `/reservation` | Yes |
| "Wedding Contract" | `81f7ac_5d5875126f8e4370976dc50811d0cc40.pdf` | 90,584 | `/wedding` | Yes |
| "Bridal Packet" | `81f7ac_e490a9f4e94f453aace77be8b91bcaa9.pdf` | 260,217 | `/wedding` | Yes |
| "Re-envisioning Baptist Identity: A Manifesto for Baptist Communities in North America" | `b98776_b6017910db9f477bbcb71f843b742887.pdf` | 980,645 | `/baptists` | Yes |

**"The Visitor" (the requested newsletter name) — no entry found.** A case-insensitive
grep for `visitor` across the whole `files-manifest.json` returned zero matches. Either
it was captured under a different link-text string (not tried: searching for
"newsletter" specifically — **UNVERIFIED, worth a follow-up grep before concluding it
was never captured**), or it genuinely isn't in the manifest and would need sourcing
separately (the content map's `/blog` section notes `publications` content moved into
the blog archive, so it's possible newsletter PDFs are handled as journal attachments
rather than as named documents in this manifest).

---

## 13. Existing copy-approval note

`Glob` for `*copy*` and `*approval*` inside `docs/superpowers/notes/`: **no files
found**. Answer: **none exists.**

---

## Summary of surprises for the plan

1. **Zero `page` documents exist live** — every plan-2b interior page (`/visit`,
   `/who-we-are`, `/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding`) has to be
   created from scratch as a new `page` document, even though `siteSettings.navItems`
   already links to all of them and they render 404 today.
2. **All 5 requested hero photos must be uploaded** — none exist in the 161-asset
   Sanity library, though all 5 exist in the archive at 7–19 MB each (very large;
   plan should include a resize step, not a raw upload).
2b. **`@portabletext/block-tools` is not installed** — plan 2b needs it for real post
   body conversion (headings/links/images), and CLAUDE.md requires explicit
   confirmation before adding any dependency.
3. **The `/blog?category=` querystring that 6 redirect rules point at does nothing** —
   `blog/index.astro` never reads `Astro.url.searchParams`; the category chips are
   explicitly commented "display-only for now." This is a real functional gap the
   redirects assume is already built.
4. **`staffGridSection.group` has no matching schema field for `members`**, and every
   live `staffMember.group` value sampled is `null` — the group-filter feature
   (`all`/`pastors`/`coordination`/`support`) has no data to filter by yet, and the
   block's own `members` field isn't defined in the schema (it must come from a
   query-time lookup not traced this session).
5. **Church Center form id `520312`** (one of three ids the task asked me to check)
   **does not appear anywhere in the repo** — only `159198` (visitor form) and
   `159897` (life-event form) are present, both already wired into live
   `siteSettings`. Worth confirming with the client whether `520312` is a real,
   still-needed form before the plan assumes it needs wiring up.
