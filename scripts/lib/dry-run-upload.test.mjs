import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uploadClient } from './dry-run-upload.mjs';

const real = { assets: { upload: () => 'real' } };

test('a dry run gets a client whose upload throws, naming the module and file', () => {
  const saved = process.argv;
  process.argv = ['node', 'seed-pages.mjs', '--only', 'beliefs'];
  try {
    const c = uploadClient(real, 'beliefs.mjs', '../fbcm-archive/files/a.pdf');
    assert.notEqual(c, real);
    assert.throws(
      () => c.assets.upload(),
      /beliefs\.mjs: "..\/fbcm-archive\/files\/a\.pdf".*dry run never uploads/,
    );
  } finally {
    process.argv = saved;
  }
});

test('--apply gets the real client', () => {
  const saved = process.argv;
  process.argv = ['node', 'seed-pages.mjs', '--only', 'beliefs', '--apply'];
  try {
    assert.equal(uploadClient(real, 'beliefs.mjs', 'x.pdf'), real);
  } finally {
    process.argv = saved;
  }
});
