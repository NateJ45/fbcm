// scripts/lib/page-copy.mjs
//
// The copy helpers every plan-2b page module uses to turn the church's own
// words into Sanity portable text and CTA blocks.
//
// Three rules shape this file.
//
// 1. PLAIN FUNCTIONS, NO SANITY IMPORT. Everything here is data in, data out,
//    so `node --test scripts/lib/page-copy.test.mjs` runs on a fresh clone with
//    no project configured and no network.
//
// 2. STABLE KEYS. Every block takes an explicit key prefix and numbers from 1,
//    so building the same page twice produces byte-identical `_key`s. That is
//    what lets the runner compare a built document against the live one and
//    print `unchanged` instead of rewriting it (and churning every editor's
//    diff) on a second run.
//
// 3. THE CHURCH'S TEXT COMES FROM THE CAPTURE, NOT FROM MEMORY. `fromCapture()`
//    reads the Wix capture in scripts/data/pages/<slug>.txt and returns the
//    paragraphs between two anchor phrases, and it THROWS when a phrase is not
//    found. A page module that silently seeded an empty section would be the
//    worst outcome here: nobody reviews a band that is not there.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGES_DIR = resolve(ROOT, 'scripts', 'data', 'pages');

// ── Entities ────────────────────────────────────────────────────────────────
// The six-entity story is the same one src/lib/import-post.ts tells: the Wix
// capture double-escapes, so "&amp;" reaches us meaning "&". That file is the
// source of this map (src/lib/import-post.ts, NAMED_ENTITIES + decodeEntities);
// it is TypeScript and cannot be imported from an .mjs script, so the map is
// copied here rather than re-derived. Keep the two in step if either grows.
const NAMED_ENTITIES = {
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

/** "&amp;" -> "&", "&#39;" -> "'", "&#x2019;" -> "’". Unknown entities are left alone. */
export function decodeEntities(value) {
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    }
    if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

// ── Keys ────────────────────────────────────────────────────────────────────

/**
 * `keyer('p')` returns a function yielding 'p-1', 'p-2', ... A fresh keyer per
 * prefix per build, so the numbering restarts and the output is reproducible.
 * @param {string} prefix
 * @returns {() => string}
 */
export function keyer(prefix) {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
}

// ── Inline links ────────────────────────────────────────────────────────────
// A paragraph may carry a markdown-style link, `[the form](https://…)`, so a
// page module can keep a sentence exactly as the church wrote it, link and all,
// instead of splitting the sentence to get the link out of it.
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Split one paragraph's text into { children, markDefs } honouring inline
 * [text](href) links. Span keys hang off the block key so they are stable too.
 * @param {string} text
 * @param {string} blockKey
 */
function inline(text, blockKey) {
  const children = [];
  const markDefs = [];
  let cursor = 0;
  let spanN = 0;
  let linkN = 0;

  const push = (chunk, marks) => {
    if (!chunk) return;
    spanN += 1;
    children.push({
      _type: 'span',
      _key: `${blockKey}s${spanN}`,
      text: chunk,
      marks,
    });
  };

  LINK_RE.lastIndex = 0;
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    push(text.slice(cursor, m.index), []);
    linkN += 1;
    const markKey = `${blockKey}l${linkN}`;
    markDefs.push({ _type: 'link', _key: markKey, href: m[2] });
    push(m[1], [markKey]);
    cursor = m.index + m[0].length;
  }
  push(text.slice(cursor), []);

  // A block with no text at all still needs one span, or the Studio shows an
  // empty array where an editor expects a cursor.
  if (children.length === 0) push('', []);

  return { children, markDefs };
}

/**
 * One `normal` block carrying a single link. The convenience form of the
 * inline-link support above, for a sentence that IS a link.
 * @param {string} text
 * @param {string} href
 * @param {string} key
 */
export function link(text, href, key) {
  const markKey = `${key}l1`;
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [{ _type: 'link', _key: markKey, href }],
    children: [{ _type: 'span', _key: `${key}s1`, text, marks: [markKey] }],
  };
}

// ── Blocks ──────────────────────────────────────────────────────────────────

/**
 * Split `text` on blank lines into one `normal` block per paragraph.
 * Entities are decoded and each paragraph is trimmed; empties are dropped.
 * @param {string} text
 * @param {string} keyPrefix
 * @returns {object[]}
 */
export function paragraphs(text, keyPrefix) {
  const next = keyer(keyPrefix);
  return String(text)
    .split(/\n\s*\n/)
    .map((s) =>
      decodeEntities(s)
        .replace(/\s*\n\s*/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .map((para) => {
      const _key = next();
      const { children, markDefs } = inline(para, _key);
      return { _type: 'block', _key, style: 'normal', markDefs, children };
    });
}

/**
 * A heading block. `level` is 2, 3 or 4 (h2 is the section heading level the
 * page bands already use, so a heading INSIDE prose starts at h3 more often
 * than not; the caller decides).
 * @param {string} text
 * @param {number} level
 * @param {string} key
 */
export function heading(text, level, key) {
  const n = Number(level);
  if (![2, 3, 4].includes(n))
    throw new Error(`page-copy: heading level must be 2, 3 or 4, got ${level}`);
  const { children, markDefs } = inline(decodeEntities(text).trim(), key);
  return { _type: 'block', _key: key, style: `h${n}`, markDefs, children };
}

/**
 * Bullet list items. Each line becomes one `listItem: 'bullet'` block at
 * level 1, which is how the portable-text renderer draws a flat list.
 * @param {string[]} lines
 * @param {string} keyPrefix
 */
export function bullets(lines, keyPrefix) {
  const next = keyer(keyPrefix);
  return lines
    .map((s) => decodeEntities(String(s)).trim())
    .filter(Boolean)
    .map((line) => {
      const _key = next();
      const { children, markDefs } = inline(line, _key);
      return {
        _type: 'block',
        _key,
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        markDefs,
        children,
      };
    });
}

// ── The capture ─────────────────────────────────────────────────────────────

/**
 * The raw captured text of one Wix page.
 * @param {string} slug
 * @returns {string}
 */
export function textFile(slug) {
  const path = resolve(PAGES_DIR, `${slug}.txt`);
  try {
    return readFileSync(path, 'utf8');
  } catch {
    throw new Error(`page-copy: no capture at scripts/data/pages/${slug}.txt`);
  }
}

/**
 * The lines of the capture strictly between the first line containing `from`
 * and the first LATER line containing `to` (or the end of the file when `to`
 * is omitted). Throws, naming the slug and the phrase, when an anchor is
 * missing: a page module must fail loudly rather than seed an empty section.
 * @param {string} slug
 * @param {string} from
 * @param {string} [to]
 * @returns {string[]}
 */
export function linesBetween(slug, from, to) {
  const lines = textFile(slug).split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes(from));
  if (start === -1) {
    throw new Error(`page-copy: "${from}" is not in scripts/data/pages/${slug}.txt`);
  }
  let end = lines.length;
  if (to !== undefined && to !== null) {
    const rel = lines.slice(start + 1).findIndex((l) => l.includes(to));
    if (rel === -1) {
      throw new Error(
        `page-copy: "${to}" does not appear after "${from}" in scripts/data/pages/${slug}.txt`,
      );
    }
    end = start + 1 + rel;
  }
  return lines.slice(start + 1, end);
}

/**
 * The paragraphs between two anchor phrases in the capture, as blocks.
 * @param {string} slug
 * @param {{ from: string, to?: string, keyPrefix?: string }} opts
 */
export function fromCapture(slug, { from, to, keyPrefix } = {}) {
  if (!from) throw new Error(`page-copy: fromCapture("${slug}") needs a "from" phrase`);
  const body = linesBetween(slug, from, to).join('\n');
  return paragraphs(body, keyPrefix ?? slug);
}

// ── CTA blocks ──────────────────────────────────────────────────────────────
// Three builders, because ctaBlock has three shapes that matter here and the
// difference between them is not cosmetic.
//
// `internalLink` is a REFERENCE (src/sanity/schemaTypes/ctaBlock.ts), so it can
// point at a document and nothing else: it cannot carry "#building", and it
// cannot point at a route that has no document behind it. So:
//   - ctaInternal  -> a real document reference (page-<slug>, or homePage)
//   - ctaExternal  -> an off-site URL, opened in a new tab
//   - ctaAnchor    -> a same-site path, with or without a fragment, ridden in
//                     on externalUrl but NOT opened in a new tab
// ctaAnchor is why ctaBlock.externalUrl allows relative URIs (same commit).

let ctaN = 0;
function ctaKey() {
  ctaN += 1;
  return `cta-${ctaN}`;
}

/** Reset the CTA key counter. The runner calls this once per page build so the
 *  keys are per-page and stable across runs. */
export function resetCtaKeys() {
  ctaN = 0;
}

/**
 * A button pointing at another document on this site.
 * @param {string} label
 * @param {string} slug - 'home' for the home singleton, otherwise a page slug.
 */
export function ctaInternal(label, slug) {
  return {
    _type: 'ctaBlock',
    _key: ctaKey(),
    label,
    linkType: 'internal',
    internalLink: {
      _type: 'reference',
      _ref: slug === 'home' ? 'homePage' : `page-${slug}`,
      // WEAK on purpose. Pages link to pages that are seeded LATER in the run,
      // and Sanity rejects a STRONG reference to a document that does not exist
      // yet, so the first page to link forward would fail the whole write.
      _weak: true,
    },
  };
}

/**
 * A button pointing off this site. Opens in a new tab.
 * @param {string} label
 * @param {string} url
 */
export function ctaExternal(label, url) {
  return {
    _type: 'ctaBlock',
    _key: ctaKey(),
    label,
    linkType: 'external',
    externalUrl: url,
    openInNewTab: true,
  };
}

/**
 * A button pointing at a same-site path, with or without a fragment
 * ('/history#building', '/blog'). Same tab.
 * @param {string} label
 * @param {string} path
 */
export function ctaAnchor(label, path) {
  if (!path.startsWith('/')) {
    throw new Error(
      `page-copy: ctaAnchor("${label}") needs a path starting with "/", got "${path}"`,
    );
  }
  return {
    _type: 'ctaBlock',
    _key: ctaKey(),
    label,
    linkType: 'external',
    externalUrl: path,
    openInNewTab: false,
  };
}
