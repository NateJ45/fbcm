// Foundation, edit with care
// GROQ queries per page. Each function returns the page singleton plus any
// auto-populated collections that page needs (journal entries for a
// dynamicListSection, etc.).
//
// Types: until `sanity typegen generate` runs, return types are `any`.
// Run `npm run typegen` after schema changes to regenerate src/lib/sanity.types.ts.

import { sanityFetch } from './sanity';
import { DYNAMIC_LIST_MAX } from './dynamicListLimits';

// Common Portable Text + image projection shorthand
export const IMAGE_PROJECTION = `{
  ...,
  asset->,
  "alt": coalesce(alt, asset->altText, "")
}`;

export const CTA_PROJECTION = `{
  ...,
  internalLink->{ _type, "slug": slug.current }
}`;

// Page-builder array projection. Spreads each block, then resolves the nested
// images and ctaBlocks inside the block types that carry them, so SectionRenderer
// gets ready-to-use data. Block types without images/ctas (text, quote, stats,
// video, spacer) pass through on the leading `...`.
//
// Parameterized by field name so it serves both `pageBuilder` (custom pages)
// and `additionalSections` (the flexible append zone on core pages).
export function sectionsProjection(field = 'pageBuilder'): string {
  return `${field}[]{
    ...,
    _type == "heroSection" => {
      ...,
      backgroundImage${IMAGE_PROJECTION},
      frames[]${IMAGE_PROJECTION},
      primaryCta${CTA_PROJECTION},
      secondaryCta${CTA_PROJECTION}
    },
    _type == "ctaBandSection" => {
      ...,
      backgroundImage${IMAGE_PROJECTION},
      cta${CTA_PROJECTION},
      secondaryCta${CTA_PROJECTION}
    },
    _type == "imageTextSection" => {
      ...,
      image${IMAGE_PROJECTION},
      cta${CTA_PROJECTION}
    },
    _type == "gallerySection" => {
      ...,
      images[]${IMAGE_PROJECTION}
    },
    _type == "logoStripSection" => {
      ...,
      logos[]${IMAGE_PROJECTION}
    },
    _type == "teamSection" => {
      ...,
      members[]{
        ...,
        photo${IMAGE_PROJECTION}
      }
    },
    // dynamicListSection: items fetched inline via a GROQ select() per source,
    // each normalised to a flat items array so the component handles one shape.
    _type == "dynamicListSection" => {
      ...,
      cta${CTA_PROJECTION},
      "items": select(
        // scaffold: journal
        // 2026-09-18: this used to read "[0...limit]" with "limit" as the
        // editor's own field on this section. GROQ slice bounds cannot be
        // field references -- that form throws a query PARSE error, which
        // sanityFetch's catch turns into the empty fallback for the WHOLE
        // home-page query, not just this arm, so the entire page silently
        // fell back to code-defined defaults. The fix: fetch a fixed batch of
        // DYNAMIC_LIST_MAX candidates here (imported from dynamicListLimits.ts,
        // the same constant the schema's max() validates against) and let
        // DynamicList.astro trim that batch down to the editor's real 'limit',
        // which is already present on this section via the leading "...".
        source == "journal" => *[_type == "journalEntry"] | order(publishedAt desc)[0...${DYNAMIC_LIST_MAX}]{
          _id, "title": title, "meta": publishedAt, "summary": excerpt,
          "href": "/post/" + slug.current,
          // The row's eyebrow and the durable-first ordering are both derived
          // from the category (src/lib/blog-derive.ts), so the category has to
          // travel with the item. Since the art-direction pass the journal list
          // also PRINTS the first one, in the right-hand rubric column.
          "categories": categories[]->{ _id, title, slug },
          "coverImage": coverImage${IMAGE_PROJECTION}
        },
        // scaffold:end
        // 2026-09-18: the trailing [] is the select's DEFAULT arm, and it is
        // load-bearing for the scaffold. Every other arm here belongs to a
        // removable capability, so without a default a fork that removes the
        // last one would be left with a dangling comma, or an empty select(),
        // neither of which is valid GROQ. An empty list is also the right
        // answer for a
        // source nothing serves any more: the component renders nothing.
        []
      )
    },
    // scaffold: church
    // The nine church blocks. Most of them are flat objects that the leading
    // spread already carries whole; the four arms that do real work are staffGrid
    // (which reaches OUT to the staffMember collection), timeline (slug ->
    // string), heritage (image + cta) and documentList (file asset -> url).
    _type == "sundayTimesSection" => {
      ...,
      items[],
      doors[],
      photos[]${IMAGE_PROJECTION},
      cta${CTA_PROJECTION}
    },
    _type == "timelineSection" => {
      ...,
      rows[]{
        ...,
        "anchor": anchor.current
      }
    },
    // The parent's group field is reached with ^ from inside the subquery, and
    // every reach is wrapped in coalesce(^.group, "all"). The schema's
    // initialValue only fires for a block an editor creates in the Studio: a
    // block written programmatically (a seeded or imported page) carries no
    // group key at all, and an uncoalesced ^.group then fails all three
    // clauses at once, so the grid renders a heading over nothing on a green
    // build. "all" is also what the component itself defaults to, so the query
    // default and the render default now agree.
    //
    // The third clause is the one that matters: a staff member with NO group
    // set is support staff (that is what groupStaff() in church-derive.ts
    // decides), so a "support" section must fetch the ungrouped ones too or
    // they vanish from the site entirely while still existing in the dataset.
    _type == "staffGridSection" => {
      ...,
      "members": *[_type == "staffMember" && showOnSite != false && (coalesce(^.group, "all") == "all" || group == coalesce(^.group, "all") || (coalesce(^.group, "all") == "support" && !defined(group)))] | order(order asc, name asc) {
        _id, name, "slug": slug.current, role, email, phone, group, order, bio,
        photo{ ..., asset->, "alt": coalesce(alt, asset->altText, name) }
      }
    },
    _type == "faqSection" => {
      ...,
      items[]
    },
    _type == "scriptureBandSection" => {
      ...
    },
    _type == "heritageBandSection" => {
      ...,
      image${IMAGE_PROJECTION},
      cta${CTA_PROJECTION}
    },
    _type == "giveBandSection" => {
      ...
    },
    // hoursSection stores only its eyebrow and heading: the hours themselves
    // live on siteSettings and the component reads them from there.
    _type == "hoursSection" => {
      ...
    },
    _type == "documentListSection" => {
      ...,
      docs[]{
        ...,
        "fileUrl": file.asset->url
      }
    },
    // Each card owns a ctaBlock, so the reference inside it has to be resolved
    // the same way the hero's buttons are. The leading spread would hand the
    // component a bare _ref and the card's link would fall back to /contact.
    _type == "linkCardsSection" => {
      ...,
      cards[]{
        _key,
        title,
        body,
        cta${CTA_PROJECTION},
        image${IMAGE_PROJECTION},
        glyph
      }
    },
    // A Ministry band holds only a reference. Everything it draws is on the
    // ministry document, dereferenced here, and so are the people it names:
    // src/lib/ministry-band.ts builds one contact line per person from these
    // fields, and drops anyone whose Staff page is hidden (showOnSite false).
    // The same projection feeds /preview/**, where both hops read drafts.
    _type == "ministrySection" => {
      ...,
      "ministry": ministry->{
        _id,
        title,
        eyebrow,
        headline,
        body,
        image${IMAGE_PROJECTION},
        "contacts": contacts[]->{ _id, name, role, email, showOnSite }
      }
    },
    // Task 3, 2026-09-23 (Who We Are alive). watchwordSection carries no
    // image, so the leading spread already covers it and it gets no arm here.
    _type == "goalsSection" => {
      ...,
      goals[]{
        ...,
        photos[]${IMAGE_PROJECTION}
      }
    },
    _type == "pledgeSection" => {
      ...,
      image${IMAGE_PROJECTION}
    },
    _type == "letterSection" => {
      ...,
      portrait${IMAGE_PROJECTION}
    }
    // scaffold:end
  }`;
}

// ---- Site settings (used in BaseLayout / Header / Footer) -----------------
// city, state, serviceRegion, geoLat, and geoLng live on the businessInfo
// singleton. Pulled in here under the same flat field names so pages that read
// siteSettings.geoLat etc. keep working with no change; only the source
// document changed.
//
// 2026-09-19: serviceTime, serviceLength, officeHours, pastoralHours and the
// Church Center / Church Trac / YouTube / giving / form addresses live at the
// TOP LEVEL of siteSettings (Studio tab "Church details", group: 'church').
// They are not nested under a "church" key in the data, only grouped in the
// Studio UI.

// One menu link (schemaTypes/navLink.ts), as every menu needs it: the label,
// the hand-typed address that older items still carry, and the picked page
// DEREFERENCED down to a type + slug. src/lib/nav-href.ts turns that into an
// href. The field list is separate from the braces so it can also be spread
// into a projection that adds children (navItems' dropdown groups).
const NAV_LINK_FIELDS = `_key, _type, label, linkType, href, externalUrl,
    "slug": internalPage->slug.current,
    "docType": internalPage->_type,
    "pageArchived": internalPage->archived`;
export const NAV_LINK_PROJECTION = `{ ${NAV_LINK_FIELDS} }`;

// Module-level memoized promise. The first call triggers the actual Sanity
// fetch; every subsequent call (across all pages in the same build process)
// returns the same promise, collapsing 11+ per-page calls to one request.
let _siteSettingsPromise: Promise<any> | null = null;

// Exported so the preview shell (src/layouts/PreviewLayout.astro) fetches the
// chrome through the SAME projection. Fetching the raw document would leave
// every dereferenced menu link null in the preview.
export const SITE_SETTINGS_PROJECTION = `{
    title,
    tagline,
    email,
    phone,
    "geoLat": *[_type == "businessInfo"][0].geoLat,
    "geoLng": *[_type == "businessInfo"][0].geoLng,
    "city": *[_type == "businessInfo"][0].city,
    "state": *[_type == "businessInfo"][0].state,
    "serviceRegion": *[_type == "businessInfo"][0].serviceRegion,
    socialInstagram,
    socialFacebook,
    socialLinks[]{
      platform,
      url,
      label
    },
    seoImage${IMAGE_PROJECTION},
    footerCredit,
    footerCreditUrl,
    newsletter,
    logo${IMAGE_PROJECTION},
    // Church details (Studio tab "Church details"). Top-level fields, only
    // grouped together in the Studio UI.
    serviceTime,
    serviceLength,
    officeHours,
    pastoralHours,
    churchCenterUrl,
    givingUrl,
    churchTracUrl,
    youtubeUrl,
    livestreamUrl,
    visitorFormUrl,
    lifeEventFormUrl,
    mapImage${IMAGE_PROJECTION},
    directionsUrl,
    // The street address, used by the sundayTimes block's fallback card when no
    // map picture is set. GROQ returns null for a field a document has not got,
    // so projecting it is safe whether or not the field is filled in.
    address,
    // Optional editor-managed menus. Empty arrays mean "use the built-in defaults."
    navItems[]{
      ${NAV_LINK_FIELDS},
      links[]${NAV_LINK_PROJECTION}
    },
    footerColumns[]{
      _key,
      title,
      links[]${NAV_LINK_PROJECTION}
    },
    legalNav[]${NAV_LINK_PROJECTION},
    headerCta{ show, label, link${NAV_LINK_PROJECTION} },
    showEmail,
    showSocials,
    showFooterSocials,
    sectionVisibility{
      showJournal
    }
  }`;

export async function getSiteSettings() {
  if (_siteSettingsPromise) return _siteSettingsPromise;
  _siteSettingsPromise = sanityFetch(
    `*[_type == "siteSettings"][0]${SITE_SETTINGS_PROJECTION}`,
    {},
    null,
  );
  return _siteSettingsPromise;
}

// ---- Business info (location + geo) ----------------------------------------
// Most consumers read these through getSiteSettings (flat names), but pages
// or blocks that need businessInfo directly can use this.
export async function getBusinessInfo() {
  return sanityFetch(
    `*[_type == "businessInfo"][0]{
    businessModel,
    city,
    state,
    serviceRegion,
    geoLat,
    geoLng,
    additionalLocations[]{
      city,
      state,
      geoLat,
      geoLng
    }
  }`,
    {},
    null,
  );
}

// ---- Announcement banner --------------------------------------------------
// Fetches the single active announcement: enabled, started (or no startDate),
// not yet ended (or no endDate). Urgency ordering: urgent first, then highlight,
// then info; ties broken by soonest endDate so the most time-sensitive shows.
//
// "now" is evaluated at BUILD TIME (static site). A banner appears or disappears
// after the next rebuild. Use a scheduled Cloudflare deploy hook for auto-expiry.
//
// Returns null when no announcement is active (graceful absence: no banner renders).
export async function getActiveAnnouncement() {
  const now = new Date().toISOString();
  return sanityFetch(
    `*[_type == "announcement" && enabled == true
      && (!defined(startDate) || startDate <= $now)
      && (!defined(endDate) || endDate >= $now)]
      | order(select(style == "urgent" => 0, style == "highlight" => 1, 2) asc, endDate asc)[0]{
        message, style, link
      }`,
    { now },
    null,
  );
}

// ---- Home page ------------------------------------------------------------

export async function getHomePage() {
  return sanityFetch(
    `*[_type == "homePage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')}
  }`,
    {},
    null,
  );
}

// ---- 404 page -------------------------------------------------------------

export async function getNotFoundPage() {
  return sanityFetch(
    `*[_type == "notFoundPage"][0]{
    seoTitle,
    seoDescription,
    eyebrow,
    headline,
    body,
    heroImage${IMAGE_PROJECTION},
    primaryCtaLabel, primaryCtaHref,
    secondaryCtaLabel, secondaryCtaHref,
    tertiaryCtaLabel, tertiaryCtaHref
  }`,
    {},
    null,
  );
}

// ---- Projects (used by Footer.astro for Latest Projects column) -----------

/** Minimal project shape used by core surfaces (footer "Latest Projects" column,
 *  home Featured Work section). Fields mirror the GROQ projection below.
 *  Defined locally so core typechecks whether or not the portfolio module is enabled. */
export interface CoreProjectCard {
  _id: string;
  title?: string;
  slug?: { current?: string };
  location?: string;
  year?: number;
  roomType?: string;
  designStyle?: string;
  briefSummary?: string;
  featured?: boolean;
  heroImage?: any;
}

export async function getAllProjects(): Promise<CoreProjectCard[]> {
  return sanityFetch(
    `*[_type == "project"] | order(orderRank asc, coalesce(displayOrder, 999) asc, publishedAt desc){
    _id, title, slug, location, year, roomType, designStyle, briefSummary,
    heroImage${IMAGE_PROJECTION}
  }`,
    {},
    [],
  );
}

// ---- Journal --------------------------------------------------------------

// scaffold: journal
// Projection for a journal card (index page) — small surface, no body.
const JOURNAL_CARD_PROJECTION = `{
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  tags,
  author,
  coverImage${IMAGE_PROJECTION},
  "categories": categories[]->{ _id, title, slug, description },
  // The first six body blocks as plain text: where a sermon preview names its
  // reading (readingOf in sermon-derive.ts). Text only, never the whole body.
  "opening": pt::text(body[0...6])
}`;
// scaffold:end

// scaffold: journal
export async function getJournalPage() {
  return sanityFetch(
    `*[_type == "journalPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    stickyCtaLabel,
    finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION},
    ${sectionsProjection('additionalSections')}
  }`,
    {},
    null,
  );
}
// scaffold:end

// scaffold: journal
export async function getAllJournalEntries() {
  // Newest first. Excerpt + cover only (no body). The durable/preview split
  // that used to lean on a stored `featured` flag is derived from category
  // at build time now (splitDurable in src/lib/blog-derive.ts, CLAUDE.md
  // rule 15), so this query only needs to hand posts over in date order.
  return sanityFetch(
    `*[_type == "journalEntry"] | order(publishedAt desc) ${JOURNAL_CARD_PROJECTION}`,
    {},
    [],
  );
}
// scaffold:end

// scaffold: journal
export async function getAllJournalCategories() {
  return sanityFetch(
    `*[_type == "journalCategory"] | order(title asc){
    _id, title, slug, description,
    "postCount": count(*[_type == "journalEntry" && references(^._id)])
  }`,
    {},
    [],
  );
}
// scaffold:end

// scaffold: journal
export async function getJournalEntryBySlug(slug: string) {
  // Full doc including body. The body's inline image blocks get their asset
  // resolved + alt fallback at the GROQ layer so the renderer doesn't have to
  // chase asset refs for every block. Image gallery items + beforeAfter pairs
  // + sourceCard images + inline images all get the same treatment.
  return sanityFetch(
    `*[_type == "journalEntry" && slug.current == $slug][0]{
      _id, title, slug, excerpt, author, publishedAt, updatedAt,
      tags,
      seoTitle, seoDescription,
      coverImage${IMAGE_PROJECTION},
      "categories": categories[]->{ _id, title, slug, description },
      "relatedProject": relatedProject->{ _id, title, slug, location, year, heroImage${IMAGE_PROJECTION} },
      body[]{
        ...,
        _type == "inlineImage" => ${IMAGE_PROJECTION},
        _type == "beforeAfter" => {
          ...,
          beforeImage${IMAGE_PROJECTION},
          afterImage${IMAGE_PROJECTION}
        },
        _type == "sourceCard" => {
          ...,
          image${IMAGE_PROJECTION}
        },
        _type == "imageGallery" => {
          ...,
          images[]${IMAGE_PROJECTION}
        }
      }
      // NO relatedPosts HERE, deliberately (2026-09-20). This projection used
      // to coalesce the editor's explicit relatedPosts with an auto-pick of the
      // three most recent posts sharing a category: a whole second GROQ
      // sub-query and a second card projection, on every one of 142 post
      // builds, whose result nothing read. /post/[slug].astro draws its
      // "related" band from seriesByTag() over the entries it already has
      // (src/lib/blog-derive.ts), which is derived rather than stored and is
      // what CLAUDE.md rule 15 asks for.
      //
      // The relatedPosts FIELD stays on the journalEntry schema. No entry sets
      // it (checked live: 0 of 142), so nothing is orphaned, and removing a
      // schema field is the change that puts the Studio's "Remove field" button
      // in front of an editor (rule 1). Dropping the read is the whole fix.
    }`,
    { slug },
    null,
  );
}
// scaffold:end

// Static path generation for /post/[slug]. Returns just the slugs.
// scaffold: journal
export async function getAllJournalSlugs(): Promise<string[]> {
  const list: Array<{ slug: { current: string } }> = await sanityFetch(
    `*[_type == "journalEntry" && defined(slug.current)]{ slug }`,
    {},
    [],
  );
  return list.map((e) => e.slug?.current).filter(Boolean);
}
// scaffold:end

// ---- Privacy page ---------------------------------------------------------

export async function getPrivacyPage() {
  return sanityFetch(
    `*[_type == "privacyPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    lastUpdated,
    body
  }`,
    {},
    null,
  );
}

// ---- Press items (used by core: about.astro + index.astro PressStrip) ----

/** Minimal press item shape used by the core PressStrip component.
 *  Defined locally so core typechecks whether or not the press module is enabled. */
export interface CorePressItem {
  _id: string;
  outlet?: string;
  logo?: any;
  quote?: string;
  url?: string;
  date?: string;
  orderRank?: string;
}

// Press items ordered by orderRank for the PressStrip on the home + about pages.
export async function getPressItems(): Promise<CorePressItem[]> {
  return sanityFetch(
    `*[_type == "pressItem"] | order(orderRank asc){
    _id, outlet,
    logo${IMAGE_PROJECTION},
    quote, url, date, orderRank
  }`,
    {},
    [],
  );
}

// ---- Custom pages (page builder) ------------------------------------------

// One published custom page by slug, with its section array fully resolved.
export async function getPage(slug: string) {
  return sanityFetch(
    `*[_type == "page" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      seoTitle, seoDescription, hideFromSearch,
      seoImage${IMAGE_PROJECTION},
      ${sectionsProjection('pageBuilder')}
    }`,
    { slug },
    null,
  );
}

// Slugs of every published custom page, for getStaticPaths in [slug].astro.
//
// `archived != true`, never `archived == false`: a page made before the archive
// field existed has no value there and must stay visible. An archived page is
// simply not built, so its URL 404s and never reaches the sitemap.
export async function getAllPageSlugs(): Promise<string[]> {
  const list: Array<{ slug: string }> = await sanityFetch(
    `*[_type == "page" && defined(slug.current) && archived != true]{ "slug": slug.current }`,
    {},
    [],
  );
  return list.map((p) => p.slug).filter(Boolean);
}

// Custom pages flagged to appear in the main nav and/or footer. Header.astro
// and Footer.astro can inject these alongside the built-in links.
//
// Archived pages drop out: the page is not built, so a menu link to it would be
// a 404 in the middle of the navigation.
export async function getNavPages() {
  return sanityFetch(
    `*[_type == "page" && defined(slug.current) && archived != true && (addToMainNav == true || addToFooter == true)]{
    title,
    "slug": slug.current,
    navLabel,
    addToMainNav,
    navGroup,
    addToFooter
  }`,
    {},
    [],
  );
}
