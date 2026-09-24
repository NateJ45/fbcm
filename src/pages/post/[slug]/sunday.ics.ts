// scaffold-file: journal
// Safe to edit by hand
// /post/<slug>/sunday.ics: the calendar file behind a sermon preview's "Add to
// calendar" (2026-09-24, feat/scripture-text). One Sunday's worship at the
// service time, at the church, built at build time from the post and Site
// settings (src/lib/worship-ics.ts; nothing is typed for the calendar).
//
// A STATIC FILE, NOT A data: URL. A real URL served as text/calendar is what
// makes iOS Safari offer "Add to Calendar" directly; iOS ignores `download` on
// a data: URL and shows the raw text instead. The file is also cacheable,
// costs the post page nothing (a data: URL of an .ics with its VTIMEZONE is
// about 1.6 KB of percent-encoded text in every preview's HTML), and can be
// linked to or subscribed to on its own. Only previews get one; a preview whose
// Site settings service time cannot be read gets none, and its page shows no
// link (the page checks the same function).
import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllJournalEntries, getSiteSettings } from '@/lib/queries';
import { getSectionVisibility } from '@/lib/sectionVisibility';
import { entryIsSermonPreview, clean, type BlogEntry } from '@/lib/blog-derive';
import { sundayOf, readingOf } from '@/lib/sermon-derive';
import { openingText } from '@/lib/post-body';
import { worshipIcs } from '@/lib/worship-ics';
import { sanityFetch } from '@/lib/sanity';
import { site } from '@/data/site';

export const getStaticPaths = (async () => {
  const [entries, settings, heads] = await Promise.all([
    getAllJournalEntries(),
    getSiteSettings(),
    sanityFetch<{ _id: string; head?: unknown[] }>(
      `*[_type == "journalEntry"]{ _id, "head": body[_type == "block"][0...12]{ _type, style, listItem, children[]{ _type, text } } }`,
      {},
      [],
    ),
  ]);
  if (!getSectionVisibility(settings?.sectionVisibility).journal) return [];
  const headById = new Map<string, unknown[]>();
  for (const h of heads ?? []) if (h?._id) headById.set(h._id, h.head ?? []);

  const out: { params: { slug: string }; props: { ics: string } }[] = [];
  for (const e of (entries ?? []) as (BlogEntry & { body?: unknown })[]) {
    const slug = clean(e.slug?.current).trim();
    const sunday = sundayOf(e.publishedAt);
    if (!slug || !sunday || !entryIsSermonPreview(e)) continue;
    const ics = worshipIcs({
      settings,
      sunday,
      stamp: new Date(e.publishedAt ?? sunday),
      siteName: site.name,
      domain: site.domain,
      postTitle: clean(e.title),
      postUrl: decodeURI(new URL(`/post/${slug}`, site.url).toString()),
      reading: readingOf(openingText(headById.get(e._id ?? '') ?? [])),
    });
    if (ics) out.push({ params: { slug }, props: { ics } });
  }
  return out;
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response((props as { ics: string }).ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
