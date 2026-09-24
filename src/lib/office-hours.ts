// scaffold-file: church
// Safe to edit by hand
// The office door's rows (2026-09-24, the utility identity pass). The hours
// live once, as Portable Text in Site settings (officeHours, pastoralHours),
// where the footer also reads them (CLAUDE.md rule 15). Hours.astro draws each
// line as a row on the office door: the days on the left, the times on the
// right. That split is DERIVED from the line the office typed, never stored:
// "Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm" is days, a colon, and
// times. A line with no colon ("Hours may change on holidays.") is a note and
// prints whole, under the rows.
//
// STEGA-SAFE (CLAUDE.md, the preview rules). In /preview/** every span's text
// carries an invisible payload in characters that `\s` matches, so the colon is
// looked for in the CLEANED text, both halves are cut from it, and the payload
// is put back on the days so click-to-edit still resolves the row to its field.
// A line that carries a link or any other mark is a note too: splitting it
// would drop the mark, so it keeps its own block and PortableTextStatic draws
// it exactly as typed.
import { splitStega, reattachStega } from './preview-stega.ts';

export interface HoursSpan {
  _type?: string;
  text?: string;
  marks?: string[];
}

export interface HoursBlock {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: HoursSpan[];
  markDefs?: unknown[];
}

export type HoursLine<B extends HoursBlock = HoursBlock> =
  | { kind: 'row'; key: string; days: string; times: string }
  | { kind: 'note'; key: string; block: B };

const plainText = (block: HoursBlock): string | null => {
  const spans = block.children ?? [];
  if (spans.some((s) => (s.marks ?? []).length > 0)) return null;
  return spans.map((s) => s.text ?? '').join('');
};

/** Each typed line of hours as a row (days: times) or a note, in order. */
export function hoursLines<B extends HoursBlock>(
  blocks: readonly B[] | null | undefined,
): HoursLine<B>[] {
  const out: HoursLine<B>[] = [];
  (blocks ?? []).forEach((block, i) => {
    if (!block || block._type !== 'block') return;
    const key = block._key ?? `line-${i}`;
    const text = plainText(block);
    if (text === null) {
      out.push({ kind: 'note', key, block });
      return;
    }
    const { cleaned, encoded } = splitStega(text);
    if (cleaned.trim() === '') return;
    const colon = cleaned.indexOf(':');
    // A colon inside a clock time ("9:30 am") is not the divider: the days
    // come before the first colon that is followed by a space or the end.
    const divider = (() => {
      for (let at = colon; at !== -1; at = cleaned.indexOf(':', at + 1)) {
        const next = cleaned[at + 1];
        if (next === undefined || /\s/.test(next)) return at;
      }
      return -1;
    })();
    const days = divider > 0 ? cleaned.slice(0, divider).trim() : '';
    const times = divider > 0 ? cleaned.slice(divider + 1).trim() : '';
    if (!days || !times) {
      out.push({ kind: 'note', key, block });
      return;
    }
    out.push({ kind: 'row', key, days: reattachStega(days, encoded), times });
  });
  return out;
}
