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

