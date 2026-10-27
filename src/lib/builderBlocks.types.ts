// Safe to edit by hand
// The builder kit's blocks as the GROQ projection hands them to the page
// (src/sanity/schemaTypes/builderSections.ts, starter PORTS.md card 173). Images
// arrive projected (IMAGE_PROJECTION) and buttons with their page link resolved
// (CTA_PROJECTION), through the arms in src/lib/queries.ts. Written by hand
// rather than read from sanity.types.ts so a component can be typed against the
// projected shape, which typegen does not know.
import type { ProjectedCtaBlock, ProjectedImage } from './pageBuilder.types';
import type { ChurchFactsSettings } from './church-facts';

/** Portable text as stored; rendered by PortableText. */
type Blocks = unknown[];

interface Base {
  _key: string;
  heading?: string;
  intro?: string;
  anchor?: { current?: string | null } | null;
}

export interface ProjectedColumnsSection extends Base {
  _type: 'columnsSection';
  textColumns?: { _key: string; heading?: string; body?: Blocks }[];
}

export interface ProjectedButtonRowSection extends Base {
  _type: 'buttonRowSection';
  links?: { _key: string; link?: ProjectedCtaBlock | null }[];
}

export interface ProjectedPhotoSection {
  _type: 'photoSection';
  _key: string;
  image?: ProjectedImage | null;
  anchor?: { current?: string | null } | null;
}

export interface ProjectedTabsSection extends Base {
  _type: 'tabsSection';
  tabs?: { _key: string; label?: string; body?: Blocks }[];
}

export interface ProjectedCountdownSection {
  _type: 'countdownSection';
  _key: string;
  eventName?: string;
  startDate?: string;
  endDate?: string;
  intro?: string;
  duringText?: string;
  afterText?: string;
  link?: ProjectedCtaBlock | null;
  anchor?: { current?: string | null } | null;
}

export interface ProjectedNoticeSection {
  _type: 'noticeSection';
  _key: string;
  message?: string;
  urgency?: string;
  label?: string;
  link?: ProjectedCtaBlock | null;
  startDate?: string;
  endDate?: string;
  anchor?: { current?: string | null } | null;
}

export interface ProjectedEventDetailsSection {
  _type: 'eventDetailsSection';
  _key: string;
  eyebrow?: string;
  title?: string;
  occurrences?: {
    _key?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    label?: string;
  }[];
  place?: string;
  note?: string;
  image?: ProjectedImage | null;
  button?: ProjectedCtaBlock | null;
  showCalendar?: boolean;
  anchor?: { current?: string | null } | null;
}

export interface ProjectedScheduleSection extends Base {
  _type: 'scheduleSection';
  days?: {
    _key: string;
    title?: string;
    items?: { _key: string; startTime?: string; title?: string; note?: string }[];
  }[];
}

/** Every builder-kit block, as BuilderBlock.astro receives it. */

// ── Card 193 ────────────────────────────────────────────────────────────────

export interface ProjectedContactCardSection extends Base {
  _type: 'contactCardSection';
  callButtons?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  /** Set only by the styleguide wall's fixture (card 198): Site settings-shaped church facts. */
  facts?: ChurchFactsSettings | null;
}

export interface ProjectedProgressSection extends Base {
  _type: 'progressSection';
  unit?: string;
  goal?: number;
  raised?: number;
  asOf?: string;
  link?: ProjectedCtaBlock | null;
}

export interface ProjectedCalendarSubscribeSection extends Base {
  _type: 'calendarSubscribeSection';
  feed?: string;
}

export interface ProjectedIconCardsSection extends Base {
  _type: 'iconCardsSection';
  cards?: {
    _key: string;
    icon?: string;
    image?: ProjectedImage | null;
    title?: string;
    body?: string;
    note?: string;
    link?: ProjectedCtaBlock | null;
  }[];
}

export interface ProjectedStepsRailSection extends Base {
  _type: 'stepsRailSection';
  steps?: {
    _key: string;
    icon?: string;
    title?: string;
    body?: string;
    link?: ProjectedCtaBlock | null;
  }[];
  firstStepCard?: boolean;
  endHeading?: string;
  link?: ProjectedCtaBlock | null;
}

export interface ProjectedHubSection extends Base {
  _type: 'hubSection';
  groups?: {
    _key: string;
    title?: string;
    line?: string;
    cards?: {
      _key: string;
      image?: ProjectedImage | null;
      icon?: string;
      title?: string;
      label?: string;
      when?: string;
      place?: string;
      body?: string;
      link?: ProjectedCtaBlock | null;
    }[];
  }[];
}

export type BuilderPageBlock =
  | ProjectedColumnsSection
  | ProjectedButtonRowSection
  | ProjectedPhotoSection
  | ProjectedTabsSection
  | ProjectedCountdownSection
  | ProjectedNoticeSection
  | ProjectedEventDetailsSection
  | ProjectedScheduleSection
  | ProjectedContactCardSection
  | ProjectedProgressSection
  | ProjectedCalendarSubscribeSection
  | ProjectedIconCardsSection
  | ProjectedStepsRailSection
  | ProjectedHubSection;

/** The `_type` of every builder-kit block, for SectionRenderer's one branch. */
export const BUILDER_BLOCK_TYPES: ReadonlySet<string> = new Set<BuilderPageBlock['_type']>([
  'columnsSection',
  'buttonRowSection',
  'photoSection',
  'tabsSection',
  'countdownSection',
  'noticeSection',
  'eventDetailsSection',
  'scheduleSection',
  'contactCardSection',
  'progressSection',
  'calendarSubscribeSection',
  'iconCardsSection',
  'stepsRailSection',
  'hubSection',
]);

export const isBuilderBlock = (b: { _type: string }): b is BuilderPageBlock =>
  BUILDER_BLOCK_TYPES.has(b._type);
