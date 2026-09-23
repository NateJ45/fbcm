// scripts/pages/who-we-are.mjs
//
// The Who We Are page, composed from the church sections built for it on
// 2026-09-23 (the "Who We Are alive" plan,
// docs/superpowers/plans/2026-09-23-fbcm-who-we-are-alive.md). The visual spec
// is the approved prototype,
// docs/superpowers/prototypes/2026-09-23-who-we-are/c-alive.html: it says which
// photograph goes where and the order the page reads in. The words are the
// church's own, from scripts/data/pages/who-we-are.txt, in the order the church
// wrote them:
//
//   heroSection (window)  their sentence, three faces in a triple lancet
//   watchwordSection      Our Watchword: Isaiah 12:4, praise and proclaim
//   goalsSection          Our Goals: Worship, The Way, Witness, Work
//   pledgeSection         Our Pledge, said together when a member joins
//   letterSection         A Note From Our Pastors, the whole letter
//   linkCardsSection      Where To Go Next, four cards as arched doors
//
// Seven things about this file are deliberate.
//
// 1. WHAT CAME OFF, AND WHY. The previous composition (plan 2b) set this page
//    as a scripture band, three text blocks, a staff grid, link cards and a
//    closing call-to-action band. Every one of those is replaced, not moved:
//    the scripture band's verse is now inside the watchword band; the three
//    text blocks (watchword, goals, pledge) are now bands of their own; the
//    letter, which plan 2b cut to three paragraphs and a link to /staff, is
//    now here whole; the staff grid lives on /staff, which is where the
//    "Meet Our Staff" card goes; and the closing "Join us this Sunday" band is
//    dropped because the prototype ends on the four doors, the first of which
//    is Sunday worship. No link anywhere on the site, in Sanity or in code,
//    pointed at an anchor on the old page (checked 2026-09-23), so nothing
//    that disappears was a link target.
//
// 2. THEIR SENTENCE IS THE HEADLINE, AND IT IS NOT RETYPED. The hero headline
//    is siteSettings.tagline, the line the church closes its Worship goal with
//    ("We are a Spirit-led people gathered to join Christ's presence in our
//    community.", who-we-are.txt). Because the hero says it, the Worship goal
//    below stops before it rather than saying it twice (CLAUDE.md rule 15).
//
// 3. THE CAPTURE OPENS WITH A TABLE OF CONTENTS. Lines 3 to 11 are the five
//    headings ("Our Watchword" ... "Where To Go Next"), and four of them never
//    appear again: the sections they name carry no heading in the capture. So
//    those headings are typed here, exactly as the contents list spells them,
//    and every span below is anchored on a first line of PROSE, never on a
//    line number. pick() finds one line of a span by a distinctive phrase and
//    THROWS when it cannot, so a moved or reworded line fails the build of
//    this page instead of seeding an empty field.
//
// 4. EVERY CHANGE TO THEIR WORDS IS A NAMED HELPER THAT THROWS. gloss()
//    inserts a clause (the plan 2b explanations of "growth track" and
//    "deacon", carried forward), dashToComma() swaps an em-dash for a comma
//    (CLAUDE.md rule 2), and recase() turns a Wix title-case line into a
//    sentence. Each throws when the sentence it edits has changed underneath
//    it, and each edit is listed in `edits` for the approval note.
//
// 5. PHOTOS COME FROM THE MEDIA LIBRARY, BY ARCHIVE FILENAME. Every photo is a
//    `library` entry in scripts/data/page-images.json (keys `wwa-*`), so the
//    page uses the library's one copy and nothing is resized or uploaded. The
//    alt text on each entry is the library's own altText
//    (scripts/data/photo-library.json). The library carries no hotspot, so the
//    crop each frame needs is set here, from the prototype's object-position.
//    No photo on this page has a caption (Nathan's ruling, 2026-09-23).
//
// 6. THE WELCOME BOOKLET IS UPLOADED ON --apply, NEVER LINKED TO WIX. The
//    capture's button points at the PDF on the Wix file host, which dies at
//    cutover. The module reads the same file from ../fbcm-archive/files/ and
//    links the Sanity file asset it becomes. A Sanity asset id is the SHA-1 of
//    the file's bytes (file-<sha1>-pdf, served at
//    cdn.sanity.io/files/<project>/<dataset>/<sha1>.pdf), so the URL is known
//    BEFORE the upload: a dry run prints the upload as a planned step and
//    writes nothing, and --apply uploads through makeUploader().uploadFile()
//    (as beliefs.mjs and wedding.mjs do) and throws if Sanity hands back any
//    other id. A final guard throws if any fbcmuncie.org/_files link reaches
//    the page.
//
// 7. CUTS, EACH A WHOLE SENTENCE. (a) The Worship goal's closing sentence is
//    the hero headline (note 2). (b) "This watchword, “Praise & Proclaim”
//    reminds us of the importance of each:" is cut from the watchword: it
//    introduced the two meanings, and the band sets those beside the mark
//    under their own "Praise" and "Proclaim", so kept it would end the
//    Read-more text on a colon pointing at nothing.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../lib/loadEnv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The Sanity file asset an archive PDF becomes, worked out from its bytes, and
 * the upload itself on --apply only (note 6). Returns the asset's CDN URL.
 */
async function archivePdf(file) {
  const rel = `../fbcm-archive/files/${file}`;
  const sha1 = createHash('sha1')
    .update(readFileSync(resolve(ROOT, rel)))
    .digest('hex');
  const assetId = `file-${sha1}-pdf`;
  const env = loadEnv(ROOT);
  const projectId = env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_DATASET || 'production';
  if (!projectId) throw new Error('who-we-are.mjs: PUBLIC_SANITY_PROJECT_ID is not set.');
  if (process.argv.includes('--apply')) {
    const { client, makeUploader } = await import('../lib/sanity-lib.mjs');
    const uploaded = await makeUploader(client).uploadFile(rel);
    if (uploaded !== assetId) {
      throw new Error(`who-we-are.mjs: uploaded ${rel} as ${uploaded}, expected ${assetId}.`);
    }
  } else {
    console.log(`  planned on --apply: upload ${rel} as ${assetId}`);
  }
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${sha1}.pdf`;
}

/** A hotspot centred on (x, y), kept inside the frame so the Studio accepts it. */
function hotspot(x, y) {
  const size = Math.min(0.3, 2 * Math.min(x, 1 - x), 2 * Math.min(y, 1 - y));
  return { _type: 'sanity.imageHotspot', x, y, width: size, height: size };
}

export default {
  id: 'page-who-we-are',
  type: 'page',
  slug: 'who-we-are',

  // Every sentence below that did not exist on the Wix site. The generated note
  // (docs/superpowers/notes/2026-09-19-copy-for-church-approval.md) puts these
  // in front of the church before launch.
  newCopy: [
    'Praise & Proclaim, our watchword (hero button, jumps to the watchword)',
    'In the church (Our goals, Witness: label on the first ring, for "Engaged Membership")',
    'In Muncie (Our goals, Witness: label on the second ring, for "Local Partnership")',
    'Everywhere (Our goals, Witness: label on the third ring, for "Kingdom Citizenship")',
    'Co-Pastors, First Baptist Church Muncie (under the signature of the pastors’ letter)',
  ],

  // Edits to the church's own sentences (ruling P16). The words are still
  // theirs, so these are not `newCopy`; each is made by a helper below that
  // throws if the sentence it edits has moved.
  edits: [
    'growth track: "We offer a growth track, a step by step path into the life of this church, to help us all..." (Our goals, The Way. The inserted clause explains the church’s own term, which the Wix site never does.)',
    'deacon: "...connected with a deacon, a church member chosen to care for others, who offers prayer and support." (Our goals, The Way.)',
    'One word added: "lifting up the name of God" (the Wix page reads "lifting up name of God"). (Our watchword, what "Praise" means.)',
    'Em-dash to comma (CLAUDE.md rule 2): "...would be one, as he and the Father are one." (Our pledge, after the pledge.)',
    'Em-dash to comma (CLAUDE.md rule 2): "...calling a married couple to be Co-Pastors, both of us preaching the word..." (A note from our pastors.)',
    'Lifted, not written: "“Come and see.”" is set large as the pull quote of The Way. It is the pastors’ letter’s own quotation of John 1:39, which The Way’s opening sentence also quotes.',
    'Not repeated: the Worship goal’s closing sentence, "We are a Spirit-led people gathered to join Christ’s presence in our community.", is the headline at the top of the page, so the Worship goal stops before it.',
    "The headline at the top of the page is the Site settings tagline, 'We're a Spirit-led people gathered to join Christ's presence in our community.', a contraction of the church’s own 'We are a Spirit-led people...' (the closing line of the Worship goal).",
    'Cut, a whole sentence: "This watchword, “Praise & Proclaim” reminds us of the importance of each:" (Our watchword). The two meanings it introduced are printed beside the mark under their own headings, "Praise" and "Proclaim".',
    'Re-cased: the hero button "A note from our pastors" is the church’s heading "A Note From Our Pastors" set as a sentence.',
    'Re-cased from the Wix card style (every word capitalised) to sentences: "Find out what you can expect this Sunday.", "Get in touch with us with our virtual contact card.", "Read our staff bios and meet the people of FBCM.", "Download our Welcome Booklet." and the button "Read more". (Where to go next.)',
  ],

  // Page-images manifest keys of the photos on this page that show an
  // identifiable child (photo-library.json `children: true`).
  photoConsent: [
    'wwa-hero-girls',
    'wwa-hero-child',
    'wwa-way-bibles',
    'wwa-witness-children',
    'wwa-witness-singing',
    'wwa-witness-steps',
    'wwa-witness-serve',
    'wwa-witness-boxes',
    'wwa-work-frame',
  ],

  async build(ctx) {
    const { images, copy, settings } = ctx;
    const { linesBetween, paragraphs, ctaInternal, ctaExternal, ctaAnchor, decodeEntities } = copy;

    if (!settings) {
      throw new Error(
        'who-we-are.mjs: siteSettings is not available. This page reads the tagline and the ' +
          'visitor form from it rather than retyping them.',
      );
    }

    // -- Reading the capture -------------------------------------------------

    /** The one line of `lines` containing `phrase`, decoded and trimmed. */
    const pick = (lines, phrase) => {
      const hit = lines.filter((l) => l.includes(phrase));
      if (hit.length === 0) {
        throw new Error(
          `who-we-are.mjs: "${phrase}" is no longer in that span of ` +
            'scripts/data/pages/who-we-are.txt',
        );
      }
      return decodeEntities(hit[0]).trim();
    };

    /** A scripture reference line, "(Galatians 6:2)", without its brackets. */
    const reference = (lines, phrase) => pick(lines, phrase).replace(/^\(/, '').replace(/\)$/, '');

    /** Insert one clause into a sentence the church wrote; throw if it moved. */
    const gloss = (sentence, find, replaceWith) => {
      if (!sentence.includes(find)) {
        throw new Error(
          `who-we-are.mjs: cannot gloss "${find}": it is not in the sentence the capture now ` +
            'carries. Re-read the section before changing this.',
        );
      }
      return sentence.replace(find, replaceWith);
    };

    /** The one em-dash between words becomes a comma (CLAUDE.md rule 2). */
    const dashToComma = (sentence) => {
      if (!/\s—\s/.test(sentence)) {
        throw new Error(
          `who-we-are.mjs: expected an em-dash to fix in "${sentence.slice(0, 60)}..."; the ` +
            'capture no longer carries one.',
        );
      }
      return sentence.replace(/\s—\s/, ', ');
    };

    /**
     * A Wix title-case line as a sentence. `wanted` is typed out in full (so
     * "Sunday" and "Welcome Booklet" keep their capitals); this only checks
     * that it is the same words, letter for letter, as the church's line.
     */
    const recase = (original, wanted) => {
      if (wanted.replace(/\.$/, '').toLowerCase() !== original.toLowerCase()) {
        throw new Error(`who-we-are.mjs: "${wanted}" is not a re-casing of "${original}".`);
      }
      return wanted;
    };

    /** "Following God's Word - Our times of worship..." -> { title, body }. */
    const titled = (line) => {
      const m = /^(.+?)\s+[-–]\s+(.+)$/.exec(line);
      if (!m) throw new Error(`who-we-are.mjs: no title before a dash in "${line.slice(0, 60)}"`);
      return { title: m[1].trim(), body: m[2].trim() };
    };

    // -- Photos -----------------------------------------------------------------

    /** A media-library photo from the manifest, with the crop the frame needs. */
    const photo = async (key, x, y, extra = {}) => {
      const img = await images.image(key);
      if (!img) throw new Error(`who-we-are.mjs: no photo in the manifest for "${key}"`);
      return { ...img, hotspot: hotspot(x, y), ...extra };
    };

    // -- 1. Hero ------------------------------------------------------------------
    // Three faces, the middle (largest) lancet first: the two girls at the
    // glass in the middle, the couple in the kitchen on the left, the small
    // girl among the coneflowers on the right (Hero.astro draws frames[1],
    // frames[0], frames[2]).
    const frames = [
      await photo('wwa-hero-girls', 0.6, 0.38, { _key: 'frame-1' }),
      await photo('wwa-hero-couple', 0.58, 0.4, { _key: 'frame-2' }),
      await photo('wwa-hero-child', 0.68, 0.4, { _key: 'frame-3' }),
    ];

    // -- 2. The watchword -------------------------------------------------------
    // The verse is the three lines under "Praise & Proclaim", joined, with the
    // outer quotation marks off: the band sets them itself.
    const verse = decodeEntities(
      linesBetween('who-we-are', 'Praise & Proclaim', '(Isaiah 12:4)')
        .filter((l) => l.trim())
        .join(' '),
    )
      .trim()
      .replace(/^[“"]/, '')
      .replace(/[”"]$/, '');

    // The watchword text: its first two sentences (the first paragraph) are
    // the introduction; the rest, whole and in order, is behind "Read more";
    // the two meanings under "Praise" and "Proclaim" have fields of their own.
    const ww = linesBetween('who-we-are', '(Isaiah 12:4)', 'Our Church Coordination');
    const watchwordIntro = pick(ww, 'This statement is our congregational');
    const watchwordMore = [
      ...paragraphs(pick(ww, 'When the people of God were in exile'), 'ww-a'),
      ...paragraphs(pick(ww, 'At First Baptist Church Muncie, we believe'), 'ww-b'),
      ...paragraphs(pick(ww, 'And our goal for this season'), 'ww-c'),
    ];
    // Cut (note 7b), but checked: if the sentence leaves the capture, re-read it.
    pick(ww, 'reminds us of the importance of each');
    const praise = gloss(pick(ww, 'That our Purpose'), 'lifting up name', 'lifting up the name');
    const proclaim = pick(ww, 'That our Joy');

    // -- 3. The goals -------------------------------------------------------------
    const goalsIntro = pick(
      linesBetween('who-we-are', 'That our Joy', 'Worship'),
      'Our Church Coordination Team',
    );
    const worshipLines = linesBetween('who-we-are', 'Worship', 'The Way');
    const wayLines = linesBetween('who-we-are', 'The Way', 'Witness');
    const witnessLines = linesBetween('who-we-are', 'Witness', 'Work');
    const workLines = linesBetween('who-we-are', 'Work', 'Our commitment to one another');

    /** A point from a "Title - body" line of the capture. */
    const point = (_key, lines, phrase, { short, edit } = {}) => {
      const { title, body } = titled(pick(lines, phrase));
      return {
        _type: 'goalPoint',
        _key,
        title,
        ...(short ? { short } : {}),
        body: edit ? edit(body) : body,
      };
    };

    const goals = [
      {
        _type: 'goal',
        _key: 'goal-worship',
        name: 'Worship',
        subtitle: pick(worshipLines, 'Worshiping as the Body of Christ'),
        glyph: 'window',
        summary: pick(worshipLines, 'FBCM gives praise to the Lord'),
        points: [
          point('worship-1', worshipLines, "Following God's Word"),
          point('worship-2', worshipLines, 'Enjoying Fellowship'),
          point('worship-3', worshipLines, 'Participating in Practices'),
        ],
        // The whole body in the sanctuary, full bleed, then the two lancets:
        // leading the songs, and setting the Lord's table.
        photos: [
          await photo('wwa-worship-nave', 0.5, 0.82, { _key: 'worship-nave' }),
          await photo('wwa-worship-singer', 0.56, 0.4, { _key: 'worship-singer' }),
          await photo('wwa-worship-table', 0.3, 0.5, { _key: 'worship-table' }),
        ],
      },
      {
        _type: 'goal',
        _key: 'goal-way',
        name: 'The Way',
        aside: reference(wayLines, '(Discipleship)'),
        subtitle: pick(wayLines, 'Seeking Understanding'),
        glyph: 'door',
        quote: '“Come and see.”',
        summary: gloss(
          pick(wayLines, 'FBCM proclaims God'),
          'We offer a growth track to help us all',
          'We offer a growth track, a step by step path into the life of this church, to help us all',
        ),
        points: [
          point('way-1', wayLines, 'Welcoming Worship'),
          point('way-2', wayLines, 'Caring Mentorship', {
            edit: (body) =>
              gloss(
                body,
                'connected with a deacon who offers',
                'connected with a deacon, a church member chosen to care for others, who offers',
              ),
          }),
          point('way-3', wayLines, 'Spiritual Friendship'),
        ],
        // One door-arch step per point: the welcome at the door, the deacons,
        // friends with open Bibles.
        photos: [
          await photo('wwa-way-door', 0.4, 0.45, { _key: 'way-door' }),
          await photo('wwa-way-deacons', 0.46, 0.4, { _key: 'way-deacons' }),
          await photo('wwa-way-bibles', 0.5, 0.45, { _key: 'way-bibles' }),
        ],
      },
      {
        _type: 'goal',
        _key: 'goal-witness',
        name: 'Witness',
        aside: reference(witnessLines, '(Evangelism)'),
        subtitle: pick(witnessLines, 'Inviting to Church'),
        glyph: 'rose',
        summary: pick(witnessLines, 'To make known what God has done'),
        // The ring labels are new copy (declared above): one widening ring per
        // point, the church, then Muncie, then everywhere.
        points: [
          point('witness-1', witnessLines, 'Engaged Membership', { short: 'In the church' }),
          point('witness-2', witnessLines, 'Local Partnership', { short: 'In Muncie' }),
          point('witness-3', witnessLines, 'Kingdom Citizenship', { short: 'Everywhere' }),
        ],
        // Faces of the church, at the door, in town, on the steps, on mission.
        photos: [
          await photo('wwa-witness-children', 0.57, 0.5, { _key: 'witness-children' }),
          await photo('wwa-witness-mascot', 0.3, 0.5, { _key: 'witness-mascot' }),
          await photo('wwa-witness-singing', 0.24, 0.4, { _key: 'witness-singing' }),
          await photo('wwa-witness-steps', 0.62, 0.5, { _key: 'witness-steps' }),
          await photo('wwa-witness-serve', 0.5, 0.4, { _key: 'witness-serve' }),
          await photo('wwa-witness-boxes', 0.55, 0.5, { _key: 'witness-boxes' }),
        ],
      },
      {
        _type: 'goal',
        _key: 'goal-work',
        name: 'Work',
        aside: reference(workLines, '(Acts of Mercy)'),
        subtitle: pick(workLines, 'Gifts For Service'),
        glyph: 'basin',
        summary: pick(workLines, 'FBCM exalts God'),
        // Serve, Support and Share are the church's own point titles, and the
        // word each door carries.
        points: [
          point('work-1', workLines, 'Serve ', { short: 'Serve' }),
          point('work-2', workLines, 'Support ', { short: 'Support' }),
          point('work-3', workLines, 'Share ', { short: 'Share' }),
        ],
        photos: [
          await photo('wwa-work-building', 0.62, 0.5, { _key: 'work-building' }),
          await photo('wwa-work-frame', 0.42, 0.6, { _key: 'work-frame' }),
          await photo('wwa-work-breakfast', 0.38, 0.55, { _key: 'work-breakfast' }),
        ],
      },
    ];

    // -- 4. The pledge ----------------------------------------------------------
    // Verbatim and whole, each line with its reference, then the two
    // paragraphs the church sets after it, each with its reference.
    const pledgeLines = linesBetween(
      'who-we-are',
      'Gifts For Service',
      'Pastors Kendall & Jonathan',
    );
    const pledgeLine = (_key, phrase, refPhrase) => ({
      _type: 'pledgeLine',
      _key,
      text: pick(pledgeLines, phrase),
      reference: reference(pledgeLines, refPhrase),
    });
    const after = [
      ...paragraphs(
        `${dashToComma(pick(pledgeLines, 'The life of faith'))} ${pick(pledgeLines, '(John 17:20-22)')}`,
        'pa-a',
      ),
      ...paragraphs(
        `${pick(pledgeLines, 'At the same time, that unity')} ${pick(pledgeLines, '(1 Corinthians 12:12-30)')}`,
        'pa-b',
      ),
    ];

    // -- 5. The letter ------------------------------------------------------------
    // The whole letter, every paragraph in order, between the sign-off line the
    // capture opens it with and the first link card.
    const letterSpan = linesBetween('who-we-are', 'Pastors Kendall & Jonathan', 'Sunday Worship')
      .map((l) => decodeEntities(l).trim())
      .filter(Boolean);
    if (!letterSpan[0]?.startsWith('If you') || !letterSpan.at(-1)?.startsWith('Finally')) {
      throw new Error(
        'who-we-are.mjs: the pastors’ letter no longer runs from "If you..." to "Finally...". ' +
          'Re-read the capture before changing this.',
      );
    }
    // The one em-dash in the letter is in the Co-Pastors paragraph; dashToComma
    // throws if it has gone.
    const letter = letterSpan.flatMap((para, i) =>
      paragraphs(
        para.includes('calling a married couple') ? dashToComma(para) : para,
        `lt-${i + 1}`,
      ),
    );
    const signature = pick(
      linesBetween('who-we-are', 'Our commitment to one another', 'If you'),
      'Pastors Kendall & Jonathan',
    ).replace(/^Pastors\s+/, '');

    // -- 6. Where to go next ----------------------------------------------------
    const cardLines = linesBetween('who-we-are', 'Finally, we would love');
    const button = (n) => {
      const hits = cardLines.filter((l) => l.startsWith('[Button]'));
      const m = /->\s*(\S+)/.exec(hits[n] ?? '');
      if (!m) throw new Error(`who-we-are.mjs: link card button ${n + 1} is not in the capture`);
      return m[1];
    };
    const readMore = recase(
      pick(cardLines, '[Button] Read More').split('->')[0].replace('[Button]', '').trim(),
      'Read more',
    );

    const cards = [
      {
        _type: 'linkCard',
        _key: 'next-1',
        title: pick(cardLines, 'Sunday Worship'),
        body: recase(
          pick(cardLines, 'Find Out What You Can Expect'),
          'Find out what you can expect this Sunday.',
        ),
        // The Wix card went to /what-to-expect, which this site retired into /visit.
        cta: ctaInternal(readMore, 'visit'),
        image: await photo('wwa-next-worship', 0.5, 0.5),
      },
      {
        _type: 'linkCard',
        _key: 'next-2',
        title: pick(cardLines, 'Contact Us'),
        body: recase(
          pick(cardLines, 'Get In Touch With Us'),
          'Get in touch with us with our virtual contact card.',
        ),
        // The capture's own form (button 2), read from Site settings, where it lives once.
        cta: ctaExternal('Contact', settings.visitorFormUrl ?? button(1)),
        image: await photo('wwa-next-kitchen', 0.4, 0.35),
      },
      {
        _type: 'linkCard',
        _key: 'next-3',
        title: pick(cardLines, 'Meet Our Staff'),
        body: recase(
          pick(cardLines, 'Read our staff bios'),
          'Read our staff bios and meet the people of FBCM.',
        ),
        // The Wix card went to /ministers, which is /staff here.
        cta: ctaInternal(readMore, 'staff'),
        image: await photo('wwa-next-kendall', 0.5, 0.3),
      },
      {
        _type: 'linkCard',
        _key: 'next-4',
        title: pick(cardLines, 'Find Out More'),
        body: recase(
          pick(cardLines, 'Download Our Welcome Booklet'),
          'Download our Welcome Booklet.',
        ),
        // Note 6: the capture's PDF, uploaded to Sanity on --apply.
        cta: ctaExternal('Download', await archivePdf(button(3).split('/').pop())),
        image: await photo('wwa-next-doors', 0.5, 0.78),
      },
    ];

    const page = {
      title: 'Who we are',
      slug: { _type: 'slug', current: 'who-we-are' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        {
          _type: 'heroSection',
          _key: 'wwa-hero',
          layout: 'window',
          eyebrow: 'Who We Are',
          headline: settings.tagline,
          frames,
          primaryCta: ctaAnchor('Praise & Proclaim, our watchword', '/who-we-are#watchword'),
          secondaryCta: ctaAnchor('A note from our pastors', '/who-we-are#letter'),
        },
        {
          _type: 'watchwordSection',
          _key: 'wwa-watchword',
          heading: 'Our Watchword',
          intro: watchwordIntro,
          more: watchwordMore,
          verse,
          reference: reference(
            linesBetween('who-we-are', 'Praise & Proclaim', 'This statement is'),
            '(Isaiah 12:4)',
          ),
          praise,
          proclaim,
          anchor: { _type: 'slug', current: 'watchword' },
        },
        {
          _type: 'goalsSection',
          _key: 'wwa-goals',
          heading: 'Our Goals',
          intro: goalsIntro,
          goals,
          anchor: { _type: 'slug', current: 'goals' },
        },
        {
          _type: 'pledgeSection',
          _key: 'wwa-pledge',
          heading: 'Our Pledge',
          intro: pick(pledgeLines, 'Our commitment to one another'),
          instruction: pick(pledgeLines, 'When a member joins'),
          opening: pick(pledgeLines, 'We pledge ourselves'),
          lines: [
            pledgeLine('pledge-1', 'Bearing your burdens', '(Galatians 6:2)'),
            pledgeLine('pledge-2', 'Encouraging you in the faith', '(1 Thess. 5:11)'),
            pledgeLine('pledge-3', 'Delighting in the Lord', '(Ps. 86:11-13'),
            pledgeLine('pledge-4', 'Offering our lives', '(Romans 12:1)'),
          ],
          after,
          image: await photo('wwa-pledge-baptism', 0.7, 0.3),
          anchor: { _type: 'slug', current: 'pledge' },
        },
        {
          _type: 'letterSection',
          _key: 'wwa-letter',
          heading: 'A Note From Our Pastors',
          body: letter,
          signature,
          signatureNote: 'Co-Pastors, First Baptist Church Muncie',
          portrait: await photo('wwa-letter-pastors', 0.71, 0.5),
          anchor: { _type: 'slug', current: 'letter' },
        },
        {
          _type: 'linkCardsSection',
          _key: 'wwa-next',
          heading: 'Where To Go Next',
          cards,
          anchor: { _type: 'slug', current: 'next' },
        },
      ],

      seoTitle: 'Who we are | First Baptist Church Muncie',
      // The 1859 date is the church's own: scripts/data/pages/history.txt line
      // 3, "Founded in 1859, First Baptist Church of Muncie...". The American
      // Baptist affiliation is scripts/data/pages/baptists.txt line 83.
      seoDescription: `${settings.tagline} An American Baptist church in downtown Muncie since 1859.`,
    };

    // No em-dash reaches the page (CLAUDE.md rule 2), whatever the capture
    // carries: the two the church wrote are turned into commas above.
    // And no link to the Wix file host, which dies at cutover (note 6).
    if (JSON.stringify(page).includes('fbcmuncie.org/_files')) {
      throw new Error('who-we-are.mjs: a fbcmuncie.org/_files link reached the page.');
    }
    const dash = JSON.stringify(page).indexOf('—');
    if (dash !== -1) {
      throw new Error(
        `who-we-are.mjs: an em-dash reached the page: ${JSON.stringify(page).slice(dash - 60, dash + 20)}`,
      );
    }
    return page;
  },
};
