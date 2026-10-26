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
  // keys the guides ask for are below; each was taken with tools/guide-shots/capture.mjs
  // (tools/guide-shots/shots.json) on 2026-10-19. Only publish-button still draws the wireframe.
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
    alt: "Home's Sunday checklist: the sermon preview, a blog post, banners that have ended, the livestream and this week's events, with one already checked.",
    width: 526,
    height: 712,
    marks: [
      { kind: 'stone', x: 94, y: 12.2, label: 'Ticks itself once the preview is published.' },
      { kind: 'stone', x: 94, y: 66.2, label: 'Tick this one yourself.' },
    ],
  },
  'quick-sermon-form': {
    src: '/guide-shots/quick-sermon-form.webp',
    alt: 'The sermon preview form on Quick update, filled in with a sample title, passage, preacher and summary, with the button to post it below.',
    width: 600,
    height: 1100,
    marks: [
      { kind: 'ring', x: 2.8, y: 14.1, w: 94.3, h: 9.4 },
      { kind: 'stone', x: 98, y: 13.7, label: "The sermon's title." },
      { kind: 'ring', x: 2.8, y: 25.9, w: 94.3, h: 9.4 },
      { kind: 'stone', x: 98, y: 25.5, label: 'The passage.' },
      { kind: 'ring', x: 2.8, y: 87.7, w: 94.3, h: 5.2 },
      { kind: 'stone', x: 98, y: 87.3, label: 'Post it.' },
    ],
  },
  'banner-form': {
    src: '/guide-shots/banner-form.webp',
    alt: 'The Put up a banner form: a box for the message, the last day to show it, an optional link and the button that puts it on the website.',
    width: 600,
    height: 900,
    marks: [
      { kind: 'ring', x: 2.8, y: 17.2, w: 94.3, h: 20.5 },
      { kind: 'stone', x: 98, y: 16.8, label: 'One short sentence.' },
      { kind: 'ring', x: 2.8, y: 40.6, w: 94.3, h: 9.3 },
      { kind: 'stone', x: 98, y: 40.2, label: 'It comes down after this day.' },
      { kind: 'ring', x: 2.8, y: 67.2, w: 94.3, h: 6.3 },
      { kind: 'stone', x: 98, y: 66.8, label: 'Press this.' },
    ],
  },
  'quick-visitor-form': {
    src: '/guide-shots/quick-visitor-form.webp',
    alt: "The Add this month's Visitor form: the month, the year, the newsletter PDF and the button that adds it.",
    width: 600,
    height: 900,
    marks: [
      { kind: 'ring', x: 2.8, y: 17.2, w: 94.3, h: 10.9 },
      { kind: 'stone', x: 98, y: 16.8, label: 'The month on the front.' },
      { kind: 'ring', x: 2.8, y: 45.5, w: 94.3, h: 10.9 },
      { kind: 'stone', x: 98, y: 45, label: 'The PDF.' },
      { kind: 'ring', x: 2.8, y: 59.3, w: 94.3, h: 6.3 },
      { kind: 'stone', x: 98, y: 58.8, label: 'Add it.' },
    ],
  },
  'new-post-form': {
    src: '/guide-shots/new-post-form.webp',
    alt: 'A new blog post open in the editor, with the Title, Web address and Short summary boxes.',
    width: 839,
    height: 820,
    marks: [
      { kind: 'ring', x: 13.9, y: 43.4, w: 72.2, h: 16.6 },
      { kind: 'stone', x: 86.8, y: 42.9, label: 'Type the title, then press Generate.' },
    ],
  },
  'church-details': {
    src: '/guide-shots/church-details.webp',
    alt: 'The Service time box in Site settings, Church details, with its How to button.',
    width: 648,
    height: 186,
    marks: [
      { kind: 'ring', x: 4.2, y: 15, w: 93.2, h: 70.4 },
      { kind: 'stone', x: 98, y: 12.8, label: 'Type it the way it should read.' },
    ],
  },
  'visitor-issues': {
    src: '/guide-shots/visitor-issues.webp',
    alt: 'The Visitor page open on its Documents list, newest issue first, with Add item under the list.',
    width: 640,
    height: 820,
    marks: [
      { kind: 'ring', x: 2.7, y: 71.2, w: 80.3, h: 5.4 },
      { kind: 'stone', x: 84, y: 70.7, label: 'Add the new issue here.' },
    ],
  },
  // The Publish button (publish-button) cannot be captured in the kit harness: its pretend
  // administrator may not publish, so the footer never draws. It keeps the wireframe.
};
