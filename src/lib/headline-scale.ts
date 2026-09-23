// Safe to edit by hand
// Hero headlines are set by their OWN length, never by a field (same
// philosophy as rich-shape.ts and photo-shape.ts). Pure and build-time: every
// measure runs on the stega-CLEANED text, so the preview classifies a headline
// exactly as the live site does. The caller still renders the RAW headline, so
// its stega payload survives and click-to-edit keeps working.
//
// Three scales:
//   poster   - a short line ("Since 1859.", "Married here.") keeps the
//              art-direction pass's look: Castoro Titling capitals at the
//              page's loudest size, a 12ch measure.
//   title    - a medium line ("Your first Sunday, start to finish.") stays in
//              titling capitals one size step down on a wider measure, so it
//              sets in two or three lines at 1280px instead of four.
//   sentence - a long, sentence-like line (the 76-character /who-we-are
//              statement) is set in the reading face, sentence case, normal
//              tracking, near h2 size, on a ~22ch measure. Ten lines of
//              capitals is a wall; three lines of Castoro is a statement.
//
// THE LONGEST WORD DEMOTES. No scale may break a word mid-word at 320px. The
// measured widths behind the limits below (Castoro Titling capitals average
// about 0.72em a character; the phone column at 320px is 280px):
//   poster (short), text-h1 floor 2.35rem = 37.6px -> 10 capitals fit
//     ("COMMUNITY." measured 270px, the reason the floor was lowered 2026-09-22)
//   poster (tall), text-display at 320px = 46.4px  -> 9 capitals fit
//     ("PROCLAIM." measured inside 280px)
//   title (short), text-title floor 2rem = 32px     -> 12 capitals fit
//   title (tall), text-h1 floor 37.6px              -> 10 capitals fit
// A headline whose longest word is over its scale's limit drops to the next
// scale down, whatever its length.
import { splitStega } from './preview-stega.ts';

export type HeadlineScale = 'poster' | 'title' | 'sentence';

export interface HeadlineMeasure {
  chars: number;
  words: number;
  longest: number;
}

interface Limits {
  chars: number;
  words: number;
  longest: number;
}

/** Poster on an interior hero: "Since 1859.", "Get in touch.", "Married here." */
export const POSTER_SHORT: Limits = { chars: 16, words: 3, longest: 10 };
/** Poster on the tall (home) hero, which has the whole first screen to fill:
    "Praise and proclaim." (20 characters) stays a poster there. */
export const POSTER_TALL: Limits = { chars: 24, words: 4, longest: 9 };
/** Title: up to 48 characters and 8 words, set in two or three lines. */
export const TITLE: Limits = { chars: 48, words: 8, longest: 12 };
/** Title on the tall hero is set at text-h1 (floor 37.6px), so its longest
    word is held to the interior poster's 10 capitals. */
export const TITLE_TALL: Limits = { ...TITLE, longest: 10 };

export function measureHeadline(text: string | null | undefined): HeadlineMeasure {
  const cleaned = splitStega(text ?? '')
    .cleaned.replace(/\s+/g, ' ')
    .trim();
  const words = cleaned ? cleaned.split(' ') : [];
  return {
    chars: cleaned.length,
    words: words.length,
    longest: words.reduce((n, w) => Math.max(n, w.length), 0),
  };
}

const within = (m: HeadlineMeasure, l: Limits) =>
  m.chars <= l.chars && m.words <= l.words && m.longest <= l.longest;

export function headlineScale(
  text: string | null | undefined,
  opts: { tall: boolean } = { tall: false },
): HeadlineScale {
  const m = measureHeadline(text);
  if (m.chars === 0) return 'poster';
  if (within(m, opts.tall ? POSTER_TALL : POSTER_SHORT)) return 'poster';
  if (within(m, opts.tall ? TITLE_TALL : TITLE)) return 'title';
  return 'sentence';
}

/**
 * The h1 classes for a scale. One table so Hero, the text-only hero in
 * SectionHeading and the journal Opener cannot drift apart. The poster rows
 * are the art-direction pass's classes, unchanged. Every row sets the face
 * AND the casing explicitly, because the base h1 rule in globals.css is
 * titling capitals and a sentence has to opt out of both.
 */
export function headlineClass(scale: HeadlineScale, opts: { tall: boolean }): string {
  if (scale === 'poster') {
    return opts.tall
      ? 'font-display uppercase tracking-[0.01em] font-normal text-display max-w-[12ch]'
      : 'font-display uppercase tracking-[0.01em] font-normal text-h1 leading-none max-w-[12ch]';
  }
  if (scale === 'title') {
    return opts.tall
      ? 'font-display uppercase tracking-[0.01em] font-normal text-h1 leading-none max-w-[18ch]'
      : 'font-display uppercase tracking-[0.01em] font-normal text-title leading-[1.02] max-w-[18ch]';
  }
  return 'font-body normal-case tracking-normal font-normal text-h2 leading-[1.12] max-w-[22ch]';
}
