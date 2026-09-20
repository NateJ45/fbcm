// src/lib/import-post-rich.ts
// Foundation, edit with care
//
// The rich half of the post import: the capture's `bodyHtml` as real Portable
// Text, through src/lib/convert-body.ts.
//
// WHY THIS IS A SEPARATE FILE FROM import-post.ts, and why it must stay one.
// import-post.ts is in the SITE's build graph: src/lib/blog-derive.ts imports
// isSermonPreview() from it, and blog-derive runs inside getStaticPaths. This
// module reaches the Studio's journalEntry schema (convert-body derives the
// block-tools schema from it), which reaches the `sanity` package, which the
// Cloudflare prerender worker cannot evaluate at module scope:
//
//   Failed to get static paths from the Cloudflare prerender server (500)
//   Error: Disallowed operation called within global scope. Asynchronous I/O
//   (ex: fetch() or connect()), setting a timeout, and generating random
//   values are not allowed within global scope.
//
// That is a real build failure, seen on 2026-09-20 the first time the rich
// path was wired into import-post.ts directly. Nothing the site renders may
// import this file; only scripts and unit tests may.

import { convertBody, type ConvertedBlock, type ConvertReport } from './convert-body.ts';
import { bodyFromCapture, decodeEntities, type CapturedPost } from './import-post.ts';

/** What bodyFromCaptureRich needs from its caller. A script supplies all three. */
export interface RichBodyOptions {
  /** A DOM parser. In Node: `(html) => new JSDOM(html).window.document`. */
  parseHtml: (html: string) => Document;
  /** Fallback lookup for a src the capture's own image list does not carry. */
  resolveImage?: (src: string) => string | undefined;
  /** Uploads an archive-relative path, returns the Sanity asset `_ref`. */
  uploadImage?: (relPath: string) => Promise<string>;
}

/**
 * The capture's `bodyHtml` as real Portable Text. Falls back to the
 * paragraph-only mapper when the capture carries no HTML, so every post gets a
 * body whatever the capture holds. `report` is null on that fallback, because
 * nothing was converted.
 */
export async function bodyFromCaptureRich(
  captured: CapturedPost,
  options: RichBodyOptions,
): Promise<{ blocks: ConvertedBlock[]; report: ConvertReport | null }> {
  const html = (captured.bodyHtml ?? '').trim();
  if (!html) return { blocks: bodyFromCapture(captured), report: null };

  // The capture carries its OWN image list, and its `originalUrl` is the exact
  // string the body's `<img src>` holds -- so the src maps to an archive file
  // without going near the site-wide manifest's rendered/full-res variants.
  const byUrl = new Map<string, string>();
  for (const image of captured.images ?? []) {
    for (const url of [image.originalUrl, image.fullResUrl]) {
      if (url && image.localFile) byUrl.set(url, image.localFile);
    }
  }

  return convertBody(html, {
    slug: captured.slug,
    parseHtml: options.parseHtml,
    resolveImage: (src) => byUrl.get(src) ?? options.resolveImage?.(src),
    uploadImage: options.uploadImage,
    fallbackAlt: decodeEntities(captured.title ?? '').trim() || undefined,
  });
}
