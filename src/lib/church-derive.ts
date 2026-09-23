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

/**
 * Newest year first; undated documents last; ties keep the order they arrived
 * in. Never mutates.
 *
 * The tiebreak used to be the title, which is alphabetical, and alphabetical is
 * wrong for the one list that has many rows in a single year: twelve 2020
 * issues of The Visitor came out April, August, December, February. Inside a
 * year the ORDER OF THE ARRAY is the answer, because that is the order an
 * editor dragged the rows into (and, for a seeded list, the order the seeder
 * worked out). Array.prototype.sort is stable, so returning 0 is enough.
 */
export function sortDocsByYearDesc<T extends { year?: number | null; title: string }>(
  docs: T[],
): T[] {
  return [...docs].sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity));
}

/** One heading over a run of rows that share it. `heading` is null for the
 *  single-group case (everything shares a year, or nothing has one), which
 *  tells the caller to render the flat list it always has, unchanged. */
export interface DocGroup<T> {
  heading: string | null;
  docs: T[];
}

/**
 * Groups a year-sorted list of documents under year subheadings, descending,
 * with undated rows last under "Undated" — but only when the list actually
 * spans two or more distinct years (including "undated" as one of them). A
 * single-year list, or a list with no years at all, comes back as ONE group
 * with `heading: null`, so a caller can render it exactly as before without
 * a branch of its own.
 *
 * Input must already be sorted (sortDocsByYearDesc): this function only
 * partitions, it does not reorder. Kept general on `year`/`title` rather than
 * a concrete doc type so both the DocumentList block and the blog's
 * publications list can share it.
 */
export function groupDocsByYear<T extends { year?: number | null; title: string }>(
  docs: T[],
): DocGroup<T>[] {
  const distinctYears = new Set(docs.map((d) => d.year ?? null));
  if (distinctYears.size < 2) {
    return docs.length > 0 ? [{ heading: null, docs }] : [];
  }

  const groups: DocGroup<T>[] = [];
  let current: DocGroup<T> | null = null;
  for (const doc of docs) {
    const label = typeof doc.year === 'number' ? String(doc.year) : 'Undated';
    if (!current || current.heading !== label) {
      current = { heading: label, docs: [] };
      groups.push(current);
    }
    current.docs.push(doc);
  }
  return groups;
}
