# Analytics: GA4 events on this site

> Read when: you touch tracking, `SiteEvents.astro`, `src/config/events.ts`, the privacy page's analytics wording or GA4 Admin.
> The tag (`Analytics.astro`, `analytics/GoogleAnalytics.astro`) and, since 2026-11-05, the event layer (`analytics/SiteEvents.astro`, `lib/track.ts`, `lib/event-kinds.ts`) are PORTABLE; see PORTS.md cards 54, 58, 96 and 217. The starter's `docs/agent/analytics.md` describes the shared half.

GA4 measurement ID `G-JL0DHT189Q` (repo variable `PUBLIC_GA_ID`), property `557590212`. Search Console property
`sc-domain:fbcmuncie.org`. The Studio Visitors and Found on Google cards read the same data through the
studio-status `SiteData` binding (`ANALYTICS_PROVIDER=ga4`).

## How it fits together

1. **The tag** defines `window.gtag` only on the production hostname, outside automated browsers (WebDriver,
   Lighthouse, PageSpeed). Elsewhere it is undefined.
2. **`src/components/analytics/SiteEvents.astro`** (PORTABLE, rendered by `BaseLayout.astro` after `<Analytics />`)
   is one delegated script. It reads a clicked link's address and sends an event, so a link an editor adds in the
   Studio is tracked without any setup. It also watches forms coming into view, a 404 page, reading depth on
   journal posts, JavaScript errors and the search. Without `window.gtag` every call does nothing, so tests and
   previews are never counted.
3. **`src/lib/track.ts`** (PORTABLE) is the link classifier plus `track(name, params)` for React islands
   (`NewsletterSignup.tsx`) and `trackSearch` for the search dialog.
4. **`src/config/events.ts`** is this site's own map: the rules for `.ics` files, /give and Church Center giving,
   Church Center, the Church Trac app and portal, and social networks; `outbound_click` and `download_click` off
   (Enhanced Measurement counts them); the Church Trac form wrapper and the journal body selector. Rules run in
   order and the first match wins, so `open.churchtrac.com` stays above the portal rule. Pinned link by link by
   `src/lib/events-map.test.ts`, captured from the old script.
5. **`src/lib/event-kinds.ts`** (PORTABLE) writes the privacy page's "what visitors do" sentence from that map.

Nothing personal is sent: link kind and destination name only (never a mailto or tel address), form names,
search words (withheld when they look like an email or phone number). Same stance as Theology Matters and the
Foundation for Reformed Theology; no consent banner. The privacy page's wording is derived in
`src/components/privacy/PrivacyDerived.astro`, and the kinds of event it names come from the map, so a rule added to
`src/config/events.ts` is named on the next build (give it a `describe` line).

## Events

| Event                              | When                                                                                       | Parameters                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `give_click`                       | a link to /give or a Church Center giving page                                             | `destination` (give_page, church_center), `location` (header, footer, nav, page) |
| `church_center_click`              | any other Church Center link                                                               | `destination`, `location`                                                        |
| `contact_click`                    | an email or phone link                                                                     | `method`, `location`                                                             |
| `directions_click`                 | a Google or Apple Maps link                                                                | `location`                                                                       |
| `watch_click`                      | a YouTube or Vimeo link                                                                    | `destination` (streams, video, channel), `location`                              |
| `app_click`                        | the Church Trac app: App Store, Google Play or the web app                                 | `destination` (ios, android, web), `location`                                    |
| `churchtrac_click`                 | the Church Trac portal                                                                     | `destination`, `location`                                                        |
| `calendar_add`                     | an `.ics` link (Sunday calendar file)                                                      | `location`                                                                       |
| `social_click`                     | Facebook, Instagram, Threads, Linktree, X                                                  | `network`, `location`                                                            |
| `form_view`                        | a Church Trac form or the newsletter form came 40% into view                               | `form_name` (the frame's title)                                                  |
| `embed_interact`                   | the page lost focus to a frame: first use of a Church Trac form or a video, once per frame | `embed` (form, video), `embed_name`                                              |
| `generate_lead`                    | the newsletter signup succeeded                                                            | `form_name` (newsletter), `form_location`                                        |
| `site_search`, `search_no_results` | the last search term once the visitor pauses 1.2 s                                         | `search_term` (80 chars, lower case), `search_results`                           |
| `article_progress`                 | 25, 50, 75, 100% of a journal post's text passed                                           | `percent`                                                                        |
| `article_read`                     | the end reached after real reading time (30% of the reading time, 30 s to 5 min)           | `read_seconds`                                                                   |
| `page_not_found`                   | the 404 page                                                                               | `missing_path`, `from_site`                                                      |
| `js_error`                         | an error in the site's own scripts, at most three a page view                              | `error_message`, `error_source`                                                  |

Enhanced Measurement (GA4's own) adds `scroll`, outbound `click`, `file_download`, `view_search_results`,
`form_start`, `form_submit` and history-based page views (needed: the site uses a client-side router).

Cannot be seen: what happens inside a Church Trac form or the YouTube player (other sites' frames), and a
finished gift (it ends on Church Center). Form sends are therefore counted by `form_view` and
`embed_interact`, not by a completion.

## GA4 Admin settings

Set or checked on 2026-10-19 (Chrome, signed in as Nathan):

| Setting                         | State                                                                                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enhanced measurement            | On: page changes (history), scrolls, outbound clicks, site search, form interactions, video, file downloads                                                                                                                                        |
| Data retention                  | 14 months, event and user data                                                                                                                                                                                                                     |
| Unwanted referrals              | `churchcenter.com`, `churchtrac.com` (visitors returning from giving or a form do not start a new referral session)                                                                                                                                |
| Search Console                  | `sc-domain:fbcmuncie.org`, sitemap index submitted 2026-10-19, success                                                                                                                                                                             |
| Internal traffic                | Not set: needs the office or church IP addresses                                                                                                                                                                                                   |
| Key events                      | To mark once the events show in Admin > Events (about a day after first receipt): `give_click`, `generate_lead`, `contact_click`, `app_click`                                                                                                      |
| Custom dimensions (event scope) | To register once the parameters show in the picker: `location`, `destination`, `method`, `network`, `form_name`, `form_location`, `embed`, `embed_name`, `percent`, `search_results`, `missing_path`, `from_site`, `error_message`, `error_source` |

Cross-domain linking to Church Center giving cannot be set from here: it needs their tag.

## Verifying

Verified live 2026-10-19: `contact_click` and `give_click` reached GA4 Realtime from the production site. (A Chrome with a content blocker never loads gtag.js, so a missing hit there proves nothing; use the desktop app's browser pane.) Never by HTML scan. Open the live site in a real browser (not WebDriver), then GA4 Realtime by event name, or
`run_realtime_report` in the analytics MCP. The Playwright suite `tests/site-events.spec.ts` stubs `window.gtag`
and checks each classification; `src/lib/events-map.test.ts` (unit) pins the map.

## Open

- A page-context parameter (content group) on every hit needs the tag's config call, which is PORTABLE: a starter port card first.
- A completed-gift count needs a thank-you URL from Church Center.

## The Report in the Studio (card 218)

The events above come back to the office in the Studio's `Report` tool: every number by Month, Quarter or Year against
the same period a year before. `src/config/board.ts` (NOT portable) names the parts and words; a measure
`event:<name>` needs the event sent here AND listed for `fbcm` in studio-status (`src/site-series-config.ts`). Full
detail: `docs/agent/studio-kit.md`, "The Report".
