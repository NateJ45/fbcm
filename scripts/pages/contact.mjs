// scripts/pages/contact.mjs
//
// The Contact page, composed exactly as section 5.11 of
// docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md describes it.
//
// Until 2026-09-20 /contact was the one page on this site that was not a page:
// it was the starter's bespoke `contactPage` singleton drawing a Web3Forms
// React island, a Calendly embed and a service-area map, none of which this
// church uses. Plan 1 decided the site carries NO form of its own; every form a
// visitor meets belongs to the church's own Church Center. So this page is the
// same shape as /visit and /give, and task 14 retired the rest.
//
// Four things about this file are deliberate.
//
// 1. NOTHING A VISITOR HAS TO ACT ON IS RETYPED. The phone number, the email,
//    the address, the visitor card and the life-update form are all read off
//    the live siteSettings document (CLAUDE.md rule 15). So are the hours:
//    the hours band stores its eyebrow and its heading and nothing else, and
//    Hours.astro reads siteSettings.officeHours and .pastoralHours at render
//    time. A seeded copy of the hours would be a second source of truth, and
//    the second one is the one still showing last year's Friday closing time.
//
// 2. THE PROSE COMES OUT OF THE CAPTURE, NEVER OUT OF MEMORY. Every sentence
//    below is read from scripts/data/pages/contact.txt (or home.txt, or
//    accessibility.txt) by anchor phrase, and the readers THROW when a phrase
//    moves, so a band that would have seeded empty fails the run instead.
//
// 3. THE TWO SCHEDULING LINKS ARE THE CHURCH'S OWN, AND THEY ARE IN THE JSON,
//    NOT THE TXT. The text capture writes both of them as the bare word
//    "Schedule"; the hrefs live in contact.json's `links` array. They are read
//    from there by URL prefix, so a changed calendar address fails the run
//    rather than seeding a dead link.
//
// 4. NO CLOSING BAND. The hero carries both calls (the visitor card and the
//    phone), and this is the page a visitor came to in order to act. A second
//    "get in touch" band at the bottom of the Contact page would be the site
//    asking twice.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTACT_JSON = resolve(HERE, '..', 'data', 'pages', 'contact.json');

export default {
  id: 'page-contact',
  type: 'page',
  slug: 'contact',

  // Every sentence below that did not exist on the Wix site. The generated note
  // (docs/superpowers/notes/2026-09-19-copy-for-church-approval.md) puts these
  // in front of the church before launch.
  newCopy: [
    "Tell us and a member of the pastoral team will follow up. (Share a life update, the sentence that introduces the form link. The old page listed the life events and linked the form with no word about what happens next, which the content map flagged as the page's main gap.)",
    'Phone, email, address and office hours for First Baptist Church Muncie at 309 East Adams Street, plus how to share a life update and how to book time with a pastor. (search description, not shown on the page)',
  ],

  // Edits to the church's own text (ruling P16). The words are still theirs.
  edits: [
    'Dropped: the trailing comma on "Engagement/Marriage Announcement," (contact.txt line 19). It reads as a typo in a bulleted list, and every other item in the list ends with no punctuation at all.',
    'Re-laid out, not rewritten: the "For Business, Billing, or Related Needs" block. The capture puts the heading, the phone number and the email address on four separate lines (contact.txt lines 44 to 48). Here the heading is an h3 and the two values print under it, read from Site settings rather than retyped, so they cannot drift from the header, the footer and the hero facts.',
    'Not carried over: the "Other questions?" paragraph and the second copy of the phone number and email under "Mailing Address". The old page printed its contact details twice, which the content map lists as a problem; this page prints them once, in the hero facts, and once more under the business heading where the church deliberately distinguishes billing enquiries.',
  ],

  // No identifiable children on this page: the hero frame is the building and
  // the pastor band is a staff portrait the church published itself.
  photoConsent: [],

  async build(ctx) {
    const { images, copy, settings, staff } = ctx;
    const { paragraphs, bullets, heading, linesBetween, decodeEntities, ctaExternal } = copy;

    if (!settings) {
      throw new Error(
        'contact.mjs: siteSettings is not available. Every fact on this page (phone, email, ' +
          'address, service time, the two Church Center forms) is read off it rather than ' +
          'retyped (CLAUDE.md rule 15).',
      );
    }
    for (const field of ['phone', 'email', 'address', 'visitorFormUrl', 'lifeEventFormUrl']) {
      if (!settings[field]) {
        throw new Error(
          `contact.mjs: siteSettings.${field} is not set, and the Contact page is the one page ` +
            'that cannot be seeded without it.',
        );
      }
    }

    // "309 East Adams Street\nMuncie, IN 47305" -> the street line alone, for
    // the hero fact and the Sunday band. Computed, never typed.
    const streetLine = String(settings.address).split(/\r?\n/)[0].trim();
    const serviceTime = String(settings.serviceTime ?? '')
      .replace(/^Sundays at /i, '')
      .trim();
    // tel: wants digits only. ctaBlock allows the tel: scheme on externalUrl.
    const telDigits = String(settings.phone).replace(/[^\d]/g, '');

    // -- The photographs -----------------------------------------------------
    const building = await images.image('contact-building');
    if (!building) {
      throw new Error('contact.mjs: no photo in the manifest for "contact-building"');
    }

    // The pastor band shows ONE portrait, because imageTextSection carries one
    // `image` field and giving it a second would mean a new schema field for a
    // single band. It is Kendall Ellis's, read off her staffMember document
    // rather than held as a second copy (the same move staff.mjs makes for its
    // hero), and the band's heading and body name BOTH co-pastors so a visitor
    // is never left guessing who the other one is.
    const kendall = (staff ?? []).find((s) => s?.slug?.current === 'kendall-ellis');
    if (!kendall?.photo?.asset) {
      throw new Error(
        'contact.mjs: no staffMember document with slug "kendall-ellis" carrying a photo. The ' +
          '"Meet with a pastor" band reads its portrait off that document.',
      );
    }
    const pastorPhoto = { ...kendall.photo, alt: `${kendall.name}, ${kendall.role}` };

    // -- Readers over the captures -------------------------------------------

    /** The one line of `slug`.txt containing `phrase`, decoded and trimmed. */
    const line = (slug, phrase) => {
      const found = copy
        .textFile(slug)
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(
          `contact.mjs: "${phrase}" is not in scripts/data/pages/${slug}.txt any more`,
        );
      }
      return decodeEntities(found).trim();
    };

    /**
     * The href of the one link in contact.json whose url starts with `prefix`
     * and whose text is `text`. The two pastors' Google Calendar addresses are
     * both written as the bare word "Schedule" in the text capture, so they can
     * only be told apart by their URLs, and the URLS ARE THE POINT: a changed
     * calendar link has to fail the run, not seed a dead button.
     */
    const contactJson = JSON.parse(readFileSync(CONTACT_JSON, 'utf8'));
    const schedulingHref = (prefix, whose) => {
      const hits = (contactJson.links ?? []).filter(
        (l) => typeof l.href === 'string' && l.href.startsWith(prefix),
      );
      if (hits.length !== 1) {
        throw new Error(
          `contact.mjs: expected exactly one ${whose} scheduling link starting "${prefix}" in ` +
            `scripts/data/pages/contact.json, found ${hits.length}`,
        );
      }
      return hits[0].href;
    };
    // contact.json links[4] and links[6]. The two calendars were captured in
    // the order the page lists the pastors: Jonathan first, Kendall second.
    const jonathanCalendar = schedulingHref(
      'https://calendar.app.google/yfMeekvgCxY7x2mU6',
      'Jonathan Balmer',
    );
    const kendallCalendar = schedulingHref(
      'https://calendar.app.google/oAVyoHDFut24sJtTA',
      'Kendall Ellis',
    );

    // -- The life-event list, verbatim ---------------------------------------
    // contact.txt lines 11 to 29: everything between the question that
    // introduces the list and the next heading. All ten items, including the
    // phone/address change the old page ends the list with. The only change is
    // the stray trailing comma on "Engagement/Marriage Announcement," (see
    // `edits` above).
    const lifeEvents = linesBetween('contact', 'such as:', 'Other questions?')
      .map((l) => decodeEntities(l).trim())
      .filter(Boolean)
      .map((l) => l.replace(/,$/, ''));
    if (lifeEvents.length !== 10) {
      throw new Error(
        `contact.mjs: expected the 10 life events contact.txt lists between "such as:" and ` +
          `"Other questions?", found ${lifeEvents.length}`,
      );
    }

    // -- The pastors' own three sentences ------------------------------------
    // contact.txt lines 56, 58 and 60, each read by a phrase only that line
    // carries.
    const pastorsInAndOut = line('contact', 'in and out of the office');
    const pastorsTuesdays = line('contact', 'have set aside Tuesdays');
    const pastorsTuesdayHours = line('contact', 'Tuesday Office Hours |');

    return {
      title: 'Contact',
      slug: { _type: 'slug', current: 'contact' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero. Words left, the corner of the building on the right, and the
        //    three facts a visitor came for. Both buttons are above the fold,
        //    which is what spec 5.11 point 2 asks for: the visitor card for
        //    someone new, the phone for someone who needs the office now.
        {
          _type: 'heroSection',
          _key: 'contact-hero',
          layout: 'split',
          size: 'short',
          eyebrow: 'Contact',
          headline: 'Get in touch.',
          frames: [{ ...building, _key: 'frame-1' }],
          facts: [
            { _type: 'heroFact', _key: 'fact-1', label: 'Phone', value: settings.phone },
            { _type: 'heroFact', _key: 'fact-2', label: 'Email', value: settings.email },
            { _type: 'heroFact', _key: 'fact-3', label: 'Address', value: streetLine },
          ],
          primaryCta: ctaExternal('Fill in a visitor card', settings.visitorFormUrl),
          // A tel: link should not open a second tab, so the flag ctaExternal
          // sets for an off-site URL is turned back off here (same as staff.mjs).
          secondaryCta: {
            ...ctaExternal('Call the office', `tel:${telDigits}`),
            openInNewTab: false,
          },
        },

        // 2. Hours. The band holds NO hours: Hours.astro reads
        //    siteSettings.officeHours and .pastoralHours live, so the office's
        //    holiday note and the footer can never disagree with this page.
        //    See note 1 at the top of this file.
        {
          _type: 'hoursSection',
          _key: 'contact-hours',
          eyebrow: 'Hours',
          heading: "Office and pastors' hours",
        },

        // 3. Share a life update. The church's own question, the church's own
        //    list, and one new sentence saying what happens after the form goes
        //    in (declared in newCopy above). /contact#life-update lands here.
        {
          _type: 'richTextSection',
          _key: 'contact-life-update',
          anchor: { _type: 'slug', current: 'life-update' },
          eyebrow: 'Share a life update',
          heading: 'Tell the church',
          body: [
            // contact.txt line 9, verbatim.
            ...paragraphs(line('contact', 'share something with the church'), 'lu-intro'),
            ...bullets(lifeEvents, 'lu'),
            ...paragraphs(
              `Tell us and a member of the pastoral team will follow up. [Share a life update](${settings.lifeEventFormUrl})`,
              'lu-follow',
            ),
          ],
        },

        // 4. Meet with a pastor. Kendall's portrait (see the note above on why
        //    one and not two), both co-pastors named, and each one's own Google
        //    Calendar link inline on their name. The business/billing heading
        //    goes under the same band because it is the same question asked a
        //    different way: who do I actually contact?
        {
          _type: 'imageTextSection',
          _key: 'contact-pastors',
          image: pastorPhoto,
          imageSide: 'left',
          eyebrow: 'Meet with a pastor',
          heading: 'Tuesdays with Kendall or Jonathan',
          body: [
            ...paragraphs(pastorsInAndOut, 'mp-a'),
            ...paragraphs(pastorsTuesdays, 'mp-b'),
            ...paragraphs(pastorsTuesdayHours, 'mp-c'),
            ...paragraphs(
              `[Schedule with Jonathan Balmer](${jonathanCalendar}) · [Schedule with Kendall Ellis](${kendallCalendar})`,
              'mp-d',
            ),
            // contact.txt line 44, verbatim, as the heading the church wrote.
            heading(line('contact', 'For Business, Billing'), 3, 'mp-biz'),
            ...paragraphs(settings.phone, 'mp-e'),
            ...paragraphs(`[${settings.email}](mailto:${settings.email})`, 'mp-f'),
          ],
        },

        // 5. Sunday, with the map. No doors: /visit#accessibility is the page
        //    that walks a visitor through the three entrances, and repeating it
        //    here would be the second copy rule 15 is about.
        {
          _type: 'sundayTimesSection',
          _key: 'contact-sunday',
          eyebrow: 'Sunday',
          heading: 'Find us on Sunday',
          items: [
            {
              _type: 'timeItem',
              _key: 'time-1',
              label: 'Worship',
              big: serviceTime,
              // home.txt line 32.
              body: line('home', 'Worship is at'),
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
              // accessibility.txt line 3. The brief asked for "the parking
              // line" from that capture and there is none: accessibility.txt
              // is about the entrances, and the parking sentence lives in
              // what-to-expect.txt where /visit already uses it. This is that
              // file's own first sentence, and it is the one that tells a
              // driver which side of the building to aim for.
              body: line('accessibility', 'wheelchair accessible entrance is off'),
            },
            {
              _type: 'timeItem',
              _key: 'time-3',
              label: 'Online',
              big: 'Live',
              // home.txt line 33.
              body: line('home', 'For live streams'),
            },
          ],
          showMap: true,
        },
      ],

      seoTitle: 'Contact | First Baptist Church Muncie',
      seoDescription: `Phone, email, address and office hours for First Baptist Church Muncie at ${streetLine}, plus how to share a life update and how to book time with a pastor.`,
    };
  },
};
