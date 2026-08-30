// Designed surfaces, not photographs: a colour, a roughness, and at most a faint grain (a
// procedural normal map from surface.ts) or a painted colour map (planks, tiles, pavers, drawn
// on a canvas at runtime). Every set has its own palette: warm for 2010, cool and clean for
// 2013, bright for 2018. uv on shells and built props is in metres; `tile` is metres per repeat.
import type { Kind } from './surface.ts';

export interface Mat {
  color: string;
  rough: number;
  metal?: number;
  grain?: Kind; // a faint normal map, tiled every `tile` metres
  amp?: number; // normal strength, 0..1 (default 0.25)
  paint?: 'planks' | 'tiles' | 'pavers'; // a painted colour map, tiled every `tile` metres
  tile: number;
}

export const MATS: Record<string, Mat> = {
  // 2010, the room: cream distemper, teak planks, a red rug, cotton at the window
  roomWall: { color: '#F2E6D2', rough: 0.92, grain: 'plaster', amp: 0.12, tile: 2.5 },
  roomCeiling: { color: '#FAF6EE', rough: 0.95, tile: 1 },
  roomFloor: { color: '#FFFFFF', rough: 0.55, paint: 'planks', grain: 'plank', amp: 0.2, tile: 2.4 },
  rug: { color: '#C2463B', rough: 0.98, grain: 'pile', amp: 0.35, tile: 0.4 },
  curtain: { color: '#EBDFC7', rough: 0.9, grain: 'weave', amp: 0.3, tile: 0.25 },
  tvWood: { color: '#5A3E2B', rough: 0.55, grain: 'grain', amp: 0.15, tile: 0.6 },
  shelfWood: { color: '#C99A66', rough: 0.5, grain: 'grain', amp: 0.15, tile: 0.6 },
  // the passage: plainer, a little darker
  passageWall: { color: '#E6DFD2', rough: 0.92, grain: 'plaster', amp: 0.12, tile: 2.5 },
  passageFloor: { color: '#CFC7BA', rough: 0.7, grain: 'speckle', amp: 0.15, tile: 0.8 },
  // 2013, the lab: off-white walls, pale grey tiles, white ceiling
  labWall: { color: '#EEF1F3', rough: 0.9, grain: 'plaster', amp: 0.08, tile: 2.5 },
  labCeiling: { color: '#F7F9FA', rough: 0.95, tile: 1 },
  labFloor: { color: '#FFFFFF', rough: 0.35, paint: 'tiles', tile: 1.2 },
  desk: { color: '#D9D3C4', rough: 0.55, tile: 1 },
  keys: { color: '#EFEAE0', rough: 0.5, tile: 1 },
  board: { color: '#F4F4F2', rough: 0.5, tile: 1 },
  alu: { color: '#C9CCD0', rough: 0.35, metal: 0.9, tile: 1 },
  tray: { color: '#DADDE0', rough: 0.4, metal: 0.6, tile: 1 },
  tubeGlass: { color: '#F6FAFF', rough: 0.3, tile: 1 },
  bulb: { color: '#FFE6B0', rough: 0.4, tile: 1 },
  // 2018, the plaza: pale pavers, a green counter, gold
  pavers: { color: '#FFFFFF', rough: 0.85, paint: 'pavers', grain: 'pebble', amp: 0.1, tile: 1.8 },
  counter: { color: '#2E7D4F', rough: 0.7, tile: 1 },
  gold: { color: '#D4AF37', rough: 0.34, metal: 1, tile: 1 },
  water: { color: '#2F6E93', rough: 0.5, grain: 'ripple', amp: 0.35, tile: 6 },
  bridge: { color: '#C8412F', rough: 0.55, metal: 0.2, tile: 1 },
  hull: { color: '#17282F', rough: 0.5, tile: 1 },
  mast: { color: '#8B6B4A', rough: 0.6, tile: 1 },
  sail: { color: '#F2EFE6', rough: 0.6, tile: 1 },
  frameBlack: { color: '#1A1A1A', rough: 0.5, tile: 1 },
  frameWood: { color: '#5C4033', rough: 0.6, tile: 1 },
  rod: { color: '#8A6E4E', rough: 0.5, metal: 0.2, tile: 1 },
};

export const mat = (name: string): Mat => {
  const m = MATS[name];
  if (!m) throw new Error(`no material ${name}`);
  return m;
};
