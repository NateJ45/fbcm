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
  title: 'Page not found (404)',
  type: 'document',
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'Search and sharing' },
    { name: 'content', title: 'Words' },
    { name: 'ctas', title: 'The four doors' },
  ],
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'Title in Google',
      type: 'string',
      group: 'seo',
      initialValue: 'Page not found',
      description:
        "The title in the browser tab and in Google's results. About 50 to 60 letters. Leave blank to use the page's own title.",
      validation: (Rule) =>
        Rule.max(60).warning('Google cuts off titles longer than about 60 letters.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Description in Google',
      type: 'text',
      rows: 2,
      group: 'seo',
      initialValue: 'That page wandered off. Head back to the homepage or get in touch.',
      description:
        "The sentence under the title in Google's results. About 150 to 160 letters. A placeholder in curly brackets, like {service time}, is filled in from Site settings.",
      validation: (Rule) =>
        Rule.max(160).warning('Google cuts off descriptions longer than about 160 letters.'),
    }),

    defineField({
      name: 'eyebrow',
      title: 'Small line above the heading',
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
      title: 'Text',
      type: 'text',
      rows: 3,
      group: 'content',
      initialValue:
        "It happens. Maybe a link is old, maybe the address has a typo. Either way, here's where to head next.",
    }),
    defineField({
      name: 'heroImage',
      title: 'Photo (not shown)',
      type: 'image',
      group: 'content',
      // Not drawn since the utility identity pass (2026-09-24), and empty in the
      // dataset. Hidden rather than removed so nothing stored is orphaned
      // (rule 1); the alt is no longer required, so it cannot trap the document.
      hidden: true,
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Describe the photo',
          type: 'string',
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
      title: 'First door: words',
      type: 'string',
      group: 'ctas',
      initialValue: 'Plan a visit',
    }),
    defineField({
      name: 'primaryCtaHref',
      title: 'First door: where it goes',
      type: 'string',
      group: 'ctas',
      initialValue: '/visit',
      description: 'A page on this site, like /visit.',
    }),
    defineField({
      name: 'secondaryCtaLabel',
      title: 'Second door: words',
      type: 'string',
      group: 'ctas',
      initialValue: 'Who we are',
    }),
    defineField({
      name: 'secondaryCtaHref',
      title: 'Second door: where it goes',
      type: 'string',
      group: 'ctas',
      initialValue: '/who-we-are',
    }),
    defineField({
      name: 'tertiaryCtaLabel',
      title: 'Third door: words',
      type: 'string',
      group: 'ctas',
      initialValue: 'Read the blog',
    }),
    defineField({
      name: 'tertiaryCtaHref',
      title: 'Third door: where it goes',
      type: 'string',
      group: 'ctas',
      initialValue: '/blog',
    }),
    // 2026-09-24: the fourth door. Optional; blank falls back to Give (/give).
    defineField({
      name: 'fourthCtaLabel',
      title: 'Fourth door: words',
      type: 'string',
      group: 'ctas',
      description: 'Leave blank for "Give".',
    }),
    defineField({
      name: 'fourthCtaHref',
      title: 'Fourth door: where it goes',
      type: 'string',
      group: 'ctas',
      description: 'A page on this site. Leave blank for /give.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Page not found (404)' }) },
});
