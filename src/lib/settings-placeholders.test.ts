// Safe to edit by hand
// Site settings placeholders. The contract: a placeholder fills from Site
// settings, a typed copy converts to a placeholder, and converting then filling
// gives back what the church wrote (apart from "AM" printing as "am"). The
// fixtures are the real strings from the dataset on 2026-09-22, including the
// two that only look like the service time and must be left alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fillPlaceholders,
  fillString,
  findTypedCopies,
  hasPlaceholder,
  PLACEHOLDERS,
  placeholderValues,
  placeholdersForTypedCopies,
  typedCopiesToPlaceholders,
} from './settings-placeholders.ts';

const settings = {
  serviceTime: 'Sundays at 10:45 am',
  serviceLength: 'About an hour',
  address: '309 East Adams Street\nMuncie, IN 47305',
  phone: '(765) 284-7749',
  email: 'office@fbcmuncie.org',
};
const values = placeholderValues(settings);
const TEXT = Object.fromEntries(PLACEHOLDERS.map((p) => [p.token, true]));

test('each placeholder reads the right part of Site settings', () => {
  // The text placeholders; the link tokens ride along, blank here (see below).
  const text = Object.fromEntries(Object.entries(values).filter(([k]) => k in TEXT));
  assert.deepEqual(text, {
    '{service time}': 'Sundays at 10:45 am',
    '{time}': '10:45 am',
    '{service length}': 'About an hour',
    '{address}': '309 East Adams Street',
    '{short address}': '309 East Adams',
    '{city}': 'Muncie, IN 47305',
    '{phone}': '(765) 284-7749',
    '{email}': 'office@fbcmuncie.org',
  });
});

test('placeholders fill inside a sentence, in any case', () => {
  assert.equal(
    fillString('{Service Time}. {address}, {city}.', values),
    'Sundays at 10:45 am. 309 East Adams Street, Muncie, IN 47305.',
  );
  assert.equal(
    fillString('Worship is at {time} each Sunday.', values),
    'Worship is at 10:45 am each Sunday.',
  );
});

test('an unknown word in braces, or a blank setting, stays visible', () => {
  assert.equal(fillString('{pastor} will greet you', values), '{pastor} will greet you');
  const noPhone = placeholderValues({ ...settings, phone: '' });
  assert.equal(fillString('Call {phone}.', noPhone), 'Call {phone}.');
});

test('system keys and link targets are never touched', () => {
  const doc = {
    _type: 'x',
    _key: '{time}',
    text: '{email}',
    markDefs: [{ _key: 'l1', _type: 'link', href: 'mailto:{email}' }],
  };
  assert.deepEqual(fillPlaceholders(doc, values), {
    _type: 'x',
    _key: '{time}',
    text: 'office@fbcmuncie.org',
    markDefs: [{ _key: 'l1', _type: 'link', href: 'mailto:{email}' }],
  });
});

test('filling does not mutate the fetched result', () => {
  const doc = { a: ['{time}'] };
  fillPlaceholders(doc, values);
  assert.deepEqual(doc, { a: ['{time}'] });
});

test('hasPlaceholder finds one anywhere, and only a known one', () => {
  assert.equal(hasPlaceholder({ a: [{ b: 'at {time}' }] }), true);
  assert.equal(hasPlaceholder({ a: [{ b: 'at {pastor}' }] }), false);
  assert.equal(hasPlaceholder('plain'), false);
});

// ── Link tokens ({giving}, {sermons}...), feat/church-links ─────────────────
const CC = 'https://fbcmuncie.churchcenter.com';
const linked = placeholderValues({
  ...settings,
  givingUrl: `${CC}/giving`,
  visitorFormUrl: `${CC}/people/forms/159198`,
  livestreamUrl: 'https://www.youtube.com/@FbcmuncieOrg/streams',
});

test('a link token fills a link target: href, externalUrl, url, anywhere in the tree', () => {
  const doc = {
    _type: 'page',
    pageBuilder: [
      {
        _key: 'a',
        body: [{ _key: 'b', markDefs: [{ _key: 'l', _type: 'link', href: '{giving}' }] }],
        primaryCta: { externalUrl: '{connect}' },
        docs: [{ _key: 'd', url: '{Sermons}' }],
      },
    ],
  };
  const out = fillPlaceholders(doc, linked, () => assert.fail('nothing is unfilled here'));
  const band = out.pageBuilder[0];
  assert.equal(band.body[0].markDefs[0].href, `${CC}/giving`);
  assert.equal(band.primaryCta.externalUrl, `${CC}/people/forms/159198`);
  assert.equal(
    band.docs[0].url,
    'https://www.youtube.com/@FbcmuncieOrg/streams',
    '{sermons} with no Sermon recordings setting uses the live stream address',
  );
});

test('an unfilled link token becomes /contact, never a broken link, and is reported', () => {
  const heard: string[] = [];
  const out = fillPlaceholders(
    { a: { href: '{calendar}' }, b: { externalUrl: '{prayer}' } },
    linked,
    (t) => heard.push(t),
  );
  assert.deepEqual(out, { a: { href: '/contact' }, b: { externalUrl: '/contact' } });
  assert.deepEqual(heard, ['{calendar}', '{prayer}']);
});

test('{giving} with no giving address falls back to the church’s own /give page', () => {
  const heard: string[] = [];
  const unset = placeholderValues(settings); // no givingUrl at all
  const out = fillPlaceholders({ href: '{giving}' }, unset, (t) => heard.push(t));
  assert.deepEqual(out, { href: '/give' });
  assert.deepEqual(heard, ['{giving}']);
});

test('the two wedding forms fall back to the wedding office’s own email', () => {
  const out = fillPlaceholders(
    { a: { url: '{wedding-enquiry}' }, b: { url: '{wedding-booking}' } },
    linked,
  );
  assert.deepEqual(out, {
    a: { url: 'mailto:wedding@fbcmuncie.org' },
    b: { url: 'mailto:wedding@fbcmuncie.org' },
  });
});

test('{wednesday} and {contact-form} are hidden (empty string), not a dead link', () => {
  const out = fillPlaceholders(
    { a: { href: '{wednesday}' }, b: { href: '{contact-form}' } },
    linked,
    () => {}, // both are expected to be unfilled here; nothing to assert on the callback
  );
  assert.deepEqual(out, { a: { href: '' }, b: { href: '' } });
});

test('a link token inside a sentence is left as typed; text placeholders still skip hrefs', () => {
  assert.equal(fillPlaceholders('Give at {giving}.', linked), 'Give at {giving}.');
  assert.deepEqual(fillPlaceholders({ href: 'mailto:{email}' }, linked), {
    href: 'mailto:{email}',
  });
});

test('hasPlaceholder sees a whole-value link token, and nothing else new', () => {
  assert.equal(hasPlaceholder({ markDefs: [{ href: '{giving}' }] }), true);
  assert.equal(hasPlaceholder({ href: 'https://fbcmuncie.churchcenter.com/giving' }), false);
  assert.equal(hasPlaceholder({ href: '{nope}' }), false);
});

test('with no link token in it, a result fills exactly as before (render-neutral)', () => {
  const doc = {
    cta: { externalUrl: `${CC}/giving` },
    body: [{ markDefs: [{ href: `${CC}/channels/4999` }], text: '{time}' }],
  };
  assert.deepEqual(fillPlaceholders(doc, linked), {
    cta: { externalUrl: `${CC}/giving` },
    body: [{ markDefs: [{ href: `${CC}/channels/4999` }], text: '10:45 am' }],
  });
});

// The real typed copies, and what each should become.
const CONVERSIONS: [string, string][] = [
  ['10:45 am', '{time}'],
  ['Worship is at 10:45 AM each Sunday.', 'Worship is at {time} each Sunday.'],
  [
    'First Baptist Church Muncie | Sundays 10:45 am, downtown Muncie',
    'First Baptist Church Muncie | Sundays {time}, downtown Muncie',
  ],
  [
    'Sundays at 10:45 am. 309 East Adams Street, Muncie, IN 47305.',
    '{service time}. {address}, {city}.',
  ],
  ['Sundays at 10:45 am. 309 East Adams Street.', '{service time}. {address}.'],
  ['309 East Adams', '{short address}'],
  ['309 East Adams Street. (765) 284-7749.', '{address}. {phone}.'],
  ['About an hour', '{service length}'],
  ['office@fbcmuncie.org', '{email}'],
  [
    'When it’s time for the worship service to begin at 10:45 AM, younger kids may be returned',
    'When it’s time for the worship service to begin at {time}, younger kids may be returned',
  ],
  [
    'Sunday school at 9:30 am, worship at 10:45 am, and the person to talk to',
    'Sunday school at 9:30 am, worship at {time}, and the person to talk to',
  ],
];

test('typed copies convert to placeholders', () => {
  for (const [before, after] of CONVERSIONS) {
    assert.equal(typedCopiesToPlaceholders(before, settings), after, before);
  }
});

test('converting then filling gives back the church’s words (AM prints as am)', () => {
  for (const [before] of CONVERSIONS) {
    const round = fillString(typedCopiesToPlaceholders(before, settings), values);
    assert.equal(round, before.replace(/10:45 AM/g, '10:45 am'), before);
  }
});

test('numbers that only look like the settings are left alone', () => {
  const untouched = [
    'rather than seeking to be served ourselves (Mark 10:45).',
    'typically attend Donut (Semi) Hour with the whole congregation (10:15-10:45 a.m.).',
    'It takes about an hour to set up the fellowship hall.',
    '309 East Adams Streetcar',
  ];
  for (const s of untouched) assert.equal(typedCopiesToPlaceholders(s, settings), s, s);
});

test('findTypedCopies reports paths by _key and skips links and system keys', () => {
  const doc = {
    _id: 'page-visit',
    pageBuilder: [
      { _key: 'hero', _type: 'heroSection', facts: [{ _key: 'f1', value: '10:45 am' }] },
      {
        _key: 'faq',
        body: [{ _key: 'b', markDefs: [{ _key: 'l', href: 'mailto:office@fbcmuncie.org' }] }],
      },
    ],
  };
  assert.deepEqual(findTypedCopies(doc, settings), [
    {
      path: 'pageBuilder[_key=="hero"].facts[_key=="f1"].value',
      before: '10:45 am',
      after: '{time}',
    },
  ]);
});

test('a whole seeded page converts, keys and links untouched', () => {
  const doc = {
    _id: 'page-visit',
    _type: 'page',
    pageBuilder: [
      {
        _key: 'visit-hero',
        facts: [{ _key: 'fact-1', label: 'Sundays', value: '10:45 am' }],
        cta: { href: 'mailto:office@fbcmuncie.org' },
      },
    ],
  };
  assert.deepEqual(placeholdersForTypedCopies(doc, settings), {
    _id: 'page-visit',
    _type: 'page',
    pageBuilder: [
      {
        _key: 'visit-hero',
        facts: [{ _key: 'fact-1', label: 'Sundays', value: '{time}' }],
        cta: { href: 'mailto:office@fbcmuncie.org' },
      },
    ],
  });
});
