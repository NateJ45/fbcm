// Safe to edit by hand
// The church's page templates and saved sections (src/sanity/pageTemplates.ts,
// src/sanity/sectionPatterns.ts; the authoring kit, PORTS.md card 109).
// authoring.test.ts (from the starter) checks blocks, keys and the example
// marker for the templates; this adds what is the church's own: the menu
// groups, the saved sections, the copy rules, and the page rules in
// src/sanity/kit.config.ts (read from its source: that file imports the
// Studio, which node --test cannot load).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freshKeys, hasExampleText } from './authoring.ts';
import { pageWarnings, type PageRules } from './page-guardrails.ts';
import { PAGE_TEMPLATES, TEMPLATE_GROUPS, templateMenuTitle } from '../sanity/pageTemplates.ts';
import { SECTION_PATTERNS } from '../sanity/sectionPatterns.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

/** Block type names declared in a schema library file. */
const declaredTypes = (file: string) =>
  [
    ...read(`../sanity/schemaTypes/${file}`).matchAll(/defineType\(\{\s*name:\s*'([A-Za-z]+)'/g),
  ].map((m) => m[1]);

/** The string list after `marker` in a source file, e.g. `mustStartWith: [...]`. */
function listIn(path: string, marker: string): string[] {
  const src = read(path);
  const at = src.indexOf(marker);
  assert.ok(at >= 0, `${marker} not found in ${path}`);
  const body = src.slice(at, src.indexOf(']', at));
  return [...body.matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]);
}

const KIT = '../sanity/kit.config.ts';
const RULES: PageRules = {
  appliesTo: ['page'],
  mustStartWith: listIn(KIT, 'mustStartWith:'),
  atMostOnce: listIn(KIT, 'atMostOnce:'),
  maxSections: 24,
};
const CHECKS = {
  selfFillingSections: listIn('../sanity/pageBuilderConfig.ts', 'const SELF_FILLING_SECTIONS'),
  extraSettingKeys: ['imageSide', 'surface'],
};

function stringsIn(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => stringsIn(v, out));
  else if (value && typeof value === 'object')
    Object.values(value).forEach((v) => stringsIn(v, out));
  return out;
}

const BANNED = /\b(delve|leverage|robust|seamless|tapestry|navigate|elevate|unlock)\b/i;
function checkCopy(id: string, text: string) {
  assert.ok(!text.includes('—'), `${id}: em-dash in "${text}"`);
  assert.ok(!text.includes(' -- '), `${id}: double hyphen in "${text}"`);
  assert.ok(!BANNED.test(text), `${id}: AI-tell word in "${text}"`);
  assert.ok(!/\$\d/.test(text), `${id}: a price in "${text}"`);
}

/** Every key anywhere in a value. */
function keysIn(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => keysIn(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === '_key' && typeof v === 'string') out.push(v);
      else keysIn(v, out);
    }
  }
  return out;
}

describe('the template menu', () => {
  it('every template sits in a known group, in group order, each group used', () => {
    const order = PAGE_TEMPLATES.map((t) => TEMPLATE_GROUPS.indexOf(t.group));
    assert.ok(!order.includes(-1), 'a template names a group not in TEMPLATE_GROUPS');
    assert.deepEqual(
      order,
      [...order].sort((a, b) => a - b),
      'keep templates in group order',
    );
    for (const g of TEMPLATE_GROUPS)
      assert.ok(
        PAGE_TEMPLATES.some((t) => t.group === g),
        g,
      );
    const menu = PAGE_TEMPLATES.map(templateMenuTitle);
    assert.equal(new Set(menu).size, menu.length, 'two templates read the same in the menu');
  });

  for (const t of PAGE_TEMPLATES) {
    it(`${t.id}: copy rules and the church's page rules`, () => {
      for (const text of [t.title, t.description, ...stringsIn(t.sections())])
        checkCopy(t.id, text);
      const sections = t.sections();
      if (!sections.length) return;
      for (const w of pageWarnings(sections, 'page', RULES, CHECKS)) {
        assert.match(w.message, /example text/i, `${t.id}: ${w.message}`);
      }
    });
  }
});

describe('the saved sections (sectionPatterns.ts)', () => {
  // A saved section takes the library and the rich blocks, never a synced section.
  const allowed = new Set(
    [
      ...declaredTypes('sections.ts'),
      ...declaredTypes('richSections.ts'),
      ...declaredTypes('churchSections.ts'),
    ].filter((t) => t !== 'syncedSection'),
  );

  it('has unique ids and between one and twelve sections each', () => {
    const ids = SECTION_PATTERNS.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const p of SECTION_PATTERNS) {
      const n = p.sections().length;
      assert.ok(n >= 1 && n <= 12, `${p.id} holds ${n} sections`);
    }
  });

  for (const p of SECTION_PATTERNS) {
    it(`${p.id}: blocks, keys, example text and copy`, () => {
      const sections = p.sections();
      for (const s of sections) assert.ok(allowed.has(String(s._type)), `${p.id}: ${s._type}`);
      const keys = keysIn(sections);
      assert.equal(new Set(keys).size, keys.length, `${p.id}: duplicate keys`);
      assert.equal(keys.length, keysIn(freshKeys(sections)).length);
      assert.ok(hasExampleText(sections), `${p.id} has no example marker`);
      for (const text of [p.title, p.note, ...stringsIn(sections)]) checkCopy(p.id, text);
      for (const w of pageWarnings(sections, 'sectionPreset', RULES, CHECKS)) {
        assert.match(w.message, /example text/i, `${p.id}: ${w.message}`);
      }
    });
  }
});
