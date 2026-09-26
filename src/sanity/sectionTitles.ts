// Safe to edit by hand
// =============================================================================
// sectionTitle - the name a section type goes by in the Studio
// =============================================================================
// The "Add item" menu shows each section by its schema `title` ("Photo and text
// side by side"). The saved-section list and the Presentation navigator used to
// name the same section from its type name instead ("Image text"), so one
// section had two names on one screen. This reads the schema titles, so the
// names can only agree. An unknown type falls back to the type-name rule in
// page-checks.ts.
// =============================================================================
import { pageSectionSchemas } from './schemaTypes/sections';
import { richSectionSchemas } from './schemaTypes/richSections';
import { sectionLabel } from '../lib/page-checks';

const TITLES = new Map<string, string>(
  [...pageSectionSchemas, ...richSectionSchemas].map((s) => [s.name, s.title ?? '']),
);

/** The Studio name of a section type, like "Photo and text side by side". */
export function sectionTitle(type: string | null | undefined): string {
  if (!type) return 'Section';
  return TITLES.get(type) || sectionLabel(type);
}
