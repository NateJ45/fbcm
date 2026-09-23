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
              description:
                'Where the card goes. The whole card is the link: in the plain row the label draws as a text link, and when every card has a photo it draws as a button under the door.',
            }),
            // 2026-09-23 (Who We Are "alive", Task 5): optional. When EVERY card
            // has one, the band draws the cards as arched doors on green.
            defineField({
              name: 'image',
              title: 'Photo',
              type: 'image',
              options: { hotspot: true },
              description:
                'Optional. Give every card a photo and the band draws the cards as arched doors on green, each photo in its door. Leave all of them blank for the plain row.',
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Describe the photo',
                  type: 'string',
                  validation: (r) => r.required(),
                }),
              ],
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'body', media: 'image' } },
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

// The Watchword band (Task 3, 2026-09-23, "Who We Are alive"). "Our Watchword",
// Isaiah 12:4, praise and proclaim, with a short intro and a "Read more" that
// opens the full explanation. No image: the mark it sits beside is drawn from
// code (src/components/church/), not a Sanity field.
export const watchwordSection = defineType({
  name: 'watchwordSection',
  title: 'Watchword (Praise and Proclaim)',
  type: 'object',
  fields: [
    heading, // "Our Watchword"
    defineField({
      name: 'intro',
      title: 'Short introduction',
      type: 'text',
      rows: 3,
      description: 'Two or three sentences shown beside the mark.',
    }),
    defineField({
      name: 'more',
      title: 'Read more',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'The full explanation. Shown when a visitor opens "Read more".',
    }),
    defineField({
      name: 'verse',
      title: 'Verse',
      type: 'text',
      rows: 3,
      description:
        'The verse, without quotation marks. The words praise and proclaim are highlighted automatically.',
    }),
    defineField({
      name: 'reference',
      title: 'Reference',
      type: 'string',
      description: 'Like "Isaiah 12:4".',
    }),
    defineField({ name: 'praise', title: 'What "Praise" means', type: 'text', rows: 2 }),
    defineField({ name: 'proclaim', title: 'What "Proclaim" means', type: 'text', rows: 2 }),
    anchorField(),
  ],
  preview: { select: { title: 'heading', subtitle: 'reference' } },
});

// One of the four goal bands (worship, discipleship, fellowship, service, in
// whatever order the editor arranges them). `glyph` picks which of the four
// building drawings the band renders beside its words; it is a component
// switch, not display text, so it is on NON_STEGA_FIELDS (CLAUDE.md rule 8b).
//
// `photos` deliberately carries NO caption field: the site owner ruled out
// visible photo captions everywhere (2026-09-23). The required `alt` stays,
// since it serves screen readers and search engines rather than a visible
// caption.
const goal = defineArrayMember({
  type: 'object',
  name: 'goal',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Like "Worship".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Like "Worshiping as the Body of Christ".',
    }),
    defineField({
      name: 'aside',
      title: 'In brackets',
      type: 'string',
      description: 'Like "Discipleship". Leave blank for none.',
    }),
    defineField({
      name: 'glyph',
      title: 'Building drawing',
      type: 'string',
      options: {
        list: [
          { title: 'Window', value: 'window' },
          { title: 'Door', value: 'door' },
          { title: 'Rose window', value: 'rose' },
          { title: 'Basin niche', value: 'basin' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'summary', title: 'Opening sentence', type: 'text', rows: 3 }),
    defineField({
      name: 'quote',
      title: 'Pull quote',
      type: 'string',
      description: 'Optional, like "Come and see." Shown large on the second goal.',
    }),
    defineField({
      name: 'points',
      title: 'Points',
      type: 'array',
      validation: (r) => r.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'goalPoint',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'short',
              title: 'Short label',
              type: 'string',
              description:
                'One or two words used on the drawing, like "Serve" or "In Muncie". Leave blank to use the title.',
            }),
            defineField({ name: 'body', title: 'Text', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'title', subtitle: 'short' } },
        }),
      ],
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      validation: (r) => r.max(6),
      description: 'People doing this. The first is the largest.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Describe the photo',
              type: 'string',
              validation: (r) => r.required(),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'subtitle' } },
});

export const goalsSection = defineType({
  name: 'goalsSection',
  title: 'Our goals (four bands)',
  type: 'object',
  description: 'Each goal gets its own colour and layout, in order: green, gold, purple, brown.',
  fields: [
    heading,
    defineField({ name: 'intro', title: 'Introduction', type: 'text', rows: 3 }),
    defineField({
      name: 'goals',
      title: 'Goals',
      type: 'array',
      of: [goal],
      validation: (r) => r.min(1).max(4),
    }),
    anchorField(),
  ],
  preview: { select: { title: 'heading' } },
});

export const pledgeSection = defineType({
  name: 'pledgeSection',
  title: 'Pledge (said together)',
  type: 'object',
  fields: [
    heading, // "Our Pledge"
    defineField({ name: 'intro', title: 'Introduction', type: 'text', rows: 2 }),
    defineField({
      name: 'instruction',
      title: 'Instruction line',
      type: 'string',
      description: 'Like "When a member joins, we say this pledge together as a church."',
    }),
    defineField({
      name: 'opening',
      title: 'Opening line',
      type: 'string',
      description: 'Like "We pledge ourselves to be the family of God for you in this place:"',
    }),
    defineField({
      name: 'lines',
      title: 'Lines said together',
      type: 'array',
      validation: (r) => r.min(1).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pledgeLine',
          fields: [
            defineField({
              name: 'text',
              title: 'Line',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'reference',
              title: 'Scripture',
              type: 'string',
              description: 'Like "Galatians 6:2".',
            }),
          ],
          preview: { select: { title: 'text', subtitle: 'reference' } },
        }),
      ],
    }),
    defineField({
      name: 'after',
      title: 'Text after the pledge',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Describe the photo',
          type: 'string',
          validation: (r) => r.required(),
        }),
      ],
    }),
    anchorField(),
  ],
  preview: { select: { title: 'heading' } },
});

export const letterSection = defineType({
  name: 'letterSection',
  title: 'Letter',
  type: 'object',
  fields: [
    heading, // "A Note From Our Pastors"
    defineField({
      name: 'body',
      title: 'Letter',
      type: 'array',
      of: [{ type: 'block' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'signature',
      title: 'Signed',
      type: 'string',
      description: 'Like "Kendall & Jonathan".',
    }),
    defineField({
      name: 'signatureNote',
      title: 'Under the signature',
      type: 'string',
      description: 'Like "Co-Pastors, First Baptist Church Muncie".',
    }),
    defineField({
      name: 'portrait',
      title: 'Portrait',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Describe the photo',
          type: 'string',
          validation: (r) => r.required(),
        }),
      ],
    }),
    anchorField(),
  ],
  preview: { select: { title: 'heading', subtitle: 'signature' } },
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
  watchwordSection,
  goalsSection,
  pledgeSection,
  letterSection,
];
// scaffold:end
