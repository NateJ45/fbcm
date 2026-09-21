// Safe to edit by hand
// The dated hero line. These four cases are the whole contract: a weekday names
// the coming Sunday, a Sunday says Today, and the STATIC form (the one the
// server renders, before any clock is consulted) never carries a date, whether
// the setting reads "Sundays at 10:45 am" or a bare "10:45 am".
import test from 'node:test';
import assert from 'node:assert/strict';
// The `.ts` extension is the repo's convention for these node:test suites (see
// heading-accent.test.ts): node's ESM resolver does not add one.
import { formatLiveSunday, staticSunday } from './live-sunday.ts';

test('a weekday names the coming Sunday', () => {
  assert.equal(
    formatLiveSunday(new Date(2026, 8, 23), 'Sundays at 10:45 am'),
    'This Sunday, September 27 · Worship at 10:45 am',
  );
});
test('a Sunday says Today', () => {
  assert.equal(
    formatLiveSunday(new Date(2026, 8, 27), 'Sundays at 10:45 am'),
    'Today · Worship at 10:45 am',
  );
});
test('the static form never carries a date', () => {
  assert.equal(staticSunday('Sundays at 10:45 am'), 'Sundays · Worship at 10:45 am');
});
test('a bare time is accepted', () => {
  assert.equal(staticSunday('10:45 am'), 'Sundays · Worship at 10:45 am');
});
