// EXPECTED TO DIFFER PER SITE (2026-09-24, the Visit identity pass, fix round 1).
// The rollout's rule 9: headlines are sized by length and NOTHING BREAKS
// MID-WORD. Titling capitals are wide, and a heading with a twelve-letter word
// ("COORDINATION", "COMMUNION" beside a glyph) broke inside the word at
// laptop widths before headingFit (src/lib/heading-grammar.ts) capped it.
// This gate visits every route at five widths and fails when any word in any
// h1, h2 or h3 has its characters on two different lines. A break AFTER a
// hyphen (or a dash) is a fair break and is ignored.
import { test, expect } from '@playwright/test';
import { allRoutes as routes } from './routes';
import { settle } from './helpers';

const widths = [1440, 1024, 768, 375, 320];

// KNOWN, OWNED ELSEWHERE, TRACKED IN docs/PENDING.md. A finding here is a real
// break in a component another rollout branch owns; it is listed rather than
// silenced in the gate itself, and comes off this list the day it is fixed.
//   DocumentList's register year heading "Undated" (h3, font-display text-h3 in
//   a md:col-span-2 column) breaks at 768 and 1024 on /blog and /styleguide.
const KNOWN: RegExp[] = [/^H3 "Undated" breaks inside "Undated"$/];

for (const route of routes) {
  for (const width of widths) {
    test(`headings: no word breaks mid-word on ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await settle(page);
      await page.evaluate(() => document.fonts.ready);

      const broken = await page.evaluate(() => {
        const out: string[] = [];
        for (const h of document.querySelectorAll('h1, h2, h3')) {
          const el = h as HTMLElement;
          if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          // Characters in reading order with the top of their box.
          const chars: { ch: string; top: number; h: number }[] = [];
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const text = n.textContent ?? '';
            for (let i = 0; i < text.length; i++) {
              const ch = text[i];
              // Stega and other invisible characters carry no box.
              if (/[​-‍﻿]/.test(ch)) continue;
              const r = document.createRange();
              r.setStart(n, i);
              r.setEnd(n, i + 1);
              const rects = Array.from(r.getClientRects()).filter((x) => x.width > 0);
              if (rects.length === 0) {
                chars.push({ ch, top: NaN, h: 0 });
                continue;
              }
              chars.push({ ch, top: rects[0].top, h: rects[0].height });
            }
            // A text-node boundary is not a word boundary, so keep going.
          }
          let word: typeof chars = [];
          const flush = () => {
            for (let i = 1; i < word.length; i++) {
              const a = word[i - 1];
              const b = word[i];
              if (Number.isNaN(a.top) || Number.isNaN(b.top)) continue;
              if (/[-‐‑–—/]/.test(a.ch)) continue;
              if (Math.abs(b.top - a.top) > Math.max(a.h, b.h) * 0.5) {
                out.push(
                  `${el.tagName} "${(el.textContent ?? '').trim().slice(0, 60)}" breaks inside "${word.map((c) => c.ch).join('')}"`,
                );
                return;
              }
            }
          };
          for (const c of chars) {
            if (/\s/.test(c.ch)) {
              flush();
              word = [];
            } else word.push(c);
          }
          flush();
        }
        return out;
      });

      const found = broken.filter((b) => !KNOWN.some((k) => k.test(b)));
      expect(found, `${route} at ${width}px:\n${found.join('\n')}`).toEqual([]);
    });
  }
}
