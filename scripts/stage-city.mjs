// Downtown Toronto for the condo window, from OpenStreetMap (© OpenStreetMap contributors, ODbL).
// Fetches every building with a height (or a storey count) and every street in a 6 km box around
// the condo, projects them to metres about the condo, keeps what a 51st floor window looking south
// can see, simplifies the footprints, and writes src/lib/stage/toronto.json. The runtime extrudes
// the footprints (built.ts: city) and strings street lights along the roads. The CN Tower is left
// out: the runtime builds its tapered legs and pod itself, OSM's flat prisms do not read as it.
//   node scripts/stage-city.mjs            (uses .cache/osm/toronto.json when present)
//   node scripts/stage-city.mjs --fetch    (asks Overpass again)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CONDO = { lat: 43.64645, lon: -79.39157 }; // Front and Spadina: the tower 560 m off to the south-east, the dome at its foot, the lake behind
const FACING = 125; // the bearing the window looks along, degrees from north: the CN Tower 15 degrees right of it
const CN = { lat: 43.6426, lon: -79.3871 };
const BOX = '43.628,-79.425,43.692,-79.338';
const CACHE = '.cache/osm/toronto.json';
const OUT = 'src/lib/stage/toronto.json';

const query = `[out:json][timeout:180];
(
  way["building"]["height"](${BOX});
  way["building"]["building:levels"](${BOX});
  way["building:part"]["height"](${BOX});
  way["building:part"]["building:levels"](${BOX});
  relation["building"]["height"](${BOX});
  relation["building"]["building:levels"](${BOX});
  relation["building:part"]["height"](${BOX});
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](${BOX});
);
out geom;`;

async function fetchOsm() {
  const hosts = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  for (const host of hosts) {
    try {
      const r = await fetch(host, { method: 'POST', body: new URLSearchParams({ data: query }) });
      const text = await r.text();
      if (text.startsWith('{')) { mkdirSync('.cache/osm', { recursive: true }); writeFileSync(CACHE, text); return JSON.parse(text); }
      console.warn(host, 'answered', text.slice(0, 80).replace(/\s+/g, ' '));
    } catch (e) { console.warn(host, String(e)); }
  }
  throw new Error('no Overpass mirror answered');
}

const M_LAT = 111320, M_LON = 111320 * Math.cos((CONDO.lat * Math.PI) / 180);
const FR = (FACING * Math.PI) / 180, fe = Math.sin(FR), fn = Math.cos(FR); // forward in east, north
/** Metres about the condo in the window's frame: x to the right, z toward -ahead (the window looks toward -z). */
const xz = (p) => {
  const e = (p.lon - CONDO.lon) * M_LON, n = (p.lat - CONDO.lat) * M_LAT;
  return [e * fn - n * fe, -(e * fe + n * fn)];
};
const num = (s) => { const m = /^(-?\d+(?:\.\d+)?)\s*(m|ft|')?/.exec(String(s ?? '').trim()); return m ? +m[1] * (m[2] && m[2] !== 'm' ? 0.3048 : 1) : NaN; };
const height = (t) => { const h = num(t.height); if (h > 0) return h; const l = num(t['building:levels']); return l > 0 ? l * 3.1 + 1.5 : 0; };
const minHeight = (t) => { const h = num(t.min_height); if (h > 0) return h; const l = num(t['building:min_level']); return l > 0 ? l * 3.1 : 0; };

/** Douglas-Peucker on a ring or line, in metres. */
function simplify(pts, tol, closed) {
  if (pts.length < 3) return pts;
  const d2 = (p, a, b) => {
    const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz;
    const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0;
    return (p[0] - a[0] - t * vx) ** 2 + (p[1] - a[1] - t * vz) ** 2;
  };
  const dp = (i, j) => {
    let best = 0, k = -1;
    for (let m = i + 1; m < j; m++) { const d = d2(pts[m], pts[i], pts[j]); if (d > best) { best = d; k = m; } }
    return best > tol * tol ? [...dp(i, k), ...dp(k, j)] : [i];
  };
  if (closed) {
    let far = 0, best = 0;
    for (let m = 1; m < pts.length; m++) { const d = (pts[m][0] - pts[0][0]) ** 2 + (pts[m][1] - pts[0][1]) ** 2; if (d > best) { best = d; far = m; } }
    const idx = [...dp(0, far), ...dp(far, pts.length - 1)];
    const out = idx.map((i) => pts[i]);
    return out.length >= 3 ? out : pts;
  }
  return [...dp(0, pts.length - 1).map((i) => pts[i]), pts[pts.length - 1]];
}
const inside = (p, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const centroid = (ring) => ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
const r1 = (v) => Math.round(v * 10) / 10;

const osm = existsSync(CACHE) && !process.argv.includes('--fetch') ? JSON.parse(readFileSync(CACHE, 'utf8')) : await fetchOsm();
const rings = [], roads = [];
for (const el of osm.elements) {
  const t = el.tags ?? {};
  if (t.highway) { if (el.geometry) roads.push(el.geometry.map(xz)); continue; }
  const h = height(t); if (!(h > 0)) continue;
  const outers = el.type === 'way' ? (el.geometry ? [el.geometry.map(xz)] : []) : (el.members ?? []).filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map(xz));
  for (const ring of outers) {
    if (ring.length < 4) continue;
    if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop();
    const min = minHeight(t);
    rings.push({ ring, h: min >= h ? min + h : h, min, part: 'building:part' in t, name: t.name ?? '', c: centroid(ring), dome: t['roof:shape'] === 'dome' }); // the Rogers Centre roof: an ellipsoid cap, not an 86 m drum
  }
}
const cn = xz(CN);
const parts = rings.filter((r) => r.part);
const kept = [];
for (const r of rings) {
  const dist = Math.hypot(r.c[0], r.c[1]);
  if (r.c[1] > 60) continue; // behind the window
  if (dist > 2600) continue;
  if (Math.hypot(r.c[0] - cn[0], r.c[1] - cn[1]) < 45) continue; // the CN Tower: the runtime builds it
  const floor = dist < 400 ? 6 : dist < 1200 ? 24 : 70; // the near blocks whole, the far city only its towers
  if (r.h < floor) continue;
  if (!r.part && parts.some((p) => p !== r && p.h > r.h * 0.5 && inside(p.c, r.ring))) continue; // an outline whose parts stand in for it
  const ring = simplify(r.ring, dist < 700 ? 0.7 : 1.6, true);
  kept.push({ h: r1(r.h), min: r1(r.min), name: r.name, p: ring.flatMap((p) => [r1(p[0]), r1(p[1])]), ...(r.dome ? { dome: 1 } : {}) });
}
kept.sort((a, b) => b.h - a.h);
const roadsOut = roads
  .map((line) => simplify(line, 2.5, false).map((p) => [r1(p[0]), r1(p[1])]))
  .filter((line) => line.some((p) => p[1] < 120 && Math.hypot(p[0], p[1]) < 2600))
  .map((line) => line.flat());
const out = { source: 'OpenStreetMap contributors, ODbL', condo: [CONDO.lat, CONDO.lon], facing: FACING, cn: cn.map(r1), buildings: kept.map(({ name, ...b }) => b), roads: roadsOut };
writeFileSync(OUT, JSON.stringify(out));
const verts = kept.reduce((s, b) => s + b.p.length / 2, 0);
console.log(`${kept.length} buildings (${verts} corners, tallest ${kept.slice(0, 5).map((b) => `${b.name || '?'} ${b.h}`).join(', ')}), ${roadsOut.length} roads, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
