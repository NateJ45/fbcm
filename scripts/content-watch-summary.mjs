// Safe to edit by hand
// =============================================================================
// content-watch-summary: turn a Playwright JSON report into a drift summary
// =============================================================================
// Used by .github/workflows/content-watch.yml (2026-10-05). The @content specs
// assert what the church wrote, so a failure there is DRIFT to look at, not a
// broken build. The workflow's test step is `continue-on-error`; this prints a
// readable list of what moved, as Markdown for the job summary, and one
// `::warning::` line for the run's annotations.
//
// Usage: node scripts/content-watch-summary.mjs <playwright-report.json>
// Appends the Markdown to $GITHUB_STEP_SUMMARY (stdout when that is unset, as
// on a laptop) and prints the `::warning::` line to stdout. Exit code is always
// 0: reporting must never fail the job. A report that cannot be read is itself
// reported, since "no news" and "no report" must not look the same.
// =============================================================================
import { appendFileSync, readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.log('::warning::content-watch-summary: no report path given');
  process.exit(0);
}

let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (err) {
  console.log(`::warning::content-watch: the report could not be read (${err.message})`);
  const note =
    '## Content watch\n\nThe Playwright report could not be read, so nothing is known.\n';
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, note);
  else console.log(note);
  process.exit(0);
}

const failed = [];
let passed = 0;
let skipped = 0;

/** Walk the suite tree; a spec is failed when its last result is not an expected one. */
function walk(suite, trail) {
  const here = suite.title && !suite.file ? [...trail, suite.title] : trail;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const last = t.results?.[t.results.length - 1];
      const title = [...here, spec.title].join(' > ');
      if (t.status === 'skipped') skipped++;
      else if (t.status === 'expected') passed++;
      else {
        const message = (last?.error?.message ?? 'failed').replace(/\x1b\[[0-9;]*m/g, '');
        failed.push({ title, message: message.split('\n').slice(0, 6).join('\n') });
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child, here);
}
for (const s of report.suites ?? []) walk(s, []);

const lines = ['## Content watch', ''];
if (failed.length === 0) {
  lines.push(
    `The church's content still matches every expectation: ${passed} passed, ${skipped} skipped.`,
  );
} else {
  console.log(
    `::warning::content-watch: ${failed.length} of ${failed.length + passed} content expectations drifted`,
  );
  lines.push(
    `**${failed.length} of ${failed.length + passed}** expectations about the church's content no longer hold.`,
    '',
    'This is drift, not a broken build: the church edited something these tests name. Either tell the church, or update the expectation in `tests/content-watch.spec.ts`. The required `test` check is not affected.',
    '',
  );
  for (const f of failed) {
    lines.push(`### ${f.title}`, '', '```', f.message, '```', '');
  }
}
// The job summary when run by Actions, stdout anywhere else.
const markdown = lines.join('\n') + '\n';
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
else console.log(markdown);
