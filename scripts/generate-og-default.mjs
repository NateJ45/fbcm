// Foundation, edit with care
// Generates public/og-default.png — the fallback OG image used when a page
// doesn't have its own /og/<slug>.png yet. Run via `npm run og`.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderOg, closeRenderer } from './lib/render-og.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const result = await renderOg({
  wordmark: 'First Baptist Church Muncie',
  tagline: ["We're a Spirit-led people gathered to join Christ's presence in our community."],
  outPath: resolve(root, 'public/og-default.png'),
});

// Not optional: the renderer holds one chromium open for the whole run and
// the process cannot exit until it is closed. See render-og.mjs.
await closeRenderer();

console.log(`OG default written: ${result.outPath} (${result.width}x${result.height})`);
