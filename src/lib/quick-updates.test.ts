// Safe to edit by hand
// The Quick update tool publishes these documents without the Studio's
// validation, so this checks each builder returns a whole, valid announcement.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildNotice, endOfDay, noticeName, NOTICE_MAX } from './quick-updates.ts';

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
});
