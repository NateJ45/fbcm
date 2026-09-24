// Foundation, edit with care
// =============================================================================
// The share cards: one 1200x630 PNG per page and per post, in the church's
// identity (2026-09-24, the craft-details pass).
// =============================================================================
// Runs at the START of every `npm run build` (package.json), before Astro, and
// writes public/og/<route>.png: `/` -> home.png, `/visit` -> visit.png,
// `/post/<slug>` -> post-<slug>.png (ogCardPath in src/lib/church-schema.ts is
// the one statement of that convention). Astro copies public/ into the build,
// and BaseLayout's import.meta.glob of public/og/*.png sees exactly the cards
// that exist, so a route never points at a card that was not made. The cards
// are NOT committed (public/og/ is gitignored): they are built from the
// published content every time, so a new post or a renamed page has its card
// on the next build with nobody running anything.
//
// THE CARD. The indigo band, a gold hairline frame, the Hannaford rendering
// (src/assets/footer-rendering.webp, the same baked pencil drawing the footer
// masks in gold) in faint gold along the foot, the title in Castoro Titling
// sized by src/lib/og-card.ts (as large as fits, three lines, never a split
// word), and the wordmark under a door glyph. A post adds its eyebrow (its
// category, or "Sermon preview") and a line under the title: the Sunday and
// the reading for a sermon preview, the date for anything else, both derived
// from the post exactly as the post page derives them (sermon-derive.ts).
//
// WHY NO BROWSER. The starter's renderer (scripts/lib/render-og.mjs) screenshots
// a page in headless Chromium, which is fine by hand and wrong inside every
// build: CI's build job has no browser installed. Here the text is turned into
// SVG outlines with opentype.js (already a devDependency) straight from the
// @fontsource .woff files the site itself ships, and sharp (already a
// dependency) rasterises the SVG. No system fonts are involved, so the card is
// set in the real face on any machine, and the output is byte-stable.
//
// FAST AND CACHED. Each card's inputs (its words, this file, og-card.ts, the
// fonts and the drawing) are hashed into public/og/.manifest.json; a card whose
// hash has not changed is not redrawn. A cold run of ~155 cards takes a few
// seconds; a warm one reads a manifest. Cards for routes that no longer exist
// are deleted.
//
// NO SANITY PROJECT, NO CARDS. On a fresh clone this prints one line and exits
// 0; every route then falls back to /og-default.png, as before.
//
// Run by hand with `npm run og:pages` (same thing the build runs). Needs Node's
// type stripping for the src/lib imports: the npm scripts pass
// --experimental-strip-types.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { loadEnv } from './lib/loadEnv.mjs';
import { fitTitle, typeset } from '../src/lib/og-card.ts';
import { ogCardPath, SERVICE_PAGE_SLUG } from '../src/lib/church-schema.ts';
// scaffold: journal
import { entryIsSermonPreview } from '../src/lib/blog-derive.ts';
import { openingText } from '../src/lib/post-body.ts';
import { sundayOf, localDay, formatDay, readingOf } from '../src/lib/sermon-derive.ts';
// scaffold:end

const started = Date.now();
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'public/og');
const manifestPath = resolve(outDir, '.manifest.json');

const env = loadEnv(root);
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
if (!projectId || projectId === 'your-project-id') {
  console.log(
    '[og] PUBLIC_SANITY_PROJECT_ID not set: no share cards (every route uses /og-default.png).',
  );
  process.exit(0);
}
// The same read as src/lib/sanity.ts: the API CDN, published content, the read
// token when there is one (the CDN accepts it; see the quota note there).
const readToken = env.SANITY_API_READ_TOKEN;
const client = createClient({
  projectId,
  dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
  useCdn: true,
  perspective: 'published',
  ...(readToken ? { token: readToken } : {}),
});

// ── The look ───────────────────────────────────────────────────────────────
// The brand tokens (brand/brand.config.json palette.theme).
const brand = JSON.parse(readFileSync(resolve(root, 'brand/brand.config.json'), 'utf8'));
const T = brand.palette.theme;
const INDIGO = T['--color-indigo'];
const GOLD = T['--color-gold'];
const CREAM = T['--color-cream'];
const TAUPE = T['--color-taupe'];

const W = 1200;
const H = 630;
const LEFT = 92;
const TITLE_WIDTH = 900;
const WORDMARK = 'First Baptist Church Muncie';

// ── Fonts: the .woff files the site ships (opentype.js cannot read woff2) ───
const fontFile = (pkg, file) => resolve(root, 'node_modules', pkg, 'files', file);
const FONT_FILES = {
  titling: [
    fontFile('@fontsource/castoro-titling', 'castoro-titling-latin-400-normal.woff'),
    fontFile('@fontsource/castoro-titling', 'castoro-titling-latin-ext-400-normal.woff'),
  ],
  italic: [
    fontFile('@fontsource/castoro', 'castoro-latin-400-italic.woff'),
    fontFile('@fontsource/castoro', 'castoro-latin-ext-400-italic.woff'),
  ],
};
const load = (file) => {
  const buf = readFileSync(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const FONTS = {
  titling: FONT_FILES.titling.map(load),
  italic: FONT_FILES.italic.map(load),
};

/** The font in a family that has this character (latin first, then latin-ext). */
const fontFor = (family, ch) =>
  FONTS[family].find((f) => f.charToGlyph(ch).index !== 0) ?? FONTS[family][0];

/** Split text into runs that each one font can set. */
function runs(family, text) {
  const out = [];
  for (const ch of text) {
    const f = fontFor(family, ch);
    const last = out[out.length - 1];
    if (last && last.font === f) last.text += ch;
    else out.push({ font: f, text: ch });
  }
  return out;
}

/** Width of `text` at `size`, with `tracking` (in em) after every character. */
function measure(family, text, size, tracking = 0) {
  let w = 0;
  for (const r of runs(family, text)) {
    w += r.font.getAdvanceWidth(r.text, size, { kerning: true });
  }
  return w + tracking * size * Math.max(0, [...text].length - 1);
}

/**
 * SVG path data from an opentype.js Path. Written out here rather than with
 * Path.toPathData(): opentype.js 2.0.0's number formatting turns some
 * coordinates into "NaN" (measured: the T of "ST" at 100px), and one NaN ends
 * the path for the renderer, which silently drops the rest of the line.
 */
function pathD(path) {
  const n = (v) => (Math.round(v * 100) / 100).toString();
  let d = '';
  for (const c of path.commands) {
    if (c.type === 'M' || c.type === 'L') d += `${c.type}${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Q') d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'C')
      d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}

/** SVG path data for `text` with its baseline at (x, y). */
function textPath(family, text, x, y, size, tracking = 0) {
  let d = '';
  let cx = x;
  if (tracking) {
    for (const ch of text) {
      const f = fontFor(family, ch);
      d += pathD(f.getPath(ch, cx, y, size));
      cx += f.getAdvanceWidth(ch, size) + tracking * size;
    }
    return d;
  }
  for (const r of runs(family, text)) {
    d += pathD(r.font.getPath(r.text, cx, y, size, { kerning: true }));
    cx += r.font.getAdvanceWidth(r.text, size, { kerning: true });
  }
  return d;
}

// ── The drawing: the Hannaford rendering in faint gold ──────────────────────
const ART_FILE = resolve(root, 'src/assets/footer-rendering.webp');
const ART_WIDTH = 820;
const ART_OPACITY = 0.2;
async function goldArt() {
  // Scaled by hand: sharp's linear() leaves an alpha channel alone, so it
  // cannot fade the drawing's alpha once it has been extracted in the same
  // pipeline.
  const alpha = await sharp(ART_FILE)
    .resize({ width: ART_WIDTH })
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < alpha.data.length; i++) {
    alpha.data[i] = Math.round((alpha.data[i] ?? 0) * ART_OPACITY);
  }
  const { width, height } = alpha.info;
  const hex = GOLD.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const input = await sharp({ create: { width, height, channels: 3, background: { r, g, b } } })
    .joinChannel(alpha.data, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
  return { input, width, height };
}

// The door glyph, from BuildingGlyph.astro ('door'), for the wordmark line.
const DOOR = [
  'M7 58V28C7 18 16 13 24 9C32 13 41 18 41 28V58',
  'M12 58V30C12 23 18 19 24 16C30 19 36 23 36 30V58',
  'M24 16V58',
  'M3 58H45M1 62H47',
];

// ── One card ────────────────────────────────────────────────────────────────
function cardSvg({ eyebrow, title, meta }) {
  const eyebrowSize = 22;
  const metaSize = 32;
  const eyebrowH = eyebrow ? eyebrowSize + 30 : 0;
  const metaH = meta ? 34 + 2 + 30 + metaSize * 0.75 : 0;
  // The block sits between the frame's top (plus a margin) and the wordmark.
  const ZONE_TOP = 92;
  const ZONE_BOTTOM = 482;
  const blockHeight = (size, lines) =>
    eyebrowH + size * 0.7 + (lines - 1) * Math.round(size * 1.08) + metaH;
  const fit = fitTitle(typeset(title), (t, size) => measure('titling', t, size), {
    maxWidth: TITLE_WIDTH,
    fitsHeight: (size, lines) => blockHeight(size, lines) <= ZONE_BOTTOM - ZONE_TOP,
  });
  const lineHeight = Math.round(fit.size * 1.08);
  const capHeight = fit.size * 0.7;
  const blockH = blockHeight(fit.size, fit.lines.length);
  const top = Math.round(ZONE_TOP + Math.max(0, (ZONE_BOTTOM - ZONE_TOP - blockH) / 2));

  let y = top;
  const parts = [];
  if (eyebrow) {
    y += eyebrowSize * 0.72;
    parts.push(
      `<path fill="${GOLD}" d="${textPath('titling', eyebrow.toUpperCase(), LEFT, y, eyebrowSize, 0.16)}"/>`,
    );
    y += 30 + eyebrowSize * 0.28;
  }
  y += capHeight;
  fit.lines.forEach((line, i) => {
    parts.push(
      `<path fill="${CREAM}" d="${textPath('titling', line, LEFT, y + i * lineHeight, fit.size)}"/>`,
    );
  });
  y += (fit.lines.length - 1) * lineHeight;
  if (meta) {
    y += 34;
    parts.push(`<rect x="${LEFT}" y="${y}" width="72" height="2" fill="${GOLD}"/>`);
    y += 2 + 30 + metaSize * 0.72;
    parts.push(
      `<path fill="${CREAM}" fill-opacity=".88" d="${textPath('italic', typeset(meta), LEFT, y, metaSize)}"/>`,
    );
  }

  // The wordmark, under the door glyph's lintel, on the frame's foot.
  const markSize = 25;
  const markY = 546;
  const glyphScale = 0.62;
  const glyph = `<g transform="translate(${LEFT} ${markY - 62 * glyphScale + 6}) scale(${glyphScale})" fill="none" stroke="${GOLD}" stroke-width="${2 / glyphScale}" stroke-linecap="round" stroke-linejoin="round">${DOOR.map((d) => `<path d="${d}"/>`).join('')}</g>`;
  const mark = `<path fill="${GOLD}" d="${textPath('titling', WORDMARK.toUpperCase(), LEFT + 48, markY, markSize, 0.12)}"/>`;

  return {
    fit,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${GOLD}" stroke-opacity=".55" stroke-width="1.5"/>
<rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${TAUPE}" stroke-opacity=".22" stroke-width="1"/>
${parts.join('\n')}
${glyph}
${mark}
</svg>`,
  };
}

async function renderCard(card, art, outPath) {
  const { svg, fit } = cardSvg(card);
  if (process.env.OG_DEBUG_SVG) writeFileSync(`${outPath}.svg`, svg);
  const hex = INDIGO.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const buf = await sharp({ create: { width: W, height: H, channels: 3, background: { r, g, b } } })
    .composite([
      // The drawing stands on the frame's foot at the right, faint.
      { input: art.input, left: W - 40 - art.width, top: H - 40 - art.height },
      { input: Buffer.from(svg), left: 0, top: 0 },
    ])
    .png({ palette: true, quality: 80, effort: 10, compressionLevel: 9, dither: 0.8 })
    .toBuffer();
  writeFileSync(outPath, buf);
  return { bytes: buf.length, fit };
}

// ── What to draw ───────────────────────────────────────────────────────────
const clean = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const [settings, pages] = await Promise.all([
  client.fetch(`*[_id == "siteSettings"][0]{ tagline, serviceTime, address }`).catch(() => null),
  client
    .fetch(
      `*[_type == "page" && defined(slug.current) && archived != true]{ title, "slug": slug.current }`,
    )
    .catch(() => []),
]);

/** Every card: { name, card }. `name` is the file name without .png. */
const cards = [];
const add = (pathname, card) => {
  const name = ogCardPath(pathname)
    .replace(/^\/og\//, '')
    .replace(/\.png$/, '');
  cards.push({
    name,
    card: { eyebrow: clean(card.eyebrow), title: clean(card.title), meta: clean(card.meta) },
  });
};

// When and where, from Site settings (rule 15): "Sundays at 10:45 am · 309
// East Adams Street". Printed on the two cards a newcomer is sent: Home and
// the page about the Sunday service.
const street = clean(String(settings?.address ?? '').split(/\r?\n/)[0]);
const whenWhere = [clean(settings?.serviceTime), street].filter(Boolean).join(' · ');

// Home: the church's own line, the wordmark under it.
add('/', { title: clean(settings?.tagline) || WORDMARK, meta: whenWhere });
for (const p of pages ?? []) {
  if (!p?.slug || !p?.title) continue;
  add(`/${p.slug}`, { title: p.title, meta: p.slug === SERVICE_PAGE_SLUG ? whenWhere : '' });
}
add('/privacy', { title: 'Privacy policy' });

// scaffold: journal
add('/blog', { title: 'Blog', meta: 'Sermon previews, news and writing from the church' });
const posts = await client
  .fetch(
    `*[_type == "journalEntry" && defined(slug.current)]{
      title, "slug": slug.current, publishedAt,
      categories[]->{ title, slug },
      "head": body[_type == "block"][0...12]{ _type, style, listItem, children[]{ _type, text } }
    }`,
  )
  .catch(() => []);
for (const post of posts ?? []) {
  if (!post?.slug || !post?.title) continue;
  const preview = entryIsSermonPreview(post);
  let meta = '';
  if (preview) {
    const sunday = sundayOf(post.publishedAt);
    const reading = readingOf(openingText(post.head ?? []));
    meta = [
      sunday
        ? formatDay(sunday, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : '',
      reading,
    ]
      .filter(Boolean)
      .join(' · ');
  } else {
    const day = localDay(post.publishedAt);
    meta = day ? formatDay(day) : '';
  }
  const category = clean(post.categories?.[0]?.title);
  add(`/post/${post.slug}`, {
    eyebrow: preview ? 'Sermon preview' : category || 'Blog',
    title: post.title,
    meta,
  });
}
// scaffold:end

// ── Draw what changed ──────────────────────────────────────────────────────
const sha = (s) => createHash('sha256').update(s).digest('hex');
const INPUTS = sha(
  [
    readFileSync(fileURLToPath(import.meta.url)),
    readFileSync(resolve(root, 'src/lib/og-card.ts')),
    readFileSync(ART_FILE),
    ...Object.values(FONT_FILES)
      .flat()
      .map((f) => readFileSync(f)),
    JSON.stringify(T),
  ]
    .map((b) => sha(b))
    .join(''),
);

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
let manifest = {};
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  manifest = {};
}

const art = await goldArt();
const next = {};
let drawn = 0;
let kept = 0;
let bytes = 0;
let largest = { name: '', bytes: 0 };
const truncated = [];
const queue = [...cards];
async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const hash = sha(INPUTS + JSON.stringify(item.card));
    const out = resolve(outDir, `${item.name}.png`);
    if (manifest[item.name]?.hash === hash && existsSync(out)) {
      next[item.name] = manifest[item.name];
      kept += 1;
    } else {
      const r = await renderCard(item.card, art, out);
      next[item.name] = { hash, bytes: r.bytes };
      drawn += 1;
      if (r.fit.truncated) truncated.push(item.name);
    }
    bytes += next[item.name].bytes;
    if (next[item.name].bytes > largest.bytes)
      largest = { name: item.name, bytes: next[item.name].bytes };
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

// Cards for routes that are gone.
let removed = 0;
for (const f of readdirSync(outDir)) {
  if (f.endsWith('.png') && !next[f.replace(/\.png$/, '')]) {
    rmSync(resolve(outDir, f));
    removed += 1;
  }
}
writeFileSync(manifestPath, `${JSON.stringify(next, null, 0)}\n`);

console.log(
  `[og] ${cards.length} share cards (${drawn} drawn, ${kept} unchanged, ${removed} removed), ` +
    `${(bytes / 1024).toFixed(0)} KB in all, largest ${largest.name} ${(largest.bytes / 1024).toFixed(1)} KB, ` +
    `${((Date.now() - started) / 1000).toFixed(1)} s` +
    (truncated.length ? `; cut to fit: ${truncated.join(', ')}` : ''),
);
