// Safe to edit by hand
// =============================================================================
// The Studio's edges for this site: wordmark, sign-in line, wording, splash
// (PORTS.md card 120)
// =============================================================================
// The ONE site-specific file for the branded edges of the embedded Studio. NOT
// marked PORTABLE: every fork rewrites it. The machinery is PORTABLE:
// src/pages/studio/index.astro (the page and its splash), src/lib/studio-route.ts,
// src/sanity/studioWording.ts and the navbar wordmark in StudioLook.tsx.
// Detail: docs/agent/studio-kit.md ("The edges").
//
// Everything here is optional; leave a value out and the starter's neutral
// default (built from brand.config.json `name`) applies.
// =============================================================================

import type { StudioWordingInput } from './studioWording';
import type { StudioStart } from '../lib/studio-app';

export interface StudioEdgesConfig extends StudioWordingInput {
  wordmark: {
    /** Which brand.config.json `logoPaths` entry the navy top bar shows ('dark' is the reversed one). null hides it. */
    logo: 'dark' | 'light' | null;
    /**
     * Optional crop of an SVG logo, "x,y,width,height" in the file's own
     * viewBox units, so a lockup can show its words only (the square mark is
     * already the Studio's icon right beside it).
     */
    view?: string | null;
  };
  /**
   * The Studio as a phone app (card 125): what the home-screen icon is called
   * and where it opens. Optional; the default is the site's name, opening on
   * Home. 'quick-update' needs the Quick update tool (kit.config.ts
   * quickUpdate or postPhoto).
   */
  app?: {
    /** Under the icon. About 12 characters fits every phone. */
    shortName?: string;
    start?: StudioStart;
  };
}

export const studioEdges: StudioEdgesConfig = {
  // The cream-on-indigo wordmark (src/assets/logo-dark.svg), whole: the tower
  // stands between FIRST and BAPTIST, so there are no words-only to crop to.
  wordmark: { logo: 'dark', view: null },
  // The phone app (card 125): the church's own short name under the tower icon
  // (public/icon-maskable-512.png, drawn by scripts/gen-studio-art.mjs).
  app: { shortName: 'FBC Muncie', start: 'home' },
  // Under "First Baptist Church Muncie" on the sign-in card.
  loginSubtitle: 'Sign in to update the church website',
  words: {
    'login.logged-out.title': 'You have been signed out',
    'login.logged-out.generic': 'Please sign in again to keep working on the church website.',
    'login.logged-out.session-expired':
      'You were signed out after a while away. Sign in again to pick up where you left off.',
    'user-menu.action.manage-project': 'Manage who can edit',
    'user-menu.action.manage-project-aria-label': 'Manage who can edit',
    'user-menu.action.invite-members': 'Invite someone from church to edit',
    'user-menu.action.invite-members-aria-label': 'Invite someone from church to edit',
    // The church's own help is the Site Guide tool; this menu is Sanity's.
    'help-resources.title': 'Sanity help and resources',
  },
};
