// The drawn OSM ground, in exactly the same metre frame as HALIFAX.campus and flight.ts.
// Two 0.5 m/px tiles around Studley, one lower-resolution surround. They meet edge to edge;
// no overlapping planes, polygon offset, invented terrain or camera-dependent movement.
import map from './halifax-map.json' with { type: 'json' };
import { Sink, type V3, type UV } from './rig.ts';
import { piece, M } from './part.ts';

export const FLIGHT_MAP = map;

// The export faces 340°. Fly south along the peninsula, west of the bridge, with
// Goldberg 120 m off the port side and 35 m ahead at the end of the descent.
export const APPROACH_YAW = 183;
const yaw = APPROACH_YAW * Math.PI / 180;
export function flightPoint(mapX: number, mapZ: number): [number, number] {
  const x = mapX - map.campus[0], z = mapZ - map.campus[1];
  return [x * Math.cos(yaw) + z * Math.sin(yaw) - 120, -x * Math.sin(yaw) + z * Math.cos(yaw) - 35];
}

export function flightMap() {
  const r = map.heading * Math.PI / 180;
  const point = (e: number, n: number): V3 => [e * Math.cos(r) - n * Math.sin(r), 0, -(e * Math.sin(r) + n * Math.cos(r))];
  return map.tiles.map((tile, i) => {
    const s = new Sink(), [x0, y0, x1, y1] = tile.bounds;
    const quad = (a: number, b: number, c: number, d: number) => {
      const uv = (e: number, n: number): UV => [(e - x0) / (x1 - x0), (n - y0) / (y1 - y0)];
      s.quad(point(a, b), point(c, b), point(c, d), point(a, d), [uv(a, b), uv(c, b), uv(c, d), uv(a, d)]);
    };
    if (i === 0) {
      const [a, b, c, d] = map.detail;
      quad(x0, y0, x1, b); quad(x0, d, x1, y1); quad(x0, b, a, d); quad(c, b, x1, d);
    } else quad(x0, y0, x1, y1);
    return piece(s.out(), M(`flightMap${i}`));
  });
}
