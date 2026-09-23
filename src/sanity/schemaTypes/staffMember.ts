// Staff member. Harvested from the archived ncs-church-starter and adapted for
// FBCM. No sermon type here (YouTube is the archive) and no event type
// (Church Center holds the calendar) -- this schema only describes who is on
// staff, not what they preach or when things happen.
//
// Every field description says what to type. None explains why the field
// exists: the editor is a church secretary, not a developer.

import { defineField, defineType } from 'sanity';

export const staffMember = defineType({
  name: 'staffMember',
  title: 'Staff member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Their name as it should appear on the page.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'Click Generate.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'Their title, like "Pastor" or "Church Clerk".',
    }),
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      description: 'Their church email address. Leave blank to show none.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone number',
      type: 'string',
      description: 'Their church phone number, if they have one. Leave blank to show none.',
    }),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      options: {
        list: [
          { title: 'Pastors', value: 'pastors' },
          { title: 'Church Coordination Team', value: 'coordination' },
          { title: 'Support and volunteer roles', value: 'support' },
        ],
        layout: 'radio',
      },
      description: 'Pick one. Pastors show first on the Staff page.',
    }),
    defineField({
      name: 'showOnSite',
      title: 'Show on the Staff page',
      type: 'boolean',
      description:
        'Turn off to take this person off the website without deleting them. Their details stay here.',
      initialValue: true,
    }),
    defineField({
      name: 'bio',
      title: 'About them',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'A short paragraph. Leave blank and only the name, role and photo show.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'A head and shoulders photo.',
    }),
    defineField({
      name: 'order',
      title: 'Position in the list',
      type: 'number',
      description: 'A number. Lower numbers appear first.',
    }),
  ],
  orderings: [{ title: 'List order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo', showOnSite: 'showOnSite' },
    prepare: ({ title, subtitle, media, showOnSite }) => ({
      title: title ?? 'Untitled',
      subtitle: showOnSite === false ? `${subtitle ? `${subtitle} ` : ''}(hidden)` : subtitle,
      media,
    }),
  },
});
