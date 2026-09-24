// src/lib/gallery-form.ts
// Safe to edit by hand
// Which of its two forms a photo gallery draws, decided by the photos
// themselves, never by a field (CLAUDE.md rule 9: no colour or style field on
// a block; rule 15: derive what the data already says). 2026-09-24, the
// Wedding identity pass.
//
// ROOMS. When EVERY photo carries a caption, the captions are names (the
// wedding page's "Sanctuary", "The Bridal Suite", "Fellowship Hall"): places,
// so the gallery is drawn as a row of arched doors on the indigo-dark band,
// each door with its name under it (rule 3: door arches for places). A name
// is content, not a caption in the "no captions on photos" sense (rule 7).
//
// ARCADE. When any photo has no caption, the gallery is a set of photographs
// of people, drawn as pointed lancets on the page's own ground, with no text
// under them (rule 7). A caption an editor typed on one photo of an arcade is
// kept in the data and not shown: half a row of labels is not a designed state.
//
// Every test runs on the stega-CLEANED caption (CLAUDE.md, the preview
// section): in the preview a caption carries an invisible run, so a caption
// that is only whitespace would otherwise read as filled.
import { splitStega } from './preview-stega.ts';

export type GalleryForm = 'rooms' | 'arcade';

export interface CaptionedPhoto {
  caption?: string | null;
}

/** True when the caption holds visible text once the stega run is removed. */
export function hasLabel(photo: CaptionedPhoto | null | undefined): boolean {
  return splitStega(photo?.caption ?? '').cleaned.trim().length > 0;
}

/** 'rooms' when every photo is named; 'arcade' otherwise (and for none). */
export function galleryForm(photos: ReadonlyArray<CaptionedPhoto | null | undefined>): GalleryForm {
  return photos.length > 0 && photos.every(hasLabel) ? 'rooms' : 'arcade';
}
