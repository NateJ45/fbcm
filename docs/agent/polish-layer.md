# Polish layer

> Custom CSS utilities and JS behaviors layered on Tailwind: brand stripe, image zoom, surface-warm, reading-progress, sticky-header, nav-underline, paper-grain, and print stylesheet.

Animation behaviors (native scrolling since Lenis was removed on 2026-09-24, scroll reveals including the glyph draw and the Hannaford ink-in, stagger grid, hero entry, view transitions, Ken Burns slideshow, script accent opt-in) are documented separately in `animation.md`.

## Polish layer

Custom CSS utilities and JS behaviors layered on top of Tailwind + shadcn. All declared in `src/styles/globals.css` and (where JS is needed) initialized in `BaseLayout.astro` with re-init on `astro:page-load` so they survive View Transitions.

### Brand-stripe rhythm (THE primary visual signature)

A 2px brand-color line -- `<div class="h-0.5 bg-primary" aria-hidden="true"></div>` -- is the starter's repeating visual signature. It appears at the top of:

- The site header (above the eyebrow strip)
- The mobile menu drawer (`border-t-4 border-t-primary` on SheetContent)
- The footer (above the brand block)
- Every marketing card (ServiceCard, JournalCard, TestimonialCard)
- The FinalCta dark panel

If you add a new card-like component or section that should feel part of the brand, include this stripe at the top edge. The repetition is what makes the site read as one designed object.

### Image zoom on a link (`.zoom-img`)

`.card-lift` and `.card-lift-slow` were deleted on 2026-09-21 (plan 3, task 12, the motion pass). The art-direction pass had already taken their shadow away, which left a 2px hover nudge with nothing to explain it, and the cards they hung on are gone. Anything you find still naming them in an older doc or plan is history.

The site now has exactly three hover moves, and a picture is the only thing that scales:

```html
<a href="/post/something" class="group block">
  <div class="zoom-img aspect-[4/3] overflow-hidden">
    <img ... />
  </div>
</a>
```

`.zoom-img` goes on the `overflow: hidden` wrapper, not on the image. The rule lives in `globals.css` and takes the image to `scale(1.02)` over 1200ms on the brand curve, matching on an ancestor `a:hover` as well as on the wrapper's own hover, so it works whether the link is outside the wrapper or is the wrapper. It is deliberately NOT nested inside a `prefers-reduced-motion: no-preference` query: the global reduced-motion reset zeroes every transition duration, and a rule hidden behind `no-preference` could never be turned back on from there.

The other two are the `link` CTA variant's arrow nudge and the button lift below. Everything else eases on the brand curve through the base-layer rule in `globals.css` so nothing snaps.

### Tactile button press

`.press-tactile` adds a 1px depress on `:active` so CTAs feel physical:

```html
<a class="press-tactile bg-primary text-primary-foreground ...">Book a consultation</a>
```

Applied to CtaLink, header consultation pill, contact form submit, sticky CTA chip, filter chips. Honors reduced-motion via the global transition kill.

### Animated nav underline (`.nav-underline`)

Brand-primary underline that slides in from the center on hover and locks full-width on `[aria-current="page"]`. Applied to every link in the primary nav. Defined in `globals.css`.

### Sticky header behavior (`.site-header`)

The header is `position: sticky` with `top` set to minus its own height (`--header-h`; an overlay header parks at 1.9x so its scrim leaves the screen too), so it scrolls away with the page like any other block. Once the page is past 150px, a scroll UP makes the listener in BaseLayout set `data-scrolled` (pinned): `top` transitions to 0 and the bar slides in OVER the content. A scroll down slides it away again, and at scrollY 0 it is released into its slot, where the pinned and natural positions coincide. Because sticky never leaves the flow and overlay mode's negative margin now applies in every state, the header's layout slot never changes, so nothing below it moves (`tests/anchors.spec.ts` guards this). Direction only counts for a real gesture; a page that arrives already past 150px (fragment landing, restored position) pins instantly from position alone, with the transition suppressed.

### Reading progress (`.reading-progress`)

3px brand-color track at the top of journal posts. Inner div `scaleX`'s from 0 to 1 as the reader scrolls through `<article>`. GPU-only animation (transform), throttled via requestAnimationFrame. Reduced-motion users get a static full bar so the affordance remains.

Lives in `ReadingProgress.astro` (rendered inside `BaseLayout`'s slot on journal post pages).

### Surface-warm (`.surface-warm`)

A tinted radial gradient overlay for sections that want dimensional warmth. Uses `rgba(var(--tint-rgb), 0.07)` in light, `rgba(var(--tint-rgb), 0.10)` in dark. Apply alongside `bg-muted` or `bg-background`:

```html
<section class="surface-warm bg-muted">...</section>
```

Pairs with the global `body::before` paper-grain. Update `--tint-rgb` in `globals.css` when re-skinning the project so this overlay picks up the new hue automatically.

### Paper grain (`body::before`)

A faint SVG noise tile at 4% opacity sits behind everything via `body::before`. Adds tactile warmth across all surfaces. Multiply blend in light, screen blend in dark. Pointer-events none, z-index 0.

### Image zoom + tint on hover (`.img-zoom` / `.img-tint` / `.img-tint-light`)

Card hero images scale to 1.06 and gain a faint brand-color wash on hover. Add `.img-zoom` to the `overflow-hidden` image wrapper and drop an `.img-tint` (heavier, ~0.15 opacity) or `.img-tint.img-tint-light` (lighter, ~0.08 opacity) div inside it. The tint color is `rgba(var(--tint-rgb), <opacity>)` so it inherits the project palette. Transitions are gated behind `prefers-reduced-motion: no-preference`.

### Process connector lines (`.step-connector`)

A 2px thread draws downward from each step number badge toward the next step. `ProcessStep.astro` renders `<div class="step-connector">` in its left flex column when `!isLast`; the article grid is `items-stretch` so the connector's `flex: 1` fills the step height. The track rests at a muted color and a `::after` fill animates to the brand primary color (`scaleY` 0 to 1) when the BaseLayout observer adds `.is-visible`. Pass `isLast` on the final step in any sequence. Reduced-motion users get the filled track instantly, no draw.

### Editorial typography -- drop cap + blockquote (`.prose-drop-cap` / `.prose-blockquote`)

Journal posts open with a floated display-font drop cap on the first paragraph and render blockquotes with a 3px brand-primary left border in italic. `JournalPortableText.tsx` adds `.prose-drop-cap` to the first `normal` block only (a `firstNormalRendered` flag in the `makeComponents()` closure, rebuilt per render) and sets `className="prose-blockquote"` on blockquotes. The drop cap is pure CSS (`::first-letter`) -- nothing to gate for reduced motion. Don't apply `.prose-drop-cap` to short paragraphs; the floated cap needs a substantial opening paragraph to wrap against.

### Section dividers (when to use)

`SectionDivider.astro` renders a brand ornament for the specific case where two adjacent sections share a background color and need a visual break. **Don't sprinkle between every section** -- the alternating `bg-background` / `bg-muted` cadence already does that work. Reserve dividers for the edge case where two same-background sections would blur together.

### Print stylesheet

Two layers.

**The generic block** (`@media print` near the end of `globals.css`, every page) suppresses the header, footer, reading progress and every fixed element, sets black on white, prints an external link's address after it (never after a `/`, `#`, `mailto:` or `tel:` link), keeps headings with what follows and figures whole, and, since 2026-09-24, forces every `[data-reveal]` to its final state (opacity, the arch's clip, the glyph draw's dash, the ink's fade), so a figure or glyph the reader never scrolled to never prints blank.

**A post prints as a bulletin** (2026-09-24, `feat/print-motion`), from the `@media print` block at the end of the `<style is:global>` in `src/pages/post/[slug].astro`, so it ships in the post page's own CSS chunk (10,055 B to 12,969 B) and never in the global sheet every page inlines (CLAUDE.md rule 20). US Letter, margins 0.7/0.8/0.75in, "n of N" in the bottom-right margin box (`@page @bottom-right`, Chrome 131+; older engines just omit it). What stays: the masthead (eyebrow, title at 26pt, the lede, the order as a ruled list with Sunday, Reading, Series, Preaching and Listen, the Listen link printing its address), a photograph cover as a plain rectangle at most 5in wide (the door arch is a CSS mask, and a print without background graphics drops the mask while keeping the gold mould, so on paper both go), the body in Castoro at 11pt on a 5.9in measure, tables (header row repeats, rows never split), Q and A, the lection, points and list items kept whole, section heads kept with the next paragraph (`break-after: avoid`), figures whole and at most 3in tall, orphans and widows at 3. What goes: the header, footer and menu, the reading bar, the sticky chip and back-to-top (`main > astro-island`), the side column (a slide cover is lettering, and In this post is a screen control), the tags, the related project, More from this series and the doors, and any open search `dialog`. Ink: every text black (`#444` for labels and captions), and brand gold only as thin rules (the ruled order, the lection, section heads, table rules, the link underlines, and the list bullets and caption ticks, which are backgrounds on screen and become borders on paper). One derived line closes it, `.p2-print-foot` (hidden on screen): `site.name`, the Site settings address on one line, and the canonical post URL, none typed. The body's figures are `loading="lazy"`; a `beforeprint` listener on the post page flips them to eager first.

Verified with Playwright's `page.pdf()` on three posts (a sermon preview with a reading, the Messiah post's table and Q and A, a post with seven figures), pages rasterised and read; `tests/print.spec.ts` gates the chrome hidden, the masthead and body shown, the foot line, the link addresses and black ink under print media. A portrait figure that does not fit under the text still moves whole to the next page and leaves a gap; that is the price of never splitting a picture.

### View Transitions discipline

Astro View Transitions are wired via `<ClientRouter />` in BaseLayout. Any client-side script that needs to re-run on every navigation must listen to `astro:page-load`:

```js
function initThing() {
  /* ... */
}
initThing();
document.addEventListener('astro:page-load', initThing);
```

Pattern used by: scroll-reveal observer, sticky-header listener, reading-progress, sticky CTA chip. A script that must act at a precise point in a navigation uses the router's other events instead: `astro:before-preparation` (the post title's shared name, `src/components/transitions/shared-title.ts`), `astro:before-swap` (the search dialog's release) and `astro:after-swap`. See `animation.md`, "View transitions" and "Scrolling".

---

Cross-reference: `animation.md` covers native scrolling (Lenis was removed 2026-09-24), scroll reveals with the glyph draw and the ink-in, stagger reveals, hero entry stagger, Ken Burns slideshow, the view-transition cross-fade and the post title that carries over, and the opt-in script accent.
