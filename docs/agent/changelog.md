# Change history

> Running change log, moved out of CLAUDE.md so it does not load on every task.

> **Scope note (2026-08-27).** This file stays **narrative**: what changed here, in
> sequence, in prose. The **machine-checkable** record of what is shared across the site
> family now lives in `PORTS.md` at the repo root: an applied-to matrix (improvement by
> repo), one dated port card per improvement, and `scripts/sync-check.mjs` to prove a
> site's canonical copies have not drifted. Something that needs to be _checked_ belongs
> in PORTS.md; something that needs to be _understood in sequence_ belongs here. Entries
> below may reference a card number.

_2026-09-25 — The Visitor's home band, enlarged (`feat/visitor-band`)._

**The newsletter gets a proper band on Home.** Nathan asked for the slim "The Visitor · September 2026 issue · Read it" row to grow, with an intro about how old The Visitor is and what it does. `VisitorBand.astro` is now a full band in Last Sunday's split (words in 5/12, picture in 7/12 from 1024 px; on a phone the h2, the picture, then the words): the eyebrow "Since 1946 · Quarterly", the h2 "The Visitor" in the shared heading grammar, the church's own sentence from its publications page ("Our church newsletter, filled with features, information about church life, and articles from both church members and pastoral staff."), "The September 2026 issue" under a short gold rule, the gold "Read the latest issue" plate and a "Past issues" link, both to `/visitor` (never the 15 to 75 MB PDF). The picture is the newest cover with the two issues before it fanned behind at 3 and 6 degrees, all lazy `<img>`s, only the front one announced, and "80 years in print" under the pile.

Rule 15, in the new `src/lib/visitor-band.ts`: the year 1946 lives only in the /visitor page's own line, "Our church newsletter since 1946"; `scripts/visitor-covers.mjs` now reads the issue list's eyebrow and writes `since` (and `previous`, the two issues after the newest) into the manifest, and the age is the build's year on the church's clock minus it, so it goes up with January's first build. The intro is a code constant because the page carries no intro in the church's words; the edit and the three new labels are listed in `scripts/pages/visitor.mjs` and the regenerated approval note.

**The ground is derived, and it is not the indigo the brief suggested on production.** Home's order is Our Building (paper), Last Sunday (indigo), The Visitor, Church Blog (taupe), so an indigo Visitor would sit directly on Last Sunday's indigo. `visitorGround` takes the band above: paper under a dark band (Last Sunday, whenever the feed gave a recording, which is the normal case), indigo under a light one (Our Building, when there is no recording). It keeps the dark/light alternation at that point and never matches the taupe or gold below. The dark row types come from rich-ground's table, now exported as `bandFamilyOfType`. Both grounds were built and looked at; axe on the band is clean on both.

Gates: check 0 errors (the known `scaffold.mjs` lint warning), format clean, 1198 unit tests (93 files, 8 new in `visitor-band`), 52 script tests, build with the rule 20 grep empty. Playwright 461 passed, 2 skipped (the Visitor home tests rewritten: hrefs, intro, eyebrow and derived age, the three lazy covers with one announced, the ground against both neighbours, axe on Home, and a 320 test that the pile stays inside the viewport and reads name, pile, words). Parity was 1/169 against main's baselines: every page's shared sheet 233 B smaller (the slim band's utilities left the Tailwind set) and Home's own sheet +515 B with the band's markup, nothing outside the band; recaptured, rebuilt, 169/169 with identical byte counts. Mobile Lighthouse on `/`, 3 runs, interleaved against main's dist: median LCP 1726 ms on both (the LCP element is the header logo on both; no cover requested at load).

_2026-09-24 — The blog as a plain register (`feat/blog-flat`)._

**"Worth coming back for" is off /blog, and the archives show covers as plain pictures.** Two of Nathan's decisions. Page 1 of /blog is now the register alone, newest first, 12 posts like every page after it (it listed 16 rows before: the 4 Worth rows and the 12 register rows). `Worth.astro` and `worthComingBackFor` (with its test) are deleted: nothing else used them. `shared-title.ts` needed only its comment changed: the naming stays per navigation because every row carries `[data-vt-title]`, not because of the duplicate. In the register on /blog, `/blog/page/N`, the categories and the tags, `PostRow` now takes `frame="plain"`: a 9:7 rectangle with a hairline border and the site's tiny radius, 96 / 136 / 160 px wide at phone / md / lg, so it is as tall as the lancet was (75 / 106 / 124 px) and about twice as wide. It keeps lazy loading, a srcset with sizes, and the alt rule. 9:7 is the covers' own shape: measured from the dataset, 115 of the 141 covers are 940x726 series slides, and the rest are 11 squares, 6 at 16:9, 5 at 1.19, and single ones at 1.36, 1.06, 0.80 and 2.28. Most are slides with lettering near the edges. So `coverFit()` (`src/lib/cover-fit.ts`, 5 tests) fills the box only when a cover's shape, after the editor's crop, is within 12% of it. Anything else is shown whole on a quiet brown-ink ground, and no slide loses its words. Home's Church Blog band and a post's More from this series keep the lancet (the default `frame="arch"`). The plain frame swaps only the three grid column templates, so those rows stay byte-identical. Whether Home should follow is logged for Nathan in `docs/PENDING.md`.

Gates: check 0 errors (lint: the one known warning in `scripts/scaffold.mjs`), format clean, 1176 unit tests (90 files), build with the rule 20 grep empty. Parity was 1/167 against main's baselines. Every page's inline sheet grew 969 B (the plain frame's utilities; Home 158,822 to 159,791 B). /blog and the five category pages changed markup: Worth came off, and the rows moved to the plain frame. Home's and the post pages' rows are identical to main. In the first build Home also differed in its YouTube-fed Sunday line and Last Sunday band, because the channel feed fetch failed. The next build had the feed again, so that diff was external. After a recapture and a fresh rebuild the fixpoint is 167/167 (Home 159,791 B, /blog 163,551 B on both sides). Playwright: 427 passed, 2 skipped. That includes the new `tests/blog.spec.ts`: page 1 newest first, no duplicates, no Worth heading, page 2 continuing it, plain covers on /blog, a category and a tag, and Home's rows still in lancets. At 320 px the figure is 96x75 and the row's right edge sits at 285 px, with no horizontal overflow at 320, 390 or 1440 (real scrollbars).

_2026-09-24 — The Visitor gets its own page (`feat/the-visitor`)._

**The church newsletter, prominent.** The issues of The Visitor sat in a list at the foot of /blog. They now have a page of their own at `/visitor`, composed by `scripts/pages/visitor.mjs` from two document lists (no schema change): the latest issue large on indigo with its cover, "The Visitor, September 2026", a gold "Read this issue" plate that opens the PDF inline and its size beside it, then "Past issues", a wall of 38 covers by year, then the two books. What makes a list The Visitor's is its shape (every document a month, a year and a PDF; `src/lib/visitor-issues.ts`), and the latest issue is the newest one, never a flag. Covers are page 1 of each PDF, drawn at build time with pdfjs-dist 6.3.289 and @napi-rs/canvas 1.0.9 (devDependencies, pinned exact) by `scripts/visitor-covers.mjs` into `public/visitor/covers/` at 240, 480, 720 and 960 px, cached by asset id; nothing is uploaded. Home gains a slim band after Last Sunday naming the newest issue and linking to /visitor (the files are 15 to 75 MB). The footer lists the page through its own "Show in the footer" switch, which nothing had read until now (`src/lib/footer-pages.ts`); per Nathan, not the main menu. Every issue's words are in the site search as Pagefind custom records that open the PDF. /blog keeps one line, anchored `#publications`. Dating the issues from their covers (`scripts/lib/visitor-dates.mjs`) settled the undated June (June 2022), showed the Wix "Download Latest Issue" to be September 2026, and found one disagreement (a file labelled August 2024 that prints September 2024), which is on the confirm list. Everything is composed and dry-run; the apply order is in PENDING. Until then `/styleguide/visitor` renders the page from `scripts/data/fixtures/visitor.json`.

Gates: check 0 errors (the known `scaffold.mjs` lint warning), format clean, 1186 unit tests (91 files), 52 script tests, `audit:studio` clean. Build: 1 m 48 s warm, 3 m 07 s with a cold cover cache (the cover step: 628 MB downloaded, 79 s; warm 0.4 s). The rule 20 grep prints nothing. Parity against main's baselines: every page's inline sheet grew (Home 158,822 to 164,406 B, SectionRenderer pages +4,390 B), and the only markup diff was Home's dated sermon line, which is the live YouTube feed moving on, not this branch; with the new `/styleguide/visitor` baseline, capture, rebuild and compare is 168/168 at 164,406 B on Home both sides. Playwright 450 passed, 2 skipped (`tests/visitor.spec.ts` new). Pagefind index 1,456,488 to 2,378,897 B with 39 issues. Mobile Lighthouse, medians of 3: `/styleguide/visitor` 92, LCP 3.23 s, CLS 0 (85 and 4.13 s before the wall's `sizes` were tightened and a 720 px cover added); Home 100, LCP 1.73 s, CLS 0, with and without the band.

_2026-09-24 — The sermon title's length by width (`fix/sunday-title-length`)._

At 1440 px the line read "THIS SUNDAY, SEPTEMBER 27 · 'HOW TO LET YOUR 'YES'…' · MATTHEW 21:23-32": the 24-character cap measured for a 320 px phone was applied at every width. The hero now server-renders the title per width band and CSS shows one, with no script: the phone rule below 640 px, a 40-character cap from 640 px and a 56-character cap from 1024 px. The caps were measured in Chromium with the real face (13 px, 1.82 px tracking, 8.1 px a capital): 518 px for the words at 640 px, where the sermon half sits under the date with its reading, and 864 px at 1024 px, where the whole line fits one row. This week's title is now whole from 1024 px ("‘How to Let Your “Yes” Be Yes and Your “No,” No’", one 22 px line, 325 to 847 px), and cut at a word at 640 px ("…and Your…’"). A quoted word inside a title now takes double quotes. In the line's capitals an inner single quote has the same shape as an apostrophe and as the outer quotes, and "YOUR ’NO,’ NO’" reads as elisions. The upgrade script hides the one wrapper that holds every copy, so it is unchanged.

Gates: check 0 errors (the known `scaffold.mjs` lint warning), format clean, 1172 unit tests, build with the rule 20 grep empty. Parity was 1/167 against main's baselines. Every page's inline sheet grew 89 B (the responsive `hidden` utilities the spans use; Home 157,850 to 157,939 B), and Home and `/styleguide/this-sunday/youtube` also changed markup in the sermon link only. After a recapture and a fresh rebuild the fixpoint is 167/167. Playwright: 422 passed, 2 skipped. That includes the title at 390, 640 and 1024, the right title with JavaScript off, and no overflow at 320, 640 and 1024.

_2026-09-24 — The goal glyphs redrawn (`feat/goal-glyphs`)._

**Three of the four goal glyphs, redrawn to be named at a glance.** In the footer and the mobile menu the glyphs sit about 32px tall, and there the rose window (Witness) read as a sun, a gear or a virus, and the jug, basin and towel (Work) were three objects too small to read. At Nathan's direction, `BuildingGlyph.astro` now draws The Way as the door with a paved path narrowing in perspective to its threshold (the door's handles came off: at 32px they merged with the centre line into a cross), Witness as a clay oil lamp, its flame rising from the nozzle tip, on a slim lampstand (Matthew 5:14-15; a first pedestal lamp read as a gravy boat or a genie lamp, and Nathan picked this one from three), and Work as one large basin seen a little from above with a towel draped over its front rim (John 13, the jug dropped). Worship's window is unchanged. Two or three candidates were drawn for each and the pick made by the at-a-glance test (the comparison sheet and its screenshots are kept in the session scratchpad, not the repo). The `name` values stay (`rose` is a stored Sanity value); the Studio's option titles now read "Lamp on a stand" and "Basin and towel", and the Help guide says the same, with no data migration. Same 48x64 box, 2px stroke and caps; 5 or 6 strokes each, all direct children with `pathLength="1"`, so the staggered draw is unchanged. No glyph carries a dotted stroke any more, so the `.glyph-dots` draw rule in globals.css is dormant, not removed.

Gates, after merging main (This Sunday from YouTube, the footer sign-off): check 0 errors (lint: the one known warning in `scripts/scaffold.mjs`), format clean, 1169 unit tests, `audit:studio` clean, typegen no diff, build with the rule 20 grep empty, Playwright 416 passed (2 skipped) including the menu's with-motion draw test on both projects, parity 167/167 after a fixpoint recapture (the only diff class from this branch: the three glyphs' `<path>`/`<circle>` markup, in the footer and menu on every page and in the goal doors, FAQ, give band, timeline, hours and styleguide; `index.html` 287,351 B on both sides).

_2026-09-24 — This Sunday's sermon from YouTube (`feat/this-sunday-youtube`)._

**The dated line names the sermon again.** The church stopped writing sermon previews in January 2026, so the home hero's "This Sunday" line, which names the sermon from a preview, never did. The coming Sunday's livestream is already scheduled on YouTube by Wednesday with the sermon in its title, so the line now takes it from there when there is no preview: `THIS SUNDAY, SEPTEMBER 27 · 'HOW TO LET YOUR 'YES'…' · MATTHEW 21:23-32`, linking to the watch page in a new tab. The order is `src/lib/this-sunday.ts`: a preview for that Sunday, else the broadcast, else the line exactly as before. `upcomingBroadcast()` in `src/lib/youtube-feed.ts` finds it. The live feed has no explicit "scheduled" marker (no `yt:liveBroadcastContent`, no scheduled start time, no future `<published>`). What it does have is `views="0"`, a midweek `<published>` (2026-09-23 18:03 UTC) and an `<updated>` two seconds later. So the broadcast's Sunday is the first Sunday strictly after its publish day, church time, and it must be the coming Sunday. The title must split into sermon and reading, and only one broadcast may claim that Sunday. Otherwise there is no sermon. `index.astro` now fetches the feed once for the line and the Last Sunday band, and decides both at one build moment. The BaseLayout upgrade script is unchanged: its stale check reads `data-sermon-sunday`, which a YouTube sermon carries too, so the drift tests still hold. `shortSermonTitle` now opens a quoted word with ‘. `deploy.yml` adds Thursday and Saturday 12:00 UTC rebuilds so a midweek broadcast reaches the line before Sunday. `/styleguide/this-sunday/<state>` renders the home hero on fixed data for the new Playwright suite. This entry also resolves merge-conflict markers that the `feat/last-sunday` merge left in `CLAUDE.md`.

Gates: check 0 errors (lint: the one known warning in `scripts/scaffold.mjs`), format clean, 1169 unit tests (89 files), 43 script tests, build with the rule 20 grep empty. Parity was 163/164 against main's baselines, and the one diff was Home's dated line (the YouTube sermon). A recapture adds the three styleguide states, and the fixpoint after a fresh rebuild is 167/167, with the inline sheet at 158,521 B on both sides. Playwright: 416 passed, 2 skipped (`tests/this-sunday.spec.ts` new, 8 tests). At 320 px the sermon link measures 22 px tall, its right edge at 244 px, and scrollWidth equals clientWidth.

_2026-09-24 — The footer's sign-off moves into the poster (`feat/footer-signoff`)._

**One band fewer.** The footer's poster (This Sunday, the time, the street, Give) filled only its left half, and the Praise & Proclaim mark with the bottom line "An American Baptist congregation in downtown Muncie since 1859" sat in a band of its own at the foot, over the Hannaford rendering. The mark and the line now sit in the poster's right half from `lg`, on the link columns' own grid (`2fr 1fr 1fr`, gap `l`), so the watchword shares the Elsewhere column's left edge and its top is level with the time; below `lg` they follow Give in the stack. The rendering moved up behind the poster's right side, full bleed to the right edge, resting on the goals rule: still aria-hidden, masked gold at 0.16 (worst case under a full-alpha line leaves gold text at 5.25:1), still inking in on the reveal observer and instant under reduced motion. The mark takes a footer-scoped size between `band` and `hero` (`--mark-a: clamp(40px, 4.2vw, 62px)`), so it sits level with the 10:45 figure rather than over it; WatchwordMark keeps its two sizes. The street line is `text-balance`, so where it wraps (1024, phones) it breaks at the comma. Every link, the credit, the rail and the mobile menu are unchanged.

Footer height on Home (`getBoundingClientRect`, real scrollbars): 1440 1,487.8 to 1,123.4 px (-364, -24%), 1024 1,350.6 to 1,076.9 (-274, -20%), 768 1,459.1 to 1,390.4 (-69), 390 1,852.8 to 1,784.8 (-68), 320 1,986.1 to 1,918.1 (-68), no horizontal overflow at any of them.

Gates: check 0 errors (lint: the one known warning in `scripts/scaffold.mjs`), format clean, 1152 unit tests, build with the rule 20 grep empty, parity 164/164 after a fixpoint recapture (163 pages differ inside `<footer>` only, from its first child to the base rail, which is unchanged; the inline sheet on Home 157,850 to 158,733 B, identical on both sides of the recapture), Playwright 408 passed, 2 skipped (axe clean; no footer selector needed changing: the tests read `footer [data-live-sunday]` and the social row, both kept).

_2026-09-24 — Church links, for the move to Church Trac (`feat/church-links`)._

**One place per church-system link.** The church is leaving Planning Center (Church Center) for Church Trac. A read-only scan found 132 Church Center or Planning Center addresses in 109 documents, all of them link targets. Site settings gained a **Church systems** tab: `givingUrl`, `visitorFormUrl` and `lifeEventFormUrl` moved into it and were retitled (names and data unchanged), and seven boxes were added (`sermonsUrl`, `wednesdayUrl`, `calendarUrl`, `prayerUrl`, `appUrl`, `weddingEnquiryUrl`, `weddingBookingUrl`), none with an `initialValue`. A link target can hold a token (`{giving}`, `{connect}`, `{contact-form}`, `{sermons}`, `{wednesday}`, `{calendar}`, `{prayer}`, `{app}`, `{wedding-enquiry}`, `{wedding-booking}`; `src/lib/church-links.ts`). `fillPlaceholders()` fills it at the two fetch chokepoints when it is a string's whole value. An empty box sends the link to `/contact` and logs a build warning. `{sermons}` first falls back to the live stream address. The link boxes accept tokens through `_linkRule.ts`, which declares its own relative `uri()` because a `url` field's hidden absolute-only default is only dropped when the field declares one. A side effect, measured with `sanity documents validate`: 10 documents (21 errors) were invalid on `main`, mostly journal links holding `mailto:` or relative paths, and the branch leaves 1 (the privacy page's `mailto:` link, a schema this branch did not touch).

**A sermon preview links its own recording.** When `{sermons}` is on YouTube, the post page matches a preview to its video in the channel's public Atom feed by Sunday and passage (`src/lib/sermon-video.ts`, `sermon-feed.ts`; no API key, no scraping) and retargets the Listen row and the body's recording links. It is derived at build time, not stored by the migration, per rule 15. It matches 0 of 118 previews today: the newest preview is 2026-01-06, and the feed's 15 videos start 2026-06-22.

**Migration, not yet applied.** `scripts/church-links.mjs` is dry by default and backup-first, and it refuses `--apply` without `--deployed`. The dry run turns 113 link targets in 102 documents into tokens ({sermons} 98, {connect} 5, {giving} 4, {wednesday} 2, {contact-form} 1, {app} 1, {wedding-enquiry} 1, {wedding-booking} 1) and fills 6 new boxes with today's Church Center addresses. 84 of the 113 links fill back to exactly the address they had. 28 sermon series and episode links become the sermon channel, and the broken `%0A` Wednesday link becomes the working one. It leaves alone the privacy policy and the footer's Elsewhere column (their words name Church Center), plus 13 past-event links. `seed-pages.mjs` writes tokens only for boxes that are filled. `OPERATIONS.md` has the switching runbook.

Gates: typegen, check 0 errors, format clean, 1076 unit tests, 38 script tests, `audit:studio` clean, `sanity schema validate` 0 errors. The build's rule 20 grep printed nothing. Parity was 163/163 before the change, 163/163 with the new code and untouched content, and 163/163 on the final commit. Playwright: 392 passed, 2 skipped.

_2026-09-24 — Scripture text and the post tools (`feat/scripture-text`)._

**The reading opens into its passage.** Every sermon preview's "The reading" block now ends in a native `<details>`, "Read Romans 13:11-14", holding the passage in Castoro roman with gold superscript verse numbers and the credit "Berean Standard Bible, public domain"; the 5 previews whose reading is only in the masthead get a reading block of their own. It needs no JavaScript and prints open (`::details-content` under print, plus a `beforeprint` fallback). The text is fetched at build time by `scripts/fetch-scripture.mjs` (inside `npm run build`, before Astro, because the prerender runs in workerd with no disk) from bible.helloao.org, one request per chapter, four at a time, cached in `node_modules/.cache/scripture/` (restored in CI and deploy after `npm ci`), into the gitignored `src/data/scripture.generated.json`. 107 of 118 previews got text (every preview with a reading: 106 readings, 90 chapters, 1,037 verses); cold 5.0 s, warm 1.2 s; a failed fetch drops only its passages, with a warning, and never fails the build. `src/lib/scripture-text.ts` (21 unit tests) holds the translation config and the pure parts. **The NIV** is a first-class option: with `API_BIBLE_KEY` and the NIV available to it, the newest readings get the NIV up to Biblica's allowance (500 distinct verses, under 25% of any book and of the page), the rest stay BSB with a warning; FUMS is wired and loads only when an NIV passage is opened. The research and the numbers (1,014 distinct verses; three books over a quarter) are in PENDING, with the steps for Nathan.

**The post tools.** A row under the order: Read aloud (Web Speech, loaded on first press, one utterance per block, a natural voice where there is one, `aria-pressed`, stops on navigation), Share (`navigator.share`, else copy with "Link copied" in a live region) and, on a preview, Add to calendar, a static `/post/<slug>/sunday.ics` (118 files) at the Site settings service time and length, in `America/Indiana/Indianapolis` with a VTIMEZONE, hidden client-side once the Sunday has passed. `src/lib/ics.ts` (7 tests) is the reusable writer, exported for the Visit page's weekly event; `src/lib/worship-ics.ts` (5 tests) builds a preview's. The bootstrap script is 1,760 B (885 B gzip). "Read aloud" rather than "Listen", because the order already has a Listen row.

Gates: check 0 errors, format clean, 1084 unit tests, 43 script tests, build 119 to 127 s warm with the rule 20 grep empty, parity 163/163 after a fixpoint recapture (inline sheet 142,522 B on both sides; diff classes, all on the 142 post pages and nowhere else: the post CSS chunk, the tools row and its script tag, the print script's passage lines, and the passage `<details>` on 107), Playwright 399 passed, 2 skipped as before (the 7 new `post-tools.spec.ts` tests among them). Post HTML vs main: +3,988 B raw on a post with no passage, median +5,893 B (max +8,392 B) raw and +1,165 B brotli with one. Mobile Lighthouse on /post/a-light-wardrobe, 3 runs each interleaved, compressed server, medians main to branch: performance 95 to 98, LCP 2,852 to 2,102 ms (main's runs spread 2,256 to 2,928; the branch adds nothing above the fold, so this is variance), CLS 0.02 to 0.02, TBT 0 to 0, accessibility 100 to 100, bytes 288,968 to 291,036.

_2026-09-24 — Last Sunday, Sunday weather and the Sunday calendar (`feat/last-sunday`)._

**Last Sunday on Home.** The most recent Sunday service recording on the church's YouTube channel, as an indigo band before the Church Blog rows: date, sermon title, reading, series, preacher, a lite facade (YouTube's own thumbnail from `i.ytimg.com`, lazy, in a 16:9 door arch with a gold play mark; no iframe, no player script) and a gold "Watch on YouTube" plate; when a sermon preview was posted for that Sunday it pairs with the post (`previewForSunday`). Read at BUILD time from the public channel feed (no key; `src/lib/last-sunday.ts`, every failure null so the band is absent and the build goes on) and picked by `src/lib/youtube-feed.ts`. The real feed on 2026-09-24 held 15 entries, every one titled "Sermon - Reading - Series"; 13 replays published just after midnight Monday church time, one at 12:14 pm Sunday, and next Sunday's scheduled broadcast already present (published Wednesday, 0 views). So the rule is: published on a Sunday or a Monday church time, at least one view, not in the future, within 21 days. The band is placed from code through a new `SectionRenderer` `insert` slot (`src/lib/band-insert.ts`), outside the cadence, the spare-image pool and the heading numbering, so no Sanity write and no block colour. `deploy.yml` gains a schedule (Sunday 18:00 UTC, Monday 10:00 UTC) so the band, and the hero's This Sunday line, keep up in a quiet week.

**Sunday weather on Visit.** "Sunday: 58°, light rain." under Find us in the doors band, fetched by the browser from the National Weather Service (the gridpoint cached in code, one call), Wednesday to Sunday noon only, hidden on any failure and revealed only while its place is off screen (CLS 0.000 measured). No rain note: Visit's words never say the entrance is covered. The first cut imported `live-service.ts`, which made Vite split a shared chunk that every page's BaseLayout script then fetched (Home 33 to 34 requests, LCP 1,727 to 2,026 ms in two of three runs); `sunday-weather.ts` now imports nothing and a unit test holds it to that.

**Add Sundays to your calendar.** `/visit/sunday.ics`, one weekly event (`RRULE:FREQ=WEEKLY;BYDAY=SU`, `TZID=America/Indiana/Indianapolis` with a VTIMEZONE, the start and length from Site settings, the address, `GEO`), linked under Visit's hero facts beside the service time (`HeroFacts.astro` `calendarHref`). `src/lib/sunday-ics.ts` is named to fold into `feat/scripture-text`'s `src/lib/ics.ts` (PENDING).

Gates: check 0 errors (lint: the one known warning in `scripts/scaffold.mjs`), format clean, 1094 unit tests (83 files), 38 script tests, build with the rule 20 grep empty, parity 164/164 after a fixpoint recapture (the recapture also carries a dataset drift that is not this branch's: unfilled `{giving}`-style placeholders in Site settings links, see PENDING), Playwright 401 passed (2 skipped; `tests/last-sunday.spec.ts` new). Mobile Lighthouse, same dataset, main against branch, 3 runs each, medians: `/` performance 100 to 100, LCP 1,727 to 1,726 ms, CLS 0 to 0 (the LCP element is the header logo in both); `/visit` performance 94 to 94, LCP 3,003 to 3,002 ms, CLS 0 to 0.

_2026-09-24 — Social links (`feat/social-links`)._

**One derived list, three places.** Site settings gained the church's Facebook and Instagram earlier the same day; YouTube lives in its own `youtubeUrl` (Watch live). `src/lib/social-links.ts` `socialLinksOf()` now derives the list every surface draws: the stored array (legacy fields as the fallback), YouTube added from `youtubeUrl` unless already stored, de-duplicated by normalised address, ordered Facebook, Instagram, YouTube (15 unit tests, stega included). `SocialIcon.tsx` is the one icon map. **The footer** renders from it, so YouTube joins the row, and each icon button is named "First Baptist Church Muncie on Facebook" (it was the bare platform); a gold focus outline. **The mobile menu** gains the same icons as its last row, in a list named "Follow along"; Header.astro passes `{ platform, url, label }` (island props +619 B per page, the island's JS +1,233 B gzip for the icons). The sheet's content box is now `shrink-0`, which fixes a lost `pb-8` (the last row sat on the screen edge) and puts the menu's rendering back at the sheet's foot on a short phone. **The Contact page** gets a "Follow along" group on its office door (Hours.astro, the Contact page's own block), icon plus visible name, in code from Site settings: no schema change and no page write. New words ("Follow along", the accessible names) are in the approval note's generator (`scripts/lib/approval-note.mjs`).

Gates: check 0 errors, format clean, 1051 unit tests, 38 script tests, build with the rule 20 grep empty, parity 163/163 after a fixpoint recapture (diff classes: the inline CSS comment on 162 pages for the new focus utilities, the menu island's props and the footer row on 161, the office door on /contact), Playwright 390 passed (2 skipped; `tests/social.spec.ts` new).

_2026-09-24 — Print and motion (`feat/print-motion`)._

**A post prints as a bulletin.** `@media print` at the end of the post page's own `<style is:global>` (the post CSS chunk, 10,055 B to 12,969 B; the global sheet only gained a small reveal reset): US Letter with "n of N" in the margin box, the masthead and the order as a ruled list (the Listen link prints its address), a photograph cover as a plain rectangle, the body in Castoro at 11pt on a 5.9in measure, headings kept with what follows, figures, table rows, Q and A and the lection never split, black ink with gold only as thin rules, and a derived foot line (site name, the Site settings address, the post URL). The chrome, the side column, tags, More from this series, the doors and the search dialog do not print; a `beforeprint` listener makes the lazy figures load. Checked with `page.pdf()` on three posts, pages rasterised and read; `tests/print.spec.ts` is the gate. The generic print block now also forces every reveal to its final state, so nothing unscrolled prints blank.

**The building glyphs draw themselves.** Every `BuildingGlyph` stroke has `pathLength="1"` and the svg is `data-reveal="draw"`: once in view, the lines draw one after another and stay. With `vector-effect: non-scaling-stroke`, Chromium and WebKit both lay the dash out on screen (measured: a glyph at twice its viewBox stopped halfway), so the reveal script measures each stroke's screen scale into `--k` and the dash comes off 2 s later. Drawing the arch mould too was tried and rejected (its stretch is non-uniform). **The Hannaford rendering inks in**: the footer's line art and Home's Our Building drawing fade in slowly, the drawing from pale pencil to its full grade; the menu's copy inks in after the rows rise. All of it under `prefers-reduced-motion: no-preference`; `tests/motion.spec.ts` gained both halves.

**View transitions.** A blog row's title now carries over into the post's h1 on a forward navigation (a shared `post-title` name set for that navigation only, `src/components/transitions/shared-title.ts`, rules in `src/lib/shared-title.ts` with 10 unit tests). And the page no longer SLIDES during the cross-fade: `<main>` and the footer were named, and a named group animates between its old and new boxes, so leaving a page scrolled 1000px down carried the whole page down the screen (seen frame by frame, on `main` too). Only the header is named now; the page cross-fades in place as the root snapshot. `tests/transitions.spec.ts` walks Home, Blog, a post and Back.

**Lenis is gone** (Nathan's call, mid-branch). It cost 5.4 KB gzip per page (gzipped JS on `/` 98,272 B to 92,707 B, a post 99,376 B to 93,811 B, one request fewer), ran a rAF loop forever, started 1.5 to 2 s late, and caused the dead-wheel bug `595a65c` fixed. The router owns the scroll reset and restore (proved at `astro:after-swap`); anchors glide through `html[data-smooth-scroll]`, set on the first press because smooth scrolling from load made Chrome glide its reload restoration (and left the header unseeded, which `header.spec.ts` caught). CLAUDE.md rule 5 rewritten.

Gates: check 0 errors, format clean, 1024 unit tests, 34 script tests, Playwright 385 passed (2 skipped, as before), parity 163/163 after a fixpoint recapture (every diff class listed in the recapture commit). Mobile Lighthouse, 3 runs each interleaved, compressed server, medians main to branch: `/` LCP 2,101 to 2,029 ms, CLS 0 to 0, TBT 0 to 0, performance 98 to 99; a post LCP 2,926 to 2,926 ms, CLS 0.020 to 0.020, TBT 0 to 0, performance 94 to 94.

_2026-09-24 — Local search and AI visibility (`feat/local-seo`)._

**Titles and descriptions that name the place.** Every key page's `seoTitle`/`seoDescription`
(set by `scripts/pages/*.mjs`) now says the church is an American Baptist church in downtown
Muncie, Indiana, within the limits once placeholders are filled: titles 34 to 60 characters,
descriptions 145 to 160 (Beliefs' were 73 and 286). Written, not applied: the dry run changes
only those two fields on 11 documents, and `seed-pages` now prints a changed text field's before
and after. Every new line is in the approval note, which also got back two hand-typed sections a
regeneration had wiped (now `CHROME_SECTIONS`). Ball State is not mentioned: about a mile and a
half away, not a walk, and nothing in the church's content speaks to students.

**JSON-LD.** An `FAQPage` on any page with a question band (`/visit`, `/ministries`), derived
from the band (`src/lib/faq-schema.ts`, 7 tests; links kept as addresses; stega-clean), with
FAQPage/Question/Answer and Google's required fields in `schema-vocab.ts`. The Church node gained
Church Trac in `sameAs` (de-duplicated across spellings), `isAccessibleForFree` and
`publicAccess`, and an empty `site.googleBusinessProfile` slot that becomes `sameAs` and `hasMap`
once the church claims its listing. `check:jsonld`: 379 pages, 899 blocks, FAQPage 2, no findings.

**Crawlers.** robots.txt names and allows eleven search and AI crawlers beside `*`. `/llms.txt`
is a build-time route from Site settings, the pages' own descriptions and Visit's own questions
(`src/lib/llms-text.ts`, 3 tests), replacing a hand-typed `public/llms.txt`. IndexNow: the key in
`site.ts`, served at `/<key>.txt`; `scripts/indexnow.mjs` submits the sitemap after each deploy
(`deploy.yml`, continue-on-error) only once `site.url` serves the key, so it no-ops until the
cutover (Wix answers 400 today). The cutover plan gained "Search and AI visibility at cutover".

Parity: 161 of 163 pages changed, all inside their JSON-LD only (checked by stripping the blocks),
recaptured to a fixpoint (163/163, largest inline style 153,458 B on both builds).

_2026-09-24 — The scripture index and site search (`feat/scripture-search`)._

**`/blog/scripture` lists every passage preached**, Genesis to Revelation: 106 passages from 24
books across the 107 previews that name a reading, each linked to its post with the Sunday it
was preached. Derived at build time (`src/lib/scripture-index.ts`, 21 unit tests) from the same
`readingOf()` the post page prints, so the places a reading appears cannot disagree; no schema
change. All 107 readings parsed (the "Other readings" list is empty); the 11 previews without a
reading are the ones `readingOf()` already leaves without a Reading row. The blog's browse row
gained "By passage", and all 107 posts' Reading rows now link to their book.

**Site search, with Pagefind 1.5.2** (a devDependency Nathan approved). `npm run build` is now
`with-workerd astro build && node scripts/pagefind-index.mjs`; 153 pages are indexed (142 posts,
home, the nine builder pages and /privacy). The UI is the site's own: a native `<dialog>` built
on first open, register-style rows, no Pagefind UI stylesheet. A dialog rather than a /search
page because the search is reached from every page and a reader mid-sermon wants to look
something up and come back. Cost on load: no extra request (the ~0.7 KB trigger rides in the
layout's existing script; a first cut as its own module added one), so home and a post keep 34
and 27 requests. An interleaved Lighthouse A/B on one build (trigger stripped vs in, 5 runs
each, home, mobile): FCP 1202 ms and LCP 1727 ms medians on both. Verified through the Worker
(`wrangler dev`): `/pagefind/pagefind.js`, the WASM and the fragments serve 200 and a query
answers. New tests: `search-results` (5 unit), `tests/scripture.spec.ts` and
`tests/search.spec.ts` (header and mobile menu, "Jeremiah", Escape, arrows, axe on the open
dialog at 1440 and 320, nothing loads until opened); `/blog/scripture` joined `tests/routes.ts`.

_2026-09-24 — This Sunday's sermon, and a real "Live now" (`feat/sunday`)._

**The home hero's dated line names this Sunday's sermon** when the church has posted the preview
for it: `THIS SUNDAY, SEPTEMBER 27 · 'WHEN GOD SHOWS UP' · JEREMIAH 29:10-12`, the sermon half a
link to the post. Nothing is typed (CLAUDE.md rule 15): `src/lib/sunday-sermon.ts` picks the
preview whose derived Sunday is the coming Sunday on the church's calendar, at build time, and
the reading comes from the post's opening. Length rules in `src/lib/live-sunday.ts`, measured at
320 px: a title over 24 characters loses a trailing parenthesis, then is cut at a word with an
ellipsis; the reading shows on phones only when it fits beside the title. The server renders
"Sunday, September 27"; the inline call beside the span says "This Sunday" or "Today" before
first paint, or drops the sermon and puts the service time back once the page has outlived that
Sunday. Home mobile LCP with a sermon on the line: 1.73 s median, unchanged. `/visit` does not
carry it (its bands describe any Sunday).

**"Live now" asks YouTube.** `GET /api/live-status` (SSR) answers live / not-live / unknown from
two 1-unit YouTube Data API calls (the uploads playlist, then the videos' broadcast state; not the
100-unit `search.list`), only inside Sunday 9:30 am to 1:00 pm church time, cached 90 s in the
isolate and at the edge. The header asks it at most once a minute inside that window; a fresh
answer beats the clock, and anything else leaves the old time window in charge. With no
`YOUTUBE_API_KEY` (the state today) it answers `unknown` and the site behaves exactly as before.
Tests: `sunday-sermon`, `live-status`, and new cases in `live-sunday`, `live-service` and both
inline drift gates, which now run the inlined sermon and endpoint decisions against the modules.

_2026-09-24 — Post bodies as static HTML, and no Toaster (`perf/post-body`)._

**The two speed-pass follow-ups Nathan approved.** A post body was one `client:visible` React
island, which shipped `@portabletext/react`, the journal renderers and `@sanity/client` (through
`urlFor`) to every post and serialised the whole body into the page a second time as island props.
`src/components/JournalBody.astro` now runs the unchanged `JournalPortableText.tsx` through
`react-dom/server` at build time, so the rendering rules are the same code, and hydrates only a
before/after slider (none exists yet), cut out of the body by `splitAtSliders` in `post-body.ts`.
The Studio preview has no post route, so there was no click-to-edit path to keep. `<Toaster />`
came out of `BaseLayout.astro`: its only caller, `CopyEmailButton`, is rendered by no page; the
package and primitive stay. On the Messiah post (mobile, 3 runs): JS 147.6 KB to 97.1 KB
transferred (19 requests to 14), HTML 53.2 to 47.8 KB, LCP 3.31 s to 2.93 s, perf 0.92 to 0.94.
Parity: 153 of 162 pages identical once the Toaster, the island wrapper and Astro's `visible`
script are set aside; 9 posts differ by one space the old baseline's normaliser had collapsed
between React's text separators. Baselines recaptured to a fixpoint. Details in
`docs/agent/performance.md`; the starter finding is on PORTS.md card 52.

_2026-09-24 — Craft details: share cards, structured data, "Which door?" (`feat/details`)._

**A share card for every page and post.** `npm run build` now starts with `npm run og:pages`
(`scripts/generate-og-pages.mjs`, rewritten): 154 cards, 1200x630, in the identity (indigo, a
gold frame, the Hannaford rendering in faint gold, the title in Castoro Titling fitted by
`src/lib/og-card.ts`, the wordmark under a door glyph; a post's eyebrow and its Sunday and
reading or its date). Text is set as outlines by opentype.js from the site's own .woff files
and rasterised by sharp, so it runs in CI with no browser and no new dependency; cards are
cached by a content hash and not committed. 8.6 MB in all, 64.5 KB at most, 3 to 5 s cold.
BaseLayout now ranks a route's card above a post's cover photo, and the old `og:pages`
script (which could not have run: it called an unimported `closeRenderer`) is gone. BaseLayout knows which routes have a card from the generator's manifest
(`src/data/og-cards.generated.json`), not from a glob of `public/og/*.png`: a lazy glob made
Vite publish every card a second time into `_astro/` (+8.97 MB, caught by comparing `dist/`
against main's). Net cost: `dist/client` 93.2 MB to 102.5 MB (9.0 MB of cards, 0.35 MB of
HTML); `/visit` mobile Lighthouse unchanged (perf 0.93, LCP 3.08 to 3.15 s before and after).

**Structured data.** The starter's LocalBusiness became one `["Church", "Organization"]` node
from Site settings (full address, the building's map point from OpenStreetMap, phone, email,
YouTube, Church Center and Wikidata in `sameAs`), /visit gained the Sunday service as an
`Event` with a weekly `eventSchedule`, and each post's `BlogPosting` now leads with its card,
names the church as publisher, and for a sermon preview is `about` its Sunday and cites its
reading. `src/lib/schema-vocab.ts` validates all of it offline: unit tests per builder and
`npm run check:jsonld` over the built site (378 pages, 895 blocks, no findings). A bug found
on the way: the accented post slug (`/post/händel-...`) reached BaseLayout percent-encoded and
missed its card.

**"Which door?" on Visit.** `DoorPlan.astro` draws the street side (Adams along the top,
Jefferson down the left, the drive, the tower, the lot) with a numbered pin per door, placed by
the doors' own words (`src/lib/door-plan.ts`). The list stays the interface: each door's name
links to its pin, which works with no JavaScript; with it, choosing a door lights the pin and
shows the church's words under the sketch. Geography from the church's History and Visit text,
OpenStreetMap and the library's photographs, drawn as a sketch, not a floor plan.

_2026-09-24 — The mobile speed pass (`perf/speed-audit`)._

**Measured first, one resource class at a time.** Home mobile LCP was 3.80 s locally (2.34 s
on production), and the LCP element was the hero's dated line. Blocking fonts, JS, images,
the slideshow frames, the fade-up, and purging the inline sheet to what the page uses each
moved it 0.1 to 1.2 s; removing the live-Sunday script alone took it to 1.73 s. That script
rewrote the dated line at the end of `<body>`, after the hero had painted, and a replaced text
node is a new LCP candidate; Lighthouse then counted every request already in flight (four
2400 px slideshow frames, the islands) in front of it. The full tables are in
`docs/agent/performance.md`.

**Four changes.** The live-Sunday function is defined in `<head>` and called inline beside the
hero's span, writing only when the text differs. Slideshow frames 2-6 wait in a `<template>`
until `load`, with the cross-fade held on frame 1 until they arrive (bytes requested before
`load` on Home: 1,360 KB to 579 KB; none under reduced motion). Sofia Sans is preloaded from the
home hero's body, which stopped its swap from re-arming LCP (a `<head>` preload did the same but
delayed first paint on every other page). Post-body figures use width descriptors and their
drawn width (a 268 KB portrait is 59 KB). Home is now perf 1.00, LCP 1.73 s in 5 of 5 runs;
`/blog` 0.98 / 2.10 s; `/visit` 0.93 / 3.15 s and the post 0.91 / 3.38 s are image-LCP pages
whose remaining cost is island JS, left as an owner decision in `docs/PENDING.md`. Rule 20's
limit is now documented as per CSS chunk, not per page (CLAUDE.md).

_2026-09-24 — The home hero shows people, and two hero fixes (`feat/hero-people`)._

**People in the hero.** Nathan approved replacing the building frames with five
photographs of the church at work: the worship team (frame 1, the LCP image), teenagers
over cards, communion being prepared, children on the chancel steps with Kendall, and
the congregation from the balcony. They are new keys in `scripts/data/page-images.json`
(`hero-worship`, `hero-teens`, `hero-communion`, `hero-chancel-steps`, `hero-balcony`),
each with its alt, its consent flag and, new, a `hotspot` that `page-images.mjs` writes
as a Sanity hotspot. The old keys stay (the tower feeds the 404, the sanctuary Wedding,
the building Contact). What to Expect's wide arch moved from the teenagers (now in the
hero) to the girls at a fellowship dinner, so no photo appears twice on Home; the
spare-image pool lends nothing on Home (checked on the fixture render). A dry run now
reports a photo it would upload, with a placeholder ref, instead of stopping the plan.

**The full hero honours hotspots.** Every frame was cropped dead centre, which put faces
under the headline. `heroObjectPosition` turns a frame's hotspot (mapped through any crop)
into `object-position`, as the split hero already did; no hotspot keeps the centre.

**Phone frames were blurry.** `sizes="100vw"` made a 390x844 DPR 3 phone fetch the 1200
variant for a picture cover draws 1271 CSS px wide (3813 device px). `heroSizes` states
the covered width with a media condition, so that phone now fetches 2400; a 1440 desktop
still gets `100vw` and the same 1600 (DPR 1) or 2400 (DPR 2) variant as before.

**Library labels.** `81f7ac_0d2d` is children on the chancel steps (not teens on outdoor
steps), `08181c_5d24` is a man handing a woman a listening headset (not a greeting), and
the Ministries youth photo's alt says the teens are singing.

_2026-09-24 — Light-only, Watch live, the menu's groups, the designer credit, and the menu test flake (`feat/light-only`)._

**Light-only.** Dark mode left Home practically unchanged (its identity is fixed
brand bands) and only flipped the cream reading pages, while costing each branch a
second design pass, dark-only clashes and about a third of its checks, so the site now
always renders light (CLAUDE.md rule 3, `site.theme` in `src/data/site.ts`). The theme
init never reads localStorage or `prefers-color-scheme` and never adds `.dark`; the head
says `color-scheme: light` and no longer offers a dark `theme-color`. The theme toggle
came out of the header, the footer rail and the mobile menu; `ThemeToggle.tsx` and the
`.dark` block stay, dormant. The dark axe sweep (`a11y-dark.spec.ts`), the dark runs of
`contrast.spec.ts` and `menu.spec.ts`, the dark styleguide shot and baseline, and the
dark pairs in `theme-tokens.test.ts` came off; the shoot scripts shoot light only.

**Watch live.** A "Watch live" link beside Give on the desktop bar (the nav's own quiet
link style, not a second plate) and above Give in the mobile menu (44px tap target),
to Site settings' live stream address, else the YouTube channel, else nothing; new tab,
`rel="noopener noreferrer"`. During the service it reads "Live now" with a pulsing gold
dot: Sunday, from the Site settings service time, for 75 minutes, on the church's clock
(America/Indiana/Indianapolis), start inclusive and end exclusive. The logic is
`src/lib/live-service.ts` (15 unit tests: before, at start, inside, at end, other days,
the visitor's zone, winter time, both DST changeover Sundays, a late service past
midnight); the header is upgraded by a hand-inlined copy in BaseLayout (re-checked every
minute and on every navigation) guarded by `live-service-inline.test.ts`, which also
runs both copies over two days of instants; the menu imports the module, because its
rows only render in the browser. The dot is `aria-hidden` and stops pulsing under
reduced motion; the words carry the state.

**The menu's dropdown group** (Nathan's review): "Our Church" is set in the rows' own
display face and size, is not a link, carries a small gold caret, and names a nested
list (`aria-labelledby`) whose links are indented 25px, one step smaller, under a thin
gold rule. Always open.

**The designer credit.** The footer rail now always carries "Designed by Nixon Creative
Studio" (Site settings' `footerCredit` / `footerCreditUrl` still override it), the
prefix in the rail's small caps and the name in Castoro italic with a gold rule that
draws in from the left on hover and focus (instant under reduced motion). Below `sm`
the small-print row keeps 5rem clear of the back-to-top chip.

**The menu test flake.** `tests/menu.spec.ts` clicked the server-rendered trigger before
the `client:idle` island had hydrated, and under load the click was lost. MobileNav now
sets `data-menu-ready` in a mount effect (not in the server HTML) and the tests wait for
it. `--repeat-each=10 --workers=4`: 70 passed, 10 skipped (the WebKit-on-Windows skip),
0 failed.

_2026-09-24 — Footer and mobile menu in the church identity (`feat/footer-identity`)._

The rollout plan's "footer carries the Praise & Proclaim mark and the four
goals". The 01 to 10 numbers came off the footer's link columns and the
mobile menu's rows (rule 11: a menu is not a sequence), and both lists are
now `<ul>`. The footer gained a row of the four goals under the poster row
(`src/components/church/GoalsRow.astro`, glyph, name and Who We Are's small
line, each to its band on /who-we-are, two by two on a phone), the Praise &
Proclaim mark as its sign-off in place of the italic tagline, and the
bottom line "An American Baptist congregation in downtown Muncie since 1859"
(`site.founded`, a new constant in `src/data/site.ts`). The stained-glass
photo texture is gone; the 1927 Hannaford rendering runs along the bottom
edge as faint gold line art (`src/assets/footer-rendering.webp`, the pencil
lines lifted off the paper into a four-step alpha, 31,556 B, used as a CSS
mask over the gold token, inside a `content-visibility: auto` box so it is
not fetched until the footer nears the viewport: the eager fetch measured
~75 ms of simulated LCP on /, and with the box the drawing is not requested
during load at all). The Pages column sets its list in two short
columns; Office now holds the hours, phone and email, and prints the street
only when the poster row above it did not, so the address appears once. The
wordmark moved to the base rail as the footer's home link. The mobile menu
gained the same goals, compact, at its foot, slotted into the island by
Header.astro; a goal followed from the menu closes the sheet (a new
menu.spec.ts test covers it, and the numbering test became a no-numbers
test). `src/lib/church-goals.ts` is the one code-side list of the goals,
outside the `church` scaffold capability because the chrome draws it on
every page; `ministry-goals.ts` reads its `GOALS` from it. The theme toggle
is untouched.

_2026-09-24 — The document list as a ruled list (`feat/document-list-rows`)._

DocumentList's one-to-four form gave up its arched door cards for a ruled list:
Nathan's call, from an approved mock, that the arch cards felt repetitive and an
arch doesn't suit a document. Each row is a three-column grid at desktop (the year
in Castoro Titling gold, an empty cell when there's no year, so titles still align;
the title in Castoro paper with its note beneath in italic taupe; the action at the
right, a gold UI-caps text link with a trailing arrow), stacking to year, title,
note, link on a phone, between a gold rule above the list and a hairline below each
row. The title is plain text now; the action link is the one control, and its
accessible name folds in the document's title (several rows in a list say
"Download PDF"). `documentForm()` in `src/lib/document-doors.ts` returns `'rows'`
in place of `'doors'` (tests updated); `DOOR_LIMIT` is now `ROW_LIMIT`. The
five-or-more register form is unchanged, styled to read as the same family (the
same heading grammar, the same gold rule). The dead door-card CSS (`.dl-doors`,
`.dl-door`, `.dl-head`, `.dl-body`, and their two breakpoint overrides) came out of
`globals.css`; the ruled list's own grid lives in `DocumentList.astro`'s `<style>`.

_2026-09-24 — Utility identity: /give, /contact, /404 and /privacy (`feat/utility-identity`)._

The four utility pages in the church identity (rollout plan step 8 and 10).
Hours.astro became the office door: a fixed taupe band with the door glyph and
the hours from Site settings as ruled days-and-times rows, split by
`src/lib/office-hours.ts` (unit-tested). GiveBand's /give h1 opener moved to
the indigo page-opener grammar with the basin drawn large in gold, so /give
no longer opens and closes on two gold bands; Home's gold h2 band is
byte-identical. /404 is an indigo apology with four glyphed doors (Visit, Who
We Are, Blog, Give; `notFoundPage` gained an optional fourth door pair and
lost its starter residue); /privacy has the same opener over one readable
column, and its fallback copy is this church's policy, not the starter
client's. `scripts/pages/contact.mjs` now uses the church's own headings
(Contact, Church Office Hours, Pastors' Office Hours, Notify Us), lede and
button labels, a hero photo no other page uses (the church at dusk,
`contact-exterior`), and prints the Tuesday hours once; `give.mjs` dropped
its two eyebrows; `not-found.mjs` names the four doors and drops the reused
tower photo. Dry runs only; `/styleguide/give` and `/styleguide/contact`
render the compositions from read-only fixtures.

_2026-09-24 — Beliefs identity: /beliefs and the RichText body in the church identity (`feat/beliefs-identity`)._

The overnight rollout's Beliefs branch, owning the RichText BODY (`RichBody.astro`,
`src/lib/rich-shape.ts`, the `.rt-*` CSS, now in `src/styles/ledger.css`); the band
heading stays the Visit pass's. **Grounds:** a new pure module, `src/lib/rich-ground.ts`,
gives each text band a ground from its place on the page: the cadence's paper turn stays
paper, its muted turn becomes a full-width brand band (indigo, brown or taupe), never
the colour of the band beside it or of the previous brand text band; SectionRenderer
passes it as `ground` and draws no divider beside a brand band. No schema change, no
colour field (rule 9). **Shapes (rule 11):** prose is always one reading measure (the
`run2` / `run3` newspaper columns are gone, in both flows), three or four h3 columns
hold at most 70 words each (`columnWords()`), a section of reading text sets its head
beside the text (`beside`), the row shape lost its decorative rules, and run-in labels
are italic heads instead of tracked capitals. **The page:** `scripts/pages/beliefs.mjs`
takes the church's own headings back (Our Basic Beliefs; Four Values Baptists
Emphasize with its four headings unmerged; Our Confession & Denominational Identity
Statement; Membership; Our Church Covenant; Our Baptist Affiliation; Have questions?),
drops every band eyebrow, and moves Membership before the covenant so the covenant is
read on the indigo. Not a word of doctrine changed. `/styleguide/beliefs` renders the
composition from `scripts/data/fixtures/beliefs.json`. Dry run only.

_2026-09-24 — Ministries identity: the four goals as the page's organising motif (`feat/ministries-identity`)._

The overnight rollout's Ministries branch, owning `src/lib/ministry-band.ts` and how
a Ministry band draws. The ministry document gains an optional **"Goal it serves"**
(`goal`: worship, the-way, witness, work; the ids of the goals on /who-we-are; in
NON_STEGA_FIELDS). `resolveMinistryBands()` now puts a derived **goal index** in front
of a page's first Ministry band when any ministry names its goal
(`src/lib/ministry-goals.ts`, `sections/MinistryGoals.astro`): "Our Goals" on the deep
indigo band, the four goals with their building glyphs and the church's bracketed
words, each listing its ministries linked to their bands. Nothing stores it, so it
cannot disagree with the documents, and with no goal answered it is not drawn.
Which goal a ministry serves is written only where the church's own words say so:
`scripts/set-ministry-goals.mjs` (dry by default, backup-first) writes Worship ->
Worship and Youth, Adult -> The Way from `scripts/data/ministry-goals.json`, which
quotes the line for each; Children and Outreach are left for the church. The rendered
block types gained a `DerivedBlocks` registry in `pageBuilder.types.ts` so a church
scaffold removal leaves `RenderedBlock` whole. `scripts/pages/ministries.mjs`: a window
hero (every age in three lights, photos no other page uses), no decorative small lines
on the hero or the timeline, and the two children's-church lines written as class
lines ("Kickstart Children's Church (102): Preschool - 2nd grade") so the timeline
reads each as a class with its room. Dry run only; `/styleguide/ministries` renders it
from a read-only fixture, with each ministry's goal taken from the answers file.

_2026-09-24 — History identity: /history in the church identity (`feat/history-identity`)._

The overnight rollout's History branch (`docs/superpowers/plans/2026-09-24-fbcm-rollout-overnight.md`),
owning HeritageBand's h1 opener path and the history composition. A band with no dates
that opens its page now draws as **`HeritageOpener.astro`**: the church's brown, the span
"1859 to <build year>" derived from the first timeline row and the build date
(`src/lib/heritage-opener.ts`, 7 tests), the h1 sized by length, the block's photo in a
door arch and `archive` in a lancet. The dated cream band and the undated brown h2 band
are untouched. `scripts/pages/history.mjs` restores the church's own heading "Our
History", opens on the Wix history page's own header photograph (the women's group) and
Pastor Cassius M. Carter, heads the timeline with the church's "highlights of our
history" and ends it with a **Today** row in the church's present-tense words (no year
typed), drops three decorative eyebrows, and corrects three era alts (the courthouse
engraving, a stone house in the snow, George Saunders). The Hannaford rendering stays on
Home only. Dry run only; `/styleguide/history` renders it from a read-only fixture.

_2026-09-24 — Visit identity: the Visit page and the shared looks it settles (`feat/visit-identity`)._

The Visit page composed from the approved prototype
(`docs/superpowers/prototypes/2026-09-23-visit/visit.html`) with Nathan's
four answers, and the shared components it restyles for every page: the
Timeline as the numbered door-step path (`src/lib/morning-path.ts`), the FAQ
band on the deep indigo, ImageText's people in arches with a small second
photo and a room board (`src/lib/photo-subject.ts`), the gold closing band,
the split and text-only heroes on the indigo brand band with the window
hero's facts and closing gold accent, SundayTimes' doors path, HeritageBand's
undated Our building on cream, and the RichText band heading on the one
grammar. Schema, additive and optional: `heroSection.headingAccent`,
`imageTextSection.detail`, `timelineRow.image`, and the timeline marker is
no longer required. `scripts/pages/visit.mjs` composes the page (dry run
only; waits on a deploy) and `/styleguide/visit` renders it from a
read-only fixture.
_2026-09-24 — Staff identity: /staff in the church identity (`feat/staff-identity`)._

The overnight rollout's Staff branch (`docs/superpowers/plans/2026-09-24-fbcm-rollout-overnight.md`),
owning StaffGrid, ScriptureBand and TeamGrid. **StaffGrid** is now a band of
lancet portraits, its ground derived from the group it shows
(`src/lib/staff-band.ts`: pastors gold, coordination brown, support taupe,
everyone paper), with the band h2 in `H2_DISPLAY` and a new optional `intro`
(the church's own paragraphs) beside it; it moved to SELF_CONTAINED in
`sectionCadence.ts`. **ScriptureBand** takes the Watchword band's verse
treatment on indigo-dark, highlights every occurrence of its accent word, and
gains an optional `heading` and `intro`. **TeamGrid** (unused) follows the staff
list layout. `scripts/pages/staff.mjs` recomposes the page under the church's
own headings: a two-light window hero of the Co-Pastors (library headshots used
nowhere else), Pastors & Staff, the pastors' whole letter (`#letter`, kept on
both /staff and /who-we-are until the owner decides), Church Coordination Team,
Deacons (with "What are Deacons?" restored), Support and volunteer roles, and
Every Member of this Church as the whole church section (1 Corinthians
12:4-6). Dry run only;
`/styleguide/staff` renders it from a read-only fixture until it is applied.
/ministries and /beliefs change with the two components.

_2026-09-24 — Wedding identity: the wedding page, the gallery, the document list and the quote (`feat/wedding-identity`)._

One branch of the overnight rollout (`docs/superpowers/plans/2026-09-24-fbcm-rollout-overnight.md`),
owning GalleryGrid, DocumentList and QuoteBlock. **GalleryGrid** now draws in two forms
chosen by its photos (`src/lib/gallery-form.ts`): every photo named is a row of door
arches on indigo-dark with each room's name under it; otherwise an arcade of lancets with
no text. The caption field is retitled "Name (optional)", same field. **DocumentList** is an
indigo band: one to four documents are cream door cards with a gold plate that says
"Download PDF" or "Open on <host>" (`src/lib/document-doors.ts`), five or more a year
register (the blog's publications). **QuoteBlock** is a gold band. `scripts/pages/wedding.mjs`
is recomposed (dry run only): the window hero with three weddings, Ella Mae Lemen's own band
off her staff document, the five rooms named in the church's words, Hanna and Nathan on gold,
"Weddings here" as an arcade, and the documents as doors; its PDF uploader now refuses to
upload without `--apply`. `/styleguide/wedding` renders the fixture. No schema field added.

_2026-09-24 — Journal identity: /blog, the archives and the post page in the church identity (`feat/journal-identity`)._

An identity pass over the "I1 Register" and "P2 Bulletin" designs, not a
redesign: their structure and every derivation stay. The home page's Church
Blog row became `src/components/blog/PostRow.astro` (DynamicList draws it,
markup unchanged) and the journal uses it everywhere a list of posts appears:
the register on /blog and every archive (paper tone, grouped under gold-ruled
years in the display face; the 4:3 plates became lancets), Worth coming back
for (the taupe band, `H2_DISPLAY`), and a post's More from this series (the
taupe foot band with the Sunday before/after doors and the gold All posts
plate). The opener is the indigo band, with the index's door showing its
post's featured image in a door arch. On a post, every ink is a brand token
and the cover hangs in a door arch with no caption (a slide uncropped under an
indigo door head, a photograph as a wide door). `weekOfLabel()` moved to the
church's day (`localDay()`), closing the PENDING item; `SeriesRow` gained
`cover` and `datetime`. No schema change, no page-module change.

_2026-09-23 — Home identity: the home page composed from the church blocks (`feat/home-identity`)._

The home page's six bands, ported from the approved prototype
(`docs/superpowers/prototypes/2026-09-23-home/home.html`) with Nathan's
overrides, and the section changes they needed, which also reach /visit,
/contact, /history and /give. **What to Expect** is the hymn board: the
Sunday-times band redrawn as a full-width brown band with the times set
straight onto it in gold numerals (`src/lib/hymn-board.ts`), optional
`intro`, `notes`, `photos` and `cta` fields, the photos in a wide door arch
with a lancet over its corner. **Our Goals** is the link-card doors with a
new `glyph` per card, drawn on indigo-dark as the four goals. **Our
Building** is the heritage band with `dates` and an `archive` photograph: a
fixed cream band, the Hannaford rendering multiplied onto the paper, and a
dated list ending in the present, whose year is the build year
(`src/lib/heritage-dates.ts`). **Church Blog** is the journal list as taupe
rows with a lancet cover each, and **Give** is gold on every page, in both
themes. The hero is unchanged except that its buttons are the gold plate
(the one button family, ruled the same day). `scripts/pages/home.mjs`
composes it and waits on a deploy before `--apply`; `/styleguide/home`
renders it from a read-only fixture until then.

Task 6 closed the review's loose ends. **One heading grammar** for every
church band h2, Castoro Titling at `text-h2` (`H2_DISPLAY`,
`src/lib/heading-grammar.ts`): the arched-door LinkCards heading came down
from `text-title` and HeritageBand's moved from the reading face through a
new `SectionHeading face="display"`, measured before and after at 1440 so
that only those headings moved. The footer's closing band now reads "10:45
am", not "10:45 AM" (`clockParts()` in `live-sunday.ts`). The 1890 date is
cut to its move clause. The greeter photo, already on Who We Are, left the
home page for the teenagers at a table with a Bible (Nathan's decision).
`goalsEndDark` went with its last caller; GiveBand's h1 width is a `wide`
prop instead of two fighting `max-w` classes; the blog rows print and stamp
one day, the church's (America/Indiana/Indianapolis); a seed dry run refuses, with instructions, rather than
uploads (`scripts/lib/page-images.mjs`, now tested).

Gates: 792 unit tests across 53 files, `test:scripts` 24, `astro check` 0
errors, format clean, `audit:studio` clean, Playwright 339 passed, 1 skipped.
Sheet 127,475 B inline on the home page (limit 147,456 B). Parity
recaptured at the fixpoint, 164/164, the sheet identical on both builds.

_2026-09-23 — Who We Are: brand palette only, church year removed, window proportions (`fix/window-height`)._

The site owner reviewed the identity pass below and ruled on three things.
**Brand colours only.** The off-brand identity tokens (the six season fills,
goal green and purple, mint, gold-light, night green, season-deep and the
purple and green inks) are gone from `@theme` and `.dark`; the bands now read
`--color-band-indigo` (#292854), `-deep` (#1c1b3a), `-gold` (#d59b29),
`-brown` (#39251e), `-taupe` (#b5aba3) and `-ink` (#1c1b3a), with the brand's
own dark values (#22214a, #1b1a3a, #2b1b16) under `.dark`. The window hero is
indigo with gold accents, the Watchword band indigo-dark, the goals indigo,
gold, brown, taupe (dark, light, dark, light: brown-mid could not carry the
gold accent at body size, so Witness took brown and Work taupe), the pledge
indigo, the letter brown-mid, the link-card doors indigo, and the rule button
indigo (gold on dark bands). The nave scrim is 80% indigo-dark, measured over
pure white. `theme-tokens.test.ts` measures every pair in both themes.
**No church year.** A Baptist church does not follow it: `church-year.ts`,
its test, `SeasonLine.astro`, the season lookup in Hero, the styleguide's
season fixtures and the daily 05:15 UTC deploy schedule are removed.
**The window fills its column.** The arches started ~290px below the words at
1440; from 1200px the window now takes 8/12 of the grid, the headline is a
modest `clamp(36px, 3.5vw, 54px)` and the text's bottom padding shrank, so
the middle arch's top sits within ~30 to 65px of the label's top at 1024 to
1920, both faces still inside it. Sheet 119,658 B inline on the home page
(from 120,848 B); 760 unit tests across 50 files. Parity 163/163 after the
recapture.

_2026-09-23 — Who We Are "alive": the church identity pass (`feat/who-we-are-alive`)._

The Who We Are page was rebuilt from the prototype
(`docs/superpowers/prototypes/2026-09-23-who-we-are/c-alive.html`) as a set of
reusable church sections, so the identity can reach other pages later. New
primitives in `src/components/church/` (ArchFrame, BuildingGlyph,
WatchwordMark, SeasonLine) and a `rule` variant on CtaLink (square, gold rule
beneath: the site owner rejected the prototype's arched button head, and ruled
out visible photo captions anywhere). New identity tokens in globals.css
`@theme` and `.dark`, every pair gated in `theme-tokens.test.ts`, with the
geometry in a `/* Church identity (2026-09-23) */` block. The season of the
church year is derived from the date (`src/lib/church-year.ts`, rule 15), so
the hero band and the season line turn over with the daily scheduled deploy
(`.github/workflows/deploy.yml`, 05:15 UTC).

Four new blocks in `churchSections.ts`: `watchwordSection` (WatchwordBand,
with `src/lib/highlight-words.ts` picking out "praise" and "proclaim"
stega-safely; `RUN_SOURCE` is now exported from `preview-stega.ts`, noted on
PORTS.md card 29), `goalsSection` (GoalsBand, four goals in four compositions
and colours chosen by position through `src/lib/goal-layout.ts`),
`pledgeSection` (PledgeReading) and `letterSection` (PastorsLetter). Hero
gained `layout: 'window'` (the season band with a triple lancet, dropping into
the Watchword band when that is the next block, through SectionRenderer's
`dropInto`), and `linkCard` gained an optional `image`: when every card has
one, LinkCards draws arched doors. `glyph` joined `NON_STEGA_FIELDS`;
`isDarkBand` and `heroOverlay.ts` learned the new bands; the Help guides cover
each block. The site sheet is 120,810 B inline after the merge of the dead-CSS
trim; the CSS inline ceiling went to 155,648 B mid-branch and came back to
147,456 B once the trim landed (rule 20). 765 unit tests across 51 files.

`scripts/pages/who-we-are.mjs` is recomposed around the new blocks but NOT
applied: the schema has to deploy first, then
`npm run seed-pages -- --only who-we-are --apply` uploads the Welcome Booklet
and writes the page. Until then `/styleguide/who-we-are` renders the
composition from `scripts/data/fixtures/who-we-are.json`
(`scripts/page-fixture.mjs`, page-agnostic). Parity recaptured: before the
recapture every page differed only in its inline sheet, and `/styleguide` in
its new fixtures; after it, 163/163 PASS with the sheet at 120,810 B on both
builds. Open loops are in `docs/PENDING.md` under "Who We Are alive".

_2026-09-23 — Dead CSS trimmed from the inline stylesheet (about 34 KB per page)._

The inline site sheet was close to its 147,456 B ceiling (CLAUDE.md rule 20):
the post-page sheet was 143,982 B. Most of the waste was Tailwind generating
utilities from files that never render, because v4 scans every tracked file.
`globals.css` now carries `@source not` for archive/, modules/, scripts/,
tests/, prototypes/, the Playwright configs, src/sanity/, public/, brand/,
the root config files, `src/**/*.test.ts`, and the starter's unimported
component-library files (eleven shadcn / Magic UI primitives, Starwind,
PrimeReact, the orphaned CopyEmailButton). New `src/lib/css-sources.test.ts`
fails if anything in src/ imports a file excluded that way, so reaching for
one of those components later is a loud failure instead of a silently
unstyled one. Also removed: `starwind.css`'s import (Tailwind never compiled
it, so its `@theme` blocks shipped verbatim and did nothing), the unused
chart, sidebar and Starwind colour tokens (also out of
`brand/brand.config.json`), `@import 'shadcn/tailwind.css'` in favour of its
data-state variants vendored verbatim (the import emitted scroll-fade and
shimmer `@property` rules unconditionally), and globals.css rules for the
archived portfolio module and two long-gone post-body hooks. Every removed
class was checked against all built output. Sheets: home and pages 133,453 B
to 99,471 B; post pages 143,982 B to 110,148 B. Left in place, with reasons,
in the branch report: utilities generated only by explanatory comments
(`ring`, `text-cream` and about ten more, roughly 770 B) and Sofia's Greek and
Cyrillic `@font-face` subsets (about 860 B).

_2026-09-23 — No more visible captions printing the photograph's alt text._

The owner: "we don't need the photos on the website to have captions like
this, the pictures speak for themselves." `ImageText.astro` printed the
image's alt text under every shape as a `figcaption` (a policy from the
RichText Ledger and photo-shapes pass, "THE CAPTION IS THE ALT TEXT"), and
`SundayTimes.astro` did the same for its borrowed frame photograph. Both are
now silent: the alt text stays on the `<img>` for screen readers, nothing
prints it as reading copy. The P2 Bulletin's plate caption
(`src/pages/post/[slug].astro`) had a related but narrower bug: when a series
slide's cover carried no editor-typed caption, it fell back to the cover's
alt text; that fallback is gone too, and the plate now falls back to the post
title instead. Kept as-is: `GalleryGrid`'s per-image caption and
`VideoEmbed`'s caption, both real editor-typed fields distinct from alt, not
a restatement of it. Dead CSS removed with the markup: `.ph-cap`, `.ph-gcap`
and their shape-specific margin overrides; `.ph-tick` stays, it is also the
band eyebrow's hairline. The site stylesheet dropped from 134,013 B to
133,305 B; the parity baseline was recaptured (162/162 PASS, the recapture
and rebuild agree on the byte count, the fixpoint CLAUDE.md rule 20 asks for).

_2026-09-23 — The header no longer shifts the page when you scroll._

On every image-hero page the first 8px of scroll removed overlay mode's negative
margin, so the whole page dropped by a header height (measured on the live home
page: `#main` from 0 to 89px). The header is now sticky at minus its own height, so
it scrolls away with the page, and once past 150px a scroll up pins it: `top` eases
to 0 and the bar slides in over the content, and a scroll down slides it away again.
The layout slot never changes (`#main` holds still at every scroll position, 375
and 1440, both themes), and a new test in `tests/anchors.spec.ts` guards it.

_2026-09-23 — Hero headlines sized by their own length; the Sunday band's photograph hung in the grid._

The RichText Ledger and photo shapes fixed the text and text-and-photo bands but left
two things the site owner still called out on production. Every hero h1 was titling
capitals at `text-h1` (or `text-display` on the home hero) inside a 12ch measure
whatever its length, so the 76-character /who-we-are statement set as nine lines of
capitals and /visit, /beliefs and /give each filled the first screen with four. And
the home page's Sunday band hard-coded its borrowed photograph as a half-page 4:3
`bleed-right` crop.

`src/lib/headline-scale.ts` now classifies a headline from its stega-cleaned text
into `poster` (short: today's look, unchanged), `title` (medium: capitals one size
down at the new `--text-title`, 18ch) or `sentence` (long: Castoro, sentence case,
`text-h2`, 22ch), with the longest word demoting a headline whose widest word would
not fit a 320px phone at that scale. Hero, the text-only hero through
`SectionHeading`'s new `scale` prop, the band-opening h1 of `GiveBand` and
`HeritageBand`, and the journal `Opener` all use it. Measured at 1280px: /who-we-are
went from 9 lines and 766px to 4 lines and 233px; /visit and /beliefs from 4 lines
(341px) to 3 (190px); /give from 4 (341px) to 3 (190px); /ministries, /staff and
/blog from 3 to 2. The posters (/history, /wedding, /contact, home) are byte-identical.
A sweep from 320px to 1680px in 16px steps found no word split across lines and no
horizontal overflow on any of the eleven pages.

`SundayTimes` now hangs the photograph inside the grid in ImageText's frame (`.ph-hung`
hairline, `.ph-cap` caption), sized from the asset's own aspect via `photoAspect()`:
landscape fills the right column at 3:2, squarish and portrait pictures are held to
26rem and 20rem at 4:5. At 1280px it is 373px tall against a 581px left door (it was
468px, bled to the viewport edge).

_2026-09-22 — Five branches integrated to `main` (`integrate/2026-09-23`)._

The RichText Ledger and photo shapes, `chore/cleanup`, the Studio pass
(`feat/ministry-bands` with `feat/editor-guide`, `feat/studio-readability` and
`feat/settings-placeholders` beneath it), the journal polish (with
`feat/journal-index`) and the photo library's two data files were merged in that
order on one integration branch. The code conflicts were small: `SectionRenderer`
now resolves Ministry bands first and then runs the Ledger's photo-shape pass over
the resolved rows, so a Ministry band with a photograph gets a photo shape like any
other ImageText band; the dead `proseBody` copy in `richSections.ts` stays deleted
(the live one in `sections.ts` carries both `h4` and the mailto/tel link fix); and
`scripts/pages/ministries.mjs` loses both of its now-unused helpers. Site settings
placeholders are filled at the fetch chokepoints, before the Ledger or the photo
classifier measures any text, so the order needed no change. Parity was recaptured
once on the integrated tree and proved as a fixpoint. Full conflict log and gate
output are in the integration report.

_2026-09-22 — The RichText Ledger and photo shapes: a photograph belongs to its text, not to a column below it._

A per-section critique of the deployed art-direction site (92 section screenshots at
1440 with real scrollbars, 12 phone pages) found the vocabulary had landed but the
composition had not: about half the site's bands were the same heading-left,
prose-right shape, and every ImageText photograph sat as a large 16:9 rectangle
below the text in the opposite column. Nathan: "the whole huge rectangle in a
different column just looks bad and I don't see other websites doing it." An audit
of thirteen church sites (Two Ten Creatives' "best of 2026" list plus Highland Park
Presbyterian and Peachtree Church) confirmed it: nobody does that. Two variant
loops, each judged against a prototype approved as the visual spec, replaced it.

`RichTextSection` now lays its body out from the body's own shape (the "Ledger"),
classified in `src/lib/rich-shape.ts`, first match wins: `row` (a band with a
heading whose body has no h3, h4, list or quote, 3 or fewer paragraphs, 80 words
or fewer),
`columns` (2 or more h3 groups whose bodies are only paragraphs, 150 words or fewer
per group), `sections` (any other body with an h3), `register` (8 or more
paragraphs, at least 80% of them 35 words or fewer), `ledger` (lists of 3 or more
items carrying at least 40% of the words) or `prose`. A body h2 counts as an h3, a
blockquote is its own piece, a numbered list stays an ordered list, and a body with
h4 but no h3 has its h4s promoted to h3 (final-review fixes, 2026-09-22). Nothing
is decided from a field. `ImageText` now places its photograph by the photograph's
own shape, classified in `src/lib/photo-shape.ts`, first match wins: `window` (the
page's first portrait, aspect 0.85 or less, set in a lancet arch taken from the
church's own window tracery), `frame` (any later portrait of aspect 0.85 or less), `legend` (aspect 1.8 or
more with a "left to right" paragraph over 3 to 8 listed names), `plate` (aspect
under 1.25 with a year from 1500 to 1949 in the alt or eyebrow), `ground` (aspect
1.3 or more and 2000px wide or more, not the band straight after a photo hero, and
a second one only 4 or more rows after the first on a page of 6 or more rows) or
`row` (beside the text, the default). A page-level pass assigns shapes across all
of a page's photo bands together, so there is at most one window and at most two
grounds per page, and an editor swapping one band's picture can change another
band's shape.
One shared renderer, `RichBody.astro`, draws both, so a photo band's prose and a
text band's prose read as one grammar. See `docs/agent/components.md`.

Two new type sizes were added to the theme: `--text-item` and `--text-dense`, no
more. Zero Sanity schema changes for Parts A and B; one deliberate exception
afterward (see below). Ten tasks, subagent-driven, Sonnet for the mechanical span
splitting and classifiers, Opus for the two renderer rewrites and both gate
passes.

**The stylesheet crossed the inline limit mid-branch.** The new `.rt-*` and
`.ph-*` CSS grew the site sheet from 122,466 B to 133,535 B, past the
131,072 B threshold that had kept it inlined since plan 2c, and every page
silently fell back to a render-blocking linked sheet with no gate noticing
(parity is the only gate that would have caught it, and it was mid-branch by
design). Fixed by splitting the inline-asset limit in `astro.config.mjs`: CSS
files alone get a 147,456 B ceiling, kept under the embedded Studio's
165,056 B sheet so the Studio never inlines; every other asset keeps the
131,072 B limit. CLAUDE.md rule 20.

**One schema change, made deliberately mid-branch with Nathan's sign-off.**
Opening the Studio's Text field on the Ministries Adults band, which the
seeded content already carried as `h4`, crashed with "Could not find Sanity
schema type for style: h4". The section body schemas had never declared it.
Added `h4` ("Small heading") to the `proseBody` style list in `sections.ts`
and `richSections.ts`, the one place both files need it; typegen and a
render-identity diff (`dist/client/ministries/index.html` byte-identical
before and after) confirmed the schema widening changed nothing already
built.

**The ground's eyebrow moved from gold to cream.** The plan specified
`text-gold` for the ground's eyebrow, matching the prototype, but measured at
2.86:1 on the home page's ground photograph, below the 4.5:1 AA floor for
16px UI text, and the failure was real rather than a test artefact (confirmed
under the words themselves, not just the whole eyebrow box). Switched to the
same `text-bg` cream the full-bleed hero's own eyebrow already uses over a
photograph, per the plan's brand rule that gold is never set as text over a
light or uncertain ground; measured 7.18:1 or better on every ground
afterward.

Gates: 632 unit tests (up from 588), `astro check` and lint clean, Playwright
305 passed / 0 failed / 1 skipped by design (chromium 171, chromium-scrollbars
68, webkit-iphone 66). Parity recaptured twice, reaching a fixpoint both times
at a 133,857 B inline stylesheet, 162/162. Studio click-to-edit was verified
in Nathan's signed-in Chrome against local `wrangler dev` on the Ledger's said
lists, piped table, run-in labels, the lancet heading/body/caption, and the
legend names. Open items, content findings and parked minors are in
`docs/PENDING.md`.

_2026-09-22 — The service time, address, phone and email live in one place._

The page seeds had typed Site settings values into 46 places across 14 documents, so a
new service time meant a hunt. Site settings placeholders (`{time}`, `{address}` and six
more, `src/lib/settings-placeholders.ts`) are now filled at the two fetch chokepoints,
`sanityFetch` for the build and `previewFetch` for Presentation, so no component needed to
change and the editor sees the real value in the preview. `seed-pages` converts typed
copies before writing, and `scripts/settings-placeholders.mjs` is both the one-time,
backup-first migration and the standing audit (`--check`). The converter is narrow on
purpose: "(Mark 10:45)" and the "10:15-10:45 a.m." fellowship hour look like the service
time and are left alone, and the script refuses to write if any change fails to fill back
to the church's text. Parity was 162/162 with no placeholders in the data, and a local
build that simulated the migration changed only "10:45 AM" to "10:45 am". Same branch:
blog posts no longer default their Author to "Your Name", staff members get a "Show on
the Staff page" switch, Presentation labels the Blog page "Blog", guide links lost a double
slash, and scheduled publishing is switched on pending one repo secret.

_2026-09-22 — The Studio made easier to read._

Nathan found the Studio hard to read. The cause was measurable: every label, list row
and form field was set in Castoro, the site's reading serif, at Sanity's small UI sizes,
and the Help guides drew their prose in the theme's muted grey (6.73:1 in the dark
scheme against about 14.6:1 for ordinary text). The interface stack is now the system
sans (his choice), with Castoro Titling kept for pane headings; `brand.config.json`'s
`studio.fonts.body` was changed with it so `apply-brand` writes the same line back. The
guides' paragraphs and leads are no longer muted (14.59:1 dark, 14.61:1 light). The guide
icons are `@sanity/icons` components chosen by name (`src/sanity/guides/icons.ts`)
instead of emoji, which Windows drew small and unevenly. The workspace title "My Studio",
which also named the Studio's own photo source in every image menu, is now "First
Baptist Studio", and the church-at-a-glance pane no longer says "business".

_2026-09-22 — The Studio's Help guides, rewritten for the church secretary (PORTS.md card 41)._

`src/sanity/guides/content.ts` was still the starter's design-studio template and had
been unhooked from the desk on 2026-09-19. It is now ten guides in five categories
(Start here; Sundays and notices; Blog, staff and ministries; Pictures; When something
is wrong), each one a job the secretary will actually do, following the stonesteps-50k
rewrite. They sit in the Help group under "How the website works" and "Your church at a
glance". Every click path was checked against the schemas and then walked in the real
Studio, which corrected several guesses (there is no Discard or Unpublish in these
menus, the Media tool's tags sit on the right, and Presentation lists pages by their own
titles). The walk also found things the Studio cannot do yet, most importantly that the
service time was copied into about fifteen bands at seed time and that the `ministry`
documents are read by no page; those are listed in `docs/PENDING.md`. A guide on how a
band's picture decides its shape is drafted there; it waited for
feat/richtext-ledger-photo-shapes, which merged to `main` with this work on 2026-09-22.

_2026-09-22 — The journal polish: the post page as a bulletin, the archive as a register._

The journal (142 posts, /blog and its archives) was the one part of the site the
art-direction pass had not redrawn. An audit (`docs/superpowers/prototypes/2026-09-22-journal/audit.md`)
found the index showing the same posts twice, a "This week" band eight months stale,
a grid made of sermon slides, blockquotes louder than the sermon, Wix underlines on
130 posts, two event tables stored as bullet lists and dead `#viewer-` anchors. Nathan
chose P2 Bulletin and I1 Register from five prototypes. The post page now leads with
the Sunday's order derived from the post itself (`sermon-derive.ts`: Sunday, reading,
series; `post-body.ts`: tables, points, Q and A, the reading), hangs the series slide as
a plate or bleeds a real photograph, and ends without the closing CTA band. The index
and archives are a register grouped by year, with text filters, a de-duplicated "Worth
coming back for", a door that says "This Sunday" only when true, year spans on the pager
and a thin state for small archives. Built by two parallel Opus agents (post page;
index) from the shared derivation module, integrated and gated in the main session;
parity recaptured at 162/162 as a fixpoint (non-journal pages changed only by the
shared stylesheet's checksum, proved page by page).

_2026-09-21 — The art-direction pass: a full identity and layout rebuild off the generic starter look._

Nathan's read on the deployed plan-2 site was blunt: "very generic and plain... not
portfolio quality... I wouldn't hand it over to the client." Research against a
rubric scored it 6/20 against the best church sites in the country (King's Chapel,
Trinity Wall Street, Washington National Cathedral, St Bride's, St Paul's London),
and a photo-inventory audit found 118 real archive photographs against 22 in use.
The type system is Castoro Titling (capitals only, no weight axis), Castoro (roman
and italic) and Sofia Sans Semi Condensed, chosen from a five-system specimen page
after the first proposal (Fraunces / Newsreader / Archivo) was rejected as "typical
ai chosen fonts". Thirteen tasks, run as subagent-driven development with a fresh
implementer per task and a task-scoped review after each:

Header, footer and mobile menu rebuilt in the Stone Steps chrome idiom (an
overlay header that goes transparent over a full-bleed hero, a drop-from-top
indigo menu with numbered rows and a window-texture background, a footer with a
live-updating "this Sunday" line and numbered columns). The hero gained a
cross-fading photo slideshow with a WCAG 2.2.2 pause control, a live dated Sunday
line (`src/lib/live-sunday.ts`, server-static then client-upgraded), and
display-scale titling type. Every page-builder section was redrawn into the same
editorial grammar: ruled rows, asymmetric grids, hairlines instead of cards,
oldstyle figures, sticky narrow columns. A new shared derived-data module,
`src/lib/spare-images.ts`, computes a pool of "spare" photographs once per page
(from image/gallery/heritage blocks and unused hero frames) so a statement band,
a Sunday-times door photo and a heritage detail strip can each borrow a real
photograph with no schema change and no image ever borrowed twice. The journal
(blog index, post template, 404, privacy) moved into the same reading face. A
motion pass added scroll reveals on photographs and numerals, one hover language,
and two ambient loops, with `prefers-reduced-motion` honoured throughout.

Zero Sanity schema changes. Every task passed its own spec-and-quality review,
several with fix rounds; load-bearing cross-task defects (a missing dark-mode
value for `--color-gold-ink` that failed 34 axe-dark checks site-wide, a hero
frame borrowed for the Sunday-times door that silently duplicated a photograph
elsewhere on the home page, a plan instruction to delete the hero's pause control
that would have shipped a WCAG 2.2.2 violation) were caught and fixed before they
could compound. Closing gates found one real regression the per-task reviews
missed: `StaffGrid.astro`'s email links sat in a `grid-cols-2` card and overflowed
their column by up to 12px at the 320px reflow gate, because `overflow-wrap:
break-word` does not reduce a shrink-to-fit element's own intrinsic width (fixed
with `max-w-full`; the general lesson is CLAUDE.md rule 18). Merged to `main` at
`183a61f` and deployed. Three unused starter font packages and three dead starter
components (`FeaturedWork.astro`, `FeaturedJournal.astro`, `ProjectCard.astro`)
came out in the same closing pass. `playwright.config.ts` lost its `PORTABLE`
marker here: it now carries FBCM-specific `testMatch` entries (PORTS.md card 35).

_2026-09-06 — The starter catches up: Sanity phase 1, the family test standard, and two workflows harvested from the retiring church starter._

The starter had become the odd one out. It is structurally the canonical source (57 files carry the `PORTABLE` marker, PORTS.md has 44 cards, every client repo's `scripts/sync-check.mjs` diffs against it), but its stack and its gates were older than the sites it governs.

**A — Sanity phase 1** (PORTS card 10). `sanity` 6.4.0 to 6.9.1, `@sanity/vision` to 6.9.1, `@sanity/ui` 3.3.5 to 3.5.4, `@sanity/client` 7.23.0 to 7.26.2, `@sanity/visual-editing` 5.4.5 to 5.7.3 in both `dependencies` and `overrides` (npm refuses the whole install with EOVERRIDE otherwise), `@sanity/preview-url-secret` 4.0.8 to 4.1.5 (5.7.3 and 6.9.1 both want ^4.1.2, and 4.0.8 would nest a second copy). Stops at 6.9.1 deliberately: 6.9.2 is a PATCH release that crosses to `@sanity/ui` 4, which is a real migration. `@sanity/icons` stays on 3.x hoisted and the `sanity-plugin-utils` 2.0.6 override stays pinned. The same set is already human-verified in a signed-in Studio on presacademy, reid-design-site and mas-monograms. Verified here: exactly one `@sanity/ui` and one `styled-components` on disk and in the lockfile, one `errors.md#` bundle, typegen byte-stable, parity 10/10 after re-capture (the Studio's vendor CSS chunks moved; no page content did).

**B — The family test standard** (new PORTS card 35). The repo had `ci.yml`, `deploy-staging.yml` and `publish-due.yml`, no Playwright, no Lighthouse, and a CI job that ran typegen, build and the unit tests only. It now runs the family's whole gate: `astro check`, eslint, `prettier --check`, unit tests, `check:links`, the four Playwright suites on chromium and a WebKit iPhone profile, and a separate `lighthouse.yml` with an explicit url list and accessibility as a hard gate at 1.0.

Turning gates on for the first time is where the value was. `astro check` reported **222 errors**, and 163 of them were one bug: `sanityFetch(query, {}, null)` let TypeScript infer `T` from the empty fallback, so every page helper resolved to `Promise<null>` and every property read downstream was "does not exist on type 'never'". Two overloads on `sanityFetch` name what an untyped GROQ projection actually returns. The rest: `modules/` was being type checked in place when it is staged by design; nine components each redeclared a narrower image type than the projection returns (one shared `SanityImageObject` now); four hand-authored "U7" projected block types had drifted from the generated ones, which was a TODO the type check closed; a patch-builder interface that made `.setIfMissing(...).commit()` uncompilable; a spacer-divider branch testing for a variant the schema has never offered.

`check:links` found **135 broken internal links across ten pages**, all one cause: the nine opt-in module routes were treated as visible-unless-switched-off, like core sections, so a fresh clone rendered a footer and a nav full of links to routes it never builds. `getSectionVisibility` now has two rules, one per kind of route.

The Playwright suites found three real bugs on their first run: two region landmarks with the same accessible name on `/privacy`; `text-foreground/60` under 4.5:1 in two places; and every `<select>` on `/contact` with no focus indicator at all on Safari and iOS, because a Tailwind `focus:ring` is a box-shadow and WebKit drops box-shadow on native form controls. Chromium showed nothing wrong for that last one, which is the argument for running the sweep on both engines.

The format pass was verified with `npm run parity`, not by eye. A prettier pass can silently eat a meaningful space in an Astro template, and the one apparent text difference turned out to be React's `<!-- -->` separator moving where the parity normalizer collapses whitespace; the real `dist/client` HTML still reads "How did you hear about us? (optional)".

**C — Harvested from `ncs-church-starter`** before it is retired as a second library of record: `sanity-backup.yml` and `uptime.yml`, in the church starter's template stance (gated, schedule commented out, project id and origin read from repo variables) with the fixes the client repos had already earned folded in, encrypt-before-upload and the `--project-id` flag. The church-specific schema types were deliberately not taken; that is a separate decision.

---

_2026-08-28 — The Squarespace-grade editor: Astro 7, Sanity 6.4, embedded single-package Studio, live preview, in-canvas section controls._

The template takes the whole modern stack its descendant presacademy pioneered, so every future site is born with it. Four phases, each gated before the next.

**A — Framework upgrade.** Astro 6.3 to 7.2, `@astrojs/cloudflare` 13.5.5 to **14.2.4 exact** (the last release whose wrangler peer range fits the pin below), `@astrojs/react` 6, `@astrojs/mdx` 7, `wrangler` pinned `~4.110.0` (PORTS card 14), react/react-dom/react-is pinned **exact** 19.2.7 (card 13), and the `overrides: { vite: "^7" }` pin removed (it broke Astro 7's prerender step). `scripts/with-workerd.mjs` is now wired into `npm run build` (card 1), so the Windows prerender crash is handled rather than merely documented. Plus `session: false` in `astro.config.mjs`, `nodejs_compat` in `wrangler.jsonc`, `assets.not_found_handling` removed, and deploy switched to `wrangler deploy -c dist/server/wrangler.json`. Adapter 14 splits the output: `dist/client` is the static site, `dist/server` the SSR bundle.

Parity baselines were re-captured. Every diff across all nine routes was categorized first, and all of them fell into four framework-caused classes with nothing structural left over: the `<meta name="generator">` version string; `<astro-island uid="...">` (a generated identity, same family as the `prefix` the harness already normalizes); inline `<script>` and `<style>` bodies (esbuild and lightningcss changed their output); and whitespace inside text nodes (the Astro 7 compiler trims it). No class, id, aria, href, JSON-LD or text changed anywhere.

**B — Sanity 6.4 pin set and the studio fold.** The nested `studio/` package is **gone**. Schemas, structure and components moved to `src/sanity/`, the configs to the repo root (`sanity.config.ts`, `sanity.cli.ts`): one `package.json`, one `node_modules`. That is the real fix for the dual-module-tree crash that took presacademy's production Studio down on 2026-08-26 (card 10); `resolve.dedupe` is kept anyway as cheap insurance against a fork reintroducing a second resolution root. The Studio is now **embedded at `/studio`** through `@sanity/astro` and rebuilds with every deploy, so there is no hosted Studio to drift and no `studio:deploy` step; `sanity.cli.ts` deliberately omits `studioHost`/`deployment` so a stray `sanity deploy` cannot recreate the split. `buildLegacyTheme` (light-only, which left the Studio's dark mode all-white) gave way to `@sanity/ui`'s `buildTheme`; `apply-brand` now rewrites the Studio's two font stacks instead of a dozen legacy colour variables, and `brand.config.json`'s `studio.themeProps` became `studio.fonts`. `sanity-plugin-iframe-pane` retired in favour of the Presentation tool. CI lost its studio-prefix steps. Verified: exactly one `@sanity/ui` on disk, exactly one `errors.md#` chunk in the build, typegen byte-stable, standalone `npx sanity build .studio-dist` green, and the embedded Studio mounting in a real browser.

One markup change arrived with the refreshed lockfile and is unrelated to the fold: a newer react-aria inside `sonner` adds `data-react-aria-top-layer="true"` to the toaster region. After masking the framework-caused classes above, that attribute was the **only** residual difference on any page, which is what proved the fold itself render-neutral. Baselines re-captured a second time to absorb it.

**C — The preview stack** (cards 10 and 11). `src/lib/cms-preview.ts` (a second, runtime, draft-and-stega Sanity client, with this template's own enum fields seeded into `NON_STEGA_FIELDS`), `src/lib/preview-auth.ts` (a token fingerprint in the preview cookie, not the package's forgeable `'true'`), `/api/draft-mode/enable` and `/disable`, `/preview/live` (an SSE proxy over Sanity's listen API, never a poll), `/preview/[...slug]`, `PreviewLayout.astro` (chrome-less, forced motion end-states, the embedded-frame exit-button fix, and the click interceptor carrying this template's route map), `VisualEditingOverlay.tsx`, plus `src/sanity/resolve.ts` and a `PreviewNavigator` page list wired into `presentationTool`.

Because this template is page-builder-first, the four builder pages and every custom `page` doc preview in **full fidelity** through the same `SectionRenderer` the live page uses. The bespoke pages (faq, journal, privacy, 404) preview as their editable surface with a note saying so. (Contact was a fifth until plan 2b made it a `page` document, so it previews in full fidelity now.) No page-builder conversion was attempted: that is card 12 and a separate job.

Everything **fails closed** without `SANITY_TOKEN`, and legibly. The preview entry points answer 503 naming the missing pieces rather than throwing a Sanity client error, because a fresh clone hitting `/preview` should read as "not set up yet", not as a bug in the template.

**D — In-canvas section controls** (card 17). `src/lib/preview-edit-attr.ts` plus a preview-only wrapper in `SectionRenderer`: with `editDoc` absent the wrapper is a `<Fragment>` and renders nothing at all, which is why the static build stayed byte-identical and `npm run parity compare` passes 10/10 with the feature installed. The `pageBuilder` arrays gained a shared grouped, searchable insert menu (`SECTION_INSERT_MENU` in `sections.ts`), which is the menu that opens **in the canvas** when an editor inserts a section. The seeded in-Studio guide gained a Preview map row, two how-tos and a tip covering all of it.

---

_2026-05-30 — Forked from the Reid Design build; genericized to the ncs-astro-sanity-starter (core foundation + opt-in module library + bootstrap docs). Future projects start their own history from this entry._

---

_2026-06-12 — Audit-driven hardening + UI component stack + CI (U1-U10)._

- **Structured data genericization.** Replaced client-specific nouns in JSON-LD, OG, and page copy with generic tokens. `businessType` field on `siteSettings` drives the schema.org `@type` value.
- **Robots + RSS endpoints.** `src/pages/robots.txt.ts` generates allow-all + correct sitemap reference at build time; `src/pages/journal/rss.xml.ts` wires `@astrojs/rss` for the journal feed.
- **Accessibility fixes.** Skip-link, aria labels, color contrast, heading hierarchy, and keyboard-nav passes across all section components.
- **Module query fixes.** Co-located query files for all 13 modules audited and corrected; module routes verified against `siteSettings.sectionVisibility` toggles.
- **apply-brand hardening.** `--check` flag (dry-run diff mode), `brand.config.schema.json` validation, `--radius` knob for border-radius token, `workerName`/`domain` field coverage, print footer rewrite. `docs/brand/` is current.
- **CI + lint + 79 tests.** `.github/workflows/ci.yml` mirrors the local gate (`npm run check`): typegen, site build, Studio build, all tests. `npm run check` is the canonical one-command pre-commit gate. New scripts: `lint`, `lint:fix`, `format`. Test suite expanded to 79 tests across 6 files in `src/lib/` (adds `scriptAccent`, `slugify`, `sectionVisibility`, `utils`).
- **UI component stack.** `src/components/starwind/` (Astro-native accordion, dialog, dropdown, tabs primitives). `src/components/primereact/` (PrimeReact escape hatch with `PrimeIsland.tsx` wrapper). Magic UI token audit applied. `docs/agent/component-sources.md` added (shadcn, Radix, Vega, Starwind, Magic UI, PrimeReact sourcing guide + token-remap cheat sheet).
- **Four new page-builder blocks.** `faqSection` (inline FAQ accordion, SELF_CONTAINED, references `faqItem` docs), `logoStripSection` (client/partner logo row or grid, SELF_CONTAINED), `embedSection` (sandboxed iframe/URL embed for Calendly/Tally/etc., SELF_CONTAINED), `teamSection` (inline team member grid, SELF_CONTAINED). Block library grows from 17 to 21 total (11 general + 10 rich).
- **Schema flexibility.** `businessInfo` gains `businessModel` (`'in-person'`/`'remote'`) and `additionalLocations`. `siteSettings` gains `socialLinks` structured array (supersedes legacy flat social fields). `faqCategory` document type added; `faqItem` gains `categoryRef` reference field.
- **Three new modules + virtual-services rename.** `events`, `donations`, `team` modules added (routes: `/events`, `/donate`, `/team`). `e-design` module renamed to `virtual-services` (route: `/virtual-services`). Total modules: 13.

---

_2026-06-12 — Page-builder-first upgrade (A through D)._

**A -- Page-builder core.** `studio/schemaTypes/sections.ts` defines 9 general block types (heroSection, richTextSection, imageTextSection, gallerySection, quoteSection, statSection, ctaBandSection, videoSection, spacerSection), a `SECTION_TYPES` constant as the single source of truth, and `additionalSectionsField` as an append zone any page can import. `src/components/SectionRenderer.astro` maps each block `_type` to a component and owns the alternating-surface cadence (logic extracted to `src/lib/sectionCadence.ts`, unit-tested; blocks carry no color field). A custom `page` document type gives editors free-form pages served by `src/pages/[slug].astro`. Reserved-slug guard lives inside `getStaticPaths` (Astro isolated-scope requirement); shared list at `src/lib/reservedSlugs.ts`, unit-tested. `businessInfo` singleton split out of `siteSettings` (service areas, travel, availability, geo); `getSiteSettings()` merges them back under flat names. GROQ `sectionsProjection()`, `getPage`, `getAllPageSlugs`, and `getNavPages` added to `src/lib/queries.ts`.

**B -- Section-driven core pages.** `studio/schemaTypes/richSections.ts` defines 8 rich section types (founderSection, servicesGridSection, testimonialsSection, storySection, valuesSection, processSection, serviceAreaSection, guaranteeSection) and per-page curated lists. The home, about, services, and process pages now hold a `pageBuilder` array (their old structured fields are hidden + readOnly for rollback); all four routes render via `<SectionRenderer>`. `src/data/defaultSections.ts` holds code-defined default section arrays so a fresh clone with no Sanity project still renders non-blank. The process page graduated from a module into core. `scripts/seed-core.mjs` seeds the `pageBuilder` arrays.

**C -- Modules (lean).** The 9 feature modules (portfolio, shop, e-design, gift-certificates, press, resources, lead-magnets, style-quiz, budget-calculator) ship built and OFF under `modules/`. Enabling is now copy-a-folder: each module's query functions live at `modules/<name>/src/lib/<name>Queries.ts`, so there is no hand-pasting into core `queries.ts`. `siteSettings.sectionVisibility` toggles each. Offering pages (e-design, gift, press, resources) stay fixed-order by choice.

**D -- Brand reskin system.** `brand/brand.config.json` is the single source of truth (identity + palette + fonts + logo paths). `npm run apply-brand` (`scripts/apply-brand.mjs`) deterministically and idempotently rewrites `globals.css` tokens, `src/data/site.ts`, `studio/sanity.config.ts`, OG inputs, and font imports, then regenerates the OG image. The `/reskin` Claude skill (`.claude/skills/reskin/SKILL.md`) orchestrates the full rebrand: interview, font package install, apply-brand, WCAG AA contrast check, visual check via defaultSections, copy retone, and human checklist.

**Verification baseline after this upgrade:** `npm run build`, `npm run typegen`, `npm test` (22 node --test unit tests for sectionCadence + reservedSlugs), `npm --prefix studio run build`. Live Playwright screenshots and actual seed runs require a connected Sanity project.*

---

_2026-08-27: This starter becomes the library of record for the site family._

Six canonical files were installed at their natural paths, each carrying a first-line
`PORTABLE:` marker naming this repo as the library of record: `scripts/with-workerd.mjs`
(Windows workerd wrapper, a no-op until the Astro 7 / adapter 14 upgrade),
`scripts/free-dist.mjs` (releases a stale dev server's handle on `dist/`, genericized so
a copy needs no edit in any repo), `scripts/page-parity.mjs` (rendered-HTML parity
harness, parameterized to auto-detect `dist/client` versus `dist` and to auto-discover
its routes), `scripts/lib/sanity-lib.mjs` (seed/patch plumbing: dry-run-by-default apply
gate, Portable Text builders, idempotent asset uploader, reconciled onto the existing
`scripts/lib/loadEnv.mjs` rather than carrying a second env parser), `src/lib/contrast.ts`
(WCAG contrast math), and the new `scripts/sync-check.mjs` (the drift check itself).

`src/lib/theme-tokens.test.ts` applies contrast.ts to this repo's own `@theme` palette,
so a reskin that pushes body text under 4.5:1 fails `npm test` instead of shipping.
`.github/workflows/ci.yml` gained the stale-types guard: CI regenerates the Sanity types
and fails if the committed `src/lib/sanity.types.ts` differs. New npm scripts: `parity`,
`sync-check`, `free-dist`. Parity baselines for the nine built routes are committed in
`scripts/.parity/`, proven by a build, capture, rebuild, compare cycle at 9/9 PASS.

`PORTS.md` was created with fifteen port cards and the applied-to matrix. See the
[Library of record](../../CLAUDE.md) section of CLAUDE.md for the working rules, above
all the docs-in-sync clause: an improvement that generalizes gets a card in the same
commit that generalizes it.
