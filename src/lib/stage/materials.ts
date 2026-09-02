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
  paint?: 'planks' | 'planksPale' | 'tiles' | 'pavers' | 'windows' | 'nightSky'; // a painted colour map, tiled every `tile` metres
  tile: number;
  emissive?: string; // glows on its own
  emissivePower?: number;
  unlit?: boolean; // a basic material: the map or colour is the light (screens, the city at night)
  fog?: false; // outside the room's fog, kilometres away
  inside?: true; // seen from inside (a sky dome): back faces
}

export const MATS: Record<string, Mat> = {
  // now, Toronto: warm white walls, pale oak, black desk, charcoal chair, a navy duvet
  condoWall: { color: '#C9C3B9', rough: 0.92, grain: 'plaster', amp: 0.08, tile: 2.5 },
  condoCeiling: { color: '#F6F5F2', rough: 0.95, tile: 1 },
  condoFloor: { color: '#FFFFFF', rough: 0.45, paint: 'planksPale', grain: 'plank', amp: 0.15, tile: 2.4 },
  deskTop: { color: '#1F1F22', rough: 0.45, tile: 1 },
  deskLeg: { color: '#2A2A2E', rough: 0.4, metal: 0.6, tile: 1 },
  bezel: { color: '#141416', rough: 0.35, tile: 1 },
  aluminium: { color: '#B9BCC2', rough: 0.35, metal: 0.9, tile: 1 },
  chairFabric: { color: '#4A4E57', rough: 0.95, grain: 'weave', amp: 0.2, tile: 0.2 },
  chairBase: { color: '#17181B', rough: 0.4, metal: 0.5, tile: 1 },
  tie: { color: '#1F2A4A', rough: 0.7, tile: 1 },
  pouf: { color: '#5B7BB4', rough: 0.95, grain: 'weave', amp: 0.2, tile: 0.2 },
  mattress: { color: '#F2F0EA', rough: 0.9, grain: 'weave', amp: 0.15, tile: 0.4 },
  duvet: { color: '#2F4562', rough: 0.95, grain: 'weave', amp: 0.25, tile: 0.35 },
  pillow: { color: '#F6F4EE', rough: 0.9, grain: 'weave', amp: 0.2, tile: 0.3 },
  bedFrame: { color: '#8C6B4E', rough: 0.55, grain: 'grain', amp: 0.15, tile: 0.6 },
  rugGrey: { color: '#9AA0A6', rough: 0.98, grain: 'pile', amp: 0.35, tile: 0.4 },
  skin: { color: '#C68E6A', rough: 0.7, tile: 1 },
  tee: { color: '#141416', rough: 0.9, grain: 'weave', amp: 0.15, tile: 0.15 },
  hoodie: { color: '#202127', rough: 1, grain: 'weave', amp: 0.2, tile: 0.12 },
  jeans: { color: '#26334A', rough: 0.9, grain: 'weave', amp: 0.2, tile: 0.15 },
  hair: { color: '#17120F', rough: 0.55, grain: 'strand', amp: 0.3, tile: 0.08 },
  glassFrame: { color: '#1A1A1A', rough: 0.4, metal: 0.3, tile: 1 },
  windowFrame: { color: '#2A2A2E', rough: 0.5, metal: 0.4, tile: 1 },
  powerLed: { color: '#4BD1FF', rough: 0.4, tile: 1 },
  lanyard: { color: '#EA4335', rough: 0.9, grain: 'weave', amp: 0.2, tile: 0.05 },
  book0: { color: '#2B2D33', rough: 0.7, tile: 1 }, book1: { color: '#4A3B7A', rough: 0.7, tile: 1 }, book2: { color: '#1E5A7A', rough: 0.7, tile: 1 }, book3: { color: '#8A3A3A', rough: 0.7, tile: 1 },
  book4: { color: '#3A6A4A', rough: 0.7, tile: 1 }, book5: { color: '#E9E2D0', rough: 0.8, tile: 1 }, book6: { color: '#20242C', rough: 0.7, tile: 1 }, book7: { color: '#B8862B', rough: 0.6, tile: 1 },
  // the city outside the window at night, kilometres away: unlit, outside the fog
  tower: { color: '#FFFFFF', rough: 1, paint: 'windows', tile: 1, unlit: true, fog: false },
  towerReflect: { color: '#3A4666', rough: 1, paint: 'windows', tile: 1, unlit: true, fog: false },
  towerTop: { color: '#0A0D18', rough: 1, unlit: true, tile: 1, fog: false },
  lake: { color: '#070A16', rough: 1, unlit: true, tile: 1, fog: false },
  cnShaft: { color: '#2A2D4A', rough: 0.7, emissive: '#5A5FC8', emissivePower: 0.3, tile: 1, fog: false },
  cnPod: { color: '#2E3350', rough: 0.6, emissive: '#FFE7B0', emissivePower: 0.9, tile: 1, fog: false },
  cnLight: { color: '#FF4A4A', rough: 0.5, emissive: '#FF3030', emissivePower: 4, tile: 1, fog: false },
  dome: { color: '#C9CED8', rough: 0.9, emissive: '#3A4260', emissivePower: 0.5, tile: 1, fog: false },
  nightSky: { color: '#FFFFFF', rough: 1, paint: 'nightSky', tile: 1, unlit: true, fog: false, inside: true },
  towerFar: { color: '#9AA6C8', rough: 1, paint: 'windows', tile: 1, unlit: true, fog: false },
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
  bridge: { color: '#8F959C', rough: 0.55, metal: 0.4, tile: 1 }, // the Bay Bridge: grey steel
  // the Embarcadero in front of Google San Francisco
  concrete: { color: '#B9B6AE', rough: 0.9, grain: 'plaster', amp: 0.15, tile: 1.5 },
  hedge: { color: '#3B6A36', rough: 0.95, grain: 'pebble', amp: 0.5, tile: 0.4 },
  rail: { color: '#6E4B3A', rough: 0.45, metal: 0.3, tile: 1 },
  asphalt: { color: '#4B4D52', rough: 0.95, grain: 'pebble', amp: 0.2, tile: 2 },
  kerb: { color: '#D6D3CB', rough: 0.85, tile: 1 },
  palmTrunk: { color: '#8C7A62', rough: 0.9, grain: 'plaster', amp: 0.4, tile: 0.5 },
  frond: { color: '#4C7F3A', rough: 0.8, tile: 1 },
  lampPost: { color: '#3E6E78', rough: 0.5, metal: 0.4, tile: 1 },
  lampGlobe: { color: '#F6F1E4', rough: 0.4, emissive: '#FFF3D6', emissivePower: 0.3, tile: 1 },
  pier: { color: '#EEE7D9', rough: 0.85, grain: 'plaster', amp: 0.1, tile: 2 },
  pierRoof: { color: '#A3492F', rough: 0.8, tile: 1 },
  pierGlass: { color: '#2E3A44', rough: 0.3, metal: 0.2, tile: 1 },
  cloud: { color: '#FFFFFF', rough: 1, unlit: true, tile: 1, fog: false },
  carRed: { color: '#B9282A', rough: 0.35, metal: 0.3, tile: 1 },
  carSilver: { color: '#C7CACF', rough: 0.35, metal: 0.6, tile: 1 },
  carWhite: { color: '#E9EAE8', rough: 0.4, metal: 0.2, tile: 1 },
  carGlass: { color: '#1E2A36', rough: 0.2, metal: 0.3, tile: 1 },
  tyre: { color: '#17181A', rough: 0.9, tile: 1 },
  badgeCard: { color: '#F4F4F2', rough: 0.6, tile: 1 },
  lanyardGreen: { color: '#34A853', rough: 0.8, tile: 1 },
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
