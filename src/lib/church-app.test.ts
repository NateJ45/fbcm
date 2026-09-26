import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  churchApp,
  googlePlayHref,
  installCode,
} from './church-app.ts';

// A stega run as the preview client appends it: U+200B prefix, then the payload.
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);
const SHARE = 'https://open.churchtrac.com?code=8PG6ZJ';

test('the install code is read from the church share link', () => {
  assert.equal(installCode(SHARE), '8PG6ZJ');
});

test('the code is upper-cased and trimmed, and other parameters do not matter', () => {
  assert.equal(installCode('https://open.churchtrac.com/?utm=x&code=8pg6zj '), '8PG6ZJ');
});

test('no code, a malformed code or a code on another site gives null', () => {
  assert.equal(installCode('https://open.churchtrac.com'), null);
  assert.equal(installCode('https://open.churchtrac.com?code=8PG6'), null);
  assert.equal(installCode('https://open.churchtrac.com?code=8PG6ZJ7'), null);
  assert.equal(installCode('https://open.churchtrac.com?code=8PG-ZJ'), null);
  assert.equal(installCode('https://example.com?code=8PG6ZJ'), null);
  assert.equal(installCode('https://evilchurchtrac.com?code=8PG6ZJ'), null);
  assert.equal(installCode('not a url'), null);
  assert.equal(installCode(''), null);
  assert.equal(installCode(null), null);
  assert.equal(installCode(undefined), null);
});

test('stega: the link is cleaned before it is parsed', () => {
  assert.equal(installCode(SHARE + STEGA), '8PG6ZJ');
  const app = churchApp(SHARE + STEGA);
  assert.equal(app?.href, SHARE);
  assert.equal(app?.code, '8PG6ZJ');
});

test('the Google Play button installs linked to the church, as the share link does', () => {
  assert.equal(
    googlePlayHref('8PG6ZJ'),
    'https://play.google.com/store/apps/details?id=com.churchtrac.churchconnect&referrer=code%3D8PG6ZJ',
  );
  assert.equal(googlePlayHref(null), GOOGLE_PLAY_URL);
});

test('churchApp: everything the band draws, from the one link', () => {
  assert.deepEqual(churchApp(SHARE), {
    href: SHARE,
    code: '8PG6ZJ',
    appStore: APP_STORE_URL,
    googlePlay: googlePlayHref('8PG6ZJ'),
  });
});

test('churchApp: a link with no code still draws the buttons, with no code', () => {
  const app = churchApp('https://fbcmuncie.churchtrac.com/connect');
  assert.equal(app?.code, null);
  assert.equal(app?.googlePlay, GOOGLE_PLAY_URL);
});

test('churchApp: an empty or unusable box draws nothing', () => {
  assert.equal(churchApp(''), null);
  assert.equal(churchApp('   '), null);
  assert.equal(churchApp(STEGA), null);
  assert.equal(churchApp(null), null);
  assert.equal(churchApp(undefined), null);
  assert.equal(churchApp('open.churchtrac.com?code=8PG6ZJ'), null);
  assert.equal(churchApp('javascript:alert(1)'), null);
});

test('the store listings are the real ones', () => {
  assert.match(APP_STORE_URL, /^https:\/\/apps\.apple\.com\/.+\/id6737914083$/);
  assert.match(GOOGLE_PLAY_URL, /[?&]id=com\.churchtrac\.churchconnect$/);
});
