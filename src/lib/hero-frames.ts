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
