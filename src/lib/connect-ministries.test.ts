// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyConnectPlan,
  contactName,
  pageSetPatch,
  planConnectMinistries,
} from './connect-ministries.ts';

// Blocks in the exact shape scripts/lib/page-copy.mjs wrote them.
const para = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}s1`, text, marks: [] }],
});
const emailLine = (key: string, who: string, email: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [{ _type: 'link', _key: `${key}l1`, href: `mailto:${email}` }],
  children: [
    { _type: 'span', _key: `${key}s1`, text: `${who}, `, marks: [] },
    { _type: 'span', _key: `${key}s2`, text: email, marks: [`${key}l1`] },
  ],
});
const officeLine = (key: string, who: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [{ _type: 'link', _key: `${key}l1`, href: '/contact' }],
  children: [
    { _type: 'span', _key: `${key}s1`, text: `${who}. `, marks: [] },
    { _type: 'span', _key: `${key}s2`, text: 'Contact the church office', marks: [`${key}l1`] },
    { _type: 'span', _key: `${key}s3`, text: '.', marks: [] },
  ],
});

const staff = [
  {
    _id: 'staff-a',
    _type: 'staffMember',
    name: 'Ann Able',
    role: 'Worship Director',
    email: 'a@x.org',
  },
  {
    _id: 'staff-b',
    _type: 'staffMember',
    name: 'Bob Best',
    role: 'Worship Coordinator',
    email: 'b@x.org',
  },
  { _id: 'staff-c', _type: 'staffMember', name: 'Cal Cole', role: 'Children Coordinator' },
  {
    _id: 'staff-d',
    _type: 'staffMember',
    name: 'Dee Dunn',
    role: 'Youth Coordinator',
    email: 'd@x.org',
  },
  {
    _id: 'staff-e',
    _type: 'staffMember',
    name: 'Eve East',
    role: 'Adult Coordinator',
    email: 'e@x.org',
  },
  {
    _id: 'staff-f',
    _type: 'staffMember',
    name: 'Fay Fox',
    role: 'Outreach Coordinator',
    email: 'f@x.org',
  },
];
const photo = (id: string) => ({
  _type: 'image',
  alt: `Photo ${id}`,
  asset: { _type: 'reference', _ref: id },
});
const oldPhoto = (id: string) => ({ _type: 'image', asset: { _type: 'reference', _ref: id } });

const imageBand = (key: string, anchor: string, side: string, body: object[]) => ({
  _type: 'imageTextSection',
  _key: `ministries-${key}`,
  anchor: { _type: 'slug', current: anchor },
  image: photo(`image-${key}-1600x900-jpg`),
  imageSide: side,
  eyebrow: key.toUpperCase(),
  heading: `All about ${key}`,
  body,
});
const textBand = (key: string, body: object[]) => ({
  _type: 'richTextSection',
  _key: `ministries-${key}`,
  anchor: { _type: 'slug', current: key },
  eyebrow: key.toUpperCase(),
  heading: `All about ${key}`,
  body,
});

function fixture() {
  const page = {
    _id: 'page-ministries',
    _type: 'page',
    _rev: 'rev-page',
    pageBuilder: [
      { _type: 'heroSection', _key: 'ministries-hero' },
      imageBand('worship', 'worship', 'right', [
        para('w1', 'We sing.'),
        emailLine('w2', 'Ann Able, Worship Director', 'a@x.org'),
        emailLine('w3', 'Bob Best, Worship Coordinator', 'b@x.org'),
      ]),
      imageBand('children', 'children', 'left', [
        para('c1', 'We play.'),
        officeLine('c2', 'Cal Cole, Children Coordinator'),
      ]),
      { _type: 'faqSection', _key: 'ministries-children-faq' },
      imageBand('youth', 'youth', 'right', [
        para('y1', 'We meet at 10:45 am.'),
        emailLine('y2', 'Dee Dunn, Youth Coordinator', 'd@x.org'),
      ]),
      textBand('adult', [
        para('a1', 'We study.'),
        emailLine('a2', 'Eve East, Adult Coordinator', 'e@x.org'),
      ]),
      textBand('outreach', [
        para('o1', 'We serve.'),
        emailLine('o2', 'Fay Fox, Outreach Coordinator', 'f@x.org'),
      ]),
    ],
  };
  const ministries = ['worship', 'children', 'youth', 'adult', 'outreach'].map((slug) => ({
    _id: `ministry-${slug}`,
    _type: 'ministry',
    _rev: `rev-${slug}`,
    title: slug,
    slug: { _type: 'slug', current: slug },
    body: [para('old', 'Old Wix text.')],
    image: oldPhoto(`image-old-${slug}-100x50-jpg`),
    order: 10,
  }));
  return { page, ministries, staff, settings: { serviceTime: 'Sundays at 10:45 am' } };
}

test('contactName reads both typed forms, and nothing else', () => {
  assert.equal(contactName(emailLine('k', 'Ann Able, Worship Director', 'a@x.org')), 'Ann Able');
  assert.equal(contactName(officeLine('k', 'Cal Cole, Children Coordinator')), 'Cal Cole');
  assert.equal(contactName(para('k', 'Ann Able, Worship Director, a@x.org')), null);
  assert.equal(
    contactName({ ...emailLine('k', 'Ann Able, Director', 'a@x.org'), listItem: 'bullet' }),
    null,
  );
  assert.equal(
    contactName({ ...emailLine('k', 'Ann Able, Director', 'a@x.org'), style: 'h3' }),
    null,
  );
});

test('the plan moves every band, keeps its key, anchor and side, and leaves the rest alone', () => {
  const input = fixture();
  const plan = planConnectMinistries(input);
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.bands.length, 5);
  const worship = plan.bands.find((b) => b.bandKey === 'ministries-worship')?.band;
  assert.deepEqual(worship, {
    _type: 'ministrySection',
    _key: 'ministries-worship',
    ministry: { _type: 'reference', _ref: 'ministry-worship' },
    imageSide: 'right',
    anchor: { _type: 'slug', current: 'worship' },
  });
  const adult = plan.bands.find((b) => b.bandKey === 'ministries-adult')?.band;
  assert.equal('imageSide' in (adult ?? {}), false);
  assert.deepEqual(Object.keys(pageSetPatch(plan)), [
    'pageBuilder[_key=="ministries-worship"]',
    'pageBuilder[_key=="ministries-children"]',
    'pageBuilder[_key=="ministries-youth"]',
    'pageBuilder[_key=="ministries-adult"]',
    'pageBuilder[_key=="ministries-outreach"]',
  ]);
});

test('the ministry gets the band text WITHOUT its contact lines, and the people as references', () => {
  const plan = planConnectMinistries(fixture());
  const worship = plan.ministries.find((m) => m.id === 'ministry-worship');
  assert.deepEqual(
    (worship?.set.body as { _key: string }[]).map((b) => b._key),
    ['w1'],
  );
  assert.deepEqual(worship?.set.contacts, [
    { _type: 'reference', _ref: 'staff-a', _key: 'contact-staff-a' },
    { _type: 'reference', _ref: 'staff-b', _key: 'contact-staff-b' },
  ]);
  assert.equal(worship?.set.eyebrow, 'WORSHIP');
  assert.equal(worship?.set.headline, 'All about worship');
  assert.equal(worship?.oldBodyBlocks, 1);
});

test('photos: an image band replaces the old photo, a text band unsets it, and both are reported', () => {
  const plan = planConnectMinistries(fixture());
  const worship = plan.ministries.find((m) => m.id === 'ministry-worship');
  assert.deepEqual(worship?.set.image, photo('image-worship-1600x900-jpg'));
  assert.deepEqual(worship?.unset, []);
  assert.deepEqual(worship?.droppedImage, oldPhoto('image-old-worship-100x50-jpg'));
  const adult = plan.ministries.find((m) => m.id === 'ministry-adult');
  assert.equal('image' in (adult?.set ?? {}), false);
  assert.deepEqual(adult?.unset, ['image']);
  assert.deepEqual(adult?.droppedImage, oldPhoto('image-old-adult-100x50-jpg'));
});

test('typed Site settings copies become placeholders on the way in', () => {
  const plan = planConnectMinistries(fixture());
  const youth = plan.ministries.find((m) => m.id === 'ministry-youth');
  const text = (youth?.set.body as { children: { text: string }[] }[])[0].children[0].text;
  assert.equal(text, 'We meet at {time}.');
  assert.equal(youth?.placeholderChanges, 1);
});

test('a contact name that matches no one, or two people, stops the plan', () => {
  const none = fixture();
  none.staff = staff.filter((s) => s._id !== 'staff-d');
  assert.match(planConnectMinistries(none).errors.join('\n'), /"Dee Dunn" matches 0 staff members/);

  const two = fixture();
  two.staff = [...staff, { ...staff[3], _id: 'staff-d2' }];
  assert.match(planConnectMinistries(two).errors.join('\n'), /"Dee Dunn" matches 2 staff members/);
});

test('a contact line the build would not reproduce stops the plan', () => {
  const input = fixture();
  // The staff document's role changed since the page was seeded.
  input.staff = staff.map((s) => (s._id === 'staff-e' ? { ...s, role: 'Adult Ministries' } : s));
  assert.match(planConnectMinistries(input).errors.join('\n'), /would not match the page/);
  // And a person hidden from the site would silently vanish, so that stops it too.
  const hidden = fixture();
  hidden.staff = staff.map((s) => (s._id === 'staff-f' ? { ...s, showOnSite: false } : s));
  assert.match(planConnectMinistries(hidden).errors.join('\n'), /hidden from the site/);
});

test('a missing band, a stray field or a wrong anchor stops the plan', () => {
  const missing = fixture();
  missing.page.pageBuilder = missing.page.pageBuilder.filter((b) => b._key !== 'ministries-youth');
  assert.match(
    planConnectMinistries(missing).errors.join('\n'),
    /no band with _key "ministries-youth"/,
  );

  const stray = fixture();
  (stray.page.pageBuilder[1] as Record<string, unknown>).cta = { label: 'Go' };
  assert.match(planConnectMinistries(stray).errors.join('\n'), /carries cta/);

  const anchor = fixture();
  (anchor.page.pageBuilder[2] as { anchor: { current: string } }).anchor.current = 'kids';
  assert.match(planConnectMinistries(anchor).errors.join('\n'), /jumps to "#kids"/);

  assert.match(planConnectMinistries({ ...fixture(), page: null }).errors[0], /missing/);
});

test('applying the plan is pure, and a second plan over the result has nothing to do', () => {
  const input = fixture();
  const plan = planConnectMinistries(input);
  const docs = [input.page, ...input.ministries, ...input.staff];
  const before = JSON.stringify(docs);
  const after = applyConnectPlan(docs, plan);
  assert.equal(JSON.stringify(docs), before, 'the input was mutated');

  const page = after.find((d) => d._id === 'page-ministries') as typeof input.page;
  assert.deepEqual(
    page.pageBuilder.map((b) => b._type),
    [
      'heroSection',
      'ministrySection',
      'ministrySection',
      'faqSection',
      'ministrySection',
      'ministrySection',
      'ministrySection',
    ],
  );
  const adult = after.find((d) => d._id === 'ministry-adult') as Record<string, unknown>;
  assert.equal('image' in adult, false);

  const again = planConnectMinistries({
    ...input,
    page,
    ministries: after.filter((d) => d._type === 'ministry'),
  });
  assert.deepEqual(again.errors, []);
  assert.equal(again.bands.length, 0);
  assert.equal(again.alreadyConnected.length, 5);
});
