// Safe to edit by hand
// =============================================================================
// The church's Quick update documents (PORTS.md card 111)
// =============================================================================
// The Studio's Quick update tool (src/sanity/kit/QuickUpdateTool.tsx, PORTABLE)
// publishes whatever a form's `build` returns, straight away and WITHOUT the
// Studio's validation. These are the builders for the phone jobs in
// src/sanity/kit.config.ts, kept pure so src/lib/quick-updates.test.ts can check
// each one is a complete, valid `announcement` (the banner across the top of
// every page, src/sanity/schemaTypes/announcement.ts):
//
//   - a notice with a last day ("Put up a notice");
//   - a red notice for a change or cancellation that takes itself down after
//     the coming Sunday ("Cancel or change something this week").
// =============================================================================

// Type aliases, not interfaces: the Quick update tool wants a plain record.
export type NoticeDoc = {
  _type: 'announcement';
  internalTitle: string;
  message: string;
  style: 'info' | 'highlight' | 'urgent';
  enabled: true;
  endDate: string;
  link?: { label: string; url: string };
};

/** The announcement's message field allows 160 letters (announcement.ts). */
export const NOTICE_MAX = 160;

/**
 * The end of a local day ("2026-10-18" -> 23:59 that evening, as ISO). The
 * Studio runs in the editor's browser, so "local" is Muncie's time for the
 * church office.
 */
export function endOfDay(date: string): string {
  return new Date(`${date}T23:59:00`).toISOString();
}

/** The Studio-only name of a notice: its first words, dated. */
export function noticeName(message: string, date: string): string {
  const words = message.trim().replace(/\s+/g, ' ');
  const short = words.length > 40 ? `${words.slice(0, 40).trimEnd()}...` : words;
  return `${short} (until ${date})`;
}

/**
 * A notice that shows until the end of `lastDay`. A link is either a page on
 * this site ("/visit/") or a full https address, as the schema allows.
 */
export function buildNotice(
  v: { message: string; lastDay: string; link?: string },
  style: NoticeDoc['style'] = 'info',
): NoticeDoc {
  const doc: NoticeDoc = {
    _type: 'announcement',
    internalTitle: noticeName(v.message, v.lastDay),
    message: v.message.trim().replace(/\s+/g, ' ').slice(0, NOTICE_MAX),
    style,
    enabled: true,
    endDate: endOfDay(v.lastDay),
  };
  const link = v.link?.trim();
  if (link && /^(\/|https?:\/\/)/.test(link)) doc.link = { label: 'Find out more', url: link };
  return doc;
}
