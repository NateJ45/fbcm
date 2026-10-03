import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageNamesSermon, siteIsStale } from './this-sunday-check.mjs';

const SUNDAY = '2026-10-04';
const withSermon = `<span data-sermon-sunday="${SUNDAY}">x</span><span data-sunday-sermon="${SUNDAY}"><a>t</a></span>`;
const without = `<span data-live-sunday="10:45 am" data-sermon-sunday="${SUNDAY}">This Sunday</span>`;

test('a page whose hero names a sermon for that Sunday is not stale', () => {
  assert.equal(pageNamesSermon(withSermon, SUNDAY), true);
  assert.equal(siteIsStale({ sunday: SUNDAY }, withSermon), false);
});

test('a broadcast the page does not show makes the site stale', () => {
  assert.equal(pageNamesSermon(without, SUNDAY), false);
  assert.equal(siteIsStale({ sunday: SUNDAY }, without), true);
});

test('a sermon on the page for another Sunday does not count', () => {
  const lastWeek = `<span data-sunday-sermon="2026-09-27"></span>`;
  assert.equal(siteIsStale({ sunday: SUNDAY }, lastWeek), true);
});

test('no broadcast on YouTube: never stale', () => {
  assert.equal(siteIsStale(null, without), false);
});

test('the live page could not be fetched: never stale, so a blip cannot start a deploy', () => {
  assert.equal(siteIsStale({ sunday: SUNDAY }, null), false);
  assert.equal(siteIsStale({ sunday: SUNDAY }, ''), false);
});
