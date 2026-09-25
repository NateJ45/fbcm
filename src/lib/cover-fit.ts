// Safe to edit by hand
// scaffold-file: journal
// How a post's cover sits in the plain picture box on /blog and the archives
// (2026-09-24, feat/blog-flat; PostRow.astro's `frame="plain"`).
//
// The box is one consistent landscape shape, 9:7, because that is the shape of
// the covers themselves: measured on 2026-09-24, 115 of the 141 covers are
// 940x726-style series slides (1.29:1), and a box of exactly that shape shows
// every one of them whole. The rest are squares (11), 16:9 (6), a few near
// the slides (1.19, 1.36), one portrait photograph and one panorama. Most of
// them are slides with lettering running close to the edges, so an image is
// only CROPPED to fill the box when its shape is close enough that the crop
// takes a sliver; anything further off is shown WHOLE inside the box
// ("contain") on a quiet ground, so no slide ever loses a line of its words.
//
// Derived from the asset's own dimensions every build (CLAUDE.md rule 15),
// never a stored field.
import { parseSanityAssetDimensions } from './sanity-asset.ts';

/** The plain box's shape, width over height. */
export const PLAIN_COVER_RATIO = 9 / 7;

/**
 * How far an image's shape may be from the box's before it is shown whole
 * rather than cropped: 12%, so a 1.19 or 1.36 cover loses at most about 7% of
 * one dimension, and a square or 16:9 slide is never cut.
 */
export const COVER_TOLERANCE = 0.12;

interface CoverImage {
  asset?: { _ref?: string; _id?: string } | null;
  crop?: { top?: number; bottom?: number; left?: number; right?: number } | null;
}

/** The shape the served image will have: the asset's, after the editor's crop. */
export function coverRatio(image: CoverImage | null | undefined): number | null {
  const dims = parseSanityAssetDimensions(image ?? null);
  if (!dims) return null;
  const c = image?.crop ?? null;
  const w = dims.width * (1 - (c?.left ?? 0) - (c?.right ?? 0));
  const h = dims.height * (1 - (c?.top ?? 0) - (c?.bottom ?? 0));
  return w > 0 && h > 0 ? w / h : null;
}

/**
 * 'cover' fills the box (a sliver cropped at most); 'contain' shows the whole
 * image inside it. An image whose shape cannot be read is shown whole.
 */
export function coverFit(
  image: CoverImage | null | undefined,
  box = PLAIN_COVER_RATIO,
): 'cover' | 'contain' {
  const r = coverRatio(image);
  if (r === null) return 'contain';
  return Math.abs(r / box - 1) <= COVER_TOLERANCE ? 'cover' : 'contain';
}
