// Studio Desk structure, rewritten for Task 10 of plan 2a (2026-09-19) into the
// six groups a church secretary needs and nothing else: Pages, Blog, People,
// Ministries, Site settings, Help. The earlier "Content", "Help & Guide" and
// "Start Here" groupings (inherited from the starter this was forked from)
// are gone. Two things that lived in "Start Here" survive because they still
// do real work for this editor: the "How the website works" guide and the
// "Your church at a glance" notes, both folded into Help below. The guide
// DATA in src/sanity/guides/content.ts was unhooked here on 2026-09-19 while
// it was still the starter's generic template, then rewritten for the church
// secretary and wired back into Help on 2026-09-22 (feat/editor-guide).
//
// Every document type is placed explicitly so nothing floats loose at the
// desk root. The trailing default-list filter is a safety net for any future
// type that hasn't been placed (and hides sanity-plugin-media's media.tag
// type, which would otherwise show at the root).
//
// Orderable lists: ORDERABLE_TYPES below lists any collection using the
// orderable-document-list plugin (currently none). Staff and Ministries are
// ordered instead with a GROQ `select()` expression passed as an ordering
// field (see NAV_PAGE_ORDER / STAFF_GROUP_ORDER below) so the desk mirrors
// the priority the site itself uses, without adding a plugin nothing else
// here needs.
//
// Preview: 2026-08-28 the per-document iframe tab (sanity-plugin-iframe-pane)
// was retired in favour of the Presentation tool, which renders the SSR
// /preview/* routes with click-to-edit and in-canvas section controls. The
// singleton list items below therefore carry the plain form view, and
// "see it on the page" is the Presentation tool in the navbar.

import type { StructureBuilder, StructureResolverContext } from 'sanity/structure';
import {
  ArrowRightIcon,
  BellIcon,
  BlockElementIcon,
  BookIcon,
  CogIcon,
  DocumentsIcon,
  DocumentTextIcon,
  EditIcon,
  HeartIcon,
  HomeIcon,
  InfoOutlineIcon,
  LockIcon,
  PinIcon,
  PresentationIcon,
  TagIcon,
  ThumbsUpIcon,
  UsersIcon,
} from '@sanity/icons';
import StudioGuide from './components/StudioGuide';
import { makeGuideView } from './components/GuideView';
import { guides, GUIDE_CATEGORIES } from './guides/content';
import { GUIDE_ICONS } from './guides/icons';
import BusinessOverview from './components/BusinessOverview';
import { STAFF_GROUPS } from '../lib/church-derive';
import { site } from '../data/site';

const SINGLETON_TYPES = [
  'siteSettings',
  'businessInfo',
  // Core pages
  'homePage',
  'journalPage', // scaffold: journal
  'notFoundPage',
  'privacyPage',
  'studioGuide',
  'studioNotes',
] as const;

const ORDERABLE_TYPES = [] as const;

const HIDDEN_FROM_DEFAULT = new Set<string>([
  ...SINGLETON_TYPES,
  ...ORDERABLE_TYPES,
  'announcement', // placed explicitly under "Site settings"
  'journalEntry', // scaffold: journal -- placed explicitly under "Blog"
  'journalCategory', // scaffold: journal -- placed explicitly under "Blog"
  'page', // custom pages, placed explicitly under "Pages"
  'sectionPreset', // saved sections, placed explicitly under "Pages"
  'redirect', // placed explicitly under "Site settings" -> Old web addresses
  'ministry', // placed explicitly at the top level as "Ministries"
  'staffMember', // placed explicitly under "People"
  // sanity-plugin-media registers this tag type; keep it out of the desk root
  // (the "Media" tool in the top sidebar is where tags belong).
  'media.tag',
]);

/**
 * Build a singleton list item pinned to one document id.
 *
 * The name is historical: it used to attach an iframe preview view alongside
 * the form. Since 2026-08-28 the live draft preview is the Presentation tool
 * (src/sanity/resolve.ts maps every one of these types to a /preview path), so
 * the editor pane is the form. Views are still set explicitly because
 * S.document().views([...]) bypasses defaultDocumentNode in sanity.config.ts,
 * and that is where the per-type extra tabs are added.
 */
function singletonWithPreview(S: StructureBuilder, schemaType: string, title: string, icon: any) {
  return S.listItem()
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(schemaType).documentId(schemaType).views([S.view.form()]));
}

// ── Pages: order the church's own pages the way the header menu reads them ──
//
// Home is the one page singleton left (always present). Every other page the
// church has -- Visit, Who We Are, Beliefs, History, Contact -- is a `page`
// document an editor built from the section library, and plan 2b creates
// them. Contact joined them on 2026-09-20 when the starter's contactPage
// singleton and its Web3Forms form retired (plan 2b task 14).
//
// There is no field on `page` recording "where it sits in the nav": the
// nav itself (siteSettings.navItems, seeded in scripts/seed-core.mjs) is the
// one place that order lives, so the desk reads it from there rather than
// duplicating it onto every page document (CLAUDE.md rule 15: a second copy
// of an order is the one that goes stale).
//
// GROQ's order() takes an arbitrary expression, so a `select()` ranks known
// slugs and falls every other page after them, alphabetically by title. A
// page whose slug isn't below (one plan 2b hasn't created yet, or a future
// one added later) still shows up; it just sorts to the end until someone
// gives it a nav slot.
const NAV_PAGE_ORDER = ['visit', 'who-we-are', 'beliefs', 'history', 'contact'];

const NAV_PAGE_RANK = `select(${NAV_PAGE_ORDER.map(
  (slug, i) => `slug.current == "${slug}" => ${i}`,
).join(', ')}, ${NAV_PAGE_ORDER.length})`;

function navOrderedPagesList(S: StructureBuilder) {
  return S.documentTypeListItem('page')
    .title('Visit, Who We Are, Beliefs, History')
    .icon(DocumentsIcon)
    .child(
      S.documentList()
        .title('Pages')
        .filter('_type == "page"')
        .defaultOrdering([
          { field: NAV_PAGE_RANK, direction: 'asc' },
          { field: 'title', direction: 'asc' },
        ]),
    );
}

// ── People: staff sorted the way the Staff page itself groups them ──────────
//
// src/lib/church-derive.ts's groupStaff() puts pastors first, then the
// coordination team, then support and volunteer roles, and STAFF_GROUPS is
// the one place that order is written down. Importing it here (rather than
// re-typing "pastors", "coordination", "support" in a second place) means the
// desk can never drift from what the live Staff page actually shows.
const STAFF_GROUP_RANK = `select(${STAFF_GROUPS.map(
  (group, i) => `group == "${group}" => ${i}`,
).join(', ')}, ${STAFF_GROUPS.length})`;

export const deskStructure = (S: StructureBuilder, _context: StructureResolverContext) =>
  S.list()
    .title(site.name)
    .items([
      // ── Pages ────────────────────────────────────────────────────────────
      S.listItem()
        .title('Pages')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              singletonWithPreview(S, 'homePage', 'Home', HomeIcon),
              S.divider(),

              navOrderedPagesList(S),

              S.divider(),

              singletonWithPreview(S, 'privacyPage', 'Privacy', LockIcon),
              singletonWithPreview(S, 'notFoundPage', 'Not found (404)', DocumentTextIcon),

              S.divider(),

              // Saved sections: one band of a page, kept for reuse. Made from a
              // page's publish menu ("Save a section as preset..."), added to a
              // page from the Saved sections group in the Presentation
              // navigator.
              S.documentTypeListItem('sectionPreset')
                .title('Saved sections')
                .icon(BlockElementIcon),
            ]),
        ),

      S.divider(),

      // ── Blog ─────────────────────────────────────────────────────────────
      // scaffold: journal
      S.listItem()
        .title('Blog')
        .icon(BookIcon)
        .child(
          S.list()
            .title('Blog')
            .items([
              singletonWithPreview(S, 'journalPage', 'Blog page (the /blog index)', BookIcon),

              S.divider(),

              S.documentTypeListItem('journalEntry')
                .title('Posts')
                .icon(EditIcon)
                .child(
                  S.documentList()
                    .title('Posts')
                    .filter('_type == "journalEntry"')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
                ),

              S.documentTypeListItem('journalCategory').title('Categories').icon(TagIcon),
            ]),
        ),
      // scaffold:end

      S.divider(),

      // ── People ───────────────────────────────────────────────────────────
      S.listItem()
        .title('People')
        .icon(UsersIcon)
        .child(
          S.list()
            .title('People')
            .items([
              S.documentTypeListItem('staffMember')
                .title('Staff members')
                .icon(UsersIcon)
                .child(
                  S.documentList()
                    .title('Staff members')
                    .filter('_type == "staffMember"')
                    .defaultOrdering([
                      { field: STAFF_GROUP_RANK, direction: 'asc' },
                      { field: 'order', direction: 'asc' },
                      { field: 'name', direction: 'asc' },
                    ]),
                ),
            ]),
        ),

      S.divider(),

      // ── Ministries ───────────────────────────────────────────────────────
      // Flat, not nested: a ministry IS the whole group, there is nothing else
      // under it, so it opens straight to the list rather than a one-item menu.
      S.documentTypeListItem('ministry')
        .title('Ministries')
        .icon(HeartIcon)
        .child(
          S.documentList()
            .title('Ministries')
            .filter('_type == "ministry"')
            .defaultOrdering([
              { field: 'order', direction: 'asc' },
              { field: 'title', direction: 'asc' },
            ]),
        ),

      S.divider(),

      // ── Site settings ────────────────────────────────────────────────────
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(
          S.list()
            .title('Site settings')
            .items([
              singletonWithPreview(S, 'siteSettings', 'Site settings', CogIcon),
              singletonWithPreview(S, 'businessInfo', 'Location details', PinIcon),

              S.divider(),

              S.documentTypeListItem('announcement').title('Announcement banner').icon(BellIcon),

              S.divider(),

              // Redirects: old address -> new address. Most entries are filed
              // automatically when a page's web address changes on publish
              // (src/sanity/components/slugRedirect.tsx); the editor adds one by
              // hand for an address that never existed on this site. A divider
              // with a title is the closest the desk builder has to a subtitle
              // on a list item, so the one-line description sits just above it.
              S.divider().title('Old web addresses -- forwards visitors from a page that moved'),
              S.documentTypeListItem('redirect').title('Old web addresses').icon(ArrowRightIcon),
            ]),
        ),

      S.divider(),

      // ── Help ─────────────────────────────────────────────────────────────
      // The handbook (PORTS.md card 41), after the two panels that were already
      // here. The guides are DATA in src/sanity/guides/content.ts, held in the
      // repo so they cannot be deleted by accident; each category becomes a
      // titled divider with its guides under it, in GUIDE_CATEGORIES order.
      //
      // The two Start Here panels that still do real work for this church:
      // the how-to guide (studioGuide, rewritten in Task 10 for a church
      // secretary) and the church-at-a-glance notes (studioNotes). Brand kit
      // was removed here (2026-09-19): a swatches-and-fonts panel for making
      // flyers away from the site is not one of this desk's six jobs, and it
      // read no field this task touched, so it was simply unhooked rather than
      // repaired.
      S.listItem()
        .title('Help')
        .icon(InfoOutlineIcon)
        .child(
          S.list()
            .title('Help')
            .items([
              S.listItem()
                .title('How the website works')
                .icon(PresentationIcon)
                .child(
                  S.document()
                    .schemaType('studioGuide')
                    .documentId('studioGuide')
                    .views([
                      S.view.component(StudioGuide).title('Guide'),
                      S.view.form().title('Edit'),
                    ]),
                ),
              S.listItem()
                .title('Your church at a glance')
                .icon(ThumbsUpIcon)
                .child(
                  S.document()
                    .schemaType('studioNotes')
                    .documentId('studioNotes')
                    .views([
                      S.view.component(BusinessOverview).title('Overview'),
                      S.view.form().title('Edit notes'),
                    ]),
                ),
              ...GUIDE_CATEGORIES.flatMap((category) => {
                const mine = guides.filter((g) => g.category === category);
                return mine.length === 0
                  ? []
                  : [
                      S.divider().title(category),
                      ...mine.map((g) =>
                        S.listItem()
                          .id(`guide-${g.slug}`)
                          .title(g.title)
                          .icon(GUIDE_ICONS[g.icon])
                          .child(
                            S.component(makeGuideView(g.slug) as never)
                              .id(`guide-view-${g.slug}`)
                              .title(g.title),
                          ),
                      ),
                    ];
              }),
            ]),
        ),

      // Safety net: surface any document type we have NOT explicitly placed above
      // (and keep the hidden set, including media.tag, out of the desk root).
      ...S.documentTypeListItems().filter(
        (item) => !HIDDEN_FROM_DEFAULT.has(item.getId() as string),
      ),
    ]);
