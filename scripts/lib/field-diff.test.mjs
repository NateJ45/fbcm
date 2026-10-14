// Tests for scripts/lib/field-diff.mjs: the nested paths seed-pages prints in
// its dry run, and the docs/PENDING.md "apply only after approval" check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changedPaths, approvalGatedPaths, gatedHits } from './field-diff.mjs';

const hero = (note) => ({
  _key: 'home-hero',
  _type: 'heroSection',
  headline: 'Welcome',
  facts: [
    { _key: 'fact-1', _type: 'heroFact', label: 'Sundays', value: '10:45', ...note },
    { _key: 'fact-2', _type: 'heroFact', label: 'Where', value: 'Adams St' },
  ],
});

test('a nested field inside a keyed block is named by its full path (the 2026-09-28 miss)', () => {
  const live = { _id: 'homePage', _rev: 'a', pageBuilder: [hero({})] };
  const next = {
    _id: 'homePage',
    pageBuilder: [hero({ note: 'Intergenerational, casual dress welcome' })],
  };
  assert.deepEqual(changedPaths(live, next, { skip: ['_rev'] }), [
    'pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note (added)',
  ]);
});

test('equal documents, and key order, give no paths', () => {
  assert.deepEqual(changedPaths({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 }), []);
});

test('added, removed, reordered and unkeyed arrays', () => {
  const a = {
    list: [
      { _key: 'x', v: 1 },
      { _key: 'y', v: 2 },
    ],
    tags: ['a', 'b'],
  };
  const b = {
    list: [
      { _key: 'y', v: 2 },
      { _key: 'z', v: 3 },
    ],
    tags: ['a', 'c', 'd'],
  };
  assert.deepEqual(changedPaths(a, b), [
    'list[_key=="x"] (removed)',
    'list[_key=="z"] (added)',
    'tags[1]',
    'tags[2] (added)',
  ]);
  const r = changedPaths(
    { l: [{ _key: 'x' }, { _key: 'y' }] },
    { l: [{ _key: 'y' }, { _key: 'x' }] },
  );
  assert.deepEqual(r, ['l (order)']);
});

test('skip drops system keys at the top level only', () => {
  assert.deepEqual(
    changedPaths(
      { _rev: '1', _system: { a: 1 }, t: 'x' },
      { _rev: '2', t: 'y' },
      {
        skip: ['_rev', '_system'],
      },
    ),
    ['t'],
  );
});

const PENDING = `
### This Sunday's preacher

- [ ] #nathan **Deploy before applying: this branch adds a schema field.** \`heroFact.note\`
      one field of the live \`homePage\`:
      \`pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note\`, from nothing to
      "Intergenerational, casual dress welcome". Apply only after the church approves it.
- [x] Closed: \`pageBuilder[_key=="old"].x\`. Apply only after approval.
- An open note with no gate: \`pageBuilder[_key=="free"].y\`.
`;

test('PENDING.md: open "apply only after" items hold their backticked paths back', () => {
  const gated = approvalGatedPaths(PENDING);
  assert.ok(gated.includes('pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note'));
  assert.ok(gated.includes('heroFact.note'));
  assert.ok(!gated.includes('homePage'), 'a bare document name is not a path');
  assert.ok(!gated.some((p) => p.includes('"old"')), 'a ticked item holds nothing back');
  assert.ok(!gated.some((p) => p.includes('"free"')), 'no "apply only after", no gate');
});

test('gatedHits matches the path itself, anything inside it, and a whole block above it', () => {
  const gated = ['pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note'];
  assert.deepEqual(
    gatedHits(
      [
        'pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note (added)',
        'pageBuilder[_key=="home-hero"] (removed)',
        'pageBuilder[_key=="home-hero"].headline',
        'pageBuilder[_key=="home-hero"].facts[_key=="fact-10"].note',
      ],
      gated,
    ),
    [
      'pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note (added)',
      'pageBuilder[_key=="home-hero"] (removed)',
    ],
  );
});
