// Foundation, edit with care
// JSON-LD schema builders. Each function returns a JSON string ready to drop
// into a <script type="application/ld+json"> tag via BaseLayout's `schemas` prop.
//
// LocalBusiness goes on every page (BaseLayout). Per-page schemas (Service,
// FAQPage, BreadcrumbList, CreativeWork) get added by the specific page that
// needs them. Test every schema against Google Rich Results before launch:
// https://search.google.com/test/rich-results

import { site } from '@/data/site';
import {
  breadcrumbNode,
  churchNode,
  ldJson,
  ogCardPath,
  SERVICE_PAGE_SLUG,
  sundayWorshipNode,
  type ChurchSettings,
  type SiteFacts,
} from './church-schema.ts';
import { blogPostingNode, type PostForSchema } from './post-schema.ts'; // scaffold: journal

// ---------- Types (loose — Sanity provides the actual document shapes) ----

interface SocialLink {
  platform?: string;
  url?: string;
  label?: string;
}

interface SiteSettings extends Omit<ChurchSettings, 'socialLinks'> {
  /** New flexible social links array (U8). When present, merged with legacy fields in sameAs. */
  socialLinks?: SocialLink[] | null;
  /** Studio city name — set in Sanity businessInfo or update via apply-brand */
  city?: string;
  /** Studio region/state abbreviation */
  state?: string;
  /** Studio latitude from businessInfo */
  geoLat?: number;
  /** Studio longitude from businessInfo */
  geoLng?: number;
}

interface Service {
  name?: string;
  slug?: { current?: string };
  shortDescription?: string;
  price?: string;
}

interface Breadcrumb {
  name: string;
  url: string;
}

// ---------- The church (site-wide, BaseLayout injects on every page) -------
// Built by churchNode() in ./church-schema.ts, which says what the node holds
// and why it is typed ["Church", "Organization"]. The function keeps its old
// name so the starter's callers still read it.

export const SITE_FACTS: SiteFacts = {
  url: site.url,
  name: site.name,
  geo: site.geo,
  logo: `${site.url}/icon-512.png`,
  image: `${site.url}/og/home.png`,
  sameAsPlace: site.wikidata ? [site.wikidata] : [],
};

export function localBusinessSchema(settings: SiteSettings | null | undefined): string {
  return ldJson(churchNode(settings as ChurchSettings | null | undefined, SITE_FACTS));
}

// ---------- The Sunday service (the Visit page) -----------------------------

export { SERVICE_PAGE_SLUG };

export function sundayWorshipSchema(
  settings: SiteSettings | null | undefined,
  occurrence: Date | null,
): string | null {
  const pageUrl = `${site.url}/${SERVICE_PAGE_SLUG}`;
  const node = sundayWorshipNode(settings as ChurchSettings | null | undefined, SITE_FACTS, {
    pageUrl,
    occurrence,
    image: `${site.url}${ogCardPath(`/${SERVICE_PAGE_SLUG}`)}`,
  });
  return node ? ldJson(node) : null;
}

// ---------- Service list (for /services) -----------------------------------

export function serviceListSchema(services: Service[] | null | undefined): string {
  const list = (services ?? []).filter((s) => s.name);
  if (list.length === 0) return JSON.stringify({});
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list.map((s, i) => ({
      '@type': 'Service',
      position: i + 1,
      name: s.name,
      description: s.shortDescription,
      url: s.slug?.current ? `${site.url}/services#${s.slug.current}` : `${site.url}/services`,
      provider: { '@id': `${site.url}/#business` },
      ...(s.price ? { offers: { '@type': 'Offer', price: s.price, priceCurrency: 'USD' } } : {}),
    })),
  });
}

// ---------- BreadcrumbList (every internal page) --------------------------

export function breadcrumbSchema(crumbs: Breadcrumb[]): string {
  return ldJson(breadcrumbNode(crumbs));
}

// ---------- CreativeWork (for /portfolio/[slug]) --------------------------

interface Project {
  title?: string;
  slug?: { current?: string };
  briefSummary?: string;
  heroImage?: any;
  location?: string;
  year?: number;
  publishedAt?: string;
}

export function projectSchema(project: Project, heroImageUrl: string | null): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.briefSummary,
    url: project.slug?.current ? `${site.url}/portfolio/${project.slug.current}` : undefined,
    image: heroImageUrl ?? undefined,
    creator: { '@id': `${site.url}/#business` },
    locationCreated: project.location ? { '@type': 'Place', name: project.location } : undefined,
    dateCreated: project.year ? String(project.year) : undefined,
    datePublished: project.publishedAt,
  });
}

// scaffold: journal
// ---------- BlogPosting (for /post/[slug]) --------------------------------

/**
 * The post's BlogPosting (built by blogPostingNode in ./church-schema.ts). Its
 * `image` leads with the post's own share card, /og/post-<slug>.png, which
 * `npm run build` generates for every post before Astro runs
 * (scripts/generate-og-pages.mjs), then the cover photograph when there is one.
 */
export function blogPostingSchema(entry: PostForSchema, coverImageUrl: string | null): string {
  const slug = entry.slug?.current;
  const cardUrl = slug ? encodeURI(`${site.url}${ogCardPath(`/post/${slug}`)}`) : null;
  return ldJson(blogPostingNode(entry, SITE_FACTS, { cardUrl, coverUrl: coverImageUrl }));
}
// scaffold:end
