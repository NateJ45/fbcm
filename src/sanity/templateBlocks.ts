// Safe to edit by hand
// =============================================================================
// Small builders for the church's page templates and saved sections
// =============================================================================
// Used by src/sanity/pageTemplates.ts and src/sanity/sectionPatterns.ts (the
// authoring kit, PORTS.md card 109), so a template reads as a page outline and
// not as a wall of Sanity objects. Each builder returns one block in the exact
// shape the schema stores (src/sanity/schemaTypes/sections.ts and
// churchSections.ts). Keys are left out on purpose: freshKeys() gives every
// array member a new one each time a page is made.
//
// The copy rules every template follows (checked by src/lib/authoring.test.ts):
//   - Anything the church has to decide (a name, a date, a time that is not
//     the Sunday service, a claim about how something is run) starts
//     "Example:", so the page builder warns until it is replaced.
//   - Facts that live in Site settings are never typed: the placeholders
//     {service time}, {address}, {phone} and {email} fill themselves in, and a
//     button can point at {connect}, {prayer}, {calendar} or {giving} (the
//     Church systems links, which say "coming soon" honestly until Church Trac
//     is set up).
//   - US English, no em-dashes (rule 2), no prices. Bible verses in the King
//     James Version, so no translation's copyright is in question.
//
// No `sanity` import here: node --test loads this file directly.
// =============================================================================

import { EXAMPLE_PREFIX } from '../lib/authoring.ts';

export type Rec = Record<string, unknown>;

/** Mark a line as example text the church must replace. */
export const example = (text: string): string => `${EXAMPLE_PREFIX} ${text}`;

/** One Portable Text paragraph. */
export const para = (text: string, style = 'normal'): Rec => ({
  _type: 'block',
  style,
  markDefs: [],
  children: [{ _type: 'span', marks: [], text }],
});

/** Several paragraphs. */
export const paras = (...texts: string[]): Rec[] => texts.map((t) => para(t));

/** A button the editor points at one of the church's own pages. */
export const button = (label: string): Rec => ({ _type: 'ctaBlock', label, linkType: 'internal' });

/**
 * A button to a Church systems link ({connect}, {prayer}, {calendar},
 * {giving}...). The address is filled in from Site settings at build time.
 */
export const systemButton = (label: string, token: string): Rec => ({
  _type: 'ctaBlock',
  label,
  linkType: 'external',
  externalUrl: token,
});

export function hero(o: {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  primary?: Rec;
  secondary?: Rec;
}): Rec {
  return {
    _type: 'heroSection',
    ...(o.eyebrow ? { eyebrow: o.eyebrow } : {}),
    headline: o.headline,
    ...(o.subhead ? { subhead: o.subhead } : {}),
    size: 'short',
    ...(o.primary ? { primaryCta: o.primary } : {}),
    ...(o.secondary ? { secondaryCta: o.secondary } : {}),
  };
}

export const richText = (heading: string, body: string[], eyebrow?: string): Rec => ({
  _type: 'richTextSection',
  ...(eyebrow ? { eyebrow } : {}),
  heading,
  body: paras(...body),
});

export const imageText = (
  heading: string,
  body: string[],
  o: { eyebrow?: string; cta?: Rec; side?: 'left' | 'right' } = {},
): Rec => ({
  _type: 'imageTextSection',
  imageSide: o.side ?? 'right',
  ...(o.eyebrow ? { eyebrow: o.eyebrow } : {}),
  heading,
  body: paras(...body),
  ...(o.cta ? { cta: o.cta } : {}),
});

export const ctaBand = (headline: string, subhead: string, cta: Rec, eyebrow?: string): Rec => ({
  _type: 'ctaBandSection',
  ...(eyebrow ? { eyebrow } : {}),
  headline,
  subhead,
  cta,
});

export const quote = (text: string, attribution: string): Rec => ({
  _type: 'quoteSection',
  quote: text,
  attribution,
});

/** A Bible verse band (King James Version). */
export const scripture = (verse: string, reference: string, heading?: string): Rec => ({
  _type: 'scriptureBandSection',
  ...(heading ? { heading } : {}),
  verse,
  reference,
});

/** One time on a Sunday-times band: a label, the big line, a sentence. */
export const time = (label: string, big: string, body = ''): Rec => ({
  _type: 'timeItem',
  label,
  big,
  ...(body ? { body } : {}),
});

/** The Sunday-times band: when, plus up to three short notes. */
export const times = (
  heading: string,
  items: Rec[],
  notes: string[] = [],
  eyebrow?: string,
): Rec => ({
  _type: 'sundayTimesSection',
  ...(eyebrow ? { eyebrow } : {}),
  heading,
  items,
  notes: notes.slice(0, 3),
});

/** One question and its answer. */
export const qa = (question: string, answer: string): Rec => ({
  _type: 'faqItem',
  question,
  answer: [para(answer)],
});

export const faq = (heading: string, items: Rec[], eyebrow?: string): Rec => ({
  _type: 'faqSection',
  ...(eyebrow ? { eyebrow } : {}),
  heading,
  items,
});

/** One link card: a title, a sentence and a button. */
export const card = (title: string, body: string, cta: Rec): Rec => ({
  _type: 'linkCard',
  title,
  body,
  cta,
});

export const cards = (heading: string, items: Rec[], intro?: string): Rec => ({
  _type: 'linkCardsSection',
  heading,
  ...(intro ? { intro } : {}),
  cards: items,
});

/** One row of a timeline: a marker (a date or a step) and what happened. */
export const row = (marker: string, title: string, body: string): Rec => ({
  _type: 'timelineRow',
  marker,
  title,
  body: [para(body)],
});

export const timeline = (heading: string, rows: Rec[], eyebrow?: string): Rec => ({
  _type: 'timelineSection',
  ...(eyebrow ? { eyebrow } : {}),
  heading,
  rows,
});

/** A Church Trac form band: the editor picks the form (Church Trac forms in the desk). */
export const churchTracForm = (heading: string, intro: string): Rec => ({
  _type: 'churchTracFormSection',
  heading,
  intro,
});

/** A list of documents to open (PDFs uploaded or linked). */
export const documents = (heading: string): Rec => ({
  _type: 'documentListSection',
  heading,
  docs: [],
});

export const gallery = (heading: string): Rec => ({
  _type: 'gallerySection',
  heading,
  columns: 3,
  images: [],
});

export const video = (heading: string, caption: string): Rec => ({
  _type: 'videoSection',
  heading,
  caption,
});

/** The give band. Its button goes to the {giving} link when left empty. */
export const give = (heading: string, body: string): Rec => ({
  _type: 'giveBandSection',
  heading,
  body,
});

// ── The builder kit (builderSections.ts, starter PORTS.md card 173) ──────────

/**
 * A calendar day `days` from today, as YYYY-MM-DD. Templates use it so a new
 * event page opens with dates in the future (an event or countdown whose dates
 * have passed draws nothing), and the editor changes them to the real ones.
 */
export const daysFromNow = (days: number, from = new Date()): string => {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + days));
  return d.toISOString().slice(0, 10);
};

export const column = (heading: string, ...body: string[]): Rec => ({
  _type: 'textColumn',
  heading,
  body: paras(...body),
});

export const columns = (heading: string, cols: Rec[], intro?: string): Rec => ({
  _type: 'columnsSection',
  ...(heading ? { heading } : {}),
  ...(intro ? { intro } : {}),
  textColumns: cols,
});

export const buttonRow = (heading: string, links: Rec[], intro?: string): Rec => ({
  _type: 'buttonRowSection',
  ...(heading ? { heading } : {}),
  ...(intro ? { intro } : {}),
  links: links.map((link) => ({ _type: 'quickLink', link })),
});

export const tab = (label: string, ...body: string[]): Rec => ({
  _type: 'tabPanel',
  label,
  body: paras(...body),
});

export const tabs = (heading: string, panels: Rec[], intro?: string): Rec => ({
  _type: 'tabsSection',
  ...(heading ? { heading } : {}),
  ...(intro ? { intro } : {}),
  tabs: panels,
});

export const countdown = (o: {
  eventName: string;
  startDate: string;
  endDate?: string;
  intro?: string;
  link?: Rec;
}): Rec => ({
  _type: 'countdownSection',
  eventName: o.eventName,
  startDate: o.startDate,
  ...(o.endDate ? { endDate: o.endDate } : {}),
  ...(o.intro ? { intro: o.intro } : {}),
  duringText: 'It is happening now. Come and join us!',
  afterText: 'Thank you to everyone who came!',
  ...(o.link ? { link: o.link } : {}),
});

export const notice = (
  message: string,
  o: { urgency?: 'info' | 'urgent'; label?: string; startDate?: string; endDate?: string } = {},
): Rec => ({
  _type: 'noticeSection',
  message,
  urgency: o.urgency ?? 'info',
  ...(o.label ? { label: o.label } : {}),
  ...(o.startDate ? { startDate: o.startDate } : {}),
  ...(o.endDate ? { endDate: o.endDate } : {}),
});

export const eventDate = (
  date: string,
  o: { startTime?: string; endTime?: string; label?: string } = {},
): Rec => ({
  _type: 'eventDate',
  date,
  ...(o.startTime ? { startTime: o.startTime } : {}),
  ...(o.endTime ? { endTime: o.endTime } : {}),
  ...(o.label ? { label: o.label } : {}),
});

/** Event details. With no `place` it is at the church (Site settings fills it in). */
export const eventDetails = (o: {
  eyebrow?: string;
  title: string;
  dates: Rec[];
  place?: string;
  note?: string;
  button?: Rec;
}): Rec => ({
  _type: 'eventDetailsSection',
  ...(o.eyebrow ? { eyebrow: o.eyebrow } : {}),
  title: o.title,
  occurrences: o.dates,
  ...(o.place ? { place: o.place } : {}),
  ...(o.note ? { note: o.note } : {}),
  ...(o.button ? { button: o.button } : {}),
  showCalendar: true,
});

export const slot = (startTime: string, title: string, note?: string): Rec => ({
  _type: 'scheduleItem',
  ...(startTime ? { startTime } : {}),
  title,
  ...(note ? { note } : {}),
});

export const scheduleDay = (title: string, items: Rec[]): Rec => ({
  _type: 'scheduleDay',
  ...(title ? { title } : {}),
  items,
});

export const schedule = (heading: string, days: Rec[], intro?: string): Rec => ({
  _type: 'scheduleSection',
  ...(heading ? { heading } : {}),
  ...(intro ? { intro } : {}),
  days,
});
