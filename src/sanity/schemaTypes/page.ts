// Foundation, edit with care
// Custom page — the document an editor creates to build a new page from the
// section block library, without touching code.
//
// Routed by src/pages/[slug].astro at /<slug>. Built-in route names are
// reserved so a custom page can never collide with a real page. NOT a singleton
// (editors make as many as they like), so it is deliberately kept out of the
// SINGLETON_TYPES sets in sanity.config.ts and structure.ts.
//
// The reserved-slug list is IMPORTED from src/lib/reservedSlugs.ts, not copied.
// It used to be a second hand-kept copy with a "keep in sync" comment over it,
// which is exactly the shape of thing that goes stale: the two lists guard one
// invariant from two sides (the Studio shows a validation error, the Astro
// route filters getStaticPaths) and there is no gate that would notice them
// disagreeing. There is one list now, and it carries the scaffold markers, so
// removing a capability takes its slug out of both consumers at once.

import { defineType, defineField } from 'sanity';
import { DocumentsIcon } from '@sanity/icons';
import { SECTION_TYPES, sectionArrayOptions } from './sections';
import { PUBLISH_AT_GROUP, publishAtField } from './_publishAt';
import { seoFields } from './_seoFields';
import { RESERVED_SLUGS } from '../../lib/reservedSlugs';

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentsIcon,
  groups: [
    { name: 'content', title: 'Page', default: true },
    { name: 'menu', title: 'Footer and archive' },
    { name: 'seo', title: 'Search and sharing' },
    PUBLISH_AT_GROUP,
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page title',
      type: 'string',
      group: 'content',
      description:
        'The name of the page. It shows in the browser tab, unless "Title in Google" under Search and sharing says otherwise.',
      validation: (Rule) => Rule.required().error('Give the page a title.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      group: 'content',
      description:
        "The end of the page's address, like visit for fbcmuncie.org/visit. Click Generate to make one from the title. Once the page is published, changing this files a forward from the old address for you.",
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) =>
        Rule.required().custom((slug) => {
          const v = slug?.current;
          if (!v) return 'Click Generate to make the web address.';
          if (RESERVED_SLUGS.has(v))
            return `"${v}" is already taken by a part of the website. Pick a different address.`;
          if (!/^[a-z0-9-]+$/.test(v)) return 'Use only small letters, numbers and dashes.';
          return true;
        }),
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Sections',
      type: 'array',
      group: 'content',
      description:
        'The sections of the page, top to bottom. Drag one by its handle to move it, click one to change its words, or use Add item to add a new one.',
      of: SECTION_TYPES,
      // Grouped + searchable insert menu, in the form AND in the preview canvas.
      options: sectionArrayOptions,
    }),

    // ── Menu placement ────────────────────────────────────────────────────────
    // addToMainNav and navGroup are HIDDEN since the Studio audit (2026-09-26):
    // nothing on the site reads them (getNavPages() in queries.ts has no
    // caller; the header menu is Site settings > Menus), so the switch did
    // nothing when an editor turned it on. Kept declared so no stored value is
    // orphaned (rule 1); every page stores false.
    defineField({
      name: 'addToMainNav',
      title: 'Show in the top menu (not used)',
      type: 'boolean',
      group: 'menu',
      initialValue: false,
      hidden: true,
    }),
    defineField({
      name: 'navGroup',
      title: 'Where in the top menu (not used)',
      type: 'string',
      group: 'menu',
      initialValue: 'top',
      hidden: true,
      options: {
        list: [
          { title: 'Its own menu item', value: 'top' },
          { title: 'In a dropdown', value: 'services' },
          { title: 'In a second dropdown', value: 'resources' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'navLabel',
      title: 'Words for the footer link (optional)',
      type: 'string',
      group: 'menu',
      hidden: ({ parent }) => !parent?.addToFooter,
      description:
        'Shorter words for the link, if the page title is long. Leave blank to use the title.',
    }),
    defineField({
      name: 'addToFooter',
      title: 'Show in the footer',
      type: 'boolean',
      group: 'menu',
      initialValue: false,
      description:
        'Turn on to add a link to this page in the first column of links at the foot of every page. The top menu is set in Site settings, under Menus.',
    }),

    // ── Archived ──────────────────────────────────────────────────────────────
    // A real "put it away", not a delete. The document stays exactly as it is,
    // and every live-site query skips it (`archived != true`, so a page made
    // before this field existed stays visible). Nothing reference-blocks it, and
    // Restore brings the page back unchanged. Set from the publish menu
    // (components/pageActions.tsx) or a navigator row, so it is deliberately
    // NOT in a field group an editor browses past.
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      group: 'menu',
      description:
        'An archived page comes off the website but stays here, so it can be put back. Use Archive and Restore in the menu beside Publish, then publish.',
    }),

    // ── Search & sharing ──────────────────────────────────────────────────────
    // The whole group, in one order, from the shared helper. The three fields
    // this page already had are passed back in by REFERENCE so their names and
    // wording never change; the helper adds the live snippet preview and the
    // "keep this page out of Google" switch. See ./_seoFields.ts.
    ...seoFields({
      group: 'seo',
      reuse: {
        title: defineField({
          name: 'seoTitle',
          title: 'Title in Google',
          type: 'string',
          group: 'seo',
          description:
            "The title in the browser tab and in Google's results. About 50 to 60 letters. Leave blank to use the page title. A placeholder in curly brackets, like {time}, is filled in from Site settings.",
          validation: (Rule) =>
            Rule.max(60).warning('Google cuts off titles longer than about 60 letters.'),
        }),
        description: defineField({
          name: 'seoDescription',
          title: 'Description in Google',
          type: 'text',
          rows: 3,
          group: 'seo',
          description:
            'The sentence under the title in Google\'s results. About 150 to 160 letters. A placeholder in curly brackets, like {service time}, is filled in from Site settings, so {service time} reads as "Sundays at 10:45 am".',
          validation: (Rule) =>
            Rule.max(160).warning('Google cuts off descriptions longer than about 160 letters.'),
        }),
        image: defineField({
          name: 'seoImage',
          title: 'Picture when shared',
          type: 'image',
          group: 'seo',
          description:
            "Optional. The picture shown when someone shares this page on Facebook or in a text message. A wide picture, about 1200 by 630 pixels. Leave blank and the site draws one in the church's colours.",
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Describe the picture', type: 'string' })],
        }),
      },
    }),

    // ── Publishing ────────────────────────────────────────────────────────────
    // Free-tier scheduled publishing; see ./_publishAt.ts.
    publishAtField(),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      inFooter: 'addToFooter',
      archived: 'archived',
    },
    prepare: ({ title, slug, inFooter, archived }) => ({
      title: title || '(no title yet)',
      subtitle: archived
        ? `Archived  ·  /${slug ?? '...'}`
        : `/${slug ?? '...'}${inFooter ? '  ·  in the footer' : ''}`,
    }),
  },
});
