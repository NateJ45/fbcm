# Journal polish: P2 Bulletin and I1 Register

Nathan picked P2 Bulletin (post page) and I1 Register (blog index and archives) on 2026-09-22
from `docs/superpowers/prototypes/2026-09-22-journal/index.html`. The prototype's Rules drawer is
the spec; `audit.md` beside it is the list of what this fixes. This plan is how it lands in `src/`.

**Constraints.** Zero schema changes, no dataset writes, no new dependency, no em-dash in site copy.
Only journal routes may render differently: `/post/*`, `/blog`, `/blog/page/*`,
`/blog/category/**`, `/blog/tag/**`. Every other page must stay byte-identical under
`npm run parity:compare`. Light and dark, 390 and 1440, real scrollbars (CLAUDE.md rules 3, 17 to 19).

## Shared (done, 69f79ce)

`src/lib/sermon-derive.ts`: `localDay`, `sundayOf`, `formatDay`, `isoDay`, `readingOf`,
`seriesOf`, `SCRIPTURE_REF`. Tested; 95 of 105 live previews yield a reading, 51 a series.

## Track A: the post page (P2 Bulletin)

A1. `src/lib/post-body.ts` + test. A pure pre-pass over `journalEntry.body` (Portable Text) that
returns new blocks for the renderer. Strings are compared only after `splitStega().cleaned`.
- drop the `underline` decorator everywhere;
- a link to `#viewer-*` is unwrapped to plain text; a list whose every item is only such links is
  dropped, and a trailing strong "Page Contents:" span on the block before it goes too;
- a list run of >= 3 items where every item contains ` · ` becomes `{ _type: 'journalTable',
  head, rows, numCol }` (pad short rows on the LEFT, header when every cell <= 3 words and no
  digit, a lone `-` cell is empty, numCol when column 0 is all digits or empty);
- a wholly-strong paragraph, <= 22 words, that ends `?` or starts `/^\d+\.\s/` or has no end
  punctuation becomes `journalPoint { num, children }` (the number stripped from the text);
  a single wholly-strong numbered list item is point 1; when >= 3 points are questions, each
  question and the normal paragraphs after it become `journalQA { question, answer[] }`;
- a strong span longer than 12 words loses `strong`;
- an `inlineImage` whose asset `_ref` equals the cover's is dropped;
- `ledeEchoes(excerpt, body)`: true when the excerpt's first 60 normalised chars appear in the
  first text block;
- `findLection(blocks)` for previews: skip an opening "This is a sermon preview" block, then the
  first run (<= 4 blocks, normal/blockquote/point) ending in a block containing a reference
  becomes `journalLection { reference, blocks }`. Blocks are not moved or edited.

A2. `JournalPortableText.tsx`: render the four new types; h2/h3/h4 share one section-head style
(Castoro `--text-h3`, hairline above); blockquote Castoro italic 1.125rem with the gold 1px rule
hung in the gutter; `strong` a 20% gold band, no faux bold; bullets a 12px gold rule, ordered
lists old-style gold numerals; portrait inline images capped at 360px; captions hang from the
28px gold tick. Heading ids unchanged (the contents list links to them).

A3. `src/pages/post/[slug].astro`:
- masthead: category line, title, lede (omitted when `ledeEchoes`) in cols 1 to 7; in cols 9 to
  12 the ORDER as a ruled `dl`: preview -> Sunday / Reading / Series / Preaching / Listen (first
  `churchcenter.com/channels` link in the opening block); other -> Posted / Written by / Takes /
  Filed under. Empty rows omitted.
- cover: w >= 2000 and w/h >= 1.3 -> full-bleed GROUND under the masthead (`100cqw`, rule 19);
  otherwise a PLATE (soft mat, gold line) at the top of the right column.
- body in cols 1 to 7 at 62ch; right column sticky: plate, then "In this post" (numbered, from
  `extractHeadings`, only when >= 3). CaseStudyTOC is no longer used here.
- foot: "Tagged" as text links; "More from this series" rows show Sunday + reading for previews;
  doors: previews -> "The Sunday before" / "The Sunday after" among previews, with Sunday and
  reading; others -> Older / Newer. No FinalCta on posts.
- phone: order, then the plate at 300px, above the body; contents dropped.

## Track B: the index and archives (I1 Register)

B1. `blog-derive.ts` additions + tests: `freshPreview(entries, today)` (newest preview whose
Sunday >= today, else null), `worthComingBackFor(entries, page1, n = 4)` (durable, not on page 1),
`pageYearSpans(entries, perPage)` (each page's years, "2025" or "2025–24", plus exact first/last
days), `thinStateTags(entries, excludeLabel, max = 8)`.

B2. `/blog`: opener (eyebrow, h1, lede from journalPage, unchanged fields) cols 1 to 7, the DOOR
cols 9 to 12 ("This Sunday, <date>" + title + reading + author when fresh, else "Latest" + hung
plate + title + excerpt; an inline script swaps fresh to latest once its Sunday has passed on
the visitor's clock); FILTERS as text links with derived counts (replace CategoryChips);
"Worth coming back for" (4, two columns, plate beside title); REGISTER (year numerals cols 1-2;
rows: date, title + excerpt, meta = Sunday + reading or category, 4:3 plate); PAGER with year
spans (phone: prev, "Page n of N", next); the Publications `additionalSections`; no FinalCta,
no Hero split, no "This week" band.

B3. `Archive.astro` (category, tag, /blog/page/n, category pages): same opener without the door,
filters, register, pager, THIN STATE (< 4 posts: "Also filed under" + "Everything else: the whole
archive"); no FinalCta.

## Gates (main session, on the integrated tree)

`npm run check`, `npm run test:unit`, `npm run format:check`, `npm run build`, `npm test` including
the `chromium-scrollbars` project, 320 reflow, screenshots light and dark at 390 and 1440 of the
audited routes, `npm run parity:compare` (only journal routes may differ), then rebase onto main
and recapture parity if `feat/richtext-ledger-photo-shapes` has merged. PENDING.md updated in the
same commit (post-body tables closed as a render fix; uncategorised posts and excerpt em-dashes
listed).
