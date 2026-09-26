// Foundation, edit with care
// Site-wide announcement banner collection.
//
// Editors can queue several notices ahead of time (a sale, a closure, a
// seasonal promotion) and let them switch on and off by date. The active
// announcement shows at the top of every page above the header. BaseLayout
// picks the most urgent entry that is currently within its date window.
//
// "Active" = enabled AND (no startDate or startDate has passed) AND
//            (no endDate or endDate is still in the future).
//
// Build-time note: date-window logic is evaluated at BUILD TIME. This is a
// static site -- a banner only appears or disappears after a rebuild. Set up a
// Cloudflare deploy hook on a daily schedule (docs/agent/deployment.md) if you
// need banners to auto-expire without a manual publish.
//
// Style tokens map to existing semantic color tokens -- no new tokens are
// introduced here:
//   info      -> bg-muted (calm, informational)
//   highlight -> bg-primary / text-primary-foreground (brand accent, good news)
//   urgent    -> bg-destructive / text-destructive-foreground (red, closures)

import { defineType, defineField } from 'sanity';
import { BellIcon } from '@sanity/icons';

export const announcement = defineType({
  name: 'announcement',
  title: 'Announcement banner',
  type: 'document',
  icon: BellIcon,
  fields: [
    defineField({
      name: 'internalTitle',
      title: 'Internal name',
      type: 'string',
      description:
        'A name so you can find it in the list, like "Snow closing, January". Visitors never see it.',
      validation: (Rule) => Rule.required().error('Give it a name so you can find it later.'),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
      description:
        'What the banner says. One short sentence, like "No service this Sunday because of the snow."',
      validation: (Rule) => [
        Rule.required().error('Type what the banner should say.'),
        Rule.max(160).error('Keep it to 160 letters or fewer.'),
      ],
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      description: 'If more than one banner is on, the most urgent one shows.',
      options: {
        list: [
          { title: 'Info (quiet, for everyday news)', value: 'info' },
          { title: 'Highlight (the church colour, for good news)', value: 'highlight' },
          { title: 'Urgent (red, for a closing or a warning)', value: 'urgent' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
    }),
    defineField({
      name: 'link',
      title: 'Link (optional)',
      type: 'object',
      description: 'Optional. Adds a clickable link at the end of the message.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'label',
          title: 'Link label',
          type: 'string',
          description: 'The words to click, like "See the Christmas services".',
        }),
        defineField({
          name: 'url',
          title: 'Web address',
          type: 'string',
          description:
            'A page on this site like /contact, or a full address starting with https://.',
          validation: (Rule) =>
            Rule.custom((value) =>
              !value || /^(\/|https?:\/\/)/.test(String(value).trim())
                ? true
                : 'Start with a slash, like /contact, or with https://.',
            ),
        }),
      ],
    }),
    defineField({
      name: 'startDate',
      title: 'Show from (optional)',
      type: 'datetime',
      description:
        'Leave blank to show it as soon as it is published. Set a date to have it appear later. The website only checks the date when it rebuilds, which happens whenever anyone publishes, so it may appear a little late.',
    }),
    defineField({
      name: 'endDate',
      title: 'Hide after (optional)',
      type: 'datetime',
      description:
        'Leave blank to keep it up until you switch it off. The website only checks the date when it rebuilds, so to be sure it has gone, switch "Show this banner" off and publish.',
    }),
    defineField({
      name: 'enabled',
      title: 'Show this banner',
      type: 'boolean',
      description: 'When this is off, the banner never shows, whatever the dates say.',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      message: 'message',
      style: 'style',
      enabled: 'enabled',
      start: 'startDate',
      end: 'endDate',
    },
    prepare: ({ message, style, enabled, start, end }) => {
      const window = [
        start ? new Date(start).toLocaleDateString() : null,
        end ? new Date(end).toLocaleDateString() : null,
      ]
        .filter(Boolean)
        .join(' to ');
      return {
        title: message || 'Announcement',
        subtitle: `${enabled ? '' : 'Off. '}${
          ({ info: 'Info', highlight: 'Highlight', urgent: 'Urgent' } as Record<string, string>)[
            style as string
          ] ?? 'Info'
        }${window ? ` (${window})` : ''}`,
      };
    },
  },
  orderings: [
    { title: 'Soonest to end', name: 'endAsc', by: [{ field: 'endDate', direction: 'asc' }] },
    { title: 'Newest', name: 'createdDesc', by: [{ field: '_createdAt', direction: 'desc' }] },
  ],
});
