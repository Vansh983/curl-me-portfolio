// Scroll progress to a camera pose and morph influences. Pure.
import { CatmullRomCurve3, Vector3 } from 'three';
import { clamp01, locate } from '../lerp.ts';
import type { V3 } from './rig.ts';
import type { Station } from './world.ts';

export type Frame = { i: number; t: number; u: number; cam: V3; look: V3; fov: number; inf: number[] };

/**
 * Builds the shot for a list of stations.
 * @returns a function from stage progress q (0..1) to the camera pose and the
 * morph influences: inf[k] is the weight of station k+1 (station 0 is the base).
 */
export function makeShot(stations: Station[]): (q: number) => Frame {
  const n = stations.length;
  const pos = new CatmullRomCurve3(stations.map((s) => new Vector3(...s.cam)), false, 'centripetal');
  const look = new CatmullRomCurve3(stations.map((s) => new Vector3(...s.look)), false, 'centripetal');
  return (q) => {
    const { i, t } = locate(q, n);
    const j = Math.min(i + 1, n - 1);
    const u = n > 1 ? (i + t) / (n - 1) : 0;
    const inf = new Array(Math.max(0, n - 1)).fill(0);
    if (i >= 1) inf[i - 1] = 1 - t;
    if (i + 1 <= n - 1) inf[i] = t;
    return {
      i, t, u,
      cam: pos.getPoint(u).toArray() as V3,
      look: look.getPoint(u).toArray() as V3,
      fov: stations[i].fov + (stations[j].fov - stations[i].fov) * t,
      inf,
    };
  };
}

/** Section progress over all chapters to stage progress: station k sits on chapter k, then the camera holds. */
export const stageProgress = (p: number, chapters: number, stations: number) =>
  clamp01((p * (chapters - 1)) / Math.max(1, stations - 1));
