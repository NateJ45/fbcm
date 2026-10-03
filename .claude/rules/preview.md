---
paths:
  - 'src/lib/cms-preview.ts'
  - 'src/lib/preview-*.ts'
  - 'src/lib/non-stega-fields.ts'
  - 'src/lib/*stega*.ts'
  - 'src/pages/preview/**'
  - 'src/pages/api/draft-mode/**'
  - 'src/components/preview/**'
  - 'src/sanity/resolve.ts'
  - 'src/layouts/PreviewLayout.astro'
---

# Live draft preview (`/preview/**`): the rules that break it

Editors see unpublished drafts in the real design inside the Studio's Presentation tool. `/preview/**`, `/preview/live` and `/api/draft-mode/*` are the SSR routes the preview needs (the fourth SSR route, `/api/live-status`, is the header's YouTube check; see `docs/agent/deployment.md`). **The full reference is `docs/agent/preview.md`. Read it before touching `src/lib/cms-preview.ts`, `src/lib/preview-*.ts`, `src/pages/preview/` or `src/components/preview/`.** These are the rules that bite without warning:

- **Never compare a stega-encoded string in logic, and never measure one.** Stega hides invisible markers in every string (including U+FEFF, which matches `\s`), so `align === 'left'` is false and a whitespace split shatters into dozens of fake words, in the preview only. Enums that drive rendering go in `NON_STEGA_FIELDS` in `cms-preview.ts` the day the field is added (rule 8b). Display strings go through `splitStega().cleaned` before any split, length, slice or count.
- **`/preview/live` is an event-driven SSE proxy. Never replace it with an interval poll** (that burned the WCP Sanity quota), and keep its listen at `visibility: 'query'`.
- **`/preview/**` must send `Cache-Control: no-store`**, or the Studio iframe serves the previous deploy.
- **The section-edit wrapper is preview-only and must be a real block box**, never `display: contents`. Every live render stays byte-identical, and `npm run parity compare` is the gate.
- **The path-to-type map lives in two places that must agree:** `SINGLETON_PREVIEW_PATHS` in `src/sanity/resolve.ts` and `SINGLETON_BY_PATH` in `src/pages/preview/[...slug].astro`.
- The preview was activated on production on 2026-09-20 (`SANITY_TOKEN` on the Worker, origin on the CORS list). Without the token, every preview route fails closed with a 503.

## Related rule 8b

8b. **Adding a logic-driving dropdown field to a schema means adding its name to `NON_STEGA_FIELDS`** in `src/lib/cms-preview.ts`, in the same commit. Miss it and the block renders the wrong branch **in the preview only**, which is the hardest kind of bug to notice.
