# Deployment

> Cloudflare Workers build model, the Sanity -> live-site rebuild model, environment variables, security headers, and privacy/analytics.

## Deployment

- Production: pushes to `main` trigger a Cloudflare Workers build that serves your production domain.
- Previews: any other branch gets its own preview URL via Cloudflare Workers.
- Build command: `npm run build`. Output directory: `dist`.
- `output: 'static'` in `astro.config.mjs` prerenders every page to HTML at build time. The `@astrojs/cloudflare` adapter stays installed so individual pages can opt into server rendering later via `export const prerender = false` in that page's frontmatter, but for a content-rich marketing site it's effectively inert.

### Cloudflare Workers vs Pages note

As of early 2026, Cloudflare merged Pages into Workers. Pages is in maintenance mode; Workers gets all new investment. New Astro projects should use Workers via the `@astrojs/cloudflare` adapter and `wrangler deploy`.

### Putting a site on its real domain

`npm run cutover` (`scripts/cutover.mjs`) takes a site from "the zone is not on Cloudflare" to "live on its domain, mail intact": it finds or creates the zone, audits and imports a registrar's zone export, attaches the Worker to the apex and www as custom domains, files the 301 from www, sets the four TLS settings this studio uses everywhere, and verifies the result from outside. **Dry run by default**; `--write` is the only thing that lets it act. Read the plan first, every time. Full detail in PORTS.md card 48.

Two commands it deliberately does not run, and prints instead: `npx wrangler email sending enable <domain>` (a beta command with no stable API behind it) and `npx sanity cors add https://<domain> --credentials` (needs the interactive Sanity login). Without the second one the embedded Studio loads on the new origin and then fails every request, which looks like a broken build rather than a missing CORS entry.

### Sanity -> live site rebuild model (READ THIS BEFORE CHANGING CONTENT EXPECTATIONS)

The site is `output: 'static'` -- every page is **pre-rendered to HTML at build time, not fetched at runtime**. Practical implication: when an editor edits a field in Sanity and clicks Publish, **the change does NOT appear on the live site until the site rebuilds**. The Sanity dataset updates instantly, but the live HTML is whatever was generated at the last build.

**Since 2026-09-18 the starter ships `.github/workflows/deploy.yml`, and that is the
mechanism to wire on a new project.** It deploys on a push to `main`, on a manual
`workflow_dispatch`, and on a `repository_dispatch` of type `sanity-publish`, which is
what a Sanity webhook sends. So the publish webhook now points at GitHub's dispatches
endpoint for the repo, with an `Authorization: Bearer <token>` header (the word `Bearer`
is load-bearing: without it GitHub answers 401 and Sanity reports only a failed attempt)
and a projection of exactly `{"event_type": "sanity-publish"}`. The GROQ filter below is
unchanged and still the right one. The Cloudflare build-hook steps that follow describe
the older route, for a fork that builds through Cloudflare's own git integration instead.
`docs/bootstrap/NEW-PROJECT.md` Step 8 is the setup order.

There are two ways the site rebuilds:

1. **`git push origin main`** -- Cloudflare detects the push -- triggers `npm run build` -- site updates in ~1-3 min.
2. **Cloudflare deploy hook** -- an HTTP POST to a private Cloudflare URL triggers the same build.

Without a webhook, every Sanity edit waits until the next code push. That's not a sustainable editor experience.

**Recommended GROQ filter (deny-list):** apply this at manage.sanity.io -> API -> Webhooks -> "Rebuild live site". It skips draft saves and internal Sanity asset-management events, and covers new content types automatically:

```
!(_id in path("drafts.**")) && !(_type in ["media.tag", "sanity.imageAsset", "sanity.fileAsset", "sanity.assetSourceData"])
```

The old allow-list approach (listing every `_type` that should trigger a rebuild) silently dropped new types until a developer remembered to add them. The deny-list is safer. See OPERATIONS.md for the full note.

**The setup pattern (for reference / if it ever needs to be re-created):**

1. **Create the Cloudflare deploy hook** at Cloudflare dashboard -> Workers & Pages -> your-project -> Settings -> Build hooks. Name it `Sanity content publish`, branch `main`. Copy the generated URL.

2. **Create the Sanity webhook** at manage.sanity.io -> project -> API -> Webhooks. Name it `Rebuild live site`, dataset `production`, trigger on Create + Update + Delete, HTTP method POST, paste the Cloudflare URL. Apply the deny-list GROQ filter above.

3. **Test:** edit a Sanity singleton field -> publish -> watch Cloudflare's Deployments tab -> new build kicks off within ~10 seconds -> live in ~1-3 min total.

**Trade-offs to know:**

- Every publish triggers a full ~45 second build. Reasonable for a marketing site. If the editor batch-edits many records, save the publish click until the end to consolidate builds.
- There's always a 1-3 minute delay between publish and live render. Acceptable for a marketing site; would NOT be for breaking news.
- Cloudflare's free tier covers 500 builds/month -- well clear of expected publish cadence.
- If near-instant updates are ever needed, the alternative is Incremental Static Regeneration or runtime-fetching from Sanity for specific pages. Both are larger architecture changes; the webhook is the right answer for most marketing sites.

### Environment variables

Set in Cloudflare -> **Workers & Pages -> your-project -> Settings -> Variables** (Build section). All documented in `.env.example`; copy to `.env` and fill in real values for local dev.

- `PUBLIC_SANITY_PROJECT_ID` -- Sanity project ID from manage.sanity.io. When absent, `sanityFetch` returns fallback values and the build completes cleanly (empty-state mode).
- `PUBLIC_SANITY_DATASET` -- `production` (or your dataset name). Same graceful-empty behavior as above.
- `PUBLIC_SANITY_API_VERSION` -- pinned ISO date like `2026-05-01`. Bump deliberately.
- `SANITY_API_READ_TOKEN` -- only if any page needs to read draft content (typically not, since published content is publicly readable). Mark as Secret.
- `PUBLIC_CF_ANALYTICS_TOKEN` -- Cloudflare Web Analytics token. Without it the analytics beacon doesn't render.
- `PUBLIC_NEWSLETTER_FORM_ACTION` -- optional. Build-time override for the ESP form-action endpoint.

### Live now: the YouTube check (`YOUTUBE_API_KEY`, 2026-09-24)

The header's Watch live link reads "Live now" when the church's YouTube channel is actually on air, not only when the clock says the service is on. `GET /api/live-status` (SSR, `src/pages/api/live-status.ts`; logic and tests in `src/lib/live-status.ts`) answers `{ status: "live" | "not-live" | "unknown", url?, checkedAt, reason? }`.

**With no key the site behaves exactly as before**: the endpoint answers `unknown` (reason `no-key`) without reading Sanity or calling Google, and the browser keeps the service-time window. Nothing breaks if the key is never set, is revoked, or runs out of quota (`unknown`, reason `youtube-403-quotaExceeded`, and the clock again).

**The call.** Not `search.list` (100 units a call: 140 refreshes a Sunday at one location would be 14,000 units, over the 10,000 daily quota before noon). Instead two 1-unit calls: `playlistItems.list` on the channel's uploads playlist (`UU` + the channel id after `UC`, newest 10), then `videos.list` on those ids reading `snippet.liveBroadcastContent === 'live'`. The channel id comes from Site settings' Livestream / YouTube URL: a `/channel/UC...` URL is read directly; the church's `/c/FbcmuncieOrg` and `@FbcmuncieOrg` were resolved once (2026-09-24, from the channel page's canonical link) to `UCTm6q6Q7OJ6VrURz3YXVP6A`, kept in `KNOWN_CHANNELS`. Any other name answers `unknown` (`no-channel`), so a new channel never has the old id checked for it: add its id there, or put a `/channel/` URL in Site settings. Known limit: a private or unlisted stream is not in the uploads playlist.

**When.** Google is asked only inside the check window, Sunday from the service time minus 75 minutes to plus 135 (10:45 am gives 9:30 am to 1:00 pm, church time, DST-safe). Outside it the endpoint answers `not-live` (`outside-window`) without a call, and the browser does not ask at all.

**The cache.** In the isolate (`StatusMemo`): a real answer is reused for 90 s, `unknown` for 5 minutes (back-off), and concurrent requests during a refresh share one call. At the edge: the Cache API per Cloudflare location, keyed on the bare path (a query string cannot bust it), `s-maxage` set to the same TTL; browsers get `max-age=60`. **The Cache API does nothing on `*.workers.dev`** (Cloudflare caches only on a zone), so before the cutover only the isolate layer applies. Settings are read from Sanity (published, CDN) at most every 10 minutes per isolate, and only when a key is set.

**Worst-case quota.** 2 units a refresh; one refresh per 90 s per cache across the 210-minute window is 140 refreshes, so **280 units per cache per Sunday**, and 0 on other days. On the custom domain a cache is a Cloudflare location with visitors in it: one to three for a Muncie congregation, 280 to 840 units (3 to 8% of the 10,000 daily quota); the quota would need 35 locations busy all morning. On `workers.dev` a cache is a warm isolate instead: still 280 units each, and a small site has few. The browser adds nothing on top: at most one request per visitor per minute, answered from the caches.

**Setting the key (Nathan, once):**

1. Google Cloud Console (console.cloud.google.com), signed in with the church's or the studio's Google account: create a project (for example "fbcm-site").
2. APIs & Services -> Library -> "YouTube Data API v3" -> Enable.
3. APIs & Services -> Credentials -> Create credentials -> API key. Then edit the key: **API restrictions -> Restrict key -> YouTube Data API v3 only**. Leave Application restrictions at "None" (the Worker calls from Cloudflare's servers, so an HTTP-referrer or IP restriction would block it). No billing account is needed; the default quota is 10,000 units a day.
4. Put it on the Worker as a **secret**, from the repo root after a build: `npx wrangler secret put YOUTUBE_API_KEY -c dist/server/wrangler.json` (paste the key at the prompt), or Cloudflare dashboard -> Workers & Pages -> fbcm-site -> Settings -> Variables and Secrets -> Add -> type Secret, name `YOUTUBE_API_KEY`. A secret takes effect on the live Worker without a rebuild.
5. Check it on a Sunday between 9:30 am and 1:00 pm: `https://<site>/api/live-status` should say `not-live` or `live` with no `reason`, never `unknown`. On any other day it says `not-live` with `reason: "outside-window"`, which proves only that the key is present. Locally: `npm run preview -- --var YOUTUBE_API_KEY:<key>` (or a line in `.dev.vars`).

### Contact form: turning it on

Added 2026-09-18. Until then nobody in the family had watched a message actually arrive, and this section said so. One has now (Stone Steps 50K, confirmed by the client the same morning), so these are the six steps that worked, in the order they worked in. `wrangler.jsonc` carries the same list as a comment next to the bindings themselves; PORTS.md card 45 carries the reasoning.

**Prerequisite: the domain has to be on Cloudflare DNS.** Email Sending cannot be enabled otherwise, and that is the single thing that blocked this for months. `npm run cutover` is the script that moves a zone across.

1. `npx wrangler d1 create <site>-contact`, and note the returned `database_id`.
2. `npx wrangler d1 migrations apply <site>-contact --remote`. The remote apply is deliberately separate from the local one.
3. `npx wrangler email sending enable <domain>`. This onboards the domain for **outbound** mail: SPF and DKIM go under a `cf-bounce` subdomain, so it sits alongside Microsoft 365 or Google Workspace on the same domain. Email **Routing** would not, because it takes the apex MX.
4. `npx wrangler secret put CONTACT_TO` and `npx wrangler secret put CONTACT_FROM`. Secrets, not vars: `CONTACT_TO` is where a client's enquiries land.
5. Uncomment the two binding blocks in `wrangler.jsonc`, paste the database id, and deploy. Keep that as its own commit: a deploy that fails on a binding is much easier to read when the binding is the only thing that changed.
6. Send **one** labelled test submission through the live form, then read the row back:

   ```
   npx wrangler d1 execute <site>-contact --remote \
     --command "SELECT id, received_at, notified, notify_error FROM contact_submissions ORDER BY id DESC LIMIT 1"
   ```

   `notified = 1` is the proof, and it is the only proof. A 200 from the endpoint does not distinguish a working form from a silently broken one, because the route returns 200 for a stored-but-not-sent submission on purpose: the visitor did their part and the message exists.

**Two things to hand to a human rather than an agent.** Steps 2 and 4 can trip a permission gate, and did during the Stone Steps cutover: the remote migration writes to a live database and `secret put` reads a value from a prompt. Give those two to whoever holds the account and let the agent do the rest.

**DMARC stays at `p=none`** until the client's own mail provider has DKIM set up. Tightening it first means the client's ordinary mail starts failing, which is a much bigger problem than a contact form.

**Turnstile is separate and optional.** The endpoint skips it entirely when `TURNSTILE_SECRET` is unset, and the honeypot plus the timing check stand on their own. Stone Steps shipped without it.

### Studio: deploy after schema changes

When you change a Sanity schema (`src/sanity/schemaTypes/**`), run `npm run typegen` and commit the regenerated types, then deploy the site. The Studio is embedded at `/studio` and ships with the site build, so deploying the site publishes the schema. There is no separate Studio deploy (and `npx sanity deploy` must NOT be run: it would create a standalone Studio that silently falls behind). Until the deploy lands, editors may see fields that don't match the current types, or miss newly added ones.

### Security headers

`public/_headers` ships with the deploy. Five site-wide headers Cloudflare applies to every route:

- `Strict-Transport-Security` (HSTS, one year, includeSubDomains)
- `X-Frame-Options: DENY` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`

Content-Security-Policy is intentionally not included; doing it right requires testing against all third-party scripts in use (Sanity CDN, Cloudflare Analytics, any embed). See `stack-and-config.md` for why the meta-CSP approach was abandoned.

### Privacy and analytics

The starter ships in an effectively zero-cookie posture. The current baseline:

- **Cloudflare Web Analytics** uses no cookies and stores no personal data.
- **No Google Analytics, no Facebook/Meta Pixel.** No ad-tracking or retargeting pixels by default. If you add one, design a full consent management platform in BEFORE adding the tracker -- don't bolt it on.
- **Sanity client** reads public published content, no auth cookies.

**`/privacy` page:** a real privacy policy page ships, driven by the `privacyPage` singleton in Sanity with a plain-voice static fallback. Linked from the footer on every page and from every capture form's consent note. Update this page to reflect your actual data practices before going live.
