// Safe to edit by hand
// The church's own wayfinding (starter card 191), used while Site settings' matching box is
// empty. The live site has no data in those boxes, and this rollout writes none, so these are
// what visitors see until an editor fills a box in; then the editor's version wins, box by box.
//
// Built only from routes this site really has (the Studio pages visit, who-we-are, beliefs,
// ministers, history, ministries, wedding, give, contact, visitor, and the built routes /events/,
// /blog/, /kids-corner/, /youth-news/), with the labels the church's own menu already uses.
// Nothing here is a church fact: the service time, the YouTube channel and the directions link
// are read from Site settings, and a row or bar whose fact is empty is simply left out.
//
// Resolved by src/lib/wayfinding.ts like editor data; drawn by Header.astro (phone menu groups,
// through MobileNav.tsx), Footer.astro (WhereNext.astro, ActionBar.astro). Detail and the
// reasoning: docs/agent/wayfinding.md.

import type { RawActionBar, RawPhoneMenuGroup, RawWhereNextRow } from '../lib/wayfinding.ts';
import { staticSunday } from '../lib/live-sunday.ts';
import { splitStega } from '../lib/preview-stega.ts';

/** The Site settings facts the defaults read. */
export interface WayfindingFacts {
  serviceTime?: string | null;
  youtubeUrl?: string | null;
  directionsUrl?: string | null;
}

const clean = (v?: string | null) => splitStega(v ?? '').cleaned.trim();

/**
 * The phone menu, in four groups shaped from the header menu (every page it lists, nothing it
 * does not). Give is left out: it is the sheet's own gold button, and the header button's page is
 * not listed twice.
 */
export const PHONE_MENU_GROUPS: RawPhoneMenuGroup[] = [
  {
    title: 'New here',
    links: [
      { label: 'Visit', href: '/visit' },
      { label: 'Who We Are', href: '/who-we-are' },
      { label: 'Beliefs', href: '/beliefs' },
      { label: 'Ministers', href: '/ministers' },
      { label: 'History', href: '/history' },
    ],
  },
  {
    title: 'Get involved',
    links: [
      { label: 'Ministries', href: '/ministries' },
      { label: 'Weddings & Events', href: '/wedding' },
    ],
  },
  {
    title: 'This week',
    links: [
      { label: "What's On", href: '/events' },
      { label: 'Blog', href: '/blog' },
      { label: 'The Visitor', href: '/visitor' },
      { label: "The Kid's Corner", href: '/kids-corner' },
      { label: "The Moose's Message", href: '/youth-news' },
    ],
  },
  {
    title: 'Reach us',
    links: [{ label: 'Contact', href: '/contact' }],
  },
];

/**
 * The footer's opening rows: the first three that are not the page you are on show, and none on
 * a page that ends on its own closing band (most of the main pages do). Watch needs the YouTube
 * channel from Site settings and is left out without it.
 */
export function defaultWhereNext(facts: WayfindingFacts | null | undefined): RawWhereNextRow[] {
  const youtube = clean(facts?.youtubeUrl);
  const rows: (RawWhereNextRow | null)[] = [
    { link: { label: 'Visit', href: '/visit' }, note: 'Your first Sunday' },
    { link: { label: 'Who We Are', href: '/who-we-are' }, note: 'Our church and its story' },
    { link: { label: 'Ministries', href: '/ministries' }, note: 'Find your place' },
    youtube
      ? {
          link: { label: 'Watch', linkType: 'external', externalUrl: youtube },
          note: 'Every service on YouTube',
        }
      : null,
    { link: { label: 'Give', href: '/give' }, note: 'Support the work' },
  ];
  return rows.filter((r): r is RawWhereNextRow => r !== null);
}

/**
 * The Sunday bar, on Home and on Visit only: its line is the service time from Site settings
 * ("Sundays · Worship at 10:45 am", the same words the hero's static line uses), never typed.
 * Home's button goes to Visit; Visit's goes to the directions link (a bar pointing at the page you
 * are on is not drawn, so Visit needs its own). No service time, no bar; no directions link, no
 * bar on Visit.
 */
export function defaultActionBars(facts: WayfindingFacts | null | undefined): RawActionBar[] {
  const time = clean(facts?.serviceTime);
  if (!time) return [];
  const text = staticSunday(time);
  const directions = clean(facts?.directionsUrl);
  const bars: RawActionBar[] = [
    {
      page: { docType: 'homePage' },
      text,
      action: { label: 'Plan your visit', href: '/visit' },
    },
  ];
  if (directions) {
    bars.push({
      page: { docType: 'page', slug: 'visit' },
      text,
      action: { label: 'Directions', linkType: 'external', externalUrl: directions },
    });
  }
  return bars;
}
