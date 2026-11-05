// Safe to edit by hand
// =============================================================================
// events.ts - this site's map for the GA4 event layer (PORTS.md card 217)
// =============================================================================
// The shared half is src/lib/track.ts and src/components/analytics/SiteEvents.astro
// (PORTABLE); they read this map and nothing else. These rules are the ones the
// site's own SiteEvents.astro special-cased before card 217 (2026-10-19), moved
// here unchanged, so the events and parameters sent are the same as before.
// src/lib/events-map.test.ts pins them link by link.
//
// Rules are tried in order and the first match wins; these run before the
// built-in ones (video, directions, downloads, links to other sites). Order
// matters below: open.churchtrac.com is the web app and must come before the
// churchtrac.com portal rule.
//
// `describe` is the kind of link in plain words, for the privacy page
// (src/lib/event-kinds.ts). Event list: docs/agent/analytics.md.
// =============================================================================

import type { EventsConfig, LinkRule } from '@/lib/track';

/** A social network, matched on exactly this host (www ignored), as before. */
function social(host: string, network: string): LinkRule {
  return {
    host: new RegExp(`^${host.replace(/\./g, '\\.')}$`),
    event: 'social_click',
    params: { network },
    describe: 'links to our social media pages',
  };
}

export const eventsConfig: EventsConfig = {
  links: [
    // The Sunday calendar file, from any host.
    { path: /\.ics$/, event: 'calendar_add', describe: 'calendar files' },

    // Giving: this site's /give page, and Church Center giving pages.
    {
      own: true,
      path: /^\/give(\/|$)/,
      event: 'give_click',
      params: { destination: 'give_page' },
    },
    {
      host: 'churchcenter.com',
      path: /giving/,
      event: 'give_click',
      params: { destination: 'church_center' },
    },
    {
      host: 'churchcenter.com',
      event: 'church_center_click',
      params: { destination: 'church_center' },
      describe: 'links to Church Center',
    },

    // The Church Trac app: web, App Store, Google Play. Exact hosts, as before.
    {
      host: /^open\.churchtrac\.com$/,
      event: 'app_click',
      params: { destination: 'web' },
      describe: 'links to the church app',
    },
    {
      host: /^apps\.apple\.com$/,
      event: 'app_click',
      params: { destination: 'ios' },
      describe: 'links to the church app',
    },
    {
      host: /^play\.google\.com$/,
      event: 'app_click',
      params: { destination: 'android' },
      describe: 'links to the church app',
    },
    // The Church Trac portal (every other churchtrac.com address).
    {
      host: 'churchtrac.com',
      event: 'churchtrac_click',
      params: { destination: 'portal' },
      describe: 'links to the church records portal',
    },

    social('facebook.com', 'facebook'),
    social('instagram.com', 'instagram'),
    social('threads.net', 'threads'),
    social('linktr.ee', 'linktree'),
    social('x.com', 'x'),
    social('twitter.com', 'x'),
  ],

  // Not sent before card 217, and GA4's Enhanced Measurement already counts
  // outbound clicks and file downloads here (docs/agent/analytics.md).
  off: ['outbound_click', 'download_click'],

  // The Church Trac forms are frames inside this wrapper; journal posts are
  // typeset in .post-prose.
  formFrameSelector: '[data-church-trac-form]',
  articleSelector: '.post-prose',
};
