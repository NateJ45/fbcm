// Safe to edit by hand
// =============================================================================
// cta-href.ts - the ONE resolver from a Sanity ctaBlock to an href
// =============================================================================
// This used to live inside CtaLink.astro, and the comment at the top of that
// file said why it had to stay in exactly one place: a component that draws its
// own <a> and re-implements the mapping is the copy that forgets /post/<slug>.
//
// The art-direction pass needed the mapping OUTSIDE a CtaLink for the first
// time. The statement band's ruled row makes the WHOLE card a link (the
// prototype's `.three a`), and an <a> cannot contain another <a>, so the card
// needs the href while the arrow line is only a <span>. Moving the function
// here rather than copying it keeps the single source of truth: CtaLink imports
// it too, and its rendered markup is unchanged.
//
// Pure, no Astro and no Sanity client, so it is unit-testable and safe to
// import from anywhere.

export interface CtaBlock {
  label?: string;
  linkType?: 'internal' | 'external' | 'email' | 'phone';
  internalLink?: { _type?: string; slug?: string } | null;
  externalUrl?: string;
  emailAddress?: string;
  phoneNumber?: string;
  openInNewTab?: boolean;
}

// Map Sanity document _type to its route. Mirrors the routes in src/pages/.
// Singletons go to a fixed path; journalEntry uses {slug} for the dynamic
// /post/[slug] route.
const TYPE_TO_PATH: Record<string, string> = {
  homePage: '/',
  journalPage: '/blog', // scaffold: journal
};

/** Resolve a ctaBlock to the href it points at, or `fallbackHref`. */
export function resolveCtaHref(c: CtaBlock | null | undefined, fallbackHref: string): string {
  if (!c?.linkType) return fallbackHref;
  switch (c.linkType) {
    case 'internal': {
      const t = c.internalLink?._type;
      if (!t) return fallbackHref;
      // Slug-based types need the slug appended. Singletons use a fixed path.
      // scaffold: journal
      if (t === 'journalEntry' && c.internalLink?.slug) {
        return `/post/${c.internalLink.slug}`;
      }
      // scaffold:end
      // Custom pages (type 'page') route via /[slug].astro.
      if (t === 'page' && c.internalLink?.slug) {
        return `/${c.internalLink.slug}`;
      }
      return TYPE_TO_PATH[t] ?? fallbackHref;
    }
    case 'external':
      return c.externalUrl ?? fallbackHref;
    case 'email':
      return c.emailAddress ? `mailto:${c.emailAddress}` : fallbackHref;
    case 'phone':
      return c.phoneNumber ? `tel:${c.phoneNumber.replace(/[^\d+]/g, '')}` : fallbackHref;
    default:
      return fallbackHref;
  }
}
