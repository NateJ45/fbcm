// scripts/pages/staff.mjs
//
// The Staff page, in the church identity (2026-09-24, the Staff identity pass,
// docs/superpowers/plans/2026-09-24-fbcm-rollout-overnight.md; first composed
// as section 5.6 of docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md).
// Two Wix pages (ministers 1,162 words, team 213 words) plus sixteen separate
// /team/<slug> profile pages are ONE page, in the church's own order and under
// the church's own headings (rollout rule 6):
//
//   heroSection (window)   "Get to know the ministers of FBCM", the two
//                          Co-Pastors in a two-light window, on indigo
//   staffGridSection       Pastors & Staff, with the church's account of how
//                          it is led beside the heading (gold band)
//   richTextSection        A Note From Our Pastors, the whole letter (#letter)
//   staffGridSection       Church Coordination Team, with the church's
//                          definition of it beside the heading (brown band)
//   imageTextSection       Deacons, beside the photograph, with "What are
//                          Deacons?" restored as its own heading
//   staffGridSection       Support and volunteer roles (taupe band)
//   scriptureBandSection   Every Member of this Church: 1 Corinthians 12:4-6
//                          and the church's paragraph (indigo-dark band)
//   ctaBandSection         Ask the office.
//
// The staff bands' grounds are DERIVED from the group each one shows
// (src/lib/staff-band.ts), which is why the page reads indigo, gold, the
// paper (the letter), brown, the paper (Deacons), taupe, indigo-dark: the
// Who We Are goals sequence with the page's own ground between the bands.
//
// Nine things about this file are deliberate.
//
// 1. NOT ONE PERSON IS TYPED HERE. Every name, role, email, portrait and bio on
//    this page is read at BUILD time from the staffMember documents
//    (CLAUDE.md rule 15). The three grids carry a `group` and nothing else, so
//    a staff change in the Studio moves this page without anyone re-seeding
//    it, and the three places the Wix site listed the same sixteen people
//    (ministers.txt, team.txt, the individual profile) cannot drift apart here
//    because there is only one of them.
//
// 2. THE ANCHORS ARE LOAD-BEARING. Plan 1 retired /ministers, /team and every
//    /team/<slug>, and five of those redirects point at a CARD on this page:
//    /staff#kendall-ellis, #jonathan-balmer, #cynthia-smith, #loraine-garrett
//    and #molly-flodder. StaffGrid.astro puts each person's slug on their
//    card, so those five land as long as the right GROUPS render here: the
//    first three need the pastors grid, the last two the coordination grid.
//    Three more anchors are this page's own: `pastors` and `coordination`
//    (the hero's two buttons) and `deacons`. None collides with a card id or
//    with SectionRenderer's `<headingId>-band` fallback.
//
// 3. THE HERO IS THE TWO CO-PASTORS, NOT A GRID PORTRAIT. The window hero's
//    lights take two library photographs used nowhere else on the site
//    (Kendall and Jonathan outdoors by a brick wall, the church's own older
//    headshots), so the hero does not repeat a portrait the pastors band draws
//    a screen later, and a two-light window is the building's own window glyph.
//    The pair also keeps Kendall from standing alone for the whole staff, which
//    is an open question on /who-we-are's "Meet Our Staff" card; this page does
//    not answer it and does not touch that card.
//
// 4. THE FULL LETTER STAYS HERE, WHOLE (fix round 1, 2026-09-24). Since the
//    Who We Are identity pass the letter is also whole on /who-we-are#letter;
//    whether it should appear on both pages is an owner question Nathan has
//    not decided (docs/PENDING.md), so the content stays: all eight
//    paragraphs, verbatim, in the church's own order, under the `letter`
//    anchor, straight after the pastors who wrote it. It is a richTextSection,
//    as before, not the Who We Are letterSection: that block is built around a
//    portrait of the two pastors, and the only such photographs are already
//    used (the joint one on /who-we-are's letter, the headshots in this page's
//    window and grid). One punctuation edit: the em-dash in the Co-Pastors
//    paragraph becomes a comma (CLAUDE.md rule 2).
//
// 5. THE DEACON CHAIR GETS A REAL @. The Wix page writes the address as
//    "deaconchair[at]fbcmuncie.org", which is a human-readable spam dodge that
//    a visitor cannot click. Spec 5.6 lists this as a fix; it is an EDIT to
//    the church's own line, not new copy, so it is declared in `edits`. The
//    footnote asterisk that pairs the line with Jim Butler's name is kept on
//    both, exactly as the church wrote it.
//
// 6. THE GRIDS EXPLAIN THEMSELVES IN THE CHURCH'S WORDS (ruling P22). The four
//    paragraphs of ministers.txt that the Wix page printed above its own lists
//    (what a pastor is, why two of ours are married to each other, what the
//    Worship Director does, and what the Church Coordination Team is) were two
//    richText bands before the grids; they are now each grid's own `intro`
//    (added 2026-09-24), beside the heading, so an explanation and its faces
//    are one band under one heading, as the church had them.
//
// 7. THE CHURCH'S OWN HEADINGS COME BACK (rollout rule 6). "Get to know the
//    ministers of FBCM" (the Wix page's own title), "Pastors & Staff",
//    "Church Coordination Team", "Deacons", "What are Deacons?" and "Every
//    Member of this Church" are all ministers.txt's; the plan 2b stand-ins
//    ("The people who serve here.", "How we are led", "Our deacons") are gone.
//    The support band keeps "Support and volunteer roles": the Wix page had no
//    one heading over those three people (only the tab labels "Ministry
//    Intern" and "Pianist"), so the Studio's own name for the group stands.
//    The decorative eyebrows are gone (rule 11).
//
// 8. THE SCRIPTURE BAND IS THE CHURCH'S WHOLE SECTION NOW. Plan 2b cut the
//    last clause of the "Every Member" paragraph into a one-line band. The
//    church's section is a heading, 1 Corinthians 12:4-6 with its reference,
//    and that paragraph whole, so the band carries all four (scriptureBand
//    `heading` and `intro`, added 2026-09-24) and nothing is cut. The quote
//    marks in the capture come off the stored verse because the band draws
//    them (a band with a reference is a quotation). "same" is picked out in
//    gold: the Spirit, the Lord and God, the three the verse names.
//
// 9. EVERY BLOCK IS READ OFF A CAPTURE. pick() and linesBetween() THROW when an
//    anchor phrase moves, so a band that would have seeded empty, or
//    half-empty, fails the run instead of shipping a hole.

/** A hotspot centred on (x, y), kept inside the frame so the Studio accepts it. */
function hotspot(x, y) {
  const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
  return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
}

export default {
  id: 'page-staff',
  type: 'page',
  slug: 'staff',

  // One sentence on this page did not exist on the Wix site, and it is never
  // shown to a visitor: it is the search-result description.
  newCopy: [
    'The staff and volunteers of First Baptist Church Muncie: our pastors, the Church Coordination Team, and our deacons. (SEO description, not shown on the page)',
  ],

  // Edits to the church's own sentences (ruling P16): the words are still
  // theirs, changed in place. Each one is made by a helper below that throws if
  // the sentence it is editing has moved.
  edits: [
    'Deacon chair address: "deaconchair[at]fbcmuncie.org" becomes a real mailto link to deaconchair@fbcmuncie.org, because a visitor cannot click "[at]". (Deacons band; spec 5.6 "Fixes".)',
    'Punctuation: "we also have a Worship Director. who coordinates and supports our worship leaders" becomes "...a Worship Director, who coordinates and supports our worship leaders". The full stop mid-sentence is a typo in scripts/data/pages/ministers.txt line 12; no word changes. (Pastors & Staff.)',
    'Em-dash to comma (CLAUDE.md rule 2), inside a verbatim scripture quotation: Kendall Ellis’s staff bio quotes Romans 8:17 (NIV) as “...then we are heirs—heirs of God and co-heirs with Christ...” and it now reads “...then we are heirs, heirs of God...”. No other word changes. The bio is a field on her staff document rather than a sentence this module builds, so the change was made by scripts/fix-bio-em-dashes.mjs (backed up first); it is declared here because this is one of the two pages that print it.',
    'Em-dash to comma (site style): "...calling a married couple to be Co-Pastors, both of us preaching the word and shepherding God’s people in this community." (A Note From Our Pastors.)',
    'Typography only: the curly quotation marks around 1 Corinthians 12:4-6 come off the stored verse because the scripture band draws them itself; the page shows the verse in quotation marks exactly as the Wix page did. (Every Member of this Church.)',
  ],

  // No band on this page shows an identifiable child. Every portrait is an
  // adult who serves in a named role, the two hero lights are the Co-Pastors,
  // and the deacons group photo is five adults.
  photoConsent: [],

  async build(ctx) {
    const { images, copy, settings, staff } = ctx;
    const {
      paragraphs,
      bullets,
      heading,
      linesBetween,
      ctaAnchor,
      ctaInternal,
      ctaExternal,
      decodeEntities,
    } = copy;

    if (!settings) {
      throw new Error(
        'staff.mjs: siteSettings is not available. The closing band reads the street and the ' +
          'phone number off it rather than retyping them.',
      );
    }
    if (!Array.isArray(staff) || staff.length === 0) {
      throw new Error(
        'staff.mjs: no staffMember documents. Every person on this page is DERIVED from them ' +
          '(CLAUDE.md rule 15); there is nothing to fall back on, on purpose.',
      );
    }

    // -- Facts, derived from settings ---------------------------------------
    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();
    // CtaLink strips a phone number to digits for a `phone` link; this button
    // rides in on externalUrl (ctaBlock allows the tel: scheme), so it is
    // stripped here instead.
    const telDigits = String(settings.phone ?? '').replace(/[^\d]/g, '');
    if (!telDigits) {
      throw new Error(
        'staff.mjs: siteSettings has no phone number for the "Call the office" button.',
      );
    }

    // -- Photographs ---------------------------------------------------------
    /** A manifest photo with a hotspot, throwing when the manifest lacks it. */
    const photo = async (key, x, y, extra = {}) => {
      const img = await images.image(key);
      if (!img) throw new Error(`staff.mjs: no photo in the manifest for "${key}"`);
      return { ...img, hotspot: hotspot(x, y), ...extra };
    };

    // The hero's two lights (note 3). Kendall first, as the church lists her.
    // Both are square headshots in a tall lancet, so only x matters: each face
    // sits at the middle of its photograph.
    const heroFrames = [
      await photo('staff-hero-kendall', 0.5, 0.4, { _key: 'frame-1' }),
      await photo('staff-hero-jonathan', 0.48, 0.4, { _key: 'frame-2' }),
    ];

    // The deacons group photo: the church's caption names the five "left to
    // right in photo", so the band cannot be seeded without it.
    const deaconsPhoto = await images.image('staff-deacons-2026');
    if (!deaconsPhoto) {
      throw new Error(
        'staff.mjs: no photo in the manifest for "staff-deacons-2026". The deacons band names the ' +
          'five "left to right in photo", so the band cannot be seeded without it.',
      );
    }

    // -- Reading the captures ------------------------------------------------

    /** The first line of `slug`.txt containing `phrase`, decoded and trimmed. */
    const line = (slug, phrase) => {
      const found = copy
        .textFile(slug)
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(`staff.mjs: "${phrase}" is not in scripts/data/pages/${slug}.txt any more`);
      }
      return decodeEntities(found).trim();
    };

    /** The one line of `lines` containing `phrase`, decoded and trimmed. */
    const pick = (lines, phrase, slug) => {
      const hit = lines.filter((l) => l.includes(phrase));
      if (hit.length === 0) {
        throw new Error(
          `staff.mjs: "${phrase}" is no longer in that span of scripts/data/pages/${slug}.txt`,
        );
      }
      return decodeEntities(hit[0]).trim();
    };

    /** Replace one phrase with another, throwing when the phrase has moved. */
    const swap = (sentence, find, replaceWith) => {
      if (!sentence.includes(find)) {
        throw new Error(
          `staff.mjs: cannot edit "${find}": it is not in the sentence the capture now carries. ` +
            'Re-read the section before changing this.',
        );
      }
      return sentence.replace(find, replaceWith);
    };

    // 1. The hero: the Wix page's own title and the line under it, which the
    //    capture wraps across two lines.
    const heroTitle = line('ministers', 'Get to know the ministers of FBCM');
    const heroLead = [
      line('ministers', 'Learn about the staff'),
      ...linesBetween('ministers', 'Learn about the staff', 'Pastors & Staff'),
    ]
      .map((l) => decodeEntities(l).trim())
      .filter(Boolean)
      .join(' ');
    if (!heroLead.startsWith('Learn about the staff') || !heroLead.endsWith('below.')) {
      throw new Error(
        `staff.mjs: the ministers page's lead no longer reads as one sentence ending "below.": "${heroLead}"`,
      );
    }

    // 2. Pastors & Staff: the church's account of how it is led (ruling P22),
    //    the three paragraphs the Wix page printed above its pastor cards. The
    //    one edit is a full stop that should be a comma.
    const howWeAreLed = [
      ...paragraphs(line('ministers', 'under-shepherds'), 'hw-a'),
      ...paragraphs(line('ministers', 'two Co-Pastors, a married couple'), 'hw-b'),
      ...paragraphs(
        swap(
          line('ministers', 'we also have a Worship Director'),
          'a Worship Director. who coordinates',
          'a Worship Director, who coordinates',
        ),
        'hw-c',
      ),
    ];

    /** An em-dash between words becomes a comma (CLAUDE.md rule 2). Throws if there is none. */
    const comma = (sentence) => {
      if (!sentence.includes('—')) {
        throw new Error(
          `staff.mjs: expected an em-dash to fix in "${sentence.slice(0, 60)}..."; the capture no ` +
            'longer has one, so drop this call.',
        );
      }
      return sentence.replace(/\s*—\s*/g, ', ');
    };

    // 2b. The pastors' letter, whole (note 4). Eight paragraphs between their
    //     sign-off line and the next section of the Who We Are capture.
    const letterLines = linesBetween('who-we-are', 'Pastors Kendall & Jonathan', 'Sunday Worship');
    const letterLine = (phrase) => pick(letterLines, phrase, 'who-we-are');
    const letter = [
      ...paragraphs(letterLine('If you'), 'lt-a'),
      ...paragraphs(letterLine('Figure it all out'), 'lt-b'),
      ...paragraphs(letterLine('Even so, we know people curious'), 'lt-c'),
      ...paragraphs(letterLine('We love the Good News'), 'lt-d'),
      ...paragraphs(letterLine('all about the church'), 'lt-e'),
      // The one em-dash in the letter.
      ...paragraphs(comma(letterLine('honored to serve as Co-Pastors')), 'lt-f'),
      ...paragraphs(letterLine('We love to serve here'), 'lt-g'),
      ...paragraphs(letterLine('Finally, we would love'), 'lt-h'),
    ];

    // 3. What the Church Coordination Team IS: ministers.txt line 37, the
    //    church's own definition of the body whose eleven faces follow it.
    const whatTheCctIs = paragraphs(
      line('ministers', 'Members of the Church Coordination Team'),
      'cct',
    );

    // 4. The deacons. Three spans of ministers.txt: the lead-in and the five
    //    names, the chair's footnote, and the church's own answer to "What are
    //    Deacons?" (its heading restored, note 7), including the three-year term.
    const deaconNamesLines = linesBetween(
      'ministers',
      'Current Deacons (left to right in photo):',
      '*Deacon chair',
    );
    const chairLine = pick(
      linesBetween('ministers', 'Janis Wright', 'What are Deacons?'),
      'Deacon chair',
      'ministers',
    );
    const whatAreDeacons = linesBetween('ministers', 'What are Deacons?', 'Ministry Intern');

    // The five names arrive on one line, comma-separated, in the order they
    // stand in the photograph. Splitting them into bullets keeps that order and
    // keeps Jim Butler's footnote asterisk attached to his name.
    const deaconNames = pick(deaconNamesLines, 'Gayle Songer', 'ministers')
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (deaconNames.length !== 5) {
      throw new Error(
        `staff.mjs: expected five deacons on one line of ministers.txt, got ${deaconNames.length}. ` +
          'Re-read the section before changing this.',
      );
    }

    const deaconsBody = [
      // The church's own lead-in, which is what makes the photograph legible.
      ...paragraphs(line('ministers', 'Current Deacons (left to right in photo):'), 'dc-lead'),
      ...bullets(deaconNames, 'dc-name'),
      // The [at] becomes a real @, and the address becomes a real mailto link.
      // The asterisk stays: it is what pairs this line with Jim Butler's name.
      ...paragraphs(
        swap(
          chairLine,
          'deaconchair[at]fbcmuncie.org',
          '[deaconchair@fbcmuncie.org](mailto:deaconchair@fbcmuncie.org)',
        ),
        'dc-chair',
      ),
      heading(line('ministers', 'What are Deacons?'), 3, 'dc-what'),
      ...paragraphs(pick(whatAreDeacons, 'Each active member', 'ministers'), 'dc-a'),
      ...paragraphs(pick(whatAreDeacons, 'In the New Testament', 'ministers'), 'dc-b'),
      ...paragraphs(pick(whatAreDeacons, 'Following that example', 'ministers'), 'dc-c'),
    ];

    // 5. Every Member of this Church (note 8): the heading, the verse with its
    //    reference, and the paragraph, whole.
    const everyMemberLines = linesBetween(
      'ministers',
      'Every Member of this Church',
      'Seeking more information',
    );
    const everyMemberHeading = line('ministers', 'Every Member of this Church');
    const quoted = pick(everyMemberLines, 'There are different kinds of gifts', 'ministers');
    if (!quoted.startsWith('“') || !quoted.endsWith('”')) {
      throw new Error(
        'staff.mjs: 1 Corinthians 12:4-6 is no longer in curly quotation marks in ministers.txt; ' +
          'the band draws its own, so re-read the line before changing this.',
      );
    }
    const verse = quoted.slice(1, -1).trim();
    const reference = pick(everyMemberLines, '1 Corinthians 12:4-6', 'ministers');
    const everyMember = pick(everyMemberLines, 'FBCM challenges each member', 'ministers');
    if (!/\bsame\b/.test(verse)) {
      throw new Error('staff.mjs: the verse no longer says "same", the word the band picks out.');
    }

    return {
      title: 'Staff',
      slug: { _type: 'slug', current: 'staff' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. The window: the church's own title, the two Co-Pastors (note 3),
        //    and two buttons that are a table of contents for a long page.
        {
          _type: 'heroSection',
          _key: 'st-hero',
          layout: 'window',
          eyebrow: 'Staff',
          headline: heroTitle,
          subhead: heroLead,
          frames: heroFrames,
          primaryCta: ctaAnchor('Pastors & Staff', '/staff#pastors'),
          secondaryCta: ctaAnchor('Church Coordination Team', '/staff#coordination'),
        },

        // 2. Pastors & Staff, on the gold band: the two Co-Pastors and the
        //    Worship Arts Director, filed in the same group, with the church's
        //    account of how it is led beside the heading. /staff#kendall-ellis,
        //    #jonathan-balmer and #cynthia-smith land on cards in this band.
        {
          _type: 'staffGridSection',
          _key: 'st-pastors',
          anchor: { _type: 'slug', current: 'pastors' },
          heading: 'Pastors & Staff',
          intro: howWeAreLed,
          group: 'pastors',
          showBios: true,
        },

        // 2b. Their letter, whole, on the page's own ground between the gold
        //     and brown bands (note 4). The heading is the church's, as the
        //     Who We Are capture's contents list spells it.
        {
          _type: 'richTextSection',
          _key: 'st-letter',
          anchor: { _type: 'slug', current: 'letter' },
          heading: 'A Note From Our Pastors',
          body: letter,
        },

        // 3. The Church Coordination Team, on the brown band, its definition
        //    beside the heading. /staff#loraine-garrett and #molly-flodder land
        //    on cards here, and the hero's second button on the band.
        {
          _type: 'staffGridSection',
          _key: 'st-coordination',
          anchor: { _type: 'slug', current: 'coordination' },
          heading: 'Church Coordination Team',
          intro: whatTheCctIs,
          group: 'coordination',
          showBios: true,
        },

        // 4. The deacons, in their own words, beside the photograph their own
        //    caption depends on.
        {
          _type: 'imageTextSection',
          _key: 'st-deacons',
          anchor: { _type: 'slug', current: 'deacons' },
          heading: 'Deacons',
          image: deaconsPhoto,
          imageSide: 'left',
          body: deaconsBody,
        },

        // 5. Support and volunteer roles, on the taupe band: the intern, the
        //    wedding coordinator and the pianist/organist. All three have a bio.
        {
          _type: 'staffGridSection',
          _key: 'st-support',
          heading: 'Support and volunteer roles',
          group: 'support',
          showBios: true,
        },

        // 6. Every Member of this Church, on the indigo-dark band (note 8).
        {
          _type: 'scriptureBandSection',
          _key: 'st-scripture',
          heading: everyMemberHeading,
          verse,
          reference,
          accentWord: 'same',
          intro: everyMember,
        },

        // 7. Closing band, with both buttons (plan 2b ruling P13) and a subhead
        //    built from Site settings rather than retyped.
        {
          _type: 'ctaBandSection',
          _key: 'st-cta',
          eyebrow: "Can't find who you need?",
          headline: 'Ask the office.',
          subhead: `${streetLine}. ${settings.phone}.`,
          cta: ctaInternal('Contact us', 'contact'),
          // A tel: link should not open a second tab, so the flag ctaExternal
          // sets for an off-site URL is turned back off here.
          secondaryCta: {
            ...ctaExternal('Call the office', `tel:${telDigits}`),
            openInNewTab: false,
          },
        },
      ],

      seoTitle: 'Staff | First Baptist Church Muncie',
      seoDescription:
        'The staff and volunteers of First Baptist Church Muncie: our pastors, the Church Coordination Team, and our deacons.',
    };
  },
};
