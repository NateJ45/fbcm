// Tests for the production second factor in the scripts that do not go
// through sanity-lib (scripts/lib/production-write.mjs, PORTS.md card 86).
//
// The guard is NEVER tested against production. Every child process below gets
// a fake project, a fake token, PUBLIC_SANITY_DATASET=production and
// SANITY_API_HOST=https://example.invalid (a reserved name that cannot
// resolve), all in process.env, which wins over the repo's real .env in both
// loadEnv and dotenv. So even a run that passes the guard cannot reach Sanity.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { productionWriteRefusal } from './production-write.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const FAKE = {
  PUBLIC_SANITY_PROJECT_ID: 'fake0000',
  SANITY_API_WRITE_TOKEN: 'fake-token',
  PUBLIC_SANITY_DATASET: 'production',
  SANITY_API_HOST: 'https://example.invalid',
};

test('a dry run never needs the second factor', () => {
  assert.equal(
    productionWriteRefusal({ write: false, dataset: 'production', processEnv: {} }),
    null,
  );
});

test('the write flag on production without NCS_PRODUCTION_WRITE is refused, naming the flag', () => {
  const r = productionWriteRefusal({
    write: true,
    dataset: 'production',
    processEnv: {},
    flag: '--write',
  });
  assert.match(r, /NCS_PRODUCTION_WRITE=yes/);
  assert.match(r, /--write alone is not enough/);
});

test('only the exact value "yes" opens it', () => {
  for (const v of ['1', 'true', 'YES', ' yes', '']) {
    assert.notEqual(
      productionWriteRefusal({
        write: true,
        dataset: 'production',
        processEnv: { NCS_PRODUCTION_WRITE: v },
      }),
      null,
      `value ${JSON.stringify(v)} must not open the guard`,
    );
  }
  assert.equal(
    productionWriteRefusal({
      write: true,
      dataset: 'production',
      processEnv: { NCS_PRODUCTION_WRITE: 'yes' },
    }),
    null,
  );
});

test('a non-production dataset needs only the write flag', () => {
  assert.equal(productionWriteRefusal({ write: true, dataset: 'staging', processEnv: {} }), null);
});

// --- the real scripts, in child processes, against https://example.invalid ---
function run(script, args, extraEnv = {}) {
  const env = { ...process.env, ...FAKE, ...extraEnv };
  if (extraEnv.NCS_PRODUCTION_WRITE === undefined) delete env.NCS_PRODUCTION_WRITE;
  return spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    timeout: 60_000,
  });
}

const REFUSED = [
  ['scripts/seed-core.mjs', ['--apply']],
  ['scripts/seed-pages.mjs', ['--apply']],
  ['modules/events/seed.mjs', ['--apply']],
  ['modules/resources/seed.mjs', ['--apply']],
  // Imports sanity-lib, but writes under its own --write flag, which
  // sanity-lib's --apply check does not see.
  ['scripts/place-ministry-photos.mjs', ['--write']],
  ['scripts/retire-featured-flag.mjs', ['--write']],
];

for (const [script, args] of REFUSED) {
  test(`${script} ${args.join(' ')} exits 2 before any request without the second factor`, () => {
    const r = run(script, args);
    assert.equal(r.status, 2, r.stderr + r.stdout);
    assert.match(r.stderr, /Refusing to write/);
    assert.doesNotMatch(r.stdout + r.stderr, /example\.invalid|ENOTFOUND|EAI_AGAIN|fetch failed/);
  });
}

test('with NCS_PRODUCTION_WRITE=yes seed-core passes the guard and reaches the (fake) host', () => {
  const r = run('scripts/seed-core.mjs', ['--only', 'siteSettings', '--apply'], {
    NCS_PRODUCTION_WRITE: 'yes',
  });
  assert.doesNotMatch(r.stderr, /Refusing to write/);
  // example.invalid cannot resolve, so the first request fails: proof it was attempted.
  assert.notEqual(r.status, 0, r.stderr + r.stdout);
  assert.notEqual(r.status, 2, r.stderr + r.stdout);
  assert.match(r.stdout + r.stderr, /ENOTFOUND|EAI_AGAIN|example\.invalid|fetch failed/);
});

test('a bare module seed is a dry run that names its documents and makes no request', () => {
  const r = run('modules/events/seed.mjs', [], { NCS_PRODUCTION_WRITE: 'yes' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /DRY RUN: would create or replace 4: eventsPage/);
  assert.match(r.stdout, /Nothing was written/);
});
