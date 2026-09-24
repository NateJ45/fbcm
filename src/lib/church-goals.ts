// Safe to edit by hand
// =============================================================================
// church-goals - the church's four goals, as the site chrome names them
// =============================================================================
// (2026-09-24, the footer identity pass.) The church names four goals on Who We
// Are ("Our Goals"): Worship, The Way, Witness and Work. Each is drawn with one
// building glyph everywhere on the site (window, door, rose, basin;
// BuildingGlyph.astro), and GoalsBand gives each an id from its name, so
// /who-we-are#the-way is always that goal's own band.
//
// This is the one code-side list of them. It lives OUTSIDE the `church`
// scaffold capability on purpose, beside the church primitives in
// src/components/church/, because the footer and the mobile menu draw the
// goals on every page; ministry-goals.ts (which is in the capability) reads
// its GOALS from here, so the two can never disagree.
//
// WHY A LIST IN CODE (CLAUDE.md rule 15). The goals' words live in Sanity, on
// the Who We Are page's goals block, and that block is the source. The chrome
// cannot read it without a second query on every page's build, so the names,
// asides and subtitles here are the church's own words copied once, from
// scripts/pages/who-we-are.mjs, which is where the page's block is composed
// from. If the church renames a goal, this list and that module change
// together.
//
// PURE, relative imports with extensions, so node --test can load it.
// =============================================================================

export type GoalValue = 'worship' | 'the-way' | 'witness' | 'work';
export type GoalGlyph = 'window' | 'door' | 'rose' | 'basin';

export interface ChurchGoal {
  /** The goal's anchor id on Who We Are ("the-way"). */
  value: GoalValue;
  name: string;
  /** The church's own bracketed word for the goal ("Discipleship"), or null. */
  aside: string | null;
  /** The goal's subtitle as Who We Are sets it ("Seeking Understanding"). */
  subtitle: string;
  glyph: GoalGlyph;
}

/** The four goals, in the church's order. */
export const CHURCH_GOALS: readonly ChurchGoal[] = [
  {
    value: 'worship',
    name: 'Worship',
    aside: null,
    subtitle: 'Worshiping as the Body of Christ',
    glyph: 'window',
  },
  {
    value: 'the-way',
    name: 'The Way',
    aside: 'Discipleship',
    subtitle: 'Seeking Understanding',
    glyph: 'door',
  },
  {
    value: 'witness',
    name: 'Witness',
    aside: 'Evangelism',
    subtitle: 'Inviting to Church',
    glyph: 'rose',
  },
  {
    value: 'work',
    name: 'Work',
    aside: 'Acts of Mercy',
    subtitle: 'Gifts For Service',
    glyph: 'basin',
  },
];

/** Where each goal is described: its band on Who We Are. */
export const goalHref = (value: string): string => `/who-we-are#${value}`;

/**
 * The small line under a goal's name, as Who We Are's goal index prints it:
 * the church's bracketed word where it has one, else the subtitle (Worship).
 */
export const goalIndexLine = (goal: ChurchGoal): string => goal.aside ?? goal.subtitle;
