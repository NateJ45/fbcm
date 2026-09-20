// src/lib/import-post.ts
// The one place the post import's rules live: how a document id is formed, how a
// slug is carried across, and how "is this a weekly sermon preview" is DERIVED.
//
// That last one is the point. 106 of 142 posts are weekly sermon previews that go
// stale by Monday, and the site foregrounds the other 36. It would be easy to give
// an editor a "kind" dropdown; that would be a second source of truth next to the
// category, and the second one is the one that goes stale (CLAUDE.md rule 15).

import { convertBody, type ConvertedBlock, type ConvertReport } from './convert-body.ts';

export interface CapturedPost {
  slug: string;
  title: string;
  url: string;
  publishedDate: string;
  author?: string;
  categories?: string[];
  tags?: string[];
  excerpt?: string;
  bodyText?: string;
  bodyHtml?: string;
  /** The pictures inside the body. `originalUrl` is the body's `<img src>`. */
  images?: { originalUrl?: string; fullResUrl?: string; localFile?: string }[];
}

/** What bodyFromCaptureRich needs from its caller. A script supplies all three. */
export interface RichBodyOptions {
  /** A DOM parser. In Node: `(html) => new JSDOM(html).window.document`. */
  parseHtml: (html: string) => Document;
  /** Fallback lookup for a src the capture's own image list does not carry. */
  resolveImage?: (src: string) => string | undefined;
  /** Uploads an archive-relative path, returns the Sanity asset `_ref`. */
  uploadImage?: (relPath: string) => Promise<string>;
}

/** One Portable Text span inside a body block. */
export interface SanitySpan {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
}

/** One Portable Text block on `journalEntry.body`. */
export interface SanityBlock {
  _type: 'block';
  _key: string;
  style: 'normal';
  markDefs: never[];
  children: SanitySpan[];
}

/** One `journalEntry.categories` array member: a keyed reference to a journalCategory doc. */
export interface SanityCategoryReference {
  _type: 'reference';
  _key: string;
  _ref: string;
}

/** The document shape `postFromCapture` writes. Matches `journalEntry` in journalEntry.ts. */
export interface SanityPostDoc {
  _id: string;
  _type: 'journalEntry';
  title: string;
  slug: { _type: 'slug'; current: string };
  publishedAt: string;
  author?: string;
  // References, not strings: journalEntry.categories is an array of references
  // to journalCategory, each needing its own _key or Sanity rejects the write.
  categories: SanityCategoryReference[];
  tags: string[];
  excerpt?: string;
  // `journalEntry.body` is Rule.required().min(1), and the capture carries
  // 95,016 words that were simply never read. Built by bodyFromCaptureRich()
  // when the capture has `bodyHtml`, by bodyFromCapture() when it does not.
  body: ConvertedBlock[];
  // Deliberately no postKind / isSermonPreview field here. That distinction is
  // derived at render time from `categories` via isSermonPreview(), never stored.
}

/** The category Wix uses for the weekly preview. Matched case-insensitively. */
const SERMON_PREVIEW_CATEGORY = 'sermon preview';

/**
 * Sanity's own client rejects any document `_id` outside
 * `/^[a-z0-9_][a-z0-9_.-]{0,127}$/i` before the request ever reaches the network
 * (see @sanity/client's validateDocumentId) -- so `post-händel-s-...` throws
 * "is not a valid document ID" on `createOrReplace`, non-ASCII or not.
 *
 * The public URL (`doc.slug.current`, rendered at /post/<slug>) is the thing
 * that must survive byte for byte; nothing reads the internal `_id` as a URL.
 * So each disallowed character is escaped into an ASCII-only, reversible,
 * collision-safe run (`_x<hex codepoint>_`) rather than stripped or
 * lowercased away, which is what would quietly re-slugify the id.
 */
function asciiSafeIdSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, (ch) => `_x${ch.codePointAt(0)!.toString(16)}_`);
}

/**
 * Deterministic, so `createOrReplace` REPLACES on a re-run instead of creating a
 * second copy. Built from the slug (escaped for the id charset above, never
 * re-slugified), so the same captured post always maps to the same document.
 */
export function postDocId(slug: string): string {
  return `post-${asciiSafeIdSegment(slug)}`;
}

/**
 * Category names in the capture vary in case and spacing, and the same category
 * must resolve to the same document however it was typed in Wix.
 */
export function categoryDocId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `category-${slug}`;
}

/**
 * `journalCategory.slug` is Rule.required(), and the import wrote none, so all
 * five category documents opened invalid. The slug is the SAME string the
 * document id is built from, taken from the one place that derives it, so the
 * id and the public slug can never disagree.
 */
export function categorySlug(name: string): string {
  return categoryDocId(name).replace(/^category-/, '');
}

export function isSermonPreview(categories: readonly string[] = []): boolean {
  return categories.some((c) => c.trim().toLowerCase() === SERMON_PREVIEW_CATEGORY);
}

// ── HTML entities ──────────────────────────────────────────────────────────
// The capture holds the entity as it appeared in the Wix markup, so a title
// shipped to Sanity as "Advent &amp; Christmas 2024" and rendered on the live
// site exactly that way: the entity was escaped a second time on the way out.
// Decoded here, once, at the boundary, so everything downstream holds real text.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

/** "&amp;" -> "&", "&#39;" -> "'", "&#x2019;" -> "’". Unknown entities are left alone. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    }
    if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? whole;
  });
}

// ── The body ───────────────────────────────────────────────────────────────
// WHICH CONVERTER, AND WHY. There are two, and the rich one is the default.
//
// bodyFromCaptureRich() runs the capture's `bodyHtml` through
// src/lib/convert-body.ts (@portabletext/block-tools, approved 2026-09-20) and
// carries the headings, links, lists, blockquotes and inline images. It needs
// a DOM parser and an image uploader, so only a script can call it.
//
// bodyFromCapture() is the plan-1 fallback, kept because it needs NOTHING: it
// splits `bodyText` on blank lines into one `normal` block per paragraph, the
// same rule `toPT()` in scripts/lib/sanity-lib.mjs uses. A post whose capture
// has no `bodyHtml` still gets its words, and the unit tests that pin the
// mapper still have something pure to pin.
//
// Written here rather than called from sanity-lib.mjs for two reasons: that
// module exits the process at import time when no Sanity project is
// configured (so a unit test could not import it), and its `_key` generator is
// a module-level counter, which is not pure. Keys here are derived from the
// block's own index, so the same capture always produces byte-identical
// blocks and `createOrReplace` is a genuine no-op on a re-run.
const MAX_EXCERPT = 220;

/** The captured body as Portable Text: one `normal` block per paragraph. */
export function bodyFromCapture(captured: CapturedPost): SanityBlock[] {
  const source = captured.bodyText ?? '';
  return String(source)
    .split(/\n{2,}/)
    .map((s) => decodeEntities(s).trim())
    .filter(Boolean)
    .map((text, i) => ({
      _type: 'block' as const,
      _key: `b${i}`,
      style: 'normal' as const,
      markDefs: [] as never[],
      children: [{ _type: 'span' as const, _key: `b${i}s0`, text, marks: [] as string[] }],
    }));
}

/**
 * An excerpt that fits `journalEntry.excerpt`'s Rule.required().max(220).
 *
 * 33 of the 142 captured excerpts are longer than that, so the Studio opened
 * with them permanently invalid. The schema limit is right (it is also the SEO
 * description), so the DATA is trimmed, and trimmed where a reader would stop:
 * the last sentence boundary at or before the limit, else the last word
 * boundary with an ellipsis. Never mid-word.
 */
export function excerptFromCapture(captured: CapturedPost): string | undefined {
  const raw = decodeEntities(captured.excerpt ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return undefined;
  if (raw.length <= MAX_EXCERPT) return raw;

  const window = raw.slice(0, MAX_EXCERPT);
  const sentenceEnd = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
  );
  // A sentence that ends exactly at the limit has no trailing space to find.
  const flush = /[.!?]$/.test(window) ? window.length - 1 : -1;
  const cut = Math.max(sentenceEnd, flush);
  if (cut > 0) return window.slice(0, cut + 1).trim();

  // No sentence boundary: fall back to the last whole word, marked as cut. The
  // ellipsis is a character of its own, so the window it is added to is one
  // short of the limit -- and a "word" with no space in it anywhere (a pasted
  // URL) still has to be cut somewhere, so the hard slice is the last resort.
  const head = raw.slice(0, MAX_EXCERPT - 1);
  const lastSpace = head.lastIndexOf(' ');
  const words = (lastSpace > 0 ? head.slice(0, lastSpace) : head).replace(/[\s,;:]+$/, '');
  return `${words}…`;
}

/**
 * `journalEntry.coverImage.alt` is required, and the Wix capture carries no alt
 * for the cover, so the post's own title is the honest description of it.
 */
export function coverAltFromCapture(
  captured: CapturedPost & { coverImage?: { alt?: string } },
): string {
  const capturedAlt = captured.coverImage?.alt?.trim();
  return capturedAlt || decodeEntities(captured.title ?? '').trim() || 'Cover image';
}

/**
 * The capture's `bodyHtml` as real Portable Text. Falls back to the
 * paragraph-only mapper when the capture carries no HTML, so every post gets a
 * body whatever the capture holds.
 */
export async function bodyFromCaptureRich(
  captured: CapturedPost,
  options: RichBodyOptions,
): Promise<{ blocks: ConvertedBlock[]; report: ConvertReport | null }> {
  const html = (captured.bodyHtml ?? '').trim();
  if (!html) return { blocks: bodyFromCapture(captured), report: null };

  // The capture carries its OWN image list, and its `originalUrl` is the exact
  // string the body's `<img src>` holds -- so the src maps to an archive file
  // without going near the site-wide manifest's rendered/full-res variants.
  const byUrl = new Map<string, string>();
  for (const image of captured.images ?? []) {
    for (const url of [image.originalUrl, image.fullResUrl]) {
      if (url && image.localFile) byUrl.set(url, image.localFile);
    }
  }

  return convertBody(html, {
    slug: captured.slug,
    parseHtml: options.parseHtml,
    resolveImage: (src) => byUrl.get(src) ?? options.resolveImage?.(src),
    uploadImage: options.uploadImage,
    fallbackAlt: decodeEntities(captured.title ?? '').trim() || undefined,
  });
}

/**
 * `body` is passed in rather than computed here because the rich converter is
 * asynchronous (it uploads images) and this mapper is not. A caller with no
 * converter gets the paragraph-only fallback, which is what plan 1 shipped.
 */
export function postFromCapture(captured: CapturedPost, body?: ConvertedBlock[]): SanityPostDoc {
  if (!captured.publishedDate || Number.isNaN(Date.parse(captured.publishedDate))) {
    throw new Error(`publishedDate missing or unparseable for post "${captured.slug}"`);
  }
  return {
    _id: postDocId(captured.slug),
    _type: 'journalEntry',
    title: decodeEntities(captured.title ?? ''),
    slug: { _type: 'slug', current: captured.slug },
    publishedAt: captured.publishedDate,
    author: captured.author ?? undefined,
    // References, not strings: journalEntry.categories is an array of references
    // to journalCategory. Each member needs its own _key or Sanity rejects it.
    categories: (captured.categories ?? []).map((name, i) => ({
      _type: 'reference' as const,
      _key: `cat${i}`,
      _ref: categoryDocId(name),
    })),
    tags: captured.tags ?? [],
    excerpt: excerptFromCapture(captured),
    body: body ?? bodyFromCapture(captured),
    // No postKind / isSermonPreview field. Derived at render time from
    // `categories` via isSermonPreview(). See the note at the top of this file.
  };
}
