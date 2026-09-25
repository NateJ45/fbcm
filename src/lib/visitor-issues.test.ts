// src/lib/visitor-issues.test.ts
// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  asIssue,
  assetKey,
  coverAlt,
  coverFor,
  coverSrcset,
  fileLine,
  fileSizeLabel,
  isIssueList,
  issueRecord,
  issuesOf,
  latestIssue,
  monthOf,
  unspace,
  yearGroups,
} from './visitor-issues.ts';

const RUN = '​​​​‌‍﻿​‌‍﻿​';
const CDN = 'https://cdn.sanity.io/files/7jw947g5/production';
const doc = (title: string, year: number | null, hash = 'ab'.repeat(20)) => ({
  title,
  year,
  fileUrl: `${CDN}/${hash}.pdf`,
});

test('a month is read from the title, stega and case aside', () => {
  assert.equal(monthOf('June'), 5);
  assert.equal(monthOf(`September${RUN}`), 8);
  assert.equal(monthOf(' december '), 11);
  assert.equal(monthOf('Current Visitor'), -1);
  assert.equal(monthOf(null), -1);
});

test('the asset id is the hash in the CDN address, or null', () => {
  assert.equal(
    assetKey(`${CDN}/de132347204944b39b114a243047446336c93c8a.pdf`),
    'de132347204944b39b114a243047446336c93c8a',
  );
  assert.equal(
    assetKey(`${CDN}/de132347204944b39b114a243047446336c93c8a.pdf?dl=`),
    'de132347204944b39b114a243047446336c93c8a',
  );
  assert.equal(assetKey('https://example.org/a.pdf'), null);
  assert.equal(assetKey(''), null);
});

test('an issue needs a month, a year and a file', () => {
  const i = asIssue({ ...doc('June', 2026), fileSize: 52_073_988 });
  assert.equal(i?.label, 'June 2026');
  assert.equal(i?.title, 'The Visitor, June 2026');
  assert.equal(i?.anchor, 'issue-2026-06');
  assert.equal(i?.size, 52_073_988);
  assert.equal(asIssue(doc('Current Visitor', 2026)), null);
  assert.equal(asIssue(doc('June', null)), null);
  assert.equal(asIssue({ title: 'June', year: 2026, url: 'https://x.org' } as never), null);
});

test('the latest issue is the newest, whatever order the list is in', () => {
  const issues = issuesOf([doc('March', 2026), doc('December', 2025), doc('June', 2026)]);
  assert.deepEqual(
    issues.map((i) => i.label),
    ['June 2026', 'March 2026', 'December 2025'],
  );
  assert.equal(latestIssue(issues)?.label, 'June 2026');
  assert.equal(latestIssue([]), null);
});

test('a list is The Visitor only when every document in it is an issue', () => {
  assert.equal(isIssueList([doc('June', 2026), doc('March', 2026)]), true);
  assert.equal(isIssueList([doc('June', 2026), { title: 'We Are the Clay', year: 2019 }]), false);
  assert.equal(isIssueList([doc('Current Visitor', 2026), doc('June', 2026)]), false);
  assert.equal(isIssueList([]), false);
  // A row with no title is dropped by DocumentList, so it does not decide.
  assert.equal(isIssueList([doc('June', 2026), { title: '' }]), true);
});

test('the wall groups by year, newest year first', () => {
  const groups = yearGroups(
    issuesOf([doc('March', 2025), doc('June', 2026), doc('December', 2025), doc('March', 2026)]),
  );
  assert.deepEqual(
    groups.map((g) => [g.year, g.issues.map((i) => i.label)]),
    [
      [2026, ['June 2026', 'March 2026']],
      [2025, ['December 2025', 'March 2025']],
    ],
  );
});

test('sizes read as a visitor reads them', () => {
  assert.equal(fileSizeLabel(52_073_988), '52 MB');
  assert.equal(fileSizeLabel(540_000), '540 KB');
  assert.equal(fileSizeLabel(null), '');
  assert.equal(fileLine({ size: 28_937_033 }), 'PDF, 29 MB');
  assert.equal(fileLine({ size: null }), 'PDF');
});

test('a cover has alt text naming the issue, and a srcset when drawn', () => {
  const i = asIssue(doc('June', 2026, 'cd'.repeat(20)))!;
  assert.equal(coverAlt(i), 'The Visitor, June 2026, cover');
  const covers = { ['cd'.repeat(20)]: { w: 612, h: 792, widths: [240, 480] } };
  const c = coverFor(i, covers);
  assert.ok(c);
  assert.equal(
    coverSrcset(i.key!, c),
    `/visitor/covers/${'cd'.repeat(20)}-240.webp 240w, /visitor/covers/${'cd'.repeat(20)}-480.webp 480w`,
  );
  assert.equal(coverFor(i, {}), null);
  assert.equal(coverFor({ key: null }, covers), null);
});

test('an issue is found by its words, and the row opens the PDF', () => {
  const i = asIssue({ ...doc('September', 2025), fileSize: 62_852_659 })!;
  const r = issueRecord(i, '  Messy Camp\n returns   in July ');
  assert.deepEqual(r, {
    url: i.href,
    content: 'Messy Camp returns in July',
    language: 'en',
    meta: { title: 'The Visitor, September 2025', date: 'Newsletter', reading: 'PDF, 63 MB' },
  });
  assert.equal(issueRecord(i, '   '), null);
});

test('letter-spaced type is closed up, and a lone letter in a sentence is left alone', () => {
  assert.equal(unspace('F I R S T B A P T I S T // J U N E 2 0 2 2'), 'FIRSTBAPTIST // JUNE2022');
  assert.equal(unspace('I T  L I K E  W O R K'), 'IT LIKE WORK');
  assert.equal(unspace('a Gen Z preaching conference'), 'a Gen Z preaching conference');
  assert.equal(unspace('Q: What is it? A: Grace.'), 'Q: What is it? A: Grace.');
});
