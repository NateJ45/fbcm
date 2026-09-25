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
  // scaffold: church
  SundayTimesSection as _SundayTimesSection,
  TimelineSection as _TimelineSection,
  StaffGridSection as _StaffGridSection,
  FaqSection as _FaqSection,
  ScriptureBandSection as _ScriptureBandSection,
  HeritageBandSection as _HeritageBandSection,
  GiveBandSection as _GiveBandSection,
  HoursSection as _HoursSection,
  DocumentListSection as _DocumentListSection,
  LinkCardsSection as _LinkCardsSection,
  WatchwordSection as _WatchwordSection,
  GoalsSection as _GoalsSection,
  PledgeSection as _PledgeSection,
  LetterSection as _LetterSection,
  ChurchTracFormSection as _ChurchTracFormSection,
  // scaffold:end
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

/**
 * The shared shape every block that can be a LINK TARGET carries: the optional
 * `anchor` slug from `anchorField()` (src/sanity/schemaTypes/_anchorField.ts).
 *
 * `sectionsProjection()` projects it with the leading `...` spread, so GROQ
 * returns the whole slug object rather than a flattened string. The blocks whose
 * projected types are derived from the GENERATED schema types pick it up for
 * free after `npm run typegen`; the four hand-authored interfaces below extend
 * this instead.
 */
export interface AnchoredSection {
  anchor?: { current?: string | null } | null;
}

// ---------------------------------------------------------------------------
// Per-block projected types
// Each member carries _key (required for page-builder arrays in Sanity) and
// overrides only the fields that the projection reshapes.
// ---------------------------------------------------------------------------

export type ProjectedHeroSection = { _key: string } & Omit<
  _HeroSection,
  'backgroundImage' | 'frames' | 'primaryCta' | 'secondaryCta'
> & {
    backgroundImage?: ProjectedImage | null;
    /** Up to six photos (schema-capped). 2+ render the home hero's CSS cross-fade. */
    frames?: ProjectedImage[] | null;
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
  'image' | 'detail' | 'cta'
> & {
    image?: ProjectedImage | null;
    /** The small second photo, drawn in a lancet over a people photo's corner. */
    detail?: ProjectedImage | null;
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
  'backgroundImage' | 'cta' | 'secondaryCta'
> & {
    backgroundImage?: ProjectedImage | null;
    cta?: ProjectedCtaBlock | null;
    /** The band's optional second button (plan 2b ruling P13). */
    secondaryCta?: ProjectedCtaBlock | null;
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
export interface ProjectedLogoStripSection extends AnchoredSection {
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
  /** journal source only: the byline as typed on the entry, printed as text. */
  author?: string | null;
  /**
   * journal source only: the entry's categories, carried so the card can DERIVE
   * whether it is a weekly sermon preview (and so the list can order the
   * durable posts first). Never displayed.
   */
  categories?: Array<{
    _id?: string;
    title?: string | null;
    slug?: { current?: string | null } | null;
  }> | null;
  /**
   * journal source only: the body as plain text (GROQ `pt::text(body)`), read
   * by src/lib/past-events.ts to find the date an FBCM Events post announces,
   * so Home's rows can drop an event that is over. Never displayed.
   */
  text?: string | null;
  /** Reserved for a future source whose items carry a body/answer field. */
  answer?: any;
}

/**
 * dynamicListSection — auto-pulls the latest items from a core collection.
 * SELF_CONTAINED (no surface prop).
 * Source-specific behaviour:
 *   journal -> latest journalEntry cards (title, excerpt, publishedAt, coverImage)
 */
export interface ProjectedDynamicListSection extends AnchoredSection {
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
// scaffold: church
// The eight church blocks. Each one starts from the GENERATED schema type and
// overrides only what sectionsProjection() reshapes, which is the same
// discipline the blocks above follow. Three of them reshape nothing at all and
// are the generated type plus a _key.
// ---------------------------------------------------------------------------

/**
 * sundayTimesSection — the hymn board: the times, the notes, its own photos
 * (resolved through IMAGE_PROJECTION), its button (CTA_PROJECTION), the doors,
 * and the map from siteSettings.
 */
export type ProjectedSundayTimesSection = { _key: string } & Omit<
  _SundayTimesSection,
  'photos' | 'cta'
> & {
    photos?: ProjectedImage[] | null;
    cta?: ProjectedCtaBlock | null;
  };

/** One timeline row after `"anchor": anchor.current` flattens the slug. */
export type ProjectedTimelineRow = Omit<
  NonNullable<_TimelineSection['rows']>[number],
  'anchor' | 'image'
> & {
  /** The step's photo, drawn in a door arch (Timeline.astro). */
  image?: ProjectedImage | null;
  /** The slug's string, ready to drop straight into `id=`. */
  anchor?: string;
};

/** timelineSection — marker column plus a bordered body column per row. */
export type ProjectedTimelineSection = { _key: string } & Omit<_TimelineSection, 'rows'> & {
    rows?: ProjectedTimelineRow[];
  };

/**
 * One staff member as the staffGrid arm projects them.
 *
 * `group` and `phone` are optional: a member with no group set is filed under
 * support by groupStaff() (church-derive.ts), which is exactly the rule the
 * GROQ arm's third clause encodes, and a member with no phone just shows none.
 */
export interface ProjectedStaffMember {
  _id?: string;
  name: string;
  slug?: string;
  role?: string;
  email?: string;
  phone?: string;
  group?: string | null;
  order?: number | null;
  bio?: unknown;
  photo?: ProjectedImage | null;
}

/** staffGridSection — the section fields plus the members it pulled in. */
export type ProjectedStaffGridSection = { _key: string } & _StaffGridSection & {
    members?: ProjectedStaffMember[];
  };

/** faqSection — native <details> on the indigo band. */
export type ProjectedFaqSection = { _key: string } & _FaqSection;

/** scriptureBandSection — verse, reference and the one gold accent word. */
export type ProjectedScriptureBandSection = { _key: string } & _ScriptureBandSection;

/**
 * heritageBandSection — the brown band, or (with dates) the cream "Our
 * Building" band: the drawing, an old photograph in a door arch, and a dated
 * list that ends in the present.
 */
export type ProjectedHeritageBandSection = { _key: string } & Omit<
  _HeritageBandSection,
  'image' | 'archive' | 'cta'
> & {
    image?: ProjectedImage | null;
    archive?: ProjectedImage | null;
    cta?: ProjectedCtaBlock | null;
  };

/** giveBandSection — the giving band, gold on every page and in both themes. */
export type ProjectedGiveBandSection = { _key: string } & _GiveBandSection;

/** hoursSection — the office and pastors' hours, read live off siteSettings. */
export type ProjectedHoursSection = { _key: string } & _HoursSection;

/** One listed document after `"fileUrl": file.asset->url`. */
export type ProjectedListedDocument = Omit<
  NonNullable<_DocumentListSection['docs']>[number],
  'file'
> & {
  /** The uploaded file's CDN url, or null when the row points at `url` instead. */
  fileUrl?: string | null;
};

/** One link card after its ctaBlock is resolved by CTA_PROJECTION. */
export type ProjectedLinkCard = Omit<
  NonNullable<_LinkCardsSection['cards']>[number],
  'cta' | 'image'
> & {
  cta?: ProjectedCtaBlock | null;
  /** Optional; every card having one turns the band into arched doors. */
  image?: ProjectedImage | null;
};

/** linkCardsSection — two to four doors into the rest of the site. */
export type ProjectedLinkCardsSection = { _key: string } & Omit<_LinkCardsSection, 'cards'> & {
    cards?: ProjectedLinkCard[];
  };

/** documentListSection — the yearly downloads list. */
export type ProjectedDocumentListSection = { _key: string } & Omit<_DocumentListSection, 'docs'> & {
    docs?: ProjectedListedDocument[];
  };

/** One "People to talk to" entry after `contacts[]->` dereferences it. */
export interface ProjectedMinistryContact {
  _id?: string;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  showOnSite?: boolean | null;
}

/** The ministry document a ministrySection points at, as the projection reads it. */
export interface ProjectedMinistry {
  _id?: string;
  title?: string | null;
  /** Its web address ("children"): picks the newsletter line (church-trac-newsletters.ts). */
  slug?: string | null;
  eyebrow?: string | null;
  headline?: string | null;
  /** The goal it serves: 'worship' | 'the-way' | 'witness' | 'work' (ministry-goals.ts). */
  goal?: string | null;
  body?: unknown[] | null;
  image?: ProjectedImage | null;
  /** Null entries are references that no longer resolve (a deleted person). */
  contacts?: (ProjectedMinistryContact | null)[] | null;
}

/**
 * ministrySection: a POINTER to one ministry document. Never rendered as
 * itself: src/lib/ministry-band.ts turns it into the imageTextSection or
 * richTextSection it draws as, before the cadence and the spare-image pool
 * see it (see RenderedBlock below).
 */
export interface ProjectedMinistrySection extends AnchoredSection {
  _type: 'ministrySection';
  _key: string;
  ministry?: ProjectedMinistry | null;
  imageSide?: 'left' | 'right' | null;
}

/** One ministry listed under a goal in the goal index. */
export interface MinistryGoalEntry {
  /** The band's own small line (or the ministry's name), as it reads on the band. */
  label: string;
  /** The band's anchor, when it has one: the link target. */
  anchor?: string;
}

/** One of the four goals in the index, with the ministries that serve it. */
export interface MinistryGoalColumn {
  value: 'worship' | 'the-way' | 'witness' | 'work';
  name: string;
  /** The church's own bracketed word for the goal ("Discipleship"), or null. */
  aside: string | null;
  glyph: 'window' | 'door' | 'rose' | 'basin';
  ministries: MinistryGoalEntry[];
}

/**
 * The goal index: DERIVED, never stored. src/lib/ministry-band.ts puts one in
 * front of a page's first Ministry band when any ministry on the page names
 * its goal, and MinistryGoals.astro draws it. There is no schema type and no
 * _key, so the preview gives it no section controls (there is nothing to edit).
 */
export interface MinistryGoalsIndexBlock {
  _type: 'ministryGoalsIndex';
  _key?: undefined;
  goals: MinistryGoalColumn[];
}

/** Registered as a derived block (see DerivedBlocks below). */
export interface DerivedBlocks {
  ministryGoalsIndex: MinistryGoalsIndexBlock;
}

/** watchwordSection — no image field, so the raw generated type is exact. */
export type ProjectedWatchwordSection = { _key: string } & _WatchwordSection;

/**
 * One goal after `photos[]` resolves through IMAGE_PROJECTION. Per the site
 * owner's ruling (Task 3, 2026-09-23): no caption field anywhere, so a goal
 * photo carries only its required alt text.
 */
export type ProjectedGoal = Omit<NonNullable<_GoalsSection['goals']>[number], 'photos'> & {
  photos?: ProjectedImage[] | null;
};

/** goalsSection — the four bands, each resolved through ProjectedGoal. */
export type ProjectedGoalsSection = { _key: string } & Omit<_GoalsSection, 'goals'> & {
    goals?: ProjectedGoal[];
  };

/** pledgeSection — the lines said together, plus the resolved photo. */
export type ProjectedPledgeSection = { _key: string } & Omit<_PledgeSection, 'image'> & {
    image?: ProjectedImage | null;
  };

/** letterSection — the pastors' letter, plus the resolved portrait. */
export type ProjectedLetterSection = { _key: string } & Omit<_LetterSection, 'portrait'> & {
    portrait?: ProjectedImage | null;
  };

/** The Church Trac form a churchTracFormSection points at, as the projection reads it. */
export interface ProjectedChurchTracForm {
  _id: string;
  title?: string | null;
  embed?: string | null;
  size?: string | null;
}

/** churchTracFormSection — heading and words, plus the dereferenced form. */
export type ProjectedChurchTracFormSection = { _key: string } & Omit<
  _ChurchTracFormSection,
  'form'
> & {
    form?: ProjectedChurchTracForm | null;
  };
// scaffold:end

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
  | ProjectedDynamicListSection
  // scaffold: church
  | ProjectedSundayTimesSection
  | ProjectedTimelineSection
  | ProjectedStaffGridSection
  | ProjectedFaqSection
  | ProjectedScriptureBandSection
  | ProjectedHeritageBandSection
  | ProjectedGiveBandSection
  | ProjectedHoursSection
  | ProjectedDocumentListSection
  | ProjectedLinkCardsSection
  | ProjectedMinistrySection
  | ProjectedWatchwordSection
  | ProjectedGoalsSection
  | ProjectedPledgeSection
  | ProjectedLetterSection
  | ProjectedChurchTracFormSection;
// scaffold:end

/**
 * What SectionRenderer actually draws: every block EXCEPT a ministrySection,
 * which is resolved into the band it renders as before anything else looks at
 * the array. Written against the literal rather than the named type so it
 * still compiles in a fork whose scaffold removed the church blocks.
 */
export type RenderedBlock =
  Exclude<PageBuilderBlock, { _type: 'ministrySection' }> | DerivedBlocks[keyof DerivedBlocks];

/**
 * Blocks no editor places: derived from the page's own blocks before render
 * (the church's goal index is the one there is). A registry, merged by
 * declaration, so a capability adds its derived block inside its own scaffold
 * region and RenderedBlock above never has to name it. `_none` keeps the
 * interface non-empty for the linter; its type is never, so it adds nothing.
 */
export interface DerivedBlocks {
  _none: never;
}

// ---------------------------------------------------------------------------
// Site settings, as a page-builder block sees them
// ---------------------------------------------------------------------------
/**
 * The slice of `siteSettings` that section components read.
 *
 * Blocks do NOT fetch this themselves. The route that renders the page already
 * has the settings document (every route fetches it for the header and footer)
 * and hands it to `SectionRenderer`, which passes it down. That matters in
 * `/preview/**`: the preview route fetches with the DRAFT client, so an editor
 * changing `givingUrl` or the map sees it, where a block calling the build-time
 * `getSiteSettings()` would read the published document instead (and would keep
 * reading a memoised copy of it for the isolate's whole life).
 *
 * Every field is optional: a fresh clone with no Sanity project renders these
 * blocks with their own fallbacks.
 */
export interface SectionSiteSettings {
  /** The church's name, used by the Sunday-times address card. */
  title?: string;
  /** Where the give band's button points when the block has no link of its own. */
  givingUrl?: string;
  /**
   * "Sundays at 10:45 am". The hero's live dated line is derived from it
   * (src/lib/live-sunday.ts), so the one setting drives the header, the menu,
   * the footer and the hero rather than four typed copies (CLAUDE.md rule 15).
   * The GROQ projection in queries.ts already selects it; this is a TypeScript
   * addition only, no schema change.
   */
  serviceTime?: string;
  /** Street address, possibly multi-line, for the Sunday-times address card. */
  address?: string;
  city?: string;
  state?: string;
  /** Projected Sanity image for the location map. */
  mapImage?: ProjectedImage | null;
  /** Google Maps (or similar) link under the map. */
  directionsUrl?: string;
  /**
   * The church office's opening hours and the pastors' appointment hours, both
   * portable text, both read by the hours band (Hours.astro). They live on
   * siteSettings rather than on the block so the band, the footer and any
   * future surface can never disagree (CLAUDE.md rule 15). `unknown` here
   * because PortableTextStatic owns the block shape; it narrows on the way in.
   */
  officeHours?: unknown;
  pastoralHours?: unknown;
  /**
   * The church's accounts elsewhere, read by the office door's "Follow along"
   * group (Hours.astro) through socialLinksOf() (src/lib/social-links.ts), the
   * same derivation the footer and the mobile menu use. All four are already
   * in the siteSettings projection; TypeScript additions only, no schema
   * change.
   */
  socialLinks?: Array<{ platform?: string; url?: string; label?: string } | null> | null;
  socialFacebook?: string;
  socialInstagram?: string;
  youtubeUrl?: string;
}
