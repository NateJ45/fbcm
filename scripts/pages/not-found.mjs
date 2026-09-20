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
// 1. THE PHOTO IS THE CHURCH'S OWN TOWER, NOT A GENERIC PLACEHOLDER. The
//    page-images manifest already carries `notfound-tower` as an alias of
//    `hero-tower` (scripts/data/page-images.json), specifically so this page
//    would not need its own photograph uploaded a second time.
//
// 2. THREE LINKS, ONE BUTTON FAMILY (CLAUDE.md rule 17). The schema's three
//    CTA slots (primary/secondary/tertiary) used to render three different
//    looks in src/pages/404.astro (gold, indigo outline, and a third muted
//    outline for tertiary). That third look is gone: src/pages/404.astro now
//    renders all three through CtaLink, gold for the primary and outline for
//    the other two, so a lost visitor sees the same two button looks used
//    everywhere else on the site.

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

  async build(ctx) {
    const { images } = ctx;

    const heroImage = await images.image('notfound-tower');
    if (!heroImage) {
      throw new Error('not-found.mjs: images.image("notfound-tower") returned nothing.');
    }

    return {
      seoTitle: 'Page not found',
      seoDescription: 'That page has moved or never was. Head back to the site or get in touch.',

      eyebrow: '404',
      headline: 'That page has moved or never was.',
      body: "It happens. If you followed an old link, it may have moved when we rebuilt this site. Here's where to go instead.",

      heroImage: { ...heroImage, caption: 'First Baptist Church Muncie' },

      primaryCtaLabel: 'Plan a visit',
      primaryCtaHref: '/visit',
      secondaryCtaLabel: 'Read the blog',
      secondaryCtaHref: '/blog',
      tertiaryCtaLabel: 'Contact us',
      tertiaryCtaHref: '/contact',
    };
  },
};
