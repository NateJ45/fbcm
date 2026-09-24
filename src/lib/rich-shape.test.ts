import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRichText, isLedeParagraph, type RichPiece } from './rich-shape.ts';
import type { PtBlock } from './span-split.ts';

let n = 0;
const span = (text: string) => ({ _type: 'span' as const, _key: `s${n++}`, text, marks: [] });
const p = (text: string): PtBlock => ({
  _type: 'block',
  _key: `b${n++}`,
  style: 'normal',
  markDefs: [],
  children: [span(text)],
});
const h3 = (text: string): PtBlock => ({ ...p(text), style: 'h3' });
const h4 = (text: string): PtBlock => ({ ...p(text), style: 'h4' });
const li = (text: string): PtBlock => ({ ...p(text), listItem: 'bullet', level: 1 });
const words = (k: number, w = 'word') => Array.from({ length: k }, () => w).join(' ') + '.';
const kinds = (ps: RichPiece[]) => ps.map((x) => x.kind);

test('an empty or missing body is a prose shape with no pieces', () => {
  assert.deepEqual(classifyRichText(undefined, { hasHead: true }), {
    shape: 'prose',
    continuation: false,
    pieces: [],
  });
  assert.deepEqual(classifyRichText([], { hasHead: false }).pieces, []);
});

test('ROW: a headed band of up to three paragraphs and 80 words', () => {
  const out = classifyRichText(
    [p('We give sacrificially to help those in need.'), p('Special offerings and projects.')],
    { hasHead: true },
  );
  assert.equal(out.shape, 'row');
  assert.equal(out.rowLong, false);
  assert.deepEqual(kinds(out.pieces), ['measure']);
});

test('ROW never applies to a headingless band', () => {
  const out = classifyRichText([p('Short.')], { hasHead: false });
  assert.equal(out.shape, 'prose');
  assert.equal(out.continuation, true);
});

test('COLUMNS: four paragraph-only h3 groups go four across, with run-ins', () => {
  const body = [
    h3('Worship'),
    p(words(20)),
    p('Following God’s Word - Our times of worship are rooted in scripture.'),
    h3('The Way'),
    p(words(37)),
    p('Caring Mentorship - Each regular attendee is connected with a deacon.'),
    h3('Witness'),
    p(words(25)),
    h3('Work'),
    p(words(20)),
    p('Serve - We actively help.'),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'columns');
  const cols = out.pieces.find((x) => x.kind === 'columns');
  assert.ok(cols && cols.kind === 'columns');
  assert.equal(cols.across, 4);
  const firstGroupParas = cols.groups[0].pieces.flatMap((x) =>
    x.kind === 'measure' ? x.paras : [],
  );
  assert.equal(firstGroupParas[1].label, 'Following God’s Word');
});

test('run-in needs at least two matching paragraphs in the band', () => {
  const out = classifyRichText([p('Next Week - We Meet at six.'), p(words(30))], { hasHead: true });
  const paras = out.pieces.flatMap((x) => (x.kind === 'measure' ? x.paras : []));
  assert.ok(paras.every((x) => x.label === null));
});

test('columns: seven groups go four across, six go three across', () => {
  const g = (k: number) => Array.from({ length: k }, (_, i) => [h3(`G${i}`), p(words(10))]).flat();
  const seven = classifyRichText(g(7), { hasHead: true }).pieces.find((x) => x.kind === 'columns');
  const six = classifyRichText(g(6), { hasHead: true }).pieces.find((x) => x.kind === 'columns');
  assert.equal(seven && seven.kind === 'columns' && seven.across, 4);
  assert.equal(six && six.kind === 'columns' && six.across, 3);
});

test('SECTIONS: one h3, or groups over 150 words, or a list inside a group', () => {
  assert.equal(classifyRichText([h3('Only'), p(words(30))], { hasHead: true }).shape, 'sections');
  assert.equal(
    classifyRichText([h3('A'), p(words(160)), h3('B'), p(words(20))], { hasHead: true }).shape,
    'sections',
  );
});

test('REGISTER: eight or more paragraphs, 80% of them 35 words or fewer (the creed)', () => {
  const body = [
    p('There is One Triune God revealed to us as Father, Son, & Holy Spirit.'),
    li('God is Love.'),
    li('God is Spirit.'),
    li('God is Holy.'),
    ...Array.from({ length: 12 }, (_, i) => p(`Statement number ${i} is short.`)),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'register');
  const reg = out.pieces.find((x) => x.kind === 'register');
  assert.ok(reg && reg.kind === 'register');
  // the triad rides inside the first cell, read down then across
  assert.equal(reg.left[0].map((x) => x.kind).join(','), 'measure,triad');
  assert.equal(reg.left.length, Math.ceil(13 / 2));
});

test('LEDGER + SAID: the covenant hangs its shared "To"', () => {
  const body = [
    p(
      'We, the members of this church, through the grace of God, humbly and solemnly undertake with His aid:',
    ),
    li('To attend the worship and services of this church regularly.'),
    li('To contribute cheerfully and regularly to the financial support of the work.'),
    li('To aid and assist prayerfully the minister.'),
    p(words(10)),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'ledger');
  assert.deepEqual(kinds(out.pieces), ['lede', 'said', 'measure']);
  const said = out.pieces[1];
  assert.ok(said.kind === 'said');
  assert.equal(said.prefix, 'To');
  assert.equal(said.hang, true);
  assert.equal(
    said.items[0].children![0].text,
    'attend the worship and services of this church regularly.',
  );
});

test('a two-item list with a shared one-word prefix is PLAIN, not SAID', () => {
  const out = classifyRichText(
    [
      p(words(20)),
      li('The nursery is in room 104 on the first floor.'),
      li('The kids center is on the lower level near the hall.'),
    ],
    { hasHead: true },
  );
  assert.ok(out.pieces.some((x) => x.kind === 'plain'));
  assert.ok(!out.pieces.some((x) => x.kind === 'said'));
});

test('TABLE: half or more items carry " | "', () => {
  const out = classifyRichText(
    [
      h3('Life Groups'),
      li('Charis | For college students.'),
      li('Snowbirds | Locations vary.'),
      li('Loose item'),
    ],
    { hasHead: true },
  );
  const sec = out.pieces.find((x) => x.kind === 'section');
  assert.ok(sec && sec.kind === 'section');
  const table = sec.pieces.find((x) => x.kind === 'table');
  assert.ok(table && table.kind === 'table');
  assert.deepEqual(
    table.rows.map((r) => r.name),
    ['Charis', 'Snowbirds', null],
  );
});

test('INDEX: ten one-line items; TRIAD: up to four short items', () => {
  const ten = [
    'Birth Announcement',
    'Notification of Death',
    'Special Birthday',
    'Special Anniversary',
    'Engagement Announcement',
    'Retirement',
    'Hospital Admission',
    'Graduation',
    'Decision of Faith',
    'Address Change',
  ].map(li);
  assert.ok(
    classifyRichText([p(words(20)), ...ten], { hasHead: true }).pieces.some(
      (x) => x.kind === 'index',
    ),
  );
  const three = [li('Exterior Building'), li('Fellowship Hall'), li('Kitchen')];
  assert.ok(
    classifyRichText([p(words(80)), ...three, p(words(30))], { hasHead: true }).pieces.some(
      (x) => x.kind === 'triad',
    ),
  );
});

test('long prose is one reading measure, never newspaper columns (rollout rule 11)', () => {
  const two = classifyRichText([p(words(120)), p(words(120))], { hasHead: false });
  assert.deepEqual(kinds(two.pieces), ['measure']);
  const essay = Array.from({ length: 9 }, () => p(words(100)));
  const long = classifyRichText(essay, { hasHead: false });
  assert.deepEqual(kinds(long.pieces), ['measure']);
  assert.equal(long.pieces[0].kind === 'measure' && long.pieces[0].paras.length, 9);
});

test('narrow: beside a picture, prose is always one measure and columns are one across', () => {
  const out = classifyRichText([p(words(120)), p(words(120)), p(words(120))], {
    hasHead: true,
    narrow: true,
  });
  assert.ok(out.pieces.every((x) => x.kind === 'measure' || x.kind === 'lede'));
});

test('STANDFIRST is all or none across a band’s h3 groups', () => {
  const yes = classifyRichText(
    [
      h3('A'),
      p('A short summary sentence.'),
      p(words(200)),
      h3('B'),
      p('Another short summary.'),
      p(words(200)),
    ],
    { hasHead: false },
  );
  const sectionKinds = yes.pieces.flatMap((x) => (x.kind === 'section' ? kinds(x.pieces) : []));
  assert.equal(sectionKinds.filter((k) => k === 'standfirst').length, 2);
  const no = classifyRichText(
    [h3('A'), p('Short summary.'), p(words(200)), h3('B'), p(words(37)), p(words(200))],
    { hasHead: false },
  );
  assert.ok(
    !no.pieces.some((x) => x.kind === 'section' && x.pieces.some((y) => y.kind === 'standfirst')),
  );
});

test('FOOT: a short last paragraph after groups becomes a closing row', () => {
  const out = classifyRichText(
    [
      h3('A'),
      p(words(40)),
      h4('X'),
      p(words(10)),
      h4('Y'),
      p(words(10)),
      p('Cheryl Flaherty, Adult Coordinator.'),
    ],
    { hasHead: true },
  );
  assert.equal(out.pieces.at(-1)?.kind, 'foot');
});

test('pullFoot measures cleaned text: a stega-only span does not defeat the link-line check', () => {
  const S = '​‌‍﻿​‌‍﻿';
  const marked = (t: string) => ({
    _type: 'span' as const,
    _key: `s${n++}`,
    text: t,
    marks: ['link'],
  });
  const plain = (t: string) => ({ _type: 'span' as const, _key: `s${n++}`, text: t, marks: [] });
  const linkLine = (withStegaSpan: boolean): PtBlock => ({
    _type: 'block',
    _key: `b${n++}`,
    style: 'normal',
    markDefs: [],
    children: withStegaSpan ? [marked('fbcmuncie.org'), plain(S)] : [marked('fbcmuncie.org')],
  });
  const body = (withStegaSpan: boolean) => [p(words(20)), linkLine(withStegaSpan)];
  const clean = classifyRichText(body(false), { hasHead: false });
  const stega = classifyRichText(body(true), { hasHead: false });
  assert.equal(clean.pieces.at(-1)?.kind, 'foot');
  assert.equal(stega.pieces.at(-1)?.kind, 'foot');
});

test('narrow: true forces columns to one across', () => {
  const body = [h3('A'), p(words(20)), h3('B'), p(words(20))];
  const out = classifyRichText(body, { hasHead: true, narrow: true });
  assert.equal(out.shape, 'columns');
  const cols = out.pieces.find((x) => x.kind === 'columns');
  assert.ok(cols && cols.kind === 'columns');
  assert.equal(cols.across, 1);
});

test('a headingless single list with no paragraphs classifies without throwing', () => {
  const out = classifyRichText([li('Exterior Building'), li('Fellowship Hall'), li('Kitchen')], {
    hasHead: false,
  });
  assert.equal(out.shape, 'ledger');
  assert.deepEqual(kinds(out.pieces), ['triad']);
});

test('isLedeParagraph: 8 to 40 words, ends a sentence, not the first of exactly two', () => {
  assert.equal(
    isLedeParagraph(p('At each entrance, all ages are invited to check-in with a greeter.'), 1, 2),
    true,
  );
  assert.equal(isLedeParagraph(p('Nursery Care (104)'), 3, 4), false); // label, no sentence end
  assert.equal(isLedeParagraph(p(words(43)), 3, 4), false); // too long
  assert.equal(isLedeParagraph(p(words(12)), 2, 2), false); // first of two
  assert.equal(isLedeParagraph(p(words(12)), 1, 0), false); // nothing after it
});

test('a stega-encoded covenant classifies exactly like a clean one', () => {
  const S = '​‌‍﻿​‌‍﻿';
  const mk = (s: string) => [
    p('We undertake with His aid:' + S),
    li(`To attend ${s}.` + S),
    li(`To give ${s}.` + S),
    li(`To aid ${s}.` + S),
  ];
  const a = classifyRichText(mk('regularly and well in all things'), { hasHead: true });
  const b = classifyRichText(
    mk('regularly and well in all things').map((x) => ({
      ...x,
      children: x.children!.map((c) => ({ ...c, text: c.text.replace(/[​-‍﻿]/g, '') })),
    })),
    { hasHead: true },
  );
  assert.deepEqual(kinds(a.pieces), kinds(b.pieces));
  const said = a.pieces.find((x) => x.kind === 'said');
  assert.ok(said && said.kind === 'said');
  assert.ok(said.items[0].children![0].text.endsWith(S), 'the payload stays on the tail');
});

test('SECTIONS: a one-paragraph intro before the h3 groups is a lede (ministries, Adults band)', () => {
  // The live Adults band on /ministries opens with one 36-word sentence and
  // then its h3 sections. The prototype sets that sentence as a lede; the h3
  // groups that follow count as "something after it".
  const body = [
    p(
      "From College and Career to Retirees, FBCM's Adult Ministry aims to engage adults of all ages in intentional discipleship so we may follow Jesus and become more like him - full of grace and truth.",
    ),
    h3('Sunday morning'),
    p(words(20)),
    li(words(12)),
    li(words(9)),
    h3('Life Groups'),
    p(words(30)),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'sections');
  assert.equal(out.pieces[0].kind, 'lede');
  // A headingless band never takes a lede, whatever follows.
  assert.notEqual(classifyRichText(body, { hasHead: false }).pieces[0].kind, 'lede');
});

// ---------- wide: the photo GROUND's body (opt-in, ImageText only) ----------
// The prototype's ground flow (photos/index.html, flow(body, { wide: true })):
// a short unpunctuated paragraph followed by a real one is a LABELLED row, and
// a run of 2+ paragraphs up to 180 words is a two-column set.
const visitChildren = () => [
  p('Nursery Care (104)'),
  p('For children ages 3 and younger, nursery care is available throughout the service.'),
  p('Family Room (105)'),
  p(
    'For little ones and parents who need to step out during service, this room provides toys, a live stream, rocking chairs, nursing privacy, and a changing table for all who desire it.',
  ),
  p("Children's Church (B-03 & 102)"),
  p("Students preschool - fifth grade will be dismissed to Children's Church during the service."),
  p('There are two classes.'),
  p("Preschool - 2nd grade: Kickstart Children's Church (102)"),
  p("3rd - 5th grade: The Underground Children's Church (B-03)"),
];
const labelled = (ps: RichPiece[]) =>
  ps.find((x): x is Extract<RichPiece, { kind: 'labelled' }> => x.kind === 'labelled');
const txt = (b: PtBlock) => (b.children ?? []).map((c) => c.text).join('');

test('wide: label/description pairs become labelled rows, each label beside its own text', () => {
  const body = visitChildren();
  const out = classifyRichText(body, { hasHead: false, wide: true });
  assert.notEqual(out.shape, 'register');
  assert.deepEqual(kinds(out.pieces), ['labelled']);
  const rows = labelled(out.pieces)!.rows;
  assert.deepEqual(
    rows.map((r) => txt(r.label)),
    ['Nursery Care (104)', 'Family Room (105)', "Children's Church (B-03 & 102)"],
  );
  // the label keeps its BLOCK (click-to-edit in the preview), not a string
  assert.equal(rows[0].label, body[0]);
  assert.deepEqual(
    rows.map((r) => r.body.length),
    [1, 1, 4],
  );
  assert.equal(rows[0].body[0], body[1]);
});

test('wide: a short paragraph WITH terminal punctuation is not a label', () => {
  // control: the same paragraph without the punctuation IS a label
  const ok = classifyRichText([p('Nursery care'), p(words(12)), p(words(12))], {
    hasHead: false,
    wide: true,
  });
  assert.equal(labelled(ok.pieces)?.rows.length, 1);
  for (const end of ['.', ':', '!', '?', ',', ';']) {
    const out = classifyRichText([p(`Nursery care${end}`), p(words(12)), p(words(12))], {
      hasHead: false,
      wide: true,
    });
    assert.equal(labelled(out.pieces), undefined, `label ending "${end}"`);
  }
});

test('wide: a trailing label with no description is not a row', () => {
  const out = classifyRichText([p(words(20)), p(words(20)), p('Contact the office')], {
    hasHead: false,
    wide: true,
  });
  assert.equal(labelled(out.pieces), undefined);
  const out2 = classifyRichText([p('Family Room'), p(words(10)), p('Nursery Care')], {
    hasHead: false,
    wide: true,
  });
  const rows = labelled(out2.pieces)!.rows;
  assert.deepEqual(
    rows.map((r) => txt(r.label)),
    ['Family Room'],
  );
});

test('wide: prose between labels is one measure, short or long (rule 11)', () => {
  const at = (a: number, b: number) =>
    kinds(classifyRichText([p(words(a)), p(words(b))], { hasHead: false, wide: true }).pieces);
  assert.deepEqual(at(90, 90), ['measure']);
  assert.deepEqual(at(90, 91), ['measure']);
  // one paragraph is never a set
  assert.deepEqual(kinds(classifyRichText([p(words(40))], { hasHead: false, wide: true }).pieces), [
    'measure',
  ]);
});

test('wide absent (or false) leaves the existing outputs unchanged', () => {
  const covenant = [
    p(
      'We, the members of this church, through the grace of God, humbly and solemnly undertake with His aid:',
    ),
    li('To attend the worship and services of this church regularly.'),
    li('To contribute cheerfully and regularly to the financial support of the work.'),
    li('To aid and assist prayerfully the minister.'),
    p(words(10)),
  ];
  const lifeGroups = [
    h3('Life Groups'),
    li('Charis | For college students.'),
    li('Snowbirds | Locations vary.'),
    li('Loose item'),
  ];
  const register = visitChildren();
  const cases: [PtBlock[], boolean, string, string[]][] = [
    [covenant, true, 'ledger', ['lede', 'said', 'measure']],
    [lifeGroups, true, 'sections', ['section']],
    [register, false, 'register', ['register']],
    [register, true, 'register', ['register']],
  ];
  for (const [body, hasHead, shape, ks] of cases) {
    const base = classifyRichText(body, { hasHead });
    assert.equal(base.shape, shape);
    assert.deepEqual(kinds(base.pieces), ks);
    assert.deepEqual(classifyRichText(body, { hasHead, wide: false }), base);
    assert.deepEqual(classifyRichText(body, { hasHead, narrow: false }), base);
  }
});

// ---------- the rest of proseBody: h2, blockquote, numbered lists ----------
// The Studio offers "Heading" (h2), "Quote" (blockquote) and "Numbered" lists
// in every section body; each must come out as what the editor picked.
const h2 = (text: string): PtBlock => ({ ...p(text), style: 'h2' });
const bq = (text: string): PtBlock => ({ ...p(text), style: 'blockquote' });
const num = (text: string, mark = ''): PtBlock => ({
  ...p(text),
  listItem: 'number' + mark,
  level: 1,
});
const ZW = '\u200b\u200c\u200d\ufeff\u200b\u200c\u200d\ufeff';
const allPieces = (ps: RichPiece[]): RichPiece[] =>
  ps.flatMap((x) =>
    x.kind === 'section'
      ? [x, ...allPieces(x.pieces)]
      : x.kind === 'columns'
        ? [x, ...x.groups.flatMap((g) => allPieces(g.pieces))]
        : x.kind === 'register'
          ? [x, ...[...x.left, ...x.right].flatMap(allPieces)]
          : [x],
  );

test('an h2 in the body is a section head (the band’s own heading is the h2)', () => {
  const out = classifyRichText([h2('Our history'), p(words(30))], { hasHead: true });
  assert.equal(out.shape, 'sections');
  const sect = out.pieces.find((x) => x.kind === 'section');
  assert.ok(sect && sect.kind === 'section');
  assert.equal(txt(sect.head), 'Our history');
});

test('a blockquote is its own piece and is never word-counted into prose columns', () => {
  const quote = bq(words(120, 'quoted'));
  const out = classifyRichText([p(words(120)), quote, p(words(120))], { hasHead: false });
  assert.deepEqual(kinds(out.pieces), ['measure', 'quote', 'measure']);
  const q = out.pieces[1];
  assert.ok(q.kind === 'quote');
  assert.equal(q.block, quote);
  for (const x of out.pieces)
    if (x.kind === 'measure') assert.ok(!x.paras.some((r) => r.block === quote));
});

test('a blockquote is never dropped by the ROW or REGISTER shapes', () => {
  const row = classifyRichText([p('A short line.'), bq('Be still, and know.')], { hasHead: true });
  assert.ok(allPieces(row.pieces).some((x) => x.kind === 'quote'));
  const reg = classifyRichText(
    [...Array.from({ length: 9 }, (_, i) => p(`Line ${i} is short.`)), bq('A creed line.')],
    { hasHead: true },
  );
  assert.ok(allPieces(reg.pieces).some((x) => x.kind === 'quote'));
});

test('a numbered list stays ordered', () => {
  const out = classifyRichText([p('Three steps:'), num('One'), num('Two'), num('Three')], {
    hasHead: false,
  });
  const list = allPieces(out.pieces).find((x) => x.kind === 'plain');
  assert.ok(list && list.kind === 'plain');
  assert.equal(list.ordered, true);
  assert.equal(list.items.length, 3);
  // a bullet list is not
  const bullets = classifyRichText(
    [li('Alpha ' + words(11)), li('Beta ' + words(11)), li('Gamma ' + words(11))],
    { hasHead: false },
  );
  const b = allPieces(bullets.pieces).find((x) => x.kind === 'plain');
  assert.ok(b && b.kind === 'plain');
  assert.ok(!b.ordered);
});

test('a stega-carrying listItem "number" is still ordered (listItem is not in NON_STEGA_FIELDS)', () => {
  const out = classifyRichText(
    [num('Alpha ' + words(11), ZW), num('Beta ' + words(11), ZW), num('Gamma ' + words(11), ZW)],
    { hasHead: false },
  );
  const list = allPieces(out.pieces).find((x) => x.kind === 'plain');
  assert.ok(list && list.kind === 'plain');
  assert.equal(list.ordered, true);
});

// ---------- "Small heading" (h4) with no h3 ----------
// The band's own heading is the h2, so h4 columns straight under it would skip
// a level. With no h3 in the body, h4 is promoted to h3 before shape selection.
const levels = (ps: RichPiece[]) =>
  allPieces(ps).flatMap((x) => (x.kind === 'columns' ? [x.level] : []));

test('a band with h4 and no h3 promotes its h4 groups to h3 (no skipped level)', () => {
  const out = classifyRichText(
    [p(words(20)), h4('Breakfast'), p(words(20)), h4('Lunch'), p(words(20))],
    { hasHead: true },
  );
  assert.ok(!levels(out.pieces).includes('h4'));
  assert.equal(out.shape, 'columns');
  assert.deepEqual(levels(out.pieces), ['h3']);
});

test('a band with h3 AND h4 (ministries, Adults) keeps its h4 columns', () => {
  const body = [
    p(words(36)),
    h3('Sunday morning'),
    p(words(20)),
    li('Alpha ' + words(11)),
    li('Beta ' + words(8)),
    h3('Life Groups'),
    p(words(30)),
    h3('Fellowship and other events'),
    h4('Fresh Brewed Life'),
    p(words(15)),
    h4('Church Friends Lunch'),
    p(words(12)),
    h4('Service Trips'),
    p(words(10)),
    p('Adult Coordinator'),
  ];
  const out = classifyRichText(body, { hasHead: true });
  assert.equal(out.shape, 'sections');
  // the closing contact line is the foot, as on the live page
  assert.deepEqual(kinds(out.pieces), ['lede', 'section', 'section', 'section', 'foot']);
  assert.deepEqual(levels(out.pieces), ['h4']);
  const last = out.pieces[3];
  assert.ok(last.kind === 'section');
  assert.equal(txt(last.head), 'Fellowship and other events');
});

test('columns: three or four across hold a short statement each, not 150 words (rule 11)', () => {
  const band = (n: number, w: number) =>
    classifyRichText(Array.from({ length: n }, (_, i) => [h3(`Head ${i}`), p(words(w))]).flat(), {
      hasHead: true,
    }).shape;
  assert.equal(band(2, 150), 'columns');
  assert.equal(band(4, 70), 'columns');
  // The four Baptist values, at 70 to 150 words each, are sections.
  assert.equal(band(4, 120), 'sections');
  assert.equal(band(3, 71), 'sections');
});

test('a section of reading text sets its head beside the text; one with a list does not', () => {
  const out = classifyRichText(
    [h3('Lordship of Christ'), p(words(90)), h3('Freedom to Serve'), p(words(200))],
    { hasHead: true },
  );
  const sects = out.pieces.filter((x) => x.kind === 'section');
  assert.equal(sects.length, 2);
  assert.ok(sects.every((x) => x.kind === 'section' && x.beside));
  const listed = classifyRichText(
    [h3('Full Member'), p(words(20)), li('One'), li('Two'), li('Three')],
    {
      hasHead: true,
    },
  );
  const s = listed.pieces.find((x) => x.kind === 'section');
  assert.ok(s && s.kind === 'section' && !s.beside);
  // Never beside a photo (narrow).
  const narrow = classifyRichText([h3('A'), p(words(90)), h3('B'), p(words(200))], {
    hasHead: false,
    narrow: true,
  });
  assert.ok(narrow.pieces.every((x) => x.kind !== 'section' || !x.beside));
});
