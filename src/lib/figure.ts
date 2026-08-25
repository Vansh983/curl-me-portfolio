// The whole character. Pure geometry: params in, stroke paths out.
// Rule: same ids, same order, same command structure for every input,
// so lerping the params IS morphing the drawing. Things that "appear"
// (glasses, beard, prop) are always drawn and use opacity to hide.

export type Arm = { shoulder: number; elbow: number }; // degrees; 0 hangs down, + swings forward (to +x)
export type Prop = { show: number; w: number; h: number; stem: number; x: number; y: number; rot: number };
export type Face = { smile: number; browL: number; browR: number; eyeOpen: number };

export type FigureParams = {
  height: number; // 0..1 of 480 units
  headRatio: number; // head diameter / height, 0.14..0.3
  shoulder: number; // half shoulder width / height, 0.08..0.18
  hairTop: number; // 0..1
  hairSide: number; // 0..1
  glasses: number; // 0..1 opacity
  beard: number; // 0..1 size and opacity
  sleeve: number; // 0 short .. 1 long
  collar: number; // 0 tee .. 1 collar
  lean: number; // -1..1
  armL: Arm;
  armR: Arm;
  legStance: number; // 0 together .. 1 apart
  prop: Prop; // w,h,stem in units of height; x,y offset from the right hand in units of height; rot degrees
  face: Face; // smile -1..1, brows -1..1, eyeOpen 0..1
};

export type Stroke = { id: string; d: string; opacity: number; accent: boolean };

export const STROKE_IDS = [
  'legL', 'legR', 'torso', 'shoulders', 'armL', 'armR',
  'prop', 'propStem', 'head', 'hair', 'hairL', 'hairR',
  'eyeL', 'eyeR', 'browL', 'browR', 'mouth', 'glasses', 'beard',
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
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const pt = (x: number, y: number) => `${f(x)} ${f(y)}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

// Every helper emits a fixed command structure.
const circle = (cx: number, cy: number, r: number) =>
  `M ${pt(cx - r, cy)} A ${f(r)} ${f(r)} 0 1 0 ${pt(cx + r, cy)} A ${f(r)} ${f(r)} 0 1 0 ${pt(cx - r, cy)}`;
const line = (...p: [number, number][]) => p.map((q, i) => `${i ? 'L' : 'M'} ${pt(q[0], q[1])}`).join(' ');
const quad = (a: [number, number], c: [number, number], b: [number, number]) =>
  `M ${pt(a[0], a[1])} Q ${pt(c[0], c[1])} ${pt(b[0], b[1])}`;
const cubic = (a: [number, number], c1: [number, number], c2: [number, number], b: [number, number]) =>
  `M ${pt(a[0], a[1])} C ${pt(c1[0], c1[1])} ${pt(c2[0], c2[1])} ${pt(b[0], b[1])}`;
const rot = (x: number, y: number, deg: number, ox: number, oy: number): [number, number] => {
  const s = Math.sin(rad(deg)), c = Math.cos(rad(deg));
  const dx = x - ox, dy = y - oy;
  return [ox + dx * c - dy * s, oy + dx * s + dy * c];
};

function arm(sx: number, sy: number, a: Arm, H: number): { d: string; hand: [number, number] } {
  const up = H * 0.2, lo = H * 0.18;
  const a1 = rad(clamp(a.shoulder, -170, 170));
  const ex = sx + Math.sin(a1) * up, ey = sy + Math.cos(a1) * up;
  const a2 = a1 + rad(clamp(a.elbow, -150, 150));
  const hx = ex + Math.sin(a2) * lo, hy = ey + Math.cos(a2) * lo;
  return { d: line([sx, sy], [ex, ey], [hx, hy]), hand: [hx, hy] };
}

/**
 * Draws the character.
 * @param p figure parameters, every number is clamped to its range
 * @returns strokes in fixed order with a fixed command structure
 */
export function figure(p: FigureParams): Stroke[] {
  const H = H_MAX * clamp(p.height, 0.2, 1);
  const headD = H * clamp(p.headRatio, 0.12, 0.32);
  const r = headD / 2;
  const lean = clamp(p.lean, -1, 1);
  const lx = lean * H * 0.06; // upper body shifts with lean

  const hipY = -H * 0.48;
  const neckY = -(H - headD);
  const cx = lx, cy = neckY - r; // head centre
  const shY = neckY + H * 0.03;
  const halfSh = H * clamp(p.shoulder, 0.08, 0.18);
  const collar = clamp(p.collar, 0, 1);

  // legs
  const stance = H * 0.12 * clamp(p.legStance, 0, 1);
  const kneeY = hipY / 2;
  const legL = line([0, hipY], [-stance * 0.6, kneeY], [-stance, 0]);
  const legR = line([0, hipY], [stance * 0.6, kneeY], [stance, 0]);

  // torso and shoulders (collar lifts the shoulder curve into a V)
  const torso = line([0, hipY], [lx, neckY]);
  const shoulders = cubic(
    [lx - halfSh, shY + H * 0.02],
    [lx - halfSh * 0.4, shY - collar * H * 0.03],
    [lx + halfSh * 0.4, shY - collar * H * 0.03],
    [lx + halfSh, shY + H * 0.02],
  );

  // arms
  const L = arm(lx - halfSh, shY + H * 0.02, p.armL, H);
  const R = arm(lx + halfSh, shY + H * 0.02, p.armR, H);

  // prop: a rounded box with a stem, held in the right hand
  const pr = p.prop;
  const pw = H * clamp(pr.w, 0.02, 0.4), ph = H * clamp(pr.h, 0.02, 0.4);
  const px = R.hand[0] + H * clamp(pr.x, -0.3, 0.3), py = R.hand[1] + H * clamp(pr.y, -0.3, 0.3);
  const prr = clamp(pr.rot, -180, 180);
  const corners: [number, number][] = [
    rot(px - pw / 2, py - ph / 2, prr, px, py),
    rot(px + pw / 2, py - ph / 2, prr, px, py),
    rot(px + pw / 2, py + ph / 2, prr, px, py),
    rot(px - pw / 2, py + ph / 2, prr, px, py),
    rot(px - pw / 2, py - ph / 2, prr, px, py),
  ];
  const prop = line(...corners);
  const stemEnd = rot(px, py + ph / 2 + H * clamp(pr.stem, 0, 0.4), prr, px, py);
  const propStem = line(rot(px, py + ph / 2, prr, px, py), stemEnd);
  const propShow = clamp(pr.show, 0, 1);

  // head and hair
  const head = circle(cx, cy, r);
  const ht = clamp(p.hairTop, 0, 1), hs = clamp(p.hairSide, 0, 1);
  const hair = cubic(
    [cx - r * 0.95, cy - r * 0.2],
    [cx - r * 0.7, cy - r * (1.1 + ht * 0.6)],
    [cx + r * 0.7, cy - r * (1.1 + ht * 0.6)],
    [cx + r * 0.95, cy - r * 0.2],
  );
  const hairL = quad([cx - r * 0.95, cy - r * 0.2], [cx - r * (1.0 + hs * 0.3), cy + r * 0.1], [cx - r * (0.98 + hs * 0.12), cy + r * (0.15 + hs * 0.45)]);
  const hairR = quad([cx + r * 0.95, cy - r * 0.2], [cx + r * (1.0 + hs * 0.3), cy + r * 0.1], [cx + r * (0.98 + hs * 0.12), cy + r * (0.15 + hs * 0.45)]);

  // face
  const fc = p.face;
  const eo = clamp(fc.eyeOpen, 0, 1);
  const ex = r * 0.35, ey = cy - r * 0.05;
  const er = r * 0.07 * (0.15 + 0.85 * eo);
  const eyeL = circle(cx - ex, ey, er);
  const eyeR = circle(cx + ex, ey, er);
  const bl = clamp(fc.browL, -1, 1) * r * 0.12, br = clamp(fc.browR, -1, 1) * r * 0.12;
  const by = cy - r * 0.35;
  const browL = line([cx - ex - r * 0.15, by + bl], [cx - ex + r * 0.15, by - bl]);
  const browR = line([cx + ex - r * 0.15, by + br], [cx + ex + r * 0.15, by - br]);
  const sm = clamp(fc.smile, -1, 1);
  const mouth = quad([cx - r * 0.3, cy + r * 0.45], [cx, cy + r * (0.45 + sm * 0.3)], [cx + r * 0.3, cy + r * 0.45]);

  // glasses: two lenses and a bridge, one path, hidden by opacity
  const gr = r * 0.3;
  const glasses =
    `${circle(cx - ex, ey, gr)} ${circle(cx + ex, ey, gr)} M ${pt(cx - ex + gr, ey)} L ${pt(cx + ex - gr, ey)}`;
  const gOp = clamp(p.glasses, 0, 1);

  // beard: hugs the jaw, grows down, hidden by opacity
  const bd = clamp(p.beard, 0, 1);
  const beard = quad([cx - r * 0.86, cy + r * 0.5], [cx, cy + r * (1.15 + bd * 0.55)], [cx + r * 0.86, cy + r * 0.5]);

  const s = (id: string, d: string, opacity = 1, accent = false): Stroke => ({ id, d, opacity, accent });
  return [
    s('legL', legL), s('legR', legR), s('torso', torso), s('shoulders', shoulders),
    s('armL', L.d), s('armR', R.d),
    s('prop', prop, propShow, true), s('propStem', propStem, propShow),
    s('head', head), s('hair', hair), s('hairL', hairL), s('hairR', hairR),
    s('eyeL', eyeL), s('eyeR', eyeR), s('browL', browL), s('browR', browR), s('mouth', mouth),
    s('glasses', glasses, gOp), s('beard', beard, bd),
  ];
}
