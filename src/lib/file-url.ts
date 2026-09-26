// Safe to edit by hand
// Sanity FILE addresses (the PDFs: The Visitor's issues, the wedding and
// building-use documents) rewritten to this site's own /files/<name>
// (2026-09-26).
//
// WHY. Every PDF was linked straight to cdn.sanity.io, and every download,
// by a person or a crawler, came out of the project's monthly Sanity
// bandwidth. The Visitor alone is 39 issues and about 600 MB, ten of them over
// 25 MB; the day /visitor went up bandwidth jumped to ~18 GB, the next day
// ~38 GB, against a 100 GB month. /files/<name> (src/pages/files/[name].ts)
// serves the same file from R2 when the FILES bucket is bound, else through
// Cloudflare's cache, so Sanity sends each file about once.
//
// Images (cdn.sanity.io/images/...) are NOT touched: they go through Sanity's
// image pipeline (sizes, formats) and are small.
//
// PURE: no Astro, no env; the project and dataset are passed in.

/**
 * A Sanity file's stored name (its sha1 and extension) of a DOCUMENT type.
 * Only these are rewritten and served: /files/ answers from this site's own
 * origin, so an HTML or SVG file in the media library would run as script on
 * the church's domain (security review, 2026-09-26). The route also forces the
 * type and sandboxes every response; this list is the first gate.
 */
export const FILE_NAME = /^[a-f0-9]{40}\.(pdf|docx?|xlsx?|pptx?)$/;

/** The only Content-Type /files/ sends for each allowed extension. */
export const FILE_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** The Content-Type for an allowed file name. */
export const fileType = (name: string): string =>
  FILE_TYPES[name.slice(name.lastIndexOf('.') + 1)] ?? 'application/octet-stream';

/**
 * This site's address for a Sanity file URL of THIS project and dataset, or
 * the input unchanged when it is anything else. A `?dl=` (Sanity's
 * download-with-this-name) is kept.
 */
export function siteFileUrl(url: string, projectId: string, dataset: string): string {
  if (typeof url !== 'string' || !projectId || !dataset) return url;
  const m = /^https:\/\/cdn\.sanity\.io\/files\/([^/]+)\/([^/]+)\/([^/?#]+)(\?[^#]*)?$/.exec(url);
  if (!m || m[1] !== projectId || m[2] !== dataset || !FILE_NAME.test(m[3])) return url;
  const dl = m[4] ? new URLSearchParams(m[4]).get('dl') : null;
  return `/files/${m[3]}${dl !== null ? `?dl=${encodeURIComponent(dl)}` : ''}`;
}

/** Whether a value anywhere holds a Sanity file URL (a cheap pre-check). */
export const hasFileUrl = (value: unknown): boolean =>
  JSON.stringify(value ?? null).includes('cdn.sanity.io/files/');

/** `value` with every string that is a Sanity file URL rewritten by siteFileUrl. */
export function rewriteFileUrls<T>(value: T, projectId: string, dataset: string): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return siteFileUrl(v, projectId, dataset);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[k] = walk(x);
      return out;
    }
    return v;
  };
  return walk(value) as T;
}

/** The Sanity CDN address /files/<name> serves, or null for a name that is not a file's. */
export function upstreamFileUrl(name: string, projectId: string, dataset: string): string | null {
  if (!FILE_NAME.test(name) || !projectId || !dataset) return null;
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${name}`;
}

/** A safe download name for Content-Disposition from `?dl=`, or '' for none. */
export function downloadName(dl: string | null): string {
  if (dl === null) return '';
  return dl.replace(/[^\w .()-]/g, '_').slice(0, 120);
}
