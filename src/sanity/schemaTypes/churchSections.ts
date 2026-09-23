// scaffold: church
// The church blocks: what a church page needs and a service business does not. Every
// description says what to TYPE. No block carries a colour field: the dark bands
// (sundayTimes is cream, faq/scripture/give are indigo, heritage is brown) are dark
// by TYPE, which is what keeps SectionRenderer's cadence the only source of surface.
//
// scriptureBandSection.accentWord is a plain string, not a headingAccentField().
// It is deliberately NOT registered in src/lib/section-fields.ts: that registry's
// HEADING_ACCENT_FIELDS shape assumes the accent lives in a field literally named
// `headingAccent` beside a `heading`/`headline` field, and this block has neither
// (its words are `verse`/`reference`). The scripture accent is split at render
// time by splitHeadingAccent() directly (Task 5), not through the in-canvas
// overlay registry.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { anchorField } from './_anchorField';
import { sideOptions } from '../../lib/layout-variants';

const eyebrow = defineField({
  name: 'eyebrow',
  title: 'Small line above the heading',
  type: 'string',
  description: 'A few words, like "This Sunday". Leave blank for none.',
});
const heading = defineField({
  name: 'heading',
  title: 'Heading',
  type: 'string',
  description: 'One line.',
  validation: (r) => r.required(),
});

export const sundayTimesSection = defineType({
  name: 'sundayTimesSection',
  title: 'Sunday times and location',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    defineField({
      name: 'items',
      title: 'Three columns',
      type: 'array',
      validation: (r) => r.min(1).max(3),
      description: 'Up to three. The first usually carries the service time.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'timeItem',
          fields: [
            defineField({
              name: 'label',
              title: 'Small label',
              type: 'string',
              description: 'Like "Sunday worship".',
            }),
            defineField({
              name: 'big',
              title: 'Big line',
              type: 'string',
              description: 'Like "10:45 am". Leave blank for a text-only column.',
            }),
            defineField({
              name: 'body',
              title: 'Text',
              type: 'text',
              rows: 3,
              description: 'One or two sentences.',
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'big' } },
        }),
      ],
    }),
    defineField({
      name: 'doors',
      title: 'Doors and parking',
      type: 'array',
      description:
        'One entry per entrance, the accessible one first. Leave empty to show only the map and address.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'door',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Like "Adams Street circular drive".',
            }),
            defineField({ name: 'body', title: 'How to find it', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'name' } },
        }),
      ],
    }),
    defineField({
      name: 'showMap',
      title: 'Show the map and address',
      type: 'boolean',
      initialValue: true,
      description: 'Uses the map picture and address from Site settings.',
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({
      title: title || 'Sunday times',
      subtitle: 'Sunday times and location',
    }),
  },
});

export const timelineSection = defineType({
  name: 'timelineSection',
  title: 'Timeline',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      validation: (r) => r.min(1),
      description: 'In order from top to bottom.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'timelineRow',
          fields: [
            defineField({
              name: 'marker',
              title: 'Marker',
              type: 'string',
              description:
                'What sits in the left column: a time like "9:30" or a year like "1859".',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'body',
              title: 'Text',
              type: 'array',
              of: [{ type: 'block' }],
              description: 'A short paragraph or two.',
            }),
            defineField({
              name: 'note',
              title: 'Small note under the text',
              type: 'string',
              description: 'Like room numbers: "Rooms B-04, B-05, 201". Leave blank for none.',
            }),
            defineField({
              name: 'anchor',
              title: 'Link anchor',
              type: 'slug',
              options: { source: 'title' },
              description: 'Click Generate. Lets a link jump straight to this row.',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'marker' } },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Timeline', subtitle: 'Timeline' }),
  },
});

export const staffGridSection = defineType({
  name: 'staffGridSection',
  title: 'Staff',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    defineField({
      name: 'group',
      title: 'Who to show',
      type: 'string',
      initialValue: 'all',
      options: {
        list: [
          { title: 'Everyone', value: 'all' },
          { title: 'Pastors', value: 'pastors' },
          { title: 'Church Coordination Team', value: 'coordination' },
          { title: 'Support and volunteer roles', value: 'support' },
        ],
        layout: 'radio',
      },
      description: 'Pick one. People are set to a group on their own Staff member page.',
    }),
    defineField({
      name: 'showBios',
      title: 'Show the longer text about each person',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to show only name, role, email and photo.',
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', group: 'group' },
    prepare: ({ title, group }) => ({
      title: title || 'Staff',
      subtitle: `Staff: ${group ?? 'all'}`,
    }),
  },
});

export const faqSection = defineType({
  name: 'faqSection',
  title: 'Questions and answers',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    defineField({
      name: 'items',
      title: 'Questions',
      type: 'array',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'array',
              of: [{ type: 'block' }],
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Questions', subtitle: 'Questions and answers' }),
  },
});

export const scriptureBandSection = defineType({
  name: 'scriptureBandSection',
  title: 'Scripture band',
  type: 'object',
  fields: [
    defineField({
      name: 'verse',
      title: 'The words',
      type: 'text',
      rows: 4,
      validation: (r) => r.required(),
      description: 'The verse or quotation, without the reference.',
    }),
    defineField({
      name: 'reference',
      title: 'Reference',
      type: 'string',
      description: 'Like "Isaiah 12:4".',
    }),
    defineField({
      name: 'accentWord',
      title: 'Word to pick out in gold',
      type: 'string',
      description:
        'One word that appears in the text, spelled exactly as it appears. Leave blank for none.',
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'reference', subtitle: 'verse' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Scripture', subtitle }),
  },
});

export const heritageBandSection = defineType({
  name: 'heritageBandSection',
  title: 'Building band (brown)',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    defineField({
      name: 'body',
      title: 'Text',
      type: 'text',
      rows: 4,
      description: 'One paragraph.',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'A photo of the building or the glass.',
      // SanityImage.astro reads `source.alt` for every image it draws, so this
      // block always intended to carry alt text; the field was simply never
      // declared. Without it the Studio renders a stored alt as "Unknown field
      // found" with a REMOVE FIELD button beside it (CLAUDE.md rule 1).
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the photo in a few words, for screen readers and search engines.',
        }),
      ],
    }),
    defineField({ name: 'cta', title: 'Button (optional)', type: 'ctaBlock' }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'Building band',
      subtitle: 'Building band (brown)',
      media,
    }),
  },
});

export const giveBandSection = defineType({
  name: 'giveBandSection',
  title: 'Give band',
  type: 'object',
  fields: [
    heading,
    defineField({
      name: 'body',
      title: 'Text',
      type: 'text',
      rows: 3,
      description: 'One or two sentences.',
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button text',
      type: 'string',
      initialValue: 'Give through Church Center',
    }),
    defineField({
      name: 'buttonUrl',
      title: 'Button link',
      type: 'url',
      description: 'Leave blank to use the giving address from Site settings.',
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Give', subtitle: 'Give band' }),
  },
});

// The hours band. It carries NO hours of its own, on purpose (CLAUDE.md rule
// 15): the office and pastors' hours are already typed once on Site settings,
// and Hours.astro reads them from there, so the band and the footer can never
// disagree about when the office is open.
export const hoursSection = defineType({
  name: 'hoursSection',
  title: 'Hours',
  type: 'object',
  fields: [eyebrow, heading, anchorField()],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({
      title: title || 'Hours',
      subtitle: 'Hours (read from Site settings)',
    }),
  },
});

export const documentListSection = defineType({
  name: 'documentListSection',
  title: 'Documents to download',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    defineField({
      name: 'docs',
      title: 'Documents',
      type: 'array',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'listedDocument',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'year',
              title: 'Year',
              type: 'number',
              description: 'Four digits, like 2025. Newest shows first. Leave blank for undated.',
            }),
            defineField({
              name: 'file',
              title: 'File',
              type: 'file',
              description: 'Upload the PDF.',
            }),
            defineField({
              name: 'url',
              title: 'Or a link',
              type: 'url',
              description:
                'Use this instead of a file for something hosted elsewhere, like a book on Amazon.',
            }),
            defineField({
              name: 'note',
              title: 'Small note',
              type: 'string',
              description: 'Like "Quarterly newsletter". Leave blank for none.',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'note' } },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Documents', subtitle: 'Documents to download' }),
  },
});

export const linkCardsSection = defineType({
  name: 'linkCardsSection',
  title: 'Link cards',
  type: 'object',
  description:
    'Two to four short cards, each a door into another part of the site. Use it for the "here are the three things you probably came for" band.',
  fields: [
    eyebrow,
    heading,
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 2,
      description: 'One or two sentences under the heading. Leave blank for none.',
    }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      validation: (r) => r.min(2).max(4),
      description:
        'Two, three or four. The grid draws exactly as many columns as there are cards, so three cards is a row of three.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'linkCard',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              description: 'A few words, like "What we believe".',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'body',
              title: 'Text',
              type: 'text',
              rows: 3,
              description: 'One sentence. The card is a door, not the room.',
            }),
            defineField({
              name: 'cta',
              title: 'Link',
              type: 'ctaBlock',
              description: 'Where the card goes. It draws as a text link, never a button.',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'body' } },
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Link cards', subtitle: 'Link cards' }),
  },
});

// A Ministry band (2026-09-22). It holds NO words of its own: it points at one
// ministry document, and the band is drawn from that document's small line,
// headline, photo and text, with a contact line per person it names generated
// at build time from their Staff page (src/lib/ministry-band.ts). With a photo
// it draws exactly as an "Image + text" band; without one, exactly as a "Text
// block". So it has only the two things that belong to the PAGE rather than to
// the ministry: which side the photo runs off, and the jump-to id.
//
// `imageSide` keeps the image band's own field name on purpose: it is already
// on NON_STEGA_FIELDS in src/lib/cms-preview.ts (CLAUDE.md rule 8b), and a
// ministry band converted from an image band carries its stored value across.
export const ministrySection = defineType({
  name: 'ministrySection',
  title: 'Ministry',
  type: 'object',
  description:
    'One ministry, drawn from its own page under Ministries in the menu on the left. Change its words, photo and people there.',
  fields: [
    defineField({
      name: 'ministry',
      title: 'Ministry',
      type: 'reference',
      to: [{ type: 'ministry' }],
      description:
        'Pick one. Its words, photo and the people to talk to come from the ministry itself, under Ministries in the menu on the left.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'imageSide',
      title: 'Photo side',
      type: 'string',
      initialValue: 'left',
      options: { list: sideOptions('Photo'), layout: 'radio' },
      description: 'Which edge the photo runs off. A ministry with no photo ignores this.',
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'ministry.title', headline: 'ministry.headline', media: 'ministry.image' },
    // Strings only: a preview title that is not a string crashes the whole
    // array field (audit:studio check 2).
    prepare: ({ title, headline, media }) => ({
      title: typeof title === 'string' && title ? title : 'Ministry',
      subtitle: typeof headline === 'string' && headline ? `Ministry: ${headline}` : 'Ministry',
      media,
    }),
  },
});

export const CHURCH_SECTION_TYPES = [
  sundayTimesSection,
  timelineSection,
  staffGridSection,
  faqSection,
  scriptureBandSection,
  heritageBandSection,
  giveBandSection,
  hoursSection,
  documentListSection,
  linkCardsSection,
  ministrySection,
];
// scaffold:end
