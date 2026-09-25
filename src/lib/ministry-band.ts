// scaffold-file: church
// Safe to edit by hand
// =============================================================================
// ministry-band - a Ministry band becomes the band it draws as
// =============================================================================
// WHY (CLAUDE.md rule 15). The five ministry bands on /ministries used to hold
// their own copy of each ministry's words, and each ended with a contact line
// ("Molly Flodder, Worship Coordinator, worship@...") typed in at SEED time
// from the staff documents. When a coordinator changed, the line went stale,
// and the five `ministry` documents sat beside them holding a second, older
// copy of the same text that no page read. Now the ministry DOCUMENT is the one
// home: the band only points at it, and the contact lines are generated here,
// at build time, from the people the document names.
//
// WHAT THIS DOES. resolveMinistryBands() runs over the page-builder array
// BEFORE SectionRenderer classifies it, and replaces each ministrySection with
// the exact block it renders as:
//
//   - the ministry has a photo  -> an imageTextSection (eyebrow, heading, body,
//                                   photo, photo side, anchor)
//   - it has none               -> a richTextSection   (eyebrow, heading, body,
//                                   anchor)
//
// Doing it before classification rather than inside a component is the point:
// the surface cadence, the spare-image pool (an image band lends its photo, a
// text band has none to lend) and the heading grammar all treat the band as the
// band it draws as, so swapping a typed band for a Ministry band moves nothing
// else on the page. The `_key` and the `anchor` are the band's own, so the
// preview's section controls and /ministries#youth keep working.
//
// PURE on purpose, and imported with relative paths and extensions, so the node
// unit tests can load it (ministry-band.test.ts).
// =============================================================================
import type {
  PageBuilderBlock,
  ProjectedImageTextSection,
  ProjectedMinistryContact,
  ProjectedMinistrySection,
  ProjectedRichTextSection,
  RenderedBlock,
} from './pageBuilder.types';
import { splitStega } from './preview-stega.ts';
import { goalIndex } from './ministry-goals.ts';
import { NEWSLETTERS } from './church-trac-newsletters.ts';

/** The link a contact line ends on when the person has no email address. */
export const CONTACT_OFFICE_LABEL = 'Contact the church office';
export const CONTACT_OFFICE_HREF = '/contact';

/**
 * A string with any preview stega payload removed and the ends trimmed. Used
 * for DECISIONS (is it empty?) and for the mailto target, never for the text a
 * visitor reads: that keeps its payload, so click-to-edit on a contact line in
 * the preview opens the staff member it came from.
 */
const clean = (value: unknown): string =>
  typeof value === 'string' ? splitStega(value).cleaned.trim() : '';

/** A Portable Text span, as the page bands store them. */
export interface ContactSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
}

/** One contact paragraph, shaped exactly like the ones the page seed typed. */
export interface ContactBlock {
  _type: 'block';
  _key: string;
  style: 'normal';
  markDefs: { _type: 'link'; _key: string; href: string }[];
  children: ContactSpan[];
}

/** True when this person should be listed at all. */
export function isListed(person: ProjectedMinistryContact | null | undefined): boolean {
  return !!person && person.showOnSite !== false && clean(person.name) !== '';
}

/**
 * One contact paragraph for one person, in the format scripts/pages/
 * ministries.mjs typed until 2026-09-22:
 *
 *   email on file:  Molly Flodder, Worship Coordinator, [worship@...](mailto:worship@...)
 *   no email:       Jaden Johnson, Children's Ministry Coordinator. [Contact the church office](/contact).
 *
 * The span split is the same as the seed's too (text, link, and a trailing "."
 * in the second form), because React renders two adjacent text spans with a
 * comment between them and the live markup would otherwise change.
 *
 * Returns null for someone who is not listed (see isListed).
 */
export function contactBlock(
  person: ProjectedMinistryContact | null | undefined,
  key: string,
): ContactBlock | null {
  if (!person || !isListed(person)) return null;
  const who = [person.name, person.role]
    .filter((part): part is string => clean(part) !== '')
    .join(', ');
  const email = clean(person.email);
  const link = `${key}l1`;
  if (email) {
    return {
      _type: 'block',
      _key: key,
      style: 'normal',
      markDefs: [{ _type: 'link', _key: link, href: `mailto:${email}` }],
      children: [
        { _type: 'span', _key: `${key}s1`, text: `${who}, `, marks: [] },
        // The address as stored, so the preview keeps its edit payload.
        { _type: 'span', _key: `${key}s2`, text: String(person.email), marks: [link] },
      ],
    };
  }
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [{ _type: 'link', _key: link, href: CONTACT_OFFICE_HREF }],
    children: [
      { _type: 'span', _key: `${key}s1`, text: `${who}. `, marks: [] },
      { _type: 'span', _key: `${key}s2`, text: CONTACT_OFFICE_LABEL, marks: [link] },
      { _type: 'span', _key: `${key}s3`, text: '.', marks: [] },
    ],
  };
}

/** A stable block key for one person's line. */
const contactKey = (person: ProjectedMinistryContact, index: number): string => {
  const id = clean(person._id).replace(/[^A-Za-z0-9_-]/g, '');
  return `contact-${id || index + 1}`;
};

/** Every listed person's contact paragraph, in the order the document names them. */
export function contactBlocks(
  people: (ProjectedMinistryContact | null)[] | null | undefined,
): ContactBlock[] {
  const out: ContactBlock[] = [];
  (Array.isArray(people) ? people : []).forEach((person, i) => {
    if (!person) return;
    const block = contactBlock(person, contactKey(person, i));
    if (block) out.push(block);
  });
  return out;
}

/**
 * The ministry's newsletter line, when it has one (2026-09-25): "Read The
 * Kid's Corner, the Children's Ministry newsletter." linking to its page on
 * this site. Derived from the ministry's web address and the list in
 * src/lib/church-trac-newsletters.ts, so nobody types it (rule 15). Null for a
 * ministry with no newsletter.
 */
export function newsletterBlock(
  slug: string | null | undefined,
  key = 'newsletter',
): ContactBlock | null {
  const want = clean(slug)
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .toLowerCase();
  const n = NEWSLETTERS.find((x) => x.ministry === want);
  if (!want || !n) return null;
  const link = `${key}l1`;
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [{ _type: 'link', _key: link, href: `/${n.slug}` }],
    children: [
      { _type: 'span', _key: `${key}s1`, text: 'Read ', marks: [] },
      { _type: 'span', _key: `${key}s2`, text: n.fallbackTitle, marks: [link] },
      { _type: 'span', _key: `${key}s3`, text: `, the ${n.eyebrow.toLowerCase()}.`, marks: [] },
    ],
  };
}

/**
 * The block a ministrySection renders as, or null when it points at nothing
 * (no reference yet, or a ministry that is not published). A band with nothing
 * behind it draws nothing, rather than an empty heading over empty columns.
 */
export function ministryBandAs(
  section: ProjectedMinistrySection,
): ProjectedImageTextSection | ProjectedRichTextSection | null {
  const ministry = section.ministry;
  if (!ministry) return null;
  const newsletter = newsletterBlock(ministry.slug);
  const body = [
    ...(Array.isArray(ministry.body) ? ministry.body : []),
    ...(newsletter ? [newsletter] : []),
    ...contactBlocks(ministry.contacts),
  ];
  // The headline is the band's heading; a ministry with none yet falls back
  // to its name, so the band is never a paragraph with no title over it.
  const heading = (clean(ministry.headline) ? ministry.headline : ministry.title) ?? undefined;
  const eyebrow = ministry.eyebrow ?? undefined;
  const anchor = section.anchor ?? undefined;
  if (ministry.image?.asset) {
    return {
      _type: 'imageTextSection',
      _key: section._key,
      anchor,
      image: ministry.image,
      imageSide: section.imageSide === 'right' ? 'right' : 'left',
      eyebrow,
      heading,
      body,
    } as ProjectedImageTextSection;
  }
  return {
    _type: 'richTextSection',
    _key: section._key,
    anchor,
    eyebrow,
    heading,
    body,
  } as ProjectedRichTextSection;
}

/**
 * Resolve every ministrySection in a page-builder array into the block it
 * draws as. Everything else passes through untouched, in order.
 *
 * THE GOAL INDEX (2026-09-24, the Ministries identity pass). When any Ministry
 * band on the page names the goal its ministry serves, the derived goal index
 * (src/lib/ministry-goals.ts) is drawn once, in front of the FIRST Ministry
 * band: the church's four goals, each with its ministries linked to their
 * bands. It is derived from the documents, so it cannot disagree with them
 * (CLAUDE.md rule 15), and with no goal answered it is not drawn at all.
 */
export function resolveMinistryBands(
  sections: PageBuilderBlock[] | null | undefined,
): RenderedBlock[] {
  const list = Array.isArray(sections) ? sections : [];
  const index = goalIndex(
    list.filter(
      (b): b is ProjectedMinistrySection =>
        !!b && typeof b === 'object' && b._type === 'ministrySection',
    ),
  );
  let indexPlaced = index === null;
  const out: RenderedBlock[] = [];
  for (const block of list) {
    if (!block || typeof block !== 'object') continue;
    if (block._type === 'ministrySection') {
      const resolved = ministryBandAs(block);
      if (resolved) {
        if (!indexPlaced && index) {
          out.push(index);
          indexPlaced = true;
        }
        out.push(resolved);
      }
      continue;
    }
    out.push(block);
  }
  return out;
}
