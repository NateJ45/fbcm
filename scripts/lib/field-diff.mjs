// scripts/lib/field-diff.mjs
//
// Nested field paths that differ between a live document and the one a seed
// would write, and the check against docs/PENDING.md (2026-10-13).
//
// WHY. On 2026-09-28 `seed-pages --only home` printed `pageBuilder: [0]
// heroSection`, and the apply also wrote `facts[fact-1].note`, a sentence still
// waiting on the church's approval. A page module writes its whole section, so
// every pending field inside it rides along, and a block-level line hides it
// (vault gotcha `dry-run-summaries-hide-nested-fields`). This names every leaf
// that changes, in the same notation docs/PENDING.md uses
// (`pageBuilder[_key=="home-hero"].facts[_key=="fact-1"].note`), and flags the
// ones PENDING.md says to apply only after approval.
//
// Pure: no fs, no Sanity. Unit-tested in scripts/lib/field-diff.test.mjs.

/** Stable stringify: sorted keys, so key ORDER is never mistaken for a change. */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const keyed = (arr) =>
  arr.every((x) => isObject(x) && typeof x._key === 'string') &&
  new Set(arr.map((x) => x._key)).size === arr.length;

function join(prefix, k) {
  return prefix ? `${prefix}.${k}` : k;
}

/**
 * Every leaf path whose value differs between `a` (live) and `b` (new).
 * Objects recurse by key; arrays whose items all carry a unique `_key` recurse
 * by `[_key=="..."]` (so a reorder is one line, not a path per item), other
 * arrays by index. A path present on one side only is tagged ` (added)` or
 * ` (removed)`. `skip` names top-level keys to ignore (Sanity's system fields).
 */
export function changedPaths(a, b, { prefix = '', skip = [] } = {}) {
  if (canonical(a) === canonical(b)) return [];
  const out = [];
  if (isObject(a) && isObject(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .filter((k) => !(prefix === '' && skip.includes(k)))
      .sort();
    for (const k of keys) {
      const path = join(prefix, k);
      if (!(k in a)) out.push(`${path} (added)`);
      else if (!(k in b)) out.push(`${path} (removed)`);
      else out.push(...changedPaths(a[k], b[k], { prefix: path }));
    }
    return out;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (keyed(a) && keyed(b)) {
      const ka = a.map((x) => x._key);
      const kb = b.map((x) => x._key);
      const shared = ka.filter((k) => kb.includes(k));
      if (shared.join('\n') !== kb.filter((k) => ka.includes(k)).join('\n')) {
        out.push(`${prefix} (order)`);
      }
      for (const k of [...new Set([...ka, ...kb])]) {
        const path = `${prefix}[_key=="${k}"]`;
        const x = a.find((i) => i._key === k);
        const y = b.find((i) => i._key === k);
        if (!x) out.push(`${path} (added)`);
        else if (!y) out.push(`${path} (removed)`);
        else out.push(...changedPaths(x, y, { prefix: path }));
      }
      return out;
    }
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      const path = `${prefix}[${i}]`;
      if (i >= a.length) out.push(`${path} (added)`);
      else if (i >= b.length) out.push(`${path} (removed)`);
      else out.push(...changedPaths(a[i], b[i], { prefix: path }));
    }
    return out;
  }
  return [prefix || '(document)'];
}

/**
 * The field paths docs/PENDING.md holds back: every backticked path (one that
 * contains `[_key==` or a dot) inside a list item that says "apply only after"
 * and is still open (`- [ ]`) or is plain prose. A closed item (`- [x]`) no
 * longer holds anything back.
 */
export function approvalGatedPaths(markdown) {
  const items = [];
  let current = null;
  for (const line of String(markdown).split(/\r?\n/)) {
    if (/^\s*-\s/.test(line)) {
      current = { text: line };
      items.push(current);
    } else if (current && /^\s+\S/.test(line)) {
      current.text += `\n${line}`;
    } else {
      current = null;
    }
  }
  const paths = new Set();
  for (const { text } of items) {
    if (!/apply only after/i.test(text)) continue;
    if (/^\s*-\s\[x\]/i.test(text)) continue;
    for (const m of text.matchAll(/`([^`\n]+)`/g)) {
      const p = m[1].trim();
      if (/\[_key==|^[A-Za-z_][\w]*\.[A-Za-z_]/.test(p) && !/\s/.test(p)) paths.add(p);
    }
  }
  return [...paths];
}

/** Changed paths that touch a held-back path (equal, inside it, or above it). */
export function gatedHits(changed, gated) {
  const bare = (p) => p.replace(/ \((added|removed|order)\)$/, '');
  return changed.filter((c) => {
    const p = bare(c);
    return gated.some(
      (g) =>
        p === g ||
        p.startsWith(`${g}.`) ||
        p.startsWith(`${g}[`) ||
        g.startsWith(`${p}.`) ||
        g.startsWith(`${p}[`),
    );
  });
}
