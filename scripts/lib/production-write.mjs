// scripts/lib/production-write.mjs
//
// The production second factor for the data scripts that do NOT go through
// scripts/lib/sanity-lib.mjs (PORTS.md card 86, 2026-10-13).
//
// sanity-lib refuses `--apply` on the `production` dataset unless the same
// command sets NCS_PRODUCTION_WRITE=yes. That covers every script built on it
// that writes under `--apply`. It does not cover a script that builds its own
// client (seed-core, seed-pages, the module seeds, apply-asset-patches,
// import-content) or one that imports sanity-lib but writes under its own
// `--write` flag (connect-ministries and friends), because sanity-lib only
// looks for `--apply`. Those call `requireProductionWrite()` right before
// their first write, so the rule is the same everywhere:
//
//   1. Dry by default. Without the write flag a script prints its plan.
//   2. On the `production` dataset the write flag is not enough: the run also
//      needs NCS_PRODUCTION_WRITE=yes in the real process environment.
//
// It reads `process.env` DIRECTLY, never the loadEnv() merge, so the variable
// cannot be parked in `.env` and forgotten. This file imports nothing, so it
// can be unit-tested without a token (scripts/lib/production-write.test.mjs);
// test a guard against https://example.invalid or with the pure check, never
// against production.
//
//   node scripts/x.mjs                                    # dry run
//   NCS_PRODUCTION_WRITE=yes node scripts/x.mjs --apply   # write to production
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/x.mjs --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
//
// Not PORTABLE: the starter has no script that needs it (its seed-core moved
// onto sanity-lib). If the family adopts it, it moves to the starter.

/**
 * Pure: why this run may not write, or null when it may. `write` is whether the
 * script's own write flag was passed; a dry run always may (it writes nothing).
 * A non-production dataset needs only the flag.
 */
export function productionWriteRefusal({ write, dataset, processEnv, flag = '--apply' }) {
  if (!write || dataset !== 'production') return null;
  if (processEnv.NCS_PRODUCTION_WRITE === 'yes') return null;
  return [
    `Refusing to write: ${flag} targets the production dataset, and ${flag} alone is not enough.`,
    'Set NCS_PRODUCTION_WRITE=yes in the same command, after a backup and a dry run',
    `(bash: NCS_PRODUCTION_WRITE=yes node <script> ${flag}). A delegated agent may set it only under the write protocol (backup, dry run, apply, verify).`,
    `Run without ${flag} to see the plan. PORTS.md card 86.`,
  ].join('\n');
}

/**
 * Exit 2, before any request, when this run may not write. Call it once the
 * dataset is known and before the first write (or upload, or backup that only
 * a write needs). It reads process.env itself.
 */
export function requireProductionWrite({ write, dataset, flag = '--apply' }) {
  const refusal = productionWriteRefusal({ write, dataset, processEnv: process.env, flag });
  if (refusal) {
    console.error(refusal);
    process.exit(2);
  }
}
