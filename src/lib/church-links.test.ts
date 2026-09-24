// Safe to edit by hand
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHURCH_LINKS,
  LINK_FALLBACK,
  checkLinkBox,
  classifyChurchLink,
  isUnknownToken,
  isYouTubeUrl,
  linkTokenOf,
  linkValues,
  skippedOnPurpose,
  tokenizeChurchLinks,
  tokensWithAddress,
} from './church-links.ts';

const CC = 'https://fbcmuncie.churchcenter.com';
const STEGA = '​‌‍﻿​‌'; // a run of invisible marks

test('every token is lower case, braced, unique, and reads its own field', () => {
  const tokens = CHURCH_LINKS.map((l) => l.token);
  assert.equal(new Set(tokens).size, tokens.length);
  for (const t of tokens) assert.match(t, /^\{[a-z-]+\}$/);
  assert.equal(new Set(CHURCH_LINKS.map((l) => l.field)).size, tokens.length);
});

test('linkTokenOf: a whole value only, any case, surrounding space and stega ignored', () => {
  assert.equal(linkTokenOf('{giving}'), '{giving}');
  assert.equal(linkTokenOf('  {Giving} '), '{giving}');
  assert.equal(linkTokenOf(`{sermons}${STEGA}`), '{sermons}');
  assert.equal(linkTokenOf('give at {giving}'), null, 'never inside a sentence');
  assert.equal(linkTokenOf('{time}'), null, 'a text placeholder is not a link token');
  assert.equal(linkTokenOf('https://example.com'), null);
  assert.equal(linkTokenOf(null), null);
});

test('isUnknownToken: braced single words that are not link tokens', () => {
  assert.equal(isUnknownToken('{givng}'), true);
  assert.equal(isUnknownToken('{giving}'), false);
  assert.equal(isUnknownToken('/contact'), false);
  assert.equal(isUnknownToken('{service time}'), false, 'a spaced text placeholder is not flagged');
});

test('linkValues reads each field; blank stays blank; only http(s) counts', () => {
  const v = linkValues({
    givingUrl: 'https://give.example/',
    visitorFormUrl: '  https://form.example/1  ',
    prayerUrl: 'javascript:alert(1)',
  });
  assert.equal(v['{giving}'], 'https://give.example/');
  assert.equal(v['{connect}'], 'https://form.example/1');
  assert.equal(v['{prayer}'], '', 'a non-http value is treated as blank');
  assert.equal(v['{app}'], '');
});

test('linkValues: {sermons} falls back to the live stream, then the channel', () => {
  const streams = 'https://www.youtube.com/@FbcmuncieOrg/streams';
  const channel = 'https://www.youtube.com/c/FbcmuncieOrg';
  assert.equal(
    linkValues({ sermonsUrl: `${CC}/channels/4999`, livestreamUrl: streams })['{sermons}'],
    `${CC}/channels/4999`,
  );
  assert.equal(linkValues({ livestreamUrl: streams, youtubeUrl: channel })['{sermons}'], streams);
  assert.equal(linkValues({ youtubeUrl: channel })['{sermons}'], channel);
  assert.equal(linkValues({})['{sermons}'], '');
  assert.equal(linkValues(null)['{giving}'], '');
});

test('classifyChurchLink maps every address found in the dataset on 2026-09-24', () => {
  const token = (u: string) => {
    const c = classifyChurchLink(u);
    return c.kind === 'token' ? c.token : c.kind;
  };
  assert.equal(token(`${CC}/`), '{app}');
  assert.equal(token(CC), '{app}');
  assert.equal(token(`${CC}/giving`), '{giving}');
  assert.equal(token(`${CC}/calendar`), '{calendar}');
  assert.equal(token(`${CC}/people/forms/159198`), '{connect}');
  assert.equal(token(`${CC}/people/forms/159897`), '{contact-form}');
  assert.equal(token(`${CC}/people/forms/243785`), '{wedding-enquiry}');
  assert.equal(token(`${CC}/people/forms/520312`), '{wedding-booking}');
  assert.equal(token(`${CC}/pages/fbcs-wednesday-weekly`), '{wednesday}');
  assert.equal(token(`${CC}/pages/%0Afbcs-wednesday-weekly`), '{wednesday}', 'the %0A post');
  assert.equal(token(`${CC}/channels/4999`), '{sermons}');
  assert.equal(token(`${CC}/channels/4999/series/30635`), '{sermons}');
  assert.equal(token(`${CC}/episodes/206301`), '{sermons}');
  assert.equal(token(`${CC}/registrations/events/2250254`), 'past-event');
  assert.equal(token(`${CC}/calendar/event/123542793`), 'past-event');
  assert.equal(
    token('https://registrations.planningcenteronline.com/signups/2250254/details'),
    'past-event',
  );
  assert.equal(token(`${CC}/people/forms/111111`), 'unclassified', 'an unknown form');
  assert.equal(token('https://other.churchcenter.com/giving'), 'unclassified', 'another church');
  assert.equal(token('https://www.youtube.com/@FbcmuncieOrg'), 'other');
  assert.equal(token('/contact'), 'other');
});

test('tokenizeChurchLinks: link targets only, with paths the migration can patch', () => {
  const doc = {
    _id: 'page-visit',
    _type: 'page',
    pageBuilder: [
      {
        _key: 'hero',
        _type: 'heroSection',
        heading: `Visit ${CC}/giving`, // prose: never touched
        primaryCta: { _type: 'ctaBlock', externalUrl: `${CC}/people/forms/159198` },
      },
      {
        _key: 'faq',
        _type: 'richTextSection',
        body: [
          {
            _key: 'b1',
            _type: 'block',
            markDefs: [{ _key: 'l1', _type: 'link', href: `${CC}/channels/4999` }],
            children: [{ _key: 's1', _type: 'span', text: 'streams', marks: ['l1'] }],
          },
        ],
      },
      {
        _key: 'docs',
        _type: 'documentListSection',
        docs: [{ _key: 'd1', _type: 'listedDocument', url: `${CC}/people/forms/243785` }],
      },
      {
        _key: 'old',
        _type: 'richTextSection',
        body: [
          {
            _key: 'b2',
            _type: 'block',
            markDefs: [{ _key: 'l2', _type: 'link', href: `${CC}/registrations/events/1` }],
          },
        ],
      },
    ],
  };
  const { doc: out, changes, findings } = tokenizeChurchLinks(doc);
  assert.deepEqual(
    changes.map((c) => [c.path, c.after]),
    [
      ['pageBuilder[_key=="hero"].primaryCta.externalUrl', '{connect}'],
      ['pageBuilder[_key=="faq"].body[_key=="b1"].markDefs[_key=="l1"].href', '{sermons}'],
      ['pageBuilder[_key=="docs"].docs[_key=="d1"].url', '{wedding-enquiry}'],
    ],
  );
  assert.deepEqual(findings, [
    {
      path: 'pageBuilder[_key=="old"].body[_key=="b2"].markDefs[_key=="l2"].href',
      url: `${CC}/registrations/events/1`,
      kind: 'past-event',
    },
  ]);
  assert.equal(out.pageBuilder[0].heading, `Visit ${CC}/giving`);
  assert.equal(out.pageBuilder[0].primaryCta?.externalUrl, '{connect}');
  assert.equal(
    doc.pageBuilder[0].primaryCta?.externalUrl,
    `${CC}/people/forms/159198`,
    'no mutation',
  );
});

test("tokenizeChurchLinks leaves Site settings' own address fields and the policy alone", () => {
  const settings = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    givingUrl: `${CC}/giving`,
    churchCenterUrl: `${CC}/`,
    headerCta: { link: { _type: 'navLink', externalUrl: `${CC}/giving` } },
    footerColumns: [
      { _key: 'c', links: [{ _key: 'cc', _type: 'navLink', externalUrl: `${CC}/` }] },
    ],
  };
  const { doc, changes, findings } = tokenizeChurchLinks(settings);
  assert.deepEqual(
    changes.map((c) => c.path),
    ['headerCta.link.externalUrl'],
  );
  assert.equal(doc.givingUrl, `${CC}/giving`);
  assert.equal(findings[0].kind, 'skipped');
  const policy = tokenizeChurchLinks({
    _type: 'privacyPage',
    body: [{ _key: 'b', markDefs: [{ _key: 'l', _type: 'link', href: `${CC}/` }] }],
  });
  assert.equal(policy.changes.length, 0);
  assert.equal(policy.findings[0].kind, 'skipped');
  assert.equal(skippedOnPurpose('page', 'pageBuilder'), false);
});

test('tokenizeChurchLinks is idempotent: a tokenised document has nothing left to change', () => {
  const once = tokenizeChurchLinks({
    _type: 'page',
    cta: { externalUrl: `${CC}/giving` },
  }).doc;
  assert.equal(tokenizeChurchLinks(once).changes.length, 0);
});

test('tokensWithAddress: a re-seed only writes tokens whose own box is filled', () => {
  const doc = {
    _type: 'page',
    a: { externalUrl: `${CC}/giving` },
    b: { href: `${CC}/channels/4999` },
  };
  const before = tokenizeChurchLinks(doc, {
    only: tokensWithAddress({
      givingUrl: `${CC}/giving`,
      livestreamUrl: 'https://www.youtube.com/@FbcmuncieOrg/streams',
    }),
  });
  assert.deepEqual(
    before.changes.map((c) => c.after),
    ['{giving}'],
    '{sermons} waits for its own box, not the live stream fallback',
  );
  const after = tokenizeChurchLinks(doc, {
    only: tokensWithAddress({ givingUrl: `${CC}/giving`, sermonsUrl: `${CC}/channels/4999` }),
  });
  assert.equal(after.changes.length, 2);
});

test('checkLinkBox: known tokens pass, unknown ones name the list, menus stay absolute', () => {
  assert.equal(checkLinkBox('{giving}'), true);
  assert.equal(checkLinkBox(''), true);
  assert.equal(checkLinkBox(undefined), true);
  assert.equal(checkLinkBox('https://example.com'), true);
  assert.equal(checkLinkBox('/visit'), true);
  assert.match(String(checkLinkBox('{givng}')), /Unknown link placeholder.*\{giving\}/);
  assert.equal(checkLinkBox('{giving}', true), true);
  assert.equal(checkLinkBox('https://example.com', true), true);
  assert.match(String(checkLinkBox('/visit', true)), /full address/);
});

test('isYouTubeUrl', () => {
  assert.equal(isYouTubeUrl('https://www.youtube.com/@FbcmuncieOrg/streams'), true);
  assert.equal(isYouTubeUrl('https://youtu.be/abc'), true);
  assert.equal(isYouTubeUrl('https://m.youtube.com/watch?v=x'), true);
  assert.equal(isYouTubeUrl(`${CC}/channels/4999`), false);
  assert.equal(isYouTubeUrl('/contact'), false);
  assert.equal(isYouTubeUrl(null), false);
});

test('the fallback is the church’s own contact page', () => {
  assert.equal(LINK_FALLBACK, '/contact');
});
