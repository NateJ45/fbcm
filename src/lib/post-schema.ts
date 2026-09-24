// Foundation, edit with care
// scaffold-file: journal
// A post's BlogPosting (JSON-LD). Split from ./church-schema.ts so removing the
// journal capability (npm run scaffold -- --remove journal) takes it with the
// rest of the blog: it reads blog-derive, post-body and sermon-derive, which
// are the journal's own files. See church-schema.ts for what every page says.

import { entryIsSermonPreview, type BlogEntry } from './blog-derive.ts';
import { openingText } from './post-body.ts';
import { sundayOf, isoDay, readingOf } from './sermon-derive.ts';
import { churchId, clean, compact, httpUrl, type Json, type SiteFacts } from './church-schema.ts';

export interface PostForSchema {
  title?: string | null;
  slug?: { current?: string | null } | null;
  excerpt?: string | null;
  seoDescription?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  _updatedAt?: string | null;
  body?: unknown;
  categories?: Array<{
    title?: string | null;
    slug?: { current?: string | null } | null;
  } | null> | null;
  tags?: string[] | null;
}

export function blogPostingNode(
  entry: PostForSchema,
  site: SiteFacts,
  opts: { cardUrl?: string | null; coverUrl?: string | null } = {},
): Json {
  const slug = clean(entry.slug?.current);
  // Percent-encoded, as the canonical link is (a slug may carry an accent).
  const url = encodeURI(slug ? `${site.url}/post/${slug}` : `${site.url}/blog`);
  const categories = (entry.categories ?? []).map((c) => clean(c?.title)).filter(Boolean);
  const preview = entryIsSermonPreview(entry as unknown as BlogEntry);
  const opening = openingText(Array.isArray(entry.body) ? entry.body : []);
  const reading = preview ? readingOf(opening) : '';
  const sunday = preview ? sundayOf(entry.publishedAt ?? null) : null;
  const author = clean(entry.author);
  // Google shows up to 110 characters of a headline.
  const title = clean(entry.title);
  const headline = title.length > 110 ? `${title.slice(0, 109).replace(/\s+\S*$/, '')}…` : title;
  const images = [opts.cardUrl, opts.coverUrl].map(httpUrl).filter(Boolean);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline,
    description: clean(entry.seoDescription) || clean(entry.excerpt),
    url,
    image: images,
    datePublished: clean(entry.publishedAt),
    dateModified: clean(entry.updatedAt) || clean(entry._updatedAt) || clean(entry.publishedAt),
    author: author ? { '@type': 'Person', name: author } : { '@id': churchId(site.url) },
    publisher: { '@id': churchId(site.url) },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isPartOf: { '@type': 'Blog', '@id': `${site.url}/blog#blog`, name: `${site.name} Blog` },
    inLanguage: 'en-US',
    articleSection: categories[0],
    keywords: [...categories, ...(entry.tags ?? []).map(clean)].filter(Boolean).join(', '),
    // A sermon preview is about one dated Sunday's worship, and cites the
    // passage that Sunday is preached from. Both are read from the post
    // (sermon-derive.ts); a preview whose reading is not found cites nothing.
    about: sunday
      ? {
          '@type': 'Event',
          name: `Sunday worship, ${isoDay(sunday)}`,
          startDate: isoDay(sunday),
          location: { '@id': churchId(site.url) },
          organizer: { '@id': churchId(site.url) },
        }
      : undefined,
    citation: reading
      ? {
          '@type': 'CreativeWork',
          name: reading,
          isPartOf: { '@type': 'Book', name: 'The Bible' },
        }
      : undefined,
  });
}
