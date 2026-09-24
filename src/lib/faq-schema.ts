// Foundation, edit with care
// scaffold-file: church
// A page's questions and answers as FAQPage JSON-LD (2026-09-24, the local
// search pass). DERIVED, never typed (CLAUDE.md rule 15): the node is built
// from the page's own "Questions and answers" bands (faqSection, drawn by
// FaqBand.astro), so what a search engine or an assistant reads is exactly
// what the visitor reads, and an editor who changes an answer changes both.
// There is no field for it and there must never be one.
//
// WHAT GOOGLE DOES WITH IT. Since 2023 Google shows the FAQ rich result only
// for well-known government and health sites, so this will not earn the
// church an expanded result on Google. It is still the plainest statement of
// "what to expect on a Sunday" a machine can read, and Bing and the AI
// answer engines (which quote question-and-answer pairs readily) do read it.
// It costs a few hundred bytes on the two pages that have a band.
//
// ONE BLOCK PER PAGE. A page with two question bands gets one FAQPage holding
// both, in page order, with a repeated question kept once (schema-vocab's
// validatePage refuses a second block of the same type).
//
// STEGA. The build reads published content with no stega, but a preview read
// carries invisible markers in every string, so every string is cleaned with
// splitStega before it is measured or compared (CLAUDE.md preview rules).
// Placeholders ({time}, {address}...) are already filled by sanityFetch before
// the page sees the sections.

import { splitStega } from './preview-stega.ts';

type Json = Record<string, unknown>;

interface PtSpan {
  _type?: string;
  text?: unknown;
}
interface PtBlock {
  _type?: string;
  style?: string;
  listItem?: string;
  children?: PtSpan[] | null;
}
export interface FaqItemIn {
  question?: unknown;
  answer?: PtBlock[] | null;
}
export interface SectionIn {
  _type?: string;
  items?: FaqItemIn[] | null;
}

/** Collapse whitespace and drop stega markers. */
const tidy = (s: string): string => splitStega(s).cleaned.replace(/\s+/g, ' ').trim();

/**
 * A Portable Text answer as plain text: each text block's spans joined, the
 * blocks joined by a blank line, a list item as "- item". Non-text blocks
 * (an image, an embed) are skipped. '' when nothing readable is left.
 */
export function portableTextToPlain(blocks: PtBlock[] | null | undefined): string {
  if (!Array.isArray(blocks)) return '';
  const paras: string[] = [];
  for (const b of blocks) {
    if (!b || b._type !== 'block' || !Array.isArray(b.children)) continue;
    const text = tidy(
      b.children.map((c) => (c && typeof c.text === 'string' ? c.text : '')).join(''),
    );
    if (!text) continue;
    paras.push(b.listItem ? `- ${text}` : text);
  }
  // Consecutive list items read as one list, not as separate paragraphs.
  return paras
    .map((p, i) =>
      i > 0 && p.startsWith('- ') && paras[i - 1]?.startsWith('- ') ? `\n${p}` : `\n\n${p}`,
    )
    .join('')
    .trim();
}

/** Every answered question on the page, in page order, each question once. */
export function faqEntries(
  sections: SectionIn[] | null | undefined,
): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = [];
  const seen = new Set<string>();
  for (const s of sections ?? []) {
    if (!s || s._type !== 'faqSection' || !Array.isArray(s.items)) continue;
    for (const item of s.items) {
      const question = typeof item?.question === 'string' ? tidy(item.question) : '';
      const answer = portableTextToPlain(item?.answer);
      if (!question || !answer) continue;
      const key = question.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ question, answer });
    }
  }
  return out;
}

/**
 * The page's FAQPage node, or null when the page has no answered question.
 * `pageUrl` is the page's absolute URL (the node's @id is `<pageUrl>#faq`).
 */
export function faqPageNode(
  sections: SectionIn[] | null | undefined,
  pageUrl: string,
): Json | null {
  const entries = faqEntries(sections);
  if (entries.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    url: pageUrl,
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  };
}
