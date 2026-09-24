// Safe to edit by hand
// A body written as rooms (2026-09-24, the Visit identity pass): headings that
// name their room in brackets, read into a room board for ImageText. Generic
// (not a church-capability file) because ImageText is a core block. Re-exported
// by morning-path.ts and unit-tested in morning-path.test.ts.
import { splitStega, reattachStega } from './preview-stega.ts';

export interface SegBlock {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: { text?: string }[];
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

export interface RoomEntry<B extends SegBlock = SegBlock> {
  key: string;
  title: string;
  room: string;
  blocks: B[];
}

/**
 * A body written as rooms (Visit's "Where the children go": "Nursery Care
 * (104)", "Family Room (105)", ...) read as a room board: every small heading
 * (h3 or h4) names its room in brackets, and each heading owns the blocks
 * under it. Null unless there are at least two headings and EVERY heading
 * names a room, so an ordinary body is never drawn as a board by accident.
 * `intro` is whatever comes before the first heading.
 */
export function roomBoard<B extends SegBlock>(
  blocks: readonly B[] | null | undefined,
): { intro: B[]; rooms: RoomEntry<B>[] } | null {
  const list = blocks ?? [];
  const isHead = (b: B) => !b.listItem && (b.style === 'h3' || b.style === 'h4');
  const heads = list.filter(isHead);
  if (heads.length < 2) return null;
  const intro: B[] = [];
  const rooms: RoomEntry<B>[] = [];
  for (const b of list) {
    if (isHead(b)) {
      const parsed = roomHeading((b.children ?? []).map((c) => c?.text ?? '').join(''));
      if (!parsed) return null;
      rooms.push({ key: b._key ?? `room-${rooms.length}`, ...parsed, blocks: [] });
    } else if (rooms.length === 0) intro.push(b);
    else rooms[rooms.length - 1].blocks.push(b);
  }
  return { intro, rooms };
}
