// Safe to edit by hand
// A hero fact that names a band on the same page links to it (2026-09-25, the
// Ministries hero). DERIVED, never stored (CLAUDE.md rule 15): `heroFact` has
// no link field and none was added. The Ministries hero's three facts are
// "Children", "Youth" and "Adults", and the page already has a band for each
// (anchored #children, #youth, #adult, the Ministry bands the Wix redirects
// land on). So a fact whose label IS a band's name jumps to it:
//
//   - the label, slugged, equals the band's editor anchor ("Children" and
//     #children), or
//   - the label equals the band's small line, ignoring case ("Adults" and the
//     adult Ministry band's eyebrow "Adults", whose anchor is #adult).
//
// Only bands with an editor-set anchor count: that is the stable name a link
// may point at (SectionRenderer's note on ANCHOR IDS), and a positional
// "page-4-band" would move when an editor reorders the page. The first band
// that matches wins. A label that names no band (Visit's "Sundays", "Where",
// "How long") links nowhere, so every other hero renders as it did.
//
// Stega-safe: every label, eyebrow and anchor is compared on its cleaned text
// (the preview appends invisible markers to each string).
import { sectionAnchor } from './anchor.ts';
import { splitStega } from './preview-stega.ts';

export interface FactLabel {
  label?: string | null;
}

export interface LinkableBand {
  _type?: string;
  anchor?: { current?: string | null } | null;
  eyebrow?: string | null;
}

const norm = (s: string | null | undefined): string =>
  splitStega(String(s ?? ''))
    .cleaned.replace(/[​-‍⁠-⁣﻿]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/** The label as an anchor would be written: the same rules as sectionAnchor. */
const asAnchor = (label: string): string => sectionAnchor({ anchor: { current: label } }, '');

/**
 * One href (or null) per fact, in the facts' order. `bands` are the page's
 * blocks in page order (the hero itself may be among them: it carries no
 * anchor, so it never matches).
 */
export function heroFactLinks(
  facts: readonly FactLabel[],
  bands: readonly LinkableBand[],
): (string | null)[] {
  const targets = bands
    .map((b) => ({ id: sectionAnchor(b, ''), eyebrow: norm(b.eyebrow) }))
    .filter((t) => t.id !== '');
  return facts.map((f) => {
    const label = norm(f.label);
    if (!label) return null;
    const slug = asAnchor(label);
    const hit = targets.find((t) => t.id === slug || (t.eyebrow !== '' && t.eyebrow === label));
    return hit ? `#${hit.id}` : null;
  });
}
