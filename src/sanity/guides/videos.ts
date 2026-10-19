// Safe to edit by hand
// =============================================================================
// This site's "Watch how it is done" clips (PORTS.md card 137)
// =============================================================================
// A guide asks for a clip by KEY, as its `video` ('post-a-notice') or as a
// block in its body ({ kind: 'video', key: 'post-a-notice' }), and this file
// says where that clip's files are. The files live in public/guide-videos/ and
// are made by the recorder:
//
//     node tools/tutorial-videos/record.mjs tools/tutorial-videos/scripts/<slug>.json
//
// which prints the entry to paste below. A key with no entry plays nothing
// (the Watch button and the row hide themselves), so a guide never shows a
// broken player. src/lib/guide-videos.test.ts checks every entry (files
// present, a poster and captions, no em-dashes).
//
// Shape of an entry: GuideVideoData in src/lib/guide-videos.ts.
// =============================================================================

import type { GuideVideoData } from '../../lib/guide-videos.ts';

export const GUIDE_VIDEOS: Record<string, GuideVideoData> = {
  'sermon-preview': {
    title: "Post Sunday's sermon preview",
    src: '/guide-videos/sermon-preview.mp4',
    webm: '/guide-videos/sermon-preview.webm',
    poster: '/guide-videos/sermon-preview.jpg',
    captions: '/guide-videos/sermon-preview.vtt',
    duration: 26,
    width: 390,
    height: 844,
  },
  announcement: {
    title: 'Put up a banner, or a snow day',
    src: '/guide-videos/announcement.mp4',
    webm: '/guide-videos/announcement.webm',
    poster: '/guide-videos/announcement.jpg',
    captions: '/guide-videos/announcement.vtt',
    duration: 33,
    width: 390,
    height: 844,
  },
  'visitor-newsletter': {
    title: "Add this month's Visitor",
    src: '/guide-videos/visitor-newsletter.mp4',
    webm: '/guide-videos/visitor-newsletter.webm',
    poster: '/guide-videos/visitor-newsletter.jpg',
    captions: '/guide-videos/visitor-newsletter.vtt',
    duration: 18,
    width: 390,
    height: 844,
  },
  'service-times': {
    title: 'Change the service time',
    src: '/guide-videos/service-times.mp4',
    webm: '/guide-videos/service-times.webm',
    poster: '/guide-videos/service-times.jpg',
    captions: '/guide-videos/service-times.vtt',
    duration: 13,
    width: 390,
    height: 844,
  },
};
