// scaffold-file: journal
// Journal index page singleton. Drives the hero copy and final-CTA section on
// /blog. The posts grid itself is auto-populated from journalEntry documents.

import { defineType, defineField } from 'sanity';
import { additionalSectionsField } from './sections';

export const journalPage = defineType({
  name: 'journalPage',
  title: 'Blog page',
  type: 'document',
  // Page singleton (hero + final CTA only) — structural, not free-form drafting.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'Search and sharing' },
    { name: 'hero', title: 'Top of the page' },
    { name: 'extra', title: 'Sections under the posts' },
  ],
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'Title in Google',
      type: 'string',
      group: 'seo',
      description:
        "The title in the browser tab and in Google's results. About 50 to 60 letters. Leave blank to use the page's own title.",
      validation: (Rule) =>
        Rule.max(60).warning('Google cuts off titles longer than about 60 letters.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Description in Google',
      type: 'text',
      rows: 3,
      group: 'seo',
      description:
        "The sentence under the title in Google's results. About 150 to 160 letters. A placeholder in curly brackets, like {service time}, is filled in from Site settings.",
      validation: (Rule) =>
        Rule.max(160).warning('Google cuts off descriptions longer than about 160 letters.'),
    }),
    defineField({
      name: 'seoImage',
      title: 'Picture when shared',
      type: 'image',
      group: 'seo',
      description:
        "Optional. The picture shown when someone shares this page on Facebook or in a text message. A wide picture, about 1200 by 630 pixels. Leave blank and the site draws one in the church's colours.",
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the picture', type: 'string' })],
    }),

    defineField({
      name: 'heroEyebrow',
      title: 'Small line above the heading',
      type: 'string',
      group: 'hero',
      description: 'A word or two, like "Blog".',
      initialValue: 'Blog',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Heading',
      type: 'string',
      group: 'hero',
      initialValue: 'Writing from First Baptist.',
    }),
    defineField({
      name: 'heroSubhead',
      title: 'Line under the heading',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'A sentence on what the blog holds.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Background photo (not shown)',
      type: 'image',
      group: 'hero',
      // Not drawn by src/pages/blog/index.astro (the opener is an indigo band).
      // Hidden rather than removed so the stored photo is not orphaned (rule 1);
      // the alt is no longer required, so a hidden box can never block Publish.
      hidden: true,
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string' })],
    }),
    defineField({
      name: 'heroScriptAccent',
      title: 'Handwritten accent word (not shown)',
      type: 'string',
      group: 'hero',
      // Not drawn by src/pages/blog/index.astro.
      hidden: true,
    }),
    defineField({
      name: 'stickyCtaLabel',
      title: 'Floating button on every post',
      type: 'string',
      group: 'hero',
      description:
        'The words on the small button that appears on a blog post once a reader is halfway down, like "Got a question?". Leave blank to use "Got a question?".',
    }),

    defineField({
      name: 'finalCtaHeadline',
      title: 'Closing heading',
      type: 'string',
      // The closing band is not drawn by src/pages/blog/index.astro. Every
      // field in this group is hidden, not removed (rule 1).
      hidden: true,
    }),
    defineField({
      name: 'finalCtaScriptAccent',
      title: 'Closing heading accent word',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'finalCtaSubhead',
      title: 'Closing text',
      type: 'text',
      rows: 2,
      hidden: true,
    }),
    defineField({
      name: 'finalCta',
      title: 'Closing button',
      type: 'ctaBlock',
      hidden: true,
    }),
    defineField({
      name: 'finalCtaBackgroundImage',
      title: 'Closing background photo',
      type: 'image',
      hidden: true,
      options: { hotspot: true },
    }),
    // Spread with its `name` written out rather than passed as a bare
    // identifier: scripts/audit-studio.mjs reads the schema as SOURCE and only
    // resolves a shared field const inside the file that declares it, so an
    // imported one looks undeclared and every document storing it is reported
    // as "Remove field" bait (check 3, CLAUDE.md rule 1). The name here and the
    // one in sections.ts are the same string by construction: the spread would
    // overwrite a different one.
    defineField({
      ...additionalSectionsField,
      name: 'additionalSections',
      title: 'Sections under the posts',
      description:
        'Sections shown below the list of posts. The Visitor and the two books are listed here, in "Publications".',
    }),
  ],
  // The posts grid, the pager and the chips are all drawn in code from the
  // journalEntry documents; this array is the one editable zone on /blog, and
  // it is where the "#publications" document list (The Visitor and the two
  // books) lives. It renders between the archive grid and the closing CTA.
  preview: { prepare: () => ({ title: 'Blog page' }) },
});
