# The Wix capture

Everything the old Wix site held, captured on 2026-09-18 before the rebuild, by
`../capture-pages.mjs`, `../capture-blog.mjs` and `../capture-wayback.mjs`. All
three are re-runnable and skip what is already on disk.

The reason this exists at all: Wix was the only copy of three and a half years of
writing, and a client site can disappear between sessions. On a previous project
that happened and two decades of content had to be pulled back out of the Wayback
Machine.

## What is here

| File / folder            | Contents                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `pages/`                 | 44 pages as `.json` (structured) and `.txt` (readable), 16,136 words |
| `posts/`                 | 142 blog posts as `.json` and `.md`, plus `index.json`, 95,016 words |
| `nav.json`               | The header menu tree and the footer links, as the old site rendered them |
| `outbound-links.json`    | Every third-party link, by host and frequency: the record of which platforms the church depends on |
| `binary-manifest.json`   | All 424 captured binaries with byte size, SHA-256 and source URL |
| `images-manifest.json`, `files-manifest.json` | Per-asset detail from the two crawlers    |
| `wayback-inventory.json` | Every URL the Internet Archive has seen on this domain since 2001, diffed against the current sitemaps |
| `capture-report.md`, `blog-capture-report.md`, `wayback-report.md` | What was captured and what was not |

## What is NOT here

The binaries themselves: 376 images, 47 PDFs and one video, 1.62 GB. They are in
`../../fbcm-archive/` beside this repo, because git history cannot forget a
gigabyte. `binary-manifest.json` records every one of them and
`node scripts/verify-archive.mjs` checks the archive against it.

## Known limits of the capture

- Wix blog **category** listing pages server-render only four post cards each, so
  category membership could not come from them. It came from the individual posts
  instead, and both crawlers independently agreed on the distribution.
- The `pianist` blog category renders no posts and appears in no post's categories.
  It is an empty leftover, not a capture failure.
- Church Trac and Church Center hold their own data. None of it is captured here,
  and none of it is the church's to migrate off those platforms.
