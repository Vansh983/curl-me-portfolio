// Surface detail. Every lit material carries a height field packed into one RGBA map
// (rgb = tangent-space normal, a = height) that the shader samples triplanar, by world
// position, at a real metric scale. That way no rig needs a second uv set: a 2 mm plaster
// grain stays 2 mm whether it lands on a wall, a plinth or a shoe, and the specular of the
// environment breaks up across it instead of sliding over a mirror-flat facet.
// Pure maths, no DOM: the renderer wraps the bytes in a DataTexture.

/** The height fields. Each one tiles seamlessly, so triplanar sampling never shows a seam. */
export type Kind =
  | 'smooth' | 'orange' | 'plaster' | 'grain' | 'plank' | 'weave' | 'pile'
  | 'brushed' | 'speckle' | 'pores' | 'strand' | 'pebble' | 'leaf' | 'ripple';

export type SurfaceName =
  | 'paint' | 'plaster' | 'wood' | 'plank' | 'fabric' | 'cotton' | 'carpet' | 'plastic'
  | 'metal' | 'steel' | 'gold' | 'rubber' | 'paper' | 'ceramic' | 'concrete'
  | 'skin' | 'hair' | 'foliage' | 'glass' | 'stone' | 'water';

export interface Surface {
  kind: Kind;
  rough: number; // base roughness
  metal: number;
  tile: number; // metres across one tile of the detail map
  bump: number; // 0 flat, 1 the height field at full tilt
  roughAmp: number; // how much the height modulates roughness (peaks polish, pits hold dirt)
  env: number; // envMapIntensity
}

export const SURFACE: Record<SurfaceName, Surface> = {
  // walls, ceilings: distemper over plaster, the finest grain of all
  paint: { kind: 'orange', rough: 0.93, metal: 0, tile: 0.2, bump: 0.1, roughAmp: 0.07, env: 0.85 },
  plaster: { kind: 'plaster', rough: 0.96, metal: 0, tile: 0.55, bump: 0.25, roughAmp: 0.1, env: 0.8 },
  // furniture: sealed board, and the floor's planks
  wood: { kind: 'grain', rough: 0.74, metal: 0, tile: 0.5, bump: 0.18, roughAmp: 0.16, env: 1 },
  plank: { kind: 'plank', rough: 0.7, metal: 0, tile: 1.1, bump: 0.28, roughAmp: 0.2, env: 1 },
  // cloth: the shirt takes the fine weave, curtains and the rug the coarse one
  cotton: { kind: 'weave', rough: 0.86, metal: 0, tile: 0.05, bump: 0.16, roughAmp: 0.1, env: 0.7 },
  fabric: { kind: 'weave', rough: 0.9, metal: 0, tile: 0.11, bump: 0.25, roughAmp: 0.12, env: 0.6 },
  carpet: { kind: 'pile', rough: 0.98, metal: 0, tile: 0.09, bump: 0.3, roughAmp: 0.06, env: 0.5 },
  // moulded things: consoles, keys, monitor shells
  plastic: { kind: 'orange', rough: 0.58, metal: 0, tile: 0.045, bump: 0.06, roughAmp: 0.08, env: 0.9 },
  rubber: { kind: 'speckle', rough: 0.82, metal: 0, tile: 0.04, bump: 0.15, roughAmp: 0.08, env: 0.75 },
  // metal: the fan, the tower, the bridge; gold for the trophy
  metal: { kind: 'brushed', rough: 0.5, metal: 0.9, tile: 0.3, bump: 0.12, roughAmp: 0.14, env: 1 },
  steel: { kind: 'brushed', rough: 0.42, metal: 1, tile: 0.8, bump: 0.1, roughAmp: 0.12, env: 1 },
  gold: { kind: 'brushed', rough: 0.34, metal: 1, tile: 0.05, bump: 0.08, roughAmp: 0.1, env: 1.1 },
  // paper, tiles, concrete
  paper: { kind: 'pores', rough: 0.88, metal: 0, tile: 0.1, bump: 0.1, roughAmp: 0.06, env: 0.7 },
  ceramic: { kind: 'orange', rough: 0.42, metal: 0, tile: 0.4, bump: 0.05, roughAmp: 0.06, env: 1 },
  concrete: { kind: 'pebble', rough: 0.93, metal: 0, tile: 1.4, bump: 0.25, roughAmp: 0.18, env: 0.9 },
  stone: { kind: 'pebble', rough: 0.8, metal: 0, tile: 0.8, bump: 0.25, roughAmp: 0.2, env: 1 },
  // him
  skin: { kind: 'pores', rough: 0.78, metal: 0, tile: 0.03, bump: 0.06, roughAmp: 0.08, env: 0.7 },
  hair: { kind: 'strand', rough: 0.72, metal: 0, tile: 0.045, bump: 0.3, roughAmp: 0.18, env: 0.7 },
  // outside
  foliage: { kind: 'leaf', rough: 0.72, metal: 0, tile: 0.26, bump: 0.22, roughAmp: 0.14, env: 0.9 },
  glass: { kind: 'smooth', rough: 0.12, metal: 0, tile: 1, bump: 0, roughAmp: 0, env: 1.2 },
  // the bay: nearly a mirror, with a swell big enough to break the sun into a path
  water: { kind: 'ripple', rough: 0.22, metal: 0, tile: 7, bump: 0.35, roughAmp: 0.12, env: 1.2 },
};

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** mulberry32: a small deterministic generator, so a build is byte-identical every time. */
function rnd(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Value noise on a lattice that wraps: cell (cx-1, y) interpolates back into cell (0, y),
 * so the field tiles. sx and sy stretch the lattice, which is how grain and brushing get
 * their direction (few cells across x = long streaks along x).
 */
export function value(size: number, cells: number, seed: number, sx = 1, sy = 1): Float32Array {
  const cx = Math.max(1, Math.round(cells * sx));
  const cy = Math.max(1, Math.round(cells * sy));
  const r = rnd(seed);
  const g = new Float32Array(cx * cy);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const fy = (y / size) * cy;
    const y0 = Math.floor(fy) % cy;
    const y1 = (y0 + 1) % cy;
    const ty = smoothstep(fy - Math.floor(fy));
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cx;
      const x0 = Math.floor(fx) % cx;
      const x1 = (x0 + 1) % cx;
      const tx = smoothstep(fx - Math.floor(fx));
      const top = g[y0 * cx + x0] + (g[y0 * cx + x1] - g[y0 * cx + x0]) * tx;
      const bot = g[y1 * cx + x0] + (g[y1 * cx + x1] - g[y1 * cx + x0]) * tx;
      out[y * size + x] = top + (bot - top) * ty;
    }
  }
  return out;
}

/** Octaves of value noise, each twice as fine and half as tall. Normalised to 0..1. */
export function fbm(size: number, cells: number, seed: number, octaves: number, gain = 0.5, sx = 1, sy = 1): Float32Array {
  const out = new Float32Array(size * size);
  let amp = 1;
  let sum = 0;
  let c = cells;
  for (let o = 0; o < octaves; o++) {
    const layer = value(size, c, seed + o * 131, sx, sy);
    for (let i = 0; i < out.length; i++) out[i] += layer[i] * amp;
    sum += amp;
    amp *= gain;
    c *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

const mix = (a: Float32Array, b: Float32Array, t: number): Float32Array => {
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
};

/** Pushes a field away from its middle: 0.5 stays, the rest spreads. */
const contrast = (h: Float32Array, k: number): Float32Array => {
  const out = new Float32Array(h.length);
  for (let i = 0; i < h.length; i++) out[i] = clamp01(0.5 + (h[i] - 0.5) * k);
  return out;
};

/** The height field for a kind, in 0..1, tiling at any size. */
export function heightField(kind: Kind, size: number): Float32Array {
  const n = size * size;
  const out = new Float32Array(n);
  switch (kind) {
    case 'smooth':
      out.fill(0.5);
      return out;

    // the fine dimple of roller paint and moulded plastic
    case 'orange':
      return contrast(fbm(size, 26, 7, 2, 0.55), 0.7);

    // hand-floated plaster: broad swells with a sandy tooth on top
    case 'plaster':
      return mix(fbm(size, 7, 11, 4, 0.55), fbm(size, 64, 13, 2, 0.6), 0.35);

    // wood: long fibres along x, with the odd darker vessel line
    case 'grain': {
      const long = fbm(size, 40, 3, 4, 0.55, 0.06, 1);
      const fine = fbm(size, 110, 5, 2, 0.5, 0.12, 1);
      const h = mix(long, fine, 0.3);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = y * size + x;
          // a ring line wherever the long field crosses a level: thin, dark, parallel to x
          const ring = Math.abs(((h[i] * 5) % 1) - 0.5) * 2;
          out[i] = clamp01(h[i] * 0.9 + 0.1 * smoothstep(ring));
        }
      }
      return out;
    }

    // floor boards: the grain, cut across by grooves every quarter tile, each board a shade off
    case 'plank': {
      const g = heightField('grain', size);
      const boards = 4;
      const r = rnd(97);
      const tone = Array.from({ length: boards }, () => r() * 0.16 - 0.08);
      for (let y = 0; y < size; y++) {
        const v = (y / size) * boards;
        const board = Math.floor(v) % boards;
        const edge = Math.min(v - Math.floor(v), 1 - (v - Math.floor(v)));
        // the groove: 1.5 % of a board's width, and the chamfer that runs into it
        const groove = smoothstep(clamp01(edge / 0.05));
        for (let x = 0; x < size; x++) {
          const i = y * size + x;
          out[i] = clamp01((g[i] * 0.72 + 0.28 + tone[board]) * (0.25 + 0.75 * groove));
        }
      }
      return out;
    }

    // over and under: the warp rides high where the weft does not
    case 'weave': {
      const noise = value(size, 48, 19);
      for (let y = 0; y < size; y++) {
        const v = (y / size) * TAU * 8;
        for (let x = 0; x < size; x++) {
          const u = (x / size) * TAU * 8;
          const w = Math.max(Math.sin(u), Math.sin(v));
          out[y * size + x] = clamp01(0.5 + 0.34 * w + 0.1 * (noise[y * size + x] - 0.5));
        }
      }
      return out;
    }

    // cut pile: thousands of tuft tips, no direction at all
    case 'pile':
      return contrast(fbm(size, 80, 17, 2, 0.65), 1.35);

    // brushed metal: the polishing marks run along x
    case 'brushed': {
      const streak = fbm(size, 160, 23, 3, 0.5, 0.012, 1);
      return mix(streak, value(size, 96, 29), 0.18);
    }

    // moulded rubber and cast plastic: an even stipple
    case 'speckle':
      return contrast(value(size, 96, 29), 0.9);

    // skin and paper: pores, very fine, very shallow
    case 'pores':
      return mix(fbm(size, 120, 31, 2, 0.5), value(size, 210, 37), 0.4);

    // hair: strands running along y
    case 'strand': {
      const s = fbm(size, 170, 41, 3, 0.5, 1, 0.012);
      return contrast(s, 1.25);
    }

    // concrete and kerbstone: aggregate under a floated skin, with air pits
    case 'pebble': {
      const agg = contrast(fbm(size, 11, 43, 3, 0.6), 1.2);
      const pits = value(size, 40, 47);
      for (let i = 0; i < n; i++) out[i] = clamp01(agg[i] - (pits[i] > 0.88 ? 0.45 : 0));
      return out;
    }

    // a leaf: the blade, with a midrib and side veins standing proud
    case 'leaf': {
      const blade = fbm(size, 18, 53, 3, 0.55);
      for (let y = 0; y < size; y++) {
        const v = y / size;
        const rib = 1 - smoothstep(clamp01(Math.abs(v - 0.5) / 0.03));
        for (let x = 0; x < size; x++) {
          const u = x / size;
          const side = Math.abs(((u * 14 + (v - 0.5) * 6) % 1) - 0.5) * 2;
          out[y * size + x] = clamp01(blade[y * size + x] * 0.6 + 0.25 * rib + 0.15 * smoothstep(side));
        }
      }
      return out;
    }

    // slow water: two crossing swells
    case 'ripple': {
      for (let y = 0; y < size; y++) {
        const v = y / size;
        for (let x = 0; x < size; x++) {
          const u = x / size;
          out[y * size + x] = clamp01(0.5 + 0.07 * Math.sin((u * 3 + v * 2) * TAU) + 0.03 * Math.sin((u * 7 - v * 5) * TAU));
        }
      }
      return out;
    }
  }
}

/**
 * Packs a height field into RGBA bytes: rgb is the tangent-space normal from the Sobel
 * gradient (wrapping, so the tile stays seamless), a is the height itself, which the
 * shader reuses to modulate roughness. OpenGL convention: +y is up in the map.
 */
export function packDetail(h: Float32Array, size: number, strength = 1): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)];
  // the Sobel runs over two texels, so a full 0..1 step gives |d| ~= 4; at strength 1 that is a
  // 45 degree facet, which is as far as a detail map should ever tilt a normal
  const k = strength * 0.25;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx =
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const dy =
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const nx = -dx * k;
      const ny = -dy * k;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      out[i] = Math.round((nx / len * 0.5 + 0.5) * 255);
      out[i + 1] = Math.round((ny / len * 0.5 + 0.5) * 255);
      out[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      out[i + 3] = Math.round(clamp01(h[y * size + x]) * 255);
    }
  }
  return out;
}

/** The map a surface needs, ready for a DataTexture. Cached by kind: several surfaces share one. */
const cache = new Map<string, Uint8Array>();
export function detailMap(kind: Kind, size = 256): Uint8Array {
  const key = `${kind}:${size}`;
  let m = cache.get(key);
  if (!m) {
    m = packDetail(heightField(kind, size), size);
    cache.set(key, m);
  }
  return m;
}
