// Safe to edit by hand
// =============================================================================
// The church's Quick update jobs that need no code (PORTS.md card 137)
// =============================================================================
// Plain data, kept out of kit.config.ts so src/sanity/quick-jobs.test.ts can
// check every job in bare Node (the kit's own `jobProblems`). Each one is a job
// the office does now and then, written as a card 137 job: the kit does the
// saving, so no function is needed. The weekly forms that build a whole
// document (the sermon preview, the banner, the news post) stay in
// kit.config.ts with their tested builders in src/lib/quick-updates.ts.
//
// Where each one is planned: docs/agent/studio-plan.md. Words follow the
// guides' rules: plain, warm, no em-dashes.
// =============================================================================

import type { QuickForm } from './kit/types';
import { NOTICE_MAX } from '../lib/quick-updates.ts';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** The Visitor's own page and the list of issues on it (scripts/pages/visitor.mjs). */
export const VISITOR_PAGE_ID = 'page-visitor';
export const VISITOR_LIST = 'pageBuilder[_key=="visitor-issues"].docs';

/** A banner for a season: the same announcement the weekly banner makes, with a fixed name. */
function seasonalBanner(
  id: string,
  title: string,
  detail: string,
  when: { from: string; to: string },
  messageHint: string,
): QuickForm {
  return {
    id,
    title,
    detail,
    meaning: 'notice',
    when,
    submitLabel: 'Put it on the website',
    job: {
      kind: 'create',
      type: 'announcement',
      defaults: { internalTitle: `${title} (Quick update)`, style: 'info', enabled: true },
    },
    fields: [
      {
        name: 'message',
        title: 'What the banner says',
        kind: 'text',
        required: true,
        max: NOTICE_MAX,
        description: messageHint,
      },
      {
        name: 'endDate',
        title: 'Take it down after',
        kind: 'datetime',
        required: true,
        description: 'Pick the day and a time that evening.',
      },
    ],
    doneMessage:
      'The banner will be on the website in a few minutes, and it takes itself down after the day you picked.',
  };
}

export const QUICK_JOBS_MONTHLY: QuickForm[] = [
  {
    id: 'visitor',
    title: "Add this month's Visitor",
    detail: 'The newsletter: pick the month, check the year and add the PDF.',
    meaning: 'download',
    submitLabel: 'Add it to The Visitor',
    job: {
      kind: 'append',
      doc: VISITOR_PAGE_ID,
      type: 'page',
      array: VISITOR_LIST,
      itemType: 'listedDocument',
      at: 'start',
    },
    fields: [
      {
        name: 'title',
        title: 'The month',
        kind: 'select',
        required: true,
        options: MONTHS.map((m) => ({ title: m, value: m })),
        initial: (now) => MONTHS[now.getMonth()] ?? 'January',
        description: 'The month on the front of the newsletter.',
      },
      {
        name: 'year',
        title: 'The year',
        kind: 'number',
        required: true,
        initial: (now) => String(now.getFullYear()),
        description: 'Four digits, like 2026.',
      },
      {
        name: 'file',
        title: 'The newsletter PDF',
        kind: 'file',
        required: true,
        accept: 'application/pdf',
        description: 'The website draws the cover from its first page.',
      },
    ],
    doneMessage:
      'The new issue will be on The Visitor page and the home page in a few minutes. Open The Visitor to check it.',
  },
];

export const QUICK_JOBS_OFTEN: QuickForm[] = [
  {
    id: 'take-down-banner',
    title: 'Take down a banner',
    detail: 'Switch off a banner that is still up, without deleting it.',
    meaning: 'notice',
    submitLabel: 'Take it down',
    job: {
      kind: 'edit',
      pick: {
        type: 'announcement',
        filter: 'enabled == true',
        order: '_updatedAt desc',
        titleField: 'internalTitle',
        label: 'Which banner?',
      },
    },
    fields: [
      {
        name: 'enabled',
        title: 'Show this banner',
        kind: 'boolean',
        description:
          'Untick it to take the banner down. It stays in the list if you want it again.',
      },
    ],
    doneTitle: 'Done. The banner is off.',
    doneMessage: 'It is gone from the website in a few minutes.',
  },
  {
    id: 'church-details',
    title: 'Change the service time or phone',
    detail: 'Every page that says the time or the phone number reads it from here.',
    meaning: 'times',
    submitLabel: 'Save the change',
    job: { kind: 'edit', doc: 'siteSettings' },
    fields: [
      {
        name: 'serviceTime',
        title: 'Service time',
        kind: 'string',
        max: 60,
        description: 'As it should read on the page, like "Sundays at 10:45 am".',
      },
      {
        name: 'phone',
        title: 'Church phone number',
        kind: 'string',
        max: 40,
        description: 'Like "(765) 555-0100". Leave it as it is if it has not changed.',
      },
    ],
    doneMessage: 'Every page shows the new details in a few minutes.',
  },
  {
    id: 'staff-on-page',
    title: 'Show or hide a staff member',
    detail: 'For someone who joins, leaves or is away. Their details stay in the Studio.',
    meaning: 'people',
    submitLabel: 'Save the change',
    job: {
      kind: 'edit',
      pick: {
        type: 'staffMember',
        order: 'name asc',
        titleField: 'name',
        label: 'Who?',
      },
    },
    fields: [
      {
        name: 'showOnSite',
        title: 'Show on the Staff page',
        kind: 'boolean',
        description: 'Untick it to take them off the website for now.',
      },
    ],
    doneMessage: 'The Staff page changes in a few minutes.',
  },
];

/** Christmas and Easter, shown only in their weeks so the list stays short the rest of the year. */
export const QUICK_JOBS_SEASONAL: QuickForm[] = [
  seasonalBanner(
    'christmas-banner',
    'Christmas services banner',
    'Shows from mid-November to Christmas Day.',
    { from: '11-15', to: '12-26' },
    'Like "Christmas Eve candlelight service, December 24 at 6 pm." Check the time first.',
  ),
  seasonalBanner(
    'easter-banner',
    'Holy Week and Easter banner',
    'Shows from March to the end of April.',
    { from: '03-01', to: '04-30' },
    'Like "Easter Sunday service at 10:45 am." Check the time first.',
  ),
];

export const QUICK_JOBS: QuickForm[] = [
  ...QUICK_JOBS_MONTHLY,
  ...QUICK_JOBS_OFTEN,
  ...QUICK_JOBS_SEASONAL,
];
