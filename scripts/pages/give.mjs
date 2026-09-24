// scripts/pages/give.mjs
//
// The Give page, composed exactly as section 5.9 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// no source page exists anywhere in the Wix capture (the old site only linked
// out to Church Center), so this page is short and honest rather than padded
// out to look like a normal page. Every sentence that is not the church's own
// is declared below, so the church can replace this page's copy with its own
// stewardship words the day it has them (spec 5.9's own closing line).
//
// Four things about this file are deliberate.
//
// 1. NO AMOUNTS AND NOTHING ABOUT TAX STATUS. Neither Wix source that
//    mentions giving (who-we-are.txt, outreach.txt) states a dollar figure or
//    a tax position, and spec 5.9 says explicitly to add neither. This page
//    repeats that discipline rather than guessing (CLAUDE.md rule 15 read the
//    other way: if the site does not have the fact, it does not print one).
//    Whether to say anything about tax status at all is on the confirm list
//    below and in FACTS_TO_CONFIRM in scripts/seed-pages.mjs.
//
// 2. "WHERE IT GOES" IS ONLY THE CHURCH'S OWN SENTENCES, CUT FOR ONE
//    PUNCTUATION MARK. Both sentences are read out of their captures by
//    anchor phrase, the same para()-style helper every other plan-2b page
//    uses, so a moved sentence fails the run instead of seeding empty. The
//    only change to either is the en-dash and label on the who-we-are.txt
//    sentence (see `edits` below); the outreach.txt sentence is untouched.
//
// 3. THE GIVE BAND OPENS THE PAGE, SO IT CARRIES THE PAGE'S H1. /give has no
//    hero: the indigo giveBandSection is the first thing on the page, the
//    same shape /history uses with the brown heritageBandSection. GiveBand.astro
//    and SectionRenderer.astro's `openingLevel()` (generalized from the
//    heritage-only `heritageLevel()` in this same commit) give it an h1 when
//    it opens a page and an h2 everywhere else, exactly the way the heritage
//    band already worked.
//
// 4. THE IDENTITY PASS (2026-09-24, feat/utility-identity). The opener is
//    now the brand INDIGO band with the basin drawn large in gold
//    (GiveBand.astro's h1 path), because the closing call to action became a
//    gold band with a glyph in the Visit pass and a gold opener made the page
//    begin and end on the same band. The two "Ways to give" / "Where it goes"
//    eyebrows came off: each named the heading under it a second time
//    (rollout rule 11). Nothing else on the page changed.

export default {
  id: 'page-give',
  type: 'page',
  slug: 'give',

  // Every sentence on this page that is not the church's own: the give band's
  // one sentence, the three "Ways to give" paragraphs in full, and the search
  // description. Every one of these is flagged in the approval note (spec
  // 5.9's own closing line: "the church should replace this page's copy with
  // its own stewardship words when it has them").
  newCopy: [
    'Support the work of this church. (give band heading)',
    'Your gift keeps this church running and reaching Muncie. (give band body, one sentence)',
    'You can give online through Church Center any time. (Ways to give, paragraph 1)',
    'You can also give in person during Sunday worship, when the offering is taken. (Ways to give, paragraph 2)',
    'Or mail a check to the church office. (Ways to give, paragraph 3, lead-in to the mailing address)',
    'Give to First Baptist Church Muncie, an American Baptist church in downtown Muncie, Indiana: online through Church Center, in person on Sunday, or by mail. (search description, not shown on the page; 2026-09-24 local search pass)',
  ],

  // Edits to the church's own sentences (ruling P16). The words are still
  // theirs; only the dash and its label are touched.
  edits: [
    'Dropped: the "Support – " label on who-we-are.txt line 90 ("Support – We give sacrificially to help those in need through regular offerings and donations."). The band already carries its own heading ("What your gift supports"), so repeating "Support" as a second label would say the same word twice; the sentence prints on its own, unchanged apart from the label and the en-dash that introduced it.',
  ],

  // The church has to decide two things before this page is final: whether to
  // say anything about tax status (spec 5.9 says nothing, deliberately), and
  // whether to replace the "Ways to give" paragraphs with its own words once
  // it has them. Both are also on FACTS_TO_CONFIRM in scripts/seed-pages.mjs
  // ("Give page copy in their words, and whether to state anything about tax
  // status").
  confirm: [
    'Give page copy in their words, and whether to state anything about tax status: neither ' +
      'who-we-are.txt nor outreach.txt says anything about tax deductibility, and spec 5.9 asks ' +
      'for nothing about it either, so this page currently says nothing. The three "Ways to give" ' +
      'paragraphs are net-new copy (declared above) standing in for stewardship words the church ' +
      'has not written yet.',
  ],

  // No photograph on this page at all: the give band carries no image field
  // (churchSections.ts giveBandSection), so there is nothing to consent for.
  photoConsent: [],

  async build(ctx) {
    const { copy, settings } = ctx;
    const { paragraphs, decodeEntities, ctaInternal, ctaExternal } = copy;

    if (!settings) {
      throw new Error(
        'give.mjs: siteSettings is not available. This page reads the giving link, the service ' +
          'time and the address off it rather than retyping them (CLAUDE.md rule 15).',
      );
    }
    if (!settings.givingUrl) {
      throw new Error(
        'give.mjs: siteSettings.givingUrl is not set. The give band, the "Ways to give" link and ' +
          "the closing band's second button all depend on it.",
      );
    }

    const addressLines = String(settings.address ?? '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (addressLines.length < 2) {
      throw new Error(
        'give.mjs: siteSettings.address does not have both a street line and a city/state/zip ' +
          'line. "By post" needs both.',
      );
    }
    const [streetLine, cityLine] = addressLines;

    // -- Reading the two captures for "Where it goes" ------------------------
    // Same pattern as history.mjs's para(): the one line of the named capture
    // containing `phrase`, decoded and trimmed. Throws when the phrase has
    // moved, so a rewritten sentence fails the run instead of seeding empty.
    const lineFrom = (slug, phrase) => {
      const found = copy
        .textFile(slug)
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(`give.mjs: "${phrase}" is not in scripts/data/pages/${slug}.txt any more`);
      }
      return decodeEntities(found).trim();
    };

    // who-we-are.txt:90, "Support – We give sacrificially to help those in
    // need through regular offerings and donations." The "Support – " label is
    // dropped (edits list above); everything after it is unchanged.
    const supportRaw = lineFrom('who-we-are', 'give sacrificially');
    const dashAt = supportRaw.indexOf('–');
    if (dashAt === -1) {
      throw new Error(
        'give.mjs: expected an en-dash after the "Support" label in who-we-are.txt; the capture ' +
          'no longer has one, so drop this cut.',
      );
    }
    const supportSentence = supportRaw.slice(dashAt + 1).trim();

    // outreach.txt:9, "Special offerings and projects for disaster relief,
    // mission work, and other needs." Kept whole, no edit.
    const specialOfferingsSentence = lineFrom('outreach', 'Special offerings and projects');

    return {
      title: 'Give',
      slug: { _type: 'slug', current: 'give' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. The give band, opening the page. No hero: SectionRenderer's
        //    openingLevel() gives this an h1 since it is blockIndex 0, the
        //    same way /history's heritageBandSection does. No buttonUrl set,
        //    so the button falls back to settings.givingUrl; no buttonLabel
        //    set, so it falls back to the schema/component default ("Give
        //    through Church Center"), the same pattern home.mjs's give band
        //    already uses.
        {
          _type: 'giveBandSection',
          _key: 'give-open',
          heading: 'Support the work of this church.',
          body: 'Your gift keeps this church running and reaching Muncie.',
        },

        // 2. Three ways to give, all new copy (declared above), each a short
        //    paragraph. Online links to Church Center; in person names the
        //    Sunday service time from settings; by post gives both lines of
        //    the church's own mailing address.
        {
          _type: 'richTextSection',
          _key: 'give-ways',
          heading: 'Three ways to give',
          body: [
            ...paragraphs(
              `You can give online through Church Center any time. [Give through Church Center](${settings.givingUrl})`,
              'gw-online',
            ),
            ...paragraphs(
              `You can also give in person during Sunday worship, when the offering is taken. ${settings.serviceTime}.`,
              'gw-person',
            ),
            ...paragraphs(
              `Or mail a check to the church office: First Baptist Church, ${streetLine}, ${cityLine}.`,
              'gw-post',
            ),
          ],
        },

        // 3. Where it goes: only the church's own two sentences, nothing
        //    added. No amounts, no tax status (see the top-of-file note and
        //    the confirm list above).
        {
          _type: 'richTextSection',
          _key: 'give-where',
          heading: 'What your gift supports',
          body: [
            ...paragraphs(supportSentence, 'gwh-a'),
            ...paragraphs(specialOfferingsSentence, 'gwh-b'),
          ],
        },

        // 4. Closing band, subhead from Site settings rather than retyped,
        //    second button straight to Church Center's giving page.
        {
          _type: 'ctaBandSection',
          _key: 'give-cta',
          eyebrow: 'Questions?',
          headline: 'Ask the office.',
          subhead: `${settings.serviceTime}. ${streetLine}, ${cityLine}.`,
          cta: ctaInternal('Contact us', 'contact'),
          secondaryCta: ctaExternal('Give online', settings.givingUrl),
        },
      ],

      seoTitle: 'Give | First Baptist Church Muncie',
      seoDescription:
        'Give to First Baptist Church Muncie, an American Baptist church in downtown Muncie, Indiana: online through Church Center, in person on Sunday, or by mail.',
    };
  },
};
