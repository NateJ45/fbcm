# FBCM identity rollout: every page

Date: 2026-09-23. Owner: Nathan. Follows `2026-09-23-fbcm-distinctive-design-plan.md` and the
Who We Are pilot (`2026-09-23-fbcm-who-we-are-alive.md`, live on production).

## The design language, as settled on Who We Are

These are now the rules for every page. They replace the art-direction pass's house style
wherever the two disagree.

1. **Brand colours only.** Indigo `#292854`, indigo-dark `#1C1B3A`, gold `#D59B29`, brown
   `#39251E`, brown-mid `#724F43`, taupe `#B5ABA3`, cream `#F4EFE6`. No liturgical-season
   colour (Nathan, 2026-09-23: a Baptist church that does not follow the church year).
2. **Bold, full-width colour bands** with real people in them, alternating dark and light.
3. **Arch frames for people.** Pointed lancets for portraits and small groups, door arches
   for groups and places. The window (three lights, the middle widest) for a page's opener.
4. **Building glyphs** (window, door, rose, basin) as the only icon family.
5. **Praise & Proclaim** is the one typographic mark, used at most once a page.
6. **The church's own words and headings.** Renamed headings go back to theirs.
7. **No captions on photos.** Alt text stays for screen readers.
8. **Square gold-ruled buttons** (`CtaLink variant="rule"`), never pills.
9. **Headlines sized by length**; nothing breaks mid-word.
10. **No boxed cards floating on cream** (Nathan, 2026-09-23). Boards, drawings and lists sit on a full-width band or directly on the page, never in a framed, shadowed box.
11. **Out:** tracked-caps eyebrows that only decorate, 01/02/03 numbering on anything that
    is not a sequence, decorative hairlines, two-column small prose.
12. **Cover-the-logo test** on every page: at least three only-here elements and at least
    one real face (Give and Contact excepted).

## How each page is done

The pilot's loop, shortened now the language is settled:

1. **One prototype per page** (not two directions), a static HTML page in the settled
   language with the page's real copy and library photos, at 1440 and 375. Nathan looks
   in the browser and approves or redirects.
2. **Build it into the site** with the SDD loop (implementer, task review, final review),
   reusing the church primitives and adding a section type only when a page needs one.
3. **Compose the page module** (`scripts/pages/<page>.mjs`), dry run, deploy the code,
   then `--apply` with a backup, and check production and Studio click-to-edit.

## Shared components that every page uses

Most pages are built from the same dozen section types, so restyling a shared component
changes several pages at once. Each one is restyled the first time a page prototype
settles its look, then every other page inherits it:

| Component | Used on | Direction |
|---|---|---|
| Hero (split, full, text-only) | 9 pages | window or single-arch opener on a brand band; people first |
| ImageText | 7 pages | people photos in arch frames; building photos stay rectangular |
| RichText (Ledger) | 8 pages | keep the shapes; drop decorative eyebrows; brand colours |
| CtaBand | 8 pages | brand band, rule buttons, one glyph |
| StaffGrid | staff, ministries | lancet portraits, names in Castoro |
| Timeline | visit, history, ministries | a real sequence, so numbering stays; door-step path as on The Way |
| FaqBand | visit, ministries | brand band, native details |
| ScriptureBand | beliefs, staff | the watchword band's verse treatment |
| HeritageBand | home, history, visit | the Hannaford rendering and historic photos |
| SundayTimes | home, visit, contact | brand band, one arch photo |
| GalleryGrid | wedding | arch doors for the spaces, room labels kept |
| DocumentList | beliefs, history, wedding | door cards |
| GiveBand | home, give | brand band, rule button |
| Header and footer | all | footer carries the Praise & Proclaim mark and the four goals |

## Order

| Step | Page | Why this order | New shared looks it settles |
|---|---|---|---|
| 1 | Home | most visitors; sets the site's first impression | Hero window reuse, SundayTimes, LinkCards doors (have), HeritageBand, GiveBand, footer |
| 2 | Visit | the second most visited; first-timers | Timeline path, FaqBand, ImageText arches |
| 3 | Staff | faces are the point | StaffGrid lancets, ScriptureBand |
| 4 | Wedding | Ella Mae, wedding party photos | GalleryGrid doors, DocumentList doors |
| 5 | History | the Hannaford rendering, historic photos | HeritageBand, Timeline for 1859 to today |
| 6 | Ministries | the four goals as the organising motif | Ministry bands under the four goals |
| 7 | Beliefs | long text | RichText without decorative eyebrows |
| 8 | Give, Contact | short utility pages | CtaBand, Hours |
| 9 | Blog index and post page | the journal already has its own register | brand colours, rule buttons, arch cover frames |
| 10 | 404 and privacy | small | |

A church checkpoint sits after step 2: the pastors see Who We Are, Home and Visit beside
the old site, and their reaction shapes steps 3 to 10.

## Open items carried into the rollout

- A front-on congregation photo for Worship, and people photos for each page (a photo
  morning at the church would lift every page).
- The box of stuff from the church: bulletins, anniversary booklets, the full-size
  Hannaford rendering.
- New copy on every page goes on the approval list, as before.
