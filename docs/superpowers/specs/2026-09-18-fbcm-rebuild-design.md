# First Baptist Church Muncie: Wix to Astro + Sanity + Cloudflare Workers

**Date:** 2026-09-18
**Status:** approved in outline, awaiting spec review
**Repo:** `fbcm`, forked from `ncs-astro-sanity-starter`
**Basis:** volunteer, unpaid. Recorded in `_vault/clients/first-baptist-muncie.md`.

---

## 1. Why this shape

The commercial basis drives more of this design than the technology does. This is
unpaid volunteer work for a church, which means nobody is on retainer to notice
when something breaks. Every choice below prefers the option that keeps working
unattended over the option that is more capable while someone is watching.

That single constraint produces three rules used throughout:

- **Link out rather than integrate.** A link to Church Center keeps working when a
  credential expires. An API read does not, and the failure is silent.
- **Fewer pages.** A page that exists is a page that goes stale. Twenty two pages
  maintained by nobody is worse than ten maintained occasionally.
- **Do not rebuild what a platform already does.** The church runs Church Center,
  Church Trac and YouTube. The site is a front door to those, not a replacement.

Nathan can obtain Church Center and YouTube credentials if a feature needs them.
The design deliberately needs none.

## 2. What was captured, and what it told us

Captured 2026-09-18, before any code, committed in `scripts/data/`. Binaries are in
`../fbcm-archive/` and verified against `scripts/data/binary-manifest.json` by
`node scripts/verify-archive.mjs` (424/424 by SHA-256).

| | Count | Size |
| --- | --- | --- |
| Pages (22 site, 16 team, 6 blog category) | 44 of 44, no failures | 16,136 words |
| Blog posts | 142 of 142, no failures, all dated | 95,016 words |
| Images, original upload resolution | 376 | 840 MB |
| PDFs linked from the site | 47 | 603 MB |
| Video | 1 | 106 MB |

Four findings shaped the design.

**The blog is a weekly bulletin, not an essay archive.** 106 of 142 posts are
"Sermon Preview", which expires by Monday. The durable remainder is 13 events, 8
series resources, 4 essays, 3 church resources, 13 uncategorised.

**The posts carry a better taxonomy than their categories.** 120 of 142 posts have
tags, 217 distinct: Lent, Advent, Eastertide, Genesis, John, Mark. That is a more
natural spine for an archive than five categories, and it was already there.

**The church runs two overlapping platforms.** Church Trac (member portal,
children's and youth newsletters, a public calendar, the app on both stores, 132
link hits) and Church Center (giving, another calendar, four form IDs, 97 link
hits). The current nav links to both, including two Calendar entries pointing at
different systems.

**Nothing substantial has been lost.** The Internet Archive holds 1.72 million
captures since 2001. Of 6,809 URLs it has seen that are not in the current
sitemaps, almost all are noise: Wix build artifacts, blog tag and pagination
pages, image filenames. Two real findings, neither blocking: a staff member
`/team/leslie-pannell` removed around March 2025, and genuine earlier site
generations (a 2001-2004 `.htm` site, a 2009-2013 CMS with `/audio/` sermon
recordings). Those are superseded, not lost. This is not a Stone Steps situation.

## 3. The page map

Eleven pages, down from 22, plus privacy and 404.

| Page | Slug | Built from | Approx words |
| --- | --- | --- | --- |
| Home | `/` | `home`, rewritten | new |
| Visit | `/visit` | `what-to-expect` + `accessibility` + `architecture` + directions | 1,000 |
| Who We Are | `/who-we-are` | `who-we-are` | 1,332 |
| Beliefs | `/beliefs` | `beliefs` + `baptists` + `membership` | 3,200 |
| Ministries | `/ministries` | `worship` + `children` + `youth` + `adult` + `outreach` | 2,400 |
| Staff | `/staff` | `ministers` + `team` + 16 profiles | 1,400 |
| History | `/history` | `history`, untouched | 4,174 |
| Give | `/give` | new, then out to Church Center | new |
| Weddings & Building Use | `/wedding` | `wedding` + `reservation` + their PDFs | 500 |
| Blog | `/blog`, `/post/<slug>` | 142 posts + `publications` PDFs | 95,016 |
| Contact | `/contact` | `contact` + Church Center form 159198 | 250 |

**`who-we-are` survives as its own page.** It was omitted from the first draft of
this map, which was an error. At 1,332 words it is the church-specific "about"
page that replaces the starter's removed `about` capability. The alternative,
folding it into Beliefs, produces a single 4,497-word page; that is coherent as a
subject but long, and it is the one merge in this map worth reconsidering.

**`history` survives alone.** At 4,174 words and 22 images it is the richest thing
the church has, and it is the page a merge would damage.

**Eleven of sixteen staff profiles are nine to thirty words**: name, role, email,
headshot. Those become cards on `/staff`, not pages. Only the five with real bios
(Cynthia Smith 199w, Kendall Ellis 180w, Jonathan Balmer 167w, Loraine Garrett
122w, Molly Flodder 105w) get detail sections.

**Dies:** `church-app` (91 words, becomes a footer link and a redirect to
`/contact`), `publications` (folds into `/blog` as its PDF section), `team` (folds
into `/staff`).

### The visitor journey

A first-time visitor needs four things, and Home answers all four before any
scrolling:

1. **When.** Sundays 10:45am.
2. **Where.** 309 East Adams Street, Muncie, IN 47305, with a map.
3. **What it is like to walk in.** A direct route to `/visit`.
4. **How to give.** A direct route to `/give`.

Everything else sits below that. The current home page is 163 words and answers
none of them directly.

### Redirects

Every retired URL keeps working. Handled by the starter's redirect-on-rename
support (PORTS.md card 22).

| From | To |
| --- | --- |
| `/what-to-expect` | `/visit` |
| `/accessibility` | `/visit#accessibility` |
| `/architecture` | `/visit#building` |
| `/baptists` | `/beliefs#baptists` |
| `/membership` | `/beliefs#membership` |
| `/worship`, `/children`, `/youth`, `/adult`, `/outreach` | `/ministries#<area>` |
| `/ministers`, `/team` | `/staff` |
| `/team/<16 slugs>` | `/staff` (the five with bios to `/staff#<name>`) |
| `/reservation` | `/wedding` |
| `/publications` | `/blog#publications` |
| `/church-app` | `/contact` |
| 6 blog category URLs | `/blog?category=<slug>` |

**Blog URLs are preserved exactly, not redirected.** The starter's journal
capability routes at `/journal` and `/journal/[slug]`. Those routes are renamed to
`/blog` and `/post/[slug]` to match the live site, so all 142 post URLs survive
with zero redirects and zero SEO loss. This is a small, deliberate deviation from
the starter's structure and is cheaper than 142 redirect documents.

**Post slugs contain non-ASCII.** `/post/händel-s-messiah-sing-in-carols` is a real
URL. The import must preserve the slug byte for byte rather than re-slugifying it,
and the route must serve it. This is a named test.

## 4. The platform boundary

### Outside Sanity, linked only

| Thing | Platform | Why |
| --- | --- | --- |
| Giving | Church Center | It takes money. It must not pass through anything built here. |
| Calendar | One only, whichever the church keeps current | The other Calendar link disappears. The duplication stays theirs; the site stops advertising it. |
| Sermons, livestream | YouTube | YouTube **is** the archive. Building a second one is the named mistake to avoid. |
| Children's and youth newsletters, member portal, the app | Church Trac | Already maintained there. |
| Contact form | Church Center form 159198 | Already working and already reaching someone. |

**No `sermon` document type.** The archived church starter has one, and it is
liturgical: hymns, service music, worship leaders. That is heavier than a Baptist
church needs and duplicates a platform the church already runs.

**No `event` document type.** Church Center holds the calendar.

**No contact endpoint, no D1, no Web3Forms.** Per the decision above, Contact links
to Church Center. This also means the starter's contact form, its D1 migration and
its Web3Forms configuration are all removed rather than configured. Cloudflare
Email Sending would have needed the Workers Paid plan, and Email Routing cannot
coexist with the church's existing `@fbcmuncie.org` mail.

### Inside Sanity

- **Page content** through the starter's page builder, so all eleven pages are
  editable without a developer.
- **`ministry`**, harvested from `ncs-church-starter` and adapted. Five records.
- **`staffMember`**, harvested from the same source. Sixteen records.
- **Posts**, the starter's journal type extended with the `tags` array recovered by
  the capture.

### One derived value, never stored

Foregrounding the durable 36 posts requires knowing which posts are weekly sermon
previews. That is **derivable** from the category already on each post, so there is
no `postKind` field for an editor to set and get wrong. This is CLAUDE.md rule 15:
give the editor the inputs, not the answer. No test can enforce it, which is why it
is written down here.

## 5. The scaffold plan

Six of the seven removable capabilities go. Only `journal` stays.

| Capability | Verdict | Reason |
| --- | --- | --- |
| `about` | remove | Replaced by a church-specific Who We Are page. `founderSection` and `storySection` do not fit a church. |
| `faq` | remove | No FAQ content exists. Re-addable later. |
| `philosophy` | remove | |
| `process` | remove | A church has no process page. |
| `services` | remove | A `service` collection labelled "Services" in front of a church secretary means worship services, not ministries. Replaced by a `ministry` type. |
| `testimonials` | remove | |
| `journal` | **keep** | This is the 142-post archive. |

Removing `services` rather than repurposing it costs more work than renaming
labels. It is worth it: the Studio is the church secretary's product, and a type
whose name means something different inside a church is a trap paid for on every
edit.

**Two known starter traps this configuration avoids**, both from `docs/PENDING.md`
item 11. `dynamicListSection` has four sources (journal, services, testimonials,
faqs) and renders an empty dropdown if it loses the last one; keeping `journal`
leaves it a valid source. And seed markers cannot express philosophy-inside-about,
which bites only when removing `philosophy` while keeping `about`; removing both
together is the clean combination.

After each removal, the gate is `npm run typegen && npm run check && npm run build
&& npm run test:unit`.

## 6. Import design

Three importers, all deterministic and idempotent, per CLAUDE.md rule 16 and
PORTS.md card 49 pattern 1.

- **Deterministic ids.** `post-<slug>`, `staff-<slug>`, `ministry-<slug>`. A
  re-run is a no-op, not a duplicate.
- **`createOrReplace`**, never `create`.
- **Assets keyed by SHA-256**, taken from `binary-manifest.json`, so a second run
  does not re-upload 840 MB of images.
- **`--dry-run` prints the whole plan and writes nothing**, and is the default for
  anything destructive.
- **Slugs preserved byte for byte**, including non-ASCII.

Source of truth is `scripts/data/`, already committed, so an import is reproducible
without the Wix site existing.

## 7. Build order and gates

1. Fork, `npm run apply-brand`, scaffold out the six, production deploy green on
   the `workers.dev` URL. Uses the shipped `.github/workflows/deploy.yml`, not a
   hand-written one.
2. Schema and seed. Field descriptions say what to **type**, never why the field
   exists (rule 13). Every seeded string reads as an obvious placeholder (card 44).
3. Import the captured content.
4. Pages and sections. One heading grammar, one button family, one column: every
   heading and object shares a left edge, and text-plus-picture bands share one
   split (rule 17).
5. The Studio, written for a church secretary. Then `npm run audit:studio`.
6. Polish, both themes, both viewports, screenshots as evidence.
7. Cutover with `npm run cutover`, dry run first.

**Gates before every PR:** `npm run check` (0 errors), `test:unit`,
`format:check`, `npm test`, `npm run parity compare`, `audit:studio`, and the
visual suite in CI (it skips on Windows by design). PRs against `main`, never
merged without green checks.

## 8. Content corrections

The live site carries defects that will not be reproduced:

- 41 of 44 pages have no meta description; 9 have no h1. SEO is built in from the
  start rather than retrofitted.
- `clerk@fbcmuncieorg` on `/team/nina-oisten` is missing its dot.
- A "Linktree" social icon points at `podcasters.spotify.com`, a retired domain,
  while another points at `linktr.ee/fbcmuncie`.
- Header and footer social bars disagree (`threads.net` vs `www.threads.net`).
- The `pianist` blog category renders no posts and appears in no post's categories.
  It is an empty leftover and is not carried across.

## 9. Risks and open items

**Analytics do not survive a rebuild** (PORTS.md card 54). If the church has a
Google Analytics property on the Wix site, `PUBLIC_GA_ID` must be set **before**
the domain moves. The loss is invisible for weeks. Only Nathan can retrieve it.

**The archive is two copies, one of which is going away.** `../fbcm-archive/` and
the Wix site. A third copy off this machine is wanted before cutover.

**Two calendars is a church decision, not a design decision.** The nav is built
with a single Calendar slot; the destination is filled in once the church says
which one they keep current.

### What only Nathan can do

- Confirm the church approves moving off Wix, and who signs that off.
- Decide who cancels the Wix subscription after cutover.
- Confirm Church Center form 159198 reaches an inbox somebody reads.
- Retrieve the existing Google Analytics property id, if there is one.
- The DNS cutover itself.
- The remote D1 migration and secret puts, if either is ever needed (card 45 notes
  both trip a permission gate for an agent).
