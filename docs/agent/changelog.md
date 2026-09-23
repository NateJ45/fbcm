# Change history

> Running change log, moved out of CLAUDE.md so it does not load on every task.

> **Scope note (2026-08-27).** This file stays **narrative**: what changed here, in
> sequence, in prose. The **machine-checkable** record of what is shared across the site
> family now lives in `PORTS.md` at the repo root: an applied-to matrix (improvement by
> repo), one dated port card per improvement, and `scripts/sync-check.mjs` to prove a
> site's canonical copies have not drifted. Something that needs to be _checked_ belongs
> in PORTS.md; something that needs to be _understood in sequence_ belongs here. Entries
> below may reference a card number.

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
