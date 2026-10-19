// Safe to edit by hand
// The Quick update tool publishes these documents without the Studio's
// validation, so this checks each builder returns a whole, valid announcement.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNewsPost,
  buildNotice,
  buildSermonPreview,
  endOfDay,
  EVENTS_CATEGORY_ID,
  noticeName,
  NOTICE_MAX,
  paragraphsOf,
  postSlug,
  SERMON_PREVIEW_CATEGORY_ID,
} from './quick-updates.ts';
import { readingOf, sundayOf, isoDay } from './sermon-derive.ts';
import { previewPreacher } from './preacher.ts';

describe('quick updates', () => {
  it('a notice has every field the announcement needs', () => {
    const doc = buildNotice({ message: '  Fall festival  this Saturday ', lastDay: '2026-10-24' });
    assert.equal(doc._type, 'announcement');
    assert.equal(doc.message, 'Fall festival this Saturday');
    assert.equal(doc.style, 'info');
    assert.equal(doc.enabled, true);
    assert.ok(doc.internalTitle.length > 0);
    assert.equal(doc.endDate, endOfDay('2026-10-24'));
    assert.equal(doc.link, undefined);
  });

  it('keeps a link only when the schema would accept it', () => {
    assert.deepEqual(
      buildNotice({ message: 'x', lastDay: '2026-10-24', link: 'https://example.org' }).link,
      { label: 'Find out more', url: 'https://example.org' },
    );
    assert.equal(
      buildNotice({ message: 'x', lastDay: '2026-10-24', link: '/visit/' }).link?.url,
      '/visit/',
    );
    assert.equal(
      buildNotice({ message: 'x', lastDay: '2026-10-24', link: 'example.org' }).link,
      undefined,
    );
  });

  it('a change this week is urgent', () => {
    assert.equal(
      buildNotice({ message: 'No study', lastDay: '2026-10-25' }, 'urgent').style,
      'urgent',
    );
  });

  it('never goes over the message limit', () => {
    const doc = buildNotice({ message: 'a'.repeat(400), lastDay: '2026-10-24' });
    assert.ok(doc.message.length <= NOTICE_MAX);
  });

  it('names a long notice by its first words', () => {
    const name = noticeName('word '.repeat(30), '2026-10-24');
    assert.ok(name.endsWith('(until 2026-10-24)'));
    assert.ok(name.length < 70);
  });

  // ── Posts from a phone (2026-10-19) ──────────────────────────────────────
  const tuesday = new Date('2026-10-20T15:00:00Z');

  it('a sermon preview is a whole post the home page reads as this Sunday', () => {
    const doc = buildSermonPreview(
      {
        title: '  Bread for the  journey ',
        passage: 'John 6:35-40.',
        preacher: 'Sam Example',
        summary: 'What does it mean to be fed?\nCome and find out.',
        more: 'First thought.\n\nSecond thought,\nstill second.',
      },
      tuesday,
    );
    assert.equal(doc._type, 'journalEntry');
    assert.equal(doc.title, 'Bread for the journey');
    assert.equal(doc.slug.current, 'bread-for-the-journey');
    assert.equal(doc.excerpt, 'What does it mean to be fed? Come and find out.');
    assert.equal(doc.categories[0]._ref, SERMON_PREVIEW_CATEGORY_ID);
    assert.equal(doc.author, 'Sam Example');
    assert.equal(doc.body.length, 4);
    // The site derives the reading, the Sunday and the preacher from these.
    const opening = doc.body.map((b) => b.children[0].text).join('\n');
    assert.equal(readingOf(opening), 'John 6:35-40');
    assert.equal(isoDay(sundayOf(doc.publishedAt)!), '2026-10-25');
    assert.equal(previewPreacher(doc.author), 'Sam Example');
    for (const b of doc.body) assert.ok(b._key && b.children[0]._key);
  });

  it('a sermon preview with no preacher has no byline', () => {
    const doc = buildSermonPreview({ title: 'T', passage: 'Psalm 23:1-6', summary: 's' }, tuesday);
    assert.equal(doc.author, undefined);
  });

  it('a news post is filed under events and keeps a real link only', () => {
    const doc = buildNewsPost(
      { title: 'Trunk or Treat', summary: 'Saturday at 5.', link: 'https://example.org/t' },
      tuesday,
    );
    assert.equal(doc.categories[0]._ref, EVENTS_CATEGORY_ID);
    const last = doc.body[doc.body.length - 1];
    assert.equal(last.children[0].text, 'Find out more');
    assert.deepEqual(last.markDefs[0], {
      _type: 'link',
      _key: last.children[0].marks[0],
      href: 'https://example.org/t',
    });
    assert.equal(
      buildNewsPost({ title: 'x', summary: 'y', link: 'example.org' }, tuesday).body.length,
      1,
    );
  });

  it('keeps titles and summaries inside the schema limits', () => {
    const doc = buildNewsPost({ title: 'a'.repeat(300), summary: 'b'.repeat(400) }, tuesday);
    assert.ok(doc.title.length <= 120);
    assert.ok(doc.excerpt.length <= 220);
  });

  it('a taken web address gets the date added', () => {
    assert.equal(postSlug('Advent Hope!', '2026-11-29'), 'advent-hope');
    assert.equal(postSlug('Advent Hope!', '2026-11-29', true), 'advent-hope-2026-11-29');
    assert.equal(postSlug('!!!', '2026-11-29'), 'post');
  });

  it('splits typed text into paragraphs at blank lines', () => {
    assert.deepEqual(paragraphsOf('a\nb\n\n\nc '), ['a b', 'c']);
    assert.deepEqual(paragraphsOf(undefined), []);
  });
});
