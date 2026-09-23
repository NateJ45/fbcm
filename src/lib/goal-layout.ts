// src/lib/goal-layout.ts
// Safe to edit by hand
// scaffold-file: church
// Each of the four goals is drawn in its own composition and colour, decided by
// its POSITION (the church's order is Worship, The Way, Witness, Work), never by
// a field (CLAUDE.md rule 9). A composition the goal cannot fill falls back to
// the nave, so an editor can never produce an empty drawing.
export type GoalLayout = 'nave' | 'path' | 'rings' | 'doors';
// Brand grounds only (2026-09-23): dark, light, dark, light, so no two
// neighbouring goals share a ground or a weight.
export type GoalColour = 'indigo' | 'gold' | 'brown' | 'taupe';

const COLOURS: GoalColour[] = ['indigo', 'gold', 'brown', 'taupe'];
const LIGHT: ReadonlySet<GoalColour> = new Set(['gold', 'taupe']);
const LAYOUTS: GoalLayout[] = ['nave', 'path', 'rings', 'doors'];

export function goalLayout(
  index: number,
  goal: { points?: unknown[] | null; photos?: unknown[] | null },
): { layout: GoalLayout; colour: GoalColour } {
  const colour = COLOURS[index % 4];
  const wanted = LAYOUTS[index % 4];
  const points = goal.points?.length ?? 0;
  const photos = goal.photos?.length ?? 0;
  const fits =
    wanted === 'nave' ||
    (wanted === 'path' && points >= 2) ||
    (wanted === 'rings' && photos >= 3) ||
    (wanted === 'doors' && points >= 2);
  return { layout: fits ? wanted : 'nave', colour };
}

/**
 * Does a goals block END on a dark band? Its last NAMED goal (GoalsBand skips
 * unnamed ones) paints the bottom edge, and the gold and taupe positions are
 * light grounds. SectionRenderer's isDarkBand asks, so a give band placed after the
 * goals never paints dark against dark.
 */
export function goalsEndDark(goals: unknown): boolean {
  if (!Array.isArray(goals)) return false;
  const named = goals.filter((g) => !!(g as { name?: unknown } | null)?.name).length;
  if (named === 0) return false;
  return !LIGHT.has(goalLayout(named - 1, {}).colour);
}
