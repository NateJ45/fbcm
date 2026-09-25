// src/lib/visitor-issues.ts
// Safe to edit by hand
// scaffold-file: church
// The Visitor, the church newsletter, as issues (2026-09-24, feat/the-visitor).
// Pure, so every rule is unit-tested (visitor-issues.test.ts) and shared by the
// page, the home band, the build step that draws the covers and the search.
//
// AN ISSUE IS A LISTED DOCUMENT OF A CERTAIN SHAPE, never a flag (CLAUDE.md
// rule 15): its title is a month's name, it has a year, and it carries an
// uploaded file. A document list made only of issues is The Visitor's list,
// and DocumentList draws it as the newsletter's page (isIssueList). The
// LATEST issue is simply the newest one; nothing stores which it is, so adding
// an issue in the Studio (month, year, PDF) makes it the latest.
//
// Every string an editor typed is read through splitStega first: in the
// preview each carries an invisible payload that would make "June" !== "June"
// (CLAUDE.md, the preview rules).
//
// COVERS are drawn from page 1 of each PDF at build time by
// scripts/visitor-covers.mjs and served from /visitor/covers/, keyed by the
// file's asset id (the hash in its Sanity CDN address), so the same file is
// drawn once however many lists hold it. The build step's manifest says which
// covers exist; an issue without one gets a typeset cover (IssueCover.astro).
import { splitStega } from './preview-stega.ts';

/** The newsletter's name, as the church prints it on every cover. */
export const NEWSLETTER = 'The Visitor';

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** The widths each cover is drawn at, in CSS pixels of the source image. */
export const COVER_WIDTHS = [240, 480, 720, 960] as const;

/** Where a cover is served from. */
export const COVER_DIR = '/visitor/covers';

/** A listed document as DocumentList and the queries hand it over. */
export interface IssueDoc {
  _key?: string | null;
  title?: string | null;
  year?: number | null;
  fileUrl?: string | null;
  /** The file's size in bytes (`file.asset->size`), when projected. */
  fileSize?: number | null;
  note?: string | null;
}

export interface Issue {
  /** The file's asset id (the CDN hash), or null for a file with none. */
  key: string | null;
  /** 0 to 11. */
  month: number;
  year: number;
  /** "September 2026" */
  label: string;
  /** "The Visitor, September 2026" */
  title: string;
  /** "issue-2026-09", the issue's anchor on /visitor. */
  anchor: string;
  /** The PDF, opened in the browser (never forced to download). */
  href: string;
  size: number | null;
  note: string;
}

export interface CoverInfo {
  /** The page's own proportions, in PDF points. */
  w: number;
  h: number;
  widths: number[];
}

export interface VisitorManifest {
  /** Where the site's list of issues was read from: the /visitor page, the
   * committed fixture (the test build), or nowhere yet. */
  source: 'visitor' | 'fixture' | null;
  /** Where a link to "all issues" goes: /visitor, or the fixture's page. */
  listHref: string | null;
  /** The newest issue of that list, for the home band. */
  latest: Issue | null;
  /** Every cover drawn, by asset id. */
  covers: Record<string, CoverInfo>;
}

const clean = (s: string | null | undefined): string => splitStega(String(s ?? '')).cleaned.trim();

/** The month (0 to 11) a title names, or -1. Case and spacing do not matter. */
export function monthOf(title: string | null | undefined): number {
  const t = clean(title).toLowerCase();
  return MONTHS.findIndex((m) => m.toLowerCase() === t);
}

/**
 * The asset id in a Sanity CDN file address:
 * https://cdn.sanity.io/files/<project>/<dataset>/<hash>.pdf gives <hash>.
 * Null for any other address (it has no stable id to key a cover by).
 */
export function assetKey(fileUrl: string | null | undefined): string | null {
  const url = clean(fileUrl);
  const m = url.match(
    /^https:\/\/cdn\.sanity\.io\/files\/[^/]+\/[^/]+\/([0-9a-f]{16,64})\.[a-z0-9]+(?:[?#].*)?$/i,
  );
  return m ? m[1].toLowerCase() : null;
}

/** A listed document as an issue, or null when it is not one. */
export function asIssue(doc: IssueDoc | null | undefined): Issue | null {
  if (!doc) return null;
  const month = monthOf(doc.title);
  const year = typeof doc.year === 'number' && Number.isInteger(doc.year) ? doc.year : null;
  const href = clean(doc.fileUrl);
  if (month < 0 || year === null || !href) return null;
  const label = `${MONTHS[month]} ${year}`;
  return {
    key: assetKey(href),
    month,
    year,
    label,
    title: `${NEWSLETTER}, ${label}`,
    anchor: `issue-${year}-${String(month + 1).padStart(2, '0')}`,
    href,
    size: typeof doc.fileSize === 'number' && doc.fileSize > 0 ? doc.fileSize : null,
    note: clean(doc.note),
  };
}

/** Newest first: by year, then by month. */
export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => b.year - a.year || b.month - a.month);
}

/** The issues in a list of documents, newest first. Non-issues are left out. */
export function issuesOf(docs: readonly (IssueDoc | null | undefined)[]): Issue[] {
  return sortIssues(docs.map(asIssue).filter((i): i is Issue => i !== null));
}

/**
 * A list is The Visitor's list when it holds at least one document and every
 * document in it is an issue. The mixed list /blog used to carry (issues and
 * two books) is not, and keeps its register form.
 */
export function isIssueList(docs: readonly (IssueDoc | null | undefined)[]): boolean {
  const present = docs.filter((d): d is IssueDoc => !!d && !!clean(d.title));
  return present.length > 0 && present.every((d) => asIssue(d) !== null);
}

/** The newest issue, or null. */
export function latestIssue(issues: Issue[]): Issue | null {
  return sortIssues(issues)[0] ?? null;
}

/** The issues grouped by year, newest year first, each year newest first. */
export function yearGroups(issues: Issue[]): { year: number; issues: Issue[] }[] {
  const groups: { year: number; issues: Issue[] }[] = [];
  for (const issue of sortIssues(issues)) {
    const last = groups[groups.length - 1];
    if (last && last.year === issue.year) last.issues.push(issue);
    else groups.push({ year: issue.year, issues: [issue] });
  }
  return groups;
}

/** "29 MB", "540 KB"; '' when the size is not known. */
export function fileSizeLabel(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !(bytes > 0)) return '';
  if (bytes >= 1_000_000) return `${Math.round(bytes / 1_000_000)} MB`;
  return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

/** "PDF, 29 MB", or "PDF" when the size is not known. */
export function fileLine(issue: Pick<Issue, 'size'>): string {
  const size = fileSizeLabel(issue.size);
  return size ? `PDF, ${size}` : 'PDF';
}

/** The cover's text alternative: "The Visitor, June 2026, cover". */
export function coverAlt(issue: Pick<Issue, 'title'>): string {
  return `${issue.title}, cover`;
}

/** A cover's address at one width. */
export function coverSrc(key: string, width: number): string {
  return `${COVER_DIR}/${key}-${width}.webp`;
}

/** The srcset for a drawn cover. */
export function coverSrcset(key: string, cover: CoverInfo): string {
  return cover.widths.map((w) => `${coverSrc(key, w)} ${w}w`).join(', ');
}

/** The drawn cover for an issue, or null (then the typeset cover stands in). */
export function coverFor(
  issue: Pick<Issue, 'key'>,
  covers: Record<string, CoverInfo> | null | undefined,
): CoverInfo | null {
  if (!issue.key || !covers) return null;
  const c = covers[issue.key];
  return c && c.w > 0 && c.h > 0 && Array.isArray(c.widths) && c.widths.length > 0 ? c : null;
}

/**
 * Letter-spaced type ("F I R S T  B A P T I S T", the mastheads and some
 * headlines) comes out of a PDF as one letter per word, and a lone letter in
 * the index matches the start of almost any query. A run of three or more
 * single letters or digits is closed up; a wider gap inside the run (two or
 * more spaces, where the typesetter put a word space) stays a space.
 */
export function unspace(text: string): string {
  return text.replace(
    /(?<![\p{L}\p{N}])(?:[\p{L}\p{N}] {1,2}){2,}[\p{L}\p{N}](?![\p{L}\p{N}])/gu,
    (run) => run.replace(/ {2,}/g, ' ').replace(/ /g, '').replace(/ /g, ' '),
  );
}

/** One search record for an issue's text (Pagefind's addCustomRecord). */
export interface IssueRecord {
  url: string;
  content: string;
  language: 'en';
  meta: { title: string; date: string; reading: string };
}

/**
 * The record that makes an issue's words findable in the site search. The
 * row reads "Newsletter | The Visitor, June 2026 | the match | PDF, 52 MB",
 * the same register every search row uses (search-results.ts), and it opens
 * the PDF itself: the words searched for are in the file, not on /visitor.
 * Null when the issue has no text to find.
 */
export function issueRecord(issue: Issue, text: string): IssueRecord | null {
  const content = unspace(String(text ?? ''))
    .replace(/\s+/g, ' ')
    .trim();
  if (!content) return null;
  return {
    url: issue.href,
    content,
    language: 'en',
    meta: { title: issue.title, date: 'Newsletter', reading: fileLine(issue) },
  };
}
