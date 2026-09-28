// Safe to edit by hand
// The hero headline, word by word (2026-09-27, `feat/hero-motion`).
//
// The photo and split heroes raise their headline one word at a time, the way
// Highland Park Presbyterian's hero does with GSAP SplitText, but in CSS and
// rendered on the server: each word is an inline-block that clips (overflow
// hidden) and the word inside it rises from below (the .hero-word rules in
// globals.css). So Hero.astro needs the headline as a list of words, and this
// is where it gets them.
//
// THE STEGA RULE (CLAUDE.md, the preview rules). In the Presentation preview
// the headline carries an invisible stega run, and U+FEFF, one of its
// characters, matches `\s`: splitting the raw string on whitespace would
// shatter the run into dozens of fake words. So each segment is split on its
// CLEANED text (splitStega), and the run is put back on the end of the LAST
// word (reattachStega), which is where the encoder put it, so click-to-edit
// still finds the headline. On the live site there is no run and nothing is
// added.
//
// ACCENTS. The script accent and the colour accent (splitHeadingAccent) arrive
// here as segments with an accent. A word keeps each piece's accent, so an
// accent that is part of a word ("Muncie" in "Muncie's") still styles only its
// own letters, and a word never splits across two rising boxes.
//
// A word is a run of anything but whitespace, where a no-break space counts as
// part of the word: an editor who glued two words with one wants them to
// travel, and wrap, together.

import { reattachStega, splitStega } from './preview-stega.ts';

export type WordAccent = 'script' | 'colour';

/** A piece of the headline with one style. */
export interface HeroSegment {
  text: string;
  accent?: WordAccent | null;
}

/** One word: its pieces, in order, each with its accent (none for plain text). */
export interface HeroWord {
  pieces: HeroSegment[];
}

/** Whitespace that separates words: every `\s` except the no-break space. */
const GAP = /[^\S ]/;

/** The headline's words, from its segments, with any stega run on the last. */
export function heroWords(segments: HeroSegment[]): HeroWord[] {
  let encoded = '';
  const words: HeroWord[] = [];
  let word: HeroSegment[] | null = null;
  for (const seg of segments) {
    const split = splitStega(seg?.text ?? '');
    if (!encoded) encoded = split.encoded;
    const accent = seg?.accent ?? null;
    for (const ch of split.cleaned) {
      if (GAP.test(ch)) {
        word = null;
        continue;
      }
      if (!word) {
        word = [];
        words.push({ pieces: word });
      }
      const last = word[word.length - 1];
      if (last && (last.accent ?? null) === accent) last.text += ch;
      else word.push(accent ? { text: ch, accent } : { text: ch });
    }
  }
  if (encoded && words.length > 0) {
    const pieces = words[words.length - 1].pieces;
    const tail = pieces[pieces.length - 1];
    tail.text = reattachStega(tail.text, encoded);
  }
  return words;
}

/** The accent split a hero hands over (a HeadingAccentResult, or a miss). */
interface AccentSplit {
  found: boolean;
  before: string;
  word: string;
  after: string;
}

/**
 * The headline's segments: the script accent first (one accent per heading),
 * else the colour accent when the layout draws one, else the headline whole.
 */
export function headlineSegments(
  headline: string,
  script: AccentSplit,
  colour?: AccentSplit | null,
): HeroSegment[] {
  const around = (a: AccentSplit, accent: WordAccent): HeroSegment[] => [
    { text: a.before },
    { text: a.word, accent },
    { text: a.after },
  ];
  if (script.found) return around(script, 'script');
  if (colour?.found) return around(colour, 'colour');
  return [{ text: headline ?? '' }];
}
