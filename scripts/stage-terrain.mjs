// Real elevation for a stage backdrop from Mapzen Terrarium tiles (AWS open data, SRTM-derived), sampled to a grid in
// metres about an origin, into src/lib/stage/<name>.json (the North Shore behind Vancouver, the Marin Headlands behind the
// Golden Gate). Scene frame: the grid rows run south to north (row 0 the south edge), the columns west to east.
//   node scripts/stage-terrain.mjs <name> <originLat> <originLon> <lat0> <lat1> <lon0> <lon1> <N> <M>   (tiles cached in .cache/terrain)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
const [name, oLat, oLon, lat0, lat1, lon0, lon1, n, m] = process.argv.slice(2);
const ORIGIN = { lat: +oLat, lon: +oLon }, BOX = { lat: [+lat0, +lat1], lon: [+lon0, +lon1] };
const Z = 12, N = +n, M = +m;
const OUT = `src/lib/stage/${name}.json`;
const tiles = new Map();
async function tile(x, y) {
  const key = `${x}_${y}`;
  if (tiles.has(key)) return tiles.get(key);
  const f = `.cache/terrain/${Z}_${key}.png`;
  if (!existsSync(f)) {
    mkdirSync('.cache/terrain', { recursive: true });
    const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`);
    if (!r.ok) throw new Error(`${r.status} tile ${x} ${y}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
  const t = { data, w: info.width, c: info.channels };
  tiles.set(key, t);
  return t;
}
async function elevation(lat, lon) {
  const fx = ((lon + 180) / 360) * 2 ** Z, r = (lat * Math.PI) / 180, fy = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z;
  const t = await tile(Math.floor(fx), Math.floor(fy));
  const px = Math.min(t.w - 1, Math.floor((fx % 1) * t.w)), py = Math.min(t.w - 1, Math.floor((fy % 1) * t.w));
  const o = (py * t.w + px) * t.c;
  return t.data[o] * 256 + t.data[o + 1] + t.data[o + 2] / 256 - 32768;
}
const kx = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180), ky = 110574;
const heights = [];
let max = 0;
for (let j = 0; j < M; j++) {
  const lat = BOX.lat[0] + ((BOX.lat[1] - BOX.lat[0]) * j) / (M - 1);
  const row = [];
  for (let i = 0; i < N; i++) {
    const lon = BOX.lon[0] + ((BOX.lon[1] - BOX.lon[0]) * i) / (N - 1);
    const h = Math.max(0, await elevation(lat, lon));
    row.push(Math.round(h));
    if (h > max) max = h;
  }
  heights.push(row);
}
// the grid in metres about the origin: east and north
const east = (lon) => (lon - ORIGIN.lon) * kx, north = (lat) => (lat - ORIGIN.lat) * ky;
const out = { source: `Mapzen Terrarium tiles (AWS open data, SRTM); ORIGIN ${ORIGIN.lat}, ${ORIGIN.lon}`, n: N, m: M,
  east: [east(BOX.lon[0]), east(BOX.lon[1])].map(Math.round), north: [north(BOX.lat[0]), north(BOX.lat[1])].map(Math.round), heights };
writeFileSync(OUT, JSON.stringify(out));
console.log('wrote', OUT, `${N}x${M}`, 'max', Math.round(max), 'm; east', out.east, 'north', out.north);
