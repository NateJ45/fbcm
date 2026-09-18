# FBC Muncie Wix capture report

Generated: 2026-09-18T18:27:34.859Z
Target: https://www.fbcmuncie.org
Method: plain HTTP GET (Wix server-renders its HTML; verified before crawling).
Scope: pages, team profiles, blog categories. Blog posts (/post/*) excluded by design.

## Counts

| Category | Sitemap URLs | Captured 200 | Failed |
|---|---|---|---|
| pages | 22 | 22 | 0 |
| team | 16 | 16 | 0 |
| blog-categories | 7 | 6 | 0 |
| **unique attempted** | 44 | 44 | 0 |

- Images downloaded/cached: **153** of 153 unique
- Total image bytes: **636,559,367** (607.07 MB)
- Outbound (non-fbcmuncie.org) URLs: **42** across **21** hosts
- Linked documents (PDF etc. under /_files/ugd/) downloaded: **47** of 47, 631,868,746 bytes -> data/files/

## Outbound hosts (by page hits)

| Host | distinct URLs | page hits |
|---|---|---|
| fbcmuncie.churchtrac.com | 3 | 132 |
| fbcmuncie.churchcenter.com | 10 | 97 |
| www.facebook.com | 3 | 48 |
| www.youtube.com | 3 | 47 |
| www.instagram.com | 3 | 46 |
| www.threads.net | 2 | 46 |
| threads.net | 1 | 44 |
| linktr.ee | 1 | 44 |
| podcasters.spotify.com | 1 | 44 |
| www.biblegateway.com | 3 | 3 |
| calendar.app.google | 2 | 2 |
| abc-indiana.org | 1 | 1 |
| apps.apple.com | 1 | 1 |
| bibleproject.com | 1 | 1 |
| facebook.com | 1 | 1 |
| instagram.com | 1 | 1 |
| play.google.com | 1 | 1 |
| www.abc-usa.org | 1 | 1 |
| www.amazon.com | 1 | 1 |
| www.churchtrac.com | 1 | 1 |
| www.cynthialucilesmith.com | 1 | 1 |

## Failures

None.

## Page sizes (words of body text)

| Page | Words |
|---|---|
| history | 4174 |
| beliefs | 1632 |
| who-we-are | 1332 |
| baptists | 1236 |
| ministers | 1162 |
| children | 966 |
| what-to-expect | 651 |
| adult | 627 |
| publications | 403 |
| youth | 379 |
| wedding | 316 |
| membership | 297 |
| worship | 276 |
| contact | 234 |
| team | 213 |
| team-cynthia-smith | 199 |
| reservation | 180 |
| team-kendall-ellis | 180 |
| team-jonathan-balmer | 167 |
| home | 163 |
| accessibility | 158 |
| architecture | 155 |
| outreach | 149 |
| team-loraine-garrett | 122 |
| team-molly-flodder | 105 |
| church-app | 91 |
| team-caroline-koby | 77 |
| team-ella-mae-lemen | 65 |
| blog | 50 |
| blog-categories-fbcm-events-1 | 45 |
| blog-categories-series-resources | 40 |
| blog-categories-ruminations | 40 |
| team-ed-brzak | 30 |
| team-joe-songer | 29 |
| team-dana-davis | 29 |
| team-cheryl-flaherty | 29 |
| blog-categories-sermon-preview | 29 |
| team-sandi-brzak | 28 |
| blog-categories-church-resources | 26 |
| blog-categories-pianist | 12 |
| team-sally-butler | 11 |
| team-jaden-johnson | 11 |
| team-andy-heimlich | 9 |
| team-nina-oisten | 9 |

## Thin / suspicious pages (<40 words)

- https://www.fbcmuncie.org/team/ed-brzak (30 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/joe-songer (29 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/dana-davis (29 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/cheryl-flaherty (29 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/blog/categories/sermon-preview (29 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/sandi-brzak (28 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/blog/categories/church-resources (26 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/blog/categories/pianist (12 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/sally-butler (11 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/jaden-johnson (11 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/andy-heimlich (9 words) - check whether content is JS-rendered
- https://www.fbcmuncie.org/team/nina-oisten (9 words) - check whether content is JS-rendered

## Blog listing / category pages (JS-rendered feed)

Wix Blog renders only the first few cards into the server HTML; the rest of the paginated feed is fetched by JavaScript. Post links found in the served markup of each listing page:

| Listing page | /post/ links in served HTML |
|---|---|
| https://www.fbcmuncie.org/blog | 4 |
| https://www.fbcmuncie.org/blog/categories/fbcm-events-1 | 4 |
| https://www.fbcmuncie.org/blog/categories/church-resources | 3 |
| https://www.fbcmuncie.org/blog/categories/pianist | 0 |
| https://www.fbcmuncie.org/blog/categories/sermon-preview | 4 |
| https://www.fbcmuncie.org/blog/categories/series-resources | 4 |
| https://www.fbcmuncie.org/blog/categories/ruminations | 4 |

**Consequence for a rebuild:** category -> post membership CANNOT be recovered from these pages. It has to come from each individual post page (captured separately) or from a Wix data export.

## Notes for a rebuild

- Wix UI chrome images were skipped: media ids prefixed `11062b_` (Wix stock social icons) and blank.gif.
- Every image was requested at its ORIGINAL upload URL (everything before `/v1/`). Wix serves SVG originals from `/shapes/` rather than `/media/`; the crawler falls back to that path automatically.
- `links` in each page JSON carry a `region` field (main/header/footer) so nav boilerplate can be told apart from in-content links.
- Body text de-duplicates repeated strings because Wix renders separate desktop/mobile copies of some sections.
- `https://www.fbcmuncie.org/blog` appears in both the pages sitemap and the blog-categories sitemap; it is captured once (counted under `pages`), which is why the blog-categories row shows 6 of 7.
- Team/staff profile pages are genuinely short by design (name, role, e-mail, headshot, back-link). The short word counts are real content, not a failed JS render - verified against the raw HTML.
- Several e-mail addresses are obfuscated on the live site as `name[at]fbcmuncie.org`; they are captured verbatim.
- `/post/important-documents` is linked from the main header nav (Ministry > Important Documents) even though it is a blog post, not a page. A rebuild needs it to exist at a stable URL.
- No `<iframe>` embeds are present in the served HTML: every third-party integration on this site is a plain outbound link (Church Trac, Church Center, YouTube, social, app stores). The `embeds` array therefore lists detected third-party URLs and scripts rather than true iframe embeds.
- Downloadable PDFs are large (newsletters and annual reports run to tens of MB each) and are mirrored to `data/files/` with the manifest in `files-manifest.json`.

### SEO state of the existing site

- 41 of 44 pages have **no meta description**.
- 9 pages have **no h1**: accessibility, blog, architecture, blog-categories-fbcm-events-1, blog-categories-church-resources, blog-categories-pianist, blog-categories-sermon-preview, blog-categories-series-resources, blog-categories-ruminations.
- Only 19 distinct og:image values across 44 pages; many pages fall back to the site logo SVG.
- Totals captured: 274 headings, 16,136 words of body text, 1951 link instances, 306 image references.

### Broken or mislabelled links found on the live site

- The social icon labelled **"Linktree"** in the header and footer points to `https://podcasters.spotify.com/pod/show/first-baptist-church-munc` - a truncated-looking Spotify-for-Podcasters URL, on a domain Spotify has since retired. A second icon with the same "Linktree" label points to `https://linktr.ee/fbcmuncie`. One of the two is wrong; confirm with the church which they want.
- On `/team/cynthia-smith` a link labelled **"LinkedIn"** actually points to `https://www.cynthialucilesmith.com/`.
- The site has two social-icon bars (header and footer) whose URLs disagree slightly: `http://threads.net/fbcmuncie` vs `https://www.threads.net/@fbcmuncie`, and `https://facebook.com/...` vs `https://www.facebook.com/...`. Normalise on rebuild.
- `/team/nina-oisten` lists the e-mail as `clerk@fbcmuncieorg` (missing the dot before `org`).