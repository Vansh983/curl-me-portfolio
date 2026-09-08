// The Halifax peninsula under the aircraft window, from OpenStreetMap (© OpenStreetMap contributors, ODbL).
// Every building, the streets, the parks and woods, the lakes, and the sea worked out from the coastline,
// in metres about the point the aircraft passes over with the campus abeam, in the aircraft's frame:
// x to starboard, z toward -ahead. The runtime extrudes the footprints (built.ts: halifax) and lays the
// water and the greens flat. The Goldberg building itself is the authored model (stage-flight-campus.py):
// the footprints under it are left out.
//   node scripts/stage-halifax.mjs            (uses .cache/osm/halifax.json when present)
//   node scripts/stage-halifax.mjs --fetch    (asks Overpass again)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ORIGIN = { lat: 44.6375, lon: -63.5832 }; // 350 m east of the Goldberg building: the campus abeam, the Northwest Arm beyond it
const HEADING = 340; // the aircraft's track, degrees from north: up the peninsula, the Arm and the campus on the port side
const GOLDBERG = { lat: 44.6375, lon: -63.5876 };
const BOX = '44.606,-63.640,44.668,-63.545';
const CACHE = '.cache/osm/halifax.json';
const OUT = 'src/lib/stage/halifax.json';
const RADIUS = 2500;

const query = `[out:json][timeout:300];
(
  way["building"](${BOX});
  relation["building"](${BOX});
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](${BOX});
  way["natural"="coastline"](${BOX});
  way["natural"="water"](${BOX});
  relation["natural"="water"](${BOX});
  way["leisure"="park"](${BOX});
  way["landuse"~"^(forest|cemetery|grass)$"](${BOX});
  way["natural"="wood"](${BOX});
);
out geom;`;

async function fetchOsm() {
  const hosts = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  for (const host of hosts) {
    try {
      const r = await fetch(host, { method: 'POST', body: new URLSearchParams({ data: query }), headers: { 'User-Agent': 'curl-me-portfolio stage-halifax' } });
      const text = await r.text();
      if (text.startsWith('{')) { mkdirSync('.cache/osm', { recursive: true }); writeFileSync(CACHE, text); return JSON.parse(text); }
      console.warn(host, 'answered', text.slice(0, 80).replace(/\s+/g, ' '));
    } catch (e) { console.warn(host, String(e)); }
  }
  throw new Error('no Overpass mirror answered');
}

const M_LAT = 111320, M_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const HR = (HEADING * Math.PI) / 180, fe = Math.sin(HR), fn = Math.cos(HR);
/** Metres about the origin in the aircraft's frame: x to starboard, z toward -ahead. */
const xz = (p) => {
  const e = (p.lon - ORIGIN.lon) * M_LON, n = (p.lat - ORIGIN.lat) * M_LAT;
  return [e * fn - n * fe, -(e * fe + n * fn)];
};
const num = (s) => { const m = /^(-?\d+(?:\.\d+)?)\s*(m|ft|')?/.exec(String(s ?? '').trim()); return m ? +m[1] * (m[2] && m[2] !== 'm' ? 0.3048 : 1) : NaN; };
const levels = (s) => { const parts = String(s ?? '').split(/[,;]/).map(Number).filter((v) => Number.isFinite(v)); return parts.length ? Math.max(...parts) + (parts.length > 1 ? 1 : 0) : NaN; };
/** Height from the tags, or a guess from the building's kind and footprint: Halifax is mostly two storeys of wood. */
const height = (t, area) => {
  const h = num(t.height); if (h > 0) return h;
  const l = levels(t['building:levels']); if (l > 0) return l * 3.1 + 1.2;
  const k = t.building;
  if (['apartments', 'dormitory', 'hotel'].includes(k)) return area > 900 ? 22 : 15;
  if (['university', 'college', 'school', 'hospital', 'church', 'public', 'civic', 'government'].includes(k)) return 14;
  if (['retail', 'commercial', 'office', 'industrial', 'warehouse'].includes(k)) return area > 800 ? 12 : 8;
  if (['garage', 'garages', 'shed', 'roof', 'carport', 'hut'].includes(k)) return 3;
  return area > 700 ? 11 : area > 260 ? 8.5 : 7; // a house, a duplex, a bigger block
};
const kindOf = (t) => {
  const k = t.building;
  if (['apartments', 'dormitory', 'hotel', 'retail', 'commercial', 'office', 'industrial', 'warehouse'].includes(k)) return 1; // rendered pale
  if (['university', 'college', 'school', 'hospital', 'church', 'public', 'civic', 'government'].includes(k)) return 2; // stone
  return 0; // wood, painted
};

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
const area = (ring) => Math.abs(ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const centroid = (ring) => ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
const r0 = (v) => Math.round(v);
const closeRing = (ring) => { if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop(); return ring; };

const osm = existsSync(CACHE) && !process.argv.includes('--fetch') ? JSON.parse(readFileSync(CACHE, 'utf8')) : await fetchOsm();
const goldberg = xz(GOLDBERG);
const buildings = [], roads = [], coast = [], lakes = [], greens = [];
const outerRings = (el) => el.type === 'way' ? (el.geometry ? [el.geometry.map(xz)] : []) : (el.members ?? []).filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry.map(xz));
for (const el of osm.elements) {
  const t = el.tags ?? {};
  if (t.natural === 'coastline') { if (el.geometry) coast.push(el.geometry.map(xz)); continue; }
  if (t.highway) { if (el.geometry) roads.push({ kind: t.highway, line: el.geometry.map(xz) }); continue; }
  if (t.natural === 'water' || t.leisure === 'park' || t.natural === 'wood' || t.landuse) {
    for (const ring of outerRings(el).map(closeRing)) if (ring.length >= 3) (t.natural === 'water' ? lakes : greens).push({ ring, wood: t.natural === 'wood' || t.landuse === 'forest' || t.landuse === 'cemetery' });
    continue;
  }
  if (!t.building) continue;
  for (const ring of outerRings(el).map(closeRing)) {
    if (ring.length < 3) continue;
    const a = area(ring), c = centroid(ring);
    buildings.push({ ring, a, c, h: height(t, a), kind: kindOf(t) });
  }
}

// ---- the sea: the coastline as walls on a 5 m grid, then a flood from the harbour and the Arm
const CELL = 5, N = Math.ceil((2 * RADIUS) / CELL), half = RADIUS;
const wall = new Uint8Array(N * N), water = new Uint8Array(N * N);
const cell = (p) => [Math.floor((p[0] + half) / CELL), Math.floor((p[1] + half) / CELL)];
const inGrid = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
for (const line of coast) for (let k = 0; k + 1 < line.length; k++) {
  const [i0, j0] = cell(line[k]), [i1, j1] = cell(line[k + 1]);
  const steps = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0), 1);
  for (let s = 0; s <= steps; s++) { const i = Math.round(i0 + ((i1 - i0) * s) / steps), j = Math.round(j0 + ((j1 - j0) * s) / steps); if (inGrid(i, j)) wall[j * N + i] = 1; }
}
const flood = (p) => {
  const [si, sj] = cell(p); if (!inGrid(si, sj) || wall[sj * N + si]) throw new Error(`seed on land ${p}`);
  const stack = [sj * N + si]; water[sj * N + si] = 1;
  while (stack.length) {
    const k = stack.pop(), i = k % N, j = (k - i) / N;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj; if (!inGrid(ni, nj)) continue;
      const nk = nj * N + ni; if (wall[nk] || water[nk]) continue;
      water[nk] = 1; stack.push(nk);
    }
  }
};
flood(xz({ lat: 44.632, lon: -63.556 })); // Halifax Harbour off the waterfront
flood(xz({ lat: 44.628, lon: -63.5904 })); // the Northwest Arm, mid-channel off Jubilee Road
// rows of water into rectangles, merged down the columns where the runs repeat
const rects = [];
const runs = [];
for (let j = 0; j < N; j++) {
  const row = [];
  for (let i = 0; i < N; i++) if (water[j * N + i]) { const last = row[row.length - 1]; if (last && last[1] === i - 1) last[1] = i; else row.push([i, i]); }
  runs.push(row);
}
const open = new Map(); // "i0,i1" -> { i0, i1, j0 }
for (let j = 0; j <= N; j++) {
  const row = j < N ? runs[j] : [], seen = new Set();
  for (const [i0, i1] of row) {
    const key = `${i0},${i1}`; seen.add(key);
    if (!open.has(key)) open.set(key, { i0, i1, j0: j });
  }
  for (const [key, r] of [...open]) if (!seen.has(key)) { rects.push([r.i0 * CELL - half, r.j0 * CELL - half, (r.i1 + 1) * CELL - half, j * CELL - half]); open.delete(key); }
}
const waterCells = water.reduce((s, v) => s + v, 0);
const onWater = (p) => { const [i, j] = cell(p); return inGrid(i, j) && water[j * N + i] === 1; };

// ---- what is kept: the whole city near the track, the bigger things further out
const kept = [];
for (const b of buildings) {
  const dist = Math.hypot(b.c[0], b.c[1]);
  if (dist > RADIUS) continue;
  if (b.h <= 3.5 || b.a < 28) continue;
  if (dist > 1000 && b.a < 120) continue; // the far city is texture: its bigger blocks only
  if (dist > 1600 && b.a < 350) continue;
  if (Math.hypot(b.c[0] - goldberg[0], b.c[1] - goldberg[1]) < 42) continue; // the model stands here
  if (onWater(b.c)) continue; // a wharf or a boathouse over the sea grid
  const ring = simplify(b.ring, dist < 900 ? 0.8 : 1.6, true);
  kept.push({ h: Math.round(b.h * 2) / 2, ...(b.kind ? { k: b.kind } : {}), p: ring.flatMap((p) => [r0(p[0]), r0(p[1])]) });
}
kept.sort((a, b) => b.h - a.h);
const WIDTH = { motorway: 16, trunk: 14, primary: 12, secondary: 10, tertiary: 8, residential: 6.5 };
const roadsOut = roads
  .filter((r) => r.kind !== 'residential' || r.line.some((p) => Math.hypot(p[0], p[1]) < 1500))
  .map((r) => ({ w: WIDTH[r.kind] ?? 7, p: simplify(r.line, 3, false).map((p) => [r0(p[0]), r0(p[1])]) }))
  .filter((r) => r.p.some((p) => Math.hypot(p[0], p[1]) < RADIUS))
  .map((r) => ({ w: r.w, p: r.p.flat() }));
const greensOut = greens
  .map((g) => ({ ...g, a: area(g.ring), c: centroid(g.ring) }))
  .filter((g) => g.a > 2500 && Math.hypot(g.c[0], g.c[1]) < RADIUS)
  .map((g) => ({ wood: g.wood ? 1 : 0, p: simplify(g.ring, 2.5, true).flatMap((p) => [r0(p[0]), r0(p[1])]) }));
const lakesOut = lakes
  .map((g) => ({ ...g, a: area(g.ring), c: centroid(g.ring) }))
  .filter((g) => g.a > 3000 && Math.hypot(g.c[0], g.c[1]) < RADIUS && !onWater(g.c))
  .map((g) => simplify(g.ring, 2, true).flatMap((p) => [r0(p[0]), r0(p[1])]));

const out = { source: 'OpenStreetMap contributors, ODbL', origin: [ORIGIN.lat, ORIGIN.lon], heading: HEADING, campus: goldberg.map(r0), buildings: kept, roads: roadsOut, water: rects, lakes: lakesOut, greens: greensOut };
writeFileSync(OUT, JSON.stringify(out));
const verts = kept.reduce((s, b) => s + b.p.length / 2, 0);
console.log(`${kept.length} buildings (${verts} corners), ${roadsOut.length} roads, ${rects.length} sea rectangles over ${((waterCells * CELL * CELL) / 1e6).toFixed(2)} km², ${lakesOut.length} lakes, ${greensOut.length} greens; ${(readFileSync(OUT).length / 1024).toFixed(0)} KB`);
