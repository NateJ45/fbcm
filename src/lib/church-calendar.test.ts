// The church calendar (src/lib/church-calendar.ts and the fetch in
// church-calendar-feed.ts): Church Trac's iCal read as Muncie's clock,
// recurrences expanded, descriptions tidied, and what "What's On" draws.
// The fixture is the church's real feed of 2026-09-25, names taken out.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  daysPlural,
  occurrences,
  parseIcs,
  parseRrule,
  readStamp,
  tidyDescription,
  timeLabel,
  timeRange,
  unfold,
  whatsOn,
  whenLine,
} from './church-calendar.ts';
import {
  calendarCode,
  codeFor,
  fetchCalendar,
  FBCM_CALENDAR_CODE,
} from './church-calendar-feed.ts';

const FIXTURE = readFileSync(
  new URL('../../tests/fixtures/churchtrac.ics', import.meta.url),
  'utf8',
);
// Friday 2026-09-25, noon in Muncie.
const FRIDAY = new Date('2026-09-25T16:00:00Z');

const ics = (...events: string[][]) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    ...events.flatMap((e) => ['BEGIN:VEVENT', ...e, 'END:VEVENT']),
    'END:VCALENDAR',
  ].join('\r\n');

test('reads every event in the real feed', () => {
  const events = parseIcs(FIXTURE);
  assert.equal(events.length, 20);
  const school = events.find((e) => e.title === 'Sunday School')!;
  assert.equal(school.date, '2026-07-12');
  assert.equal(school.startMinutes, 9 * 60 + 30);
  assert.equal(school.durationMinutes, 45);
  assert.equal(school.location, 'First Baptist Church');
  assert.equal(school.recurrence?.freq, 'WEEKLY');
  assert.equal(school.recurrence?.until, '2027-07-25');
});

test('a TZID time is Muncie wall-clock time, whatever zone it names (the feed says Halifax)', () => {
  const s = readStamp('20260712T093000', { TZID: 'America/Halifax' });
  assert.deepEqual(s, { date: '2026-07-12', minutes: 570, zone: 'America/Halifax' });
});

test('a UTC time is converted to the church clock, DST included', () => {
  // 14:45Z is 10:45 am EDT in July and 9:45 am EST in December.
  assert.equal(readStamp('20260712T144500Z', {})?.minutes, 645);
  assert.equal(readStamp('20261213T144500Z', {})?.minutes, 585);
  // Late evening UTC is still the same church day... or the one before.
  assert.equal(readStamp('20261001T020000Z', {})?.date, '2026-09-30');
});

test('an all-day event has no time and spans its days (DTEND exclusive)', () => {
  const [ev] = parseIcs(
    ics(['UID:a', 'SUMMARY:Retreat', 'DTSTART;VALUE=DATE:20261009', 'DTEND;VALUE=DATE:20261012']),
  );
  assert.equal(ev.startMinutes, null);
  assert.equal(ev.allDayDays, 3);
  assert.equal(
    whenLine({ date: ev.date, through: null, allDayDays: 3 }),
    'October 9 to October 11',
  );
});

test('folded lines and escaped text are read back', () => {
  assert.deepEqual(unfold('SUMMARY:Messiah\r\n  Sing-In\r\nX:1'), [
    'SUMMARY:Messiah Sing-In',
    'X:1',
  ]);
  const [ev] = parseIcs(
    ics([
      'UID:b',
      'SUMMARY:Soup\\, salad\\; and pie',
      'DTSTART:20261001T180000',
      'DESCRIPTION:One\\nTwo',
    ]),
  );
  assert.equal(ev.title, 'Soup, salad; and pie');
  assert.equal(ev.description, 'One\nTwo');
});

test('a description Church Trac cut mid-word goes back to its last sentence', () => {
  const worship = parseIcs(FIXTURE).find((e) => e.title === 'Worship')!;
  assert.ok(worship.description.endsWith('.'), worship.description);
  assert.ok(!worship.description.endsWith('for G'));
  // No full stop to fall back to: the last whole word and an ellipsis.
  const long = 'word '.repeat(60).trim() + ' wor';
  assert.ok(tidyDescription(long).endsWith('word…'));
  // A short or finished text is left alone.
  assert.equal(tidyDescription('Free donuts.'), 'Free donuts.');
});

test('RRULE: weekly with BYDAY, INTERVAL and COUNT; monthly by ordinal weekday', () => {
  const two = parseIcs(
    ics([
      'UID:c',
      'SUMMARY:Prayer',
      'DTSTART:20261005T120000',
      'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4',
    ]),
  );
  assert.deepEqual(
    occurrences(two, '2026-10-01', '2026-12-31').map((o) => o.date),
    ['2026-10-05', '2026-10-07', '2026-10-12', '2026-10-14'],
  );
  const fortnight = parseIcs(
    ics(['UID:d', 'SUMMARY:Life group', 'DTSTART:20261008T183000', 'RRULE:FREQ=WEEKLY;INTERVAL=2']),
  );
  assert.deepEqual(
    occurrences(fortnight, '2026-10-01', '2026-11-10').map((o) => o.date),
    ['2026-10-08', '2026-10-22', '2026-11-05'],
  );
  const monthly = parseIcs(
    ics(['UID:e', 'SUMMARY:Deacons', 'DTSTART:20261008T190000', 'RRULE:FREQ=MONTHLY;BYDAY=2TH']),
  );
  assert.deepEqual(
    occurrences(monthly, '2026-10-01', '2026-12-31').map((o) => o.date),
    ['2026-10-08', '2026-11-12', '2026-12-10'],
  );
  const last = parseIcs(
    ics(['UID:f', 'SUMMARY:Board', 'DTSTART:20261030T190000', 'RRULE:FREQ=MONTHLY;BYDAY=-1FR']),
  );
  assert.deepEqual(
    occurrences(last, '2026-10-01', '2026-12-31').map((o) => o.date),
    ['2026-10-30', '2026-11-27', '2026-12-25'],
  );
});

test('EXDATE and a cancelled event are left out', () => {
  const evs = parseIcs(
    ics(
      [
        'UID:g',
        'SUMMARY:Choir',
        'DTSTART:20261001T190000',
        'RRULE:FREQ=WEEKLY;COUNT=3',
        'EXDATE:20261008T190000',
      ],
      ['UID:h', 'SUMMARY:Picnic', 'DTSTART:20261003T120000', 'STATUS:CANCELLED'],
    ),
  );
  assert.deepEqual(
    occurrences(evs, '2026-10-01', '2026-10-31').map((o) => o.date),
    ['2026-10-01', '2026-10-15'],
  );
});

test('a rule not read here shows the event once, never invented dates', () => {
  assert.equal(parseRrule('FREQ=MONTHLY;BYDAY=TH;BYSETPOS=2'), null);
  const [ev] = parseIcs(
    ics([
      'UID:i',
      'SUMMARY:Odd',
      'DTSTART:20261001T190000',
      'RRULE:FREQ=MONTHLY;BYDAY=TH;BYSETPOS=2',
    ]),
  );
  assert.equal(ev.recurrence, null);
  assert.ok(ev.unreadRule);
  assert.equal(occurrences([ev], '2026-10-01', '2026-12-31').length, 1);
});

test("What's On from the real feed, as of Friday 2026-09-25", () => {
  const on = whatsOn(parseIcs(FIXTURE), FRIDAY);
  assert.equal(on.today, '2026-09-25');
  // The three weekly rules are standing gatherings, Sunday first.
  assert.deepEqual(
    on.weekly.map((w) => [w.title, w.days, timeRange(w.startMinutes, w.durationMinutes)]),
    [
      ['Sunday School', [0], '9:30 to 10:15 am'],
      ['Breakfast Fellowship', [0], '10:15 to 10:45 am'],
      ['Praise Team Practice', [4], '6:30 to 7:30 pm'],
    ],
  );
  assert.equal(on.weekly[0].next, '2026-09-27');
  // Past events are gone; what is left is by month, this year's months unlabelled by year.
  assert.deepEqual(
    on.months.map((m) => [m.label, m.items.map((i) => i.title)]),
    [
      ['October', ['Membership Class - Week 1']],
      ['November', ['Sam Pace Recital']],
      ['December', ['Amahl and the Night Visitors (BSU Opera)', 'Messiah Sing-In']],
    ],
  );
  assert.equal(on.count, 4);
  assert.equal(on.months[0].items[0].key, 'membership-class-week-1-2026-10-04');
});

test('the same dated event on consecutive weeks reads as one row', () => {
  // Worship was entered one Sunday at a time; as of July 1 it is a run.
  const on = whatsOn(parseIcs(FIXTURE), new Date('2026-07-01T16:00:00Z'));
  const worship = on.months.flatMap((m) => m.items).filter((i) => i.title === 'Worship');
  assert.equal(worship.length, 1);
  assert.equal(worship[0].through, '2026-08-16');
  assert.equal(worship[0].times, 4);
  assert.equal(whenLine(worship[0]), 'Sundays, July 26 to August 16');
  // Snowbird Life Group meets every other week, so it stays two rows.
  assert.equal(
    on.months.flatMap((m) => m.items).filter((i) => i.title === 'Snowbird Life Group').length,
    2,
  );
});

test("today's finished events drop off, today's later ones stay", () => {
  const evs = parseIcs(
    ics(
      ['UID:j', 'SUMMARY:Breakfast', 'DTSTART:20261003T080000', 'DTEND:20261003T090000'],
      ['UID:k', 'SUMMARY:Supper', 'DTSTART:20261003T180000', 'DTEND:20261003T190000'],
    ),
  );
  // 11 am in Muncie on October 3.
  const on = whatsOn(evs, new Date('2026-10-03T15:00:00Z'));
  assert.deepEqual(
    on.months.flatMap((m) => m.items.map((i) => i.title)),
    ['Supper'],
  );
});

test('months carry the year once the list crosses into the next one', () => {
  const evs = parseIcs(
    ics(
      ['UID:l', 'SUMMARY:Watch night', 'DTSTART:20261231T220000'],
      ['UID:m', 'SUMMARY:Epiphany', 'DTSTART:20270106T190000'],
    ),
  );
  assert.deepEqual(
    whatsOn(evs, FRIDAY).months.map((m) => m.label),
    ['December 2026', 'January 2027'],
  );
});

test('words: times, ranges and days', () => {
  assert.equal(timeLabel(570), '9:30 am');
  assert.equal(timeLabel(19 * 60), '7 pm');
  assert.equal(timeLabel(720), '12 noon');
  assert.equal(timeLabel(0), '12 am');
  assert.equal(timeRange(19 * 60, 90), '7 to 8:30 pm');
  assert.equal(timeRange(11 * 60 + 30, 90), '11:30 am to 1 pm');
  assert.equal(timeRange(null, null), 'All day');
  assert.equal(timeRange(645, null), '10:45 am');
  assert.equal(daysPlural([0]), 'Sundays');
  assert.equal(daysPlural([1, 3]), 'Mondays and Wednesdays');
  assert.equal(daysPlural([2, 3, 4]), 'Tuesdays, Wednesdays and Thursdays');
});

test('the calendar code comes from Site settings when it is a Church Trac calendar', () => {
  assert.equal(calendarCode('https://www.churchtrac.com/public_calendar?ui=ABC123'), 'ABC123');
  assert.equal(calendarCode('https://www.churchtrac.com/ical?ui=0C7B1090\u200B'), '0C7B1090');
  assert.equal(calendarCode('https://evil.example/public_calendar?ui=ABC123'), null);
  assert.equal(
    codeFor({ calendarUrl: 'https://www.churchtrac.com/public_calendar?ui=ABC123' }),
    'ABC123',
  );
  // Before the switch: empty, or Church Center's calendar, reads the church's own.
  assert.equal(codeFor({}), FBCM_CALENDAR_CODE);
  assert.equal(
    codeFor({ calendarUrl: 'https://fbcmuncie.churchcenter.com/calendar' }),
    FBCM_CALENDAR_CODE,
  );
  // A Church Trac page with no code is still the church's own calendar.
  assert.equal(
    codeFor({ calendarUrl: 'https://fbcmuncie.churchtrac.com/upcoming_events' }),
    FBCM_CALENDAR_CODE,
  );
  // Some other calendar entirely: this build does not read Church Trac for it.
  assert.equal(codeFor({ calendarUrl: 'https://calendar.google.com/calendar/u/0' }), null);
});

test('the fetch: a calendar is returned, anything else is null and logged', async () => {
  const logs: string[] = [];
  const ok = await fetchCalendar(
    'X',
    async () => new Response(FIXTURE, { status: 200 }),
    1000,
    (m) => logs.push(m),
  );
  assert.ok(ok?.startsWith('BEGIN:VCALENDAR'));
  const bad = await fetchCalendar(
    'X',
    async () => new Response('<html>', { status: 500 }),
    1000,
    (m) => logs.push(m),
  );
  assert.equal(bad, null);
  assert.equal(logs.length, 2);
  const thrown = await fetchCalendar(
    'X',
    async () => {
      throw new Error('offline');
    },
    1000,
    (m) => logs.push(m),
  );
  assert.equal(thrown, null);
  assert.match(logs.at(-1)!, /offline/);
});

test('each dated row is a valid schema.org Event with the church clock offset', async () => {
  const { calendarEventNode } = await import('./church-calendar-schema.ts');
  const { validateNode } = await import('./schema-vocab.ts');
  const on = whatsOn(parseIcs(FIXTURE), FRIDAY);
  const site = { url: 'https://www.fbcmuncie.org', name: 'First Baptist Church Muncie' };
  const nodes = on.months.flatMap((m) =>
    m.items.map((it) =>
      calendarEventNode(it, {
        site: site as never,
        pageUrl: `${site.url}/events`,
        churchName: 'First Baptist Church',
        address: '309 East Adams Street\nMuncie, IN 47305',
      }),
    ),
  );
  for (const n of nodes) assert.deepEqual(validateNode(n), [], JSON.stringify(n));
  const messiah = nodes.find((n) => n.name === 'Messiah Sing-In')!;
  assert.equal(messiah.startDate, '2026-12-11T18:30:00-05:00');
  assert.equal(messiah.endDate, '2026-12-11T20:30:00-05:00');
  const membership = nodes.find((n) => String(n.name).startsWith('Membership'))!;
  assert.equal(membership.startDate, '2026-10-04T09:30:00-04:00');
  assert.equal(
    (membership.location as { name: string }).name,
    'Fellowship Hall, First Baptist Church',
  );
});

test("Home's band: the next three dated rows, soonest first, or none", async () => {
  const { nextEvents } = await import('./church-calendar.ts');
  const on = whatsOn(parseIcs(FIXTURE), FRIDAY);
  assert.deepEqual(
    nextEvents(on).map((i) => i.title),
    ['Membership Class - Week 1', 'Sam Pace Recital', 'Amahl and the Night Visitors (BSU Opera)'],
  );
  assert.deepEqual(nextEvents(null), []);
  // After the last dated event, nothing: the band is not drawn.
  assert.deepEqual(nextEvents(whatsOn(parseIcs(FIXTURE), new Date('2026-12-20T16:00:00Z'))), []);
});

// Church Trac answers 403 to `Accept-Language: *`, which Node's fetch sends by
// default (2026-09-25: every real build got 403 until the header was set).
// This stand-in server behaves the same way, so dropping the header fails here.
test('the fetch sends a real Accept-Language, which Church Trac requires', async () => {
  const churchTrac = async (_url: string, init?: RequestInit) => {
    const h = new Headers(init?.headers);
    const lang = h.get('accept-language');
    return !h.get('user-agent') || !lang || lang.trim() === '*'
      ? new Response('<html>403 Forbidden</html>', { status: 403 })
      : new Response(FIXTURE, { status: 200 });
  };
  const text = await fetchCalendar('X', churchTrac as typeof fetch, 1000, () => {});
  assert.ok(text?.startsWith('BEGIN:VCALENDAR'));
});
