// Safe to edit by hand
// The home hero cross-fade is CSS-only. This computes each frame's animation-delay
// so a 5-frame, 8-second hero cycles in 40s with frame 1 (the LCP image) first.
export function frameAnimationDelays(frameCount: number, secondsPerFrame: number): number[] {
  return Array.from({ length: Math.max(1, frameCount) }, (_, i) => i * secondsPerFrame);
}

/** The parts of a Sanity image this module reads. Numbers only, so nothing here
    is ever a stega-encoded string (stega marks strings, never numbers). */
export interface FrameHotspot {
  x?: number | null;
  y?: number | null;
}
export interface FrameCrop {
  top?: number | null;
  bottom?: number | null;
  left?: number | null;
  right?: number | null;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * THE FULL HERO HONOURS THE HOTSPOT (2026-09-24, the hero people pass).
 *
 * A full-bleed frame is `object-fit: cover`, so the browser crops it, and the
 * default object-position is dead centre, which on a church photograph puts
 * the faces under the headline. An editor's hotspot is stored as fractions of
 * the ORIGINAL image; object-position takes percentages of the DISPLAYED one,
 * which differ only when the image also carries a Sanity crop (the CDN URL
 * applies it as a `rect`). So the point is mapped into the cropped rectangle
 * first. With object-position x%, the point at x% of the picture lands at x%
 * of the frame, which is what puts a 0.62 face in the clear right side of the
 * home hero while the words sit bottom left.
 *
 * Returns null with no hotspot: the frame keeps the CSS default (centre), so a
 * photograph nobody has set a hotspot on renders exactly as it always has.
 */
export function heroObjectPosition(
  hotspot: FrameHotspot | null | undefined,
  crop?: FrameCrop | null,
): string | null {
  if (!hotspot || !isNum(hotspot.x) || !isNum(hotspot.y)) return null;
  const side = (v: unknown) => (isNum(v) ? v : 0);
  const left = side(crop?.left);
  const right = side(crop?.right);
  const top = side(crop?.top);
  const bottom = side(crop?.bottom);
  const w = 1 - left - right;
  const h = 1 - top - bottom;
  const x = w > 0 ? clamp01((hotspot.x - left) / w) : 0.5;
  const y = h > 0 ? clamp01((hotspot.y - top) / h) : 0.5;
  return `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`;
}

/**
 * THE FACE LINE OF A LANCET (2026-09-25, the people-in-arches pass).
 *
 * The lancet's two arcs spring at 44.7% of its height (y = 67.1 of 150 in the
 * mask); above that the arch narrows to its point, and a head drawn there
 * loses its hair and forehead to the stone. A portrait whose face (the
 * editor's hotspot) lands above this line is given HEADROOM instead.
 */
export const LANCET_FACE_LINE = 0.5;
/** The most headroom a portrait is ever given, as a fraction of the arch. */
export const MAX_HEADROOM = 0.3;
/**
 * How many times wider than the arch a portrait must be drawn before its
 * subject's head is as wide as the arch (a headshot's head is about half the
 * photo's width), which is when the point starts taking the top of it.
 */
export const HEADROOM_MAGNIFICATION = 2;
/** The lancet's own proportion (height / width) when a caller sets none. */
export const LANCET_RATIO = 1.5;

export interface ArchPlacement {
  /** The img's object-position ('50% 0%', the top, with no hotspot). */
  objectPosition: string;
  /**
   * The fraction of the arch's height left above the photograph, 0 for none.
   * The photograph is drawn in the arch's lower (1 - headroom) and fades into
   * the arch over its top edge, the way Lancet.astro's window starts its
   * photo 16% down.
   */
  headroom: number;
}

/**
 * WHERE A PHOTOGRAPH SITS IN AN ARCH (2026-09-25).
 *
 * An arch is `object-fit: cover`. A PORTRAIT (a photo no wider than about
 * square, after the editor's crop) is scaled to the arch's height, so it
 * cannot be moved down inside it: whatever is at the top of the photograph is
 * at the top of the arch. For a close portrait of people in a LANCET, the top
 * of the photograph is the top of someone's head, and the pointed arch cuts it
 * off (the Staff hero's two co-pastors, 2026-09-25).
 *
 * How badly depends on the arch's proportion. The lancet mask is stretched to
 * the frame, so its narrowing head is always the top 44.7% of the height, and
 * a portrait scaled to the height is drawn (height / width) x aspect times as
 * wide as the arch: in the Staff hero's tall side lights (100 / 260) a square
 * headshot is 2.6 arches wide and the heads fill the arch edge to edge; in a
 * 100 / 150 lancet it is 1.5, and a head with any room above it clears the
 * point (History's opener portrait of Pastor Carter, which must not change).
 *
 * So when the photo is of people (photo-subject.ts, from its alt), the frame
 * is a lancet, the photo is a portrait drawn at least HEADROOM_MAGNIFICATION
 * arches wide, and the editor's hotspot puts the face above LANCET_FACE_LINE,
 * the photograph is drawn lower: the headroom h is
 * chosen so the hotspot lands exactly on the face line,
 *   h + y(1 - h) = LINE   =>   h = (LINE - y) / (1 - y),
 * because with object-position y% the hotspot sits y% of the way down the
 * drawn box. Capped at MAX_HEADROOM.
 *
 * Everything else is unchanged: a door (its head is low and wide), a place,
 * a landscape (its people are small in the frame), a portrait in an arch not
 * tall enough to magnify it, a face already on or below the line, and a photo
 * with no hotspot, which keeps its top crop because without one nothing says
 * where the face is.
 */
export function archPlacement(opts: {
  shape: 'lancet' | 'door';
  people: boolean;
  /** The photograph's width / height before any crop (photo-shape.ts photoAspect). */
  aspect: number | null | undefined;
  /** The arch's height / width (its --arch-ratio read the other way up). */
  frameRatio?: number | null;
  hotspot?: FrameHotspot | null;
  crop?: FrameCrop | null;
}): ArchPlacement {
  const { shape, people, aspect, hotspot, crop } = opts;
  const frameRatio = isNum(opts.frameRatio) && opts.frameRatio > 0 ? opts.frameRatio : LANCET_RATIO;
  const objectPosition = heroObjectPosition(hotspot, crop) ?? '50% 0%';
  const none = { objectPosition, headroom: 0 };
  if (shape !== 'lancet' || !people || !isNum(aspect) || aspect <= 0) return none;
  if (!hotspot || !isNum(hotspot.x) || !isNum(hotspot.y)) return none;
  const side = (v: unknown) => (isNum(v) ? v : 0);
  const w = 1 - side(crop?.left) - side(crop?.right);
  const h = 1 - side(crop?.top) - side(crop?.bottom);
  if (w <= 0 || h <= 0) return none;
  const cropped = (aspect * w) / h;
  if (cropped > 1.1 || frameRatio * cropped < HEADROOM_MAGNIFICATION) return none;
  const y = clamp01((hotspot.y - side(crop?.top)) / h);
  if (y >= LANCET_FACE_LINE) return none;
  const room = Math.min(MAX_HEADROOM, (LANCET_FACE_LINE - y) / (1 - y));
  return { objectPosition, headroom: Math.round(room * 10000) / 10000 };
}

/**
 * THE `sizes` OF A COVER FRAME (2026-09-24).
 *
 * `sizes="100vw"` tells the browser the picture is as wide as the viewport.
 * That is true on a landscape desktop, where cover scales the photograph by
 * width, and false on a phone, where the hero is portrait-tall and cover
 * scales by HEIGHT: a 3:2 photograph behind a 390x844 hero is drawn about
 * 1266px wide, so the ~1200px variant a DPR 3 phone picked from "100vw" was
 * being stretched past three times its pixels.
 *
 * The drawn width is max(100vw, frameHeight * aspect). `sizes` cannot say
 * max() portably, so this says it with a media condition: when the viewport is
 * narrower than the photograph relative to the frame height (viewport aspect
 * below heightFraction * aspect), the drawn width is heightFraction * aspect
 * in vh; otherwise it is 100vw. A desktop wider than the photograph therefore
 * keeps exactly "100vw" and its bytes do not change.
 *
 * `heightFraction` is the frame's height as a fraction of the viewport
 * (1 for the tall home hero, 0.72 for an interior one). Null aspect (a ref
 * that does not parse) falls back to "100vw", the old behaviour.
 */
export function heroSizes(aspect: number | null | undefined, heightFraction = 1): string {
  if (!isNum(aspect) || aspect <= 0 || !isNum(heightFraction) || heightFraction <= 0) {
    return '100vw';
  }
  const ratio = aspect * heightFraction;
  const vh = Math.round(ratio * 100);
  return `(max-aspect-ratio: ${Math.round(ratio * 1000)}/1000) ${vh}vh, 100vw`;
}

/**
 * An arch's height / width from a caller's `--arch-ratio: W / H` in its style
 * string, or null when the style sets none. Numbers only, never stega.
 */
export function archRatioFromStyle(style: string | null | undefined): number | null {
  const m = /--arch-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/.exec(style ?? '');
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  return w > 0 && h > 0 ? h / w : null;
}
