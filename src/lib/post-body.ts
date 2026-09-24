// scaffold-file: journal
// The post body's reading pass (the journal polish, 2026-09-22, variant
// "P2 Bulletin"). A PURE pre-pass over `journalEntry.body` that hands the
// renderer new blocks; nothing here writes to the dataset, and the stored
// Portable Text is never edited (CLAUDE.md rule 15: the fix is derived at
// build time, so the 142 imported bodies stay exactly as the converter left
// them and a re-import cannot undo it).
//
// What it repairs is Wix residue the converter carried across faithfully:
//   - the `underline` decorator (405 blocks): underlined non-link text reads as
//     a link, and a link is already underlined;
//   - links to `#viewer-*` fragments, which were Wix's in-page anchors and
//     point at nothing here, and the "Page Contents" list built out of them;
//   - two event tables typed as bullet lists with the cells joined by ` · `;
//   - bold paragraphs doing a heading's job (Castoro has one weight, so a
//     `strong` is a faux bold anyway), and the Messiah post's FAQ;
//   - long runs of bold that are emphasis by volume rather than by meaning;
//   - an inline image that repeats the cover one screen below it.
// And, for sermon previews only, it finds the READING: the opening scripture
// the preview quotes, set between two rules by the renderer.
//
// STEGA. In the Studio preview every string carries invisible markers (U+FEFF
// among them, which matches \s), so every string this file COMPARES, measures
// or splits goes through splitStega().cleaned first (CLAUDE.md, the preview
// rules). Display text is passed through untouched wherever it can be.

import { splitStega } from './preview-stega.ts';
import { SCRIPTURE_REF, readingOf } from './sermon-derive.ts';

// ---- Shapes ----------------------------------------------------------------

export interface PTSpan {
  _type: 'span';
  _key?: string;
  text: string;
  marks?: string[];
}

export interface PTMarkDef {
  _key: string;
  _type: string;
  href?: string;
  [key: string]: unknown;
}

export interface PTBlock {
  _type: 'block';
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: Array<PTSpan | { _type: string; [key: string]: unknown }>;
  markDefs?: PTMarkDef[];
  [key: string]: unknown;
}

/** Any member of the body array: a text block or a custom object. */
export interface BodyNode {
  _type: string;
  _key?: string;
  [key: string]: unknown;
}

/** A list of ` · `-joined rows, set as a ruled table. */
export interface JournalTable extends BodyNode {
  _type: 'journalTable';
  head: string[] | null;
  rows: string[][];
  /** The first column is all numbers (or empty): set in old-style gold numerals. */
  numCol: boolean;
}

/** A short wholly-bold paragraph doing a heading's job, set as a point. */
export interface JournalPoint extends BodyNode {
  _type: 'journalPoint';
  /** "2" for a paragraph that opened "2. ", '' otherwise. */
  num: string;
  children: PTSpan[];
  markDefs: PTMarkDef[];
}

/** A question point and the plain paragraphs that answer it. */
export interface JournalQA extends BodyNode {
  _type: 'journalQA';
  question: JournalPoint;
  answer: PTBlock[];
}

/** A preview's opening scripture: the blocks, unmoved and unedited, plus the reference. */
export interface JournalLection extends BodyNode {
  _type: 'journalLection';
  reference: string;
  blocks: BodyNode[];
  /**
   * The passage's own text, when the build has it (feat/scripture-text,
   * src/lib/scripture-text.ts). Attached by the post page, never by
   * prepareBody: the body pass stays pure and network-free.
   */
  passage?: LectionPassage;
}

/** A reading's text as the lection's disclosure prints it. */
export interface LectionPassage {
  /** One entry per verse: its label ("11", or "4:1" where a chapter turns) and text. */
  verses: { label: string; text: string }[];
  /** The translation's credit line, printed under the passage. */
  credit: string;
  /** The translation's code ("BSB", "NIV"). */
  translation: string;
  /** API.Bible FUMS tokens, when the text came through it. */
  fums?: string[];
}

// ---- Small readers -----------------------------------------------------------

const cleaned = (text: unknown): string => splitStega(String(text ?? '')).cleaned;

function isBlock(node: unknown): node is PTBlock {
  return !!node && (node as BodyNode)._type === 'block';
}

function spansOf(node: { [key: string]: unknown }): PTSpan[] {
  const kids = Array.isArray(node.children) ? node.children : [];
  return kids.filter((c): c is PTSpan => !!c && (c as PTSpan)._type === 'span');
}

/** The visible text of a block, a point, a Q and A or a lection. */
export function textOf(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as BodyNode;
  if (n._type === 'block' || n._type === 'journalPoint') {
    return spansOf(n)
      .map((s) => cleaned(s.text))
      .join('');
  }
  if (n._type === 'journalQA') {
    const qa = n as JournalQA;
    return [textOf(qa.question), ...qa.answer.map(textOf)].join(' ');
  }
  if (n._type === 'journalLection') {
    return (n as JournalLection).blocks.map(textOf).join(' ');
  }
  return '';
}

const words = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/** A plain paragraph: a block with no list membership and a normal (or absent) style. */
function isParagraph(node: unknown): node is PTBlock {
  return isBlock(node) && !node.listItem && (node.style ?? 'normal') === 'normal';
}

function isHeading(node: unknown): boolean {
  return isBlock(node) && /^h[1-6]$/.test(node.style ?? '');
}

/** The asset id behind an image, whether the ref is raw (`_ref`) or projected (`_id`). */
export function assetRefOf(image: unknown): string {
  const asset = (image as { asset?: { _ref?: string; _id?: string } | null } | null)?.asset;
  return cleaned(asset?._ref ?? asset?._id ?? '');
}

function linkHref(block: PTBlock, mark: string): string | null {
  const def = (block.markDefs ?? []).find((d) => d._key === mark);
  if (!def || def._type !== 'link') return null;
  return cleaned(def.href ?? '');
}

const isDeadHref = (href: string | null): boolean => !!href && href.startsWith('#viewer-');

function spanIsDeadLink(block: PTBlock, span: PTSpan): boolean {
  return (span.marks ?? []).some((m) => isDeadHref(linkHref(block, m)));
}

/** Every span that carries words is bold. */
function whollyStrong(node: { [key: string]: unknown }): boolean {
  const spans = spansOf(node).filter((s) => cleaned(s.text).trim());
  return spans.length > 0 && spans.every((s) => (s.marks ?? []).includes('strong'));
}

// ---- The block-level repairs -------------------------------------------------

/**
 * One block with the span-level repairs made: `underline` dropped, a link to a
 * dead `#viewer-` fragment unwrapped to plain text, and `strong` taken off a
 * span longer than twelve words. `noStrong` drops bold altogether (points and
 * headings, whose weight is their style).
 */
function repairBlock<T extends PTBlock>(block: T, opts: { noStrong?: boolean } = {}): T {
  const defs = block.markDefs ?? [];
  const dead = new Set(defs.filter((d) => isDeadHref(linkHref(block, d._key))).map((d) => d._key));
  const children = (block.children ?? []).map((child) => {
    if ((child as PTSpan)._type !== 'span') return child;
    const span = child as PTSpan;
    const long = words(cleaned(span.text)) > 12;
    const marks = (span.marks ?? []).filter(
      (m) => m !== 'underline' && !dead.has(m) && !(m === 'strong' && (opts.noStrong || long)),
    );
    return { ...span, marks };
  });
  return { ...block, children, markDefs: defs.filter((d) => !dead.has(d._key)) };
}

/**
 * Wix's page-contents list: a list item whose only words are links to dead
 * `#viewer-` anchors (a stray ")" outside the link is allowed).
 */
function isDeadAnchorItem(block: PTBlock): boolean {
  const spans = spansOf(block);
  return (
    spans.some((s) => spanIsDeadLink(block, s)) &&
    spans.every((s) => spanIsDeadLink(block, s) || !/[\p{L}\p{N}]/u.test(cleaned(s.text)))
  );
}

/** Drop a trailing bold "Page Contents:" span, the label of the list that was removed. */
function dropPageContentsLabel(block: PTBlock): PTBlock {
  const kids = [...(block.children ?? [])];
  let i = kids.length - 1;
  while (
    i >= 0 &&
    (kids[i] as PTSpan)._type === 'span' &&
    !cleaned((kids[i] as PTSpan).text).trim()
  )
    i -= 1;
  const last = kids[i] as PTSpan | undefined;
  if (
    !last ||
    last._type !== 'span' ||
    !/^\s*page contents:?\s*$/i.test(cleaned(last.text)) ||
    !(last.marks ?? []).includes('strong')
  ) {
    return block;
  }
  kids.splice(i);
  const prev = kids[kids.length - 1] as PTSpan | undefined;
  if (prev && prev._type === 'span') {
    kids[kids.length - 1] = { ...prev, text: prev.text.replace(/\s+$/, '') };
  }
  return { ...block, children: kids };
}

/**
 * A ruled table from a list run whose every item carries ` · `.
 * Short rows are padded on the LEFT (the Messiah programme's header and its
 * last three rows have no number cell); a lone "-" cell is empty; row 0 is a
 * header when every cell is at most three words with no digit; the first
 * column is numeric when every body row's first cell is digits or empty.
 */
export function tableOf(run: PTBlock[]): JournalTable {
  let rows = run.map((b) =>
    textOf(b)
      .split(' · ')
      .map((c) => c.trim()),
  );
  const width = Math.max(...rows.map((r) => r.length));
  rows = rows.map((r) =>
    Array<string>(width - r.length)
      .fill('')
      .concat(r)
      .map((c) => (c === '-' ? '' : c)),
  );
  const isHead = rows[0].every((c) => !/\d/.test(c) && words(c) <= 3);
  const head = isHead ? (rows.shift() ?? null) : null;
  const numCol = rows.length > 0 && rows.every((r) => r[0] === '' || /^\d+$/.test(r[0]));
  return { _type: 'journalTable', _key: `${run[0]._key ?? 'run'}-table`, head, rows, numCol };
}

/** A list run is a table when it has at least three items and every one has a middot. */
export function isTableRun(run: PTBlock[]): boolean {
  return run.length >= 3 && run.every((b) => textOf(b).includes(' · '));
}

/**
 * A point: a plain paragraph, wholly bold, at most 22 words, that ends in a
 * question mark, opens with a number ("2. "), or has no closing punctuation.
 */
export function isPoint(block: PTBlock): boolean {
  if (!isParagraph(block)) return false;
  const text = textOf(block).trim();
  if (!text || !whollyStrong(block) || words(text) > 22) return false;
  // Two exclusions the 142 posts asked for, beyond the prototype's rule: a
  // line with no letters ("***", a Wix section break) is not a point, and
  // neither is a bold attribution ("- Ephesians 1:3-10", "-from John 14:1-14"),
  // which belongs to the quotation above it rather than heading what follows.
  if (!/\p{L}/u.test(text) || /^[-–]/.test(text)) return false;
  return /\?$/.test(text) || /^\d+\.\s/.test(text) || !/[.!:"”’)]$/.test(text);
}

/** Remove the first `count` visible characters from a run of spans. */
function dropLeading(spans: PTSpan[], count: number): PTSpan[] {
  let left = count;
  const out: PTSpan[] = [];
  for (const span of spans) {
    if (left <= 0) {
      out.push(span);
      continue;
    }
    const visible = cleaned(span.text).length;
    if (visible <= left) {
      left -= visible;
      continue;
    }
    // Stega runs are appended at the END of a string, so slicing the raw text
    // from the start removes exactly the visible characters counted.
    out.push({ ...span, text: span.text.slice(left) });
    left = 0;
  }
  return out;
}

function pointOf(block: PTBlock, forceNum?: string): JournalPoint {
  const repaired = repairBlock(block, { noStrong: true });
  const text = textOf(block).trim();
  const m = forceNum ? null : text.match(/^(\d+)\.\s+/);
  let children = spansOf(repaired);
  if (m) {
    const lead = textOf(block).match(/^\s*\d+\.\s+/)?.[0].length ?? 0;
    children = dropLeading(children, lead);
  }
  return {
    _type: 'journalPoint',
    _key: `${block._key ?? 'p'}-point`,
    num: forceNum ?? (m ? m[1] : ''),
    children,
    markDefs: repaired.markDefs ?? [],
  };
}

// ---- The lection -------------------------------------------------------------

/**
 * Where a sermon preview's reading sits: skip an opening "This is a sermon
 * preview..." paragraph, then the first run of at most four blocks (plain
 * paragraphs, quotations or points) that ends in a block containing a
 * scripture reference. Null when the opening is anything else: the reading is
 * never guessed.
 */
export function findLection(
  blocks: readonly BodyNode[],
): { from: number; to: number; reference: string } | null {
  let start = 0;
  if (isParagraph(blocks[0]) && /^this is a sermon preview/i.test(textOf(blocks[0]).trim())) {
    start = 1;
  }
  for (let j = start; j < Math.min(blocks.length, start + 4); j += 1) {
    const b = blocks[j];
    const eligible =
      isParagraph(b) ||
      (isBlock(b) && b.style === 'blockquote' && !b.listItem) ||
      b._type === 'journalPoint';
    if (!eligible) return null;
    const text = textOf(b);
    if (SCRIPTURE_REF.test(text)) return { from: start, to: j, reference: readingOf(text) };
  }
  return null;
}

// ---- The whole pass ----------------------------------------------------------

export interface PrepareOptions {
  /** The cover's asset id (`assetRefOf(entry.coverImage)`); an inline copy of it is dropped. */
  coverRef?: string | null;
  /** A sermon preview: find and set its reading. */
  preview?: boolean;
}

/** The body the renderer draws. Pure: the input array and its blocks are not modified. */
export function prepareBody(
  body: readonly BodyNode[] | null | undefined,
  opts: PrepareOptions = {},
): BodyNode[] {
  if (!Array.isArray(body)) return [];
  const cover = opts.coverRef ? cleaned(opts.coverRef) : '';
  const out: BodyNode[] = [];

  let i = 0;
  while (i < body.length) {
    const node = body[i];

    if (!isBlock(node)) {
      const duplicateCover = node?._type === 'inlineImage' && !!cover && assetRefOf(node) === cover;
      if (!duplicateCover && node) out.push(node);
      i += 1;
      continue;
    }

    if (node.listItem) {
      const run: PTBlock[] = [];
      while (i < body.length && isBlock(body[i]) && (body[i] as PTBlock).listItem) {
        run.push(body[i] as PTBlock);
        i += 1;
      }
      if (run.length === 1 && run[0].listItem === 'number' && whollyStrong(run[0])) {
        out.push(pointOf(run[0], '1'));
      } else if (isTableRun(run)) {
        out.push(tableOf(run));
      } else if (run.every(isDeadAnchorItem)) {
        const prev = out[out.length - 1];
        if (isBlock(prev)) out[out.length - 1] = dropPageContentsLabel(prev);
      } else {
        for (const b of run) out.push(repairBlock(b));
      }
      continue;
    }

    i += 1;
    const hasObjects = (node.children ?? []).some((c) => (c as PTSpan)._type !== 'span');
    if (!textOf(node).trim() && !hasObjects) continue;
    if (isHeading(node)) out.push(repairBlock(node, { noStrong: true }));
    else if (isPoint(node)) out.push(pointOf(node));
    else out.push(repairBlock(node));
  }

  // A run of question points, each answered by plain paragraphs: Q and A rows.
  const questions = out.filter(
    (n) => n._type === 'journalPoint' && /\?$/.test(textOf(n).trim()),
  ).length;
  let result = out;
  if (questions >= 3) {
    result = [];
    for (let j = 0; j < out.length; j += 1) {
      const n = out[j];
      if (n._type === 'journalPoint' && /\?$/.test(textOf(n).trim())) {
        const answer: PTBlock[] = [];
        while (j + 1 < out.length && isParagraph(out[j + 1])) {
          answer.push(out[j + 1] as PTBlock);
          j += 1;
        }
        result.push({
          _type: 'journalQA',
          _key: `${n._key ?? 'q'}-qa`,
          question: n as JournalPoint,
          answer,
        } satisfies JournalQA);
      } else {
        result.push(n);
      }
    }
  }

  if (opts.preview) {
    const lec = findLection(result);
    if (lec) {
      const blocks = result.slice(lec.from, lec.to + 1);
      result = [
        ...result.slice(0, lec.from),
        {
          _type: 'journalLection',
          _key: `${blocks[0]._key ?? 'l'}-lection`,
          reference: lec.reference,
          blocks,
        } satisfies JournalLection,
        ...result.slice(lec.to + 1),
      ];
    }
  }

  return result;
}

// ---- Facts read off the body -------------------------------------------------

const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Does the excerpt repeat the body? True when its first 60 normalised
 * characters appear in the first text paragraph (34 of the 142 posts), in
 * which case the page omits the lede rather than print the sentence twice.
 */
export function ledeEchoes(
  excerpt: string | null | undefined,
  body: readonly BodyNode[] | null | undefined,
): boolean {
  const ex = norm(cleaned(excerpt)).slice(0, 60).trim();
  if (!ex || !Array.isArray(body)) return false;
  const texts = body.filter(
    (n) =>
      (isParagraph(n) || n._type === 'journalPoint' || n._type === 'journalQA') && textOf(n).trim(),
  );
  const echoes = (n: BodyNode | undefined) => !!n && norm(textOf(n)).includes(ex);
  // A sermon preview opens "This is a sermon preview for...", and its excerpt is
  // usually the first paragraph AFTER that line (and after the reading, which is
  // a journalLection and so never in `texts`). Look one paragraph past it.
  const opener = texts[0] && /^this is a sermon preview/i.test(norm(textOf(texts[0])));
  return echoes(texts[0]) || (!!opener && echoes(texts[1]));
}

/** The text of the first `n` text blocks, for readingOf / seriesOf. */
export function openingText(body: readonly unknown[] | null | undefined, n = 6): string {
  if (!Array.isArray(body)) return '';
  return body
    .filter((b) => isBlock(b) && textOf(b).trim())
    .slice(0, n)
    .map((b) => textOf(b).trim())
    .join(' ');
}

/** The first Church Center channel link in the opening block, or ''. */
export function listenHref(body: readonly unknown[] | null | undefined): string {
  if (!Array.isArray(body)) return '';
  const first = body.find(isBlock);
  if (!first) return '';
  for (const def of first.markDefs ?? []) {
    const href = def._type === 'link' ? cleaned(def.href ?? '') : '';
    if (href.includes('churchcenter.com/channels')) return href;
  }
  return '';
}

// ── The one interactive thing in a body ─────────────────────────────────────
// The post body renders to static HTML at build time (JournalBody.astro,
// 2026-09-24): no React ships for it. The before/after slider is the only body
// type that needs JavaScript, so the body is cut at each one and the slider is
// hydrated on its own. Everything between sliders stays one run, in order; a
// body with no slider (every post today) is one run.

export type BodySegment =
  { kind: 'blocks'; nodes: BodyNode[] } | { kind: 'slider'; node: BodyNode };

export function splitAtSliders(body: readonly BodyNode[] | null | undefined): BodySegment[] {
  const out: BodySegment[] = [];
  if (!Array.isArray(body)) return out;
  let run: BodyNode[] = [];
  for (const node of body) {
    if (node?._type === 'beforeAfter') {
      if (run.length) out.push({ kind: 'blocks', nodes: run });
      run = [];
      out.push({ kind: 'slider', node });
    } else {
      run.push(node);
    }
  }
  if (run.length) out.push({ kind: 'blocks', nodes: run });
  return out;
}
