// Safe to edit by hand
// One short line read as a clock time or as words (2026-09-24, moved out of
// hymn-board.ts so the hero facts can share it without depending on the
// church capability). A clock time ("9:30", "10:45 am", "11 AM") is split into
// its numeral and a lower-case meridiem; anything else is words; an empty
// line is none. Read on the stega-CLEANED text, with the payload put back on
// the numeral so click-to-edit still resolves in the preview. Unit-tested
// through hymn-board.test.ts, which imports it by its old name.
import { splitStega, reattachStega } from './preview-stega.ts';

const TIME = /^(\d{1,2}(?:[:.]\d{2})?)\s*([ap])\.?\s*m\.?$|^(\d{1,2}[:.]\d{2})$/i;

/** Classify one big line and split it into numeral and meridiem. */
export function readBig(raw: string | null | undefined): {
  kind: 'time' | 'word' | 'none';
  big: string;
  meridiem: string;
} {
  const { cleaned, encoded } = splitStega(raw ?? '');
  const text = cleaned.trim();
  if (!text) return { kind: 'none', big: '', meridiem: '' };
  const m = text.match(TIME);
  if (!m) return { kind: 'word', big: reattachStega(text, encoded), meridiem: '' };
  const numeral = (m[1] ?? m[3] ?? text).replace('.', ':');
  const meridiem = m[2] ? `${m[2].toLowerCase()}m` : '';
  return { kind: 'time', big: reattachStega(numeral, encoded), meridiem };
}
