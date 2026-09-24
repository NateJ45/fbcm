// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOALS, goalFor, goalHref, goalIndex } from './ministry-goals.ts';
import type { ProjectedMinistrySection } from './pageBuilder.types';

const band = (
  key: string,
  ministry: ProjectedMinistrySection['ministry'],
  anchor: string | null = key,
): ProjectedMinistrySection => ({
  _type: 'ministrySection',
  _key: `ministries-${key}`,
  anchor: anchor ? { current: anchor } : null,
  ministry,
});

test('the four goals are the church order, each with its building glyph', () => {
  assert.deepEqual(
    GOALS.map((g) => [g.value, g.name, g.glyph]),
    [
      ['worship', 'Worship', 'window'],
      ['the-way', 'The Way', 'door'],
      ['witness', 'Witness', 'rose'],
      ['work', 'Work', 'basin'],
    ],
  );
  // The values are GoalsBand's ids on Who We Are, so the link lands on the goal.
  assert.equal(goalHref('the-way'), '/who-we-are#the-way');
});

test('goalFor reads the stored value, cleaned of a stega payload; blank or unknown is null', () => {
  const stega = String.fromCharCode(0x200b, 0x200c, 0x200b, 0x200c, 0x200b, 0x200c);
  assert.equal(goalFor(`the-way${stega}`)?.name, 'The Way');
  assert.equal(goalFor('Work')?.value, 'work');
  assert.equal(goalFor(''), null);
  assert.equal(goalFor(null), null);
  assert.equal(goalFor('missions'), null);
});

test('goalIndex lists each ministry under its goal, in page order, labelled as its band is', () => {
  const index = goalIndex([
    band('worship', { title: 'Worship', eyebrow: 'Worship arts', goal: 'worship' }),
    band('children', { title: 'Children', eyebrow: 'Children', goal: null }),
    band('youth', { title: 'Youth', eyebrow: 'Youth', goal: 'the-way' }),
    band('adult', { title: 'Adult', eyebrow: 'Adults', goal: 'the-way' }),
    band('outreach', { title: 'Outreach', goal: '' }),
  ]);
  assert.equal(index?._type, 'ministryGoalsIndex');
  assert.deepEqual(
    index?.goals.map((g) => [g.value, g.ministries.map((m) => `${m.label}#${m.anchor}`)]),
    [
      ['worship', ['Worship arts#worship']],
      ['the-way', ['Youth#youth', 'Adults#adult']],
      ['witness', []],
      ['work', []],
    ],
  );
});

test('the label falls back to the name; a band with no anchor is listed without a link', () => {
  const index = goalIndex([band('x', { title: 'Outreach', eyebrow: '  ', goal: 'work' }, null)]);
  assert.deepEqual(index?.goals[3].ministries, [{ label: 'Outreach' }]);
});

test('no goal named anywhere, or no ministry behind a band: no index', () => {
  assert.equal(goalIndex([band('a', { title: 'Worship' }), band('b', null)]), null);
  assert.equal(goalIndex([]), null);
});
