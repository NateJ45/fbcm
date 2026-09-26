// studioNotes singleton, drives the static notes in the "Your church at a
// glance" Help panel (the live services/settings come straight from those
// documents and are not duplicated here). Plain text, excluded from Canvas.
import { defineType, defineField, defineArrayMember } from 'sanity';

export const studioNotes = defineType({
  name: 'studioNotes',
  title: 'Church notes',
  type: 'document',
  options: { canvasApp: { exclude: true } },
  fields: [
    defineField({
      name: 'businessSummary',
      title: 'Who the church is',
      type: 'text',
      rows: 5,
      description:
        'A few plain sentences about the church for anyone writing for the website. Not shown on the website.',
    }),
    defineField({
      name: 'idealClient',
      title: 'Who we are writing for',
      type: 'text',
      rows: 5,
      description:
        'Who reads the website: members checking the service time, people thinking of visiting. Not shown on the website.',
    }),
    defineField({
      name: 'voiceSummary',
      title: 'How the church sounds in writing',
      type: 'text',
      rows: 6,
      description:
        'A sentence or two on the tone to write in, so the pages sound like one church. Not shown on the website.',
    }),
    defineField({
      name: 'wordsToAvoid',
      title: 'Words to avoid',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Words that do not sound like the church, one to a line.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Church notes' }) },
});
