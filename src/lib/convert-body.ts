// src/lib/convert-body.ts
// Foundation, edit with care
//
// The Wix capture's `bodyHtml` as real Portable Text: headings, links, lists,
// blockquotes and inline images, instead of the paragraph-only flattening
// `bodyFromCapture()` does in import-post.ts.
//
// WHY THIS FILE EXISTS. Plan 1 imported 142 posts from `bodyText`, one `normal`
// block per paragraph, because no HTML-to-Portable-Text converter was installed
// and this repo does not add a dependency without asking. Nathan approved
// `@portabletext/block-tools` on 2026-09-20; this is what that dependency buys.
//
// THREE THINGS TO KNOW BEFORE EDITING.
//
// 1. The block-tools schema is DERIVED from journalEntry.ts, never retyped.
//    `htmlToBlocks` will happily emit a style the Studio does not declare, and
//    the result opens invalid in the editor while passing every build. Reading
//    the styles, lists, decorators and annotations off the same definition the
//    Studio compiles means a schema change cannot leave the converter behind
//    (CLAUDE.md rule 15: derive it, do not store a second copy).
//
// 2. Images, tables and videos are pulled OUT of the HTML before parsing and
//    spliced back in afterwards, through a placeholder paragraph. Two reasons:
//    an upload is asynchronous and block-tools' matchers are not, and the Wix
//    shape (`<figure><a><img></a><figcaption>`) carries the caption on a
//    sibling element that the deserializer would otherwise turn into a stray
//    paragraph under the picture.
//
// 3. `_key`s are rewritten deterministically at the very end, from the post
//    slug and the block's index. A re-import must be byte-identical or the
//    "is this document already correct?" comparison in
//    scripts/reimport-post-bodies.mjs can never say "unchanged".
//
// The caller supplies `parseHtml`. There is no DOM in Node, block-tools needs
// one, and the only DOM implementation in this tree (jsdom) arrives through
// `sanity`'s CLI rather than as a declared dependency of ours. Keeping the
// parser injected means this module depends on nothing it did not ask for, and
// the two callers that do need a parser (the unit test and the re-import
// script) are both import-time tooling that never ships to a browser.

import { htmlToBlocks } from '@portabletext/block-tools';
import { journalEntry } from '../sanity/schemaTypes/journalEntry.ts';

// ── The shapes this module returns ─────────────────────────────────────────

export interface ConvertedSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
}

export interface ConvertedMarkDef {
  _type: string;
  _key: string;
  [field: string]: unknown;
}

export interface ConvertedTextBlock {
  _type: 'block';
  _key: string;
  style: string;
  listItem?: string;
  level?: number;
  markDefs: ConvertedMarkDef[];
  children: ConvertedSpan[];
}

export interface ConvertedObjectBlock {
  _type: string;
  _key: string;
  [field: string]: unknown;
}

export type ConvertedBlock = ConvertedTextBlock | ConvertedObjectBlock;

/** What carried, and what did not. The re-import script prints this per post. */
export interface ConvertReport {
  blocks: number;
  paragraphs: number;
  h2: number;
  h3: number;
  h4: number;
  links: number;
  listItems: number;
  quotes: number;
  images: number;
  /** The `<img src>` of every picture that had no file in the archive. */
  missingImages: string[];
  embeds: number;
  tables: number;
  /** Em-dashes in the church's own words. Counted, never rewritten. */
  emDashes: number;
}

export interface ConvertOptions {
  /** The post slug. Only used to make `_key`s unique per document. */
  slug: string;
  /** A DOM parser. In Node: `(html) => new JSDOM(html).window.document`. */
  parseHtml: (html: string) => Document;
  /** `<img src>` to a path inside the photo archive, or undefined if absent. */
  resolveImage?: (src: string) => string | undefined;
  /** Uploads an archive path and returns the Sanity asset `_ref`. */
  uploadImage?: (relPath: string) => Promise<string>;
  /** Alt text of last resort. The post title is the honest one. */
  fallbackAlt?: string;
}

// ── The schema, derived from the Studio's own journalEntry definition ───────
// block-tools takes a plain-data schema: which styles, lists, decorators and
// annotations are legal. Everything here is read off the `body` field so the
// two can never disagree. `blockSchema` is exported for the drift test.

interface NamedDefinition {
  name: string;
  value: string;
  title: string;
}

/** The primitive field types block-tools' schema understands. */
type FieldType = 'string' | 'number' | 'boolean' | 'object';

interface AnnotationDefinition extends NamedDefinition {
  fields: { name: string; type: FieldType; title: string }[];
}

/** `url`, `text` and `slug` are Sanity types; block-tools only knows strings. */
function fieldType(type: string | undefined): FieldType {
  if (type === 'number' || type === 'boolean' || type === 'object') return type;
  return 'string';
}

interface BlockToolsSchema {
  block: { name: string };
  span: { name: string };
  styles: NamedDefinition[];
  lists: NamedDefinition[];
  decorators: NamedDefinition[];
  annotations: AnnotationDefinition[];
  blockObjects: { name: string; title: string; fields: never[] }[];
  inlineObjects: never[];
}

/** The `of` members of journalEntry.body, typed only as far as we read them. */
interface RawArrayMember {
  type?: string;
  name?: string;
  title?: string;
  styles?: { title?: string; value: string }[];
  lists?: { title?: string; value: string }[];
  marks?: {
    decorators?: { title?: string; value: string }[];
    annotations?: {
      name?: string;
      title?: string;
      fields?: { name?: string; type?: string; title?: string }[];
    }[];
  };
}

function named(entry: { title?: string; value: string }): NamedDefinition {
  // block-tools reads `name`; `value` is its deprecated twin and both are
  // still required by the type, so the schema's `value` fills both.
  return { name: entry.value, value: entry.value, title: entry.title ?? entry.value };
}

function buildBlockSchema(): BlockToolsSchema {
  const body = journalEntry.fields.find((f) => f.name === 'body') as
    { of?: RawArrayMember[] } | undefined;
  const members = body?.of ?? [];
  const block = members.find((m) => m.type === 'block');
  if (!block) throw new Error('journalEntry.body has no `block` member: the schema moved');

  return {
    block: { name: 'block' },
    span: { name: 'span' },
    styles: (block.styles ?? []).map(named),
    lists: (block.lists ?? []).map(named),
    decorators: (block.marks?.decorators ?? []).map(named),
    annotations: (block.marks?.annotations ?? []).map((a) => ({
      name: a.name ?? 'link',
      value: a.name ?? 'link',
      title: a.title ?? a.name ?? 'link',
      fields: (a.fields ?? []).map((f) => ({
        name: f.name ?? 'href',
        type: fieldType(f.type),
        title: f.title ?? f.name ?? 'href',
      })),
    })),
    blockObjects: members
      .filter((m) => m.type !== 'block')
      .map((m) => ({ name: m.name ?? m.type ?? 'object', title: m.title ?? '', fields: [] })),
    inlineObjects: [],
  };
}

export const blockSchema: BlockToolsSchema = buildBlockSchema();

/** The block `_type`s that are legal on journalEntry.body. */
const ALLOWED_BLOCK_TYPES = new Set<string>([
  'block',
  ...blockSchema.blockObjects.map((b) => b.name),
]);

// ── Deterministic keys ─────────────────────────────────────────────────────

/** FNV-1a, four hex characters. Enough to keep two posts' keys apart. */
function keyPrefix(slug: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').slice(0, 4);
}

// ── Pulling the non-text pieces out before parsing ─────────────────────────

type Special =
  | { kind: 'image'; src: string; alt: string; caption: string }
  | { kind: 'video'; src: string; caption: string }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'text'; text: string };

const PLACEHOLDER = (i: number) => `@@FBCM-BLOCK-${i}@@`;
const PLACEHOLDER_RE = /^@@FBCM-BLOCK-(\d+)@@$/;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

/** Only used on attribute values and on text we lift out before parsing. */
function decode(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body.toLowerCase().startsWith('#x'))
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function stripTags(html: string): string {
  return decode(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? decode(m[1]).trim() : '';
}

/** Parse one `<table>` into rows of cell text. */
function tableRows(html: string): string[][] {
  const rows: string[][] = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells: string[] = [];
    for (const cell of row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)) {
      const text = stripTags(cell[1]);
      if (text) cells.push(text);
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/** Turn one `<figure>`, `<img>`, `<video>`, `<iframe>` or `<table>` into a Special. */
function readSpecial(fragment: string): Special {
  const caption = (() => {
    const m = fragment.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
    return m ? stripTags(m[1]) : '';
  })();

  const table = fragment.match(/<table\b[\s\S]*?<\/table>/i);
  if (table) return { kind: 'table', rows: tableRows(table[0]) };

  const media = fragment.match(/<(?:video|iframe)\b[^>]*>/i);
  if (media) return { kind: 'video', src: attr(media[0], 'src'), caption };

  const img = fragment.match(/<img\b[^>]*>/i);
  if (img) {
    const alt = attr(img[0], 'alt');
    return { kind: 'image', src: attr(img[0], 'src'), alt, caption };
  }

  // A figure with nothing we recognise inside it: keep whatever text it holds
  // rather than dropping the church's words on the floor.
  return { kind: 'text', text: stripTags(fragment) };
}

/**
 * Replace every image, video and table with a placeholder paragraph, and
 * normalise the two things Wix emits that the schema has no room for: headings
 * below h4 (the schema stops at h4) and the spacer `<br>` between paragraphs.
 */
function extractSpecials(html: string): { html: string; specials: Special[] } {
  const specials: Special[] = [];
  const take = (fragment: string) => {
    specials.push(readSpecial(fragment));
    return `<p>${PLACEHOLDER(specials.length - 1)}</p>`;
  };

  let out = html;
  // Figures first: they wrap the img/video and carry the caption.
  out = out.replace(/<figure\b[\s\S]*?<\/figure>/gi, take);
  out = out.replace(/<table\b[\s\S]*?<\/table>/gi, take);
  out = out.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, take);
  out = out.replace(/<video\b[\s\S]*?<\/video>/gi, take);
  out = out.replace(/<video\b[^>]*\/?>/gi, take);
  out = out.replace(/<img\b[^>]*>/gi, take);

  // Wix's paragraph spacer. Left in, it becomes an empty block per gap.
  out = out.replace(/<br\s*\/?>/gi, ' ');

  // The schema's headings are h2, h3 and h4. Wix writes h1 (rare) and a lot of
  // h5/h6 as its small headings; both ends fold inward rather than vanish.
  out = out.replace(/<(\/?)h1\b/gi, '<$1h2').replace(/<(\/?)h[56]\b/gi, '<$1h4');

  return { html: out, specials };
}

// ── Video URLs ─────────────────────────────────────────────────────────────

function isPlayableEmbed(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(host);
  } catch {
    return false;
  }
}

// ── The conversion ─────────────────────────────────────────────────────────

function textOf(block: ConvertedBlock): string {
  if (block._type !== 'block') return '';
  return (block as ConvertedTextBlock).children.map((c) => c.text).join('');
}

/** A paragraph carrying one link. Used for a video we cannot embed. */
function linkParagraph(text: string, href: string): ConvertedTextBlock {
  return {
    _type: 'block',
    _key: 'tmp',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'tmplink', href }],
    children: [{ _type: 'span', _key: 'tmpspan', text, marks: ['tmplink'] }],
  };
}

function paragraph(text: string): ConvertedTextBlock {
  return {
    _type: 'block',
    _key: 'tmp',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 'tmpspan', text, marks: [] }],
  };
}

function bulletItem(text: string): ConvertedTextBlock {
  return { ...paragraph(text), listItem: 'bullet', level: 1 };
}

export async function convertBody(
  html: string,
  options: ConvertOptions,
): Promise<{ blocks: ConvertedBlock[]; report: ConvertReport }> {
  const report: ConvertReport = {
    blocks: 0,
    paragraphs: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    links: 0,
    listItems: 0,
    quotes: 0,
    images: 0,
    missingImages: [],
    embeds: 0,
    tables: 0,
    emDashes: 0,
  };

  const source = String(html ?? '').trim();
  if (!source) return { blocks: [], report };

  const { html: cleaned, specials } = extractSpecials(source);

  const raw = htmlToBlocks(cleaned, blockSchema, {
    parseHtml: options.parseHtml,
    // Keys are rewritten below; a counter here only keeps the intermediate
    // result stable while the placeholders are spliced.
    keyGenerator: (() => {
      let n = 0;
      return () => `t${n++}`;
    })(),
  }) as unknown as ConvertedBlock[];

  // Each placeholder becomes one or more real blocks. Resolved in order so the
  // uploads happen once per picture and in a predictable sequence.
  const resolved = new Map<number, ConvertedBlock[]>();
  for (let i = 0; i < specials.length; i++) {
    resolved.set(i, await resolveSpecial(specials[i], options, report));
  }

  const spliced: ConvertedBlock[] = [];
  for (const block of raw) {
    const match = textOf(block).trim().match(PLACEHOLDER_RE);
    if (match) {
      spliced.push(...(resolved.get(Number(match[1])) ?? []));
      continue;
    }
    spliced.push(block);
  }

  // Drop what the schema cannot hold, and the empty paragraphs the spacer
  // `<br>` and Wix's wrapper divs leave behind.
  const kept = spliced.filter((block) => {
    if (!ALLOWED_BLOCK_TYPES.has(block._type)) return false;
    if (block._type !== 'block') return true;
    return textOf(block).replace(/\s| /g, '') !== '';
  });

  const blocks = kept.map((block, index) => rekey(block, `${keyPrefix(options.slug)}b${index}`));

  // The report is read off the FINAL blocks, so it describes what was written.
  for (const block of blocks) {
    report.blocks++;
    if (block._type !== 'block') continue;
    const text = block as ConvertedTextBlock;
    report.links += text.markDefs.filter((d) => d._type === 'link').length;
    report.emDashes += (textOf(text).match(/—/g) ?? []).length;
    if (text.listItem) {
      report.listItems++;
      continue;
    }
    if (text.style === 'h2') report.h2++;
    else if (text.style === 'h3') report.h3++;
    else if (text.style === 'h4') report.h4++;
    else if (text.style === 'blockquote') report.quotes++;
    else report.paragraphs++;
  }

  return { blocks, report };
}

async function resolveSpecial(
  special: Special,
  options: ConvertOptions,
  report: ConvertReport,
): Promise<ConvertedBlock[]> {
  if (special.kind === 'text') {
    return special.text ? [paragraph(special.text)] : [];
  }

  if (special.kind === 'table') {
    report.tables++;
    // No table block on journalEntry.body, and inventing one would be a schema
    // change hiding inside an import. One bullet per row keeps every cell.
    return special.rows.map((cells) => bulletItem(cells.join(' · ')));
  }

  if (special.kind === 'video') {
    report.embeds++;
    if (!special.src) return [];
    if (isPlayableEmbed(special.src)) {
      const embed: ConvertedObjectBlock = { _type: 'videoEmbed', _key: 'tmp', url: special.src };
      if (special.caption) embed.caption = special.caption;
      return [embed];
    }
    // A Wix-hosted mp4 has no embed block that can play it, so it becomes a
    // link the reader can follow rather than a silent hole in the post.
    return [linkParagraph(special.caption || 'Watch the video', special.src)];
  }

  // An image. The alt is required by the schema, so it falls back through the
  // caption to the post's own title.
  const alt = special.alt || special.caption || options.fallbackAlt || 'Photo from this post';
  const relPath = options.resolveImage?.(special.src);
  if (!relPath || !options.uploadImage) {
    report.missingImages.push(special.src);
    return [paragraph(alt)];
  }
  try {
    const ref = await options.uploadImage(relPath);
    report.images++;
    const image: ConvertedObjectBlock = {
      _type: 'inlineImage',
      _key: 'tmp',
      asset: { _type: 'reference', _ref: ref },
      alt,
      size: 'wide',
    };
    if (special.caption) image.caption = special.caption;
    return [image];
  } catch {
    report.missingImages.push(special.src);
    return [paragraph(alt)];
  }
}

/**
 * Give one block its final keys. Spans and markDefs are renumbered together,
 * because a span's `marks` array points at a markDef BY KEY and a rename that
 * misses one silently unlinks the link.
 */
function rekey(block: ConvertedBlock, key: string): ConvertedBlock {
  if (block._type !== 'block') return { ...(block as ConvertedObjectBlock), _key: key };
  const text = block as ConvertedTextBlock;
  const renamed = new Map<string, string>();
  const markDefs = text.markDefs.map((def, i) => {
    const next = `${key}m${i}`;
    renamed.set(def._key, next);
    return { ...def, _key: next };
  });
  return {
    ...text,
    _key: key,
    markDefs,
    children: text.children.map((child, i) => ({
      ...child,
      _key: `${key}s${i}`,
      marks: child.marks.map((mark) => renamed.get(mark) ?? mark),
    })),
  };
}
