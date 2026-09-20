// scripts/pages/visit.mjs
//
// The Visit page, composed exactly as section 5.2 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// one scroll that walks a first-time visitor from the parking lot to the pew,
// in the church's own words.
//
// Five things about this file are deliberate.
//
// 1. NOTHING IS RETYPED FROM SITE SETTINGS. The service time, the street, the
//    service length, the visitor-card form and the livestream address are read
//    off the live siteSettings document (CLAUDE.md rule 15).
//
// 2. EVERY OTHER NUMBER IS QUOTED FROM A CAPTURE, AND THE COMMENT BESIDE IT
//    NAMES THE FILE AND THE LINE. 9:30, 10:15 and the room numbers are the
//    church's own, off scripts/data/pages/what-to-expect.txt; 1929 is off
//    scripts/data/pages/architecture.txt.
//
// 3. THE PROSE COMES OUT OF THE CAPTURE, NEVER OUT OF MEMORY. fromCapture()
//    and linesBetween() THROW when an anchor phrase moves, so a band that
//    would have seeded empty fails the run instead. Two anchors needed care:
//    "Worship" matches the donut paragraph ("Between Bible study and Worship")
//    before it matches the Worship heading, and the children's rooms are only
//    complete if the span STARTS at the line above "Nursery Care (104)". Both
//    are handled below, with the reason written next to each.
//
// 4. THE SUNDAY SCHOOL CLASS LIST IS PAIRED, NOT RETYPED. The capture writes
//    each class as a heading line followed by its description line, which
//    would seed eleven one-line paragraphs into one timeline row. classLine()
//    pairs the two off the capture and joins them with a colon, so the words
//    are still the church's and still verified against the file.
//
// 5. THE FAQ BAND IS BUILT FROM faq-entries.json, LINKS AND ALL. The seven
//    "What To Expect" entries are read by category id, sorted by sortOrder,
//    and each entry's `links` array is folded back into its answer as the
//    inline [text](href) syntax page-copy.mjs understands, so every link the
//    church had survives. One punctuation edit is made: the em-dash in the
//    nursery answer becomes a comma (CLAUDE.md rule 2). No words change.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FAQ_PATH = resolve(HERE, '..', 'data', 'pages', 'faq-entries.json');

// The "What To Expect" category in scripts/data/pages/faq-entries.json
// (categories, first entry). The seven questions on this band are the ones
// carrying this id.
const WHAT_TO_EXPECT_CATEGORY = '6c034276-fcae-490d-b6ea-a222d2dfcbeb';

export default {
  id: 'page-visit',
  type: 'page',
  slug: 'visit',

  // Every sentence below that did not exist on the Wix site. The generated note
  // (docs/superpowers/notes/2026-09-19-copy-for-church-approval.md) puts these
  // in front of the church before launch.
  newCopy: [
    'Here is what a Sunday morning looks like, from the parking lot to the last hymn. (hero lead)',
    'Nursery care is in room 104 and the family room is 105. (timeline, the 10:45 row: the spec’s ruling on the two rooms, and on the church’s confirm list)',
    'First Baptist Church Muncie gathers for worship at 10:45 am every Sunday at 309 East Adams Street in downtown Muncie. (search description)',
  ],

  // Bands with identifiable children in them, for the consent conversation.
  // ministries-children is an alias of the hero children frame; see
  // scripts/data/page-images.json.
  photoConsent: ['visit-children', 'ministries-children'],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const { fromCapture, linesBetween, paragraphs, ctaExternal, ctaAnchor, decodeEntities } = copy;

    if (!settings) {
      throw new Error(
        'visit.mjs: siteSettings is not available. The Visit page reads the service time, ' +
          'street, service length, visitor form and livestream address from it rather than ' +
          'retyping them.',
      );
    }

    // -- Facts, derived from settings ---------------------------------------
    // "Sundays at 10:45 am" -> "10:45 am"; the address's first line is the
    // street. Both are computed, so neither can drift from Site settings.
    const serviceTime = String(settings.serviceTime ?? '')
      .replace(/^Sundays at /i, '')
      .trim();
    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();
    const serviceLength = String(settings.serviceLength ?? '').trim();

    // -- Photos --------------------------------------------------------------
    const children = await images.image('visit-children');
    const childrenAgain = await images.image('ministries-children');
    const tower = await images.image('hero-tower');
    for (const [key, img] of [
      ['visit-children', children],
      ['ministries-children', childrenAgain],
      ['hero-tower', tower],
    ]) {
      if (!img) throw new Error(`visit.mjs: no photo in the manifest for "${key}"`);
    }

    // -- The Sunday school class list ----------------------------------------
    // scripts/data/pages/what-to-expect.txt lines 14 to 39. Each class is a
    // heading line followed by its description line; classLine() reads the
    // pair off the capture and throws if either has moved.
    const sundaySchoolLines = linesBetween('what-to-expect', 'Sunday School', 'Fellowship');

    /**
     * "Head (room): the description line the capture puts under it."
     * `room` is for the two classes whose room number sits on a line of its
     * own between the heading and the prose; `bodyContains` is for the one
     * whose heading is followed by another label before its prose. Both throw
     * rather than guess.
     */
    const classLine = (head, { room = null, bodyContains = null } = {}) => {
      const at = sundaySchoolLines.findIndex((l) => l.includes(head));
      if (at === -1) {
        throw new Error(
          `visit.mjs: "${head}" is no longer in the Sunday School section of ` +
            'scripts/data/pages/what-to-expect.txt',
        );
      }
      const body = sundaySchoolLines
        .slice(at + 1)
        .find(
          (l) =>
            l.trim() &&
            (room === null || !l.includes(room)) &&
            (bodyContains === null || l.includes(bodyContains)),
        );
      if (!body) {
        throw new Error(`visit.mjs: "${head}" has no description line after it in the capture`);
      }
      return `${head}${room ? ` ${room}` : ''}: ${decodeEntities(body).trim()}`;
    };

    const sundaySchool = copy.bullets(
      [
        // what-to-expect.txt lines 18 and 20.
        classLine('Intergenerational Bible Study (B-04)'),
        // lines 22 and 24.
        classLine('Friendship Class (B-05)'),
        // lines 26, 28 and 30: the room sits on its own line between the
        // heading and the sentence, so the label carries it and the finder
        // skips past it to the prose.
        classLine('Youth Large Group', { room: '(201)' }),
        // lines 32 and 38: the nursery label on line 34 comes first, so the
        // prose is found by the phrase that only the class description has.
        classLine("Children's Sunday School (B-03 & 104)", { bodyContains: 'Worship Arts' }),
        // lines 34 and 36: the nursery's age range and its room, as the
        // capture writes them.
        '6 weeks - 3 years: Nursery (104)',
      ],
      'ss',
    );

    // -- The donut hour ------------------------------------------------------
    // The span has to START at "(Fellowship Hall)" and END at
    // "10:45 (Sanctuary)", because "Worship" matches the donut paragraph
    // itself ("Between Bible study and Worship") before it matches the Worship
    // heading. The bare "Worship" heading inside the span is then dropped.
    const donut = fromCapture('what-to-expect', {
      from: '(Fellowship Hall)',
      to: '10:45 (Sanctuary)',
      keyPrefix: 'donut',
    }).filter((b) => blockText(b).trim() !== 'Worship');

    // -- Worship -------------------------------------------------------------
    // The church's own worship sentence, off the Wix home page
    // (scripts/data/pages/home.txt line 32), plus the spec's ruling on the two
    // rooms. That second sentence is NEW and is declared in newCopy above.
    const worship = [
      ...paragraphs(
        linesBetween('home', 'Join us for worship', 'For live streams').join('\n'),
        'w',
      ),
      ...paragraphs('Nursery care is in room 104 and the family room is 105.', 'wr'),
    ];

    // -- Communion -----------------------------------------------------------
    // what-to-expect.txt lines 72 to 80, verbatim.
    const communion = fromCapture('what-to-expect', {
      from: 'Communion',
      to: 'Sanctuary',
      keyPrefix: 'com',
    });

    // -- The children, room by room ------------------------------------------
    // The span STARTS at "10:45 (Sanctuary)" rather than at "Nursery Care
    // (104)" on purpose: linesBetween is strictly BETWEEN its anchors, so
    // anchoring on the nursery heading would drop the heading, and with it the
    // only place room 104 is named. what-to-expect.txt lines 53 to 70.
    const childrenByRoom = fromCapture('what-to-expect', {
      from: '10:45 (Sanctuary)',
      to: 'Communion',
      keyPrefix: 'kids',
    });

    // -- The building --------------------------------------------------------
    // architecture.txt line 4, the first paragraph of the page and the only one
    // about THIS building. (The brief's suggested "Completed in 1929" anchor is
    // a picture caption three quarters of the way down; the paragraph under it,
    // "The number of new Gothic Revival buildings declined sharply after the
    // 1930s", is about the style and not about First Baptist. Same file, same
    // page, still verbatim, and it is the one that carries the 1929 date.)
    const buildingBody = decodeEntities(
      linesBetween('architecture', 'Original Rendering 1927', 'Gothic Revival')
        .filter((l) => l.trim())
        .join(' '),
    ).trim();

    return {
      title: 'Plan a visit',
      slug: { _type: 'slug', current: 'visit' },
      // The main menu is seeded on siteSettings, not page by page, so this
      // stays off and the page still appears in the nav.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero. Words left, the children at the stained glass on the right.
        {
          _type: 'heroSection',
          _key: 'visit-hero',
          layout: 'split',
          size: 'short',
          eyebrow: 'Plan a visit',
          headline: 'Your first Sunday, start to finish.',
          subhead:
            'Here is what a Sunday morning looks like, from the parking lot to the last hymn.',
          frames: [{ ...children, _key: 'frame-1' }],
          facts: [
            { _type: 'heroFact', _key: 'fact-1', label: 'Sundays', value: serviceTime },
            { _type: 'heroFact', _key: 'fact-2', label: 'Where', value: streetLine },
            { _type: 'heroFact', _key: 'fact-3', label: 'How long', value: serviceLength },
          ],
          primaryCta: ctaExternal('Fill in a visitor card', settings.visitorFormUrl),
          secondaryCta: ctaExternal('Watch a service', settings.livestreamUrl),
        },

        // 2. The morning, top to bottom. No row carries its own anchor: the
        //    page's two anchors are on the bands below.
        {
          _type: 'timelineSection',
          _key: 'visit-timeline',
          eyebrow: 'Sunday morning',
          heading: 'How the morning runs',
          rows: [
            {
              _type: 'timelineRow',
              _key: 'row-1',
              // what-to-expect.txt line 16: "9:30 - 10:15".
              marker: '9:30 am',
              title: 'Sunday school',
              body: sundaySchool,
            },
            {
              _type: 'timelineRow',
              _key: 'row-2',
              // what-to-expect.txt line 42: "10:15 - 10:40".
              marker: '10:15 am',
              title: 'Donut hour',
              body: donut,
            },
            {
              _type: 'timelineRow',
              _key: 'row-3',
              // From Site settings, not retyped (rule 15). The capture agrees:
              // what-to-expect.txt line 51, "10:45 (Sanctuary)".
              marker: serviceTime,
              title: 'Worship',
              body: worship,
            },
            {
              _type: 'timelineRow',
              _key: 'row-4',
              // what-to-expect.txt line 75: "The first Sunday of each month is
              // communion Sunday."
              marker: 'First Sundays',
              title: 'Communion',
              body: communion,
            },
          ],
        },

        // 3. Doors, parking and access. This is where /visit#accessibility
        //    lands.
        {
          _type: 'sundayTimesSection',
          _key: 'visit-getting-in',
          anchor: { _type: 'slug', current: 'accessibility' },
          eyebrow: 'Getting in',
          heading: 'Doors, parking and access',
          items: [
            {
              _type: 'timeItem',
              _key: 'time-1',
              label: 'Worship',
              big: serviceTime,
              // home.txt line 32.
              body: 'Worship is at 10:45 AM each Sunday.',
            },
            {
              _type: 'timeItem',
              _key: 'time-2',
              label: 'Find us',
              // Derived, never typed (CLAUDE.md rule 15). streetLine is
              // siteSettings.address's first line, "309 East Adams Street";
              // the band's big line drops the word "Street" because the label
              // above it already says "Find us" and the short form is what the
              // church says out loud. A typed copy here would be a second
              // source of truth for something Site settings already holds, and
              // the typed one is the one that goes stale.
              big: streetLine.replace(/\s+Street$/i, ''),
              // what-to-expect.txt line 91, the church's own answer to "How do
              // I find the church?".
              body: 'Our parking lot is located on the Adams Street side.',
            },
            {
              _type: 'timeItem',
              _key: 'time-3',
              label: 'Assisted listening',
              big: 'Available',
              // accessibility.txt line 19, verbatim.
              body: 'On Sundays, if you would like an assisted listening device, please ask one of our greeters or the Welcome Center and they will be happy to give you one.',
            },
          ],
          // The three entrances, the accessible one first. All three are named
          // in what-to-expect.txt line 91 (and in faq-entries.json, sortOrder
          // 6); the circular drive's own detail is accessibility.txt lines 3,
          // 5, 9 and 11. The automatic door-opener sentence is kept, as the
          // spec asks.
          doors: [
            {
              _type: 'door',
              _key: 'door-1',
              name: 'Adams Street circular drive',
              body: 'Our wheelchair accessible entrance is off our circular drive, on the Adams street side of the building. Those wishing to use our automatic door should use the circular drive entrance. The door opener is on the side of our mailbox, close to the door on its right. Once inside, there is an elevator which will go to any floor: our lower level (B) which houses our fellowship hall, the first floor (where the sanctuary and offices are) or the second floor (which hosts classrooms and our youth center).',
            },
            {
              _type: 'door',
              _key: 'door-2',
              name: 'The wooden front doors',
              body: 'The large wooden front doors which go into the sanctuary.',
            },
            {
              _type: 'door',
              _key: 'door-3',
              name: 'Jefferson Street side doors',
              body: 'The Jefferson Street side doors which enter our main hallway near the church offices.',
            },
          ],
          showMap: true,
        },

        // 4. Where the children go, room by room, in their own words.
        {
          _type: 'imageTextSection',
          _key: 'visit-children',
          image: childrenAgain,
          imageSide: 'left',
          eyebrow: 'Children',
          heading: 'Where the children go',
          body: childrenByRoom,
          cta: ctaAnchor("Children's ministry", '/ministries#children'),
        },

        // 5. The seven questions the church already answers, verbatim.
        {
          _type: 'faqSection',
          _key: 'visit-faq',
          eyebrow: 'Questions',
          heading: 'Questions people ask',
          items: readWhatToExpectFaq(copy),
        },

        // 6. The building, on brown, with the tower. This is where
        //    /visit#building lands.
        {
          _type: 'heritageBandSection',
          _key: 'visit-heritage',
          anchor: { _type: 'slug', current: 'building' },
          eyebrow: 'The building',
          // architecture.txt line 4: "completed in 1929".
          heading: 'Built in 1929',
          body: buildingBody,
          image: tower,
          cta: ctaAnchor('Its history', '/history#building'),
        },

        // 7. Closing band.
        //
        //    TWO BUTTONS now. The band carried one until 2026-09-19, not by
        //    choice but because ctaBandSection declared only `cta` while
        //    FinalCta.astro had accepted a `secondaryCta` all along. Ruling P13
        //    closed that gap end to end (schema, query, SectionRenderer), so
        //    the visitor card and the livestream both sit here, and the subhead
        //    is the two facts a visitor needs at the moment they decide, read
        //    off Site settings rather than retyped (rule 15).
        {
          _type: 'ctaBandSection',
          _key: 'visit-cta',
          eyebrow: 'We’d love to meet you',
          headline: 'Come as you are.',
          subhead: `${settings.serviceTime}. ${streetLine}.`,
          cta: ctaExternal('Fill in a visitor card', settings.visitorFormUrl),
          secondaryCta: ctaExternal('Watch live', settings.livestreamUrl),
        },
      ],

      seoTitle: 'Plan a visit | First Baptist Church Muncie',
      seoDescription: `First Baptist Church Muncie gathers for worship at 10:45 am every Sunday at ${streetLine} in downtown Muncie.`,
    };
  },
};

/** The plain text of one portable-text block, for filtering. */
function blockText(block) {
  return (block.children ?? []).map((c) => c.text ?? '').join('');
}

/**
 * The seven "What To Expect" questions from scripts/data/pages/faq-entries.json,
 * in their sortOrder, each answer verbatim with its links folded back in as the
 * inline [text](href) syntax paragraphs() understands.
 */
function readWhatToExpectFaq(copy) {
  const data = JSON.parse(readFileSync(FAQ_PATH, 'utf8'));
  const entries = (data.entries ?? [])
    .filter((e) => e.categoryId === WHAT_TO_EXPECT_CATEGORY)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (entries.length !== 7) {
    throw new Error(
      `visit.mjs: expected 7 "What To Expect" questions in faq-entries.json, found ${entries.length}`,
    );
  }

  return entries.map((entry, i) => {
    let answer = String(entry.answer);
    for (const l of entry.links ?? []) {
      if (!answer.includes(l.text)) {
        throw new Error(
          `visit.mjs: the link text "${l.text}" is no longer in its answer in faq-entries.json`,
        );
      }
      answer = answer.replace(l.text, `[${l.text}](${l.url})`);
    }
    // The church's only em-dash, swapped for a comma (CLAUDE.md rule 2). No
    // words change.
    answer = answer.replace(/\s+—\s+/g, ', ');
    return {
      _type: 'faqItem',
      _key: `q-${i + 1}`,
      question: entry.question,
      answer: copy.paragraphs(answer.trim(), `a${i + 1}`),
    };
  });
}
