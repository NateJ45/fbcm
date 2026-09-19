// Home page singleton. Content for the pageBuilder array (the only editing
// surface) plus SEO.
//
// Task 10 of plan 2a (2026-09-19) deleted the hidden/readOnly legacy fields
// this file used to carry (hero*, meetFounder*, featuredWork*,
// featuredJournal*, process*, servicesGrid*, final*): structured content for
// capabilities this fork never uses, held hidden for rollback safety since
// the fork. Removing a field from the schema does not remove its DATA — see
// CLAUDE.md rule 1 and rule 16. `npm run audit:studio` checks the live
// document for stored keys the schema no longer declares; if it found any,
// `scripts/retire-homepage-legacy-fields.mjs` backed the document up and
// unset them (dry by default, `--write` to act).

import { defineType, defineField } from 'sanity';
import { HOME_SECTION_TYPES } from './richSections';
import { sectionArrayOptions } from './sections';

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  // Marketing copy is locked and structural — edit fields directly in Studio, not Canvas.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'pageBuilder', title: 'Page layout' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // Page builder (primary editing surface — section-driven)
    defineField({
      name: 'pageBuilder',
      title: 'Page layout',
      type: 'array',
      group: 'pageBuilder',
      description:
        "Sections on this page. Drag to reorder, remove a section to hide it, or add a new block from the library. Edit each section's content by clicking into it.",
      of: HOME_SECTION_TYPES,
      // Grouped + searchable insert menu, in the form AND in the preview canvas.
      options: sectionArrayOptions,
    }),

    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      group: 'seo',
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
      rows: 3,
      group: 'seo',
      description:
        'The sentence under the title in Google results. Aim for 150 to 160 characters. Write it for a person, not a search engine.',
      validation: (Rule) =>
        Rule.max(160).warning(
          'Descriptions longer than about 160 characters get cut off in Google search results.',
        ),
    }),
    defineField({
      name: 'seoImage',
      title: 'Social share image (this page)',
      type: 'image',
      group: 'seo',
      description:
        'Optional. The image shown when this page is shared on social media or in a text. Overrides the site default in Site Settings. Use a wide image, about 1200 by 630 pixels. Leave blank to use the site default.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home Page' }) },
});
