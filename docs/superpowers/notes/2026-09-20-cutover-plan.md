# Cutover plan: moving fbcmuncie.org onto the new site

Written 2026-09-20 at the end of plan 2c. The site is built, verified and
running at `https://fbcm-site.nathanjnixon86.workers.dev`. This note is the
plan for the one morning when the church's own domain starts pointing at it.

Nothing here has been run against the live domain. `scripts/cutover.mjs` is dry
by default: with no flags it makes no state-changing calls at all, prints what
it would do, and stops. `--write` is the only thing that lets it act.

---

## What the script will do

Run `node scripts/cutover.mjs` with no flags to see this. Output from
2026-09-20, on this branch, with no Cloudflare credentials loaded:

```
cutover: fbcmuncie.org -> Worker "fbcm-site"
MODE: DRY RUN. Nothing will be changed and nothing leaves this machine.
  [warn]  CLOUDFLARE_API_TOKEN is not set; --write would fail.
  [warn]  CLOUDFLARE_ACCOUNT_ID is not set; --write would fail.

========================================================================
STEP 1: The zone for fbcmuncie.org
========================================================================
  [plan]  GET /zones?name=fbcmuncie.org&account.id=
  [plan]  create the zone for fbcmuncie.org in account <CLOUDFLARE_ACCOUNT_ID> as a FULL setup
          full setup, not partial: Cloudflare has to be authoritative for the zone before a
          Worker custom domain or Email Sending can be attached to it.
          The two nameservers to give the registrar are printed here once the zone exists.

========================================================================
STEP 2: The old zone: audit, then import a cleaned copy
========================================================================
  [skip]  no --zone-file given; DNS records will have to be added by hand

========================================================================
STEP 3: Attach fbcm-site to fbcmuncie.org and www, and set the TLS posture
========================================================================
  [plan]  everything in this step waits for the zone to exist

========================================================================
STEP 4: The two commands a human runs
========================================================================
  [plan]  check `npx wrangler email sending list` for this domain

  1.  npx wrangler email sending enable fbcmuncie.org
          Onboards the domain for OUTBOUND mail: it writes SPF and DKIM under a
          cf-bounce subdomain, so it coexists with Microsoft 365 or Google Workspace
          on the same domain (Email ROUTING would not: it takes the apex MX).
          Not run here because it is a beta command with no stable API behind it.

  2.  npx sanity cors add https://fbcmuncie.org --credentials
          Not run here because it needs the interactive Sanity login, not an API token.
          Without it the embedded Studio at /studio loads and then fails every request
          from the new origin, which looks like a broken build rather than a CORS entry.

========================================================================
STEP 5: Verify from outside
========================================================================
  [plan]  GET https://fbcmuncie.org expecting 200 and the site's <title>
  [plan]  GET https://www.fbcmuncie.org expecting 301 to https://fbcmuncie.org
  [plan]  GET http://fbcmuncie.org expecting 301 to https://fbcmuncie.org
  [plan]  resolve MX for fbcmuncie.org and confirm mail still answers from the new nameservers
          Not run: outside checks only happen with --write or --verify, so a dry run
          against a domain that is not live yet does not print four red lines.

========================================================================
SUMMARY  fbcmuncie.org  ->  fbcm-site  (DRY RUN)
========================================================================
  check                 status    detail
  --------------------  --------  ------

  Nothing was changed. Re-run with --write to act on this plan.
```

The domain and the Worker name were read from the repo, not typed: the domain
comes from `src/data/site.ts` and the Worker name from `wrangler.jsonc`. No
arguments were needed to print the plan.

Two things in that output need a decision before `--write` is passed.

**Step 2 will skip unless a zone file is given.** Without
`--zone-file <path>` the script adds no DNS records at all, which means the
church's mail records are not carried across and their mail stops. Export the
zone from the registrar first and pass it in.

**Step 5 expects www to redirect to the apex, and this site is built the other
way round.** `src/data/site.ts` line 26 and `astro.config.mjs` line 103 both
set the canonical address to `https://www.fbcmuncie.org`, so the sitemap, the
share cards and every canonical tag name the www host. The script's outside
check asserts the reverse. Pick one before the move and make the redirect match
the canonical: either change the two config lines to the apex, or change the
step 5 assertion. Do not leave them disagreeing, because search engines will be
told one thing and served another.

---

## Before that morning

Nothing in this list is code. Each line is a person and a decision.

- [ ] `#nathan` Registrar login for fbcmuncie.org, in hand, and confirmation of
      where DNS is hosted today. The whole move is a nameserver change at the
      registrar, and without that login there is no move.
- [ ] `#nathan` Export the current zone (MX, TXT, SPF, DKIM, and anything else
      the church runs on the domain) before touching anything, and keep the
      export. Mail is the one thing that must not break, and a nameserver
      change drops every record that was not carried across.
- [ ] `#church` Confirm which mail provider the church uses and that nothing
      else (a phone system, a door system, a vendor's verification record)
      depends on a DNS record on this domain.
- [ ] `#nathan` The Wix site stays live and paid for until the new domain
      answers correctly on both the apex and www. Do not cancel first.
- [ ] `#church` Decide who cancels Wix and when. The rule of thumb: a week
      after the DNS change has settled and the new site has been answering the
      whole time, not on the day.
- [ ] `#nathan` Send a test submission through the Church Center visitor form
      (form 159198) and confirm it reaches a church inbox that somebody reads.
      The site has no form of its own, so that form is the only way a visitor
      can write to the church.
- [ ] `#nathan` Create the Cloudflare Web Analytics site in the dashboard and
      add its token to the repository as `PUBLIC_CF_ANALYTICS_TOKEN` BEFORE the
      move. A rebuild does not inherit the old site's tag, and the loss is
      invisible for weeks. Setting it also flips the privacy page from "this
      site runs no analytics" to the sentence about cookieless counting, so it
      is better set before the church reads that page on its own domain.
- [ ] `#nathan` `PUBLIC_GA_ID`, only if the church actually had Google
      Analytics on the Wix site. If they did not, skip it; do not add tracking
      the church never asked for.
- [ ] `#nathan` Verify the new host in Google Search Console, and write down
      what the old Wix property was reporting before it goes quiet, so there is
      a before number to compare against.
- [ ] `#nathan` Put the third copy of `fbcm-archive/` somewhere off this
      machine. It is the only record of the Wix site once Wix is cancelled.
      `node scripts/verify-archive.mjs --quick` checks a copy is intact.
- [ ] `#nathan` Decide how the hero photographs are delivered. They come from
      the Sanity CDN today, which costs about 1.2 seconds of the mobile load.
      The three options are to accept it, to pull the photographs into the
      build so they share the site's own connection, or to put Cloudflare
      Images in front. The reasoning is in
      `docs/superpowers/notes/2026-09-20-lighthouse.md` section 6.
- [ ] `#nathan` Sign in to the deployed Studio at `/studio` and open the
      Preview tool once. The runtime secret and the CORS entry are both in
      place as of 2026-09-20, so this is the last unproven link in the preview
      chain, and it can only be checked by a human with a Sanity login.
- [ ] `#church` Work through the confirm list in
      `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`, and walk
      the site with `docs/superpowers/notes/2026-09-20-review-walkthrough.md`.
      Content corrections are easier before the address is public than after.

---

## After the move

Run these in order, the same morning.

1. **Redirects.** `npm run verify:redirects -- --origin https://www.fbcmuncie.org`
   The npm script already carries `--follow-script`, which is what lets the six
   category rules that land on `/blog?category=` be followed through to the
   archive page they resolve into. All 44 rules must report OK, exactly as they
   do today against the workers.dev host.
2. **Lighthouse.** Re-measure the six cells named in
   `docs/superpowers/notes/2026-09-20-lighthouse.md` section 7: mobile
   performance and FCP on all six pages against the 89 to 92 baseline, desktop
   performance on `/`, `/visit`, `/blog`, `/staff` and the post, and home
   mobile LCP. The baseline table is section 1 of that note, so the comparison
   is cell for cell.
3. **The Studio and the preview on the new origin.** Add the new address to
   the Sanity CORS list (`npx sanity cors add https://www.fbcmuncie.org --credentials`,
   and the apex too if both answer) and point
   `SANITY_STUDIO_PREVIEW_URL` at it. The `SANITY_TOKEN` Worker secret carries
   over with the Worker and does not need setting again.
4. **The canonical address.** `src/data/site.ts` and `astro.config.mjs` both
   already say `https://www.fbcmuncie.org`. Verify that is still what you want
   after the decision above, and that the sitemap at
   `/sitemap-index.xml` lists that host and not the workers.dev one.
5. **Church Trac's embed domains.** Every form shown through a "Church Trac
   form" band, and the online giving embed, only opens on the address typed in
   Church Trac's `Form/Giving Embed Domain` (per form, under Church Connect,
   Show Additional Options; giving under Connect Setup, Connect Settings /
   Users, Online Giving, Embed). Change each one to `www.fbcmuncie.org` (and
   the apex too, if Church Trac takes more than one), then open each page with
   a form and check the form draws. The Studio's `Church Trac forms` list is
   the inventory of which forms to check.

---

## Search and AI visibility at cutover

Added 2026-09-24 (the local search pass, `feat/local-seo`). The site already says the right
things to search engines and AI assistants (titles and descriptions that name the place,
the church's JSON-LD, a robots.txt that names and allows the AI crawlers, `/llms.txt`);
these steps make sure nothing between the site and those crawlers undoes it, and tell the
search engines the site has moved. Do them the same morning, after "After the move".

- [ ] **Cloudflare AI Crawl Control must be OFF for the zone.** New zones often have
      "Block AI bots" switched on by default, and it blocks GPTBot, ClaudeBot,
      PerplexityBot and the rest at Cloudflare's edge, whatever robots.txt says. That would
      silently drop the church out of ChatGPT, Perplexity and Claude answers, and nothing on
      the site would show it. Where it lives: the Cloudflare dashboard, the
      `fbcmuncie.org` zone, **AI Crawl Control** in the sidebar (older dashboards: Security,
      then Bots, the "Block AI bots" setting). Set it to allow (do not block on any
      hostname), and leave **"Manage your robots.txt"** (Cloudflare's managed robots.txt)
      off, since it prepends `Disallow` rules for AI crawlers to ours. Bot Fight Mode can
      stay as it is: it does not challenge verified bots. **Verify from outside**, and
      expect 200 for every line, never 403 or a challenge page:

      ```
      curl -s -o /dev/null -w "%{http_code} GPTBot\n" -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot" https://www.fbcmuncie.org/visit
      curl -s -o /dev/null -w "%{http_code} ClaudeBot\n" -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" https://www.fbcmuncie.org/visit
      curl -s -o /dev/null -w "%{http_code} PerplexityBot\n" -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" https://www.fbcmuncie.org/visit
      curl -s https://www.fbcmuncie.org/robots.txt
      ```

      The last one must print our file exactly (it starts `User-agent: *` / `Allow: /` and
      names the crawlers), with nothing Cloudflare added above it.
- [ ] **Google Search Console.** Add `fbcmuncie.org` as a **Domain** property and verify it
      with the DNS TXT record Google gives you, added in the Cloudflare zone (it survives
      every redeploy, unlike an HTML file). If the church already had a property for the Wix
      site, keep it: its history carries over. Then Sitemaps, submit
      `https://www.fbcmuncie.org/sitemap-index.xml`.
- [ ] **Bing Webmaster Tools.** Sign in and choose **Import from Google Search Console**, which
      brings the verified site and its sitemap across in one step; if the import is not
      offered, add the site and submit the same sitemap by hand. Bing feeds Copilot and
      ChatGPT search, so this one matters as much as Google.
- [ ] **Spot-check the 49 retired-URL redirects.** Step 1 of "After the move"
      (`npm run verify:redirects -- --origin https://www.fbcmuncie.org`) proves them all; then
      open three by hand in a browser (an old `/post/...` that moved, an old page such as
      `/accessibility`, and a `/blog?category=` link) and check each lands on a real page with
      a 301, not a 302.
- [ ] **Rich Results Test** (https://search.google.com/test/rich-results) on `/`, `/visit` and
      one sermon preview. Expect: `/` the church (Organization), no errors; `/visit` the
      church, the breadcrumb, the weekly Event and the FAQ, no errors (the Event and the FAQ
      will not earn Google rich results: Google shows event results for single events only,
      and FAQ results only for government and health sites. They are there for Bing and the
      AI assistants, which read them); the post, an Article (BlogPosting) and the breadcrumb.
      Warnings about optional fields are fine; errors are not.
- [ ] **Confirm IndexNow's first run.** `curl -s https://www.fbcmuncie.org/1aadd9425437cc7a001d23cbec702fef.txt`
      must print the key (it is `site.indexNowKey` in `src/data/site.ts`). Then trigger a
      deploy (Actions, Deploy, "Run workflow"; a Studio publish does it too) and read its
      **IndexNow** step: it should say "the production host serves the key", then a 200 or
      202 for the sitemap's URLs. Until the domain moves the same step says the host "answered
      400, not 200" and does nothing, which is correct. Detail in `docs/agent/deployment.md`,
      "IndexNow".
