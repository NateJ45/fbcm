#!/usr/bin/env node
// Safe to edit by hand
// =============================================================================
// gen-studio-art.mjs - the Studio's art, drawn from the public site's own parts
// =============================================================================
// Writes public/studio-art/ (and the Home banner's two strips in
// public/studio-banner/) from assets the site already ships, so the Studio
// reads as part of the church's design rather than a generic admin:
//
//   - the 1927 Hannaford rendering of the building (src/assets/footer-rendering.webp,
//     the line drawing that inks in at the foot of every page), tinted gold;
//   - the four goal glyphs (src/components/church/BuildingGlyph.astro: window
//     for Worship, door for The Way, lamp for Witness, basin for Work), in the
//     2px gold line the footer's goal row uses;
//   - the lancet window of the photo frames (src/components/church/ArchFrame.astro);
//   - the gold eyebrow rule (a short hairline before small capitals, as on the
//     home hero's "TODAY · WORSHIP AT 10:45 AM").
//
// Outputs:
//   public/studio-banner/foot.svg        Home banner foot, wide (1000 x 160)
//   public/studio-banner/foot-phone.svg  Home banner foot, phone (390 x 130)
//   public/studio-art/rendering-gold.webp  the rendering, gold on transparent
//   public/studio-art/goal-glyphs.svg      the four glyphs in a row on a rule
//   public/studio-art/lancet.svg           the photo-frame lancet, outline
//   public/studio-art/eyebrow-rule.svg     the hero's gold lead-in rule
//   public/studio-art/tower.svg            the wordmark's tower, bare, for dark grounds
//                                          (the Home banner's markOnDark)
//   src/assets/brand/studio-icon-tower.svg the same tower on the favicon's square,
//                                          no plate, for the Studio's Home icon
//   public/icon-maskable-512.png           the Studio app icon: the tower on navy, full bleed
//   public/studio-art/castoro-italic.woff2 the site's italic accent face (OFL),
//                                          for the banner's "Muncie" lettering
//
// Run: node scripts/gen-studio-art.mjs   (needs sharp, which Astro installs)
// =============================================================================

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const ART = join(ROOT, 'public', 'studio-art');
const BANNER = join(ROOT, 'public', 'studio-banner');
mkdirSync(ART, { recursive: true });
mkdirSync(BANNER, { recursive: true });

const GOLD = '#D59B29';

// ── The rendering, gold on transparent ───────────────────────────────────────
// The source is white line work on transparent. Keep its alpha, paint it gold.
const src = sharp(join(ROOT, 'src/assets/footer-rendering.webp'));
const { width, height } = await src.metadata();
const alpha = await src.clone().ensureAlpha().extractChannel(3).toBuffer();
const gold = await sharp({ create: { width, height, channels: 3, background: GOLD } })
  .joinChannel(alpha)
  .webp({ quality: 82, alphaQuality: 90 })
  .toBuffer();
writeFileSync(join(ART, 'rendering-gold.webp'), gold);
const goldUri = `data:image/webp;base64,${gold.toString('base64')}`;
const ratio = width / height;

// ── The goal glyphs (paths from BuildingGlyph.astro, 48 x 64 boxes) ──────────
const QF =
  'M-8.94-8.94A9 9 0 1 1 8.94-8.94A9 9 0 1 1 8.94 8.94A9 9 0 1 1-8.94 8.94A9 9 0 1 1-8.94-8.94Z';
const GLYPHS = {
  window: [
    'M5 62V30C5 16 14 7 24 3C34 7 43 16 43 30V62',
    'M10 62V36A12 12 0 0 1 16 25A12 12 0 0 1 22 36V62',
    'M26 62V36A12 12 0 0 1 32 25A12 12 0 0 1 38 36V62',
    { d: QF, transform: 'translate(24 16) scale(.36)' },
  ],
  door: [
    'M9 46V22C9 14 17 9 24 5C31 9 39 14 39 22V46',
    'M14 46V24C14 19 19 15 24 12C29 15 34 19 34 24V46',
    'M24 12V46',
    'M9 46H39',
    'M14 46L4 62M34 46L44 62',
    'M17 51H31M12 57H36',
  ],
  lamp: [
    'M9.6 31.6C9.6 27.4 14.7 25.2 20.6 25.2C25.7 25.2 29.1 26.5 32.5 27.4L39.3 27.8C41.4 28 41.4 30.6 39.3 30.8L32.5 31.6C29.1 35 25.7 38 20.6 38C14.7 38 9.6 35.9 9.6 31.6Z',
    'M17.6 28.6a3 1.1 0 1 0 6 0a3 1.1 0 1 0-6 0M10.4 29C5.3 27.4 4.5 34.2 10 34.6',
    'M40.2 7.8C42.7 13.8 43.6 18 43.6 21.4A3.4 3.4 0 0 1 36.8 21.4C36.8 18 37.6 13.8 40.2 7.8Z',
    'M11 38H31',
    'M21 38V58',
    'M15 62C16 59.5 18.5 58 21 58C23.5 58 26 59.5 27 62',
  ],
  basin: [
    'M3 30A21 5 0 0 1 45 30A21 5 0 0 1 38 33.7M28 34.9A21 5 0 0 1 3 30',
    'M3 30C4 41.5 13 48 24 48C25.4 48 26.7 47.9 28 47.7M38 43.5C41.9 40.5 44.5 35.9 45 30',
    'M28 34.9V55L33 53L38 55V33.7',
    'M28 34.9C28 29 31 26 33 26C35 26 38 28 38 33.7',
    'M17 48L15 56H28',
  ],
};
/** One glyph, its 48 x 64 box scaled to `h` tall, bottom-left at (x, y). */
function glyph(name, x, y, h, stroke = 2) {
  const s = h / 64;
  const paths = GLYPHS[name]
    .map((p) =>
      typeof p === 'string'
        ? `<path d="${p}"/>`
        : `<path d="${p.d}" transform="${p.transform}" stroke-width="${(stroke / s / 0.36).toFixed(2)}"/>`,
    )
    .join('');
  return `<g transform="translate(${x} ${y - h}) scale(${s.toFixed(4)})" stroke-width="${(stroke / s).toFixed(2)}">${paths}</g>`;
}
const head = (what) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<!-- First Baptist Church Muncie: ${what}. Generated by scripts/gen-studio-art.mjs from the site's own art; edit the script, not this file. -->\n`;

// ── The Home banner's foot ───────────────────────────────────────────────────
// The rendering alone, rising on the right over a gold ground line that runs
// the banner's width, fading in from the left: the way the footer lets the
// building ink in behind its words. (The 2026-10-19 version also set the four
// goal glyphs along the line; uncaptioned they read as a toolbar, and an <img>
// SVG cannot load the site's fonts to caption them, so they are left to the
// footer, where they have their words.)
function foot(w, h, renderH) {
  const base = h - 6;
  const rw = renderH * ratio;
  const rx = w - rw + rw * 0.06;
  return (
    head('the Studio Home banner foot (PORTS.md card 118)') +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".35" stop-color="#fff" stop-opacity=".55"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".8"/>
    </linearGradient>
    <mask id="m"><rect x="${(rx - rw * 0.06).toFixed(1)}" y="0" width="${rw.toFixed(1)}" height="${h}" fill="url(#fade)"/></mask>
  </defs>
  <image href="${goldUri}" x="${rx.toFixed(1)}" y="${(base - renderH).toFixed(1)}" width="${rw.toFixed(1)}" height="${renderH}" mask="url(#m)"/>
  <path d="M0 ${base + 0.5}H${w}" stroke="${GOLD}" stroke-opacity=".75" stroke-width="1"/>
</svg>
`
  );
}
writeFileSync(join(BANNER, 'foot.svg'), foot(1000, 160, 154));
writeFileSync(join(BANNER, 'foot-phone.svg'), foot(390, 130, 124));

// ── Pieces for the Studio design language (starter card 128, next round) ────
writeFileSync(
  join(ART, 'goal-glyphs.svg'),
  head('the four goal glyphs on a rule') +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" fill="none" aria-hidden="true">
  <g stroke="${GOLD}" stroke-linecap="round" stroke-linejoin="round">${[
    'window',
    'door',
    'lamp',
    'basin',
  ]
    .map((g, i) => glyph(g, 22 + i * 80, 72, 56))
    .join('')}</g>
  <path d="M0 76.5H320" stroke="${GOLD}" stroke-opacity=".75"/>
</svg>
`,
);
writeFileSync(
  join(ART, 'lancet.svg'),
  head('the photo-frame lancet (ArchFrame.astro), outline') +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" fill="none" aria-hidden="true">
  <path d="M2 148V52C2 24 26 6 50 2C74 6 98 24 98 52V148Z" stroke="${GOLD}" stroke-width="2"/>
</svg>
`,
);
writeFileSync(
  join(ART, 'eyebrow-rule.svg'),
  head('the gold lead-in rule before an eyebrow') +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 2" aria-hidden="true"><rect width="44" height="1" y=".5" fill="${GOLD}"/></svg>
`,
);
// ── The tower (the wordmark's own drawing, as public/favicon.svg isolates it) ─
// The favicon's paths unchanged, without its navy plate: on the navy banner
// and navbar the plate would be a box on a box.
const fav = readFileSync(join(ROOT, 'public', 'favicon.svg'), 'utf8');
const towerPaths = fav
  .slice(fav.indexOf('<svg'))
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<rect[^>]*\/>/, '')
  .trim();
if (!towerPaths.includes('<path')) throw new Error('favicon.svg: no tower paths found');
writeFileSync(
  join(ART, 'tower.svg'),
  head('the tower from the wordmark, no plate, for dark grounds') +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="74.6 -2.4 72.5 99.9" aria-hidden="true">
  ${towerPaths}
</svg>
`,
);
writeFileSync(
  join(ROOT, 'src', 'assets', 'brand', 'studio-icon-tower.svg'),
  head('Studio icon "Church tower" (PORTS.md card 119), the favicon without its plate') +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="62.4 -0.8 96.9 96.9" role="img" aria-label="Church tower">
  ${towerPaths}
</svg>
`,
);

// ── The Studio app's Android icon (starter card 125) ─────────────────────────
// Android crops a maskable icon to a circle or squircle, so the ground runs to
// every edge and the tower stands in the middle 60%. generate-favicons.mjs
// keeps a drawn public/icon-maskable-512.png, so this one wins; its own
// version would be the rounded favicon tile floating on white.
{
  const tower = await sharp(readFileSync(join(ART, 'tower.svg')), { density: 600 })
    .resize({ height: 300 })
    .png()
    .toBuffer();
  const t = await sharp(tower).metadata();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#292854' } })
    .composite([
      {
        input: tower,
        left: Math.round((512 - t.width) / 2),
        top: Math.round((512 - t.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(ROOT, 'public', 'icon-maskable-512.png'));
}

// ── The italic accent face for the banner lettering ──────────────────────────
copyFileSync(
  join(ROOT, 'node_modules/@fontsource/castoro/files/castoro-latin-400-italic.woff2'),
  join(ART, 'castoro-italic.woff2'),
);

console.log('studio art written');
