// Safe to edit by hand.
// =============================================================================
// quote-text: turn a quote field's ONE plain string into paragraphs and lists
// (2026-10-05, fix/long-quote-section)
// =============================================================================
// The church secretary pasted the 2005 ABCUSA identity statement into a
// quoteSection's `quote`: several paragraphs separated by blank lines and four
// lines that start with a bullet. The field is a plain string, so the data is
// right and the rendering has to cope (the church edits copy freely, and no
// schema change or dataset write is wanted). QuoteBlock calls this and draws
// <p> and <ul> from the result.
//
// RENDER-NEUTRAL FOR ORDINARY QUOTES. A quote that parses to a single
// paragraph (every short pull quote, and the long one-paragraph testimonial on
// /wedding) reports `structured: false`, and QuoteBlock then prints the string
// exactly as it did before this file existed.
//
// STEGA (CLAUDE.md preview rules, rule 8b). In the Studio preview the string
// arrives with an invisible run appended. Structure and word counts are worked
// out on the CLEANED text only; the run is then put back on the end of the last
// piece of text, so click-to-edit still resolves and nothing visible changes.
// =============================================================================
import { reattachStega, splitStega } from './preview-stega.ts';

export type QuoteBlockPart =
  { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };

export interface ParsedQuote {
  blocks: QuoteBlockPart[];
  /** True when the quote has more than one block, or is a list (needs real markup). */
  structured: boolean;
  /** Words in the visible text. Counted on the cleaned string. */
  wordCount: number;
}

/** Over this many words a one-paragraph quote steps down from the display size. */
export const LONG_QUOTE_WORDS = 40;

// A bullet is one of the four glyphs. "-" and "*" need a space after them (so
// "-5 degrees" and "*asterisked" are not bullets); the dot glyphs do not.
const BULLET = /^(?:[•·]\s*|[-*]\s+)/;

/** Parse a quote string. Pure; never throws; an empty string gives no blocks. */
export function parseQuote(raw: string | null | undefined): ParsedQuote {
  const { cleaned, encoded } = splitStega(raw ?? '');
  const lines = cleaned.replace(/\r\n?/g, '\n').split('\n');

  const blocks: QuoteBlockPart[] = [];
  let paragraph: string[] = [];
  // True right after a bullet line with no blank line since: a plain line then
  // continues that bullet instead of starting a paragraph.
  let afterBullet = false;

  const flush = () => {
    const text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ kind: 'paragraph', text });
    paragraph = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flush();
      afterBullet = false;
      continue;
    }
    if (BULLET.test(t)) {
      flush();
      const item = t.replace(BULLET, '').trim();
      const last = blocks[blocks.length - 1];
      // A run of bullets is one list, even with blank lines between them.
      if (last && last.kind === 'list') last.items.push(item);
      else blocks.push({ kind: 'list', items: [item] });
      afterBullet = true;
      continue;
    }
    if (afterBullet) {
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'list') {
        last.items[last.items.length - 1] += ' ' + t;
        continue;
      }
    }
    paragraph.push(t);
  }
  flush();

  const wordCount = blocks
    .flatMap((b) => (b.kind === 'paragraph' ? [b.text] : b.items))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  // Put the stega run back on the last piece of visible text.
  const last = blocks[blocks.length - 1];
  if (encoded && last) {
    if (last.kind === 'paragraph') last.text = reattachStega(last.text, encoded);
    else {
      const i = last.items.length - 1;
      last.items[i] = reattachStega(last.items[i], encoded);
    }
  }

  return { blocks, structured: blocks.length > 1 || last?.kind === 'list', wordCount };
}
