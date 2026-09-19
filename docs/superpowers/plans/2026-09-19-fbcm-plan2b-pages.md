# FBCM Plan 2b: The Eleven Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every page in the church's nav exists, composed from the plan-2a blocks with the church's own words, seeded idempotently into Sanity, screenshotted in both themes at both viewports as the review set for Nathan.

**Architecture:** Each page is a `page` document (or the `homePage` singleton) whose `pageBuilder` array is produced by one seed module under `scripts/pages/<slug>.mjs`, driven by `scripts/seed-pages.mjs` (dry by default, `--apply`, backup-first, `--only <slug,...>`). Page photographs come from the Wix archive through one resize-and-upload helper keyed by archive path, so re-runs never re-upload. Copy that did not exist on Wix is declared by each module as `newCopy` and aggregated into `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` by the same run. The blog gains static category, tag and page routes so plan 1's `/blog?category=` redirects resolve without SSR.

**Tech Stack:** Astro 7 static, Sanity v6 (embedded Studio), Tailwind 4 tokens from plan 2a, `sharp` (already a transitive dependency of Astro; used from a script), `@portabletext/block-tools` ONLY in Task 16 and only after Nathan approves it.

**Spec:** `docs/superpowers/specs/2026-09-19-fbcm-plan2-pages-design.md` (sections 5, 6, 8 and 9 bind this plan). Facts gathered before writing: `docs/superpowers/notes/2026-09-19-plan2b-facts.md`. Content sources per page: `docs/superpowers/notes/2026-09-19-content-map.md`. Photo choices: `docs/superpowers/notes/2026-09-19-photo-survey.md`.

## Global Constraints

- No em-dashes in any site copy, schema description, or seeded string (CLAUDE.md rule 2). Plans and code comments are exempt.
- Blocks carry no colour field; `src/lib/section-fields.test.ts` is the gate (rule 9). Surfaces come from `sectionCadence.ts`.
- One grammar per page (rule 17): `SectionHeading` left-aligned with the gold rule, `max-w-content px-m` container, buttons only through `CtaLink` `gold` / `outline`.
- Gold text sits only on indigo, indigo-field or brown grounds. Never `text-cream` or `text-indigo` on a flipping ground (both invert in `.dark`); use `text-bg` / `text-foreground`.
- Derive, never store (rule 15): sermon-preview status from category; coordinators from `staffMember` documents; office hours, address, phone, URLs from `siteSettings`. No page retypes a fact that lives in Site settings.
- Every dataset write is idempotent (`createOrReplace` with deterministic `_id`, or a patch guarded on the exact condition), dry by default, `--apply` to act, and writes a verbatim backup of the existing document to `scripts/data/backups/<id>-2026-09-19-plan2b.json` BEFORE the first write (rule 16). Backups are committed.
- Any logic-driving dropdown added to a schema goes into `NON_STEGA_FIELDS` in `src/lib/cms-preview.ts` in the same commit (rule 8b). Never compare or measure a display string without `splitStega()`.
- No new dependency without Nathan's explicit approval. The only candidate is `@portabletext/block-tools` (Task 16, gated).
- The church's words are the copy. New sentences are allowed only where the spec says "New copy", and every one is declared in the module's `newCopy` array so it lands in the approval note.
- Photos of identifiable children are used only where the spec places them (home frame 3, Visit hero, Ministries children band) and each use is listed in the approval note under "photo consent".
- Never `npm audit fix --force`. Never click Remove field. Brand tokens unchanged. `scripts/.parity` is not recaptured in this plan (plan 2c does it once).
- Each page task ends with four screenshots at `docs/superpowers/screenshots/2026-09-19/page-<slug>-{light,dark}-{375,1280}.png`, full page, taken after every `<img>` reports `complete && naturalWidth > 0`. They are the review set.
- Gates before each commit: `npm run typegen && npm run check && npm run test:unit && npm run audit:studio`. Before the last commit of each task: `npm run build && npm test` and `npm run format:check`. `npm run check:links` must lose one red route per page task and be green after Task 14.
- Model guidance for the controller: Tasks 1, 4, 15 and 16 need judgement (standard or capable model); Tasks 2, 3, 17 are mechanical; the page tasks 5 to 14 need copy judgement in the church's voice (standard model at minimum, capable for Home, Who We Are, Beliefs and History).

---

## File structure

**Created**
- `scripts/lib/page-images.mjs`: `resizeAndUpload(relPath, opts)` resize with sharp to a bounded width, upload once, cache by archive path.
- `scripts/data/page-images.json`: the manifest of every photograph a page uses: key, archive path, alt, max width, crop hint.
- `scripts/lib/page-copy.mjs`: portable text helpers (`paragraphs`, `heading`, `bullets`, `link`, `fromCaptureParagraphs`) and `textFile(slug)` that reads `scripts/data/pages/<slug>.txt`.
- `scripts/seed-pages.mjs`: the runner (`--only`, `--apply`, backups, approval note aggregation).
- `scripts/pages/{home,visit,who-we-are,beliefs,ministries,staff,history,wedding,give,contact,privacy,not-found}.mjs`: one module per page, each exporting `{ id, type, build(ctx), newCopy, photoConsent }`.
- `scripts/set-staff-groups.mjs`: backup-then-patch `staffMember.group`, add Julie Kirklin, fix two emails.
- `scripts/retire-contact-page.mjs`: backup-then-delete the `contactPage` singleton if it exists (Task 14).
- `src/lib/blog-derive.ts` (+ test): `splitDurable(entries)`, `paginate(items, size)`, `seriesByTag(entry, all, limit)`, `weekOfEyebrow(entry)`.
- `src/pages/blog/page/[page].astro`, `src/pages/blog/category/[slug].astro`, `src/pages/blog/tag/[tag].astro`.
- `src/lib/anchor.ts` (+ test): `sectionAnchor(section, fallbackId)`.
- `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` (generated; committed).
- `src/lib/convert-body.ts` (+ test) and `scripts/reimport-post-bodies.mjs` (Task 16 only).

**Modified**
- `src/components/CtaLink.astro`, `src/components/FinalCta.astro`, `src/pages/styleguide.astro` (primary/secondary become gold/outline).
- `.github/workflows/ci.yml` (job-level Sanity env on `build` and `test`).
- `src/sanity/schemaTypes/sections.ts`, `churchSections.ts`, `richSections.ts` (shared `anchorField()`), `src/components/SectionRenderer.astro`, `src/lib/queries.ts` (project `anchor`), `src/lib/pageBuilder.types.ts`, `src/lib/cms-preview.ts` (`'current'`), `src/lib/section-fields.ts` if its registry lists per-block fields.
- `src/pages/blog/index.astro`, `src/pages/post/[slug].astro`, `src/components/JournalCard.astro`.
- `src/lib/reservedSlugs.ts`, `src/pages/[slug].astro` (`contact` leaves the reserved set), `tests/routes.ts`, `src/lib/redirects` untouched.
- `src/pages/404.astro`, `src/pages/privacy.astro` (read their singletons' new `pageBuilder`/`body`).
- `docs/PENDING.md`, `CLAUDE.md` routes table, `public/llms.txt`.

**Deleted (Task 14, after backup)**
- `src/pages/contact.astro`, `src/components/ContactForm.tsx`, `src/components/CalendlyInline.tsx`, `src/components/ServiceAreaMap.astro`, `src/sanity/schemaTypes/contactPage.ts` and its desk entry, `scripts/seed-core.mjs` contactPage seed, Web3Forms env reads. `businessInfo.ts` stays until plan 2c confirms no reader.

---

### Task 1: Foundations: one button family, stable anchors, CI builds with content

**Files:**
- Modify: `src/components/CtaLink.astro`, `src/components/FinalCta.astro`, `src/pages/styleguide.astro`, `.github/workflows/ci.yml`, `src/sanity/schemaTypes/sections.ts`, `src/sanity/schemaTypes/churchSections.ts`, `src/sanity/schemaTypes/richSections.ts`, `src/components/SectionRenderer.astro`, `src/lib/queries.ts`, `src/lib/pageBuilder.types.ts`, `src/lib/cms-preview.ts`, `src/lib/sectionCadence.ts`
- Create: `src/lib/anchor.ts`, `src/lib/anchor.test.ts`
- Test: `src/lib/anchor.test.ts`, `src/lib/theme-tokens.test.ts` (unchanged, must stay green)

**Interfaces:**
- Produces: `CtaLink` variants `gold | outline` only (`primary` and `secondary` become aliases that map to `gold` and `outline` so old callers keep compiling, with a deprecation comment). `anchorField()` exported from `src/sanity/schemaTypes/_anchorField.ts`, a `slug` field named `anchor` with description "Optional. A short id such as `baptists` so a link can jump to this section: /beliefs#baptists. Letters, numbers and hyphens." `sectionAnchor(section, fallbackId): string` in `src/lib/anchor.ts`. Every section wrapper in `SectionRenderer` gets `id={sectionAnchor(s, headingId)}` and the component's heading keeps `headingId` for `aria-labelledby`.

- [ ] **Step 1: Failing test for the anchor helper.** Create `src/lib/anchor.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectionAnchor } from './anchor.ts';

test('an explicit anchor wins over the generated id', () => {
  assert.equal(sectionAnchor({ anchor: { current: 'baptists' } }, 'page-3'), 'baptists');
});

test('a missing or empty anchor falls back to the generated id', () => {
  assert.equal(sectionAnchor({}, 'page-3'), 'page-3');
  assert.equal(sectionAnchor({ anchor: { current: '   ' } }, 'page-3'), 'page-3');
});

test('an anchor is cleaned of stega markers and unsafe characters', () => {
  const stega = 'bap​tists﻿';
  assert.equal(sectionAnchor({ anchor: { current: stega } }, 'x'), 'baptists');
  assert.equal(sectionAnchor({ anchor: { current: 'Our Pledge!' } }, 'x'), 'our-pledge');
});
```

- [ ] **Step 2: Run it, expect failure** (`node --test src/lib/anchor.test.ts` fails with cannot find module).

- [ ] **Step 3: Implement `src/lib/anchor.ts`:**

```ts
// Safe to edit by hand
// One place that turns a section's optional `anchor` slug into the id on its
// wrapper, so /beliefs#baptists lands on the right band no matter how the editor
// reorders the page. Falls back to the cadence's index id when no anchor is set.
import { splitStega } from './preview-stega';

type Anchored = { anchor?: { current?: string | null } | null };

export function sectionAnchor(section: Anchored, fallbackId: string): string {
  const raw = section?.anchor?.current ?? '';
  const clean = splitStega(String(raw)).text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean.length > 0 ? clean : fallbackId;
}
```

If `splitStega` returns a different shape in `src/lib/preview-stega.ts`, use its actual return (read the file); the test pins the behaviour, not the API.

- [ ] **Step 4: Run the test, expect PASS.**

- [ ] **Step 5: Schema.** Create `src/sanity/schemaTypes/_anchorField.ts`:

```ts
import { defineField } from 'sanity';
/** Optional per-section id so a link can jump to it. Shared by every block that can be a link target. */
export const anchorField = () =>
  defineField({
    name: 'anchor',
    title: 'Jump-to id (optional)',
    type: 'slug',
    description:
      'A short id such as baptists so a link can jump to this section: /beliefs#baptists. Letters, numbers and hyphens.',
    options: { maxLength: 40 },
  });
```

Add `anchorField()` as the LAST field of: `richTextSection`, `imageTextSection`, `gallerySection`, `quoteSection`, `logoStripSection`, `dynamicListSection`, `sundayTimesSection`, `timelineSection`, `staffGridSection`, `faqSection`, `scriptureBandSection`, `heritageBandSection`, `giveBandSection`, `documentListSection`. Not on `heroSection`, `ctaBandSection`, `spacerSection`. Project `anchor` in `sectionsProjection()` for those types (`anchor,` is enough: GROQ returns the object). Add `anchor?: { current?: string | null } | null` to the shared projected section base type in `pageBuilder.types.ts`. Add `'current'` to `NON_STEGA_FIELDS` with the comment "slug.current: an id or a URL segment, never display text". Run `npm run audit:studio` (check 3 will be clean because the field is new and no document stores it).

- [ ] **Step 6: Renderer.** In `SectionRenderer.astro`, where the wrapper element for each section is emitted, set `id={sectionAnchor(s, headingId)}` on the wrapper (the real block box, not `display: contents`) and stop putting `headingId` on the wrapper if it was; the heading element inside the component keeps `id={headingId}`. If two sections resolve to the same anchor, the second gets `-2` appended (compute in the renderer's map with a `Set`). `npm run typegen && npm run check`: 0 errors.

- [ ] **Step 7: One button family.** In `CtaLink.astro` make `primary` resolve to the `gold` classes and `secondary` to the `outline` classes (keep the variant union so callers compile), with a comment dated 2026-09-19 that the bronze pair was retired and `gold`/`outline` are the names to use. Change `FinalCta.astro` to call `variant="gold"` and `variant="outline"` explicitly, and the styleguide's three `variant="primary"` calls to `gold`. Grep `src/` for `bg-primary-dark|text-primary-dark|hover:bg-accent-dark` in button contexts and replace with the gold/outline classes; leave the tokens themselves in `globals.css` (other non-button uses may exist; list them in the report). `npm run test:unit`: `theme-tokens` still green.

- [ ] **Step 8: CI builds with content.** In `.github/workflows/ci.yml`, add to BOTH the `build` job and the `test` job a job-level

```yaml
    env:
      PUBLIC_SANITY_PROJECT_ID: ${{ vars.PUBLIC_SANITY_PROJECT_ID }}
      PUBLIC_SANITY_DATASET: ${{ vars.PUBLIC_SANITY_DATASET }}
```

keeping the existing step-level env on the public-data audit as is. Add a comment above each: "Public identifiers (they ship in every image URL). Without them `sanityFetch` returns fallbacks and the static build has zero posts, which is why the non-ASCII slug smoke test 404'd on CI from plan 1 (2026-09-19)." Do not mark the file PORTABLE. Confirm the repo variables exist with `gh variable list` (expect `PUBLIC_SANITY_PROJECT_ID 7jw947g5`, `PUBLIC_SANITY_DATASET production`).

- [ ] **Step 9: Gates.** `npm run typegen && npm run check && npm run test:unit && npm run audit:studio && npm run format:check && npm run build && npm test`. Expected: all green (unit count rises by 3).

- [ ] **Step 10: Commit.** `git add -A && git commit -m "Plan 2b foundations: one button family, section anchors, CI builds with content"`

---

### Task 2: Page photographs: resize once, upload once, key by archive path

**Files:**
- Create: `scripts/lib/page-images.mjs`, `scripts/data/page-images.json`
- Modify: `.gitignore` (add `scripts/.page-images/`)
- Test: a dry run that prints the plan and a wet run that uploads

**Interfaces:**
- Produces: `resizeAndUpload(key)` returning `{ _type: 'image', asset: { _type: 'reference', _ref }, alt, hotspot? }` ready to drop into a block; `loadManifest()`; the manifest keys listed below, which page modules use by name.

- [ ] **Step 1: The manifest.** Write `scripts/data/page-images.json` as an object keyed by name. Archive paths are relative to the repo root's sibling `../fbcm-archive/images/`. Fill EVERY entry from `docs/superpowers/notes/2026-09-19-photo-survey.md` (it names the file for each role); the five hero frames are fixed:

```json
{
  "hero-tower":        { "file": "08181c_087c222f4750499ba5c0a6c514267c35_tilde_mv2.jpg", "alt": "The limestone bell tower of First Baptist Church against a blue sky", "maxWidth": 2400 },
  "hero-sanctuary":    { "file": "08181c_ac4bdf55910a4bf08971622eadbe31f6_tilde_mv2.jpg", "alt": "The sanctuary from the balcony, light through the stained glass", "maxWidth": 2400 },
  "hero-children":     { "file": "08181c_b178e014f570469ba249e1dd6f8c4122_tilde_mv2.jpg", "alt": "Children gathered under the sanctuary arch", "maxWidth": 2400, "consent": true },
  "hero-congregation": { "file": "08181c_37d562a315d04a83afc879ec7ee9a460_tilde_mv2.jpg", "alt": "The congregation standing to sing on a Sunday morning", "maxWidth": 2400, "crop": { "top": 0, "bottom": 0.18 } },
  "hero-building":     { "file": "08181c_be2602489e0d4b63929aa41445a72ff6_tilde_mv2.jpg", "alt": "The corner of the church at Adams and Jefferson", "maxWidth": 2400, "crop": { "left": 0, "right": 0.38 } }
}
```

Add keys, each with `file`, `alt`, `maxWidth` (2400 for heroes and heritage bands, 1600 for image-text and gallery, 1200 for portraits): `visit-children`, `whoweare-congregation`, `beliefs-glass`, `ministries-worship-team`, `ministries-handbells`, `ministries-children`, `ministries-youth`, `staff-deacons-2026`, `history-1859` … one per era the survey names (`history-era-1` to `history-era-7`), `wedding-sanctuary`, `wedding-bridal-suite`, `wedding-fellowship-hall`, `wedding-kitchen`, `wedding-youth-center`, `wedding-exterior`, `contact-building`, `logo-abcusa`, `logo-abc-indiana-kentucky`, `notfound-tower`. If the survey has no candidate for a role, set `"file": null` and the page module renders that block without an image (the report lists every null).

- [ ] **Step 2: The helper.** `scripts/lib/page-images.mjs`:

```js
// Resize a Wix archive photograph once, upload it once, and hand back a Sanity image
// object for a block. Idempotent: the resized file is cached under scripts/.page-images/
// (gitignored) and the upload is cached by makeUploader in scripts/.asset-map.json,
// both keyed by the archive-relative path, so a re-run uploads nothing.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { makeUploader } from './sanity-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARCHIVE = resolve(ROOT, '..', 'fbcm-archive', 'images');
const CACHE = resolve(ROOT, 'scripts', '.page-images');
const MANIFEST = resolve(ROOT, 'scripts', 'data', 'page-images.json');

export function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

export function makePageImages(uploadClient) {
  const uploader = makeUploader(uploadClient);
  const manifest = loadManifest();
  mkdirSync(CACHE, { recursive: true });

  async function resized(key) {
    const entry = manifest[key];
    if (!entry) throw new Error(`page-images: no manifest entry "${key}"`);
    if (!entry.file) return null;
    const src = resolve(ARCHIVE, entry.file);
    if (!existsSync(src)) throw new Error(`page-images: missing archive file ${src}`);
    const out = resolve(CACHE, `${key}.jpg`);
    if (!existsSync(out)) {
      let img = sharp(src).rotate();
      const meta = await img.metadata();
      if (entry.crop) {
        const c = entry.crop;
        const left = Math.round((c.left ?? 0) * meta.width);
        const top = Math.round((c.top ?? 0) * meta.height);
        const width = Math.round(meta.width * (1 - (c.left ?? 0) - (c.right ?? 0)));
        const height = Math.round(meta.height * (1 - (c.top ?? 0) - (c.bottom ?? 0)));
        img = img.extract({ left, top, width, height });
      }
      await img.resize({ width: entry.maxWidth, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
    }
    return { out, entry };
  }

  /** Returns a block-ready image object, or null when the manifest has no file. */
  async function image(key) {
    const r = await resized(key);
    if (!r) return null;
    const rel = `scripts/.page-images/${key}.jpg`;
    const _ref = await uploader.upload(rel);
    return { _type: 'image', asset: { _type: 'reference', _ref }, alt: r.entry.alt };
  }

  return { image, manifest };
}
```

Check `makeUploader.upload(relPath)` resolves relative to the repo root (`scripts/lib/sanity-lib.mjs:177-205`); if it resolves relative to the archive, pass the absolute path instead and say so.

- [ ] **Step 3: Dry and wet.** Add `scripts/upload-page-images.mjs` that loads the manifest, prints one line per key (file, exists, size, target width), and with `--apply` calls `image(key)` for every key and prints the asset id. Run dry; paste the table into the report; run `--apply`; expect one asset per non-null key, and a second `--apply` run printing "cached" for all. `count(*[_type=='sanity.imageAsset'])` rises by the number of non-null keys and by nothing on the second run.

- [ ] **Step 4: Commit.** `git add scripts/lib/page-images.mjs scripts/data/page-images.json scripts/upload-page-images.mjs .gitignore && git commit -m "Page photographs: resize once, upload once, keyed by archive path"`

---

### Task 3: Staff data: groups, Julie Kirklin, two emails

**Files:**
- Create: `scripts/set-staff-groups.mjs`
- Test: `node scripts/set-staff-groups.mjs` (dry) then `--apply`; `npm run audit:studio`

**Interfaces:**
- Consumes: `STAFF_GROUPS` from `src/lib/church-derive.ts` (`pastors | coordination | support`).
- Produces: every `staffMember` has `group`; `staffMember-julie-kirklin` exists; the moderator's contact is `moderator@fbcmuncie.org`; the deacon chair's email has an `@`.

- [ ] **Step 1: Mapping, from role.** In the script:

```js
// Group is derived from the role the church itself gave each person on the Wix
// team page; this map is the one place that reading is written down.
const GROUP_BY_SLUG = {
  'kendall-ellis': 'pastors', 'jonathan-balmer': 'pastors', 'cynthia-smith': 'pastors',
  'caroline-koby': 'support', 'ella-mae-lemen': 'support', 'julie-kirklin': 'support',
};
// Everyone else on the Church Coordination Team:
const DEFAULT_GROUP = 'coordination';
```

Read the 16 current slugs from `CURRENT_STAFF` in `src/lib/fbcm-redirects.ts` (import it or duplicate with a drift check) and `scripts/data/pages/team-*.json` for Julie Kirklin's name, role, email and portrait file (the fact sheet says a portrait exists; find it in `scripts/data/images-manifest.json` by her name and upload it with `makePageImages` under key `staff-julie-kirklin`).

- [ ] **Step 2: Backup-then-patch.** For each staff doc: fetch, write `scripts/data/backups/staffMember-<slug>-2026-09-19-plan2b.json`, then `patch(id).set({ group })` only when `group` differs; `createIfNotExists` Julie Kirklin with `_id: 'staffMember-julie-kirklin'`, `order` after the last support member, `group: 'support'`; patch the moderator's email to `moderator@fbcmuncie.org` and the deacon chair's to the corrected address ONLY if the stored value equals the known-bad string (print both). Dry prints the whole plan; `--apply` acts. Run dry, paste, run `--apply`, re-run dry (expect "nothing to do").

- [ ] **Step 3: Prove.** `npx sanity documents query "*[_type=='staffMember']{name,group}|order(group asc)"` shows 3 pastors, 3 support, 11 coordination (17 total). `npm run audit:studio` clean. Update `CURRENT_STAFF` in `src/lib/fbcm-redirects.ts` to 17 (add `julie-kirklin`) and its test count; `npm run test:unit` green.

- [ ] **Step 4: Commit.** `git add -A && git commit -m "Staff: groups from roles, Julie Kirklin added, two emails corrected"`

---

### Task 4: The page seeder and the approval note

**Files:**
- Create: `scripts/lib/page-copy.mjs`, `scripts/seed-pages.mjs`, `scripts/pages/_example.mjs` (deleted at the end of the task)
- Test: `scripts/lib/page-copy.test.mjs` run with `node --test scripts/lib/page-copy.test.mjs` (add it to the `test:unit` glob if that glob is `src/lib` only; otherwise leave it as a script-level test and run it in Step 6)

**Interfaces:**
- Produces, in `page-copy.mjs`: `paragraphs(text, keyPrefix)` splits on blank lines into `normal` blocks; `heading(text, level, key)`; `bullets(lines, keyPrefix)`; `link(text, href, key)` inline mark; `fromCapture(slug, { from, to })` returns the paragraphs between two anchor phrases in `scripts/data/pages/<slug>.txt`; `ctaExternal(label, url)` and `ctaInternal(label, path)` produce `ctaBlock` objects matching `src/sanity/schemaTypes/ctaBlock.ts` (read it for field names: `label`, `linkType`, `externalUrl`, `internalPath` or a reference; match exactly).
- Produces, in `seed-pages.mjs`: a module contract

```js
export default {
  id: 'page-visit',            // deterministic _id
  type: 'page',                // or 'homePage' | 'privacyPage' | 'notFoundPage'
  slug: 'visit',
  async build(ctx) { return { title, slug: { _type: 'slug', current }, pageBuilder: [...], seoTitle, seoDescription, addToMainNav: false } },
  newCopy: ['...'],            // every sentence that did not exist on Wix
  photoConsent: ['hero-children'], // manifest keys of identifiable-children photos used
};
```

`ctx = { images: makePageImages(client), copy: page-copy exports, settings: live siteSettings, staff: live staffMember[], keys: keyer }` where `keyer(prefix)` yields stable `_key`s `${prefix}-${n}`.

- [ ] **Step 1: Failing tests for the copy helpers:**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paragraphs, bullets, link } from './page-copy.mjs';

test('paragraphs split on blank lines and get stable keys', () => {
  const out = paragraphs('One.\n\nTwo.', 'p');
  assert.equal(out.length, 2);
  assert.equal(out[0]._key, 'p-1');
  assert.equal(out[1].children[0].text, 'Two.');
});

test('bullets produce list items with a shared listItem style', () => {
  const out = bullets(['a', 'b'], 'b');
  assert.equal(out[1].listItem, 'bullet');
  assert.equal(out[1].level, 1);
});

test('a link becomes a span with a markDef', () => {
  const block = link('the form', 'https://example.org/f', 'l');
  assert.equal(block.markDefs[0].href, 'https://example.org/f');
  assert.deepEqual(block.children[0].marks, [block.markDefs[0]._key]);
});
```

- [ ] **Step 2: Run, expect failure.** **Step 3: Implement `page-copy.mjs`** to make them pass (plain functions, no Sanity import). `decodeEntities` from `src/lib/import-post.ts` cannot be imported from `.mjs` if it is TS; copy the six-entity map into the helper with a comment naming the source.

- [ ] **Step 4: The runner.** `scripts/seed-pages.mjs`:
  - Args: `--only a,b`, `--apply`, `--list`. Dry by default.
  - Loads every module in `scripts/pages/*.mjs` (skip files starting with `_`), builds each requested page with `ctx`.
  - For each: fetch the live document by `_id`; write backup `scripts/data/backups/<id>-2026-09-19-plan2b.json` (`null` if absent) before any write; print a plan line per section: `n. <_type>  <heading|headline|verse|first 60 chars>`; in `--apply`, `createOrReplace({ _id, _type, ...built })`.
  - After building (dry or wet), regenerate `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md`: a header explaining what it is, then one `## /<slug>` section per module with `### New sentences` (each `newCopy` line as a bullet) and `### Photos of children` (keys with their alts), then a final `## Facts the church must confirm` block copied verbatim from spec section 9. Deterministic output so the file only changes when copy changes.
  - Reads `.env` like `seed-core.mjs` does (same client construction; never print the token).

- [ ] **Step 5: `_example.mjs`** proving the contract end to end with two sections (a hero and a richText), run `node scripts/seed-pages.mjs --only example` dry and check the printed plan and the generated note; then delete `_example.mjs` and regenerate the note (empty sections list). Do NOT `--apply` the example.

- [ ] **Step 6: Gates and commit.** `node --test scripts/lib/page-copy.test.mjs` green; `npm run check`; `git add -A && git commit -m "The page seeder: one module per page, dry by default, approval note generated"`

---

### Task 5: Home `/`

**Files:**
- Create: `scripts/pages/home.mjs`
- Modify: `src/data/defaultSections.ts` only if a type change requires it (it should not)
- Test: seed dry, `--apply`, build, four screenshots

**Interfaces:** consumes Tasks 1 to 4. Produces the `homePage` singleton's `pageBuilder`.

- [ ] **Step 1: Compose** exactly spec 5.1, in this order, using `ctx.images` keys and `ctx.copy`:
  1. `heroSection`: `layout: 'full'`, `frames: [hero-tower, hero-sanctuary, hero-children, hero-congregation, hero-building]`, `eyebrow: 'A downtown church in Muncie, Indiana'`, `headline: 'Praise and proclaim.'` with `headingAccent`/`accentWord` mechanism the hero supports for the word `proclaim` (read `Hero.astro`: if the hero has no accent field, put the accent in the styleguide-proven way or leave the headline plain and note it), `subhead: ctx.settings.tagline`, `facts: [{label:'Sundays', value:'10:45 am'}, {label:'Where', value:'309 East Adams Street'}, {label:'Online', value:'Live on YouTube'}]` (values read from `ctx.settings.serviceTime` and `.address` first line, not retyped), `primaryCta: ctaInternal('Plan a visit', '/visit')`, `secondaryCta: ctaExternal('Watch online', ctx.settings.livestreamUrl)`.
  2. `sundayTimesSection`: heading `When we gather`, items `10:45 am / Worship / The main service, in the sanctuary`, `Find us / 309 East Adams / Downtown, at Adams and Jefferson`, `Can't be there? / Online / The service streams live on YouTube`, `showMap: true`, doors omitted (the Visit page carries them).
  3. `imageTextSection` (hero-sanctuary or a second sanctuary photo from the survey): eyebrow `Your first Sunday`, heading `What a first Sunday is like`, body two paragraphs FROM `what-to-expect.txt` (the arrival and the service paragraphs, verbatim), cta `Plan a visit` → `/visit`.
  4. `richTextSection` heading `A Baptist church in the heart of downtown since 1859.` with body as three short paragraphs each beginning with a bold lead and ending with a link: `What we believe` → `/beliefs`; `How we serve` → `/ministries`; `Where we've been` → `/history` (new copy, three sentences, declared).
  5. `heritageBandSection` (hero-tower): eyebrow `The building`, heading `Limestone, oak and glass`, body one sentence (new, declared), cta `The building's story` → `/history#building`.
  6. `dynamicListSection`: source `journal`, limit 3, headline `From the blog`, cta `All posts` → `/blog`. Task 15 makes the list durable-first; here it is composed.
  7. `giveBandSection`: heading `Support the work of this church`, body one sentence (new, declared), `buttonLabel` default, `buttonUrl` omitted (falls back to settings).
  SEO: `seoTitle: 'First Baptist Church Muncie | Sundays 10:45 am, downtown Muncie'`, `seoDescription: tagline + ' 309 East Adams Street, Muncie, Indiana.'`.
  `newCopy`: the kicker, the three-up sentences, the heritage sentence, the give sentence. `photoConsent: ['hero-children']`.

- [ ] **Step 2: Seed.** `node scripts/seed-pages.mjs --only home` dry, read the plan, `--apply`. `npx sanity documents get homePage | head -c 600` shows the array.

- [ ] **Step 3: Build and look.** `npm run build && npm run preview`. Screenshot `/` as `page-home-{light,dark}-{375,1280}.png` with the image-load wait; also `page-home-hero-10s.png` at 1280 ten seconds after load (frame two or three visible). Check: hero frames cycle, pause works, facts read, one left edge down the page, band cadence alternates, the dynamic list shows three posts, no gold on cream.

- [ ] **Step 4: Gates and commit.** `npm run check && npm run test:unit && npm test && npm run format:check`; `git add -A && git commit -m "Home: five-frame hero, Sunday band, three doors into the site, heritage, blog, give"`

---

### Task 6: Visit `/visit`

**Files:** Create `scripts/pages/visit.mjs`. Test: seed, build, screenshots. `npm run check:links` loses `/visit`.

- [ ] **Step 1: Compose** spec 5.2:
  1. `heroSection` `layout: 'split'`, `frames: [visit-children]`, eyebrow `Plan a visit`, headline `Your first Sunday, start to finish.`, subhead one sentence (new, declared), facts Sundays 10:45 / 309 East Adams / About an hour (from settings `serviceTime`, `address`, `serviceLength`), primary `Fill in a visitor card` → `ctx.settings.visitorFormUrl`, secondary `Watch a service` → `livestreamUrl`.
  2. `timelineSection` heading `How the morning runs`, rows 9:30 Sunday school / 10:15 Donut hour / 10:45 Worship / First Sundays Communion, bodies verbatim from `what-to-expect.txt`; the nursery row body says "Nursery in room 104, family room 105" (spec ruling), `anchor` on no row.
  3. `sundayTimesSection` with `anchor: 'accessibility'`, heading `Getting in`, items 10:45 / Find us / Parking (parking sentence from `accessibility.txt`), the THREE doors verbatim from `accessibility.txt` including the automatic door-opener sentence, `showMap: true`.
  4. `imageTextSection` `anchor: 'building'`... no: spec says `#building` lands on the heritage band, so put `anchor: 'building'` on the heritage band (item 6) and leave this image-text unanchored: eyebrow `Children`, heading `Where the children go`, body the children-by-room paragraphs from `what-to-expect.txt` / `children.txt` (rooms 104 and 105 as ruled), cta `Children's ministry` → `/ministries#children`.
  5. `faqSection` heading `Questions people ask`, the SEVEN "What To Expect" entries from `scripts/data/pages/faq-entries.json` in their `sortOrder`, answers verbatim with links carried as `link()` marks.
  6. `heritageBandSection` `anchor: 'building'`, hero-tower or the survey's architecture photo, heading `The building`, body ONE paragraph from `architecture.txt` (verbatim, first paragraph), cta `Its history` → `/history#building`.
  7. `ctaBandSection`: headline `We'd love to meet you`, cta `Fill in a visitor card` → visitorFormUrl, secondary `Watch live` → livestreamUrl.
  SEO title `Plan a visit | First Baptist Church Muncie`. `newCopy`: hero subhead only. `photoConsent: ['visit-children']`.

- [ ] **Step 2 to 4:** seed dry then apply; build; screenshots `page-visit-*`; verify `/visit#accessibility` and `/visit#building` scroll to the right bands in the browser (screenshot each landing as `page-visit-anchor-{accessibility,building}.png`); gates; commit `Visit: one scroll from the door to the pew`.

---

### Task 7: Who We Are `/who-we-are`

- [ ] **Compose** spec 5.3 from `who-we-are.txt` (content map line 23 onward): split hero (whoweare-congregation) with THEIR sentence as headline; `scriptureBandSection` Isaiah 12:4 in full, `accentWord: 'proclaim'`; `richTextSection` `Praise and proclaim` (~200 words edited from their watchword paragraphs, edits are cuts not additions); `richTextSection` with `columns`-style four pillars is not available, so compose FOUR `richTextSection`s? No: use ONE `richTextSection` whose body is four `h3` headings (Worship, The Way, Witness, Work) each followed by ~60 words verbatim-cut; `staffGridSection` `group: 'pastors'`, `showBios: true`, heading `Our pastors`, followed by a `richTextSection` `From our pastors` (their letter cut to ~180 words, ending with a `link('the full letter', '/staff')`); `richTextSection` `Our pledge` (the four commitments, plain); `richTextSection` three-up as on Home (Beliefs · Ministries · Visit; new sentences declared); `ctaBandSection` visitor card. Fix the three jargon terms per spec (one clause each, declared as edits, not new copy). SEO `Who we are | First Baptist Church Muncie`.
- [ ] Seed, build, screenshots `page-who-we-are-*`, gates, commit `Who We Are: their sentence first, the theology in the order they wrote it`.

---

### Task 8: Beliefs `/beliefs`

- [ ] **Compose** spec 5.4 from `beliefs.txt`, `baptists.txt`, `membership.txt`: split hero (beliefs-glass) `One Lord, one faith, one baptism.`; `richTextSection` `Our basic beliefs` (verbatim ~550w); `richTextSection` `anchor: 'baptists'` `Being Baptist` (four values consolidated, Helwys kept, ONE baptism statement as the spec words it); `scriptureBandSection` verse `In essentials, unity; in non-essentials, liberty; in all things, charity.` with `reference` blank and `accentWord: 'charity'`; `richTextSection` `Historic confessions` (one paragraph each) then `documentListSection` with the three PDFs uploaded through `makeUploader.uploadFile` from `../fbcm-archive/files/<name>` (confession `08181c_be64a9c7…pdf`, constitution and bylaws `08181c_7f1349cc…pdf`, manifesto `b98776_b6017910…pdf`), each `title`, `note`, and `year` where the document states one; `richTextSection` `Our church covenant` (full, once); `richTextSection` `anchor: 'membership'` `Membership` (full and associate, gendered phrasing edited); `logoStripSection` `Affiliation` with `logo-abcusa` and `logo-abc-indiana-kentucky` (alts required) and the two links in the headline copy or a following richText line; `ctaBandSection` `Questions?` → `/contact`. SEO title `What we believe | First Baptist Church Muncie, an American Baptist church`, description one plain sentence answering "what does First Baptist Muncie believe" (new, declared).
- [ ] Seed, build, screenshots `page-beliefs-*`, anchor landings `page-beliefs-anchor-{baptists,membership}.png`, gates, commit `Beliefs: stated once, in their words, with the documents`.

---

### Task 9: Ministries `/ministries`

- [ ] **Compose** spec 5.5 from the five files: split hero (ministries-worship-team) `Every age has a place here.`; `timelineSection` `A Sunday for every age` rows 9:30 / 10:15 / 10:45 across ages; five `imageTextSection`s with `anchor` `worship`, `children`, `youth`, `adult`, `outreach`, alternating `imageSide`, each body verbatim-cut with the section's contacts named as the church wrote them; after the children band a `faqSection` with the FIVE "Children FAQ" entries verbatim; after the adult band the five Life Groups as a `bullets()` list; `richTextSection` `Get involved` whose body is DERIVED: for each coordinator in `ctx.staff` with group `coordination`, one line `Name, Role, email` built at seed time (so it is not retyped; a comment in the module says the page must be re-seeded when staff change, or better: the module emits a `staffGridSection` `group: 'coordination'`, `showBios: false` which is live-derived; prefer the staffGrid), plus the three newsletters and the app as `link()`s to `churchTracUrl`; `ctaBandSection`. Fixes per spec (Get Involved once; CCT spelled out once; building-use link → `/wedding#building-use`; seasonal events under "Through the year" with no dates; 7:17 pm kept and flagged in `newCopy`? No: flagged in the approval note's facts block, which already lists it). SEO title `Ministries | First Baptist Church Muncie`.
- [ ] Seed, build, screenshots `page-ministries-*`, five anchor landings, gates, commit `Ministries: five anchors, one Sunday schedule, coordinators derived`.

---

### Task 10: Staff `/staff`

- [ ] **Compose** spec 5.6: split hero (staff-deacons-2026 or the co-pastors portrait per survey) `The people who serve here.`; `staffGridSection` `group: 'pastors'`, `showBios: true`, heading `Pastors`; `staffGridSection` `group: 'coordination'`, `showBios: true`, heading `Church Coordination Team`; `staffGridSection` `group: 'support'`, `showBios: false`, heading `Support and volunteer roles`; `richTextSection` `Deacons` with the group photo as an `imageTextSection` instead (photo left), body the five names, the three-year term and their sentence verbatim from `ministers.txt`; `scriptureBandSection` `Every Christian is called to minister to others in some way.` (their line; `reference` blank); `ctaBandSection` `Can't find who you need?` → `/contact`. Confirm in `StaffGrid.astro` that each card's wrapper has `id={member.slug}` so `/staff#kendall-ellis` lands; if not, add it (one line) in this task. The moderator mailto and deacon chair email come from the staff documents Task 3 fixed.
- [ ] Seed, build, screenshots `page-staff-*`, landings for the five bio anchors, gates, commit `Staff: three groups from one source, the deacons in their words`.

---

### Task 11: History `/history`

- [ ] **Compose** spec 5.7 from `history.txt` (4,171 words; keep nearly all): `heritageBandSection` (hero-tower) heading `Since 1859.` body the founding sentence; `timelineSection` `Seven eras` with seven rows (marker = years, title = era name, body = one-sentence lead, `anchor` on row four `building`); then, per era, a `richTextSection` heading `<era name>` with the era's paragraphs verbatim (edits only as spec: duplicated charter-members sentence removed, 1880 → 1890) and an `imageTextSection` or the era photograph inside a `gallerySection` of one image with caption (choose `imageTextSection` with the era's first paragraph as body and the rest in the following richText); `quoteSection` between eras 2 and 3 (`Never again would the members discuss disbanding.`) and between eras 5 and 6 (`Never giving up, the members found a way to buy it back.`); `documentListSection` `Read more` with `Journey Down Jefferson Street` (note: library copies; no file) and `We Are the Clay` (`url` Amazon from the capture); `ctaBandSection` → `/who-we-are`, secondary `/wedding`. Anchor `building` must land on the 1921-1929 era band: put `anchor: 'building'` on THAT richText (the timeline row anchor is separate; check both do not collide: name the row anchor `building-1929`). SEO title `History of First Baptist Church Muncie, 1859 to today`.
- [ ] Seed, build, screenshots `page-history-*` (this page is long; the full-page PNG may exceed 20k px; if so capture in two halves `-top`/`-bottom`), landing `page-history-anchor-building.png`, gates, commit `History: seven eras, the church's own telling`.

---

### Task 12: Weddings & Building Use `/wedding`

- [ ] **Compose** spec 5.8: split hero (wedding-sanctuary) `Married here.`; `richTextSection` `Why here` from `wedding.txt` with Ella Mae Lemen's contact as a `link()` to her `mailto:` from her staff document (derived at seed time from `ctx.staff`); `gallerySection` `Our spaces` with the six manifest keys and captions (new copy, declared); `quoteSection` Hanna and Nathan's testimonial in full (attribution as written); `richTextSection` `Reserving your wedding` with the steps as `bullets()` (new copy as a list, declared) then `documentListSection` with Wedding Contract (`81f7ac_5d587512…pdf`), Bridal Packet (`81f7ac_e490a9f4…pdf`) and the informational form (`url` to Church Center form `243785` as the capture's wedding page links it; verify in `wedding.json`), note "The documents carry the fees."; `richTextSection` `anchor: 'building-use'` `Building use for other events` one paragraph from `reservation.txt`, then `documentListSection` with the Reservation Agreement PDF (`08181c_1fa464b2…pdf`) and the online request form `url` (form `520312`, as `reservation.json` links it); `ctaBandSection` → `/contact`. "Christian wedding" kept as written.
- [ ] Seed, build, screenshots `page-wedding-*`, landing `page-wedding-anchor-building-use.png`, gates, commit `Weddings and building use: the documents carry the fees`.

---

### Task 13: Give `/give` and the Give band's home

- [ ] **Compose** spec 5.9: `giveBandSection` first (heading `Support the work of this church.`, body one sentence, button default); `richTextSection` `Ways to give` three short paragraphs (NEW, every sentence declared): online through Church Center (`link` to givingUrl), in person on Sunday, by post to the address from settings; `richTextSection` `Where it goes` with ONLY the church's two sentences from the capture (grep `who-we-are.txt`/`outreach.txt` for "sacrificially" and the special-offerings line); `ctaBandSection` `Questions?` → `/contact`. Add `give` to `siteSettings.footerColumns` Pages column via `seed-core.mjs --only siteSettings` (extend the seed, backup first, same drift check as plan 2a). SEO title `Give | First Baptist Church Muncie`.
- [ ] Seed, build, screenshots `page-give-*`, gates, commit `Give: short, honest, in their words where they have them`.

---

### Task 14: Contact `/contact` becomes a page; the form machinery retires

**Files:**
- Create: `scripts/pages/contact.mjs`, `scripts/retire-contact-page.mjs`
- Delete: `src/pages/contact.astro`, `src/components/ContactForm.tsx`, `src/components/CalendlyInline.tsx`, `src/components/ServiceAreaMap.astro`, `src/sanity/schemaTypes/contactPage.ts`
- Modify: `src/sanity/schemaTypes/index.ts`, `src/sanity/structure.ts` (Contact pane now points at the `page` doc), `src/lib/reservedSlugs.ts` (remove `contact`), `src/pages/[slug].astro` (remove `contact` from the hand-kept set), `src/lib/queries.ts` (`getContactPage` removed), `scripts/seed-core.mjs` (contactPage seed removed), `tests/routes.ts` (`FORM_ROUTES` empty), `src/sanity/resolve.ts` + `src/pages/preview/[...slug].astro` + `src/layouts/PreviewLayout.astro` (the THREE preview maps lose `contactPage`), `public/llms.txt`, `CLAUDE.md` routes table, any Web3Forms env read (`PUBLIC_WEB3FORMS_KEY` or similar) and `.env.example`

- [ ] **Step 1: Retire the singleton first.** `scripts/retire-contact-page.mjs`: fetch `contactPage`; if absent print "absent" and exit 0; else back up to `scripts/data/backups/contactPage-2026-09-19-plan2b.json` and, with `--write`, delete it. Run dry, then `--write`.
- [ ] **Step 2: Remove the route and its machinery** as listed, run `npm run scaffold` (no args) to be sure nothing marks `contact` as a capability; grep `src/ scripts/ tests/ docs/` for `contactPage|ContactForm|CalendlyInline|ServiceAreaMap|web3forms` (case-insensitive) and clear every hit outside `archive/`. `npm run typegen && npm run check`: 0 errors.
- [ ] **Step 3: Compose** spec 5.11 as a `page` with slug `contact`: split hero (contact-building) `Get in touch.` with facts phone · email · address (from settings), primary `Fill in a visitor card` → visitorFormUrl, secondary `Call the office` → `tel:` from settings phone; `richTextSection` `Office and pastors' hours` whose body is BUILT FROM `ctx.settings.officeHours` and `pastoralHours` (the portable text arrays copied in at seed time, with a module comment that the page re-seeds when hours change; if `SundayTimes` or a small new `hoursSection` would render them live instead, prefer live: add `hoursSection` ONLY if it is under 60 lines including schema registration at all nine points, else seed-copy); `richTextSection` `Share a life update` with the list as written from `contact.txt` and the new follow-up sentence (declared) linking `lifeEventFormUrl`; `imageTextSection` `Meet with a pastor` with the co-pastors portrait and the two Tuesday scheduling links from `contact.txt`; `sundayTimesSection` with map; no closing CTA (the hero carries it).
- [ ] **Step 4:** seed, build, screenshots `page-contact-*`, `npm run check:links` now green across all routes; `npm test` green with `FORM_ROUTES` empty; commit `Contact: a page like the others, the form machinery retired`.

---

### Task 15: Blog index and posts: durable first, categories that resolve, pages and tags

**Files:**
- Create: `src/lib/blog-derive.ts`, `src/lib/blog-derive.test.ts`, `src/pages/blog/page/[page].astro`, `src/pages/blog/category/[slug].astro`, `src/pages/blog/tag/[tag].astro`, `scripts/pages/blog.mjs` (the `journalPage` singleton's hero and `#publications` document list)
- Modify: `src/pages/blog/index.astro`, `src/pages/post/[slug].astro`, `src/components/JournalCard.astro`, `src/components/sections/DynamicList.astro` (durable-first ordering), `src/lib/queries.ts`, `src/lib/reservedSlugs.ts` (nothing new: `blog` already reserved), `tests/routes.ts` (add `/blog/page/2`, `/blog/category/sermon-preview`, one tag route), `src/lib/fbcm-redirects.ts` unchanged

**Interfaces:**
- Produces in `blog-derive.ts`: `isSermonPreview(entry)` re-exported from `import-post.ts` logic (one implementation; import it, do not copy); `splitDurable(entries) -> { durable: Entry[], previews: Entry[] }` preserving newest-first; `paginate<T>(items: T[], size: number, page: number) -> { items: T[], page, pages }`; `seriesByTag(entry, all, limit=3)` entries sharing the most tags with `entry`, excluding itself; `weekOfEyebrow(publishedAt) -> 'Sermon preview, week of <Month D, YYYY>'` using `weekOfLabel` from `church-derive.ts`.

- [ ] **Step 1: Failing tests** for the four functions (write real fixtures: six entries, two categories, overlapping tags; assert durable-first order, page counts for 142/12 = 12 pages, series picks the two-shared-tag entry before the one-shared-tag entry, eyebrow text for a Wednesday date).
- [ ] **Step 2: Implement** to green.
- [ ] **Step 3: Index.** `blog/index.astro`: hero from the `journalPage` singleton (split, `Writing from First Baptist.`); `Featured`: the newest six durable as `JournalCard`s (cover, category, date); `This week`: the newest sermon preview as one wide card with the `weekOfEyebrow`; `All posts`: page 1 of the paginated grid (12) with a pager to `/blog/page/2`; category chips link to `/blog/category/<slug>/` and mark the active one; tag cloud omitted from the index (217 tags) and shown on post pages; `#publications` `documentListSection` rendered from the singleton's `pageBuilder` (seeded by `scripts/pages/blog.mjs` with The Visitor issues found in `scripts/data/pages/publications.json` file links and the two books).
  - **`?category=` must resolve** without SSR: add a 10-line inline script at the top of the index that reads `location.search`, and if `category=<slug>` is present, `location.replace('/blog/category/' + encodeURIComponent(slug) + '/')`. Map the legacy `fbcm-events-1` to `fbcm-events` and `pianist` to the tag route `/blog/tag/pianist/` in that script (a const map with a comment naming plan 1's redirect list).
- [ ] **Step 4: Routes.** `blog/page/[page].astro` builds pages 2..N; `blog/category/[slug].astro` builds one per `journalCategory` with its own pagination if over 12 (sermon-preview has 106: paginate as `/blog/category/sermon-preview/page/2` via a nested `[...]` or a second route `blog/category/[slug]/page/[page].astro`); `blog/tag/[tag].astro` builds one per tag (217) with the tag's posts, newest first, no pagination.
- [ ] **Step 5: Post page.** Eyebrow: category, or `weekOfEyebrow` for sermon previews; tags as chips linking to tag routes; `More from this series` via `seriesByTag`; previous/next stay. `JournalCard` gets a `preview` prop that renders the sermon-preview eyebrow style.
- [ ] **Step 6: Dynamic list on Home** orders durable first via `splitDurable` (three durable posts).
- [ ] **Step 7:** `tests/routes.ts` additions; `npm run build` (expect ~230 new static pages); `npm test`; screenshots `page-blog-{light,dark}-{375,1280}.png`, `page-post-*.png` for one durable post and one sermon preview; `check:links` green; commit `Blog: durable first, categories that resolve, pages and tags, sermon previews by week`.

---

### Task 16 (GATED on Nathan's approval of `@portabletext/block-tools`): Post bodies with headings, links, lists and images

**The controller asks Nathan before dispatching this task.** If he declines or does not answer, the task is skipped, PENDING.md keeps its line, and the plan is complete without it.

**Files:** Create `src/lib/convert-body.ts`, `src/lib/convert-body.test.ts`, `scripts/reimport-post-bodies.mjs`. Modify `package.json` (one dependency), `src/lib/import-post.ts` (use the converter when `bodyHtml` exists).

- [ ] **Step 1:** `npm install @portabletext/block-tools@<latest 1.x>` after approval; record the exact version in the commit message.
- [ ] **Step 2: Failing test:** given a captured `bodyHtml` fixture with `<h2>`, `<a>`, `<ul>`, `<blockquote>` and `<img>`, `convertBody(html, uploader)` returns blocks with `style: 'h2'`, a `link` markDef, `listItem: 'bullet'`, `style: 'blockquote'`, and an `image` block whose asset came from the uploader (mock returning a fixed `_ref`).
- [ ] **Step 3: Implement** with `htmlToBlocks` from block-tools and the repo's `proseBody()` schema (`src/sanity/schemaTypes/_proseBody.ts` or wherever `proseBody` lives; read it) so the output validates against the journal body type; images go through `makeUploader` keyed by the archive path from `images-manifest.json`.
- [ ] **Step 4: Re-import**, idempotent: `scripts/reimport-post-bodies.mjs` dry prints per post `paragraphs -> blocks (h2: n, links: n, lists: n, images: n)`; `--apply` patches ONLY `body` on each `journalEntry` after backing all 142 bodies up to `scripts/data/backups/journalEntry-bodies-2026-09-19.json` (one file, keyed by `_id`).
- [ ] **Step 5:** build, open three posts (one with images), screenshots `page-post-rich-*.png`; the plan-1 pinned test (find it by the PENDING.md line) flips to green; commit `Post bodies: headings, links, lists and images return`.

---

### Task 17: Privacy and 404

- [ ] **Privacy:** `scripts/pages/privacy.mjs` seeds `privacyPage.body` re-stated for a church that collects nothing itself (no forms on the site; Cloudflare Web Analytics cookieless if `PUBLIC_CF_ANALYTICS_TOKEN` is set, else no analytics; links out to Church Center, Church Trac and YouTube have their own policies), keeping the singleton's existing fields; title `Privacy | First Baptist Church Muncie`.
- [ ] **404:** `scripts/pages/not-found.mjs` seeds `notFoundPage.heroImage` with `notfound-tower` and the three links Visit, Blog, Contact; `src/pages/404.astro` drops the hardcoded starter asset ref (rule 11) and renders the singleton's image or nothing.
- [ ] Seed, build, screenshots `page-privacy-*`, `page-404-*`; commit `Privacy and 404: the church's own`.

---

### Task 18: Close plan 2b

- [ ] `npm run seed-pages -- --list` (add the npm script) shows all twelve modules; a second full `--apply` run prints no changes (idempotence proof; paste).
- [ ] The approval note is regenerated and committed; `docs/PENDING.md`: remove the seven-routes and `check:links` lines, add "Plan 2b landed" with: parity still red until 2c; Task 16 status; the `#nathan` facts list (spec 9) pointing at the vault; `CLAUDE.md` opening paragraph and routes table updated (contact is a page; blog routes); `public/llms.txt` lists the eleven pages.
- [ ] Full gate: `npm run typegen && npm run check && npm run test:unit && npm run format:check && npm run build && npm test && npm run audit:studio && npm run check:links && node scripts/verify-archive.mjs --quick`. All green (`check:links` included). `npm run parity compare`: red, expected, recorded.
- [ ] Commit `Plan 2b: the eleven pages, seeded and screenshotted`. No push; the controller runs the final whole-branch review, then finishing-a-development-branch.

---

## Definition of done for plan 2b

- [ ] Eleven routes serve 200 with composed content: `/`, `/visit`, `/who-we-are`, `/beliefs`, `/ministries`, `/staff`, `/history`, `/wedding`, `/give`, `/blog` (+ pages, categories, tags), `/contact`; plus `/privacy` and `/404` re-stated.
- [ ] Every anchor plan 1's redirects point at exists and lands: `visit#accessibility`, `visit#building`, `beliefs#baptists`, `beliefs#membership`, `staff#<five slugs>`, `ministries#<five>`, `blog#publications`; `/blog?category=<six>` resolves.
- [ ] Every page composed by an idempotent module; a second `--apply` changes nothing; every touched document has a committed backup.
- [ ] `docs/superpowers/notes/2026-09-19-copy-for-church-approval.md` lists every new sentence and every photo of identifiable children.
- [ ] 48+ screenshots (both themes, both viewports, per page) committed as the review set.
- [ ] One button family site-wide; anchors stable; CI test job green on main.
- [ ] Task 16 done or explicitly skipped by Nathan's answer.

Plan 2c (verification and cutover readiness) follows: Lighthouse 100s measured, parity recaptured once, 43 redirect targets 200 on the deployed site, axe both themes, favicon, the `/preview` secret, Web Analytics token, and the review walkthrough for Nathan.
