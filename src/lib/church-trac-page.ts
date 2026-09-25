// Safe to edit by hand
// A Church Trac "Page Card" read into blocks the site can draw (2026-09-25).
// Pure: HTML in, blocks out, no network. The build-time fetch and the list of
// pages is src/lib/church-trac-newsletters.ts; the page that draws the blocks
// is src/components/newsletter/Newsletter.astro.
//
// WHY. The Children's and Youth ministries write their newsletters ("The
// Kid's Corner", "The Moose's Message") as pages in Church Trac, which also
// shows them in the church app. So Church Trac stays where they are written
// (CLAUDE.md rule 15), and the site reads the published page at build time and
// draws it in the church's own identity, the way /events reads the calendar.
// Church Trac has no feed or API for these pages, so this reads their HTML.
//
// WHAT A PAGE LOOKS LIKE (read 2026-09-25, tests/fixtures/churchtrac-*.html).
// Church Connect's portal page: its own header, a login menu and a footer,
// none of which is the newsletter. The newsletter is:
//   - the page's name: <input type="hidden" id="title" value="The Kid's Corner">;
//   - a banner: .hero-container, whose sections carry
//     data-section-published="1" or "0";
//   - the body: .page-card-body, a run of .page-card-section blocks. Inside,
//     .prompt-text divs (a heading when classed h1 to h4, else a paragraph,
//     with <b>, <i>, <span>, <br> and sometimes links inside, and sometimes a
//     .prompt-text nested in another), .prompt-image with an <img>,
//     a.prompt-button links, <hr>, and a row of columns
//     (.service-template-container, or any flex-md-row box) for side-by-side
//     schedules.
// Anything else (scripts, styles, the login menu) is never read.
//
// WHAT IS LEFT OUT, ON PURPOSE:
//   - a banner section marked unpublished;
//   - Church Trac's own template text, which it leaves in a section until
//     someone replaces it ("Add a Headline and Paragraph for this section...").
//     The Moose's Message carried it in its published banner on 2026-09-25;
//   - empty lines (a paragraph that is only <br>s), and empty boxes;
//   - any link that is not http(s) or mailto (a javascript: link never
//     reaches the page), and images not served over https.
// Church Trac's own alignment (centred text) is not kept: the site's pages
// have one left edge (CLAUDE.md rule 17).
//
// A SMALL HTML READER, NOT A DEPENDENCY. The pages are simple, well-formed
// HTML, and the project asks before adding a package (CLAUDE.md, "Ask before
// installing a dependency"), so a tokenizer and tree builder of about a
// hundred lines live below, tested against both real pages.

// ── Reading HTML into a tree ────────────────────────────────────────────────

export interface HtmlNode {
  tag: string; // '' for text
  attrs: Record<string, string>;
  children: HtmlNode[];
  text?: string;
  parent?: HtmlNode;
}

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
/** Elements whose content is not HTML: skipped whole. */
const RAW = new Set(['script', 'style', 'noscript', 'template', 'textarea', 'svg']);

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  copy: '©',
};

/** HTML entities decoded (named ones Church Trac uses, and every numeric one). */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code =
        e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

function parseAttrs(src: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

/** The whole document as a tree. Forgiving: a stray end tag is ignored. */
export function parseHtml(html: string): HtmlNode {
  const root: HtmlNode = { tag: '#root', attrs: {}, children: [] };
  let cur = root;
  const re =
    /<!--[\s\S]*?-->|<!doctype[^>]*>|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>|([^<]+|<)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[5] !== undefined) {
      cur.children.push({ tag: '', attrs: {}, children: [], text: m[5], parent: cur });
      continue;
    }
    if (!m[2]) continue; // comment or doctype
    const tag = m[2].toLowerCase();
    if (m[1]) {
      // An end tag: close up to the matching open element, if there is one.
      let n: HtmlNode | undefined = cur;
      while (n && n.tag !== tag) n = n.parent;
      if (n && n.parent) cur = n.parent;
      continue;
    }
    const node: HtmlNode = { tag, attrs: parseAttrs(m[3]), children: [], parent: cur };
    cur.children.push(node);
    if (RAW.has(tag)) {
      // Skip to its end tag; its content is never read.
      const end = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
      re.lastIndex = end < 0 ? html.length : html.indexOf('>', end) + 1 || html.length;
      continue;
    }
    if (!VOID.has(tag) && !m[4]) cur = node;
  }
  return root;
}

const classes = (n: HtmlNode): string[] => (n.attrs.class ?? '').split(/\s+/).filter(Boolean);
const hasClass = (n: HtmlNode, c: string): boolean => classes(n).includes(c);

/** Depth-first search for the first element matching. */
export function find(n: HtmlNode, test: (n: HtmlNode) => boolean): HtmlNode | null {
  for (const c of n.children) {
    if (c.tag && test(c)) return c;
    const hit = c.tag ? find(c, test) : null;
    if (hit) return hit;
  }
  return null;
}

/** Every element matching, in document order (not searching inside a match). */
export function findAll(n: HtmlNode, test: (n: HtmlNode) => boolean): HtmlNode[] {
  const out: HtmlNode[] = [];
  for (const c of n.children) {
    if (!c.tag) continue;
    if (test(c)) out.push(c);
    else out.push(...findAll(c, test));
  }
  return out;
}

// ── What the site draws ─────────────────────────────────────────────────────

/** A run of text in a paragraph, or a line break. */
export type Inline =
  { text: string; bold?: boolean; italic?: boolean; href?: string } | { br: true };

export type Block =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'text'; inline: Inline[] }
  | { kind: 'image'; src: string }
  | { kind: 'button'; label: string; href: string }
  | { kind: 'columns'; columns: Block[][] }
  | { kind: 'rule' };

export interface ChurchTracPage {
  /** The page's own name in Church Trac ("The Kid's Corner"). */
  title: string;
  /** The banner's picture, when it has one. */
  banner: string | null;
  /** The banner's words, when it has any beyond Church Trac's template text. */
  bannerBlocks: Block[];
  /** The body, one entry per Church Trac section. */
  sections: Block[][];
}

/** Church Trac's template text, left in a section until someone replaces it. */
export function isTemplateText(text: string): boolean {
  return /add a headline and paragraph for this section|click "?use a template"?|use a template" from the toolbar/i.test(
    text,
  );
}

const squash = (s: string) => s.replace(/[\s ]+/g, ' ');

/** A link the page may carry: http(s) or mailto, resolved against the page. */
export function safeHref(href: string | undefined, base: string): string | null {
  const raw = (href ?? '').trim();
  if (!raw || raw.startsWith('#')) return null;
  try {
    const url = new URL(raw, base);
    if (url.protocol === 'mailto:') return url.toString();
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
  } catch {
    // not a link
  }
  return null;
}

/** An image the page may show: https only, resolved against the page. */
export function safeImage(src: string | undefined, base: string): string | null {
  const href = safeHref(src, base);
  return href && href.startsWith('https:') ? href : null;
}

/** The inline runs of a paragraph: text with bold, italic and links kept. */
function inlineOf(
  n: HtmlNode,
  base: string,
  style: { bold?: boolean; italic?: boolean; href?: string } = {},
): Inline[] {
  const out: Inline[] = [];
  for (const c of n.children) {
    if (!c.tag) {
      const text = squash(decodeEntities(c.text ?? ''));
      if (text) out.push({ text, ...style });
      continue;
    }
    if (c.tag === 'br') {
      out.push({ br: true });
      continue;
    }
    const next = { ...style };
    if (
      c.tag === 'b' ||
      c.tag === 'strong' ||
      /font-weight:\s*(bold|[6-9]00)/i.test(c.attrs.style ?? '')
    )
      next.bold = true;
    if (c.tag === 'i' || c.tag === 'em') next.italic = true;
    if (c.tag === 'a') {
      const href = safeHref(c.attrs.href, base);
      if (href) next.href = href;
    }
    // A nested block inside a paragraph starts a new line.
    if (c.tag === 'div' || c.tag === 'p') {
      if (out.length && !('br' in out[out.length - 1])) out.push({ br: true });
    }
    out.push(...inlineOf(c, base, next));
  }
  return out;
}

/** Inline runs tidied: spaces at the line ends trimmed, empty lines and runs dropped. */
export function tidyInline(runs: Inline[]): Inline[] {
  // Split into lines at <br>, trim each line's ends, drop empty lines.
  const lines: Inline[][] = [[]];
  for (const r of runs) {
    if ('br' in r) lines.push([]);
    else lines[lines.length - 1].push({ ...r });
  }
  const kept: Inline[][] = [];
  for (const line of lines) {
    if (line.length === 0) continue;
    const first = line[0] as { text: string };
    const last = line[line.length - 1] as { text: string };
    first.text = first.text.replace(/^\s+/, '');
    last.text = last.text.replace(/\s+$/, '');
    const nonEmpty = line.filter((r) => (r as { text: string }).text !== '');
    if (nonEmpty.length) kept.push(nonEmpty);
  }
  for (const line of kept) {
    for (const r of line) {
      const a = r as { text: string };
      a.text = noDashes(a.text);
    }
  }
  const out: Inline[] = [];
  kept.forEach((line, i) => {
    if (i > 0) out.push({ br: true });
    // Merge neighbours with the same style.
    for (const r of line) {
      const prev = out[out.length - 1];
      const a = r as { text: string; bold?: boolean; italic?: boolean; href?: string };
      if (
        prev &&
        !('br' in prev) &&
        prev.bold === a.bold &&
        prev.italic === a.italic &&
        prev.href === a.href
      ) {
        prev.text += a.text;
      } else out.push(a);
    }
  });
  return out;
}

/**
 * No em-dashes on the site (CLAUDE.md rule 2), whoever wrote the words. The
 * same rule as the blog import's normaliser (src/lib/convert-body.ts
 * normalizeDashes), kept small here so this file needs none of that one's
 * imports: a dash between two words becomes a comma, any other dash is
 * dropped, and an en-dash only counts with a space on both sides, so a range
 * ("Eph. 4:15\u201316", "2003\u20132020") stays as written.
 */
export function noDashes(text: string): string {
  return text
    .replace(/\s*(?:\u2014|\s\u2013\s)\s*/g, (m, offset: number, all: string) => {
      const before = all.slice(0, offset);
      const after = all.slice(offset + m.length);
      if (/[\p{L}\p{N})\u2019"']$/u.test(before) && /^[\p{L}\p{N}(\u2018\u201C"']/u.test(after))
        return ', ';
      return before && after ? ' ' : '';
    })
    .replace(/\s{2,}/g, ' ');
}

export const plainText = (runs: Inline[]): string =>
  runs
    .map((r) => ('br' in r ? ' ' : r.text))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

const isHidden = (n: HtmlNode): boolean =>
  hasClass(n, 'hidden') ||
  /display\s*:\s*none/i.test(n.attrs.style ?? '') ||
  n.attrs['aria-hidden'] === 'true';

const HEADING_CLASSES = ['h1', 'h2', 'h3', 'h4'];

/** Is this box a row of columns (side-by-side schedules)? */
function isColumnRow(n: HtmlNode): boolean {
  const c = classes(n);
  if (!(
    c.includes('service-template-container') ||
    c.includes('columns') ||
    c.includes('flex-md-row')
  ))
    return false;
  return n.children.filter((k) => k.tag === 'div' && hasContent(k)).length >= 2;
}

function hasContent(n: HtmlNode): boolean {
  if (!n.tag) return !!squash(decodeEntities(n.text ?? '')).trim();
  if (n.tag === 'img') return true;
  return n.children.some(hasContent);
}

/** The blocks inside one box, in document order. */
function blocksOf(n: HtmlNode, base: string): Block[] {
  const out: Block[] = [];
  for (const c of n.children) {
    if (!c.tag || isHidden(c)) continue;
    if (c.tag === 'hr') {
      out.push({ kind: 'rule' });
      continue;
    }
    if (c.tag === 'img') {
      const src = safeImage(c.attrs.src, base);
      if (src) out.push({ kind: 'image', src });
      continue;
    }
    if (c.tag === 'a' && hasClass(c, 'prompt-button')) {
      const href = safeHref(c.attrs.href, base);
      const label = noDashes(squash(decodeEntities(textOf(c))).trim());
      if (href && label) out.push({ kind: 'button', label, href });
      continue;
    }
    if (isColumnRow(c)) {
      const columns = c.children
        .filter((k) => k.tag === 'div' && hasContent(k) && !isHidden(k))
        .map((k) => blocksOf(k, base))
        .filter((col) => col.length > 0);
      if (columns.length >= 2) out.push({ kind: 'columns', columns });
      else if (columns.length === 1) out.push(...columns[0]);
      continue;
    }
    if (hasClass(c, 'prompt-text') || hasClass(c, 'paragraph')) {
      // A prompt-text holding other prompt-texts is only a wrapper.
      if (find(c, (k) => hasClass(k, 'prompt-text'))) {
        out.push(...blocksOf(c, base));
        continue;
      }
      const inline = tidyInline(inlineOf(c, base));
      const text = plainText(inline);
      if (!text || isTemplateText(text)) continue;
      const isHeading = classes(c).some((k) => HEADING_CLASSES.includes(k));
      if (isHeading && !inline.some((r) => 'br' in r)) {
        out.push({ kind: 'heading', level: 3, text: noDashes(text) });
      } else {
        out.push({ kind: 'text', inline });
      }
      continue;
    }
    out.push(...blocksOf(c, base));
  }
  return out;
}

function textOf(n: HtmlNode): string {
  return n.children.map((c) => (c.tag ? textOf(c) : (c.text ?? ''))).join('');
}

/**
 * Headings in a section: its first becomes the section's heading (h2), the
 * rest subheadings (h3). A rule next to nothing, or two in a row, is dropped.
 */
function tidySection(blocks: Block[]): Block[] {
  let seenH2 = false;
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.kind === 'heading') {
      out.push({ ...b, level: seenH2 ? 3 : 2 });
      seenH2 = true;
    } else if (b.kind === 'rule') {
      if (out.length && out[out.length - 1].kind !== 'rule') out.push(b);
    } else if (b.kind === 'columns') {
      out.push({
        ...b,
        columns: b.columns.map((col) =>
          col.map((k) => (k.kind === 'heading' ? { ...k, level: 3 } : k)),
        ),
      });
    } else out.push(b);
  }
  while (out.length && out[out.length - 1].kind === 'rule') out.pop();
  while (out.length && out[0].kind === 'rule') out.shift();
  return out;
}

/**
 * A Church Trac page's newsletter: its name, banner and sections. `base` is
 * the page's own address, for its relative images and links. Returns null when
 * the HTML is not a Church Trac page with a body (the page then falls back to
 * its "read it on Church Trac" line).
 */
export function readChurchTracPage(html: string, base: string): ChurchTracPage | null {
  const root = parseHtml(html);
  const body = find(root, (n) => hasClass(n, 'page-card-body'));
  if (!body) return null;
  const titleInput = find(root, (n) => n.tag === 'input' && n.attrs.id === 'title');
  const titleTag = find(root, (n) => n.tag === 'title');
  const title = squash(
    titleInput?.attrs.value ||
      decodeEntities(titleTag ? textOf(titleTag) : '').split(' | ')[0] ||
      '',
  ).trim();

  // The banner: only its published sections.
  let banner: string | null = null;
  const bannerBlocks: Block[] = [];
  const hero = find(root, (n) => hasClass(n, 'hero-container'));
  if (hero) {
    for (const s of findAll(hero, (n) => 'data-section-published' in n.attrs)) {
      if (s.attrs['data-section-published'] !== '1') continue;
      for (const b of blocksOf(s, base)) {
        if (b.kind === 'image' && !banner) banner = b.src;
        else if (b.kind !== 'image') bannerBlocks.push(b);
      }
    }
  }

  const sectionNodes = findAll(body, (n) => hasClass(n, 'page-card-section'));
  const sections = (sectionNodes.length ? sectionNodes : [body])
    .map((s) => tidySection(blocksOf(s, base)))
    .filter((blocks) => blocks.length > 0);
  if (!title && sections.length === 0) return null;
  return { title, banner, bannerBlocks: tidySection(bannerBlocks), sections };
}

/** Every word on the page, for the site search's excerpt and the tests. */
export function pageText(page: ChurchTracPage): string {
  const words = (b: Block): string =>
    b.kind === 'heading'
      ? b.text
      : b.kind === 'text'
        ? plainText(b.inline)
        : b.kind === 'button'
          ? b.label
          : b.kind === 'columns'
            ? b.columns.flat().map(words).join(' ')
            : '';
  return [page.title, ...page.bannerBlocks.map(words), ...page.sections.flat().map(words)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
