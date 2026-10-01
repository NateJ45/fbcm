// scripts/lib/this-sunday-check.mjs
//
// The decision behind .github/workflows/this-sunday.yml: is the live home page
// missing a sermon on its "This Sunday" line that the church's YouTube channel
// already names? If so the site needs a rebuild now, instead of waiting for the
// next scheduled one.
//
// The home page is built, not rendered per visit, so a livestream scheduled
// after the day's last build is invisible until the next one. The hero marks
// its sermon span with data-sunday-sermon="<that Sunday, YYYY-MM-DD>"
// (src/components/Hero.astro), which is what we look for. It is present for a
// sermon preview post and for a YouTube broadcast alike, so a Sunday that
// already names its sermon, from either source, never triggers a rebuild.
//
// Pure functions only: the script and the workflow do the fetching.

/** Whether the page's hero already carries a sermon for `sunday` (YYYY-MM-DD). */
export function pageNamesSermon(html, sunday) {
  if (!html || !sunday) return false;
  return html.includes(`data-sunday-sermon="${sunday}"`);
}

/**
 * Whether the site is stale: the feed names a broadcast for the coming Sunday
 * and the live page does not show a sermon for that Sunday.
 *
 * @param {{ sunday: string } | null} broadcast  upcomingBroadcast() from src/lib/youtube-feed.ts
 * @param {string | null} html                   the live home page, or null when it could not be fetched
 */
export function siteIsStale(broadcast, html) {
  if (!broadcast) return false; // nothing on YouTube to show
  if (html === null || html === undefined || html === '') return false; // never rebuild on a fetch failure
  return !pageNamesSermon(html, broadcast.sunday);
}
