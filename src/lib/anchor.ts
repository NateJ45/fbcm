// Safe to edit by hand
// =============================================================================
// anchor - a section's optional `anchor` slug, turned into the id on its wrapper
// =============================================================================
// One place that turns a section's optional `anchor` slug into the id on its
// wrapper, so /beliefs#baptists lands on the right band no matter how the editor
// reorders the page. Falls back to the caller's generated id when no anchor is
// set, which keeps every band addressable even before anyone types an anchor.
//
// TWO KINDS OF CLEANING, and both are load-bearing.
//
// 1. STEGA. In the Presentation preview every string arrives carrying invisible
//    marker characters (U+200B, U+200C, U+200D, U+FEFF). `splitStega` takes off
//    a full RUN of four or more, which is what the encoder writes. But a run can
//    also be truncated, split by a copy/paste, or pasted in by hand, and a
//    LEFTOVER single marker is not whitespace to the slug rules below: it is
//    "some other character", which becomes a hyphen, which silently changes the
//    id and breaks the link. So the run comes off first and any stray marker
//    comes off after it.
// 2. URL SAFETY. The value is written straight into `id=` and read back out of a
//    URL fragment, so it is reduced to lowercase letters, digits and single
//    hyphens. An editor who types "Our Pledge!" gets `our-pledge`, which is the
//    thing they would have typed if they had known the rules.
// =============================================================================
import { splitStega } from './preview-stega.ts';

/** Any page-builder block that may carry the shared `anchorField()` slug. */
type Anchored = { anchor?: { current?: string | null } | null };

/**
 * Every invisible character either stega encoding can emit, matched ONE at a
 * time. `splitStega` deliberately only removes runs of four or more (that is the
 * format), so this mops up whatever a partial run left behind.
 */
const STRAY_STEGA = /[​‌‍⁠⁡⁢⁣﻿]/gu;

/**
 * The id for one section's wrapper: the editor's anchor when they set one,
 * otherwise the caller's generated fallback.
 */
export function sectionAnchor(section: Anchored, fallbackId: string): string {
  const raw = section?.anchor?.current ?? '';
  const clean = splitStega(String(raw))
    .cleaned.replace(STRAY_STEGA, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean.length > 0 ? clean : fallbackId;
}
