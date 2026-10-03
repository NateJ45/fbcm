// scripts/pages/architecture.mjs
//
// The Architecture page (2026-10-03). It brings back the Wix page at
// /architecture, which plan 2b had folded into Visit ("Our building") with a
// permanent redirect. The church asked for the page back: it supports the
// upkeep appeal for the building, and the old URL is linked from Wix, search
// results and the church's own materials.
//
// Five things about this file are deliberate.
//
// 1. A QUIET PAGE, NOT A NAVIGATION ITEM. `addToMainNav` is false and the
//    page is not in the footer. It is reached from three places only: History's
//    1921 to 1929 band, the Give page ("What your gift supports") and, through
//    Visit's own "Our building" band, the history link there. A first-time
//    visitor is not asked to care about architecture; the people who do care
//    (and the people the upkeep appeal is written for) find it.
//
// 2. THE WIX PAGE WAS ABOUT 150 WORDS, SO THE BODY IS THE CHURCH'S OWN
//    ELSEWHERE. Every sentence from the old page is kept (architecture.txt),
//    and the story of the building going up (the site, the 1,200 who marched,
//    the $338,000 cost, the $166,000 mortgage) is lifted verbatim from the
//    history capture, where it already sits in the Fighting Parson era. Each
//    quotation is read by anchor phrase and the run fails if it has moved.
//
// 3. NEW COPY IS LABELS AND ONE SHORT BAND. The "at a glance" labels, the four
//    gallery captions and the closing "Caring for the building" paragraph are
//    the only sentences the church did not write, all listed in `newCopy`
//    for approval. Nothing is said about the building that the church's own
//    text or the photographs do not already say.
//
// 4. THE 1927 RENDERING IS THIS PAGE'S PHOTOGRAPH. Home's Our Building band
//    shows it too; the overnight rule against one photograph on two pages was
//    written for the identity rollout, and this is the page the drawing
//    belongs to, so it hangs here in the opener's lancet.
//
// 5. NO EVENT IS NAMED. The church is holding an event that takes donations
//    for upkeep, but no date, name or amount has been given yet. The closing
//    band points at /events (Church Trac's feed lists it the day it is
//    entered there) and at /give; add the event by name once the church says.

export default {
  id: 'page-architecture',
  type: 'page',
  slug: 'architecture',

  newCopy: [
    'The "At a glance" labels: Architects; Builders; Stone; Plan; Completed; On the National Register. (Labels; their values are the church’s own words from architecture.txt and history.txt.)',
    'The gallery heading "Four things to look for" and its four captions: The tower; Stained glass; The nave; The entry arch.',
    'Caring for the building: "A limestone building from 1929 needs steady care, and the congregation pays for it. Gifts toward the building’s upkeep are one way to share in that."',
    'The closing band: "Come and see it." with the line "Gifts toward the building’s upkeep are welcome." and its two buttons.',
    'Search description: "A Late Gothic Revival church of Indiana limestone, designed by Samuel Hannaford and Sons and completed in 1929 at 309 East Adams Street, Muncie. On the National Register of Historic Places since 1988." (not shown on the page)',
  ],

  edits: [
    'Corrected: "309 East Adams Streeet" in the old page’s last paragraph had three e’s. The address on this page is read from Site settings instead of retyped.',
    'Dropped: "Our building today" and its sentence ("You can find us at 309 East Adams Street... Feel free to stop by!"). The closing band carries the address and the Sunday time from Site settings, and Visit is the page for finding the church.',
    'Re-headed: the old page’s "Gothic Revival", "Completed in 1929" and "English Influence" were three sub-headings over one or two sentences each. "Completed in 1929" sat over the sentence "The number of new Gothic Revival buildings declined sharply after the 1930s.", which is about the style rather than the date, so it moves under the style’s own heading, "A style from England".',
    'Lifted, verbatim, from history.txt: the two paragraphs of the Fighting Parson era about the new building (the vision, the site, the fund-raising, May 12, 1929, the cost and the mortgage). The paragraphs about the pastor and the overflow crowds are not used.',
  ],

  confirm: [
    'The upkeep event: name, date and what the donations are for. The page names no event; the closing band points at /events and /give. Once the church says, add it to Church Trac (it then appears on /events) and name it in the "Caring for the building" paragraph.',
    'Whether to name the cost ($338,000) and the mortgage ($166,000) as the church’s history page does. They are the church’s own figures, kept here because they are the heart of the building’s story and of the appeal, but a donor reading them may want the 1929 figures set beside today’s needs.',
  ],

  // Buildings and a 1927 drawing only; no person is identifiable.
  photoConsent: [],

  async build(ctx) {
    const { images, copy } = ctx;
    const { paragraphs, heading, link, ctaAnchor, decodeEntities } = copy;

    // -- Reading the captures ------------------------------------------------
    const lineFrom = (slug, phrase) => {
      const found = copy
        .textFile(slug)
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(
          `architecture.mjs: "${phrase}" is not in scripts/data/pages/${slug}.txt any more. ` +
            'Re-read the capture before changing this.',
        );
      }
      return decodeEntities(found).trim();
    };
    const arch = (phrase) => lineFrom('architecture', phrase);
    const hist = (phrase) => lineFrom('history', phrase);

    // The opener: the church's own paragraph, all three sentences.
    const openerBody = arch('third, and most recent, building was completed in 1929');

    // Gothic Revival: the two paragraphs of the old page's second section.
    const designedBy = arch('designed by Samuel Hannaford and Sons');
    const gothicStyle = arch('The Gothic style dictated');

    // A style from England: the two sentences that sat under it, in the order
    // a reader meets them (where it began, then what became of it).
    const english = arch('began in the late 1740s in England');
    const declined = arch('declined sharply after the 1930s');

    // The building going up: two paragraphs of the Fighting Parson era.
    const goingUp = [hist('Visualizing a beautiful new church'), hist('After numerous delays')];

    // The facts for the ledger, each checked against the capture it comes from
    // so a value can never drift from the church's own sentence.
    const must = (text, phrase, what) => {
      if (!text.includes(phrase)) {
        throw new Error(`architecture.mjs: ${what} no longer says "${phrase}".`);
      }
    };
    must(designedBy, 'Samuel Hannaford and Sons', 'the architects line');
    must(designedBy, 'Morrow and Morrow', 'the builders line');
    must(designedBy, 'Indiana limestone', 'the stone line');
    must(designedBy, 'cruciform plan', 'the plan line');
    must(openerBody, 'completed in 1929', 'the completion line');
    must(openerBody, 'National Register of Historic Places since 1988', 'the register line');
    must(goingUp[1], 'May 12, 1929', 'the march line');
    must(goingUp[1], '$338,000', 'the cost line');
    must(goingUp[1], '$166,000', 'the mortgage line');

    // -- The photographs -----------------------------------------------------
    const hotspot = (x, y) => {
      const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
      return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
    };
    const photo = async (key, at) => {
      const img = await images.image(key);
      if (!img) throw new Error(`architecture.mjs: no photo in the manifest for "${key}"`);
      return at ? { ...img, hotspot: hotspot(at[0], at[1]) } : img;
    };

    const open = await photo('architecture-open', [0.5, 0.5]);
    const rendering = await photo('architecture-rendering', [0.5, 0.5]);
    const facade = await photo('architecture-facade', [0.5, 0.45]);
    const tower = await photo('architecture-tower', [0.5, 0.5]);
    const glass = await photo('architecture-glass', [0.5, 0.5]);
    const nave = await photo('architecture-nave', [0.5, 0.5]);
    const arch1 = await photo('architecture-arch', [0.5, 0.5]);

    /** A gallery photo, named, so the gallery draws as a row of arched doors. */
    const named = (img, caption, key) => ({ ...img, _key: key, caption });

    return {
      title: 'Architecture',
      slug: { _type: 'slug', current: 'architecture' },
      // Out of the way on purpose: not in the main menu, not in the footer.
      addToMainNav: false,

      pageBuilder: [
        // 1. The opener: the church's brown, the church's own heading and
        //    paragraph, the building in a door arch and the 1927 drawing in a
        //    lancet (HeritageOpener.astro).
        {
          _type: 'heritageBandSection',
          _key: 'ar-open',
          image: open,
          archive: rendering,
          heading: 'Our building',
          body: openerBody,
        },

        // 2. The style, in the church's own two paragraphs.
        {
          _type: 'imageTextSection',
          _key: 'ar-gothic',
          image: facade,
          imageSide: 'right',
          heading: 'Late Gothic Revival',
          body: [...paragraphs(designedBy, 'ar-g1'), ...paragraphs(gothicStyle, 'ar-g2')],
        },

        // 3. At a glance. Labels are new; every value is the church's own.
        {
          _type: 'richTextSection',
          _key: 'ar-glance',
          heading: 'At a glance',
          body: [
            heading('Architects', 3, 'ar-a1'),
            ...paragraphs('Samuel Hannaford and Sons', 'ar-a1p'),
            heading('Builders', 3, 'ar-a2'),
            ...paragraphs('Morrow and Morrow', 'ar-a2p'),
            heading('Stone', 3, 'ar-a3'),
            ...paragraphs('Indiana limestone', 'ar-a3p'),
            heading('Plan', 3, 'ar-a4'),
            ...paragraphs('Cruciform', 'ar-a4p'),
            heading('Completed', 3, 'ar-a5'),
            ...paragraphs('1929', 'ar-a5p'),
            heading('On the National Register', 3, 'ar-a7'),
            ...paragraphs('Since 1988', 'ar-a7p'),
          ],
        },

        // 4. Four things to look for. Named photographs, so the gallery draws
        //    as a row of arched doors.
        {
          _type: 'gallerySection',
          _key: 'ar-gallery',
          heading: 'Four things to look for',
          images: [
            named(tower, 'The tower', 'ar-p1'),
            named(glass, 'Stained glass', 'ar-p2'),
            named(nave, 'The nave', 'ar-p3'),
            named(arch1, 'The entry arch', 'ar-p4'),
          ],
        },

        // 5. Where the style comes from.
        {
          _type: 'richTextSection',
          _key: 'ar-style',
          heading: 'A style from England',
          width: 'narrow',
          body: [...paragraphs(english, 'ar-s1'), ...paragraphs(declined, 'ar-s2')],
        },

        // 6. The building going up, from the church's own history.
        {
          _type: 'richTextSection',
          _key: 'ar-built',
          heading: 'How it was built',
          width: 'narrow',
          body: [
            ...paragraphs(goingUp[0], 'ar-b1'),
            ...paragraphs(goingUp[1], 'ar-b2'),
            link('The whole story is in our history', '/history#building', 'ar-b3'),
          ],
        },

        // 7. Caring for it: the appeal, said plainly.
        {
          _type: 'richTextSection',
          _key: 'ar-care',
          heading: 'Caring for the building',
          width: 'narrow',
          body: [
            ...paragraphs(
              'A limestone building from 1929 needs steady care, and the congregation pays for it. Gifts toward the building’s upkeep are one way to share in that.',
              'ar-c1',
            ),
            link('See what is on', '/events', 'ar-c2'),
          ],
        },

        // 8. Closing band: the street and the Sunday time off Site settings
        //    (rule 15), a way to give and a way to visit.
        {
          _type: 'ctaBandSection',
          _key: 'ar-cta',
          headline: 'Come and see it.',
          // Site settings placeholders, filled at fetch (src/lib/settings-placeholders.ts).
          subhead: '{service time}. {address}. Gifts toward the building’s upkeep are welcome.',
          cta: ctaAnchor('Give toward the upkeep', '/give'),
          secondaryCta: ctaAnchor('Plan a visit', '/visit'),
        },
      ],

      seoTitle: 'Architecture of First Baptist Church Muncie | Gothic Revival, 1929',
      seoDescription:
        'A Late Gothic Revival church of Indiana limestone, designed by Samuel Hannaford and Sons and completed in 1929 at 309 East Adams Street, Muncie. On the National Register of Historic Places since 1988.',
    };
  },
};
