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

/** The server-rendered form: true whatever day it is, so no-JS sees no lie. */
export function staticSunday(serviceTime: string): string {
  return `Sundays · Worship at ${timeOnly(serviceTime)}`;
}

/** The client-side upgrade: names today, or the Sunday that is coming. */
export function formatLiveSunday(now: Date, serviceTime: string): string {
  const add = (7 - now.getDay()) % 7;
  if (add === 0) return `Today · Worship at ${timeOnly(serviceTime)}`;
  const s = new Date(now);
  s.setDate(now.getDate() + add);
  const label = s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `This Sunday, ${label} · Worship at ${timeOnly(serviceTime)}`;
}
