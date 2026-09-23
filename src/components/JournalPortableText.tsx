// scaffold-file: journal
// Safe to edit by hand
// Renders a journal entry body. Handles standard Portable Text blocks plus
// seven custom inline types defined in studio/schemaTypes/journalEntry.ts:
//   - inlineImage  (with size variants: standard / wide / full)
//   - pullQuote    (editorial pull quote with optional attribution)
//   - beforeAfter  (drag-to-reveal slider, reuses BeforeAfterSlider)
//   - sourceCard   ("where I got it" vendor card)
//   - tipCallout   (labeled aside)
//   - imageGallery (grid2 / grid3 / row layouts)
//   - divider      (line / ornament / space)
//   - videoEmbed   (YouTube/Vimeo URL → responsive iframe)
//
// Headings get a stable id (derived from the heading text via slugify) so
// the "In this post" list and deep-link anchors work. Default block styles
// mirror the existing PortableText component, with one extra: "lead" style
// for the large intro paragraph.
//
// THE READING PASS (journal polish, 2026-09-22, "P2 Bulletin"). The post page
// hands this component the body AFTER src/lib/post-body.ts has run over it, so
// four more types arrive that are never stored in Sanity: journalTable,
// journalPoint, journalQA and journalLection. Their look, and the restyled
// headings, quotes, lists, bold and captions, is CSS in the `.post-prose`
// block of src/pages/post/[slug].astro rather than Tailwind utilities here: a
// utility added or dropped in this file changes the one global stylesheet
// every page inlines, and the journal pass must leave every other page's
// bytes alone (the parity gate).

import { PortableText as PT, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import type { ReactNode } from 'react';
import { urlFor, parseSanityAssetDimensions } from '@/lib/sanity';
import { slugify } from '@/lib/slugify';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import type {
  BodyNode,
  JournalTable,
  JournalPoint,
  JournalQA,
  JournalLection,
} from '@/lib/post-body';

interface Props {
  /** The body, raw or after prepareBody() (src/lib/post-body.ts). */
  value: PortableTextBlock[] | BodyNode[] | undefined | null;
  className?: string;
}

// Stable, unique heading ids per render so anchors don't collide if a post
// repeats a heading text.
function makeHeadingId(seen: Map<string, number>, children: any): string {
  const text = Array.isArray(children)
    ? children
        .map((c) => (typeof c === 'string' ? c : (c?.props?.children ?? '')))
        .join('')
        .trim()
    : String(children ?? '').trim();
  const base = slugify(text);
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

// Parse a YouTube or Vimeo URL into an embed src. Returns null for anything else.
function videoEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube — handle youtube.com/watch?v=, youtu.be/, /embed/, /shorts/
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split(/[/?#]/)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // Vimeo — handle vimeo.com/{id}
    if (/(^|\.)vimeo\.com$/.test(u.hostname)) {
      const id = u.pathname.replace(/^\//, '').split(/[/?#]/)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* fall through */
  }
  return null;
}

const pad2 = (n: string) => (n.length === 1 ? `0${n}` : n);

function makeComponents(): PortableTextComponents {
  const seen = new Map<string, number>();

  // One section-head style for h2, h3 and h4 (191 of the 227 body headings are
  // Wix h4s, which is an accident of the import, not a level of the argument).
  // Castoro roman at --text-h3 with a hairline above; the one titling line on
  // a post is its <h1>. The ids are unchanged, so the contents list and old
  // deep links still land.
  const heading =
    (Tag: 'h2' | 'h3' | 'h4') =>
    ({ children }: { children?: ReactNode }) => (
      <Tag id={makeHeadingId(seen, children)} className="pp-sh">
        {children}
      </Tag>
    );

  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      // Lead paragraph: the standfirst size, italic, as a lede anywhere else.
      lead: ({ children }) => <p className="pp-lead">{children}</p>,
      h2: heading('h2'),
      h3: heading('h3'),
      h4: heading('h4'),
      // A quotation: Castoro italic at 1.125rem (it was 28px, louder than the
      // sermon it quotes), with the gold rule hung in the gutter so the text
      // keeps the page's left edge.
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
      // The two synthetic styles below are how a point and a question reach
      // the span renderers (links, em) without a second copy of them.
      __point: ({ children, value }) => {
        const num = String((value as { num?: string })?.num ?? '');
        return (
          <p className="pp-point">
            {num && <span className="pp-pn">{pad2(num)}</span>}
            {children}
          </p>
        );
      },
      __question: ({ children }) => <p className="pp-q">{children}</p>,
    },

    list: {
      // A 12px gold rule for a bullet, an old-style gold numeral for a number:
      // both drawn in CSS so the marker shares the reading face.
      bullet: ({ children }) => <ul>{children}</ul>,
      number: ({ children }) => <ol>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },

    marks: {
      // Castoro has one weight, so bold was always a faux bold. It is a gold
      // highlighter band instead (post-body.ts has already taken it off any
      // run longer than twelve words).
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      // post-body.ts drops every underline before render; this stays so a
      // body that skipped the pass still renders, but it draws nothing.
      underline: ({ children }) => <>{children}</>,
      // Highlight uses bg-accent (theme-aware) for a subtle warm callout effect.
      highlight: ({ children }) => (
        <span className="rounded-sm bg-accent/60 px-1 text-foreground">{children}</span>
      ),
      link: ({ children, value }) => {
        const href = value?.href ?? '#';
        const isExternal = /^https?:\/\//.test(href);
        const newTab = value?.openInNewTab || isExternal;
        return (
          <a
            href={href}
            target={newTab ? '_blank' : undefined}
            rel={newTab ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        );
      },
      // Sourced-from annotation. Italic with a vendor eyebrow trailing. With
      // a URL, becomes a quiet bronze underlined link — pair this with
      // sourceCard when the item deserves a full card with image + price.
      sourcedFrom: ({ children, value }) => {
        const label = value?.vendor ?? '';
        const inner = (
          <span className="text-foreground/90 italic">
            {children}
            {label && (
              <span className="ml-1 align-baseline text-[0.72em] tracking-[0.15em] text-secondary uppercase not-italic">
                · {label}
              </span>
            )}
          </span>
        );
        if (!value?.url) return inner;
        return (
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
          >
            {inner}
          </a>
        );
      },
    },

    // Custom inline types — one renderer per schema's `type`/`name`.
    types: {
      // -- inline image (with size variants + caption) ---------------------
      inlineImage: ({ value }) => {
        if (!value?.asset) return null;
        const size: 'standard' | 'wide' | 'full' = value.size ?? 'wide';
        const targetWidth = size === 'full' ? 2400 : size === 'wide' ? 1600 : 800;
        const url = urlFor(value).width(targetWidth).quality(75).format('webp').url();
        const url2x = urlFor(value)
          .width(targetWidth * 2)
          .quality(75)
          .format('webp')
          .url();
        // Intrinsic dimensions from the Sanity asset _ref do two jobs:
        // (1) reserve the aspect-ratio box before the file lands (kills the
        //     CLS Lighthouse used to flag), and (2) let us detect portrait
        //     orientation so vertical photos don't stretch the page taller
        //     than the viewport. Portrait shots always cap at ~600 px wide
        //     centered, regardless of the editor's chosen size (standard /
        //     wide / full) — width-bleed treatments only make sense for
        //     landscape compositions.
        //
        // FULL MEASURE, every size (art-direction pass, task 11). The editor's
        // standard/wide/full choice used to mean three different widths, one
        // of which broke out of the reading column with negative margins. A
        // picture inside a post now sits on the same left edge and the same
        // measure as the words around it, which is the page's one grammar
        // (CLAUDE.md rule 17); a portrait shot still caps so it cannot run
        // taller than the viewport.
        //
        // P2 Bulletin (2026-09-22): a portrait now caps at 360px, and the
        // caption hangs from the 28px gold tick every caption on the site uses.
        const dims = parseSanityAssetDimensions(value);
        const isPortrait = dims ? dims.height > dims.width : false;
        return (
          <figure className={isPortrait ? 'pp-fig pp-portrait' : 'pp-fig'}>
            <img
              src={url}
              srcSet={`${url} 1x, ${url2x} 2x`}
              width={dims?.width}
              height={dims?.height}
              alt={value.alt ?? ''}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
            {value.caption && (
              <figcaption className="pp-cap">
                <span className="pp-tick" aria-hidden="true"></span>
                {value.caption}
              </figcaption>
            )}
          </figure>
        );
      },

      // -- the reading pass's four types (src/lib/post-body.ts) ------------
      // A list whose items were table rows joined by middots. The header row
      // is real <th scope="col">; a number column is old-style gold numerals;
      // the last column of a three-column table is the quiet one (who sings).
      journalTable: ({ value }) => {
        const t = value as JournalTable;
        if (!Array.isArray(t?.rows) || t.rows.length === 0) return null;
        return (
          <div className="pp-table">
            <table>
              {t.head && (
                <thead>
                  <tr>
                    {t.head.map((c, i) => (
                      <th key={i} scope="col">
                        {/* The Messiah programme's number column has no
                            heading of its own; a screen reader still gets one. */}
                        {c ||
                          (i === 0 && t.numCol ? <span className="sr-only">Number</span> : null)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {t.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((c, i) => {
                      const cls = [
                        i === 0 && t.numCol ? 'pp-num' : '',
                        i === row.length - 1 && row.length > 2 ? 'pp-last' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <td key={i} className={cls || undefined}>
                          {c}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      },

      // A short bold paragraph doing a heading's job: roman at the item size,
      // its "2." (if any) a gold numeral line above.
      journalPoint: ({ value }) => (
        <PT
          value={
            [
              { ...(value as JournalPoint), _type: 'block', style: '__point' },
            ] as unknown as PortableTextBlock[]
          }
          components={components}
        />
      ),

      // The Messiah FAQ: a question and the paragraphs that answer it, ruled.
      journalQA: ({ value }) => {
        const qa = value as JournalQA;
        return (
          <div className="pp-qa">
            <PT
              value={
                [
                  { ...qa.question, _type: 'block', style: '__question' },
                ] as unknown as PortableTextBlock[]
              }
              components={components}
            />
            <PT value={qa.answer as unknown as PortableTextBlock[]} components={components} />
          </div>
        );
      },

      // A sermon preview's opening scripture, set between two rules with the
      // reference above it. The blocks are the post's own, unmoved.
      journalLection: ({ value }) => {
        const lec = value as JournalLection;
        return (
          <div className="pp-lection">
            <p className="pp-lection-h">
              <span>The reading</span>
              <span>{lec.reference}</span>
            </p>
            <PT value={lec.blocks as unknown as PortableTextBlock[]} components={components} />
          </div>
        );
      },

      // -- pull quote -----------------------------------------------------
      pullQuote: ({ value }) => {
        if (!value?.quote) return null;
        return (
          <figure className="my-section-lg border-y border-border-soft py-section-md text-center">
            <span
              aria-hidden="true"
              className="mb-[-1.5rem] block font-display text-[clamp(3rem,6vw,5rem)] leading-none text-link/45 select-none"
            >
              "
            </span>
            <blockquote className="mx-auto max-w-2xl px-m font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-snug text-foreground">
              {value.quote}
            </blockquote>
            {value.attribution && (
              <figcaption className="mt-l text-xs tracking-widest text-foreground/80 uppercase">
                — {value.attribution}
              </figcaption>
            )}
          </figure>
        );
      },

      // -- before/after slider --------------------------------------------
      beforeAfter: ({ value }) => {
        if (!value?.beforeImage?.asset || !value?.afterImage?.asset) return null;
        return (
          <div className="-mx-m my-section-md md:mx-0">
            <BeforeAfterSlider
              beforeImage={value.beforeImage}
              afterImage={value.afterImage}
              caption={value.caption}
            />
          </div>
        );
      },

      // -- source card ----------------------------------------------------
      sourceCard: ({ value }) => {
        if (!value?.itemName) return null;
        const hasImage = !!value.image?.asset;
        const inner = (
          <div className="flex items-start gap-l rounded-md border border-border-soft bg-muted p-l">
            {hasImage && (
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-card">
                <img
                  src={urlFor(value.image).width(200).quality(75).format('webp').url()}
                  width={96}
                  height={96}
                  alt={value.image.alt ?? ''}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="mb-xs text-xs tracking-widest text-foreground/80 uppercase">Source</p>
              <p className="font-display text-h4 leading-tight text-foreground">{value.itemName}</p>
              {(value.vendor || value.price) && (
                <p className="mt-xs text-sm text-foreground/80">
                  {value.vendor}
                  {value.vendor && value.price && (
                    <span className="mx-xs text-muted-foreground">·</span>
                  )}
                  {value.price && <span className="font-mono text-link">{value.price}</span>}
                </p>
              )}
              {value.notes && (
                <p className="mt-s text-sm text-foreground/85 italic">{value.notes}</p>
              )}
              {value.url && (
                <p className="mt-s">
                  <a
                    href={value.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold tracking-widest text-link uppercase hover:text-primary-dark"
                  >
                    View source{' '}
                    <span aria-hidden="true" className="ml-xs">
                      →
                    </span>
                  </a>
                </p>
              )}
            </div>
          </div>
        );
        return <div className="mx-auto my-l max-w-2xl">{inner}</div>;
      },

      // -- tip callout ----------------------------------------------------
      tipCallout: ({ value }) => {
        if (!value?.content) return null;
        return (
          <aside
            className="my-section-md rounded-r-md border-l-4 border-tertiary bg-muted/70 p-l"
            aria-label={value.label ?? 'Note'}
          >
            <p className="mb-s text-xs font-semibold tracking-widest text-foreground/80 uppercase">
              {value.label ?? "Designer's note"}
            </p>
            <div className="text-foreground/90 [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2 [&_p]:my-s [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-s [&_ul]:list-disc [&_ul]:pl-l">
              <PT value={value.content} />
            </div>
          </aside>
        );
      },

      // -- image gallery --------------------------------------------------
      imageGallery: ({ value }) => {
        const images: any[] = Array.isArray(value?.images) ? value.images : [];
        if (images.length === 0) return null;
        const layout: 'grid2' | 'grid3' | 'row' = value.layout ?? 'grid2';
        const gridClass =
          layout === 'grid3'
            ? 'grid grid-cols-2 md:grid-cols-3 gap-s'
            : layout === 'row'
              ? 'flex gap-s overflow-x-auto snap-x snap-mandatory pb-s -mx-m px-m md:overflow-visible md:mx-0 md:px-0 md:grid md:grid-cols-3'
              : 'grid grid-cols-1 md:grid-cols-2 gap-s';
        return (
          <figure className="my-section-md">
            <div className={gridClass}>
              {images.map((img, i) => {
                if (!img?.asset) return null;
                const url = urlFor(img).width(900).quality(75).format('webp').url();
                // 4:3 crop is enforced by `aspect-[4/3]` in CSS, so the
                // width/height pair just needs to encode the SAME ratio to
                // reserve layout space — exact pixel values don't matter.
                return (
                  <div
                    key={img._key ?? i}
                    className={
                      layout === 'row' ? 'w-[80%] shrink-0 snap-start md:w-auto md:shrink' : ''
                    }
                  >
                    <img
                      src={url}
                      width={800}
                      height={600}
                      alt={img.alt ?? ''}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] h-full w-full rounded-md object-cover"
                    />
                    {img.caption && (
                      <p className="mt-xs text-xs text-muted-foreground italic">{img.caption}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {value.caption && (
              <figcaption className="mt-3 font-body text-sm text-muted-foreground italic">
                {value.caption}
              </figcaption>
            )}
          </figure>
        );
      },

      // -- divider --------------------------------------------------------
      divider: ({ value }) => {
        const style: 'line' | 'ornament' | 'space' = value?.style ?? 'ornament';
        if (style === 'space') return <div className="my-section-lg" aria-hidden="true"></div>;
        if (style === 'line') {
          return (
            <hr
              className="mx-auto my-section-lg max-w-md border-t border-border-soft"
              aria-hidden="true"
            />
          );
        }
        return (
          <div className="my-section-lg text-center" aria-hidden="true">
            <span className="pl-[0.5em] font-display text-2xl tracking-[0.5em] text-secondary">
              ✺ ✺ ✺
            </span>
          </div>
        );
      },

      // -- video embed (YouTube / Vimeo) ---------------------------------
      videoEmbed: ({ value }) => {
        const src = value?.url ? videoEmbedSrc(value.url) : null;
        if (!src) return null;
        return (
          <figure className="my-section-md">
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              <iframe
                src={src}
                title={value.caption ?? 'Video'}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            {value.caption && (
              <figcaption className="mt-3 font-body text-sm text-muted-foreground italic">
                {value.caption}
              </figcaption>
            )}
          </figure>
        );
      },
    },
  };
  return components;
}

export default function JournalPortableText({ value, className }: Props) {
  if (!value || value.length === 0) return null;
  return (
    <div className={className}>
      <PT value={value as PortableTextBlock[]} components={makeComponents()} />
    </div>
  );
}
