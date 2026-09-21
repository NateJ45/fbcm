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
