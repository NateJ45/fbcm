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
  title: 'Home page',
  type: 'document',
  // Marketing copy is locked and structural — edit fields directly in Studio, not Canvas.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'pageBuilder', title: 'Sections' },
    { name: 'seo', title: 'Search and sharing' },
  ],
  fields: [
    // Page builder (primary editing surface — section-driven)
    defineField({
      name: 'pageBuilder',
      title: 'Sections',
      type: 'array',
      group: 'pageBuilder',
      description:
        'The sections of the home page, top to bottom. Drag one by its handle to move it, click one to change its words, or use Add item to add a new one.',
      of: HOME_SECTION_TYPES,
      // Grouped + searchable insert menu, in the form AND in the preview canvas.
      options: sectionArrayOptions,
    }),

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
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
});
