// Reusable object type: a CTA button + link.
// Embedded by page singletons wherever a primary/secondary CTA appears.

import { defineType, defineField } from 'sanity';
import { linkRule, LINK_TOKEN_HINT } from './_linkRule.ts';

export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'CTA Block',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Button text',
      type: 'string',
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: 'linkType',
      title: 'Link type',
      type: 'string',
      options: {
        list: [
          { title: 'Internal page', value: 'internal' },
          { title: 'External URL', value: 'external' },
          { title: 'Email', value: 'email' },
          { title: 'Phone', value: 'phone' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
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
    }),
    defineField({
      name: 'externalUrl',
      title: 'Full URL',
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
      description: LINK_TOKEN_HINT,
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
          if (!value) return 'Email is required';
          return /.+@.+\..+/.test(value) ? true : 'Must be a valid email';
        }),
      hidden: ({ parent }) => parent?.linkType !== 'email',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'Phone number',
      type: 'string',
      hidden: ({ parent }) => parent?.linkType !== 'phone',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { label: 'label', linkType: 'linkType' },
    prepare: ({ label, linkType }) => ({ title: label || '(no label)', subtitle: linkType }),
  },
});
