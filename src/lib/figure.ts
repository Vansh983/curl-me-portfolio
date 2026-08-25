// The whole character: a flat, filled ink illustration. Pure geometry, params in,
// shapes out. Rule: same ids, same order, same command structure for every
// input, so lerping the params IS morphing the drawing. Things that "appear"
// (glasses, beard, prop) are always drawn and use opacity to hide.

export type Arm = { shoulder: number; elbow: number }; // degrees; 0 hangs down, + swings forward (to +x)
export type Prop = { show: number; w: number; h: number; stem: number; x: number; y: number; rot: number };
export type Face = { smile: number; browL: number; browR: number; eyeOpen: number };

export type FigureParams = {
  height: number; // 0..1 of 480 units
  headRatio: number; // head diameter / height, 0.14..0.3
  shoulder: number; // half shoulder width / height, 0.08..0.18
  hairTop: number; // 0..1 volume on top
  hairSide: number; // 0..1 length down the sides
  glasses: number; // 0..1 opacity
  beard: number; // 0..1 size and opacity
  sleeve: number; // 0 short .. 1 long
  collar: number; // 0 crew .. 1 deep v
  lean: number; // -1..1
  armL: Arm;
  armR: Arm;
  legStance: number; // 0 together .. 1 apart
  prop: Prop; // w,h,stem in units of height; x,y offset from the right hand in units of height; rot degrees
  face: Face; // smile -1..1, brows -1..1, eyeOpen 0..1
};

export type Fill = 'ink' | 'paper' | 'accent' | 'none';
export type Stroke = { id: string; d: string; opacity: number; fill: Fill; width: number };

// Draw order, back to front.
export const STROKE_IDS = [
  'armL', 'skinL', 'handL',
  'legs', 'shoeL', 'shoeR', 'neck', 'torso',
  'armR', 'skinR', 'handR',
  'earL', 'earR', 'head', 'hair', 'beard',
  'eyeL', 'eyeR', 'browL', 'browR', 'nose', 'mouth', 'glasses',
  'prop', 'propStem',
] as const;

export const KEY_DEFAULT: FigureParams = {
  height: 1,
  headRatio: 0.17,
  shoulder: 0.13,
  hairTop: 0.5,
  hairSide: 0.3,
  glasses: 0,
  beard: 0,
  sleeve: 0.5,
  collar: 0.3,
  lean: 0,
  armL: { shoulder: -8, elbow: 10 },
  armR: { shoulder: 8, elbow: -10 },
  legStance: 0.4,
  prop: { show: 0, w: 0.18, h: 0.12, stem: 0, x: 0.02, y: -0.02, rot: 0 },
  face: { smile: 0.4, browL: 0, browR: 0, eyeOpen: 1 },
};

const H_MAX = 480;
type P = [number, number];
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const pt = (p: P) => `${f(p[0])} ${f(p[1])}`;
const rad = (deg: number) => (deg * Math.PI) / 180;
const add = (a: P, b: P, k = 1): P => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const len = (a: P) => Math.hypot(a[0], a[1]) || 1;
const unit = (a: P): P => [a[0] / len(a), a[1] / len(a)];
const perp = (a: P): P => [-a[1], a[0]];
const rot = (p: P, deg: number, o: P): P => {
  const s = Math.sin(rad(deg)), c = Math.cos(rad(deg));
  const d = sub(p, o);
  return [o[0] + d[0] * c - d[1] * s, o[1] + d[0] * s + d[1] * c];
};

// Every helper emits a fixed command structure.
const poly = (...p: P[]) => p.map((q, i) => `${i ? 'L' : 'M'} ${pt(q)}`).join(' ') + ' Z';
const line = (...p: P[]) => p.map((q, i) => `${i ? 'L' : 'M'} ${pt(q)}`).join(' ');
const quad = (a: P, c: P, b: P) => `M ${pt(a)} Q ${pt(c)} ${pt(b)}`;
const C = (c1: P, c2: P, b: P) => ` C ${pt(c1)} ${pt(c2)} ${pt(b)}`;
// ellipse from four cubic arcs; K is the circle constant
const K = 0.5523;
const ellipse = (c: P, rx: number, ry: number) =>
  `M ${pt([c[0] - rx, c[1]])}` +
  C([c[0] - rx, c[1] - ry * K], [c[0] - rx * K, c[1] - ry], [c[0], c[1] - ry]) +
  C([c[0] + rx * K, c[1] - ry], [c[0] + rx, c[1] - ry * K], [c[0] + rx, c[1]]) +
  C([c[0] + rx, c[1] + ry * K], [c[0] + rx * K, c[1] + ry], [c[0], c[1] + ry]) +
  C([c[0] - rx * K, c[1] + ry], [c[0] - rx, c[1] + ry * K], [c[0] - rx, c[1]]) +
  ' Z';
// rounded box, corner radius rr, rotated by deg around its centre
const box = (cx: number, cy: number, w: number, h: number, rr: number, deg = 0) => {
  const o: P = [cx, cy];
  const r = Math.min(rr, w / 2, h / 2);
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const R = (p: P) => rot(p, deg, o);
  return (
    `M ${pt(R([x0 + r, y0]))} L ${pt(R([x1 - r, y0]))}` +
    C(R([x1, y0]), R([x1, y0]), R([x1, y0 + r])) +
    ` L ${pt(R([x1, y1 - r]))}` +
    C(R([x1, y1]), R([x1, y1]), R([x1 - r, y1])) +
    ` L ${pt(R([x0 + r, y1]))}` +
    C(R([x0, y1]), R([x0, y1]), R([x0, y1 - r])) +
    ` L ${pt(R([x0, y0 + r]))}` +
    C(R([x0, y0]), R([x0, y0]), R([x0 + r, y0])) +
    ' Z'
  );
};

// A bent limb as a filled tube: shoulder S, elbow E, wrist W, half width w.
function tube(S: P, E: P, W: P, w: number): { sleeve: string; outer: P; dir: P } {
  const d1 = unit(sub(E, S)), d2 = unit(sub(W, E));
  const n1 = perp(d1), n2 = perp(d2);
  const nm = unit(add(n1, n2));
  return {
    sleeve: poly(add(S, n1, w), add(E, nm, w), add(W, n2, w), add(W, n2, -w), add(E, nm, -w), add(S, n1, -w)),
    outer: n2,
    dir: d2,
  };
}
function limb(S: P, a: Arm, H: number): { E: P; W: P } {
  const up = H * 0.19, lo = H * 0.17;
  const a1 = rad(clamp(a.shoulder, -170, 170));
  const E: P = [S[0] + Math.sin(a1) * up, S[1] + Math.cos(a1) * up];
  const a2 = a1 + rad(clamp(a.elbow, -150, 150));
  const W: P = [E[0] + Math.sin(a2) * lo, E[1] + Math.cos(a2) * lo];
  return { E, W };
}

/**
 * Draws the character.
 * @param p figure parameters, every number is clamped to its range
 * @returns shapes in draw order with a fixed command structure
 */
export function figure(p: FigureParams): Stroke[] {
  const H = H_MAX * clamp(p.height, 0.2, 1);
  const r = (H * clamp(p.headRatio, 0.12, 0.32)) / 2;
  const rx = r * 0.92;
  const lean = clamp(p.lean, -1, 1);
  const lx = lean * H * 0.06;

  const ankleY = -H * 0.045;
  const kneeY = -H * 0.27;
  const hipY = -H * 0.5;
  const shY = -H * 0.76;
  const neckY = shY - H * 0.02;
  const cx = lx * 1.4, cy = -(H - r);
  const halfSh = H * clamp(p.shoulder, 0.08, 0.18);
  const hw = H * 0.085;
  const lw = H * 0.05;
  const aw = H * 0.042;
  const collar = clamp(p.collar, 0, 1);

  // legs and shoes
  const st = H * 0.12 * clamp(p.legStance, 0, 1);
  const legs = poly(
    [-hw, hipY], [-st - lw, kneeY], [-st - lw * 0.85, ankleY], [-st + lw * 0.85, ankleY], [-st + lw * 0.9, kneeY],
    [0, hipY + H * 0.13],
    [st - lw * 0.9, kneeY], [st - lw * 0.85, ankleY], [st + lw * 0.85, ankleY], [st + lw, kneeY], [hw, hipY],
  );
  const shoeL = box(-st + lw * 0.25, -H * 0.022, lw * 2.7, H * 0.045, H * 0.02);
  const shoeR = box(st + lw * 0.25, -H * 0.022, lw * 2.7, H * 0.045, H * 0.02);

  // neck and torso
  const neck = poly([cx - r * 0.32, cy + r * 0.7], [cx + r * 0.32, cy + r * 0.7], [lx + r * 0.36, neckY + H * 0.015], [lx - r * 0.36, neckY + H * 0.015]);
  const neckL: P = [lx - r * 0.5, neckY], neckR: P = [lx + r * 0.5, neckY];
  const shL: P = [lx - halfSh, shY], shR: P = [lx + halfSh, shY];
  const torso =
    `M ${pt(neckL)} L ${pt(shL)} L ${pt([lx - halfSh * 0.92, shY + H * 0.07])} L ${pt([-hw * 1.08, hipY + H * 0.035])}` +
    ` L ${pt([hw * 1.08, hipY + H * 0.035])} L ${pt([lx + halfSh * 0.92, shY + H * 0.07])} L ${pt(shR)} L ${pt(neckR)}` +
    C([lx + r * 0.3, neckY + H * (0.01 + collar * 0.05)], [lx - r * 0.3, neckY + H * (0.01 + collar * 0.05)], neckL) +
    ' Z';

  // arms: sleeve tube, bare forearm from the sleeve end to the wrist, hand
  const sl = clamp(p.sleeve, 0, 1);
  const arm = (S: P, a: Arm) => {
    const { E, W } = limb(S, a, H);
    const t = tube(S, E, W, aw);
    const F = add(E, sub(W, E), 0.15 + sl * 0.85); // where the sleeve ends
    const skin = poly(add(F, t.outer, aw * 0.85), add(W, t.outer, aw * 0.85), add(W, t.outer, -aw * 0.85), add(F, t.outer, -aw * 0.85));
    const hc = add(W, t.dir, aw * 0.9);
    return { sleeve: t.sleeve, skin, hand: ellipse(hc, aw * 1.05, aw * 1.15), hc };
  };
  const L = arm([lx - halfSh * 0.9, shY + H * 0.02], p.armL);
  const R = arm([lx + halfSh * 0.9, shY + H * 0.02], p.armR);

  // head, ears, hair
  const head = ellipse([cx, cy], rx, r);
  const earL = ellipse([cx - rx * 0.98, cy + r * 0.08], r * 0.16, r * 0.2);
  const earR = ellipse([cx + rx * 0.98, cy + r * 0.08], r * 0.16, r * 0.2);
  const ht = clamp(p.hairTop, 0, 1), hs = clamp(p.hairSide, 0, 1);
  const tL: P = [cx - rx * 1.04, cy + r * (0.02 + hs * 0.42)], tR: P = [cx + rx * 1.04, cy + r * (0.02 + hs * 0.42)];
  const top = cy - r * (1.04 + ht * 0.45);
  const hair =
    `M ${pt(tL)}` +
    C([cx - rx * 1.2, cy - r * 0.55], [cx - r * 0.7, top], [cx, top]) +
    C([cx + r * 0.7, top], [cx + rx * 1.2, cy - r * 0.55], tR) +
    C([cx + rx * 0.6, cy - r * 0.25], [cx + r * 0.25, cy - r * 0.62], [cx, cy - r * 0.42]) +
    C([cx - r * 0.2, cy - r * 0.28], [cx - rx * 0.62, cy - r * 0.62], tL) +
    ' Z';

  // face
  const fc = p.face;
  const eo = clamp(fc.eyeOpen, 0, 1);
  const ex = rx * 0.38, ey = cy - r * 0.02;
  const er = r * 0.075;
  const eyeL = ellipse([cx - ex, ey], er, er * (0.2 + 0.8 * eo));
  const eyeR = ellipse([cx + ex, ey], er, er * (0.2 + 0.8 * eo));
  const bl = clamp(fc.browL, -1, 1) * r * 0.1, br = clamp(fc.browR, -1, 1) * r * 0.1;
  const by = cy - r * 0.3;
  const browL = quad([cx - ex - r * 0.18, by + bl], [cx - ex, by - r * 0.08 - bl * 0.5], [cx - ex + r * 0.16, by - bl]);
  const browR = quad([cx + ex - r * 0.16, by + br], [cx + ex, by - r * 0.08 - br * 0.5], [cx + ex + r * 0.18, by - br]);
  const nose = line([cx + r * 0.02, ey + r * 0.08], [cx + r * 0.1, ey + r * 0.34], [cx - r * 0.02, ey + r * 0.36]);
  const sm = clamp(fc.smile, -1, 1);
  const mouth = quad([cx - r * 0.26, cy + r * 0.5], [cx, cy + r * (0.5 + sm * 0.26)], [cx + r * 0.26, cy + r * 0.5]);
  const gr = r * 0.3;
  const glasses =
    `${ellipse([cx - ex, ey], gr, gr * 0.9)} ${ellipse([cx + ex, ey], gr, gr * 0.9)}` +
    ` M ${pt([cx - ex + gr, ey])} L ${pt([cx + ex - gr, ey])}` +
    ` M ${pt([cx - ex - gr, ey])} L ${pt([cx - rx, ey + r * 0.05])} M ${pt([cx + ex + gr, ey])} L ${pt([cx + rx, ey + r * 0.05])}`;
  const bd = clamp(p.beard, 0, 1);
  const jawL: P = [cx - rx * 0.98, cy + r * 0.2], jawR: P = [cx + rx * 0.98, cy + r * 0.2];
  const beard =
    `M ${pt(jawL)}` +
    C([cx - rx * 0.95, cy + r * (0.95 + bd * 0.35)], [cx + rx * 0.95, cy + r * (0.95 + bd * 0.35)], jawR) +
    C([cx + rx * 0.75, cy + r * 0.66], [cx - rx * 0.75, cy + r * 0.66], jawL) +
    ' Z';

  // prop: a rounded box with a stem, held in the right hand
  const pr = p.prop;
  const pw = H * clamp(pr.w, 0.02, 0.4), ph = H * clamp(pr.h, 0.02, 0.4);
  const pc: P = [R.hc[0] + H * clamp(pr.x, -0.3, 0.3), R.hc[1] + H * clamp(pr.y, -0.3, 0.3)];
  const prr = clamp(pr.rot, -180, 180);
  const prop = box(pc[0], pc[1], pw, ph, H * 0.012, prr);
  const stem = H * clamp(pr.stem, 0, 0.4);
  const propStem = line(rot([pc[0], pc[1] + ph / 2], prr, pc), rot([pc[0], pc[1] + ph / 2 + stem], prr, pc));
  const show = clamp(pr.show, 0, 1);

  const s = (id: string, d: string, fill: Fill, width: number, opacity = 1): Stroke => ({ id, d, opacity, fill, width });
  return [
    s('armL', L.sleeve, 'ink', 4), s('skinL', L.skin, 'paper', 4), s('handL', L.hand, 'paper', 4),
    s('legs', legs, 'paper', 4), s('shoeL', shoeL, 'ink', 4), s('shoeR', shoeR, 'ink', 4),
    s('neck', neck, 'paper', 4), s('torso', torso, 'ink', 4),
    s('armR', R.sleeve, 'ink', 4), s('skinR', R.skin, 'paper', 4), s('handR', R.hand, 'paper', 4),
    s('earL', earL, 'paper', 4), s('earR', earR, 'paper', 4), s('head', head, 'paper', 4),
    s('hair', hair, 'ink', 4), s('beard', beard, 'ink', 3, bd),
    s('eyeL', eyeL, 'ink', 2), s('eyeR', eyeR, 'ink', 2), s('browL', browL, 'none', 5), s('browR', browR, 'none', 5),
    s('nose', nose, 'none', 3), s('mouth', mouth, 'none', 3.5), s('glasses', glasses, 'none', 3.5, clamp(p.glasses, 0, 1)),
    s('prop', prop, 'accent', 4, show), s('propStem', propStem, 'none', 6, show),
  ];
}
