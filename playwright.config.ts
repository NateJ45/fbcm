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
    // "Last Sunday" (2026-09-24): the home page's band is read from the
    // church's YouTube feed at BUILD time, so the suite's build reads the
    // committed feed in tests/fixtures/youtube-feed.xml at a fixed Thursday
    // instead, offline and identical on every run (src/pages/index.astro).
    // Merged over process.env by Playwright; no deploy sets these.
    //
    // The Visitor (2026-09-24): VISITOR_FIXTURE=1 makes the build step
    // (scripts/visitor-covers.mjs) read the committed page fixture,
    // scripts/data/fixtures/visitor.json, as the /visitor page, so Home's band
    // and the search records come from fixed data and point at
    // /styleguide/visitor, which renders that fixture (tests/visitor.spec.ts).
    env: {
      LAST_SUNDAY_FIXTURE: '1',
      LAST_SUNDAY_NOW: '2026-09-24T16:00:00Z',
      VISITOR_FIXTURE: '1',
      // What's On (2026-09-25): /events reads tests/fixtures/churchtrac.ics
      // (the church's real Church Trac feed, names taken out) at a fixed
      // Friday, not the live calendar (src/lib/church-calendar-feed.ts).
      CHURCH_CALENDAR_FIXTURE: '1',
      CHURCH_CALENDAR_NOW: '2026-09-25T16:00:00Z',
      // The ministry newsletters (2026-09-25): /kids-corner and /youth-news read
      // tests/fixtures/churchtrac-{children,youth}.html, the real Church Trac
      // pages of that day, not the live ones (src/lib/church-trac-newsletters.ts).
      CHURCH_TRAC_PAGES_FIXTURE: '1',
    },
    // A full build of a 400-page site takes 3 to 4 minutes on a CI runner;
    // 10 minutes is the floor for any repo in the family.
    timeout: 600_000,
  },
});
