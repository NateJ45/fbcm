// Safe to edit by hand
// DRIFT GATE for the hand-copied live-Sunday script.
//
// src/lib/live-sunday.ts is the module the unit tests watch, and BaseLayout
// carries a twelve-line hand-inlined COPY of it, because an `is:inline` script
// cannot import and this one has to settle the line before paint. Two copies of
// a function is a second source of truth, and the second one is the one that
// goes stale (CLAUDE.md rule 15). Nothing else in the build compares them: the
// inline copy is a string inside an .astro file, so it type-checks as nothing,
// lints as nothing, and a divergence shows up only as a hero line that says the
// wrong Sunday to a real visitor.
//
// So this reads BaseLayout off disk, pulls the inline script out, and asserts
// the three pieces that carry the behaviour: the "Sundays at " prefix regex,
// and the two sentence stems. It cannot prove the whole function matches, and
// it does not pretend to. It catches the change that is actually made by hand,
// which is someone retuning the wording or the parse in one file and not the
// other.
//
// If the inline copy ever moves out of BaseLayout, move this with it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const layout = readFileSync(
  fileURLToPath(new URL('../layouts/BaseLayout.astro', import.meta.url)),
  'utf8',
);

// The one inline script that READS the attribute. Narrowing to it, rather than
// searching the whole file, keeps the assertions honest: the prose comment
// above the script also names [data-live-sunday], and a match in a comment must
// not be able to satisfy them.
const scriptBlocks = layout
  .split('<script')
  .filter((b) => b.includes("querySelectorAll('[data-live-sunday]')"));

test('BaseLayout still carries exactly one live-Sunday inline script', () => {
  assert.equal(scriptBlocks.length, 1);
});

const inlineScript = scriptBlocks[0] ?? '';

test('the inline copy parses the service time with the same regex', () => {
  // The source of the regex in live-sunday.ts, not the literal text of that
  // file: comparing sources means a change to the pattern in either place
  // fails here, whichever way round it was made.
  const pattern = /^Sundays?\s+at\s+/i;
  assert.ok(
    inlineScript.includes(pattern.source),
    `inline script does not contain the regex source ${pattern.source}`,
  );
});

test('the inline copy uses the same two sentence stems', () => {
  for (const stem of ['This Sunday, ', 'Today']) {
    assert.ok(
      inlineScript.includes(stem),
      `inline script does not contain ${JSON.stringify(stem)}`,
    );
  }
});

// This Sunday's sermon (2026-09-24). The inline copy now decides whether the
// sermon half stays, so its decision is RUN against the module's, the check
// that catches an off-by-one-day slip no substring assertion can see.
test('the inline copy reads and hides the sermon half by the same attributes', () => {
  for (const attr of ["'data-sermon-sunday'", "'[data-sunday-sermon]'"]) {
    assert.ok(inlineScript.includes(attr), `inline script does not contain ${attr}`);
  }
});

test('the inline liveSundayLine agrees with the module over three weeks of hours', async () => {
  const { liveSundayLine } = await import('./live-sunday.ts');
  const body = inlineScript.split('</script>')[0] ?? '';
  const start = body.indexOf('function timeOnly');
  const end = body.indexOf('function upgradeSunday');
  assert.ok(start > 0 && end > start, 'could not find the inline functions');
  const inlineLine = new Function(`${body.slice(start, end)}; return liveSundayLine;`)() as (
    now: Date,
    t: string,
    sermonSunday: string,
  ) => { text: string; sermon: boolean };
  const t0 = new Date(2026, 8, 20, 0, 30).getTime(); // a Sunday, local time
  for (let h = 0; h < 21 * 24; h += 1) {
    const now = new Date(t0 + h * 3_600_000);
    for (const sermon of ['', '2026-09-27', '2026-10-04']) {
      assert.deepEqual(
        inlineLine(now, '10:45 am', sermon),
        liveSundayLine(now, '10:45 am', sermon),
        `${now.toString()} / ${sermon || 'no sermon'}`,
      );
    }
  }
});

// This Sunday's preacher (2026-09-25). The inline copy shows and hides the
// hero's "Preaching" fact; its decision is RUN against the module's.
test('the inline copy shows the preacher fact by the same attribute', () => {
  assert.ok(inlineScript.includes("'[data-sunday-fact]'"));
  assert.ok(inlineScript.includes("'data-sunday-fact'"));
});

test('the inline sundayFactKept agrees with the module over three weeks of hours', async () => {
  const { sundayFactKept } = await import('./live-sunday.ts');
  const body = inlineScript.split('</script>')[0] ?? '';
  const start = body.indexOf('function timeOnly');
  const end = body.indexOf('function upgradeSunday');
  assert.ok(start > 0 && end > start, 'could not find the inline functions');
  const inlineKept = new Function(`${body.slice(start, end)}; return sundayFactKept;`)() as (
    now: Date,
    sunday: string,
  ) => boolean;
  const t0 = new Date(2026, 8, 20, 0, 30).getTime(); // a Sunday, local time
  for (let h = 0; h < 21 * 24; h += 1) {
    const now = new Date(t0 + h * 3_600_000);
    for (const sunday of ['', '2026-09-27', '2026-10-04']) {
      assert.equal(
        inlineKept(now, sunday),
        sundayFactKept(now, sunday),
        `${now.toString()} / ${sunday || 'no Sunday'}`,
      );
    }
  }
});
