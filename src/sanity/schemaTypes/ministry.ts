// Ministry. Harvested from the archived ncs-church-starter and adapted for
// FBCM: a ministry is a group or program the church runs (Children, Outreach,
// Missions, and so on). No sermon type here (YouTube is the archive) and no
// event type (Church Trac holds the calendar) -- this schema only describes
// what a ministry IS, not what it is doing this week.
//
// SINCE 2026-09-22 THIS DOCUMENT IS THE MINISTRY'S ONE HOME. The Ministries
// page shows each ministry through a "Ministry" band (ministrySection in
// churchSections.ts) that only POINTS here: the small line, the headline, the
// photo, the text and the people to talk to are all read from this document,
// and each person's contact line is generated at build time from their Staff
// page (src/lib/ministry-band.ts), so it cannot go stale (CLAUDE.md rule 15).
// scripts/connect-ministries.mjs moved the page's typed copies in here.
//
// Every field keeps the name it had before, so no stored data is orphaned
// (CLAUDE.md rule 1); only titles and descriptions changed, and three fields
// were added (eyebrow, headline, contacts) plus the photo's alt text.
//
// Every field description says what to type. None explains why the field
// exists: the editor is a church secretary, not a developer.

import { defineArrayMember, defineField, defineType } from 'sanity';
import { linkRule, LINK_TOKEN_HINT } from './_linkRule.ts';

/**
 * The text. A SUPERSET of what the page bands' text boxes accept (sections.ts,
 * proseBody), because this is where their words moved to: the adult band uses
 * a small heading (h4) and the bands link to pages on this site ("/contact"),
 * so both have to be valid here or the moved text would fail validation.
 */
const ministryBody = defineField({
  name: 'body',
  title: 'Text',
  type: 'array',
  description:
    'What the ministry is, who it is for and when it meets. Leave off the contact line at the end: it is added for you from "People to talk to" below.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Small heading', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
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
                description: `A page on this site like /contact, a full web address, or mailto: and an email address. ${LINK_TOKEN_HINT}`,
                validation: linkRule(),
              }),
            ],
          },
        ],
      },
    }),
  ],
});

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
      name: 'eyebrow',
      title: 'Small line above the heading',
      type: 'string',
      description: 'A word or two, like "Worship arts". Leave blank for none.',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description:
        'One line, like "Praise team, instruments and handbells". Leave blank to use the name.',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description:
        'One photo of this ministry. Landscape works best. With no photo, the Ministries page shows the text on its own.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description:
            'Describe the photo in a few words, for screen readers and search engines. It also shows as the caption under the photo.',
          validation: (R) => R.required(),
        }),
      ],
    }),
    ministryBody,
    defineField({
      name: 'contacts',
      title: 'People to talk to',
      type: 'array',
      description:
        'Pick one or more people from Staff. Each gets a line at the end of the text with their name, role and email, and it changes by itself when their Staff page does.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'staffMember' }] })],
      validation: (R) => R.unique(),
    }),
    // scaffold: church
    // Which of the church's four goals (Who We Are, "Our Goals") this ministry
    // serves (2026-09-24, the Ministries identity pass). OPTIONAL on purpose:
    // it is set only where the church's own words say so, and the rest are
    // left for the church to answer (scripts/data/ministry-goals.json). The
    // Ministries page lists each ministry under its goal near the top
    // (src/lib/ministry-goals.ts); a ministry with none is simply not listed
    // there. A logic-driving dropdown, so `goal` is in NON_STEGA_FIELDS.
    defineField({
      name: 'goal',
      title: 'Goal it serves',
      type: 'string',
      description:
        'Which of the four goals on the Who We Are page this ministry serves. The Ministries page lists it under that goal. Leave blank if it does not fit one.',
      options: {
        list: [
          { title: 'Worship', value: 'worship' },
          { title: 'The Way (Discipleship)', value: 'the-way' },
          { title: 'Witness (Evangelism)', value: 'witness' },
          { title: 'Work (Acts of Mercy)', value: 'work' },
        ],
        layout: 'radio',
      },
    }),
    // scaffold:end
    defineField({
      name: 'summary',
      title: 'One-line summary',
      type: 'text',
      rows: 2,
      description: 'One sentence about the ministry. Not shown on the website at the moment.',
    }),
    defineField({
      name: 'order',
      title: 'Position in the list',
      type: 'number',
      description: 'A number. Lower numbers appear first in the list on the left.',
    }),
  ],
  orderings: [{ title: 'List order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    // The title is a string field. Never preview from a number: it crashes the
    // whole array field (audit:studio check 2).
    select: { title: 'title', subtitle: 'headline', media: 'image' },
  },
});
