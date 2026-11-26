// A continuous distance along permanent landmarks. No paragraph triggers,
// hold periods, scene cuts or morph phases.
export function pathDistance(y: number, anchors: readonly number[], distances: readonly number[]): number {
  if (y <= anchors[0]) return distances[0];
  for (let i = 1; i < anchors.length; i++) {
    if (y <= anchors[i]) {
      const t = (y - anchors[i - 1]) / (anchors[i] - anchors[i - 1]);
      return distances[i - 1] + (distances[i] - distances[i - 1]) * t;
    }
  }
  return distances[distances.length - 1];
}

// Time-based damping keeps the walk independent of the phone's refresh rate.
export const follow = (current: number, target: number, dt: number) => current + (target - current) * (1 - Math.exp(-dt / 180));
