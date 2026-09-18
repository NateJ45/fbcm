# FBCM Foundation and Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the `fbcm` repo from a capture-only directory to a deployed, green
Cloudflare Worker serving every page route and all 142 imported blog posts on their
original URLs.

**Architecture:** Fork `ncs-astro-sanity-starter`, remove six of its seven scaffold
capabilities, rename the journal routes to match the live site's URLs, add two
harvested Sanity document types, and import the committed capture in
`scripts/data/`. All import logic is a pure function with unit tests; the scripts
around it are thin and idempotent.

**Tech Stack:** Astro 7, Sanity v6 (embedded Studio), Tailwind 4, React 19 islands,
Cloudflare Workers, Node 22.12+, `node --test` for unit tests, Playwright for
browser tests.

**Spec:** `docs/superpowers/specs/2026-09-18-fbcm-rebuild-design.md`

**Scope:** This is plan 1 of 3. Plan 2 covers pages, sections, the Studio and the
identity pass. Plan 3 covers the domain cutover. This plan ends with a deployed
site that has all the real content and no design work done.

## Global Constraints

Copied verbatim from `ncs-astro-sanity-starter/CLAUDE.md` and the spec. Every
task's requirements implicitly include this section.

- **Node 22.12+.**
- **The dependency set is matched. Do not bump one in isolation.**
  `@astrojs/cloudflare` pinned exact **14.2.4**; `wrangler` pinned **~4.110.0**;
  `react`, `react-dom`, `react-is` pinned exact **19.2.7**; `sanity` and
  `@sanity/vision` **6.9.1**, `@sanity/ui` **3.5.4**, `@sanity/client` **7.26.2**.
  **Do not take `sanity` 6.9.2** (that patch release crosses to `@sanity/ui` 4).
- **Never run `npm audit fix --force` in this repo.** Its offered fix downgrades
  `sanity` 6.9.1 to 5.14.1 across a major version and takes the embedded Studio
  with it. The 30 open advisories are all build-time tooling and are accepted.
- **After any schema change run `npm run typegen` before `npm run build`.**
  `npm run build` does not chain typegen. `npm run build:full` runs both.
- **Deploy with `wrangler deploy -c dist/server/wrangler.json`**, never a bare
  `wrangler deploy`, which reads the root `wrangler.jsonc` and 404s every
  sub-route.
- **Never click "Remove field" in the Studio.** It deletes that field's data across
  every document.
- **No em-dashes in site copy** (page copy, component text, Sanity content). Code
  comments, commit messages and these plans are exempt.
- **Every Sanity field `description` says what to TYPE, never why the field
  exists.**
- **Every seeded string reads as an obvious placeholder.** Plausible placeholder
  copy is worse than none, because it ships.
- **No `tone`, `surface`, `background` or `accent` field on any page-builder
  block.** `src/lib/section-fields.test.ts` fails if one appears.
- **Anything computable from other data is derived at build time, never stored as
  a field an editor can retype.**
- **A logic-driving dropdown field must be added to `NON_STEGA_FIELDS` in
  `src/lib/cms-preview.ts` in the same commit**, or the block takes the wrong
  branch in the preview only.
- **A capability added later carries its scaffold markers in the same commit.**
  Inside an Astro template the marker must be `{/* scaffold: name */}`, because
  below the frontmatter fence a `//` renders onto the page.
- **Gate before every PR:** `npm run check` (0 errors), `npm run test:unit`,
  `npm run format:check`, `npm test`, `npm run parity compare`,
  `npm run audit:studio`. PRs against `main`, never merged without green checks.

---

## File Structure

**Created by this plan:**

| File | Responsibility |
| --- | --- |
| `src/lib/import-post.ts` | Pure transform: one captured post JSON to one Sanity `post` document. The only place slug, id and derived-kind rules live. |
| `src/lib/import-post.test.ts` | Its gate. Slug fidelity, deterministic ids, derived sermon-preview, tags. |
| `src/lib/fbcm-redirects.ts` | Pure builder for the retired-URL redirect list, including the five former-staff URLs no crawl can find. |
| `src/lib/fbcm-redirects.test.ts` | Its gate. No duplicate `from`, no self-redirect, former-staff URLs present. |
| `src/sanity/schemaTypes/ministry.ts` | The `ministry` document type, harvested and adapted. |
| `src/sanity/schemaTypes/staffMember.ts` | The `staffMember` document type, harvested and adapted. |
| `scripts/import-posts.mjs` | Thin runner over `import-post.ts`. Dry by default. |
| `scripts/import-people.mjs` | Thin runner importing staff and ministries. Dry by default. |
| `scripts/import-redirects.mjs` | Thin runner creating the `redirect` documents. Dry by default. |
| `src/pages/blog/index.astro`, `src/pages/post/[slug].astro` | The journal routes, renamed to the live site's URLs. |

**Modified:** `src/data/site.ts`, `astro.config.mjs`, `wrangler.jsonc`,
`brand/brand.config.json`, `src/sanity/schemaTypes/index.ts`,
`src/sanity/structure.ts`, `src/sanity/urls.ts`, `src/lib/reservedSlugs.ts`,
`src/lib/queries.ts`, `tests/routes.ts`.

---

### Task 1: Fork the starter and prove the baseline

The capture already lives in this directory. The fork has to land around it
without destroying it, which a plain `git clone` into a non-empty directory will
not do.

**Files:**
- Modify: the whole repo root (adds the starter's tree)
- Preserve: `scripts/data/`, `scripts/capture-*.mjs`, `scripts/build-manifest.mjs`, `scripts/verify-archive.mjs`, `docs/superpowers/`, `.gitignore`

- [ ] **Step 1: Clone the starter to a scratch directory**

```bash
cd /c/Users/natha/Documents/Claude/Projects
git clone ncs-astro-sanity-starter /tmp/fbcm-starter
rm -rf /tmp/fbcm-starter/.git
```

- [ ] **Step 2: Copy the starter over the fbcm working tree without clobbering the capture**

```bash
cd /c/Users/natha/Documents/Claude/Projects/fbcm
cp -rn /tmp/fbcm-starter/. .
cp -r /tmp/fbcm-starter/scripts/lib scripts/lib
```

`cp -rn` is no-clobber, so nothing already committed is overwritten. The second
line is explicit because `scripts/` already exists and must gain the starter's
`lib/` helpers.

- [ ] **Step 3: Merge the starter's .gitignore into ours**

Ours has the three binary-archive exclusions the starter does not. Append the
starter's entries to ours rather than replacing the file, then confirm all four
kinds of entry survive:

```bash
grep -E "scripts/data/(images|files|video)/|node_modules|dist" .gitignore
```

Expected: all of `node_modules`, `dist`, and the three `scripts/data/` lines.

- [ ] **Step 4: Install**

```bash
npm install
```

- [ ] **Step 5: Prove the baseline build with no Sanity project**

```bash
npm run build
```

Expected: PASS. `sanityFetch` returns code-defined fallbacks when
`PUBLIC_SANITY_PROJECT_ID` is absent, so every page renders default content. If
this fails on a fresh fork, stop and fix it here. Nothing after this gets easier.

- [ ] **Step 6: Confirm the capture survived the fork**

```bash
node scripts/verify-archive.mjs --quick
```

Expected: `OK: archive matches the manifest.` and `verified: 424/424`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Fork ncs-astro-sanity-starter around the existing capture

cp -rn so nothing already committed is overwritten. Baseline build passes
with no Sanity project, and the 424-file archive still verifies."
```

---

### Task 2: Scaffold out the six capabilities this church does not need

**Files:**
- Modify: roughly 190 files across six removals, all by the scaffold tool

**Interfaces:**
- Produces: a source tree where only `journal` remains of the seven removable capabilities. Later tasks assume `service`, `testimonial`, `philosophyPoint`, `faqItem`, `faqCategory`, `aboutPage`, `servicesPage`, `processPage` and `processStep` no longer exist.

- [ ] **Step 1: List what can go, to confirm the tool sees all seven**

```bash
npm run scaffold
```

Expected: `about`, `faq`, `journal`, `philosophy`, `process`, `services`,
`testimonials`.

- [ ] **Step 2: Read the plan for the first removal before writing anything**

```bash
npm run scaffold -- --remove about
```

Expected: a file list and no changes on disk. The tool is dry by default.

- [ ] **Step 3: Apply all six removals, one at a time**

```bash
npm run scaffold -- --remove about --write
npm run scaffold -- --remove faq --write
npm run scaffold -- --remove philosophy --write
npm run scaffold -- --remove process --write
npm run scaffold -- --remove services --write
npm run scaffold -- --remove testimonials --write
```

`journal` is NOT removed. It is the 142-post archive, and keeping it also leaves
`dynamicListSection` a valid source, which is the open issue in the starter's
`docs/PENDING.md` item 11.

- [ ] **Step 4: Run the full gate the tool prints**

```bash
npm run typegen
npm run check
npm run build
npm run test:unit
```

Expected: `npm run check` reports 0 errors; all unit tests pass.

- [ ] **Step 5: Confirm nothing removed still registers anywhere**

```bash
grep -rniE "servicesPage|processStep|testimonial|philosophyPoint|faqCategory|aboutPage" src/ --include=*.ts --include=*.astro --include=*.tsx | grep -v "\.test\." || echo "clean"
```

Expected: `clean`. A survivor here is a runtime error in the Studio that the build
passes, which is the failure mode CLAUDE.md rule 14 exists to prevent.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold out about, faq, philosophy, process, services, testimonials

Only journal stays; it is the 142-post archive. Keeping it also leaves
dynamicListSection a valid source, avoiding PENDING.md item 11.

services is removed rather than repurposed as ministries on purpose: a
type labelled Services in front of a church secretary means worship
services, and the Studio is her product."
```

---

### Task 3: Identity, Worker name, and the Sanity project

**Files:**
- Modify: `src/data/site.ts`, `astro.config.mjs`, `wrangler.jsonc`, `.env`

**Interfaces:**
- Produces: `PUBLIC_SANITY_PROJECT_ID` set, so every later task's build fetches real data rather than silently falling back to placeholders.

- [ ] **Step 1: Set the three identity values**

`src/data/site.ts`: `name` to `First Baptist Church Muncie`, `domain` to
`fbcmuncie.org`, `url` to `https://www.fbcmuncie.org`, `storageKeyPrefix` and
`themeStorageKey` to an `fbcm`-based prefix.

`astro.config.mjs`: `site: 'https://www.fbcmuncie.org'`.

`wrangler.jsonc`: `"name": "fbcm-site"`.

Set `url` and `site:` to the real production domain now, even though DNS does not
point there until plan 3. Canonical tags and the sitemap should be right from the
first deploy.

- [ ] **Step 2: Create the Sanity project and fill .env**

At sanity.io/manage create a project, then:

```bash
cp .env.example .env
```

```
PUBLIC_SANITY_PROJECT_ID=<project id>
PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=<Viewer token>
SANITY_API_WRITE_TOKEN=<Editor token, needed by the import scripts>
SANITY_STUDIO_PROJECT_ID=<project id>
SANITY_STUDIO_DATASET=production
SANITY_STUDIO_PREVIEW_URL=https://fbcm-site.<account>.workers.dev
```

- [ ] **Step 3: Allow the origins in Sanity CORS**

```bash
npx sanity cors add http://localhost:4321 --credentials
npx sanity cors add https://fbcm-site.<account>.workers.dev --credentials
```

Without this the embedded Studio loads and then fails to sign in, which reads as a
broken build rather than a missing CORS entry.

- [ ] **Step 4: Verify the build now fetches from the real project**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Set identity, Worker name and the Sanity project

url and astro site: point at the real domain from the first deploy so
canonical tags and the sitemap are never wrong."
```

`.env` is gitignored and is not part of this commit.

---

### Task 4: Apply the brand

**Files:**
- Modify: `brand/brand.config.json`, then `apply-brand` rewrites `src/styles/globals.css`, `src/data/site.ts`, `sanity.config.ts`, `public/og-default.png`

- [ ] **Step 1: Set the palette from the church's real colours**

These were recovered from the live site's own markup. `#116dff` also appears there
and is **Wix's UI blue, not the church's**; do not use it.

```json
"palette": {
  "theme": {
    "--color-primary": "#292854",
    "--color-primary-dark": "#1C1B3A",
    "--color-accent": "#D59B29",
    "--color-accent-dark": "#A87716"
  }
}
```

Set `name` to `First Baptist Church Muncie`, `domain` to `fbcmuncie.org`, and
`contact.address` to `309 East Adams Street, Muncie, IN 47305`.

- [ ] **Step 2: Keep the starter's fonts for now**

No `npm install` is needed. `@fontsource/libre-baskerville` and
`@fontsource-variable/inter` are already dependencies, and a serif display face
suits a downtown church with a 4,174-word history page. Typography is revisited in
plan 2's identity pass, which is the right time: a type decision made against
placeholder copy is a guess. If a face is ever swapped, install it **before**
running `apply-brand`, which rewrites imports but cannot install packages
(rule 12).

- [ ] **Step 3: Apply**

```bash
npm run apply-brand
```

- [ ] **Step 4: Read the diff, because a surprise in it is a real finding**

```bash
git diff
```

`apply-brand` is deterministic. Note: `docs/PENDING.md` item 9 records that it is
not byte-idempotent on `globals.css` (it normalises hex case and quote style), so
expect cosmetic churn there and run `npx prettier --write src/styles/globals.css`
afterwards so `npm run format:check` stays green.

- [ ] **Step 5: Check contrast**

```bash
npm run test:unit -- --test-name-pattern="theme-tokens"
```

Expected: PASS. This is the WCAG AA gate over the `@theme` palette. Navy on white
and gold on navy both need to clear it; if gold fails as a text colour, keep it as
an accent only and darken it for text.

- [ ] **Step 6: Hunt fork residue (CLAUDE.md rule 11, PORTS.md card 44)**

```bash
grep -riE "reid|stone ?steps|studio starter" src/ scripts/ public/ brand/ --include=* | grep -v scripts/data || echo "clean"
ls src/assets/
```

Expected: `clean`, and no logo in `src/assets/` belonging to another client. Four
pieces of the origin client survived into this starter once and each was correct
code containing the wrong noun, which no test can see.

- [ ] **Step 7: Build and commit**

```bash
npm run build
git add -A
git commit -m "Apply the FBCM brand

Navy #292854 and gold #D59B29, both taken from the live site's own
markup. Wix's UI blue #116dff also appears there and is not theirs."
```

---

### Task 5: First production deploy, green

**Files:**
- Modify: GitHub repository secrets and variables (no repo files)

- [ ] **Step 1: Set repository secrets and variables**

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
Variables: `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`.

These two belong in variables, not secrets: they appear in every GROQ request URL
and are public. Set them **before** reading a CI result, because a page whose
content is absent renders as a stub rather than failing, and a green run against an
empty dataset tells you nothing about most of the site.

- [ ] **Step 2: Deploy**

```bash
npm run deploy
```

That is `npm run build` followed by `wrangler deploy -c dist/server/wrangler.json`.

- [ ] **Step 3: Open the deployed site in a real browser, including /studio**

A 200 is not verification. `/studio` returns 200 with real HTML while being
completely broken at React mount. Open the console and read it.

- [ ] **Step 4: Wire the publish webhook**

At manage.sanity.io, API, GROQ-powered Webhooks: name `Rebuild live site`, dataset
`production`, POST to GitHub's dispatches endpoint for this repo, triggering on
create, update and delete.

- Header: `Authorization: Bearer <token>`. **The word `Bearer` is load-bearing.**
  A sibling project ran five days with the token alone, GitHub answered 401, and
  Sanity reported only a failed attempt.
- Projection: exactly `{"event_type": "sanity-publish"}`.
- Filter: `!(_id in path("drafts.**")) && !(_type in ["media.tag", "sanity.imageAsset", "sanity.fileAsset", "sanity.assetSourceData"])`

- [ ] **Step 5: Test the webhook with a real revision**

Writing a field's existing value back leaves `_updatedAt` untouched and fires
nothing, which is how a working webhook gets misdiagnosed as broken. Change a
value, publish, change it back, publish. Then confirm a `repository_dispatch` run
appeared and the deploy finished.

- [ ] **Step 6: Commit nothing, record instead**

No repo files changed. Add the `workers.dev` URL to `docs/PENDING.md` and to the
vault client note.

---

### Task 6: Rename the journal routes to the live site's URLs

All 142 post URLs survive with zero redirects. One slug is non-ASCII, and that is
the case a re-slugify would silently break.

**Files:**
- Create: `src/pages/blog/index.astro` (moved), `src/pages/post/[slug].astro` (moved), `src/pages/blog/rss.xml.ts` (moved)
- Delete: `src/pages/journal/`
- Modify: `src/sanity/urls.ts`, `src/lib/reservedSlugs.ts`, `src/sanity/resolve.ts`, `src/pages/preview/[...slug].astro`, `src/layouts/PreviewLayout.astro`, `tests/routes.ts`

**Interfaces:**
- Produces: a post is served at `/post/<slug>` and the listing at `/blog`. `pathForDoc()` in `src/sanity/urls.ts` returns `/post/<slug>` for a journal entry.

- [ ] **Step 1: Write the failing test**

Add to `tests/smoke.spec.ts`:

```ts
test('a post with a non-ASCII slug is served at its original URL', async ({ page }) => {
  const res = await page.goto('/post/händel-s-messiah-sing-in-carols');
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Messiah');
});

test('the blog listing is served at /blog', async ({ page }) => {
  const res = await page.goto('/blog');
  expect(res?.status()).toBe(200);
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npm test -- --grep "original URL"
```

Expected: FAIL with a 404. The route does not exist yet and no posts are imported.

- [ ] **Step 3: Move the routes**

```bash
git mv src/pages/journal/index.astro src/pages/blog/index.astro
git mv src/pages/journal/[slug].astro src/pages/post/[slug].astro
git mv src/pages/journal/rss.xml.ts src/pages/blog/rss.xml.ts
```

- [ ] **Step 4: Update the three path registries that must agree**

`src/sanity/urls.ts`: `pathForDoc()` returns `/post/${slug}` for the journal entry
type and `/blog` for the journal page singleton.

`src/lib/reservedSlugs.ts`: replace `journal` with `blog` and `post`, so the custom
`/[slug].astro` route cannot serve either.

`src/sanity/resolve.ts` (`SINGLETON_PREVIEW_PATHS`),
`src/pages/preview/[...slug].astro` (`SINGLETON_BY_PATH`) and
`src/layouts/PreviewLayout.astro` (`FIRST_SEGMENT_PREVIEWABLE`): change `journal`
to `blog` and add `post`. **All three must agree**; they are the same map held in
three places and a miss shows up only in the preview.

`tests/routes.ts`: change `/journal` to `/blog`.

- [ ] **Step 5: Verify the reserved-slug unit test still passes**

```bash
npm run test:unit -- --test-name-pattern="reservedSlugs"
```

Expected: PASS.

- [ ] **Step 6: Build and run the route tests**

```bash
npm run build
npm test -- --grep "/blog"
```

Expected: `/blog` returns 200. The non-ASCII post test still fails until Task 9
imports the posts; that is correct and it is the test that proves the import.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Rename the journal routes to /blog and /post/<slug>

Matches the live Wix URLs exactly, so all 142 post URLs survive the
migration with no redirects and no SEO loss. The three copies of the
preview path map are updated together; they are the same map held in
three places and a miss shows up only in the preview."
```

---

### Task 7: The ministry and staffMember schemas

Harvested from the archived `ncs-church-starter` and adapted. No `sermon` type:
YouTube is the archive. No `event` type: Church Center holds the calendar.

**Files:**
- Create: `src/sanity/schemaTypes/ministry.ts`, `src/sanity/schemaTypes/staffMember.ts`
- Modify: `src/sanity/schemaTypes/index.ts`, `src/sanity/structure.ts`

**Interfaces:**
- Produces: document types `ministry` (fields `title`, `slug`, `summary`, `body`, `image`, `order`) and `staffMember` (fields `name`, `slug`, `role`, `email`, `bio`, `photo`, `order`). Tasks 9 and 10 write documents of these shapes.

- [ ] **Step 1: Write `src/sanity/schemaTypes/ministry.ts`**

Every `description` says what to type. None explains why the field exists.

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'ministry',
  title: 'Ministry',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'The name people use for it, like "Children" or "Outreach".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'Click Generate. Only change it if you need a shorter address.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'summary',
      title: 'One-line summary',
      type: 'text',
      rows: 2,
      description: 'One sentence, shown in the list of ministries.',
    }),
    defineField({
      name: 'body',
      title: 'Full description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Who it is for, when it meets, and who to ask about it.',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'One photo of this ministry. Landscape works best.',
    }),
    defineField({
      name: 'order',
      title: 'Position in the list',
      type: 'number',
      description: 'A number. Lower numbers appear first.',
    }),
  ],
  orderings: [
    { title: 'List order', name: 'order', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    // The title is a string field. Never preview from a number: it crashes the
    // whole array field (audit:studio check 2).
    select: { title: 'title', subtitle: 'summary', media: 'image' },
  },
});
```

- [ ] **Step 2: Write `src/sanity/schemaTypes/staffMember.ts`**

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'staffMember',
  title: 'Staff member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Their name as it should appear on the page.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'Click Generate.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'Their title, like "Pastor" or "Church Clerk".',
    }),
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      description: 'Their church email address. Leave blank to show none.',
    }),
    defineField({
      name: 'bio',
      title: 'About them',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'A short paragraph. Leave blank and only the name, role and photo show.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'A head and shoulders photo.',
    }),
    defineField({
      name: 'order',
      title: 'Position in the list',
      type: 'number',
      description: 'A number. Lower numbers appear first.',
    }),
  ],
  orderings: [
    { title: 'List order', name: 'order', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
});
```

- [ ] **Step 3: Register both and add desk panes**

In `src/sanity/schemaTypes/index.ts` import and add both to the exported array. In
`src/sanity/structure.ts` add a `Ministries` and a `Staff` list pane.

- [ ] **Step 4: Typegen, check, build**

```bash
npm run typegen
npm run check
npm run build
```

Expected: 0 errors.

- [ ] **Step 5: Run the Studio audit**

```bash
npm run audit:studio
```

Expected: exit 0. It catches a field that is hidden AND required, and a preview
title taken from a number, both of which a build and a type check pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add the ministry and staffMember schemas

Harvested from the archived ncs-church-starter and adapted. No sermon
type: YouTube is the archive. No event type: Church Center holds the
calendar. Every field description says what to type."
```

---

### Task 8: The post transform, with its gate

This is the only place the slug, id and derived-kind rules live. It is pure, so it
is testable without a Sanity project.

**Files:**
- Create: `src/lib/import-post.ts`, `src/lib/import-post.test.ts`
- Modify: `src/sanity/schemaTypes/journalEntry.ts` (add `tags`)

**Interfaces:**
- Produces: `postDocId(slug: string): string`, `categoryDocId(name: string): string`, `isSermonPreview(categories: string[]): boolean`, `postFromCapture(captured: CapturedPost): SanityPostDoc`. Task 9's runner calls `postFromCapture` and `categoryDocId` and nothing else.

**Note on `categories`.** `journalEntry.categories` in the starter is an array of
**references** to `journalCategory`, not an array of strings. The capture holds
category NAMES, so the transform maps each name to a reference and Task 9 creates
the five category documents first. Each array member needs its own `_key` or Sanity
rejects the write.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/import-post.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postDocId, categoryDocId, isSermonPreview, postFromCapture } from './import-post.ts';

const base = {
  slug: 'stayers', title: 'Stayers', url: 'https://www.fbcmuncie.org/post/stayers',
  publishedDate: '2024-01-15T10:00:00.000Z', author: 'Kendall Ellis',
  categories: ['Sermon Preview'], tags: ['Lent'], excerpt: 'x',
  bodyText: 'y', bodyHtml: '<p>y</p>', images: [], links: [], embeds: [],
};

test('the document id is deterministic, so a re-import replaces rather than duplicates', () => {
  assert.equal(postDocId('stayers'), 'post-stayers');
  assert.equal(postDocId('stayers'), postDocId('stayers'));
});

test('a non-ASCII slug is preserved byte for byte, never re-slugified', () => {
  const slug = 'händel-s-messiah-sing-in-carols';
  assert.equal(postFromCapture({ ...base, slug }).slug.current, slug);
  assert.equal(postDocId(slug), `post-${slug}`);
});

test('sermon-preview is DERIVED from the category, not stored as its own field', () => {
  assert.equal(isSermonPreview(['Sermon Preview']), true);
  assert.equal(isSermonPreview(['Ruminations']), false);
  assert.equal(isSermonPreview([]), false);
  assert.ok(!('postKind' in postFromCapture(base)));
  assert.ok(!('isSermonPreview' in postFromCapture(base)));
});

test('tags survive the transform', () => {
  assert.deepEqual(postFromCapture({ ...base, tags: ['Lent', 'John'] }).tags, ['Lent', 'John']);
});

test('categories become references with keys, because the schema wants references', () => {
  const doc = postFromCapture({ ...base, categories: ['Sermon Preview', 'Ruminations'] });
  assert.deepEqual(
    doc.categories.map((c) => c._ref),
    ['category-sermon-preview', 'category-ruminations'],
  );
  for (const c of doc.categories) assert.equal(c._type, 'reference');
  // Distinct _key per member, or Sanity rejects the array.
  const keys = doc.categories.map((c) => c._key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.every(Boolean));
});

test('a category id is stable across differing case and spacing', () => {
  assert.equal(categoryDocId('Sermon Preview'), 'category-sermon-preview');
  assert.equal(categoryDocId('  sermon   preview '), 'category-sermon-preview');
});

test('a post with no categories produces an empty array, not a broken reference', () => {
  assert.deepEqual(postFromCapture({ ...base, categories: [] }).categories, []);
});

test('an undated post is rejected rather than imported with a wrong date', () => {
  assert.throws(() => postFromCapture({ ...base, publishedDate: '' }), /publishedDate/);
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npm run test:unit -- --test-name-pattern="import-post"
```

Expected: FAIL, cannot find module `./import-post.ts`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/import-post.ts
// The one place the post import's rules live: how a document id is formed, how a
// slug is carried across, and how "is this a weekly sermon preview" is DERIVED.
//
// That last one is the point. 106 of 142 posts are weekly sermon previews that go
// stale by Monday, and the site foregrounds the other 36. It would be easy to give
// an editor a "kind" dropdown; that would be a second source of truth next to the
// category, and the second one is the one that goes stale (CLAUDE.md rule 15).

export interface CapturedPost {
  slug: string;
  title: string;
  url: string;
  publishedDate: string;
  author?: string;
  categories?: string[];
  tags?: string[];
  excerpt?: string;
  bodyText?: string;
  bodyHtml?: string;
}

/** The category Wix uses for the weekly preview. Matched case-insensitively. */
const SERMON_PREVIEW_CATEGORY = 'sermon preview';

/**
 * Deterministic, so `createOrReplace` REPLACES on a re-run instead of creating a
 * second copy. The slug is used raw: `händel-s-...` is a real live URL and
 * re-slugifying it would quietly break that post and only that post.
 */
export function postDocId(slug: string): string {
  return `post-${slug}`;
}

/**
 * Category names in the capture vary in case and spacing, and the same category
 * must resolve to the same document however it was typed in Wix.
 */
export function categoryDocId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `category-${slug}`;
}

export function isSermonPreview(categories: readonly string[] = []): boolean {
  return categories.some((c) => c.trim().toLowerCase() === SERMON_PREVIEW_CATEGORY);
}

export function postFromCapture(captured: CapturedPost) {
  if (!captured.publishedDate || Number.isNaN(Date.parse(captured.publishedDate))) {
    throw new Error(`publishedDate missing or unparseable for post "${captured.slug}"`);
  }
  return {
    _id: postDocId(captured.slug),
    _type: 'journalEntry',
    title: captured.title,
    slug: { _type: 'slug', current: captured.slug },
    publishedAt: captured.publishedDate,
    author: captured.author ?? undefined,
    // References, not strings: journalEntry.categories is an array of references
    // to journalCategory. Each member needs its own _key or Sanity rejects it.
    categories: (captured.categories ?? []).map((name, i) => ({
      _type: 'reference' as const,
      _key: `cat${i}`,
      _ref: categoryDocId(name),
    })),
    tags: captured.tags ?? [],
    excerpt: captured.excerpt ?? undefined,
    // No postKind / isSermonPreview field. Derived at render time from
    // `categories` via isSermonPreview(). See the note at the top of this file.
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm run test:unit -- --test-name-pattern="import-post"
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Add the `tags` field to the journal entry schema**

In `src/sanity/schemaTypes/journalEntry.ts`:

```ts
defineField({
  name: 'tags',
  title: 'Tags',
  type: 'array',
  of: [{ type: 'string' }],
  options: { layout: 'tags' },
  description: 'Short labels like "Advent" or "Mark". Press Enter after each one.',
}),
```

`tags` is a free-text array, not a dropdown that drives rendering, so it does
**not** go in `NON_STEGA_FIELDS`.

- [ ] **Step 6: Typegen, check, commit**

```bash
npm run typegen
npm run check
git add -A
git commit -m "Add the post transform and its gate, plus the tags field

isSermonPreview is derived from the category rather than stored, so the
weekly-preview distinction cannot drift from the categories it comes
from. Non-ASCII slugs are carried byte for byte: /post/händel-s-... is a
real live URL and re-slugifying would break that post alone."
```

---

### Task 9: Import the 142 posts

**Files:**
- Create: `scripts/import-posts.mjs`

**Interfaces:**
- Consumes: `postFromCapture` from Task 8, `makeUploader`, `client`, `APPLY`, `apply` from `scripts/lib/sanity-lib.mjs`.

- [ ] **Step 1: Write the runner**

```js
// scripts/import-posts.mjs
// Thin runner. All the RULES live in src/lib/import-post.ts, which is unit tested;
// this file only reads files, uploads images and writes documents.
//
// Dry by default: --apply is the only thing that writes.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { client, APPLY, makeUploader, ROOT } from './lib/sanity-lib.mjs';
import { postFromCapture, categoryDocId } from '../src/lib/import-post.ts';

const POSTS = resolve(ROOT, 'scripts/data/posts');
// The binaries are not in the repo. See ../fbcm-archive/README.md.
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive');

const uploader = makeUploader();
const files = readdirSync(POSTS).filter((f) => f.endsWith('.json') && f !== 'index.json');
const captures = files.map((f) => JSON.parse(readFileSync(resolve(POSTS, f), 'utf8')));

// Categories FIRST. Posts reference them, and a reference to a document that does
// not exist yet is a broken reference the Studio shows as a missing document.
const categoryNames = [...new Set(captures.flatMap((c) => c.categories ?? []))].sort();
for (const name of categoryNames) {
  const doc = { _id: categoryDocId(name), _type: 'journalCategory', title: name };
  if (APPLY) await client.createOrReplace(doc);
  else console.log(`would write ${doc._id} (${name})`);
}
console.log(`categories: ${categoryNames.length}`);

let written = 0;
const missingImages = [];

for (const captured of captures) {
  const doc = postFromCapture(captured);

  const cover = captured.coverImage?.localFile;
  if (cover) {
    try {
      doc.coverImage = { _type: 'image', asset: { _type: 'reference', _ref: await uploader.upload(resolve(ARCHIVE, cover)) } };
    } catch (e) {
      missingImages.push(`${captured.slug}: ${cover} (${e.message})`);
    }
  }

  if (APPLY) {
    await client.createOrReplace(doc);
    written++;
  } else {
    console.log(`would write ${doc._id} (${doc.slug.current})`);
  }
}

console.log(`\nposts: ${files.length}`);
console.log(APPLY ? `written: ${written}` : 'DRY RUN, nothing written. Pass --apply to write.');
if (missingImages.length) {
  console.log(`\nimages that could not be uploaded: ${missingImages.length}`);
  for (const m of missingImages) console.log('  ', m);
}
```

- [ ] **Step 2: Run the dry run and read the plan**

```bash
node scripts/import-posts.mjs
```

Expected: 5 `would write category-...` lines, `categories: 5`, then 142
`would write post-<slug>` lines, `DRY RUN, nothing written`, and no image errors.

The five are Sermon Preview, FBCM Events, Series Resources, Ruminations and Church
Resources. The sixth category on the old site, `pianist`, renders no posts and
appears in no post's categories, so it is correctly absent here; it is redirected
in Task 11 rather than recreated.

- [ ] **Step 3: Apply**

```bash
node scripts/import-posts.mjs --apply
```

Expected: `posts: 142`, `written: 142`.

- [ ] **Step 4: Prove idempotency by running it again**

```bash
node scripts/import-posts.mjs --apply
```

Expected: `written: 142` again, and the dataset document count unchanged. Verify:

```bash
npx sanity documents query 'count(*[_type == "journalEntry"])'
```

Expected: `142`, not 284.

- [ ] **Step 5: Run the route test that has been failing since Task 6**

```bash
npm run build
npm test -- --grep "original URL"
```

Expected: PASS. This is the test that proves the non-ASCII slug survived the whole
pipeline.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Import the 142 blog posts

Dry by default, createOrReplace with deterministic ids, so a re-run is a
no-op rather than a duplicate. Proved by running it twice and counting."
```

---

### Task 10: Import staff and ministries

**Files:**
- Create: `scripts/import-people.mjs`

- [ ] **Step 1: Write the runner**

```js
// scripts/import-people.mjs
// Staff from the 16 captured /team/* pages, ministries from the five captured
// ministry pages. Dry by default; --apply is the only thing that writes.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { client, APPLY, makeUploader, ROOT, toPT } from './lib/sanity-lib.mjs';

const PAGES = resolve(ROOT, 'scripts/data/pages');
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive');
const uploader = makeUploader();

const read = (file) => JSON.parse(readFileSync(resolve(PAGES, file), 'utf8'));
const slugOf = (url) => new URL(url).pathname.split('/').filter(Boolean).pop();

/**
 * The live site shows clerk@fbcmuncieorg on /team/nina-oisten, missing its dot.
 * Corrected on the way in, and REPORTED rather than fixed silently: a quiet
 * correction is indistinguishable from a bug the next time someone reads the data.
 */
const corrections = [];
function fixEmail(email, who) {
  if (!email) return undefined;
  const fixed = email.replace(/@fbcmuncieorg\b/, '@fbcmuncie.org');
  if (fixed !== email) corrections.push(`${who}: ${email} -> ${fixed}`);
  return fixed;
}

const imageRef = async (localFile) =>
  localFile
    ? { _type: 'image', asset: { _type: 'reference', _ref: await uploader.upload(resolve(ARCHIVE, localFile)) } }
    : undefined;

// --- staff ------------------------------------------------------------------
const staffFiles = readdirSync(PAGES).filter((f) => f.endsWith('.json') && read(f).url.includes('/team/'));
let staffCount = 0;

for (const [i, file] of staffFiles.entries()) {
  const p = read(file);
  const slug = slugOf(p.url);
  const email = fixEmail((p.links.find((l) => l.href.startsWith('mailto:')) ?? {}).href?.replace('mailto:', ''), slug);
  const doc = {
    _id: `staff-${slug}`,
    _type: 'staffMember',
    name: p.h1 ?? p.title,
    slug: { _type: 'slug', current: slug },
    role: p.headings.find((h) => h.level === 2)?.text,
    email,
    bio: p.bodyText?.trim() ? toPT(p.bodyText.trim()) : undefined,
    photo: await imageRef(p.images[0]?.localFile),
    order: (i + 1) * 10,
  };
  if (APPLY) { await client.createOrReplace(doc); staffCount++; }
  else console.log(`would write ${doc._id} (${doc.name})`);
}

// --- ministries -------------------------------------------------------------
const MINISTRIES = ['worship', 'children', 'youth', 'adult', 'outreach'];
let ministryCount = 0;

for (const [i, slug] of MINISTRIES.entries()) {
  const p = read(`${slug}.json`);
  const doc = {
    _id: `ministry-${slug}`,
    _type: 'ministry',
    title: p.h1 ?? p.title,
    slug: { _type: 'slug', current: slug },
    summary: p.metaDescription ?? undefined,
    body: p.bodyText?.trim() ? toPT(p.bodyText.trim()) : undefined,
    image: await imageRef(p.images[0]?.localFile),
    order: (i + 1) * 10,
  };
  if (APPLY) { await client.createOrReplace(doc); ministryCount++; }
  else console.log(`would write ${doc._id} (${doc.title})`);
}

console.log(`\nstaff: ${staffFiles.length}, ministries: ${MINISTRIES.length}`);
console.log(APPLY ? `written: ${staffCount} staff, ${ministryCount} ministries`
                  : 'DRY RUN, nothing written. Pass --apply to write.');
if (corrections.length) {
  console.log(`\nemail addresses corrected on the way in: ${corrections.length}`);
  for (const c of corrections) console.log('  ', c);
}
```

- [ ] **Step 2: Dry run**

```bash
node scripts/import-people.mjs
```

Expected: 16 staff, 5 ministries, and a printed line naming the corrected email.

- [ ] **Step 3: Apply and verify the counts**

```bash
node scripts/import-people.mjs --apply
npx sanity documents query 'count(*[_type == "staffMember"])'
npx sanity documents query 'count(*[_type == "ministry"])'
```

Expected: `16` and `5`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Import 16 staff members and 5 ministries

Corrects clerk@fbcmuncieorg to clerk@fbcmuncie.org on the way in, and
says so rather than fixing it silently."
```

---

### Task 11: The redirect documents

Five of these are URLs no crawl could have found: they exist on no current page and
were surfaced only by Search Console and the Internet Archive.

**Files:**
- Create: `src/lib/fbcm-redirects.ts`, `src/lib/fbcm-redirects.test.ts`, `scripts/import-redirects.mjs`

**Interfaces:**
- Produces: `fbcmRedirects(): { from: string; to: string; permanent: boolean; note: string }[]`, consumed by `scripts/import-redirects.mjs`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/fbcm-redirects.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fbcmRedirects } from './fbcm-redirects.ts';

test('no two redirects claim the same from-path', () => {
  const froms = fbcmRedirects().map((r) => r.from);
  assert.equal(new Set(froms).size, froms.length);
});

test('no redirect points at itself', () => {
  for (const r of fbcmRedirects()) assert.notEqual(r.from, r.to);
});

test('every from-path is a root-relative path', () => {
  for (const r of fbcmRedirects()) assert.match(r.from, /^\//);
});

test('the five former-staff URLs are covered', () => {
  // These exist on no current page. A crawl sees only what is published and a
  // sitemap lists only what exists, so these came from Search Console and the
  // Internet Archive. Without this test nothing would ever notice they are gone.
  const froms = new Set(fbcmRedirects().map((r) => r.from));
  for (const slug of ['emily-anderson', 'janis-wright', 'deena-green', 'jennifer-durke', 'leslie-pannell']) {
    assert.ok(froms.has(`/team/${slug}`), `missing redirect for former staff ${slug}`);
  }
});

test('no redirect targets a URL that itself redirects', () => {
  const map = new Map(fbcmRedirects().map((r) => [r.from, r.to]));
  for (const [from, to] of map) {
    assert.ok(!map.has(to.split('#')[0]), `${from} -> ${to} lands on another redirect`);
  }
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npm run test:unit -- --test-name-pattern="fbcm-redirects"
```

Expected: FAIL, cannot find module.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/fbcm-redirects.ts
// Every URL the Wix site served that this site does not. Pure data plus a couple
// of generated groups, so the test can check the shape of the whole set.
//
// astro.config.mjs turns published `redirect` documents into Astro's redirects
// map at BUILD time (see src/lib/redirects.ts), so these are real 301s.

export interface FbcmRedirect {
  from: string;
  to: string;
  permanent: boolean;
  note: string;
}

/** Staff whose pages are gone from the live site but still earn search clicks. */
const FORMER_STAFF = ['emily-anderson', 'janis-wright', 'deena-green', 'jennifer-durke', 'leslie-pannell'];

/** The 16 profiles that exist today and fold into /staff. */
const CURRENT_STAFF = [
  'andy-heimlich', 'caroline-koby', 'cheryl-flaherty', 'cynthia-smith',
  'dana-davis', 'ed-brzak', 'ella-mae-lemen', 'jaden-johnson',
  'joe-songer', 'jonathan-balmer', 'kendall-ellis', 'loraine-garrett',
  'molly-flodder', 'nina-oisten', 'sally-butler', 'sandi-brzak',
];

/** The five with real bios get their own anchor on /staff. */
const STAFF_WITH_BIOS = new Set(['cynthia-smith', 'kendall-ellis', 'jonathan-balmer', 'loraine-garrett', 'molly-flodder']);

const MINISTRIES = ['worship', 'children', 'youth', 'adult', 'outreach'];
const BLOG_CATEGORIES = ['sermon-preview', 'fbcm-events-1', 'series-resources', 'ruminations', 'church-resources', 'pianist'];

export function fbcmRedirects(): FbcmRedirect[] {
  return [
    { from: '/what-to-expect', to: '/visit', permanent: true, note: 'Merged into Visit' },
    { from: '/accessibility', to: '/visit#accessibility', permanent: true, note: 'Merged into Visit' },
    { from: '/architecture', to: '/visit#building', permanent: true, note: 'Merged into Visit' },
    { from: '/baptists', to: '/beliefs#baptists', permanent: true, note: 'Merged into Beliefs' },
    { from: '/membership', to: '/beliefs#membership', permanent: true, note: 'Merged into Beliefs' },
    { from: '/ministers', to: '/staff', permanent: true, note: 'Renamed to Staff' },
    { from: '/team', to: '/staff', permanent: true, note: 'Renamed to Staff' },
    { from: '/reservation', to: '/wedding', permanent: true, note: 'Merged into Weddings and Building Use' },
    { from: '/publications', to: '/blog#publications', permanent: true, note: 'Newsletters moved into the archive' },
    { from: '/church-app', to: '/contact', permanent: true, note: 'App links now live on Contact' },
    ...MINISTRIES.map((m) => ({
      from: `/${m}`, to: `/ministries#${m}`, permanent: true, note: 'Merged into Ministries',
    })),
    ...CURRENT_STAFF.map((s) => ({
      from: `/team/${s}`,
      to: STAFF_WITH_BIOS.has(s) ? `/staff#${s}` : '/staff',
      permanent: true,
      note: 'Staff profiles consolidated onto one page',
    })),
    ...FORMER_STAFF.map((s) => ({
      from: `/team/${s}`, to: '/staff', permanent: true,
      note: 'Former staff; page already gone from Wix but still earning search clicks',
    })),
    ...BLOG_CATEGORIES.map((c) => ({
      from: `/blog/categories/${c}`, to: `/blog?category=${c}`, permanent: true,
      note: 'Category listing moved onto the blog index',
    })),
  ];
}
```

- [ ] **Step 4: Run the tests**

```bash
npm run test:unit -- --test-name-pattern="fbcm-redirects"
```

Expected: PASS, 5 tests, 37 redirects generated.

- [ ] **Step 5: Write and dry-run the importer**

`scripts/import-redirects.mjs` writes one `redirect` document per entry with id
`redirect-<from slugified>`, `createOrReplace`, dry by default.

```bash
node scripts/import-redirects.mjs
node scripts/import-redirects.mjs --apply
```

- [ ] **Step 6: Verify a redirect actually serves a 301 after a build**

```bash
npm run build
npm run preview
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:8787/ministers
```

Expected: `301` and a location ending `/staff`. A redirect document that does not
produce a real 301 is a redirect that does not exist.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add the retired-URL redirects, including five nothing could crawl

emily-anderson, janis-wright, deena-green, jennifer-durke and
leslie-pannell exist on no current page and still earn search clicks. A
crawl sees only what is published; these came from Search Console and
the Internet Archive, and a test now keeps them."
```

---

### Task 12: Analytics

There is no Google Analytics property to inherit. The church has only Wix's
built-in analytics, which transfers nowhere.

**Files:**
- Modify: `.env`, GitHub repository variables

- [ ] **Step 1: Set the Cloudflare Web Analytics token**

Create a Web Analytics site in the Cloudflare dashboard for the `workers.dev`
hostname, and set its token as the environment variable
`src/components/analytics/CloudflareBeacon.astro` reads. Cloudflare Web Analytics
is cookieless, so no consent banner is needed, which matters on a site nobody is
paid to maintain.

- [ ] **Step 2: Leave `PUBLIC_GA_ID` unset**

`src/components/Analytics.astro` is a silent no-op when its variable is unset. Do
not set a GA id: there is no existing property to continue, and starting one
creates a consent-banner obligation for no benefit.

- [ ] **Step 3: Verify the beacon ships and GA does not**

```bash
npm run build
grep -r "cloudflareinsights" dist/client/index.html && echo "beacon present"
grep -r "googletagmanager" dist/client/index.html && echo "UNEXPECTED GA" || echo "no GA, correct"
```

Expected: `beacon present` and `no GA, correct`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Wire Cloudflare Web Analytics, and deliberately no GA

The church has only Wix's built-in analytics, which transfers nowhere,
so there is no property to continue. The 60-day baseline and twelve
months of Search Console data are captured in
scripts/data/analytics-baseline.json to measure the rebuild against."
```

---

## Definition of done for this plan

- [ ] `npm run check` reports 0 errors
- [ ] `npm run test:unit` passes, including the three new suites
- [ ] `npm run format:check` passes
- [ ] `npm test` passes, including the non-ASCII post-URL test
- [ ] `npm run audit:studio` exits 0
- [ ] `node scripts/verify-archive.mjs` reports 424/424
- [ ] The deployed `workers.dev` URL serves `/blog`, a post, and `/studio` with a clean console
- [ ] `count(*[_type == "journalEntry"])` is 142 after running the import twice
- [ ] `/ministers` returns a real 301 to `/staff`
- [ ] `docs/PENDING.md` records anything left open

Design work is deliberately not in this plan. Every page still renders the
starter's default sections. That is correct: a design decision made against
placeholder copy is a guess, and plan 2 starts once the content is real.
