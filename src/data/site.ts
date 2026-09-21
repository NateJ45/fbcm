// Safe to edit by hand
// Static identity values that don't change between deploys.
// Content editors update their fields through Sanity instead — see studio/ and src/lib/queries.ts.
// Replace these placeholders with your project's real values before launch.

// apply-brand rewrites the two quoted strings on `name:` and `domain:` below
// (see scripts/apply-brand.mjs rewriteSiteTs — it targets the `_name` and
// `_domain` declarations plus the nine `brandColors` sub-keys and nothing
// else in this file). Everything below this comment is therefore hand-owned:
// apply-brand has no substitution pattern that reaches it.
const _name = 'First Baptist Church Muncie';
const _domain = 'fbcmuncie.org';

// FBCM-specific: `_domain` is the apex, used for email addresses
// (noreply@fbcmuncie.org) and the brand config. The production site itself
// is served from the `www` subdomain, so `url` is derived from `_domain`
// with `www.` prepended rather than copied verbatim -- this keeps canonical
// tags, the sitemap (astro.config.mjs `site:`) and this value in agreement
// even though apply-brand's astro.config.mjs rewrite writes the bare apex
// (see PENDING note: verify astro.config.mjs site: after every apply-brand run).
const _storageKeyPrefix = 'fbcm';

export const site = {
  name: _name,
  domain: _domain,
  url: `https://www.${_domain}`,
  // BCP 47 language tag for the <html lang> attribute. Change if the site is not in English.
  lang: 'en',

  /** Short display name alias — same as name, kept for any consumer that
   *  accessed the old `site.studio` property. */
  studio: _name,

  /** localStorage key prefix. Hand-set to a short `fbcm` prefix rather than
   *  slugifying the full church name (which would produce the unwieldy
   *  "first-baptist-church-muncie"). apply-brand never touches this. */
  storageKeyPrefix: _storageKeyPrefix,

  /** localStorage key for theme preference. apply-brand never touches this. */
  themeStorageKey: _storageKeyPrefix + '-theme',

  // Brand colors are also declared in src/styles/globals.css.
  // Mirrored here for any script that needs them outside CSS (OG generator, structured data, etc.).
  brandColors: {
    primary: '#292854', // Navy
    primaryDark: '#1C1B3A', // Navy Dark
    accent: '#292854', // Navy ink (headings/body) — same navy family as primary, see globals.css
    accentDark: '#1C1B3A', // Navy Dark ink (dark surfaces)
    secondary: '#B5ABA3', // Taupe
    tertiary: '#B5ABA3', // Taupe
    bg: '#F4EFE6', // Paper
    bgSoft: '#EBE4D8', // Soft Paper
    border: '#DCD5C9', // Faint dividers
  },

  // Static asset paths under public/
  // Note: the logo files are in `src/assets/` and are imported directly
  // by Header.astro / Footer.astro so Astro's <Image> component can emit
  // optimized WebP variants with content-hashed filenames. The keys below
  // stay only for the OG image + favicon, which are still served straight
  // from public/.
  assets: {
    ogDefault: '/og-default.png',
    favicon: '/favicon.svg',
  },

  // Public repo URL (used in footer credit if shown)
  repo: '',
};

export type Site = typeof site;
