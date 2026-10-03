---
paths:
  - 'src/layouts/**'
  - 'src/styles/globals.css'
  - 'src/data/site.ts'
  - 'src/components/ThemeToggle.tsx'
  - 'src/components/Header.astro'
  - 'src/components/Footer.astro'
  - 'src/components/MobileNav.tsx'
  - 'src/scripts/**'
  - 'tests/transitions.spec.ts'
  - 'tests/anchors.spec.ts'
---

# Rules 3 to 5: light-only theme, server-rendered nav, native scroll

Code comments cite these as "CLAUDE.md rule N".

3. **FBCM is LIGHT-ONLY since 2026-09-24.** The site always renders light: the theme init in `BaseLayout.astro` reads `site.theme` (`src/data/site.ts`, `'light'`), and while it says `'light'` it never reads localStorage or `prefers-color-scheme`, never adds `.dark`, pins `color-scheme: light` (plus a `<meta name="color-scheme" content="light">`), and the dark `theme-color` meta is not emitted. Why: measured across the identity passes, dark mode left Home practically unchanged (the identity is fixed brand bands in both themes) and only flipped the cream reading pages, at the cost of a second design pass per branch, dark-only clashes, and about a third of each branch's checks. There is no theme toggle anywhere. The `.dark` token block in `globals.css` and `src/components/ThemeToggle.tsx` are kept **dormant**, not deleted: bringing dark mode back is `site.theme = 'system'`, the toggle rendered again in the header, footer and mobile menu, and the dark test runs restored from git history (the light-only commit removed `tests/a11y-dark.spec.ts`, the dark runs in `contrast.spec.ts` and `menu.spec.ts`, the dark styleguide shot, and the dark pairs in `theme-tokens.test.ts`). Build and check in light only. Detail in `docs/agent/theme-and-color.md`.
4. **Desktop nav is server-rendered** in `Header.astro`. Do not regress it to a client-only island. Detail in `docs/agent/page-architecture.md`.
5. **Forward navigation lands at the top and Back/Forward restores the position, instantly.** Astro's router owns both (`scrollTo` 0 with `behavior: 'instant'` on a push, the saved position on a traverse). Lenis, and the reset it needed, were removed on 2026-09-24 (5.4 KB gzip on every page and a never-ending rAF loop for a wheel glide, plus the dead-wheel bug when the search stopped it across a swap). Scrolling is native; in-page anchors glide through `html[data-smooth-scroll] { scroll-behavior: smooth }` under `no-preference`, and the attribute is set on the visitor's first press, never at load, because with smooth scrolling on from the start Chrome glides its own reload restoration and the header is left unseeded. Do not bring back a scroll library, and do not put `scroll-behavior: smooth` on plain `html`. `tests/transitions.spec.ts` reads the position at `astro:after-swap`. Detail in `docs/agent/animation.md`, "Scrolling".
6. **Content is statically built.** A Sanity edit only goes live after a rebuild (push to `main`, or the publish webhook). Detail in `docs/agent/deployment.md`.
