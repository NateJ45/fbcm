// src/lib/convert-body.test.ts
// The fixture is REAL captured markup, trimmed: it is the opening of
// scripts/data/posts/a-church-for-a-lonely-world.json's `bodyHtml` plus the
// <h2> and <h6> that appear later in the same post. Every shape the converter
// has to handle is in it, in the form Wix actually emits it: a heading, a link
// wrapped in <em><u>, a <figure> whose <img> is wrapped in an <a> and followed
// by a <figcaption>, a <ul> whose <li> each contain a <p>, a <blockquote>, the
// spacer <br> Wix puts between paragraphs, and an entity.
//
// A synthetic fixture would have proved the library works. This one proves it
// works on the 142 posts we actually have.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { convertBody, type ConvertedTextBlock, type ConvertedObjectBlock } from './convert-body.ts';

const parseHtml = (html: string): Document => new JSDOM(html).window.document;

const IMG_SRC =
  'https://static.wixstatic.com/media/b98776_d249bca5a70942199c24e96d21ca8796~mv2.jpeg/v1/fill/' +
  'w_147,h_186,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/' +
  'b98776_d249bca5a70942199c24e96d21ca8796~mv2.jpeg';

const FIXTURE =
  '<h2>What is the church’s response?</h2>\n' +
  '<p>Over the past 24 hours, there has been quite a bit of conversation about an alarming report ' +
  '<a href="https://www.hhs.gov/about/news/2023/05/03/new-surgeon-general-advisory"><em><u>' +
  '("New Surgeon General Advisory," May 3rd, 2023</u></em></a>).</p>\n' +
  `<figure><a href="https://www.hhs.gov/about/news/2023/05/03/new-surgeon-general-advisory"><img src="${IMG_SRC}"></a>\n` +
  '<figcaption>Social Engagement Decreased In Every Category (source: HHS, 2023)</figcaption></figure>\n' +
  '<p>This, as you can imagine, is correlated with all sorts of negative ills: </p>\n' +
  '<ul>\n<li>\n<p>increased depression</p></li>\n<li>\n<p>anxiety</p></li></ul>\n' +
  '<p>In short, more isolation is bad for human well-being.</p><br>\n' +
  '<blockquote><strong><em>Why has this happened? </em></strong>\n' +
  '<strong><em>And what is to be done about it?</em></strong></blockquote>\n' +
  '<h6>Is "Cultural Christianity" the answer?</h6>\n' +
  '<p>For some Christians, trends like these have inspired calls for bread &amp; wine.</p>';

const LOCAL_FILE = 'b98776_d249bca5a70942199c24e96d21ca8796~mv2.jpeg';
const UPLOADED_REF = 'image-abc123def456-147x186-jpeg';

/** The mock uploader: one fixed _ref, and a record of what it was asked for. */
function mockUploader() {
  const asked: string[] = [];
  return {
    asked,
    uploadImage: async (relPath: string) => {
      asked.push(relPath);
      return UPLOADED_REF;
    },
  };
}

const options = () => {
  const up = mockUploader();
  return {
    up,
    opts: {
      slug: 'a-church-for-a-lonely-world',
      parseHtml,
      // The capture's own `images` array is the map from the <img src> in the
      // body to the file in the archive. The real script builds this from it.
      resolveImage: (src: string) => (src === IMG_SRC ? LOCAL_FILE : undefined),
      uploadImage: up.uploadImage,
      fallbackAlt: 'A church for a lonely world',
    },
  };
};

// ── The five shapes the brief names ────────────────────────────────────────

test('a captured <h2> becomes style h2', async () => {
  const { blocks } = await convertBody(FIXTURE, options().opts);
  const h2 = blocks.find(
    (b) => b._type === 'block' && (b as ConvertedTextBlock).style === 'h2',
  ) as ConvertedTextBlock;
  assert.ok(h2, 'expected a block with style h2');
  assert.match(h2.children[0].text, /What is the church.s response\?/);
});

test('a captured <a> becomes a link markDef the span points at', async () => {
  const { blocks } = await convertBody(FIXTURE, options().opts);
  const withLink = blocks.find(
    (b) => b._type === 'block' && (b as ConvertedTextBlock).markDefs.length > 0,
  ) as ConvertedTextBlock;
  assert.ok(withLink, 'expected a block carrying a markDef');
  const def = withLink.markDefs[0];
  assert.equal(def._type, 'link');
  assert.equal(def.href, 'https://www.hhs.gov/about/news/2023/05/03/new-surgeon-general-advisory');
  // The span carries the markDef's key, so the renderer resolves it.
  const linked = withLink.children.find((c) => c.marks.includes(def._key));
  assert.ok(linked, 'expected a span marked with the link key');
  // The <em><u> inside the anchor survive as decorators alongside the link.
  assert.ok(linked.marks.includes('em'));
  assert.ok(linked.marks.includes('underline'));
});

test('a captured <ul> becomes listItem: bullet', async () => {
  const { blocks } = await convertBody(FIXTURE, options().opts);
  const items = blocks.filter(
    (b) => b._type === 'block' && (b as ConvertedTextBlock).listItem === 'bullet',
  ) as ConvertedTextBlock[];
  assert.equal(items.length, 2);
  assert.equal(items[0].children[0].text, 'increased depression');
  assert.equal(items[1].children[0].text, 'anxiety');
});

test('a captured <blockquote> becomes style blockquote', async () => {
  const { blocks } = await convertBody(FIXTURE, options().opts);
  const quote = blocks.find(
    (b) => b._type === 'block' && (b as ConvertedTextBlock).style === 'blockquote',
  ) as ConvertedTextBlock;
  assert.ok(quote, 'expected a block with style blockquote');
  assert.match(quote.children[0].text, /Why has this happened\?/);
  assert.ok(quote.children[0].marks.includes('strong'));
});

test('a captured <img> becomes an inlineImage whose asset came from the uploader', async () => {
  const { up, opts } = options();
  const { blocks } = await convertBody(FIXTURE, opts);
  const image = blocks.find((b) => b._type === 'inlineImage') as ConvertedObjectBlock;
  assert.ok(image, 'expected an inlineImage block');
  assert.deepEqual(image.asset, { _type: 'reference', _ref: UPLOADED_REF });
  // The uploader was asked for the ARCHIVE path, not the Wix URL.
  assert.deepEqual(up.asked, [LOCAL_FILE]);
  // <img alt> is empty in this capture, so the figcaption is the honest alt.
  assert.match(String(image.alt), /Social Engagement Decreased/);
  assert.match(String(image.caption), /Social Engagement Decreased/);
  assert.equal(image.size, 'wide');
});

// ── The rules the brief sets ───────────────────────────────────────────────

test('keys are deterministic: the same capture converts byte-identically', async () => {
  const a = await convertBody(FIXTURE, options().opts);
  const b = await convertBody(FIXTURE, options().opts);
  assert.deepEqual(a.blocks, b.blocks);
  // And every key is unique inside the document.
  const keys = a.blocks.flatMap((blk) =>
    blk._type === 'block'
      ? [
          blk._key,
          ...(blk as ConvertedTextBlock).children.map((c) => c._key),
          ...(blk as ConvertedTextBlock).markDefs.map((d) => d._key),
        ]
      : [blk._key],
  );
  assert.ok(keys.every(Boolean));
  assert.equal(new Set(keys).size, keys.length);
});

test('a different post gets different keys, so two bodies never collide', async () => {
  const a = await convertBody('<p>one</p>', { ...options().opts, slug: 'alpha' });
  const b = await convertBody('<p>one</p>', { ...options().opts, slug: 'beta' });
  assert.notEqual(a.blocks[0]._key, b.blocks[0]._key);
});

test('Wix spacer <br>, empty paragraphs and inline styles are dropped', async () => {
  const { blocks } = await convertBody(
    '<div style="color:red"><p style="font-size:14px">Real text</p><br><p> </p><p>&nbsp;</p></div>',
    options().opts,
  );
  assert.equal(blocks.length, 1);
  assert.equal((blocks[0] as ConvertedTextBlock).children[0].text, 'Real text');
});

test('entities are decoded', async () => {
  const { blocks } = await convertBody(FIXTURE, options().opts);
  const last = blocks[blocks.length - 1] as ConvertedTextBlock;
  assert.match(last.children[0].text, /bread & wine/);
});

test('a bold paragraph stays a paragraph: the converter invents no structure', async () => {
  const { blocks } = await convertBody('<p><strong>Not a heading</strong></p>', options().opts);
  assert.equal((blocks[0] as ConvertedTextBlock).style, 'normal');
  assert.ok((blocks[0] as ConvertedTextBlock).children[0].marks.includes('strong'));
});

test('Wix h5 and h6 land on h4, the smallest heading the schema has', async () => {
  const { blocks } = await convertBody(FIXTURE, options().opts);
  const h4 = blocks.find(
    (b) => b._type === 'block' && (b as ConvertedTextBlock).style === 'h4',
  ) as ConvertedTextBlock;
  assert.ok(h4, 'expected the <h6> to land on h4');
  assert.match(h4.children[0].text, /Cultural Christianity/);
});

test('an image missing from the archive becomes a paragraph and is counted', async () => {
  const { opts } = options();
  const { blocks, report } = await convertBody(
    '<figure><img src="https://static.wixstatic.com/media/gone.jpg" alt="The choir in 1974"></figure>',
    { ...opts, resolveImage: () => undefined },
  );
  assert.equal(report.images, 0);
  assert.deepEqual(report.missingImages, ['https://static.wixstatic.com/media/gone.jpg']);
  assert.equal((blocks[0] as ConvertedTextBlock).children[0].text, 'The choir in 1974');
});

test('a YouTube iframe becomes a videoEmbed; anything else becomes a link paragraph', async () => {
  const yt = await convertBody(
    '<iframe src="https://www.youtube.com/embed/abc123"></iframe>',
    options().opts,
  );
  assert.equal(yt.blocks[0]._type, 'videoEmbed');
  assert.equal((yt.blocks[0] as ConvertedObjectBlock).url, 'https://www.youtube.com/embed/abc123');
  assert.equal(yt.report.embeds, 1);

  const mp4 = await convertBody(
    '<figure><video src="https://video.wixstatic.com/video/81f7ac/1080p/mp4/file.mp4"></video></figure>',
    options().opts,
  );
  const para = mp4.blocks[0] as ConvertedTextBlock;
  assert.equal(para._type, 'block');
  assert.equal(
    para.markDefs[0].href,
    'https://video.wixstatic.com/video/81f7ac/1080p/mp4/file.mp4',
  );
  assert.equal(mp4.report.embeds, 1);
});

test('a table becomes one bullet per row rather than being dropped', async () => {
  const { blocks, report } = await convertBody(
    '<table><tbody><tr><td><p>Date</p></td><td><p>Event</p></td></tr>' +
      '<tr><td><p>Sat, March 7</p></td><td><p>Lenten Breakfast</p></td></tr></tbody></table>',
    options().opts,
  );
  assert.equal(report.tables, 1);
  const items = blocks as ConvertedTextBlock[];
  assert.equal(items.length, 2);
  assert.equal(items[0].listItem, 'bullet');
  assert.equal(items[1].children[0].text, 'Sat, March 7 · Lenten Breakfast');
});

// ── Dashes (CLAUDE.md rule 2, added in the task 16 fix wave) ───────────────

test('an em-dash between two words becomes a comma and one space', async () => {
  const { blocks, report } = await convertBody(
    '<p>really pay attention to what is going on—with the loneliness</p>',
    options().opts,
  );
  assert.equal(
    (blocks[0] as ConvertedTextBlock).children[0].text,
    'really pay attention to what is going on, with the loneliness',
  );
  assert.equal(report.emDashes, 0);
  assert.equal(report.dashesNormalised, 1);

  // Spaced, and spaced with an en-dash, read the same way.
  const spaced = await convertBody(
    '<p>Stash the Phone and Get Out — the same thing</p>',
    options().opts,
  );
  assert.equal(
    (spaced.blocks[0] as ConvertedTextBlock).children[0].text,
    'Stash the Phone and Get Out, the same thing',
  );
  const enDash = await convertBody(
    '<p>may look like anything but – but it is not a trick</p>',
    options().opts,
  );
  assert.equal(
    (enDash.blocks[0] as ConvertedTextBlock).children[0].text,
    'may look like anything but, but it is not a trick',
  );
});

test('a dash that opens a line, or follows a quote, is dropped and the space collapses', async () => {
  const opening = await convertBody('<p>— Esau McCaulley</p>', options().opts);
  assert.equal((opening.blocks[0] as ConvertedTextBlock).children[0].text, 'Esau McCaulley');

  // The church's most common shape: a scripture attribution after a quote.
  const attribution = await convertBody(
    '<p>“The Lord is close to the brokenhearted.” — Psalm 34:18</p>',
    options().opts,
  );
  assert.equal(
    (attribution.blocks[0] as ConvertedTextBlock).children[0].text,
    '“The Lord is close to the brokenhearted.” Psalm 34:18',
  );
  assert.equal(attribution.report.emDashes, 0);
});

test('a closing quote decides by what came before it, not by being a quote', async () => {
  // A parenthesis closed by a quote is still a parenthesis: comma.
  const parenthesis = await convertBody(
    '<p>fanaticism disguised as “conviction”—we can see that</p>',
    options().opts,
  );
  assert.equal(
    (parenthesis.blocks[0] as ConvertedTextBlock).children[0].text,
    'fanaticism disguised as “conviction”, we can see that',
  );

  // A quote that ENDED a sentence is an attribution: drop.
  const attribution = await convertBody(
    '<p>“Sorrowful, yet always rejoicing.” — 2 Corinthians 6:10</p>',
    options().opts,
  );
  assert.equal(
    (attribution.blocks[0] as ConvertedTextBlock).children[0].text,
    '“Sorrowful, yet always rejoicing.” 2 Corinthians 6:10',
  );

  // An opening quote on the RIGHT still starts a word.
  const opening = await convertBody(
    '<p>American Baptist Identity Statement, 2005 — “We Are American Baptists”</p>',
    options().opts,
  );
  assert.equal(
    (opening.blocks[0] as ConvertedTextBlock).children[0].text,
    'American Baptist Identity Statement, 2005, “We Are American Baptists”',
  );
});

test('a numeric or scripture range keeps its dash exactly as typed', async () => {
  const { blocks, report } = await convertBody(
    '<p>From 2003–2020 and again in Eph. 4:15–16, and 2003- 2020 too.</p>',
    options().opts,
  );
  assert.equal(
    (blocks[0] as ConvertedTextBlock).children[0].text,
    'From 2003–2020 and again in Eph. 4:15–16, and 2003- 2020 too.',
  );
  assert.equal(report.dashesNormalised, 0);
});

test('a dash that opens a SPAN still sees the word in the span before it', async () => {
  // 14 of the corpus's 81 em-dashes sit straight after a tag, so the dash
  // starts one span and the word before it ends the previous one. Read
  // span-locally this looks like a line-opening dash, and dropping it would
  // join the two words with nothing between them.
  const { blocks } = await convertBody(
    '<p>holding sorrow and hope <strong>together</strong>—because faith endures</p>',
    options().opts,
  );
  const text = (blocks[0] as ConvertedTextBlock).children.map((c) => c.text).join('');
  assert.equal(text, 'holding sorrow and hope together, because faith endures');
  assert.ok(!text.includes('togetherbecause'));
});

test('the report counts what carried, and counts the em-dashes it did not add', async () => {
  const { report } = await convertBody(FIXTURE, options().opts);
  assert.equal(report.h2, 1);
  assert.equal(report.h4, 1);
  assert.equal(report.links, 1);
  assert.equal(report.listItems, 2);
  assert.equal(report.quotes, 1);
  assert.equal(report.images, 1);
  assert.equal(report.emDashes, 0);

  const dashed = await convertBody('<p>The church — ours — gathers.</p>', options().opts);
  assert.equal(dashed.report.emDashes, 0, 'rule 2: no em-dash may survive');
  assert.equal(dashed.report.dashesNormalised, 2);
  assert.equal(
    (dashed.blocks[0] as ConvertedTextBlock).children[0].text,
    'The church, ours, gathers.',
  );
});

test('every style, list and decorator the converter emits is declared by the Studio schema', async () => {
  const { blockSchema } = await import('./convert-body.ts');
  const styles = blockSchema.styles.map((s) => s.name);
  const decorators = blockSchema.decorators.map((d) => d.name);
  // These are read off journalEntry.ts at import time, so a schema change that
  // removes one of them fails here rather than in the Studio.
  for (const s of ['normal', 'h2', 'h3', 'h4', 'blockquote']) assert.ok(styles.includes(s), s);
  for (const d of ['strong', 'em', 'underline']) assert.ok(decorators.includes(d), d);
  assert.ok(blockSchema.lists.map((l) => l.name).includes('bullet'));
  assert.ok(blockSchema.annotations.some((a) => a.name === 'link'));
});
