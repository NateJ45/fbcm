// Foundation, edit with care
// Sanity client + image URL builder. Reads project ID / dataset / API version
// from env at build time. The site is fully prerendered (output: 'static'),
// so all Sanity reads happen at build time in Node, not in the Cloudflare runtime.
//
// Token-based reads (current default):
//   This project's dataset is configured such that anonymous queries are filtered
//   down to a subset of document types (a Sanity-side restriction we couldn't
//   surface in Manage UI — only the page singletons came through anon, every
//   collection returned empty). Passing SANITY_API_READ_TOKEN bypasses the
//   filter and reads the full dataset.
//
//   When a token is set, Sanity disables CDN caching for the request (auth
//   responses can vary by user, so CDN can't safely cache). Build-time only,
//   not a runtime hot path, so the latency is harmless.
//
// Anon fallback:
//   If SANITY_API_READ_TOKEN is missing, the client still constructs and queries
//   work for whatever the API surfaces anonymously. Useful for local-dev sanity
//   checks before the token's been wired into Cloudflare's env vars.
//
// Graceful empty-state:
//   When PUBLIC_SANITY_PROJECT_ID is absent or set to the placeholder string
//   "your-project-id", sanityFetch() short-circuits and returns the provided
//   fallback without making any network call. This lets `npm run build` succeed
//   on a fresh clone with no Sanity project configured — pages render their
//   existing empty-state fallbacks. The populated case (real project ID set)
//   works exactly as before.

import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
// From the package ROOT, not the old `@sanity/image-url/lib/types/types` deep
// path: v2 declares `exports` and only publishes `.`, `./signed` and
// `./package.json`, so the deep import resolves at runtime through bundler
// leniency while `astro check` reports it as a missing module.
import type { SanityImageSource } from '@sanity/image-url';
import {
  PLACEHOLDER_SETTINGS_QUERY,
  fillPlaceholders,
  hasPlaceholder,
  placeholderValues,
  type PlaceholderSettings,
} from './settings-placeholders.ts';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01';
const readToken = import.meta.env.SANITY_API_READ_TOKEN as string | undefined;

/** Returns true when no real Sanity project has been configured. */
const PLACEHOLDER_IDS = new Set(['', 'your-project-id', 'placeholder']);
export const isSanityUnconfigured = !projectId || PLACEHOLDER_IDS.has(projectId.trim());

// Warnings below are scoped to server-only (build + SSR pass) so they don't
// leak into the browser console. The Sanity client module gets imported by
// React components (PortableText, ProjectGallery, etc) for the `urlFor`
// helper, which means the module evaluates client-side too — without this
// guard, every browser session would see the readToken warning, even though
// the token is irrelevant in the browser (it's a server-only env var).
if (import.meta.env.SSR) {
  if (isSanityUnconfigured) {
    // Soft warning — build still succeeds; pages render empty-state fallbacks.
    // Set PUBLIC_SANITY_PROJECT_ID in .env (or Cloudflare → Workers → Variables)
    // to connect a real Sanity project and populate content.
    console.warn(
      '[sanity] PUBLIC_SANITY_PROJECT_ID is not set. Build will succeed with empty content (empty-state fallbacks). Configure it in .env to connect a Sanity project.',
    );
  }

  if (!isSanityUnconfigured && !readToken) {
    // Soft warning — pages still render via fallback copy when the token is missing,
    // but auto-populating collections (journal, projects) won't populate.
    console.warn(
      '[sanity] SANITY_API_READ_TOKEN is not set. Build-time reads will use the anonymous API; collection content (journal, projects) may render empty. Set it in .env locally and in Cloudflare → Workers → Variables (as Secret) for production builds.',
    );
  }
}

export const client: SanityClient = createClient({
  projectId: projectId || 'unconfigured',
  dataset,
  apiVersion,
  // ALWAYS the CDN (2026-09-23). This used to be `useCdn: !readToken`, on the
  // belief that the CDN rejects a token; the API CDN has accepted authenticated
  // requests since API version 2021-03-25. With a token in .env every LOCAL build
  // read the uncached API instead: a full build is several hundred queries, a
  // day of agent builds, parity rebuilds and Playwright webServer builds spent
  // 325k API requests against the plan's 250k monthly quota, while CI (no token)
  // stayed on the CDN. Published reads through the CDN are what a static build
  // wants anyway; the preview has its own draft client.
  useCdn: true,
  perspective: 'published',
  ...(readToken ? { token: readToken } : {}),
});

/**
 * Guarded fetch wrapper — the single chokepoint for all Sanity data queries.
 *
 * When Sanity is unconfigured (PUBLIC_SANITY_PROJECT_ID absent or placeholder),
 * returns `fallback` immediately without any network call so the build succeeds
 * with empty-state content. When configured, forwards to `client.fetch` and
 * catches any network error, logging a warning and returning `fallback` rather
 * than crashing the build.
 *
 * All query helpers in queries.ts route through this function.
 *
 * ── WHY THE TWO EMPTY-SHAPE OVERLOADS ─────────────────────────────────────
 * Nearly every helper in queries.ts passes an EMPTY fallback: `null` for a
 * singleton that may not exist yet, `[]` for a collection that may be empty.
 * With a single signature TypeScript infers T from that argument, so those
 * calls resolve to `Promise<null>` and `Promise<never[]>`, and then every
 * property read downstream reports "does not exist on type 'never'". That is
 * not type safety, it is the type system having been handed no information:
 * `astro check` produced 163 of those errors on this repo the first time it
 * ran (2026-09-06). The GROQ shapes are not generated (typegen emits schema
 * types, and these queries are plain template literals rather than
 * `defineQuery` calls), so the honest description of what comes back is
 * "a Sanity result object", not `never`.
 *
 * The overloads say exactly that, and they leave the explicit-generic path
 * intact: `sanityFetch<MyType>(query, {}, null)` still returns `MyType | null`.
 * Making these queries genuinely typed means moving them to `defineQuery` so
 * typegen can read them, which is its own job.
 */

/** What an untyped GROQ projection returns: an object with unknown keys. */
export type SanityResult = Record<string, any>;

// Singleton with a `null` fallback: the document, or null when it is absent.
export async function sanityFetch<T = SanityResult>(
  query: string,
  params: Record<string, unknown> | undefined,
  fallback: null,
): Promise<T | null>;
// Collection with an empty-array fallback: the rows, or an empty list.
export async function sanityFetch<T = SanityResult>(
  query: string,
  params: Record<string, unknown> | undefined,
  fallback: never[],
): Promise<T[]>;
// Anything with a real fallback value keeps that value's type.
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> | undefined,
  fallback: T,
): Promise<T>;
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: T,
): Promise<T> {
  if (isSanityUnconfigured) {
    return fallback;
  }
  try {
    const result = await fetchWithRetry<T>(query, params);
    // Site settings placeholders ({time}, {address}...), filled here so every
    // page, band and SEO field gets them without any component knowing. See
    // src/lib/settings-placeholders.ts. Most results carry none, and pay only
    // the cheap scan.
    return hasPlaceholder(result) ? fillPlaceholders(result, await settingsValues()) : result;
  } catch (err) {
    // A production build must not quietly ship placeholder content: if Sanity is
    // unreachable or refusing requests (a quota block, an outage), fail the
    // build so the deploy stops and the live site keeps its last good build.
    if (import.meta.env.PROD) {
      throw new Error(`[sanity] fetch failed during a production build: ${String(err)}`);
    }
    console.warn('[sanity] fetch error (returning empty fallback):', err);
    return fallback;
  }
}

// A build makes a few hundred reads, and one of them failing on a network blip
// used to publish a page as a redirect to /404 (2026-09-24: /ministries, caught
// by parity). Two retries, 0.5 s then 1.5 s apart, ride out a blip; a real
// outage still fails after about 2 s and the build stops.
async function fetchWithRetry<T>(query: string, params: Record<string, unknown>): Promise<T> {
  const waits = [500, 1500];
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.fetch<T>(query, params);
    } catch (err) {
      if (attempt >= waits.length) throw err;
      await new Promise((r) => setTimeout(r, waits[attempt]));
    }
  }
}

// The placeholder values, fetched once per build rather than once per query. A
// one-minute lifetime keeps a long-running dev server from serving yesterday's
// service time; a static build finishes well inside it. A failed fetch leaves
// the placeholders visible ({time}) rather than blank, which is the failure an
// editor can see and report.
let settingsCache: { at: number; values: ReturnType<typeof placeholderValues> } | null = null;
async function settingsValues(): Promise<ReturnType<typeof placeholderValues>> {
  if (settingsCache && Date.now() - settingsCache.at < 60_000) return settingsCache.values;
  let settings: PlaceholderSettings | null = null;
  try {
    settings = await client.fetch<PlaceholderSettings | null>(PLACEHOLDER_SETTINGS_QUERY);
  } catch (err) {
    console.warn('[sanity] could not read Site settings for placeholders:', err);
  }
  settingsCache = { at: Date.now(), values: placeholderValues(settings) };
  return settingsCache.values;
}

const builder = createImageUrlBuilder({
  projectId: projectId ?? 'placeholder',
  dataset,
});

export function urlFor(source: SanityImageSource | null | undefined) {
  // `null` / `undefined` are accepted so callers do not each have to guard.
  // The builder itself tolerates a missing source and produces no URL; every
  // caller already checks for an asset before rendering an <img>.
  return builder.image(source as SanityImageSource);
}

// parseSanityAssetDimensions lives in its own module now (2026-09-21) and is
// re-exported here so every existing `from '@/lib/sanity'` import keeps
// working. The move is not cosmetic: this file reads `import.meta.env` at
// module scope to build the client, so importing it from a PURE module drags
// the client in and the node unit tests die on `import.meta.env` being
// undefined. src/lib/spare-images.ts needs the parser and nothing else.
export { parseSanityAssetDimensions } from './sanity-asset.ts';
