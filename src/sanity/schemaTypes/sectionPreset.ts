// =============================================================================
// sectionPreset - a saved section, ready to drop onto another page
// =============================================================================
// THE PROBLEM. An editor spends twenty minutes getting a "Book a consultation"
// band right, then wants the same band on four more pages and rebuilds it by
// hand each time (or duplicates a whole page to get at one strip of it).
//
// THE SHAPE. `section` is an ARRAY of every section type, capped at one. A
// single-object field would need a union type Sanity has no syntax for, and a
// per-type field would mean twenty fields. The array gets us three things for
// free: the same grouped "+ Add" picker the page builder uses, the normal
// section FORM (so a saved section can be edited in place, not just replayed),
// and the ordinary preview of whichever type it holds.
//
// The member list is the WIDEST union in the repo (the general blocks plus the
// rich per-page blocks), because a preset should be savable from any page. The
// insert menu is the shared one, so the picker reads the same here as it does
// on a page; groups whose types are absent simply do not appear.
//
// `sectionType` is the type name copied out of that array when the preset is
// captured. It is read-only and exists so the list and the navigator can label
// a preset without opening it.
//
// HOW ONE IS MADE. Usually not here: open a page and use "Save a section as
// preset..." in the publish menu (src/sanity/actions/saveSectionPreset.tsx).
// Creating one from scratch in this list works too.
//
// HOW ONE IS USED. The "Saved sections" group under the page list beside the
// live preview (src/sanity/components/PreviewNavigator.tsx) adds it to the page
// you are looking at. The "+ Add section" picker inside a page cannot list
// documents, which is why the insert surface lives there.
//
// A preset is a COPY, not a link. Editing a preset never changes the pages it
// was already added to, and editing one of those pages never changes the preset.
//
// No field groups on purpose: an undefined group name is a fatal Studio-runtime
// error in Sanity 6.4 that a build does not catch, and four fields need none.
// =============================================================================

import { defineType, defineField } from 'sanity';
import { BlockElementIcon } from '@sanity/icons/BlockElement';
import { LIBRARY_SECTION_TYPES, sectionArrayOptions } from './sections';
import { RICH_SECTION_TYPES } from './richSections';
import { sectionTitle } from '../sectionTitles';

export const sectionPreset = defineType({
  name: 'sectionPreset',
  title: 'Saved section',
  type: 'document',
  icon: BlockElementIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'Name this saved section so you can find it again.',
      validation: (R) => R.required().error('Give it a name so you can find it again.'),
    }),
    defineField({
      name: 'sectionType',
      title: 'Kind of section',
      type: 'string',
      readOnly: true,
      description: 'Filled in for you when the section is saved.',
    }),
    defineField({
      name: 'section',
      title: 'The section (or sections)',
      type: 'array',
      // Never syncedSection (LIBRARY_SECTION_TYPES, card 109), so no loop can exist.
      of: [...LIBRARY_SECTION_TYPES, ...RICH_SECTION_TYPES],
      options: sectionArrayOptions,
      description:
        'What gets added to a page. Add more than one to make a set that always goes together, like an Easter invitation. Pages that show this as a synced section change when you publish here; pages that got a copy keep their own.',
      validation: (R) => [
        R.min(1).warning('Add at least one section, or this saved section adds nothing.'),
        R.max(12).error('A saved section can hold up to 12 sections. Split it into two.'),
      ],
    }),
    defineField({
      name: 'note',
      title: 'Note (optional)',
      type: 'text',
      rows: 2,
      description: 'A reminder for whoever finds this later, like "for the Visit page".',
    }),
  ],
  preview: {
    select: { title: 'title', sectionType: 'sectionType', note: 'note', section: 'section' },
    prepare({ title, sectionType, note, section }) {
      const count = Array.isArray(section) ? section.length : 0;
      const first =
        typeof sectionType === 'string' && sectionType
          ? sectionType
          : count > 0 && typeof section[0]?._type === 'string'
            ? section[0]._type
            : null;
      const kind = count > 1 ? `${count} sections` : first ? sectionTitle(first) : null;
      return {
        title: title || '(unnamed saved section)',
        subtitle: [kind, note].filter(Boolean).join(', '),
      };
    },
  },
});
