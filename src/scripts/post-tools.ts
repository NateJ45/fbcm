// scaffold-file: journal
// Safe to edit by hand
// The post tools' bootstrap (2026-09-24, feat/scripture-text): the only part
// of Listen, Share and Add to calendar that loads with the page, kept small
// (the budget is 2 KB). It shows a tool only when the browser can do it, and
// imports the heavier parts on first use:
//   ./read-aloud  the Web Speech reader, on the first press of Listen
//   ./fums        API.Bible's view tracker, the first time an NIV passage
//                 is opened (only a build with API_BIBLE_KEY emits data-fums)
// Bound on astro:page-load (the router fires it on the first load and after
// every swap), and speech stops on astro:before-swap.

const ZONE = 'America/Indiana/Indianapolis';

function init() {
  const row = document.querySelector<HTMLElement>('[data-post-tools]');
  if (!row || row.dataset.bound) return;
  row.dataset.bound = '1';
  const status = row.querySelector<HTMLElement>('.p2-tool-status');
  let clear = 0;
  const say = (text: string) => {
    if (!status) return;
    status.textContent = text;
    clearTimeout(clear);
    clear = window.setTimeout(() => (status.textContent = ''), 5000);
  };

  // Add to calendar: a Sunday that has passed on the church's calendar is not
  // worth adding. The link is plain HTML; this only hides it.
  const cal = row.querySelector<HTMLAnchorElement>('[data-until]');
  if (cal?.dataset.until) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(new Date());
    if (today > cal.dataset.until) cal.hidden = true;
  }

  // Share: the system sheet where there is one, else copy the link.
  const share = row.querySelector<HTMLButtonElement>('[data-share]');
  const canShare = typeof navigator.share === 'function';
  const canCopy = typeof navigator.clipboard?.writeText === 'function';
  if (share && (canShare || canCopy)) {
    share.hidden = false;
    share.addEventListener('click', async () => {
      const url =
        document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || location.href;
      const title = document.querySelector('h1')?.textContent?.trim() || document.title;
      if (canShare) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        say('Link copied');
      } catch {
        say('Copy the link from the address bar');
      }
    });
  }

  // Read aloud: only where the browser can speak.
  const listen = row.querySelector<HTMLButtonElement>('[data-listen]');
  const stop = row.querySelector<HTMLButtonElement>('[data-listen-stop]');
  if (
    listen &&
    stop &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function'
  ) {
    listen.hidden = false;
    listen.addEventListener('click', () =>
      import('./read-aloud').then((m) => m.toggle(listen, stop)),
    );
    stop.addEventListener('click', () => import('./read-aloud').then((m) => m.stop()));
  }

  // FUMS, for a passage served through API.Bible.
  for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-fums]')) {
    d.addEventListener(
      'toggle',
      () => d.open && import('./fums').then((m) => m.track(d.dataset.fums ?? '')),
    );
  }
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  window.speechSynthesis?.cancel();
});
