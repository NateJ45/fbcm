# Analytics: GA4 events on this site

> Read when: you touch tracking, `SiteEvents.astro`, the privacy page's analytics wording or GA4 Admin.
> The tag itself (`Analytics.astro`, `analytics/GoogleAnalytics.astro`) is PORTABLE and unchanged; see PORTS.md card 54, 58 and 96.

GA4 measurement ID `G-JL0DHT189Q` (repo variable `PUBLIC_GA_ID`), property `557590212`. Search Console property
`sc-domain:fbcmuncie.org`. The Studio Visitors and Found on Google cards read the same data through the
studio-status `SiteData` binding (`ANALYTICS_PROVIDER=ga4`).

## How it fits together

1. **The tag** defines `window.gtag` only on the production hostname, outside automated browsers (WebDriver,
   Lighthouse, PageSpeed). Elsewhere it is undefined.
2. **`src/components/SiteEvents.astro`** (not PORTABLE, rendered by `BaseLayout.astro` after `<Analytics />`)
   is one delegated script. It reads a clicked link's address and sends an event, so a link an editor adds in the
   Studio is tracked without any setup. It also watches forms coming into view, a 404 page, reading depth on
   journal posts, JavaScript errors and the search. Without `window.gtag` every call does nothing, so tests and
   previews are never counted.
3. **`src/lib/track.ts`** is `track(name, params)` for React islands (`NewsletterSignup.tsx`) and `trackSearch`
   for the search dialog.

Nothing personal is sent: link kind and destination name only (never a mailto or tel address), form names,
search words (withheld when they look like an email or phone number). Same stance as Theology Matters and the
Foundation for Reformed Theology; no consent banner. The privacy page's wording is derived in
`src/components/privacy/PrivacyDerived.astro`.

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

See the table at the end of this file; filled in on 2026-10-19 (custom dimensions, key events, retention,
internal traffic). Key events: `give_click`, `generate_lead`, `contact_click`, `app_click`.

## Verifying

Never by HTML scan. Open the live site in a real browser (not WebDriver), then GA4 Realtime by event name, or
`run_realtime_report` in the analytics MCP. The Playwright suite `tests/site-events.spec.ts` stubs `window.gtag`
and checks each classification.

## Open

- A page-context parameter (content group) on every hit needs the tag's config call, which is PORTABLE: a starter port card first.
- A completed-gift count needs a thank-you URL from Church Center.
