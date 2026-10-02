// The people of the hall's crowd, as two sheets of small frames: node scripts/stage-crowd.mjs
// Every person in the house is a card. This makes what the cards show: real-proportioned people in real clothes,
// each rendered in Blender through one loop of clapping, cheering, filming or standing, lit as the hall lights them.
// The originals are not in the repository. They are fetched into .cache/rocketbox/ when missing (about 800 MB):
//   Microsoft Rocketbox avatars and animation clips, MIT, https://github.com/microsoft/Microsoft-Rocketbox
//   (Assets/Avatars/<group>/<id>/Export/<id>.fbx, its Textures/*_color.tga, Assets/Animations/all_animations_max_motextr_static/*.max.fbx)
// scripts/stage-crowd.py poses, dresses (the gown and hood are made there) and renders; this packs with sharp.
// Writes public/assets/stage/crowd/near.webp (rows 1 to 3), far.webp (the rest) and people.json (where each
// sequence lies: frame i of a sequence is the cell at x + i * cell width, y, from the sheet's top left).
// For a look: .cache/crowd/near-sheet.png, far-sheet.png (the sheets on the hall's dark) and preview.png (a mock house).
// The frames are kept in .cache/crowd/frames and reused while the plan and the Blender script are unchanged.
// `node scripts/stage-crowd.mjs 3 17` renders only those sequences again (by their place in SEQUENCES) and repacks.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = '.cache/rocketbox', WORK = '.cache/crowd', OUT = 'public/assets/stage/crowd';
const RAW = 'https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/master/Assets';
const blender = '/Applications/Blender.app/Contents/MacOS/Blender';
const HALL = '#16141A'; // the hall's fog colour: what the cards are seen against

// The people: the Rocketbox group each is filed under, the name its textures carry, whether it has a hair sheet.
const AVATARS = {
  Male_Adult_04: ['Adults', 'm006', true], Female_Adult_05: ['Adults', 'f005', true], Male_Adult_17: ['Adults', 'm022', false],
  Female_Adult_08: ['Adults', 'f008', true], Male_Adult_10: ['Adults', 'm024', true], Female_Adult_12: ['Adults', 'f012', true],
  Male_Adult_01: ['Adults', 'm002', true], Female_Adult_03: ['Adults', 'f003', true], Female_Party_02: ['Adults', 'f022', true], Male_Adult_16: ['Adults', 'm019', false], // these ten wear the gown
  Business_Female_02: ['Professions', 'f015', true], Business_Male_04: ['Professions', 'm015', false], Male_Adult_03: ['Adults', 'm004', true],
  Female_Adult_09: ['Adults', 'f009', true], Female_Adult_06: ['Adults', 'f202', true], Male_Adult_05: ['Adults', 'm009', true],
  Female_Adult_11: ['Adults', 'f011', true], Male_Adult_12: ['Adults', 'm007', false], Female_Adult_14: ['Adults', 'f017', true], Male_Adult_20: ['Adults', 'm027', false],
};
const CLIPS = ['claphands_01', 'claphands_02', 'cheer_04', 'wave_01', 'wave_02', 'idle_neutral_01', 'idle_neutral_02'].flatMap((c) => [`m_${c}`, `f_${c}`]);

// The sequences: who, dressed how, doing what, from which clip. `take` picks another cycle of the same clip, so two
// people on one clip do not move alike. A phone is the idle clip with the right arm raised and a phone put in it.
const S = (atlas, id, kind, action, clip, take = 0) => ({ atlas, id, kind, action, clip, take });
const SEQUENCES = [
  // the near rows: ten graduates, each a different person, and eight family
  S('near', 'Male_Adult_17', 'gown', 'clap', 'm_claphands_01'), S('near', 'Female_Adult_05', 'gown', 'clap', 'f_claphands_02'), S('near', 'Male_Adult_04', 'gown', 'cheer', 'm_cheer_04'),
  S('near', 'Female_Adult_08', 'gown', 'clap', 'f_claphands_01'), S('near', 'Male_Adult_10', 'gown', 'clap', 'm_claphands_02'), S('near', 'Female_Adult_12', 'gown', 'clap', 'f_claphands_02', 1),
  S('near', 'Male_Adult_01', 'gown', 'clap', 'm_claphands_01', 1), S('near', 'Female_Adult_03', 'gown', 'clap', 'f_claphands_01', 1), S('near', 'Female_Party_02', 'gown', 'clap', 'f_claphands_02', 2),
  S('near', 'Male_Adult_16', 'gown', 'idle', 'm_idle_neutral_02'), S('near', 'Business_Female_02', 'family', 'clap', 'f_claphands_01', 2), S('near', 'Business_Male_04', 'family', 'clap', 'm_claphands_02', 1),
  S('near', 'Male_Adult_03', 'family', 'clap', 'm_claphands_01', 2), S('near', 'Female_Adult_06', 'family', 'clap', 'f_claphands_02', 3), S('near', 'Male_Adult_05', 'family', 'clap', 'm_claphands_02', 2),
  S('near', 'Female_Adult_11', 'family', 'cheer', 'f_wave_01'), S('near', 'Female_Adult_09', 'family', 'phone', 'f_idle_neutral_01'), S('near', 'Male_Adult_12', 'family', 'idle', 'm_idle_neutral_01'),
  // the far rows: nine in gowns, fifteen family
  S('far', 'Male_Adult_10', 'gown', 'clap', 'm_claphands_01'), S('far', 'Female_Adult_12', 'gown', 'clap', 'f_claphands_02'),
  S('far', 'Male_Adult_04', 'gown', 'clap', 'm_claphands_02'), S('far', 'Female_Adult_08', 'gown', 'cheer', 'f_wave_02'),
  S('far', 'Male_Adult_17', 'gown', 'clap', 'm_claphands_02', 1), S('far', 'Female_Adult_05', 'gown', 'clap', 'f_claphands_01'),
  S('far', 'Male_Adult_10', 'gown', 'cheer', 'm_wave_01'), S('far', 'Female_Adult_12', 'gown', 'idle', 'f_idle_neutral_02'),
  S('far', 'Female_Adult_05', 'gown', 'clap', 'f_claphands_02', 2),
  S('far', 'Female_Adult_14', 'family', 'clap', 'f_claphands_01', 1), S('far', 'Male_Adult_20', 'family', 'clap', 'm_claphands_01', 1),
  S('far', 'Business_Female_02', 'family', 'clap', 'f_claphands_02', 1), S('far', 'Business_Male_04', 'family', 'clap', 'm_claphands_01', 2),
  S('far', 'Male_Adult_03', 'family', 'clap', 'm_claphands_02', 2), S('far', 'Female_Adult_09', 'family', 'clap', 'f_claphands_02', 3),
  S('far', 'Female_Adult_06', 'family', 'clap', 'f_claphands_01', 2), S('far', 'Male_Adult_05', 'family', 'cheer', 'm_cheer_04'),
  S('far', 'Female_Adult_11', 'family', 'clap', 'f_claphands_02', 4), S('far', 'Male_Adult_12', 'family', 'clap', 'm_claphands_02', 3),
  S('far', 'Female_Adult_14', 'family', 'phone', 'f_idle_neutral_01'), S('far', 'Male_Adult_20', 'family', 'phone', 'm_idle_neutral_01'),
  S('far', 'Male_Adult_05', 'family', 'idle', 'm_idle_neutral_02'), S('far', 'Business_Male_04', 'family', 'cheer', 'm_wave_01', 1),
  S('far', 'Female_Adult_09', 'family', 'clap', 'f_claphands_01', 3),
];
// The sheets: a sequence's frames lie left to right in one row; `perRow` sequences share a row.
const ATLASES = {
  near: { file: 'near.webp', cell: [160, 320], frames: 4, perRow: 3, elevation: 10 },
  far: { file: 'far.webp', cell: [96, 192], frames: 4, perRow: 4, elevation: 4 },
};
const METRES = [1.2, 2.4], FEET = 0.03;
const LIGHT = { key: 1750, rim: 2200, fill: 0.02 }; // watts on the stage side and behind, and the little that comes from everywhere

mkdirSync(SRC, { recursive: true }); mkdirSync(WORK, { recursive: true }); mkdirSync(OUT, { recursive: true });

// 1. the originals
const wanted = [];
for (const [id, [group, tex, hair]] of Object.entries(AVATARS)) {
  wanted.push([`${RAW}/Avatars/${group}/${id}/Export/${id}.fbx`, `${id}.fbx`]);
  for (const part of ['body_color', 'head_color', ...(hair ? ['opacity_color'] : [])]) wanted.push([`${RAW}/Avatars/${group}/${id}/Textures/${tex}_${part}.tga`, `${tex}_${part}.tga`]);
}
wanted.push([`${RAW}/Avatars/Professions/Business_Female_02/Textures/f015_glasses_opacity_color.tga`, 'f015_glasses_opacity_color.tga']);
for (const c of CLIPS) wanted.push([`${RAW}/Animations/all_animations_max_motextr_static/${c}.max.fbx`, `${c}.fbx`]);
const missing = wanted.filter(([, f]) => !existsSync(`${SRC}/${f}`) || statSync(`${SRC}/${f}`).size < 1000);
if (missing.length) console.log(`fetching ${missing.length} Rocketbox files into ${SRC}`);
await Promise.all(Array.from({ length: 6 }, async () => {
  for (let job; (job = missing.pop());) {
    const res = await fetch(job[0]);
    if (!res.ok) throw new Error(`${res.status} for ${job[0]}`);
    writeFileSync(`${SRC}/${job[1]}`, Buffer.from(await res.arrayBuffer()));
  }
}));

// 2. the frames
const count = { near: 0, far: 0 };
const sequences = SEQUENCES.map((s, n) => ({ ...s, n, k: count[s.atlas]++, frames: ATLASES[s.atlas].frames }));
const plan = { metres: METRES, feet: FEET, samples: 96, light: LIGHT, atlases: ATLASES, avatars: Object.fromEntries(Object.entries(AVATARS).map(([id, [, tex]]) => [id, { tex }])), sequences };
writeFileSync(`${WORK}/plan.json`, JSON.stringify(plan, null, 1));
const stamp = createHash('sha1').update(JSON.stringify(plan)).update(readFileSync('scripts/stage-crowd.py')).digest('hex');
const frame = (s, i) => `${WORK}/frames/${s.atlas}/${s.k}_${i}.png`;
const complete = sequences.every((s) => Array.from({ length: s.frames }, (_, i) => existsSync(frame(s, i))).every(Boolean));
const only = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
const fresh = !complete || !existsSync(`${WORK}/stamp`) || readFileSync(`${WORK}/stamp`, 'utf8') !== stamp;
if (only.length || fresh) {
  const t0 = Date.now();
  execFileSync(blender, ['-b', '-P', 'scripts/stage-crowd.py', ...(only.length ? ['--', ...only] : [])], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28 })
    .toString().split('\n').filter((l) => l.startsWith('CROWD')).forEach((l) => console.log(l));
  console.log(`rendered in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (!only.length) writeFileSync(`${WORK}/stamp`, stamp);
}
const meta = JSON.parse(readFileSync(`${WORK}/meta.json`, 'utf8'));

// 3. the sheets
/** Carries the colour 3 px out past the outline, at an alpha of 1 in 255 (the encoder throws away colour under a pure 0), so mips and alpha test meet no black fringe. */
function bleed(px, w, h, rounds = 3) {
  let has = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) has[i] = px[i * 4 + 3] > 0 ? 1 : 0;
  for (let r = 0; r < rounds; r++) {
    const next = has.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (has[i]) continue;
      let n = 0, R = 0, G = 0, B = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h || !has[yy * w + xx]) continue;
        const j = (yy * w + xx) * 4; R += px[j]; G += px[j + 1]; B += px[j + 2]; n++;
      }
      if (n) { px[i * 4] = R / n; px[i * 4 + 1] = G / n; px[i * 4 + 2] = B / n; px[i * 4 + 3] = 1; next[i] = 1; }
    }
    has = next;
  }
}
const people = [], sheets = {};
for (const [name, a] of Object.entries(ATLASES)) {
  const [cw, ch] = a.cell, mine = sequences.filter((s) => s.atlas === name);
  const W = cw * a.frames * a.perRow, H = ch * Math.ceil(mine.length / a.perRow), sheet = Buffer.alloc(W * H * 4);
  for (const s of mine) {
    const x0 = (s.k % a.perRow) * a.frames * cw, y0 = Math.floor(s.k / a.perRow) * ch, m = meta[`${name}:${s.k}`];
    if (!m.inside) throw new Error(`sequence ${s.n} (${s.id} ${s.action}) leaves its cell: ${JSON.stringify(m.box)}`);
    for (let i = 0; i < s.frames; i++) {
      const { data, info } = await sharp(frame(s, i)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      if (info.width !== cw || info.height !== ch) throw new Error(`${frame(s, i)} is ${info.width} by ${info.height}`);
      bleed(data, cw, ch);
      for (let y = 0; y < ch; y++) data.copy(sheet, ((y0 + y) * W + x0 + i * cw) * 4, y * cw * 4, (y + 1) * cw * 4);
    }
    people.push({ atlas: name, id: s.id, kind: s.kind, action: s.action, x: x0, y: y0, frames: s.frames, height: m.height });
  }
  sheets[name] = { data: sheet, W, H };
  const raw = { raw: { width: W, height: H, channels: 4 } };
  await sharp(sheet, raw).webp({ quality: a.quality ?? 85, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(`${OUT}/${a.file}`);
  await sharp({ create: { width: W, height: H, channels: 3, background: HALL } }).composite([{ input: sheet, ...raw }]).png().toFile(`${WORK}/${name}-sheet.png`);
}
const json = { metres: METRES, feet: FEET, atlases: Object.fromEntries(Object.entries(ATLASES).map(([n, a]) => [n, { file: a.file, size: [sheets[n].W, sheets[n].H], cell: a.cell }])), people };
writeFileSync(`${OUT}/people.json`, JSON.stringify(json, null, 1).replace(/\{\n\s+"atlas"[^}]+\}/g, (m) => m.replace(/\s*\n\s*/g, ' ')) + '\n');

// 4. a mock of the house from the stage, to judge whether the cards read as a crowd: the eye 2.6 m up, rows 0.9 m
// apart from 6.3 m, the far rows on their tiers, the front brightest, the back going into the hall's dark; the
// graduates in a block at the front, nobody beside their own double
{
  let seed = 977;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  const VW = 1456, VH = 829, f = VH / 2 / Math.tan((25 * Math.PI) / 180), eye = 2.6, hall = [0x16, 0x14, 0x1a], cards = [];
  for (let row = 0; row < 9; row++) {
    const d = 6.3 + row * 0.9 + (row > 2 ? 0.9 : 0), floor = row > 2 ? 0.16 * (Math.floor((row - 3) / 3) + 1) : 0, atlas = row < 3 ? 'near' : 'far', recent = [];
    for (let seat = -9; seat <= 9; seat++) {
      if (rnd() < 0.12) continue;
      const gown = Math.abs(seat) < 5 && row < 5 ? rnd() < 0.85 : rnd() < 0.06;
      const pool = people.filter((p) => p.atlas === atlas && (p.kind === 'gown') === gown && !recent.includes(p.id));
      const p = pool[Math.floor(rnd() * pool.length)];
      recent.push(p.id); if (recent.length > 3) recent.shift();
      cards.push({ d, floor, p, lat: seat * 0.6 + (rnd() - 0.5) * 0.14 + (row % 2) * 0.3, i: Math.floor(rnd() * p.frames), flip: rnd() < 0.5, tall: 0.95 + rnd() * 0.08 });
    }
  }
  cards.sort((a, b) => b.d - a.d);
  const layers = [];
  for (const c of cards) {
    const a = ATLASES[c.p.atlas], [cw, ch] = a.cell, px = (f / c.d) * c.tall, w = Math.round(METRES[0] * px), h = Math.round(METRES[1] * px);
    const light = Math.max(0.22, Math.min(1, (6.3 / c.d) ** 1.5)), fog = Math.min(0.55, Math.max(0, (c.d - 8) / 30)), m = light * (1 - fog);
    const cell = sharp(sheets[c.p.atlas].data, { raw: { width: sheets[c.p.atlas].W, height: sheets[c.p.atlas].H, channels: 4 } }).extract({ left: c.p.x + c.i * cw, top: c.p.y, width: cw, height: ch });
    const card = (c.flip ? cell.flop() : cell).resize(w, h, { kernel: 'cubic' }).linear([m, m, m, 1], [hall[0] * fog, hall[1] * fog, hall[2] * fog, 0]);
    const left = Math.round(VW / 2 + (c.lat * f) / c.d - w / 2), top = Math.round(VH / 2 + ((eye - c.floor) * f) / c.d - h * (1 - FEET));
    const x0 = Math.max(0, -left), y0 = Math.max(0, -top), x1 = Math.min(w, VW - left), y1 = Math.min(h, VH - top); // sharp wants a layer inside the picture: cut what hangs over
    if (x1 - x0 < 2 || y1 - y0 < 2) continue;
    layers.push({ input: await sharp(await card.png().toBuffer()).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).png().toBuffer(), left: left + x0, top: top + y0 });
  }
  await sharp({ create: { width: VW, height: VH, channels: 3, background: HALL } }).composite(layers).png().toFile(`${WORK}/preview.png`);
  console.log(`preview: ${layers.length} people`);
}
const kb = (f) => (statSync(f).size / 1024).toFixed(0);
console.log(`crowd: near ${kb(`${OUT}/near.webp`)} KB (${sheets.near.W} by ${sheets.near.H}), far ${kb(`${OUT}/far.webp`)} KB (${sheets.far.W} by ${sheets.far.H}), ${people.length} sequences`);
