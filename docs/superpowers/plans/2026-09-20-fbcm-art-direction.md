# FBCM Art-Direction Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the approved home-page prototype's visual language (type, scale, photography, band variety, colour roles, chrome, motion) into the real components under all eleven pages, the blog and the post template, with zero schema changes, so every page scores 16/20 or better on the generic-design rubric.

**Architecture:** The prototype at `prototypes/home/index.html` is the reference implementation: its CSS blocks are the code each task transcribes into Tailwind utilities and `@theme` tokens. Tokens and fonts change first through `brand.config.json` + `apply-brand`; then the shared primitives (SectionHeading, CtaLink, SectionDivider, utilities); then the chrome (header with overlay mode, a drop-from-top mobile menu, a poster footer); then the section components in the order the home page needs them, then the rest; then the blog and post template; then a motion pass; then a per-page review, parity recapture, visual baseline and deploy.

**Tech Stack:** Astro 7, Tailwind 4 (`@theme` tokens in `src/styles/globals.css`), React 19 islands (MobileNav only), fontsource variable packages (Castoro Titling, Castoro, Sofia Sans Semi Condensed), Playwright, node --test.

**Spec:** `docs/superpowers/specs/2026-09-20-fbcm-art-direction-design.md`. Brief: `docs/superpowers/notes/2026-09-20-design-research.md`. Reference render: `prototypes/home/index.html` (open it in a browser and keep it open while implementing).

## Global Constraints

- Brand colours unchanged: indigo `#292854`, gold `#d59b29`, taupe `#b5aba3`, brown `#39251e`, brown-mid `#724f43`. They become accents; chrome is paper `#f4efe6` / `#14121b` and ink `#17151f` / `#f1ece3`.
- **Zero schema changes. No typegen. No dataset writes. No new Sanity fields.** Every new behaviour derives from existing data.
- No em-dashes in any string a visitor reads. The strings "about an hour" and "Hymns, the choir, and a sermon, then coffee in the fellowship hall" are NOT shipped in this pass.
- Light AND dark on every UI change, at 1440 and 390, screenshots walked so reveals fire (the shooter in Task 0 does this).
- Desktop nav stays server-rendered. The Lenis reset and the sticky-header gesture gate in `BaseLayout.astro` are not changed.
- Dependencies: exactly three additions, `@fontsource/castoro-titling@5.3.0`, `@fontsource/castoro@5.3.0`, `@fontsource-variable/sofia-sans-semi-condensed@5.3.0`. Nothing else is installed or bumped. Never `npm audit fix --force`.
- Any component that parses a string from Sanity calls `splitStega()` (`src/lib/preview-stega.ts`) first.
- Rule 17: one left edge per page, one button family (CtaLink), one heading system (SectionHeading). Each band may break the container at most once, by an image.
- Exactly one element per page at `--text-display`.
- The gates: `npm run check`, `npm run test:unit`, `npm test` (both engines, axe light + dark, anchors). `npm run parity compare` is expected RED until Task 13 recaptures it.
- Every task ends with screenshots in the report and the task's rubric notes. A report with no screenshots is not done.

---

### Task 0: Branch, worktree, page shooter

**Files:**
- Create: `scripts/shoot-pages.mjs`
- Create: `.superpowers/sdd/2026-09-20-fbcm-art-direction/` (workspace, via the SDD script)

**Interfaces:**
- Produces: `node scripts/shoot-pages.mjs <outDir> [route ...]` which builds nothing, serves `dist/client` statically on port 4611, and writes `<route>-<desk|mob>-<light|dark>.png` full-page screenshots, walking each page first so `[data-reveal]` fires and lazy images load. Every later task's screenshots come from this script.

- [ ] **Step 1: Create the worktree on a new branch**

```bash
git worktree add ../fbcm-art-direction -b feat/art-direction main
cd ../fbcm-art-direction && npm ci
```

- [ ] **Step 2: Write the shooter**

```js
// scripts/shoot-pages.mjs
// Full-page screenshots of built routes at two viewports in both colour
// schemes, each page walked top to bottom first so [data-reveal] fires and
// lazy images load (the vault gotcha fullpage-screenshot-skips-scroll-reveal).
// Usage: node scripts/shoot-pages.mjs <outDir> [route ...]   (routes default to the eleven pages)
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
if (!out) { console.error('usage: node scripts/shoot-pages.mjs <outDir> [route ...]'); process.exit(1); }
const routes = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ['/', '/visit/', '/who-we-are/', '/beliefs/', '/ministries/', '/staff/', '/history/', '/wedding/', '/give/', '/contact/', '/blog/'];
const root = path.resolve('dist/client');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  let f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) f = path.join(root, '404.html');
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(4611);

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const route of routes) {
  const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  for (const [vp, w, h] of [['desk', 1440, 900], ['mob', 390, 844]]) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
      const page = await ctx.newPage();
      await page.goto(`http://localhost:4611${route}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += h * 0.7) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(140); }
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(out, `${slug}-${vp}-${scheme}.png`), fullPage: true });
      console.log(slug, vp, scheme, total);
      await ctx.close();
    }
  }
}
await browser.close();
srv.close();
```

- [ ] **Step 3: Prove it against the current build**

Run: `npm run build && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-before /`
Expected: four files, `home-desk-light.png`, `home-desk-dark.png`, `home-mob-light.png`, `home-mob-dark.png`, all reveals visible (no blank bands).

- [ ] **Step 4: Commit**

```bash
git add scripts/shoot-pages.mjs
git commit -m "chore: page shooter for the art-direction pass"
```

---

### Task 1: Fonts, tokens and the contrast gate

**Files:**
- Modify: `package.json` (three fontsource packages), `brand/brand.config.json`, `src/styles/globals.css` (imports, `@theme`, `:root`, `.dark`), `src/lib/prose.ts`, `src/lib/theme-tokens.test.ts`, `sanity.config.ts` (via apply-brand), `scripts/generate-og-default.mjs` (via apply-brand), `public/og-default.png` (via `npm run og`)

**Interfaces:**
- Produces tokens every later task uses: `--font-display` (Castoro Titling), `--font-body` (Castoro), `--font-ui` (Sofia Sans Semi Condensed) and the utility `font-ui`; `--text-display`, `--text-h1`, `--text-h2`, `--text-h3`, `--text-lede`; `--color-bg #f4efe6`, `--color-bg-#ebe4d8`, `--foreground #17151f`, `--muted-foreground #514c58`, `--color-gold-ink #8a5f0c`, `--hair`; `--container-content: 87.5rem`; `--spacing-gutter: clamp(20px, 5vw, 72px)`; `--radius: 2px`.
- `PROSE_MEASURE` becomes `'text-foreground/90 text-body leading-[1.72] max-w-[62ch]'`.

- [ ] **Step 1: Install the three faces**

```bash
npm install @fontsource/castoro-titling@5.3.0 @fontsource/castoro@5.3.0 @fontsource-variable/sofia-sans-semi-condensed@5.3.0 --save-exact
```

Expected: `package-lock.json` gains exactly three packages; `find node_modules -path "*@sanity/ui/package.json" | wc -l` still prints 1.

- [ ] **Step 2: Update `brand/brand.config.json`**

Set `fonts.display.familyValue` to `"\"Castoro Titling Variable\", Georgia, serif"`, `fonts.display.ogFontStack` to `"Castoro Titling, Georgia, serif"`, `fonts.display.imports` to `["@fontsource/castoro-titling"]`; `fonts.body.familyValue` to `"\"Castoro Variable\", Georgia, serif"`, `ogFontStack` `"Castoro, Georgia, serif"`, `imports` `["@fontsource/castoro"]`. Palette `theme`: `--color-bg` `#F4EFE6`, `--color-bg-soft` `#EBE4D8`, `--color-cream` `#F4EFE6`, `--color-secondary` `#B5ABA3`, `--color-tertiary` `#B5ABA3`, `--color-border-soft` `#DCD5C9`. Palette `light`: `--background #F4EFE6`, `--foreground #17151F`, `--card #F4EFE6`, `--popover #F4EFE6`, `--primary #292854`, `--primary-foreground #F4EFE6`, `--secondary #EBE4D8`, `--muted #EBE4D8`, `--muted-foreground #514C58`, `--accent #EBE4D8`, `--accent-foreground #17151F`, `--border #DCD5C9`, `--input #DCD5C9`, `--ring #292854`, `--link #17151F`, `--tint-rgb "41, 40, 84"`, `--primary-accent #1C1B3A`, `--outline #292854`, sidebar values matching. Palette `dark`: `--background #14121B`, `--foreground #F1ECE3`, `--card #1C1926`, `--popover #1C1926`, `--primary #F1ECE3`, `--primary-foreground #14121B`, `--secondary #1C1926`, `--muted #1C1926`, `--muted-foreground #C2BCC9`, `--accent #26222f`, `--accent-foreground #F1ECE3`, `--border oklch(1 0 0 / 14%)`, `--ring #D59B29`, `--link #F1ECE3`, `--tint-rgb "213, 155, 41"`. `radius` `"0.125rem"`. `studio.fonts` display/body to the new stacks.

- [ ] **Step 3: Apply the brand and add what apply-brand does not own**

Run: `npm run apply-brand`
Then edit `src/styles/globals.css` by hand:

1. Add after the two fontsource imports: `@import '@fontsource-variable/sofia-sans-semi-condensed';`
2. In `@theme`, add:

```css
  --font-ui: 'Sofia Sans Semi Condensed Variable', system-ui, sans-serif;
  --color-gold-ink: #8a5f0c; /* gold as a LABEL on paper: 7.0:1 on #f4efe6, gated */
  --color-indigo-deep: #1b1a3a; /* the footer field */
  --text-display: clamp(2.9rem, 1rem + 8.4vw, 8rem);
  --text-lede: clamp(1.25rem, 1rem + 1vw, 1.75rem);
  --text-body: 1.0625rem;
  --text-ui: 0.8125rem;
  --spacing-gutter: clamp(20px, 5vw, 72px);
  --leading-display: 0.95;
  --tracking-display: 0.01em;
```

and change: `--text-h1: clamp(2.6rem, 1rem + 5.4vw, 6rem); --text-h2: clamp(2rem, 1.2rem + 2.6vw, 3.25rem); --text-h3: clamp(1.375rem, 1rem + 1vw, 1.75rem); --container-content: 87.5rem; --tracking-eyebrow: 0.14em;`.

3. Add `--hair` and `--hair-strong` to `:root` (`rgba(23,21,31,.16)` / `.34`) and `.dark` (`rgba(241,236,227,.16)` / `.34`), and expose them: in `@theme inline` add `--color-hair: var(--hair); --color-hair-strong: var(--hair-strong);`.
4. In `.dark`, set `--color-indigo-field: #22214a; --color-brown: #2b1b16;` (indigo-field already moves in dark; brown did not).
5. Add utilities:

```css
@utility font-ui { font-family: var(--font-ui); font-stretch: 100%; }
@utility text-display { font-size: var(--text-display); line-height: var(--leading-display); letter-spacing: var(--tracking-display); }
@utility text-lede { font-size: var(--text-lede); line-height: 1.35; }
@utility text-body { font-size: var(--text-body); }
@utility text-ui { font-size: var(--text-ui); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
@utility { }
@utility oldstyle { font-variant-numeric: oldstyle-nums proportional-nums; }
```

6. In the base layer where `h1..h6` get `font-family: var(--font-display); font-weight: 500;` h1 keeps `var(--font-display)` and gains `text-transform: uppercase; letter-spacing: 0.01em; font-weight: 400;`; h2 to h6 switch to `var(--font-body)` at weight 400; all gain `text-wrap: balance;`. Body gets `font-size: var(--text-body); line-height: 1.7; font-optical-sizing: auto;`.

- [ ] **Step 4: Retoken the prose measure**

In `src/lib/prose.ts` set `PROSE_MEASURE = 'text-foreground/90 text-body leading-[1.72] max-w-[62ch]'`.

- [ ] **Step 5: Update the contrast gate to the new pairs, then run it to see it fail first**

In `src/lib/theme-tokens.test.ts`: update every expected hex the test reads by name (`--color-bg` etc. are read from the CSS, so most tests follow automatically), then ADD to `CHURCH_PAIRS_AA`: `['color-gold-ink', 'color-bg', 'gold as a label on paper']`, `['color-gold-ink', 'color-bg-soft', 'gold label on the band']`, `['color-accent', 'color-bg', 'ink on paper']`, `['color-gold', 'color-indigo-deep', 'gold labels on the footer field']`, `['color-taupe', 'color-indigo-deep', 'muted text on the footer field']`. Keep `CHURCH_PAIRS_FORBIDDEN` (gold on cream, taupe on cream still fail). Run: `npm run test:unit`. Expected: any failure is a pair that genuinely fails; fix the TOKEN (never the assertion) until green. Record every measured ratio in the report.

- [ ] **Step 6: Regenerate the OG image and build**

Run: `npm run og && npm run build && npm run check && npm run test:unit`
Expected: all green; the built stylesheet lists Castoro Titling, Castoro and Sofia Sans Semi Condensed `@font-face` rules and no Inter or Libre Baskerville.

- [ ] **Step 7: Screenshot home in all four states and commit**

Run: `node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t1 /`
Expected: the page renders in the new faces on warm paper; layout otherwise unchanged (this task is tokens only).

```bash
git add -A
git commit -m "feat(theme): Castoro Titling, Castoro and Sofia Sans Semi Condensed; paper-and-ink chrome tokens; contrast gate updated"
```

---

### Task 2: Shared primitives

**Files:**
- Modify: `src/components/SectionHeading.astro`, `src/components/CtaLink.astro`, `src/components/SectionDivider.astro`, `src/styles/globals.css` (nav-underline, bleed utilities, button plate)

**Interfaces:**
- Produces: `SectionHeading` renders eyebrow (`font-ui text-ui text-gold-ink` on paper, `text-gold` on band/inverse), headline at : h1 in , h2 and h3 in , subhead as `.lede` (`font-body italic font-normal text-lede`), no rule and no hairline. `rule` prop accepted and ignored.
- `CtaLink` variants: `gold` (fill gold, label `text-indigo-field`, `font-ui text-ui font-semibold`, `px-[1.6em] py-[1.05em] rounded-sm`, and the plate signature: a 1px indigo-field line drawn 3px inside the edge with `shadow-[inset_0_0_0_3px_var(--color-gold),inset_0_0_0_4px_var(--color-indigo-field)]`), `outline`, `link` (`font-ui text-ui font-semibold border-b border-current pb-1 inline-flex gap-2` with a trailing `→` span that translates 4px on hover). Aliases `primary`/`secondary` kept.
- Utilities: `.bleed-right { margin-right: min(calc(-1 * var(--spacing-gutter)), calc((100vw - var(--container-content)) / -2 - var(--spacing-gutter))) }`, `.bleed-left` mirror, both collapsing to `margin-inline: calc(-1 * var(--spacing-gutter))` under `max-width: 900px`.
- `.nav-underline::after`: `left: 0; right: 100%; height: 1px; background: var(--color-gold); transition: right 300ms cubic-bezier(.2,.7,.2,1)`; hover/focus/current `right: 0`. No `transform`.

- [ ] **Step 1: SectionHeading**

Rewrite the class computations: `headingClass` = h1 `font-display uppercase text-h1 leading-none tracking-[0.01em] font-normal`, h2 `font-body text-h2 leading-[1.05] font-normal max-w-[22ch]`, h3 `font-body text-h3 leading-[1.15] font-normal`. Eyebrow `p` gets `font-ui text-ui font-medium mb-5` and the tone colours: default/church `text-gold-ink`, band/inverse `text-gold`. Delete both rule branches (the `mb-m` spacer, the hairline, the gold bar). Subhead `p` gets `lede mt-5 font-body italic font-normal text-lede` with `text-foreground` (paper) or `text-bg/85` (dark). Keep the accent-splitting logic untouched.

- [ ] **Step 2: CtaLink**

Replace `baseClasses` and `variantClasses` per the interface. The plate signature: gold → `bg-gold text-indigo-field shadow-[inset_0_0_0_3px_var(--color-gold),inset_0_0_0_4px_var(--color-indigo-field)] hover:-translate-y-px`; outline light → `border border-foreground text-foreground shadow-[inset_0_0_0_3px_var(--color-bg),inset_0_0_0_4px_var(--color-foreground)]`; outline onDark → paper equivalents. Keep `press-tactile` and the focus rings. Add the arrow span for `link`.

- [ ] **Step 3: SectionDivider**

Delete the sun glyph markup. Render `<div class="mx-auto max-w-content px-gutter"><hr class="border-0 border-t border-hair" /></div>`.

- [ ] **Step 4: globals.css**

Redraw `.nav-underline`, add `.bleed-right`/`.bleed-left`, and replace `.card-lift:hover`'s shadow with `none` (cards are gone; the class stays for compile safety until Task 13 removes callers). Retime `.hero-entry-stagger` children to `1000ms cubic-bezier(.2,.7,.2,1)` with delays 0/150/300/450/600ms and `translateY(22px)`.

- [ ] **Step 5: Build, unit, screenshots, commit**

Run: `npm run check && npm run test:unit && npm run build && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t2 / /visit/`
Expected: h1s are in the titling capitals, h2s in Castoro roman, none with a gold bar; buttons carry the inset double rule; `section-fields.test.ts` still green.

```bash
git add -A && git commit -m "feat(primitives): heading system, button plate, hairline divider, bleed utilities"
```

---

### Task 3: Header with overlay mode

**Files:**
- Modify: `src/components/Header.astro`, `src/layouts/BaseLayout.astro` (a `data-overlay` attribute and the `data-scrolled` toggle in the polish script; nothing else in that script), `src/styles/globals.css` (`.site-header` overlay rules, `--header-offset`), `tests/anchors.spec.ts` if the offset assertion is numeric

**Interfaces:**
- `BaseLayout` accepts a new prop `overlayHeader?: boolean`; `src/pages/index.astro` and `src/pages/[slug].astro` pass `overlayHeader={firstBlock?._type === 'heroSection' && hasImage(firstBlock)}`. The layout sets `data-overlay` on `<header>` when true.
- The polish script sets `header.dataset.scrolled = '1'` when `scrollY > 8` and removes it otherwise, inside the existing rAF handler, unconditionally (not gated on the gesture flag).

- [ ] **Step 1: Header markup**

Remove the 4px stripe and the utility row. One row: `mx-auto flex max-w-content items-center justify-between px-gutter h-[74px] lg:h-[88px]`. Wordmark `h-12 lg:h-14`. Nav links: `font-ui text-[0.9375rem] font-medium tracking-[0.01em] nav-underline py-1`, active `aria-current="page"`. Give: `<CtaLink>`-equivalent classes from Task 2's gold variant (keep it inline as now but with the new classes). Theme toggle: a 28px icon button at the row's end (`lg:flex`), and it disappears from here on `<lg` (it lives in the menu). Dropdown panel: `bg-background border border-hair rounded-sm p-1`, no shadow.

- [ ] **Step 2: Overlay CSS**

```css
.site-header { position: sticky; top: 0; z-index: 50; background: var(--color-bg); border-bottom: 1px solid var(--hair); transition: transform 300ms cubic-bezier(.4,0,.2,1), background 300ms, border-color 300ms, color 300ms; }
.site-header[data-overlay]:not([data-scrolled]) { background: transparent; border-bottom-color: transparent; color: var(--color-bg); margin-bottom: calc(-1 * var(--header-h, 88px)); }
.site-header[data-overlay]:not([data-scrolled]) .nav-underline { color: inherit; }
.site-header[data-state='hidden'] { transform: translateY(-100%); }
```

The negative margin lets the hero start under the header. The theme-logo swap script must prefer the DARK logo file whenever `data-overlay` is present and `data-scrolled` is absent, then re-run on the scrolled toggle (extend the existing inline script: listen for a custom `header:scrolled` event the polish script dispatches).

- [ ] **Step 3: Header offset**

Measure the new header (74px mobile, 88px desktop) and set `--header-offset: 5.5rem` and `@media (min-width:1024px) { 6.5rem }`. Run `npm test -- tests/anchors.spec.ts` and adjust the numbers until the suite passes on both engines.

- [ ] **Step 4: Build, tests, screenshots, commit**

Run: `npm run check && npm run build && npm test -- tests/anchors.spec.ts && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t3 / /beliefs/`
Expected: on home the header is transparent over the tower with paper text and becomes paper after 8px of scroll; on /beliefs (text hero) it is paper from the start; anchors land below it.

```bash
git add -A && git commit -m "feat(header): one row, Sofia Sans Semi Condensed nav, gold underline, overlay mode over image heroes"
```

---

### Task 4: The mobile menu

**Files:**
- Modify: `src/components/MobileNav.tsx`, `src/components/Header.astro` (trigger placement, props), `src/styles/globals.css` (menu rows, window drift)
- Create: `src/assets/menu-window.jpg` (the alpha-and-omega window at 1600px wide, from `prototypes/home/img/glass.jpg`, copied not re-encoded)

**Interfaces:**
- `MobileNav` new props: `serviceTime?: string`, `street?: string`, `windowUrl?: string` (Header passes `getImage()` of the asset at 1200w, quality 70). Existing props stay.
- Header renders the trigger as `<button class="font-ui text-ui font-semibold inline-flex items-center gap-2 lg:hidden">Menu <span aria-hidden class="menu-glyph" /></button>` where `.menu-glyph` is two 18px hairlines.

- [ ] **Step 1: Rebuild the sheet**

`<SheetContent side="top" showCloseButton={false} className="h-dvh w-full max-w-none border-0 bg-indigo-field text-bg p-0 overflow-y-auto data-[side=top]:h-dvh">`. Inside, structure:

```tsx
<div className="relative flex min-h-full flex-col px-gutter pt-4 pb-8">
  {/* window texture: masked to the top 40%, drifting */}
  <div aria-hidden className="menu-window pointer-events-none absolute inset-x-0 top-0 h-[40%]" style={{ backgroundImage: `url(${windowUrl})` }} />
  <div className="relative flex h-[58px] items-center justify-between">
    <img src={logoDarkUrl} alt={site.name} width={257} height={100} className="h-11 w-auto" />
    <button type="button" onClick={close} aria-label="Close menu" className="font-ui text-ui font-semibold inline-flex items-center gap-2 rounded-sm bg-bg px-3 py-2 text-indigo-field">Close <span aria-hidden>×</span></button>
  </div>
  <nav aria-label="Primary mobile" className="relative mt-10 flex-1">
    <ol className="m-0 list-none p-0">
      {rows.map((item, i) => (
        <li key={item.href} className="menu-row border-b border-bg/15" style={{ '--i': i } as CSSProperties}>
          <a href={item.href} onClick={close} aria-current={current ? 'page' : undefined}
             className="group flex items-baseline gap-5 py-4">
            <span className="font-ui text-[0.75rem] tracking-[0.14em] text-gold">{String(i + 1).padStart(2, '0')}</span>
            <span className="font-display uppercase tracking-[0.02em] text-[clamp(1.75rem,6.4vw,2.75rem)] font-normal leading-none nav-underline">{item.label}</span>
          </a>
        </li>
      ))}
    </ol>
  </nav>
  <div className="relative mt-10 grid grid-cols-2 gap-6 border-t border-bg/15 pt-6 font-ui text-sm">
    <div><p className="text-ui text-gold mb-2">Sundays</p><p>{serviceTime}</p><p className="text-bg/70">{street}</p></div>
    <div className="flex flex-col items-end gap-2">{phone && <a href={telHref(phone)}>{phone}</a>}<a href="/contact" onClick={close}>Contact</a><ThemeToggle /></div>
  </div>
  {cta.show && <a href={cta.href} ... className="relative mt-6 block text-center [gold plate classes]">{cta.label}</a>}
</div>
```

Dropdown groups flatten into rows: the group label becomes a non-link row in `font-ui text-ui text-bg/60` followed by its items as numbered rows.

- [ ] **Step 2: CSS**

```css
.menu-window { background-size: cover; background-position: 50% 45%; opacity: .22;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%); mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  animation: menu-drift 40s ease-in-out infinite alternate; }
@keyframes menu-drift { from { transform: translate3d(0,0,0) } to { transform: translate3d(-12px,-6px,0) } }
.menu-row { opacity: 0; translate: 0 24px; animation: menu-rise 480ms cubic-bezier(.2,.7,.2,1) forwards; animation-delay: calc(140ms + var(--i) * 70ms); }
@keyframes menu-rise { to { opacity: 1; translate: 0 0 } }
@media (prefers-reduced-motion: reduce) { .menu-window { animation: none } .menu-row { animation: none; opacity: 1; translate: none } }
```

- [ ] **Step 3: Verify in a real browser**

Run `npm run dev`, open at 390 wide, open the menu: rows rise in sequence, Escape closes, focus is trapped, background does not scroll, the current page row shows the gold underline, reduced motion (DevTools rendering emulation) shows rows at rest. Take two screenshots (menu open, light and dark system theme) with Playwright at 390x844 by clicking the trigger; save to the shots folder.

- [ ] **Step 4: Gates and commit**

Run: `npm run check && npm run build && npm test -- tests/smoke.spec.ts tests/axe-light.spec.ts tests/axe-dark.spec.ts`
Expected: green; axe reports no contrast failure inside the open menu (add a menu-open assertion to `axe-dark.spec.ts` if the suite does not open it).

```bash
git add -A && git commit -m "feat(menu): drop-from-top indigo menu with numbered rows, window texture and staggered rise"
```

---

### Task 5: The footer

**Files:**
- Modify: `src/components/Footer.astro`, `src/lib/live-sunday.ts` (created in Task 6; if Task 5 runs first, create it here per Task 6 Step 1)

**Interfaces:**
- Footer receives `siteSettings` as now and reads `serviceTime` and `address` from it (both already on the object).

- [ ] **Step 1: Markup**

Band `bg-indigo-deep text-bg`. Remove the 4px gold rule. Top poster row inside the container, `py-section-md`: a `p` in `font-ui text-ui text-gold` reading "This Sunday" (client-side upgraded to the dated line by the live-sunday script, see Task 6), an `h2`-less `p` in `font-display uppercase tracking-[0.01em] font-normal text-[clamp(2rem,5.2vw,3.25rem)] leading-none` reading the service time exactly as `siteSettings.serviceTime` gives it ("Sundays at 10:45 am"), a `p` in `font-body italic text-lede text-bg/75` with the street line, and the gold Give button. Then a `border-t border-bg/15`. Then the four columns: brand (wordmark `h-16`, tagline in `font-body italic font-normal text-lede text-bg/75 max-w-[26ch]`), the two editor columns as `<ol>` with numbered rows (`font-ui text-[0.75rem] text-gold` number, `font-body text-[1.25rem] font-normal` label, `border-b border-bg/12 py-2`), Office as prose in `font-body text-bg/80`. Base rail: copyright, legal links, `ThemeToggle client:idle`, `font-ui text-[0.8125rem] text-bg/70`.
- Texture: an absolutely positioned `<img>` of `src/assets/menu-window.jpg` at `opacity-10` in the top-right quarter, `mask-image: radial-gradient(ellipse at top right, #000, transparent 70%)`, `aria-hidden`, `loading="lazy"`.

- [ ] **Step 2: Gates, screenshots, commit**

Run: `npm run check && npm run build && npm test -- tests/axe-dark.spec.ts tests/axe-light.spec.ts && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t5 / /give/`
Expected: footer poster line reads on both themes at 4.5:1 or better (gold on indigo-deep is gated in Task 1).

```bash
git add -A && git commit -m "feat(footer): poster line, numbered columns, window texture on the indigo field"
```

---

### Task 6: Hero

**Files:**
- Create: `src/lib/live-sunday.ts`, `src/lib/live-sunday.test.ts`
- Modify: `src/components/Hero.astro`, `src/components/HeroBackground.astro`, `src/components/SectionRenderer.astro` (pass `serviceTime` from settings into the hero), `src/layouts/BaseLayout.astro` (one inline script that upgrades `[data-live-sunday]` text nodes)

**Interfaces:**
- `SectionSiteSettings` (in `src/lib/pageBuilder.types.ts`) gains `serviceTime?: string`; the GROQ projection in `src/lib/queries.ts` already selects it, and SectionRenderer passes `settings` down as it does for SundayTimes and GiveBand. This is a TypeScript type addition, not a schema change.
- `formatLiveSunday(now: Date, serviceTime: string): string` returns `"Today · Worship at 10:45 am"` when `now` is a Sunday, else `"This Sunday, September 27 · Worship at 10:45 am"`, where `10:45 am` is `serviceTime` with a leading `Sundays at ` removed. Pure, no DOM.
- Any element with `data-live-sunday="<serviceTime>"` has its text replaced client-side by `formatLiveSunday(new Date(), attr)`. The server-rendered text is always the true static form `"Sundays · Worship at 10:45 am"`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/live-sunday.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLiveSunday, staticSunday } from './live-sunday';

test('a weekday names the coming Sunday', () => {
  assert.equal(formatLiveSunday(new Date(2026, 8, 23), 'Sundays at 10:45 am'), 'This Sunday, September 27 · Worship at 10:45 am');
});
test('a Sunday says Today', () => {
  assert.equal(formatLiveSunday(new Date(2026, 8, 27), 'Sundays at 10:45 am'), 'Today · Worship at 10:45 am');
});
test('the static form never carries a date', () => {
  assert.equal(staticSunday('Sundays at 10:45 am'), 'Sundays · Worship at 10:45 am');
});
test('a bare time is accepted', () => {
  assert.equal(staticSunday('10:45 am'), 'Sundays · Worship at 10:45 am');
});
```

Run: `node --test src/lib/live-sunday.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 2: Implement**

```ts
// src/lib/live-sunday.ts
// Safe to edit by hand
// The one dated line on the site. Server renders staticSunday(); the browser
// upgrades it with formatLiveSunday(). Pure functions, unit-tested. Callers
// pass serviceTime through splitStega().cleaned first: this module measures
// the string and must never see a stega payload.
export function timeOnly(serviceTime: string): string {
  return serviceTime.replace(/^Sundays?\s+at\s+/i, '').trim();
}
export function staticSunday(serviceTime: string): string {
  return `Sundays · Worship at ${timeOnly(serviceTime)}`;
}
export function formatLiveSunday(now: Date, serviceTime: string): string {
  const add = (7 - now.getDay()) % 7;
  if (add === 0) return `Today · Worship at ${timeOnly(serviceTime)}`;
  const s = new Date(now); s.setDate(now.getDate() + add);
  const label = s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `This Sunday, ${label} · Worship at ${timeOnly(serviceTime)}`;
}
```

Run the test again. Expected: PASS.

- [ ] **Step 3: Hero.astro, full layout**

- Section: `relative isolate flex min-h-[100svh] flex-col justify-end text-bg overflow-hidden` for `size="tall"`, `min-h-[72svh]` for short. Delete the `.hero-fill` machinery, the scroll cue button and its script (the header now overlays, so the hero is simply the viewport).
- `HeroBackground.astro`: replace the flat `bg-accent-dark/25` and the gradient div with ONE overlay: `background: linear-gradient(to top, rgba(23,21,31,.94) 0%, rgba(23,21,31,.62) 34%, rgba(23,21,31,.12) 62%, rgba(23,21,31,0) 80%), linear-gradient(to right, rgba(23,21,31,.55) 0%, rgba(23,21,31,0) 55%)`. Keep the cross-fade; delete the pause button and the dots.
- Content wrapper: `relative mx-auto w-full max-w-content px-gutter pt-[clamp(72px,12vh,128px)] pb-[clamp(40px,7vh,72px)] hero-entry-stagger`.
- Line 1: when `size === 'tall'` and `serviceTime` is present, `<p class="font-ui text-ui font-medium inline-flex items-center gap-3.5 mb-[clamp(18px,3vh,32px)]"><span class="h-px w-11 bg-gold" aria-hidden /><span data-live-sunday={timeOnlyClean}>{staticSunday(clean)}</span></p>`; otherwise the eyebrow in the same classes without the gold dash. `clean = splitStega(serviceTime).cleaned`.
- h1: `font-display uppercase tracking-[0.01em] font-normal text-display text-bg max-w-[12ch]` for tall, `text-h1 leading-none` for short.
- Subhead: `lede mt-[clamp(18px,3vh,30px)] max-w-[34ch] font-body italic font-normal text-lede text-bg`.
- Facts: `<dl class="mt-[clamp(28px,5vh,48px)] flex max-w-[960px] flex-wrap gap-[clamp(24px,4vw,64px)] border-t border-bg/18 pt-[clamp(20px,3vh,28px)]">`, `dt` `font-ui text-ui text-bg/70 mb-1.5`, `dd` `font-body text-[clamp(1.25rem,1rem+.9vw,1.625rem)] leading-tight`.
- CTAs: primary `<CtaLink variant="gold" onDark>`, secondary `<CtaLink variant="link" onDark>`.

- [ ] **Step 4: Split and text layouts**

Split: the image column gets `bleed-right` (or `bleed-left` when `imageSide` would be left; heroes have no side, so always right), the `border-l-4 border-gold` is removed, the words column uses the same classes as the full layout's content (ink colours). Text: unchanged apart from the primitives.

- [ ] **Step 5: The upgrade script**

In `BaseLayout.astro`, after the polish script, an inline module: query `[data-live-sunday]`, import nothing (inline the two functions, 12 lines, they are tiny), set `textContent`; run on load and `astro:page-load`. Under `prefers-reduced-motion` it still runs (it is text, not motion).

- [ ] **Step 6: Gates, screenshots, commit**

Run: `npm run check && npm run test:unit && npm run build && npm test -- tests/smoke.spec.ts && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t6 / /visit/ /staff/`
Expected: home hero matches `prototypes/home` fold at 1440 and 390 within the difference of the real photo pipeline; the LCP image is still preloaded (check the `<link rel=preload>` in `dist/client/index.html`).

```bash
git add -A && git commit -m "feat(hero): full-bleed gradient hero at display scale, live Sunday line, lede and facts"
```

---

### Task 7: Sunday times as two doors

**Files:**
- Modify: `src/components/sections/SundayTimes.astro`, `src/components/SectionRenderer.astro` (pass `frame`: the page's first `imageTextSection.image` when one exists AFTER this block in the array; otherwise null)

**Interfaces:**
- `SundayTimes` new prop `frame?: SanityImageObject | null`. With a frame, the right door renders the photograph in `bleed-right` at 4:3 with a caption row; without one, the existing static map card renders in the new type.

- [ ] **Step 1: Left door**

Eyebrow (`SectionHeading` with `eyebrow` only is not enough; render inline): `p.font-ui.text-ui.text-gold-ink.mb-5`; `div.font-body.oldstyle.font-normal.text-display.leading-none.-ml-[.04em]` (the numeral is Castoro roman, the one place `text-display` is used outside a hero) holding the first item's `big` with any trailing ` am|pm` wrapped in `<span class="text-[.28em] italic font-normal align-[.1em] ml-[.15em]">`; the first item's `body` as the lede (`max-w-[26ch]`); then `<ul class="mt-9 border-t border-hair">` where every item AFTER the first, and every `door` if the block has doors, renders `<li class="grid grid-cols-[7ch_1fr] gap-5 py-4 border-b border-hair items-baseline"><span class="font-body oldstyle font-normal text-2xl">{big}</span><span class="font-body text-body">{label} <em class="text-muted-foreground">{body}</em></span></li>`.

- [ ] **Step 2: Right door and grid**

Wrapper `mx-auto grid max-w-content grid-cols-12 gap-x-[clamp(16px,2.5vw,40px)] gap-y-14 px-gutter py-section-lg`; left door `col-span-12 lg:col-span-5`; right `col-span-12 lg:col-start-7 lg:col-span-6`. Frame: `<figure class="bleed-right"><SanityImage ... class="aspect-[4/3] w-full object-cover" sizes="(min-width:1024px) 55vw, 100vw" width={1800} /><figcaption class="mt-3.5 flex justify-between gap-5 font-ui text-[0.75rem] tracking-[.06em] text-muted-foreground"><span>{alt}</span></figcaption></figure>`. Under it the block's `heading` as h3 (`font-body text-h3 mt-8 max-w-[24ch]`) and, when the block has an `intro`/second-item body, one paragraph, then the CTA if present as `variant="link"`.

- [ ] **Step 3: SectionRenderer**

Where `sundayTimesSection` is rendered, compute `frame` by scanning `rows` forward from the current index for the first `imageTextSection` with `image?.asset` and pass it. Do not remove that image from the later block (the building shows at two distances on purpose).

- [ ] **Step 4: Gates, screenshots, commit**

Run: `npm run check && npm run build && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t7 / /visit/ /contact/`

```bash
git add -A && git commit -m "feat(sunday): the service time as the page's numeral, the morning as a ruled schedule, two doors"
```

---

### Task 8: Link row, image-text, rich text, the blog list

**Files:**
- Modify: `src/components/sections/LinkCards.astro`, `src/components/sections/ImageText.astro`, `src/components/sections/RichTextSection.astro`, `src/components/sections/DynamicList.astro`, `src/components/JournalCard.astro`, `src/components/SectionRenderer.astro` (`afterFullBleed` flag), `src/lib/layout-variants.test.ts` (base columns)

- [ ] **Step 1: LinkCards → ruled row**

Delete the card wrapper and the gold top border. Render `<div class="grid grid-cols-1 md:grid-cols-3 border-t border-hair">` with each card as `<a class="group py-7 pr-[clamp(16px,2vw,32px)] md:border-r md:border-hair md:mr-[clamp(16px,2vw,32px)] last:border-r-0 last:mr-0 border-b md:border-b-0 border-hair">` containing eyebrow (`font-ui text-ui text-gold-ink mb-3`), title (`font-body text-h3 font-normal`), body (`mt-2.5 font-body text-base leading-[1.55] max-w-[34ch] text-muted-foreground`), and the link as `<span class="mt-3.5 inline-block font-body italic">{label} →</span>`. The band keeps `surface` for its background. New prop `onDark?: boolean` switches ink to paper, eyebrows to gold and hairlines to `bg/18`.

**The statement band, with no new block type.** `LinkCards` gains `frame?: SanityImageObject | null`. SectionRenderer passes the page's SECOND spare image (the first spare goes to SundayTimes in Task 7; "spare" = any `imageTextSection.image` or `gallerySection` item later in the array), and only when the block has a `heading`. With a frame the block renders as the prototype's statement: `relative isolate flex min-h-[88svh] flex-col justify-end text-bg`, the frame as an absolutely positioned `SanityImage` (`object-cover object-[50%_40%]`, `sizes="100vw"`, `width={2400}`), the Task 6 bottom-up gradient, the heading at `font-display uppercase tracking-[0.01em] font-normal text-h1 max-w-[15ch]`, then the ruled row above with `onDark`. Without a frame it renders the light ruled row under a normal SectionHeading. The frame image is NOT removed from its own later block.

- [ ] **Step 2: ImageText → asymmetric**

Grid `grid-cols-12`: heading block `col-span-12 lg:col-span-4` (eyebrow, h2 `max-w-[11ch]`, lede from the first body paragraph ONLY when the body has 3+ paragraphs, otherwise no lede), body `col-span-12 lg:col-start-6 lg:col-span-6 font-body text-[1.125rem] leading-[1.72]`, CTA as `link`. Figure `col-span-12 lg:col-start-5 lg:col-span-8 mt-[clamp(56px,7vw,96px)] bleed-right` (or `lg:col-span-8 bleed-left` when `imageSide === 'left'`), image `aspect-video object-cover`, `object-position` from the hotspot rule, caption from alt in `font-ui text-[0.75rem] tracking-[.06em] text-muted-foreground mt-3`. Update `layout-variants.test.ts` for the new base columns.

- [ ] **Step 3: RichTextSection**

With a heading: `grid-cols-12`, heading `lg:col-span-4`, prose `lg:col-start-6 lg:col-span-6` with `PROSE_MEASURE`. Without: prose alone at `PROSE_MEASURE`. PortableText styles: h2 `font-body font-normal text-h2 mt-12 mb-4`, h3 `font-body text-h3 mt-8 mb-3`, lists `font-body`, links `underline decoration-gold underline-offset-4`, blockquote `font-body italic font-normal text-h3 border-l border-gold pl-6`.

- [ ] **Step 4: DynamicList and JournalCard**

DynamicList (journal mode): header row `flex justify-between items-baseline border-b border-hair-strong pb-4` with eyebrow left and "All posts →" `link` right; each post `<a class="post grid grid-cols-12 gap-x-[clamp(16px,2.5vw,40px)] items-baseline py-8 border-b border-hair group">`: date `col-span-12 md:col-span-2 font-ui text-[0.8125rem] tracking-[.06em] text-muted-foreground`, title+excerpt `col-span-12 md:col-start-3 md:col-span-6` (title `font-body text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] font-normal group-hover:text-gold-ink transition-colors`, excerpt `mt-2.5 text-muted-foreground max-w-[56ch]`), category `md:col-start-10 md:col-span-3 justify-self-end font-ui text-ui text-muted-foreground`. JournalCard (used by the blog index grid): drop the 2px top bar, the tint overlay, the border and the shadow; image `aspect-[4/3] object-cover`, category in `font-ui text-ui text-gold-ink mt-4`, title `font-body text-h3 mt-2`, date `font-ui text-[0.8125rem] text-muted-foreground mt-2`. Keep the hover as `group-hover:text-gold-ink` on the title and `scale-[1.02] duration-[1200ms]` on the image.

- [ ] **Step 5: Gates, screenshots, commit**

Run: `npm run check && npm run test:unit && npm run build && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t8 / /who-we-are/ /ministries/ /beliefs/`

```bash
git add -A && git commit -m "feat(bands): ruled link row, asymmetric image-text, narrow prose, editorial blog list"
```

---

### Task 9: Heritage, give, scripture, closing CTA, stats

**Files:**
- Modify: `src/components/sections/HeritageBand.astro`, `src/components/sections/GiveBand.astro`, `src/components/sections/ScriptureBand.astro`, `src/components/FinalCta.astro`, `src/components/StatsRow.astro`, `src/components/SectionRenderer.astro` (`extraImages` and `years` for HeritageBand; `lastBeforeFooter` for GiveBand)

- [ ] **Step 1: HeritageBand**

New props `extraImages?: SanityImageObject[]` (SectionRenderer collects, in page order, the images of every `gallerySection` item and `imageTextSection` on the page EXCEPT the one SundayTimes borrowed, and passes the first two) and `years?: { year: string; label: string }[]` (from the page's `timelineSection` rows: the first, the middle and the last, `year` = the row's `marker` field, which is the year or era string the timeline shows, `label` = its `title`, max three; skipped entirely when the page has no timeline block). Render: the detail strip `grid grid-cols-2 md:grid-cols-[5fr_3fr_4fr] gap-1.5 h-auto md:h-[clamp(320px,52vw,680px)]` edge to edge (outside the container) with the block image first then the extras, each `object-cover h-full w-full`; then the container on `bg-brown text-bg`: h2 `lg:col-span-6`, paragraph + `link` CTA `lg:col-start-8 lg:col-span-5 self-end`, and when `years` is present the numeral row `lg:col-span-6 mt-8 flex gap-10 flex-wrap` with each `border-l border-bg/18 pl-4` holding `font-body oldstyle font-normal text-4xl` and `font-ui text-sm text-bg/70`.

- [ ] **Step 2: GiveBand**

`bg-bg-soft` by default; `bg-indigo-field text-bg` only when `lastBeforeFooter` is false (a light band would follow) AND the previous block is dark; SectionRenderer computes both from `rows`. Grid: h2 `lg:col-span-7`, paragraph + gold button `lg:col-start-8 lg:col-span-5 self-center`.

- [ ] **Step 3: ScriptureBand**

`bg-indigo-field text-bg relative isolate overflow-hidden`; verse `font-body italic font-normal text-h1 max-w-[20ch]`, reference `font-ui text-ui text-gold mt-6`; texture `<img src={menu-window} class="absolute inset-y-0 right-0 w-1/2 object-cover opacity-[.18] mix-blend-luminosity" aria-hidden loading="lazy" />` masked with `mask-image: linear-gradient(to left, #000, transparent)`.

- [ ] **Step 4: FinalCta and StatsRow**

FinalCta: `bg-indigo-field`, h2 `font-display uppercase tracking-[0.01em] font-normal text-h1 max-w-[16ch]`, subhead as lede, gold button + `link`. StatsRow: numerals `font-body oldstyle font-normal text-h1`, labels `font-ui text-ui text-muted-foreground`, `divide-x divide-hair`.

- [ ] **Step 5: Gates, screenshots, commit**

Run: `npm run check && npm run test:unit && npm run build && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t9 / /history/ /give/ /visit/`

```bash
git add -A && git commit -m "feat(bands): detail-strip heritage band, quiet give band, scripture on the glass, closing CTA and stats"
```

---

### Task 10: Staff, timeline, FAQ, quote, documents, hours

**Files:**
- Modify: `src/components/sections/StaffGrid.astro`, `src/components/sections/Timeline.astro`, `src/components/sections/FaqBand.astro`, `src/components/FaqAccordion.tsx`, `src/components/sections/QuoteBlock.astro`, `src/components/sections/DocumentList.astro`, `src/components/sections/Hours.astro`, `src/lib/layout-variants.test.ts`

- [ ] **Step 1: StaffGrid**

Heading block in the narrow column (`lg:col-span-4`), grid `lg:col-start-5 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12`. Each member: portrait `aspect-[4/5] object-cover object-top w-full`, name `font-body text-2xl font-normal mt-4`, role `font-ui text-ui text-gold-ink mt-1`, email `font-body text-sm underline decoration-gold underline-offset-4 mt-2`, bio (when `showBios`) `font-body text-base text-muted-foreground mt-3`. No card, no border, no shadow, no rounded corners. Rows get `border-t border-hair pt-6` via the grid item.

- [ ] **Step 2: Timeline**

Each row `grid grid-cols-12 gap-x-[clamp(16px,2.5vw,40px)] py-10 border-t border-hair`: year `col-span-12 lg:col-span-3 font-body oldstyle font-normal text-h2 leading-none`, content `col-span-12 lg:col-start-4 lg:col-span-6` (title `font-body text-h3`, body `font-body text-body mt-3`), image when present `col-span-12 lg:col-start-10 lg:col-span-3 aspect-[4/5] object-cover` on even rows and `lg:col-start-1 lg:col-span-3 bleed-left` on odd rows with the year moving to `lg:col-start-4`. Delete the connector line.

- [ ] **Step 3: FaqBand and FaqAccordion**

Band `bg-indigo-field text-bg`; trigger `font-body text-[1.375rem] font-normal py-5 border-b border-bg/15 flex justify-between gap-6`, icon a `+` in `font-ui text-gold` rotating 45deg when open (`data-state=open`), content `font-body text-body text-bg/80 pb-6 max-w-[62ch]`.

- [ ] **Step 4: QuoteBlock, DocumentList, Hours**

QuoteBlock: no quote marks; quote `font-body italic font-normal text-h2 max-w-[24ch]`, attribution `font-ui text-ui text-gold-ink mt-6`. DocumentList: the blog-list grammar from Task 8 (year group heading `font-body oldstyle text-h2 font-normal`, rows with date left, title Castoro Titling, description Castoro, hairlines). Hours: label `font-ui text-ui text-gold-ink`, times `font-body oldstyle text-h3`, hairlines.

- [ ] **Step 5: Gates, screenshots, commit**

Run: `npm run check && npm run test:unit && npm run build && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t10 /staff/ /history/ /visit/ /wedding/ /beliefs/ /contact/`

```bash
git add -A && git commit -m "feat(bands): editorial staff grid, numeral timeline, indigo FAQ, quote, documents, hours"
```

---

### Task 11: Blog index, archives, post, 404, privacy

**Files:**
- Modify: `src/pages/blog/index.astro`, `src/pages/blog/page/[page].astro`, `src/pages/blog/category/[slug].astro`, `src/pages/blog/category/[slug]/page/[page].astro`, `src/pages/blog/tag/[tag].astro`, `src/pages/post/[slug].astro`, `src/components/JournalPortableText.tsx`, `src/components/JournalCategoryChip.astro`, `src/components/ReadingProgress.astro`, `src/pages/404.astro`, `src/pages/privacy.astro`

- [ ] **Step 1: Index and archives**

Page opener: h1 `font-display uppercase tracking-[0.01em] font-normal text-h1`, lede. Category chips: `font-ui text-ui px-3 py-2 border border-hair rounded-sm`, active `bg-foreground text-background`. Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14` of the Task 8 JournalCard. Pagination in `font-ui text-ui` with the gold underline.

- [ ] **Step 2: Post**

Header: category `font-ui text-ui text-gold-ink`, title `font-display uppercase tracking-[0.01em] font-normal text-h1 max-w-[18ch]`, excerpt as lede, meta row (date, author, reading time) `font-ui text-[0.8125rem] text-muted-foreground border-y border-hair py-3 flex gap-6`. Cover `bleed-right lg:col-start-5` or full-measure when portrait. Body column at `PROSE_MEASURE` with JournalPortableText styles: h2 `font-body font-normal text-h2 mt-14 mb-5`, h3 `text-h3 mt-10 mb-3`, p `font-body text-body leading-[1.72]`, figure full-measure, figcaption `font-body italic text-sm text-muted-foreground mt-3`, blockquote `font-body italic font-normal text-h3 border-l border-gold pl-6 my-10`, lists with gold markers. Reading progress bar `bg-gold h-[2px]`. Related posts as the Task 8 list.

- [ ] **Step 3: 404 and privacy**

Take the primitives; 404 keeps the tower photograph but full-bleed with the Task 6 gradient and `text-h1`.

- [ ] **Step 4: Gates, screenshots, commit**

Run: `npm run check && npm run build && npm test -- tests/smoke.spec.ts && node scripts/shoot-pages.mjs .superpowers/sdd/2026-09-20-fbcm-art-direction/shots-t11 /blog/ /post/handels-messiah-sing-in-carols-muncie/ /blog/category/music/ /404.html`
(Use a real post slug from `dist/client/post/`.)

```bash
git add -A && git commit -m "feat(blog): editorial index, post template in the reading face, 404 and privacy"
```

---

### Task 12: Motion pass

**Files:**
- Modify: every component that sets `data-reveal` (grep `data-reveal` under `src/`), `src/styles/globals.css`, `src/layouts/BaseLayout.astro` (view-transition names only), `src/components/HeroBackground.astro` (breathe)

- [ ] **Step 1: Prune reveals**

Remove `data-reveal` and `data-stagger-grid` from prose, headings, lists and CTAs. Keep it on: every `<figure>`/`SanityImage` wrapper in the bands, the big numerals (SundayTimes, StatsRow, Timeline years, HeritageBand years), and the JournalCard image. `grep -rn "data-reveal" src | wc -l` before and after goes in the report.

- [ ] **Step 2: Hover language**

`globals.css`: `.card-lift` deleted along with its callers (grep); image-in-link hover `a img { transition: transform 1200ms cubic-bezier(.2,.7,.2,1) } a:hover img { transform: scale(1.02) }` scoped to `.zoom-img`; the `link` arrow nudge; the button lift. Verify nothing snaps: every interactive element eases on the brand curve (the base-layer rule already covers bare elements).

- [ ] **Step 3: Ambient**

Hero: `@media (prefers-reduced-motion: no-preference) { .hero-overlay { animation: hero-breathe 7s ease-in-out infinite alternate } @keyframes hero-breathe { from { --stop: 94% } to { --stop: 90% } } }` using a registered `@property --stop { syntax: '<percentage>'; inherits: false; initial-value: 94% }` in the bottom gradient's first stop. The menu drift is already in Task 4.

- [ ] **Step 4: View transitions**

`view-transition-name: site-header` on `.site-header`, `site-footer` on `<footer>`, so chrome holds still across navigations.

- [ ] **Step 5: Reduced motion check and commit**

Playwright: add `tests/motion.spec.ts` with two tests: under `reducedMotion: 'reduce'` no element on `/` has a running animation after load (`getAnimations().length === 0` excluding the hero cross-fade which is already static under reduced motion); under `no-preference` the hero headline's opacity is 1 within 1.6s. Run: `npm test -- tests/motion.spec.ts`.

```bash
git add -A && git commit -m "feat(motion): hero-only load choreography, reveals on photographs and numerals, one hover language, two ambient loops"
```

---

### Task 13: Page review, parity, baseline, docs, deploy

**Files:**
- Modify: `docs/superpowers/notes/2026-09-20-review-walkthrough.md` (new section), `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` (the two held strings, marked "not shipped, awaiting approval"), `docs/PENDING.md`, `CLAUDE.md` (the type, the token names, the chrome, rule 17's new examples), `docs/agent/changelog.md`, `docs/agent/theme-and-color.md`, `docs/agent/components.md`, `scripts/.parity/*` (recapture), `PORTS.md` (a card for `shoot-pages.mjs` and `live-sunday.ts` if judged portable)

- [ ] **Step 1: Score every page**

Run the shooter for all eleven routes plus one post. For each page write the ten rubric scores with one line of evidence each into `.superpowers/sdd/2026-09-20-fbcm-art-direction/rubric.md`. Any page under 16 gets a fix round in this task (the fix must be a component change, never a page-specific override).

- [ ] **Step 2: Photo at three distances**

For each page, list which image is the wide, the room and the detail. Where a page lacks one, note it as a photo-day item in `docs/PENDING.md`, do not invent one.

- [ ] **Step 3: Lighthouse**

Run the six recorded pages in both form factors as `docs/superpowers/notes/2026-09-20-lighthouse.md` did; append the new table. Any score below the recorded one is investigated before the merge (the likely cause is image weight from full-bleed photographs: check the `sizes` attributes and `widths`).

- [ ] **Step 4: Parity recapture with proof**

```bash
npm run build && npm run parity:capture && npm run build && npm run parity:compare
```

Expected: `162/162 PASS` and the built stylesheet's byte count identical across the two builds (record both numbers).

- [ ] **Step 5: Full gate**

Run: `npm run check && npm run test:unit && npm run format:check && npm run check:links && npm test`
Expected: all green on both engines. READ the result before any push.

- [ ] **Step 6: Docs**

Update the files listed above. The CLAUDE.md changes: the Stack essentials line on fonts; the design-seam bullets; a new rule 18: "One element per page at `--text-display`, and reveals only on photographs and numerals"; the routes table is unchanged.

- [ ] **Step 7: Commit, then hand to finishing-a-development-branch**

```bash
git add -A && git commit -m "docs: art-direction pass recorded; parity recaptured; rubric per page"
```

After the merge to main and the deploy, run the Visual regression workflow with `update: true`, confirm all four workflows green, then probe production: the home hero's `data-live-sunday` attribute is present and the menu trigger reads MENU.
