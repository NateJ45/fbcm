// studioGuide singleton, drives the "How the website works" Help panel.
// Plain text + simple arrays (no Portable Text) so editing stays dead-simple
// and the Studio needs no extra renderer dependency.
import { defineType, defineField, defineArrayMember } from 'sanity';

const TONES = [
  { title: 'Plain', value: 'default' },
  { title: 'Blue (worth knowing)', value: 'primary' },
  { title: 'Amber (take care)', value: 'caution' },
  { title: 'Green (good news)', value: 'positive' },
];

export const studioGuide = defineType({
  name: 'studioGuide',
  title: 'How the website works',
  type: 'document',
  options: { canvasApp: { exclude: true } },
  fields: [
    defineField({
      name: 'guideTitle',
      title: 'Guide title',
      type: 'string',
      initialValue: 'How the website works',
    }),
    defineField({
      name: 'guideIntro',
      title: 'Welcome line',
      type: 'text',
      rows: 3,
      description: 'A sentence or two under the title.',
    }),
    defineField({
      name: 'studioMap',
      title: 'Where everything lives',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'mapRow',
          fields: [
            defineField({
              name: 'area',
              title: 'Part of the Studio',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'description',
              title: 'What lives here',
              type: 'text',
              rows: 3,
              validation: (R) => R.required(),
            }),
          ],
          preview: { select: { title: 'area', subtitle: 'description' } },
        }),
      ],
    }),
    defineField({
      name: 'howTos',
      title: 'Step-by-step instructions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'howTo',
          fields: [
            defineField({
              name: 'title',
              title: 'What it helps with',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'steps',
              title: 'Steps',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              validation: (R) => R.required().min(1),
            }),
          ],
          preview: { select: { title: 'title' } },
        }),
      ],
    }),
    defineField({
      name: 'tips',
      title: 'Tips',
      type: 'array',
      description: 'The coloured boxes at the end of the guide, one tip in each.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tip',
          fields: [
            defineField({
              name: 'heading',
              title: 'Heading',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'tone',
              title: 'Colour',
              type: 'string',
              options: { list: TONES },
              initialValue: 'default',
            }),
            defineField({
              name: 'body',
              title: 'Text',
              type: 'text',
              rows: 5,
              validation: (R) => R.required(),
            }),
          ],
          preview: { select: { title: 'heading', subtitle: 'tone' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'How the website works' }) },
});
