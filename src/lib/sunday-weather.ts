// Safe to edit by hand
// Sunday's weather on Visit (2026-09-24, `feat/last-sunday`): one quiet line,
// "Sunday: 58°, light rain.", from the National Weather Service. Pure, so the
// three decisions are unit-tested (sunday-weather.test.ts); the fetch is the
// few lines of browser script in src/components/visit/SundayWeather.astro.
//
// WHY THE BROWSER, NOT THE BUILD. A forecast changes by the hour and the site
// is rebuilt a few times a week, so a built line would be days stale. The NWS
// API is free, needs no key, is the U.S. government's own forecast, and
// answers with Access-Control-Allow-Origin: *, so the visitor's browser asks
// it directly, once, after the page has loaded.
//
// ONE CALL. The API's first step, /points/{lat},{lon}, only says which
// forecast grid a point is in, and a building does not move: the church's map
// point (src/data/site.ts geo, 40.19167,-85.38405) was resolved on 2026-09-24
// to the Indianapolis office's grid IND 84,90 ("Muncie"). NWS_FORECAST_URL is
// that answer, cached here in code. If the NWS ever re-grids, the forecast
// URL 404s and the line simply does not show; NWS_POINTS_URL is how to look
// the new one up.
//
// WHEN. Wednesday 00:00 to Sunday 12:00, church time: far enough ahead that a
// forecast for Sunday is worth reading, and not after the service has begun.
// Outside that window, nothing is fetched and nothing renders.
//
// NO PRACTICAL NOTE. The brief allowed a rain or snow note ("the circular drive
// entrance on Adams Street is covered"), but only if Visit's own words
// support it, and they do not: the church's accessibility page describes the
// circular-drive entrance and its automatic door, never a canopy. The line
// states the forecast and nothing about the building.

import { SERVICE_TIME_ZONE, weekMinutesIn } from './live-service.ts';

export const NWS_POINTS_URL = 'https://api.weather.gov/points/40.1917,-85.3841';
export const NWS_FORECAST_URL = 'https://api.weather.gov/gridpoints/IND/84,90/forecast';

/** One period of the NWS 12-hour forecast, the fields the line reads. */
export interface NwsPeriod {
  name?: string;
  startTime?: string;
  isDaytime?: boolean;
  temperature?: number | null;
  temperatureUnit?: string;
  shortForecast?: string;
  probabilityOfPrecipitation?: { value?: number | null } | null;
}

const WED = 3 * 1440;
const SUNDAY_NOON = 12 * 60;

/** Wednesday 00:00 up to Sunday 12:00 on the church's clock. */
export function inWeatherWindow(now: Date): boolean {
  if (Number.isNaN(now.getTime())) return false;
  const m = weekMinutesIn(now, SERVICE_TIME_ZONE);
  return m >= WED || m < SUNDAY_NOON;
}

const DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: SERVICE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
/** YYYY-MM-DD of an instant on the church's calendar. */
const churchIso = (at: Date) => DAY.format(at);

/** The coming Sunday on the church's calendar (today, on a Sunday). */
export function comingSunday(now: Date): string {
  const today = churchIso(now);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * The daytime period that covers the coming Sunday: "Sunday" on a weekday,
 * "Today" or "This Morning" on Sunday itself. Null when the forecast does not
 * reach it or the answer is not a list of periods.
 */
export function sundayPeriod(periods: unknown, now: Date): NwsPeriod | null {
  if (!Array.isArray(periods)) return null;
  const target = comingSunday(now);
  for (const p of periods as NwsPeriod[]) {
    if (!p || p.isDaytime !== true || typeof p.startTime !== 'string') continue;
    const start = new Date(p.startTime);
    if (Number.isNaN(start.getTime())) continue;
    if (churchIso(start) === target) return p;
  }
  return null;
}

/**
 * "Sunday: 58°, light rain." The forecast's first clause (before "then"),
 * lower case; a "Chance" forecast carries its percentage when the NWS gives
 * one. Null when the period has no temperature or no words.
 */
export function weatherSentence(p: NwsPeriod | null | undefined): string | null {
  if (!p || typeof p.temperature !== 'number' || !Number.isFinite(p.temperature)) return null;
  const clause = (p.shortForecast ?? '').split(/\s+then\s+/i)[0]?.trim() ?? '';
  if (!clause) return null;
  let words = clause.toLowerCase();
  const chance = /^(slight\s+)?chance\s+(.+)$/.exec(words);
  if (chance) {
    const pop = p.probabilityOfPrecipitation?.value;
    words =
      typeof pop === 'number' && pop > 0
        ? `${Math.round(pop)}% chance of ${chance[2]}`
        : `${chance[1] ? 'slight ' : ''}chance of ${chance[2]}`;
  }
  const unit = (p.temperatureUnit ?? 'F').toUpperCase() === 'C' ? '°C' : '°';
  return `Sunday: ${Math.round(p.temperature)}${unit}, ${words}.`;
}
