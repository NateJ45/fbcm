// Page-builder discriminated union.
//
// Generated types (sanity.types.ts) describe the raw *schema* shapes. The GROQ
// sectionsProjection() in queries.ts RESHAPES several fields at query time:
//   - Images: asset reference is resolved to a full asset document via `asset->`
//     and alt gets a coalesce fallback. The projected shape is wider than the
//     raw SanityImageAssetReference.
//   - CTA blocks: internalLink is resolved to `{ _type: string; slug: string }`
//     (not a union of Reference types).
//   - Rich sections inject collection fields that do not exist on the schema
//     type at all (services, points, steps).
//
// For each divergence we use a locally-scoped override type rather than `as any`,
// so callers that read these fields get a meaningful type (not `unknown`).
//
// This file is safe to edit by hand. Do NOT import from it in sanity.types.ts.

import type {
  HeroSection as _HeroSection,
  RichTextSection as _RichTextSection,
  ImageTextSection as _ImageTextSection,
  GallerySection as _GallerySection,
  QuoteSection as _QuoteSection,
  StatSection as _StatSection,
  CtaBandSection as _CtaBandSection,
  VideoSection as _VideoSection,
  SpacerSection as _SpacerSection,
  // U7 new blocks — hand-authored below since typegen has not run yet
  // FaqSection, LogoStripSection, TeamSection, EmbedSection — not imported from
  // sanity.types yet; their projected types are fully defined below.
} from './sanity.types';

// ---------------------------------------------------------------------------
// Shared projected shapes
// ---------------------------------------------------------------------------

/** Image after `asset->` + alt coalesce in the GROQ projection. */
export interface ProjectedImage {
  _type: 'image';
  asset?: {
    _id?: string;
    _ref?: string;
    _type?: string;
    url?: string;
    metadata?: {
      dimensions?: { width?: number; height?: number; aspectRatio?: number };
      lqip?: string;
      blurHash?: string;
    };
    [key: string]: unknown;
  } | null;
  alt?: string;
  hotspot?: { x?: number; y?: number; height?: number; width?: number };
  crop?: { top?: number; bottom?: number; left?: number; right?: number };
  caption?: string;
  [key: string]: unknown;
}

/**
 * The image shape every component that renders a Sanity image should accept.
 *
 * Nine components used to redeclare their own `interface SanityImageObject`
 * with `asset?: { _ref?: string; _id?: string }` and REQUIRED hotspot/crop
 * numbers. None of those matched `ProjectedImage`, which is what the GROQ
 * projection actually returns: `asset->` resolves to a whole asset document
 * (extra keys, and `null` when the reference is broken) and Sanity marks every
 * hotspot and crop number optional. `astro check` reported eight assignment
 * errors along that seam the first time it ran here, 2026-09-06. Every one was
 * the prop contract being narrower than the data, not the data being wrong.
 *
 * `_type` is optional because the code-defined fallbacks in
 * src/data/defaultSections.ts build image objects without it.
 */
export interface SanityImageObject extends Omit<ProjectedImage, '_type'> {
  // Spelled out rather than written as `Omit<ProjectedImage, '_type'>` alone:
  // ProjectedImage carries an index signature, and Omit over an index signature
  // drops every named property with it, which would leave `.alt` typed `{}`.
  _type?: string;
  asset?: ProjectedImage['asset'];
  alt?: string;
  hotspot?: { x?: number; y?: number; height?: number; width?: number };
  crop?: { top?: number; bottom?: number; left?: number; right?: number };
  caption?: string;
}

/** CTA block after `internalLink->{ _type, "slug": slug.current }` projection. */
export interface ProjectedCtaBlock {
  _type: 'ctaBlock';
  label?: string;
  linkType?: 'internal' | 'external' | 'email' | 'phone';
  /** Resolved internal link — shape is `{ _type: string; slug: string }` after deref. */
  internalLink?: { _type?: string; slug?: string } | null;
  externalUrl?: string;
  emailAddress?: string;
  phoneNumber?: string;
  openInNewTab?: boolean;
  /** Fallback href used by default sections (no Sanity project). */
  href?: string;
}

// ---------------------------------------------------------------------------
// Per-block projected types
// Each member carries _key (required for page-builder arrays in Sanity) and
// overrides only the fields that the projection reshapes.
// ---------------------------------------------------------------------------

export type ProjectedHeroSection = { _key: string } & Omit<
  _HeroSection,
  'backgroundImage' | 'primaryCta' | 'secondaryCta'
> & {
    backgroundImage?: ProjectedImage | null;
    primaryCta?: ProjectedCtaBlock | null;
    secondaryCta?: ProjectedCtaBlock | null;
  };

export type ProjectedRichTextSection = { _key: string } & _RichTextSection & {
    /** Non-schema extra field present in some defaultSections entries. */
    cta?: ProjectedCtaBlock | null;
    [key: string]: unknown;
  };

export type ProjectedImageTextSection = { _key: string } & Omit<
  _ImageTextSection,
  'image' | 'cta'
> & {
    image?: ProjectedImage | null;
    cta?: ProjectedCtaBlock | null;
    /** Non-schema alias for imageSide present in some defaultSections entries. */
    imagePosition?: 'left' | 'right';
    [key: string]: unknown;
  };

export type ProjectedGallerySection = { _key: string } & Omit<_GallerySection, 'images'> & {
    images?: ProjectedImage[];
  };

export type ProjectedQuoteSection = { _key: string } & _QuoteSection;

export type ProjectedStatSection = { _key: string } & _StatSection;

export type ProjectedCtaBandSection = { _key: string } & Omit<
  _CtaBandSection,
  'backgroundImage' | 'cta'
> & {
    backgroundImage?: ProjectedImage | null;
    cta?: ProjectedCtaBlock | null;
  };

export type ProjectedVideoSection = { _key: string } & _VideoSection;

export type ProjectedSpacerSection = { _key: string } & _SpacerSection & {
    /** Non-schema size field present in some defaultSections entries. */
    size?: string;
    [key: string]: unknown;
  };

// ---------------------------------------------------------------------------
// U7 new blocks — hand-authored projected types (typegen will regenerate
// sanity.types.ts after this unit lands; at that point the orchestrator should
// verify these align with the generated shapes and update the imports above).
// ---------------------------------------------------------------------------

/** A single logo image inside logoStripSection, after asset-> projection. */
export type ProjectedLogoStripLogo = ProjectedImage;

/**
 * logoStripSection — grayscale logo row or grid.
 * SELF_CONTAINED (no surface prop).
 */
export interface ProjectedLogoStripSection {
  _type: 'logoStripSection';
  _key: string;
  eyebrow?: string;
  headline?: string;
  logos?: ProjectedLogoStripLogo[];
  layout?: 'row' | 'grid';
}

/** A single team member inline object inside teamSection. */
export interface ProjectedTeamMember {
  _key?: string;
  name?: string;
  role?: string;
  photo?: ProjectedImage | null;
  bio?: string;
  socialLinks?: Array<{ _key?: string; label?: string; url?: string }>;
}

/**
 * teamSection — inline team member grid (no teamMember collection dependency).
 * SELF_CONTAINED (no surface prop).
 * A future modules/team module will own a full teamMember collection.
 */
export interface ProjectedTeamSection {
  _type: 'teamSection';
  _key: string;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  /** Portable Text twin of `subhead` (bold / italic only). */
  subheadRich?: unknown;
  members?: ProjectedTeamMember[];
}

/**
 * embedSection — sandboxed iframe, URL or raw code variant.
 * SELF_CONTAINED (no surface prop).
 */
export interface ProjectedEmbedSection {
  _type: 'embedSection';
  _key: string;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  embedUrl?: string;
  embedCode?: string;
  heightHint?: 'short' | 'medium' | 'tall';
}

// ---------------------------------------------------------------------------
// Church-reverse-port: dynamicListSection
// ---------------------------------------------------------------------------

/**
 * A single item inside dynamicListSection.items after the per-source GROQ
 * subquery. All sources normalise to the same shape so the component is
 * source-agnostic. `href` is null for sources that have no detail page.
 */
export interface ProjectedDynamicListItem {
  _id?: string;
  title?: string;
  meta?: string | null;
  summary?: string | null;
  href?: string | null;
  coverImage?: ProjectedImage | null;
  /** Reserved for a future source whose items carry a body/answer field. */
  answer?: any;
}

/**
 * dynamicListSection — auto-pulls the latest items from a core collection.
 * SELF_CONTAINED (no surface prop).
 * Source-specific behaviour:
 *   journal -> latest journalEntry cards (title, excerpt, publishedAt, coverImage)
 */
export interface ProjectedDynamicListSection {
  _type: 'dynamicListSection';
  _key: string;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  /** Portable Text twin of `subhead` (bold / italic only). */
  subheadRich?: unknown;
  columns?: 2 | 3;
  /**
   * Which collection to pull from. Every value this can take belongs to a
   * scaffold capability, so this is a plain string rather than a union: a fork
   * that removes the last one would otherwise be left with an empty union,
   * which does not parse. The dropdown in `richSections.ts` (dynamicListSection)
   * is what actually limits an editor's choice, and each of its options
   * carries its own scaffold marker.
   */
  source?: string;
  limit?: number;
  items?: ProjectedDynamicListItem[];
  cta?: ProjectedCtaBlock | null;
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type PageBuilderBlock =
  | ProjectedHeroSection
  | ProjectedRichTextSection
  | ProjectedImageTextSection
  | ProjectedGallerySection
  | ProjectedQuoteSection
  | ProjectedStatSection
  | ProjectedCtaBandSection
  | ProjectedVideoSection
  | ProjectedSpacerSection
  // U7 new blocks
  | ProjectedLogoStripSection
  | ProjectedTeamSection
  | ProjectedEmbedSection
  // Church-reverse-port
  | ProjectedDynamicListSection;
