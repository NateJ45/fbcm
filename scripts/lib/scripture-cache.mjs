// scripts/lib/scripture-cache.mjs
//
// The two small machines behind scripts/fetch-scripture.mjs (2026-09-24,
// feat/scripture-text), split out so they can be tested without a network:
//
//   pool(items, limit, fn)   run fn over items with at most `limit` in flight
//   cached(opts)             a JSON value from the on-disk cache, or fetched,
//                            validated and written there
//
// THE CACHE lives in node_modules/.cache/scripture/ (the conventional home for
// a tool's cache: gitignored, per checkout, and kept by CI's npm cache step
// only when asked). One file per chapter or passage. A chapter of a
// public-domain translation never changes, so its entry has no age limit; a
// licensed translation's entry carries the provider's limit (API.Bible asks
// that cached text be cleared within 14 days). A value the validator rejects
// is never written, so a bad response cannot poison later builds.

import { mkdirSync, readFileSync, statSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Map `items` through async `fn`, at most `limit` at a time, keeping order.
 * A rejected call rejects the whole pool: callers catch inside `fn`.
 */
export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const width = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: width }, async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * The cached value at `dir/key.json` when it is present, parses, passes
 * `valid` and is younger than `maxAgeMs` (Infinity: no limit). Otherwise
 * `fetcher()` is called; a value that passes `valid` is written and returned
 * with `source: 'network'`, anything else returns `{ value: null }` and
 * writes nothing. `now` is injectable for tests.
 *
 * @returns {Promise<{ value: unknown, source: 'cache' | 'network' | 'none', error?: string }>}
 */
export async function cached({ dir, key, fetcher, valid, maxAgeMs = Infinity, now = Date.now() }) {
  const file = join(dir, `${key.replace(/[^A-Za-z0-9._-]/g, '_')}.json`);
  try {
    const age = now - statSync(file).mtimeMs;
    if (age <= maxAgeMs) {
      const value = JSON.parse(readFileSync(file, 'utf8'));
      if (valid(value)) return { value, source: 'cache' };
    }
  } catch {
    // absent, unreadable or not JSON: fetch it
  }
  let value;
  try {
    value = await fetcher();
  } catch (err) {
    return { value: null, source: 'none', error: String(err?.message ?? err) };
  }
  if (!valid(value)) return { value: null, source: 'none', error: 'response did not validate' };
  // Written to a temporary name and renamed, so an interrupted build never
  // leaves half a file for the next one to read.
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(value));
  renameSync(tmp, file);
  return { value, source: 'network' };
}
