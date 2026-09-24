// Safe to edit by hand
// The church's social links, as ONE derived list (2026-09-24, feat/social-links).
//
// Three surfaces draw the church's accounts elsewhere: the footer's icon row
// (every page), the mobile menu's foot, and the "Follow along" group on the
// Contact page's office door (Hours.astro). They all render socialLinksOf(),
// so they cannot disagree about which accounts exist or what order they are in.
//
// WHERE THE LIST COMES FROM (CLAUDE.md rule 15, derive, don't store).
//   1. Site settings' `socialLinks` array (Facebook and Instagram today).
//   2. When that array is empty, the legacy `socialFacebook` /
//      `socialInstagram` fields, which older datasets still carry (the footer's
//      fallback before this module existed).
//   3. YouTube, DERIVED from `youtubeUrl`, the field that already drives
//      "Watch live" and the Church node's `sameAs`. Nobody types the channel a
//      second time into the social array to get an icon; if an editor has
//      (a stored entry pointing at YouTube), the stored one wins and the
//      derived one is not added.
// Then de-duplicated by address, ignoring the scheme, `www.`, a trailing slash
// and case, and ordered Facebook, Instagram, YouTube, then anything else in
// the order it was stored.
//
// STEGA. In /preview/** every string Sanity returns can carry an invisible
// payload (CLAUDE.md, the preview rules). `platform` is on NON_STEGA_FIELDS
// (src/lib/non-stega-fields.ts), but every value is still cleaned here before
// it is compared, keyed or put in an href, because this module also reads
// free-text fields (the URL, the "Other" label) that do carry the payload.
//
// PURE: no Astro, no import.meta.env, so `node --test` can reach it.

import { splitStega } from './preview-stega.ts';
import { urlKey } from './church-schema.ts';

/** One stored entry of Site settings' socialLinks array. */
export interface StoredSocialLink {
  platform?: string | null;
  url?: string | null;
  label?: string | null;
}

/** The Site settings fields this module reads. */
export interface SocialSettings {
  socialLinks?: Array<StoredSocialLink | null> | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  youtubeUrl?: string | null;
}

/** One link, ready to draw. Every string is stega-clean. */
export interface SocialLink {
  /** The schema's platform value ('Facebook', 'Instagram', 'YouTube', ...,
   *  'Other'). Picks the icon. */
  platform: string;
  /** The account's address, http(s) only. */
  url: string;
  /** The name a visitor reads: "Facebook", or an "Other" entry's label. */
  name: string;
}

const clean = (s: unknown): string =>
  typeof s === 'string' ? splitStega(s).cleaned.replace(/\s+/g, ' ').trim() : '';

const httpUrl = (s: unknown): string => {
  const u = clean(s);
  return /^https?:\/\//i.test(u) ? u : '';
};

/**
 * An address's identity for de-duplication: no scheme, no `www.`, no trailing
 * slash, and the whole thing in lower case (a social profile's path is not
 * case-sensitive, so "FbcmuncieOrg" and "fbcmuncieorg" are one channel).
 * Built on church-schema's urlKey, which keeps the path's case because
 * `sameAs` lists any record, not only social profiles; that is why sameAsOf
 * keeps its own and this adds the lower-casing on top.
 */
export const socialUrlKey = (u: string): string => urlKey(clean(u)).toLowerCase();

/** The platforms the site knows by address, for an entry with no platform. */
const HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, 'Facebook'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, 'YouTube'],
  [/(^|\.)linkedin\.com$/, 'LinkedIn'],
  [/(^|\.)pinterest\.com$/, 'Pinterest'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)x\.com$|(^|\.)twitter\.com$/, 'X'],
];

const hostOf = (u: string): string => {
  const m = /^https?:\/\/([^/?#]+)/i.exec(u);
  return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
};

/** The platform an address belongs to, or '' when it is none the site knows. */
export function platformOfUrl(u: string): string {
  const host = hostOf(clean(u));
  for (const [re, name] of HOSTS) if (re.test(host)) return name;
  return '';
}

/** Display order: these first, in this order, then everything else as stored. */
const ORDER = ['Facebook', 'Instagram', 'YouTube'];
const rank = (platform: string): number => {
  const i = ORDER.indexOf(platform);
  return i === -1 ? ORDER.length : i;
};

function toLink(entry: StoredSocialLink | null | undefined): SocialLink | null {
  const url = httpUrl(entry?.url);
  if (!url) return null;
  const stored = clean(entry?.platform);
  // A stored platform is the editor's pick; an unset one is read off the
  // address, so an entry typed without a platform still gets its icon.
  const platform = stored && stored !== 'Other' ? stored : platformOfUrl(url) || stored || 'Other';
  const label = clean(entry?.label);
  const name = platform === 'Other' ? label || hostOf(url) : platform;
  return { platform, url, name };
}

/**
 * The ordered, de-duplicated list of the church's accounts elsewhere. See the
 * header of this file for where each entry comes from.
 */
export function socialLinksOf(s: SocialSettings | null | undefined): SocialLink[] {
  const stored = (s?.socialLinks ?? []).map(toLink).filter((l): l is SocialLink => l !== null);
  const base: SocialLink[] =
    stored.length > 0
      ? stored
      : [
          toLink({ platform: 'Facebook', url: s?.socialFacebook }),
          toLink({ platform: 'Instagram', url: s?.socialInstagram }),
        ].filter((l): l is SocialLink => l !== null);

  const youtube = toLink({ platform: 'YouTube', url: s?.youtubeUrl });
  const hasYouTube = base.some((l) => l.platform === 'YouTube');
  const all = youtube && !hasYouTube ? [...base, youtube] : base;

  const seen = new Set<string>();
  const unique = all.filter((l) => {
    const k = socialUrlKey(l.url);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Array.prototype.sort is stable, so "anything else" keeps its stored order.
  return unique
    .map((l, i) => ({ l, i }))
    .sort((a, b) => rank(a.l.platform) - rank(b.l.platform) || a.i - b.i)
    .map(({ l }) => l);
}

/**
 * The accessible name of an icon-only link: "First Baptist Church Muncie on
 * Facebook". The church's name is cleaned, since it goes into an attribute.
 */
export function socialLinkLabel(link: SocialLink, churchName: string): string {
  const who = clean(churchName);
  return who ? `${who} on ${link.name}` : link.name;
}
