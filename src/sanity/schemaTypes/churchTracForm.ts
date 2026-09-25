// scaffold-file: church
// Church Trac form (2026-09-25). One form the church built in Church Trac
// (the connection card, a prayer request, a wedding enquiry, online giving),
// kept here once so any page can show it through a "Church Trac form" band
// (churchTracFormSection in churchSections.ts). Change the form here and every
// page that shows it changes with it.
//
// The staff paste the embed code Church Trac gives them. The site keeps only
// the form's address from it, and only a churchtrac.com one
// (src/lib/church-trac-form.ts, which this file's validation shares), so the
// paste box can never put anything else on the site.
//
// Every field description says what to type, for a church secretary.

import { ClipboardIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';
import { checkPaste, formSrc } from '../../lib/church-trac-form.ts';

export const churchTracForm = defineType({
  name: 'churchTracForm',
  title: 'Church Trac form',
  type: 'document',
  icon: ClipboardIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Form name',
      type: 'string',
      description:
        'What the form is, like "Connection card" or "Prayer request". Visitors see it as the frame\'s name, and you see it when you pick the form for a page.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'embed',
      title: 'Embed code from Church Trac',
      type: 'text',
      rows: 4,
      description:
        "In Church Trac: Church Connect, pick the form, Show Additional Options, then Form/Giving Embed Domain. Type this website's address there, save, and copy the code it gives you (it starts with <iframe). Paste it here. For online giving, the code is under Connect Setup, Connect Settings, Online Giving, Embed.",
      validation: (r) => r.custom((value) => checkPaste(value)),
    }),
    defineField({
      name: 'size',
      title: 'Form size',
      type: 'string',
      description:
        "How tall the form's frame is on the page. Pick the size that shows the whole form without a scroll bar inside it: Short for a few questions, Long for a long form or giving.",
      initialValue: 'medium',
      options: {
        list: [
          { title: 'Short (a few questions)', value: 'short' },
          { title: 'Medium', value: 'medium' },
          { title: 'Long (many questions, or giving)', value: 'long' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
  ],
  preview: {
    select: { title: 'title', embed: 'embed' },
    prepare: ({ title, embed }) => ({
      title: title || 'Church Trac form',
      subtitle: formSrc(embed)
        ? 'Ready to show on a page'
        : 'Paste the embed code from Church Trac',
      media: ClipboardIcon,
    }),
  },
});
