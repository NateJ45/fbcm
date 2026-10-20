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
// The Studio kit (2026-10-18, PORTS.md cards 106 to 120): the guides moved
// from Help into the Site Guide tool in the top bar (and "Help for this page"
// beside every document), so Help keeps the two church panels only. Every
// desk item a link can reach has an explicit .id(); the desk is wrapped in
// staffDesk() so the staff view can hide developer-only lists; the Trash,
// empty-list notes, table views and icons by meaning come from the kit.
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
import StudioGuide from './components/StudioGuide';
import BusinessOverview from './components/BusinessOverview';
import { staffDesk } from './kit/shared';
import { emptyAwareList } from './kit/emptyList';
import { brandIcon, typeIcon, type BrandIcon } from './brandIcons';
import { tableListItem } from './workflow';
import { TABLES } from './tables.config';
import { kitConfig } from './kit.config';
import { WEEK_TYPE } from '../lib/studio-kit';
import { TRASH_TYPE } from '../lib/studio-trash';
import { trashListItem } from './kit/trash';
import { STAFF_GROUPS } from '../lib/church-derive'; // scaffold: church
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

// The API version every filtered document list queries with. Sanity warns,
// once per list, when a list with a custom filter has none ("This will be
// required in the future"). Kept equal to the default in src/lib/sanity.ts.
const DESK_API_VERSION = '2026-05-01';

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
  'churchTracForm', // scaffold: church -- placed explicitly as "Church Trac forms"
  TRASH_TYPE, // the Studio kit's Trash, placed explicitly at the bottom
  // The Studio kit's weekly tick document (card 111): Home's bookkeeping, never edited here.
  WEEK_TYPE,
  // Private preview link records (card 117): managed from "Share a preview" only.
  'previewShare',
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
function singletonWithPreview(
  S: StructureBuilder,
  schemaType: string,
  title: string,
  icon: BrandIcon = typeIcon(schemaType),
) {
  // The id is the document id ON PURPOSE: an intent link ("open the Home
  // page", from the Studio kit's Home and Checkup) resolves to the path
  // pages;homePage, and a title-derived id left that pane blank.
  return S.listItem()
    .id(schemaType)
    .title(title)
    .icon(icon)
    .child(
      S.document()
        .schemaType(schemaType)
        .documentId(schemaType)
        .views([S.view.form().title('Edit')]),
    );
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
const NAV_PAGE_ORDER = [
  'visit',
  'who-we-are',
  'beliefs',
  'history',
  'staff',
  'ministries',
  'wedding',
  'give',
  'visitor',
  'contact',
];

const NAV_PAGE_RANK = `select(${NAV_PAGE_ORDER.map(
  (slug, i) => `slug.current == "${slug}" => ${i}`,
).join(', ')}, ${NAV_PAGE_ORDER.length})`;

// A custom sort expression cannot go in `defaultOrdering`: the Studio checks
// each ordering `field` as a real field path, a `select(...)` fails that check,
// and the list then shows "Could not fetch list items" and retries forever
// (found in the signed-in checks, 2026-10-18). So lists that rank by an
// expression fetch their ids in that order once, when the list opens, and show
// them as plain document rows.
type RankedListOptions = {
  id: string;
  title: string;
  type: string;
  icon: ReturnType<typeof typeIcon>;
  // A GROQ query returning the document ids (drafts included) in display order.
  idsQuery: string;
};

function rankedDocumentList(
  S: StructureBuilder,
  context: StructureResolverContext,
  opts: RankedListOptions,
) {
  return S.listItem()
    .id(opts.id)
    .title(opts.title)
    .icon(opts.icon)
    .schemaType(opts.type)
    .child(async () => {
      const client = context.getClient({ apiVersion: DESK_API_VERSION });
      const ids = await client.fetch<string[]>(opts.idsQuery);
      // One row per document: a published page and its draft share a row.
      const seen = new Set<string>();
      const rows = ids
        .map((id) => id.replace(/^drafts\./, ''))
        .filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
      return S.list()
        .id(opts.id)
        .title(opts.title)
        .items(rows.map((id) => S.documentListItem().id(id).schemaType(opts.type)));
    });
}

function navOrderedPagesList(S: StructureBuilder, context: StructureResolverContext) {
  // The id 'page' is load-bearing: Home's "Add a page" and the guides link to
  // pages;page.
  return rankedDocumentList(S, context, {
    id: 'page',
    title: 'All other pages',
    type: 'page',
    icon: typeIcon('page'),
    idsQuery: `*[_type == "page"] | order(${NAV_PAGE_RANK} asc, title asc)._id`,
  });
}

// ── People: staff sorted the way the Staff page itself groups them ──────────
//
// scaffold: church
// src/lib/church-derive.ts's groupStaff() puts pastors first, then the
// coordination team, then support and volunteer roles, and STAFF_GROUPS is
// the one place that order is written down. Importing it here (rather than
// re-typing "pastors", "coordination", "support" in a second place) means the
// desk can never drift from what the live Staff page actually shows.
const STAFF_GROUP_RANK = `select(${STAFF_GROUPS.map(
  (group, i) => `group == "${group}" => ${i}`,
).join(', ')}, ${STAFF_GROUPS.length})`;
// scaffold:end

// The Studio kit's staff view hides kitConfig.staffHiddenPanes from this desk
// (src/sanity/kit/shared.tsx, staffDesk); everyone else sees all of it.
export const deskStructure = (S: StructureBuilder, context: StructureResolverContext) =>
  staffDesk(fullDesk(S, context), context, kitConfig);

const fullDesk = (S: StructureBuilder, context: StructureResolverContext) =>
  S.list()
    .title(site.name)
    .items([
      // ── Pages ────────────────────────────────────────────────────────────
      // The id is load-bearing (kit.config.ts links to 'pages;page').
      S.listItem()
        .id('pages')
        .title('Pages')
        .icon(brandIcon('pages'))
        .child(
          S.list()
            .title('Pages')
            .items([
              singletonWithPreview(S, 'homePage', 'Home'),
              S.divider(),

              navOrderedPagesList(S, context),

              S.divider(),

              singletonWithPreview(S, 'privacyPage', 'Privacy policy'),
              singletonWithPreview(S, 'notFoundPage', 'Page not found (404)'),

              S.divider(),

              // Saved sections: one band of a page, kept for reuse. Made from a
              // page's publish menu ("Save a section as preset..."), added to a
              // page from the Saved sections group in the Presentation
              // navigator.
              S.documentTypeListItem('sectionPreset')
                .id('sectionPreset')
                .title('Saved sections')
                .icon(typeIcon('sectionPreset')),
            ]),
        ),

      S.divider(),

      // ── Blog ─────────────────────────────────────────────────────────────
      // scaffold: journal
      // The id keeps 'blog;journalEntry' links working (kit.config.ts).
      S.listItem()
        .id('blog')
        .title('Blog')
        .icon(brandIcon('journal'))
        .child(
          S.list()
            .title('Blog')
            .items([
              singletonWithPreview(S, 'journalPage', 'Blog page'),

              S.divider(),

              emptyAwareList(S, context, {
                id: 'journalEntry',
                type: 'journalEntry',
                title: 'Posts',
                icon: typeIcon('journalEntry'),
                explain:
                  'News from the church: a sermon preview, an event coming up, a word from a ministry. Newest first on the Blog page.',
                createLabel: 'Write the first post',
                list: (S) =>
                  S.documentTypeList('journalEntry')
                    .title('Posts, newest first')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
              }),
              // The same list as a sortable table (card 117, tables.config.ts).
              ...TABLES.filter((c) => c.type === 'journalEntry').map((c) => tableListItem(S, c)),

              emptyAwareList(S, context, {
                id: 'journalCategory',
                type: 'journalCategory',
                title: 'Categories',
                icon: typeIcon('journalCategory'),
                explain: 'Labels that sort the posts, like "Sermon Preview" or "Missions".',
              }),
            ]),
        ),
      // scaffold:end

      S.divider(),

      // ── People ───────────────────────────────────────────────────────────
      // The id keeps 'people;staffMember' links working (kit.config.ts).
      S.listItem()
        .id('people')
        .title('People')
        .icon(brandIcon('people'))
        .child(
          S.list()
            .title('People')
            .items([
              rankedDocumentList(S, context, {
                id: 'staffMember',
                title: 'Staff members',
                type: 'staffMember',
                icon: typeIcon('staffMember'), // scaffold: church
                idsQuery: `*[_type == "staffMember"] | order(${STAFF_GROUP_RANK} asc, order asc, name asc)._id`,
              }),
              // The same list as a sortable table (card 117, tables.config.ts).
              ...TABLES.filter((c) => c.type === 'staffMember').map((c) => tableListItem(S, c)),
            ]),
        ),

      S.divider(),

      // ── Ministries ───────────────────────────────────────────────────────
      // Flat, not nested: a ministry IS the whole group, there is nothing else
      // under it, so it opens straight to the list rather than a one-item menu.
      // Since 2026-09-22 these documents FEED THE MINISTRIES PAGE: each band
      // there is a "Ministry" band pointing at one of them, and draws its small
      // line, headline, photo, text and contact lines from it
      // (src/lib/ministry-band.ts). Editing a ministry here edits the page.
      S.documentTypeListItem('ministry')
        .id('ministry')
        .title('Ministries')
        .icon(typeIcon('ministry'))
        .child(
          S.documentList()
            .apiVersion(DESK_API_VERSION)
            .title('Ministries')
            .filter('_type == "ministry"')
            .defaultOrdering([
              { field: 'order', direction: 'asc' },
              { field: 'title', direction: 'asc' },
            ]),
        ),

      // scaffold: church
      // ── Church Trac forms ────────────────────────────────────────────────
      // One per form the church built in Church Trac. A page shows one through
      // a "Church Trac form" band (churchTracFormSection), which only points
      // here, so changing a form here changes every page that shows it.
      S.documentTypeListItem('churchTracForm')
        .id('churchTracForm')
        .title('Church Trac forms')
        .icon(typeIcon('churchTracForm'))
        .child(
          S.documentList()
            .apiVersion(DESK_API_VERSION)
            .title('Church Trac forms')
            .filter('_type == "churchTracForm"')
            .defaultOrdering([{ field: 'title', direction: 'asc' }]),
        ),
      // scaffold:end

      S.divider(),

      // ── Site settings ────────────────────────────────────────────────────
      // The id keeps 'settings;announcement' links working (kit.config.ts).
      S.listItem()
        .id('settings')
        .title('Site settings')
        .icon(brandIcon('settings'))
        .child(
          S.list()
            .title('Site settings')
            .items([
              singletonWithPreview(S, 'siteSettings', 'Site settings'),
              // businessInfo ("Location details") came off the desk in the
              // Studio audit (2026-09-26). The document does not exist in the
              // dataset, and opening it created one carrying the starter's
              // placeholders ("Your City", "XX"), which Sunday times and the
              // pastors' letter print after the street address. The address
              // lives whole in Site settings > Church details. The type stays
              // registered and hidden (HIDDEN_FROM_DEFAULT) so nothing breaks.

              S.divider(),

              emptyAwareList(S, context, {
                id: 'announcement',
                type: 'announcement',
                title: 'Announcement banner',
                icon: typeIcon('announcement'),
                explain:
                  'A short line across the top of every page, like a snow closing or a special service. Each one can take itself down on a date you pick.',
                createLabel: 'Put up the first banner',
              }),

              S.divider(),

              // Redirects: old address -> new address. Most entries are filed
              // automatically when a page's web address changes on publish
              // (src/sanity/components/slugRedirect.tsx); the editor adds one by
              // hand for an address that never existed on this site. A divider
              // with a title is the closest the desk builder has to a subtitle
              // on a list item, so the one-line description sits just above it.
              S.divider().title('Old web addresses: forward visitors from a page that moved'),
              S.documentTypeListItem('redirect')
                .id('redirect')
                .title('Old web addresses')
                .icon(typeIcon('redirect')),
            ]),
        ),

      S.divider(),

      // ── Help ─────────────────────────────────────────────────────────────
      // The two Start Here panels that still do real work for this church:
      // the how-to overview (studioGuide, rewritten in Task 10 for a church
      // secretary) and the church-at-a-glance notes (studioNotes). The step by
      // step guides (src/sanity/guides/content.ts, PORTS.md card 41) used to
      // be listed here too; since the Studio kit (2026-10-18) they live in the
      // Site Guide tool in the top bar, searchable and printable, and in "Help
      // for this page" beside every document, so they are not repeated here.
      S.listItem()
        .id('help')
        .title('Help')
        .icon(brandIcon('help'))
        .child(
          S.list()
            .title('Help')
            .items([
              S.listItem()
                .id('studioGuide')
                .title('How the website works')
                .icon(brandIcon('guide'))
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
                .id('studioNotes')
                .title('Your church at a glance')
                .icon(brandIcon('overview'))
                .child(
                  S.document()
                    .schemaType('studioNotes')
                    .documentId('studioNotes')
                    .views([
                      S.view.component(BusinessOverview).title('Overview'),
                      S.view.form().title('Edit notes'),
                    ]),
                ),
            ]),
        ),

      S.divider(),

      // The Studio kit's Trash: "Move to Trash" keeps a copy here, and "Bring
      // it back" puts it where it was (src/sanity/kit/trash.tsx). The id is
      // load-bearing: the Checkup's "Open the Trash" links to it.
      trashListItem(S, context, brandIcon('trash')),

      // Safety net: surface any document type we have NOT explicitly placed above
      // (and keep the hidden set out of the desk root). Every media.* type
      // belongs to sanity-plugin-media's own tool: newer versions add more than
      // media.tag (a "Media Folder" list leaked into the desk on 2026-10-17).
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId() as string;
        return !HIDDEN_FROM_DEFAULT.has(id) && !id.startsWith('media.');
      }),
    ]);
