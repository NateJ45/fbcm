// Foundation, edit with care
// =============================================================================
// _anchorField - the shared "jump-to id" slug every link-target block carries
// =============================================================================
// Plan 1 retired 42 Wix URLs into redirects, and several of them land on a
// FRAGMENT rather than a page: /beliefs#baptists, /staff#kendall-ellis,
// /ministries#youth. A fragment only works if the band it names keeps the same
// id forever, and the id SectionRenderer generates on its own is positional
// (`section-3`), so reordering a page would silently break every inbound link
// that pointed at it.
//
// This field is the editor's way of pinning one. It is optional: a band with no
// anchor still gets the positional id, which is enough for in-page navigation
// written on the same day. Set it on anything an outside link, a redirect or a
// printed bulletin points at.
//
// Rendering side: src/lib/anchor.ts turns this slug into the id on the section
// wrapper, cleaning stega markers and anything that is not a letter, a digit or
// a hyphen. The `slug.current` key is on NON_STEGA_FIELDS in cms-preview.ts, so
// the preview never encodes it in the first place.
// =============================================================================
import { defineField } from 'sanity';

/** Optional per-section id so a link can jump to it. Shared by every block that can be a link target. */
export const anchorField = () =>
  defineField({
    name: 'anchor',
    title: 'Jump-to id (optional)',
    type: 'slug',
    description:
      'A short id such as baptists so a link can jump to this section: /beliefs#baptists. Letters, numbers and hyphens.',
    options: { maxLength: 40 },
  });
