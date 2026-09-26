// Safe to edit by hand
// The preview shows every reveal in its finished state (2026-09-26).
//
// WHY. The site's scroll reveals (an arch photo wiping in, a glyph drawing
// itself, a picture inking in, the watchword's ampersand turning) start hidden
// and wait for BaseLayout's observer to add a class. The draft preview does not
// run that observer, so in the Studio's Presentation tool every one of them
// stayed at its hidden start: measured on /preview/staff, 0 of 27 reveal
// elements visible, the hero's two portraits clipped to nothing. The preview is
// for checking content, not for watching animations, so the overlay
// (VisualEditingOverlay.tsx) marks them all finished on load and after every
// refresh. Live pages are untouched: this runs only in the preview.
//
// The classes are the ones the page's own scripts add (and the ones
// preview-morph.ts keeps across a refresh, CLIENT_STATE_CLASSES).

/** [selector for an element still at its start, the class that finishes it]. */
export const REVEAL_FINISHED: ReadonlyArray<readonly [string, string]> = [
  ['[data-reveal]:not(.is-visible)', 'is-visible'],
  ['svg[data-reveal="draw"]:not(.is-drawn)', 'is-drawn'],
  ['.img-curtain:not(.is-revealed)', 'is-revealed'],
  ['[data-stagger-grid]:not(.is-staggered)', 'is-staggered'],
  ['.step-connector:not(.is-visible)', 'is-visible'],
];

/** The two DOM calls this needs, so a test can hand in a fake document. */
interface Root {
  querySelectorAll(selector: string): ArrayLike<{ classList: { add(name: string): void } }>;
}

/** Mark every reveal in `root` finished. Returns how many elements changed. */
export function finishReveals(root: Root): number {
  let n = 0;
  for (const [selector, cls] of REVEAL_FINISHED) {
    const found = root.querySelectorAll(selector);
    for (let i = 0; i < found.length; i++) {
      found[i].classList.add(cls);
      n++;
    }
  }
  return n;
}
