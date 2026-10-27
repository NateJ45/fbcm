// Pins the church's built-in wayfinding (src/data/wayfinding-defaults.ts, starter card 191) through
// the PORTABLE resolver, on this site's real routes. The starter's own wayfinding.test.ts is not
// installed here: it assumes /contact/ and /about/ are site routes, and on this site they are
// Studio pages (docs/agent/wayfinding.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phoneMenuGroups, pickActionBar, whereNextRows } from './wayfinding.ts';
import {
  PHONE_MENU_GROUPS,
  defaultActionBars,
  defaultWhereNext,
} from '../data/wayfinding-defaults.ts';

const PUBLISHED = ['visit', 'who-we-are', 'ministries', 'give', 'contact', 'beliefs'];
const FACTS = {
  serviceTime: 'Sundays at 10:45 am',
  youtubeUrl: 'https://www.youtube.com/c/Example',
  directionsUrl: 'https://maps.example.com/church',
};

test('where next: three rows, the page you are on drops out, Watch needs the channel', () => {
  const home = whereNextRows(defaultWhereNext(FACTS), '/', PUBLISHED);
  assert.deepEqual(
    home.map((r) => r.href),
    ['/visit/', '/who-we-are/', '/ministries/'],
  );
  assert.equal(home[0].note, 'Your first Sunday');
  const visit = whereNextRows(defaultWhereNext(FACTS), '/visit/', PUBLISHED);
  assert.deepEqual(
    visit.map((r) => r.label),
    ['Who We Are', 'Ministries', 'Watch'],
  );
  const noChannel = defaultWhereNext({ ...FACTS, youtubeUrl: '' });
  assert.ok(!noChannel.some((r) => r.link?.label === 'Watch'));
});

test('where next: an unpublished Studio page drops out', () => {
  const rows = whereNextRows(defaultWhereNext(FACTS), '/', ['visit', 'give']);
  assert.deepEqual(
    rows.map((r) => r.label),
    ['Visit', 'Watch', 'Give'],
  );
});

test('phone menu groups: four groups, every header page, Give not repeated', () => {
  const groups = phoneMenuGroups(PHONE_MENU_GROUPS, '/give/');
  assert.deepEqual(
    groups.map((g) => g.title),
    ['New here', 'Get involved', 'This week', 'Reach us'],
  );
  const hrefs = groups.flatMap((g) => g.links.map((l) => l.href));
  for (const path of ['/visit/', '/who-we-are/', '/ministries/', '/events/', '/contact/']) {
    assert.ok(hrefs.includes(path), path);
  }
  assert.ok(!hrefs.includes('/give/'));
});

test('action bar: the Sunday line from Site settings on Home and Visit, nowhere else', () => {
  const bars = defaultActionBars(FACTS);
  const home = pickActionBar(bars, '/');
  assert.deepEqual(home, {
    text: 'Sundays · Worship at 10:45 am',
    label: 'Plan your visit',
    href: '/visit/',
  });
  assert.equal(pickActionBar(bars, '/visit/')?.href, 'https://maps.example.com/church');
  assert.equal(pickActionBar(bars, '/beliefs/'), null);
  assert.deepEqual(defaultActionBars({ ...FACTS, serviceTime: '' }), []);
  assert.equal(pickActionBar(defaultActionBars({ ...FACTS, directionsUrl: '' }), '/visit/'), null);
});
