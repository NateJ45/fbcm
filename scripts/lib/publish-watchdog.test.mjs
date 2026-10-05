// Tests for the publish watchdog's decision (scripts/publish-watchdog.mjs).
// Pure functions only: no network, no gh, no clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decide,
  buildIssue,
  summaryLine,
  stamp,
  GRACE_MIN,
  ALERT_MIN,
  MAX_RETRIGGERS,
  ISSUE_TITLE,
} from '../publish-watchdog.mjs';

const NOW = Date.parse('2026-10-05T22:00:00Z');
const minAgo = (m) => new Date(NOW - m * 60_000).toISOString();

test('caught up: the last good deploy started after the newest publish', () => {
  const d = decide({ now: NOW, latestPublish: minAgo(52), lastGoodStart: minAgo(5) });
  assert.equal(d.action, 'caught-up');
  assert.equal(d.alert, false);
  assert.ok(d.lagMin < 0);
});

test('caught up: a deploy that started the same instant as the publish', () => {
  const t = minAgo(40);
  assert.equal(decide({ now: NOW, latestPublish: t, lastGoodStart: t }).action, 'caught-up');
});

test('grace: an unserved publish under the grace waits, even with nothing running', () => {
  const d = decide({ now: NOW, latestPublish: minAgo(GRACE_MIN), lastGoodStart: minAgo(300) });
  assert.equal(d.action, 'wait-grace');
  assert.equal(d.alert, false);
});

test('lag 11 min, nothing in flight: retrigger, no alert', () => {
  const d = decide({ now: NOW, latestPublish: minAgo(11), lastGoodStart: minAgo(300) });
  assert.equal(d.action, 'retrigger');
  assert.equal(d.alert, false);
});

test('a lost run whose predecessor started minutes before the publish still heals', () => {
  // Last good deploy started 3 min BEFORE the publish; the webhook deploy never ran.
  const d = decide({ now: NOW, latestPublish: minAgo(15), lastGoodStart: minAgo(18) });
  assert.equal(d.action, 'retrigger');
});

test('lag with a run in flight: wait', () => {
  const d = decide({
    now: NOW,
    latestPublish: minAgo(20),
    lastGoodStart: minAgo(300),
    inFlight: 1,
  });
  assert.equal(d.action, 'wait-in-flight');
  assert.equal(d.alert, false);
});

test('lag 31 min: alert, and still retriggers when nothing is running', () => {
  const d = decide({ now: NOW, latestPublish: minAgo(ALERT_MIN + 1), lastGoodStart: minAgo(300) });
  assert.equal(d.alert, true);
  assert.equal(d.action, 'retrigger');
});

test('lag exactly 30 min: no alert yet', () => {
  const d = decide({ now: NOW, latestPublish: minAgo(ALERT_MIN), lastGoodStart: minAgo(300) });
  assert.equal(d.alert, false);
});

test('lag 31 min with a run still in flight: alert, wait', () => {
  const d = decide({
    now: NOW,
    latestPublish: minAgo(31),
    lastGoodStart: minAgo(300),
    inFlight: 2,
  });
  assert.equal(d.action, 'wait-in-flight');
  assert.equal(d.alert, true);
});

test('retrigger cap: stops retriggering after MAX_RETRIGGERS but keeps alerting', () => {
  const d = decide({
    now: NOW,
    latestPublish: minAgo(45),
    lastGoodStart: minAgo(300),
    retriggers: MAX_RETRIGGERS,
  });
  assert.equal(d.action, 'capped');
  assert.equal(d.alert, true);
  const one = decide({
    now: NOW,
    latestPublish: minAgo(45),
    lastGoodStart: minAgo(300),
    retriggers: MAX_RETRIGGERS - 1,
  });
  assert.equal(one.action, 'retrigger');
});

test('missing or garbled inputs: skip quietly, never alert or retrigger', () => {
  for (const input of [
    { now: NOW, latestPublish: null, lastGoodStart: minAgo(5) },
    { now: NOW, latestPublish: minAgo(60), lastGoodStart: null },
    { now: NOW, latestPublish: undefined, lastGoodStart: undefined },
    { now: NOW, latestPublish: 'not a date', lastGoodStart: minAgo(5) },
    { now: NaN, latestPublish: minAgo(60), lastGoodStart: minAgo(90) },
  ]) {
    const d = decide(input);
    assert.equal(d.action, 'skip');
    assert.equal(d.alert, false);
  }
});

test('clock skew: a publish in the future is treated as brand new', () => {
  const d = decide({
    now: NOW,
    latestPublish: new Date(NOW + 4 * 60_000).toISOString(),
    lastGoodStart: minAgo(300),
  });
  assert.equal(d.action, 'wait-grace');
  assert.equal(d.alert, false);
  assert.equal(d.ageMin, 0);
  assert.match(d.reason, /clock skew/);
});

test('now may be passed as an ISO string', () => {
  const d = decide({
    now: '2026-10-05T22:00:00Z',
    latestPublish: minAgo(12),
    lastGoodStart: minAgo(300),
  });
  assert.equal(d.action, 'retrigger');
});

test('summaryLine: one readable line for each outcome', () => {
  const caught = decide({
    now: NOW,
    latestPublish: '2026-10-05T20:31:00Z',
    lastGoodStart: '2026-10-05T21:23:00Z',
  });
  assert.equal(
    summaryLine({
      latestPublish: '2026-10-05T20:31:00Z',
      lastGoodStart: '2026-10-05T21:23:00Z',
      inFlight: 0,
      decision: caught,
    }),
    'latest publish 2026-10-05 20:31Z, last good deploy start 2026-10-05 21:23Z, lag 0, caught up, 0 in flight, caught-up: no action',
  );
  const skip = decide({ now: NOW, latestPublish: null, lastGoodStart: null });
  assert.match(
    summaryLine({ latestPublish: null, lastGoodStart: null, inFlight: 0, decision: skip }),
    /unknown.*skip/,
  );
  assert.equal(stamp('garbage'), 'unknown');
});

test('buildIssue: fixed title, both timestamps, links to the runs', () => {
  const issue = buildIssue({
    repo: 'NateJ45/fbcm',
    latestPublish: '2026-10-05T20:31:00Z',
    lastGoodStart: '2026-10-05T14:00:00Z',
    ageMin: 45,
    runs: [
      {
        created_at: '2026-10-05T20:31:05Z',
        event: 'repository_dispatch',
        status: 'completed',
        conclusion: 'cancelled',
        html_url: 'https://github.com/NateJ45/fbcm/actions/runs/1',
      },
    ],
  });
  assert.equal(issue.title, ISSUE_TITLE);
  assert.match(issue.body, /45 minutes/);
  assert.match(issue.body, /2026-10-05 20:31Z/);
  assert.match(issue.body, /2026-10-05 14:00Z/);
  assert.match(issue.body, /actions\/runs\/1/);
  assert.match(issue.body, /actions\/workflows\/deploy\.yml/);
  assert.ok(!issue.body.includes('—'), 'no em-dashes');
});
