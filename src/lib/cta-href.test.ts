import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCtaHref } from './cta-href.ts';

// The mapping from a Sanity ctaBlock to an href used to live inside
// CtaLink.astro, where nothing could test it: an .astro file does not import
// into `node --test`. It moved here when the statement band needed the same
// hrefs for a card that is itself the link (task 8), and this suite is the
// other half of that move. Every branch of the switch, plus the fallback, plus
// the two slug-based document types, because the slug cases are the ones a
// second copy of this function has always got wrong.

const FALLBACK = '/contact';

test('nothing to resolve falls back', () => {
  assert.equal(resolveCtaHref(null, FALLBACK), FALLBACK);
  assert.equal(resolveCtaHref(undefined, FALLBACK), FALLBACK);
  // A label with no link type is a half-filled field in the Studio.
  assert.equal(resolveCtaHref({ label: 'Visit' }, FALLBACK), FALLBACK);
});

test('an internal link to a singleton takes its fixed path', () => {
  assert.equal(
    resolveCtaHref({ linkType: 'internal', internalLink: { _type: 'homePage' } }, FALLBACK),
    '/',
  );
  assert.equal(
    resolveCtaHref({ linkType: 'internal', internalLink: { _type: 'journalPage' } }, FALLBACK),
    '/blog',
  );
});

test('a custom page takes its slug at the root', () => {
  assert.equal(
    resolveCtaHref({ linkType: 'internal', internalLink: { _type: 'page', slug: 'visit' } }, '/'),
    '/visit',
  );
});

test('a journal entry takes /post/<slug>', () => {
  // The 142 imported posts keep their Wix URL, so this prefix is load-bearing:
  // it is the case a hand-written second copy of this function forgets.
  assert.equal(
    resolveCtaHref(
      { linkType: 'internal', internalLink: { _type: 'journalEntry', slug: 'blue-christmas' } },
      '/',
    ),
    '/post/blue-christmas',
  );
});

test('a slug-based type with no slug falls back rather than linking to nowhere', () => {
  assert.equal(
    resolveCtaHref({ linkType: 'internal', internalLink: { _type: 'page' } }, FALLBACK),
    FALLBACK,
  );
  assert.equal(
    resolveCtaHref({ linkType: 'internal', internalLink: { _type: 'journalEntry' } }, FALLBACK),
    FALLBACK,
  );
});

test('an unknown document type falls back', () => {
  assert.equal(
    resolveCtaHref({ linkType: 'internal', internalLink: { _type: 'staffMember' } }, FALLBACK),
    FALLBACK,
  );
  assert.equal(resolveCtaHref({ linkType: 'internal' }, FALLBACK), FALLBACK);
});

test('an external link passes through untouched', () => {
  // Including the same-site paths a reference cannot express, which ride in on
  // externalUrl since plan 2b: they must not be rewritten.
  assert.equal(
    resolveCtaHref({ linkType: 'external', externalUrl: 'https://example.org/give' }, FALLBACK),
    'https://example.org/give',
  );
  assert.equal(
    resolveCtaHref({ linkType: 'external', externalUrl: '/history#building' }, FALLBACK),
    '/history#building',
  );
  assert.equal(resolveCtaHref({ linkType: 'external' }, FALLBACK), FALLBACK);
});

test('an email link becomes a mailto', () => {
  assert.equal(
    resolveCtaHref({ linkType: 'email', emailAddress: 'office@fbcmuncie.org' }, FALLBACK),
    'mailto:office@fbcmuncie.org',
  );
  assert.equal(resolveCtaHref({ linkType: 'email' }, FALLBACK), FALLBACK);
});

test('a phone link becomes a tel, with the punctuation stripped', () => {
  // Editors type a phone number the way it is printed. `tel:` wants the digits.
  assert.equal(
    resolveCtaHref({ linkType: 'phone', phoneNumber: '(765) 284-7749' }, FALLBACK),
    'tel:7652847749',
  );
  assert.equal(
    resolveCtaHref({ linkType: 'phone', phoneNumber: '+1 765 284 7749' }, FALLBACK),
    'tel:+17652847749',
  );
  assert.equal(resolveCtaHref({ linkType: 'phone' }, FALLBACK), FALLBACK);
});

test('the fallback is whatever the caller passed, never a hard-coded path', () => {
  // The statement band's cards pass '/', the buttons pass '/contact'.
  assert.equal(resolveCtaHref(null, '/'), '/');
  assert.equal(resolveCtaHref(null, '/blog'), '/blog');
});
