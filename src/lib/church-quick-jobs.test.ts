// Safe to edit by hand
// =============================================================================
// The church's data-only Quick update jobs: every one must be well formed
// =============================================================================
// Runs the kit's own check (jobProblems) over src/sanity/quick-jobs.ts in bare
// Node, plus the church rules: unique ids, plain words, no em-dashes, and the
// Visitor job writing the shape the Visitor page reads.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jobItem, jobProblems, inSeason } from './studio-quick-jobs.ts';
import { QUICK_JOBS, QUICK_JOBS_SEASONAL, VISITOR_LIST } from '../sanity/quick-jobs.ts';

describe('the church jobs written as data', () => {
  it('every job is well formed', () => {
    for (const f of QUICK_JOBS) {
      assert.ok(f.job, `${f.id} has a job`);
      assert.deepEqual(jobProblems(f.id, f.job, f.fields ?? []), [], f.id);
    }
  });
  it('ids are unique and the words have no em-dash', () => {
    const ids = QUICK_JOBS.map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const f of QUICK_JOBS) {
      const words = JSON.stringify([f.title, f.detail, f.doneMessage, f.fields]);
      assert.ok(!/[—–]/.test(words), `${f.id} has a dash`);
    }
  });
  it('the Visitor job writes a month, a year and a file, the way the page reads them', () => {
    const f = QUICK_JOBS.find((x) => x.id === 'visitor')!;
    assert.equal(f.job?.kind, 'append');
    if (f.job?.kind !== 'append') return;
    assert.equal(f.job.array, VISITOR_LIST);
    const item = jobItem(
      f.job,
      f.fields ?? [],
      { title: 'November', year: '2026' },
      { file: 'file-abc123-pdf' },
      () => 'k1',
    );
    assert.equal(item._type, 'listedDocument');
    assert.equal(item.title, 'November');
    assert.equal(item.year, 2026);
    assert.deepEqual(item.file, {
      _type: 'file',
      asset: { _type: 'reference', _ref: 'file-abc123-pdf' },
    });
  });
  it('the seasonal banners show in their weeks only', () => {
    const xmas = QUICK_JOBS_SEASONAL.find((x) => x.id === 'christmas-banner')!;
    assert.equal(inSeason(xmas.when, new Date(2026, 11, 1)), true);
    assert.equal(inSeason(xmas.when, new Date(2026, 5, 1)), false);
  });
});
