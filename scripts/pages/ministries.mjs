// scripts/pages/ministries.mjs
//
// The Ministries page, composed exactly as section 5.5 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// five Wix pages (worship, children, youth, adult, outreach: 2,397 words)
// become one page with five anchors, because plan 1's redirects already point
// at them. /worship, /children, /youth, /adult and /outreach each land on a
// band of this page, so every one of those anchors is load-bearing and none of
// them may be renamed without the redirect being changed in the same commit.
//
// Seven things about this file are deliberate.
//
// 1. EVERY PARAGRAPH IS READ OFF A CAPTURE, NEVER TYPED FROM MEMORY. line()
//    and linesBetween() THROW when an anchor phrase moves, so a band that
//    would have seeded empty, or half-empty, fails the run instead.
//
// 2. THE COORDINATORS ARE DERIVED FROM THE STAFF DOCUMENTS (CLAUDE.md rule
//    15). Not one name, role or address on this page is typed here. Each
//    contact line is built at seed time from the staffMember document whose
//    role matches, and the "Get involved" band is a staffGridSection that is
//    derived LIVE at build time, so it cannot go stale at all. This also
//    settles the children's-ministry name conflict the content map flagged:
//    the Wix page said Jennifer Durke, the staff table says Jaden Johnson, and
//    this page says whatever the staff document says, once.
//
// 3. "GET INVOLVED" APPEARS ONCE. It was on all five source pages, five times,
//    with five different people under it. Here it is one band listing the
//    whole Church Coordination Team, and each ministry band ends with the one
//    person to talk to about that ministry.
//
// 4. CCT IS SPELLED OUT. The five source pages use it as a role prefix without
//    ever saying what it is. The coordination roles come off the staff
//    documents without the prefix, so the only "CCT" left on the page is
//    inside a children's FAQ answer, and it is expanded there.
//
// 5. THE NURSERY AND FAMILY ROOM NUMBERS ARE FORCED TO THE SPEC'S RULING, AND
//    THAT IS AN EDIT, NOT A TRANSCRIPTION. The two captures disagree:
//    what-to-expect.txt says Nursery Care (104) and Family Room (105), and
//    children.txt says the reverse in three places while saying 104 for the
//    nursery in a fourth. This one page carries both captures, so a verbatim
//    render would say 104 and 105 for the same room a few hundred pixels
//    apart, and /visit already states 104 for the nursery. Every one of those
//    three lines is therefore swapped, by a helper that throws when the
//    sentence has moved, and each swap is declared in `edits`. The church
//    still has to confirm which is right (fact 1 in the approval note); when
//    they do, this is the one place to change.
//
// 6. SEASONAL EVENTS CARRY NO DATES. The source's "Dates and Times Vary" line
//    is cut and the events are listed under "Through the year", so nothing on
//    the page goes stale in November.
//
// 7. CITY LIFE CLUB'S 7:17 pm IS KEPT EXACTLY AS THE CHURCH WROTE IT. It looks
//    like a typo for 7:15 and it is not treated as one: it is on the church's
//    own confirm list in the approval note, where a human decides.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FAQ_PATH = resolve(HERE, '..', 'data', 'pages', 'faq-entries.json');

// The "Children FAQ" category in scripts/data/pages/faq-entries.json
// (categories, second entry). The five questions on the children band are the
// ones carrying this id.
const CHILDREN_FAQ_CATEGORY = '6c6a9707-a64e-46ec-ab90-92f48bf3359a';

export default {
  id: 'page-ministries',
  type: 'page',
  slug: 'ministries',

  // Every sentence on this page that did not exist on the Wix site. Three.
  // Every other word a visitor reads is the church's own text, cut.
  newCopy: [
    'Every age has a place here. (hero headline)',
    'Worship arts, children, youth, adults and outreach at First Baptist Church Muncie: Sunday school at 9:30 am, worship at 10:45 am, and the person to talk to about each one. (search description)',
    'Contact the church office. (the end of a ministry’s contact line when the staff document for that role carries no email address, which today is only the children’s ministry; it links to the contact page)',
  ],

  // Edits to the church's own sentences (ruling P16). Nothing is reworded: the
  // text is cut, re-cased, joined back together where the Wix layout broke one
  // sentence across four lines, or re-pointed at a link that still works.
  edits: [
    'Room numbers, forced to one answer: scripts/data/pages/children.txt calls the nursery Rm. 105 and the family room Rm. 104 in three sentences, while the same file calls the nursery Rm. 104 in a fourth and scripts/data/pages/what-to-expect.txt calls it 104 throughout. This page carries both captures, and /visit already says 104, so the three sentences are swapped to Nursery (Rm. 104) and Family Room (Rm. 105). This is the disagreement the church still has to settle (fact 1 below).',
    'Cut as a repeat: the "Nursery / (Rm. 104) is available for infants through 3-year-olds." card, which says the same thing as the nursery line in the Sunday School list above it.',
    'Cut: "Dates and Times Vary" under Special Events, and the five ways to get event news that followed it. The events are listed under "Through the year" with no dates, and the newsletters and the app are in one place at the foot of the page.',
    'Spelled out, once: "the Children’s Ministry CCT Leader" becomes "the Children’s Ministry Church Coordination Team leader". CCT was used as a role prefix on all five source pages and never expanded.',
    'Re-pointed, so they still work: the three links inside the children’s questions. "contact the church office" and "our pastors" pointed at the Wix contact page and now point at /contact; "the Children’s Ministry Church Coordination Team leader" pointed at a Wix profile page for a third name again (Michelle Heimlich) and now points at /staff, where the role is listed once.',
    'Joined: four Wix layout lines become one sentence. "Wednesdays During School Year" / "7:17 - 8:45 p.m." / "(FBCM Fellowship Hall/" / "Youth Center)" reads "Wednesdays during school year, 7:17 - 8:45 p.m. (FBCM Fellowship Hall / Youth Center)", and "Large Group Meeting" / "Every Sunday, 9:30-10:15 a.m." / "(FBCM Youth Center)" reads as one line the same way. The 7:17 is the church’s own and is kept exactly (fact 3 below).',
    'Joined: each room card in the Sunday schedule, whose label and sentence are two lines in the capture, becomes one line ("Nursery Care (104): For children ages 3 and younger...").',
    'Corrected: "Led by by Daniel Harris, the director of Charis student ministries" becomes "Led by Daniel Harris...".',
    'Cut as a repeat: "If you’re interested in joining a small group, or are seeking more information, contact adult[at]fbcmuncie.org". The adult band ends with the adult coordinator’s name, role and address, read off her staff document.',
    'Em-dash to comma (site style): "join Christ where he is already at work in our world—in Muncie and across the globe" becomes "...in our world, in Muncie and across the globe".',
    'Linked: "Our website has links to our building use policy here" had no link behind it on the Wix site. "here" now points at /wedding#building-use.',
    'Cut, five times over: "Get Involved / If you wish to be a part of our ... ministry, contact us!" appeared once per source page. The page says it once, as the "Get involved" band listing the whole Church Coordination Team.',
    'Re-pointed: "Our Church App." linked to a Wix page that is being retired and now links to the church’s Church Center; "The Visitor Quarterly" linked to the retired Wix publications page and now follows that page’s own redirect to /blog#publications.',
  ],

  // Facts this page had to force, because the church's own captures give two
  // answers for one room (ruling P20). Each one quotes both phrases with
  // file:line, so the person who knows the building can settle it by reading
  // the two lines rather than by walking the corridor. All four are about room
  // numbers, and all four come from the same two files carrying the same
  // ministry twice.
  confirm: [
    'The nursery and the family room, forced to 104 and 105. scripts/data/pages/what-to-expect.txt:53 says "Nursery Care (104)" and :57 says "Family Room (105)"; scripts/data/pages/children.txt:23 says "Nursery (Rm. 105) is available for infants through 3 years old." and :53 says "...are also welcome to use the Family Room (Rm. 104) to nurse, calm crying kids...". The same file then says the other thing at children.txt:33, "(Rm. 104) is available for infants through 3-year-olds." This page and /visit both say nursery 104, family room 105. Which is right?',
    'Worship Arts Sunday School: B-03 or B-01? scripts/data/pages/what-to-expect.txt:38 says "Children’s Worship Arts Play and practice in music, choir, scripture reading, and more (B-03)."; scripts/data/pages/children.txt:41 says "(Rm. B-01) involves our whole children’s ministry in music, art, and reading for spiritual formation."',
    'The Kids Center is given only once, at scripts/data/pages/children.txt:25: "Children Pre-K through 5th grade are invited to gather in the Kids Center (Rm. B01)...". Nothing else in the captures names that room, so there is nothing to check it against. Is B01 right, and is it the same room as B-01?',
    'The Underground: B-03 or B01? scripts/data/pages/what-to-expect.txt:69 says "3rd - 5th grade: The Underground Children’s Church (B-03)"; scripts/data/pages/children.txt:71 says "The Underground (Rm. B01) for 3rd through 5th graders."',
  ],

  // Bands with identifiable children in them, for the consent conversation.
  photoConsent: ['ministries-children', 'ministries-youth'],

  async build(ctx) {
    const { images, copy, settings, staff } = ctx;
    const { linesBetween, paragraphs, bullets, heading, ctaAnchor, ctaInternal, decodeEntities } =
      copy;

    if (!settings) {
      throw new Error(
        'ministries.mjs: siteSettings is not available. The Sunday schedule, the closing band ' +
          'and the newsletter links read the service time, the street and the Church Center ' +
          'address off it rather than retyping them.',
      );
    }
    if (!Array.isArray(staff) || staff.length === 0) {
      throw new Error(
        'ministries.mjs: no staffMember documents. Every coordinator on this page is DERIVED ' +
          'from them (CLAUDE.md rule 15); there is nothing to fall back on, on purpose.',
      );
    }

    // -- Facts, derived from settings ---------------------------------------
    const serviceTime = String(settings.serviceTime ?? '')
      .replace(/^Sundays at /i, '')
      .trim();
    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();

    // ── Reading the captures ────────────────────────────────────────────────

    /** The first line of `slug`.txt containing `phrase`, decoded and trimmed. */
    const line = (slug, phrase) => {
      const found = copy
        .textFile(slug)
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(
          `ministries.mjs: "${phrase}" is not in scripts/data/pages/${slug}.txt any more`,
        );
      }
      return decodeEntities(found).trim();
    };

    /**
     * The first non-empty line AFTER the first line containing `phrase`. The
     * Wix layout broke two of the youth schedule's sentences across four lines
     * each, and the tail of one of them ("Youth Center)") is a phrase that also
     * appears earlier in the same file, so it cannot be found by content.
     */
    const lineAfter = (slug, phrase) => {
      const lines = copy.textFile(slug).split(/\r?\n/);
      const at = lines.findIndex((l) => l.includes(phrase));
      if (at === -1) {
        throw new Error(
          `ministries.mjs: "${phrase}" is not in scripts/data/pages/${slug}.txt any more`,
        );
      }
      const next = lines.slice(at + 1).find((l) => l.trim());
      if (next === undefined) {
        throw new Error(
          `ministries.mjs: nothing follows "${phrase}" in scripts/data/pages/${slug}.txt`,
        );
      }
      return decodeEntities(next).trim();
    };

    /** The one line of `lines` containing `phrase`, decoded and trimmed. */
    const pick = (lines, phrase, slug) => {
      const hit = lines.filter((l) => l.includes(phrase));
      if (hit.length === 0) {
        throw new Error(
          `ministries.mjs: "${phrase}" is no longer in that span of scripts/data/pages/${slug}.txt`,
        );
      }
      return decodeEntities(hit[0]).trim();
    };

    /** Replace one phrase with another, throwing when the phrase has moved. */
    const swap = (sentence, find, replaceWith) => {
      if (!sentence.includes(find)) {
        throw new Error(
          `ministries.mjs: cannot edit "${find}": it is not in the sentence the capture now ` +
            'carries. Re-read the section before changing this.',
        );
      }
      return sentence.replace(find, replaceWith);
    };

    /** An em-dash between words becomes a comma (CLAUDE.md rule 2). Throws if there is none. */
    const comma = (sentence) => {
      if (!sentence.includes('—')) {
        throw new Error(
          `ministries.mjs: expected an em-dash to fix in "${sentence.slice(0, 60)}..."; ` +
            'the capture no longer has one, so drop this call.',
        );
      }
      return sentence.replace(/\s*—\s*/g, ', ');
    };

    /** The nursery / family room ruling, applied to one sentence (note 5 above). */
    const roomRuling = (sentence, find, replaceWith) => swap(sentence, find, replaceWith);

    // ── The coordinators, derived from the staff documents ──────────────────
    //
    // NOTHING HERE IS TYPED. `person()` finds the staffMember document whose
    // role matches, and throws when no document carries that role or when two
    // do: a page that silently dropped a coordinator's name would be worse
    // than a run that fails. Re-seeding after a staff change refreshes every
    // one of these lines, and the "Get involved" band below does not even need
    // that, because it is a staffGridSection resolved at BUILD time.
    const person = (role) => {
      const matches = staff.filter(
        (s) => String(s.role ?? '').toLowerCase() === role.toLowerCase(),
      );
      if (matches.length === 0) {
        throw new Error(
          `ministries.mjs: no staffMember document has the role "${role}". The contact lines on ` +
            'this page are derived from the staff documents, so the role has to exist there.',
        );
      }
      if (matches.length > 1) {
        throw new Error(
          `ministries.mjs: ${matches.length} staffMember documents carry the role "${role}" ` +
            `(${matches.map((m) => m.name).join(', ')}). One role, one person, or the page cannot ` +
            'say who to talk to.',
        );
      }
      const { name, email } = matches[0];
      // The email is a mailto link when the document carries one. When it does
      // not (today: the children's ministry), the line sends the reader to the
      // contact page instead of ending on a name with no way to reach it.
      return email
        ? `${name}, ${matches[0].role}, [${email}](mailto:${email})`
        : `${name}, ${matches[0].role}. [Contact the church office](/contact).`;
    };

    /**
     * One contact paragraph PER role, keyed for stability. Two names on one
     * line read as one person with two jobs, which the worship band would have
     * said about Cynthia Smith and Molly Flodder.
     */
    const contact = (roles, keyPrefix) => paragraphs(roles.map(person).join('\n\n'), keyPrefix);

    // -- Photos --------------------------------------------------------------
    // Three of the five ministry bands have a photograph in the manifest;
    // adults and outreach have none, so those two bands are richTextSections
    // rather than imageTextSections. A band with an empty image slot would
    // render as a half-width column of text beside nothing.
    const worshipTeam = await images.image('ministries-worship-team');
    const handbells = await images.image('ministries-handbells');
    const children = await images.image('ministries-children');
    const youth = await images.image('ministries-youth');
    for (const [key, img] of [
      ['ministries-worship-team', worshipTeam],
      ['ministries-handbells', handbells],
      ['ministries-children', children],
      ['ministries-youth', youth],
    ]) {
      if (!img) throw new Error(`ministries.mjs: no photo in the manifest for "${key}"`);
    }

    // ── 1. The Sunday schedule ──────────────────────────────────────────────
    // scripts/data/pages/what-to-expect.txt, the same capture /visit reads, so
    // the two pages cannot drift about what happens when. Each class is a
    // heading line followed by its description line in the capture; classLine()
    // pairs them off the file and throws if either has moved.
    const sundaySchoolLines = linesBetween('what-to-expect', 'Sunday School', 'Fellowship');

    const classLine = (head, { room = null, bodyContains = null } = {}) => {
      const at = sundaySchoolLines.findIndex((l) => l.includes(head));
      if (at === -1) {
        throw new Error(
          `ministries.mjs: "${head}" is no longer in the Sunday School section of ` +
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
        throw new Error(
          `ministries.mjs: "${head}" has no description line after it in the capture`,
        );
      }
      return `${head}${room ? ` ${room}` : ''}: ${decodeEntities(body).trim()}`;
    };

    const nineThirty = bullets(
      [
        // what-to-expect.txt lines 18 and 20.
        classLine('Intergenerational Bible Study (B-04)'),
        // lines 22 and 24.
        classLine('Friendship Class (B-05)'),
        // lines 26, 28 and 30: the room sits on its own line between the
        // heading and the sentence, so the label carries it and the finder
        // skips past it to the prose. The youth band below carries the same
        // meeting's other detail, the Youth Center, in the church's own words.
        classLine('Youth Large Group', { room: '(201)' }),
        // lines 32 and 38.
        classLine("Children's Sunday School (B-03 & 104)", { bodyContains: 'Worship Arts' }),
        // lines 34 and 36.
        '6 weeks - 3 years: Nursery (104)',
      ],
      'ss',
    );

    // what-to-expect.txt line 47.
    const tenFifteen = paragraphs(line('what-to-expect', 'and, of course, donuts'), 'dh');

    // what-to-expect.txt lines 53 to 69. The two rooms here are the ruling the
    // children band below is edited to agree with (note 5).
    const worshipRooms = [
      ...paragraphs(line('what-to-expect', 'will be dismissed to Children'), 'wr'),
      ...bullets(
        [
          `Nursery Care (104): ${line('what-to-expect', 'nursery care is available throughout the service')}`,
          `Family Room (105): ${line('what-to-expect', 'rocking chairs, nursing privacy')}`,
          line('what-to-expect', "Kickstart Children's Church"),
          line('what-to-expect', 'The Underground'),
        ],
        'wrb',
      ),
    ];

    // ── 2. Worship arts ─────────────────────────────────────────────────────
    // scripts/data/pages/worship.txt. The five jobs worship leaders do are one
    // line each in the capture and are set as the list they are.
    const worshipLeaderLines = linesBetween(
      'worship',
      'When we gather, worship leaders help us by:',
      'Praise Team & Instrumentalists',
    );
    const worshipJobs = worshipLeaderLines.map((l) => decodeEntities(l).trim()).filter(Boolean);
    if (worshipJobs.length !== 5) {
      throw new Error(
        'ministries.mjs: expected 5 things worship leaders do in scripts/data/pages/worship.txt, ' +
          `found ${worshipJobs.length}`,
      );
    }

    const worshipBody = [
      ...paragraphs(line('worship', 'Christian worship is a lifestyle'), 'wa-a'),
      ...paragraphs(line('worship', 'When we gather, worship leaders help us by:'), 'wa-b'),
      ...bullets(worshipJobs, 'wa-c'),
      ...paragraphs(line('worship', 'Our Praise Team consists of'), 'wa-d'),
      ...paragraphs(line('worship', 'hand bell choir'), 'wa-e'),
      // Derived (note 2). Re-seeding refreshes both names, roles and addresses.
      ...contact(['Worship Arts Director', 'Worship Coordinator'], 'wa-f'),
    ];

    // ── 3. Children ─────────────────────────────────────────────────────────
    // scripts/data/pages/children.txt, with the two room numbers forced to the
    // ruling (note 5) and the repeated nursery card cut.
    // The band is SPLIT IN TWO, and the measurement is the reason. Written as
    // one imageTextSection the children's material ran 3,804px tall beside a
    // 385px photograph: 3,400px of empty column, because the band lays image
    // and text out as two halves of one grid row. So the image band carries
    // what the church says its children's ministry IS, which is the length a
    // photograph can sit beside, and the room-by-room detail follows it as a
    // full-width text band at the page's own left edge. /children still lands
    // on the image band, so the redirect is unaffected.
    const childrenBody = [
      // The three things the church says its children's ministry is, lines 11,
      // 13 and 15, whole. The first sends the reader to the questions band,
      // which is directly below this one.
      ...paragraphs(line('children', 'Holistic and safe'), 'ch-a'),
      ...paragraphs(line('children', 'Age-appropriate'), 'ch-b'),
      ...paragraphs(line('children', 'Part of the life of the entire congregation'), 'ch-c'),

      ...contact(["Children's Ministry Coordinator"], 'ch-w'),
    ];

    const childrenRooms = [
      heading('Sunday school', 3, 'ch-h1'),
      ...paragraphs(line('children', '“Sunday School” refers to a time of small group'), 'ch-d'),
      ...bullets(
        [
          roomRuling(
            line('children', 'is available for infants through 3 years old'),
            'Nursery (Rm. 105)',
            'Nursery (Rm. 104)',
          ),
          line('children', 'Kids Center'),
        ],
        'ch-e',
      ),
      ...paragraphs(
        line('children', 'we emphasize one of four different spiritual habits'),
        'ch-f',
      ),
      ...paragraphs(line('children', 'hand bells, choir, and theater'), 'ch-g'),
      ...paragraphs(line('children', 'to enjoy breakfast at'), 'ch-h'),

      heading('Worship and children’s church', 3, 'ch-h2'),
      ...paragraphs(
        roomRuling(
          line('children', 'younger kids may be returned'),
          'Nursery (Rm. 105)',
          'Nursery (Rm. 104)',
        ),
        'ch-i',
      ),
      ...paragraphs(
        roomRuling(
          line('children', 'provides childcare throughout all of worship'),
          'Nursery (Rm. 105)',
          'Nursery (Rm. 104)',
        ),
        'ch-j',
      ),
      ...paragraphs(
        roomRuling(
          line('children', 'to nurse, calm crying kids'),
          'Family Room (Rm. 104)',
          'Family Room (Rm. 105)',
        ),
        'ch-k',
      ),
      ...paragraphs(line('children', 'we welcome preschool through 5th grade'), 'ch-l'),
      ...paragraphs(line('children', 'children will be invited to join their families'), 'ch-m'),
      ...bullets(
        [
          line('children', 'singing, clapping, and dancing'),
          line('children', 'reading and listening to holy Scripture'),
          line('children', 'praying'),
          line('children', 'participating in occasional'),
        ],
        'ch-n',
      ),
      ...paragraphs(line('children', 'a member of the FBC Muncie Leadership Team'), 'ch-o'),
      ...bullets(
        [line('children', 'Kickstart (Rm. 102)'), line('children', 'The Underground (Rm. B01)')],
        'ch-p',
      ),
      ...paragraphs(
        line('children', 'adults will have the opportunity to hear the sermon'),
        'ch-q',
      ),
      ...paragraphs(line('children', 'engaging with the Bible story'), 'ch-r'),
      ...paragraphs(line('children', 'parents will take their security tag'), 'ch-s'),

      // Seasonal events, with no dates (note 6).
      heading('Through the year', 3, 'ch-h3'),
      ...paragraphs(line('children', 'Several children’s events are planned'), 'ch-t'),
      ...paragraphs(line('children', 'Examples of special events'), 'ch-u'),
      ...bullets(
        [
          line('children', 'Vacation Bible School (VBS)'),
          line('children', "Parent's Night Out"),
          line('children', 'Family Service opportunities'),
          line('children', 'Trunk or Treat'),
          line('children', 'Operation Christmas Child'),
        ],
        'ch-v',
      ),
    ];

    // ── 4. Youth ────────────────────────────────────────────────────────────
    // scripts/data/pages/youth.txt. The two schedule blocks are each four Wix
    // layout lines and are joined back into one sentence apiece.
    const otherYouthLines = linesBetween('youth', 'Other Youth Events Include', 'Get Involved');
    const otherYouth = otherYouthLines.map((l) => decodeEntities(l).trim()).filter(Boolean);
    if (otherYouth.length !== 6) {
      throw new Error(
        'ministries.mjs: expected 6 other youth events in scripts/data/pages/youth.txt, found ' +
          otherYouth.length,
      );
    }

    const youthBody = [
      ...paragraphs(line('youth', 'students grades 6-12'), 'yo-a'),

      heading('Large group meeting', 3, 'yo-h1'),
      ...paragraphs(
        `${line('youth', 'Every Sunday, 9:30-10:15 a.m.')} ${line('youth', '(FBCM Youth Center)')}`,
        'yo-b',
      ),
      ...paragraphs(line('youth', 'Our main teaching time'), 'yo-c'),
      ...paragraphs(line('youth', 'Donut (Semi) Hour'), 'yo-d'),

      heading('City Life Club', 3, 'yo-h2'),
      // The 7:17 is the church's own and is kept (note 7).
      ...paragraphs(
        [
          `${line('youth', 'Wednesdays During School Year').replace('During School Year', 'during school year')},`,
          line('youth', '7:17 - 8:45 p.m.'),
          // "(FBCM Fellowship Hall/" and "Youth Center)" are two lines of one
          // parenthesis, and the second is found by POSITION because the same
          // words appear earlier in the file as the Youth Center's own line.
          `${line('youth', '(FBCM Fellowship Hall/')}${lineAfter('youth', '(FBCM Fellowship Hall/')}`.replace(
            'Hall/Youth',
            'Hall / Youth',
          ),
        ].join(' '),
        'yo-e',
      ),
      ...paragraphs(line('youth', 'All students grades 6 - 12 are welcome'), 'yo-f'),
      ...paragraphs(line('youth', 'We begin with a meal'), 'yo-g'),
      ...paragraphs(line('youth', 'fun and games and end with a Bible study'), 'yo-h'),

      heading('Other youth events', 3, 'yo-h3'),
      ...bullets(otherYouth, 'yo-i'),

      ...contact(['Youth Coordinator'], 'yo-j'),
    ];

    // ── 5. Adults ───────────────────────────────────────────────────────────
    // scripts/data/pages/adult.txt. No photograph in the manifest for adults,
    // so this band is a richTextSection (see the photo note above).
    const lifeGroupLines = linesBetween('adult', 'Life Groups', 'Fellowship And Other Events');
    const lifeGroups = lifeGroupLines
      .map((l) => decodeEntities(l).trim())
      .filter((l) => l.includes(' | '));
    if (lifeGroups.length !== 5) {
      throw new Error(
        'ministries.mjs: expected 5 life groups in scripts/data/pages/adult.txt, found ' +
          lifeGroups.length,
      );
    }

    const adultBody = [
      ...paragraphs(line('adult', 'From College and Career to Retirees'), 'ad-a'),

      heading('Sunday morning', 3, 'ad-h1'),
      ...paragraphs(line('adult', 'there are classes for Adults'), 'ad-b'),
      ...bullets(
        [
          line('adult', 'Friendship Class taught by'),
          line('adult', 'Intergenerational Bible Study class'),
        ],
        'ad-c',
      ),

      heading('Life Groups', 3, 'ad-h2'),
      ...paragraphs(line('adult', 'various Life groups that meet in set seasons'), 'ad-d'),
      ...paragraphs(line('adult', 'several life groups which meet at various days'), 'ad-e'),
      ...bullets(
        lifeGroups.map((g) => (g.includes('Led by by') ? swap(g, 'Led by by', 'Led by') : g)),
        'ad-f',
      ),

      heading('Fellowship and other events', 3, 'ad-h3'),
      heading(line('adult', 'Fresh Brewed Life'), 4, 'ad-h4'),
      ...paragraphs(line('adult', 'breakfast and hospitality for women'), 'ad-g'),
      heading(line('adult', 'Church Friends Lunch'), 4, 'ad-h5'),
      ...paragraphs(line('adult', 'post-worship luncheons'), 'ad-h'),
      heading(line('adult', 'Service Trips'), 4, 'ad-h6'),
      ...paragraphs(line('adult', 'All church trips for service and worship'), 'ad-i'),

      ...contact(['Adult Coordinator'], 'ad-j'),
    ];

    // ── 6. Outreach ─────────────────────────────────────────────────────────
    // scripts/data/pages/outreach.txt, the shortest of the five sources at 149
    // words, and whole. No photograph in the manifest for outreach either.
    const outreachLines = linesBetween(
      'outreach',
      'Ways You Can Connect With FBCM to serve our community',
      'Get Involved',
    );
    const outreachWays = outreachLines.map((l) => decodeEntities(l).trim()).filter(Boolean);
    if (outreachWays.length !== 4) {
      throw new Error(
        'ministries.mjs: expected 4 ways to connect in scripts/data/pages/outreach.txt, found ' +
          outreachWays.length,
      );
    }

    const outreachBody = [
      // Their own opening sentence, with its em-dash made a comma.
      ...paragraphs(comma(line('outreach', 'join Christ where he is already at work')), 'ou-a'),
      heading(line('outreach', 'Ways You Can Connect With FBCM'), 3, 'ou-h1'),
      ...bullets(
        outreachWays.map((w) =>
          w.includes('building use policy')
            ? swap(w, 'policy here.', 'policy [here](/wedding#building-use).')
            : w,
        ),
        'ou-c',
      ),
      ...contact(['Outreach Coordinator'], 'ou-d'),
    ];

    // ── 7. Stay updated ─────────────────────────────────────────────────────
    // adult.txt's "Stay Updated" section, which is about every ministry and not
    // only the adult one, so it sits at the foot of the page beside the people
    // to talk to. Two of its three links pointed at Wix pages that are being
    // retired; the hrefs are the church's own where the destination survives
    // (scripts/data/pages/adult.json, links, region "main") and the church's
    // own Church Center address off Site settings where it does not.
    const churchCenter = String(settings.churchCenterUrl ?? '').trim();
    if (!churchCenter) {
      throw new Error(
        'ministries.mjs: siteSettings.churchCenterUrl is empty. The church app link on the ' +
          '"Stay updated" band is read off it rather than retyped.',
      );
    }
    const stayUpdated = [
      heading('Stay updated', 3, 'su-h1'),
      ...paragraphs(line('adult', 'many ways to get the latest information'), 'su-a'),
      ...bullets(
        [
          `[${line('adult', 'Wednesday Weekly')}](https://fbcmuncie.churchcenter.com/pages/fbcs-wednesday-weekly)`,
          `[${line('adult', 'The Visitor Quarterly')}](/blog#publications)`,
          `[${line('adult', 'Our Church App.')}](${churchCenter})`,
        ],
        'su-b',
      ),
    ];

    // ── The children's questions ────────────────────────────────────────────
    const childrenFaq = readChildrenFaq(copy);

    return {
      title: 'Ministries',
      slug: { _type: 'slug', current: 'ministries' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero. The worship team on the right, and the two doors most
        //    visitors arrive through on the left.
        {
          _type: 'heroSection',
          _key: 'ministries-hero',
          layout: 'split',
          size: 'short',
          eyebrow: 'Ministries',
          headline: 'Every age has a place here.',
          frames: [{ ...worshipTeam, _key: 'frame-1' }],
          primaryCta: ctaAnchor('Children', '/ministries#children'),
          secondaryCta: ctaAnchor('Adults', '/ministries#adult'),
        },

        // 2. One Sunday, every age, in one place. The same capture /visit
        //    reads, so the two pages cannot disagree about the morning.
        {
          _type: 'timelineSection',
          _key: 'ministries-sunday',
          eyebrow: 'Sunday',
          heading: 'A Sunday for every age',
          rows: [
            {
              _type: 'timelineRow',
              _key: 'row-1',
              // what-to-expect.txt line 16: "9:30 - 10:15".
              marker: '9:30 am',
              title: 'Sunday school and Bible study',
              body: nineThirty,
            },
            {
              _type: 'timelineRow',
              _key: 'row-2',
              // what-to-expect.txt line 42: "10:15 - 10:40".
              marker: '10:15 am',
              title: 'Donut hour',
              body: tenFifteen,
            },
            {
              _type: 'timelineRow',
              _key: 'row-3',
              // From Site settings, not retyped (rule 15). The capture agrees:
              // what-to-expect.txt line 51, "10:45 (Sanctuary)".
              marker: serviceTime,
              title: "Worship, children's church and nursery",
              body: worshipRooms,
            },
          ],
        },

        // 3. Worship arts. Where /worship lands.
        {
          _type: 'imageTextSection',
          _key: 'ministries-worship',
          anchor: { _type: 'slug', current: 'worship' },
          image: handbells,
          imageSide: 'right',
          eyebrow: 'Worship arts',
          heading: 'Praise team, instruments and handbells',
          body: worshipBody,
        },

        // 4. Children. Where /children lands.
        {
          _type: 'imageTextSection',
          _key: 'ministries-children',
          anchor: { _type: 'slug', current: 'children' },
          image: children,
          imageSide: 'left',
          eyebrow: 'Children',
          heading: 'Nursery through fifth grade',
          body: childrenBody,
        },

        // 5. The rooms, in their own words, at the page's own left edge (see
        //    the note by childrenRooms above).
        {
          _type: 'richTextSection',
          _key: 'ministries-children-rooms',
          heading: 'Sunday, room by room',
          body: childrenRooms,
        },

        // 6. The five questions parents ask, verbatim, with their links
        //    re-pointed at pages that exist.
        {
          _type: 'faqSection',
          _key: 'ministries-children-faq',
          eyebrow: 'Children',
          heading: 'Questions parents ask',
          items: childrenFaq,
        },

        // 7. Youth. Where /youth lands.
        {
          _type: 'imageTextSection',
          _key: 'ministries-youth',
          anchor: { _type: 'slug', current: 'youth' },
          image: youth,
          imageSide: 'right',
          eyebrow: 'Youth',
          heading: 'Grades 6 to 12',
          body: youthBody,
        },

        // 8. Adults. Where /adult lands. A text band, not an image band: the
        //    manifest has no adult photograph (see the photo note above).
        {
          _type: 'richTextSection',
          _key: 'ministries-adult',
          anchor: { _type: 'slug', current: 'adult' },
          eyebrow: 'Adults',
          heading: 'Sunday classes, Life Groups and more',
          body: adultBody,
        },

        // 9. Outreach. Where /outreach lands. A text band for the same reason.
        {
          _type: 'richTextSection',
          _key: 'ministries-outreach',
          anchor: { _type: 'slug', current: 'outreach' },
          eyebrow: 'Outreach',
          heading: 'Joining Christ where he is already at work',
          body: outreachBody,
        },

        // 10. Get involved, once, for the whole Church Coordination Team. This
        //    band is LIVE-derived: the query behind staffGridSection reads the
        //    staffMember documents at build time, so a new coordinator appears
        //    on the next deploy without this page being re-seeded at all.
        {
          _type: 'staffGridSection',
          _key: 'ministries-team',
          eyebrow: 'Get involved',
          heading: 'The people to talk to',
          group: 'coordination',
          showBios: false,
        },

        // 11. The newsletters and the app, once, for every ministry.
        {
          _type: 'richTextSection',
          _key: 'ministries-stay-updated',
          body: stayUpdated,
        },

        // 12. Closing band, both buttons, subhead built from Site settings.
        {
          _type: 'ctaBandSection',
          _key: 'ministries-cta',
          eyebrow: 'Come and see',
          headline: 'Find your place.',
          subhead: `${settings.serviceTime}. ${streetLine}.`,
          cta: ctaInternal('Plan a visit', 'visit'),
          secondaryCta: ctaInternal('Contact us', 'contact'),
        },
      ],

      seoTitle: 'Ministries | First Baptist Church Muncie',
      seoDescription:
        'Worship arts, children, youth, adults and outreach at First Baptist Church Muncie: Sunday school at 9:30 am, worship at 10:45 am, and the person to talk to about each one.',
    };
  },
};

/**
 * The five "Children FAQ" questions from scripts/data/pages/faq-entries.json,
 * in their sortOrder, each answer verbatim with its links folded back in as the
 * inline [text](href) syntax paragraphs() understands.
 *
 * Two edits, both declared in `edits` above: CCT is spelled out, and the three
 * hrefs are re-pointed at pages this site has. The Wix profile page the third
 * link went to named a THIRD person for the children's ministry role, which is
 * exactly the conflict the staff documents settle, so it points at /staff.
 */
function readChildrenFaq(copy) {
  const data = JSON.parse(readFileSync(FAQ_PATH, 'utf8'));
  const entries = (data.entries ?? [])
    .filter((e) => e.categoryId === CHILDREN_FAQ_CATEGORY)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (entries.length !== 5) {
    throw new Error(
      `ministries.mjs: expected 5 "Children FAQ" questions in faq-entries.json, found ${entries.length}`,
    );
  }

  // Wix href -> the page on this site that answers the same question.
  const REPOINT = {
    'https://fbcmuncie.org/contact': '/contact',
    'https://fbcmuncie.org/team/michelle-heimlich': '/staff',
  };

  return entries.map((entry, i) => {
    let answer = String(entry.answer);
    for (const l of entry.links ?? []) {
      if (!answer.includes(l.text)) {
        throw new Error(
          `ministries.mjs: the link text "${l.text}" is no longer in its answer in faq-entries.json`,
        );
      }
      const href = REPOINT[l.url];
      if (!href) {
        throw new Error(
          `ministries.mjs: the children's FAQ link "${l.text}" points at ${l.url}, which has no ` +
            'destination on this site. Add it to REPOINT, with a reason.',
        );
      }
      answer = answer.replace(l.text, `[${l.text}](${href})`);
    }
    // CCT, spelled out on the one line of this page that still carries it.
    answer = answer.replace(
      "the Children's Ministry CCT Leader",
      "the Children's Ministry Church Coordination Team leader",
    );
    return {
      _type: 'faqItem',
      _key: `q-${i + 1}`,
      question: entry.question,
      answer: copy.paragraphs(answer.trim(), `a${i + 1}`),
    };
  });
}
