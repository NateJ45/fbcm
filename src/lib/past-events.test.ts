// scaffold-file: journal
// Past events off Home's rows (src/lib/past-events.ts), tested against the
// church's REAL 13 "FBCM Events" posts: tests/fixtures/fbcm-events.json, a
// read-only query of the production dataset taken 2026-09-25 (title, excerpt,
// publication date, categories and the body as plain text).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  eventEnd,
  isEventPost,
  isPastEvent,
  withoutPastEvents,
  type EventCandidate,
} from './past-events.ts';

const { posts } = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/fbcm-events.json', import.meta.url), 'utf8'),
) as { posts: (EventCandidate & { _id: string })[] };

// The day of the audit: a Friday in late September 2026.
const NOW = new Date('2026-09-25T16:00:00Z');
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const byId = (id: string) => {
  const p = posts.find((x) => x._id === id);
  assert.ok(p, `${id} is in the fixture`);
  return p;
};

test('the fixture is the 13 posts, all filed under FBCM Events', () => {
  assert.equal(posts.length, 13);
  for (const p of posts) assert.equal(isEventPost(p), true, p.title ?? '');
});

// The whole table, as reported on the branch: each post's derived end, and
// whether Home hides it on 25 September 2026.
const TABLE: [string, string, boolean][] = [
  ['post-h_xe4_ndel-s-messiah-sing-in-carols', '2026-12-11', false],
  ['post-upcoming-events-at-fbc-muncie-march-3-easter-2026', '2026-04-18', true],
  ['post-blue-christmas-hope-mental-health-for-the-holidays', '2025-12-09', true],
  ['post-2025-holiday-schedule', '2026-01-02', true],
  ['post-messy-camp-2025', '2025-07-17', true],
  ['post-remembering-resurrection', '2025-04-26', true],
  ['post-lent-easter-2025', '2025-04-26', true],
  ['post-advent-christmas-2024', '2024-12-29', true],
  ['post-meet-icbc-s-camp-directors', '2024-04-21', true],
  [
    'post-global-servants-bonilla-giovanettis-bgs-to-visit-fbcm-sunday-april-28th',
    '2024-04-28',
    true,
  ],
  ['post-holy-week-2024', '2024-04-13', true],
  ['post-christmas-new-years-2023', '2023-12-31', true],
  ['post-holy-week-2023-schedule', '2023-04-09', true],
];

for (const [id, end, hidden] of TABLE) {
  test(`${id}: ends ${end}, ${hidden ? 'hidden' : 'kept'} on 25 September 2026`, () => {
    const p = byId(id);
    assert.equal(iso(eventEnd(p)), end);
    assert.equal(isPastEvent(p, NOW), hidden);
  });
}

test('Lent & Easter 2026 ends at its last listed date, the Easter open house', () => {
  const p = byId('post-upcoming-events-at-fbc-muncie-march-3-easter-2026');
  assert.equal(isPastEvent(p, new Date('2026-04-18T16:00:00Z')), false, 'the day itself shows');
  assert.equal(isPastEvent(p, new Date('2026-04-19T16:00:00Z')), true, 'the day after hides');
});

test('the Messiah Sing-In is kept until its evening, then goes', () => {
  const p = byId('post-h_xe4_ndel-s-messiah-sing-in-carols');
  // 11 December 2026 at 11 pm in Muncie is still the 11th on the church's clock.
  assert.equal(isPastEvent(p, new Date('2026-12-12T03:59:00Z')), false);
  assert.equal(isPastEvent(p, new Date('2026-12-12T05:01:00Z')), true);
});

test('a year-less date takes the year that sits after publication, not before', () => {
  // Published 2 December 2025, the schedule runs to 2 January: 2026, not 2025.
  assert.equal(iso(eventEnd(byId('post-2025-holiday-schedule'))), '2026-01-02');
  // "Sunday, Nov. 23": 9 days BEFORE publication is still this schedule.
  const meal: EventCandidate = {
    title: 'Harvest Meal',
    text: 'Sunday, Nov. 23 @ Noon | Fellowship Hall',
    publishedAt: '2025-12-02T19:27:31.421Z',
    categories: [{ title: 'FBCM Events' }],
  };
  assert.equal(iso(eventEnd(meal)), '2025-11-23');
});

test('only a post filed under FBCM Events is ever hidden', () => {
  const sermon: EventCandidate = {
    title: 'A Light Wardrobe',
    text: 'Worship on Sunday, November 30, 2025.',
    publishedAt: '2025-11-25T20:46:35.525Z',
    categories: [{ title: 'Sermon Preview' }],
  };
  const resource: EventCandidate = {
    title: 'Job Listing: Worship Arts Pastor (Part-time)',
    publishedAt: '2025-09-16T18:08:30.353Z',
    categories: [{ title: 'Church Resources' }],
  };
  assert.equal(isPastEvent(sermon, NOW), false);
  assert.equal(isPastEvent(resource, NOW), false);
  assert.equal(eventEnd(sermon), null);
});

test('the category is matched by its slug too, and through stega', () => {
  const bySlug: EventCandidate = {
    title: 'Old event',
    text: 'Saturday, March 7, 2026',
    publishedAt: '2026-03-01T12:00:00Z',
    categories: [{ title: null, slug: { current: 'fbcm-events' } }],
  };
  assert.equal(isPastEvent(bySlug, NOW), true);
  // The Studio preview's invisible markers inside the title and the date.
  const Z = '​‌‍﻿';
  const stega: EventCandidate = {
    title: `Old event${Z}`,
    text: `Saturday, March${Z} 7, 2026${Z}`,
    publishedAt: '2026-03-01T12:00:00Z',
    categories: [{ title: `FBCM Events${Z}` }],
  };
  assert.equal(isEventPost(stega), true);
  assert.equal(iso(eventEnd(stega)), '2026-03-07');
  assert.equal(isPastEvent(stega, NOW), true);
});

test('a time or a verse is not a date; a history date is not the event', () => {
  const p: EventCandidate = {
    title: 'Hymn sing',
    // "March 7:00" is a time, "Mark 5:1" is a verse, 1929 is the building.
    text: 'Doors at March 7:00. Read Mark 5:1. The sanctuary was dedicated on December 1, 1929.',
    publishedAt: '2026-09-01T12:00:00Z',
    categories: [{ title: 'FBCM Events' }],
  };
  // No usable date and no year in the title: the 180-day backstop.
  assert.equal(iso(eventEnd(p)), '2027-02-28');
  assert.equal(isPastEvent(p, NOW), false);
});

test('no date in the words: the title year, then the 180-day backstop', () => {
  const titled: EventCandidate = {
    title: 'Messy Camp 2025',
    publishedAt: '2025-07-05T18:13:36.184Z',
    categories: [{ title: 'FBCM Events' }],
  };
  assert.equal(iso(eventEnd(titled)), '2026-01-31');
  const bare: EventCandidate = {
    title: 'Something is coming',
    publishedAt: '2026-06-01T12:00:00Z',
    categories: [{ title: 'FBCM Events' }],
  };
  assert.equal(iso(eventEnd(bare)), '2026-11-28');
  assert.equal(isPastEvent(bare, NOW), false, 'when in doubt, keep');
});

test('no publication date means keep', () => {
  const p: EventCandidate = { title: 'Easter 2020', categories: [{ title: 'FBCM Events' }] };
  assert.equal(eventEnd(p), null);
  assert.equal(isPastEvent(p, NOW), false);
});

test('withoutPastEvents keeps order and drops only the past events', () => {
  const kept = withoutPastEvents(posts, NOW).map((p) => p.title);
  assert.deepEqual(kept, ["Händel's Messiah Sing-In & Carols Muncie"]);
  assert.deepEqual(withoutPastEvents([], NOW), []);
});
