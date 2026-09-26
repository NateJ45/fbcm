import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addMinutes,
  breadcrumbNode,
  churchNode,
  clock24,
  isoDuration,
  ldJson,
  minutesOf,
  ogCardPath,
  parseAddress,
  sameAsOf,
  sundayOnOrAfter,
  sundayWorshipNode,
  zoneOffset,
  type SiteFacts,
} from './church-schema.ts';
import { validateNode } from './schema-vocab.ts';

// The live Site settings, as of 2026-09-24 (read-only query).
const SETTINGS = {
  title: 'First Baptist Church Muncie',
  tagline: "We're a Spirit-led people gathered to join Christ's presence in our community.",
  email: 'office@fbcmuncie.org',
  phone: '(765) 284-7749',
  address: '309 East Adams Street\nMuncie, IN 47305',
  serviceTime: 'Sundays at 10:45 am',
  serviceLength: 'About an hour',
  youtubeUrl: 'https://www.youtube.com/c/FbcmuncieOrg',
  churchCenterUrl: 'https://fbcmuncie.churchcenter.com/',
  churchTracUrl: 'https://fbcmuncie.churchtrac.com/',
  livestreamUrl: 'https://www.youtube.com/@FbcmuncieOrg/streams',
  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=309+East+Adams+Street+Muncie+IN+47305',
  socialFacebook: null,
  socialInstagram: null,
  socialLinks: null,
};

const SITE: SiteFacts = {
  url: 'https://www.fbcmuncie.org',
  name: 'First Baptist Church Muncie',
  geo: { latitude: 40.19167, longitude: -85.38405 },
  logo: 'https://www.fbcmuncie.org/icon-512.png',
  image: 'https://www.fbcmuncie.org/og/home.png',
  sameAsPlace: ['https://www.wikidata.org/wiki/Q5452411'],
};

test('parseAddress reads the two-line Site settings address', () => {
  assert.deepEqual(parseAddress(SETTINGS.address), {
    '@type': 'PostalAddress',
    streetAddress: '309 East Adams Street',
    addressLocality: 'Muncie',
    addressRegion: 'IN',
    postalCode: '47305',
    addressCountry: 'US',
  });
});

test('parseAddress reads a one-line address and never guesses a town', () => {
  assert.equal(parseAddress('309 East Adams Street, Muncie, IN 47305')?.addressLocality, 'Muncie');
  assert.deepEqual(parseAddress('309 East Adams Street'), {
    '@type': 'PostalAddress',
    streetAddress: '309 East Adams Street',
    addressCountry: 'US',
  });
  assert.equal(parseAddress(''), null);
  assert.equal(parseAddress(null), null);
});

test('clock24 turns the site time into a 24-hour clock', () => {
  assert.equal(clock24('10:45 am'), '10:45');
  assert.equal(clock24('7 pm'), '19:00');
  assert.equal(clock24('12:30 p.m.'), '12:30');
  assert.equal(clock24('12 am'), '00:00');
  assert.equal(clock24('Sundays'), '');
  assert.equal(clock24('13:00 pm'), '');
});

test('minutesOf reads a service length in words', () => {
  assert.equal(minutesOf('About an hour'), 60);
  assert.equal(minutesOf('About an hour and a half'), 90);
  assert.equal(minutesOf('75 minutes'), 75);
  assert.equal(minutesOf('1 hour 15 minutes'), 75);
  assert.equal(minutesOf('Two hours'), 120);
  assert.equal(minutesOf('It varies'), null);
  assert.equal(minutesOf(''), null);
});

test('isoDuration and addMinutes', () => {
  assert.equal(isoDuration(60), 'PT1H');
  assert.equal(isoDuration(75), 'PT1H15M');
  assert.equal(isoDuration(45), 'PT45M');
  assert.equal(isoDuration(0), 'PT0M');
  assert.equal(addMinutes('10:45', 60), '11:45');
  assert.equal(addMinutes('23:30', 60), '00:30');
});

test('zoneOffset follows daylight saving on the church clock', () => {
  assert.equal(zoneOffset(new Date(Date.UTC(2026, 8, 27))), '-04:00'); // September
  assert.equal(zoneOffset(new Date(Date.UTC(2026, 0, 4))), '-05:00'); // January
  // 2026-03-08 is the spring-forward Sunday; the 10:45 service keeps EDT.
  assert.equal(zoneOffset(new Date(Date.UTC(2026, 2, 8))), '-04:00');
});

test('sundayOnOrAfter reads the day on the church clock', () => {
  // Thursday 2026-09-24
  assert.equal(sundayOnOrAfter('2026-09-24T15:00:00Z')?.toISOString().slice(0, 10), '2026-09-27');
  // A Sunday stays that Sunday
  assert.equal(sundayOnOrAfter('2026-09-27T14:00:00Z')?.toISOString().slice(0, 10), '2026-09-27');
  // Saturday 10pm in Muncie is already Sunday in UTC: still that Sunday
  assert.equal(sundayOnOrAfter('2026-09-27T02:00:00Z')?.toISOString().slice(0, 10), '2026-09-27');
  assert.equal(sundayOnOrAfter(null), null);
  assert.equal(sundayOnOrAfter('not a date'), null);
});

test('sameAsOf keeps the records, deduplicated, and drops non-URLs', () => {
  assert.deepEqual(
    sameAsOf({ ...SETTINGS, socialLinks: [{ url: SETTINGS.youtubeUrl }, { url: 'mailto:x' }] }, [
      'https://www.wikidata.org/wiki/Q5452411',
    ]),
    [
      SETTINGS.youtubeUrl,
      SETTINGS.churchCenterUrl,
      SETTINGS.churchTracUrl,
      'https://www.wikidata.org/wiki/Q5452411',
    ],
  );
});

test('sameAsOf treats www, the scheme and a trailing slash as the same profile', () => {
  assert.deepEqual(
    sameAsOf(
      {
        socialFacebook: 'https://www.facebook.com/firstbaptistmuncie',
        socialLinks: [
          { url: 'https://facebook.com/firstbaptistmuncie/' },
          { url: 'http://www.instagram.com/fbcmuncie/' },
          { url: 'https://www.instagram.com/fbcmuncie' },
        ],
      },
      ['', 'https://www.wikidata.org/wiki/Q5452411'],
    ),
    [
      'https://www.facebook.com/firstbaptistmuncie',
      'http://www.instagram.com/fbcmuncie/',
      'https://www.wikidata.org/wiki/Q5452411',
    ],
  );
});

test('the Google Business Profile, once set, is in sameAs and becomes hasMap', () => {
  const without = churchNode(SETTINGS, SITE);
  assert.equal(without.hasMap, SETTINGS.directionsUrl);
  const gbp = 'https://maps.app.goo.gl/abc123';
  const node = churchNode(SETTINGS, { ...SITE, googleBusinessProfile: gbp });
  assert.equal(node.hasMap, gbp);
  assert.ok((node.sameAs as string[]).includes(gbp));
  assert.deepEqual(validateNode(node), []);
});

test('churchNode carries every fact from Site settings and is valid schema.org', () => {
  const node = churchNode(SETTINGS, SITE);
  assert.deepEqual(node['@type'], ['Church', 'Organization']);
  assert.equal(node['@id'], 'https://www.fbcmuncie.org/#church');
  assert.equal(node.telephone, '(765) 284-7749');
  assert.equal(node.email, 'office@fbcmuncie.org');
  assert.deepEqual(node.geo, {
    '@type': 'GeoCoordinates',
    latitude: 40.19167,
    longitude: -85.38405,
  });
  assert.equal((node.address as { streetAddress: string }).streetAddress, '309 East Adams Street');
  assert.ok((node.sameAs as string[]).includes('https://fbcmuncie.churchcenter.com/'));
  assert.ok((node.sameAs as string[]).includes('https://fbcmuncie.churchtrac.com/'));
  assert.equal(node.isAccessibleForFree, true);
  assert.equal(node.publicAccess, true);
  assert.ok(!('priceRange' in node), 'a church has no price range');
  assert.deepEqual(validateNode(node), []);
});

test('churchNode with no settings still names the church and omits the blanks', () => {
  const node = churchNode(null, { url: SITE.url, name: SITE.name });
  assert.equal(node.name, 'First Baptist Church Muncie');
  for (const k of ['telephone', 'email', 'address', 'geo', 'sameAs']) assert.ok(!(k in node), k);
  assert.deepEqual(validateNode(node), []);
});

test('sundayWorshipNode: a weekly Event, dated at one real Sunday', () => {
  const node = sundayWorshipNode(SETTINGS, SITE, {
    pageUrl: 'https://www.fbcmuncie.org/visit',
    occurrence: new Date(Date.UTC(2026, 8, 27)),
  });
  assert.ok(node);
  assert.equal(node['@type'], 'Event');
  assert.equal(node.startDate, '2026-09-27T10:45:00-04:00');
  assert.equal(node.endDate, '2026-09-27T11:45:00-04:00');
  assert.deepEqual(node.eventSchedule, {
    '@type': 'Schedule',
    repeatFrequency: 'P1W',
    byDay: 'https://schema.org/Sunday',
    startTime: '10:45:00',
    endTime: '11:45:00',
    duration: 'PT1H',
    scheduleTimezone: 'America/Indiana/Indianapolis',
  });
  assert.equal(node.eventAttendanceMode, 'https://schema.org/MixedEventAttendanceMode');
  assert.equal(
    node.description,
    'Worship on Sundays at 10:45 am at 309 East Adams Street, Muncie. About an hour.',
  );
  assert.deepEqual(validateNode(node), []);
});

test('sundayWorshipNode: no readable time, no Event; no occurrence, no startDate', () => {
  assert.equal(
    sundayWorshipNode({ ...SETTINGS, serviceTime: 'Sundays' }, SITE, {
      pageUrl: 'x',
      occurrence: null,
    }),
    null,
  );
  const undated = sundayWorshipNode({ ...SETTINGS, livestreamUrl: null }, SITE, {
    pageUrl: 'https://www.fbcmuncie.org/visit',
    occurrence: null,
  });
  assert.ok(undated && !('startDate' in undated));
  assert.equal(undated?.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
});

test('ogCardPath is the per-route card convention', () => {
  assert.equal(ogCardPath('/'), '/og/home.png');
  assert.equal(ogCardPath('/visit'), '/og/visit.png');
  assert.equal(ogCardPath('/visit/'), '/og/visit.png');
  assert.equal(ogCardPath('/post/advent-2024'), '/og/post-advent-2024.png');
});

test('breadcrumbNode numbers its items and validates', () => {
  const node = breadcrumbNode([
    { name: 'Home', url: 'https://www.fbcmuncie.org' },
    { name: 'Plan a visit', url: 'https://www.fbcmuncie.org/visit' },
  ]);
  assert.equal((node.itemListElement as Array<{ position: number }>)[1]?.position, 2);
  assert.deepEqual(validateNode(node), []);
});

test('ldJson cannot close its own script tag', () => {
  assert.ok(!ldJson({ name: '</script><b>' }).includes('</script>'));
});

test('a calendar page may carry several Event blocks, but never the same event twice', async () => {
  const { validatePage } = await import('./schema-vocab.ts');
  const ev = (id: string, name: string) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': id,
    name,
  });
  const second = (errs: string[]) => errs.filter((e) => e.includes('a second'));
  assert.deepEqual(
    second(validatePage([ev('https://x/events#a', 'A'), ev('https://x/events#b', 'B')])),
    [],
  );
  assert.ok(
    validatePage([ev('https://x/events#a', 'A'), ev('https://x/events#a', 'A')]).some((e) =>
      e.includes('repeats'),
    ),
  );
  // Any other type is still one per page.
  const org = { '@context': 'https://schema.org', '@type': 'Church', name: 'C' };
  assert.equal(second(validatePage([org, org])).length, 1);
});
