import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  monthIndexOf,
  pdfCreated,
  issueYear,
  coverDate,
  resolveIssueDate,
} from './visitor-dates.mjs';

test('monthIndexOf reads a month and corrects the capture typo', () => {
  assert.equal(monthIndexOf('December'), 11);
  assert.equal(monthIndexOf('Feburary'), 1);
  assert.equal(monthIndexOf(' June '), 5);
  assert.equal(monthIndexOf('Download Latest Issue'), -1);
});

test('pdfCreated reads /CreationDate, or null', () => {
  assert.deepEqual(pdfCreated(Buffer.from('%PDF /CreationDate (D:20201230120000)')), {
    year: 2020,
    month: 11,
  });
  assert.equal(pdfCreated(Buffer.from('%PDF no date here')), null);
});

test('issueYear snaps to the nearest occurrence of the month', () => {
  assert.equal(issueYear(0, { year: 2020, month: 11 }), 2021);
  assert.equal(issueYear(11, { year: 2023, month: 10 }), 2023);
  assert.equal(issueYear(5, null), undefined);
});

test('coverDate reads a letter-spaced masthead', () => {
  assert.deepEqual(coverDate('F I R S T B A P T I S T // J U N E 2 0 2 2 PAGE 1'), {
    month: 5,
    year: 2022,
  });
  assert.deepEqual(coverDate('The Visitor J ANUARY 2020 A New Decade'), { month: 0, year: 2020 });
  assert.equal(coverDate('As the school calendar announces a new season'), null);
});

test('resolveIssueDate: the button month with the cover year when they agree', () => {
  const r = resolveIssueDate({
    named: 5,
    created: { year: 2021, month: 5 },
    cover: { month: 5, year: 2021 },
  });
  assert.deepEqual(r, { month: 5, year: 2021, basis: 'button month, cover year' });
});

test('resolveIssueDate: no build date, the cover dates it (the undated June)', () => {
  const r = resolveIssueDate({ named: 5, created: null, cover: { month: 5, year: 2022 } });
  assert.equal(r.year, 2022);
  assert.equal(r.month, 5);
  assert.equal(r.conflict, undefined);
});

test('resolveIssueDate: no button month, the cover dates it (the latest issue)', () => {
  const r = resolveIssueDate({
    named: -1,
    created: { year: 2026, month: 7 },
    cover: { month: 8, year: 2026 },
  });
  assert.deepEqual(r, { month: 8, year: 2026, basis: 'cover month and year' });
});

test('resolveIssueDate: a disagreeing cover keeps the button month and says so', () => {
  const r = resolveIssueDate({
    named: 7,
    created: { year: 2024, month: 7 },
    cover: { month: 8, year: 2024 },
  });
  assert.equal(r.month, 7);
  assert.equal(r.year, 2024);
  assert.match(r.conflict ?? '', /button says August, page 1 prints September 2024/);
});

test('resolveIssueDate: nothing to go on is undated, never invented', () => {
  assert.deepEqual(resolveIssueDate({ named: -1, created: null, cover: null }), {
    basis: 'undated',
  });
});
