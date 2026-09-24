# FBCM identity rollout: the remaining pages (overnight, 2026-09-24)

Owner instruction (Nathan, 2026-09-23 evening): "finish all the other pages with the
redesign pass and have it all working." He is away; there is no per-page prototype
review this time. The design language is settled and binding:
`docs/superpowers/plans/2026-09-23-fbcm-identity-rollout.md` (the 12 rules), the live
Who We Are and Home pages, and the approved Visit prototype
`docs/superpowers/prototypes/2026-09-23-visit/visit.html` (Nathan approved it with
four answers: hero heading "What to Expect on Sunday"; the morning path starts with
Welcome and Check-In; the glass-doors photo is the Adams Street circular-drive
entrance; Our building on cream beside the gold band is fine; no better worship or
congregation photos exist in the library, keep the current ones).

## How the night runs

Two waves of parallel branches, one worktree each, cut from `main`. Each branch owns
a set of shared components; **a branch never edits a component another branch owns**
(it composes with the component as it stands). A wave merges into `main` one branch
at a time, then parity is recaptured once, deployed, and each page module is applied
(dry run read first, backup-first `--apply`), then production is checked.

### Wave 1

| Branch | Page | Owns |
|---|---|---|
| `feat/visit-identity` | /visit | Hero (split and text-only branches, and the window branch's reuse on Visit), Timeline, FaqBand, ImageText, CtaBand, RichTextSection band heading (rule 17) |
| `feat/staff-identity` | /staff | StaffGrid, ScriptureBand, TeamGrid |
| `feat/wedding-identity` | /wedding | GalleryGrid, DocumentList, QuoteBlock |
| `feat/journal-identity` | /blog, /blog/**, /post/[slug] | `src/components/blog/*`, `src/pages/blog/**`, `src/pages/post/[slug].astro`, `src/lib/blog-derive.ts` (incl. the `weekOfLabel()` UTC fix in PENDING) |

### Wave 2 (cut from main after wave 1 is merged and deployed)

| Branch | Page | Owns |
|---|---|---|
| `feat/history-identity` | /history | HeritageBand's h1 opener path, history composition (Timeline 1859 to today, ending in the present; reuse `heritage-dates`' derived-year idea rather than typing a year) |
| `feat/ministries-identity` | /ministries | `ministry-band.ts` and the ministry band look (the four goals as the organising motif) |
| `feat/beliefs-identity` | /beliefs | RichTextSection / RichBody look (no decorative eyebrows, brand colours) |
| `feat/utility-identity` | /give, /contact, /404, /privacy | Hours, GiveBand's /give opener, `src/pages/404.astro`, `src/pages/privacy.astro` |

## Every branch

- Read CLAUDE.md in full, the rollout rules, and the reports in
  `.superpowers/sdd/2026-09-23-fbcm-home-identity/` (Home's patterns: hymn board,
  goal doors, heading grammar `src/lib/heading-grammar.ts`, `H2_DISPLAY`).
- Brand colours only (`--color-band-*` tokens). One button family: `CtaLink` gold,
  or outline where gold would vanish (on the gold band); write `gold` in new code.
  Arches for people (lancet, door, window), rectangles for buildings. Building glyphs
  are the only icons. No captions (alt text always). No boxed card floating on cream.
  One heading grammar per page (rule 17): band h2s through `H2_DISPLAY`.
  Headlines sized by length, nothing breaks mid-word. Numbering only on real
  sequences. No tracked-caps eyebrows that only decorate.
- The church's own words and headings, edited for the web, never rewritten; new
  sentences go on `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`
  (the seed dry run regenerates it). No em-dashes in public copy; lower-case "am";
  no AI-tell vocabulary.
- Photos: real library photos only; do not reuse a photo already on another page
  (check every `scripts/pages/*.mjs` and `scripts/data/page-images.json`; the
  library manifest has mislabels, so open images before choosing).
- Schema changes additive and optional only (CLAUDE.md rule 1), typegen, NON_STEGA
  for logic-driving dropdowns (rule 8b), scaffold markers on church code (rule 14),
  no colour fields on blocks (rule 9), derived values not typed (rule 15).
- The page module in `scripts/pages/<page>.mjs` is recomposed in the same branch:
  keep its header discipline and throwing helpers, protect editor edits (compare the
  live doc with the old module's output: `git show main:scripts/pages/<page>.mjs`),
  and add a `/styleguide/<page>` fixture via `scripts/page-fixture.mjs` as Home and
  Who We Are did, so the composed page can be seen before `--apply`.
- **Never `--apply`.** Dry runs only (`node scripts/seed-pages.mjs --only <page>`),
  a handful at most. If a dry run refuses on an unmapped photo, fill the asset map as
  PENDING describes; never upload.
- Gates before reporting: `npm run check`, `npm run format:check`,
  `npm run test:unit`, `npm run build` (rule 20: 0 `<link rel="stylesheet"`,
  >=1 `<style>`, sheet bytes under 147,456), `npm run audit:studio`, Playwright on the
  branch's own port, `npm run parity:compare` with every changed page explained.
  **Do not commit a parity recapture** (the controller recaptures once per wave).
- Screenshots (JPEG q80) to the scratchpad `overnight/<branch>/`: the page and its
  fixture at 1440 light and dark, 375 light, and 320 with
  `scrollWidth === clientWidth`, plus every other page that uses a component you
  own.
- Docs in the same branch: `docs/agent/components.md`, the changelog, PENDING, and
  the CLAUDE.md test list/counts if tests were added.

## Controller, per wave

Review each branch (task reviewer), fix rounds, merge one at a time into `main`,
build, recapture parity to the fixpoint, push (deploy), then per page: dry run, read
the plan, `--apply` (backup committed), wait for the webhook deploy, shoot production
light and dark at 1440 and 375, and check Studio click-to-edit once per new block.
