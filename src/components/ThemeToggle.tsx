// Foundation, edit with care
// Three-state theme toggle: light → dark → system. Persists to
// localStorage (key from site.themeStorageKey). Anti-FOUC script in BaseLayout
// applies the resolved class on initial paint; this component only
// handles cycling and runtime re-application.

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { site } from '@/data/site';

type Theme = 'light' | 'dark' | 'system';
const KEY = site.themeStorageKey;
const ORDER: Theme[] = ['light', 'dark', 'system'];

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  // Keep theme-aware images (header logo) in sync. The light/dark srcs are
  // pre-rendered by Astro at build time and stored on each img as data
  // attributes; we swap them here so toggling the theme doesn't leave a
  // light logo on a dark background (or vice versa).
  const imgs = document.querySelectorAll<HTMLImageElement>('img[data-theme-logo]');
  imgs.forEach((img) => {
    const nextSrc = dark ? img.dataset.logoDarkSrc : img.dataset.logoLightSrc;
    const nextSrcset = dark ? img.dataset.logoDarkSrcset : img.dataset.logoLightSrcset;
    if (nextSrc && img.src !== nextSrc) img.src = nextSrc;
    if (nextSrcset && img.srcset !== nextSrcset) img.srcset = nextSrcset;
  });
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? 'system';
    setTheme(stored);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if ((localStorage.getItem(KEY) ?? 'system') === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);

    // THE PAGE CARRIES MORE THAN ONE OF THESE. Since plan 3 the control sits
    // both at the end of the header row and in the footer's base rail, and each
    // instance holds its own copy of the theme in React state. Without this the
    // one you did not click keeps drawing the previous icon until the next page
    // load: the applied theme is right (both read and write the same
    // localStorage key), but the two icons disagree, which reads as a bug.
    //
    // `theme:change` is our own event, fired by cycle() below, and covers the
    // instances on THIS page. `storage` is the browser's, fires only in OTHER
    // tabs, and covers the same site open twice. Neither re-applies the theme,
    // because whoever fired it already did; they only sync the icon.
    const onThemeChange = (e: Event) => {
      const next = (e as CustomEvent<{ theme: Theme }>).detail?.theme;
      if (next) setTheme(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const next = (e.newValue as Theme | null) ?? 'system';
      setTheme(next);
      applyTheme(next);
    };
    window.addEventListener('theme:change', onThemeChange);
    window.addEventListener('storage', onStorage);

    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('theme:change', onThemeChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    localStorage.setItem(KEY, next);
    applyTheme(next);
    // Tell every other instance on the page. The listener above only sets
    // state, so this cannot loop.
    window.dispatchEvent(new CustomEvent('theme:change', { detail: { theme: next } }));
  };

  const label =
    theme === 'light'
      ? 'Switch to dark mode'
      : theme === 'dark'
        ? 'Switch to system theme'
        : 'Switch to light mode';

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
    >
      {theme === 'light' && <Sun size={18} />}
      {theme === 'dark' && <Moon size={18} />}
      {theme === 'system' && <Monitor size={18} />}
    </button>
  );
}
