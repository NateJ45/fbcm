// scaffold-file: journal
// Safe to edit by hand
// API.Bible's Fair Use Management System (FUMS), which its terms require
// wherever text served through it is shown on the web (2026-09-24,
// feat/scripture-text). Only reached when a build served the NIV through
// API.Bible (API_BIBLE_KEY set): such a passage carries data-fums with its
// tokens, and the first time a reader opens it this loads API.Bible's
// tracker and records one view per token. A BSB build never loads it.
//
// The tracker's address and call are API.Bible's (docs.api.bible, "Fair Use"):
// https://pkg.api.bible/fumsV3.min.js and fums("trackView", token). Calls made
// before the script arrives are queued, and the script reads the queue.

const SRC = 'https://pkg.api.bible/fumsV3.min.js';
const seen = new Set<string>();

type Fums = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global {
  interface Window {
    fums?: Fums;
  }
}

export function track(tokens: string): void {
  if (!window.fums) {
    const q: unknown[][] = [];
    const f: Fums = (...args: unknown[]) => void q.push(args);
    f.q = q;
    window.fums = f;
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    document.head.append(s);
  }
  for (const t of tokens.split(/\s+/).filter(Boolean)) {
    if (seen.has(t)) continue;
    seen.add(t);
    window.fums('trackView', t);
  }
}
