// scripts/pages/home.mjs
//
// The home page, composed from the identity sections built for it on
// 2026-09-23 (the Home identity plan,
// docs/superpowers/plans/2026-09-23-fbcm-home-identity.md, Task 5). The visual
// spec is the approved prototype,
// docs/superpowers/prototypes/2026-09-23-home/home.html, with Nathan's
// overrides in the plan header: the hero is kept exactly as it was, goal
// photos are not reused from Who We Are, the history list ends in the
// present, no captions, brand colours only. The page reads:
//
//   heroSection          unchanged: the tower slideshow, "Praise and proclaim."
//   sundayTimesSection   What to Expect: the hymn board on brown
//   linkCardsSection     Our Goals: the four goals as arched doors, with glyphs
//   heritageBandSection  Our Building: the rendering, the dates, and today
//   dynamicListSection   Church Blog: the three latest posts, on taupe
//   giveBandSection      Give: the gold band
//
// Six things about this file are deliberate and worth knowing before editing.
//
// 1. NOTHING IS RETYPED FROM SITE SETTINGS. The service time, the street and
//    the livestream address are read off the live siteSettings document, never
//    copied as literals (CLAUDE.md rule 15), and seed-pages turns them into
//    {time} and {address} placeholders on the way in. The hymn board's main row
//    is the one whose time matches Site settings (src/lib/hymn-board.ts), so the
//    Worship row's time IS the settings time, and a guard below throws if it
//    ever is not. If the church moves the service, the board follows.
//
// 2. THE CHURCH'S OWN SENTENCES COME OUT OF THE WIX CAPTURE. pick() finds one
//    line of a capture by a distinctive phrase and THROWS when it cannot, so a
//    moved or reworded line fails this page instead of seeding an empty field.
//    Every change to their words is a named helper that also throws (cut(),
//    after(), sentences()), and every such change is listed in `edits` for the
//    approval note. Only the sentences in `newCopy` are new.
//
// 3. WHAT CAME OFF, AND WHY. The old composition (plan 2b) had eight bands.
//    "When we gather" became What to Expect (the address and the livestream
//    are in the hero's facts, so the board carries the Sunday times); "What a
//    first Sunday is like" FOLDED INTO it (its greeting paragraphs are the
//    board's introduction and its nursery sentence is the first note); the
//    three doors (beliefs, ministries, history) are replaced by the four goals,
//    which link into Who We Are; the brown "Limestone, oak and glass" band is
//    now the dated Our Building band. The three new sentences the old page
//    carried in those bands (link cards, heritage, give) go with them. Nothing
//    linked to an anchor on the old page (it had none).
//
// 4. THE GOALS LINK TO WHO WE ARE'S GOAL ANCHORS. GoalsBand.astro gives each
//    goal the id slugify(name): worship, the-way, witness, work (checked in the
//    built /styleguide/who-we-are, 2026-09-23). Those ids only exist on
//    /who-we-are once who-we-are.mjs is applied; until then the links land on
//    the top of the page, which is harmless.
//
// 5. PHOTOS COME FROM THE MEDIA LIBRARY, BY ARCHIVE FILENAME, and the crop each
//    frame needs is set here (the library carries no hotspot). The goal photos
//    are chosen so that none is on Who We Are (Nathan, 2026-09-23) or is a
//    current blog cover on this page. The greeter at the sanctuary door IS on
//    Who We Are (The Way's first step): it is the archive's only greeter
//    photo, the one Nathan placed on this page on 2026-09-23. The hero
//    frames are the old page's own `file` entries, resolved from this
//    checkout's asset cache, so the hero is byte-for-byte the live one. The
//    archive photograph carries a Sanity `crop` that cuts the road in its
//    lower quarter.
//
// 6. THE PRESENT-DAY ENTRY HAS NO YEAR. heritageBandSection fills a `now`
//    entry's year in at build time (src/lib/heritage-dates.ts), so 2026 is never
//    typed here and the band never goes stale.

/** A hotspot centred on (x, y), kept inside the frame so the Studio accepts it. */
function hotspot(x, y) {
  const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
  return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
}

export default {
  id: 'homePage',
  type: 'homePage',
  slug: 'home',

  // Every sentence below that did not exist on the Wix site. The generated note
  // (docs/superpowers/notes/2026-09-19-copy-for-church-approval.md) puts these
  // in front of the church before launch.
  newCopy: ['A downtown church in Muncie, Indiana. (hero kicker, unchanged from the plan 2b page)'],

  // Edits to the church's own sentences (ruling P16). The words are still
  // theirs; each is made by a helper below that throws if the sentence moved.
  edits: [
    'Joined: "At each entrance, all ages are invited to check-in with a greeter. The Greeters can direct you where you need to go, and answer questions you may have." The capture breaks the second sentence over two lines; it is one paragraph here. (What to Expect, introduction.)',
    'Cut: "A time of small group Bible study during the hour before our regular worship service." is the children’s page sentence without its opening words, "“Sunday School” refers to". (What to Expect, the 9:30 am row.)',
    'Joined: "The first Sunday of each month is communion Sunday, a service with the whole church family." puts two of the church’s lines together: "The first Sunday of each month is communion Sunday." and "A service with the whole church family." (What to Expect, second note.)',
    'Re-cased: the button "What to expect" is the Wix home page button "What To Expect" set as a sentence. (What to Expect.)',
    'Cut, a whole sentence: The Way’s card carries the goal’s first sentence only, "FBCM proclaims God\'s faithfulness with people who are curious about faith, as well as new believers."; the second, about the growth track, is on Who We Are. (Our Goals, The Way.)',
    'Re-cased: the goal links "Read more" are the Who We Are button "Read More" set as a sentence. (Our Goals.)',
    'Cut: "Twelve Indiana residents, meeting at the county courthouse, founded the first Baptist Church in Muncie." drops "On September 10, 1859" from the front, because the year stands beside it. (Our Building, 1859.)',
    'Cut: "The tiny congregation moved into their new church building." drops "Finally in June, 1862," from the front, and the sentence after it (the size and the cost) is not used. (Our Building, 1862.)',
    'Cut, a whole sentence: the building text is the first two sentences of the architecture page’s paragraph ("First Baptist’s third, and most recent, building was completed in 1929. It has been on the National Register of Historic Places since 1988."); the third, "For students and lovers of architecture it’s a striking work.", is not used. (Our Building.)',
    'Cut: "The congregation eventually moved into a new building on July 20, 1890." is the move clause of the history page’s sentence, without its opening "The old church simply could not hold that many people, and so", because the overcrowding it refers to is not on this page. (Our Building, 1890.)',
    'Cut: "On May 12, 1929, 1200 people marched from the old church to the new one on the corner of Jefferson and Adams streets." drops "and finally" from the front of the history page’s clause. (Our Building, 1929.)',
    'Lifted and cut: "First Baptist Muncie continues to discern God’s will to serve in a new era in the life of Muncie." is the closing clause of the history page ("...as First Baptist Muncie continues to discern God’s will to serve in a new-era in the life of Muncie and this community of believers in Christ Jesus."), set as its own sentence, the hyphen in "new-era" taken out and the words after "Muncie" cut. It is the list’s present-day entry, dated the year the site is built. (Our Building, this year.)',
    'Dropped: the "Support – " label on the Who We Are line "Support – We give sacrificially to help those in need through regular offerings and donations.", as on the Give page. (Give.)',
    'Re-cased: "All posts" is the Wix button "All Posts" set as a sentence. (Church Blog.)',
  ],

  // Page-images manifest keys of the photos on this page that show an
  // identifiable child. hero-children is the hero's third frame.
  photoConsent: [
    'hero-children',
    'home-expect-children',
    'home-goal-way',
    'home-goal-witness',
    'home-building-archive',
  ],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const { linesBetween, textFile, ctaInternal, ctaExternal, ctaAnchor, decodeEntities, keyer } =
      copy;

    if (!settings) {
      throw new Error(
        'home.mjs: siteSettings is not available. The home page reads the service time, ' +
          'street and livestream address from it rather than retyping them.',
      );
    }

    // -- Reading the captures ---------------------------------------------------

    /** The one line of `lines` containing `phrase`, decoded and trimmed. */
    const pick = (lines, phrase, where) => {
      const hit = lines.filter((l) => l.includes(phrase));
      if (hit.length === 0) {
        throw new Error(`home.mjs: "${phrase}" is no longer in ${where}`);
      }
      return decodeEntities(hit[0]).trim();
    };
    /** pick() over a whole capture file. */
    const line = (slug, phrase) =>
      pick(textFile(slug).split(/\r?\n/), phrase, `scripts/data/pages/${slug}.txt`);

    /** Cut `lead` off the front of a sentence and capitalise what is left. */
    const cut = (sentence, lead) => {
      if (!sentence.startsWith(lead)) {
        throw new Error(`home.mjs: "${sentence.slice(0, 60)}..." no longer starts "${lead}"`);
      }
      const rest = sentence.slice(lead.length).trim();
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    };

    /** The part of a sentence after `marker`, capitalised; throws if it moved. */
    const after = (sentence, marker) => {
      const at = sentence.indexOf(marker);
      if (at === -1) {
        throw new Error(`home.mjs: "${marker}" is no longer in "${sentence.slice(0, 60)}..."`);
      }
      const rest = sentence.slice(at + marker.length).trim();
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    };

    /**
     * The first `n` sentences of a capture line that carries more. Throws when
     * the line holds no more than that, so a line that has been split or
     * shortened is re-read rather than cut in the wrong place.
     */
    const sentences = (text, n) => {
      const parts = text.trim().split(/(?<=[.!?])\s+/);
      if (parts.length <= n) {
        throw new Error(
          `home.mjs: expected more than ${n} sentence(s) in "${text.slice(0, 60)}..."`,
        );
      }
      return parts.slice(0, n).join(' ');
    };

    // -- Facts, derived from settings ------------------------------------------
    // "Sundays at 10:45 am" -> "10:45 am"; the address's first line is the
    // street. Both are computed, so neither can drift from Site settings.
    const serviceTime = String(settings.serviceTime ?? '')
      .replace(/^Sundays at /i, '')
      .trim();
    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();
    if (!/^\d{1,2}:\d{2}\s?[ap]m$/.test(serviceTime)) {
      throw new Error(
        `home.mjs: Site settings' service time reads "${settings.serviceTime}". The hymn board's ` +
          'main row is the one matching it, so it must hold one clock time like "Sundays at 10:45 am".',
      );
    }

    // -- Photos -------------------------------------------------------------------

    /** A manifest photo, with the crop its frame needs. */
    const photo = async (key, x, y, extra = {}) => {
      const img = await images.image(key);
      if (!img) throw new Error(`home.mjs: no photo in the manifest for "${key}"`);
      return { ...img, hotspot: hotspot(x, y), ...extra };
    };

    // -- 1. Hero, unchanged ---------------------------------------------------
    // Tower first because it loads first and it is the frame the church is
    // known by; then the sanctuary, the children at the arch, the congregation
    // and the building corner. Each manifest entry already carries its alt.
    const frameKey = keyer('frame');
    const frames = [];
    for (const key of [
      'hero-tower',
      'hero-sanctuary',
      'hero-children',
      'hero-congregation',
      'hero-building',
    ]) {
      const img = await images.image(key);
      if (!img) throw new Error(`home.mjs: no photo in the manifest for "${key}"`);
      frames.push({ ...img, _key: frameKey() });
    }

    // Unchanged from the plan 2b page: five frames cross-fade, the Sunday, the
    // street and the livestream as facts. Built first, so its two buttons keep
    // the keys the live page already has (cta-1, cta-2).
    const hero = {
      _type: 'heroSection',
      _key: 'home-hero',
      layout: 'full',
      size: 'tall',
      eyebrow: 'A downtown church in Muncie, Indiana',
      headline: 'Praise and proclaim.',
      subhead: settings.tagline,
      frames,
      facts: [
        { _type: 'heroFact', _key: 'fact-1', label: 'Sundays', value: serviceTime },
        { _type: 'heroFact', _key: 'fact-2', label: 'Where', value: streetLine },
        { _type: 'heroFact', _key: 'fact-3', label: 'Online', value: 'Live on YouTube' },
      ],
      primaryCta: ctaInternal('Plan a visit', 'visit'),
      secondaryCta: ctaExternal('Watch online', settings.livestreamUrl),
    };

    // -- 2. What to Expect --------------------------------------------------------
    // The introduction is the church's greeting, the first thing the capture
    // says under "Welcome and Check-In", as one paragraph.
    const welcome = linesBetween('what-to-expect', 'Welcome and Check-In', 'Children will receive')
      .map((l) => decodeEntities(l).trim())
      .filter(Boolean);
    if (!welcome[0]?.startsWith('At each entrance') || welcome.length !== 3) {
      throw new Error(
        'home.mjs: the what-to-expect greeting is no longer the three lines "At each entrance..." ' +
          '/ "The Greeters can direct you..." / "and answer questions...". Re-read the capture.',
      );
    }
    const intro = welcome.join(' ');

    // The three times. The times and labels are the what-to-expect capture's
    // own ("9:30 - 10:15", "10:15 - 10:40", "Donut [Semi-] Hour"); each small
    // line is one of the church's sentences about that hour.
    const wte = linesBetween('what-to-expect', 'Sunday School', 'Frequently asked questions');
    pick(wte, '9:30 - 10:15', 'the what-to-expect times');
    pick(wte, '10:15 - 10:40', 'the what-to-expect times');
    const donut = pick(wte, 'Donut [Semi-] Hour', 'the what-to-expect times');
    const sundaySchool = cut(
      sentences(line('children', 'refers to a time of small group Bible study'), 1),
      '“Sunday School” refers to',
    );
    const fellowship = pick(wte, 'join in a time of fellowship', 'the what-to-expect times');
    const livestream = line('home', 'For live streams');

    // The two notes: nursery care, verbatim, and communion Sunday, two of the
    // church's lines put together (edits).
    const nursery = pick(wte, 'nursery care is available throughout', 'the what-to-expect notes');
    const communionDay = pick(wte, 'The first Sunday of each month', 'the what-to-expect notes');
    const communionWhat = pick(
      wte,
      'A service with the whole church family',
      'the what-to-expect notes',
    );
    const communion = `${communionDay.replace(/\.$/, '')}, ${communionWhat.charAt(0).toLowerCase()}${communionWhat.slice(1)}`;

    const expectCta = ctaInternal('What to expect', 'visit');

    // -- 3. Our Goals ---------------------------------------------------------------
    // Each goal's own opening sentence from Who We Are, in their order, each
    // door linking to that goal on Who We Are.
    const goal = async (_key, name, glyph, lines, phrase, photoArgs, anchor) => ({
      _type: 'linkCard',
      _key,
      title: name,
      // A goal's opening sentence only: The Way's line carries a second one.
      body: pick(lines, phrase, `the ${name} goal in scripts/data/pages/who-we-are.txt`).split(
        /(?<=[.!?])\s+/,
      )[0],
      cta: ctaAnchor(readMore, `/who-we-are#${anchor}`),
      image: await photo(...photoArgs),
      glyph,
    });
    const readMoreRaw = line('who-we-are', '[Button] Read More')
      .split('->')[0]
      .replace('[Button]', '')
      .trim();
    if (readMoreRaw !== 'Read More') {
      throw new Error(`home.mjs: the Who We Are button is now "${readMoreRaw}", not "Read More".`);
    }
    const readMore = 'Read more';
    const cards = [
      await goal(
        'goal-worship',
        'Worship',
        'window',
        linesBetween('who-we-are', 'Worship', 'The Way'),
        'FBCM gives praise to the Lord',
        ['home-goal-worship', 0.45, 0.5],
        'worship',
      ),
      await goal(
        'goal-way',
        'The Way',
        'door',
        linesBetween('who-we-are', 'The Way', 'Witness'),
        'FBCM proclaims God',
        ['home-goal-way', 0.58, 0.5],
        'the-way',
      ),
      await goal(
        'goal-witness',
        'Witness',
        'rose',
        linesBetween('who-we-are', 'Witness', 'Work'),
        'To make known what God has done',
        ['home-goal-witness', 0.5, 0.5],
        'witness',
      ),
      await goal(
        'goal-work',
        'Work',
        'basin',
        linesBetween('who-we-are', 'Work', 'Our commitment to one another'),
        'FBCM exalts God',
        ['home-goal-work', 0.3, 0.4],
        'work',
      ),
    ];
    // The church's own sentence introducing its goals.
    const goalsIntro = line('who-we-are', 'has set certain goals for our church this season');

    // -- 4. Our Building ----------------------------------------------------------
    // The architecture capture's line carries three sentences; the first two
    // (completed in 1929, on the National Register since 1988) are the text.
    const building = sentences(
      line('architecture', 'third, and most recent, building was completed in 1929'),
      2,
    );
    if (!building.endsWith('National Register of Historic Places since 1988.')) {
      throw new Error(
        `home.mjs: the building text no longer ends on the 1988 listing: "${building}"`,
      );
    }

    const dates = [
      {
        _type: 'heritageDate',
        _key: 'date-1859',
        year: '1859',
        text: cut(
          line('history', 'twelve Indiana residents, meeting at the county courthouse'),
          'On September 10, 1859',
        ),
      },
      {
        _type: 'heritageDate',
        _key: 'date-1862',
        year: '1862',
        text: cut(
          sentences(
            line('history', 'the tiny congregation moved into their new church building'),
            1,
          ),
          'Finally in June, 1862,',
        ),
      },
      {
        _type: 'heritageDate',
        _key: 'date-1890',
        year: '1890',
        // The move clause only: the sentence opens "The old church simply could
        // not hold that many people", whose antecedent (the overcrowding line
        // before it on the history page) is not on this page.
        text: after(
          pick(
            linesBetween('history', 'Second Building - 1890', 'State Convention'),
            'moved into a new building on July 20, 1890',
            'the Second Building section of scripts/data/pages/history.txt',
          ),
          'and so',
        ),
      },
      {
        _type: 'heritageDate',
        _key: 'date-1929',
        year: '1929',
        text: (() => {
          const s = after(
            line('history', '1200 people marched from the old church'),
            'and finally on',
          );
          const m = /^(May 12, 1929, 1200 people marched .*? streets\.)/.exec(s);
          if (!m)
            throw new Error(
              `home.mjs: the 1929 march is no longer "May 12, 1929, 1200 people marched ... streets."`,
            );
          return `On ${m[1]}`;
        })(),
      },
      {
        _type: 'heritageDate',
        _key: 'date-now',
        now: true,
        text: (() => {
          const s = after(
            line('history', 'continues to discern God’s will'),
            'hope, will complement one another as',
          );
          const m =
            /^(First Baptist Muncie continues to discern God’s will to serve in a) new-era (in the life of Muncie)\b/.exec(
              s,
            );
          if (!m)
            throw new Error(
              `home.mjs: the history page's closing clause has changed: "${s.slice(0, 80)}..."`,
            );
          return `${m[1]} new era ${m[2]}.`;
        })(),
      },
    ];

    // -- 6. Give ----------------------------------------------------------------------
    const supportRaw = line('who-we-are', 'give sacrificially');
    const support = after(supportRaw, '–');

    const page = {
      pageBuilder: [
        hero,

        // 2. What to Expect: the hymn board on brown. The greeter at the
        //    sanctuary door in the wide arch, two children in the lancet.
        {
          _type: 'sundayTimesSection',
          _key: 'home-sundays',
          heading: 'What to Expect',
          intro,
          items: [
            {
              _type: 'timeItem',
              _key: 'time-1',
              big: '9:30 am',
              label: 'Sunday School',
              body: sundaySchool,
            },
            { _type: 'timeItem', _key: 'time-2', big: '10:15 am', label: donut, body: fellowship },
            {
              _type: 'timeItem',
              _key: 'time-3',
              big: serviceTime,
              label: 'Worship',
              body: livestream,
            },
          ],
          notes: [nursery, communion],
          photos: [
            await photo('home-expect-greeter', 0.48, 0.35, { _key: 'expect-greeter' }),
            await photo('home-expect-children', 0.44, 0.5, { _key: 'expect-children' }),
          ],
          cta: expectCta,
          // The street and the directions are in the hero's facts and on /visit.
          showMap: false,
        },

        // 3. Our Goals: the four goals as arched doors with their glyphs.
        {
          _type: 'linkCardsSection',
          _key: 'home-goals',
          heading: 'Our Goals',
          intro: goalsIntro,
          cards,
        },

        // 4. Our Building: the 1927 rendering on the paper, the congregation
        //    at the door, the four dates and today.
        {
          _type: 'heritageBandSection',
          _key: 'home-heritage',
          heading: 'Our Building',
          body: building,
          image: await photo('home-building-rendering', 0.5, 0.5),
          archive: await photo('home-building-archive', 0.5, 0.45, {
            // The lower quarter of the frame is the road in front of the church.
            crop: { _type: 'sanity.imageCrop', top: 0, bottom: 0.27, left: 0, right: 0 },
          }),
          dates,
          cta: ctaInternal('Our history', 'history'),
        },

        // 5. Church Blog: the three most recent posts.
        {
          _type: 'dynamicListSection',
          _key: 'home-blog',
          headline: 'Church Blog',
          subhead: line('home', 'Read the latest from FBCM'),
          source: 'journal',
          limit: 3,
          cta: ctaAnchor('All posts', '/blog'),
        },

        // 6. Give. buttonLabel and buttonUrl are left to their schema defaults,
        //    so the button says "Give through Church Center" and points at the
        //    giving address in Site settings.
        {
          _type: 'giveBandSection',
          _key: 'home-give',
          heading: 'Give',
          body: support,
        },
      ],

      seoTitle: `First Baptist Church Muncie | Sundays ${serviceTime}, downtown Muncie`,
      // The street comes from Site settings like everywhere else. "Muncie,
      // Indiana" stays typed on purpose: the postal city line in the address
      // is "Muncie, IN 47305", and the prose form of the state is not
      // derivable from it without inventing an abbreviation table.
      seoDescription: `${settings.tagline} ${streetLine}, Muncie, Indiana.`,
    };

    // -- Guards ---------------------------------------------------------------------
    const json = JSON.stringify(page);
    // No em-dash reaches the page (CLAUDE.md rule 2).
    const dash = json.indexOf('—');
    if (dash !== -1) {
      throw new Error(`home.mjs: an em-dash reached the page: ${json.slice(dash - 60, dash + 20)}`);
    }
    // No link to the Wix file host, which dies at cutover.
    if (json.includes('fbcmuncie.org/_files')) {
      throw new Error('home.mjs: a fbcmuncie.org/_files link reached the page.');
    }
    // Times are written "10:45 am", lower case, as everywhere else on the site.
    const shouty = /\d{1,2}(:\d{2})?\s?(AM|PM|A\.M\.|P\.M\.|a\.m\.|p\.m\.)/.exec(json);
    if (shouty)
      throw new Error(`home.mjs: "${shouty[0]}" should be written lower case, "am" or "pm".`);
    // The board's main row is the Worship row, and only because its time is
    // the Site settings time (src/lib/hymn-board.ts sameTime).
    const rows = page.pageBuilder[1].items;
    const mains = rows.filter((r) => r.big === serviceTime);
    if (mains.length !== 1 || mains[0].label !== 'Worship') {
      throw new Error(
        'home.mjs: exactly one hymn-board row, Worship, must carry the service time.',
      );
    }
    return page;
  },
};
