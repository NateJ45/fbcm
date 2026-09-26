// scaffold-file: journal
// Journal/blog post. Designed to handle every kind of post the founder might write:
// project walkthroughs, style guides, behind-the-scenes, source roundups,
// process explainers, opinion pieces, announcements. The body field accepts
// rich Portable Text plus seven custom inline blocks (pullQuote, beforeAfter,
// sourceCard, tipCallout, imageGallery, divider, videoEmbed) that the
// JournalPortableText renderer styles to brand.
//
// Editor experience: groups split fields into Meta / Content / SEO / Related so
// the form isn't a wall. The body field is the only one the editor touches for the
// actual post copy; everything else is metadata.

import { defineType, defineField, defineArrayMember } from 'sanity';
import { linkRule, LINK_TOKEN_HINT } from './_linkRule.ts';

export const journalEntry = defineType({
  name: 'journalEntry',
  title: 'Post',
  type: 'document',
  groups: [
    { name: 'meta', title: 'About the post' },
    { name: 'content', title: 'The post' },
    { name: 'seo', title: 'Search' },
  ],
  fields: [
    // ---------- Meta ----------
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Keep it under about 70 letters so it fits on one line on the Blog page.',
      group: 'meta',
      options: {
        canvasApp: {
          purpose:
            'Blog post headline, under 70 chars. Voice: warm, plain-spoken, specific. Prefer concrete details over vague category labels.',
        },
      },
      validation: (Rule) => [
        Rule.required().error('Give the post a title.'),
        Rule.max(120).error('Keep the title to 120 letters or fewer.'),
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      description:
        'Click Generate. The post lives at /post/ followed by this. Once the post is published, leave it alone.',
      options: { source: 'title', maxLength: 96 },
      group: 'meta',
      validation: (Rule) => Rule.required().error('Click Generate to make the web address.'),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short summary',
      type: 'text',
      description:
        'One or two sentences shown under the title on the Blog page, and under the link in Google. About 160 letters reads well.',
      rows: 3,
      group: 'meta',
      options: {
        canvasApp: {
          purpose:
            'One or two sentences shown on the journal card AND as the SEO description (~160 chars). Voice: warm, plain-spoken, slightly informal. Specific beats generic.',
        },
      },
      validation: (Rule) => [
        Rule.required().error('Write a sentence or two about the post.'),
        Rule.max(220).error('Keep the summary to 220 letters or fewer.'),
      ],
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover picture',
      type: 'image',
      description:
        'The picture at the top of the post. It also shows beside the post on the Blog page.',
      group: 'meta',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Describe the picture',
          type: 'string',
          description: 'A sentence saying what is in the picture, for people who cannot see it.',
          validation: (R) =>
            R.required().error(
              'Describe the picture in a few words, for people who cannot see it.',
            ),
        }),
        defineField({
          name: 'caption',
          title: 'Caption (not shown)',
          type: 'string',
          // Covers print no caption since 2026-09-23 (the owner's rule), so the
          // box shows only where an old caption is still stored.
          description: 'Captions are no longer printed under cover pictures. You can empty this.',
          hidden: ({ value }) => !value,
        }),
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      description:
        'Pick one or more, like "Sermon Preview". Each category has its own page on the Blog.',
      group: 'meta',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'journalCategory' }] })],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Short labels like "Advent" or "Mark". Press Enter after each one.',
      group: 'meta',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      description:
        'Who wrote it, as it should appear under the title, like "Kendall Ellis". Leave blank for no byline.',
      group: 'meta',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date',
      type: 'datetime',
      description:
        'The date printed on the post. Posts are listed newest first by it. It starts as today. A later date does not hold the post back: it goes live when you publish.',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required().error('Pick the date for the post.'),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Date last changed',
      type: 'datetime',
      description:
        'Optional. Set this after a real change to a post that is already published, so Google knows it was updated.',
      group: 'meta',
    }),
    // ---------- Content (the body) ----------
    defineField({
      name: 'body',
      title: 'The post',
      type: 'array',
      description:
        'Write the post here. Use the heading styles to break it up. The + button in the toolbar adds a photo, a pull quote, a tip box, a gallery, a divider or a video.',
      group: 'content',
      options: {
        canvasApp: {
          purpose:
            "Long-form blog post body. Voice: warm, plain-spoken, slightly informal — like a knowledgeable friend, not a brochure. Show specific thinking. Stop when done; don't tack on summary sentences. Be specific over general.",
        },
      },
      validation: (Rule) => Rule.required().min(1).error('The post is empty. Write it here.'),
      of: [
        // Standard Portable Text block — paragraphs, headings, lists, marks
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraph', value: 'normal' },
            { title: 'Larger opening paragraph', value: 'lead' },
            { title: 'Heading', value: 'h2' },
            { title: 'Smaller heading', value: 'h3' },
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
              { title: 'Underline', value: 'underline' },
              { title: 'Highlight', value: 'highlight' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'Web address',
                    description: `A page on this site like /visit, a full address, or mailto: and an email address. ${LINK_TOKEN_HINT}`,
                    validation: linkRule(),
                  }),
                  {
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in a new tab',
                    initialValue: false,
                  },
                ],
              },
              {
                // Inline "Sourced from" annotation — italic small-caps treatment
                // for vendor mentions in prose. Pair with sourceCard block when
                // the item deserves a full card with image + price.
                name: 'sourcedFrom',
                type: 'object',
                title: 'Where this came from',
                fields: [
                  {
                    name: 'vendor',
                    type: 'string',
                    title: 'Name of the source',
                    description: 'Like the book or the website the words came from.',
                    validation: (R) => R.required().error('Type the name of the source.'),
                  },
                  { name: 'url', type: 'url', title: 'Its web address (optional)' },
                ],
              },
            ],
          },
        }),

        // Inline image (single, with caption)
        defineArrayMember({
          type: 'image',
          name: 'inlineImage',
          title: 'Photo',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Describe the photo',
              type: 'string',
              validation: (R) =>
                R.required().error(
                  'Describe the photo in a few words, for people who cannot see it.',
                ),
            }),
            defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
            defineField({
              name: 'size',
              title: 'Size',
              type: 'string',
              description: 'How wide the photo is. Wide suits most photos.',
              options: {
                list: [
                  { title: 'As wide as the text', value: 'standard' },
                  { title: 'Wide', value: 'wide' },
                  { title: 'The full width of the screen', value: 'full' },
                ],
                layout: 'radio',
              },
              initialValue: 'wide',
            }),
          ],
          preview: { select: { title: 'caption', subtitle: 'alt', media: 'asset' } },
        }),

        // Pull quote — the dramatic editorial pull quote
        defineArrayMember({
          type: 'object',
          name: 'pullQuote',
          title: 'Pull quote',
          fields: [
            defineField({
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 3,
              validation: (Rule) => [
                Rule.required().error('Type the words to pull out.'),
                Rule.max(280).error('Keep a pull quote to 280 letters or fewer.'),
              ],
            }),
            defineField({
              name: 'attribution',
              title: 'Who said it',
              type: 'string',
              description: 'Optional. Leave blank when the words are from this post.',
            }),
          ],
          preview: {
            select: { quote: 'quote', attribution: 'attribution' },
            prepare: ({ quote, attribution }) => ({
              title: quote
                ? quote.length > 60
                  ? quote.slice(0, 60) + '…'
                  : quote
                : '(empty quote)',
              subtitle: attribution || 'Pull quote',
            }),
          },
        }),

        // Before/After pair — for project posts
        defineArrayMember({
          type: 'object',
          name: 'beforeAfter',
          title: 'Before and after photos',
          fields: [
            defineField({
              name: 'beforeImage',
              title: 'Before',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Describe the photo',
                  type: 'string',
                  validation: (R) => R.required().error('Describe the photo in a few words.'),
                }),
              ],
              validation: (Rule) => Rule.required().error('Add the "before" photo.'),
            }),
            defineField({
              name: 'afterImage',
              title: 'After',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Describe the photo',
                  type: 'string',
                  validation: (R) => R.required().error('Describe the photo in a few words.'),
                }),
              ],
              validation: (Rule) => Rule.required().error('Add the "after" photo.'),
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional. A few words on what changed.',
            }),
          ],
          preview: {
            select: { caption: 'caption', media: 'afterImage' },
            prepare: ({ caption, media }) => ({ title: caption ?? 'Before / After', media }),
          },
        }),

        // Source card — vendor/source roundup item
        defineArrayMember({
          type: 'object',
          name: 'sourceCard',
          title: 'Recommended book or resource',
          description:
            'A small card for something you recommend, like a book: a picture, its name, where to get it and a link.',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              fields: [defineField({ name: 'alt', title: 'Describe the picture', type: 'string' })],
            }),
            defineField({
              name: 'itemName',
              title: 'Name',
              type: 'string',
              description: 'Like the title of the book.',
              validation: (Rule) => Rule.required().error('Type its name.'),
            }),
            defineField({
              name: 'vendor',
              title: 'Where to get it',
              type: 'string',
              description: 'Like "The church library" or "Any bookshop".',
            }),
            defineField({
              name: 'price',
              title: 'Price (optional)',
              type: 'string',
              description: 'As it should read, like "$12.99".',
            }),
            defineField({
              name: 'url',
              title: 'Web address (optional)',
              type: 'url',
              description: 'Where to find it online.',
            }),
            defineField({
              name: 'notes',
              title: 'Why you recommend it (optional)',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: { title: 'itemName', subtitle: 'vendor', media: 'image' },
          },
        }),

        // Tip callout — a labeled aside ("Designer's note:", "Worth knowing:", etc.)
        defineArrayMember({
          type: 'object',
          name: 'tipCallout',
          title: 'Tip box',
          fields: [
            defineField({
              name: 'label',
              title: 'Small heading',
              type: 'string',
              description: 'A few words on top of the box, like "Worth knowing" or "For parents".',
              initialValue: 'Worth knowing',
              validation: (Rule) => [
                Rule.required().error('Type a small heading for the box.'),
                Rule.max(40).error('Keep it to 40 letters or fewer.'),
              ],
            }),
            defineField({
              name: 'content',
              title: 'Text',
              type: 'array',
              description: 'What the box says. Bold, italic and links work here.',
              of: [
                defineArrayMember({
                  type: 'block',
                  styles: [{ title: 'Paragraph', value: 'normal' }],
                  lists: [{ title: 'Bullet', value: 'bullet' }],
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
                            type: 'url',
                            title: 'Web address',
                            description: LINK_TOKEN_HINT,
                            validation: linkRule(),
                          }),
                          {
                            name: 'openInNewTab',
                            type: 'boolean',
                            title: 'Open in a new tab',
                            initialValue: false,
                          },
                        ],
                      },
                    ],
                  },
                }),
              ],
              validation: (Rule) => Rule.required().error('Type what the box says.'),
            }),
          ],
          preview: {
            select: { label: 'label', content: 'content' },
            prepare: ({ label, content }) => {
              const first = Array.isArray(content) ? content[0] : null;
              const text =
                first?.children
                  ?.map((c: any) => c?.text ?? '')
                  .join(' ')
                  .trim() ?? '';
              return {
                title: typeof label === 'string' && label ? label : 'Tip box',
                subtitle: text.slice(0, 60),
              };
            },
          },
        }),

        // Image gallery — a row/grid of images
        defineArrayMember({
          type: 'object',
          name: 'imageGallery',
          title: 'Photo gallery',
          fields: [
            defineField({
              name: 'images',
              title: 'Photos',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'image',
                  options: { hotspot: true },
                  fields: [
                    defineField({
                      name: 'alt',
                      title: 'Describe the photo',
                      type: 'string',
                      validation: (R) =>
                        R.required().error(
                          'Describe the photo in a few words, for people who cannot see it.',
                        ),
                    }),
                    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
                  ],
                }),
              ],
              validation: (Rule) =>
                Rule.required().min(2).error('A gallery needs at least two photos.'),
            }),
            defineField({
              name: 'layout',
              title: 'Layout',
              type: 'string',
              description: 'How the photos are arranged.',
              options: {
                list: [
                  { title: 'Two across', value: 'grid2' },
                  { title: 'Three across', value: 'grid3' },
                  { title: 'One row (swipe along it on a phone)', value: 'row' },
                ],
                layout: 'radio',
              },
              initialValue: 'grid2',
            }),
            defineField({
              name: 'caption',
              title: 'Caption for the whole gallery (optional)',
              type: 'string',
            }),
          ],
          preview: {
            select: { images: 'images', caption: 'caption' },
            prepare: ({ images, caption }) => ({
              title:
                typeof caption === 'string' && caption
                  ? caption
                  : `Photo gallery (${Array.isArray(images) ? images.length : 0} photos)`,
              media: images?.[0],
            }),
          },
        }),

        // Divider — visual section break
        defineArrayMember({
          type: 'object',
          name: 'divider',
          title: 'Divider',
          fields: [
            defineField({
              name: 'style',
              title: 'Style',
              type: 'string',
              options: {
                list: [
                  { title: 'A line', value: 'line' },
                  { title: 'An ornament (✺ ✺ ✺)', value: 'ornament' },
                  { title: 'Just a space', value: 'space' },
                ],
                layout: 'radio',
              },
              initialValue: 'ornament',
            }),
          ],
          preview: { prepare: () => ({ title: 'Divider' }) },
        }),

        // Video embed (YouTube/Vimeo URL)
        defineArrayMember({
          type: 'object',
          name: 'videoEmbed',
          title: 'Video',
          fields: [
            defineField({
              name: 'url',
              title: 'Video address',
              type: 'url',
              description: 'Paste the address of the video on YouTube or Vimeo.',
              validation: (Rule) => Rule.required().error('Paste the address of the video.'),
            }),
            defineField({
              name: 'caption',
              title: 'Caption (optional)',
              type: 'string',
            }),
          ],
          preview: {
            select: { url: 'url', caption: 'caption' },
            prepare: ({ url, caption }) => ({
              title: typeof caption === 'string' && caption ? caption : 'Video',
              subtitle: typeof url === 'string' ? url : '',
            }),
          },
        }),
      ],
    }),

    // ---------- SEO (per-post overrides) ----------
    defineField({
      name: 'seoTitle',
      title: 'Title in Google',
      type: 'string',
      description:
        "Optional. The title in the browser tab and in Google's results, if it should differ from the post's title. About 50 to 60 letters.",
      group: 'seo',
      options: {
        canvasApp: {
          purpose:
            'Optional override for the HTML <title> tag. 50-60 chars. Front-load the keyword (location or topic). No marketing puffery.',
        },
      },
      validation: (Rule) =>
        Rule.max(60).warning('Google cuts off titles longer than about 60 letters.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Description in Google',
      type: 'text',
      rows: 3,
      description:
        "Optional. The sentence under the title in Google's results. Leave blank to use the short summary. About 150 to 160 letters.",
      group: 'seo',
      options: {
        canvasApp: {
          purpose:
            "Optional override for the meta description. 150-160 chars. Written for a human about to click, not for a search engine. Don't restate the title.",
        },
      },
      validation: (Rule) =>
        Rule.max(160).warning('Google cuts off descriptions longer than about 160 letters.'),
    }),

    // ---------- Related ----------
    // Not read by the site: /post/[slug].astro derives its related posts from
    // the tags (seriesByTag in src/lib/blog-derive.ts; see the note in
    // queries.ts), and no post sets this (0 of 142, checked 2026-09-20). Hidden
    // in the Studio audit (2026-09-26) rather than removed (rule 1), and its
    // "Related" tab went with it.
    defineField({
      name: 'relatedPosts',
      title: 'Related posts (not used)',
      type: 'array',
      hidden: true,
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'journalEntry' }] })],
      validation: (Rule) => Rule.max(3),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      publishedAt: 'publishedAt',
      media: 'coverImage',
    },
    prepare: ({ title, publishedAt, media }) => ({
      title: title || '(no title yet)',
      subtitle: publishedAt
        ? new Date(publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
      media,
    }),
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'dateDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
});
