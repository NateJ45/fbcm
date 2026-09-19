import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSectionVisibility } from './sectionVisibility.ts';

// One rule (see sectionVisibility.ts): the core route (journal) is on unless
// an editor sets its toggle to false.
//
// 2026-09-19: this used to also cover nine module routes, each off unless
// switched on. Those toggles were service-business capabilities (portfolio,
// shop, etc.) that never applied to a church and were removed along with the
// siteSettings fields the rebuild forked away from.

// scaffold: journal
test('null input: the core route is on', () => {
  const v = getSectionVisibility(null);
  assert.equal(v.journal, true);
});

test('undefined input behaves the same as null', () => {
  const v = getSectionVisibility(undefined);
  assert.equal(v.journal, true);
});

test('empty object: unset means on', () => {
  const v = getSectionVisibility({});
  assert.equal(v.journal, true);
});

test('explicit false hides the core route', () => {
  const v = getSectionVisibility({ showJournal: false });
  assert.equal(v.journal, false);
});

test('a null field value is not `false`, so the core route stays on', () => {
  const v = getSectionVisibility({ showJournal: null });
  assert.equal(v.journal, true);
});

test('explicit true keeps the core route on', () => {
  const v = getSectionVisibility({ showJournal: true });
  assert.equal(v.journal, true);
});
// scaffold:end
