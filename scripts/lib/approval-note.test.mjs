// Tests for the approval-note renderer (scripts/lib/approval-note.mjs).
// Run: node --test scripts/lib/approval-note.test.mjs   (or `npm run test:scripts`)
//
// These lock down the 2026-09-24 bug: `node scripts/seed-pages.mjs --only
// home` regenerated the approval note from only the modules it ran and
// silently dropped every other page's section, including the footer/header
// "chrome" copy that no page module owns. The fix makes CHROME_SECTIONS a
// code constant so it is always emitted, and these tests pin that down
// without touching fs, Sanity, or the CLI's --only parsing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderApprovalNote, CHROME_SECTIONS } from './approval-note.mjs';

const FACTS = ['Fact one.', 'Fact two.'];

const modA = {
  slug: 'home',
  newCopy: ['A new sentence for home.'],
  edits: ['An edit to home.'],
  photoConsent: ['home-hero'],
};

const modB = {
  slug: 'visit',
  newCopy: ['A new sentence for visit.'],
  edits: [],
};

const manifest = {
  'home-hero': { alt: 'A photo of the church.' },
};

test('a full run (every page module passed) renders every page section, in order, plus chrome and facts', () => {
  const out = renderApprovalNote([modA, modB], manifest, FACTS);
  const homeIdx = out.indexOf('## /home');
  const visitIdx = out.indexOf('## /visit');
  const footerIdx = out.indexOf('## Site footer (every page)');
  const headerIdx = out.indexOf('## Header and mobile menu (every page)');
  const factsIdx = out.indexOf('## Facts the church must confirm');

  assert.ok(homeIdx !== -1, 'home section present');
  assert.ok(visitIdx !== -1, 'visit section present');
  assert.ok(footerIdx !== -1, 'footer section present');
  assert.ok(headerIdx !== -1, 'header section present');
  assert.ok(factsIdx !== -1, 'facts section present');

  // Stable ordering: page sections in the order given, then chrome, then facts.
  assert.ok(homeIdx < visitIdx);
  assert.ok(visitIdx < footerIdx);
  assert.ok(footerIdx < headerIdx);
  assert.ok(headerIdx < factsIdx);

  assert.ok(out.includes('A new sentence for home.'));
  assert.ok(out.includes('A new sentence for visit.'));
  assert.ok(out.includes('1. Fact one.'));
  assert.ok(out.includes('2. Fact two.'));
});

test('a --only run (a reduced module list) still carries every OTHER section: chrome copy never depends on which page modules ran', () => {
  // This is the shape of the actual bug: seed-pages.mjs --only home builds
  // and diffs only the `home` module against Sanity, but the note must be
  // generated from ALL modules (seed-pages.mjs computes `all` up front,
  // independent of --only, and passes that here) plus the chrome copy below,
  // which is not attached to any module at all.
  const onlyHome = renderApprovalNote([modA], manifest, FACTS);
  assert.ok(onlyHome.includes('## Site footer (every page)'), 'footer survives a --only run');
  assert.ok(
    onlyHome.includes('## Header and mobile menu (every page)'),
    'header survives a --only run',
  );
  // And a page module NOT in this call's list is correctly absent from THIS
  // render call. (seed-pages.mjs guarantees the caller always passes every
  // non-hidden module regardless of --only; this render function's job is
  // only to never drop the chrome copy on top of whatever it is given.)
  assert.ok(!onlyHome.includes('## /visit'));
});

test('the footer section survives with its exact bullets and no Edits heading', () => {
  const out = renderApprovalNote([], {}, FACTS);
  const footerHeadingIdx = out.indexOf('## Site footer (every page)');
  const headerHeadingIdx = out.indexOf('## Header and mobile menu (every page)');
  assert.ok(footerHeadingIdx !== -1);
  const footerBlock = out.slice(footerHeadingIdx, headerHeadingIdx);

  assert.ok(
    footerBlock.includes('An American Baptist congregation in downtown Muncie since 1859.'),
  );
  assert.ok(footerBlock.includes('"Designed by Nixon Creative Studio"'));
  // The footer section has never had an Edits heading (there is no church
  // text in it to edit): reproducing that exactly, not inventing a fallback.
  assert.ok(!footerBlock.includes('### Edits to the church'));
});

test('the header section carries its edits fallback line', () => {
  const out = renderApprovalNote([], {}, FACTS);
  const headerHeadingIdx = out.indexOf('## Header and mobile menu (every page)');
  const factsHeadingIdx = out.indexOf('## Facts the church must confirm');
  const headerBlock = out.slice(headerHeadingIdx, factsHeadingIdx);

  assert.ok(headerBlock.includes('"Watch live"'));
  assert.ok(headerBlock.includes('### Edits to the church'));
  assert.ok(headerBlock.includes("(none: the goals' names and small lines are Who We Are's own)"));
});

test('CHROME_SECTIONS is the single source of the chrome copy (no duplicate definition to drift)', () => {
  assert.equal(CHROME_SECTIONS.length, 7);
  assert.equal(CHROME_SECTIONS[0].heading, 'Site footer (every page)');
  assert.equal(CHROME_SECTIONS[1].heading, 'Header and mobile menu (every page)');
  // The two sections a seed-pages run wiped on 2026-09-24, now generated.
  assert.match(CHROME_SECTIONS[2].heading, /^Visit: "Which door\?"/);
  assert.match(CHROME_SECTIONS[3].heading, /^Scripture index and site search/);
  assert.match(CHROME_SECTIONS[4].heading, /^\/llms\.txt/);
  assert.match(CHROME_SECTIONS[5].heading, /^Social links/);
  assert.match(CHROME_SECTIONS[6].heading, /^Last Sunday, Sunday weather/);
});
