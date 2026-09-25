// Registers every schema type with the Studio.
// Order doesn't affect runtime; alphabetical here for readability.

import { announcement } from './announcement';
import { businessInfo } from './businessInfo';
import { churchTracForm } from './churchTracForm'; // scaffold: church
import { ctaBlock } from './ctaBlock';
import { homePage } from './homePage';
import { journalCategory } from './journalCategory'; // scaffold: journal
import { journalEntry } from './journalEntry'; // scaffold: journal
import { journalPage } from './journalPage'; // scaffold: journal
import { ministry } from './ministry';
import { navLink } from './navLink';
import { page } from './page';
import { pageSectionSchemas } from './sections';
import { richSectionSchemas } from './richSections';
import { notFoundPage } from './notFoundPage';
import { privacyPage } from './privacyPage';
import { redirect } from './redirect';
import { sectionPreset } from './sectionPreset';
import { siteSettings } from './siteSettings';
import { staffMember } from './staffMember';
import { studioGuide } from './studioGuide';
import { studioNotes } from './studioNotes';

export const schemaTypes = [
  // Object types (embedded) first so they're defined before docs that reference them
  ctaBlock,
  // Shared menu link (header menu, footer columns, small print, header button)
  navLink,
  // Page-builder section blocks (objects). Registered before the documents
  // whose pageBuilder arrays reference them.
  ...pageSectionSchemas,
  ...richSectionSchemas,

  // Singletons
  siteSettings,
  businessInfo, // Content-side singleton: service areas, travel fees, availability, geo
  homePage,
  journalPage, // scaffold: journal
  notFoundPage,
  privacyPage,
  // Start Here editable singletons
  studioGuide,
  studioNotes,

  // Reusable content collections
  announcement, // site-wide banner collection (enabled + date-windowed)
  journalCategory, // scaffold: journal
  journalEntry, // scaffold: journal
  ministry, // church ministries/programs. No sermon/event type: see Task 7 brief.
  staffMember, // church staff directory.
  churchTracForm, // scaffold: church -- a Church Trac form, shown by churchTracFormSection
  // Custom pages built from the section library (multi-instance, not a singleton)
  page,
  // One saved section, kept for reuse on other pages. Not content: nothing
  // about a preset reaches the live site until it is added to a page.
  sectionPreset,
  // Old address -> new address forwards, filed by hand or automatically on a
  // web-address change (see components/slugRedirect.tsx).
  redirect,
];
