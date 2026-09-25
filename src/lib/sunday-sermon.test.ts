// scaffold-file: journal
// Which preview is "this Sunday's" (src/lib/sunday-sermon.ts, 2026-09-24).
// Every instant below is a real UTC moment, read on the church's calendar
// (America/Indiana/Indianapolis), so the tests mean the same thing on any
// machine whatever its own time zone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  preacherForUpcomingSunday,
  previewForSunday,
  sermonForUpcomingSunday,
  upcomingSunday,
} from './sunday-sermon.ts';
import type { RegisterEntry } from './blog-derive.ts';

const preview = (over: Partial<RegisterEntry> = {}): RegisterEntry => ({
  _id: over._id ?? 'p1',
  title: 'When God Shows Up',
  slug: { current: 'when-god-shows-up' },
  publishedAt: '2026-09-22T15:00:00Z', // Tuesday, for Sunday September 27
  categories: [{ title: 'Sermon Preview', slug: { current: 'sermon-preview' } }],
  opening:
    'This is a sermon preview. "For I know the plans I have for you" - from Jeremiah 29:10-12 (NIV)',
  ...over,
});

// ── upcomingSunday ──────────────────────────────────────────────────────────

test('a weekday looks ahead to the coming Sunday', () => {
  assert.equal(upcomingSunday(new Date('2026-09-24T16:00:00Z')), '2026-09-27'); // Thursday noon
  assert.equal(upcomingSunday(new Date('2026-09-21T04:30:00Z')), '2026-09-27'); // Monday 00:30
});

test('on the Sunday itself, the Sunday is today, all day', () => {
  assert.equal(upcomingSunday(new Date('2026-09-27T04:01:00Z')), '2026-09-27'); // 00:01
  assert.equal(upcomingSunday(new Date('2026-09-27T14:45:00Z')), '2026-09-27'); // 10:45
  assert.equal(upcomingSunday(new Date('2026-09-28T03:59:00Z')), '2026-09-27'); // 23:59
});

test('Saturday night late is still Saturday in Muncie, though it is Sunday in UTC', () => {
  // 03:30Z on Sunday the 27th is 23:30 on Saturday the 26th in Indiana.
  assert.equal(upcomingSunday(new Date('2026-09-27T03:30:00Z')), '2026-09-27');
  // and one minute past midnight Monday, church time, the week has turned.
  assert.equal(upcomingSunday(new Date('2026-09-28T04:01:00Z')), '2026-10-04');
});

test('daylight saving: the fall-back and spring-forward Sundays are still Sundays', () => {
  // November 1 2026: clocks go back at 02:00 EDT (06:00Z). 05:30Z is 01:30 EDT.
  assert.equal(upcomingSunday(new Date('2026-11-01T05:30:00Z')), '2026-11-01');
  // Saturday 23:30 EDT the night before is 03:30Z.
  assert.equal(upcomingSunday(new Date('2026-11-01T03:30:00Z')), '2026-11-01');
  // Sunday 23:30 EST after the change is 04:30Z Monday: still that Sunday.
  assert.equal(upcomingSunday(new Date('2026-11-02T04:30:00Z')), '2026-11-01');
  // March 8 2026, spring forward: 23:30 EDT Sunday is 03:30Z Monday.
  assert.equal(upcomingSunday(new Date('2026-03-09T03:30:00Z')), '2026-03-08');
  assert.equal(upcomingSunday(new Date('2026-03-09T04:30:00Z')), '2026-03-15');
});

// ── sermonForUpcomingSunday ─────────────────────────────────────────────────

test("a preview written for the coming Sunday is this Sunday's sermon", () => {
  assert.deepEqual(sermonForUpcomingSunday([preview()], new Date('2026-09-24T16:00:00Z')), {
    sunday: '2026-09-27',
    href: '/post/when-god-shows-up',
    title: '‘When God Shows Up’',
    titleSm: '‘When God Shows Up’',
    titleLg: '‘When God Shows Up’',
    reading: 'Jeremiah 29:10-12',
    readingOnPhone: false,
  });
});

test('on Sunday morning the preview for that Sunday still counts', () => {
  const got = sermonForUpcomingSunday([preview()], new Date('2026-09-27T13:00:00Z'));
  assert.equal(got?.sunday, '2026-09-27');
});

test('no preview at all: null, and the line stays as it was', () => {
  assert.equal(sermonForUpcomingSunday([], new Date('2026-09-24T16:00:00Z')), null);
  assert.equal(sermonForUpcomingSunday(null, new Date('2026-09-24T16:00:00Z')), null);
});

test('a stale preview (last Sunday) is not this Sunday', () => {
  // Built on Monday the 28th: the preview's Sunday has gone.
  assert.equal(sermonForUpcomingSunday([preview()], new Date('2026-09-28T16:00:00Z')), null);
});

test('a preview published early for a later Sunday is not this Sunday', () => {
  const early = preview({ publishedAt: '2026-09-28T15:00:00Z' }); // Monday, for October 4
  assert.equal(sermonForUpcomingSunday([early], new Date('2026-09-24T16:00:00Z')), null);
});

test('a post that is not a sermon preview never counts', () => {
  const news = preview({ categories: [{ title: 'FBCM Events' }] });
  assert.equal(sermonForUpcomingSunday([news], new Date('2026-09-24T16:00:00Z')), null);
});

test('a preview published Saturday night late is read on the church calendar', () => {
  // 03:30Z Sunday = 23:30 Saturday in Muncie: for that Sunday, not the next.
  const late = preview({ publishedAt: '2026-09-27T03:30:00Z' });
  assert.equal(
    sermonForUpcomingSunday([late], new Date('2026-09-26T16:00:00Z'))?.sunday,
    '2026-09-27',
  );
});

test('two previews for one Sunday: the newest wins, whatever the order', () => {
  const older = preview({ _id: 'a', title: 'Draft Title', slug: { current: 'draft' } });
  const newer = preview({
    _id: 'b',
    title: 'Final Title',
    slug: { current: 'final' },
    publishedAt: '2026-09-25T15:00:00Z',
  });
  const now = new Date('2026-09-26T16:00:00Z');
  assert.equal(sermonForUpcomingSunday([older, newer], now)?.href, '/post/final');
  assert.equal(sermonForUpcomingSunday([newer, older], now)?.href, '/post/final');
});

test('stega-encoded title, slug, date and category are all read clean', () => {
  const z = '​‌‍﻿';
  const encoded = preview({
    title: `When God Shows Up${z}`,
    slug: { current: `when-god-shows-up${z}` },
    publishedAt: `2026-09-22T15:00:00Z${z}`,
    categories: [{ title: `Sermon Preview${z}` }],
    opening: `from Jeremiah 29:10-12${z} (NIV)`,
  });
  const got = sermonForUpcomingSunday([encoded], new Date('2026-09-24T16:00:00Z'));
  assert.deepEqual(got, {
    sunday: '2026-09-27',
    href: '/post/when-god-shows-up',
    title: '‘When God Shows Up’',
    titleSm: '‘When God Shows Up’',
    titleLg: '‘When God Shows Up’',
    reading: 'Jeremiah 29:10-12',
    readingOnPhone: false,
  });
  assert.ok(!/[​-‍﻿]/.test(JSON.stringify(got)), 'a payload survived');
});

test('a preview with no slug cannot be linked, so it is not shown', () => {
  const noSlug = preview({ slug: null });
  assert.equal(sermonForUpcomingSunday([noSlug], new Date('2026-09-24T16:00:00Z')), null);
});

// ── previewForSunday (the "Last Sunday" band, 2026-09-24) ─────────────────

test('last Sunday’s recording pairs with the preview written for that Sunday', () => {
  const sep20 = preview({
    title: 'Unequal Opportunity Grace',
    slug: { current: 'unequal-opportunity-grace' },
    publishedAt: '2026-09-16T15:00:00Z', // Wednesday, for Sunday September 20
    opening: 'This week we read from Matthew 20:1-16 (NIV).',
  });
  assert.deepEqual(previewForSunday([sep20, preview()], '2026-09-20'), {
    href: '/post/unequal-opportunity-grace',
    title: 'Unequal Opportunity Grace',
    reading: 'Matthew 20:1-16',
  });
});

test('no preview for that Sunday, or one that cannot be linked: null', () => {
  assert.equal(previewForSunday([preview()], '2026-09-20'), null);
  assert.equal(previewForSunday([preview({ slug: null })], '2026-09-27'), null);
  assert.equal(previewForSunday(null, '2026-09-27'), null);
  const notPreview = preview({ categories: [{ title: 'FBCM Events' }] });
  assert.equal(previewForSunday([notPreview], '2026-09-27'), null);
});

test('the paired title is the post’s own, whole and unquoted', () => {
  const long = preview({ title: 'Proclaim (The Way [Discipleship] Goal 2025-2026)' });
  assert.equal(
    previewForSunday([long], '2026-09-27')?.title,
    'Proclaim (The Way [Discipleship] Goal 2025-2026)',
  );
});

// The hero line picks a preview and a YouTube broadcast for ONE Sunday
// (src/lib/this-sunday.ts), so the two "coming Sunday" functions must agree.
test('upcomingSunday agrees with the feed’s comingSunday over five weeks of hours', async () => {
  const { comingSunday } = await import('./youtube-feed.ts');
  const t0 = Date.parse('2026-10-18T00:00:00Z'); // spans the November 1 fall-back
  for (let h = 0; h < 35 * 24; h += 1) {
    const now = new Date(t0 + h * 3_600_000);
    assert.equal(comingSunday(now), upcomingSunday(now), now.toISOString());
  }
});

// ── preacherForUpcomingSunday (2026-09-25) ──────────────────────────────────

test("the coming Sunday's preview names its author as the preacher", () => {
  const now = new Date('2026-09-24T16:00:00Z'); // Thursday
  assert.deepEqual(preacherForUpcomingSunday([preview({ author: 'Kendall Ellis' })], now), {
    sunday: '2026-09-27',
    name: 'Kendall Ellis',
  });
});

test("the church's own account, no author, or no preview for the Sunday: nobody", () => {
  const now = new Date('2026-09-24T16:00:00Z');
  assert.equal(preacherForUpcomingSunday([preview({ author: 'FBC Muncie' })], now), null);
  assert.equal(preacherForUpcomingSunday([preview({ author: null })], now), null);
  assert.equal(
    preacherForUpcomingSunday(
      [preview({ author: 'Kendall Ellis' })],
      new Date('2026-09-28T14:00:00Z'),
    ),
    null,
  );
  assert.equal(preacherForUpcomingSunday([], now), null);
});

test('the newest preview for the Sunday is the one whose author counts', () => {
  const now = new Date('2026-09-24T16:00:00Z');
  const older = preview({
    _id: 'a',
    author: 'Jonathan Balmer',
    publishedAt: '2026-09-21T15:00:00Z',
  });
  const newer = preview({ _id: 'b', author: 'Kendall Ellis', publishedAt: '2026-09-23T15:00:00Z' });
  assert.equal(preacherForUpcomingSunday([older, newer], now)?.name, 'Kendall Ellis');
});
