# Product

Strategic context for design work on the First Baptist Church Muncie site. Derived from the repo's own docs and copy (brand config, the 2026-09-18 rebuild spec, the 2026-09-20 art-direction spec, `scripts/pages/*.mjs`) on 2026-10-03. Anything marked `TODO(Nathan)` is a judgement call that has not been recorded anywhere yet; do not fill it in by guessing. Visual decisions live in `DESIGN.md`.

## Register

brand

## Users

The visitors the site is built around, as its own pages address them (`/visit`, `/who-we-are`, `/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding`, `/give`, `/contact`, `/blog`, `/visitor`, `/architecture`):

- **A first-time visitor deciding whether to come on Sunday.** The home hero opens on a live dated line ("This Sunday, ... Worship at ...") and the page carries "What to Expect", the street address (309 East Adams Street, Muncie, IN 47305) and a Watch live link, so the first question it answers is when, where and what it will be like.
- **Church members and the wider congregation** looking for staff, ministries, the blog (142 imported posts at their original `/post/<slug>` URLs), the church's own forms and giving, which all link out to the church's systems (Church Trac, replacing Planning Center) rather than live on this site.
- **People asking about a wedding or the building** (`/wedding`, `/architecture`, the 1921 to 1929 history).

TODO(Nathan): rank these. Which audience is first when two pages compete (newcomer, member, wedding enquirer), and what age and device mix does the church actually see? Nothing in the repo records it.

## Product Purpose

A website for a real congregation, replacing its Wix site (still live at www.fbcmuncie.org until the cutover). Its jobs, in order of the spec: make a first visit easy, let people find the people and ministries, keep the church's history and posts, and hand giving and forms to the church's own systems. The church's stated line is "We're a Spirit-led people gathered to join Christ's presence in our community" (`brand/brand.config.json`). Success is a visitor who knows when and where to come and what Sunday is like, and staff who can edit the pages themselves in the embedded Sanity Studio. It is not a sermon library or an events engine: there is no sermon or event type, and no form of the site's own.

## Brand Personality

Historic and confident (Nathan, plan 2 direction, 2026-09-19), drawn from the church's own building and its own words. The church's headings are kept ("Praise and proclaim", the four goals); the building is the visual vocabulary (the lancet window and the Adams Street door as photo frames, line glyphs drawn from the sanctuary, the 1927 Hannaford rendering). Warm paper-and-ink chrome, the five logo colours as accents. Direction B, "Praise & Proclaim", chosen 2026-09-23. Copy rules: no em-dashes in site copy; the church's approved sentences are never reworded without it being listed for approval. Voice detail: `docs/brand/voice.md` (still a blank template, see the TODO below).

TODO(Nathan): `docs/brand/voice.md` is unfilled. Give the tone sentence and the five do/not pairs, or point to where they already live.

## Anti-references

Recorded decisions only:

- **Generic and plain.** Nathan rejected the plan-2c build with exactly those words on 2026-09-20; the art-direction pass exists to answer it. `docs/superpowers/notes/research/2026-09-20-generic-ai-design.md` holds the ten-point rubric the pages are scored against.
- **Liturgical season colours.** Dropped 2026-09-23 (the church is Baptist). Stay inside the church's own palette.
- **Visible photo captions, scroll-linked text motion, parallax on prose, slideshows beyond the home hero** (2026-09-23 and 2026-09-28 decisions).
- **A dark mode.** Retired 2026-09-24; the site is light only.
- **Reading as a different church's site.** Faces and photographs must be this congregation's.

TODO(Nathan): name the reference sites you want the church compared against (the vault shows Highland Park Presbyterian's hero motion was studied, and the Stone Steps 50K header and footer were an inspiration), and say whether anything should be called out as "must not look like <other client>" (for example Stone Steps 50K or Crestview).

## Design Principles

1. **The building and the people are the identity.** Photographs, the lancet and door arches and the line glyphs carry it.
2. **The church's words stay the church's words.** Reuse their headings and approved sentences; anything new is flagged for approval.
3. **One grammar per page.** One left edge, one split, one button family (CLAUDE.md rule 17).
4. **Paper and ink first, brand colours as accents.** Gold is a fill and an on-dark ink, never body text on paper.
5. **Motion only where a page opens.** Word rise on page-opening headlines, a short push-in on single-photo heroes; nothing that moves while you read.
6. **Derive, don't retype.** Times, addresses and links come from Site settings, so one edit moves the whole site.

## Accessibility & Inclusion

WCAG AA is enforced by tests, not intent: `src/lib/theme-tokens.test.ts` measures every text-on-surface pair (including the forbidden ones, such as gold on cream), the axe suite runs, and a contrast sweep covers hero text over all twelve home frames. Reduced motion is honoured (a global reset plus gated reveals). Tap targets are at least 44px, keyboard focus rings are visible on light and dark grounds, and the site is checked at 320px and ~375px. Detail: `docs/agent/accessibility.md`.
