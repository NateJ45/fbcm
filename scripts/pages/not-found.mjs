// scripts/pages/not-found.mjs
//
// The custom 404 page. The live notFoundPage singleton (queried before this
// module was written) still carried the starter's own placeholders: a
// heroImage missing its asset entirely (test data from an earlier task), and
// a "Browse our services" secondary button pointing at a route this site does
// not build. This module replaces every field the schema defines.
//
// Two things about this file are deliberate.
//
// 1. NO PHOTOGRAPH (2026-09-24, the utility identity pass). The page used to
//    show the church's tower (`notfound-tower`, an alias of `hero-tower`),
//    which is also the home hero's first frame and the history opener's. A
//    photo is not reused across pages (rollout rules), so the 404 draws the
//    church's door glyph instead and this module no longer sets heroImage;
//    createOrReplace clears the one the live document still carries.
//
// 2. FOUR DOORS, NAMED AS THE MENU NAMES THEM. The rollout sends a lost
//    visitor to the four main doors: Visit, Who We Are, Blog and Give. Each
//    label is the page's name in the header menu, so the
//    doors read as the same places the header offers, and none of them is a
//    new sentence. src/pages/404.astro draws each with a building glyph by
//    position (door, window, rose, basin). "Contact us" came off: the phone
//    and the email are in the footer directly below the doors.

export default {
  id: 'notFoundPage',
  type: 'notFoundPage',
  slug: 'not-found',

  newCopy: [
    'That page has moved or never was. (headline)',
    "It happens. If you followed an old link, it may have moved when we rebuilt this site. Here's where to go instead. (body)",
  ],

  edits: [],
  confirm: [],
  photoConsent: [],

  async build() {
    return {
      seoTitle: 'Page not found',
      seoDescription: 'That page has moved or never was. Head back to the site or get in touch.',

      eyebrow: '404',
      headline: 'That page has moved or never was.',
      body: "It happens. If you followed an old link, it may have moved when we rebuilt this site. Here's where to go instead.",

      primaryCtaLabel: 'Visit',
      primaryCtaHref: '/visit',
      secondaryCtaLabel: 'Who We Are',
      secondaryCtaHref: '/who-we-are',
      tertiaryCtaLabel: 'Blog',
      tertiaryCtaHref: '/blog',
      fourthCtaLabel: 'Give',
      fourthCtaHref: '/give',
    };
  },
};
