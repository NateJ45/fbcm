// scripts/pages/beliefs.mjs
//
// The Beliefs page, composed exactly as section 5.4 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// three Wix pages (beliefs, baptists, membership: 3,165 words) become one page
// by stating each thing ONCE, in the church's own words.
//
// This is the page a searcher lands on when they ask what First Baptist Muncie
// believes, which is why it is in the nav and why its title and description are
// written for that question.
//
// Six things about this file are deliberate.
//
// 1. EVERY PARAGRAPH IS READ OFF A CAPTURE, NEVER TYPED FROM MEMORY.
//    linesBetween() and pick() THROW when an anchor phrase moves, so a band
//    that would have seeded empty, or half-empty, fails the run instead.
//
// 2. THE THREE SOURCES DISAGREE ABOUT BAPTISM IN WORDING BUT NOT IN SUBSTANCE,
//    AND THE PAGE SAYS IT ONCE. beliefs.txt, baptists.txt and membership.txt
//    each state believer's baptism and the acceptance of a baptism already
//    made in the name of the Father, Son and Holy Spirit. The reconciled
//    statement is built under "Church of Believers" out of four of the
//    church's own sentences, in the order a reader needs them: who the church
//    is, how it baptizes, whom it accepts, and that nobody is re-baptized. The
//    membership band below therefore does NOT repeat it (CLAUDE.md rule 15
//    applied to prose: one place says a thing and the others point at it).
//
// 3. THE ABC-USA STATEMENT IS QUOTED WHERE IT MATTERS, NOT SUMMARISED (ruling
//    P18, 2026-09-19). The 2005 identity statement runs to about 800 words in
//    the capture, and this band used to stand in for all of it with the
//    church's own lead-in sentence ("While not binding on congregations or
//    individuals..."). A summary of a doctrinal statement drops doctrine: the
//    four things the statement gathers under THEREFORE are the part a reader
//    came for, and they were not on the page at all. So the lead-in sentence
//    stays as the attribution, and the statement's own two-sentence
//    introduction and its four "we believe" clauses now follow it VERBATIM,
//    read off the capture. Still nothing is rewritten.
//
// 4. THE THREE PDFS ARE UPLOADED, NOT LINKED TO WIX. makeUploader().uploadFile
//    caches by archive-relative path in scripts/.asset-map.json, so the second
//    run of the seeder uploads nothing and the document compares `unchanged`.
//    Linking the old fbcmuncie.org/_files/ URLs would leave three live links
//    pointing at a site that is about to be switched off.
//
// 5. EVERY CHANGE TO A SENTENCE THE CHURCH WROTE IS DECLARED IN `edits` (ruling
//    P16), and each one is made by a helper that throws when the sentence it is
//    editing has moved: cutLead() for a dropped connective, swap() for the
//    membership pronouns and the two inline links, comma() for the two
//    em-dashes (CLAUDE.md rule 2). Nothing is reworded; text is cut, re-cased
//    or de-gendered in place.
//
// 6. THERE IS NO LOGO STRIP, AND THAT IS A MEASUREMENT, NOT A PREFERENCE. The
//    spec asks for one. It was built and screenshotted, and both denominational
//    marks are black line-art seals with their name set in a ring: unreadable
//    at the component's 40px in light mode, and all but invisible on the dark
//    band in dark mode. The affiliation band is the church's own paragraph with
//    the church's own two links in it instead. The full reasoning sits beside
//    the band below.

export default {
  id: 'page-beliefs',
  type: 'page',
  slug: 'beliefs',

  // Every sentence on this page that did not exist on the Wix site. ONE: the
  // search description. Everything a visitor reads on the page itself is the
  // church's own text, cut.
  newCopy: [
    'First Baptist Church Muncie is an American Baptist church in downtown Muncie: we hold to one triune God, to the Bible as our source for faith and practice, to baptism on a person’s own profession of faith, and to the freedom of each church to govern itself under the Lordship of Christ. (search description)',
  ],

  // Edits to the church's own sentences (ruling P16): a connective cut, a
  // pronoun made plural, two headings merged, an em-dash made a comma. The
  // words are still theirs.
  edits: [
    'Re-cased: the hero headline is the church’s own epigraph, Ephesians 4:5, set as a sentence. "One Lord, One Faith, One Baptism" becomes "One Lord, one faith, one baptism."',
    'Merged heading: "Lordship of Christ" and "Freedom to Serve" become one section, "Lordship of Christ and freedom to serve". Every paragraph under both headings is unchanged and in its original order.',
    'Cut connective: "Here are where the themes come together: The church is made up of believers..." begins at "The church is made up of believers...".',
    'Corrected: "believers who have decided to follow the Jesus" becomes "believers who have decided to follow Jesus".',
    'Cut connective: "At the same time, our own practice of baptism..." begins at "Our own practice of baptism...".',
    'Cut: the footnote marker on "...to be (re-)baptized to become members.*" and its footnote, "*For more about membership, see our membership page." Membership is a section of this page now.',
    'Em-dash to comma (site style): "service to God is crucial—but it must be service freely given", and "like being a citizen of a country—something you are because of where you are born".',
    'De-gendered: "a person normally will present himself / herself for membership" becomes "people normally present themselves for membership".',
    'De-gendered: "during the individual’s stay in Muncie and retain membership in his/her home church" becomes "during their stay in Muncie and retain membership in their home church".',
    'De-gendered: "Such membership terminates upon completion of his/her temporary stay" becomes "...upon completion of their temporary stay".',
    'Moved, so it is said once: the immersion sentence under Full Member ("Although Muncie First Baptist Church only baptizes believers by immersion...") now sits under Being Baptist, where the page reconciles all three sources. Its second sentence, about the confirmation class, stays under Full member.',
    'Linked: "For more information see our Constitution and Bylaws" now links to the document list on this page.',
    'Cut: "You can read the document split into two parts below" (nothing on this page is split in two: the four beliefs the 2005 statement gathers under "THEREFORE" are quoted in full instead) and "For more on our church beliefs and the beliefs of our denomination, see our Beliefs page" (the reader is on it).',
  ],

  // No band on this page shows a photograph of a person at all: the only image
  // is the hero's stained glass.
  photoConsent: [],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const { linesBetween, paragraphs, bullets, heading, ctaAnchor, ctaInternal, decodeEntities } =
      copy;

    if (!settings) {
      throw new Error(
        'beliefs.mjs: siteSettings is not available. The closing band reads the service time ' +
          'and the street off it rather than retyping them.',
      );
    }

    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();

    // -- The photo -----------------------------------------------------------
    const glass = await images.image('beliefs-glass');
    if (!glass) throw new Error('beliefs.mjs: no photo in the manifest for "beliefs-glass"');

    // -- The three PDFs ------------------------------------------------------
    // Uploaded from the archive with the shared uploader, which caches asset
    // ids in scripts/.asset-map.json by path: a second run re-uses the asset
    // and uploads nothing. The import is dynamic because sanity-lib.mjs exits
    // the process when there is no write token, and an offline plan run must
    // still be able to load this module. (An offline run never reaches this
    // line: images.image() above has already thrown.)
    const uploadPdf = async (file) => {
      const { client, makeUploader } = await import('../lib/sanity-lib.mjs');
      const assetId = await makeUploader(client).uploadFile(`../fbcm-archive/files/${file}`);
      return { _type: 'file', asset: { _type: 'reference', _ref: assetId } };
    };

    // -- Reading the captures -------------------------------------------------

    /** The one line of `lines` containing `phrase`, decoded and trimmed. */
    const pick = (lines, phrase, slug) => {
      const hit = lines.filter((l) => l.includes(phrase));
      if (hit.length === 0) {
        throw new Error(
          `beliefs.mjs: "${phrase}" is no longer in that span of scripts/data/pages/${slug}.txt`,
        );
      }
      return decodeEntities(hit[0]).trim();
    };

    /** Drop a leading connective, and throw if the sentence no longer starts with it. */
    const cutLead = (sentence, lead) => {
      if (!sentence.startsWith(lead)) {
        throw new Error(
          `beliefs.mjs: cannot cut the lead-in "${lead}": the sentence now reads ` +
            `"${sentence.slice(0, 60)}...". Re-read the section before changing this.`,
        );
      }
      const rest = sentence.slice(lead.length).trim();
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    };

    /** Replace one phrase with another, throwing when the phrase has moved. */
    const swap = (sentence, find, replaceWith) => {
      if (!sentence.includes(find)) {
        throw new Error(
          `beliefs.mjs: cannot edit "${find}": it is not in the sentence the capture now ` +
            'carries. Re-read the section before changing this.',
        );
      }
      return sentence.replace(find, replaceWith);
    };

    /** An em-dash between words becomes a comma (CLAUDE.md rule 2). Throws if there is none. */
    const comma = (sentence) => {
      if (!sentence.includes('—')) {
        throw new Error(
          `beliefs.mjs: expected an em-dash to fix in "${sentence.slice(0, 60)}..."; ` +
            'the capture no longer has one, so drop this call.',
        );
      }
      return sentence.replace(/\s*—\s*/g, ', ');
    };

    // ── 1. Our basic beliefs ────────────────────────────────────────────────
    // beliefs.txt lines 17 to 47, whole: 273 words, the shortest of the three
    // sources and the only one with no Baptist-specific content in it.
    // "God is Love. / God is Spirit. / God is Holy." are three lines with no
    // blank line between them, so paragraphs() would run them into one string;
    // they are the church's own three-line list and are set as a list. No words
    // change.
    const basicLines = linesBetween(
      'beliefs',
      'Our Basic Beliefs',
      'Our Confession & Denominational Identity Statement',
    );
    const basic = [];
    {
      const groups = [];
      let group = [];
      for (const raw of basicLines) {
        if (raw.trim()) group.push(decodeEntities(raw).trim());
        else if (group.length) {
          groups.push(group);
          group = [];
        }
      }
      if (group.length) groups.push(group);
      groups.forEach((g, i) => {
        if (g.length > 1 && g.every((l) => l.startsWith('God is'))) {
          basic.push(...bullets(g, `bb-${i + 1}`));
        } else {
          basic.push(...paragraphs(g.join(' '), `bb-${i + 1}`));
        }
      });
    }

    // ── 2. Being Baptist ────────────────────────────────────────────────────
    // baptists.txt. Three headings where the church had four, because the spec
    // folds "Lordship of Christ" into "Freedom to Serve"; every paragraph under
    // both is kept, in order. The manifesto epigraph at the top of the section
    // is cut: the manifesto itself is in the document list further down.
    const lordship = linesBetween('baptists', 'Lordship of Christ', 'Freedom to Serve');
    const freedom = linesBetween('baptists', 'Freedom to Serve', 'Covenant Community');
    const covenantValue = linesBetween('baptists', 'Covenant Community', 'Our Church Covenant');
    const believers = linesBetween('baptists', 'Church of Believers', 'Our Baptist Affliation');
    const fullMemberLines = linesBetween('membership', 'Full Member', 'Associate Member');

    // The one reconciled statement on baptism (note 2 at the top of this file).
    // membership.txt line 11 is two sentences doing two different jobs: the
    // first states the practice and belongs here, the second is a practical
    // note to somebody filling in a form and stays under Full member.
    const immersionLine = pick(
      fullMemberLines,
      'only baptizes believers by immersion',
      'membership',
    );
    const splitAt = immersionLine.indexOf('If you were baptized as an infant');
    if (splitAt === -1) {
      throw new Error(
        'beliefs.mjs: the immersion sentence in scripts/data/pages/membership.txt no longer ' +
          'carries the "If you were baptized as an infant" sentence after it.',
      );
    }
    const immersion = immersionLine.slice(0, splitAt).trim();
    const confirmationClass = immersionLine.slice(splitAt).trim();
    const noRebaptism = pick(believers, 'do not practice confession', 'baptists').replace(
      /\*$/,
      '',
    );

    const baptist = [
      heading('Lordship of Christ and freedom to serve', 3, 'bp-h1'),
      ...paragraphs(pick(lordship, 'Christ is head of his church', 'baptists'), 'bp-a'),
      ...paragraphs(pick(freedom, 'Churches are each autonomous', 'baptists'), 'bp-b'),
      ...paragraphs(pick(freedom, 'championed freedom for all people', 'baptists'), 'bp-c'),
      ...paragraphs(comma(pick(freedom, 'Thomas Helwys', 'baptists')), 'bp-d'),

      heading('Covenant Community', 3, 'bp-h2'),
      ...paragraphs(pick(covenantValue, 'The church is a covenant community', 'baptists'), 'bp-e'),
      ...paragraphs(pick(covenantValue, 'responsibilities to minister', 'baptists'), 'bp-f'),

      heading('Church of Believers', 3, 'bp-h3'),
      ...paragraphs(comma(pick(believers, 'a common misunderstanding', 'baptists')), 'bp-g'),
      ...paragraphs(
        swap(
          cutLead(
            pick(believers, 'themes come together', 'baptists'),
            'Here are where the themes come together:',
          ),
          'follow the Jesus',
          'follow Jesus',
        ),
        'bp-h',
      ),
      ...paragraphs(
        cutLead(pick(believers, 'our own practice of baptism', 'baptists'), 'At the same time,'),
        'bp-i',
      ),
      ...paragraphs(immersion, 'bp-j'),
      ...paragraphs(noRebaptism, 'bp-k'),
    ];

    // ── 3. Historic confessions ─────────────────────────────────────────────
    // beliefs.txt: the church's own account of what it has signed its name to.
    // Four paragraphs, about 200 words. The 800-word statement itself is not
    // reproduced (note 3 at the top of this file).
    const confessionLines = linesBetween(
      'beliefs',
      'Our Confession & Denominational Identity Statement',
      'New Hampshire Baptist Confession of Faith (1833)',
    );
    const nhcfLines = linesBetween(
      'beliefs',
      'New Hampshire Baptist Confession of Faith (1833)',
      'We Are American Baptists',
    );
    // The 2005 statement's own text, from its heading to the end of the
    // "THEREFORE" list. The four beliefs are one line each in the capture and
    // are set as the list the statement itself sets them as; the count is
    // checked, so a fifth clause (or a lost one) fails the run rather than
    // seeding a statement that is not the one the church signed.
    const abcLines = linesBetween(
      'beliefs',
      'We Are American Baptists',
      'Within the larger Baptist family',
    );
    const ABC_LEAD_IN = 'With Baptist brothers and sisters around the world, we believe:';
    const abcLeadIn = pick(abcLines, ABC_LEAD_IN, 'beliefs');
    const abcAt = abcLines.findIndex((l) => l.includes(ABC_LEAD_IN));
    const abcBeliefs = abcLines
      .slice(abcAt + 1)
      .map((l) => decodeEntities(l).trim())
      .filter((l) => l.startsWith('That '));
    if (abcBeliefs.length !== 4) {
      throw new Error(
        'beliefs.mjs: expected 4 "we believe" clauses after "' +
          ABC_LEAD_IN +
          '" in scripts/data/pages/beliefs.txt, found ' +
          abcBeliefs.length,
      );
    }
    const confessions = [
      ...paragraphs(
        [
          pick(confessionLines, 'Holy Scripture is our source', 'beliefs'),
          pick(confessionLines, 'diversity in views', 'beliefs'),
        ].join(' '),
        'hc-a',
      ),
      ...paragraphs(
        [
          pick(confessionLines, 'FBCM adopted a historic confession', 'beliefs'),
          pick(confessionLines, 'As our by-laws & constitution say:', 'beliefs'),
          pick(confessionLines, 'generally ascribes to the New Hampshire Confession', 'beliefs'),
        ].join(' '),
        'hc-b',
      ),
      ...paragraphs(pick(nhcfLines, 'J. Newton Brown', 'beliefs'), 'hc-c'),
      // The attribution: whose statement this is, and what weight it carries.
      // Its last clause is cut because nothing is split in two below any more.
      ...paragraphs(
        swap(
          pick(nhcfLines, 'released an identity statement in 2005', 'beliefs'),
          ' You can read the document split into two parts below.',
          '',
        ),
        'hc-d',
      ),
      // ...and then the statement's own words (ruling P18, note 3 above). Its
      // two-sentence introduction, its lead-in line, and the four clauses it
      // gathers under THEREFORE, verbatim off the capture.
      ...paragraphs(pick(abcLines, 'a distinctive history and experience', 'beliefs'), 'hc-e'),
      ...paragraphs(abcLeadIn, 'hc-f'),
      ...bullets(abcBeliefs, 'hc-g'),
    ];

    // ── 4. The covenant ─────────────────────────────────────────────────────
    // baptists.txt lines 43 to 65, whole, once. The nine commitments are one
    // line each in the capture and are set as the list they are. The church's
    // own "[or her]" bracket on the minister line stays: it is their text and
    // their own fix.
    const covenantLines = linesBetween('baptists', 'Our Church Covenant', 'Church of Believers');
    const pledgeLines = covenantLines
      .map((l) => decodeEntities(l).trim())
      .filter((l) => l.startsWith('To '));
    if (pledgeLines.length !== 9) {
      throw new Error(
        'beliefs.mjs: expected 9 covenant commitments in scripts/data/pages/baptists.txt, found ' +
          pledgeLines.length,
      );
    }
    const covenant = [
      ...paragraphs(pick(covenantLines, 'humbly and solemnly undertake', 'baptists'), 'cv-a'),
      ...bullets(pledgeLines, 'cv-b'),
      ...paragraphs(pick(covenantLines, 'We enter this covenant', 'baptists'), 'cv-c'),
      ...paragraphs(pick(covenantLines, 'We further engage', 'baptists'), 'cv-d'),
    ];

    // ── 5. Membership ───────────────────────────────────────────────────────
    // membership.txt, both kinds, with the gendered phrasing made plural. The
    // immersion sentence is NOT here: it is in Being Baptist, above, where the
    // page reconciles all three sources (note 2).
    const associateLines = linesBetween('membership', 'Associate Member', 'Have questions?');
    const membership = [
      heading('Full member', 3, 'mb-h1'),
      ...paragraphs(
        swap(
          pick(fullMemberLines, 'To join Muncie First Baptist Church', 'membership'),
          'a person normally will present himself / herself for membership',
          'people normally present themselves for membership',
        ),
        'mb-a',
      ),
      ...paragraphs(pick(fullMemberLines, 'may be admitted for membership', 'membership'), 'mb-b'),
      ...paragraphs(confirmationClass, 'mb-c'),

      heading('Associate member', 3, 'mb-h2'),
      ...paragraphs(
        swap(
          swap(
            pick(associateLines, 'temporarily living in the Muncie community', 'membership'),
            'during the individual’s stay in Muncie',
            'during their stay in Muncie',
          ),
          'retain membership in his/her home church',
          'retain membership in their home church',
        ),
        'mb-d',
      ),
      ...paragraphs(pick(associateLines, 'college students', 'membership'), 'mb-e'),
      ...paragraphs(
        swap(
          pick(associateLines, 'has no vote on church matters', 'membership'),
          'upon completion of his/her temporary stay',
          'upon completion of their temporary stay',
        ),
        'mb-f',
      ),
      ...paragraphs(
        swap(
          pick(associateLines, 'For more information', 'membership'),
          'our Constitution and Bylaws',
          '[our Constitution and Bylaws](#documents)',
        ),
        'mb-g',
      ),
    ];

    // ── 6. Affiliation ──────────────────────────────────────────────────────
    // baptists.txt lines 83 to 87, with the church's own two links folded back
    // in as inline markdown (hrefs from scripts/data/pages/baptists.json).
    const affiliationLines = linesBetween('baptists', 'Our Baptist Affliation');
    const affiliation = [
      ...paragraphs(
        swap(
          swap(
            pick(affiliationLines, 'We are affiliated with', 'baptists'),
            'American Baptist Churches - USA',
            '[American Baptist Churches - USA](https://www.abc-usa.org/)',
          ),
          'American Baptist Churches of Indiana and Kentucky',
          '[American Baptist Churches of Indiana and Kentucky](https://abc-indiana.org/)',
        ),
        'af-a',
      ),
      ...paragraphs(pick(affiliationLines, 'Christ-centered', 'baptists'), 'af-b'),
      ...paragraphs(pick(affiliationLines, 'propels us', 'baptists'), 'af-c'),
    ];

    // ── The two denominational marks, and why they are not on this page ─────
    //
    // Spec 5.4 asks for a logoStripSection carrying the ABC-USA and ABC of
    // Indiana and Kentucky marks. It was built, rendered and measured, and it
    // is not on the page, because LogoStrip.astro draws every logo at h-10
    // (40px tall) in grayscale at 70% opacity and both of these marks are
    // circular seals with the organisation's name set in a ring around the rim.
    //   - In light mode the ring text is unreadable at 40px: two grey smudges.
    //   - In DARK mode they very nearly vanish. Both files are black line art
    //     on transparency, and the strip's band is near-black, so the marks
    //     read as two faint discs (screenshot page-beliefs-dark-1280.png, the
    //     band above the closing CTA in the first build).
    // A logo nobody can read is not a logo, and CLAUDE.md rule 3 makes dark
    // mode a pass/fail, not a nice-to-have. So the affiliation band is the
    // church's own paragraph with the church's own two links in it, which is
    // where the links were on the Wix site and what a reader actually uses.
    // Giving the strip a size or an invert would mean editing a component the
    // whole family shares, which is a separate, deliberate job. The two
    // manifest keys, logo-abcusa and logo-abc-indiana-kentucky, stay in
    // scripts/data/page-images.json with their alt text, ready for it.

    // ── The scripture band ──────────────────────────────────────────────────
    // The church's second epigraph, beliefs.txt line 6, without its curly
    // quotes: the band IS the quotation. Checked against the capture, so a
    // reworded epigraph fails the run rather than leaving a line nobody wrote.
    // No reference field: the church attributes it to "A Common Statement about
    // Christian Belief", which is not a citation a reader can look up.
    const commonStatement =
      'In essentials, unity; in non-essentials, liberty; in all things, charity.';
    if (!copy.textFile('beliefs').includes(commonStatement)) {
      throw new Error(
        'beliefs.mjs: the "In essentials, unity" statement is no longer in ' +
          'scripts/data/pages/beliefs.txt.',
      );
    }

    return {
      title: 'What we believe',
      slug: { _type: 'slug', current: 'beliefs' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero: their Ephesians epigraph, with the stained glass beside it.
        //    The two buttons are the two questions people arrive with, and both
        //    land further down this same page.
        {
          _type: 'heroSection',
          _key: 'beliefs-hero',
          layout: 'split',
          size: 'short',
          eyebrow: 'What we believe',
          headline: 'One Lord, one faith, one baptism.',
          frames: [{ ...glass, _key: 'frame-1' }],
          primaryCta: ctaAnchor('Being Baptist', '/beliefs#baptists'),
          secondaryCta: ctaAnchor('Membership', '/beliefs#membership'),
        },

        // 2. What the church holds, whole and in their order.
        {
          _type: 'richTextSection',
          _key: 'beliefs-basic',
          eyebrow: 'Our basic beliefs',
          heading: 'What we hold',
          width: 'narrow',
          body: basic,
        },

        // 3. Being Baptist. Where /beliefs#baptists lands.
        {
          _type: 'richTextSection',
          _key: 'beliefs-baptists',
          anchor: { _type: 'slug', current: 'baptists' },
          eyebrow: 'Being Baptist',
          heading: 'Four things Baptists hold to',
          width: 'narrow',
          body: baptist,
        },

        // 4. The common statement, on the indigo field, "charity" in gold.
        {
          _type: 'scriptureBandSection',
          _key: 'beliefs-scripture',
          verse: commonStatement,
          accentWord: 'charity',
        },

        // 5. The confessions, summarised, and then the documents themselves.
        {
          _type: 'richTextSection',
          _key: 'beliefs-confessions',
          eyebrow: 'Historic confessions',
          heading: 'What we have signed our names to',
          width: 'narrow',
          body: confessions,
        },
        {
          _type: 'documentListSection',
          _key: 'beliefs-documents',
          anchor: { _type: 'slug', current: 'documents' },
          eyebrow: 'Read the documents',
          heading: 'Three documents',
          docs: [
            {
              _type: 'listedDocument',
              _key: 'doc-1',
              title: 'New Hampshire Baptist Confession of Faith',
              year: 1833,
              file: await uploadPdf('08181c_be64a9c738884843ba795d52e0a781a1.pdf'),
              note: 'The confession in full',
            },
            {
              _type: 'listedDocument',
              _key: 'doc-2',
              title: 'Constitution and bylaws',
              file: await uploadPdf('08181c_7f1349cc8cb74753bbaf9b7c09ef396b.pdf'),
              // membership.txt line 21 sends a reader here: "For more
              // information see our Constitution and Bylaws."
              note: 'How this church governs itself',
            },
            {
              _type: 'listedDocument',
              _key: 'doc-3',
              title:
                'Re-envisioning Baptist Identity: A Manifesto for Baptist Communities in North America',
              file: await uploadPdf('b98776_b6017910db9f477bbcb71f843b742887.pdf'),
              note: 'The manifesto',
            },
          ],
        },

        // 6. The covenant, whole, once.
        {
          _type: 'richTextSection',
          _key: 'beliefs-covenant',
          eyebrow: 'Our church covenant',
          heading: 'The covenant we keep',
          width: 'narrow',
          body: covenant,
        },

        // 7. Membership. Where /beliefs#membership lands.
        {
          _type: 'richTextSection',
          _key: 'beliefs-membership',
          anchor: { _type: 'slug', current: 'membership' },
          eyebrow: 'Membership',
          heading: 'Full and associate members',
          width: 'narrow',
          body: membership,
        },

        // 8. Affiliation: the church's own paragraph with the church's own two
        //    links in it. No logo strip; the long comment above says why.
        {
          _type: 'richTextSection',
          _key: 'beliefs-affiliation',
          eyebrow: 'Affiliation',
          heading: 'American Baptist Churches USA',
          width: 'narrow',
          body: affiliation,
        },

        // 9. Closing band, both buttons, subhead built from Site settings.
        {
          _type: 'ctaBandSection',
          _key: 'beliefs-cta',
          eyebrow: 'Questions?',
          headline: 'Ask us anything.',
          subhead: `${settings.serviceTime}. ${streetLine}.`,
          cta: ctaInternal('Contact us', 'contact'),
          secondaryCta: ctaInternal('Plan a visit', 'visit'),
        },
      ],

      seoTitle: 'What we believe | First Baptist Church Muncie, an American Baptist church',
      seoDescription:
        'First Baptist Church Muncie is an American Baptist church in downtown Muncie: we hold to one triune God, to the Bible as our source for faith and practice, to baptism on a person’s own profession of faith, and to the freedom of each church to govern itself under the Lordship of Christ.',
    };
  },
};
