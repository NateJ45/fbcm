// Safe to edit by hand
// Site settings placeholders: {time}, {address} and friends, filled in from the
// one Site settings document wherever an editor types them.
//
// WHY (CLAUDE.md rule 15). The page seeds read the service time, the street
// address, the phone and the email out of Site settings at SEED time and typed
// them into about sixty places across thirteen documents: hero facts, Sunday
// columns, timeline markers, closing subheads, the church's own sentences and
// the SEO text. Changing the service time meant finding every copy by hand, and
// the copy nobody finds is the one the site gets wrong. Now the bands hold a
// placeholder and the value lives once, in Site settings.
//
// WHERE IT RUNS. Exactly two places, the two chokepoints every read passes
// through: sanityFetch() in ./sanity.ts (the static build) and previewFetch()
// in ./cms-preview.ts (the Studio's Presentation preview). So a placeholder
// works in every text box on every page without any component knowing about
// it, and the editor sees the filled-in value in the preview while the box
// itself still shows {time}.
//
// PURE on purpose: no client, no import.meta.env, so the node unit tests can
// import it (see the note at the foot of ./sanity.ts on why that matters).
//
// Stega (preview only) appends invisible markers to the END of each string, so
// a placeholder in the middle of a stega-encoded string is still contiguous and
// still matches. The values themselves are fetched WITHOUT stega, so a filled
// in value never carries a second, foreign edit payload.

import { timeOnly } from './live-sunday.ts';
import {
  LINK_SETTINGS_FIELDS,
  fieldOf,
  linkFallback,
  linkTokenOf,
  linkValues,
  type LinkSettings,
  type LinkToken,
} from './church-links.ts';

/** The Site settings fields the placeholders read (the link tokens' fields included). */
export interface PlaceholderSettings extends LinkSettings {
  serviceTime?: string | null;
  serviceLength?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

/** GROQ for exactly those fields. Published perspective at build time. */
export const PLACEHOLDER_SETTINGS_QUERY = `*[_id == "siteSettings"][0]{serviceTime, serviceLength, address, phone, email, ${LINK_SETTINGS_FIELDS}}`;

/**
 * Every placeholder an editor can type, with what it becomes. The order is the
 * order the Studio guide lists them in. Names are lower case and spelled the
 * way a person would say them; matching ignores case.
 */
export const PLACEHOLDERS = [
  { token: '{service time}', means: 'the whole service time, like "Sundays at 10:45 am"' },
  { token: '{time}', means: 'just the time, like "10:45 am"' },
  { token: '{service length}', means: 'how long the service runs, like "About an hour"' },
  { token: '{address}', means: 'the street address, like "309 East Adams Street"' },
  { token: '{short address}', means: 'the street address without "Street", like "309 East Adams"' },
  { token: '{city}', means: 'the town line of the address, like "Muncie, IN 47305"' },
  { token: '{phone}', means: 'the public phone number' },
  { token: '{email}', means: 'the public email address' },
] as const;

export type PlaceholderToken = (typeof PLACEHOLDERS)[number]['token'];

/**
 * Every value a fill can use: the text placeholders above, and the link
 * tokens ({giving}, {sermons}...) from src/lib/church-links.ts. A link token
 * is filled only when it is a link target's whole value; see walk() below.
 */
export type PlaceholderValues = Record<PlaceholderToken, string> & Record<LinkToken, string>;

const clean = (s: string | null | undefined): string => (s ?? '').trim();

/** Work out each placeholder's value from the settings document. */
export function placeholderValues(
  settings: PlaceholderSettings | null | undefined,
): PlaceholderValues {
  const serviceTime = clean(settings?.serviceTime);
  const lines = clean(settings?.address)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const street = lines[0] ?? '';
  return {
    '{service time}': serviceTime,
    '{time}': serviceTime ? timeOnly(serviceTime) : '',
    '{service length}': clean(settings?.serviceLength),
    '{address}': street,
    '{short address}': street.replace(/\s+(Street|St\.?)$/i, ''),
    '{city}': lines.slice(1).join(', '),
    '{phone}': clean(settings?.phone),
    '{email}': clean(settings?.email),
    ...linkValues(settings),
  };
}

const TOKEN_RE = new RegExp(
  PLACEHOLDERS.map((p) => p.token.replace(/[{}]/g, (c) => `\\${c}`)).join('|'),
  'gi',
);

/** Fill the placeholders in one string. Unknown {words} are left as typed. */
export function fillString(text: string, values: Record<PlaceholderToken, string>): string {
  if (!text.includes('{')) return text;
  return text.replace(TOKEN_RE, (match) => {
    const value = values[match.toLowerCase() as PlaceholderToken];
    // A placeholder whose setting is blank stays visible rather than vanishing
    // mid-sentence: an editor can see and fix "{phone}"; a silently missing
    // phone number reads as a typo nobody traces back to Site settings.
    return value ? value : match;
  });
}

/**
 * Fill placeholders everywhere in a fetched result. Returns a new value; the
 * input is not mutated. System keys (`_type`, `_key`, `_ref`, `_id`...) are
 * never touched. Text placeholders are never filled inside a link target
 * (`href`), which the Studio validates as a URL, where "mailto:{email}" would
 * be an error.
 *
 * LINK TOKENS ({giving}, {sermons}...) are the other way round: they are
 * filled only when a string's WHOLE value is the token, which in practice is
 * a link target (a Portable Text link's `href`, a button's `externalUrl`, a
 * document's `url`). A token whose Site settings field is blank becomes its
 * own fallback (church-links.ts's `linkFallback()`: LINK_FALLBACK for most
 * tokens, but /give for {giving}, the wedding office's own address for the
 * two wedding forms, and '' — hidden, not a dead link — for {wednesday} and
 * {contact-form}), never a broken link, and `onUnfilled` hears about it (the
 * build logs a warning, once per token).
 */
export function fillPlaceholders<T>(
  value: T,
  values: PlaceholderValues,
  onUnfilled: (token: LinkToken) => void = warnUnfilled,
): T {
  return walk(value, values, false, onUnfilled) as T;
}

const warned = new Set<string>();
function warnUnfilled(token: LinkToken): void {
  if (warned.has(token)) return;
  warned.add(token);
  const fallback = linkFallback(token);
  const goesTo = fallback ? `Links to it go to ${fallback}` : 'Links to it are hidden';
  console.warn(
    `[placeholders] ${token} has no address: Site settings > Church systems > ${fieldOf(token)} is empty. ${goesTo} until it is filled.`,
  );
}

function walk(
  value: unknown,
  values: PlaceholderValues,
  inHref: boolean,
  onUnfilled: (token: LinkToken) => void,
): unknown {
  if (typeof value === 'string') {
    const token = linkTokenOf(value);
    if (token) {
      if (values[token]) return values[token];
      onUnfilled(token);
      return linkFallback(token);
    }
    return inHref ? value : fillString(value, values);
  }
  if (Array.isArray(value)) return value.map((v) => walk(v, values, inHref, onUnfilled));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = k.startsWith('_') ? v : walk(v, values, k === 'href', onUnfilled);
    }
    return out;
  }
  return value;
}

/** True when a fetched result contains at least one placeholder or link token. */
export function hasPlaceholder(value: unknown): boolean {
  if (typeof value === 'string') {
    if (!value.includes('{')) return false;
    if (linkTokenOf(value)) return true;
    TOKEN_RE.lastIndex = 0;
    return TOKEN_RE.test(value);
  }
  if (Array.isArray(value)) return value.some(hasPlaceholder);
  if (value && typeof value === 'object') return Object.values(value).some(hasPlaceholder);
  return false;
}

// ── The other direction: typed copies back to placeholders ──────────────────
// Used by scripts/settings-placeholders.mjs (the one-time, backup-first
// migration, which doubles as the audit) and by the unit tests. Deliberately
// narrow, because the church's own prose mentions numbers that only LOOK like
// settings: "(Mark 10:45)" is a verse, and "(10:15-10:45 a.m.)" is the
// fellowship hour, a range that must stay as the church wrote it. So a time is
// only matched with its am/a.m. and never as the end of a range, and the
// service length only as a whole field (a fact value), never inside a sentence.

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Replace typed copies of the settings values in one string with placeholders. */
export function typedCopiesToPlaceholders(text: string, settings: PlaceholderSettings): string {
  const v = placeholderValues(settings);
  let out = text;
  const swap = (literal: string, token: PlaceholderToken, re?: RegExp) => {
    if (!literal) return;
    // The lookahead stops "309 East Adams Street" matching inside "...Streetcar".
    out = out.replace(re ?? new RegExp(`${escapeRe(literal)}(?![\\w])`, 'g'), token);
  };
  // Longest first, so "Sundays at 10:45 am" is not half-eaten by {time}.
  swap(v['{service time}'], '{service time}');
  const time = /^(\d{1,2}:\d{2})\s*(am|pm)$/i.exec(v['{time}']);
  if (time) {
    const [, clock, half] = time;
    // "am" or "a.m." in any case. Never "am." : a sentence's full stop is not
    // part of the time, and eating it would drop the stop when filled back in.
    const suffix = `(?:${half}|${half[0]}\\.${half[1]}\\.)`;
    swap(
      v['{time}'],
      '{time}',
      new RegExp(`(?<![-\\u2013\\d:])\\b${escapeRe(clock)}\\s?${suffix}(?![\\w])`, 'gi'),
    );
  }
  swap(v['{address}'], '{address}');
  swap(v['{city}'], '{city}');
  swap(v['{phone}'], '{phone}');
  swap(v['{email}'], '{email}');
  // Whole-field only.
  if (v['{short address}'] && out.trim() === v['{short address}']) out = '{short address}';
  if (v['{service length}'] && out.trim() === v['{service length}']) out = '{service length}';
  return out;
}

/** Every string in a document that {@link typedCopiesToPlaceholders} would change. */
export function findTypedCopies(
  doc: unknown,
  settings: PlaceholderSettings,
  path = '',
): { path: string; before: string; after: string }[] {
  if (typeof doc === 'string') {
    const after = typedCopiesToPlaceholders(doc, settings);
    return after === doc ? [] : [{ path, before: doc, after }];
  }
  if (Array.isArray(doc)) {
    return doc.flatMap((item, i) => {
      const key =
        item && typeof item === 'object' && '_key' in item ? `[_key=="${item._key}"]` : `[${i}]`;
      return findTypedCopies(item, settings, `${path}${key}`);
    });
  }
  if (doc && typeof doc === 'object') {
    return Object.entries(doc).flatMap(([k, v]) =>
      k.startsWith('_') || k === 'href'
        ? []
        : findTypedCopies(v, settings, path ? `${path}.${k}` : k),
    );
  }
  return [];
}

/**
 * Convert every typed copy in a whole document (system keys and link targets
 * left alone). scripts/seed-pages.mjs runs each page through this before it
 * compares or writes, so re-seeding can never type the copies back in.
 */
export function placeholdersForTypedCopies<T>(doc: T, settings: PlaceholderSettings): T {
  const convert = (value: unknown): unknown => {
    if (typeof value === 'string') return typedCopiesToPlaceholders(value, settings);
    if (Array.isArray(value)) return value.map(convert);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          k.startsWith('_') || k === 'href' ? v : convert(v),
        ]),
      );
    }
    return value;
  };
  return convert(doc) as T;
}
