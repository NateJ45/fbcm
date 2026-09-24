// Safe to edit by hand
// Church system links: one place for every link the site sends people to on
// the church's outside systems (giving, the connection card, the forms, the
// Wednesday page, sermon recordings...), and the {giving}-style link tokens
// that point at them.
//
// WHY (2026-09-24, feat/church-links). The church is leaving Planning Center
// (Church Center) for Church Trac. Before this, a Church Center address was
// typed into about a hundred link targets across pages, posts and Site
// settings, so the switch meant finding every one by hand. Now a link target
// holds a token such as {giving}, the address lives once in Site settings
// ("Church systems" tab), and switching a system is one edit there
// (CLAUDE.md rule 15: the value lives once).
//
// HOW A TOKEN IS FILLED. src/lib/settings-placeholders.ts fills link tokens at
// the same two fetch chokepoints as {time} and {address}: sanityFetch() for
// the build and previewFetch() for the Studio preview. A link token is only
// filled when it is the WHOLE value of a string (a link target), never inside
// a sentence, so "{giving}" in an href becomes the giving address and nothing
// else on the page changes.
//
// AN UNFILLED TOKEN NEVER SHIPS AS A BROKEN LINK. A token whose setting is
// blank becomes the church's own /contact page, and the build logs a warning
// naming the empty setting. The one exception is {sermons}, which falls back
// through the live stream address and the YouTube channel first (both already
// in Site settings), because "where are the sermons" has a right answer even
// when nobody has filled the field.
//
// PURE on purpose, like settings-placeholders.ts: no client, no
// import.meta.env, so node --test and the .mjs scripts can import it.

import { splitStega } from './preview-stega.ts';

/** Where a link goes when its setting is blank: the church's own contact page. */
export const LINK_FALLBACK = '/contact';

/**
 * Every link token, the Site settings field it reads, and what it is for. The
 * order is the order the Studio guide and the "Church systems" tab list them.
 */
export const CHURCH_LINKS = [
  { token: '{giving}', field: 'givingUrl', label: 'Online giving' },
  { token: '{connect}', field: 'visitorFormUrl', label: 'Connection card' },
  { token: '{contact-form}', field: 'lifeEventFormUrl', label: 'Contact form (Notify us)' },
  { token: '{sermons}', field: 'sermonsUrl', label: 'Sermon recordings' },
  { token: '{wednesday}', field: 'wednesdayUrl', label: 'Wednesday page' },
  { token: '{calendar}', field: 'calendarUrl', label: 'Events calendar' },
  { token: '{prayer}', field: 'prayerUrl', label: 'Prayer list' },
  { token: '{app}', field: 'appUrl', label: 'Church app' },
  { token: '{wedding-enquiry}', field: 'weddingEnquiryUrl', label: 'Wedding enquiry form' },
  { token: '{wedding-booking}', field: 'weddingBookingUrl', label: 'Building booking form' },
] as const;

export type LinkToken = (typeof CHURCH_LINKS)[number]['token'];
export type LinkField = (typeof CHURCH_LINKS)[number]['field'];

/** The Site settings fields the link tokens read, plus the two {sermons} falls back on. */
export type LinkSettings = Partial<
  Record<LinkField | 'livestreamUrl' | 'youtubeUrl', string | null>
>;

/** The GROQ projection for those fields (joined into the placeholder query). */
export const LINK_SETTINGS_FIELDS = [
  ...CHURCH_LINKS.map((l) => l.field),
  'livestreamUrl',
  'youtubeUrl',
].join(', ');

const TOKENS = new Set<string>(CHURCH_LINKS.map((l) => l.token));

/** The stega-clean, trimmed, lower-cased form of a string, for token matching. */
function bare(value: string): string {
  return splitStega(value).cleaned.trim().toLowerCase();
}

/** The link token a whole string is, or null. Case and surrounding space are ignored. */
export function linkTokenOf(value: unknown): LinkToken | null {
  if (typeof value !== 'string' || !value.includes('{')) return null;
  const b = bare(value);
  return TOKENS.has(b) ? (b as LinkToken) : null;
}

/** A whole string that looks like a token ("{something}") but is not a known one. */
export function isUnknownToken(value: unknown): boolean {
  if (typeof value !== 'string' || !value.includes('{')) return false;
  const b = bare(value);
  return /^\{[^{}\s]+\}$/.test(b) && !TOKENS.has(b);
}

/** An http(s) address, trimmed and stega-clean, or ''. */
function httpUrl(value: string | null | undefined): string {
  const s = splitStega(String(value ?? '')).cleaned.trim();
  return /^https?:\/\/\S+$/i.test(s) ? s : '';
}

/**
 * Each link token's address from Site settings. A blank setting gives '' here;
 * the fill turns '' into LINK_FALLBACK and warns. {sermons} falls back through
 * the live stream address and the YouTube channel before it is ever blank.
 */
export function linkValues(settings: LinkSettings | null | undefined): Record<LinkToken, string> {
  const out = {} as Record<LinkToken, string>;
  for (const { token, field } of CHURCH_LINKS) out[token] = httpUrl(settings?.[field]);
  out['{sermons}'] ||= httpUrl(settings?.livestreamUrl) || httpUrl(settings?.youtubeUrl);
  return out;
}

/** The field behind a token, for the build warning. */
export function fieldOf(token: LinkToken): LinkField {
  return CHURCH_LINKS.find((l) => l.token === token)!.field;
}

// ── Recognising today's Church Center addresses ─────────────────────────────
// Used by scripts/church-links.mjs (the backup-first migration) and by
// scripts/seed-pages.mjs, so a re-seed can never type a Church Center address
// back into a page. Deliberately exact: only the church's own subdomain, and
// only the addresses found in the dataset on 2026-09-24.

export type Classified =
  | { kind: 'token'; token: LinkToken }
  | { kind: 'past-event' }
  | { kind: 'unclassified' }
  | { kind: 'other' };

const FORM_TOKENS: Record<string, LinkToken> = {
  '159198': '{connect}',
  '159897': '{contact-form}',
  '243785': '{wedding-enquiry}',
  '520312': '{wedding-booking}',
};

/**
 * What a link target is. `token`: a Church Center address with a Site settings
 * home. `past-event`: a registration or calendar link for a single event,
 * left as written. `unclassified`: another Church Center or Planning Center
 * address nobody has mapped yet. `other`: not a Church Center address at all.
 */
export function classifyChurchLink(value: unknown): Classified {
  if (typeof value !== 'string') return { kind: 'other' };
  const raw = splitStega(value).cleaned.trim();
  if (!/planningcenteronline\.com|churchcenter\.com/i.test(raw)) return { kind: 'other' };
  let url: URL;
  try {
    // One post carries a "%0A" (an encoded line break) inside its path, left
    // by the Wix export. It is the same page, so it is read without it.
    url = new URL(raw.replace(/%0A/gi, ''));
  } catch {
    return { kind: 'unclassified' };
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, '').toLowerCase();
  if (host === 'registrations.planningcenteronline.com') return { kind: 'past-event' };
  if (host !== 'fbcmuncie.churchcenter.com') return { kind: 'unclassified' };
  if (path === '') return { kind: 'token', token: '{app}' };
  if (path === '/giving' || path.startsWith('/giving/'))
    return { kind: 'token', token: '{giving}' };
  if (path === '/calendar') return { kind: 'token', token: '{calendar}' };
  if (path === '/pages/fbcs-wednesday-weekly') return { kind: 'token', token: '{wednesday}' };
  // The sermon channel, a series on it, or one episode: all "the recordings".
  if (
    path === '/channels/4999' ||
    path.startsWith('/channels/4999/') ||
    path.startsWith('/episodes/')
  )
    return { kind: 'token', token: '{sermons}' };
  const form = /^\/people\/forms\/(\d+)$/.exec(path);
  if (form && FORM_TOKENS[form[1]]) return { kind: 'token', token: FORM_TOKENS[form[1]] };
  if (path.startsWith('/registrations/') || path.startsWith('/calendar/event/'))
    return { kind: 'past-event' };
  return { kind: 'unclassified' };
}

/** The keys a link target is stored under across the schemas. */
export const LINK_KEYS = new Set(['href', 'externalUrl', 'url', 'buttonUrl']);

export interface LinkChange {
  path: string;
  before: string;
  after: LinkToken;
}
export interface LinkFinding {
  path: string;
  url: string;
  kind: 'past-event' | 'unclassified' | 'skipped';
}

/**
 * Where a Church Center link is left alone on purpose, even though it has a
 * token. The privacy policy names each outside service and links to it, and
 * the footer's "Elsewhere" column is a labelled list of the church's systems
 * that already lives in Site settings: in both the words name Church Center,
 * so the switch there is an edit of the words and the link together (see
 * OPERATIONS.md, "Switching to Church Trac").
 */
export function skippedOnPurpose(docType: string, path: string): boolean {
  if (docType === 'privacyPage') return true;
  if (docType === 'siteSettings' && path.startsWith('footerColumns')) return true;
  return false;
}

/**
 * The tokens a page seed may write: those whose OWN Site settings box is
 * filled. Before the migration fills the new boxes, a re-seed keeps the typed
 * address rather than a token that would fall back (to /contact, or for
 * {sermons} to the YouTube streams page).
 */
export function tokensWithAddress(settings: LinkSettings | null | undefined) {
  return (token: LinkToken): boolean => Boolean(String(settings?.[fieldOf(token)] ?? '').trim());
}

/**
 * Replace every mapped Church Center link target in a document with its token.
 * Returns the new document (the input is not mutated), each change, and every
 * Church Center link it left alone with the reason. Only link-target keys are
 * touched, never prose, never system keys, and never Site settings' own
 * address fields (they are the values the tokens read).
 */
export function tokenizeChurchLinks<T>(
  doc: T,
  opts: { only?: (token: LinkToken) => boolean } = {},
): {
  doc: T;
  changes: LinkChange[];
  findings: LinkFinding[];
} {
  const changes: LinkChange[] = [];
  const findings: LinkFinding[] = [];
  const docType = String((doc as { _type?: unknown })?._type ?? '');

  const visit = (value: unknown, path: string, key: string): unknown => {
    if (typeof value === 'string') {
      if (!LINK_KEYS.has(key)) return value;
      const c = classifyChurchLink(value);
      if (c.kind === 'other') return value;
      if (c.kind === 'token') {
        if (skippedOnPurpose(docType, path)) {
          findings.push({ path, url: value, kind: 'skipped' });
          return value;
        }
        if (opts.only && !opts.only(c.token)) return value;
        changes.push({ path, before: value, after: c.token });
        return c.token;
      }
      findings.push({ path, url: value, kind: c.kind });
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item, i) => {
        const seg =
          item && typeof item === 'object' && '_key' in item
            ? `[_key=="${(item as { _key: string })._key}"]`
            : `[${i}]`;
        return visit(item, `${path}${seg}`, key);
      });
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          k.startsWith('_') ? v : visit(v, path ? `${path}.${k}` : k, k),
        ]),
      );
    }
    return value;
  };

  return { doc: visit(doc, '', '') as T, changes, findings };
}

// ── Studio validation ───────────────────────────────────────────────────────

/**
 * The Studio check on a link box: a whole-box token must be one the site
 * knows, or the editor is told the ones it does. Returns true or a message.
 * `absoluteOnly` boxes (a menu's "Web address") also refuse a relative
 * address that is not a token, which is what their old rule refused.
 */
export function checkLinkBox(value: unknown, absoluteOnly = false): true | string {
  if (typeof value !== 'string' || !value.trim()) return true;
  if (linkTokenOf(value)) return true;
  if (isUnknownToken(value)) {
    return `Unknown link placeholder. Use one of: ${CHURCH_LINKS.map((l) => l.token).join(', ')}.`;
  }
  if (absoluteOnly && !/^https?:\/\//i.test(value.trim())) {
    return 'Use a full address starting with https://, or a link placeholder like {giving}.';
  }
  return true;
}

/** A YouTube address (the channel, a video, the streams page). */
export function isYouTubeUrl(value: string | null | undefined): boolean {
  try {
    const host = new URL(String(value ?? '')).hostname.toLowerCase().replace(/^www\.|^m\./, '');
    return host === 'youtube.com' || host === 'youtu.be';
  } catch {
    return false;
  }
}
