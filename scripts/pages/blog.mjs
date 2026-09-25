// scripts/pages/blog.mjs
//
// The journalPage singleton: the /blog hero, the closing band, and the one
// editable zone on that page, which now holds one line pointing at /visitor.
//
// The archive itself is not seeded and cannot be: the featured six, this week's
// sermon preview, the twelve pages, the five category pages and the 196 tag
// pages are all DERIVED from the 142 journalEntry documents at build time
// (src/lib/blog-derive.ts). There is nothing here for an editor to keep true by
// hand, which is the point (CLAUDE.md rule 15).
//
// Three things about this file are deliberate.
//
// 1. THE VISITOR MOVED TO ITS OWN PAGE (2026-09-24, feat/the-visitor; Nathan's
//    decision). The "#publications" list that used to close this page (every
//    issue of The Visitor and the church's two books) is now /visitor, seeded
//    by scripts/pages/visitor.mjs, which took the issue-dating rule with it
//    (scripts/lib/visitor-dates.mjs). What stays here is one line pointing
//    there.
//
// 2. THE POINTER KEEPS THE OLD ANCHOR. The line is a richTextSection anchored
//    "publications", so a bookmark or an outside link to /blog#publications
//    (the Wix /publications redirect pointed there, and a URL fragment never
//    reaches a server, so no redirect can move it) still lands on the way to
//    the newsletter.
//
// 3. NO LIST IS TYPED HERE. The archive, the featured six and the pages are
//    derived from the posts at build time, as before.

export default {
  id: 'journalPage',
  type: 'journalPage',
  slug: 'blog',

  // Every sentence on this page that is not the church's own.
  newCopy: [
    'Writing from First Baptist. (hero headline)',
    'Sermon previews for the coming Sunday, news from around the church, and longer pieces from the pastors. (hero subhead, one sentence)',
    'Looking for The Visitor? Every issue of the church newsletter is on its own page. (the one line where the publications list was, linking to /visitor)',
    'Come and see for yourself. (closing band headline)',
    'Sermon previews, church news and writing from the pastors of First Baptist Church Muncie, an American Baptist church in downtown Muncie, Indiana. (search description, not shown on the page; 2026-09-24 local search pass)',
  ],

  edits: [
    "Moved: The Visitor and the two books are on their own page now, /visitor (scripts/pages/visitor.mjs carries their edits and the question about each issue's year).",
    'Em-dash to comma (CLAUDE.md rule 2), in the post summary of "Justified by Faith, Empowered by the Spirit" (shown under its title and on /blog): "the Holy Spirit’s role in giving us up— Hope which does not put us to shame" now reads "...giving us up, Hope which...". No other word changes. The summary is a field on the post, not a sentence this module builds, so the change was made by scripts/fix-journal-gaps.mjs (backed up first). The Robert Frost quotation in the summary of "The Road Not Taken" keeps its dash, by decision.',
  ],

  // The question about each issue's year moved to visitor.mjs with the issues.
  confirm: [],

  // No photograph of people on this page: the hero is the sanctuary interior.
  photoConsent: [],

  async build(ctx) {
    const { copy, images, settings } = ctx;
    const { ctaInternal, paragraphs } = copy;

    if (!settings) {
      throw new Error(
        'blog.mjs: siteSettings is not available. The closing band reads the service time and ' +
          'the address off it rather than retyping them (CLAUDE.md rule 15).',
      );
    }

    const hero = await images.image('hero-sanctuary');
    if (!hero) throw new Error('blog.mjs: no photo in the manifest for "hero-sanctuary"');

    const addressLines = String(settings.address ?? '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (addressLines.length < 2) {
      throw new Error('blog.mjs: siteSettings.address needs a street line and a city/state line.');
    }
    const [streetLine, cityLine] = addressLines;

    return {
      heroEyebrow: 'Blog',
      heroHeadline: 'Writing from First Baptist.',
      heroSubhead:
        'Sermon previews for the coming Sunday, news from around the church, and longer pieces from the pastors.',
      heroImage: hero,

      additionalSections: [
        // Where the publications list was: one line, same anchor (point 2).
        {
          _type: 'richTextSection',
          _key: 'blog-publications',
          anchor: { _type: 'slug', current: 'publications' },
          body: paragraphs(
            'Looking for The Visitor? [Every issue of the church newsletter](/visitor) is on its own page.',
            'blog-pub',
          ),
        },
      ],

      finalCtaHeadline: 'Come and see for yourself.',
      finalCtaSubhead: `${settings.serviceTime}. ${streetLine}, ${cityLine}.`,
      finalCta: ctaInternal('Plan a visit', 'visit'),

      seoTitle: 'Blog | First Baptist Church Muncie',
      seoDescription:
        'Sermon previews, church news and writing from the pastors of First Baptist Church Muncie, an American Baptist church in downtown Muncie, Indiana.',
    };
  },
};
