// src/lib/document-doors.ts
// Safe to edit by hand
// scaffold-file: church
// The document list's form and each document's button, derived from the
// documents themselves (CLAUDE.md rule 15). 2026-09-24, the Wedding identity
// pass.
//
// DOORS OR REGISTER. A short list (one to four documents: the wedding page's
// contract, packet and form; Beliefs' three confessions; History's two books)
// is drawn as a row of door cards on the indigo band, each document its own
// cream door. A longer list (the blog's forty-odd issues of The Visitor) is a
// register on the same band: year by year, the titles in a run. Four is where
// a row of doors stops fitting across a desktop band. The count is of the
// documents that can render (a document with no title is dropped first by
// the component), so the form follows what a visitor sees.
//
// THE BUTTON. A file is downloaded; a link is opened. The label says which,
// and where: "Download PDF" (the extension read off the file's own URL),
// "Open on churchcenter.com" (the link's own host, less "www." and less a
// church subdomain). A document with neither has no button: the card is not
// a link (History's "Journey Down Jefferson Street", which is on a shelf in
// the church library, not online).
import { splitStega } from './preview-stega.ts';

/** The most documents drawn as doors; one more and the list is a register. */
export const DOOR_LIMIT = 4;

export type DocumentForm = 'doors' | 'register';

export function documentForm(count: number): DocumentForm {
  return count > 0 && count <= DOOR_LIMIT ? 'doors' : 'register';
}

export interface DocLinks {
  fileUrl?: string | null;
  url?: string | null;
}

export interface DocAction {
  href: string;
  kind: 'file' | 'link';
  label: string;
}

/** "PDF" from ".../abc.pdf?dl=" ; null when the path has no short extension. */
export function fileExtension(fileUrl: string): string | null {
  const path = fileUrl.split(/[?#]/)[0];
  const match = path.match(/\.([a-z0-9]{2,4})$/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * The registrable part of a link's host: "fbcmuncie.churchcenter.com" gives
 * "churchcenter.com", "www.amazon.com" gives "amazon.com". A two-letter
 * country ending under a short second label ("bbc.co.uk") keeps three labels.
 * Null for a relative or unparseable link.
 */
export function linkHost(url: string): string | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;
  const labels = host.replace(/^www\./, '').split('.');
  if (labels.length <= 2) return labels.join('.');
  const last = labels[labels.length - 1];
  const second = labels[labels.length - 2];
  const keep = last.length === 2 && second.length <= 3 ? 3 : 2;
  return labels.slice(-keep).join('.');
}

/** The button a document gets, or null when it points nowhere. */
export function docAction(doc: DocLinks): DocAction | null {
  const fileUrl = splitStega(doc.fileUrl ?? '').cleaned.trim();
  if (fileUrl) {
    const ext = fileExtension(fileUrl);
    return { href: fileUrl, kind: 'file', label: ext ? `Download ${ext}` : 'Download' };
  }
  const url = splitStega(doc.url ?? '').cleaned.trim();
  if (url) {
    const host = linkHost(url);
    return { href: url, kind: 'link', label: host ? `Open on ${host}` : 'Open' };
  }
  return null;
}
