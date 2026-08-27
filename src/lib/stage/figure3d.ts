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
  x: number; y: number; z: number; // pelvis
  yaw: number; // radians, 0 faces -z
  crossLegs: number; // 0..1, shins cross inward (sitting on the floor)
  pose: Pose;
}
export const PARTS = ['skin', 'hair', 'shirt', 'sleeveL', 'sleeveR', 'legs', 'shoes', 'tie', 'held'] as const;
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
  const S: Record<Part, Sink> = { skin: new Sink(), hair: new Sink(), shirt: new Sink(), sleeveL: new Sink(), sleeveR: new Sink(), legs: new Sink(), shoes: new Sink(), tie: new Sink(), held: new Sink() };
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
  // tie: hangs from the collar down the front
  const tieTop = add(N, [0, -0.015, -(depth + 0.008)]);
  S.tie.bone(tieTop, add(tieTop, [0, -Math.cos(lean), Math.sin(lean) * 0.2], 0.001 + torsoLen * 0.52 * p.tie), 0.001 + 0.018 * p.tie, 0.004);

  const wrists: Record<number, V3> = {};
  for (const sign of [-1, 1] as const) {
    const Sh = add(N, [sign * p.shoulder, -0.015, 0]);
    const E = add(Sh, limb(q.shoulderFlex, q.armSpread, sign), upper);
    const W = add(E, limb(q.shoulderFlex + q.elbowFlex, q.armSpread * 0.5 + q.foreSpread, sign), fore);
    wrists[sign] = W;
    (sign < 0 ? S.sleeveL : S.sleeveR).capsule(Sh, E, p.limbR * 1.08, 8, 2);
    S.skin.capsule(E, W, p.limbR * 0.88, 8, 2);
    const hand = add(W, norm(mix(limb(q.shoulderFlex + q.elbowFlex, q.foreSpread, sign), [0, -1, 0], 0.3)), p.limbR * 0.6);
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

  // the controller between both hands becomes the mouse under the right hand
  const WL = wrists[-1], WR = wrists[1];
  const ctrlA = mix(WL, WR, 0.12), ctrlB = mix(WL, WR, 0.88);
  const mouseA = add(WR, [0, -p.limbR * 0.9, 0.035]), mouseB = add(WR, [0, -p.limbR * 0.9, -0.035]);
  const A = mix(ctrlA, mouseA, p.held), B = mix(ctrlB, mouseB, p.held);
  S.held.color('#FFFFFF').capsule(A, B, lerp(p.limbR * 0.95, p.limbR * 0.75, p.held), 8, 2);
  for (const [end, sign] of [[A, -1], [B, 1]] as const) {
    const gripLen = lerp(p.limbR * 1.6, 0.001, p.held);
    S.held.capsule(end, add(end, norm([sign * 0.2, -0.75, 0.5]), gripLen), lerp(p.limbR * 0.6, 0.001, p.held), 6, 2);
  }
  const mid = mix(A, B, 0.5);
  const br = lerp(p.limbR * 0.34, 0.001, p.held);
  S.held.color('#7AC142').sphere(mid[0], mid[1] + p.limbR * 0.7, mid[2], br, br * 0.5, br, 6, 3);

  const out = {} as Record<Part, Geo>;
  for (const name of PARTS) out[name] = S[name].rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z).out();
  return out;
}

// 2010: nine, cross-legged on the rug, controller in both hands, back to the camera.
export const KID: Figure = {
  height: 1.25, headR: 0.105, shoulder: 0.14, hip: 0.11, limbR: 0.036, hairTop: 0.9, tie: 0, held: 0,
  x: 0, y: 0.16, z: 0.55, yaw: 0, crossLegs: 1,
  pose: { hipFlex: 70, hipSpread: 55, kneeFlex: 125, shoulderFlex: 25, elbowFlex: 95, armSpread: 14, foreSpread: -28, torsoLean: 6, headTilt: 3 },
};
// 2013: thirteen, still a kid, on the lab chair, white shirt and tie, right hand on the mouse.
export const TWEEN: Figure = {
  height: 1.48, headR: 0.1, shoulder: 0.165, hip: 0.125, limbR: 0.04, hairTop: 0.6, tie: 1, held: 1,
  x: 0.05, y: 0.5, z: -0.75, yaw: 0, crossLegs: 0,
  pose: { hipFlex: 90, hipSpread: 10, kneeFlex: 85, shoulderFlex: 18, elbowFlex: 74, armSpread: 8, foreSpread: -2, torsoLean: 8, headTilt: 8 },
};
