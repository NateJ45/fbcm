import { test, expect } from './fixtures';

// =============================================================================
// The motion pass (art-direction pass, task 12)
// =============================================================================
// Two assertions, and they are opposites on purpose: one proves the site goes
// STILL when the visitor asks for stillness, the other proves it still MOVES
// when they do not. Either one alone can pass on a broken site. A stylesheet
// that killed every animation outright would sail through the first; the
// prefers-reduced-motion reset going missing would sail through the second.
//
// Both run on `/`, because that is where the motion lives: the hero's
// entrance (the headline's words rising, the lines around it fading up), the
// slideshow (its sequencer and every frame's move), the scroll parallax, and
// the overlay breathe (`.hero-overlay`, a 7s alternate on the registered
// `--hero-stop`). Every other page's reveals are IntersectionObserver
// transitions, and a transition is not an animation object.
//
// This file is deliberately NOT marked PORTABLE. The hero it reads is this
// site's hero.
// =============================================================================

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing on the home page is animating', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    // Past the longest load choreography on the page (with motion on, the
    // hero stagger's last child lands by about 1.9s), so anything still going
    // here is going indefinitely rather than merely mid-flight.
    await page.waitForTimeout(2000);

    // NO EXCLUSIONS. The slideshow is not skipped here, it is simply not
    // running: every move, the parallax, the word rise and the breathe live
    // inside `no-preference` queries, so under reduce those rules do not exist
    // and no animation object is created, and the sequencer never starts.
    // The global reset's `animation-duration: 0.01ms` finishes everything else
    // before this point, which is why the filter is on playState rather than on
    // the raw count: a finished fill-forwards animation is still an object.
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running')
        .map((a) => {
          const effect = a.effect as KeyframeEffect | null;
          const target = effect?.target as Element | null;
          return {
            name: (a as unknown as { animationName?: string }).animationName ?? a.id ?? 'unknown',
            target: target ? `${target.tagName.toLowerCase()}.${target.className}` : 'none',
          };
        }),
    );
    expect(running, `still running: ${JSON.stringify(running)}`).toEqual([]);
  });
});

test.describe('no preference', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the hero headline rises word by word and has landed within 1.6s', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const headline = page.locator('.hero-entry-stagger h1').first();
    await headline.waitFor({ state: 'attached' });

    // The budget is read off each animation's own clock, not the wall clock:
    // the entrance starts at the first style resolution, which on a cold
    // runner lands hundreds of ms after domcontentloaded, so wall-clock
    // polling would measure the runner, not the choreography (the first shape
    // of this test failed that way, at 0.997, on both engines).
    const hero = await headline.evaluate((h1) => {
      const timing = (el: Element) =>
        el.getAnimations().map((a) => {
          const t = (a.effect as KeyframeEffect).getComputedTiming();
          return { delay: Number(t.delay ?? 0), end: Number(t.endTime ?? 0) };
        });
      const next = h1.nextElementSibling;
      return {
        words: [...h1.querySelectorAll('.hero-word-in')].map((w) => ({
          text: w.textContent ?? '',
          anims: timing(w),
        })),
        h1Anims: h1.getAnimations().length,
        h1Opacity: getComputedStyle(h1).opacity,
        text: (h1.textContent ?? '').replace(/\s+/g, ' ').trim(),
        next: next ? timing(next) : [],
      };
    });

    // The h1 itself is never faded: only its words move, so it is at full
    // opacity from the first paint and carries no animation of its own.
    expect(hero.h1Anims, 'the h1 itself is animating').toBe(0);
    expect(hero.h1Opacity).toBe('1');

    // One rising box per word, and the words ARE the headline: joined with
    // single spaces they are its text, so real spaces sit between them and
    // the heading's accessible name is the whole sentence.
    expect(hero.words.length, 'the headline was not split into words').toBeGreaterThan(1);
    expect(hero.words.map((w) => w.text.trim()).join(' ')).toBe(hero.text);
    await expect(headline).toHaveAccessibleName(hero.text);

    // Each word rises once, 60ms after the one before it, from 150ms, and
    // the last has landed inside the 1.6s budget.
    hero.words.forEach((w, i) => {
      expect(w.anims.length, `word ${i} ("${w.text}") does not rise`).toBe(1);
      expect(w.anims[0].delay).toBeCloseTo(150 + i * 60, 0);
    });
    const landed = Math.max(...hero.words.map((w) => w.anims[0].end));
    expect(landed, `the last word lands at ${landed}ms`).toBeLessThanOrEqual(1600);

    // What follows the headline (the lede) waits for the words: it starts
    // after the last word has started rising.
    const lastStart = hero.words[hero.words.length - 1].anims[0].delay;
    expect(hero.next.length, 'the line after the headline has no entrance').toBe(1);
    expect(hero.next[0].delay).toBeGreaterThan(lastStart);

    // And every word actually lands, in place. An entrance that never plays
    // out is the failure this half catches, and it is a blank headline.
    await headline.evaluate((h1) =>
      Promise.all(
        [...h1.querySelectorAll('.hero-word-in')].flatMap((w) =>
          w.getAnimations().map((a) => a.finished),
        ),
      ),
    );
    const transforms = await headline.evaluate((h1) =>
      [...h1.querySelectorAll('.hero-word-in')].map((w) => getComputedStyle(w).transform),
    );
    for (const t of transforms) expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(t);
  });

  test('the slideshow advances, keeps moving, and Pause holds it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    const frames = page.locator('[data-hero-fade] .hero-frame');
    const current = page.locator('[data-hero-fade] .hero-frame.is-current');
    const transform = () => current.evaluate((el) => getComputedStyle(el).transform);
    const currentIndex = () =>
      frames.evaluateAll((els) => els.findIndex((el) => el.classList.contains('is-current')));

    // Frame 1 is current from the first paint, and already moving.
    await expect(frames.first()).toHaveClass(/is-current/);
    const moving = await frames
      .first()
      .evaluate((el) => el.getAnimations().some((a) => a.playState === 'running'));
    expect(moving, 'frame 1 is not moving').toBe(true);

    // Frame 2 is inserted after load and takes over when frame 1's hold ends,
    // and its picture is moving too.
    await expect(frames.nth(1)).toHaveClass(/is-current/, { timeout: 15_000 });
    await expect(frames.first()).not.toHaveClass(/is-current/);
    const a = await transform();
    await page.waitForTimeout(400);
    expect(await transform(), 'the current frame is still').not.toBe(a);

    // Pause: the sequencer and the move both stop where they are.
    const button = page.locator('[data-hero-pause]');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveText('Play');
    // Past a dissolve that was already under way (a pause does not cut the
    // 0.7s opacity transition short).
    await page.waitForTimeout(800);
    const held = await transform();
    const heldIndex = await currentIndex();
    await page.waitForTimeout(3000);
    expect(await transform(), 'the move ran on under Pause').toBe(held);
    expect(await currentIndex(), 'the slideshow advanced under Pause').toBe(heldIndex);

    // Play resumes it from where it stood.
    await button.click();
    await expect(button).toHaveText('Pause');
    await page.waitForTimeout(400);
    expect(await transform(), 'Play did not resume the move').not.toBe(held);
  });
});

test.describe('slideshow, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('frame 1 alone, still, and the later frames are never inserted', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const frames = page.locator('[data-hero-fade] .hero-frame');
    await expect(frames).toHaveCount(1);
    await expect(frames.first()).toHaveClass(/is-current/);
    expect(await frames.first().evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await expect(page.locator('[data-hero-pause]')).toBeHidden();
  });
});

// =============================================================================
// The glyph draw (feat/print-motion, 2026-09-24)
// =============================================================================
// Every BuildingGlyph is on the reveal observer with the `draw` variant: its
// strokes draw themselves once, the first time it scrolls into view. The two
// halves again: still means fully drawn and never animating; moving means it
// really does draw, lands whole, and lets go of the dash.

test.describe('glyph draw, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every glyph stroke is fully drawn, with no dash and no animation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    // Below the fold as well as above it: a reduced-motion visitor never
    // waits on the observer.
    const all = await page.evaluate(() =>
      [...document.querySelectorAll('svg[data-reveal="draw"] > :not(.glyph-dots)')].map((el) => {
        const cs = getComputedStyle(el);
        return {
          dash: cs.strokeDasharray,
          offset: cs.strokeDashoffset,
          animations: el.getAnimations().length,
        };
      }),
    );
    expect(all.length, 'no glyph strokes on the home page').toBeGreaterThan(10);
    for (const s of all) {
      expect(s, JSON.stringify(s)).toEqual({ dash: 'none', offset: '0px', animations: 0 });
    }
  });
});

test.describe('glyph draw, no preference', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

  test('a glyph below the fold waits, draws once, and lands whole', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    const glyph = page.locator('main svg[data-reveal="draw"]').last();
    // Waiting, undrawn: the dash is offset by its whole length.
    const before = await glyph.evaluate((svg) => {
      const p = svg.querySelector(':scope > :not(.glyph-dots)') as SVGElement;
      const cs = getComputedStyle(p);
      return {
        visible: svg.classList.contains('is-visible'),
        dash: cs.strokeDasharray,
        offset: parseFloat(cs.strokeDashoffset),
      };
    });
    expect(before.visible).toBe(false);
    expect(before.dash).not.toBe('none');
    expect(before.offset).toBeGreaterThan(0);

    await glyph.scrollIntoViewIfNeeded();
    await expect(glyph).toHaveClass(/is-visible/);
    // Mid-draw, something is moving.
    const moving = await glyph.evaluate((svg) =>
      [...svg.children].some((c) => c.getAnimations().some((a) => a.playState === 'running')),
    );
    expect(moving, 'the glyph became visible without drawing').toBe(true);
    // Landed: the dash comes off, so every stroke is whole whatever the size.
    await expect(glyph).toHaveClass(/is-drawn/, { timeout: 4000 });
    const after = await glyph.evaluate((svg) =>
      [...svg.querySelectorAll(':scope > :not(.glyph-dots)')].map(
        (c) => getComputedStyle(c).strokeDasharray,
      ),
    );
    expect(new Set(after)).toEqual(new Set(['none']));

    // Once per page view: scrolled away and back, nothing replays.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await glyph.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const replay = await glyph.evaluate((svg) =>
      [...svg.children].some((c) => c.getAnimations().length > 0),
    );
    expect(replay, 'the glyph drew again').toBe(false);
  });
});
