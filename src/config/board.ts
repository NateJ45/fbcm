// Safe to edit by hand
// =============================================================================
// board.ts - First Baptist Muncie's Report (the Studio tool, PORTS.md card 218)
// =============================================================================
// NOT PORTABLE: this is the church's own report, in the office's words. The
// shared half (src/lib/studio-board.ts, src/sanity/kit/board/, the route
// /api/studio/board/) reads this and nothing else.
//
// The tool appears when PUBLIC_BOARD_REPORT is "true" at build time (the
// repository variable, passed by deploy.yml). The numbers come through the
// SITE_DATA binding from studio-status, whose src/site-series-config.ts lists
// the events it counts for this site. An `event:` measure here must be there too.
//
// MEASURES: visitors, visits, pageViews, newVisitors, searchClicks,
// searchAppearances, event:<name>; lists for charts: topContent (prefix keeps
// those addresses), channels, places, countries, searchQueries, searchPages.
//
// DATES: the site went live on 2026-10-19, so earlier months read "Not tracked
// yet" and October 2026 says it is a part month. Add a month to `gaps`, with a
// sentence, if counting is ever down.
//
// WORDS: plain, no em-dashes, no "sessions". How a number is counted goes in
// `explain`, behind the "i" button.
// =============================================================================

import type { BoardConfig } from '../lib/studio-board';
import { site } from '../data/site';

const CLICK_NOT_GIFT =
  'Clicks on a Give link, on the website or through to online giving. These are clicks, not gifts: the website cannot see whether a gift was made or how much it was.';
const WATCH =
  'Clicks on a link to a service or video on YouTube or Vimeo. It counts the click, not how long someone watched.';
const FORMS =
  'Each time someone sent a form on the website, such as Plan a Visit or Contact. A form in a Church Trac frame cannot always tell the website it was sent, so this can run low.';
const FORMS_SEEN =
  'Each time a form such as Plan a Visit or Contact came into view. The church uses Church Trac forms, which sit in a frame and often cannot tell the website they were sent, so this counts interest. Church Trac has the true count of forms sent.';
const GOOGLE =
  'Times someone chose the church in a Google search. From Google Search Console, which runs about three days behind.';
const DIRECTIONS =
  'Clicks on a link to Google or Apple Maps. The website cannot see who then came.';
const CONTACT = 'Clicks on the church email address or phone number.';

export const boardConfig: BoardConfig = {
  siteName: site.name,
  firstMonth: '2026-10',
  timeZone: 'America/Indiana/Indianapolis',
  since: { all: '2026-10-19' },
  gaps: [],

  overview: {
    tiles: [
      {
        measure: 'visitors',
        label: 'Visitors',
        explain:
          'People who came to the website. Someone who comes back in the same period is counted once.',
      },
      {
        measure: 'event:form_view',
        label: 'Plan a visit and contact forms seen',
        explain: FORMS_SEEN,
      },
      { measure: 'event:watch_click', label: 'Watch clicks', explain: WATCH },
      { measure: 'event:give_click', label: 'Give clicks', explain: CLICK_NOT_GIFT },
      { measure: 'event:directions_click', label: 'Clicks for directions', explain: DIRECTIONS },
      { measure: 'searchClicks', label: 'Clicks from Google', explain: GOOGLE },
    ],
    charts: [
      { measure: 'visitors', title: 'Visitors by month' },
      { measure: 'event:watch_click', title: 'Watch clicks by month' },
      { measure: 'channels', title: 'How people found the website' },
      { measure: 'topContent', title: 'Most viewed pages' },
    ],
  },

  parts: [
    {
      id: 'new-here',
      title: 'New here?',
      explain:
        'Someone thinking about visiting usually reads these pages first, then sends a form or looks up directions. "Forms seen" counts a form coming into view; "forms sent" counts one going through.',
      tiles: [
        { measure: 'newVisitors', label: 'First-time visitors' },
        { measure: 'event:generate_lead', label: 'Forms sent', explain: FORMS },
        { measure: 'event:form_view', label: 'Forms seen' },
      ],
      charts: [
        {
          measure: 'topContent',
          title: 'Pages for visitors',
          prefix: ['/visit', '/who-we-are', '/beliefs', '/ministers', '/ministries', '/contact'],
        },
        { measure: 'event:generate_lead', title: 'Forms sent by month' },
      ],
      more: [
        { measure: 'newVisitors', title: 'First-time visitors by month' },
        { measure: 'event:form_view', title: 'Forms seen by month' },
      ],
    },
    {
      id: 'sundays',
      title: 'Sundays',
      explain: WATCH,
      tiles: [{ measure: 'event:watch_click', label: 'Watch clicks' }],
      charts: [
        { measure: 'event:watch_click', title: 'Watch clicks by month' },
        {
          measure: 'topContent',
          title: 'Sermon and service pages',
          prefix: ['/worship', '/sermons', '/services'],
        },
      ],
      more: [
        { measure: 'event:embed_interact', title: 'Videos and forms used on the page, by month' },
      ],
    },
    {
      id: 'giving',
      title: 'Giving',
      explain: CLICK_NOT_GIFT,
      tiles: [{ measure: 'event:give_click', label: 'Clicks through to online giving' }],
      charts: [
        {
          measure: 'event:give_click',
          title: 'Give clicks by month',
          note: 'These are clicks, not gifts.',
        },
      ],
    },
    {
      id: 'found-locally',
      title: 'Found locally',
      explain:
        'How people nearby find the church. A click from Google is someone choosing the church in a search; an appearance is the church being listed, chosen or not. Places come from Google Analytics and are by state.',
      tiles: [
        { measure: 'searchClicks', label: 'Clicks from Google', explain: GOOGLE },
        { measure: 'searchAppearances', label: 'Times you appeared on Google', up: 'flat' },
        { measure: 'event:directions_click', label: 'Clicks for directions', explain: DIRECTIONS },
        { measure: 'event:contact_click', label: 'Email and phone clicks', explain: CONTACT },
      ],
      charts: [
        { measure: 'searchQueries', title: 'Searches that found the church' },
        { measure: 'places', title: 'Where visitors were, by state' },
      ],
      more: [
        { measure: 'searchPages', title: 'Pages Google sent people to' },
        { measure: 'event:directions_click', title: 'Clicks for directions by month' },
        { measure: 'event:contact_click', title: 'Email and phone clicks by month' },
        { measure: 'countries', title: 'Countries' },
      ],
    },
    {
      id: 'news',
      title: 'News and stories',
      explain:
        'The blog posts and news pages people opened most. "Read to the end" counts someone reaching the end of a post after real reading time.',
      tiles: [{ measure: 'event:article_read', label: 'Posts read to the end' }],
      charts: [
        {
          measure: 'topContent',
          title: 'Most read',
          prefix: ['/post/', '/blog', '/visitor', '/youth-news', '/kids-corner'],
        },
        { measure: 'event:article_read', title: 'Posts read to the end, by month' },
      ],
    },
  ],
};
