// Foundation, edit with care
// =============================================================================
// prose.ts - the one reading measure for body copy
// =============================================================================
// The number is MEASURED, not assumed, and the reasoning lives at the top of
// src/components/sections/RichTextSection.astro (plan 2b ruling P19): CSS `ch`
// is the advance width of the digit zero, and this body face sets a zero far
// wider than its average letter, so `max-w-[68ch]` came out at 88 to 93 real
// characters a line while 52ch measures 65 to 69. Re-measure in the browser if
// the body font changes; do not convert it by arithmetic.
//
// It lives here rather than inside RichTextSection because /privacy needs the
// same measure at the same left edge and a second copy of the string is a
// second source of truth: the two would drift the first time one of them was
// re-measured. Both the page-builder band and the bespoke page import this.
//
// Tailwind scans this file like any other source file, so the utilities named
// in the string are generated.

/** Body copy: colour, size, leading and the measured line length.
 *
 * Retokened 2026-09-20 in the art-direction pass. The body face changed from
 * Inter to Castoro, so the `ch` measurement above no longer describes this
 * face: Castoro's zero is much closer to its average letter than Inter's, so
 * 62ch here is about the same number of real characters a line that 52ch gave
 * before. Size comes from `text-body` (the one reading size, --text-body)
 * rather than Tailwind's generic `text-lg`, and the leading is stated as a
 * number because `leading-relaxed` was tuned for a sans. Re-measure in the
 * browser if the body font changes again; do not convert it by arithmetic.
 */
export const PROSE_MEASURE = 'text-foreground/90 text-body leading-[1.72] max-w-[62ch]';
