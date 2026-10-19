// Safe to edit by hand
// =============================================================================
// This site's pictures of the Studio for the Site Guide (PORTS.md card 130)
// =============================================================================
// A guide asks for a picture by KEY, so the guide text stays the same on every
// site while each site draws its own screenshots:
//
//     { kind: 'shot', key: 'publish-button' }          // in guides/content.ts
//
// and this file says what that key shows on THIS site: the image in
// public/guide-shots/ and the marks laid over it. A key with no entry here
// falls back to the wireframe drawing (public/guide-shots/example-editor.svg),
// so a guide never shows a hole. Adding a capture is: save a WebP under
// public/guide-shots/ (crop to the useful part, cover any avatar or personal
// name, under about 150 KB), add its entry below, and the guide picks it up.
//
// Positions are PERCENT of the picture, so a recapture at another size keeps
// its marks. To place one from a capture, divide the pixel position inside the
// cropped image by its width or height and multiply by 100. See
// docs/agent/studio-kit.md ("Real captures in the guides") for the recipe, and
// src/lib/guide-shots.test.ts for what is checked (the file exists, the alt text
// is there, the marks sit inside the picture).
//
// Shape of an entry: GuideShotData in src/lib/studio-look.ts.
// =============================================================================

import type { GuideShotData } from '../../lib/studio-look.ts';

export const GUIDE_SHOTS: Record<string, GuideShotData> = {
  // Captured 2026-10-19 from the kit harness (/kit-harness/studio/, a pretend
  // administrator reading the public dataset; avatar hidden). The rest of the
  // keys the guides ask for (quick-sermon-form, banner-form, new-post-form,
  // publish-button, church-details, visitor-issues) still draw the wireframe:
  // see docs/PENDING.md 1g for why and how to capture them.
  'quick-update-tiles': {
    src: '/guide-shots/quick-update-tiles.webp',
    alt: 'Quick update on a phone: big buttons for Post a photo, the sermon preview, a banner, a change this week and a short news post.',
    width: 390,
    height: 877,
    marks: [
      { kind: 'ring', x: 26.7, y: 24.3, w: 63.6, h: 6.7 },
      { kind: 'stone', x: 94, y: 27.7, label: 'The sermon preview, every week.' },
      { kind: 'ring', x: 26.7, y: 60.8, w: 63.6, h: 9.7 },
      { kind: 'stone', x: 94, y: 65.6, label: 'A snow day: red, and gone after Sunday.' },
    ],
  },
  'home-checklist': {
    src: '/guide-shots/home-checklist.webp',
    alt: "Home's Sunday checklist: the sermon preview, a blog post, banners that have ended, the livestream and this week's events, with one already ticked.",
    width: 526,
    height: 712,
    marks: [
      { kind: 'stone', x: 94, y: 12.2, label: 'Ticks itself once the preview is published.' },
      { kind: 'stone', x: 94, y: 66.2, label: 'Tick this one yourself.' },
    ],
  },
  // 'publish-button': {
  //   src: '/guide-shots/publish-button.webp',
  //   alt: 'The bottom right of the editor, with the Publish button in the corner.',
  //   width: 744,
  //   height: 184,
  //   marks: [
  //     { kind: 'ring', x: 83, y: 87, w: 8, h: 10 },
  //     { kind: 'stone', x: 87, y: 30, label: 'Publish puts your change on the website.' },
  //   ],
  // },
};
