#!/usr/bin/env node
/**
 * capture-blog.mjs - Archival capture of the First Baptist Church Muncie (fbcmuncie.org)
 * Wix blog: all /post/* URLs listed in blog-posts-sitemap.xml.
 *
 * Scope (shared tree with another capture agent): writes ONLY into
 *   scripts/data/posts/   and   scripts/data/images/
 * plus scripts/data/blog-capture-report.md
 *
 * Verified before writing: Wix server-renders the post body into the HTML
 * (data-hook="post-description" holds the Ricos rich-content subtree), so the
 * fetched HTML is the source of truth. Metadata comes from <meta> / JSON-LD.
 *
 * Wix image rule: the original upload is everything BEFORE "/v1/".
 *   rendered: https://static.wixstatic.com/media/<id>/v1/fill/w_600,h_400,.../file.jpg
 *   original: https://static.wixstatic.com/media/<id>
 *
 * Re-runnable: a post already captured with non-empty bodyText is skipped;
 * an image already on disk with non-zero size is skipped.
 *
 * Usage:  node capture-blog.mjs [--limit N] [--only slug1,slug2] [--force]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

const SITEMAP = 'https://www.fbcmuncie.org/blog-posts-sitemap.xml';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const CONCURRENCY = 3;
const DELAY_MS = 300;

const args = process.argv.slice(2);
const getArg = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
const ONLY = getArg('--only')
  ? getArg('--only')
      .split(',')
      .map((s) => s.trim())
  : null;
const FORCE = args.includes('--force');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ fetch */

async function fetchText(url, tries = 3) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const body = res.ok ? await res.text() : '';
      if (!res.ok) {
        lastErr = { status: res.status, message: `HTTP ${res.status}` };
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { ok: false, status: res.status, text: '' };
        }
      } else {
        return { ok: true, status: res.status, text: body };
      }
    } catch (e) {
      lastErr = { status: 0, message: e.message };
    }
    await sleep(800 * (i + 1));
  }
  return { ok: false, status: lastErr?.status ?? 0, text: '', error: lastErr?.message };
}

async function fetchBuffer(url, tries = 3) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' } });
      if (!res.ok) {
        lastErr = { status: res.status, message: `HTTP ${res.status}` };
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { ok: false, status: res.status };
        }
      } else {
        const buf = Buffer.from(await res.arrayBuffer());
        return {
          ok: true,
          status: res.status,
          buf,
          contentType: res.headers.get('content-type') || '',
        };
      }
    } catch (e) {
      lastErr = { status: 0, message: e.message };
    }
    await sleep(800 * (i + 1));
  }
  return { ok: false, status: lastErr?.status ?? 0, error: lastErr?.message };
}

/* --------------------------------------------------------- tiny HTML tree */

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
  'param',
  'source',
  'track',
  'wbr',
]);

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  middot: '·',
  bull: '•',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  frac12: '½',
  frac14: '¼',
  eacute: 'é',
};

function decodeEntities(s) {
  if (!s) return '';
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, g) => {
    if (g[0] === '#') {
      const code =
        g[1] === 'x' || g[1] === 'X' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return m;
        }
      }
      return m;
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, g) ? ENTITIES[g] : m;
  });
}

function parseAttrs(str) {
  const attrs = {};
  for (const m of str.matchAll(
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g,
  )) {
    const name = m[1].toLowerCase();
    const val = m[3] ?? m[4] ?? m[5] ?? '';
    attrs[name] = decodeEntities(val);
  }
  return attrs;
}

/** Parse an HTML fragment into a lightweight tree. */
function parseHTML(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!\w[^>]*>|<\/\s*([a-zA-Z][a-zA-Z0-9-]*)\s*>|<([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let last = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m.index > last) {
      const text = html.slice(last, m.index);
      if (text) stack[stack.length - 1].children.push({ tag: '#text', text: decodeEntities(text) });
    }
    last = re.lastIndex;
    if (m[1]) {
      const name = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === name) {
          stack.length = i;
          break;
        }
      }
    } else if (m[2]) {
      const name = m[2].toLowerCase();
      const raw = m[3] || '';
      const node = { tag: name, attrs: parseAttrs(raw), children: [] };
      stack[stack.length - 1].children.push(node);
      const selfClosing = /\/\s*$/.test(raw);
      if (!VOID.has(name) && !selfClosing) stack.push(node);
      if (name === 'script' || name === 'style') {
        // consume raw text until matching close
        const close = new RegExp(`</\\s*${name}\\s*>`, 'i');
        const rest = html.slice(re.lastIndex);
        const cm = rest.match(close);
        const end = cm ? re.lastIndex + cm.index + cm[0].length : html.length;
        re.lastIndex = end;
        last = end;
        if (stack[stack.length - 1] === node) stack.pop();
      }
    }
  }
  if (last < html.length) {
    const text = html.slice(last);
    if (text) stack[stack.length - 1].children.push({ tag: '#text', text: decodeEntities(text) });
  }
  return root;
}

/* ------------------------------------------------------- body extraction */

/** Find the balanced outerHTML of the element whose open tag contains `marker`. */
function extractElementByMarker(html, marker) {
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const lt = html.lastIndexOf('<', idx);
  if (lt < 0) return null;
  const nameM = html.slice(lt).match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
  if (!nameM) return null;
  const tag = nameM[1].toLowerCase();
  const openEnd = html.indexOf('>', idx);
  if (openEnd < 0) return null;
  if (VOID.has(tag) || html[openEnd - 1] === '/') return html.slice(lt, openEnd + 1);
  const re = new RegExp(`<${tag}(?=[\\s/>])|<\\/${tag}\\s*>`, 'gi');
  re.lastIndex = openEnd + 1;
  let depth = 1;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') {
      depth--;
      if (depth === 0) return html.slice(lt, re.lastIndex);
    } else depth++;
  }
  return html.slice(lt);
}

const KEEP_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'blockquote',
  'em',
  'i',
  'strong',
  'b',
  'u',
  'br',
  'hr',
  'figure',
  'figcaption',
  'iframe',
  'video',
  'audio',
  'source',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'pre',
  'code',
  'sub',
  'sup',
]);
const DROP_ENTIRELY = new Set(['script', 'style', 'noscript', 'svg', 'button', 'nav', 'head']);
const KEEP_ATTRS = {
  a: ['href', 'title'],
  img: ['src', 'alt', 'title'],
  iframe: ['src', 'title'],
  video: ['src', 'poster'],
  audio: ['src'],
  source: ['src', 'type'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
};

/** Unwrap wrapper elements, drop chrome, strip presentational attributes. */
function cleanTree(node) {
  const out = [];
  for (const child of node.children || []) {
    if (child.tag === '#text') {
      if (child.text) out.push({ tag: '#text', text: child.text });
      continue;
    }
    if (DROP_ENTIRELY.has(child.tag)) continue;
    const kids = cleanTree(child);
    if (KEEP_TAGS.has(child.tag)) {
      const attrs = {};
      for (const a of KEEP_ATTRS[child.tag] || []) {
        if (child.attrs[a]) attrs[a] = child.attrs[a];
      }
      // Wix lazy images keep the real URL in data-* attributes
      if (child.tag === 'img' && !attrs.src) {
        attrs.src = child.attrs['data-src'] || child.attrs['data-pin-media'] || '';
      }
      if (child.tag === 'img' && !attrs.src) continue;
      if (VOID.has(child.tag)) out.push({ tag: child.tag, attrs, children: [] });
      else out.push({ tag: child.tag, attrs, children: kids });
    } else {
      out.push(...kids);
    }
  }
  return out;
}

const BLOCK = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'figure',
  'figcaption',
  'table',
  'tr',
  'hr',
  'pre',
  'iframe',
  'video',
]);

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function serialize(nodes, indent = 0) {
  let out = '';
  for (const n of nodes) {
    if (n.tag === '#text') {
      out += escHtml(n.text);
      continue;
    }
    const attrs = Object.entries(n.attrs || {})
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    if (VOID.has(n.tag)) {
      out += (BLOCK.has(n.tag) ? '\n' : '') + `<${n.tag}${attrs}>`;
    } else {
      const inner = serialize(n.children || [], indent + 1);
      const nl = BLOCK.has(n.tag) ? '\n' : '';
      out += `${nl}<${n.tag}${attrs}>${inner}</${n.tag}>`;
    }
  }
  return out;
}

function toText(nodes) {
  let out = '';
  for (const n of nodes) {
    if (n.tag === '#text') {
      out += n.text;
      continue;
    }
    if (n.tag === 'br') {
      out += '\n';
      continue;
    }
    if (n.tag === 'img' || n.tag === 'iframe') continue;
    const inner = toText(n.children || []);
    out += BLOCK.has(n.tag) ? `\n${inner}\n` : inner;
  }
  return out;
}

function normText(s) {
  return s
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const wordCount = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/* --------------------------------------------------------- markdown */

function mdInline(nodes, imgMap) {
  let out = '';
  for (const n of nodes) {
    if (n.tag === '#text') {
      out += n.text.replace(/([*_`])/g, '\\$1');
      continue;
    }
    const inner = mdInline(n.children || [], imgMap);
    switch (n.tag) {
      case 'strong':
      case 'b':
        out += inner.trim() ? `**${inner.trim()}**` : '';
        break;
      case 'em':
      case 'i':
        out += inner.trim() ? `*${inner.trim()}*` : '';
        break;
      case 'code':
        out += `\`${inner}\``;
        break;
      case 'a':
        out += n.attrs.href ? `[${inner.trim() || n.attrs.href}](${n.attrs.href})` : inner;
        break;
      case 'br':
        out += '  \n';
        break;
      case 'img': {
        const local = imgMap.get(n.attrs.src);
        out += `![${n.attrs.alt || ''}](${local ? '../images/' + local : n.attrs.src})`;
        break;
      }
      default:
        out += inner;
    }
  }
  return out;
}

function toMarkdown(nodes, imgMap, depth = 0) {
  const blocks = [];
  for (const n of nodes) {
    if (n.tag === '#text') {
      const t = n.text.trim();
      if (t) blocks.push(t);
      continue;
    }
    switch (n.tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const lvl = Number(n.tag[1]);
        const t = mdInline(n.children, imgMap).trim();
        if (t) blocks.push(`${'#'.repeat(Math.min(6, lvl + 1))} ${t}`);
        break;
      }
      case 'p': {
        const t = mdInline(n.children, imgMap).trim();
        if (t) blocks.push(t);
        break;
      }
      case 'blockquote': {
        const inner = toMarkdown(n.children, imgMap, depth + 1);
        if (inner.trim())
          blocks.push(
            inner
              .trim()
              .split('\n')
              .map((l) => `> ${l}`.trimEnd())
              .join('\n'),
          );
        break;
      }
      case 'ul':
      case 'ol': {
        const items = (n.children || []).filter((c) => c.tag === 'li');
        const lines = items.map((li, i) => {
          const t =
            mdInline(li.children, imgMap).trim() ||
            toMarkdown(li.children, imgMap, depth + 1).trim();
          const bullet = n.tag === 'ol' ? `${i + 1}.` : '-';
          return `${'  '.repeat(depth)}${bullet} ${t}`;
        });
        if (lines.length) blocks.push(lines.join('\n'));
        break;
      }
      case 'img': {
        const local = imgMap.get(n.attrs.src);
        blocks.push(`![${n.attrs.alt || ''}](${local ? '../images/' + local : n.attrs.src})`);
        break;
      }
      case 'iframe':
      case 'video': {
        if (n.attrs.src) blocks.push(`[embedded media: ${n.attrs.src}]`);
        break;
      }
      case 'figure':
      case 'figcaption':
        blocks.push(toMarkdown(n.children, imgMap, depth).trim());
        break;
      case 'hr':
        blocks.push('---');
        break;
      case 'table': {
        const rows = [];
        const collect = (nd) => {
          for (const c of nd.children || []) {
            if (c.tag === 'tr') rows.push(c);
            else collect(c);
          }
        };
        collect(n);
        const lines = rows.map(
          (r) =>
            '| ' +
            (r.children || [])
              .filter((c) => c.tag === 'td' || c.tag === 'th')
              .map((c) => mdInline(c.children, imgMap).trim().replace(/\|/g, '\\|'))
              .join(' | ') +
            ' |',
        );
        if (lines.length) {
          const cols = (rows[0].children || []).filter(
            (c) => c.tag === 'td' || c.tag === 'th',
          ).length;
          lines.splice(1, 0, '| ' + Array(cols).fill('---').join(' | ') + ' |');
          blocks.push(lines.join('\n'));
        }
        break;
      }
      default: {
        const t = toMarkdown(n.children || [], imgMap, depth).trim();
        if (t) blocks.push(t);
      }
    }
  }
  return blocks.filter(Boolean).join('\n\n');
}

/* ------------------------------------------------------------ Wix images */

function isWixMedia(url) {
  return /^https?:\/\/static\.wixstatic\.com\/media\//i.test(url);
}

/** The original upload is everything before "/v1/". */
function toFullRes(url) {
  if (!url) return url;
  let u = url.split('#')[0].split('?')[0];
  const i = u.indexOf('/v1/');
  if (i >= 0) u = u.slice(0, i);
  return u;
}

function mediaId(url) {
  const full = toFullRes(url);
  const m = full.match(/\/media\/([^/?#]+)/i);
  if (m) return decodeURIComponent(m[1]);
  return path.basename(full.split('?')[0]) || null;
}

function safeFileName(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 180);
}

const CHROME_PATTERNS = [
  /blank\.gif/i,
  /\/shapes\//i,
  /spacer/i,
  /1x1\./i,
  /static\.parastorage\.com/i,
  /\/favicon/i,
];

function isChrome(url) {
  if (!url) return true;
  if (url.startsWith('data:')) return true;
  return CHROME_PATTERNS.some((p) => p.test(url));
}

/* ------------------------------------------------------------ extraction */

function metaContent(head, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, 'i');
  const m = head.match(re);
  if (!m) return null;
  // NOTE: backreference \2 is required. A naive ["']...["'] truncates values
  // at the first apostrophe (e.g. content="There's no sin" -> "There").
  const c = m[0].match(/content=(["'])([\s\S]*?)\1/i);
  return c ? decodeEntities(c[2]) : null;
}

function parsePost(url, html) {
  const headEnd = html.indexOf('</head>');
  const head = headEnd > 0 ? html.slice(0, headEnd) : html.slice(0, 200000);

  let ld = null;
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const o of arr) {
        if (
          o &&
          (o['@type'] === 'BlogPosting' || o['@type'] === 'Article' || o['@type'] === 'NewsArticle')
        )
          ld = o;
      }
    } catch {
      /* ignore malformed */
    }
  }

  const title =
    metaContent(head, 'og:title') ||
    (ld && ld.headline) ||
    (() => {
      const el = extractElementByMarker(html, 'data-hook="post-title"');
      return el ? normText(toText(cleanTree(parseHTML(el)))) : null;
    })() ||
    null;

  let publishedDate =
    metaContent(head, 'article:published_time') || (ld && ld.datePublished) || null;
  let dateSource = publishedDate
    ? metaContent(head, 'article:published_time')
      ? 'meta'
      : 'jsonld'
    : null;
  if (!publishedDate) {
    const t = html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
    if (t) {
      publishedDate = t[1];
      dateSource = 'time-element';
    }
  }
  if (!publishedDate) {
    const t = html.match(/data-hook="time-ago"[^>]*>([^<]+)</i);
    if (t) {
      const d = new Date(t[1]);
      if (!isNaN(d)) {
        publishedDate = d.toISOString();
        dateSource = 'visible-text';
      }
    }
  }
  if (publishedDate) {
    const d = new Date(publishedDate);
    if (!isNaN(d)) publishedDate = d.toISOString();
    else {
      publishedDate = null;
      dateSource = null;
    }
  }

  const author =
    metaContent(head, 'article:author') ||
    (ld && ld.author && (ld.author.name || (Array.isArray(ld.author) && ld.author[0]?.name))) ||
    null;

  const excerpt = metaContent(head, 'og:description') || (ld && ld.description) || '';

  // Categories: scoped to the post's own list, NOT the site nav.
  const categories = [];
  const catEl = extractElementByMarker(html, 'aria-label="Post categories"');
  if (catEl) {
    for (const m of catEl.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)) {
      const t = normText(decodeEntities(m[1].replace(/<[^>]+>/g, '')));
      if (t) categories.push(t);
    }
  }

  const tags = [];
  const tagEl = extractElementByMarker(html, 'data-hook="tag-cloud-root"');
  if (tagEl) {
    for (const m of tagEl.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)) {
      const t = normText(decodeEntities(m[1].replace(/<[^>]+>/g, '')));
      if (t) tags.push(t.replace(/^#/, ''));
    }
  }

  // Body: the Ricos rich-content subtree.
  let bodyRaw = extractElementByMarker(html, 'data-hook="post-description"');
  let bodySource = 'post-description';
  if (!bodyRaw) {
    bodyRaw = extractElementByMarker(html, 'data-hook="post-content"');
    bodySource = 'post-content';
  }
  if (!bodyRaw) {
    bodyRaw = extractElementByMarker(html, 'data-rce-version');
    bodySource = 'data-rce-version';
  }
  if (!bodyRaw) bodySource = 'NONE';

  const tree = bodyRaw ? cleanTree(parseHTML(bodyRaw)) : [];

  // Walk the cleaned tree for images / links / embeds.
  const images = [];
  const links = [];
  const embeds = [];
  const seenImg = new Set();
  (function walk(nodes) {
    for (const n of nodes) {
      if (n.tag === 'img') {
        const src = n.attrs.src;
        if (src && !isChrome(src)) {
          const full = isWixMedia(src) ? toFullRes(src) : src;
          if (!seenImg.has(full)) {
            seenImg.add(full);
            images.push({
              originalUrl: src,
              fullResUrl: full,
              alt: n.attrs.alt || '',
              localFile: null,
            });
          }
        }
      } else if (n.tag === 'a') {
        const href = n.attrs.href;
        if (href && !href.startsWith('javascript:')) {
          links.push({
            href,
            text: normText(toText(n.children || [])),
            internal: /^https?:\/\/(www\.)?fbcmuncie\.org/i.test(href) || href.startsWith('/'),
          });
        }
      } else if (
        n.tag === 'iframe' ||
        n.tag === 'video' ||
        n.tag === 'audio' ||
        n.tag === 'source'
      ) {
        if (n.attrs.src) embeds.push(n.attrs.src);
      }
      if (n.children) walk(n.children);
    }
  })(tree);

  const ogImage = metaContent(head, 'og:image') || (ld && ld.image && (ld.image.url || ld.image));
  let coverImage = null;
  if (ogImage && !isChrome(ogImage)) {
    coverImage = {
      originalUrl: ogImage,
      fullResUrl: isWixMedia(ogImage) ? toFullRes(ogImage) : ogImage,
      localFile: null,
    };
  }

  return {
    title,
    publishedDate,
    dateSource,
    author,
    categories,
    tags,
    excerpt,
    coverImage,
    images,
    links,
    embeds,
    tree,
    bodySource,
  };
}

/* ------------------------------------------------------------ image fetch */

const imageStats = { downloaded: 0, skippedExisting: 0, bytes: 0, failures: [], fallbacks: [] };
const imageCache = new Map(); // fullResUrl -> localFile | null

async function downloadImage(fullResUrl, renderedUrl) {
  if (imageCache.has(fullResUrl)) return imageCache.get(fullResUrl);

  const id = mediaId(fullResUrl) || path.basename(fullResUrl);
  let name = safeFileName(id);
  if (!/\.[a-z0-9]{2,5}$/i.test(name)) name += '.jpg';
  const dest = path.join(IMAGES_DIR, name);

  // shared folder: skip if already present with non-zero size
  try {
    const st = await fs.stat(dest);
    if (st.size > 0) {
      imageStats.skippedExisting++;
      imageCache.set(fullResUrl, name);
      return name;
    }
  } catch {
    /* not present */
  }

  let res = await fetchBuffer(fullResUrl);
  let usedFallback = false;
  if (!res.ok || !res.buf || res.buf.length === 0) {
    // fall back to the largest derivative we have (the rendered URL)
    if (renderedUrl && renderedUrl !== fullResUrl) {
      const alt = await fetchBuffer(renderedUrl);
      if (alt.ok && alt.buf && alt.buf.length) {
        res = alt;
        usedFallback = true;
        imageStats.fallbacks.push({
          fullResUrl,
          usedUrl: renderedUrl,
          reason: `full-res HTTP ${res.status ?? 'err'}`,
        });
      }
    }
  }
  if (!res.ok || !res.buf || !res.buf.length) {
    imageStats.failures.push({ url: fullResUrl, status: res.status ?? 0, error: res.error || '' });
    imageCache.set(fullResUrl, null);
    return null;
  }
  if (usedFallback) {
    const ext = (res.contentType.match(/image\/(\w+)/) || [])[1];
    if (ext && !name.toLowerCase().endsWith(ext.toLowerCase())) {
      /* keep media-id name */
    }
  }
  await fs.writeFile(dest, res.buf);
  imageStats.downloaded++;
  imageStats.bytes += res.buf.length;
  imageCache.set(fullResUrl, name);
  return name;
}

/* ------------------------------------------------------------------ main */

function yamlEscape(s) {
  if (s === null || s === undefined) return '""';
  const str = String(s);
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildMarkdown(rec, imgMap, tree) {
  const fm = [
    '---',
    `title: ${yamlEscape(rec.title || rec.slug)}`,
    `date: ${rec.publishedDate ? yamlEscape(rec.publishedDate) : '""'}`,
    `author: ${yamlEscape(rec.author || '')}`,
    `categories: [${rec.categories.map(yamlEscape).join(', ')}]`,
    `url: ${yamlEscape(rec.url)}`,
    '---',
    '',
  ].join('\n');
  const parts = [fm, `# ${rec.title || rec.slug}`, ''];
  if (rec.coverImage && rec.coverImage.localFile) {
    parts.push(`![cover](../images/${rec.coverImage.localFile})`, '');
  }
  parts.push(toMarkdown(tree, imgMap));
  parts.push('');
  return parts.join('\n');
}

async function capturePost(url, report) {
  const slug = decodeURIComponent(url.split('/post/')[1] || '').replace(/\/$/, '');
  const jsonPath = path.join(POSTS_DIR, `${safeFileName(slug)}.json`);

  if (!FORCE) {
    try {
      const existing = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
      if (existing.bodyText && existing.bodyText.trim().length > 0) {
        report.records.push(existing);
        report.skipped++;
        return;
      }
    } catch {
      /* not captured yet */
    }
  }

  const res = await fetchText(url);
  if (!res.ok) {
    report.failures.push({ url, status: res.status, error: res.error || '' });
    const rec = {
      url,
      slug,
      httpStatus: res.status,
      fetchedAt: new Date().toISOString(),
      title: null,
      publishedDate: null,
      author: null,
      categories: [],
      tags: [],
      excerpt: '',
      coverImage: null,
      bodyHtml: '',
      bodyText: '',
      images: [],
      links: [],
      embeds: [],
      captureError: res.error || `HTTP ${res.status}`,
    };
    await fs.writeFile(jsonPath, JSON.stringify(rec, null, 2));
    report.records.push(rec);
    return;
  }

  const p = parsePost(url, res.text);

  // Download images (cover first, then body).
  const imgMap = new Map();
  if (p.coverImage) {
    p.coverImage.localFile = await downloadImage(p.coverImage.fullResUrl, p.coverImage.originalUrl);
    if (p.coverImage.localFile) imgMap.set(p.coverImage.originalUrl, p.coverImage.localFile);
  }
  for (const img of p.images) {
    img.localFile = await downloadImage(img.fullResUrl, img.originalUrl);
    if (img.localFile) imgMap.set(img.originalUrl, img.localFile);
  }

  const bodyHtml = serialize(p.tree).trim();
  const bodyText = normText(toText(p.tree));

  const rec = {
    url,
    slug,
    httpStatus: res.status,
    fetchedAt: new Date().toISOString(),
    title: p.title,
    publishedDate: p.publishedDate,
    dateSource: p.dateSource,
    author: p.author,
    categories: p.categories,
    tags: p.tags,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    bodyHtml,
    bodyText,
    images: p.images,
    links: p.links,
    embeds: [...new Set(p.embeds)],
    bodySource: p.bodySource,
    wordCount: wordCount(bodyText),
  };

  await fs.writeFile(jsonPath, JSON.stringify(rec, null, 2));
  await fs.writeFile(
    path.join(POSTS_DIR, `${safeFileName(slug)}.md`),
    buildMarkdown(rec, imgMap, p.tree),
  );
  report.records.push(rec);
  report.captured++;
}

async function runPool(items, worker, concurrency) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
      await sleep(DELAY_MS);
    }
  });
  await Promise.all(workers);
}

async function main() {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  console.log('Fetching sitemap:', SITEMAP);
  const sm = await fetchText(SITEMAP);
  if (!sm.ok) throw new Error(`Sitemap fetch failed: HTTP ${sm.status}`);
  let urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => decodeEntities(m[1].trim()))
    .filter((u) => u.includes('/post/'));
  urls = [...new Set(urls)];
  console.log(`Sitemap lists ${urls.length} post URLs`);

  if (ONLY) urls = urls.filter((u) => ONLY.some((s) => u.endsWith('/' + s)));
  if (LIMIT) urls = urls.slice(0, LIMIT);

  const report = { records: [], failures: [], captured: 0, skipped: 0, attempted: urls.length };

  let done = 0;
  await runPool(
    urls,
    async (url) => {
      try {
        await capturePost(url, report);
      } catch (e) {
        report.failures.push({ url, status: 0, error: e.message });
        console.error('ERROR', url, e.message);
      }
      done++;
      if (done % 10 === 0 || done === urls.length) console.log(`  ${done}/${urls.length}`);
    },
    CONCURRENCY,
  );

  // ---- index.json
  const index = report.records
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      publishedDate: r.publishedDate,
      author: r.author,
      categories: r.categories || [],
      wordCount: r.wordCount ?? wordCount(r.bodyText || ''),
      imageCount: (r.images || []).length + (r.coverImage ? 1 : 0),
      url: r.url,
    }))
    .sort((a, b) => {
      if (!a.publishedDate) return 1;
      if (!b.publishedDate) return -1;
      return b.publishedDate.localeCompare(a.publishedDate);
    });
  await fs.writeFile(path.join(POSTS_DIR, 'index.json'), JSON.stringify(index, null, 2));

  await writeReport(report, index, urls.length);
  console.log(
    '\nDone. captured=%d skipped=%d failures=%d',
    report.captured,
    report.skipped,
    report.failures.length,
  );
}

/* ---------------------------------------------------------------- report */

async function writeReport(report, index, attempted) {
  const recs = report.records;
  const withDate = recs.filter((r) => r.publishedDate);
  const withBody100 = recs.filter((r) => (r.wordCount ?? wordCount(r.bodyText || '')) > 100);
  const noBody = recs.filter((r) => !(r.bodyText || '').trim());
  const embedOnly = recs.filter(
    (r) => (r.embeds || []).length > 0 && (r.wordCount ?? wordCount(r.bodyText || '')) < 40,
  );
  const dates = withDate.map((r) => r.publishedDate).sort();
  const catCounts = {};
  for (const r of recs) for (const c of r.categories || []) catCounts[c] = (catCounts[c] || 0) + 1;
  const uncategorized = recs.filter((r) => !(r.categories || []).length).length;

  // duplicates by normalized title
  const byTitle = {};
  for (const r of recs) {
    const k = (r.title || '').trim().toLowerCase();
    if (!k) continue;
    (byTitle[k] = byTitle[k] || []).push(r.slug);
  }
  const dupes = Object.entries(byTitle).filter(([, v]) => v.length > 1);

  const newsletterish = recs.filter((r) => {
    const t = ((r.title || '') + ' ' + (r.excerpt || '')).toLowerCase();
    return /newsletter|weekly update|this week at|announcements|bulletin|e-?news|happenings/.test(
      t,
    );
  });

  const sorted = [...recs]
    .map((r) => ({
      t: r.title || r.slug,
      w: r.wordCount ?? wordCount(r.bodyText || ''),
      s: r.slug,
    }))
    .sort((a, b) => b.w - a.w);
  const longest = sorted.slice(0, 5);
  const shortest = [...sorted].reverse().slice(0, 5);

  // Bytes on disk. Two figures: the whole shared folder, and the subset this
  // blog capture actually references (stable across re-runs, unlike the
  // per-run download counters).
  let diskBytes = 0,
    diskCount = 0;
  try {
    for (const f of await fs.readdir(IMAGES_DIR)) {
      const st = await fs.stat(path.join(IMAGES_DIR, f));
      if (st.isFile()) {
        diskBytes += st.size;
        diskCount++;
      }
    }
  } catch {
    /* ignore */
  }

  const referenced = new Set();
  for (const r of recs) {
    if (r.coverImage?.localFile) referenced.add(r.coverImage.localFile);
    for (const im of r.images || []) if (im.localFile) referenced.add(im.localFile);
  }
  let blogBytes = 0,
    blogMissing = 0;
  for (const f of referenced) {
    try {
      const st = await fs.stat(path.join(IMAGES_DIR, f));
      blogBytes += st.size;
    } catch {
      blogMissing++;
    }
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(2);
  const L = [];
  L.push('# FBC Muncie blog capture report', '');
  L.push(`Generated: ${new Date().toISOString()}`);
  L.push(`Source: ${SITEMAP}`, '');
  L.push('## Counts', '');
  L.push(`- Posts listed in sitemap / attempted: **${attempted}**`);
  L.push(`- Post records on disk: **${recs.length}**`);
  L.push(`- Captured this run: ${report.captured}; skipped (already captured): ${report.skipped}`);
  L.push(
    `- Posts with a publishedDate: **${withDate.length} / ${recs.length}**  (undated: ${recs.length - withDate.length})`,
  );
  L.push(`- Posts with a body over 100 words: **${withBody100.length}**`);
  L.push(`- Posts with NO body text: **${noBody.length}**`);
  L.push(`- Distinct images referenced by these posts: **${referenced.size}**`);
  L.push(
    `- Total bytes of those images on disk: **${blogBytes.toLocaleString()} bytes (${mb(blogBytes)} MB)**`,
  );
  if (blogMissing) L.push(`- Referenced images MISSING from disk: **${blogMissing}**`);
  L.push(
    `- This run: downloaded ${imageStats.downloaded}, skipped ${imageStats.skippedExisting} already present, ${imageStats.bytes.toLocaleString()} bytes transferred`,
  );
  L.push(
    `- Whole shared images/ folder (blog + the site-pages capture): ${diskCount} files, ${diskBytes.toLocaleString()} bytes (${mb(diskBytes)} MB)`,
  );
  L.push('');
  L.push('## Date range', '');
  if (dates.length) {
    L.push(`- Earliest post: ${dates[0]}`);
    L.push(`- Latest post: ${dates[dates.length - 1]}`);
  } else L.push('- No dated posts.');
  L.push('');
  L.push('## Category distribution', '');
  const catRows = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  for (const [c, n] of catRows) L.push(`- ${c}: ${n}`);
  L.push(`- (no category): ${uncategorized}`);
  L.push('');
  L.push('## Failures', '');
  if (!report.failures.length && !imageStats.failures.length) L.push('None.');
  if (report.failures.length) {
    L.push('### Post URLs', '');
    for (const f of report.failures)
      L.push(`- ${f.url} — HTTP ${f.status}${f.error ? ` (${f.error})` : ''}`);
    L.push('');
  }
  if (imageStats.failures.length) {
    L.push('### Image URLs', '');
    for (const f of imageStats.failures)
      L.push(`- ${f.url} — HTTP ${f.status}${f.error ? ` (${f.error})` : ''}`);
    L.push('');
  }
  L.push('## Full-resolution fallbacks', '');
  if (!imageStats.fallbacks.length)
    L.push('None — every image was fetched at its original (pre-/v1/) upload URL.');
  for (const f of imageStats.fallbacks)
    L.push(`- ${f.fullResUrl} failed (${f.reason}); saved derivative ${f.usedUrl}`);
  L.push('');
  L.push('## 5 longest posts', '');
  for (const p of longest) L.push(`- ${p.w} words — ${p.t} (${p.s})`);
  L.push('');
  L.push('## 5 shortest posts', '');
  for (const p of shortest) L.push(`- ${p.w} words — ${p.t} (${p.s})`);
  L.push('');
  L.push('## Things a rebuild needs to know', '');
  L.push(`### Posts with no body text (${noBody.length})`);
  if (!noBody.length) L.push('None.');
  for (const r of noBody)
    L.push(`- ${r.slug} — ${r.title || '(no title)'} [bodySource=${r.bodySource || 'n/a'}]`);
  L.push('');
  L.push(`### Posts that are essentially just an embed (${embedOnly.length})`);
  if (!embedOnly.length) L.push('None.');
  for (const r of embedOnly)
    L.push(`- ${r.slug} — ${r.wordCount} words, embeds: ${(r.embeds || []).join(', ')}`);
  L.push('');
  L.push(`### Duplicate titles (${dupes.length})`);
  if (!dupes.length) L.push('None.');
  for (const [t, slugs] of dupes) L.push(`- "${t}" → ${slugs.join(', ')}`);
  L.push('');
  const noCover = recs.filter((r) => !r.coverImage);
  L.push(`### Posts with no cover image (${noCover.length})`);
  if (!noCover.length) L.push('None.');
  for (const r of noCover)
    L.push(
      `- ${r.slug} — ${r.title} (verified: the live page emits no og:image and no hero <img>)`,
    );
  L.push('');

  const mediaEmbeds = [];
  for (const r of recs) for (const e of r.embeds || []) mediaEmbeds.push({ slug: r.slug, src: e });
  L.push(`### Embedded media NOT downloaded (${mediaEmbeds.length})`);
  if (!mediaEmbeds.length) L.push('None.');
  else
    L.push(
      'This capture downloads images only. These embed sources are recorded in the post JSON but the media files themselves are still only on Wix — fetch them before the site is torn down:',
    );
  for (const e of mediaEmbeds) L.push(`- ${e.slug} → ${e.src}`);
  L.push('');

  L.push(`### Newsletter-style posts rather than articles (${newsletterish.length})`);
  if (!newsletterish.length) L.push('None detected by title/excerpt heuristic.');
  for (const r of newsletterish) L.push(`- ${r.slug} — ${r.title}`);
  L.push('');
  L.push('### Notes', '');
  L.push(
    '- Wix server-renders post bodies; the body was taken from the Ricos rich-content subtree (`data-hook="post-description"`), stripped of Wix wrapper divs/spans and presentational attributes.',
  );
  L.push(
    '- Dates come from `<meta property="article:published_time">` (Wix emits a full ISO timestamp), cross-checked against JSON-LD `datePublished`.',
  );
  L.push(
    '- Every image was requested at its original upload URL: everything before `/v1/` in the rendered Wix URL. Local files are named after the Wix media id.',
  );
  L.push(
    '- `images/` is shared with the site-pages/team capture; existing non-zero files were left untouched.',
  );

  await fs.writeFile(path.join(DATA_DIR, 'blog-capture-report.md'), L.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
