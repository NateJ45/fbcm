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
// Six things about this file are deliberate.
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
// 5. THE ROOMS ARE NAMED, IN THE CHURCH'S OWN WORDS (2026-09-24, the Wedding
//    identity pass). "Our spaces" is five rooms, each photo's caption the
//    room's name as the two Wix pages print it ("Sanctuary", "The Bridal
//    Suite", "Fellowship Hall", "Kitchen", "Youth Center"). Every photo named
//    is what makes GalleryGrid draw the rooms as a row of arched doors
//    (src/lib/gallery-form.ts). The sanctuary is no longer hero-sanctuary,
//    which Home, Beliefs and the blog already carry: it is the centre-aisle
//    view (wedding-room-sanctuary), a photo on no other page. The wedding
//    party at the red doors is people, not a room, so it moved to "Weddings
//    here".
//
// 6. THE PAGE IN THE CHURCH IDENTITY (2026-09-24). The indigo window hero
//    with three weddings in its lights (the ceremony in the middle); why
//    here; Ella Mae Lemen beside her own words, her portrait and name and
//    role read off her staff document (note 3); the rooms as doors on the
//    indigo-dark band; Hanna and Nathan's words on the gold band; "Weddings
//    here" as an arcade of lancets with no captions (rule 7); the church's
//    photo credits; then reserving, the wedding documents as door cards,
//    building use, the building documents as door cards, and the closing
//    band. Eyebrows that only repeated the heading are gone (rule 11); the
//    document bands take their old eyebrows as headings, since "Three
//    documents" counted what an editor can change (rule 15).

/** A hotspot centred on (x, y), kept inside the frame so the Studio accepts it. */
function hotspot(x, y) {
  const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
  return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
}

export default {
  id: 'page-wedding',
  type: 'page',
  slug: 'wedding',

  // Every sentence on this page that did not exist on either Wix source. The
  // hero headline, one gallery heading, the reservation steps (a list built from what the two
  // captures say, not new facts), one connective sentence and the search
  // description. Everything else a visitor reads is the church's own text,
  // cut.
  newCopy: [
    'Married here. (hero headline)',
    'Weddings here (gallery heading, 2026-09-23)',
    'Read the contract and the bridal packet, then reserve your date with the church office. (heading, "Reserving your wedding" band lead-in, built from wedding.txt\'s "you will need to mail the contract, the information sheet, and a deposit to" and the church\'s mailing address)',
    "Mail the signed contract, the information sheet and a deposit to the church office. (reservation step, built from wedding.txt's own mailing instructions and address)",
    'Fill out the wedding information form online. (reservation step, built from the Bridal Packet button\'s own label, "Fill Out Informational Form")',
    "Talk with Ella Mae Lemen, the wedding coordinator, about your date and the building. (reservation step, built from wedding.txt's own description of her role)",
    'The documents below carry the fees. (documentListSection lead sentence, both instances: this page states no dollar figure, because neither source capture does)',
    'Fill this in online. (document note for the two Church Center forms, both instances)',
    "Ella Mae Lemen, the church's wedding coordinator (alt text on her portrait, built from her staff document's name and role, 2026-09-24)",
    'Weddings and building use at First Baptist Church Muncie: reserve the sanctuary for a Christian wedding, or the fellowship hall, kitchen or youth center for another event. (search description)',
  ],

  // Edits to the church's own sentences (ruling P16). Nothing is reworded: text
  // is cut, joined, or re-pointed at a link that still works.
  edits: [
    'Moved, 2026-09-24: "The Bridal Suite" and "Sanctuary" (wedding.txt headings over photo carousels) and "Fellowship Hall", "Kitchen", "Youth Center" (reservation.txt\'s list of spaces) are now the names under the five room photos in "Our spaces", spelled as the church spelled them. They replace the six new captions this page used to carry.',
    'Cut: "Exterior" as a bare heading over a photo carousel. The wedding party at the red doors is in "Weddings here" instead.',
    'Moved, 2026-09-24: "Wedding Coordinator", "Ella Mae Lemen" and the paragraph under them (wedding.txt) now sit beside her portrait in their own band, instead of closing the "A wedding at First Baptist" text. Her name and role are read off her staff document.',
    'Cut, 2026-09-24: the eyebrows "Why here", "Reserving your wedding" and "Building use" (each repeated the heading under it, rule 11), and the headings "Three documents" and "Reservation agreement and request form", replaced by the bands\' old eyebrows "Wedding documents" and "Building documents".',
    'Cut, 2026-09-24: the caption "Hanna and Nathan." on their processional photograph (no captions on photos, rule 7). Their names are on the quote beside it and in the photo credits.',
    'Re-cased: "Hanna & Nathan" (a Wix profile heading, not the church\'s prose) becomes "Hanna and Nathan" for the quote\'s attribution, since it names two people rather than a company. The quote itself is unchanged.',
    'Restored 2026-09-23: "Photos used with permission from the couples and the photographers." and the photo-credit sentence naming the three photographers, printed under the "Weddings here" gallery. They were cut on the reading that no couple\'s photograph was on the page, which was never quite true (the wedding party at the red doors is one) and stopped being true when the gallery of weddings was added. The sentences are the church\'s own, with "&" set as "and".',
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

  // No photograph on this page shows a child. The couples in the hero and the
  // "Weddings here" gallery were on the church's own /wedding page under its
  // line "Photos used with permission from the couples and the photographers",
  // which this page prints under that gallery.
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
    /** A manifest photo, with the crop its arch needs (the library has no hotspot). */
    const photo = async (key, x, y, extra = {}) => {
      const img = await images.image(key);
      if (!img) throw new Error(`wedding.mjs: no photo in the manifest for "${key}"`);
      return { ...img, hotspot: hotspot(x, y), ...extra };
    };

    // Our spaces: five rooms, each NAMED in the church's own words (note 5).
    // A name on every photo is what draws the gallery as doors.
    const galleryImages = [
      await photo('wedding-room-sanctuary', 0.5, 0.45, { caption: line('wedding', 'Sanctuary') }),
      await photo('wedding-bridal-suite', 0.5, 0.55, {
        caption: line('wedding', 'The Bridal Suite'),
      }),
      await photo('wedding-fellowship-hall', 0.45, 0.5, {
        caption: line('reservation', 'Fellowship Hall'),
      }),
      await photo('wedding-kitchen', 0.45, 0.5, { caption: line('reservation', 'Kitchen') }),
      await photo('wedding-youth-center', 0.5, 0.5, {
        caption: line('reservation', 'Youth Center'),
      }),
    ].map((img, i) => ({ ...img, _key: `gi-${i + 1}` }));

    // The window hero: the ceremony at the chancel in the middle light (the
    // first frame is the middle one), the couple at the red doors and the
    // balcony view in the two tall side lights. All three from the church's
    // own /wedding page, all media-library photos.
    const heroFrames = [
      await photo('wedding-ceremony', 0.55, 0.55, { _key: 'frame-1' }),
      await photo('wedding-red-doors', 0.5, 0.5, { _key: 'frame-2' }),
      await photo('wedding-balcony', 0.5, 0.6, { _key: 'frame-3' }),
    ];

    // Weddings here: an arcade of lancets, no captions (rule 7). Hanna and
    // Nathan's processional first, beside their words on the gold band above.
    const weddingImages = [
      await photo('wedding-processional', 0.5, 0.5, { _key: 'gw-processional' }),
      await photo('wedding-bubbles', 0.55, 0.4, { _key: 'gw-bubbles' }),
      await photo('wedding-exterior', 0.42, 0.62, { _key: 'gw-red-doors' }),
      await photo('wedding-pew', 0.4, 0.5, { _key: 'gw-pew' }),
    ];

    // Ella Mae Lemen's portrait, off her own staff document (note 3): the
    // photo, the name and the role are hers, never typed here.
    if (!coordinator.photo?.asset?._ref) {
      throw new Error(
        'wedding.mjs: the Wedding Coordinator staff document has no photo. Her band draws ' +
          'her portrait from it rather than a copy in the manifest.',
      );
    }
    const coordinatorPortrait = {
      _type: 'image',
      asset: coordinator.photo.asset,
      ...(coordinator.photo.hotspot ? { hotspot: coordinator.photo.hotspot } : {}),
      ...(coordinator.photo.crop ? { crop: coordinator.photo.crop } : {}),
      alt: `${coordinator.name}, the church's ${String(coordinator.role).toLowerCase()}`,
    };
    // The church's own credit lines, from wedding.txt, printed under that gallery.
    const creditBody = [
      ...paragraphs(line('wedding', 'Photos used with permission'), 'cr-a'),
      ...paragraphs(line('wedding', 'Special thanks to').replace(/ & /g, ' and '), 'cr-b'),
    ];

    // ── The five PDFs and forms ──────────────────────────────────────────
    // Uploaded from the archive with the shared uploader, which caches asset
    // ids in scripts/.asset-map.json by path: a second run re-uses the asset
    // and uploads nothing. Dynamic import for the same reason as beliefs.mjs:
    // an offline plan run must still be able to load this module, and it never
    // reaches this line because images.image() above has already thrown.
    // A DRY RUN NEVER UPLOADS (2026-09-24). The uploader only skips the network
    // when this checkout's asset map already holds the file; without --apply
    // it is handed a client whose upload throws, so a nested worktree with an
    // empty map fails the dry run by name instead of writing to the dataset.
    const applying = process.argv.includes('--apply');
    const uploadPdf = async (file) => {
      const { client, makeUploader } = await import('../lib/sanity-lib.mjs');
      const uploadClient = applying
        ? client
        : {
            assets: {
              upload: () => {
                throw new Error(
                  `wedding.mjs: "file:../fbcm-archive/files/${file}" is not in scripts/.asset-map.json, ` +
                    'and a dry run never uploads. Copy its file asset id from the live page (or the ' +
                    'main checkout) into the map, or run with --apply to upload it once.',
                );
              },
            },
          };
      const assetId = await makeUploader(uploadClient).uploadFile(`../fbcm-archive/files/${file}`);
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
    ];

    // ── 2b. The coordinator: her own paragraph, beside her portrait ────────
    const coordinatorBody = paragraphs(line('wedding', 'is a long-time member'), 'wh-d');

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
        // 1. Hero: the indigo window, three weddings in its lights, and the
        //    two doors a visitor arrives through (a wedding, or another event).
        {
          _type: 'heroSection',
          _key: 'wed-hero',
          layout: 'window',
          size: 'short',
          eyebrow: 'Weddings',
          headline: 'Married here.',
          frames: heroFrames,
          primaryCta: ctaAnchor('Reserving your wedding', '/wedding#reserve'),
          secondaryCta: ctaAnchor('Building use', '/wedding#building-use'),
        },

        // 2. Why here: the church's own opening paragraphs.
        {
          _type: 'richTextSection',
          _key: 'wed-why',
          heading: 'A wedding at First Baptist',
          body: whyHereBody,
        },

        // 2b. The coordinator: her portrait, name and role off her staff
        //     document (note 3), her own paragraph, and a button to her.
        {
          _type: 'imageTextSection',
          _key: 'wed-coordinator',
          image: coordinatorPortrait,
          imageSide: 'right',
          eyebrow: coordinator.role,
          heading: coordinator.name,
          body: coordinatorBody,
          cta: ctaExternal('Email the wedding coordinator', `mailto:${coordinator.email}`),
        },

        // 3. The spaces: five rooms, each named, drawn as doors (note 5).
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

        // 4b. Weddings here: the church's own wedding photographs, then the
        //     church's own credit lines for them (restored 2026-09-23).
        {
          _type: 'gallerySection',
          _key: 'wed-weddings',
          heading: 'Weddings here',
          images: weddingImages,
          columns: 4,
        },
        {
          _type: 'richTextSection',
          _key: 'wed-credits',
          width: 'narrow',
          body: creditBody,
        },

        // 5. Reserving your wedding, then the documents. Where /wedding#reserve
        //    lands.
        {
          _type: 'richTextSection',
          _key: 'wed-reserve',
          anchor: { _type: 'slug', current: 'reserve' },
          heading: 'How to reserve the church',
          body: reserveBody,
        },
        {
          _type: 'documentListSection',
          _key: 'wed-documents',
          heading: 'Wedding documents',
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
          heading: 'Using the building for other events',
          body: buildingUseBody,
        },
        {
          _type: 'documentListSection',
          _key: 'wed-building-documents',
          heading: 'Building documents',
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
