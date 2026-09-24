// Safe to edit by hand
// Build-time robots.txt endpoint. Generates robots.txt from the canonical
// site URL in src/data/site.ts so the Sitemap line stays in sync automatically.
//
// 2026-09-24, the local search pass: everything stays open to every crawler
// (`User-agent: *` / `Allow: /`), and the search and AI-answer crawlers are
// ALSO named, in one group of their own that allows everything. Naming them
// changes nothing for a crawler that already obeys `*`; what it does is say, in
// the file itself, that the church WANTS to be found and quoted by ChatGPT,
// Perplexity, Claude, Google's and Apple's AI features and Bing, so nobody
// later reads a missing entry as an oversight and "fixes" it with a block.
// The crawler that decides whether the church appears in an AI answer is the
// search one (OAI-SearchBot, PerplexityBot, Claude-SearchBot); the *-User ones
// fetch a page when a person asks about it; GPTBot, ClaudeBot,
// Google-Extended and Applebot-Extended are the training and grounding
// controls. Allowing all of them is the church's decision to make, and the
// default here is to be found. If one ever needs blocking, give it its own
// group with `Disallow: /` and take it out of this list.
//
// What robots.txt cannot do: Cloudflare's "Block AI bots" / AI Crawl Control
// blocks these crawlers at the edge whatever this file says. It must be OFF
// for the zone (docs/superpowers/notes/2026-09-20-cutover-plan.md, "Search and
// AI visibility at cutover").

import type { APIRoute } from 'astro';
import { site } from '@/data/site';

/** Search and AI-answer crawlers, named and allowed. Order: OpenAI,
 *  Perplexity, Anthropic, Google, Apple, Microsoft. */
const NAMED_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
];

export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Search and AI answer crawlers: welcome.',
    ...NAMED_CRAWLERS.map((ua) => `User-agent: ${ua}`),
    'Allow: /',
    '',
    `Sitemap: ${site.url}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
