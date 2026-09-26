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
// Five things about this file are deliberate.
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
//
// 5. THE IDENTITY PASS (2026-09-24, feat/utility-identity). What changed from
//    the plan 2b page, and why:
//    - THE CHURCH'S OWN HEADINGS (rollout rule 6). "Contact" (contact.txt
//      line 1) for the hero, "Church Office Hours" (line 35) for the hours
//      band, "Pastors’ Office Hours" (line 54) for the pastor band and
//      "Notify Us" (line 7) for the life-update band. "Get in touch.",
//      "Office and pastors' hours", "Tuesdays with Kendall or Jonathan" and
//      "Tell the church" were plan 2b headings standing in for them.
//    - THE CHURCH'S OWN BUTTONS AND LEAD. The hero's lede is the church's
//      visitor-card sentence (line 5) and its button the church's own label
//      "I’m new and want to learn more" (line 68); the life-update link is
//      the church's "Notify the church" (line 70). Both hrefs still come from
//      Site settings.
//    - NO EYEBROWS. "Contact", "Hours", "Share a life update", "Meet with a
//      pastor" and "Sunday" each named the band under them a second time
//      (rollout rule 11).
//    - A PHOTO OF ITS OWN. The hero used the home hero's corner photograph
//      (contact-building is hero-building); it now shows the whole church at
//      dusk from the street (contact-exterior), which no other page uses. A
//      building, so the brand-band split hero draws it as a rectangle.
//    - THE TUESDAY HOURS PRINT ONCE. The pastor band used to repeat the
//      church's "Tuesday Office Hours | ..." line under the hours band that
//      already reads the same hours out of Site settings. The pastor band
//      keeps the pastors' two sentences and the two scheduling links.
//    - THE ORDER. Hours, then the pastors (whose hours the band above just
//      gave), then Notify Us, then Sunday: the taupe hours band and the
//      pastors' portraits break the run of text, and the page still ends on
//      the brown hymn board. The Worship row no longer repeats "Worship is at
//      10:45 AM each Sunday." under a 10:45 numeral (the Visit pass made the
//      same cut).

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
    'Call (765) 284-7749 or email office@fbcmuncie.org. We are at 309 East Adams Street, downtown Muncie. Office hours, pastors’ hours and life updates. (search description, not shown on the page; 2026-09-24 local search pass)',
  ],

  // Edits to the church's own text (ruling P16). The words are still theirs.
  edits: [
    'Dropped: the trailing comma on "Engagement/Marriage Announcement," (contact.txt line 19). It reads as a typo in a bulleted list, and every other item in the list ends with no punctuation at all.',
    'Re-laid out, not rewritten: the "For Business, Billing, or Related Needs" block. The capture puts the heading, the phone number and the email address on four separate lines (contact.txt lines 44 to 48). Here the heading is an h3 and the two values print under it, read from Site settings rather than retyped, so they cannot drift from the header, the footer and the hero facts.',
    'Not carried over: the "Other questions?" paragraph and the second copy of the phone number and email under "Mailing Address". The old page printed its contact details twice, which the content map lists as a problem; this page prints them once, in the hero facts, and once more under the business heading where the church deliberately distinguishes billing enquiries.',
    'Not repeated: the pastors\' "Tuesday Office Hours | 9:00 a.m. - 12:00 p.m. and 1:00 p.m - 5:00 p.m." line (contact.txt line 60). The hours band above the pastors now prints the same hours from Site settings, so the page gives them once.',
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
    for (const field of ['phone', 'email', 'address']) {
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
    // The whole church at dusk, from the street. No other page uses it
    // (contact-building, the photo this replaced, is the home hero's).
    const building = await images.image('contact-exterior');
    if (!building) {
      throw new Error('contact.mjs: no photo in the manifest for "contact-exterior"');
    }

    // The pastor band shows BOTH co-pastors (2026-09-25, Nathan: the band
    // named two pastors and showed one). Each portrait is read off that
    // pastor's own staffMember document rather than held as a second copy.
    // Kendall's is the band's `image` and Jonathan's its `detail`, the small
    // second photo imageTextSection already carries; when both are portraits
    // of people, ImageText draws them as two equal lancets side by side
    // (src/lib/photo-shape.ts besideForm, 'pair'), so no schema field was
    // added. Kendall first, as the church lists her and as /staff's hero does.
    const pastorPortrait = (slug) => {
      const p = (staff ?? []).find((s) => s?.slug?.current === slug);
      if (!p?.photo?.asset) {
        throw new Error(
          `contact.mjs: no staffMember document with slug "${slug}" carrying a photo. The ` +
            '"Pastors’ Office Hours" band reads both portraits off the staff documents.',
        );
      }
      return { ...p.photo, alt: `${p.name}, ${p.role}` };
    };
    const pastorPhoto = pastorPortrait('kendall-ellis');
    const secondPastorPhoto = pastorPortrait('jonathan-balmer');

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
    // The church's own headings and button labels, read the same way so a
    // rewritten capture fails the run instead of seeding a stale word.
    const exact = (slug, text) => {
      const got = line(slug, text);
      if (got !== text) {
        throw new Error(`contact.mjs: expected the line "${text}" in ${slug}.txt, found "${got}"`);
      }
      return got;
    };
    const pageHeading = exact('contact', 'Contact');
    const officeHeading = exact('contact', 'Church Office Hours');
    const pastorsHeading = exact('contact', 'Pastors’ Office Hours');
    const notifyHeading = exact('contact', 'Notify Us');
    const visitorLead = line('contact', 'virtual visitor’s card');
    /** A [Button] label from the capture, by the form URL it points at. */
    const buttonLabel = (url) => {
      const raw = line('contact', url);
      const m = raw.match(/^\[Button\]\s*(.+?)\s*->/);
      if (!m) throw new Error(`contact.mjs: no [Button] label on the line for ${url}`);
      return m[1];
    };
    const newVisitorLabel = buttonLabel('forms/159198');
    const notifyLabel = buttonLabel('forms/159897');

    return {
      title: 'Contact',
      slug: { _type: 'slug', current: 'contact' },
      // The main menu is seeded on siteSettings, not page by page.
      addToMainNav: false,

      pageBuilder: [
        // 1. Hero on the brand band: the church's own heading and its own
        //    visitor-card sentence, the three facts a visitor came for, and
        //    both calls above the fold (spec 5.11 point 2). The whole church
        //    at dusk in a rectangle at the right (a building, not people).
        {
          _type: 'heroSection',
          _key: 'contact-hero',
          layout: 'split',
          size: 'short',
          headline: pageHeading,
          subhead: visitorLead,
          frames: [{ ...building, _key: 'frame-1' }],
          facts: [
            { _type: 'heroFact', _key: 'fact-1', label: 'Phone', value: settings.phone },
            { _type: 'heroFact', _key: 'fact-2', label: 'Email', value: settings.email },
            { _type: 'heroFact', _key: 'fact-3', label: 'Address', value: streetLine },
          ],
          primaryCta: ctaExternal(newVisitorLabel, settings.visitorFormUrl),
          // A tel: link should not open a second tab, so the flag ctaExternal
          // sets for an off-site URL is turned back off here (same as staff.mjs).
          secondaryCta: {
            ...ctaExternal('Call the office', `tel:${telDigits}`),
            openInNewTab: false,
          },
        },

        // 2. Church Office Hours, the office door. The band holds NO hours:
        //    Hours.astro reads siteSettings.officeHours and .pastoralHours
        //    live, so the holiday note and the footer can never disagree with
        //    this page. See note 1 at the top of this file.
        {
          _type: 'hoursSection',
          _key: 'contact-hours',
          heading: officeHeading,
        },

        // 3. Pastors’ Office Hours. Both co-pastors' portraits (see the note
        //    above), both co-pastors named, and each one's own
        //    Google Calendar link. The business/billing heading goes under the
        //    same band because it is the same question asked a different way:
        //    who do I actually contact?
        {
          _type: 'imageTextSection',
          _key: 'contact-pastors',
          image: pastorPhoto,
          detail: secondPastorPhoto,
          imageSide: 'left',
          heading: pastorsHeading,
          body: [
            ...paragraphs(pastorsInAndOut, 'mp-a'),
            ...paragraphs(pastorsTuesdays, 'mp-b'),
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

        // 4. Notify Us. The church's own question, the church's own list, one
        //    new sentence saying what happens after the form goes in (declared
        //    in newCopy above) and the church's own button label on the link.
        //    /contact#life-update lands here.
        {
          _type: 'richTextSection',
          _key: 'contact-life-update',
          anchor: { _type: 'slug', current: 'life-update' },
          heading: notifyHeading,
          body: [
            // contact.txt line 9, verbatim.
            ...paragraphs(line('contact', 'share something with the church'), 'lu-intro'),
            ...bullets(lifeEvents, 'lu'),
            ...paragraphs(
              // The {contact-form} token, filled from Site settings at build time:
              // the form's address once Church Trac has one, and until then an
              // email to the office (church-links.ts linkFallback; 2026-09-26,
              // the Church Center form it pointed at is retired).
              `Tell us and a member of the pastoral team will follow up. [${notifyLabel}]({contact-form})`,
              'lu-follow',
            ),
          ],
        },

        // 5. Sunday, on the hymn board. No doors: /visit#accessibility is the
        //    page that walks a visitor through the three entrances, and
        //    repeating it here would be the second copy rule 15 is about.
        {
          _type: 'sundayTimesSection',
          _key: 'contact-sunday',
          heading: 'Find us on Sunday',
          items: [
            {
              _type: 'timeItem',
              _key: 'time-1',
              label: 'Worship',
              big: serviceTime,
            },
            {
              _type: 'timeItem',
              _key: 'time-2',
              label: 'Find us',
              // Derived, never typed (CLAUDE.md rule 15). streetLine is
              // siteSettings.address's first line, "309 East Adams Street";
              // the band's big line drops the word "Street" because the label
              // above it already says "Find us" and the short form is what the
              // church says out loud.
              big: streetLine.replace(/\s+Street$/i, ''),
              // accessibility.txt line 3: the sentence that tells a driver
              // which side of the building to aim for.
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
      // 2026-09-24, the local search pass: the phone number and email lead,
      // since that is what a search for the church's contact details wants in
      // the result itself. All three facts are Site settings' ({phone},
      // {email}, {address} once seed-pages converts them).
      seoDescription: `Call ${settings.phone} or email ${settings.email}. We are at ${streetLine}, downtown Muncie. Office hours, pastors’ hours and life updates.`,
    };
  },
};
