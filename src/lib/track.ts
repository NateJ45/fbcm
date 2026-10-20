// Safe to edit by hand
// Send one GA4 event from a component, or do nothing.
//
// The tag (src/components/analytics/GoogleAnalytics.astro) defines window.gtag
// only on the production hostname, outside automated browsers, and only when
// PUBLIC_GA_ID is set. Everywhere else window.gtag is undefined and this is a
// silent no-op, so tests, previews and local builds need no stubbing and no
// condition of their own. Event names and parameters: docs/agent/analytics.md.

type Params = Record<string, string | number>;

export function track(name: string, params: Params = {}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', name, params);
}

/**
 * The live search sends one event per finished search term, not one per
 * keystroke: the last term stands once the visitor has paused. Defined by
 * src/components/SiteEvents.astro.
 */
export function trackSearch(term: string, results: number): void {
  if (typeof window === 'undefined') return;
  const send = (window as unknown as { fbcmTrackSearch?: (t: string, n: number) => void })
    .fbcmTrackSearch;
  if (typeof send === 'function') send(term, results);
}
