# Product

Strategic context for design work on the First Baptist Church Muncie site. Derived from the repo's own docs and copy (brand config, the 2026-09-18 rebuild spec, the 2026-09-20 art-direction spec, `scripts/pages/*.mjs`) on 2026-10-03. The four judgement calls that were open (audience ranking, voice, reference sites, anti-references) were answered on 2026-10-03 by Claude, on Nathan's delegation, from repo evidence. Those answers carry the tag "Proposed 2026-10-03, drafted by Claude on Nathan's delegation from repo evidence; edit if wrong." and are **unconfirmed**: treat them as working assumptions until Nathan confirms or edits them, and remove the tag from each one he confirms. Visual decisions live in `DESIGN.md`.

## Register

brand

## Users

The visitors the site is built around, as its own pages address them (`/visit`, `/who-we-are`, `/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding`, `/give`, `/contact`, `/blog`, `/visitor`, `/architecture`):

- **A first-time visitor deciding whether to come on Sunday.** The home hero opens on a live dated line ("This Sunday, ... Worship at ...") and the page carries "What to Expect", the street address (309 East Adams Street, Muncie, IN 47305) and a Watch live link, so the first question it answers is when, where and what it will be like.
- **Church members and the wider congregation** looking for staff, ministries, the blog (142 imported posts at their original `/post/<slug>` URLs), the church's own forms and giving, which all link out to the church's systems (Church Trac, replacing Planning Center) rather than live on this site.
- **People asking about a wedding or the building** (`/wedding`, `/architecture`, the 1921 to 1929 history).

**Ranking.** Proposed 2026-10-03, drafted by Claude on Nathan's delegation from repo evidence; edit if wrong.

1. **First-time visitor.** First when two pages compete. Evidence: the rebuild spec's "visitor journey" says Home answers when, where, what it is like, and how to give "before any scrolling" (`docs/superpowers/specs/2026-09-18-fbcm-rebuild-design.md`); the site research argues a landmark church needs a self-contained visit page as its "digital on-ramp" (`docs/superpowers/notes/2026-09-19-church-site-research.md`).
2. **Member or wider congregation.** Second. Evidence: 142 imported posts at their old URLs, staff, ministries, giving and forms (`/give`, `/staff`, `/ministries`, `/blog`).
3. **Wedding or building enquirer.** Third, but a real path: `/wedding` is in the menu and `/architecture` is reached from History, Give and the footer.

**Age and device mix: not measured.** The repo has no analytics to inherit (vault note: "no analytics to inherit"); Cloudflare Web Analytics and GA go on at go-live. Working assumption until real numbers exist: design phone-first for the newcomer (the site is checked at 320px and ~375px, tap targets are 44px or more) while keeping desktop strong for members, and expect a wide age range, since the church's own Worship goal calls for the "full, intergenerational body of Christ" (`scripts/pages/who-we-are.mjs`). Revisit once a month of analytics exists after cutover.

## Product Purpose

A website for a real congregation, replacing its Wix site (still live at www.fbcmuncie.org until the cutover). Its jobs, in order of the spec: make a first visit easy, let people find the people and ministries, keep the church's history and posts, and hand giving and forms to the church's own systems. The church's stated line is "We're a Spirit-led people gathered to join Christ's presence in our community" (`brand/brand.config.json`). Success is a visitor who knows when and where to come and what Sunday is like, and staff who can edit the pages themselves in the embedded Sanity Studio. It is not a sermon library or an events engine: there is no sermon or event type, and no form of the site's own.

## Brand Personality

Historic and confident (Nathan, plan 2 direction, 2026-09-19), drawn from the church's own building and its own words. The church's headings are kept ("Praise and proclaim", the four goals); the building is the visual vocabulary (the lancet window and the Adams Street door as photo frames, line glyphs drawn from the sanctuary, the 1927 Hannaford rendering). Warm paper-and-ink chrome, the five logo colours as accents. Direction B, "Praise & Proclaim", chosen 2026-09-23. Copy rules: no em-dashes in site copy; the church's approved sentences are never reworded without it being listed for approval. Voice detail: `docs/brand/voice.md` (tone sentence and five do/not pairs, proposed and unconfirmed, see below).

**Voice.** Proposed 2026-10-03, drafted by Claude on Nathan's delegation from repo evidence; edit if wrong. Filled in `docs/brand/voice.md` (tone sentence plus five do/not pairs), taken from the church's own copy in `scripts/pages/*.mjs`. In short: plain, warm and specific, a church talking to a neighbour, never a brand talking to an audience.

## Anti-references

Recorded decisions only:

- **Generic and plain.** Nathan rejected the plan-2c build with exactly those words on 2026-09-20; the art-direction pass exists to answer it. `docs/superpowers/notes/research/2026-09-20-generic-ai-design.md` holds the ten-point rubric the pages are scored against.
- **Liturgical season colours.** Dropped 2026-09-23 (the church is Baptist). Stay inside the church's own palette.
- **Visible photo captions, scroll-linked text motion, parallax on prose, slideshows beyond the home hero** (2026-09-23 and 2026-09-28 decisions).
- **A dark mode.** Retired 2026-09-24; the site is light only.
- **Reading as a different church's site.** Faces and photographs must be this congregation's.

**Reference sites.** Proposed 2026-10-03, drafted by Claude on Nathan's delegation from repo evidence; edit if wrong.

- **Park Street Church, Boston** and **Trinity Church Wall Street**: the closest templates (serif type, a real sanctuary photograph, service time and address visible at once). Park Street's above-the-fold pattern is called "the single closest template for FBCM" in `docs/superpowers/notes/2026-09-19-church-site-research.md`.
- **Church of the Highlands**: borrow only the idea of putting the first-timer's question first ("New to Highlands?"), not its look.
- **Highland Park Presbyterian**: the home hero's word-rise motion was studied and specified from it (vault Work log, 2026-09-27). Motion only; the rest of the site is not modelled on it.
- **Stone Steps 50K**: its header and footer were an inspiration (`docs/superpowers/specs/2026-09-20-fbcm-art-direction-design.md`, survey in `docs/superpowers/notes/research/2026-09-20-stonesteps-survey.md`). Borrowed pieces only.

**Must not look like.** Proposed 2026-10-03, drafted by Claude on Nathan's delegation from repo evidence; edit if wrong.

- **Church of the Highlands and Passion City**: 70% or more imagery, multi-campus navigation and megachurch polish. FBCM is one landmark building with one Sunday service (same research note).
- **Stone Steps 50K as a whole**: a race brand. Its header and footer were borrowed; its identity must not carry over.
- **Crestview** (another church client): no repo evidence of a comparison; proposed as a precaution under "Reading as a different church's site" above. Faces, photographs, headings and glyphs must be this congregation's.
- **Any generic church template**: the plan-2c build was rejected as "generic and plain" (2026-09-20).

## Design Principles

1. **The building and the people are the identity.** Photographs, the lancet and door arches and the line glyphs carry it.
2. **The church's words stay the church's words.** Reuse their headings and approved sentences; anything new is flagged for approval.
3. **One grammar per page.** One left edge, one split, one button family (CLAUDE.md rule 17).
4. **Paper and ink first, brand colours as accents.** Gold is a fill and an on-dark ink, never body text on paper.
5. **Motion only where a page opens.** Word rise on page-opening headlines, a short push-in on single-photo heroes; nothing that moves while you read.
6. **Derive, don't retype.** Times, addresses and links come from Site settings, so one edit moves the whole site.

## Accessibility & Inclusion

WCAG AA is enforced by tests, not intent: `src/lib/theme-tokens.test.ts` measures every text-on-surface pair (including the forbidden ones, such as gold on cream), the axe suite runs, and a contrast sweep covers hero text over all twelve home frames. Reduced motion is honoured (a global reset plus gated reveals). Tap targets are at least 44px at 390px on Home, Visit, Staff and the shared header, footer and buttons (measured by `scripts/measure-tap-targets.mjs`, 0 under 44px on 2026-10-03; a link inside a sentence of body text is exempt under WCAG 2.5.8). The other pages are not yet there: Ministries, History, Blog, Give, Contact, Architecture and Privacy still have about 36 links under 44px, listed in `docs/PENDING.md`. Keyboard focus rings are visible on light and dark grounds, and the site is checked at 320px and ~375px. Detail: `docs/agent/accessibility.md`.
