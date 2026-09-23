// Safe to edit by hand.
// Guard for the `@source not` exclusions in src/styles/globals.css that point
// INSIDE src/. Tailwind generates a utility only when it finds the class in a
// scanned file, so a component that is excluded there and later imported would
// render with its classes silently missing from the stylesheet. This test makes
// that trap loud: nothing under src/ may import a file the stylesheet has told
// Tailwind to skip. Added 2026-09-23 with the dead-CSS trim.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const STYLES_DIR = path.resolve('src/styles');
const SRC = path.resolve('src');

/** Absolute paths of every `@source not` target that lies inside src/. */
function excludedInsideSrc(): string[] {
  const css = readFileSync(path.join(STYLES_DIR, 'globals.css'), 'utf8');
  const out: string[] = [];
  for (const m of css.matchAll(/^@source not '([^']+)';/gm)) {
    const abs = path.resolve(STYLES_DIR, m[1]);
    if (abs.startsWith(SRC + path.sep) && !abs.includes('*')) out.push(abs);
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|tsx?|mjs|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

/** Resolve an import specifier from `file` to an absolute path (no extension). */
function resolveSpecifier(file: string, spec: string): string | null {
  if (spec.startsWith('@/')) return path.join(SRC, spec.slice(2));
  if (spec.startsWith('.')) return path.resolve(path.dirname(file), spec);
  return null;
}

const stripExt = (p: string) => p.replace(/\.(astro|tsx?|mjs|jsx?)$/, '');
const isInside = (p: string, target: string) => {
  const t = stripExt(target);
  const q = stripExt(p);
  return q === t || q.startsWith(t + path.sep);
};

describe('globals.css @source not exclusions inside src/', () => {
  const excluded = excludedInsideSrc();

  it('finds the exclusions it is guarding', () => {
    assert.ok(excluded.length > 0, 'expected at least one @source not inside src/');
  });

  it('every excluded path exists (a stale line would hide a rename)', () => {
    for (const p of excluded) assert.doesNotThrow(() => statSync(p), `missing: ${p}`);
  });

  it('nothing outside an excluded path imports into one', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      if (excluded.some((e) => isInside(file, e))) continue;
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)) {
        const abs = resolveSpecifier(file, m[1]);
        if (!abs) continue;
        const hit = excluded.find((e) => isInside(abs, e));
        if (hit) offenders.push(`${path.relative(SRC, file)} imports ${m[1]}`);
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'A file excluded from Tailwind scanning in globals.css is now imported. Delete its `@source not` line.',
    );
  });
});
