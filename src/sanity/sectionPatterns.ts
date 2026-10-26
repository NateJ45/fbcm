// Safe to edit by hand
// =============================================================================
// The church year's saved sections (the authoring kit, PORTS.md card 109)
// =============================================================================
// Sets of sections the church uses every year, ready to drop onto any page
// with "Insert a saved section" (as a copy, or synced once it is published):
// Advent and Christmas, Holy Week and Easter, Vacation Bible School, the fall
// kickoff, Thanksgiving, a weather closing, a mission offering, a memorial,
// and (the builder kit, starter PORTS.md card 173) a dated notice and an
// event's details with its schedule.
//
// The same section lists are reused by the seasonal page templates in
// src/sanity/pageTemplates.ts, so a "Christmas" page and a "Christmas" saved
// section say the same thing. They follow the copy rules in templateBlocks.ts,
// and src/lib/authoring.test.ts checks them like the templates.
//
// HOW THEY REACH THE STUDIO. Saved sections are documents, so these words have
// to be copied into the dataset: scripts/content/seed-section-patterns.mjs
// does it, one DRAFT per pattern, never overwriting. It is dry by default, and
// on this site it is run with --apply only with Nathan's OK at the time
// (docs/PENDING.md).
//
// No `sanity` import here: node --test loads this file directly.
// =============================================================================

import { freshKeys } from '../lib/authoring.ts';
import {
  button,
  ctaBand,
  daysFromNow,
  eventDate,
  eventDetails,
  notice,
  schedule,
  scheduleDay,
  slot,
  example,
  faq,
  give,
  imageText,
  qa,
  richText,
  scripture,
  systemButton,
  time,
  times,
  type Rec,
} from './templateBlocks.ts';

export interface SectionPattern {
  /** Stable id; the saved section's document id is `pattern-<id>`. */
  id: string;
  /** Its name in Saved sections and in the insert menu. */
  title: string;
  /** The saved section's note: when to use it. */
  note: string;
  /** The sections, with fresh keys every call. */
  sections: () => Rec[];
}

const list = (...sections: Rec[]) => freshKeys(sections);

// ── The section lists (shared with the seasonal page templates) ──────────────

export const adventSections = (): Rec[] => [
  times(
    'Christmas at First Baptist',
    [
      time(
        'Advent Sundays',
        '{service time}',
        'Each Sunday in December we light a candle on the Advent wreath.',
      ),
      time(
        example('Christmas Eve'),
        example('Thursday, December 24, 7:00 pm'),
        example('Candlelight, carols and the Christmas story.'),
      ),
    ],
    [
      'Everyone is welcome, whatever you believe.',
      example('Children are welcome in the service, and there is a nursery.'),
    ],
    'Advent and Christmas',
  ),
  scripture(
    'For unto you is born this day in the city of David a Saviour, which is Christ the Lord.',
    'Luke 2:11',
  ),
  ctaBand(
    'Come home for Christmas',
    'Bring a friend, a neighbor or the whole family. There is a seat for you.',
    button(example('Plan your visit')),
  ),
];

export const easterSections = (): Rec[] => [
  times(
    'Holy Week and Easter',
    [
      time(
        example('Palm Sunday'),
        '{service time}',
        example('The story of Jesus entering Jerusalem.'),
      ),
      time(
        example('Good Friday'),
        example('Friday, 7:00 pm'),
        example('A quiet service of readings and prayer.'),
      ),
      time(
        example('Easter Sunday'),
        '{service time}',
        'Christ is risen. Come and celebrate with us.',
      ),
    ],
    [
      'Everyone is welcome.',
      example('Easter breakfast in the fellowship hall before the service.'),
    ],
    'Holy Week',
  ),
  scripture('He is not here: for he is risen, as he said.', 'Matthew 28:6'),
  ctaBand(
    'Celebrate Easter with us',
    'Come as you are. We would love to see you.',
    button(example('Plan your visit')),
  ),
];

export const vbsSections = (): Rec[] => [
  imageText(
    example('Vacation Bible School'),
    [
      example(
        'A week of songs, stories, crafts and games for children from age four through fifth grade.',
      ),
      example('Monday to Friday, June 15 to 19, 9:00 am to noon. Free.'),
    ],
    { eyebrow: 'For children', cta: systemButton(example('Sign up'), '{connect}') },
  ),
  faq('Questions parents ask', [
    qa(
      'Who can come?',
      example(
        'Any child from age four through fifth grade. You do not need to be part of the church.',
      ),
    ),
    qa(
      'Is it safe?',
      example(
        'Every volunteer has a background check, and children are signed in and out each day.',
      ),
    ),
    qa('What should my child bring?', example('Just a water bottle. We provide a snack.')),
  ]),
];

export const kickoffSections = (): Rec[] => [
  imageText(
    example('Fall kickoff Sunday'),
    [
      example(
        'Wednesday nights, Sunday school and the youth group start again for the fall. Come and see what is new.',
      ),
      example('Sunday, September 13, after the service, with lunch on the lawn.'),
    ],
    { eyebrow: 'A new season', cta: systemButton('See the calendar', '{calendar}') },
  ),
];

export const thanksgivingSections = (): Rec[] => [
  scripture(
    'O give thanks unto the Lord; for he is good: for his mercy endureth for ever.',
    'Psalm 107:1',
    'Give thanks',
  ),
  ctaBand(
    example('Thanksgiving dinner at church'),
    example(
      'Sunday, November 22, after the service. Bring a dish to share, or just bring yourself.',
    ),
    systemButton(example('Let us know you are coming'), '{connect}'),
  ),
];

export const closingSections = (): Rec[] => [
  richText(
    example('No service this Sunday'),
    [
      example(
        'Because of the snow and ice, there is no service at the church this Sunday. Stay safe and warm.',
      ),
      'If you can, join us online: the service will be on YouTube at {time}.',
    ],
    'A change this week',
  ),
];

export const missionOfferingSections = (): Rec[] => [
  richText(
    example('Our mission offering'),
    [
      example(
        'Each year the church gives a special offering for mission work beyond Muncie. This year it supports a partner you can name here.',
      ),
      example('Give on a Sunday in the offering plate, or online.'),
    ],
    'Missions',
  ),
  give(example('Give to the mission offering'), example('Every gift goes to the mission partner.')),
];

export const memorialSections = (): Rec[] => [
  scripture(
    'I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live.',
    'John 11:25',
  ),
  richText(
    example('In loving memory of the person’s name'),
    [
      example('A few words about them, written with the family.'),
      example(
        'Visitation: Friday, 5:00 to 7:00 pm. Funeral service: Saturday, 11:00 am, at the church, {address}.',
      ),
    ],
    'Remembering',
  ),
];

/** A notice that takes itself down after its last day (the builder kit). */
export const closureNoticeSections = (): Rec[] => [
  notice(
    example(
      'The church office is closed Monday for the holiday. Call (765) 555-0100 in an emergency.',
    ),
    { urgency: 'urgent', label: example('Closed') },
  ),
];

/** An event's when and where, then its schedule. At the church unless a place is typed. */
export const eventDetailsSections = (): Rec[] => [
  eventDetails({
    eyebrow: example('Save the date'),
    title: example('The name of the event'),
    dates: [eventDate(daysFromNow(30), { startTime: '17:30', endTime: '19:00' })],
    note: example('Who it is for and what to bring.'),
  }),
  schedule('', [
    scheduleDay('', [
      slot('17:30', example('Doors open')),
      slot('18:00', example('Supper')),
      slot('18:45', example('A closing prayer')),
    ]),
  ]),
];

// ── The saved sections, in the order they are listed ────────────────────────

export const SECTION_PATTERNS: SectionPattern[] = [
  {
    id: 'advent-christmas',
    title: 'Advent and Christmas',
    note: 'The Christmas times, a verse and an invitation. For the home page from late November.',
    sections: () => list(...adventSections()),
  },
  {
    id: 'holy-week-easter',
    title: 'Holy Week and Easter',
    note: 'Palm Sunday, Good Friday and Easter times, a verse and an invitation. For the home page in Lent.',
    sections: () => list(...easterSections()),
  },
  {
    id: 'vbs',
    title: 'Vacation Bible School',
    note: 'What it is, when, a sign-up button and the questions parents ask. For the home page in spring.',
    sections: () => list(...vbsSections()),
  },
  {
    id: 'fall-kickoff',
    title: 'Fall kickoff',
    note: 'Wednesday nights and Sunday school starting again. For August and September.',
    sections: () => list(...kickoffSections()),
  },
  {
    id: 'thanksgiving',
    title: 'Thanksgiving',
    note: 'A verse and an invitation to the church dinner. For November.',
    sections: () => list(...thanksgivingSections()),
  },
  {
    id: 'weather-closing',
    title: 'Weather closing',
    note: 'No service this Sunday. Drag it to the top of the home page, and put up a red banner too.',
    sections: () => list(...closingSections()),
  },
  {
    id: 'mission-offering',
    title: 'Mission offering',
    note: 'What the offering is for, and a give button. For the weeks of the offering.',
    sections: () => list(...missionOfferingSections()),
  },
  {
    id: 'memorial',
    title: 'Memorial for a member',
    note: 'A verse, a few words about them, and the visitation and service times. Only with the family’s blessing.',
    sections: () => list(...memorialSections()),
  },
  {
    id: 'closure-notice',
    title: 'Closed notice',
    note: 'A short notice that shows between the dates you set, then takes itself down. Set "Show from" and "Show until".',
    sections: () => list(...closureNoticeSections()),
  },
  {
    id: 'event-details',
    title: 'Event details and schedule',
    note: 'The date, time and place with "Add to my calendar" and directions, then the times. Leave "Where" empty for the church.',
    sections: () => list(...eventDetailsSections()),
  },
];
