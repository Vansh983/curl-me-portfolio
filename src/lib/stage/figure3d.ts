// One person, built by forward kinematics from joint angles. Every part has a fixed
// vertex count for every input, so two Figures are morph targets of each other.
// Faces -z at yaw 0. Pelvis at (x, y, z).
// The body is lofted, not assembled: each arm is one skin from inside the shoulder to the
// fingertips (deltoid, elbow, wrist, a flat palm, fingers), each leg one skin from inside
// the pelvis to the ankle, the neck and head one skin with a jaw and a chin, and the sleeves
// and shoes are skins of their own that start inside what they cover. Nothing touches
// end to end; everything emerges from something.
import { Sink, tube, type Geo, type V3, type Ring } from './rig.ts';

export interface Pose {
  hipFlex: number; // deg, thigh forward from straight down (90 = sitting)
  hipSpread: number; // deg, thighs out to the sides
  kneeFlex: number; // deg, shin folded back from the thigh line
  shoulderFlex: number; // deg, upper arm forward from straight down
  elbowFlex: number; // deg, forearm folded forward from the upper arm line
  armSpread: number; // deg, upper arms out to the sides
  foreSpread: number; // deg, forearms out (+) or in toward each other (-)
  torsoLean: number; // deg forward
  headTilt: number; // deg forward
  rShoulder: number; // deg added to the right arm's shoulderFlex (raising the trophy)
  rElbow: number; // deg added to the right arm's elbowFlex
}
export interface Figure {
  height: number; // metres standing
  headR: number;
  shoulder: number; // half width
  hip: number; // half width
  limbR: number; // limb radius
  hairTop: number; // 0..1, how far the hair cap comes down
  sleeve: number; // 0 short sleeve .. 1 to the wrist
  tie: number; // 0..1
  held: number; // 0 controller between the hands .. 1 mouse under the right hand
  trophy: number; // 0..1, the held thing becomes a trophy raised in the right hand
  glasses: number; // 0..1
  lanyard: number; // 0..1, the lanyard and badge on the chest
  smile: number; // 0..1
  x: number; y: number; z: number; // pelvis
  yaw: number; // radians, 0 faces -z
  crossLegs: number; // 0..1, shins cross inward (sitting on the floor)
  pose: Pose;
}
export const PARTS = ['skin', 'hair', 'shirt', 'sleeveL', 'sleeveR', 'legs', 'shoes', 'tie', 'held', 'face', 'glasses', 'lanyard', 'badge'] as const;
export type Part = (typeof PARTS)[number];

const D = Math.PI / 180;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Limb direction from straight down: flex swings forward (-z), spread swings out (sign * x). */
const limb = (flex: number, spread: number, sign: number): V3 => {
  const f = flex * D, s = spread * D;
  return norm([sign * Math.sin(s), -Math.cos(f) * Math.cos(s), -Math.sin(f) * Math.cos(s)]);
};
/** The component of `a` perpendicular to unit `d`. */
const perp = (a: V3, d: V3): V3 => norm(sub(a, [d[0] * dot(a, d), d[1] * dot(a, d), d[2] * dot(a, d)]));

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * A polyline with its corners rounded: each interior point becomes a quadratic arc of `r`
 * metres either side (clamped to half the neighbouring segments), sampled in `m` steps, so a
 * skin lofted along it bends like a knee rather than creasing like paper. Fixed point count.
 */
function rounded(pts: V3[], r: number, m = 6): V3[] {
  const out: V3[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const rr = Math.min(r, dist(a, b) * 0.5, dist(b, c) * 0.5);
    const p0 = add(b, norm(sub(a, b)), rr), p2 = add(b, norm(sub(c, b)), rr);
    for (let k = 0; k <= m; k++) {
      const t = k / m, u = 1 - t;
      out.push([u * u * p0[0] + 2 * u * t * b[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * b[1] + t * t * p2[1], u * u * p0[2] + 2 * u * t * b[2] + t * t * p2[2]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** A point at a fraction `t` of a polyline's length. */
function along(poly: V3[], t: number): V3 {
  const seg = poly.slice(1).map((q, i) => dist(poly[i], q));
  const total = seg.reduce((a, b) => a + b, 0);
  let want = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) return mix(poly[i], poly[i + 1], seg[i] < 1e-9 ? 0 : Math.min(1, want / seg[i]));
    want -= seg[i];
  }
  return poly[poly.length - 1];
}

/** Where the corners of `pts` fall as fractions of the whole length. */
function marks(pts: V3[]): number[] {
  const seg = pts.slice(1).map((q, i) => dist(pts[i], q));
  const total = seg.reduce((a, b) => a + b, 0) || 1;
  const out = [0];
  for (const l of seg) out.push(out[out.length - 1] + l / total);
  return out;
}

// torso profile: [radius factor, height factor] from a hem that turns in under the trousers to a
// collar that turns down inside, so the neck rises out of an opening rather than a point
const TORSO: [number, number][] = [[0.5, 0.03], [0.86, 0], [0.9, 0.22], [0.98, 0.5], [1.05, 0.74], [1.07, 0.86], [0.96, 0.94], [0.58, 0.985], [0.36, 1.0], [0.3, 0.99], [0.3, 0.9]];
// the head, in units of headR (half the height of the face), from inside the collar to the crown:
// [height, half width, half depth, forward offset]. A head is narrower than it is deep.
const HEAD: [number, number, number, number][] = [
  [-0.35, 0.44, 0.42, 0], [0.0, 0.42, 0.4, 0.01], [0.3, 0.42, 0.4, 0.03], // neck
  [0.5, 0.42, 0.52, 0.12], [0.75, 0.62, 0.74, 0.1], [1.0, 0.74, 0.88, 0.06], // chin, jaw, mouth
  [1.3, 0.79, 0.94, 0.02], [1.55, 0.8, 0.94, 0], [1.85, 0.78, 0.9, -0.03], // cheek, eyes, temple
  [2.15, 0.66, 0.76, -0.08], [2.4, 0.38, 0.45, -0.13], [2.5, 0.001, 0.001, -0.15], // crown
];

/**
 * Builds every part of the figure.
 * @param p the figure params
 * @returns one geometry per part, fixed vertex counts
 */
export function figure(p: Figure): Record<Part, Geo> {
  const S = Object.fromEntries(PARTS.map((k) => [k, new Sink()])) as Record<Part, Sink>;
  const H = p.height, q = p.pose, R = p.limbR, hr = p.headR;
  const torsoLen = H * 0.31, thigh = H * 0.24, shin = H * 0.23, upper = H * 0.155, fore = H * 0.135, handLen = H * 0.09;
  const lean = q.torsoLean * D, tilt = q.headTilt * D;
  const N: V3 = [0, torsoLen * Math.cos(lean), -torsoLen * Math.sin(lean)];
  const depth = p.hip * 0.62;

  // ---- torso: the shirt is the body here (nothing of the trunk shows)
  S.shirt.lathe(TORSO.map(([r, y]) => [r, y * torsoLen]), 0, 0, 0, p.shoulder * 0.92, depth, Math.tan(lean), 20, [0, 0, 1, 1]);

  // ---- neck and head: one skin, rings stacked up a tilted axis, each pushed forward a little for the chin
  const hu: V3 = [0, Math.cos(tilt), -Math.sin(tilt)], hf: V3 = [0, -Math.sin(tilt), -Math.cos(tilt)];
  const base = add(N, [0, -0.005, 0]);
  // u sideways, v backward: u x v is up the axis, which is the hand the loft expects
  const headRings: Ring[] = HEAD.map(([h, w, d, f]) => ({ c: add(add(base, hu, h * hr), hf, f * hr), u: [1, 0, 0], v: [0, hu[2], -hu[1]] as V3, ru: w * hr, rv: d * hr }));
  S.skin.loft(headRings, 16);
  const head = add(base, hu, 1.5 * hr); // the centre the features hang off
  for (const sign of [-1, 1] as const) S.skin.sphere(head[0] + sign * hr * 0.79, head[1] - hr * 0.08, head[2] + hr * 0.06, hr * 0.1, hr * 0.2, hr * 0.12, 8, 5);
  // hair: a cap that hugs the skull, coming down the back to the nape and a touch over the brow
  S.hair.sphere(head[0], head[1] + hr * 0.12, head[2] + hr * 0.06, hr * 0.86, hr * 1.0, hr * 0.98, 16, 8, undefined, 0.5 + 0.14 * p.hairTop);
  // the face: eyes, brows, a mouth that smiles; glasses as thin rims; all on the -z side of the head
  const fz = head[2] - hr * 0.9;
  for (const sign of [-1, 1] as const) {
    S.face.sphere(head[0] + sign * hr * 0.28, head[1] + hr * 0.06, fz + hr * 0.02, hr * 0.07, hr * 0.08, hr * 0.05, 6, 4);
    S.face.bone([head[0] + sign * hr * 0.42, head[1] + hr * 0.28, fz + hr * 0.02], [head[0] + sign * hr * 0.14, head[1] + hr * 0.3, fz], hr * 0.012, hr * 0.02);
    const g = p.glasses, ex = head[0] + sign * hr * 0.28, ey = head[1] + hr * 0.06, rw = hr * 0.17 * g + 0.0005, rh = hr * 0.14 * g + 0.0005, t = hr * 0.012 * g + 0.0003;
    S.glasses.bone([ex - rw, ey + rh, fz - 0.002], [ex + rw, ey + rh, fz - 0.002], t, t).bone([ex - rw, ey - rh, fz - 0.002], [ex + rw, ey - rh, fz - 0.002], t, t);
    S.glasses.bone([ex - rw, ey - rh, fz - 0.002], [ex - rw, ey + rh, fz - 0.002], t, t).bone([ex + rw, ey - rh, fz - 0.002], [ex + rw, ey + rh, fz - 0.002], t, t);
    S.glasses.bone([ex + sign * rw, ey + rh * 0.6, fz], [head[0] + sign * hr * 0.8 * g + (1 - g) * ex, ey + hr * 0.02, head[2] + hr * 0.04 * g + (1 - g) * fz], t, t);
  }
  S.glasses.bone([head[0] - hr * 0.12, head[1] + hr * 0.1, fz - 0.002], [head[0] + hr * 0.12, head[1] + hr * 0.1, fz - 0.002], hr * 0.012 * p.glasses + 0.0003, hr * 0.012 * p.glasses + 0.0003);
  const my = head[1] - hr * 0.38;
  S.face.box(head[0], my, fz + hr * 0.02, hr * 0.3, hr * 0.04, hr * 0.03);
  for (const sign of [-1, 1] as const) S.face.box(head[0] + sign * hr * 0.17, my + hr * 0.05 * p.smile, fz + hr * 0.03, hr * 0.05, hr * 0.04, hr * 0.03);
  // tie: hangs from the collar down the front
  const tieTop = add(N, [0, -0.02, -(depth * 1.02 + 0.006)]);
  const tieDown: V3 = [0, -Math.cos(lean), Math.sin(lean) * 0.2];
  S.tie.bone(tieTop, add(tieTop, tieDown, 0.001 + 0.028 * p.tie), 0.001 + 0.014 * p.tie, 0.006 * p.tie + 0.001);
  S.tie.bone(add(tieTop, tieDown, 0.001 + 0.028 * p.tie), add(tieTop, tieDown, 0.001 + torsoLen * 0.5 * p.tie), 0.001 + 0.022 * p.tie, 0.003);

  // lanyard from both sides of the neck to a badge on the chest
  const ly = p.lanyard, badgeC = add(N, [0, -torsoLen * 0.42 * ly - 0.02, -(depth + 0.01)]);
  for (const sign of [-1, 1] as const) S.lanyard.bone(add(N, [sign * hr * 0.3, 0, -depth * 0.6]), add(badgeC, [sign * 0.012, 0.03, 0.002]), 0.004 * ly + 0.0003, 0.002 * ly + 0.0003);
  const bw = 0.03 * ly + 0.0005, bh = 0.042 * ly + 0.0005;
  S.badge.quad([badgeC[0] + bw, badgeC[1] - bh, badgeC[2]], [badgeC[0] - bw, badgeC[1] - bh, badgeC[2]], [badgeC[0] - bw, badgeC[1] + bh, badgeC[2]], [badgeC[0] + bw, badgeC[1] + bh, badgeC[2]], [[0, 0], [1, 0], [1, 1], [0, 1]]);

  const wrists: Record<number, V3> = {};
  const foreDir: Record<number, V3> = {};
  const palms: Record<number, V3> = {};
  for (const sign of [-1, 1] as const) {
    const out: V3 = [sign, 0, 0];
    // ---- arm: the shoulder joint sits at the widest point of the torso, just inside its surface
    const Sh: V3 = [sign * p.shoulder * 0.9, torsoLen * 0.9 * Math.cos(lean), -torsoLen * 0.9 * Math.sin(lean)];
    const sf = q.shoulderFlex + (sign > 0 ? q.rShoulder : 0), ef = q.elbowFlex + (sign > 0 ? q.rElbow : 0);
    const ud = limb(sf, q.armSpread, sign);
    const E = add(Sh, ud, upper);
    const fd = limb(sf + ef, q.armSpread * 0.5 + q.foreSpread, sign);
    const W = add(E, fd, fore);
    wrists[sign] = W;
    foreDir[sign] = fd;
    // the hand carries on from the wrist, dropping a little toward the ground
    const hd = norm(mix(fd, [0, -1, 0], 0.25));
    const tip = add(W, hd, handLen);
    palms[sign] = add(W, hd, handLen * 0.45);
    // the whole arm is one path, elbow and wrist rounded; rings are placed by fractions of it
    const armPts: V3[] = [add(Sh, out, -p.shoulder * 0.12), Sh, E, W, tip];
    const [, tS, tE, tW] = marks(armPts);
    const arm = rounded(armPts, R * 1.3);
    const at = (t: number) => along(arm, t);
    const wide = (ru: number, rv: number): [number, number] => [R * ru, R * rv];
    // inside the sleeve, the upper arm, either side of the elbow, the forearm to the wrist,
    // then the flat of the palm, the knuckles and the fingers to a tip
    const skinT = [0, tS, lerp(tS, tE, 0.5), lerp(tS, tE, 0.86), tE, lerp(tE, tW, 0.14), lerp(tE, tW, 0.55), tW, lerp(tW, 1, 0.25), lerp(tW, 1, 0.5), lerp(tW, 1, 0.82), 1, 1.001];
    const skinR: Array<[number, number]> = [wide(0.92, 0.92), wide(0.96, 0.94), wide(0.9, 0.88), wide(0.86, 0.84), wide(0.84, 0.82), wide(0.86, 0.82), wide(0.78, 0.7), wide(0.62, 0.52), wide(0.5, 0.86), wide(0.44, 1.0), wide(0.38, 0.88), wide(0.24, 0.62), [0.001, 0.001]];
    S.skin.loft(tube(skinT.map(at), skinR, out), 12);
    // the thumb leaves the front edge of the palm
    const pr = tube([at(lerp(tW, 1, 0.1)), at(lerp(tW, 1, 0.3))], [wide(0.5, 0.9), wide(0.5, 0.9)], out)[0];
    const thumbFrom = add(at(lerp(tW, 1, 0.16)), pr.v, -R * 0.7), thumbTo = add(add(thumbFrom, pr.v, -R * 0.5), hd, R * 0.8);
    S.skin.loft(tube([thumbFrom, mix(thumbFrom, thumbTo, 0.55), thumbTo, add(thumbTo, norm(sub(thumbTo, thumbFrom)), 0.004)], [wide(0.3, 0.28), wide(0.28, 0.26), wide(0.2, 0.2), [0.001, 0.001]], out), 8);
    // the sleeve: from inside the torso over the deltoid, down to a cuff at `sleeve`, then tucking inside the arm
    const cuff = lerp(lerp(tS, tE, 0.42), tW, p.sleeve);
    const sleeveT = [0, lerp(0, tS, 0.6), lerp(tS, cuff, 0.12), lerp(tS, cuff, 0.5), lerp(tS, cuff, 0.85), cuff, cuff + 0.012];
    const sleeveR: Array<[number, number]> = [wide(1.24, 1.16), wide(1.24, 1.16), wide(1.2, 1.12), wide(1.1, 1.06), wide(1.06, 1.03), wide(1.04, 1.01), wide(0.7, 0.7)];
    (sign < 0 ? S.sleeveL : S.sleeveR).loft(tube(sleeveT.map(at), sleeveR, out), 12);

    // ---- leg: from inside the pelvis to the ankle, one skin (the trousers), the knee rounded
    const Hp: V3 = [sign * p.hip * 0.6, 0.02, 0];
    const td = limb(q.hipFlex, q.hipSpread, sign);
    const K = add(Hp, td, thigh);
    const straight = limb(q.hipFlex - q.kneeFlex, q.hipSpread, sign);
    const crossed = norm([-sign, -0.12, 0.3]);
    const dir = norm(mix(straight, crossed, p.crossLegs));
    const F = add(K, dir, shin);
    const legPts: V3[] = [add(Hp, [-sign * p.hip * 0.35, 0.07, 0]), Hp, K, F];
    const [, tH, tK] = marks(legPts);
    const leg = rounded(legPts, R * 1.5);
    const lat = (t: number) => along(leg, t);
    const legT = [0, tH, lerp(tH, tK, 0.3), lerp(tH, tK, 0.6), lerp(tH, tK, 0.86), tK, lerp(tK, 1, 0.14), lerp(tK, 1, 0.5), lerp(tK, 1, 0.8), 1, 1.001];
    const legR: Array<[number, number]> = [wide(1.55, 1.45), wide(1.5, 1.4), wide(1.36, 1.3), wide(1.22, 1.18), wide(1.1, 1.08), wide(1.06, 1.04), wide(1.06, 1.02), wide(0.98, 0.94), wide(0.82, 0.8), wide(0.7, 0.68), wide(0.5, 0.5)];
    S.legs.loft(tube(legT.map(lat), legR, out), 12);
    // ---- shoe: a skin along the foot, flat on the ground, rising to the ankle at the back
    const ff = perp([0, 0, -1], dir);
    const up: V3 = [-dir[0], -dir[1], -dir[2]];
    const sole = add(F, dir, R * 1.45);
    const shoeX = [-0.95, -0.55, 0.2, 1.1, 1.95, 2.35];
    const shoeR: Array<[number, number]> = [[R * 0.001, R * 0.001], wide(0.92, 0.9), wide(1.05, 1.02), wide(1.12, 0.82), wide(0.96, 0.5), [0.001, 0.001]];
    const shoePts = shoeX.map((x, i) => add(add(sole, ff, x * R), up, shoeR[i][1] * (i === 0 ? 1.1 : 1)));
    // the frame's u is sideways, v is up: ru is the width and rv the height, so the sole stays flat
    S.shoes.loft(tube(shoePts, shoeR, [sign * ff[2], 0, -sign * ff[0]]), 12);
  }

  // the controller between both hands becomes the mouse under the right hand, then the trophy:
  // one capsule body (shrinks away as the cup grows), two grips that become the cup's handles,
  // a lathe cup and a base that grow from nothing inside the hand, and the green button that goes.
  const WL = wrists[-1], WR = wrists[1], fdR = foreDir[1];
  const ctrlA = mix(palms[-1], palms[1], 0.12), ctrlB = mix(palms[-1], palms[1], 0.88);
  const mouseA = add(palms[1], [0, -R * 0.75, 0.035]), mouseB = add(palms[1], [0, -R * 0.75, -0.035]);
  const grip = palms[1];
  const tr = p.trophy, held = p.held;
  const A = mix(ctrlA, mouseA, held), B = mix(ctrlB, mouseB, held);
  S.held.color('#FFFFFF').capsule(mix(A, grip, tr), mix(B, add(grip, fdR, 0.001), tr), lerp(lerp(R * 0.95, R * 0.75, held), 0.001, tr), 8, 2);
  // the cup stands upright in its own space; this turns that space to the forearm and carries it to the hand
  const axis0: V3 = [-fdR[2], 0, fdR[0]];
  const axis: V3 = Math.hypot(axis0[0], axis0[2]) < 1e-6 ? [1, 0, 0] : norm(axis0);
  const ang = Math.acos(Math.max(-1, Math.min(1, fdR[1]))) * tr;
  const toWorld = (v: V3): V3 => {
    const c = Math.cos(ang), sn = Math.sin(ang), t = 1 - c, dd = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
    return add(grip, [
      v[0] * c + (axis[1] * v[2] - axis[2] * v[1]) * sn + axis[0] * dd * t,
      v[1] * c + (axis[2] * v[0] - axis[0] * v[2]) * sn + axis[1] * dd * t,
      v[2] * c + (axis[0] * v[1] - axis[1] * v[0]) * sn + axis[2] * dd * t,
    ]);
  };
  const cupK = 0.001 + tr * 1.35;
  for (const sign of [-1, 1] as const) {
    const gripLen = lerp(R * 1.6, 0.001, held);
    const gripFrom = sign < 0 ? A : B, gripTo = add(gripFrom, norm([sign * 0.2, -0.75, 0.5]), gripLen);
    const hFrom = toWorld([sign * 0.048 * cupK, 0.13 * cupK, 0]), hTo = toWorld([sign * 0.085 * cupK, 0.09 * cupK, 0]);
    S.held.capsule(mix(gripFrom, hFrom, tr), mix(gripTo, hTo, tr), lerp(lerp(R * 0.6, 0.001, held), 0.006, tr), 6, 2);
  }
  const cupStart = S.held.count;
  S.held.lathe([[0.03, 0], [0.032, 0.012], [0.012, 0.02], [0.012, 0.06], [0.028, 0.075], [0.04, 0.1], [0.048, 0.14], [0.052, 0.17], [0.046, 0.172], [0.04, 0.16]].map(([r, y]) => [r * cupK, y * cupK]), 0, 0, 0, 1, 1, 0, 12);
  S.held.cylinder(0, 0.004 * cupK, 0, 0.038 * cupK, 0.008 * cupK, 12);
  S.held.rotateAxis([0, 0, 0], axis, ang, cupStart).translate(grip[0], grip[1], grip[2], cupStart);
  const mid = mix(A, B, 0.5);
  const br = lerp(R * 0.34, 0.001, Math.max(held, tr));
  S.held.color('#7AC142').sphere(mid[0], mid[1] + R * 0.7, mid[2], br, br * 0.5, br, 6, 3);
  void WL; void WR;

  const out = {} as Record<Part, Geo>;
  for (const name of PARTS) out[name] = S[name].rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z).out();
  return out;
}

// 2010: nine, cross-legged on the rug, controller in both hands, back to the camera.
export const KID: Figure = {
  height: 1.25, headR: 0.104, shoulder: 0.13, hip: 0.105, limbR: 0.034, hairTop: 0.9, sleeve: 0.12, tie: 0, held: 0, trophy: 0, glasses: 0, lanyard: 0, smile: 0.6,
  x: 0, y: 0.16, z: 0.55, yaw: 0, crossLegs: 1,
  pose: { hipFlex: 70, hipSpread: 55, kneeFlex: 125, shoulderFlex: 25, elbowFlex: 95, armSpread: 12, foreSpread: -30, torsoLean: 6, headTilt: 3, rShoulder: 0, rElbow: 0 },
};
// 2013: thirteen, still a kid, on the lab chair, white shirt and tie, right hand on the mouse.
export const TWEEN: Figure = {
  height: 1.48, headR: 0.108, shoulder: 0.155, hip: 0.12, limbR: 0.037, hairTop: 0.6, sleeve: 1, tie: 1, held: 1, trophy: 0, glasses: 0, lanyard: 0, smile: 0.4,
  x: 0.05, y: 0.5, z: -0.75, yaw: 0, crossLegs: 0,
  pose: { hipFlex: 90, hipSpread: 10, kneeFlex: 85, shoulderFlex: 18, elbowFlex: 74, armSpread: 8, foreSpread: -2, torsoLean: 8, headTilt: 8, rShoulder: 0, rElbow: 0 },
};
// 2018: seventeen, San Francisco, facing the camera, the Google Code-in trophy up in his right hand.
export const TEEN: Figure = {
  height: 1.72, headR: 0.11, shoulder: 0.19, hip: 0.135, limbR: 0.041, hairTop: 0.55, sleeve: 0.1, tie: 0, held: 1, trophy: 1, glasses: 1, lanyard: 1, smile: 1,
  x: 0.9, y: 0.86, z: 1.4, yaw: Math.PI, crossLegs: 0,
  pose: { hipFlex: 4, hipSpread: 7, kneeFlex: 3, shoulderFlex: 12, elbowFlex: 20, armSpread: 10, foreSpread: 4, torsoLean: 0, headTilt: -2, rShoulder: 140, rElbow: 12 },
};
