import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  platformOfUrl,
  socialLinkLabel,
  socialLinksOf,
  socialUrlKey,
  type SocialSettings,
} from './social-links.ts';
import { isNonStegaField } from './non-stega-fields.ts';
import { sameAsOf } from './church-schema.ts';

// The live Site settings, as of 2026-09-24.
const LIVE: SocialSettings = {
  socialLinks: [
    { platform: 'Facebook', url: 'https://www.facebook.com/firstbaptistmuncie' },
    { platform: 'Instagram', url: 'https://www.instagram.com/fbcmuncie/' },
  ],
  youtubeUrl: 'https://www.youtube.com/c/FbcmuncieOrg',
};

// A stega run as the preview client appends it: U+200B prefix, base-4 digits
// in zero-width characters (the same fixture office-hours.test.ts uses).
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

const names = (s: SocialSettings | null | undefined) => socialLinksOf(s).map((l) => l.name);

test('the live settings give Facebook, Instagram and the derived YouTube, in that order', () => {
  assert.deepEqual(socialLinksOf(LIVE), [
    { platform: 'Facebook', url: 'https://www.facebook.com/firstbaptistmuncie', name: 'Facebook' },
    { platform: 'Instagram', url: 'https://www.instagram.com/fbcmuncie/', name: 'Instagram' },
    { platform: 'YouTube', url: 'https://www.youtube.com/c/FbcmuncieOrg', name: 'YouTube' },
  ]);
});

test('nothing set gives nothing', () => {
  assert.deepEqual(socialLinksOf(null), []);
  assert.deepEqual(socialLinksOf(undefined), []);
  assert.deepEqual(socialLinksOf({}), []);
  assert.deepEqual(socialLinksOf({ socialLinks: [null, { platform: 'Facebook' }] }), []);
});

test('YouTube alone, from youtubeUrl', () => {
  assert.deepEqual(names({ youtubeUrl: LIVE.youtubeUrl }), ['YouTube']);
});

test('a stored YouTube entry wins over the derived one', () => {
  const links = socialLinksOf({
    ...LIVE,
    socialLinks: [
      ...(LIVE.socialLinks ?? []),
      { platform: 'YouTube', url: 'https://www.youtube.com/@fbcmuncie' },
    ],
  });
  assert.deepEqual(
    links.map((l) => l.url),
    [
      'https://www.facebook.com/firstbaptistmuncie',
      'https://www.instagram.com/fbcmuncie/',
      'https://www.youtube.com/@fbcmuncie',
    ],
  );
});

test('a stored entry pointing at YouTube with no platform still counts as YouTube', () => {
  const links = socialLinksOf({
    socialLinks: [{ url: 'https://youtube.com/@fbcmuncie' }],
    youtubeUrl: LIVE.youtubeUrl,
  });
  assert.deepEqual(links, [
    { platform: 'YouTube', url: 'https://youtube.com/@fbcmuncie', name: 'YouTube' },
  ]);
});

test('de-duplicates by address, ignoring scheme, www, trailing slash and case', () => {
  const links = socialLinksOf({
    socialLinks: [
      { platform: 'Facebook', url: 'https://www.facebook.com/firstbaptistmuncie' },
      { platform: 'Facebook', url: 'http://facebook.com/FirstBaptistMuncie/' },
      { platform: 'Other', url: 'HTTPS://WWW.YOUTUBE.COM/c/fbcmuncieorg/', label: 'Channel' },
    ],
    youtubeUrl: LIVE.youtubeUrl,
  });
  // The first spelling is kept; the stored YouTube address (read off its host)
  // stops the derived one from being added at all.
  assert.deepEqual(
    links.map((l) => l.url),
    ['https://www.facebook.com/firstbaptistmuncie', 'HTTPS://WWW.YOUTUBE.COM/c/fbcmuncieorg/'],
  );
  assert.equal(
    socialUrlKey('https://www.YouTube.com/c/FbcmuncieOrg/'),
    'youtube.com/c/fbcmuncieorg',
  );
});

test('the order is Facebook, Instagram, YouTube, then the rest as stored', () => {
  const links = socialLinksOf({
    socialLinks: [
      { platform: 'X', url: 'https://x.com/fbcm' },
      { platform: 'Instagram', url: 'https://instagram.com/fbcmuncie' },
      { platform: 'Other', url: 'https://example.org/fbcm', label: 'Our podcast' },
      { platform: 'Facebook', url: 'https://facebook.com/firstbaptistmuncie' },
      { platform: 'LinkedIn', url: 'https://linkedin.com/company/fbcm' },
    ],
    youtubeUrl: LIVE.youtubeUrl,
  });
  assert.deepEqual(
    links.map((l) => l.name),
    ['Facebook', 'Instagram', 'YouTube', 'X', 'Our podcast', 'LinkedIn'],
  );
});

test('the legacy fields are the fallback only when the array is empty', () => {
  const legacy = {
    socialFacebook: 'https://www.facebook.com/firstbaptistmuncie',
    socialInstagram: 'https://www.instagram.com/fbcmuncie/',
  };
  assert.deepEqual(names({ ...legacy, socialLinks: [] }), ['Facebook', 'Instagram']);
  assert.deepEqual(names({ ...legacy, youtubeUrl: LIVE.youtubeUrl }), [
    'Facebook',
    'Instagram',
    'YouTube',
  ]);
  assert.deepEqual(
    names({ ...legacy, socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com/x' }] }),
    ['Instagram'],
  );
});

test('only http(s) addresses are drawn', () => {
  assert.deepEqual(
    names({
      socialLinks: [
        { platform: 'Facebook', url: 'facebook.com/firstbaptistmuncie' },
        { platform: 'Instagram', url: 'javascript:alert(1)' },
        { platform: 'Other', url: 'mailto:office@fbcmuncie.org', label: 'Email' },
      ],
      youtubeUrl: 'not a url',
    }),
    [],
  );
});

test('an Other entry is named by its label, else by its host', () => {
  assert.deepEqual(
    names({
      socialLinks: [
        { platform: 'Other', url: 'https://example.org/a', label: 'Podcast' },
        { platform: 'Other', url: 'https://www.example.net/b' },
      ],
    }),
    ['Podcast', 'example.net'],
  );
});

test('platformOfUrl reads the known hosts', () => {
  assert.equal(platformOfUrl('https://m.facebook.com/x'), 'Facebook');
  assert.equal(platformOfUrl('https://youtu.be/abc'), 'YouTube');
  assert.equal(platformOfUrl('https://twitter.com/x'), 'X');
  assert.equal(platformOfUrl('https://notfacebook.com.evil.org/x'), '');
  assert.equal(platformOfUrl('https://example.org'), '');
});

test('stega-encoded values are cleaned before they are compared, keyed or drawn', () => {
  const enc = (s: string) => s + STEGA;
  const fb = enc('https://www.facebook.com/firstbaptistmuncie');
  assert.notEqual(fb, 'https://www.facebook.com/firstbaptistmuncie', 'the payload is really there');
  const links = socialLinksOf({
    socialLinks: [
      { platform: enc('Facebook'), url: fb },
      { platform: 'Facebook', url: 'https://facebook.com/firstbaptistmuncie/' },
      { platform: enc('Other'), url: enc('https://example.org/x'), label: enc('Podcast') },
    ],
    youtubeUrl: enc(LIVE.youtubeUrl as string),
  });
  assert.deepEqual(links, [
    { platform: 'Facebook', url: 'https://www.facebook.com/firstbaptistmuncie', name: 'Facebook' },
    { platform: 'YouTube', url: 'https://www.youtube.com/c/FbcmuncieOrg', name: 'YouTube' },
    { platform: 'Other', url: 'https://example.org/x', name: 'Podcast' },
  ]);
  assert.equal(
    socialLinkLabel(links[0], enc('First Baptist Church Muncie')),
    'First Baptist Church Muncie on Facebook',
  );
});

test('platform drives the icon, so it is on NON_STEGA_FIELDS (rule 8b)', () => {
  assert.equal(isNonStegaField('platform'), true);
});

test('socialLinkLabel names the church and the platform', () => {
  const [fb] = socialLinksOf(LIVE);
  assert.equal(
    socialLinkLabel(fb, 'First Baptist Church Muncie'),
    'First Baptist Church Muncie on Facebook',
  );
  assert.equal(socialLinkLabel(fb, ''), 'Facebook');
});

test('sameAsOf is unchanged: it still keeps a path spelled in another case', () => {
  // sameAs lists any record (Church Center, Wikidata), whose paths may be
  // case-sensitive, so it keeps its own key; the social list lower-cases.
  const out = sameAsOf({
    socialLinks: [
      { url: 'https://www.youtube.com/c/FbcmuncieOrg' },
      { url: 'https://www.youtube.com/c/fbcmuncieorg' },
    ],
  });
  assert.equal(out.length, 2);
});
