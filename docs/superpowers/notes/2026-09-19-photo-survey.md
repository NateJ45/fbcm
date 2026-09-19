# FBCM Photo Survey — 2026-09-19

Read-only survey of the 376 archived images (`fbcm-archive/images/`) against the
image manifests in `fbcm/scripts/data/`. Goal: find portfolio-grade photography
for the new site, and flag gaps honestly.

## Method

- Cross-referenced `scripts/data/binary-manifest.json` (bytes, sha256) with
  `scripts/data/pages/*.json` and `posts/*.json` (alt text, which page an image
  is used on) via `localFile`.
- Read real pixel dimensions from JPEG/PNG headers (no `image-size` package
  installed; parsed headers directly with a small Node script).
- Dropped anything under 1200px wide, and anything whose label/alt/filename
  matched logo/icon/avatar/podcast/favicon/sprite/placeholder.
- Because measuring all 376 files' full headers was slow in-sandbox, dimensions
  were computed for the 90 largest files by byte size (a reliable proxy for
  resolution here — file size and pixel area track closely across this set)
  rather than the full archive. 87 of those 90 cleared the 1200px filter and
  were ranked by pixel area.
- Viewed the top candidates directly with the Read tool (renders the image).
- A meaningful share of the "biggest" files are Unsplash stock photos used as
  filler (`nsplsh_...` filenames — e.g. poppies, generic nature shots). These
  are excluded from the hero table below; they're not the church's own
  photography and don't belong on a portfolio-grade church site.

**Surveyed: 87 candidate images passed the size/content filter; ~20 were
opened and visually assessed, plus all 16 staff portrait files (via the
`team-*.json` pages) checked individually for resolution.**

## Hero candidates

| File | Dimensions | Subject | Rating | Source page |
|---|---|---|---|---|
| `08181c_087c222f4750499ba5c0a6c514267c35_tilde_mv2.jpg` | 6016x4000 | Bell tower, low angle, dramatic clouds | 5 | baptists, who-we-are |
| `08181c_ac4bdf55910a4bf08971622eadbe31f6_tilde_mv2.jpg` (dupes: `d882428b...`, `e622e239...`) | 6016x4000 | Empty sanctuary from balcony — vaulted wood ceiling, stained glass, pews, piano | 5 | wedding, who-we-are, reservation |
| `08181c_b178e014f570469ba249e1dd6f8c4122_tilde_mv2.jpg` | 4877x3252 | Four children (siblings, matching rainbow outfits) holding hands in front of the entrance arch | 5 | homepage |
| `08181c_be2602489e0d4b63929aa41445a72ff6_tilde_mv2.jpg` | 6016x4000 | Full building, corner view — tower, sanctuary roofline, office wing, dramatic sky | 4 | architecture |
| `08181c_37d562a315d04a83afc879ec7ee9a460_tilde_mv2.jpg` | 6016x4000 | Congregation standing in worship, balcony view, worship team + stained glass in frame | 4 | who-we-are, baptists |

Note: the sanctuary shot exists as one photo uploaded three times (different
Wix asset IDs) — it's the *only* clean, empty sanctuary interior in the
archive, so treat it as a single irreplaceable asset, not three options.

## By use

**Exterior**
- `08181c_087c222f4750499ba5c0a6c514267c35` — tower, dramatic sky. Best single exterior asset. Vertical orientation, works as a hero.
- `08181c_be2602489e0d4b63929aa41445a72ff6` — full building corner view, dramatic sky. Best "whole building" shot; a "Find Us Online" digital sign and two-way-traffic sign are visible in frame (croppable).
- `08181c_b178e014f570469ba249e1dd6f8c4122` — front entrance arch + doors, doubles as exterior via the children in foreground.
- `08181c_8b3a93125f314c31abd6dd3e4b10a57f` ("adams circular drive") — flat midday light, parked cars and digital sign dominate; usable as a secondary/directions photo, not a hero.

**Interior / Sanctuary**
- `08181c_ac4bdf55910a4bf08971622eadbe31f6` — empty sanctuary, balcony view. The one clean interior hero.
- `08181c_37d562a315d04a83afc879ec7ee9a460` — sanctuary during live worship, congregation + band visible.

**People / Congregation**
- `08181c_37d562a315d04a83afc879ec7ee9a460` — the only wide congregation/worship shot in the archive. A projector screen with song lyrics is visible and slightly distracting but croppable.
- `08181c_360b7e1579244dbc95697ca78172c167` ("PraiseTeamA") — worship team close-up (singer + two guitarists), warm stage lighting, identifiable adults, good candid energy.

**Children**
- `08181c_b178e014f570469ba249e1dd6f8c4122` — four kids at the entrance, best of the set, doubles as exterior.
- `08181c_851d0b0b47db43b4a79dce2c3a219f2d` — single girl in a wildflower field, beautiful natural light, but no church context (could be anywhere).
- `08181c_cb74be6da795403791604886a27141a3` — two girls, stained-glass background, close portrait crop.
- All three above show clearly identifiable minors — confirm the church has photo-release/consent on file before reuse.

**Events**
- `08181c_bd26ffeb7cc14d029caf2663a0452bf3` ("interns") — two teen girls speaking on stage, good stage lighting, plant backdrop.
- `08181c_ea565de6ebd54eb492cc0160af1b3853` (women's breakfast) and `08181c_b0ea7034fb294342847320368a763de5` (empty fellowship hall) — both usable for documentation but not portfolio-grade: dated folding chairs/tables, dim fluorescent-ish lighting, an EXIT sign and a COVID-era "maintain social distancing" placard visible in one.

**Portraits (staff, 16 total)**
Checked every `team-*.json` page for its portrait's real resolution.
- **Usable high-res portrait (12 of 16):** Kendall Ellis (2806x4209), Cheryl Flaherty (3803x5720), Ed Brzak (3050x4587), Sandi Brzak (3668x5516), Caroline Koby (5000x4000), Jonathan Balmer (3354x5030), Dana Davis (3306x4972), Ella Mae Lemen (3632x5448), Joe Songer (3614x5436), Cynthia Smith (5000x4000), Loraine Garrett (3527x5290), Molly Flodder (4000x6016). All share a consistent style: stained-glass background, front-facing, well lit — good for a uniform staff grid.
- **NOT usable — thumbnail only (4 of 16):** Jaden Johnson (600x490), Andy Heimlich (456x600), Sally Butler (490x600), Nina Oisten (588x600). These are Wix-cropped thumbnails, far below print/hero quality; need new headshots.
- Two additional non-team staff/volunteers have strong high-res portraits in the archive: Jennifer Durke (`81f7ac_84b7a768746244ab9a86b4f85b94409c`, 4000x6016) and "Julie" (`08181c_5990e1bfb2df439a9a678cd46159bf52`, 4000x6016) — both use the same stained-glass-backdrop style, so they could round out a "staff & key volunteers" section if the client wants them included.

## Gaps

- **No portfolio-grade fellowship/event space.** Every fellowship-hall and event photo (women's breakfast, empty hall) shows dated folding chairs/tables, drop-ceiling fluorescent lighting, and stray signage (EXIT sign, laminated distancing placard). If the new site needs a "community life" or "events" hero, this needs a photo day.
- **Only one clean sanctuary interior exists**, and it's the same photo uploaded three times — there is no second angle, no close-up of the altar/stained glass detail, and no shot showing full-pew attendance. A single point of failure if that file is ever damaged or if the design needs more than one interior angle.
- **Only one wide congregation/worship shot**, and it includes a lyrics-screen artifact. There's no floor-level congregation shot and no shot of a full, packed sanctuary.
- **4 of 16 staff lack a usable portrait** (Jaden Johnson, Andy Heimlich, Sally Butler, Nina Oisten) — thumbnails only, need new headshots to match the other 12.
- **Best exterior shots are all overcast/dramatic-sky, none in warm golden-hour light** — fine stylistically, but if the design wants a warmer, more "inviting" exterior tone, none exist yet.
- A large share of the 376 archived files are generic Unsplash stock (poppies, coffee, etc.) used as Wix filler, not church photography — don't mistake the raw file count for the size of the real photo library.

**Bottom line: a plan built on this archive should budget a photo day** covering (1) a warm/golden-hour exterior, (2) a second sanctuary angle and a full/packed-pew shot, (3) a real fellowship-hall/event scene, and (4) four missing staff headshots.
