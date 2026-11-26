// The slide on Volta's screen, from Collect.'s own artwork: node scripts/look/collect.mjs
// He asked for just Collect., with Socratica's logo (2026-10-02): Collect. is Halifax's Socratica node.
// The originals are not in the repository; they sit in .cache/collect/ (the first is fetched when missing):
//   calendar.png        Collect.'s banner, mint brushwork, from its events page https://luma.com/7fw81j31
//   wordmark.svg        the "collect." wordmark, the inline svg in the header of https://collecthalifax.org
//   socratica.svg       Socratica's wordmark, https://www.socratica.info (SocraticaWhite.*.svg)
//   socratica-mark.svg  Socratica's three asterisks, https://www.socratica.info/favicon.svg
// Writes public/assets/stage/collect/slide.webp: the banner's ground with its small wordmark taken out, the wordmark
// large across the middle in the banner's purple, Socratica's mark and name under it.
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = '.cache/collect', OUT = 'public/assets/stage/collect', W = 1600, H = 900, PURPLE = '#420C75';
mkdirSync(SRC, { recursive: true }); mkdirSync(OUT, { recursive: true });
if (!existsSync(`${SRC}/calendar.png`)) writeFileSync(`${SRC}/calendar.png`, Buffer.from(await (await fetch('https://images.lumacdn.com/calendar-cover-images/t4/bc495109-aad3-40df-9ea3-a35f375e46ed.png')).arrayBuffer()));
for (const f of ['wordmark.svg', 'socratica.svg', 'socratica-mark.svg']) if (!existsSync(`${SRC}/${f}`)) throw new Error(`${SRC}/${f} is missing: see the head of this file for where it comes from`);

const { data: px } = await sharp(`${SRC}/calendar.png`).removeAlpha().resize(W, H).raw().toBuffer({ resolveWithObject: true });

/** Fills the holes from what stands round them, coarse to fine, so the brushwork runs on under where the small wordmark was. */
function fill(c, w, cw, ch) {
  if (cw < 2 || ch < 2) return;
  let holes = 0; for (let i = 0; i < cw * ch; i++) if (!w[i]) holes++;
  if (!holes) return;
  const hw = Math.ceil(cw / 2), hh = Math.ceil(ch / 2), c2 = new Float32Array(hw * hh * 3), w2 = new Float32Array(hw * hh);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x, j = (y >> 1) * hw + (x >> 1); if (!w[i]) continue; w2[j] += 1; for (let k = 0; k < 3; k++) c2[j * 3 + k] += c[i * 3 + k]; }
  for (let j = 0; j < hw * hh; j++) if (w2[j]) { for (let k = 0; k < 3; k++) c2[j * 3 + k] /= w2[j]; w2[j] = 1; }
  fill(c2, w2, hw, hh);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const i = y * cw + x; if (w[i]) continue;
    const fx = Math.min(hw - 1, Math.max(0, (x - 0.5) / 2)), fy = Math.min(hh - 1, Math.max(0, (y - 0.5) / 2)), x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(hw - 1, x0 + 1), y1 = Math.min(hh - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
    for (let k = 0; k < 3; k++) c[i * 3 + k] = (c2[(y0 * hw + x0) * 3 + k] * (1 - tx) + c2[(y0 * hw + x1) * 3 + k] * tx) * (1 - ty) + (c2[(y1 * hw + x0) * 3 + k] * (1 - tx) + c2[(y1 * hw + x1) * 3 + k] * tx) * ty;
  }
}
// the banner's own wordmark: purple on mint, so little green and little red; and 5 px round it for the soft edge
const hole = new Uint8Array(W * H), R = 5;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 3; if (px[k + 1] < 150 && px[k] < 150) for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const u = x + dx, v = y + dy; if (u >= 0 && v >= 0 && u < W && v < H) hole[v * W + u] = 1; } }
const c = Float32Array.from(px), w = Float32Array.from(hole, (h) => (h ? 0 : 1));
fill(c, w, W, H);
const ground = sharp(Buffer.from(Uint8Array.from(c, (v) => Math.max(0, Math.min(255, Math.round(v))))), { raw: { width: W, height: H, channels: 3 } });

/** A logo in the banner's purple, `width` across: every fill of the svg set to it (a `drop` path, the favicon's ground, taken out first). */
const logo = async (file, width, drop) => {
  let svg = readFileSync(`${SRC}/${file}`, 'utf8');
  if (drop) svg = svg.replace(drop, '');
  svg = svg.replace(/fill:\s*#[0-9a-fA-F]{3,6}/g, `fill: ${PURPLE}`).replace(/fill="(#[0-9a-fA-F]{3,6}|white|black)"/g, `fill="${PURPLE}"`).replace(/<svg ([^>]*)>/, (tag, rest) => (/fill=/.test(rest) ? tag : `<svg fill="${PURPLE}" ${rest}>`));
  return sharp(Buffer.from(svg), { density: 600 }).resize({ width }).png().toBuffer({ resolveWithObject: true });
};
const word = await logo('wordmark.svg', 860), mark = await logo('socratica-mark.svg', 86, /<path fill="#fbf8ef"[^>]*\/>/), name = await logo('socratica.svg', 300);
const gap = 22, foot = mark.info.width + gap + name.info.width, fx = Math.round((W - foot) / 2), fy = 660;
await ground.composite([
  { input: word.data, left: Math.round((W - word.info.width) / 2), top: Math.round(370 - word.info.height / 2) },
  { input: mark.data, left: fx, top: fy },
  { input: name.data, left: fx + mark.info.width + gap, top: Math.round(fy + (mark.info.height - name.info.height) / 2) },
]).webp({ quality: 88 }).toFile(`${OUT}/slide.webp`);
console.log('slide', await sharp(`${OUT}/slide.webp`).metadata().then((m) => [m.width, m.height]));
