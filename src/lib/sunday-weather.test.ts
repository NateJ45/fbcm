// Sunday's weather line (src/lib/sunday-weather.ts). Instants are UTC with the
// church's wall clock beside them (EDT is UTC-4, EST UTC-5). The periods are
// the shape api.weather.gov/gridpoints/IND/84,90/forecast returned on
// 2026-09-24.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  comingSunday,
  inWeatherWindow,
  sundayPeriod,
  weatherSentence,
  NWS_FORECAST_URL,
  type NwsPeriod,
} from './sunday-weather.ts';

const PERIODS: NwsPeriod[] = [
  {
    name: 'Tonight',
    startTime: '2026-09-24T19:00:00-04:00',
    isDaytime: false,
    temperature: 44,
    temperatureUnit: 'F',
    shortForecast: 'Mostly Clear',
  },
  {
    name: 'Friday',
    startTime: '2026-09-25T06:00:00-04:00',
    isDaytime: true,
    temperature: 67,
    temperatureUnit: 'F',
    shortForecast: 'Mostly Sunny',
  },
  {
    name: 'Saturday Night',
    startTime: '2026-09-26T18:00:00-04:00',
    isDaytime: false,
    temperature: 47,
    temperatureUnit: 'F',
    shortForecast: 'Mostly Clear',
  },
  {
    name: 'Sunday',
    startTime: '2026-09-27T06:00:00-04:00',
    isDaytime: true,
    temperature: 70,
    temperatureUnit: 'F',
    shortForecast: 'Sunny',
    probabilityOfPrecipitation: { value: 0 },
  },
  {
    name: 'Sunday Night',
    startTime: '2026-09-27T18:00:00-04:00',
    isDaytime: false,
    temperature: 48,
    temperatureUnit: 'F',
    shortForecast: 'Mostly Clear',
  },
];

test('the forecast URL is the church’s cached grid', () => {
  assert.equal(NWS_FORECAST_URL, 'https://api.weather.gov/gridpoints/IND/84,90/forecast');
});

test('the window: Wednesday 00:00 to Sunday noon, church time', () => {
  assert.equal(inWeatherWindow(new Date('2026-09-22T16:00:00Z')), false); // Tue noon
  assert.equal(inWeatherWindow(new Date('2026-09-23T03:59:00Z')), false); // Tue 11:59 pm
  assert.equal(inWeatherWindow(new Date('2026-09-23T04:00:00Z')), true); // Wed 12:00 am
  assert.equal(inWeatherWindow(new Date('2026-09-24T16:00:00Z')), true); // Thu
  assert.equal(inWeatherWindow(new Date('2026-09-27T15:59:00Z')), true); // Sun 11:59 am
  assert.equal(inWeatherWindow(new Date('2026-09-27T16:00:00Z')), false); // Sun noon
  assert.equal(inWeatherWindow(new Date('2026-09-28T13:00:00Z')), false); // Mon
  // Winter: Sunday 11:30 am EST is 16:30 UTC, still inside.
  assert.equal(inWeatherWindow(new Date('2026-12-06T16:30:00Z')), true);
  assert.equal(inWeatherWindow(new Date('nope')), false);
});

test('the coming Sunday on the church’s calendar', () => {
  assert.equal(comingSunday(new Date('2026-09-24T16:00:00Z')), '2026-09-27');
  assert.equal(comingSunday(new Date('2026-09-27T13:00:00Z')), '2026-09-27');
  // Saturday 11:30 pm in Muncie is Sunday in UTC: still Saturday here.
  assert.equal(comingSunday(new Date('2026-09-27T03:30:00Z')), '2026-09-27');
});

test('picks the Sunday daytime period, never Sunday night', () => {
  assert.equal(sundayPeriod(PERIODS, new Date('2026-09-24T16:00:00Z'))?.name, 'Sunday');
});

test('on Sunday morning, the period that has already begun ("Today")', () => {
  const sunday: NwsPeriod[] = [
    {
      name: 'Overnight',
      startTime: '2026-09-27T01:00:00-04:00',
      isDaytime: false,
      temperature: 50,
      shortForecast: 'Clear',
    },
    {
      name: 'Today',
      startTime: '2026-09-27T09:00:00-04:00',
      isDaytime: true,
      temperature: 71,
      shortForecast: 'Sunny',
    },
  ];
  assert.equal(sundayPeriod(sunday, new Date('2026-09-27T13:30:00Z'))?.name, 'Today');
});

test('a forecast that does not reach Sunday, or is not a list, gives nothing', () => {
  assert.equal(sundayPeriod(PERIODS.slice(0, 2), new Date('2026-09-24T16:00:00Z')), null);
  assert.equal(sundayPeriod(undefined, new Date()), null);
  assert.equal(sundayPeriod({ periods: [] }, new Date()), null);
  assert.equal(sundayPeriod([null, { isDaytime: true }], new Date()), null);
});

test('the sentence', () => {
  assert.equal(weatherSentence(PERIODS[3]), 'Sunday: 70°, sunny.');
  assert.equal(
    weatherSentence({ temperature: 58, temperatureUnit: 'F', shortForecast: 'Light Rain' }),
    'Sunday: 58°, light rain.',
  );
  assert.equal(
    weatherSentence({
      temperature: 76,
      shortForecast: 'Chance Rain Showers',
      probabilityOfPrecipitation: { value: 45 },
    }),
    'Sunday: 76°, 45% chance of rain showers.',
  );
  assert.equal(
    weatherSentence({ temperature: 61, shortForecast: 'Slight Chance Rain Showers' }),
    'Sunday: 61°, slight chance of rain showers.',
  );
  assert.equal(
    weatherSentence({ temperature: 33, shortForecast: 'Snow Likely then Mostly Cloudy' }),
    'Sunday: 33°, snow likely.',
  );
  assert.equal(
    weatherSentence({ temperature: 21, temperatureUnit: 'C', shortForecast: 'Sunny' }),
    'Sunday: 21°C, sunny.',
  );
});

test('no temperature or no words: no sentence', () => {
  assert.equal(weatherSentence(null), null);
  assert.equal(weatherSentence({ temperature: null, shortForecast: 'Sunny' }), null);
  assert.equal(weatherSentence({ temperature: 70, shortForecast: '' }), null);
});
