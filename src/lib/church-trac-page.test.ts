// A Church Trac page read into blocks (src/lib/church-trac-page.ts) and the
// newsletters that use it (src/lib/church-trac-newsletters.ts). The fixtures
// are the church's real pages of 2026-09-25: The Kid's Corner and The Moose's
// Message.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isTemplateText,
  noDashes,
  pageText,
  parseHtml,
  readChurchTracPage,
  safeHref,
  safeImage,
  type Block,
} from './church-trac-page.ts';
import {
  NEWSLETTERS,
  churchTracPageUrl,
  fetchChurchTracPage,
  newsletterBySlug,
} from './church-trac-newsletters.ts';
import { newsletterBlock } from './ministry-band.ts';

const fixture = (name: string) =>
  readFileSync(new URL(`../../tests/fixtures/churchtrac-${name}.html`, import.meta.url), 'utf8');
const KIDS = readChurchTracPage(fixture('children'), 'https://fbcmuncie.churchtrac.com/children')!;
const YOUTH = readChurchTracPage(fixture('youth'), 'https://fbcmuncie.churchtrac.com/youth')!;

const headings = (sections: Block[][]) =>
  sections.flat().flatMap((b) => (b.kind === 'heading' ? [`h${b.level} ${b.text}`] : []));

test("The Kid's Corner: its name, masthead and sections", () => {
  assert.equal(KIDS.title, "The Kid's Corner");
  assert.match(
    KIDS.banner ?? '',
    /^https:\/\/fbcmuncie\.churchtrac\.com\/image\?ci=74614&file=n6aj2n9spcrh\.jpg/,
  );
  assert.equal(KIDS.sections.length, 5);
  assert.deepEqual(headings(KIDS.sections), [
    'h2 Nursery through 5th Grade',
    'h2 Summer Day Camps!',
    'h2 Sundays @ FBCM',
    'h2 Book Recommendation: "All the Things I Say to God"',
    'h2 Enjoy this beautiful Summer with family and friends!',
  ]);
  // Each section after the first opens with its title card.
  assert.deepEqual(
    KIDS.sections.map((s) => s[0].kind),
    ['heading', 'image', 'image', 'image', 'heading'],
  );
});

test('buttons keep their words and address; the schedule is two columns', () => {
  const buttons = KIDS.sections.flat().filter((b) => b.kind === 'button');
  assert.deepEqual(
    buttons.map((b) => b.kind === 'button' && b.label),
    ['Register for Water Wars!', 'Amazon Link to Book'],
  );
  assert.equal(
    buttons[0].kind === 'button' && buttons[0].href,
    'https://fbcmuncie.churchtrac.com/connect?ei=1C9SPAM',
  );
  const cols = KIDS.sections[2].find((b) => b.kind === 'columns');
  assert.ok(cols && cols.kind === 'columns');
  assert.equal(cols.columns.length, 2);
  assert.deepEqual(
    cols.columns[1].map((b) =>
      b.kind === 'heading' ? b.text : b.kind === 'text' ? 'text' : b.kind,
    ),
    ['Godly Play | 10:45AM Worship', 'text', 'text', 'text', 'text'],
  );
});

test('bold and italic survive; the sign-off stays bold', () => {
  const last = KIDS.sections[4];
  const signoff = last[last.length - 1];
  assert.ok(signoff.kind === 'text');
  assert.deepEqual(signoff.inline, [
    { text: "--The Children's Ministry Leadership Team", bold: true },
  ]);
  const verse = KIDS.sections[2].find(
    (b) =>
      b.kind === 'text' &&
      pageText({ title: '', banner: null, bannerBlocks: [], sections: [[b]] }).includes(
        'Romans 6:23',
      ),
  );
  assert.ok(
    verse && verse.kind === 'text' && verse.inline.every((r) => 'br' in r || (r.bold && r.italic)),
  );
});

test("The Moose's Message: Church Trac's template text never reaches the page", () => {
  assert.equal(YOUTH.title, "The Moose's Message");
  // The published banner carries a real heading AND the template paragraph.
  assert.deepEqual(YOUTH.bannerBlocks, [
    { kind: 'heading', level: 2, text: 'Jesus is the Answer' },
  ]);
  assert.doesNotMatch(pageText(YOUTH), /Add a Headline|Use a Template/);
  assert.ok(
    isTemplateText('Add a Headline and Paragraph for this section, or click "Use a Template"'),
  );
  assert.ok(!isTemplateText('Add a friend to Club Night this week.'));
});

test('empty lines are dropped and nested paragraphs are read once', () => {
  const words = pageText(YOUTH);
  // Each Club Night lesson once, not twice (they sit in a paragraph inside a paragraph).
  assert.equal(words.split('Real friends choose each other.').length - 1, 1);
  for (const b of YOUTH.sections.flat()) {
    if (b.kind === 'text') assert.ok(b.inline.length > 0 && !('br' in b.inline[0]));
  }
  assert.deepEqual(
    YOUTH.sections
      .flat()
      .filter((b) => b.kind === 'button')
      .map((b) => b.kind === 'button' && b.label),
    ['Student Devotionals', 'Parent Devotionals', 'Choosing Wisely', 'Friendship Advice'],
  );
});

test('nothing unsafe gets through: links, images, scripts, hidden and unpublished parts', () => {
  const html = `<input type="hidden" id="title" value="Test">
    <div class="hero-container"><div data-section-published="0"><div class="prompt-text h3">Draft banner</div></div></div>
    <div class="page-card-body"><div class="page-card-section">
      <div class="prompt-text h3">Hello</div>
      <div class="prompt-text paragraph-2">A <a href="javascript:alert(1)">bad</a> and a <a href="/connect?x=1">good</a> link.</div>
      <div class="prompt-text hidden">Hidden words</div>
      <div class="prompt-text" style="display:none">Also hidden</div>
      <script>alert('x')</script><style>.x{}</style>
      <div class="prompt-image"><img src="http://insecure.example/a.jpg"></div>
      <a class="prompt-button" href="javascript:void(0)">Nope</a>
      <a class="prompt-button" href="mailto:youth@fbcmuncie.org">Email us</a>
    </div></div>`;
  const page = readChurchTracPage(html, 'https://fbcmuncie.churchtrac.com/test')!;
  assert.equal(page.bannerBlocks.length, 0);
  assert.equal(page.banner, null);
  const text = pageText(page);
  assert.doesNotMatch(text, /Draft banner|Hidden words|Also hidden|alert|Nope/);
  const para = page.sections[0][1];
  assert.ok(para.kind === 'text');
  assert.deepEqual(
    para.inline.filter((r) => 'href' in r && r.href).map((r) => ('href' in r ? r.href : '')),
    ['https://fbcmuncie.churchtrac.com/connect?x=1'],
  );
  assert.ok(!page.sections[0].some((b) => b.kind === 'image'));
  assert.deepEqual(
    page.sections[0].filter((b) => b.kind === 'button'),
    [{ kind: 'button', label: 'Email us', href: 'mailto:youth@fbcmuncie.org' }],
  );
  assert.equal(safeHref('javascript:alert(1)', 'https://x.churchtrac.com/'), null);
  assert.equal(safeImage('http://x.example/a.jpg', 'https://x.churchtrac.com/'), null);
});

test('not a Church Trac page: null, so the site falls back to the link', () => {
  assert.equal(readChurchTracPage('<html><body>Sign in</body></html>', 'https://x/'), null);
  assert.equal(readChurchTracPage('', 'https://x/'), null);
});

test('the tree reader: entities, void elements, stray end tags', () => {
  const root = parseHtml('<p>Tom &amp; Jerry&#8217;s<br>line</div></p><img src=a.jpg>');
  const p = root.children[0];
  assert.equal(p.tag, 'p');
  assert.equal(p.children[0].text, 'Tom &amp; Jerry&#8217;s');
  assert.equal(root.children[1].tag, 'img');
});

test('no em-dashes reach the page (CLAUDE.md rule 2), and ranges keep theirs', () => {
  assert.equal(noDashes('Camp\u2014bring a friend'), 'Camp, bring a friend');
  assert.equal(noDashes('Camp \u2013 bring a friend'), 'Camp, bring a friend');
  assert.equal(noDashes('Eph. 4:15\u201316'), 'Eph. 4:15\u201316');
  assert.equal(noDashes('\u2014 Psalm 34:18'), 'Psalm 34:18');
});

test('the newsletters: addresses on the site and on Church Trac', () => {
  assert.deepEqual(
    NEWSLETTERS.map((n) => n.slug),
    ['kids-corner', 'youth-news'],
  );
  const kids = newsletterBySlug('kids-corner')!;
  assert.equal(churchTracPageUrl(kids), 'https://fbcmuncie.churchtrac.com/children');
  assert.equal(
    churchTracPageUrl(kids, 'https://fbcmuncie.churchtrac.com/'),
    'https://fbcmuncie.churchtrac.com/children',
  );
  // Another church's portal in the box is followed; a non-Church-Trac one is not.
  assert.equal(
    churchTracPageUrl(kids, 'https://other.churchtrac.com/'),
    'https://other.churchtrac.com/children',
  );
  assert.equal(
    churchTracPageUrl(kids, 'https://evil.example/'),
    'https://fbcmuncie.churchtrac.com/children',
  );
  assert.equal(
    churchTracPageUrl(kids, 'http://fbcmuncie.churchtrac.com/'),
    'https://fbcmuncie.churchtrac.com/children',
  );
});

test('the fetch: a Church Trac page is returned, anything else is null and logged', async () => {
  const logs: string[] = [];
  const ok = await fetchChurchTracPage(
    'https://x/',
    async () => new Response(fixture('children')),
    1000,
    (m) => logs.push(m),
  );
  assert.ok(ok?.includes('page-card-body'));
  const bad = await fetchChurchTracPage(
    'https://x/',
    async () => new Response('Forbidden', { status: 403 }),
    1000,
    (m) => logs.push(m),
  );
  assert.equal(bad, null);
  assert.equal(logs.length, 2);
});

test("the Ministries page's Children and Youth bands link their newsletter", () => {
  const kids = newsletterBlock('children');
  assert.ok(kids);
  assert.equal(kids.markDefs[0].href, '/kids-corner');
  assert.equal(
    kids.children.map((c) => c.text).join(''),
    'Read The Kid\u2019s Corner, the children\u2019s newsletter.'.replace('Kid\u2019s', "Kid's"),
  );
  assert.equal(newsletterBlock('youth')?.markDefs[0].href, '/youth-news');
  assert.equal(newsletterBlock('youth\u200B')?.markDefs[0].href, '/youth-news');
  assert.equal(newsletterBlock('worship'), null);
  assert.equal(newsletterBlock(undefined), null);
});

// Church Trac answers 403 to `Accept-Language: *` (Node fetch's default).
test('the page fetch sends a real Accept-Language, which Church Trac requires', async () => {
  const churchTrac = async (_url: string, init?: RequestInit) => {
    const h = new Headers(init?.headers);
    const lang = h.get('accept-language');
    return !h.get('user-agent') || !lang || lang.trim() === '*'
      ? new Response('Forbidden', { status: 403 })
      : new Response(fixture('children'));
  };
  const html = await fetchChurchTracPage('https://x/', churchTrac as typeof fetch, 1000, () => {});
  assert.ok(html?.includes('page-card-body'));
});
