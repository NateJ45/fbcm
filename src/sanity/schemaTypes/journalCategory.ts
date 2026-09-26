// scaffold-file: journal
// Journal category taxonomy. Lightweight — a category is just a name + slug
// + optional description. Posts can have multiple categories; the first one
// shows on the card.
//
// PLACEHOLDER CATEGORIES. Replace these with the ones this project publishes
// under; they are here to show the shape, not to be shipped:
//   Category One · Category Two · Behind the Scenes · Q&A · Announcements
//
// Editors create new categories as they need them. The journal index page
// renders category chips automatically based on what's been used.

import { defineType, defineField } from 'sanity';

export const journalCategory = defineType({
  name: 'journalCategory',
  title: 'Category',
  type: 'document',
  // Taxonomy, not content — exclude from Canvas's free-form writing UI.
  options: { canvasApp: { exclude: true } },
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'The category name as visitors see it, like "Sermon Preview".',
      validation: (Rule) => [
        Rule.required().error('Give the category a name.'),
        Rule.max(40).error('Keep the name to 40 letters or fewer.'),
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      description:
        "The end of the category page's address, like sermon-preview for /blog/category/sermon-preview. Click Generate.",
      options: { source: 'title', maxLength: 64 },
      validation: (Rule) => Rule.required().error('Click Generate to make the web address.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description:
        "Optional. A sentence on what the category holds. It opens the category's own page, and Google shows it under the page's link.",
      validation: (Rule) => Rule.max(160).error('Keep it to 160 letters or fewer.'),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'description' },
  },
});
