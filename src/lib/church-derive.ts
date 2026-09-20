// scaffold-file: church
// Pure helpers behind the church blocks. Nothing here touches Sanity or the DOM,
// so every rule that decides what a visitor sees is unit-tested.

export const STAFF_GROUPS = ['pastors', 'coordination', 'support'] as const;
export type StaffGroup = (typeof STAFF_GROUPS)[number];

interface Groupable {
  group?: string | null;
  order?: number | null;
  name: string;
}

/** Stable: order ascending, then name. Anyone without a known group is support staff. */
export function groupStaff<T extends Groupable>(members: T[]): Record<StaffGroup, T[]> {
  const out = { pastors: [] as T[], coordination: [] as T[], support: [] as T[] };
  for (const m of members) {
    const g = (STAFF_GROUPS as readonly string[]).includes(m.group ?? '')
      ? (m.group as StaffGroup)
      : 'support';
    out[g].push(m);
  }
  const by = (a: Groupable, b: Groupable) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.name.localeCompare(b.name);
  for (const g of STAFF_GROUPS) out[g].sort(by);
  return out;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * "Sermon preview, week of January 17, 2024". Falls back to the bare eyebrow.
 *
 * The one sermon eyebrow on the site: blog-derive.ts's weekOfEyebrow() cleans a
 * stega payload off the date and hands it straight here, so the blog index, the
 * category pages and the post page all read the same sentence.
 *
 * US date order (month first), because every other date on this site is written
 * that way: JournalCard, the post header and the church bands all format with
 * `toLocaleDateString('en-US')`. It read "15 January 2024" while nothing
 * imported it, which is the moment to fix it rather than ship two orders.
 */
export function weekOfLabel(publishedAt: string): string {
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return 'Sermon preview';
  return `Sermon preview, week of ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Newest year first; undated documents last; ties by title. Never mutates. */
export function sortDocsByYearDesc<T extends { year?: number | null; title: string }>(
  docs: T[],
): T[] {
  return [...docs].sort(
    (a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity) || a.title.localeCompare(b.title),
  );
}
