import { defineConfig, devices } from '@playwright/test';

// =============================================================================
// Playwright config (family test standard)
// =============================================================================
// Tests run against the REAL production build (dist/client) served statically,
// not `astro dev`: the Cloudflare workerd dev runtime is flakier and can serve
// error pages that a naive check would read as "fine". Fresh build + no-cache
// serve each run avoids stale-CSS false results.
//
// dist/client holds only the PRERENDERED site. The SSR routes (/studio,
// /preview/**, /api/draft-mode/*) need a Worker behind them and are not here;
// exercise those with `npm run preview` (wrangler dev) by hand.
//
// The port is 4321 by default and overridable with PLAYWRIGHT_PORT, so a run
// can share a machine with a dev server or another repo's suite. The webServer
// command is assembled here rather than read from `npm run serve:dist` so the
// override needs no shell interpolation (Windows and POSIX disagree about it).
// =============================================================================

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4321);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  // A visual-regression suite (PORTS.md card 37) lives at tests/visual/** with
  // its OWN config: different reporter, a screenshot threshold, reduced motion,
  // and its own port so the two can run side by side. Without this ignore, this
  // config sweeps those specs up under the wrong settings and fails them for
  // having no baselines, which is exactly what happened the day stonesteps-50k
  // added them. Harmless in a repo with no tests/visual folder, which is why it
  // lives in the canonical copy rather than in each site.
  testIgnore: '**/visual/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // Chromium runs everything. A real WebKit iPhone profile runs the
  // viewport-agnostic suites (smoke + the axe sweep): Safari's engine finds
  // layout and JS issues Chromium never will. (It also ran a11y-dark.spec.ts
  // and its focus-indicator check until 2026-09-24, when the site went
  // light-only and that suite was removed; FBCM has no form, so the focus
  // check had nothing to measure here anyway.) reflow.spec.ts drives its own explicit
  // viewport widths, which fights device emulation, so it is chromium-only.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Reflow again, with REAL scrollbars (added 2026-09-22). Playwright launches
    // Chromium with --hide-scrollbars, where 100vw equals the page width, so a
    // layout sized in 100vw that overshoots by the scrollbar's width passes the
    // gate above and scrolls sideways in every real desktop browser. That
    // shipped: the .bleed-* pictures overflowed 11 of 13 routes at 1440px and no
    // test saw it. This project restores the scrollbar and reruns reflow only,
    // so the other suites' measurements stay exactly as they were.
    {
      name: 'chromium-scrollbars',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
      },
      testMatch: /reflow\.spec\.ts$/,
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 14'] },
      // anchors.spec.ts added 2026-09-20 (plan 2c task 4): the sticky-header
      // offset is a CSS value, and WebKit's own anchor-scroll timing is exactly
      // the kind of thing Chromium alone would not catch, so it runs here too.
      //
      // menu + motion added 2026-09-21 (plan 3 task 12). Both are engine
      // questions before they are layout questions: the menu sheet is a Radix
      // dialog whose focus trap and entrance WebKit drives differently, and
      // motion.spec.ts reads getAnimations(), where Safari's timeline is the
      // one most likely to disagree with Chromium about what is still running.
      //
      // header.spec.ts is deliberately NOT here, for the same reason
      // reflow.spec.ts is not: it pins an explicit 1440 viewport to exercise
      // the DESKTOP header, and an explicit width fights device emulation. On
      // a phone the Give button lives in the menu sheet and the header has no
      // overlay state to seed, so there is nothing for this profile to check.
      testMatch: /(smoke|a11y|anchors|menu|motion)\.spec\.ts$/,
    },
  ],
  webServer: {
    command: `npm run build && npx http-server dist/client -p ${PORT} -s -c-1 --silent`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // A full build of a 400-page site takes 3 to 4 minutes on a CI runner;
    // 10 minutes is the floor for any repo in the family.
    timeout: 600_000,
  },
});
