// Safe to edit by hand
// Floating back-to-top button. Scrolls smoothly to top on click. Respects
// prefers-reduced-motion via the global CSS rule that disables smooth scroll.
//
// WHEN IT SHOWS (2026-10-03, the design audit's /visit finding). It used to
// appear for good once the page was 600px down, and on a phone a 44px button
// parked 24px from the right edge sits on the last words of every line of the
// text beside it (the gutter is 20px, so there is nowhere clear to put it).
// Now it appears only while the visitor is scrolling UP, which is the moment
// they are heading back to the top, and it fades again when they scroll down
// or stop for IDLE_MS. While it is hidden it is invisible and not clickable
// (opacity 0, pointer-events none) but it stays in the tab order and shows
// itself on keyboard focus, so a keyboard visitor can still reach it.
// Sticky CTA chip (StickyCTAChip.tsx) uses the same "hide while reading" idea.

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** The page must be this far down before the button can appear. */
const MIN_Y = 600;
/** Scroll movement under this many px is jitter, not a direction change. */
const JITTER = 6;
/** How long after the last upward scroll the button stays before fading. */
const IDLE_MS = 2500;

export default function BackToTop() {
  const [deep, setDeep] = useState(false);
  const [shown, setShown] = useState(false);
  const lastY = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      setDeep(y > MIN_Y);
      if (y <= MIN_Y) {
        setShown(false);
        lastY.current = y;
        return;
      }
      if (Math.abs(dy) < JITTER) return;
      lastY.current = y;
      clearTimeout(timer.current);
      if (dy < 0) {
        // Heading back up: offer the button, and let it go if they stop.
        setShown(true);
        timer.current = setTimeout(() => setShown(false), IDLE_MS);
      } else {
        setShown(false);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer.current);
    };
  }, []);

  if (!deep) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      // One state path for pointer-events (see StickyCTAChip.tsx): never both
      // none and auto in one class string, because the sort order lets none win.
      className={[
        'fixed right-6 bottom-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-[opacity,background-color] duration-300 hover:bg-primary-dark focus-visible:opacity-100 motion-reduce:transition-none',
        shown ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      <ArrowUp size={18} />
    </button>
  );
}
