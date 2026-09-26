import { test } from 'node:test';
import assert from 'node:assert/strict';
import { llmsText, oneLineAddress, ptLines } from './llms-text.ts';

const line = (text: string) => ({ _type: 'block', children: [{ text }] });

// The live Site settings, as of 2026-09-24 (read-only query).
const SETTINGS = {
  title: 'First Baptist Church Muncie',
  tagline: "We're a Spirit-led people gathered to join Christ's presence in our community.",
  address: '309 East Adams Street\nMuncie, IN 47305',
  serviceTime: 'Sundays at 10:45 am',
  serviceLength: 'About an hour',
  phone: '(765) 284-7749',
  email: 'office@fbcmuncie.org',
  officeHours: [
    line('Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm'),
    line('Friday: 9 am to 12 pm'),
  ],
  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=309+East+Adams+Street+Muncie+IN+47305',
  livestreamUrl: 'https://www.youtube.com/@FbcmuncieOrg/streams',
  youtubeUrl: 'https://www.youtube.com/c/FbcmuncieOrg',
  churchTracUrl: 'https://fbcmuncie.churchtrac.com/',
  givingUrl: 'https://fbcmuncie.churchcenter.com/giving',
};

const SITE = 'https://www.fbcmuncie.org';

test('the address reads as one line, and hours as their typed lines', () => {
  assert.equal(oneLineAddress(SETTINGS.address), '309 East Adams Street, Muncie, IN 47305');
  assert.equal(oneLineAddress(null), '');
  assert.deepEqual(ptLines(SETTINGS.officeHours), [
    'Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm',
    'Friday: 9 am to 12 pm',
  ]);
  assert.deepEqual(ptLines(null), []);
});

test('llmsText says who, where and when from Site settings, and lists the pages', () => {
  const text = llmsText({
    siteUrl: SITE,
    name: 'Fallback',
    settings: SETTINGS,
    pages: [
      { path: '/', title: 'Home', description: 'An American Baptist church in downtown Muncie.' },
      { path: '/visit', title: 'Plan a visit', description: 'Worship is Sundays at 10:45 am.' },
      { path: '/give', title: 'Give', description: null },
    ],
    whatToExpect: [{ question: 'What should I wear?', answer: 'Casual dress is welcome.' }],
    visitPath: '/visit',
    fullPath: '/llms-full.txt',
    journal: true,
  });
  assert.match(
    text,
    /^# First Baptist Church Muncie\n\n> An American Baptist church in downtown Muncie, Indiana\. We're a Spirit-led people/,
  );
  assert.ok(text.includes('- Worship: Sundays at 10:45 am (about an hour)'));
  assert.ok(text.includes('- Where: 309 East Adams Street, Muncie, IN 47305'));
  assert.ok(text.includes('- Plan a visit: https://www.fbcmuncie.org/visit'));
  assert.ok(text.includes('### What should I wear?\n\nCasual dress is welcome.'));
  assert.ok(text.includes('- Phone: (765) 284-7749'));
  assert.ok(
    text.includes(
      '- Office hours: Monday to Thursday: 9 am to 12 pm and 1 pm to 4 pm; Friday: 9 am to 12 pm',
    ),
  );
  assert.ok(text.includes('- [Home](https://www.fbcmuncie.org/): An American Baptist church'));
  assert.ok(text.includes('- [Give](https://www.fbcmuncie.org/give)\n'));
  assert.ok(
    text.includes(
      '- Church Trac (the calendar, the connection card and the app): https://fbcmuncie.churchtrac.com/',
    ),
  );
  assert.ok(!text.includes('Church Center'), 'the church is leaving Church Center');
  assert.ok(text.includes('https://www.fbcmuncie.org/blog/rss.xml'));
  assert.ok(text.includes('https://www.fbcmuncie.org/llms-full.txt'));
  assert.ok(!text.includes('—'), 'no em-dash (CLAUDE.md rule 2)');
});

test('llmsText with no settings still names the church and leaves out what it does not know', () => {
  const text = llmsText({
    siteUrl: SITE,
    name: 'First Baptist Church Muncie',
    settings: null,
    pages: [],
  });
  assert.match(text, /^# First Baptist Church Muncie/);
  for (const absent of [
    '- Worship',
    '- Phone',
    '## Pages',
    '## Elsewhere',
    '## What to expect',
    '/blog',
  ])
    assert.ok(!text.includes(absent), absent);
});
