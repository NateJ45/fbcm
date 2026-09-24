// Safe to edit by hand
// DRIFT GATE for the hand-copied "Live now" script (2026-09-24).
//
// src/lib/live-service.ts is the module the unit tests watch, and BaseLayout
// carries a hand-inlined COPY of its window logic, because an `is:inline`
// script cannot import and this one has to settle the header before paint.
// Same reasoning, same shape as live-sunday-inline.test.ts: it reads
// BaseLayout off disk, narrows to the one script that reads
// [data-live-service], and asserts the pieces that carry the behaviour: the
// time zone, the window length, the time-parsing regex, the "Sundays at"
// prefix regex, and the two labels. It cannot prove the functions match, and
// it does not pretend to; it catches someone retuning one copy and not the
// other.
//
// It also RUNS the inline window logic against the module's, over a spread of
// instants, which is the check that would catch an arithmetic slip the
// substring assertions cannot see.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isLiveNow, LIVE_WINDOW_MINUTES, SERVICE_TIME_ZONE } from './live-service.ts';

const layout = readFileSync(
  fileURLToPath(new URL('../layouts/BaseLayout.astro', import.meta.url)),
  'utf8',
);

const scriptBlocks = layout
  .split('<script')
  .filter((b) => b.includes("querySelectorAll('[data-live-service]')"));

test('BaseLayout carries exactly one live-service inline script', () => {
  assert.equal(scriptBlocks.length, 1);
});

const inlineScript = (scriptBlocks[0] ?? '').split('</script>')[0] ?? '';

test('the inline copy uses the same time zone and window', () => {
  assert.ok(inlineScript.includes(`'${SERVICE_TIME_ZONE}'`), 'time zone differs');
  assert.ok(inlineScript.includes(`WINDOW = ${LIVE_WINDOW_MINUTES};`), 'window length differs');
});

test('the inline copy parses the service time with the same two regexes', () => {
  const time = /^(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s*m\.?)?$/i;
  const prefix = /^Sundays?\s+at\s+/i;
  assert.ok(inlineScript.includes(time.source), `inline script lacks ${time.source}`);
  assert.ok(inlineScript.includes(prefix.source), `inline script lacks ${prefix.source}`);
  // And the module still uses that time regex (a change there must fail here).
  const moduleSrc = readFileSync(
    fileURLToPath(new URL('./live-service.ts', import.meta.url)),
    'utf8',
  );
  assert.ok(moduleSrc.includes(time.source), 'live-service.ts no longer uses the pinned regex');
});

test('the inline copy writes the same two labels', () => {
  for (const label of ["'Live now'", "'Watch live'"]) {
    assert.ok(inlineScript.includes(label), `inline script does not contain ${label}`);
  }
});

test('the inline window logic agrees with the module over a spread of instants', () => {
  // Pull the two functions out of the script body and evaluate them. The
  // script is an IIFE that touches the DOM at the end, so only the function
  // declarations and the two constants are taken.
  const start = inlineScript.indexOf('var TZ');
  const end = inlineScript.indexOf('function upgradeLive');
  assert.ok(start > 0 && end > start, 'could not find the inline window functions');
  const factory = new Function(`${inlineScript.slice(start, end)}; return isLive;`) as () => (
    now: Date,
    t: string,
  ) => boolean;
  const inlineIsLive = factory();
  const settings = ['Sundays at 10:45 am', '10:45 am', '6:30 P.M.', '11:30 pm', ''];
  // Every 15 minutes across a summer Sunday and Monday, and a winter Sunday.
  const instants: Date[] = [];
  for (const day of ['2026-09-27T00:00:00Z', '2026-12-06T00:00:00Z']) {
    const t0 = new Date(day).getTime();
    for (let m = 0; m < 2 * 1440; m += 15) instants.push(new Date(t0 + m * 60_000));
  }
  for (const s of settings) {
    for (const now of instants) {
      assert.equal(inlineIsLive(now, s), isLiveNow(now, s), `${s} at ${now.toISOString()}`);
    }
  }
});
