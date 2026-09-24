// Safe to edit by hand
// scaffold-file: church
// The door-step path (2026-09-24, the Visit identity pass; the prototype's
// `.morning`, docs/superpowers/prototypes/2026-09-23-visit/visit.html): how a
// timeline's rows become the numbered steps Timeline.astro draws, and which
// rows land after the path instead.
//
// Everything here is DERIVED from what the editor already typed (CLAUDE.md
// rule 15); no row carries a "kind" or a "main" switch:
//
//   - A row's marker is read by hymn-board's readBig: a clock time ("9:30",
//     "10:45 am") becomes a numeral with its am/pm split off, anything else
//     ("1859 to 1862") stays words, and an empty marker is a step with no
//     time at all (Visit's Welcome and Check-In, before the first class).
//   - The step whose clock time is the service time in Site settings is the
//     main step, drawn largest, exactly as the hymn board picks its main row.
//   - THE LANDING. On a timeline that tells the time, a row AFTER the last
//     timed row whose marker is words ("First Sundays") is not a step in the
//     morning but a change to it, so it is set after the path as a closing
//     note (Communion). A timeline of years has no timed rows, so every row
//     stays a step and nothing lands.
//   - Numbering is only for a real sequence (rule 11): every step is numbered
//     1..n in the order the editor put them; landings are not numbered.
//
// A class line ("Friendship Class (B-05): Led by Pastor Jonathan, ...") is
// read by classEntry(): the name, the room in brackets and the description,
// so the room can be drawn as the gold-ruled room tag. A note ("Donut [Semi-]
// Hour (Fellowship Hall)") is split the same way by noteParts().
//
// STEGA (CLAUDE.md, the preview rules): every classification runs on
// splitStega().cleaned. Where a string is split for display, the payload is
// put back on the part that keeps the meaning, so click-to-edit still
// resolves in the preview.
//
// Pure, no Astro, unit-tested in morning-path.test.ts.
import { splitStega, reattachStega } from './preview-stega.ts';
import { readBig, sameTime } from './hymn-board.ts';

export interface PathRowIn {
  _key?: string;
  marker?: string | null;
  title?: string | null;
  note?: string | null;
}

export interface PathStep<R extends PathRowIn = PathRowIn> {
  row: R;
  key: string;
  /** 1-based position among the steps. */
  n: number;
  kind: 'time' | 'word' | 'none';
  /** The numeral for a time (payload reattached), the words otherwise. */
  big: string;
  meridiem: string;
  /** The step whose clock time is the service time. At most one. */
  main: boolean;
}

export interface PathPlan<R extends PathRowIn = PathRowIn> {
  steps: PathStep<R>[];
  /** Rows set after the path as closing notes. */
  landings: R[];
  /** True when at least one step tells the time. */
  timed: boolean;
}

const cleaned = (s: string | null | undefined) => splitStega(s ?? '').cleaned.trim();

/** The steps and landings of one timeline. Rows with neither a marker nor a title are dropped. */
export function pathPlan<R extends PathRowIn>(
  rows: readonly (R | null | undefined)[] = [],
  serviceTime?: string | null,
): PathPlan<R> {
  const valid = rows.filter((r): r is R => !!r && !!(cleaned(r.marker) || cleaned(r.title)));
  const reads = valid.map((r) => readBig(r.marker));
  const lastTimed = reads.map((r) => r.kind).lastIndexOf('time');
  const timed = lastTimed !== -1;

  const steps: PathStep<R>[] = [];
  const landings: R[] = [];
  let mainTaken = false;
  valid.forEach((row, i) => {
    const read = reads[i];
    if (timed && i > lastTimed && read.kind === 'word') {
      landings.push(row);
      return;
    }
    const main =
      !mainTaken &&
      read.kind === 'time' &&
      !!serviceTime &&
      sameTime(`${splitStega(read.big).cleaned} ${read.meridiem}`, serviceTime);
    if (main) mainTaken = true;
    steps.push({
      row,
      key: row._key ?? `step-${i}`,
      n: steps.length + 1,
      kind: read.kind,
      big: read.big,
      meridiem: read.meridiem,
      main,
    });
  });
  return { steps, landings, timed };
}

/**
 * Whether the path climbs as a staircase. Only a short path with pictures
 * does: a long one (History's seven eras) would walk off the page, and a path
 * with no pictures reads better as one straight line of numbered steps.
 */
export function pathStairs(steps: number, withPictures: boolean): boolean {
  return withPictures && steps >= 2 && steps <= 5;
}

const CLASS_LINE = /^(.+?)\s*\(([^()]+)\)\s*:\s*(\S[\s\S]*)$/;

/**
 * "Name (Room): description" -> its three parts, read on the cleaned text,
 * or null when the line is not a class line. The description keeps the raw
 * tail (and with it any stega payload) so the paragraph stays click-to-edit.
 */
export function classEntry(
  raw: string | null | undefined,
): { name: string; room: string; desc: string } | null {
  const { cleaned: text, encoded } = splitStega(raw ?? '');
  const m = text.trim().match(CLASS_LINE);
  if (!m) return null;
  return { name: m[1].trim(), room: m[2].trim(), desc: reattachStega(m[3].trim(), encoded) };
}

/**
 * A step's note: the words outside brackets are the place ("Donut [Semi-]
 * Hour"), the words inside are the room tag ("Fellowship Hall"). A note with
 * no brackets is all room tag ("Sanctuary"). Square brackets are the church's
 * own punctuation and are left alone.
 */
export function noteParts(raw: string | null | undefined): { place: string; room: string } {
  const { cleaned: text, encoded } = splitStega(raw ?? '');
  const t = text.trim();
  if (!t) return { place: '', room: '' };
  const m = t.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (!m) return { place: '', room: reattachStega(t, encoded) };
  return { place: m[1].trim(), room: reattachStega(m[2].trim(), encoded) };
}

/**
 * A heading like "Nursery Care (104)" -> { title, room }, or null when it
 * carries no room in brackets. Used by ImageText's room board.
 */
export function roomHeading(
  raw: string | null | undefined,
): { title: string; room: string } | null {
  const { cleaned: text, encoded } = splitStega(raw ?? '');
  const m = text.trim().match(/^(.+?)\s*\(([^()]+)\)$/);
  if (!m) return null;
  return { title: reattachStega(m[1].trim(), encoded), room: m[2].trim() };
}
