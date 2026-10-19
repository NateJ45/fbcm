// Safe to edit by hand
// How much wider than its frame an `object-fit: cover` photograph is drawn,
// and the `sizes` / srcset ceiling that asks the browser for enough pixels.
//
// A frame's `sizes` says how wide the FRAME is. When a landscape photo fills a
// tall frame (the window hero's side lights are 2.6 times taller than wide),
// cover scales the photo up to the frame's HEIGHT, so it is drawn far wider
// than the frame and the browser, which picks from `sizes`, fetches an image
// four or five times too small. That was the pixelated side lights on
// /ministries (2026-10-19). ArchFrame multiplies its `sizes` and its srcset
// ceiling by `coverScale`, so the fetched image matches the drawn one.

/** Drawn width / frame width for a cover-fitted photo, never below 1.
 *  `frameRatio` is the frame's height / width, `aspect` the photo's width /
 *  height, `heightShare` the part of the frame's height the photo fills (an
 *  arch with headroom draws the photo shorter than the frame). */
export function coverScale({
  frameRatio,
  aspect,
  heightShare = 1,
}: {
  frameRatio: number;
  aspect: number | null | undefined;
  heightShare?: number;
}): number {
  if (!(frameRatio > 0) || !aspect || !(aspect > 0)) return 1;
  return Math.max(1, frameRatio * aspect * heightShare);
}

/** Splits a `sizes` value on commas outside parentheses. */
function splitTopLevel(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      out.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(value.slice(start).trim());
  return out.filter(Boolean);
}

/** Multiplies the length of every `sizes` entry by `scale`, leaving each media
 *  condition alone. A plain length (px, vw, rem, em) is multiplied in place;
 *  anything else (calc, min, clamp) is wrapped in calc(). */
export function scaleSizes(sizes: string, scale: number): string {
  if (!(scale > 1)) return sizes;
  const round = (n: number) => Number(n.toFixed(2));
  return splitTopLevel(sizes)
    .map((entry) => {
      const m = entry.match(/^((?:.*\)\s+)?)(-?\d*\.?\d+)(px|vw|rem|em)$/i);
      if (m) return `${m[1]}${round(Number(m[2]) * scale)}${m[3]}`;
      const cond = entry.match(/^(.*\)\s+)(\S.*)$/);
      const [prefix, length] = cond ? [cond[1], cond[2]] : ['', entry];
      return `${prefix}calc(${length} * ${round(scale)})`;
    })
    .join(', ');
}
