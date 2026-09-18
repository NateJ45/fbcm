/**
 * capture-pages.mjs
 *
 * Archival capture of the First Baptist Church Muncie Wix site
 * (https://www.fbcmuncie.org/) before it is replaced.
 *
 * Scope: the three sitemaps below (regular pages, staff/team profiles, blog
 * categories). Blog POSTS (/post/*) are deliberately NOT crawled here - they
 * are captured by a separate process.
 *
 * Outputs (all under ./data/):
 *   pages/<slug>.json    per-page structured capture
 *   pages/<slug>.txt     the same bodyText as plain text
 *   nav.json             header nav tree + footer links
 *   outbound-links.json  every non-fbcmuncie.org link, by frequency
 *   images/              every content image at ORIGINAL upload resolution
 *   capture-report.md    counts, failures, caveats
 *
 * Re-runnable: images that already exist locally with non-zero size are skipped.
 *
 * Usage:  node capture-pages.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.join(__dirname, 'data');
const PAGES_DIR = path.join(ROOT, 'pages');
const IMAGES_DIR = path.join(ROOT, 'images');
const FILES_DIR = path.join(ROOT, 'files');

const ORIGIN = 'https://www.fbcmuncie.org';
const SITE_HOSTS = new Set(['fbcmuncie.org', 'www.fbcmuncie.org']);

const SITEMAPS = [
  { name: 'pages', url: `${ORIGIN}/pages-sitemap.xml` },
  {
    name: 'team',
    url: `${ORIGIN}/dynamic-team_p_99e0dfbf_f6fd_4053_bc94_6c23dc39c9b1_0_5000-sitemap.xml`,
  },
  { name: 'blog-categories', url: `${ORIGIN}/blog-categories-sitemap.xml` },
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DELAY_MS = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wix's shared stock-media account prefix - social icons, UI chrome. */
const WIX_CHROME_PREFIXES = ['11062b_'];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function ensureDirs() {
  for (const d of [ROOT, PAGES_DIR, IMAGES_DIR, FILES_DIR]) fs.mkdirSync(d, { recursive: true });
}

async function fetchText(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml' },
        redirect: 'follow',
      });
      const body = await res.text();
      return { status: res.status, body, finalUrl: res.url };
    } catch (e) {
      lastErr = e;
      await sleep(1000 * (i + 1));
    }
  }
  return { status: 0, body: '', error: String(lastErr) };
}

async function fetchBuffer(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) return { status: res.status, buf: null };
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, buf };
  } catch (e) {
    return { status: 0, buf: null, error: String(e) };
  }
}

function slugFor(url) {
  const u = new URL(url);
  const p = u.pathname.replace(/^\/+|\/+$/g, '');
  if (!p) return 'home';
  return p.replace(/[^A-Za-z0-9._-]+/g, '-').toLowerCase();
}

/** Collapse Wix's zero-width padding and NBSPs, keep real newlines. */
function cleanText(s) {
  return (s || '')
    .replace(/\u200b/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim();
}

/** Text of an element with <br> turned into newlines. */
function elText(el) {
  const clone = parse(el.outerHTML.replace(/<br\s*\/?>/gi, '\n'));
  return cleanText(clone.structuredText || clone.text);
}

// ---------------------------------------------------------------------------
// image URL handling
// ---------------------------------------------------------------------------

/**
 * Wix rendered:  https://static.wixstatic.com/media/<id>/v1/fill/w_600,.../file.jpg
 * Original upload is everything BEFORE "/v1/".
 */
function toOriginal(rawUrl) {
  let u = rawUrl.trim();
  if (u.startsWith('//')) u = 'https:' + u;
  const i = u.indexOf('/v1/');
  if (i !== -1) u = u.slice(0, i);
  // strip any query
  u = u.split('?')[0];
  // Wix sometimes URL-encodes the tilde
  u = u.replace(/%7E/gi, '~');
  return u;
}

function mediaIdOf(originalUrl) {
  const m = originalUrl.match(/\/media\/([^/?#]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function isWixChrome(originalUrl) {
  const id = mediaIdOf(originalUrl);
  if (!id) return true;
  if (/blank\.gif$/i.test(id)) return true;
  if (WIX_CHROME_PREFIXES.some((p) => id.startsWith(p))) return true;
  return false;
}

function localNameFor(originalUrl) {
  const id = mediaIdOf(originalUrl) || 'unknown';
  return id.replace(/~/g, '_tilde_').replace(/[^A-Za-z0-9._-]+/g, '_');
}

/** Pull every candidate image URL out of a fragment, with its alt + region. */
function collectImages(scope, region, out) {
  const push = (raw, alt) => {
    if (!raw) return;
    if (!/static\.wixstatic\.com\/media\//.test(raw)) return;
    const original = toOriginal(raw);
    if (isWixChrome(original)) return;
    const key = original;
    if (!out.has(key)) {
      out.set(key, {
        originalUrl: original,
        fullResUrl: original,
        renderedUrl: raw.startsWith('//') ? 'https:' + raw : raw,
        alt: alt || '',
        region,
        localFile: localNameFor(original),
      });
    } else if (alt && !out.get(key).alt) {
      out.get(key).alt = alt;
    }
  };

  for (const img of scope.querySelectorAll('img')) {
    const alt = img.getAttribute('alt') || '';
    const src = img.getAttribute('src');
    if (src) push(src, alt);
    const srcset = img.getAttribute('srcset') || img.getAttribute('srcSet');
    if (srcset) {
      for (const part of srcset.split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (u) push(u, alt);
      }
    }
  }
  // background-image in inline styles
  for (const el of scope.querySelectorAll('[style]')) {
    const st = el.getAttribute('style') || '';
    for (const m of st.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) push(m[2], '');
  }
  // Wix <wow-image> data attributes
  for (const el of scope.querySelectorAll('wow-image')) {
    const d = el.getAttribute('data-image-info');
    if (d) {
      for (const m of d.matchAll(/([A-Za-z0-9_]+_[0-9a-f]{20,}[~%][^"\\,\s]*)/g)) {
        push('https://static.wixstatic.com/media/' + m[1], '');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// text extraction
// ---------------------------------------------------------------------------

const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,dt,dd,td,th,pre';
const BLOCK_TAGS = new Set(BLOCK_SELECTOR.split(',').map((s) => s.toUpperCase()));

function extractBodyText(main) {
  const lines = [];
  const seenNode = new Set();

  const blocks = main.querySelectorAll(BLOCK_SELECTOR);
  for (const b of blocks) {
    // only leaf blocks - if it contains another block, its children will be emitted
    if (b.querySelectorAll(BLOCK_SELECTOR).length > 0) continue;
    if (seenNode.has(b)) continue;
    seenNode.add(b);
    const t = elText(b);
    if (t) lines.push(t);
  }

  // Wix buttons are <a> with a stylable root, not inside <p>
  for (const a of main.querySelectorAll('[data-semantic-classname="button"] a, a.wixui-button')) {
    const label = cleanText(a.getAttribute('aria-label') || a.text);
    if (!label) continue;
    const href = a.getAttribute('href') || '';
    lines.push(`[Button] ${label}${href ? ` -> ${href}` : ''}`);
  }

  // collapse consecutive duplicates (Wix renders mobile + desktop copies)
  const out = [];
  for (const l of lines) {
    if (out.length && out[out.length - 1] === l) continue;
    out.push(l);
  }
  // global dedupe while preserving first-occurrence order (mobile duplicates
  // of whole sections are common on Wix)
  const seen = new Set();
  const final = [];
  for (const l of out) {
    const k = l.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    final.push(l);
  }
  return final.join('\n\n');
}

function extractHeadings(main) {
  const res = [];
  for (const el of main.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    const t = elText(el);
    if (t) res.push({ level: Number(el.tagName.slice(1)), text: t });
  }
  return res;
}

// ---------------------------------------------------------------------------
// links
// ---------------------------------------------------------------------------

function normHref(href, pageUrl) {
  if (!href) return null;
  const h = href.trim();
  if (!h || h === '#') return null;
  if (/^(javascript:|data:)/i.test(h)) return null;
  try {
    return new URL(h, pageUrl).toString();
  } catch {
    return h;
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function collectLinks(scope, region, pageUrl, out) {
  for (const a of scope.querySelectorAll('a[href]')) {
    const href = normHref(a.getAttribute('href'), pageUrl);
    if (!href) continue;
    const text = cleanText(a.getAttribute('aria-label') || a.text) || '';
    const host = hostOf(href);
    const internal = host === null ? true : SITE_HOSTS.has(host);
    out.push({ href, text, internal, region });
  }
}

// ---------------------------------------------------------------------------
// embeds
// ---------------------------------------------------------------------------

function collectEmbeds(doc, html) {
  const embeds = [];
  const seen = new Set();
  const add = (type, src, note) => {
    if (!src) return;
    const k = type + '|' + src;
    if (seen.has(k)) return;
    seen.add(k);
    embeds.push(note ? { type, src, note } : { type, src });
  };

  for (const f of doc.querySelectorAll('iframe')) {
    add(
      'iframe',
      f.getAttribute('src') || f.getAttribute('data-src'),
      f.getAttribute('title') || undefined,
    );
  }
  for (const s of doc.querySelectorAll('script[src]')) {
    const src = s.getAttribute('src');
    const h = hostOf(normHref(src, ORIGIN) || '');
    if (!h) continue;
    if (/wixstatic|parastorage|wix\.com|fbcmuncie\.org/.test(h)) continue;
    add('script', src);
  }
  // Wix HTML-embed widgets are served from <site>.filesusr.com/html/<hash>.html
  for (const m of html.matchAll(
    /https?:\\?\/\\?\/[a-z0-9-]+\.filesusr\.com\\?\/html\\?\/[^"'\s\\]+/gi,
  )) {
    add('wix-html-embed', m[0].replace(/\\\//g, '/'));
  }
  // video / map / form providers referenced anywhere in the served markup
  const providers = [
    [/https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[A-Za-z0-9_-]+/g, 'youtube-embed'],
    [/https?:\/\/player\.vimeo\.com\/video\/[0-9]+/g, 'vimeo-embed'],
    [/https?:\/\/(?:www\.)?google\.com\/maps\/embed[^"'\s\\]*/g, 'google-maps-embed'],
    [/https?:\/\/[a-z0-9.-]*churchcenter\.com\/[^"'\s\\<>]*/gi, 'church-center'],
    [/https?:\/\/[a-z0-9.-]*planningcenteronline\.com\/[^"'\s\\<>]*/gi, 'planning-center'],
    [/https?:\/\/[a-z0-9.-]*churchtrac\.com\/[^"'\s\\<>]*/gi, 'church-trac'],
  ];
  for (const [re, type] of providers) {
    for (const m of html.matchAll(re)) add(type, m[0].replace(/&amp;/g, '&'));
  }
  return embeds;
}

// ---------------------------------------------------------------------------
// nav extraction (Wix dropdown menu in SITE_HEADER)
// ---------------------------------------------------------------------------

function extractNav(header, pageUrl) {
  const nav = header.querySelector('nav');
  if (!nav) return [];
  const topUl = nav.querySelector('ul');
  if (!topUl) return [];

  const items = [];
  for (const li of topUl.childNodes.filter((n) => n.tagName === 'LI')) {
    // the label is either an <a> (direct link) or a role=button div
    const directLink =
      li.childNodes.find((n) => n.tagName === 'A' && n.getAttribute && n.getAttribute('href')) ||
      null;
    let label = '';
    let href = null;

    if (directLink) {
      label = cleanText(directLink.text);
      href = normHref(directLink.getAttribute('href'), pageUrl);
    } else {
      const lbl = li.querySelector('p[id$="label"]') || li.querySelector('[role="button"] p');
      label = lbl ? cleanText(lbl.text) : '';
    }

    const children = [];
    const subUl = li.querySelectorAll('ul');
    for (const ul of subUl) {
      for (const sli of ul.querySelectorAll('li')) {
        const a = sli.querySelector('a[href]');
        if (!a) continue;
        const ctext = cleanText(a.text);
        const chref = normHref(a.getAttribute('href'), pageUrl);
        if (!ctext && !chref) continue;
        if (children.some((c) => c.href === chref && c.label === ctext)) continue;
        children.push({ label: ctext, href: chref, children: [] });
      }
    }
    if (!label && !href && children.length === 0) continue;
    items.push({ label, href, children });
  }
  return items;
}

function extractFooterLinks(footer, pageUrl) {
  const out = [];
  const seen = new Set();
  for (const a of footer.querySelectorAll('a[href]')) {
    const href = normHref(a.getAttribute('href'), pageUrl);
    if (!href) continue;
    const label = cleanText(a.getAttribute('aria-label') || a.text) || '';
    const k = label + '|' + href;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ label, href, external: !SITE_HOSTS.has(hostOf(href) || '') });
  }
  return out;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function loadSitemaps() {
  const groups = [];
  const failures = [];
  for (const sm of SITEMAPS) {
    const r = await fetchText(sm.url);
    if (r.status !== 200) {
      failures.push({ url: sm.url, status: r.status, note: 'sitemap fetch failed' });
      groups.push({ name: sm.name, url: sm.url, urls: [] });
      continue;
    }
    const urls = [...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      m[1].trim().replace(/&amp;/g, '&'),
    );
    groups.push({ name: sm.name, url: sm.url, urls });
    await sleep(DELAY_MS);
  }
  return { groups, failures };
}

async function capturePage(url, category) {
  const r = await fetchText(url);
  const fetchedAt = new Date().toISOString();
  const slug = slugFor(url);

  if (r.status !== 200 || !r.body) {
    return {
      record: {
        url,
        slug,
        category,
        httpStatus: r.status,
        fetchedAt,
        error: r.error || 'non-200',
        title: null,
        metaDescription: null,
        ogImage: null,
        canonical: null,
        h1: null,
        headings: [],
        bodyText: '',
        images: [],
        links: [],
        embeds: [],
      },
      html: '',
      doc: null,
    };
  }

  const html = r.body;
  const doc = parse(html, {
    blockTextElements: { script: false, noscript: false, style: false, pre: true },
  });

  // head metadata
  const titleEl = doc.querySelector('title');
  const title = titleEl ? cleanText(titleEl.text) : null;
  const md = doc.querySelector('meta[name="description"]');
  const metaDescription = md ? cleanText(md.getAttribute('content') || '') : null;
  const og = doc.querySelector('meta[property="og:image"]');
  const ogImage = og ? og.getAttribute('content') : null;
  const can = doc.querySelector('link[rel="canonical"]');
  const canonical = can ? can.getAttribute('href') : null;

  const header = doc.querySelector('#SITE_HEADER');
  const footer = doc.querySelector('#SITE_FOOTER');
  const main = doc.querySelector('#PAGES_CONTAINER') || doc.querySelector('main') || doc;

  // strip non-content from main before text extraction
  for (const el of main.querySelectorAll('script,style,noscript')) el.remove();

  const headings = extractHeadings(main);
  const h1el = main.querySelector('h1');
  const h1 = h1el ? elText(h1el) : null;
  const bodyText = extractBodyText(main);

  const imgMap = new Map();
  collectImages(main, 'main', imgMap);
  if (header) collectImages(header, 'header', imgMap);
  if (footer) collectImages(footer, 'footer', imgMap);
  if (ogImage && /static\.wixstatic\.com\/media\//.test(ogImage)) {
    collectImages(parse(`<img src="${ogImage}" alt="og:image">`), 'og', imgMap);
  }

  const links = [];
  collectLinks(main, 'main', url, links);
  if (header) collectLinks(header, 'header', url, links);
  if (footer) collectLinks(footer, 'footer', url, links);
  // dedupe links by href+text+region
  const lseen = new Set();
  const dedupLinks = links.filter((l) => {
    const k = `${l.region}|${l.href}|${l.text}`;
    if (lseen.has(k)) return false;
    lseen.add(k);
    return true;
  });

  const embeds = collectEmbeds(doc, html);

  return {
    record: {
      url,
      slug,
      category,
      httpStatus: r.status,
      fetchedAt,
      title,
      metaDescription,
      ogImage,
      canonical,
      h1,
      headings,
      bodyText,
      images: [...imgMap.values()],
      links: dedupLinks,
      embeds,
    },
    html,
    doc,
    header,
    footer,
  };
}

async function main() {
  ensureDirs();
  console.log('Loading sitemaps...');
  const { groups, failures } = await loadSitemaps();

  const seenUrl = new Set();
  const targets = [];
  for (const g of groups) {
    for (const u of g.urls) {
      const norm = u.replace(/\/$/, '') || u;
      if (seenUrl.has(norm)) continue;
      seenUrl.add(norm);
      targets.push({ url: u, category: g.name });
    }
  }
  const sitemapCounts = groups.map((g) => ({ name: g.name, url: g.url, count: g.urls.length }));
  console.log(
    `Sitemaps: ${sitemapCounts.map((s) => `${s.name}=${s.count}`).join(', ')}; ${targets.length} unique URLs`,
  );

  const records = [];
  let navResult = null;
  let footerResult = null;
  let navSource = null;

  for (let i = 0; i < targets.length; i++) {
    const { url, category } = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] ${url} ... `);
    const { record, header, footer } = await capturePage(url, category);
    console.log(
      `${record.httpStatus} (${record.bodyText.split(/\s+/).filter(Boolean).length} words)`,
    );

    fs.writeFileSync(
      path.join(PAGES_DIR, `${record.slug}.json`),
      JSON.stringify(record, null, 2),
      'utf8',
    );
    fs.writeFileSync(path.join(PAGES_DIR, `${record.slug}.txt`), record.bodyText, 'utf8');
    records.push(record);

    if (!navResult && header) {
      const n = extractNav(header, url);
      if (n.length) {
        navResult = n;
        navSource = url;
      }
    }
    if (!footerResult && footer) {
      const f = extractFooterLinks(footer, url);
      if (f.length) footerResult = f;
    }

    await sleep(DELAY_MS);
  }

  // ---- nav.json ----
  fs.writeFileSync(
    path.join(ROOT, 'nav.json'),
    JSON.stringify(
      {
        extractedFrom: navSource,
        extractedAt: new Date().toISOString(),
        note: 'Header nav tree as rendered server-side by Wix into #SITE_HEADER. Footer links captured separately from #SITE_FOOTER. The trailing "More..." item is Wix\'s responsive overflow container - it holds no items of its own in the served HTML; at narrow viewports the browser moves overflowing top-level items into it.',
        nav: navResult || [],
        footerLinks: footerResult || [],
      },
      null,
      2,
    ),
    'utf8',
  );

  // ---- outbound-links.json ----
  const outbound = new Map();
  for (const rec of records) {
    for (const l of rec.links) {
      if (l.internal) continue;
      const host = hostOf(l.href);
      if (!host || SITE_HOSTS.has(host)) continue;
      if (!outbound.has(l.href)) {
        outbound.set(l.href, { href: l.href, host, foundOn: [], linkText: [] });
      }
      const e = outbound.get(l.href);
      if (!e.foundOn.includes(rec.url)) e.foundOn.push(rec.url);
      if (l.text && !e.linkText.includes(l.text)) e.linkText.push(l.text);
    }
  }
  const outboundArr = [...outbound.values()].sort(
    (a, b) => b.foundOn.length - a.foundOn.length || a.href.localeCompare(b.href),
  );
  const hostCounts = new Map();
  for (const e of outboundArr) {
    const c = hostCounts.get(e.host) || { host: e.host, urlCount: 0, pageHits: 0 };
    c.urlCount += 1;
    c.pageHits += e.foundOn.length;
    hostCounts.set(e.host, c);
  }
  const hostsArr = [...hostCounts.values()].sort(
    (a, b) => b.pageHits - a.pageHits || b.urlCount - a.urlCount,
  );
  fs.writeFileSync(
    path.join(ROOT, 'outbound-links.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), hosts: hostsArr, links: outboundArr },
      null,
      2,
    ),
    'utf8',
  );

  // ---- images ----
  const allImages = new Map();
  for (const rec of records) {
    for (const im of rec.images) {
      if (!allImages.has(im.originalUrl)) allImages.set(im.originalUrl, { ...im, usedOn: [] });
      allImages.get(im.originalUrl).usedOn.push(rec.url);
    }
  }
  console.log(`\nDownloading ${allImages.size} unique images...`);
  const imageResults = [];
  let idx = 0;
  for (const im of allImages.values()) {
    idx++;
    const dest = path.join(IMAGES_DIR, im.localFile);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      imageResults.push({
        ...im,
        status: 'cached',
        bytes: fs.statSync(dest).size,
        source: 'original',
      });
      continue;
    }
    const { status, buf: initialBuf } = await fetchBuffer(im.originalUrl);
    let buf = initialBuf;
    let source = 'original';
    if (!buf && /\.svg$/i.test(im.originalUrl)) {
      // Wix serves SVG originals from /shapes/, not /media/
      const shapes = im.originalUrl.replace('/media/', '/shapes/');
      const f = await fetchBuffer(shapes);
      if (f.buf) {
        buf = f.buf;
        source = 'original (via /shapes/ path)';
      }
    }
    if (!buf) {
      // fall back to the largest derivative we can build
      const fallback = `${im.originalUrl}/v1/fit/w_4000,h_4000,al_c,q_95/file.jpg`;
      const f2 = await fetchBuffer(fallback);
      if (f2.buf) {
        buf = f2.buf;
        source = `derivative-fallback (original returned ${status})`;
      } else if (im.renderedUrl) {
        const f3 = await fetchBuffer(im.renderedUrl);
        if (f3.buf) {
          buf = f3.buf;
          source = `rendered-derivative-fallback (original returned ${status})`;
        }
      }
    }
    if (buf) {
      fs.writeFileSync(dest, buf);
      imageResults.push({ ...im, status: 'ok', bytes: buf.length, source });
      process.stdout.write(
        `  [${idx}/${allImages.size}] ${im.localFile} ${buf.length}B ${source === 'original' ? '' : '(' + source + ')'}\n`,
      );
    } else {
      imageResults.push({ ...im, status: 'failed', httpStatus: status, bytes: 0, source: 'none' });
      process.stdout.write(`  [${idx}/${allImages.size}] FAILED ${im.originalUrl} (${status})\n`);
    }
    await sleep(150);
  }
  fs.writeFileSync(
    path.join(ROOT, 'images-manifest.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), images: imageResults }, null, 2),
    'utf8',
  );

  // ---- downloadable documents (Wix serves uploads from /_files/ugd/...) ----
  const docs = new Map();
  for (const rec of records) {
    for (const l of rec.links) {
      const isDoc =
        /\/_files\/ugd\//i.test(l.href) ||
        /\.(pdf|docx?|xlsx?|pptx?|csv|txt|zip)(\?|$)/i.test(l.href);
      if (!isDoc) continue;
      if (!SITE_HOSTS.has(hostOf(l.href) || '')) continue;
      if (!docs.has(l.href)) docs.set(l.href, { href: l.href, text: l.text, foundOn: [] });
      if (!docs.get(l.href).foundOn.includes(rec.url)) docs.get(l.href).foundOn.push(rec.url);
    }
  }
  console.log(`\nDownloading ${docs.size} linked documents...`);
  const docResults = [];
  for (const d of docs.values()) {
    const base = decodeURIComponent(d.href.split('?')[0].split('/').pop() || 'file');
    const local = base.replace(/[^A-Za-z0-9._-]+/g, '_');
    const dest = path.join(FILES_DIR, local);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      docResults.push({ ...d, localFile: local, status: 'cached', bytes: fs.statSync(dest).size });
      continue;
    }
    const { status, buf } = await fetchBuffer(d.href);
    if (buf) {
      fs.writeFileSync(dest, buf);
      docResults.push({ ...d, localFile: local, status: 'ok', bytes: buf.length });
      console.log(`  ${local} ${buf.length}B`);
    } else {
      docResults.push({ ...d, localFile: null, status: 'failed', httpStatus: status, bytes: 0 });
      console.log(`  FAILED ${d.href} (${status})`);
    }
    await sleep(200);
  }
  fs.writeFileSync(
    path.join(ROOT, 'files-manifest.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), files: docResults }, null, 2),
    'utf8',
  );

  // ---- report ----
  const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;
  const withWords = records
    .map((r) => ({ slug: r.slug, url: r.url, words: wordCount(r.bodyText), status: r.httpStatus }))
    .sort((a, b) => b.words - a.words);
  const totalBytes = imageResults.reduce((n, i) => n + (i.bytes || 0), 0);
  const failedPages = records.filter((r) => r.httpStatus !== 200);
  const emptyPages = withWords.filter((w) => w.words < 40);
  const failedImages = imageResults.filter((i) => i.status === 'failed');
  const fallbackImages = imageResults.filter(
    (i) => i.source && i.source !== 'original' && i.status === 'ok',
  );

  const lines = [];
  lines.push('# FBC Muncie Wix capture report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Target: ${ORIGIN}`);
  lines.push(`Method: plain HTTP GET (Wix server-renders its HTML; verified before crawling).`);
  lines.push(
    'Scope: pages, team profiles, blog categories. Blog posts (/post/*) excluded by design.',
  );
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push('| Category | Sitemap URLs | Captured 200 | Failed |');
  lines.push('|---|---|---|---|');
  for (const g of sitemapCounts) {
    const recs = records.filter((r) => r.category === g.name);
    lines.push(
      `| ${g.name} | ${g.count} | ${recs.filter((r) => r.httpStatus === 200).length} | ${recs.filter((r) => r.httpStatus !== 200).length} |`,
    );
  }
  lines.push(
    `| **unique attempted** | ${targets.length} | ${records.filter((r) => r.httpStatus === 200).length} | ${failedPages.length} |`,
  );
  lines.push('');
  lines.push(
    `- Images downloaded/cached: **${imageResults.filter((i) => i.status !== 'failed').length}** of ${allImages.size} unique`,
  );
  lines.push(
    `- Total image bytes: **${totalBytes.toLocaleString()}** (${(totalBytes / 1048576).toFixed(2)} MB)`,
  );
  lines.push(
    `- Outbound (non-fbcmuncie.org) URLs: **${outboundArr.length}** across **${hostsArr.length}** hosts`,
  );
  lines.push(
    `- Linked documents (PDF etc. under /_files/ugd/) downloaded: **${docResults.filter((d) => d.status !== 'failed').length}** of ${docResults.length}, ${docResults.reduce((n, d) => n + (d.bytes || 0), 0).toLocaleString()} bytes -> data/files/`,
  );
  lines.push('');
  lines.push('## Outbound hosts (by page hits)');
  lines.push('');
  lines.push('| Host | distinct URLs | page hits |');
  lines.push('|---|---|---|');
  for (const h of hostsArr) lines.push(`| ${h.host} | ${h.urlCount} | ${h.pageHits} |`);
  lines.push('');
  lines.push('## Failures');
  lines.push('');
  if (!failures.length && !failedPages.length && !failedImages.length) {
    lines.push('None.');
  } else {
    for (const f of failures) lines.push(`- SITEMAP ${f.url} -> ${f.status} (${f.note})`);
    for (const f of failedPages)
      lines.push(`- PAGE ${f.url} -> HTTP ${f.httpStatus}${f.error ? ' ' + f.error : ''}`);
    for (const f of failedImages) lines.push(`- IMAGE ${f.originalUrl} -> HTTP ${f.httpStatus}`);
    for (const f of docResults.filter((d) => d.status === 'failed'))
      lines.push(`- FILE ${f.href} -> HTTP ${f.httpStatus}`);
  }
  lines.push('');
  if (fallbackImages.length) {
    lines.push('### Images captured at less than original resolution');
    lines.push('');
    for (const f of fallbackImages) lines.push(`- ${f.originalUrl} -> ${f.source}`);
    lines.push('');
  }
  lines.push('## Page sizes (words of body text)');
  lines.push('');
  lines.push('| Page | Words |');
  lines.push('|---|---|');
  for (const w of withWords) lines.push(`| ${w.slug} | ${w.words} |`);
  lines.push('');
  lines.push('## Thin / suspicious pages (<40 words)');
  lines.push('');
  if (!emptyPages.length) lines.push('None.');
  else
    for (const e of emptyPages)
      lines.push(`- ${e.url} (${e.words} words) - check whether content is JS-rendered`);
  lines.push('');
  // blog listing pages: how many post links actually server-rendered
  const blogListing = records
    .filter((r) => /\/blog(\/|$)/.test(r.url))
    .map((r) => ({
      url: r.url,
      posts: r.links.filter((l) => l.region === 'main' && /\/post\//.test(l.href)).length,
    }));

  lines.push('## Blog listing / category pages (JS-rendered feed)');
  lines.push('');
  lines.push(
    'Wix Blog renders only the first few cards into the server HTML; the rest of the paginated feed is fetched by JavaScript. Post links found in the served markup of each listing page:',
  );
  lines.push('');
  lines.push('| Listing page | /post/ links in served HTML |');
  lines.push('|---|---|');
  for (const b of blogListing) lines.push(`| ${b.url} | ${b.posts} |`);
  lines.push('');
  lines.push(
    '**Consequence for a rebuild:** category -> post membership CANNOT be recovered from these pages. It has to come from each individual post page (captured separately) or from a Wix data export.',
  );
  lines.push('');
  lines.push('## Notes for a rebuild');
  lines.push('');
  lines.push(
    '- Wix UI chrome images were skipped: media ids prefixed `11062b_` (Wix stock social icons) and blank.gif.',
  );
  lines.push(
    '- Every image was requested at its ORIGINAL upload URL (everything before `/v1/`). Wix serves SVG originals from `/shapes/` rather than `/media/`; the crawler falls back to that path automatically.',
  );
  lines.push(
    '- `links` in each page JSON carry a `region` field (main/header/footer) so nav boilerplate can be told apart from in-content links.',
  );
  lines.push(
    '- Body text de-duplicates repeated strings because Wix renders separate desktop/mobile copies of some sections.',
  );
  lines.push(
    '- `https://www.fbcmuncie.org/blog` appears in both the pages sitemap and the blog-categories sitemap; it is captured once (counted under `pages`), which is why the blog-categories row shows 6 of 7.',
  );
  lines.push(
    '- Team/staff profile pages are genuinely short by design (name, role, e-mail, headshot, back-link). The short word counts are real content, not a failed JS render - verified against the raw HTML.',
  );
  lines.push(
    '- Several e-mail addresses are obfuscated on the live site as `name[at]fbcmuncie.org`; they are captured verbatim.',
  );
  lines.push(
    '- `/post/important-documents` is linked from the main header nav (Ministry > Important Documents) even though it is a blog post, not a page. A rebuild needs it to exist at a stable URL.',
  );
  lines.push(
    '- No `<iframe>` embeds are present in the served HTML: every third-party integration on this site is a plain outbound link (Church Trac, Church Center, YouTube, social, app stores). The `embeds` array therefore lists detected third-party URLs and scripts rather than true iframe embeds.',
  );
  lines.push(
    '- Downloadable PDFs are large (newsletters and annual reports run to tens of MB each) and are mirrored to `data/files/` with the manifest in `files-manifest.json`.',
  );
  lines.push('');
  lines.push('### SEO state of the existing site');
  lines.push('');
  lines.push(
    `- ${records.filter((r) => !r.metaDescription).length} of ${records.length} pages have **no meta description**.`,
  );
  lines.push(
    `- ${records.filter((r) => !r.h1).length} pages have **no h1**: ${
      records
        .filter((r) => !r.h1)
        .map((r) => r.slug)
        .join(', ') || 'none'
    }.`,
  );
  lines.push(
    `- Only ${new Set(records.map((r) => r.ogImage)).size} distinct og:image values across ${records.length} pages; many pages fall back to the site logo SVG.`,
  );
  lines.push(
    `- Totals captured: ${records.reduce((n, r) => n + r.headings.length, 0)} headings, ${records.reduce((n, r) => n + r.bodyText.split(/\s+/).filter(Boolean).length, 0).toLocaleString()} words of body text, ${records.reduce((n, r) => n + r.links.length, 0)} link instances, ${records.reduce((n, r) => n + r.images.length, 0)} image references.`,
  );
  lines.push('');
  lines.push('### Broken or mislabelled links found on the live site');
  lines.push('');
  lines.push(
    '- The social icon labelled **"Linktree"** in the header and footer points to `https://podcasters.spotify.com/pod/show/first-baptist-church-munc` - a truncated-looking Spotify-for-Podcasters URL, on a domain Spotify has since retired. A second icon with the same "Linktree" label points to `https://linktr.ee/fbcmuncie`. One of the two is wrong; confirm with the church which they want.',
  );
  lines.push(
    '- On `/team/cynthia-smith` a link labelled **"LinkedIn"** actually points to `https://www.cynthialucilesmith.com/`.',
  );
  lines.push(
    '- The site has two social-icon bars (header and footer) whose URLs disagree slightly: `http://threads.net/fbcmuncie` vs `https://www.threads.net/@fbcmuncie`, and `https://facebook.com/...` vs `https://www.facebook.com/...`. Normalise on rebuild.',
  );
  lines.push(
    '- `/team/nina-oisten` lists the e-mail as `clerk@fbcmuncieorg` (missing the dot before `org`).',
  );
  fs.writeFileSync(path.join(ROOT, 'capture-report.md'), lines.join('\n'), 'utf8');

  console.log('\nDone.');
  console.log(`Pages: ${records.length} (${failedPages.length} failed)`);
  console.log(
    `Images: ${imageResults.filter((i) => i.status !== 'failed').length}/${allImages.size}, ${totalBytes} bytes`,
  );
  console.log(`Outbound hosts: ${hostsArr.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
