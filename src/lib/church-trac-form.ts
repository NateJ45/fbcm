// Safe to edit by hand
// scaffold-file: church
// A Church Trac form on the site (2026-09-25): what a "Church Trac form"
// document's pasted embed code is allowed to become. Pure, and shared by the
// Studio (the paste box's validation, src/sanity/schemaTypes/churchTracForm.ts)
// and the page (src/components/sections/ChurchTracForm.astro), so the Studio
// accepts exactly what the page will draw.
//
// WHY NOT PASTE THE CODE ONTO THE PAGE. The page builder's generic Embed block
// renders whatever is pasted, as-is. A Church Trac form needs none of that
// power: Church Trac's embed is one <iframe> pointing at the form. So the
// staff paste the code Church Trac gives them, and the site keeps ONE thing
// from it, the iframe's address, and only when it is an https address on
// churchtrac.com. The page then draws its own iframe around that address,
// with the site's frame, title and size. Anything else in the code (a style
// attribute, a script, another site's frame) is ignored, so a mistaken paste
// can never put foreign code on the church's site.
//
// A plain address works too ("https://fbcmuncie.churchtrac.com/..."), for a
// form someone copied from the browser's address bar.
//
// The form's "open in a new tab" link is the same address (rule 15: derived,
// never typed twice), for anyone whose browser blocks the frame.

import { splitStega } from './preview-stega.ts';

/** The heights a form's frame can take, by the Studio's "Form size" choice. */
export const FORM_SIZES = {
  short: 560,
  medium: 820,
  long: 1180,
} as const;
export type FormSize = keyof typeof FORM_SIZES;

/** Zero-width characters, which the preview's markers can leave behind. */
const invisible = (s: string) => s.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');

/** The frame height for a stored size, medium when unset or unknown. */
export function formHeight(size: unknown): number {
  const key =
    typeof size === 'string' ? invisible(splitStega(size).cleaned).trim().toLowerCase() : '';
  return key in FORM_SIZES ? FORM_SIZES[key as FormSize] : FORM_SIZES.medium;
}

/** Is this host Church Trac's (churchtrac.com or a subdomain of it)? */
export const isChurchTracHost = (host: string): boolean => /(^|\.)churchtrac\.com$/i.test(host);

/**
 * The form's address from what the staff pasted: the src of an <iframe> in
 * Church Trac's embed code, or a bare address. Null unless it is an https
 * address on churchtrac.com.
 */
export function formSrc(pasted: unknown): string | null {
  if (typeof pasted !== 'string') return null;
  const text = splitStega(pasted)
    .cleaned.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim();
  if (!text) return null;
  let candidate: string | null = null;
  if (/<iframe\b/i.test(text)) {
    const m = /<iframe\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(text);
    candidate = m ? (m[1] ?? m[2] ?? m[3] ?? null) : null;
  } else if (!/[<>\s]/.test(text)) {
    candidate = text;
  }
  if (!candidate) return null;
  // Attribute values arrive HTML-escaped ("&amp;" between query parts).
  candidate = candidate.replace(/&amp;/g, '&').replace(/&#38;/g, '&').trim();
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || !isChurchTracHost(url.hostname)) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * The Studio's message for a paste that will not draw, or true when it will.
 * Written for church staff, not developers.
 */
export function checkPaste(pasted: unknown): true | string {
  if (typeof pasted !== 'string' || !pasted.trim()) {
    return 'Paste the embed code from Church Trac here.';
  }
  if (formSrc(pasted)) return true;
  const text = splitStega(pasted).cleaned;
  if (/<script\b/i.test(text) && !/<iframe\b/i.test(text)) {
    return 'This code has no form frame in it. In Church Trac, copy the embed code that starts with <iframe.';
  }
  if (/churchtrac\.com/i.test(text) && /http:\/\//i.test(text)) {
    return 'The address must start with https:// (Church Trac gives it that way).';
  }
  return 'This does not look like a Church Trac form. Paste the embed code Church Trac gives you, which starts with <iframe and points at churchtrac.com.';
}
