// Safe to edit by hand
// The Sanity asset-ref parser, on its own so that PURE modules can use it.
//
// It used to live in src/lib/sanity.ts beside the client. That file reads
// `import.meta.env` at module scope, so anything importing the parser also
// built the client: fine in Astro, fatal in a node --test run, where
// `import.meta.env` is undefined. src/lib/spare-images.ts is unit-tested and
// needs the dimensions, which is what moved it here. sanity.ts re-exports it,
// so every existing `from '@/lib/sanity'` caller is unchanged.

/**
 * Pull intrinsic width + height out of a Sanity image's asset ref.
 * Asset refs follow the pattern `image-{hash}-{W}x{H}-{ext}` (e.g.
 * `image-e05a4e2...-5712x4284-jpg`), so the dimensions can be extracted
 * with a single regex without an extra Sanity query.
 *
 * Returns null when the ref is missing or doesn't match — callers should
 * fall back to letting the browser size the image naturally (with a layout
 * shift) rather than fabricating dimensions.
 *
 * Used by the Portable Text image renderers to set width/height on inline
 * <img> tags, which lets the browser reserve aspect-ratio space before the
 * image loads and eliminates the CLS hit Lighthouse was flagging on
 * project + journal detail pages.
 */
export function parseSanityAssetDimensions(
  // Deliberately loose: callers pass the GROQ-projected image, whose `asset`
  // is a whole resolved asset document (and can be null on a broken ref), not
  // the two-key reference this used to name. Only `_ref` / `_id` are read.
  source: { asset?: { _ref?: string; _id?: string } | null } | null | undefined,
): { width: number; height: number } | null {
  const ref = source?.asset?._ref ?? source?.asset?._id;
  if (!ref) return null;
  const m = ref.match(/-(\d+)x(\d+)-[a-z0-9]+$/i);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!width || !height) return null;
  return { width, height };
}
