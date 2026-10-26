// Safe to edit by hand
// Make every redirect one hop to a page that answers 200.
//
// With `trailingSlash: 'always'` a target written "/ministers" is itself
// answered with a 307 to "/ministers/", and a target that is another redirect's
// old address (/staff -> /ministers) is a second 301. So each destination gets
// its trailing slash (the #fragment or ?query keeps its place after it), and a
// destination that is itself a redirect's old address is replaced by where that
// one ends up (at most 5 hops, a cycle stops the walk). The fragment the
// editor wrote is kept unless the final target carries its own.
import { withTrailingSlash } from './href.ts';
import { isExternalTarget, normalizeRedirectPath, type RedirectTarget } from './redirects.ts';

const split = (t: string): [string, string] => {
  const cut = t.search(/[?#]/);
  return cut === -1 ? [t, ''] : [t.slice(0, cut), t.slice(cut)];
};

export function finalizeRedirects(
  map: Record<string, RedirectTarget>,
): Record<string, RedirectTarget> {
  const out: Record<string, RedirectTarget> = {};
  for (const [from, target] of Object.entries(map)) {
    let dest = target.destination;
    if (!isExternalTarget(dest)) {
      const seen = new Set([from]);
      for (let hop = 0; hop < 5; hop++) {
        const [path, rest] = split(dest);
        const key = normalizeRedirectPath(path);
        const next = key && !seen.has(key) ? map[key] : undefined;
        if (!key || !next) break;
        seen.add(key);
        if (isExternalTarget(next.destination)) {
          dest = next.destination;
          break;
        }
        const [np, nrest] = split(next.destination);
        dest = `${np}${nrest || rest}`;
      }
      dest = withTrailingSlash(dest);
    }
    out[from] = { ...target, destination: dest };
  }
  return out;
}

/**
 * Add the bare (no trailing slash) form of every `_redirects` rule.
 *
 * With `trailingSlash: 'always'` Astro writes only "/staff/ /ministers/ 301".
 * Cloudflare answers a bare "/staff" with a 301 to "/staff/" before it looks
 * at that rule, so every old address took two hops. A rule for the bare form
 * sends it straight to the final page. Rules already in both forms, the root
 * and comments are left alone.
 */
export function withBareRedirectRules(text: string): string {
  const lines = text.split(/\r?\n/);
  const have = new Set(lines.map((l) => l.trim().split(/\s+/)[0]));
  const extra: string[] = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const from = parts[0];
    if (!from || from.startsWith('#') || !from.startsWith('/')) continue;
    if (from.length < 2 || !from.endsWith('/') || from.includes('*')) continue;
    const bare = from.slice(0, -1);
    if (have.has(bare)) continue;
    have.add(bare);
    extra.push([bare, ...parts.slice(1)].join(' '));
  }
  const body = text.replace(/\s+$/, '');
  return extra.length ? `${body}\n${extra.join('\n')}\n` : text;
}
