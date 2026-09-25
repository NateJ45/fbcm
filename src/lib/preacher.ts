// Safe to edit by hand
// Who is preaching this Sunday (2026-09-25, `feat/preacher-and-feel`). Pure,
// unit-tested in preacher.test.ts. Two sources, and the same order as the
// sermon on the dated line (src/lib/this-sunday.ts):
//
//   1. the sermon preview the church posted for that Sunday: its author, the
//      name the post page already prints as "Preaching" (post/[slug].astro),
//      unless the author is the church's own account ("FBC Muncie", on 11 of
//      the 118 previews), which names nobody;
//   2. else the coming Sunday's scheduled YouTube broadcast: the name on its
//      description's "Preaching:" line (preacherOf below);
//   3. else nobody, and the hero's facts row reads exactly as it did before.
//
// NEVER GUESS. A line that does not read as a person's name ("TBA", a link,
// "Our pastors") names nobody; two broadcasts for one Sunday that name two
// different people name nobody. Nothing here is typed by an editor: the name
// is the church's own, written where it already writes it (CLAUDE.md rule 15).

/** The coming Sunday's preacher, as the hero draws it. */
export interface SundayPreacher {
  /** The Sunday it is for, YYYY-MM-DD on the church's calendar. */
  sunday: string;
  /** The name as the source wrote it, titles included ("Rev. Jonathan Balmer"). */
  name: string;
  source: 'preview' | 'youtube';
}

// THE LABELS. "Preacher:", "Preaching:" and "Speaker:", in any case, with an
// optional "Guest" in front, and a colon or a spaced dash after. A label is
// read at the start of a line, or of a segment of a line split on "|", "•" or
// "·", so "Matthew 21:23-32 | Preaching: Rev. Jonathan Balmer" is read too.
const LABEL = /^(?:guest\s+)?(?:preacher|preaching|speaker)\s*(?::|\s[-–—]\s)\s*(.*)$/i;
const SEGMENT = /\r?\n|\s[|•·]\s/;

// Titles a name may carry. They are kept as written, never added or dropped.
const TITLES = new Set(
  [
    'rev',
    'rev.',
    'reverend',
    'the',
    'dr',
    'dr.',
    'pastor',
    'pr.',
    'elder',
    'deacon',
    'bishop',
    'minister',
    'mr.',
    'mrs.',
    'ms.',
    'miss',
  ].map((t) => t.toLowerCase()),
);
// Lower-case words a name may carry between capitalised ones.
const PARTICLES = new Set([
  'and',
  '&',
  'de',
  'del',
  'della',
  'di',
  'da',
  'van',
  'von',
  'der',
  'den',
  'la',
  'le',
]);
// What a description writes when there is no name yet.
const NOBODY =
  /^(?:tba|tbd|to be (?:announced|determined)|guest|various|n\/?a|none|our pastors?)$/i;

/** Whitespace collapsed, and trailing punctuation off (but not the dot of "Jr."). */
function tidy(raw: string): string {
  let t = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[,;:!]+$/, '');
  if (t.endsWith('.') && !/(?:^|\s)(?:Jr|Sr|[A-Z])\.$/.test(t)) t = t.slice(0, -1);
  return t.trim();
}

/**
 * Whether `name` reads as a person's name: 3 to 60 characters, no digits, no
 * link or address, at most seven words, and at least one word left after the
 * titles, every one of them capitalised (bar a few particles such as "van").
 */
export function isPersonName(name: string): boolean {
  const t = name.trim();
  if (t.length < 3 || t.length > 60) return false;
  if (/\d|@|https?:|www\.|\/|[()[\]{}<>]/i.test(t)) return false;
  if (NOBODY.test(t)) return false;
  const words = t.split(' ');
  if (words.length > 7) return false;
  const rest = words.filter((w) => !TITLES.has(w.toLowerCase()));
  if (rest.length === 0) return false;
  return rest.every((w) => PARTICLES.has(w) || /^\p{Lu}[\p{L}'’.-]*$/u.test(w));
}

/**
 * The preacher named in a YouTube description, or ''. The first labelled
 * segment that reads as a person's name wins.
 */
export function preacherOf(description: string | null | undefined): string {
  if (!description) return '';
  for (const segment of description.split(SEGMENT)) {
    const m = LABEL.exec(segment.trim());
    if (!m) continue;
    const name = tidy(m[1] ?? '');
    if (isPersonName(name)) return name;
  }
  return '';
}

// A post's author that is the church's own account, not a person.
const CHURCH_ACCOUNT = /\b(?:FBC|FBCM|First Baptist|Church|Muncie|Admin|Office|Staff|Team)\b/i;

/** A sermon preview's author as its preacher, or '' when it names nobody. */
export function previewPreacher(author: string | null | undefined): string {
  const name = tidy(String(author ?? ''));
  if (!name || CHURCH_ACCOUNT.test(name)) return '';
  return isPersonName(name) ? name : '';
}

/**
 * The hero's preacher: the preview's when it names one for `sunday`, else the
 * broadcast's for `sunday`, else null. `sunday` is the coming Sunday as of
 * the build; a source for any other Sunday is ignored rather than trusted.
 */
export function thisSundayPreacher(
  sunday: string | null,
  preview: { sunday: string; name: string } | null | undefined,
  broadcast: { sunday: string; name: string } | null | undefined,
): SundayPreacher | null {
  if (!sunday) return null;
  if (preview && preview.sunday === sunday && preview.name) {
    return { sunday, name: preview.name, source: 'preview' };
  }
  if (broadcast && broadcast.sunday === sunday && broadcast.name) {
    return { sunday, name: broadcast.name, source: 'youtube' };
  }
  return null;
}
