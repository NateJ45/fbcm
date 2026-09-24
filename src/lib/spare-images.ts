// Safe to edit by hand
// The art-direction pass asks three bands to show a photograph that is not
// their own: the Sunday band's right door, the statement band behind its big
// line, and the closing strip. None of those blocks has an image field, and
// adding one was ruled out (zero schema changes), so the pictures are BORROWED
// from the blocks on the same page that do carry them.
//
// The pool is shared, which is the whole reason this lives in one pure
// function rather than in three components. Three separate scans, each one
// "find the first image after me", would hand the SAME photograph to two bands
// on a page with one picture, and nothing in a build would say so. Here the
// pool is built once, in array order, and each consumer takes the next unused
// entry, so a page with one photograph gives it to exactly one band.
//
// A borrowed image stays in its own block as well. The building shows at two
// distances on purpose: once large and cropped in the Sunday band's frame,
// once at its own size where the editor put it.
//
// TWO RULES ADDED IN FIX ROUND 1 (2026-09-21), both from the built home page.
//
// THE HERO LENDS ITS SPARE FRAMES, AND NEVER ITS FIRST. A page whose pictures
// live in the hero's cross-fade had almost nothing in the pool, while five
// photographs sat in the hero doing one job between them. So every frame after
// the first joins the pool, at the FRONT of it. The first frame never does: it
// is the LCP image, and a second copy of it at another crop is a second decode
// on the slowest paint of the page.
//
// A BLOCK THAT LENT ITS PICTURE DOES NOT ALSO DRAW IT. Home showed the nave
// full-bleed in the statement band and again, at nearly the same crop, in the
// image-and-text band two screens earlier: one photograph twice, which reads as
// a mistake rather than as two distances. So an imageTextSection whose own
// image was handed out is given a REPLACEMENT, the next unused picture in the
// pool, or null when there is none, and the band then draws no figure at all.
// The old "the building shows at two distances on purpose" only holds when the
// two distances are genuinely different pictures, which this function cannot
// judge, so it stops lending a band its own photograph back.
//
// Unit-tested in spare-images.test.ts.
import type { SanityImageObject } from '@/lib/pageBuilder.types';
// Relative, with the extension, because this module is unit-tested under
// `node --test`, which resolves neither the `@/` alias nor an extensionless
// path. The parser lives apart from the Sanity client for the same reason:
// src/lib/sanity.ts reads import.meta.env at module scope.
import { parseSanityAssetDimensions } from './sanity-asset.ts';
// scaffold: church
import { heritageDates, type HeritageDateInput } from './heritage-dates.ts';
// scaffold:end

/** The shape this reads: a page-builder row, loosely typed. */
export interface SpareImageRow {
  _type: string;
  [key: string]: unknown;
}

export interface SpareImages {
  /** The statement band's backdrop. */
  statement: SanityImageObject | null;
  /** The Sunday band's right door. */
  door: SanityImageObject | null;
  /** Everything nobody claimed, in array order. */
  strip: SanityImageObject[];
  /**
   * ROW indexes, not pool indexes: the position in the array of the block that
   * receives each picture, so a renderer walking the same array can ask
   * `blockIndex === statementIndex` rather than re-deriving "the first one".
   * Null when nothing was handed out.
   */
  statementIndex: number | null;
  doorIndex: number | null;
  /**
   * Row index -> the picture an imageTextSection should draw INSTEAD of its
   * own, because its own was handed to the statement or the door. `null` means
   * "draw no figure": the pool had nothing left. A row that is not a key here
   * keeps the image it carries, so a renderer asks `has(i)` before `get(i)`.
   */
  replacements: Map<number, SanityImageObject | null>;
}

/** An image counts only when it actually points at an asset. */
const hasAsset = (value: unknown): value is SanityImageObject =>
  !!value && typeof value === 'object' && !!(value as { asset?: unknown }).asset;

/**
 * PORTRAITS ARE NOT BORROWED (2026-09-21).
 *
 * Every consumer of this pool draws its picture WIDE: the Sunday band's frame
 * is a 4:3 crop, the statement band is a full-width backdrop. A portrait put
 * through either is a face with the top of its head cut off, which is exactly
 * what /contact did on the first pass, where the only picture on the page is a
 * staff headshot.
 *
 * The dimensions come out of the asset ref (`image-<id>-<W>x<H>-<ext>`), so
 * this costs no query. An image whose ref does not parse is KEPT: the
 * alternative empties the pool on any dataset whose refs are shaped
 * differently, and a wrongly-shaped picture is a smaller failure than a band
 * with no picture at all.
 */
const isPortrait = (image: SanityImageObject): boolean => {
  const size = parseSanityAssetDimensions(image);
  return !!size && size.height > size.width;
};

/**
 * The identity of a picture: its asset ref, or the `_id` the older projections
 * carry. Two blocks pointing at one photograph are two different objects, so
 * this is the only comparison that catches a duplicate.
 */
const assetKey = (image: SanityImageObject | null | undefined): string | null => {
  const asset = image?.asset as { _ref?: string; _id?: string } | undefined;
  return asset?._ref ?? asset?._id ?? null;
};

/**
 * ARCH-DOOR LINK CARDS (2026-09-23, the Who We Are "alive" pass). A link-card
 * band whose every card carries its own photograph draws its cards as arched
 * doors (LinkCards.astro), so it is never the statement: this is the one test
 * both that component and the hand-out below ask. Only titled cards count,
 * because an untitled card never renders.
 */
export function cardsPictured(cards: unknown): boolean {
  if (!Array.isArray(cards)) return false;
  const shown = cards.filter((c) => !!(c as { title?: unknown } | null)?.title);
  return shown.length > 0 && shown.every((c) => hasAsset((c as { image?: unknown }).image));
}

/** In the pool: points at an asset, and is not taller than it is wide. */
const borrowable = (value: unknown): value is SanityImageObject =>
  hasAsset(value) && !isPortrait(value);

/**
 * Build the page's spare-image pool and hand it out.
 *
 * POOL: every `heroSection` frame after the first, then, in array order,
 * `imageTextSection.image`, each of `gallerySection.images`, and
 * `heritageBandSection.image`, minus any portrait (see isPortrait above).
 *
 * CONSUMERS, in this order: the first `linkCardsSection` that has a non-empty
 * heading takes pool[0] as its statement backdrop, then the first
 * `sundayTimesSection` with no photos of its own takes the next unused entry
 * as its door. Whatever is
 * left is the strip.
 */
export function assignSpareImages(rows: SpareImageRow[]): SpareImages {
  // The hero's spare frames go in first, wherever the hero sits in the array,
  // because they are the pictures nothing else on the page is showing.
  const heroExtras: SanityImageObject[] = [];
  for (const row of rows) {
    if (row._type !== 'heroSection') continue;
    const frames = Array.isArray(row.frames)
      ? row.frames
      : Array.isArray(row.backgroundImages)
        ? row.backgroundImages
        : [];
    // slice(1): the first frame is the LCP image and is never borrowed.
    for (const image of frames.slice(1)) if (borrowable(image)) heroExtras.push(image);
  }

  const bandImages: SanityImageObject[] = [];
  let statementIndex: number | null = null;
  let doorIndex: number | null = null;
  // Every image+text row and the picture it carries, so the duplicate pass
  // below can hand one back a replacement keyed by its row index.
  const imageTextRows: { index: number; image: SanityImageObject }[] = [];

  rows.forEach((row, index) => {
    switch (row._type) {
      case 'imageTextSection': {
        if (borrowable(row.image)) {
          bandImages.push(row.image);
          imageTextRows.push({ index, image: row.image });
        }
        break;
      }
      case 'heritageBandSection': {
        // scaffold: church
        // A building band WITH DATES (the cream "Our Building" band,
        // HeritageBand.astro note 5) draws its own image as the main picture
        // and has no strip, so lending that image would show it twice on the
        // page. Only the brown band, which has no dates, lends its picture.
        if (heritageDates(row.dates as HeritageDateInput[] | undefined, new Date()).length > 0) {
          break;
        }
        // scaffold:end
        if (borrowable(row.image)) bandImages.push(row.image);
        break;
      }
      case 'gallerySection': {
        const images = Array.isArray(row.images) ? row.images : [];
        for (const image of images) if (borrowable(image)) bandImages.push(image);
        break;
      }
      case 'linkCardsSection': {
        // A band with no heading has no big line to sit a photograph behind,
        // so it is not a consumer and the picture stays in the pool.
        const heading = typeof row.heading === 'string' ? row.heading.trim() : '';
        // Nor is a band that draws its cards as arched doors (cardsPictured).
        if (heading && statementIndex === null && !cardsPictured(row.cards)) statementIndex = index;
        break;
      }
      case 'sundayTimesSection': {
        // A Sunday band that carries its own photos (the hymn board's
        // `photos`, 2026-09-23) draws those and borrows nothing, so it is not
        // the door; a later Sunday band without photos still can be.
        const own = Array.isArray(row.photos) ? row.photos.some(hasAsset) : false;
        if (doorIndex === null && !own) doorIndex = index;
        break;
      }
      default:
        break;
    }
  });

  const pool: SanityImageObject[] = [...heroExtras, ...bandImages];

  // Hand out in consumer order, statement first, from the front of the pool.
  let next = 0;
  const take = (wanted: boolean): SanityImageObject | null =>
    wanted && next < pool.length ? (pool[next++] as SanityImageObject) : null;

  const statement = take(statementIndex !== null);
  const door = take(doorIndex !== null);

  // Every picture now showing somewhere, by asset.
  const onThePage = new Set<string>();
  for (const image of [statement, door]) {
    const key = assetKey(image);
    if (key) onThePage.add(key);
  }

  // THE DUPLICATE PASS. A band whose own picture is now showing somewhere else
  // takes the next unused one, skipping any entry that is ANOTHER copy of a
  // picture already on the page: handing that back would show it twice, which
  // is the whole defect this exists to remove.
  const replacements = new Map<number, SanityImageObject | null>();
  for (const row of imageTextRows) {
    const key = assetKey(row.image);
    if (!key || !onThePage.has(key)) continue;
    let replacement: SanityImageObject | null = null;
    while (next < pool.length) {
      const candidate = pool[next++] as SanityImageObject;
      const candidateKey = assetKey(candidate);
      if (candidateKey && onThePage.has(candidateKey)) continue;
      replacement = candidate;
      if (candidateKey) onThePage.add(candidateKey);
      break;
    }
    replacements.set(row.index, replacement);
  }

  // THE STRIP NEVER REPEATS WHAT THE READER HAS SCROLLED PAST (2026-09-23).
  // The strip is drawn by the first heritage band. A picture that an
  // image+text band or a gallery ABOVE that band already draws in place is
  // not shown again in it: /visit showed the children band's photograph
  // full-bleed and then again in "Built in 1929" three screens later. A band
  // BELOW the strip is still fair game, which is what lets /history's opening
  // band preview the era photographs the page reaches later.
  // Nor does it show the hero's first photograph through another band that
  // points at the same asset: home's heritage band carries the tower the hero
  // opens on. The first frame is never lent (above), and this closes the side
  // door. A page with no hero (/history) is untouched.
  for (const row of rows) {
    if (row._type !== 'heroSection') continue;
    const frames = Array.isArray(row.frames) ? row.frames : [];
    const first = (frames[0] ?? row.backgroundImage) as SanityImageObject | undefined;
    const key = assetKey(first);
    if (key) onThePage.add(key);
    break;
  }
  const heritageAt = rows.findIndex((row) => row._type === 'heritageBandSection');
  if (heritageAt !== -1) {
    rows.slice(0, heritageAt).forEach((row, index) => {
      if (row._type === 'imageTextSection') {
        const drawn = replacements.has(index) ? replacements.get(index) : row.image;
        const key = assetKey(drawn as SanityImageObject | null | undefined);
        if (key) onThePage.add(key);
      } else if (row._type === 'gallerySection' && Array.isArray(row.images)) {
        for (const image of row.images) {
          const key = assetKey(image as SanityImageObject);
          if (key) onThePage.add(key);
        }
      }
    });
  }

  // A consumer that asked for a picture and found an empty pool keeps no
  // index: a renderer testing the index must never be told "this block has one"
  // when it has none.
  return {
    statement,
    door,
    // What nobody claimed, minus any further copy of a picture already shown,
    // for the same reason the duplicate pass skips them.
    strip: pool.slice(next).filter((image) => {
      const key = assetKey(image);
      return !key || !onThePage.has(key);
    }),
    statementIndex: statement ? statementIndex : null,
    doorIndex: door ? doorIndex : null,
    replacements,
  };
}
