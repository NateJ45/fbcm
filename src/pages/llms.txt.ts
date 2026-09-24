// Safe to edit by hand
// /llms.txt, generated at build time (2026-09-24, the local search pass). It
// replaces the hand-written public/llms.txt, which had the service time and the
// address typed into it. What the file says, and why it exists, is in
// src/lib/llms-text.ts; this route only gathers the data, all of it through
// sanityFetch, so the Site settings placeholders ({time}, {address}...) in the
// page descriptions arrive filled.

import type { APIRoute } from 'astro';
import { site } from '@/data/site';
import { sanityFetch } from '@/lib/sanity';
import { getSiteSettings } from '@/lib/queries';
import { llmsText, type LlmsPage } from '@/lib/llms-text';
import { SERVICE_PAGE_SLUG } from '@/lib/church-schema';
import { faqEntries, type SectionIn } from '@/lib/faq-schema'; // scaffold: church

interface PageRow {
  title?: string | null;
  slug?: string | null;
  seoDescription?: string | null;
}
interface NavRow {
  href?: string | null;
  links?: Array<{ href?: string | null } | null> | null;
}

const PAGES_QUERY = `{
  "home": *[_type == "homePage"][0].seoDescription,
  "journal": *[_type == "journalPage"][0].seoDescription,
  "privacy": *[_type == "privacyPage"][0].seoDescription,
  "pages": *[_type == "page" && defined(slug.current) && archived != true && hideFromSearch != true]{
    title, "slug": slug.current, seoDescription
  },
  "visitFaq": *[_type == "page" && slug.current == $visit][0].pageBuilder[_type == "faqSection"]{ _type, items }
}`;

export const GET: APIRoute = async () => {
  const [settings, data] = await Promise.all([
    getSiteSettings(),
    sanityFetch<{
      home?: string | null;
      journal?: string | null;
      privacy?: string | null;
      pages?: PageRow[] | null;
      visitFaq?: unknown[] | null;
    } | null>(PAGES_QUERY, { visit: SERVICE_PAGE_SLUG }, null),
  ]);
  const s = (settings ?? {}) as Record<string, unknown>;

  // List the pages in the order the site's own menus do (header, then the
  // footer's columns), then any page the menus leave out, alphabetically.
  const menuOrder: string[] = [];
  const walk = (rows: unknown) => {
    for (const r of (Array.isArray(rows) ? rows : []) as NavRow[]) {
      if (r?.href) menuOrder.push(r.href);
      for (const l of r?.links ?? []) if (l?.href) menuOrder.push(l.href);
    }
  };
  walk(s.navItems);
  for (const col of (Array.isArray(s.footerColumns) ? s.footerColumns : []) as NavRow[])
    walk(col?.links);
  const rank = (path: string) => {
    const i = menuOrder.indexOf(path);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  const custom: LlmsPage[] = (data?.pages ?? [])
    .filter((p) => p?.slug && p?.title)
    .map((p) => ({ path: `/${p.slug}`, title: String(p.title), description: p.seoDescription }))
    .sort((a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path));

  const pages: LlmsPage[] = [
    { path: '/', title: 'Home', description: data?.home },
    ...custom,
    { path: '/blog', title: 'Blog', description: data?.journal }, // scaffold: journal
    { path: '/privacy', title: 'Privacy policy', description: data?.privacy },
  ];

  let whatToExpect: Array<{ question: string; answer: string }> = [];
  whatToExpect = faqEntries((data?.visitFaq ?? []) as SectionIn[], site.url); // scaffold: church

  let journal = false;
  journal = true; // scaffold: journal

  const body = llmsText({
    siteUrl: site.url,
    name: site.name,
    settings: s,
    pages,
    whatToExpect,
    visitPath: custom.some((p) => p.path === `/${SERVICE_PAGE_SLUG}`)
      ? `/${SERVICE_PAGE_SLUG}`
      : undefined,
    fullPath: '/llms-full.txt',
    journal,
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
