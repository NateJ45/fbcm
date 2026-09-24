// scaffold-file: journal
// Safe to edit by hand
// "Listen to this post" (2026-09-24, feat/scripture-text): the Web Speech API
// reads the title, then the body, and nothing else (no header, facts, tags,
// foot or closed passage). Loaded by src/scripts/post-tools.ts on the first
// press of Listen, so a reader who never presses it downloads none of this.
//
// One utterance per paragraph, queued: Chrome stops a single long utterance
// after about fifteen seconds, and paragraph-sized pieces also let pause and
// resume land on a sentence boundary the listener can follow.
//
// aria-pressed on Listen says whether it is speaking; Stop appears once it has
// started. Navigating away cancels it (post-tools.ts, astro:before-swap).

let listenBtn: HTMLButtonElement | null = null;
let stopBtn: HTMLButtonElement | null = null;
let started = false;

/** The words to read: the h1, then the body's text blocks, in order. */
function chunks(): string[] {
  const out: string[] = [];
  const title = document.querySelector('.p2-title')?.textContent?.trim();
  if (title) out.push(title);
  const body = document.querySelector('.p2-body .post-prose');
  if (!body) return out;
  const blocks = body.querySelectorAll<HTMLElement>(
    'p, li, h2, h3, h4, blockquote, figcaption, th, td',
  );
  for (const el of blocks) {
    // Not the closed passage (a reader opens it to hear it), not a block
    // inside another block that is read whole.
    if (el.closest('details:not([open])')) continue;
    const parent = el.parentElement?.closest('p, li, blockquote, td, th');
    if (parent && body.contains(parent)) continue;
    // textContent, not innerText: innerText applies text-transform, and the
    // reading's header would be spoken as capitals. Verse numbers are skipped.
    let text: string;
    if (el.matches('.pp-lection-h')) {
      text = [...el.children].map((c) => c.textContent?.trim()).join(': ');
    } else {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('sup.pp-v').forEach((s) => s.remove());
      text = copy.textContent ?? '';
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (text) out.push(text);
  }
  return out;
}

/** A natural English voice when the device has one; the default otherwise. */
async function voice(): Promise<SpeechSynthesisVoice | null> {
  let voices = speechSynthesis.getVoices();
  if (!voices.length) {
    await new Promise<void>((r) => {
      speechSynthesis.addEventListener('voiceschanged', () => r(), { once: true });
      setTimeout(r, 800);
    });
    voices = speechSynthesis.getVoices();
  }
  const lang = document.documentElement.lang || 'en';
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase().startsWith(lang.slice(0, 2)) ? 10 : 0) +
    (/natural|neural|premium|enhanced/i.test(v.name) ? 4 : 0) +
    (/google|samantha|daniel|aria|jenny|guy/i.test(v.name) ? 2 : 0) +
    (v.lang === 'en-US' ? 1 : 0) +
    (v.default ? 0.5 : 0);
  const best = [...voices].sort((a, b) => score(b) - score(a))[0];
  return best && score(best) >= 10 ? best : null;
}

function set(pressed: boolean) {
  listenBtn?.setAttribute('aria-pressed', String(pressed));
  if (stopBtn) stopBtn.hidden = !started;
}

async function start() {
  const v = await voice();
  const parts = chunks();
  started = true;
  parts.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    if (v) u.voice = v;
    u.lang = v?.lang ?? document.documentElement.lang ?? 'en';
    if (i === parts.length - 1) u.onend = () => stop();
    speechSynthesis.speak(u);
  });
  set(true);
}

/** Listen pressed: start, pause or resume. */
export function toggle(listen: HTMLButtonElement, stopButton: HTMLButtonElement): void {
  listenBtn = listen;
  stopBtn = stopButton;
  if (!started) {
    speechSynthesis.cancel();
    void start();
  } else if (speechSynthesis.paused) {
    speechSynthesis.resume();
    set(true);
  } else {
    speechSynthesis.pause();
    set(false);
  }
}

/** Stop pressed, the reading finished, or the page is going. */
export function stop(): void {
  started = false;
  speechSynthesis.cancel();
  set(false);
  listenBtn?.focus();
}
