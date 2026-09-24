// 404 page singleton. Drives the eyebrow, headline, body and the four doors
// on /404. Default values match what was hardcoded in the page before this
// singleton existed, so the site looks identical on launch.
//
// 2026-09-24 (the utility identity pass): the page became an indigo band with
// the apology and a row of four doors, each with a building glyph (Visit, Who
// We Are, Blog, Give). The three CTA pairs became the first three doors and a
// fourth pair was added, optional (CLAUDE.md rule 1: additive only). The
// photo is no longer drawn (the church's tower is the home hero's and the
// history opener's, and a photo is not reused across pages); the field stays
// so the value an editor set is not orphaned, and its description says so.

import { defineType, defineField } from 'sanity';

export const notFoundPage = defineType({
  name: 'notFoundPage',
  title: '404 Page',
  type: 'document',
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'content', title: 'Content' },
    { name: 'ctas', title: 'Doors' },
  ],
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      group: 'seo',
      initialValue: 'Page not found',
      description:
        'Browser tab and Google result title. Aim for 50 to 60 characters. Front-load the location or service.',
      validation: (Rule) =>
        Rule.max(60).warning(
          'Titles longer than about 60 characters get cut off in Google search results.',
        ),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 2,
      group: 'seo',
      initialValue: 'That page wandered off. Head back to the homepage or get in touch.',
      description:
        'The sentence under the title in Google results. Aim for 150 to 160 characters. Write it for a person, not a search engine.',
      validation: (Rule) =>
        Rule.max(160).warning(
          'Descriptions longer than about 160 characters get cut off in Google search results.',
        ),
    }),

    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
      initialValue: '404',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      group: 'content',
      initialValue: 'That page wandered off.',
    }),
    defineField({
      name: 'body',
      title: 'Body copy',
      type: 'text',
      rows: 3,
      group: 'content',
      initialValue:
        "It happens. Maybe a link is old, maybe the URL has a typo. Either way, here's where to head next.",
    }),
    defineField({
      name: 'heroImage',
      title: 'Photo',
      type: 'image',
      group: 'content',
      description:
        'Not shown on the page since 2026-09-24: the 404 draws the church door and four doors to the main pages instead. Leave it blank.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (R) => R.required(),
        }),
        defineField({
          name: 'caption',
          title: 'Caption (optional)',
          type: 'string',
          description: 'Not shown anywhere on the site.',
        }),
      ],
    }),

    defineField({
      name: 'primaryCtaLabel',
      title: 'First door label',
      type: 'string',
      group: 'ctas',
      initialValue: 'Plan a visit',
    }),
    defineField({
      name: 'primaryCtaHref',
      title: 'First door destination',
      type: 'string',
      group: 'ctas',
      initialValue: '/visit',
      description: 'Use a relative URL like "/" or "/contact". External URLs work too.',
    }),
    defineField({
      name: 'secondaryCtaLabel',
      title: 'Second door label',
      type: 'string',
      group: 'ctas',
      initialValue: 'Who we are',
    }),
    defineField({
      name: 'secondaryCtaHref',
      title: 'Second door destination',
      type: 'string',
      group: 'ctas',
      initialValue: '/who-we-are',
    }),
    defineField({
      name: 'tertiaryCtaLabel',
      title: 'Third door label',
      type: 'string',
      group: 'ctas',
      initialValue: 'Read the blog',
    }),
    defineField({
      name: 'tertiaryCtaHref',
      title: 'Third door destination',
      type: 'string',
      group: 'ctas',
      initialValue: '/blog',
    }),
    // 2026-09-24: the fourth door. Optional; blank falls back to Give (/give).
    defineField({
      name: 'fourthCtaLabel',
      title: 'Fourth door label',
      type: 'string',
      group: 'ctas',
      description: 'The fourth door on the 404 page. Blank shows "Give".',
    }),
    defineField({
      name: 'fourthCtaHref',
      title: 'Fourth door destination',
      type: 'string',
      group: 'ctas',
      description: 'Use a relative URL like "/give". Blank goes to /give.',
    }),
  ],
  preview: { prepare: () => ({ title: '404 Page' }) },
});
