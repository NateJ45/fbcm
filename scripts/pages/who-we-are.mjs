// scripts/pages/who-we-are.mjs
//
// The Who We Are page, composed exactly as section 5.3 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// the church-specific "about" that replaces the starter's `about` capability.
// The source is 1,332 words of theology, so the design is progressive
// disclosure: their own sentence first, then the theology in the order they
// wrote it, cut but never rewritten.
//
// Five things about this file are deliberate.
//
// 1. THEIR SENTENCE IS THE HEADLINE, AND IT IS NOT RETYPED. The hero headline
//    is siteSettings.tagline, which is the line the church closes its Worship
//    section with ("We are a Spirit-led people gathered to join Christ's
//    presence in our community.", scripts/data/pages/who-we-are.txt line 53).
//    Because the hero already says it, the Worship pillar below deliberately
//    stops before it rather than saying it twice (CLAUDE.md rule 15).
//
// 2. THE CAPTURE OPENS WITH A TABLE OF CONTENTS, SO SOME HEADINGS ARE NOT
//    WHERE THEY LOOK. Lines 3 to 11 of the capture are five contents lines:
//    "Our Watchword", "Our Goals", "Our Pledge", "A Note From Our Pastors",
//    "Where To Go Next". Four of those five NEVER APPEAR AGAIN: the sections
//    they point at carry no heading of their own in the capture. So the
//    watchword, the pledge and the pastors' letter are anchored on the first
//    line of their own PROSE instead ("(Isaiah 12:4)", "Our commitment to one
//    another", "Pastors Kendall & Jonathan"), and every anchor in this file is
//    a first occurrence, which is what linesBetween() takes. Nothing here
//    slices the file by line number.
//
// 3. EVERY CUT IS A WHOLE SENTENCE, NEVER A REWORDING. pick() finds one line
//    of a span by a distinctive phrase and THROWS when it cannot, so a cut is
//    a decision recorded in code rather than a paragraph quietly going
//    missing. The sentences left out are listed in the task report.
//
// 4. TWO PIECES OF IN-HOUSE VOCABULARY GET ONE CLAUSE EACH, AND NOTHING ELSE
//    CHANGES. "growth track" and "deacon" are explained in place with a single
//    inserted clause (spec 5.3, "Fixes"); the third term the spec names,
//    "Global Servants", is in a sentence that the 60-word Witness pillar does
//    not reach, so it is simply cut. These are EDITS to the church's own
//    sentences, so they are not `newCopy`: gloss() below does each one and
//    throws if the sentence it is glossing has moved.
//
// 5. THE STAFF BAND IS HEADED BY WHAT IT ACTUALLY RENDERS. `group: 'pastors'`
//    returns three people today, not two: Kendall Ellis and Jonathan Balmer,
//    the Co-Pastors, and Cynthia Smith, the Worship Arts Director, who is
//    filed in the same group. So the heading says so. If the church later
//    gives worship staff a group of their own, this heading goes back to
//    naming the two.

export default {
  id: 'page-who-we-are',
  type: 'page',
  slug: 'who-we-are',

  // Every sentence below that did not exist on the Wix site. The generated note
  // (docs/superpowers/notes/2026-09-19-copy-for-church-approval.md) puts these
  // in front of the church before launch.
  //
  // ONE sentence, not three. The link-cards band carries three card sentences;
  // two of them are the home page's own Beliefs and Ministries sentences,
  // reused word for word, so they are already in the note under Home and are
  // not declared a second time here. Only the Visit card needed a sentence of
  // its own, because Home's third door is History, not Visit.
  newCopy: [
    'Where to park, when to arrive, and what happens once you are inside. (link cards, Plan a visit)',
  ],

  // Edits to the church's own sentences (ruling P16): a clause inserted, a word
  // replaced, or a term cut. The words are still theirs, so these are not
  // `newCopy`; they go in their own list in the approval note, because they ask
  // the church a different question. gloss() below makes the first two and
  // throws if the sentence it is glossing has moved.
  edits: [
    'growth track: "We offer a growth track, a step by step path into the life of this church, to help us all..." (Our goals, The Way. The inserted clause explains the church’s own term, which the Wix site never does.)',
    'deacon: "...connected with a deacon, a church member chosen to care for others, who offers prayer and support." (Our goals, The Way.)',
    'Cut: the sentence naming Global Servants ("Kingdom Citizenship...") falls outside the Witness pillar and is not on the page.',
    'Em-dash to comma (CLAUDE.md rule 2), inside a verbatim scripture quotation: Kendall Ellis’s staff bio quotes Romans 8:17 (NIV) as “...then we are heirs—heirs of God and co-heirs with Christ...” and it now reads “...then we are heirs, heirs of God...”. No other word changes. The bio is a field on her staff document rather than a sentence this module builds, so the change was made by scripts/fix-bio-em-dashes.mjs (backed up first); it is declared here because this is one of the two pages that print it.',
  ],

  // No band on this page shows an identifiable child. The congregation photo
  // is adults, from behind, mid-hymn.
  photoConsent: [],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const { linesBetween, paragraphs, bullets, heading, ctaInternal, ctaExternal, decodeEntities } =
      copy;

    if (!settings) {
      throw new Error(
        'who-we-are.mjs: siteSettings is not available. This page reads the tagline, the ' +
          'service time, the street and the visitor form from it rather than retyping them.',
      );
    }

    // -- Facts, derived from settings ---------------------------------------
    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();

    // -- The photo ----------------------------------------------------------
    const congregation = await images.image('whoweare-congregation');
    if (!congregation) {
      throw new Error('who-we-are.mjs: no photo in the manifest for "whoweare-congregation"');
    }

    // -- Reading the capture -------------------------------------------------

    /** The one line of `lines` containing `phrase`, decoded and trimmed. */
    const pick = (lines, phrase) => {
      const hit = lines.filter((l) => l.includes(phrase));
      if (hit.length === 0) {
        throw new Error(
          `who-we-are.mjs: "${phrase}" is no longer in that span of ` +
            'scripts/data/pages/who-we-are.txt',
        );
      }
      return decodeEntities(hit[0]).trim();
    };

    /**
     * Insert one explanatory clause into a sentence the church wrote, and throw
     * if the sentence has changed underneath it. Nothing else about the
     * sentence moves.
     */
    const gloss = (sentence, find, replaceWith) => {
      if (!sentence.includes(find)) {
        throw new Error(
          `who-we-are.mjs: cannot gloss "${find}": it is not in the sentence the capture now ` +
            'carries. Re-read the section before changing this.',
        );
      }
      return sentence.replace(find, replaceWith);
    };

    // 1. The verse. Lines 15 to 17, the three lines the church sets Isaiah 12:4
    //    on, joined into one. The outer curly quotes come off: the band IS the
    //    quotation (src/components/sections/ScriptureBand.astro draws a
    //    blockquote), so keeping them would set the verse in quote marks
    //    inside a quotation. Punctuation only; no word changes.
    const verse = decodeEntities(
      linesBetween('who-we-are', 'Praise & Proclaim', '(Isaiah 12:4)')
        .filter((l) => l.trim())
        .join(' '),
    )
      .trim()
      .replace(/^[“"]/, '')
      .replace(/[”"]$/, '');

    // 2. The watchword. Everything between the reference under the verse and
    //    the Church Coordination Team's goals: lines 21 to 37, which is 164
    //    words, already inside the spec's ~200 budget, so nothing is cut. The
    //    two bare words in the middle of the span, "Praise" and "Proclaim",
    //    are the church's own sub-headings and are lifted to h3.
    const watchwordLines = linesBetween('who-we-are', '(Isaiah 12:4)', 'Our Church Coordination');
    const watchword = [];
    let wN = 0;
    for (const raw of watchwordLines) {
      const text = decodeEntities(raw).trim();
      if (!text) continue;
      wN += 1;
      watchword.push(
        text === 'Praise' || text === 'Proclaim'
          ? heading(text, 3, `ww-${wN}`)
          : paragraphs(text, `ww-${wN}`)[0],
      );
    }

    // 3. The four pillars, each an h3 followed by about sixty words of the
    //    church's own prose. Each span runs from one pillar heading to the
    //    next; the last runs into the first line of the pledge, which is the
    //    only thing after "Work" in the capture.
    const worshipLines = linesBetween('who-we-are', 'Worship', 'The Way');
    const wayLines = linesBetween('who-we-are', 'The Way', 'Witness');
    const witnessLines = linesBetween('who-we-are', 'Witness', 'Work');
    const workLines = linesBetween('who-we-are', 'Work', 'Our commitment to one another');

    const pillars = [
      heading('Worship', 3, 'p4-h1'),
      // 50 words. Their opening sentence and "Following God's Word". The
      // closing sentence of this section is the site tagline, and the hero at
      // the top of this page already says it.
      ...paragraphs(pick(worshipLines, 'FBCM gives praise to the Lord'), 'p4-a'),
      ...paragraphs(pick(worshipLines, "Following God's Word"), 'p4-b'),

      heading('The Way', 3, 'p4-h2'),
      // 52 words, with the two glosses. "growth track" is the church's own
      // name for its path into the life of the church and is never explained
      // on the Wix site; "deacon" is a role a first-time reader will not know.
      ...paragraphs(
        gloss(
          pick(wayLines, 'FBCM proclaims God'),
          'We offer a growth track to help us all',
          'We offer a growth track, a step by step path into the life of this church, to help us all',
        ),
        'p4-c',
      ),
      ...paragraphs(
        gloss(
          pick(wayLines, 'Caring Mentorship'),
          'connected with a deacon who offers',
          'connected with a deacon, a church member chosen to care for others, who offers',
        ),
        'p4-d',
      ),

      heading('Witness', 3, 'p4-h3'),
      // 50 words. "Kingdom Citizenship", the sentence carrying "Global
      // Servants", falls outside the sixty and is cut rather than glossed.
      ...paragraphs(pick(witnessLines, 'To make known what God has done'), 'p4-e'),
      ...paragraphs(pick(witnessLines, 'Local Partnership'), 'p4-f'),

      heading('Work', 3, 'p4-h4'),
      // 69 words: this pillar is short enough to keep whole, and Serve,
      // Support and Share are a set that does not survive losing one.
      ...paragraphs(pick(workLines, 'FBCM exalts God'), 'p4-g'),
      ...paragraphs(pick(workLines, 'Serve '), 'p4-h'),
      ...paragraphs(pick(workLines, 'Support '), 'p4-i'),
      ...paragraphs(pick(workLines, 'Share '), 'p4-j'),
    ];

    // 4. The pastors' letter, 183 of its 434 words. The three kept are the
    //    welcome, their own account of what this church is, and the closing
    //    invitation. Task 10 puts the whole letter on /staff, which is what
    //    the last line points at.
    const letterLines = linesBetween('who-we-are', 'Pastors Kendall & Jonathan', 'Sunday Worship');
    const letter = [
      ...paragraphs(pick(letterLines, 'If you'), 'lt-a'),
      ...paragraphs(pick(letterLines, 'all about the church'), 'lt-b'),
      ...paragraphs(pick(letterLines, 'Finally, we would love'), 'lt-c'),
      ...paragraphs('[Read the full letter on the Staff page](/staff)', 'lt-d'),
    ];

    // 5. The pledge, verbatim and whole. The capture writes each commitment on
    //    one line and its reference on the next, which would seed eight
    //    one-line paragraphs; the two are paired back together here, exactly
    //    as the page reads them aloud.
    const pledgeLines = linesBetween(
      'who-we-are',
      'Our commitment to one another',
      'The life of faith',
    );
    const commitment = (phrase, reference) => `${pick(pledgeLines, phrase)} ${reference}`;
    const pledge = [
      ...paragraphs(pick(pledgeLines, 'We pledge ourselves'), 'pl-a'),
      ...bullets(
        [
          commitment('Bearing your burdens', pick(pledgeLines, 'Galatians 6:2')),
          commitment('Encouraging you in the faith', pick(pledgeLines, '1 Thess. 5:11')),
          commitment('Delighting in the Lord', pick(pledgeLines, 'Ps. 86:11-13')),
          commitment('Offering our lives', pick(pledgeLines, 'Romans 12:1')),
        ],
        'pl-b',
      ),
      ...paragraphs(pick(pledgeLines, 'When a member joins'), 'pl-c'),
    ];

    return {
      title: 'Who we are',
      slug: { _type: 'slug', current: 'who-we-are' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero. Their sentence, at full size, with the congregation beside
        //    it. No subhead and no facts: the sentence is the whole point of
        //    the band, and the times belong on /visit.
        {
          _type: 'heroSection',
          _key: 'wwa-hero',
          layout: 'split',
          size: 'short',
          eyebrow: 'Who we are',
          headline: settings.tagline,
          frames: [{ ...congregation, _key: 'frame-1' }],
          primaryCta: ctaInternal('Plan a visit', 'visit'),
          secondaryCta: ctaInternal('What we believe', 'beliefs'),
        },

        // 2. The verse the whole page hangs on, on the indigo field, with
        //    "proclaim" in gold.
        {
          _type: 'scriptureBandSection',
          _key: 'wwa-scripture',
          verse,
          reference: 'Isaiah 12:4',
          accentWord: 'proclaim',
        },

        // 3. Why that verse: the watchword, whole.
        {
          _type: 'richTextSection',
          _key: 'wwa-watchword',
          eyebrow: 'Our watchword',
          heading: 'Praise and proclaim',
          body: watchword,
        },

        // 4. The four commitments the Church Coordination Team set, in the
        //    order the church wrote them.
        {
          _type: 'richTextSection',
          _key: 'wwa-goals',
          eyebrow: 'Our goals',
          heading: 'Four commitments',
          body: pillars,
        },

        // 5. The people. See note 5 at the top of this file for the heading.
        {
          _type: 'staffGridSection',
          _key: 'wwa-pastors',
          eyebrow: 'Our leadership',
          heading: 'Our pastors and worship arts director',
          group: 'pastors',
          showBios: true,
        },

        // 6. Their letter, shortened, pointing at the whole of it on /staff.
        {
          _type: 'richTextSection',
          _key: 'wwa-letter',
          eyebrow: 'A note from our pastors',
          heading: 'From Kendall and Jonathan',
          body: letter,
        },

        // 7. The pledge the church says out loud when a member joins.
        {
          _type: 'richTextSection',
          _key: 'wwa-pledge',
          eyebrow: 'Our pledge',
          heading: 'What we promise',
          body: pledge,
        },

        // 8. Three doors on. The first two sentences are the home page's own,
        //    word for word (scripts/pages/home.mjs, the link-cards band), so a
        //    reader who arrives here first and a reader who arrives at Home
        //    first are told the same thing.
        {
          _type: 'linkCardsSection',
          _key: 'wwa-three-up',
          eyebrow: 'Where to go next',
          heading: 'Three doors',
          cards: [
            {
              _type: 'linkCard',
              _key: 'door-1',
              title: 'What we believe',
              body: 'We hold to the Bible, to baptism on a person’s own profession of faith, and to the freedom of each church to govern itself.',
              cta: ctaInternal('Beliefs', 'beliefs'),
            },
            {
              _type: 'linkCard',
              _key: 'door-2',
              title: 'How we serve',
              body: 'Sunday school, music, youth, and work with partners across Muncie and beyond.',
              cta: ctaInternal('Ministries', 'ministries'),
            },
            {
              _type: 'linkCard',
              _key: 'door-3',
              title: 'Plan a visit',
              body: 'Where to park, when to arrive, and what happens once you are inside.',
              cta: ctaInternal('Visit', 'visit'),
            },
          ],
        },

        // 9. Closing band, with both buttons (plan 2b ruling P13) and a subhead
        //    built from Site settings rather than retyped.
        {
          _type: 'ctaBandSection',
          _key: 'wwa-cta',
          eyebrow: 'Come and see',
          headline: 'Join us this Sunday.',
          subhead: `${settings.serviceTime}. ${streetLine}.`,
          cta: ctaExternal('Fill in a visitor card', settings.visitorFormUrl),
          secondaryCta: ctaInternal('Plan a visit', 'visit'),
        },
      ],

      seoTitle: 'Who we are | First Baptist Church Muncie',
      // The 1859 date is the church's own: scripts/data/pages/history.txt line
      // 3, "Founded in 1859, First Baptist Church of Muncie...". The American
      // Baptist affiliation is scripts/data/pages/baptists.txt line 83.
      seoDescription: `${settings.tagline} An American Baptist church in downtown Muncie since 1859.`,
    };
  },
};
