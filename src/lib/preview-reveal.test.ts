import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finishReveals, REVEAL_FINISHED } from './preview-reveal.ts';
import { CLIENT_STATE_CLASSES } from './preview-morph.ts';

/** A fake element with a class set, and a document that answers by selector. */
const el = () => {
  const set = new Set<string>();
  return { set, classList: { add: (c: string) => set.add(c) } };
};

test('every reveal still at its start is marked finished', () => {
  const arch = el();
  const draw = el();
  const grid = el();
  const bySelector: Record<string, ReturnType<typeof el>[]> = {
    '[data-reveal]:not(.is-visible)': [arch, draw],
    'svg[data-reveal="draw"]:not(.is-drawn)': [draw],
    '[data-stagger-grid]:not(.is-staggered)': [grid],
  };
  const n = finishReveals({ querySelectorAll: (s) => bySelector[s] ?? [] });
  assert.equal(n, 4);
  assert.deepEqual([...arch.set], ['is-visible']);
  assert.deepEqual([...draw.set].sort(), ['is-drawn', 'is-visible']);
  assert.deepEqual([...grid.set], ['is-staggered']);
});

test('every class it adds is one the preview morph keeps across a refresh', () => {
  for (const [, cls] of REVEAL_FINISHED) assert.ok(CLIENT_STATE_CLASSES.includes(cls), cls);
});
