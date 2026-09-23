// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTACT_OFFICE_HREF,
  contactBlock,
  contactBlocks,
  ministryBandAs,
  resolveMinistryBands,
} from './ministry-band.ts';
import type { PageBuilderBlock, ProjectedMinistrySection } from './pageBuilder.types';

const molly = {
  _id: 'staff-molly-flodder',
  name: 'Molly Flodder',
  role: 'Worship Coordinator',
  email: 'worship@fbcmuncie.org',
};
const jaden = {
  _id: 'staff-jaden-johnson',
  name: 'Jaden Johnson',
  role: "Children's Ministry Coordinator",
};

const plain = (block: { children: { text: string }[] } | null) =>
  block ? block.children.map((c) => c.text).join('') : null;

test('a person with an email gets "Name, Role, email" with the address linked', () => {
  const block = contactBlock(molly, 'k');
  assert.equal(plain(block), 'Molly Flodder, Worship Coordinator, worship@fbcmuncie.org');
  // The exact span split the page seed typed: text, then the linked address.
  assert.deepEqual(
    block?.children.map((c) => [c.text, c.marks]),
    [
      ['Molly Flodder, Worship Coordinator, ', []],
      ['worship@fbcmuncie.org', ['kl1']],
    ],
  );
  assert.deepEqual(block?.markDefs, [
    { _type: 'link', _key: 'kl1', href: 'mailto:worship@fbcmuncie.org' },
  ]);
  assert.equal(block?.style, 'normal');
});

test('a person with no email is sent to the contact page, full stop after the link', () => {
  const block = contactBlock(jaden, 'k');
  assert.equal(
    plain(block),
    "Jaden Johnson, Children's Ministry Coordinator. Contact the church office.",
  );
  assert.deepEqual(
    block?.children.map((c) => [c.text, c.marks]),
    [
      ["Jaden Johnson, Children's Ministry Coordinator. ", []],
      ['Contact the church office', ['kl1']],
      ['.', []],
    ],
  );
  assert.equal(block?.markDefs[0].href, CONTACT_OFFICE_HREF);
});

test('a blank email counts as no email', () => {
  assert.equal(contactBlock({ ...molly, email: '  ' }, 'k')?.markDefs[0].href, '/contact');
});

test('a person hidden from the site, or with no name, is not listed', () => {
  assert.equal(contactBlock({ ...molly, showOnSite: false }, 'k'), null);
  assert.equal(contactBlock({ ...molly, name: '' }, 'k'), null);
  assert.equal(contactBlock(null, 'k'), null);
  // showOnSite unset MEANS shown, the same rule the staff grid uses.
  assert.notEqual(contactBlock({ ...molly, showOnSite: null }, 'k'), null);
});

test('the mailto target is cleaned of a preview stega payload, the visible text is not', () => {
  // U+200B / U+200C runs are what stega appends; four or more is a run.
  const stega = String.fromCharCode(0x200b, 0x200c, 0x200b, 0x200c, 0x200b, 0x200c);
  const block = contactBlock({ ...molly, email: `worship@fbcmuncie.org${stega}` }, 'k');
  assert.equal(block?.markDefs[0].href, 'mailto:worship@fbcmuncie.org');
  assert.equal(block?.children[1].text, `worship@fbcmuncie.org${stega}`);
});

test('contactBlocks keeps document order, skips dangling references and unique-keys each line', () => {
  const blocks = contactBlocks([molly, null, { ...jaden, showOnSite: false }, jaden]);
  assert.deepEqual(blocks.map(plain), [
    'Molly Flodder, Worship Coordinator, worship@fbcmuncie.org',
    "Jaden Johnson, Children's Ministry Coordinator. Contact the church office.",
  ]);
  assert.deepEqual(
    blocks.map((b) => b._key),
    ['contact-staff-molly-flodder', 'contact-staff-jaden-johnson'],
  );
  assert.deepEqual(contactBlocks(undefined), []);
});

const para = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}s1`, text, marks: [] }],
});

const band = (
  ministry: ProjectedMinistrySection['ministry'],
  extra = {},
): ProjectedMinistrySection => ({
  _type: 'ministrySection',
  _key: 'ministries-worship',
  anchor: { current: 'worship' },
  ministry,
  ...extra,
});

test('a ministry with a photo draws as an image band, contact lines after its text', () => {
  const image = { _type: 'image' as const, asset: { _ref: 'image-a-1600x900-jpg' }, alt: 'Bells' };
  const out = ministryBandAs(
    band(
      {
        title: 'Worship',
        eyebrow: 'Worship arts',
        headline: 'Praise team',
        body: [para('a', 'One.')],
        image,
        contacts: [molly],
      },
      { imageSide: 'right' },
    ),
  );
  assert.equal(out?._type, 'imageTextSection');
  assert.equal(out?._key, 'ministries-worship');
  assert.deepEqual(out?.anchor, { current: 'worship' });
  assert.equal((out as { imageSide?: string }).imageSide, 'right');
  assert.equal(out?.eyebrow, 'Worship arts');
  assert.equal(out?.heading, 'Praise team');
  assert.equal((out as { image?: unknown }).image, image);
  const body = out?.body as { _key: string }[];
  assert.deepEqual(
    body.map((b) => b._key),
    ['a', 'contact-staff-molly-flodder'],
  );
});

test('a ministry with no photo draws as a text band, with no photo side', () => {
  const out = ministryBandAs(
    band(
      { title: 'Adult', eyebrow: 'Adults', headline: 'Classes', body: [], contacts: [] },
      {
        imageSide: 'right',
      },
    ),
  );
  assert.equal(out?._type, 'richTextSection');
  assert.equal('imageSide' in (out ?? {}), false);
  assert.equal(out?.heading, 'Classes');
});

test('an image with no asset is no photo, and the side defaults to left', () => {
  const out = ministryBandAs(band({ title: 'Youth', image: { _type: 'image', asset: null } }));
  assert.equal(out?._type, 'richTextSection');
  const withPhoto = ministryBandAs(
    band({ title: 'Youth', image: { _type: 'image', asset: { _ref: 'image-b-10x5-jpg' } } }),
  );
  assert.equal((withPhoto as { imageSide?: string }).imageSide, 'left');
});

test('no headline falls back to the name; nulls become absent props', () => {
  const out = ministryBandAs(band({ title: 'Outreach', headline: null, eyebrow: null }));
  assert.equal(out?.heading, 'Outreach');
  assert.equal(out?.eyebrow, undefined);
});

test('a band pointing at nothing draws nothing, and other blocks pass through in order', () => {
  const hero = { _type: 'heroSection', _key: 'h', headline: 'Hi' } as unknown as PageBuilderBlock;
  const faq = { _type: 'faqSection', _key: 'f' } as unknown as PageBuilderBlock;
  const out = resolveMinistryBands([
    hero,
    band(null),
    band({ title: 'Youth', body: [] }),
    faq,
  ] as PageBuilderBlock[]);
  assert.deepEqual(
    out.map((b) => b._type),
    ['heroSection', 'richTextSection', 'faqSection'],
  );
  assert.equal(out[0], hero);
  assert.deepEqual(resolveMinistryBands(undefined), []);
});
