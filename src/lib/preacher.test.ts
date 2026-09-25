// This Sunday's preacher (src/lib/preacher.ts, 2026-09-25): the description
// parser, the preview author rule, the source order, and the broadcast pick
// against the committed feed (tests/fixtures/youtube-feed.xml).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isPersonName, preacherOf, previewPreacher, thisSundayPreacher } from './preacher.ts';
import { parseYoutubeFeed, upcomingPreacher, type FeedEntry } from './youtube-feed.ts';
import { sundayFactKept } from './live-sunday.ts';

const FIXTURE = readFileSync(
  new URL('../../tests/fixtures/youtube-feed.xml', import.meta.url),
  'utf8',
);

// ── preacherOf: the description parser ─────────────────────────────────────

test('the three labels, in any case, with a colon or a spaced dash', () => {
  assert.equal(preacherOf('Preaching: Rev. Jonathan Balmer'), 'Rev. Jonathan Balmer');
  assert.equal(preacherOf('Preacher: Pastor Kendall Ellis'), 'Pastor Kendall Ellis');
  assert.equal(preacherOf('Speaker: Dr. Jane Smith'), 'Dr. Jane Smith');
  assert.equal(preacherOf('PREACHING: Rev. Jonathan Balmer'), 'Rev. Jonathan Balmer');
  assert.equal(preacherOf('preacher - Kendall Ellis'), 'Kendall Ellis');
  assert.equal(preacherOf('Guest Preacher: The Rev. Dr. Ann Lee'), 'The Rev. Dr. Ann Lee');
});

test('the line is found anywhere in the description, and in a segment of a line', () => {
  assert.equal(
    preacherOf("This week's Sermon.\nPreaching: Rev. Jonathan Balmer\n\nMore"),
    'Rev. Jonathan Balmer',
  );
  assert.equal(
    preacherOf('Matthew 21:23-32 | Preaching: Rev. Jonathan Balmer | Kingdom Come'),
    'Rev. Jonathan Balmer',
  );
  assert.equal(preacherOf('Sermon · Speaker: Kendall Ellis'), 'Kendall Ellis');
  assert.equal(preacherOf('  Preaching:   Rev.  Jonathan   Balmer  \r\n'), 'Rev. Jonathan Balmer');
});

test('titles are kept as written, and trailing punctuation goes (but not Jr.)', () => {
  assert.equal(preacherOf('Preaching: Rev. Jonathan Balmer.'), 'Rev. Jonathan Balmer');
  assert.equal(preacherOf('Preaching: Rev. Jonathan Balmer,'), 'Rev. Jonathan Balmer');
  assert.equal(preacherOf('Preaching: Rev. Martin Luther King Jr.'), 'Rev. Martin Luther King Jr.');
  assert.equal(preacherOf('Preaching: Rev Jonathan Balmer'), 'Rev Jonathan Balmer');
  assert.equal(
    preacherOf('Preaching: Rev. Jonathan Balmer and Rev. Kendall Ellis'),
    'Rev. Jonathan Balmer and Rev. Kendall Ellis',
  );
});

test('a label with no name, or with something that is not a name, names nobody', () => {
  for (const d of [
    '',
    'No such line',
    'Preaching:',
    'Preaching: TBA',
    'Preaching: To be announced',
    'Preaching: Guest',
    'Preaching: Our Pastors',
    'Preaching: https://example.com/jonathan',
    'Preaching: Matthew 21:23-32',
    'Preaching: the kingdom of God is near', // a sentence, not a name
    'Preaching: Rev.', // a title alone
    'Speaker: one two three four five six seven eight',
    'Preaching on grace this week', // no label
    'Worship: Cynthia Smith', // not one of the three labels
  ]) {
    assert.equal(preacherOf(d), '', JSON.stringify(d));
  }
  assert.equal(preacherOf(null), '');
});

test('the first labelled line that reads as a name wins', () => {
  assert.equal(preacherOf('Preaching: TBA\nSpeaker: Kendall Ellis'), 'Kendall Ellis');
  assert.equal(
    preacherOf('Preaching: Rev. Jonathan Balmer\nSpeaker: Kendall Ellis'),
    'Rev. Jonathan Balmer',
  );
});

test('isPersonName', () => {
  assert.ok(isPersonName('Rev. Jonathan Balmer'));
  assert.ok(isPersonName('Jim Butler'));
  assert.ok(isPersonName('Mary-Anne O’Brien'));
  assert.ok(isPersonName('Rev. Anna van der Berg'));
  assert.ok(!isPersonName('Pastor'));
  assert.ok(!isPersonName('jonathan balmer'));
  assert.ok(!isPersonName('Jo'));
  assert.ok(!isPersonName('office@fbcmuncie.org'));
});

// ── previewPreacher: a sermon preview's author ─────────────────────────────

test("a preview's author names its preacher, the church's own account nobody", () => {
  assert.equal(previewPreacher('Jonathan Balmer'), 'Jonathan Balmer');
  assert.equal(previewPreacher(' Kendall  Ellis '), 'Kendall Ellis');
  assert.equal(previewPreacher('FBC Muncie'), '');
  assert.equal(previewPreacher('First Baptist Church Muncie'), '');
  assert.equal(previewPreacher('FBCM Staff'), '');
  assert.equal(previewPreacher(''), '');
  assert.equal(previewPreacher(null), '');
});

// ── thisSundayPreacher: the order of sources ───────────────────────────────

test('the preview wins, then the broadcast, and a source for another Sunday is ignored', () => {
  const pv = { sunday: '2026-09-27', name: 'Kendall Ellis' };
  const yt = { sunday: '2026-09-27', name: 'Rev. Jonathan Balmer' };
  assert.deepEqual(thisSundayPreacher('2026-09-27', pv, yt), {
    sunday: '2026-09-27',
    name: 'Kendall Ellis',
    source: 'preview',
  });
  assert.deepEqual(thisSundayPreacher('2026-09-27', null, yt), {
    sunday: '2026-09-27',
    name: 'Rev. Jonathan Balmer',
    source: 'youtube',
  });
  // A preview for the Sunday that names nobody falls through to the broadcast.
  assert.equal(thisSundayPreacher('2026-09-27', { ...pv, name: '' }, yt)?.source, 'youtube');
  assert.equal(thisSundayPreacher('2026-09-27', { ...pv, sunday: '2026-09-20' }, null), null);
  assert.equal(thisSundayPreacher('2026-10-04', pv, yt), null);
  assert.equal(thisSundayPreacher('2026-09-27', null, null), null);
  assert.equal(thisSundayPreacher(null, pv, yt), null);
});

// ── upcomingPreacher: the broadcast in the feed ────────────────────────────

const THURSDAY = new Date('2026-09-24T16:00:00Z'); // noon, church time

test("the fixture's scheduled broadcast names this Sunday's preacher", () => {
  assert.deepEqual(upcomingPreacher(parseYoutubeFeed(FIXTURE), THURSDAY), {
    sunday: '2026-09-27',
    name: 'Rev. Jonathan Balmer',
  });
});

test('no scheduled broadcast, or no Preaching line on it, names nobody', () => {
  const entries = parseYoutubeFeed(FIXTURE);
  // Monday: the coming Sunday is October 4, which has no broadcast yet.
  assert.equal(upcomingPreacher(entries, new Date('2026-09-28T14:00:00Z')), null);
  const bare = entries.map((e) => ({ ...e, description: "This week's Sermon." }));
  assert.equal(upcomingPreacher(bare, THURSDAY), null);
  assert.equal(upcomingPreacher([], THURSDAY), null);
});

test('the name does not depend on the title splitting, and two names name nobody', () => {
  const base: FeedEntry = {
    videoId: 'aaaaaaaaaaa',
    title: 'Sunday Worship Service',
    published: '2026-09-23T18:03:21+00:00',
    views: 0,
    description: 'Preaching: Rev. Jonathan Balmer',
  };
  assert.equal(upcomingPreacher([base], THURSDAY)?.name, 'Rev. Jonathan Balmer');
  // The same name twice is one name.
  assert.equal(
    upcomingPreacher([base, { ...base, videoId: 'bbbbbbbbbbb' }], THURSDAY)?.name,
    'Rev. Jonathan Balmer',
  );
  assert.equal(
    upcomingPreacher(
      [base, { ...base, videoId: 'bbbbbbbbbbb', description: 'Speaker: Kendall Ellis' }],
      THURSDAY,
    ),
    null,
  );
  // A replay (views) is never the coming Sunday's broadcast.
  assert.equal(upcomingPreacher([{ ...base, views: 12 }], THURSDAY), null);
  // An upload published after the build's moment is not trusted.
  assert.equal(upcomingPreacher([base], new Date('2026-09-23T12:00:00Z')), null);
});

// ── sundayFactKept: the stale check ─────────────────────────────────────────

test('the fact is kept through its Sunday and dropped once the line names the next', () => {
  // Local-time instants: the check reads the visitor's calendar, like the line.
  assert.equal(sundayFactKept(new Date(2026, 8, 24, 12), '2026-09-27'), true); // Thursday
  assert.equal(sundayFactKept(new Date(2026, 8, 27, 11), '2026-09-27'), true); // the Sunday
  assert.equal(sundayFactKept(new Date(2026, 8, 27, 23, 59), '2026-09-27'), true);
  assert.equal(sundayFactKept(new Date(2026, 8, 28, 0, 1), '2026-09-27'), false); // Monday
  assert.equal(sundayFactKept(new Date(2026, 8, 20, 12), '2026-09-27'), false); // a week early
  assert.equal(sundayFactKept(new Date(2026, 8, 24, 12), ''), false);
});
