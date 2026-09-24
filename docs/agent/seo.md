# SEO

> BaseLayout foundation, JSON-LD schemas, robots.txt, llms.txt, sitemap, OG generation, and pre-launch checklist.

## SEO

### Foundation (BaseLayout, every page)

- `<title>` -- unique per page, 50-60 characters, brand name as suffix ("Services -- Studio Starter"). Pulled from the page singleton's `seoTitle` field, falls back to the page's primary headline.
- `<meta name="description">` -- unique per page, 150-160 characters, written as a sentence a human would click. Pulled from `seoDescription`. No marketing puffery; match the on-page voice.
- `<link rel="canonical">` -- absolute URL computed from `Astro.url.pathname` + `site.domain`. Prevents a workers.dev URL or staging domain from competing with the production domain once DNS cuts over.
- Open Graph + Twitter meta -- set in BaseLayout. The OG image resolves in priority order (changed 2026-09-24, the craft-details pass): (1) the page's own `seoImage` -- an editor's explicit choice in the page's SEO section; (2) the route's **share card** at `/og/<route>.png` (see "Share cards" below); (3) the `ogImage` prop (a post passes its cover photograph, used only if its card is missing); (4) `siteSettings.seoImage`; (5) `og-default.png`. Sanity images run through `urlFor().width(1200).height(630).fit('crop')` via `ogUrlFromImage`. BaseLayout also emits `og:image:type` (for the PNGs), `og:image:width`/`height`, `og:image:alt`, `twitter:image:alt` and `og:locale`.
- `<html lang="en">`. Update this if the site ships in another language.

### Share cards (FBCM, 2026-09-24)

Every page and every post shares as its own 1200x630 card in the church identity: the
indigo band, a gold hairline frame, the Hannaford rendering in faint gold along the foot,
the title in Castoro Titling, and the wordmark under a door glyph. A post adds an eyebrow
(its category, or "Sermon preview") and a line under the title: the Sunday and the reading
for a sermon preview, the date for anything else, derived exactly as the post page derives
them (`src/lib/sermon-derive.ts`). Home and Visit add "Sundays at 10:45 am · 309 East Adams
Street", from Site settings.

- **Generated in every build, never committed.** `npm run build` runs `npm run og:pages`
  (`scripts/generate-og-pages.mjs`) before Astro. It reads the published content from
  Sanity (the same CDN read as `sanityFetch`), writes `public/og/<route>.png`
  (`/` -> `home.png`, `/visit` -> `visit.png`, `/post/<slug>` -> `post-<slug>.png`;
  `ogCardPath()` in `src/lib/church-schema.ts` is the one statement of that convention),
  and deletes cards for routes that are gone. `public/og/` is gitignored.
- **No browser, no system fonts.** The text is turned into SVG outlines by opentype.js
  (a devDependency) straight from the @fontsource `.woff` files the site ships, and sharp
  rasterises it. That is why it can run inside CI's build, which has no Chromium. The
  starter's `scripts/lib/render-og.mjs` (Playwright) is still what `npm run og` uses for
  the committed `og-default.png`.
- **Title fitting** is `fitTitle()` in `src/lib/og-card.ts` (unit-tested): as large as
  fits from a ladder of sizes, at most three lines (four once small), balanced lines, a
  word never split, a too-long title cut at a word with an ellipsis, and a height budget
  so the eyebrow and date line always fit. `typeset()` curls the quotes.
- **Cost, measured 2026-09-24:** 154 cards (11 pages + /blog + /privacy + 142 posts),
  8.6 MB in all, 57 KB on average, the largest 64.5 KB (palette PNG, quality 80). A cold
  run takes 3 to 5 s; a warm build reads `src/data/og-cards.generated.json` (gitignored; a hash of each card's
  words, the generator, `og-card.ts`, the fonts and the drawing) and redraws nothing in
  under a second.
- **No Sanity project, no cards.** On a fresh clone the generator prints one line and exits
  0; BaseLayout's eager `import.meta.glob` of that manifest then finds nothing and every route
  falls back to `og-default.png`. A route the generator does not draw (the paginated, tag
  and category archives) falls back the same way. Nothing ever points at a card that was
  not made.
- **Never glob the PNGs.** BaseLayout learns which routes have a card from the manifest,
  not from `import.meta.glob('public/og/*.png')`: a lazy glob, even never awaited, makes
  Vite emit every matched file into `_astro/`, which published all 154 cards a second time
  (+8.97 MB, measured and fixed 2026-09-24).
- **A slug with an accent** (`/post/händel-...`) arrives in BaseLayout percent-encoded, so
  the lookup decodes the pathname first; the card file carries the letter itself.

### JSON-LD (FBCM, 2026-09-24)

Built by pure functions in `src/lib/church-schema.ts` and `src/lib/post-schema.ts` (the
journal's own file, so the scaffold removes it with the blog), wrapped by
`src/lib/schemas.ts`. One block per type per page, never a second copy:

| Page                                                  | Blocks                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| every page                                            | the church, typed `["Church", "Organization"]` (BaseLayout) |
| pages and posts                                       | + a `BreadcrumbList` (the route passes it)                  |
| `/visit`                                              | + an `Event`: Sunday worship, with a weekly `eventSchedule` |
| a page with a question band (`/visit`, `/ministries`) | + an `FAQPage`, derived from the band                       |
| `/post/<slug>`                                        | + a `BlogPosting`                                           |

- **Why `["Church", "Organization"]`.** schema.org's `Church` is a Place: it can carry an
  address, a geo point, a phone and a logo, but not an email, and it cannot be a
  BlogPosting's `publisher` (Google wants an Organization). The congregation and its
  building share every fact, so one node is typed as both. `@id` is `<site>/#church`.
- **Every fact from Site settings** (rule 15): the name, tagline, phone, email, address
  (parsed into a PostalAddress), YouTube and Church Center (`sameAs`), directions
  (`hasMap`), the service time and length. The one fact that is not an editor's is the
  building's map point, `site.geo` in `src/data/site.ts` (OpenStreetMap way 399259467),
  with its Wikidata record in `sameAs`. The starter's `priceRange: '$$'` is gone.
- **Entity links (2026-09-24, the local search pass).** `sameAs` is YouTube, Church Center,
  Church Trac, the Site settings social links (Facebook and Instagram once they are entered
  there; they are not today, see docs/PENDING.md), Wikidata, and the Google Business
  Profile once claimed, de-duplicated across `www.`, scheme and trailing-slash spellings.
  **The Google Business Profile slot is `site.googleBusinessProfile`** in `src/data/site.ts`,
  empty until the church claims its listing; set it to the place's Google Maps share link and
  it joins `sameAs` and replaces the address search as `hasMap`. It is code, not a Site
  settings field, on purpose: a value set once, and a field would be a schema change. The
  node also says `isAccessibleForFree` and `publicAccess` (Place properties; Church is a
  Place): the Visit page's own "Anyone is welcome to attend our time of Worship".
- **FAQPage (2026-09-24).** A page with a "Questions and answers" band (`faqSection`) carries
  one `FAQPage` built from the band itself (`src/lib/faq-schema.ts`, unit-tested): each
  question, and its answer as plain text from the Portable Text, a linked phrase keeping its
  address in brackets, stega-cleaned, a repeated question kept once, two bands merged into
  one block. No field (rule 15). Google shows FAQ rich results only for government and health
  sites since 2023, so this earns nothing visible on Google; Bing and the AI assistants read
  question-and-answer markup readily, which is why it is there.
- **The weekly service.** Google's event docs support only pages about a single event and
  ask for one `Event` per occurrence; they have no markup for a weekly series. schema.org
  does: an `Event` with `eventSchedule` (a `Schedule`, `repeatFrequency: P1W`, `byDay:
Sunday`, `startTime`, `endTime`, `duration`, `scheduleTimezone`). So the Visit page
  carries one Event with that schedule, and its `startDate`/`endDate` name one real
  occurrence: the Sunday of the newest post (deterministic for a given dataset, so parity
  holds; a build clock would change the bytes every Sunday). Online and in person
  (`MixedEventAttendanceMode`, with the livestream as a `VirtualLocation`). The Event is
  unlikely to earn Google's event rich result, which is aimed at single events; it is
  there for search engines and assistants that read schema.org.
- **Posts.** `BlogPosting` with `headline` (cut at 110 characters on a word),
  `description`, `image` (the share card first, then the cover), `datePublished`,
  `dateModified`, `author` (a Person, or the church when none is named), `publisher` (the
  church), `isPartOf` the Blog, `articleSection` and `keywords`. A sermon preview is also
  `about` the Sunday worship it previews (a dated Event) and cites its reading
  (`citation`: a CreativeWork that `isPartOf` the Bible), both read from the post; a
  preview whose reading is not found cites nothing.
- **Validation, offline.** `src/lib/schema-vocab.ts` knows every type and property the
  site emits (copied from schema.org), the enumerations, ISO dates and durations, and
  Google's required fields for Event, BlogPosting and BreadcrumbList. The node builders'
  unit tests run it, and `npm run check:jsonld` (after a build) runs it over every
  `ld+json` block in `dist/client`, checks no page repeats a type or an `@id`, and checks
  every image URL on our domain (and every `og:image`) names a file in the build. Measured
  2026-09-24: 378 pages, 895 blocks (Church 377, BreadcrumbList 375, BlogPosting 142, Event
  1), no findings. After the local search pass the same day: 379 pages, 899 blocks (Church
  378, BreadcrumbList 376, BlogPosting 142, FAQPage 2, Event 1), no findings. Run Google's Rich Results Test on `/visit` and one post after the next
  deploy as well; it is the one check this cannot do offline.

### Sitemap and robots

`@astrojs/sitemap` generates `sitemap-index.xml` + `sitemap-0.xml` automatically from every prerendered page on `astro build`. The default `<priority>` and `<changefreq>` values are fine for a marketing site of this size.

`robots.txt` is generated at build time by `src/pages/robots.txt.ts`. It reads the production URL from `src/data/site.ts` and writes:

```
User-agent: *
Allow: /

# Search and AI answer crawlers: welcome.
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: GPTBot
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Bingbot
Allow: /

Sitemap: <site.url>/sitemap-index.xml
```

There is no static `public/robots.txt`. The generated endpoint ensures the sitemap URL is always the correct production domain as long as `site.ts` `url` is set correctly -- no manual file editing needed. **The named group (2026-09-24)** changes nothing for a crawler that already obeys `*`; it states in the file that the church wants to be found and quoted by the AI answer engines, so nobody later "fixes" an absent entry with a block. robots.txt cannot beat an edge block: Cloudflare's AI Crawl Control ("Block AI bots") must be off for the zone, which is on the cutover checklist (`docs/superpowers/notes/2026-09-20-cutover-plan.md`, "Search and AI visibility at cutover").

**`/llms.txt` is generated at build time** (since 2026-09-24; `src/pages/llms.txt.ts`, the text decided in `src/lib/llms-text.ts`, unit-tested). It replaced a hand-written `public/llms.txt` that had the service time and address typed into it. Every fact is Site settings'; the page list is each page's own title and search description, in the menus' order; "What to expect" is the Visit page's own question band. It is a proposed convention with no ranking effect anyone has claimed: it is cheap and harmless, and an assistant that fetches it gets the church in one short read. `public/llms-full.txt` is still a snapshot made by hand with `npm run llms:full` (docs/PENDING.md).

**IndexNow** submits the sitemap's URLs to Bing and the other IndexNow engines after each deploy, once the production host serves the key: `docs/agent/deployment.md`, "IndexNow".

After DNS cutover, submit `sitemap-index.xml` to Google Search Console. Verify the property via DNS TXT record (preferred -- survives redeploys) or HTML file upload.

### Title and description rules

**FBCM (2026-09-24, the local search pass).** Each key page's title and description say
where the church is (downtown Muncie, Indiana) and what it is (an American Baptist
church), in plain words, and every one is within the limits AFTER the Site settings
placeholders are filled and BaseLayout adds " | First Baptist Church Muncie": titles 60
characters or fewer, descriptions 140 to 160. They are set by the page modules in
`scripts/pages/*.mjs` and reach Sanity only through `npm run seed-pages -- --apply` (the dry
run prints each field's before and after). Keep the time, street, phone and email as Site
settings values in the module (`${settings.serviceTime}`, `${streetLine}`...): seed-pages
turns them into `{service time}`, `{address}`... so they stay single-sourced. Two more
constraints: the site search names a page by its `<title>` up to the first " | " (BaseLayout's
`data-pagefind-meta="title"`), so keep a page's own name first; and Ball State is not
mentioned, because the middle of campus is about a mile and a half from the church in a straight line (measured from `site.geo`), farther by road, not a short walk, and
nothing in the church's own content speaks to students. Post titles stay the posts' own
("<title> · Blog | First Baptist Church Muncie"); a place name would not read naturally there.

- Every Sanity page singleton has `seoTitle` and `seoDescription` fields. They MUST be unique across pages.
- Title: target 50-60 characters. Front-load the keyword (location or service).
- Description: target 150-160 characters. Speak to the reader, not the search engine. Don't restate the title.
- If `seoTitle` is empty, BaseLayout falls back to the page's primary headline. Don't rely on the fallback for launch -- fill the field.

### The "Search & sharing" panel on a custom page (PORTS.md card 21)

The `page` document type builds its SEO group through `seoFields()` in
`src/sanity/schemaTypes/_seoFields.ts`. The page's own `seoTitle`, `seoDescription`, and
`seoImage` definitions are passed back in by REFERENCE, so their names and wording are
unchanged; the helper adds two things:

- `seoPreview` -- a value-less field whose custom input (`src/sanity/components/SeoSnippetInput.tsx`)
  draws a live Google result and a live share card as the editor types. It is an INPUT and
  must never be re-registered as a document VIEW: a view mounted inside the Presentation
  tool has no `FormValueProvider`, so `useFormValue` throws and freezes the panel.
- `hideFromSearch` -- "Keep this page out of Google". **Two halves, and both are required**,
  or the switch silently does nothing: `src/pages/[slug].astro` passes `noindex` to
  BaseLayout (which emits `<meta name="robots" content="noindex, follow">`), and the
  `sitemap()` filter in `astro.config.mjs` drops the same path using a build-time query.

Page singletons do NOT have `hideFromSearch` yet, on purpose -- nothing on their routes
reads it. Adding it means doing both halves for that page in the same change.

### Redirects when a page is renamed (PORTS.md card 22)

Changing a page's web address files an old-path -> new-path `redirect` document
automatically at publish time (`src/sanity/components/slugRedirect.tsx`). Published
redirects are read at build time in `astro.config.mjs` and folded into Astro's `redirects`
map, which the Cloudflare adapter emits as real 301/302s. The editor can also add one by
hand under Pages -> Redirects for an address that never existed on this site. The path
normalization rules are shared with the build and unit-tested in `src/lib/redirects.ts`.

An **archived** page is not built at all, so its URL 404s, it drops out of the menus, and
it never reaches the sitemap.

### Image SEO

For Sanity-uploaded images, the alt text field does double duty: accessibility (required) and image search signal. Good alt text describes the image AND uses relevant terms where natural. Descriptive alt beats empty alt; meaningful descriptive alt beats generic.

See the [Image guidelines for editors](images.md#image-guidelines-for-editors) section for filename, format, and color profile rules.

### Pre-launch SEO checklist

- [ ] Every page has unique `seoTitle` and `seoDescription` in Sanity
- [ ] No page is left with "Keep this page out of Google" on by mistake (check Pages, then each custom page's Search & sharing tab)
- [ ] `og-default.png` regenerated with the actual project brand inputs
- [ ] `src/data/site.ts` `url` set to the production domain (robots.txt is generated from this automatically)
- [ ] `llms.txt` updated for the actual page set
- [ ] LocalBusiness JSON-LD validates in Google Rich Results Test
- [ ] FAQPage JSON-LD validates on `/visit` and `/ministries` (`npm run check:jsonld` offline; Rich Results Test after deploy)
- [ ] Service schemas validate (if per-service schemas are wired)
- [ ] BreadcrumbList present on every internal page
- [ ] OG previews look right in Slack, iMessage, or a social debugger (verify with opengraph.xyz or similar)
- [ ] All Sanity image alt text is meaningful (no "image1" placeholders, no empty strings)
- [ ] Sitemap submitted to Google Search Console
- [ ] Canonical URL points at the production domain on every page
