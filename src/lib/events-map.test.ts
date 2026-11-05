// Safe to edit by hand
// Pins this site's events map (src/config/events.ts, PORTS.md card 217) against what the
// site's own SiteEvents.astro sent before it moved onto the shared layer (2026-10-19 version).
// The expected results below were captured by running THAT script over these links in a
// stubbed browser on 2026-11-05, not written by hand, so a change here is a change in what
// GA4 receives. A link that sent nothing is null.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyLink } from './track.ts';
import { eventsConfig } from '../config/events.ts';

type Expected = { event: string; params: Record<string, string> } | null;

// [href as written, page region, what was sent]
const BEFORE: Array<[string, string, Expected]> = [
  [
    'mailto:office@example.org',
    'footer',
    { event: 'contact_click', params: { method: 'email', location: 'footer' } },
  ],
  [
    'MAILTO:x@y.z',
    'page',
    { event: 'contact_click', params: { method: 'email', location: 'page' } },
  ],
  [
    'tel:+15555550100',
    'header',
    { event: 'contact_click', params: { method: 'phone', location: 'header' } },
  ],
  ['TEL:555', 'nav', { event: 'contact_click', params: { method: 'phone', location: 'nav' } }],
  [
    '/give',
    'page',
    { event: 'give_click', params: { destination: 'give_page', location: 'page' } },
  ],
  [
    '/give/',
    'header',
    { event: 'give_click', params: { destination: 'give_page', location: 'header' } },
  ],
  [
    '/give/online',
    'page',
    { event: 'give_click', params: { destination: 'give_page', location: 'page' } },
  ],
  ['/giveaway/', 'page', null],
  [
    'https://www.fbcmuncie.org/give/',
    'footer',
    { event: 'give_click', params: { destination: 'give_page', location: 'footer' } },
  ],
  [
    'https://fbcmuncie.org/give',
    'page',
    { event: 'give_click', params: { destination: 'give_page', location: 'page' } },
  ],
  ['https://elsewhere.org/give', 'page', null],
  [
    'https://fbcm.churchcenter.com/giving',
    'page',
    { event: 'give_click', params: { destination: 'church_center', location: 'page' } },
  ],
  [
    'https://fbcm.churchcenter.com/giving/donate',
    'header',
    { event: 'give_click', params: { destination: 'church_center', location: 'header' } },
  ],
  [
    'https://fbcm.churchcenter.com/registrations/events/1',
    'page',
    { event: 'church_center_click', params: { destination: 'church_center', location: 'page' } },
  ],
  [
    'https://churchcenter.com/home',
    'aside',
    { event: 'church_center_click', params: { destination: 'church_center', location: 'aside' } },
  ],
  [
    'https://open.churchtrac.com/',
    'page',
    { event: 'app_click', params: { destination: 'web', location: 'page' } },
  ],
  [
    'https://apps.apple.com/us/app/x/id1',
    'footer',
    { event: 'app_click', params: { destination: 'ios', location: 'footer' } },
  ],
  [
    'https://play.google.com/store/apps/details?id=x',
    'page',
    { event: 'app_click', params: { destination: 'android', location: 'page' } },
  ],
  [
    'https://fbcm.churchtrac.com/portal',
    'page',
    { event: 'churchtrac_click', params: { destination: 'portal', location: 'page' } },
  ],
  [
    'https://churchtrac.com/',
    'nav',
    { event: 'churchtrac_click', params: { destination: 'portal', location: 'nav' } },
  ],
  [
    'https://www.youtube.com/@Someone/streams',
    'page',
    { event: 'watch_click', params: { destination: 'streams', location: 'page' } },
  ],
  [
    'https://www.youtube.com/@Someone/live',
    'page',
    { event: 'watch_click', params: { destination: 'streams', location: 'page' } },
  ],
  [
    'https://www.youtube.com/watch?v=abc',
    'page',
    { event: 'watch_click', params: { destination: 'video', location: 'page' } },
  ],
  [
    'https://youtu.be/abc',
    'page',
    { event: 'watch_click', params: { destination: 'video', location: 'page' } },
  ],
  [
    'https://vimeo.com/123',
    'page',
    { event: 'watch_click', params: { destination: 'video', location: 'page' } },
  ],
  [
    'https://www.youtube.com/@Someone',
    'footer',
    { event: 'watch_click', params: { destination: 'channel', location: 'footer' } },
  ],
  [
    'https://www.youtube.com/playlist?list=1',
    'page',
    { event: 'watch_click', params: { destination: 'channel', location: 'page' } },
  ],
  [
    'https://www.google.com/maps/search/?api=1&query=x',
    'page',
    { event: 'directions_click', params: { location: 'page' } },
  ],
  [
    'https://maps.google.com/?q=x',
    'page',
    { event: 'directions_click', params: { location: 'page' } },
  ],
  [
    'https://maps.apple.com/?q=x',
    'header',
    { event: 'directions_click', params: { location: 'header' } },
  ],
  ['https://goo.gl/maps/abc', 'page', { event: 'directions_click', params: { location: 'page' } }],
  [
    'https://maps.app.goo.gl/abc',
    'page',
    { event: 'directions_click', params: { location: 'page' } },
  ],
  ['https://www.google.com/search?q=x', 'page', null],
  ['/visit/sunday.ics', 'page', { event: 'calendar_add', params: { location: 'page' } }],
  [
    'https://elsewhere.org/cal/a.ICS',
    'footer',
    { event: 'calendar_add', params: { location: 'footer' } },
  ],
  [
    'https://www.facebook.com/x',
    'footer',
    { event: 'social_click', params: { network: 'facebook', location: 'footer' } },
  ],
  [
    'https://instagram.com/x',
    'page',
    { event: 'social_click', params: { network: 'instagram', location: 'page' } },
  ],
  [
    'https://www.threads.net/@x',
    'page',
    { event: 'social_click', params: { network: 'threads', location: 'page' } },
  ],
  [
    'https://linktr.ee/x',
    'page',
    { event: 'social_click', params: { network: 'linktree', location: 'page' } },
  ],
  [
    'https://x.com/x',
    'page',
    { event: 'social_click', params: { network: 'x', location: 'page' } },
  ],
  [
    'https://twitter.com/x',
    'nav',
    { event: 'social_click', params: { network: 'x', location: 'nav' } },
  ],
  ['https://m.facebook.com/x', 'page', null],
  ['https://example.com/', 'page', null],
  ['https://example.com/doc.pdf', 'page', null],
  ['/files/bulletin.pdf', 'page', null],
  ['/visit/', 'page', null],
  ['/', 'header', null],
  ['#top', 'page', null],
  ['sms:+15555550100', 'page', null],
  ['javascript:void(0)', 'page', null],
  ['https://www.fbcmuncie.org/about/', 'page', null],
  [
    'https://fbcm.churchcenter.com/groups',
    'footer',
    { event: 'church_center_click', params: { destination: 'church_center', location: 'footer' } },
  ],
];

for (const [href, location, expected] of BEFORE) {
  test(`${href} (${location}) sends ${expected ? expected.event : 'nothing'}`, () => {
    const resolved = new URL(href, 'https://www.fbcmuncie.org/page/').href;
    const hit = classifyLink(href, resolved, 'www.fbcmuncie.org', location, eventsConfig);
    assert.deepEqual(hit, expected);
  });
}
