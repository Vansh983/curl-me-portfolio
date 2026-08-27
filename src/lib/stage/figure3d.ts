// One person, built by forward kinematics from joint angles. Every part has a fixed
// vertex count for every input, so two Figures are morph targets of each other.
// Faces -z at yaw 0. Pelvis at (x, y, z). Rounded: capsules for limbs, a lathe for the
// torso (textured: the shirt), spheres for head, hands and shoes, a cap for the hair.
import { Sink, type Geo, type V3 } from './rig.ts';

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

// torso profile: [radius factor, height factor] from hips to the top of the shoulders
const TORSO: [number, number][] = [[0.88, 0], [0.92, 0.3], [1, 0.62], [1.06, 0.84], [0.82, 0.96], [0.3, 1.0], [0.001, 1.03]];

/**
 * Builds every part of the figure.
 * @param p the figure params
 * @returns one geometry per part, fixed vertex counts
 */
export function figure(p: Figure): Record<Part, Geo> {
  const S = Object.fromEntries(PARTS.map((k) => [k, new Sink()])) as Record<Part, Sink>;
  const H = p.height, q = p.pose;
  const torsoLen = H * 0.3, thigh = H * 0.24, shin = H * 0.23, upper = H * 0.16, fore = H * 0.15, neckLen = H * 0.035;
  const lean = q.torsoLean * D, tilt = q.headTilt * D;
  const N: V3 = [0, torsoLen * Math.cos(lean), -torsoLen * Math.sin(lean)];
  const depth = p.hip * 0.62;

  S.shirt.lathe(TORSO.map(([r, y]) => [r, y * torsoLen]), 0, 0, 0, p.shoulder * 0.92, depth, Math.tan(lean), 14, [0, 0, 1, 1]);
  const neckTop = add(N, [0, neckLen, -neckLen * Math.tan(tilt)]);
  S.skin.capsule(add(N, [0, -0.01, 0]), neckTop, p.headR * 0.32, 8, 2);
  const head = add(neckTop, [0, Math.cos(tilt) * p.headR * 0.95, -Math.sin(tilt) * p.headR * 0.95]);
  S.skin.sphere(head[0], head[1], head[2], p.headR * 0.96, p.headR * 1.06, p.headR, 12, 8);
  // hair: a cap of a slightly bigger sphere, set back, coming down over the back of the head to the nape
  S.hair.sphere(head[0], head[1] + p.headR * 0.1, head[2] + p.headR * 0.12, p.headR * 1.04, p.headR * 1.1, p.headR * 1.08, 12, 8, undefined, 0.52 + 0.14 * p.hairTop);
  for (const sign of [-1, 1] as const) S.skin.sphere(head[0] + sign * p.headR * 0.97, head[1] - p.headR * 0.08, head[2] + p.headR * 0.04, p.headR * 0.13, p.headR * 0.2, p.headR * 0.09, 6, 4);
  // the face: eyes, brows, a mouth that smiles; glasses as thin rims; all on the -z side of the head
  const hr = p.headR, fz = head[2] - hr * 0.93;
  for (const sign of [-1, 1] as const) {
    S.face.sphere(head[0] + sign * hr * 0.34, head[1] + hr * 0.06, fz + hr * 0.02, hr * 0.075, hr * 0.09, hr * 0.05, 6, 4);
    S.face.bone([head[0] + sign * hr * 0.5, head[1] + hr * 0.3, fz], [head[0] + sign * hr * 0.18, head[1] + hr * 0.32, fz], hr * 0.015, hr * 0.025);
    // glasses: a rim of four bars around each eye, an arm back to the ear, a bridge between
    const g = p.glasses, ex = head[0] + sign * hr * 0.34, ey = head[1] + hr * 0.06, rw = hr * 0.2 * g + 0.0005, rh = hr * 0.16 * g + 0.0005, t = hr * 0.014 * g + 0.0003;
    S.glasses.bone([ex - rw, ey + rh, fz - 0.002], [ex + rw, ey + rh, fz - 0.002], t, t).bone([ex - rw, ey - rh, fz - 0.002], [ex + rw, ey - rh, fz - 0.002], t, t);
    S.glasses.bone([ex - rw, ey - rh, fz - 0.002], [ex - rw, ey + rh, fz - 0.002], t, t).bone([ex + rw, ey - rh, fz - 0.002], [ex + rw, ey + rh, fz - 0.002], t, t);
    S.glasses.bone([ex + sign * rw, ey + rh * 0.6, fz], [head[0] + sign * hr * 0.98 * g + (1 - g) * ex, ey + hr * 0.04, head[2] + hr * 0.02 * g + (1 - g) * fz], t, t);
  }
  S.glasses.bone([head[0] - hr * 0.14, head[1] + hr * 0.1, fz - 0.002], [head[0] + hr * 0.14, head[1] + hr * 0.1, fz - 0.002], hr * 0.012 * p.glasses + 0.0003, hr * 0.012 * p.glasses + 0.0003);
  const my = head[1] - hr * 0.38;
  S.face.box(head[0], my, fz + hr * 0.02, hr * 0.36, hr * 0.045, hr * 0.03);
  for (const sign of [-1, 1] as const) S.face.box(head[0] + sign * hr * 0.2, my + hr * 0.05 * p.smile, fz + hr * 0.03, hr * 0.06, hr * 0.045, hr * 0.03);
  // tie: hangs from the collar down the front
  const tieTop = add(N, [0, -0.015, -(depth + 0.008)]);
  S.tie.bone(tieTop, add(tieTop, [0, -Math.cos(lean), Math.sin(lean) * 0.2], 0.001 + torsoLen * 0.52 * p.tie), 0.001 + 0.018 * p.tie, 0.004);

  // lanyard from both sides of the neck to a badge on the chest
  const ly = p.lanyard, badgeC = add(N, [0, -torsoLen * 0.42 * ly - 0.02, -(depth + 0.01)]);
  for (const sign of [-1, 1] as const) S.lanyard.bone(add(N, [sign * p.headR * 0.3, 0, -depth * 0.6]), add(badgeC, [sign * 0.012, 0.03, 0.002]), 0.004 * ly + 0.0003, 0.002 * ly + 0.0003);
  const bw = 0.03 * ly + 0.0005, bh = 0.042 * ly + 0.0005;
  // wound to face -z, the front of the figure
  S.badge.quad([badgeC[0] + bw, badgeC[1] - bh, badgeC[2]], [badgeC[0] - bw, badgeC[1] - bh, badgeC[2]], [badgeC[0] - bw, badgeC[1] + bh, badgeC[2]], [badgeC[0] + bw, badgeC[1] + bh, badgeC[2]], [[0, 0], [1, 0], [1, 1], [0, 1]]);

  const wrists: Record<number, V3> = {};
  const foreDir: Record<number, V3> = {};
  for (const sign of [-1, 1] as const) {
    const Sh = add(N, [sign * p.shoulder, -0.015, 0]);
    const sf = q.shoulderFlex + (sign > 0 ? q.rShoulder : 0), ef = q.elbowFlex + (sign > 0 ? q.rElbow : 0);
    const E = add(Sh, limb(sf, q.armSpread, sign), upper);
    const fd = limb(sf + ef, q.armSpread * 0.5 + q.foreSpread, sign);
    const W = add(E, fd, fore);
    wrists[sign] = W;
    foreDir[sign] = fd;
    (sign < 0 ? S.sleeveL : S.sleeveR).capsule(Sh, E, p.limbR * 1.08, 8, 2);
    S.skin.capsule(E, W, p.limbR * 0.88, 8, 2);
    const hand = add(W, norm(mix(limb(sf + ef, q.foreSpread, sign), [0, -1, 0], 0.3)), p.limbR * 0.6);
    S.skin.sphere(hand[0], hand[1], hand[2], p.limbR * 1.15, p.limbR * 0.9, p.limbR * 1.25, 8, 5);

    const Hp: V3 = [sign * p.hip, 0, 0];
    const K = add(Hp, limb(q.hipFlex, q.hipSpread, sign), thigh);
    const straight = limb(q.hipFlex - q.kneeFlex, q.hipSpread, sign);
    const crossed = norm([-sign, -0.12, 0.3]);
    const dir = norm(mix(straight, crossed, p.crossLegs));
    const F = add(K, dir, shin);
    S.legs.capsule(Hp, K, p.limbR * 1.2, 8, 2);
    S.legs.capsule(K, F, p.limbR * 1.02, 8, 2);
    const foot = add(F, dir, p.limbR * 0.5);
    S.shoes.sphere(foot[0], foot[1], foot[2], p.limbR * 1.35, p.limbR * 0.95, p.limbR * 2.1, 8, 4);
  }

  // the controller between both hands becomes the mouse under the right hand, then the trophy:
  // one capsule body (shrinks away as the cup grows), two grips that become the cup's handles,
  // a lathe cup and a base that grow from nothing inside the hand, and the green button that goes.
  const WL = wrists[-1], WR = wrists[1], fdR = foreDir[1];
  const ctrlA = mix(WL, WR, 0.12), ctrlB = mix(WL, WR, 0.88);
  const mouseA = add(WR, [0, -p.limbR * 0.9, 0.035]), mouseB = add(WR, [0, -p.limbR * 0.9, -0.035]);
  const hand = add(WR, fdR, p.limbR * 0.6);
  const tr = p.trophy, held = p.held;
  const A = mix(ctrlA, mouseA, held), B = mix(ctrlB, mouseB, held);
  S.held.color('#FFFFFF').capsule(mix(A, hand, tr), mix(B, add(hand, fdR, 0.001), tr), lerp(lerp(p.limbR * 0.95, p.limbR * 0.75, held), 0.001, tr), 8, 2);
  // the cup stands upright in its own space; this turns that space to the forearm and carries it to the hand
  const axis0: V3 = [-fdR[2], 0, fdR[0]];
  const axis: V3 = Math.hypot(axis0[0], axis0[2]) < 1e-6 ? [1, 0, 0] : norm(axis0);
  const ang = Math.acos(Math.max(-1, Math.min(1, fdR[1]))) * tr;
  const toWorld = (v: V3): V3 => {
    const c = Math.cos(ang), sn = Math.sin(ang), t = 1 - c, dot = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
    return add(hand, [
      v[0] * c + (axis[1] * v[2] - axis[2] * v[1]) * sn + axis[0] * dot * t,
      v[1] * c + (axis[2] * v[0] - axis[0] * v[2]) * sn + axis[1] * dot * t,
      v[2] * c + (axis[0] * v[1] - axis[1] * v[0]) * sn + axis[2] * dot * t,
    ]);
  };
  const cupK = 0.001 + tr * 1.35;
  for (const sign of [-1, 1] as const) {
    const gripLen = lerp(p.limbR * 1.6, 0.001, held);
    const gripFrom = sign < 0 ? A : B, gripTo = add(gripFrom, norm([sign * 0.2, -0.75, 0.5]), gripLen);
    const hFrom = toWorld([sign * 0.048 * cupK, 0.13 * cupK, 0]), hTo = toWorld([sign * 0.085 * cupK, 0.09 * cupK, 0]);
    S.held.capsule(mix(gripFrom, hFrom, tr), mix(gripTo, hTo, tr), lerp(lerp(p.limbR * 0.6, 0.001, held), 0.006, tr), 6, 2);
  }
  const cupStart = S.held.count;
  S.held.lathe([[0.03, 0], [0.032, 0.012], [0.012, 0.02], [0.012, 0.06], [0.028, 0.075], [0.04, 0.1], [0.048, 0.14], [0.052, 0.17], [0.046, 0.172], [0.04, 0.16]].map(([r, y]) => [r * cupK, y * cupK]), 0, 0, 0, 1, 1, 0, 12);
  S.held.cylinder(0, 0.004 * cupK, 0, 0.038 * cupK, 0.008 * cupK, 12);
  S.held.rotateAxis([0, 0, 0], axis, ang, cupStart).translate(hand[0], hand[1], hand[2], cupStart);
  const mid = mix(A, B, 0.5);
  const br = lerp(p.limbR * 0.34, 0.001, Math.max(held, tr));
  S.held.color('#7AC142').sphere(mid[0], mid[1] + p.limbR * 0.7, mid[2], br, br * 0.5, br, 6, 3);

  const out = {} as Record<Part, Geo>;
  for (const name of PARTS) out[name] = S[name].rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z).out();
  return out;
}

// 2010: nine, cross-legged on the rug, controller in both hands, back to the camera.
export const KID: Figure = {
  height: 1.25, headR: 0.105, shoulder: 0.14, hip: 0.11, limbR: 0.036, hairTop: 0.9, tie: 0, held: 0, trophy: 0, glasses: 0, lanyard: 0, smile: 0.6,
  x: 0, y: 0.16, z: 0.55, yaw: 0, crossLegs: 1,
  pose: { hipFlex: 70, hipSpread: 55, kneeFlex: 125, shoulderFlex: 25, elbowFlex: 95, armSpread: 14, foreSpread: -28, torsoLean: 6, headTilt: 3, rShoulder: 0, rElbow: 0 },
};
// 2013: thirteen, still a kid, on the lab chair, white shirt and tie, right hand on the mouse.
export const TWEEN: Figure = {
  height: 1.48, headR: 0.1, shoulder: 0.165, hip: 0.125, limbR: 0.04, hairTop: 0.6, tie: 1, held: 1, trophy: 0, glasses: 0, lanyard: 0, smile: 0.4,
  x: 0.05, y: 0.5, z: -0.75, yaw: 0, crossLegs: 0,
  pose: { hipFlex: 90, hipSpread: 10, kneeFlex: 85, shoulderFlex: 18, elbowFlex: 74, armSpread: 8, foreSpread: -2, torsoLean: 8, headTilt: 8, rShoulder: 0, rElbow: 0 },
};
// 2018: seventeen, San Francisco, facing the camera, the Google Code-in trophy up in his right hand.
export const TEEN: Figure = {
  height: 1.72, headR: 0.1, shoulder: 0.2, hip: 0.14, limbR: 0.044, hairTop: 0.55, tie: 0, held: 1, trophy: 1, glasses: 1, lanyard: 1, smile: 1,
  x: 0.9, y: 0.86, z: 1.4, yaw: Math.PI, crossLegs: 0,
  pose: { hipFlex: 4, hipSpread: 7, kneeFlex: 3, shoulderFlex: 12, elbowFlex: 20, armSpread: 10, foreSpread: 4, torsoLean: 0, headTilt: -2, rShoulder: 140, rElbow: 12 },
};
