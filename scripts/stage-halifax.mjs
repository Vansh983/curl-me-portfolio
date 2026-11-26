// The Halifax peninsula under the aircraft window, from OpenStreetMap (© OpenStreetMap contributors, ODbL).
// Every building, the streets, the parks and woods, the lakes, and the sea worked out from the coastline,
// in metres about the point the aircraft passes over with the campus abeam, in the aircraft's frame:
// x to starboard, z toward -ahead. The runtime extrudes the footprints (built.ts: halifax) and lays the
// water and the greens flat. The Studley campus (Dalhousie and King's) is split out to dalhousie.json with
// names, kinds, the quad and the pitches, the footpaths, the car parks and the trees, for dalhousie.ts to build
// in detail; the Goldberg building itself is the authored model (stage-flight-campus.py): its footprint is left out.
//   node scripts/stage-halifax.mjs            (uses .cache/osm/*.json when present)
//   node scripts/stage-halifax.mjs --fetch    (asks Overpass again)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ORIGIN = { lat: 44.63892, lon: -63.58473 }; // 420 m east of University Avenue at the Arts Centre, over Robie Street: the whole Studley campus abeam out of the port window, Goldberg nearest, the Arm beyond
const HEADING = 340; // the aircraft's track, degrees from north: up the peninsula, the Arm and the campus on the port side
const GOLDBERG = { lat: 44.6375, lon: -63.5876 };
const BOX = '44.606,-63.640,44.668,-63.545';
const CACHE = '.cache/osm/halifax.json';
const OUT = 'src/lib/stage/halifax.json';
const CAMPUS_BOX = '44.6315,-63.6000,44.6415,-63.5790'; // Studley and King's, with the houses between
const CAMPUS_CACHE = '.cache/osm/dalhousie.json';
const CAMPUS_OUT = 'src/lib/stage/dalhousie.json';
/** The campus in the aircraft's frame: what dalhousie.ts builds, and what halifax.json leaves out. */
const CAMPUS = { x: [-1080, -190], z: [-235, 400] };
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

const campusQuery = `[out:json][timeout:120];
(
  way["highway"](${CAMPUS_BOX});
  node["natural"="tree"](${CAMPUS_BOX});
  way["leisure"](${CAMPUS_BOX});
  way["amenity"="parking"](${CAMPUS_BOX});
  relation["amenity"="university"](${CAMPUS_BOX});
  way["landuse"](${CAMPUS_BOX});
);
out geom;`;

async function fetchOsm(query, cache) {
  const hosts = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  for (const host of hosts) {
    try {
      const r = await fetch(host, { method: 'POST', body: new URLSearchParams({ data: query }), headers: { 'User-Agent': 'curl-me-portfolio stage-halifax' } });
      const text = await r.text();
      if (text.startsWith('{')) { mkdirSync('.cache/osm', { recursive: true }); writeFileSync(cache, text); return JSON.parse(text); }
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
const r1 = (v) => Math.round(v * 2) / 2;
const closeRing = (ring) => { if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop(); return ring; };

const fresh = process.argv.includes('--fetch');
const osm = existsSync(CACHE) && !fresh ? JSON.parse(readFileSync(CACHE, 'utf8')) : await fetchOsm(query, CACHE);
const osmCampus = existsSync(CAMPUS_CACHE) && !fresh ? JSON.parse(readFileSync(CAMPUS_CACHE, 'utf8')) : await fetchOsm(campusQuery, CAMPUS_CACHE);
const inCampus = (p) => p[0] > CAMPUS.x[0] && p[0] < CAMPUS.x[1] && p[1] > CAMPUS.z[0] && p[1] < CAMPUS.z[1];
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
    buildings.push({ ring, a, c, h: height(t, a), kind: kindOf(t), t, id: el.id });
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
  if (inCampus(b.c)) continue; // dalhousie.json has these, with their names
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

// ---- the campus: dalhousie.json, built in detail by dalhousie.ts
// OSM has the wings of Shirreff Hall, the Life Sciences Centre and Dalplex as unnamed ways inside a named relation
const relName = new Map();
for (const el of osm.elements) if (el.type === 'relation' && el.tags?.name && el.tags.building) for (const m of el.members ?? []) if (m.type === 'way') relName.set(m.ref, el.tags.name);
const HAND_NAMES = { 360737260: 'Henry Hicks Academic Administration Building' }; // unnamed in OSM; the clock tower at the head of the avenue
/** What the named buildings are made of, how tall, and their roofs: grey ironstone with slate hips is the old campus, concrete the sixties, brick the residences. */
const NAMED = [
  ['henry hicks', 'stone', 16, 'hip', 'tower'], ['killam', 'concrete', 21, 'flat'], ['weldon', 'concrete', 17, 'flat'], ['arts centre', 'concrete', 16, 'flat'],
  ['rowe management', 'glass', 18, 'flat'], ['student union', 'brick', 15, 'flat'], ['risley', 'brick', 21, 'flat'], ['lemarchant place', 'brick', 24, 'flat'],
  ['mccain', 'brick', 16, 'flat'], ['mona campbell', 'glass', 17, 'flat'], ['howe hall', 'stone', 18, 'hip'], ['studley gym', 'stone', 10, 'flat'],
  ['chemistry', 'stone', 18, 'flat'], ['dunn', 'stone', 14, 'hip'], ['macdonald building', 'stone', 15, 'hip'], ['university club', 'stone', 12, 'hip'],
  ['fountain school', 'stone', 14, 'hip'], ['steele ocean', 'glass', 20, 'flat'], ['chase', 'stone', 13, 'flat'], ['oulton-stanish', 'glass', 14, 'flat'],
  ['life sciences', 'concrete', 16, 'flat'], ['dalplex', 'dome', 12, 'dome'], ['shirreff', 'stone', 13, 'hip'], ["king's library", 'stone', 12, 'hip'],
  ['alexandra hall', 'stone', 15, 'hip'], ['arts & administration', 'stone', 15, 'hip'], ['new academic', 'stone', 12, 'flat'], ['muir gym', 'stone', 10, 'flat'],
  ['chapel bays', 'stone', 13, 'hip'], ['eddy houses', 'stone', 13, 'hip'], ['dining hall', 'stone', 10, 'hip'], ['henry house', 'stone', 10, 'hip'],
  ['lyall house', 'stone', 10, 'hip'], ['colpitt house', 'stone', 10, 'hip'], ['studley house', 'stone', 10, 'hip'], ['central services', 'concrete', 8, 'flat'],
  ['coburg place', 'brick', 52, 'flat'], ['the carlyle', 'brick', 32, 'flat'], ['lemarchant towers', 'brick', 32, 'flat'], ['capitol suites', 'brick', 22, 'flat'],
  ['glengary', 'brick', 11, 'flat'], ['croydon arms', 'brick', 11, 'flat'], ['health professions', 'concrete', 12, 'flat'], ['forrest', 'brick', 12, 'hip'], ['burbidge', 'stone', 12, 'hip'],
];
const campusBuildings = [];
for (const b of buildings) {
  if (!inCampus(b.c)) continue;
  const t = b.t, name = t.name || HAND_NAMES[b.id] || relName.get(b.id) || '';
  const lv = levels(t['building:levels']);
  const named = NAMED.find(([m]) => name.toLowerCase().includes(m));
  let kind, h, roof, extra;
  if (named) { [, kind, h, roof, extra] = named; if (lv > 0 && !['henry hicks', 'dalplex'].includes(named[0])) h = Math.max(h, lv * 3.4 + 1.2); }
  else if (['university', 'college', 'school', 'church', 'public', 'civic'].includes(t.building)) { kind = 'stone'; h = lv > 0 ? lv * 3.6 + 1.2 : 15; roof = 'flat'; }
  else if (t.building === 'dormitory') { kind = 'brick'; h = lv > 0 ? lv * 3.3 + 1 : 15; roof = 'flat'; }
  else if (['apartments', 'residential', 'yes', 'commercial', 'retail', 'office'].includes(t.building) && (lv >= 4 || b.a >= 380)) { kind = 'brick'; h = lv > 0 ? lv * 3.2 + 1 : 12; roof = 'flat'; }
  else if (['garage', 'garages', 'shed', 'roof', 'carport', 'hut'].includes(t.building)) { kind = 'house'; h = 3; roof = 'flat'; }
  else { kind = 'house'; h = lv > 0 ? lv * 3 + 0.5 : 6.5; roof = 'hip'; } // a painted wooden house, two storeys under a hip roof
  if (b.h <= 3.5 && kind !== 'house' || b.a < 24) continue;
  if (name.toLowerCase().includes('goldberg')) continue; // the authored model stands here
  const ring = simplify(b.ring, 0.4, true);
  campusBuildings.push({ ...(name ? { n: name } : {}), k: kind, h: r1(h), r: roof, ...(extra ? { x: extra } : {}), p: ring.flatMap((p) => [r1(p[0]), r1(p[1])]) });
}
campusBuildings.sort((a, b) => b.h - a.h);

const campusGreens = [], pitches = [], parking = [], paths = [], trees = [];
let campusRing = [];
const PATH = { footway: 2.4, path: 2, steps: 2.4, pedestrian: 4.5, cycleway: 2.5, service: 5 };
for (const el of osmCampus.elements) {
  const t = el.tags ?? {};
  if (el.type === 'node') { if (t.natural === 'tree') { const p = xz(el); if (inCampus(p)) trees.push([r1(p[0]), r1(p[1])]); } continue; }
  if (el.type === 'relation') {
    if (t.name === 'Dalhousie University Studley Campus') for (const ring of outerRings(el).map(closeRing)) if (ring.length > campusRing.length) campusRing = ring;
    continue;
  }
  if (!el.geometry) continue;
  const pts = el.geometry.map(xz);
  if (t.highway) {
    const w = PATH[t.highway]; if (!w || !pts.some(inCampus)) continue;
    paths.push({ w, ...(t.highway === 'service' ? { a: 1 } : {}), p: simplify(pts, 0.6, false).flatMap((p) => [r1(p[0]), r1(p[1])]) });
    continue;
  }
  const ring = closeRing(pts); if (ring.length < 3 || !inCampus(centroid(ring)) || area(ring) < 60) continue;
  const flat = simplify(ring, 0.6, true).flatMap((p) => [r1(p[0]), r1(p[1])]);
  if (t.leisure === 'pitch' || t.leisure === 'track') pitches.push({ s: t.sport ?? '', p: flat });
  else if (t.amenity === 'parking') parking.push(flat);
  else if (['park', 'garden', 'playground'].includes(t.leisure) || ['grass', 'recreation_ground', 'cemetery'].includes(t.landuse)) campusGreens.push({ ...(t.name ? { n: t.name } : {}), p: flat });
}
// trees the map does not have: a double row down the avenue's medians, a ring round the quad and the bigger lawns
const alongRing = (ring, step, inset) => {
  const out = [];
  const sign = ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) > 0 ? 1 : -1;
  let carry = step / 2;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l < 1e-6) continue;
    const nx = (-(b[1] - a[1]) / l) * sign * inset, nz = ((b[0] - a[0]) / l) * sign * inset;
    for (let d = carry; d < l; d += step) out.push([r1(a[0] + ((b[0] - a[0]) * d) / l + nx), r1(a[1] + ((b[1] - a[1]) * d) / l + nz)]);
    carry = ((carry - l) % step + step) % step;
  }
  return out;
};
const ringOfFlat = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
for (const g of campusGreens) {
  const ring = ringOfFlat(g.p), a = area(ring), c = centroid(ring);
  const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]), w = Math.max(...xs) - Math.min(...xs), d = Math.max(...zs) - Math.min(...zs);
  if (a < 2500 && Math.max(w, d) > 4 * Math.min(w, d)) { // a strip: the avenue's median, trees down its length in two rows
    const along = w > d ? 0 : 1, span = along ? d : w, lo = along ? Math.min(...zs) : Math.min(...xs);
    for (let s = 8, k = 0; s < span - 6; s += 13, k++) { const off = k % 2 ? 3.2 : -3.2; trees.push(along ? [r1(c[0] + off), r1(lo + s)] : [r1(lo + s), r1(c[1] + off)]); }
  } else if (a > 2500) trees.push(...alongRing(ring, g.n === 'Dalhousie Quad' ? 16 : 24, 5));
}
const campusOut = { source: 'OpenStreetMap contributors, ODbL', campus: campusRing.map((p) => [r1(p[0]), r1(p[1])]).flat(), buildings: campusBuildings, greens: campusGreens, pitches, parking, paths, trees };
writeFileSync(CAMPUS_OUT, JSON.stringify(campusOut));
console.log(`campus: ${campusBuildings.length} buildings (${campusBuildings.filter((b) => b.n).length} named), ${campusGreens.length} greens, ${pitches.length} pitches, ${parking.length} car parks, ${paths.length} paths, ${trees.length} trees; ${(readFileSync(CAMPUS_OUT).length / 1024).toFixed(0)} KB`);
