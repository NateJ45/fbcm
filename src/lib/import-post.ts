// src/lib/import-post.ts
// The one place the post import's rules live: how a document id is formed, how a
// slug is carried across, and how "is this a weekly sermon preview" is DERIVED.
//
// That last one is the point. 106 of 142 posts are weekly sermon previews that go
// stale by Monday, and the site foregrounds the other 36. It would be easy to give
// an editor a "kind" dropdown; that would be a second source of truth next to the
// category, and the second one is the one that goes stale (CLAUDE.md rule 15).

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

export function isSermonPreview(categories: readonly string[] = []): boolean {
  return categories.some((c) => c.trim().toLowerCase() === SERMON_PREVIEW_CATEGORY);
}

export function postFromCapture(captured: CapturedPost): SanityPostDoc {
  if (!captured.publishedDate || Number.isNaN(Date.parse(captured.publishedDate))) {
    throw new Error(`publishedDate missing or unparseable for post "${captured.slug}"`);
  }
  return {
    _id: postDocId(captured.slug),
    _type: 'journalEntry',
    title: captured.title,
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
    excerpt: captured.excerpt ?? undefined,
    // No postKind / isSermonPreview field. Derived at render time from
    // `categories` via isSermonPreview(). See the note at the top of this file.
  };
}
