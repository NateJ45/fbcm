// Safe to edit by hand
// scaffold-file: church
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
// largest is the one whose clock time is the service time in Site settings
// (and, when both carry an am/pm, the same one: 10:45 pm is not 10:45 am),
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
import { readBig } from './clock-read.ts';

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

/** The clock and meridiem a string names, if any. */
function timeOf(
  text: string | null | undefined,
): { clock: string; meridiem: 'am' | 'pm' | null } | null {
  const cleaned = splitStega(text ?? '').cleaned;
  const withMeridiem = cleaned.match(/(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\b/i);
  const m = withMeridiem ?? cleaned.match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const meridiem = withMeridiem ? (withMeridiem[3]?.toLowerCase() === 'p' ? 'pm' : 'am') : null;
  return { clock: `${Number(m[1])}:${m[2] ?? '00'}`, meridiem };
}

/** "10:45 am" -> "10:45"; "11 AM" -> "11:00"; "Sundays at 10:45 am" -> "10:45"; no time -> null. */
export function clockOf(text: string | null | undefined): string | null {
  return timeOf(text)?.clock ?? null;
}

/**
 * Whether two strings name the same time: the same clock, and the same
 * meridiem when BOTH carry one ("10:45 pm" is not "10:45 am"; a bare "10:45"
 * matches either).
 */
export function sameTime(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = timeOf(a);
  const y = timeOf(b);
  if (!x || !y || x.clock !== y.clock) return false;
  return x.meridiem === null || y.meridiem === null || x.meridiem === y.meridiem;
}

// readBig moved to clock-read.ts (2026-09-24) so the hero facts, which are not a
// church-capability file, can use it; re-exported here for the board's callers.
export { readBig };

/** The board's rows: every item with something in it, then every door. */
export function boardRows(
  items: readonly (BoardItem | null | undefined)[] = [],
  doors: readonly (BoardDoor | null | undefined)[] = [],
  serviceTime?: string | null,
): BoardRow[] {
  const hasServiceTime = clockOf(serviceTime) !== null;
  let mainTaken = false;
  const rows: BoardRow[] = [];

  items.forEach((item, i) => {
    if (!item || !(item.label || item.big || item.body)) return;
    const read = readBig(item.big);
    const main =
      !mainTaken &&
      read.kind === 'time' &&
      hasServiceTime &&
      sameTime(`${splitStega(read.big).cleaned} ${read.meridiem}`, serviceTime);
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

/**
 * The gold tag on a door (2026-09-24, the Visit identity pass): a door whose
 * own directions say it is wheelchair accessible is tagged so, read from the
 * church's words rather than a checkbox (CLAUDE.md rule 15). Null otherwise.
 */
export function doorTag(body: string | null | undefined): string | null {
  const text = splitStega(body ?? '').cleaned;
  return /\bwheel-?\s?chair[\s-]+accessible\b/i.test(text) ? 'Wheelchair accessible' : null;
}

/**
 * A plain-text field split into paragraphs on blank lines, each trimmed. The
 * stega payload (at the end of the raw string) goes back on the LAST
 * paragraph, so click-to-edit still resolves on the text in the preview.
 */
export function textParagraphs(raw: string | null | undefined): string[] {
  const { cleaned, encoded } = splitStega(raw ?? '');
  const paras = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length > 0 && encoded) {
    paras[paras.length - 1] = reattachStega(paras[paras.length - 1], encoded);
  }
  return paras;
}
