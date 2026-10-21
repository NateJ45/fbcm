// Safe to edit by hand
// scaffold-file: journal
// How a post's cover sits in the plain picture box on /blog and the archives
// (2026-09-24, feat/blog-flat; PostRow.astro's `frame="plain"`).
//
// The box is 16:9 (2026-10-21, the co-pastor's request): the church's sermon
// slide graphics are 16:9 and were being letterboxed in the old 9:7 box, which
// was drawn for the legacy Wix covers. Measured on 2026-09-24, 115 of the 141
// covers are 940x726-style series slides (1.29:1); the church confirmed their
// lettering sits in the centre, so those are CROPPED to fill the 16:9 box
// (about a quarter of the height trimmed, top and bottom). Anything in the
// legacy band (1.15 to 1.40) is treated the same way. A cover already near
// 16:9 fills the box exactly. The rest (squares, the portrait photograph, the
// panorama) have no safe crop, so they are shown WHOLE inside the box
// ("contain") on a quiet ground and never lose a line of words.
//
// Derived from the asset's own dimensions every build (CLAUDE.md rule 15),
// never a stored field.
import { parseSanityAssetDimensions } from './sanity-asset.ts';

/** The plain box's shape, width over height. */
export const PLAIN_COVER_RATIO = 16 / 9;

/**
 * How far an image's shape may be from the box's before it is shown whole
 * rather than cropped: 12%, so a near-16:9 cover is filled and a square is not.
 */
export const COVER_TOLERANCE = 0.12;

/**
 * The legacy slide band, width over height: the 940x726 series slides and
 * their near neighbours (1.19, 1.36). Cropped to the 16:9 box on purpose.
 */
export const LEGACY_COVER_MIN = 1.15;
export const LEGACY_COVER_MAX = 1.4;

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
  if (Math.abs(r / box - 1) <= COVER_TOLERANCE) return 'cover';
  return r >= LEGACY_COVER_MIN && r <= LEGACY_COVER_MAX ? 'cover' : 'contain';
}
