import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHURCH_GOALS, goalHref, goalIndexLine } from './church-goals.ts';

test('the four goals are the church order, each with its building glyph and anchor', () => {
  assert.deepEqual(
    CHURCH_GOALS.map((g) => [g.value, g.name, g.glyph, goalHref(g.value)]),
    [
      ['worship', 'Worship', 'window', '/who-we-are#worship'],
      ['the-way', 'The Way', 'door', '/who-we-are#the-way'],
      ['witness', 'Witness', 'rose', '/who-we-are#witness'],
      ['work', 'Work', 'basin', '/who-we-are#work'],
    ],
  );
});

test('the small line is the aside where there is one, else the subtitle', () => {
  assert.deepEqual(CHURCH_GOALS.map(goalIndexLine), [
    'Worshiping as the Body of Christ',
    'Discipleship',
    'Evangelism',
    'Acts of Mercy',
  ]);
});
