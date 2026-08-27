// One person, built by forward kinematics from joint angles. Every part has a fixed
// vertex count for every input, so two Figures are morph targets of each other.
// Faces -z at yaw 0. Pelvis at (x, y, z).
import { Sink, type V3 } from './rig.ts';

export type Pose = {
  hipFlex: number; // deg, thigh forward from straight down (90 = sitting)
  hipSpread: number; // deg, thighs out to the sides
  kneeFlex: number; // deg, shin folded back from the thigh line
  shoulderFlex: number; // deg, upper arm forward from straight down
  elbowFlex: number; // deg, forearm folded forward from the upper arm line
  armSpread: number; // deg, arms out to the sides
  torsoLean: number; // deg forward
  headTilt: number; // deg forward
};
export type Figure = {
  height: number; // metres standing
  headR: number;
  shoulder: number; // half width
  hip: number; // half width
  limbR: number; // limb half thickness
  hairTop: number; // 0..1
  tie: number; // 0..1
  x: number; y: number; z: number; // pelvis
  yaw: number; // radians, 0 faces -z
  crossLegs: number; // 0..1, shins cross inward (sitting on the floor)
  pose: Pose;
};
export const PARTS = ['skin', 'hair', 'shirt', 'legs', 'tie'] as const;
export type Part = (typeof PARTS)[number];

const D = Math.PI / 180;
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Limb direction from straight down: flex swings forward (-z), spread swings out (sign * x). */
const limb = (flex: number, spread: number, sign: number): V3 => {
  const f = flex * D, s = spread * D;
  return norm([sign * Math.sin(s), -Math.cos(f) * Math.cos(s), -Math.sin(f) * Math.cos(s)]);
};

export function figure(p: Figure): Record<Part, Float32Array> {
  const skin = new Sink(), hair = new Sink(), shirt = new Sink(), legs = new Sink(), tie = new Sink();
  const H = p.height, q = p.pose;
  const torsoLen = H * 0.3, thigh = H * 0.24, shin = H * 0.23, upper = H * 0.17, fore = H * 0.15;
  const P: V3 = [0, 0, 0];
  const lean = q.torsoLean * D;
  const N = add(P, [0, Math.cos(lean), -Math.sin(lean)], torsoLen);
  const depth = p.hip * 0.6;

  shirt.bone(P, N, p.shoulder * 0.85, depth);
  const tilt = q.headTilt * D;
  const head = add(N, [0, Math.cos(tilt) * p.headR * 1.15, -Math.sin(tilt) * p.headR * 1.15]);
  skin.sphere(head[0], head[1], head[2], p.headR, p.headR * 1.1, p.headR);
  hair.sphere(head[0], head[1] + p.headR * 0.35, head[2] + 0.01, p.headR * 1.03, p.headR * (0.3 + 0.55 * p.hairTop), p.headR * 1.03);
  tie.box(N[0], N[1] - torsoLen * 0.3, N[2] - depth - 0.006, 0.001 + 0.045 * p.tie, 0.001 + torsoLen * 0.55 * p.tie, 0.01);

  for (const sign of [-1, 1] as const) {
    const S = add(N, [sign * p.shoulder, -0.02, 0]);
    const E = add(S, limb(q.shoulderFlex, q.armSpread, sign), upper);
    const W = add(E, limb(q.shoulderFlex + q.elbowFlex, q.armSpread * 0.5, sign), fore);
    shirt.bone(S, E, p.limbR, p.limbR);
    skin.bone(E, W, p.limbR * 0.9, p.limbR * 0.9);
    skin.sphere(W[0], W[1], W[2], p.limbR * 1.1, p.limbR * 1.1, p.limbR * 1.1, 6, 4);

    const Hp = add(P, [sign * p.hip, 0, 0]);
    const K = add(Hp, limb(q.hipFlex, q.hipSpread, sign), thigh);
    const straight = limb(q.hipFlex - q.kneeFlex, q.hipSpread, sign);
    const crossed = norm([-sign, -0.15, 0.25]);
    const F = add(K, norm(mix(straight, crossed, p.crossLegs)), shin);
    legs.bone(Hp, K, p.limbR * 1.1, p.limbR * 1.1);
    legs.bone(K, F, p.limbR, p.limbR);
    legs.box(F[0], F[1] - p.limbR * 0.3, F[2] - p.limbR * 0.6, p.limbR * 1.8, p.limbR * 1.2, p.limbR * 2.8);
  }

  const out = {} as Record<Part, Float32Array>;
  for (const [name, s] of [['skin', skin], ['hair', hair], ['shirt', shirt], ['legs', legs], ['tie', tie]] as const) {
    s.rotateY(0, 0, p.yaw).translate(p.x, p.y, p.z);
    out[name] = s.out();
  }
  return out;
}

// 2010: nine, cross-legged on the rug, controller up, back to the camera.
export const KID: Figure = {
  height: 1.3, headR: 0.11, shoulder: 0.15, hip: 0.11, limbR: 0.038, hairTop: 0.8, tie: 0,
  x: 0, y: 0.17, z: 0.55, yaw: 0, crossLegs: 1,
  pose: { hipFlex: 75, hipSpread: 50, kneeFlex: 120, shoulderFlex: 20, elbowFlex: 95, armSpread: 12, torsoLean: 8, headTilt: 4 },
};
// 2013: thirteen, on a chair at the lab machine, white shirt and tie.
export const TEEN: Figure = {
  height: 1.55, headR: 0.105, shoulder: 0.18, hip: 0.13, limbR: 0.042, hairTop: 0.5, tie: 1,
  x: 0.05, y: 0.5, z: -0.75, yaw: 0, crossLegs: 0,
  pose: { hipFlex: 90, hipSpread: 8, kneeFlex: 90, shoulderFlex: 35, elbowFlex: 75, armSpread: 8, torsoLean: 6, headTilt: 6 },
};
