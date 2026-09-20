// scripts/pages/staff.mjs
//
// The Staff page, composed exactly as section 5.6 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// two Wix pages (ministers 1,162 words, team 213 words) plus sixteen separate
// /team/<slug> profile pages become ONE page with three staff grids, one
// deacons band, and two bands of the church's own prose about how it is led.
//
// Seven things about this file are deliberate.
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
//    Two more anchors are this page's own: `coordination` (the Church
//    Coordination Team band) and `letter` (the pastors' full letter, which is
//    where /who-we-are's "Read the full letter" link points). Neither collides
//    with a card id or with SectionRenderer's `<headingId>-band` fallback.
//
// 3. THE HERO TAKES A PASTOR'S PORTRAIT, NOT THE DEACONS PHOTO. Spec 5.6 gives
//    the hero "the 2026 deacons group photo or the co-pastors portrait", and
//    gives the deacons band that same group photo unconditionally. Only one of
//    those two readings puts each photo on the page once: the group photo
//    belongs to the deacons band, where the church's own caption ("left to
//    right in photo") depends on it being there, so the hero takes the other
//    option. There is no joint portrait of the two Co-Pastors in the archive,
//    so the hero reads Kendall Ellis's portrait off her staff document rather
//    than holding a seventeenth copy of a photo the dataset already has.
//
// 4. THE FULL LETTER LIVES HERE, WHOLE. Task 7 put three of its eight
//    paragraphs on /who-we-are and linked here for the rest; this band is the
//    target of that link, so it carries all eight, verbatim, in the church's
//    own order. One punctuation edit: the em-dash in the Co-Pastors paragraph
//    becomes a comma (CLAUDE.md rule 2). The en-dashes elsewhere in the letter
//    are left alone, as they are on every other plan-2b page.
//
// 5. THE DEACON CHAIR GETS A REAL @. The Wix page writes the address as
//    "deaconchair[at]fbcmuncie.org", which is a human-readable spam dodge that
//    a visitor cannot click. Spec 5.6 lists this as a fix; it is an EDIT to
//    the church's own line, not new copy, so it is declared in `edits`. The
//    footnote asterisk that pairs the line with Jim Butler's name is kept on
//    both, exactly as the church wrote it.
//
// 6. THE GRIDS DO NOT EXPLAIN THEMSELVES, SO THE CHURCH DOES (ruling P22).
//    Two richText bands carry four paragraphs of ministers.txt that the Wix
//    page printed above its own lists and that the first draft of this page
//    dropped: what a pastor is, why two of ours are married to each other,
//    what the Worship Director does, and what the Church Coordination Team
//    is. Each sits BEFORE the grid it explains. Neither carries an anchor,
//    so `#coordination` stays on the grid and every redirect still lands on
//    a person.
//
// 7. EVERY BLOCK IS READ OFF A CAPTURE. pick() and linesBetween() THROW when an
//    anchor phrase moves, so a band that would have seeded empty, or
//    half-empty, fails the run instead of shipping a hole.

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
    'Em-dash to comma (site style): "...calling a married couple to be Co-Pastors, both of us preaching the word and shepherding God’s people in this community." (A note from our pastors.)',
    'Cut and re-cased: the scripture band is the closing sentence of the "Every Member of this Church" paragraph with its opening clause cut, so it reads "Every Christian is called to minister to others in some way." rather than "And, even if not currently serving in those particular capacities, every...".',
    'Punctuation: "we also have a Worship Director. who coordinates and supports our worship leaders" becomes "...a Worship Director, who coordinates and supports our worship leaders". The full stop mid-sentence is a typo in scripts/data/pages/ministers.txt line 12; no word changes. ("How we are led.")',
  ],

  // No band on this page shows an identifiable child. Every portrait is an
  // adult who serves in a named role, and the deacons group photo is five
  // adults.
  photoConsent: [],

  async build(ctx) {
    const { images, copy, settings, staff } = ctx;
    const {
      paragraphs,
      bullets,
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

    // -- The hero portrait, read off the staff document ---------------------
    // See note 3 at the top of this file. The alt text is built from the
    // document's own name and role, so it cannot disagree with the card below.
    const kendall = staff.find((s) => s?.slug?.current === 'kendall-ellis');
    if (!kendall?.photo?.asset) {
      throw new Error(
        'staff.mjs: no staffMember document with slug "kendall-ellis" carrying a photo. The hero ' +
          'reads its portrait off that document rather than holding a second copy of it.',
      );
    }
    const heroFrame = {
      ...kendall.photo,
      _key: 'frame-1',
      alt: `${kendall.name}, ${kendall.role}`,
    };

    // -- The deacons group photo --------------------------------------------
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

    // 1. The pastors' letter, whole. Eight paragraphs between their sign-off
    //    heading and the next section of the Who We Are capture. Task 7 keeps
    //    three of them on /who-we-are and links here for all eight.
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

    // 2. The deacons. Three spans of ministers.txt: the lead-in and the five
    //    names, the chair's footnote, and the church's own answer to "What are
    //    Deacons?" including the three-year term.
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
      ...paragraphs(pick(whatAreDeacons, 'Each active member', 'ministers'), 'dc-a'),
      ...paragraphs(pick(whatAreDeacons, 'In the New Testament', 'ministers'), 'dc-b'),
      ...paragraphs(pick(whatAreDeacons, 'Following that example', 'ministers'), 'dc-c'),
    ];

    // 2b. The church's own account of how it is led (ruling P22). Three
    //     paragraphs of ministers.txt that the Wix page printed above its
    //     pastor cards and that this page dropped on the way here: what a
    //     pastor is, why two of them are married to each other, and what the
    //     Worship Director does. They go BEFORE the pastors grid, because that
    //     is where the church put them and because the grid means less
    //     without them. The one edit is a full stop that should be a comma.
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

    // 4b. What the Church Coordination Team IS. One paragraph, ministers.txt
    //     line 37, the church's own definition of the body whose eleven cards
    //     follow it. No eyebrow: the grid below carries one, and two eyebrows
    //     stacked would read as two sections rather than one explanation and
    //     its list (CLAUDE.md rule 17).
    const whatTheCctIs = paragraphs(
      line('ministers', 'Members of the Church Coordination Team'),
      'cct',
    );

    // 3. The scripture band. The closing sentence of the church's "Every Member
    //    of this Church" paragraph, with its opening clause cut so the band can
    //    stand on its own, and "every" re-cased to start the sentence. No word
    //    is changed or added.
    const everyMember = pick(
      linesBetween('ministers', '1 Corinthians 12:4-6', 'Seeking more information'),
      'FBCM challenges each member',
      'ministers',
    );
    const closingClause = 'every Christian is called to minister to others in some way.';
    if (!everyMember.endsWith(closingClause)) {
      throw new Error(
        'staff.mjs: the "Every Member of this Church" paragraph no longer ends with the sentence ' +
          'the scripture band quotes. Re-read ministers.txt line 127 before changing this.',
      );
    }
    const verse = `E${closingClause.slice(1)}`;

    return {
      title: 'Staff',
      slug: { _type: 'slug', current: 'staff' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero. One pastor's portrait beside the line, and two buttons that
        //    are really a table of contents for a long page.
        {
          _type: 'heroSection',
          _key: 'st-hero',
          layout: 'split',
          size: 'short',
          eyebrow: 'Staff',
          headline: 'The people who serve here.',
          frames: [heroFrame],
          primaryCta: ctaAnchor('Pastors', '/staff#kendall-ellis'),
          secondaryCta: ctaAnchor('Church Coordination Team', '/staff#coordination'),
        },

        // 2. How the church says it is led, in its own words, before the
        //    faces. See the note beside `howWeAreLed` above.
        {
          _type: 'richTextSection',
          _key: 'st-how-led',
          eyebrow: 'Pastors and staff',
          heading: 'How we are led',
          body: howWeAreLed,
        },

        // 3. The pastors. Three people today, not two: the two Co-Pastors and
        //    the Worship Arts Director, who is filed in the same group. The
        //    heading says what the band actually draws, exactly as the same
        //    band on /who-we-are does. /staff#kendall-ellis, #jonathan-balmer
        //    and #cynthia-smith land on cards inside this grid.
        {
          _type: 'staffGridSection',
          _key: 'st-pastors',
          eyebrow: 'Pastors',
          heading: 'Our pastors and worship arts director',
          group: 'pastors',
          showBios: true,
        },

        // 4. Their letter, whole. /who-we-are carries three of these eight
        //    paragraphs and links to `#letter` for the rest, so this anchor may
        //    not be renamed without that link changing in the same commit.
        {
          _type: 'richTextSection',
          _key: 'st-letter',
          anchor: { _type: 'slug', current: 'letter' },
          eyebrow: 'A note from our pastors',
          heading: 'From Kendall and Jonathan',
          body: letter,
        },

        // 5. What the Church Coordination Team is, before the eleven faces.
        //    It carries NO anchor: `#coordination` stays on the grid below, so
        //    the hero button and the redirects still land on the people.
        {
          _type: 'richTextSection',
          _key: 'st-cct-what',
          heading: 'What the Church Coordination Team is',
          body: whatTheCctIs,
        },

        // 6. The Church Coordination Team. Eleven cards, bios expanding where
        //    the church wrote one. /staff#loraine-garrett and #molly-flodder
        //    land on cards inside this grid, and the hero's second button
        //    points at `#coordination`.
        {
          _type: 'staffGridSection',
          _key: 'st-coordination',
          anchor: { _type: 'slug', current: 'coordination' },
          eyebrow: 'Church Coordination Team',
          heading: 'The Church Coordination Team',
          group: 'coordination',
          showBios: true,
        },

        // 7. Support and volunteer roles: the intern, the wedding coordinator
        //    and the pianist/organist. Bios are shown for the same reason as
        //    above, which is that all three have one.
        {
          _type: 'staffGridSection',
          _key: 'st-support',
          eyebrow: 'Support and volunteer roles',
          heading: 'Support and volunteer roles',
          group: 'support',
          showBios: true,
        },

        // 8. The deacons, in their own words, beside the photograph their own
        //    caption depends on.
        {
          _type: 'imageTextSection',
          _key: 'st-deacons',
          eyebrow: 'Deacons',
          heading: 'Our deacons',
          image: deaconsPhoto,
          imageSide: 'left',
          body: deaconsBody,
        },

        // 9. The sentence the whole page is for, on the indigo field.
        {
          _type: 'scriptureBandSection',
          _key: 'st-scripture',
          verse,
          accentWord: 'minister',
        },

        // 10. Closing band, with both buttons (plan 2b ruling P13) and a subhead
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
