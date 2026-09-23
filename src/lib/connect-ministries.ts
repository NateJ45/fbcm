// scaffold-file: church
// Safe to edit by hand
// =============================================================================
// connect-ministries - the PLAN for moving the five ministry bands into the
// ministry documents (used by scripts/connect-ministries.mjs)
// =============================================================================
// PURE: it takes documents and returns what to write, and never talks to
// Sanity. Two callers import it, which is why it lives in src/lib rather than
// inside the script:
//
//   - scripts/connect-ministries.mjs, which prints the plan and, with --write,
//     backs up and applies it (CLAUDE.md rule 16);
//   - the one-off parity SIMULATION that proved the migrated dataset renders
//     /ministries byte-identically, by applying this exact plan in memory
//     (applyConnectPlan) before building.
//
// For each of the five bands on page-ministries it:
//   1. splits the band's text into the ministry's own words and the typed
//      contact paragraph(s) at the end;
//   2. matches each contact paragraph to exactly ONE staffMember by name, and
//      PROVES the line src/lib/ministry-band.ts would generate from that person
//      is the paragraph that is there now (text, span split and link target);
//   3. plans the ministry document: small line, headline, photo (with its alt)
//      or no photo, text, people to talk to;
//   4. plans the band: a ministrySection pointing at the document, keeping the
//      band's _key, anchor and photo side.
// Anything unexpected is an ERROR in the plan, and the script refuses to write
// while there is one.
// =============================================================================
import { placeholdersForTypedCopies, type PlaceholderSettings } from './settings-placeholders.ts';
import { contactBlock, type ContactBlock } from './ministry-band.ts';

export const PAGE_ID = 'page-ministries';

/** The five bands, the document each one moves into, and the anchor it carries. */
export const MINISTRY_BANDS = [
  { bandKey: 'ministries-worship', ministryId: 'ministry-worship', anchor: 'worship' },
  { bandKey: 'ministries-children', ministryId: 'ministry-children', anchor: 'children' },
  { bandKey: 'ministries-youth', ministryId: 'ministry-youth', anchor: 'youth' },
  { bandKey: 'ministries-adult', ministryId: 'ministry-adult', anchor: 'adult' },
  { bandKey: 'ministries-outreach', ministryId: 'ministry-outreach', anchor: 'outreach' },
] as const;

/** Every key a band may carry. Anything else would be lost, so it stops the plan. */
const BAND_KEYS = new Set([
  '_key',
  '_type',
  'anchor',
  'body',
  'eyebrow',
  'heading',
  'image',
  'imageSide',
]);

// The raw shapes this reads out of a query dump. Only the fields it looks at
// are named; the index signatures carry everything else through untouched.
interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  markDefs?: { _type?: string; _key?: string; href?: string }[];
  children?: { _type?: string; _key?: string; text?: string; marks?: string[] }[];
  [key: string]: unknown;
}
interface Ref {
  _type?: string;
  _ref?: string;
  [key: string]: unknown;
}
interface RawImage {
  _type?: string;
  asset?: Ref | null;
  alt?: string;
  [key: string]: unknown;
}
interface Band extends Block {
  anchor?: { current?: string } | null;
  body?: Block[];
  eyebrow?: string;
  heading?: string;
  image?: RawImage | null;
  imageSide?: string;
  ministry?: Ref | null;
}
export interface Doc {
  _id?: string;
  _rev?: string;
  _type?: string;
  name?: string;
  role?: string;
  email?: string;
  showOnSite?: boolean;
  slug?: { current?: string } | null;
  body?: Block[];
  image?: RawImage | null;
  pageBuilder?: Band[];
  [key: string]: unknown;
}

export interface MinistryChange {
  id: string;
  rev: string | undefined;
  bandKey: string;
  /** Top-level fields to set on the ministry document. */
  set: Record<string, unknown>;
  /** Top-level fields to unset. */
  unset: string[];
  /** The photo the document held that the migration removes, when it does. */
  droppedImage: unknown;
  /** How many blocks of the document's old text are replaced. */
  oldBodyBlocks: number;
  /** The people matched from the contact paragraphs, in order. */
  contacts: { staffId: string; name: string }[];
  /** Strings the Site settings placeholders rewrote on the way in. */
  placeholderChanges: number;
}

export interface BandChange {
  bandKey: string;
  fromType: string;
  band: Record<string, unknown>;
}

export interface ConnectPlan {
  page: { id: string; rev: string | undefined } | null;
  ministries: MinistryChange[];
  bands: BandChange[];
  /** Bands already pointing at their ministry: nothing to do for those. */
  alreadyConnected: string[];
  errors: string[];
}

/**
 * Raw documents, straight out of a query dump or the live client. Typed as
 * unknown on the way in because nothing about them is guaranteed; the plan
 * checks what it relies on and reports the rest.
 */
export interface ConnectInput {
  page: unknown;
  ministries: readonly unknown[];
  staff: readonly unknown[];
  settings: PlaceholderSettings | null | undefined;
}

const textOf = (block: Block): string =>
  (Array.isArray(block?.children) ? block.children : []).map((c) => c?.text ?? '').join('');

/**
 * What a block LOOKS like to a reader, for comparing a typed paragraph with a
 * generated one: each span's text with the link targets its marks point at.
 * Keys are left out on purpose; they are never rendered.
 */
const renderShape = (input: Block | ContactBlock | null): string => {
  if (!input) return 'null';
  const block = input as Block;
  const defs = new Map<string, string>(
    (block.markDefs ?? []).map((d) => [d._key ?? '', `${d._type}:${d.href ?? ''}`]),
  );
  return JSON.stringify({
    style: block.style ?? 'normal',
    listItem: block.listItem ?? null,
    spans: (block.children ?? []).map((c) => [
      c.text,
      (c.marks ?? []).map((m) => defs.get(m) ?? m),
    ]),
  });
};

/**
 * If this block is a typed contact paragraph, the name at its start; else null.
 * A contact paragraph is a plain paragraph ending on ONE link, either to a
 * mailto: address or to the contact page, in one of the two forms the page
 * seed typed.
 */
export function contactName(block: Block): string | null {
  if (!block || block._type !== 'block' || (block.style ?? 'normal') !== 'normal') return null;
  if (block.listItem) return null;
  const defs = Array.isArray(block.markDefs) ? block.markDefs : [];
  if (defs.length !== 1 || defs[0]?._type !== 'link') return null;
  const href = String(defs[0].href ?? '');
  const text = textOf(block);
  const m =
    href.startsWith('mailto:') && text.endsWith(href.slice('mailto:'.length))
      ? /^(.+?), .+, \S+$/.exec(text)
      : href === '/contact'
        ? /^(.+?), .+\. Contact the church office\.$/.exec(text)
        : null;
  return m ? m[1] : null;
}

/** Plan the whole migration. Pure; never throws for bad data, it reports it. */
export function planConnectMinistries(input: ConnectInput): ConnectPlan {
  const errors: string[] = [];
  const plan: ConnectPlan = {
    page: null,
    ministries: [],
    bands: [],
    alreadyConnected: [],
    errors,
  };
  const page = input.page as Doc | null | undefined;
  const ministries = input.ministries as Doc[];
  const staff = input.staff as Doc[];
  const settings = input.settings ?? {};
  if (!page || page._id !== PAGE_ID) {
    errors.push(`${PAGE_ID} is missing from the input.`);
    return plan;
  }
  plan.page = { id: page._id, rev: page._rev };
  const builder: Band[] = Array.isArray(page.pageBuilder) ? page.pageBuilder : [];

  for (const { bandKey, ministryId, anchor } of MINISTRY_BANDS) {
    const band = builder.find((b) => b?._key === bandKey);
    const doc = ministries.find((d) => d?._id === ministryId);
    if (!band) {
      errors.push(`${PAGE_ID} has no band with _key "${bandKey}".`);
      continue;
    }
    if (!doc) {
      errors.push(`No published ministry document "${ministryId}".`);
      continue;
    }
    if (band._type === 'ministrySection') {
      if (band.ministry?._ref === ministryId) {
        plan.alreadyConnected.push(bandKey);
      } else {
        errors.push(
          `${bandKey} is already a Ministry band but points at "${band.ministry?._ref}", not "${ministryId}".`,
        );
      }
      continue;
    }
    if (band._type !== 'imageTextSection' && band._type !== 'richTextSection') {
      errors.push(`${bandKey} is a ${band._type}, not an image or text band.`);
      continue;
    }
    const extra = Object.keys(band).filter((k) => !BAND_KEYS.has(k));
    if (extra.length > 0) {
      errors.push(
        `${bandKey} carries ${extra.join(', ')}, which a Ministry band has nowhere to keep.`,
      );
      continue;
    }
    if (band.anchor?.current !== anchor) {
      errors.push(`${bandKey} jumps to "#${band.anchor?.current}", expected "#${anchor}".`);
      continue;
    }
    if (doc.slug?.current !== anchor) {
      errors.push(`${ministryId} has web address "${doc.slug?.current}", expected "${anchor}".`);
      continue;
    }

    // 1. Split the text from the contact paragraph(s) at its end.
    const body: Block[] = Array.isArray(band.body) ? band.body : [];
    let cut = body.length;
    while (cut > 0 && contactName(body[cut - 1]) !== null) cut -= 1;
    const words = body.slice(0, cut);
    const contactParas = body.slice(cut);
    if (contactParas.length === 0) {
      errors.push(`${bandKey}: no contact paragraph at the end of its text.`);
      continue;
    }

    // 2. One staff member per paragraph, and the generated line must be the
    //    paragraph that is there now.
    const contacts: { staffId: string; name: string }[] = [];
    let bad = false;
    for (const para of contactParas) {
      const name = contactName(para) as string;
      const matches = staff.filter((s) => s?.name === name);
      if (matches.length !== 1) {
        errors.push(
          `${bandKey}: "${name}" matches ${matches.length} staff members` +
            (matches.length ? ` (${matches.map((s) => s._id).join(', ')})` : '') +
            '; it must match exactly one.',
        );
        bad = true;
        continue;
      }
      const person = matches[0];
      const generated = contactBlock(person, 'x');
      if (renderShape(generated) !== renderShape(para)) {
        errors.push(
          `${bandKey}: the line generated from ${person._id} would not match the page.\n` +
            `      page has   ${JSON.stringify(textOf(para))}\n` +
            `      would say  ${JSON.stringify(generated ? textOf(generated as Block) : '(nothing: hidden from the site)')}`,
        );
        bad = true;
        continue;
      }
      contacts.push({ staffId: String(person._id), name: String(person.name) });
    }
    if (bad) continue;

    // 3. The ministry document. Every string goes through the Site settings
    //    placeholders, so the result is the same whichever migration ran first.
    const convert = <T>(value: T): T => placeholdersForTypedCopies(value, settings);
    let placeholderChanges = 0;
    const counted = <T>(value: T): T => {
      const out = convert(value);
      if (JSON.stringify(out) !== JSON.stringify(value)) placeholderChanges += 1;
      return out;
    };
    const set: Record<string, unknown> = {
      ...(band.eyebrow ? { eyebrow: counted(band.eyebrow) } : {}),
      ...(band.heading ? { headline: counted(band.heading) } : {}),
      body: counted(words),
      contacts: contacts.map((c) => ({
        _type: 'reference',
        _ref: c.staffId,
        _key: `contact-${c.staffId}`,
      })),
    };
    const unset: string[] = [];
    let droppedImage: unknown = null;
    if (band.image?.asset) {
      set.image = counted(band.image);
      if (doc.image?.asset?._ref && doc.image.asset._ref !== band.image.asset._ref) {
        droppedImage = doc.image;
      }
    } else if (doc.image) {
      // The band has no photo, so the page shows none; keeping the document's
      // old one would turn a text band into an image band.
      unset.push('image');
      droppedImage = doc.image;
    }
    plan.ministries.push({
      id: ministryId,
      rev: doc._rev,
      bandKey,
      set,
      unset,
      droppedImage,
      oldBodyBlocks: Array.isArray(doc.body) ? doc.body.length : 0,
      contacts,
      placeholderChanges,
    });

    // 4. The band.
    plan.bands.push({
      bandKey,
      fromType: band._type,
      band: {
        _type: 'ministrySection',
        _key: band._key,
        ministry: { _type: 'reference', _ref: ministryId },
        ...(band.imageSide ? { imageSide: band.imageSide } : {}),
        ...(band.anchor ? { anchor: band.anchor } : {}),
      },
    });
  }
  return plan;
}

/** The Sanity patch paths the page change sets: one per band, by _key. */
export function pageSetPatch(plan: ConnectPlan): Record<string, unknown> {
  return Object.fromEntries(plan.bands.map((b) => [`pageBuilder[_key=="${b.bandKey}"]`, b.band]));
}

/**
 * The documents as they would be AFTER the plan ran. Pure: returns new objects
 * and leaves the input alone. Used by the parity simulation, so the thing that
 * was proven is the plan itself, not a second copy of its logic.
 */
export function applyConnectPlan(input: readonly unknown[], plan: ConnectPlan): Doc[] {
  const docs = input as Doc[];
  const byMinistry = new Map(plan.ministries.map((m) => [m.id, m]));
  const byBand = new Map(plan.bands.map((b) => [b.bandKey, b.band]));
  return docs.map((doc) => {
    const change = byMinistry.get(String(doc?._id));
    if (change) {
      const next: Doc = { ...doc, ...structuredClone(change.set) };
      for (const field of change.unset) delete next[field];
      return next;
    }
    if (plan.page && doc?._id === plan.page.id && Array.isArray(doc.pageBuilder)) {
      return {
        ...doc,
        pageBuilder: doc.pageBuilder.map((b) =>
          b?._key && byBand.has(b._key) ? (structuredClone(byBand.get(b._key)) as Band) : b,
        ),
      };
    }
    return doc;
  });
}
