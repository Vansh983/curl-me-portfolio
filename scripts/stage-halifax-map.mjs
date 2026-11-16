// A flat, reproducible drawing of Halifax, in stage-halifax.mjs's unchanged metre/heading frame.
// node scripts/stage-halifax-map.mjs [--fetch]
// Only --fetch uses the network: the same Overpass mirrors as stage-halifax.mjs. Otherwise use the
// cached extract, or the shipped, losslessly compressed OSM geometry snapshot. No invented geography.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const ROOT = 'public/assets/stage/halifax-map';
const CACHE = '.cache/osm/halifax-drawn.json';
const BOX = [44.57, -63.72, 44.76, -63.47]; // south, west, north, east; both shores and all of Bedford Basin
const old = JSON.parse(readFileSync('src/lib/stage/halifax.json', 'utf8'));
const [LAT, LON] = old.origin, MLAT = 111320, MLON = MLAT * Math.cos(LAT * Math.PI / 180);
const heading = old.heading * Math.PI / 180;
const en = (p) => [(p.lon - LON) * MLON, (p.lat - LAT) * MLAT];
const xz = ([e, n]) => [e * Math.cos(heading) - n * Math.sin(heading), -(e * Math.sin(heading) + n * Math.cos(heading))];
const bounds = [(BOX[1] - LON) * MLON, (BOX[0] - LAT) * MLAT, (BOX[3] - LON) * MLON, (BOX[2] - LAT) * MLAT];
const COAST_BOX = [44.54, -63.75, 44.79, -63.44]; // margin: join the shore before clipping the picture
const QUERY = `[out:json][timeout:300];(way["natural"="coastline"](${COAST_BOX});nwr["building"](${BOX});way["highway"](${BOX});nwr["natural"~"^(water|wood|wetland|scrub|grassland|beach)$"](${BOX});nwr["landuse"](${BOX});nwr["leisure"~"^(park|garden|pitch|nature_reserve|common)$"](${BOX});nwr["man_made"~"^(pier|bridge|breakwater)$"](${BOX}););out geom;`;
mkdirSync(ROOT, { recursive: true });
mkdirSync('.cache/halifax-drawn', { recursive: true });
if (process.argv.includes('--fetch')) {
  let ok = false;
  for (const host of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
    try {
      const r = await fetch(host, { method: 'POST', body: new URLSearchParams({ data: QUERY }), signal: AbortSignal.timeout(360000), headers: { 'User-Agent': 'curl-me-portfolio stage-halifax' } });
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      const text = await r.text(), d = JSON.parse(text);
      if (d.remark) throw Error(d.remark);
      mkdirSync('.cache/osm', { recursive: true }); writeFileSync(CACHE, text); ok = true; break;
    } catch (e) { console.warn(host, e.message); }
  }
  if (!ok) throw Error('No complete Overpass response. Keep the previous map.');
}
let source;
if (existsSync(CACHE)) {
  const raw = JSON.parse(readFileSync(CACHE, 'utf8'));
  if (raw.remark) throw Error(raw.remark);
  const tags = ['name', 'building', 'highway', 'width', 'lanes', 'tunnel', 'bridge', 'natural', 'landuse', 'leisure', 'man_made', 'area'];
  source = { source: '© OpenStreetMap contributors, ODbL 1.0', timestamp: raw.osm3s.timestamp_osm_base, coastTimestamp: raw.flightMapCoastTimestamp ?? raw.osm3s.timestamp_osm_base, query: QUERY,
    elements: raw.elements.filter((e) => e.type !== 'node').map((e) => ({ type: e.type, id: e.id,
      tags: Object.fromEntries(tags.filter((t) => e.tags?.[t] !== undefined).map((t) => [t, e.tags[t]])),
      ...(e.geometry ? { geometry: e.geometry } : {}), ...(e.members ? { members: e.members.filter((m) => m.type === 'way').map((m) => ({ ref: m.ref, role: m.role, geometry: m.geometry })) } : {}),
    })) };
} else source = JSON.parse(gunzipSync(readFileSync(`${ROOT}/source.json.gz`)));
const elements = source.elements;
const key = (p) => `${p.lat},${p.lon}`;
const same = (a, b) => key(a) === key(b);

// Join at shared OSM endpoints, never by proximity. Coast direction is preserved (land on its left).
function join(lines, directed = false) {
  const out = lines.map((r) => [...r]);
  let more = true;
  while (more) {
    more = false;
    const ends = new Map();
    out.forEach((r, i) => { ends.set(`s:${key(r[0])}`, i); if (!directed) ends.set(`e:${key(r.at(-1))}`, i); });
    for (let i = 0; i < out.length; i++) {
      const r = out[i]; if (same(r[0], r.at(-1))) continue;
      let j = ends.get(`s:${key(r.at(-1))}`), reverse = false;
      if (j === undefined && !directed) { j = ends.get(`e:${key(r.at(-1))}`); reverse = true; }
      if (j !== undefined && j !== i) { r.push(...(reverse ? out[j].toReversed() : out[j]).slice(1)); out.splice(j, 1); more = true; break; }
    }
  }
  return out;
}
const num = (n) => +n.toFixed(3); // millimetres in the source's metre frame, no simplification
const path = (r, close = true) => `M${r.map(([e, n]) => `${num(e)},${num(-n)}`).join('L')}${close ? 'Z' : ''}`;
const polygon = (el) => {
  if (el.type === 'way') return el.geometry && same(el.geometry[0], el.geometry.at(-1)) ? [el.geometry.map(en)] : [];
  const rings = ['outer', 'inner'].flatMap((role) => join((el.members ?? []).filter((m) => (m.role || 'outer') === role && m.geometry).map((m) => m.geometry)));
  if (rings.some((r) => !same(r[0], r.at(-1)))) throw Error(`Incomplete OSM polygon ${el.type}/${el.id}; do not guess its closure.`);
  return rings.map((r) => r.map(en));
};

// Keep a coastal chain whole when it leaves and re-enters the extract. Closing each clipped
// fragment independently would fill the harbour. All artificial closure stays OUTSIDE the extract.
const [X0, Y0, X1, Y1] = bounds, W = X1 - X0, H = Y1 - Y0;
const land = [], shoreline = [];
for (const line of join(elements.filter((e) => e.tags.natural === 'coastline').map((e) => e.geometry), true)) {
  const r = line.map(en);
  if (same(line[0], line.at(-1))) { land.push(r); shoreline.push(r); continue; }
  if (!r.some(([e, n]) => e >= X0 && e <= X1 && n >= Y0 && n <= Y1)) continue;
  const x0 = Math.min(X0, ...r.map((p) => p[0])) - 100, y0 = Math.min(Y0, ...r.map((p) => p[1])) - 100;
  const x1 = Math.max(X1, ...r.map((p) => p[0])) + 100, y1 = Math.max(Y1, ...r.map((p) => p[1])) + 100;
  const w = x1 - x0, h = y1 - y0, perimeter = 2 * (w + h);
  const exterior = ([e, n]) => {
    if (n < Y0) return [[e, y0], e - x0];
    if (e > X1) return [[x1, n], w + n - y0];
    if (n > Y1) return [[e, y1], w + h + x1 - e];
    if (e < X0) return [[x0, n], 2 * w + h + y1 - n];
    throw Error('A coastline ends inside the extract. Do not invent its continuation.');
  };
  const [a, start] = exterior(r[0]), [b, end] = exterior(r.at(-1)), finish = start <= end ? start + perimeter : start;
  shoreline.push([...r]); r.push(b);
  for (const [t, p] of [[w, [x1, y0]], [w + h, [x1, y1]], [2 * w + h, [x0, y1]], [perimeter, [x0, y0]], [perimeter + w, [x1, y0]], [perimeter + w + h, [x1, y1]], [perimeter + 2 * w + h, [x0, y1]]]) if (t > end && t < finish) r.push(p);
  r.push(a); land.push(r);
}
// The same two sea seeds used by stage-halifax.mjs catch a reversed coast or a false boundary closure.
const contains = (ring, p) => {
  let inRing = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inRing = !inRing;
  }
  return inRing;
};
for (const p of [{ lat: 44.632, lon: -63.556 }, { lat: 44.628, lon: -63.5904 }]) {
  if (land.some((ring) => contains(ring, en(p)))) throw Error('Coastline closure covers a known sea seed; extend the coastline query, do not guess.');
}

const required = [373834324, 3813085, 4138857, 342871411, 342871412, 1448304973, 1449662840, 6707202, 17203102, 9435813];
for (const id of required) if (!elements.some((e) => e.id === id)) throw Error(`Missing required mapped landmark ${id}`);
const goldberg = elements.find((e) => e.id === 373834324);
const memberBuildings = new Set(elements.filter((e) => e.type === 'relation' && e.tags.building).flatMap((e) => e.members.map((m) => m.ref)));
const omittedBuildingWays = elements.filter((e) => e.tags.building && e.geometry && !same(e.geometry[0], e.geometry.at(-1)) && !memberBuildings.has(e.id)).map((e) => e.id);
if (omittedBuildingWays.length) console.warn('Unclosed building footprints omitted, never closed by guess:', omittedBuildingWays.join(', '));
const fills = [], water = [], buildings = [], bridges = [], roads = [], piers = [];
const P = { land: '#cecbb5', urban: '#dad2bf', industrial: '#c8bfab', green: '#a4b394', wood: '#8caa91', pitch: '#aabb93', sand: '#d6c9a9', roof: '#b4aa97', civic: '#c9bda4', goldberg: '#8c9b9a', road: '#eee3cb', roadEdge: '#b6ad99', water: '#7e9fa0' };
for (const e of elements) {
  const t = e.tags;
  if (t.natural === 'coastline') continue;
  if (t.highway && e.geometry && t.tunnel !== 'yes') { roads.push(e); continue; }
  const rings = polygon(e); if (!rings.length) { if (['pier', 'breakwater'].includes(t.man_made) && e.geometry) piers.push(e); continue; }
  const d = rings.map((r) => path(r)).join('');
  if (t.building && t.building !== 'no') {
    if (e.type === 'way' && memberBuildings.has(e.id)) continue;
    buildings.push({ d, color: e.id === goldberg.id ? P.goldberg : ['university', 'hospital', 'school', 'church'].includes(t.building) ? P.civic : P.roof });
  } else if (t.natural === 'water' || t.landuse === 'reservoir') water.push(d);
  else if (t.man_made === 'bridge') bridges.push(d);
  else {
    const color = t.natural === 'beach' ? P.sand : ['wood', 'scrub'].includes(t.natural) || t.landuse === 'forest' ? P.wood
      : t.leisure === 'pitch' ? P.pitch : t.leisure || ['grass', 'cemetery', 'recreation_ground', 'meadow', 'allotments'].includes(t.landuse) || ['grassland', 'wetland'].includes(t.natural) ? P.green
      : ['industrial', 'railway', 'commercial', 'retail', 'construction'].includes(t.landuse) || t.man_made ? P.industrial : P.urban;
    fills.push({ d, color, area: Math.abs(rings[0].reduce((s, p, i, a) => { const q = a[(i + 1) % a.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) });
  }
}
fills.sort((a, b) => b.area - a.area);
const roadWidth = (t) => Number.parseFloat(t.width) || ({ motorway: 11, motorway_link: 6, trunk: 10, trunk_link: 6, primary: 10, primary_link: 6, secondary: 9, tertiary: 8, residential: 6, unclassified: 6, service: 3.5, pedestrian: 3, footway: 1.5, path: 1.3, cycleway: 2, steps: 1.5, track: 2.5, living_street: 4 }[t.highway] ?? 2);
const roadPaths = (list, edge) => list.map((e) => `<path d="${path(e.geometry.map(en), false)}" stroke-width="${roadWidth(e.tags) + (edge ? 1.2 : 0)}"/>`).join('');
roads.sort((a, b) => roadWidth(a.tags) - roadWidth(b.tags));
const bridgeRoads = roads.filter((e) => e.tags.bridge && e.tags.bridge !== 'no');
const normalRoads = roads.filter((e) => !bridgeRoads.includes(e));
const sourceJson = JSON.stringify(source);
const manifest = { source: source.source, timestamp: source.timestamp, coastTimestamp: source.coastTimestamp, sha256: createHash('sha256').update(sourceJson).digest('hex'), origin: old.origin, heading: old.heading, campus: old.campus,
  bounds, detail: [-2048, -2048, 0, 2048], omittedBuildingWays, tiles: [] };

// The sun is a drawing direction (WSW), not new scene lighting. Shadows use one small soft offset;
// they claim no surveyed building heights. Water sheen is clipped to mapped water, without noise.
const svgBody = `<defs><linearGradient id="sea" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#c3b68e"/><stop offset=".45" stop-color="${P.water}"/><stop offset="1" stop-color="#729395"/></linearGradient><filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter></defs>
<rect x="${X0}" y="${-Y1}" width="${W}" height="${H}" fill="url(#sea)"/>
<g fill="${P.land}" fill-rule="nonzero">${land.map((r) => `<path d="${path(r)}"/>`).join('')}</g>
<g fill-rule="evenodd">${fills.map(({ d, color }) => `<path d="${d}" fill="${color}"/>`).join('')}</g>
<g fill="${P.water}" fill-rule="evenodd">${water.map((d) => `<path d="${d}"/>`).join('')}</g>
<g fill="none" stroke="#bbc6b0" stroke-width="1.5">${shoreline.map((r) => `<path d="${path(r, false)}"/>`).join('')}</g>
<g fill="none" stroke-linejoin="round" stroke-linecap="round" stroke="${P.roadEdge}">${roadPaths(normalRoads, true)}</g>
<g fill="none" stroke-linejoin="round" stroke-linecap="round" stroke="${P.road}">${roadPaths(normalRoads, false)}</g>
<g fill="none" stroke="${P.industrial}" stroke-width="4">${piers.map((e) => `<path d="${path(e.geometry.map(en), false)}"/>`).join('')}</g>
<g fill="#655f54" opacity=".22" transform="translate(6,-3)" filter="url(#soft)">${buildings.map(({ d }) => `<path d="${d}" fill-rule="evenodd"/>`).join('')}</g>
<g stroke="#dbd0b7" stroke-width=".65" fill-rule="evenodd" stroke-linejoin="round">${buildings.map(({ d, color }) => `<path d="${d}" fill="${color}"/>`).join('')}</g>
<g fill="#c9c6b0" stroke="#9a9b8c" stroke-width="1.5">${bridges.map((d) => `<path d="${d}"/>`).join('')}</g>
<g fill="none" stroke="${P.roadEdge}" stroke-linecap="round">${roadPaths(bridgeRoads, true)}</g><g fill="none" stroke="${P.road}" stroke-linecap="round">${roadPaths(bridgeRoads, false)}</g>`;
const render = async (name, b, width) => {
  const height = Math.round(width * (b[3] - b[1]) / (b[2] - b[0]));
  // Bound the shadow intermediate to this tile plus its blur margin, rather than rasterising the
  // whole 20 km extract at the near tile's resolution. Geography and the shadow itself are unchanged.
  const body = svgBody.replace('<filter id="soft" x="-10%" y="-10%" width="120%" height="120%">', `<filter id="soft" filterUnits="userSpaceOnUse" x="${b[0] - 20}" y="${-b[3] - 20}" width="${b[2] - b[0] + 40}" height="${b[3] - b[1] + 40}">`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${b[0]} ${-b[3]} ${b[2] - b[0]} ${b[3] - b[1]}">${body}</svg>`;
  await sharp(Buffer.from(svg), { limitInputPixels: false }).webp({ quality: 94, effort: 6 }).toFile(`${ROOT}/${name}.webp`);
  manifest.tiles.push({ name, bounds: b, width, height });
  console.log(name, width, height);
};
await render('far', bounds, 3072);
for (let row = 0; row < 2; row++) {
  const e = -2048, n = -2048 + row * 2048;
  await render(`near-${row}-0`, [e, n, e + 2048, n + 2048], 4096);
}
writeFileSync(`${ROOT}/source.json.gz`, gzipSync(sourceJson, { level: 9 }));
writeFileSync('src/lib/stage/halifax-map.json', JSON.stringify(manifest, null, 2) + '\n');
writeFileSync('.cache/halifax-drawn/map.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="${Math.round(1536 * H / W)}" viewBox="${X0} ${-Y1} ${W} ${H}">${svgBody}</svg>`);
console.log(JSON.stringify({ buildings: buildings.length, roads: roads.length, landPolygons: land.length, greensAndLanduse: fills.length, bridges: bridges.length, goldberg: { id: goldberg.id, footprint: goldberg.geometry.map(en).map(xz), campus: old.campus }, snapshot: source.timestamp }));
