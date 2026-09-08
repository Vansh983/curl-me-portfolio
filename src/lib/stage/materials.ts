// Designed surfaces: a colour, a roughness, and at most a faint grain (a procedural normal map
// from surface.ts), a painted colour map (tiles, pavers, drawn on a canvas at runtime), or a
// scanned surface (assets.ts: its relief and roughness, and its colour for floors and wood). Every set has its own palette: warm for 2010, cool and clean for
// 2013, bright for 2018. uv on shells and built props is in metres; `tile` is metres per repeat.
import type { Kind } from './surface.ts';

export interface Mat {
  color: string;
  rough: number;
  metal?: number;
  grain?: Kind; // a faint normal map, tiled every `tile` metres
  amp?: number; // normal strength, 0..1 (default 0.25)
  paint?: 'planks' | 'planksPale' | 'tiles' | 'pavers' | 'windows' | 'nightSky'; // a painted colour map, tiled every `tile` metres
  tex?: string; // a scanned surface from assets.ts: its relief and roughness, and its colour when it ships one; tiled every `tile` metres
  sheen?: number; // cloth: the soft rim light of fibres, 0..1
  clearcoat?: number; // lacquer, car paint, glossy plastic: a clear layer over the colour, 0..1
  clearcoatRough?: number; // default 0.15
  vary?: number; // roughness wander across the surface, 0..1 (default 0.2; a scanned surface brings its own)
  tile: number;
  emissive?: string; // glows on its own
  emissivePower?: number;
  unlit?: boolean; // a basic material: the map or colour is the light (screens, the city at night)
  fog?: false; // outside the room's fog, kilometres away
  inside?: true; // seen from inside (a sky dome): back faces
  tint?: true; // takes the piece's vertex colours (the city: each building its own brightness)
}

export const MATS: Record<string, Mat> = {
  // now, Toronto: warm white walls, pale oak, black desk, charcoal chair, a navy duvet
  condoWall: { color: '#33343A', rough: 0.9, tex: 'plastered_wall_04', amp: 0.3, tile: 3.2 },
  condoBrick: { color: '#4A4644', rough: 0.95, tex: 'dark_brick_wall', amp: 0.9, tile: 1.05 },
  skirting: { color: '#E6E3DC', rough: 0.45, clearcoat: 0.3, clearcoatRough: 0.3, tile: 1 },
  ledStrip: { color: '#FFE2B8', rough: 0.5, emissive: '#FFD9A0', emissivePower: 3, tile: 1 },
  bathTile: { color: '#E3E5E2', rough: 0.22, paint: 'tiles', tile: 0.3, clearcoat: 0.5, clearcoatRough: 0.2 },
  chrome: { color: '#DADCE0', rough: 0.12, metal: 1, tile: 1 },
  doorPaint: { color: '#EDEAE3', rough: 0.4, clearcoat: 0.25, clearcoatRough: 0.3, tile: 1 },
  tvGlass: { color: '#06070A', rough: 0.08, clearcoat: 1, clearcoatRough: 0.05, tile: 1 },
  facadeDark: { color: '#2B2D31', rough: 0.85, tex: 'plastered_wall_04', amp: 0.4, tile: 3.2 },
  condoCeiling: { color: '#2B2C30', rough: 0.95, tile: 1 },
  condoFloor: { color: '#C9B294', rough: 1, tex: 'herringbone_parquet', amp: 0.6, clearcoat: 0.35, clearcoatRough: 0.3, tile: 3.4 },
  deskTop: { color: '#1F1F22', rough: 0.45, clearcoat: 0.35, clearcoatRough: 0.25, tile: 1 },
  deskLeg: { color: '#2A2A2E', rough: 0.4, metal: 0.6, tile: 1 },
  bezel: { color: '#141416', rough: 0.35, clearcoat: 0.15, tile: 1 },
  aluminium: { color: '#B9BCC2', rough: 0.35, metal: 0.9, tile: 1 },
  chairFabric: { color: '#4A4E57', rough: 0.95, tex: 'wool_boucle', amp: 0.8, sheen: 0.6, tile: 0.35 },
  chairBase: { color: '#17181B', rough: 0.4, metal: 0.5, tile: 1 },
  tie: { color: '#1F2A4A', rough: 0.7, tile: 1 },
  pouf: { color: '#5B7BB4', rough: 0.95, tex: 'wool_boucle', amp: 0.8, sheen: 0.5, tile: 0.35 },
  mattress: { color: '#F2F0EA', rough: 0.9, grain: 'weave', amp: 0.15, sheen: 0.3, tile: 0.4 },
  duvet: { color: '#2F4562', rough: 0.95, tex: 'polar_fleece', amp: 0.8, sheen: 0.8, tile: 0.27 },
  pillow: { color: '#F6F4EE', rough: 0.9, tex: 'polar_fleece', amp: 0.6, sheen: 0.6, tile: 0.27 },
  bedFrame: { color: '#C9A47E', rough: 0.7, tex: 'oak_veneer_01', amp: 0.5, clearcoat: 0.15, tile: 1.83 },
  rugGrey: { color: '#5B5F66', rough: 0.98, tex: 'dirty_carpet', amp: 0.9, sheen: 0.3, tile: 0.6 },
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
  tower: { color: '#FFFFFF', rough: 1, paint: 'windows', tile: 1, unlit: true, fog: false, tint: true },
  towerReflect: { color: '#3A4666', rough: 1, paint: 'windows', tile: 1, unlit: true, fog: false },
  towerTop: { color: '#0A0D18', rough: 1, unlit: true, tile: 1, fog: false },
  lake: { color: '#070A16', rough: 1, unlit: true, tile: 1, fog: false },
  cnShaft: { color: '#D6D8DE', rough: 1, unlit: true, tint: true, tile: 1, fog: false }, // floodlit concrete
  cnPod: { color: '#F4F1EA', rough: 1, unlit: true, tint: true, tile: 1, fog: false },
  cnLight: { color: '#FF4A4A', rough: 0.5, emissive: '#FF3030', emissivePower: 4, tile: 1, fog: false },
  dome: { color: '#C9CED8', rough: 0.9, emissive: '#3A4260', emissivePower: 0.5, tile: 1, fog: false },
  nightSky: { color: '#FFFFFF', rough: 1, paint: 'nightSky', tile: 1, unlit: true, fog: false, inside: true },
  towerFar: { color: '#A9B2CC', rough: 1, paint: 'windows', tile: 1, unlit: true, fog: false, tint: true },
  // 2010, the room: cream distemper, teak planks, a red rug, cotton at the window
  roomWall: { color: '#F6E7CF', rough: 0.92, tex: 'plastered_wall_04', amp: 0.35, tile: 3.2 },
  roomCeiling: { color: '#FAF6EE', rough: 0.95, tile: 1 },
  roomFloor: { color: '#FFFFFF', rough: 1, tex: 'plank_flooring_02', amp: 0.7, clearcoat: 0.1, clearcoatRough: 0.4, tile: 1.98 },
  rug: { color: '#C2463B', rough: 0.98, tex: 'dirty_carpet', amp: 0.9, sheen: 0.3, tile: 0.6 },
  curtain: { color: '#EBDFC7', rough: 0.9, tex: 'cotton_jersey', amp: 0.7, sheen: 0.4, tile: 0.26 },
  tvWood: { color: '#7A5A42', rough: 0.7, tex: 'oak_veneer_01', amp: 0.5, clearcoat: 0.2, tile: 1.83 },
  shelfWood: { color: '#F2E2C8', rough: 0.7, tex: 'oak_veneer_01', amp: 0.5, clearcoat: 0.2, tile: 1.83 },
  // the original white Xbox 360, standing
  xboxWhite: { color: '#EDEDE8', rough: 0.3, clearcoat: 0.5, clearcoatRough: 0.2, tile: 1 },
  xboxGrey: { color: '#C9C9C4', rough: 0.4, tile: 1 },
  xboxChrome: { color: '#D8D8D6', rough: 0.25, metal: 0.8, tile: 1 },
  xboxGreen: { color: '#7BD88F', rough: 0.4, emissive: '#5CE07A', emissivePower: 1.2, tile: 1 },
  // anime figures on the shelf: flat bright plastic
  figOrange: { color: '#F28C28', rough: 0.45, clearcoat: 0.4, tile: 1 },
  figBlue: { color: '#2E4A9E', rough: 0.45, clearcoat: 0.4, tile: 1 },
  figRed: { color: '#C8302A', rough: 0.45, clearcoat: 0.4, tile: 1 },
  figBlack: { color: '#1C1C22', rough: 0.45, tile: 1 },
  figYellow: { color: '#F2D23C', rough: 0.45, clearcoat: 0.4, tile: 1 },
  figGreen: { color: '#4A6B3F', rough: 0.45, tile: 1 },
  figWhite: { color: '#EDEDEA', rough: 0.45, tile: 1 },
  figSkin: { color: '#F1C9A5', rough: 0.5, tile: 1 },
  hairBlack: { color: '#15151A', rough: 0.5, tile: 1 },
  hairYellow: { color: '#F5D142', rough: 0.5, tile: 1 },
  hairOrange: { color: '#F07A2A', rough: 0.5, tile: 1 },
  figBase: { color: '#2A2A2E', rough: 0.4, tile: 1 },
  // the passage: plainer, a little darker
  passageWall: { color: '#E6DFD2', rough: 0.92, tex: 'plastered_wall_04', amp: 0.35, tile: 3.2 },
  passageFloor: { color: '#CFC7BA', rough: 0.7, grain: 'speckle', amp: 0.15, tile: 0.8 },
  // 2013, the lab: off-white walls, pale grey tiles, white ceiling
  labWall: { color: '#E8E7E2', rough: 0.9, tex: 'plastered_wall_04', amp: 0.25, tile: 3.2 },
  labCeiling: { color: '#EEF0F2', rough: 0.95, paint: 'tiles', tile: 0.6 }, // suspended ceiling tiles
  partition: { color: '#8E9298', rough: 0.98, tex: 'wool_boucle', amp: 0.6, sheen: 0.3, tile: 0.35 },
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
  asphalt: { color: '#FFFFFF', rough: 1, tex: 'asphalt_02', amp: 0.6, tile: 3 },
  kerb: { color: '#D6D3CB', rough: 0.85, tile: 1 },
  palmTrunk: { color: '#8C7A62', rough: 0.9, grain: 'plaster', amp: 0.4, tile: 0.5 },
  frond: { color: '#4C7F3A', rough: 0.8, tile: 1 },
  lampPost: { color: '#3E6E78', rough: 0.5, metal: 0.4, tile: 1 },
  lampGlobe: { color: '#F6F1E4', rough: 0.4, emissive: '#FFF3D6', emissivePower: 0.3, tile: 1 },
  pier: { color: '#EEE7D9', rough: 0.85, grain: 'plaster', amp: 0.1, tile: 2 },
  pierRoof: { color: '#A3492F', rough: 0.8, tile: 1 },
  pierGlass: { color: '#2E3A44', rough: 0.3, metal: 0.2, tile: 1 },
  cloud: { color: '#FFFFFF', rough: 1, unlit: true, tile: 1, fog: false },
  carRed: { color: '#B9282A', rough: 0.4, metal: 0.3, clearcoat: 1, clearcoatRough: 0.08, tile: 1 },
  carSilver: { color: '#C7CACF', rough: 0.4, metal: 0.6, clearcoat: 1, clearcoatRough: 0.08, tile: 1 },
  carWhite: { color: '#E9EAE8', rough: 0.45, metal: 0.2, clearcoat: 1, clearcoatRough: 0.08, tile: 1 },
  carGlass: { color: '#1E2A36', rough: 0.1, metal: 0.3, vary: 0, tile: 1 },
  tyre: { color: '#17181A', rough: 0.9, tile: 1 },
  badgeCard: { color: '#F4F4F2', rough: 0.6, tile: 1 },
  lanyardGreen: { color: '#34A853', rough: 0.8, tile: 1 },
  hull: { color: '#17282F', rough: 0.5, tile: 1 },
  mast: { color: '#8B6B4A', rough: 0.6, tile: 1 },
  sail: { color: '#F2EFE6', rough: 0.6, tile: 1 },
  frameBlack: { color: '#1A1A1A', rough: 0.5, tile: 1 },
  frameWood: { color: '#5C4033', rough: 0.6, tile: 1 },
  rod: { color: '#8A6E4E', rough: 0.5, metal: 0.2, tile: 1 },
  // 2020, the Delhi room at night: a pale wall gone grey in lamp light, a cheap wide desk, cardboard, paper, cloth
  delhiWall: { color: '#D9CDB8', rough: 0.92, tex: 'plastered_wall_04', amp: 0.35, tile: 3.2 },
  delhiCeiling: { color: '#D8D2C6', rough: 0.95, tile: 1 },
  deskLaminate: { color: '#B99A72', rough: 0.55, tex: 'oak_veneer_01', amp: 0.4, clearcoat: 0.25, clearcoatRough: 0.3, tile: 1.83 },
  bracket: { color: '#2A2A2E', rough: 0.5, metal: 0.6, tile: 1 },
  cardboard: { color: '#B58B5A', rough: 0.95, grain: 'weave', amp: 0.1, tile: 0.4 },
  paper: { color: '#F2EFE8', rough: 0.85, tile: 1 },
  cloth0: { color: '#8A2E2E', rough: 0.95, grain: 'weave', amp: 0.2, tile: 0.12 }, cloth1: { color: '#3B4A6B', rough: 0.95, grain: 'weave', amp: 0.2, tile: 0.12 },
  cloth2: { color: '#E8E2D2', rough: 0.95, grain: 'weave', amp: 0.2, tile: 0.12 }, cloth3: { color: '#4A4A4E', rough: 0.95, grain: 'weave', amp: 0.2, tile: 0.12 },
  plaqueWood: { color: '#3E2A1E', rough: 0.45, clearcoat: 0.4, clearcoatRough: 0.2, tile: 1 },
  plaquePlate: { color: '#D9C58A', rough: 0.3, metal: 0.9, tile: 1 },
  silver: { color: '#D8DADF', rough: 0.25, metal: 1, tile: 1 },
  acrylic: { color: '#DCE6F0', rough: 0.05, clearcoat: 1, clearcoatRough: 0.03, tile: 1 },
  ribbon: { color: '#1F3F8F', rough: 0.9, grain: 'weave', amp: 0.2, tile: 0.1 },
  binPlastic: { color: '#2E3138', rough: 0.55, clearcoat: 0.2, tile: 1 },
  cable: { color: '#111214', rough: 0.6, tile: 1 },
};

export const mat = (name: string): Mat => {
  const m = MATS[name];
  if (!m) throw new Error(`no material ${name}`);
  return m;
};
