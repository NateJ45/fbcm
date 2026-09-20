# Stone Steps 50K -- header/footer/nav survey for reuse on FBCM

Repo: C:\Users\natha\Documents\Claude\Projects\stonesteps-50k
Compared against: C:\Users\natha\Documents\Claude\Projects\fbcm (same starter/fork).

---

## 1. Header

File: src/components/Header.astro

Structure (desktop): the header is a "sign board" (`<header class="site-header sign-board">`), one main row (the eyebrow strip was already retired in favor of the mobile drawer carrying utility info). It is treated as a wooden trail sign: torn bottom edge, nailed logo plate, painted nav underline.

Scroll behavior (src/layouts/BaseLayout.astro "Polish layer" script + globals.css):
- position: sticky header (.site-header), hidden via transform: translateY(-100%) when data-state="hidden" is set by a scroll listener (hides after 120px of downward scroll, reappears on any upward scroll, rAF-debounced).
- Overlay mode (overlay prop): header paints NO background on entry (`.site-header[data-overlay]:not([data-scrolled]) { background: transparent; }`) so the hero's "mud" art bleeds up over the chrome; once scrollY > 8px a data-scrolled attribute is set and the header regains its --board-stock background. Two independent data attributes (data-state, data-scrolled) drive one header element.
- Background is var(--board-stock) -- the same texture token the footer uses, so header + footer read as "one sign cut in two."

Brand stripe / texture:
- `.sign-board::after` -- a torn/ragged bottom edge drawn as an inline SVG mask (irregular wavy path), repeated horizontally -- not a plain straight border.
- `.sign-badge` (the logo mount): a small rotated (-1.5deg) plate, dark stock (#3a3128) in both themes, 2px border, drawn "nail heads" (::before/::after circles) pinning the logo to the plate. Straightens to 0deg and lifts its shadow on hover/focus.

```css
.sign-badge {
  padding: 0.35rem 0.5rem; border: 2px solid var(--plate-edge); border-radius: 7px;
  background: #3a3128; box-shadow: var(--lift-ground-sm); rotate: -1.5deg;
  transition: rotate 0.24s ease, box-shadow 0.24s ease;
}
a:hover > .sign-badge, a:focus-visible > .sign-badge { rotate: 0deg; box-shadow: var(--lift-ground); }
```

Wordmark: theme-aware single <img> with no initial src/srcset; an inline script sets the correct light/dark file synchronously before paint, re-applied on astro:after-swap.

CTA: `.btn-plate` -- the site's "sign plate button" (see section 2/6) at --sm size in the header, with an arrow that nudges right on hover, and an "is-current" state that dims it when already on that page.

Distinctive detail: a mobile-only pulsing "availability" pill (green dot with animate-ping halo) linking to /contact, absolutely positioned opposite the hamburger -- killed under reduced motion by the global animation-duration override.

---

## 2. Desktop navigation

Same file, plus globals.css (~lines 3031-3096).

- Links are set in the display font (Staatliches, condensed/caps), not body text -- called out in a comment as "the last type on the site still set in a web face" before this change.
- `.nav-stroke` (flat links) -- a painted underline, not a straight rule: an irregular hand-drawn brush-stroke SVG mask, scale: 0 1 at rest, growing from the CENTER (transform-origin: center) to scale(0.7, 1) on hover/focus and full scale(1,1) when aria-current="page" is set.

```css
.nav-stroke::after {
  background: var(--heading-accent);
  -webkit-mask-image: url("data:image/svg+xml,...irregular wavy path...");
  scale: 0 1; transform-origin: center;
  transition: scale 0.22s cubic-bezier(0.16,1,0.3,1);
}
.nav-stroke:hover::after, .nav-stroke:focus-visible::after { scale: 0.7 1; }
.nav-stroke[aria-current='page']::after { scale: 1 1; }
```

- Dropdown groups use native <details>/<summary> (server-rendered, no JS-only mega menu) with a .nav-underline variant (plain scaleX underline) on the summary and a ChevronDown that rotates 180deg when open. A small progressive-enhancement script adds hover-intent open (140ms close delay), outside-click close, Escape close, and close-on-link-click -- but the menu works with JS off via <details> alone.
- Active page marked with aria-current="page" everywhere (flat links, dropdown summary when a child is active, submenu items); CSS keys off that attribute directly rather than a separate "active" class.
- A vertical divider and a Facebook icon button sit between the nav and the CTA.

FBCM's desktop nav (.nav-underline only, plain body-size Inter, scaleX underline from center) uses the same underlying mechanism but the plainer variant (no painted-stroke mask) and no display-face nav type.

---

## 3. Mobile menu

File: src/components/MobileNav.tsx (island, client:idle, radix/shadcn Sheet).

- Opens as a side="top" full-viewport sheet ("the board DROPS into place rather than sliding in from the edge"), data-[side=top]:h-dvh -- not a right-hand drawer. The library's own close button is disabled (showCloseButton={false}) in favor of a custom cream nailed-plate close button (.menu-close, rotated 1.5deg, straightens on hover) positioned exactly where the header trigger was.
- Background: contour/topo lines (an inline <svg> of 11 procedurally generated quadratic paths, seeded RNG, portrait viewBox 800x1400) plus a .menu-mud layer -- a CSS mask using a PNG of footprints (/mud/walk-phone.png) tinted with the theme's ink color. Literalizes the "trail sign" motif inside the menu itself.
- Content besides links: a "Menu" eyebrow + centered logo mark at top; numbered nav rows (01, 02...) set in the display face at ~2.5-3.6rem (clamp), each row wrapped in .stamp-word for its reveal animation; group headings for dropdown items; a claim-stamp-styled tagline "stamped" across the bottom; the register/CTA plate (btn-plate, full width); a Facebook icon button; the theme toggle.
- Animation: each row (.menu-item.stamp-word / .menu-group.stamp-word) uses the shared word-stamp keyframe (linear, 420ms) with a staggered animation-delay: calc(var(--wi) * 80ms + 140ms) -- rows "stamp" onto the board one after another like a rubber-stamp press, echoing the homepage hero's word-by-word title animation. aria-current="page" rows get a colored "echo" (text-shadow) matching the hero wordmark's double-strike treatment.
- Focus trap / scroll lock / Escape: all delegated to Radix Dialog (via shadcn Sheet) -- "Still a Radix Dialog under the hood... so focus trapping, Escape, scroll locking and the aria wiring are the library's, not ours." No custom focus-trap code.
- Close affordance: the custom .menu-close plate button (top-right) plus every link's onClick={close}.
- Reduced motion: .stamp-word { animation: none } under prefers-reduced-motion: reduce (global rule), so rows are simply present at rest instead of un-stamped.
- Hydration note (perf-relevant): explicitly client:idle, not client:only, specifically because client:only was costing ~750ms of modeled LCP by forcing the React runtime onto the critical path; the closed Sheet server-renders its trigger fine.

FBCM's MobileNav.tsx is the plain shadcn drawer starting point: side="right", w-[min(380px,90vw)], a stock Menu icon trigger, a flat list of plain <a> rows in body/display text with hover background, a bottom "Get in touch" block (phone/Contact/theme toggle) and a bottom-centered logo -- no topo/mud art, no stamp animation, no numbered rows, no full-bleed drop-in.

---

## 4. Footer

File: src/components/Footer.astro, styles globals.css ~2400s and ~4560-4740s ("The footer, as the trail sign at the finish").

- Ground: .foot-mud, a masked mud/footprint texture layered over the footer, plus a torn top edge matching the header's torn bottom edge (var(--ridge-mask)), so header and footer are explicitly "one sign cut in two, nailed at either end of the page." Background is the same --board-stock token as the header.
- Distinctive band above the link columns: "Next running" -- the race date set at poster size (.foot-date, clamp(2rem, 5.2vw, 3.25rem), display font, with the same subtle double-strike text-shadow echo the hero headline uses), edition/venue line, an inline Countdown clock, and a Register CTA (btn-plate--cream). This band only renders while the race is still upcoming.
- Link columns are numbered rows (01, 02...) in the display face rather than a plain unordered list, using the same "stamped route" visual language as the mobile menu; long labels drop to a smaller sub-class (.foot-link__label--long) computed at build time from string length.
- A separate "reference rail" (a <dl>) holds "Get in touch" (copy-email button, phone) and "Elsewhere" (social icons) -- kept apart from the numbered nav columns because "everything reference rather than navigation ... is a small rail beside them."
- The wordmark reappears at the bottom on the same .sign-badge "nailed plate" component the header uses (.foot-badge), "bigger and turned the other way, so the two boards read as the same sign seen at opposite ends of the page."
- Base rail: centered copyright + legal links + optional "Designed by" credit, on one line.
- The starter's generic 5-column footer (Studio/Work/Free tools/newsletter/latest-projects) was explicitly deleted rather than hidden behind a flag, per the file's own comments.

FBCM's footer is a single flat bg-indigo-field band: wordmark+tagline+phone/email/socials, two Sanity link columns as plain <ul>, an "Office" hours/address column, and a thin bottom bar -- no texture, no numbered rows, no poster-size date/countdown, no torn edge, no "nailed plate" callback to the header.

---

## 5. Motion layer

src/layouts/BaseLayout.astro + src/styles/globals.css. This layer is shared with FBCM almost verbatim (same starter) -- the [data-reveal] fade/translate-up-on-intersect pattern, [data-stagger-grid] nth-child stagger delays, .img-curtain mask-wipe image reveals, .step-connector scaleY line draws, the sticky-header hide/show script, and the Lenis smooth-scroll bootstrap (idle-loaded, reduced-motion-gated, with a View Transitions scroll-reset fix) are essentially the same mechanism in both repos (verified in FBCM's BaseLayout.astro).

Stone Steps-specific additions layered on top of that shared engine:
- .stamp-word / word-stamp keyframe -- a rubber-stamp "drop in with a bounce/blur" reveal (420ms, staggered via a --wi custom property), used for the hero headline words, the footer's claim stamp, and every mobile-menu row. Reduced motion sets animation: none (word just appears, no un-stamping).
- Two continuous idle-loop animations, both gated on prefers-reduced-motion: no-preference: topo-creep (contour lines drift +/-9px/6px over 47s) and echo-breathe (the hero's double-strike text-shadow offset breathes over 7s) -- subtle ambient motion absent from FBCM entirely.
- View Transitions: <ClientRouter /> plus a directional data-vt="forward"|"back" attribute set on <html> from astro:before-preparation / astro:after-swap, driving a CSS "pages race past each other" slide transition (named view-transition-name: site-header pins header/footer so they don't animate).
- .card-lift hover micro-interaction (border/shadow/translateY ease) and .btn-plate press physics (skewed parallelogram buttons that lift up-left on hover and slam down-right on :active, with the skew preserved even under reduced motion -- only the travel is killed, not the shape) are the site's core hover/tap language, reused everywhere (header CTA, footer Register, mobile-menu CTA, close button).

---

## 6. Other bespoke details

- Sign-plate buttons (.btn-plate): every CTA site-wide is a "physical" parallelogram button -- 2px black border, hard offset shadow, -7deg skew via a CSS variable (--plate-skew) so hover/active transforms can compose the skew back in without ever un-skewing the button; hover lifts up-left and grows the shadow, active drives down-right and flattens it to zero. A --cream variant (cream face/dark ink) is used for secondary actions (Register in the footer).
- Trail blaze (.blaze): section eyebrows are led by a small rotated painted "blaze" rectangle (like a trail-marking blaze on a tree) plus a hairline rule trailing off to the right -- a --plain variant swaps the rectangle for a dot on the hero.
- Rubber-stamped claim (.claim-stamp): taglines are set inside a rotated (-6deg default) double-ruled "postmark" box using the theme's flipping --heading-accent ink.
- Nailed sign plates: the same .sign-badge component (rotated plate + drawn nail heads) mounts the logo in the header, the footer, and the mobile menu -- a single repeated object across all three chrome components.
- Torn/ragged edges: SVG-mask "torn paper/wood" edges connect the header's bottom and the footer's top -- not simple straight borders.
- Procedurally generated topo/contour lines and mud/footprint texture masks recur throughout (hero, mobile menu, footer) as the site's signature "trail" texture, all seeded/deterministic so no external asset dependency beyond two small PNG masks (/mud/*.png).
- The outlined "k" glyph (.k-outline, stroke-only text) and numbered rows (01, 02...) as a recurring "topographic map / trail marker" numbering motif in both the footer and mobile menu.
- Countdown clock embedded inline in the footer next to the race date (reused hero component with its housing stripped off).
- No custom cursor, no marquee, and no visible grain/noise overlay were found in this repo.

---

## 7. Comparison with FBCM (Header.astro, MobileNav.tsx, Footer.astro, BaseLayout.astro, globals.css)

Shared/identical infrastructure (same starter, verified in FBCM's BaseLayout.astro):
- [data-reveal] scroll-reveal observer, [data-stagger-grid], .img-curtain, .step-connector, sticky-header hide/show data-state script, Lenis smooth-scroll bootstrap, <ClientRouter /> View Transitions, <details>/<summary> desktop dropdown mechanics + the same hover-intent/outside-click/Escape script, client:idle hydration strategy for the mobile Sheet, and the anti-FOUC theme-logo swap script -- all present in FBCM in essentially the same form.

Absent from FBCM entirely:
1. Header/footer "sign board" texture and torn-edge masks (.sign-board, .foot-mud, ridge mask) -- FBCM's header/footer are flat bg-background / bg-indigo-field panels.
2. The nailed logo plate (.sign-badge) -- FBCM uses a plain <img> wordmark with no mount/frame treatment, in header, footer, or mobile menu.
3. Painted brush-stroke nav underline (.nav-stroke, masked SVG) and display-face desktop nav type -- FBCM's nav is plain body-weight Inter with a straight scaleX underline (.nav-underline, present in both but Stone Steps layers the painted variant on top for flat links).
4. Full-screen "drop from top" mobile menu with topo/mud background art and staggered rubber-stamp row reveals -- FBCM's mobile menu is the stock right-side Sheet with a flat, unanimated link list.
5. Numbered-row nav language (01, 02...) shared by mobile menu and footer -- absent from FBCM's footer, which uses a plain <ul>.
6. Poster-scale display-type footer date/countdown/Register band -- FBCM's footer has no equivalent "hero moment" band; its four columns are all body-size.
7. Skewed "sign plate" buttons (.btn-plate) with press-physics hover/active -- FBCM's Give button is a plain flat-color rounded rectangle (bg-gold, rounded-sm) with only a color-transition hover, no lift/press/skew.
8. Trail-blaze section eyebrows (.blaze) and rubber-stamped claim/tagline boxes (.claim-stamp) -- FBCM has no eyebrow-marker or stamped-tagline treatment.
9. Ambient idle-loop motion (topo-creep, echo-breathe) and the header-overlay/transparent-until-scrolled treatment (data-overlay/data-scrolled) -- FBCM's header always paints bg-background, never transparent-over-hero.

Present in FBCM but in a weaker form:
- Desktop dropdown nav mechanics (<details>, hover-intent script) -- same code, just styled plainer (no display face, no painted underline).
- Mobile Sheet -- same Radix/shadcn primitive and client:idle hydration strategy, but with none of the art, stagger, or full-bleed drop treatment.
- CTA button -- same "one button family" philosophy (single CTA style reused header/drawer) but rendered as a flat rectangle instead of the skewed, physically-animated plate.
- Footer link columns -- same "editor-driven Sanity columns with built-in fallback" data model, but rendered as a plain list rather than the numbered/display-face rows.
- Scroll-triggered reveals, sticky-header behavior, Lenis, View Transitions -- functionally identical; FBCM just has no distinct bespoke motion signature layered on top (no stamp/breathe/creep animations).

Most reusable for FBCM, roughly in order of effort-to-impact: the skewed .btn-plate button treatment (self-contained CSS), a numbered-row footer link treatment, the painted .nav-stroke underline, and a "drop from top" full-bleed mobile menu with a lighter version of the stagger reveal -- the mud/topo/nail-plate art specifically is trail-race iconography and would need a church-appropriate equivalent motif rather than a literal port.
