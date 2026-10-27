# Wayfinding: phone menu groups, where-next rows, the Sunday bar (starter card 191, 2026-10-27)

From FBC Auburn by way of the starter. Three pieces, each a Site settings box (Studio tab
"Menus") resolved by the PORTABLE `src/lib/wayfinding.ts`. The live site has no data in those
boxes and the rollout wrote none, so each one falls back to the church defaults in
`src/data/wayfinding-defaults.ts` while it is empty. Fill a box in the Studio and that box's
data wins, box by box.

The defaults use only routes this site really has and the labels its header menu already uses.
They hold no church fact: the service time, the YouTube channel and the directions link are read
from Site settings, and a row or bar whose fact is empty is left out.

## Phone menu groups (`phoneMenuGroups`)

- `Header.astro` resolves the groups (`phoneMenuGroups()`, dropping the header button's page) and
  hands them to the React `MobileNav.tsx` as its existing folding dropdown groups with
  `grouped` set. The sheet, its Radix focus trap, Escape, focus return and the pinned Give button
  are unchanged.
- With `grouped`, each group's name is an `h2` around its fold button (the accordion pattern), and
  on a page that is in none of the groups the first one ("New here") starts open, so Visit is one
  tap away. The group holding the current page starts open, as before.
- Defaults: **New here** (Visit, Who We Are, Beliefs, Ministers, History), **Get involved**
  (Ministries, Weddings & Events), **This week** (What's On, Blog, The Visitor, The Kid's Corner,
  The Moose's Message), **Reach us** (Contact). Every page the header menu lists, nothing it does
  not; Give is the sheet's own button.
- The desktop nav is untouched (rule 4): it is still the editor's menu (`navItems`). Since the phone
  menu is now its own list, a page added to the header menu is not added to the phone groups by
  itself: add it to Site settings > Phone menu groups (or to the defaults file).

## Where next rows (`whereNext`)

- `WhereNext.astro`, at the top of the footer, restyled in this site's grammar: Castoro Titling
  capitals on the footer's indigo, gold eyebrow notes, paper hairlines between rows, and no hover
  background (the art-direction spec's menu rule): the hover is the gold hairline drawing under the
  label and the gold arrow drawing out.
- The first three rows that are not the page you are on; a row to a Studio page shows only while
  that page is published (`getPublishedPageSlugsOnce()`, one query per build).
- One closing device per page: `FinalCta.astro` carries `data-final-cta`, and the rows hide on a
  page whose `<main>` holds it. Most main pages end on that band (Visit, Beliefs, Give, History,
  Ministries, Ministers, Weddings, Architecture), so the rows show mainly on Contact, Who We Are, The
  Visitor, the blog and the other built routes.
- Defaults: Visit ("Your first Sunday"), Who We Are ("Our church and its story"), Ministries
  ("Find your place"), Watch (the YouTube channel from Site settings, "Every service on YouTube"),
  Give ("Support the work").

## The Sunday bar (`actionBars`)

- `ActionBar.astro`, rendered inside `<footer id="site-footer">`: phones only (under 768px), shows
  once the page's `h1` has scrolled away, hides while the footer is on screen, pads for the
  safe-area inset, and sets `html[data-action-bar-on]` so `scroll-padding-bottom` keeps focus clear
  and BackToTop rides above it. Drawn like the menu's foot: indigo with a gold keyline, the line in
  the furniture face, the menu's gold Give button.
- Defaults: Home and Visit only. The line is `staticSunday(serviceTime)` ("Sundays · Worship at
  10:45 am", the same words the hero's static line uses). Home's button is "Plan your visit" to
  `/visit/`; Visit's is "Directions" to Site settings' directions link (a bar pointing at the page
  you are on is not drawn). No service time, no bar; no directions link, no bar on Visit.

## No footer style switch, on purpose

The starter's card adds `footerStyle` (Columns or Compact). This site does not take it: its footer
is one designed poster (the closing Sunday band, the goals, the columns, the base rail with the
wordmark), and Compact's brand row would repeat the wordmark the base rail already carries. On a
phone the poster footer already stacks to one column in reading order. A switch that changed
nothing here would mislead an editor, so the field is not in the schema.

## Tests

- `src/lib/wayfinding-defaults.test.ts`: the defaults through the resolver on this site's routes.
- `tests/wayfinding.spec.ts`: groups as h2s with New here open and axe clean, the bar's timing,
  line, 44px button, bottom edge and axe, no bar on other pages or wide screens, where-next rows
  on Contact and none on Visit, 320px with the bar showing.
- The starter's PORTABLE `wayfinding.test.ts` is not installed: it assumes `/contact/` and
  `/about/` are site routes (reserved slugs), and here they are Studio pages, so three of its
  cases fail on this site's `reservedSlugs.ts`. Reported for a starter fix (use slugs every site
  reserves, like `/styleguide/`).
