# Lighthouse, measured and recorded (plan 2c, Task 6)

Date: 2026-09-20. Lighthouse 12 CLI, Playwright's chromium 1223, headless.
Every number below is a median of three runs unless the row says otherwise.

The Windows CLI exits non-zero after it has written the report, because
chrome-launcher cannot delete its temp profile. The exit code is noise here;
the JSON is the measurement.

---

## 1. Production baseline (before any fix)

Measured against `https://fbcm-site.nathanjnixon86.workers.dev`, single run per
cell, 2026-09-20 by the plan controller.

| Page | Form factor | Perf | A11y | BP | SEO | LCP | CLS | TBT | LCP element |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | desktop | 100 | 100 | 100 | 100 | 726 ms | 0.003 | 0 ms | `div.hero-fade > img.hero-frame` (tower frame 1) |
| `/` | mobile | 92 | 100 | 100 | 100 | 2965 ms | 0.034 | 0 ms | same tower frame |
| `/visit/` | desktop | 100 | 100 | 100 | 100 | 667 ms | 0.013 | 0 ms | split hero `img.h-full` |
| `/visit/` | mobile | 92 | 100 | 100 | 100 | 2951 ms | 0.000 | 0 ms | split hero `img.h-full` |
| `/blog/` | desktop | 99 | 100 | 100 | 100 | 741 ms | 0.003 | 0 ms | split hero `img.h-full` |
| `/blog/` | mobile | 89 | 100 | 100 | 100 | 3210 ms | 0.000 | 0 ms | split hero `img.h-full` |
| `/staff/` | desktop | 99 | 100 | 100 | 100 | 760 ms | 0.000 | 0 ms | split hero `img.h-full` |
| `/staff/` | mobile | 90 | 100 | 100 | 100 | 3183 ms | 0.000 | 0 ms | split hero `img.h-full` |
| `/history/` | desktop | 100 | 100 | 100 | 100 | 704 ms | 0.005 | 0 ms | brown band `img.h-auto` |
| `/history/` | mobile | 91 | 100 | 100 | 100 | 3015 ms | 0.000 | 0 ms | brown band `img.h-auto` |
| `/post/händel-s-messiah-sing-in-carols/` | desktop | 99 | 100 | 100 | 100 | 790 ms | 0.004 | 0 ms | `h1` |
| `/post/händel-s-messiah-sing-in-carols/` | mobile | 90 | 100 | 100 | 100 | 3194 ms | 0.000 | 0 ms | cover `figure > img.h-auto` |
| `/give/` | desktop | 100 | 100 | - | - | 664 ms | 0.003 | 0 ms | header CTA |

The spec's LCP element check for `/` passes: it is the tower frame, and it
already carries `loading="eager"`, `fetchpriority="high"`, `sizes="100vw"`.

Against the targets: desktop is met everywhere (99 rounds off a 100-level
page; nothing on the desktop runs has a score below 1 worth chasing). Mobile
performance 89 to 92 misses the 95 target on all six pages, and the home
mobile LCP of 2965 ms misses the 2.0 s target.

## 2. Diagnosis (written before anything was changed)

Read from the six mobile JSON reports. Every page tells the same story.

**TBT is 0 ms and CLS is at most 0.034 on every page, so nothing here is a
main-thread or a layout problem.** The whole of the mobile gap is in FCP and
LCP, and the two move together: FCP 2.4 s to 2.7 s, LCP 2.95 s to 3.21 s, a
gap of only 0.5 s to 0.6 s between them. Fix what delays the first paint and
the largest paint follows.

**One audit is the same on all six pages: `render-blocking-resources` names
exactly one file, `/_astro/BaseLayout.<hash>.css`, 24 KB over the wire
(125 KB raw), costing 453 ms to 465 ms.** That is the cost of a second network
round trip on the mobile throttle: the HTML arrives, the parser finds a
`<link rel=stylesheet>`, and the first paint waits for a whole new request.
`astro.config.mjs` sets no `build.inlineStylesheets`, so Astro's default
(`'auto'`, inline only under about 4 KB) leaves it external.

The LCP phase tables agree that this is the floor, not the ceiling:

| Page (mobile) | TTFB | Load delay | Load time | Render delay |
| --- | --- | --- | --- | --- |
| `/` | 458 ms | 299 ms | 827 ms | 1381 ms |
| `/visit/` | 455 ms | 249 ms | 1202 ms | 1045 ms |
| `/blog/` | 465 ms | 189 ms | 1225 ms | 1331 ms |
| `/staff/` | 457 ms | 178 ms | 1203 ms | 1346 ms |
| `/history/` | 453 ms | 650 ms | 886 ms | 1026 ms |
| post | 461 ms | 375 ms | 1592 ms | 766 ms |

Render delay is the largest single phase on four of the six, and TTFB is a
flat ~455 ms everywhere, which is the simulated connection setup rather than
the server (`server-response-time` reports "Root document took 40 ms").

**Fonts are not the cause.** `font-display` passes: `@fontsource` ships
`font-display: swap`, so text paints in the fallback face immediately. The two
woff2 files (Inter variable 48 KB, Libre Baskerville 400 at 20 KB) are
requested at 395 ms and 426 ms, after the CSS has parsed, and no LCP element on
any of the six pages is text. Preloading them would buy nothing measurable and
would compete with the LCP image for bandwidth, so that lever is not pulled.

**The LCP image is already handled correctly on `/`.** Frame 1 of the tower is
the first network request after the document, `loading="eager"`,
`fetchpriority="high"`, `sizes="100vw"`, and it is fully downloaded 336 ms in.
Its load delay of 299 ms and load time of 827 ms are both modest; the 1381 ms
of render delay after it is the CSS.

**A second, much smaller cause exists on the split-hero pages.**
`uses-responsive-images` scores 0 on `/visit/` with 60 ms and 13 KB of
estimated savings (and is flagged on `/` and the others at a lower weight):
the split hero asks the CDN for `w=800` where a 412 px-wide viewport needs
roughly half that. Worth 60 ms on a 3000 ms LCP, so it is second in line and
only if the first fix leaves the target short.

**Order of attack:** (1) stop the stylesheet costing a round trip; (2) if
still short of 95, size the split-hero image to the viewport. One cause per
commit, measured.

## 3. Local preview harness

Production cannot be re-measured from this branch: the fix has to merge and
deploy first. So each fix is measured against `npm run preview`
(wrangler dev, `http://127.0.0.1:8787`), which serves the same build with the
same gzip and the same `_headers` as production but without the Cloudflare
edge. Local numbers therefore run a little better than production; what
matters is the before/after delta on the same harness.

| Page | Form factor | Perf | FCP | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | mobile | 95 (94/95/95) | 2114 ms | 2645 ms | 0.000 | 0 ms |
| `/visit/` | mobile | 94 (94/94/94) | 2188 ms | 2718 ms | 0.000 | 0 ms |

The local run reproduces the diagnosis exactly: the same single
render-blocking `/_astro/BaseLayout.<hash>.css` at 454 ms.

## 4. Fix 1: inline the render-blocking stylesheet

`astro.config.mjs`, `build.inlineStylesheets: 'always'`. Commit `bdc6921`.

Median of three, mobile, local preview:

| Page | Metric | Before | After |
| --- | --- | --- | --- |
| `/` | FCP | 2114 ms | **1968 ms** |
| `/` | LCP | 2645 ms | 2646 ms |
| `/` | Performance | 95 | 95 |
| `/visit/` | FCP | 2188 ms | **1964 ms** |
| `/visit/` | LCP | 2718 ms | 2752 ms |
| `/visit/` | Performance | 94 | 94 |

CLS and TBT unchanged (0 and 0 ms); accessibility, best practices and SEO
stayed at 100. `render-blocking-resources` went from a listed failure naming
that one file to not appearing at all.

The measured gain, 150 to 220 ms, is smaller than the 453 to 465 ms the
`render-blocking-resources` audit estimated in section 2, and that is expected
rather than a discrepancy: Lighthouse's "estimated savings" is a Lantern
simulation of removing the resource entirely from the critical path, an upper
bound that assumes nothing else moves, whereas inlining does not delete those
22 KB, it moves them into the document, so the HTML is larger and part of the
saved round trip is spent transferring the same bytes earlier.

So first paint is 150 to 220 ms earlier and the audit passes, but the
performance SCORE did not move. FCP carries a weight of 10 against LCP's 25,
and LCP is held by something else. Recorded plainly rather than dressed up.

The trade is deliberate: the stylesheet is no longer separately cacheable, so
every page carries its own copy (about 22 KB gzipped) and a reader moving
between pages re-downloads it. Cold first paint from search is the number this
site is judged on, and inlining wins that one.

## 5. Fix 2: preconnect to the image CDN. Tried, measured, reverted.

With the stylesheet inlined, the largest remaining LCP phase on every page was
"load time" for the hero photo: 1253 ms of a 2742 ms LCP on `/visit/` for a
40 KB image. A 40 KB transfer is about 200 ms at the mobile throttle, so the
rest is DNS, TCP and TLS to `cdn.sanity.io`, a third-party origin whose
handshake cannot start until the preload scanner reaches the `<img>` in the
body, which the newly inlined 22 KB of CSS pushes later in the byte stream.
The fix was one line in `src/layouts/BaseLayout.astro`, a
`<link rel="preconnect" href="https://cdn.sanity.io" />` high in the head, no
`crossorigin` (a plain `<img>` makes a no-CORS request and would not use a
crossorigin-warmed connection).

| Page | Metric | Before (fix 1) | After preconnect |
| --- | --- | --- | --- |
| `/` | LCP | 2646 ms | 2649 ms |
| `/` | Performance | 95 | 95 |
| `/visit/` | LCP | 2752 ms | 2748 ms |
| `/visit/` | Performance | 94 | 94 |

Nothing moved: both deltas are inside the run-to-run noise. Lighthouse's
Lantern simulator does not model the benefit of a preconnect, so this harness
cannot show a gain even if a real phone would see one, and an unmeasurable
change to a foundation file is not one to keep. **Reverted, and per the
two-strike rule this is where the fixing stops.** `BaseLayout.astro` is
unchanged on this branch.

## 6. Final local numbers, and what is still short

Local preview (wrangler dev, gzip, 127.0.0.1:8787), median of three per cell,
with fix 1 in and fix 2 out.

| Page | Form factor | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | desktop | 99 | 100 | 100 | 100 | 472 ms | 806 ms | 0.046 | 0 ms |
| `/` | mobile | 94 | 100 | 100 | 100 | 2038 ms | 2792 ms | 0.034 | 0 ms |
| `/visit/` | desktop | 100 | 100 | 100 | 100 | 472 ms | 620 ms | 0.013 | 0 ms |
| `/visit/` | mobile | 95 | 100 | 100 | 100 | 1964 ms | 2721 ms | 0.000 | 0 ms |
| `/blog/` | desktop | 100 | 100 | 100 | 100 | 472 ms | 678 ms | 0.001 | 0 ms |
| `/blog/` | mobile | 94 | 100 | 100 | 100 | 1967 ms | 2786 ms | 0.000 | 0 ms |
| `/staff/` | desktop | 100 | 100 | 100 | 100 | 471 ms | 660 ms | 0.001 | 0 ms |
| `/staff/` | mobile | 94 | 100 | 100 | 100 | 1966 ms | 2772 ms | 0.000 | 0 ms |
| `/history/` | desktop | 100 | 100 | 100 | 100 | 512 ms | 658 ms | 0.005 | 0 ms |
| `/history/` | mobile | 93 | 100 | 100 | 100 | 2190 ms | 2800 ms | 0.000 | 0 ms |
| post | desktop | 100 | 100 | 100 | 100 | 470 ms | 699 ms | 0.004 | 0 ms |
| post | mobile | 94 | 100 | 100 | 100 | 2043 ms | 2818 ms | 0.001 | 0 ms |

Accessibility is 100 on all twelve cells, which is the one hard gate in
`lighthouserc.json`. Best practices and SEO are 100 everywhere. TBT is 0 ms
everywhere and CLS is well inside the 0.1 gate; the largest, 0.046 on the home
page, is the hero cross-fade and it is the one point separating home desktop
from 100 in this local harness (production measured the same page at CLS 0.003
and performance 100).

**Still short of the spec, honestly stated:**

- **Mobile performance 95 is met on `/visit/` only.** The other five sit at
  93 to 94. Home moves between 94 and 95 run to run, so it is on the line
  rather than under it.
- **Home mobile LCP under 2.0 s is not met** and is not close: 2.79 s local,
  2.97 s on production.

**Why, and what the next lever would be.** Every page's LCP is a photo from
`cdn.sanity.io`, and the LCP phase tables put roughly 1.2 s of every mobile
LCP into "load time" for that one image. Lighthouse's own estimate for the
only remaining image lever, serving the split hero at a width that matches
the rendered box instead of `w=800` (`uses-responsive-images`,
`image-delivery-insight`), is 60 to 150 ms and 13 to 31 KB. Reaching a 95 on
these pages needs roughly 400 ms off LCP, so image bytes alone will not do it;
what would is moving the hero photos off the third-party CDN onto the site's
own origin so they share the document's already-open connection. That is a
build-pipeline change, not a tuning pass, and it belongs in its own planned
session rather than in a verification task. Logged here rather than attempted.

## 7. What still needs a production re-measure

Everything in sections 4 and 6 is the LOCAL preview harness. This branch
cannot deploy, so the production "after" arrives with the merge. Once
`feat/plan2c-verification` is merged and deployed, re-run the section 1 table
against `https://fbcm-site.nathanjnixon86.workers.dev` (or the live domain if
cutover has happened) and record:

- mobile performance and FCP for all six pages, against the section 1
  baseline of 89 to 92, to confirm the inlined stylesheet lands the same 150
  to 220 ms of FCP there that it landed locally;
- desktop performance for `/`, `/visit/`, `/blog/`, `/staff/` and the post,
  which were 99 to 100 before the change and must not regress;
- home mobile LCP, which is expected to stay near 2.95 s and to remain the
  open item above.

Task 8 or plan 3 owns that re-measure.
