// NOT PORTABLE: FBCM's own (2026-11-08). a11y.spec.ts is a PORTABLE canonical copy and stays as the
// starter has it, so the WCAG 2.2 AA tag run lives beside it rather than inside it. Fold it into
// the starter's spec with a port card when the family adopts the tag list.
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';

// axe with the WCAG tag sets named out loud (A and AA through 2.2, plus best practice), so the
// 2.2 rules (target-size, 2.5.8) are in the run and the tag list is the audit's own. Zero
// violations on every route, at phone width, where target size and reflow bite hardest.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

test.use({ viewport: { width: 390, height: 844 } });

for (const route of routes) {
  test(`a11y (WCAG 2.2 AA tags, 390px): ${route} has no axe violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await settle(page);

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    if (results.violations.length > 0) {
      const report = results.violations
        .map((v) => {
          const targets = v.nodes.map((n) => n.target.join(' ')).join(', ');
          return `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    route: ${route}\n    selectors: ${targets}`;
        })
        .join('\n');
      expect(results.violations, `axe violations on ${route}:\n${report}`).toEqual([]);
    }
  });
}
