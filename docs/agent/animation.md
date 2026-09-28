# Animation layer

> Native scrolling and the scroll reset on navigation (Lenis was removed 2026-09-24), Motion integration, scroll-triggered reveals (including the glyph draw and the Hannaford ink-in), hero entry stagger and the headline word rise, the moving hero slideshow and its scroll parallax, the view-transition cross-fade and the post title that carries over, and the opt-in script accent.

Non-animation polish (brand stripe, image zoom, surface-warm, reading-progress, sticky-header, paper-grain, print stylesheet) is covered in `polish-layer.md`.

## Scrolling: the browser's own (Lenis removed 2026-09-24)

Lenis ran here until 2026-09-24 (`feat/print-motion`), when Nathan had it taken out. It added only a wheel glide, and for that it cost 5.4 KB gzip on every page (measured: gzipped JS on `/` 98,272 B to 92,707 B, on a post 99,376 B to 93,811 B, one request fewer each), ran a `requestAnimationFrame` loop that never stopped, started 1.5 to 2 s after load (it waited on `requestIdleCallback`), and caused the day's dead-wheel bug: the search dialog stopped it, a router swap threw the dialog away before its `close` fired, and the wheel did nothing until a reload. Trackpad users found it floaty. The `lenis` package is gone from `package.json`.

What replaced each thing it did:

- **Forward navigation lands at the top; Back/Forward restores the position** (CLAUDE.md rule 5). Astro's router does both itself: `scrollTo({ top: 0, behavior: 'instant' })` on a push, and the saved `scrollX`/`scrollY` on a traverse, inside the swap and before `astro:after-swap`. The old Lenis reset (an `after-swap` `lenis.scrollTo(0, { immediate, force })`) existed only because Lenis's own momentum overrode the router; with Lenis gone there is nothing to cancel. `tests/transitions.spec.ts` reads `scrollY` at `astro:after-swap` and proves both placements happen in the swap, not after it.
- **In-page anchors and programmatic scrolls glide** through `html[data-smooth-scroll] { scroll-behavior: smooth }` in `globals.css`, inside `prefers-reduced-motion: no-preference`. The attribute is set by BaseLayout's layout script on the visitor's first `pointerdown` or `keydown`, never before, for a measured reason: with smooth scrolling on from the first paint, Chrome GLIDES its own scroll restoration on a reload (0 to 600px over 400 ms), which is visible and also left the header unseeded (the glide is a scroll with no gesture behind it; `tests/header.spec.ts` caught it). Every anchor click and scroll control follows a press, so nothing a visitor does loses the glide.
- **The router's placement is never animated.** Its swap copies the incoming document's `<html>` attributes onto the live one (`swapRootAttributes`), which removes `data-smooth-scroll` before the router scrolls; the next press puts it back.
- **Code that places the page itself uses `behavior: 'instant'`**: the header's fragment landing in BaseLayout (a glide re-aimed every frame by its correction loop would never land). `BackToTop` and `DoorPlan` ask for `'smooth'` explicitly and were never Lenis's.
- **The search dialog's scroll lock** is `html.ss-open { overflow: hidden }` alone, released on `close` and again on `astro:before-swap`.
- **The wheel is the browser's own**, untouched. Tests that set a scroll position as setup do it with `behavior: 'instant'`, since `scroll-behavior` would otherwise turn a two-argument `scrollTo` into a glide once a test has clicked something.

---

## Motion integration

[Motion](https://motion.dev) (formerly Framer Motion) provides the animation primitives for React islands. Use `motion` components for enter/exit transitions on interactive UI (drawers, modals, toast regions). For scroll-triggered reveals on static content, prefer the lightweight `[data-reveal]` IntersectionObserver approach below -- it doesn't require hydrating a React island just to fade in a static section.

---

## Scroll-triggered reveals

### `[data-reveal]`

Any element marked `data-reveal` starts at `opacity: 0; transform: translateY(0.75rem)`. An IntersectionObserver in BaseLayout adds `.is-visible` when the element crosses the viewport edge, transitioning to opacity 1 + no translate. Reduced-motion users get content immediately (the global reset short-circuits the start-hidden state).

Apply selectively to section blocks. Don't add `data-reveal` to above-the-fold content -- it defeats the purpose and hides content from users with slow connections before the observer fires.

**On this site the list of what may carry it is closed** (plan 3, task 12). Every band used to reveal as a whole, so scrolling the page was a continuous ripple of prose sliding up, and a reveal that happens to everything reads as a page that is slow rather than as a page that is composed. What reveals now is only what a reader would notice arriving:

- a `<figure>` or a `SanityImage` wrapper inside a band
- the big numerals: the SundayTimes service time, the StatsRow band, the Timeline year markers, the HeritageBand years
- the JournalCard cover image
- every `BuildingGlyph` (the `draw` variant, below) and the Hannaford rendering (the `ink` variant)

Headings, prose, lists and CTAs are painted, not revealed. If you are about to add `data-reveal` to a heading, the answer is no.

### The glyph draw (`[data-reveal='draw']`, 2026-09-24)

Every `BuildingGlyph` (window, door, rose, basin: the church's line art from the building) is on the reveal observer with the `draw` variant, and every stroke carries `pathLength="1"`. The first time a glyph scrolls into view its lines draw themselves, one after another (1.1 s each on `cubic-bezier(0.45, 0, 0.2, 1)`, 140 ms apart, the fifth and later together at 560 ms), and it stays drawn: the observer lets go of it, so it is once per page view. The basin's dotted pour (`.glyph-dots`) is not a line to trace; it fades in last. The svg itself never moves or fades, so the draw can never shift layout, and it drops the base reveal's `will-change` (a page carries dozens of glyphs).

**The dash is sized on screen, which is the trap.** The glyphs keep a constant 2px line with `vector-effect: non-scaling-stroke`, and with that set, Chromium and WebKit both lay the dash out in SCREEN space while `pathLength` scales it in the path's own units. Measured 2026-09-24: a `1.01` dash covers a 48-unit glyph drawn at 48px, stops halfway at 96px, and covers a fraction of an arch mould stretched by `preserveAspectRatio="none"`. So BaseLayout's reveal script reads each stroke's screen scale once (`--k`, `Math.hypot(a, b)` of its `getScreenCTM()`, every read before any write), and the dash and offset are `calc(1.01 * var(--k, 1))`. Two seconds after the reveal it adds `.is-drawn`, which takes the dash off entirely, so a later resize can never leave a stroke short. (The transition delays sit under `:not(.is-drawn)` too: WebKit otherwise held the old dash on the delayed strokes for a beat after `.is-drawn` landed.)

Tried and rejected the same day: **drawing the arch mould** (`ArchFrame`'s gold outline). Its non-uniform stretch means no single `--k` is right for the whole path; it keeps its fade.

Reduced motion and paper both get the final state: the draw rules live inside `prefers-reduced-motion: no-preference`, and the print block in `globals.css` forces `stroke-dasharray: none` and every reveal visible. `tests/motion.spec.ts` asserts both halves (reduced motion: every stroke whole, no dash, no animation object; no preference: a glyph below the fold waits undrawn, draws, lands whole with no dash, and does not replay), on Chromium and the WebKit iPhone profile.

### The Hannaford ink-in (`[data-reveal='ink']`, 2026-09-24)

The 1927 Hannaford rendering is a raster, so it is not drawn; it inks in. The footer's gold line art (`.footer-rendering`) and Home's Our Building drawing (`.ob-drawing` in `HeritageBand.astro`) carry `data-reveal="ink"`: their children fade in over 2.4 s, and the drawing also comes up from pale pencil (`contrast(0.55) brightness(1.5)`) to its full grade over 2.8 s (the same four filter functions, so the browser can interpolate them). The mobile menu's copy (`.menu-rendering`) is not on the observer; it inks in with a 1.8 s keyframe 0.6 s after the sheet opens, once the rows have risen. None of the three is ever a largest-paint candidate (the footer's is a mask in a `content-visibility: auto` box, the drawing is lazy and far below the fold, the menu's is a background).

### Grid stagger entrance (`[data-stagger-grid]` / `.is-staggered`)

**No component in this repo opts into it as of 2026-09-21.** Task 12 took it off the blog grid, the staff grid, the gallery and the team grid, because it staggered whole CARDS (title, date, excerpt and all) where the reveal rule above wants the picture and nothing else. The engine stays because it is generic and the family shares it; if you bring it back, bring it back on a grid of pictures.

Card grids fade their children up in sequence as the grid crosses the viewport. Add `data-stagger-grid` to a grid container; the BaseLayout observer adds `.is-staggered` on intersection, and per-`nth-child` `transition-delay`s (0 / 100 / 200 / 300ms, capped at 400ms for item 5+) sequence the reveal.

Reduced-motion users get every child visible instantly.

**Filter caveat:** if a `[data-stagger-grid]` container also has filtered children (`.is-filtered-out`), the filter's hide state must be re-asserted at matching specificity (`[data-stagger-grid] > .is-filtered-out`, with `!important`) so the stagger rules don't override the filter's hide state.

### Image curtain reveal (`.img-curtain` / `.is-revealed`)

A surface-colored panel (`color: var(--background)`) scales away from the top edge to reveal an image, reading as materialization rather than a sliding panel. Wrap the image in a `relative overflow-hidden` div and drop `<div class="img-curtain" aria-hidden="true">` in as the last child; the BaseLayout observer adds `.is-revealed` on intersection (`scaleY` 1 to 0, 900ms). The curtain sits at `z-index: 10` so it covers any in-wrapper overlays during the reveal. Reduced-motion users never see the curtain (`display: none`).

---

## Hero entry stagger (`.hero-entry-stagger`) and the headline word rise

The photo and split heroes' content column wraps in `<div class="hero-entry-stagger">`, and it arrives in sequence on first paint, like a title sequence. Retimed on 2026-09-27 (`feat/hero-motion`) around the headline:

- **The line above the headline** (the dated Sunday line or the eyebrow) fades up at 0ms: 1000ms on `cubic-bezier(.2,.7,.2,1)` from `translateY(22px)`.
- **The headline itself never fades.** Its words rise, after Highland Park Presbyterian's hero (GSAP SplitText there; CSS here, server-rendered): each word is a `.hero-word` inline-block that clips (`overflow: hidden`) around a `.hero-word-in` that rises from `translateY(101%)` to 0 over 800ms on `cubic-bezier(0.22, 1, 0.36, 1)` (quint out), the first at 150ms and each next one 60ms later (`--w` is the word's index). The inner box carries padding (0.2em above, 0.25em below, 0.06em each side) so the clip never cuts an ascender, a descender or an italic overhang at rest; the outer box takes it back as negative margin, so the words set on exactly the lines plain text would. The boxes are top-aligned, because an overflow-clipping inline-block's baseline is its bottom edge.
- **The lede, the facts and the buttons** fade up 120ms apart, starting when the last word has mostly landed: `150ms + (words - 1) x 60ms + 360ms`, from `--hero-words` on the wrapper, counted up to six so a long sentence cannot push the rest past about 2s. "Praise and proclaim." puts the lede at 630ms and the buttons down by 1870ms.

**The words come from `src/lib/hero-words.ts`** (unit-tested). It splits the stega-CLEANED headline (the preview's U+FEFF matches `\s`, so a raw split would shatter the payload into fake words) and puts the stega run back on the last word, so click-to-edit survives. Each word keeps its accent (the script accent, and on the split hero the colour accent), an accent inside a word styles only its letters, and a no-break space holds two words together. Real spaces sit between the word boxes, so the h1 wraps between words, a word never breaks mid-word (it is one inline-block; `.h-fit` sizing is unchanged, `tests/headings.spec.ts` is its gate), and the h1's accessible name is the whole sentence. The window hero has no entrance choreography at all and keeps its headline as it was: its italic sentence with a closing accent on a block line of its own does not split cleanly into rising boxes, and it would bring load motion to interior pages that have none.

Reduced-motion users get the final composition instantly (the word rise lives inside `prefers-reduced-motion: no-preference`, and the stagger's reset covers the rest). The preview shell (`PreviewLayout.astro`) forces both end states. `tests/motion.spec.ts` asserts the new truth: the h1 has no animation and full opacity, one rising box per word whose texts joined by spaces are the headline and its accessible name, the 150 + 60ms delays, the last word landed by 1.6s on its own clock, the lede starting after the last word, and every word landed in place.

**The load choreography is hero-only.** Nothing else on the page animates on arrival; everything below the fold either paints or, if it is on the closed list above, reveals as it is scrolled to.

## Hero overlay breathe (`.hero-overlay` / `--hero-stop`)

Added 2026-09-21 (plan 3, task 12). The hero's readability gradient eases its bottom stop between 94% and 90% ink over 7 seconds, alternating forever, so a photograph under a still overlay never sets into a flat plate behind the words. The amplitude is four points of alpha: nobody watches it happen and everybody would miss it.

Two things make it work, and both are easy to undo by accident:

1. **`--hero-stop` is a registered `@property`** with `syntax: '<percentage>'`. An unregistered custom property is an untyped token, so CSS can only swap it at the keyframe boundary; the animation would jump once every 7 seconds instead of easing. Register it or it is not a breathe.
2. **The gradient lives in a class, not an inline `style=`.** An inline style cannot be a keyframe target, which is why `HeroBackground.astro` stopped carrying the gradient string and now renders `<div class="hero-overlay">`.

The whole animation sits inside `@media (prefers-reduced-motion: no-preference)`, so a visitor who asked for stillness gets the static 94% initial value and no animation object at all. `tests/motion.spec.ts` asserts exactly that: under `reducedMotion: 'reduce'` nothing on `/` is in the `running` play state.

Don't apply `.hero-entry-stagger` to other components: its delays are tuned to the hero's own composition (a line, the headline's words, then up to four more children).

---

## Home hero slideshow (`HeroBackground.astro`)

The photo hero renders one static photograph for one frame, or a moving slideshow for 2 to 12 (`heroSection.frames`, schema-capped at 12 since 2026-09-27). Rebuilt on 2026-09-27 (`feat/hero-motion`): until then it was a CSS-only cross-fade of 8-second frames whose Ken Burns keyframe (`hero-kb`) had been deleted on 2026-09-19, so the zoom had silently not run since.

- **The beat** is `frameBeats()` in `src/lib/hero-frames.ts` (unit-tested): each frame is LONG (5 s) or SHORT (3 s). Frame 1 is always long, then the pattern is long, short, short (a frame is long when its 0-based index is a multiple of three), and from four frames up the last is long too, so the loop closes on a held picture. Twelve frames are long on 1, 4, 7, 10 and 12; two are L S; three L S S; six L S S L S L.
- **The move.** Frames cycle push-in, drift-left, pull-out, drift-right from frame 1 (`.kb-*` classes, keyframes `hero-kb-*` in `globals.css`). A move lasts the hold plus the 0.7 s dissolve (`--kb-dur`), on a linear clock, so a frame is still moving while it dissolves out and the picture is never still. Zooms run between 1 and 1.13 about `--kb-origin`, the frame's hotspot (the same percentages as its `object-position`, from `heroObjectPosition()`; the centre with none), so a push-in heads for the faces. Drifts pan from +3.5% to -3.5% (or back) at scale 1.1 about the centre, leaving 1.5% of spare picture beyond each edge at the extremes.
- **The dissolve** is a CSS transition. The incoming frame (`.is-current`, `z-index: 1`) fades in over 0.7 s on top while the outgoing frame stays opaque beneath it and drops out at once after 0.7 s, so the picture never dips towards the ground colour mid-dissolve. `.hero-fade` is `isolation: isolate`, so the current frame's z-index never lifts it over the overlay or the words.
- **The sequencer** is the one inline script in `HeroBackground.astro`. It moves `is-current` along the frames on each frame's `--hold`, restarts the incoming frame's move (class off, a style read, class on), and takes the move off a frame 0.8 s after it has dissolved out so a hidden frame holds no transform or layer. Frames 2..n stay in `<template data-hero-later>` and are inserted ONE AHEAD: frame 2 after `window` load, frame k+1 when frame k comes up. Before advancing it waits until the next image has loaded and `decode()`d; if the hold ends first it keeps the current frame, slows its move to a quarter speed so it is still moving, and advances when the image arrives; a frame whose image fails to load is skipped, so one missing photograph cannot stop the slideshow. After the first loop every frame is in the DOM. It pauses while the tab is hidden (`.is-idle` also holds the moves). It is bound idempotently: one instance in `window.__heroSeq`, stopped on `astro:before-swap`, a new one bound on `astro:page-load`, never two on one hero (`data-hero-bound`).
- **Frame 1 is the LCP image**: `loading="eager" fetchpriority="high"`, server-rendered `is-current is-moving`, so it is opaque from the first paint and its push-in runs from CSS with no JavaScript at all. Without JavaScript that is all the visitor gets.
- **The parallax** is CSS only. `.hero-fade`, the frames' wrapper and never a moving frame (two transforms on one element would fight), runs `hero-parallax` on its own view timeline (`animation-range: exit 0% exit 100%`) inside `@supports (animation-timeline: view())`: it drifts down by a third of the hero's height as the hero scrolls out, so the picture moves at two thirds of the scroll speed. The strip it uncovers at the hero's top is always above the viewport (a third of the distance scrolled is less than the distance scrolled), and the section clips its bottom, so no gap ever shows and the wrapper needs no extra height. The section is `overflow-clip`, NOT `overflow-hidden`: `overflow: hidden` makes it a scroll container, `view()` then takes the section (which never scrolls) as its scroller, and the parallax never moves (measured: the wrapper stayed at identity 400px down).
- **The Pause control** (a WCAG 2.2.2 requirement: the slideshow moves for far longer than five seconds) stops the sequencer AND every move (`.is-paused` sets `animation-play-state: paused` on the frames); Play resumes both from where they were. Hover and focus-within no longer pause it (2026-09-27): a resting desktop cursor over a full-screen hero was freezing it.
- **The words' backing.** The overlay is clear over the top half, which suits one chosen photograph and not twelve that change behind words that stay put. So a slideshow hero's content wrapper has its own dark backing (`.hero-fade ~ .hero-entry-stagger::before`, not animated): as tall as the words on every screen, feathered out above the dated line, fading out by 78% of the width on a desktop so the faces on the right stay bright, and flat at 54% on a phone. Measured with `tests/contrast.spec.ts`'s method over all twelve home frames at 1280, 1440 and 375: 81 of 432 checks failed on the overlay alone, 0 with the backing (tightest 1.12x its threshold). A single-photo hero does not get it.
- **Reduced motion:** frame 1 only, still, no transform; the sequencer never starts, the template is never inflated, and the Pause button is hidden (`motion-reduce:hidden`). Every move and the parallax live inside `prefers-reduced-motion: no-preference`, and the dissolve transition is off under `reduce`.

The first frame carries its alt; the later frames have empty alt, since they are decorative. `tests/motion.spec.ts` covers it on Chromium and the WebKit iPhone: frame 1 current and moving from load, frame 2 taking over and moving, Pause holding both the frame and its transform for 3 s and Play resuming it, and under reduced motion one still frame, no frames inserted, and no Pause button.

---

## View transitions

Astro's `<ClientRouter />` (BaseLayout) swaps pages without a reload. Under `prefers-reduced-motion` Astro cuts every transition.

**The page cross-fades in place.** The root snapshot fades out over 150 ms and the new one in over 200 ms (`::view-transition-old(root)` / `-new(root)` in `globals.css`). Only the header is named (`site-header`), and its group and both images are `animation: none`, so the bar and the logo stay put.

Until 2026-09-24 `<main>` (`main-content`) and the footer (`site-footer`) were named too, and that made the page SLIDE: a named element's group animates from its old box to its new one, and leaving a page scrolled 1000px down, the old `<main>` sat 1000px above the screen and the new one at the top, so the whole page travelled down the screen through the fade (seen frame by frame, on `main` as well as the branch), and a footer link slid the footer away. Do not name a whole-page region again; a named element should be something that is genuinely in both pages, at a comparable size.

**The post title carries over.** On a FORWARD navigation from a blog row (`PostRow.astro`, whose heading carries `[data-vt-title]`) to that row's post, the row's heading and the post's `h1.p2-title` share the name `post-title` for that navigation only, so the title travels from the row up into the masthead while the page cross-fades: the group moves over 460 ms on `cubic-bezier(0.2, 0.7, 0.2, 1)`, the row's small title fades out in the first 160 ms and the masthead's fades in after it, so the two never show at full strength together (the row sets it in Castoro, the masthead in Castoro Titling capitals). The wiring is `src/components/transitions/shared-title.ts`, imported by the layout script: it wraps the router's `loader` in `astro:before-preparation`, so the names are set after the new document has loaded and before the old page's snapshot, and they are cleared at the start of the next navigation. Nothing carries the name in markup, because every row on a list page carries `[data-vt-title]` and two elements with one name make the browser skip the whole transition (until 2026-09-24 `/blog` also listed some posts twice, in "Worth coming back for"; that band is gone). When it pairs is `src/lib/shared-title.ts` (unit-tested): forward only (Back gets the plain cross-fade, since the row may be anywhere on the restored page), only from a row title at least half on screen, only to a page with a post title, never under reduced motion.

**What must survive a swap, and is tested** (`tests/transitions.spec.ts`: Home, Blog, a post by its row, the search, then Back): the window persists (a client-side swap), the page is at the top at `after-swap` and at the restored position on Back, the header's `data-scrolled` is absent at the top and seeded from the restored position alone, the This Sunday line (`[data-live-sunday]`) is upgraded on every page, the search dialog opens and closes on the swapped-in page, and after Back nothing carries a shared name.

---

## Script accent font (opt-in)

The `@utility font-script` declaration and `--font-script` CSS custom property exist in `globals.css`, but no script font file is loaded by default. This is intentional: a calligraphic accent is project-specific and adds a font request for every visitor, so it should only be enabled when the design calls for it.

### How to enable the script accent

1. **Choose a script typeface** and install its `@fontsource` package, for example:

   ```
   npm install @fontsource/dancing-script
   ```

2. **Add the import** near the top of `src/styles/globals.css`, after the other `@fontsource` imports:

   ```css
   @import '@fontsource/dancing-script/400.css';
   ```

3. **Point `--font-script` at the family** in the `@theme` block in `globals.css`:
   ```css
   @theme {
     --font-script: 'Dancing Script', cursive;
   }
   ```

Once this is done, any element with the `font-script` Tailwind utility class will render in the script typeface.

### Usage discipline

The `font-script` utility is for a single-word editorial accent on hero headlines and section headings -- not for body text, buttons, or repeated decorative elements.

The shared logic lives in `src/lib/heading-accent.ts` (`splitHeadingAccent(heading, accent)`), which splits a headline string around the matching accent word and returns the before/after fragments for the template to wrap in `<span class="font-script">`. If the accent word is not found in the current headline, the heading renders plain -- editors can update copy without breaking anything. The same function serves the colour accent; only the class on the span differs. It had a second, weaker copy of its own (`src/lib/scriptAccent.ts`) until 2026-09-18, when that copy was retired (PORTS.md card 53).

**Discipline:** use at most one script accent per heading. Over-use dilutes the effect. The accent word is matched case-insensitively against the headline, first occurrence only. Think of it as an editorial signature, not decoration.

---

Cross-reference: `polish-layer.md` covers the non-animation visual layer (brand stripe, card-lift, surface-warm, reading-progress, sticky-header, paper-grain, print stylesheet).
