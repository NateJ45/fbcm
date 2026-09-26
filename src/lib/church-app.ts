// Safe to edit by hand
// scaffold-file: church
// The church app (2026-09-25, `feat/church-app`): Church Trac's member app,
// which the church links from Site settings' "Church app" box (`appUrl`, the
// church's share link, https://open.churchtrac.com?code=8PG6ZJ). Pure: the
// Home band (src/components/home/ChurchAppBand.astro) and the footer's two
// buttons (src/components/church/AppButtons.astro) draw what this returns.
//
// WHAT IS DERIVED AND WHAT IS A CONSTANT (CLAUDE.md rule 15). The share link
// is the one typed value. The install code is read out of it (its `code`
// parameter), never typed a second time, so changing the link in Site settings
// changes the code the band prints. The two store listings are the same for
// every Church Trac church, so they are constants here rather than Site
// settings fields an editor could get wrong:
//
//   - App Store: "ChurchTrac Connect App" by ChurchTrac Software, Inc., free.
//     https://apps.apple.com/us/app/churchtrac-connect-app/id6737914083
//     (the address churchtrac.com/features/church-connect-app links; the
//     share link sends an iPhone to the same id, 6737914083).
//   - Google Play: "ChurchTrac Connect App", package com.churchtrac.churchconnect.
//     The share link sends an Android phone to the listing with
//     `referrer=code=<code>`, which is how the app opens already linked to the
//     church; the Google Play button carries the same referrer, derived from
//     the code, so it installs linked too. Apple has no such parameter, which
//     is why the band prints the code.
//
// Verified 2026-09-25 by requesting the share link with an iPhone and an
// Android user agent (302 to itms-apps://apps.apple.com/us/app/id6737914083
// and to the Play listing with referrer=code%3D8PG6ZJ; a desktop browser is
// sent to the church's Church Connect site, fbcmuncie.churchtrac.com/connect).
//
// STEGA. In the Studio's preview every string carries invisible markers, so
// the link is cleaned before it is parsed (CLAUDE.md, the preview rules).

import { splitStega } from './preview-stega.ts';

export const APP_STORE_URL = 'https://apps.apple.com/us/app/churchtrac-connect-app/id6737914083';
export const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.churchtrac.churchconnect';

/** Church Trac's install codes are six letters and digits ("8PG6ZJ"). */
const CODE = /^[A-Z0-9]{6}$/;

export interface ChurchApp {
  /** The church's share link, cleaned: on a phone it installs the app already linked. */
  href: string;
  /** The install code read from the link, upper case; null when the link has none. */
  code: string | null;
  appStore: string;
  /** The Play listing, with the church's code as the install referrer when there is one. */
  googlePlay: string;
}

function clean(value: string | null | undefined): string {
  return typeof value === 'string' ? splitStega(value).cleaned.trim() : '';
}

/**
 * The install code in a Church Trac share link, or null. Only a churchtrac.com
 * address counts: a code-shaped parameter on some other site is not the
 * church's app.
 */
export function installCode(appUrl: string | null | undefined): string | null {
  const raw = clean(appUrl);
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (host !== 'churchtrac.com' && !host.endsWith('.churchtrac.com')) return null;
  const code = (url.searchParams.get('code') ?? '').trim().toUpperCase();
  return CODE.test(code) ? code : null;
}

/** The Google Play listing, installing linked to the church when there is a code. */
export function googlePlayHref(code: string | null): string {
  return code
    ? `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(`code=${code}`)}`
    : GOOGLE_PLAY_URL;
}

/**
 * Everything the band and the footer draw, from Site settings' `appUrl`. null
 * when the box is empty or holds something that is not an http(s) address,
 * and then nothing is drawn: no band, no footer buttons.
 */
export function churchApp(appUrl: string | null | undefined): ChurchApp | null {
  const href = clean(appUrl);
  if (!href) return null;
  try {
    const { protocol } = new URL(href);
    if (protocol !== 'https:' && protocol !== 'http:') return null;
  } catch {
    return null;
  }
  const code = installCode(href);
  return { href, code, appStore: APP_STORE_URL, googlePlay: googlePlayHref(code) };
}
