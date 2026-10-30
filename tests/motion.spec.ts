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
// The page openers' word rise (feat/motion-openers, 2026-09-28)
// =============================================================================
// Every page-opening h1 rises word by word, as the home hero's does: the
// window hero (Who We Are; Visit, whose closing accent is a line of its own),
// the journal opener (/blog), What's On, and SectionHeading's h1 (/history).
// The post page's h1 is the exception on purpose: it is the far end of the
// shared title transition from a blog row, and two motions on one title would
// fight. Only the words move: nothing else in these openers gains an entrance.

const OPENERS = ['/who-we-are', '/visit', '/blog', '/events', '/history'];

test.describe('page openers, no preference', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const route of OPENERS) {
    test(`${route}: the h1 rises word by word and lands`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const h1 = page.locator('main h1').first();
      await h1.waitFor({ state: 'attached' });

      const rise = await h1.evaluate((el) => {
        const words = [...el.querySelectorAll('.hero-word-in')];
        return {
          words: words.map((w) => ({
            text: (w.textContent ?? '').trim(),
            delays: w.getAnimations().map((a) => {
              const t = (a.effect as KeyframeEffect).getComputedTiming();
              return { delay: Number(t.delay ?? 0), end: Number(t.endTime ?? 0) };
            }),
          })),
          h1Anims: el.getAnimations().length,
          h1Opacity: getComputedStyle(el).opacity,
          text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
          // Nothing beside the h1 gains an entrance: its siblings and their
          // descendants carry no animation at all (the window's rays are a
          // scroll reveal, a transition, not an animation object).
          siblingAnims: [...(el.parentElement?.children ?? [])]
            .filter((c) => c !== el)
            .flatMap((c) => [c, ...c.querySelectorAll('*')])
            .reduce((n, c) => n + c.getAnimations().length, 0),
        };
      });

      expect(rise.h1Anims, 'the h1 itself is animating').toBe(0);
      expect(rise.h1Opacity).toBe('1');
      expect(rise.words.length, 'the h1 was not split into words').toBeGreaterThan(1);
      // The words ARE the headline, and its accessible name is the sentence.
      expect(rise.words.map((w) => w.text).join(' ')).toBe(rise.text);
      await expect(h1).toHaveAccessibleName(rise.text);
      // Home's timing: 150ms, then 60ms apart, counting on across a closing
      // accent line, and landed inside the 1.6s budget on its own clock.
      rise.words.forEach((w, i) => {
        expect(w.delays.length, `word ${i} ("${w.text}") does not rise`).toBe(1);
        expect(w.delays[0].delay).toBeCloseTo(150 + i * 60, 0);
      });
      const landed = Math.max(...rise.words.map((w) => w.delays[0].end));
      expect(landed, `the last word lands at ${landed}ms`).toBeCloseTo(
        150 + (rise.words.length - 1) * 60 + 800,
        0,
      );
      expect(rise.siblingAnims, 'something beside the h1 gained an entrance').toBe(0);

      // Every word lands, in place.
      await h1.evaluate((el) =>
        Promise.all(
          [...el.querySelectorAll('.hero-word-in')].flatMap((w) =>
            w.getAnimations().map((a) => a.finished),
          ),
        ),
      );
      const transforms = await h1.evaluate((el) =>
        [...el.querySelectorAll('.hero-word-in')].map((w) => getComputedStyle(w).transform),
      );
      for (const t of transforms) expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(t);
    });
  }

  test('/visit: the closing accent line rises too, continuing the count', async ({ page }) => {
    await page.goto('/visit', { waitUntil: 'domcontentloaded' });
    const close = page.locator('main h1 .hw-close');
    await expect(close).toHaveCount(1);
    const indices = await page.locator('main h1 .hero-word').evaluateAll((els) =>
      els.map((e) => ({
        w: Number((e as HTMLElement).style.getPropertyValue('--w')),
        inClose: !!e.closest('.hw-close'),
      })),
    );
    expect(indices.map((x) => x.w)).toEqual(indices.map((_, i) => i));
    expect(indices.some((x) => x.inClose)).toBe(true);
    expect(indices.some((x) => !x.inClose)).toBe(true);
  });

  test('the post page h1 is NOT split: its title is the shared transition', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });
    const href = await page.locator('main a[href^="/post/"]').first().getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    const h1 = page.locator('h1.p2-title');
    await expect(h1).toHaveCount(1);
    expect(await h1.locator('.hero-word, .hero-word-in').count()).toBe(0);
    expect(
      await h1.evaluate((el) =>
        [el, ...el.querySelectorAll('*')].reduce((n, c) => n + c.getAnimations().length, 0),
      ),
    ).toBe(0);
  });
});

test.describe('page openers, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const route of OPENERS) {
    test(`${route}: the h1's words stand in place, unanimated`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      const words = await page
        .locator('main h1')
        .first()
        .evaluate((el) =>
          [...el.querySelectorAll('.hero-word-in')].map((w) => ({
            anims: w.getAnimations().length,
            transform: getComputedStyle(w).transform,
          })),
        );
      expect(words.length).toBeGreaterThan(1);
      for (const w of words) expect(w).toEqual({ anims: 0, transform: 'none' });
    });
  }
});

// =============================================================================
// The single-photo hero's one push-in (feat/motion-openers, 2026-09-28)
// =============================================================================
// One photograph gets no slideshow and no Pause: it pushes in once, 1 to 1.05
// towards its hotspot over 5 s (inside WCAG 2.2.2's five seconds), ends and
// stays. No page in the dataset draws this branch today, so the styleguide's
// one-photo fixture (hotspot 60% 30%) is where it is tested.

test.describe('single-photo hero, no preference', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the photo pushes in towards its hotspot, then ends and stays', async ({ page }) => {
    await page.goto('/styleguide', { waitUntil: 'domcontentloaded' });
    const img = page.locator('#styleguide-hero-one img.hero-still');
    await expect(img).toHaveCount(1);
    // Still the eager, high-priority LCP image, and never a slideshow.
    await expect(img).toHaveAttribute('loading', 'eager');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
    await expect(page.locator('#styleguide-hero-one [data-hero-pause]')).toHaveCount(0);

    const timing = await img.evaluate((el) => {
      const [a] = el.getAnimations();
      const t = (a.effect as KeyframeEffect).getComputedTiming();
      return {
        count: el.getAnimations().length,
        duration: Number(t.duration),
        iterations: t.iterations,
        fill: t.fill,
        direction: t.direction,
        origin: getComputedStyle(el).transformOrigin,
        // The layout box, not the (already scaling) painted one.
        size: [(el as HTMLElement).offsetWidth, (el as HTMLElement).offsetHeight],
      };
    });
    expect(timing.count).toBe(1);
    expect(timing.duration, 'longer than WCAG 2.2.2 five seconds').toBeLessThanOrEqual(5000);
    expect(timing.iterations).toBe(1);
    expect(timing.fill).toBe('forwards');
    expect(timing.direction).toBe('normal');
    // The origin is the hotspot (60% 30% of the photo's box).
    const [w, h] = timing.size;
    const [ox, oy] = timing.origin.split(' ').map(parseFloat);
    expect(ox).toBeCloseTo(w * 0.6, 0);
    expect(oy).toBeCloseTo(h * 0.3, 0);

    // It moves...
    const scale = () => img.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    const a = await scale();
    await page.waitForTimeout(400);
    const b = await scale();
    expect(b, 'the photo is not moving').toBeGreaterThan(a);
    // ...then ends at 1.05 and stays there.
    await img.evaluate((el) => Promise.all(el.getAnimations().map((x) => x.finished)));
    expect(await scale()).toBeCloseTo(1.05, 3);
    await page.waitForTimeout(500);
    expect(await scale()).toBeCloseTo(1.05, 3);
    expect(
      await img.evaluate(
        (el) => el.getAnimations().filter((x) => x.playState === 'running').length,
      ),
    ).toBe(0);
    // The section clips the enlarged edge.
    expect(
      await img.evaluate((el) => getComputedStyle(el.closest('section') as Element).overflowX),
    ).toBe('clip');
  });
});

test.describe('single-photo hero, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the photo stands still', async ({ page }) => {
    await page.goto('/styleguide', { waitUntil: 'load' });
    const img = page.locator('#styleguide-hero-one img.hero-still');
    await expect(img).toHaveCount(1);
    expect(await img.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await img.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
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

// =============================================================================
// The architecture opener's drawing (2026-10-03)
// =============================================================================
// /architecture opens on Hannaford's 1927 rendering as gold line art that
// paints in from the left over about nine seconds (HeritageOpener.astro, the
// drawing form). Opposite assertions again: it moves with motion allowed, and
// it simply stands drawn (nothing animating, soft edge past the right end)
// under reduced motion.
test.describe('architecture drawing, no preference', () => {
  test('paints in: the soft edge is moving and decorative', async ({ page }) => {
    await page.goto('/architecture', { waitUntil: 'load' });
    const ink = page.locator('.ho-drawing-ink');
    await expect(ink).toHaveCount(1);
    await expect(page.locator('.ho-drawing')).toHaveAttribute('aria-hidden', 'true');
    const name = await ink.evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toContain('ho-paint');
    const first = await ink.evaluate((el) =>
      parseFloat(getComputedStyle(el).getPropertyValue('--ho-paint')),
    );
    await page.waitForTimeout(1500);
    const later = await ink.evaluate((el) =>
      parseFloat(getComputedStyle(el).getPropertyValue('--ho-paint')),
    );
    expect(later).toBeGreaterThan(first);
  });
});

test.describe('architecture drawing, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('stands fully drawn and still', async ({ page }) => {
    await page.goto('/architecture', { waitUntil: 'load' });
    const ink = page.locator('.ho-drawing-ink');
    const state = await ink.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { name: cs.animationName, paint: parseFloat(cs.getPropertyValue('--ho-paint')) };
    });
    expect(state.name).toBe('none');
    expect(state.paint).toBeGreaterThanOrEqual(100);
  });
});
