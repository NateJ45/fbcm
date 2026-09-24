// Safe to edit by hand
// PURE module so NON_STEGA_FIELDS can be unit-tested. It used to live inline
// in src/lib/cms-preview.ts, which reads `import.meta.env` at module scope:
// fine in Astro, fatal in a node --test run, where `import.meta.env` is
// undefined (the same reason src/lib/sanity-asset.ts exists). cms-preview.ts
// imports isNonStegaField() from here, so callers there are unchanged.

// -----------------------------------------------------------------------------
// NON_STEGA_FIELDS - the single most important list in the preview stack
// -----------------------------------------------------------------------------
// Fields chosen from a fixed dropdown or radio in the schema. NEVER free text an
// editor types, and never displayed as prose. They drive class and component
// selection in the renderers (SectionRenderer branches on `_type`, the section
// components branch on `align`, `columns`, `imageSide`, `variant`, ...).
//
// Stega encodes a ~1KB run of INVISIBLE marker characters into every string it
// touches so click-to-edit knows which field to open. On a display string that
// is the whole point; on one of these it silently breaks the exact-string
// comparison (`"left" + <markers>` !== `"left"`), so the preview mis-renders
// while the live static site is fine. Excluding them costs nothing: you pick
// these from a list, there is no text to click into.
//
// ADD ANY NEW LOGIC-DRIVING DROPDOWN FIELD HERE THE DAY YOU ADD THE FIELD.
// The list below was derived by scanning every `options: { list: ... }` field in
// src/sanity/schemaTypes/ on 2026-08-28, then padded with the names the rest of
// the family uses, so a section ported in from a sibling repo is covered on
// arrival.
// -----------------------------------------------------------------------------
const NON_STEGA_FIELDS = new Set([
  // Present in this template's schemas today (sections.ts, richSections.ts,
  // ctaBlock.ts, journalEntry.ts, announcement.ts, siteSettings.ts,
  // businessInfo.ts, page.ts, studioGuide.ts, studioPlaybook.ts).
  'align',
  'businessModel',
  'category',
  'columns',
  'heightHint',
  'imageSide',
  'layout',
  'linkType',
  'navGroup',
  'platform',
  'size',
  'source',
  'sourceType',
  'style',
  'tone',
  'variant',
  'width',
  // Not in this template yet, but standard enum names across the site family.
  // Carried so a block ported from a sibling repo is not a preview-only bug
  // waiting to be found.
  'mediaSide',
  'mediaType',
  'padding',
  'overlay',
  'surface',
  'headingLevel',
  'format',
  'icon',
  'aspect',
  'ratio',
  // Appearance controls, 2026-08-28 (PORTS.md card 26). Audited field by field:
  //   headingAccent  NEW, and the sharpest case on this list: it is matched
  //                  against the heading with indexOf, so an encoded value
  //                  would never find its own word and the accent would
  //                  silently do nothing in the preview while the live page
  //                  showed it. src/lib/heading-accent.ts ALSO strips both
  //                  sides with plain() -- belt and braces, because that helper
  //                  runs on the live site too, where this list does not exist.
  //   columns        already listed above, and it is what the two NEW column
  //                  controls (valuesSection, dynamicListSection) are named.
  //   imageSide      already listed above; the wave rewords its Studio label
  //                  and touches nothing else.
  // Nothing else in this wave drives logic from a string: the `subheadRich`
  // twins are portable text meant to be clicked into, so they KEEP their stega,
  // and this template adds no surface or accent COLOUR enum at all (see
  // src/lib/surfaces.ts for why).
  'headingAccent',
  // scaffold: church
  // staffGridSection.group is a radio dropdown ('all' | 'pastors' |
  // 'coordination' | 'support') that picks which Staff members render, not
  // text an editor types. Same reasoning as every other enum on this list.
  'group',
  // goalsSection's goal.glyph (Task 3, 2026-09-23) is a radio picking which
  // building drawing (window/door/rose/basin) a goal renders as: a component
  // switch, never display text. linkCard.glyph (Task 2 of the Home identity
  // plan, 2026-09-23) reuses this same field name and the same reasoning, so
  // no second entry was needed here, only the unit test that proves it.
  'glyph',
  // ministry.goal (2026-09-24, the Ministries identity pass) is a radio picking
  // which of the four goals a ministry is listed under on /ministries: the
  // goal index matches it against 'worship' | 'the-way' | 'witness' | 'work',
  // so an encoded value would list the ministry under no goal, in the
  // preview only.
  'goal',
  // scaffold:end
  // slug.current: an id or a URL segment, never display text. Added 2026-09-19
  // with anchorField(): the section anchor is written straight into `id=` and
  // read back out of a URL fragment, so an encoded copy would produce a
  // wrapper id nobody can link to, in the preview only.
  'current',
]);

/** Whether a field name skips stega encoding in preview (rule 8b). */
export function isNonStegaField(name: string): boolean {
  return NON_STEGA_FIELDS.has(name);
}
