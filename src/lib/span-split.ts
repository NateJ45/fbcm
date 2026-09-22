// Safe to edit by hand
// Stega-safe reading and splitting of Portable Text blocks.
//
// In the preview every span's text carries an invisible stega payload appended
// to its END (src/lib/preview-stega.ts). Two consequences drive this file:
//   1. Every measure (word counts, regexes, prefixes) runs on CLEANED text.
//   2. When a span is split for display, the head is taken from the cleaned
//      text and the tail from the RAW text. Because the payload is at the end,
//      an index into the cleaned string is also a valid index into the raw one
//      up to the payload, so the raw tail keeps the payload and the tail stays
//      click-to-edit in the Studio. The head is plain text (a prefix, a name,
//      a label) and is not separately editable in the canvas.
// A split whose point is not inside the FIRST span (a mark straddles it) is
// refused, and the caller falls back to rendering the block whole.
import { splitStega } from './preview-stega.ts';

export interface PtSpan {
  _type: 'span';
  _key?: string;
  text: string;
  marks?: string[];
}
export interface PtBlock {
  _type: 'block';
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: PtSpan[];
  markDefs?: unknown[];
}

const clean = (s: string): string => splitStega(s ?? '').cleaned;

export function blockText(b: PtBlock): string {
  return (b.children ?? []).map((c) => clean(c?.text ?? '')).join('');
}

export function wordCount(s: string): number {
  const m = clean(s).trim().match(/\S+/g);
  return m ? m.length : 0;
}

export function splitBlockText(
  b: PtBlock,
  headEnd: number,
  tailStart: number,
): { head: string; tail: PtBlock } | null {
  const first = b.children?.[0];
  if (!first || typeof first.text !== 'string') return null;
  const cleaned = clean(first.text);
  if (headEnd <= 0 || tailStart > cleaned.length || headEnd > tailStart) return null;
  const head = cleaned.slice(0, headEnd).trim();
  const rawTail = first.text.slice(tailStart).replace(/^\s+/, '');
  const tail: PtBlock = {
    ...b,
    children: [{ ...first, text: rawTail }, ...(b.children ?? []).slice(1)],
  };
  return head ? { head, tail } : null;
}

export function sharedPrefix(items: string[]): string {
  if (items.length < 2) return '';
  const ws = items.map((t) => clean(t).trim().split(/\s+/));
  const min = Math.min(...ws.map((w) => w.length));
  let k = 0;
  while (k < 3 && k < min - 1 && ws.every((w) => w[k].toLowerCase() === ws[0][k].toLowerCase()))
    k++;
  return ws[0].slice(0, k).join(' ');
}

export function pipedSplit(b: PtBlock): { name: string; tail: PtBlock } | null {
  const first = clean(b.children?.[0]?.text ?? '');
  const i = first.indexOf(' | ');
  if (i <= 0) return null;
  const out = splitBlockText(b, i, i + 3);
  return out ? { name: out.head, tail: out.tail } : null;
}

const SMALL = new Set(['of', 'and', 'the', 'to', 'in', 'for', 'a']);
const RUN_IN = /^([^.\-–—]{2,28}?) [-–] /;

export function runInSplit(b: PtBlock): { label: string; tail: PtBlock } | null {
  const first = clean(b.children?.[0]?.text ?? '');
  const m = first.match(RUN_IN);
  if (!m) return null;
  const words = m[1].trim().split(/\s+/);
  if (words.length > 4) return null;
  if (!words.every((w, i) => /^[A-Z]/.test(w) || (i > 0 && SMALL.has(w)))) return null;
  const out = splitBlockText(b, m[1].length, m[0].length);
  return out ? { label: out.head, tail: out.tail } : null;
}
