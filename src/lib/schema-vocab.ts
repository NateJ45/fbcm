// Foundation, edit with care
// An OFFLINE validator for the site's JSON-LD (2026-09-24, the craft-details
// pass). It knows the schema.org types this site emits, the properties each
// one may carry (inherited ones included), the enumeration values it uses, and
// the fields Google's structured-data docs call required for the rich results
// that apply (Event, Article/BlogPosting, BreadcrumbList).
//
// It is deliberately narrow: a type the site does not use is an ERROR here, so
// a new node has to be added to this vocabulary on purpose, from schema.org's
// own type page, rather than slipping through a validator that knows nothing.
// The property lists are copied from schema.org (v29, read 2026-09-24),
// trimmed to what a church site could plausibly use.
//
// Used by church-schema.test.ts (every node builder) and by
// scripts/validate-jsonld.mjs (every <script type="application/ld+json"> in a
// built dist/, with the one-block-per-type check).

type Json = Record<string, unknown>;

const THING = [
  'name',
  'alternateName',
  'description',
  'url',
  'image',
  'sameAs',
  'identifier',
  'mainEntityOfPage',
  'potentialAction',
  'subjectOf',
];
const PLACE = [
  ...THING,
  'address',
  'geo',
  'telephone',
  'faxNumber',
  'logo',
  'photo',
  'hasMap',
  'openingHoursSpecification',
  'specialOpeningHoursSpecification',
  'event',
  'containedInPlace',
  'containsPlace',
  'isAccessibleForFree',
  'publicAccess',
  'amenityFeature',
  'maximumAttendeeCapacity',
  'latitude',
  'longitude',
  'keywords',
  'slogan',
];
const CIVIC = [...PLACE, 'openingHours'];
const ORGANIZATION = [
  ...THING,
  'address',
  'email',
  'telephone',
  'faxNumber',
  'logo',
  'location',
  'founder',
  'foundingDate',
  'foundingLocation',
  'member',
  'parentOrganization',
  'subOrganization',
  'contactPoint',
  'areaServed',
  'event',
  'keywords',
  'slogan',
  'legalName',
  'department',
  'employee',
  'publishingPrinciples',
];
const INTANGIBLE = THING;
const CREATIVE_WORK = [
  ...THING,
  'about',
  'abstract',
  'author',
  'citation',
  'copyrightHolder',
  'copyrightYear',
  'creator',
  'dateCreated',
  'dateModified',
  'datePublished',
  'genre',
  'headline',
  'inLanguage',
  'isPartOf',
  'hasPart',
  'keywords',
  'license',
  'mentions',
  'publisher',
  'text',
  'thumbnailUrl',
  'wordCount',
];
const ARTICLE = [...CREATIVE_WORK, 'articleBody', 'articleSection', 'backstory', 'speakable'];
const CONTACT_POINT = [
  ...THING,
  'email',
  'telephone',
  'contactType',
  'areaServed',
  'hoursAvailable',
];
const STRUCTURED_VALUE = THING;

/** Each type the site emits, with every property it may carry. */
export const TYPES: Record<string, readonly string[]> = {
  Thing: THING,
  Place: PLACE,
  CivicStructure: CIVIC,
  PlaceOfWorship: CIVIC,
  Church: CIVIC,
  Organization: ORGANIZATION,
  Person: [...THING, 'email', 'telephone', 'jobTitle', 'affiliation', 'worksFor'],
  Event: [
    ...THING,
    'about',
    'audience',
    'doorTime',
    'duration',
    'endDate',
    'eventAttendanceMode',
    'eventSchedule',
    'eventStatus',
    'inLanguage',
    'isAccessibleForFree',
    'keywords',
    'location',
    'maximumAttendeeCapacity',
    'offers',
    'organizer',
    'performer',
    'previousStartDate',
    'startDate',
    'subEvent',
    'superEvent',
  ],
  Schedule: [
    ...INTANGIBLE,
    'byDay',
    'byMonth',
    'byMonthDay',
    'byMonthWeek',
    'duration',
    'endDate',
    'endTime',
    'exceptDate',
    'repeatCount',
    'repeatFrequency',
    'scheduleTimezone',
    'startDate',
    'startTime',
  ],
  VirtualLocation: INTANGIBLE,
  PostalAddress: [
    ...CONTACT_POINT,
    'streetAddress',
    'addressLocality',
    'addressRegion',
    'postalCode',
    'addressCountry',
    'postOfficeBoxNumber',
  ],
  GeoCoordinates: [
    ...STRUCTURED_VALUE,
    'latitude',
    'longitude',
    'elevation',
    'address',
    'postalCode',
    'addressCountry',
  ],
  ItemList: [...INTANGIBLE, 'itemListElement', 'itemListOrder', 'numberOfItems'],
  BreadcrumbList: [...INTANGIBLE, 'itemListElement', 'itemListOrder', 'numberOfItems'],
  ListItem: [...INTANGIBLE, 'item', 'position', 'nextItem', 'previousItem'],
  CreativeWork: CREATIVE_WORK,
  Book: [...CREATIVE_WORK, 'bookEdition', 'bookFormat', 'illustrator', 'isbn', 'numberOfPages'],
  WebPage: [...CREATIVE_WORK, 'breadcrumb', 'primaryImageOfPage', 'lastReviewed'],
  Blog: [...CREATIVE_WORK, 'blogPost'],
  Article: ARTICLE,
  SocialMediaPosting: [...ARTICLE, 'sharedContent'],
  BlogPosting: [...ARTICLE, 'sharedContent'],
  ImageObject: [...CREATIVE_WORK, 'contentUrl', 'width', 'height', 'caption', 'encodingFormat'],
};

const ENUMS: Record<string, readonly string[]> = {
  eventStatus: [
    'https://schema.org/EventScheduled',
    'https://schema.org/EventCancelled',
    'https://schema.org/EventPostponed',
    'https://schema.org/EventRescheduled',
    'https://schema.org/EventMovedOnline',
  ],
  eventAttendanceMode: [
    'https://schema.org/OfflineEventAttendanceMode',
    'https://schema.org/OnlineEventAttendanceMode',
    'https://schema.org/MixedEventAttendanceMode',
  ],
  byDay: [
    'https://schema.org/Monday',
    'https://schema.org/Tuesday',
    'https://schema.org/Wednesday',
    'https://schema.org/Thursday',
    'https://schema.org/Friday',
    'https://schema.org/Saturday',
    'https://schema.org/Sunday',
  ],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?([+-]\d{2}:\d{2}|Z)?)?$/;
const ISO_DURATION = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/;
const TIME = /^\d{2}:\d{2}(:\d{2})?$/;
const DATE_PROPS = ['startDate', 'endDate', 'datePublished', 'dateModified', 'dateCreated'];

const typesOf = (node: Json): string[] => {
  const t = node['@type'];
  return Array.isArray(t) ? t.map(String) : typeof t === 'string' ? [t] : [];
};
const isObj = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);
const isRef = (v: Json): boolean => Object.keys(v).every((k) => k === '@id') && '@id' in v;

/** Every problem with one node and everything nested in it; [] when valid. */
export function validateNode(node: Json, path = '$', root = true): string[] {
  const errors: string[] = [];
  if (isRef(node)) return errors;
  const types = typesOf(node);
  if (types.length === 0) return [`${path}: no @type`];
  const allowed = new Set<string>(['@context', '@type', '@id']);
  for (const t of types) {
    const props = TYPES[t];
    if (!props) {
      errors.push(`${path}: unknown type ${t}`);
      continue;
    }
    for (const p of props) allowed.add(p);
  }
  if (root && node['@context'] !== 'https://schema.org') {
    errors.push(`${path}: @context must be https://schema.org`);
  }

  for (const [key, value] of Object.entries(node)) {
    if (!allowed.has(key)) errors.push(`${path}.${key}: not a property of ${types.join('/')}`);
    if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
      errors.push(`${path}.${key}: empty`);
    }
    const enumValues = ENUMS[key];
    if (enumValues && typeof value === 'string' && !enumValues.includes(value)) {
      errors.push(`${path}.${key}: ${value} is not one of its enumeration values`);
    }
    if (DATE_PROPS.includes(key) && typeof value === 'string' && !ISO_DATE.test(value)) {
      errors.push(`${path}.${key}: ${value} is not an ISO 8601 date`);
    }
    if ((key === 'duration' || key === 'repeatFrequency') && typeof value === 'string') {
      if (!ISO_DURATION.test(value))
        errors.push(`${path}.${key}: ${value} is not an ISO 8601 duration`);
    }
    if ((key === 'startTime' || key === 'endTime') && types.includes('Schedule')) {
      if (typeof value !== 'string' || !TIME.test(value))
        errors.push(`${path}.${key}: not hh:mm:ss`);
    }
    if ((key === 'url' || key === 'item' || key === 'logo') && typeof value === 'string') {
      if (!/^https:\/\//.test(value)) errors.push(`${path}.${key}: not an absolute https URL`);
    }
    const children = Array.isArray(value) ? value : [value];
    children.forEach((child, i) => {
      if (isObj(child)) {
        errors.push(
          ...validateNode(
            child,
            Array.isArray(value) ? `${path}.${key}[${i}]` : `${path}.${key}`,
            false,
          ),
        );
      }
    });
  }

  // Google's required fields, for the rich results that apply.
  if (types.includes('Event') && root) {
    for (const p of ['name', 'startDate', 'location']) {
      if (!(p in node)) errors.push(`${path}: Google requires ${p} on an Event`);
    }
    const locations = Array.isArray(node.location) ? node.location : [node.location];
    for (const loc of locations) {
      if (!isObj(loc)) continue;
      const lt = typesOf(loc);
      if (lt.includes('Place') && !loc.address)
        errors.push(`${path}.location: a Place needs an address`);
      if (lt.includes('VirtualLocation') && !loc.url)
        errors.push(`${path}.location: a VirtualLocation needs a url`);
    }
  }
  if (types.includes('BlogPosting') || types.includes('Article')) {
    for (const p of ['headline', 'datePublished', 'author', 'image']) {
      if (!(p in node)) errors.push(`${path}: Google recommends ${p} on an article`);
    }
    if (typeof node.headline === 'string' && node.headline.length > 110) {
      errors.push(`${path}.headline: longer than 110 characters`);
    }
  }
  if (types.includes('BreadcrumbList')) {
    const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
    if (items.length === 0) errors.push(`${path}: a BreadcrumbList needs items`);
    items.forEach((it, i) => {
      if (!isObj(it)) return;
      if (it.position !== i + 1)
        errors.push(`${path}.itemListElement[${i}]: position should be ${i + 1}`);
      if (!it.name) errors.push(`${path}.itemListElement[${i}]: needs a name`);
      if (!it.item && i !== items.length - 1)
        errors.push(`${path}.itemListElement[${i}]: needs an item`);
    });
  }
  return errors;
}

/**
 * The problems with a whole page's JSON-LD blocks: each block on its own, and
 * across them no two blocks of the same type or with the same @id.
 */
export function validatePage(blocks: Json[]): string[] {
  const errors: string[] = [];
  const seenTypes = new Map<string, number>();
  const seenIds = new Map<string, number>();
  blocks.forEach((b, i) => {
    errors.push(...validateNode(b, `block[${i}]`, true));
    const key = typesOf(b).sort().join('+');
    if (seenTypes.has(key))
      errors.push(`block[${i}]: a second ${key} block (first is block[${seenTypes.get(key)}])`);
    else seenTypes.set(key, i);
    const id = typeof b['@id'] === 'string' ? b['@id'] : '';
    if (id) {
      if (seenIds.has(id)) errors.push(`block[${i}]: @id ${id} repeats block[${seenIds.get(id)}]`);
      else seenIds.set(id, i);
    }
  });
  return errors;
}
