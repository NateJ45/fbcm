// Site-wide singleton. Header, footer, contact info, and the church's own
// facts (service time, hours, Church Center/Church Trac/YouTube addresses).
// One instance only; singleton enforcement happens in sanity.config.ts.
//
// CHURCH SYSTEMS (feat/church-links, 2026-09-24). The "Church systems" tab holds
// every outside address the site sends people to: giving, the connection card,
// the forms, sermon recordings and the rest. Pages, posts and buttons hold a
// link placeholder ({giving}, {connect}...) instead of the address, and the
// build fills it from here (src/lib/church-links.ts), so moving the church from
// Church Center to Church Trac is one edit per link, here. The three fields
// that already existed (givingUrl, visitorFormUrl, lifeEventFormUrl) were
// moved into the tab and retitled; their names, and so their data, are
// unchanged. No field has an initialValue: an address typed in by the schema
// would be a second copy that nobody remembers to change.

import { defineType, defineField, defineArrayMember } from 'sanity';
import { LinkIcon, ChevronDownIcon, ListIcon } from '@sanity/icons';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  // Configuration, not prose — don't surface in Canvas's AI-assisted writing UI.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'identity', title: 'Name and contact' },
    { name: 'church', title: 'Church details' },
    { name: 'systems', title: 'Church systems' },
    { name: 'navigation', title: 'Menus' },
    { name: 'social', title: 'Social media and footer' },
    { name: 'visibility', title: 'Blog switch' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Church name',
      type: 'string',
      group: 'identity',
      description: "The church's name as the website shows it, in the browser tab and in Google.",
      initialValue: 'First Baptist Church Muncie',
      validation: (Rule) => Rule.required().error("Type the church's name."),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'identity',
      description:
        'One short sentence about the church, shown under its name at the foot of every page.',
      validation: (Rule) => [
        Rule.required().error('Type a short sentence about the church.'),
        Rule.max(140).error('Keep it to 140 letters or fewer.'),
      ],
    }),
    defineField({
      name: 'email',
      title: 'Church email',
      type: 'string',
      group: 'identity',
      description:
        'The email address visitors see, on the Contact page and at the foot of every page. Any text that says {email} fills it in from here.',
      validation: (Rule) => [
        Rule.required().error("Type the church's email address."),
        Rule.regex(/.+@.+\..+/, { name: 'email', invert: false }).error(
          'That does not look like an email address.',
        ),
      ],
    }),
    defineField({
      name: 'phone',
      title: 'Church phone',
      type: 'string',
      group: 'identity',
      description:
        'The phone number visitors see. Any text that says {phone} fills it in from here. Leave blank to show none.',
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
      description:
        'A few words, like "About an hour". Any text that says {service length} fills it in from here.',
      initialValue: 'About an hour',
    }),
    defineField({
      name: 'address',
      title: 'Street address',
      type: 'text',
      rows: 2,
      group: 'church',
      description:
        'As it should print, one line per line: the street on the first, then the city, state and ZIP. Any text that says {address} or {city} fills it in from here.',
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
      description:
        "The address of the church's Church Center page, if it still has one. Normally left blank now the church uses Church Trac.",
    }),
    defineField({
      name: 'churchTracUrl',
      title: 'Church Trac address',
      type: 'url',
      group: 'church',
      description:
        "The address of the church's own Church Trac site. The Children's and Youth newsletters are read from it.",
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube channel',
      type: 'url',
      group: 'church',
      description:
        "The address of the church's YouTube channel. The home page reads last Sunday's service and this Sunday's sermon title from it.",
    }),
    defineField({
      name: 'livestreamUrl',
      title: 'Live stream address',
      type: 'url',
      group: 'church',
      description: 'Where "Watch online" sends people on a Sunday.',
    }),
    defineField({
      name: 'mapImage',
      title: 'Map picture',
      type: 'image',
      group: 'church',
      description: 'A picture of the streets around the church. Shown beside the address.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'directionsUrl',
      title: 'Directions link',
      type: 'url',
      group: 'church',
      description: 'Where the directions button goes, normally a Google Maps link to the church.',
    }),

    // ── Church systems ────────────────────────────────────────────────────────
    // One box per outside address. Each box's placeholder, typed into any link
    // on a page or post, becomes that address when the site rebuilds. The
    // Studio guide "Links to giving, forms and sermons" lists them.
    defineField({
      name: 'givingUrl',
      title: 'Online giving',
      type: 'url',
      group: 'systems',
      description:
        "Where the Give buttons send people, and every link written {giving}. While this is empty, those links go to the website's own Give page.",
    }),
    defineField({
      name: 'visitorFormUrl',
      title: 'Connection card',
      type: 'url',
      group: 'systems',
      description:
        'The form a visitor fills in to say hello or that they are coming ("I’m new and want to learn more"). Every link written {connect}.',
    }),
    defineField({
      name: 'lifeEventFormUrl',
      title: 'Contact form (Notify us)',
      type: 'url',
      group: 'systems',
      description:
        'The form for telling the church about a birth, a death, an anniversary, a hospital stay or a change of address. Every link written {contact-form}. While this is empty, those words stay on the page but are not a link.',
    }),
    defineField({
      name: 'sermonsUrl',
      title: 'Sermon recordings',
      type: 'url',
      group: 'systems',
      description:
        'Where "listen to the sermon" links go, every link written {sermons}. Leave blank to use the Live stream address in Church details. While that is on YouTube, each sermon preview links to its own recording once YouTube has it.',
    }),
    defineField({
      name: 'wednesdayUrl',
      title: 'Wednesday page',
      type: 'url',
      group: 'systems',
      description:
        'The page about Wednesday nights (Wednesday Weekly). Every link written {wednesday}. While this is empty, those words stay on the page but are not a link.',
    }),
    defineField({
      name: 'calendarUrl',
      title: 'Events calendar',
      type: 'url',
      group: 'systems',
      description:
        "Church Trac's public calendar. Every link written {calendar}. The What's On page and the events on the home page are read from this calendar.",
    }),
    defineField({
      name: 'prayerUrl',
      title: 'Prayer list',
      type: 'url',
      group: 'systems',
      description: 'Where people read and send prayer requests. Every link written {prayer}.',
    }),
    defineField({
      name: 'appUrl',
      title: 'Church app',
      type: 'url',
      group: 'systems',
      description:
        'The share link for the church app from Church Trac, like https://open.churchtrac.com?code=... Every link written {app}. The app section on the home page and the app buttons at the foot of every page appear only while this is filled in.',
    }),
    defineField({
      name: 'weddingEnquiryUrl',
      title: 'Wedding enquiry form',
      type: 'url',
      group: 'systems',
      description:
        'The wedding information form a couple fills in first. Every link written {wedding-enquiry}. While this is empty, those links email the wedding office instead.',
    }),
    defineField({
      name: 'weddingBookingUrl',
      title: 'Building booking form',
      type: 'url',
      group: 'systems',
      description:
        'The form for asking to use the building, for a wedding or any other event. Every link written {wedding-booking}. While this is empty, those links email the wedding office instead.',
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
      title: 'Top menu',
      type: 'array',
      group: 'navigation',
      description:
        'The links along the top of every page, in order. Drag to reorder. Add a "Link" for one page, or a "Dropdown" to put several links under one word. Seven at most, or the menu will not fit. If this list is ever emptied, the website falls back to a built-in menu.',
      validation: (Rule) => Rule.max(7).error('The top menu fits seven items at most.'),
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
              title: 'Word in the menu',
              type: 'string',
              description: 'The word that opens the dropdown, like "Our Church".',
              validation: (Rule) => Rule.required().error('Type the word for the dropdown.'),
            }),
            defineField({
              name: 'links',
              title: 'Links in the dropdown',
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
                      title: 'Words',
                      type: 'string',
                      validation: (Rule) => Rule.required().error('Type the words for the link.'),
                    }),
                    defineField({
                      name: 'href',
                      title: 'Address',
                      type: 'string',
                      description:
                        'A page on this site like /history, or a full address starting with https://.',
                      validation: (Rule) => Rule.required().error('Type where the link goes.'),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'href' } },
                }),
              ],
              validation: (Rule) =>
                Rule.required().min(1).error('Add at least one link to the dropdown.'),
            }),
          ],
          preview: {
            select: { title: 'label', links: 'links' },
            prepare: ({ title, links }) => ({
              title: title || '(no word yet)',
              subtitle: `Dropdown with ${Array.isArray(links) ? links.length : 0} link(s)`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer link columns',
      type: 'array',
      group: 'navigation',
      description:
        "The columns of links at the foot of every page, each with a small heading. The church's address, email, phone and social media always show beside them. Four columns at most. If this list is ever emptied, the website falls back to built-in columns.",
      validation: (Rule) => Rule.max(4).error('The footer fits four columns at most.'),
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
              description: 'The small heading above the links, like "Pages".',
              validation: (Rule) => Rule.required().error('Type a heading for the column.'),
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
                      title: 'Words',
                      type: 'string',
                      validation: (Rule) => Rule.required().error('Type the words for the link.'),
                    }),
                    defineField({
                      name: 'href',
                      title: 'Address',
                      type: 'string',
                      description:
                        'A page on this site like /contact, or a full address starting with https://.',
                      validation: (Rule) => Rule.required().error('Type where the link goes.'),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'href' } },
                }),
              ],
              validation: (Rule) => [
                Rule.required().min(1).error('Add at least one link to the column.'),
                Rule.max(10).error('A column fits ten links at most.'),
              ],
            }),
          ],
          preview: {
            select: { title: 'title', links: 'links' },
            prepare: ({ title, links }) => ({
              title: title || '(no heading yet)',
              subtitle: `Column with ${Array.isArray(links) ? links.length : 0} link(s)`,
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
        'The one button at the right of the top menu. It is the Give button, and its link is written {giving} so it follows Online giving in Church systems. With its boxes empty it becomes a "Contact us" button.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'show',
          title: 'Show the header button',
          type: 'boolean',
          description: 'Turn off to take the button off the top menu and the phone menu.',
          initialValue: true,
        }),
        defineField({
          name: 'label',
          title: 'Button text',
          type: 'string',
          description: 'Like "Give". Leave blank for "Contact us".',
        }),
        defineField({
          name: 'link',
          title: 'Where the button goes',
          type: 'navLink',
          description: 'Leave blank to send people to the Contact page.',
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
      title: 'Show the email address in the phone menu',
      type: 'boolean',
      group: 'navigation',
      description:
        'The church email at the foot of the menu on a phone. On unless you turn it off.',
      initialValue: true,
    }),
    defineField({
      name: 'showSocials',
      title: 'Show social media buttons in the menu',
      type: 'boolean',
      group: 'navigation',
      description:
        'The Facebook, Instagram and other buttons at the top of the page and at the foot of the phone menu. On unless you turn it off.',
      initialValue: true,
    }),
    defineField({
      name: 'showFooterSocials',
      title: 'Show social media buttons in the footer',
      type: 'boolean',
      group: 'navigation',
      description: 'The social media buttons at the foot of every page. On unless you turn it off.',
      initialValue: true,
    }),

    // The small print row along the very bottom of the footer.
    defineField({
      name: 'legalNav',
      title: 'Small print links',
      type: 'array',
      group: 'navigation',
      description:
        'The small links beside the copyright line at the very bottom, like the privacy policy. Leave empty to keep the privacy policy link.',
      validation: (Rule) => Rule.max(6).error('Six small print links at most.'),
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
        "Leave blank to keep the church's own logo at the top of every page. A picture uploaded here replaces it, sized to the top bar, so trim any empty space around it first.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'What the logo says',
          type: 'string',
          description:
            'The words in the logo, like "First Baptist Church Muncie", for people who cannot see it.',
          validation: (Rule) =>
            Rule.custom((value, ctx: any) =>
              ctx.parent?.asset && !value
                ? 'Type the words in the logo, for people who cannot see it.'
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
      title: 'Social media accounts',
      type: 'array',
      group: 'social',
      description:
        "One entry for each of the church's accounts, in the order the buttons should appear. YouTube is added for you from the YouTube channel in Church details.",
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              title: 'Which site',
              type: 'string',
              options: {
                list: [
                  { title: 'Instagram', value: 'Instagram' },
                  { title: 'Facebook', value: 'Facebook' },
                  { title: 'LinkedIn', value: 'LinkedIn' },
                  { title: 'Pinterest', value: 'Pinterest' },
                  { title: 'YouTube', value: 'YouTube' },
                  { title: 'TikTok', value: 'TikTok' },
                  { title: 'X (Twitter)', value: 'X' },
                  { title: 'Threads', value: 'Threads' },
                  { title: 'Linktree', value: 'Linktree' },
                  { title: 'Other', value: 'Other' },
                ],
                layout: 'dropdown',
              },
              validation: (Rule) => Rule.required().error('Pick which site the account is on.'),
            }),
            defineField({
              name: 'url',
              title: 'Web address',
              type: 'url',
              description: "The address of the church's page there, starting with https://.",
              validation: (Rule) =>
                Rule.required()
                  .uri({ scheme: ['http', 'https'] })
                  .error('Paste the full address, starting with https://.'),
            }),
            defineField({
              name: 'label',
              title: 'Name (only for "Other")',
              type: 'string',
              description:
                'For an "Other" site, its name, which is read out to people who cannot see the icon.',
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
      title: 'Picture when a page is shared',
      type: 'image',
      group: 'social',
      description:
        "Normally left blank: every page and post already shares with its own picture, drawn in the church's colours. This is only used for a page that has none. A wide picture, about 1200 by 630 pixels.",
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the picture', type: 'string' })],
    }),
    defineField({
      name: 'footerCredit',
      title: 'Website credit',
      type: 'string',
      group: 'social',
      description:
        'The small line at the very bottom naming who built the website. Leave blank for the usual line.',
    }),
    defineField({
      name: 'footerCreditUrl',
      title: 'Website credit link',
      type: 'url',
      group: 'social',
      description: 'Where the credit line links to. Leave blank for the usual link.',
    }),

    // ── Newsletter ──────────────────────────────────────────────────────────
    defineField({
      name: 'newsletter',
      title: 'Newsletter signup',
      type: 'object',
      // HIDDEN since the Studio audit (2026-09-26). It needs a mail provider
      // and a server secret set up by the developer, and the site draws no
      // form of its own (CLAUDE.md): turned on by an editor, it would print
      // the placeholder heading stored in the dataset. `enabled` is false and
      // stays declared, so nothing stored is orphaned (rule 1).
      hidden: true,
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
      title: 'Blog switch',
      type: 'object',
      group: 'visibility',
      description: 'Leave this on.',
      fields: [
        defineField({
          name: 'showJournal',
          title: 'Show the blog',
          type: 'boolean',
          initialValue: true,
          description:
            'Turned off, the whole blog comes off the website: the Blog page, every post and the posts on the home page. Nothing is deleted, and turning it back on brings it all back.',
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site settings' }),
  },
});
