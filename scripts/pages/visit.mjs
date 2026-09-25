// scripts/pages/visit.mjs
//
// The Visit page, composed in the church identity (2026-09-24, the overnight
// rollout, branch feat/visit-identity). The visual spec is the APPROVED
// prototype, docs/superpowers/prototypes/2026-09-23-visit/visit.html, with
// Nathan's answers recorded in
// docs/superpowers/plans/2026-09-24-fbcm-rollout-overnight.md: the hero heading
// is "What to Expect on Sunday"; the morning starts with Welcome and Check-In;
// the glass doors are the Adams Street circular-drive entrance; Our building
// sits on cream beside the gold band. The page reads:
//
//   heroSection (window)  What to Expect / ON SUNDAY, three faces, the facts,
//                         and "Let us know you’re coming" (the connection card)
//   richTextSection       Good to know: four of the church's own questions,
//                         answered in the open (2026-09-25)
//   timelineSection       How the morning runs: four numbered door steps, and
//                         Communion landing after them
//   richTextSection       Your children: check-in, who cares for them,
//                         pick-up, ages and rooms (2026-09-25)
//   sundayTimesSection    Doors, parking and access (the doors path, brown)
//   imageTextSection      Where the children go: a room board, two arched photos
//   faqSection            Frequently asked questions (the deep indigo band)
//   heritageBandSection   Our building, on cream, 1929 large
//   ctaBandSection        Come as you are. (the gold band)
//
// Seven things about this file are deliberate (and an eighth, below them).
//
// 1. NOTHING IS RETYPED FROM SITE SETTINGS. The service time, the street, the
//    service length, the visitor-card form and the livestream address are read
//    off the live siteSettings document (CLAUDE.md rule 15), and seed-pages
//    turns them into {time}, {address} and the rest on the way in.
//
// 2. EVERY OTHER NUMBER IS QUOTED FROM A CAPTURE, AND THE COMMENT BESIDE IT
//    NAMES THE FILE AND THE LINE. 9:30, 10:15 and the room numbers are the
//    church's own, off scripts/data/pages/what-to-expect.txt; 1929 is off
//    scripts/data/pages/architecture.txt, and the building band derives the
//    large "1929" from that sentence (heritage-dates.ts bandYear), so it is
//    typed nowhere.
//
// 3. THE PROSE COMES OUT OF THE CAPTURE, NEVER OUT OF MEMORY. fromCapture(),
//    linesBetween() and pick() THROW when an anchor phrase moves, so a band
//    that would have seeded empty fails the run instead. Every change to the
//    church's words is listed in `edits`; only `newCopy` is new.
//
// 4. THE HEADINGS ARE THE CHURCH'S. "What to Expect on Sunday" (the Wix
//    page's title, what-to-expect.txt line 1), "Welcome and Check-In",
//    "Sunday School", "Fellowship", "Worship", "Communion" and "Frequently
//    asked questions" are that page's own headings; "Assisted Listening" and
//    "Restrooms" are the accessibility page's; "Our building" is the
//    architecture page's. "How the morning runs", "Doors, parking and access"
//    and "Where the children go" are the plan 2b band headings, kept.
//
// 5. WHAT CAME OFF, AND WHY (compared with the plan 2b page). The hero's
//    eyebrow and the band eyebrows ("Sunday morning", "Getting in",
//    "Children", "Questions", "The building", "We’d love to meet you") are
//    decoration the identity drops (rollout rule 11). "Your first Sunday,
//    start to finish." gives way to the church's own title. The doors band's
//    "Worship 10:45" row is gone because the morning path above it now
//    carries the time; its "Available" big line was never the church's. The
//    Worship step no longer repeats "Worship is at 10:45 AM each Sunday."
//    under a 10:45 numeral; it carries the livestream line instead, as the
//    prototype does. Both anchors (#accessibility, #building) are kept.
//
// 6. THE STEPS ARE DERIVED, NOT FLAGGED (src/lib/morning-path.ts). Welcome
//    has no marker, so it draws no time; the 10:45 step is the main step
//    because it is Site settings' service time; Communion lands after the
//    path because its marker ("First Sundays") is words after the last time.
//    A class line "Name (Room): description" becomes a class with a room tag,
//    and a note "Place (Room)" a place with a room tag.
//
// 7. PHOTOS COME FROM THE MEDIA LIBRARY, BY ARCHIVE FILENAME (page-images.json
//    `visit-*` library keys), with the crop each frame needs set here by a
//    hotspot. None is on another page (every scripts/pages/*.mjs and
//    page-images.json checked, 2026-09-24). Two of the prototype's picks were
//    changed for that reason: the teens at the card table is the same
//    photograph as Home's What to Expect picture (a second archive copy the
//    library does not mark as a twin), so the hero's third light is the young
//    guitarist. The Worship step keeps the prototype's congregation facing the band
//    (the photo Nathan said to keep), which is also Home's Worship goal card:
//    the controller's ruling (2026-09-24) accepts that cross-page share over a
//    same-page twin, until the photo morning.
//
// 8. THE VISITOR AUDIT (2026-09-25, feat/visit-fixes). A family new to Muncie,
//    on a phone, could not find three things parents look for first, so three
//    bands changed, all composed from existing block types (no schema change):
//    - "Let us know you’re coming" is the hero's gold button and the closing
//      band's, pointing at Site settings' connection card ({connect}), with a
//      one-line promise that is NEW copy (newCopy, for the church to approve).
//    - "Good to know" answers four of the church's own FAQ questions in the
//      open, as Ledger columns (a Text block whose h3 heads each carry a short
//      answer draws as columns, src/lib/rich-shape.ts). The full FAQ stays.
//    - "Your children", straight after the morning path, carries the church's
//      own safety facts: the Children FAQ (faq-entries.json, the same answers
//      the Ministries page prints under "Questions parents ask") and the Wix
//      /children page (children.txt). Every sentence is read off those files
//      and THROWS if it moves; only the four column heads and the band's
//      heading are new. Nothing is stated that the church has not written.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FAQ_PATH = resolve(HERE, '..', 'data', 'pages', 'faq-entries.json');

// The "What To Expect" category in scripts/data/pages/faq-entries.json
// (categories, first entry). The seven questions on this band are the ones
// carrying this id.
const WHAT_TO_EXPECT_CATEGORY = '6c034276-fcae-490d-b6ea-a222d2dfcbeb';
// The "Children FAQ" category (Wix /children), the one ministries.mjs prints
// as "Questions parents ask".
const CHILDREN_FAQ_CATEGORY = '6c6a9707-a64e-46ec-ab90-92f48bf3359a';

/** A hotspot centred on (x, y), kept inside the frame so the Studio accepts it. */
function hotspot(x, y) {
  const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
  return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
}

export default {
  id: 'page-visit',
  type: 'page',
  slug: 'visit',

  // Every sentence below that did not exist on the Wix site. The generated note
  // (docs/superpowers/notes/2026-09-19-copy-for-church-approval.md) puts these
  // in front of the church before launch.
  newCopy: [
    'Here is what a Sunday morning looks like, from the parking lot to the last hymn. (hero lead, unchanged from the plan 2b page)',
    'Nursery care is in room 104 and the family room is 105. (the Worship step: the spec’s ruling on the two rooms, and on the church’s confirm list)',
    'Plan a visit | First Baptist Church Muncie, Indiana (search title, 2026-09-24 local search pass)',
    'Worship is Sundays at 10:45 am at 309 East Adams Street, downtown Muncie. Park in the Adams Street lot. Casual dress, a nursery, and Children’s Church. (search description, not shown on the page; each fact is the page’s own: the parking lot "on the Adams Street side", "Casual dress is welcome", nursery in room 104, Children’s Church)',
    'Let us know you’re coming (the hero’s gold button and the closing band’s button, both to the connection card in Site settings > Church systems; they replace "Fill in a visitor card", 2026-09-25)',
    'If you let us know you’re coming, a greeter will look out for you. (hero, after the lead line; a promise the church has to be able to keep: who reads the connection card, and do they tell the greeters?)',
    'A greeter will look out for you. (the closing gold band, after the service time and street)',
    'Good to know (heading of the band of four questions answered in the open, 2026-09-25)',
    'Your children (heading of the children’s safety band, 2026-09-25)',
    'Check-in / Who cares for them / Pick-up / Ages and rooms (the four column heads in "Your children"; every sentence under them is the church’s own)',
  ],

  // Edits to the church's own sentences. The words are still theirs.
  edits: [
    'Joined: "At each entrance, all ages are invited to check-in with a greeter. The Greeters can direct you where you need to go, and answer questions you may have." The capture breaks the second sentence over two lines; it is one paragraph here. (Welcome and Check-In.)',
    'Joined: the circular-drive door\'s directions are four of the accessibility page\'s sentences in two paragraphs, as on the plan 2b page; the "Entrance" label and "The sidewalk leads to the wheelchair-accessible entrance." are not used. (Doors, parking and access.)',
    'Joined: "Donut [Semi-] Hour (Fellowship Hall)" is the capture\'s two lines on one. (Fellowship.)',
    'Shortened question: "I don’t have a background in the Christian religion / I’m not sure what I believe. Will that be a problem if I want to visit?" is "I’m not sure what I believe. Will that be a problem?" in Good to know, and its answer keeps its first three sentences (the livestream and pastoral-staff sentences stay in the full FAQ below). (Good to know.)',
    'Punctuation: "Am I allowed to take the Lord’s Supper (communion?)" is "(communion)?" in Good to know; the full FAQ keeps the church’s own. (Good to know.)',
    'Cut: "Does my child need to bring a Bible?" keeps its first two sentences and its last; "In Sunday School and Children’s Church the kids will be looking over passages in the Bible." is cut. (Good to know.)',
    'Rearranged: "Your children" takes whole sentences, unchanged, from the Children FAQ (the Ministries page’s "Questions parents ask"), the What to Expect FAQ and the Wix /children page, under four new heads: check-in (Children FAQ 1’s first sentence, and "Each child will be given a name tag." from What to Expect), who cares for them (Children FAQ 1’s last two sentences), pick-up (Children FAQ 2’s last sentence). Its opening sentence is /children’s own "To create a safe environment" sentence. (Your children.)',
    'Reordered: the room lines "6 weeks - 3 years: Nursery (104)", "Preschool - 2nd grade: Kickstart Children’s Church (102)" and "3rd - 5th grade: The Underground Children’s Church (B-03)" read name first, as "Nursery (104): 6 weeks - 3 years." (Your children, Ages and rooms.)',
  ],

  // Page-images manifest keys of the photos on this page that show an
  // identifiable child.
  // Facts the church's own pages disagree about (2026-09-25, "Your children").
  confirm: [
    'The Underground’s room: "3rd - 5th grade: The Underground Children’s Church (B-03)" (what-to-expect.txt:69) or "The Underground (Rm. B01) for 3rd through 5th graders." (children.txt, Worship and Children’s Church). /visit prints B-03, as the rest of the page does.',
    'The nursery’s age range: "6 weeks - 3 years" (what-to-expect.txt:34) or "infants through 3 years old" (children.txt, Sunday School). /visit prints "6 weeks - 3 years".',
  ],

  photoConsent: [
    'visit-hero-dinner',
    'visit-step-welcome',
    'visit-step-school',
    'visit-children-floor',
    'visit-children-baby',
  ],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const {
      fromCapture,
      linesBetween,
      paragraphs,
      heading,
      bullets,
      ctaExternal,
      ctaAnchor,
      decodeEntities,
      textFile,
    } = copy;

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

    // -- Reading the captures ---------------------------------------------------
    /** The one line of a capture containing `phrase`, decoded and trimmed. Throws. */
    const pick = (slug, phrase) => {
      const hit = textFile(slug)
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (!hit)
        throw new Error(`visit.mjs: "${phrase}" is no longer in scripts/data/pages/${slug}.txt`);
      return decodeEntities(hit).trim();
    };

    // -- Photos --------------------------------------------------------------
    const photo = async (key, x, y) => {
      const img = await images.image(key);
      if (!img) throw new Error(`visit.mjs: no photo in the manifest for "${key}"`);
      return { ...img, hotspot: hotspot(x, y) };
    };
    // The hero's window: the congregation is the middle (widest) light, so it
    // goes first; the girls at the dinner table and the young guitarist flank it.
    const heroCongregation = await photo('visit-hero-congregation', 0.5, 0.6);
    const heroDinner = await photo('visit-hero-dinner', 0.61, 0.5);
    const heroGuitar = await photo('visit-hero-guitar', 0.66, 0.35);
    const stepWelcome = await photo('visit-step-welcome', 0.5, 0.35);
    const stepSchool = await photo('visit-step-school', 0.42, 0.5);
    const stepFellowship = await photo('visit-step-fellowship', 0.62, 0.5);
    const stepWorship = await photo('visit-step-worship', 0.58, 0.5);
    const doorsPhoto = await photo('visit-doors', 0.5, 0.5);
    const childrenFloor = await photo('visit-children-floor', 0.5, 0.55);
    const childrenBaby = await photo('visit-children-baby', 0.5, 0.4);
    const buildingCorner = await photo('visit-building-corner', 0.5, 0.3);

    // -- Welcome and Check-In -------------------------------------------------
    // what-to-expect.txt lines 5 to 10. The capture breaks the greeter
    // sentence over lines 7 and 8; joined (listed in `edits`).
    const welcome = paragraphs(
      [
        `${pick('what-to-expect', 'all ages are invited to check-in')} ${pick('what-to-expect', 'The Greeters can direct you')} ${pick('what-to-expect', 'and answer questions you may have')}`,
        pick('what-to-expect', 'Children will receive a name tag'),
      ].join('\n\n'),
      'wel',
    );

    // -- The Sunday school class list ----------------------------------------
    // scripts/data/pages/what-to-expect.txt lines 14 to 39. Each class is a
    // heading line followed by its description line; classLine() reads the
    // pair off the capture and throws if either has moved. Timeline.astro
    // reads "Name (Room): description" back into a class with a room tag.
    const sundaySchoolLines = linesBetween('what-to-expect', 'Sunday School', 'Fellowship');

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

    const sundaySchool = bullets(
      [
        // what-to-expect.txt lines 18 and 20.
        classLine('Intergenerational Bible Study (B-04)'),
        // lines 22 and 24.
        classLine('Friendship Class (B-05)'),
        // lines 26, 28 and 30: the room sits on its own line.
        classLine('Youth Large Group', { room: '(201)' }),
        // lines 32 and 38: the nursery label on line 34 comes first, so the
        // prose is found by the phrase only the class description has.
        classLine("Children's Sunday School (B-03 & 104)", { bodyContains: 'Worship Arts' }),
        // lines 34 and 36: the nursery's age range and its room.
        '6 weeks - 3 years: Nursery (104)',
      ],
      'ss',
    );

    // -- Fellowship ------------------------------------------------------------
    // The note is lines 44 and 45 on one line; the body is line 47. The span
    // has to START at "(Fellowship Hall)" and END at "10:45 (Sanctuary)",
    // because "Worship" matches the donut paragraph itself before it matches
    // the Worship heading. The bare "Worship" heading inside the span is dropped.
    const fellowshipNote = `${pick('what-to-expect', 'Donut [Semi-] Hour')} ${pick('what-to-expect', '(Fellowship Hall)')}`;
    const donut = fromCapture('what-to-expect', {
      from: '(Fellowship Hall)',
      to: '10:45 (Sanctuary)',
      keyPrefix: 'donut',
    }).filter((b) => blockText(b).trim() !== 'Worship');

    // -- Worship -------------------------------------------------------------
    // The room is line 51's "(Sanctuary)". The body is the spec's ruling on
    // the two rooms (NEW, declared in newCopy) and the livestream line off the
    // Wix home page (home.txt line 33), its link on "YouTube channel".
    const worshipRoom = pick('what-to-expect', '10:45 (Sanctuary)').replace(/^.*\((.+)\)$/, '$1');
    const livestreamLine = pick('home', 'For live streams').replace(
      'YouTube channel',
      `[YouTube channel](${settings.livestreamUrl})`,
    );
    if (!livestreamLine.includes('](')) {
      throw new Error(
        'visit.mjs: "YouTube channel" is no longer in the livestream line of home.txt',
      );
    }
    const worship = paragraphs(
      ['Nursery care is in room 104 and the family room is 105.', livestreamLine].join('\n\n'),
      'w',
    );

    // -- Communion -----------------------------------------------------------
    // what-to-expect.txt lines 73 to 79, verbatim.
    const communion = fromCapture('what-to-expect', {
      from: 'Communion',
      to: 'Sanctuary',
      keyPrefix: 'com',
    });

    // -- The children, room by room ------------------------------------------
    // what-to-expect.txt lines 53 to 69, as the room board ImageText draws: each
    // room line ("Nursery Care (104)") a small heading, its sentences under it,
    // and the two classes as a list.
    const kidsLines = linesBetween('what-to-expect', '10:45 (Sanctuary)', 'Communion')
      .map((l) => decodeEntities(l).trim())
      .filter(Boolean);
    const isRoomHead = (l) => /^[A-Z][^.:]*\([^()]+\)$/.test(l) && !l.includes(':');
    const isClass = (l) => /^[^:]+:\s.+\([^()]+\)$/.test(l);
    const childrenByRoom = [];
    kidsLines.forEach((l, i) => {
      const key = `kids${i + 1}`;
      if (isRoomHead(l)) childrenByRoom.push(heading(l, 3, key));
      else if (isClass(l)) childrenByRoom.push(...bullets([l], key));
      else childrenByRoom.push(...paragraphs(l, key));
    });
    const roomHeads = childrenByRoom.filter((b) => b.style === 'h3').length;
    if (roomHeads !== 3) {
      throw new Error(`visit.mjs: expected 3 rooms in the children's span, found ${roomHeads}`);
    }

    // -- Doors, parking and access -------------------------------------------
    // accessibility.txt: "Assisted Listening" (line 17) and line 19;
    // "Restrooms" (line 13) and line 15; the circular drive's own detail is
    // lines 3, 5, 9 and 11, in two paragraphs.
    const circularDrive = [
      `${pick('accessibility', 'Our wheelchair accessible entrance is off')} ${pick('accessibility', 'Those wishing to use our automatic door')} ${pick('accessibility', 'The door opener is on the side').replace(/^The sidewalk leads to the wheelchair-accessible entrance\.\s*/, '')}`,
      pick('accessibility', 'Once inside, there is an elevator'),
    ].join('\n\n');

    // -- The building --------------------------------------------------------
    // architecture.txt line 4, the first paragraph of the page and the only one
    // about THIS building.
    const buildingBody = decodeEntities(
      linesBetween('architecture', 'Original Rendering 1927', 'Gothic Revival')
        .filter((l) => l.trim())
        .join(' '),
    ).trim();

    // -- Good to know (2026-09-25) --------------------------------------------
    // Four questions the church already answers, in its own words, drawn open
    // as four Ledger columns: each h3 is the question, each answer a short
    // paragraph (rich-shape.ts: two or more h3 groups of prose only, each under
    // columnWords, draw as columns). The full FAQ further down keeps all seven.
    const expectFaq = faqAnswers(WHAT_TO_EXPECT_CATEGORY);
    const childrenFaq = faqAnswers(CHILDREN_FAQ_CATEGORY);
    const goodToKnow = [
      heading(expectFaq.question('What should I wear?'), 3, 'gk-h1'),
      ...paragraphs(expectFaq.answer('What should I wear?'), 'gk-a1'),
      // The church's question, shortened (listed in `edits`), and the first
      // three sentences of its answer.
      heading('I’m not sure what I believe. Will that be a problem?', 3, 'gk-h2'),
      ...paragraphs(
        [
          expectFaq.sentence('not sure what I believe', 'It won’t be a problem at all!'),
          expectFaq.sentence('not sure what I believe', 'Anyone is welcome to attend'),
          expectFaq.sentence('not sure what I believe', 'You may participate'),
        ].join(' '),
        'gk-a2',
      ),
      // "(communion?)" punctuated as "(communion)?" (listed in `edits`).
      heading(
        expectFaq.question('the Lord’s Supper').replace('(communion?)', '(communion)?'),
        3,
        'gk-h3',
      ),
      ...paragraphs(expectFaq.answer('the Lord’s Supper'), 'gk-a3'),
      heading(childrenFaq.question('bring a Bible'), 3, 'gk-h4'),
      ...paragraphs(
        [
          childrenFaq.sentence('bring a Bible', 'No.'),
          childrenFaq.sentence('bring a Bible', 'But they are welcome to'),
          childrenFaq.sentence('bring a Bible', 'We will certainly provide a Bible'),
        ].join(' '),
        'gk-a4',
      ),
    ];

    // -- Your children (2026-09-25) --------------------------------------------
    // The safety facts, where parents look: after the morning path. The lead
    // is /children's own sentence (children.txt, "Holistic and safe."); every
    // column is whole sentences from the Children FAQ and /children, under a
    // new head (newCopy). The ages and rooms are the ones the rest of this
    // page uses (what-to-expect.txt lines 34 to 36, 67 and 69), name first.
    //
    // ONE PARAGRAPH OF 40 WORDS OR FEWER PER COLUMN, on purpose. rich-shape.ts
    // sets a column of 40 words or fewer large and a longer one small, so a
    // mix reads as two sizes side by side; and a short last paragraph after
    // the columns is pulled out as the band's foot line. Measured on the
    // 2026-09-25 render: the first cut (41, 45, 47 and three short lines)
    // drew exactly that, so each column keeps only its load-bearing sentences.
    const childrenSentence = (phrase) => {
      const line = pick('children', phrase);
      const hit = sentencesOf(line).find((x) => x.includes(phrase));
      if (!hit) throw new Error(`visit.mjs: no sentence with "${phrase}" in children.txt`);
      return hit;
    };
    const security = 'What security measures are in place?';
    const checkIn = 'What does check-in involve?';
    const nameFirst = (line) => {
      // "Preschool - 2nd grade: Kickstart Children's Church (102)" ->
      // "Kickstart Children's Church (102): Preschool - 2nd grade."
      const m = /^(.+?):\s*(.+)$/.exec(line);
      if (!m) throw new Error(`visit.mjs: "${line}" is not an "ages: room" line`);
      return `${m[2]}: ${m[1]}.`;
    };
    const yourChildren = [
      ...paragraphs(childrenSentence('To create a safe environment for our children'), 'yc-lead'),
      heading('Check-in', 3, 'yc-h1'),
      ...paragraphs(
        [
          childrenFaq.sentence(security, 'We have a check-in station'),
          // The What to Expect FAQ's own short form of the name tag.
          expectFaq.sentence('nursery care or children', 'Each child will be given a name tag.'),
        ].join(' '),
        'yc-a1',
      ),
      heading('Who cares for them', 3, 'yc-h2'),
      ...paragraphs(
        [
          childrenFaq.sentence(security, 'Each classroom maintains at least two adults'),
          childrenFaq.sentence(security, 'All Children'),
        ].join(' '),
        'yc-a2',
      ),
      heading('Pick-up', 3, 'yc-h3'),
      ...paragraphs(childrenFaq.sentence(checkIn, 'Parents will get a security tag'), 'yc-a3'),
      heading('Ages and rooms', 3, 'yc-h4'),
      ...paragraphs(
        [
          // what-to-expect.txt lines 34 and 36: the room sits on its own line.
          nameFirst(`${pick('what-to-expect', '6 weeks - 3 years: Nursery')} (104)`),
          // lines 67 and 69.
          nameFirst(pick('what-to-expect', 'Kickstart Children')),
          nameFirst(pick('what-to-expect', 'The Underground Children')),
        ].join(' '),
        'yc-a4',
      ),
    ];

    return {
      title: 'Plan a visit',
      slug: { _type: 'slug', current: 'visit' },
      // The main menu is seeded on siteSettings, not page by page, so this
      // stays off and the page still appears in the nav.
      addToMainNav: false,

      pageBuilder: [
        // 1. The window hero: the church's own page title, with "on Sunday"
        //    closing it in the gold capitals, three faces, the three facts.
        {
          _type: 'heroSection',
          _key: 'visit-hero',
          layout: 'window',
          size: 'short',
          // what-to-expect.txt line 1.
          headline: pick('what-to-expect', 'What to Expect on Sunday'),
          headingAccent: 'on Sunday',
          // The lead line, then the promise behind the gold button (NEW, both
          // in newCopy).
          subhead:
            'Here is what a Sunday morning looks like, from the parking lot to the last hymn. If you let us know you’re coming, a greeter will look out for you.',
          frames: [
            { ...heroCongregation, _key: 'frame-1' },
            { ...heroDinner, _key: 'frame-2' },
            { ...heroGuitar, _key: 'frame-3' },
          ],
          facts: [
            { _type: 'heroFact', _key: 'fact-1', label: 'Sundays', value: serviceTime },
            { _type: 'heroFact', _key: 'fact-2', label: 'Where', value: streetLine },
            { _type: 'heroFact', _key: 'fact-3', label: 'How long', value: serviceLength },
          ],
          // Site settings > Church systems > connection card: seed-pages
          // stores it as {connect}, so it follows the move to Church Trac.
          primaryCta: ctaExternal('Let us know you’re coming', settings.visitorFormUrl),
          secondaryCta: ctaExternal('Watch a service', settings.livestreamUrl),
        },

        // 1a. Good to know: four of the church's own answers, in the open.
        {
          _type: 'richTextSection',
          _key: 'visit-good-to-know',
          heading: 'Good to know',
          body: goodToKnow,
        },

        // 2. The morning, as numbered door steps; Communion lands after them.
        {
          _type: 'timelineSection',
          _key: 'visit-timeline',
          heading: 'How the morning runs',
          rows: [
            {
              _type: 'timelineRow',
              _key: 'row-0',
              // what-to-expect.txt line 3. No time: the step before the first class.
              title: pick('what-to-expect', 'Welcome and Check-In'),
              body: welcome,
              image: stepWelcome,
            },
            {
              _type: 'timelineRow',
              _key: 'row-1',
              // what-to-expect.txt line 16: "9:30 - 10:15".
              marker: '9:30 am',
              title: 'Sunday School',
              body: sundaySchool,
              image: stepSchool,
            },
            {
              _type: 'timelineRow',
              _key: 'row-2',
              // what-to-expect.txt line 42: "10:15 - 10:40".
              marker: '10:15 am',
              title: 'Fellowship',
              note: fellowshipNote,
              body: donut,
              image: stepFellowship,
            },
            {
              _type: 'timelineRow',
              _key: 'row-3',
              // From Site settings, not retyped (rule 15). The capture agrees:
              // what-to-expect.txt line 51, "10:45 (Sanctuary)".
              marker: serviceTime,
              title: 'Worship',
              note: worshipRoom,
              body: worship,
              image: stepWorship,
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

        // 2a. Your children: the church's own safety facts, where parents
        //     look. This is where /visit#children lands.
        {
          _type: 'richTextSection',
          _key: 'visit-your-children',
          anchor: { _type: 'slug', current: 'children' },
          heading: 'Your children',
          body: yourChildren,
        },

        // 3. Doors, parking and access. This is where /visit#accessibility
        //    lands.
        {
          _type: 'sundayTimesSection',
          _key: 'visit-getting-in',
          anchor: { _type: 'slug', current: 'accessibility' },
          heading: 'Doors, parking and access',
          items: [
            {
              _type: 'timeItem',
              _key: 'time-2',
              label: 'Find us',
              // Derived, never typed (rule 15): Site settings' street without
              // "Street", the short form the church says out loud.
              big: streetLine.replace(/\s+Street$/i, ''),
              // what-to-expect.txt line 91.
              body: 'Our parking lot is located on the Adams Street side.',
            },
            {
              _type: 'timeItem',
              _key: 'time-3',
              label: pick('accessibility', 'Assisted Listening'),
              body: pick('accessibility', 'if you would like an assisted listening device'),
            },
            {
              _type: 'timeItem',
              _key: 'time-4',
              label: pick('accessibility', 'Restrooms'),
              body: pick('accessibility', 'Wheelchair accessible restrooms'),
            },
          ],
          // The three entrances, the accessible one first (what-to-expect.txt
          // line 91). The first door's "Wheelchair accessible" tag is read
          // from its own words by the band.
          doors: [
            {
              _type: 'door',
              _key: 'door-1',
              name: 'Adams Street circular drive',
              body: circularDrive,
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
          photos: [{ ...doorsPhoto, _key: 'photo-1' }],
          showMap: true,
        },

        // 4. Where the children go, room by room, with the children on the
        //    classroom floor and the newborn in the small lancet.
        {
          _type: 'imageTextSection',
          _key: 'visit-children',
          image: childrenFloor,
          detail: childrenBaby,
          imageSide: 'left',
          heading: 'Where the children go',
          body: childrenByRoom,
          cta: ctaAnchor("Children's ministry", '/ministries#children'),
        },

        // 5. The seven questions the church already answers, verbatim, under
        //    its own heading (what-to-expect.txt line 87).
        {
          _type: 'faqSection',
          _key: 'visit-faq',
          heading: pick('what-to-expect', 'Frequently asked questions'),
          items: readWhatToExpectFaq(copy),
        },

        // 6. Our building, on cream. This is where /visit#building lands.
        {
          _type: 'heritageBandSection',
          _key: 'visit-heritage',
          anchor: { _type: 'slug', current: 'building' },
          // architecture.txt line 1.
          heading: pick('architecture', 'Our building'),
          body: buildingBody,
          image: buildingCorner,
          cta: ctaAnchor('Its history', '/history#building'),
        },

        // 7. The gold closing band: the visitor card and the livestream, and
        //    the two facts a visitor needs, read off Site settings (rule 15).
        {
          _type: 'ctaBandSection',
          _key: 'visit-cta',
          headline: 'Come as you are.',
          subhead: `${settings.serviceTime}. ${streetLine}. A greeter will look out for you.`,
          cta: ctaExternal('Let us know you’re coming', settings.visitorFormUrl),
          secondaryCta: ctaExternal('Watch live', settings.livestreamUrl),
        },
      ],

      // 2026-09-24, the local search pass: this is the page a search for
      // "church in Muncie" should land on, so the description is the Sunday
      // in one breath (time, street, parking, dress, children), every fact
      // from this page's own FAQ. The time and street are Site settings'.
      seoTitle: 'Plan a visit | First Baptist Church Muncie, Indiana',
      seoDescription: `Worship is ${settings.serviceTime} at ${streetLine}, downtown Muncie. Park in the Adams Street lot. Casual dress, a nursery, and Children’s Church.`,
    };
  },
};

/** A paragraph's sentences, split after . ! or ? before a capital or a quote. */
function sentencesOf(text) {
  return String(text)
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * One FAQ category of scripts/data/pages/faq-entries.json, read by phrase:
 * question(phrase) is the question containing it, answer(phrase) that
 * question's whole answer, sentence(phrase, start) the one sentence of it
 * starting with `start`. Every read THROWS when its phrase has moved, so a
 * band never seeds a sentence the church did not write.
 */
function faqAnswers(categoryId) {
  const data = JSON.parse(readFileSync(FAQ_PATH, 'utf8'));
  const entries = (data.entries ?? []).filter((e) => e.categoryId === categoryId);
  const entry = (phrase) => {
    const hit = entries.find((e) => String(e.question).includes(phrase));
    if (!hit) throw new Error(`visit.mjs: no question with "${phrase}" in faq-entries.json`);
    return hit;
  };
  return {
    question: (phrase) => String(entry(phrase).question).trim(),
    answer: (phrase) => String(entry(phrase).answer).trim(),
    sentence(phrase, start) {
      const hit = sentencesOf(entry(phrase).answer).find((x) => x.startsWith(start));
      if (!hit) {
        throw new Error(
          `visit.mjs: the answer to "${phrase}" has no sentence starting "${start}" in faq-entries.json`,
        );
      }
      return hit;
    },
  };
}

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
