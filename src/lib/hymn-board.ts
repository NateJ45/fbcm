// Safe to edit by hand
// The hymn board (2026-09-23, the Home identity pass): how a Sunday-times
// band's items and doors become the rows of the board SundayTimes.astro sets
// straight onto its brown band.
//
// Every row has a first cell and a second. What goes in the first cell comes
// from the item's own big line, read on its CLEANED text:
//   - 'time': a clock time ("9:30", "10:45 am", "11 AM"). Set as a gold
//     numeral, with any am/pm split off and set small in lower case (the
//     owner's "10:45 am", whatever the editor typed).
//   - 'word': anything else ("309 East Adams", "Online", "Available"). Set in
//     the same gold, smaller, and allowed to wrap inside its cell.
//   - 'none': an empty big line; the first cell stays empty.
//   - 'door': a door from the doors list, which has no big line at all; the
//     component draws the door glyph in its first cell.
//
// THE MAIN ROW IS DERIVED, NOT CHOSEN (CLAUDE.md rule 15). The row drawn
// largest is the one whose clock time is the service time in Site settings,
// so when the church moves the service the emphasis moves with it and there is
// no "main" switch for an editor to leave on the wrong row. With no match, no
// row is main.
//
// STEGA (CLAUDE.md, the preview rules): the big line is classified and split
// on splitStega().cleaned, never on the raw string, and the payload is put
// back on the numeral, the part that keeps the meaning, so click-to-edit
// still resolves on it in the preview. The service time is cleaned before its
// clock is read.
//
// Pure, no Astro, unit-tested in hymn-board.test.ts.
import { splitStega, reattachStega } from './preview-stega.ts';

export interface BoardItem {
  _key?: string;
  label?: string | null;
  big?: string | null;
  body?: string | null;
}

export interface BoardDoor {
  _key?: string;
  name?: string | null;
  body?: string | null;
}

export type BoardKind = 'time' | 'word' | 'none' | 'door';

export interface BoardRow {
  key: string;
  kind: BoardKind;
  /** The first cell's text: the numeral for a time (payload reattached), the words otherwise. */
  big: string;
  /** "am" or "pm", lower case, for a time that carried one; empty otherwise. */
  meridiem: string;
  label: string;
  body: string;
  /** The row whose clock time is the service time. At most one per board. */
  main: boolean;
}

const TIME = /^(\d{1,2}(?:[:.]\d{2})?)\s*([ap])\.?\s*m\.?$|^(\d{1,2}[:.]\d{2})$/i;

/** "10:45 am" -> "10:45"; "11 AM" -> "11:00"; "Sundays at 10:45 am" -> "10:45"; no time -> null. */
export function clockOf(text: string | null | undefined): string | null {
  const cleaned = splitStega(text ?? '').cleaned;
  const m =
    cleaned.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(?:[ap]\.?\s*m\b)/i) ??
    cleaned.match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  return `${Number(m[1])}:${m[2] ?? '00'}`;
}

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

/** The board's rows: every item with something in it, then every door. */
export function boardRows(
  items: readonly (BoardItem | null | undefined)[] = [],
  doors: readonly (BoardDoor | null | undefined)[] = [],
  serviceTime?: string | null,
): BoardRow[] {
  const serviceClock = clockOf(serviceTime);
  let mainTaken = false;
  const rows: BoardRow[] = [];

  items.forEach((item, i) => {
    if (!item || !(item.label || item.big || item.body)) return;
    const read = readBig(item.big);
    const main =
      !mainTaken &&
      read.kind === 'time' &&
      serviceClock !== null &&
      clockOf(`${splitStega(read.big).cleaned} ${read.meridiem}`) === serviceClock;
    if (main) mainTaken = true;
    rows.push({
      key: item._key ?? `item-${i}`,
      kind: read.kind,
      big: read.big,
      meridiem: read.meridiem,
      label: item.label ?? '',
      body: item.body ?? '',
      main,
    });
  });

  doors.forEach((door, i) => {
    if (!door || !(door.name || door.body)) return;
    rows.push({
      key: door._key ?? `door-${i}`,
      kind: 'door',
      big: '',
      meridiem: '',
      label: door.name ?? '',
      body: door.body ?? '',
      main: false,
    });
  });

  return rows;
}

/** The glyph beside each note, by position: a door, the basin, a window. */
export const NOTE_GLYPHS = ['door', 'basin', 'window'] as const;
export function noteGlyph(index: number): (typeof NOTE_GLYPHS)[number] {
  return NOTE_GLYPHS[index % NOTE_GLYPHS.length] as (typeof NOTE_GLYPHS)[number];
}
