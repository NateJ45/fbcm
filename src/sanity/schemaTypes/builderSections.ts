// Safe to edit by hand
// =============================================================================
// The builder kit: smaller blocks for building a page without a developer
// (starter PORTS.md card 173, applied 2026-10-26)
// =============================================================================
// The general library (sections.ts) and the church library (churchSections.ts)
// cover the big pieces and the church's own bands. These are the smaller pieces
// a page builder like Squarespace offers, so the church office can put together
// an event page, a closing notice or a page of information on its own:
//
//   Text in columns, a row of buttons, one wide photo, tabs, a countdown, a
//   dated notice, event details (dates, times, place, "Add to my calendar",
//   directions) and a schedule.
//
// FBCM TOOK EIGHT OF THE STARTER'S TWELVE. The other four duplicate a church
// block this site already has: fold-out questions (the Questions and answers
// band, faqSection, already opens like this), the timeline (timelineSection,
// the church's history rail), the letter (letterSection, the pastors' letter)
// and cards with photos (linkCardsSection, whose cards carry photos). The
// starter's "row of buttons OR link cards" is buttons only here for the same
// reason.
//
// Spread into pageSectionSchemas (sections.ts), so every page builder offers
// them, and grouped in the "+ Add item" menu by BUILDER_INSERT_GROUPS below
// (merged in by withSiteGroups() in sections.ts). Each renders through
// src/components/builder-blocks/ (BuilderBlock.astro picks the component), and
// each has a fixture on /styleguide/sections/ and a picture in
// public/section-thumbnails/ (authoring.test.ts checks both). Logic,
// unit-tested: src/lib/builder-blocks.ts.
//
// THE RULES THESE FOLLOW:
//   - Rule 9: no colour, surface, tone or background field; the cadence gives
//     each block its paper (sectionCadence.ts) and section-fields.test.ts
//     reads this file. The notice's "how important" choice is `urgency`: it
//     says what the notice IS, and the component decides how that looks.
//   - Rule 15: nothing computable is typed. Days left, whether a notice is
//     showing, which event dates have passed, the calendar file, the
//     directions link and, with no place typed, the church's address (from
//     Site settings) are worked out at build time.
//   - Rule 8b: the dropdowns that drive logic (`urgency`, `startTime`,
//     `endTime`) are in NON_STEGA_FIELDS (src/lib/non-stega-fields.ts).
//   - Words: plain American English for the church office. No "CTA" or
//     "slug", no em-dashes in anything a visitor reads (rule 2).
// =============================================================================

import { defineArrayMember, defineField, defineType } from 'sanity';
import { BellIcon } from '@sanity/icons/Bell';
import { ChartUpwardIcon } from '@sanity/icons/ChartUpward';
import { MobileDeviceIcon } from '@sanity/icons/MobileDevice';
import { SyncIcon } from '@sanity/icons/Sync';
import { ThLargeIcon } from '@sanity/icons/ThLarge';
import { ThListIcon } from '@sanity/icons/ThList';
import { UsersIcon } from '@sanity/icons/Users';
import { CalendarIcon } from '@sanity/icons/Calendar';
import { ClockIcon } from '@sanity/icons/Clock';
import { ImageIcon } from '@sanity/icons/Image';
import { LaunchIcon } from '@sanity/icons/Launch';
import { LinkIcon } from '@sanity/icons/Link';
import { MenuIcon } from '@sanity/icons/Menu';
import { SplitVerticalIcon } from '@sanity/icons/SplitVertical';
import { anchorField } from './_anchorField';
import { TIME_OPTIONS } from '../../lib/builder-blocks.ts';
import { BLOCK_ICONS } from '../../lib/block-icons.ts';
import type { InsertGroup } from '../../lib/insert-groups.ts';

// ── Shared fields ────────────────────────────────────────────────────────────

const headingField = () =>
  defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' });

const introField = () =>
  defineField({
    name: 'intro',
    title: 'A sentence or two under the heading (optional)',
    type: 'text',
    rows: 2,
  });

/** A photo with its description for people who cannot see it. */
const photoField = (
  name: string,
  title: string,
  opts: { required?: boolean; description?: string } = {},
) =>
  defineField({
    name,
    title,
    type: 'image',
    description: opts.description,
    options: { hotspot: true },
    validation: opts.required ? (R) => R.required() : undefined,
    fields: [
      defineField({
        name: 'alt',
        title: 'Describe the photo',
        type: 'string',
        description: 'A few words for people who cannot see it, and for search engines.',
        validation: (R) => R.required(),
      }),
    ],
  });

const linkField = (title = 'Button (optional)') =>
  defineField({ name: 'link', title, type: 'ctaBlock' });

/** Short formatted text: paragraphs, bold, italic, lists and links. */
const simpleText = (name = 'body', title = 'Text') =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [{ title: 'Normal', value: 'normal' }],
        lists: [
          { title: 'Bullet list', value: 'bullet' },
          { title: 'Numbered list', value: 'number' },
        ],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [
                defineField({
                  name: 'href',
                  title: 'Web address',
                  type: 'url',
                  description: 'A page on this site (starting with /) or a full https:// address.',
                  validation: (R) =>
                    R.uri({ allowRelative: true, scheme: ['https', 'http', 'mailto', 'tel'] }),
                }),
              ],
            },
          ],
        },
      }),
    ],
  });

const timeField = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: 'string', description, options: { list: TIME_OPTIONS } });

// ── Text in columns ──────────────────────────────────────────────────────────
export const columnsSection = defineType({
  name: 'columnsSection',
  title: 'Text in columns',
  type: 'object',
  icon: SplitVerticalIcon,
  description: 'Two or three columns of text side by side. On a phone they stack.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'textColumns',
      title: 'Columns',
      type: 'array',
      validation: (R) => R.min(2).max(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'textColumn',
          title: 'Column',
          fields: [
            defineField({ name: 'heading', title: 'Column heading (optional)', type: 'string' }),
            simpleText('body', 'Text'),
          ],
          preview: {
            select: { title: 'heading' },
            prepare: ({ title }) => ({ title: title || 'Column' }),
          },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', columns: 'textColumns' },
    prepare: ({ title, columns }) => ({
      title: title || 'Text in columns',
      subtitle: `${Array.isArray(columns) ? columns.length : 0} columns`,
    }),
  },
});

// ── Row of buttons ───────────────────────────────────────────────────────────
export const buttonRowSection = defineType({
  name: 'buttonRowSection',
  title: 'Row of buttons',
  type: 'object',
  icon: LinkIcon,
  description:
    'Two to six buttons side by side, like "Sign up", "Directions" and "Call the office". For cards with a photo and a sentence, use the link cards.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'links',
      title: 'Buttons',
      type: 'array',
      validation: (R) => R.min(2).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quickLink',
          title: 'Button',
          fields: [defineField({ name: 'link', title: 'Button', type: 'ctaBlock' })],
          preview: {
            select: { title: 'link.label' },
            prepare: ({ title }) => ({ title: title || 'Button' }),
          },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', links: 'links' },
    prepare: ({ title, links }) => ({
      title: title || 'Buttons',
      subtitle: `Row of buttons${Array.isArray(links) ? ` (${links.length})` : ''}`,
    }),
  },
});

// ── One wide photo ───────────────────────────────────────────────────────────
export const photoSection = defineType({
  name: 'photoSection',
  title: 'One wide photo',
  type: 'object',
  icon: ImageIcon,
  description:
    'A single photo across the page. For two or more photos, use the photo gallery; for a photo beside words, use image and text.',
  fields: [
    // No caption: the church's pages show photographs without visible captions
    // (DESIGN.md, Do's and Don'ts). The description is the photo's words.
    photoField('image', 'Photo', { required: true }),
    anchorField(),
  ],
  preview: {
    select: { title: 'image.alt', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'Wide photo',
      subtitle: 'Wide photo',
      media,
    }),
  },
});

// ── Tabs ─────────────────────────────────────────────────────────────────────
export const tabsSection = defineType({
  name: 'tabsSection',
  title: 'Tabs',
  type: 'object',
  icon: MenuIcon,
  description:
    'Two to five labeled tabs, each with its own text, like "Nursery", "Children" and "Youth". If a browser cannot run the tabs, every tab shows in turn.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'tabs',
      title: 'Tabs',
      type: 'array',
      validation: (R) => R.min(2).max(5),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tabPanel',
          title: 'Tab',
          fields: [
            defineField({
              name: 'label',
              title: 'Tab label',
              type: 'string',
              description: 'One or two words.',
              validation: (R) => R.required().max(30),
            }),
            simpleText('body', 'Text in this tab'),
          ],
          preview: { select: { title: 'label' } },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', tabs: 'tabs' },
    prepare: ({ title, tabs }) => ({
      title: title || 'Tabs',
      subtitle: Array.isArray(tabs)
        ? `Tabs: ${tabs.map((t: { label?: string }) => t?.label ?? '').join(', ')}`
        : 'Tabs',
    }),
  },
});

// ── Countdown ────────────────────────────────────────────────────────────────
export const countdownSection = defineType({
  name: 'countdownSection',
  title: 'Countdown to a date',
  type: 'object',
  icon: LaunchIcon,
  description:
    'Shows how many days are left until an event, then a "happening now" line during it and a thank-you line afterward. It changes on its own.',
  fields: [
    defineField({
      name: 'eventName',
      title: 'What you are counting down to',
      type: 'string',
      description: 'Like "Vacation Bible School".',
      validation: (R) => R.required().max(80),
    }),
    defineField({
      name: 'startDate',
      title: 'First day',
      type: 'date',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Last day (optional)',
      type: 'date',
      description: 'For an event that runs several days.',
      validation: (R) =>
        R.custom((end, ctx) => {
          const start = (ctx.parent as { startDate?: string } | undefined)?.startDate;
          return !end || !start || end >= start || 'The last day is before the first day.';
        }),
    }),
    introField(),
    defineField({
      name: 'duringText',
      title: 'What it says during the event',
      type: 'string',
      initialValue: 'It is happening now. Come and join us!',
    }),
    defineField({
      name: 'afterText',
      title: 'What it says afterward',
      type: 'string',
      description: 'Leave empty to hide the whole block once the event is over.',
      initialValue: 'Thank you to everyone who came!',
    }),
    linkField(),
    anchorField(),
  ],
  preview: {
    select: { title: 'eventName', start: 'startDate' },
    prepare: ({ title, start }) => ({
      title: title || 'Countdown',
      subtitle: start ? `Countdown to ${start}` : 'Countdown',
    }),
  },
});

// ── Dated notice ─────────────────────────────────────────────────────────────
// Self-contained: it draws its own slim band (BUILDER_SELF_CONTAINED below).
export const noticeSection = defineType({
  name: 'noticeSection',
  title: 'Notice with dates (a closing, a change of plans)',
  type: 'object',
  icon: BellIcon,
  description:
    'A short notice on this page that shows only between the dates you set, then takes itself down. For a notice across the top of every page, use the Announcement banner under Site settings.',
  fields: [
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
      description: 'One or two short sentences, like "No Wednesday supper this week."',
      validation: (R) => R.required().max(200),
    }),
    defineField({
      name: 'urgency',
      title: 'How important is it?',
      type: 'string',
      options: {
        list: [
          { title: 'Good to know', value: 'info' },
          { title: 'Urgent: a closing, a cancellation, a change of plans', value: 'urgent' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
    }),
    defineField({
      name: 'label',
      title: 'Small label (optional)',
      type: 'string',
      description:
        'The small word in front of the message. Leave it empty for "Notice" (or "Urgent"). A phone number in the message becomes a tap-to-call link on its own.',
      validation: (R) => R.max(30),
    }),
    linkField('Link for more details (optional)'),
    defineField({
      name: 'startDate',
      title: 'Show from',
      type: 'date',
      description: 'Leave empty to show it from the next website update.',
    }),
    defineField({
      name: 'endDate',
      title: 'Show until (this day included)',
      type: 'date',
      description:
        'The notice is gone the next day. Leave empty to keep it up until you remove it.',
      validation: (R) =>
        R.custom((end, ctx) => {
          const start = (ctx.parent as { startDate?: string } | undefined)?.startDate;
          return !end || !start || end >= start || 'The last day is before the first day.';
        }),
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'message', start: 'startDate', end: 'endDate', urgency: 'urgency' },
    prepare: ({ title, start, end, urgency }) => ({
      title: title || 'Notice',
      subtitle: `${urgency === 'urgent' ? 'Urgent notice' : 'Notice'}${
        start || end ? `, ${start ?? 'now'} to ${end ?? 'until removed'}` : ''
      }`,
    }),
  },
});

// ── Event details ────────────────────────────────────────────────────────────
export const eventDetailsSection = defineType({
  name: 'eventDetailsSection',
  title: 'Event details (date, time, place)',
  type: 'object',
  icon: CalendarIcon,
  description:
    'The when and where of one event, with an "Add to my calendar" link and directions made for you. Each date drops off the day after it happens, and the block disappears once every date has passed.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the name (optional)',
      type: 'string',
      description: 'A few words, like "Save the date".',
      validation: (R) => R.max(40),
    }),
    defineField({
      name: 'title',
      title: 'Name of the event',
      type: 'string',
      description: 'Like "Wednesday night supper".',
      validation: (R) => R.required().max(80),
    }),
    defineField({
      name: 'occurrences',
      title: 'Dates and times',
      type: 'array',
      description:
        'One line per date. Two sessions on the same day? Add the date twice, each with its own time and a label.',
      validation: (R) => R.required().min(1).max(12),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'eventDate',
          title: 'Date',
          fields: [
            defineField({
              name: 'date',
              title: 'Date',
              type: 'date',
              validation: (R) => R.required(),
            }),
            timeField('startTime', 'Starts at (optional)', 'Leave empty for an all-day event.'),
            timeField(
              'endTime',
              'Ends at (optional)',
              'Used for the calendar link. Without it the calendar holds an hour.',
            ),
            defineField({
              name: 'label',
              title: 'Label (optional)',
              type: 'string',
              description: 'Like "Morning session".',
              validation: (R) => R.max(60),
            }),
          ],
          preview: {
            select: { date: 'date', start: 'startTime', label: 'label' },
            prepare: ({ date, start, label }) => ({
              title: [date, start].filter(Boolean).join(' at ') || 'Date',
              subtitle: label,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'place',
      title: 'Where (optional)',
      type: 'text',
      rows: 2,
      description:
        'Leave empty when it is at the church: the address comes from Site settings > Church details. Otherwise the place and its street address, one line each, like "Camp Adventure" then "123 Main Street, Muncie, IN". Directions are worked out from it.',
    }),
    defineField({
      name: 'note',
      title: 'A few words about it (optional)',
      type: 'text',
      rows: 3,
      description: 'What it is, who it is for, what to bring. Two or three sentences read best.',
    }),
    photoField('image', 'Photo (optional)', {
      description: 'Shown beside the details on a computer, above them on a phone.',
    }),
    defineField({
      name: 'button',
      title: 'Main button (optional)',
      type: 'ctaBlock',
      description:
        'Sign up, or a link for more. "Add to my calendar" and "Directions" are added for you.',
    }),
    defineField({
      name: 'showCalendar',
      title: 'Show "Add to my calendar"',
      type: 'boolean',
      initialValue: true,
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'title', occ: 'occurrences', media: 'image' },
    prepare: ({ title, occ, media }) => ({
      title: title || 'Event details',
      subtitle: `Event details${Array.isArray(occ) && occ[0]?.date ? `, ${occ[0].date}` : ''}`,
      media,
    }),
  },
});

// ── Schedule ─────────────────────────────────────────────────────────────────
export const scheduleSection = defineType({
  name: 'scheduleSection',
  title: 'Schedule (times and what happens)',
  type: 'object',
  icon: ClockIcon,
  description:
    'A list of times and what happens at each, grouped by day if you like: a retreat, a VBS day, a Holy Week. For the church history year by year, use the timeline instead.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'days',
      title: 'Days',
      type: 'array',
      description:
        'One day is plenty for a single event (leave its name empty). Add more for a weekend or a week.',
      validation: (R) => R.required().min(1).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'scheduleDay',
          title: 'Day',
          fields: [
            defineField({
              name: 'title',
              title: 'Name of the day (optional)',
              type: 'string',
              description: 'Like "Saturday" or "Monday, June 15".',
              validation: (R) => R.max(50),
            }),
            defineField({
              name: 'items',
              title: 'What happens',
              type: 'array',
              validation: (R) => R.required().min(1).max(20),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'scheduleItem',
                  title: 'Time',
                  fields: [
                    timeField(
                      'startTime',
                      'Time (optional)',
                      'Leave empty for something with no set time.',
                    ),
                    defineField({
                      name: 'title',
                      title: 'What happens',
                      type: 'string',
                      description: 'Like "Doors open".',
                      validation: (R) => R.required().max(80),
                    }),
                    defineField({
                      name: 'note',
                      title: 'Short note (optional)',
                      type: 'string',
                      description: 'Like "In the fellowship hall".',
                      validation: (R) => R.max(140),
                    }),
                  ],
                  preview: {
                    select: { title: 'title', time: 'startTime', note: 'note' },
                    prepare: ({ title, time, note }) => ({
                      title: [time, title].filter(Boolean).join('  ') || 'Time',
                      subtitle: note,
                    }),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'title', items: 'items' },
            prepare: ({ title, items }) => ({
              title: title || 'Day',
              subtitle: `${Array.isArray(items) ? items.length : 0} times`,
            }),
          },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', days: 'days' },
    prepare: ({ title, days }) => ({
      title: title || 'Schedule',
      subtitle: `Schedule${Array.isArray(days) && days.length > 1 ? `, ${days.length} days` : ''}`,
    }),
  },
});

// ── Card 193 blocks (2026-10-27) ──────────────────────────────────────────────

const iconField = (title = 'Icon (optional)', description?: string) =>
  defineField({
    name: 'icon',
    title,
    type: 'string',
    description,
    options: { list: BLOCK_ICONS.map((i) => ({ title: i.title, value: i.value })) },
  });

const bodyField = (title = 'A few sentences (optional)') =>
  defineField({ name: 'body', title, type: 'text', rows: 3, validation: (R) => R.max(280) });

// ── Contact details ──────────────────────────────────────────────────────────
export const contactCardSection = defineType({
  name: 'contactCardSection',
  title: 'Contact details',
  type: 'object',
  icon: MobileDeviceIcon,
  description:
    'Phone, email, address and office hours on one card, with big Call and Email buttons if you want them. Everything fills itself from Site settings > Church details; type something here only for a different one, like a ministry with its own phone.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      initialValue: 'Get in touch',
    }),
    introField(),
    defineField({
      name: 'callButtons',
      title: 'Lead with big Call and Email buttons',
      type: 'boolean',
      description:
        'Two big buttons above the details. Good for a page where getting in touch is the point.',
      initialValue: false,
    }),
    defineField({
      name: 'phone',
      title: 'Phone (optional)',
      type: 'string',
      description: 'Leave empty to use the phone number in Site settings.',
    }),
    defineField({
      name: 'email',
      title: 'Email (optional)',
      type: 'string',
      description: 'Leave empty to use the public email in Site settings.',
      validation: (R) =>
        R.regex(/^\S+@\S+\.\S+$/, { name: 'email' }).warning(
          'That does not look like an email address.',
        ),
    }),
    defineField({
      name: 'address',
      title: 'Address (optional)',
      type: 'text',
      rows: 3,
      description:
        "Leave empty to use the church's address in Site settings. Otherwise one line each for the street and the town; a 'Get directions' link is made from it.",
    }),
    defineField({
      name: 'hours',
      title: 'Hours (optional)',
      type: 'text',
      rows: 4,
      description:
        'Leave empty to use the office hours in Site settings. Otherwise one line for each, like "Wednesdays, 6 pm to 8 pm".',
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Contact details', subtitle: 'Contact details' }),
  },
});

// ── Progress toward a goal ───────────────────────────────────────────────────
export const progressSection = defineType({
  name: 'progressSection',
  title: 'Progress toward a goal',
  type: 'object',
  icon: ChartUpwardIcon,
  description:
    'A bar that fills toward a goal: a fundraiser, a campaign, a target. You type two numbers; the bar, the percent and "to go" work themselves out.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'unit',
      title: 'What are you counting?',
      type: 'string',
      options: {
        list: [
          { title: 'Dollars', value: 'dollars' },
          { title: 'A plain number (people, meals, signatures)', value: 'number' },
        ],
        layout: 'radio',
      },
      initialValue: 'dollars',
    }),
    defineField({
      name: 'goal',
      title: 'Goal',
      type: 'number',
      description: 'Numbers only, like 50000.',
      validation: (R) => R.required().positive(),
    }),
    defineField({
      name: 'raised',
      title: 'So far',
      type: 'number',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'asOf',
      title: 'As of (optional)',
      type: 'date',
      description:
        'Shows "As of October 18, 2026" under the bar, so nobody wonders how old the number is.',
    }),
    linkField(),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', goal: 'goal', raised: 'raised' },
    prepare: ({ title, goal, raised }) => ({
      title: title || 'Progress toward a goal',
      subtitle: typeof goal === 'number' ? `${raised ?? 0} of ${goal}` : 'Progress',
    }),
  },
});

// ── Newsletter sign-up ───────────────────────────────────────────────────────

export const calendarSubscribeSection = defineType({
  name: 'calendarSubscribeSection',
  title: 'Add our calendar to your phone',
  type: 'object',
  icon: SyncIcon,
  description:
    'Buttons that add the church calendar to Google, Apple or Outlook, so new dates show up on people’s phones by themselves.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      initialValue: 'Never miss a date',
    }),
    introField(),
    defineField({
      name: 'feed',
      title: 'Calendar feed address (optional)',
      type: 'string',
      description:
        'Leave empty to use the church calendar in Church Trac (Site settings > Church systems > Events calendar). Otherwise the address of another calendar feed (it ends in .ics, or starts with webcal://), or a file this site publishes (a path starting with /, like /visit/sunday.ics).',
      validation: (R) =>
        R.custom((v) =>
          !v || /^(https:\/\/|webcal:\/\/|\/(?!\/))/i.test(String(v).trim())
            ? true
            : 'Start with https://, webcal:// or a /',
        ),
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Calendar buttons', subtitle: 'Add our calendar' }),
  },
});

// ── Cards with icons ─────────────────────────────────────────────────────────
export const iconCardsSection = defineType({
  name: 'iconCardsSection',
  title: 'Cards with icons',
  type: 'object',
  icon: ThLargeIcon,
  description:
    'Two to twelve open cards, each with a big icon (or a photo), a title and a few sentences. Three across on a computer, one on a phone.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      validation: (R) => R.required().min(2).max(12),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'iconCard',
          title: 'Card',
          fields: [
            iconField(),
            photoField('image', 'Photo (optional)', {
              description: 'With a photo the card shows the photo instead of the icon.',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (R) => R.required().max(60),
            }),
            bodyField(),
            defineField({
              name: 'note',
              title: 'Small note (optional)',
              type: 'string',
              description: 'A day, a reference, a size: shown small under the text.',
              validation: (R) => R.max(80),
            }),
            linkField('Link (optional)'),
          ],
          preview: {
            select: { title: 'title', subtitle: 'note', media: 'image' },
            prepare: ({ title, subtitle, media }) => ({ title: title || 'Card', subtitle, media }),
          },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', cards: 'cards' },
    prepare: ({ title, cards }) => ({
      title: title || 'Cards with icons',
      subtitle: `Cards with icons${Array.isArray(cards) ? ` (${cards.length})` : ''}`,
    }),
  },
});

// ── Steps on a path ──────────────────────────────────────────────────────────
// The inline sibling of processSection: that one draws the shared Process steps from their own
// collection (the Process page); this one holds its steps in the block, so any page can show a
// short path ("how it works", "what happens on the day") without a collection to keep.
export const stepsRailSection = defineType({
  name: 'stepsRailSection',
  title: 'Steps on a path',
  type: 'object',
  icon: ThListIcon,
  description:
    'Numbered steps down a line, each with an icon. For "how it works" or "what to expect". The numbers and the line are drawn for you.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      validation: (R) => R.required().min(2).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'railStep',
          title: 'Step',
          fields: [
            iconField(),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (R) => R.required().max(80),
            }),
            bodyField('A sentence or two (optional)'),
            linkField('Link (optional)'),
          ],
          preview: {
            select: { title: 'title', subtitle: 'body' },
            prepare: ({ title, subtitle }) => ({ title: title || 'Step', subtitle }),
          },
        }),
      ],
    }),
    defineField({
      name: 'firstStepCard',
      title: 'Set the first step apart on a card',
      type: 'boolean',
      description: 'Good when step one is the one that matters most.',
      initialValue: false,
    }),
    defineField({
      name: 'endHeading',
      title: 'Closing line (optional)',
      type: 'string',
      description: 'A line after the last step, like "Ready when you are."',
    }),
    linkField('Closing button (optional)'),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', steps: 'steps' },
    prepare: ({ title, steps }) => ({
      title: title || 'Steps on a path',
      subtitle: `Steps${Array.isArray(steps) ? ` (${steps.length})` : ''}`,
    }),
  },
});

// ── Hub: groups of cards with a sticky index ─────────────────────────────────
export const hubSection = defineType({
  name: 'hubSection',
  title: 'Groups of cards with an index',
  type: 'object',
  icon: UsersIcon,
  description:
    'A page of cards in named groups ("For families", "For students"), with an index that follows the scroll and jumps to a group. Every group shows at once. Good for a long list of ministries, groups or classes.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      description: 'Leave it empty when the page title already says it.',
    }),
    introField(),
    defineField({
      name: 'groups',
      title: 'Groups',
      type: 'array',
      description: 'Each group gets a place in the index. Keep the names short.',
      validation: (R) => R.required().min(1).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'hubGroup',
          title: 'Group',
          fields: [
            defineField({
              name: 'title',
              title: 'Group name',
              type: 'string',
              validation: (R) => R.required().max(24),
            }),
            defineField({
              name: 'line',
              title: 'One line about the group (optional)',
              type: 'string',
              validation: (R) => R.max(140),
            }),
            defineField({
              name: 'cards',
              title: 'Cards',
              type: 'array',
              validation: (R) => R.required().min(1).max(12),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'hubCard',
                  title: 'Card',
                  fields: [
                    photoField('image', 'Photo (optional)', {
                      description: 'Without a photo the card shows its icon.',
                    }),
                    iconField('Icon (shown when there is no photo)'),
                    defineField({
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                      validation: (R) => R.required().max(60),
                    }),
                    defineField({
                      name: 'label',
                      title: 'Who it is for (optional)',
                      type: 'string',
                      description: 'A few words, like "Families" or "Everyone".',
                      validation: (R) => R.max(40),
                    }),
                    defineField({
                      name: 'when',
                      title: 'When (optional)',
                      type: 'string',
                      description: 'Like "Saturdays, 10 am".',
                      validation: (R) => R.max(60),
                    }),
                    defineField({
                      name: 'place',
                      title: 'Where (optional)',
                      type: 'string',
                      validation: (R) => R.max(60),
                    }),
                    bodyField('A sentence or two (optional)'),
                    linkField('Link (optional)'),
                  ],
                  preview: {
                    select: { title: 'title', label: 'label', when: 'when', media: 'image' },
                    prepare: ({ title, label, when, media }) => ({
                      title: title || 'Card',
                      subtitle: [label, when].filter(Boolean).join(' · '),
                      media,
                    }),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'title', cards: 'cards' },
            prepare: ({ title, cards }) => ({
              title: title || 'Group',
              subtitle: `Cards${Array.isArray(cards) ? ` (${cards.length})` : ''}`,
            }),
          },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', groups: 'groups' },
    prepare: ({ title, groups }) => ({
      title: title || 'Groups of cards',
      subtitle: `Groups${Array.isArray(groups) ? ` (${groups.length})` : ''}`,
    }),
  },
});

// ── Exports ──────────────────────────────────────────────────────────────────

export const builderSectionSchemas = [
  columnsSection,
  buttonRowSection,
  photoSection,
  tabsSection,
  countdownSection,
  noticeSection,
  eventDetailsSection,
  scheduleSection,
  contactCardSection,
  progressSection,
  calendarSubscribeSection,
  iconCardsSection,
  stepsRailSection,
  hubSection,
];

/**
 * Where these blocks sit in the "+ Add item" menu. withSiteGroups() in
 * sections.ts merges these into the base groups by name: a group that exists
 * gains the types, a new one is added at the end.
 */
export const BUILDER_INSERT_GROUPS: InsertGroup[] = [
  {
    name: 'basics',
    title: 'Basics',
    of: [
      'columnsSection',
      'buttonRowSection',
      'tabsSection',
      'iconCardsSection',
      'stepsRailSection',
      'hubSection',
    ],
  },
  {
    name: 'contact',
    title: 'Contact and updates',
    of: ['contactCardSection', 'calendarSubscribeSection'],
  },
  { name: 'media', title: 'Photos and video', of: ['photoSection'] },
  {
    name: 'dates',
    title: 'Events and notices',
    of: [
      'eventDetailsSection',
      'scheduleSection',
      'countdownSection',
      'noticeSection',
      'progressSection',
    ],
  },
];

/** Blocks that draw their own band (the notice); the rest take the page cadence. */
export const BUILDER_SELF_CONTAINED = ['noticeSection'];
