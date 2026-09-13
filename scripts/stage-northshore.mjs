// The North Shore mountains over Burrard Inlet from real elevation data (Mapzen Terrarium tiles, AWS open data,
// SRTM-derived): the strip from Cypress to Seymour behind Vancouver, sampled to a grid in metres about the
// Convention Centre West. Scene frame: real north toward -x (across the water from the terrace), real east toward +z.
//   node scripts/stage-northshore.mjs   (tiles cached in .cache/terrain)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
const ORIGIN = { lat: 49.2887, lon: -123.1170 }; // the Convention Centre West
const BOX = { lat: [49.30, 49.50], lon: [-123.36, -122.82] };
const Z = 12, N = 440, M = 180; // samples east-west, north-south
const OUT = 'src/lib/stage/northshore.json';
const tx = (lon) => Math.floor(((lon + 180) / 360) * 2 ** Z);
const ty = (lat) => { const r = (lat * Math.PI) / 180; return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z); };
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
// the grid in scene metres: x = -(north metres), z = +(east metres)
const east = (lon) => (lon - ORIGIN.lon) * kx, north = (lat) => (lat - ORIGIN.lat) * ky;
const out = { source: 'Mapzen Terrarium tiles (AWS open data, SRTM); ORIGIN the Convention Centre West', n: N, m: M,
  z: [east(BOX.lon[0]), east(BOX.lon[1])].map(Math.round), x: [-north(BOX.lat[1]), -north(BOX.lat[0])].map(Math.round), heights };
writeFileSync(OUT, JSON.stringify(out));
console.log('wrote', OUT, `${N}x${M}`, 'max', Math.round(max), 'm; x', out.x, 'z', out.z);
