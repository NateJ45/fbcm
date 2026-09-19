// Safe to edit by hand
// Normalizes the sectionVisibility object from siteSettings into a flat set of
// booleans.
//
// Usage:
//   import { getSectionVisibility } from '@/lib/sectionVisibility';
//   const visible = getSectionVisibility(siteSettings?.sectionVisibility);
//   if (!visible.journal) return Astro.redirect('/');

/** The raw sectionVisibility object as fetched from Sanity. */
interface RawSectionVisibility {
  showJournal?: boolean | null; // scaffold: journal
}

/** Normalized visibility map — all values are plain booleans. */
export interface SectionVisibility {
  journal: boolean; // scaffold: journal
}

/**
 * Convert the raw Sanity sectionVisibility object into a normalized map.
 * Pass `siteSettings?.sectionVisibility` directly.
 *
 * CORE routes ship in src/pages and always build, so the rule is:
 * `value !== false` means visible, and only an explicit `false` hides one.
 * The live site is unaffected until an editor turns something off.
 *
 * 2026-09-19: this used to also carry nine MODULE-route toggles (portfolio,
 * shop, e-design, gift certificates, press, resources, guides, style quiz,
 * budget calculator) for service-business capabilities that never applied to
 * a church. Removed along with the siteSettings fields the rebuild forked
 * away from (see the Church details tab in siteSettings.ts). journal is the
 * one that stays: it is core.
 */
export function getSectionVisibility(raw?: RawSectionVisibility | null): SectionVisibility {
  return {
    // Core route: on unless switched off.
    journal: raw?.showJournal !== false, // scaffold: journal
  };
}
