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
// THE FIVE MINISTRY BANDS ARE NOT COMPOSED HERE ANY MORE (2026-09-22). They
// are "Ministry" bands pointing at the five ministry documents, which own the
// words; scripts/connect-ministries.mjs moved them there. The notes below still
// describe how those words were cut from the captures, because that is what
// the church is asked to approve.
//
// 1. EVERY PARAGRAPH IS READ OFF A CAPTURE, NEVER TYPED FROM MEMORY. line()
//    and linesBetween() THROW when an anchor phrase moves, so a band that
//    would have seeded empty, or half-empty, fails the run instead.
//
// 2. THE COORDINATORS ARE DERIVED FROM THE STAFF DOCUMENTS (CLAUDE.md rule
//    15). Not one name, role or address on this page is typed here. Each
//    ministry band's contact lines are generated at BUILD time from the
//    people its ministry document names (since 2026-09-22; before that they
//    were typed here at seed time, see "The five ministry bands" below). This also
//    settles the children's-ministry name conflict the content map flagged:
//    the Wix page said Jennifer Durke, the staff table says Jaden Johnson, and
//    this page says whatever the staff document says, once.
//
// 3. "GET INVOLVED" APPEARS ONCE. It was on all five source pages, five times,
//    with five different people under it. Here it is one band of ways in
//    (note 9), and each ministry band ends with the one person to talk to
//    about that ministry.
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
//
// THE CHURCH IDENTITY PASS (2026-09-24, rollout step 6: "the four goals as the
// organising motif; Ministry bands under the four goals"). Three changes here,
// and one that is not here at all:
//
//   - The hero is the window: three lights, every age (the palm-branch
//     children, the youth room, two musicians), photos no other page uses.
//     The worship-team photo it replaces is Who We Are's worship singer.
//   - No decorative small lines: the hero's "Ministries" and the timeline's
//     "Sunday" only repeated the menu and the heading (rollout rule 11).
//   - The two children's-church lines in the 10:45 row are written as class
//     lines, "Kickstart Children's Church (102): Preschool - 2nd grade", so
//     the timeline reads each as a class with its room, as /visit's board
//     does, instead of as more lines about the Family Room (declared in
//     `edits`).
//   - THE GOALS ARE NOT COMPOSED HERE. Which goal a ministry serves is the
//     optional "Goal it serves" on the ministry document, and the goal index
//     in front of the first Ministry band is derived from those at build time
//     (src/lib/ministry-goals.ts). scripts/set-ministry-goals.mjs writes the
//     answers the church's own words give; the rest wait for the church.
//
// 8. THE HERO CARRIES THE PAGE'S INDEX (2026-09-25, Nathan: the hero "feels a
//    bit empty"). The lede is the church's own sentence off children.txt
//    ("FBC Muncie believes that God created the church to be
//    intergenerational."), under the headline it answers. The three facts are
//    the age bands: each LABEL is a Ministry band's own small line (Children,
//    Youth, Adults, read off the ministry documents) and each VALUE the age
//    range the church states (the children's and youth documents' headlines;
//    the adult range off adult.txt's "From College and Career to Retirees").
//    No fact types a link: Hero derives it, because a fact named like a band
//    on the page jumps to that band (src/lib/hero-fact-links.ts), and HeroFacts
//    sets linked facts as ruled index rows. The two buttons became "Get
//    involved" (the band below, #get-involved) and "What's On" (/events):
//    Children and Adults are now two of the three facts.
//
// 9. "GET INVOLVED" IS WAYS IN, NOT A STAFF GRID (2026-09-25, Nathan: the
//    whole Church Coordination Team, moderator and treasurer included, did
//    not help someone who wants to get involved, and it is on /staff). It is
//    a Text band last before the gold band: six h3 columns (rich-shape.ts
//    columns, each at most 40 words so all six set at one size), each the
//    church's own description of the work and ONE next step, the role
//    address the church publishes for it. Every address is read off the
//    capture that prints it and must also be on a Staff document, or the run
//    throws. They are ROLE mailboxes (worship@, youth@...), which stay with
//    the role when the person changes; a Staff page's address changing is
//    the one case a re-seed is needed, and the throw says so. The children's
//    coordinator has no address, so that step is the church office. A foot
//    line sends membership, baptism and a pastor to the connection card on
//    /visit (#connect). No ministry is invented: every column is a thing the
//    church's own pages ask people to do.

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
    'Worship arts, children, youth, adults and outreach at First Baptist Church Muncie: Sunday school at 9:30 am, worship at 10:45 am, and who to ask about each. (search description, not shown on the page; 2026-09-24 local search pass)',
    'Contact the church office. (the end of a ministry’s contact line when the staff document for that role carries no email address, which today is only the children’s ministry; it links to the contact page. Also the next step under "Help with children" in Get involved, 2026-09-25)',
    'Get involved (the hero’s gold button, to the Get involved band; "Get Involved" is the heading all five source pages used) / What’s On (the hero’s second button, to /events; the calendar page’s own name) (2026-09-25)',
    'Serve on Sunday / Sing and play / Help with children / Help with youth / Join a Life Group / Serve our community (the six column heads in Get involved, 2026-09-25; "Join a Life Group" and "Serve our community" lean on the church’s own "Life Groups" and "Ways You Can Connect With FBCM to serve our community")',
    'Write to worship@fbcmuncie.org. (and the same "Write to" line for cynthia@, youth@ and outreach@: the next step under four Get involved columns, 2026-09-25)',
    'To become a member, be baptized or speak with a pastor, use the connection card. (the last line of Get involved, linking to the connection card on /visit, 2026-09-25)',
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
    'Cut, five times over: "Get Involved / If you wish to be a part of our ... ministry, contact us!" appeared once per source page. The page says it once, as the "Get involved" band of ways in (note 9); the Church Coordination Team is listed on /staff.',
    'Reordered, so each reads as a class with its room: "Preschool - 2nd grade: Kickstart Children’s Church (102)" becomes "Kickstart Children’s Church (102): Preschool - 2nd grade", and "3rd - 5th grade: The Underground Children’s Church (B-03)" becomes "The Underground Children’s Church (B-03): 3rd - 5th grade" (what-to-expect.txt lines 65 and 69; the 10:45 row of the Sunday timeline). No word changes.',
    'Hero lede (2026-09-25): "FBC Muncie believes that God created the church to be intergenerational." is the middle sentence of children.txt’s "Part of the life of the entire congregation." paragraph, on its own.',
    'Hero facts (2026-09-25): "Nursery through fifth grade" and "Grades 6 to 12" are the Children and Youth ministry documents’ own headlines; "College and career to retirees" is adult.txt’s "From College and Career to Retirees", cut to the range and set in sentence case.',
    'Get involved, the opening line (2026-09-25): worship.txt’s "If you wish to be a part of our ministry on Sunday mornings, contact us!" with "on Sunday mornings" cut, said once for every ministry.',
    'Get involved, Serve on Sunday: worship.txt’s "When we gather, worship leaders help us by:" and four of its five list items (Greeting people as they enter, Supporting through technical arts (sound, slides, livestream, etc.), Leading in prayer & scripture reading, Serving communion) joined into one sentence, each item’s first letter lower-cased. "Singing and playing a variety of instruments" is left to the next column.',
    'Get involved, Sing and play: worship.txt’s Praise Team sentence and its hand bell choir sentence, unchanged, side by side.',
    'Get involved, Help with children: children.txt’s "To create a safe environment for our children, FBC Muncie requires that all Children’s Ministry volunteers be background checked and children can only be picked up by a parent/guardian with a matching security tag." cut after "background checked." (the pick-up half is in the children’s questions above).',
    'Get involved, Help with youth: youth.txt’s "Pastor Jonathan and Kendall, alongside a youth volunteer, open up scripture and discuss how God’s work intersects with student’s lives." unchanged ("student’s" is the church’s own).',
    'Get involved, Join a Life Group: adult.txt’s "We have several life groups..." sentence, and its "If you’re interested in joining a small group, or are seeking more information, contact adult[at]fbcmuncie.org" with the address restored and linked and a full stop added. (The adult band still does not repeat it.)',
    'Get involved, Serve our community: outreach.txt’s "Volunteering with our partner organizations or at community events." and "Sewing Group (Rm 203) - A multi-aged, monthly group which sews pillowcases for those in need." with the hyphen made a colon and "A" lower-cased.',
    'Re-pointed: "Our Church App." linked to a Wix page that is being retired and now links to the church’s Church Center; "The Visitor Quarterly" linked to the retired Wix publications page and now links to The Visitor’s own page, /visitor (the Wix page’s redirect points there too since 2026-09-24).',
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
  // The children's band photo lives on the ministry-children document (set by
  // scripts/place-ministry-photos.mjs); ministry-children-vbs is its manifest record.
  photoConsent: [
    'ministry-children-vbs',
    'ministries-youth',
    'ministries-hero-palms',
    'ministries-hero-youth',
  ],

  async build(ctx) {
    const { images, copy, settings, ministries, staff } = ctx;
    const { linesBetween, paragraphs, bullets, heading, ctaAnchor, ctaInternal, decodeEntities } =
      copy;

    if (!settings) {
      throw new Error(
        'ministries.mjs: siteSettings is not available. The Sunday schedule, the closing band ' +
          'and the newsletter links read the service time, the street and the Church Center ' +
          'address off it rather than retyping them.',
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

    /** The nursery / family room ruling, applied to one sentence (note 5 above). */
    const roomRuling = (sentence, find, replaceWith) => swap(sentence, find, replaceWith);

    // -- Photos --------------------------------------------------------------
    // Only the hero's three lights are the page's own. The ministry bands draw
    // their photographs from the ministry documents (see ministryBand below).
    // The focal point is set here because the library carries no hotspot and
    // the window's lights are tall crops of these.
    // Kept inside the frame so the Studio accepts it (home.mjs's rule).
    const hotspot = (x, y) => {
      const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
      return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
    };
    const photo = async (key, x, y) => {
      const img = await images.image(key);
      if (!img) throw new Error(`ministries.mjs: no photo in the manifest for "${key}"`);
      return { ...img, hotspot: hotspot(x, y) };
    };
    // The middle light is the widest and tallest, so it goes first (Hero.astro's
    // window): the palm-branch children, the one portrait of the three. The
    // youth room and the musicians are landscapes, cropped to the side lights.
    const heroYouth = await photo('ministries-hero-youth', 0.78, 0.3);
    const heroPalms = await photo('ministries-hero-palms', 0.5, 0.55);
    const heroMusicians = await photo('ministries-hero-musicians', 0.42, 0.5);

    // ── The five ministry bands, POINTERS to the ministry documents ─────────
    //
    // Since 2026-09-22 (CLAUDE.md rule 15) each ministry's small line,
    // headline, photo, text and people to talk to live on its `ministry`
    // document, and the band on this page is a ministrySection that only points
    // at it. The contact lines are generated at BUILD time from the people the
    // document names (src/lib/ministry-band.ts), so they cannot go stale the
    // way the lines this module used to type did.
    //
    // This module composed those five texts from the Wix captures until then
    // (git history before that date has every line() call, and the `edits`
    // above still describe what was done to the church's words on the way).
    // scripts/connect-ministries.mjs moved them into the documents, and the
    // Studio owns them now. So a re-seed writes the same five pointers the
    // migration wrote, and REFUSES while any of the five documents is not yet
    // connected: pointing a band at a document still holding the unedited Wix
    // text would publish that text over the page.
    const ministryBand = (key, anchor, id, imageSide) => {
      const doc = (ministries ?? []).find((m) => m._id === id);
      if (!doc) {
        throw new Error(
          `ministries.mjs: no ministry document "${id}" to point the ${key} band at.`,
        );
      }
      if (!doc.headline || !Array.isArray(doc.contacts) || doc.contacts.length === 0) {
        throw new Error(
          `ministries.mjs: ${id} has not been connected yet (no headline or no people to talk to). ` +
            'Run node scripts/connect-ministries.mjs first; re-seeding before it would show the ' +
            'old Wix text on the page.',
        );
      }
      return {
        _type: 'ministrySection',
        _key: key,
        ministry: { _type: 'reference', _ref: id },
        ...(imageSide ? { imageSide } : {}),
        anchor: { _type: 'slug', current: anchor },
      };
    };

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

    // "3rd - 5th grade: The Underground Children's Church (B-03)" -> the class
    // first, "The Underground Children's Church (B-03): 3rd - 5th grade", the
    // shape Timeline reads as a class with its room (see `edits`). Throws if
    // the capture's line stops being "ages: name (room)".
    const classFirst = (sentence) => {
      const m = sentence.match(/^([^:]+):\s*(.+\([^()]+\))$/);
      if (!m) {
        throw new Error(
          `ministries.mjs: "${sentence}" is no longer "ages: class (room)"; re-read ` +
            'what-to-expect.txt before reordering it.',
        );
      }
      return `${m[2].trim()}: ${m[1].trim()}`;
    };

    // what-to-expect.txt lines 53 to 69. The two rooms here are the ruling the
    // children band below is edited to agree with (note 5).
    const worshipRooms = [
      ...paragraphs(line('what-to-expect', 'will be dismissed to Children'), 'wr'),
      ...bullets(
        [
          `Nursery Care (104): ${line('what-to-expect', 'nursery care is available throughout the service')}`,
          `Family Room (105): ${line('what-to-expect', 'rocking chairs, nursing privacy')}`,
          classFirst(line('what-to-expect', "Kickstart Children's Church")),
          classFirst(line('what-to-expect', 'The Underground')),
        ],
        'wrb',
      ),
    ];

    // ── 3. Children: the rooms ──────────────────────────────────────────────
    // scripts/data/pages/children.txt, with the two room numbers forced to the
    // ruling (note 5) and the repeated nursery card cut.
    // The children's material is SPLIT IN TWO, and the measurement is the
    // reason. Written as one image band it ran 3,804px tall beside a 385px
    // photograph. So the Children ministry band carries what the church says its
    // children's ministry IS, and the room-by-room detail follows it here as a
    // full-width text band at the page's own left edge. /children still lands on
    // the ministry band, so the redirect is unaffected.
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

    // ── 7. Stay updated ─────────────────────────────────────────────────────
    // adult.txt's "Stay Updated" section, which is about every ministry and not
    // only the adult one, so it sits at the foot of the page beside the people
    // to talk to. Two of its three links pointed at Wix pages that are being
    // retired; the hrefs are the church's own where the destination survives
    // (scripts/data/pages/adult.json, links, region "main") and the church's
    // Site settings' link tokens where it does not: {wednesday} (hidden while
    // Church Trac has no Wednesday page) and {app}, the church app (Church
    // Trac's, 2026-09-26; it was Church Center's).
    const stayUpdated = [
      heading('Stay updated', 3, 'su-h1'),
      ...paragraphs(line('adult', 'many ways to get the latest information'), 'su-a'),
      ...bullets(
        [
          `[${line('adult', 'Wednesday Weekly')}]({wednesday})`,
          `[${line('adult', 'The Visitor Quarterly')}](/visitor)`,
          `[${line('adult', 'Our Church App.')}]({app})`,
        ],
        'su-b',
      ),
    ];

    // ── The hero's lede and facts (note 8) ──────────────────────────────────
    /** The one sentence of `slug`.txt that contains `phrase`, throwing if it moved. */
    const sentence = (slug, phrase) => {
      const found = line(slug, phrase)
        .split(/(?<=[.!?])\s+/)
        .find((s) => s.includes(phrase));
      if (!found) {
        throw new Error(`ministries.mjs: no sentence with "${phrase}" in ${slug}.txt`);
      }
      return found.trim();
    };
    // children.txt, "Part of the life of the entire congregation." paragraph.
    const heroLede = sentence('children', 'God created the church to be intergenerational');

    /** A ministry document's own headline, the age range it states. */
    const ministryHeadline = (id) => {
      const doc = (ministries ?? []).find((m) => m._id === id);
      const value = String(doc?.headline ?? '').trim();
      if (!value) throw new Error(`ministries.mjs: ${id} has no headline for the hero's facts.`);
      return value;
    };
    // adult.txt: "From College and Career to Retirees, FBCM's Adult Ministry ...".
    // The adult document's headline names classes, not ages, so the age range
    // is read off the church's own sentence and set in sentence case (`edits`).
    const adultAges = (() => {
      const m = sentence('adult', 'From College and Career to Retirees').match(
        /^From (College and Career) to (Retirees),/,
      );
      if (!m) throw new Error('ministries.mjs: the adult age range has moved in adult.txt.');
      return `${m[1][0]}${m[1].slice(1).toLowerCase()} to ${m[2].toLowerCase()}`;
    })();
    // Each label is the small line (eyebrow) of a Ministry band on this page:
    // "Children", "Youth", "Adults". The link to the band is derived from it.
    const eyebrowOf = (id) => {
      const doc = (ministries ?? []).find((m) => m._id === id);
      const value = String(doc?.eyebrow ?? '').trim();
      if (!value) throw new Error(`ministries.mjs: ${id} has no small line to label its fact.`);
      return value;
    };
    const heroFacts = [
      ['ministry-children', ministryHeadline('ministry-children')],
      ['ministry-youth', ministryHeadline('ministry-youth')],
      ['ministry-adult', adultAges],
    ].map(([id, value], i) => ({
      _type: 'heroFact',
      _key: `fact-${i + 1}`,
      label: eyebrowOf(id),
      value,
    }));

    // ── Get involved (note 9) ───────────────────────────────────────────────
    // Six ways in, each the church's own description of the work and ONE next
    // step. Every address is read off the capture that publishes it ("[at]"
    // restored to "@") and must be on a Staff document too, or the run throws:
    // a role address the Staff pages no longer carry must not be printed here.
    const address = (slug, local) => {
      const raw = line(slug, `${local}[at]fbcmuncie.org`);
      const found = raw.match(new RegExp(`\\b${local}\\[at\\]fbcmuncie\\.org`));
      if (!found) throw new Error(`ministries.mjs: ${local}[at] is not in ${slug}.txt`);
      const email = found[0].replace('[at]', '@');
      if (!(staff ?? []).some((p) => String(p.email ?? '').trim() === email)) {
        throw new Error(
          `ministries.mjs: ${email} (${slug}.txt) is on no Staff document; check who holds the role.`,
        );
      }
      return email;
    };
    const writeTo = (email) => `Write to [${email}](mailto:${email}).`;
    const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

    // worship.txt: "When we gather, worship leaders help us by:" and its list.
    // "Singing and playing" is the next column's.
    const sundayRoles = [
      line('worship', 'Greeting people as they enter'),
      line('worship', 'Supporting through technical arts'),
      line('worship', 'Leading in prayer & scripture reading'),
      line('worship', 'Serving communion'),
    ].map(lowerFirst);
    const serveOnSunday = `${line('worship', 'worship leaders help us by').replace(/:$/, '')} ${sundayRoles
      .slice(0, -1)
      .join(', ')} and ${sundayRoles.at(-1)}.`;

    const children1 = swap(
      sentence('children', 'volunteers be background checked'),
      'be background checked and children can only be picked up by a parent/guardian with a matching security tag.',
      'be background checked.',
    );

    const getInvolved = [
      // worship.txt, the Get Involved line, said once for every ministry.
      ...paragraphs(
        swap(
          line('worship', 'If you wish to be a part of our ministry'),
          ' on Sunday mornings',
          '',
        ),
        'gi-a',
      ),
      heading('Serve on Sunday', 3, 'gi-h1'),
      ...paragraphs(serveOnSunday, 'gi-b'),
      ...paragraphs(writeTo(address('worship', 'worship')), 'gi-c'),

      heading('Sing and play', 3, 'gi-h2'),
      ...paragraphs(
        `${sentence('worship', 'Our Praise Team consists of')} ${sentence('worship', 'our hand bell choir, always looking for new members')}`,
        'gi-d',
      ),
      ...paragraphs(writeTo(address('worship', 'cynthia')), 'gi-e'),

      heading('Help with children', 3, 'gi-h3'),
      ...paragraphs(
        // One sentence, so the column stays at the others' size (rich-shape.ts
        // sets a column in the large face only up to 40 words).
        children1,
        'gi-f',
      ),
      // The children's coordinator's Staff document has no address, so this
      // is the one step that goes to the office (the same line the children's
      // Ministry band ends with, already in newCopy).
      ...paragraphs('[Contact the church office.](/contact)', 'gi-g'),

      heading('Help with youth', 3, 'gi-h4'),
      ...paragraphs(sentence('youth', 'alongside a youth volunteer'), 'gi-h'),
      ...paragraphs(writeTo(address('youth', 'youth')), 'gi-i'),

      heading('Join a Life Group', 3, 'gi-h5'),
      ...paragraphs(sentence('adult', 'We have several life groups'), 'gi-j'),
      ...paragraphs(
        (() => {
          const email = address('adult', 'adult');
          return swap(
            line('adult', 'interested in joining a small group'),
            'contact adult[at]fbcmuncie.org',
            `contact [${email}](mailto:${email}).`,
          );
        })(),
        'gi-k',
      ),

      heading('Serve our community', 3, 'gi-h6'),
      ...paragraphs(
        `${line('outreach', 'Volunteering with our partner organizations')} ${swap(
          line('outreach', 'Sewing Group (Rm 203)'),
          'Sewing Group (Rm 203) - A multi-aged',
          'Sewing Group (Rm 203): a multi-aged',
        )}`,
        'gi-l',
      ),
      ...paragraphs(writeTo(address('outreach', 'outreach')), 'gi-m'),

      // The connection card (on /visit since 2026-09-25) for the steps no
      // ministry owns. A short last line after the columns sets as the foot.
      ...paragraphs(
        'To become a member, be baptized or speak with a pastor, [use the connection card](/visit#connect).',
        'gi-n',
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
        // 1. Hero. The window: every age in three lights, and the two doors
        //    most visitors arrive through.
        {
          _type: 'heroSection',
          _key: 'ministries-hero',
          layout: 'window',
          size: 'short',
          headline: 'Every age has a place here.',
          // The church's own sentence, off children.txt (note 8).
          subhead: heroLede,
          frames: [
            { ...heroPalms, _key: 'frame-1' },
            { ...heroYouth, _key: 'frame-2' },
            { ...heroMusicians, _key: 'frame-3' },
          ],
          // Who each age band is for. Each label is the small line of a
          // Ministry band on this page, so the fact links to that band at
          // build time (src/lib/hero-fact-links.ts); nothing here types a link.
          facts: heroFacts,
          primaryCta: ctaAnchor('Get involved', '/ministries#get-involved'),
          secondaryCta: ctaAnchor('What’s On', '/events'),
        },

        // 2. One Sunday, every age, in one place. The same capture /visit
        //    reads, so the two pages cannot disagree about the morning.
        {
          _type: 'timelineSection',
          _key: 'ministries-sunday',
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
        ministryBand('ministries-worship', 'worship', 'ministry-worship', 'right'),

        // 4. Children. Where /children lands.
        ministryBand('ministries-children', 'children', 'ministry-children', 'left'),

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
        ministryBand('ministries-youth', 'youth', 'ministry-youth', 'right'),

        // 8. Adults. Where /adult lands. The ministry has no photograph, so
        //    the band draws as a text band.
        ministryBand('ministries-adult', 'adult', 'ministry-adult'),

        // 9. Outreach. Where /outreach lands. No photograph either.
        ministryBand('ministries-outreach', 'outreach', 'ministry-outreach'),

        // 10. The newsletters and the app, once, for every ministry.
        {
          _type: 'richTextSection',
          _key: 'ministries-stay-updated',
          body: stayUpdated,
        },

        // 11. Get involved: the ways in, each with one next step (note 9).
        //    The Church Coordination Team grid that stood here is on /staff.
        //    Last before the gold band, so the cadence draws it as a brand
        //    band (src/lib/rich-ground.ts) and the page ends on the invitation.
        {
          _type: 'richTextSection',
          _key: 'ministries-get-involved',
          heading: 'Get involved',
          body: getInvolved,
          anchor: { _type: 'slug', current: 'get-involved' },
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
        'Worship arts, children, youth, adults and outreach at First Baptist Church Muncie: Sunday school at 9:30 am, worship at 10:45 am, and who to ask about each.',
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
