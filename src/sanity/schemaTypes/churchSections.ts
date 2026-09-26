// scaffold: church
// The church blocks: what a church page needs and a service business does not. Every
// description says what to TYPE. No block carries a colour field: the dark bands
// (sundayTimes and heritage are brown, faq/scripture/give are indigo) are dark
// by TYPE (a heritage band that carries dates draws on cream instead, from its
// content), which is what keeps SectionRenderer's cadence the only source of surface.
//
// scriptureBandSection.accentWord is a plain string, not a headingAccentField().
// It is deliberately NOT registered in src/lib/section-fields.ts: that registry's
// HEADING_ACCENT_FIELDS shape assumes the accent lives in a field literally named
// `headingAccent` beside a `heading`/`headline` field, and this block has neither
// (its words are `verse`/`reference`, and its optional `heading`, added
// 2026-09-24, carries no accent). The scripture accent is highlighted at render
// time by highlightWords() directly (every whole-word occurrence, since the
// Staff identity pass), not through the in-canvas overlay registry.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { anchorField } from './_anchorField';
import { linkRule, LINK_TOKEN_HINT } from './_linkRule.ts';
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
  validation: (r) => r.required().error('Type the heading.'),
});

export const sundayTimesSection = defineType({
  name: 'sundayTimesSection',
  title: 'Sunday times and location',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    // The three hymn-board additions (2026-09-23, the Home identity pass). All
    // optional, so the Visit and Contact bands written before them stay valid.
    defineField({
      name: 'intro',
      title: 'Introduction',
      type: 'text',
      rows: 3,
      description: 'A sentence or two above the times.',
    }),
    defineField({
      name: 'items',
      title: 'The times',
      type: 'array',
      validation: (r) => [
        r.min(1).error('Add at least one time.'),
        r.max(3).error('Three times at most.'),
      ],
      description:
        'Up to three rows. The big line is set in gold, and the row whose time matches the service time in Site settings is drawn largest.',
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
      name: 'notes',
      title: 'Notes',
      type: 'array',
      validation: (r) => r.max(3).error('Three notes at most.'),
      description: 'Up to three short lines under the photo, like the nursery or communion.',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      validation: (r) => r.max(2).error('Two photos at most.'),
      description:
        "One or two photos. The first is the larger. Leave empty and the site uses one of the church's photos.",
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Describe the photo',
              type: 'string',
              validation: (r) =>
                r
                  .required()
                  .error('Describe the photo in a few words, for people who cannot see it.'),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Button (optional)',
      type: 'ctaBlock',
      description:
        'Like "What to expect", pointing at the Visit page. Leave empty and the section shows the directions button instead.',
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
    select: { title: 'heading', media: 'photos.0' },
    prepare: ({ title, media }) => ({
      title: title || 'Sunday times',
      subtitle: 'Sunday times and location',
      media,
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
      validation: (r) => r.min(1).error('Add at least one row.'),
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
                'A time like "9:30 am" or a year like "1859". Leave blank for a step with no time, like a welcome. On a timeline of times, a last row with words here (like "First Sundays") is set after the steps as a closing note.',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (r) => r.required().error('Give the row a title.'),
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
              description:
                'The room, like "Sanctuary", or a place and its room, like "Donut [Semi-] Hour (Fellowship Hall)". The room is shown as a small tag. Leave blank for none.',
            }),
            // A step's photo (2026-09-24, the Visit identity pass): drawn in a
            // door arch at the top of its step. Optional and additive.
            defineField({
              name: 'image',
              title: 'Photo (optional)',
              type: 'image',
              options: { hotspot: true },
              description: 'A photo for this step, shown in an arched doorway.',
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Describe the photo',
                  type: 'string',
                  validation: (r) =>
                    r
                      .required()
                      .error('Describe the photo in a few words, for people who cannot see it.'),
                }),
              ],
            }),
            defineField({
              name: 'anchor',
              title: 'Jump-to name (optional)',
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
  title: 'Staff members',
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
      description: "Pick one. Each person's group is set on their own page, under People.",
    }),
    // 2026-09-24, the Staff identity pass: the church's own paragraphs about
    // the people in the band (what a pastor is; what the Church Coordination
    // Team is), set beside the heading, so an explanation and its faces are
    // one band rather than two. Optional; a band without it draws as before.
    defineField({
      name: 'intro',
      title: 'Introduction',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
        }),
      ],
      description: 'A paragraph or two shown beside the heading. Leave blank for none.',
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
      title: title || 'Staff members',
      subtitle: `Staff members: ${
        (
          {
            all: 'everyone',
            pastors: 'pastors',
            coordination: 'Church Coordination Team',
            support: 'support and volunteer roles',
          } as Record<string, string>
        )[group as string] ?? 'everyone'
      }`,
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
      validation: (r) => r.min(1).error('Add at least one question.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (r) => r.required().error('Type the question.'),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'array',
              of: [{ type: 'block' }],
              validation: (r) => r.required().error('Type the answer.'),
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
  title: 'Scripture verse',
  type: 'object',
  fields: [
    // 2026-09-24, the Staff identity pass: an optional heading over the verse
    // and an optional paragraph under it, for a band that is a whole section
    // of the church's own page ("Every Member of this Church": a heading, 1
    // Corinthians 12:4-6 and the church's paragraph). Both optional: a band
    // that is only a verse (Beliefs) simply has neither.
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'One line above the words. Leave blank for none.',
    }),
    defineField({
      name: 'verse',
      title: 'The words',
      type: 'text',
      rows: 4,
      validation: (r) => r.required().error('Type the verse.'),
      description: 'The verse or quotation, without quotation marks and without the reference.',
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
        'One word that appears in the text, spelled exactly as it appears. Every place it appears is picked out. Leave blank for none.',
    }),
    defineField({
      name: 'intro',
      title: 'Paragraph under the words',
      type: 'text',
      rows: 4,
      description: 'A few sentences shown under the verse and its reference. Leave blank for none.',
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
  title: 'Building and history',
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
      description:
        'A photo of the building or the glass. When the section has dates, this is the large picture beside the heading, so a drawing of the building suits it best.',
      // SanityImage.astro reads `source.alt` for every image it draws, so this
      // block always intended to carry alt text; the field was simply never
      // declared. Without it the Studio renders a stored alt as "Unknown field
      // found" with a REMOVE FIELD button beside it (CLAUDE.md rule 1).
      fields: [
        defineField({
          name: 'alt',
          title: 'Describe the photo',
          type: 'string',
          description: 'A few words saying what is in the picture, for people who cannot see it.',
          // A warning, not an error: set bands predate the prompt, and an
          // error would stop those pages publishing.
          validation: (r) =>
            r
              .custom((value, ctx) =>
                !value && (ctx.parent as { asset?: unknown } | undefined)?.asset
                  ? 'Describe the photo in a few words, for people who cannot see it.'
                  : true,
              )
              .warning(),
        }),
      ],
    }),
    // The Home identity pass (2026-09-23): an old photograph and a dated list
    // that ends in the present. Both optional, so /history's opener and
    // /visit's building band keep drawing as the brown band. A band WITH dates
    // draws as the cream "Our Building" band instead (HeritageBand.astro): the
    // look follows the content, never a colour field (CLAUDE.md rule 9).
    defineField({
      name: 'archive',
      title: 'Old photograph (optional)',
      type: 'image',
      options: { hotspot: true },
      // 2026-09-24, the History identity pass: the band that OPENS a page
      // (HeritageOpener.astro) hangs this photograph in a lancet beside its
      // door arch. A description change only; the field is unchanged.
      description:
        'An old photograph shown beside the dates. When this section opens its page, it is shown in a pointed arch beside the photo.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Describe the photo',
          type: 'string',
          validation: (r) =>
            r.required().error('Describe the photo in a few words, for people who cannot see it.'),
        }),
      ],
    }),
    defineField({
      name: 'dates',
      title: 'Dates (optional)',
      type: 'array',
      validation: (r) => r.max(6).error('Six dates at most.'),
      description:
        "Up to six, in order. Tick 'This year' on the last one to show what the church is doing now: its year is filled in for you.",
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heritageDate',
          title: 'Date',
          fields: [
            defineField({
              name: 'now',
              title: 'This year',
              type: 'boolean',
              initialValue: false,
              description:
                'Tick for what the church is doing now. The year is filled in for you, so it never goes out of date.',
            }),
            defineField({
              name: 'year',
              title: 'Year',
              type: 'string',
              description: 'For example 1859.',
              // The present-day entry's year is derived at build time
              // (src/lib/heritage-dates.ts), so there is nothing to type.
              // Never required, so hiding it can never trap a document.
              hidden: ({ parent }) => (parent as { now?: boolean } | undefined)?.now === true,
            }),
            defineField({
              name: 'text',
              title: 'What happened',
              type: 'text',
              rows: 2,
              description: 'One sentence.',
            }),
          ],
          preview: {
            select: { year: 'year', text: 'text', now: 'now' },
            prepare: ({ year, text, now }) => ({
              title: now ? 'This year' : typeof year === 'string' && year ? year : 'Date',
              subtitle: typeof text === 'string' ? text : undefined,
            }),
          },
        }),
      ],
    }),
    defineField({ name: 'cta', title: 'Button (optional)', type: 'ctaBlock' }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'The building',
      subtitle: 'Building and history',
      media,
    }),
  },
});

export const giveBandSection = defineType({
  name: 'giveBandSection',
  title: 'Giving',
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
      // Names no giving system, so a new band never says the wrong one
      // (it said "Give through Church Center" before feat/church-links).
      initialValue: 'Give online',
    }),
    defineField({
      name: 'buttonUrl',
      title: 'Button link',
      type: 'url',
      description: `Leave blank to use Online giving from Site settings, Church systems. ${LINK_TOKEN_HINT}`,
      validation: linkRule({ absoluteOnly: true, scheme: ['http', 'https'] }),
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Giving', subtitle: 'Giving' }),
  },
});

// The hours band. It carries NO hours of its own, on purpose (CLAUDE.md rule
// 15): the office and pastors' hours are already typed once on Site settings,
// and Hours.astro reads them from there, so the band and the footer can never
// disagree about when the office is open.
export const hoursSection = defineType({
  name: 'hoursSection',
  title: 'Office hours',
  type: 'object',
  description:
    "The office and pastors' hours. Change the hours themselves in Site settings, Church details.",
  fields: [eyebrow, heading, anchorField()],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({
      title: title || 'Office hours',
      subtitle: 'Office hours (from Site settings)',
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
      validation: (r) => r.min(1).error('Add at least one document.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'listedDocument',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (r) => r.required().error('Give the document a title.'),
            }),
            defineField({
              name: 'year',
              title: 'Year',
              type: 'number',
              description:
                'Four digits, like 2025. Newest shows first. Leave blank if it has no year.',
              validation: (r) =>
                r.integer().min(1800).max(2200).error('Type the year as four digits, like 2025.'),
            }),
            defineField({
              name: 'file',
              title: 'File',
              type: 'file',
              description:
                'Upload the PDF, or fill in the link below instead. With neither, the document is listed without a button, like a book kept in the church library.',
            }),
            defineField({
              name: 'url',
              title: 'Or a link',
              type: 'url',
              description: `Use this instead of a file for something hosted elsewhere, like a book on Amazon or one of the church's online forms. ${LINK_TOKEN_HINT}`,
              validation: linkRule({ absoluteOnly: true, scheme: ['http', 'https'] }),
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
  description: 'Two to four short cards, each leading to another part of the site.',
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
      validation: (r) => [
        r.min(2).error('Add at least two cards.'),
        r.max(4).error('Four cards at most.'),
      ],
      description: 'Two, three or four. They sit side by side, so three cards make a row of three.',
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
              validation: (r) => r.required().error('Give the card a title.'),
            }),
            defineField({
              name: 'body',
              title: 'Text',
              type: 'text',
              rows: 3,
              description: 'One sentence saying what is on the other side.',
            }),
            defineField({
              name: 'cta',
              title: 'Link',
              type: 'ctaBlock',
              description:
                'Where the card goes. The whole card can be clicked. The button text shows as a link under the card, or as a button when every card has a photo.',
            }),
            // 2026-09-23 (Who We Are "alive", Task 5): optional. When EVERY card
            // has one, the band draws the cards as arched doors on green.
            defineField({
              name: 'image',
              title: 'Photo',
              type: 'image',
              options: { hotspot: true },
              description:
                'Optional. Give every card a photo and the cards are drawn as arched doorways, each with its photo. Leave all of them blank for plain cards.',
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Describe the photo',
                  type: 'string',
                  validation: (r) =>
                    r
                      .required()
                      .error('Describe the photo in a few words, for people who cannot see it.'),
                }),
              ],
            }),
            // 2026-09-23 (Home identity, Task 2): optional. `glyph` picks which
            // of the four building drawings draws beside the card's title, the
            // same component switch as goalsSection's `goal.glyph` above (a
            // component switch, not display text, so 'glyph' is already on
            // NON_STEGA_FIELDS by name). Give EVERY card in the band one and,
            // with every card already pictured (the arched-door look above),
            // the band also switches to the indigo-dark ground and the CTA
            // draws as a text link instead of the gold plate: this is the four
            // goals as the home page's ways in. Leave any card's glyph blank
            // and the band with images stays exactly the arched-door look it
            // is today (Who We Are's "Where To Go Next"); parity proves it.
            defineField({
              name: 'glyph',
              title: 'Building drawing',
              type: 'string',
              description:
                'Optional. Give every card a photo and a drawing and the cards are drawn as the four goals, as on the home page.',
              options: {
                list: [
                  { title: 'Window', value: 'window' },
                  { title: 'Door', value: 'door' },
                  { title: 'Lamp on a stand', value: 'rose' },
                  { title: 'Basin and towel', value: 'basin' },
                ],
                layout: 'radio',
              },
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
    'One ministry, shown from its own page under Ministries in the menu on the left. Change its words, photo and people there.',
  fields: [
    defineField({
      name: 'ministry',
      title: 'Ministry',
      type: 'reference',
      to: [{ type: 'ministry' }],
      description:
        'Pick one. Its words, photo and the people to talk to come from the ministry itself, under Ministries in the menu on the left.',
      validation: (r) => r.required().error('Pick the ministry to show.'),
    }),
    defineField({
      name: 'imageSide',
      title: 'Photo side',
      type: 'string',
      initialValue: 'left',
      options: { list: sideOptions('Photo'), layout: 'radio' },
      description: 'Which side the photo is on. A ministry with no photo ignores this.',
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
      description: 'Two or three sentences shown beside the watchword drawing.',
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
  preview: {
    select: { title: 'heading', subtitle: 'reference' },
    prepare: ({ title, subtitle }) => ({
      title: typeof title === 'string' && title ? title : 'Watchword',
      subtitle: typeof subtitle === 'string' && subtitle ? subtitle : 'Watchword',
    }),
  },
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
      validation: (r) => r.required().error("Type the goal's name."),
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
          { title: 'Lamp on a stand', value: 'rose' },
          { title: 'Basin and towel', value: 'basin' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required().error('Pick a drawing for this goal.'),
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
      validation: (r) => r.max(4).error('Four points at most.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'goalPoint',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (r) => r.required().error('Give the point a title.'),
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
      validation: (r) => r.max(6).error('Six photos at most.'),
      description: 'Up to six photos of people doing this. The first is the largest.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Describe the photo',
              type: 'string',
              validation: (r) =>
                r
                  .required()
                  .error('Describe the photo in a few words, for people who cannot see it.'),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'subtitle' },
    prepare: ({ title, subtitle }) => ({
      title: typeof title === 'string' && title ? title : 'Goal',
      subtitle: typeof subtitle === 'string' ? subtitle : undefined,
    }),
  },
});

export const goalsSection = defineType({
  name: 'goalsSection',
  title: 'Our goals',
  type: 'object',
  description:
    'Up to four goals. Each gets its own colour and layout, in order: green, gold, purple, brown.',
  fields: [
    heading,
    defineField({ name: 'intro', title: 'Introduction', type: 'text', rows: 3 }),
    defineField({
      name: 'goals',
      title: 'Goals',
      type: 'array',
      of: [goal],
      validation: (r) => [
        r.min(1).error('Add at least one goal.'),
        r.max(4).error('Four goals at most.'),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({
      title: typeof title === 'string' && title ? title : 'Our goals',
      subtitle: 'Our goals',
    }),
  },
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
      validation: (r) => [
        r.min(1).error('Add at least one line.'),
        r.max(8).error('Eight lines at most.'),
      ],
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pledgeLine',
          fields: [
            defineField({
              name: 'text',
              title: 'Line',
              type: 'string',
              validation: (r) => r.required().error('Type the line.'),
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
          validation: (r) =>
            r.required().error('Describe the photo in a few words, for people who cannot see it.'),
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({
      title: typeof title === 'string' && title ? title : 'Pledge',
      subtitle: 'Pledge (said together)',
    }),
  },
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
      validation: (r) => r.required().error('The letter is empty. Type it here.'),
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
          validation: (r) =>
            r.required().error('Describe the photo in a few words, for people who cannot see it.'),
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', subtitle: 'signature' },
    prepare: ({ title, subtitle }) => ({
      title: typeof title === 'string' && title ? title : 'Letter',
      subtitle: typeof subtitle === 'string' && subtitle ? subtitle : 'Letter',
    }),
  },
});

// The Church Trac form band (2026-09-25). A form the church built in Church
// Trac, shown on the page in the site's own frame, with a heading and a few
// words beside it. Like the Ministry band it only POINTS at the form: the
// embed code lives once, on the "Church Trac form" document, so a form shown
// on two pages is changed in one place. What the frame may show is decided by
// src/lib/church-trac-form.ts (a churchtrac.com address, nothing else).
export const churchTracFormSection = defineType({
  name: 'churchTracFormSection',
  title: 'Church Trac form',
  type: 'object',
  description:
    'A Church Trac form on this page. Add or change the form itself under Church Trac forms in the menu on the left.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the heading',
      type: 'string',
      description: 'Optional. Like "Let us know you are coming".',
    }),
    heading, // "Connection Card"
    defineField({
      name: 'intro',
      title: 'A few words beside the form',
      type: 'text',
      rows: 3,
      description: 'Optional. What the form is for and what happens after someone sends it.',
    }),
    defineField({
      name: 'form',
      title: 'Form',
      type: 'reference',
      to: [{ type: 'churchTracForm' }],
      description:
        'Pick one. To add a new one, open Church Trac forms in the menu on the left and paste the embed code from Church Trac.',
      validation: (r) => r.required().error('Pick the form to show.'),
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', form: 'form.title' },
    // Strings only (audit:studio check 2).
    prepare: ({ title, form }) => ({
      title: typeof title === 'string' && title ? title : 'Church Trac form',
      subtitle: typeof form === 'string' && form ? `Church Trac form: ${form}` : 'Church Trac form',
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
  watchwordSection,
  goalsSection,
  pledgeSection,
  letterSection,
  churchTracFormSection,
];
// scaffold:end
