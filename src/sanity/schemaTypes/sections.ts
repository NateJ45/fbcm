// Foundation, edit with care
// The page-builder block library. Each block is a reusable section that editors
// can add, reorder, and remove on any page. Every block renders through a
// site component in src/components/sections/, so anything built here matches
// the rest of the site automatically.
//
// The SectionRenderer (src/components/SectionRenderer.astro) owns the alternating
// background cadence and dividers, so reordering can never break the rhythm.
// That is why no block has a "background color" field: the renderer decides.
//
// SECTION_TYPES (exported at the bottom) is the single source of truth for which
// blocks a page-builder array accepts. Use it everywhere a pageBuilder array is
// defined so every builder offers the same library.

import { defineType, defineField, defineArrayMember, type ArrayOptions } from 'sanity';
import {
  BlockElementIcon,
  ImageIcon,
  ImagesIcon,
  BulbOutlineIcon,
  StarIcon,
  ComponentIcon,
  RemoveIcon,
  PlayIcon,
  ThLargeIcon,
  EarthGlobeIcon,
  CodeBlockIcon,
} from '@sanity/icons';
import { columnsField, headingAccentField, hideWhenRich, richTwin } from './_appearanceFields';
import { anchorField } from './_anchorField';
import { linkRule } from './_linkRule.ts';
import { sideOptions } from '../../lib/layout-variants';
// scaffold: church
import { CHURCH_SECTION_TYPES } from './churchSections';
// scaffold:end

// Shared image field with required alt text (accessibility + SEO).
const imageWithAlt = (name = 'image', title = 'Image') =>
  defineField({
    name,
    title,
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt text',
        type: 'string',
        description: 'Describe the photo in a few words, for screen readers and search engines.',
        validation: (R) => R.required(),
      }),
    ],
  });

// Short rich-text body: paragraphs, bold/italic, links, simple headings/lists.
const proseBody = (name = 'body', title = 'Text') =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [
          { title: 'Normal', value: 'normal' },
          { title: 'Heading', value: 'h2' },
          { title: 'Subheading', value: 'h3' },
          { title: 'Small heading', value: 'h4' },
          { title: 'Quote', value: 'blockquote' },
        ],
        lists: [
          { title: 'Bullet', value: 'bullet' },
          { title: 'Numbered', value: 'number' },
        ],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [
                defineField({
                  name: 'href',
                  title: 'URL',
                  type: 'url',
                  // mailto: and tel: allowed, as ctaBlock already allows them. With
                  // the default (http/https only) every seeded contact line such
                  // as "worship@fbcmuncie.org" failed validation, and a page with
                  // a validation error cannot be published (found 2026-09-22 on
                  // Contact, Ministries, Staff and Wedding).
                  // A church link placeholder ({giving}...) is allowed too
                  // (_linkRule.ts, feat/church-links).
                  validation: linkRule(),
                }),
              ],
            },
          ],
        },
      }),
    ],
  });

// ── 1. Hero ──────────────────────────────────────────────────────────────────
export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero (big page opener)',
  type: 'object',
  icon: ComponentIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (small line above)', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (R) => R.required(),
    }),
    // The colour accent (2026-09-24, the Visit identity pass): on the window
    // layout the accent words close the headline in the gold capitals ("What
    // to Expect / ON SUNDAY"). Optional and additive, so no stored hero changes.
    headingAccentField(),
    defineField({ name: 'subhead', title: 'Subhead', type: 'text', rows: 2 }),
    imageWithAlt('backgroundImage', 'Background photo (optional)'),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      initialValue: 'full',
      options: {
        list: [
          { title: 'Photo behind the words', value: 'full' },
          { title: 'Words left, photo right', value: 'split' },
          { title: 'Three arched photos (window)', value: 'window' },
        ],
        layout: 'radio',
      },
      description: 'Pick one.',
    }),
    defineField({
      name: 'frames',
      title: 'Photos',
      type: 'array',
      validation: (R) => R.max(6),
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Describe the photo',
              type: 'string',
              description: 'A short sentence for people who cannot see it.',
            }),
          ],
        },
      ],
      description:
        'One photo, or up to six. With more than one, the home page fades slowly between them; the first loads first, so put the best one first. Window layout: the first three photos, the middle one largest.',
    }),
    defineField({
      name: 'facts',
      title: 'Three facts',
      type: 'array',
      validation: (R) => R.max(3),
      of: [
        {
          type: 'object',
          name: 'heroFact',
          fields: [
            defineField({
              name: 'label',
              title: 'Small label',
              type: 'string',
              description: 'Like "Sundays".',
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'Like "10:45 am".',
            }),
            // 2026-09-25 (`feat/preacher-and-feel`): the one place the church
            // says what its service is like, in a few words, under the time.
            // Display text only: nothing branches on it, so it stays out of
            // NON_STEGA_FIELDS. Drawn by the photo hero (the home page).
            defineField({
              name: 'note',
              title: 'Small line under the value (optional)',
              type: 'string',
              description:
                'A few words under the value, like "Intergenerational, casual dress welcome" under the Sunday time. Leave blank for none.',
              validation: (R) => R.max(48),
            }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
      description: 'Up to three short facts under the words: when, where, online.',
    }),
    defineField({ name: 'primaryCta', title: 'Main button', type: 'ctaBlock' }),
    defineField({ name: 'secondaryCta', title: 'Second button (optional)', type: 'ctaBlock' }),
    defineField({
      name: 'size',
      title: 'Height',
      type: 'string',
      initialValue: 'short',
      options: {
        list: [
          { title: 'Tall', value: 'tall' },
          { title: 'Short', value: 'short' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: { title: 'headline', media: 'backgroundImage' },
    prepare: ({ title, media }) => ({ title: title || 'Hero', subtitle: 'Hero', media }),
  },
});

// ── 2. Rich text ───────────────────────────────────────────────────────────--
export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Text block',
  type: 'object',
  icon: BlockElementIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({
      name: 'scriptAccent',
      title: 'Handwritten accent word (optional)',
      type: 'string',
      description: 'One word from the heading to render in the script font. Must match exactly.',
    }),
    headingAccentField(),
    proseBody('body', 'Text'),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      initialValue: 'normal',
      options: {
        list: [
          { title: 'Normal', value: 'normal' },
          { title: 'Narrow (easier reading)', value: 'narrow' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Centered', value: 'center' },
        ],
        layout: 'radio',
      },
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', body: 'body' },
    prepare: ({ title }) => ({ title: title || 'Text block', subtitle: 'Text' }),
  },
});

// ── 3. Image + text ──────────────────────────────────────────────────────────
export const imageTextSection = defineType({
  name: 'imageTextSection',
  title: 'Image + text (side by side)',
  type: 'object',
  icon: ImageIcon,
  fields: [
    imageWithAlt('image', 'Image'),
    defineField({
      name: 'imageSide',
      title: 'Which side is the image on?',
      type: 'string',
      initialValue: 'left',
      // Wording only. The stored values and the default are unchanged; the
      // labels come from the shared registry so both halves of a media pair
      // read the same way. See src/lib/layout-variants.ts.
      options: { list: sideOptions('Image'), layout: 'radio' },
    }),
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    proseBody('body', 'Text'),
    defineField({ name: 'cta', title: 'Button (optional)', type: 'ctaBlock' }),
    // A second, smaller photo (2026-09-24, the Visit identity pass): drawn in a
    // small arched window overlapping the corner of a photo of people. Optional
    // and additive; a band without one draws exactly as before.
    defineField({
      name: 'detail',
      title: 'Small second photo (optional)',
      type: 'image',
      options: { hotspot: true },
      description:
        'Shown small, in an arched window over the corner of the main photo, when the main photo shows people. When both photos are portraits of people (two pastors, say), they are shown side by side at the same size instead.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the photo in a few words, for screen readers and search engines.',
          validation: (R) => R.required(),
        }),
      ],
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'Image + text',
      subtitle: 'Image + text',
      media,
    }),
  },
});

// ── 4. Gallery ───────────────────────────────────────────────────────────────
export const gallerySection = defineType({
  name: 'gallerySection',
  title: 'Photo gallery (grid)',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({
      name: 'images',
      title: 'Photos',
      type: 'array',
      validation: (R) => R.min(1),
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'caption',
              title: 'Name (optional)',
              type: 'string',
              description:
                'A short name shown under the photo, like the room it shows ("Fellowship Hall"). Name every photo and the gallery draws as a row of arched doors; leave them all blank for photos of people.',
            }),
          ],
        }),
      ],
    }),
    columnsField('gallerySection'),
    anchorField(),
  ],
  preview: {
    select: { images: 'images', heading: 'heading' },
    prepare: ({ images, heading }) => ({
      title: heading || 'Photo gallery',
      subtitle: `Gallery${Array.isArray(images) ? ` (${images.length})` : ''}`,
      media: Array.isArray(images) && images[0] ? images[0] : ImagesIcon,
    }),
  },
});

// ── 5. Quote ─────────────────────────────────────────────────────────────────
export const quoteSection = defineType({
  name: 'quoteSection',
  title: 'Quote / pull-quote',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      validation: (R) => R.required(),
    }),
    defineField({ name: 'attribution', title: 'Who said it', type: 'string' }),
    defineField({
      name: 'detail',
      title: 'Their detail (optional)',
      type: 'string',
      description: 'Context that adds credibility. Example: "Location" or "Project type".',
    }),
    anchorField(),
  ],
  preview: {
    select: { title: 'quote', subtitle: 'attribution' },
    prepare: ({ title, subtitle }) => ({
      title: title ? `"${title.slice(0, 50)}"` : 'Quote',
      subtitle: subtitle || 'Quote',
    }),
  },
});

// ── 6. Stat row ──────────────────────────────────────────────────────────────
export const statSection = defineType({
  name: 'statSection',
  title: 'Numbers row (stats)',
  type: 'object',
  icon: ThLargeIcon,
  fields: [
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({
      name: 'stats',
      title: 'Numbers',
      type: 'array',
      validation: (R) => R.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'statItem',
          fields: [
            defineField({
              name: 'number',
              title: 'Number',
              type: 'number',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'suffix',
              title: 'Suffix (optional)',
              type: 'string',
              description: 'Optional suffix after the number. Examples: "+", "%", "yrs".',
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (R) => R.required(),
            }),
          ],
          // The title is DERIVED, never selected straight from `number`.
          // Sanity lowercases a preview title to index it, so a title that is a
          // number throws "toLowerCase is not a function" and the whole array
          // field renders as a red Unhandled Runtime Error. Found by
          // `npm run audit:studio` check 2.
          preview: {
            select: { number: 'number', suffix: 'suffix', label: 'label' },
            prepare: ({ number, suffix, label }) => ({
              title: `${number ?? ''}${suffix ?? ''}` || 'Number',
              subtitle: label,
            }),
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Numbers row' }) },
});

// ── 7. CTA band ──────────────────────────────────────────────────────────────
export const ctaBandSection = defineType({
  name: 'ctaBandSection',
  title: 'Call-to-action band',
  type: 'object',
  icon: BulbOutlineIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'scriptAccent',
      title: 'Handwritten accent word (optional)',
      type: 'string',
      description: 'One word from the headline to render in the script font. Must match exactly.',
    }),
    headingAccentField(),
    defineField({
      name: 'subhead',
      title: 'Subhead',
      type: 'text',
      rows: 2,
      hidden: hideWhenRich('subheadRich'),
    }),
    richTwin('subheadRich', 'Subhead'),
    defineField({ name: 'cta', title: 'Button', type: 'ctaBlock' }),
    // The second button the band could always DRAW but could never be GIVEN:
    // FinalCta.astro has accepted a `secondaryCta` since it was written, and
    // nothing upstream of it declared one. Added 2026-09-19 (plan 2b ruling
    // P13) so a closing band can offer a second door without the page having to
    // spend its hero on it.
    defineField({ name: 'secondaryCta', title: 'Second button (optional)', type: 'ctaBlock' }),
    imageWithAlt('backgroundImage', 'Background photo (optional)'),
  ],
  preview: {
    select: { title: 'headline', media: 'backgroundImage' },
    prepare: ({ title, media }) => ({
      title: title || 'Call to action',
      subtitle: 'CTA band',
      media,
    }),
  },
});

// ── 8. Video ─────────────────────────────────────────────────────────────────
export const videoSection = defineType({
  name: 'videoSection',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Video link (YouTube or Vimeo)',
      type: 'url',
      validation: (R) => R.required().uri({ scheme: ['http', 'https'] }),
      description: 'Paste the share link from YouTube or Vimeo.',
    }),
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
  ],
  preview: {
    select: { title: 'heading', url: 'url' },
    prepare: ({ title, url }) => ({ title: title || 'Video', subtitle: url || 'Video' }),
  },
});

// ── 9. Spacer / divider ──────────────────────────────────────────────────────
export const spacerSection = defineType({
  name: 'spacerSection',
  title: 'Spacer / divider',
  type: 'object',
  icon: RemoveIcon,
  fields: [
    defineField({
      name: 'variant',
      title: 'Style',
      type: 'string',
      initialValue: 'ornament',
      options: {
        list: [
          { title: 'Accent ornament', value: 'ornament' },
          { title: 'Plain line', value: 'line' },
          { title: 'Just space (invisible)', value: 'space' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: { prepare: () => ({ title: 'Spacer / divider' }) },
});

// ── 10. Logo strip ──────────────────────────────────────────────────────────
// A row or grid of client/partner logos. SELF_CONTAINED — manages its own surface.
export const logoStripSection = defineType({
  name: 'logoStripSection',
  title: 'Logo strip (trusted by / as seen in)',
  type: 'object',
  icon: EarthGlobeIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow (optional)',
      type: 'string',
      description: 'Examples: "Trusted by" or "As seen in".',
    }),
    defineField({ name: 'headline', title: 'Headline (optional)', type: 'string' }),
    defineField({
      name: 'logos',
      title: 'Logos',
      type: 'array',
      validation: (R) => R.min(2).max(12),
      description: 'Add between 2 and 12 logos. Each needs an alt text for screen readers.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description: 'Company or outlet name, for screen readers and search engines.',
              validation: (R) => R.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      initialValue: 'row',
      options: {
        list: [
          { title: 'Row (single line, scrollable on small screens)', value: 'row' },
          { title: 'Grid (wraps across rows)', value: 'grid' },
        ],
        layout: 'radio',
      },
    }),
    anchorField(),
  ],
  preview: {
    select: { logos: 'logos', eyebrow: 'eyebrow', headline: 'headline' },
    prepare: ({ logos, eyebrow, headline }) => ({
      title: headline || eyebrow || 'Logo strip',
      subtitle: `Logo strip${Array.isArray(logos) ? ` (${logos.length})` : ''}`,
      media: Array.isArray(logos) && logos[0] ? logos[0] : EarthGlobeIcon,
    }),
  },
});

// ── 11. Embed section ───────────────────────────────────────────────────────
// Sandboxed iframe embed. Accepts either a URL (Calendly, Cal.com, Tally, etc.)
// or raw embed code from a trusted provider. SELF_CONTAINED — manages its own surface.
//
// SECURITY NOTE: embedCode is rendered as-is on the live site. Only paste code
// from providers you trust. The same trust model applies here as for any content
// in the CMS.
export const embedSection = defineType({
  name: 'embedSection',
  title: 'Embed (form, scheduler, or widget)',
  type: 'object',
  icon: CodeBlockIcon,
  description: 'Only paste embed code from providers you trust. It renders as-is on the live site.',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({ name: 'headline', title: 'Headline (optional)', type: 'string' }),
    defineField({ name: 'subhead', title: 'Subhead (optional)', type: 'text', rows: 2 }),
    defineField({
      name: 'embedUrl',
      title: 'Embed URL',
      type: 'url',
      description:
        'Use for providers that embed via URL: Calendly, Cal.com, Tally, Google Forms. Paste the full URL.',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'embedCode',
      title: 'Embed code (raw iframe)',
      type: 'text',
      rows: 4,
      description:
        'Use for providers that give a raw iframe snippet. Only paste from providers you trust.',
      validation: (R) =>
        R.custom((value, context) => {
          const doc = context.document as Record<string, unknown> | undefined;
          if (value && doc?.embedUrl) {
            return 'Fill in either Embed URL or Embed code, not both.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'heightHint',
      title: 'Height',
      type: 'string',
      initialValue: 'medium',
      options: {
        list: [
          { title: 'Short (around 400px)', value: 'short' },
          { title: 'Medium (around 640px)', value: 'medium' },
          { title: 'Tall (around 900px)', value: 'tall' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: { title: 'headline', eyebrow: 'eyebrow', url: 'embedUrl' },
    prepare: ({ title, eyebrow, url }) => ({
      title: title || eyebrow || 'Embed',
      subtitle: url ? `Embed: ${url.slice(0, 50)}` : 'Embed (code snippet)',
    }),
  },
});

// ── Exports ──────────────────────────────────────────────────────────────────

// All section schema objects, to register in the schema index.
export const pageSectionSchemas = [
  heroSection,
  richTextSection,
  imageTextSection,
  gallerySection,
  quoteSection,
  statSection,
  ctaBandSection,
  videoSection,
  spacerSection,
  logoStripSection,
  embedSection,
  // scaffold: church
  ...CHURCH_SECTION_TYPES,
  // scaffold:end
];

// The list a pageBuilder array uses for `of`. Single source of truth so every
// builder offers the same blocks.
export const SECTION_TYPES = pageSectionSchemas.map((s) => ({ type: s.name }));

// =============================================================================
// The grouped, searchable insert menu (2026-08-28, PORTS.md card 17)
// =============================================================================
// Every pageBuilder array shares one insert-menu configuration, so "add a
// section" reads the same everywhere: a search box, and blocks sorted into four
// plain-language groups instead of one long alphabetical list.
//
// This matters most OUTSIDE the Studio form. With the preview stack installed,
// the Presentation overlay opens this same menu IN THE CANVAS when an editor
// uses a section's insert-before/insert-after control, so the grouping is what
// an editor sees while looking at the page.
//
// `filter: true` turns on the search box. Groups list type names; a group whose
// types are all absent from a given array simply does not appear, which is what
// lets one config serve the curated per-page lists in richSections.ts. Any type
// not named in a group falls under "All".
export const SECTION_INSERT_MENU: ArrayOptions['insertMenu'] = {
  filter: true,
  groups: [
    {
      name: 'basics',
      title: 'Basics',
      of: ['heroSection', 'richTextSection', 'imageTextSection', 'spacerSection'],
    },
    {
      name: 'proof',
      title: 'Proof and trust',
      of: ['quoteSection', 'statSection', 'logoStripSection'],
    },
    {
      name: 'media',
      title: 'Media',
      of: ['gallerySection', 'videoSection', 'embedSection'],
    },
    {
      name: 'business',
      title: 'About the business',
      of: ['teamSection', 'dynamicListSection', 'ctaBandSection'],
    },
    // scaffold: church
    {
      name: 'church',
      title: 'Church',
      of: [
        'sundayTimesSection',
        'timelineSection',
        'staffGridSection',
        'faqSection',
        'scriptureBandSection',
        'heritageBandSection',
        'giveBandSection',
        'hoursSection',
        'documentListSection',
        'linkCardsSection',
        'ministrySection',
        'watchwordSection',
        'goalsSection',
        'pledgeSection',
        'letterSection',
        'churchTracFormSection',
      ],
    },
    // scaffold:end
  ],
};

/** The `options` block every pageBuilder array should carry. */
export const sectionArrayOptions: ArrayOptions = { insertMenu: SECTION_INSERT_MENU };

// Reusable "extra sections" field for pages that keep their own structure but
// want an append zone for library blocks. The consuming schema must declare an
// `extra` field group. SectionRenderer renders the array; self-contained blocks
// manage their own surface so no extra page context is needed.
export const additionalSectionsField = defineField({
  name: 'additionalSections',
  title: 'Extra sections',
  type: 'array',
  group: 'extra',
  description:
    'Optional. Add blocks from the library to the bottom of this page (a banner, a gallery, a call to action). Leave empty to keep the page exactly as it is.',
  of: SECTION_TYPES,
  options: sectionArrayOptions,
});
