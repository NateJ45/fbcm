// Privacy policy page singleton. Route: /privacy.
// Portable Text body + last-updated date, editable by the site editor.
// One instance only; singleton enforcement in sanity.config.ts.
// Safe to edit by hand.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const privacyPage = defineType({
  name: 'privacyPage',
  title: 'Privacy policy page',
  type: 'document',
  // Configuration, not prose the editor writes — exclude from Canvas.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'Search and sharing' },
    { name: 'hero', title: 'Top of the page' },
    { name: 'content', title: 'The policy' },
  ],
  fields: [
    // SEO
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

    // Hero
    defineField({
      name: 'heroEyebrow',
      title: 'Small line above the heading',
      type: 'string',
      group: 'hero',
      description: 'A few words, like "This site, plainly." Leave blank for none.',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Heading',
      type: 'string',
      group: 'hero',
      initialValue: 'Privacy Policy',
      validation: (Rule) => Rule.required().error('Type the heading, like "Privacy Policy".'),
    }),
    defineField({
      name: 'heroSubhead',
      title: 'Line under the heading',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'A sentence or two. Leave blank for none.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Background photo (not shown)',
      type: 'image',
      group: 'hero',
      // Not drawn by src/pages/privacy.astro, and empty in the dataset.
      // Hidden rather than removed so nothing stored is orphaned (rule 1);
      // never required, so it cannot trap the document.
      hidden: true,
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string' })],
    }),
    defineField({
      name: 'heroScriptAccent',
      title: 'Handwritten accent word (not shown)',
      type: 'string',
      group: 'hero',
      // Not drawn by src/pages/privacy.astro, and empty in the dataset.
      hidden: true,
    }),

    // Content
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      group: 'content',
      description: 'Shown at the top of the policy. Change it whenever you change the policy.',
      validation: (Rule) => Rule.required().error('Pick the date the policy last changed.'),
    }),
    defineField({
      name: 'body',
      title: 'The policy',
      type: 'array',
      group: 'content',
      description: 'The whole privacy policy. Use the Heading styles to break it into parts.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraph', value: 'normal' },
            { title: 'Heading', value: 'h2' },
            { title: 'Smaller heading', value: 'h3' },
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
                  {
                    name: 'href',
                    type: 'url',
                    title: 'Web address',
                    description: 'A full address, starting with https://.',
                  },
                  {
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in a new tab',
                    initialValue: false,
                  },
                ],
              },
            ],
          },
        }),
      ],
      validation: (Rule) => Rule.required().error('The policy is empty. Type or paste it here.'),
    }),
  ],
  preview: { prepare: () => ({ title: 'Privacy policy page' }) },
});
