// Safe to edit by hand
// scaffold-file: journal
// The pure half of the post title's shared View Transition (2026-09-24,
// feat/print-motion). The DOM half is src/components/transitions/shared-title.ts;
// the reasoning is in docs/agent/animation.md, "The post title carries over".
//
// A blog row's title and the post's h1 are the same object: the reader clicks
// the one and meets the other. So on a FORWARD navigation from a row to its
// post, the two share one view-transition-name for that one navigation, and
// the browser carries the title from the row up into the masthead while the
// rest of the page cross-fades. These helpers decide when that pairing is
// honest; everything they cannot vouch for gets the plain cross-fade.

/** The one name the pair shares. Never set in markup: only for a navigation. */
export const SHARED_TITLE_NAME = 'post-title';

/** A pathname with no trailing slash (except the root) and decoded, for comparing. */
export function normalisePath(pathname: string): string {
  let p = pathname;
  try {
    p = decodeURI(pathname);
  } catch {
    /* a malformed escape: compare it as it is */
  }
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

/** True when two URLs (or paths) name the same page on this site. */
export function samePage(a: string, b: string, base = 'https://x.invalid'): boolean {
  try {
    const ua = new URL(a, base);
    const ub = new URL(b, base);
    return ua.origin === ub.origin && normalisePath(ua.pathname) === normalisePath(ub.pathname);
  } catch {
    return false;
  }
}

/** The part of a box a reader can see, as a fraction of the box's height. */
export function visibleFraction(top: number, bottom: number, viewportHeight: number): number {
  const h = bottom - top;
  if (!(h > 0) || !(viewportHeight > 0)) return 0;
  const seen = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  return Math.max(0, Math.min(1, seen / h));
}

export interface PairInput {
  /** 'push' | 'replace' | 'traverse', as the router reports it. */
  navigationType: string;
  /** The link the reader followed, or null for a navigation with no source. */
  sourceHref: string | null;
  /** Where the navigation goes. */
  to: string;
  /** The row title the source sits in: its box, or null when it is not in a row. */
  rowTitle: { top: number; bottom: number } | null;
  viewportHeight: number;
  /** Whether the incoming page has a post title to carry the row's into. */
  destinationHasTitle: boolean;
  reducedMotion: boolean;
}

/**
 * Whether this navigation should carry the row's title into the post's h1.
 * Forward only (back and forward in history get the cross-fade: the row the
 * reader came from may be anywhere on the restored page), only from a row
 * title whose link is where the navigation goes, only when at least half the
 * title is on screen (a title flying in from off the page reads as a glitch),
 * and never under prefers-reduced-motion.
 */
export function shouldPairTitle(i: PairInput): boolean {
  if (i.reducedMotion) return false;
  if (i.navigationType === 'traverse') return false;
  if (!i.destinationHasTitle || !i.rowTitle || !i.sourceHref) return false;
  // A relative href is read against the destination, so only the path counts.
  if (!samePage(i.sourceHref, i.to, i.to)) return false;
  return visibleFraction(i.rowTitle.top, i.rowTitle.bottom, i.viewportHeight) >= 0.5;
}
