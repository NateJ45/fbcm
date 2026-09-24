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

  /** The year the church was founded: a fact, not a computation ("Founded in
   *  1859", the church's own History page). The footer's bottom line reads
   *  it. apply-brand never touches this. */
  founded: 1859,

  /** Short display name alias — same as name, kept for any consumer that
   *  accessed the old `site.studio` property. */
  studio: _name,

  /** localStorage key prefix. Hand-set to a short `fbcm` prefix rather than
   *  slugifying the full church name (which would produce the unwieldy
   *  "first-baptist-church-muncie"). apply-brand never touches this. */
  storageKeyPrefix: _storageKeyPrefix,

  /** localStorage key for theme preference. apply-brand never touches this.
   *  Unused while `theme` is 'light': nothing reads or writes it. */
  themeStorageKey: _storageKeyPrefix + '-theme',

  /** FBCM-specific (2026-09-24): the site renders LIGHT ONLY. The theme init
   *  script in BaseLayout reads this and, while it says 'light', never looks
   *  at localStorage or prefers-color-scheme and never adds `.dark`. The dark
   *  palette (`.dark` in globals.css) and ThemeToggle.tsx are kept dormant:
   *  bringing dark mode back is this value set to 'system', the toggle put
   *  back in the header, footer and menu, and the dark test runs restored
   *  (see CLAUDE.md rule 3). apply-brand never touches this. */
  theme: 'light' as 'light' | 'system',

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

  /** The building's map point, for the Church node's `geo` in the JSON-LD
   *  (src/lib/church-schema.ts). Not in Site settings because it is not an
   *  editor's fact: it is where the building stands. Source: OpenStreetMap
   *  way 399259467 ("First Baptist Church", amenity=place_of_worship), the
   *  centre of its footprint, read 2026-09-24. The same way carries the
   *  building's Wikidata record, which the Church node lists in `sameAs`. */
  geo: { latitude: 40.19167, longitude: -85.38405 },
  wikidata: 'https://www.wikidata.org/wiki/Q5452411',

  /** The church's Google Business Profile: the share link of its place on
   *  Google Maps (https://maps.app.goo.gl/... or https://www.google.com/maps?cid=...).
   *  EMPTY ON PURPOSE until the church claims the profile (docs/PENDING.md).
   *  When set, the Church node lists it in `sameAs` and uses it for `hasMap`
   *  (src/lib/church-schema.ts). Code, not Site settings, because it is a
   *  one-time fact about the building's listing that no editor needs to
   *  change; Site settings has no field for it, and adding one is a schema
   *  change for a value set once. apply-brand never touches this. */
  googleBusinessProfile: '',

  // Public repo URL (used in footer credit if shown)
  repo: '',
};

export type Site = typeof site;
