// scaffold-file: journal
// Foundation, edit with care
// The post title carries over (2026-09-24, feat/print-motion). Imported by
// BaseLayout's layout script, so it rides in a module every page already
// loads; the listeners sit on the document, which the router keeps.
//
// On a forward navigation from a blog row (PostRow.astro, whose heading carries
// [data-vt-title]) to that row's post, the row's heading and the post's h1
// (.p2-title) are given ONE view-transition-name for that navigation only, so
// the title moves from the row into the masthead while the page cross-fades
// (globals.css, "View transitions"). Nothing carries the name in markup: every
// row on a list page carries [data-vt-title], and two elements with one name
// make the browser skip the whole transition, so only the row that was
// followed is named, and only for that navigation. (Until 2026-09-24 /blog also
// listed some posts twice, in the register and "Worth coming back for"; that
// band is gone, but the one-name rule above is why the naming stays per
// navigation.)
//
// When the pairing happens is decided by src/lib/shared-title.ts (unit tested):
// forward only, from a row title at least half on screen, to a page that has a
// post title, never under prefers-reduced-motion. Everything else keeps the
// plain cross-fade.
//
// Timing (Astro's router): astro:before-preparation fires on the old page
// before the new one is fetched. Its `loader` is wrapped, so once the new
// document has loaded, and before the browser takes the old page's snapshot,
// the old row title is named, and the new document's h1 is named before it is
// swapped in. The names are cleared at the start of the next navigation.
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { SHARED_TITLE_NAME, shouldPairTitle } from '@/lib/shared-title';

let named: HTMLElement[] = [];

function clearNames() {
  for (const el of named) el.style.removeProperty('view-transition-name');
  named = [];
}

document.addEventListener('astro:before-preparation', (event) => {
  clearNames();
  const e = event as TransitionBeforePreparationEvent;
  const source = e.sourceElement instanceof Element ? e.sourceElement.closest('a') : null;
  const row = source?.closest<HTMLElement>('[data-vt-title]') ?? null;
  // Nothing to carry: leave the loader alone.
  if (!row || !source) return;

  const load = e.loader;
  e.loader = async () => {
    await load();
    const title = e.newDocument?.querySelector<HTMLElement>('h1.p2-title') ?? null;
    const box = row.getBoundingClientRect();
    const pair = shouldPairTitle({
      navigationType: e.navigationType,
      sourceHref: source.href,
      to: e.to.href,
      rowTitle: row.isConnected ? { top: box.top, bottom: box.bottom } : null,
      viewportHeight: window.innerHeight,
      destinationHasTitle: !!title,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
    if (!pair || !title) return;
    row.style.setProperty('view-transition-name', SHARED_TITLE_NAME);
    title.style.setProperty('view-transition-name', SHARED_TITLE_NAME);
    named = [row, title];
  };
});
