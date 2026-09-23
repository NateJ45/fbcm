// scripts/pages/home.mjs
//
// The home page, composed exactly as section 5.1 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it:
// eight bands that answer the four visitor questions (who, when, where, what
// happens) before anybody has to scroll twice.
//
// Three things about this file are deliberate and worth knowing before editing.
//
// 1. NOTHING IS RETYPED FROM SITE SETTINGS. The service time, the street and
//    the livestream address are read off the live siteSettings document and
//    trimmed, never copied as literals (CLAUDE.md rule 15). If the church moves
//    the service to 11:00 the hero follows on the next seed.
//
// 2. THE CHURCH'S OWN SENTENCES COME OUT OF THE WIX CAPTURE. The Sunday band's
//    worship and livestream lines are from scripts/data/pages/home.txt; the
//    first-Sunday band is read from scripts/data/pages/what-to-expect.txt
//    through fromCapture(), which THROWS if an anchor phrase has moved. Only
//    the sentences listed in `newCopy` are new, and every one of them goes into
//    the church-approval note.
//
// 3. THE THREE-UP IS A linkCardsSection, NOT A richTextSection. It shipped
//    first as three h3 leads inside one rich-text block, which reads as a
//    stacked list at every width: the spec (5.1 item 4) asks for a row of
//    three. Task 5b added the block, so the three doors are now three cards
//    with the same three sentences and the same three links, and the link on
//    each card is a text link rather than a button, because the page's buttons
//    belong to the hero and the give band (CLAUDE.md rule 17).

export default {
  id: 'homePage',
  type: 'homePage',
  slug: 'home',

  // Every sentence below that did not exist on the Wix site. The generated note
  // (docs/superpowers/notes/2026-09-19-copy-for-church-approval.md) puts these
  // in front of the church before launch.
  newCopy: [
    'A downtown church in Muncie, Indiana. (hero kicker)',
    'Downtown, at the corner of Adams and Jefferson. (Sunday band, "Find us")',
    'We hold to the Bible, to baptism on a person’s own profession of faith, and to the freedom of each church to govern itself. (link cards, What we believe)',
    'Sunday school, music, youth, and work with partners across Muncie and beyond. (link cards, How we serve)',
    'The congregation has met in downtown Muncie since 1859, and in this building since 1929. (link cards, Where we’ve been)',
    'The tower, the oak pews and the stained glass have been in daily use for more than a century. (heritage band)',
    'Gifts pay the staff, keep the building open and fund the work this church does in Muncie. (give band)',
  ],

  // Frames and bands with identifiable children in them, for the consent
  // conversation. hero-children is the third hero frame.
  photoConsent: ['hero-children'],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const { fromCapture, ctaInternal, ctaExternal, ctaAnchor, keyer } = copy;

    if (!settings) {
      throw new Error(
        'home.mjs: siteSettings is not available. The home page reads the service time, ' +
          'street and livestream address from it rather than retyping them.',
      );
    }

    // ── Facts, derived from settings ────────────────────────────────────────
    // "Sundays at 10:45 am" -> "10:45 am"; the address's first line is the
    // street. Both are computed, so neither can drift from Site settings.
    const serviceTime = String(settings.serviceTime ?? '')
      .replace(/^Sundays at /i, '')
      .trim();
    const streetLine = String(settings.address ?? '')
      .split(/\r?\n/)[0]
      .trim();

    // ── Hero frames ─────────────────────────────────────────────────────────
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

    // A welcome at the sanctuary door beside the church's arrival paragraphs, in
    // place of the empty sanctuary the hero already shows (placed 2026-09-23).
    const firstSunday = await images.image('home-first-sunday');
    const tower = await images.image('hero-tower');

    // ── The first-Sunday body ───────────────────────────────────────────────
    // The church's own arrival paragraphs, verbatim, minus the line that was
    // only a button label on Wix ("click below" pointed at a button that does
    // not exist here).
    const arrival = fromCapture('what-to-expect', {
      from: 'Welcome and Check-In',
      to: 'Sunday School',
      keyPrefix: 'wte-a',
    }).filter((b) => !blockText(b).includes('click below'));

    // And their own sentence about care during the service. The spec's
    // suggested "Worship" anchor matches "Children's Worship Arts" first (the
    // capture uses that phrase higher up the page), so it returns the
    // fellowship HEADINGS rather than prose; the anchor is the nursery heading
    // instead. Same section of the same page, still verbatim.
    const duringTheService = fromCapture('what-to-expect', {
      from: 'Nursery Care (104)',
      to: 'Family Room (105)',
      keyPrefix: 'wte-b',
    });

    return {
      pageBuilder: [
        // 1. Hero. Five frames cross-fade; the headline is plain because
        //    heroSection carries no accent field (see src/components/Hero.astro
        //    and the heroSection schema in sections.ts).
        {
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
        },

        // 2. When we gather. The worship and livestream sentences are the
        //    church's own, off the Wix home page.
        {
          _type: 'sundayTimesSection',
          _key: 'home-sundays',
          eyebrow: 'Sundays',
          heading: 'When we gather',
          items: [
            {
              _type: 'timeItem',
              _key: 'time-1',
              label: 'Worship',
              big: serviceTime,
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
              body: 'Downtown, at the corner of Adams and Jefferson.',
            },
            {
              _type: 'timeItem',
              _key: 'time-3',
              label: "Can't be there?",
              big: 'Online',
              body: 'For live streams, please visit our YouTube channel.',
            },
          ],
          // Doors and parking belong on the Visit page, which carries all three
          // entrances. Here the map and the address are enough.
          showMap: true,
        },

        // 3. What a first Sunday is like. Their words, a welcome at their door.
        {
          _type: 'imageTextSection',
          _key: 'home-first-sunday',
          image: firstSunday,
          imageSide: 'right',
          eyebrow: 'Your first Sunday',
          heading: 'What a first Sunday is like',
          body: [...arrival, ...duringTheService],
          cta: ctaInternal('Plan a visit', 'visit'),
        },

        // 4. Three doors into the site: beliefs, ministries, history. The
        //    sentences are unchanged from the rich-text version this replaced,
        //    except that the building's date is 1929 rather than 1912: the
        //    church's own architecture page says the building was completed in
        //    1929 (the original rendering is 1927) and the History spec dates
        //    the building era 1921 to 1929, so 1912 was simply wrong.
        {
          _type: 'linkCardsSection',
          _key: 'home-three-up',
          eyebrow: 'First Baptist Muncie',
          heading: 'A Baptist church in the heart of downtown since 1859.',
          cards: [
            {
              _type: 'linkCard',
              _key: 'door-1',
              title: 'What we believe',
              body: 'We hold to the Bible, to baptism on a person’s own profession of faith, and to the freedom of each church to govern itself.',
              cta: ctaInternal('Our beliefs', 'beliefs'),
            },
            {
              _type: 'linkCard',
              _key: 'door-2',
              title: 'How we serve',
              body: 'Sunday school, music, youth, and work with partners across Muncie and beyond.',
              cta: ctaInternal('Ministries', 'ministries'),
            },
            {
              _type: 'linkCard',
              _key: 'door-3',
              title: 'Where we’ve been',
              body: 'The congregation has met in downtown Muncie since 1859, and in this building since 1929.',
              cta: ctaInternal('Our history', 'history'),
            },
          ],
        },

        // 5. The building, on brown, with the tower.
        {
          _type: 'heritageBandSection',
          _key: 'home-heritage',
          eyebrow: 'The building',
          heading: 'Limestone, oak and glass',
          body: 'The tower, the oak pews and the stained glass have been in daily use for more than a century.',
          image: tower,
          cta: ctaAnchor("The building's story", '/history#building'),
        },

        // 6. The three most recent posts. `columns` is left unset so the block
        //    takes its schema default.
        {
          _type: 'dynamicListSection',
          _key: 'home-blog',
          headline: 'From the blog',
          source: 'journal',
          limit: 3,
          cta: ctaAnchor('All posts', '/blog'),
        },

        // 7. Give. buttonLabel and buttonUrl are left to their schema defaults,
        //    so the button says "Give through Church Center" and points at the
        //    giving address in Site settings.
        {
          _type: 'giveBandSection',
          _key: 'home-give',
          heading: 'Support the work of this church',
          body: 'Gifts pay the staff, keep the building open and fund the work this church does in Muncie.',
        },
      ],

      seoTitle: 'First Baptist Church Muncie | Sundays 10:45 am, downtown Muncie',
      // The street comes from Site settings like everywhere else. "Muncie,
      // Indiana" stays typed on purpose: the postal city line in the address
      // is "Muncie, IN 47305", and the prose form of the state is not
      // derivable from it without inventing an abbreviation table.
      seoDescription: `${settings.tagline} ${streetLine}, Muncie, Indiana.`,
    };
  },
};

/** The plain text of one portable-text block, for filtering. */
function blockText(block) {
  return (block.children ?? []).map((c) => c.text ?? '').join('');
}
