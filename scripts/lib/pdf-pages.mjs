// scripts/lib/pdf-pages.mjs
//
// The one place pdfjs is driven from Node (2026-09-24, feat/the-visitor): open
// a PDF from its bytes, read a page's text, draw page 1 to a PNG. Used by the
// build step that draws The Visitor's covers and reads its text for the search
// (scripts/visitor-covers.mjs) and by the seed module that dates each issue
// from its masthead (scripts/pages/visitor.mjs). Build and scripts only:
// pdfjs-dist and @napi-rs/canvas are devDependencies and never reach a page.
//
// WHY @napi-rs/canvas. pdfjs draws through a CanvasRenderingContext2D. In the
// browser that is the page's canvas; in Node, pdfjs-dist's own canvas factory
// loads @napi-rs/canvas (its optional dependency), which is Skia behind N-API
// with PREBUILT binaries per platform (win32-x64-msvc here, linux-x64-gnu on
// CI): no compiler, no system Cairo, unlike node-canvas. pdfjs has no pure-WASM
// canvas backend, so a native one is the smallest thing that renders. Text
// extraction needs no canvas at all.
//
// Loaded lazily, so a script that never draws never pays for either.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pdfjsDir = resolve(root, 'node_modules', 'pdfjs-dist');
// In Node pdfjs reads these from disk; plain paths with forward slashes and a
// trailing slash are what it was run with on Windows and Linux.
const asDir = (p) => `${p.split('\\').join('/')}/`;

let pdfjsPromise = null;
function pdfjs() {
  pdfjsPromise ??= import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsPromise;
}

/**
 * Open a PDF from its bytes, hand the document to `fn`, and always tear the
 * loading task down after (pdfjs keeps a worker-side copy of every document
 * until its task is destroyed; forty issues would otherwise all stay in
 * memory).
 */
export async function withPdf(bytes, fn) {
  const task = await loadingTask(bytes);
  try {
    return await fn(await task.promise);
  } finally {
    await task.destroy();
  }
}

async function loadingTask(bytes) {
  const lib = await pdfjs();
  const task = lib.getDocument({
    // pdfjs takes ownership of (and detaches) the array it is given, so it
    // gets a copy and the caller keeps its buffer.
    data: new Uint8Array(bytes),
    standardFontDataUrl: asDir(resolve(pdfjsDir, 'standard_fonts')),
    cMapUrl: asDir(resolve(pdfjsDir, 'cmaps')),
    cMapPacked: true,
    wasmUrl: asDir(resolve(pdfjsDir, 'wasm')),
    iccUrl: asDir(resolve(pdfjsDir, 'iccs')),
    isEvalSupported: false,
    verbosity: 0,
  });
  return task;
}

/**
 * A page's text as a visitor would read it: items joined by spaces, a line
 * break where pdfjs marks the end of a line, and a word hyphenated across a
 * line end ("strug-\ngling") joined back together.
 */
export async function pageText(doc, pageNumber) {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  let out = '';
  for (const item of content.items) {
    if (typeof item.str !== 'string') continue;
    out += item.str;
    out += item.hasEOL ? '\n' : ' ';
  }
  page.cleanup();
  return out
    .replace(/([a-z])-\s*\n\s*([a-z])/g, '$1$2')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** Every page's text, joined by blank lines. */
export async function documentText(doc) {
  const pages = [];
  for (let i = 1; i <= doc.numPages; i += 1) pages.push(await pageText(doc, i));
  return pages.join('\n\n');
}

/**
 * Page 1 drawn `width` pixels wide, as a PNG buffer, plus the page's own
 * proportions (in PDF points) so a cover can reserve its box before it loads.
 */
export async function coverPng(doc, width) {
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const { canvas, context } = doc.canvasFactory.create(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  // White first: a PDF page with no background of its own would otherwise
  // come out transparent, and a transparent cover on the indigo band is black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  const png = canvas.toBuffer('image/png');
  page.cleanup();
  return { png, pageWidth: base.width, pageHeight: base.height };
}
