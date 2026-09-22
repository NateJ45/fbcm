// Site-wide singleton. Header, footer, contact info, and the church's own
// facts (service time, hours, Church Center/Church Trac/YouTube addresses).
// One instance only; singleton enforcement happens in sanity.config.ts.

import { defineType, defineField, defineArrayMember } from 'sanity';
import { LinkIcon, ChevronDownIcon, ListIcon } from '@sanity/icons';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Configuration, not prose — don't surface in Canvas's AI-assisted writing UI.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'identity', title: 'Identity & contact' },
    { name: 'church', title: 'Church details' },
    { name: 'navigation', title: 'Navigation (menus)' },
    { name: 'visibility', title: 'Section visibility' },
    { name: 'social', title: 'Social & footer' },
    { name: 'newsletter', title: 'Newsletter' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Site title',
      type: 'string',
      description: 'Used in the browser tab and search results.',
      initialValue: 'Studio Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short tagline shown under the logo in the footer.',
      validation: (Rule) => Rule.required().max(140),
    }),
    defineField({
      name: 'email',
      title: 'Public email',
      type: 'string',
      description: 'Public email address shown on the Contact page.',
      validation: (Rule) => Rule.required().regex(/.+@.+\..+/, { name: 'email', invert: false }),
    }),
    defineField({
      name: 'phone',
      title: 'Phone (optional)',
      type: 'string',
      description: 'Public phone number, if you want one shown. Leave blank to hide.',
    }),

    // ── Church details ────────────────────────────────────────────────────────
    // Top-level fields, grouped under one Studio tab. See the ruling at the top
    // of task-2-brief.md: a Sanity field GROUP is a tab, not a nested object,
    // so these are NOT siteSettings.church.* in the data, just in the Studio UI.
    defineField({
      name: 'serviceTime',
      title: 'Service time',
      type: 'string',
      group: 'church',
      description:
        'As it should read on the page, like "Sundays at 10:45 am". Every page that says {service time} or {time} fills it in from here.',
      initialValue: 'Sundays at 10:45 am',
    }),
    defineField({
      name: 'serviceLength',
      title: 'How long the service runs',
      type: 'string',
      group: 'church',
      description: 'A few words, like "About an hour".',
      initialValue: 'About an hour',
    }),
    defineField({
      name: 'address',
      title: 'Street address',
      type: 'text',
      rows: 2,
      group: 'church',
      description: 'One line per line of the address, as it should print.',
    }),
    defineField({
      name: 'officeHours',
      title: 'Office hours',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'church',
      description: 'One line per day or range, like "Monday to Thursday, 9 to 12 and 1 to 4".',
    }),
    defineField({
      name: 'pastoralHours',
      title: "Pastors' office hours",
      type: 'array',
      of: [{ type: 'block' }],
      group: 'church',
      description: 'When the pastors keep office hours, like "Tuesdays, 9 to 12 and 1 to 5".',
    }),
    defineField({
      name: 'churchCenterUrl',
      title: 'Church Center address',
      type: 'url',
      group: 'church',
      description: 'The web address of the Church Center home page.',
    }),
    defineField({
      name: 'givingUrl',
      title: 'Giving address',
      type: 'url',
      group: 'church',
      description: 'Where the Give button sends people. Usually the Church Center giving page.',
    }),
    defineField({
      name: 'churchTracUrl',
      title: 'Church Trac address',
      type: 'url',
      group: 'church',
      description: 'The web address of the Church Trac home page.',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube channel',
      type: 'url',
      group: 'church',
      description: 'The channel address.',
    }),
    defineField({
      name: 'livestreamUrl',
      title: 'Live stream address',
      type: 'url',
      group: 'church',
      description: 'Where "Watch online" sends people on a Sunday.',
    }),
    defineField({
      name: 'visitorFormUrl',
      title: 'Visitor card form',
      type: 'url',
      group: 'church',
      description: 'The Church Center form a new visitor fills in.',
    }),
    defineField({
      name: 'lifeEventFormUrl',
      title: 'Life update form',
      type: 'url',
      group: 'church',
      description: 'The Church Center form for births, deaths, anniversaries and the like.',
    }),
    defineField({
      name: 'mapImage',
      title: 'Map picture',
      type: 'image',
      group: 'church',
      description: 'A picture of the map around the church. Shown wherever the address appears.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'directionsUrl',
      title: 'Directions link',
      type: 'url',
      group: 'church',
      description: 'Where the "Open in Google Maps" button goes.',
    }),

    // ── Navigation ────────────────────────────────────────────────────────────
    // Optional editor-managed nav menus. When empty the header and footer render
    // their built-in defaults (see Header.astro and Footer.astro). As soon as
    // you add items here they REPLACE the corresponding built-in menu, so include
    // every link you want to appear.
    //
    // ADDITIVE and fallback-first: the code paths that read these fields always
    // check for non-empty before consuming them. A fresh clone or a site that
    // has never touched these fields behaves byte-identically to before.
    defineField({
      name: 'navItems',
      title: 'Top menu links (optional)',
      type: 'array',
      group: 'navigation',
      description:
        'The links in the website header. Drag to reorder. Add a "Link" for a single page, or a "Dropdown" to group several links under one label. The header design fits at most seven, so keep the list short. Leave empty to use the built-in default menu. Once you add items here, they replace the whole menu, so include every link you want.',
      validation: (Rule) => Rule.max(7),
      of: [
        // The shared link object (./navLink.ts). Existing menu items already
        // carry _type "navLink", so they keep working unchanged and simply gain
        // the page picker.
        defineArrayMember({ type: 'navLink' }),
        defineArrayMember({
          type: 'object',
          name: 'navGroup',
          title: 'Dropdown',
          icon: ChevronDownIcon,
          fields: [
            defineField({
              name: 'label',
              title: 'Menu label',
              type: 'string',
              description: 'The dropdown heading, e.g. "About".',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'links',
              title: 'Menu links',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'navSubLink',
                  title: 'Link',
                  icon: LinkIcon,
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'href',
                      title: 'Address',
                      type: 'string',
                      description: 'A page on this site like /process, or a full URL.',
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'href' } },
                }),
              ],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: { title: 'label', links: 'links' },
            prepare: ({ title, links }) => ({
              title: title ?? '(no label)',
              subtitle: `Dropdown: ${Array.isArray(links) ? links.length : 0} link(s)`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer link columns (optional)',
      type: 'array',
      group: 'navigation',
      description:
        'The titled link columns in the footer. Leave empty to use the built-in default columns. The "Get in touch" column (email, phone, socials) always shows automatically. Aim for three or four columns so the footer grid stays balanced; four is the most that fits.',
      validation: (Rule) => Rule.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          title: 'Column',
          icon: ListIcon,
          fields: [
            defineField({
              name: 'title',
              title: 'Column heading',
              type: 'string',
              description: 'The small heading above the links, e.g. "Services".',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [
                // Shared link object first, so "Add item" reaches for it.
                defineArrayMember({ type: 'navLink' }),
                // The original hand-typed link, kept so columns written before
                // the picker existed stay editable in place.
                defineArrayMember({
                  type: 'object',
                  name: 'footerLink',
                  title: 'Link (typed address)',
                  icon: LinkIcon,
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'href',
                      title: 'Address',
                      type: 'string',
                      description: 'A page on this site like /contact, or a full URL.',
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'href' } },
                }),
              ],
              validation: (Rule) => Rule.required().min(1).max(10),
            }),
          ],
          preview: {
            select: { title: 'title', links: 'links' },
            prepare: ({ title, links }) => ({
              title: title ?? '(no heading)',
              subtitle: `Column: ${Array.isArray(links) ? links.length : 0} link(s)`,
            }),
          },
        }),
      ],
    }),

    // The button at the right of the header (and at the top of the phone menu).
    // Everything is optional: an empty label keeps the built-in
    // "Contact us" button pointing at Contact, and turning it off removes the
    // button everywhere.
    defineField({
      name: 'headerCta',
      title: 'Header button',
      type: 'object',
      group: 'navigation',
      description:
        'The one button at the right of the header. On this site it is the Give button. Leave the boxes blank to keep the built-in "Contact us" button.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'show',
          title: 'Show the header button',
          type: 'boolean',
          description: 'Turn off to remove the button from the header and the phone menu.',
          initialValue: true,
        }),
        defineField({
          name: 'label',
          title: 'Button text',
          type: 'string',
          description: 'Leave blank for "Contact us".',
        }),
        defineField({
          name: 'link',
          title: 'Where the button goes',
          type: 'navLink',
          description: 'Leave blank to keep pointing at the Contact page.',
        }),
      ],
      preview: {
        select: { show: 'show', label: 'label' },
        prepare: ({ show, label }) => ({
          title: label || 'Contact us',
          subtitle: show === false ? 'Hidden' : 'Header button',
        }),
      },
    }),

    // Small on/off switches for the bits of contact detail the chrome carries.
    // All are ON unless explicitly turned off, so an untouched site is
    // unchanged (the site reads a blank value as "yes").
    defineField({
      name: 'showEmail',
      title: 'Show the email address in the menu',
      type: 'boolean',
      group: 'navigation',
      description:
        'The "Get in touch" email at the foot of the phone menu. On unless you turn it off.',
      initialValue: true,
    }),
    defineField({
      name: 'showSocials',
      title: 'Show social buttons in the menu',
      type: 'boolean',
      group: 'navigation',
      description:
        'The Instagram and Facebook buttons in the header eyebrow strip and at the foot of the phone menu. On unless you turn it off.',
      initialValue: true,
    }),
    defineField({
      name: 'showFooterSocials',
      title: 'Show social buttons in the footer',
      type: 'boolean',
      group: 'navigation',
      description:
        'The social buttons in the footer "Get in touch" column. On unless you turn it off.',
      initialValue: true,
    }),

    // The small print row along the very bottom of the footer.
    defineField({
      name: 'legalNav',
      title: 'Footer small-print links',
      type: 'array',
      group: 'navigation',
      description:
        'The little links beside the copyright line at the very bottom, e.g. Privacy policy. Leave empty to keep the built-in privacy link.',
      validation: (Rule) => Rule.max(6),
      of: [defineArrayMember({ type: 'navLink' })],
    }),

    // An uploaded logo replaces the built-in image logo at the top of every
    // page. Left blank, the template's own logo files keep rendering.
    defineField({
      name: 'logo',
      title: 'Logo (optional)',
      type: 'image',
      group: 'identity',
      description:
        'A logo image for the top of every page. Leave blank and the site keeps the logo files that ship with the template. When set, this image replaces them and is scaled to the header height, so upload it with any spare space already trimmed off. One image is used in both light and dark mode.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'What the logo says, for screen readers. Example: "Studio Name".',
          validation: (Rule) =>
            Rule.custom((value, ctx: any) =>
              ctx.parent?.asset && !value
                ? 'Add alt text so screen readers can read the logo'
                : true,
            ),
        }),
      ],
    }),

    // LEGACY — superseded by socialLinks array below.
    // Kept hidden + readOnly so existing data continues to validate.
    // Do not delete; use socialLinks for new and updated entries.
    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL (legacy)',
      type: 'url',
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL (legacy)',
      type: 'url',
      hidden: true,
      readOnly: true,
    }),

    // New flexible social links array. Supports any platform.
    // When this array has entries the Footer renders from it instead of the
    // legacy socialInstagram / socialFacebook fields above.
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      group: 'social',
      description:
        'Add one entry per platform. The footer renders these in order. Leave empty to fall back to the legacy Instagram/Facebook fields (for existing sites).',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              description: 'The social network or directory.',
              options: {
                list: [
                  { title: 'Instagram', value: 'Instagram' },
                  { title: 'Facebook', value: 'Facebook' },
                  { title: 'LinkedIn', value: 'LinkedIn' },
                  { title: 'Pinterest', value: 'Pinterest' },
                  { title: 'YouTube', value: 'YouTube' },
                  { title: 'TikTok', value: 'TikTok' },
                  { title: 'X (Twitter)', value: 'X' },
                  { title: 'Houzz', value: 'Houzz' },
                  { title: 'Other', value: 'Other' },
                ],
                layout: 'dropdown',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Full URL including https://.',
              validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
            }),
            defineField({
              name: 'label',
              title: 'Label (optional)',
              type: 'string',
              description:
                'Custom label for "Other" platforms. Used as the aria-label on the icon button.',
            }),
          ],
          preview: {
            select: { platform: 'platform', url: 'url', label: 'label' },
            prepare: ({ platform, url, label }) => ({
              title: label ? `${platform}: ${label}` : (platform ?? 'Social link'),
              subtitle: url ?? '',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'seoImage',
      title: 'Default social share image',
      type: 'image',
      description:
        'The image shown when any page of the site is shared on social media or in a text message (the Open Graph image). Use a wide image, about 1200 by 630 pixels. Individual pages can override this in their own SEO section. Leave blank to use the auto-generated branded cards.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'footerCredit',
      title: 'Footer credit',
      type: 'string',
      description: 'Optional credit line in the footer (e.g., "Site by Nixon Creative Studio").',
    }),
    defineField({
      name: 'footerCreditUrl',
      title: 'Footer credit URL',
      type: 'url',
      description:
        'Optional. When set, the footer credit becomes a link to this URL (opens in a new tab).',
    }),

    // ── Newsletter ──────────────────────────────────────────────────────────
    defineField({
      name: 'newsletter',
      title: 'Newsletter signup',
      type: 'object',
      description:
        'Connect an email provider (MailerLite, Buttondown, Mailchimp). Paste the embedded-form action URL and list ID; the secret key goes in env as NEWSLETTER_API_KEY.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enable newsletter signup',
          type: 'boolean',
          description: 'When off, the newsletter block does not render anywhere on the site.',
          initialValue: false,
        }),
        defineField({
          name: 'providerLabel',
          title: 'Provider label',
          type: 'string',
          description:
            'Internal label only. Example: "MailerLite" or "Buttondown". Not shown to visitors.',
        }),
        defineField({
          name: 'formActionUrl',
          title: 'Form action URL',
          type: 'url',
          description: "The embedded-form POST endpoint from your email provider's dashboard.",
        }),
        defineField({
          name: 'audienceId',
          title: 'Audience / list ID',
          type: 'string',
          description:
            'Your provider list or audience ID. Used when the provider needs it in the POST body.',
        }),
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'string',
          description: 'Headline above the signup form. Example: "Get the free design checklist."',
        }),
        defineField({
          name: 'blurb',
          title: 'Blurb',
          type: 'text',
          rows: 3,
          description: 'One or two sentences under the heading explaining what subscribers get.',
        }),
        defineField({
          name: 'buttonLabel',
          title: 'Button label',
          type: 'string',
          description: 'Text on the subscribe button.',
          initialValue: 'Subscribe',
        }),
        defineField({
          name: 'successMessage',
          title: 'Success message',
          type: 'text',
          rows: 2,
          description:
            'Message shown after a successful signup. Example: "You\'re in. Check your inbox."',
        }),
        defineField({
          name: 'consentNote',
          title: 'Consent note',
          type: 'text',
          rows: 2,
          description:
            'Small-print consent line near the submit button. Link to /privacy included automatically.',
        }),
      ],
    }),

    // ── Section visibility ────────────────────────────────────────────────────
    // Controls which optional sections appear on the live site.
    // IMPORTANT: an unset field (undefined/null) counts as VISIBLE — only an
    // explicit `false` hides a section. This means the existing live site is
    // completely unaffected until an editor intentionally turns something off.
    //
    // 2026-09-19: this used to carry nine more toggles for service-business
    // modules that never applied to a church (portfolio, shop, e-design, gift
    // certificates, press, resources, guides, style quiz, budget calculator).
    // Removed along with the fields the church rebuild forked away from; see
    // src/lib/sectionVisibility.ts. `showJournal` is the one that stays: the
    // journal is core.
    defineField({
      name: 'sectionVisibility',
      title: 'Section visibility',
      type: 'object',
      group: 'visibility',
      description: 'Turn optional sections on or off. An unset toggle counts as ON.',
      fields: [
        defineField({
          name: 'showJournal',
          title: 'Journal',
          type: 'boolean',
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
});
