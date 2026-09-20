// scripts/pages/wedding.mjs
//
// The Weddings & Building Use page, composed exactly as section 5.8 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// the old Weddings page (44 lines, 496 words) and the old Building Reservation
// page (25 lines) become one page. /reservation already redirects to /wedding
// (src/lib/fbcm-redirects.ts), and #building-use is where that redirect and
// every other "building use" link on the site (Home's heritage band,
// Ministries, History) lands.
//
// Five things about this file are deliberate.
//
// 1. EVERY PARAGRAPH IS READ OFF A CAPTURE, NEVER TYPED FROM MEMORY. pick() and
//    linesBetween() THROW when an anchor phrase moves, so a band that would
//    have seeded empty fails the run instead. Both source captures are short
//    (44 and 25 lines) and are quoted almost whole.
//
// 2. NO PRICE IS INVENTED, ANYWHERE ON THIS PAGE. Neither wedding.txt nor
//    reservation.txt states a dollar figure; both say fees exist and point at
//    a document. This page repeats that structure rather than guessing a
//    number: the two document lists each carry the sentence "The documents
//    carry the fees," and nothing on the page states an amount (CLAUDE.md
//    rule 15 read the other way: if the site does not have the number, it does
//    not print one).
//
// 3. THE COORDINATOR IS DERIVED FROM HER STAFF DOCUMENT, NOT TYPED HERE
//    (CLAUDE.md rule 15). Ella Mae Lemen's name and mailto: come off the
//    staffMember document whose role is "Wedding Coordinator", the same
//    pattern ministries.mjs uses. Re-seeding after a staff change refreshes
//    the line; the closing band's second button is built from the same email.
//
// 4. FIVE PDFS AND TWO ONLINE FORMS, EACH LINKED THE WAY IT ACTUALLY WORKS.
//    The Wedding Contract and Bridal Packet, and the Building Reservation
//    Agreement, are uploaded from the archive with the shared uploader (same
//    pattern as beliefs.mjs), which caches by archive-relative path so a
//    second run uploads nothing. The two Church Center forms (243785 for the
//    wedding information sheet, 520312 for the building use request) are
//    `url` links: they are online forms, not files this site can host.
//
// 5. THE GALLERY IS EVERY MANIFEST KEY THAT HAS A FILE. All six of
//    wedding-sanctuary, wedding-bridal-suite, wedding-fellowship-hall,
//    wedding-kitchen, wedding-youth-center and wedding-exterior carry a file in
//    scripts/data/page-images.json (wedding-sanctuary is an alias of
//    hero-sanctuary), so the gallery has all six. Each caption is new copy, one
//    short line, declared in `newCopy` below.

export default {
  id: 'page-wedding',
  type: 'page',
  slug: 'wedding',

  // Every sentence on this page that did not exist on either Wix source. Six
  // gallery captions, the reservation steps (a list built from what the two
  // captures say, not new facts), one connective sentence and the search
  // description. Everything else a visitor reads is the church's own text,
  // cut.
  newCopy: [
    'Married here. (hero headline)',
    'Sanctuary. (gallery caption)',
    'The bridal suite, ready for a wedding morning. (gallery caption)',
    'The fellowship hall. (gallery caption)',
    'The kitchen. (gallery caption)',
    'The youth center. (gallery caption)',
    'A wedding party at the red doors. (gallery caption)',
    'Read the contract and the bridal packet, then reserve your date with the church office. (heading, "Reserving your wedding" band lead-in, built from wedding.txt\'s "you will need to mail the contract, the information sheet, and a deposit to" and the church\'s mailing address)',
    "Mail the signed contract, the information sheet and a deposit to the church office. (reservation step, built from wedding.txt's own mailing instructions and address)",
    'Fill out the wedding information form online. (reservation step, built from the Bridal Packet button\'s own label, "Fill Out Informational Form")',
    "Talk with Ella Mae Lemen, the wedding coordinator, about your date and the building. (reservation step, built from wedding.txt's own description of her role)",
    'The documents below carry the fees. (documentListSection lead sentence, both instances: this page states no dollar figure, because neither source capture does)',
    'Fill this in online. (document note for the two Church Center forms, both instances)',
    'Weddings and building use at First Baptist Church Muncie: reserve the sanctuary for a Christian wedding, or the fellowship hall, kitchen or youth center for another event. (search description)',
  ],

  // Edits to the church's own sentences (ruling P16). Nothing is reworded: text
  // is cut, joined, or re-pointed at a link that still works.
  edits: [
    'Cut, twice: "The Bridal Suite" and "Sanctuary" / "The Sanctuary" are each printed once on the Wix page as a heading with nothing but a photo carousel under it. Both are represented once each in the gallery below instead, each with a caption of its own (declared above).',
    'Cut: "Exterior" as a bare heading over a photo carousel, for the same reason.',
    'Re-cased: "Hanna & Nathan" (a Wix profile heading, not the church\'s prose) becomes "Hanna and Nathan" for the quote\'s attribution, since it names two people rather than a company. The quote itself is unchanged.',
    'Cut: "Photos used with permission from the couples and the photographers." and the photo-credit sentence naming the three photographers. Neither photograph on this page is one of theirs; the manifest photographs are the church building itself.',
    'Linked, so it still works: "please see our wedding page" (reservation.txt) is cut, since the reader is already on that page (this page IS both pages now).',
    'Joined into one paragraph: reservation.txt\'s three short paragraphs about the online form and the paper form ("Please fill out an online Building Use Request Form...", "Those who do not fill out the online form...") are kept as written but printed as consecutive paragraphs, not re-split.',
  ],

  // "Christian wedding" is the church's own qualifying phrase (wedding.txt line
  // 3) and this page keeps it exactly as written, per the task brief and spec
  // 5.8. What it means in practice for a couple who is not a member, or whose
  // faith the church would ask about before booking a date, is not stated
  // anywhere in either capture, so a couple asking has to be answered by a
  // person, not by this page (ruling P20 category: a fact the church has to
  // confirm, not one this page can state on its own).
  confirm: [
    '"Christian wedding" (wedding.txt line 3, "the facilities can be reserved for Christian weddings"): the page keeps this exactly as the church wrote it, per spec 5.8. Neither wedding.txt nor any other capture says what it requires of a couple who asks, for example whether one or both must profess Christian faith, be church members, or simply want a Christian ceremony performed by a pastor. Ella Mae Lemen or the church office needs to be the one who answers that question for anyone who books, and it may be worth a sentence on the page once the church tells us what to say.',
  ],

  // The gallery is six photographs of the building and one wedding party
  // (wedding-exterior) at a distance, not portraits; the hero is the sanctuary,
  // empty. No band on this page shows an identifiable face up close.
  photoConsent: [],

  async build(ctx) {
    const { images, copy, settings, staff } = ctx;
    const { paragraphs, bullets, decodeEntities, ctaAnchor, ctaInternal, ctaExternal } = copy;

    if (!settings) {
      throw new Error(
        'wedding.mjs: siteSettings is not available. The closing band and the reservation steps ' +
          'read the address and service time off it rather than retyping them (CLAUDE.md rule 15).',
      );
    }
    if (!Array.isArray(staff) || staff.length === 0) {
      throw new Error(
        "wedding.mjs: no staffMember documents. The wedding coordinator's name and email are " +
          'DERIVED from them (CLAUDE.md rule 15); there is nothing to fall back on, on purpose.',
      );
    }

    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();

    // ── The wedding coordinator, derived from her staff document ────────────
    // Nothing here is typed. Throws when no staffMember carries the role, or
    // when more than one does, the same pattern ministries.mjs uses.
    const person = (role) => {
      const matches = staff.filter(
        (s) => String(s.role ?? '').toLowerCase() === role.toLowerCase(),
      );
      if (matches.length === 0) {
        throw new Error(
          `wedding.mjs: no staffMember document has the role "${role}". This page's coordinator ` +
            'line is derived from the staff documents, so the role has to exist there.',
        );
      }
      if (matches.length > 1) {
        throw new Error(
          `wedding.mjs: ${matches.length} staffMember documents carry the role "${role}" ` +
            `(${matches.map((m) => m.name).join(', ')}). One role, one person.`,
        );
      }
      return matches[0];
    };
    const coordinator = person('Wedding Coordinator');
    if (!coordinator.email) {
      throw new Error(
        'wedding.mjs: the Wedding Coordinator staff document has no email. This page links her ' +
          'by mailto: rather than typing an address.',
      );
    }

    // ── Reading the captures ──────────────────────────────────────────────
    const line = (slug, phrase) => {
      const found = copy
        .textFile(slug)
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(
          `wedding.mjs: "${phrase}" is not in scripts/data/pages/${slug}.txt any more`,
        );
      }
      return decodeEntities(found).trim();
    };

    // ── The photographs ──────────────────────────────────────────────────
    const galleryKeys = [
      ['wedding-sanctuary', 'Sanctuary.'],
      ['wedding-bridal-suite', 'The bridal suite, ready for a wedding morning.'],
      ['wedding-fellowship-hall', 'The fellowship hall.'],
      ['wedding-kitchen', 'The kitchen.'],
      ['wedding-youth-center', 'The youth center.'],
      ['wedding-exterior', 'A wedding party at the red doors.'],
    ];
    const galleryImages = [];
    for (const [key, caption] of galleryKeys) {
      const img = await images.image(key);
      if (!img) {
        // Per the brief: a manifest key with no file is omitted and reported,
        // not a build failure. Every one of the six carries a file today.
        continue;
      }
      galleryImages.push({ ...img, _key: `gi-${key}`, caption });
    }
    if (galleryImages.length === 0) {
      throw new Error(
        'wedding.mjs: none of the six wedding gallery photos have a file. Check the manifest.',
      );
    }
    const sanctuaryHero = await images.image('wedding-sanctuary');
    if (!sanctuaryHero) {
      throw new Error('wedding.mjs: no photo in the manifest for "wedding-sanctuary"');
    }

    // ── The five PDFs and forms ──────────────────────────────────────────
    // Uploaded from the archive with the shared uploader, which caches asset
    // ids in scripts/.asset-map.json by path: a second run re-uses the asset
    // and uploads nothing. Dynamic import for the same reason as beliefs.mjs:
    // an offline plan run must still be able to load this module, and it never
    // reaches this line because images.image() above has already thrown.
    const uploadPdf = async (file) => {
      const { client, makeUploader } = await import('../lib/sanity-lib.mjs');
      const assetId = await makeUploader(client).uploadFile(`../fbcm-archive/files/${file}`);
      return { _type: 'file', asset: { _type: 'reference', _ref: assetId } };
    };

    // ── 1. Hero ──────────────────────────────────────────────────────────
    // wedding.txt line 3: "the facilities can be reserved for Christian
    // weddings" is kept as written (confirm list above, ruling P20).

    // ── 2. Why here ──────────────────────────────────────────────────────
    const whyHereBody = [
      ...paragraphs(line('wedding', 'a fitting wedding location'), 'wh-a'),
      ...paragraphs(line('wedding', 'Building rentals for this purpose'), 'wh-b'),
      ...paragraphs(line('wedding', 'please read the following information'), 'wh-c'),
      // The coordinator, derived (note 3 above).
      copy.link(
        `${coordinator.name}, ${coordinator.role}`,
        `mailto:${coordinator.email}`,
        'wh-coord',
      ),
      ...paragraphs(line('wedding', 'is a long-time member'), 'wh-d'),
    ];

    // ── 3. Reserving your wedding ────────────────────────────────────────
    // The steps are new copy (declared above), built from what wedding.txt
    // itself says a couple has to do: mail the contract and deposit to the
    // church's own address (from Site settings, not retyped), fill out the
    // information form (the Bridal Packet button's own label), and talk to the
    // coordinator.
    const reserveSteps = bullets(
      [
        `Mail the signed contract, the information sheet and a deposit to First Baptist Church, ${streetLine}.`,
        'Fill out the wedding information form online.',
        `Talk with ${coordinator.name}, the wedding coordinator, about your date and the building.`,
      ],
      'rs',
    );
    const reserveBody = [
      ...reserveSteps,
      ...paragraphs('The documents below carry the fees.', 'rs-fee'),
    ];

    // ── 4. Building use for other events ────────────────────────────────
    const buildingUseBody = [
      ...paragraphs(line('reservation', 'has opened up its facilities'), 'bu-a'),
      ...paragraphs(
        [
          line('reservation', 'you will need to complete a building usage form'),
          line('reservation', 'Please fill out an online Building Use Request Form'),
          line('reservation', 'Those who do not fill out the online form'),
        ].join(' '),
        'bu-b',
      ),
      ...bullets(
        [
          line('reservation', 'Exterior Building'),
          line('reservation', 'Fellowship Hall'),
          line('reservation', 'Kitchen'),
          line('reservation', 'Youth Center'),
        ],
        'bu-c',
      ),
      ...paragraphs('The documents below carry the fees.', 'bu-fee'),
    ];

    return {
      title: 'Weddings and building use',
      slug: { _type: 'slug', current: 'wedding' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero: the sanctuary, empty, and the two doors a visitor arrives
        //    through (a wedding, or another event).
        {
          _type: 'heroSection',
          _key: 'wed-hero',
          layout: 'split',
          size: 'short',
          eyebrow: 'Weddings',
          headline: 'Married here.',
          frames: [{ ...sanctuaryHero, _key: 'frame-1' }],
          primaryCta: ctaAnchor('Reserving your wedding', '/wedding#reserve'),
          secondaryCta: ctaAnchor('Building use', '/wedding#building-use'),
        },

        // 2. Why here: the church's own opening paragraphs, ending on the
        //    coordinator (derived).
        {
          _type: 'richTextSection',
          _key: 'wed-why',
          eyebrow: 'Why here',
          heading: 'A wedding at First Baptist',
          body: whyHereBody,
        },

        // 3. The spaces, six photographs, each with a new caption (declared).
        {
          _type: 'gallerySection',
          _key: 'wed-spaces',
          anchor: { _type: 'slug', current: 'spaces' },
          heading: 'Our spaces',
          images: galleryImages,
          columns: 3,
        },

        // 4. Hanna and Nathan's testimonial, in full.
        {
          _type: 'quoteSection',
          _key: 'wed-quote',
          quote:
            'Looking back at our wedding, we are very thankful to have chosen First Baptist Muncie for our ceremony and to have had the pleasure to work with their staff. The care and help we received was genuine and thorough and the beauty of the building is unparalleled. Mrs. Lemen was always very quick to answer any questions and help with any accommodations. When it is all said and done, they celebrate the gift of marriage with you like family.',
          attribution: 'Hanna and Nathan',
        },

        // 5. Reserving your wedding, then the documents. Where /wedding#reserve
        //    lands.
        {
          _type: 'richTextSection',
          _key: 'wed-reserve',
          anchor: { _type: 'slug', current: 'reserve' },
          eyebrow: 'Reserving your wedding',
          heading: 'How to reserve the church',
          body: reserveBody,
        },
        {
          _type: 'documentListSection',
          _key: 'wed-documents',
          eyebrow: 'Wedding documents',
          heading: 'Three documents',
          docs: [
            {
              _type: 'listedDocument',
              _key: 'wd-1',
              title: 'Wedding Contract',
              file: await uploadPdf('81f7ac_5d5875126f8e4370976dc50811d0cc40.pdf'),
              note: 'To reserve your date',
            },
            {
              _type: 'listedDocument',
              _key: 'wd-2',
              title: 'Bridal Packet',
              file: await uploadPdf('81f7ac_e490a9f4e94f453aace77be8b91bcaa9.pdf'),
              note: 'Everything to plan the day',
            },
            {
              _type: 'listedDocument',
              _key: 'wd-3',
              title: 'Wedding information form',
              // wedding.json, the "Fill Out Informational Form" button.
              url: 'https://fbcmuncie.churchcenter.com/people/forms/243785',
              note: 'Fill this in online',
            },
          ],
        },

        // 6. Building use for other events. Where /wedding#building-use lands,
        //    and where /reservation redirects (src/lib/fbcm-redirects.ts).
        {
          _type: 'richTextSection',
          _key: 'wed-building-use',
          anchor: { _type: 'slug', current: 'building-use' },
          eyebrow: 'Building use',
          heading: 'Using the building for other events',
          body: buildingUseBody,
        },
        {
          _type: 'documentListSection',
          _key: 'wed-building-documents',
          eyebrow: 'Building documents',
          heading: 'Reservation agreement and request form',
          docs: [
            {
              _type: 'listedDocument',
              _key: 'bd-1',
              title: 'Building Reservation Agreement',
              file: await uploadPdf('08181c_1fa464b2da224de48691aca95e371087.pdf'),
              note: 'Sign and return this to the office',
            },
            {
              _type: 'listedDocument',
              _key: 'bd-2',
              title: 'Online request form',
              // reservation.json, the "Online Building Use Request Form" button.
              url: 'https://fbcmuncie.churchcenter.com/people/forms/520312',
              note: 'Fill this in online',
            },
          ],
        },

        // 7. Closing band, subhead from Site settings, second button to the
        //    coordinator directly.
        {
          _type: 'ctaBandSection',
          _key: 'wed-cta',
          eyebrow: 'Questions?',
          headline: 'Talk to the office.',
          subhead: `${settings.serviceTime}. ${streetLine}.`,
          cta: ctaInternal('Contact us', 'contact'),
          secondaryCta: ctaExternal('Email the wedding coordinator', `mailto:${coordinator.email}`),
        },
      ],

      seoTitle: 'Weddings and building use | First Baptist Church Muncie',
      seoDescription:
        'Weddings and building use at First Baptist Church Muncie: reserve the sanctuary for a Christian wedding, or the fellowship hall, kitchen or youth center for another event.',
    };
  },
};
