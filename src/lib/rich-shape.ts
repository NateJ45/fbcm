// Safe to edit by hand
// The Ledger: a rich-text body is laid out from its OWN shape, never from a
// field (design research note section 7; the approved prototype is
// docs/superpowers/prototypes/2026-09-22-richtext-and-photos/richtext/). Pure
// and build-time: every measure runs on cleaned text (span-split.ts), so the
// preview renders the same branch as the live site.
import {
  blockText,
  wordCount,
  sharedPrefix,
  pipedSplit,
  runInSplit,
  splitBlockText,
  type PtBlock,
} from './span-split.ts';
import { splitStega } from './preview-stega.ts';

export type RichShape = 'row' | 'columns' | 'sections' | 'register' | 'ledger' | 'prose';
export interface RichPara {
  block: PtBlock;
  label: string | null;
}
export type RichPiece =
  | { kind: 'lede'; block: PtBlock }
  | { kind: 'standfirst'; block: PtBlock }
  | { kind: 'leadin'; block: PtBlock }
  | { kind: 'measure' | 'run2' | 'run3'; paras: RichPara[] }
  | { kind: 'table'; rows: { name: string | null; tail: PtBlock }[] }
  | { kind: 'labelled'; rows: { label: PtBlock; body: PtBlock[] }[] }
  | { kind: 'said'; prefix: string; hang: boolean; items: PtBlock[] }
  | { kind: 'triad'; prefix: string; items: PtBlock[] }
  | { kind: 'index' | 'plain'; items: PtBlock[] }
  | { kind: 'section'; head: PtBlock; pieces: RichPiece[] }
  | {
      kind: 'columns';
      level: 'h3' | 'h4';
      across: number;
      flush: boolean;
      groups: { head: PtBlock; big: boolean; pieces: RichPiece[] }[];
    }
  | { kind: 'register'; left: RichPiece[][]; right: RichPiece[][] }
  | { kind: 'foot'; block: PtBlock };
export interface RichLayout {
  shape: RichShape;
  continuation: boolean;
  pieces: RichPiece[];
  rowLong?: boolean;
}

type Seg =
  | { kind: 'p'; b: PtBlock }
  | { kind: 'h3'; b: PtBlock }
  | { kind: 'h4'; b: PtBlock }
  | { kind: 'list'; items: PtBlock[] };
interface Ctx {
  runIn: boolean;
  narrow: boolean;
  wide: boolean;
}

const text = (b: PtBlock) => blockText(b).trim();
const wordsOf = (b: PtBlock) => wordCount(blockText(b));
const segWords = (s: Seg) =>
  s.kind === 'list' ? s.items.reduce((n, i) => n + wordsOf(i), 0) : wordsOf(s.b);
const endsSentence = (b: PtBlock) => /[.!?:]["”’)]?$/.test(text(b));
const endsColon = (b: PtBlock) => /:\s*["”’]?$/.test(text(b));
const across = (n: number) => (n <= 4 ? n : n % 3 === 0 ? 3 : 4);

function segments(body: PtBlock[]): Seg[] {
  const segs: Seg[] = [];
  for (const b of body) {
    if (b?._type !== 'block') continue;
    if (b.listItem) {
      const last = segs.at(-1);
      if (last && last.kind === 'list') last.items.push(b);
      else segs.push({ kind: 'list', items: [b] });
    } else if (b.style === 'h3') segs.push({ kind: 'h3', b });
    else if (b.style === 'h4') segs.push({ kind: 'h4', b });
    else if (text(b)) segs.push({ kind: 'p', b });
  }
  return segs;
}

function groupsAt(segs: Seg[], level: 'h3' | 'h4') {
  const intro: Seg[] = [];
  const groups: { head: PtBlock; body: Seg[] }[] = [];
  for (const s of segs) {
    if (s.kind === level) groups.push({ head: (s as { b: PtBlock }).b, body: [] });
    else if (groups.length) groups[groups.length - 1].body.push(s);
    else intro.push(s);
  }
  return { intro, groups };
}

/** One lede rule for both components (RichTextSection and ImageText). */
export function isLedeParagraph(
  b: PtBlock | undefined,
  runLength: number,
  remaining: number,
): boolean {
  if (!b || b.listItem || (b.style ?? 'normal') !== 'normal') return false;
  const w = wordsOf(b);
  return w >= 8 && w <= 40 && endsSentence(b) && remaining > 0 && runLength !== 2;
}

function listPiece(items: PtBlock[]): RichPiece {
  const texts = items.map(text);
  const piped = items.filter((i) => text(i).includes(' | ')).length;
  const short = texts.every((t) => wordCount(t) <= 6);
  if (piped > 0 && piped >= items.length / 2) {
    return {
      kind: 'table',
      rows: items.map((i) => {
        const s = pipedSplit(i);
        return s ? { name: s.name, tail: s.tail } : { name: null, tail: i };
      }),
    };
  }
  const prefix = sharedPrefix(texts);
  const prefixWords = prefix ? prefix.split(' ').length : 0;
  if (prefix && (items.length >= 3 || prefixWords >= 2)) {
    const tails = items.map(
      (i) => splitBlockText(i, prefix.length, prefix.length + 1)?.tail ?? null,
    );
    if (tails.every((t): t is PtBlock => t !== null)) {
      if (short) return { kind: 'triad', prefix, items: tails };
      return { kind: 'said', prefix, hang: prefix.length <= 6, items: tails };
    }
  }
  if (short && items.length <= 4) return { kind: 'triad', prefix: '', items };
  if (short) return { kind: 'index', items };
  return { kind: 'plain', items };
}

function para(b: PtBlock, ctx: Ctx): RichPara {
  if (ctx.runIn) {
    const r = runInSplit(b);
    if (r) return { block: r.tail, label: r.label };
  }
  return { block: b, label: null };
}

function proseRun(run: PtBlock[], ctx: Ctx): RichPiece[] {
  if (!run.length) return [];
  const T = run.reduce((n, b) => n + wordsOf(b), 0);
  const paras = run.map((b) => para(b, ctx));
  if (ctx.narrow || T <= 60 || (run.length === 1 && T <= 110)) return [{ kind: 'measure', paras }];
  const kind = Math.ceil(T / 150) >= 3 ? 'run3' : 'run2';
  const sets: RichPara[][] = [];
  let cur: RichPara[] = [];
  let cw = 0;
  for (const x of paras) {
    const w = wordsOf(x.block);
    if (cw + w > 600 && cur.length) {
      sets.push(cur);
      cur = [];
      cw = 0;
    }
    cur.push(x);
    cw += w;
  }
  if (cur.length) sets.push(cur);
  return sets.map((s) => ({ kind, paras: s }));
}

// WIDE (opt-in; ImageText passes it only for a photo GROUND). The prototype's
// ground flow (photos/index.html, flow(body, { wide: true })) has two rules the
// Ledger lacks. A LABEL is a paragraph of five words or fewer with no terminal
// punctuation; followed by a paragraph that is not a label, it opens a
// labelled row whose description is every paragraph up to the next label
// ("Nursery Care (104)" beside its own text, never beside another room's). A
// run of two or more paragraphs up to 180 words is a two-column set; anything
// else is one measure. Cleaned text only (wordsOf, text).
const isLabel = (b: PtBlock | undefined) =>
  !!b && wordsOf(b) <= 5 && !/[.!?:,;]["”’]?$/.test(text(b));

function wideRun(run: PtBlock[], ctx: Ctx): RichPiece[] {
  const labelAt = (i: number) => isLabel(run[i]) && i + 1 < run.length && !isLabel(run[i + 1]);
  const out: RichPiece[] = [];
  let i = 0;
  while (i < run.length) {
    if (labelAt(i)) {
      const rows: { label: PtBlock; body: PtBlock[] }[] = [];
      while (i < run.length && labelAt(i)) {
        const label = run[i++];
        const body: PtBlock[] = [];
        while (i < run.length && !labelAt(i)) body.push(run[i++]);
        rows.push({ label, body });
      }
      out.push({ kind: 'labelled', rows });
    } else {
      const prose: PtBlock[] = [];
      while (i < run.length && !labelAt(i)) prose.push(run[i++]);
      const T = prose.reduce((n, b) => n + wordsOf(b), 0);
      const paras = prose.map((b) => para(b, ctx));
      out.push({ kind: prose.length >= 2 && T <= 180 ? 'run2' : 'measure', paras });
    }
  }
  return out;
}

function flow(
  segs: Seg[],
  ctx: Ctx,
  o: { allowLede: boolean; standfirst: boolean; inSection: boolean; after?: number },
): RichPiece[] {
  const out: RichPiece[] = [];
  let i = 0;
  let allowLede = o.allowLede;
  let standfirst = o.standfirst;
  while (i < segs.length) {
    const s = segs[i];
    if (s.kind === 'p') {
      const run: PtBlock[] = [];
      while (i < segs.length && segs[i].kind === 'p') run.push((segs[i++] as { b: PtBlock }).b);
      const nextIsList = segs[i]?.kind === 'list';
      // `after` counts what follows these segments in the band (the h3 groups
      // after an intro), so an intro paragraph with sections below it can lede.
      const remaining = segs.length - i + run.length - 1 + (o.after ?? 0);
      if (allowLede && isLedeParagraph(run[0], run.length, remaining))
        out.push({ kind: 'lede', block: run.shift()! });
      if (standfirst && run.length >= 2 && wordsOf(run[0]) <= 30)
        out.push({ kind: 'standfirst', block: run.shift()! });
      standfirst = false;
      let leadin: PtBlock | null = null;
      const last = run.at(-1);
      if (last && nextIsList && endsColon(last) && wordsOf(last) <= 25) leadin = run.pop()!;
      out.push(...(ctx.wide && !ctx.narrow ? wideRun(run, ctx) : proseRun(run, ctx)));
      if (leadin) out.push({ kind: 'leadin', block: leadin });
    } else if (s.kind === 'list') {
      out.push(listPiece(s.items));
      i++;
    } else if (s.kind === 'h4') {
      const opensSection = i === 0 && o.inSection;
      const groups: { head: PtBlock; body: Seg[] }[] = [];
      while (i < segs.length && segs[i].kind !== 'h3' && (segs[i].kind === 'h4' || groups.length)) {
        const x = segs[i++];
        if (x.kind === 'h4') groups.push({ head: x.b, body: [] });
        else groups[groups.length - 1].body.push(x);
      }
      out.push(columnsPiece(groups, 'h4', ctx, opensSection, false));
    } else i++;
    allowLede = false;
  }
  return out;
}

function columnsPiece(
  groups: { head: PtBlock; body: Seg[] }[],
  level: 'h3' | 'h4',
  ctx: Ctx,
  flush: boolean,
  sf: boolean,
): RichPiece {
  const n = ctx.narrow ? 1 : Math.min(across(groups.length), level === 'h4' ? 3 : 4);
  return {
    kind: 'columns',
    level,
    across: n,
    flush,
    groups: groups.map((g) => ({
      head: g.head,
      big: level === 'h3' && g.body.reduce((a, s) => a + segWords(s), 0) <= 40,
      pieces: flow(
        g.body,
        { ...ctx, narrow: true },
        { allowLede: false, standfirst: sf, inSection: false },
      ),
    })),
  };
}

function pullFoot(segs: Seg[]): { segs: Seg[]; foot: PtBlock | null } {
  const last = segs.at(-1);
  if (!last || last.kind !== 'p' || wordsOf(last.b) > 15) return { segs, foot: null };
  const afterGroup = segs.some((s) => s.kind === 'h3' || s.kind === 'h4');
  const children = last.b.children ?? [];
  const linkLine =
    children.length > 0 &&
    children.every((c) => (c.marks ?? []).length > 0 || !splitStega(c.text ?? '').cleaned.trim());
  return afterGroup || linkLine ? { segs: segs.slice(0, -1), foot: last.b } : { segs, foot: null };
}

export function classifyRichText(
  body: PtBlock[] | null | undefined,
  opts: { hasHead: boolean; narrow?: boolean; wide?: boolean },
): RichLayout {
  const segs = segments(Array.isArray(body) ? body : []);
  const continuation = !opts.hasHead;
  if (!segs.length) return { shape: 'prose', continuation, pieces: [] };

  const H3 = segs.filter((s) => s.kind === 'h3').length;
  const H4 = segs.filter((s) => s.kind === 'h4').length;
  const lists = segs.filter((s): s is Extract<Seg, { kind: 'list' }> => s.kind === 'list');
  const paras = segs.filter((s): s is Extract<Seg, { kind: 'p' }> => s.kind === 'p');
  const total = segs.reduce((n, s) => n + segWords(s), 0);
  const ctx: Ctx = {
    runIn: paras.filter((x) => runInSplit(x.b)).length >= 2,
    narrow: !!opts.narrow,
    wide: !!opts.wide,
  };

  let shape: RichShape;
  if (opts.hasHead && !H3 && !H4 && !lists.length && paras.length <= 3 && total <= 80)
    shape = 'row';
  else if (
    H3 >= 2 &&
    groupsAt(segs, 'h3').groups.every(
      (g) =>
        g.body.every((s) => s.kind === 'p') && g.body.reduce((n, s) => n + segWords(s), 0) <= 150,
    )
  )
    shape = 'columns';
  else if (H3 >= 1 || H4 >= 2) shape = 'sections';
  else if (
    !opts.wide &&
    paras.length >= 8 &&
    paras.filter((x) => wordsOf(x.b) <= 35).length / paras.length >= 0.8
  )
    shape = 'register';
  else if (
    lists.some((l) => l.items.length >= 3) &&
    lists.reduce((n, l) => n + segWords(l), 0) / total >= 0.4
  )
    shape = 'ledger';
  else shape = 'prose';

  if (shape === 'row') {
    return {
      shape,
      continuation,
      rowLong: total > 60,
      pieces: [{ kind: 'measure', paras: paras.map((x) => ({ block: x.b, label: null })) }],
    };
  }

  if (shape === 'register' && !opts.narrow) {
    const cells: RichPiece[][] = [];
    for (const s of segs) {
      if (s.kind === 'list' && cells.length) cells[cells.length - 1].push(listPiece(s.items));
      else if (s.kind === 'p')
        cells.push([{ kind: 'measure', paras: [{ block: s.b, label: null }] }]);
      else if (s.kind === 'list') cells.push([listPiece(s.items)]);
    }
    const rows = Math.ceil(cells.length / 2);
    return {
      shape,
      continuation,
      pieces: [{ kind: 'register', left: cells.slice(0, rows), right: cells.slice(rows) }],
    };
  }

  const { segs: rest, foot } = pullFoot(segs);
  const pieces: RichPiece[] = [];
  if (shape === 'columns' || shape === 'sections') {
    const { intro, groups } = groupsAt(rest, 'h3');
    const eligible = groups.filter((g) => g.body[0]?.kind === 'p' && g.body[1]?.kind === 'p');
    const sf =
      eligible.length > 0 && eligible.every((g) => wordsOf((g.body[0] as { b: PtBlock }).b) <= 30);
    pieces.push(
      ...flow(intro, ctx, {
        allowLede: opts.hasHead,
        standfirst: false,
        inSection: false,
        after: groups.length,
      }),
    );
    if (shape === 'columns') pieces.push(columnsPiece(groups, 'h3', ctx, false, sf));
    else
      for (const g of groups) {
        pieces.push({
          kind: 'section',
          head: g.head,
          pieces: flow(g.body, ctx, { allowLede: false, standfirst: sf, inSection: true }),
        });
      }
  } else {
    pieces.push(
      ...flow(rest, ctx, { allowLede: opts.hasHead, standfirst: false, inSection: false }),
    );
  }
  if (foot) pieces.push({ kind: 'foot', block: foot });
  return { shape, continuation, pieces };
}
