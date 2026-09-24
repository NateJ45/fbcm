// The scripture fetch's pool and on-disk cache (feat/scripture-text).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pool, cached } from './scripture-cache.mjs';

test('pool keeps order and never runs more than the limit at once', async () => {
  let live = 0;
  let peak = 0;
  const out = await pool([5, 1, 4, 2, 3, 0, 6], 3, async (n) => {
    live += 1;
    peak = Math.max(peak, live);
    await new Promise((r) => setTimeout(r, n));
    live -= 1;
    return n * 10;
  });
  assert.deepEqual(out, [50, 10, 40, 20, 30, 0, 60]);
  assert.ok(peak <= 3, `peak ${peak}`);
  assert.deepEqual(await pool([], 4, async () => 1), []);
});

const valid = (v) => !!v && typeof v === 'object' && Array.isArray(v.verses);

test('cached fetches once, then reads the file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'scripture-'));
  try {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return { verses: [1, 2] };
    };
    const a = await cached({ dir, key: 'BSB/ROM.13', fetcher, valid });
    const b = await cached({ dir, key: 'BSB/ROM.13', fetcher, valid });
    assert.equal(a.source, 'network');
    assert.equal(b.source, 'cache');
    assert.deepEqual(b.value, { verses: [1, 2] });
    assert.equal(calls, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cached refetches an entry older than its limit', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'scripture-'));
  try {
    let calls = 0;
    const fetcher = async () => ({ verses: [++calls] });
    await cached({ dir, key: 'NIV', fetcher, valid, maxAgeMs: 1000 });
    const later = Date.now() + 5000;
    const b = await cached({ dir, key: 'NIV', fetcher, valid, maxAgeMs: 1000, now: later });
    assert.equal(b.source, 'network');
    assert.equal(calls, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a failed or invalid fetch writes nothing and returns null', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'scripture-'));
  try {
    const bad = await cached({ dir, key: 'x', fetcher: async () => ({ error: 1 }), valid });
    assert.equal(bad.value, null);
    assert.equal(bad.source, 'none');
    const thrown = await cached({
      dir,
      key: 'y',
      fetcher: async () => {
        throw new Error('HTTP 503');
      },
      valid,
    });
    assert.equal(thrown.value, null);
    assert.match(thrown.error, /503/);
    assert.deepEqual(readdirSync(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a corrupt cache file is refetched, not trusted', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'scripture-'));
  try {
    writeFileSync(join(dir, 'z.json'), '{not json');
    const r = await cached({ dir, key: 'z', fetcher: async () => ({ verses: [] }), valid });
    assert.equal(r.source, 'network');
    assert.ok(existsSync(join(dir, 'z.json')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
