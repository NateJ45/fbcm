// Safe to edit by hand
// Where a code-rendered band sits among a page's Sanity bands (2026-09-24,
// `feat/last-sunday`). The home page's "Last Sunday" band is drawn from code,
// not from a pageBuilder block (adding it to the page is a content write the
// owner approves), so SectionRenderer renders it through a slot at the row
// this returns. The anchors are block types in order of preference: the band
// goes before the FIRST row of the first anchor type present, and after the
// last row when none is (a page is never left without it for want of a
// neighbour). Pure, so the placement is unit-tested (band-insert.test.ts).

/** The row index the band renders before; `types.length` means after the last row. */
export function insertIndex(types: readonly string[], anchors: readonly string[]): number {
  for (const anchor of anchors) {
    const at = types.indexOf(anchor);
    if (at >= 0) return at;
  }
  return types.length;
}
