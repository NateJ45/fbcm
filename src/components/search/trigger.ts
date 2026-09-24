// scaffold-file: journal
// Foundation, edit with care
// The site search's trigger (2026-09-24, feat/scripture-search). A few hundred
// bytes, imported by BaseLayout's own layout script so it rides in a module
// every page already loads: no extra request, no markup, no stylesheet. It
// waits for a visitor to ask for the search.
//
//   - A click on anything carrying [data-search-open] (the header's Search
//     button) opens it; so does a `site-search:open` event (the mobile menu,
//     which closes its sheet first), and "/" or Ctrl/Cmd+K typed anywhere that
//     is not already a text field.
//   - Hover or focus on a trigger warms the dialog module and the index, so
//     the first open does not wait on the network.
//
// Everything else (the dialog, its stylesheet, Pagefind and the index) is
// search-dialog.ts, loaded on that first open and never before. The layout
// script runs once per full page load (View Transitions keep it), and the
// listeners sit on the document, which survives a swap.
//
// It began as its own SiteSearch.astro script, which Vite emitted as a
// separate module: one more request on every page, before anyone had asked
// for the search. Riding in the layout script, the page makes the same
// requests it made before the search existed (34 on the home page, 27 on a
// post, measured with Lighthouse) and carries about 0.7 KB more.

type DialogModule = typeof import('./search-dialog');
let mod: Promise<DialogModule> | null = null;
const load = () => (mod ??= import('./search-dialog'));

function open(from?: HTMLElement | null) {
  void load().then((m) => m.openSearch(from));
}

document.addEventListener('click', (e) => {
  const trigger = (e.target as Element | null)?.closest<HTMLElement>('[data-search-open]');
  if (!trigger) return;
  e.preventDefault();
  open(trigger);
});
window.addEventListener('site-search:open', () => open());

const warm = (e: Event) => {
  if ((e.target as Element | null)?.closest?.('[data-search-open]')) {
    void load().then((m) => m.warm());
  }
};
document.addEventListener('pointerover', warm, { passive: true });
document.addEventListener('focusin', warm);

document.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement | null;
  const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
  const k = e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey);
  if ((slash && !typing) || k) {
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    open();
  }
});

export {};
