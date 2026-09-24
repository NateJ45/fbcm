// Safe to edit by hand
// /llms.txt, the plain-text summary of the church for language models
// (2026-09-24, the local search pass). src/pages/llms.txt.ts gathers the data
// at build time; this file decides what the text says, so a node test can
// reach it.
//
// WHY IT EXISTS, HONESTLY. llms.txt is a proposed convention (llmstxt.org),
// not a standard, and no search engine has said it reads it for ranking. It is
// here because it is cheap and harmless: when an assistant does fetch it, it
// gets the church's name, place, Sunday time and pages in one short read,
// instead of reconstructing them from the HTML.
//
// DERIVED, NEVER TYPED (CLAUDE.md rule 15). Until this pass /llms.txt was a
// hand-written file in public/ with the service time and the address typed
// into it, a second copy that would have gone stale the first time Site
// settings changed. Now every fact comes from Site settings, every page line
// from that page's own title and search description, and the "what to expect"
// questions from the Visit page's own question band. The only typed words are
// the headings, the labels and the one summary line, which the church approves
// with the rest of the new copy (docs/superpowers/notes/
// 2026-09-19-copy-for-church-approval.md, "llms.txt").

import { splitStega } from './preview-stega.ts';

interface PtBlock {
  _type?: string;
  children?: Array<{ text?: unknown }> | null;
}

export interface LlmsSettings {
  title?: string | null;
  tagline?: string | null;
  address?: string | null;
  serviceTime?: string | null;
  serviceLength?: string | null;
  phone?: string | null;
  email?: string | null;
  officeHours?: PtBlock[] | null;
  directionsUrl?: string | null;
  livestreamUrl?: string | null;
  youtubeUrl?: string | null;
  churchCenterUrl?: string | null;
  churchTracUrl?: string | null;
  givingUrl?: string | null;
}

export interface LlmsPage {
  /** Site-relative path, '/' for home. */
  path: string;
  title: string;
  description?: string | null;
}

export interface LlmsInput {
  /** https://www.example.org, no trailing slash. */
  siteUrl: string;
  /** Fallback name when Site settings has none. */
  name: string;
  settings: LlmsSettings | null | undefined;
  /** In the order they should be listed. */
  pages: LlmsPage[];
  /** The Visit page's own questions and answers, plain text. */
  whatToExpect?: Array<{ question: string; answer: string }>;
  /** The path of the page about the Sunday service ('/visit'). */
  visitPath?: string;
  /** The longer companion file, when the build ships one ('/llms-full.txt'). */
  fullPath?: string | null;
  /** True when the site has a blog (the journal capability). */
  journal?: boolean;
}

const tidy = (s: unknown): string =>
  typeof s === 'string' ? splitStega(s).cleaned.replace(/\s+/g, ' ').trim() : '';

const httpUrl = (u: unknown): string => {
  const s = tidy(u);
  return /^https?:\/\//.test(s) ? s : '';
};

/** Each text line of a Portable Text field ("Friday: 9 am to 12 pm"). */
export function ptLines(blocks: PtBlock[] | null | undefined): string[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b?._type === 'block' && Array.isArray(b.children))
    .map((b) =>
      tidy((b.children ?? []).map((c) => (typeof c?.text === 'string' ? c.text : '')).join('')),
    )
    .filter(Boolean);
}

/** The address as one line: "309 East Adams Street, Muncie, IN 47305". */
export const oneLineAddress = (address: unknown): string =>
  typeof address === 'string'
    ? splitStega(address)
        .cleaned.split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .join(', ')
    : '';

export function llmsText(input: LlmsInput): string {
  const s = input.settings ?? {};
  const url = (path: string) => `${input.siteUrl}${path === '/' ? '/' : path}`;
  const name = tidy(s.title) || input.name;
  const out: string[] = [];
  const bullet = (label: string, value: string) => {
    if (value) out.push(`- ${label}: ${value}`);
  };

  out.push(`# ${name}`, '');
  const summary = ['An American Baptist church in downtown Muncie, Indiana.', tidy(s.tagline)]
    .filter(Boolean)
    .join(' ');
  out.push(`> ${summary}`, '');

  out.push('## Sundays', '');
  const time = tidy(s.serviceTime);
  const length = tidy(s.serviceLength);
  bullet('Worship', [time, length ? `(${length.toLowerCase()})` : ''].filter(Boolean).join(' '));
  bullet('Where', oneLineAddress(s.address));
  bullet('Directions', httpUrl(s.directionsUrl));
  bullet('Watch online', httpUrl(s.livestreamUrl));
  if (input.visitPath) bullet('Plan a visit', url(input.visitPath));
  out.push('');

  const faq = input.whatToExpect ?? [];
  if (faq.length > 0) {
    out.push('## What to expect', '');
    for (const { question, answer } of faq) {
      out.push(`### ${tidy(question)}`, '', answer.trim(), '');
    }
  }

  out.push('## Contact', '');
  bullet('Phone', tidy(s.phone));
  bullet('Email', tidy(s.email));
  const hours = ptLines(s.officeHours);
  if (hours.length > 0) bullet('Office hours', hours.join('; '));
  bullet('Give', httpUrl(s.givingUrl));
  out.push('');

  const pages = input.pages.filter((p) => p.path && tidy(p.title));
  if (pages.length > 0) {
    out.push('## Pages', '');
    for (const p of pages) {
      const d = tidy(p.description);
      out.push(`- [${tidy(p.title)}](${url(p.path)})${d ? `: ${d}` : ''}`);
    }
    out.push('');
  }

  const elsewhere: Array<[string, string]> = [
    ['YouTube', httpUrl(s.youtubeUrl)],
    ['Church Center (calendar and giving)', httpUrl(s.churchCenterUrl)],
    ['Church Trac (newsletters and the app)', httpUrl(s.churchTracUrl)],
  ];
  if (elsewhere.some(([, u]) => u)) {
    out.push('## Elsewhere', '');
    for (const [label, u] of elsewhere) bullet(label, u);
    out.push('');
  }

  out.push('## About this file', '');
  out.push(
    `Generated from the site's own content every time the site is built, so it always matches the pages.`,
  );
  if (input.journal) {
    out.push(
      `Sermon previews and church news are at ${url('/blog')}, each post at /post/<slug>, with a feed at ${url('/blog/rss.xml')}.`,
    );
  }
  if (input.fullPath)
    out.push(`A longer companion with more of the site's text: ${url(input.fullPath)}`);
  out.push('');
  return out.join('\n');
}
