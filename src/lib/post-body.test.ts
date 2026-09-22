// scaffold-file: journal
// The post body's reading pass (post-body.ts), on fixtures shaped exactly like
// the imported Wix bodies: the Messiah programme and the Lent schedule (the only
// two tables in the 142 posts), the Messiah post's dead "Page Contents" list and
// FAQ, a sermon preview's opening, and the stega markers the Studio preview adds.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareBody,
  tableOf,
  isTableRun,
  isPoint,
  findLection,
  ledeEchoes,
  openingText,
  listenHref,
  assetRefOf,
  textOf,
  type BodyNode,
  type PTBlock,
  type JournalTable,
  type JournalPoint,
  type JournalQA,
  type JournalLection,
} from './post-body.ts';

// ── Fixture builders ────────────────────────────────────────────────────────
let k = 0;
const key = () => `k${(k += 1)}`;
type SpanSpec = string | [string, string[]];
function block(spans: SpanSpec[], extra: Partial<PTBlock> = {}): PTBlock {
  const b = key();
  return {
    _type: 'block',
    _key: b,
    style: 'normal',
    markDefs: [],
    children: spans.map((s, i) =>
      typeof s === 'string'
        ? { _type: 'span', _key: `${b}s${i}`, text: s, marks: [] }
        : { _type: 'span', _key: `${b}s${i}`, text: s[0], marks: s[1] },
    ),
    ...extra,
  };
}
const p = (text: string) => block([text]);
const bold = (text: string) => block([[text, ['strong']]]);
const li = (text: string, listItem = 'bullet') => block([text], { listItem, level: 1 });
function link(text: string, href: string, extraMarks: string[] = [], listItem?: string): PTBlock {
  const b = block([[text, ['m0', ...extraMarks]]], listItem ? { listItem, level: 1 } : {});
  b.markDefs = [{ _key: 'm0', _type: 'link', href }];
  return b;
}
const marksOf = (node: BodyNode) =>
  ((node as PTBlock).children ?? []).flatMap((c) => (c as { marks?: string[] }).marks ?? []);

// A stega run: the modern encoding's 4-character U+200B prefix plus payload.
const STEGA = [0x200b, 0x200b, 0x200b, 0x200b, 0x200c, 0x200d, 0xfeff, 0x200c, 0x200d, 0x200b]
  .map((c) => String.fromCodePoint(c))
  .join('');

// ── Tables ──────────────────────────────────────────────────────────────────

const messiahRows = [
  'Title · Type',
  '1 · Overture · John Emert, organ',
  '2 · Comfort Ye My People · tenor',
  '14 · There Were Shepherds Abiding in the Field · Tammie Huntington, soprano',
  '- · And Lo, the Angel of the Lord Came Upon Them · Tammie Huntington, soprano',
  '44 · Hallelujah · chorus',
  'Intermission · 10 minutes',
  'Seasonal Carols · chorus/audience',
];

test('the Messiah programme becomes a three-column table with a number column', () => {
  const t = tableOf(messiahRows.map((r) => li(r)));
  assert.deepEqual(t.head, ['', 'Title', 'Type'], 'the header is padded on the LEFT');
  assert.deepEqual(t.rows[0], ['1', 'Overture', 'John Emert, organ']);
  assert.deepEqual(
    t.rows[3],
    ['', 'And Lo, the Angel of the Lord Came Upon Them', 'Tammie Huntington, soprano'],
    'a lone "-" cell is empty',
  );
  assert.deepEqual(t.rows[5], ['', 'Intermission', '10 minutes']);
  assert.equal(t.numCol, true);
  assert.equal(t.rows.length, 7);
});

test('the Lent schedule becomes a two-column table with a header and no number column', () => {
  const t = tableOf(
    [
      'Date · Event',
      "Sat, March 7 · Men's Lenten Breakfast @ FBCM, 9:00 AM",
      'Sat, March 14 · Serve Your City Day, 8:30 AM',
      "Sat. April 18th · Easter Open House at The Pastors' Home",
    ].map((r) => li(r)),
  );
  assert.deepEqual(t.head, ['Date', 'Event']);
  assert.deepEqual(t.rows[0], ['Sat, March 7', "Men's Lenten Breakfast @ FBCM, 9:00 AM"]);
  assert.equal(t.numCol, false);
});

test('a first row with a digit, or with a long cell, is a body row, not a header', () => {
  const t = tableOf(
    ['Sat, March 7 · Breakfast', 'Sun, March 8 · Worship', 'Mon · Rest'].map((r) => li(r)),
  );
  assert.equal(t.head, null);
  assert.equal(t.rows.length, 3);
});

test('a table needs three items, every one carrying a middot', () => {
  assert.equal(isTableRun(['a · b', 'c · d'].map((r) => li(r))), false);
  assert.equal(isTableRun(['a · b', 'c · d', 'plain item'].map((r) => li(r))), false);
  assert.equal(isTableRun(['a · b', 'c · d', 'e · f'].map((r) => li(r))), true);
  // A middot with no spaces (a date range) is not a cell separator.
  assert.equal(isTableRun(['a·b', 'c·d', 'e·f'].map((r) => li(r))), false);
});

test('prepareBody replaces the list run with one journalTable in place', () => {
  const body = [p('Here is the programme.'), ...messiahRows.map((r) => li(r)), p('After.')];
  const out = prepareBody(body);
  assert.deepEqual(
    out.map((n) => n._type),
    ['block', 'journalTable', 'block'],
  );
  assert.equal((out[1] as JournalTable).rows.length, 7);
});

test('table cells are compared on cleaned text in the preview', () => {
  const t = tableOf(
    [`Title · Type${STEGA}`, `1 · Overture · organ${STEGA}`, `- · Chorus · all${STEGA}`].map((r) =>
      li(r),
    ),
  );
  assert.deepEqual(t.head, ['', 'Title', 'Type']);
  assert.deepEqual(t.rows[1], ['', 'Chorus', 'all']);
  assert.equal(t.numCol, true);
});

// ── Underline, dead anchors, Page Contents ──────────────────────────────────

test('the underline decorator is dropped everywhere, links and other marks kept', () => {
  const body = [
    block([
      ['Plain underlined', ['underline']],
      [' and emphasised', ['em', 'underline']],
    ]),
    link('a real link', 'https://fbcmuncie.churchcenter.com/registrations', ['underline']),
  ];
  const out = prepareBody(body);
  assert.deepEqual(marksOf(out[0]), ['em']);
  assert.deepEqual(marksOf(out[1]), ['m0']);
  assert.equal((out[1] as PTBlock).markDefs?.length, 1);
});

test('the Messiah "Page Contents" list is dropped, with its label on the paragraph before', () => {
  const intro = block([
    'Some Christmas events invite you to sit back and listen, but this is a time to join in! ',
    ['Page Contents:', ['strong']],
  ]);
  const contents = [
    link('What is the Messiah Sing-In?', '#viewer-onmrz40065', ['underline'], 'bullet'),
    link('About the soloists', '#viewer-c767a5f0-e233', ['underline'], 'bullet'),
    // "(FAQ" is the link and ")" is a separate, unlinked span.
    (() => {
      const b = link(
        'Frequently Asked Questions (FAQ',
        '#viewer-9f20e88d',
        ['underline'],
        'bullet',
      );
      b.children!.push({ _type: 'span', _key: 'x', text: ')', marks: ['underline'] });
      return b;
    })(),
  ];
  const out = prepareBody([intro, ...contents, p('What is the Messiah Sing-In?')]);
  assert.equal(out.length, 2);
  assert.equal(
    textOf(out[0]),
    'Some Christmas events invite you to sit back and listen, but this is a time to join in!',
  );
  assert.ok(!JSON.stringify(out).includes('#viewer-'));
});

test('a #viewer- link inside prose is unwrapped to plain text, and its markDef goes', () => {
  const b = link('the recommended texts', '#viewer-abc123');
  const out = prepareBody([block(['See ']), b]);
  assert.equal(textOf(out[1]), 'the recommended texts');
  assert.deepEqual(marksOf(out[1]), []);
  assert.deepEqual((out[1] as PTBlock).markDefs, []);
});

test('a list mixing dead anchors and real items is kept, with the dead links unwrapped', () => {
  const out = prepareBody([link('Jump', '#viewer-a', [], 'bullet'), li('A real item with words')]);
  assert.equal(out.length, 2);
  assert.ok(!JSON.stringify(out).includes('#viewer-'));
});

// ── Points and Q and A ──────────────────────────────────────────────────────

test('isPoint: wholly bold, short, and heading-shaped', () => {
  assert.equal(isPoint(bold('Jesus refuses to be boxed in')), true, 'no end punctuation');
  assert.equal(isPoint(bold('Who is it for?')), true, 'a question');
  assert.equal(
    isPoint(bold('3. The whole church has a responsibility to share the good news.')),
    true,
    'numbered',
  );
  assert.equal(isPoint(bold('This one is a sentence.')), false, 'a sentence is emphasis');
  assert.equal(isPoint(block([['Half', ['strong']], ' bold'])), false, 'not wholly bold');
  assert.equal(isPoint(p('Not bold at all')), false);
  assert.equal(isPoint(bold(Array(23).fill('word').join(' '))), false, 'more than 22 words');
  assert.equal(isPoint(bold('***')), false, 'no letters');
  assert.equal(isPoint(bold('- Ephesians 1:3-10')), false, 'an attribution');
  assert.equal(isPoint(li('Bold item')), false, 'list items are not paragraphs');
});

test('a numbered point loses its number into `num` and its bold', () => {
  const out = prepareBody([bold('2. The whole church shares the news.')]);
  const pt = out[0] as JournalPoint;
  assert.equal(pt._type, 'journalPoint');
  assert.equal(pt.num, '2');
  assert.equal(textOf(pt), 'The whole church shares the news.');
  assert.deepEqual(marksOf(pt), []);
});

test('a single wholly-bold numbered list item is point 1', () => {
  const item = block([['The first thing to say', ['strong']]], { listItem: 'number', level: 1 });
  const out = prepareBody([item, p('Explained here.')]);
  assert.equal(out[0]._type, 'journalPoint');
  assert.equal((out[0] as JournalPoint).num, '1');
  assert.equal(textOf(out[0]), 'The first thing to say');
});

test('three or more question points become Q and A rows with their answers', () => {
  const out = prepareBody([
    bold('Who can attend?'),
    p('Anyone who loves Messiah.'),
    p('Families too.'),
    bold('Do I need to bring a score?'),
    p('Scores are provided.'),
    bold('Is there a cost?'),
    p('No, it is free.'),
    li('A list ends the answer'),
  ]);
  assert.deepEqual(
    out.map((n) => n._type),
    ['journalQA', 'journalQA', 'journalQA', 'block'],
  );
  const qa = out[0] as JournalQA;
  assert.equal(textOf(qa.question), 'Who can attend?');
  assert.equal(qa.answer.length, 2);
});

test('two question points stay points', () => {
  const out = prepareBody([bold('Why?'), p('Because.'), bold('How?'), p('Like this.')]);
  assert.deepEqual(
    out.map((n) => n._type),
    ['journalPoint', 'block', 'journalPoint', 'block'],
  );
});

test('a bold span longer than twelve words loses strong; a short one keeps it', () => {
  const long = 'this is a very long run of bold text that goes on for far more than twelve words';
  const out = prepareBody([
    block(['Before ', [long, ['strong']], ' and ', ['short bold', ['strong']], '.']),
  ]);
  const marks = ((out[0] as PTBlock).children ?? []).map((c) => (c as { marks?: string[] }).marks);
  assert.deepEqual(marks, [[], [], [], ['strong'], []]);
});

test('headings keep their text and links but lose bold and underline', () => {
  const h = block([['What is the Messiah Sing-In?', ['strong', 'underline']]], { style: 'h4' });
  const out = prepareBody([h]);
  assert.equal((out[0] as PTBlock).style, 'h4');
  assert.deepEqual(marksOf(out[0]), []);
});

test('empty paragraphs are dropped', () => {
  assert.equal(prepareBody([p(''), p('  '), p('Text')]).length, 1);
});

// ── Images ──────────────────────────────────────────────────────────────────

test('an inline image repeating the cover asset is dropped; others stay', () => {
  const cover = { asset: { _id: 'image-bbf1c177d25f566c939b84b97b5f097fb527d581-4023x2221-jpg' } };
  const body: BodyNode[] = [
    { _type: 'inlineImage', _key: 'a', asset: { _ref: 'image-aaa90d59-1545x2000-png' } },
    {
      _type: 'inlineImage',
      _key: 'b',
      asset: { _id: 'image-bbf1c177d25f566c939b84b97b5f097fb527d581-4023x2221-jpg' },
    },
  ];
  const out = prepareBody(body, { coverRef: assetRefOf(cover) });
  assert.deepEqual(
    out.map((n) => n._key),
    ['a'],
  );
  // No cover: nothing is dropped.
  assert.equal(prepareBody(body).length, 2);
});

test('prepareBody does not modify its input', () => {
  const body = [block([['x', ['underline']]]), ...messiahRows.map((r) => li(r))];
  const before = JSON.stringify(body);
  prepareBody(body, { preview: true });
  assert.equal(JSON.stringify(body), before);
});

// ── The lection ─────────────────────────────────────────────────────────────

const previewOpening = () => [
  p('This is a sermon preview for the second week of our Kingdom Family Values series.'),
  p(
    'The disciples said to him, “If this is the situation between a husband and wife, it is better not to marry.”',
  ),
  p('“The one who can accept this should accept it.” - From Matthew 19:1-14 (NIV)'),
  bold('Jesus refuses to be boxed in'),
  p('We often bring with us a lot of assumptions about marriage.'),
];

test('findLection skips the opening line and ends at the block with the reference', () => {
  assert.deepEqual(findLection(previewOpening()), { from: 1, to: 2, reference: 'Matthew 19:1-14' });
});

test('findLection gives up after four blocks, or at a heading, or with no reference', () => {
  const far = [p('a'), p('b'), p('c'), p('d'), p('From John 3:16')];
  assert.equal(findLection(far), null);
  assert.equal(findLection([block(['Heading'], { style: 'h2' }), p('John 3:16')]), null);
  assert.equal(findLection([p('No scripture here at all.')]), null);
  // A quotation block counts.
  assert.deepEqual(
    findLection([block(['“Love one another.” John 13:34'], { style: 'blockquote' })]),
    {
      from: 0,
      to: 0,
      reference: 'John 13:34',
    },
  );
});

test('prepareBody sets the lection on previews only, blocks unmoved and unedited', () => {
  const out = prepareBody(previewOpening(), { preview: true });
  assert.deepEqual(
    out.map((n) => n._type),
    ['block', 'journalLection', 'journalPoint', 'block'],
  );
  const lec = out[1] as JournalLection;
  assert.equal(lec.reference, 'Matthew 19:1-14');
  assert.equal(lec.blocks.length, 2);
  assert.ok(textOf(lec.blocks[1]).endsWith('(NIV)'));
  assert.ok(!prepareBody(previewOpening()).some((n) => n._type === 'journalLection'));
});

test('findLection reads through stega', () => {
  const out = findLection([p(`This is a sermon preview.${STEGA}`), p(`From Acts 12:1-19${STEGA}`)]);
  assert.deepEqual(out, { from: 1, to: 1, reference: 'Acts 12:1-19' });
});

// ── Facts off the body ──────────────────────────────────────────────────────

test('ledeEchoes: the excerpt repeats the first paragraph', () => {
  const body = [
    p(
      'Some Christmas events invite you to sit back and listen, but Messiah Sing-In & Carols is a time to join in and be a participant in the music!',
    ),
  ];
  assert.equal(
    ledeEchoes(
      'Some Christmas events invite you to sit back and listen, but Messiah Sing-In & Carols is a time to join in!',
      body,
    ),
    true,
  );
  assert.equal(ledeEchoes('A different summary entirely, written for the card.', body), false);
  assert.equal(ledeEchoes('', body), false);
  assert.equal(ledeEchoes(null, body), false);
});

test('ledeEchoes looks at the first paragraph only, past headings and lists', () => {
  const body = [
    li('Date · Event'),
    p('An opening line.'),
    p('The excerpt is here, in the second paragraph.'),
  ];
  assert.equal(ledeEchoes('The excerpt is here, in the second paragraph.', body), false);
  assert.equal(ledeEchoes('An opening line.', body), true);
});

test('openingText joins the first six text blocks; listenHref finds the channel link', () => {
  const first = link('livestream page', 'https://fbcmuncie.churchcenter.com/channels/12345');
  const body = [
    first,
    p('two'),
    { _type: 'inlineImage' },
    p('three'),
    p('4'),
    p('5'),
    p('6'),
    p('seven'),
  ];
  assert.equal(openingText(body), 'livestream page two three 4 5 6');
  assert.equal(listenHref(body), 'https://fbcmuncie.churchcenter.com/channels/12345');
  assert.equal(listenHref([p('none'), first]), '', 'only the opening block counts');
  assert.equal(listenHref(null), '');
});
