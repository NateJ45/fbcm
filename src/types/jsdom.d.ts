// src/types/jsdom.d.ts
// Safe to edit by hand
//
// jsdom ships no types, and @types/jsdom would be a SECOND new package in a
// branch whose whole point is one approved dependency (CLAUDE.md rule 8). This
// declares only the sliver we use: `new JSDOM(html).window.document`, the DOM
// that @portabletext/block-tools needs and Node does not have.
//
// jsdom itself is not ours either: it arrives in this tree through `sanity`'s
// CLI. Nothing shipped to a browser or a Worker touches it. Its only callers
// are import-time tooling (src/lib/*.test.ts and scripts/reimport-post-bodies.mjs),
// which is why the converter takes `parseHtml` as an argument rather than
// importing a parser of its own.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>);
    readonly window: { document: Document };
  }
}
