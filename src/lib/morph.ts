// Morph one authored SVG into another with the same element structure.
// Build time: pair the two files element by element and record what changes.
// Run time: apply the pair list at progress t to the live DOM.
// If the two files do not line up (different tags or path commands), the plan is
// null and the stage falls back to a crossfade for that layer.

export const MORPH_TAGS = ['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'text'] as const;
const NUM_ATTRS = ['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-size', 'letter-spacing'];
const COLOR_ATTRS = ['fill', 'stroke'];
const NUM_RE = /-?\d*\.?\d+(?:e[-+]?\d+)?/g;

export type ElPlan = {
  i: number;
  n?: Record<string, [number, number]>;
  d?: { tpl: string; a: number[]; b: number[] };
  c?: Record<string, [number[], number[]]>;
  s?: Record<string, [string, string]>;
  t?: [string, string];
};
export type MorphPlan = { els: ElPlan[]; count: number };

type El = { tag: string; attrs: Record<string, string>; text: string };

function parse(svg: string): El[] {
  const out: El[] = [];
  const re = /<(path|rect|circle|ellipse|line|polygon|text)\b([^>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) {
    const attrs: Record<string, string> = {};
    for (const a of m[2].matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    let text = '';
    if (m[1] === 'text' && !m[3]) {
      const close = svg.indexOf('</text>', re.lastIndex);
      text = svg.slice(re.lastIndex, close).trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }
    out.push({ tag: m[1], attrs, text });
  }
  return out;
}

const hex = (v: string): number[] | null => {
  const m = v.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/**
 * Pairs two SVG sources element by element.
 * @param a the from SVG source
 * @param b the to SVG source
 * @returns the change list, or null when the structures do not match
 */
export function pairSvgs(a: string, b: string): MorphPlan | null {
  const A = parse(a), B = parse(b);
  if (A.length !== B.length || A.length === 0) return null;
  const els: ElPlan[] = [];
  for (let i = 0; i < A.length; i++) {
    const x = A[i], y = B[i];
    if (x.tag !== y.tag) return null;
    const p: ElPlan = { i };
    const keys = new Set([...Object.keys(x.attrs), ...Object.keys(y.attrs)]);
    for (const k of keys) {
      const va = x.attrs[k], vb = y.attrs[k];
      if (va === vb) continue;
      if (k === 'd') {
        if (va === undefined || vb === undefined) return null;
        const tplA = va.replace(NUM_RE, '#'), tplB = vb.replace(NUM_RE, '#');
        if (tplA !== tplB) return null;
        p.d = { tpl: tplA, a: (va.match(NUM_RE) ?? []).map(Number), b: (vb.match(NUM_RE) ?? []).map(Number) };
      } else if (NUM_ATTRS.includes(k) && va !== undefined && vb !== undefined && !isNaN(Number(va)) && !isNaN(Number(vb))) {
        (p.n ??= {})[k] = [Number(va), Number(vb)];
      } else if (COLOR_ATTRS.includes(k) && va && vb && hex(va) && hex(vb)) {
        (p.c ??= {})[k] = [hex(va)!, hex(vb)!];
      } else if (k !== 'style' && k !== 'data-motion' && k !== 'class') {
        (p.s ??= {})[k] = [va ?? '', vb ?? ''];
      }
    }
    if (x.tag === 'text' && x.text !== y.text) p.t = [x.text, y.text];
    if (p.n || p.d || p.c || p.s || p.t) els.push(p);
  }
  return { els, count: A.length };
}

const f1 = (n: number) => Math.round(n * 10) / 10;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Applies a plan to live elements at progress t (0 = from, 1 = to).
 * @param els the layer's elements in document order, same filter as MORPH_TAGS
 * @param plan the pair list from pairSvgs
 * @param t progress 0..1
 */
export function applyPlan(els: ArrayLike<Element>, plan: MorphPlan, t: number): void {
  const tt = t <= 0 ? 0 : t >= 1 ? 1 : t;
  for (const p of plan.els) {
    const el = els[p.i];
    if (!el) continue;
    if (p.n) for (const k in p.n) el.setAttribute(k, String(f1(mix(p.n[k][0], p.n[k][1], tt))));
    if (p.d) {
      let j = 0;
      const { tpl, a, b } = p.d;
      el.setAttribute('d', tpl.replace(/#/g, () => String(f1(mix(a[j], b[j++], tt)))));
    }
    if (p.c) for (const k in p.c) {
      const [ca, cb] = p.c[k];
      el.setAttribute(k, `rgb(${Math.round(mix(ca[0], cb[0], tt))},${Math.round(mix(ca[1], cb[1], tt))},${Math.round(mix(ca[2], cb[2], tt))})`);
    }
    if (p.s) for (const k in p.s) {
      const v = tt < 0.5 ? p.s[k][0] : p.s[k][1];
      if (v === '') el.removeAttribute(k);
      else el.setAttribute(k, v);
    }
    if (p.t) el.textContent = tt < 0.5 ? p.t[0] : p.t[1];
  }
}
