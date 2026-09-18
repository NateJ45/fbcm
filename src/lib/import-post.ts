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
 * Deterministic, so `createOrReplace` REPLACES on a re-run instead of creating a
 * second copy. The slug is used raw: `händel-s-...` is a real live URL and
 * re-slugifying it would quietly break that post and only that post.
 */
export function postDocId(slug: string): string {
  return `post-${slug}`;
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
