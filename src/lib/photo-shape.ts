// Safe to edit by hand
// The picture decides the band (design research note section 7; the approved
// prototype is docs/superpowers/prototypes/2026-09-22-richtext-and-photos/photos/).
// Pure and build-time. Inputs are the asset's WxH (from its ref), alt,
// eyebrow and the Portable Text body; every string is cleaned of stega first.
// The page-level pass is what enforces "one lancet per page" and the ground
// budget, so changing one band's picture in the Studio can change ANOTHER
// band's shape (a new portrait earlier on the page takes the arch). That is
// intended; docs/agent/components.md says so for editors.
import { parseSanityAssetDimensions } from './sanity-asset.ts';
import { splitStega } from './preview-stega.ts';
import { blockText, type PtBlock } from './span-split.ts';

export type PhotoShape = 'ground' | 'window' | 'frame' | 'plate' | 'legend' | 'row';
export interface PhotoRow {
  _type: string;
  image?: { asset?: { _ref?: string; _id?: string } | null; alt?: string | null } | null;
  eyebrow?: string | null;
  body?: PtBlock[] | null;
}

const clean = (s: string | null | undefined) => splitStega(s ?? '').cleaned;

export function photoAspect(image: PhotoRow['image']): { w: number; h: number; a: number } | null {
  if (!image?.asset) return null;
  const asset = image.asset;
  const d = parseSanityAssetDimensions({
    asset: {
      _ref: asset._ref ? clean(asset._ref) : undefined,
      _id: asset._id ? clean(asset._id) : undefined,
    },
  });
  return d ? { w: d.width, h: d.height, a: d.width / d.height } : null;
}

export function isArchival(
  alt: string | null | undefined,
  eyebrow: string | null | undefined,
): boolean {
  return /\b(1[5-8]\d\d|19[0-4]\d)\b/.test(`${clean(alt)} ${clean(eyebrow)}`);
}

export function findLegend(body: PtBlock[] | null | undefined) {
  const bl = Array.isArray(body) ? body : [];
  for (let i = 0; i < bl.length; i++) {
    const b = bl[i];
    if (b.listItem || !/left to right/i.test(blockText(b))) continue;
    let j = i + 1;
    while (j < bl.length && bl[j].listItem) j++;
    const count = j - (i + 1);
    if (count < 3 || count > 8) return null;
    const foot = j < bl.length && !bl[j].listItem && /^\*/.test(blockText(bl[j]).trim()) ? j : null;
    return { labelIndex: i, listStart: i + 1, listEnd: j, footIndex: foot };
  }
  return null;
}

/**
 * The legend a band can actually draw. The page pass (assignPhotoShapes) runs
 * findLegend on the WHOLE body; ImageText looks only at the body left after
 * its lede, where the label may no longer be. A legend with nothing to lift
 * falls back to a row, never to a legend band with no names.
 */
export function resolveLegend(
  shape: PhotoShape,
  rest: PtBlock[],
): { shape: PhotoShape; legend: ReturnType<typeof findLegend> } {
  if (shape !== 'legend') return { shape, legend: null };
  const legend = findLegend(rest);
  return legend ? { shape, legend } : { shape: 'row', legend: null };
}

export function assignPhotoShapes(
  rows: PhotoRow[],
  opts: { heroHasPhoto?: boolean } = {},
): Map<number, PhotoShape> {
  const out = new Map<number, PhotoShape>();
  let portraits = 0;
  const grounds: number[] = [];
  const firstAfterHero = rows[0]?._type === 'heroSection' ? 1 : -1;
  rows.forEach((row, i) => {
    if (row._type !== 'imageTextSection') return;
    const d = photoAspect(row.image);
    if (!d) return;
    let shape: PhotoShape;
    if (d.a <= 0.85) shape = portraits++ === 0 ? 'window' : 'frame';
    else if (d.a >= 1.8 && findLegend(row.body)) shape = 'legend';
    else if (d.a < 1.25 && isArchival(row.image?.alt, row.eyebrow)) shape = 'plate';
    else if (d.a >= 1.3 && d.w >= 2000 && groundOk(i)) {
      shape = 'ground';
      grounds.push(i);
    } else shape = 'row';
    out.set(i, shape);
  });
  return out;

  function groundOk(i: number): boolean {
    if (opts.heroHasPhoto && i === firstAfterHero) return false;
    if (grounds.length === 0) return true;
    if (grounds.length >= 2) return false;
    return i - grounds[0] >= 4 && rows.length >= 6;
  }
}
