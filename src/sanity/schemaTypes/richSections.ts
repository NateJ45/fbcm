// Foundation, edit with care
// Rich section block library — the 8 generalized section types that power the
// four core pages (home, about, services, process). Each type is a generalized
// section rendered through a site component, with no client-specific copy,
// names, or domain vocabulary baked in.
//
// Per-page curated lists (HOME_SECTION_TYPES, ABOUT_SECTION_TYPES, etc.) each
// equal the general SECTION_TYPES plus the rich types that belong on that page.
// Register only via richSectionSchemas in studio/schemaTypes/index.ts.
//
// SectionRenderer (src/components/SectionRenderer.astro) maps every _type here
// to a component in src/components/sections/.
//
// sectionCadence.ts classifies each type as SELF_CONTAINED or CONTENT.
// See the classification table in the Phase B plan for reasoning.

import { defineType, defineField, defineArrayMember } from 'sanity';
import {
  UserIcon,
  ThLargeIcon,
  StarIcon,
  DocumentTextIcon,
  BulbOutlineIcon,
  OlistIcon,
  UsersIcon,
  HelpCircleIcon,
  SyncIcon,
} from '@sanity/icons';
import { SECTION_TYPES } from './sections';
import { columnsField, headingAccentField, hideWhenRich, richTwin } from './_appearanceFields';
import { DYNAMIC_LIST_MAX } from '../../lib/dynamicListLimits';
import { anchorField } from './_anchorField';

// ── Shared helpers (mirrors sections.ts helpers — keep in sync if you change
//    the main helpers, or extract to a shared file in a future refactor) ──────

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

// Prose body identical to sections.ts proseBody
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
                  validation: (R) =>
                    R.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
                }),
              ],
            },
          ],
        },
      }),
    ],
  });

// ── 10. teamSection ─────────────────────────────────────────────────────────
// Inline team member grid. Members are stored as inline objects rather than
// references to a teamMember collection. This keeps the core starter
// collection-free. A future modules/team module will own a full teamMember
// collection with richer fields; when that module ships, pages can migrate
// from this inline approach to the reference approach.
// SELF_CONTAINED — manages its own bg-background surface.
export const teamSection = defineType({
  name: 'teamSection',
  title: 'Team grid',
  type: 'object',
  icon: UsersIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'subhead',
      title: 'Subhead (optional)',
      type: 'text',
      rows: 2,
      hidden: hideWhenRich('subheadRich'),
    }),
    richTwin('subheadRich', 'Subhead'),
    defineField({
      name: 'members',
      title: 'Team members',
      type: 'array',
      validation: (R) => R.min(1).max(12),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'teamMember',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({ name: 'role', title: 'Role or title (optional)', type: 'string' }),
            imageWithAlt('photo', 'Photo (optional)'),
            defineField({ name: 'bio', title: 'Short bio (optional)', type: 'text', rows: 2 }),
            defineField({
              name: 'socialLinks',
              title: 'Social links (optional)',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'socialLink',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      description: 'Examples: LinkedIn, Instagram, Website.',
                      validation: (R) => R.required(),
                    }),
                    defineField({
                      name: 'url',
                      title: 'URL',
                      type: 'url',
                      validation: (R) => R.required().uri({ scheme: ['http', 'https'] }),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'url' } },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'role', media: 'photo' },
            prepare: ({ title, subtitle, media }) => ({
              title: title || 'Team member',
              subtitle: subtitle || '',
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'headline', members: 'members' },
    prepare: ({ title, members }) => ({
      title: title || 'Team grid',
      subtitle: `Team${Array.isArray(members) ? ` (${members.length})` : ''}`,
    }),
  },
});

// ── 11. dynamicListSection ────────────────────────────────────────────────────
// Pulls the latest items from a core collection automatically. No manual
// curation required: the editor picks the source and a limit, and the section
// self-fills at build time. Great for keeping a home page fresh without
// touching code.
//
// Supported sources and what they surface:
//   journal      - Latest journal entries (newest first, up to `limit`).
//
// This "source" option list is scaffold-marked per entry (unlike most fields,
// which are marked at the section-file level): each option belongs to a
// removable capability, and removing that capability should remove its option
// here too, the same way it removes that source's arm from the GROQ select()
// in queries.ts and its card branch from DynamicList.astro's KNOWN_SOURCES.
// `journal` is the only source this fork keeps; the other three sources this
// block originally shipped with were removed along with their capabilities
// (see PENDING.md item 11 for the case where the last option goes too).
//
// IMPORTANT: This section is SELF_CONTAINED (manages its own surface via
// sectionCadence.ts). Blocks carry NO backgroundColor field — that rule is
// unconditional.
//
// Build-time note: items are fetched via GROQ subqueries inside sectionsProjection().
// The section renders the pre-fetched array; no client-side fetching occurs.
export const dynamicListSection = defineType({
  name: 'dynamicListSection',
  title: 'Auto list (latest content)',
  type: 'object',
  icon: SyncIcon,
  description:
    'Pulls the latest items from a collection automatically. Stays fresh on every rebuild without manual curation.',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'subhead',
      title: 'Subhead (optional)',
      type: 'text',
      rows: 2,
      hidden: hideWhenRich('subheadRich'),
    }),
    richTwin('subheadRich', 'Subhead'),
    columnsField('dynamicListSection'),
    defineField({
      name: 'source',
      title: 'Show items from',
      type: 'string',
      options: {
        list: [
          { title: 'Journal (latest posts)', value: 'journal' }, // scaffold: journal
        ],
        layout: 'radio',
      },
      initialValue: 'journal',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'limit',
      title: 'How many to show',
      type: 'number',
      initialValue: 6,
      // DYNAMIC_LIST_MAX also sizes the GROQ query's slice bound in queries.ts:
      // GROQ slice bounds cannot be field references, so the query fetches a
      // fixed batch of this many candidates and the component trims to this
      // field's actual value. The two must share one constant or they drift.
      validation: (R) => R.required().min(3).max(DYNAMIC_LIST_MAX),
      description: `Between 3 and ${DYNAMIC_LIST_MAX} items. The section shows this many in a card grid.`,
    }),
    defineField({ name: 'cta', title: 'Link button (optional)', type: 'ctaBlock' }),
    anchorField(),
  ],
  preview: {
    select: { title: 'headline', source: 'source', limit: 'limit' },
    prepare: ({ title, source, limit }) => ({
      title: title || 'Auto list',
      subtitle: `Auto list: ${source ?? ''}${limit ? ` (up to ${limit})` : ''}`,
    }),
  },
});

// ── Exports ──────────────────────────────────────────────────────────────────

export const richSectionSchemas = [teamSection, dynamicListSection];

export const RICH_SECTION_TYPES = richSectionSchemas.map((s) => ({ type: s.name }));

// Per-page curated lists. Each is SECTION_TYPES (11 general) plus the rich
// types that make sense on that page. Editors only see relevant blocks.
// U7 additions:
//   faqSection        -> HOME, ABOUT, SERVICES (inline FAQ on any marketing page)
//   logoStripSection  -> all pages (already in SECTION_TYPES via pageSectionSchemas)
//   embedSection      -> all pages (already in SECTION_TYPES via pageSectionSchemas)
//   teamSection       -> HOME, ABOUT
// Church-reverse-port additions:
//   dynamicListSection -> HOME, ABOUT (auto-pull latest content; generic small-biz sources)
export const HOME_SECTION_TYPES = [
  ...SECTION_TYPES,
  { type: 'teamSection' },
  { type: 'dynamicListSection' },
];

export const ABOUT_SECTION_TYPES = [
  ...SECTION_TYPES,
  { type: 'teamSection' },
  { type: 'dynamicListSection' },
];

export const SERVICES_SECTION_TYPES = [...SECTION_TYPES];

export const PROCESS_SECTION_TYPES = [...SECTION_TYPES];
