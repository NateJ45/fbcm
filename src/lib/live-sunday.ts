// Safe to edit by hand
// The one dated line on the site. The server renders staticSunday(), which is
// true at any moment and needs no clock; the browser upgrades it in place with
// formatLiveSunday(), which reads the VISITOR's clock rather than the build
// machine's. That order matters: a date baked at build time would be wrong for
// every visitor after the following Sunday, and a static page is cached.
//
// Pure functions, no DOM, unit-tested in live-sunday.test.ts. Callers pass
// serviceTime through splitStega().cleaned FIRST: this module measures and
// rewrites the string, and a stega payload is written in zero-width characters
// that U+FEFF makes match `\s` (CLAUDE.md, the preview rules). An encoded
// string would survive the regex below looking fine and carry its payload into
// a data- attribute.
//
// BaseLayout carries a hand-inlined 12-line copy of these two functions in its
// upgrade script, because that script is `is:inline` and cannot import. Keep
// the two in step; this file is the one the tests watch.

/** "Sundays at 10:45 am" -> "10:45 am". A bare time passes through unchanged. */
export function timeOnly(serviceTime: string): string {
  return serviceTime.replace(/^Sundays?\s+at\s+/i, '').trim();
}

/**
 * A time split for display: "10:45 am" -> { clock: "10:45", meridiem: "am" }.
 * The footer's closing band sets the clock in Castoro Titling, which has no
 * lower case, so a meridiem left inside it would read "AM" while every other
 * time on the site reads "am". The meridiem is returned lower-case, with its
 * dots dropped ("P.M." -> "pm"), for the reading face. A string with no
 * trailing meridiem comes back whole as the clock with an empty meridiem.
 */
export function clockParts(time: string): { clock: string; meridiem: string } {
  const m = /^(.*?\d)\s*([ap])\.?\s*m\.?$/i.exec(time.trim());
  if (!m) return { clock: time.trim(), meridiem: '' };
  return { clock: m[1] ?? '', meridiem: `${(m[2] ?? '').toLowerCase()}m` };
}

/** The server-rendered form: true whatever day it is, so no-JS sees no lie. */
export function staticSunday(serviceTime: string): string {
  return `Sundays · Worship at ${timeOnly(serviceTime)}`;
}

/**
 * The client-side upgrade: names today, or the Sunday that is coming. With
 * `withSermon` the service time is left off, because the sermon half that
 * follows the line takes its place (see liveSundayLine below).
 */
export function formatLiveSunday(now: Date, serviceTime: string, withSermon = false): string {
  const add = (7 - now.getDay()) % 7;
  const worship = withSermon ? '' : ` · Worship at ${timeOnly(serviceTime)}`;
  if (add === 0) return `Today${worship}`;
  const s = new Date(now);
  s.setDate(now.getDate() + add);
  const label = s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `This Sunday, ${label}${worship}`;
}

// ── This Sunday's sermon (2026-09-24) ────────────────────────────────────────
// When the build finds a sermon preview for the coming Sunday
// (src/lib/sunday-sermon.ts picks it; nothing is typed, CLAUDE.md rule 15),
// the home hero's dated line names the sermon instead of the service time,
// which the hero's facts row states directly underneath:
//
//   This Sunday, September 27 · ‘When God Shows Up’ · Jeremiah 29:10-12
//
// The date half is still the visitor's clock's business. The sermon half was
// baked at build time, and a static page outlives its Sunday, so the upgrade
// script keeps it only while the Sunday the LINE names is the Sunday the
// preview was written for, and otherwise drops it and puts the service time
// back. Comparing against the line's own Sunday (not the church's) is the
// invariant that matters: the sermon can never sit beside a date it does not
// belong to, whatever time zone the visitor is in.

/** The coming Sunday's sermon, as the hero draws it. All strings stega-clean. */
export interface SundaySermon {
  /** The Sunday it was written for, YYYY-MM-DD on the church's calendar. */
  sunday: string;
  /** The preview post, e.g. /post/when-god-shows-up. */
  href: string;
  /** The title as displayed below 640px: quoted, and shortened by the rules below. */
  title: string;
  /** The title from 640px to 1023px (SERMON_TITLE_MAX_SM); equal to `title` when it fits both. */
  titleSm: string;
  /** The title from 1024px (SERMON_TITLE_MAX_LG); usually the whole title. */
  titleLg: string;
  /** The reading ("Jeremiah 29:10-12"), or '' when absent or already in the title. */
  reading: string;
  /** Whether the reading still fits beside the title on a 320px phone. */
  readingOnPhone: boolean;
}

/**
 * THE LENGTH RULES. The line is set in the uppercase furniture face at 13px
 * with tracking, beside a 44px gold dash, and it must never wrap badly at a
 * 320px phone. Measured in the browser at 320px (see SERMON_TITLE_MAX), one
 * line beside the dash holds about that many capitals, so the sermon half is
 * built to fit ONE such line on its own and wraps, as a unit, under the date:
 *
 *   1. The title loses a trailing parenthesis or bracket ("Proclaim (The Way
 *      [Discipleship] Goal 2025-2026)" -> "Proclaim") when it is too long.
 *   2. A title still longer than SERMON_TITLE_MAX is cut at the last word
 *      that fits and gets an ellipsis.
 *   3. The reading never repeats a title that already names it. On a wide
 *      screen it always follows the title; on a phone it shows only when
 *      title and reading together fit SERMON_LINE_MAX. The reading drops
 *      before the title is ever shortened for it.
 */
// Measured 2026-09-24 in Chromium at 320px: the words beside the dash get
// 238px, and these capitals average 8.1 to 8.5px ("THIS SUNDAY, SEPTEMBER 27"
// is 202px, "‘WHEN GOD SHOWS UP’" 162px). 24 characters plus the two quotes
// is about 220px, which leaves room for a run of wide letters; anything that
// still overflows wraps inside the column (max-w-full), never off the page.
export const SERMON_TITLE_MAX = 24;
export const SERMON_LINE_MAX = 28;

// THE WIDER CAPS (2026-09-24, `fix/sunday-title-length`). The 24-character
// cap is a PHONE measurement, and applied at every width it cut "How to Let
// Your 'Yes' Be Yes and Your 'No,' No" to four words on a 1440px screen. The
// server now renders the title three times, one span per band of widths, and
// CSS shows one (Hero.astro), so no script is involved. Measured in Chromium
// with the real face (Sofia Sans Semi Condensed, 13px, 1.82px tracking,
// uppercase): 8.1px per capital on a mixed title, 11.9px for a run of W and M,
// the quotes 10px, "THIS SUNDAY, SEPTEMBER 27 · " 212px, " · MATTHEW 21:23-32"
// 149px. The words beside the dash get 518px at 640 and 864px at 1024.
//
//   640 to 1023: the sermon half wraps under the date, so it must fit 518px
//     on its own WITH the reading, which always shows from 640. A reading of
//     20 characters and its dot are about 165px, the quotes 10px, leaving
//     343px, 40 capitals at a cautious 8.5px.
//   1024 and up: the whole line fits one row of 864px: the date half 212px,
//     the reading 165px and the quotes 10px leave 477px, 56 capitals at 8.5px.
//     A longer title (or reading) wraps, as a unit, under the date, where it
//     has all 864px.
export const SERMON_TITLE_MAX_SM = 40;
export const SERMON_TITLE_MAX_LG = 56;

const QUOTES = /^[\s'"‘’“”]+|[\s'"‘’“”]+$/g;

/**
 * Curly quotes inside a title. The title itself sits in single quotes on the
 * line (‘…’), so a word quoted INSIDE it takes double quotes: ‘How to Let
 * Your “Yes” Be Yes’. Doubles, because the line is set in capitals where an
 * inner ‘YES’ is the same shape as the apostrophe in GOD’S and the outer
 * quotes, and "YOUR ’NO,’ NO’" reads as three elisions; “NO,” cannot be
 * mistaken for anything. A straight quote opens when it follows a space or an
 * opening bracket and a letter follows it, and closes at the next quote that
 * is not followed by a letter; every other single quote is an apostrophe (’).
 */
export function curlInnerQuotes(t: string): string {
  let open = false;
  let out = '';
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i] ?? '';
    if (c !== "'" && c !== '"') {
      out += c;
      continue;
    }
    const prev = t[i - 1] ?? ' ';
    const next = t[i + 1] ?? ' ';
    const letterNext = /[\p{L}\p{N}]/u.test(next);
    if (!open && /[\s([“‘]/.test(prev) && letterNext) {
      out += '“';
      open = true;
    } else if (open && !letterNext) {
      out += '”';
      open = false;
    } else {
      out += c === '"' ? '”' : '’';
    }
  }
  return out;
}

/** The title as the line shows it, without its quotes: rules 1 and 2. */
export function shortSermonTitle(raw: string, max: number = SERMON_TITLE_MAX): string {
  let t = curlInnerQuotes(raw.replace(/\s+/g, ' ').replace(QUOTES, '').trim());
  if (t.length > max) {
    const bare = t.replace(/\s*[([][^()[\]]*(?:\[[^\]]*\][^()[\]]*)*[)\]]\s*$/, '').trim();
    if (bare) t = bare;
  }
  if (t.length <= max) return t;
  const cut = t.slice(0, max); // leaves room for the ellipsis
  const at = cut.lastIndexOf(' ');
  let head = (at > 0 ? cut.slice(0, at) : cut.slice(0, max - 1)).replace(/[\s\-–,:;&.]+$/, '');
  // Never leave an inner quote open: cut back to before it.
  const opened = head.lastIndexOf('“');
  if (opened > head.lastIndexOf('”') && opened > 0) {
    head = head.slice(0, opened).replace(/[\s\-–,:;&.]+$/, '');
  }
  return `${head}…`;
}

/**
 * Build the sermon half from a title and a reading (both already cleaned).
 * Returns the displayed title (in curly quotes) and the reading, or '' for a
 * reading that does not fit or repeats the title (rule 3).
 */
export function sermonParts(
  rawTitle: string,
  rawReading: string,
): Pick<SundaySermon, 'title' | 'titleSm' | 'titleLg' | 'reading' | 'readingOnPhone'> | null {
  const short = shortSermonTitle(rawTitle);
  if (!short) return null;
  const title = `‘${short}’`;
  const titleSm = `‘${shortSermonTitle(rawTitle, SERMON_TITLE_MAX_SM)}’`;
  const titleLg = `‘${shortSermonTitle(rawTitle, SERMON_TITLE_MAX_LG)}’`;
  let reading = rawReading.replace(/\s+/g, ' ').trim();
  if (reading && rawTitle.toLowerCase().includes(reading.toLowerCase())) reading = '';
  const readingOnPhone = reading !== '' && title.length + 3 + reading.length <= SERMON_LINE_MAX;
  return { title, titleSm, titleLg, reading, readingOnPhone };
}

/**
 * The spans the hero draws the title in, one per distinct string, each with
 * the band of widths it shows at. A title that fits every cap is ONE span with
 * no band, so the common case renders exactly one copy.
 */
export function sermonTitleSpans(
  s: Pick<SundaySermon, 'title' | 'titleSm' | 'titleLg'>,
): { text: string; band: 'all' | 'phone' | 'sm' | 'lg' | 'smUp' | 'belowLg' }[] {
  const { title, titleSm, titleLg } = s;
  if (title === titleSm && titleSm === titleLg) return [{ text: title, band: 'all' }];
  if (title === titleSm) {
    return [
      { text: title, band: 'belowLg' },
      { text: titleLg, band: 'lg' },
    ];
  }
  if (titleSm === titleLg) {
    return [
      { text: title, band: 'phone' },
      { text: titleSm, band: 'smUp' },
    ];
  }
  return [
    { text: title, band: 'phone' },
    { text: titleSm, band: 'sm' },
    { text: titleLg, band: 'lg' },
  ];
}

/** The sermon half's text: "‘When God Shows Up’ · Jeremiah 29:10-12". */
export function sermonText(s: Pick<SundaySermon, 'title' | 'reading'>): string {
  return s.reading ? `${s.title} · ${s.reading}` : s.title;
}

/**
 * The server-rendered date half when there is a sermon: "Sunday, September
 * 27". A named day is true at any moment, so a visitor without JavaScript
 * never reads "This Sunday" about a Sunday that has gone.
 */
export function datedSunday(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const label = d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' });
  return `Sunday, ${label}`;
}

/** YYYY-MM-DD of the Sunday the line names, on the VISITOR's calendar. */
export function lineSundayIso(now: Date): string {
  const s = new Date(now);
  s.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${s.getFullYear()}-${p(s.getMonth() + 1)}-${p(s.getDate())}`;
}

/**
 * The whole client-side decision for one line: its text, and whether the
 * sermon half stays. `sermonSunday` is '' when the build found no sermon.
 */
export function liveSundayLine(
  now: Date,
  serviceTime: string,
  sermonSunday: string,
): { text: string; sermon: boolean } {
  const sermon = sermonSunday !== '' && lineSundayIso(now) === sermonSunday;
  return { text: formatLiveSunday(now, serviceTime, sermon), sermon };
}

/**
 * Whether a fact baked for the Sunday `sunday` (YYYY-MM-DD) still belongs on
 * the page at `now` (2026-09-25, `feat/preacher-and-feel`): true only while
 * the Sunday the dated line names is that Sunday. The hero's "Preaching" fact
 * is server-rendered HIDDEN and shown by the upgrade script only when this
 * holds, so a page that outlives its Sunday never names last week's preacher,
 * with JavaScript or without.
 */
export function sundayFactKept(now: Date, sunday: string): boolean {
  return sunday !== '' && lineSundayIso(now) === sunday;
}
