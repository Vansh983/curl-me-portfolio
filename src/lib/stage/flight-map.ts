// The drawn OSM ground, in exactly the same metre frame as HALIFAX.campus and flight.ts.
// Two 0.5 m/px tiles on the port side of the descent, one lower-resolution surround. They meet edge to edge;
// no overlapping planes, polygon offset, invented terrain or camera-dependent movement.
import map from './halifax-map.json' with { type: 'json' };
import { Sink, type V3, type UV } from './rig.ts';
import { piece, M } from './part.ts';

export const FLIGHT_MAP = map;
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
