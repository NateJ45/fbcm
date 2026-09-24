// Safe to edit by hand
// The "Live now" window. Every instant below is written in UTC with the
// church's local wall-clock time beside it, so a reader can check the DST
// arithmetic by eye: Indianapolis is UTC-4 in summer (EDT) and UTC-5 in
// winter (EST). The window is Sunday 10:45 to 12:00 church time, start
// inclusive, end exclusive.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLiveNow,
  serviceStartMinutes,
  watchLiveHref,
  weekMinutesIn,
  LIVE_WINDOW_MINUTES,
  SERVICE_TIME_ZONE,
} from './live-service.ts';

const SETTING = 'Sundays at 10:45 am';
const at = (iso: string) => new Date(iso);

test('the window is 75 minutes in the church time zone', () => {
  assert.equal(LIVE_WINDOW_MINUTES, 75);
  assert.equal(SERVICE_TIME_ZONE, 'America/Indiana/Indianapolis');
});

test('serviceStartMinutes reads the Site settings phrasing and bare times', () => {
  assert.equal(serviceStartMinutes('Sundays at 10:45 am'), 645);
  assert.equal(serviceStartMinutes('Sunday at 10:45 AM'), 645);
  assert.equal(serviceStartMinutes('10:45 a.m.'), 645);
  assert.equal(serviceStartMinutes('6:30 P.M.'), 1110);
  assert.equal(serviceStartMinutes('10am'), 600);
  assert.equal(serviceStartMinutes('12 pm'), 720);
  assert.equal(serviceStartMinutes('12:15 am'), 15);
  assert.equal(serviceStartMinutes('10:45'), 645);
});

test('serviceStartMinutes refuses a string with no usable time', () => {
  assert.equal(serviceStartMinutes(''), null);
  assert.equal(serviceStartMinutes('About an hour'), null);
  assert.equal(serviceStartMinutes('13:00 pm'), null);
  assert.equal(serviceStartMinutes('10:75 am'), null);
});

// Sunday 2026-09-27 is daylight time: 10:45 EDT is 14:45 UTC.
test('before the start: 10:44 church time is not live', () => {
  assert.equal(isLiveNow(at('2026-09-27T14:44:00Z'), SETTING), false);
  assert.equal(isLiveNow(at('2026-09-27T14:44:59Z'), SETTING), false);
});
test('at the start: 10:45:00 church time is live', () => {
  assert.equal(isLiveNow(at('2026-09-27T14:45:00Z'), SETTING), true);
});
test('inside the window: 11:30 church time is live', () => {
  assert.equal(isLiveNow(at('2026-09-27T15:30:00Z'), SETTING), true);
  assert.equal(isLiveNow(at('2026-09-27T15:59:59Z'), SETTING), true);
});
test('at the end: 12:00 church time is not live (end is exclusive)', () => {
  assert.equal(isLiveNow(at('2026-09-27T16:00:00Z'), SETTING), false);
  assert.equal(isLiveNow(at('2026-09-27T18:00:00Z'), SETTING), false);
});

test('other days at the same hour are never live', () => {
  // Saturday 26th and Monday 28th, 11:00 EDT, and Wednesday 30th.
  for (const iso of ['2026-09-26T15:00:00Z', '2026-09-28T15:00:00Z', '2026-09-30T15:00:00Z']) {
    assert.equal(isLiveNow(at(iso), SETTING), false, iso);
  }
});

test("the church's clock decides, not the visitor's", () => {
  // 07:50 in Los Angeles on Sunday is 10:50 in Muncie: live. The Date is the
  // same instant whatever machine runs this, so the result cannot depend on
  // the test machine's own zone either.
  assert.equal(isLiveNow(at('2026-09-27T14:50:00Z'), SETTING), true);
  // Sunday 10:50 in London is Sunday 05:50 in Muncie: not live.
  assert.equal(isLiveNow(at('2026-09-27T09:50:00Z'), SETTING), false);
});

test('DST: in winter 10:45 is 15:45 UTC, and 14:45 UTC is an hour early', () => {
  // Sunday 2026-12-06, EST (UTC-5).
  assert.equal(isLiveNow(at('2026-12-06T14:45:00Z'), SETTING), false);
  assert.equal(isLiveNow(at('2026-12-06T15:45:00Z'), SETTING), true);
  assert.equal(isLiveNow(at('2026-12-06T16:59:00Z'), SETTING), true);
  assert.equal(isLiveNow(at('2026-12-06T17:00:00Z'), SETTING), false);
});

test('DST: the changeover Sundays themselves keep the wall-clock window', () => {
  // 2026-11-01 (clocks went back at 02:00 that morning): EST, UTC-5.
  assert.equal(isLiveNow(at('2026-11-01T15:45:00Z'), SETTING), true);
  assert.equal(isLiveNow(at('2026-11-01T14:45:00Z'), SETTING), false);
  // 2027-03-14 (clocks went forward at 02:00 that morning): EDT, UTC-4.
  assert.equal(isLiveNow(at('2027-03-14T14:45:00Z'), SETTING), true);
  assert.equal(isLiveNow(at('2027-03-14T15:59:00Z'), SETTING), true);
  assert.equal(isLiveNow(at('2027-03-14T16:00:00Z'), SETTING), false);
});

test('a setting with no time in it is never live', () => {
  assert.equal(isLiveNow(at('2026-09-27T15:00:00Z'), ''), false);
  assert.equal(isLiveNow(at('2026-09-27T15:00:00Z'), 'Sundays'), false);
});

test('a late service runs past midnight into Monday', () => {
  // 23:30 Sunday + 75 min = 00:45 Monday, church time (EDT, UTC-4).
  assert.equal(isLiveNow(at('2026-09-28T04:00:00Z'), '11:30 pm'), true); // Mon 00:00
  assert.equal(isLiveNow(at('2026-09-28T04:45:00Z'), '11:30 pm'), false); // Mon 00:45
});

test('weekMinutesIn counts from Sunday midnight on the zone clock', () => {
  assert.equal(weekMinutesIn(at('2026-09-27T04:00:00Z'), SERVICE_TIME_ZONE), 0);
  assert.equal(weekMinutesIn(at('2026-09-27T14:45:00Z'), SERVICE_TIME_ZONE), 645);
  assert.equal(weekMinutesIn(at('2026-09-28T14:45:00Z'), SERVICE_TIME_ZONE), 1440 + 645);
});

test('watchLiveHref prefers the live stream, falls back to the channel, else nothing', () => {
  assert.equal(
    watchLiveHref('https://live.example/', 'https://yt.example/'),
    'https://live.example/',
  );
  assert.equal(watchLiveHref('', 'https://yt.example/'), 'https://yt.example/');
  assert.equal(watchLiveHref(null, 'https://yt.example/'), 'https://yt.example/');
  assert.equal(watchLiveHref('  ', undefined), undefined);
  assert.equal(watchLiveHref(undefined, null), undefined);
});
