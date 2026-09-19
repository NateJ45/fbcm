// src/lib/fbcm-redirects.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fbcmRedirects, CURRENT_STAFF } from './fbcm-redirects.ts';

test('no two redirects claim the same from-path', () => {
  const froms = fbcmRedirects().map((r) => r.from);
  assert.equal(new Set(froms).size, froms.length);
});

test('no redirect points at itself', () => {
  for (const r of fbcmRedirects()) assert.notEqual(r.from, r.to);
});

test('every from-path is a root-relative path', () => {
  for (const r of fbcmRedirects()) assert.match(r.from, /^\//);
});

test('the six former-staff URLs are covered', () => {
  // These exist on no current page. A crawl sees only what is published and a
  // sitemap lists only what exists, so these came from Search Console and the
  // Internet Archive. Without this test nothing would ever notice they are gone.
  const froms = new Set(fbcmRedirects().map((r) => r.from));
  for (const slug of [
    'emily-anderson',
    'janis-wright',
    'deena-green',
    'jennifer-durke',
    'leslie-pannell',
    'michelle-heimlich',
  ]) {
    assert.ok(froms.has(`/team/${slug}`), `missing redirect for former staff ${slug}`);
  }
});

test('no redirect targets a URL that itself redirects', () => {
  const map = new Map(fbcmRedirects().map((r) => [r.from, r.to]));
  for (const [from, to] of map) {
    assert.ok(!map.has(to.split('#')[0]), `${from} -> ${to} lands on another redirect`);
  }
});

// Added on top of the brief: scripts/data/pages/ is the captured snapshot of
// the live Wix site, and its team-*.json files are the source of truth for who
// is currently on staff. CURRENT_STAFF above is a second, hand-maintained copy
// of that same list, kept only because fbcmRedirects() needs it as plain data.
// Two hand-maintained copies of one list is exactly how a redirect quietly
// stops covering a page (the person leaves, the capture never gets fetched
// again, nobody remembers to update this array), so this test checks them
// against each other directly rather than trusting they were kept in sync by
// hand. FORMER_STAFF is deliberately NOT part of this check: those five
// people's pages are already gone from the live site, so they have no
// team-*.json file to check against, and a test that expected one would fail
// for the wrong reason.
test('CURRENT_STAFF matches the team pages actually captured in scripts/data/pages', () => {
  const pagesDir = new URL('../../scripts/data/pages/', import.meta.url);
  const capturedSlugs = readdirSync(pagesDir)
    .filter((f) => f.startsWith('team-') && f.endsWith('.json'))
    .map((f) => f.slice('team-'.length, -'.json'.length))
    .sort();
  // julie-kirklin is excluded here for the mirror-image reason FORMER_STAFF is
  // excluded above: she is on staff today (plan 2b task 3) but never had her
  // own /team/ page on Wix, so there is no team-julie-kirklin.json to compare
  // her against. Comparing the two lists directly would fail forever, for the
  // right person and the wrong reason.
  const currentStaffWithoutJulie = CURRENT_STAFF.filter((s) => s !== 'julie-kirklin').sort();
  assert.deepEqual(
    currentStaffWithoutJulie,
    capturedSlugs,
    'CURRENT_STAFF has drifted from the captured team-*.json pages in scripts/data/pages/',
  );
});
