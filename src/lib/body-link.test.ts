// src/lib/body-link.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodyHref } from './body-link.ts';

test('own-domain absolute links become root-relative with a slash', () => {
  assert.equal(bodyHref('http://fbcmuncie.org/beliefs'), '/beliefs/');
  assert.equal(bodyHref('https://www.fbcmuncie.org/beliefs/'), '/beliefs/');
  assert.equal(bodyHref('https://fbcmuncie.org/post/some-sermon'), '/post/some-sermon/');
  assert.equal(bodyHref('https://fbcmuncie.org'), '/');
  assert.equal(bodyHref('http://www.fbcmuncie.org/events#x'), '/events/#x');
});

test('old Wix paths go straight to the final address', () => {
  assert.equal(bodyHref('https://fbcmuncie.org/what-to-expect'), '/visit/');
  assert.equal(bodyHref('/publications'), '/visitor/');
  assert.equal(bodyHref('/team/cynthia-smith'), '/ministers/#cynthia-smith');
  assert.equal(bodyHref('/team/andy-heimlich'), '/ministers/');
  assert.equal(bodyHref('/team/someone-new'), '/ministers/');
  assert.equal(bodyHref('/blog/categories/ruminations'), '/blog/?category=ruminations');
  assert.equal(bodyHref('/blog/categories/unlisted-one'), '/blog/?category=unlisted-one');
  assert.equal(bodyHref('/blog/hashtags/whatever'), '/blog/');
  assert.equal(bodyHref('/accessibility'), '/visit/#accessibility');
});

test('plain internal paths get the slash, everything else is left alone', () => {
  assert.equal(bodyHref('/give'), '/give/');
  assert.equal(bodyHref('/give/'), '/give/');
  assert.equal(bodyHref('/files/guide.pdf'), '/files/guide.pdf');
  assert.equal(bodyHref('https://example.org/beliefs'), 'https://example.org/beliefs');
  assert.equal(bodyHref('https://notfbcmuncie.org/a'), 'https://notfbcmuncie.org/a');
  assert.equal(bodyHref('mailto:a@b.co'), 'mailto:a@b.co');
  assert.equal(bodyHref('#top'), '#top');
  assert.equal(bodyHref(''), '');
  assert.equal(bodyHref(undefined), '');
});
