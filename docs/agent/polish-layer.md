# Polish layer

> Custom CSS utilities and JS behaviors layered on Tailwind: brand stripe, image zoom, surface-warm, reading-progress, sticky-header, nav-underline, paper-grain, and print stylesheet.

Animation behaviors (Lenis, scroll reveals, stagger grid, hero entry, view transitions, Ken Burns slideshow, script accent opt-in) are documented separately in `animation.md`.

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

A `@media print` block in `globals.css` suppresses nav, footer, CTAs, and decorative elements, and sets `color: black; background: white` on the body so journal post content prints cleanly. This is intentionally minimal -- the goal is a legible print, not a designed one.

### View Transitions discipline

Astro View Transitions are wired via `<ClientRouter />` in BaseLayout. Any client-side script that needs to re-run on every navigation must listen to `astro:page-load`:

```js
function initThing() {
  /* ... */
}
initThing();
document.addEventListener('astro:page-load', initThing);
```

Pattern used by: scroll-reveal observer, sticky-header listener, reading-progress, sticky CTA chip. See `animation.md` for details on the Lenis + view-transitions interaction, which is a special case.

---

Cross-reference: `animation.md` covers Lenis smooth scroll, scroll reveals, stagger reveals, hero entry stagger, Ken Burns slideshow, view-transition cross-fade, and the opt-in script accent.
