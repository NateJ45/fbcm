# Journal audit, 2026-09-22

The journal (142 posts at `/post/<slug>`, `/blog`, five category and 196 tag archives) as it ships
on `main` at e6d1e90, built with the live dataset. Screenshots at 1440 and 390, light and dark,
walked so reveals fire (session scratchpad, not committed):

- `/blog`, `/blog/category/fbcm-events`, `/blog/tag/francis-of-assisi` (one post);
- `/post/there-s-no-sin-in-single` (a long sermon preview, the 105-post majority),
  `/post/messy-camp-2025` (a short announcement), `/post/a-church-for-a-lonely-world` (the
  image-heavy essay), `/post/upcoming-events-at-fbc-muncie-march-3-easter-2026` and
  `/post/händel-s-messiah-sing-in-carols` (the two list-tables; the second is the non-ASCII URL).

The bar is the art-direction spec (`docs/superpowers/specs/2026-09-20-fbcm-art-direction-design.md`)
and the design research note, including its 2026-09-22 addendum. Prototypes answering this audit
are in `index.html` beside this file.

## What reads well

- **Measure.** Body Castoro at 17px / 1.72 in a 593px column, 62ch. Exactly the spec's "body in
  Castoro at 17px/1.72 and 62ch".
- **The opener.** Category line in `font-ui`, title in the titling capitals at `--text-h1`, the
  excerpt as the italic lede: the spec's post page, as written.
- **"More from this series"** only renders when a tag is really shared, and it is drawn as the
  ruled list the home page uses, not a second gallery.
- **Dark mode and 390.** Nothing overflows; every surface holds its contrast.

## What fails the bar

1. **The index shows the same posts twice.** Five of the six "Worth coming back for" cards are
   the first cards of "All posts" one band lower (`splitDurable` takes the newest durable six,
   page 1 takes the newest twelve, and nothing excludes one from the other).
2. **"This week" is eight and a half months old.** The newest sermon preview is dated January 6,
   2026. The research note's rule is that a dated fact makes a building read as inhabited; a false
   one does the opposite.
3. **The index is a wall of sermon slides.** 123 of 141 covers are promotional graphics with their
   own lettering (Kingdom Family Vacation, Arise!, Multiplied). A three-up grid of them is a collage
   of other people's type, against "one typeface nobody else has" and "the eyebrow becomes rare".
   Scanability suffers too: the eye lands on slide lettering before the title.
4. **Blockquotes out-shout the sermon.** 88 quotes render at 28px, 1.65 times the body; a
   100-word Hauerwas citation becomes the loudest element on the page.
5. **Wix residue in the body.** Underline marks on 405 blocks in 130 posts: 191 of the body's 227
   headings are Wix h4s, and they render underlined, so they read as links; real links get a
   second underline. Bold paragraphs do a heading's job ("2. Jesus, himself unmarried...", the
   Messiah FAQ questions). Castoro has one weight, so every `strong` is a synthesised bold.
6. **Two event tables are bullet lists** (docs/PENDING.md, "Post bodies"), cells joined by
   middots:
   - `händel-s-messiah-sing-in-carols`: the Messiah programme, 30 rows, whose header ("Title ·
     Type") has one cell fewer than its rows (the number column had no heading);
   - `upcoming-events-at-fbc-muncie-march-3-easter-2026`: the Lent and Easter schedule, 8 rows
     ("Date · Event").
7. **The lede repeats the body** on 34 of 142 posts: the excerpt is the first paragraph, so the
   reader meets the same sentence twice in one screen.
8. **Dead anchors.** The Messiah post opens with a "Page Contents" list of seven links to Wix
   `#viewer-…` fragments, and `understanding-god-in-prayer-we-believe-resources` has three more.
   None exists on this site.
9. **A cover can show twice.** The Messiah post's nave photograph is the bled cover and the first
   inline image.
10. **Every post ends on three bands saying one thing**: "Come and see for yourself" on indigo, the
    footer's "This Sunday · 10:45 am" poster, then the footer. The critique's "two indigo bands
    saying the same sentence", on all 142 posts.
11. **Heading rhythm and the contents column.** The sticky contents list works, but beside a 62ch
    column it leaves a 700px strip of empty paper down the whole post, and on sermon previews its
    entries are one heading repeated with a longer tail each time.
12. **Images.** Inline images sit at the measure with italic captions (good); the one portrait
    cover and the book-cover inline images are left-aligned at 256px with no relation to their
    text. Nothing distinguishes a photograph from a slide.
13. **Metadata.** Fine on durable posts. On a sermon preview the one fact a reader wants, which
    Sunday and which passage, is only in the category line ("week of May 28") and buried in the
    first paragraph.
14. **Archive navigation** is "Newer / Page 1 of 12 / Older". Nothing says which page holds 2024.
15. **Thin states dead-end.** A one-post tag page is a heading, one card and the closing CTA.
16. **13 posts have no category**, including a sermon preview (`multiplied`); their cards fall
    back to "Blog".
17. **Two excerpts carry em-dashes** (`justified-by-faith-empowered-by-the-spirit`,
    `the-road-not-taken`). The body converter normalised bodies only. Rule 2 is absolute for
    Sanity content; this is a content fix for a later, dry-run-first script, not part of a render
    pass.

Items 1 to 15 are render problems, fixable from `src/` with zero schema changes. Items 16 and 17
are data, listed for `docs/PENDING.md`.
