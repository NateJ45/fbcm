// scripts/pages/history.mjs
//
// The History page, composed exactly as section 5.7 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// the richest page on the site, 4,171 words of the church's own telling, kept
// nearly whole and laid out as a timeline of seven eras with a period
// photograph beside each one.
//
// Seven things about this file are deliberate, plus two later rulings (P23,
// P24, 2026-09-19, task 12 step 0):
//
// P23. THE BUILDING ANCHOR MOVED TO THE PHOTOGRAPH. /history#building used to
//   land on era 4's overflow richTextSection, three screens of prose below the
//   heading and the period photograph a visitor actually wants when Home,
//   Ministries or this page's own opening band sends them here. The anchor now
//   sits on era 4's imageTextSection instead, so the fragment lands on the
//   heading and the photograph together.
//
// P24. EVERY ERA'S PHOTOGRAPH BAND CARRIES ITS OWN ANCHOR, AND THE TIMELINE IS
//   A TABLE OF CONTENTS THAT WORKS. Eras 1, 2, 3, 5, 6 and 7 now carry
//   `era-1` ... `era-7` on their imageTextSection (era 4 keeps `building`
//   instead, per P23, and its richText overflow band carries no anchor of its
//   own). Each timeline row's body ends with a "Read this era" link back to
//   its own band: `/history#era-N` for six of them, `/history#building` for
//   era 4.
//
// Seven things about this file are deliberate.
//
// 1. NOT ONE SENTENCE IS TYPED FROM MEMORY. Every paragraph is read out of
//    scripts/data/pages/history.txt by an anchor phrase, and para() THROWS
//    naming the phrase when it moves. A band that would have seeded empty
//    fails the run instead. The file is 179 lines and the era boundaries are
//    written beside each era below, so a future reader can check the cut.
//
// 2. THE ERAS ARE THE SPEC'S, AND THE CAPTURE'S OWN HEADINGS DRAW THEM. The
//    Wix page is twenty-two little sections; spec 5.7 groups them into seven
//    eras. Each era keeps the capture's own sub-headings as h3s inside its
//    band, so nothing is flattened and a reader can still find "Bickering" or
//    "Institutional Church" where the church put them.
//
// 3. THE WIX SUMMARY LINE UNDER EACH HEADING IS KEPT, NOT CUT. The capture
//    writes a one-sentence summary under every heading and then the full
//    paragraph. Those summaries are the church's own words and they read as
//    lead-ins, so they stay. FIVE of them are cut, and only five, because each
//    repeats a sentence that already appears within a screen or two of it:
//    lines 11, 53, 59, 123 and 171 (see `edits`). The rule applied is narrow
//    on purpose: a repeat goes, a restatement stays.
//
// 4. THE SEVEN TIMELINE LEADS ARE CUT, NOT WRITTEN. Each row's body is the
//    first sentence of that era's own first paragraph, quoted verbatim. Five
//    of the seven are a whole line of the capture; two are cut at a sentence
//    boundary by untilAfter(), which throws when the sentence has changed. So
//    the timeline adds no new prose to the page, and `newCopy` stays down to
//    three lines: two headlines and the search description.
//
// 5. TWO ANCHORS, AND THEY MUST NOT COLLIDE. `#eras` is the timeline (the
//    opener's button pointed at it until P26 took the button off) and
//    `#building` is the 1921-1929 band, which is where /history#building lands from Home, from Visit and
//    from plan 1's redirects. The timeline's own row for that era carries
//    `building-1929` rather than `building`, so the row and the band cannot
//    fight over the same fragment.
//
// P25 (2026-09-19, task 13 step 0). THE OPENING BAND STARTS WITH THE CHURCH'S
//   OWN FIRST SENTENCE. history.txt:3 ("Founded in 1859, First Baptist Church
//   of Muncie has a long history of serving God and our neighbor in the
//   Muncie community.") is real prose, the church's own opening line for the
//   whole page, and it sat unused: never seeded, never declared as cut. The
//   opening heritageBandSection's body is now that sentence followed by the
//   founding sentence it already carried (history.txt:11), two of the
//   church's own sentences, verbatim.
//
// 6. THE PHOTOGRAPH MATCHES THE ERA. history-era-1 ... history-era-7 in
//    scripts/data/page-images.json are seventeen period photographs narrowed
//    to seven, one per era, and each alt was checked against the era text
//    before it was used: Beginnings 1859, the 1862 building, the 1890
//    building, Everson, the 1938 auction, the 1950s congregation and the
//    1990s congregation. Every one of them lands in its own era; none had to
//    be swapped. They are period photographs of adults and buildings, so
//    `photoConsent` is empty.
//
// P26 (2026-09-24, the History identity pass). THE OPENER, THE TIMELINE AND
//   THE END ARE RECOMPOSED IN THE CHURCH IDENTITY; THE ERAS ARE NOT TOUCHED.
//   - The opening band draws as HeritageOpener.astro (HeritageBand's h1
//     path): the church's brown, the span "1859 to <build year>" derived from
//     the timeline's first row and the build date (src/lib/heritage-opener.ts,
//     rule 15), the h1, and two old photographs in arches: the women's group
//     with its banner (the Wix history page's own header photograph) in a
//     door, Pastor Cassius M. Carter in a lancet. The heading goes back to the
//     church's own, "Our History" (history.txt:1), in place of the new
//     "Since 1859."; the eyebrow and the "Seven eras" button come off (the
//     timeline is the very next band).
//   - The timeline's heading is the church's own "See highlights of our
//     history below." (history.txt:5), lifted, and its decorative eyebrow
//     comes off. It gains an EIGHTH row, marked "Today" rather than a year
//     (never type the current year): what the church is doing now, in the
//     church's own present-tense sentence (history.txt:177), linking to the
//     ministers. So the story runs 1859 to today.
//   - The closing band loses its "Today" eyebrow (rule 11: no eyebrow that
//     only decorates).
//   - Photographs: the Hannaford rendering is NOT used here, although the
//     rollout table names it for this page, because Home's Our Building band
//     already shows it and the overnight plan forbids a photograph on two
//     pages. The two opener photos are on no other page. The era alts that
//     named the wrong subject were corrected in page-images.json (era 1 is
//     the courthouse engraving, era 6 a stone house in the snow, era 7 a
//     studio portrait of George Saunders, not "the congregation").
//
// 7. TWO EM-DASHES, AND NOTHING ELSE, ARE TOUCHED FOR STYLE. history.txt has
//    exactly two (lines 113 and 147) and both become commas (CLAUDE.md rule
//    2). The spaced EN-dashes at lines 175 and 177 are left alone, as they are
//    on every other plan-2b page. The informal asides stay: they are the
//    voice, and spec 5.7 says so.

export default {
  id: 'page-history',
  type: 'page',
  slug: 'history',

  // Two sentences on this page did not exist on the Wix site, plus the seven
  // era NAMES, which are labels rather than prose. Everything else a visitor
  // reads is the church's own text, cut.
  newCopy: [
    'The story continues on Sunday. (the closing band’s headline)',
    'First Baptist Church Muncie was founded by twelve people in 1859 and has worshipped in downtown Muncie ever since. (search description, not shown on the page)',
    'The seven era names in the timeline and on the bands, which are labels the spec gives rather than sentences the church wrote: Founding; Struggle and Rairden; The gas boom to the debt paid; The Fighting Parson and the building; Sold and bought back; Postwar to Mattox; Saunders to the co-pastors.',
  ],

  // Edits to the church's own sentences (ruling P16). Their words are cut,
  // joined back together, or corrected in place; nothing is reworded.
  edits: [
    'Cut as a repeat, once: "On September 10, 1859 twelve Indiana residents, meeting at the county courthouse, founded the first Baptist Church in Muncie." (history.txt line 11) is the opening band’s founding sentence and is not printed a second time in the Founding band, which starts at the fuller paragraph beneath it (line 13, "...four men and eight women, became the charter members..."). This is the duplicated charter-members sentence spec 5.7 asks to remove.',
    'Corrected: "Overcrowded conditions led the congregation to move into a new and much larger church in 1880." becomes "...in 1890." (history.txt line 51.) The church’s own next sentence gives the date as July 20, 1890, and the content map flags the 1880 as a typo.',
    'Cut as a repeat: "The old church simply could not hold that many people, and so the congregation eventually moved into a new building on July 20, 1890." (history.txt line 53) is word for word the closing sentence of the Gas Boom paragraph three lines above it (line 47).',
    'Cut as a repeat: "Phenomenal growth followed, with the membership soaring to 500 in 1900." (history.txt line 59) is also word for word a sentence of the Gas Boom paragraph (line 47).',
    'Cut as a repeat: "The church helped establish Riverside Baptist Church with financial support and by encouraging several of its families who lived on the west side to join this new Baptist church." (history.txt line 123) is the same sentence as the second sentence of the paragraph below it (line 125), which adds only "First," and "(pictured, right)".',
    'Cut as a repeat: "The Pastoral search team’s efforts to find a pastor resulted in the church calling not just one Pastor, but two: Jonathan Balmer and Kendall Ellis." (history.txt line 171) is the same sentence as the one in the paragraph below it (line 175), which adds "(a married couple) were called by the congregation in May of 2022 to serve as Co-Pastors".',
    'Joined: history.txt lines 109 and 111 are one sentence the Wix layout broke in two. "And eventually, one year and one week after the sale of the building," and "Muncie First Baptist bought it back for $70,000." are printed as one sentence.',
    '2 em-dashes converted to commas or colons (CLAUDE.md rule 2): history.txt line 113 "the war effort—a number that was 30 percent higher" and line 147 "many members left First Baptist—some because they were unhappy". No word changes. The spaced en-dashes at lines 175 and 177 are left as the church wrote them.',
    'Lifted: the timeline heading "Highlights of our history" is the church’s own line "See highlights of our history below." (history.txt line 5) without its first and last words.',
    'Lifted: the timeline’s last row, marked "Today", is titled "A new era", the church’s own words from the closing sentence of the page ("...to serve in a new-era in the life of Muncie...", history.txt line 179), the hyphen taken out. Its text is the church’s sentence "Jonathan and Kendall each preach, alternating responsibilities between pulpit and youth ministries – in addition to being involved with other areas of ministry alongside the Church Coordination Team." (line 177), verbatim, and its link "Ministers" is the Wix menu item of that name, pointing at /staff.',
    'Restored: the opening band’s heading is the church’s own "Our History" (history.txt line 1) in place of the new "Since 1859.".',
    'Cut, not written: the seven timeline leads are the first sentence of each era’s own first paragraph, quoted verbatim from history.txt lines 13, 21, 45, 89, 103, 117 and 135.',
    'Cut and re-cased, twice, for the two book notes: "Our church has a History book written by Dr. William G. Eidson" becomes "Written by Dr. William G. Eidson." and keeps the church’s own "We have several copies in our church library."; the Clay note is "Edited by Julie Downey Davis." and "The book can be purchased online." from the same two sentences of scripts/data/pages/publications.txt lines 27 and 31.',
  ],

  // Facts this page had to leave as the church wrote them (ruling P20).
  confirm: [
    'The 1917 note-burning: 24 or 30 December? The same section of scripts/data/pages/history.txt says both. Line 77 says the debt was paid "highlighted by a note-burning ceremony on December 24, 1917."; line 85 says "On December 24, 1917, the total church indebtedness of $8413.80 was paid in full. To celebrate this momentous occasion, the church had a special note-burning ceremony on December 30." The page prints both, exactly as written, and changes neither.',
    'Gas boom, "to the country" or "to the county"? scripts/data/pages/history.txt line 45 reads "The Gas Boom of the 1880s and 90s brought many new residents to the country and large increases in church membership." The paragraph below it (line 47) is about "Muncie and Delaware County", so this looks like a typo for "county". It is printed as written, and it is also the page’s first timeline lead, so it appears twice.',
  ],

  // Every photograph on this page is a period one: buildings, congregations
  // and portraits of adults, the newest from the 1990s.
  photoConsent: [],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const { paragraphs, heading, ctaAnchor, ctaInternal, decodeEntities, link } = copy;

    // P24 (2026-09-19): one "Read this era" link, appended to a timeline row's
    // body, pointing at that era's photograph band.
    const readThisEra = (n, href) => link('Read this era', href, `tl${n}-more`);

    if (!settings) {
      throw new Error(
        'history.mjs: siteSettings is not available. The closing band reads the service time and ' +
          'the street off it rather than retyping them (CLAUDE.md rule 15).',
      );
    }

    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();

    // -- Reading the capture -------------------------------------------------

    /** The one line of history.txt containing `phrase`, decoded and trimmed. */
    const para = (phrase) => {
      const found = copy
        .textFile('history')
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(
          `history.mjs: "${phrase}" is not in scripts/data/pages/history.txt any more. ` +
            'Re-read the section before changing this.',
        );
      }
      return decodeEntities(found).trim();
    };

    /**
     * The one line of history.txt that IS `text`, exactly. The capture writes
     * each Wix sub-heading on a line of its own, and a heading is too short to
     * be a safe substring: "Dan Mattox" matches the Cassius Carter paragraph
     * ("until Dan Mattox seven decades later") sixty lines before it matches
     * the heading. Every h3 below therefore comes through here, not para().
     */
    const headingLine = (text) => {
      const lines = copy.textFile('history').split(/\r?\n/);
      const hits = lines.filter((l) => decodeEntities(l).trim() === text);
      if (hits.length !== 1) {
        throw new Error(
          `history.mjs: expected exactly one line reading "${text}" in ` +
            `scripts/data/pages/history.txt, found ${hits.length}.`,
        );
      }
      return text;
    };

    /** Everything up to and including `phrase`. Throws when the sentence has moved. */
    const untilAfter = (text, phrase) => {
      const at = text.indexOf(phrase);
      if (at === -1) {
        throw new Error(
          `history.mjs: cannot cut at "${phrase}": it is not in "${text.slice(0, 60)}...". ` +
            'The timeline lead is a quotation, so it fails rather than paraphrases.',
        );
      }
      return text.slice(0, at + phrase.length);
    };

    /** Replace one phrase with another, throwing when the phrase has moved. */
    const swap = (text, find, replaceWith) => {
      if (!text.includes(find)) {
        throw new Error(
          `history.mjs: cannot edit "${find}": it is not in the sentence the capture now carries.`,
        );
      }
      return text.replace(find, replaceWith);
    };

    /** An em-dash between words becomes a comma (CLAUDE.md rule 2). Throws if there is none. */
    const comma = (text) => {
      if (!text.includes('—')) {
        throw new Error(
          `history.mjs: expected an em-dash to fix in "${text.slice(0, 60)}..."; the capture no ` +
            'longer has one, so drop this call.',
        );
      }
      return text.replace(/\s*—\s*/g, ', ');
    };

    // -- The seven eras ------------------------------------------------------
    // Line ranges are history.txt's own, and each era's photograph is named
    // beside it. The Wix sub-headings inside an era become h3 blocks so the
    // church's own structure survives the grouping.

    // ERA 1. Founding, 1859 to 1862. history.txt lines 9 to 17.
    //   Beginnings - 1859 (11, 13) and First Building - 1862 (15, 17).
    //   About 100 words once line 11 moves to the opening band, so it is ONE
    //   band with no richText tail.
    const era1Body = [
      ...paragraphs(para('four men and eight women'), 'e1-a'),
      ...paragraphs(para('Finally in June, 1862'), 'e1-b'),
    ];

    // ERA 2. Struggle and Rairden, 1862 to 1881. Lines 19 to 41.
    //   Dress and Lighting (21, 23), Slow Growth (27, 29), Bickering (33, 35),
    //   N.B. Rairden - 1881 (39, 41).
    const era2Lead = [
      ...paragraphs(para('Services were casual'), 'e2-a'),
      ...paragraphs(para('Typical of that era'), 'e2-b'),
    ];
    const era2Rest = [
      heading(headingLine('Slow Growth'), 3, 'e2-h1'),
      ...paragraphs(para('Financial pledges were honored'), 'e2-c'),
      ...paragraphs(para('Growth was slow and somewhat painful'), 'e2-d'),
      heading(headingLine('Bickering'), 3, 'e2-h2'),
      ...paragraphs(para('Bickering among members nearly caused'), 'e2-e'),
      ...paragraphs(para('Bickering among members was not uncommon'), 'e2-f'),
      heading(headingLine('N.B. Rairden - 1881'), 3, 'e2-h3'),
      ...paragraphs(para('Harmony came to the congregation'), 'e2-g'),
      ...paragraphs(para('The coming of pastor N.B. Rairden'), 'e2-h'),
    ];

    // ERA 3. The gas boom to the debt paid, 1887 to 1917. Lines 43 to 85.
    //   Gas Boom (45, 47), Second Building - 1890 (51; line 53 cut as a
    //   repeat), State Convention (57, 61; line 59 cut as a repeat), Cassius
    //   M. Carter (65, 67), Institutional Church (71, 73), Debt is Paid - 1913
    //   (77, 79, 81, 83, 85).
    const era3Lead = [
      ...paragraphs(para('The Gas Boom of the 1880s'), 'e3-a'),
      ...paragraphs(para('The arrival of Loren Clevenger'), 'e3-b'),
    ];
    const era3Rest = [
      heading(headingLine('Second Building - 1890'), 3, 'e3-h1'),
      // The one date correction on this page. See `edits`.
      ...paragraphs(swap(para('Overcrowded conditions led'), 'in 1880.', 'in 1890.'), 'e3-c'),
      heading(headingLine('State Convention'), 3, 'e3-h2'),
      ...paragraphs(para('No longer a small and insignificant'), 'e3-d'),
      ...paragraphs(para('The congregation was so pleased'), 'e3-e'),
      heading(headingLine('Cassius M. Carter'), 3, 'e3-h3'),
      ...paragraphs(para('The prominence of Pastor Cassius'), 'e3-f'),
      ...paragraphs(para('Much of the progress the church experienced'), 'e3-g'),
      heading(headingLine('Institutional Church'), 3, 'e3-h4'),
      ...paragraphs(para('offering athletic programs'), 'e3-h'),
      ...paragraphs(para('During the early part of the century'), 'e3-i'),
      heading(headingLine('Debt is Paid - 1913'), 3, 'e3-h5'),
      ...paragraphs(para('After years of indebtedness'), 'e3-j'),
      ...paragraphs(para('In October, 1913, John Falconer Fraser'), 'e3-k'),
      ...paragraphs(para('A fund-raising canvass in 1915'), 'e3-l'),
      ...paragraphs(para('In 1917, the financial picture brightened'), 'e3-m'),
      ...paragraphs(para('Fraser believed the time was right'), 'e3-n'),
    ];

    // ERA 4. The Fighting Parson and the building, 1921 to 1929. Lines 87 to
    //   99, one Wix section throughout, so the tail carries no h3. This band's
    //   richText is where /history#building lands.
    const era4Lead = [
      ...paragraphs(para('The preaching and personality'), 'e4-a'),
      ...paragraphs(para('contributions paved the way'), 'e4-b'),
    ];
    const era4Rest = [
      ...paragraphs(para('In Muncie, his boundless energy'), 'e4-c'),
      ...paragraphs(para('This was particularly true of Sunday evening'), 'e4-d'),
      ...paragraphs(para('Visualizing a beautiful new church'), 'e4-e'),
      ...paragraphs(para('After numerous delays'), 'e4-f'),
    ];

    // ERA 5. Sold and bought back, 1938 to 1939. Lines 101 to 113, again one
    //   Wix section. Lines 109 and 111 are ONE sentence the Wix layout broke
    //   in two and are printed joined; line 113 carries one of the page's two
    //   em-dashes.
    const era5Lead = [
      ...paragraphs(para('The new building was sold during the great depression'), 'e5-a'),
      ...paragraphs(para('Few members could have predicted'), 'e5-b'),
    ];
    const era5Rest = [
      ...paragraphs(para('Eventually Mercantile Trust Company'), 'e5-c'),
      ...paragraphs(
        `${para('The bondholders, of course')} ${para('Muncie First Baptist bought it back')}`,
        'e5-d',
      ),
      ...paragraphs(comma(para('During the Civil War a large number')), 'e5-e'),
    ];

    // ERA 6. Postwar to Mattox, 1950 to 1989. Lines 115 to 131.
    //   1950s (117, 119), 1960s (125; line 123 cut as a repeat), Dan Mattox
    //   (129, 131).
    const era6Lead = [
      ...paragraphs(para('The 1950s brought growth'), 'e6-a'),
      ...paragraphs(para('During the 1950s there were signs'), 'e6-b'),
    ];
    const era6Rest = [
      heading(headingLine('1960s'), 3, 'e6-h1'),
      ...paragraphs(para('The 1960s was a decade'), 'e6-c'),
      heading(headingLine('Dan Mattox'), 3, 'e6-h2'),
      ...paragraphs(para('The much-loved Dan Mattox'), 'e6-d'),
      ...paragraphs(para('The fifteen-year pastorate'), 'e6-e'),
    ];

    // ERA 7. Saunders to the co-pastors, 1990 to 2022. Lines 133 to 179.
    //   1990s (135, 137, 139), 2000s (143, 145 to 153; line 147 carries the
    //   page's second em-dash), 2010s (157, 159 to 167), 2020s (173 to 179;
    //   line 171 cut as a repeat).
    const era7Lead = [
      ...paragraphs(para('Partially due to the leadership'), 'e7-a'),
      ...paragraphs(para('Following a very popular pastor'), 'e7-b'),
    ];
    const era7Rest = [
      ...paragraphs(para('Nevertheless, the church engaged'), 'e7-c'),
      heading(headingLine('2000s'), 3, 'e7-h1'),
      ...paragraphs(para('led to serious problems for several years'), 'e7-d'),
      ...paragraphs(para('Although the controversy over what kind'), 'e7-e'),
      ...paragraphs(comma(para('After two years, the church decided')), 'e7-f'),
      ...paragraphs(para('Despite this decline'), 'e7-g'),
      ...paragraphs(para('Members opened their pockets'), 'e7-h'),
      ...paragraphs(para('During this time, the worship-style controversy'), 'e7-i'),
      heading(headingLine('2010s'), 3, 'e7-h2'),
      ...paragraphs(para('Pastor Allen and the church celebrated'), 'e7-j'),
      ...paragraphs(para('In January of 2010 Fred Schulz'), 'e7-k'),
      ...paragraphs(para('First Baptist and Wade were awarded'), 'e7-l'),
      ...paragraphs(para('Later that same year the church launched'), 'e7-m'),
      ...paragraphs(para('The last major project'), 'e7-n'),
      ...paragraphs(para('The membership was shocked'), 'e7-o'),
      heading(headingLine('2020s'), 3, 'e7-h3'),
      ...paragraphs(para('The 2020 pandemic presented'), 'e7-p'),
      ...paragraphs(para('a married couple) were called'), 'e7-q'),
      ...paragraphs(para('Jonathan and Kendall each preach'), 'e7-r'),
      ...paragraphs(para('Kendall, having received a Masters'), 'e7-s'),
    ];

    // -- The timeline leads, cut from the eras' own first paragraphs ---------
    const leads = {
      1: untilAfter(para('four men and eight women'), 'a community of 1700 residents.'),
      2: para('Services were casual'),
      3: para('The Gas Boom of the 1880s'),
      4: para('The preaching and personality'),
      5: untilAfter(
        para('The new building was sold during the great depression'),
        'unable to make the mortgage payments.',
      ),
      6: para('The 1950s brought growth'),
      7: para('Partially due to the leadership'),
    };

    // -- The two pull quotes, checked against the capture --------------------
    // Both are sentences the church wrote, set large between the bands they
    // come from. para() throws if either has moved, so the quote can never
    // become something the church did not say.
    const quoteDisbanding = 'Never again would the members discuss disbanding.';
    const quoteBuyItBack = 'Never giving up, the members found a way to buy it back.';
    for (const [q, anchor] of [
      [quoteDisbanding, 'The coming of pastor N.B. Rairden'],
      [quoteBuyItBack, 'The new building was sold during the great depression'],
    ]) {
      if (!para(anchor).includes(q)) {
        throw new Error(
          `history.mjs: the pull quote "${q}" is no longer in scripts/data/pages/history.txt. ` +
            'Use the file’s exact words rather than these.',
        );
      }
    }

    // -- The photographs -----------------------------------------------------
    // P26: the opener's two old photographs, each with the crop its arch
    // needs (the library carries no hotspot): the women's group is wide and
    // its people stand in the lower two thirds; Carter's face is high.
    const hotspot = (x, y) => {
      const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
      return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
    };
    const openerPhoto = async (key, x, y) => {
      const img = await images.image(key);
      if (!img) throw new Error(`history.mjs: no photo in the manifest for "${key}"`);
      return { ...img, hotspot: hotspot(x, y) };
    };
    const openerGroup = await openerPhoto('history-open-group', 0.5, 0.62);
    const openerCarter = await openerPhoto('history-open-carter', 0.5, 0.4);
    const eraPhotos = {};
    for (let n = 1; n <= 7; n += 1) {
      const key = `history-era-${n}`;
      const img = await images.image(key);
      if (!img) throw new Error(`history.mjs: no photo in the manifest for "${key}"`);
      eraPhotos[n] = img;
    }

    // -- The two books, off the publications capture -------------------------
    const pubLine = (phrase) => {
      const found = copy
        .textFile('publications')
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(
          `history.mjs: "${phrase}" is not in scripts/data/pages/publications.txt any more.`,
        );
      }
      return decodeEntities(found).trim();
    };
    // Both notes are cut from these two sentences; the cuts are in `edits`.
    const eidsonSentence = pubLine('Journey Down Jefferson Street');
    const claySentence = pubLine('Edited by Julie Downey Davis');
    for (const [sentence, phrase] of [
      [eidsonSentence, 'We have several copies in our church library.'],
      [claySentence, 'The book can be purchased online.'],
    ]) {
      if (!sentence.includes(phrase)) {
        throw new Error(
          `history.mjs: "${phrase}" is no longer in that line of publications.txt, so the book ` +
            'note cannot be cut from it.',
        );
      }
    }

    /** One era's two bands (or one, when the era is short). */
    // P23/P24 (2026-09-19): each era's own photograph band, not its overflow
    // text, is where a fragment should land. Every imageTextSection below now
    // carries `era-N` (era 4 carries `building` instead, because /history#building
    // is a load-bearing redirect target from Home, Ministries and History's own
    // heritage band, and it has to land on the heading and the photograph, not
    // three screens down in the tail prose). The richTextSection overflow band
    // therefore carries NO anchor of its own any more.
    const eraBands = (n, { years, name, lead, rest, imageSide, imageAnchor }) => {
      const bands = [
        {
          _type: 'imageTextSection',
          _key: `hs-era${n}`,
          anchor: { _type: 'slug', current: imageAnchor ?? `era-${n}` },
          image: eraPhotos[n],
          imageSide,
          eyebrow: years,
          heading: name,
          body: lead,
        },
      ];
      if (rest && rest.length > 0) {
        bands.push({
          _type: 'richTextSection',
          _key: `hs-era${n}-more`,
          body: rest,
        });
      }
      return bands;
    };

    return {
      title: 'Our history',
      slug: { _type: 'slug', current: 'history' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. The opening band (P26): the church's brown, "Our History", the
        //    founding sentences, the women's group in a door arch and Pastor
        //    Carter in a lancet (HeritageOpener.astro).
        {
          _type: 'heritageBandSection',
          _key: 'hs-open',
          image: openerGroup,
          archive: openerCarter,
          heading: headingLine('Our History'),
          // Two of the church's own sentences, verbatim, joined with a space.
          // history.txt:3 is the church's own opening line for the whole page
          // ("Founded in 1859, First Baptist Church of Muncie has a long
          // history of serving God and our neighbor in the Muncie
          // community."), never seeded or declared until now (Task 13 step
          // 0, P25). history.txt:11 is the founding sentence this band
          // already carried ("...meeting at the county courthouse, founded
          // the first Baptist Church in Muncie.").
          body: `${para('has a long history of serving God')} ${para('meeting at the county courthouse')}`,
        },

        // 2. The seven eras as a table of contents. Every lead is a quotation;
        //    see note 4 at the top of this file. Only the 1921-1929 row
        //    carries an anchor, and it is `building-1929` so it cannot collide
        //    with the `building` band below. Every row's body now ends with a
        //    "Read this era" link (P24) pointing at that era's own photograph
        //    band, so the table of contents is also a table of contents: era 4's
        //    link is `/history#building`, because that is where its band lands
        //    (P23), and every other row links `/history#era-N`.
        {
          _type: 'timelineSection',
          _key: 'hs-eras',
          anchor: { _type: 'slug', current: 'eras' },
          // P26: the church's own line, lifted (see `edits`).
          heading: (() => {
            const line = para('See highlights of our history below.');
            if (line !== 'See highlights of our history below.') {
              throw new Error(`history.mjs: history.txt line 5 now reads "${line}".`);
            }
            return 'Highlights of our history';
          })(),
          rows: [
            {
              _type: 'timelineRow',
              _key: 'era-1',
              marker: '1859 to 1862',
              title: 'Founding',
              body: [...paragraphs(leads[1], 'tl1'), readThisEra(1, '/history#era-1')],
            },
            {
              _type: 'timelineRow',
              _key: 'era-2',
              marker: '1862 to 1881',
              title: 'Struggle and Rairden',
              body: [...paragraphs(leads[2], 'tl2'), readThisEra(2, '/history#era-2')],
            },
            {
              _type: 'timelineRow',
              _key: 'era-3',
              marker: '1887 to 1917',
              title: 'The gas boom to the debt paid',
              body: [...paragraphs(leads[3], 'tl3'), readThisEra(3, '/history#era-3')],
            },
            {
              _type: 'timelineRow',
              _key: 'era-4',
              marker: '1921 to 1929',
              title: 'The Fighting Parson and the building',
              body: [...paragraphs(leads[4], 'tl4'), readThisEra(4, '/history#building')],
              anchor: { _type: 'slug', current: 'building-1929' },
            },
            {
              _type: 'timelineRow',
              _key: 'era-5',
              marker: '1938 to 1939',
              title: 'Sold and bought back',
              body: [...paragraphs(leads[5], 'tl5'), readThisEra(5, '/history#era-5')],
            },
            {
              _type: 'timelineRow',
              _key: 'era-6',
              marker: '1950 to 1989',
              title: 'Postwar to Mattox',
              body: [...paragraphs(leads[6], 'tl6'), readThisEra(6, '/history#era-6')],
            },
            {
              _type: 'timelineRow',
              _key: 'era-7',
              marker: '1990 to 2022',
              title: 'Saunders to the co-pastors',
              body: [...paragraphs(leads[7], 'tl7'), readThisEra(7, '/history#era-7')],
            },
            // P26: the present. "Today", never a typed year, so the row cannot
            // go stale; the church's own present-tense sentence about its
            // co-pastors, and the ministers' page.
            {
              _type: 'timelineRow',
              _key: 'era-today',
              marker: 'Today',
              title: (() => {
                const closing = para('continues to discern God’s will');
                if (!closing.includes('to serve in a new-era in the life of Muncie')) {
                  throw new Error(
                    'history.mjs: the closing sentence no longer says "to serve in a new-era in the life of Muncie", so the Today row cannot be titled from it.',
                  );
                }
                return 'A new era';
              })(),
              body: [
                ...paragraphs(para('Jonathan and Kendall each preach'), 'tl8'),
                link('Ministers', '/staff', 'tl8-more'),
              ],
            },
          ],
        },

        // 3. The eras themselves, photographs alternating sides from the
        //    right.
        ...eraBands(1, {
          years: '1859 to 1862',
          name: 'Founding',
          lead: era1Body,
          imageSide: 'right',
        }),
        ...eraBands(2, {
          years: '1862 to 1881',
          name: 'Struggle and Rairden',
          lead: era2Lead,
          rest: era2Rest,
          imageSide: 'left',
        }),

        // The first pull quote, out of the Rairden paragraph above it.
        {
          _type: 'quoteSection',
          _key: 'hs-quote-1',
          quote: quoteDisbanding,
          attribution: 'From the church’s own history',
        },

        ...eraBands(3, {
          years: '1887 to 1917',
          name: 'The gas boom to the debt paid',
          lead: era3Lead,
          rest: era3Rest,
          imageSide: 'right',
        }),
        // /history#building lands on this era's photograph band (P23).
        ...eraBands(4, {
          years: '1921 to 1929',
          name: 'The Fighting Parson and the building',
          lead: era4Lead,
          rest: era4Rest,
          imageSide: 'left',
          imageAnchor: 'building',
        }),
        ...eraBands(5, {
          years: '1938 to 1939',
          name: 'Sold and bought back',
          lead: era5Lead,
          rest: era5Rest,
          imageSide: 'right',
        }),

        // The second pull quote, out of the band above it.
        {
          _type: 'quoteSection',
          _key: 'hs-quote-2',
          quote: quoteBuyItBack,
          attribution: 'From the church’s own history',
        },

        ...eraBands(6, {
          years: '1950 to 1989',
          name: 'Postwar to Mattox',
          lead: era6Lead,
          rest: era6Rest,
          imageSide: 'left',
        }),
        ...eraBands(7, {
          years: '1990 to 2022',
          name: 'Saunders to the co-pastors',
          lead: era7Lead,
          rest: era7Rest,
          imageSide: 'right',
        }),

        // 4. The two books the church itself points people at.
        {
          _type: 'documentListSection',
          _key: 'hs-books',
          // P26: no eyebrow (rule 11: a label that only decorates).
          heading: 'Two books',
          docs: [
            {
              _type: 'listedDocument',
              _key: 'book-1',
              title: 'Journey Down Jefferson Street',
              note: 'Written by Dr. William G. Eidson. We have several copies in our church library.',
            },
            {
              _type: 'listedDocument',
              _key: 'book-2',
              title: 'We Are the Clay',
              year: 2019,
              // publications.json, the link behind "can be purchased online."
              url: 'https://www.amazon.com/We-Are-Clay-Molding-Baptist/dp/1087276802',
              note: 'Edited by Julie Downey Davis. The book can be purchased online.',
            },
          ],
        },

        // 5. Closing band. The subhead is read off Site settings rather than
        //    retyped (CLAUDE.md rule 15).
        {
          _type: 'ctaBandSection',
          _key: 'hs-cta',
          headline: 'The story continues on Sunday.',
          subhead: `${settings.serviceTime}. ${streetLine}.`,
          cta: ctaInternal('Who we are', 'who-we-are'),
          secondaryCta: ctaAnchor('The building today', '/wedding#building-use'),
        },
      ],

      seoTitle: 'History of First Baptist Church Muncie, 1859 to today',
      seoDescription:
        'First Baptist Church Muncie was founded by twelve people in 1859 and has worshipped in downtown Muncie ever since.',
    };
  },
};
