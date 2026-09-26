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
import { photoSubject } from './photo-subject.ts';

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

/**
 * HOW A BESIDE BAND IS COMPOSED (2026-09-25, the people-in-arches pass).
 *
 *   pair     two portraits of people (the photo and its `detail`), drawn as
 *            two equal lancets, the way the Staff hero draws the co-pastors.
 *            A small detail over a corner says "and this too"; two portraits
 *            of the same size say "these two", which is what two people who
 *            share one role need (Contact's co-pastors).
 *   compact  a portrait beside a few words (at most COMPACT_WORDS, no small
 *            headings, no room board): the heading moves into the text
 *            column, the words sit centred against the portrait, and the
 *            portrait is sized to them. Without it a short band hung a tall
 *            portrait far from four lines of text, with the heading on a row
 *            of its own above both (Wedding's coordinator, 2026-09-25).
 *   standard everything else, as before.
 *
 * Portrait means aspect below 0.9, the ROW mapping's portrait line. Inputs are
 * numbers and the body's cleaned words, so the answer never sees stega.
 */
export type BesideForm = 'standard' | 'compact' | 'pair';
export const COMPACT_WORDS = 70;

export function besideForm(opts: {
  shape: PhotoShape;
  /** The main photo's aspect (null: none, or unreadable). */
  aspect: number | null | undefined;
  /** The main photo is of people and drawn in an arch. */
  arched: boolean;
  /** The detail photo's aspect, and whether its alt names people. */
  detailAspect?: number | null;
  detailPeople?: boolean;
  /** The body left after the lede, and the lede itself. */
  body: PtBlock[];
  /** The body is drawn as a room board (morning-path.ts roomBoard). */
  board?: boolean;
}): BesideForm {
  const { shape, aspect, arched, detailAspect, detailPeople, body, board } = opts;
  const beside = shape === 'row' || shape === 'window' || shape === 'frame' || shape === 'plate';
  const portrait = (a: number | null | undefined) => typeof a === 'number' && a > 0 && a < 0.9;
  if (!beside || !portrait(aspect)) return 'standard';
  if (arched && detailPeople && portrait(detailAspect)) return 'pair';
  if (board) return 'standard';
  const blocks = Array.isArray(body) ? body : [];
  const headed = blocks.some((b) => /^h[1-6]$/.test(clean(String(b?.style ?? ''))));
  if (headed) return 'standard';
  const words = blocks.reduce((n, b) => n + (blockText(b).trim().match(/\S+/g)?.length ?? 0), 0);
  return words > 0 && words <= COMPACT_WORDS ? 'compact' : 'standard';
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
    // A ground is a view of the PLACE (2026-09-24, the Visit identity pass):
    // a photo of people is framed in an arch instead (rollout rule 3), so it
    // never becomes the band's ground and never spends the ground budget.
    else if (d.a >= 1.3 && d.w >= 2000 && photoSubject(row.image?.alt) === 'place' && groundOk(i)) {
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
