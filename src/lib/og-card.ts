// Foundation, edit with care
// The share card's title fitting (2026-09-24, the craft-details pass). Pure: the
// generator (scripts/generate-og-pages.mjs) hands in a measure function backed
// by the real Castoro Titling metrics, and the tests hand in a fake one.
//
// THE RULES. The title is set as large as it will go, from a ladder of sizes,
// into at most three lines (four once the size is small), and a line breaks
// only between words: a word never splits, whatever its length. At a given
// size the fewest lines win, and among layouts with that many lines the one
// whose longest line is shortest wins, so a two-line title reads as two
// balanced lines rather than a full line and an orphan. A title too long for
// four lines at the smallest size is cut at a word and ends in an ellipsis
// (the card is a thumbnail; the page itself carries the whole title). A single
// word wider than the card at the smallest ladder size is set smaller still,
// down to FLOOR, rather than broken.

export type Measure = (text: string, size: number) => number;

export interface FitOptions {
  /** The widest a line may be, in the card's pixels. */
  maxWidth: number;
  /** Candidate sizes, largest first. */
  sizes?: readonly number[];
  /** Lines allowed at a size: three above `smallAt`, four at or below it. */
  maxLines?: number;
  smallAt?: number;
  /**
   * Whether `lines` lines at `size` fit the card's height with everything
   * else on it (the eyebrow, the date line). Sizes that fail are skipped.
   */
  fitsHeight?: (size: number, lines: number) => boolean;
}

export interface FitResult {
  size: number;
  lines: string[];
  /** True when the title had to be cut to fit. */
  truncated: boolean;
}

export const TITLE_SIZES = [112, 104, 96, 88, 80, 72, 66, 60, 54, 48, 44] as const;
const FLOOR = 28;

const words = (text: string): string[] => text.trim().split(/\s+/).filter(Boolean);

/**
 * The best split of `ws` into exactly `n` lines at `size`: every line within
 * maxWidth, the longest line as short as possible. Null when none fits.
 */
function bestSplit(ws: string[], n: number, size: number, measure: Measure, maxWidth: number) {
  let best: { lines: string[]; widest: number } | null = null;
  const walk = (start: number, left: number, acc: string[], widest: number) => {
    if (best && widest >= best.widest) return;
    if (left === 1) {
      const line = ws.slice(start).join(' ');
      const w = measure(line, size);
      if (w > maxWidth) return;
      const wid = Math.max(widest, w);
      if (!best || wid < best.widest) best = { lines: [...acc, line], widest: wid };
      return;
    }
    // Leave at least one word for each remaining line.
    for (let end = start + 1; end <= ws.length - (left - 1); end++) {
      const line = ws.slice(start, end).join(' ');
      const w = measure(line, size);
      if (w > maxWidth) break;
      walk(end, left - 1, [...acc, line], Math.max(widest, w));
    }
  };
  walk(0, n, [], 0);
  return best as { lines: string[]; widest: number } | null;
}

/** The fewest lines `ws` needs at `size`, by greedy wrapping; Infinity if a word is too wide. */
function linesNeeded(ws: string[], size: number, measure: Measure, maxWidth: number): number {
  let lines = 1;
  let current = '';
  for (const w of ws) {
    if (measure(w, size) > maxWidth) return Infinity;
    const next = current ? `${current} ${w}` : w;
    if (measure(next, size) <= maxWidth) current = next;
    else {
      lines += 1;
      current = w;
    }
  }
  return lines;
}

export function fitTitle(text: string, measure: Measure, opts: FitOptions): FitResult {
  const { maxWidth, sizes = TITLE_SIZES, maxLines = 3, smallAt = 60, fitsHeight } = opts;
  const ws = words(text);
  if (ws.length === 0) return { size: sizes[0] ?? 96, lines: [], truncated: false };

  for (const size of sizes) {
    const allowed = size <= smallAt ? maxLines + 1 : maxLines;
    const need = linesNeeded(ws, size, measure, maxWidth);
    if (need > allowed) continue;
    if (fitsHeight && !fitsHeight(size, need)) continue;
    const split = bestSplit(ws, need, size, measure, maxWidth);
    if (split) return { size, lines: split.lines, truncated: false };
  }

  const smallest = sizes[sizes.length - 1] ?? 44;
  // A word wider than the card even at the smallest size: go smaller, never break it.
  const widestWord = Math.max(...ws.map((w) => measure(w, smallest)));
  let size = smallest;
  if (widestWord > maxWidth) {
    size = Math.max(FLOOR, Math.floor((smallest * maxWidth) / widestWord));
  }
  const allowed = maxLines + 1;
  if (linesNeeded(ws, size, measure, maxWidth) <= allowed) {
    const split = bestSplit(ws, linesNeeded(ws, size, measure, maxWidth), size, measure, maxWidth);
    if (split) return { size, lines: split.lines, truncated: false };
  }

  // Too long for the card: fill `allowed` lines greedily and end on an ellipsis.
  const lines: string[] = [];
  let current = '';
  let i = 0;
  for (; i < ws.length; i++) {
    const w = ws[i] ?? '';
    const next = current ? `${current} ${w}` : w;
    if (measure(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    lines.push(current);
    current = w;
    if (lines.length === allowed) break;
  }
  if (lines.length < allowed && current) lines.push(current);
  let last = lines[lines.length - 1] ?? '';
  // Take words off the last line until it has room for the ellipsis.
  while (last.includes(' ') && measure(`${last}…`, size) > maxWidth) {
    last = last.replace(/\s+\S+$/, '');
  }
  lines[lines.length - 1] = `${last.replace(/[\s,.;:!?-]+$/, '')}…`;
  return { size, lines, truncated: true };
}

/**
 * Straight quotes to typographic ones, for a title set large: "God's" becomes
 * "God’s", 'x' and "x" become curly pairs. Nothing else changes.
 */
export function typeset(text: string): string {
  return text
    .replace(/(\w)'(\w)/g, '$1’$2')
    .replace(/(^|[\s([{—-])'/g, '$1‘')
    .replace(/'/g, '’')
    .replace(/(^|[\s([{—-])"/g, '$1“')
    .replace(/"/g, '”');
}
