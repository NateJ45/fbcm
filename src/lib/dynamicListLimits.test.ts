// =============================================================================
// dynamicListLimits - the DRIFT GATE for the dynamicListSection cap
// =============================================================================
// The schema's "how many to show" field (richSections.ts, R.max()) and the GROQ
// slice bound that fetches candidates for it (queries.ts, [0...N]) have to be the
// SAME NUMBER: the query has to fetch at least as many candidates as the highest
// limit an editor can pick, or a high `limit` would quietly under-serve.
//
// GROQ slice bounds cannot be field references (that used to be
// "[0...limit]" with `limit` read straight off the document, which is a query
// PARSE ERROR -- see the 2026-09-18 comment in queries.ts), so both sides now
// import DYNAMIC_LIST_MAX from this module instead of each hardcoding a
// literal. This test reads both source files as text (importing richSections.ts
// directly would pull in the `sanity` schema builder for no reason, the same
// tradeoff section-fields.test.ts makes for the same reason) and fails if either
// one stops referencing the shared constant, or if the constant itself drifts
// out of the schema's stated minimum.
// =============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DYNAMIC_LIST_MAX } from './dynamicListLimits.ts';

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

test('DYNAMIC_LIST_MAX is a sane positive integer at or above the schema minimum of 3', () => {
  assert.ok(Number.isInteger(DYNAMIC_LIST_MAX));
  assert.ok(DYNAMIC_LIST_MAX >= 3);
});

test('the dynamicListSection "limit" field validates against the shared constant, not a literal', () => {
  const src = read('../sanity/schemaTypes/richSections.ts');
  const limitField = src.match(
    // `\s*` between the calls: prettier breaks a long chain one call per line.
    /name:\s*'limit'[\s\S]*?validation:\s*\(R\)\s*=>\s*R\.required\(\)\s*\.min\((\d+)\)\s*\.max\(([^)]+)\)/,
  );
  assert.ok(limitField, 'could not find the limit field validation in richSections.ts');
  const [, minLiteral, maxExpression] = limitField;
  assert.equal(Number(minLiteral), 3, 'schema minimum drifted from the documented 3');
  assert.equal(
    maxExpression.trim(),
    'DYNAMIC_LIST_MAX',
    'the limit field must validate against the imported DYNAMIC_LIST_MAX constant, ' +
      'not a second hardcoded literal that can drift from the query slice bound',
  );
  assert.match(
    src,
    /import\s*\{\s*DYNAMIC_LIST_MAX\s*\}\s*from\s*['"][^'"]*dynamicListLimits['"]/,
    'richSections.ts must import DYNAMIC_LIST_MAX from dynamicListLimits.ts',
  );
});

test('the journal source GROQ slice bound uses the shared constant, not a field reference or a literal', () => {
  const src = read('../lib/queries.ts');
  assert.match(
    src,
    /\[0\.\.\.\$\{DYNAMIC_LIST_MAX\}\]/,
    'the journal dynamicListSection query must slice with ${DYNAMIC_LIST_MAX}. ' +
      'A field reference ("[0...limit]") is a GROQ parse error that kills the whole ' +
      'home-page query, and a hardcoded literal can silently drift from the schema max.',
  );
  assert.match(
    src,
    /import\s*\{\s*DYNAMIC_LIST_MAX\s*\}\s*from\s*['"]\.\/dynamicListLimits['"]/,
    'queries.ts must import DYNAMIC_LIST_MAX from ./dynamicListLimits',
  );
});
