// Safe to edit by hand
// =============================================================================
// The church's Quick update documents (PORTS.md card 111)
// =============================================================================
// The Studio's Quick update tool (src/sanity/kit/QuickUpdateTool.tsx, PORTABLE)
// publishes whatever a form's `build` returns, straight away and WITHOUT the
// Studio's validation. These are the builders for the phone jobs in
// src/sanity/kit.config.ts, kept pure so src/lib/quick-updates.test.ts can check
// each one is a complete, valid document of its type:
//
//   - a notice with a last day ("Put up a banner"), an `announcement`;
//   - a red notice for a change or cancellation that takes itself down after
//     the coming Sunday ("Cancel or change something this week");
//   - Sunday's sermon preview and a short news post (2026-10-19), each a
//     `journalEntry` (below).
// =============================================================================

// Type aliases, not interfaces: the Quick update tool wants a plain record.
export type NoticeDoc = {
  _type: 'announcement';
  internalTitle: string;
  message: string;
  style: 'info' | 'highlight' | 'urgent';
  enabled: true;
  endDate: string;
  link?: { label: string; url: string };
};

/** The announcement's message field allows 160 letters (announcement.ts). */
export const NOTICE_MAX = 160;

/**
 * The end of a local day ("2026-10-18" -> 23:59 that evening, as ISO). The
 * Studio runs in the editor's browser, so "local" is Muncie's time for the
 * church office.
 */
export function endOfDay(date: string): string {
  return new Date(`${date}T23:59:00`).toISOString();
}

/** The Studio-only name of a notice: its first words, dated. */
export function noticeName(message: string, date: string): string {
  const words = message.trim().replace(/\s+/g, ' ');
  const short = words.length > 40 ? `${words.slice(0, 40).trimEnd()}...` : words;
  return `${short} (until ${date})`;
}

/**
 * A notice that shows until the end of `lastDay`. A link is either a page on
 * this site ("/visit/") or a full https address, as the schema allows.
 */
export function buildNotice(
  v: { message: string; lastDay: string; link?: string },
  style: NoticeDoc['style'] = 'info',
): NoticeDoc {
  const doc: NoticeDoc = {
    _type: 'announcement',
    internalTitle: noticeName(v.message, v.lastDay),
    message: v.message.trim().replace(/\s+/g, ' ').slice(0, NOTICE_MAX),
    style,
    enabled: true,
    endDate: endOfDay(v.lastDay),
  };
  const link = v.link?.trim();
  if (link && /^(\/|https?:\/\/)/.test(link)) doc.link = { label: 'Find out more', url: link };
  return doc;
}

// ── Blog posts from a phone (2026-10-19, docs/agent/studio-plan.md) ─────────
// The weekly sermon preview and a short news post. Both publish straight away
// through Quick update, so each builder returns a whole, valid journalEntry
// (src/sanity/schemaTypes/journalEntry.ts): title, slug, summary, a dated body,
// a category reference. The sermon preview's category is what makes the home
// page's hero name this Sunday's sermon (src/lib/sunday-sermon.ts), its first
// paragraph carries the passage the site reads with readingOf(), and its
// author is the preacher (previewPreacher()). Nothing here guesses.

/** The ids of the two categories the phone forms file posts under (live since the import). */
export const SERMON_PREVIEW_CATEGORY_ID = 'category-sermon-preview';
export const EVENTS_CATEGORY_ID = 'category-fbcm-events';

/** journalEntry.title allows 120 letters; the excerpt 220. */
export const POST_TITLE_MAX = 120;
export const POST_SUMMARY_MAX = 220;

export type PostBlock = {
  _type: 'block';
  _key: string;
  style: 'normal';
  markDefs: { _type: 'link'; _key: string; href: string }[];
  children: { _type: 'span'; _key: string; text: string; marks: string[] }[];
};

export type QuickPostDoc = {
  _type: 'journalEntry';
  title: string;
  slug: { _type: 'slug'; current: string };
  excerpt: string;
  author?: string;
  publishedAt: string;
  categories: { _type: 'reference'; _ref: string; _key: string }[];
  body: PostBlock[];
};

const tidy = (s: string | undefined) => (s ?? '').trim().replace(/[ \t]+/g, ' ');

/** One plain paragraph block. Keys are stable per position, as the schema needs. */
export function paragraph(text: string, i: number): PostBlock {
  return {
    _type: 'block',
    _key: `p${i}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `p${i}s`, text, marks: [] }],
  };
}

/** Text typed in a box, split into paragraphs at blank lines (single line breaks join). */
export function paragraphsOf(text: string | undefined): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

/** A post's web address from its title; `taken` adds the date so it never collides. */
export function postSlug(title: string, date: string, taken = false): string {
  const base =
    tidy(title)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'post';
  return taken ? `${base}-${date}` : base;
}

/**
 * The weekly sermon preview. The passage opens the post ("Reading: John 3:16-21."),
 * then the summary, then anything more. Dated now: the website files a preview
 * under the first Sunday on or after its date (sundayOf).
 */
export function buildSermonPreview(
  v: { title: string; passage: string; preacher?: string; summary: string; more?: string },
  now: Date,
  slugTaken = false,
): QuickPostDoc {
  const title = tidy(v.title).slice(0, POST_TITLE_MAX);
  const passage = tidy(v.passage).replace(/\.$/, '');
  const summary = tidy(v.summary)
    .replace(/\s*\n\s*/g, ' ')
    .slice(0, POST_SUMMARY_MAX);
  const paras = [`Reading: ${passage}.`, summary, ...paragraphsOf(v.more)];
  const doc: QuickPostDoc = {
    _type: 'journalEntry',
    title,
    slug: { _type: 'slug', current: postSlug(title, now.toISOString().slice(0, 10), slugTaken) },
    excerpt: summary,
    publishedAt: now.toISOString(),
    categories: [{ _type: 'reference', _ref: SERMON_PREVIEW_CATEGORY_ID, _key: 'sermon-preview' }],
    body: paras.map(paragraph),
  };
  const preacher = tidy(v.preacher);
  if (preacher) doc.author = preacher;
  return doc;
}

/** A short news post (filed under FBCM Events), with an optional "Find out more" line. */
export function buildNewsPost(
  v: { title: string; summary: string; more?: string; link?: string },
  now: Date,
  slugTaken = false,
): QuickPostDoc {
  const title = tidy(v.title).slice(0, POST_TITLE_MAX);
  const summary = tidy(v.summary)
    .replace(/\s*\n\s*/g, ' ')
    .slice(0, POST_SUMMARY_MAX);
  const paras = [summary, ...paragraphsOf(v.more)];
  const body: PostBlock[] = paras.map(paragraph);
  const link = tidy(v.link);
  if (link && /^https?:\/\//.test(link)) body.push(linkParagraph(link, body.length));
  return {
    _type: 'journalEntry',
    title,
    slug: { _type: 'slug', current: postSlug(title, now.toISOString().slice(0, 10), slugTaken) },
    excerpt: summary,
    publishedAt: now.toISOString(),
    categories: [{ _type: 'reference', _ref: EVENTS_CATEGORY_ID, _key: 'events' }],
    body,
  };
}

/** "Find out more" as a real link (the post body's `link` annotation, journalEntry.ts). */
export function linkParagraph(href: string, i: number): PostBlock {
  return {
    _type: 'block',
    _key: `p${i}`,
    style: 'normal',
    markDefs: [{ _type: 'link', _key: `l${i}`, href }],
    children: [{ _type: 'span', _key: `p${i}s`, text: 'Find out more', marks: [`l${i}`] }],
  };
}
