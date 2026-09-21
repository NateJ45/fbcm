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
// Unit-tested in spare-images.test.ts.
import type { SanityImageObject } from '@/lib/pageBuilder.types';
// Relative, with the extension, because this module is unit-tested under
// `node --test`, which resolves neither the `@/` alias nor an extensionless
// path. The parser lives apart from the Sanity client for the same reason:
// src/lib/sanity.ts reads import.meta.env at module scope.
import { parseSanityAssetDimensions } from './sanity-asset.ts';

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

/** In the pool: points at an asset, and is not taller than it is wide. */
const borrowable = (value: unknown): value is SanityImageObject =>
  hasAsset(value) && !isPortrait(value);

/**
 * Build the page's spare-image pool and hand it out.
 *
 * POOL, in array order: `imageTextSection.image`, each of
 * `gallerySection.images`, and `heritageBandSection.image`, minus any
 * portrait (see isPortrait below).
 *
 * CONSUMERS, in this order: the first `linkCardsSection` that has a non-empty
 * heading takes pool[0] as its statement backdrop, then the first
 * `sundayTimesSection` takes the next unused entry as its door. Whatever is
 * left is the strip.
 */
export function assignSpareImages(rows: SpareImageRow[]): SpareImages {
  const pool: SanityImageObject[] = [];
  let statementIndex: number | null = null;
  let doorIndex: number | null = null;

  rows.forEach((row, index) => {
    switch (row._type) {
      case 'imageTextSection':
      case 'heritageBandSection': {
        if (borrowable(row.image)) pool.push(row.image);
        break;
      }
      case 'gallerySection': {
        const images = Array.isArray(row.images) ? row.images : [];
        for (const image of images) if (borrowable(image)) pool.push(image);
        break;
      }
      case 'linkCardsSection': {
        // A band with no heading has no big line to sit a photograph behind,
        // so it is not a consumer and the picture stays in the pool.
        const heading = typeof row.heading === 'string' ? row.heading.trim() : '';
        if (heading && statementIndex === null) statementIndex = index;
        break;
      }
      case 'sundayTimesSection': {
        if (doorIndex === null) doorIndex = index;
        break;
      }
      default:
        break;
    }
  });

  // Hand out in consumer order, statement first, from the front of the pool.
  let next = 0;
  const take = (wanted: boolean): SanityImageObject | null =>
    wanted && next < pool.length ? (pool[next++] as SanityImageObject) : null;

  const statement = take(statementIndex !== null);
  const door = take(doorIndex !== null);

  // A consumer that asked for a picture and found an empty pool keeps no
  // index: a renderer testing the index must never be told "this block has one"
  // when it has none.
  return {
    statement,
    door,
    strip: pool.slice(next),
    statementIndex: statement ? statementIndex : null,
    doorIndex: door ? doorIndex : null,
  };
}
