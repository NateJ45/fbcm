// Foundation, edit with care
// Content-side singleton. Location facts: where the business is, and its map
// coordinates. This used to also carry service areas, travel fees and an
// availability status; those were service-business fields removed 2026-09-19
// when the church rebuild gave siteSettings its own "Church details" tab
// (see siteSettings.ts). What is left here (city, state, geo) is still read
// by the LocalBusiness structured data (src/lib/schemas.ts) and the map on
// the Contact page.
// One instance only (id 'businessInfo'); singleton enforcement is in sanity.config.ts.
//
// NOT IN THE DESK since the Studio audit (2026-09-26): the document does not
// exist in the dataset, the church's whole address lives in Site settings >
// Church details, and opening this created a document carrying the starter's
// placeholder city and state, which the Sunday times and letter bands print
// after the street address. The placeholder initial values are gone too, and
// the titles below say what each box is in plain words, in case it ever comes
// back.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const businessInfo = defineType({
  name: 'businessInfo',
  title: 'Location details',
  type: 'document',
  // Business facts, not prose — keep out of Canvas's AI-assisted writing UI.
  options: { canvasApp: { exclude: true } },
  fields: [
    // Business model: controls which location fields apply and which are shown.
    defineField({
      name: 'businessModel',
      title: 'Where the church meets',
      type: 'string',
      description: 'In person. The other choices hide the location boxes below.',
      options: {
        list: [
          { title: 'In-person', value: 'in-person' },
          { title: 'Remote (fully virtual)', value: 'remote' },
          { title: 'Hybrid', value: 'hybrid' },
        ],
        layout: 'radio',
      },
      initialValue: 'in-person',
    }),

    // Home-base location. One source of truth for the city/state shown in the
    // footer AND fed into the LocalBusiness structured data search engines read.
    // Keep these matching your Google Business Profile exactly (NAP consistency).
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      description:
        'Leave blank. The address in Site settings already includes the city, and anything typed here is printed a second time after it.',
      hidden: ({ document }) => document?.businessModel === 'remote',
      // Optional for remote/hybrid — validation removed; leave blank is valid.
    }),
    defineField({
      name: 'state',
      title: 'State (two letters)',
      type: 'string',
      description: 'Leave blank, for the same reason as the city.',
      hidden: ({ document }) => document?.businessModel === 'remote',
      validation: (Rule) => Rule.length(2).warning('Use the 2-letter state code, like "IN".'),
    }),
    defineField({
      name: 'serviceRegion',
      title: 'Area served',
      type: 'string',
      description: 'Not shown on the website.',
      hidden: ({ document }) => document?.businessModel === 'remote',
    }),
    defineField({
      name: 'geoLat',
      title: 'Latitude',
      type: 'number',
      description:
        'The church\'s map position, for "near me" searches. In Google Maps, right-click the church and click the first number shown.',
      hidden: ({ document }) => document?.businessModel === 'remote',
    }),
    defineField({
      name: 'geoLng',
      title: 'Longitude',
      type: 'number',
      description: 'The second of the two map numbers, after the latitude.',
      hidden: ({ document }) => document?.businessModel === 'remote',
    }),

    // Additional locations for multi-location businesses.
    // Each entry can power a separate address in structured data.
    defineField({
      name: 'additionalLocations',
      title: 'Other locations',
      type: 'array',
      description: 'Not used by the church.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'additionalLocation',
          fields: [
            defineField({
              name: 'city',
              title: 'City',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'state',
              title: 'State (2-letter code)',
              type: 'string',
              validation: (Rule) =>
                Rule.required().length(2).warning('Use the 2-letter state code.'),
            }),
            defineField({
              name: 'geoLat',
              title: 'Latitude',
              type: 'number',
            }),
            defineField({
              name: 'geoLng',
              title: 'Longitude',
              type: 'number',
            }),
          ],
          preview: {
            select: { city: 'city', state: 'state' },
            prepare: ({ city, state }) => ({
              title: [city, state].filter(Boolean).join(', ') || '(no city)',
            }),
          },
        }),
      ],
      hidden: ({ document }) => document?.businessModel === 'remote',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Location details' }),
  },
});
