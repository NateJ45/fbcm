// Safe to edit by hand
// =============================================================================
// Page templates - the starting points offered when someone makes a new page
// =============================================================================
// When the church office presses "+" on Pages > All other pages, the Studio asks
// which of these to start from (the authoring kit, PORTS.md card 109). Each one
// fills the page with the church's own blocks and clearly marked example text,
// so nobody faces an empty page wondering what goes where, and nothing
// example-shaped goes live unnoticed: every line the church must decide starts
// "Example:", and the page builder warns on any section that still has one
// (src/lib/page-guardrails.ts).
//
// THIS FILE IS THE CHURCH'S OWN, chosen for what First Baptist Church Muncie
// actually publishes: plan-a-visit and special-service pages, a page per
// ministry, the life events people ask about (baptism, membership, funerals),
// the church year (Christmas, Easter, VBS) and the records it keeps (minutes,
// reports, albums). The copy rules are in templateBlocks.ts; the seasonal
// sections are shared with the saved sections in sectionPatterns.ts.
//
// GROUPS. Sanity's "new document" menu has no headings, so sanity.config.ts
// shows each template as "<group>: <title>" and this list is kept in group
// order (TEMPLATE_GROUPS). src/lib/authoring.test.ts checks the order, the
// block types, the keys, the example marker and the church's page rules.
//
// No `sanity` import here on purpose: node --test loads this file directly.
// =============================================================================

import { freshKeys } from '../lib/authoring.ts';
import {
  button,
  card,
  cards,
  churchTracForm,
  ctaBand,
  documents,
  example,
  faq,
  gallery,
  give,
  hero,
  imageText,
  qa,
  quote,
  richText,
  row,
  scripture,
  systemButton,
  time,
  timeline,
  times,
  video,
  type Rec,
} from './templateBlocks.ts';
import {
  adventSections,
  easterSections,
  memorialSections,
  missionOfferingSections,
  thanksgivingSections,
  vbsSections,
} from './sectionPatterns.ts';

/** The headings the template menu is sorted under, in menu order. */
export const TEMPLATE_GROUPS = [
  'Visitors',
  'Ministries',
  'Life events',
  'Church year',
  'News and records',
  'Blank',
] as const;
export type TemplateGroup = (typeof TEMPLATE_GROUPS)[number];

export interface PageTemplate {
  /** Stable id. Changing it only changes the menu; pages already made keep their content. */
  id: string;
  /** Which heading it sits under in the menu. */
  group: TemplateGroup;
  /** What the "new page" menu says (after the group). */
  title: string;
  /** One line under the title, in the menu. */
  description: string;
  /** The sections a new page starts with. */
  sections: () => Rec[];
}

/** "Visitors: Special service", the way the Studio menu shows a template. */
export const templateMenuTitle = (t: PageTemplate): string => `${t.group}: ${t.title}`;

/** Build a list and give every array member a fresh key. */
const page = (...sections: Rec[]) => freshKeys(sections);

/** The usual first-visit button, pointed at the Visit page by the editor. */
const planVisit = () => button(example('Plan your visit'));

/** The usual "ask us" band at the foot of a page. */
const askBand = (headline: string, subhead: string) =>
  ctaBand(headline, subhead, button(example('Contact us')));

// ── The templates, in menu order ─────────────────────────────────────────────

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ── Visitors ───────────────────────────────────────────────────────────────
  {
    id: 'page-special-service',
    group: 'Visitors',
    title: 'Special service',
    description: 'One service out of the ordinary: when, what to expect, and an invitation.',
    sections: () =>
      page(
        hero({
          eyebrow: example('A special service'),
          headline: example('A name for the service'),
          subhead: example('One sentence on what it is and who it is for.'),
          primary: planVisit(),
        }),
        times(
          'When and where',
          [
            time(
              example('The day'),
              example('Sunday, 10:45 am'),
              example('At the church, {address}.'),
            ),
          ],
          ['Everyone is welcome.'],
        ),
        richText('What to expect', [
          example(
            'Two or three sentences: how long it lasts, what happens, whether there is a meal or childcare.',
          ),
        ]),
        askBand('Questions?', 'Call the church office at {phone}, or send us a message.'),
      ),
  },
  {
    id: 'page-event',
    group: 'Visitors',
    title: 'Event',
    description: 'A church event: what, when, a sign-up form and the questions people ask.',
    sections: () =>
      page(
        hero({
          eyebrow: example('Coming up'),
          headline: example('The name of the event'),
          subhead: example('What it is, in one sentence.'),
        }),
        imageText(
          'The details',
          [
            example('When it is, where, who it is for and what to bring.'),
            example('Anything it costs, or that it is free.'),
          ],
          { eyebrow: example('Saturday, May 9') },
        ),
        churchTracForm('Sign up', 'Fill in the form and the church office will be in touch.'),
        faq('Questions', [
          qa(example('Can I bring a friend?'), example('Yes. Everyone is welcome.')),
          qa(
            example('Is there childcare?'),
            example('Say what there is for children, or that children come too.'),
          ),
        ]),
      ),
  },

  // ── Ministries ─────────────────────────────────────────────────────────────
  {
    id: 'page-ministry',
    group: 'Ministries',
    title: 'A ministry',
    description: 'A page for one ministry: who it is for, when it meets, who to talk to.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Ministries',
          headline: example('The ministry’s name'),
          subhead: example('Who it is for and what it does, in one sentence.'),
        }),
        imageText('What we do', [
          example('Two or three sentences about the ministry, in your own words.'),
          example('A line about how someone can join in.'),
        ]),
        times('When we meet', [
          time(example('Wednesdays'), example('6:00 pm'), example('In the fellowship hall.')),
        ]),
        askBand('Want to know more?', example('The ministry leader would love to hear from you.')),
      ),
  },
  {
    id: 'page-children-youth',
    group: 'Ministries',
    title: 'Children or youth',
    description:
      'For families: what happens for children or teenagers, safety, and how to sign up.',
    sections: () =>
      page(
        hero({
          eyebrow: example('Children'),
          headline: example('A place for your children'),
          subhead: example('One sentence on what children or teenagers do here.'),
          primary: planVisit(),
        }),
        imageText('On a Sunday', [
          example('What happens for children during the service, by age.'),
          example('Where to go when you arrive.'),
        ]),
        faq('Questions parents ask', [
          qa(
            'Is it safe?',
            example('Every volunteer has a background check, and children are signed in and out.'),
          ),
          qa('Can my child stay with me?', 'Yes. Children are always welcome in worship.'),
        ]),
        churchTracForm('Tell us about your family', 'So we can have a name tag and a seat ready.'),
      ),
  },
  {
    id: 'page-bible-study',
    group: 'Ministries',
    title: 'Bible study or group',
    description: 'A study or small group: what it reads, when it meets, how to join.',
    sections: () =>
      page(
        hero({
          eyebrow: example('Bible study'),
          headline: example('The name of the group'),
          subhead: example('What the group reads or talks about, in one sentence.'),
        }),
        times(
          'When we meet',
          [time(example('Tuesdays'), example('10:00 am'), example('In the library, with coffee.'))],
          ['New people are always welcome, any week.'],
        ),
        richText('What we are reading', [
          example('The book or the passage this season, and who leads.'),
        ]),
        askBand('Come along', 'No sign-up needed. Just come, or ask the office first.'),
      ),
  },
  {
    id: 'page-missions',
    group: 'Ministries',
    title: 'Missions and outreach',
    description: 'The church’s work beyond its walls: partners, photos and how to help.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Missions',
          headline: example('Serving Muncie and the world'),
          subhead: example('One sentence on why the church gives and goes.'),
        }),
        cards('Who we work with', [
          card(
            example('A local partner'),
            example('What they do and how the church helps.'),
            button(example('Find out more')),
          ),
          card(
            example('A mission partner'),
            example('Where they serve and what the church sends.'),
            button(example('Find out more')),
          ),
        ]),
        gallery('Photos'),
        give('Give to missions', example('Every gift marked for missions goes to these partners.')),
      ),
  },

  // ── Life events ────────────────────────────────────────────────────────────
  {
    id: 'page-baptism',
    group: 'Life events',
    title: 'Baptism',
    description: 'What baptism means here, what happens, and how to ask about it.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Baptism',
          headline: example('Thinking about baptism?'),
          subhead: example('One sentence on what baptism means at First Baptist.'),
        }),
        scripture(
          'Therefore we are buried with him by baptism into death: that like as Christ was raised up from the dead by the glory of the Father, even so we also should walk in newness of life.',
          'Romans 6:4',
        ),
        richText('What happens', [
          example('A conversation with the pastor first, then baptism in a Sunday service.'),
          example('What to wear and bring.'),
        ]),
        churchTracForm('Talk to us about baptism', 'Send a note and the pastor will be in touch.'),
      ),
  },
  {
    id: 'page-membership',
    group: 'Life events',
    title: 'Becoming a member',
    description: 'The steps to joining the church, as a timeline, and who to ask.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Membership',
          headline: example('Making First Baptist your home'),
          subhead: example('One sentence on what membership means here.'),
        }),
        timeline('The steps', [
          row(
            example('Step 1'),
            example('Come and visit'),
            example('Join us on a Sunday at {service time}.'),
          ),
          row(
            example('Step 2'),
            example('Meet the pastor'),
            example('A friendly conversation about faith and the church.'),
          ),
          row(
            example('Step 3'),
            example('Be welcomed'),
            example('The church welcomes you in a Sunday service.'),
          ),
        ]),
        askBand(
          'Ready to take a step?',
          'Call the church office at {phone}, or send us a message.',
        ),
      ),
  },
  {
    id: 'page-funeral',
    group: 'Life events',
    title: 'Funerals and memorials',
    description: 'For families planning a funeral: what the church offers and who to call.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Funerals',
          headline: example('We are here for you'),
          subhead: example('One sentence of comfort, and that the church can help.'),
        }),
        scripture('Blessed are they that mourn: for they shall be comforted.', 'Matthew 5:4'),
        richText('What the church offers', [
          example(
            'A service in the sanctuary, the pastor’s care, and a meal for the family afterward.',
          ),
          example('Whether the church can help for families who are not members.'),
        ]),
        askBand('Call the church office', 'The office is ready to help at {phone}.'),
      ),
  },

  // ── Church year ────────────────────────────────────────────────────────────
  {
    id: 'page-christmas',
    group: 'Church year',
    title: 'Advent and Christmas',
    description: 'The Christmas services, a verse and an invitation.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Christmas',
          headline: example('Christmas at First Baptist'),
          subhead: example('Come and hear the Christmas story again.'),
          primary: planVisit(),
        }),
        ...adventSections(),
      ),
  },
  {
    id: 'page-easter',
    group: 'Church year',
    title: 'Holy Week and Easter',
    description: 'Palm Sunday, Good Friday and Easter services, a verse and an invitation.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Easter',
          headline: example('Easter at First Baptist'),
          subhead: example('Walk through Holy Week with us.'),
          primary: planVisit(),
        }),
        ...easterSections(),
      ),
  },
  {
    id: 'page-vbs',
    group: 'Church year',
    title: 'Vacation Bible School',
    description: 'What VBS is, the dates, sign-up and the questions parents ask.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Summer',
          headline: example('Vacation Bible School'),
          subhead: example('A week of fun and faith for children.'),
          primary: systemButton(example('Sign up'), '{connect}'),
        }),
        ...vbsSections(),
      ),
  },
  {
    id: 'page-thanksgiving',
    group: 'Church year',
    title: 'Thanksgiving',
    description: 'A verse and an invitation to the church dinner.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Thanksgiving',
          headline: example('Give thanks with us'),
          subhead: example('A meal, a service, and a full table.'),
        }),
        ...thanksgivingSections(),
      ),
  },
  {
    id: 'page-mission-offering',
    group: 'Church year',
    title: 'Mission offering',
    description: 'What a special offering is for, and a give button.',
    sections: () =>
      page(
        hero({
          eyebrow: 'Missions',
          headline: example('This year’s mission offering'),
          subhead: example('One sentence on who it helps.'),
        }),
        ...missionOfferingSections(),
      ),
  },
  {
    id: 'page-memorial',
    group: 'Church year',
    title: 'Memorial for a member',
    description: 'A verse, a few words, and the service times. Only with the family’s blessing.',
    sections: () =>
      page(
        hero({
          eyebrow: 'In memory',
          headline: example('The person’s name'),
          subhead: example('Their years, like 1938 to 2026.'),
        }),
        ...memorialSections(),
      ),
  },

  // ── News and records ───────────────────────────────────────────────────────
  {
    id: 'page-documents',
    group: 'News and records',
    title: 'Documents and reports',
    description: 'A list of files to open: annual reports, minutes, a budget.',
    sections: () =>
      page(
        hero({
          eyebrow: example('Records'),
          headline: example('Reports and minutes'),
          subhead: example('One sentence on what is here and who it is for.'),
        }),
        documents('Documents'),
      ),
  },
  {
    id: 'page-photo-album',
    group: 'News and records',
    title: 'Photo album',
    description: 'Photos from an event or a season, with a few words.',
    sections: () =>
      page(
        hero({
          eyebrow: example('Photos'),
          headline: example('The event or season'),
          subhead: example('When it was, and one line about it.'),
        }),
        gallery('Photos'),
        quote(example('A word from someone who was there.'), example('Their name')),
      ),
  },
  {
    id: 'page-video',
    group: 'News and records',
    title: 'A video',
    description: 'One video, like a special service or a ministry story, with a few words.',
    sections: () =>
      page(
        hero({
          eyebrow: example('Watch'),
          headline: example('The title of the video'),
          subhead: example('One sentence on what it is.'),
        }),
        video('Watch', example('When it was recorded.')),
        richText('About it', [example('Two or three sentences of background.')]),
      ),
  },

  // ── Blank ──────────────────────────────────────────────────────────────────
  {
    id: 'page-simple',
    group: 'Blank',
    title: 'Simple page',
    description: 'A page heading, then words. Good for most pages.',
    sections: () =>
      page(
        hero({
          headline: example('Page title'),
          subhead: example('One sentence that says what this page is about.'),
        }),
        richText(example('A heading'), [example('A paragraph of words.')]),
      ),
  },
  {
    id: 'page-blank',
    group: 'Blank',
    title: 'Blank page',
    description: 'Nothing on it. Add the sections yourself.',
    sections: () => [],
  },
];
