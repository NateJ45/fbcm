// Tests for the plan-2b page copy helpers.
// Run: node --test scripts/lib/page-copy.test.mjs   (or `npm run test:scripts`)
//
// These are plain-data tests on purpose: no Sanity client, no network, no .env.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  paragraphs,
  bullets,
  link,
  heading,
  keyer,
  decodeEntities,
  textFile,
  linesBetween,
  fromCapture,
  ctaInternal,
  ctaExternal,
  ctaAnchor,
  resetCtaKeys,
} from './page-copy.mjs';

test('paragraphs split on blank lines and get stable keys', () => {
  const out = paragraphs('One.\n\nTwo.', 'p');
  assert.equal(out.length, 2);
  assert.equal(out[0]._key, 'p-1');
  assert.equal(out[1].children[0].text, 'Two.');
});

test('paragraphs are reproducible: the same input twice is byte-identical', () => {
  const a = JSON.stringify(paragraphs('One.\n\nTwo.', 'p'));
  const b = JSON.stringify(paragraphs('One.\n\nTwo.', 'p'));
  assert.equal(a, b);
});

test('paragraphs decode the six-entity map and join soft-wrapped lines', () => {
  const out = paragraphs('Ruth &amp; Naomi\nwalked on.', 'p');
  assert.equal(out.length, 1);
  assert.equal(out[0].children[0].text, 'Ruth & Naomi walked on.');
});

test('bullets produce list items with a shared listItem style', () => {
  const out = bullets(['a', 'b'], 'b');
  assert.equal(out[1].listItem, 'bullet');
  assert.equal(out[1].level, 1);
  assert.equal(out[0]._key, 'b-1');
});

test('a link becomes a span with a markDef', () => {
  const block = link('the form', 'https://example.org/f', 'l');
  assert.equal(block.markDefs[0].href, 'https://example.org/f');
  assert.deepEqual(block.children[0].marks, [block.markDefs[0]._key]);
});

test('an inline [text](href) inside a paragraph becomes a link markDef', () => {
  const [block] = paragraphs('Fill in [the form](https://example.org/f) first.', 'p');
  assert.equal(block.markDefs.length, 1);
  assert.equal(block.markDefs[0]._type, 'link');
  assert.equal(block.markDefs[0].href, 'https://example.org/f');
  assert.deepEqual(
    block.children.map((c) => c.text),
    ['Fill in ', 'the form', ' first.'],
  );
  assert.deepEqual(block.children[0].marks, []);
  assert.deepEqual(block.children[1].marks, [block.markDefs[0]._key]);
  assert.deepEqual(block.children[2].marks, []);
});

test('heading returns the requested level and rejects anything else', () => {
  assert.equal(heading('Our beliefs', 2, 'h1').style, 'h2');
  assert.equal(heading('Our beliefs', 3, 'h1').style, 'h3');
  assert.throws(() => heading('Nope', 1, 'h1'), /level must be 2, 3 or 4/);
});

test('keyer numbers from one', () => {
  const next = keyer('x');
  assert.equal(next(), 'x-1');
  assert.equal(next(), 'x-2');
});

test('decodeEntities leaves an unknown entity alone', () => {
  assert.equal(decodeEntities('&amp; &frobnicate; &#39;'), "& &frobnicate; '");
});

test('linesBetween reads a real capture and returns the lines between anchors', () => {
  const lines = linesBetween('beliefs', 'Our Basic Beliefs', 'The world God created is good');
  assert.ok(lines.some((l) => l.includes('One Triune God')));
  assert.ok(!lines.some((l) => l.includes('The world God created is good')));
});

test('fromCapture throws naming the slug and the missing phrase', () => {
  assert.throws(
    () => fromCapture('beliefs', { from: 'a phrase that is not there' }),
    /a phrase that is not there.*beliefs\.txt/s,
  );
  assert.throws(() => textFile('no-such-page-here'), /no capture at/);
});

test('fromCapture returns blocks for the captured range', () => {
  const blocks = fromCapture('beliefs', {
    from: 'Our Basic Beliefs',
    to: 'The world God created is good',
    keyPrefix: 'bel',
  });
  assert.ok(blocks.length > 0);
  assert.equal(blocks[0]._type, 'block');
  assert.equal(blocks[0]._key, 'bel-1');
});

test('the three CTA builders match the ctaBlock schema', () => {
  resetCtaKeys();
  const internal = ctaInternal('Plan a visit', 'visit');
  assert.equal(internal._type, 'ctaBlock');
  assert.equal(internal.linkType, 'internal');
  assert.deepEqual(internal.internalLink, { _type: 'reference', _ref: 'page-visit' });
  assert.equal(internal._key, 'cta-1');

  assert.equal(ctaInternal('Home', 'home').internalLink._ref, 'homePage');

  const external = ctaExternal('Give online', 'https://example.org/give');
  assert.equal(external.linkType, 'external');
  assert.equal(external.externalUrl, 'https://example.org/give');
  assert.equal(external.openInNewTab, true);

  const anchor = ctaAnchor('The building', '/history#building');
  assert.equal(anchor.linkType, 'external');
  assert.equal(anchor.externalUrl, '/history#building');
  assert.equal(anchor.openInNewTab, false);

  assert.throws(() => ctaAnchor('Bad', 'history#building'), /starting with "\/"/);
});
