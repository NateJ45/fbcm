# FBC Muncie blog capture report

Generated: 2026-09-18T18:25:09.707Z
Source: https://www.fbcmuncie.org/blog-posts-sitemap.xml

## Counts

- Posts listed in sitemap / attempted: **142**
- Post records on disk: **142**
- Captured this run: 0; skipped (already captured): 142
- Posts with a publishedDate: **142 / 142**  (undated: 0)
- Posts with a body over 100 words: **142**
- Posts with NO body text: **0**
- Distinct images referenced by these posts: **223**
- Total bytes of those images on disk: **242,873,632 bytes (231.62 MB)**
- This run: downloaded 0, skipped 0 already present, 0 bytes transferred
- Whole shared images/ folder (blog + the site-pages capture): 375 files, 879,425,803 bytes (838.69 MB)

## Date range

- Earliest post: 2023-03-20T00:53:31.380Z
- Latest post: 2026-09-17T14:55:15.000Z

## Category distribution

- Sermon Preview: 106
- FBCM Events: 13
- Series Resources: 8
- Ruminations: 4
- Church Resources: 3
- (no category): 13

## Failures

None.
## Full-resolution fallbacks

None — every image was fetched at its original (pre-/v1/) upload URL.

## 5 longest posts

- 3781 words — Understanding God In Prayer ("We Believe" Resources) (understanding-god-in-prayer-we-believe-resources)
- 3384 words — Understanding Holy Scripture ("We Believe" Resources) (understanding-holy-scripture-we-believe-resources)
- 3328 words — A Church for a Lonely World (a-church-for-a-lonely-world)
- 1501 words — There's no "sin" in "single" (there-s-no-sin-in-single)
- 1423 words — Händel's Messiah Sing-In & Carols Muncie (händel-s-messiah-sing-in-carols)

## 5 shortest posts

- 124 words — The Missing Piece (the-missing-piece)
- 158 words — Messy Camp 2025 (messy-camp-2025)
- 194 words — God Sees Us Through (god-sees-us-through)
- 196 words — Marriage, Household & Sexuality Resources (marriage-household-sexuality-resources)
- 202 words — When God Shows Up, Idols are Made Foolish. (when-god-shows-up-idols-are-made-foolish)

## Things a rebuild needs to know

### Posts with no body text (0)
None.

### Posts that are essentially just an embed (0)
None.

### Duplicate titles (0)
None.

### Posts with no cover image (1)
- baby-steps — Baby Steps (verified: the live page emits no og:image and no hero <img>)

### Embedded media NOT downloaded (1)
This capture downloads images only. These embed sources are recorded in the post JSON but the media files themselves are still only on Wix — fetch them before the site is torn down:
- kingdom-family-vacation-anti-family-values-jesus-resources → https://video.wixstatic.com/video/81f7ac_59e19330783a4981a8a70296dd41afe3/1080p/mp4/file.mp4

### Newsletter-style posts rather than articles (0)
None detected by title/excerpt heuristic.

### Notes

- Wix server-renders post bodies; the body was taken from the Ricos rich-content subtree (`data-hook="post-description"`), stripped of Wix wrapper divs/spans and presentational attributes.
- Dates come from `<meta property="article:published_time">` (Wix emits a full ISO timestamp), cross-checked against JSON-LD `datePublished`.
- Every image was requested at its original upload URL: everything before `/v1/` in the rendered Wix URL. Local files are named after the Wix media id.
- `images/` is shared with the site-pages/team capture; existing non-zero files were left untouched.