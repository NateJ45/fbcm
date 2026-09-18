// Ministry. Harvested from the archived ncs-church-starter and adapted for
// FBCM: a ministry is a group or program the church runs (Children, Outreach,
// Missions, and so on). No sermon type here (YouTube is the archive) and no
// event type (Church Center holds the calendar) -- this schema only describes
// what a ministry IS, not what it is doing this week.
//
// Every field description says what to type. None explains why the field
// exists: the editor is a church secretary, not a developer.

import { defineField, defineType } from 'sanity';

export const ministry = defineType({
  name: 'ministry',
  title: 'Ministry',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'The name people use for it, like "Children" or "Outreach".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'Click Generate. Only change it if you need a shorter address.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'One-line summary',
      type: 'text',
      rows: 2,
      description: 'One sentence, shown in the list of ministries.',
    }),
    defineField({
      name: 'body',
      title: 'Full description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Who it is for, when it meets, and who to ask about it.',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'One photo of this ministry. Landscape works best.',
    }),
    defineField({
      name: 'order',
      title: 'Position in the list',
      type: 'number',
      description: 'A number. Lower numbers appear first.',
    }),
  ],
  orderings: [{ title: 'List order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    // The title is a string field. Never preview from a number: it crashes the
    // whole array field (audit:studio check 2).
    select: { title: 'title', subtitle: 'summary', media: 'image' },
  },
});
