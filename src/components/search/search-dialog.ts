// scaffold-file: journal
// Foundation, edit with care
// The site search dialog (2026-09-24, feat/scripture-search). LAZY: nothing in
// this file, its stylesheet or Pagefind is fetched until a visitor opens the
// search. trigger.ts, a few lines in the layout's own script, imports this
// module on the first open (and warm it on hover or focus of a trigger).
//
// WHY A DIALOG AND NOT A /search PAGE. The search is reached from the header
// on every page and from the mobile menu, and a reader who searches mid-sermon
// wants to look something up and come back to where they were, not leave the
// page. A native <dialog> opened with showModal() makes the page behind it
// inert (the focus trap is the browser's own), closes on Escape by itself, and
// costs no page anything until it is opened, because it is built here, on
// demand. A /search route would have cost a round trip and a second copy of
// the chrome for every query.
//
// PAGEFIND. The index is written by scripts/pagefind-index.mjs after
// `astro build`, into dist/client/pagefind/, from the pages that carry
// data-pagefind-body. Its JS API is imported from that URL at run time
// (/* @vite-ignore */: Vite must not try to bundle a file that only exists
// after the build). Pagefind's own UI and its stylesheet are NOT used: the
// rows below are the register's rows, in the site's own inks.
//
// A11Y. The dialog is named by its visible label, the box is a real <input
// type="search"> with a label, the count is announced from a polite live
// region, each result is a heading with one link, and focus goes back to
// whatever opened the search when it closes. ArrowDown from the box moves into
// the results, ArrowUp/ArrowDown move between them, and Enter in the box
// follows the first result.

import css from './search-dialog.css?inline';
import { searchRow, countLabel, type PagefindData } from '@/lib/search-results';

interface PagefindResult {
  id: string;
  data: () => Promise<PagefindData>;
}
interface PagefindSearch {
  results: PagefindResult[];
}
interface PagefindApi {
  options: (o: Record<string, unknown>) => Promise<void>;
  init: () => Promise<void>;
  debouncedSearch: (q: string, o?: object, ms?: number) => Promise<PagefindSearch | null>;
}

const PAGE = 10;
const PAGEFIND_URL = '/pagefind/pagefind.js';

let pagefind: Promise<PagefindApi | null> | null = null;
function loadPagefind(): Promise<PagefindApi | null> {
  pagefind ??= import(/* @vite-ignore */ PAGEFIND_URL)
    .then(async (pf: PagefindApi) => {
      await pf.options({ excerptLength: 24 });
      await pf.init();
      return pf;
    })
    .catch(() => null);
  return pagefind;
}

let styled = false;
function ensureStyle() {
  if (styled && document.getElementById('ss-style')) return;
  const style = document.createElement('style');
  style.id = 'ss-style';
  style.textContent = css;
  document.head.appendChild(style);
  styled = true;
}

/** Wait until any open Radix sheet (the mobile menu) has closed and given its focus back. */
function sheetGone(): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => {
      const open = document.querySelector('[role="dialog"][data-state]');
      if (!open || performance.now() - started > 1500) {
        requestAnimationFrame(() => resolve());
      } else {
        requestAnimationFrame(tick);
      }
    };
    tick();
  });
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

interface Parts {
  dialog: HTMLDialogElement;
  input: HTMLInputElement;
  status: HTMLElement;
  list: HTMLOListElement;
  more: HTMLButtonElement;
}

let parts: Parts | null = null;
let opener: HTMLElement | null = null;
let results: PagefindResult[] = [];
let shown = 0;
let query = '';

function build(): Parts {
  const dialog = el('dialog', {
    id: 'site-search',
    class: 'ss',
    'aria-labelledby': 'ss-title',
  });

  const head = el('div', { class: 'ss-head' });
  const headIn = el('div', { class: 'ss-in' });
  const top = el('div', { class: 'ss-top' });
  top.append(el('h2', { id: 'ss-title', class: 'ss-title' }, 'Search the site'));
  const close = el('button', { type: 'button', class: 'ss-close' }, 'Close ');
  close.append(el('span', { 'aria-hidden': 'true' }, '×'));
  close.addEventListener('click', () => dialog.close());
  top.append(close);

  const form = el('form', { class: 'ss-form', role: 'search' });
  const label = el('label', { for: 'ss-q', class: 'sr-only' }, 'Search sermons, posts and pages');
  const input = el('input', {
    id: 'ss-q',
    class: 'ss-input',
    type: 'search',
    autocomplete: 'off',
    spellcheck: 'false',
    enterkeyhint: 'search',
    placeholder: 'Sermons, passages, pages',
    'aria-describedby': 'ss-status',
  });
  form.append(label, input);
  const status = el('p', { id: 'ss-status', class: 'ss-status', role: 'status' });
  headIn.append(top, form, status);
  head.append(headIn);

  const body = el('div', { class: 'ss-body' });
  const bodyIn = el('div', { class: 'ss-in' });
  const list = el('ol', { class: 'ss-results', 'aria-labelledby': 'ss-title' });
  const more = el('button', { type: 'button', class: 'ss-more', hidden: '' }, 'More results');
  const foot = el('p', { class: 'ss-foot' });
  foot.append(el('a', { href: '/blog/scripture/' }, 'Every passage preached, book by book'));
  bodyIn.append(list, more, foot);
  body.append(bodyIn);

  dialog.append(head, body);
  document.body.append(dialog);

  // ---- Behaviour --------------------------------------------------------------
  input.addEventListener('input', () => void run(input.value));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const first = list.querySelector<HTMLAnchorElement>('a');
    if (first) first.click();
  });
  more.addEventListener('click', () => void showMore(true));
  dialog.addEventListener('keydown', (e) => {
    // Escape closes, always. The dialog's own cancel is not enough: in a
    // non-empty type="search" box, Chromium spends the first Escape clearing
    // the box and the dialog never hears it.
    if (e.key === 'Escape') {
      e.preventDefault();
      dialog.close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...list.querySelectorAll<HTMLAnchorElement>('.ss-h a')];
    if (links.length === 0) return;
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (document.activeElement === input) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        links[0].focus();
      }
      return;
    }
    if (at === -1) return;
    e.preventDefault();
    if (e.key === 'ArrowDown') links[Math.min(at + 1, links.length - 1)].focus();
    else if (at === 0) input.focus();
    else links[at - 1].focus();
  });
  // Following a result: close first, so the page behind is not inert while the
  // router swaps it. The link itself does the navigating.
  list.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    release();
    const back = opener;
    opener = null;
    if (back && back.isConnected) back.focus();
  });

  return { dialog, input, status, list, more };
}

/**
 * The excerpt as DOM: text, and <mark> around the match, and nothing else.
 * Parsed inertly (DOMParser runs no script and loads nothing) and rebuilt node
 * by node, so no markup from the index reaches the page as markup.
 */
function excerptNode(html: string): HTMLParagraphElement {
  const p = el('p', { class: 'ss-ex' });
  const doc = new DOMParser().parseFromString(`<p>${html}</p>`, 'text/html');
  for (const n of Array.from(doc.body.firstElementChild?.childNodes ?? [])) {
    if (n.nodeName === 'MARK') p.append(el('mark', {}, n.textContent ?? ''));
    else p.append(document.createTextNode(n.textContent ?? ''));
  }
  return p;
}

function rowOf(data: PagefindData): HTMLLIElement {
  const r = searchRow(data);
  const li = el('li', { class: 'ss-row' });
  li.append(el('span', { class: 'ss-date' }, r.date));
  const main = el('div', { class: 'ss-main' });
  const h = el('h3', { class: 'ss-h' });
  h.append(el('a', { href: r.href }, r.title));
  main.append(h);
  if (r.excerptHtml) main.append(excerptNode(r.excerptHtml));
  li.append(main);
  if (r.reading) li.append(el('p', { class: 'ss-read' }, r.reading));
  return li;
}

async function showMore(focusFirstNew = false) {
  if (!parts) return;
  const next = results.slice(shown, shown + PAGE);
  const q = query;
  const data = await Promise.all(next.map((r) => r.data()));
  if (q !== query || !parts) return;
  const rows = data.map(rowOf);
  parts.list.append(...rows);
  shown += next.length;
  parts.more.hidden = shown >= results.length;
  if (focusFirstNew) rows[0]?.querySelector('a')?.focus();
}

async function run(value: string) {
  if (!parts) return;
  query = value.trim();
  const q = query;
  if (!q) {
    results = [];
    shown = 0;
    parts.list.replaceChildren();
    parts.more.hidden = true;
    parts.status.textContent = '';
    return;
  }
  const pf = await loadPagefind();
  if (!parts || q !== query) return;
  if (!pf) {
    parts.status.textContent = 'Search is not available right now.';
    return;
  }
  const search = await pf.debouncedSearch(q, {}, 180);
  // null: a newer keystroke superseded this search.
  if (!search || !parts || q !== query) return;
  results = search.results;
  shown = 0;
  parts.list.replaceChildren();
  parts.status.textContent = countLabel(results.length, q);
  await showMore();
}

/** Give the page its scroll back: the html lock (`html.ss-open`) off. */
function release() {
  document.documentElement.classList.remove('ss-open');
}

// A router navigation while the search is open (Back, Forward, a link the
// dialog's own click handler did not see) swaps <body> and the dialog with it,
// so its `close` event never fires. When the scroll lock was Lenis, that left
// Lenis stopped on the next page and the wheel dead until a reload (2026-09-24,
// found on the live site; Lenis was removed the same day). The lock is only
// html.ss-open now, and the swap replaces <html>'s classes anyway, but close
// and release before the swap regardless, unconditionally, since `close` is
// dispatched as a task and can land after the new page has loaded.
document.addEventListener('astro:before-swap', () => {
  if (parts?.dialog.open) parts.dialog.close();
  release();
});

/** Open the search. `from` gets the focus back when it closes. */
export async function openSearch(from?: HTMLElement | null): Promise<void> {
  await sheetGone();
  ensureStyle();
  if (!parts || !parts.dialog.isConnected) {
    // A View Transitions navigation swaps <body>, and the dialog with it.
    parts = build();
    results = [];
    shown = 0;
    query = '';
  }
  if (parts.dialog.open) return;
  opener = from ?? (document.activeElement as HTMLElement | null);
  document.documentElement.classList.add('ss-open');
  parts.dialog.showModal();
  parts.input.focus();
  parts.input.select();
  // Start fetching the index while the visitor types.
  void loadPagefind();
}

/** Warm the index on intent (hover or focus on a trigger), without opening. */
export function warm(): void {
  void loadPagefind();
}
