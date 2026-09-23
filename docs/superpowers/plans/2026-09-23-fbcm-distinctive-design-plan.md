# FBCM: from tidy to distinctive

Date: 2026-09-23. Owner: Nathan. Status: plan agreed in principle; Who We Are is the pilot.

## 1. Where we are, honestly

The new site is better than the Wix site on every measurable axis: contrast, type,
consistency, speed, mobile, editability. It is not yet better on the axis the church
will judge it by, which is "does this feel like us". Side by side at 1440px:

- **Faces went missing.** The old site put the pastors' portrait beside their letter,
  Ella Mae on the Wedding page and a congregation photo behind "Join us for worship".
  The new site mostly shows stone and pews.
- **Their words were renamed.** "Our Pledge" became "What we promise", "Where To Go
  Next" became "Three doors", "A Note From Our Pastors" became "From Kendall and
  Jonathan".
- **Their symbols were dropped.** The Praise and Proclaim ribbons, the four pledge
  icons, the brown, gold and purple palette. Dated in execution, but theirs.
- **The finish is a shared house style.** Tiny tracked-caps eyebrows on every band,
  01/02/03 numbered columns, hairlines everywhere, long letters set in two columns
  of small type. Each is defensible; together they are the look of hundreds of
  2025 agency and AI-built sites.

Why it happened: the design passes worked from abstract rules (shape classifiers,
budgets, one grammar per page) and were judged against those rules, and most of the
effort went into Studio and safety machinery. Rules applied to building photographs,
with the church's own words and marks removed, produce exactly this.

The foundation is not the problem and does not need redoing. What changes is what
the design is made from and how it gets judged.

## 2. What "award-winning" means for this site

The sites that win (Awwwards, CSS Design Awards, SiteInspire features, the
Communication Arts interactive annual) almost always share four things, and none of
them is novelty for its own sake:

1. **One idea you could state in a sentence**, carried through every page.
2. **Material only this client has**, used as the design rather than decorated around.
3. **Craft in the details**: type set with care, images art-directed per placement,
   motion that means something, nothing left at a default.
4. **It works**: fast, accessible, readable on a phone in a car park on Sunday morning.

We have 4. This plan is about 1 to 3.

**The test we will use on every page:** cover the logo. Could this be another church?
If yes, it is not done. Each page must carry at least three elements that could only
belong to First Baptist Muncie.

## 3. The material only this church has

This is the inventory the design is built from. Everything below exists today, in
`scripts/data/pages/`, the photo library (137 tagged photos in Sanity, 453 files in
`fbcm-archive/images`) or the old site.

| Material | Where it is | What it can become |
|---|---|---|
| The watchword "Praise & Proclaim" (Isaiah 12:4) | old Who We Are | the site's signature typographic mark, replacing the ribbons |
| The four goals: **Worship, The Way, Witness, Work** | old Who We Are | the organising motif: ministries, the home page and the footer grouped under four W's |
| The pledge, said together when a member joins | old Who We Are | set as a responsive reading (leader and people lines), the form they actually use |
| The 1927 architect's rendering by **Samuel Hannaford and Sons** | old Architecture page (only a 1000px copy survives) | a hero image; the source of a line-drawing language |
| Indiana limestone, cruciform plan, Late Gothic Revival, National Register 1988 | old Architecture page | texture, the pointed arch as a frame, facts for History |
| The stained-glass windows | photo library | the accent palette, sampled from the glass, not invented |
| 302 sermon-series graphics (Praise, Proclaim, Make Known, Advent, Lent) | photo library | proof the church already has a visual culture; the series of the season can lead the home page |
| ~88 people photos: portraits, children, youth, fellowship, worship, service; 13 historic | photo library | faces on every page |
| The pastors' letter, signed "Kendall & Jonathan" | old Who We Are | a real letter: one column, portrait, signatures |
| 1859 founding, three buildings, 1929 completion | History | a timeline with historic photos |
| The church year | (derived) | see signature 1 below |

## 4. The concept

**"A house of praise, built in stone."** The building is the church's most
recognisable asset and the watchword is its most repeated sentence. The site pairs
them: the architecture gives the structure (drawn lines, pointed arches, limestone
light), the watchword gives the voice (Praise and Proclaim as a recurring mark), and
people fill the frames.

Two variants of this get prototyped on Who We Are before anything is built (section 7):

- **Direction A, "Hannaford".** Leans on the architecture: the 1927 rendering, a line
  ornament drawn from the window tracery, arch-headed photo frames, limestone
  warm-greys, restrained colour taken from the glass. Quiet, crafted, museum-grade.
- **Direction B, "Praise & Proclaim".** Leans on the voice and the people: bolder
  colour from the church year, the watchword as big typography, faces large, the four
  W's as a strong graphic system. Warmer, louder, closer to how the church talks.

The final site will likely take A's structure with B's warmth. Nathan picks from real
pages, not descriptions.

## 5. Signature elements (the "only here" list)

These are the specific things that make the site unmistakable. Each is buildable on
the existing stack; none needs a new dependency.

1. **The church year sets the accent colour.** Advent violet, Christmas white and
   gold, Epiphany green, Lent purple, Easter gold, Pentecost red, Ordinary Time green.
   Computed at build time from the date (CLAUDE.md rule 15: derived, never typed), so
   the site changes with the season on its own. The nightly rebuild is already there.
   Very few church sites do this, and it is exactly what a church would notice.
   _Dropped by the owner on 2026-09-23: a Baptist church does not follow the church
   year; the bands use the church's own brand colours instead._
2. **Praise and Proclaim as a mark.** A typographic lockup of the two words, used once
   per page at most: the home hero, the Who We Are opener, the footer.
3. **The four W's.** Worship, The Way, Witness, Work, each with a small drawn glyph in
   the tracery line style. Ministries sort under them; the home page's "ways in" become
   the four W's instead of 01/02/03.
4. **The pledge as a responsive reading.** Leader and people lines, scripture
   references in the margin like a hymnal, not a bullet list.
5. **The pastors' letter as a letter.** One comfortable column, the portrait, a
   signature, the date. Not two columns of small type.
6. **Tracery line ornament.** One drawn line family (arch, quatrefoil, lancet) used
   for dividers, frame heads and the four W glyphs. Replaces generic hairlines where a
   divider is actually needed.
7. **Arch-headed frames for people.** The pointed arch from the windows as the crop
   for portraits and small groups. The lancet already exists for one image a page;
   this extends the family deliberately.
8. **The Hannaford rendering** as the History and Architecture hero, with a short
   story of the building.
9. **A hymn board for Sunday.** The numbered board every sanctuary has, as the design
   for "this Sunday": date, time, series, scripture reading (already derived by
   `sermon-derive.ts`).
10. **Faces on every page.** Named where the church approves names; an art-direction
    rule per placement (who, why here, crop), not a random pick from a pool.

## 6. What comes out

- Tracked-caps eyebrows on every band. Keep them where they label something real
  (a date, a category); drop them where they just decorate a heading.
- 01/02/03 numbering on anything that is not a sequence.
- Two-column small type for continuous prose. Letters and statements get one
  readable column.
- Renamed headings. The church's own headings come back ("Our Watchword", "Our
  Goals", "Our Pledge", "A Note From Our Pastors", "Where To Go Next"), edited only
  for case and punctuation.
- Hairlines used as decoration rather than structure.
- Empty-building photos where a people photo exists for the same job.

## 7. How we work (the change that matters most)

1. **One page at a time, pilot first.** Who We Are, because it is the page that most
   has to feel like them and has the richest material.
2. **Two directions as real pages within the hour.** Static prototypes with real copy,
   real photos from the library, the site's own fonts, at 1440 and 375. Nathan looks
   in the browser, picks or redirects. No plan document per page.
3. **Only then build it into the site** (components, schema if needed, Studio), with
   the usual gates. Machinery serves a page that has already been approved visually.
4. **Church checkpoint after the pilot.** Show the pastors the old page, the new pilot
   and ask what they miss. Their answer shapes the rest.
5. **Ask the church for a box of stuff.** Bulletins, anniversary booklets, the welcome
   booklet, the original rendering at full size, hymnals, old photos. One hour
   photographing that material is worth more than any inspiration site.

## 8. Sequence

| Step | Page or piece | Signature elements used | Done when |
|---|---|---|---|
| 1 | Who We Are (pilot) | watchword mark, four W's, pledge as reading, pastors' letter, faces | Nathan picks a direction; built; cover-the-logo test passes |
| 2 | Church checkpoint | | pastors have seen old vs new and responded |
| 3 | Global system | church-year accent, tracery line family, arch frames, eyebrow and numbering cleanup across all pages | every page re-shot light and dark, 375 and 1440 |
| 4 | Home | Praise and Proclaim hero, hymn board, four W's, faces | first screen passes the cover-the-logo test |
| 5 | Visit | faces of greeters and children, hymn board, real arrival photos | |
| 6 | Wedding | Ella Mae's portrait, wedding party photos, spaces gallery kept | |
| 7 | History and building | Hannaford rendering, timeline, historic photos | |
| 8 | Ministries, Staff, Beliefs, Give, Contact | four W's, faces, arch frames | |
| 9 | Journal | series graphics used as covers, church-year accent | |
| 10 | Award polish | motion pass, print stylesheet, image art direction per placement, 404 as a church-specific page, performance re-check | submitted to SiteInspire and a CSS awards gallery after cutover |

Plan 3 (the cutover) can run in parallel with steps 3 onward; it does not wait on
design.

## 9. Judging the result

Each page is scored before it merges, by looking at it, not by a gate:

- **Cover the logo:** at least three only-here elements on the page.
- **Faces:** at least one real person on every page except Give and Contact.
- **Their words:** headings match the church's own, or the change is listed in
  `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`.
- **No house-style tells** from section 6.
- **Still works:** the existing gates (unit, Playwright, axe light and dark, reflow
  with real scrollbars, parity recapture with fixpoint, rule 20 inline check).

## 10. Open questions for Nathan and the church

- Can we get the 1927 Hannaford rendering at a higher resolution than the Wix copy?
- Are names OK on people photos, or faces only?
- Is the church comfortable with the accent colour changing with the church year?
- Who at the church should see the pilot: the pastors, the CCT, or both?
