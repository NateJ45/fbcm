// Safe to edit by hand
// Gate: every name a Help guide tells the church secretary to click or fill in
// is a name the Studio really shows.
//
// The guides (src/sanity/guides/content.ts) mark a thing you click or a box you
// fill in with `backticks`. When a field, a desk item or a button is renamed
// and its guide is not, the guide sends the secretary looking for a box that
// no longer exists, and nothing else notices: the Studio audit of 2026-09-26
// renamed dozens of titles in one pass, which is why this gate exists.
//
// A backticked name passes when it is:
//   - a `title` or `label` written in the Studio's own source (schemas, desk
//     structure, document actions), exactly, or with its " (optional)" /
//     " (...)" tail left off (the guides say `Info` for "Info (quiet, for
//     everyday news)");
//   - a placeholder in curly brackets, which the church-links and
//     settings-placeholders gates cover;
//   - one of the Studio's own built-in words (Publish, Upload, ...) or a word
//     from Church Trac's screens, listed below.
// src/lib/studio-guides.test.ts is the structural half of the same promise.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { guides } from '../sanity/guides/content.ts';

const ROOT = join(import.meta.dirname, '..', '..');

/** Sanity's own buttons, menus and tools, which no file here defines. */
const SANITY_UI = new Set([
  'Publish',
  'Presentation',
  'Media',
  'Upload',
  'Select',
  'Generate',
  'Add item',
  'Add item...',
  'Add item before...',
  'Add item after...',
  'Remove',
  'Delete',
  'Add filter',
  'Remove field',
  '...',
  '+',
]);

/** Words on Church Trac's own screens, quoted in the Church Trac forms guide. */
const CHURCH_TRAC_UI = new Set([
  'Church Connect',
  'Cards',
  'Form',
  'Form/Giving Embed Domain',
  'Embed Form',
  'Notify User',
  'Connect Setup',
  'Online Giving',
  '<iframe',
]);

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? files(join(dir, e.name), ext)
      : ext.test(e.name)
        ? [join(ROOT, dir, e.name)]
        : [],
  );
}

/** Every quoted string on a `title:` / `label:` / `.title(` line of the Studio source. */
function studioNames(): Set<string> {
  const sources = [
    ...files('src/sanity', /\.(ts|tsx)$/).filter((f) => !f.includes(`${join('sanity', 'guides')}`)),
    join(ROOT, 'sanity.config.ts'),
  ];
  const names = new Set<string>();
  const line = /(?:\btitle:|\blabel:|\.title\(|\btext=)[^\n]*/g;
  const quoted = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
  for (const file of sources) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(line)) {
      for (const q of m[0].matchAll(quoted)) {
        names.add((q[1] ?? q[2] ?? '').replace(/\\(.)/g, '$1'));
      }
    }
  }
  return names;
}

/** Every `backticked` name in every guide, with the guide it came from. */
function guideNames(): Array<{ slug: string; name: string }> {
  const out: Array<{ slug: string; name: string }> = [];
  for (const g of guides) {
    const text = g.body
      .flatMap((b) => ('text' in b ? [b.text, 'title' in b ? (b.title ?? '') : ''] : b.items))
      .join('\n');
    for (const m of text.matchAll(/`([^`]+)`/g)) out.push({ slug: g.slug, name: m[1] });
  }
  return out;
}

describe('Studio guide names', () => {
  const names = studioNames();
  const known = (name: string): boolean => {
    if (SANITY_UI.has(name) || CHURCH_TRAC_UI.has(name)) return true;
    if (/^\{[a-z -]+\}$/.test(name)) return true;
    if (names.has(name)) return true;
    // `Dates` for "Dates (optional)", `Info` for "Info (quiet, ...)".
    for (const n of names) if (n.startsWith(`${name} (`)) return true;
    return false;
  };

  it('reads a real list of Studio names', () => {
    // Guards the gate itself: a broken regex would pass every guide.
    assert.ok(names.has('Site settings'), 'the desk title "Site settings" was not found');
    assert.ok(
      names.has('Describe the photo'),
      'the field title "Describe the photo" was not found',
    );
    assert.ok(names.size > 200, `only ${names.size} names found`);
  });

  it('every backticked name in a guide exists in the Studio', () => {
    const missing = guideNames().filter((g) => !known(g.name));
    assert.deepEqual(
      missing.map((m) => `${m.slug}: \`${m.name}\``),
      [],
      'a guide names something the Studio does not show; rename it to match the Studio',
    );
  });
});
