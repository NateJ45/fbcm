// Safe to edit by hand
// The church year, derived from the date at build time (CLAUDE.md rule 15:
// computed, never a field an editor retypes). The site rebuilds daily on a
// scheduled deploy (.github/workflows/deploy.yml, 05:15 UTC), so the season
// line and the season colour turn over on their own. Western calendar;
// all arithmetic in UTC so a build in any timezone agrees.
export type Season =
  'advent' | 'christmas' | 'epiphany' | 'lent' | 'holy-week' | 'easter' | 'pentecost' | 'ordinary';
export type SeasonToken = 'violet' | 'white' | 'green' | 'purple' | 'red' | 'gold';
export interface ChurchSeason {
  season: Season;
  label: string;
  token: SeasonToken;
}

const DAY = 86_400_000;
const utc = (y: number, m: number, d: number) => Date.UTC(y, m, d);
const dayOf = (date: Date) => utc(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** Anonymous Gregorian computus (Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100;
  const d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(utc(year, month, day));
}

/** First Sunday of Advent: the fourth Sunday before 25 December. */
function adventStart(year: number): number {
  const christmas = utc(year, 11, 25);
  const dow = new Date(christmas).getUTCDay(); // 0 = Sunday
  const sundayBefore = christmas - (dow === 0 ? 7 : dow) * DAY;
  return sundayBefore - 21 * DAY;
}

const S: Record<Season, ChurchSeason> = {
  advent: { season: 'advent', label: 'Advent', token: 'violet' },
  christmas: { season: 'christmas', label: 'Christmas', token: 'white' },
  epiphany: { season: 'epiphany', label: 'The season after Epiphany', token: 'green' },
  lent: { season: 'lent', label: 'Lent', token: 'purple' },
  'holy-week': { season: 'holy-week', label: 'Holy Week', token: 'purple' },
  easter: { season: 'easter', label: 'Easter', token: 'gold' },
  pentecost: { season: 'pentecost', label: 'Pentecost', token: 'red' },
  ordinary: {
    season: 'ordinary',
    label: 'Ordinary Time, the season after Pentecost',
    token: 'green',
  },
};

export function churchSeason(date: Date): ChurchSeason {
  const t = dayOf(date);
  const y = date.getUTCFullYear();
  if (t >= utc(y, 11, 25)) return S.christmas;
  if (t <= utc(y, 0, 5)) return S.christmas;
  if (t >= adventStart(y)) return S.advent;
  const easter = easterSunday(y).getTime();
  const ash = easter - 46 * DAY,
    palm = easter - 7 * DAY,
    pentecost = easter + 49 * DAY;
  if (t < ash) return S.epiphany;
  if (t < palm) return S.lent;
  if (t < easter) return S['holy-week'];
  if (t < pentecost) return S.easter;
  if (t === pentecost) return S.pentecost;
  return S.ordinary;
}
