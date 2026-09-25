// Safe to edit by hand
// The church calendar, read from Church Trac's iCal feed (2026-09-25,
// `feat/whats-on`). Pure: no clock (the caller passes `now`), no network, no
// Sanity. The build-time fetch is src/lib/church-calendar-feed.ts; the page
// that draws this is src/pages/events.astro ("What's On").
//
// WHY THE FEED AND NOT THE IFRAME. Church Trac offers an embed, but an iframe
// is its page inside ours: no CSS of ours reaches into it, it is a fixed
// 500px box on a phone, and nothing in it is searchable. The same calendar is
// published as iCal (https://www.churchtrac.com/ical?ui=<code>), so the site
// reads that at build time and draws the events itself. Church Trac stays the
// ONE place an event is typed (CLAUDE.md rule 15): nothing here is stored in
// Sanity, and a Church Trac edit reaches the site on the next rebuild.
//
// WHAT THE FEED LOOKS LIKE (read 2026-09-25, 20 events): plain RFC 5545,
// CRLF, long lines not folded (folding is handled anyway), every time a local
// wall-clock time with a TZID, three weekly RRULEs with an UNTIL, no EXDATE,
// no categories, no URLs. A standing Sunday service can arrive either way:
// Sunday School is one weekly RRULE, but Worship was entered as separate
// dated events, one per Sunday. Both read the same here (see `series`).
//
// THE TIME ZONE IS WRONG AT THE SOURCE, SO IT IS IGNORED. Every DTSTART says
// TZID=America/Halifax (Atlantic time) while the times are plainly Muncie's
// own (Sunday School 9:30, Worship 10:45, both matching Site settings). The
// Church Trac account's time zone is set to Atlantic. So a TZID time is read
// as the wall clock IN MUNCIE, whatever zone it names; only a UTC time (a
// trailing Z) is converted. When the account is fixed the TZID changes and
// nothing here needs to. `feedZones()` reports the zones the feed names so the
// build log can say so (church-calendar-feed.ts).
//
// DESCRIPTIONS ARE CUT AT THE SOURCE. Church Trac stops a description at about
// 250 characters, mid-word ("dismissed prior to the sermon for G").
// `tidyDescription` trims such a text back to its last whole sentence, so the
// page never prints a broken word.

export const CHURCH_TIME_ZONE = 'America/Indiana/Indianapolis';

/** A day on the church's calendar, "YYYY-MM-DD". */
export type IsoDay = string;

export interface Recurrence {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  /** Last day an occurrence may fall on (inclusive), church calendar. */
  until: IsoDay | null;
  count: number | null;
  /** BYDAY for a weekly rule: 0 = Sunday ... 6 = Saturday. */
  byDay: number[];
  /** BYDAY with an ordinal for a monthly rule ("2TH" = second Thursday, -1 = last). */
  byDayOrdinal: Array<{ day: number; nth: number }>;
  /** BYMONTHDAY for a monthly rule. */
  byMonthDay: number[];
}

export interface CalendarEvent {
  uid: string;
  title: string;
  location: string;
  description: string;
  date: IsoDay;
  /** Minutes after midnight on the church's clock; null for an all-day event. */
  startMinutes: number | null;
  /** Length in minutes; null when the feed gives no end (or an all-day event). */
  durationMinutes: number | null;
  /** How many days an all-day event spans (1 for a single day). */
  allDayDays: number;
  recurrence: Recurrence | null;
  /** RRULE text we could not read; the event then shows once, on its first date. */
  unreadRule: string | null;
  exdates: Set<IsoDay>;
  cancelled: boolean;
  /** The zone the feed named for DTSTART, or "UTC", or "" (floating / all-day). */
  zone: string;
}

export interface Occurrence {
  uid: string;
  title: string;
  location: string;
  description: string;
  date: IsoDay;
  startMinutes: number | null;
  durationMinutes: number | null;
  allDayDays: number;
}

// ── Reading the file ────────────────────────────────────────────────────────

/** RFC 5545 3.1: a line starting with a space or tab continues the one before. */
export function unfold(text: string): string[] {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n');
}

/** A TEXT value unescaped (RFC 5545 3.3.11). */
export function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));
}

interface Prop {
  name: string;
  params: Record<string, string>;
  value: string;
}

/** "DTSTART;TZID=America/Halifax:20260712T093000" -> name, params, value. */
export function parseLine(line: string): Prop | null {
  // The value starts at the first colon outside a quoted parameter value.
  let inQuote = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ':' && !inQuote) {
      colon = i;
      break;
    }
  }
  if (colon < 1) return null;
  const [rawName, ...rawParams] = line.slice(0, colon).split(';');
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: rawName.toUpperCase(), params, value: line.slice(colon + 1) };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** A Date's calendar day and wall-clock minutes in the church's zone. */
export function churchClock(d: Date): { date: IsoDay; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHURCH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

interface Stamp {
  date: IsoDay;
  minutes: number | null;
  zone: string;
}

/**
 * A DATE or DATE-TIME value as a day and wall-clock minutes on the church's
 * calendar. A TZID or floating time is taken as Muncie's wall clock (the
 * header says why); a UTC time is converted.
 */
export function readStamp(value: string, params: Record<string, string>): Stamp | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, hh, mm, , z] = m;
  if (hh === undefined || params.VALUE === 'DATE') {
    return { date: `${y}-${mo}-${d}`, minutes: null, zone: '' };
  }
  if (z) {
    const at = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm));
    const c = churchClock(at);
    return { date: c.date, minutes: c.minutes, zone: 'UTC' };
  }
  return { date: `${y}-${mo}-${d}`, minutes: +hh * 60 + +mm, zone: params.TZID ?? '' };
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** An RRULE value as a Recurrence, or null when it uses parts not read here. */
export function parseRrule(value: string): Recurrence | null {
  const parts: Record<string, string> = {};
  for (const kv of value.split(';')) {
    const eq = kv.indexOf('=');
    if (eq > 0) parts[kv.slice(0, eq).toUpperCase()] = kv.slice(eq + 1).toUpperCase();
  }
  const freq = parts.FREQ;
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY' && freq !== 'YEARLY') return null;
  // Parts that narrow a rule in ways not modelled here: better to show the
  // event once than to invent dates it never has.
  for (const k of ['BYSETPOS', 'BYWEEKNO', 'BYYEARDAY', 'BYHOUR', 'BYMINUTE', 'BYSECOND']) {
    if (parts[k]) return null;
  }
  if (parts.BYMONTH && freq !== 'YEARLY') return null;
  const interval = Math.max(1, Number(parts.INTERVAL ?? 1) || 1);
  let until: IsoDay | null = null;
  if (parts.UNTIL) {
    const s = readStamp(parts.UNTIL, {});
    if (!s) return null;
    until = s.date;
  }
  const count = parts.COUNT ? Math.max(0, Number(parts.COUNT) || 0) : null;
  const byDay: number[] = [];
  const byDayOrdinal: Array<{ day: number; nth: number }> = [];
  for (const token of (parts.BYDAY ?? '').split(',').filter(Boolean)) {
    const t = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/.exec(token);
    if (!t) return null;
    const day = WEEKDAYS.indexOf(t[2]);
    if (t[1]) byDayOrdinal.push({ day, nth: Number(t[1]) });
    else byDay.push(day);
  }
  if (freq === 'WEEKLY' && byDayOrdinal.length) return null;
  if (freq === 'MONTHLY' && byDay.length) return null; // "every Thursday of the month": not modelled
  if ((freq === 'DAILY' || freq === 'YEARLY') && (byDay.length || byDayOrdinal.length)) return null;
  const byMonthDay = (parts.BYMONTHDAY ?? '')
    .split(',')
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n !== 0 && Math.abs(n) <= 31);
  return { freq, interval, until, count, byDay, byDayOrdinal, byMonthDay };
}

/** Every VEVENT in an iCal file. Anything unreadable is skipped, never guessed. */
export function parseIcs(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let cur: Prop[] | null = null;
  let depth = 0; // nested components inside a VEVENT (a VALARM) are ignored
  for (const line of unfold(text)) {
    if (!line) continue;
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      cur = [];
      depth = 0;
      continue;
    }
    if (!cur) continue;
    if (upper.startsWith('BEGIN:')) {
      depth++;
      continue;
    }
    if (upper.startsWith('END:') && depth > 0) {
      depth--;
      continue;
    }
    if (upper === 'END:VEVENT') {
      const ev = toEvent(cur);
      if (ev) events.push(ev);
      cur = null;
      continue;
    }
    if (depth === 0) {
      const p = parseLine(line);
      if (p) cur.push(p);
    }
  }
  return events;
}

function toEvent(props: Prop[]): CalendarEvent | null {
  const one = (name: string) => props.find((p) => p.name === name);
  const text = (name: string) => {
    const p = one(name);
    return p ? unescapeText(p.value).trim() : '';
  };
  const startProp = one('DTSTART');
  const title = text('SUMMARY').replace(/\s+/g, ' ');
  if (!startProp || !title) return null;
  const start = readStamp(startProp.value, startProp.params);
  if (!start) return null;

  // The end: DTEND, else DURATION, else none. All-day ends are exclusive.
  let durationMinutes: number | null = null;
  let allDayDays = 1;
  const endProp = one('DTEND');
  const end = endProp ? readStamp(endProp.value, endProp.params) : null;
  if (start.minutes === null) {
    if (end && end.minutes === null) allDayDays = Math.max(1, daysBetween(start.date, end.date));
  } else if (end && end.minutes !== null) {
    const d = daysBetween(start.date, end.date) * 1440 + end.minutes - start.minutes;
    if (d > 0) durationMinutes = d;
  } else {
    const dur = one('DURATION');
    const m = dur && /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(dur.value.trim());
    if (m) {
      const d = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
      if (d > 0) durationMinutes = d;
    }
  }

  const rruleProp = one('RRULE');
  const recurrence = rruleProp ? parseRrule(rruleProp.value) : null;
  const exdates = new Set<IsoDay>();
  for (const p of props.filter((q) => q.name === 'EXDATE')) {
    for (const v of p.value.split(',')) {
      const s = readStamp(v, p.params);
      if (s) exdates.add(s.date);
    }
  }
  return {
    uid: text('UID') || `${start.date}-${title}`,
    title,
    location: text('LOCATION').replace(/\s+/g, ' '),
    description: tidyDescription(text('DESCRIPTION')),
    date: start.date,
    startMinutes: start.minutes,
    durationMinutes,
    allDayDays,
    recurrence,
    unreadRule: rruleProp && !recurrence ? rruleProp.value : null,
    exdates,
    cancelled: text('STATUS').toUpperCase() === 'CANCELLED',
    zone: start.zone,
  };
}

/** The TZIDs a feed's events name, for the build log. */
export function feedZones(events: CalendarEvent[]): string[] {
  return [...new Set(events.map((e) => e.zone).filter((z) => z && z !== 'UTC'))];
}

/** Church Trac's cut: descriptions stop at about 250 characters. */
export const SOURCE_CUT = 245;

/**
 * A description tidied for the page: spaces and blank lines collapsed, and a
 * text Church Trac cut mid-sentence trimmed back to its last whole sentence
 * (or its last whole word and an ellipsis, when it has no full stop at all).
 */
export function tidyDescription(raw: string): string {
  const text = String(raw ?? '')
    .split(/\n+/)
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
  if (text.length < SOURCE_CUT || /[.!?)"'’”]$/.test(text)) return text;
  const lastStop = Math.max(
    ...['. ', '! ', '? ', '.\n', '!\n', '?\n'].map((s) => text.lastIndexOf(s)),
  );
  if (lastStop > 40) return text.slice(0, lastStop + 1).trim();
  const lastSpace = text.lastIndexOf(' ');
  return (lastSpace > 0 ? text.slice(0, lastSpace) : text).replace(/[,;:]$/, '') + '…';
}

// ── Calendar arithmetic ─────────────────────────────────────────────────────

const toUtc = (iso: IsoDay) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number): IsoDay => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
export const addDays = (iso: IsoDay, n: number): IsoDay => fromUtc(toUtc(iso) + n * 86_400_000);
export const daysBetween = (a: IsoDay, b: IsoDay): number =>
  Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
/** 0 = Sunday ... 6 = Saturday. */
export const weekday = (iso: IsoDay): number => new Date(toUtc(iso)).getUTCDay();
const daysInMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

/** The days a recurring event falls on, from its first date, in order, up to `to`. */
function* recurrenceDays(ev: CalendarEvent, to: IsoDay): Generator<IsoDay> {
  const r = ev.recurrence;
  if (!r) {
    yield ev.date;
    return;
  }
  const last = r.until && r.until < to ? r.until : to;
  let emitted = 0;
  const emit = function* (day: IsoDay): Generator<IsoDay> {
    if (day < ev.date || day > last) return;
    if (r.count !== null && emitted >= r.count) return;
    emitted++; // COUNT counts excluded dates too (RFC 5545 3.8.5.1)
    yield day;
  };
  const [y0, m0] = ev.date.split('-').map(Number);
  // Plenty of periods to cover any window a church calendar asks for.
  for (let i = 0; i < 5000; i++) {
    if (r.count !== null && emitted >= r.count) return;
    if (r.freq === 'DAILY') {
      const day = addDays(ev.date, i * r.interval);
      if (day > last) return;
      yield* emit(day);
    } else if (r.freq === 'WEEKLY') {
      const days = r.byDay.length ? [...r.byDay].sort() : [weekday(ev.date)];
      // Weeks run Monday to Sunday (WKST's default); find this period's Monday.
      const monday = addDays(ev.date, -((weekday(ev.date) + 6) % 7) + i * 7 * r.interval);
      if (monday > last) return;
      const inWeek = days
        .map((d) => addDays(monday, (d + 6) % 7))
        .sort()
        .filter((d) => d >= ev.date);
      for (const d of inWeek) yield* emit(d);
    } else if (r.freq === 'MONTHLY') {
      const mIndex = m0 - 1 + i * r.interval;
      const y = y0 + Math.floor(mIndex / 12);
      const m = mIndex % 12;
      const first = `${y}-${pad(m + 1)}-01`;
      if (first > last) return;
      const dim = daysInMonth(y, m);
      let days: number[] = [];
      if (r.byDayOrdinal.length) {
        for (const { day, nth } of r.byDayOrdinal) {
          const firstDow = weekday(first);
          const firstHit = 1 + ((day - firstDow + 7) % 7);
          const hits: number[] = [];
          for (let d = firstHit; d <= dim; d += 7) hits.push(d);
          const pick = nth > 0 ? hits[nth - 1] : hits[hits.length + nth];
          if (pick) days.push(pick);
        }
      } else {
        const want = r.byMonthDay.length ? r.byMonthDay : [Number(ev.date.slice(8, 10))];
        days = want.map((d) => (d > 0 ? d : dim + d + 1)).filter((d) => d >= 1 && d <= dim);
      }
      for (const d of [...new Set(days)].sort((a, b) => a - b)) {
        yield* emit(`${y}-${pad(m + 1)}-${pad(d)}`);
      }
    } else {
      const y = y0 + i * r.interval;
      const day = `${y}-${ev.date.slice(5)}`;
      if (`${y}-01-01` > last) return;
      // A February 29 event keeps to leap years, as RFC 5545 says.
      if (Number(day.slice(8)) <= daysInMonth(y, Number(day.slice(5, 7)) - 1)) yield* emit(day);
    }
  }
}

/** Every occurrence between two church days (inclusive), in date and time order. */
export function occurrences(events: CalendarEvent[], from: IsoDay, to: IsoDay): Occurrence[] {
  const out: Occurrence[] = [];
  for (const ev of events) {
    if (ev.cancelled) continue;
    for (const day of recurrenceDays(ev, to)) {
      // An all-day event spanning several days is still on while it lasts.
      const lastDay = addDays(day, ev.allDayDays - 1);
      if (lastDay < from || day > to || ev.exdates.has(day)) continue;
      out.push({
        uid: ev.uid,
        title: ev.title,
        location: ev.location,
        description: ev.description,
        date: day,
        startMinutes: ev.startMinutes,
        durationMinutes: ev.durationMinutes,
        allDayDays: ev.allDayDays,
      });
    }
  }
  return out.sort(byWhen);
}

const byWhen = (a: Occurrence, b: Occurrence) =>
  a.date.localeCompare(b.date) ||
  (a.startMinutes ?? -1) - (b.startMinutes ?? -1) ||
  a.title.localeCompare(b.title);

// ── What the page draws ─────────────────────────────────────────────────────

/** A standing weekly gathering: "Sundays, 9:30 am, Sunday School". */
export interface WeeklyItem {
  key: string;
  title: string;
  location: string;
  description: string;
  /** 0 = Sunday ... 6 = Saturday, in week order starting Sunday. */
  days: number[];
  startMinutes: number | null;
  durationMinutes: number | null;
  /** The next date it meets, for the calendar file. */
  next: IsoDay;
}

/** A dated row: one event, or a run of the same event on consecutive weeks. */
export interface DatedItem {
  key: string;
  title: string;
  location: string;
  description: string;
  date: IsoDay;
  startMinutes: number | null;
  durationMinutes: number | null;
  allDayDays: number;
  /** For a run: the last date, when the event repeats weekly on the same day and time. */
  through: IsoDay | null;
  /** How many dates the row stands for (1 for a single event). */
  times: number;
}

export interface MonthGroup {
  /** "2026-10" */
  key: string;
  /** "October 2026" (or "October" when every group is in the current year). */
  label: string;
  items: DatedItem[];
}

export interface WhatsOn {
  today: IsoDay;
  weekly: WeeklyItem[];
  months: MonthGroup[];
  /** How many dated rows in total. */
  count: number;
}

/** How far ahead the page looks, in days. */
export const HORIZON_DAYS = 183;
/** A run of the same dated event this long or longer reads as one row. */
export const RUN_MIN = 3;

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'event';

/** A stable, readable file key for an item ("messiah-sing-in-2026-12-11"). */
export const datedKey = (title: string, date: IsoDay) => `${slug(title)}-${date}`;
export const weeklyKey = (title: string) => `${slug(title)}-weekly`;

/**
 * Is this recurring event a standing weekly gathering (drawn in "Every week"
 * rather than as dated rows)? A plain weekly rule, every week, still running.
 */
function isStandingWeekly(ev: CalendarEvent, today: IsoDay): boolean {
  const r = ev.recurrence;
  return (
    !!r &&
    r.freq === 'WEEKLY' &&
    r.interval === 1 &&
    r.count === null &&
    (!r.until || r.until >= today)
  );
}

/**
 * What the page draws, as of `now`:
 *  - `weekly`: the standing weekly gatherings, Sunday first, then by time;
 *  - `months`: every other occurrence from today to HORIZON_DAYS ahead, by
 *    month. The same event on RUN_MIN or more consecutive weeks, same day and
 *    time (Worship entered one Sunday at a time), reads as one row, "through".
 * Today's events that have already finished are dropped.
 */
export function whatsOn(events: CalendarEvent[], now: Date, horizonDays = HORIZON_DAYS): WhatsOn {
  const clock = churchClock(now);
  const today = clock.date;
  const to = addDays(today, horizonDays);
  const live = events.filter((e) => !e.cancelled);

  // Standing weekly gatherings, grouped by title and time (one rule each today,
  // but a church might enter Tuesday and Thursday as two).
  const weeklyEvents = live.filter((e) => isStandingWeekly(e, today));
  const weeklyMap = new Map<string, WeeklyItem>();
  for (const ev of weeklyEvents) {
    const next = occurrences([ev], today, addDays(today, 7 * 8))[0];
    if (!next) continue; // not meeting in the next eight weeks
    const days = ev.recurrence!.byDay.length ? ev.recurrence!.byDay : [weekday(ev.date)];
    const k = `${ev.title.toLowerCase()}|${ev.startMinutes}`;
    const had = weeklyMap.get(k);
    if (had) {
      had.days = [...new Set([...had.days, ...days])].sort();
      if (next.date < had.next) had.next = next.date;
    } else {
      weeklyMap.set(k, {
        key: weeklyKey(ev.title),
        title: ev.title,
        location: ev.location,
        description: ev.description,
        days: [...new Set(days)].sort(),
        startMinutes: ev.startMinutes,
        durationMinutes: ev.durationMinutes,
        next: next.date,
      });
    }
  }
  const weekly = [...weeklyMap.values()].sort(
    (a, b) => a.days[0] - b.days[0] || (a.startMinutes ?? -1) - (b.startMinutes ?? -1),
  );
  // Two items sharing a slug would share a file: suffix the later ones.
  dedupeKeys(weekly);

  const dated = occurrences(
    live.filter((e) => !isStandingWeekly(e, today)),
    today,
    to,
  ).filter((o) => {
    // Drop what has already finished today.
    if (o.date !== today || o.startMinutes === null) return true;
    const end = o.startMinutes + (o.durationMinutes ?? 60);
    return end > clock.minutes;
  });

  const items = runs(dated);
  dedupeKeys(items);

  const monthMap = new Map<string, DatedItem[]>();
  for (const it of items) {
    const k = it.date.slice(0, 7);
    if (!monthMap.has(k)) monthMap.set(k, []);
    monthMap.get(k)!.push(it);
  }
  const thisYear = today.slice(0, 4);
  const allThisYear = [...monthMap.keys()].every((k) => k.startsWith(thisYear));
  const months = [...monthMap.entries()].map(([key, list]) => ({
    key,
    label: monthLabel(key, !allThisYear),
    items: list,
  }));
  return { today, weekly, months, count: items.length };
}

/** Collapse the same event on consecutive weeks (same weekday and time) into one row. */
function runs(list: Occurrence[]): DatedItem[] {
  const sig = (o: Occurrence) =>
    `${o.title.toLowerCase()}|${o.startMinutes}|${o.location.toLowerCase()}|${weekday(o.date)}`;
  const groups = new Map<string, Occurrence[]>();
  for (const o of list) {
    if (!groups.has(sig(o))) groups.set(sig(o), []);
    groups.get(sig(o))!.push(o);
  }
  const used = new Set<Occurrence>();
  const out: DatedItem[] = [];
  for (const o of list) {
    if (used.has(o)) continue;
    const same = groups.get(sig(o))!;
    const run = [o];
    for (let i = same.indexOf(o) + 1; i < same.length; i++) {
      if (daysBetween(run[run.length - 1].date, same[i].date) === 7) run.push(same[i]);
      else break;
    }
    const isRun = run.length >= RUN_MIN && o.allDayDays === 1;
    for (const r of isRun ? run : [o]) used.add(r);
    out.push({
      key: datedKey(o.title, o.date),
      title: o.title,
      location: o.location,
      description: o.description,
      date: o.date,
      startMinutes: o.startMinutes,
      durationMinutes: o.durationMinutes,
      allDayDays: o.allDayDays,
      through: isRun ? run[run.length - 1].date : null,
      times: isRun ? run.length : 1,
    });
  }
  return out;
}

function dedupeKeys(items: Array<{ key: string }>) {
  const seen = new Map<string, number>();
  for (const it of items) {
    const n = seen.get(it.key) ?? 0;
    seen.set(it.key, n + 1);
    if (n > 0) it.key = `${it.key}-${n + 1}`;
  }
}

// ── Words ───────────────────────────────────────────────────────────────────

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const monthLabel = (key: string, withYear: boolean): string => {
  const [y, m] = key.split('-').map(Number);
  return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
};

export const dayName = (iso: IsoDay): string => DAY_NAMES[weekday(iso)];
export const dayShort = (iso: IsoDay): string => DAY_NAMES[weekday(iso)].slice(0, 3);
export const dayOfMonth = (iso: IsoDay): number => Number(iso.slice(8, 10));
export const monthShort = (iso: IsoDay): string => MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3);

/** "October 4" */
export const dateLabel = (iso: IsoDay): string =>
  `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${dayOfMonth(iso)}`;

/** Wall-clock minutes as "9:30 am", "7 pm", "12 noon". */
export function timeLabel(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  if (m === 720) return '12 noon';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${mm ? `:${pad(mm)}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

/** "9:30 to 10:15 am", "7 to 8:30 pm", "11:30 am to 1 pm"; the start alone with no end. */
export function timeRange(start: number | null, duration: number | null): string {
  if (start === null) return 'All day';
  if (!duration) return timeLabel(start);
  const end = start + duration;
  if (end >= 1440) return timeLabel(start);
  const a = timeLabel(start);
  const b = timeLabel(end);
  const sameHalf = start < 720 === end < 720 && start !== 720 && end !== 720;
  return sameHalf ? `${a.replace(/ [ap]m$/, '')} to ${b}` : `${a} to ${b}`;
}

/** "Sundays", "Mondays and Wednesdays", "Tuesdays, Wednesdays and Thursdays". */
export function daysPlural(days: number[]): string {
  const names = days.map((d) => `${DAY_NAMES[d]}s`);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The dated row's day line: "Sunday, October 4", or a run's "Sundays through November 1". */
export function whenLine(it: Pick<DatedItem, 'date' | 'through' | 'allDayDays'>): string {
  if (it.through) return `${dayName(it.date)}s, ${dateLabel(it.date)} to ${dateLabel(it.through)}`;
  if (it.allDayDays > 1) {
    const last = addDays(it.date, it.allDayDays - 1);
    return `${dateLabel(it.date)} to ${dateLabel(last)}`;
  }
  return `${dayName(it.date)}, ${dateLabel(it.date)}`;
}

// ── Home ────────────────────────────────────────────────────────────────────

/** How many dated rows Home's "What's On" band shows. */
export const HOME_EVENTS = 3;

/**
 * The next dated rows for Home's band, soonest first, or [] (the band is then
 * not drawn). Weekly gatherings are left to the Sunday-times band above them.
 */
export function nextEvents(on: WhatsOn | null | undefined, n: number = HOME_EVENTS): DatedItem[] {
  return (on?.months ?? []).flatMap((m) => m.items).slice(0, Math.max(0, n));
}
