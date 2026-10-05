import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// =============================================================================
// The @content watch (2026-10-05): the specs that assert what the church wrote
// =============================================================================
// Same server, same fixture env and same port as the main config (it is spread
// from it, so the two cannot drift), but it runs ONLY the tests titled @content
// (tests/content-watch.spec.ts) and only in chromium. Run by
// .github/workflows/content-watch.yml on a schedule, after a deploy and on
// demand: it reports drift and blocks nothing. Locally: `npm run test:content`.
// No retry: a content change is not flaky, and a second run only costs time.
// =============================================================================
export default defineConfig({
  ...base,
  grep: /@content/,
  grepInvert: undefined,
  retries: 0,
  projects: base.projects?.filter((p) => p.name === 'chromium'),
});
