# Overnight rollout handoff (2026-09-24)

Nathan asked on the evening of 2026-09-23 for every remaining page to get the
redesign pass and "have it all working". All the code is merged to `main` and
deployed (62da58d). Every page's new composition is ready but NOT yet written to
Sanity: the auto-mode safety classifier refuses a production Sanity write without
Nathan's go-ahead at the moment it runs. Until the writes run, each page shows its
current content drawn by the new components (checked on production: no page
overflows, light and dark, 1440 and 375).

## What landed

| Page | Branch | Shared pieces it restyled (every page using them changed too) |
|---|---|---|
| Home | `feat/home-identity` | hymn board, goal doors, dated building band, blog rows, gold give band (content applied) |
| Visit | `feat/visit-identity` | hero (split, text-only, window), timeline path, FAQ, ImageText arches, gold closing band, doors board, undated building band, the heading fit and the mid-word heading gate (`tests/headings.spec.ts`) |
| Staff | `feat/staff-identity` | StaffGrid lancet bands, ScriptureBand (watchword verse) |
| Wedding | `feat/wedding-identity` | GalleryGrid rooms and arcade, DocumentList doors and register, QuoteBlock gold band |
| Journal | `feat/journal-identity` | /blog, archives, post page; one PostRow shared with Home |
| History | `feat/history-identity` | the page opener "1859 to <build year>" |
| Ministries | `feat/ministries-identity` | the derived four-goals index, `ministry.goal` |
| Beliefs | `feat/beliefs-identity` | RichText bodies; text bands take brand grounds from their neighbours |
| Give, Contact, 404, privacy | `feat/utility-identity` | Hours (office door), the /give indigo opener, 404 doors, privacy |

Gates on the final `main`: 867 unit tests, 26 script tests, 602 Playwright passed
(1 skipped), `astro check` 0 errors, Studio audit clean, every public page's
stylesheet inline (largest `<style>` 154,423 B on /blog, below the per-chunk
limit), parity recaptured to its fixpoint (172/172, 149,112 B on both builds).

## To run in the morning (each needs Nathan's OK)

All were dry-run against the live dataset on 2026-09-24; none found editor edits
to protect. Every `--apply` backs up the live document first.

1. `node scripts/set-ministry-goals.mjs --write` (Worship: Worship; Youth and
   Adult: The Way, each backed by the church's own line; Children and Outreach
   left for the church). Run before the ministries page.
2. `npm run seed-pages -- --only visit,staff,wedding,history,ministries,beliefs,give,contact,not-found --apply`
3. Commit the backups the run writes to `scripts/data/backups/`.
4. After the rebuild: shoot each page light and dark at 1440 and 375, check Studio
   click-to-edit on one new block per page, then run
   `gh workflow run visual.yml -f update=true` so the visual-regression baselines
   match the new pages (that workflow fails on `main` until then, as expected).
5. Clean up the preview fixtures (`/styleguide/<page>` routes, their JSON and the
   `tests/routes.ts` lines) and recapture parity, as PENDING lists.

## Owner questions collected overnight (details in `docs/PENDING.md`)

- The pastors' letter is on both /who-we-are and /staff: keep both or drop one?
- The Hannaford rendering is on Home only (one photo per page); move or share it
  with /history?
- Text bands now take indigo, brown or taupe grounds site-wide (Beliefs pass):
  keep that everywhere?
- /give opens on indigo (so it doesn't open and close on gold): OK, or drop the
  closing band instead?
- Contact's h1 is the church's own "Contact": OK?
- The staff scripture band highlights "same" three times: OK?
- Ministries: which goal do Children and Outreach serve?
- Photo repeats until a photo morning: Visit's Worship step and Home's Worship
  goal share a photo; the handbells are on Home and Ministries; four ministry
  documents' photos also appear on Home or Who We Are.
- Title-card blog covers read as lettering in the small arches.
- In dark mode the taupe, gold and cream bands stay light.
- The two-girls lancet photo on Home is low resolution.
