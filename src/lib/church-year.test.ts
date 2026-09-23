import { test } from 'node:test';
import assert from 'node:assert/strict';
import { churchSeason, easterSunday } from './church-year.ts';

const d = (s: string) => new Date(`${s}T12:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

test('easter: known dates', () => {
  assert.equal(iso(easterSunday(2024)), '2024-03-31');
  assert.equal(iso(easterSunday(2025)), '2025-04-20');
  assert.equal(iso(easterSunday(2026)), '2026-04-05');
  assert.equal(iso(easterSunday(2027)), '2027-03-28');
  assert.equal(iso(easterSunday(2038)), '2038-04-25');
});

test('today, late September 2026, is Ordinary Time in green', () => {
  const s = churchSeason(d('2026-09-23'));
  assert.equal(s.season, 'ordinary');
  assert.equal(s.label, 'Ordinary Time, the season after Pentecost');
  assert.equal(s.token, 'green');
});

test('advent starts on the fourth Sunday before Christmas', () => {
  assert.equal(churchSeason(d('2026-11-28')).season, 'ordinary');
  assert.equal(churchSeason(d('2026-11-29')).season, 'advent');
  assert.equal(churchSeason(d('2026-12-24')).season, 'advent');
  assert.equal(churchSeason(d('2027-11-28')).season, 'advent');
});

test('christmas runs to 5 January, epiphany from the 6th', () => {
  assert.equal(churchSeason(d('2026-12-25')).season, 'christmas');
  assert.equal(churchSeason(d('2027-01-05')).season, 'christmas');
  assert.equal(churchSeason(d('2027-01-06')).season, 'epiphany');
});

test('lent, holy week, easter, pentecost around Easter 2026 (5 April)', () => {
  assert.equal(churchSeason(d('2026-02-17')).season, 'epiphany');
  assert.equal(churchSeason(d('2026-02-18')).season, 'lent'); // Ash Wednesday
  assert.equal(churchSeason(d('2026-03-28')).season, 'lent');
  assert.equal(churchSeason(d('2026-03-29')).season, 'holy-week'); // Palm Sunday
  assert.equal(churchSeason(d('2026-04-04')).season, 'holy-week');
  assert.equal(churchSeason(d('2026-04-05')).season, 'easter');
  assert.equal(churchSeason(d('2026-05-23')).season, 'easter');
  assert.equal(churchSeason(d('2026-05-24')).season, 'pentecost');
  assert.equal(churchSeason(d('2026-05-24')).token, 'red');
  assert.equal(churchSeason(d('2026-05-25')).season, 'ordinary');
});

test('every day of 2026 to 2030 resolves to a season with a label and token', () => {
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2031, 0, 1); t += 86_400_000) {
    const s = churchSeason(new Date(t));
    assert.ok(s.label.length > 0 && s.token.length > 0, new Date(t).toISOString());
  }
});
