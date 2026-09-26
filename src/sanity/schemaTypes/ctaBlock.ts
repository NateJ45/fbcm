// Reusable object type: a CTA button + link.
// Embedded by page singletons wherever a primary/secondary CTA appears.

import { defineType, defineField } from 'sanity';
import { linkRule, LINK_TOKEN_HINT } from './_linkRule.ts';

export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'Button',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Button text',
      type: 'string',
      description: 'A few words, like "Plan a visit".',
      validation: (Rule) => [
        Rule.required().error('Type the words on the button.'),
        Rule.max(40).error('Keep the button text to 40 letters or fewer.'),
      ],
    }),
    defineField({
      name: 'linkType',
      title: 'Where does it go?',
      type: 'string',
      options: {
        list: [
          { title: 'A page on this site', value: 'internal' },
          { title: 'A web address or a link placeholder', value: 'external' },
          { title: 'An email address', value: 'email' },
          { title: 'A phone number', value: 'phone' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required().error('Choose where the button goes.'),
    }),
    defineField({
      name: 'internalLink',
      title: 'Page to link to',
      type: 'reference',
      to: [
        { type: 'homePage' },
        { type: 'journalPage' }, // scaffold: journal
        { type: 'journalEntry' }, // scaffold: journal
        { type: 'page' },
      ],
      hidden: ({ parent }) => parent?.linkType !== 'internal',
      validation: (Rule) =>
        Rule.custom((value, ctx) => {
          const parent = ctx.parent as { linkType?: string } | undefined;
          return parent?.linkType === 'internal' && !value ? 'Pick the page to link to.' : true;
        }),
    }),
    defineField({
      name: 'externalUrl',
      title: 'Web address',
      type: 'url',
      // RELATIVE URLs ARE ALLOWED ON PURPOSE (2026-09-19, plan 2b task 4).
      // `internalLink` is a reference, so it can point at a DOCUMENT and
      // nothing else: it cannot carry a fragment ("/history#building") and it
      // cannot point at a route with no document behind it ("/blog"). Those
      // two cases ride in here instead, as a relative path with
      // openInNewTab off, which CtaLink.astro passes through unchanged. The
      // default url validation rejects anything without a scheme, so it is
      // widened rather than dropped: http, https, mailto and tel still have to
      // look like themselves.
      // Since feat/church-links it may also hold a church link placeholder
      // ({giving}, {connect}...), filled from Site settings at build time.
      description: `A page on this site like /visit, or a full address like https://example.org. ${LINK_TOKEN_HINT}`,
      validation: linkRule(),
      hidden: ({ parent }) => parent?.linkType !== 'external',
    }),
    defineField({
      name: 'emailAddress',
      title: 'Email address',
      type: 'string',
      validation: (Rule) =>
        Rule.custom((value, ctx: any) => {
          if (ctx.parent?.linkType !== 'email') return true;
          if (!value) return 'Type the email address.';
          return /.+@.+\..+/.test(value) ? true : 'That does not look like an email address.';
        }),
      hidden: ({ parent }) => parent?.linkType !== 'email',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'Phone number',
      type: 'string',
      description: 'Like (765) 284-7749.',
      hidden: ({ parent }) => parent?.linkType !== 'phone',
      validation: (Rule) =>
        Rule.custom((value, ctx: any) => {
          if (ctx.parent?.linkType !== 'phone') return true;
          if (!value) return 'Type the phone number.';
          return /\d{3}/.test(value) ? true : 'That does not look like a phone number.';
        }),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in a new tab',
      type: 'boolean',
      description: 'Usually off. Turn on for a link to another website.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { label: 'label', linkType: 'linkType' },
    prepare: ({ label, linkType }) => ({
      title: label || '(no button text yet)',
      subtitle:
        (
          {
            internal: 'A page on this site',
            external: 'A web address',
            email: 'An email address',
            phone: 'A phone number',
          } as Record<string, string>
        )[linkType as string] ?? '',
    }),
  },
});
