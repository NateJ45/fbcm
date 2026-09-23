// Foundation, edit with care
//
// "Should the header sit ON this page's opening picture?"
//
// Overlay mode (the art-direction pass, task 3) is the header rendering with
// no background, no rule and paper lettering, with the hero pulled up
// underneath it by a negative margin. It only reads as intentional when there
// is actually a photograph behind the lettering, so the answer is a property
// of ONE thing: the page's first page-builder block.
//
// The rule, in full: the first block is a heroSection, it carries at least one
// image, AND its layout puts that image BEHIND the words rather than beside
// them. A hero stores its picture in either of two places, `backgroundImage`
// or the `frames` array (the home page's slow cross-fade is `frames` with more
// than one entry), so both count as an image.
//
// The layout half of that rule is not a nicety. heroSection's "Words left,
// photo right" option (layout: 'split') renders the words on the page's own
// paper surface with the photograph in a column beside them, so the header
// would be crossing paper, not a photograph, and overlay mode's paper
// lettering would be invisible on it. /beliefs, /visit and /staff are all
// split heroes with real photographs in them, which is exactly the case this
// clause excludes. Only 'full' (the schema's initialValue, "Photo behind the
// words") gets the treatment.
//
// Anything else, including a text-only hero and any page whose first block is
// not a hero at all, gets the ordinary paper bar. That is deliberately the
// safe default: a transparent header over a paper band would put paper-coloured
// lettering on paper with nothing to separate it from the page.

/** The shape this needs from a page-builder block. Deliberately loose: the
 *  generated Sanity types differ per route, and everything here is optional
 *  in the schema anyway. */
type MaybeBlock =
  | {
      _type?: string;
      layout?: string | null;
      backgroundImage?: { asset?: unknown } | null;
      frames?: unknown[] | null;
      backgroundImages?: unknown[] | null;
    }
  | null
  | undefined;

/** True when the block carries at least one usable image. */
function hasImage(block: NonNullable<MaybeBlock>): boolean {
  if (block.backgroundImage?.asset) return true;
  if (Array.isArray(block.frames) && block.frames.length > 0) return true;
  // `backgroundImages` is not on today's heroSection schema. It is checked
  // anyway so a future rename or a second image array cannot silently turn
  // overlay mode off on every page at once.
  if (Array.isArray(block.backgroundImages) && block.backgroundImages.length > 0) return true;
  return false;
}

/**
 * Whether the header should render in overlay mode for this page's sections.
 * Pass the same array the route hands SectionRenderer.
 */
export function shouldOverlayHeader(sections: MaybeBlock[] | null | undefined): boolean {
  const first = sections?.[0];
  if (!first || first._type !== 'heroSection') return false;
  // 'full' is heroSection's initialValue, so an older document that predates
  // the field and has no `layout` at all is a full-bleed hero, not a split one.
  // 'window' (2026-09-23) is a season-coloured band with arched photos
  // beside the words, not a photograph behind them, so it keeps the paper bar
  // for the same reason 'split' does.
  if (first.layout === 'split' || first.layout === 'window') return false;
  return hasImage(first);
}
