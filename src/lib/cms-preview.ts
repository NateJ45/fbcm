// Foundation, edit with care
// =============================================================================
// CMS content client - for the Studio-only PREVIEW path (/preview/*)
// (ported from presacademy 2026-08-28; original lineage: the WCP site)
// =============================================================================
// Unlike src/lib/sanity.ts (which reads once at BUILD time for the static
// public pages), this client runs per request on `prerender = false` preview
// routes and must read live DRAFT content, so the token comes from the Worker
// runtime env (`cloudflare:workers`), never from a build-time var. Never import
// this from a prerendered page.
//
// perspective/stega both switch on `draftMode`, which callers derive from the
// presence of the Presentation Tool's perspective cookie. There is deliberately
// no fallback argument here (unlike sanityFetch): a preview page should show
// real Sanity state, including empty and missing fields, so an editor notices a
// gap instead of silently seeing built-in fallback copy.
//
// FAILS CLOSED with no SANITY_TOKEN: the client is built without credentials
// and Sanity refuses the draft perspective, so the preview route errors rather
// than quietly serving published content dressed as a draft.
// =============================================================================
import { createClient, type SanityClient } from '@sanity/client';
import { env } from 'cloudflare:workers';
import {
  PLACEHOLDER_SETTINGS_QUERY,
  fillPlaceholders,
  hasPlaceholder,
  placeholderValues,
  type PlaceholderSettings,
} from './settings-placeholders.ts';
import { isNonStegaField } from './non-stega-fields.ts';

export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string;
export const dataset = (import.meta.env.PUBLIC_SANITY_DATASET as string) || 'production';
export const apiVersion = (import.meta.env.PUBLIC_SANITY_API_VERSION as string) || '2026-05-01';

// -----------------------------------------------------------------------------
// Fresh-clone guard: FAIL CLOSED, but say why
// -----------------------------------------------------------------------------
// A clone of this template with no Sanity project and no runtime token still
// builds and still serves the whole public site (src/lib/sanity.ts falls back to
// the default sections). The preview stack cannot fall back to anything: with no
// project id the Sanity client constructor throws, and with no token the draft
// perspective is refused. Left alone that surfaces as a bare 500 with a stack
// trace in the Worker log, which reads like a bug in the template rather than
// "you have not set this up yet".
//
// So every preview entry point checks this first and answers with the two
// setup steps instead. Keep it a 503: the route is fine, the service behind it
// is not configured.
const PLACEHOLDER_IDS = new Set(['', 'your-project-id', 'placeholder', 'placeholder-project-id']);

/** Whether the preview routes can do anything at all in this environment. */
export function previewConfig(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!projectId || PLACEHOLDER_IDS.has(projectId.trim())) {
    missing.push('PUBLIC_SANITY_PROJECT_ID (build-time, .env)');
  }
  if (!(env as { SANITY_TOKEN?: string }).SANITY_TOKEN) {
    missing.push('SANITY_TOKEN (Worker runtime secret, .dev.vars locally)');
  }
  return { ok: missing.length === 0, missing };
}

/** The 503 every preview entry point returns when setup is incomplete. */
export function previewUnconfiguredResponse(missing: string[]): Response {
  return new Response(
    'Live preview is not configured yet.\n\n' +
      'Missing:\n' +
      missing.map((m) => `  - ${m}`).join('\n') +
      '\n\nSee .env.example and .dev.vars.example. The embedded Studio also needs\n' +
      'this origin on the project CORS allow list:\n' +
      '  npx sanity cors add <origin> --credentials\n',
    { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}

// -----------------------------------------------------------------------------
// NON_STEGA_FIELDS - the single most important list in the preview stack
// -----------------------------------------------------------------------------
// Now in src/lib/non-stega-fields.ts, a PURE module so it can be unit-tested
// without standing up a preview client (that file reads `import.meta.env` at
// module scope, undefined under node --test). isNonStegaField(), imported
// above, is the single membership check both this filter and the tests use.
// ADD ANY NEW LOGIC-DRIVING DROPDOWN FIELD TO THAT LIST THE DAY YOU ADD THE
// FIELD (rule 8b).
// -----------------------------------------------------------------------------

export function getPreviewClient(draftMode: boolean): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: (env as { SANITY_TOKEN?: string }).SANITY_TOKEN,
    perspective: draftMode ? 'drafts' : 'published',
    stega: {
      enabled: draftMode,
      studioUrl: '/studio',
      // Encode display strings (click-to-edit) but skip the dropdown fields
      // above, whose exact values are used in rendering logic.
      filter: (props) =>
        isNonStegaField(String(props.sourcePath.at(-1))) ? false : props.filterDefault(props),
    },
  });
}

/**
 * Run a GROQ query with the draft-aware preview client.
 *
 * `options.stega: false` reads in the same perspective with NO stega: for
 * data a page derives from rather than displays (the post preview's body,
 * which the reading pass matches and measures, and the lists it compares by
 * id and tag). Everything else leaves it out and gets click-to-edit.
 */
export async function previewFetch<T>(
  draftMode: boolean,
  query: string,
  params: Record<string, unknown> = {},
  options: { stega?: false } = {},
): Promise<T> {
  const client = getPreviewClient(draftMode);
  const result =
    options.stega === false
      ? await client.fetch<T>(query, params, { stega: false })
      : await client.fetch<T>(query, params);
  if (!hasPlaceholder(result)) return result;
  // Site settings placeholders ({time}, {address}...), filled the same way the
  // build fills them (src/lib/settings-placeholders.ts), so the preview shows
  // the real text while the box an editor clicks into still holds {time}.
  // Read in the SAME perspective (a draft service time previews too) but with
  // stega OFF: the filled-in value must not carry a second edit payload inside
  // the string it lands in. The placeholder's own string keeps its payload at
  // the end, so click-to-edit still opens the field that holds {time}.
  const settings = await client.fetch<PlaceholderSettings | null>(
    PLACEHOLDER_SETTINGS_QUERY,
    {},
    { stega: false },
  );
  return fillPlaceholders(result, placeholderValues(settings));
}
