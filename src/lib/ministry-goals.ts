// scaffold-file: church
// Safe to edit by hand
// =============================================================================
// ministry-goals - the four goals as the Ministries page's organising motif
// =============================================================================
// (2026-09-24, the Ministries identity pass; rollout plan step 6, "the four
// goals as the organising motif; Ministry bands under the four goals".)
//
// The church names four goals on Who We Are ("Our Goals"): Worship, The Way
// (Discipleship), Witness (Evangelism) and Work (Acts of Mercy). Each is drawn
// with one building glyph everywhere on the site (window, door, rose, basin;
// BuildingGlyph.astro), and GoalsBand gives each an id from its name, which is
// the value stored here, so /who-we-are#the-way is always the goal's own band.
//
// WHICH GOAL A MINISTRY SERVES IS THE CHURCH'S ANSWER, NOT OURS. It is the
// optional `goal` field on the ministry document, set only where the church's
// own words say so (scripts/data/ministry-goals.json holds the quotes). A
// ministry with no goal is not listed under any; nothing here guesses.
//
// goalIndex() reads the Ministry bands of one page and returns the four goals
// in the church's order, each with the ministries that serve it, as the
// derived `ministryGoalsIndex` block MinistryGoals.astro draws. It returns null
// when no ministry on the page names a goal, so a page whose ministries have
// not been answered yet draws exactly as it did before.
//
// STEGA (CLAUDE.md, the preview rules): the goal value is compared on its
// cleaned form (it is also in NON_STEGA_FIELDS, belt and braces); the labels
// keep their payload, because they are display text.
//
// PURE, relative imports with extensions, so node --test can load it.
// =============================================================================
import type {
  MinistryGoalColumn,
  MinistryGoalEntry,
  MinistryGoalsIndexBlock,
  ProjectedMinistrySection,
} from './pageBuilder.types';
import { splitStega } from './preview-stega.ts';

/** The four goals, in the church's order, as Who We Are names them. */
export const GOALS: readonly Omit<MinistryGoalColumn, 'ministries'>[] = [
  { value: 'worship', name: 'Worship', aside: null, glyph: 'window' },
  { value: 'the-way', name: 'The Way', aside: 'Discipleship', glyph: 'door' },
  { value: 'witness', name: 'Witness', aside: 'Evangelism', glyph: 'rose' },
  { value: 'work', name: 'Work', aside: 'Acts of Mercy', glyph: 'basin' },
];

/** Where each goal is described: its band on Who We Are. */
export const goalHref = (value: string): string => `/who-we-are#${value}`;

const clean = (v: unknown): string => (typeof v === 'string' ? splitStega(v).cleaned.trim() : '');

/** The goal a stored value names, or null for blank or unknown. */
export function goalFor(value: unknown): (typeof GOALS)[number] | null {
  const v = clean(value).toLowerCase();
  return GOALS.find((g) => g.value === v) ?? null;
}

/** The anchor string off a band, whether projected as a slug object or a string. */
const anchorOf = (anchor: unknown): string | undefined => {
  const raw =
    typeof anchor === 'string'
      ? anchor
      : ((anchor as { current?: unknown } | null | undefined)?.current ?? '');
  const v = clean(raw);
  return v || undefined;
};

/**
 * The goal index for one page's Ministry bands, or null when none of them
 * names a goal. Ministries keep the page's order under each goal. The label is
 * the band's small line (what the band itself says it is, "Worship arts"),
 * falling back to the ministry's name.
 */
export function goalIndex(
  sections: readonly (ProjectedMinistrySection | null | undefined)[],
): MinistryGoalsIndexBlock | null {
  const columns: MinistryGoalColumn[] = GOALS.map((g) => ({ ...g, ministries: [] }));
  let any = false;
  for (const s of sections) {
    const m = s?.ministry;
    if (!m) continue;
    const goal = goalFor(m.goal);
    if (!goal) continue;
    const label = clean(m.eyebrow) ? m.eyebrow : clean(m.title) ? m.title : null;
    if (!label) continue;
    const entry: MinistryGoalEntry = { label };
    const anchor = anchorOf(s.anchor);
    if (anchor) entry.anchor = anchor;
    columns.find((c) => c.value === goal.value)?.ministries.push(entry);
    any = true;
  }
  return any ? { _type: 'ministryGoalsIndex', goals: columns } : null;
}
